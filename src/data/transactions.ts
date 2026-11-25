import type { IDBPTransaction, StoreNames } from 'idb';
import type { RcrDB, RcrSchema } from './db';

export type RcrTx<S extends StoreNames<RcrSchema>[]> = IDBPTransaction<RcrSchema, S, 'readwrite'>;

/**
 * Runs `work` inside ONE read-write transaction spanning `stores`.
 * Either every write commits, or — if `work` throws or any request fails —
 * the transaction is aborted and nothing is changed.
 */
export async function runAtomic<S extends StoreNames<RcrSchema>[], R>(
  db: RcrDB,
  stores: S,
  work: (tx: RcrTx<S>) => Promise<R>,
): Promise<R> {
  const tx = db.transaction(stores, 'readwrite');
  try {
    const result = await work(tx);
    await tx.done;
    return result;
  } catch (error) {
    try {
      tx.abort();
    } catch {
      // Already aborted or finished with an error — nothing was committed.
    }
    await tx.done.catch(() => undefined);
    throw error;
  }
}
