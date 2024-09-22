import { createCluster, createRedis } from '../common';
import { RedisModuleOptions } from '../interfaces';

export class ConnectionFactory {
  static create(options: RedisModuleOptions) {
    switch (options.type) {
      case 'cluster':
        return createCluster(options);
      default:
        return createRedis(options);
    }
  }
}
