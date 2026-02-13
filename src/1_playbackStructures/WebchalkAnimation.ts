import { AnimClip, ScheduledTask } from "./AnimationClip";
import { CustomErrorClasses, ClipErrorGenerator } from "../4_utils/errors";
import { DOMElement, Keyframes } from "../4_utils/interfaces";
import { useEasing } from "../2_animationEffects/easing";
import { detab, generateId, TBA_DURATION } from "../4_utils/helpers";

abstract class WebchalkAnimationBase extends Animation {
  forwardEffect: KeyframeEffect;
  backwardEffect: KeyframeEffect;
  target: DOMElement;
  direction: 'forward' | 'backward' = 'forward';
  protected getEffect(direction: 'forward' | 'backward'): KeyframeEffect { return direction === 'forward' ? this.forwardEffect : this.backwardEffect; }
  protected inProgress = false;

  constructor(target: Element | null | undefined, keyframeOptions: KeyframeEffectOptions, protected errorGenerator: ClipErrorGenerator) {
    super();

    if (!target) { throw this.errorGenerator(CustomErrorClasses.InvalidElementError, `Animation target must not be null or undefined`); }
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
   * @param direction - direction in which the animation will go when playback is initiated
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
        throw this.errorGenerator(RangeError, `Invalid direction "${direction}" passed to setDirection(). Must be "forward" or "backward".`);
    }
  }

  /** @internal */
  updateDuration(duration: number): void {
    this.effect?.updateTiming({duration, endDelay: -duration});
    this.forwardEffect.updateTiming({duration, endDelay: -duration});
    this.backwardEffect.updateTiming({duration});
  }
}

type PhaseSegment = [
  endDelay: number,
  callbacks: Function[],
  taskParts: ScheduledTaskPart[],
  integrityblocks: {id: string, callback: Function}[],
  // true when awaiting delay/endDelay periods while the awaited delay/endDelay duration is 0
  skipEndDelayUpdation: boolean,
  header: Partial<{
    completed: boolean;
    activated: boolean;
    phase: 'delayPhase' | 'activePhase' | 'endDelayPhase' | 'whole';
    timePosition: number | 'beginning' | 'end' | `${number}%`;
  }>,
];

type PhaseEndSegmentsCache = [delayPhaseEnd: PhaseSegment, activePhaseEnd: PhaseSegment, endDelayPhaseEnd: PhaseSegment];

