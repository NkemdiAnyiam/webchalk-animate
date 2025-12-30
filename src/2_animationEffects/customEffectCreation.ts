import { AnimClip } from "../1_playbackStructures/AnimationClip";
import { EmphasisClip, EntranceClip, ExitClip, MotionClip } from "../1_playbackStructures/AnimationClipCategories";
import { Keyframes, Mutator } from "../4_utils/interfaces";
import { StripDuplicateMethodAutocompletion, ReadonlyPick, ReadonlyRecord, StrictPropertyCheck, StrictReturnPropertyCheck, PrettifyCustomError, ErrorCheckJoiner } from "../4_utils/utilityTypes";
import { AnimClipConfig } from "../1_playbackStructures/AnimationClip";
import { webchalk } from "../WebChalk";
import { deepFreeze } from "../4_utils/helpers";
import { DEFAULT_CONFIG_ERROR, IMMUTABLE_CONFIG_ERROR, EFFECT_FRAME_GENERATORS_RETURN_ERROR_PRIMITIVE, EFFECT_FRAME_GENERATORS_RETURN_ERROR_PROPERTIES, EFFECT_FRAME_GENERATORS_RETURN_ERROR_KEYFRAMES_RW, EFFECT_FRAME_GENERATORS_RETURN_ERROR_MUTATOR_RW } from "../4_utils/errors";

/**
 * Object containing up to 4 callback functions that will be called to
 * produce the effect for an animation clip. Returned by {@link PresetEffectDefinition.buildFrameGenerators}.
 *  * {@link EffectFrameGeneratorSet.keyframesGenerator_play | keyframesGenerator_play} will run every time the clip is played,
 * producing a {@link Keyframes} object.
 *  * {@link EffectFrameGeneratorSet.keyframesGenerator_rewind | keyframesGenerator_rewind} will run every time the clip is rewound,
 * producing a {@link Keyframes} object.
 *    * If the backward generator is omitted, the forward generator will be used again instead, and the result will just be played in reverse.
 * It is up to you to check whether the animation effect is valid if this shortcut is taken.
 *  * {@link EffectFrameGeneratorSet.mutatorGenerator_play | mutatorGenerator_play} will run every time the clip is played,
 * producing a {@link Mutator} function.
 *  * {@link EffectFrameGeneratorSet.mutatorGenerator_rewind | mutatorGenerator_rewind} will run every time the clip is rewound,
 * producing a {@link Mutator} function.
 *    * If the backward generator is omitted, the backward generator will be used again instead, and the result will just be reversed.
 * It is up to you to check whether the animation effect is valid if this shortcut is taken.
 * 
 * @see {@link PresetEffectDefinition.buildFrameGenerators}
 * 
 * @category Effect Definition
 */
