import { FactoryProvider, ModuleMetadata, Type } from '@nestjs/common';
import {
  ClusterNode,
  ClusterOptions,
  RedisOptions as IORedisOptions,
} from 'ioredis';

export type RedisOptions = Omit<
  IORedisOptions,
  'connectionName' | 'enableReadyCheck'
>;

export type RedisClusterOptions = {
  startupNodes: ClusterNode[];
  options?: Omit<ClusterOptions, 'redisOptions' | 'clusterRetryStrategy'> & {
    redisOptions?: Omit<ClusterOptions['redisOptions'], 'connectionName'>;
  };
};

export type RedisSourceOptions =
  | ({ type?: 'default' } & RedisOptions)
  | ({ type: 'cluster' } & RedisClusterOptions);

export type ModuleOptions = {
  connectionName?: string;

  /**
   * Number of times to retry connecting
   * Default: 10
   */
  retryAttempts?: number;

  /**
   * Delay between connection retry attempts (ms)
   * Default: 3000
   */
  retryDelay?: number;

  /**
   * Function that will be invoked on each connection retry in ioredis `retryStrategy`
   */
  onRetry?: (times: number) => void;

  /**
   * If `true`, will show verbose error messages on each connection retry.
   */
  verboseRetryLog?: boolean;
};

export type RedisModuleOptions = ModuleOptions & RedisSourceOptions;

export interface RedisOptionsFactory {
  createRedisOptions(): Promise<RedisModuleOptions> | RedisModuleOptions;
}

export type RedisModuleFactoryOptions = Omit<
  RedisModuleOptions,
  'connectionName' | 'type'
> &
  RedisSourceOptions;

export interface RedisModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  type?: RedisSourceOptions['type'];
  connectionName?: string;

  /**
   * Existing Provider to be used.
   */
  useExisting?: Type<RedisOptionsFactory>;

  /**
   * Type (class name) of provider (instance to be registered and injected).
   */
  useClass?: Type<RedisOptionsFactory>;

  /**
   * Factory function that returns an instance of the provider to be injected.
   */
  useFactory?: (
    ...args: any[]
  ) => Promise<RedisModuleFactoryOptions> | RedisModuleFactoryOptions;

  /**
   * Optional list of providers to be injected into the context of the Factory function.
   */
  inject?: FactoryProvider['inject'];
}
