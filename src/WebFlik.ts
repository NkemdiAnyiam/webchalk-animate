import { AnimClip, AnimClipConfig} from "./AnimClip";
import {
  EntranceClip, ExitClip, EmphasisClip, MotionClip, ScrollerClip, TransitionClip, ExitClipConfig, EntranceClipConfig,
  ConnectorEntranceClip, ConnectorExitClip, ConnectorSetterClip,
  EmphasisClipConfig,
  MotionClipConfig,
  ScrollerClipConfig,
  ConnectorExitClipConfig,
  ConnectorEntranceClipConfig,
  TransitionClipConfig
} from "./categoricalClips";
import { AnimSequence, AnimSequenceConfig } from "./AnimSequence";
import { AnimTimeline, AnimTimelineConfig } from "./AnimTimeline";
import { WbfkConnector, WbfkConnectorConfig } from "./WbfkConnector";
import {
  libPresetEntrances, libPresetExits, libPresetEmphases, libPresetMotions,
  libPresetConnectorEntrances, libPresetConnectorExits, libPresetScrolls, libPresetTransitions
} from "./libraryPresetBanks";
import { useEasing } from "./utils/easing";
import { MultiUnitPlacementX, MultiUnitPlacementY, ScrollingOptions } from "./utils/interfaces";
import { ReadonlyPick, ReadonlyRecord, StripDuplicateMethodAutocompletion } from "./utils/utilityTypes";

type KeyframesGenerator<TClipContext extends unknown> = {
  generateKeyframes(
    /**@ignore*/
    this: TClipContext,
    ...effectOptions: unknown[]): [forward: Keyframe[], backward?: Keyframe[]];
  generateKeyframeGenerators?: never;
  generateRafMutators?: never;
  generateRafMutatorGenerators?: never;
};
type KeyframesGeneratorsGenerator<TClipContext extends unknown> = {
  generateKeyframes?: never;
  generateKeyframeGenerators(
    /**@ignore*/
    this: TClipContext,
    ...effectOptions: unknown[]): [forwardGenerator: () => Keyframe[], backwardGenerator?: () => Keyframe[]];
  generateRafMutators?: never;
  generateRafMutatorGenerators?: never;
};
type RafMutatorsGenerator<TClipContext extends unknown> = {
  generateKeyframes?: never;
  generateKeyframeGenerators?: never;
  generateRafMutators(
    /**@ignore*/
    this: TClipContext & ReadonlyPick<AnimClip, 'computeTween'>,
    ...effectOptions: unknown[]): [forwardMutator: () => void, backwardMutator: () => void];
  generateRafMutatorGenerators?: never;
};
type RafMutatorsGeneratorsGenerator<TClipContext extends unknown> = {
  generateKeyframes?: never;
  generateKeyframeGenerators?: never;
  generateRafMutators?: never;
  generateRafMutatorGenerators(
    /**@ignore*/
    this: TClipContext & ReadonlyPick<AnimClip, 'computeTween'>,
    ...effectOptions: unknown[]): [forwardGenerator: () => () => void, backwardGenerator: () => () => void];
};

export type EffectGenerator<TClipContext extends unknown = unknown, TConfig extends unknown = unknown, IncludeExtras extends boolean = true> = Readonly<
  {
    defaultConfig?: Partial<TConfig>;
  }
  & (
    IncludeExtras extends true
    ? {
      /**
       * The effect name. E.g., 'fade-in', 'appear', etc.
       * This is automatically set at at run-time. There is no need to set it manually (and trying to does nothing).
       */
      effectName?: string;
      /**
       * Reference to the full effect generator bank this effect generator belongs to.
       * This is set automatically at run-time. There is no need to set it manually (and trying to does nothing).
       */
      sourceBank?: EffectGeneratorBank<any>;
    }
    : {}
  )
  & StripDuplicateMethodAutocompletion<(
    KeyframesGenerator<TClipContext> | KeyframesGeneratorsGenerator<TClipContext> | RafMutatorsGenerator<TClipContext> | RafMutatorsGeneratorsGenerator<TClipContext>
  )>
