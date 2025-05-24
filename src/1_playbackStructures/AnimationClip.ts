import { AnimSequence } from "./AnimationSequence";
import { AnimTimeline } from "./AnimationTimeline";
import { EntranceClip, MotionClip, TransitionClip } from "./AnimationClipCategories";
import { webchalk, WebChalk } from "../WebChalk";
import { EffectOptions, EffectComposerBank, EffectComposer, ComposedEffect } from "../2_animationEffects/customEffectCreation";
import { call, detab, getPartial, mergeArrays, xor } from "../4_utils/helpers";
import { EasingString, useEasing } from "../2_animationEffects/easing";
import { CustomErrors, ClipErrorGenerator, errorTip, generateError } from "../4_utils/errors";
import { DOMElement, EffectCategory, Keyframes, StyleProperty } from "../4_utils/interfaces";
import { WebChalkConnectorElement } from "../3_components/WebChalkConnectorElement";
import { WebChalkAnimation } from "./WebChalkAnimation";
import { PartialPick, PickFromArray, WithRequired } from "../4_utils/utilityTypes";

// /**
//  * Spreads {@link objOrIterable} whether it is an array of keyframes
//  * or an object of property-indexed keyframes
//  * @param objOrIterable - an array of keyframes or property-indexed keyframes
//  * @returns The result of spreading {@link objOrIterable} into a new object or array.
//  */
// function spreadKeyframes(objOrIterable: Keyframes): Keyframes {
//   if (Symbol.iterator in objOrIterable) { return [...objOrIterable]; }
//   else { return {...objOrIterable}; }
// }

// TYPE
/**
 * Contains configuration options that determine what CSS classes should be added or removed
 * from the target element when the clip is played or rewound.
 * 
 * @category Subtypes
 */
export type CssClassOptions = {
  /**
   * Array of CSS classes to add to the element when the clip finishes playing.
   */
  toAddOnFinish: string[];

  /**
   * Array of CSS classes to add to the element when the clip starts playing.
   */
  toAddOnStart: string[];

  /**
   * Array of CSS classes to remove from the element when the clip finishes playing.
   */
  toRemoveOnFinish: string[];

  /**
   * Array of CSS classes to remove from the element when the clip starts playing.
   */
  toRemoveOnStart: string[];
};

// TYPE
type CustomKeyframeEffectOptions = {
  /**
   * If `true`, the next clip in the same sequence will play at the same time as this clip.
   *  * If this clip is not part of a sequence or is at the end of a sequence, this option has no effect.
   */
  startsNextClipToo: boolean;

  /**
   * If `true`, this clip will play at the same time as the previous clip in the same sequence.
   *  * If this clip is not part of a sequence or is at the beginning of a sequence, this option has no effect.
   */
  startsWithPrevious: boolean;

  // TODO: figure out best way to handle commitStyles behavior regarding effects that
  // don't actually need to use commitStyles()
  /**
   * Determines whether the effects of the animation will persist after the clip finishes.
   *  * if `false`, the effects of the animation will not persist after the clip finishes.
   *  * if `true`, the effects will attempt to be committed. If the element is not rendered by the
   * time the clip finishes because of the CSS class "webchalk-display-none", the clip will try to forcefully apply the styles by
   * instantly unhiding the element, committing the animation styles, then re-hiding the element (necessary because JavaScript
   * does not allow animation results to be saved to unrendered elements).
   *    * If the element is unrendered for any reason other than having the "webchalk-display-none" class by the time the clip finishes,
   * then this will fail, and an error will be thrown.
   */
  commitsStyles: false | true;

  /**
   * Resolves how an element's animation impacts the element's underlying property values.
   * @see [KeyframeEffect: composite property](https://developer.mozilla.org/en-US/docs/Web/API/KeyframeEffect/composite)
   */
  composite: CompositeOperation;

  /**
   * Contains arrays of CSS classes that should be added to or removed from the element.
   *  * The array of classes to add is added first, and then the array of classes to remove is removed.
   *  * Changes are automatically undone in the appropriate order when the clip is rewound.
   */
  cssClasses: Partial<CssClassOptions>;
};

// TYPE
type KeyframeTimingOptions = {
  /**
   * The number of milliseconds the active phase of the animation takes to complete.
   *  * This refers to the actual effect of the animation, not the delay or endDelay.
   */
  duration: number;

  /**
   * The rate of the animation's change over time.
   *  * Accepts a typical `<easing-function>`, such as `"linear"`, `"ease-in"`, `"step-end"`, `"cubic-bezier(0.42, 0, 0.58, 1)"`, etc.
   *  * Also accepts autocompleted preset strings (such as `"bounce-in"`, `"power-1-out"`, etc.)
   * that produce preset easing effects using linear functions.
   */
  easing: EasingString;

  /**
   * The base playback rate of the animation (ignoring any multipliers from a parent sequence/timeline).
   *  * Example: A value of `1` means 100% (the typical playback rate), and `0.5` means 50% speed.
   *  * Example: If the `playbackRate` of the parent sequence is `4` and the `playbackRate` of this clip is `5`,
   * the `playbackRate` property is still `5`, but the clip would run at 4 * 5 = 20x speed.
   */
  playbackRate: number;

  /**
   * The number of milliseconds the delay phase of the animation takes to complete.
   *  * This refers to the time before the active phase of the animation starts (i.e., before the animation effect begins).
   */
  delay: number;

  /**
   * The number of milliseconds the endDelay phase of the animation takes to complete.
   *  * This refers to the time after the active phase of the animation end (i.e., after the animation effect has finished).
   */
  endDelay: number;
};

// TYPE
/**
 * Contains configuration options used to define both the timing and effects of the animation clip.
 * Used as the last argument in most clip factory functions created by {@link WebChalk.createAnimationClipFactories}.
 * Returned by {@link AnimClip.getConfig}.
 * @see {@link AnimClip.getConfig}.
 * 
 * @category Interfaces
 * @interface
 */
export type AnimClipConfig = KeyframeTimingOptions & CustomKeyframeEffectOptions;

// TYPE
/**
 * Contains timing-related details about an animation.
 * Returned by {@link AnimClip.getTiming}.
 * @see {@link AnimClip.getTiming}
 * @category Interfaces
 * @interface
 */
export type AnimClipTiming = Pick<AnimClip['config'], 
  | 'startsNextClipToo'
  | 'startsWithPrevious'
  | 'duration'
  | 'delay'
  | 'endDelay'
  | 'easing'
  | 'playbackRate'
> & {
  /**
   * The actual playback rate of the animation after the playback rates of any parents are taken into account.
   *  * Example: If the `playbackRate` of the parent sequence is `4` and the `playbackRate` of this clip is `5`,
   * the `compoundedPlaybackRate` will be 4 * 5 = 20.
   * @see {@link AnimClipTiming.playbackRate}
   */
  compoundedPlaybackRate: AnimClip['compoundedPlaybackRate'];
};

// TYPE
/**
 * Contains specific details about an animation's effect.
 * Returned by {@link AnimClip.getEffectDetails}.
 * @see {@link AnimClip.getEffectDetails}
 * @category Interfaces
 * @interface
 */
export type AnimClipEffectDetails = {
  /**
   * Name of the animation effect.
   */
  effectName: AnimClip['effectName'];

  /**
   * Object containing both the function used to compose the effect and
   * possibly a set of default configuration options for the effect.
   */
  effectComposer: AnimClip['effectComposer'];

  /**
   * An array containing the effect options used to set the behavior of the animation effect.
   */
  effectOptions: AnimClip['effectOptions'];

  /**
   * The category of the effect (e.g., `"Entrance"`, `"Exit"`, `"Motion"`, etc.).
   */
  category: AnimClip['category'];
};

