import { AnimSequence } from "./AnimSequence";
import { AnimTimeline } from "./AnimTimeline";
import { EffectOptions, EffectGeneratorBank, EffectGenerator } from "./WebFlik";
import { mergeArrays } from "./utils/helpers";
import { EasingString, useEasing } from "./utils/easing";
import { CustomErrors, ClipErrorGenerator, errorTip, generateError } from "./utils/errors";
import { EffectCategory, StripFrozenConfig } from "./utils/interfaces";
import { WbfkConnector } from "./WbfkConnector";
import { WebFlikAnimation } from "./WebFlikAnimation";
import { PickFromArray } from "./utils/utilityTypes";

/**
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

type CustomKeyframeEffectOptions = {
  /**
   * If `true`, the next clip in the same sequence will play at the same time as this clip.
   * - If this clip is not part of a sequence or is at the end of a sequence, this option has no effect.
   */
  startsNextClipToo: boolean;

  /**
   * If `true`, this clip will play at the same time as the previous clip in the same sequence.
   * - If this clip is not part of a sequence or is at the beginning of a sequence, this option has no effect.
   */
  startsWithPrevious: boolean;

  /**
   * If `true`, the effects of the animation will persist after the clip finishes.
   * - If the element is not rendered by the time the clip finishes, an error will be thrown.
   */
  commitsStyles: boolean;

  /**
   * If `true`, the effects of the animation will persist after the clip finishes.
   * If the element is not rendered by the time the clip finishes, we attempt to forcefully unhide the element,
   * apply the styles, then re-hide it.
   * - If this fails (likely because the element's parent is not rendered, meaning our element cannot be unhidden), an error will be thrown.
   */
  commitStylesForcefully: boolean; // attempt to unhide, commit, then re-hide

  /**
   * Resolves how an element's animation impacts the element's underlying property values.
   * @see [KeyframeEffect: composite property](https://developer.mozilla.org/en-US/docs/Web/API/KeyframeEffect/composite)
   */
  composite: CompositeOperation;

  /**
   * Contains arrays of CSS classes that should be added to or removed from the element.
   * - The list of classes to add is added first, and then the list of classes to remove is removed.
   * - Changes are automatically undone in the appropriate order when the clip is rewound.
   */
  cssClasses: Partial<CssClassOptions>;

  /**
   * If `true`, the animation's effect is one-time generated as soon as the clip is instantiated.
   * The result is then used upon every subsequent play/rewind.
   * 
   * If `false`, the animation's effect is recomputed every time the clip is played or rewound.
   */
  runGeneratorsNow: boolean;
};

type KeyframeTimingOptions = {
  /**
   * The number of milliseconds the active phase of the animation takes to complete.
   * - This refers to the actual effect of the animation, not the delay or endDelay.
   */
  duration: number;

  /**
   * The rate of the animation's change over time.
   * - Accepts a typical `<easing-function>`, such as `"linear"`, `"ease-in"`, `"step-end"`, `"cubic-bezier(0.42, 0, 0.58, 1)"`, etc.
   * - Also accepts autocompleted preset strings (such as `"bounce-in"`, `"power-1-out"`, etc.)
   * that produce preset easing effects using linear functions.
   */
  easing: EasingString;

  /**
   * The base playback rate of the animation (ignoring any multipliers from a parent sequence/timeline).
   * - Example: A value of `1` means 100% (the typical playback rate), and `0.5` means 50% speed.
   * - Example: If the `playbackRate` of the parent sequence is `4` and the `playbackRate` of this clip is `5`,
   * the `playbackRate` property is still `5`, but the clip would run at 4 * 5 = 20x speed.
   */
  playbackRate: number;

  /**
   * The number of milliseconds the delay phase of the animation takes to complete.
   * - This refers to the time before the active phase of the animation starts (i.e., before the animation effect begins).
   */
  delay: number;

  /**
   * The number of milliseconds the endDelay phase of the animation takes to complete.
   * - This refers to the time after the active phase of the animation end (i.e., after the animation effect has finished).
   */
  endDelay: number;
};

/**
 * Contains configuration options used to define both the timing and effects of the animation clip.
 * @category Interfaces
 * @interface
 */
export type AnimClipConfig = KeyframeTimingOptions & CustomKeyframeEffectOptions;

/**
 * Contains timing-related details about an animation. Returned by {@link AnimClip.getTiming}.
 * @see {@link AnimClip.getTiming}
 * @category Interfaces
 * @interface
 */
export type AnimClipTiming = Pick<AnimClipConfig, 
  | 'startsNextClipToo'
  | 'startsWithPrevious'
  | 'duration'
  | 'delay'
  | 'endDelay'
  | 'easing'
  | 'playbackRate'
  | 'runGeneratorsNow'
