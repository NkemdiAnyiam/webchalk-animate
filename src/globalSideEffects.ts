import { createElFromString, createStyles } from "./5_utils/helpers";
import { WebchalkConnectorElement } from "./3_shapes/elements/WebchalkConnectorElement";
import { WebchalkPlaybackButtonElement } from "./4_graphicalUI/WebchalkPlaybackButtonElement";
import { WebchalkClipElement } from "./4_graphicalUI/pane-ui/WebchalkClipElement";
import { WebchalkClipInfoBoxElement } from "./4_graphicalUI/pane-ui/WebchalkClipInfoBoxElement";
import { WebchalkSequenceElement } from "./4_graphicalUI/pane-ui/WebchalkSequenceElement";
import { WebchalkTimelinePaneElement } from "./4_graphicalUI/pane-ui/WebchalkTimelinePaneElement";
import { WebchalkPhaseSegmentElement } from "./4_graphicalUI/pane-ui/WebchalkPhaseSegmentElement";
import { WebchalkPlaybackButtonsContainerElement } from "./4_graphicalUI/WebchalkPlaybackButtonsContainerElement";

export function injectGlobals() {
  WebchalkConnectorElement.addToCustomElementRegistry();
  WebchalkPlaybackButtonsContainerElement.addToCustomElementRegistry();
  WebchalkPlaybackButtonElement.addToCustomElementRegistry();
  WebchalkTimelinePaneElement.addToCustomElementRegistry();
  WebchalkSequenceElement.addToCustomElementRegistry();
  WebchalkClipElement.addToCustomElementRegistry();
  WebchalkClipInfoBoxElement.addToCustomElementRegistry();
  WebchalkPhaseSegmentElement.addToCustomElementRegistry();

  // opacity of connector markers
  if (window.CSS.registerProperty) {
    window.CSS.registerProperty({
      name: "--marker-b-opacity",
      syntax: "<number>",
      inherits: true,
      initialValue: '1',
    });
  
    window.CSS.registerProperty({
      name: "--marker-a-opacity",
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
