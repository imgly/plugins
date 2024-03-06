export declare class Subscribable<E, D> {
    #private;
    subscribe(toEvent: E, callback: (label: D) => void | Promise<void>): () => void;
    notify(event: E, data: D): Promise<void>;
}