> & {
  /**
   * The actual playback rate of the animation after the playback rates of any parents are taken into account.
   * - Example: If the `playbackRate` of the parent sequence is `4` and the `playbackRate` of this clip is `5`,
   * the `compoundedPlaybackRate` will be 4 * 5 = 20.
   * @see {@link AnimClipTiming.playbackRate}
   */
  compoundedPlaybackRate: AnimClip['compoundedPlaybackRate'];
};

/**
 * Contains specific details about an animation's effect. Returned by {@link AnimClip.getEffectDetails}.
 * @see {@link AnimClip.getEffectDetails}
 * @category Interfaces
 * @interface
 */
export type EffectDetails = {
  /**
   * Name of the animation effect.
   */
  effectName: AnimClip['effectName'];

  /**
   * Generator containing the function used to generate the effect and
   * possibly a set of default configuration options for the effect.
   */
  effectGenerator: AnimClip['effectGenerator'];

  /**
   * An array containing the effect options used to set the behavior of the animation effect.
   */
  effectOptions: AnimClip['effectOptions'];

  /**
   * The category of the effect (e.g., `"Entrance"`, `"Exit"`, `"Motion"`, etc.).
   */
  category: AnimClip['category'];
};

/**
 * Contains details about how the DOM element is modified beyond just the effect of the animation. Returned by {@link AnimClip.getModifiers}.
 * @see {@link AnimClip.getModifiers}
 * @category Interfaces
 * @interface
 */
export type AnimClipModifiers = Pick<AnimClipConfig, 'cssClasses' | 'composite' | 'commitsStyles' | 'commitStylesForcefully'>;

/**
 * Contains details about an animation's current status. Returned by {@link AnimClip.getStatus}.
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
};

/**
 * @hideconstructor
 * 
 * @groupDescription Property Getter Methods
 * Methods that return objects that contain various internal fields of the clip (such as `duration` from `getTiming()`,
 * `inProgress` from `getStatus()`, etc.
 * 
 * @groupDescription Playback Methods
 * Methods that control the playback of the animation clip.
 * 
 * @groupDescription Timing Event Methods
 * Methods that involve listening to the progress of the animation clip to perform tasks at specific times.
 */
export abstract class AnimClip<TEffectGenerator extends EffectGenerator = EffectGenerator> implements AnimClipConfig {
  private static id: number = 0;
  /**
   * @returns an effect generator with a function that returns empty arrays (so no actual keyframes).
   * @remarks
   * This static method is purely for convenience.
   */
  public static createNoOpEffectGenerator() { return {generateKeyframes() { return [[], []]; }} as EffectGenerator; }
  protected abstract get defaultConfig(): Partial<AnimClipConfig>;

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
   */
  get parentSequence() { return this._parentSequence; }
  /**
   * The parent {@link AnimTimeline} that contains the {@link AnimSequence} that contains this clip (may be `undefined`).
   */
  get parentTimeline() { return this._parentTimeline; }
  /**
   * The highest level of this clip's lineage.
   * - If the clip is nested within an {@link AnimTimeline}: that timeline,
   * - Else, if the clip is within an {@link AnimSequence}: that sequence,
   * - Else: the clip itself
   */
  get root(): AnimTimeline | AnimSequence | AnimClip { return this.parentTimeline ?? this.parentSequence ?? this; }
  /**
   * The DOM element that is to be animated.
  */
 readonly domElem: Element;

 protected animation: WebFlikAnimation = {} as WebFlikAnimation;
  /**@internal*/
  keyframesGenerators?: {
    forwardGenerator: () => Keyframe[];
    backwardGenerator?: () => Keyframe[];
  };
  /**@internal*/
  rafMutators?: {
    forwardMutator: () => void;
    backwardMutator: () => void;
  };
  /**@internal*/
  rafMutatorGenerators?: {
    forwardGenerator: () => () => void;
    backwardGenerator: () => () => void;
  }
  /**@internal*/
  get rafLoopsProgress(): number {
    const { progress, direction } = this.animation.effect!.getComputedTiming();
    // ?? 1 because during the active phase (the only time when raf runs), null progress means finished
    return direction === 'normal' ? (progress ?? 1) : 1 - (progress ?? 1);
  }

  /**@internal*/ fullStartTime = NaN;
  /**@internal*/ get activeStartTime() { return (this.fullStartTime + this.delay) / this.playbackRate; }
  /**@internal*/ get activeFinishTime() { return( this.fullStartTime + this.delay + this.duration) / this.playbackRate; }
  /**@internal*/ get fullFinishTime() { return (this.fullStartTime + this.delay + this.duration + this.endDelay) / this.playbackRate; }

  private getPartial<Source, T extends (keyof Source)[] = (keyof Source)[]>(propNames: (keyof Source)[] | T): PickFromArray<Source, T> {
    return Object.fromEntries(
      Object.entries(this)
        .filter(([key, _]) => propNames.includes(key as keyof Source))
    ) as Pick<Source, keyof Source>;
  }