export interface EffectFrameGeneratorSet extends StripDuplicateMethodAutocompletion<{
  /**
   * Performs any necessary operations/computations and then returns keyframes ({@link Keyframes}).
   * @returns Keyframes, either in the form of a {@link PropertyIndexedKeyframes} object or—more commonly—an array of {@link Keyframe} objects.
   * @see [Keyframe Formats](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Keyframe_Formats)
   * 
   * @example
   * <!-- EX:S id="EffectFrameGeneratorSet.keyframes-generators" code-type="ts" -->
   * ```ts
   * const clipFactories = webchalk.createAnimationClipFactories({
   *   additionalEntranceEffects: {
   *     // -----------------------------------------------------------------
   *     // ----------------------------EXAMPLE 1----------------------------
   *     // -----------------------------------------------------------------
   *     // Let us pretend you made this preset entrance animation effect named 'zoomIn'.
   *     // For this animation, you wrote the forward keyframes generator and
   *     // then verified that the desired rewinding effect is exactly equivalent
   *     // to playing the keyframes produced by keyframesGenerator_play() in reverse,
   *     // so you omit keyframesGenerator_rewind.
   *     zoomIn: {
   *       buildFrameGenerators(initialScale: number) {
   *         // return EffectFrameGeneratorSet
   *         return {
   *           keyframesGenerator_play: () => {
   *             console.log('About to return keyframes!');
   *             // return Keyframes (Keyframe[])
   *             return [
   *               {scale: initialScale, opacity: 0}, // Keyframe 1
   *               {}                                 // Keyframe 2
   *             ];
   *           },
   *           // keyframesGenerator_rewind() can be omitted in this case because
   *           // the reversal of the forward keyframes is exactly equivalent.
   *           // It is written below for demonstration purposes but commented out.
   *           // -----------------------------------------------------------------------
   *           // keyframesGenerator_rewind: () => {
   *           //   // return Keyframes (Keyframe[])
   *           //   return [
   *           //     {},                               // Keyframe 1
   *           //     {scale: initialScale, opacity: 0} // Keyframe 2
   *           //   ];
   *           // },
   *         };
   *       }
   *     },
   *   },
   * 
   *   additionalMotionEffects: {
   *     // -----------------------------------------------------------------
   *     // ----------------------------EXAMPLE 2----------------------------
   *     // -----------------------------------------------------------------
   *     // Let us pretend you made this preset animation effect for moving an element rightward.
   *     // For this animation, you wrote the forward keyframes generator and then
   *     // checked to see if the desired rewinding effect could be achieved by just reusing
   *     // keyframesGenerator_play() and reversing the result. You realize that this effect is NOT
   *     // a candidate for that shortcut, so you write backwardKeyframesEffect.
   *     translateRight: {
   *       buildFrameGenerators(numPixels: number) {
   *         // a helper function you wrote that will exist within a closure scoped to buildFrameGenerators()
   *         const createTranslationString = () => {
   *           if (numPixels <= 0) { throw RangeError(`Number of pixels must exceed 0.`) }
   *           const translationString = `${numPixels}px`;
   *           return translationString;
   *         }
   *   
   *         // return EffectFrameGeneratorSet
   *         return {
   *           keyframesGenerator_play: () => {
   *             // return Keyframes (Keyframe[])
   *             return [
   *               {translate: createTranslationString()} // Keyframe
   *             ];
   *           },
   *           // keyframesGenerator_rewind() must be specified because reversing the keyframes produced
   *           // by keyframesGenerator_play() would not have the intended effect (because of
   *           // {composite: accumulate}, trying to simply use the reversal of
   *           // {translate: createTranslationString()} from keyframesGenerator_play() would actually
   *           // cause the target element to jump an additional numPixels pixels to the right
   *           // before sliding left, which is not the intended rewinding effect).
   *           keyframesGenerator_rewind: () => {
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
   *       howOftenBuildGenerators: 'on-first-play-only',
   *     },
   *   }
   * });
   * 
   * const element = document.querySelector('.some-element');
   * (async () => {
   *   const ent = clipFactories.Entrance(element, 'zoomIn', [0.2]);
   *   await ent.play();
   *   // ↑ keyframesGenerator_play() will run and produce the Keyframe array
   *   // [{scale: initialScale, opacity: 0}, {scale: 1, opacity: 1}].
   *   // That Keyframe array is used for the animation effect as the clip plays forward.
   * 
   *   await ent.rewind();
   *   // ↑ Since keyframesGenerator_rewind() was not set, the clip will run keyframesGenerator_play()
   *   // again and just use its effect in reverse when rewinding (which would be exactly equivalent
   *   // to specifying keyframesGenerator_rewind() and having it return
   *   // [{}, {scale: initialScale, opacity: 0}]).
   *   // In other words, keyframesGenerator_play() will run again to produce the Keyframe array
   *   // [{scale: initialScale, opacity: 0}, {}], then
   *   // the Keyframe array is used for the animation effect but set to go in reverse,
   *   // and the effect is used as the clip rewinds.
   * 
   *   const mot = clipFactories.Motion(element, 'translateRight', [756]);
   *   await mot.play();
   *   // ↑ keyframesGenerator_play() will run and produce the Keyframes array [{translate: '756px'}].
   *   // That Keyframe array is used for the animation effect as the clip plays.
   * 
   *   await mot.rewind();
   *   // ↑ backwardFramesGenerator() will run and produce the Keyframe array [{translate: '-756px'}].
   *   // That Keyframe array is used for the animation effect as the clip rewinds.
   * })();
   * ```
   * <!-- EX:E id="EffectFrameGeneratorSet.keyframes-generators" -->
   * 
   * @group Keyframes Generators
   */
  keyframesGenerator_play?: () => Keyframes;
  /**
   * Performs any necessary operations/computations and then returns keyframes ({@link Keyframes}).
   * @returns Keyframes, either in the form of a {@link PropertyIndexedKeyframes} object or—more commonly—an array of {@link Keyframe} objects.
   * @see [Keyframe Formats](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Keyframe_Formats)
   * 
   * @example
   * <!-- EX:S id="EffectFrameGeneratorSet.keyframes-generators" code-type="ts" -->
   * ```ts
   * const clipFactories = webchalk.createAnimationClipFactories({
   *   additionalEntranceEffects: {
   *     // -----------------------------------------------------------------
   *     // ----------------------------EXAMPLE 1----------------------------
   *     // -----------------------------------------------------------------
   *     // Let us pretend you made this preset entrance animation effect named 'zoomIn'.
   *     // For this animation, you wrote the forward keyframes generator and
   *     // then verified that the desired rewinding effect is exactly equivalent
   *     // to playing the keyframes produced by keyframesGenerator_play() in reverse,
   *     // so you omit keyframesGenerator_rewind.
   *     zoomIn: {
   *       buildFrameGenerators(initialScale: number) {
   *         // return EffectFrameGeneratorSet
   *         return {
   *           keyframesGenerator_play: () => {
   *             console.log('About to return keyframes!');
   *             // return Keyframes (Keyframe[])
   *             return [
   *               {scale: initialScale, opacity: 0}, // Keyframe 1
   *               {}                                 // Keyframe 2
   *             ];
   *           },
   *           // keyframesGenerator_rewind() can be omitted in this case because
   *           // the reversal of the forward keyframes is exactly equivalent.
   *           // It is written below for demonstration purposes but commented out.
   *           // -----------------------------------------------------------------------
   *           // keyframesGenerator_rewind: () => {
   *           //   // return Keyframes (Keyframe[])
   *           //   return [
   *           //     {},                               // Keyframe 1
   *           //     {scale: initialScale, opacity: 0} // Keyframe 2
   *           //   ];
   *           // },
   *         };
   *       }
   *     },
   *   },
   * 
   *   additionalMotionEffects: {
   *     // -----------------------------------------------------------------
   *     // ----------------------------EXAMPLE 2----------------------------
   *     // -----------------------------------------------------------------
   *     // Let us pretend you made this preset animation effect for moving an element rightward.
   *     // For this animation, you wrote the forward keyframes generator and then
   *     // checked to see if the desired rewinding effect could be achieved by just reusing
   *     // keyframesGenerator_play() and reversing the result. You realize that this effect is NOT
   *     // a candidate for that shortcut, so you write backwardKeyframesEffect.
   *     translateRight: {
   *       buildFrameGenerators(numPixels: number) {
   *         // a helper function you wrote that will exist within a closure scoped to buildFrameGenerators()
   *         const createTranslationString = () => {
   *           if (numPixels <= 0) { throw RangeError(`Number of pixels must exceed 0.`) }
   *           const translationString = `${numPixels}px`;
   *           return translationString;
   *         }
   *   
   *         // return EffectFrameGeneratorSet
   *         return {
   *           keyframesGenerator_play: () => {
   *             // return Keyframes (Keyframe[])
   *             return [
   *               {translate: createTranslationString()} // Keyframe
   *             ];
   *           },
   *           // keyframesGenerator_rewind() must be specified because reversing the keyframes produced
   *           // by keyframesGenerator_play() would not have the intended effect (because of
   *           // {composite: accumulate}, trying to simply use the reversal of
   *           // {translate: createTranslationString()} from keyframesGenerator_play() would actually
   *           // cause the target element to jump an additional numPixels pixels to the right
   *           // before sliding left, which is not the intended rewinding effect).
   *           keyframesGenerator_rewind: () => {
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
   *       howOftenBuildGenerators: 'on-first-play-only',
   *     },
   *   }
   * });
   * 
   * const element = document.querySelector('.some-element');
   * (async () => {
   *   const ent = clipFactories.Entrance(element, 'zoomIn', [0.2]);
   *   await ent.play();
   *   // ↑ keyframesGenerator_play() will run and produce the Keyframe array
   *   // [{scale: initialScale, opacity: 0}, {scale: 1, opacity: 1}].
   *   // That Keyframe array is used for the animation effect as the clip plays forward.
   * 
   *   await ent.rewind();
   *   // ↑ Since keyframesGenerator_rewind() was not set, the clip will run keyframesGenerator_play()
   *   // again and just use its effect in reverse when rewinding (which would be exactly equivalent
   *   // to specifying keyframesGenerator_rewind() and having it return
   *   // [{}, {scale: initialScale, opacity: 0}]).
   *   // In other words, keyframesGenerator_play() will run again to produce the Keyframe array
   *   // [{scale: initialScale, opacity: 0}, {}], then
   *   // the Keyframe array is used for the animation effect but set to go in reverse,
   *   // and the effect is used as the clip rewinds.
   * 
   *   const mot = clipFactories.Motion(element, 'translateRight', [756]);
   *   await mot.play();
   *   // ↑ keyframesGenerator_play() will run and produce the Keyframes array [{translate: '756px'}].
   *   // That Keyframe array is used for the animation effect as the clip plays.
   * 
   *   await mot.rewind();
   *   // ↑ backwardFramesGenerator() will run and produce the Keyframe array [{translate: '-756px'}].
   *   // That Keyframe array is used for the animation effect as the clip rewinds.
   * })();
   * ```
   * <!-- EX:E id="EffectFrameGeneratorSet.keyframes-generators" -->
   * 
   * @group Keyframes Generators
   */
  keyframesGenerator_rewind?: () => Keyframes;
  /**
   * Performs any necessary operations/computations and then returns a function that will be run on every frame.
   * @returns A function that presumably mutates the target element in some way (possibly with the help of {@link AnimClip.computeTween}) and will automatically be run on every frame. Since it will be run on every frame, it will create the illusion of a smooth animation.
   * @see {@link AnimClip.computeTween}
   * 
   * @example
   * <!-- EX:S id="EffectFrameGeneratorSet.mutator-generators" code-type="ts" -->
   * ```ts
   * const clipFactories = webchalk.createAnimationClipFactories({
   *   additionalMotionEffects: {
   *     // a preset animation effect for scrolling to a specific point on the page.
   *     scrollTo: {
   *       buildFrameGenerators(yPosition: number) {
   *         const initialPosition = this.domElem.scrollTop;
   *   
   *         // return EffectFrameGeneratorSet
   *         return {
   *           // The mutation is to use the scrollTo() method on the element.
   *           // Thanks to computeTween(), there will be a smooth scroll
   *           // from initialPosition to yPosition
   *           mutatorGenerator_play: () => {
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
   *           // scrolling, size changes, etc.). So we must define mutatorGenerator_rewind()
   *           // to do exactly that.
   *           mutatorGenerator_rewind: () => {
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
   * <!-- EX:E id="EffectFrameGeneratorSet.mutator-generators" -->
   * 
   * @group Mutator Generators
   */
  mutatorGenerator_play?: () => Mutator;
  /**
   * Performs any necessary operations/computations and then returns a function that will be run on every frame.
   * @returns A function that presumably mutates the target element in some way (possibly with the help of {@link AnimClip.computeTween}) and will automatically be run on every frame. Since it will be run on every frame, it will create the illusion of a smooth animation.
   * @see {@link AnimClip.computeTween}
   * 
   * @example
   * <!-- EX:S id="EffectFrameGeneratorSet.mutator-generators" code-type="ts" -->
   * ```ts
   * const clipFactories = webchalk.createAnimationClipFactories({
   *   additionalMotionEffects: {
   *     // a preset animation effect for scrolling to a specific point on the page.
   *     scrollTo: {
   *       buildFrameGenerators(yPosition: number) {
   *         const initialPosition = this.domElem.scrollTop;
   *   
   *         // return EffectFrameGeneratorSet
   *         return {
   *           // The mutation is to use the scrollTo() method on the element.
   *           // Thanks to computeTween(), there will be a smooth scroll
   *           // from initialPosition to yPosition
   *           mutatorGenerator_play: () => {
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
   *           // scrolling, size changes, etc.). So we must define mutatorGenerator_rewind()
   *           // to do exactly that.
   *           mutatorGenerator_rewind: () => {
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
   * <!-- EX:E id="EffectFrameGeneratorSet.mutator-generators" -->
   * 
   * @group Mutator Generators
   */
  mutatorGenerator_rewind?: () => Mutator;
  /**
   * If `true`, the effect specified by the keyframes generators will be reversed.
   * * This is convenient when you want to create the opposite of another previously defined effect
   * 
   * @group Keyframes Generators
   */
  reverseKeyframesEffect?: boolean;
  /**
   * If `true`, the effect specified by the mutator generators will be reversed.
   * * This is convenient when you want to create the opposite of another previously defined effect
   * 
   * @group Mutator Generators
   */
  reverseMutatorEffect?: boolean;
}> {}

// TODO: add code examples
/**
 * Object representing an entry in a {@link PresetEffectBank}. It contains
 *  * a function for composing an animation effect
 *  * two properties that can be used to specify clip configuration settings
 *    * one property contains default configuration settings
 *    * the other property contains immutable configuration settings
 *  * a property that sets how often the effect frame generator builder should be run
 * 
 * @category Effect Definition
 * 
 * @interface
 */
