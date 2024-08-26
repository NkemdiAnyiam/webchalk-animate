import { AnimSequence } from "./AnimSequence";
import { errorTip, generateError, TimelineErrorGenerator } from "./utils/errors";
import { WbfkPlaybackButton } from "./WbfkPlaybackButton";

export type AnimTimelineConfig = {
  timelineName: string;
  debugMode: boolean;
  autoLinksButtons: boolean;
};

type SequenceOperation = (sequence: AnimSequence) => void;
type AsyncSequenceOperation = (sequence: AnimSequence) => Promise<unknown>;


// playback button class constants
const PRESSED = 'playback-button--pressed';
const DISABLED_FROM_STEPPING = 'playback-button--disabledFromStepping';
const DISABLED_POINTER_FROM_STEPPING = 'playback-button--disabledPointerFromStepping'; // disables pointer
const DISABLED_FROM_EDGE = 'playback-button--disabledFromTimelineEdge'; // disables pointer and grays out button
const DISABLED_FROM_PAUSE = 'playback-button--disabledFromPause';

type PlaybackButtons = {
  [key in `${'forward' | 'backward' | 'pause' | 'toggleSkipping' | 'fastForward'}Button`]: WbfkPlaybackButton | null | undefined;
};
type PlaybackButtonPurpose = `Step ${'Forward' | 'Backward'}` | 'Pause' | 'Fast Forward' | 'Toggle Skipping';

export class AnimTimeline {
  private static id = 0;

  readonly id; // used to uniquely identify this specific timeline
  get root(): AnimTimeline { return this; }
  /**@internal*/ animSequences: AnimSequence[] = []; // array of every AnimSequence in this timeline
  /**@internal*/ loadedSeqIndex = 0; // index into animSequences
  /**@internal*/ isAnimating = false; // true if currently in the middle of executing animations; false otherwise
  /**@internal*/ skippingOn = false; // used to determine whether or not all animations should be instantaneous
  /**@internal*/ isPaused = false;
  /**@internal*/ currentDirection: 'forward' | 'backward' = 'forward'; // set to 'forward' after stepForward() or 'backward' after stepBackward()
  /**@internal*/ isJumping = false; // true if currently using jumpTo()
  playbackRate = 1;
  config: AnimTimelineConfig;
  // CHANGE NOTE: AnimTimeline now stores references to in-progress sequences and also does not act directly on individual animations
  private inProgressSequences: Map<number, AnimSequence> = new Map();

  getStatus() {
    return {
      isAnimating: this.isAnimating,
      skippingOn: this.skippingOn,
      isPaused: this.isPaused,
      currentDirection: this.currentDirection,
      isJumping: this.isJumping,
      stepNumber: this.stepNumber,
      atBeginning: this.atBeginning,
      atEnd: this.atEnd,
    };
  }

  playbackButtons: PlaybackButtons = {
    backwardButton: null,
    fastForwardButton: null,
    forwardButton: null,
    pauseButton: null,
    toggleSkippingButton: null
  };

  get numSequences(): number { return this.animSequences.length; }

  /**@internal*/
  static createInstance(config: Partial<AnimTimelineConfig> | AnimSequence = {}, ...animSequences: AnimSequence[]): AnimTimeline {
    return new AnimTimeline(config, ...animSequences);
  }

  private get atBeginning(): boolean { return this.loadedSeqIndex === 0; }
  private get atEnd(): boolean { return this.loadedSeqIndex === this.numSequences; }
  private get stepNumber(): number { return this.loadedSeqIndex + 1; }

  constructor(configOrSequence: Partial<AnimTimelineConfig>| AnimSequence = {}, ...animSequence: AnimSequence[]) {
    this.id = AnimTimeline.id++;

    this.config = {
      debugMode: false,
      timelineName: '',
      autoLinksButtons: true,
      ...(configOrSequence instanceof AnimSequence ? {} : configOrSequence),
    };

    this.addSequences(...(configOrSequence instanceof AnimSequence ? [configOrSequence, ...animSequence] : animSequence));

    if (this.config.autoLinksButtons) {
      this.playbackButtons = this.linkPlaybackButtons();
    }
  }

