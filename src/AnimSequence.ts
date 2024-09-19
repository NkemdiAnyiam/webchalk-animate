import { AnimClip } from "./AnimClip";
import { AnimTimeline } from "./AnimTimeline";
import { CustomErrors, errorTip, generateError, SequenceErrorGenerator } from "./utils/errors";
import { getPartial } from "./utils/helpers";
import { PickFromArray } from "./utils/utilityTypes";
import { webflik, WebFlik } from "./WebFlik";

// TYPE
/**
 * Contains configuration options used to define the timing and details of the animation sequence.
 * @category Interfaces
 * @interface
 */
export type AnimSequenceConfig = {
  /**
   * String that is logged when debugging mode is enabled.
   * @defaultValue
   * ```ts
   * '<blank sequence description>'
   * ```
   */
  description: string;

  /**
   * This string can be used as an argument to {@link AnimTimeline.jumpToSequenceTag}.
   * @defaultValue
   * ```ts
   * ''
   * ```
   */
  tag: string;

  /**
   * If `true`, the next sequence in the same timeline will automatically play after this sequence finishes.
   * - If this sequence is not part of a timeline or is at the end of a timeline, this option has no effect.
   * @defaultValue
   * ```ts
   * false
   * ```
   */
  autoplaysNextSequence: boolean;

  /**
   * If `true`, this sequence will automatically play after the previous sequence in the same timeline finishes.
   * - If this sequence is not part of a timeline or is at the beginning of a timeline, this option has no effect.
   * @defaultValue
   * ```ts
   * false
   * ```
   * 
   */
  autoplays: boolean;

  /**
   * The base playback rate of the sequence (ignoring any multipliers from a parent timeline).
   * - Example: A value of `1` means 100% (the typical playback rate), and `0.5` means 50% speed.
   * - Example: If the `playbackRate` of the parent timeline is `4` and the `playbackRate` of this sequence is `5`,
   * the `playbackRate` property is still `5`, but the sequence would run at 4 * 5 = 20x speed.
   */
  playbackRate: number;
};

// TYPE
/**
 * Contains timing-related details about the sequence. Returned by {@link AnimSequence.getTiming}.
 * @see {@link AnimSequence.getTiming}
 * @category Interfaces
 * @interface
 */
export type AnimSequenceTiming = Pick<AnimSequenceConfig,
  | 'autoplays'
  | 'autoplaysNextSequence'
  | 'playbackRate'
> & {
  /**
   * The actual playback rate of the sequence after the playback rates of any parents are taken into account.
   * - Example: If the `playbackRate` of the parent timeline is `4` and the `playbackRate` of this sequence is `5`,
   * the `compoundedPlaybackRate` will be 4 * 5 = 20.
   * @see {@link AnimSequenceTiming.playbackRate}
   */
  compoundedPlaybackRate: AnimSequence['compoundedPlaybackRate'];
};

// TYPE
/**
 * Contains details about an sequence's current status. Returned by {@link AnimSequence.getStatus}.
 * @see {@link AnimSequence.getStatus}
 * @category Interfaces
 * @interface
 */
export type AnimSequenceStatus = {
  /**
   * `true` only if the sequence is in the process of playback and paused.
   */
  isPaused: boolean;

  /**
   * `true` only if the sequence is in the process of playback and unpaused.
   */
  isRunning: boolean;

  /**
   * `true` only if the sequence is in the process of playback (whether running or paused).
   */
  inProgress: boolean;

  /**
   * `true` only if a parent timeline has skipping enabled
   * (`isSkipping` is `true`) or is using a jumping method
   * (`isJumping` is `true`).
   * @see {@link AnimTimelineStatus.isSkipping}
   * @see {@link AnimTimelineStatus.isJumping}
   */
  skippingOn: boolean;

  /**
   * `true` only if the sequence is currently using `finish()`.
   * @see {@link AnimSequence.finish}
   */
  usingFinish: boolean;

  /**
   * `true` only if the sequence has been played or rewound at least once and is not currently in progress.
   */
  isFinished: boolean;

  /**
   * `true` only if the sequence has finished being played and not finished being rewound.
   * (if rewound at all).
   * - Resets to `false` once the sequence has finished being rewound.
   */
  wasPlayed: boolean;

  /**
   * `true` only if the sequence has finished being rewound and not finished being played.
   * - Resets to `false` once the sequence has finished being rewound.
   * (if played at all).
   */
  wasRewound: boolean;

  /**
   * Shows whether the sequence is currently allowed to accept changes to its structure.
   * `true` only if the sequence is in progress or in a forward finished state.
   * - Operations like {@link AnimSequence.addClips | addClips()}, {@link AnimSequence.removeClips | removeClips()},
   * etc. check whether the structure is locked before proceeding.
   * - Any time the sequence goes back to its starting point after fully rewinding, its structure is unlocked
   * and allowed to accept changes (i.e., {@link AnimSequenceStatus.lockedStructure | lockedStructure} is `false`).
   */
  lockedStructure: boolean;
};