type ScheduledTaskPart = {id: string; callback: Function; frequencyLimit: number; origTimePosition: Parameters<AnimClip['scheduleTask']>[1]};

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
  private phaseSegmentsForward: PhaseSegment[] = [];
  private phaseEndSegmentsForwardCache: PhaseEndSegmentsCache;
  private phaseSegmentsBackward: PhaseSegment[] = [];
  private phaseEndSegmentsBackwardCache: PhaseEndSegmentsCache;

  private taskReschedulingQueue: {
    [id: string]: {
      onPlayReschedulingArgs?: Parameters<WebchalkAnimation['renewScheduledTaskPart']>;
      onRewindReschedulingArgs?: Parameters<WebchalkAnimation['renewScheduledTaskPart']>;
    }
  } = {};

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

  constructor(target: Element | null | undefined, keyframeOptions: KeyframeEffectOptions, protected errorGenerator: ClipErrorGenerator) {
    super(target, keyframeOptions, errorGenerator);

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
      const [ endDelay, callbacks, tasks, integrityblocks, skipEndDelayUpdation, header ]: PhaseSegment = segment;
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
        // This allows outside operations like generatePromise() to push more callbacks to the queue...
        // ... before the next loop iteration (this makes up for not having await super.finished)
        await Promise.resolve();
      }
      header.completed = true;

      // Await any blockers for the completion of this phase
      if (tasks.length > 0) {
        this.pauseForTasks();
        blockedForTasks = true;
        // For any functions, replace the entry with the return value (a promise)
        // If animation is "rewinding", tasks should be processed in reverse order...
        // ... to ensure that side-effects from tasks are stable
        await Promise.all(
          (this.direction === 'forward' ? tasks : tasks.toReversed())
            .map(rBlock => rBlock.callback())
        );
      }
      if (integrityblocks.length > 0) {
        // for any functions, replace the entry with the return value (a promise)
        await Promise.all(integrityblocks.map(iBlock => iBlock.callback()));
      }
      // Call all callbacks that awaited the completion of this phase
      for (const callback of callbacks) { callback(); }

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
  updateDuration(duration: number): void {
    super.updateDuration(duration);
    for (let i = 0; i < this.nestedAnimations.length; ++i) {
      this.nestedAnimations[i].updateDuration(duration);
    }
    this.phaseEndSegmentsForwardCache[0][0] = -duration;
    this.phaseEndSegmentsBackwardCache[0][0] = -duration;

    const taskIds = Object.keys(this.taskReschedulingQueue);
    for (let i = 0; i < taskIds.length; ++i) {
      this.rescheduleTask(this.taskReschedulingQueue[taskIds[i]]);
    }
  }

  // accepts a time to wait for (converted to an endDelay) and returns a Promise that is resolved at that time
  generatePromise<T extends Parameters<AnimClip['generatePromise']>>(direction: T[0], phase: T[1], timePosition: T[2]): Promise<void> {
    return new Promise(resolve => {
      // if the animation is already finished in the given direction, resolve immediately
      if (this.isFinished && this.direction === direction) { resolve(); return; }

      const [
        phaseSegments, initialArrIndex, phaseDuration, phaseEndDelayOffset, phaseTimePosition
      ] = WebchalkAnimation.computePhaseEmplacement(this, direction, phase, timePosition);

      // check for out of bounds time positions
      if (phaseTimePosition < 0) {
        if (typeof timePosition === 'number') {
          throw this.errorGenerator(
            CustomErrorClasses.InvalidPhasePositionError,
            detab`Negative 'timePosition' ${timePosition} for phase "${phase}" resulted in invalid time ${phaseTimePosition}\
              (i.e., ${phaseDuration} - ${Math.abs(timePosition)}).\
              Negative 'timePosition' values must result in the range [0, ${phaseDuration}] for this "${phase}".`
          );
        }
        else {
          throw this.errorGenerator(
            CustomErrorClasses.InvalidPhasePositionError,
            `Invalid timePosition value ${timePosition}. Percentages must be in the range [0%, 100%].`
          );
        }
      }
      if (phaseTimePosition > phaseDuration) {
        if (typeof timePosition === 'number') {
          throw this.errorGenerator(
            CustomErrorClasses.InvalidPhasePositionError,
            `Invalid positive timePosition value ${timePosition} for phase "${phase}". Positive time position values must be in the range [0, ${phaseDuration}] for this "${phase}".`
          );
        }
        else {
          throw this.errorGenerator(
            CustomErrorClasses.InvalidPhasePositionError,
            `Invalid timePosition value ${timePosition}. Percentages must be in the range [0%, 100%].`
          );
        }
      }

      const endDelay: number = phaseEndDelayOffset + phaseTimePosition;
      const numSegments = phaseSegments.length;
      
      for (let i = initialArrIndex; i < numSegments; ++i) {
        const currSegment = phaseSegments[i];
        
        // if new endDelay is less than curr, new segment should be inserted to list
        if (endDelay < currSegment[0]) {
          // but if the proceeding segment has already been reached in the loop, then the awaited time has already passed
          if (currSegment[5].activated) { resolve(); return; }

          // insert new segment to list
          phaseSegments.splice(i, 0, [ endDelay, [resolve], [], [], phaseTimePosition === 0, {} ]);
          return;
        }

        // if new endDelay matches that of curr, the resolver should be called with others in the same segment
        if (endDelay === currSegment[0]) {
          // but if curr segment is already completed, the awaited time has already passed
          if (currSegment[5].completed) { resolve(); return; }

          // add resolver to current segment
          currSegment[1].push(resolve);
          return;
        }
      }

      // note: this error should never be reached
      throw this.errorGenerator(Error, 'Something very wrong occurred for addAwaited() to not be completed.');
    });
  }

  /**@internal*/
  addIntegrityblock<T extends Parameters<AnimClip['addIntegrityblock']>>(
    phase: T[0],
    timePosition: T[1],
    task: T[2]
  ): void {
    const id = generateId();
    if (task.onPlay) { this.addAwaiteds('forward', phase, timePosition, 'integrityblock', {id, callback: task.onPlay, frequencyLimit: 1, origTimePosition: timePosition}) };
    if (task.onRewind) { this.addAwaiteds('backward', phase, timePosition, 'integrityblock', {id, callback: task.onRewind, frequencyLimit: 1, origTimePosition: timePosition}) };
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
    } = schedulingOptions;

    if (!task.onPlay && !task.onRewind) {
      throw this.errorGenerator(TypeError, `Invalid task object. Must contain at least one of 'onPlay' and 'onRewind' properties.`)
    }

    if (frequencyLimit === 0) { return id; }
    
    let onPlayTaskPart: ScheduledTaskPart | undefined;
    let onRewindTaskPart: ScheduledTaskPart | undefined;

    if (task.onPlay) {
      onPlayTaskPart = {id, callback: task.onPlay, frequencyLimit, origTimePosition: timePosition};
      this.addAwaiteds('forward', phase, timePosition, 'task', onPlayTaskPart);
    }
    if (task.onRewind) {
      onRewindTaskPart = {id, callback: task.onRewind, frequencyLimit, origTimePosition: timePosition};
      this.addAwaiteds('backward', phase, timePosition, 'task', onRewindTaskPart);
    }

    if (typeof timePosition === 'string' && timePosition.includes('%')) {
      if (onPlayTaskPart) { this.queueForRescheduling('forward', phase, onPlayTaskPart); }
      if (onRewindTaskPart) { this.queueForRescheduling('backward', phase, onRewindTaskPart); }
    }

    return id;
  }

  private renewScheduledTaskPart<T extends Parameters<AnimClip['scheduleTask']>>(
    direction: 'forward' | 'backward',
    phase: T[0],
    taskPart: ScheduledTaskPart
  ): void {
    this.addAwaiteds(direction, phase, taskPart.origTimePosition, 'task', taskPart);
    if (typeof taskPart.origTimePosition === 'string' && taskPart.origTimePosition.includes('%')) {
      this.queueForRescheduling(direction, phase, taskPart);
    }
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

    if (onPlayReschedulingArgs) {
      const taskPart = onPlayReschedulingArgs[2];
      this.addAwaiteds('forward', phase, timePosition, 'task', taskPart);
    }
    if (onRewindReschedulingArgs) {
      const taskPart = onRewindReschedulingArgs[2];
      this.addAwaiteds('backward', phase, timePosition, 'task', taskPart);
    }
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
        throw this.errorGenerator(RangeError, `Invalid direction "${direction}". Must be "forward" or "backward".`);
    }
  }

  unscheduleTask<T extends Parameters<AnimClip['unscheduleTask']>>(taskId: T[0]): ScheduledTask {
    let taskF: PhaseSegment[2][number] | undefined = undefined;
    let taskB: PhaseSegment[2][number] | undefined = undefined;

    // find segment containing the task with matching id, then remove task
    for (let i = 0; i < this.phaseSegmentsForward.length; ++i) {
      const tasks = this.phaseSegmentsForward[i][2];
      for (let j = 0; j < tasks.length; ++j) {
        const task = tasks[j];
        if (task.id === taskId) {
          [taskF] = tasks.splice(j, 1);

          // if removing the task causes segment to be empty, cut the segment
          if (WebchalkAnimation.isEmptySegment(this.phaseSegmentsForward[i])) {
            this.phaseSegmentsForward.splice(i, 1);
          }
          break;
        }
      }
    }

    for (let i = 0; i < this.phaseSegmentsBackward.length; ++i) {
      const tasks = this.phaseSegmentsBackward[i][2];
      for (let j = 0; j < tasks.length; ++j) {
        const task = tasks[j];
        if (task.id === taskId) {
          [taskB] = tasks.splice(j, 1);

          // if removing the task causes segment to be empty, cut the segment
          if (WebchalkAnimation.isEmptySegment(this.phaseSegmentsBackward[i])) {
            this.phaseSegmentsBackward.splice(i, 1);
          }
          break;
        }
      }
    }

    if (!taskF || !taskB) {
      throw this.errorGenerator(RangeError, `Task with id "${taskId}" was not found within this clip's scheduled tasks.`);
    }

    delete this.taskReschedulingQueue[taskId];

    return { onPlay: taskF.callback, onRewind: taskB.callback };
  }

  private addAwaiteds(
    direction: 'forward' | 'backward',
    phase: 'delayPhase' | 'activePhase' | 'endDelayPhase' | 'whole',
    timePosition: number | 'beginning' | 'end' | `${number}%`,
    awaitedType: 'integrityblock' | 'task',
    taskPart: ScheduledTaskPart
  ): void {
    if (taskPart.frequencyLimit < 0) {
      throw this.errorGenerator(RangeError, `Invalid 'frequencyLimit' ${taskPart.frequencyLimit}. Must be at least 0.`);
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
        detab`The new ${awaitedType} set for time position "${timePosition}" could not be scheduled because\
          it provided an 'onPlay' callback and the clip ${this.inProgress ? 'was rewinding' : 'has finished playing'}.\
          New ${awaitedType}s can only be scheduled while the clip is still 1) waiting to be played or 2) currently playing.`
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
          detab`Negative 'timePosition' ${timePosition} for phase "${phase}" resulted in invalid time ${phaseTimePosition}\
            (i.e., ${phaseDuration} - ${Math.abs(timePosition)}).\
            Negative 'timePosition' values must result in the range [0, ${phaseDuration}] for this "${phase}".`
        );
      }
      else {
        throw this.errorGenerator(
          CustomErrorClasses.InvalidPhasePositionError,
          `Invalid timePosition value ${timePosition}. Percentages must be in the range [0%, 100%].`
        );
      }
    }
    if (phaseTimePosition > phaseDuration) {
      if (typeof timePosition === 'number') {
        throw this.errorGenerator(
          CustomErrorClasses.InvalidPhasePositionError,
          `Invalid timePosition value ${timePosition} for phase "${phase}". Must be in the range [0, ${phaseDuration}] for this "${phase}".`
        );
      }
      else {
        throw this.errorGenerator(
          CustomErrorClasses.InvalidPhasePositionError,
          `Invalid timePosition value ${timePosition}. Percentages must be in the range [0%, 100%].`
        );
      }
    }

    const endDelay: number = phaseEndDelayOffset + phaseTimePosition;
    const numSegments = phaseSegments.length;
    
    for (let i = initialArrIndex; i < numSegments; ++i) {
      const currSegment = phaseSegments[i];
      
      // if new endDelay is less than curr, new segment should be inserted to list
      if (endDelay < currSegment[0]) {
        // but if the proceeding segment has already been reached in the loop, then the time at which the new promises
        // should be awaited has already passed
        if (currSegment[5].activated) {
          throw this.errorGenerator(
            CustomErrorClasses.LateSchedulingError,
            detab`The new ${awaitedType}s set for time position "${timePosition}" could not be scheduled because\
              the time "${timePosition}" has already passed.`
          );
        }

        // insert new segment to list
        phaseSegments.splice(i, 0, [
          endDelay,
          [],
          (awaitedType === 'task' ? [taskPart] : []),
          (awaitedType === 'integrityblock' ? [taskPart] : []),
          phaseTimePosition === 0,
          {phase, timePosition}
        ]);
        return;
      }

      // if new endDelay matches that of curr, the promises should be awaited with others in the same segment
      if (endDelay === currSegment[0]) {
        // but if curr segment is already completed, the time to await the promises has already passed
        if (currSegment[5].completed) {
          throw this.errorGenerator(
            CustomErrorClasses.LateSchedulingError,
            detab`The new ${awaitedType}s set for time position "${timePosition}" could not be scheduled because\
              the time "${timePosition}" has already passed.`
          );
        }

        // add promises to current segment
        currSegment[awaitedType === 'task' ? 2 : 3].push(taskPart);
        return;
      }
    }

    // note: this error should never be reached
    throw this.errorGenerator(Error, 'Something very wrong occurred for addAwaited() to not be completed.');
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
          `Invalid direction "${direction}". Must be "forward" or "backward".`
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
          `Invalid phase "${phase}". Must be "delayPhase", "activePhase", "endDelayPhase", or "whole".`
        );
    }

    // COMPUTE TIME POSITION RELATIVE TO PHASE
    let initialPhaseTimePos: number;

    if (timePosition === 'beginning') { initialPhaseTimePos = 0; }
    else if (timePosition === 'end') {  initialPhaseTimePos = phaseDuration; }
    else if (typeof timePosition === 'number') { initialPhaseTimePos = timePosition; }
    else {
      // if timePosition is in percent format, convert to correct time value based on phase
      const match = timePosition.toString().match(/^(-?\d+(\.\d*)?)%$/);
      // note: this error should never occur
      if (!match) {
        throw anim.errorGenerator(CustomErrorClasses.InvalidPhasePositionError, `Invalid timePosition value "${timePosition}".`);
      }

      initialPhaseTimePos = phaseDuration * (Number(match[1]) / 100);
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
        [ -duration, [() => this.onDelayFinish()], [], [], delay === 0, {phase: 'delayPhase', timePosition: 'end'} ],
        [ 0, [() => this.onActiveFinish()], [], [], false, {phase: 'activePhase', timePosition: 'end'} ],
        [ endDelay, [() => this.onEndDelayFinish()], [], [], endDelay === 0, {phase: 'endDelayPhase',  timePosition: 'end'} ],
      ];

      // for tasks that are scheduled to reoccur, schedule them again
      const tempSegments = this.phaseSegmentsForward;
      this.phaseSegmentsForward = freshPhaseSegmentsForward;
      this.phaseEndSegmentsForwardCache = [...freshPhaseSegmentsForward] as PhaseEndSegmentsCache;
      for (const segment of tempSegments) {
        for (const taskPart of segment[2]) {
          if (--taskPart.frequencyLimit > 0) {
            this.renewScheduledTaskPart('forward', segment[5].phase!, taskPart);
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
        [ -duration, [() => this.onDelayFinish()], [], [], delay === 0, {phase: 'endDelayPhase', timePosition: 'beginning'} ],
        [ 0, [() => this.onActiveFinish()], [], [], false, {phase: 'activePhase', timePosition: 'beginning'} ],
        [ endDelay, [() => this.onEndDelayFinish()], [], [], endDelay === 0, {phase: 'delayPhase', timePosition: 'beginning'} ],
      ];
      
      const tempSegments = this.phaseSegmentsBackward;
      this.phaseSegmentsBackward = freshPhaseSegmentsBackward;
      this.phaseEndSegmentsBackwardCache = [...freshPhaseSegmentsBackward] as PhaseEndSegmentsCache;
      for (const segment of tempSegments) {
        for (const taskPart of segment[2]) {
          if (--taskPart.frequencyLimit > 0) {
            this.renewScheduledTaskPart('backward', segment[5].phase!, taskPart);
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
          `Invalid direction "${direction}" used in resetPromises(). Must be "forward", "backward", or "both."`
        );
    }
  }

  private static isEmptySegment(phaseSegment: PhaseSegment): boolean {
    return [phaseSegment[1], phaseSegment[2], phaseSegment[3]].every(arr => arr.length === 0);
  }
}

export class NestedWebchalkAnimation extends WebchalkAnimationBase {
  leader: WebchalkAnimation | undefined;

  async play(): Promise<void> {
    super.play();
    await this.leader?.fullyFinished;
  }
}
