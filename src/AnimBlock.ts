import { AnimSequence } from "./AnimSequence";
import { AnimTimeline } from "./AnimTimeline";
import { GeneratorParams, AnimationBank, AnimationBankEntry } from "./WebFlik";
import { mergeArrays } from "./utils/helpers";
import { EasingString, useEasing } from "./utils/easing";
import { CustomErrors, BlockErrorGenerator, errorTip, generateError } from "./utils/errors";
import { AnimationCategory } from "./utils/interfaces";
import { WbfkConnector } from "./AnimBlockLine";

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

type SegmentsCache = [delayPhaseEnd: Segment, activePhaseEnd: Segment, endDelayPhaseEnd: Segment]

export class WebFlikAnimation extends Animation {
  private _timelineID: number = NaN;
  private _sequenceID: number = NaN;
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
  
  onDelayFinish: Function = () => {};
  onActiveFinish: Function = () => {};
  onEndDelayFinish: Function = () => {};
  // FIXME: The behavior for pausing for roadblocks while expedition is in act is undefined
  pauseForRoadblocks: Function = () => { throw new Error(`This should never be called before being defined by parent block`); };
  unpauseFromRoadblocks: Function = () => { throw new Error(`This should never be called before being defined by parent block`); };

  get timelineID(): number { return this._timelineID; }
  set timelineID(id: number) { this._timelineID = id; }
  get sequenceID(): number { return this._sequenceID; }
  set sequenceID(id: number) { this._sequenceID = id; }

  constructor(private forwardEffect: KeyframeEffect, private backwardEffect: KeyframeEffect, private errorGenerator: BlockErrorGenerator) {
    super();

    if (!this.forwardEffect.target) { throw this.errorGenerator(CustomErrors.InvalidElementError, `Animation target must not be null or undefined`); }
    if (this.forwardEffect.target !== backwardEffect.target) { this.errorGenerator(Error, `Forward and backward keyframe effects must target the same element`); }
    
    this.setDirection('forward');
    this.resetPhases('both');
    this.segmentsForwardCache = [...this.segmentsForward] as SegmentsCache;
    this.segmentsBackwardCache = [...this.segmentsBackward] as SegmentsCache;
  }
  
  setForwardFrames(frames: Keyframe[]): void {
    this.forwardEffect.setKeyframes(frames);
    (super.effect as KeyframeEffect).setKeyframes(frames);
    if (this.inProgress) {
      super.effect?.updateTiming({direction: 'normal'});
    }
  }

