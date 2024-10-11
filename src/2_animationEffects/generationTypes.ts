import { AnimClip } from "../1_playbackStructures/AnimationClip";
import { ExitClip } from "../1_playbackStructures/AnimationClipCategories";
import { Keyframes } from "../4_utils/interfaces";
import { StripDuplicateMethodAutocompletion, ReadonlyPick, ReadonlyRecord } from "../4_utils/utilityTypes";

/**
 * @category Effect Generator Functions
 * @interface
 */
export type KeyframesGenerator<TClipContext extends unknown> = {
  /**
   * Runs every time the clip is played, returning up to 2 new sets of {@link Keyframes} each time.
   * @param effectOptions - parameters used to set the behavior for the specific animation effect
   * @returns An object containing 2 possible sets of {@link Keyframes}.
   * - `forwardKeyframes` is used for the clip's animation when the clip is played
   * - `backwardKeyframes` (optional) is used for the clip's animation when the clip is rewound
   * - - If `backwardKeyframes` is omitted, the reversal of `forwardKeyframes` is used instead
   * 
   * <div id="example--KeyframesGenerator.generateKeyframes-1">
   * @example
   * ```ts
   * const clipFactories = webimator.createAnimationClipFactories({
   *   customEntranceEffects: {
   *     // a custom 'zoomIn' entrance animation effect that you might make
   *     zoomIn: {
   *       generateKeyframes(initialScale: number) {
   *         return {
   *           forwardFrames: [
   *             {scale: initialScale, opacity: 0},
   *             {scale: 1, opacity: 1}
   *           ],
   *           // (backwardFrames could have been omitted in this case because
   *           // the reversal of forwardFrames is exactly equivalent)
   *           backwardFrames: [
   *             {scale: 1, opacity: 1},
   *             {scale: initialScale, opacity: 0}
   *           ]
   *         };
   *       }
   *     }
   *   },
   * });
   * 
   * const element = document.querySelector('.some-element');
   * const ent = clipFactories.Entrance(element, 'zoomIn', [0.2]);
   * ent.play().then(ent.rewind);
   * ```
   * </div>
   */
  generateKeyframes(
    /**@ignore*/
    this: TClipContext,
    ...effectOptions: unknown[]): { forwardFrames: Keyframes; backwardFrames?: Keyframes; };
  generateKeyframeGenerators?: never;
  generateRafMutators?: never;
  generateRafMutatorGenerators?: never;
};

/**
 * @category Effect Generator Functions
 * @interface
 */
export type KeyframesGeneratorsGenerator<TClipContext extends unknown> = {
  generateKeyframes?: never;
  /**
   * Runs itself exactly once (creating a closure) and returns up to 2 callback functions that each return one set of {@link Keyframes}.
   * @param effectOptions - parameters used to set the behavior for the specific animation effect
   * @returns An object containing 2 possible callback functions that each generate (return) one set of {@link Keyframes}.
   * - `forwardGenerator` will run every time the clip is played
   * - `backwardGenerator` (optional) will run every time the clip is rewound
   * - - If `backwardGenerator` is omitted, `forwardGenerator` will be used, and the resulting keyframes will be reversed
   * 
   * <div id="example--KeyframesGeneratorsGenerator.generateKeyframeGenerators-1">
   * @example
   * ```ts
   * const clipFactories = webimator.createAnimationClipFactories({
   *   customExitEffects: {
   *     // a custom animation effect for flying out to the left side of the screen
   *     flyOutLeft: {
   *       generateKeyframeGenerators() {
   *         const computeTranslationStr = () => {
   *           const orthogonalDistance = -(this.domElem.getBoundingClientRect().right);
   *           const translationString = `${orthogonalDistance}px 0px`;
   *           return translationString;
   *         }
   *   
   *         return {
   *           forwardGenerator: () => {
   *             return [
   *               {translate: computeTranslationStr()}
   *             ];
   *           },
   *           // backwardGenerator could have been omitted because the result of running forwardGenerator()
   *           // again and reversing the keyframes produces the same desired rewinding effect in this case
   *           backwardGenerator: () => {
   *             return [
   *               {translate: computeTranslationStr()},
   *               {translate: `0 0`}
   *             ];
   *           }
   *         };
   *       },
   *       
   *       immutableConfig: {
   *         // this means that the translation is added onto the element's position instead of replacing it
   *         composite: 'accumulate',
   *       }
   *     },
   *   }
   * });
   * 
   * const element = document.querySelector('.some-element');
   * const ext = clipFactories.Exit(element, 'flyOutLeft', []);
   * ext.play().then(ext.rewind);
   * ```
   * </div>
   */
  generateKeyframeGenerators(
    /**@ignore*/
    this: TClipContext,
    ...effectOptions: unknown[]): StripDuplicateMethodAutocompletion<{ forwardGenerator: () => Keyframes; backwardGenerator?: () => Keyframes; }>;
  generateRafMutators?: never;
  generateRafMutatorGenerators?: never;
};

