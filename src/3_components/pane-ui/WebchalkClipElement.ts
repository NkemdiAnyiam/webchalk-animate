import * as fs from 'fs';
import { stylesheet } from './componentStyleSheet';
import { htmlComponentStr } from './templates/ts/clip';

import { AnimClip } from '../../1_playbackStructures/AnimationClip';
import { TBA_DURATION } from '../../4_utils/helpers';
import { EffectCategory } from '../../4_utils/interfaces';
import { WebchalkSequenceElement } from './WebchalkSequenceElement';
import { WebchalkClipInfoBoxElement } from './WebchalkClipInfoBoxElement';
import { WebchalkPhaseSegmentElement } from './WebchalkPhaseSegmentElement';

let devHtmlComponentStr: string;
if (process.env.NODE_ENV === 'development') {
  devHtmlComponentStr = fs.readFileSync(__dirname+'/templates/html/clip.html', 'utf-8');
}

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

   /** @internal */ parentWebchalkSequenceEl: WebchalkSequenceElement | undefined;
  private infoBoxShown = false;
  private category: EffectCategory = '' as EffectCategory; // TODO: incorporate better

  animClip?: AnimClip;
  
  constructor() {
    super();
    const shadow = this.attachShadow({mode: 'open'});
    shadow.adoptedStyleSheets = [stylesheet];
    const htmlString = /*html*/`
      ${devHtmlComponentStr ?? htmlComponentStr}
    `;

    const template = document.createElement('template');
    template.innerHTML = htmlString;
    const element = template.content.cloneNode(true);
    shadow.append(element);

    this.attachInfoButtonHandler();
  }

  readClip() {
    const clip = this.animClip!;
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

    const phaseSegmentEls = [...new Set(
      [...clip.animation.phaseSegmentsForward, ...clip.animation.phaseSegmentsBackward]
      .map(segment => segment.phaseSegmentEl as WebchalkPhaseSegmentElement)
      .filter(segmentEl => segmentEl)
    )];
    this.insertPhaseSegmentEls(phaseSegmentEls);
    
    this.catchUpUI();
  }

  catchUpUI() {
    const clip = this.animClip!;

    // If clip has an error
    if (clip.getStatus('errored')) { this.handleErrorState(); }
  }

  remove() {
    super.remove();
    this.removeInfoBox();
    [...this.shadowRoot?.querySelector('.clip__phase-segments')?.children!].forEach(phaseSegmentEl => phaseSegmentEl.remove());
    this.parentWebchalkSequenceEl = undefined;
    this.animClip = undefined;
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

  insertPhaseSegmentEls(phaseSegmentEls: WebchalkPhaseSegmentElement[]) {
    if (phaseSegmentEls.length === 0) { return; }

    const phaseSegmentsEl = this.shadowRoot!.querySelector('.clip__phase-segments') as HTMLElement;
    // TODO: sort by timing
    // phaseSegments.sort()
    
    const frag = new DocumentFragment();
    for (const phaseSegmentEl of phaseSegmentEls) {
      phaseSegmentEl.parentWebchalkClipEl = this;
      phaseSegmentEl.addUI();
      frag.append(phaseSegmentEl);
    }
    phaseSegmentsEl.appendChild(frag);
  }

  attachInfoButtonHandler() {
    const infoButton = this.shadowRoot!.querySelector('.clip__info-button') as HTMLButtonElement;
    infoButton?.addEventListener('click', this.handleInfoButtonClick);
  }

  removeInfoBox = () => {
    const infoBox = this.shadowRoot!.querySelector('webchalk-clip-info-box') as WebchalkClipInfoBoxElement;
    infoBox?.remove();
    this.infoBoxShown = false;
    this.classList.remove('info-box-shown');
  };

  handleInfoButtonClick = (e: PointerEvent) => {
    if (this.infoBoxShown) {
      this.removeInfoBox();
    }
    else {
      const infoBox = new WebchalkClipInfoBoxElement();
      infoBox.clip = this.animClip;
      infoBox.handleRemoval = this.removeInfoBox;
      infoBox.changeTab(infoBox.currentTabButtonEl);
      infoBox.shadowRoot?.querySelector('.clip-info-box')!.classList.add(`clip-info-box--${this.category.toLowerCase().replaceAll(/\s/g, '-')}`);
      const clipEffectEl = this.shadowRoot?.querySelector('.clip__effect') as HTMLElement;
      clipEffectEl.insertAdjacentElement('afterend', infoBox);
      this.infoBoxShown = true;
      this.classList.add('info-box-shown');
      // webchalk.createAnimationClipFactories().Scroller(this.closest('.sequence__schedule'), '~scroll-self', [infoBox, {scrollableOffset: ['center', '20%']}], {duration: 100}).play();
    }
  };
  
  handleErrorState() {
    this.classList.add('error');
  }
}
