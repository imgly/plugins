/**
 * Gives the return type of a function.
 * @public
 */
export type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any;
