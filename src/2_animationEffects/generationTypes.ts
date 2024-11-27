/**
 * @module 2_animationEffects/customEffectGeneration
 */
import { AnimClip } from "../1_playbackStructures/AnimationClip";
import { ExitClip } from "../1_playbackStructures/AnimationClipCategories";
import { Keyframes, Mutator } from "../4_utils/interfaces";
import { StripDuplicateMethodAutocompletion, ReadonlyPick, ReadonlyRecord } from "../4_utils/utilityTypes";

/**
 * Contains up to 4 callback functions (at _least_ 1 must be specified) that will be called to
 * produce the effect for an animation clip. Returned by {@link EffectGenerator.composeEffect}.
 *  * {@link ComposedEffect.forwardFramesGenerator | forwardFramesGenerator} will run every time the clip is played,
 * producing a {@link Keyframes} object.
 *  * {@link ComposedEffect.backwardFramesGenerator | backwardFramesGenerator} will run every time the clip is rewound,
 * producing a {@link Keyframes} object.
 *    * If either one is omitted, the other callback will be used instead, and the result will just be played in reverse.
 * It is up to you to check whether the animation effect is valid if this shortcut is taken.
 *  * {@link ComposedEffect.forwardRafGenerator | forwardRafGenerator} will run every time the clip is played,
 * producing a {@link Mutator} function.
 *  * {@link ComposedEffect.backwardRafGenerator | backwardRafGenerator} will run every time the clip is rewound,
 * producing a {@link Mutator} function.
 *    * If either one is omitted, the other callback will be used instead, and the result will just be reversed.
 * It is up to you to check whether the animation effect is valid if this shortcut is taken.
 * 
 * @see {@link EffectGenerator.composeEffect}
 * 
 * @interface
 */
export type ComposedEffect = StripDuplicateMethodAutocompletion<{
  /**
   * Performs any necessary operations/computations and then returns keyframes ({@link Keyframes}).
   * @returns Keyframes, either in the form of a {@link PropertyIndexedKeyframes} object or—more commonly—an array of {@link Keyframe} objects.
   * @see [Keyframe Formats](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Keyframe_Formats)
   */
  forwardFramesGenerator?: () => Keyframes;
  /**
   * Performs any necessary operations/computations and then returns keyframes ({@link Keyframes}).
   * @returns Keyframes, either in the form of a {@link PropertyIndexedKeyframes} object
   * or—more commonly—an array of {@link Keyframe} objects.
   * @see [Keyframe Formats](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Keyframe_Formats)
   */
  backwardFramesGenerator?: () => Keyframes;
  /**
   * Performs any necessary operations/computations and then returns a function that will be run on every frame.
   * @returns A function that presumably mutates the target element in some way (presumably with the help of {@link AnimClip.computeTween}) and will automatically be run on every frame. Since it will be run on every frame, it will create the illusion of a smooth animation.
   * @see {@link AnimClip.computeTween}
   */
  forwardRafGenerator?: () => Mutator;
  /**
   * Performs any necessary operations/computations and then returns a function that will be run on every frame.
   * @returns A function that presumably mutates the target element in some way (presumably with the help of {@link AnimClip.computeTween}) and will automatically be run on every frame. Since it will be run on every frame, it will create the illusion of a smooth animation.
   * @see {@link AnimClip.computeTween}
   */
  backwardRafGenerator?: () => Mutator;
}>;

// TODO: add code examples
/**
 * Object representing an entry in an {@link EffectGeneratorBank}. It contains
 *  * a function for composing an animation effect
 *  * two properties that can be used to specify clip configuration settings
 *    * one property contains default configuration settings
 *    * the other property contains immutable configuration settings
 *  * a property that sets how often the effect composition function should be run
 * 
 * @interface
 */
