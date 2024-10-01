import { AnimClip } from "./AnimClip";
import { CustomErrors, ClipErrorGenerator } from "../4_utils/errors";
import { Keyframes } from "../4_utils/interfaces";

type Segment = [
  endDelay: number,
  callbacks: ((...args: any[]) => void)[],
  roadblocks: (Promise<unknown> | (() => Promise<unknown>))[],
  integrityblocks: (Promise<unknown> | (() => Promise<unknown>))[],
  // true when awaiting delay/endDelay periods while the awaited delay/endDelay duration is 0
  skipEndDelayUpdation: boolean,
  header: Partial<{
    completed: boolean,
    activated: boolean,
  }>,
];

type SegmentsCache = [delayPhaseEnd: Segment, activePhaseEnd: Segment, endDelayPhaseEnd: Segment];

type FullyFinishedPromise = {
  promise: Promise<WebimatorAnimation>;
  resolve: (value: WebimatorAnimation | PromiseLike<WebimatorAnimation>) => void;
};

export class WebimatorAnimation extends Animation {
  direction: 'forward' | 'backward' = 'forward';
  private getEffect(direction: 'forward' | 'backward'): KeyframeEffect { return direction === 'forward' ? this.forwardEffect : this.backwardEffect; }
  private inProgress = false;
  private isFinished = false;
  // holds list of stopping points and resolvers to control segmentation of animation...
  // to help with Promises-based sequencing
  private segmentsForward: Segment[] = [];
  private segmentsForwardCache: SegmentsCache;
  private segmentsBackward: Segment[] = [];
  private segmentsBackwardCache: SegmentsCache;

  private isExpediting = false;
  private fullyFinished: FullyFinishedPromise = this.getNewFullyFinished();
  
  onDelayFinish: Function = () => {};
  onActiveFinish: Function = () => {};
  onEndDelayFinish: Function = () => {};
  // FIXME: The behavior for pausing for roadblocks while expedition is in act is undefined
  pauseForRoadblocks: Function = () => { throw new Error(`This should never be called before being defined by parent clip`); };
  unpauseFromRoadblocks: Function = () => { throw new Error(`This should never be called before being defined by parent clip`); };

  constructor(private forwardEffect: KeyframeEffect, private backwardEffect: KeyframeEffect, private errorGenerator: ClipErrorGenerator) {
    super();

    if (!this.forwardEffect.target) { throw this.errorGenerator(CustomErrors.InvalidElementError, `Animation target must not be null or undefined`); }
    if (this.forwardEffect.target !== backwardEffect.target) { this.errorGenerator(Error, `Forward and backward keyframe effects must target the same element`); }
    
    this.setDirection('forward');
    this.resetPhases('both');
    this.segmentsForwardCache = [...this.segmentsForward] as SegmentsCache;
    this.segmentsBackwardCache = [...this.segmentsBackward] as SegmentsCache;
  }
  
  setForwardFrames(frames: Keyframes): void {
    this.forwardEffect.setKeyframes(frames);
    (super.effect as KeyframeEffect).setKeyframes(frames);
    if (this.inProgress) {
      super.effect?.updateTiming({direction: 'normal'});
    }
  }

  setBackwardFrames(frames: Keyframes, backwardIsMirror?: boolean): void {
    this.backwardEffect.setKeyframes(frames);
    (super.effect as KeyframeEffect).setKeyframes(frames);
    if (backwardIsMirror) {
      const [direction, easing] = ['reverse' as PlaybackDirection, this.forwardEffect.getTiming().easing];
      this.backwardEffect.updateTiming({direction, easing});
      if (this.inProgress) {
        super.effect?.updateTiming({direction, easing});
      }
    }
  }

  setForwardAndBackwardFrames(forwardFrames: Keyframes, backwardFrames: Keyframes, backwardIsMirror?: boolean): void {
    this.setBackwardFrames(backwardFrames, backwardIsMirror);
    this.setForwardFrames(forwardFrames);
  }

