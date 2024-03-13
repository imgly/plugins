import { useRef, useState, useEffect } from "react";
import { type Configuration } from "@cesdk/cesdk-js";
import type CreativeEditorSDK from "@cesdk/cesdk-js";
import { unflatten } from "@imgly/plugin-utils";

type Props = {
    config: Configuration, callback: (cesdk: CreativeEditorSDK) => Promise<void>
}


export default function CreativeEditorSDKComponent(props: Props) {
    const cesdk_container = useRef(null);

    const [_, setCesdk] = useState<CreativeEditorSDK | undefined>();

    useEffect(() => {
        if (!cesdk_container.current) return;

        let cleanedUp = false;

        const cleanUpInstance = () => {
            cleanedUp = true;
            if (import.meta.hot) {
                import.meta.hot.data.cesdk = instance?.save();
            }
            instance?.dispose();
        }
        let instance: CreativeEditorSDK;
        import("@cesdk/cesdk-js")
            .then((module) => module.default.create(cesdk_container!.current!, unflatten(props.config)))
            .then(async (instance) => {
                if (cleanedUp) {
                    cleanUpInstance()
                    return;
                }
                setCesdk(instance);

                await props.callback(instance);
            }
            );

        return () => {
            cleanUpInstance()
            setCesdk(undefined);
        };
    }, [cesdk_container, props.config]);

    return (
        <div
            ref={cesdk_container}
            style={{ width: '100%', height: '100%' }}
        ></div>
    );
}
