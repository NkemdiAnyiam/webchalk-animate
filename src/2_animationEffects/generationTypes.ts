import { AnimClip, AnimClipConfig } from "../1_playbackStructures/AnimClip";
import { Keyframes } from "../4_utils/interfaces";
import { StripDuplicateMethodAutocompletion, ReadonlyPick, ReadonlyRecord } from "../4_utils/utilityTypes";

/**
 * @category Generator Types
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
   */
  generateKeyframes(
    /**@ignore*/
    this: TClipContext,
    ...effectOptions: unknown[]): { forwardFrames: Keyframes; backwardFrames?: Keyframes; };
  /** @ignore */
  generateKeyframeGenerators?: never;
  /** @ignore */
  generateRafMutators?: never;
  /** @ignore */
  generateRafMutatorGenerators?: never;
};

/**
 * @category Generator Types
 * @interface
 */
export type KeyframesGeneratorsGenerator<TClipContext extends unknown> = {
  /** @ignore */
  generateKeyframes?: never;
  /**
   * Runs itself exactly once (creating a closure) and returns up to 2 callback functions that each return one set of {@link Keyframes}.
   * @param effectOptions - parameters used to set the behavior for the specific animation effect
   * @returns An object containing 2 possible callback functions that each generate (return) one set of {@link Keyframes}.
   * - `forwardGenerator` will run every time the clip is played
   * - `backwardGenerator` (optional) will run every time the clip is rewound
   * - - If `backwardGenerator` is omitted, `forwardGenerator` will be used, and the resulting keyframes will be reversed
   */
  generateKeyframeGenerators(
    /**@ignore*/
    this: TClipContext,
    ...effectOptions: unknown[]): StripDuplicateMethodAutocompletion<{ forwardGenerator: () => Keyframes; backwardGenerator?: () => Keyframes; }>;
  /** @ignore */
  generateRafMutators?: never;
  /** @ignore */
  generateRafMutatorGenerators?: never;
};

/**
 * @category Generator Types
 * @interface
 */
export type RafMutatorsGenerator<TClipContext extends unknown> = {
  /** @ignore */
  generateKeyframes?: never;
  /** @ignore */
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
   */
  generateRafMutators(
    /**@ignore*/
    this: TClipContext & ReadonlyPick<AnimClip, 'computeTween'>,
    ...effectOptions: unknown[]): StripDuplicateMethodAutocompletion<{ forwardMutator: () => void; backwardMutator: () => void; }>;
  /** @ignore */
  generateRafMutatorGenerators?: never;
};

/**
 * @category Generator Types
 * @interface
 */
export type RafMutatorsGeneratorsGenerator<TClipContext extends unknown> = {
  /** @ignore */
  generateKeyframes?: never;
  /** @ignore */
  generateKeyframeGenerators?: never;
  /** @ignore */
  generateRafMutators?: never;
  /**
   * Runs itself exactly once (creating a closure) and returns 2 function that each return one function.
   * Those final returned functions are run every frame (using {@link requestAnimationFrame} behind the scenes),
   * so if a property of the animated element is changed using
   * {@link AnimClip.computeTween}, it will look like a smooth animation.
   * @param effectOptions - parameters used to set the behavior for the specific animation effect
   * @returns An object containing 2 callback functions that each generate (return) one function.
   * - `forwardGenerator` will run every time the clip is played
   * - `backwardGenerator` will run every time the clip is rewound
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
    KeyframesGenerator<TClipContext> | KeyframesGeneratorsGenerator<TClipContext> | RafMutatorsGenerator<TClipContext> | RafMutatorsGeneratorsGenerator<TClipContext>)>
>;

// represents an object where every string key is paired with a EffectGenerator value
/**
 * Object containing {@link EffectGenerator} entries for a specific category of animation effect.
 * For example, there is an effect generator bank containing effect generators for entrance animation effects.
 */
export type EffectGeneratorBank<TClip extends AnimClip = AnimClip, TClipConfig extends {} = AnimClipConfig> = ReadonlyRecord<
  string, EffectGenerator<ReadonlyPick<TClip, 'domElem' | 'getEffectDetails'>, TClipConfig>
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
}, number | symbol>;
