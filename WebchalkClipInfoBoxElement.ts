import * as fs from 'fs';
import { stylesheet } from './componentStyleString';
import { clamp, createCodeEl, createElFromString, dequoteJSON, getOpeningTag, highlightCodeEls, numToOrdinal } from './src/4_utils/helpers';
/** @ts-ignore */
import { AnimClip } from './src/1_playbackStructures/AnimationClip';

const str = fs.readFileSync('./htmlComponents/clip-info-box.html', 'utf-8');
const hostStyles = new CSSStyleSheet();
hostStyles.replaceSync(/*css*/`
  :host {
    /*
    max-height: clip-based-height-units(7.5);
    transition: max-height 0.1s;
    margin-right: hem(-50);
    */
    /* grid-area: info-box;
    position: sticky; */
    position: relative;
    flex-basis: 500px;
    /* width: 500px; */
    flex-shrink: 0;
    right: 0;
    top: calc(0.8 * var(--hem));
    /* z-index: 5; */
    min-width: 230px;
    max-width: 1050px;
  }
`);

export class WebchalkClipInfoBoxElement extends HTMLElement {
  /**@internal*/ static addToCustomElementRegistry() { customElements.define('webchalk-clip-info-box', WebchalkClipInfoBoxElement); }

  currentTabButtonEl: HTMLButtonElement;
  clip?: AnimClip;
  
  constructor() {
    super();
    const shadow = this.attachShadow({mode: 'open'});
    shadow.adoptedStyleSheets = [stylesheet, hostStyles];
    const htmlString = /*html*/`
      ${str}
    `;

    const template = document.createElement('template');
    template.innerHTML = htmlString;
    const element = template.content.cloneNode(true);
    shadow.append(element);

    this.attachClipInfoBoxResizer();
    this.attachTabListeners();
    this.attachCloseButtonListener();

    this.currentTabButtonEl = this.shadowRoot!.querySelector('.clip-info-box__tab-button--current') as HTMLButtonElement;
  }

  attachTabListeners() {
    const tabEls = [...this.shadowRoot!.querySelectorAll('.clip-info-box__tab-button')] as HTMLButtonElement[];

    for (const tabEl of tabEls) {
      tabEl.addEventListener('click', () => {
        // If tab already selected, do nothing.
        if (tabEl === this.currentTabButtonEl) { return; }
        this.changeTab(tabEl);
      });
    }
  }

  handleRemoval: () => void = () => {};

  attachCloseButtonListener() {
    const closeButtonEl = this.shadowRoot!.querySelector('.clip-info-box__close-button') as HTMLButtonElement;
    const handleClick = () => {
      this.handleRemoval();
    };
    closeButtonEl.addEventListener('click', handleClick, {once: true});
  }

  changeTab(tabEl: HTMLButtonElement) {
    this.currentTabButtonEl.classList.remove('clip-info-box__tab-button--current');
    tabEl.classList.add('clip-info-box__tab-button--current');
    this.currentTabButtonEl = tabEl;

    const bodyEl = this.shadowRoot!.querySelector('.clip-info-box__body') as HTMLElement;
    const frag = new DocumentFragment();
    const clip = this.clip!;

    switch(tabEl.textContent.trim().toLowerCase().replaceAll(' ', '-')) {
      case 'location': {
        const {parentTimeline, parentSequence, clipNumber} = clip.getHierarchy();
        const { category, effectName } = clip.getEffectDetails();
        const {description: sequenceDescription} = parentSequence!.getConfig();
        const {sequenceNumber} = parentSequence!.getHierarchy();
        const sequenceJumpTag = parentSequence!.getJumpTag();

        frag.appendChild(createElFromString(/*html*/`
          <section class="clip-info-box__section">
            <p class="clip-info-box__section-name">Timeline</p>
            <div class="clip-info-box__section-body">
              <div class="rows">
                <div class="row">
                  <div class="col col--head">Name</div>
                  <div class="col col--body">${parentTimeline?.getConfig().timelineName}</div>
                </div>
              </div>
            </div>
          </section>
        `));

        frag.appendChild(createElFromString(/*html*/`
          <section class="clip-info-box__section">
            <p class="clip-info-box__section-name">Sequence</p>
            <div class="clip-info-box__section-body">
              <div class="rows">
                <div class="row">
                  <div class="col col--head">Number</div>
                  <div class="col col--body">${numToOrdinal(sequenceNumber)}</div>
                </div>
                <div class="row">
                  <div class="col col--head">Description</div>
                  <div class="col col--body">${sequenceDescription}</div>
                </div>
                <div class="row">
                  <div class="col col--head">Jump Tag</div>
                  <div class="col col--body">${sequenceJumpTag}</div>
                </div>
              </div>
            </div>
          </section>
        `));

        frag.appendChild(createElFromString(/*html*/`
          <section class="clip-info-box__section">
            <p class="clip-info-box__section-name">Clip</p>
            <div class="clip-info-box__section-body">
              <div class="rows">
                <div class="row">
                  <div class="col col--head">Number</div>
                  <div class="col col--body">${numToOrdinal(clipNumber)}</div>
                </div>
                <div class="row">
                  <div class="col col--head">Category</div>
                  <div class="col col--body">${category}</div>
                </div>
                <div class="row">
                  <div class="col col--head">Effect</div>
                  <div class="col col--body">${effectName}</div>
                </div>
                <div class="row">
                  <div class="col col--head">DOM Tag</div>
                  <div class="col col--body">${createCodeEl(getOpeningTag(clip.domElem).replace('<', '&lt;').replace('>', '&gt;'), 'html', 'block').outerHTML}</div>
                </div>
              </div>
            </div>
          </section>
        `));
      }
      break;

      case 'effect-options': {
        const args = clip.getEffectDetails('effectOptions');
        const sectionEl = createElFromString('<section class="clip-info-box__section"></section>');

        if (args.length === 0) {
          sectionEl.appendChild(createElFromString(`<p>No arguments were passed to this effect.</p>`));
        }
        else {
          for (let i = 0; i < args.length; ++i) {
            const arg = args[i];
  
            sectionEl.appendChild(createElFromString(`<p class="clip-info-box__section-name">arg${i + 1}</p>`));
            sectionEl.appendChild(createCodeEl(dequoteJSON(arg!), 'ts', 'block'));
          }
        }

        frag.appendChild(sectionEl);
      }
      break;

      case 'configuration': {
        const sectionEl = createElFromString('<section class="clip-info-box__section"></section>');
        sectionEl.appendChild(createElFromString('<p class="clip-info-box__section-name">Final Configuration</p>'));
        sectionEl.appendChild(createCodeEl(dequoteJSON(clip.getConfig()), 'ts', 'block'));
        frag.appendChild(sectionEl);
      }
      break;

      default: throw new RangeError(`Invalid content type "${tabEl.textContent}".`);
    }

    bodyEl.innerHTML = '';
    bodyEl.appendChild(frag);

    highlightCodeEls(bodyEl);
  }