export type PresetEffectDefinition<TClipContext extends unknown = unknown, TConfig extends unknown = unknown> = Readonly<StripDuplicateMethodAutocompletion<
  {
    /**
     * Object containing default configuration options that are appropriate for the effect. These options can be overwritten
     * while calling the clip factory function. This makes it convenient to rely on some preset behaviors that make sense
     * without having to set them in a clip factory function.
     * 
     * When defining preset effects, the configuration options that you are allowed to set here may be limited by the {@link AnimClip}
     * value for {@link AnimClip.categoryImmutableConfig} (which you cannot modify). For example, for exit animation clips,
     * {@link ExitClip.categoryImmutableConfig} sets a value for `commitsStyles`, so you cannot set a value for `commitsStyles` in
     * {@link PresetEffectDefinition.defaultConfig | defaultConfig} for any entries in the exit effects bank.
     * 
     * @example
     * <!-- EX:S id="PresetEffectDefinition.defaultConfig" code-type="ts" -->
     * ```ts
     * const clipFactories = webchalk.createAnimationClipFactories({
     *   additionalEntranceEffects: {
     *     // Element fades in, starting from 0 opacity.
     *     fadeIn: {
     *       buildFrameGenerators() {
     *         return {
     *           keyframesGenerator_play: () => {
     *             return [ {opacity: '0'}, {} ];
     *           },
     *         } as const;
     *       },
     *     },
     * 
     *     fadeIn_default: {
     *       buildFrameGenerators() {
     *         return {keyframesGenerator_play: () => {
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
     * <!-- EX:E id="PresetEffectDefinition.defaultConfig" -->
     * 
     * @group Clip Configuration
     */
    defaultConfig?: Partial<TConfig> & object; // "& object" for some reason ensures custom errors will display for cases where ONLY invalid properties are provided
    /**
     * Object containing immutable configuration options for the effect that are appropriate for the effect.
     * These options _cannot_ be overwritten while calling the clip factory function). 
     * This makes it possible to set in stone some expected behaviors of clips that use certain effects.
     * 
     * When creating custom effects, the configuration options that you are allowed to set here may be limited by the {@link AnimClip}
     * value for {@link AnimClip.categoryImmutableConfig} (which you cannot modify). For example, for exit animation clips,
     * {@link ExitClip.categoryImmutableConfig} sets a value for `commitsStyles`, so you cannot set a value for `commitsStyles` in
     * {@link PresetEffectDefinition.immutableConfig | immutableConfig} for any entries in the exit effects bank.
     * 
     * @example
     * <!-- EX:S id="PresetEffectDefinition.immutableConfig" code-type="ts" -->
     * ```ts
     * const clipFactories = webchalk.createAnimationClipFactories({
     *   additionalEntranceEffects: {
     *     appear: {
     *       buildFrameGenerators() {
     *         return {
     *           keyframesGenerator_play: () => {
     *             return [];
     *           },
     *         };
     *       },
     *     },
     * 
     *     appear_immutable: {
     *       buildFrameGenerators() {
     *         return {
     *           keyframesGenerator_play: () => {
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
     * <!-- EX:E id="PresetEffectDefinition.immutableConfig" -->
     * 
     * @group Clip Configuration
     */
    immutableConfig?: Partial<TConfig> & object; // "& object" for some reason ensures custom errors will display for cases where ONLY invalid properties are provided
    /**
     * String that determines how frequently {@link PresetEffectDefinition.buildFrameGenerators | buildFrameGenerators} will be run.
     * **SUGGESTION:** Read the documentation for {@link PresetEffectDefinition.buildFrameGenerators | buildFrameGenerators} first.
     *  * if `on-first-play-only`, {@link PresetEffectDefinition.buildFrameGenerators | buildFrameGenerators} will run the first time
     * `play()` is called and never again. The first-made {@link EffectFrameGeneratorSet} object's functions and the closure created during the first call to
     * {@link PresetEffectDefinition.buildFrameGenerators | buildFrameGenerators} will be used for the clip's entire lifetime.
     *    * This should be set to `on-first-play-only` when code in the closure of {@link PresetEffectDefinition.buildFrameGenerators | buildFrameGenerators}
     * only needs to (or perhaps _must only_) run once for the returned generators to be correct.
     *  * if `on-every-play`, {@link PresetEffectDefinition.buildFrameGenerators | buildFrameGenerators} will run _every_ time
     * the clip is about to play forward rather than just the first time,
     * thus creating a new closure and returning a new {@link EffectFrameGeneratorSet} each time.
     * 
     * @defaultValue
     * ```ts
     * 'on-first-play-only'
     * ```
     * 
     * @example
     * <!-- EX:S id="PresetEffectDefinition.howOftenBuildGenerators" code-type="ts" -->
     * ```ts
     * // global variable that will be used in the fadeOut_exclusive effect.
     * let usedFadeOutEx = false;
     * 
     * const clipFactories = webchalk.createAnimationClipFactories({
     *   additionalExitEffects: {
     *     // A preset effect you wrote for fading an element out.
     *     // Here, it makes no difference what howOftenBuildGenerators is set to.
     *     //
     *     // - If set to 'on-first-play-only', then buildFrameGenerators() will run only once
     *     // (on the first play()). Thus, keyframesGenerator_play() is defined
     *     // only once and is set to return [{}, {opacity: 0}].
     *     //
     *     // - If set to 'on-every-play', then EVERY time the clip
     *     // plays, buildFrameGenerators() plays. Thus, keyframesGenerator_play()
     *     // will keep being redefined and set to be a function that
     *     // returns [{}, {opacity: 0}]. It made no difference because 
     *     // the body of keyframesGenerator_play() remains the same.
     *     //
     *     // Thus, it makes no difference what howOftenBuildGenerators is set to.
     *     // For the sake of optimization, you decide to set it to 'on-first-play-only'
     *     // (which is the default value anyway, but it adds more clarity).
     *     fadeOut: {
     *       buildFrameGenerators() {
     *         return {
     *           keyframesGenerator_play: () => {
     *             return [{}, {opacity: 0}];
     *           },
     *         };
     *       },
     *       
     *       howOftenBuildGenerators: 'on-first-play-only',
     *     },
     * 
     *     // A preset animation effect you made that can only be used by one animation clip
     *     // (Why you would ever do something this is unclear, but the reason does not matter.)
     *     // Here, howOftenBuildGenerators must be set to 'on-first-play-only'.
     *     //
     *     // - If set to 'on-first-play-only', then the global variable usedFadeOutEx is
     *     // checked for truthiness and then set to true on the first (and only) running of
     *     // buildFrameGenerators(). On subsequent calls to play(), buildFrameGenerators() does not re-run, so
     *     // the if-condition is not run again. However, any OTHER clip that uses the fadeOut_exclusive
     *     // effect will fail on their first play() because they need to run buildFrameGenerators() for
     *     // the first time and will throw the error (because usedFadeOutEx is already set to true).
     *     // This is the desired behavior.
     *     //
     *     // - If set to 'on-every-play', then buildFrameGenerators() will run on every play(). Thus,
     *     // playing the same clip twice will always cause an error because it will run into
     *     // the if-conditional again after usedFadeOutEx is already set to true, which is
     *     // NOT the desired behavior.
     *     //
     *     // The difference is that 'on-first-play-only' causes the if-conditional to run
     *     // only once, while 'on-every-play' causes it to be encountered a second time.
     *     fadeOut_exclusive: {
     *       buildFrameGenerators() {
     *         if (usedFadeOutEx) {
     *           throw new Error(`Only one clip is allowed to use the 'fadeOut_exclusive' effect.`);
     *         }
     *         usedFadeOutEx = true;
     *   
     *         return {
     *           keyframesGenerator_play: () => {
     *             return [ {}, {opacity: 0} ];
     *           },
     *         };
     *       },
     * 
     *       howOftenBuildGenerators: 'on-first-play-only',
     *     },
     * 
     *     // A preset animation effect you made for flying out to the left side of the screen.
     *     // Here, it makes no difference what howOftenBuildGenerators is set to.
     *     //
     *     // - If set to 'on-first-play-only', then buildFrameGenerators() will run only once. Thus,
     *     // keyframesGenerator_play() is defined only once, and the closure containing
     *     // computeTranslationStr() will also only be made once. On every play(),
     *     // keyframesGenerator_play() uses computeTranslationStr() to compute
     *     // the translation, so the translation will always be recomputed.
     *     // This is the desired behavior.
     *     //
     *     // - If set to 'on-every-play', then every time play() is called to play the clip,
     *     // buildFrameGenerators() is called again, creating a new closure containing a function
     *     // called computeTranslationStr() and returning a new keyframesGenerator_play()
     *     // that uses computeTranslationStr() to compute the translation. It makes no
     *     // difference since the bodies of computeTranslationStr() and
     *     // keyframesGenerator_play() remain the same, so this is functionally the
     *     // same as the previous paragraph.
     *     // This is the desired behavior.
     *     //
     *     // Thus, it makes no difference what howOftenBuildGenerators is set to.
     *     // For the sake of optimization, you decide to set it to 'on-first-play-only'.
     *     flyOutLeft1: {
     *       buildFrameGenerators() {
     *         const computeTranslationStr = () => {
     *           // compute distance between right side of element and left side of viewport
     *           const orthogonalDistance = -(this.domElem.getBoundingClientRect().right);
     *           // create translation string
     *           const translationString = `${orthogonalDistance}px 0px`;
     *           return translationString;
     *         }
     *   
     *         return {
     *           keyframesGenerator_play: () => {
     *             return [
     *               {translate: computeTranslationStr()}
     *             ];
     *           },
     *           // keyframesGenerator_rewind could have been omitted, but for ease of
     *           // visual understanding, they are kept for the flyOut effects
     *           keyframesGenerator_rewind: () => {
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
     * 
     *       howOftenBuildGenerators: 'on-first-play-only',
     *     },
     * 
     *     // A preset animation effect for flying out either left or right (random).
     *     // Here, howOftenBuildGenerators must be set to 'on-every-play'.
     *     //
     *     // - If set to 'on-first-play-only', then leftOrRight is defined only once. Thus,
     *     // once the clip plays for the first time, leftOrRight will be permanently set
     *     // to 'go left' or 'go right' within the closure created by buildFrameGenerators(),
     *     // so the element's direction will not be randomized each time.
     *     // This is NOT the desired effect.
     *     //
     *     // - If set to 'on-every-play', then every time play() is called to play the clip,
     *     // buildFrameGenerators() is called again. The variable leftOrRight is thus recomputed, so
     *     // the result of computeTranslationStr() will be randomly left or right every time
     *     // the clip is played.
     *     // This is the desired behavior.
     *     //
     *     // The difference is that 'on-every-play' causes the effect to use a fresh
     *     // leftOrRight on each play, while 'on-first-play-only' does not.
     *     flyOutRandom: {
     *       buildFrameGenerators() {
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
     *           keyframesGenerator_play: () => {
     *             return [
     *               {translate: computeTranslationStr()}
     *             ];
     *           },
     *           keyframesGenerator_rewind: () => {
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
     * 
     *       howOftenBuildGenerators: 'on-every-play',
     *     },
     *   }
     * });
     * ```
     * <!-- EX:E id="PresetEffectDefinition.howOftenBuildGenerators" -->
     * 
     * @group Effect Definition
     */
    howOftenBuildGenerators?: 'on-first-play-only' | 'on-every-play';
    /**
     * Function that runs when the clip is played. Returns a {@link EffectFrameGeneratorSet} object, which contains callback functions that will produce the
     * effects for both playing and rewinding the animation.
     * @param effectOptions - parameters used to set the behavior for the specific animation effect when calling the clip factory function
     * @returns An object containing 4 possible callback functions that return {@link Keyframes} and/or {@link Mutator}.
     * 
     * @remarks
     * **Overview**\
     * Whenever {@link PresetEffectDefinition.buildFrameGenerators | buildFrameGenerators} runs (how often it runs depends on
     * {@link PresetEffectDefinition.howOftenBuildGenerators | howOftenBuildGenerators}), it returns a new {@link EffectFrameGeneratorSet} containing
     * callback functions, which we can refer to as "effect generators". The clip will call these effect generators to generate the
     * keyframes/mutators for the animation as soon as the animation needs to be executed.
     * Naturally, the generators have access to the closure created by the call to {@link PresetEffectDefinition.buildFrameGenerators | buildFrameGenerators}
     * (in other words, its scope), which is useful for storing stateful data and helper functions that you can
     * use within the generators.\
     * For the sake of code clarity, it is recommended that you keep a final return statement at the bottom of
     * {@link PresetEffectDefinition.buildFrameGenerators | buildFrameGenerators} (as opposed to several possible return statements scattered throughout).
     * 
     * **Special `this`**\
     * For both convenience and utility, using `this` inside the scope of {@link PresetEffectDefinition.buildFrameGenerators | buildFrameGenerators}
     * gives access to a subset of useful properties and methods of the clip.
     *  * {@link AnimClip.domElem}
     *  * {@link AnimClip.computeTween}
     *  * {@link AnimClip.getStyles}
     *  * {@link AnimClip.getEffectDetails}
     *  * {@link AnimClip.getStatus}
     * 
     * **Forward Keyframes Generator**\
     * In a typical case, you will return a {@link EffectFrameGeneratorSet} containing the callback function {@link EffectFrameGeneratorSet.keyframesGenerator_play}.
     * When the clip is played, the callback function will be called to produce the keyframes for the animation to play. When the clip
     * is rewound, the _same_ callback function will be called again to produce keyframes for the animation to play, but the direction will
     * be reversed. This means that every time playback is initiated (playing or rewinding), a new set of keyframes is produced.
     * When writing your keyframes, you must _always_ define the _full_ course of the effect. For example, from the forward keyframes generator,
     * do _not_ return `[{}, {backgroundColor: 'blue'}, {backgroundColor: 'red', opacity: '0.5'}]`.
     * Instead, store the original styles—something like `const initialStyles = this.getStyles(['backgroundColor', 'opacity']);`, and return
     * `[{...initialStyles}, {backgroundColor: 'blue'}, {backgroundColor: 'red', opacity: 0.5}]` (taking advantage of the fact that
     * `initialStyles` will still be accessible even after the {@link EffectFrameGeneratorSet} is returned). This ensures
     * that the initial styles can be restored when the clip is rewound. The helper method {@link AnimClip.getStyles} is a convenient way
     * to get the current style properties of an element.
     * 
     * **Forward Mutator Generator**\
     * You can also animate JavaScript values using {@link EffectFrameGeneratorSet.mutatorGenerator_play}.
     * Like the keyframes generator, it is a callback function that will be called when the clip is played, and when the clip is rewound,
     * it will be called again with its effect being reversed this time. The difference is that instead of returning
     * a {@link Keyframes}, it will return a {@link Mutator}—a function that will be repeatedly called at the device's framerate.
     * If some JavaScript value is changed within the mutator with respect to the clip's progress, then the result is the illusion of a
     * smooth animation that couldn't be achieved using normal CSS-based animations (since CSS cannot animate JavaScript values).
     * (Under the hood, {@link requestAnimationFrame} loops are being used.)
     * See the documentation of {@link EffectFrameGeneratorSet} for details on how to use mutator generators.
     * 
     * **Backward Effect Generators**\
     * In addition to the forward keyframes/mutator generators, you may also define {@link EffectFrameGeneratorSet.keyframesGenerator_rewind} and/or
     * {@link EffectFrameGeneratorSet.mutatorGenerator_rewind}, giving you the ability to define more complex effects. When the clip is played,
     * the full {@link EffectFrameGeneratorSet} will be produced. Only the forward keyframes/mutator generators will be called at first since they will be used for
     * playing a clip (just as before). When the clip is eventually rewound, then the backward keyframes/mutator generators will be called and
     * used for the animation (_instead_ of reusing the forward generators). When the clip is eventually played again, the forward generators
     * will be called to produce the effect again. Then when the clip is eventually rewound again, the backward generators will once again
     * be called to produce the effect—so on and so forth.
     * 
     * **Generator Rebuild Frequency**\
     * By default, {@link PresetEffectDefinition.buildFrameGenerators | buildFrameGenerators} only runs the first time the clip is played, so the
     * resulting generators will be reused for the lifetime of the clip. To allow {@link PresetEffectDefinition.buildFrameGenerators | buildFrameGenerators}
     * to rerun and remake the {@link EffectFrameGeneratorSet}, set {@link PresetEffectDefinition.howOftenBuildGenerators} to `'on-every-play'`.
     * 
     * <!--
     * **_LONG, DETAILED EXPLANATION_**\
     * An animation clip uses two separate sets of keyframes—one set that will be used when the clip is played (the forward set)
     * and one set that will be used when the clip is rewound (the backward set). This means that you can define two distinct
     * effects for a clip's forward and backward animations, though you will most likely just want to define backward keyframes
     * that undo the effect of the forward keyframes.\
     * The forward keyframes will be returned by {@link EffectFrameGeneratorSet.keyframesGenerator_play}—which is called _every_ time the clip is played—and
     * then the animation will play using those keyframes.
     * Similarly, the backward keyframes will be returned by {@link EffectFrameGeneratorSet.keyframesGenerator_rewind}—which is called _every_ time the
     * clip is rewound—and the animation will play using those keyframes (effectively accomplishing a "rewind" since the backward keyframes
     * are most likely designed to undo the effect of the forward keyframes).
     * 
     * An animation clip uses two separate mutation functions—one that will be used when the clip is played (the forward mutator)
     * and one that will be used when the clip is rewound (the backward mutator).\
     * The forward mutation function will be returned by {@link EffectFrameGeneratorSet.mutatorGenerator_play}—which is called _every_ time the clip is played—and
     * then the mutation will repeatedly run at the device's frame rate (giving the illusion of a smooth transition) for the clip's duration.
     * Similarly, the backward mutation function will be returned by {@link EffectFrameGeneratorSet.mutatorGenerator_rewind}—which is called _every_ time the
     * clip is rewound—and the mutation will repeatedly run at the device's frame rate.
     * 
     * **REASONING**: Sometimes, the semantics of an animation are impossible to express by playing and rewinding only one set of keyframes.
     * For example, suppose you make a motion effect that moves the target from element A to element B. The semantic expectations are that
     * the target moves to B when the clip is played and moves back to A when the clip is rewound.\
     * It would not be enough to just rewind the forward keyframes because that would send the element from B back to wherever A _used_ to be (which may or
     * may not be accurate anymore). We can say that the forward keyframes generator is "non-invertible". This effect requires two sets of
     * keyframes—the forward set sends the target to B, and the backward set sends the target to A.\
     * That is why we allow the backward effect to be generated independently—this design makes it possible to define more sophisticated animations that
     * can account for dynamic factors like screen size, shifting elements, etc. (especially when paired with the possible values for
     * {@link PresetEffectDefinition.howOftenBuildGenerators | howOftenBuildGenerators}).
     * 
     * **OPTIONAL SHORTCUT:** For most effects, the semantic expectations will likely be trivial (i.e., effects where the rewind is simply just the reverse
     * of the forward keyframes). For example, suppose you make an emphasis effect where the element's opacity changes from 1 to 0.5. The semantic
     * expectation is that when the clip is rewound, the opacity changes from 0.5 to 1. Here, then, the expectation for the backward
     * keyframes would be equivalent to just reversing the effect of the forward keyframes. We can say that the forward generator is
     * "invertible". In cases like this, we allow you to omit the backward generator. If this is done, the clip internally will automatically
     * assign a copy of the forward generator to the missing backward generator, filling it in (so they will both be equivalent functions),
     * and when it is time to call the now filled-in backward generator to produce keyframes, the clip will set its animation to go in reverse.\
     * For example, with the 0.5-to-1 opacity effect, if we omit the backward keyframes generator, it will be assigned a copy of the
     * forward keyframes generator, so _both_ generators will produce keyframes that change the element's opacity from 0.5 to 1.
     * Then, because the backward generator was filled in, the clip will reverse the effect of the keyframes it produces,
     * resulting in an animation that changes the opacity from 1 to 0.5 when the clip is rewound (which is the desired rewinding effect).
     * The same shortcut allowance holds true for the mutator generators.\
     * **NOTE:** Using the shortcut has _no_ impact on {@link PresetEffectDefinition.howOftenBuildGenerators | howOftenBuildGenerators}.
     * Do not concern yourself with whether or not using the shortcut will change the behavior of
     * {@link PresetEffectDefinition.howOftenBuildGenerators | howOftenBuildGenerators}—it makes absolutely no difference. In other words,
     * if you fully write an effect and then later realize that one or both forward generators are invertible,
     * you can utilize the shortcut without even a second thought on how it may affect the behavior
     * of {@link PresetEffectDefinition.howOftenBuildGenerators | howOftenBuildGenerators}.
     * -->
     * 
     * **Caution with `composite`**\
     * Be mindful of how the value of {@link AnimClipConfig.composite} 
     * (`'replace'`, `'add'` or `'accumulate'`) may affect the effect when rewinding. This will less often be an issue
     * for entrance and exit effects since changes resulting from effects in these
     * categories are never committed (meaning `composite`-related bugs are less likely), but for motion and
     * emphasis effects, you should be especially cognizant of potential logic errors.
     * 
     * @example
     * <!-- EX:S id="PresetEffectDefinition.buildFrameGenerators-1" code-type="ts" -->
     * ```ts
     * // EXAMPLES WHERE BACKWARD GENERATORS CAN BE OMITTED
     * const clipFactories = webchalk.createAnimationClipFactories({
     *   additionalEmphasisEffects: {
     *     // -----------------------------------------------------------------
     *     // ----------------------------EXAMPLE 1----------------------------
     *     // -------------------------transparencyHalf------------------------
     *     // -----------------------------------------------------------------
     *     transparencyHalf: {
     *       buildFrameGenerators() {
     *         const initialOpacity = this.getStyles('opacity');
     * 
     *         // return EffectFrameGeneratorSet
     *         return {
     *           keyframesGenerator_play: () => {
     *             // return Keyframes (Keyframe[])
     *             return [{opacity: initialOpacity}, {opacity: 0.5}];
     *           },
     *           // Notice how the backward generator would be equivalent to running the forward generator
     *           // and reversing the effect of the keyframes. That means that the forward keyframes
     *           // generator is invertible, and the backward generator can be omitted.
     *           keyframesGenerator_rewind: () => {
     *             // return Keyframes (Keyframe[])
     *             return [{opacity: 0.5}, {opacity: initialOpacity}];
     *           },
     *         };
     *       },
     *     },
     * 
     *     // Exactly equivalent to transparencyHalf because the keyframe generator
     *     // is invertible
     *     transparencyHalf_shortcut: {
     *       buildFrameGenerators() {
     *         const initialOpacity = this.getStyles('opacity');
     * 
     *         // return EffectFrameGeneratorSet
     *         return {
     *           keyframesGenerator_play: () => {
     *             // return Keyframes (Keyframe[])
     *             return [{opacity: initialOpacity}, {opacity: 0.5}];
     *           },
     *         };
     *       },
     *     },
     *   },
     * 
     *   additionalEntranceEffects: {
     *     // -----------------------------------------------------------------
     *     // ----------------------------EXAMPLE 2----------------------------
     *     // ------------------------------shyIn------------------------------
     *     // -----------------------------------------------------------------
     *     // Element shyly enters, hesitantly fading and scaling in and out until it
     *     // reaches full opacity and scale
     *     shyIn: {
     *       buildFrameGenerators() {
     *         // return EffectFrameGeneratorSet
     *         return {
     *           keyframesGenerator_play: () => {
     *             // return Keyframes (PropertyIndexedKeyframes)
     *             return {
     *               opacity: [0, 0.5, 0.1, 0.7, 0, 1],
     *               scale: [0, 0.5, 0.1, 0.7, 0, 1],
     *             };
     *           },
     *           // Notice how the backward generator would be equivalent to running the forward generator
     *           // and reversing the effect of the keyframes. That means that the forward keyframes
     *           // generator is invertible.
     *           keyframesGenerator_rewind: () => {
     *             // return Keyframes (PropertyIndexedKeyframes) 
     *             return {
     *               opacity: [1, 0, 0.7, 0.1, 0.5, 0],
     *               scale: [1, 0, 0.7, 0.1, 0.5, 0],
     *             };
     *           },
     *         };
     *       },
     *     },
     * 
     *     // Exactly equivalent to shyIn because the keyframes generator is invertible.
     *     shyIn_shortcut: {
     *       buildFrameGenerators() {
     *         // return EffectFrameGeneratorSet
     *         return {
     *           keyframesGenerator_play: () => {
     *             // return Keyframes (PropertyIndexedKeyframes)
     *             return {
     *               opacity: [0, 0.5, 0.1, 0.7, 0, 1],
     *               scale: [0, 0.5, 0.1, 0.7, 0, 1],
     *             };
     *           },
     *         };
     *       },
     *     },
     * 
     *     // -----------------------------------------------------------------
     *     // ----------------------------EXAMPLE 3----------------------------
     *     // -----------------------riseUp and sinkDown-----------------------
     *     // -----------------------------------------------------------------
     *     // Replicates PowerPoint's Rise Up animation.
     *     // Element flies in from the bottom of the screen and ends up
     *     // slightly too high, then settles down to its final position.
     *     riseUp: {
     *       buildFrameGenerators() {
     *         const belowViewportDist = () => {
     *           return window.innerHeight - this.domElem.getBoundingClientRect().top;
     *         };
     * 
     *         // return frame generator set
     *         return {
     *           keyframesGenerator_play: () => {
     *             // return Keyframes (Keyframe[])
     *             return [
     *               {
     *                 opacity: 0,
     *                 composite: 'replace'
     *               },
     *               {
     *                 translate: `0 ${belowViewportDist()}px`,
     *                 offset: 0,
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
     *           // for rewinding this effect. Fortunately, the forward generator is invertible,
     *           // (trust me—it is true) so keyframesGenerator_rewind() can be omitted.
     *           // ---------------------------------------------------------------------------------------
     *           // keyframesGenerator_rewind: () => {
     *           //   // return Keyframes (Keyframe[])
     *           //   return [] // ??????
     *           // },
     *         };
     *       },
     *       defaultConfig: {
     *         composite: 'accumulate',
     *       },
     *       immutableConfig: {},
     *     },
     *   },
     * 
     *   additionalExitEffects: {
     *     // Replicates PowerPoint's Sink Down animation, which is the opposite of Rise Up.
     *     // Element floats up slightly and then accelerates to the bottom of the screen.
     *     sinkDown: {
     *       buildFrameGenerators() {
     *         const belowViewportDist = () => {
     *           return window.innerHeight - this.domElem.getBoundingClientRect().top;
     *         };
     * 
     *         // return frame generator set
     *         return {
     *           // Most of the time, when you write your own preset entrance/exit effect, you will want
     *           // to write the corresponding exit/entrance effect. If you write flyIn, you'll probably
     *           // write flyOut; if you write slideOut, you'll probably write slideIn; if you write riseUp,
     *           // you'll probably write sinkDown. The beauty is that if riseUp and sinkDown are opposites,
     *           // then we know that playing riseUp should be the same as rewinding sinkDown. Therefore,
     *           // we can copy-paste the logic from riseUp's keyframesGenerator_play() and simply set
     *           // reverseKeyframesEffect to true. Once again, we have gotten
     *           // away with just figuring out what the forward keyframes look like without having
     *           // to figure out what the other set looks like.
     *           // ---------------------------------------------------------------------------------------
     *           reverseKeyframesEffect: true,
     *           keyframesGenerator_play: () => {
     *             // return Keyframes (Keyframe[])
     *             return [
     *               {
     *                 opacity: 0,
     *                 composite: 'replace'
     *               },
     *               {
     *                 translate: `0 ${belowViewportDist()}px`,
     *                 offset: 0,
     *                 easing: useEasing('power2-out'),
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
     * 
     *           // keyframesGenerator_rewind: () => {
     *           //   // return Keyframes (Keyframe[])
     *           //   return [] // ??????
     *           // },
     *         };
     *       },
     *       defaultConfig: {
     *         composite: 'accumulate',
     *       },
     *       immutableConfig: {},
     *     },
     * 
     *     // -----------------------------------------------------------------
     *     // ----------------------------EXAMPLE 4----------------------------
     *     // ----------------------------flyOutLeft---------------------------
     *     // -----------------------------------------------------------------
     *     // a preset animation effect for flying out to the left side of the screen
     *     // while displaying the percentage progress in the element's text content
     *     flyOutLeft: {
     *       buildFrameGenerators() {
     *         const computeTranslationStr = () => {
     *           const orthogonalDistance = -(this.domElem.getBoundingClientRect().right);
     *           const translationString = `${orthogonalDistance}px 0px`;
     *           return translationString;
     *         }
     *   
     *         // return EffectFrameGeneratorSet
     *         return {
     *           keyframesGenerator_play: () => {
     *             // return Keyframes (Keyframe[])
     *             return [
     *               {translate: computeTranslationStr()}
     *             ];
     *           },
     * 
     *           // Notice how the backward generator would be equivalent to running the forward generator
     *           // and reversing the effect of the keyframes (even though the composite value is
     *           // 'accumulate', it's still invertible because exit effects' changes are never committed).
     *           // That means that the forward keyframes generator is invertible.
     *           // --------------------------------------------------------------------------------------
     *           keyframesGenerator_rewind: () => {
     *             // return Keyframes (Keyframe[])
     *             return [
     *               {translate: computeTranslationStr()},
     *               {translate: `0 0`}
     *             ];
     *           },
     * 
     *           mutatorGenerator_play: () => {
     *             // return Mutator
     *             return () => {
     *               this.domElem.textContent = `${this.computeTween(0, 100)}%`;
     *             };
     *           },
     * 
     *           // Notice how the backward generator would be equivalent to running the forward generator
     *           // and reversing the effect of the mutator. That means that the mutator generator is
     *           // invertible. (Note that it may not always be the case that BOTH the keyframes
     *           // generators and the forward mutator generator are invertible).
     *           // --------------------------------------------------------------------------------------
     *           mutatorGenerator_rewind: () => {
     *             // return Mutator
     *             return () => {
     *               this.domElem.textContent = `${this.computeTween(100, 0)}%`;
     *             };
     *           },
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
     *       },
     *     },
     * 
     *     // Exactly equivalent to flyOutLeft
     *     flyOutLeft_shortcut: {
     *       buildFrameGenerators() {
     *         const computeTranslationStr = () => {
     *           const orthogonalDistance = -(this.domElem.getBoundingClientRect().right);
     *           const translationString = `${orthogonalDistance}px 0px`;
     *           return translationString;
     *         }
     *   
     *         // return EffectFrameGeneratorSet
     *         return {
     *           keyframesGenerator_play: () => {
     *             // return Keyframes (Keyframe[])
     *             return [
     *               {translate: computeTranslationStr()}
     *             ];
     *           },
     * 
     *           mutatorGenerator_play: () => {
     *             // return Mutator
     *             return () => {
     *               this.domElem.textContent = `${this.computeTween(0, 100)}%`;
     *             };
     *           },
     *         };
     *       },
     *       defaultConfig: {
     *         duration: 1000,
     *         easing: "ease-in",
     *       },
     *       immutableConfig: {
     *         composite: 'accumulate',
     *       },
     *     },
     *   },
     * });
     * ```
     * <!-- EX:E id="PresetEffectDefinition.buildFrameGenerators-1" -->
     * 
     * @example
     * <!-- EX:S id="PresetEffectDefinition.buildFrameGenerators-2" code-type="ts" -->
     * ```ts
     * // EXAMPLES WHERE BACKWARD GENERATORS CANNOT BE OMITTED
     * const clipFactories = webchalk.createAnimationClipFactories({
     *   additionalMotionEffects: {
     *     // a preset animation effect for translating a certain number of pixels to the right
     *     translateRight: {
     *       buildFrameGenerators(numPixels: number) {
     *         // a helper function you wrote that will exist within a closure scoped to buildFrameGenerators()
     *         const createTranslationString = () => {
     *           if (numPixels <= 0) { throw RangeError(`Number of pixels must exceed 0.`) }
     *           const translationString = `${numPixels}px`;
     *           return translationString;
     *         }
     *   
     *         // return EffectFrameGeneratorSet
     *         return {
     *           keyframesGenerator_play: () => {
     *             // return Keyframes (Keyframe][])
     *             return [
     *               {translate: createTranslationString()} // Keyframe
     *             ];
     *           },
     *           // keyframesGenerator_rewind() must be specified because reversing the keyframes produced
     *           // by keyframesGenerator_play() would not have the intended effect (due to
     *           // {composite: 'accumulate'}, trying to simply use the reversal of
     *           // {translate: createTranslationString()} from keyframesGenerator_play() would actually
     *           // cause the target element to jump an additional numPixels pixels to the right
     *           // before sliding left, which is not the intended rewinding effect).
     *           keyframesGenerator_rewind: () => {
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
     *     },
     * 
     *     // a preset animation effect for scrolling to a specific point on the page.
     *     scrollTo: {
     *       buildFrameGenerators(yPosition: number) {
     *         const initialPosition = this.domElem.scrollTop;
     *   
     *         // return EffectFrameGeneratorSet
     *         return {
     *           // The mutation is to use the scrollTo() method on the element.
     *           // Thanks to computeTween(), there will be a smooth scroll
     *           // from initialPosition to yPosition
     *           mutatorGenerator_play: () => {
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
     *           // scrolling, size changes, etc.). So we must define mutatorGenerator_rewind()
     *           // to do exactly that.
     *           mutatorGenerator_rewind: () => {
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
     *       },
     *     },
     *   }
     * });
     * ```
     * <!-- EX:E id="PresetEffectDefinition.buildFrameGenerators-2" -->
     * 
     * @group Effect Definition
     */
    buildFrameGenerators(
      /**@ignore*/
      this: TClipContext & ReadonlyPick<AnimClip, 'computeTween'>,
      ...effectOptions: unknown[]
    ): EffectFrameGeneratorSet;
  }
