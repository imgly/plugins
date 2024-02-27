import "react-cmdk/dist/cmdk.css";
import CMDK, { filterItems, getItemIndex } from "react-cmdk";
import { useState, useEffect } from "react";

import { groupBy } from "lodash";

// https://github.com/albingroen/react-cmdk
export const CommandPalette = (params: { items: Array<any>, isOpen: boolean, setIsOpen: (val: boolean) => void }) => {
    const [page, _setPage] = useState<"root">("root");
    const [search, setSearch] = useState("");
    const { isOpen, setIsOpen } = params
    const { items } = params

    // debugger
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

                setIsOpen(!isOpen);
            }
        }

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);



    const grouped = groupBy(items,"group")
    const filteredItems = filterItems(Object.keys(grouped).map((key) => {
        return {
            heading: key,
            id: key,
            items: grouped[key] ?? []
        }
    }), search);
    
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

