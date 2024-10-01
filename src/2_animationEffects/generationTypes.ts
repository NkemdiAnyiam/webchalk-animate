import { AnimClip, AnimClipConfig } from "../1_playbackStructures/AnimClip";
import { Keyframes } from "../4_utils/interfaces";
import { StripDuplicateMethodAutocompletion, ReadonlyPick, ReadonlyRecord } from "../4_utils/utilityTypes";

/**
 * @category Generator Types
 */
export type KeyframesGenerator<TClipContext extends unknown> = {
  generateKeyframes(
    /**@ignore*/
    this: TClipContext,
    ...effectOptions: unknown[]): { forwardFrames: Keyframes; backwardFrames?: Keyframes; };
  generateKeyframeGenerators?: never;
  generateRafMutators?: never;
  generateRafMutatorGenerators?: never;
};

/**
 * @category Generator Types
 */
export type KeyframesGeneratorsGenerator<TClipContext extends unknown> = {
  generateKeyframes?: never;
  generateKeyframeGenerators(
    /**@ignore*/
    this: TClipContext,
    ...effectOptions: unknown[]): StripDuplicateMethodAutocompletion<{ forwardGenerator: () => Keyframes; backwardGenerator?: () => Keyframes; }>;
  generateRafMutators?: never;
  generateRafMutatorGenerators?: never;
};

/**
 * @category Generator Types
 */
export type RafMutatorsGenerator<TClipContext extends unknown> = {
  generateKeyframes?: never;
  generateKeyframeGenerators?: never;
  generateRafMutators(
    /**@ignore*/
    this: TClipContext & ReadonlyPick<AnimClip, 'computeTween'>,
    ...effectOptions: unknown[]): StripDuplicateMethodAutocompletion<{ forwardMutator: () => void; backwardMutator: () => void; }>;
  generateRafMutatorGenerators?: never;
};

/**
 * @category Generator Types
 */
export type RafMutatorsGeneratorsGenerator<TClipContext extends unknown> = {
  generateKeyframes?: never;
  generateKeyframeGenerators?: never;
  generateRafMutators?: never;
  generateRafMutatorGenerators(
    /**@ignore*/
    this: TClipContext & ReadonlyPick<AnimClip, 'computeTween'>,
    ...effectOptions: unknown[]): StripDuplicateMethodAutocompletion<{ forwardGenerator: () => () => void; backwardGenerator: () => () => void; }>;
};

/**
 * Object representing an entry in an {@link EffectGeneratorBank}. It consists of 3 properties.
 * - {@link EffectGenerator.defaultConfig | defaultConfig} contains default configuration options that are appropriate for the effect
 * - {@link EffectGenerator.immutableConfig | immutableConfig} contains default configuration options for the effect that cannot be changed
 * - a generator function that creates the animation effect. There are 4 possible functions:
 * - - {@link KeyframesGenerator.generateKeyframes | generateKeyframes}
 * - - {@link KeyframesGeneratorsGenerator.generateKeyframeGenerators | generateKeyframeGenerators}
 * - - {@link RafMutatorsGenerator.generateRafMutators | generateRafMutators}
 * - - {@link RafMutatorsGeneratorsGenerator.generateRafMutatorGenerators | generateRafMutatorGenerators}
 * @interface
 */
export type EffectGenerator<TClipContext extends unknown = unknown, TConfig extends unknown = unknown, IncludeExtras extends boolean = true> = Readonly<
  {
    defaultConfig?: Partial<TConfig>;
    immutableConfig?: Partial<TConfig>;
  } &
  (IncludeExtras extends true ? {
    /**
     * The effect name. E.g., 'fade-in', 'appear', etc.
     * This is automatically set at run-time. There is no need to set it manually (and trying to does nothing).
     */
    effectName?: string;
    /**
     * Reference to the full effect generator bank this effect generator belongs to.
     * This is set automatically at run-time. There is no need to set it manually (and trying to does nothing).
     */
    sourceBank?: EffectGeneratorBank<any>;
  } : {}) &
  StripDuplicateMethodAutocompletion<(
    KeyframesGenerator<TClipContext> | KeyframesGeneratorsGenerator<TClipContext> | RafMutatorsGenerator<TClipContext> | RafMutatorsGeneratorsGenerator<TClipContext>)>
>;
// represents an object where every string key is paired with a EffectGenerator value

export type EffectGeneratorBank<TClip extends AnimClip = AnimClip, TClipConfig extends {} = AnimClipConfig, IncludeGeneratorExtras extends boolean = true> = ReadonlyRecord<
  string, EffectGenerator<ReadonlyPick<TClip, 'domElem' | 'getEffectDetails'>, TClipConfig, IncludeGeneratorExtras>
>;

export type EffectOptions<TEffectGenerator extends EffectGenerator> = Parameters<
  TEffectGenerator extends KeyframesGenerator<unknown> ? TEffectGenerator['generateKeyframes'] : (TEffectGenerator extends KeyframesGeneratorsGenerator<unknown> ? TEffectGenerator['generateKeyframeGenerators'] : (TEffectGenerator extends RafMutatorsGenerator<unknown> ? TEffectGenerator['generateRafMutators'] : (TEffectGenerator extends RafMutatorsGeneratorsGenerator<unknown> ? TEffectGenerator['generateRafMutatorGenerators'] : (never))))
>;
// CHANGE NOTE: EffectNameIn now handles keyof and Extract
// extracts only those strings in an object whose paired value is an EffectGenerator

export type EffectNameIn<TGeneratorBank extends EffectGeneratorBank> = Exclude<keyof {
  [key in keyof TGeneratorBank as TGeneratorBank[key] extends EffectGenerator ? key : never]: TGeneratorBank[key];
}, number | symbol>;
