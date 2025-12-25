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
 * @typeParam T - Object type that presumably contains some methods that are potentially never/undefined
 * 
 * @remarks
 * For each key `K` of `T`, see if `T[K]` extends `Function` when not `never` or `undefined`.
 * * If so, return `T[K] & Function`
 * * If not, return `T[K]` (unchanged)
 */
export type StripDuplicateMethodAutocompletion<T> = {
  [K in keyof T]: (
    Exclude<T[K], undefined | never> extends Function
      ? T[K] & Function
      : T[K]
  )
};
// export type StripDuplicateMethodAutocompletion<T> = { [K in keyof T]: T[K] extends infer H ? T[K] & (Exclude<H, undefined> extends Function ? Function : {}) : T[K] }


export type KeyOf<T extends object> = Extract<keyof T, string>;
export type KeysOf<T extends object> = (Extract<keyof T, string>)[];
export type ReadonlyPick<T, K extends keyof T> = Readonly<Pick<T, K>>;
export type ReadonlyRecord<K extends keyof any, T> = Readonly<Record<K, T>>;
export type PartialPick<T, K extends keyof T> = Partial<Pick<T, K>>;
export type PickFromArray<T, K extends (keyof T)[]> = {[key in K[number]]: T[key]};
export type OmitStrict<T, K extends keyof T> = Omit<T, K>;
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }

// type Contra<T> =
//     T extends any 
//     ? (arg: T) => void 
//     : never;
// type InferContra<T> = 
//     [T] extends [(arg: infer I) => void] 
//     ? I 
//     : never;
// type PickOne<T> = InferContra<InferContra<Contra<Contra<T>>>>;
// type Union2Tuple<T> =
//     PickOne<T> extends infer U
//     ? Exclude<T, U> extends never
//         ? [T]
//         : [...Union2Tuple<Exclude<T, U>>, U]
//     : never;


/**
 * Returns the specified error if T contains additional properties beyond what is allowed by TExpected.
 * @typeParam T - Object type that should have NO additional properties beyond what is specified by TExpected
 * @typeParam TExpected - Object type that restricts what is allowed to show up in T
 * @typeParam TError - The error string that will be returned if T does not respect TExpected
 */
export type StrictPropertyCheck<T extends object, TExpected extends object, TError extends string> = Exclude<keyof T, keyof TExpected> extends never ? {} : (
  `******************************************************************************************************                                      ***ERROR: Invalid property '${Exclude<keyof T, keyof TExpected | number | symbol>}'. ${TError}                                      ______________________________________________________________________________________________________`
);