>>;

/**
 * Returns an object type that includes only the effect configuration properties that are allowed to
 * be modified inside the definition of a given {@link PresetEffectDefinition}.
 * Constraints are based on the immutable effect configuration of layer 2
 * (the specified {@link AnimClip} subclass).
 * @ignore
 */
export type Layer3MutableClipConfig<TClipClass extends AnimClip> = Omit<ReturnType<TClipClass['getConfig']>, keyof TClipClass['categoryImmutableConfig']>;

// represents an object where every string key is paired with a PresetEffectDefinition value
/**
 * Object containing {@link PresetEffectDefinition} entries for a specific category of animation effects.
 * For example, there is a preset effect bank containing definition for entrance animation effects.
 * 
 * @category Effect Definition
 */
export type PresetEffectBank<TClip extends AnimClip = AnimClip> = ReadonlyRecord<
  string, // effect name
  PresetEffectDefinition<
    ReadonlyPick<TClip, 'domElem' | 'getEffectDetails' | 'getStatus' | 'getStyles'>,
    Layer3MutableClipConfig<TClip>
  >
>;

/**
 * Tuple containing the parameters for a specific {@link PresetEffectDefinition}'s {@link PresetEffectDefinition.buildFrameGenerators} function.
 * 
 * @category Effect Definition
 */
