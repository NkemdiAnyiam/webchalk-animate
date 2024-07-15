interface Nothing {};
export type Union<T, U> = T | (U & Nothing);
export type PrefixProps<T extends {}, P extends string> = { [key in Extract<keyof T, string> as `${P}${key}`]: T[key] };
export type PostfixProps<T extends {}, P extends string> = { [key in Extract<keyof T, string> as `${key}${P}`]: T[key] };
export type PrePostfixProps<T extends {}, Pre extends string, Post extends string = Pre> = {
  [key in Extract<keyof T, string> as `${Pre}${key}${Post}`]: T[key]
};

/**
 * Prevents issue where "XOR"-like union of properties results in duplicated method names showing up in autocompletion.
 * For functions, explicitly adding "& Function" seems to get rid of the version without the method signature.
 * @interface StripDuplicateMethodAutocompletion
 * @typeParam T - Object that presumably contains some methods that are potentially never 
 */
export type StripDuplicateMethodAutocompletion<T> = { [K in keyof T]: T[K] extends Function ? T[K] & Function : T[K] }

export type KeysOf<T extends object> = (Extract<keyof T, string>)[];
export type ReadonlyPick<T, K extends keyof T> = Readonly<Pick<T, K>>;
export type ReadonlyRecord<K extends keyof any, T> = Readonly<Record<K, T>>;