// TYPE
type AnimationOperation = (animation: AnimClip) => void;
// TYPE
type AsyncAnimationOperation = (animation: AnimClip) => Promise<unknown>;

// TYPE
type FullyFinishedPromise<T> = {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
};

/**
 * @hideconstructor
 * 
 * @groupDescription Property Getter Methods
 * Methods that return objects that contain various internal fields of the sequence (such as `autoplays` from `getTiming()`,
 * `inProgress` from `getStatus()`, etc.
 * 
 * @groupDescription Property Setter Methods
 * Methods that allow the modification of various internal fields of the sequence.
 * 
 * @groupDescription Playback Methods
 * Methods that control the playback of the animation sequence.
 * 
 * @groupDescription Timing Event Methods
 * Methods that involve listening to the progress of the animation sequence to perform tasks at specific times.
 * 
 * @groupDescription Structure
 * Methods and/or fields related to the stucture of the sequence, including methods related to the clips that make up
 * the sequence and what timeline the sequence belongs to (if any).
 * 
 * @groupDescription Configuration
 * Methods and/or fields related to the configuration settings of the sequence.
 */
export class AnimSequence {
  private static id = 0;

  private config: AnimSequenceConfig = {
    autoplays: false,
    autoplaysNextSequence: false,
    description: '<blank sequence description>',
    playbackRate: 1,
    tag: '',
  };

  /**
   * Returns an object containing the configuration options used to
   * define the timing, tag, and description of the animation sequence.
   * @returns an object containing
   * - {@link AnimSequenceConfig.autoplays|autoplays},
   * - {@link AnimSequenceConfig.autoplaysNextSequence|autoplaysNextSequence},
   * - {@link AnimSequenceConfig.description|description},
   * - {@link AnimSequenceConfig.playbackRate|playbackRate},
   * - {@link AnimSequenceConfig.tag|tag},
   * @group Property Getter Methods
   * @group Configuration
   */
  getConfig(): AnimSequenceConfig {
    return { ...this.config };
  }
  
  /*-:**************************************************************************************************************************/
  /*-:*************************************        FIELDS & ACCESSORS        ***************************************************/
  /*-:**************************************************************************************************************************/
  /**
   * Number that uniquely identifies the sequence from other sequences.
   * Automatically generated.
   */
  readonly id: number;
  /**
   * @group Structure
   */
  /**@internal*/ _parentTimeline?: AnimTimeline; // pointer to parent AnimTimeline
  /**
   * The highest level of this sequence's lineage.
   * - If the sequence is nested within an {@link AnimTimeline}: that timeline,
   * - Else: the sequence itself
   * @group Structure
   */
  get root(): AnimTimeline | AnimSequence { return this.parentTimeline ?? this; }
  /**
   * The parent {@link AnimTimeline} that contains this sequence
   * (`undefined` if the sequence is not part of a timeline).
   * @group Structure
   */
  get parentTimeline() { return this._parentTimeline; }
  private animClips: AnimClip[] = []; // array of animClips

  private animClipGroupings_activeFinishOrder: AnimClip[][] = [];
  private animClipGroupings_endDelayFinishOrder: AnimClip[][] = [];
  private animClipGroupings_backwardActiveFinishOrder: AnimClip[][] = [];
  private animClip_forwardGroupings: AnimClip[][] = [[]];
  // CHANGE NOTE: AnimSequence now stores references to all in-progress clips
  private inProgressClips: Map<number, AnimClip> = new Map();
  