  // TODO: make it possible to not completely replace all buttons every time this method is called
  linkPlaybackButtons(options: Partial<{searchRoot: HTMLElement, buttonsSubset: PlaybackButtonPurpose[]}> = {}): typeof this.playbackButtons {
    const {
      searchRoot,
      buttonsSubset = [`Step Forward`, `Step Backward`, `Fast Forward`, `Pause`, `Toggle Skipping`],
    } = options;
    const potentialButtonsContainer = (searchRoot ?? document).querySelector(`[timeline-name="${this.config.timelineName}"]`);

    // find the button if it has the correct timeline-name directly on it
    const getButtonDirect = (action: WbfkPlaybackButton['action']) => (searchRoot ?? document).querySelector<WbfkPlaybackButton>(`wbfk-playback-button[action="${action}"][timeline-name="${this.config.timelineName}"]`);
    // find the button if it is nested in a container with the correct timeline-name and does not have a timeline-name of its own
    const getButtonGroupChild = (action: WbfkPlaybackButton['action']) => potentialButtonsContainer?.querySelector<WbfkPlaybackButton>(`wbfk-playback-button[action="${action}"]:not([timeline-name])`);
    // search for button directly, then search for child of button group
    const getButton = (action: WbfkPlaybackButton['action']) => getButtonDirect(action) ?? getButtonGroupChild(action);

    const forwardButton = buttonsSubset.includes('Step Forward') ? getButton("step-forward") : undefined;
    const backwardButton = buttonsSubset.includes('Step Backward') ? getButton("step-backward") : undefined;
    const pauseButton = buttonsSubset.includes('Pause') ? getButton("pause") : undefined;
    const fastForwardButton = buttonsSubset.includes('Fast Forward') ? getButton("fast-forward") : undefined;
    const toggleSkippingButton = buttonsSubset.includes('Toggle Skipping') ? getButton("toggle-skipping") : undefined;

    if (forwardButton) {
      forwardButton.activate = () => {
        if (this.isAnimating || this.isPaused || this.atEnd) { return; }
        
        forwardButton.styleActivation();
        this.step('forward', {viaButton: true}).then(() => { forwardButton.styleDeactivation(); });
      }
      forwardButton.styleActivation = () => {
        const backwardButton = this.playbackButtons.backwardButton;
        forwardButton.classList.add(PRESSED);
        backwardButton?.classList.remove(DISABLED_FROM_EDGE); // if stepping forward, we of course won't be at the left edge of timeline
        backwardButton?.classList.add(DISABLED_FROM_STEPPING);
        forwardButton.classList.add(DISABLED_POINTER_FROM_STEPPING);
      };
      forwardButton.styleDeactivation = () => {
        const backwardButton = this.playbackButtons.backwardButton;
        forwardButton.classList.remove(PRESSED);
        forwardButton.classList.remove(DISABLED_POINTER_FROM_STEPPING);
        backwardButton?.classList.remove(DISABLED_FROM_STEPPING);
        if (this.atEnd) { forwardButton.classList.add(DISABLED_FROM_EDGE); }
      };
    }

    if (backwardButton) {
      const forwardButton = this.playbackButtons.forwardButton;
      backwardButton.activate = () => {
        if (this.isAnimating || this.isPaused || this.atBeginning) { return; }

        backwardButton.styleActivation();
        this.step('backward', {viaButton: true}).then(() => { backwardButton.styleDeactivation(); });
      };

      backwardButton.styleActivation = () => {
        const forwardButton = this.playbackButtons.forwardButton;
        backwardButton.classList.add(PRESSED);
        forwardButton?.classList.remove(DISABLED_FROM_EDGE);
        forwardButton?.classList.add(DISABLED_FROM_STEPPING);
        backwardButton.classList.add(DISABLED_POINTER_FROM_STEPPING);
      };
      backwardButton.styleDeactivation = () => {
        const forwardButton = this.playbackButtons.forwardButton;
        backwardButton.classList.remove(PRESSED);
        forwardButton?.classList.remove(DISABLED_FROM_STEPPING);
        backwardButton.classList.remove(DISABLED_POINTER_FROM_STEPPING);
        if (this.atBeginning) { backwardButton.classList.add(DISABLED_FROM_EDGE); }
      };

      backwardButton.classList.add(DISABLED_FROM_EDGE);
    }

    if (pauseButton) {
      pauseButton.activate = () => {
        pauseButton.styleActivation();
        this.pause({viaButton: true});
      };
      pauseButton.deactivate = () => {
        pauseButton.styleDeactivation();
        this.unpause({viaButton: true});
      };

      pauseButton.styleActivation = () => {
        const forwardButton = this.playbackButtons.forwardButton;
        const backwardButton = this.playbackButtons.backwardButton;
        pauseButton.active = true;
        pauseButton.classList.add(PRESSED);
        forwardButton?.classList.add(DISABLED_FROM_PAUSE);
        backwardButton?.classList.add(DISABLED_FROM_PAUSE);
      };
      pauseButton.styleDeactivation = () => {
        const forwardButton = this.playbackButtons.forwardButton;
        const backwardButton = this.playbackButtons.backwardButton;
        pauseButton.active = false;
        pauseButton.classList.remove(PRESSED);
        forwardButton?.classList.remove(DISABLED_FROM_PAUSE);
        backwardButton?.classList.remove(DISABLED_FROM_PAUSE);
      };
    }

    if (fastForwardButton) {
      fastForwardButton.activate = () => {
        fastForwardButton.styleActivation();
        this.setPlaybackRate(7);
      };
      fastForwardButton.deactivate = () => {
        fastForwardButton.styleDeactivation();
        this.setPlaybackRate(1);
      };

      fastForwardButton.styleActivation = () => {
        fastForwardButton.active = true;
        fastForwardButton.classList.add(PRESSED);
      };
      fastForwardButton.styleDeactivation = () => {
        fastForwardButton.active = false;
        fastForwardButton.classList.remove(PRESSED);
      };
    }

    if (toggleSkippingButton) {
      toggleSkippingButton.activate = () => {
        toggleSkippingButton.styleActivation();
        this.toggleSkipping({forceState: 'on', viaButton: true});
      }
      toggleSkippingButton.deactivate = () => {
        toggleSkippingButton.styleDeactivation();
        this.toggleSkipping({forceState: 'off', viaButton: true});
      };
      toggleSkippingButton.styleActivation = () => {
        toggleSkippingButton.classList.add(PRESSED);
        toggleSkippingButton.active = true;
      };
      toggleSkippingButton.styleDeactivation = () => {
        toggleSkippingButton.classList.remove(PRESSED);
        toggleSkippingButton.active = false;
      };
    }

    let wasWarned = false;
    const warnedList: string[] = [];

    const warnButton = (button: WbfkPlaybackButton | null | undefined, purpose: PlaybackButtonPurpose) => {
      if (!button && buttonsSubset.includes(purpose)) {
        warnedList.push(purpose);
        wasWarned = true;
      }
    }

    warnButton(forwardButton, 'Step Forward');
    warnButton(pauseButton, 'Pause');
    warnButton(backwardButton, 'Step Backward');
    warnButton(fastForwardButton, 'Fast Forward');
    warnButton(toggleSkippingButton, 'Toggle Skipping');
    if (wasWarned) {
      console.warn(
        `Some buttons for timeline named "${this.config.timelineName}" not found.`
        + ` Missing buttons: ${warnedList.join(', ')}.`
        + errorTip(
          `For <wbfk-playback-button> tags to be detected, their 'timeline-name' attribute (or the 'timeline-name' attribute of`
          + ` their parent container) must match this timeline's 'timelineName' configuration option.`
          + ` If this timeline does not need to detect any buttons, you may set its 'autoLinkButtons' config option to false`
        + ` to prevent this warning.`)
      );
    }

    return {
      forwardButton, backwardButton, pauseButton, fastForwardButton, toggleSkippingButton,
    };
  }

