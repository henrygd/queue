export declare let newQueue: (concurrency: number) => {
    add<T>(p: () => Promise<T>): Promise<T>;
};
