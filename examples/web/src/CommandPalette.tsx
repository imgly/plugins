import "react-cmdk/dist/cmdk.css";
import CMDK , { filterItems, getItemIndex } from "react-cmdk";
import { useState, useEffect, RefObject } from "react";
import CreativeEditorSDK from "@cesdk/cesdk-js";

// https://github.com/albingroen/react-cmdk
export const CommandPalette = (params: { cesdkRef: RefObject<CreativeEditorSDK | undefined>, actions: Array<any> }) => {
    const [page, _setPage] = useState<"root">("root");
    const [search, setSearch] = useState("");
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const { cesdkRef } = params

    if (!(cesdkRef)) return
    const cesdk = cesdkRef?.current

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (
                (navigator?.platform?.toLowerCase().includes("mac")
                    ? e.metaKey
                    : e.ctrlKey) &&
                e.key === "k"
            ) {
                e.preventDefault();
                e.stopPropagation();

                setIsOpen((currentValue) => {
                    return !currentValue;
                });
            }
        }

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    const filteredItems = filterItems(
        [
            {
                heading: "Debug",
                id: "debug",
                items: [
                    {
                        id: "info",
                        children: "Info",
                        showType: false,
                        onClick: () => {
                            console.log("Clicked on projects")
                            console.log("Cesdk ref", cesdkRef ?? "No ref")
                        },
                    },
                    {
                        id: "duplicate",
                        children: "Duplicate Selected Blocks",
                        showType: false,
                        onClick: () => {
                            const selected = cesdk!.engine.block.findAllSelected() ?? []
                            selected.map((id: any) => {
                                cesdk!.engine.block.setSelected(id, false)
                                const dupId = cesdk!.engine.block.duplicate(id)
                                cesdk!.engine.block.setSelected(dupId, true)
                            })
                        },
                    },
                    {
                        id: "delete",
                        children: "Delete Selected Blocks",
                        showType: false,
                        onClick: () => {
                            const selected = cesdk!.engine.block.findAllSelected() ?? []
                            selected.map((id: any) => {

                                cesdk!.engine.block.destroy(id)
                            })
                        },
                    }
                    ,
                    {
                        id: "saveToClipboard",
                        children: "Save to Clipboard",
                        showType: false,
                        onClick: async () => {
                            const selected = cesdk!.engine.block.findAllSelected() ?? []
                            const dump = await cesdk!.engine.block.saveToString(selected)
                            // console.info(dump)
                            navigator.clipboard.writeText(dump);
                        },
                    },
                    {
                        id: "loadFromClipboard",
                        children: "Load from Clipboard",
                        showType: false,
                        onClick: async () => {
                            // @ts-ignore
                            const status = await navigator.permissions.query({ name: 'clipboard-read' })
                            console.log("Clipboard read status", status.state)
                            const dump = await navigator.clipboard.readText()
                            const blockIds = await cesdk!.engine.block.loadFromString(dump)
                            const parentId = cesdk!.engine.scene.getCurrentPage()
                            if (!parentId || !blockIds) {
                                console.error("No parent or block id")
                                return
                            }
                            blockIds.map((blockId: any) => {
                                cesdk!.engine.block.appendChild(parentId, blockId)
                            })


                        },
                    }
                ],
            },
            {
                heading: "Export",
                id: "export",
                items: [
                    {
                        id: "exportPngToClipboard",
                        children: "Export PNG to Clipboard",
                        showType: false,
                        onClick: async () => {
                            // await navigator.permissions.query({ name: 'clipboard-write' })
                            const selected = cesdk!.engine.block.findAllSelected() ?? []
                            if (selected.length !== 1) return

                            // most browser can only do on1
                            const items = await Promise.all(selected.map(async (id: number) => {
                                // @ts-ignore
                                const dump = await cesdk!.engine.block.export(id, "image/png")
                                return new ClipboardItem({ "image/png": dump }, { presentationStyle: "attachment" })
                            }))
                            navigator.clipboard.write(items)
                        },
                    },
                ]
            },
            {
                heading: "Turn into...",
                id: "turnInto",
                items: params.actions.map(action => {
                    return {
                        id: action.id,
                        children: action.id,
                        showType: false,
                        onClick: () => {
                            // @ts-ignore
                            const act = window.cesdk_actions.get(action.id)
                            act?.()
                        }
                    }
                })
            }
        ],
        search
    );

    return (
        <CMDK
            onChangeSearch={setSearch}
            onChangeOpen={setIsOpen}
            search={search}
            isOpen={isOpen}
            page={page}
        >
            <CMDK.Page id="root">
                {filteredItems.length ? (
                    filteredItems.map((list) => (
                        <CMDK.List key={list.id} heading={list.heading}>
                            {list.items.map(({ id, ...rest }) => (
                                <CMDK.ListItem
                                    key={id}
                                    index={getItemIndex(filteredItems, id)}
                                    {...rest}
                                />
                            ))}
                        </CMDK.List>
                    ))
                ) : (
                    <CMDK.FreeSearchAction />
                )}
            </CMDK.Page>

        </CMDK>
    );
};

/// helper

