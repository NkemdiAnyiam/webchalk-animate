import * as fs from 'fs';
import { stylesheet } from './componentStyleString';
import { AnimClip } from './src/1_playbackStructures/AnimationClip';
import { TBA_DURATION } from './src/4_utils/helpers';
import { EffectCategory } from './src/4_utils/interfaces';
import { WebchalkSequenceElement } from './WebchalkSequenceElement';
import { WebchalkClipInfoBoxElement } from './WebchalkClipInfoBoxElement';

const str = fs.readFileSync('./htmlComponents/clip.html', 'utf-8');

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

  private parentWebchalkSequenceEl: WebchalkSequenceElement | undefined;
  private infoBoxShown = false;
  private category: EffectCategory = '' as EffectCategory; // TODO: incorporate better
  
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

    this.attachInfoButtonHandler();
  }

  readClip(clip: AnimClip) {
    this.parentWebchalkSequenceEl = (this.getRootNode() as ShadowRoot).host as WebchalkSequenceElement;
    const clipEl = this.shadowRoot!.querySelector('.clip') as HTMLElement;
    const clipNumberEl = clipEl.querySelector('.clip__number') as HTMLElement;
    const delayBarEl = clipEl.querySelector('.clip__length-bar--delay') as HTMLElement;
    const durationBarEl = clipEl.querySelector('.clip__length-bar--duration') as HTMLElement;
    const endDelayBarEl = clipEl.querySelector('.clip__length-bar--end-delay') as HTMLElement;
    const effectEl = clipEl.querySelector('.clip__effect') as HTMLElement;
    const effectCategoryEl = effectEl.querySelector('.clip__effect-category-icon') as HTMLElement;
    const effectNameEl = effectEl.querySelector('.clip__effect-name') as HTMLElement;
    const descriptionEl = effectEl.querySelector('.clip__description-text') as HTMLElement;

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
    const { clipNumber } = clip.getHierarchy();

    effectEl.classList.add(`clip__effect--${category.toLowerCase().replaceAll(' ', '-')}`);
    this.category = category;
    effectEl.style.marginLeft = this.parentWebchalkSequenceEl.msToHemStr(fullStartTime);

    delayBarEl.style.width = this.parentWebchalkSequenceEl.msToHemStr(delay);
    if (delay === 0) { delayBarEl.style.border = 'none'; }
    durationBarEl.style.width = this.parentWebchalkSequenceEl.msToHemStr(duration === TBA_DURATION ? 0 : duration);
    endDelayBarEl.style.width = this.parentWebchalkSequenceEl.msToHemStr(endDelay);
    if (endDelay === 0) { endDelayBarEl.style.border = 'none'; }

    clipNumberEl.textContent = `${clipNumber}.`;
    effectCategoryEl.textContent = categoryToAbbrev(category);
    effectNameEl.textContent = effectName;
    descriptionEl.textContent = description;
  }

  updateDuration(newDurationMs: number) {
    const durationBarEl = this.shadowRoot!.querySelector('.clip__length-bar--duration') as HTMLElement;
    durationBarEl.style.width = this.parentWebchalkSequenceEl!.msToHemStr(newDurationMs === TBA_DURATION ? 0 : newDurationMs);
  }

  updateFullStartTime(startTimeMs: number) {
    const effectEl = this.shadowRoot?.querySelector('.clip__effect') as HTMLElement;
    effectEl.style.marginLeft = this.parentWebchalkSequenceEl!.msToHemStr(startTimeMs);
  }

  updateClipNumber(clipNumber: number) {
    const clipNumberEl = this.shadowRoot!.querySelector('.clip__number') as HTMLElement;
    clipNumberEl.textContent = `${clipNumber}.`;
  }

  attachInfoButtonHandler() {
    const infoButton = this.shadowRoot!.querySelector('.clip__info-button') as HTMLButtonElement;
    infoButton?.addEventListener('click', this.handleInfoButtonClick);
  }

  handleInfoButtonClick = (e: PointerEvent) => {
    if (this.infoBoxShown) {
      const infoBox = this.shadowRoot!.querySelector('webchalk-clip-info-box') as WebchalkClipInfoBoxElement;
      infoBox?.remove();
      this.infoBoxShown = false;
      this.classList.remove('info-box-shown');
    }
    else {
      const infoBox = new WebchalkClipInfoBoxElement();
      infoBox.shadowRoot?.querySelector('.clip-info-box')!.classList.add(`clip-info-box--${this.category.toLowerCase().replaceAll(/\s/g, '-')}`);
      const clipEffect = this.shadowRoot?.querySelector('.clip__effect') as HTMLElement;
      clipEffect.insertAdjacentElement('afterend', infoBox);
      this.infoBoxShown = true;
      this.classList.add('info-box-shown');
      // webchalk.createAnimationClipFactories().Scroller(this.closest('.sequence__schedule'), '~scroll-self', [infoBox, {scrollableOffset: ['center', '20%']}], {duration: 100}).play();
    }
  };
}
