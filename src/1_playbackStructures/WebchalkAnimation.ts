import { AnimClip, PromiseWithId, ScheduledTask } from "./AnimationClip";
import { CustomErrorClasses, ClipErrorGenerator } from "../4_utils/errors";
import { DOMElement, Keyframes } from "../4_utils/interfaces";
import { useEasing } from "../2_animationEffects/easing";
import { detab, equalWithinTol, generateId, PERCENTAGE_REGEX, RELATIVE_TIME_POSITION_REGEX, TBA_DURATION } from "../4_utils/helpers";
import { WebchalkPhaseSegmentElement } from "../3_components/pane-ui/WebchalkPhaseSegmentElement";

abstract class WebchalkAnimationBase extends Animation {
  forwardEffect: KeyframeEffect;
  backwardEffect: KeyframeEffect;
  target: DOMElement;
  direction: 'forward' | 'backward' = 'forward';
  protected getEffect(direction: 'forward' | 'backward'): KeyframeEffect { return direction === 'forward' ? this.forwardEffect : this.backwardEffect; }
  protected inProgress = false;
  get durationPending(): boolean { return equalWithinTol(this.effect!.getTiming().duration as number, TBA_DURATION); }

  constructor(target: Element | null | undefined, keyframeOptions: KeyframeEffectOptions, protected errorGenerator: ClipErrorGenerator, protected animClip: AnimClip) {
    super();

    if (!target) { throw this.errorGenerator(CustomErrorClasses.InvalidElementError, [`Animation target must not be null or undefined`]); }
    this.target = target as DOMElement;

    this.forwardEffect = new KeyframeEffect(
      target,
      // Using fontFeatureSettings handles a very strange Firefox bug that causes animations to run without any visual changes
      // when the animation is finished, setKeyframes() is called, and the animation continues after extending the runtime using
      // endDelay. It appears that the bug only occurs when the keyframes field contains nothing that will actually affect the
      // styling of the element (for example, adding {['fake-field']: 'bla'} will not fix it), but I obviously do not want to
      // add anything that will actually affect the style of the element, so I decided to use fontFeatureSettings and set it to
      // the default value to make it as unlikely as possible that anything the user does is obstructed.
      [{fontFeatureSettings: 'normal'}],
      keyframeOptions,
    );

    this.backwardEffect = new KeyframeEffect(
      target,
      [{fontFeatureSettings: 'normal'}],
      {
        ...keyframeOptions,
        easing: useEasing(keyframeOptions.easing ?? 'linear', {inverted: true}),
        // delay & endDelay are of course swapped when we want to play in "reverse"
        delay: keyframeOptions.endDelay,
        endDelay: keyframeOptions.delay,
      },
    );
    
    // TODO: check to see if this line is actually necessary
    this.setDirection('forward');
  }
  
  setForwardFrames(keyframes: Keyframes, shouldReverse: boolean = false): void {
    this.forwardEffect.setKeyframes(keyframes);
    (super.effect as KeyframeEffect).setKeyframes(keyframes);

    // if forward keyframes were copied from backward keyframes, then
    // reverse direction of forward keyframes and use the same easing
    // as the backward keyframes (since it will naturally also be reversed)
    // due to the reversed direction
    if (shouldReverse) {
      this.forwardEffect.updateTiming({
        direction: 'reverse',
        // easing: this.backwardEffect.getTiming().easing,
      });
    }

    // if animation is playing, the current effect object must be updated
    if (this.inProgress) {
      // if forward keyframes are mirrored, use same logic as above
      if (shouldReverse) {
        super.effect?.updateTiming({
          direction: shouldReverse ? 'reverse' : 'normal',
          // easing: this.backwardEffect.getTiming().easing,
        });
      }
      // otherwise, update the direction to be normal in case it was changed by
      // the backward keyframes potentially being mirrored
      else {
        super.effect?.updateTiming({direction: shouldReverse ? 'reverse' : 'normal'});
      }
    }
  }

  setBackwardFrames(keyframes: Keyframes, isMirror: boolean = false, shouldReverse: boolean = false): void {
    this.backwardEffect.setKeyframes(keyframes);
    (super.effect as KeyframeEffect).setKeyframes(keyframes);

    if (isMirror) {
      this.backwardEffect.updateTiming({
        direction: shouldReverse ? 'normal' : 'reverse',
        easing: this.forwardEffect.getTiming().easing,
      });
    }

    if (this.inProgress) {
      if (isMirror) {
        super.effect?.updateTiming({
          direction: shouldReverse ? 'normal' : 'reverse',
          easing: this.forwardEffect.getTiming().easing,
        });
      }
      else {
        super.effect?.updateTiming({ direction: shouldReverse ? 'reverse' : 'normal' });
      }
    }
  }

  /**
   * Swaps the current {@link Animation.effect} for either {@link WebchalkAnimationBase.forwardEffect}
   * or {@link WebchalkAnimationBase.backwardEffect} depending on {@link direction}.
   * @param direction - The direction in which the animation will go when playback is initiated.
   */
  setDirection(direction: 'forward' | 'backward'): void {
    this.direction = direction;

    // Load proper KeyframeEffect
    // The deep copying circumvents a strange Firefox bug involving reusing effects
    switch(direction) {
      case "forward":
        const forwardEffect = this.forwardEffect;
        super.effect = new KeyframeEffect(forwardEffect.target, forwardEffect.getKeyframes(), {...forwardEffect.getTiming(), composite: forwardEffect.composite});
        break;
      case "backward":
        const backwardEffect = this.backwardEffect;
        super.effect = new KeyframeEffect(backwardEffect.target, backwardEffect.getKeyframes(), {...backwardEffect.getTiming(), composite: backwardEffect.composite});
        break;
      default:
        throw this.errorGenerator(RangeError, [`Invalid direction "${direction}" passed to setDirection(). Must be "forward" or "backward".`]);
    }
  }

  /** @internal */
  updateDuration(duration: number): void {
    this.effect?.updateTiming({duration, endDelay: -duration});
    this.forwardEffect.updateTiming({duration, endDelay: -duration});
    this.backwardEffect.updateTiming({duration});
  }
}

export type PhaseSegment = {
  endDelay: number,
  mainCallbacks: Function[],
  resolverContainers: ScheduledResolverContainer[],
  taskParts: ScheduledTaskPart[],
  integrityOuterResolvers: Function[],
  integrityAsyncCbs: Function[],
  // true when awaiting delay/endDelay periods while the awaited delay/endDelay duration is 0
  skipEndDelayUpdation: boolean,
  header: Partial<{
    completed: boolean;
    activated: boolean;
    timePosition: number | 'beginning' | 'end' | `${number}%`;
    cached: boolean;
  }> & {
    direction: 'forward' | 'backward';
    phase: 'delayPhase' | 'activePhase' | 'endDelayPhase' | 'whole';
  },
  phaseSegmentEl?: WebchalkPhaseSegmentElement;
};

