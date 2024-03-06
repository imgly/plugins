
export class Subscribable<E, D> {
    #subscribers: Array<{ filter: E[], callback: (event: D) => void | Promise<void> }> = []
    
    subscribe(toEvent: E, callback: (label: D) => void | Promise<void>): () => void {
        const entry = { filter: [toEvent], callback }
        this.#subscribers.push(entry);
        return () => {
            const idx = this.#subscribers.indexOf(entry);
            if (idx > -1) {
                this.#subscribers.splice(idx, 1);
            }
        }
    }

    async notify(event: E, data: D) {
        this.#subscribers.forEach(async ({ filter, callback }) => {
            if (filter.includes(event)) {
                await callback(data);
            }
        })
    }

}