  addSequences(...animSequences: AnimSequence[]): this {
    for(const animSequence of animSequences) {
      animSequence.setLineage(this);
    };
    this.animSequences.push(...animSequences);

    return this;
  }

  findSequenceIndex(animSequence: AnimSequence): number {
    return this.animSequences.findIndex((_animSequence) => _animSequence === animSequence);
  }

  // CHANGE NOTE: sequences, and clips now have base playback rates that are then compounded by parents
  setPlaybackRate(rate: number): this {
    this.playbackRate = rate;
    // set playback rates of currently running animations so that they don't continue to run at regular speed
    this.doForInProgressSequences(sequence => sequence.useCompoundedPlaybackRate());

    return this;
  }

  // steps forward or backward and does error-checking
  async step(direction: 'forward' | 'backward'): Promise<this>;
  /**@internal*/
  async step(direction: 'forward' | 'backward', options: {viaButton: boolean}): Promise<this>;
  async step(direction: 'forward' | 'backward', options?: {viaButton: boolean}): Promise<this> {
    if (this.isPaused) { throw new Error('Cannot step while playback is paused.'); }
    if (this.isAnimating) { throw new Error('Cannot step while already animating.'); }
    this.isAnimating = true;

    let continueOn;
    switch(direction) {
      case 'forward':
        if (!options?.viaButton) { this.playbackButtons.forwardButton?.styleActivation(); }
        // reject promise if trying to step forward at the end of the timeline
        if (this.atEnd) { return new Promise((_, reject) => {this.isAnimating = false; reject('Cannot stepForward() at end of timeline.')}); }
        do {continueOn = await this.stepForward();} while(continueOn);
        if (!options?.viaButton) { this.playbackButtons.forwardButton?.styleDeactivation(); }
        break;

      case 'backward':
        if (!options?.viaButton) { this.playbackButtons.backwardButton?.styleActivation(); }
        // reject promise if trying to step backward at the beginning of the timeline
        if (this.atBeginning) { return new Promise((_, reject) => {this.isAnimating = false; reject('Cannot stepBackward() at beginning of timeline.')}); }
        do {continueOn = await this.stepBackward();} while(continueOn);
        if (!options?.viaButton) { this.playbackButtons.backwardButton?.styleDeactivation(); }
        break;

      default:
        throw new Error(`Invalid step direction "${direction}". Must be "forward" or "backward".`);
    }

    this.isAnimating = false;
    return this;
  }

