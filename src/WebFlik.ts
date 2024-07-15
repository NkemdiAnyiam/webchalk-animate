import { AnimBlock, AnimBlockConfig} from "./AnimBlock";
import {
  EntranceBlock, ExitBlock, EmphasisBlock, MotionBlock, ScrollerBlock, TransitionBlock, ExitBlockConfig, EntranceBlockConfig,
  ConnectorEntranceBlock, ConnectorExitBlock, ConnectorSetterBlock
} from "./categoricalBlocks";
import { WbfkConnector, WbfkConnectorConfig } from "./WbfkConnector";
import { presetEntrances, presetExits, presetEmphases, presetMotions, presetConnectorEntrances, presetConnectorExits, presetScrolls, presetTransitions } from "./presetBanks";
import { useEasing } from "./utils/easing";
import { createStyles } from "./utils/helpers";
import { MultiUnitPlacementX, MultiUnitPlacementY, ReadonlyPick, ReadonlyRecord, ScrollingOptions, StripDuplicateMethodAutocompletion } from "./utils/interfaces";

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

export type EffectGenerator<TBlockContext extends unknown = unknown, TConfig extends unknown = unknown> = Readonly<
  { config?: Partial<TConfig>; }
  & StripDuplicateMethodAutocompletion<(
    KeyframesGenerator<TBlockContext> | KeyframesGeneratorsGenerator<TBlockContext> | RafMutatorsGenerator<TBlockContext> | RafMutatorsGeneratorsGenerator<TBlockContext>
  )>
>;

// represents an object where every string key is paired with a EffectGenerator value
export type EffectGeneratorBank<TBlock extends AnimBlock = AnimBlock, TBlockConfig extends {} = AnimBlockConfig> = ReadonlyRecord<
  string, 
  EffectGenerator<ReadonlyPick<TBlock, 'effectName' | 'domElem'>, TBlockConfig>
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
    UserEntranceBank extends EffectGeneratorBank<EntranceBlock, EntranceBlockConfig> = {},
    UserExitBank extends EffectGeneratorBank<ExitBlock, ExitBlockConfig> = {},
    UserEmphasisBank extends EffectGeneratorBank = {},
    UserMotionBank extends EffectGeneratorBank = {},
    _EmptyTransitionBank extends EffectGeneratorBank = {},
    _EmptyConnectorEntranceBank extends EffectGeneratorBank = {},
    _EmptyConnectorExitBank extends EffectGeneratorBank = {},
    _EmptyScrollerBank extends EffectGeneratorBank = {},
    IncludePresets extends boolean = true
  >
  (
    customBankAddons: {
      entrances?: UserEntranceBank & EffectGeneratorBank<EntranceBlock, EntranceBlockConfig>;
      exits?: UserExitBank & EffectGeneratorBank<ExitBlock, ExitBlockConfig>;
      emphases?: UserEmphasisBank & EffectGeneratorBank<EmphasisBlock>;
      motions?: UserMotionBank & EffectGeneratorBank<MotionBlock>;
    } = {},
    includePresets: IncludePresets | void = true as IncludePresets
  ) {
    const {entrances, exits, emphases, motions} = customBankAddons;
    _WebFlik.checkBanksFormatting(entrances, exits, emphases, motions);

    type TogglePresets<TPresetBank, TUserBank> = Readonly<(IncludePresets extends true ? TPresetBank : {}) & TUserBank>;

    const combineBanks = <P, U>(presets: P, userDefined: U) => ({...(includePresets ? presets : {}), ...(userDefined ?? {})}) as TogglePresets<P, U>;
    
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
      Entrance: function<
        TGeneratorBank extends typeof combinedEntranceBank, EffectName extends EffectNameIn<TGeneratorBank>, EntryType extends TGeneratorBank[EffectName]
      >(domElem: Element | null | undefined, effectName: EffectName, ...params: Parameters<EntranceBlock<EntryType>['initialize']>) {
        return new EntranceBlock<EntryType>(domElem, effectName, combinedEntranceBank, 'Entrance').initialize(...params);
      },

      Exit: function<
        TGeneratorBank extends typeof combinedExitBank, EffectName extends EffectNameIn<TGeneratorBank>, EntryType extends TGeneratorBank[EffectName]
      >(domElem: Element | null | undefined, effectName: EffectName, ...params: Parameters<ExitBlock<EntryType>['initialize']>) {
        return new ExitBlock<EntryType>(domElem, effectName, combinedExitBank, 'Exit').initialize(...params);
      },

      Emphasis: function<
        TGeneratorBank extends typeof combinedEmphasisBank, EffectName extends EffectNameIn<TGeneratorBank>, EntryType extends TGeneratorBank[EffectName]
      >(domElem: Element | null | undefined, effectName: EffectName, ...params: Parameters<EmphasisBlock<EntryType>['initialize']>) {
        return new EmphasisBlock<EntryType>(domElem, effectName, combinedEmphasisBank, 'Emphasis').initialize(...params);
      },

      Motion: function<
        TGeneratorBank extends typeof combinedMotionBank, EffectName extends EffectNameIn<TGeneratorBank>, EntryType extends TGeneratorBank[EffectName]
      >(domElem: Element | null | undefined, effectName: EffectName, ...params: Parameters<MotionBlock<EntryType>['initialize']>) {
        return new MotionBlock<EntryType>(domElem, effectName, combinedMotionBank, 'Motion').initialize(...params);
      },

      Transition: function<
        TGeneratorBank extends typeof combinedTransitionBank, EffectName extends EffectNameIn<TGeneratorBank>, EntryType extends TGeneratorBank[EffectName]
      >(domElem: Element | null | undefined, effectName: EffectName, ...params: Parameters<TransitionBlock<EntryType>['initialize']>) {
        return new TransitionBlock<EntryType>(domElem, effectName, combinedTransitionBank, 'Transition').initialize(...params);
      },

      ConnectorSetter: function(
        connectorElem: WbfkConnector,
        pointA: [elemA: Element | null | undefined, xPlacement: number | MultiUnitPlacementX, yPlacement: number | MultiUnitPlacementY] | ['preserve'],
        pointB: [elemB: Element | null | undefined, xPlacement: number | MultiUnitPlacementX, yPlacement: number | MultiUnitPlacementY] | ['preserve'],
        connectorConfig: WbfkConnectorConfig = {} as WbfkConnectorConfig
      ) {
        return new ConnectorSetterBlock(connectorElem, pointA, pointB, `~set-line-points`, {}, 'Connector Setter', connectorConfig).initialize([]);
      },

      ConnectorEntrance: function<
        TGeneratorBank extends typeof combinedConnectorEntranceBank, EffectName extends EffectNameIn<TGeneratorBank>, EntryType extends TGeneratorBank[EffectName]
      >(connectorElem: WbfkConnector | null | undefined, effectName: EffectName, ...params: Parameters<ConnectorEntranceBlock<EntryType>['initialize']>) {
        return new ConnectorEntranceBlock<EntryType>(connectorElem, effectName, combinedConnectorEntranceBank, 'Connector Entrance').initialize(...params);
      },

      ConnectorExit: function<TGeneratorBank extends typeof combinedConnectorExitBank, EffectName extends EffectNameIn<TGeneratorBank>, EntryType extends TGeneratorBank[EffectName]>
      (connectorElem: WbfkConnector | null | undefined, effectName: EffectName, ...params: Parameters<ConnectorExitBlock<EntryType>['initialize']>)
      { return new ConnectorExitBlock<EntryType>(connectorElem, effectName, combinedConnectorExitBank, 'Connector Exit').initialize(...params); },
      
      Scroller: function
      <TGeneratorBank extends typeof combinedScrollerBank, EffectName extends EffectNameIn<TGeneratorBank>, EntryType extends TGeneratorBank[EffectName]>
      (domElem: Element | null | undefined, effectName: EffectName, ...params: Parameters<ScrollerBlock<EntryType>['initialize']>) {
        return new ScrollerBlock<EntryType>(domElem, effectName, combinedScrollerBank, 'Scroller').initialize(...params);
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

createStyles(/*css*/`
/* Using :where makes it possible for developer to easily override the default color */
:where(:root) {
  --wbfk-highlight-color: #F9F278;
  --wbfk-playback-button-press-color: #db0000;
  --wbfk-playback-button-hold-color: #62B720;
  --wbfk-playback-button-disabled-color: gray;
  --wbfk-playback-button-background-color: #444;
  --wbfk-playback-button-symbol-color: white;
}

.wbfk-hidden:not(.wbfk-override-hidden) {
  display: none !important;
}

.wbfk-invisible:not(.wbfk-override-hidden) {
  visibility: hidden !important;
}

.wbfk-highlightable {
  background-image: linear-gradient(to right, var(--wbfk-highlight-color) 50%, transparent 50%);
  background-size: 202%;
  background-position-x: 100%;
}`);
