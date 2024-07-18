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
import { WbfkConnector, WbfkConnectorConfig } from "./WbfkConnector";
import { presetEntrances, presetExits, presetEmphases, presetMotions, presetConnectorEntrances, presetConnectorExits, presetScrolls, presetTransitions } from "./presetBanks";
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


class _WebFlik {
  createAnimationBanks
  <
   // default = {} ensures intellisense for a given bank still works
   // without specifying the field (why? not sure)
    UserEntranceBank extends EffectGeneratorBank<EntranceBlock, EntranceBlockConfig, false> = {},
    UserExitBank extends EffectGeneratorBank<ExitBlock, ExitBlockConfig, false> = {},
    UserEmphasisBank extends EffectGeneratorBank<EmphasisBlock, EmphasisBlockConfig, false> = {},
    UserMotionBank extends EffectGeneratorBank<MotionBlock, MotionBlockConfig, false> = {},
    _EmptyTransitionBank extends EffectGeneratorBank<TransitionBlock, TransitionBlockConfig> = {},
    _EmptyConnectorEntranceBank extends EffectGeneratorBank<ConnectorEntranceBlock, ConnectorEntranceBlockConfig> = {},
    _EmptyConnectorExitBank extends EffectGeneratorBank<ConnectorExitBlock, ConnectorExitBlockConfig> = {},
    _EmptyScrollerBank extends EffectGeneratorBank<ScrollerBlock, ScrollerBlockConfig> = {},
    IncludePresets extends boolean = true
  >
  (
    customBankAddons: {
      entrances?: UserEntranceBank & EffectGeneratorBank<EntranceBlock, EntranceBlockConfig, false>;
      exits?: UserExitBank & EffectGeneratorBank<ExitBlock, ExitBlockConfig, false>;
      emphases?: UserEmphasisBank & EffectGeneratorBank<EmphasisBlock, EmphasisBlockConfig, false>;
      motions?: UserMotionBank & EffectGeneratorBank<MotionBlock, MotionBlockConfig, false>;
    } = {},
    includePresets: IncludePresets | void = true as IncludePresets
  ) {
    const {entrances, exits, emphases, motions} = customBankAddons as {
      entrances?: UserEntranceBank & EffectGeneratorBank<EntranceBlock, EntranceBlockConfig>;
      exits?: UserExitBank & EffectGeneratorBank<ExitBlock, ExitBlockConfig>;
      emphases?: UserEmphasisBank & EffectGeneratorBank<EmphasisBlock, EmphasisBlockConfig>;
      motions?: UserMotionBank & EffectGeneratorBank<MotionBlock, MotionBlockConfig>;
    };
    _WebFlik.checkBanksFormatting(entrances, exits, emphases, motions);

    type TogglePresets<TPresetBank, TUserBank> = Readonly<(IncludePresets extends true ? TPresetBank : {}) & TUserBank>;

    const combineBanks = <P, U>(presets: P, userDefined: U) => {
      const combinedBank = {...(includePresets ? presets : {}), ...(userDefined ?? {})} as EffectGeneratorBank;
      // set effectName and sourceBank properties of each generator to thier obviously corresponding values
      // Object.assign circumvents the Readonly<>, preventing a TS error
      for (const key in combinedBank) {
        const extras = { effectName: key, sourceBank: combinedBank } satisfies Partial<EffectGenerator>;
        Object.assign(combinedBank[key], extras);
      }
      return combinedBank as TogglePresets<P, U>;
    }
    
    // Add the keyframes groups to the static banks of the block classes
    const combinedEntranceBank = combineBanks(presetEntrances, entrances as UserEntranceBank);
    const combinedExitBank = combineBanks(presetExits, exits as UserExitBank);
    const combinedEmphasisBank = combineBanks(presetEmphases, emphases as UserEmphasisBank);
    const combinedMotionBank = combineBanks(presetMotions, motions as UserMotionBank);
    const combinedTransitionBank = combineBanks(presetTransitions, {} as _EmptyTransitionBank);
    const combinedConnectorEntranceBank = combineBanks(presetConnectorEntrances, {} as _EmptyConnectorEntranceBank);
    const combinedConnectorExitBank = combineBanks(presetConnectorExits, {} as _EmptyConnectorExitBank);
    const combinedScrollerBank = combineBanks(presetScrolls, {} as _EmptyScrollerBank);

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
        connectorElem: WbfkConnector,
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

  /**@internal */
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

export const WebFlik = new _WebFlik();
