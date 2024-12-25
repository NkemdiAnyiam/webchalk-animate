interface Nothing {};
export type Union<T, U> = T | (U & Nothing);
// export type PrefixProps<T extends {}, P extends string> = { [key in Extract<keyof T, string> as `${P}${key}`]: T[key] };
// export type PostfixProps<T extends {}, P extends string> = { [key in Extract<keyof T, string> as `${key}${P}`]: T[key] };
// export type PrePostfixProps<T extends {}, Pre extends string, Post extends string = Pre> = {
//   [key in Extract<keyof T, string> as `${Pre}${key}${Post}`]: T[key]
// };

/**
 * Prevents duplicate autocompletion for functions whose type union resolves to `Function` when `undefined` and `never` are excluded.
 * For functions, explicitly adding "& Function" seems to get rid of the version without the method signature.
 * @interface
 * @typeParam T - Object that presumably contains some methods that are potentially never 
 */
export type StripDuplicateMethodAutocompletion<T> = { [K in keyof T]: Exclude<T[K], undefined | never> extends Function ? T[K] & Function : T[K] };
// export type StripDuplicateMethodAutocompletion<T> = { [K in keyof T]: T[K] extends infer H ? T[K] & (Exclude<H, undefined> extends Function ? Function : {}) : T[K] }


export type KeyOf<T extends object> = Extract<keyof T, string>;
export type KeysOf<T extends object> = (Extract<keyof T, string>)[];
export type ReadonlyPick<T, K extends keyof T> = Readonly<Pick<T, K>>;
export type ReadonlyRecord<K extends keyof any, T> = Readonly<Record<K, T>>;
export type PartialPick<T, K extends keyof T> = Partial<Pick<T, K>>;
export type PickFromArray<T, K extends (keyof T)[]> = {[key in K[number]]: T[key]};
export type OmitStrict<T, K extends keyof T> = Omit<T, K>;
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }
