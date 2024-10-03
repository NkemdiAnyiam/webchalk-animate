import { AnimClip} from "./1_playbackStructures/AnimClip";
import {
  EntranceClip, ExitClip, EmphasisClip, MotionClip, ScrollerClip, TransitionClip,
  ConnectorEntranceClip, ConnectorExitClip, ConnectorSetterClip,
  Layer3MutableClipConfig,
} from "./1_playbackStructures/AnimClipCategories";
import { AnimSequence, AnimSequenceConfig } from "./1_playbackStructures/AnimSequence";
import { AnimTimeline, AnimTimelineConfig } from "./1_playbackStructures/AnimTimeline";
import { WbmtrConnector, WbmtrConnectorConfig } from "./3_components/WbmtrConnector";
import {
  libPresetEntrances, libPresetExits, libPresetEmphases, libPresetMotions,
  libPresetConnectorEntrances, libPresetConnectorExits, libPresetScrolls, libPresetTransitions
} from "./2_animationEffects/libraryPresetBanks";
import { useEasing } from "./4_utils/easing";
import { MultiUnitPlacementX, MultiUnitPlacementY, ScrollingOptions } from "./4_utils/interfaces";
import { WbmtrPlaybackButton } from "./3_components/WbmtrPlaybackButton";
import { EffectGeneratorBank, EffectGenerator, EffectNameIn } from "./2_animationEffects/generationTypes";

/**
 * @hideconstructor
 */
export class Webimator {
  // used to prevent direct calls to playback structures' constructors
  /**@internal*/ sequenceCreatorLock = true;
  /**@internal*/ timelineCreatorLock = true;
  /**@internal*/ clipCreatorLock = true;

  newSequence(config: Partial<AnimSequenceConfig>, ...animClips: AnimClip[]): AnimSequence;
  newSequence(...animClips: AnimClip[]): AnimSequence;
  newSequence(config: Partial<AnimSequenceConfig> | AnimClip = {}, ...animClips: AnimClip[]): AnimSequence {
    this.sequenceCreatorLock = false;
    const sequence = new AnimSequence(config, ...animClips);
    return sequence;
  }

  newTimeline(config: Partial<AnimTimelineConfig>, ...animSequences: AnimSequence[]): AnimTimeline;
  newTimeline(...animSequences: AnimSequence[]): AnimTimeline;
  newTimeline(config: Partial<AnimTimelineConfig> | AnimSequence = {}, ...animSequences: AnimSequence[]): AnimTimeline {
    this.timelineCreatorLock = false;
    const timeline = new AnimTimeline(config, ...animSequences);
    return timeline;
  }
  
  readonly classes = Object.freeze({
    AnimTimeline,
    AnimSequence,
    AnimClip,
    EntranceClip,
    ExitClip,
    EmphasisClip,
    MotionClip,
    TransitionClip,
    ScrollerClip,
    ConnectorSetterClip,
    ConnectorEntranceClip,
    ConnectorExitClip,
    WbmtrConnector,
    WbmtrPlaybackButton,
  });