>;

// represents an object where every string key is paired with a EffectGenerator value
export type EffectGeneratorBank<TClip extends AnimClip = AnimClip, TClipConfig extends {} = AnimClipConfig, IncludeGeneratorExtras extends boolean = true> = ReadonlyRecord<
  string, 
  EffectGenerator<ReadonlyPick<TClip, 'domElem' | 'getEffectDetails'>, TClipConfig, IncludeGeneratorExtras>
>;

export type EffectOptions<TEffectGenerator extends EffectGenerator> = Parameters<
TEffectGenerator extends KeyframesGenerator<unknown> ? TEffectGenerator['generateKeyframes'] : (
  TEffectGenerator extends KeyframesGeneratorsGenerator<unknown> ? TEffectGenerator['generateKeyframeGenerators'] : (
    TEffectGenerator extends RafMutatorsGenerator<unknown> ? TEffectGenerator['generateRafMutators'] : (
      TEffectGenerator extends RafMutatorsGeneratorsGenerator<unknown> ? TEffectGenerator['generateRafMutatorGenerators'] : (
        never
      )
    )
  )
)
>;

// CHANGE NOTE: EffectNameIn now handles keyof and Extract
// extracts only those strings in an object whose paired value is an EffectGenerator
export type EffectNameIn<TGeneratorBank extends EffectGeneratorBank> = Exclude<keyof {
  [key in keyof TGeneratorBank as TGeneratorBank[key] extends EffectGenerator ? key : never]: TGeneratorBank[key];
}, number | symbol>;

/**
 * @hideconstructor
 */
export class WebFlik {
  newSequence(config: Partial<AnimSequenceConfig>, ...animClips: AnimClip[]): AnimSequence;
  newSequence(...animClips: AnimClip[]): AnimSequence;
  newSequence(config: Partial<AnimSequenceConfig> | AnimClip = {}, ...animClips: AnimClip[]): AnimSequence {
    return new AnimSequence(config, ...animClips);
  }
  newTimeline(config: Partial<AnimTimelineConfig>, ...animSequences: AnimSequence[]): AnimTimeline;
  newTimeline(...animSequences: AnimSequence[]): AnimTimeline;
  newTimeline(config: Partial<AnimTimelineConfig> | AnimSequence = {}, ...animSequences: AnimSequence[]): AnimTimeline {
    return new AnimTimeline(config, ...animSequences);
  }

