export declare class Subscribable<E, D> {
    #private;
    subscribe(toEvent: E, callback: (label: D) => void): () => void;
    notify(event: E, data: D): void;
}
