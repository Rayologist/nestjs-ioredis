import { Module } from '@nestjs/common';
import { RedisModuleAsyncOptions, RedisModuleOptions } from './interfaces';
import { RedisCoreModule } from './redis-core.module';

@Module({})
export class RedisModule {
  static forRoot(options?: RedisModuleOptions) {
    return {
      module: RedisModule,
      imports: [RedisCoreModule.forRoot(options)],
    };
  }

  static forRootAsync(options: RedisModuleAsyncOptions) {
    return {
      module: RedisModule,
      imports: [RedisCoreModule.forRootAsync(options)],
    };
  }
}
