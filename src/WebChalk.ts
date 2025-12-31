import { AnimClip} from "./1_playbackStructures/AnimationClip";
import {
  EntranceClip, ExitClip, EmphasisClip, MotionClip, ScrollerClip, TransitionClip,
  ConnectorEntranceClip, ConnectorExitClip, ConnectorSetterClip,
  Layer4MutableConfig,
} from "./1_playbackStructures/AnimationClipCategories";
import { AnimSequence, AnimSequenceConfig } from "./1_playbackStructures/AnimationSequence";
import { AnimTimeline, AnimTimelineConfig } from "./1_playbackStructures/AnimationTimeline";
import { WebchalkConnectorElement, WebchalkConnectorElementConfig } from "./3_components/WebchalkConnectorElement";
import {
  libPresetEntrances, libPresetExits, libPresetEmphases, libPresetMotions,
  libPresetConnectorEntrances, libPresetConnectorExits, libPresetScrolls, libPresetTransitions
} from "./2_animationEffects/webchalkPresetEffectBanks";
import { DOMElement, MultiUnitPlacementX, MultiUnitPlacementY, ScrollingOptions } from "./4_utils/interfaces";
import { PresetEffectBank, EffectNameIn, PresetEffectDefinition, EffectOptions, definePresetEffectBank, ExtendableBankCategoryToClipType, PresetEffectBankToCategory, definePresetEffect } from "./2_animationEffects/presetEffectCreation";
import { StrictPropertyCheck } from "./4_utils/utilityTypes";
import { DEFAULT_CONFIG_ERROR, IMMUTABLE_CONFIG_ERROR } from "./4_utils/errors";

/**
 * @hideconstructor
 */
export class Webchalk {
  // used to prevent direct calls to playback structures' constructors
  /**@internal*/ sequenceCreatorLock = true;
  /**@internal*/ timelineCreatorLock = true;
  /**@internal*/ clipCreatorLock = true;

  /**
   * Creates a new {@link AnimSequence} with configuration options specified in the {@link config} parameter
   * followed by an optional array of animation clips.
   * @param config - configuration options for the sequence
   * @param animClips - array of {@link AnimClip}s to add to the sequence
   * @returns A new {@link AnimSequence} instance.
   * 
   * @example
   * <!-- EX:S id="Webchalk.newSequence-1.1" code-type="ts" -->
   * ```ts
   * // retrieve clip factory functions
   * const clipFactories = webchalk.createAnimationClipFactories();
   * // select a (presumable) square-shaped element from the DOM
   * const squareEl = document.querySelector(".square");
   * 
   * // create sequence with some configuration options and some animation clips
   * const seq = webchalk.newSequence(
   *   { description: "Fade in square, move it, and fade out", playbackRate: 2 },
   *   [
   *     clipFactories.Entrance(squareEl, "~fade-in", []),
   *     clipFactories.Motion(squareEl, "~translate", [{ translate: "200px 500px" }]),
   *     clipFactories.Exit(squareEl, "~fade-out", []),
   *   ]
   * );
   * // play sequence
   * seq.play();
   * ```
   * <!-- EX:E id="Webchalk.newSequence-1.1" -->
   *
   * @example
   * <!-- EX:S id="Webchalk.newSequence-1.2" code-type="ts" -->
   * ```ts
   * // SAME EXAMPLE BUT WITH DESTRUCTURING ASSIGNMENT FOR THE CLIP FACTORY FUNCTIONS
   * 
   * const {Entrance, Exit, Motion} = webchalk.createAnimationClipFactories();
   * const squareEl = document.querySelector('.square');
   * 
   * const seq = webchalk.newSequence(
   *   {description: 'Fade in square, move it, and fade out', playbackRate: 2},
   *   [
   *     Entrance(squareEl, '~fade-in', []),
   *     Motion(squareEl, '~translate', [{translate: '200px 500px'}]),
   *     Exit(squareEl, '~fade-out', []),
   *   ]
   * );
   * seq.play();
   * ```
   * <!-- EX:E id="Webchalk.newSequence-1.2" -->
   */
  newSequence(config: Partial<AnimSequenceConfig>, animClips?: AnimClip[]): AnimSequence;
  /**
   * Creates a new {@link AnimSequence} instance with an optional array of animation clips.
   * @param animClips - array of {@link AnimClip}s to add to the sequence
   * @returns A new {@link AnimSequence} instance.
   * 
   * @example
   * <!-- EX:S id="Webchalk.newSequence-2.1" code-type="ts" -->
   * ```ts
   * // retrieve clip factory functions
   * const clipFactories = webchalk.createAnimationClipFactories();
   * // select a (presumable) square-shaped element from the DOM
   * const squareEl = document.querySelector('.square');
   * 
   * // create sequence with some animation clips
   * const seq = webchalk.newSequence(
   *   [
   *     clipFactories.Entrance(squareEl, '~fade-in', []),
   *     clipFactories.Motion(squareEl, '~translate', [{translate: '200px 500px'}]),
   *     clipFactories.Exit(squareEl, '~fade-out', []),
   *   ]
   * );
   * // play sequence
   * seq.play();
   * ```
   * <!-- EX:E id="Webchalk.newSequence-2.1" -->
   *
   * @example
   * <!-- EX:S id="Webchalk.newSequence-2.2" code-type="ts" -->
   * ```ts
   * // SAME EXAMPLE BUT WITH DESTRUCTURING ASSIGNMENT FOR THE CLIP FACTORY FUNCTIONS
   * 
   * const {Entrance, Exit, Motion} = webchalk.createAnimationClipFactories();
   * const squareEl = document.querySelector('.square');
   * 
   * const seq = webchalk.newSequence(
   *   [
   *     Entrance(squareEl, '~fade-in', []),
   *     Motion(squareEl, '~translate', [{translate: '200px 500px'}]),
   *     Exit(squareEl, '~fade-out', []),
   *   ]
   * );
   * seq.play();
   * ```
   * <!-- EX:E id="Webchalk.newSequence-2.2" -->
   */
  newSequence(animClips?: AnimClip[]): AnimSequence;
  newSequence(config: Partial<AnimSequenceConfig> | AnimClip[] = {}, animClips?: AnimClip[]): AnimSequence {
    this.sequenceCreatorLock = false;
    const sequence = new AnimSequence(config, animClips);
    return sequence;
  }