  private fullyFinished: FullyFinishedPromise<this> = this.getNewFullyFinished();

  /**@internal*/
  onStart: {do: Function; undo: Function;} = {
    do: () => {},
    undo: () => {},
  };
  /**@internal*/
  onFinish: {do: Function; undo: Function;} = {
    do: () => {},
    undo: () => {},
  };

  // GROUP: Status
  private isPaused = false;
  private isRunning = false;
  private usingFinish = false;
  private inProgress = false;
  private isFinished: boolean = false;
  private wasPlayed = false;
  private wasRewound = false;
  private get skippingOn() { return this._parentTimeline?.getStatus('skippingOn') || this._parentTimeline?.getStatus('isJumping') || false; }
  private get lockedStructure(): boolean {
    if (this.inProgress || this.wasPlayed) { return true; }
    return false;
  }
  /**
   * Returns details about an sequence's current status.
   * @returns an object containing
   * - {@link AnimSequenceStatus.inProgress|inProgress},
   * - {@link AnimSequenceStatus.isPaused|isPaused},
   * - {@link AnimSequenceStatus.isRunning|isRunning},
   * - {@link AnimSequenceStatus.skippingOn|skippingOn},
   * - {@link AnimSequenceStatus.isFinished|isFinished},
   * - {@link AnimSequenceStatus.usingFinish|usingFinish},
   * - {@link AnimSequenceStatus.wasPlayed|wasPlayed},
   * - {@link AnimSequenceStatus.wasRewound|wasRewound},
   * - {@link AnimSequenceStatus.lockedStructure|lockedStructure},
   * @group Property Getter Methods
   */
  getStatus(): AnimSequenceStatus;
  /**
   * Returns the value of a single specific property.
   * @param propName - name of the desired property
   * @ignore
   */
  getStatus<T extends keyof AnimSequenceStatus>(propName: T): AnimSequenceStatus[T];
  /**
   * Returns an object containing a subset of the object that would normally be returned.
   * @param propNames - array of strings specifying which properties should be included.
   * @ignore
   */
  getStatus<T extends (keyof AnimSequenceStatus)[]>(propNames: (keyof AnimSequenceStatus)[] | T): PickFromArray<AnimSequenceStatus, T>;
  /**
   * @group Property Getter Methods
   */
  getStatus(specifics?: keyof AnimSequenceStatus | (keyof AnimSequenceStatus)[]):
    | AnimSequenceStatus
    | AnimSequenceStatus[keyof AnimSequenceStatus]
    | Partial<Pick<AnimSequenceStatus, keyof AnimSequenceStatus>>
  {
    const result: AnimSequenceStatus = {
      inProgress: this.inProgress,
      isPaused: this.isPaused,
      isRunning: this.isRunning,
      skippingOn: this.skippingOn,
      usingFinish: this.usingFinish,
      isFinished: this.isFinished,
      wasPlayed: this.wasPlayed,
      wasRewound: this.wasRewound,
      lockedStructure: this.lockedStructure,
    };

    return specifics ? getPartial(result, specifics) : result;
  }
  
  // GROUP: Timing
  protected get compoundedPlaybackRate() { return this.config.playbackRate * (this._parentTimeline?.getTiming().playbackRate ?? 1); }
  /**
   * Returns timing-related details about the sequence.
   * @returns an object containing
   * - {@link AnimSequenceTiming.autoplays|autoplays},
   * - {@link AnimSequenceTiming.autoplaysNextSequence|autoplaysNextSequence},
   * - {@link AnimSequenceTiming.compoundedPlaybackRate|compoundedPlaybackRate},
   * - {@link AnimSequenceTiming.playbackRate|playbackRate},
   * @group Property Getter Methods
   */
  getTiming(): AnimSequenceTiming;
  /**
   * Returns the value of a single specific property.
   * @param propName - name of the desired property
   * @ignore
   */
  getTiming<T extends keyof AnimSequenceTiming>(propName: T): AnimSequenceTiming[T];
  /**
   * Returns an object containing a subset of the object that would normally be returned.
   * @param propNames - array of strings specifying which properties should be included.
   * @ignore
   */
  getTiming<T extends (keyof AnimSequenceTiming)[]>(propNames: (keyof AnimSequenceTiming)[] | T): PickFromArray<AnimSequenceTiming, T>;
  /**
   * @group Property Getter Methods
   */
  getTiming(specifics?: keyof AnimSequenceTiming | (keyof AnimSequenceTiming)[]):
    | AnimSequenceTiming
    | AnimSequenceTiming[keyof AnimSequenceTiming]
    | Partial<Pick<AnimSequenceTiming, keyof AnimSequenceTiming>>
  {
    const config = this.config;
    const result: AnimSequenceTiming = {
      autoplays: config.autoplays,
      autoplaysNextSequence: config.autoplaysNextSequence,
      compoundedPlaybackRate: this.compoundedPlaybackRate,
      playbackRate: config.playbackRate,
    };

    return specifics ? getPartial(result, specifics) : result;
  }

