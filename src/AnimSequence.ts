import { AnimBlock } from "./AnimBlock";
import { AnimTimeline } from "./AnimTimeline";

/**
 * This is the description of the interface
 *
 * @interface AnimSequenceConfig
 * @property {string} description — This string is logged when debugging mode is enabled.
 * @property {boolean} tag — This string can be used as an argument to AnimTimeline.prototype.jumpToSequenceTag().
 * @property {boolean} autoplaysNextSequence — If true, the next sequence in the timeline will automatically play after this sequence finishes.
 * @property {boolean} autoplays — If true, this sequence will automatically play after the previous sequence in the timeline finishes.
 */
export type AnimSequenceConfig = {
  /**
   * This string is logged when debugging mode is enabled.
   * @optional
   * @defaultValue `'<blank sequence description>'`
   * 
  */
  description: string;

  /**
   * This string can be used as an argument to AnimTimeline.prototype.jumpToSequenceTag()
   * @defaultValue `''`
  */
  tag: string;

  /**
   * If true, the next sequence in the timeline will automatically play after this sequence finishes.
   * @defaultValue `false`
   * */
  autoplaysNextSequence: boolean;

  /**
   * If true, this sequence will automatically play after the previous sequence in the timeline finishes.
   * @defaultValue `false`
   * 
  */
  autoplays: boolean;
};

type AnimationOperation = (animation: AnimBlock) => void;
type AsyncAnimationOperation = (animation: AnimBlock) => Promise<unknown>;

type FullyFinishedPromise<T> = {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
};

export class AnimSequence implements AnimSequenceConfig {
  private static id = 0;
  
  readonly id: number;
  /**@internal*/ _parentTimeline?: AnimTimeline; // pointer to parent AnimTimeline
  get parentTimeline() { return this._parentTimeline; }
  /**@internal*/ description: string = '<blank sequence description>';
  /**@internal*/ tag: string = ''; // helps idenfity current AnimSequence for using AnimTimeline's jumpToSequenceTag()
  /**@internal*/ autoplaysNextSequence: boolean = false; // decides whether the next AnimSequence should automatically play after this one
  /**@internal*/ autoplays: boolean = false;
  basePlaybackRate: number = 1;
  /**@internal*/ isPaused = false;
  private usingFinish = false;
  /**@internal*/ inProgress = false;
  private isFinished: boolean = false;
  /**@internal*/ wasPlayed = false;
  /**@internal*/ wasRewound = false;
  /**@internal*/ get skippingOn() { return this._parentTimeline?.skippingOn || this._parentTimeline?.usingJumpTo || this.usingFinish; }
  get compoundedPlaybackRate() { return this.basePlaybackRate * (this._parentTimeline?.playbackRate ?? 1); }
  private animBlocks: AnimBlock[] = []; // array of animBlocks

  private animBlockGroupings_activeFinishOrder: AnimBlock[][] = [];
  private animBlockGroupings_endDelayFinishOrder: AnimBlock[][] = [];
  private animBlockGroupings_backwardActiveFinishOrder: AnimBlock[][] = [];
  private animBlock_forwardGroupings: AnimBlock[][] = [[]];
  // CHANGE NOTE: AnimSequence now stores references to all in-progress blocks
  private inProgressBlocks: Map<number, AnimBlock> = new Map();
  
  private fullyFinished: FullyFinishedPromise<this> = this.getNewFullyFinished();

  /**@internal*/
  onStart: {do: () => void; undo: () => void;} = {
    do: () => {},
    undo: () => {},
  };
  /**@internal*/
  onFinish: {do: () => void; undo: () => void;} = {
    do: () => {},
    undo: () => {},
  };

  static createInstance(config: Partial<AnimSequenceConfig>, ...animBlocks: AnimBlock[]): AnimSequence;
  static createInstance(...animBlocks: AnimBlock[]): AnimSequence;
  static createInstance(config: Partial<AnimSequenceConfig> | AnimBlock = {}, ...animBlocks: AnimBlock[]): AnimSequence {
    return new AnimSequence(config, ...animBlocks);
  }

  // constructor(config: Partial<AnimSequenceConfig>, ...animBlocks: AnimBlock[]);
  // constructor(...animBlocks: AnimBlock[]);
  constructor(config: Partial<AnimSequenceConfig> | AnimBlock = {}, ...animBlocks: AnimBlock[]) {
    this.id = AnimSequence.id++;

    Object.assign(this, config instanceof AnimBlock ? {} : config);
    this.addBlocks(...(config instanceof AnimBlock ? [config, ...animBlocks] : animBlocks));
  }

