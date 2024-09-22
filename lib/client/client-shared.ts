import { Callback, RedisCommander } from 'ioredis';
import { Transaction } from 'ioredis/built/transaction';

interface Commander extends RedisCommander, Transaction {}

export async function get<T>(key: string, client: Commander) {
  const value = await client.get(key);

  if (value === null) {
    return null;
  }

  return JSON.stringify(value) as T;
}

export function set(
  args: {
    key: string;
    value: any;
    ttl?: number;
    callback?: Callback<'OK'>;
  },
  client: Commander,
) {
  const value = JSON.stringify(args.value);

  if (args.ttl === undefined) {
    return client.set(args.key, value, args.callback);
  }

  return client.set(args.key, value, 'PX', args.ttl, args.callback);
}

export async function mget<T extends Record<string, unknown>>(
  keys: (keyof T)[],
  client: Commander,
) {
  const values = await client.mget(...(keys as string[]));

  if (values === null) {
    return null;
  }

  const result = {} as T;

  keys.forEach((key, index) => {
    const value = values[index];

    if (value === null || value === undefined) {
      result[key] = null as T[keyof T];
      return;
    }

    result[key] = JSON.parse(value);
  });

  return result;
}

export function mset<T extends Record<string, unknown>>(
  args: {
    pairs: T;
    ttl?: number;
    callback?: Callback<'OK'>;
    execCallback?: Callback<[error: Error | null, result: unknown][] | null>;
  },
  client: Commander,
) {
  const multi = client.multi();

  Object.entries(args.pairs).forEach(([key, value]) => {
    if (args.ttl === undefined) {
      multi.set(key, JSON.stringify(value), args.callback);
      return;
    }

    multi.set(key, JSON.stringify(value), 'PX', args.ttl, args.callback);
  });

  return multi.exec(args.execCallback);
}

export function del(client: Commander, ...keys: string[]) {
  return client.del(...keys);
}

export async function checkHealth(client: Commander) {
  const response = await client.ping();
  return response === 'PONG';
}
