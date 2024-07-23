import { AnimBlock } from "./AnimBlock";
import { AnimSequence } from "./AnimSequence";
import { AnimTimeline } from "./AnimTimeline";
import { WbfkConnector } from "./WbfkConnector";

 /**
 * This exposes the class types that are available in the framework for the purpose of type annotations. Access the types using bracket notation.
 * 
 * @example
 * ```ts
 * const myFunction(block: WbfkClassTypes['AnimBlock']) {
 *  return block.getConfig().duration;
 * }
 * // TS ERROR: Argument of type 'AnimTimeline' is not assignable to parameter of type 'AnimBlock<...>'.
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
  AnimBlock: InstanceType<typeof AnimBlock>;
  AnimSequence: InstanceType<typeof AnimSequence>;
  AnimTimeline: InstanceType<typeof AnimTimeline>;
  WbfkConnector: InstanceType<typeof WbfkConnector>;
};
