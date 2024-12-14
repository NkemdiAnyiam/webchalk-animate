import { createStyles } from "./4_utils/helpers";
import { WebChalkConnectorElement } from "./3_components/WebChalkConnectorElement";
import { WebChalkPlaybackButtonElement } from "./3_components/WebChalkPlaybackButtonElement";

export function injectGlobals() {
  WebChalkConnectorElement.addToCustomElementRegistry();
  WebChalkPlaybackButtonElement.addToCustomElementRegistry();

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
  
  createStyles(/*css*/`
    /* Using :where makes it possible for developer to easily override the default color */
    :where(:root) {
      --webchalk-highlight-color: #F9F278;
      --webchalk-playback-button-press-color: #db0000;
      --webchalk-playback-button-hold-color: #62B720;
      --webchalk-playback-button-disabled-color: gray;
      --webchalk-playback-button-background-color: #444;
      --webchalk-playback-button-symbol-color: white;
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
