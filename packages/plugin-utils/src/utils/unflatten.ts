

export function unflatten(obj: any): any {
    const unflattened = {};

    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            const keys = key.split('.');

            let currentObj = unflattened;
            for (let i = 0; i < keys.length - 1; i++) {
                const nestedKey = keys[i];
                if (!currentObj.hasOwnProperty(nestedKey)) {
                    // @ts-ignore
                    currentObj[nestedKey] = {};
                }
                // @ts-ignore
                currentObj = currentObj[nestedKey];
            }

            // @ts-ignore
            currentObj[keys[keys.length - 1]] = value;
        }
    }

    return unflattened;
}
