import { AnimClip} from "./1_playbackStructures/AnimationClip";
import {
  EntranceClip, ExitClip, EmphasisClip, MotionClip, ScrollerClip, TransitionClip,
  ConnectorEntranceClip, ConnectorExitClip, ConnectorSetterClip,
  Layer4MutableConfig,
} from "./1_playbackStructures/AnimationClipCategories";
import { AnimSequence, AnimSequenceConfig } from "./1_playbackStructures/AnimationSequence";
import { AnimTimeline, AnimTimelineConfig } from "./1_playbackStructures/AnimationTimeline";
import { WebimatorConnectorElement, WebimatorConnectorElementConfig } from "./3_components/WebimatorConnectorElement";
import {
  libPresetEntrances, libPresetExits, libPresetEmphases, libPresetMotions,
  libPresetConnectorEntrances, libPresetConnectorExits, libPresetScrolls, libPresetTransitions
} from "./2_animationEffects/libraryPresetEffectBanks";
import { DOMElement, MultiUnitPlacementX, MultiUnitPlacementY, ScrollingOptions } from "./4_utils/interfaces";
import { EffectGeneratorBank, EffectNameIn, EffectGenerator, EffectOptions } from "./2_animationEffects/generationTypes";

/**
 * @hideconstructor
 */
export class Webimator {
  // used to prevent direct calls to playback structures' constructors
  /**@internal*/ sequenceCreatorLock = true;
  /**@internal*/ timelineCreatorLock = true;
  /**@internal*/ clipCreatorLock = true;

  /**
   * Creates a new {@link AnimSequence} with configuration options specified in the {@link config} parameter
   * followed by an optional list of animation clips.
   * @param config - configuration options for the sequence
   * @param animClips - optional comma-separated list of {@link AnimClip}s to add to the sequence
   * @returns A new {@link AnimSequence} instance.
   * 
   * @example
   * <!-- EX:S id="Webimator.newSequence-1.1" code-type="ts" -->
   * ```ts
   * // retrieve clip factory functions
   * const clipFactories = webimator.createAnimationClipFactories();
   * // select a (presumable) square-shaped element from the DOM
   * const squareEl = document.querySelector(".square");
   * 
   * // create sequence with some configuration options and some animation clips
   * const seq = webimator.newSequence(
   *   { description: "Fade in square, move it, and fade out", playbackRate: 2 },
   *   clipFactories.Entrance(squareEl, "~fade-in", []),
   *   clipFactories.Motion(squareEl, "~translate", [{ translate: "200px 500px" }]),
   *   clipFactories.Exit(squareEl, "~fade-out", [])
   * );
   * // play sequence
   * seq.play();
   * ```
   * <!-- EX:E id="Webimator.newSequence-1.1" -->
   *
   * @example
   * <!-- EX:S id="Webimator.newSequence-1.2" code-type="ts" -->
   * ```ts
   * // SAME EXAMPLE BUT WITH DESTRUCTURING ASSIGNMENT FOR THE CLIP FACTORY FUNCTIONS
   * 
   * const {Entrance, Exit, Motion} = webimator.createAnimationClipFactories();
   * const squareEl = document.querySelector('.square');
   * 
   * const seq = webimator.newSequence(
   *   {description: 'Fade in square, move it, and fade out', playbackRate: 2},
   *   Entrance(squareEl, '~fade-in', []),
   *   Motion(squareEl, '~translate', [{translate: '200px 500px'}]),
   *   Exit(squareEl, '~fade-out', []),
   * );
   * seq.play();
   * ```
   * <!-- EX:E id="Webimator.newSequence-1.2" -->
   */
  newSequence(config: Partial<AnimSequenceConfig>, ...animClips: AnimClip[]): AnimSequence;
  /**
   * Creates a new {@link AnimSequence} instance with an optional list of animation clips.
   * @param animClips - optional comma-separated list of {@link AnimClip}s to add to the sequence
   * @returns A new {@link AnimSequence} instance.
   * 
   * @example
   * <!-- EX:S id="Webimator.newSequence-2.1" code-type="ts" -->
   * ```ts
   * // retrieve clip factory functions
   * const clipFactories = webimator.createAnimationClipFactories();
   * // select a (presumable) square-shaped element from the DOM
   * const squareEl = document.querySelector('.square');
   * 
   * // create sequence with some animation clips
   * const seq = webimator.newSequence(
   *    clipFactories.Entrance(squareEl, '~fade-in', []),
   *    clipFactories.Motion(squareEl, '~translate', [{translate: '200px 500px'}]),
   *    clipFactories.Exit(squareEl, '~fade-out', []),
   * );
   * // play sequence
   * seq.play();
   * ```
   * <!-- EX:E id="Webimator.newSequence-2.1" -->
   *
   * @example
   * <!-- EX:S id="Webimator.newSequence-2.2" code-type="ts" -->
   * ```ts
   * // SAME EXAMPLE BUT WITH DESTRUCTURING ASSIGNMENT FOR THE CLIP FACTORY FUNCTIONS
   * 
   * const {Entrance, Exit, Motion} = webimator.createAnimationClipFactories();
   * const squareEl = document.querySelector('.square');
   * 
   * const seq = webimator.newSequence(
   *    Entrance(squareEl, '~fade-in', []),
   *    Motion(squareEl, '~translate', [{translate: '200px 500px'}]),
   *    Exit(squareEl, '~fade-out', []),
   * );
   * seq.play();
   * ```
   * <!-- EX:E id="Webimator.newSequence-2.2" -->
   */
  newSequence(...animClips: AnimClip[]): AnimSequence;
  newSequence(config: Partial<AnimSequenceConfig> | AnimClip = {}, ...animClips: AnimClip[]): AnimSequence {
    this.sequenceCreatorLock = false;
    const sequence = new AnimSequence(config, ...animClips);
    return sequence;
  }

