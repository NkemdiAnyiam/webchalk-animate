import { AnimBlock, AnimBlockConfig} from "./AnimBlock";
import {
  EntranceBlock, ExitBlock, EmphasisBlock, MotionBlock, ScrollerBlock, TransitionBlock, ExitBlockConfig, EntranceBlockConfig,
  ConnectorEntranceBlock, ConnectorExitBlock, ConnectorSetterBlock,
  EmphasisBlockConfig,
  MotionBlockConfig,
  ScrollerBlockConfig,
  ConnectorExitBlockConfig,
  ConnectorEntranceBlockConfig,
  TransitionBlockConfig
} from "./categoricalBlocks";
import { AnimSequence } from "./AnimSequence";
import { AnimTimeline } from "./AnimTimeline";
import { WbfkConnector, WbfkConnectorConfig } from "./WbfkConnector";
import { libPresetEntrances, libPresetExits, libPresetEmphases, libPresetMotions, libPresetConnectorEntrances, libPresetConnectorExits, libPresetScrolls, libPresetTransitions } from "./libraryPresetBanks";
import { useEasing } from "./utils/easing";
import { MultiUnitPlacementX, MultiUnitPlacementY, ScrollingOptions } from "./utils/interfaces";
import { ReadonlyPick, ReadonlyRecord, StripDuplicateMethodAutocompletion } from "./utils/utilityTypes";

type KeyframesGenerator<TBlockContext extends unknown> = {
  generateKeyframes(this: TBlockContext, ...effectOptions: unknown[]): [forward: Keyframe[], backward?: Keyframe[]];
  generateKeyframeGenerators?: never;
  generateRafMutators?: never;
  generateRafMutatorGenerators?: never;
};
type KeyframesGeneratorsGenerator<TBlockContext extends unknown> = {
  generateKeyframes?: never;
  generateKeyframeGenerators(this: TBlockContext, ...effectOptions: unknown[]): [forwardGenerator: () => Keyframe[], backwardGenerator?: () => Keyframe[]];
  generateRafMutators?: never;
  generateRafMutatorGenerators?: never;
};
type RafMutatorsGenerator<TBlockContext extends unknown> = {
  generateKeyframes?: never;
  generateKeyframeGenerators?: never;
  generateRafMutators(this: TBlockContext & ReadonlyPick<AnimBlock, 'computeTween'>, ...effectOptions: unknown[]): [forwardMutator: () => void, backwardMutator: () => void];
  generateRafMutatorGenerators?: never;
};
type RafMutatorsGeneratorsGenerator<TBlockContext extends unknown> = {
  generateKeyframes?: never;
  generateKeyframeGenerators?: never;
  generateRafMutators?: never;
  generateRafMutatorGenerators(this: TBlockContext & ReadonlyPick<AnimBlock, 'computeTween'>, ...effectOptions: unknown[]): [forwardGenerator: () => () => void, backwardGenerator: () => () => void];
};

export type EffectGenerator<TBlockContext extends unknown = unknown, TConfig extends unknown = unknown, IncludeExtras extends boolean = true> = Readonly<
  {
    config?: Partial<TConfig>;
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
    KeyframesGenerator<TBlockContext> | KeyframesGeneratorsGenerator<TBlockContext> | RafMutatorsGenerator<TBlockContext> | RafMutatorsGeneratorsGenerator<TBlockContext>
  )>
>;

// represents an object where every string key is paired with a EffectGenerator value
export type EffectGeneratorBank<TBlock extends AnimBlock = AnimBlock, TBlockConfig extends {} = AnimBlockConfig, IncludeGeneratorExtras extends boolean = true> = ReadonlyRecord<
  string, 
  EffectGenerator<ReadonlyPick<TBlock, 'effectName' | 'domElem'>, TBlockConfig, IncludeGeneratorExtras>
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


export abstract class WebFlik {
  static newSequence = AnimSequence.createInstance.bind(AnimSequence);
  static newTimeline = AnimTimeline.createInstance.bind(AnimTimeline);