/**
 * @category Effect Generator Functions
 * @interface
 */
export type RafMutatorsGenerator<TClipContext extends unknown> = {
  generateKeyframes?: never;
  generateKeyframeGenerators?: never;
  /**
   * Runs every time the clip is played, returning 2 functions each time.
   * These functions are run every frame (using {@link requestAnimationFrame} behind the scenes),
   * so if a property of the animated element is changed using
   * {@link AnimClip.computeTween}, it will look like a smooth animation.
   * @param effectOptions - parameters used to set the behavior for the specific animation effect
   * @returns An object containing 2 functions.
   * - `forwardMutator` is used for the clip's animation when the clip is played
   * - `backwardKeyframes` is used for the clip's animation when the clip is rewound
   * 
   * @see {@link AnimClip.computeTween}
   * 
   * <div id="RafMutatorsGenerator.generateRafMutators-1">
   * </div>
   */
  generateRafMutators(
    /**@ignore*/
    this: TClipContext & ReadonlyPick<AnimClip, 'computeTween'>,
    ...effectOptions: unknown[]): StripDuplicateMethodAutocompletion<{ forwardMutator: () => void; backwardMutator: () => void; }>;
  generateRafMutatorGenerators?: never;
};

/**
 * @category Effect Generator Functions
 * @interface
 */
export type RafMutatorsGeneratorsGenerator<TClipContext extends unknown> = {
  generateKeyframes?: never;
  generateKeyframeGenerators?: never;
  generateRafMutators?: never;
  /**
   * Runs itself exactly once (creating a closure) and returns 2 function that each return one function.
   * Those final returned functions are run every frame (using {@link requestAnimationFrame} behind the scenes),
   * so if a property of the animated element is changed using
   * {@link AnimClip.computeTween}, it will look like a smooth animation.
   * @param effectOptions - parameters used to set the behavior for the specific animation effect
   * @returns An object containing 2 callback functions that each generate (return) one function.
   * - `forwardGenerator` will run every time the clip is played, producing a function that will be used in a loop
   * - `backwardGenerator` will run every time the clip is rewound, producing a function that will be used in a loop
   * 
   * @see {@link AnimClip.computeTween}
   * 
   * <div id="RafMutatorsGeneratorsGenerator.generateRafMutatorGenerators-1">
   * </div>
   */
  generateRafMutatorGenerators(
    /**@ignore*/
    this: TClipContext & ReadonlyPick<AnimClip, 'computeTween'>,
    ...effectOptions: unknown[]): StripDuplicateMethodAutocompletion<{ forwardGenerator: () => () => void; backwardGenerator: () => () => void; }>;
};