  /**
   * Creates a new {@link AnimTimeline} with configuration options specified in the {@link config} parameter
   * followed by an optional list of animation sequences.
   * @param config - configuration options for the timeline
   * @param animSequences - optional comma-separated list of {@link AnimSequence}s to add to the timeline
   * @returns A new {@link AnimTimeline} instance.
   * 
   * @example
   * <!-- EX:S id="Webimator.newTimeline-1" code-type="ts" -->
   * ```ts
   * // retrieve some clip factory functions
   * const {Entrance, Exit, Motion} = webimator.createAnimationClipFactories();
   * // select presumably a square element and a circle element from the DOM
   * const squareEl = document.querySelector('.square');
   * const circleEl = document.querySelector('.circle');
   * 
   * // create first sequence
   * const seq1 = webimator.newSequence(
   *    {description: 'Fade in square, move it, and fade out', playbackRate: 2},
   *    Entrance(squareEl, '~fade-in', []),
   *    Motion(squareEl, '~translate', [{translate: '200px 500px'}]),
   *    Exit(squareEl, '~fade-out', []),
   * );
   * 
   * // create second sequence
   * const seq2 = webimator.newSequence(
   *    {description: 'Fade in circle and move it'},
   *    Entrance(circleEl, '~fly-in', ['from-left']),
   *    Motion(circleEl, '~translate', [{translate: '250px 0px'}]),
   * );
   * 
   * // create timeline with some configuration and both sequences
   * const timeline = webimator.newTimeline(
   *    {timelineName: 'Moving Shapes', autoLinksButtons: true},
   *    seq1,
   *    seq2,
   * );
   * 
   * // step forward twice, playing both sequences
   * timeline.step('forward')
   *   .then(() => timeline.step('forward'));
   * ```
   * <!-- EX:E id="Webimator.newTimeline-1" -->
   */
  newTimeline(config: Partial<AnimTimelineConfig>, ...animSequences: AnimSequence[]): AnimTimeline;
  /**
   * Creates a new {@link AnimTimeline} with with an optional list of animation sequences.
   * @param animSequences - optional comma-separated list of {@link AnimSequence}s to add to the timeline
   * @returns A new {@link AnimTimeline} instance.
   * 
   * @example
   * <!-- EX:S id="Webimator.newTimeline-2" code-type="ts" -->
   * ```ts
   * // retrieve some clip factory functions
   * const {Entrance, Exit, Motion} = webimator.createAnimationClipFactories();
   * // select presumably a square element and a circle element from the DOM
   * const squareEl = document.querySelector('.square');
   * const circleEl = document.querySelector('.circle');
   * 
   * // create first sequence
   * const seq1 = webimator.newSequence(
   *   {description: 'Fade in square, move it, and fade out', playbackRate: 2},
   *   Entrance(squareEl, '~fade-in', []),
   *   Motion(squareEl, '~translate', [{translate: '200px 500px'}]),
   *   Exit(squareEl, '~fade-out', []),
   * );
   * 
   * // create second sequence
   * const seq2 = webimator.newSequence(
   *   {description: 'Fade in circle and move it'},
   *   Entrance(circleEl, '~fly-in', ['from-left']),
   *   Motion(circleEl, '~translate', [{translate: '250px 0px'}]),
   * );
   * 
   * // create timeline with both sequences
   * const timeline = webimator.newTimeline(
   *    seq1,
   *    seq2,
   * );
   * ```
   * <!-- EX:E id="Webimator.newTimeline-2" -->
   */
  newTimeline(...animSequences: AnimSequence[]): AnimTimeline;
  newTimeline(config: Partial<AnimTimelineConfig> | AnimSequence = {}, ...animSequences: AnimSequence[]): AnimTimeline {
    this.timelineCreatorLock = false;
    const timeline = new AnimTimeline(config, ...animSequences);
    return timeline;
  }

