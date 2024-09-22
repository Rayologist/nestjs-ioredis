import { Inject } from '@nestjs/common';
import { getClusterConnectionToken, getConnectionToken } from './redis.utils';

export function InjectRedis(connectionName?: string) {
  return Inject(getConnectionToken(connectionName));
}

export function InjectCluster(connectionName?: string) {
  return Inject(getClusterConnectionToken(connectionName));
}