  // plays current AnimSequence and increments loadedSeqIndex
  private async stepForward(): Promise<boolean> {
    this.currentDirection = 'forward';
    const sequences = this.animSequences;

    if (this.config.debugMode) { console.log(`-->> ${this.loadedSeqIndex}: ${sequences[this.loadedSeqIndex].getDescription()}`); }

    const toPlay = sequences[this.loadedSeqIndex];
    this.inProgressSequences.set(toPlay.id, toPlay);
    await sequences[this.loadedSeqIndex].play(); // wait for the current AnimSequence to finish all of its animations
    this.inProgressSequences.delete(toPlay.id);

    ++this.loadedSeqIndex;
    const autoplayNext = !this.atEnd && (
      sequences[this.loadedSeqIndex - 1].autoplaysNextSequence // sequence that was just played
      || sequences[this.loadedSeqIndex].autoplays // new next sequence
    );

    return autoplayNext;
  }

  // decrements loadedSeqIndex and rewinds the AnimSequence
  private async stepBackward(): Promise<boolean> {
    this.currentDirection = 'backward';
    const prevSeqIndex = --this.loadedSeqIndex;
    const sequences = this.animSequences;

    if (this.config.debugMode) { console.log(`<<-- ${prevSeqIndex}: ${sequences[prevSeqIndex].getDescription()}`); }

    const toRewind = sequences[prevSeqIndex];
    this.inProgressSequences.set(toRewind.id, toRewind);
    await sequences[prevSeqIndex].rewind();
    this.inProgressSequences.delete(toRewind.id);
    
    const autorewindPrevious = !this.atBeginning && (
      sequences[prevSeqIndex - 1].autoplaysNextSequence // new prev sequence
      || sequences[prevSeqIndex].autoplays // sequence that was just rewound
    );

    return autorewindPrevious;
  }

  jumpToSequenceTag(
    tag: string | RegExp,
    options: Partial<{
      search: 'forward-from-beginning' | 'backward-from-end' | 'forward' | 'backward';
      searchOffset: number;
      targetOffset: number;
      autoplayDetection: 'forward' | 'backward' | 'none';
    }> = {},
  ): Promise<this> {
    const {
      search = 'forward-from-beginning',
      targetOffset = 0,
      searchOffset = 0,
      autoplayDetection = 'none',
    } = options;
    return this.jumpTo({ tag, search, searchOffset, targetOffset, autoplayDetection });
  }