  setBackwardFrames(frames: Keyframe[], backwardIsMirror?: boolean): void {
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

  setForwardAndBackwardFrames(forwardFrames: Keyframe[], backwardFrames: Keyframe[], backwardIsMirror?: boolean): void {
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
  
  async play(): Promise<void> {
    // If animation is already in progress and is just paused, resume the animation directly.
    // Through AnimBlock, the only time this can happen is when using AnimBlock.unpause()
    if (super.playState === 'paused') {
      super.play();
      return;
    }
    
    // If play() is called while already playing, return.
    if (this.inProgress) { return; }
    this.inProgress = true;
    
    if (this.isFinished) {
      this.isFinished = false;
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
  }

  finish(): void;
  /**@internal*/finish(forced: boolean): void;
  finish(forced?: boolean): void {
    if (this.isExpediting) { return; }

    this.isExpediting = true;
    // Calling finish() on an unplayed animation should play and finish the animation
    // ONLY if the animation is about to go forwards
    if (!this.inProgress) {
      if (this.direction === 'forward' || forced) { this.play(); }
      else {
        this.isExpediting = false;
        return;
      }
    }
    // If animation is already in progress, expedite its current segment.
    // From there, it will continue expediting using isExpediting
    else { super.finish(); }
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
  generateTimePromise(
    direction: 'forward' | 'backward',
    phase: 'delayPhase' | 'activePhase' | 'endDelayPhase' | 'whole',
    timePosition: number | 'beginning' | 'end' | `${number}%`,
  ): Promise<void> {
    return new Promise(resolve => {
      // if the animation is already finished in the given direction, resolve immediately
      if (this.isFinished && this.direction === direction) { resolve(); return; }

      const [segments, initialArrIndex, phaseDuration, phaseEndDelayOffset, phaseTimePosition] = WebFlikAnimation.computePhaseEmplacement(this, direction, phase, timePosition);

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
  addIntegrityblocks(
    direction: 'forward' | 'backward',
    phase: 'delayPhase' | 'activePhase' | 'endDelayPhase' | 'whole',
    timePosition: number | 'beginning' | 'end' | `${number}%`,
    promises: (Promise<unknown> | (() => Promise<unknown>))[]
  ): void {
    this.addAwaiteds(direction, phase, timePosition, 'integrityblock', promises);
  }

  addRoadblocks(
    direction: 'forward' | 'backward',
    phase: 'delayPhase' | 'activePhase' | 'endDelayPhase' | 'whole',
    timePosition: number | 'beginning' | 'end' | `${number}%`,
    promises: (Promise<unknown> | (() => Promise<unknown>))[]
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
    
    const [segments, initialArrIndex, phaseDuration, phaseEndDelayOffset, phaseTimePosition] = WebFlikAnimation.computePhaseEmplacement(this, direction, phase, timePosition);

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
    anim: WebFlikAnimation,
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















type CustomKeyframeEffectOptions = {
  startsNextBlock: boolean;
  startsWithPrevious: boolean;
  commitsStyles: boolean;
  commitStylesForcefully: boolean; // attempt to unhide, commit, then re-hide
  composite: CompositeOperation;
  classesToAddOnFinish: string[];
  classesToAddOnStart: string[];
  classesToRemoveOnFinish: string[];
  classesToRemoveOnStart: string[];
  runGeneratorsNow: boolean;
}

type KeyframeTimingOptions = {
  duration: number;
  easing: EasingString;
  playbackRate: number;
  delay: number;
  endDelay: number;
}

export type AnimBlockConfig = KeyframeTimingOptions & CustomKeyframeEffectOptions;
export abstract class AnimBlock<TBankEntry extends AnimationBankEntry = AnimationBankEntry> implements AnimBlockConfig {
  private static id: number = 0;
  private static get emptyBankEntry() { return {generateKeyframes() { return [[], []]; }} as AnimationBankEntry; }
  protected abstract get defaultConfig(): Partial<AnimBlockConfig>;

  parentSequence?: AnimSequence;
  parentTimeline?: AnimTimeline;
  sequenceID: number = NaN; // set to match the id of the parent AnimSequence
  timelineID: number = NaN; // set to match the id of the parent AnimTimeline
  id: number;
  protected animation: WebFlikAnimation = {} as WebFlikAnimation;
  bankEntry: TBankEntry;
  animArgs: GeneratorParams<TBankEntry> = {} as GeneratorParams<TBankEntry>;
  domElem: Element;
  /**@internal*/keyframesGenerators?: {
    forwardGenerator: () => Keyframe[];
    backwardGenerator?: () => Keyframe[];
  };
  /**@internal*/rafMutators?: {
    forwardMutator: () => void;
    backwardMutator: () => void;
  };
  /**@internal */rafMutatorGenerators?: {
    forwardGenerator: () => () => void;
    backwardGenerator: () => () => void;
  }
  /**@internal*/get rafLoopsProgress(): number {
    const { progress, direction } = this.animation.effect!.getComputedTiming();
    // ?? 1 because during the active phase (the only time when raf runs), null progress means finished
    return direction === 'normal' ? (progress ?? 1) : 1 - (progress ?? 1);
  }
  
  /** @internal */startsNextBlock: boolean = false;
  /** @internal */startsWithPrevious: boolean = false;
  /** @internal */commitsStyles: boolean = true;
  /** @internal */commitStylesForcefully: boolean = false; // attempt to unhide, commit, then re-hide
  /** @internal */composite: CompositeOperation = 'replace';
  /** @internal */classesToAddOnFinish: string[] = [];
  /** @internal */classesToAddOnStart: string[] = [];
  /** @internal */classesToRemoveOnFinish: string[] = [];
  /** @internal */classesToRemoveOnStart: string[] = [];
  /** @internal */runGeneratorsNow: boolean = false;

  /** @internal */isAnimating = false;
  /** @internal */isPaused = false;
  /** @internal */duration: number = 500;
  /** @internal */delay: number = 0;
  /** @internal */endDelay: number = 0;
  /** @internal */easing: EasingString = 'linear';
  /** @internal */playbackRate: number = 1; // actually base playback rate
  /** @internal */get compoundedPlaybackRate(): number { return this.playbackRate * (this.parentSequence?.compoundedPlaybackRate ?? 1); }

  /** @internal */fullStartTime = NaN;
  /** @internal */get activeStartTime() { return (this.fullStartTime + this.delay) / this.playbackRate; }
  /** @internal */get activeFinishTime() { return( this.fullStartTime + this.delay + this.duration) / this.playbackRate; }
  /** @internal */get fullFinishTime() { return (this.fullStartTime + this.delay + this.duration + this.endDelay) / this.playbackRate; }

  getTiming() {
    return {
      startsNextBlock: this.startsNextBlock,
      startsWithPrevious: this.startsWithPrevious,
      composite: this.composite,
      duration: this.duration,
      delay: this.delay,
      endDelay: this.endDelay,
      easing: this.easing,
      basePlaybackRate: this.playbackRate,
      compoundedPlaybackRate: this.compoundedPlaybackRate,
      runGeneratorsNow: this.runGeneratorsNow
    } as const;
  }

  getEffects() {
    return {
      classes: {
        toAddOnFinish: this.classesToAddOnFinish,
        toAddOnStart: this.classesToAddOnStart,
        toRemoveOnFinish: this.classesToRemoveOnFinish,
        toRemoveOnStart: this.classesToRemoveOnStart,
      },
      composite: this.composite,
      commitsStyles: this.commitsStyles,
      commitsStylesForcefully: this.commitStylesForcefully,
    } as const;
  }

  getStatus() {
    return {
      animating: this.isAnimating,
      paused: this.isPaused,
    } as const;
  }

  /*****************************************************************************************************************************/
  /************************************        CONSTRUCTOR & INITIALIZERS        ***********************************************/
  /*****************************************************************************************************************************/
  /**@internal*/setID(idSeq: number, idTimeline: number): void {
    [this.sequenceID, this.timelineID] = [idSeq, idTimeline];
    [this.animation.sequenceID, this.animation.timelineID] = [idSeq, idTimeline];
  }

  constructor(domElem: Element | null | undefined, public animName: string, bank: AnimationBank, public category: AnimationCategory) {
    this.id = AnimBlock.id++;
    
    if ((category === 'Entrance' || category === 'Exit') && domElem instanceof WbfkConnector) {
      throw this.generateError(CustomErrors.InvalidElementError,
        `Connectors cannot be animated using ${category}().` +
        `${errorTip(`WbfkConnector elements cannot be animated using Entrance() or Exit() because many of the animations are not really applicable.` +
          ` Instead, any entrance or exit animations that make sense for connectors are defined in ConnectorEntrance() and ConnectorExit().`
        )}`,
        domElem
      );
    }
    
    if (!domElem) {
      throw this.generateError(CustomErrors.InvalidElementError, `Element must not be null or undefined.`);
    }
    
    // if empty bank was passed, generate a bank entry with a no-op animation
    if (Object.keys(bank).length === 0) { this.bankEntry = AnimBlock.emptyBankEntry as TBankEntry; }
    else if (!bank[animName]) { throw this.generateError(RangeError, `Invalid ${this.category} animation name "${animName}".`); }
    else { this.bankEntry = bank[animName] as TBankEntry; }

    this.domElem = domElem;
  }

  private mergeConfigs(userConfig: Partial<AnimBlockConfig>, bankEntryConfig: Partial<AnimBlockConfig>): Partial<AnimBlockConfig> {
    return {
      // subclass defaults take priority
      ...this.defaultConfig,

      // config defined in animation bank take priority
      ...bankEntryConfig,

      // custom config take priority
      ...userConfig,

      // mergeable properties
      classesToAddOnStart: mergeArrays(
        this.defaultConfig.classesToAddOnStart ?? [],
        bankEntryConfig.classesToAddOnStart ?? [],
        userConfig.classesToAddOnStart ?? [],
      ),

      classesToRemoveOnStart: mergeArrays(
        this.defaultConfig.classesToRemoveOnStart ?? [],
        bankEntryConfig.classesToRemoveOnStart ?? [],
        userConfig.classesToRemoveOnStart ?? [],
      ),

      classesToAddOnFinish: mergeArrays(
        this.defaultConfig.classesToAddOnFinish ?? [],
        bankEntryConfig.classesToAddOnFinish ?? [],
        userConfig.classesToAddOnFinish ?? [],
      ),

      classesToRemoveOnFinish: mergeArrays(
        this.defaultConfig.classesToRemoveOnFinish ?? [],
        bankEntryConfig.classesToRemoveOnFinish ?? [],
        userConfig.classesToRemoveOnFinish ?? [],
      ),
    };
  }

  /**@internal*/
  initialize(animArgs: GeneratorParams<TBankEntry>, userConfig: Partial<AnimBlockConfig> = {}): this {
    this.animArgs = animArgs;
    const mergedConfig = this.mergeConfigs(userConfig, this.bankEntry.config ?? {});
    Object.assign(this, mergedConfig);
    // cannot be exactly 0 because that causes some Animation-related bugs that can't be easily worked around
    this.duration = Math.max(this.duration as number, 0.01);

    // The fontFeatureSettings part handles a very strange Firefox bug that causes animations to run without any visual changes
    // when the animation is finished, setKeyframes() is called, and the animation continues after extending the runtime using
    // endDelay. It appears that the bug only occurs when the keyframes field contains nothing that will actually affect the
    // styling of the element (for example, adding {['fake-field']: 'bla'} will not fix it), but I obviously do not want to
    // add anything that will actually affect the style of the element, so I decided to use fontFeatureSettings and set it to
    // the default value to make it as unlikely as possible that anything the user does is obstructed.
    let [forwardFrames, backwardFrames]: [Keyframe[], Keyframe[] | undefined] = [[{fontFeatureSettings: 'normal'}], []];

    try {
      // generateKeyframes()
      if (this.bankEntry.generateKeyframes) {
        // if pregenerating, produce F and B frames now
        if (this.runGeneratorsNow) {
          [forwardFrames, backwardFrames] = this.bankEntry.generateKeyframes.call(this, ...animArgs);
        }
      }
      // generateKeyframeGenerators()
      else if (this.bankEntry.generateKeyframeGenerators) {
        const [forwardGenerator, backwardGenerator] = this.bankEntry.generateKeyframeGenerators.call(this, ...animArgs);
        this.keyframesGenerators = {forwardGenerator, backwardGenerator};
        // if pregenerating, produce F and B frames now
        if (this.runGeneratorsNow) {
          [forwardFrames, backwardFrames] = [forwardGenerator(), backwardGenerator?.()];
        }
      }
      // generateRafMutators()
      else if (this.bankEntry.generateRafMutators) {
        if (this.runGeneratorsNow) {
          const [forwardMutator, backwardMutator] = this.bankEntry.generateRafMutators.call(this, ...animArgs);
          this.rafMutators = { forwardMutator, backwardMutator };
        }
      }
      // generateRafMutatorGenerators()
      else {
        const [forwardGenerator, backwardGenerator] = this.bankEntry.generateRafMutatorGenerators.call(this, ...animArgs);
        this.rafMutatorGenerators = {forwardGenerator, backwardGenerator};
        if (this.runGeneratorsNow) {
          this.rafMutators = {forwardMutator: forwardGenerator(), backwardMutator: backwardGenerator()};
        }
      }
    }
    catch (err: unknown) { throw this.generateError(err as Error); }

    // playbackRate is not included because it is computed at the time of animating
    const keyframeOptions: KeyframeEffectOptions = {
      delay: this.delay,
      duration: this.duration,
      endDelay: this.endDelay,
      fill: 'forwards',
      easing: useEasing(this.easing),
      composite: this.composite,
    };

    this.animation = new WebFlikAnimation(
      new KeyframeEffect(
        this.domElem,
        forwardFrames,
        keyframeOptions,
      ),
      new KeyframeEffect(
        this.domElem,
        backwardFrames ?? [...forwardFrames],
        {
          ...keyframeOptions,
          // if no backward frames were specified, assume the reverse of the forward frames
          ...(backwardFrames ? {} : {direction: 'reverse'}),
          // if backward frames were specified, easing needs to be inverted
          ...(backwardFrames ? {easing: useEasing(this.easing, {inverted: true})} : {}),
          // delay & endDelay are of course swapped when we want to play in "reverse"
          delay: keyframeOptions.endDelay,
          endDelay: keyframeOptions.delay,
        },
      ),
      this.generateError
    );

    // TODO: Figure out how to disable any pausing/stepping functionality in the timeline while stopped for roadblocks
    this.animation.pauseForRoadblocks = () => {
      if (this.parentTimeline) { this.parentTimeline.pause(); }
      else if (this.parentSequence) { this.parentSequence.pause(); }
      else { this.pause(); }
    }
    this.animation.unpauseFromRoadblocks = () => {
      if (this.parentTimeline) { this.parentTimeline.unpause(); }
      else if (this.parentSequence) { this.parentSequence.unpause(); }
      else { this.unpause(); }
    }

    return this;
  }

  /*****************************************************************************************************************************/
  /********************************************        PLAYBACK        *********************************************************/
  /*****************************************************************************************************************************/
  play(): Promise<boolean>;
  /**@internal*/play(parentSequence: AnimSequence): Promise<boolean>;
  play(parentSequence?: AnimSequence): Promise<boolean> {
    // both parentSequence vars should either be undefined or the same AnimSequence
    if (this.parentSequence !== parentSequence) { this.throwChildPlaybackError('play'); }
    return this.animate('forward');
  }

  rewind(): Promise<boolean>;
  /**@internal*/rewind(parentSequence: AnimSequence): Promise<boolean>;
  rewind(parentSequence?: AnimSequence): Promise<boolean> {
    if (this.parentSequence !== parentSequence) { this.throwChildPlaybackError('rewind'); }
    return this.animate('backward');
  }

  pause(): void;
  /**@internal*/pause(parentSequence: AnimSequence): void;
  pause(parentSequence?: AnimSequence): void {
    if (this.parentSequence !== parentSequence) { this.throwChildPlaybackError('pause'); }
    if (this.isAnimating) {
      this.isPaused = true;
      this.animation.pause();
    }
  }

  unpause(): void;
  /**@internal*/unpause(parentSequence: AnimSequence): void;
  unpause(parentSequence?: AnimSequence): void {
    if (this.parentSequence !== parentSequence) { this.throwChildPlaybackError('unpause'); }
    if (this.isPaused) {
      this.isPaused = false;
      this.animation.play();
    }
  }

  finish(): void;
  /**@internal*/finish(parentSequence: AnimSequence): void;
  finish(parentSequence?: AnimSequence): void {
    if (this.parentSequence !== parentSequence) { this.throwChildPlaybackError('finish'); }
    // needs to play if not in progress
    if (this.isAnimating) {
      this.animation.finish();
    }
    else if (this.animation.direction === 'forward') {
      this.play(parentSequence!); // TODO: Find cleaner looking solution (perhaps simple if-else)
      this.animation.finish();
    }
  }

  get generateTimePromise() { return this.animation.generateTimePromise.bind(this.animation); }
  /**@internal*/get addIntegrityblocks() { return this.animation.addIntegrityblocks.bind(this.animation); }
  get addRoadblocks() { return this.animation.addRoadblocks.bind(this.animation); }
  // multiplies playback rate of parent timeline and sequence (if exist) with base playback rate
  /**@internal*/useCompoundedPlaybackRate() { this.animation.updatePlaybackRate(this.compoundedPlaybackRate); }

  /*****************************************************************************************************************************/
  /********************************************         ANIMATE         ********************************************************/
  /*****************************************************************************************************************************/
  protected _onStartForward(): void {};
  protected _onFinishForward(): void {};
  protected _onStartBackward(): void {};
  protected _onFinishBackward(): void {};

  protected async animate(direction: 'forward' | 'backward'): Promise<boolean> {
    if (this.isAnimating) { return false; }

    const animation = this.animation;
    animation.setDirection(direction);
    // If keyframes are generated here, clear the current frames to prevent interference with generators
    if (!this.runGeneratorsNow && direction === 'forward') {
      animation.setForwardAndBackwardFrames([{fontFeatureSettings: 'normal'}], []);
    }
    this.useCompoundedPlaybackRate();

    // used as resolve() and reject() in the eventually returned promise
    let resolver: (value: boolean | PromiseLike<boolean>) => void;
    let rejecter: (reason?: any) => void;
    
    this.isAnimating = true;
    const skipping = this.parentSequence?.skippingOn;
    if (skipping) { animation.finish(true); }
    else { animation.play(); }
    if (this.parentSequence?.isPaused) { animation.pause(); }
    
    // After delay phase, then apply class modifications and call onStart functions.
    // Additionally, generate keyframes on 'forward' if keyframe pregeneration is disabled.
    animation.onDelayFinish = () => {
      const bankEntry = this.bankEntry;

      switch(direction) {
        case 'forward':
          this.domElem.classList.add(...this.classesToAddOnStart);
          this.domElem.classList.remove(...this.classesToRemoveOnStart);
          this._onStartForward();
  
          // If keyframes were not pregenerated, generate them now
          // Keyframe generation is done here so that generations operations that rely on the side effects of class modifications and _onStartForward()...
          // ...can function properly.
          if (!this.runGeneratorsNow) {
            try {
              // if generateKeyframes() is the method of generation, generate f-ward and b-ward frames
              if (bankEntry.generateKeyframes) {
                let [forwardFrames, backwardFrames] = bankEntry.generateKeyframes.call(this, ...this.animArgs);
                animation.setForwardAndBackwardFrames(forwardFrames, backwardFrames ?? [...forwardFrames], backwardFrames ? false : true);
              }
              // if generateKeyframeGenerators() is the method of generation, generate f-ward frames
              else if (bankEntry.generateKeyframeGenerators) {
                animation.setForwardFrames(this.keyframesGenerators!.forwardGenerator());
              }
              // if generateRafMutators() is the method of generation, generate f-ward and b-ward mutators
              else if (bankEntry.generateRafMutators) {
                const [forwardMutator, backwardMutator] = bankEntry.generateRafMutators.call(this, ...this.animArgs);
                this.rafMutators = { forwardMutator, backwardMutator };
              }
              // if generateRafMutatorGenerators() is the method of generation, generate f-ward mutator
              else {
                const forwardMutator = this.rafMutatorGenerators!.forwardGenerator();
                this.rafMutators = { forwardMutator, backwardMutator(){} };
              }
            }
            catch (err: unknown) { throw this.generateError(err as Error); }
          }

          if (bankEntry.generateRafMutators || bankEntry.generateRafMutatorGenerators) { requestAnimationFrame(this.loop); }

          // sets it back to 'forwards' in case it was set to 'none' in a previous running
          animation.effect?.updateTiming({fill: 'forwards'});
          break;
  
        case 'backward':
          this._onStartBackward();
          this.domElem.classList.add(...this.classesToRemoveOnFinish);
          this.domElem.classList.remove(...this.classesToAddOnFinish);

          if (!this.runGeneratorsNow) {
            try {
              if (bankEntry.generateKeyframes) {
                // do nothing (backward keyframes would have already been set during forward direction)
              }
              else if (bankEntry.generateKeyframeGenerators) {
                const {forwardGenerator, backwardGenerator} = this.keyframesGenerators!;
                this.animation.setBackwardFrames(backwardGenerator?.() ?? forwardGenerator(), backwardGenerator ? false : true);
              }
              else if (bankEntry.generateRafMutators) {
                // do nothing (backward mutator would have already been set during forward direction)
              }
              else {
                const backwardMutator = this.rafMutatorGenerators!.backwardGenerator();
                this.rafMutators = { forwardMutator(){}, backwardMutator };
              }
            }
            catch (err: unknown) { throw this.generateError(err as Error); }
          }

          if (bankEntry.generateRafMutators || bankEntry.generateRafMutatorGenerators) { requestAnimationFrame(this.loop); }
          break;
  
        default:
          throw this.generateError(RangeError, `Invalid direction "${direction}" passed to animate(). Must be "forward" or "backward".`);
      }
    };

    // After active phase, then handle commit settings, apply class modifications, and call onFinish functions.
    animation.onActiveFinish = () => {
      // CHANGE NOTE: Move hidden class stuff here
      if (this.commitsStyles || this.commitStylesForcefully) {
        // Attempt to apply the styles to the element.
        try {
          animation.commitStyles();
          // ensures that accumulating effects are not stacked after commitStyles() (hopefully, new spec will prevent the need for this workaround)
          animation.effect?.updateTiming({ fill: 'none' });
        }
        // If commitStyles() fails, it's because the element is not rendered.
        catch (_) {
          // If forced commit is disabled, do not re-attempt to commit the styles; throw error instead.
          if (!this.commitStylesForcefully) {
            rejecter(this.generateError(CustomErrors.CommitStylesError,
              `Cannot commit animation styles while element is not rendered.` +
              ` To temporarily (instantly) override the hidden state, set the 'commitStylesForcefully' config option to true` +
              ` (however, if the element's ancestor is unrendered, this will still fail).` +
              `${errorTip(
                `Tip: By default, Exit()'s config option for 'exitType' is set to "display-none", which unrenders the element.` +
                ` To just make the element invisible, set 'exitType' to "visibility-hidden".` +
                `\nExample: Exit(elem, 'fade-out', [], {exitType: "visibility-hidden"})`
              )}`
            ));
          }

          // If forced commit is enabled, attempt to override the hidden state and apply the style.
          try {
            this.domElem.classList.add('wbfk-override-hidden'); // CHANGE NOTE: Use new hidden classes
            animation.commitStyles();
            animation.effect?.updateTiming({ fill: 'none' });
            this.domElem.classList.remove('wbfk-override-hidden');
          }
          // If this fails, then the element's parent is hidden. Do not attempt to remedy; throw error instead.
          catch (err) {
            rejecter(this.generateError(CustomErrors.CommitStylesError,
              `Failed to commit styles by overriding element's hidden state with 'commitStylesAttemptForcefully'.` +
              ` Cannot commit styles if element is unrendered because of an unrendered ancestor.`
            ));
          }
        }
      }

      switch(direction) {
        case 'forward':
          this.domElem.classList.add(...this.classesToAddOnFinish);
          this.domElem.classList.remove(...this.classesToRemoveOnFinish);
          this._onFinishForward();
          break;
        case 'backward':
          this._onFinishBackward();
          this.domElem.classList.add(...this.classesToRemoveOnStart);
          this.domElem.classList.remove(...this.classesToAddOnStart);
          break;
      }
    };
    
    // After endDelay phase, then cancel animation, remove this block from the timeline, and resolve overall promise.
    animation.onEndDelayFinish = () => {
      this.isAnimating = false;
      animation.cancel();
      resolver(true);
    };

    return new Promise<boolean>((resolve, reject) => {
      resolver = resolve;
      rejecter = reject;
    });
  }

  private loop = (): void => {
    const rafMutators = this.rafMutators!;
    try {
      switch(this.animation.direction) {
        case "forward":
          rafMutators.forwardMutator();
          break;
        case "backward":
          rafMutators.backwardMutator();
          break;
        default: throw this.generateError(Error, `Something very wrong occured for there to be an error here.`);
      }
    }
    catch (err: unknown) { throw this.generateError(err as Error); }

    if (this.rafLoopsProgress === 1) { return; }
    requestAnimationFrame(this.loop);
  }

  computeTween(initialVal: number, finalVal: number): number {
    return initialVal + (finalVal - initialVal) * this.rafLoopsProgress;
  }

  /*****************************************************************************************************************************/
  /********************************************         ERRORS         *********************************************************/
  /*****************************************************************************************************************************/
  protected generateError: BlockErrorGenerator = (ErrorClassOrInstance, msg = '<unspecified error>', elementOverride?: Element) => {
    return generateError(ErrorClassOrInstance, msg as string, {
      timeline: this.parentTimeline,
      sequence: this.parentSequence,
      block: this,
      element: elementOverride ? elementOverride : this.domElem
    });
  }

  private throwChildPlaybackError(funcName: string): never {
    throw this.generateError(CustomErrors.ChildPlaybackError, `Cannot directly call ${funcName}() on an animation block while is is part of a sequence.`);
  }
}


export type EntranceBlockConfig = AnimBlockConfig & {
  hideNowType: 'display-none' | 'visibility-hidden' | null;
};
export class EntranceBlock<TBankEntry extends AnimationBankEntry<EntranceBlock, EntranceBlockConfig> = AnimationBankEntry> extends AnimBlock<TBankEntry> {
  private backwardsHidingMethod: ExitBlockConfig['exitType'] = '' as ExitBlockConfig['exitType'];

  protected get defaultConfig(): Partial<EntranceBlockConfig> {
    return {
      commitsStyles: false,
      runGeneratorsNow: true,
      hideNowType: null,
    };
  }

  /**@internal*/initialize(animArgs: GeneratorParams<TBankEntry>, userConfig: Partial<EntranceBlockConfig> = {}) {
    super.initialize(animArgs, userConfig);

    const hideNow = userConfig.hideNowType ?? this.bankEntry.config?.hideNowType ?? this.defaultConfig.hideNowType!;
    switch(hideNow) {
      case "display-none":
        this.domElem.classList.add('wbfk-hidden');
        break;
      case "visibility-hidden":
        this.domElem.classList.add('wbfk-invisible');
        break;
      default:
        break;
    }

    return this;
  }

  protected _onStartForward(): void {
    if (this.domElem.classList.contains('wbfk-hidden')) {
      this.backwardsHidingMethod = 'display-none';
      this.domElem.classList.remove('wbfk-hidden');
    }
    else if (this.domElem.classList.contains('wbfk-invisible')) {
      this.backwardsHidingMethod = 'visibility-hidden';
      this.domElem.classList.remove('wbfk-invisible');
    }
    else {
      const { display, visibility } = getComputedStyle(this.domElem);
      let str = ``;
      if (display === 'none') {
        str = `The element being entered is hidden with CSS 'display: none', but it was not using the class "wbfk-hidden".` +
        ` An element needs to be unrendered using the class "wbfk-hidden" in order for Entrance() to act on it.`;
      }
      else if (visibility === 'hidden') {
        str = `The element being entered is hidden with CSS 'visibility: hidden', but it was not using the class "wbfk-invisible".` +
        ` An element needs to be unrendered using the class "wbfk-invisible" in order for Entrance() to act on it.`;
      }
      else {
        str = `Entrance() can only act on elements that are already hidden, but this element was not hidden.` +
        ` To hide an element, you can 1) use the 'hideNowType' config option to immediately hide the element from the very start, 2) exit it with Exit(), or` +
        ` 3) manually add either "wbfk-hidden" or "wbfk-invisible" to its class list in the HTML.`;
      }
      throw this.generateError(CustomErrors.InvalidEntranceAttempt,
        str +
        `${errorTip(
          `Tip: "wbfk-hidden" applies a 'display: none' CSS style, which completely unrenders an element.` +
          ` "wbfk-invisible" applies a 'visibility: hidden' CSS style, which just makes the element invisible while still taking up space.` +
          ` When using 'exitType' with Exit() or 'hideNowType' with Entrance(), you may set the config options to "display-none" (the default for exitType) or "visibility-hidden", but behind the scenes, this just determines whether to add` +
          ` the class "wbfk-hidden" or the class "wbfk-invisible" at the end of the animation.`
        )}`
      );
    }
  }

  protected _onFinishBackward(): void {
    switch(this.backwardsHidingMethod) {
      case "display-none": this.domElem.classList.add('wbfk-hidden'); break;
      case "visibility-hidden": this.domElem.classList.add('wbfk-invisible'); break;
      default: throw this.generateError(Error, `This error should NEVER be reached.`);
    }
  }
}


export type ExitBlockConfig = AnimBlockConfig & {
  exitType: 'display-none' | 'visibility-hidden';
};
// TODO: prevent already hidden blocks from being allowed to use exit animation
export class ExitBlock<TBankEntry extends AnimationBankEntry<ExitBlock, ExitBlockConfig> = AnimationBankEntry> extends AnimBlock<TBankEntry> {
  private exitType: ExitBlockConfig['exitType'] = '' as ExitBlockConfig['exitType'];

  protected get defaultConfig(): Partial<ExitBlockConfig> {
    return {
      commitsStyles: false,
      runGeneratorsNow: true,
      exitType: 'display-none',
    };
  }

  /**@internal*/initialize(animArgs: GeneratorParams<TBankEntry>, userConfig: Partial<ExitBlockConfig> = {}) {
    super.initialize(animArgs, userConfig);

    const exitType = userConfig.exitType ?? this.bankEntry.config?.exitType ?? this.defaultConfig.exitType!;
    if (exitType !== 'display-none' && exitType !== 'visibility-hidden') {
      throw this.generateError(RangeError, `Invalid 'exitType' config value "${exitType}". Must be "display-none" or "visibility-hidden".`);
    }
    this.exitType = exitType;

    return this;
  }

  protected _onFinishForward(): void {
    switch(this.exitType) {
      case "display-none": this.domElem.classList.add('wbfk-hidden'); break;
      case "visibility-hidden": this.domElem.classList.add('wbfk-invisible'); break;
    }
  }

  protected _onStartBackward(): void {
    switch(this.exitType) {
      case "display-none": this.domElem.classList.remove('wbfk-hidden'); break;
      case "visibility-hidden": this.domElem.classList.remove('wbfk-invisible'); break;
    }
  }
}

export class EmphasisBlock<TBankEntry extends AnimationBankEntry = AnimationBankEntry> extends AnimBlock<TBankEntry> {
  protected get defaultConfig(): Partial<AnimBlockConfig> {
    return {};
  }
}

export class MotionBlock<TBankEntry extends AnimationBankEntry = AnimationBankEntry> extends AnimBlock<TBankEntry> {
  protected get defaultConfig(): Partial<AnimBlockConfig> {
    return {
      composite: 'accumulate',
    };
  }
}

// TODO: implement rewindScrollBehavior: 'prior-user-position' | 'prior-scroll-target' = 'prior-scroll-target'
export class ScrollerBlock<TBankEntry extends AnimationBankEntry = AnimationBankEntry> extends AnimBlock<TBankEntry> {
  protected get defaultConfig(): Partial<AnimBlockConfig> {
    return {
      commitsStyles: false,
    };
  }
}


export type TransitionBlockConfig = AnimBlockConfig & {
  removeInlineStylesOnFinish: boolean;
}
export class TransitionBlock<TBankEntry extends AnimationBankEntry<TransitionBlock, TransitionBlockConfig> = AnimationBankEntry> extends AnimBlock<TBankEntry> {
  // determines whether properties affected by this transition should be removed from inline style upon finishing animation
  private removeInlineStyleOnFinish: boolean = false;

  protected get defaultConfig(): Partial<TransitionBlockConfig> {
    return {};
  }

  /**@internal*/initialize(animArgs: GeneratorParams<TBankEntry>, userConfig: Partial<TransitionBlockConfig> = {}) {
    super.initialize(animArgs, userConfig);
    this.removeInlineStyleOnFinish = userConfig.removeInlineStylesOnFinish ?? this.bankEntry.config?.removeInlineStylesOnFinish ?? this.defaultConfig.removeInlineStylesOnFinish!;
    return this;
  }

  protected _onFinishForward(): void {
    if (this.removeInlineStyleOnFinish) {
      const keyframe = this.animArgs[0] as Keyframe;
      for (const property in keyframe) {
        (this.domElem as HTMLElement).style[property as any] = "";
      }
    }
  }
}
