import "react-cmdk/dist/cmdk.css";
import CMDK, { filterItems, getItemIndex } from "react-cmdk";
import { useState, useEffect } from "react";


const CommandPrefix = "!"
const BlockPrefix = "#"
const PropertyPrefix = "@"

import { groupBy } from "lodash";

// https://github.com/albingroen/react-cmdk
type Params = { items: Array<any>, isOpen: boolean, setIsOpen: (val: boolean) => void }
export const CommandPalette = (params: Params) => {
    const [page, _setPage] = useState<"root">("root");
    const [search, setSearch] = useState(CommandPrefix);
    const { isOpen, setIsOpen } = params
    const { items } = params

    
    
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

    // Support prefixes
    
    let refinedSearch = search
    let refinedItems = items

    if (search.startsWith(CommandPrefix)) {
        refinedSearch = search.substring(CommandPrefix.length).trim()
        refinedItems = items.filter((item) => item.kind === "command")
    }
    else if (search.startsWith(BlockPrefix)) {
        refinedSearch = search.substring(BlockPrefix.length).trim()
        refinedItems = items.filter((item) => item.kind === "block")
    }
    
    else if (search.startsWith(PropertyPrefix)) {
        refinedSearch = search.substring(PropertyPrefix.length).trim()
        refinedItems = items.filter((item) => item.kind === "property")
    } else {
        refinedItems = items.filter((item) => item.kind === "command")
    }

    const grouped = groupBy(refinedItems, "group")
    const filteredItems = filterItems(Object.keys(grouped).map((key) => {
        return {
            heading: key,
            id: key,
            items: grouped[key] ?? []
        }
    }), refinedSearch, { filterOnListHeading: true});

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

