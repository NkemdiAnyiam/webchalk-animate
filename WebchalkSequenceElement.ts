import * as fs from 'fs';
import { stylesheet } from './componentStyleString';

import { createElFromString } from './src/4_utils/helpers';

const str = fs.readFileSync('./htmlComponents/sequence.html', 'utf-8');

export class WebchalkSequenceElement extends HTMLElement {
  /**@internal*/ static addToCustomElementRegistry() { customElements.define('webchalk-sequence', WebchalkSequenceElement); }
  maxSecondsDisplayed: number = 0;
  
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

    this.updateMaxSecondsDisplayed(6);

    this.attachScheduleDraggers();
  }

  updateMaxSecondsDisplayed(time: number) {
    if (Math.ceil(time) > this.maxSecondsDisplayed) {
      const newMaxTime = Math.ceil(time);
      const sequenceScheduleTimes = this.shadowRoot!.querySelector('.sequence__schedule-times');

      for (let currSeconds = this.maxSecondsDisplayed + 1; currSeconds <= Math.ceil(newMaxTime); ++currSeconds) {
        const scheduleTimeWrapper = createElFromString<HTMLElement>(/*html*/`
          <div class="sequence__schedule-time-wrapper">
            <span class="sequence__schedule-time">0:${String(currSeconds).padStart(2, '0')}</span>
          </div>`
        );

        sequenceScheduleTimes?.appendChild(scheduleTimeWrapper);
      }

      const ticksString = /*html*/`
        <div class="sequence__tick sequence__tick--whole"></div>
        <div class="sequence__tick sequence__tick--tenth"></div>
        <div class="sequence__tick sequence__tick--tenth"></div>
        <div class="sequence__tick sequence__tick--tenth"></div>
        <div class="sequence__tick sequence__tick--tenth"></div>
        <div class="sequence__tick sequence__tick--half"></div>
        <div class="sequence__tick sequence__tick--tenth"></div>
        <div class="sequence__tick sequence__tick--tenth"></div>
        <div class="sequence__tick sequence__tick--tenth"></div>
        <div class="sequence__tick sequence__tick--tenth"></div>`
        .repeat(newMaxTime - this.maxSecondsDisplayed)
      ;

      const sequenceTicks = this.shadowRoot!.querySelector('.sequence__ticks');
      sequenceTicks?.insertAdjacentHTML('beforeend', ticksString);
    }
    else if (Math.floor(time) < this.maxSecondsDisplayed) {

    }
  }

  insertTrack() {
    
  }

  attachScheduleDraggers() {
    const clipTracks = this.shadowRoot?.querySelector('.sequence__tracks') as HTMLDivElement;
    const schedule = clipTracks.closest('.sequence__schedule') as HTMLDivElement;

    const handleClick = (e: MouseEvent) => {
      const clipTrack = (e.target as HTMLElement);
      // only do process if a track was clicked
      if (!clipTrack.classList.contains('sequence__track-body')) { return; }

      // unhighlight all text to prevent annoying dragging issues
      document.getSelection()?.removeAllRanges();
      // prevent user selection to handle other annoying dragging issues
      schedule.classList.add('user-select-none');

      const handleDrag = (e: MouseEvent) => {
        const [x, y] = [e.movementX, e.movementY];
        if (y !== 0) {
          const newY = y < 0 ? Math.floor(schedule.scrollTop - y) : Math.ceil(schedule.scrollTop - y);
          schedule.scrollTo({top: newY, behavior: 'instant'});
        }
        if (x !== 0) {
          const newX = x < 0 ? Math.floor(schedule.scrollLeft - x) : Math.ceil(schedule.scrollLeft - x);
          schedule.scrollTo({left: newX, behavior: 'instant'});
        }
      }

      const handleRelease = (e: MouseEvent) => {
        // remove all event listeners related to dragging this schedule
        schedule.classList.remove('user-select-none');
        window.removeEventListener('mousemove', handleDrag);
        window.removeEventListener('mouseup', handleRelease);
        window.removeEventListener('mouseleave', handleRelease);
      }

      // add listeners for handling drag and release to window
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleRelease);
      window.addEventListener('mouseleave', handleRelease);
    };

    clipTracks.addEventListener('mousedown', handleClick);
  }
}