type PhaseEndSegmentsCache = [delayPhaseEnd: PhaseSegment, activePhaseEnd: PhaseSegment, endDelayPhaseEnd: PhaseSegment];

type ScheduledResolverContainer = {
  id: string;
  origTimePosition: Parameters<AnimClip['scheduleResolver']>[2];
  resolver: Function;
  called?: boolean;
  hideFromUI?: boolean;
  label?: string;
};
type ScheduledTaskPart = {
  id: string;
  callback: Function;
  frequencyLimit: number;
  initialFrequencyLimit: number;
  origTimePosition: Parameters<AnimClip['scheduleTask']>[1];
  hideFromUI?: boolean;
  description?: string;
};

type FullyFinishedPromise = {
  promise: Promise<WebchalkAnimation>;
  resolve: (value: WebchalkAnimation | PromiseLike<WebchalkAnimation>) => void;
};

export class WebchalkAnimation extends WebchalkAnimationBase {
  private isFinished = false;
  private isExpediting = false;
  fullyFinished: FullyFinishedPromise = this.getNewFullyFinished();
  private getNewFullyFinished(): FullyFinishedPromise {
    const {resolve, promise} = Promise.withResolvers<WebchalkAnimation>();
    return {resolve, promise};
  }

  // holds list of stopping points and resolvers to control segmentation of animation...
  // ... to help with Promises-based sequencing
  /** @internal */ phaseSegmentsForward: PhaseSegment[] = [];
  private phaseEndSegmentsForwardCache: PhaseEndSegmentsCache;
  /** @internal */ phaseSegmentsBackward: PhaseSegment[] = [];
  private phaseEndSegmentsBackwardCache: PhaseEndSegmentsCache;

  private taskReschedulingQueue: {
    [id: string]: {
      onPlayReschedulingArgs?: Parameters<WebchalkAnimation['renewScheduledTaskPart']>;
      onRewindReschedulingArgs?: Parameters<WebchalkAnimation['renewScheduledTaskPart']>;
    };
  } = {};

  private resolverReschedulingQueue: {
    [id: string]: {
      reschedulingArgs: Parameters<WebchalkAnimation['renewScheduledResolver']>;
    };
  } = {};

  private numTaskPartsForward = 0;
  private numTaskPartsBackward = 0;
  private numPromisesForward = 0;
  private numPromisesBackward = 0;
  hasTaskParts(direction: 'forward' | 'backward'): boolean {
    return direction === 'forward' ? (this.numTaskPartsForward > 0) : (this.numTaskPartsBackward > 0);
  }
  hasPromises(direction: 'forward' | 'backward'): boolean {
    return direction === 'forward' ? (this.numPromisesForward > 0) : (this.numPromisesBackward > 0);
  }
  
  onDelayFinish: Function = () => {};
  onActiveFinish: Function = () => {};
  onEndDelayFinish: Function = () => {};
  
  // FIXME: The behavior for pausing for tasks while expedition is in act is undefined
  pauseForTasks: Function = () => { throw new Error(`This should never be called before being defined by parent clip`); };
  unpauseFromTasks: Function = () => { throw new Error(`This should never be called before being defined by parent clip`); };

  nestedAnimations: NestedWebchalkAnimation[] = [];
  createNestedAnimation(...args: ConstructorParameters<typeof NestedWebchalkAnimation>): NestedWebchalkAnimation {
    const nestedAnimation = new NestedWebchalkAnimation(...args)
    nestedAnimation.leader = this;
    this.nestedAnimations.push(nestedAnimation);

    return nestedAnimation;
  }
  deleteNestedAnimations() {
    const nestedAnimations = this.nestedAnimations;
    for (let i = 0; i < nestedAnimations.length; ++i) {
      nestedAnimations[i].leader = undefined;
    }
    this.nestedAnimations = [];
  }

  constructor(target: Element | null | undefined, keyframeOptions: KeyframeEffectOptions, errorGenerator: ClipErrorGenerator, animClip: AnimClip) {
    super(target, keyframeOptions, errorGenerator, animClip);

    this.resetPhaseSegments('both');
    this.phaseEndSegmentsForwardCache = [...this.phaseSegmentsForward] as PhaseEndSegmentsCache;
    this.phaseEndSegmentsBackwardCache = [...this.phaseSegmentsBackward] as PhaseEndSegmentsCache;
  }
  
  async play(): Promise<void> {
    const childAnimations = this.nestedAnimations;
    // If animation is already in progress and is just paused, resume the animation directly.
    // Through AnimClip, the only time this can happen is when using AnimClip.unpause()
    if (super.playState === 'paused') {
      super.play();
      for (let i = 0; i < childAnimations.length; ++i) {
        childAnimations[i].play();
      }
      return;
    }
    
    // If play() is called while already playing, return.
    if (this.inProgress) { return; }
    this.inProgress = true;
    
    // if animation is being activated after having finished playback at some point,...
    // ... reset fullyFinished promise
    if (this.isFinished) {
      this.isFinished = false;
      this.fullyFinished = this.getNewFullyFinished();
    }

    super.play();
    // extra await allows additional pushes to queue before loop begins
    await Promise.resolve();
    for (let i = 0; i < childAnimations.length; ++i) {
      childAnimations[i].play();
    }

    const effect = super.effect!;
    const phaseSegments = this.direction === 'forward' ? this.phaseSegmentsForward : this.phaseSegmentsBackward;
    let blockedForTasks: boolean | null = null;
    // Traverse live array instead of static length since entries could be added mid-loop
    for (const segment of phaseSegments) {
      const {
        endDelay, mainCallbacks, resolverContainers, taskParts, integrityOuterResolvers, integrityAsyncCbs, skipEndDelayUpdation, header, phaseSegmentEl
      }: PhaseSegment = segment;
      header.activated = true;

      if (!skipEndDelayUpdation) {
        // Set animation to stop at a certain time using endDelay.
        effect.updateTiming({ endDelay });
        for (let i = 0; i < childAnimations.length; ++i) {
          childAnimations[i].effect!.updateTiming({ endDelay });
        }
        // if playback was paused for tasks, resume playback
        if (blockedForTasks === true) {
          this.unpauseFromTasks();
          blockedForTasks = false;
        }
        if (this.isExpediting) {
          super.finish();
          for (let i = 0; i < childAnimations.length; ++i) {
            childAnimations[i].finish();
          }
        }
        await Promise.all([
          super.finished,
          ...(childAnimations.map(anim => anim.finished)),
        ]);
      }
      else {
        // This allows outside operations like scheduleResolver() to push more callbacks to the queue...
        // ... before the next loop iteration (this makes up for not having await super.finished)
        await Promise.resolve();
      }
      header.completed = true;

      // Await any blockers for the completion of this phase
      if (taskParts.length > 0) {
        this.pauseForTasks();
        blockedForTasks = true;
        // For any functions, replace the entry with the return value (a promise)
        // If animation is "rewinding", tasks should be processed in reverse order...
        // ... to ensure that side-effects from tasks are stable
        await Promise.all(
          (this.direction === 'forward' ? taskParts : taskParts.toReversed())
            .map(taskPart => {
              --taskPart.frequencyLimit; return taskPart.callback();
            }
          )
        );
      }
      if (integrityAsyncCbs.length > 0) {
        // for any functions, replace the entry with the return value (a promise)
        await Promise.all(integrityAsyncCbs.map(callback => callback()));
      }
      // Call callbacks from animate() that awaited the completion of this phase
      for (const callback of mainCallbacks) {
        callback();
      }
      for (const rContainer of resolverContainers) {
        rContainer.resolver();
        rContainer.called = true;
        this.direction === 'forward' ? (--this.numPromisesForward) : (--this.numPromisesBackward);
        delete this.resolverReschedulingQueue[rContainer.id];
      }
      for (const resolver of integrityOuterResolvers) { resolver(); }
      
      phaseSegmentEl?.update(this.direction);
      // extra await allows additional pushes to preempt next segment when they should
      await Promise.resolve();
    }
    
    // accounts for the possibility of the very last segment pausing for a task...
    // ... in which case unpauseFromTasks() can't be called since the loop terminates
    if (blockedForTasks) { this.unpauseFromTasks(); }
    this.inProgress = false;
    this.isFinished = true;
    this.isExpediting = false;
    // clip has essentially "reset" by finishing rewinding, so reset segments as well.
    // (this is before resolving fullyFinished in case operations that await it attempt to schedule new tasks) 
    if (this.direction === 'backward') {
      this.taskReschedulingQueue = {};
      this.resetPhaseSegments('both');
    }
    this.fullyFinished.resolve(this);
  }