  setDirection(direction: 'forward' | 'backward') {
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

  private getNewFullyFinished(): FullyFinishedPromise {
    const {resolve, promise} = Promise.withResolvers<WebimatorAnimation>();
    return {resolve, promise};
  }
  
  async play(): Promise<void> {
    // If animation is already in progress and is just paused, resume the animation directly.
    // Through AnimClip, the only time this can happen is when using AnimClip.unpause()
    if (super.playState === 'paused') {
      super.play();
      return;
    }
    
    // If play() is called while already playing, return.
    if (this.inProgress) { return; }
    this.inProgress = true;
    
    if (this.isFinished) {
      this.isFinished = false;
      this.fullyFinished = this.getNewFullyFinished();
      // If going forward, reset backward promises. If going backward, reset forward promises.
      this.resetPhases(this.direction === 'forward' ? 'backward' : 'forward');
    }

    super.play();
    // extra await allows additional pushes to queue before loop begins
    await Promise.resolve();

    const effect = super.effect!;
    const segments = this.direction === 'forward' ? this.segmentsForward : this.segmentsBackward;
    let roadblocked: boolean | null = null;
    // Traverse live array instead of static length since entries could be added mid-loop
    for (const segment of segments) {
      const [ endDelay, callbacks, roadblocks, integrityblocks, skipEndDelayUpdation, header ]: Segment = segment;
      header.activated = true;

      if (!skipEndDelayUpdation) {
        // Set animation to stop at a certain time using endDelay.
        effect.updateTiming({ endDelay });
        // if playback was paused from, resume playback
        if (roadblocked === true) {
          this.unpauseFromRoadblocks();
          roadblocked = false;
        }
        if (this.isExpediting) { super.finish(); }
        await super.finished;
      }
      else {
        // This allows outside operations like generateTimePromise() to push more callbacks to the queue...
        // before the next loop iteration (this makes up for not having await super.finished)
        await Promise.resolve();
      }
      header.completed = true;

      // Await any blockers for the completion of this phase
      if (roadblocks.length > 0) {
        this.pauseForRoadblocks();
        roadblocked = true;
        // for any functions, replace the entry with the return value (a promise)
        await Promise.all(roadblocks.map(rBlock => typeof rBlock === 'function' ? rBlock() : rBlock));
      }
      if (integrityblocks.length > 0) {
        // for any functions, replace the entry with the return value (a promise)
        await Promise.all(integrityblocks.map(iBlock => typeof iBlock === 'function' ? iBlock() : iBlock));
      }
      // Call all callbacks that awaited the completion of this phase
      for (const callback of callbacks) { callback(); }

      // extra await allows additional pushes to preempt next segment when they should
      await Promise.resolve();
    }
    
    this.inProgress = false;
    this.isFinished = true;
    this.isExpediting = false;
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
    }

    await this.fullyFinished.promise;
  }

  private resetPhases(direction: 'forward' | 'backward' | 'both'): void {
    const resetForwardPhases = () => {
      const { delay, duration, endDelay } = this.forwardEffect.getTiming() as {[prop: string]: number};
      const segmentsForward: Segment[] = [
        [ -duration, [() => this.onDelayFinish()], [], [], delay === 0, {} ],
        [ 0, [() => this.onActiveFinish()], [], [], false, {} ],
        [ endDelay, [() => this.onEndDelayFinish()], [], [], endDelay === 0, {} ],
      ];
      this.segmentsForward = segmentsForward;
      this.segmentsForwardCache = [...segmentsForward] as SegmentsCache;
    };

    // NEXT REMINDER: Reimplement so that delayPhase for backwards direction corresponds to endDelayPhase
    // TODO: Determine if the NEXT REMINDER above has been correctly fulfilled
    const resetBackwardPhases = () => {
      const { delay, duration, endDelay } = this.backwardEffect.getTiming() as {[prop: string]: number};
      const segmentsBackward: Segment[] = [
        [ -duration, [() => this.onDelayFinish()], [], [], delay === 0, {} ],
        [ 0, [() => this.onActiveFinish()], [], [], false, {} ],
        [ endDelay, [() => this.onEndDelayFinish()], [], [], endDelay === 0, {} ],
      ];
      this.segmentsBackward = segmentsBackward;
      this.segmentsBackwardCache = [...segmentsBackward] as SegmentsCache;
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
      default: throw this.errorGenerator(RangeError, `Invalid direction "${direction}" used in resetPromises(). Must be "forward", "backward", or "both."`);
    }
  }

