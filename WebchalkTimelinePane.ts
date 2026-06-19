import * as fs from 'fs';
import { stylesheet } from './componentStyleString';
import { AnimTimeline } from './src/1_playbackStructures/AnimationTimeline';
import { AnimSequence } from './src/1_playbackStructures/AnimationSequence';

import { createElFromString, highlightCodeEls } from './src/4_utils/helpers';
import { defaultClipFactories } from './src/Webchalk';
import { AnimClip } from './src/1_playbackStructures/AnimationClip';

const str = fs.readFileSync('./htmlComponents/timeline-pane.html', 'utf-8');

export function hem(numHem: number): string {
  return `calc(${numHem} * var(--hem))`;
}

export class WebchalkTimelinePaneElement extends HTMLElement {
  /**@internal*/ static addToCustomElementRegistry() { customElements.define('webchalk-timeline-pane', WebchalkTimelinePaneElement); }

  animTimeline?: AnimTimeline;
  
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
    this.attachErrorPanelResizer();
  }

  insertSequences(insertionIndex: number, newSequences: AnimSequence[]) {
    if (newSequences.length === 0) { return; }

    const timelineSequences = this.shadowRoot!.querySelector('.timeline__sequences-container') as HTMLElement;

    // sequence elements will be made for any sequences that don't have ui attached

    // insert the first sequences and then use it as the insertion point
    const firstNewSequence = newSequences[0];
    firstNewSequence.attachUI();

    if (insertionIndex === 0) {
      timelineSequences.insertAdjacentElement('afterbegin', firstNewSequence.webchalkSequenceEl!);
    }
    else if (timelineSequences.children[insertionIndex - 1]) {
      timelineSequences.children[insertionIndex - 1].insertAdjacentElement('afterend', firstNewSequence.webchalkSequenceEl!);
    }
    else {
      timelineSequences.insertAdjacentElement('beforeend', firstNewSequence.webchalkSequenceEl!);
    }
    firstNewSequence.writeUI();

    let insertionPoint: AnimSequence;
    // insert new sequence elements
    for (let i = insertionIndex + 1; i < newSequences.length; ++i) {
      insertionPoint = newSequences[i - 1];
      const newSequence = newSequences[i];
      newSequence.attachUI();
      insertionPoint.webchalkSequenceEl?.insertAdjacentElement('afterend', newSequence.webchalkSequenceEl!);
      newSequence.writeUI();
    }
  }

  removeSequences(sequencesToRemove: AnimSequence[]) {
    for (const sequence of sequencesToRemove) {
      sequence.detachUI();
    }
  }

  readTimeline() {
    const timeline = this.animTimeline!;
    
    const timelineEl = this.shadowRoot!.querySelector('.timeline') as HTMLElement;
    timelineEl.querySelector('.timeline__name')!.textContent = timeline.getConfig().timelineName;

    this.insertSequences(0, timeline.getHierarchy().sequences);
  }

  remove() {
    super.remove();
    this.animTimeline = undefined;
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

  attachErrorPanelResizer() {
    const errorPanel = this.shadowRoot?.querySelector('.timeline__error-panel') as HTMLDivElement;

    const handleClick = (e: MouseEvent) => {
      const errorPanelResizer = (e.target as HTMLElement);
      // only do process if resizer was clicked
      if (!errorPanelResizer.classList.contains('timeline__error-panel-resizer')) { return; }

      // unhighlight all text to prevent annoying dragging issues
      document.getSelection()?.removeAllRanges();
      // prevent selection in order to prevent other annoying dragging issues
      errorPanel.classList.add('user-select-none');

      const handleDrag = (e: MouseEvent) => {
        // change panel width based on mouse movement
        const x = e.movementX;
        errorPanel.style.width = `${Number.parseFloat(getComputedStyle(errorPanel).width) - x}px`;
      }

      const handleRelease = (e: MouseEvent) => {
        // remove all event listeners
        errorPanel.classList.remove('user-select-none');
        window.removeEventListener('mousemove', handleDrag);
        window.removeEventListener('mouseup', handleRelease);
        window.removeEventListener('mouseleave', handleRelease);
      }

      // add listeners for handling drag and release to window
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleRelease);
      window.addEventListener('mouseleave', handleRelease);
    };

    errorPanel.addEventListener('mousedown', handleClick);
  }
  
  setErrorPanelContents(errorName: string, errorStuff: [description: DocumentFragment, tips?: DocumentFragment, location?: DocumentFragment]) {
    const errorPanelEl = this.shadowRoot!.querySelector('.timeline__error-panel') as HTMLElement;
    const headingEl = errorPanelEl.querySelector('.timeline__error-panel-heading-text') as HTMLHeadingElement;
    const bodyEl = errorPanelEl.querySelector('.timeline__error-panel-body') as HTMLHeadingElement;

    headingEl.textContent = `ERROR: ${errorName}`;

    const [description, tips, location] = errorStuff;

    bodyEl.innerHTML = '';
    {
      const sectionEl = createElFromString(`<div class="timeline__error-panel-section"></div>`);
      const sectionBodyEl = createElFromString(`<div class="timeline__error-panel-section-body"></div>`);
      const headingEl = createElFromString(`<h3 class="timeline__error-panel-subheading">Description</h3>`);
      sectionEl.appendChild(headingEl);
      sectionBodyEl.appendChild(description);
      sectionEl.append(sectionBodyEl);
      bodyEl.appendChild(sectionEl);
    }
    if (tips) {
      const sectionEl = createElFromString(`<div class="timeline__error-panel-section"></div>`);
      const sectionBodyEl = createElFromString(`<div class="timeline__error-panel-section-body"></div>`);
      const headingEl = createElFromString(`<h3 class="timeline__error-panel-subheading">Tips</h3>`);
      sectionEl.appendChild(headingEl);
      sectionBodyEl.appendChild(tips);
      sectionEl.append(sectionBodyEl);
      bodyEl.appendChild(sectionEl);
    }
    if (location) {
      const sectionEl = createElFromString(`<div class="timeline__error-panel-section"></div>`);
      const sectionBodyEl = createElFromString(`<div class="timeline__error-panel-section-body"></div>`);
      const headingEl = createElFromString(`<h3 class="timeline__error-panel-subheading">Location</h3>`);
      sectionEl.appendChild(headingEl);
      sectionBodyEl.appendChild(location);
      sectionEl.append(sectionBodyEl);
      bodyEl.appendChild(sectionEl);
    }

    highlightCodeEls(bodyEl);
  }

  scrollToSequence(sequence: AnimSequence, direction: 'forward' | 'backward', block: 'nearest' | 'start' = 'nearest') {
    // defaultClipFactories.Scroller(
    //   this.shadowRoot!.querySelector('.timeline__sequences-container'),
    //   '~scroll-self',
    //   [sequence.webchalkSequenceEl, {preserveX: true, scrollableOffset: [0, 'center'], targetOffset: [0, direction === 'forward' ? 'top' : 'bottom']}],
    //   {duration: 125}
    // ).play();
    sequence.webchalkSequenceEl?.scrollIntoView({block: block, 'behavior': 'smooth'})
  }

  scrollToClip(clip: AnimClip, direction: 'forward' | 'backward') {
    // defaultClipFactories.Scroller(
    //   this.shadowRoot!.querySelector('.timeline__sequences-container'),
    //   '~scroll-self',
    //   [clip.webchalkClipEl, {preserveX: true, scrollableOffset: [0, 'center + 20%'], targetOffset: [0, direction === 'forward' ? 'top' : 'bottom']}],
    //   {duration: 1000, easing: 'ease-in-out'}
    // ).play();
    // clip.webchalkClipEl?.scrollIntoView({block: 'nearest', behavior: 'smooth'});
  }
}
