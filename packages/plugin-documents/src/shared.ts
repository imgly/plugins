import * as Y from 'yjs'
import {isEqual } from 'lodash'

export type MessageBody = {
    data: Uint8Array | number
    method: "init" | "didUpdate"| "requestStateVector" |  "replyStateVector"  | "requestUpdate" | "replyUpdate" | "updateState" | "print" | "changeValue"
}


export type YJson = Y.Map<any>

export class Transform extends Y.Map<any> {
    set x(value: number) {
        this.set("x", value)
    }

    set y(value: number) {
        this.set("y", value)
    }
}


export class DesignDocument {
    doc: Y.Doc;

    properties: YJson;

    // shape
    // stroke
    // style 
    attachments: Blob[] // images, files, etc


    constructor() {
        this.doc = new Y.Doc({
            meta: {
                "content-type": "application/json"
            }
        })
        this.properties = this.doc.getMap('properties');
        this.properties.set("transform", new Transform())
        this.opacity = 1
        console.log("guid", this.doc.guid)
    }
 
    get stateVector() {
        return Y.encodeStateVector(this.doc)
    }
    updateState(update: Uint8Array) {
        Y.applyUpdate(this.doc, update)
    }

    encodeStateAsUpdate(stateVector: Uint8Array) {
        return Y.encodeStateAsUpdate(this.doc, stateVector)
    }
    updateStateFrom(design: DesignDocument) {
        this.updateState(design.encodeStateAsUpdate(this.stateVector))
    }

    async hash() {
        return await sha256(this.stateVector)
    }


    transact(fn: () => void) {
        this.doc.transact(fn)
    }

    set opacity(value: number) {
        // if (this.opacity === value) return
        this.properties.set("opacity", value)
    }

    // getter
    get opacity(): number | undefined {
        return this.properties.get("opacity")
    }

    get transform(): Transform | undefined {
        return this.properties.get("transform")
    }

    set transform(value: { x?: number, y?: number }) {
        value.x && (this.transform.x = value.x)
        value.y && (this.transform.y = value.y)
    }
}



async function sha256(data: Uint8Array) {
    const hash = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}


export const eventCallback = (events, transaction) => {
    events.forEach((event: Y.YMapEvent<any>) => {
        const path = event.path
        event.keysChanged.forEach(key => {
            
            const newData = event.keys.get(key)
            const oldValue = newData?.oldValue
            const newValue = event.target.get(key)
            const hasChanged = !isEqual(oldValue, newValue)
            if (hasChanged) {
                const fullPath = new Array(path)
                fullPath.push(key)
                console.log(event.target.doc.guid, "local:", transaction.local, "path:",fullPath.join("."), oldValue, newValue)
            }
        })


    })
}