  async finish(): Promise<void> {
    if (this.isExpediting) { return; }
    this.isExpediting = true;

    // If animation not in progress yet, just play(). From there,
    // isExpediting will be in effect
    if (!this.inProgress) {
      this.play();
    }
    // If animation is already in progress, expedite its current segment.
    // From there, it will continue expediting using isExpediting
    else {
      super.finish();
      for (let i = 0; i < this.nestedAnimations.length; ++i) {
        this.nestedAnimations[i].finish();
      }
    }

    await this.fullyFinished.promise;
  }

  pause(): void {
    super.pause();
    for (let i = 0; i < this.nestedAnimations.length; ++i) {
      this.nestedAnimations[i].pause();
    }
  }

  updatePlaybackRate(playbackRate: number): void {
    super.updatePlaybackRate(playbackRate);
    for (let i = 0; i < this.nestedAnimations.length; ++i) {
      this.nestedAnimations[i].updatePlaybackRate(playbackRate);
    }
  }

  cancel(): void {
    super.cancel();
    for (let i = 0; i < this.nestedAnimations.length; ++i) {
      this.nestedAnimations[i].cancel();
    }
  }

  /** @internal */
  updateDuration(duration: number, reschedule: boolean = true): void {
    super.updateDuration(duration);
    for (let i = 0; i < this.nestedAnimations.length; ++i) {
      this.nestedAnimations[i].updateDuration(duration);
    }

    if (!reschedule) { return; }

    this.phaseEndSegmentsForwardCache[0].endDelay = -duration;
    this.phaseEndSegmentsBackwardCache[0].endDelay = -duration;

    const taskIds = Object.keys(this.taskReschedulingQueue);
    for (let i = 0; i < taskIds.length; ++i) {
      this.rescheduleTask(this.taskReschedulingQueue[taskIds[i]]);
    }

    const promiseIds = Object.keys(this.resolverReschedulingQueue);
    for (let i = 0; i < promiseIds.length; ++i) {
      this.rescheduleResolver(this.resolverReschedulingQueue[promiseIds[i]]);
    }
  }