export type EffectGenerator<TClipContext extends unknown = unknown, TConfig extends unknown = unknown> = Readonly<
  {
    /**
     * Default configuration options that are appropriate for the effect (and can be overwritten while calling the clip factory function).
     * This makes it convenient to rely on some preset behaviors that make sense without having to set them in a clip factory function.
     * 
     * When creating custom effects, the configuration options that you are allowed to set here may be limited by the {@link AnimClip}
     * value for {@link AnimClip.categoryImmutableConfig} (which you cannot modify). For example, for exit animation clips,
     * {@link ExitClip.categoryImmutableConfig} sets a value for `commitStyles`, so you cannot set a value for `commitStyles` in
     * {@link EffectGenerator.defaultConfig | defaultConfig} for any entries in the exit effects bank.
     * 
     * @group Clip Configuration
     */
    defaultConfig?: Partial<TConfig>;
    /**
     * Immutable configuration options for the effect that are appropriate for the effect (but _cannot_ be overwritten
     * while calling the clip factory function). 
     * This makes it possible to set in stone some expected behaviors of clips that use certain effects.
     * 
     * When creating custom effects, the configuration options that you are allowed to set here may be limited by the {@link AnimClip}
     * value for {@link AnimClip.categoryImmutableConfig} (which you cannot modify). For example, for exit animation clips,
     * {@link ExitClip.categoryImmutableConfig} sets a value for `commitStyles`, so you cannot set a value for `commitStyles` in
     * {@link EffectGenerator.immutableConfig | immutableConfig} for any entries in the exit effects bank.
     * 
     * @group Clip Configuration
     */
    immutableConfig?: Partial<TConfig>;
    /**
     * Determines whether {@link EffectGenerator.composeEffect | composeEffect} should re-run every time
     * `play()` is called (the default behavior) or only run once.
     *  * if `on-every-play`, the effect generator's {@link EffectGenerator.composeEffect | composeEffect} function will re-run every time
     * the clip plays forward, which creates a new closure and returns new generator callbacks.
     *  * if `on-first-play-only`, the effect generator's {@link EffectGenerator.composeEffect | composeEffect} function will run the first time
     * `play()` is called and never again.
     *    * This should be set to `on-first-play-only` when code in the closure of {@link EffectGenerator.composeEffect | composeEffect}
     * only needs to (or perhaps _must only_) run once for the returned generators to be correct.
     * 
     * @defaultValue
     * ```ts
     * 'on-every-play'
     * ```
     * 
     * @group Effect Composition
     */
    effectCompositionFrequency?: 'on-first-play-only' | 'on-every-play';
    // TODO: write updated examples
    /**
     * Runs when the clip is played and returns a {@link ComposedEffect}, which contains callback functions that will produce the
     * animation effects for both playing and rewinding.
     * @param effectOptions - parameters used to set the behavior for the specific animation effect when calling the clip factory function
     * @returns An object containing 4 possible callback functions that return {@link Keyframes} and/or {@link Mutator}.
     * 
     * @remarks
     * By default, {@link EffectGenerator.composeEffect | composeEffect} runs every time {@link AnimClip.play} is called,
     * producing a new {@link ComposedEffect} (and thus a new closure scoped to the body of
     * {@link EffectGenerator.composeEffect | composeEffect}) each time. For example:
     * ```ts
     * const ent = Entrance(elem, '~fly-in', ['from-top']);
     * ```
     * ↑ A new entrance animation clip is created.
     * ```ts
     * ent.play();
     * ```
     * ↑ `composeEffect()` runs for the first time, producing a `ComposedEffect` that contains up to 4 callbacks.
     * The `forwardFramesGenerator()` (if exists) and `forwardRafGenerator()` (if exists) callbacks are called to
     * produce the forward effect, and then the clip plays, using that animation effect.
     * 
     * ```ts
     * ent.rewind();
     * ```
     * ↑ The `backwardFramesGenerator()` (if exists) and `backwardRafGenerator()` (if exists) callbacks are called to
     * produce the backward effect, and then the clip rewinds, using that animation effect.
     * 
     * ```ts
     * ent.play();
     * ```
     * ↑ `composeEffect()` runs for the second time, producing a new `ComposedEffect` that contains up to 4 callbacks.
     * The `forwardFramesGenerator()` (if exists) and `forwardRafGenerator()` (if exists) callbacks are called to
     * produce the forward effect, and then the clip plays, using that animation effect.
     * 
     * @example
     * <!-- EX:S id="EffectGenerator.composeEffect-1" code-type="ts" -->
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
     * <!-- EX:E id="EffectGenerator.composeEffect-1" -->
     * 
     * @group Effect Composition
     */
    composeEffect(
      /**@ignore*/
      this: TClipContext & ReadonlyPick<AnimClip, 'computeTween'>,
      ...effectOptions: unknown[]
    ): ComposedEffect;
  }
>;

/** @ignore */
export type Layer3MutableClipConfig<TClipClass extends AnimClip> = Omit<ReturnType<TClipClass['getConfig']>, keyof TClipClass['categoryImmutableConfig']>;

// represents an object where every string key is paired with a EffectGenerator value
/**
 * Object containing {@link EffectGenerator} entries for a specific category of animation effects.
 * For example, there is an effect generator bank containing generators for entrance animation effects.
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
 * Detects the keys corresponding to {@link EffectGenerator} entries within an {@link EffectGeneratorBank}. 
 */
export type EffectNameIn<TGeneratorBank extends EffectGeneratorBank> = Exclude<keyof {
  [key in keyof TGeneratorBank as TGeneratorBank[key] extends EffectGenerator ? key : never]: TGeneratorBank[key];
}, number | symbol>;/** @ignore */

