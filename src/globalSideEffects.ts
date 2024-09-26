import { createStyles } from "./utils/helpers";
import { WbfkConnector } from "./WbfkConnector";
import { WbfkPlaybackButton } from "./WbfkPlaybackButton";

export function injectGlobals() {
  WbfkConnector.addToCustomElementRegistry();
  WbfkPlaybackButton.addToCustomElementRegistry();

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
      --wbfk-highlight-color: #F9F278;
      --wbfk-playback-button-press-color: #db0000;
      --wbfk-playback-button-hold-color: #62B720;
      --wbfk-playback-button-disabled-color: gray;
      --wbfk-playback-button-background-color: #444;
      --wbfk-playback-button-symbol-color: white;
    }
    
    .wbfk-hidden:not(.wbfk-override-hidden) {
      display: none !important;
    }
    
    .wbfk-invisible:not(.wbfk-override-hidden) {
      visibility: hidden !important;
    }
    
    .wbfk-highlightable {
      background-image: linear-gradient(to right, var(--wbfk-highlight-color) 50%, transparent 50%);
      background-size: 202%;
      background-position-x: 100%;
    }`
  );
}
