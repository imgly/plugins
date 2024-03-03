import { PluginContext } from "@imgly/plugin-core";
import { downloadBlob } from "../utils/download";


// https://replicate.com/stability-ai/stable-diffusion-img2img?prediction=63trbdrbookprhnq3eoap6iwz4
// https://replicate.com/pharmapsychotic/clip-interrogator




// https://replicate.com/mistralai/mixtral-8x7b-instruct-v0.1
const REPLICATE_API_TOKEN = "r8_Y7Qt7U8vkF8QBVDJ9RvWTQNuebwVLBp2qvvBT"


export const callReplicate = async (ctx: PluginContext, params: { blockIds?: number[]; }) => {
    const data = {
        "version": "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        "input": {
            "width": 768,
            "height": 768,
            "prompt": "An astronaut riding a rainbow unicorn, cinematic, dramatic",
            "refine": "expert_ensemble_refiner",
            "scheduler": "K_EULER",
            "lora_scale": 0.6,
            "num_outputs": 1,
            "guidance_scale": 7.5,
            "apply_watermark": false,
            "high_noise_frac": 0.8,
            "negative_prompt": "",
            "prompt_strength": 0.8,
            "num_inference_steps": 25
        }
    }



    const url = proxy("https://api.replicate.com/v1/predictions")
    const res = await fetch(url, {
        method: 'POST',
        // mode: "no-cors",
        headers,
        body: JSON.stringify(data)
    })


    const json = await res.json()

    const images = await waitForReplicate(json)

    images.forEach((image: Blob, index: number) => {
        const filename = `replicate-${index}.png`
        downloadBlob(image, filename)
    })

}

const headers = {
    "Content-Type": 'application/json',
    "Authorization": `Token ${REPLICATE_API_TOKEN}`
}

const proxy = (url: string) => 'https://corsproxy.io/?' + encodeURIComponent(url);

const waitForReplicate = async (json: any): Promise<Blob[]> => {
    return new Promise((resolve, reject) => {
        const interval = 1000
        const timeout = setInterval(async () => {
            // console.log("Checking status")
            const url = proxy(json.urls.get)
            const statusRes = await fetch(url, { headers })
            const statusJson = await statusRes.json()
            // console.log(statusJson)
            if (statusJson.error) {
                clearInterval(timeout)
                reject(statusJson.error)
            }
            if (statusJson.status === "succeeded") {
                clearInterval(timeout)
                // console.log("Success")
                // console.log("Metrics", statusJson.metrics)
                const { output } = statusJson
                const images = await Promise.all(output.map(async (o: string) => {
                    const image = await fetch(proxy(o), { headers })
                    return image.blob()
                }))
                resolve(images)

            }
        }, interval)
    })
}