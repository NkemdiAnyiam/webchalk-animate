export class WebimatorPlaybackButtonElement extends HTMLElement {
  /**@internal*/ static addToCustomElementRegistry() { customElements.define('wbmtr-playback-button', WebimatorPlaybackButtonElement); }

  action: `step-${'forward' | 'backward'}` | 'pause' | 'fast-forward' | 'toggle-skipping';
  shortcutKey: KeyboardEvent['key'] | null;
  triggerMode: 'press' | 'hold' = 'press';
  allowHolding: boolean = false; // repeat key
  private _mouseHeld: boolean = false;
  private _shortcutHeld: boolean = false;
  private _active: boolean = false;
  private _disabled: boolean = false;
  get mouseHeld(): boolean { return this._mouseHeld; }
  /**@internal*/set mouseHeld(value: boolean) { this._mouseHeld = value; }
  get shortcutHeld(): boolean { return this._shortcutHeld; }
  /**@internal*/set shortcutHeld(value: boolean) { this._shortcutHeld = value; }
  get active(): boolean { return this._active; }
  /**@internal*/set active(value: boolean) { this._active = value; }
  get disabled(): boolean { return this._disabled; }
  /**@internal*/ set disabled(value: boolean) { this._disabled = value; }

  constructor() {
    super();
    const shadow = this.attachShadow({mode: 'open'});
    
    this.shortcutKey = this.getAttribute('shortcut') ?? null;
    this.allowHolding = this.hasAttribute('allow-holding');
    const triggerMode = this.getAttribute('trigger') as typeof this.triggerMode ?? 'press';
    switch(triggerMode) {
      case "press": break;
      case "hold": break;
      default: throw new RangeError(`Invalid 'trigger' attribute value "${triggerMode}" for Webimator playback button. Must be "press" or "hold".`)
    }
    this.setAttribute('trigger', triggerMode);
    this.triggerMode = triggerMode;
    
    const action = this.getAttribute('action') as typeof this.action;
    let buttonShapeHtmlStr: string;
    switch(action) {
      case "step-forward":
        buttonShapeHtmlStr = /*html*/`<polygon points="22.468 81.83 67.404 40.915 22.468 0 22.468 81.83"/>`;
        break;
      case "step-backward":
        buttonShapeHtmlStr = /*html*/`<polygon points="59.362 81.83 14.426 40.915 59.362 0 59.362 81.83"/>`;
        break;
      case "pause":
        buttonShapeHtmlStr = /*html*/`<path d="M13.753,0h17.43V81.83H13.753ZM49.974,81.83H67.4V0H49.974Z"/>`;
        break;
      case "fast-forward":
        buttonShapeHtmlStr = /*html*/`<path d="M0,0,36.936,40.915,0,81.83ZM44.936,81.83,81.872,40.915,44.936,0Z"/>`;
        break;
      case "toggle-skipping":
        buttonShapeHtmlStr = /*html*/`<path d="M0,0,23.866,17.34,0,34.681ZM28.982,34.681,52.848,17.34,28.982,0Zm28.982,0L81.83,17.34,57.964,0ZM81.83,47.149,57.964,64.489,81.83,81.83Zm-28.982,0L28.982,64.489,52.848,81.83Zm-28.982,0L0,64.489,23.866,81.83Z"/>`;
        break;
      default: throw new RangeError(`Invalid 'action' attribute value "${action}" for Webimator playback button. Must be "step-forward", "step-backward", "pause", "fast-forward", or "toggle-skipping".`);
    }
    this.action = action;

    const htmlString = /*html*/`
      <style>
        :host {
          width: 25.6px;
          height: 25.6px;
          display: inline-block;
          background-color: var(--wbmtr-playback-button-background-color);
          padding: 1.6px !important;
        
          box-shadow: -3.2px 3.2px 3.2px rgba(0, 0, 0, 0.4);
          transform: scale(1);
          transition: all 0.02s;
        
          cursor: pointer;
        }
        
        :host(.playback-button--disabledPointerFromPause),
        :host(.playback-button--disabledPointerFromStepping) {
          cursor: not-allowed;
        }
        
        :host(.playback-button--disabledFromTimelineEdge),
        :host(.playback-button--disabledFromPause),
        :host(.playback-button--disabledFromStepping) {
          background-color: var(--wbmtr-playback-button-disabled-color);
          cursor: not-allowed;
        }
        
        :host(.playback-button--pressed) {
          transform: scale(0.90);
          box-shadow: -0.64px 0.64px 0.64px rgba(0, 0, 0, 0.8);
        }
        
        :host(.playback-button--pressed[trigger="press"]) {
          background-color: var(--wbmtr-playback-button-press-color);
        }
        
        :host(.playback-button--pressed[trigger="hold"]) {
          background-color: var(--wbmtr-playback-button-hold-color);
        }
        
        .playback-button__symbol {
          width: 100%;
          height: auto;
          fill: var(--wbmtr-playback-button-symbol-color);
        }
      </style>

      <svg class="playback-button__symbol" xmlns="http://www.w3.org/2000/svg" width="81.83" height="81.83" viewBox="0 0 81.83 81.83">
        <rect width="81.83" height="81.83" transform="translate(81.83 81.83) rotate(-180)" fill="none"/>
        ${buttonShapeHtmlStr}
      </svg>
    `;

    const template = document.createElement('template');
    template.innerHTML = htmlString;
    const element = template.content.cloneNode(true);
    shadow.append(element);

    this.setUpListeners();
  }

  setUpListeners(): void {
    // handle button activation with keyboard shortcut
    if (this.shortcutKey) {
      window.addEventListener('keydown', this.handleShortcutPress);
      window.addEventListener('keyup', this.handleShortcutRelease);
      const actionTitleCase = this.action.split('-').map(stringFrag => stringFrag[0].toUpperCase()+stringFrag.slice(1)).join(' ');
      this.title = `${actionTitleCase} (${this.triggerMode === 'hold' ? 'Hold ' : ''}${this.shortcutKey})`;
    }
    
    // handle button activation with mouse click
    this.addEventListener('mousedown', this.handleMousePress);
    window.addEventListener('mouseup', this.handleMouseRelease);
  }

  activate: () => void = (): void => {};
  deactivate?: () => void = (): void => {};
  styleActivation: () => void = (): void => {};
  styleDeactivation: () => void = (): void => {};

  disable = () => { this.disabled = true; }
  enable = () => { this.disabled = false; }

  private handleMousePress = (e: MouseEvent): void => {
    if (this.disabled) { return; }
    if (e.button !== 0) { return; } // only allow left mouse click
    this.mouseHeld = true;
    if (this.shortcutHeld) { return; }
    if (this.triggerMode === 'press' && this.active === true && this.deactivate) {
      return this.deactivate();
    }
    this.activate();
  }

  private handleMouseRelease = (e: MouseEvent): void => {
    if (this.disabled) { return; }
    if (e.button !== 0) { return; } // only allow left mouse click
    if (!this.mouseHeld) { return; }
    this.mouseHeld = false;
    if (this.shortcutHeld) { return; }
    if (this.triggerMode !== 'hold') { return; }
    this.deactivate?.();
  }

  private handleShortcutPress = (e: KeyboardEvent): void => {
    if (this.disabled) { return; }
    if (e.key.toLowerCase() !== this.shortcutKey?.toLowerCase() && e.code !== this.shortcutKey) { return; }
    // if the key is held down and holding is not allowed, return
    if (e.repeat && !this.allowHolding) { return; }

    e.preventDefault();
    this.shortcutHeld = true;
    if (this.mouseHeld) { return; }
    if (this.triggerMode === 'press' && this.active === true && this.deactivate) {
      return this.deactivate();
    }
    this.activate();
  }

  private handleShortcutRelease = (e: KeyboardEvent): void => {
    if (this.disabled) { return; }
    if (e.key.toLowerCase() !== this.shortcutKey?.toLowerCase() && e.code !== this.shortcutKey) { return; }
    if (!this.shortcutHeld) { return; }
    this.shortcutHeld = false;
    if (this.mouseHeld) { return; }
    if (this.triggerMode !== 'hold') { return; }
    this.deactivate?.();
  }
}