  // GROUP: Effect Details
  protected abstract get category(): EffectCategory;
  protected effectName: string;
  protected effectGenerator: TEffectGenerator;
  protected effectOptions: EffectOptions<TEffectGenerator> = {} as EffectOptions<TEffectGenerator>;
  /**
   * Returns specific details about the animation's effect.
   * @returns an object containing
   * - {@link EffectDetails.category|category},
   * - {@link EffectDetails.effectName|effectName},
   * - {@link EffectDetails.effectGenerator|effectGenerator},
   * - {@link EffectDetails.effectOptions|effectOptions},
   */
  getEffectDetails(): EffectDetails;
  /**
   * Returns the value of a single specific property.
   * @param propName - name of the desired property
   * @ignore
   */
  getEffectDetails<T extends keyof EffectDetails>(propName: T): EffectDetails[T];
  /**
   * Returns an object containing a subset of the object that would normally be returned.
   * @param propNames - array of strings specifying which properties should be included.
   * @ignore
   */
  getEffectDetails<T extends (keyof EffectDetails)[]>(propNames: (keyof EffectDetails)[] | T): PickFromArray<EffectDetails, T>;
  /**
   * @group Property Getter Methods
   */
  getEffectDetails(specifics?: keyof EffectDetails | (keyof EffectDetails)[]):
    | EffectDetails
    | EffectDetails[keyof EffectDetails]
    | Partial<Pick<EffectDetails, keyof EffectDetails>>
  {
    if (typeof specifics === 'string') {
      return this[specifics];
    }
    if (specifics instanceof Array) {
      return this.getPartial<EffectDetails>(specifics);
    }

    return {
      category: this.category,
      effectName: this.effectName,
      effectGenerator: this.effectGenerator,
      effectOptions: this.effectOptions,
    }
  }

  // GROUP: Timing
  /**@internal*/ runGeneratorsNow: boolean = false;
  /**@internal*/ startsNextClipToo: boolean = false;
  /**@internal*/ startsWithPrevious: boolean = false;
  /**@internal*/ duration: number = 500;
  /**@internal*/ delay: number = 0;
  /**@internal*/ endDelay: number = 0;
  /**@internal*/ easing: EasingString = 'linear';
  /**@internal*/ playbackRate: number = 1; // actually base playback rate
  protected get compoundedPlaybackRate(): number { return this.playbackRate * (this._parentSequence?.getTiming().compoundedPlaybackRate ?? 1); }
  /**
   * Returns timing-related details about the animation.
   * @returns an object containing
   * - {@link AnimClipTiming.startsWithPrevious|startsWithPrevious},
   * - {@link AnimClipTiming.startsNextClipToo|startsNextClipToo},
   * - {@link AnimClipTiming.duration|duration},
   * - {@link AnimClipTiming.delay|delay},
   * - {@link AnimClipTiming.endDelay|endDelay},
   * - {@link AnimClipTiming.easing|easing},
   * - {@link AnimClipTiming.playbackRate|playbackRate},
   * - {@link AnimClipTiming.compoundedPlaybackRate|compoundedPlaybackRate},
   * - {@link AnimClipTiming.runGeneratorsNow|runGeneratorsNow},
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
    if (typeof specifics === 'string') {
      return this[specifics];
    }
    if (specifics instanceof Array) {
      this.getPartial<AnimClipTiming>(specifics);
    }
    return {
      startsWithPrevious: this.startsWithPrevious,
      startsNextClipToo: this.startsNextClipToo,
      duration: this.duration,
      delay: this.delay,
      endDelay: this.endDelay,
      easing: this.easing,
      playbackRate: this.playbackRate,
      compoundedPlaybackRate: this.compoundedPlaybackRate,
      runGeneratorsNow: this.runGeneratorsNow,
    };
  }

  // GROUP: Modifiers
  /**@internal*/ commitsStyles: boolean = true;
  /**@internal*/ commitStylesForcefully: boolean = false; // attempt to unhide, commit, then re-hide
  /**@internal*/ composite: CompositeOperation = 'replace';
  /**@internal*/ cssClasses: CssClassOptions = {
    toAddOnStart: [],
    toAddOnFinish: [],
    toRemoveOnStart: [],
    toRemoveOnFinish: [],
  };
  /**
   * Returns details about how the DOM element is modified beyond just the effect of the animation.
   * @returns an object containing
   * - {@link AnimClipModifiers.cssClasses|cssClasses},
   * - {@link AnimClipModifiers.commitsStyles|commitsStyles},
   * - {@link AnimClipModifiers.commitStylesForcefully|commitStylesForcefully},
   * - {@link AnimClipModifiers.composite|composite},
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
  getModifiers(specifics?: keyof AnimClipModifiers | (keyof AnimClipModifiers)[]):
    | AnimClipModifiers
    | AnimClipModifiers[keyof AnimClipModifiers]
    | Partial<Pick<AnimClipModifiers, keyof AnimClipModifiers>>
  {
    if (typeof specifics === 'string') {
      return this[specifics];
    }
    if (specifics instanceof Array) {
      this.getPartial<AnimClipModifiers>(specifics);
    }
    return {
      cssClasses: {
        toAddOnStart: [...(this.cssClasses.toAddOnStart ?? [])],
        toAddOnFinish: [...(this.cssClasses.toAddOnFinish ?? [])],
        toRemoveOnStart: [...(this.cssClasses.toRemoveOnStart ?? [])],
        toRemoveOnFinish: [...(this.cssClasses.toRemoveOnFinish ?? [])],
      },
      composite: this.composite,
      commitsStyles: this.commitsStyles,
      commitStylesForcefully: this.commitStylesForcefully,
    };
  }

  // GROUP: Status
  /**@internal*/ inProgress = false; // true only during animate() (regardless of pause state)
  /**@internal*/ isRunning = false; // true only when inProgress and !isPaused
  /**@internal*/ isPaused = false;
  /**
   * Returns details about the animation's current status.
   * @returns an object containing
   * - {@link AnimClipStatus.inProgress|inProgress},
   * - {@link AnimClipStatus.isRunning|isRunning},
   * - {@link AnimClipStatus.isPaused|isPaused},
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
    if (typeof specifics === 'string') {
      return this[specifics];
    }
    if (specifics instanceof Array) {
      this.getPartial<AnimClipStatus>(specifics);
    }
    return {
      inProgress: this.inProgress,
      isRunning: this.isRunning,
      isPaused: this.isPaused,
    };
  }

  /*-:**************************************************************************************************************************/
  /*-:*********************************        CONSTRUCTOR & INITIALIZERS        ***********************************************/
  /*-:**************************************************************************************************************************/
  /**
   * Used by a parent to set pointers to itself (the parent) within the clip.
   * @return {void}
   * @internal
   */
  setLineage(sequence: AnimSequence, timeline: AnimTimeline | undefined): void {
    this._parentSequence = sequence;
    this._parentTimeline = timeline;
  }