  // GROUP: Description and Tag
  /**
   * @returns the {@link AnimSequenceConfig.description|description} for this sequence.
   * @see {@link AnimSequenceConfig.description}
   * @group Property Getter Methods
   */
  getDescription() { return this.config.description; }

  /**
   * @returns the {@link AnimSequenceConfig.tag|tag} for this sequence.
   * @see {@link AnimSequenceConfig.tag|tag}
   * @group Property Getter Methods
   */
  getTag() { return this.config.tag; }
  
  /**
   * Sets the {@link AnimSequenceConfig.description|description} for this sequence.
   * @param description - new description
   * @see {@link AnimSequenceConfig.description}
   * @group Property Setter Methods
   */
  setDescription(description: string): this { this.config.description = description; return this; }

  /**
   * Sets the {@link AnimSequenceConfig.tag|tag} for this sequence.
   * @param tag - new tag
   * @see {@link AnimSequenceConfig.tag}
   * @group Property Setter Methods
   */
  setTag(tag: string): this { this.config.tag = tag; return this; }

  /*-:**************************************************************************************************************************/
  /*-:*********************************        CONSTRUCTOR & INITIALIZERS        ***********************************************/
  /*-:**************************************************************************************************************************/
  /**@internal*/
  static createInstance(config: Partial<AnimSequenceConfig> | AnimClip = {}, ...animClips: AnimClip[]): AnimSequence {
    return new AnimSequence(config, ...animClips);
  }

  // constructor(config: Partial<AnimSequenceConfig>, ...animClips: AnimClip[]);
  // constructor(...animClips: AnimClip[]);
  constructor(configOrClips: Partial<AnimSequenceConfig> | AnimClip = {}, ...animClips: AnimClip[]) {
    if (webflik.sequenceCreatorLock) {
      throw this.generateError(TypeError, `Illegal constructor. Sequences can only be instantiated using webflik.newSequence().`);
    }
    webflik.sequenceCreatorLock = true;
    
    this.id = AnimSequence.id++;

    Object.assign(this.config, configOrClips instanceof AnimClip ? {} : configOrClips);
    
    this.addClips(...(configOrClips instanceof AnimClip ? [configOrClips, ...animClips] : animClips));
  }
  
  /*-:**************************************************************************************************************************/
  /*-:*************************************        STRUCTURE        ****************************************************/
  /*-:**************************************************************************************************************************/
  /**
   * Used by a parent to set pointers to itself (the parent) within the sequence.
   * @internal
   * @group Structure
   */
  setLineage(timeline: AnimTimeline) {
    this._parentTimeline = timeline;
    for (const animClip of this.animClips) {
      animClip.setLineage(this, this._parentTimeline);
    }
  }

  /**
   * Used by a parent to remove pointers to itself (the parent) within the sequence.
   * @internal
   * @group Structure
   */
  removeLineage(): this {
    this._parentTimeline = undefined;
    return this;
  }

  /**
   * Adds one or more {@link AnimClip} objects to the end of the sequence.
   * @param animClips - comma-separated list of animation clips
   * @returns 
   * @group Structure
   */
  addClips(...animClips: AnimClip[]): this {
    if (this.lockedStructure) { throw this.generateLockedStructureError(this.addClips.name); }

    for (const animClip of animClips) {
      if (animClip.parentSequence) {
        // TODO: Improve error message
        throw this.generateError(CustomErrors.InvalidChildError, `At least one of the clips being added is already part of some sequence.`);
      }
      animClip.setLineage(this, this._parentTimeline);
    }
    this.animClips.push(...animClips);
    return this;
  }