// TYPE
/**
 * Contains details about how the DOM element is modified beyond just the effect of the animation (such as modifying CSS classes).
 * Returned by {@link AnimClip.getModifiers}.
 * @see {@link AnimClip.getModifiers}
 * @category Interfaces
 * @interface
 */
export type AnimClipModifiers = Pick<AnimClipConfig, 'cssClasses' | 'composite' | 'commitsStyles'>;

// TYPE
/**
 * Contains details about an animation's current status.
 * Returned by {@link AnimClip.getStatus}.
 * @see {@link AnimClip.getStatus}
 * @category Interfaces
 * @interface
 */
export type AnimClipStatus = {
  /**
   * `true` only if the clip is in the process of playback (whether running or paused).
   */
  inProgress: boolean;

  /**
   * `true` only if the clip is in the process of playback and unpaused.
   */
  isRunning: boolean;
  
  /**
   * `true` only if the clip is in the process of playback and paused.
   */
  isPaused: boolean;

  /**
   * the current direction of the animation
   */
  direction: 'forward' | 'backward';
};

/**
 * <!-- EX:S id="AnimClip.desc" code-type="comment-block" -->
 * A "clip" is the smallest building block of a timeline. It is essentially a [DOM element, effect] pair,
 * where a "DOM element" is some HTML element on the page and the effect is the animation effect that
 * will be applied to it (asynchronously).
 * 
 * The {@link AnimClip} class is abstract, meaning it cannot be instantiated. But it has several subclasses such as 
 * {@link EntranceClip}, {@link MotionClip}, {@link TransitionClip}, etc. WebChalk provides convenient factory functions
 * that can be used to create such clips—the factory functions can be obtained from {@link WebChalk.createAnimationClipFactories}.
 * Examples are shown below.
 * 
 * Generally (with some exceptions), using a clip factory function follows this format:
 * `const clip = <factory func>(<some element>, <effect name>, [<effect options>], {<optional clip configuration>});`
 * <!-- EX:E id="AnimClip.desc" -->
 * 
 * @example
 * <!-- EX:S id="AnimClip.class" code-type="ts" -->
 * ```ts
 * // retrieve the clip factory functions
 * const clipFactories = webchalk.createAnimationClipFactories();
 * 
 * // select an element from the DOM
 * const square = document.querySelector('.square');
 * 
 * // A = element, B = effect name, C = effect options, D = configuration (optional)
 * 
 * // create 3 animation clips using the clip factory functions Entrance(), Motion(), and Emphasis()
 * //                                     A       B           C
 * const entClip = clipFactories.Entrance(square, '~fade-in', []);
 * //                                   A       B             C
 * const motClip = clipFactories.Motion(square, '~translate', [{translate: '500px 0px', selfOffset: '50% 50%'}]);
 * //                                     A       B             C        D
 * const empClip = clipFactories.Emphasis(square, '~highlight', ['red'], {duration: 2000, easing: 'ease-in'});
 * 
 * (async () => {
 *   // play the clips one at a time
 *   await entClip.play();
 *   await motClip.play();
 *   await empClip.play();
 *   // rewind the clips one at a time
 *   await empClip.rewind();
 *   await motClip.rewind();
 *   await entClip.rewind();
 * })();
 * ```
 * <!-- EX:E id="AnimClip.class" -->
 * 
 * @hideconstructor
 * 
 * @groupDescription Property Getter Methods
 * Methods that return objects that contain various internal fields of the clip (such as `duration` from `getTiming()`,
 * `inProgress` from `getStatus()`, etc.).
 * 
 * @groupDescription Playback Methods
 * Methods that control the playback of the animation clip.
 * 
 * @groupDescription Timing Event Methods
 * Methods that involve listening to the progress of the animation clip to perform tasks at specific times.
 * 
 * @groupDescription Structure
 * Methods and/or fields related to the stucture of the clip, including the element it targets
 * and any parent structures it belongs to.
 * 
 * @groupDescription Configuration
 * Methods and/or fields related to the configuration settings of the clip,
 * including configuration settings specific to the effect category of the clip.
 * 
 * @groupDescription Helper Methods
 * Methods to help with the functionality of clip operations.
 */
export abstract class AnimClip<TEffectComposer extends EffectComposer = EffectComposer, TClipConfig extends AnimClipConfig = AnimClipConfig> {
  private static id: number = 0;

  /**
   * The base default configuration for any animation clip before any category-specific
   * configuration, effect composer configuration, or configuration passed in through
   * clip factory functions are applied.
   * @group Configuration
   */
  static get baseDefaultConfig() {
    return {
      commitsStyles: true,
      composite: 'replace',
      cssClasses: {
        toAddOnFinish: [],
        toAddOnStart: [],
        toRemoveOnFinish: [],
        toRemoveOnStart: [],
      },
      delay: 0,
      duration: 500,
      easing: 'linear',
      endDelay: 0,
      playbackRate: 1,
      startsNextClipToo: false,
      startsWithPrevious: false,
    } as const satisfies AnimClipConfig;
  }

  /**
   * @returns An effect composer with a function that returns empty arrays (so no actual keyframes).
   * @remarks
   * This static method is purely for convenience.
   * @group Helper Methods
   */
  public static createNoOpEffectComposer() { return {composeEffect() { return {forwardKeyframesGenerator: () => [], backwardKeyframesGenerator: () => []}; }} as EffectComposer; }

  /**
   * The default configuration for clips in a specific effect category, which includes
   * any additional configuration options that are specific to the effect category.
   *  * This never changes, and it available mostly just for reference. Consider it a
   * static property.
   *  * This does NOT include any default configuration from effect composers or
   * configurations passed in from clip factory functions.
   * @group Configuration
   */
  abstract get categoryDefaultConfig(): TClipConfig;

  /**
   * The unchangeable default configuration for clips in a specific effect category.
   *  * This never changes, and it is available mostly just for reference. Consider it a static
   * property.
   *  * This does NOT include any immutable configuration from effect composers.
   * @group Configuration
   */
  abstract get categoryImmutableConfig(): Partial<TClipConfig>;

  /**
   * All the unchangeable default configuration settings for the clip (both category-specific
   * immutable configurations and immutable configurations that come from the specific
   * effect composer).
   * @group Configuration
   */
  get immutableConfig(): this['categoryImmutableConfig'] & TEffectComposer['immutableConfig'] {
    return {
      ...this.effectComposer.immutableConfig,
      ...this.categoryImmutableConfig,
    };
  }

  /**
   * @group Configuration
   */
  protected config = {} as TClipConfig;

  /**
   * Returns an object containing the configuration options used to define both the timing and effects of the animation clip.
   * @returns An object containing
   *  * {@link AnimClipConfig.commitsStyles|commitsStyles},
   *  * {@link AnimClipConfig.composite|composite},
   *  * {@link AnimClipConfig.cssClasses|cssClasses},
   *  * {@link AnimClipConfig.delay|delay},
   *  * {@link AnimClipConfig.duration|duration},
   *  * {@link AnimClipConfig.easing|easing},
   *  * {@link AnimClipConfig.endDelay|endDelay},
   *  * {@link AnimClipConfig.playbackRate|playbackRate},
   *  * {@link AnimClipConfig.startsWithPrevious|startsWithPrevious},
   *  * {@link AnimClipConfig.startsNextClipToo|startsNextClipToo},
   * @group Property Getter Methods
   * @group Configuration
   */
  getConfig(): TClipConfig {
    return {
      ...this.config,
      cssClasses: this.getModifiers('cssClasses'),
    };
  }

