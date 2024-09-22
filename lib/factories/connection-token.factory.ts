import { getClusterConnectionToken, getConnectionToken } from '../common';
import { RedisSourceOptions } from '../interfaces';

export class ConnectionTokenFactory {
  static generate(type: RedisSourceOptions['type'], name?: string) {
    switch (type) {
      case 'cluster':
        return getClusterConnectionToken(name);
      default:
        return getConnectionToken(name);
    }
  }
}