  createAnimationFactories
  <
   // default = {} ensures intellisense for a given bank still works
   // without specifying the field (why? not sure)
    CustomEntranceBank extends EffectGeneratorBank<EntranceClip, EntranceClipConfig, false> = {},
    CustomExitBank extends EffectGeneratorBank<ExitClip, ExitClipConfig, false> = {},
    CustomEmphasisBank extends EffectGeneratorBank<EmphasisClip, EmphasisClipConfig, false> = {},
    CustomMotionBank extends EffectGeneratorBank<MotionClip, MotionClipConfig, false> = {},
    _EmptyTransitionBank extends EffectGeneratorBank<TransitionClip, TransitionClipConfig> = {},
    _EmptyConnectorEntranceBank extends EffectGeneratorBank<ConnectorEntranceClip, ConnectorEntranceClipConfig> = {},
    _EmptyConnectorExitBank extends EffectGeneratorBank<ConnectorExitClip, ConnectorExitClipConfig> = {},
    _EmptyScrollerBank extends EffectGeneratorBank<ScrollerClip, ScrollerClipConfig> = {},
    IncludeLibPresets extends boolean = true
  >
  (
    customPresetEffectBanks: {
      customEntranceEffects?: CustomEntranceBank & EffectGeneratorBank<EntranceClip, EntranceClipConfig, false>;
      customExitEffects?: CustomExitBank & EffectGeneratorBank<ExitClip, ExitClipConfig, false>;
      customEmphasisEffects?: CustomEmphasisBank & EffectGeneratorBank<EmphasisClip, EmphasisClipConfig, false>;
      customMotionEffects?: CustomMotionBank & EffectGeneratorBank<MotionClip, MotionClipConfig, false>;
    } = {},
    includeLibraryPresets: IncludeLibPresets | void = true as IncludeLibPresets
  ) {
    const {customEntranceEffects, customExitEffects, customEmphasisEffects, customMotionEffects} = customPresetEffectBanks as {
      customEntranceEffects?: CustomEntranceBank & EffectGeneratorBank<EntranceClip, EntranceClipConfig>;
      customExitEffects?: CustomExitBank & EffectGeneratorBank<ExitClip, ExitClipConfig>;
      customEmphasisEffects?: CustomEmphasisBank & EffectGeneratorBank<EmphasisClip, EmphasisClipConfig>;
      customMotionEffects?: CustomMotionBank & EffectGeneratorBank<MotionClip, MotionClipConfig>;
    };
    WebFlik.checkBanksFormatting(customEntranceEffects, customExitEffects, customEmphasisEffects, customMotionEffects);

    type TogglePresets<TLibBank, TCustomBank> = Readonly<(IncludeLibPresets extends true ? TLibBank : {}) & TCustomBank>;

    const mergeBanks = <L, U>(libraryBank: L, customBank: U) => {
      const combinedBank = {...(includeLibraryPresets ? libraryBank : {}), ...(customBank ?? {})} as EffectGeneratorBank;
      // set effectName and sourceBank properties of each generator to thier obviously corresponding values
      // Object.assign circumvents the Readonly<>, preventing a TS error
      for (const key in combinedBank) {
        const extras = { effectName: key, sourceBank: combinedBank } satisfies Partial<EffectGenerator>;
        Object.assign(combinedBank[key], extras);
      }
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

    // return functions that can be used to instantiate AnimClips with intellisense for the combined banks
    return {
      Entrance: function<TGeneratorBank extends typeof combinedEntranceBank, TEffectName extends EffectNameIn<TGeneratorBank>, TEffectGenerator extends TGeneratorBank[TEffectName]>(
        domElem: Element | null | undefined,
        effectName: TEffectName,
        ...initializationParams: Parameters<EntranceClip<TEffectGenerator>['initialize']>
      ) {
        return new EntranceClip<TEffectGenerator>(domElem, effectName, combinedEntranceBank).initialize(...initializationParams);
      },

      Exit: function<TGeneratorBank extends typeof combinedExitBank, TEffectName extends EffectNameIn<TGeneratorBank>, TEffectGenerator extends TGeneratorBank[TEffectName]>(
        domElem: Element | null | undefined,
        effectName: TEffectName,
        ...initializationParams: Parameters<ExitClip<TEffectGenerator>['initialize']>
      ) {
        return new ExitClip<TEffectGenerator>(domElem, effectName, combinedExitBank).initialize(...initializationParams);
      },

      Emphasis: function<TGeneratorBank extends typeof combinedEmphasisBank, TEffectName extends EffectNameIn<TGeneratorBank>, TEffectGenerator extends TGeneratorBank[TEffectName]>(
        domElem: Element | null | undefined,
        effectName: TEffectName,
        ...initializationParams: Parameters<EmphasisClip<TEffectGenerator>['initialize']>
      ) {
        return new EmphasisClip<TEffectGenerator>(domElem, effectName, combinedEmphasisBank).initialize(...initializationParams);
      },

      Motion: function<TGeneratorBank extends typeof combinedMotionBank, TEffectName extends EffectNameIn<TGeneratorBank>, TEffectGenerator extends TGeneratorBank[TEffectName]>(
        domElem: Element | null | undefined,
        effectName: TEffectName,
        ...initializationParams: Parameters<MotionClip<TEffectGenerator>['initialize']>
      ) {
        return new MotionClip<TEffectGenerator>(domElem, effectName, combinedMotionBank).initialize(...initializationParams);
      },

      Transition: function<TGeneratorBank extends typeof combinedTransitionBank, TEffectName extends EffectNameIn<TGeneratorBank>, TEffectGenerator extends TGeneratorBank[TEffectName]>(
        domElem: Element | null | undefined,
        effectName: TEffectName,
        ...initializationParams: Parameters<TransitionClip<TEffectGenerator>['initialize']>
      ) {
        return new TransitionClip<TEffectGenerator>(domElem, effectName, combinedTransitionBank).initialize(...initializationParams);
      },

      ConnectorSetter: function(
        connectorElem: WbfkConnector | null | undefined,
        pointA: [elemA: Element | null | undefined, xPlacement: number | MultiUnitPlacementX, yPlacement: number | MultiUnitPlacementY] | ['preserve'],
        pointB: [elemB: Element | null | undefined, xPlacement: number | MultiUnitPlacementX, yPlacement: number | MultiUnitPlacementY] | ['preserve'],
        connectorConfig: WbfkConnectorConfig = {} as WbfkConnectorConfig
      ) {
        const effectName = `~set-line-points`;
        return new ConnectorSetterClip(
          connectorElem, pointA, pointB, effectName, {[effectName]: {...AnimClip.createNoOpEffectGenerator(), effectName}}, connectorConfig
        ).initialize([]);
      },

      ConnectorEntrance: function<
        TGeneratorBank extends typeof combinedConnectorEntranceBank, TEffectName extends EffectNameIn<TGeneratorBank>, TEffectGenerator extends TGeneratorBank[TEffectName]
      >(
        connectorElem: WbfkConnector | null | undefined,
        effectName: TEffectName,
        ...initializationParams: Parameters<ConnectorEntranceClip<TEffectGenerator>['initialize']>
      ) {
        return new ConnectorEntranceClip<TEffectGenerator>(connectorElem, effectName, combinedConnectorEntranceBank).initialize(...initializationParams);
      },

      ConnectorExit: function<TGeneratorBank extends typeof combinedConnectorExitBank, TEffectName extends EffectNameIn<TGeneratorBank>, TEffectGenerator extends TGeneratorBank[TEffectName]>(
        connectorElem: WbfkConnector | null | undefined,
        effectName: TEffectName,
        ...initializationParams: Parameters<ConnectorExitClip<TEffectGenerator>['initialize']>
      ) { 
        return new ConnectorExitClip<TEffectGenerator>(connectorElem, effectName, combinedConnectorExitBank).initialize(...initializationParams);
      },
      
      Scroller: function<TGeneratorBank extends typeof combinedScrollerBank, TEffectName extends EffectNameIn<TGeneratorBank>, TEffectGenerator extends TGeneratorBank[TEffectName]>
      (
        domElem: Element | null | undefined,
        effectName: TEffectName,
        ...initializationParams: Parameters<ScrollerClip<TEffectGenerator>['initialize']>
      ) {
        return new ScrollerClip<TEffectGenerator>(domElem, effectName, combinedScrollerBank).initialize(...initializationParams);
      },
    };
  }

  /**@internal*/
  scrollAnchorsStack: [target: Element, scrollOptions: ScrollingOptions][] = [];

  get utils() {
    return {
      useEasing,
    };
  }

  private static checkBanksFormatting(...banks: (EffectGeneratorBank | undefined)[]) {
    const errors: string[] = [];
    
    const checkForArrowFunctions = (bank?: EffectGeneratorBank) => {
      if (!bank) { return; }
      for (const animName in bank) {
        const entry = bank[animName];
        const generator = entry.generateKeyframes ?? entry.generateKeyframeGenerators ?? entry.generateRafMutators ?? entry.generateRafMutatorGenerators;
        if (generator.toString().match(/^\(.*\) => .*/)) {
          errors.push(`"${animName}"`);
        }
      }
    };

    for (const bank of banks) { checkForArrowFunctions(bank); }

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
export const webflik = new WebFlik();