  /*-:**************************************************************************************************************************/
  /*-:*************************************        FIELDS & ACCESSORS        ***************************************************/
  /*-:**************************************************************************************************************************/
  /**
   * Number that uniquely identifies the clip from other clips.
   * Automatically generated.
   */
  readonly id: number;
  /**@internal*/ _parentSequence?: AnimSequence;
  /**@internal*/ _parentTimeline?: AnimTimeline;
  /**
   * The parent {@link AnimSequence} that contains this clip
   * (`undefined` if the clip is not part of a sequence).
   * @group Structure
   */
  get parentSequence() { return this._parentSequence; }
  /**
   * The parent {@link AnimTimeline} that contains the {@link AnimSequence} that contains this clip (may be `undefined`).
   * @group Structure
   */
  get parentTimeline() { return this._parentTimeline; }
  /**
   * The highest level of this clip's lineage.
   *  * If the clip is nested within an {@link AnimTimeline}: that timeline,
   *  * Else, if the clip is within an {@link AnimSequence}: that sequence,
   *  * Else: the clip itself
   * @group Structure
   */
  get root(): AnimTimeline | AnimSequence | AnimClip { return this.parentTimeline ?? this.parentSequence ?? this; }
  /**
   * The DOM element that is to be animated.
   * @group Structure
   */
 readonly domElem: DOMElement;

 /**
  * Returns an object containing the specified style properties of the specified element.
  * * Normal CSS properties _must_ be written in camelCase
  * (e.g., `['marginBottom', 'backgroundColor']`, _NOT_ `['margin-bottom', 'background-color']`),
  * * CSS variables should be written normally (e.g., `['--nav-edge-color', '--brand-red']`).
  * @param element - DOM element from which to read the styles
  * @param styleProps - Array of strings representing camelCase CSS property names
  * @returns An object where the keys are the specified camelCase strings and the values are the CSS property values.
  */
 getStyles(element: Element, styleProps: StyleProperty[]): {[key: string]: string};
 /**
  * Returns the string value of the specified CSS property name for the specified element.
  * * Normal CSS properties _must_ be written in camelCase (e.g., `'marginBottom'`, _NOT_ `'margin-bottom'`),
  * * CSS variables should be written normally (e.g., `'--brand-red'`).
  * @param element - DOM element from which to read the style
  * @param styleProps - String representing a single camelCase CSS property name
  * @returns The string value of the specified camelCase CSS property name.
  */
 getStyles(element: Element, styleProp: StyleProperty): string;
 /**
  * Returns an object containing the specified style properties of this clip's DOM element.
  * * Normal CSS properties _must_ be written in camelCase
  * (e.g., `['marginBottom', 'backgroundColor']`, _NOT_ `['margin-bottom', 'background-color']`),
  * * CSS variables should be written normally (e.g., `['--nav-edge-color', '--brand-red']`).
  * @param styleProps - Array of strings representing camelCase CSS property names
  * @returns An object where the keys are the specified camelCase strings and the values are the CSS property values.
  */
 getStyles(styleProps: StyleProperty[]): {[key: string]: string};
 /**
  * Returns the string value of the specified CSS property name for this clip's DOM element.
  * * Normal CSS properties _must_ be written in camelCase (e.g., `'marginBottom'`, _NOT_ `'margin-bottom'`),
  * * CSS variables should be written normally (e.g., `'--brand-red'`).
  * @param styleProps - String representing a single camelCase CSS property name
  * @returns The string value of the specified camelCase CSS property name.
  */
 getStyles(styleProp: StyleProperty): string;
 /**
  * @group Property Getter Methods
  */
 getStyles(stylePropsOrEl: StyleProperty[] | StyleProperty | Element, styleProps?: StyleProperty[] | StyleProperty) {
  const elementSpecified = !!styleProps;
  const props = elementSpecified ? styleProps : stylePropsOrEl as Exclude<typeof stylePropsOrEl, Element>;
  const element = elementSpecified ? stylePropsOrEl as Extract<typeof stylePropsOrEl, Element> : this.domElem;

  // for each requested style property, set that property inside result object
  const styleDec = getComputedStyle(element);
  if (typeof props === 'string') {
    // @ts-expect-error
    return props.startsWith('--') ? styleDec.getPropertyValue(props) : styleDec[props];
  }
  else {
    // create object that will store style props
    const subsetObj = {} as any;
    for (const prop of props) {
      // @ts-expect-error
      subsetObj[prop] = prop.startsWith('--') ? styleDec.getPropertyValue(prop) : styleDec[prop as string];
    }
    return  subsetObj;
  }
 }

 protected animation!: WebChalkAnimation;
 /**@internal*/
 get rafLoopsProgress(): number {
  const { progress, direction } = this.animation.effect!.getComputedTiming();

  const prog = direction === 'normal'
    // ?? 1 because during the active phase (the only time when raf runs), null progress means finished
    ? (progress ?? 1)
    // ?? 0 for the same reason except accounting for direction === 'reverse' instead of 'normal'
    : 1 - (progress ?? 0);

  return prog;
 }

 // true if both keyframes generators are undefined in composed effect
 protected noKeyframes: boolean = false;
 // true if both mutator generators are undefined in composed effect
 protected noRaf: boolean = false;
 // true if only backward keyframes generators is undefined in composed effect
 protected bFramesMirrored: boolean = false;
 // true if only backward mutator generator is undefined in composed effect
 protected bRafMirrored: boolean = false;

  // GROUP: Effect Details
  protected abstract get category(): EffectCategory;
  protected effectName: string;
  protected effectComposer: TEffectComposer;
  protected effectOptions: EffectOptions<TEffectComposer> = {} as EffectOptions<TEffectComposer>;
  
  /**@internal*/
  composedEffect = {} as WithRequired<ComposedEffect, 'forwardKeyframesGenerator' | 'backwardKeyframesGenerator'>;
  /**@internal*/
  rafMutators: {
    forwardMutator?: () => void;
    backwardMutator?: () => void;
  } = {};

  /**
   * Returns specific details about the animation's effect.
   * @returns An object containing
   *  * {@link AnimClipEffectDetails.category|category},
   *  * {@link AnimClipEffectDetails.effectName|effectName},
   *  * {@link AnimClipEffectDetails.effectComposer|effectComposer},
   *  * {@link AnimClipEffectDetails.effectOptions|effectOptions},
   */
  getEffectDetails(): AnimClipEffectDetails;
  /**
   * Returns the value of a single specific property.
   * @param propName - name of the desired property
   * @ignore
   */
  getEffectDetails<T extends keyof AnimClipEffectDetails>(propName: T): AnimClipEffectDetails[T];
  /**
   * Returns an object containing a subset of the object that would normally be returned.
   * @param propNames - array of strings specifying which properties should be included.
   * @ignore
   */
  getEffectDetails<T extends (keyof AnimClipEffectDetails)[]>(propNames: (keyof AnimClipEffectDetails)[] | T): PickFromArray<AnimClipEffectDetails, T>;
  /**
   * @group Property Getter Methods
   */
  getEffectDetails(specifics?: keyof AnimClipEffectDetails | (keyof AnimClipEffectDetails)[]):
    | AnimClipEffectDetails
    | AnimClipEffectDetails[keyof AnimClipEffectDetails]
    | Partial<Pick<AnimClipEffectDetails, keyof AnimClipEffectDetails>>
  {
    const result: AnimClipEffectDetails = {
      category: this.category,
      effectName: this.effectName,
      effectComposer: this.effectComposer,
      effectOptions: this.effectOptions
    };

    return specifics ? getPartial(result, specifics) : result;
  }