  /**
   * Creates a new {@link AnimTimeline} with configuration options specified in the {@link config} parameter
   * followed by an optional array of animation sequences.
   * @param config - configuration options for the timeline
   * @param animSequences - array of {@link AnimSequence}s to add to the timeline
   * @returns A new {@link AnimTimeline} instance.
   * 
   * @example
   * <!-- EX:S id="Webchalk.newTimeline-1" code-type="ts" -->
   * ```ts
   * // retrieve some clip factory functions
   * const {Entrance, Exit, Motion} = webchalk.createAnimationClipFactories();
   * // select presumably a square element and a circle element from the DOM
   * const squareEl = document.querySelector('.square');
   * const circleEl = document.querySelector('.circle');
   * 
   * // create first sequence
   * const seq1 = webchalk.newSequence(
   *    {description: 'Fade in square, move it, and fade out', playbackRate: 2},
   *    [
   *      Entrance(squareEl, '~fade-in', []),
   *      Motion(squareEl, '~translate', [{translate: '200px 500px'}]),
   *      Exit(squareEl, '~fade-out', []),
   *    ]
   * );
   * 
   * // create second sequence
   * const seq2 = webchalk.newSequence(
   *    {description: 'Fade in circle and move it'},
   *    [
   *      Entrance(circleEl, '~fly-in', ['from-left']),
   *      Motion(circleEl, '~translate', [{translate: '250px 0px'}]),
   *    ]
   * );
   * 
   * // create timeline with some configuration and both sequences
   * const timeline = webchalk.newTimeline(
   *    {timelineName: 'Moving Shapes', autoLinksButtons: true},
   *    [seq1, seq2]
   * );
   * 
   * // step forward twice, playing both sequences
   * timeline.step('forward')
   *   .then(() => timeline.step('forward'));
   * ```
   * <!-- EX:E id="Webchalk.newTimeline-1" -->
   */
  newTimeline(config: Partial<AnimTimelineConfig> | AnimSequence[], animSequences?: AnimSequence[]): AnimTimeline;
  /**
   * Creates a new {@link AnimTimeline} with with an optional array of animation sequences.
   * @param animSequences - optional array of {@link AnimSequence}s to add to the timeline
   * @returns A new {@link AnimTimeline} instance.
   * 
   * @example
   * <!-- EX:S id="Webchalk.newTimeline-2" code-type="ts" -->
   * ```ts
   * // retrieve some clip factory functions
   * const {Entrance, Exit, Motion} = webchalk.createAnimationClipFactories();
   * // select presumably a square element and a circle element from the DOM
   * const squareEl = document.querySelector('.square');
   * const circleEl = document.querySelector('.circle');
   * 
   * // create first sequence
   * const seq1 = webchalk.newSequence(
   *   {description: 'Fade in square, move it, and fade out', playbackRate: 2},
   *   [
   *     Entrance(squareEl, '~fade-in', []),
   *     Motion(squareEl, '~translate', [{translate: '200px 500px'}]),
   *     Exit(squareEl, '~fade-out', []),
   *   ]
   * );
   * 
   * // create second sequence
   * const seq2 = webchalk.newSequence(
   *   {description: 'Fade in circle and move it'},
   *   [
   *     Entrance(circleEl, '~fly-in', ['from-left']),
   *     Motion(circleEl, '~translate', [{translate: '250px 0px'}]),
   *   ]
   * );
   * 
   * // create timeline with both sequences
   * const timeline = webchalk.newTimeline(
   *   [seq1, seq2]
   * );
   * ```
   * <!-- EX:E id="Webchalk.newTimeline-2" -->
   */
  newTimeline(animSequences?: AnimSequence[]): AnimTimeline;
  newTimeline(config: Partial<AnimTimelineConfig> | AnimSequence[] = {}, animSequences?: AnimSequence[]): AnimTimeline {
    this.timelineCreatorLock = false;
    const timeline = new AnimTimeline(config, animSequences);
    return timeline;
  }

