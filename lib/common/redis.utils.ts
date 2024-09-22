import { Logger } from '@nestjs/common';
import {
  ModuleOptions,
  RedisClusterOptions,
  RedisOptions,
} from '../interfaces';
import {
  DEFAULT_REDIS_CONNECTION,
  DEFAULT_REDIS_CLUSTER_CONNECTION,
} from '../redis.constants';
import IORedis from 'ioredis';
import { Redis } from '../client/client-redis';
import { RedisCluster } from '../client/client-cluster';

export function getConnectionToken(name?: string) {
  if (!name || name === DEFAULT_REDIS_CONNECTION) {
    return DEFAULT_REDIS_CONNECTION;
  }

  return `${name}RedisConnection`;
}

export function getClusterConnectionToken(name?: string) {
  if (!name || name === DEFAULT_REDIS_CLUSTER_CONNECTION) {
    return DEFAULT_REDIS_CLUSTER_CONNECTION;
  }

  return `${name}ClusterConnection`;
}

export function createRetryStrategy(
  retryAttempts: number,
  retryDelay: number,
  onRetry?: (times: number) => void,
) {
  return (times: number) => {
    if (times > retryAttempts) {
      return null;
    }

    onRetry?.(times);

    return retryDelay;
  };
}

export function createRedis(options: ModuleOptions & RedisOptions) {
  const {
    retryAttempts = 10,
    retryDelay = 3000,
    verboseRetryLog = false,
    onRetry = noop,
    connectionName,
    ...rest
  } = options;

  const logger = new Logger('RedisModule');

  const client = new IORedis({
    ...rest,
    connectionName,
    enableReadyCheck: true,
    retryStrategy: createRetryStrategy(retryAttempts, retryDelay, onRetry),
    sentinelRetryStrategy: createRetryStrategy(
      retryAttempts,
      retryDelay,
      onRetry,
    ),
  });

  const redis = new Redis(client);

  return new Promise<Redis>((resolve, reject) => {
    let reconnected = 0;

    const reconnectHandler = () => {
      reconnected++;
    };

    const readyHandler = () => {
      cleanup();
      resolve(redis);
    };

    const errorHandler = (error: Error) => {
      if (error.message.includes('ECONNREFUSED')) {
        if (reconnected >= retryAttempts) {
          cleanup();
          reject(error);
        }

        const connectionToken =
          connectionName === DEFAULT_REDIS_CONNECTION
            ? ''
            : ` (${connectionName})`;

        const verboseMessage = verboseRetryLog
          ? ` Message: ${error.message}.`
          : '';

        logger.error(
          `Unable to connect to the database${connectionToken}.${verboseMessage} Retrying (${reconnected})...`,
        );
      }
    };

    const cleanup = () => {
      client.off('ready', readyHandler);
      client.off('error', errorHandler);
      client.off('reconnecting', reconnectHandler);
    };

    client.once('ready', readyHandler);
    client.on('error', errorHandler);
    client.on('reconnecting', reconnectHandler);
  });
}

export function createCluster(options: ModuleOptions & RedisClusterOptions) {
  const {
    retryAttempts = 10,
    retryDelay = 3000,
    verboseRetryLog = false,
    connectionName,
    onRetry = noop,
    startupNodes,
    options: clusterOptions,
  } = options;

  const logger = new Logger('RedisModule');

  const client = new IORedis.Cluster(startupNodes, {
    ...clusterOptions,
    enableReadyCheck: true,
    clusterRetryStrategy: createRetryStrategy(
      retryAttempts,
      retryDelay,
      onRetry,
    ),
    redisOptions: { connectionName },
  });

  const cluster = new RedisCluster(client);

  return new Promise<RedisCluster>((resolve, reject) => {
    let reconnected = 0;

    const reconnectHandler = () => {
      reconnected++;
    };

    const readyHandler = () => {
      cleanup();
      resolve(cluster);
    };

    const errorHandler = (error: Error) => {
      if (error.message.includes('ECONNREFUSED')) {
        if (reconnected >= retryAttempts) {
          cleanup();
          reject(error);
        }

        const connectionToken =
          connectionName === DEFAULT_REDIS_CONNECTION
            ? ''
            : ` (${connectionName})`;

        const verboseMessage = verboseRetryLog
          ? ` Message: ${error.message}.`
          : '';

        logger.error(
          `Unable to connect to the database${connectionToken}.${verboseMessage} Retrying (${reconnected})...`,
        );
      }
    };

    const cleanup = () => {
      client.off('ready', readyHandler);
      client.off('error', errorHandler);
      client.off('reconnecting', reconnectHandler);
    };

    client.once('ready', readyHandler);
    client.on('error', errorHandler);
    client.on('reconnecting', reconnectHandler);
  });
}

export function noop() {
  return;
}