  // GROUP: Timing
  private get compoundedPlaybackRate(): number { return this.config.playbackRate * (this._parentSequence?.getTiming().compoundedPlaybackRate ?? 1); }
  
  /**@internal*/ fullStartTime = NaN;
  /**@internal*/ get activeStartTime() { return (this.fullStartTime + this.getTiming('delay')) / this.getTiming('playbackRate'); }
  /**@internal*/ get activeFinishTime() { return( this.fullStartTime + this.getTiming('delay') + this.getTiming('duration')) / this.getTiming('playbackRate'); }
  /**@internal*/ get fullFinishTime() { return (this.fullStartTime + this.getTiming('delay') + this.getTiming('duration') + this.getTiming('endDelay')) / this.getTiming('playbackRate'); }

  /**
   * Returns timing-related details about the animation.
   * @returns An object containing
   *  * {@link AnimClipTiming.startsWithPrevious|startsWithPrevious},
   *  * {@link AnimClipTiming.startsNextClipToo|startsNextClipToo},
   *  * {@link AnimClipTiming.duration|duration},
   *  * {@link AnimClipTiming.delay|delay},
   *  * {@link AnimClipTiming.endDelay|endDelay},
   *  * {@link AnimClipTiming.easing|easing},
   *  * {@link AnimClipTiming.playbackRate|playbackRate},
   *  * {@link AnimClipTiming.compoundedPlaybackRate|compoundedPlaybackRate},
   */
  getTiming(): AnimClipTiming;
  /**
   * Returns the value of a single specific property.
   * @param propName - name of the desired property
   * @ignore
   */
  getTiming<T extends keyof AnimClipTiming>(propName: T): AnimClipTiming[T];
  /**
   * Returns an object containing a subset of the object that would normally be returned.
   * @param propNames - array of strings specifying which properties should be included.
   * @ignore
   */
  getTiming<T extends (keyof AnimClipTiming)[]>(propNames: (keyof AnimClipTiming)[] | T): PickFromArray<AnimClipTiming, T>;
  /**
   * @group Property Getter Methods
   */
  getTiming(specifics?: keyof AnimClipTiming | (keyof AnimClipTiming)[]):
    | AnimClipTiming
    | AnimClipTiming[keyof AnimClipTiming]
    | Partial<Pick<AnimClipTiming, keyof AnimClipTiming>>
  {
    const config = this.config;
    const result: AnimClipTiming = {
      startsWithPrevious: config.startsWithPrevious,
      startsNextClipToo: config.startsNextClipToo,
      duration: config.duration,
      delay: config.delay,
      endDelay: config.endDelay,
      easing: config.easing,
      playbackRate: config.playbackRate,
      compoundedPlaybackRate: this.compoundedPlaybackRate,
    };

    return specifics ? getPartial(result, specifics) : result;
  }

  // GROUP: Modifiers
  /**
   * Returns details about how the DOM element is modified beyond just the effect of the animation.
   * @returns An object containing
   *  * {@link AnimClipModifiers.cssClasses|cssClasses},
   *  * {@link AnimClipModifiers.commitsStyles|commitsStyles},
   *  * {@link AnimClipModifiers.composite|composite},
   */
  getModifiers(): AnimClipModifiers;
  /**
   * Returns the value of a single specific property.
   * @param propName - name of the desired property
   * @ignore
   */
  getModifiers<T extends keyof AnimClipModifiers>(propName: T): AnimClipModifiers[T];
  /**
   * Returns an object containing a subset of the object that would normally be returned.
   * @param propNames - array of strings specifying which properties should be included.
   * @ignore
   */
  getModifiers<T extends (keyof AnimClipModifiers)[]>(propNames: (keyof AnimClipModifiers)[] | T): PickFromArray<AnimClipModifiers, T>;
  /**
   * @group Property Getter Methods
   */
  getModifiers(specifics?: keyof AnimClipModifiers | (keyof AnimClipModifiers)[]) {
    const config = this.config;
    const result: AnimClipModifiers = {
      cssClasses: {
        toAddOnStart: [...(config.cssClasses.toAddOnStart ?? [])],
        toAddOnFinish: [...(config.cssClasses.toAddOnFinish ?? [])],
        toRemoveOnStart: [...(config.cssClasses.toRemoveOnStart ?? [])],
        toRemoveOnFinish: [...(config.cssClasses.toRemoveOnFinish ?? [])],
      },
      composite: config.composite,
      commitsStyles: config.commitsStyles,
    };

    return specifics ? getPartial(result, specifics) : result;
  }

  // GROUP: Status
  protected inProgress: AnimClipStatus['inProgress'] = false; // true only during animate() (regardless of pause state)
  protected isRunning: AnimClipStatus['isRunning'] = false; // true only when inProgress and !isPaused
  protected isPaused: AnimClipStatus['isPaused'] = false;
  protected direction: AnimClipStatus['direction'] = 'forward';
  protected firstRun: boolean = true;
  /**
   * Returns details about the animation's current status.
   * @returns An object containing
   *  * {@link AnimClipStatus.inProgress|inProgress},
   *  * {@link AnimClipStatus.isRunning|isRunning},
   *  * {@link AnimClipStatus.isPaused|isPaused},
   *  * {@link AnimClipStatus.direction|direction},
   */
  getStatus(): AnimClipStatus;
  /**
   * Returns the value of a single specific property.
   * @param propName - name of the desired property
   * @ignore
   */
  getStatus<T extends keyof AnimClipStatus>(propName: T): AnimClipStatus[T];
  /**
   * Returns an object containing a subset of the object that would normally be returned.
   * @param propNames - array of strings specifying which properties should be included.
   * @ignore
   */
  getStatus<T extends (keyof AnimClipStatus)[]>(propNames: (keyof AnimClipStatus)[] | T): PickFromArray<AnimClipStatus, T>;
  /**
   * @group Property Getter Methods
   */
  getStatus(specifics?: keyof AnimClipStatus | (keyof AnimClipStatus)[]):
    | AnimClipStatus
    | AnimClipStatus[keyof AnimClipStatus]
    | Partial<Pick<AnimClipStatus, keyof AnimClipStatus>>
  {
    const result: AnimClipStatus = {
      inProgress: this.inProgress,
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      direction: this.direction,
    };

    return specifics ? getPartial(result, specifics) : result;
  }

  /*-:**************************************************************************************************************************/
  /*-:*********************************        CONSTRUCTOR & INITIALIZERS        ***********************************************/
  /*-:**************************************************************************************************************************/
  /**
   * Used by a parent to set pointers to itself (the parent) within the clip.
   * @internal
   */
  setLineage(sequence: AnimSequence, timeline: AnimTimeline | undefined): this {
    this._parentSequence = sequence;
    this._parentTimeline = timeline;
    return this;
  }

  /**
   * Used by a parent to remove pointers to itself (the parent) within the clip.
   * @internal
   */
  removeLineage(): this {
    this._parentSequence = undefined;
    this._parentTimeline = undefined;
    return this;
  }

