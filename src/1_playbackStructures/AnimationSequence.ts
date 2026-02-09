import { AnimClip } from "./AnimationClip";
import { AnimTimeline } from "./AnimationTimeline";
import { CustomErrorClasses, errorTip, generateError, SequenceErrorGenerator } from "../4_utils/errors";
import { getPartial } from "../4_utils/helpers";
import { PickFromArray } from "../4_utils/utilityTypes";
import { webchalk } from "../Webchalk";

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
  jumpTag: string;

  /**
   * If `true`, the next sequence in the same timeline will automatically play after this sequence finishes.
   *  * If this sequence is not part of a timeline or is at the end of a timeline, this option has no effect.
   * @defaultValue
   * ```ts
   * false
   * ```
   */
  autoplaysNextSequence: boolean;

  /**
   * If `true`, this sequence will automatically play after the previous sequence in the same timeline finishes.
   *  * If this sequence is not part of a timeline or is at the beginning of a timeline, this option has no effect.
   * @defaultValue
   * ```ts
   * false
   * ```
   * 
   */
  autoplays: boolean;

  /**
   * The base playback rate of the sequence (ignoring any multipliers from a parent timeline).
   *  * Example: A value of `1` means 100% (the typical playback rate), and `0.5` means 50% speed.
   *  * Example: If the `playbackRate` of the parent timeline is `4` and the `playbackRate` of this sequence is `5`,
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
   *  * Example: If the `playbackRate` of the parent timeline is `4` and the `playbackRate` of this sequence is `5`,
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
   *  * Resets to `false` once the sequence has finished being rewound.
   */
  wasPlayed: boolean;

  /**
   * `true` only if the sequence has finished being rewound and not finished being played.
   *  * Resets to `false` once the sequence has finished being rewound.
   * (if played at all).
   */
  wasRewound: boolean;

  /**
   * Shows whether the sequence is currently allowed to accept changes to its structure.
   * `true` only if the sequence is in progress or in a forward finished state.
   *  * Operations like {@link AnimSequence.addClips | addClips()}, {@link AnimSequence.removeClips | removeClips()},
   * etc. check whether the structure is locked before proceeding.
   *  * Any time the sequence goes back to its starting point after fully rewinding, its structure is unlocked
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

// TYPE
/**
 * Options specifying the location at which the clips should be inserted in {@link AnimSequence.addClips}.
 * @category hidden
 */
export type AddClipsOptions = {
  /**
   * Index at which the clips should be added.
   */
  atIndex: number;
};