  /**
   * Creates functions that return {@link AnimClip}s for specific effect categories. A clip for a given category can use
   *  a single preset animation effect from the effect bank of the same category. For example,
   * `createAnimationClipFactories().Entrance(someElement, '~appear', [])` will use the "\~appear" animation effect from the
   * bank of entrance animation effects, but the "\~appear" animation will obviously not be found in the bank of exit animation
   * effects, so `createAnimationClipFactories().Exit(someElement, '~appear', [])` will throw an error.
   *  * Developers may add their own preset animation effects to the Entrance, Exit, Emphasis, and Motion categories by using the
   * {@link additionalPresetEffectBanks} parameter. **WEBCHALK'S OWN PRESET EFFECT BANKS ARE AUTOMATICALLY INCLUDED. YOU DO NOT
   * NEED TO ADD THEM MANUALLY.**
   * @param additionalPresetEffectBanks - optional object containing additional banks that the developer can use to add their own preset effects
   * @param additionalPresetEffectBanks.additionalEntranceEffects - objects of type {@link PresetEffectBank}, containing keys that represent effect names that each correspond to a {@link PresetEffectDefinition} to be used with the `Entrance()` clip factory function
   * @param additionalPresetEffectBanks.additionalExitEffects - objects of type {@link PresetEffectBank}, containing keys that represent effect names that each correspond to a {@link PresetEffectDefinition} to be used with the `Exit()` clip factory function
   * @param additionalPresetEffectBanks.additionalEmphasisEffects - objects of type {@link PresetEffectBank}, containing keys that represent effect names that each correspond to a {@link PresetEffectDefinition} to be used with the `Emphasis()` clip factory function
   * @param additionalPresetEffectBanks.additionalMotionEffects - objects of type {@link PresetEffectBank}, containing keys that represent effect names that each correspond to a {@link PresetEffectDefinition} to be used with the `Motion()` clip factory function
   * @returns Factory functions that return category-specific {@link AnimClip}s, each with intellisense for their category-specific effects banks.
   * 
   * @example
   * <!-- EX:S id="Webchalk.createAnimationClipFactories-1.1" code-type="ts" -->
   * ```ts
   * const square = document.querySelector('.square');
   * // Using the method and using one of the `Entrance()` factory function
   * const clipFactories = webchalk.createAnimationClipFactories();
   * const ent = clipFactories.Entrance(square, '~fly-in', ['from-top'], {duration: 2000});
   * ent.play();
   * ```
   * <!-- EX:E id="Webchalk.createAnimationClipFactories-1.1" -->
   * 
   * @example
   * <!-- EX:S id="Webchalk.createAnimationClipFactories-1.2" code-type="ts" -->
   * ```ts
   * const square = document.querySelector('.square');
   * // Using destructuring assignment to conveniently extract the `Entrance()` and `Motion()` factory functions
   * const {Entrance, Motion} = webchalk.createAnimationClipFactories();
   * const ent = Entrance(square, '~fly-in', ['from-top'], {duration: 2000});
   * const mot1 = Motion(square, '~translate', [{translate: '500px 0px'}], {duration: 1000});
   * const mot2 = Motion(square, '~translate', [{translate: '0px 500px'}], {duration: 500});
   * // clips are added to a sequence
   * const seq = webchalk.newSequence([ent, mot1, mot2]);
   * seq.play();
   * ```
   * <!-- EX:E id="Webchalk.createAnimationClipFactories-1.2" -->
   * 
   * @example
   * <!-- EX:S id="Webchalk.createAnimationClipFactories-1.3" code-type="ts" -->
   * ```ts
   * // Extending the preset entrances and motions banks with additional preset effects
   * const clipFactories = webchalk.createAnimationClipFactories({
   *   // PRESET ENTRANCES
   *   additionalEntranceEffects: {
   *     coolZoomIn: {
   *       buildFrameGenerators(initialScale: number) {
   *         return {
   *           keyframesGenerator_play: () => [
   *             {scale: initialScale, opacity: 0},
   *             {scale: 1, opacity: 1}
   *           ],
   *           // (backwardFrames could have been omitted in this case because
   *           // the reversal of forwardFrames is exactly equivalent)
   *           keyframesGenerator_rewind: () => [
   *             {scale: 1, opacity: 1},
   *             {scale: initialScale, opacity: 0}
   *           ]
   *         };
   *       }
   *     },
   * 
   *     blinkIn: {
   *       buildFrameGenerators() {
   *         return {
   *           keyframesGenerator_play: () => [
   *             {opacity: 0}, {opacity: 1}, {opacity: 0}, {opacity: 1}, {opacity: 0}, {opacity: 1}
   *           ],
   *           // (keyframesGenerator_rewind() omitted because the reversal of
   *           // keyframesGenerator_play() is exactly equivalent)
   *         };
   *       }
   *     }
   *   },
   * 
   *   // PRESET EXITS
   *   additionalExitEffects: {
   *     // a preset animation effect for flying out to the left side of the screen
   *     flyOutLeft: {
   *       buildFrameGenerators() {
   *         const computeTranslationStr = () => {
   *           const orthogonalDistance = -(this.domElem.getBoundingClientRect().right);
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
   *           // keyframesGenerator_rewind could have been omitted because the result
   *           // of running keyframesGenerator_play() again and reversing the keyframes
   *           // produces the same desired rewinding effect in this case
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
   *         // this means that the translation is added onto the element's position
   *         // instead of replacing it
   *         composite: 'accumulate',
   *       }
   *     },
   *   }
   * });
   * 
   * const square = document.querySelector('.square');
   * // the preset animation effects you created are now valid as well as detected by TypeScript
   * const ent1 = clipFactories.Entrance(square, 'coolZoomIn', [0.2]);
   * const ent2 = clipFactories.Entrance(square, 'blinkIn', []);
   * const ext = clipFactories.Exit(square, 'flyOutLeft', []);
   * ```
   * <!-- EX:E id="Webchalk.createAnimationClipFactories-1.3" -->
   */
  createAnimationClipFactories
  <
   // default = {} ensures intellisense for a given bank still works...
   // ...without specifying the field (why? not sure)
    AdditionalEntranceBank extends PresetEffectBank<EntranceClip> = {},
    AdditionalExitBank extends PresetEffectBank<ExitClip> = {},
    AdditionalEmphasisBank extends PresetEffectBank<EmphasisClip> = {},
    AdditionalMotionBank extends PresetEffectBank<MotionClip> = {},
    _EmptyTransitionBank extends PresetEffectBank<TransitionClip> = {},
    _EmptyConnectorEntranceBank extends PresetEffectBank<ConnectorEntranceClip> = {},
    _EmptyConnectorExitBank extends PresetEffectBank<ConnectorExitClip> = {},
    _EmptyScrollerBank extends PresetEffectBank<ScrollerClip> = {},
    IncludeLibPresets extends boolean = true
  >
  (
    additionalPresetEffectBanks: {
      /** object of type {@link PresetEffectBank}, containing keys that represent effect names that each correspond to a {@link PresetEffectDefinition} to be used with `Entrance()` clip factory function */
      additionalEntranceEffects?: AdditionalEntranceBank & PresetEffectBank<EntranceClip>;
      /** object of type {@link PresetEffectBank}, containing keys that represent effect names that each correspond to a {@link PresetEffectDefinition} to be used with the `Exit()` clip factory function */
      additionalExitEffects?: AdditionalExitBank & PresetEffectBank<ExitClip>;
      /** object of type {@link PresetEffectBank}, containing keys that represent effect names that each correspond to a {@link PresetEffectDefinition} to be used with the `Emphasis()` clip factory function */
      additionalEmphasisEffects?: AdditionalEmphasisBank & PresetEffectBank<EmphasisClip>;
      /** object of type {@link PresetEffectBank}, containing keys that represent effect names that each correspond to a {@link PresetEffectDefinition} to be used with the `Motion()` clip factory function */
      additionalMotionEffects?: AdditionalMotionBank & PresetEffectBank<MotionClip>;
    } = {},
    /**
     * if `false`, the preset effects that normally come with the framework will be excluded
     * @defaultValue
     * ```ts
     * true
     * ```
     */
    includeLibraryPresets: IncludeLibPresets | void = true as IncludeLibPresets
  ) {
    const {additionalEntranceEffects, additionalExitEffects, additionalEmphasisEffects, additionalMotionEffects} = additionalPresetEffectBanks as {
      additionalEntranceEffects?: AdditionalEntranceBank & PresetEffectBank<EntranceClip>;
      additionalExitEffects?: AdditionalExitBank & PresetEffectBank<ExitClip>;
      additionalEmphasisEffects?: AdditionalEmphasisBank & PresetEffectBank<EmphasisClip>;
      additionalMotionEffects?: AdditionalMotionBank & PresetEffectBank<MotionClip>;
    };

    type TogglePresets<TLibBank, TAdditionalBank> = Readonly<(IncludeLibPresets extends true ? TLibBank : {}) & TAdditionalBank>;

    const mergeBanks = <L, U>(libraryBank: L, additionalBank: U) => {
      const combinedBank = {...(includeLibraryPresets ? libraryBank : {}), ...(additionalBank ?? {})} as PresetEffectBank;
      // // set effectName and sourceBank properties of each generator to their obviously corresponding values
      // // Object.assign circumvents the Readonly<>, preventing a TS error
      // for (const key in combinedBank) {
      //   const extras = { effectName: key, sourceBank: combinedBank } satisfies Partial<PresetEffectDefinition>;
      //   Object.assign(combinedBank[key], extras);
      // }
      return Object.freeze(combinedBank) as TogglePresets<L, U>;
    }
    
    // Merge the library preset banks with any additional banks added from layer 4
    const combinedEntranceBank = mergeBanks(libPresetEntrances, additionalEntranceEffects as AdditionalEntranceBank);
    const combinedExitBank = mergeBanks(libPresetExits, additionalExitEffects as AdditionalExitBank);
    const combinedEmphasisBank = mergeBanks(libPresetEmphases, additionalEmphasisEffects as AdditionalEmphasisBank);
    const combinedMotionBank = mergeBanks(libPresetMotions, additionalMotionEffects as AdditionalMotionBank);
    const combinedTransitionBank = mergeBanks(libPresetTransitions, {} as _EmptyTransitionBank);
    const combinedConnectorEntranceBank = mergeBanks(libPresetConnectorEntrances, {} as _EmptyConnectorEntranceBank);
    const combinedConnectorExitBank = mergeBanks(libPresetConnectorExits, {} as _EmptyConnectorExitBank);
    const combinedScrollerBank = mergeBanks(libPresetScrolls, {} as _EmptyScrollerBank);

    const self = this;
    // return functions that can be used to instantiate AnimClips with intellisense for the combined banks
    return {
      /**
       * Creates an {@link EntranceClip}, which can be used to reveal an element that was hidden.
       * @param domElem - the element to which the animation effect will be applied
       * @param effectName - the name of the preset animation effect
       * @param effectOptions - array of arguments that can be used to customize the appearance of the chosen animation effect
       * @param effectConfig - configuration options object ({@link EntranceClipConfig}) that defines the behavior of the clip
       * @returns An {@link EntranceClip} object.
       * 
       * @example
       * <!-- EX:S id="EntranceClip.example" code-type="ts" -->
       * ```ts
       * // retrieve entrance clip factory function;
       * const { Entrance } = webchalk.createAnimationClipFactories();
       * 
       * // select elements from the DOM
       * const square = document.querySelector('.square');
       * const circle = document.querySelector('.circle');
       * const triangle = document.querySelector('.triangle');
       * 
       * // A = element, B = effect name, C = effect options, D = configuration (optional)
       * 
       * // create three entrance clips using factory function
       * //                     A       B          C
       * const clip1 = Entrance(square, '~appear', []);
       * //                     A       B          C              D
       * const clip2 = Entrance(circle, '~fly-in', ['from-left'], {duration: 2000, easing: 'ease-out'});
       * //                     A         B            C                 D
       * const clip3 = Entrance(triangle, '~pinwheel', [2, 'clockwise'], {playbackRate: 2, delay: 1000});
       * 
       * // play clips (all will play at the same time because they are asynchronous)
       * clip1.play();
       * clip2.play();
       * clip3.play();
       * ```
       * <!-- EX:E id="EntranceClip.example" -->
       */
      Entrance: function<TEffectBank extends typeof combinedEntranceBank, TEffectName extends EffectNameIn<TEffectBank>, TPresetEffectDefinition extends TEffectBank[TEffectName]>(
        domElem: Element | null | undefined,
        effectName: TEffectName,
        effectOptions: EffectOptions<TPresetEffectDefinition>,
        effectConfig: Partial<Layer4MutableConfig<EntranceClip, TPresetEffectDefinition>> = {},
      ) {
        self.clipCreatorLock = false;
        return new EntranceClip<TPresetEffectDefinition>(domElem as DOMElement, effectName, combinedEntranceBank).initialize(effectOptions, effectConfig);
      },

      /**
       * Creates an {@link ExitClip}, which can be used to unrender or make invisible an element.
       * @param domElem - the element to which the animation effect will be applied
       * @param effectName - the name of the preset animation effect
       * @param effectOptions - array of arguments that can be used to customize the appearance of the chosen animation effect
       * @param effectConfig - configuration options object ({@link ExitClipConfig}) that defines the behavior of the clip
       * @returns An {@link ExitClip} object.
       * 
       * <!-- EX:S id="ExitClip.example" code-type="ts" -->
       * ```ts
       * // retrieve exit clip factory function;
       * const { Exit } = webchalk.createAnimationClipFactories();
       * 
       * // select elements from the DOM
       * const square = document.querySelector('.square');
       * const circle = document.querySelector('.circle');
       * const triangle = document.querySelector('.triangle');
       * 
       * // A = element, B = effect name, C = effect options, D = configuration (optional)
       * 
       * // create three exit clips using factory function
       * //                 A       B             C
       * const clip1 = Exit(square, '~disappear', []);
       * //                 A       B           C            D
       * const clip2 = Exit(circle, '~fly-out', ['to-left'], {duration: 2000, easing: 'ease-in'});
       * //                 A         B            C                        D
       * const clip3 = Exit(triangle, '~pinwheel', [2, 'counterclockwise'], {playbackRate: 2, delay: 1000});
       * 
       * // play clips (all will play at the same time because they are asynchronous)
       * clip1.play();
       * clip2.play();
       * clip3.play();
       * ```
       * <!-- EX:E id="ExitClip.example" -->
       */
      Exit: function<TEffectBank extends typeof combinedExitBank, TEffectName extends EffectNameIn<TEffectBank>, TPresetEffectDefinition extends TEffectBank[TEffectName]>(
        domElem: Element | null | undefined,
        effectName: TEffectName,
        effectOptions: EffectOptions<TPresetEffectDefinition>,
        effectConfig: Partial<Layer4MutableConfig<ExitClip, TPresetEffectDefinition>> = {},
      ) {
        self.clipCreatorLock = false;
        return new ExitClip<TPresetEffectDefinition>(domElem as DOMElement, effectName, combinedExitBank).initialize(effectOptions, effectConfig);
      },

      /**
       * Creates an {@link EmphasisClip}, which can be used to emphasize an element in some way (like highlighting).
       * @param domElem - the element to which the animation effect will be applied
       * @param effectName - the name of the preset animation effect
       * @param effectOptions - array of arguments that can be used to customize the appearance of the chosen animation effect
       * @param effectConfig - configuration options object ({@link EmphasisClipConfig}) that defines the behavior of the clip
       * @returns An {@link EmphasisClip} object.
       * 
       * <!-- EX:S id="EmphasisClip.example" code-type="ts" -->
       * ```ts
       * // retrieve emphasis clip factory function;
       * const { Emphasis } = webchalk.createAnimationClipFactories();
       * 
       * // select element from the DOM
       * const importantText = document.querySelector('.important-text');
       * 
       * // A = element, B = effect name, C = effect options, D = configuration (optional)
       * 
       * // create emphasis clip using factory function
       * const clip1 = Emphasis(
       *   importantText, // A
       *   '~highlight', // B
       *   ['yellow'], // C
       *   { // D
       *     cssClasses: {toAddOnStart: ['.bold', '.italics']},
       *     duration: 1000,
       *   },
       * );
       * 
       * // play clip
       * clip1.play();
       * ```
       * <!-- EX:E id="EmphasisClip.example" -->
       */
      Emphasis: function<TEffectBank extends typeof combinedEmphasisBank, TEffectName extends EffectNameIn<TEffectBank>, TPresetEffectDefinition extends TEffectBank[TEffectName]>(
        domElem: Element | null | undefined,
        effectName: TEffectName,
        effectOptions: EffectOptions<TPresetEffectDefinition>,
        effectConfig: Partial<Layer4MutableConfig<EmphasisClip, TPresetEffectDefinition>> = {},
      ) {
        self.clipCreatorLock = false;
        return new EmphasisClip<TPresetEffectDefinition>(domElem as DOMElement, effectName, combinedEmphasisBank).initialize(effectOptions, effectConfig);
      },

      /**
       * Creates a {@link MotionClip}.
       * @param domElem - the element to which the animation effect will be applied
       * @param effectName - the name of the preset animation effect
       * @param effectOptions - array of arguments that can be used to customize the appearance of the chosen animation effect
       * @param effectConfig - configuration options object ({@link MotionClipConfig}) that defines the behavior of the clip
       * @returns A {@link MotionClip} object.
       * 
       * <!-- EX:S id="MotionClip.example" code-type="ts" -->
       * ```ts
       * // retrieve motion clip factory function;
       * const { Motion } = webchalk.createAnimationClipFactories();
       * 
       * // select elements from the DOM
       * const square = document.querySelector('.square');
       * const circle = document.querySelector('.circle');
       * const triangle = document.querySelector('.triangle');
       * 
       * // A = element, B = effect name, C = effect options, D = configuration (optional)
       * 
       * // create motion clips using factory function
       * //                   A       B             C
       * const clip1 = Motion(square, '~translate', [{translate: '200px 300rem'}]);
       * //                   A       B           C
       * const clip2 = Motion(circle, '~move-to', [document.querySelector('body'), {alignment: 'center center'}]);
       * //                   A         B           C                                                             D
       * const clip3 = Motion(triangle, '~move-to', [circle, {alignment: 'center top', selfOffset: '0% -100%'}], {duration: 2000});
       * 
       * // play clips one at a time
       * (async() => {
       *   await clip1.play(); // square moves 200px right and 300rem down
       *   await clip2.play(); // circle moves to center itself horizontally and vertically with the <body>
       *   await clip3.play(); // triangle moves to sit on top of the circle, horizontally centered
       * })()
       * ```
       * <!-- EX:E id="MotionClip.example" -->
       */
      Motion: function<TEffectBank extends typeof combinedMotionBank, TEffectName extends EffectNameIn<TEffectBank>, TPresetEffectDefinition extends TEffectBank[TEffectName]>(
        domElem: Element | null | undefined,
        effectName: TEffectName,
        effectOptions: EffectOptions<TPresetEffectDefinition>,
        effectConfig: Partial<Layer4MutableConfig<MotionClip, TPresetEffectDefinition>> = {},
      ) {
        self.clipCreatorLock = false;
        return new MotionClip<TPresetEffectDefinition>(domElem as DOMElement, effectName, combinedMotionBank).initialize(effectOptions, effectConfig);
      },

      /**
       * Creates a {@link TransitionClip}, which can be used to make an element transition to or from a given {@link Keyframe}.
       * @param domElem - the element to which the animation effect will be applied
       * @param effectName - the name of the preset animation effect
       * @param effectOptions - array of arguments that can be used to customize the appearance of the chosen animation effect
       * @param effectConfig - configuration options object ({@link TransitionClipConfig}) that defines the behavior of the clip
       * @returns A {@link TransitionClip} object.
       * 
       * <!-- EX:S id="TransitionClip.example" code-type="ts" -->
       * ```ts
       * // retrieve transition clip factory function;
       * const { Transition } = webchalk.createAnimationClipFactories();
       * 
       * // select elements from the DOM
       * const square = document.querySelector('.square');
       * const textBox = document.querySelector('.text-box');
       * const triangle = document.querySelector('.triangle');
       * 
       * // A = element, B = effect name, C = effect options, D = configuration (optional)
       * 
       * // create transition clips using factory function
       * //                       A       B      C                                              D
       * const clip1 = Transition(square, '~to', [{backgroundColor: 'lightred', width: '50%'}], {duration: 1000});
       * //                       A        B      C
       * const clip2 = Transition(textBox, '~to', [{fontSize: '30px', color: 'blue'}]);
       * //                       A         B        C
       * const clip3 = Transition(triangle, '~from', [{opacity: '0'}]);
       * 
       * // play clips (all will play at the same time because they are asynchronous)
       * clip1.play(); // square transitions to turn red and shrink to half width
       * clip2.play(); // text box font size transitions to have font size of 30px and text color blue
       * clip3.play(); // triangle transitions FROM 0 opacity to its current opacity
       * ```
       * <!-- EX:E id="TransitionClip.example" -->
       */
      Transition: function<TEffectBank extends typeof combinedTransitionBank, TEffectName extends EffectNameIn<TEffectBank>, TPresetEffectDefinition extends TEffectBank[TEffectName]>(
        domElem: Element | null | undefined,
        effectName: TEffectName,
        effectOptions: EffectOptions<TPresetEffectDefinition>,
        effectConfig: Partial<Layer4MutableConfig<TransitionClip, TPresetEffectDefinition>> = {},
      ) {
        self.clipCreatorLock = false;
        return new TransitionClip<TPresetEffectDefinition>(domElem as DOMElement, effectName, combinedTransitionBank).initialize(effectOptions, effectConfig);
      },

      /**
       * Creates a {@link ConnectorSetterClip}, which can be used to set the endpoints of a {@link WebchalkConnectorElement}.
       * @param connectorElem - the {@link WebchalkConnectorElement} element to which the animation effect will be applied
       * @param pointA - the new target of endpoint A (or `"preserve"` if it should not change)
       * @param pointB - the new target of endpoint B (or `"preserve"` if it should not change)
       * @param connectorConfig A {@link WebchalkConnectorElementConfig} object.
       * @returns A {@link ConnectorSetter} object.
       * 
       * <!-- EX:S id="ConnectorSetterClip.example" code-type="ts" -->
       * ```ts
       * // retrieve connector setter clip factory function;
       * const { ConnectorSetter } = webchalk.createAnimationClipFactories();
       * 
       * // select connector elements from the DOM
       * const topConnector = document.querySelector('.connector--thick');
       * const middleConnector = document.querySelector('.connector--skinny');
       * const verticalConnector = document.querySelector('.connector--red');
       * const bottomConnector = document.querySelector('.connector--dashed');
       * // select other elements from the DOM
       * const circle1 = document.querySelector('.circle--left');
       * const circle2 = document.querySelector('.circle--right');
       * 
       * // A = connector element, B = point a, C = point b, D = configuration (optional)
       * 
       * // create connector setter clips using factory function
       * //                            A             B                           C
       * const clip1 = ConnectorSetter(topConnector, [circle1, 'center', 'top'], [circle2, 'center', 'top']);
       * //                            A                B                             C
       * const clip2 = ConnectorSetter(middleConnector, [circle1, 'right', 'center'], [circle2, 'left', 'center']);
       * //                            A                  B                                   C
       * const clip3 = ConnectorSetter(verticalConnector, [topConnector, 'center', 'center'], [middleConnector, 'center', 'center']);
       * const clip4 = ConnectorSetter(
       *   bottomConnector, // A
       *   [circle1, 'center', 'center'], // B
       *   [circle2, 'center', 'center'], // C
       *   {pointTrackingEnabled: false}, // D
       * );
       * 
       * // play clips (all will play at the same time because they are asynchronous)
       * // topConnector's endpoints are set to the center-tops of circle1 and circle2
       * clip1.play();
       * 
       * // middleConnector's endpoints are set to the right-center of circle1 and left-center of circle2
       * clip2.play();
       * 
       * // verticalConnector's endpoints are set to the midpoints of topConnector and middleConnector
       * clip3.play();
       * 
       * // bottomConnector's endpoints are set to the center-bottoms of circle1 and circle2,
       * // but its endpoints will NOT be updated if the circles move
       * clip4.play();
       * 
       * // if the connectors are then drawn using ConnectorEntrance(), their endpoints will match
       * // what was set according to ConnectorSetter()
       * ```
       * <!-- EX:E id="ConnectorSetterClip.example" -->
       */
      ConnectorSetter: function(
        connectorElem: WebchalkConnectorElement | Element | null | undefined,
        pointA: [elemA: Element | null | undefined, xPlacement: number | MultiUnitPlacementX, yPlacement: number | MultiUnitPlacementY] | ['preserve'],
        pointB: [elemB: Element | null | undefined, xPlacement: number | MultiUnitPlacementX, yPlacement: number | MultiUnitPlacementY] | ['preserve'],
        connectorConfig: WebchalkConnectorElementConfig = {} as WebchalkConnectorElementConfig,
      ) {
        self.clipCreatorLock = false;
        const effectName = `~set-line-points`;
        // TODO: define the bank outside like all the other banks
        return new ConnectorSetterClip(
          connectorElem as Exclude<typeof connectorElem, Element>, pointA, pointB, effectName, {[effectName]: {...AnimClip.createNoOpPresetEffectDefinition(), /*effectName*/}}, connectorConfig
        ).initialize([]);
      },

      /**
       * Creates a {@link ConnectorEntranceClip}, which can be used to reveal a {@link WebchalkConnectorElement} that was hidden.
       * @param domElem - the {@link WebchalkConnectorElement} element to which the animation effect will be applied
       * @param effectName - the name of the preset animation effect
       * @param effectOptions - array of arguments that can be used to customize the appearance of the chosen animation effect
       * @param effectConfig - configuration options object ({@link ConnectorEntranceClipConfig}) that defines the behavior of the clip
       * @returns A {@link ConnectorEntranceClip} object.
       * 
       * <!-- EX:S id="ConnectorEntranceClip.example" code-type="ts" -->
       * ```ts
       * // retrieve connector entrance clip factory function;
       * const { ConnectorEntrance } = webchalk.createAnimationClipFactories();
       * 
       * // select connector elements from the DOM
       * const topConnector = document.querySelector('.connector--thick');
       * const middleConnector = document.querySelector('.connector--skinny');
       * const verticalConnector = document.querySelector('.connector--red');
       * const bottomConnector = document.querySelector('.connector--dashed');
       * 
       * // A = element, B = effect name, C = effect options, D = configuration (optional)
       * 
       * // create connector entrance clips using factory function
       * //                              A             B           C   D             
       * const clip1 = ConnectorEntrance(topConnector, '~fade-in', [], {duration: 2000, playbackRate: 2});
       * //                              A                B         C
       * const clip2 = ConnectorEntrance(middleConnector, '~trace', ['from-A']);
       * //                              A                  B         C                D
       * const clip3 = ConnectorEntrance(verticalConnector, '~trace', ['from-bottom'], {delay: 500});
       * //                              A                B          C
       * const clip4 = ConnectorEntrance(bottomConnector, '~appear', []);
       * 
       * // play clips (all will play at the same time because they are asynchronous)
       * clip1.play(); // topConnector fades in
       * clip2.play(); // middleConnector is drawn from its point A to its point B
       * clip3.play(); // verticalConnector is draw starting from whichever endpoint is lower
       * clip4.play(); // bottomConnector appears instantly
       * ```
       * <!-- EX:E id="ConnectorEntranceClip.example" -->
       */
      ConnectorEntrance: function<
        TEffectBank extends typeof combinedConnectorEntranceBank, TEffectName extends EffectNameIn<TEffectBank>, TPresetEffectDefinition extends TEffectBank[TEffectName]
      >(
        connectorElem: WebchalkConnectorElement | Element | null | undefined,
        effectName: TEffectName,
        effectOptions: EffectOptions<TPresetEffectDefinition>,
        effectConfig: Partial<Layer4MutableConfig<ConnectorEntranceClip, TPresetEffectDefinition>> = {},
      ) {
        self.clipCreatorLock = false;
        return new ConnectorEntranceClip<TPresetEffectDefinition>(connectorElem as Exclude<typeof connectorElem, Element>, effectName, combinedConnectorEntranceBank).initialize(effectOptions, effectConfig);
      },

      /**
       * Creates a {@link ConnectorExitClip}, which can be used to unrender a {@link WebchalkConnectorElement}.
       * @param domElem - the {@link WebchalkConnectorElement} element to which the animation effect will be applied
       * @param effectName - the name of the preset animation effect
       * @param effectOptions - array of arguments that can be used to customize the appearance of the chosen animation effect
       * @param effectConfig - configuration options object ({@link ConnectorExitClipConfig}) that defines the behavior of the clip
       * @returns A {@link ConnectorExitClip} object.
       * 
       * <!-- EX:S id="ConnectorExitClip.example" code-type="ts" -->
       * ```ts
       * // retrieve connector exit clip factory function;
       * const { ConnectorExit } = webchalk.createAnimationClipFactories();
       * 
       * // select connector elements from the DOM
       * const topConnector = document.querySelector('.connector--thick');
       * const middleConnector = document.querySelector('.connector--skinny');
       * const verticalConnector = document.querySelector('.connector--red');
       * const bottomConnector = document.querySelector('.connector--dashed');
       * 
       * // A = element, B = effect name, C = effect options, D = configuration (optional)
       * 
       * // create connector exit clips using factory function
       * //                          A             B            C   D             
       * const clip1 = ConnectorExit(topConnector, '~fade-out', [], {duration: 2000, playbackRate: 2});
       * //                          A                B         C
       * const clip2 = ConnectorExit(middleConnector, '~trace', ['from-B']);
       * //                          A                  B         C             D
       * const clip3 = ConnectorExit(verticalConnector, '~trace', ['from-top'], {delay: 500});
       * //                          A                B             C
       * const clip4 = ConnectorExit(bottomConnector, '~disappear', []);
       * 
       * // play clips (all will play at the same time because they are asynchronous)
       * clip1.play(); // topConnector fades out
       * clip2.play(); // middleConnector is erased from its point B to its point A
       * clip3.play(); // verticalConnector is erased starting from whichever endpoint is higher
       * clip4.play(); // bottomConnector disappears instantly
       * ```
       * <!-- EX:E id="ConnectorExitClip.example" -->
       */
      ConnectorExit: function<TEffectBank extends typeof combinedConnectorExitBank, TEffectName extends EffectNameIn<TEffectBank>, TPresetEffectDefinition extends TEffectBank[TEffectName]>(
        connectorElem: WebchalkConnectorElement | Element | null | undefined,
        effectName: TEffectName,
        effectOptions: EffectOptions<TPresetEffectDefinition>,
        effectConfig: Partial<Layer4MutableConfig<ConnectorExitClip, TPresetEffectDefinition>> = {},
      ) { 
        self.clipCreatorLock = false;
        return new ConnectorExitClip<TPresetEffectDefinition>(connectorElem as Exclude<typeof connectorElem, Element>, effectName, combinedConnectorExitBank).initialize(effectOptions, effectConfig);
      },
      
      /**
       * Creates an {@link ScrollerClip}, which can be used to scroll an element.
       * @param domElem - the element to which the animation effect will be applied
       * @param effectName - the name of the preset animation effect
       * @param effectOptions - array of arguments that can be used to customize the appearance of the chosen animation effect
       * @param effectConfig - configuration options object ({@link ScrollerClipConfig}) that defines the behavior of the clip
       * @returns An {@link ScrollerClip} object.
       * 
       * <!-- EX:S id="ScrollerClip.example" code-type="ts" -->
       * ```ts
       * // retrieve scroller clip factory function;
       * const { Scroller } = webchalk.createAnimationClipFactories();
       * 
       * // select elements from the DOM
       * const sideBar = document.querySelector('.side-bar');
       * const mainPage = document.querySelector('.main');
       * 
       * // A = element, B = effect name, C = effect options, D = configuration (optional)
       * 
       * // create scroller clips using factory function
       * //                     A        B               C                                          D
       * const clip1 = Scroller(sideBar, '~scroll-self', [sideBar?.querySelector('.contact-link')], {duration: 1000});
       * const clip2 = Scroller(
       *   mainPage, // A
       *   '~scroll-self', // B
       *   [ // C
       *     mainPage?.querySelector('.testimonials'),
       *     {
       *       scrollableOffset: ['0px', 'center'],
       *       targetOffset: ['0px', 'top'],
       *     },
       *   ],
       *   { // D
       *     duration: 2000,
       *     easing: 'ease-in-out'
       *   },
       * );
       * 
       * // play clips one at a time
       * (async() => {
       *   // side bar scrolls to a presumed contact link
       *   await clip1.play();
       *   // main page scrolls to a presumed testimonials section.
       *   // the top of the testimonials section aligns with the center of the page
       *   await clip2.play();
       * })();
       * ```
       * <!-- EX:E id="ScrollerClip.example" -->
       */
      Scroller: function<TEffectBank extends typeof combinedScrollerBank, TEffectName extends EffectNameIn<TEffectBank>, TPresetEffectDefinition extends TEffectBank[TEffectName]>
      (
        domElem: Element | null | undefined,
        effectName: TEffectName,
        effectOptions: EffectOptions<TPresetEffectDefinition>,
        effectConfig: Partial<Layer4MutableConfig<ScrollerClip, TPresetEffectDefinition>> = {},
      ) {
        self.clipCreatorLock = false;
        return new ScrollerClip<TPresetEffectDefinition>(domElem as DOMElement, effectName, combinedScrollerBank).initialize(effectOptions, effectConfig);
      },
    };
  }

