
export class Subscribable<E, D> {
    #subscribers: Array<{ filter: E[], callback: (event: D) => void }> = []
    
    subscribe(toEvent: E, callback: (label: D) => void): () => void {
        const entry = { filter: [toEvent], callback }
        this.#subscribers.push(entry);
        return () => {
            const idx = this.#subscribers.indexOf(entry);
            if (idx > -1) {
                this.#subscribers.splice(idx, 1);
            }
        }
    }

    notify(event: E, data: D) {
        this.#subscribers.forEach(({ filter, callback }) => {
            if (filter.includes(event)) {
                callback(data);
            }
        })
    }

}