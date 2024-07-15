interface Nothing {};
export type Union<T, U> = T | (U & Nothing);

/**
 * Prevents issue where "XOR"-like union of properties results in duplicated method names showing up in autocompletion.
 * For functions, explicitly adding "& Function" seems to get rid of the version without the method signature.
 */
export type StripDuplicateMethodAutocompletion<T> = { [K in keyof T]: T[K] extends Function ? T[K] & Function : T[K] }

export type KeysOf<T extends object> = (Extract<keyof T, string>)[];
export type ReadonlyPick<T, K extends keyof T> = Readonly<Pick<T, K>>;
export type ReadonlyRecord<K extends keyof any, T> = Readonly<Record<K, T>>;
