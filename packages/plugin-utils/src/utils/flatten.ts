export function flatten(obj: any, prefix = ''): any {
    const flattened = {};

    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const propName = prefix ? `${prefix}.${key}` : key;

            if (typeof obj[key] === 'object' && obj[key] !== null) {
                Object.assign(flattened, flatten(obj[key], propName));
            } else {
                // @ts-ignore
                flattened[propName] = obj[key];
            }
        }
    }

    return flattened;
}