// CLASS
/**
 * @hideconstructor
 * 
 * @groupDescription Property Getter Methods
 * Methods that return objects that contain various internal fields of the sequence (such as `autoplays` from `getTiming()`,
 * `inProgress` from `getStatus()`, etc.).
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
 * Methods and/or fields related to the structure of the sequence, including methods related to the clips that make up
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
    jumpTag: '',
  };

  /**
   * Returns an object containing the configuration options used to
   * define the timing, jump tag, and description of the animation sequence.
   * @returns An object containing
   *  * {@link AnimSequenceConfig.autoplays|autoplays},
   *  * {@link AnimSequenceConfig.autoplaysNextSequence|autoplaysNextSequence},
   *  * {@link AnimSequenceConfig.description|description},
   *  * {@link AnimSequenceConfig.playbackRate|playbackRate},
   *  * {@link AnimSequenceConfig.jumpTag|jumpTag},
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
   *  * If the sequence is nested within an {@link AnimTimeline}: that timeline,
   *  * Else: the sequence itself
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
   * @returns An object containing
   *  * {@link AnimSequenceStatus.inProgress|inProgress},
   *  * {@link AnimSequenceStatus.isPaused|isPaused},
   *  * {@link AnimSequenceStatus.isRunning|isRunning},
   *  * {@link AnimSequenceStatus.skippingOn|skippingOn},
   *  * {@link AnimSequenceStatus.isFinished|isFinished},
   *  * {@link AnimSequenceStatus.usingFinish|usingFinish},
   *  * {@link AnimSequenceStatus.wasPlayed|wasPlayed},
   *  * {@link AnimSequenceStatus.wasRewound|wasRewound},
   *  * {@link AnimSequenceStatus.lockedStructure|lockedStructure},
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
   * @returns An object containing
   *  * {@link AnimSequenceTiming.autoplays|autoplays},
   *  * {@link AnimSequenceTiming.autoplaysNextSequence|autoplaysNextSequence},
   *  * {@link AnimSequenceTiming.compoundedPlaybackRate|compoundedPlaybackRate},
   *  * {@link AnimSequenceTiming.playbackRate|playbackRate},
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

  // GROUP: Description and Jump tag
  /**
   * @returns The {@link AnimSequenceConfig.description|description} for this sequence.
   * @see {@link AnimSequenceConfig.description}
   * @group Property Getter Methods
   */
  getDescription() { return this.config.description; }

  /**
   * @returns The {@link AnimSequenceConfig.jumpTag|jumpTag} for this sequence.
   * @see {@link AnimSequenceConfig.jumpTag|jumpTag}
   * @group Property Getter Methods
   */
  getJumpTag() { return this.config.jumpTag; }
  
  /**
   * Sets the {@link AnimSequenceConfig.description|description} for this sequence.
   * @param description - new description
   * @see {@link AnimSequenceConfig.description}
   * @group Property Setter Methods
   */
  setDescription(description: string): this { this.config.description = description; return this; }

  /**
   * Sets the {@link AnimSequenceConfig.jumpTag|jumpTag} for this sequence.
   * @param jumpTag - new jump tag
   * @see {@link AnimSequenceConfig.jumpTag}
   * @group Property Setter Methods
   */
  setJumpTag(jumpTag: string): this { this.config.jumpTag = jumpTag; return this; }

  /*-:**************************************************************************************************************************/
  /*-:*********************************        CONSTRUCTOR & INITIALIZERS        ***********************************************/
  /*-:**************************************************************************************************************************/
  /**@internal*/
  static createInstance(config: Partial<AnimSequenceConfig> | AnimClip[] = {}, animClips?: AnimClip[]): AnimSequence {
    return new AnimSequence(config, animClips);
  }

  // constructor(config: Partial<AnimSequenceConfig>, ...animClips: AnimClip[]);
  // constructor(...animClips: AnimClip[]);
  constructor(configOrClips: Partial<AnimSequenceConfig> | AnimClip[], animClips?: AnimClip[]) {
    if (webchalk.sequenceCreatorLock) {
      throw this.generateError(TypeError, `Illegal constructor. Sequences can only be instantiated using webchalk.newSequence().`);
    }
    webchalk.sequenceCreatorLock = true;
    
    this.id = AnimSequence.id++;

    // If first argument is an AnimClip[], add clips to sequence.
    // Else, it must be a configuration object. Assign its values to this sequence's configuration object
    if (configOrClips instanceof Array) {
      this.addClips(configOrClips);
    }
    else {
      Object.assign<AnimSequenceConfig, Partial<AnimSequenceConfig>>(this.config, configOrClips);
      this.addClips(animClips ?? []);
    }
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
   * Adds {@link AnimClip} objects to the end of the sequence.
   * @param animClips - array of animation clips to add
   * @returns 
   * @group Structure
   */
  addClips(animClips: AnimClip[]): this;
  // TODO: prevent play() and rewind() when sequence contains undefined entries (I don't think this will ever happen?)
  /**
   * Adds {@link AnimClip} objects to the specified location within the sequence.
   * @param location - options specifying the location at which the clips should be inserted
   * @param animClips - array of animation clips to add
   * @returns 
   * @group Structure
   */
  addClips(location: AddClipsOptions, animClips: AnimClip[]): this;
  addClips(locationOrClips: AddClipsOptions | AnimClip[], animClips: AnimClip[] = []): this {
    if (this.lockedStructure) { throw this.generateLockedStructureError(this.addClips.name); }

    const [clips, loc] = (locationOrClips instanceof Array)
      ? [locationOrClips, undefined]
      : [animClips, locationOrClips];

    for (let i = 0; i < clips.length; ++i) {
      const animClip = clips[i];
      if (!(animClip instanceof AnimClip)) {
        throw this.generateError(CustomErrorClasses.InvalidChildError, `At least one of the objects being added is not an AnimClip.`);
      }

      if (animClip.parentSequence) {
        // TODO: Improve error message
        throw this.generateError(CustomErrorClasses.InvalidChildError, `At least one of the clips being added is already part of some sequence.`);
      }
      
      if (!AnimSequence.isValidTimescaleAdjacency(animClip, clips[i + 1])) {
        // TODO: Create custom error
        throw this.generateError(Error,
          `Illegal clip insertion. Clips that use a rate cannot start with ('startWithPrev' or 'startsNextClipToo') clips that use a duration, but the array of clips you attempted to insert has this issue between indices ${i} and ${i + 1}.`
        );
      }
    }

    // check to see if clips that would become adjacent to the first and last to-be-inserted clips...
    // ... would case timescaleType adjacent issues
    const prevAnimClip = loc ? animClips[loc.atIndex - 1] : animClips[animClips.length - 1];
    const nextAnimClip = loc ? animClips[loc.atIndex] : undefined;
    const firstInserted = clips[0];
    const lastInserted = clips[clips.length - 1];
    if (!AnimSequence.isValidTimescaleAdjacency(prevAnimClip, firstInserted)
      || !AnimSequence.isValidTimescaleAdjacency(lastInserted, nextAnimClip)
    ) {
      // TODO: Create custom error
      throw this.generateError(Error,
        `Illegal clip insertion. Clips that use a rate cannot start with ('startWithPrev' or 'startsNextClipToo') clips that use a duration, but the first or last clip you attempted to insert would cause this issue if placed at the specified location.`
      );
    }

    // confirm insertion
    if (loc) { this.animClips.splice(loc.atIndex, 0, ...clips); }
    else { this.animClips.push(...clips); }

    for (let i = 0; i < clips.length; ++i) {
      clips[i].setLineage(this, this._parentTimeline);
    }

    return this;
  }

  /**
   * Removes specified {@link AnimClip} objects from the sequence.
   * @param animClips - array of animation clips to remove
   * @returns 
   * @group Structure
   */
  removeClips(animClips: AnimClip[]): this {
    if (this.lockedStructure) { throw this.generateLockedStructureError(this.removeClips.name); }

    const animClipsCopy = [...this.animClips];
    const removedClips: AnimClip[] = [];

    for (let i = 0; i < animClips.length; ++i) {
      const index = this.findClipIndex(animClips[i]);
      if (index === -1) {
        // TODO: improve warning
        console.warn(`At least one of the clips being removed from this sequence was already not in the sequence.`);
        return this;
      }
      removedClips.push(...animClipsCopy.splice(index, 1));
    }

    // check for timeScaleType parallel issues within remaining clips
    for (let i = 0; i < animClipsCopy.length - 1; ++i) {
      if (!AnimSequence.isValidTimescaleAdjacency(animClipsCopy[i], animClipsCopy[i + 1])) {
        // TODO: Create custom error
        throw this.generateError(Error,
          `Illegal clip removal. Clips that use a rate cannot start with ('startWithPrev' or 'startsNextClipToo') clips that use a duration, and we detected that removing the specified clips would cause the remaining clips to face this issue.`
        );
      }
    }
    
    // confirm deletion
    for (let i = 0; i < removedClips.length; ++i) {
      removedClips[i].removeLineage();
    }

    this.animClips = animClipsCopy;

    // TODO: return the array of removed clips
    return this;
  }
  
  /**
   * Removes a number of {@link AnimClip} objects from the sequence based on the provided indices range (0-based).
   * @param startIndex - the starting index, inclusive
   * @param endIndex - the ending index, exclusive (if not specified, {@link startIndex} `+ 1` is used, removing one clip)
   * @returns An array containing the clips that were removed from the sequence.
   * @group Structure
   */
  removeClipsAt(startIndex: number, endIndex: number = startIndex + 1): AnimClip[] {
    if (this.lockedStructure) { throw this.generateLockedStructureError(this.removeClipsAt.name); }

    const animClipsCopy = [...this.animClips];
    const removedClips = animClipsCopy.splice(startIndex, endIndex - startIndex);
    
    // check to see if the clips on either side of the removal are allowed to be adjacent
    if (!AnimSequence.isValidTimescaleAdjacency(animClipsCopy[startIndex - 1], animClipsCopy[startIndex])) {
      // TODO: Create custom error
      throw this.generateError(Error,
        `Illegal clip removal. Clips that use a rate cannot start with ('startWithPrev' or 'startsNextClipToo') clips that use a duration, and we detected that removing the specified clips would cause the remaining clips to face this issue.`
      );
    }

    // confirm deletion
    for (let i = 0; i < removedClips.length; ++i) {
      removedClips[i].removeLineage();
    }

    this.animClips = animClipsCopy;

    return removedClips;
  }

  /**
   * Finds the index of a given {@link AnimClip} object within the sequence
   * @param animClip - the animation clip to search for within the sequence
   * @returns The index of {@link animClip} within the sequence or `-1` if the clip is not part of the sequence.
   * @group Structure
   */
  findClipIndex(animClip: AnimClip): number {
    return this.animClips.findIndex((_animClip) => _animClip === animClip);
  }

  /**
   * Checks to see whether the specified clips are allowed to be adjacent given their timing and {@link AnimClip.timescaleType | timescaleType}.
   * @param leftClip - the clip presumably prior to {@link rightClip}
   * @param rightClip - the clip presumably following {@link leftClip}
   * @returns `true` if {@link leftClip} and {@link rightClip} are allowed to be adjacent.
   * 
   * @see {@link AnimClip.timescaleType}
   */
  private static isValidTimescaleAdjacency(leftClip: AnimClip | undefined, rightClip: AnimClip | undefined): boolean {
    return (leftClip === undefined || rightClip === undefined)
      || ( !leftClip.getTiming('startsNextClipToo') && !rightClip.getTiming('startsWithPrevious') )
      || ( leftClip.getTiming('timescaleType') === rightClip.getTiming('timescaleType') );
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
   * @returns A promise that is resolved when the sequence finishes playing.
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
    const indicesOfRateGroupings: number[] = [];
    // const activeGroupings2 = this.animClipGroupings_endDelayFinishOrder;
    const numGroupings = activeGroupings.length;

    for (let i = 0; i < numGroupings; ++i) {
      const activeGrouping = activeGroupings[i];
      // TODO: probably want to reincorporate this
      // const activeGrouping2 = activeGroupings2[i];
      const groupingLength = activeGrouping.length;

      if (activeGrouping[0].getTiming('timescaleType') === 'duration') {
        // ensure that no clip finishes its active phase before any clip that should finish its active phase first (according to the calculated "perfect" timing)
        for (let j = 1; j < groupingLength; ++j) {
          activeGrouping[j].addIntegrityblock('activePhase', 'end', { onPlay: () => activeGrouping[j-1].schedulePromise('forward', 'activePhase', 'end') });
          // activeGrouping2[j].animation.addIntegrityblocks('forward', 'endDelayPhase', 'end', activeGrouping2[j-1].animation.getFinished('forward', 'endDelayPhase'));
        }
      }
      else {
        indicesOfRateGroupings.push(i);
      }
    }

    let parallelClips: Promise<void>[] = [];
    for (let i = 0; i < this.animClip_forwardGroupings.length; ++i) {
      parallelClips = [];
      const grouping = this.animClip_forwardGroupings[i];
      const isRateGrouping = indicesOfRateGroupings.includes(i);
      const firstClip = grouping[0];
      this.inProgressClips.set(firstClip.id, firstClip);
      let resolve: () => void = () => {};
      parallelClips.push(firstClip.play(this)
        .then(() => {this.inProgressClips.delete(firstClip.id)})
      );
      if (isRateGrouping) {
        const prom = Promise.withResolvers<void>();
        resolve = prom.resolve;
        // firstClip.scheduleTask('activePhase', 'end', {onPlay: async () => await prom.promise}, {frequencyLimit: 1});
      }

      for (let j = 1; j < grouping.length; ++j) {
        // the start of any clip within a grouping should line up with the beginning of the preceding clip's active phase
        // (akin to PowerPoint timing)
        await grouping[j-1].schedulePromise('forward', 'activePhase', 'beginning');
        const currAnimClip = grouping[j];
        this.inProgressClips.set(currAnimClip.id, currAnimClip);
        parallelClips.push(currAnimClip.play(this)
          .then(() => {this.inProgressClips.delete(currAnimClip.id)})
        );
      }

      if (isRateGrouping) {
        console.log('about to compute rate commission');
        this.commitForRate(i);
        // ensure that no clip finishes its active phase before any clip that should finish its active phase first (according to the calculated "perfect" timing)
        for (let j = 1; j < grouping.length; ++j) {
          activeGroupings[i][j].addIntegrityblock('activePhase', 'end', { onPlay: () => activeGroupings[i][j-1].schedulePromise('forward', 'activePhase', 'end') });
          // activeGrouping2[j].animation.addIntegrityblocks('forward', 'endDelayPhase', 'end', activeGrouping2[j-1].animation.getFinished('forward', 'endDelayPhase'));
        }
      }

      resolve?.();

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
   * @returns A promise that is resolved when the sequence finishes rewinding.
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
        activeGrouping[j].addIntegrityblock('activePhase', 'beginning', { onRewind: () => activeGrouping[j-1].schedulePromise('backward', 'activePhase', 'beginning') });
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
          await nextAnimClip.schedulePromise('backward', 'whole', currAnimClip.fullFinishTime - nextAnimClip.fullStartTime);
        }
        // otherwise, wait for the next clip to finish rewinding entirely
        else {
          await nextAnimClip.schedulePromise('backward', 'delayPhase', 'beginning');
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
   *  * If the sequence is not already in progress, this method does nothing.
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
   *  * If the sequence is not currently paused, this method does nothing.
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
   *  * This works even if the animation sequence is not already currently in progress.
   *  * The sequence will still pause for any tasks generated by {@link AnimClip.scheduleTask}.
   *  * Does not work if the sequence is currently paused.
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
   *  * After the currently running animation clips complete, the rest of the sequence runs normally.
   *  * The sequence will still pause for any tasks generated by {@link AnimClip.scheduleTask}.
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

    let currTimeScaleType: 'duration' | 'rate' = animClips[0].getTiming('timescaleType');

    for (let i = 0; i < numClips; ++i) {
      const currAnimClip = animClips[i];
      const prevClip = animClips[i-1];
      const startsWithPrev = currAnimClip.getTiming('startsWithPrevious') || prevClip?.getTiming('startsNextClipToo');
      let currStartTime: number = 0;

      // the current clip is in a grouping of parallel clips or the first clip in the sequence
      if (startsWithPrev || i === 0) {
        // currActiveBackwardFinishGrouping.push(currAnimClip);
        currActiveFinishGrouping.push(currAnimClip);
        currEndDelayGrouping.push(currAnimClip);
        
        if (currTimeScaleType === 'duration') {
          currStartTime = prevClip?.activeStartTime ?? 0;
        }
      }
      // the current clip is starting a new grouping of parallel clips
      else {
        currTimeScaleType = currAnimClip.getTiming('timescaleType');
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

      if (currTimeScaleType === 'duration') {
        maxFinishTime = Math.max(currAnimClip.fullFinishTime, maxFinishTime);
      }
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

  private commitForRate(indexOfGrouping: number): void {
    const {
      activeBackwardFinishComparator,
      activeFinishComparator,
      endDelayFinishComparator,
    } = AnimSequence;

    // let maxFinishTime = 0;
    const currActiveFinishGrouping: AnimClip[] = this.animClipGroupings_activeFinishOrder[indexOfGrouping];
    const currEndDelayGrouping: AnimClip[] = this.animClipGroupings_endDelayFinishOrder[indexOfGrouping];
    const forwardGrouping: AnimClip[] = this.animClip_forwardGroupings[indexOfGrouping];

    for (let i = 0; i < forwardGrouping.length; ++i) {
      const currAnimClip = forwardGrouping[i];
      const prevClip = forwardGrouping[i-1];

      let currStartTime: number;

      // // currActiveBackwardFinishGrouping.push(currAnimClip);
      // currActiveFinishGrouping.push(currAnimClip);
      // currEndDelayGrouping.push(currAnimClip);

      currStartTime = prevClip?.activeStartTime ?? 0;
      currAnimClip.fullStartTime = currStartTime;

      // maxFinishTime = Math.max(currAnimClip.fullFinishTime, maxFinishTime);
    }

    currActiveFinishGrouping.sort(activeFinishComparator);
    currEndDelayGrouping.sort(endDelayFinishComparator);
    const currActiveBackwardFinishGrouping = [...currEndDelayGrouping].reverse();
    currActiveBackwardFinishGrouping.sort(activeBackwardFinishComparator);
    this.animClipGroupings_backwardActiveFinishOrder[indexOfGrouping] = currActiveBackwardFinishGrouping;
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
      CustomErrorClasses.LockedOperationError,
      `Cannot use ${methodName}() while the sequence is in progress or in a forward finished state.`
      + errorTip(
        `Tip: Generally, changes cannot be made to the structure of a sequence once it has left its starting point.`
        + ` This is to preserve continuity (once a sequence moves forward, it is locked in history until it is completely rewound).`
      )
    );
  }
}
