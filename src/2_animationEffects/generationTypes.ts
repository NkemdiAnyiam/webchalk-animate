/**
 * @module 2_animationEffects/customEffectCreation
 */
import { AnimClip } from "../1_playbackStructures/AnimationClip";
import { ExitClip } from "../1_playbackStructures/AnimationClipCategories";
import { Keyframes, Mutator } from "../4_utils/interfaces";
import { StripDuplicateMethodAutocompletion, ReadonlyPick, ReadonlyRecord } from "../4_utils/utilityTypes";

/**
 * Contains up to 4 callback functions (at _least_ 1 must be specified) that will be called to
 * produce the effect for an animation clip. Returned by {@link EffectGenerator.composeEffect}.
 *  * {@link ComposedEffect.forwardKeyframesGenerator | forwardKeyframesGenerator} will run every time the clip is played,
 * producing a {@link Keyframes} object.
 *  * {@link ComposedEffect.backwardKeyframesGenerator | backwardKeyframesGenerator} will run every time the clip is rewound,
 * producing a {@link Keyframes} object.
 *    * If either one is omitted, the other callback will be used instead, and the result will just be played in reverse.
 * It is up to you to check whether the animation effect is valid if this shortcut is taken.
 *  * {@link ComposedEffect.forwardMutatorGenerator | forwardMutatorGenerator} will run every time the clip is played,
 * producing a {@link Mutator} function.
 *  * {@link ComposedEffect.backwardMutatorGenerator | backwardMutatorGenerator} will run every time the clip is rewound,
 * producing a {@link Mutator} function.
 *    * If either one is omitted, the other callback will be used instead, and the result will just be reversed.
 * It is up to you to check whether the animation effect is valid if this shortcut is taken.
 * 
 * @see {@link EffectGenerator.composeEffect}
 * 
 * @category Effect Generation
 * 
 * @interface
 */