  /**@internal*/
  scrollAnchorsStack: [target: Element, scrollOptions: ScrollingOptions][] = [];

  copyPresetEffect<
    TPresetEffectBank extends PresetEffectBank,
    TCategory extends PresetEffectBankToCategory<TPresetEffectBank>,
    TClipType extends ExtendableBankCategoryToClipType<TCategory>,
    TEffectName extends EffectNameIn<TPresetEffectBank>,
    TPresetEffectDefinition extends TPresetEffectBank[TEffectName],
    // "& object" for some reason ensures that the custom error will display...
    // ... for cases where ONLY invalid properties are provided
    TDefaultConfig extends Partial<Layer4MutableConfig<TClipType, TPresetEffectDefinition>> & object,
    TImmutableConfig extends Partial<Layer4MutableConfig<TClipType, TPresetEffectDefinition>> & object,
  >(
    sourceEffectBank: TPresetEffectBank,
    effectName: TEffectName,
    addedConfiguration: {
      addedDefaultConfig?: TDefaultConfig & StrictPropertyCheck<
        TDefaultConfig,
        Partial<Layer4MutableConfig<TClipType, TPresetEffectDefinition>>,
        DEFAULT_CONFIG_ERROR<TCategory>
      >,
      addedImmutableConfig?: TImmutableConfig & StrictPropertyCheck<
        TImmutableConfig,
        Partial<Layer4MutableConfig<TClipType, TPresetEffectDefinition>>,
        IMMUTABLE_CONFIG_ERROR<TCategory>
      >,
    }
  ) {
    const sourceEffectDefinition = sourceEffectBank[effectName];
    const {
      addedDefaultConfig = {},
      addedImmutableConfig = {},
    } = addedConfiguration;

    return {
      // new default configuration takes priority over source default config
      ...sourceEffectDefinition,
      defaultConfig: {
        ...sourceEffectDefinition.defaultConfig,
        ...addedDefaultConfig
      } as TDefaultConfig,
      // source immutable configuration takes priority over new immutable config
      immutableConfig: {
        ...addedImmutableConfig,
        ...sourceEffectDefinition.immutableConfig
        // "& TPresetEffectDefinition['immutableConfig]" ensures that type constraints from source immutable config are respected after returning
      } as TImmutableConfig & TPresetEffectDefinition['immutableConfig'],
    };
  }
}

