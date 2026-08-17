import { createElFromString, createStyles } from "./4_utils/helpers";
import { WebchalkConnectorElement } from "./3_components/WebchalkConnectorElement";
import { WebchalkPlaybackButtonElement } from "./3_components/WebchalkPlaybackButtonElement";
import { WebchalkClipElement } from "./3_components/pane-ui/WebchalkClipElement";
import { WebchalkClipInfoBoxElement } from "./3_components/pane-ui/WebchalkClipInfoBoxElement";
import { WebchalkSequenceElement } from "./3_components/pane-ui/WebchalkSequenceElement";
import { WebchalkTimelinePaneElement } from "./3_components/pane-ui/WebchalkTimelinePaneElement";
import { WebchalkPhaseSegmentElement } from "./3_components/pane-ui/WebchalkPhaseSegmentElement";

export function injectGlobals() {
  WebchalkConnectorElement.addToCustomElementRegistry();
  WebchalkPlaybackButtonElement.addToCustomElementRegistry();
  WebchalkTimelinePaneElement.addToCustomElementRegistry();
  WebchalkSequenceElement.addToCustomElementRegistry();
  WebchalkClipElement.addToCustomElementRegistry();
  WebchalkClipInfoBoxElement.addToCustomElementRegistry();
  WebchalkPhaseSegmentElement.addToCustomElementRegistry();

  // opacity of connector markers
  if (window.CSS.registerProperty) {
    window.CSS.registerProperty({
      name: "--b-marker-opacity",
      syntax: "<number>",
      inherits: true,
      initialValue: '1',
    });
  
    window.CSS.registerProperty({
      name: "--a-marker-opacity",
      syntax: "<number>",
      inherits: true,
      initialValue: '1',
    });
  }

  if (!(document.querySelector('.webchalk-assets-container'))) {
    document.querySelector('body')!.appendChild(createElFromString('<div class="webchalk-assets-container"></div>'));
  }
  
  createStyles(/*css*/`
    /* Using :where makes it possible for developer to easily override the default color */
    :where(:root) {
      --webchalk-highlight-color: #F9F278;
      --webchalk-playback-button-press-color: #db0000;
      --webchalk-playback-button-hold-color: #62B720;
      --webchalk-playback-button-disabled-color: gray;
      --webchalk-playback-button-background-color: #121213;
      --webchalk-playback-button-symbol-color: white;
    }
  
    .playback-buttons {
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

    .playback-buttons:hover,
    .playback-buttons:focus-within {
      opacity: 1;
    }

    .playback-buttons-inner-wrapper {
      background-color: var(--color-gray-lightest);
      padding: 6px;

      display: flex;
      gap: 6px;
    }
    
    .webchalk-display-none:not(.webchalk-force-show) {
      display: none !important;
    }
    
    .webchalk-visibility-hidden:not(.webchalk-force-show) {
      visibility: hidden !important;
    }
    
    .webchalk-highlightable {
      background-image: linear-gradient(to right, var(--webchalk-highlight-color) 50%, transparent 50%);
      background-size: 202%;
      background-position-x: 100%;
    }`
  );
}