  jumpToPosition(
    position: 'beginning' | 'end' | number,
    options: Partial<{targetOffset: number; autoplayDetection: 'forward' | 'backward' | 'none';}> = {},
  ): Promise<this> {
    const {
      targetOffset = 0,
      autoplayDetection = 'none',
    } = options;
    return this.jumpTo({ position, targetOffset, autoplayDetection });
  }

  // immediately jumps to an AnimSequence in animSequences with the matching search arguments
  private async jumpTo(options: {
    tag: string | RegExp;
    search: 'forward' | 'backward' | 'forward-from-beginning' | 'backward-from-end';
    searchOffset: number;
    targetOffset: number;
    autoplayDetection: 'forward' | 'backward' | 'none';
  }): Promise<this>;
  private async jumpTo(options: {position: 'beginning' | 'end' | number; targetOffset: number; autoplayDetection: 'forward' | 'backward' | 'none';}): Promise<this>;
  private async jumpTo(
    options: { targetOffset: number; autoplayDetection: 'forward' | 'backward' | 'none'; } & (
      {tag: string | RegExp; search?: 'forward' | 'backward' | 'forward-from-beginning' | 'backward-from-end'; searchOffset?: number; position?: never}
      | {position: 'beginning' | 'end' | number; tag?: never}
    ),
  ): Promise<this> {
    if (this.isAnimating) { throw new Error('Cannot use jumpTo() while currently animating.'); }
    // Calls to jumpTo() must be separated using await or something that similarly prevents simultaneous execution of code
    if (this.isJumping) { throw new Error('Cannot perform simultaneous calls to jumpTo() in timeline.'); }

    const { targetOffset, autoplayDetection, position, tag } = options;

    // cannot specify both tag and position
    if (tag !== undefined && position !== undefined) {
      throw new TypeError(`jumpTo() must receive either the tag or the position, not both. Received tag="${tag}" and position="${position}."`);
    }
    // can only specify one of tag or position, not both
    if (tag === undefined && position === undefined) {
      throw new TypeError(`jumpTo() must receive either the tag or the position. Neither were received.`);
    }
    if (!Number.isSafeInteger(targetOffset)) { throw new TypeError(`Invalid offset "${targetOffset}". Value must be an integer.`); }

    let targetIndex: number;

    // find target index based on finding sequence with matching tag
    // Math.max(0) prevents wrapping
    if (tag) {
      const { search = 'forward-from-beginning', searchOffset = 0 } = options;
      if (!Number.isSafeInteger(targetOffset)) { throw new TypeError(`Invalid searchOffset "${searchOffset}". Value must be an integer.`); }
      
      let isBackwardSearch = false;
      let fromIndex: number;
      switch(search) {
        case "forward":
          fromIndex = Math.max(this.loadedSeqIndex + 1 + searchOffset, 0);
          break;
        case "backward":
          fromIndex = Math.max(this.loadedSeqIndex - 1 + searchOffset, 0);
          isBackwardSearch = true;
          break;
        case "forward-from-beginning":
          fromIndex = Math.max(searchOffset, 0);
          break;
        case "backward-from-end":
          fromIndex = Math.max(this.numSequences - 1 + searchOffset, 0);
          isBackwardSearch = true;
          break;
        default:
          throw new TypeError(`Invalid search value "${search}".`);
      }
      const sequenceMatchesTag = (sequence: AnimSequence, tag: RegExp | string): boolean => tag instanceof RegExp ? tag.test(sequence.getTag()) : sequence.getTag() === tag;

      let initialIndex = -1;
      // get index corresponding to matching AnimSequence
      if (!isBackwardSearch)
        { for (let i = fromIndex; i < this.numSequences; ++i) { if (sequenceMatchesTag(this.animSequences[i], tag)) { initialIndex = i; break; } } }
      else
        { for (let i = fromIndex; i >= 0; --i) { if (sequenceMatchesTag(this.animSequences[i], tag)) { initialIndex = i; break; } } }

      if (initialIndex === -1) { throw new Error(`Sequence tag "${tag}" not found given conditions: search: ${search}; searchOffset: ${searchOffset}.`); }
      targetIndex = initialIndex + targetOffset;
    }
    // find target index based on either the beginning or end of the timeline
    else {
      switch(true) {
        case position === "beginning":
          targetIndex = 0 + targetOffset;
          break;
        case position === "end":
          targetIndex = this.numSequences + targetOffset;
          break;
        case typeof position === 'number':
          if (!Number.isSafeInteger(position)) { throw new TypeError(`Invalid position "${position}". When using a number, value must be an integer.`); }
          targetIndex = position;
          break;
        default: throw new RangeError(`Invalid jumpTo() position "${position}". Must be "beginning", "end", or an integer.`);
      }
    }

    // check to see if requested target index is within timeline bounds
    {
      const errorPrefixString = `Jumping to ${tag ? `tag "${tag}"` : `position "${position}"`} with offset "${targetOffset}" goes`;
      const errorPostfixString = `but requested index was ${targetIndex}.`;
      if (targetIndex < 0)
      { throw new RangeError(`${errorPrefixString} before timeline bounds. Minimium index = 0, ${errorPostfixString}`); }
      if (targetIndex > this.numSequences)
        { throw new RangeError(`${errorPrefixString} ahead of timeline bounds. Max index = ${this.numSequences}, ${errorPostfixString}`); }
    }

    this.isJumping = true;
    // if paused, then unpause to perform the jumping; then re-pause
    let wasPaused = this.isPaused;
    if (wasPaused) { this.unpause(); }
    // if skipping is not currently enabled, activate skipping button styling
    let wasSkipping = this.skippingOn;
    if (!wasSkipping) { this.playbackButtons.toggleSkippingButton?.styleActivation(); }

    // keep skipping forwards or backwards depending on direction of loadedSeqIndex

    const continueAutoplayForward = async () => {
      while (
        !this.atEnd
        && (this.animSequences[this.loadedSeqIndex - 1]?.autoplaysNextSequence || this.animSequences[this.loadedSeqIndex]?.autoplays)
      ) { await this.stepForward(); }
    }
    const continueAutoplayBackward = async () => {
      while (
        !this.atBeginning
        && (this.animSequences[this.loadedSeqIndex - 1]?.autoplaysNextSequence || this.animSequences[this.loadedSeqIndex]?.autoplays)
      ) { await this.stepBackward(); }
    }

    // play to the target sequence without playing the sequence
    if (this.loadedSeqIndex <= targetIndex) {
      this.playbackButtons.forwardButton?.styleActivation();
      while (this.loadedSeqIndex < targetIndex) { await this.stepForward(); }
      switch(autoplayDetection) {
        // if autoplay detection forward, play as long as the loaded sequence is supposed to be autoplayed
        case "forward":
          await continueAutoplayForward();
          break;
        // if autoplay detection backward, rewind as long as the loaded sequence is supposed to be autoplayed
        case "backward":
          await continueAutoplayBackward();
          break;
        case "none": // do nothing
        default:
          break;
      }
      this.playbackButtons.forwardButton?.styleDeactivation();
    }
    // rewind to the target sequence and rewind the sequence as well
    else {
      this.playbackButtons.backwardButton?.styleActivation();
      while (this.loadedSeqIndex > targetIndex) { await this.stepBackward(); }
      switch(autoplayDetection) {
        case "forward":
          await continueAutoplayForward();
          break;
        case "backward":
          await continueAutoplayBackward();
          break;
        case "none": // do nothing
        default:
          break;
      }
      this.playbackButtons.backwardButton?.styleDeactivation();
    }

    if (!wasSkipping) { this.playbackButtons.toggleSkippingButton?.styleDeactivation(); }
    if (wasPaused) { this.pause(); }

    this.isJumping = false;
    return this;
  }