  getConfig(): Readonly<AnimSequenceConfig> {
    return {
      autoplays: this.autoplays,
      autoplaysNextSequence: this.autoplaysNextSequence,
      description: this.description,
      tag: this.tag,
    };
  }

  getStatus() {
    return {
      inProgress: this.inProgress,
      paused: this.isPaused,
      skippingOn: this.skippingOn,
    };
  }

  getDescription() { return this.description; }
  getTag() { return this.tag; }
  
  setDescription(description: string): this { this.description = description; return this; }
  setTag(tag: string): this { this.tag = tag; return this; }

  /**@internal*/
  setLineage(timeline: AnimTimeline) {
    this._parentTimeline = timeline;
    for (const animBlock of this.animBlocks) {
      animBlock.setLineage(this, this._parentTimeline);
    }
  }

  setOnStart(promiseFunctions: {do: () => void, undo: () => void}): this { 
    this.onStart.do = promiseFunctions.do;
    this.onStart.undo = promiseFunctions.undo;
    return this;
  }
  setOnFinish(promiseFunctions: {do: () => void, undo: () => void}): this { 
    this.onFinish.do = promiseFunctions.do;
    this.onFinish.undo = promiseFunctions.undo;
    return this;
  }

  addBlocks(...animBlocks: AnimBlock[]): this {
    // CHANGE NOTE: removed addOneBlock()
    for (const animBlock of animBlocks) {
      animBlock.setLineage(this, this._parentTimeline);
    }
    this.animBlocks.push(...animBlocks);
    return this;
  }

  addBlocksAt(index: number, ...animBlocks: AnimBlock[]): this {
    for (const animBlock of animBlocks) {
      animBlock.setLineage(this, this._parentTimeline);
    }
    this.animBlocks.splice(index, 0, ...animBlocks);
    return this;
  }

  findBlockIndex(animBlock: AnimBlock): number {
    return this.animBlocks.findIndex((_animBlock) => _animBlock === animBlock);
  }

  private getNewFullyFinished(): FullyFinishedPromise<this> {
    const {resolve, promise} = Promise.withResolvers<this>();
    return {resolve, promise};
  }

  private handleFinishState(): void {
    if (this.isFinished) {
      this.isFinished = false;
      this.fullyFinished = this.getNewFullyFinished();
    }
  }

  // plays each animBlock contained in this AnimSequence instance in sequential order
  async play(): Promise<this> {
    if (this.inProgress) { return this; }
    this.inProgress = true;
    this.handleFinishState();

    this.commit();

    this.onStart.do();

    const activeGroupings = this.animBlockGroupings_activeFinishOrder;
    // const activeGroupings2 = this.animBlockGroupings_endDelayFinishOrder;
    const numGroupings = activeGroupings.length;

    for (let i = 0; i < numGroupings; ++i) {
      const activeGrouping = activeGroupings[i];
      // TODO: probably want to reincorporate this
      // const activeGrouping2 = activeGroupings2[i];
      const groupingLength = activeGrouping.length;

      // ensure that no block finishes its active phase before any block that should finish its active phase first (according to the calculated "perfect" timing)
      for (let j = 1; j < groupingLength; ++j) {
        activeGrouping[j].addIntegrityblocks('forward', 'activePhase', 'end', [activeGrouping[j-1].generateTimePromise('forward', 'activePhase', 'end')]);
        // activeGrouping2[j].animation.addIntegrityblocks('forward', 'endDelayPhase', 'end', activeGrouping2[j-1].animation.getFinished('forward', 'endDelayPhase'));
      }
    }

    let parallelBlocks: Promise<void>[] = [];
    for (let i = 0; i < this.animBlock_forwardGroupings.length; ++i) {
      parallelBlocks = [];
      const grouping = this.animBlock_forwardGroupings[i];
      const firstBlock = grouping[0];
      this.inProgressBlocks.set(firstBlock.id, firstBlock);
      parallelBlocks.push(firstBlock.play(this)
        .then(() => {this.inProgressBlocks.delete(firstBlock.id)})
      );

      for (let j = 1; j < grouping.length; ++j) {
        // the start of any block within a grouping should line up with the beginning of the preceding block's active phase
        // (akin to PowerPoint timing)
        await grouping[j-1].generateTimePromise('forward', 'activePhase', 'beginning');
        const currAnimBlock = grouping[j];
        this.inProgressBlocks.set(currAnimBlock.id, currAnimBlock);
        parallelBlocks.push(currAnimBlock.play(this)
          .then(() => {this.inProgressBlocks.delete(currAnimBlock.id)})
        );
      }
      await Promise.all(parallelBlocks);
    }

    this.inProgress = false;
    this.isFinished = true;
    this.wasPlayed = true;
    this.wasRewound = false;
    this.usingFinish = false;
    this.fullyFinished.resolve(this);
    this.onFinish.do();
    return this;
  }

