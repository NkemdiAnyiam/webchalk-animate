import * as fs from 'fs';
import { stylesheet } from './componentStyleString';
import { AnimTimeline } from './src/1_playbackStructures/AnimationTimeline';
import { AnimSequence } from './src/1_playbackStructures/AnimationSequence';

const str = fs.readFileSync('./htmlComponents/timeline-pane.html', 'utf-8');

export function hem(numHem: number): string {
  return `calc(${numHem} * var(--hem))`;
}

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

  insertSequences(insertionIndex: number, newSequences: AnimSequence[], allSequences: AnimSequence[]) {
    if (newSequences.length === 0) { return; }

    const timelineSequences = this.shadowRoot!.querySelector('.timeline__sequences-container') as HTMLElement;

    // sequence elements will be made for any sequences that don't have ui attached

    // insert the first sequences and then use it as the insertion point
    const firstNewSequence = newSequences[0];
    if (!firstNewSequence.uiAttached) { firstNewSequence.attachUI(); }
    firstNewSequence.updateSequenceNumber(insertionIndex + 1);

    if (insertionIndex === 0) {
      timelineSequences.insertAdjacentElement('afterbegin', firstNewSequence.webchalkSequenceEl!);
    }
    else if (timelineSequences.children[insertionIndex - 1]) {
      timelineSequences.children[insertionIndex - 1].insertAdjacentElement('afterend', firstNewSequence.webchalkSequenceEl!);
    }
    else {
      timelineSequences.insertAdjacentElement('beforeend', firstNewSequence.webchalkSequenceEl!);
    }
    let insertionPoint: AnimSequence;

    // insert new sequence elements
    for (let i = insertionIndex + 1; i < newSequences.length; ++i) {
      insertionPoint = newSequences[i - 1];
      const newSequence = newSequences[i];
      if (!newSequence.uiAttached) { newSequence.attachUI(); }
      newSequence.updateSequenceNumber(i + 1);
      insertionPoint.webchalkSequenceEl?.insertAdjacentElement('afterend', newSequence.webchalkSequenceEl!);
    }

    // update sequence numbers for any pre-existing sequences after the insertion index
    for (let i = insertionIndex + newSequences.length; i < allSequences.length; ++i) {
      allSequences[i].updateSequenceNumber(i + 1);
    }

  }

  readTimeline(timeline: AnimTimeline) {
    const timelineEl = this.shadowRoot?.querySelector('.timeline') as HTMLElement;
    timelineEl.querySelector('.timeline__name')!.textContent = timeline.getConfig().timelineName;

    this.insertSequences(0, timeline.getHierarchy().sequences, timeline.getHierarchy().sequences);
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