  async toggleSkipping(options: {
    /**@internal */
    viaButton?: boolean,
    forceState?: 'on' | 'off'
  } = {}): Promise<this> {
    if (options.forceState) {
      const prevSkippingState = this.skippingOn;
      switch(options.forceState) {
        case "on": this.skippingOn = true; break;
        case "off": this.skippingOn = false; break;
        default: {
          throw this.generateError(RangeError, `Invalid force value ${options.forceState}. Use "on" to turn on skipping or "off" to turn off skipping.`);
        }
      }
      // if toggling did nothing, just return
      if (prevSkippingState === this.skippingOn) { return this; }
    }
    else {
      this.skippingOn = !this.skippingOn;
    }

    const viaButton = options.viaButton ?? false;
    return this.skippingOn ? this.turnOnSkipping({viaButton}) : this.turnOffSkipping({viaButton});
  }

  async turnOnSkipping(): Promise<this>;
  /**@internal*/
  async turnOnSkipping(options?: { viaButton: boolean }): Promise<this>;
  async turnOnSkipping(options?: { viaButton: boolean }): Promise<this> {
    this.skippingOn = true;
    if (!options?.viaButton) { this.playbackButtons.toggleSkippingButton?.styleActivation(); }
    // if skipping is enabled in the middle of animating, force currently running AnimSequence to finish
    if (this.isAnimating && !this.isPaused) { await this.finishInProgressSequences(); }
    return this;
  }

