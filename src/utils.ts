export function timeRoundToNearest1Minute(timestamp: number | string): number {
  const date = new Date(timestamp);
  const ms = 60000;
  return date.setTime(Math.floor(date.getTime() / ms) * ms);
}

export function groupBy<TKey extends keyof any, TValue, TItem = TValue>(
  arr: TItem[],
  keyName: ((item: TItem) => TKey) | keyof TItem,
): Map<TKey, TItem[]>;
export function groupBy<TKey extends keyof any, TValue, TItem = TValue>(
  arr: TItem[],
  keyName: ((item: TItem) => TKey) | keyof TItem,
  valueFunc?: (item: TItem) => TValue,
): Map<TKey, TValue[]>;
export function groupBy<TKey extends keyof any, TValue, TItem = TValue>(
  arr: TItem[],
  keyName: ((item: TItem) => TKey) | keyof TItem,
  valueFunc?: (item: TItem) => TValue,
  type?: 'map',
): Map<TKey, TValue[]>;
export function groupBy<TKey extends keyof any, TValue, TItem = TValue>(
  arr: TItem[],
  keyName: ((item: TItem) => TKey) | keyof TItem,
  valueFunc?: (item: TItem) => TValue,
  type?: 'record',
): { [k in TKey]?: TValue[] };
export function groupBy<TKey extends keyof any, TValue, TItem = TValue>(
  arr: TItem[],
  keyName: ((item: TItem) => TKey) | keyof TItem,
  valueFunc?: (item: TItem) => TValue,
  type: 'map' | 'record' = 'map',
): Map<TKey, TValue[]> | { [k in TKey]?: TValue[] } {
  const result = new Map<TKey, TValue[]>();
  for (const item of arr) {
    let key: TKey = undefined;
    if (typeof keyName === 'string') {
      key = <TKey>item[keyName];
    } else {
      key = <TKey>(<(item: TItem) => TKey>keyName)(item);
    }

    if (key === undefined) {
      throw new Error(`key ${keyName.toString()} can't be null`);
    }

    if (!result.has(key)) {
      result.set(key, []);
    }

    if (!item) {
      continue;
    }

    let val: TValue = undefined;
    if (valueFunc) {
      val = valueFunc(item);
    } else {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      val = <TValue>item;
    }

    result.get(key).push(val);
  }

  if (type === 'map') return result;

  const res: { [k in TKey]?: TValue[] } = {};
  for (const [k, v] of result.entries()) {
    res[k] = v;
  }
  return res;
}