export type EffectOptions<TPresetEffectDefinition extends PresetEffectDefinition> = Parameters<TPresetEffectDefinition['buildFrameGenerators']>;

// CHANGE NOTE: EffectNameIn now handles keyof and Extract
// extracts only those strings in an object whose paired value is a PresetEffectDefinition
/**
 * Detects the keys corresponding to {@link PresetEffectDefinition} entries within a {@link PresetEffectBank}.
 * Any property within the specified bank that does not hold an effect definition is not considered
 * an "effect" name and is thus excluded.
 * @category Utility Types
 */
export type EffectNameIn<TEffectBank extends PresetEffectBank> = Exclude<keyof {
  // extra constraint on key prevents hidden bank categorizers from appearing...
  // ... whenever EffectNameIn is used as a string type constraint)
  [key in keyof TEffectBank as TEffectBank[key] extends PresetEffectDefinition ? (key extends ExtendableBankCategoryToHiddenBankCategorizer<any> ? never : key) : never]: TEffectBank[key];
}, number | symbol>;/** @ignore */


// TODO: Probably delete this function
// function definePresetEffect<TPresetEffectDefinition extends PresetEffectBank<EntranceClip>[string]> (effectCategory: 'entrance', effectDefinition: TPresetEffectDefinition): TPresetEffectDefinition;
// function definePresetEffect<TPresetEffectDefinition extends PresetEffectBank<ExitClip>[string]> (effectCategory: 'exit', effectDefinition: TPresetEffectDefinition): TPresetEffectDefinition;
// function definePresetEffect<TPresetEffectDefinition extends PresetEffectBank<EmphasisClip>[string]> (effectCategory: 'emphasis', effectDefinition: TPresetEffectDefinition): TPresetEffectDefinition;
// function definePresetEffect<TPresetEffectDefinition extends PresetEffectBank<MotionClip>[string]> (effectCategory: 'motion', effectDefinition: TPresetEffectDefinition): TPresetEffectDefinition;
/**
 * Allows the convenient creation of an object in the shape of a {@link PresetEffectDefinition} with full auto-completion.
 * The resulting effect definition must be passed into {@link webchalk.createAnimationClipFactories} in order to be added to the
 * preset effects registry.
 * @param effectCategory - the category of the animation effect
 * @param effectDefinition - the effect definition object, where you will define {@link PresetEffectDefinition.buildFrameGenerators} among other properties
 * @returns - The same {@link effectDefinition} object you passed into the function.
 * 
 * @remarks
 * // TODO: come back to this remark
 * This function is purely for convenience. You could create {@link PresetEffectDefinition} objects on your own without it,
 * but this is highly ill-advised because there would
 * be no autocompletion or hinting. Besides using this function or {@link definePresetEffectBank}, the other way to
 * define preset effects while still having access to Intellisense is to define them directly within the call to
 * {@link webchalk.createAnimationClipFactories}.
 * 
 * @example
 * <!-- EX:S id="definePresetEffect" code-type="ts" -->
 * ```ts
 * // CREATE NEW PRESET EFFECTS
 * 
 * const zoomIn = definePresetEffect(
 *   'Entrance',
 *   {
 *     buildFrameGenerators(initialScale: number) {
 *       // return EffectFrameGeneratorSet
 *       return {
 *         keyframesGenerator_play: () => {
 *           // return Keyframes (Keyframe[])
 *           return [
 *             {scale: initialScale, opacity: 0},
 *             {}
 *           ];
 *         },
 *       };
 *     }
 *   }
 * );
 * 
 * const fadeIn = definePresetEffect(
 *   'Entrance',
 *   {
 *     buildFrameGenerators() {
 *       return {
 *         keyframesGenerator_play: () => {
 *           return [{opacity: 0}, {}];
 *         }
 *       };
 *     },
 *     defaultConfig: { duration: 1000, easing: 'ease-in' },
 *   }
 * );
 * 
 * const flyOutLeft = definePresetEffect(
 *   'Exit',
 *   {
 *     buildFrameGenerators() {
 *       const computeTranslationStr = () => {
 *         const orthogonalDistance = -(this.domElem.getBoundingClientRect().right);
 *         const translationString = `${orthogonalDistance}px 0px`;
 *         return translationString;
 *       }
 * 
 *       // return EffectFrameGeneratorSet
 *       return {
 *         keyframesGenerator_play: () => {
 *           // return Keyframes (Keyframe[])
 *           return [
 *             {translate: computeTranslationStr()}
 *           ];
 *         },
 *       };
 *     },
 *     defaultConfig: {
 *       duration: 1000,
 *       easing: "ease-in",
 *     },
 *     immutableConfig: {
 *       composite: 'accumulate',
 *     },
 *   }
 * );
 * 
 * // CREATE CLIP FACTORIES AND PASS IN PRESET EFFECT DEFINITIONS
 * const clipFactories = webchalk.createAnimationClipFactories({
 *   additionalEntranceEffects: {
 *     zoomIn,
 *     fadeIn,
 *   },
 *   additionalExitEffects: {
 *     flyOutLeft
 *   }
 * });
 * 
 * const square = document.querySelector('.square');
 * 
 * // your preset effects are now part of the preset effect banks (along with full Intellisense)
 * const ent1 = clipFactories.Entrance(square, 'zoomIn', [0.1]);
 * const ent2 = clipFactories.Entrance(square, 'fadeIn', []);
 * const ext2 = clipFactories.Exit(square, 'flyOutLeft', []);
 * ```
 * <!-- EX:E id="definePresetEffect" -->
 * 
 * @category Effect Definition
 */
