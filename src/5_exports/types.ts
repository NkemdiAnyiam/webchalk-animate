export type {
  AnimClipConfig,
  AnimClipEffectDetails,
  AnimClipModifiers,
  AnimClipStatus,
  AnimClipTiming,
  CssClassOptions,
  ScheduledTask,
} from "../1_playbackStructures/AnimationClip";
export {
  AnimClip,
} from "../1_playbackStructures/AnimationClip";

export type {
  ConnectorEntranceClipConfig,  
  ConnectorEntranceClipModifiers,
  ConnectorExitClipConfig,
  ConnectorSetterClipConfig,
  EmphasisClipConfig,
  EntranceClipConfig,
  EntranceClipModifiers,
  ExitClipConfig,
  Layer4MutableConfig,
  MotionClipConfig,
  ScrollerClipConfig,
  TransitionClipConfig,
  TransitionClipModifiers,
} from "../1_playbackStructures/AnimationClipCategories";
export {
  ConnectorEntranceClip,
  ConnectorExitClip,
  ConnectorSetterClip,
  EmphasisClip,
  EntranceClip,
  ExitClip,
  MotionClip,
  ScrollerClip,
  TransitionClip,
} from "../1_playbackStructures/AnimationClipCategories";

export type {
  AddClipsOptions,
  AnimSequenceConfig,
  AnimSequenceStatus,
  AnimSequenceTiming,
} from "../1_playbackStructures/AnimationSequence";
export {
  AnimSequence
} from "../1_playbackStructures/AnimationSequence";

export type {
  AnimTimelineConfig,
  AnimTimelineStatus,
  AnimTimelineTiming,
  AddSequencesOptions
} from "../1_playbackStructures/AnimationTimeline";
export {
  AnimTimeline,
} from "../1_playbackStructures/AnimationTimeline";


export type {
  WebChalkConnectorElementConfig,
} from "../3_components/WebChalkConnectorElement";
export {
  WebChalkConnectorElement,
} from "../3_components/WebChalkConnectorElement";

export {
  WebChalkPlaybackButtonElement,
} from "../3_components/WebChalkPlaybackButtonElement";

export type * from "../4_utils/interfaces";

export type { EffectFrameGeneratorSet, PresetEffectDefinition, PresetEffectBank, EffectNameIn, EffectOptions } from "../2_animationEffects/customEffectCreation";

export type { PresetLinearEasingKey, EasingString, TrivialCssEasingFunction } from "../2_animationEffects/easing";

// export type {
//   ClipErrorGenerator,
//   SequenceErrorGenerator,
//   TimelineErrorGenerator,
//   GeneralErrorGenerator,
//   CustomErrors,
// } from "../4_utils/errors";