  // accepts a time to wait for (converted to an endDelay) and returns a Promise that is resolved at that time
  scheduleResolver(
    direction: 'forward' | 'backward',
    phase: 'delayPhase' | 'activePhase' | 'endDelayPhase' | 'whole',
    timePosition: number | 'beginning' | 'end' | `${number}%`,
    schedulingOptions: {
      /**@internal*/forIntegrity?: boolean;
      /**@internal*/previousId?: string;
      /**@internal*/previousResolver?: (value: void | PromiseLike<void>) => void;
      label?: string;
    } = {}
  ): PromiseWithId<void> {
    const id = schedulingOptions.forIntegrity ? '' : (schedulingOptions.previousId ?? generateId());
    const withResolversObj = Promise.withResolvers<void>() as unknown as {
      promise: PromiseWithId<void>;
      resolve: (value: void | PromiseLike<void>) => void;
    };
    const promise = withResolversObj.promise;
    const resolve = schedulingOptions.previousResolver ?? withResolversObj.resolve;
    // (no need to do anything special with the promise in the former case because we know the promise will not be used anywhere)

    // if the animation is already finished in the given direction, resolve immediately
    if (this.isFinished && this.direction === direction) { resolve(); }

    else if (this.durationPending && !String(timePosition).match(RELATIVE_TIME_POSITION_REGEX)) {
      throw this.errorGenerator(
        CustomErrorClasses.EarlySchedulingError,
        [detab`The new promise requested for time position "${timePosition}" could not be scheduled because\
          the duration of the clip is not yet known. A clip whose length is set with a rate rather than a duration\
          can only schedule promises using a relative 'timePosition' value (such as {timePosition: "20%"} or {timePosition: "end"})\
          before the duration is known. The duration of a rate-based clip is only known while in one of these 3 states:\
          1) The clip is currently playing; 2) The clip has finished playing and is waiting to be rewound' 3) The clip is\
          currently rewinding.`]
      );
    }

    const [
      phaseSegments, initialArrIndex, phaseDuration, phaseEndDelayOffset, phaseTimePosition
    ] = WebchalkAnimation.computePhaseEmplacement(this, direction, phase, timePosition);

    // check for out of bounds time positions
    if (phaseTimePosition < 0) {
      if (typeof timePosition === 'number') {
        throw this.errorGenerator(
          CustomErrorClasses.InvalidPhasePositionError,
          [detab`Negative 'timePosition' ${timePosition} for phase "${phase}" resulted in invalid time ${phaseTimePosition}\
            (i.e., ${phaseDuration} - ${Math.abs(timePosition)}).\
            Negative 'timePosition' values must result in the range [0, ${phaseDuration}] for this "${phase}".`]
        );
      }
      else {
        throw this.errorGenerator(
          CustomErrorClasses.InvalidPhasePositionError,
          [`Invalid timePosition value ${timePosition}. Percentages must be in the range [0%, 100%].`]
        );
      }
    }
    if (phaseTimePosition > phaseDuration) {
      if (typeof timePosition === 'number') {
        throw this.errorGenerator(
          CustomErrorClasses.InvalidPhasePositionError,
          [detab`Invalid positive timePosition value ${timePosition} for phase "${phase}".\
          Positive time position values must be in the range [0, ${phaseDuration}] for this "${phase}".`]
        );
      }
      else {
        throw this.errorGenerator(
          CustomErrorClasses.InvalidPhasePositionError,
          [`Invalid timePosition value ${timePosition}. Percentages must be in the range [0%, 100%].`]
        );
      }
    }

    const resolverContainer: ScheduledResolverContainer = {id, resolver: resolve, origTimePosition: timePosition, label: schedulingOptions.label ?? '<blank label>'};
    const { forIntegrity = false } = schedulingOptions;

    const endDelay: number = phaseEndDelayOffset + phaseTimePosition;
    const numSegments = phaseSegments.length;
    
    for (let i = initialArrIndex; i < numSegments; ++i) {
      const currSegment = phaseSegments[i];
      
      // if new endDelay is less than curr, new segment should be inserted to list
      if (endDelay < currSegment.endDelay) {
        // but if the proceeding segment has already been reached in the loop, then the awaited time has already passed
        if (currSegment.header.activated) { resolve(); }
        else {
          // insert new segment to list
          const newSegment: PhaseSegment = {
            endDelay, mainCallbacks: [], resolverContainers: [], taskParts: [], integrityOuterResolvers: [], integrityAsyncCbs: [], skipEndDelayUpdation: phaseTimePosition === 0, header: {phase, timePosition, direction},
          }
          if (forIntegrity) { newSegment.integrityOuterResolvers.push(resolve); }
          // TODO: if necessary, incorporate hideFromUI
          else {
            newSegment.resolverContainers.push(resolverContainer);
            const sisterSegment = (direction === 'forward' ? this.phaseSegmentsBackward : this.phaseSegmentsForward)
              .find(potentialSis => newSegment.endDelay === -(potentialSis.endDelay + this.animClip.getTiming('duration')));
            if (sisterSegment?.phaseSegmentEl) {
              newSegment.phaseSegmentEl = sisterSegment.phaseSegmentEl;
              newSegment.phaseSegmentEl.readSegment(newSegment, direction);
            }
            else {
              newSegment.phaseSegmentEl = new WebchalkPhaseSegmentElement();
              newSegment.phaseSegmentEl?.readSegment(newSegment, direction);
              this.animClip.webchalkClipEl?.insertPhaseSegmentEls([newSegment.phaseSegmentEl]);
            }
          }
          phaseSegments.splice(i, 0, newSegment);
        }
        break;
      }

      // if new endDelay matches that of curr, the resolver should be called with others in the same segment
      else if (endDelay === currSegment.endDelay) {
        // but if curr segment is already completed, the awaited time has already passed
        if (currSegment.header.completed) { resolve(); }
        else {
          // add resolver to current segment
          if (forIntegrity) { currSegment.integrityOuterResolvers.push(resolve); }
          else {
            currSegment.resolverContainers.push(resolverContainer);
            if (!currSegment.phaseSegmentEl) {
              const sisterSegment = (direction === 'forward' ? this.phaseSegmentsBackward : this.phaseSegmentsForward)
                .find(segment => currSegment.endDelay === -(segment.endDelay + this.animClip.getTiming('duration')));
              if (sisterSegment?.phaseSegmentEl) {
                currSegment.phaseSegmentEl = sisterSegment.phaseSegmentEl;
                currSegment.phaseSegmentEl.readSegment(currSegment, direction);
              }
              else {
                currSegment.phaseSegmentEl = new WebchalkPhaseSegmentElement();
                currSegment.phaseSegmentEl.readSegment(currSegment, direction);
                this.animClip.webchalkClipEl?.insertPhaseSegmentEls([currSegment.phaseSegmentEl]);
              }
            }
          }
        }
        break;
      }
    }

    promise.id = id;

    if (!forIntegrity && typeof timePosition === 'string' && timePosition.match(RELATIVE_TIME_POSITION_REGEX)) {
      this.queueResolverForRescheduling(direction, phase, resolverContainer);
    }

    return promise;
  }

  // TODO: rename to TimeGate instead of Promise
  unscheduleResolver<T extends Parameters<AnimClip['unscheduleResolver']>>(promiseId: T[0]): (value: void | PromiseLike<void>) => void {
    let resolverContainer: PhaseSegment['resolverContainers'][number] | undefined = undefined;

    // find segment containing the promise with matching id, then remove resolver
    for (let i = 0; i < this.phaseSegmentsForward.length; ++i) {
      const { resolverContainers } = this.phaseSegmentsForward[i];
      for (let j = 0; j < resolverContainers.length; ++j) {
        const currResolverContainer = resolverContainers[j];
        if (currResolverContainer.id === promiseId) {
          const segment = this.phaseSegmentsForward[i];
          [resolverContainer] = resolverContainers.splice(j, 1);
          --this.numPromisesForward;

          // if removing the resolver causes segment to be empty, cut the segment
          if (WebchalkAnimation.isEmptySegment(segment)) {
            this.phaseSegmentsForward.splice(i, 1);
          }
          segment.phaseSegmentEl?.update('forward');
          break;
        }
      }
    }

    if (!resolverContainer) {
      for (let i = 0; i < this.phaseSegmentsBackward.length; ++i) {
        const { resolverContainers } = this.phaseSegmentsBackward[i];
        for (let j = 0; j < resolverContainers.length; ++j) {
          const currResolverContainer = resolverContainers[j];
          if (currResolverContainer.id === promiseId) {
            const segment = this.phaseSegmentsBackward[i];
            [resolverContainer] = resolverContainers.splice(j, 1);
            --this.numPromisesBackward;

            // if removing the resolver causes segment to be empty, cut the segment
            if (WebchalkAnimation.isEmptySegment(segment)) {
              this.phaseSegmentsBackward.splice(i, 1);
            }
            segment.phaseSegmentEl?.update('backward');
            break;
          }
        }
      }
    }

    if (!(resolverContainer)) {
      throw this.errorGenerator(RangeError, [`Resolver with id "${promiseId}" was not found within this clip's scheduled promises.`]);
    }

    delete this.resolverReschedulingQueue[promiseId];

    return resolverContainer.resolver as (value: void | PromiseLike<void>) => void;
  }