export function definePresetEffect<
  TCategory extends ExtendableBankCategory,
  TPresetEffectDefinition extends PresetEffectBank<ExtendableBankCategoryToClipType<TCategory>>[string]
> (effectCategory: TCategory, effectDefinition: TPresetEffectDefinition
  & {
    defaultConfig?: StrictPropertyCheck<
      Exclude<TPresetEffectDefinition['defaultConfig'], undefined>,
      Layer3MutableClipConfig<ExtendableBankCategoryToClipType<TCategory>>,
      DEFAULT_CONFIG_ERROR<TCategory>
    >;
    immutableConfig?: StrictPropertyCheck<
      Exclude<TPresetEffectDefinition['immutableConfig'], undefined>,
      Layer3MutableClipConfig<ExtendableBankCategoryToClipType<TCategory>>,
      IMMUTABLE_CONFIG_ERROR<TCategory>
    >;
    buildFrameGenerators: StrictReturnPropertyCheck<
      TPresetEffectDefinition['buildFrameGenerators'],
      EffectFrameGeneratorSet,
      EFFECT_FRAME_GENERATORS_RETURN_ERROR_PRIMITIVE,
      EFFECT_FRAME_GENERATORS_RETURN_ERROR_PROPERTIES
    >;
  }
) {
  switch(effectCategory) {
    case 'Entrance':
    case 'Exit':
    case 'Emphasis':
    case 'Motion':
      break;
    default:
      throw new TypeError(`Invalid effect category "${effectCategory}". Must be 'Entrance', 'Exit', 'Emphasis', or 'Motion'.`);
  }
  return deepFreeze(effectDefinition as typeof effectDefinition);
}

