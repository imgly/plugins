import { Context } from "@imgly/plugin-core";
import { DesignDocument, MessageBody, eventCallback } from './shared'

import { design } from "./worker"


const workers = []

export const documentWorkerChangeValue = async (ctx: Context, params: { blockIds?: number[] }) => {
    if (workers.length === 0) return
    const idx  = Math.round(Math.random() * (workers.length-1))
    
    // console.log(idx, workers)
    const iPrompt = prompt("Enter a value", `${42}`)
    const data = parseFloat(iPrompt) || Math.random
    workers[idx].postMessage({ method: "changeValue", data: data } )
}

// This is currently n to n
// Better would be 1 - n where the main state is in the main thread and the workers 
export const documentWorkerDemo = async (ctx: Context, params: { blockIds?: number[] }) => {

    console.log("Running worker")
    for (let i = 0; i < 2; i++) {
        const worker = new Worker(new URL('./worker', import.meta.url), { type: 'module' });
        workers.push(worker)
    }
    setInterval(() => {
        workers.forEach(w => w.postMessage({ method: "print" } as MessageBody))
    }, 1000)



    workers.forEach(w =>
        w.onmessage = async (e: MessageEvent<MessageBody>) => {
            const others = workers.filter(w => w != e.target)
            const msg = e.data

            switch (msg.method) {
                case "init": {
                    others.forEach(o => o.postMessage({ method: "requestStateVector", data: new Uint8Array() } as MessageBody))
                    break;
                }
                case "didUpdate": {
                    others.forEach(o => o.postMessage({ method: "requestStateVector", data: new Uint8Array() } as MessageBody))
                    break;
                }
                case "replyStateVector": {
                    others.forEach(o => o.postMessage({ method: "requestUpdate", data: msg.data } as MessageBody))
                    break;
                }
                case "replyUpdate": {
                    others.forEach(o => o.postMessage({ method: "updateState", data: msg.data } as MessageBody))
                    break;
                }
            }
        }

    )



}


export const documentDemo = async (ctx: Context, params: { blockIds?: number[] }) => {
    const design = new DesignDocument()
    const design2 = new DesignDocument()

    {
        console.log(design.doc.meta, design2.doc.meta)
        const hash = await design.hash()
        const hash2 = await design2.hash()
        console.log(hash, hash2)
    }

    //    sync https://docs.yjs.dev/api/document-updates
    design.doc.on('update', (update, origin, doc) => {
        design2.updateStateFrom(design)
    })

    design2.doc.on('update', (update, origin, doc) => {
        design.updateStateFrom(design2)

    })



    design.properties.observeDeep(eventCallback)
    design2.properties.observeDeep(eventCallback)

    design.opacity = 0.5
    design2.opacity = 0.95

    console.log(design.opacity)
    console.log(design2.opacity)

    console.log(await design.hash(), await design2.hash())
}