  // rewinds each animBlock contained in this AnimSequence instance in reverse order
  async rewind(): Promise<this> {
    if (this.inProgress) { return this; }
    this.inProgress = true;
    this.handleFinishState();

    const activeGroupings = this.animBlockGroupings_backwardActiveFinishOrder;
    const numGroupings = activeGroupings.length;

    this.onFinish.undo();

    for (let i = 0; i < numGroupings; ++i) {
      const activeGrouping = activeGroupings[i];
      const groupingLength = activeGrouping.length;

      // ensure that no block finishes rewinding its active phase before any block that should finishing doing so first first (according to the calculated "perfect" timing)
      for (let j = 1; j < groupingLength; ++j) {
        activeGrouping[j].addIntegrityblocks('backward', 'activePhase', 'beginning', [activeGrouping[j-1].generateTimePromise('backward', 'activePhase', 'beginning')]);
      }
    }
    
    let parallelBlocks: Promise<void>[] = [];
    const groupings = this.animBlockGroupings_endDelayFinishOrder;
    const groupingsLength = groupings.length;
    
    for (let i = groupingsLength - 1; i >= 0; --i) {
      parallelBlocks = [];
      const grouping = groupings[i];
      const groupingLength = grouping.length;
      const lastBlock = grouping[groupingLength - 1];
      this.inProgressBlocks.set(lastBlock.id, lastBlock);
      parallelBlocks.push(lastBlock.rewind(this)
        .then(() => {this.inProgressBlocks.delete(lastBlock.id)})
      );

      for (let j = groupingLength - 2; j >= 0; --j) {
        const currAnimBlock = grouping[j];
        const nextAnimBlock = grouping[j + 1];
        // if the current block intersects the next block, wait for that intersection time
        if (currAnimBlock.fullFinishTime > nextAnimBlock.fullStartTime) {
          await nextAnimBlock.generateTimePromise('backward', 'whole', currAnimBlock.fullFinishTime - nextAnimBlock.fullStartTime);
        }
        // otherwise, wait for the next block to finish rewinding entirely
        else {
          await nextAnimBlock.generateTimePromise('backward', 'delayPhase', 'beginning');
        }

        // once waiting period above is over, begin rewinding current block
        this.inProgressBlocks.set(currAnimBlock.id, currAnimBlock);
        parallelBlocks.push(currAnimBlock.rewind(this)
          .then(() => {this.inProgressBlocks.delete(currAnimBlock.id)})
        );
      }
      await Promise.all(parallelBlocks);
    }

    this.inProgress = false;
    this.isFinished = true;
    this.wasPlayed = false;
    this.wasRewound = true;
    this.usingFinish = false;
    this.fullyFinished.resolve(this);
    this.onStart.undo();
    return this;
  }
  
  pause(): void {
    if (this.isPaused) { return; }
    this.isPaused = true;
    this.doForInProgressBlocks(animBlock => animBlock.pause(this));
  }
  unpause(): void {
    if (!this.isPaused) { return; }
    this.isPaused = false;
    this.doForInProgressBlocks(animBlock => animBlock.unpause(this));
  }

  // TODO: check to see if it's necessary to prevent direct finish() calls if sequence has a parent timeline
  async finish(): Promise<this> {
    if (this.usingFinish || this.isPaused) { return this; }
    this.usingFinish = true; // resets to false at the end of play() and rewind()

    // if in progress, finish the current blocks and let the proceeding ones read from this.usingFinish
    if (this.inProgress) { this.finishInProgressAnimations(); }
    // else, if this sequence is ready to play forward, just play (then all blocks will read from this.usingFinish)
    else if (!this.wasPlayed || this.wasRewound) { this.play(); }
    // If sequence is at the end of its playback, finish() does nothing.
    // AnimTimeline calling AnimSequence.finish() in its method for finishing current sequences should still work
    // because that method is only called when sequences are already playing (so it hits the first if-statement)
    return this.fullyFinished.promise;
  }

  // used to skip currently running animation so they don't run at regular speed while using finish()
  async finishInProgressAnimations(): Promise<this> {
    return this.doForInProgressBlocks_async(animBlock => animBlock.finish(this));
  }