export type ComposedEffect = StripDuplicateMethodAutocompletion<{
  /**
   * Performs any necessary operations/computations and then returns keyframes ({@link Keyframes}).
   * @returns Keyframes, either in the form of a {@link PropertyIndexedKeyframes} object or—more commonly—an array of {@link Keyframe} objects.
   * @see [Keyframe Formats](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Keyframe_Formats)
   * 
   * @example
   * <!-- EX:S id="ComposedEffect.keyframe-generators" code-type="ts" -->
   * ```ts
   * const clipFactories = webimator.createAnimationClipFactories({
   *   customEntranceEffects: {
   *     // -----------------------------------------------------------------
   *     // ----------------------------EXAMPLE 1----------------------------
   *     // -----------------------------------------------------------------
   *     // Let us pretend you made this custom entrance animation effect named 'zoomIn'.
   *     // For this animation, you wrote the forward keyframes generator and
   *     // then verified that the desired rewinding effect is exactly equivalent
   *     // to playing the keyframes produced by forwardKeyframesGenerator() in reverse,
   *     // so you omit backwardKeyframesGenerator.
   *     zoomIn: {
   *       composeEffect(initialScale: number) {
   *         // return ComposedEffect
   *         return {
   *           forwardKeyframesGenerator: () => {
   *             console.log('About to return keyframes!');
   *             // return Keyframes (Keyframe[])
   *             return [
   *               {scale: initialScale, opacity: 0}, // Keyframe 1
   *               {scale: 1, opacity: 1}             // Keyframe 2
   *             ];
   *           },
   *           // backwardKeyframesGenerator() can be omitted in this case because
   *           // the reversal of the forward frames is exactly equivalent.
   *           // It is written below for demonstration purposes but commented out.
   *           // -----------------------------------------------------------------------
   *           // backwardKeyframesGenerator: () => {
   *           //   // return Keyframes (Keyframe[])
   *           //   return [
   *           //     {scale: 1, opacity: 1},           // Keyframe 1
   *           //     {scale: initialScale, opacity: 0} // Keyframe 2
   *           //   ];
   *           // },
   *         };
   *       }
   *     },
   *   },
   * 
   *   customMotionEffects: {
   *     // -----------------------------------------------------------------
   *     // ----------------------------EXAMPLE 2----------------------------
   *     // -----------------------------------------------------------------
   *     // Let us pretend you made this custom animation effect for moving an element rightward.
   *     // For this animation, you wrote the forward keyframes generator and then
   *     // checked to see if the desired rewinding effect could be achieved by just reusing
   *     // forwardKeyframesGenerator() and reversing the result. You realize that this effect is NOT
   *     // a candidate for that shortcut, so you write backwardKeyframesEffect.
   *     translateRight: {
   *       composeEffect(numPixels: number) {
   *         // a helper function you wrote that will exist within a closure scoped to composeEffect()
   *         const createTranslationString = () => {
   *           if (numPixels <= 0) { throw RangeError(`Number of pixels must exceed 0.`) }
   *           const translationString = `${numPixels}px`;
   *           return translationString;
   *         }
   *   
   *         // return ComposedEffect
   *         return {
   *           forwardKeyframesGenerator: () => {
   *             // return Keyframes (Keyframe[])
   *             return [
   *               {translate: createTranslationString()} // Keyframe
   *             ];
   *           },
   *           // backwardKeyframesGenerator() must be specified because reversing the keyframes produced
   *           // by forwardKeyframesGenerator() would not have the intended effect (because of
   *           // {composite: accumulate}, trying to simply use the reversal of
   *           // {translate: createTranslationString()} from forwardKeyframesGenerator() would actually
   *           // cause the target element to jump an additional numPixels pixels to the right
   *           // before sliding left, which is not the intended rewinding effect).
   *           backwardKeyframesGenerator: () => {
   *             // return Keyframes (Keyframe[])
   *             return [
   *               {translate: '-'+createTranslationString()}, // Keyframe
   *             ];
   *           },
   *         };
   *       },
   *       immutableConfig: {
   *         // this means that the translation is added onto the element's position
   *         // instead of replacing it
   *         composite: 'accumulate',
   *       },
   *       effectCompositionFrequency: 'on-first-play-only',
   *     },
   *   }
   * });
   * 
   * const element = document.querySelector('.some-element');
   * (async () => {
   *   const ent = clipFactories.Entrance(element, 'zoomIn', [0.2]);
   *   await ent.play();
   *   // ↑ forwardKeyframesGenerator() will run and produce the Keyframe array
   *   // [{scale: initialScale, opacity: 0}, {scale: 1, opacity: 1}].
   *   // That Keyframe array is used for the animation effect as the clip plays forward.
   * 
   *   await ent.rewind();
   *   // ↑ Since backwardKeyframesGenerator() was not set, the clip will run forwardKeyframesGenerator()
   *   // again and just use its effect in reverse when rewinding (which would be exactly equivalent
   *   // to specifying backwardKeyframesGenerator() and having it return
   *   // [{scale: 1, opacity: 1}, {scale: initialScale, opacity: 0}]).
   *   // In other words, forwardKeyframesGenerator() will run again to produce the Keyframe array
   *   // [{scale: initialScale, opacity: 0}, {scale: 1, opacity: 1}], then
   *   // the Keyframe array is used for the animation effect but set to go in reverse,
   *   // and the effect is used as the clip rewinds.
   * 
   *   const mot = clipFactories.Motion(element, 'translateRight', [756]);
   *   await mot.play();
   *   // ↑ forwardKeyframesGenerator() will run and produce the Keyframes array [{translate: '756px'}].
   *   // That Keyframe array is used for the animation effect as the clip plays.
   * 
   *   await mot.rewind();
   *   // ↑ backwawrdFramesGenerator() will run and produce the Keyframe array [{translate: '-756px'}].
   *   // That Keyframe array is used for the animation effect as the clip rewinds.
   * })();
   * ```
   * <!-- EX:E id="ComposedEffect.keyframe-generators" -->
   * 
   * @group Keyframes Generators
   */
  forwardKeyframesGenerator?: () => Keyframes;
  /**
   * Performs any necessary operations/computations and then returns keyframes ({@link Keyframes}).
   * @returns Keyframes, either in the form of a {@link PropertyIndexedKeyframes} object or—more commonly—an array of {@link Keyframe} objects.
   * @see [Keyframe Formats](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Keyframe_Formats)
   * 
   * @example
   * <!-- EX:S id="ComposedEffect.keyframe-generators" code-type="ts" -->
   * ```ts
   * const clipFactories = webimator.createAnimationClipFactories({
   *   customEntranceEffects: {
   *     // -----------------------------------------------------------------
   *     // ----------------------------EXAMPLE 1----------------------------
   *     // -----------------------------------------------------------------
   *     // Let us pretend you made this custom entrance animation effect named 'zoomIn'.
   *     // For this animation, you wrote the forward keyframes generator and
   *     // then verified that the desired rewinding effect is exactly equivalent
   *     // to playing the keyframes produced by forwardKeyframesGenerator() in reverse,
   *     // so you omit backwardKeyframesGenerator.
   *     zoomIn: {
   *       composeEffect(initialScale: number) {
   *         // return ComposedEffect
   *         return {
   *           forwardKeyframesGenerator: () => {
   *             console.log('About to return keyframes!');
   *             // return Keyframes (Keyframe[])
   *             return [
   *               {scale: initialScale, opacity: 0}, // Keyframe 1
   *               {scale: 1, opacity: 1}             // Keyframe 2
   *             ];
   *           },
   *           // backwardKeyframesGenerator() can be omitted in this case because
   *           // the reversal of the forward frames is exactly equivalent.
   *           // It is written below for demonstration purposes but commented out.
   *           // -----------------------------------------------------------------------
   *           // backwardKeyframesGenerator: () => {
   *           //   // return Keyframes (Keyframe[])
   *           //   return [
   *           //     {scale: 1, opacity: 1},           // Keyframe 1
   *           //     {scale: initialScale, opacity: 0} // Keyframe 2
   *           //   ];
   *           // },
   *         };
   *       }
   *     },
   *   },
   * 
   *   customMotionEffects: {
   *     // -----------------------------------------------------------------
   *     // ----------------------------EXAMPLE 2----------------------------
   *     // -----------------------------------------------------------------
   *     // Let us pretend you made this custom animation effect for moving an element rightward.
   *     // For this animation, you wrote the forward keyframes generator and then
   *     // checked to see if the desired rewinding effect could be achieved by just reusing
   *     // forwardKeyframesGenerator() and reversing the result. You realize that this effect is NOT
   *     // a candidate for that shortcut, so you write backwardKeyframesEffect.
   *     translateRight: {
   *       composeEffect(numPixels: number) {
   *         // a helper function you wrote that will exist within a closure scoped to composeEffect()
   *         const createTranslationString = () => {
   *           if (numPixels <= 0) { throw RangeError(`Number of pixels must exceed 0.`) }
   *           const translationString = `${numPixels}px`;
   *           return translationString;
   *         }
   *   
   *         // return ComposedEffect
   *         return {
   *           forwardKeyframesGenerator: () => {
   *             // return Keyframes (Keyframe[])
   *             return [
   *               {translate: createTranslationString()} // Keyframe
   *             ];
   *           },
   *           // backwardKeyframesGenerator() must be specified because reversing the keyframes produced
   *           // by forwardKeyframesGenerator() would not have the intended effect (because of
   *           // {composite: accumulate}, trying to simply use the reversal of
   *           // {translate: createTranslationString()} from forwardKeyframesGenerator() would actually
   *           // cause the target element to jump an additional numPixels pixels to the right
   *           // before sliding left, which is not the intended rewinding effect).
   *           backwardKeyframesGenerator: () => {
   *             // return Keyframes (Keyframe[])
   *             return [
   *               {translate: '-'+createTranslationString()}, // Keyframe
   *             ];
   *           },
   *         };
   *       },
   *       immutableConfig: {
   *         // this means that the translation is added onto the element's position
   *         // instead of replacing it
   *         composite: 'accumulate',
   *       },
   *       effectCompositionFrequency: 'on-first-play-only',
   *     },
   *   }
   * });
   * 
   * const element = document.querySelector('.some-element');
   * (async () => {
   *   const ent = clipFactories.Entrance(element, 'zoomIn', [0.2]);
   *   await ent.play();
   *   // ↑ forwardKeyframesGenerator() will run and produce the Keyframe array
   *   // [{scale: initialScale, opacity: 0}, {scale: 1, opacity: 1}].
   *   // That Keyframe array is used for the animation effect as the clip plays forward.
   * 
   *   await ent.rewind();
   *   // ↑ Since backwardKeyframesGenerator() was not set, the clip will run forwardKeyframesGenerator()
   *   // again and just use its effect in reverse when rewinding (which would be exactly equivalent
   *   // to specifying backwardKeyframesGenerator() and having it return
   *   // [{scale: 1, opacity: 1}, {scale: initialScale, opacity: 0}]).
   *   // In other words, forwardKeyframesGenerator() will run again to produce the Keyframe array
   *   // [{scale: initialScale, opacity: 0}, {scale: 1, opacity: 1}], then
   *   // the Keyframe array is used for the animation effect but set to go in reverse,
   *   // and the effect is used as the clip rewinds.
   * 
   *   const mot = clipFactories.Motion(element, 'translateRight', [756]);
   *   await mot.play();
   *   // ↑ forwardKeyframesGenerator() will run and produce the Keyframes array [{translate: '756px'}].
   *   // That Keyframe array is used for the animation effect as the clip plays.
   * 
   *   await mot.rewind();
   *   // ↑ backwawrdFramesGenerator() will run and produce the Keyframe array [{translate: '-756px'}].
   *   // That Keyframe array is used for the animation effect as the clip rewinds.
   * })();
   * ```
   * <!-- EX:E id="ComposedEffect.keyframe-generators" -->
   * 
   * @group Keyframes Generators
   */
  backwardKeyframesGenerator?: () => Keyframes;
  /**
   * Performs any necessary operations/computations and then returns a function that will be run on every frame.
   * @returns A function that presumably mutates the target element in some way (possibly with the help of {@link AnimClip.computeTween}) and will automatically be run on every frame. Since it will be run on every frame, it will create the illusion of a smooth animation.
   * @see {@link AnimClip.computeTween}
   * 
   * @example
   * <!-- EX:S id="ComposedEffect.mutator-generators" code-type="ts" -->
   * ```ts
   * const clipFactories = webimator.createAnimationClipFactories({
   *   customMotionEffects: {
   *     // a custom animation for scrolling to a specific point on the page.
   *     scrollTo: {
   *       composeEffect(yPosition: number) {
   *         const initialPosition = this.domElem.scrollTop;
   *   
   *         // return ComposedEffect
   *         return {
   *           // The mutation is to use the scrollTo() method on the element.
   *           // Thanks to computeTween(), there will be a smooth scroll
   *           // from initialPosition to yPosition
   *           forwardMutatorGenerator: () => {
   *             // return Mutator
   *             return () => {
   *               this.domElem.scrollTo({
   *                 top: this.computeTween(initialPosition, yPosition),
   *                 behavior: 'instant'
   *               });
   *             };
   *           },
   * 
   *           // The forward mutation loop is not invertible because reversing it requires
   *           // re-computing the element's scroll position at the time of rewinding
   *           // (which may have since changed for any number of reasons, including user
   *           // scrolling, size changes, etc.). So we must define backwardMutatorGenerator()
   *           // to do exactly that.
   *           backwardMutatorGenerator: () => {
   *             // return Mutator
   *             return () => {
   *               const currentPosition = this.domElem.scrollTop;
   *               this.domElem.scrollTo({
   *                 top: this.computeTween(currentPosition, initialPosition),
   *                 behavior: 'instant'
   *               });
   *             };
   *           },
   *         };
   *       }
   *     },
   *   }
   * });
   * 
   * const element = document.querySelector('.some-element');
   * const mot = clipFactories.Motion(element, 'scrollTo', [1020]);
   * mot.play().then(mot.rewind);
   * ```
   * <!-- EX:E id="ComposedEffect.mutator-generators" -->
   * 
   * @group Mutator Generators
   */
  forwardMutatorGenerator?: () => Mutator;
  /**
   * Performs any necessary operations/computations and then returns a function that will be run on every frame.
   * @returns A function that presumably mutates the target element in some way (possibly with the help of {@link AnimClip.computeTween}) and will automatically be run on every frame. Since it will be run on every frame, it will create the illusion of a smooth animation.
   * @see {@link AnimClip.computeTween}
   * 
   * @example
   * <!-- EX:S id="ComposedEffect.mutator-generators" code-type="ts" -->
   * ```ts
   * const clipFactories = webimator.createAnimationClipFactories({
   *   customMotionEffects: {
   *     // a custom animation for scrolling to a specific point on the page.
   *     scrollTo: {
   *       composeEffect(yPosition: number) {
   *         const initialPosition = this.domElem.scrollTop;
   *   
   *         // return ComposedEffect
   *         return {
   *           // The mutation is to use the scrollTo() method on the element.
   *           // Thanks to computeTween(), there will be a smooth scroll
   *           // from initialPosition to yPosition
   *           forwardMutatorGenerator: () => {
   *             // return Mutator
   *             return () => {
   *               this.domElem.scrollTo({
   *                 top: this.computeTween(initialPosition, yPosition),
   *                 behavior: 'instant'
   *               });
   *             };
   *           },
   * 
   *           // The forward mutation loop is not invertible because reversing it requires
   *           // re-computing the element's scroll position at the time of rewinding
   *           // (which may have since changed for any number of reasons, including user
   *           // scrolling, size changes, etc.). So we must define backwardMutatorGenerator()
   *           // to do exactly that.
   *           backwardMutatorGenerator: () => {
   *             // return Mutator
   *             return () => {
   *               const currentPosition = this.domElem.scrollTop;
   *               this.domElem.scrollTo({
   *                 top: this.computeTween(currentPosition, initialPosition),
   *                 behavior: 'instant'
   *               });
   *             };
   *           },
   *         };
   *       }
   *     },
   *   }
   * });
   * 
   * const element = document.querySelector('.some-element');
   * const mot = clipFactories.Motion(element, 'scrollTo', [1020]);
   * mot.play().then(mot.rewind);
   * ```
   * <!-- EX:E id="ComposedEffect.mutator-generators" -->
   * 
   * @group Mutator Generators
   */
  backwardMutatorGenerator?: () => Mutator;
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
 * @category Effect Generation
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
     * @example
     * <!-- EX:S id="EffectGenerator.defaultConfig" code-type="ts" -->
     * ```ts
     * const clipFactories = webimator.createAnimationClipFactories({
     *   customEntranceEffects: {
     *     // Element fades in, starting from 0 opacity.
     *     fadeIn: {
     *       composeEffect() {
     *         return {
     *           forwardKeyframesGenerator: () => {
     *             return [ {opacity: '0'}, {} ];
     *           },
     *         } as const;
     *       },
     *     },
     * 
     *     fadeIn_default: {
     *       composeEffect() {
     *         return {forwardKeyframesGenerator: () => {
     *           return [ {opacity: '0'}, {} ];
     *         },
     *         } as const;
     *       },
     *       defaultConfig: {
     *         duration: 2000,
     *       },
     *     },
     *   }
     * });
     * 
     * // select element from DOM
     * const element = document.querySelector('.some-element');
     * 
     * const ent1 = clipFactories.Entrance(element, 'fadeIn', [], {});
     * // ↑ duration will be set to whatever the default duration is for all
     * // EntranceClip objects
     * 
     * const ent2 = clipFactories.Entrance(element, 'fadeIn_default', [], {});
     * // ↑ duration will be set to 2000 because that is what was specified in
     * // the 'fadeIn_default' effect definition
     * 
     * const ent3 = clipFactories.Entrance(element, 'fadeIn_default', [], {duration: 1000});
     * // ↑ duration will be set to 1000 because configuration settings set in the
     * // clip factory function call will overwrite any default settings
     * ```
     * <!-- EX:E id="EffectGenerator.defaultConfig" -->
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
     * @example
     * <!-- EX:S id="EffectGenerator.immutableConfig" code-type="ts" -->
     * ```ts
     * const clipFactories = webimator.createAnimationClipFactories({
     *   customEntranceEffects: {
     *     appear: {
     *       composeEffect() {
     *         return {
     *           forwardKeyframesGenerator: () => {
     *             return [];
     *           },
     *         };
     *       },
     *     },
     * 
     *     appear_immutable: {
     *       composeEffect() {
     *         return {
     *           forwardKeyframesGenerator: () => {
     *             return [];
     *           },
     *         };
     *       },
     *       immutableConfig: {
     *         duration: 0,
     *         easing: 'linear',
     *         composite: 'replace',
     *       },
     *     },
     *   }
     * });
     * 
     * // select element from DOM
     * const element = document.querySelector('.some-element');
     * 
     * const ent1 = clipFactories.Entrance(element, 'appear', [], {duration: 1000});
     * // ↑ no issues
     * 
     * const ent2 = clipFactories.Entrance(element, 'appear_immutable', [], {endDelay: 1000});
     * // ↑ no issues (there is no immutable setting on endDelay for 'appear_immutable')
     * 
     * const ent3 = clipFactories.Entrance(element, 'appear_immutable', [], {duration: 1000});
     * // ↑ TypeScript compiler error will be thrown because duration is not allowed to be set
     * // when using the 'appear_immutable' effect. When running the code, this duration will
     * // simply be ignored in favor of the immutable duration setting.
     * ```
     * <!-- EX:E id="EffectGenerator.immutableConfig" -->
     * 
     * @group Clip Configuration
     */
    immutableConfig?: Partial<TConfig>;
    /**
     * Determines how frequently the effect will be composed (i.e., how often {@link EffectGenerator.composeEffect | composeEffect} will be run).
     *  * if `on-every-play`, the effect generator's {@link EffectGenerator.composeEffect | composeEffect} function will run every time
     * the clip plays forward, which creates a new closure and returns a new {@link ComposedEffect}.
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
     * @example
     * <!-- EX:S id="EffectGenerator.effectCompositionFrequency" code-type="ts" -->
     * ```ts
     * // global variable that will be used in the fadeOut_exclusive effect.
     * let usedFadeOutEx = false;
     * 
     * const clipFactories = webimator.createAnimationClipFactories({
     *   customExitEffects: {
     *     // A custom effect you wrote for fading an element out.
     *     // Here, it makes no difference what effectCompositionFrequency is set to.
     *     //
     *     // - If set to 'on-first-play-only', then composeEffect() will run only once
     *     // (on the first play()). Thus, forwardKeyframesGenerator() is defined
     *     // only once and is set to return [{}, {opacity: 0}].
     *     //
     *     // - If set to 'on-every-play', then EVERY time the clip
     *     // plays, composeEffect() plays. Thus, forwardKeyframesGenerator()
     *     // will keep being redefined and set to be a function that
     *     // returns [{}, {opacity: 0}]. It made no difference because 
     *     // the body of forwardKeyframesGenerator() remains the same.
     *     //
     *     // Thus, it makes no difference what effectCompositionFrequency is set to.
     *     fadeOut: {
     *       composeEffect() {
     *         return {
     *           forwardKeyframesGenerator: () => {
     *             return [{}, {opacity: 0}];
     *           },
     *         }
     *       }
     *     },
     * 
     *     // A custom animation effect you made for flying out to the left side of the screen.
     *     // Here, it makes no difference what effectCompositionFrequency is set to.
     *     //
     *     // - If set to 'on-first-play-only', then composeEffect() will run only once. Thus,
     *     // forwardKeyframesGenerator() is defined only once, and the closure containing
     *     // computeTranslationStr() will also only be made once. On every play(),
     *     // forwardKeyframesGenerator() uses computeTranslationStr() to compute
     *     // the translation, so the translation will always be recomputed.
     *     // This is the desired behavior.
     * 
     *     // - If set to 'on-every-play', then every time play() is called to play the clip,
     *     // composeEffect() is called again, creataing a new closure containing a function
     *     // called computeTranslationStr() and returning a new forwardKeyframesGenerator()
     *     // that uses computeTranslationStr() to compute the translation. It makes no
     *     // difference since the bodies of computeTranslationStr() and
     *     // forwardKeyframesGenerator() remain the same, so this is functionally the
     *     // same as the previous paragraph.
     *     // This is the desired behavior.
     *     //
     *     // Thus, it makes no difference what effectCompositionFrequency is set to.
     *     flyOutLeft: {
     *       composeEffect() {
     *         const computeTranslationStr = () => {
     *           // compute distance between right side of element and left side of viewport
     *           const orthogonalDistance = -(this.domElem.getBoundingClientRect().right);
     *           // create translation string
     *           const translationString = `${orthogonalDistance}px 0px`;
     *           return translationString;
     *         }
     *   
     *         return {
     *           forwardKeyframesGenerator: () => {
     *             return [
     *               {translate: computeTranslationStr()}
     *             ];
     *           },
     *           // backwardKeyframesGenerator could have been omitted, but for ease of
     *           // visual understanding, they are kept
     *           backwardKeyframesGenerator: () => {
     *             return [
     *               {translate: computeTranslationStr()},
     *               {translate: `0 0`}
     *             ];
     *           }
     *         };
     *       },
     *       
     *       immutableConfig: {
     *         composite: 'accumulate',
     *       },
     *     },
     * 
     *     // A custom animation effect for flying out either left or right (random).
     *     // Here, effectCompositionFrequency must be set to 'on-every-play'.
     *     //
     *     // - If set to 'on-first-play-only', then leftOrRight is defined only once. Thus,
     *     // once the clip plays for the first time, leftOrRight will be permanently set
     *     // to 'go left' or 'go right' within the closure created by composeEffect(),
     *     // so the element's direction will not be randomized each time.
     *     // This is NOT the desired effect.
     * 
     *     // - If set to 'on-every-play', then every time play() is called to play the clip,
     *     // composeEffect() is called again. The variable leftOrRight is thus recomputed, so
     *     // the result of computeTranslationStr() will be randomly left or right every time
     *     // the clip is played. This is the desired behavior.
     *     //
     *     // The difference is that 'on-every-play' causes the effect to use a fresh
     *     // leftOrRight on each play, while 'on-first-play-only' does not.
     *     flyOutRandom1: {
     *       composeEffect() {
     *         // 50% change of going left or right
     *         const leftOrRight = Math.random() < 0.5 ? 'go left' : 'go right';
     * 
     *         const computeTranslationStr = () => {
     *           // compute distance between right side of element and left side of viewport
     *           const distGoingLeft = -(this.domElem.getBoundingClientRect().right);
     *           // compute distance between left side of element and right side of viewport
     *           const distGoingRight = window.innerWidth - this.domElem.getBoundingClientRect().left;
     *           // choose distance based on leftOrRight
     *           const orthogonalDistance = leftOrRight === 'go left' ? distGoingLeft : distGoingRight;
     *           // create translation string
     *           const translationString = `${orthogonalDistance}px 0px`;
     *           return translationString;
     *         }
     *   
     *         return {
     *           forwardKeyframesGenerator: () => {
     *             return [
     *               {translate: computeTranslationStr()}
     *             ];
     *           },
     *         };
     *       },
     *       
     *       immutableConfig: {
     *         composite: 'accumulate',
     *       },
     *     },
     * 
     *     // A custom animation effect you made for flying out either left or right (random).
     *     // This is exactly the same as flyOutRandom1 except leftOrRight is inside
     *     // computeTranslationStr() instead of the closure of composeEffect().
     *     // Here, it makes no difference what effectCompositionFrequency is set to.
     *     //
     *     // - If set to 'on-first-play-only', then computeTranslationStr() and
     *     // forwardKeyframesGenerator() are created once. forwardKeyframesGenerator()
     *     // uses computeTranslationStr() to compute a new translation string, which
     *     // will randomly either send the element to the left or to the right.
     *     // Since The leftOrRight is computed WITHIN computeTranslationStr(), every
     *     // time forwardKeyframesGenerator() runs, a new random translation string
     *     // will be made, so the element's movement will be randomized each time.
     *     // This is the desired behavior.
     *     //
     *     // - If set to 'on-every-play', then every time play() is called to play the clip,
     *     // composeEffect() is called again. The helper function computeTranslationStr()
     *     // and forwardKeyframesGenerator are redefined each time, but that makes no difference
     *     // since both their function bodies remain the same. This is functionally the exact
     *     // same as the previous paragraph–forwardKeyframesGenerator() will still call
     *     // computeTranslationStr() to recompute the translation every time the clip is played.
     *     // This is the desired effect.
     *     //
     *     // Either option causes leftOrRight to be recomputed on every play.
     *     // Thus, it makes no difference what effectCompositionFrequency is set to.
     *     flyOutRandom2: {
     *       composeEffect() {
     *         const computeTranslationStr = () => {
     *           // 50% change of going left or right
     *           const leftOrRight = Math.random() < 0.5 ? 'go left' : 'go right';
     *           // compute distance between right side of element and left side of viewport
     *           const distGoingLeft = -(this.domElem.getBoundingClientRect().right);
     *           // compute distance between left side of element and right side of viewport
     *           const distGoingRight = window.innerWidth - this.domElem.getBoundingClientRect().left;
     *           // choose distance based on leftOrRight
     *           const orthogonalDistance = leftOrRight === 'go left' ? distGoingLeft : distGoingRight;
     *           // create translation string
     *           const translationString = `${orthogonalDistance}px 0px`;
     *           return translationString;
     *         }
     *   
     *         return {
     *           forwardKeyframesGenerator: () => {
     *             return [
     *               {translate: computeTranslationStr()}
     *             ];
     *           },
     *         };
     *       },
     *       
     *       immutableConfig: {
     *         composite: 'accumulate',
     *       },
     *     },
     * 
     *     // A custom animation effect you made that can only be used by one animation clip
     *     // (Why you would ever do something this is unclear, but the reason does not matter.)
     *     // Here, effectCompositionFrequency must be set to 'on-first-play-only'.
     * 
     *     // - If set to 'on-first-play-only', then the global variable usedFadeOutEx is
     *     // checked for truthiness and then set to true on the first (and only) running of
     *     // composeEffect(). On subsequent calls to play(), composeEffect() does not re-run, so
     *     // the if-condition is not run again. However, any OTHER clip that uses the fadeOut_exclusive
     *     // effect will fail on their first play() because they need to run composeEffect() for
     *     // the first time and will throw the error (because usedFadeOutEx is already set to true).
     *     // This is the desired behavior.
     *     //
     *     // If set to 'on-every-play', then composeEffect() will run on every play(). Thus,
     *     // playing the same clip twice will always cause an error because it will run into
     *     // the if-conditional again after usedFadeOutEx is already set to true, which is
     *     // NOT the desired behavior.
     *     //
     *     // The difference is that 'on-first-play-only' causes the if-conditional to run
     *     // only once, while 'on-every-play' causes it to be encountered a second time.
     *     fadeOut_exclusive: {
     *       composeEffect() {
     *         if (usedFadeOutEx) {
     *           throw new Error(`Only one clip is allowed to use the 'fadeOut_exclusive' effect.`);
     *         }
     *         usedFadeOutEx = true;
     *   
     *         return {
     *           forwardKeyframesGenerator: () => {
     *             return [ {}, {opacity: 0} ];
     *           },
     *         };
     *       },
     * 
     *       effectCompositionFrequency: 'on-first-play-only',
     *     },
     *   }
     * });
     * ```
     * <!-- EX:E id="EffectGenerator.effectCompositionFrequency" -->
     * 
     * @group Effect Composition
     */
    effectCompositionFrequency?: 'on-first-play-only' | 'on-every-play';
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
     * The `forwardKeyframesGenerator()` (if exists) and `forwardMutatorGenerator()` (if exists) callbacks are called to
     * produce the forward effect, and then the clip plays, using that animation effect.
     * 
     * ```ts
     * ent.rewind();
     * ```
     * ↑ The `backwardKeyframesGenerator()` (if exists) and `backwardMutatorGenerator()` (if exists) callbacks are called to
     * produce the backward effect, and then the clip rewinds, using that animation effect.
     * 
     * ```ts
     * ent.play();
     * ```
     * ↑ `composeEffect()` runs for the second time, producing a new `ComposedEffect` that contains up to 4 callbacks.
     * The `forwardKeyframesGenerator()` (if exists) and `forwardMutatorGenerator()` (if exists) callbacks are called to
     * produce the forward effect, and then the clip plays, using that animation effect.
     * 
     * Behind the scenes, the animation inside an animation clip does not actually simply play on `play()` and rewind on
     * `rewind()`—that is just an API abstraction. On `play()`, yes, the internal animation's keyframes are set to the result
     * of `forwardKeyframesGenerator()`, and then the animation is played (as expected). But on `rewind()`, the internal animation's
     * keyframes are set to the result of `backwardKeyframesGenerator()`, and then the internal animation is played again, _not_ rewound.
     * From the outside, it of course feels functionally the same as rewinding because it is playing with keyframes that are meant to undo the
     * forward frames.
     * Thus, when a clip is played with `play()` and rewound with `rewind()`, the internal animation is actually swapping between
     * the forward and backward frames and then playing. A similar principle holds for
     * `forwardMutatorGenerator()` and `backwardMutatorGenerator()`.
     * 
     * This design makes it possible to define more sophisticated animations that can account for dynamic factors like screen size,
     * shifting elements, etc. Sometimes, the semantics of an animation are impossible unless the backward generation is specially made, so
     * we allow the backward effect to be defined independently of the forward effect.
     * However, for effects that do not require this (likely the majority of them) (i.e., effects where the desired rewinding
     * effect could be achieved by simply re-running `forwardKeyframesGenerator()`, taking the resulting keyframes, and then playing
     * the internal animation with its direction reversed), the backward generator can be omitted. We can say that the
     * forward generator, or `forwardKeyframesGenerator()`, is "invertible".
     * The same allowance holds true for the mutator generators. It is up to you, however, to test whether your custom animations
     * do or don't need specially written backward generators.
     * 
     * @example
     * <!-- EX:S id="EffectGenerator.composeEffect-1" code-type="ts" -->
     * ```ts
     * // EXAMPLES WHERE OMISSIONS ARE VALID
     * const clipFactories = webimator.createAnimationClipFactories({
     *   customEntranceEffects: {
     *     // Element shyly enters, hesitantly fading and scaling in and out until it
     *     // reaches full opacity and scale
     *     shyIn: {
     *       composeEffect() {
     *         // return ComposedEffect
     *         return {
     *           forwardKeyframesGenerator: () => {
     *             // return Keyframes (PropertyIndexedKeyframes)
     *             return {
     *               opacity: [0, 0.5, 0.1, 0.7, 0, 1],
     *               scale: [0, 0.5, 0.1, 0.7, 0, 1],
     *             };
     *           },
     *           // The desired rewinding effect is equivalent to using the forward frames generator
     *           // and reversing the output, so backwardKeyframesGenerator() can be omitted. But if you did
     *           // not realize this, you could just specify it anyway, it would simply look like this:
     *           // ---------------------------------------------------------------------------------------
     *           // backwardKeyframesGenerator: () => {
     *           //   // return Keyframes (PropertyIndexedKeyframes) 
     *           //   return {
     *           //     opacity: [1, 0, 0.7, 0.1, 0.5, 0],
     *           //     scale: [1, 0, 0.7, 0.1, 0.5, 0],
     *           //   };
     *           // },
     *         };
     *       }
     *     },
     * 
     *     // Replicates PowerPoint's Rise Up animation.
     *     // Element flies in from the bottom of the screen and ends up
     *     // slightly too high, then settles down to its final position.
     *     riseUp: {
     *       composeEffect() {
     *         // return Composed Effect
     *         return {
     *           forwardKeyframesGenerator: () => {
     *             // return Keyframes (Keyframe[])
     *             return [
     *               {
     *                 translate: `0 ${window.innerHeight - this.domElem.getBoundingClientRect().top}px`,
     *                 opacity: 0,
     *                 easing: useEasing('power2-out')
     *               },
     *               {
     *                 translate: `0 -25px`,
     *                 offset: 0.83333
     *               },
     *               {
     *                 translate: `0 -25px`,
     *                 offset: 0.86,
     *                 easing: useEasing('power1-in')
     *               },
     *               {translate: `0 0`},
     *             ];
     *           },
     *           // It would be a pain to figure out what the backward keyframes should look like 
     *           // for rewinding this effect. Fortunately, the desired rewinding effect happens to
     *           // be equivalent to re-using forwardKeyframesGenerator() and using its reverse,
     *           // so backwardKeyframesGenerator() can be omitted.
     *           // ---------------------------------------------------------------------------------------
     *           // backwardKeyframesGenerator: () => {
     *           //   // return Keyframes (Keyframe[])
     *           //   return [] // ??????
     *           // },
     *         };
     *       },
     *       defaultConfig: {
     *         composite: 'accumulate',
     *       } as const,
     *       immutableConfig: {} as const,
     *       effectCompositionFrequency: 'on-first-play-only',
     *     },
     *   },
     * 
     *   customExitEffects: {
     *     // Replicates PowerPoint's Sink Down animation, which is the opposite of Rise Up.
     *     // Element floats up slightly and then accelerates to the bottom of the screen.
     *     sinkDown: {
     *       composeEffect() {
     *         // return Composed Effect
     *         return {
     *           // Most of the time, when you write your own custom entrance/exit effect, you will want
     *           // to write the corresponding exit/entrance effect. If you write flyIn, you'll probably
     *           // write flyOut; if you write slideOut, you'll probably write slideIn; if you write riseUp,
     *           // you'll probably write sinkDown. The beauty is that if riseUp and sinkDown are opposites,
     *           // then we know that playing riseUp should be the same as rewinding sinkDown. Therefore,
     *           // we can copy-paste the logic from riseUp's forwardKeyframesGenerator() and use it for
     *           // sinkDown's backwardKeyframesGenerator(). Since we know the effect is invertible already,
     *           // we do not have to specify forwardKeyframesGenerator() here. Once gain, we have gotten
     *           // away with just figuring out only 1 set of keyframes without having
     *           // to figure out what the other set looks like.
     *           // ---------------------------------------------------------------------------------------
     *           // forwardKeyframesGenerator: () => {
     *           //   // return Keyframes (Keyframe[])
     *           //   return [] // ??????
     *           // },
     * 
     *           backwardKeyframesGenerator: () => {
     *             // return Keyframes (Keyframe[])
     *             return [
     *               {
     *                 translate: `0 ${window.innerHeight - this.domElem.getBoundingClientRect().top}px`,
     *                 opacity: 0,
     *                 easing: useEasing('power2-out')
     *               },
     *               {
     *                 translate: `0 -25px`,
     *                 offset: 0.83333
     *               },
     *               {
     *                 translate: `0 -25px`,
     *                 offset: 0.86,
     *                 easing: useEasing('power1-in')
     *               },
     *               {translate: `0 0`},
     *             ];
     *           },
     *         };
     *       },
     *       defaultConfig: {
     *         composite: 'accumulate',
     *       } as const,
     *       immutableConfig: {} as const,
     *       effectCompositionFrequency: 'on-first-play-only',
     *     },
     * 
     *     // a custom animation effect for flying out to the left side of the screen
     *     // while displaying the percentage progress in the element's text content
     *     flyOutLeft: {
     *       composeEffect() {
     *         const computeTranslationStr = () => {
     *           const orthogonalDistance = -(this.domElem.getBoundingClientRect().right);
     *           const translationString = `${orthogonalDistance}px 0px`;
     *           return translationString;
     *         }
     *   
     *         // return ComposedEffect
     *         return {
     *           forwardKeyframesGenerator: () => {
     *             // return Keyframes (Keyframe[])
     *             return [
     *               {translate: computeTranslationStr()}
     *             ];
     *           },
     * 
     *           // backwardKeyframesGenerator() can be omitted because the result of running
     *           // forwardKeyframesGenerator() again and reversing its output keyframes produces
     *           // the same desired rewinding effect in this case. But if you were not aware
     *           // of this, you could just define it anyway, and it would look like the code below
     *           // (commented out).
     *           // --------------------------------------------------------------------------------------
     *           // backwardKeyframesGenerator: () => {
     *           //   // return Keyframes (Keyframe[])
     *           //   return [
     *           //     {translate: computeTranslationStr()},
     *           //     {translate: `0 0`}
     *           //   ];
     *           // },
     * 
     *           forwardMutatorGenerator: () => {
     *             // return Mutator
     *             return () => {
     *               this.domElem.textContent = `${this.computeTween(0, 100)}%`;
     *             };
     *           },
     * 
     *           // backwardMutatorGenerator can be omitted because the mutator formed by
     *           // forwardMutatorGenerator() here is invertible. But if you were not aware of this,
     *           // you could just define it anyway, and it would look like the code below (commented out).
     *           // --------------------------------------------------------------------------------------
     *           // backwardMutatorGenerator: () => {
     *           //   // return Mutator
     *           //   return () => {
     *           //     this.domElem.textContent = `${this.computeTween(100, 0)}%`;
     *           //   };
     *           // },
     *         };
     *       },
     *       defaultConfig: {
     *         duration: 1000,
     *         easing: "ease-in",
     *       },
     *       immutableConfig: {
     *         // this means that the translation is added onto the element's position
     *         // instead of replacing it
     *         composite: 'accumulate',
     *       }
     *     },
     *   },
     * });
     * ```
     * <!-- EX:E id="EffectGenerator.composeEffect-1" -->
     * 
     * @example
     * <!-- EX:S id="EffectGenerator.composeEffect-2" code-type="ts" -->
     * ```ts
     * // EXAMPLES WHERE OMISSIONS ARE INVALID
     * const clipFactories = webimator.createAnimationClipFactories({
     *   customMotionEffects: {
     *     translateRight: {
     *       composeEffect(numPixels: number) {
     *         // a helper function you wrote that will exist within a closure scoped to composeEffect()
     *         const createTranslationString = () => {
     *           if (numPixels <= 0) { throw RangeError(`Number of pixels must exceed 0.`) }
     *           const translationString = `${numPixels}px`;
     *           return translationString;
     *         }
     *   
     *         // return ComposedEffect
     *         return {
     *           forwardKeyframesGenerator: () => {
     *             // return Keyframes (Keyframe][])
     *             return [
     *               {translate: createTranslationString()} // Keyframe
     *             ];
     *           },
     *           // backwardKeyframesGenerator() must be specified because reversing the keyframes produced
     *           // by forwardKeyframesGenerator() would not have the intended effect (because of
     *           // {composite: accumulate}, trying to simply use the reversal of
     *           // {translate: createTranslationString()} from forwardKeyframesGenerator() would actually
     *           // cause the target element to jump an additional numPixels pixels to the right
     *           // before sliding left, which is not the intended rewinding effect).
     *           backwardKeyframesGenerator: () => {
     *             // return Keyframes (Keyframe[])
     *             return [
     *               {translate: '-'+createTranslationString()}, // Keyframe
     *             ];
     *           }
     *         };
     *       },
     *       immutableConfig: {
     *         // this means that the translation is added onto the element's position
     *         // instead of replacing it
     *         composite: 'accumulate',
     *       },
     *       effectCompositionFrequency: 'on-first-play-only',
     *     },
     * 
     *     // a custom animation for scrolling to a specific point on the page.
     *     scrollTo: {
     *       composeEffect(yPosition: number) {
     *         const initialPosition = this.domElem.scrollTop;
     *   
     *         // return ComposedEffect
     *         return {
     *           // The mutation is to use the scrollTo() method on the element.
     *           // Thanks to computeTween(), there will be a smooth scroll
     *           // from initialPosition to yPosition
     *           forwardMutatorGenerator: () => {
     *             // return Mutator
     *             return () => {
     *               this.domElem.scrollTo({
     *                 top: this.computeTween(initialPosition, yPosition),
     *                 behavior: 'instant'
     *               });
     *             };
     *           },
     * 
     *           // The forward mutation loop is not invertible because reversing it requires
     *           // re-computing the element's scroll position at the time of rewinding
     *           // (which may have since changed for any number of reasons, including user
     *           // scrolling, size changes, etc.). So we must define backwardMutatorGenerator()
     *           // to do exactly that.
     *           backwardMutatorGenerator: () => {
     *             // return Mutator
     *             return () => {
     *               const currentPosition = this.domElem.scrollTop;
     *               this.domElem.scrollTo({
     *                 top: this.computeTween(currentPosition, initialPosition),
     *                 behavior: 'instant'
     *               });
     *             };
     *           }
     *         };
     *       }
     *     },
     *   }
     * });
     * ```
     * <!-- EX:E id="EffectGenerator.composeEffect-2" -->
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
 * 
 * @category Effect Generation
 */
export type EffectGeneratorBank<TClip extends AnimClip = AnimClip> = ReadonlyRecord<
  string, EffectGenerator<ReadonlyPick<TClip, 'domElem' | 'getEffectDetails' | 'getStatus'>, Layer3MutableClipConfig<TClip>>
>;

/**
 * The parameters for a specific {@link EffectGenerator}'s generator function.
 * 
 * @category Effect Generation
 */
export type EffectOptions<TEffectGenerator extends EffectGenerator> = Parameters<TEffectGenerator['composeEffect']>;

// CHANGE NOTE: EffectNameIn now handles keyof and Extract
// extracts only those strings in an object whose paired value is an EffectGenerator
/**
 * Detects the keys corresponding to {@link EffectGenerator} entries within an {@link EffectGeneratorBank}. 
 * @category Utility Types
 */
export type EffectNameIn<TGeneratorBank extends EffectGeneratorBank> = Exclude<keyof {
  [key in keyof TGeneratorBank as TGeneratorBank[key] extends EffectGenerator ? key : never]: TGeneratorBank[key];
}, number | symbol>;/** @ignore */
