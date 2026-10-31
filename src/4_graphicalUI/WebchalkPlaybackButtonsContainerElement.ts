import { stylesheet } from "../styles/componentStyleSheet";
import { createElFromString } from "../5_utils/helpers";
import { KeyboardShortcutOptions } from "../5_utils/interfaces";
import { WebchalkPlaybackButtonElement } from "./WebchalkPlaybackButtonElement";

const hostStyleSheet = new CSSStyleSheet();
hostStyleSheet.replaceSync(
  /*css*/`:host {
    display: inline-block;
    --webchalk-playback-button-press-color: #db0000;
    --webchalk-playback-button-hold-color: #62B720;
    --webchalk-playback-button-disabled-color: gray;
    --webchalk-playback-button-background-color: #121213;
    --webchalk-playback-button-symbol-color: white;
  }`
);

export class WebchalkPlaybackButtonsContainerElement extends HTMLElement {
  /**@internal*/ static addToCustomElementRegistry() { customElements.define('webchalk-playback-buttons-container', WebchalkPlaybackButtonsContainerElement); }

  buttonsContainerElement: HTMLDivElement;

  constructor() {
    super();
    const shadow = this.attachShadow({mode: 'open'});
    shadow.adoptedStyleSheets = [hostStyleSheet, stylesheet];

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