  private rescheduleResolver(
    promiseReschedulingData: WebchalkAnimation['resolverReschedulingQueue'][string]
  ) {
    const {
      reschedulingArgs
    } = promiseReschedulingData;

    this.unscheduleResolver(reschedulingArgs[2].id);

    const direction = reschedulingArgs[0];
    const phase = reschedulingArgs[1];
    const {origTimePosition: timePosition, label, id: previousId, resolver: previousResolver} = reschedulingArgs[2];

    this.scheduleResolver(direction, phase, timePosition, {label, previousId, previousResolver: previousResolver as (value: void | PromiseLike<void>) => void});
    reschedulingArgs[0] === 'forward' ? (++this.numPromisesForward) : (++this.numPromisesBackward);
  }

  private queueResolverForRescheduling<T extends Parameters<WebchalkAnimation['scheduleResolver']>>(
    direction: 'forward' | 'backward',
    phase: T[1],
    resolverContainer: ScheduledResolverContainer
  ): void {
    const id = resolverContainer.id;
    this.resolverReschedulingQueue[id] = { reschedulingArgs: [direction, phase, resolverContainer] };
  }

  private renewScheduledResolver<T extends Parameters<AnimClip['scheduleResolver']>>(
    direction: T[0],
    phase: T[1],
    resolverContainer: ScheduledResolverContainer,
  ): void {
    this.scheduleResolver(direction, phase, resolverContainer.origTimePosition, {label: resolverContainer.label});
    if (typeof resolverContainer.origTimePosition === 'string' && resolverContainer.origTimePosition.includes('%')) {
      this.queueResolverForRescheduling(direction, phase, resolverContainer);
    }
  }

  /**@internal*/
  addIntegrityAsyncCb<T extends Parameters<AnimClip['addIntegrityAsyncCb']>>(
    phase: T[0],
    timePosition: T[1],
    task: T[2]
  ): void {
    const id = generateId();
    if (task.onPlay) { this.addAwaiteds('forward', phase, timePosition, 'integrityAsyncCb', {id, callback: task.onPlay, frequencyLimit: 1, initialFrequencyLimit: 1, origTimePosition: timePosition}) };
    if (task.onRewind) { this.addAwaiteds('backward', phase, timePosition, 'integrityAsyncCb', {id, callback: task.onRewind, frequencyLimit: 1, initialFrequencyLimit: 1, origTimePosition: timePosition}) };
  }

  scheduleTask<T extends Parameters<AnimClip['scheduleTask']>>(
    phase: T[0],
    timePosition: T[1],
    task: T[2],
    schedulingOptions: T[3] = {}
  ): string {
    const id = generateId();

    const {
      frequencyLimit = Infinity,
      description = '<blank task description>'
    } = schedulingOptions;

    if (!task.onPlay && !task.onRewind) {
      throw this.errorGenerator(TypeError, [`Invalid task object. Must contain at least one of 'onPlay' and 'onRewind' properties.`])
    }

    if (frequencyLimit === 0) { return id; }
    
    let onPlayTaskPart: ScheduledTaskPart | undefined;
    let onRewindTaskPart: ScheduledTaskPart | undefined;

    const options: {sharedPhaseSegmentEl?: WebchalkPhaseSegmentElement} = {};
    if (task.onPlay) {
      onPlayTaskPart = {id, callback: task.onPlay, frequencyLimit, initialFrequencyLimit: frequencyLimit, origTimePosition: timePosition, description};
      this.addAwaiteds('forward', phase, timePosition, 'task', onPlayTaskPart, options);
    }
    if (task.onRewind) {
      onRewindTaskPart = {id, callback: task.onRewind, frequencyLimit, initialFrequencyLimit: frequencyLimit, origTimePosition: timePosition, description};
      this.addAwaiteds('backward', phase, timePosition, 'task', onRewindTaskPart, options);
    }

    options.sharedPhaseSegmentEl?.update('both');

    if (onPlayTaskPart) { ++this.numTaskPartsForward; }
    if (onRewindTaskPart) { ++this.numTaskPartsBackward; }

    if (typeof timePosition === 'string' && timePosition.match(RELATIVE_TIME_POSITION_REGEX)) {
      if (onPlayTaskPart) { this.queueForRescheduling('forward', phase, onPlayTaskPart); }
      if (onRewindTaskPart) { this.queueForRescheduling('backward', phase, onRewindTaskPart); }
    }

    return id;
  }

  unscheduleTask<T extends Parameters<AnimClip['unscheduleTask']>>(taskId: T[0]): ScheduledTask {
    let taskF: PhaseSegment['taskParts'][number] | undefined = undefined;
    let taskB: PhaseSegment['taskParts'][number] | undefined = undefined;

    // find segment containing the task with matching id, then remove task
    for (let i = 0; i < this.phaseSegmentsForward.length; ++i) {
      const tasks = this.phaseSegmentsForward[i].taskParts;
      for (let j = 0; j < tasks.length; ++j) {
        const task = tasks[j];
        if (task.id === taskId) {
          const segment = this.phaseSegmentsForward[i];
          [taskF] = tasks.splice(j, 1);
          --this.numTaskPartsForward;

          // if removing the task causes segment to be empty, cut the segment
          if (WebchalkAnimation.isEmptySegment(segment)) {
            this.phaseSegmentsForward.splice(i, 1);
          }
          segment.phaseSegmentEl?.update('forward');
          break;
        }
      }
    }

    for (let i = 0; i < this.phaseSegmentsBackward.length; ++i) {
      const tasks = this.phaseSegmentsBackward[i].taskParts;
      for (let j = 0; j < tasks.length; ++j) {
        const task = tasks[j];
        if (task.id === taskId) {
          const segment = this.phaseSegmentsBackward[i];
          [taskB] = tasks.splice(j, 1);
          --this.numTaskPartsBackward;

          // if removing the task causes segment to be empty, cut the segment
          if (WebchalkAnimation.isEmptySegment(this.phaseSegmentsBackward[i])) {
            this.phaseSegmentsBackward.splice(i, 1);
          }
          segment.phaseSegmentEl?.update('backward');
          break;
        }
      }
    }

    if (!(taskF || taskB)) {
      throw this.errorGenerator(RangeError, [`Task with id "${taskId}" was not found within this clip's scheduled tasks.`]);
    }

    delete this.taskReschedulingQueue[taskId];

    return { ...(taskF ? {onPlay: taskF.callback} : {}), ...(taskB ? {onRewind: taskB.callback} : {}) };
  }

  private rescheduleTask(
    taskReschedulingData: WebchalkAnimation['taskReschedulingQueue'][string]
  ) {
    const {
      onPlayReschedulingArgs,
      onRewindReschedulingArgs,
    } = taskReschedulingData;

    const eitherArgs = (onPlayReschedulingArgs || onRewindReschedulingArgs)!;

    this.unscheduleTask(eitherArgs[2].id);

    const timePosition = eitherArgs[2].origTimePosition;
    const phase = eitherArgs[1];

    const options: {sharedPhaseSegmentEl?: WebchalkPhaseSegmentElement} = {};
    if (onPlayReschedulingArgs) {
      const taskPart = onPlayReschedulingArgs[2];
      this.addAwaiteds('forward', phase, timePosition, 'task', taskPart, options);
      ++this.numTaskPartsForward;
    }
    if (onRewindReschedulingArgs) {
      const taskPart = onRewindReschedulingArgs[2];
      this.addAwaiteds('backward', phase, timePosition, 'task', taskPart, options);
      ++this.numTaskPartsBackward;
    }

    options.sharedPhaseSegmentEl?.update('both');
  }

