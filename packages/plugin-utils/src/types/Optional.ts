/**
 * Turn value at K of T into a Partial
 * @public
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<T>;
