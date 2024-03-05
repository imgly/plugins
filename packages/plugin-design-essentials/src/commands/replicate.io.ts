import { PluginContext } from "@imgly/plugin-core";

// TODOS
// https://replicate.com/stability-ai/stable-diffusion-img2img?prediction=63trbdrbookprhnq3eoap6iwz4
// https://replicate.com/pharmapsychotic/clip-interrogator
// https://replicate.com/batouresearch/high-resolution-controlnet-tile/examples#jq5gj2dbjg6j6l3ih7hf3jfuoa

// https://replicate.com/mistralai/mixtral-8x7b-instruct-v0.1
const REPLICATE_API_TOKEN = "r8_Y7Qt7U8vkF8QBVDJ9RvWTQNuebwVLBp2qvvBT"


const REPLICATE_HEADERS = {
    "Content-Type": 'application/json',
    "Authorization": `Token ${REPLICATE_API_TOKEN}`
}

const proxyForCors = (url: string) => 'https://corsproxy.io/?' + encodeURIComponent(url);

const MODELS = {
    "face2sticker": {
        version: "764d4827ea159608a07cdde8ddf1c6000019627515eb02b6b449695fd547e5ef",
        input: (iInput) => ({
            "steps": 20,
            "width": 1024,
            "height": 1024,
            "upscale": false,
            "upscale_steps": 10,
            "negative_prompt": "",
            "prompt_strength": 4.5,
            "ip_adapter_noise": 0.5,
            "ip_adapter_weight": 0.2,
            "instant_id_strength": 0.7,
            ...iInput
        })
    },
    "sdxl": {
        version: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        input: (iInput) => ({
            "width": 1024,
            "height": 1024,
            "refine": "expert_ensemble_refiner",
            "scheduler": "K_EULER",
            "num_outputs": 1,
            "lora_scale": 0.6,
            "guidance_scale": 7.5,
            "apply_watermark": false,
            "high_noise_frac": 0.8,
            "negative_prompt": "",
            "prompt_strength": 0.8,
            "num_inference_steps": 25,
            ...iInput
        })
    },
    "playgroundai/playground-v2-1024px-aesthetic": {
        version: "42fe626e41cc811eaf02c94b892774839268ce1994ea778eba97103fe1ef51b8",
        input: (iInput) => ({
            width: 1024,
            height: 1024,
            scheduler: "K_EULER_ANCESTRAL",
            guidance_scale: 3,
            apply_watermark: false,
            negative_prompt: "",
            num_inference_steps: 50,
            ...iInput
        })

    }
}

export const replicateSDXL = async (ctx: PluginContext, params: { blockIds?: number[]; }) => {
    const { block } = ctx.engine;
    let {
        blockIds = block.findAllSelected()
    } = params;
    const isGroup = (blockIds.length === 1 && block.getType(blockIds[0]) === '//ly.img.ubq/group');
    blockIds = isGroup ? block.getChildren(blockIds[0]) : blockIds;

    const iIds = blockIds.filter((id: number) => {
        if (!block.hasFill(id)) return false
        const fId = block.getFill(id)
        if (!block.isValid(fId)) return false
        const fType = block.getType(fId)
        return fType === "//ly.img.ubq/fill/image"
    })

    const fIds = iIds.map((id: number) => [id, block.getFill(id)])
    fIds.forEach(async ([bId, fId]) => {
        // fake busy
        //enssure we have preview
        const imageFillUri = block.getString(fId, 'fill/image/imageFileURI');
        const name = block.getName(bId)
        block.setString(fId, 'fill/image/previewFileURI', block.getString(fId, 'fill/image/previewFileURI') ?? block.getString(fId, 'fill/image/imageFileURI'));
        block.setString(fId, 'fill/image/imageFileURI', '');
        block.setSourceSet(fId, 'fill/image/sourceSet', []);


        const iPrompt = (name.length === 0) ? prompt("Enter a prompt", name) : name
        const iImage = imageFillUri
        const iMask = undefined


        if (!name) block.setName(bId, iPrompt)
        // const model = "playgroundai/playground-v2-1024px-aesthetic"
        const model = "sdxl"
        // const model = "face2sticker"
        const replicateIoVersion = MODELS[model].version
        const replicateIoinput = MODELS[model].input({ prompt: iPrompt, mask: iMask, image: iImage })
        const images = await callReplicateIo(replicateIoVersion, replicateIoinput)

        const image = images[0] // for now we assume one image but we could gather multiple in batch
        block.setString(fId, 'fill/image/imageFileURI', image);
        block.setSourceSet(fId, 'fill/image/sourceSet', []);
    })

}



const callReplicateIo = async (version: string, input: any) => {
    const data = {
        version,
        input
    }

    const url = proxyForCors("https://api.replicate.com/v1/predictions")
    const res = await fetch(url, {
        method: 'POST',
        // mode: "no-cors",
        headers: REPLICATE_HEADERS,
        body: JSON.stringify(data)
    })


    const json = await res.json()
    return await waitForReplicate(json)
}

const waitForReplicate = async (json: any): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        const interval = 1000
        const timeout = setInterval(async () => {
            // console.log("Checking status")
            const url = proxyForCors(json.urls.get)
            const statusRes = await fetch(url, { headers: REPLICATE_HEADERS })
            const statusJson = await statusRes.json()
            console.log(statusJson)
            if (statusJson.error) {
                clearInterval(timeout)
                reject(statusJson.error)
            }
            if (statusJson.status === "succeeded") {
                clearInterval(timeout)
                const { output } = statusJson
                resolve(output?.map((o: string) => proxyForCors(o)))
                
            }
        }, interval)
    })
}