/**
 * Allows the convenient creation of an object in the shape of a {@link PresetEffectBank} with full auto-completion for each entry.
 * The resulting effect bank must be passed into {@link webchalk.createAnimationClipFactories} in order for its effect definitions to be
 * added to the preset effects registry.
 * @param effectCategory - the category of the animation effects
 * @param presetEffectBank - object where every key is an effect name and every value is a {@link PresetEffectDefinition}
 * @returns - The same {@link presetEffectBank} object you passed into the function.
 * 
 * @remarks
 * This function is purely for convenience. You could create {@link presetEffectBank}'s or individual {@link PresetEffectDefinition}
 * objects on your own without it, but this is highly ill-advised because there would be
 * there would be no autocompletion or hinting. Besides using this function,
 * the other way define preset effects while still having access to Intellisense is to define them directly
 * within the call to {@link webchalk.createAnimationClipFactories}.
 * 
 * @example
 * <!-- EX:S id="definePresetEffectBank" code-type="ts" -->
 * ```ts
 * // CREATE NEW PRESET EFFECT BANK
 * 
 * // bank with 2 preset effect definitions for a "zoomIn" effect and a "fadeIn" effect
 * const myPresetEntrances = definePresetEffectBank(
 *   'Entrance',
 *   {
 *     zoomIn: {
 *       buildFrameGenerators(initialScale: number) {
 *         // return EffectFrameGeneratorSet
 *         return {
 *           keyframesGenerator_play: () => {
 *             // return Keyframes (Keyframe[])
 *             return [
 *               {scale: initialScale, opacity: 0},
 *               {}
 *             ];
 *           },
 *         };
 *       }
 *     },
 * 
 *     fadeIn: {
 *       buildFrameGenerators() {
 *         return {
 *           keyframesGenerator_play: () => {
 *             return [{opacity: 0}, {}];
 *           }
 *         };
 *       },
 *       defaultConfig: { duration: 1000, easing: 'ease-in' },
 *     }
 *   }
 * );
 * 
 * // bank with 1 preset effect definition for a "flyOutLeft" effect
 * const myPresetExits = definePresetEffectBank(
 *   'Exit',
 *   {
 *     flyOutLeft: {
 *       buildFrameGenerators() {
 *         const computeTranslationStr = () => {
 *           const orthogonalDistance = -(this.domElem.getBoundingClientRect().right);
 *           const translationString = `${orthogonalDistance}px 0px`;
 *           return translationString;
 *         }
 *   
 *         // return EffectFrameGeneratorSet
 *         return {
 *           keyframesGenerator_play: () => {
 *             // return Keyframes (Keyframe[])
 *             return [
 *               {translate: computeTranslationStr()}
 *             ];
 *           },
 *         };
 *       },
 *       defaultConfig: {
 *         duration: 1000,
 *         easing: "ease-in",
 *       },
 *       immutableConfig: {
 *         composite: 'accumulate',
 *       },
 *     }
 *   }
 * )
 * 
 * // CREATE CLIP FACTORIES AND PASS IN PRESET EFFECT BANKS
 * const clipFactories = webchalk.createAnimationClipFactories({
 *   additionalEntranceEffects: myPresetEntrances,
 *   additionalExitEffects: myPresetExits,
 * });
 * 
 * const square = document.querySelector('.square');
 * 
 * // your preset effects are now part of the preset effect banks (along with full Intellisense)
 * const ent1 = clipFactories.Entrance(square, 'zoomIn', [0.1]);
 * const ent2 = clipFactories.Entrance(square, 'fadeIn', []);
 * const ext2 = clipFactories.Exit(square, 'flyOutLeft', []);
 * ```
 * <!-- EX:E id="definePresetEffectBank" -->
 * 
 * @category Effect Definition
 */
