import { AnimClip } from "../1_playbackStructures/AnimationClip";
import { ExitClip } from "../1_playbackStructures/AnimationClipCategories";
import { Keyframes } from "../4_utils/interfaces";
import { StripDuplicateMethodAutocompletion, ReadonlyPick, ReadonlyRecord } from "../4_utils/utilityTypes";


/**
 * @category Effect Generator Functions
 * @interface
 */
export type EffectComposerFunction<TClipContext extends unknown> = {
  /**
   * Runs itself exactly once (creating a closure) and returns up to 2 callback functions that each return one set of {@link Keyframes}.
   * @param effectOptions - parameters used to set the behavior for the specific animation effect
   * @returns An object containing 2 possible callback functions that each generate (return) one set of {@link Keyframes}.
   *  * `forwardGenerator` will run every time the clip is played
   *  * `backwardGenerator` (optional) will run every time the clip is rewound
   *    * If `backwardGenerator` is omitted, `forwardGenerator` will be used, and the resulting keyframes will be reversed
   * 
   * @example
   * <!-- EX:S id="EffectComposerFunction.composeEffect-1" code-type="ts" -->
   * ```ts
   * const clipFactories = webimator.createAnimationClipFactories({
   *   customExitEffects: {
   *     // a custom animation effect for flying out to the left side of the screen
   *     flyOutLeft: {
   *       composeEffect() {
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
   *           backwardFramesGenerator: () => {
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
   * <!-- EX:E id="EffectComposerFunction.composeEffect-1" -->
   */
  composeEffect(
    /**@ignore*/
    this: TClipContext & ReadonlyPick<AnimClip, 'computeTween'>,
    ...effectOptions: unknown[]): StripDuplicateMethodAutocompletion<{
      forwardFramesGenerator?: () => Keyframes;
      backwardFramesGenerator?: () => Keyframes;
      forwardRafGenerator?: () => () => void;
      backwardRafGenerator?: () => () => void;
    }>;
};

// TODO: add code examples
/**
 * Object representing an entry in an {@link EffectGeneratorBank}. It consists of 3 properties:
 *  * {@link EffectGenerator.defaultConfig | defaultConfig} - default configuration options that are appropriate for the effect (and can be overwritten)
 *  * {@link EffectGenerator.immutableConfig | immutableConfig} - default configuration options for the effect (but cannot be overwritten)
 *  * a generator function that creates the animation effect. There is 1 possible function:
 *    * {@link EffectComposerFunction.composeEffect | composeEffect}
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
    /**
     * Determines whether {@link EffectComposerFunction.composeEffect} should run only once or re-run every time `play()` is called.
     *  * if `on-every-play`, the effect generator's {@link EffectComposerFunction.composeEffect} function will re-run every time
     * the clip plays forward, which creates a new closure and returns new generator callbacks.
     *  * if `on-first-play-only`, the effect generator's {@link EffectComposerFunction.composeEffect} function will run the first time
     * `play()` is called and never again.
     *    * This should be set to `on-first-play-only` when code in the closure of {@link EffectComposerFunction.composeEffect}
     * only needs to (or perhaps _must_ only) run once for the returned generators to be correct.
     * 
     * @defaultValue
     * ```ts
     * 'on-every-play'
     * ```
     */
    effectCompositionFrequency?: 'on-first-play-only' | 'on-every-play';
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
  } & EffectComposerFunction<TClipContext>
>;

/** @ignore */
export type Layer3MutableClipConfig<TClipClass extends AnimClip> = Omit<ReturnType<TClipClass['getConfig']>, keyof TClipClass['categoryImmutableConfig']>;

// represents an object where every string key is paired with a EffectGenerator value
/**
 * Object containing {@link EffectGenerator} entries for a specific category of animation effect.
 * For example, there is an effect generator bank containing effect generators for entrance animation effects.
 */
export type EffectGeneratorBank<TClip extends AnimClip = AnimClip> = ReadonlyRecord<
  string, EffectGenerator<ReadonlyPick<TClip, 'domElem' | 'getEffectDetails' | 'getStatus'>, Layer3MutableClipConfig<TClip>>
>;

/**
 * The parameters for a specific {@link EffectGenerator}'s generator function.
 */
export type EffectOptions<TEffectGenerator extends EffectGenerator> = Parameters<TEffectGenerator['composeEffect']>;

// CHANGE NOTE: EffectNameIn now handles keyof and Extract
// extracts only those strings in an object whose paired value is an EffectGenerator
/**
 * Detects the keys corresponding only to {@link EffectGenerator} entries within an {@link EffectGeneratorBank}. 
 */
export type EffectNameIn<TGeneratorBank extends EffectGeneratorBank> = Exclude<keyof {
  [key in keyof TGeneratorBank as TGeneratorBank[key] extends EffectGenerator ? key : never]: TGeneratorBank[key];
}, number | symbol>;/** @ignore */

