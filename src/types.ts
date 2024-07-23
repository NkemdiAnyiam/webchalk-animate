import { AnimClip } from "./AnimClip";
import { AnimSequence } from "./AnimSequence";
import { AnimTimeline } from "./AnimTimeline";
import { WbfkConnector } from "./WbfkConnector";

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
  AnimSequence: InstanceType<typeof AnimSequence>;
  AnimTimeline: InstanceType<typeof AnimTimeline>;
  WbfkConnector: InstanceType<typeof WbfkConnector>;
};
