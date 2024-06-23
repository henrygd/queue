/** Queue interface */
interface Queue {
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
}
/**
 * Creates a new queue with the specified concurrency level.
 *
 * @param {number} concurrency - The maximum number of concurrent operations.
 * @return {Queue} - The newly created queue.
 */
export declare let newQueue: (concurrency: number) => Queue;
export {};