  private queueForRescheduling<T extends Parameters<WebchalkAnimation['scheduleTask']>>(
    direction: 'forward' | 'backward',
    phase: T[0],
    taskPart: ScheduledTaskPart
  ): void {

    const id = taskPart.id;
    if (!this.taskReschedulingQueue[id]) { this.taskReschedulingQueue[id] = {}; }

    switch(direction) {
      case "forward":
        this.taskReschedulingQueue[id].onPlayReschedulingArgs = [direction, phase, taskPart];
        break;
      case "backward":
        this.taskReschedulingQueue[id].onRewindReschedulingArgs = [direction, phase, taskPart];
        break;
      default:
        throw this.errorGenerator(RangeError, [`Invalid direction "${direction}". Must be "forward" or "backward".`]);
    }
  }

  private renewScheduledTaskPart<T extends Parameters<AnimClip['scheduleTask']>>(
    direction: 'forward' | 'backward',
    phase: T[0],
    taskPart: ScheduledTaskPart,
    phaseSegmentEl?: WebchalkPhaseSegmentElement
  ): void {
    const sharedObj = {sharedPhaseSegmentEl: phaseSegmentEl};
    this.addAwaiteds(direction, phase, taskPart.origTimePosition, 'task', taskPart, sharedObj);
    sharedObj.sharedPhaseSegmentEl?.update(direction);

    if (typeof taskPart.origTimePosition === 'string' && taskPart.origTimePosition.includes('%')) {
      this.queueForRescheduling(direction, phase, taskPart);
    }
  }

  private addAwaiteds(
    direction: 'forward' | 'backward',
    phase: 'delayPhase' | 'activePhase' | 'endDelayPhase' | 'whole',
    timePosition: number | 'beginning' | 'end' | `${number}%`,
    awaitedType: 'integrityAsyncCb' | 'task',
    taskPart: ScheduledTaskPart,
    options: {sharedPhaseSegmentEl?: WebchalkPhaseSegmentElement} = {}
  ): void {
    if (taskPart.frequencyLimit !== Infinity 
      && (Number.parseInt(String(taskPart.frequencyLimit)) !== taskPart.frequencyLimit || taskPart.frequencyLimit < 0)
    ) {
      throw this.errorGenerator(RangeError, [`Invalid 'frequencyLimit' ${taskPart.frequencyLimit}. Must be either an integer at least 0 or Infinity.`]);
    }
    
    if (this.durationPending && !String(timePosition).match(RELATIVE_TIME_POSITION_REGEX)) {
      throw this.errorGenerator(
        CustomErrorClasses.EarlySchedulingError,
        [detab`The new ${awaitedType} set for time position "${timePosition}" could not be scheduled because\
          the duration of the clip is not yet known. A clip whose length is set with a rate rather than a duration\
          can only schedule ${awaitedType}s using a relative 'timePosition' value (such as {timePosition: "20%"} or {timePosition: "end"})\
          before the duration is known. The duration of a rate-based clip is only known while in one of these 3 states:\
          1) The clip is currently playing; 2) The clip has finished playing and is waiting to be rewound' 3) The clip is\
          currently rewinding. Once the clip finishes rewinding, the duration becomes unknown again until the clip plays again.`]
      );
    }

    if (
      // if the task includes 'onPlay' callback...
      direction === 'forward' && (
        // ... and the animation is currently rewinding, throw error
        this.inProgress && this.direction === 'backward'
        // ... and the animation has finished playing, throw error
        || this.isFinished && this.direction === 'forward'
      )
    ) {
      throw this.errorGenerator(
        CustomErrorClasses.LateSchedulingError,
        [detab`The new ${awaitedType} set for time position "${timePosition}" could not be scheduled because\
          it provided an 'onPlay' callback and the clip ${this.inProgress ? 'was rewinding' : 'has finished playing'}.\
          New ${awaitedType}s with 'onPlay' can only be scheduled while the clip is still 1) waiting to be played or 2)\
          currently playing.`]
      );
    }
    
    const [
      phaseSegments, initialArrIndex, phaseDuration, phaseEndDelayOffset, phaseTimePosition
    ] = WebchalkAnimation.computePhaseEmplacement(this, direction, phase, timePosition);

    // check for out of bounds time positions
    if (phaseTimePosition < 0) {
      if (typeof timePosition === 'number') {
        throw this.errorGenerator(
          CustomErrorClasses.InvalidPhasePositionError,
          [detab`Negative 'timePosition' ${timePosition} for phase "${phase}" resulted in invalid time ${phaseTimePosition}\
            (i.e., ${phaseDuration} - ${Math.abs(timePosition)}).\
            Negative 'timePosition' values must result in the range [0, ${phaseDuration}] for this "${phase}".`]
        );
      }
      else {
        throw this.errorGenerator(
          CustomErrorClasses.InvalidPhasePositionError,
          [`Invalid timePosition value ${timePosition}. Percentages must be in the range [0%, 100%].`]
        );
      }
    }
    if (phaseTimePosition > phaseDuration) {
      if (typeof timePosition === 'number') {
        throw this.errorGenerator(
          CustomErrorClasses.InvalidPhasePositionError,
          [`Invalid timePosition value ${timePosition} for phase "${phase}". Must be in the range [0, ${phaseDuration}] for this "${phase}".`]
        );
      }
      else {
        throw this.errorGenerator(
          CustomErrorClasses.InvalidPhasePositionError,
          [`Invalid timePosition value ${timePosition}. Percentages must be in the range [0%, 100%].`]
        );
      }
    }

    const endDelay: number = phaseEndDelayOffset + phaseTimePosition;
    const numSegments = phaseSegments.length;
    
    for (let i = initialArrIndex; i < numSegments; ++i) {
      const currSegment = phaseSegments[i];
      
      // if new endDelay is less than curr, new segment should be inserted to list
      if (endDelay < currSegment.endDelay) {
        // but if the proceeding segment has already been reached in the loop, then the time at which the new promises
        // should be awaited has already passed
        if (currSegment.header.activated) {
          throw this.errorGenerator(
            CustomErrorClasses.LateSchedulingError,
            [detab`The new ${awaitedType} set for time position "${timePosition}" could not be scheduled because\
              the time "${timePosition}" has already passed.`]
          );
        }

        // insert new segment to list
        const newSegment: PhaseSegment = {
          endDelay,
          mainCallbacks: [],
          resolverContainers: [],
          taskParts: awaitedType === 'task' ? [taskPart] : [],
          integrityOuterResolvers: [],
          integrityAsyncCbs: awaitedType === 'integrityAsyncCb' ? [taskPart.callback] : [],
          skipEndDelayUpdation: phaseTimePosition === 0,
          header: {phase, timePosition, direction},
        }

        // If this is a task that wants to be shown in the UI...
        if (awaitedType === 'task' && !taskPart.hideFromUI) {
          // If there is an existing phase segment element in the directional counterpart segment, use it.
          const sisterSegment = (direction === 'forward' ? this.phaseSegmentsBackward : this.phaseSegmentsForward)
            .find(segment => newSegment.endDelay === -(segment.endDelay + this.animClip.getTiming('duration')));
          if (sisterSegment?.phaseSegmentEl) {
            newSegment.phaseSegmentEl = sisterSegment.phaseSegmentEl;
            options.sharedPhaseSegmentEl = newSegment.phaseSegmentEl;
          }
          // If there is an existing phase segment element passed in from the same call to scheduleTask(), use it.
          else if (options.sharedPhaseSegmentEl) {
            newSegment.phaseSegmentEl = options.sharedPhaseSegmentEl;
          }
          // Otherwise, create a new phase segment element.
          else {
            newSegment.phaseSegmentEl = new WebchalkPhaseSegmentElement();
            options.sharedPhaseSegmentEl = newSegment.phaseSegmentEl;
          }
          newSegment.phaseSegmentEl.readSegment(newSegment, direction);
          if (!newSegment.phaseSegmentEl.isConnected) {
            this.animClip.webchalkClipEl?.insertPhaseSegmentEls([newSegment.phaseSegmentEl]);
          }
        }
        phaseSegments.splice(i, 0, newSegment);
        return;
      }

      // if new endDelay matches that of curr, the promises should be awaited with others in the same segment
      if (endDelay === currSegment.endDelay) {
        // but if curr segment is already completed, the time to await the promises has already passed
        if (currSegment.header.completed) {
          throw this.errorGenerator(
            CustomErrorClasses.LateSchedulingError,
            [detab`The new ${awaitedType} set for time position "${timePosition}" could not be scheduled because\
              the time "${timePosition}" has already passed.`]
          );
        }

        // add promises to current segment
        if (awaitedType === 'integrityAsyncCb') { currSegment.integrityAsyncCbs.push(taskPart.callback); }
        else {
          currSegment.taskParts.push(taskPart);
          if (!taskPart.hideFromUI && !currSegment.phaseSegmentEl) {
            const sisterSegment = (direction === 'forward' ? this.phaseSegmentsBackward : this.phaseSegmentsForward)
              .find(segment => currSegment.endDelay === -(segment.endDelay + this.animClip.getTiming('duration')));
            if (sisterSegment?.phaseSegmentEl) {
              currSegment.phaseSegmentEl = sisterSegment.phaseSegmentEl;
              options.sharedPhaseSegmentEl = currSegment.phaseSegmentEl; // might not be necessary
            }
            else if (options.sharedPhaseSegmentEl) {
              currSegment.phaseSegmentEl = options.sharedPhaseSegmentEl;
            }
            else {
              currSegment.phaseSegmentEl = new WebchalkPhaseSegmentElement();
              options.sharedPhaseSegmentEl = currSegment.phaseSegmentEl; // might not be necessary
            }
            currSegment.phaseSegmentEl.readSegment(currSegment, direction);
            if (!currSegment.phaseSegmentEl.isConnected) {
              this.animClip.webchalkClipEl?.insertPhaseSegmentEls([currSegment.phaseSegmentEl]);
            }
          }
        }
        return;
      }
    }

    // note: this error should never be reached
    throw this.errorGenerator(Error, ['Something very wrong occurred for addAwaited() to not be completed.']);
  }

