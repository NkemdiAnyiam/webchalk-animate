import * as fs from 'fs';
import { stylesheet } from './componentStyleString';
import { AnimClip } from './src/1_playbackStructures/AnimationClip';
import { WebchalkTimelinePaneElement } from './WebchalkTimelinePane';
import { TBA_DURATION } from './src/4_utils/helpers';
import { EffectCategory } from './src/4_utils/interfaces';

const str = fs.readFileSync('./htmlComponents/clip.html', 'utf-8');

// TODO: move somewhere else
function getHemsPerSecond() {
  const timelinePane = (document.querySelector('webchalk-timeline-pane') as WebchalkTimelinePaneElement)
    .shadowRoot!.querySelector('.timeline') as HTMLElement;

  return Number(getComputedStyle(timelinePane)
    .getPropertyValue('--hems-per-second')
    .match(/calc\((-?\d+(?:\.\d+)?|-?\.\d+) \* \d+px\)/)![1]
  );
}
function msToNumHem(ms: number) { return ms / 1000 * getHemsPerSecond(); }
function numHToMs(hem: number) { return hem / getHemsPerSecond() * 1000; }
function hem(numHem: number): string {
  return `calc(${numHem} * var(--hem))`;
}
function msToHemStr(ms: number): string { return hem(msToNumHem(ms)); }

// TODO: move somewhere else
const categoryToAbbrev = (category: EffectCategory): string => {
  switch(category) {
    case 'Entrance': return 'En';
    case 'Exit': return 'Ex';
    case 'Emphasis': return 'Em';
    case 'Motion': return 'Mo';
    case 'Transition': return 'Tr';
    case 'Scroller': return 'Sc';
    case 'Connector Setter': return 'CSe';
    case 'Connector Entrance': return 'CEn';
    case 'Connector Exit': return 'CEx';
    case 'Text Editor': return 'TE';
    // TODO: error handling for category to abbreviation
  }
};

export class WebchalkClipElement extends HTMLElement {
  /**@internal*/ static addToCustomElementRegistry() { customElements.define('webchalk-clip', WebchalkClipElement); }
  
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
  }

  build(clip: AnimClip) {
    const clipEl = this.shadowRoot?.querySelector('.clip') as HTMLElement;
    const delayBarEl = clipEl.querySelector('.clip__length-bar--delay') as HTMLElement;
    const durationBarEl = clipEl.querySelector('.clip__length-bar--duration') as HTMLElement;
    const endDelayBarEl = clipEl.querySelector('.clip__length-bar--end-delay') as HTMLElement;
    const effectCategoryEl = clipEl.querySelector('.clip__effect-category-icon') as HTMLElement;
    const effectNameEl = clipEl.querySelector('.clip__effect-name') as HTMLElement;
    const descriptionEl = clipEl.querySelector('.clip__description-text') as HTMLElement;

    const fullStartTime = clip.fullStartTime;
    const {
      category,
      effectName,
    } = clip.getEffectDetails();
    const {
      delay,
      duration,
      endDelay,
    } = clip.getTiming();
    const { description } = clip.getConfig();

    clipEl.classList.add(`clip--${category.toLowerCase().replaceAll(' ', '-')}`);
    clipEl.style.marginLeft = msToHemStr(fullStartTime);

    delayBarEl.style.width = msToHemStr(delay);
    if (delay === 0) { delayBarEl.style.border = 'none'; }
    durationBarEl.style.width = msToHemStr(duration === TBA_DURATION ? 0 : duration);
    endDelayBarEl.style.width = msToHemStr(endDelay);
    if (endDelay === 0) { endDelayBarEl.style.border = 'none'; }

    effectCategoryEl.textContent = categoryToAbbrev(category);
    effectNameEl.textContent = effectName;
    descriptionEl.textContent = description;
  }

  updateDuration(newDurationMs: number) {
    const durationBarEl = this.shadowRoot!.querySelector('.clip__length-bar--duration') as HTMLElement;
    durationBarEl.style.width = msToHemStr(newDurationMs === TBA_DURATION ? 0 : newDurationMs);
  }

  updateFullStartTime(startTimeMs: number) {
    const clipEl = this.shadowRoot?.querySelector('.clip') as HTMLElement;
    clipEl.style.marginLeft = msToHemStr(startTimeMs);
  }
}