  // TODO: prevent play() and rewind() when sequence contains undefined entries (I don't think this will ever happen?)
  /**
   * Adds one or more {@link AnimClip} objects to the specified index of the sequence.
   * @param index - the index at which the clips should be inserted
   * @param animClips - comma-separated list of animation clips
   * @returns 
   * @group Structure
   */
  addClipsAt(index: number, ...animClips: AnimClip[]): this {
    if (this.lockedStructure) { throw this.generateLockedStructureError(this.addClipsAt.name); }

    for (const animClip of animClips) {
      if (animClip.parentSequence) {
        // TODO: Improve error message
        throw this.generateError(CustomErrors.InvalidChildError, `At least one of the clips being added is already part of some sequence.`);
      }
      animClip.setLineage(this, this._parentTimeline);
    }
    this.animClips.splice(index, 0, ...animClips);
    return this;
  }

  /**
   * Removes one or more {@link AnimClip} objects from the sequence.
   * @param animClips - comma-separated list of animation clips
   * @returns 
   * @group Structure
   */
  removeClips(...animClips: AnimClip[]): this {
    if (this.lockedStructure) { throw this.generateLockedStructureError(this.removeClips.name); }

    for (const animClip of animClips) {
      const index = this.findClipIndex(animClip);
      if (index === -1) {
        // TODO: improve warning
        console.warn(`At least one of the clips being removed from this sequence was already not in the sequence.`);
        return this;
      }
      this.animClips.splice(index, 1);
      animClip.removeLineage();
    }
    return this;
  }
  
  /**
   * Removes a number of {@link AnimClip} objects from the sequence based on the provided indices range (0-based).
   * @param startIndex - the starting index, inclusive
   * @param endIndex - the ending index, exclusive
   * @returns an array containing the clips that were removed from the sequence.
   * @group Structure
   */
  removeClipsAt(startIndex: number, endIndex: number = startIndex + 1): AnimClip[] {
    if (this.lockedStructure) { throw this.generateLockedStructureError(this.removeClipsAt.name); }

    const removalList = this.animClips.splice(startIndex, endIndex - startIndex);
    for (const clip of removalList) { clip.removeLineage(); }
    return removalList;
  }

  /**
   * Finds the index of a given {@link AnimClip} object within the sequence
   * @param animClip - the animation clip to search for within the sequence
   * @returns the index of {@link animClip} within the sequence or `-1` if the clip is not part of the sequence.
   * @group Structure
   */
  findClipIndex(animClip: AnimClip): number {
    return this.animClips.findIndex((_animClip) => _animClip === animClip);
  }

  /*-:**************************************************************************************************************************/
  /*-:*****************************************        PLAYBACK        *********************************************************/
  /*-:**************************************************************************************************************************/
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

  // plays each animClip contained in this AnimSequence instance in sequential order
  /**
   * Plays the animation sequence (sequence runs forward).
   * @returns a promise that is resolved when the sequence finishes playing.
   * @group Playback Methods
   */
  async play(): Promise<this> {
    if (this.inProgress) { return this; }
    this.inProgress = true;
    this.isRunning = true;
    this.handleFinishState();

    this.commit();

    this.onStart.do();

    const activeGroupings = this.animClipGroupings_activeFinishOrder;
    // const activeGroupings2 = this.animClipGroupings_endDelayFinishOrder;
    const numGroupings = activeGroupings.length;

    for (let i = 0; i < numGroupings; ++i) {
      const activeGrouping = activeGroupings[i];
      // TODO: probably want to reincorporate this
      // const activeGrouping2 = activeGroupings2[i];
      const groupingLength = activeGrouping.length;

      // ensure that no clip finishes its active phase before any clip that should finish its active phase first (according to the calculated "perfect" timing)
      for (let j = 1; j < groupingLength; ++j) {
        activeGrouping[j].addIntegrityblocks('forward', 'activePhase', 'end', [activeGrouping[j-1].generateTimePromise('forward', 'activePhase', 'end')]);
        // activeGrouping2[j].animation.addIntegrityblocks('forward', 'endDelayPhase', 'end', activeGrouping2[j-1].animation.getFinished('forward', 'endDelayPhase'));
      }
    }

    let parallelClips: Promise<void>[] = [];
    for (let i = 0; i < this.animClip_forwardGroupings.length; ++i) {
      parallelClips = [];
      const grouping = this.animClip_forwardGroupings[i];
      const firstClip = grouping[0];
      this.inProgressClips.set(firstClip.id, firstClip);
      parallelClips.push(firstClip.play(this)
        .then(() => {this.inProgressClips.delete(firstClip.id)})
      );

      for (let j = 1; j < grouping.length; ++j) {
        // the start of any clip within a grouping should line up with the beginning of the preceding clip's active phase
        // (akin to PowerPoint timing)
        await grouping[j-1].generateTimePromise('forward', 'activePhase', 'beginning');
        const currAnimClip = grouping[j];
        this.inProgressClips.set(currAnimClip.id, currAnimClip);
        parallelClips.push(currAnimClip.play(this)
          .then(() => {this.inProgressClips.delete(currAnimClip.id)})
        );
      }
      await Promise.all(parallelClips);
    }

    this.inProgress = false;
    this.isRunning = false;
    this.isFinished = true;
    this.wasPlayed = true;
    this.wasRewound = false;
    this.usingFinish = false;
    this.fullyFinished.resolve(this);
    this.onFinish.do();
    return this;
  }

