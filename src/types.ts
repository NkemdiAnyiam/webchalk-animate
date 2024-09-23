import { AnimClip } from "./AnimClip";
import * as categoryClips from "./categoricalClips";
import { AnimSequence } from "./AnimSequence";
import { AnimTimeline } from "./AnimTimeline";
import { WbfkConnector } from "./WbfkConnector";
import { WbfkPlaybackButton } from "./WbfkPlaybackButton";

 /**
 * This exposes the class types that are available in the framework for the purpose of type annotations. Access the types using bracket notation.
 * 
 * @example
 * ```ts
 * const myFunction(clip: WbfkClassTypes['AnimClip']) {
 *  return clip.getConfig().duration;
 * }
 * // TS ERROR: Argument of type 'AnimTimeline' is not assignable to parameter of type 'AnimClip<...>'.
 * myFunction(WebFlik.newSequence());
 * // OKAY
 * myFunction(Entrance(<...>));
 * ```
 * 
 * @example
 * ```ts
 * // TS ERROR: <...>
 * const timeline: WbfkClassTypes['AnimTimeline'] = WebFlik.newSequence();
 * // OKAY
 * const sequence: WbfkClassTypes['AnimSequence'] = WebFlik.newSequence();
 * ```
 * 
 * @example
 * ```ts
 * // implicit type will be WbfkConnector | null
 * const connector = document.querySelector<WbfkClassTypes['WbfkConnector']>('.connector--red');
 * ```
 */
export type WbfkClassTypes = {
  AnimClip: InstanceType<typeof AnimClip>;
  EntranceClip: InstanceType<typeof categoryClips.EntranceClip>;
  ExitClip: InstanceType<typeof categoryClips.ExitClip>;
  EmphasisClip: InstanceType<typeof categoryClips.EmphasisClip>;
  MotionClip: InstanceType<typeof categoryClips.MotionClip>;
  TransitionClip: InstanceType<typeof categoryClips.TransitionClip>;
  ScrollerClip: InstanceType<typeof categoryClips.ScrollerClip>;
  ConnectorSetterClip: InstanceType<typeof categoryClips.ConnectorSetterClip>;
  ConnectorEntranceClip: InstanceType<typeof categoryClips.ConnectorEntranceClip>;
  ConnectorExitClip: InstanceType<typeof categoryClips.ConnectorExitClip>;
  AnimSequence: InstanceType<typeof AnimSequence>;
  AnimTimeline: InstanceType<typeof AnimTimeline>;
  WbfkConnector: InstanceType<typeof WbfkConnector>;
  WbfkPlaybackButton: InstanceType<typeof WbfkPlaybackButton>;
};