  constructor(domElem: DOMElement | null | undefined, effectName: string, bank: EffectComposerBank) {
    if (webchalk.clipCreatorLock) {
      throw this.generateError(
        TypeError,
        `Illegal constructor. Clips can only be instantiated using clip factory functions.` +
        errorTip(
          `Tip: Clip factory functions are created by webchalk.createAnimationClipFactories(),` +
          ` a method that returns an object containing factory functions like Entrance(), Motion(), etc.` +
          ` (A factory function is just a function that returns an instance of a class without using 'new').`
        )
      );
    }
    webchalk.clipCreatorLock = true;

    this.id = AnimClip.id++;
    
    if (!domElem) {
      throw this.generateError(CustomErrors.InvalidElementError, `Element must not be null or undefined.`);
    }
    this.domElem = domElem;
    this.effectName = effectName;
    
    this.effectComposer = bank[effectName] as TEffectComposer;

    // checking if this.effectComposer exists is deferred until initialize()
  }

  /**@internal*/
  initialize(effectOptions: EffectOptions<TEffectComposer>, effectConfig: Partial<TClipConfig> = {}): this {
    // Throw error if invalid effectName
    // Deferred until initialize() so that this.category has actually been initialized by derived class by now
    if (!this.effectComposer) { throw this.generateError(RangeError, `Invalid effect name: "${this.effectName}" does not exists in the "${this.category}" category.`); }

    this.effectOptions = effectOptions;

    this.config = this.mergeConfigs(effectConfig, this.effectComposer.defaultConfig ?? {}, this.effectComposer.immutableConfig ?? {});
    // cannot be exactly 0 because that causes some Animation-related bugs that can't be easily worked around
    this.config.duration = Math.max(this.getTiming('duration') as number, 0.01);

    // playbackRate is not included because it is computed at the time of animating
    const { delay, duration, endDelay, easing, composite  } = this.config;
    const keyframeOptions: KeyframeEffectOptions = {
      delay,
      duration,
      endDelay,
      fill: 'forwards',
      easing: useEasing(easing),
      composite: composite,
    };

    this.animation = new WebChalkAnimation(
      new KeyframeEffect(
        this.domElem,
        // Using fontFeatureSettings handles a very strange Firefox bug that causes animations to run without any visual changes
        // when the animation is finished, setKeyframes() is called, and the animation continues after extending the runtime using
        // endDelay. It appears that the bug only occurs when the keyframes field contains nothing that will actually affect the
        // styling of the element (for example, adding {['fake-field']: 'bla'} will not fix it), but I obviously do not want to
        // add anything that will actually affect the style of the element, so I decided to use fontFeatureSettings and set it to
        // the default value to make it as unlikely as possible that anything the user does is obstructed.
        [{fontFeatureSettings: 'normal'}],
        keyframeOptions
      ),
      new KeyframeEffect(
        this.domElem,
        [],
        {
          ...keyframeOptions,
          easing: useEasing(easing, {inverted: true}),
          // delay & endDelay are of course swapped when we want to play in "reverse"
          delay: keyframeOptions.endDelay,
          endDelay: keyframeOptions.delay,
        },
      ),
      this.generateError
    );

    // TODO: Figure out how to disable any pausing/stepping functionality in the timeline while stopped for tasks
    this.animation.pauseForTasks = () => {
      this.parentTimeline?.disablePlaybackButtons();
      this.root.pause();
    }
    this.animation.unpauseFromTasks = () => {
      this.root.unpause();
      this.parentTimeline?.enablePlaybackButtons();
    }

    return this;
  }

  private static mergeCssClassesConfig<T extends {cssClasses?: Partial<CssClassOptions>}>(...configObjects: T[]): CssClassOptions {
    return {
      toAddOnFinish: mergeArrays(...configObjects.map(obj => obj['cssClasses']?.['toAddOnFinish'])),
      toAddOnStart: mergeArrays(...configObjects.map(obj => obj['cssClasses']?.['toAddOnStart'])),
      toRemoveOnFinish: mergeArrays(...configObjects.map(obj => obj['cssClasses']?.['toRemoveOnFinish'])),
      toRemoveOnStart: mergeArrays(...configObjects.map(obj => obj['cssClasses']?.['toRemoveOnStart'])),
    };
  }

  protected mergeConfigs(
    usageConfig: Partial<TClipConfig>,
    effectComposerDefaultConfig: Partial<TClipConfig>,
    effectComposerImmutableConfig: Partial<TClipConfig>,
  ): TClipConfig {
    return {
      ...AnimClip.baseDefaultConfig,

      // layer 2 subclass defaults take priority
      ...this.categoryDefaultConfig,

      // layer 3 config defined in effect composer takes priority over default
      ...effectComposerDefaultConfig,

      // layer 4 config (person using WebChalk) takes priority over composer
      ...usageConfig,

      // mergeable properties
      cssClasses: AnimClip.mergeCssClassesConfig<PartialPick<AnimClipConfig, 'cssClasses'>>(
        AnimClip.baseDefaultConfig,
        this.categoryDefaultConfig,
        effectComposerDefaultConfig,
        usageConfig,
      ),

      // layer 3 immutable config take priority over layer 4 config
      ...effectComposerImmutableConfig,

      // layer 2 subclass immutable config takes priority over layer 3 immutable config
      ...this.categoryImmutableConfig,
    };
  }

  /*-:**************************************************************************************************************************/
  /*-:*****************************************        PLAYBACK        *********************************************************/
  /*-:**************************************************************************************************************************/
  /**
   * Plays the animation clip (animation runs forward).
   * @returns A promise that is resolved when the animation finishes playing (including playing its endDelay phase).
   * @group Playback Methods
   */
  async play(): Promise<this>;
  /**@internal*/
  async play(parentSequence: AnimSequence): Promise<this>;
  async play(parentSequence?: AnimSequence): Promise<this> {
    // both parentSequence vars should either be undefined or the same AnimSequence
    if (this._parentSequence !== parentSequence) { this.throwChildPlaybackError(this.play.name); }
    return this.animate('forward');
  }

  /**
   * Rewinds the animation clip (animation runs backward).
   * @returns A promise that is resolved when the animation finishes rewinding (including rewinding its delay phase).
   * @group Playback Methods
   */
  async rewind(): Promise<this>;
  /**@internal*/
  async rewind(parentSequence: AnimSequence): Promise<this>;
  async rewind(parentSequence?: AnimSequence): Promise<this> {
    if (this._parentSequence !== parentSequence) { this.throwChildPlaybackError(this.rewind.name); }
    return this.animate('backward');
  }

  /**
   * Pauses the animation clip.
   *  * If the clip is not already in progress, this method does nothing.
   * @group Playback Methods
   */
  pause(): this;
  /**@internal*/
  pause(parentSequence: AnimSequence): this;
  pause(parentSequence?: AnimSequence): this {
    if (this._parentSequence !== parentSequence) { this.throwChildPlaybackError(this.pause.name); }
    if (this.isRunning) {
      this.isPaused = true;
      this.isRunning = false;
      this.animation.pause();
    }
    return this;
  }

  /**
   * Unpauses the animation clip.
   *  * If the clip is not currently paused, this method does nothing.
   * @group Playback Methods
   */
  unpause(): this;
  /**@internal*/
  unpause(parentSequence: AnimSequence): this;
  unpause(parentSequence?: AnimSequence): this {
    if (this._parentSequence !== parentSequence) { this.throwChildPlaybackError(this.unpause.name); }
    if (this.isPaused) {
      this.isPaused = false;
      this.isRunning = true;
      this.animation.play();
    }
    return this;
  }

