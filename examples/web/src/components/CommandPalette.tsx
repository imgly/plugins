import "react-cmdk/dist/cmdk.css";
import CMDK, { getItemIndex } from "react-cmdk";
import { useState, useEffect } from "react";

import Fuse from 'fuse.js';

// const CommandPrefix = "!"
// const BlockPrefix = "#"
// const PropertyPrefix = "@"

import { groupBy } from "lodash";

/**
 * 1. Use the pages structure 
 */



// ${kind=%,!} param1 param2 param3 param4 

// https://github.com/albingroen/react-cmdk
type Params = { items: Array<any>, isOpen: boolean, setIsOpen: (val: boolean) => void }
export const CommandPalette = (params: Params) => {
    const [page, _setPage] = useState<"root">("root");
    const [search, setSearch] = useState("");
    const { isOpen, setIsOpen } = params
    const { items } = params

    const parseSearchQuery = (search: string): { command: string, args: string[] } => {
        const [command, ...args]: Array<string> = search.split("=")
        return { command: command.trim(), args: args.map(a => a.trim()) }
    }


    const { command, args } = parseSearchQuery(search)
    if (command.length > 0) {
        console.log(`Running ${command}(${args.join(", ")})`)
    }
    // (command.length > 0) && 

    const fuseOptions = {
        keys: [
            // "id",
            "group",
            "kind",
            "children"
        ]
    }
    // console.log(command, args)
    const fuse = new Fuse(items, fuseOptions);
    const fuseResults = fuse.search(command)
    const results = fuseResults.length === 0 ? items : fuseResults.map(f => f.item);

    const grouped = groupBy(results, "group")

    const filteredItems = Object.keys(grouped).map((key) => {
        return {
            heading: key,
            id: key,
            items: grouped[key] ?? []
        }
    })


    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (
                (navigator?.userAgent?.toLowerCase().includes("mac")
                    ? e.metaKey
                    : e.ctrlKey) &&
                e.key === "k"
            ) {
                e.preventDefault();
                e.stopPropagation();

                setIsOpen(!isOpen);
            }
        }

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);



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
}

/// helper