  /**
   * Creates functions that return {@link AnimClip}s for specific effect categories. A clip for a given category can use
   *  a single preset animation effect from the effects bank of the same category. For example,
   * `createAnimationClipFactories().Entrance(someElement, '~appear', [])` will use the "\~appear" animation effect from the
   * bank of entrance animation effects, but the "\~appear" animation will obviously not be found in the bank of exit animation
   * effects, so `createAnimationClipFactories().Exit(someElement, '~appear', [])` will throw an error.
   *  * Developers may add their own custom animations to the Entrance, Exit, Emphasis, and Motion categories by using the
   * {@link customPresetEffectBanks} parameter.
   * @param customPresetEffectBanks - optional object containing additional banks that the developer can use to add their own custom preset effects
   * @param customPresetEffectBanks.customEntranceEffects - objects of type {@link EffectGeneratorBank}, containing keys that represent effect names and values that are {@link EffectGenerator}s to be used with the `Entrance()` clip factory function
   * @param customPresetEffectBanks.customExitEffects - objects of type {@link EffectGeneratorBank}, containing keys that represent effect names and values that are {@link EffectGenerator}s to be used with the `Exit()` clip factory function
   * @param customPresetEffectBanks.customEmphasisEffects - objects of type {@link EffectGeneratorBank}, containing keys that represent effect names and values that are {@link EffectGenerator}s to be used with the `Emphasis()` clip factory function
   * @param customPresetEffectBanks.customMotionEffects - objects of type {@link EffectGeneratorBank}, containing keys that represent effect names and values that are {@link EffectGenerator}s to be used with the `Motion()` clip factory function
   * @returns Factory functions that return category-specific {@link AnimClip}s, each with intellisense for their category-specific effects banks.
   * 
   * @example
   * <!-- EX:S id="Webimator.createAnimationClipFactories-1.1" code-type="ts" -->
   * ```ts
   * const square = document.querySelector('.square');
   * // Using the method and using one of the `Entrance()` factory function
   * const clipFactories = webimator.createAnimationClipFactories();
   * const ent = clipFactories.Entrance(square, '~fly-in', ['from-top'], {duration: 2000});
   * ent.play();
   * ```
   * <!-- EX:E id="Webimator.createAnimationClipFactories-1.1" -->
   * 
   * @example
   * <!-- EX:S id="Webimator.createAnimationClipFactories-1.2" code-type="ts" -->
   * ```ts
   * const square = document.querySelector('.square');
   * // Using destructuring assignment to conveniently extract the `Entrance()` and `Motion()` factory functions
   * const {Entrance, Motion} = webimator.createAnimationClipFactories();
   * const ent = Entrance(square, '~fly-in', ['from-top'], {duration: 2000});
   * const mot1 = Motion(square, '~translate', [{translate: '500px 0px'}], {duration: 1000});
   * const mot2 = Motion(square, '~translate', [{translate: '0px 500px'}], {duration: 500});
   * // clips are added to a sequence
   * const seq = webimator.newSequence(ent, mot1, mot2);
   * seq.play();
   * ```
   * <!-- EX:E id="Webimator.createAnimationClipFactories-1.2" -->
   * 
   * @example
   * <!-- EX:S id="Webimator.createAnimationClipFactories-1.3" code-type="ts" -->
   * ```ts
   * // Extending the preset entrances and motions banks with custom effects
   * const clipFactories = webimator.createAnimationClipFactories({
   *   // CUSTOM ENTRANCES
   *   customEntranceEffects: {
   *     coolZoomIn: {
   *       composeEffect(initialScale: number) {
   *         return {
   *           forwardFramesGenerator: () => [
   *             {scale: initialScale, opacity: 0},
   *             {scale: 1, opacity: 1}
   *           ],
   *           // (backwardFrames could have been omitted in this case because
   *           // the reversal of forwardFrames is exactly equivalent)
   *           backwardFramesGenerator: () => [
   *             {scale: 1, opacity: 1},
   *             {scale: initialScale, opacity: 0}
   *           ]
   *         };
   *       }
   *     },
   * 
   *     blinkIn: {
   *       composeEffect() {
   *         return {
   *           forwardFramesGenerator: () => [
   *             {opacity: 0}, {opacity: 1}, {opacity: 0}, {opacity: 1}, {opacity: 0}, {opacity: 1}
   *           ],
   *           // (backwardFrames omitted because the reversal of forwardFrames is exactly equivalent)
   *         };
   *       }
   *     }
   *   },
   * 
   *   // CUSTOM EXITS
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
   *           forwardFramesGenerator: () => {
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
   * const square = document.querySelector('.square');
   * // the custom animations you created are now valid as well as detected by TypeScript
   * const ent1 = clipFactories.Entrance(square, 'coolZoomIn', [0.2]);
   * const ent2 = clipFactories.Entrance(square, 'blinkIn', []);
   * const ext = clipFactories.Exit(square, 'flyOutLeft', []);
   * ```
   * <!-- EX:E id="Webimator.createAnimationClipFactories-1.3" -->
   */
  createAnimationClipFactories
  <
   // default = {} ensures intellisense for a given bank still works
   // without specifying the field (why? not sure)
    CustomEntranceBank extends EffectGeneratorBank<EntranceClip> = {},
    CustomExitBank extends EffectGeneratorBank<ExitClip> = {},
    CustomEmphasisBank extends EffectGeneratorBank<EmphasisClip> = {},
    CustomMotionBank extends EffectGeneratorBank<MotionClip> = {},
    _EmptyTransitionBank extends EffectGeneratorBank<TransitionClip> = {},
    _EmptyConnectorEntranceBank extends EffectGeneratorBank<ConnectorEntranceClip> = {},
    _EmptyConnectorExitBank extends EffectGeneratorBank<ConnectorExitClip> = {},
    _EmptyScrollerBank extends EffectGeneratorBank<ScrollerClip> = {},
    IncludeLibPresets extends boolean = true
  >
  (
    customPresetEffectBanks: {
      /** object of type {@link EffectGeneratorBank}, containing keys that represent effect names and values that are {@link EffectGenerator}s to be used with `Entrance()` clip factory function */
      customEntranceEffects?: CustomEntranceBank & EffectGeneratorBank<EntranceClip>;
      /** object of type {@link EffectGeneratorBank}, containing keys that represent effect names and values that are {@link EffectGenerator}s to be used with the `Exit()` clip factory function */
      customExitEffects?: CustomExitBank & EffectGeneratorBank<ExitClip>;
      /** object of type {@link EffectGeneratorBank}, containing keys that represent effect names and values that are {@link EffectGenerator}s to be used with the `Emphasis()` clip factory function */
      customEmphasisEffects?: CustomEmphasisBank & EffectGeneratorBank<EmphasisClip>;
      /** object of type {@link EffectGeneratorBank}, containing keys that represent effect names and values that are {@link EffectGenerator}s to be used with the `Motion()` clip factory function */
      customMotionEffects?: CustomMotionBank & EffectGeneratorBank<MotionClip>;
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
    const {customEntranceEffects, customExitEffects, customEmphasisEffects, customMotionEffects} = customPresetEffectBanks as {
      customEntranceEffects?: CustomEntranceBank & EffectGeneratorBank<EntranceClip>;
      customExitEffects?: CustomExitBank & EffectGeneratorBank<ExitClip>;
      customEmphasisEffects?: CustomEmphasisBank & EffectGeneratorBank<EmphasisClip>;
      customMotionEffects?: CustomMotionBank & EffectGeneratorBank<MotionClip>;
    };
    Webimator.formatBanks(customEntranceEffects, customExitEffects, customEmphasisEffects, customMotionEffects);

    type TogglePresets<TLibBank, TCustomBank> = Readonly<(IncludeLibPresets extends true ? TLibBank : {}) & TCustomBank>;

    const mergeBanks = <L, U>(libraryBank: L, customBank: U) => {
      const combinedBank = {...(includeLibraryPresets ? libraryBank : {}), ...(customBank ?? {})} as EffectGeneratorBank;
      // // set effectName and sourceBank properties of each generator to thier obviously corresponding values
      // // Object.assign circumvents the Readonly<>, preventing a TS error
      // for (const key in combinedBank) {
      //   const extras = { effectName: key, sourceBank: combinedBank } satisfies Partial<EffectGenerator>;
      //   Object.assign(combinedBank[key], extras);
      // }
      return combinedBank as TogglePresets<L, U>;
    }
    
    // Merge the library preset banks with any custom banks addons from layer 4
    const combinedEntranceBank = mergeBanks(libPresetEntrances, customEntranceEffects as CustomEntranceBank);
    const combinedExitBank = mergeBanks(libPresetExits, customExitEffects as CustomExitBank);
    const combinedEmphasisBank = mergeBanks(libPresetEmphases, customEmphasisEffects as CustomEmphasisBank);
    const combinedMotionBank = mergeBanks(libPresetMotions, customMotionEffects as CustomMotionBank);
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
       * const { Entrance } = webimator.createAnimationClipFactories();
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
      Entrance: function<TGeneratorBank extends typeof combinedEntranceBank, TEffectName extends EffectNameIn<TGeneratorBank>, TEffectGenerator extends TGeneratorBank[TEffectName]>(
        domElem: Element | null | undefined,
        effectName: TEffectName,
        effectOptions: EffectOptions<TEffectGenerator>,
        effectConfig: Partial<Layer4MutableConfig<EntranceClip, TEffectGenerator>> = {},
      ) {
        self.clipCreatorLock = false;
        return new EntranceClip<TEffectGenerator>(domElem as DOMElement, effectName, combinedEntranceBank).initialize(effectOptions, effectConfig);
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
       * const { Exit } = webimator.createAnimationClipFactories();
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
      Exit: function<TGeneratorBank extends typeof combinedExitBank, TEffectName extends EffectNameIn<TGeneratorBank>, TEffectGenerator extends TGeneratorBank[TEffectName]>(
        domElem: Element | null | undefined,
        effectName: TEffectName,
        effectOptions: EffectOptions<TEffectGenerator>,
        effectConfig: Partial<Layer4MutableConfig<ExitClip, TEffectGenerator>> = {},
      ) {
        self.clipCreatorLock = false;
        return new ExitClip<TEffectGenerator>(domElem as DOMElement, effectName, combinedExitBank).initialize(effectOptions, effectConfig);
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
       * const { Emphasis } = webimator.createAnimationClipFactories();
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
      Emphasis: function<TGeneratorBank extends typeof combinedEmphasisBank, TEffectName extends EffectNameIn<TGeneratorBank>, TEffectGenerator extends TGeneratorBank[TEffectName]>(
        domElem: Element | null | undefined,
        effectName: TEffectName,
        effectOptions: EffectOptions<TEffectGenerator>,
        effectConfig: Partial<Layer4MutableConfig<EmphasisClip, TEffectGenerator>> = {},
      ) {
        self.clipCreatorLock = false;
        return new EmphasisClip<TEffectGenerator>(domElem as DOMElement, effectName, combinedEmphasisBank).initialize(effectOptions, effectConfig);
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
       * const { Motion } = webimator.createAnimationClipFactories();
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
      Motion: function<TGeneratorBank extends typeof combinedMotionBank, TEffectName extends EffectNameIn<TGeneratorBank>, TEffectGenerator extends TGeneratorBank[TEffectName]>(
        domElem: Element | null | undefined,
        effectName: TEffectName,
        effectOptions: EffectOptions<TEffectGenerator>,
        effectConfig: Partial<Layer4MutableConfig<MotionClip, TEffectGenerator>> = {},
      ) {
        self.clipCreatorLock = false;
        return new MotionClip<TEffectGenerator>(domElem as DOMElement, effectName, combinedMotionBank).initialize(effectOptions, effectConfig);
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
       * const { Transition } = webimator.createAnimationClipFactories();
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
      Transition: function<TGeneratorBank extends typeof combinedTransitionBank, TEffectName extends EffectNameIn<TGeneratorBank>, TEffectGenerator extends TGeneratorBank[TEffectName]>(
        domElem: Element | null | undefined,
        effectName: TEffectName,
        effectOptions: EffectOptions<TEffectGenerator>,
        effectConfig: Partial<Layer4MutableConfig<TransitionClip, TEffectGenerator>> = {},
      ) {
        self.clipCreatorLock = false;
        return new TransitionClip<TEffectGenerator>(domElem as DOMElement, effectName, combinedTransitionBank).initialize(effectOptions, effectConfig);
      },

      /**
       * Creates a {@link ConnectorSetterClip}, which can be used to set the endpoints of a {@link WebimatorConnectorElement}.
       * @param connectorElem - the {@link WebimatorConnectorElement} element to which the animation effect will be applied
       * @param pointA - the new target of endpoint A (or `"preserve"` if it should not change)
       * @param pointB - the new target of endpoint B (or `"preserve"` if it should not change)
       * @param connectorConfig A {@link WebimatorConnectorElementConfig} object.
       * @returns A {@link ConnectorSetter} object.
       * 
       * <!-- EX:S id="ConnectorSetterClip.example" code-type="ts" -->
       * ```ts
       * // retrieve connector setter clip factory function;
       * const { ConnectorSetter } = webimator.createAnimationClipFactories();
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
        connectorElem: WebimatorConnectorElement | Element | null | undefined,
        pointA: [elemA: Element | null | undefined, xPlacement: number | MultiUnitPlacementX, yPlacement: number | MultiUnitPlacementY] | ['preserve'],
        pointB: [elemB: Element | null | undefined, xPlacement: number | MultiUnitPlacementX, yPlacement: number | MultiUnitPlacementY] | ['preserve'],
        connectorConfig: WebimatorConnectorElementConfig = {} as WebimatorConnectorElementConfig,
      ) {
        self.clipCreatorLock = false;
        const effectName = `~set-line-points`;
        return new ConnectorSetterClip(
          connectorElem as Exclude<typeof connectorElem, Element>, pointA, pointB, effectName, {[effectName]: {...AnimClip.createNoOpEffectGenerator(), /*effectName*/}}, connectorConfig
        ).initialize([]);
      },

      /**
       * Creates a {@link ConnectorEntranceClip}, which can be used to reveal a {@link WebimatorConnectorElement} that was hidden.
       * @param domElem - the {@link WebimatorConnectorElement} element to which the animation effect will be applied
       * @param effectName - the name of the preset animation effect
       * @param effectOptions - array of arguments that can be used to customize the appearance of the chosen animation effect
       * @param effectConfig - configuration options object ({@link ConnectorEntranceClipConfig}) that defines the behavior of the clip
       * @returns A {@link ConnectorEntranceClip} object.
       * 
       * <!-- EX:S id="ConnectorEntranceClip.example" code-type="ts" -->
       * ```ts
       * // retrieve connector entrance clip factory function;
       * const { ConnectorEntrance } = webimator.createAnimationClipFactories();
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
        TGeneratorBank extends typeof combinedConnectorEntranceBank, TEffectName extends EffectNameIn<TGeneratorBank>, TEffectGenerator extends TGeneratorBank[TEffectName]
      >(
        connectorElem: WebimatorConnectorElement | Element | null | undefined,
        effectName: TEffectName,
        effectOptions: EffectOptions<TEffectGenerator>,
        effectConfig: Partial<Layer4MutableConfig<ConnectorEntranceClip, TEffectGenerator>> = {},
      ) {
        self.clipCreatorLock = false;
        return new ConnectorEntranceClip<TEffectGenerator>(connectorElem as Exclude<typeof connectorElem, Element>, effectName, combinedConnectorEntranceBank).initialize(effectOptions, effectConfig);
      },

      /**
       * Creates a {@link ConnectorExitClip}, which can be used to unrender a {@link WebimatorConnectorElement}.
       * @param domElem - the {@link WebimatorConnectorElement} element to which the animation effect will be applied
       * @param effectName - the name of the preset animation effect
       * @param effectOptions - array of arguments that can be used to customize the appearance of the chosen animation effect
       * @param effectConfig - configuration options object ({@link ConnectorExitClipConfig}) that defines the behavior of the clip
       * @returns A {@link ConnectorExitClip} object.
       * 
       * <!-- EX:S id="ConnectorExitClip.example" code-type="ts" -->
       * ```ts
       * // retrieve connector exit clip factory function;
       * const { ConnectorExit } = webimator.createAnimationClipFactories();
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
      ConnectorExit: function<TGeneratorBank extends typeof combinedConnectorExitBank, TEffectName extends EffectNameIn<TGeneratorBank>, TEffectGenerator extends TGeneratorBank[TEffectName]>(
        connectorElem: WebimatorConnectorElement | Element | null | undefined,
        effectName: TEffectName,
        effectOptions: EffectOptions<TEffectGenerator>,
        effectConfig: Partial<Layer4MutableConfig<ConnectorExitClip, TEffectGenerator>> = {},
      ) { 
        self.clipCreatorLock = false;
        return new ConnectorExitClip<TEffectGenerator>(connectorElem as Exclude<typeof connectorElem, Element>, effectName, combinedConnectorExitBank).initialize(effectOptions, effectConfig);
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
       * const { Scroller } = webimator.createAnimationClipFactories();
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
      Scroller: function<TGeneratorBank extends typeof combinedScrollerBank, TEffectName extends EffectNameIn<TGeneratorBank>, TEffectGenerator extends TGeneratorBank[TEffectName]>
      (
        domElem: Element | null | undefined,
        effectName: TEffectName,
        effectOptions: EffectOptions<TEffectGenerator>,
        effectConfig: Partial<Layer4MutableConfig<ScrollerClip, TEffectGenerator>> = {},
      ) {
        self.clipCreatorLock = false;
        return new ScrollerClip<TEffectGenerator>(domElem as DOMElement, effectName, combinedScrollerBank).initialize(effectOptions, effectConfig);
      },
    };
  }

  /**@internal*/
  scrollAnchorsStack: [target: Element, scrollOptions: ScrollingOptions][] = [];

  private static formatBanks(...banks: (EffectGeneratorBank | undefined)[]) {
    const errors: string[] = [];

    // for each bank...
    for (const bank of banks) {
      if (!bank) { continue; }
      // for each entry in the bank...
      for (const animName in bank) {
        const entry = bank[animName];
        // make sure composers are NOT arrow functions
        if (entry.composeEffect.toString().match(/^\(.*\) => .*/)) {
          errors.push(`"${animName}"`);
          continue;
        }
        // set the effect composition frequency to be on every play by default (if no value is already specified)
        Object.assign<typeof entry, Partial<typeof entry>>(
          entry,
          {effectCompositionFrequency: entry.effectCompositionFrequency ?? 'on-every-play'}
        );
      }
    }

    if (errors.length > 0) {
      throw new SyntaxError(
        `Arrow functions are not allowed to be used as generators. Detected in the following animation definitions:${errors.map(msg => `\n${msg}`)}`
      );
    }
  }
}

/**
 * @ignore
 */
export const webimator = new Webimator();

// const thing =  webimator.createAnimationClipFactories({
//   customEntranceEffects: {
//     hello: {
//       generateEffect() {
//         return {
//           forwardFramesGenerator: () => [],
//           backwardFramesGenerator: () => [],
//           forwardRafGenerator: () => {
//             return () => {};
//           },
//           backwardRafGenerator: () => {
//             return () => {};
//           }
//         }
//       },
//       defaultConfig: {
        
//       },
//       immutableConfig: {
//         duration: 0
//       }
//     }
//   }
// }).Entrance(new HTMLElement(), '~appear', [], {}).getModifiers();
