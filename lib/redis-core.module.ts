import {
  DynamicModule,
  Global,
  Inject,
  Module,
  OnApplicationShutdown,
  Provider,
} from '@nestjs/common';
import { Redis, RedisCluster } from './common';
import {
  RedisModuleAsyncOptions,
  RedisModuleFactoryOptions,
  RedisModuleOptions,
  RedisOptionsFactory,
} from './interfaces/redis-options.interface';
import { REDIS_CONNECTION_NAME, REDIS_MODULE_OPTIONS } from './redis.constants';
import { ModuleRef } from '@nestjs/core';
import { ConnectionTokenFactory } from './factories/connection-token.factory';
import { ConnectionFactory } from './factories/connection.factory';

@Global()
@Module({})
export class RedisCoreModule implements OnApplicationShutdown {
  constructor(
    @Inject(REDIS_CONNECTION_NAME) private readonly connectionName: string,
    private readonly moduleRef: ModuleRef,
  ) {}

  static forRoot(options: RedisModuleOptions = {}): DynamicModule {
    const {
      retryAttempts,
      retryDelay,
      connectionName,
      type,
      onRetry,
      ...redisOptions
    } = options;

    const redisConnectionName = ConnectionTokenFactory.generate(
      type,
      connectionName,
    );

    const connectionNameProvider = {
      provide: REDIS_CONNECTION_NAME,
      useValue: redisConnectionName,
    };

    const connectionProvider = {
      provide: redisConnectionName,
      useFactory: () => {
        return ConnectionFactory.create({
          connectionName: redisConnectionName,
          retryAttempts,
          retryDelay,
          onRetry,
          ...redisOptions,
        });
      },
    };

    return {
      module: RedisCoreModule,
      providers: [connectionProvider, connectionNameProvider],
      exports: [connectionProvider],
    };
  }

  static forRootAsync(options: RedisModuleAsyncOptions): DynamicModule {
    const { connectionName, type } = options;

    const redisConnectionName = ConnectionTokenFactory.generate(
      type,
      connectionName,
    );

    const connectionNameProvider = {
      provide: REDIS_CONNECTION_NAME,
      useValue: redisConnectionName,
    };

    const connectionProvider = {
      provide: redisConnectionName,
      useFactory: (redisModuleOptions: RedisModuleFactoryOptions) => {
        const { retryAttempts, retryDelay, onRetry, ...redisOptions } =
          redisModuleOptions;
        return ConnectionFactory.create({
          connectionName: redisConnectionName,
          retryAttempts,
          retryDelay,
          onRetry,
          ...redisOptions,
        });
      },
      inject: [REDIS_MODULE_OPTIONS],
    };

    const asyncProviders = this.createAsyncProviders(options);

    return {
      module: RedisCoreModule,
      imports: options.imports,
      providers: [
        ...asyncProviders,
        connectionProvider,
        connectionNameProvider,
      ],
      exports: [connectionProvider],
    };
  }

  private static createAsyncProviders(
    options: RedisModuleAsyncOptions,
  ): Provider[] {
    if (options.useFactory) {
      return [
        {
          provide: REDIS_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
      ];
    }

    const useRedisOptionsFactory = (optionsFactory: RedisOptionsFactory) =>
      optionsFactory.createRedisOptions();

    if (options.useExisting) {
      return [
        {
          provide: REDIS_MODULE_OPTIONS,
          useFactory: useRedisOptionsFactory,
          inject: [options.useExisting],
        },
      ];
    }

    if (options.useClass) {
      return [
        {
          provide: REDIS_MODULE_OPTIONS,
          useFactory: useRedisOptionsFactory,
          inject: [options.useClass],
        },
        options.useClass,
      ];
    }

    return [];
  }

  async onApplicationShutdown() {
    const redis = this.moduleRef.get<Redis | RedisCluster>(this.connectionName);
    if (redis) {
      await redis.client.quit();
    }
  }
}