  /**
   * Forces the animation clip to instantly finish.
   *  * This works even if the animation is not already currently in progress.
   *  * The animation will still pause for any tasks generated by {@link AnimClip.scheduleTask | scheduleTask()}.
   *  * Does not work if the clip is currently paused.
   * @group Playback Methods
   */
  async finish(): Promise<this>;
  /**@internal*/
  async finish(parentSequence: AnimSequence): Promise<this>;
  async finish(parentSequence?: AnimSequence): Promise<this> {
    if (this._parentSequence !== parentSequence) { this.throwChildPlaybackError(this.finish.name); }
    // finish() is not allowed to execute if clip is paused
    // TODO: maybe throw an error instead of just returning
    if (this.isPaused) { return this; }
    
    // Needs to play/rewind first if not already in progress.
    // This is essentially for the case where the animation is NOT part of a sequence and finish()
    // is called without having first called play() or rewind() (I decided that the expected behavior is to
    // instantly finish the animation in whatever the current direction is).
    if (!this.inProgress) {
      switch(this.animation.direction) {
        case "forward":
          this.play(parentSequence!);
          break;
        case "backward":
          this.rewind(parentSequence!);
          break;
        default: throw this.generateError(
          Error,
          `An error here should be impossible. this.animation.direction should only be 'forward' or 'backward'.`
        );
      }
    }

    await this.animation.finish();
    return this;
  }

  // accepts a time to wait for (converted to an endDelay) and returns a Promise that is resolved at that time
  /**
   * Returns a `Promise` that is resolved when the animation clip reaches the specified time in the specified direction.
   * @param direction - the direction the animation will be going when the Promise is resolved
   * @param phase - the phase of the animation where the Promise will be resolved
   * @param timePosition - the time position within the phase when the Promise will be resolved
   * @returns A Promise that is resolved at the specific time point of the animation.
   * 
   * @example
   * <!-- EX:S id="AnimClip.generateTimePromise-1" code-type="ts" -->
   * ```ts
   * async function testFunc() {
   *   const { Entrance } = webchalk.createAnimationClipFactories();
   *   const square = document.querySelector('.square');
   *   const ent = Entrance(square, '~fade-in', []);
   *   // wait until ent is played and gets 1/5 of the way through the active phase of the animation
   *   await ent.generateTimePromise('forward', 'activePhase', '20%');
   *   console.log('1/5 done playing!');
   * }
   * 
   * testFunc();
   * ```
   * <!-- EX:E id="AnimClip.generateTimePromise-1" -->
   * 
   * @example
   * <!-- EX:S id="AnimClip.generateTimePromise-2" code-type="ts" -->
   * ```ts
   * async function testFunc() {
   *   const { Entrance } = webchalk.createAnimationClipFactories();
   *   const square = document.querySelector('.square');
   *   const ent = Entrance(square, '~fade-in', []);
   *    // wait until ent is eventually rewound and gets 4/5 of the way through rewinding the active phase of the animation
   *    await ent.generateTimePromise('backward', 'activePhase', '20%');
   *    console.log('4/5 done rewinding!');
   * }
   * 
   * testFunc();
   * ```
   * <!-- EX:E id="AnimClip.generateTimePromise-2" -->
   * 
   * @group Timing Event Methods
   */
  generateTimePromise(
    direction: 'forward' | 'backward',
    phase: 'delayPhase' | 'activePhase' | 'endDelayPhase' | 'whole',
    timePosition: number | 'beginning' | 'end' | `${number}%`
  ): Promise<void> {
    return this.animation.generateTimePromise(direction, phase, timePosition);
  }

  /**
   * @internal
   * @group Timing Event Methods
   */
  addIntegrityblock(
    phase: 'delayPhase' | 'activePhase' | 'endDelayPhase' | 'whole',
    timePosition: number | 'beginning' | 'end' | `${number}%`,
    promises: {onPlay?: Function, onRewind?: Function},
  ): void {
    return this.animation.addIntegrityblock(phase, timePosition, promises);
  }

  /**
   * Pauses the animation clip when it reaches the specified time and performs the specified task,
   * unpausing once the task is complete.
   *  * If the clip is part of a structure (like a sequence), the entire structure is paused as well.
   * @param phase - the phase of the animation to place the blocks in
   * @param timePosition - the time position within the phase when the task should be performed
   * @param task - an object that contains the functions that should be called when {@link timePosition} is reached
   * @param task.onPlay - the function that will be called if the clip is playing
   * @param task.onRewind - the function that will be called if the clip is rewinding
   * @returns {void}
   * 
   * @example
   * <!-- EX:S id="AnimClip.scheduleTasks-1" code-type="ts" -->
   * ```ts
   * async function wait(milliseconds: number) { // Promise-based timer
   *    return new Promise(resolve => setTimeout(resolve, milliseconds));
   * }
   * 
   * const square = document.querySelector('.square');
   * const { Entrance } = webchalk.createAnimationClipFactories();
   * const ent = Entrance(square, '~fade-in', [], {endDelay: 1500});
   * 
   * // adds 1 task that will pause the clip for 2 seconds once the clip is 15% through the active phase
   * ent.scheduleTask('activePhase', '15%', {onPlay: () => wait(2000)});
   * // adds 1 more task at the same point that will pause the clip for 3 seconds.
   * ent.scheduleTask('activePhase', '15%', {onPlay: () => wait(3000)});
   * // adds 1 task at 40% into the endDelay phase that will...
   * // ... log 'HELLO' if the clip is playing forward
   * // ... log 'WORLD' if the clip is rewinding
   * ent.scheduleTask('endDelayPhase', '40%', {
   *   onPlay: () => console.log('HELLO'),
   *   onRewind: () => console.log('WORLD')
   * });
   * 
   * (async () => {
   *   await ent.play();
   *   // ↑
   *   // Once ent is 15% through the active phase, it will pause and handle its scheduled tasks.
   *   // -- "wait(2000)" resolves after 2 seconds.
   *   // -- "wait(3000)" resolves after 3 seconds.
   *   // There are no more tasks at this point, so playback is resumed.
   *   // Once ent is 40% through the endDelay phase, it will pause and handle its tasks
   *   // -- 'HELLO' is logged to the console
   *   // There are no more tasks at this point, so playback is resumed.
   *   await ent.rewind();
   *   // ↑
   *   // Once ent rewinds back to the 40% point of the endDelay phase, it will pause and...
   *   // ... handle its scheduled tasks
   *   // -- 'WORLD' is logged to the console
   *   // There are no more tasks at this point, so playback is resumed.
   * })();
   * ```
   * <!-- EX:E id="AnimClip.scheduleTasks-1" -->
   * 
   * @group Timing Event Methods
   */
  scheduleTask(
    phase: 'delayPhase' | 'activePhase' | 'endDelayPhase' | 'whole',
    timePosition: number | 'beginning' | 'end' | `${number}%`,
    task: {onPlay?: Function, onRewind?: Function}
  ): void {
    return this.animation.scheduleTask(phase, timePosition, task);
  }

  /**
   * Multiplies playback rate of parent timeline and sequence (if exist) with base playback rate.
   * @group Playback Methods
   * @internal
   */
  useCompoundedPlaybackRate() { this.animation.updatePlaybackRate(this.compoundedPlaybackRate); }

  /*-:**************************************************************************************************************************/
  /*-:*****************************************         ANIMATE         ********************************************************/
  /*-:**************************************************************************************************************************/
  protected _onStartForward(): void {};
  protected _onFinishForward(): void {};
  protected _onStartBackward(): void {};
  protected _onFinishBackward(): void {};

