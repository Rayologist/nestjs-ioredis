import RedisClient, { Callback } from 'ioredis';
import { checkHealth, del, get, mget, mset, set } from './client-shared';

export class Redis {
  private _client: RedisClient;

  constructor(client: RedisClient) {
    this._client = client;
  }

  get<T>(key: string, callback?: Callback<string | null>) {
    return get<T>(key, this._client, callback);
  }

  set<T>(args: {
    key: string;
    value: T;
    ttl?: number;
    callback?: Callback<'OK'>;
  }) {
    return set(args, this._client);
  }

  mget<T extends Record<string, unknown>>(
    keys: (keyof T)[],
    callback?: Callback<(string | null)[]>,
  ) {
    return mget<T>(keys, this._client, callback);
  }

  mset<T extends Record<string, unknown>>(args: {
    pairs: T;
    ttl?: number;
    callback?: Callback<'OK'>;
    execCallback?: Callback<[error: Error | null, result: unknown][] | null>;
  }) {
    return mset<T>(args, this._client);
  }

  del(keys: string[], callback?: Callback<number>) {
    return del(keys, this._client, callback);
  }

  checkHealth() {
    return checkHealth(this._client);
  }

  get client() {
    return this._client;
  }
}