  // rewinds each animClip contained in this AnimSequence instance in reverse order
  /**
   * Rewinds the animation sequence (sequence runs backward).
   * @returns a promise that is resolved when the sequence finishes rewinding.
   * @group Playback Methods
   */
  async rewind(): Promise<this> {
    if (this.inProgress) { return this; }
    this.inProgress = true;
    this.isRunning = true;
    this.handleFinishState();

    const activeGroupings = this.animClipGroupings_backwardActiveFinishOrder;
    const numGroupings = activeGroupings.length;

    this.onFinish.undo();

    for (let i = 0; i < numGroupings; ++i) {
      const activeGrouping = activeGroupings[i];
      const groupingLength = activeGrouping.length;

      // ensure that no clip finishes rewinding its active phase before any clip that should finishing doing so first first (according to the calculated "perfect" timing)
      for (let j = 1; j < groupingLength; ++j) {
        activeGrouping[j].addIntegrityblocks('backward', 'activePhase', 'beginning', [activeGrouping[j-1].generateTimePromise('backward', 'activePhase', 'beginning')]);
      }
    }
    
    let parallelClips: Promise<void>[] = [];
    const groupings = this.animClipGroupings_endDelayFinishOrder;
    const groupingsLength = groupings.length;
    
    for (let i = groupingsLength - 1; i >= 0; --i) {
      parallelClips = [];
      const grouping = groupings[i];
      const groupingLength = grouping.length;
      const lastClip = grouping[groupingLength - 1];
      this.inProgressClips.set(lastClip.id, lastClip);
      parallelClips.push(lastClip.rewind(this)
        .then(() => {this.inProgressClips.delete(lastClip.id)})
      );

      for (let j = groupingLength - 2; j >= 0; --j) {
        const currAnimClip = grouping[j];
        const nextAnimClip = grouping[j + 1];
        // if the current clip intersects the next clip, wait for that intersection time
        if (currAnimClip.fullFinishTime > nextAnimClip.fullStartTime) {
          await nextAnimClip.generateTimePromise('backward', 'whole', currAnimClip.fullFinishTime - nextAnimClip.fullStartTime);
        }
        // otherwise, wait for the next clip to finish rewinding entirely
        else {
          await nextAnimClip.generateTimePromise('backward', 'delayPhase', 'beginning');
        }

        // once waiting period above is over, begin rewinding current clip
        this.inProgressClips.set(currAnimClip.id, currAnimClip);
        parallelClips.push(currAnimClip.rewind(this)
          .then(() => {this.inProgressClips.delete(currAnimClip.id)})
        );
      }
      await Promise.all(parallelClips);
    }

    this.inProgress = false;
    this.isRunning = false;
    this.isFinished = true;
    this.wasPlayed = false;
    this.wasRewound = true;
    this.usingFinish = false;
    this.fullyFinished.resolve(this);
    this.onStart.undo();
    return this;
  }
  
