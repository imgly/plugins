import { useRef, useState, useEffect } from "react";
import CreativeEditorSDK, { Configuration } from "@cesdk/cesdk-js";



type Props = {
    config: Configuration, callback: (cesdk: CreativeEditorSDK) => Promise<void>
}
export default function CreativeEditorSDKComponent(props: Props) {
    const cesdk_container = useRef(null);

    const [_, setCesdk] = useState<CreativeEditorSDK | undefined>();

    useEffect(() => {
        if (!cesdk_container.current) return;

        let cleanedUp = false;
        let instance: CreativeEditorSDK;
        CreativeEditorSDK
            .create(cesdk_container.current, props.config)
            .then(
                async (instance) => {
                    if (cleanedUp) {
                        instance.dispose();
                        return;
                    }
                    setCesdk(instance);
                    await props.callback(instance);
                }
            );

        return () => {
            cleanedUp = true;
            instance?.dispose();
            setCesdk(undefined);
        };;
    }, [cesdk_container]);

    return (
        <div
            ref={cesdk_container}
            style={{ width: '100vw', height: '100vh' }}
        ></div>
    );
}