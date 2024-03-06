import { PluginContext } from "@imgly/plugin-core";

import { isEqual } from 'lodash'

import * as Y from 'yjs'

const documents = new Map<string, Y.Doc>()

type YJson = Y.Map<any>

class Transform extends Y.Map<any> {
    set x(value: number) {
        this.set("x", value)
    }

    set y(value: number) {
        this.set("y", value)
    }
}


class DesignDocument {
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

export const documentDemo = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const design = new DesignDocument()
    const design2 = new DesignDocument()

    {
        console.log(design.doc.meta, design2.doc.meta)
        const hash = await sha256(Y.encodeStateVector(design.doc))
        const hash2 = await sha256(Y.encodeStateVector(design2.doc))
        console.log(hash, hash2)

    }

 
    //    sync https://docs.yjs.dev/api/document-updates
    design.doc.on('update', (update, origin, doc) => {
        // call get state vector from others
        const stateVector2 = Y.encodeStateVector(design2.doc)
        const hash = sha256(stateVector2)
        // encode state as update
        const diff12 = Y.encodeStateAsUpdate(design.doc, stateVector2)
        // send to other and apply
        Y.applyUpdate(design2.doc, diff12)
    })

    design2.doc.on('update', (update, origin, doc) => {
        const stateVector1 = Y.encodeStateVector(design.doc)
        const diff21 = Y.encodeStateAsUpdate(design2.doc, stateVector1)
        Y.applyUpdate(design.doc, diff21)
    })



    const eventCallback = (events, transaction) => {
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
                    console.log(event.target.doc.guid, fullPath.join("."), oldValue, newValue)
                }
            })


        })
    }
    design.properties.observeDeep(eventCallback)
    design2.properties.observeDeep(eventCallback)

    design.opacity = 0.5
    design2.opacity = 0.95

    console.log(design.opacity)
    console.log(design2.opacity)

    const hash = await sha256(Y.encodeStateVector(design.doc))
    const hash2 = await sha256(Y.encodeStateVector(design2.doc))
    console.log(hash, hash2)
}


async function sha256(data: Uint8Array) {
    const hash = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}