  constructor(domElem: Element | null | undefined, effectName: string, bank: EffectGeneratorBank) {
    this.id = AnimClip.id++;
    
    if (!domElem) {
      throw this.generateError(CustomErrors.InvalidElementError, `Element must not be null or undefined.`);
    }
    this.domElem = domElem;
    this.effectName = effectName;
    
    this.effectGenerator = bank[effectName] as TEffectGenerator;

    // checking if this.effectGenerator exists is deferred until initialize()
  }

  /**@internal*/
  initialize(effectOptions: EffectOptions<TEffectGenerator>, effectConfig: Partial<StripFrozenConfig<AnimClipConfig, TEffectGenerator>> = {}): this {
    // Throw error if invalid effectName
    // Deferred until initialize() so that this.category has actually been initialized by derived class by now
    if (!this.effectGenerator) { throw this.generateError(RangeError, `Invalid effect name: "${this.effectName}" does not exists in the "${this.category}" category.`); }

    this.effectOptions = effectOptions;

    const mergedConfig = this.mergeConfigs(effectConfig, this.effectGenerator.config ?? {});
    Object.assign(this, mergedConfig);
    // cannot be exactly 0 because that causes some Animation-related bugs that can't be easily worked around
    this.duration = Math.max(this.duration as number, 0.01);

    // The fontFeatureSettings part handles a very strange Firefox bug that causes animations to run without any visual changes
    // when the animation is finished, setKeyframes() is called, and the animation continues after extending the runtime using
    // endDelay. It appears that the bug only occurs when the keyframes field contains nothing that will actually affect the
    // styling of the element (for example, adding {['fake-field']: 'bla'} will not fix it), but I obviously do not want to
    // add anything that will actually affect the style of the element, so I decided to use fontFeatureSettings and set it to
    // the default value to make it as unlikely as possible that anything the user does is obstructed.
    let [forwardFrames, backwardFrames]: [Keyframe[], Keyframe[] | undefined] = [[{fontFeatureSettings: 'normal'}], []];

    try {
      // generateKeyframes()
      if (this.effectGenerator.generateKeyframes) {
        // if pregenerating, produce F and B frames now
        if (this.runGeneratorsNow) {
          [forwardFrames, backwardFrames] = this.effectGenerator.generateKeyframes.call(this, ...effectOptions);
        }
      }
      // generateKeyframeGenerators()
      else if (this.effectGenerator.generateKeyframeGenerators) {
        const [forwardGenerator, backwardGenerator] = this.effectGenerator.generateKeyframeGenerators.call(this, ...effectOptions);
        this.keyframesGenerators = {forwardGenerator, backwardGenerator};
        // if pregenerating, produce F and B frames now
        if (this.runGeneratorsNow) {
          [forwardFrames, backwardFrames] = [forwardGenerator(), backwardGenerator?.()];
        }
      }
      // generateRafMutators()
      else if (this.effectGenerator.generateRafMutators) {
        if (this.runGeneratorsNow) {
          const [forwardMutator, backwardMutator] = this.effectGenerator.generateRafMutators.call(this, ...effectOptions);
          this.rafMutators = { forwardMutator, backwardMutator };
        }
      }
      // generateRafMutatorGenerators()
      else {
        const [forwardGenerator, backwardGenerator] = this.effectGenerator.generateRafMutatorGenerators.call(this, ...effectOptions);
        this.rafMutatorGenerators = {forwardGenerator, backwardGenerator};
        if (this.runGeneratorsNow) {
          this.rafMutators = {forwardMutator: forwardGenerator(), backwardMutator: backwardGenerator()};
        }
      }
    }
    catch (err: unknown) { throw this.generateError(err as Error); }

    // playbackRate is not included because it is computed at the time of animating
    const keyframeOptions: KeyframeEffectOptions = {
      delay: this.delay,
      duration: this.duration,
      endDelay: this.endDelay,
      fill: 'forwards',
      easing: useEasing(this.easing),
      composite: this.composite,
    };

    this.animation = new WebFlikAnimation(
      new KeyframeEffect(
        this.domElem,
        forwardFrames,
        keyframeOptions,
      ),
      new KeyframeEffect(
        this.domElem,
        backwardFrames ?? [...forwardFrames],
        {
          ...keyframeOptions,
          // if no backward frames were specified, assume the reverse of the forward frames
          ...(backwardFrames ? {} : {direction: 'reverse'}),
          // if backward frames were specified, easing needs to be inverted
          ...(backwardFrames ? {easing: useEasing(this.easing, {inverted: true})} : {}),
          // delay & endDelay are of course swapped when we want to play in "reverse"
          delay: keyframeOptions.endDelay,
          endDelay: keyframeOptions.delay,
        },
      ),
      this.generateError
    );

    // TODO: Figure out how to disable any pausing/stepping functionality in the timeline while stopped for roadblocks
    this.animation.pauseForRoadblocks = () => {
      this.parentTimeline?.disablePlaybackButtons();
      this.root.pause();
    }
    this.animation.unpauseFromRoadblocks = () => {
      this.root.unpause();
      this.parentTimeline?.enablePlaybackButtons();
    }

    return this;
  }

