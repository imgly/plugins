import { useRef, useState, useEffect } from "react";
import { type Configuration } from "@cesdk/cesdk-js";
import type CreativeEditorSDK from "@cesdk/cesdk-js";
import { unflatten } from "../utils/flatten";

type Props = {
    config: Configuration, callback: (cesdk: CreativeEditorSDK) => Promise<void>
}
export default function CreativeEditorSDKComponent(props: Props) {
    const cesdk_container = useRef(null);
    // console.log("Properties", props.config)

    const [_, setCesdk] = useState<CreativeEditorSDK | undefined>();

    useEffect(() => {
        if (!cesdk_container.current) return;
        
        let cleanedUp = false;
        let instance: CreativeEditorSDK;
        import("@cesdk/cesdk-js")
            .then((module) => module.default.create(cesdk_container!.current!, unflatten(props.config)))
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