  protected async animate(direction: 'forward' | 'backward'): Promise<this> {
    if (this.inProgress) { return this; }

    // if this is the first time running animate() or the effect composition is set to repeat,
    // retrieve the generators and update animation effects' directions according to presence
    // of keyframes generators
    if (
      this.firstRun
      || direction === 'forward' && this.effectComposer.effectCompositionFrequency === 'on-every-play'
    ) {
      this.firstRun = false;
      this.retrieveGenerators();
      
      this.animation.forwardEffect.updateTiming({
        direction: this.composedEffect.reverseKeyframesEffect ? 'reverse' : 'normal',
      });

      this.animation.backwardEffect.updateTiming({
        // if no backward keyframes generator was specified, assume the reverse of the forward keyframes generator
        direction: xor(this.bFramesMirrored, this.composedEffect.reverseKeyframesEffect) ? 'reverse' : 'normal',
      });
    }

    const config = this.config;

    const animation = this.animation;
    animation.setDirection(direction);
    this.direction = direction;
    // Clear the current keyframes to prevent interference with generators
    animation.setForwardFrames([{fontFeatureSettings: 'normal'}]);
    animation.setBackwardFrames([]);
    this.useCompoundedPlaybackRate();

    // used as resolve() and reject() in the eventually returned promise
    const { promise, resolve, reject } = Promise.withResolvers<this>();
    
    this.inProgress = true;
    this.isRunning = true;

    if (this._parentSequence?.getStatus('skippingOn') || this._parentSequence?.getStatus('usingFinish'))
      { animation.finish(); }
    else
      { animation.play(); }
    if (this._parentSequence?.getStatus('isPaused')) { animation.pause(); }
    
    // After delay phase, apply class modifications and call onStart functions.
    animation.onDelayFinish = () => {
      try {
        switch(direction) {
          // FORWARD
          case 'forward':
            // handle CSS classes and pre-start function
            this.domElem.classList.add(...config.cssClasses.toAddOnStart ?? []);
            this.domElem.classList.remove(...config.cssClasses.toRemoveOnStart ?? []);
            this._onStartForward();
            
            // Generate keyframes
            // Keyframe generation is done here so that generations operations that rely on the side effects of class modifications and _onStartForward()...
            // ...can function properly.
            try {
              animation.setForwardFrames(this.composedEffect.forwardKeyframesGenerator(), this.composedEffect.reverseKeyframesEffect);
              this.rafMutators.forwardMutator = this.composedEffect.forwardMutatorGenerator?.();
            }
            catch (err: unknown) {
              throw this.generateError(err as Error);
            }

            // If RAF mutator exists, begin RAF loop
            if (this.rafMutators.forwardMutator) { requestAnimationFrame(this.loop); }

            // sets it back to 'forwards' in case it was set to 'none' in a previous running
            animation.effect?.updateTiming({fill: 'forwards'});
            break;
    
          // BACKWARD
          case 'backward':
            // handle pre-start function and CSS classes
            this._onStartBackward();
            this.domElem.classList.add(...config.cssClasses.toRemoveOnFinish ?? []);
            this.domElem.classList.remove(...config.cssClasses.toAddOnFinish ?? []);

            // Generate keyframes
            try {
              this.animation.setBackwardFrames(this.composedEffect.backwardKeyframesGenerator(), this.bFramesMirrored, this.composedEffect.reverseKeyframesEffect);
              this.rafMutators.backwardMutator = this.composedEffect.backwardMutatorGenerator?.();
            }
            catch (err: unknown) { throw this.generateError(err as Error); }

            // If RAF mutator exists, begin RAF loop
            if (this.rafMutators.backwardMutator) { requestAnimationFrame(this.loop); }
            break;
    
          default:
            throw this.generateError(RangeError, `Invalid direction "${direction}" passed to animate(). Must be "forward" or "backward".`);
        }
      }
      catch(err: unknown) {
        reject(err);
      }
    };

    // After active phase, then handle commit settings, apply class modifications, and call onFinish functions.
    animation.onActiveFinish = () => {
      // CHANGE NOTE: Move hidden class stuff here
      try {
        // if should commit styles, only try to use commitStyles() if there are meaningful keyframes
        if (config.commitsStyles && !this.noKeyframes) {
          // Attempt to apply the styles to the element.
          try {
            animation.commitStyles();
            // ensures that accumulating effects are not stacked after commitStyles() (hopefully, new spec will prevent the need for this workaround)
            animation.effect?.updateTiming({ fill: 'none' });
          }
          // If commitStyles() fails, it's because the element is not rendered.
          catch (_) {
            // attempt to override the hidden state and apply the style.
            try {
              this.domElem.classList.add('webchalk-force-show'); // CHANGE NOTE: Use new hidden classes
              animation.commitStyles();
              animation.effect?.updateTiming({ fill: 'none' });
              this.domElem.classList.remove('webchalk-force-show');
            }
            // If this fails, then the element's parent is hidden. Do not attempt to remedy; throw error instead.
            catch (err: unknown) {
              let reasons = [];
              if (getComputedStyle(this.domElem).display === 'none') {
                reasons.push(detab`Something is causing the CSS style {display: hidden} to be applied besides the class "webchalk-display-none".`);
              }
              let ancestor = this.domElem;
              while (ancestor = ancestor.parentElement as DOMElement) {
                if (!ancestor) { break; }
                if (getComputedStyle(ancestor).display === 'none') {
                  reasons.push(detab`One of the parent elements of the element is unrendered.`);
                }
              }
              throw this.generateError(CustomErrors.CommitStylesError,
                detab`Failed to commit styles on the element while it was unrendered.\
                Animation styles normally cannot be saved on unrendered elements in JavaScript, but WebChalk allows it ONLY IF\
                the element is unrendered due to having the CSS class "webchalk-display-none". If there is ANY other reason\
                for the element not being rendered, the styles cannot be committed.
                Detected reasons:\n`
                + reasons.map((reason, index) => `    ${index + 1}) ${reason}`).join('\n')
              );
            }
          }
        }
  
        switch(direction) {
          case 'forward':
            this.domElem.classList.add(...config.cssClasses.toAddOnFinish ?? []);
            this.domElem.classList.remove(...config.cssClasses.toRemoveOnFinish ?? []);
            this._onFinishForward();
            break;
          case 'backward':
            this._onFinishBackward();
            this.domElem.classList.add(...config.cssClasses.toRemoveOnStart ?? []);
            this.domElem.classList.remove(...config.cssClasses.toAddOnStart ?? []);
            break;
        }
      }
      catch (err: unknown) {
        reject(err);
      }
    };
    
    // After endDelay phase, cancel animation and resolve overall promise.
    animation.onEndDelayFinish = () => {
      this.inProgress = false;
      this.isRunning = false;
      animation.cancel();
      resolve(this);
    };

    return promise.catch((err) => {
      this.root.pause();
      throw err;
    })
  }

