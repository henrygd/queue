/**
 * This version of `@henrygd/queue` supports rate limiting.
 *
 * @module
 */
/** Queue interface */
export interface Queue {
    /** Add an async function / promise wrapper to the queue */
    add<T>(promiseFunction: () => PromiseLike<T>): Promise<T>;
    /** Returns a promise that resolves when the queue is empty */
    done(): Promise<void>;
    /** Empties the queue (active promises are not cancelled) */
    clear(): void;
    /** Returns the number of promises currently running */
    active(): number;
    /** Returns the total number of promises in the queue */
    size(): number;
    /** Adds promises (or wrappers) to the queue and resolves like Promise.all */
    all<T>(promiseFunctions: Array<PromiseLike<T> | (() => PromiseLike<T>)>): Promise<T[]>;
}
/**
 * Creates a new queue with concurrency and optional rate limiting.
 *
 * @param {number} concurrency - The maximum number of concurrent operations.
 * @param {number} [rate] - The maximum number of operations that can start within the interval.
 * @param {number} [interval] - The time window in milliseconds for rate limiting.
 * @return {Queue} - The newly created queue.
 */
export declare let newQueue: (concurrency: number, rate?: number, interval?: number) => Queue;