  private static computePhaseEmplacement(
    anim: WebchalkAnimation,
    direction: 'forward' | 'backward',
    phase: 'delayPhase' | 'activePhase' | 'endDelayPhase' | 'whole',
    timePosition: number | 'beginning' | 'end' | `${number}%`,
    ): [segments: PhaseSegment[], initialArrIndex: number, phaseDuration: number, phaseEndDelayOffset: number, phaseTimePosition: number] {
    // compute initial index, phase duration, and endDelay offset based on phase and arguments
    let phaseSegments: PhaseSegment[];
    let phaseEndSegmentsCache: PhaseEndSegmentsCache;
    switch(direction) {
      case "forward":
        [phaseSegments, phaseEndSegmentsCache] = [anim.phaseSegmentsForward, anim.phaseEndSegmentsForwardCache];
        break;
      case "backward":
        [phaseSegments, phaseEndSegmentsCache] = [anim.phaseSegmentsBackward, anim.phaseEndSegmentsBackwardCache];
        break;
      default:
        throw anim.errorGenerator(
          CustomErrorClasses.InvalidPhasePositionError,
          [`Invalid direction "${direction}". Must be "forward" or "backward".`]
        );
    }
    const effect = anim.getEffect(direction);
    const { duration, delay } = effect.getTiming() as {duration: number, delay: number};
    let initialArrIndex: number; // skips to first entry of a given phase
    let phaseEndDelayOffset: number; // applies negative (or 0) endDelay to get beginning of phase
    let phaseDuration: number; // duration of phase specified in argument
    let quasiPhase: typeof phase = phase; // opposite of phase (for backward direction)
    switch(phase) {
      case "delayPhase": quasiPhase = 'endDelayPhase'; break;
      case "endDelayPhase": quasiPhase = 'delayPhase'; break;
    }

    switch(direction === 'forward' ? phase : quasiPhase) {
      case "delayPhase":
        initialArrIndex = 0;
        phaseDuration = delay;
        phaseEndDelayOffset = -(delay + duration);
        break;
      case "activePhase":
        initialArrIndex = phaseSegments.indexOf(phaseEndSegmentsCache[0]) + 1;
        phaseDuration = duration;
        phaseEndDelayOffset = -duration;
        break;
      case "endDelayPhase":
        initialArrIndex = phaseSegments.indexOf(phaseEndSegmentsCache[1]) + 1;
        phaseDuration = effect.getTiming().endDelay as number;
        phaseEndDelayOffset = 0;
        break;
      case "whole":
        initialArrIndex = 0;
        phaseDuration = delay + duration + (effect.getTiming().endDelay as number);
        phaseEndDelayOffset = -(delay + duration);
        break;
      default:
        throw anim.errorGenerator(
          CustomErrorClasses.InvalidPhasePositionError,
          [`Invalid phase "${phase}". Must be "delayPhase", "activePhase", "endDelayPhase", or "whole".`]
        );
    }

    // COMPUTE TIME POSITION RELATIVE TO PHASE
    let initialPhaseTimePos: number;

    // if TBA_DURATION, just hard code so all TBA_DURATION tasks get placed in the same segment
    if (duration === TBA_DURATION) {
      initialPhaseTimePos = duration / 2;
    }
    else {
      if (timePosition === 'beginning') { initialPhaseTimePos = 0; }
      else if (timePosition === 'end') {  initialPhaseTimePos = phaseDuration; }
      else if (typeof timePosition === 'number') { initialPhaseTimePos = timePosition; }
      // if timePosition is in percent format, convert to correct time value based on phase
      else {
        const match = timePosition.toString().match(PERCENTAGE_REGEX);
        // note: this error should never occur
        if (!match) {
          throw anim.errorGenerator(CustomErrorClasses.InvalidPhasePositionError, [`Invalid timePosition value "${timePosition}".`]);
        }
  
        initialPhaseTimePos = phaseDuration * (Number(match[1]) / 100);
      }
    }

    // wrap any negative time values to count backwards from end of phase
    const wrappedPhaseTimePos = initialPhaseTimePos < 0 ? phaseDuration + initialPhaseTimePos : initialPhaseTimePos;
    // time positions should refer to the same point in a phase, regardless of the current direction
    const phaseTimePosition: number = direction === 'forward' ? wrappedPhaseTimePos : phaseDuration - wrappedPhaseTimePos;

    return [phaseSegments, initialArrIndex, phaseDuration, phaseEndDelayOffset, phaseTimePosition];
  }