  turnOffSkipping(): this;
  /**@internal*/
  turnOffSkipping(options?: { viaButton: boolean }): this;
  turnOffSkipping(options?: { viaButton: boolean }): this {
    this.skippingOn = false;
    if (!options?.viaButton) { this.playbackButtons.toggleSkippingButton?.styleDeactivation(); }
    return this;
  }

  // tells the current AnimSequence(s) (really just 1 in this project iteration) to instantly finish its animations
  async finishInProgressSequences(): Promise<this> {
    return this.doForInProgressSequences_async(sequence => sequence.finish());
  }

  // pauses or unpauses playback
  togglePause(options: {
    /**@internal */
    viaButton?: boolean,
    forceState?: 'pause' | 'unpause'
  } = {}): this {
    if (options.forceState) {
      const prevPauseState = this.isPaused;
      switch(options.forceState) {
        case 'pause': this.isPaused = true; break;
        case 'unpause': this.isPaused = false; break;
        default: {
          throw this.generateError(RangeError, `Invalid force value ${options.forceState}. Use "pause" to pause or "unpause" to unpause.`);
        }
      }
      // if toggling did nothing, just return
      if (prevPauseState === this.isPaused) { return this; }
    }
    else {
      this.isPaused = !this.isPaused;
    }

    const viaButton = options.viaButton ?? false;
    this.isPaused ? this.pause({viaButton}) : this.unpause({viaButton});
    
    return this;
  }

  pause(): this;
  /**@internal*/
  pause(options?: { viaButton: boolean }): this;
  pause(options?: { viaButton: boolean }): this {
    this.isPaused = true;
    if (!options?.viaButton) { this.playbackButtons.pauseButton?.styleActivation(); }
    this.doForInProgressSequences(sequence => sequence.pause());
    return this;
  }
  
  unpause(): this;
  /**@internal*/
  unpause(options?: { viaButton: boolean }): this;
  unpause(options?: { viaButton: boolean }): this {
    this.isPaused = false;
    if (!options?.viaButton) { this.playbackButtons.pauseButton?.styleDeactivation(); }
    this.doForInProgressSequences(sequence => sequence.unpause());
    if (this.skippingOn) { this.finishInProgressSequences(); }
    return this;
  }

  // get all currently running animations that belong to this timeline and perform operation() with them
  private doForInProgressSequences(operation: SequenceOperation): this {
    for (const sequence of this.inProgressSequences.values()) {
      operation(sequence);
    }
    return this;
  }

  private async doForInProgressSequences_async(operation: AsyncSequenceOperation): Promise<this> {
    const promises: Promise<unknown>[] = [];
    for (const sequence of this.inProgressSequences.values()) {
      promises.push(operation(sequence));
    }
    await Promise.all(promises);
    return this;
  }

  protected generateError: TimelineErrorGenerator = (ErrorClassOrInstance, msg = '<unspecified error>') => {
    return generateError(ErrorClassOrInstance, msg as string, {
      timeline: this
    });
  }
}