  private retrieveGenerators(): void {
    try {
      // retrieve generators
      let {
        forwardKeyframesGenerator,
        backwardKeyframesGenerator,
        forwardMutatorGenerator,
        backwardMutatorGenerator,
        reverseKeyframesEffect = false,
        reverseMutatorEffect = false,
      } = call(this.effectComposer.composeEffect, this, ...this.getEffectDetails().effectOptions);

      // if no generators are specified, make keyframes generators return empty keyframes array
      if (!(forwardKeyframesGenerator || backwardKeyframesGenerator || forwardMutatorGenerator || backwardMutatorGenerator)) {
        forwardKeyframesGenerator = () => [];
        backwardKeyframesGenerator = () => [];
        this.noKeyframes = this.noRaf = true;
      }
      else {
        // if both keyframe generators are unspecified, make them return empty keyframes array
        if (!forwardKeyframesGenerator && !backwardKeyframesGenerator) {
          this.noKeyframes = true;
          forwardKeyframesGenerator = () => [];
          backwardKeyframesGenerator = () => [];
        }
        // if backward keyframes generator is unspecified, use forward generator and set mirrored to true
        else if (!backwardKeyframesGenerator) {
          backwardKeyframesGenerator = forwardKeyframesGenerator!;
          this.bFramesMirrored = true;
        }
        // if forward keyframes generator is unspecified, throw error
        else if (!forwardKeyframesGenerator) {
          throw new CustomErrors.InvalidEffectError(
            `The backward keyframes generator cannot be specified without the forward keyframes generator as well.`
          );
        }
  
        // if both RAF generators are unspecified, do nothing
        if (!forwardMutatorGenerator && !backwardMutatorGenerator) {
          this.noRaf = true;
        }
        // if backward RAF mutator generator is unspecified, use forward generator and set mirrored to true
        else if (!backwardMutatorGenerator) {
          backwardMutatorGenerator = forwardMutatorGenerator;
          this.bRafMirrored = true;
        }
        // if forward RAF mutator generator is unspecified, throw error
        else if (!forwardMutatorGenerator) {
          throw new CustomErrors.InvalidEffectError(
            `The backward mutator generator cannot be specified without the forward mutator generator as well.`
          );
        }
      }

      this.composedEffect = {
        forwardKeyframesGenerator: forwardKeyframesGenerator!,
        backwardKeyframesGenerator,
        forwardMutatorGenerator,
        backwardMutatorGenerator,
        reverseKeyframesEffect,
        reverseMutatorEffect,
      };
    }
    catch (err: unknown) { throw this.generateError(err as Error); }
  }

  // private refreshGenerators(): void {
  //   try {
  //     // retrieve generators
  //     let {
  //       forwardKeyframesGenerator,
  //       backwardKeyframesGenerator,
  //       forwardMutatorGenerator,
  //       backwardMutatorGenerator,
  //       reverseKeyframesEffect = false,
  //       reverseMutatorEffect = false,
  //     } = call(this.effectComposer.composeEffect, this, ...this.getEffectDetails().effectOptions);

  //     this.composedEffect = {
  //       forwardKeyframesGenerator: forwardKeyframesGenerator! ?? backwardKeyframesGenerator!,
  //       backwardKeyframesGenerator: backwardKeyframesGenerator! ?? forwardKeyframesGenerator!,
  //       forwardMutatorGenerator: forwardMutatorGenerator ?? backwardMutatorGenerator,
  //       backwardMutatorGenerator: backwardMutatorGenerator ?? forwardMutatorGenerator,
  //       reverseKeyframesEffect,
  //       reverseMutatorEffect,
  //     };
  //   }
  //   catch (err: unknown) { throw this.generateError(err as Error); }
  // }

  private loop = (): void => {
    const rafMutators = this.rafMutators!;
    try {
      switch(this.animation.direction) {
        case "forward":
          rafMutators.forwardMutator!();
          break;
        case "backward":
          rafMutators.backwardMutator!();
          break;
        default: throw this.generateError(Error, `Something very wrong occured for there to be an error here.`);
      }
    }
    catch (err: unknown) { throw this.generateError(err as Error); }

    if (this.rafLoopsProgress === 1) { return; }
    requestAnimationFrame(this.loop);
  }

  /**
   * Calculates the value partway between two fixed numbers (an initial value and a final value)
   * based on the progress of the animation.
   *  * Intended for use inside {@link ComposedEffect.forwardMutatorGenerator} and {@link ComposedEffect.backwardMutatorGenerator}.
   * @param initialVal - the starting value
   * @param finalVal - the ending value
   * @returns The number that is a percentage of the way between `initialVal` and `finalVal` based on the percentage of completion of the animation (playing or rewinding).
   * 
   * @see {@link ComposedEffect}
   * 
   * @example
   * <!-- EX:S id="AnimClip.computeTween-1" code-type="ts" -->
   * ```ts
   * const {Entrance} = webchalk.createAnimationClipFactories({
   *   customEntranceEffects: {
   *     rotate: {
   *       composeEffect(degrees: number) {
   *         return {
   *           // when playing, keep computing the value between 0 and 'degrees'
   *           forwardMutatorGenerator: () => () => { this.domElem.style.rotate = this.computeTween(0, degrees)+'deg'; },
   *           // when rewinding, keep computing the value between 'degrees' and 0
   *           backwardMutatorGenerator: () => () => { this.domElem.style.rotate = this.computeTween(degrees, 0)+'deg'; }
   *         };
   *       }
   *     }
   *   },
   * });
   * 
   * const someElement = document.querySelector('.some-element');
   * 
   * (async () => {
   *   await Entrance(someElement, 'rotate', [360], {duration: 2000}).play();
   *   // ↑ At 1.5 seconds (or 1500ms), the animation is 1.5/2 = 75% done playing.
   *   // Thus, computeTween(0, 360) at that exactly moment would...
   *   // return the value 75% of the way between 0 and 360 (= 270).
   *   // Therefore, at 1.5 seconds of playing, someElement's rotation is set to "270deg".
   *   
   *   await Entrance(someElement, 'rotate', [360], {duration: 2000}).rewind();
   *   // ↑ At 0.5 seconds (or 500ms), the animation is 0.5/2 = 25% done rewinding.
   *   // Thus, computeTween(360, 0) at that exactly moment would...
   *   // return the value 25% of the way between 360 and 0 (= 270).
   *   // Therefore, at 0.5 seconds of rewinding, someElement's rotation is set to "270deg".
   * })();
   * ```
   * <!-- EX:E id="AnimClip.computeTween-1" -->
   * 
   * @group Helper Methods
   */
  computeTween(initialVal: number, finalVal: number): number {
    // if animation progress is complete and commitsStyles is false,
    // return the initial value
    if (this.rafLoopsProgress === 1 && this.config.commitsStyles === false) {
      return initialVal;
    }

    // if using a mirror for the backward mutator, computeTween() should flip the progresss
    // if mutators are reversed, computeTween() should flip the progress
    const flipProgress = xor(
      this.animation.direction === 'backward' && this.bRafMirrored,
      this.composedEffect.reverseMutatorEffect
    );

    // return linear interpolation between initial value and final value based on progress of animation
    return initialVal + (finalVal - initialVal) * (flipProgress ? 1 - this.rafLoopsProgress : this.rafLoopsProgress);
  }

  /*-:**************************************************************************************************************************/
  /*-:*****************************************         ERRORS         *********************************************************/
  /*-:**************************************************************************************************************************/
  protected generateError: ClipErrorGenerator = (ErrorClassOrInstance, msg = '<unspecified error>', elementOverride?: DOMElement) => {
    return generateError(ErrorClassOrInstance, msg as string, {
      timeline: this._parentTimeline,
      sequence: this._parentSequence,
      clip: this,
      element: elementOverride ? elementOverride : this.domElem
    });
  }

  private throwChildPlaybackError(funcName: string): never {
    throw this.generateError(CustomErrors.ChildPlaybackError, `Cannot directly call ${funcName}() on an animation clip while it is part of a sequence.`);
  }

  protected preventConnector() {
    if (this.domElem instanceof WebChalkConnectorElement) {
      throw this.generateError(CustomErrors.InvalidElementError,
        `Connectors cannot be animated using ${this.category}().` +
        `${errorTip(`Tip: WebChalkConnectorElement elements cannot be animated using Entrance() or Exit() because many of the animations are not really applicable.` +
          ` Instead, any entrance or exit effects that make sense for connectors are defined in ConnectorEntrance() and ConnectorExit().`
        )}`,
        this.domElem
      );
    }
  }
}










































































































































































































































































