  updatePlaybackRate(newRate: number): this {
    this.basePlaybackRate = newRate;
    this.useCompoundedPlaybackRate();
    return this;
  }

  /**@internal*/
  useCompoundedPlaybackRate(): this {
    this.doForInProgressBlocks(animBlock => animBlock.useCompoundedPlaybackRate());
    return this;
  }

  private static activeBackwardFinishComparator = (blockA: AnimBlock, blockB: AnimBlock) => blockB.activeStartTime - blockA.activeStartTime;
  private static activeFinishComparator = (blockA: AnimBlock, blockB: AnimBlock) => blockA.activeFinishTime - blockB.activeFinishTime;
  private static endDelayFinishComparator = (blockA: AnimBlock, blockB: AnimBlock) => blockA.fullFinishTime - blockB.fullFinishTime;

  // TODO: Complete this method
  /**@internal*/
  commit(): this {
    const {
      activeBackwardFinishComparator,
      activeFinishComparator,
      endDelayFinishComparator,
    } = AnimSequence;

    let maxFinishTime = 0;
    const animBlocks = this.animBlocks;
    const numBlocks = animBlocks.length;
    this.animBlock_forwardGroupings = [[]];
    this.animBlockGroupings_backwardActiveFinishOrder = [];
    this.animBlockGroupings_activeFinishOrder = [];
    this.animBlockGroupings_endDelayFinishOrder = [];
    let currActiveBackwardFinishGrouping: AnimBlock[] = [];
    let currActiveFinishGrouping: AnimBlock[] = [];
    let currEndDelayGrouping: AnimBlock[] = [];

    for (let i = 0; i < numBlocks; ++i) {
      const currAnimBlock = animBlocks[i];
      const prevBlock = animBlocks[i-1];
      const startsWithPrev = currAnimBlock.startsWithPrevious || prevBlock?.startsNextBlockToo;
      let currStartTime: number;

      if (startsWithPrev || i === 0) {
        // currActiveBackwardFinishGrouping.push(currAnimBlock);
        currActiveFinishGrouping.push(currAnimBlock);
        currEndDelayGrouping.push(currAnimBlock);

        currStartTime = prevBlock?.activeStartTime ?? 0;
      }
      else {
        this.animBlock_forwardGroupings.push([]);
        currActiveFinishGrouping.sort(activeFinishComparator);
        currEndDelayGrouping.sort(endDelayFinishComparator);
        currActiveBackwardFinishGrouping = [...currEndDelayGrouping].reverse();
        currActiveBackwardFinishGrouping.sort(activeBackwardFinishComparator);
        this.animBlockGroupings_backwardActiveFinishOrder.push(currActiveBackwardFinishGrouping);
        this.animBlockGroupings_activeFinishOrder.push(currActiveFinishGrouping);
        this.animBlockGroupings_endDelayFinishOrder.push(currEndDelayGrouping);
        currActiveBackwardFinishGrouping = [currAnimBlock];
        currActiveFinishGrouping = [currAnimBlock];
        currEndDelayGrouping = [currAnimBlock];

        currStartTime = maxFinishTime;
      }

      this.animBlock_forwardGroupings[this.animBlock_forwardGroupings.length - 1].push(currAnimBlock);

      currAnimBlock.fullStartTime = currStartTime;

      maxFinishTime = Math.max(currAnimBlock.fullFinishTime, maxFinishTime);
    }

    currActiveFinishGrouping.sort(activeFinishComparator);
    currEndDelayGrouping.sort(endDelayFinishComparator);
    currActiveBackwardFinishGrouping = [...currEndDelayGrouping].reverse();
    currActiveBackwardFinishGrouping.sort(activeBackwardFinishComparator);
    this.animBlockGroupings_backwardActiveFinishOrder.push(currActiveBackwardFinishGrouping);
    this.animBlockGroupings_activeFinishOrder.push(currActiveFinishGrouping);
    this.animBlockGroupings_endDelayFinishOrder.push(currEndDelayGrouping);

    return this;
  }

  // get all currently running animations that belong to this timeline and perform operation() with them
  private doForInProgressBlocks(operation: AnimationOperation): this {
    for (const animBlock of this.inProgressBlocks.values()) {
      operation(animBlock);
    }
    return this;
  }

  private async doForInProgressBlocks_async(operation: AsyncAnimationOperation): Promise<this> {
    const promises: Promise<unknown>[] = [];
    for (const animBlock of this.inProgressBlocks.values()) {
      promises.push(operation(animBlock));
    }
    await Promise.all(promises);
    return this;
  }
}
