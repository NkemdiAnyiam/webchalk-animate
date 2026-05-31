import * as fs from 'fs';
import { stylesheet } from './componentStyleString';

const str = fs.readFileSync('./htmlComponents/timeline-pane.html', 'utf-8');

export class WebchalkTimelinePaneElement extends HTMLElement {
  /**@internal*/ static addToCustomElementRegistry() { customElements.define('webchalk-timeline-pane', WebchalkTimelinePaneElement); }
  
  constructor() {
    super();
    const shadow = this.attachShadow({mode: 'open'});
    shadow.adoptedStyleSheets = [stylesheet];
    const htmlString = /*html*/`
      ${str}
    `;

    const template = document.createElement('template');
    template.innerHTML = htmlString;
    const element = template.content.cloneNode(true);
    shadow.append(element);

    this.attachTimelineUIResizer();
  }

  attachTimelineUIResizer() {
    const timelineUI = this.shadowRoot?.querySelector('.timeline') as HTMLDivElement;

    const handleClick = (e: MouseEvent) => {
      const timelineResizer = (e.target as HTMLElement);
      // only do process if resizer was clicked
      if (!timelineResizer.classList.contains('timeline__resizer')) { return; }

      // unhighlight all text to prevent annoying dragging issues
      document.getSelection()?.removeAllRanges();
      // prevent selection in order to prevent other annoying dragging issues
      timelineUI.classList.add('user-select-none');

      const handleDrag = (e: MouseEvent) => {
        // change UI height based on mouse movement
        const y = e.movementY;
        timelineUI.style.height = `${Number.parseFloat(getComputedStyle(timelineUI).height) - y}px`;
      }

      const handleRelease = (e: MouseEvent) => {
        // remove all event listeners
        timelineUI.classList.remove('user-select-none');
        window.removeEventListener('mousemove', handleDrag);
        window.removeEventListener('mouseup', handleRelease);
        window.removeEventListener('mouseleave', handleRelease);
      }

      // add listeners for handling drag and release to window
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleRelease);
      window.addEventListener('mouseleave', handleRelease);
    };

    timelineUI.addEventListener('mousedown', handleClick);
  }
}
