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

export type { EffectFrameGeneratorSet, PresetEffectDefinition, PresetEffectBank, EffectNameIn, EffectOptions } from "../2_animationEffects/presetEffectCreation";

export type { PresetLinearEasingKey, EasingString, TrivialCssEasingFunction } from "../2_animationEffects/easing";

export type {
  ShapeFactoryFunctions
} from "../3_shapes/ShapeFactoryFunctions";
export type {
  DrawConnectorConfig,
  ConnectorPoint,
  ConnectorPointArg,
  ConnectorMarkerDimensions,
} from "../3_shapes/elements/WebchalkConnectorElement";
export {
  WebchalkConnectorElement,
} from "../3_shapes/elements/WebchalkConnectorElement";

// export {
//   WebchalkPlaybackButtonElement,
// } from "../4_graphicalUI/WebchalkPlaybackButtonElement";

export type * from "../5_utils/interfaces";

export type {
  ClipErrorGenerator,
  SequenceErrorGenerator,
  TimelineErrorGenerator,
  GeneralErrorGenerator,
} from "../5_utils/errors";
export {
  CustomErrorClasses,
} from "../5_utils/errors";