/**
 * Object representing an entry in an {@link EffectGeneratorBank}. It consists of 3 properties:
 * - {@link EffectGenerator.defaultConfig | defaultConfig} - default configuration options that are appropriate for the effect (and can be overwritten)
 * - {@link EffectGenerator.immutableConfig | immutableConfig} - default configuration options for the effect (but cannot be overwritten)
 * - a generator function that creates the animation effect. There are 4 possible functions:
 * - - {@link KeyframesGenerator.generateKeyframes | generateKeyframes}
 * - - {@link KeyframesGeneratorsGenerator.generateKeyframeGenerators | generateKeyframeGenerators}
 * - - {@link RafMutatorsGenerator.generateRafMutators | generateRafMutators}
 * - - {@link RafMutatorsGeneratorsGenerator.generateRafMutatorGenerators | generateRafMutatorGenerators}
 * 
 * The configuration options that are allowed to be set in {@link EffectGenerator.defaultConfig | defaultConfig} or 
 * {@link EffectGenerator.immutableConfig | immutableConfig} depend on {@link AnimClip.categoryImmutableConfig}. For example,
 * {@link ExitClip.categoryImmutableConfig} contains `commitStyles: false`, so the `commitStyles` option is unavailable in
 * {@link EffectGenerator.defaultConfig | defaultConfig} and {@link EffectGenerator.immutableConfig | immutableConfig} for
 * any entries in the exit effects bank.
 * 
 * @interface
 */
export type EffectGenerator<TClipContext extends unknown = unknown, TConfig extends unknown = unknown> = Readonly<
  {
    /** Default configuration options that are appropriate for the effect (and can be overwritten). */
    defaultConfig?: Partial<TConfig>;
    /** default configuration options for the effect that cannot be overwritten (but cannot be overwritten). */
    immutableConfig?: Partial<TConfig>;
    // /**
    //  * The effect name. E.g., 'fade-in', 'appear', etc.
    //  * This is automatically set at run-time. There is no need to set it manually (and trying to does nothing).
    //  */
    // effectName?: string;
    // /**
    //  * Reference to the full effect generator bank this effect generator belongs to.
    //  * This is set automatically at run-time. There is no need to set it manually (and trying to does nothing).
    //  */
    // sourceBank?: EffectGeneratorBank<any>;
  } &
  StripDuplicateMethodAutocompletion<(
    | KeyframesGenerator<TClipContext>
    | KeyframesGeneratorsGenerator<TClipContext>
    | RafMutatorsGenerator<TClipContext>
    | RafMutatorsGeneratorsGenerator<TClipContext>
  )>
>;

/** @ignore */
export type Layer3MutableClipConfig<TClipClass extends AnimClip> = Omit<ReturnType<TClipClass['getConfig']>, keyof TClipClass['categoryImmutableConfig']>;

// represents an object where every string key is paired with a EffectGenerator value
/**
 * Object containing {@link EffectGenerator} entries for a specific category of animation effect.
 * For example, there is an effect generator bank containing effect generators for entrance animation effects.
 */
export type EffectGeneratorBank<TClip extends AnimClip = AnimClip> = ReadonlyRecord<
  string, EffectGenerator<ReadonlyPick<TClip, 'domElem' | 'getEffectDetails'>, Layer3MutableClipConfig<TClip>>
>;

/**
 * The parameters for a specific {@link EffectGenerator}'s generator function.
 */
export type EffectOptions<TEffectGenerator extends EffectGenerator> = Parameters<
  TEffectGenerator extends KeyframesGenerator<unknown> ? TEffectGenerator['generateKeyframes']
  : (TEffectGenerator extends KeyframesGeneratorsGenerator<unknown> ? TEffectGenerator['generateKeyframeGenerators']
    : (TEffectGenerator extends RafMutatorsGenerator<unknown> ? TEffectGenerator['generateRafMutators']
      : (TEffectGenerator extends RafMutatorsGeneratorsGenerator<unknown> ? TEffectGenerator['generateRafMutatorGenerators']
        : (never)
      )
    )
  )
>;

// CHANGE NOTE: EffectNameIn now handles keyof and Extract
// extracts only those strings in an object whose paired value is an EffectGenerator
/**
 * Detects the keys corresponding only to {@link EffectGenerator} entries within an {@link EffectGeneratorBank}. 
 */
export type EffectNameIn<TGeneratorBank extends EffectGeneratorBank> = Exclude<keyof {
  [key in keyof TGeneratorBank as TGeneratorBank[key] extends EffectGenerator ? key : never]: TGeneratorBank[key];
}, number | symbol>;/** @ignore */

