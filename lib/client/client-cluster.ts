import { Cluster, Callback, NodeRole } from 'ioredis';
import { checkHealth, del, get, mget, mset, set } from './client-shared';
import { Redis } from './client-redis';

export class RedisCluster {
  private _client: Cluster;

  constructor(cluster: Cluster) {
    this._client = cluster;
  }

  get<T>(key: string) {
    return get<T>(key, this._client);
  }

  set(args: {
    key: string;
    value: any;
    ttl?: number;
    callback?: Callback<'OK'>;
  }) {
    return set(args, this._client);
  }

  mget<T extends Record<string, unknown>>(keys: (keyof T)[]) {
    return mget<T>(keys, this._client);
  }

  mset(args: {
    pairs: Record<string, unknown>;
    ttl?: number;
    callback?: Callback<'OK'>;
    execCallback?: Callback<[error: Error | null, result: unknown][] | null>;
  }) {
    return mset(args, this._client);
  }

  del(...keys: string[]) {
    return del(this._client, ...keys);
  }

  checkHealth() {
    return checkHealth(this._client);
  }

  nodes(role?: NodeRole) {
    return this._client.nodes(role).map((node) => new Redis(node));
  }

  get client() {
    return this._client;
  }
}
