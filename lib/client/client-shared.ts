import { Callback, RedisCommander } from 'ioredis';
import { Transaction } from 'ioredis/built/transaction';
import { noop } from '../common';

interface Commander extends RedisCommander, Transaction {}

export async function get<T>(
  key: string,
  client: Commander,
  callback?: Callback<string | null>,
) {
  const cb = callback ?? noop;
  const value = await client.get(key, cb);

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

  const callback = args.callback ?? noop;

  if (args.ttl === undefined) {
    return client.set(args.key, value, callback);
  }

  return client.set(args.key, value, 'PX', args.ttl, callback);
}

export async function mget<T extends Record<string, unknown>>(
  keys: (keyof T)[],
  client: Commander,
  callback?: Callback<(string | null)[]>,
) {
  const cb = callback ?? noop;
  const values = await client.mget(keys as string[], cb);

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
  const callback = args.callback ?? noop;
  const execCallback = args.execCallback ?? noop;

  Object.entries(args.pairs).forEach(([key, value]) => {
    if (args.ttl === undefined) {
      multi.set(key, JSON.stringify(value), callback);
      return;
    }

    multi.set(key, JSON.stringify(value), 'PX', args.ttl, callback);
  });

  return multi.exec(execCallback);
}

export function del(
  keys: string[],
  client: Commander,
  callback?: Callback<number>,
) {
  return client.del(keys, callback ?? noop);
}

export async function checkHealth(client: Commander) {
  const response = await client.ping();
  return response === 'PONG';
}