  static createAnimationFactories
  <
   // default = {} ensures intellisense for a given bank still works
   // without specifying the field (why? not sure)
    CustomEntranceBank extends EffectGeneratorBank<EntranceBlock, EntranceBlockConfig, false> = {},
    CustomExitBank extends EffectGeneratorBank<ExitBlock, ExitBlockConfig, false> = {},
    CustomEmphasisBank extends EffectGeneratorBank<EmphasisBlock, EmphasisBlockConfig, false> = {},
    CustomMotionBank extends EffectGeneratorBank<MotionBlock, MotionBlockConfig, false> = {},
    _EmptyTransitionBank extends EffectGeneratorBank<TransitionBlock, TransitionBlockConfig> = {},
    _EmptyConnectorEntranceBank extends EffectGeneratorBank<ConnectorEntranceBlock, ConnectorEntranceBlockConfig> = {},
    _EmptyConnectorExitBank extends EffectGeneratorBank<ConnectorExitBlock, ConnectorExitBlockConfig> = {},
    _EmptyScrollerBank extends EffectGeneratorBank<ScrollerBlock, ScrollerBlockConfig> = {},
    IncludeLibPresets extends boolean = true
  >
  (
    customPresetEffectBanks: {
      customEntranceEffects?: CustomEntranceBank & EffectGeneratorBank<EntranceBlock, EntranceBlockConfig, false>;
      customExitEffects?: CustomExitBank & EffectGeneratorBank<ExitBlock, ExitBlockConfig, false>;
      customEmphasisEffects?: CustomEmphasisBank & EffectGeneratorBank<EmphasisBlock, EmphasisBlockConfig, false>;
      customMotionEffects?: CustomMotionBank & EffectGeneratorBank<MotionBlock, MotionBlockConfig, false>;
    } = {},
    includeLibraryPresets: IncludeLibPresets | void = true as IncludeLibPresets
  ) {
    const {customEntranceEffects, customExitEffects, customEmphasisEffects, customMotionEffects} = customPresetEffectBanks as {
      customEntranceEffects?: CustomEntranceBank & EffectGeneratorBank<EntranceBlock, EntranceBlockConfig>;
      customExitEffects?: CustomExitBank & EffectGeneratorBank<ExitBlock, ExitBlockConfig>;
      customEmphasisEffects?: CustomEmphasisBank & EffectGeneratorBank<EmphasisBlock, EmphasisBlockConfig>;
      customMotionEffects?: CustomMotionBank & EffectGeneratorBank<MotionBlock, MotionBlockConfig>;
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
    
    // Add the keyframes groups to the static banks of the block classes
    const combinedEntranceBank = mergeBanks(libPresetEntrances, customEntranceEffects as CustomEntranceBank);
    const combinedExitBank = mergeBanks(libPresetExits, customExitEffects as CustomExitBank);
    const combinedEmphasisBank = mergeBanks(libPresetEmphases, customEmphasisEffects as CustomEmphasisBank);
    const combinedMotionBank = mergeBanks(libPresetMotions, customMotionEffects as CustomMotionBank);
    const combinedTransitionBank = mergeBanks(libPresetTransitions, {} as _EmptyTransitionBank);
    const combinedConnectorEntranceBank = mergeBanks(libPresetConnectorEntrances, {} as _EmptyConnectorEntranceBank);
    const combinedConnectorExitBank = mergeBanks(libPresetConnectorExits, {} as _EmptyConnectorExitBank);
    const combinedScrollerBank = mergeBanks(libPresetScrolls, {} as _EmptyScrollerBank);

    // return functions that can be used to instantiate AnimBlocks with intellisense for the combined banks
    return {
      Entrance: function<TGeneratorBank extends typeof combinedEntranceBank, TEffectName extends EffectNameIn<TGeneratorBank>, TEffectGenerator extends TGeneratorBank[TEffectName]>(
        domElem: Element | null | undefined,
        effectName: TEffectName,
        ...initializationParams: Parameters<EntranceBlock<TEffectGenerator>['initialize']>
      ) {
        return new EntranceBlock<TEffectGenerator>(domElem, effectName, combinedEntranceBank).initialize(...initializationParams);
      },

      Exit: function<TGeneratorBank extends typeof combinedExitBank, TEffectName extends EffectNameIn<TGeneratorBank>, TEffectGenerator extends TGeneratorBank[TEffectName]>(
        domElem: Element | null | undefined,
        effectName: TEffectName,
        ...initializationParams: Parameters<ExitBlock<TEffectGenerator>['initialize']>
      ) {
        return new ExitBlock<TEffectGenerator>(domElem, effectName, combinedExitBank).initialize(...initializationParams);
      },

      Emphasis: function<TGeneratorBank extends typeof combinedEmphasisBank, TEffectName extends EffectNameIn<TGeneratorBank>, TEffectGenerator extends TGeneratorBank[TEffectName]>(
        domElem: Element | null | undefined,
        effectName: TEffectName,
        ...initializationParams: Parameters<EmphasisBlock<TEffectGenerator>['initialize']>
      ) {
        return new EmphasisBlock<TEffectGenerator>(domElem, effectName, combinedEmphasisBank).initialize(...initializationParams);
      },

      Motion: function<TGeneratorBank extends typeof combinedMotionBank, TEffectName extends EffectNameIn<TGeneratorBank>, TEffectGenerator extends TGeneratorBank[TEffectName]>(
        domElem: Element | null | undefined,
        effectName: TEffectName,
        ...initializationParams: Parameters<MotionBlock<TEffectGenerator>['initialize']>
      ) {
        return new MotionBlock<TEffectGenerator>(domElem, effectName, combinedMotionBank).initialize(...initializationParams);
      },

      Transition: function<TGeneratorBank extends typeof combinedTransitionBank, TEffectName extends EffectNameIn<TGeneratorBank>, TEffectGenerator extends TGeneratorBank[TEffectName]>(
        domElem: Element | null | undefined,
        effectName: TEffectName,
        ...initializationParams: Parameters<TransitionBlock<TEffectGenerator>['initialize']>
      ) {
        return new TransitionBlock<TEffectGenerator>(domElem, effectName, combinedTransitionBank).initialize(...initializationParams);
      },

      ConnectorSetter: function(
        connectorElem: WbfkConnector | null | undefined,
        pointA: [elemA: Element | null | undefined, xPlacement: number | MultiUnitPlacementX, yPlacement: number | MultiUnitPlacementY] | ['preserve'],
        pointB: [elemB: Element | null | undefined, xPlacement: number | MultiUnitPlacementX, yPlacement: number | MultiUnitPlacementY] | ['preserve'],
        connectorConfig: WbfkConnectorConfig = {} as WbfkConnectorConfig
      ) {
        const effectName = `~set-line-points`;
        return new ConnectorSetterBlock(
          connectorElem, pointA, pointB, effectName, {[effectName]: {...AnimBlock.emptyEffectGenerator, effectName}}, connectorConfig
        ).initialize([]);
      },

      ConnectorEntrance: function<
        TGeneratorBank extends typeof combinedConnectorEntranceBank, TEffectName extends EffectNameIn<TGeneratorBank>, TEffectGenerator extends TGeneratorBank[TEffectName]
      >(
        connectorElem: WbfkConnector | null | undefined,
        effectName: TEffectName,
        ...initializationParams: Parameters<ConnectorEntranceBlock<TEffectGenerator>['initialize']>
      ) {
        return new ConnectorEntranceBlock<TEffectGenerator>(connectorElem, effectName, combinedConnectorEntranceBank).initialize(...initializationParams);
      },

      ConnectorExit: function<TGeneratorBank extends typeof combinedConnectorExitBank, TEffectName extends EffectNameIn<TGeneratorBank>, TEffectGenerator extends TGeneratorBank[TEffectName]>(
        connectorElem: WbfkConnector | null | undefined,
        effectName: TEffectName,
        ...initializationParams: Parameters<ConnectorExitBlock<TEffectGenerator>['initialize']>
      ) { 
        return new ConnectorExitBlock<TEffectGenerator>(connectorElem, effectName, combinedConnectorExitBank).initialize(...initializationParams);
      },
      
      Scroller: function<TGeneratorBank extends typeof combinedScrollerBank, TEffectName extends EffectNameIn<TGeneratorBank>, TEffectGenerator extends TGeneratorBank[TEffectName]>
      (
        domElem: Element | null | undefined,
        effectName: TEffectName,
        ...initializationParams: Parameters<ScrollerBlock<TEffectGenerator>['initialize']>
      ) {
        return new ScrollerBlock<TEffectGenerator>(domElem, effectName, combinedScrollerBank).initialize(...initializationParams);
      },
    };
  }

  /**@internal*/
  static scrollAnchorsStack: [target: Element, scrollOptions: ScrollingOptions][] = [];

  static get utils() {
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