export function definePresetEffectBank<
  TCategory extends ExtendableBankCategory,
  // TEffectBank extends {[key: string]: PresetEffectBank<ExtendableBankCategoryToClipType<TCategory>>[string]}
  TEffectBank extends PresetEffectBank<ExtendableBankCategoryToClipType<TCategory>>
>(
  effectCategory: TCategory,
  presetEffectBank: TEffectBank & {
    // forces errors to show up on defaultConfig when invalid properties are provided...
    // ... while defining the preset effect bank
    [effectName in EffectNameIn<TEffectBank>]: TEffectBank[effectName] & {
      [prop in keyof TEffectBank[effectName]]: TEffectBank[effectName][prop] & (
        prop extends 'defaultConfig'
          ? ErrorCheckJoiner<[StrictPropertyCheck<
              Exclude<TEffectBank[effectName]['defaultConfig'], undefined>,
              Layer3MutableClipConfig<ExtendableBankCategoryToClipType<TCategory>>,
              DEFAULT_CONFIG_ERROR<TCategory>
            >]>
          : {}
      )
    }
  } & {
    // forces errors to show up on immutableConfig when invalid properties are provided...
    // ... while defining the preset effect bank
    [effectName in EffectNameIn<TEffectBank>]: TEffectBank[effectName] & {
      [prop in keyof TEffectBank[effectName]]: TEffectBank[effectName][prop] & (
        prop extends 'immutableConfig'
          ? ErrorCheckJoiner<[StrictPropertyCheck<
              Exclude<TEffectBank[effectName]['immutableConfig'], undefined>,
              Layer3MutableClipConfig<ExtendableBankCategoryToClipType<TCategory>>,
              IMMUTABLE_CONFIG_ERROR<TCategory>
            >]>
          : {}
      )
    }
  } & {
    // forces errors to show up on buildFrameGenerators() when returned value is invalid...
    // ... while defining the preset effect bank
    [effectName in EffectNameIn<TEffectBank>]: TEffectBank[effectName] & {
      [prop in keyof TEffectBank[effectName]]: TEffectBank[effectName][prop] & (
        prop extends 'buildFrameGenerators'
          ? ErrorCheckJoiner<[
              (
                StrictReturnPropertyCheck<
                  TEffectBank[effectName]['buildFrameGenerators'],
                  EffectFrameGeneratorSet,
                  EFFECT_FRAME_GENERATORS_RETURN_ERROR_PRIMITIVE,
                  EFFECT_FRAME_GENERATORS_RETURN_ERROR_PROPERTIES
                >
              ),
              (
                Extract<keyof ReturnType<TEffectBank[effectName]['buildFrameGenerators']>, `keyframesGenerator_rewind`> extends never
                  ? {}
                  : (
                    Extract<keyof ReturnType<TEffectBank[effectName]['buildFrameGenerators']>, 'keyframesGenerator_play'> extends never
                    ? PrettifyCustomError<EFFECT_FRAME_GENERATORS_RETURN_ERROR_KEYFRAMES_RW>
                    : {}
                )
              ),
              (
                Extract<keyof ReturnType<TEffectBank[effectName]['buildFrameGenerators']>, `mutatorGenerator_rewind`> extends never
                  ? {}
                  : (
                    Extract<keyof ReturnType<TEffectBank[effectName]['buildFrameGenerators']>, 'mutatorGenerator_play'> extends never
                    ? PrettifyCustomError<EFFECT_FRAME_GENERATORS_RETURN_ERROR_MUTATOR_RW>
                    : {}
                )
              )
            ]>
          : {}
      )
    }
  }
) {
  switch(effectCategory) {
    case 'Entrance':
    case 'Exit':
    case 'Emphasis':
    case 'Motion':
      break;
    default:
      throw new TypeError(`Invalid effect category "${effectCategory}". Must be 'Entrance', 'Exit', 'Emphasis', or 'Motion'.`);
  }

  formatBank(presetEffectBank);
  return presetEffectBank as typeof presetEffectBank & ClipTypeToHiddenBankCategorizer<ExtendableBankCategoryToClipType<TCategory>>;
}

/**
 * Formats the provide preset effect bank to ensure the following:
 * - Each effect definition does not use an arrow function to define {@link PresetEffectDefinition.buildFrameGenerators}
 * - Each effect definition has a value set for {@link PresetEffectDefinition.howOftenBuildGenerators}
 * - The bank is deep-frozen (cannot be mutated in any way)
 * @param presetEffectBank - the bank to format
 * @returns The same {@link presetEffectBank} passed into the function.
 * @ignore
 */
export function formatBank(presetEffectBank: PresetEffectBank) {
  const errors: string[] = [];

  // for each entry in the bank...
  for (const effectName in presetEffectBank) {
    const entry = presetEffectBank[effectName];
    // make sure generator builder functions are NOT arrow functions
    if (entry.buildFrameGenerators.toString().match(/^\(.*\) => .*/)) {
      errors.push(`"${effectName}"`);
      continue;
    }
    // set the effect frame generator build frequency to be on every play by default (if no value is already specified)
    Object.assign<typeof entry, Partial<typeof entry>>(
      entry,
      {howOftenBuildGenerators: entry.howOftenBuildGenerators ?? 'on-first-play-only'}
    );
  }

  if (errors.length > 0) {
    throw new SyntaxError(
      `Arrow functions are not allowed to be used for buildFrameGenerators() because this function provides a special \`this\` context. Detected in the following animation definitions:${errors.map(msg => `\n${msg}`)}`
    );
  }

  deepFreeze(presetEffectBank);
  return presetEffectBank;
}

/**
 * String that represents the categories that users are allowed to create their own custom effects for.
 * @ignore
 */
export type ExtendableBankCategory = 'Entrance' | 'Exit' | 'Emphasis' | 'Motion'; 

/**
 * Returns a special string based on the specified effect category.
 * The string is used to identify preset effect banks by their effect category.
 * @ignore
 */
export type ExtendableBankCategoryToHiddenBankCategorizer<TCategory extends ExtendableBankCategory> = Uppercase<`__EFFECT_CATEGORY=${TCategory}`>;

/**
 * Returns a special unassignable property corresponding to the specified clip type.
 * @ignore
 */
type ClipTypeToHiddenBankCategorizer<TClipType extends AnimClip> = 
  TClipType extends EntranceClip ? {/**@internal*/ [`__EFFECT_CATEGORY=ENTRANCE`]: never} : (
    TClipType extends ExitClip ? {/**@internal*/ [`__EFFECT_CATEGORY=EXIT`]: never} : (
      TClipType extends EmphasisClip ? {/**@internal*/ [`__EFFECT_CATEGORY=EMPHASIS`]: never} : (
        TClipType extends MotionClip ? {/**@internal*/ [`__EFFECT_CATEGORY=MOTION`]: never} : (
          never
        )
      )
    )
  );

/**
 * Returns the {@link ExtendableBankCategory} corresponding to the specified preset effect bank.
 * @ignore
 */
export type PresetEffectBankToCategory<TPresetEffectBank extends PresetEffectBank> = (
  ExtendableBankCategoryToHiddenBankCategorizer<'Entrance'> extends keyof TPresetEffectBank ? 'Entrance' : (
    ExtendableBankCategoryToHiddenBankCategorizer<'Exit'> extends keyof TPresetEffectBank ? 'Exit' : (
      ExtendableBankCategoryToHiddenBankCategorizer<'Emphasis'> extends keyof TPresetEffectBank ? 'Emphasis' : (
        ExtendableBankCategoryToHiddenBankCategorizer<'Motion'> extends keyof TPresetEffectBank ? 'Motion' : (
          never
        )
      )
    )
  )
);

/**
 * Returns the {@link AnimClip} subclass corresponding the the specified category.
 * @ignore
 */
export type ExtendableBankCategoryToClipType<TCategory extends ExtendableBankCategory> = (
  TCategory extends 'Entrance' ? EntranceClip : (
    TCategory extends 'Exit' ? ExitClip : (
      TCategory extends 'Emphasis' ? EmphasisClip : (
        TCategory extends 'Motion' ? MotionClip : (
          never
        )
      )
    )
  )
);