  private mergeConfigs(layer4Config: Partial<AnimClipConfig>, effectGeneratorConfig: Partial<AnimClipConfig>): Partial<AnimClipConfig> {
    return {
      // subclass defaults takes priority
      ...this.defaultConfig,

      // config defined in effect generator takes priority over default
      ...effectGeneratorConfig,

      // layer 4 config (person using WebFlik) takes priority over generator
      ...layer4Config,

      // mergeable properties
      cssClasses: {
        toAddOnStart: mergeArrays(
          this.defaultConfig.cssClasses?.toAddOnStart,
          effectGeneratorConfig.cssClasses?.toAddOnStart,
          layer4Config.cssClasses?.toAddOnStart,
        ),
  
        toRemoveOnStart: mergeArrays(
          this.defaultConfig.cssClasses?.toRemoveOnStart,
          effectGeneratorConfig.cssClasses?.toRemoveOnStart,
          layer4Config.cssClasses?.toRemoveOnStart,
        ),
  
        toAddOnFinish: mergeArrays(
          this.defaultConfig.cssClasses?.toAddOnFinish,
          effectGeneratorConfig.cssClasses?.toAddOnFinish,
          layer4Config.cssClasses?.toAddOnFinish,
        ),
  
        toRemoveOnFinish: mergeArrays(
          this.defaultConfig.cssClasses?.toRemoveOnFinish,
          effectGeneratorConfig.cssClasses?.toRemoveOnFinish,
          layer4Config.cssClasses?.toRemoveOnFinish,
        ),
      }
    };
  }

  /*-:**************************************************************************************************************************/
  /*-:*****************************************        PLAYBACK        *********************************************************/
  /*-:**************************************************************************************************************************/
  /**
   * Plays the animation clip (animation runs forward).
   * @returns a promise that is resolved when the animation finishes playing (including playing its endDelay phase).
   * @group Playback Methods
   */
  async play(): Promise<this>;
  /**@internal*/
  async play(parentSequence: AnimSequence): Promise<this>;
  async play(parentSequence?: AnimSequence): Promise<this> {
    // both parentSequence vars should either be undefined or the same AnimSequence
    if (this._parentSequence !== parentSequence) { this.throwChildPlaybackError('play'); }
    return this.animate('forward');
  }

  /**
   * Rewinds the animation clip (animation runs backward).
   * @returns a promise that is resolved when the animation finishes rewinding (including rewinding its delay phase).
   * @group Playback Methods
   */
  async rewind(): Promise<this>;
  /**@internal*/
  async rewind(parentSequence: AnimSequence): Promise<this>;
  async rewind(parentSequence?: AnimSequence): Promise<this> {
    if (this._parentSequence !== parentSequence) { this.throwChildPlaybackError('rewind'); }
    return this.animate('backward');
  }

