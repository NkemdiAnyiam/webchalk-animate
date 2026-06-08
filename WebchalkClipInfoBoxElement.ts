import * as fs from 'fs';
import { stylesheet } from './componentStyleString';

const str = fs.readFileSync('./htmlComponents/clip-info-box.html', 'utf-8');
const hostStyles = new CSSStyleSheet();
hostStyles.replaceSync(/*css*/`
  :host {
    /*
    max-height: clip-based-height-units(7.5);
    transition: max-height 0.1s;
    margin-right: hem(-50);
    */
    grid-area: info-box;
    position: sticky;
    flex-basis: 500px;
    flex-shrink: 0;
    right: 0;
    top: 0;
    z-index: 5;
    min-width: 230px;
    max-width: 1050px;
  }
`);

export class WebchalkClipInfoBoxElement extends HTMLElement {
  /**@internal*/ static addToCustomElementRegistry() { customElements.define('webchalk-clip-info-box', WebchalkClipInfoBoxElement); }
  
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

    const handleDrag = (e: MouseEvent) => {
      // change box width based on mouse movement
      const x = e.movementX;
      this.style.flexBasis = `${Number.parseFloat(getComputedStyle(this).flexBasis) - x}px`;
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
