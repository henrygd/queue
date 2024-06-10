/** Queue interface */
interface Queue {
    /** Add a promise / async function to the queue */
    add<T>(p: () => Promise<T>): Promise<T>;
}
/**
 * Creates a new queue with the specified concurrency level.
 *
 * @param {number} concurrency - The maximum number of concurrent operations.
 * @return {Queue} - The newly created queue.
 */
export declare let newQueue: (concurrency: number) => Queue;
export {};