  /**
   * Pauses the animation clip.
   * - If the clip is not already in progress, this method does nothing.
   * @group Playback Methods
   */
  pause(): this;
  /**@internal*/
  pause(parentSequence: AnimSequence): this;
  pause(parentSequence?: AnimSequence): this {
    if (this._parentSequence !== parentSequence) { this.throwChildPlaybackError('pause'); }
    if (this.isRunning) {
      this.isPaused = true;
      this.isRunning = false;
      this.animation.pause();
    }
    return this;
  }

  /**
   * Unpauses the animation clip.
   * - If the clip is not currently paused, this method does nothing.
   * @group Playback Methods
   */
  unpause(): this;
  /**@internal*/
  unpause(parentSequence: AnimSequence): this;
  unpause(parentSequence?: AnimSequence): this {
    if (this._parentSequence !== parentSequence) { this.throwChildPlaybackError('unpause'); }
    if (this.isPaused) {
      this.isPaused = false;
      this.isRunning = true;
      this.animation.play();
    }
    return this;
  }

  /**
   * Forces the animation clip to instantly finish.
   * - This works even if the animation is not already currently in progress.
   * - The animation will still pause for any roadblocks generated by {@link AnimClip.addRoadblocks | addRoadblocks()}.
   * - Does not work if the clip is currently paused.
   * @group Playback Methods
   */
  async finish(): Promise<this>;
  /**@internal*/
  async finish(parentSequence: AnimSequence): Promise<this>;
  async finish(parentSequence?: AnimSequence): Promise<this> {
    if (this._parentSequence !== parentSequence) { this.throwChildPlaybackError('finish'); }
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
   * @returns a Promise that is resolved at the specific time point of the animation.
   * 
   * @example
   * ```ts
   * async function testFunc() {
   *    const ent = Entrance(<...>);
   *    // wait until ent is played and gets 1/5 of the way through the active phase of the animation
   *    await ent.generateTimePromise('forward', 'activePhase', '20%');
   *    console.log('1/5 done playing!');
   * }
   * 
   * testFunc();
   * ```
   * 
   * @example
   * ```ts
   * async function testFunc() {
   *    const ent = Entrance(<...>);
   *    // wait until ent is eventually rewound and gets 4/5 of the way through rewinding the active phase of the animation
   *    await ent.generateTimePromise('backward', 'activePhase', '20%');
   *    console.log('4/5 done rewinding!');
   * }
   * 
   * testFunc();
   * ```
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
  addIntegrityblocks(
    direction: 'forward' | 'backward',
    phase: 'delayPhase' | 'activePhase' | 'endDelayPhase' | 'whole',
    timePosition: number | 'beginning' | 'end' | `${number}%`,
    promises: (Promise<unknown> | (() => Promise<unknown>))[]
  ): void {
    return this.animation.addIntegrityblocks(direction, phase, timePosition, promises);
  }

  /**
   * Pauses the animation clip when it reaches the specified time in the specified direction, only unpausing after
   * the specified array of `Promise` objects is resolved.
   * - If the clip is part of a structure (like a sequence), the entire structure is paused as well.
   * @param direction - the direction the animation will be going when the clip is paused
   * @param phase - the phase of the animation to place the blocks in
   * @param timePosition - the time position within the phase when the roadblocks should be encountered
   * @param promises - an array of promises or functions that return promises that block the clip's playback until resolved
   * @returns {void}
   * 
   * @example
   * ```ts
   * async function wait(milliseconds: number) { // Promise-based timer
   *    return new Promise(resolve => setTimeout(resolve, milliseconds));
   * }
   * 
   * const ent = Entrance(<...>);
   * // adds 1 roadblock that will pause the clip once the clip is 15% through the delay phase
   * ent.addRoadblocks('forward', 'activePhase', '15%', [function() { return wait(2000); }]);
   * // adds 2 more roadblocks at the same point.
   * ent.addRoadblocks('forward', 'activePhase', '15%', [function() { return wait(3000); }, someOtherPromise]);
   * // adds 1 roadblock at 40% into the endDelay phase
   * ent.addRoadblocks('forward', 'endDelayPhase', '40%', [new Promise()]);
   * 
   * ent.play();
   * // ↑ Once ent is 15% through the active phase, it will pause and handle its roadblocks.
   * // "wait(2000)" resolves after 2 seconds.
   * // "wait(3000)" resolves after 3 seconds.
   * // someOtherPromise blocks the clip's playback. Presumably, its resolver is eventually called from somewhere outside.
   * // Once someOtherPromise is resolved, there are no more roadblocks at this point, so playback is resumed.
   * // Once ent is 40% through the endDelay phase, it will pause and handle its roadblocks
   * // The newly created promise obviously has no way to be resolved, so the clip is unfortunately stuck.
   * ```
   * @group Timing Event Methods
   */
  addRoadblocks(
    direction: 'forward' | 'backward',
    phase: 'delayPhase' | 'activePhase' | 'endDelayPhase' | 'whole',
    timePosition: number | 'beginning' | 'end' | `${number}%`,
    promises: (Promise<unknown> | (() => Promise<unknown>))[]
  ): void {
    return this.animation.addRoadblocks(direction, phase, timePosition, promises);
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

    const animation = this.animation;
    animation.setDirection(direction);
    // If keyframes are generated here, clear the current frames to prevent interference with generators
    if (!this.runGeneratorsNow && direction === 'forward') {
      animation.setForwardAndBackwardFrames([{fontFeatureSettings: 'normal'}], []);
    }
    this.useCompoundedPlaybackRate();

    // used as resolve() and reject() in the eventually returned promise
    const { promise, resolve, reject } = Promise.withResolvers<this>();
    
    this.inProgress = true;
    this.isRunning = true;

    if (this._parentSequence?.skippingOn || this._parentSequence?.usingFinish)
      { animation.finish(); }
    else
      { animation.play(); }
    if (this._parentSequence?.isPaused) { animation.pause(); }
    
    // After delay phase, then apply class modifications and call onStart functions.
    // Additionally, generate keyframes on 'forward' if keyframe pregeneration is disabled.
    animation.onDelayFinish = () => {
      try {
        const bankEntry = this.effectGenerator;

        switch(direction) {
          case 'forward':
            this.domElem.classList.add(...this.cssClasses.toAddOnStart);
            this.domElem.classList.remove(...this.cssClasses.toRemoveOnStart);
            this._onStartForward();
            
            // If keyframes were not pregenerated, generate them now
            // Keyframe generation is done here so that generations operations that rely on the side effects of class modifications and _onStartForward()...
            // ...can function properly.
            if (!this.runGeneratorsNow) {
              try {
                // if generateKeyframes() is the method of generation, generate f-ward and b-ward frames
                if (bankEntry.generateKeyframes) {
                  let [forwardFrames, backwardFrames] = bankEntry.generateKeyframes.call(this, ...this.effectOptions);
                  animation.setForwardAndBackwardFrames(forwardFrames, backwardFrames ?? [...forwardFrames], backwardFrames ? false : true);
                }
                // if generateKeyframeGenerators() is the method of generation, generate f-ward frames
                else if (bankEntry.generateKeyframeGenerators) {
                  animation.setForwardFrames(this.keyframesGenerators!.forwardGenerator());
                }
                // if generateRafMutators() is the method of generation, generate f-ward and b-ward mutators
                else if (bankEntry.generateRafMutators) {
                  const [forwardMutator, backwardMutator] = bankEntry.generateRafMutators.call(this, ...this.effectOptions);
                  this.rafMutators = { forwardMutator, backwardMutator };
                }
                // if generateRafMutatorGenerators() is the method of generation, generate f-ward mutator
                else {
                  const forwardMutator = this.rafMutatorGenerators!.forwardGenerator();
                  this.rafMutators = { forwardMutator, backwardMutator(){} };
                }
              }
              catch (err: unknown) {
                throw this.generateError(err as Error);
              }
            }

            if (bankEntry.generateRafMutators || bankEntry.generateRafMutatorGenerators) { requestAnimationFrame(this.loop); }

            // sets it back to 'forwards' in case it was set to 'none' in a previous running
            animation.effect?.updateTiming({fill: 'forwards'});
            break;
    
          case 'backward':
            this._onStartBackward();
            this.domElem.classList.add(...this.cssClasses.toRemoveOnFinish);
            this.domElem.classList.remove(...this.cssClasses.toAddOnFinish);

            if (!this.runGeneratorsNow) {
              try {
                if (bankEntry.generateKeyframes) {
                  // do nothing (backward keyframes would have already been set during forward direction)
                }
                else if (bankEntry.generateKeyframeGenerators) {
                  const {forwardGenerator, backwardGenerator} = this.keyframesGenerators!;
                  this.animation.setBackwardFrames(backwardGenerator?.() ?? forwardGenerator(), backwardGenerator ? false : true);
                }
                else if (bankEntry.generateRafMutators) {
                  // do nothing (backward mutator would have already been set during forward direction)
                }
                else {
                  const backwardMutator = this.rafMutatorGenerators!.backwardGenerator();
                  this.rafMutators = { forwardMutator(){}, backwardMutator };
                }
              }
              catch (err: unknown) { throw this.generateError(err as Error); }
            }

            if (bankEntry.generateRafMutators || bankEntry.generateRafMutatorGenerators) { requestAnimationFrame(this.loop); }
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
        if (this.commitsStyles || this.commitStylesForcefully) {
          // Attempt to apply the styles to the element.
          try {
            animation.commitStyles();
            // ensures that accumulating effects are not stacked after commitStyles() (hopefully, new spec will prevent the need for this workaround)
            animation.effect?.updateTiming({ fill: 'none' });
          }
          // If commitStyles() fails, it's because the element is not rendered.
          catch (_) {
            // If forced commit is disabled, do not re-attempt to commit the styles; throw error instead.
            if (!this.commitStylesForcefully) {
              throw this.generateError(CustomErrors.CommitStylesError,
                `Cannot commit animation styles while element is not rendered.` +
                ` To temporarily (instantly) override the hidden state, set the 'commitStylesForcefully' config option to true` +
                ` (however, if the element's ancestor is unrendered, this will still fail).` +
                `${errorTip(
                  `Tip: By default, Exit()'s config option for 'exitType' is set to "display-none", which unrenders the element.` +
                  ` To just make the element invisible, set 'exitType' to "visibility-hidden".` +
                  `\nExample: Exit(elem, 'fade-out', [], {exitType: "visibility-hidden"})`
                )}`
              );
            }
  
            // If forced commit is enabled, attempt to override the hidden state and apply the style.
            try {
              this.domElem.classList.add('wbfk-override-hidden'); // CHANGE NOTE: Use new hidden classes
              animation.commitStyles();
              animation.effect?.updateTiming({ fill: 'none' });
              this.domElem.classList.remove('wbfk-override-hidden');
            }
            // If this fails, then the element's parent is hidden. Do not attempt to remedy; throw error instead.
            catch (err: unknown) {
              throw this.generateError(CustomErrors.CommitStylesError,
                `Failed to commit styles by overriding element's hidden state with 'commitStylesAttemptForcefully'.` +
                ` Cannot commit styles if element is unrendered because of an unrendered ancestor.`
              );
            }
          }
        }
  
        switch(direction) {
          case 'forward':
            this.domElem.classList.add(...this.cssClasses.toAddOnFinish);
            this.domElem.classList.remove(...this.cssClasses.toRemoveOnFinish);
            this._onFinishForward();
            break;
          case 'backward':
            this._onFinishBackward();
            this.domElem.classList.add(...this.cssClasses.toRemoveOnStart);
            this.domElem.classList.remove(...this.cssClasses.toAddOnStart);
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

  private loop = (): void => {
    const rafMutators = this.rafMutators!;
    try {
      switch(this.animation.direction) {
        case "forward":
          rafMutators.forwardMutator();
          break;
        case "backward":
          rafMutators.backwardMutator();
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
   * - Intended for use inside effect generator functions that utilize RAF loops.
   * @param initialVal - the starting value
   * @param finalVal - the ending value
   * @returns the number that is a percentage of the way between `initialVal` and `finalVal` based on the
   * percentage of completion of the animation (playing or rewinding).
   * 
   * @example
   * ```ts
    const {Entrance} = WebFlik.createAnimationFactories({
      customEntranceEffects: {
        rotate: {
          generateRafMutators(degrees: number) {
            return [
              // when playing, keep computing the value between 0 and 'degrees'
              () => { this.domElem.style.rotate = this.computeTween(0, degrees)+'deg'; },
              // when rewinding, keep computing the value between 'degrees' and 0
              () => { this.domElem.style.rotate = this.computeTween(degrees, 0)+'deg'; }
            ];
          }
        }
      },
    });

    await Entrance(someElement, 'rotate', [360], {duration: 2000}).play();
    // ↑ At 1.5 seconds (or 1500ms), the animation is 1.5/2 = 75% done playing.
    // Thus, computeTween(0, 360) at that exactly moment would...
    // return the value 75% of the way between 0 and 360 (= 270).
    // Therefore, at 1.5 seconds of playing, someElement's rotation is set to "270deg".

    await Entrance(someElement, 'rotate', [360], {duration: 2000}).rewind();
    // ↑ At 0.5 seconds (or 500ms), the animation is 0.5/2 = 25% done rewinding.
    // Thus, computeTween(360, 0) at that exactly moment would...
    // return the value 25% of the way between 360 and 0 (= 270).
    // Therefore, at 0.5 seconds of rewinding, someElement's rotation is set to "270deg".
   * ```
   */
  computeTween(initialVal: number, finalVal: number): number {
    return initialVal + (finalVal - initialVal) * this.rafLoopsProgress;
  }

  /*-:**************************************************************************************************************************/
  /*-:*****************************************         ERRORS         *********************************************************/
  /*-:**************************************************************************************************************************/
  protected generateError: ClipErrorGenerator = (ErrorClassOrInstance, msg = '<unspecified error>', elementOverride?: Element) => {
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
    if (this.domElem instanceof WbfkConnector) {
      throw this.generateError(CustomErrors.InvalidElementError,
        `Connectors cannot be animated using ${this.category}().` +
        `${errorTip(`WbfkConnector elements cannot be animated using Entrance() or Exit() because many of the animations are not really applicable.` +
          ` Instead, any entrance or exit effects that make sense for connectors are defined in ConnectorEntrance() and ConnectorExit().`
        )}`,
        this.domElem
      );
    }
  }
}