  // accepts a time to wait for (converted to an endDelay) and returns a Promise that is resolved at that time
  generateTimePromise<T extends Parameters<AnimClip['generateTimePromise']>>(direction: T[0], phase: T[1], timePosition: T[2]): Promise<void> {
    return new Promise(resolve => {
      // if the animation is already finished in the given direction, resolve immediately
      if (this.isFinished && this.direction === direction) { resolve(); return; }

      const [segments, initialArrIndex, phaseDuration, phaseEndDelayOffset, phaseTimePosition] = WebimatorAnimation.computePhaseEmplacement(this, direction, phase, timePosition);

      // check for out of bounds time positions
      if (phaseTimePosition < 0) {
        if (typeof timePosition === 'number') { throw this.errorGenerator(CustomErrors.InvalidPhasePositionError, `Negative timePosition ${timePosition} for phase "${phase}" resulted in invalid time ${phaseTimePosition}. Must be in the range [0, ${phaseDuration}] for this "${phase}".`);}
        else { throw this.errorGenerator(CustomErrors.InvalidPhasePositionError, `Invalid timePosition value ${timePosition}. Percentages must be in the range [0%, 100%].`); }
      }
      if (phaseTimePosition > phaseDuration) {
        if (typeof timePosition === 'number') { throw this.errorGenerator(CustomErrors.InvalidPhasePositionError, `Invalid timePosition value ${timePosition} for phase "${phase}". Must be in the range [0, ${phaseDuration}] for this "${phase}".`); }
        else { throw this.errorGenerator(CustomErrors.InvalidPhasePositionError, `Invalid timePosition value ${timePosition}. Percentages must be in the range [0%, 100%].`); }
      }

      const endDelay: number = phaseEndDelayOffset + phaseTimePosition;
      const numSegments = segments.length;
      
      for (let i = initialArrIndex; i < numSegments; ++i) {
        const currSegment = segments[i];
        
        // if new endDelay is less than curr, new segment should be inserted to list
        if (endDelay < currSegment[0]) {
          // but if the proceeding segement has already been reached in the loop, then the awaited time has already passed
          if (currSegment[5].activated) { resolve(); return; }

          // insert new segment to list
          segments.splice(i, 0, [ endDelay, [resolve], [], [], phaseTimePosition === 0, {} ]);
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
      throw this.errorGenerator(Error, 'Something very wrong occured for addAwaited() to not be completed.');
    });
  }

  /**@internal*/
  addIntegrityblocks<T extends Parameters<AnimClip['addIntegrityblocks']>>(
    direction: T[0],
    phase: T[1],
    timePosition: T[2],
    promises: T[3]
  ): void {
    this.addAwaiteds(direction, phase, timePosition, 'integrityblock', promises);
  }

  addRoadblocks<T extends Parameters<AnimClip['addIntegrityblocks']>>(
    direction: T[0],
    phase: T[1],
    timePosition: T[2],
    promises: T[3]
  ): void {
    this.addAwaiteds(direction, phase, timePosition, 'roadblock', promises);
  }

  private addAwaiteds(
    direction: 'forward' | 'backward',
    phase: 'delayPhase' | 'activePhase' | 'endDelayPhase' | 'whole',
    timePosition: number | 'beginning' | 'end' | `${number}%`,
    awaitedType: 'integrityblock' | 'roadblock',
    promises: (Promise<unknown> | (() => Promise<unknown>))[]
  ): void {
    // if the animation is already finished in the given direction, do nothing
    if (this.isFinished && this.direction === direction) {
      console.warn(this.errorGenerator(Error, `The new ${awaitedType}s set for time position "${timePosition}" will not be used because the time "${timePosition}" has already passed.`).message);
      return;
    }
    
    const [segments, initialArrIndex, phaseDuration, phaseEndDelayOffset, phaseTimePosition] = WebimatorAnimation.computePhaseEmplacement(this, direction, phase, timePosition);

    // check for out of bounds time positions
    if (phaseTimePosition < 0) {
      if (typeof timePosition === 'number') { throw this.errorGenerator(CustomErrors.InvalidPhasePositionError, `Negative timePosition ${timePosition} for phase "${phase}" resulted in invalid time ${phaseTimePosition}. Must be in the range [0, ${phaseDuration}] for this "${phase}".`);}
      else { throw this.errorGenerator(CustomErrors.InvalidPhasePositionError, `Invalid timePosition value ${timePosition}. Percentages must be in the range [0%, 100%].`); }
    }
    if (phaseTimePosition > phaseDuration) {
      if (typeof timePosition === 'number') { throw this.errorGenerator(CustomErrors.InvalidPhasePositionError, `Invalid timePosition value ${timePosition} for phase "${phase}". Must be in the range [0, ${phaseDuration}] for this "${phase}".`); }
      else { throw this.errorGenerator(CustomErrors.InvalidPhasePositionError, `Invalid timePosition value ${timePosition}. Percentages must be in the range [0%, 100%].`); }
    }

    const endDelay: number = phaseEndDelayOffset + phaseTimePosition;
    const numSegments = segments.length;
    
    for (let i = initialArrIndex; i < numSegments; ++i) {
      const currSegment = segments[i];
      
      // if new endDelay is less than curr, new segment should be inserted to list
      if (endDelay < currSegment[0]) {
        // but if the proceeding segement has already been reached in the loop, then the time at which the new promises
        // should be awaited as already passed
        if (currSegment[5].activated) {
          console.warn(this.errorGenerator(Error, `The new ${awaitedType}s set for time position "${timePosition}" will not be used because the time "${timePosition}" has already passed.`).message);
          return;
        }

        // insert new segment to list
        segments.splice(i, 0, [
          endDelay,
          [],
          (awaitedType === 'roadblock' ? [...promises] : []),
          (awaitedType === 'integrityblock' ? [...promises] : []),
          phaseTimePosition === 0,
          {}
        ]);
        return;
      }

      // if new endDelay matches that of curr, the promises should be awaited with others in the same segment
      if (endDelay === currSegment[0]) {
        // but if curr segment is already completed, the time to await the promises has already passed
        if (currSegment[5].completed) {
          console.warn(this.errorGenerator(Error, `The new ${awaitedType}s set for time position "${timePosition}" will not be used because the time "${timePosition}" has already passed.`).message);
          return;
        }

        // add promises to current segment
        currSegment[awaitedType === 'roadblock' ? 2 : 3].push(...promises);
        return;
      }
    }

    // note: this error should never be reached
    throw this.errorGenerator(Error, 'Something very wrong occured for addAwaited() to not be completed.');
  }

  private static computePhaseEmplacement(
    anim: WebimatorAnimation,
    direction: 'forward' | 'backward',
    phase: 'delayPhase' | 'activePhase' | 'endDelayPhase' | 'whole',
    timePosition: number | 'beginning' | 'end' | `${number}%`,
    ): [segments: Segment[], initialArrIndex: number, phaseDuration: number, phaseEndDelayOffset: number, phaseTimePosition: number] {
    // compute initial index, phase duration, and endDelay offset based on phase and arguments
    let segments: Segment[];
    let segmentsCache: SegmentsCache;
    switch(direction) {
      case "forward":
        [segments, segmentsCache] = [anim.segmentsForward, anim.segmentsForwardCache];
        break;
      case "backward":
        [segments, segmentsCache] = [anim.segmentsBackward, anim.segmentsBackwardCache];
        break;
      default:
        throw anim.errorGenerator(CustomErrors.InvalidPhasePositionError, `Invalid direction "${direction}". Must be "forward" or "backward".`);
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
        initialArrIndex = segments.indexOf(segmentsCache[0]) + 1;
        phaseDuration = duration;
        phaseEndDelayOffset = -duration;
        break;
      case "endDelayPhase":
        initialArrIndex = segments.indexOf(segmentsCache[1]) + 1;
        phaseDuration = effect.getTiming().endDelay as number;
        phaseEndDelayOffset = 0;
        break;
      case "whole":
        initialArrIndex = 0;
        phaseDuration = delay + duration + (effect.getTiming().endDelay as number);
        phaseEndDelayOffset = -(delay + duration);
        break;
      default:
        throw anim.errorGenerator(CustomErrors.InvalidPhasePositionError, `Invalid phase "${phase}". Must be "delayPhase", "activePhase", "endDelayPhase", or "whole".`);
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
      if (!match) { throw anim.errorGenerator(CustomErrors.InvalidPhasePositionError, `Invalid timePosition value "${timePosition}".`); }

      initialPhaseTimePos = phaseDuration * (Number(match[1]) / 100);
    }

    // wrap any negative time values to count backwards from end of phase
    const wrappedPhaseTimePos = initialPhaseTimePos < 0 ? phaseDuration + initialPhaseTimePos : initialPhaseTimePos;
    // time positions should refer to the same point in a phase, regardless of the current direction
    const phaseTimePosition: number = direction === 'forward' ? wrappedPhaseTimePos : phaseDuration - wrappedPhaseTimePos;

    return [segments, initialArrIndex, phaseDuration, phaseEndDelayOffset, phaseTimePosition];
  }
}