  private resetPhaseSegments(direction: 'forward' | 'backward' | 'both'): void {
    const resetForwardPhases = () => {
      const { delay, duration, endDelay } = this.forwardEffect.getTiming() as {[prop: string]: number};

      // set up segments for...
      // ->end of delay phase->,
      // ->end of active phase->,
      // ->end of endDelay phase->
      const freshPhaseSegmentsForward: PhaseSegment[] = [
        { endDelay: -duration, mainCallbacks: [() => this.onDelayFinish()], resolverContainers: [], taskParts: [], integrityOuterResolvers: [], integrityAsyncCbs: [], skipEndDelayUpdation: delay === 0, header: {phase: 'delayPhase', timePosition: 'end', cached: true, direction: 'forward'} },
        { endDelay: 0, mainCallbacks: [() => this.onActiveFinish()], resolverContainers: [], taskParts: [], integrityOuterResolvers: [], integrityAsyncCbs: [], skipEndDelayUpdation: false, header: {phase: 'activePhase', timePosition: 'end', cached: true, direction: 'forward'} },
        { endDelay: endDelay, mainCallbacks: [() => this.onEndDelayFinish()], resolverContainers: [], taskParts: [], integrityOuterResolvers: [], integrityAsyncCbs: [], skipEndDelayUpdation: endDelay === 0, header: {phase: 'endDelayPhase',  timePosition: 'end', cached: true, direction: 'forward'} },
      ];

      // for tasks that are scheduled to reoccur, schedule them again
      const tempSegments = this.phaseSegmentsForward;
      this.phaseSegmentsForward = freshPhaseSegmentsForward;
      this.phaseEndSegmentsForwardCache = [...freshPhaseSegmentsForward] as PhaseEndSegmentsCache;
      for (const segment of tempSegments) {
        segment.phaseSegmentEl?.remove();
        for (const taskPart of segment.taskParts) {
          if (taskPart.frequencyLimit > 0) {
            this.renewScheduledTaskPart('forward', segment.header.phase!, taskPart);
          }
          else {
            --this.numTaskPartsForward;
          }
        }
      }
    };

    // NEXT REMINDER: Reimplement so that delayPhase for backwards direction corresponds to endDelayPhase
    // TODO: Determine if the NEXT REMINDER above has been correctly fulfilled
    const resetBackwardPhases = () => {
      const { delay, duration, endDelay } = this.backwardEffect.getTiming() as {[prop: string]: number};

      // set up segments for...
      // <-beginning of endDelay phase<- (which corresponds to the end of the rewinding frames' delay),
      // <-beginning of active phase<- (which corresponds to the end of the rewinding frames' active),
      // <-beginning of delay phase<- (which corresponds to the end of the rewinding frames' end delay)
      const freshPhaseSegmentsBackward: PhaseSegment[] = [
        { endDelay: -duration, mainCallbacks: [ () => this.onDelayFinish() ], resolverContainers: [], taskParts: [], integrityOuterResolvers: [], integrityAsyncCbs: [], skipEndDelayUpdation: delay === 0, header: {phase: 'endDelayPhase', timePosition: 'beginning', cached: true, direction: 'backward'} },
        { endDelay: 0, mainCallbacks: [ () => this.onActiveFinish() ], resolverContainers: [], taskParts: [], integrityOuterResolvers: [], integrityAsyncCbs: [], skipEndDelayUpdation: false, header: {phase: 'activePhase', timePosition: 'beginning', cached: true, direction: 'backward'} },
        { endDelay: endDelay, mainCallbacks: [ () => this.onEndDelayFinish() ], resolverContainers: [], taskParts: [], integrityOuterResolvers: [], integrityAsyncCbs: [], skipEndDelayUpdation: endDelay === 0, header: {phase: 'delayPhase', timePosition: 'beginning', cached: true, direction: 'backward'} },
      ];
      
      const tempSegments = this.phaseSegmentsBackward;
      this.phaseSegmentsBackward = freshPhaseSegmentsBackward;
      this.phaseEndSegmentsBackwardCache = [...freshPhaseSegmentsBackward] as PhaseEndSegmentsCache;
      for (const segment of tempSegments) {
        segment.phaseSegmentEl?.remove();
        for (const taskPart of segment.taskParts) {
          if (taskPart.frequencyLimit > 0) {
            this.renewScheduledTaskPart('backward', segment.header.phase!, taskPart);
          }
          else {
            --this.numTaskPartsBackward;
          }
        }
      }
    };

    switch(direction) {
      case "forward":
        resetForwardPhases();
        break;
      case "backward":
        resetBackwardPhases();
        break;
      case "both":
        resetForwardPhases();
        resetBackwardPhases();
        break;
      default:
        throw this.errorGenerator(
          RangeError,
          [`Invalid direction "${direction}" used in resetPromises(). Must be "forward", "backward", or "both."`]
        );
    }
  }

  private static isEmptySegment(phaseSegment: PhaseSegment): boolean {
    return [phaseSegment.mainCallbacks, phaseSegment.resolverContainers, phaseSegment.taskParts, phaseSegment.integrityOuterResolvers, phaseSegment.integrityAsyncCbs].every(arr => arr.length === 0);
  }
}

export class NestedWebchalkAnimation extends WebchalkAnimationBase {
  leader: WebchalkAnimation | undefined;

  async play(): Promise<void> {
    super.play();
    await this.leader?.fullyFinished;
  }
}