  /**
   * Pauses the animation sequence.
   * - If the sequence is not already in progress, this method does nothing.
   * @group Playback Methods
   */
  pause(): this {
    if (!this.isRunning) { return this; }
    this.isRunning = false;
    this.isPaused = true;
    this.doForInProgressClips(animClip => animClip.pause(this));
    return this;
  }

  /**
   * Unpauses the animation sequence.
   * - If the sequence is not currently paused, this method does nothing.
   * @group Playback Methods
   */
  unpause(): this {
    if (!this.isPaused) { return this; }
    this.isRunning = true;
    this.isPaused = false;
    this.doForInProgressClips(animClip => animClip.unpause(this));
    return this;
  }

  // TODO: check to see if it's necessary to prevent direct finish() calls if sequence has a parent timeline
  /**
   * Forces the animation sequence to instantly finish.
   * - This works even if the animation sequence is not already currently in progress.
   * - The sequence will still pause for any roadblocks generated by {@link AnimClip.addRoadblocks}.
   * - Does not work if the sequence is currently paused.
   * @group Playback Methods
   */
  async finish(): Promise<this> {
    if (this.usingFinish || this.isPaused) { return this; }
    this.usingFinish = true; // resets to false at the end of play() and rewind()

    // if in progress, finish the current clips and let the proceeding ones read from this.usingFinish
    if (this.inProgress) { this.finishInProgressAnimations(); }
    // else, if this sequence is ready to play forward, just play (then all clips will read from this.usingFinish)
    else if (!this.wasPlayed || this.wasRewound) { this.play(); }
    // If sequence is at the end of its playback, finish() does nothing.
    // AnimTimeline calling AnimSequence.finish() in its method for finishing current sequences should still work
    // because that method is only called when sequences are already playing (so it hits the first if-statement)
    return this.fullyFinished.promise;
  }

  // used to skip currently running animation so they don't run at regular speed while using finish()
  /**
   * Forces the animation clips that are currently running within the sequence to instantly finish.
   * - After the currently running animation clips complete, the rest of the sequence runs normally.
   * - The sequence will still pause for any roadblocks generated by {@link AnimClip.addRoadblocks}.
   * @group Playback Methods
   */
  async finishInProgressAnimations(): Promise<this> {
    return this.doForInProgressClips_async(animClip => animClip.finish(this));
  }

  /**
   * Sets the base playback rate of the sequence.
   * @param newRate - the new playback rate
   * @group Playback Methods
   */
  updatePlaybackRate(newRate: number): this {
    this.config.playbackRate = newRate;
    this.useCompoundedPlaybackRate();
    return this;
  }

  /**
   * Multiplies playback rate of parent timeline (if exists) with base playback rate.
   * @group Playback Methods
   * @internal
   */
  useCompoundedPlaybackRate(): this {
    this.doForInProgressClips(animClip => animClip.useCompoundedPlaybackRate());
    return this;
  }

  private static activeBackwardFinishComparator = (clipA: AnimClip, clipB: AnimClip) => clipB.activeStartTime - clipA.activeStartTime;
  private static activeFinishComparator = (clipA: AnimClip, clipB: AnimClip) => clipA.activeFinishTime - clipB.activeFinishTime;
  private static endDelayFinishComparator = (clipA: AnimClip, clipB: AnimClip) => clipA.fullFinishTime - clipB.fullFinishTime;

