import { createElFromString } from "../5_utils/helpers";
import { KeyboardShortcutOptions } from "../5_utils/interfaces";
import { WebchalkPlaybackButtonElement } from "./WebchalkPlaybackButtonElement";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(
  /*css*/`:host {
    display: inline-block;
    --webchalk-playback-button-press-color: #db0000;
    --webchalk-playback-button-hold-color: #62B720;
    --webchalk-playback-button-disabled-color: gray;
    --webchalk-playback-button-background-color: #121213;
    --webchalk-playback-button-symbol-color: white;
  }
  
  .playback-buttons-container {
    /* TODO: retrieve there instead of copy-pasting */
    --color-primary-blue: #04448E;
    --color-gray-darkest: #121213;
    --color-gray: #4E4E4E;
    --color-gray-light: #E0E0E0;
    --color-gray-lighter: #ECECEC;
    --color-gray-lightest: #F7F7F7;

    /* TODO: conditionally set the positioning properties depending on where a set of playback buttons is inserted
    (likely with docking) */
    position: fixed;
    bottom: 0;
    right: 0;
    z-index: calc(infinity);
    padding: 6px 8px;
    /* background-color: color-mix(in srgb, var(--color-primary-blue) 30%, transparent); */
    background-color: var(--color-primary-blue);
    border: 4px solid var(--color-gray-darkest);
    opacity: 0.4;
    transition: opacity 0.1s;
    transform-origin: bottom left;
  }
  
  .playback-buttons-container:hover,
  .playback-buttons-container:focus-within {
    opacity: 1;
  }

  .playback-buttons-container__inner-wrapper {
    background-color: var(--color-gray-lightest);
    padding: 6px;

    display: flex;
    gap: 6px;
  }`
);

export class WebchalkPlaybackButtonsContainerElement extends HTMLElement {
  /**@internal*/ static addToCustomElementRegistry() { customElements.define('webchalk-playback-buttons-container', WebchalkPlaybackButtonsContainerElement); }

  buttonsContainerElement: HTMLDivElement;

  constructor() {
    super();
    const shadow = this.attachShadow({mode: 'open'});
    shadow.adoptedStyleSheets = [stylesheet];

    const htmlString = /*html*/`
    <div class="playback-buttons-container">
      <div class="playback-buttons-container__inner-wrapper"></div>
    </div>
    `;

    const template = document.createElement('template');
    template.innerHTML = htmlString;
    const element = template.content.cloneNode(true);
    shadow.append(element);
    this.buttonsContainerElement = this.shadowRoot!.querySelector('.playback-buttons-container') as HTMLDivElement;
  }

  addButton(
    action: WebchalkPlaybackButtonElement['action'],
    options: {allowHolding?: boolean, keyboardShortcuts?: KeyboardShortcutOptions} = {}
  ): WebchalkPlaybackButtonElement {
    const {
      allowHolding = false,
      keyboardShortcuts = {},
    } = options;

    const shortcut = keyboardShortcuts[
      action.replaceAll(/(\-)(.)/g, (match, dash, letter) => letter.toUpperCase()) as keyof typeof keyboardShortcuts
    ] ?? null;

    const button = createElFromString(/*html*/`
      <webchalk-playback-button
        action="${action}"
        ${shortcut ? `shortcut="${shortcut}"` : ''}
        ${allowHolding ? `allow-holding` : ''}
      >
      </webchalk-playback-button>
    `) as WebchalkPlaybackButtonElement;

    this.buttonsContainerElement.querySelector('.playback-buttons-container__inner-wrapper')!.append(button);
    return button;
  }
}