  attachClipInfoBoxResizer() {
    const infoBox = this.shadowRoot!.querySelector('.clip-info-box') as HTMLElement;
    
    infoBox.addEventListener('mousedown', this.handleResizerClick);
  };

  detachClipInfoBoxResizer() {
    const infoBox = this.shadowRoot!.querySelector('.clip-info-box') as HTMLElement;
    infoBox.removeEventListener('mousedown', this.handleResizerClick);
  }

  handleResizerClick = (e: MouseEvent) => {
    const infoBox = this.shadowRoot!.querySelector('.clip-info-box') as HTMLElement;

    const clickTarget = (e.target as HTMLElement);
    // only do process if resizer was clicked
    if (!clickTarget.classList.contains('clip-info-box__resizer')) { return; }

    // unhighlight all text to prevent annoying dragging issues
    document.getSelection()?.removeAllRanges();
    // prevent selection in order to prevent other annoying dragging issues
    infoBox.classList.add('user-select-none');

    let handleDrag: (e: MouseEvent) => void;
    if (clickTarget.classList.contains('clip-info-box__resizer--width')) {
      handleDrag = (e: MouseEvent) => {
        // change box width based on mouse movement
        const x = e.movementX;
        const {flexBasis, minWidth, maxWidth} = getComputedStyle(this);
        this.style.flexBasis = `${clamp(
          Number.parseFloat(minWidth),
          Number.parseFloat(flexBasis) + x,
          Number.parseFloat(maxWidth) || Infinity
        )}px`;
      }
    }
    else {
      // const timelineUI = (e.composedPath() as HTMLElement[]).find(target => target.classList?.contains('timeline'))!;
      // const scheduleEl = (e.composedPath() as HTMLElement[]).find(target => target.classList?.contains('sequence__schedule'))!;
      const bodyEl = this.shadowRoot?.querySelector('.clip-info-box__body') as HTMLElement;
      handleDrag = (e: MouseEvent) => {
        // change box height based on mouse movement
        const y = e.movementY;
        // TODO: figure out how to fine-tune if including overall scroll or timeline height
        // timelineUI.style.height = `${Number.parseFloat(getComputedStyle(timelineUI).height) - y}px`;
        // scheduleEl.scrollTo({top: scheduleEl.scrollTop + y, behavior: 'instant'});
        const {height, minHeight, maxHeight} = getComputedStyle(bodyEl);
        bodyEl.style.height = `${clamp(
          Number.parseFloat(minHeight),
          Number.parseFloat(height) + y,
          Number.parseFloat(maxHeight) || Infinity
        )}px`;
      }
    }

    const handleRelease = () => {
      // remove all event listeners
      infoBox.classList.remove('user-select-none');
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleRelease);
      window.removeEventListener('mouseleave', handleRelease);
    }

    // add listeners for handling drag and release to window
    window.addEventListener('mousemove', handleDrag);
    window.addEventListener('mouseup', handleRelease);
    window.addEventListener('mouseleave', handleRelease);
  };
}
