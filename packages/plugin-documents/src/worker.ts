import { DesignDocument, MessageBody, eventCallback } from './shared'


export const design = new DesignDocument()
design.doc.on('update', (update, origin, doc) => {
    postMessage({ method: "didUpdate", uuid: design.doc.guid })
    console.log("update", design.doc.guid)
})


self.onmessage = async function (e: MessageEvent<MessageBody>) {
    const msg = e.data
    switch (msg.method) {
        case "requestStateVector": {
            postMessage({ method: "replyStateVector", data: design.stateVector })
            break;
        }
        case "requestUpdate": {
            postMessage({ method: "replyUpdate", data: design.encodeStateAsUpdate(msg.data as Uint8Array) })
            break;
        }
        case "updateState": {
            design.updateState(msg.data as Uint8Array)
            break;
        }
        case "print": {
            console.log("print", design.doc.guid, design.opacity)
            break;
        }
        case "changeValue": {
            design.opacity = msg.data as number
            console.log("changeValue", design.doc.guid, design.opacity)
            
            break;
        }
    }
}

// requestAnimationFrame(() => {
//     design.opacity = Math.random()
// })
