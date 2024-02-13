import { useRef, useState, useEffect } from "react";
import CreativeEditorSDK, { Configuration } from "@cesdk/cesdk-js";
import { unflatten } from "../utils/flatten";

type Props = {
    config: Configuration, callback: (cesdk: CreativeEditorSDK) => Promise<void>
}
export default function CreativeEditorSDKComponent(props: Props) {
    const cesdk_container = useRef(null);
    // console.log("Properties", props.config)

    const [_, setCesdk] = useState<CreativeEditorSDK | undefined>();

    useEffect(() => {
        console.log("Use effect", props.config)
        console.log("Container", cesdk_container.current)
        if (!cesdk_container.current) return;
        console.log("Creating CESDK instance")
        let cleanedUp = false;
        let instance: CreativeEditorSDK;
        CreativeEditorSDK
            .create(cesdk_container.current, unflatten(props.config))
            .then(async (instance) => {
                    if (cleanedUp) {
                        instance.dispose();
                        return;
                    }
                    console.log("Created CESDK instance")
                    setCesdk(instance);
                    await props.callback(instance);
                }
            );

        return () => {
            cleanedUp = true;
            instance?.dispose();
            setCesdk(undefined);
        };
    }, [cesdk_container, props.config]);

    return (
        <div
            ref={cesdk_container}
            style={{ width: '100vw', height: '100vh' }}
        ></div>
    );
}