/**
 * @ignore
 */
export const webchalk = new Webchalk();

// const thing =  webchalk.createAnimationClipFactories({
//   additionalEntranceEffects: definePresetEffectBank('Entrance', {
//     hello: definePresetEffect('Entrance', {
//       buildFrameGenerators() {return {}},
//       defaultConfig: {
        
//       },
//       immutableConfig: {
//         duration: 0
//       }
//     }),
//     hello2: {
//       buildFrameGenerators() {return {}},
//       defaultConfig: {
        
//       },
//       immutableConfig: {
//         duration: 0
//       }
//     },
//     '~ad': webchalk.copyPresetEffect(libPresetEntrances, '~appear', {addedDefaultConfig: {}, addedImmutableConfig: {}}),
//   }),
// }).Entrance(new HTMLElement(), '~ad', [], {}).getModifiers();

// const thing2 = webchalk.createAnimationClipFactories({
//   additionalEntranceEffects: definePresetEffectBank('Entrance', {
//     appear: {
//       buildFrameGenerators() {
//         console.log('Here is EXACTLY what is going on!');

//         return {
//           keyframesGenerator_play: () => { return []; },
//           // keyframesGenerator_rewind: 'exact-reverse',

//           mutatorGenerator_play: () => { return () => {  } },
//           mutatorGenerator_rewind: () => { return () => {  } }
//         }
//       },
//       defaultConfig: {
//         duration: 1000,
//         delay: 300,
//       },
//       immutableConfig: {
//         easing: 'linear',
//       },
//       rerunBuildFrameGenerators: 'on-every-play'
//     }
//   })
// });