  createAnimationClipFactories
  <
   // default = {} ensures intellisense for a given bank still works
   // without specifying the field (why? not sure)
    CustomEntranceBank extends EffectGeneratorBank<EntranceClip, Layer3MutableClipConfig<EntranceClip>> = {},
    CustomExitBank extends EffectGeneratorBank<ExitClip, Layer3MutableClipConfig<ExitClip>> = {},
    CustomEmphasisBank extends EffectGeneratorBank<EmphasisClip, Layer3MutableClipConfig<EmphasisClip>> = {},
    CustomMotionBank extends EffectGeneratorBank<MotionClip, Layer3MutableClipConfig<MotionClip>> = {},
    _EmptyTransitionBank extends EffectGeneratorBank<TransitionClip, Layer3MutableClipConfig<TransitionClip>> = {},
    _EmptyConnectorEntranceBank extends EffectGeneratorBank<ConnectorEntranceClip, Layer3MutableClipConfig<ConnectorEntranceClip>> = {},
    _EmptyConnectorExitBank extends EffectGeneratorBank<ConnectorExitClip, Layer3MutableClipConfig<ConnectorExitClip>> = {},
    _EmptyScrollerBank extends EffectGeneratorBank<ScrollerClip, Layer3MutableClipConfig<ScrollerClip>> = {},
    IncludeLibPresets extends boolean = true
  >
  (
    customPresetEffectBanks: {
      customEntranceEffects?: CustomEntranceBank & EffectGeneratorBank<EntranceClip, Layer3MutableClipConfig<EntranceClip>>;
      customExitEffects?: CustomExitBank & EffectGeneratorBank<ExitClip, Layer3MutableClipConfig<ExitClip>>;
      customEmphasisEffects?: CustomEmphasisBank & EffectGeneratorBank<EmphasisClip, Layer3MutableClipConfig<EmphasisClip>>;
      customMotionEffects?: CustomMotionBank & EffectGeneratorBank<MotionClip, Layer3MutableClipConfig<MotionClip>>;
    } = {},
    includeLibraryPresets: IncludeLibPresets | void = true as IncludeLibPresets
  ) {
    const {customEntranceEffects, customExitEffects, customEmphasisEffects, customMotionEffects} = customPresetEffectBanks as {
      customEntranceEffects?: CustomEntranceBank & EffectGeneratorBank<EntranceClip, Layer3MutableClipConfig<EntranceClip>>;
      customExitEffects?: CustomExitBank & EffectGeneratorBank<ExitClip, Layer3MutableClipConfig<ExitClip>>;
      customEmphasisEffects?: CustomEmphasisBank & EffectGeneratorBank<EmphasisClip, Layer3MutableClipConfig<EmphasisClip>>;
      customMotionEffects?: CustomMotionBank & EffectGeneratorBank<MotionClip, Layer3MutableClipConfig<MotionClip>>;
    };
    Webimator.checkBanksFormatting(customEntranceEffects, customExitEffects, customEmphasisEffects, customMotionEffects);

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
      Entrance: function<TGeneratorBank extends typeof combinedEntranceBank, TEffectName extends EffectNameIn<TGeneratorBank>, TEffectGenerator extends TGeneratorBank[TEffectName]>(
        domElem: Element | null | undefined,
        effectName: TEffectName,
        ...initializationParams: Parameters<EntranceClip<TEffectGenerator>['initialize']>
      ) {
        self.clipCreatorLock = false;
        return new EntranceClip<TEffectGenerator>(domElem, effectName, combinedEntranceBank).initialize(...initializationParams);
      },

      Exit: function<TGeneratorBank extends typeof combinedExitBank, TEffectName extends EffectNameIn<TGeneratorBank>, TEffectGenerator extends TGeneratorBank[TEffectName]>(
        domElem: Element | null | undefined,
        effectName: TEffectName,
        ...initializationParams: Parameters<ExitClip<TEffectGenerator>['initialize']>
      ) {
        self.clipCreatorLock = false;
        return new ExitClip<TEffectGenerator>(domElem, effectName, combinedExitBank).initialize(...initializationParams);
      },

      Emphasis: function<TGeneratorBank extends typeof combinedEmphasisBank, TEffectName extends EffectNameIn<TGeneratorBank>, TEffectGenerator extends TGeneratorBank[TEffectName]>(
        domElem: Element | null | undefined,
        effectName: TEffectName,
        ...initializationParams: Parameters<EmphasisClip<TEffectGenerator>['initialize']>
      ) {
        self.clipCreatorLock = false;
        return new EmphasisClip<TEffectGenerator>(domElem, effectName, combinedEmphasisBank).initialize(...initializationParams);
      },

      Motion: function<TGeneratorBank extends typeof combinedMotionBank, TEffectName extends EffectNameIn<TGeneratorBank>, TEffectGenerator extends TGeneratorBank[TEffectName]>(
        domElem: Element | null | undefined,
        effectName: TEffectName,
        ...initializationParams: Parameters<MotionClip<TEffectGenerator>['initialize']>
      ) {
        self.clipCreatorLock = false;
        return new MotionClip<TEffectGenerator>(domElem, effectName, combinedMotionBank).initialize(...initializationParams);
      },

      Transition: function<TGeneratorBank extends typeof combinedTransitionBank, TEffectName extends EffectNameIn<TGeneratorBank>, TEffectGenerator extends TGeneratorBank[TEffectName]>(
        domElem: Element | null | undefined,
        effectName: TEffectName,
        ...initializationParams: Parameters<TransitionClip<TEffectGenerator>['initialize']>
      ) {
        self.clipCreatorLock = false;
        return new TransitionClip<TEffectGenerator>(domElem, effectName, combinedTransitionBank).initialize(...initializationParams);
      },

      ConnectorSetter: function(
        connectorElem: WbmtrConnector | null | undefined,
        pointA: [elemA: Element | null | undefined, xPlacement: number | MultiUnitPlacementX, yPlacement: number | MultiUnitPlacementY] | ['preserve'],
        pointB: [elemB: Element | null | undefined, xPlacement: number | MultiUnitPlacementX, yPlacement: number | MultiUnitPlacementY] | ['preserve'],
        connectorConfig: WbmtrConnectorConfig = {} as WbmtrConnectorConfig
      ) {
        self.clipCreatorLock = false;
        const effectName = `~set-line-points`;
        return new ConnectorSetterClip(
          connectorElem, pointA, pointB, effectName, {[effectName]: {...AnimClip.createNoOpEffectGenerator(), /*effectName*/}}, connectorConfig
        ).initialize([]);
      },

      ConnectorEntrance: function<
        TGeneratorBank extends typeof combinedConnectorEntranceBank, TEffectName extends EffectNameIn<TGeneratorBank>, TEffectGenerator extends TGeneratorBank[TEffectName]
      >(
        connectorElem: WbmtrConnector | null | undefined,
        effectName: TEffectName,
        ...initializationParams: Parameters<ConnectorEntranceClip<TEffectGenerator>['initialize']>
      ) {
        self.clipCreatorLock = false;
        return new ConnectorEntranceClip<TEffectGenerator>(connectorElem, effectName, combinedConnectorEntranceBank).initialize(...initializationParams);
      },

      ConnectorExit: function<TGeneratorBank extends typeof combinedConnectorExitBank, TEffectName extends EffectNameIn<TGeneratorBank>, TEffectGenerator extends TGeneratorBank[TEffectName]>(
        connectorElem: WbmtrConnector | null | undefined,
        effectName: TEffectName,
        ...initializationParams: Parameters<ConnectorExitClip<TEffectGenerator>['initialize']>
      ) { 
        self.clipCreatorLock = false;
        return new ConnectorExitClip<TEffectGenerator>(connectorElem, effectName, combinedConnectorExitBank).initialize(...initializationParams);
      },
      
      Scroller: function<TGeneratorBank extends typeof combinedScrollerBank, TEffectName extends EffectNameIn<TGeneratorBank>, TEffectGenerator extends TGeneratorBank[TEffectName]>
      (
        domElem: Element | null | undefined,
        effectName: TEffectName,
        ...initializationParams: Parameters<ScrollerClip<TEffectGenerator>['initialize']>
      ) {
        self.clipCreatorLock = false;
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
export const webimator = new Webimator();

// const thing =  webimator.createAnimationClipFactories({
//   customEntranceEffects: {
//     hello: {
//       generateKeyframes() { return {
//         forwardFrames: []
//       } },
//       defaultConfig: {
        
//       },
//       immutableConfig: {
//         duration: 0
//       }
//     }
//   }
// }).Entrance(new HTMLElement(), '~appear', [], {}).getModifiers();