  // TODO: Complete this method
  private commit(): this {
    const {
      activeBackwardFinishComparator,
      activeFinishComparator,
      endDelayFinishComparator,
    } = AnimSequence;

    let maxFinishTime = 0;
    const animClips = this.animClips;
    const numClips = animClips.length;
    this.animClip_forwardGroupings = [[]];
    this.animClipGroupings_backwardActiveFinishOrder = [];
    this.animClipGroupings_activeFinishOrder = [];
    this.animClipGroupings_endDelayFinishOrder = [];
    let currActiveBackwardFinishGrouping: AnimClip[] = [];
    let currActiveFinishGrouping: AnimClip[] = [];
    let currEndDelayGrouping: AnimClip[] = [];

    for (let i = 0; i < numClips; ++i) {
      const currAnimClip = animClips[i];
      const prevClip = animClips[i-1];
      const startsWithPrev = currAnimClip.getTiming('startsWithPrevious') || prevClip?.getTiming('startsNextClipToo');
      let currStartTime: number;

      if (startsWithPrev || i === 0) {
        // currActiveBackwardFinishGrouping.push(currAnimClip);
        currActiveFinishGrouping.push(currAnimClip);
        currEndDelayGrouping.push(currAnimClip);

        currStartTime = prevClip?.activeStartTime ?? 0;
      }
      else {
        this.animClip_forwardGroupings.push([]);
        currActiveFinishGrouping.sort(activeFinishComparator);
        currEndDelayGrouping.sort(endDelayFinishComparator);
        currActiveBackwardFinishGrouping = [...currEndDelayGrouping].reverse();
        currActiveBackwardFinishGrouping.sort(activeBackwardFinishComparator);
        this.animClipGroupings_backwardActiveFinishOrder.push(currActiveBackwardFinishGrouping);
        this.animClipGroupings_activeFinishOrder.push(currActiveFinishGrouping);
        this.animClipGroupings_endDelayFinishOrder.push(currEndDelayGrouping);
        currActiveBackwardFinishGrouping = [currAnimClip];
        currActiveFinishGrouping = [currAnimClip];
        currEndDelayGrouping = [currAnimClip];

        currStartTime = maxFinishTime;
      }

      this.animClip_forwardGroupings[this.animClip_forwardGroupings.length - 1].push(currAnimClip);

      currAnimClip.fullStartTime = currStartTime;

      maxFinishTime = Math.max(currAnimClip.fullFinishTime, maxFinishTime);
    }

    currActiveFinishGrouping.sort(activeFinishComparator);
    currEndDelayGrouping.sort(endDelayFinishComparator);
    currActiveBackwardFinishGrouping = [...currEndDelayGrouping].reverse();
    currActiveBackwardFinishGrouping.sort(activeBackwardFinishComparator);
    this.animClipGroupings_backwardActiveFinishOrder.push(currActiveBackwardFinishGrouping);
    this.animClipGroupings_activeFinishOrder.push(currActiveFinishGrouping);
    this.animClipGroupings_endDelayFinishOrder.push(currEndDelayGrouping);

    return this;
  }

  // get all currently running animations that belong to this timeline and perform operation() with them
  private doForInProgressClips(operation: AnimationOperation): this {
    for (const animClip of this.inProgressClips.values()) {
      operation(animClip);
    }
    return this;
  }

  private async doForInProgressClips_async(operation: AsyncAnimationOperation): Promise<this> {
    const promises: Promise<unknown>[] = [];
    for (const animClip of this.inProgressClips.values()) {
      promises.push(operation(animClip));
    }
    await Promise.all(promises);
    return this;
  }

  /*-:**************************************************************************************************************************/
  /*-:************************************        TIMING EVENT METHODS        **************************************************/
  /*-:**************************************************************************************************************************/
  // TODO: Write documentation
  /**
   * 
   * @param functions 
   * @returns 
   * @group Timing Event Methods
   */
  setOnStart(functions: {do: Function, undo: Function}): this {
    this.onStart.do = functions.do;
    this.onStart.undo = functions.undo;
    return this;
  }

  /**
   * 
   * @param functions 
   * @returns 
   * @group Timing Event Methods
   */
  setOnFinish(functions: {do: Function, undo: Function}): this { 
    this.onFinish.do = functions.do;
    this.onFinish.undo = functions.undo;
    return this;
  }

  /*-:**************************************************************************************************************************/
  /*-:******************************************        ERRORS        **********************************************************/
  /*-:**************************************************************************************************************************/
  protected generateError: SequenceErrorGenerator = (ErrorClassOrInstance, msg = '<unspecified error>') => {
    return generateError(ErrorClassOrInstance, msg as string, {
      sequence: this,
      timeline: this._parentTimeline
    });
  }

  protected generateLockedStructureError = (methodName: string) => {
    return generateError(
      CustomErrors.LockedOperationError,
      `Cannot use ${methodName}() while the sequence is in progress or in a forward finished state.`
      + errorTip(
        `Tip: Generally, changes cannot be made to the structure of a sequence once it has left its starting point.`
        + ` This is to preserve continuity (once a sequence moves forward, it is locked in history until it is completely rewound).`
      )
    );
  }
}
