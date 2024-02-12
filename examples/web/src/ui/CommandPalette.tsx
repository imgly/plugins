import "react-cmdk/dist/cmdk.css";
import CMDK, { filterItems, getItemIndex } from "react-cmdk";
import { useState, useEffect } from "react";


// https://github.com/albingroen/react-cmdk
export const CommandPalette = (params: { items: Array<any> }) => {
    const [page, _setPage] = useState<"root">("root");
    const [search, setSearch] = useState("");
    const [isOpen, setIsOpen] = useState<boolean>(false);
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
                heading: undefined,
                id: "turnInto",
                items: items?? []
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

