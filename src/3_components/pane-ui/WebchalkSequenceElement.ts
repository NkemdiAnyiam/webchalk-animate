import * as fs from 'fs';
import { stylesheet } from './componentStyleSheet';
import { htmlComponentStr } from './templates/ts/sequence';

import { createElFromString } from '../../4_utils/helpers';
import { AnimSequence } from '../../1_playbackStructures/AnimationSequence';
import { AnimClip } from '../../1_playbackStructures/AnimationClip';
import { hem, WebchalkTimelinePaneElement } from './WebchalkTimelinePane';
// import { defaultClipFactories } from './src/Webchalk';

let devHtmlComponentStr: string;
if (process.env.NODE_ENV === 'development') {
  devHtmlComponentStr = fs.readFileSync(__dirname+'/templates/html/sequence.html', 'utf-8');
}

export class WebchalkSequenceElement extends HTMLElement {
  /**@internal*/ static addToCustomElementRegistry() { customElements.define('webchalk-sequence', WebchalkSequenceElement); }

  private parentWebchalkTimelineEl: WebchalkTimelinePaneElement | undefined;

  animSequence?: AnimSequence;

  getHemsPerSecond() {
    return Number(getComputedStyle(this)
      .getPropertyValue('--hems-per-second')
      .match(/calc\((-?\d+(?:\.\d+)?|-?\.\d+) \* \d+px\)/)![1]
    );
  }
  msToNumHem(ms: number) { return ms / 1000 * this.getHemsPerSecond(); }
  msToHemStr(ms: number): string { return hem(this.msToNumHem(ms)); }

  private maxSecondsDisplayed: number = 0;
  private playheadEl: HTMLElement;
  private playheadTrailEl: HTMLElement;
  
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

    this.playheadEl = shadow.querySelector('.sequence__playhead') as HTMLElement;
    this.playheadTrailEl = shadow.querySelector('.sequence__playhead-trail') as HTMLElement;

    this.updateMaxSecondsDisplayed(11);
    this.attachScheduleDraggers();
  }

  updateMaxSecondsDisplayed(seconds: number) {
    const newMaxTime = Math.max(Math.ceil(seconds), 11);
    const oldMaxTime = this.maxSecondsDisplayed;

    if (newMaxTime === oldMaxTime) { return; }

    const sequenceScheduleTimes = this.shadowRoot!.querySelector('.sequence__schedule-times') as HTMLElement;
    const sequenceTicks = this.shadowRoot!.querySelector('.sequence__ticks') as HTMLElement;

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
    ;

    // insert schedule times and ticks
    if (newMaxTime > oldMaxTime) {
      for (let currSeconds = oldMaxTime + 1; currSeconds <= newMaxTime; ++currSeconds) {
        const scheduleTimeWrapper = createElFromString<HTMLElement>(/*html*/`
          <div class="sequence__schedule-time-wrapper">
            <span class="sequence__schedule-time">${Math.floor(currSeconds / (60 * 60))}:${String(Math.floor(currSeconds / 60) % 60).padStart(2, '0')}:${String(currSeconds % 60).padStart(2, '0')}</span>
          </div>`
        );

        sequenceScheduleTimes?.appendChild(scheduleTimeWrapper);
      }

      sequenceTicks?.insertAdjacentHTML('beforeend', ticksString.repeat(newMaxTime - oldMaxTime));
    }
    // remove schedule times and ticks
    else {
      for (let currSeconds = 0; currSeconds < oldMaxTime - newMaxTime; ++currSeconds) {
        sequenceScheduleTimes.removeChild(sequenceScheduleTimes.lastElementChild!);
        for (let i = 0; i < 10; ++i) {
          sequenceTicks.removeChild(sequenceTicks.lastElementChild!);
        }
      }
    }

    this.maxSecondsDisplayed = newMaxTime;
  }

  insertClips(insertionIndex: number, newClips: AnimClip[]) {
    if (newClips.length === 0) { return; }

    const sequenceClips = this.shadowRoot!.querySelector('.sequence__clips') as HTMLElement;

    // clip elements will be made for any clips that don't have ui attached

    // insert the first clip and then use it as the insertion point
    const firstNewClip = newClips[0];
    firstNewClip.attachUI();

    if (insertionIndex === 0) {
      sequenceClips.insertAdjacentElement('afterbegin', firstNewClip.webchalkClipEl!);
    }
    else if (sequenceClips.children[insertionIndex - 1]) {
      sequenceClips.children[insertionIndex - 1].insertAdjacentElement('afterend', firstNewClip.webchalkClipEl!);
    }
    else {
      sequenceClips.insertAdjacentElement('beforeend', firstNewClip.webchalkClipEl!);
    }
    firstNewClip.writeUI();

    // insert new clip elements
    let insertionPoint: AnimClip;
    for (let i = insertionIndex + 1; i < newClips.length; ++i) {
      insertionPoint = newClips[i - 1];
      const newClip = newClips[i];
      newClip.attachUI();
      insertionPoint.webchalkClipEl?.insertAdjacentElement('afterend', newClip.webchalkClipEl!);
      newClip.writeUI();
    }
  }

  removeClips(clipsToRemove: AnimClip[]) {
    for (const clip of clipsToRemove) {
      clip.detachUI();
    }
  }

  readSequence() {
    const sequence = this.animSequence!;
    this.parentWebchalkTimelineEl = (this.getRootNode() as ShadowRoot).host as WebchalkTimelinePaneElement;

    const sequenceEl = this.shadowRoot!.querySelector('.sequence') as HTMLElement;

    sequenceEl.querySelector('.sequence__description')!.textContent = sequence.getDescription();
    sequenceEl.querySelector('.sequence__number')!.textContent = `${sequence.getHierarchy().sequenceNumber}.`;
    if (sequence.getTiming('autoplays')) { this.classList.add('autoplays'); }
    if (sequence.getTiming('autoplaysNextSequence')) { this.classList.add('auto-next'); }

    this.insertClips(0, sequence.animClips);
    
    this.updateMaxSecondsDisplayed(sequence.maxTime / 1000);

    this.attachJumpButtonListener();
  }

  remove() {
    super.remove();
    this.parentWebchalkTimelineEl = undefined;
    this.animSequence = undefined;
  }

  updateSequenceNumber(sequenceNumber: number) {
    const sequenceNumberEl = this.shadowRoot!.querySelector('.sequence__number') as HTMLElement;
    sequenceNumberEl.textContent = `${sequenceNumber}.`;
  }

  updateDescription(description: string) {
    const sequenceDescriptionEl = this.shadowRoot!.querySelector('.sequence__description') as HTMLElement;
    sequenceDescriptionEl.textContent = `${description}.`;
  }

  private handlePlayheadEdge(direction: 'forward' | 'backward') {
    const playheadEl = this.playheadEl;
    const scheduleEl = playheadEl.closest('.sequence__schedule') as HTMLElement;
    const scheduleBox = scheduleEl.getBoundingClientRect();
    const infoBoxWidth = scheduleEl.querySelector('webchalk-clip-info-box')?.getBoundingClientRect().width ?? 0;

    // TODO: swap hard-coded 100 with something related to hem
    switch(direction) {
      case 'forward': {
        const pEdge = playheadEl.getBoundingClientRect().right;
        const scheduleEdge = scheduleEl.getBoundingClientRect().right;
        // if right edge of playhead is close to right edge of schedule, scroll schedule
        if (pEdge >= scheduleEdge - infoBoxWidth - 10) {
          const schedule = playheadEl.closest('.sequence__schedule') as HTMLElement;
          schedule.scrollTo({left: schedule.scrollLeft + pEdge - 100, behavior: 'instant'});
        }
        break;
      }
      case 'backward': {
        const pEdge = playheadEl.getBoundingClientRect().left;
        const scheduleEdge = scheduleEl.getBoundingClientRect().left;
        const clipHeaderWidth = scheduleEl.querySelector('webchalk-clip')!.shadowRoot!.querySelector('.clip__header')!.getBoundingClientRect().width;
        if (pEdge <= scheduleEdge + 10 + clipHeaderWidth) {
          scheduleEl.scrollTo({left: scheduleEl.scrollLeft - scheduleBox.width + infoBoxWidth + clipHeaderWidth + 100, behavior: 'instant'});
        }
        break;
      }
      default: throw new RangeError(`Invalid direction "${direction}". Must be "forward" or "backward".`)
    }
  }

  private playheadLoop(direction: 'forward' | 'backward') {
    this.handlePlayheadEdge(direction);

    if (this.playheadStopped) {
      this.playheadStopped = false;
      return;
    }

    const currScheduleMs = this.animSequence!.getTiming('currentTime');
    this.playheadTrailEl.style.width = `${this.msToHemStr(currScheduleMs)}`;
    this.playheadEl.style.translate = `${this.msToHemStr(currScheduleMs)}`;

    requestAnimationFrame(() => {
      this.playheadLoop(direction);
    });
  }

  startPlayhead(direction: 'forward' | 'backward') {
    // this.shadowRoot?.host.scrollIntoView({behavior: 'smooth'});
    
    requestAnimationFrame(() => {
      this.playheadLoop(direction);
    });
  }

  private playheadStopped = false;

  stopPlayhead(maxTimeMs?: number) {
    this.playheadStopped = true;
    const time = maxTimeMs !== undefined ? maxTimeMs : this.animSequence!.getTiming('currentTime');
    this.playheadEl.style.translate = `${this.msToHemStr(time)}`;
    this.playheadTrailEl.style.width = `${this.msToHemStr(time)}`;
  }

  attachScheduleDraggers() {
    const clipTracks = this.shadowRoot?.querySelector('.sequence__clips') as HTMLDivElement;
    
    const handleClick = (e: MouseEvent) => {
      const clipTracks = this.shadowRoot?.querySelector('.sequence__clips') as HTMLDivElement;
      const schedule = clipTracks.closest('.sequence__schedule') as HTMLDivElement;
      // need to select from composedPath() because e.target would just see webchalk-clip
      const clickTarget = e.composedPath()[0] as HTMLElement;
      // only do process if a track was clicked
      if (!clickTarget.classList.contains('clip__body')) { return; }

      // unhighlight all text to prevent annoying dragging issues
      document.getSelection()?.removeAllRanges();
      // prevent user selection to handle other annoying dragging issues
      schedule.classList.add('user-select-none');

      const handleDrag = (e: MouseEvent) => {
        const [dx, dy] = [e.movementX, e.movementY];
        if (dy !== 0) {
          const newY = dy < 0 ? Math.floor(schedule.scrollTop - dy) : Math.ceil(schedule.scrollTop - dy);
          const sequencesContainer = this.parentWebchalkTimelineEl!.shadowRoot!.querySelector('.timeline__sequences-container') as HTMLElement;
          
          // if schedule header is out of view, scroll sequences container upward instead of schedule
          if (dy > 0 && schedule.getBoundingClientRect().top < sequencesContainer.getBoundingClientRect().top) {
            sequencesContainer.scrollBy({top: -dy, behavior: 'instant'});
          }
          // if dragging past the top of schedule, scroll sequences container up
          else if (dy > 0 && schedule.scrollTop === 0) {
            sequencesContainer.scrollBy({top: -dy, behavior: 'instant'});
          }
          // if dragging past the bottom of schedule, scroll sequences container down
          else if (dy < 0 && newY > schedule.scrollHeight - schedule.getBoundingClientRect().height) {
            sequencesContainer.scrollBy({top: -dy, behavior: 'instant'});
          }
          else {
            schedule.scrollTo({top: newY, behavior: 'instant'});
          }
        }
        if (dx !== 0) {
          const newX = dx < 0 ? Math.floor(schedule.scrollLeft - dx) : Math.ceil(schedule.scrollLeft - dx);
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

  attachJumpButtonListener() {
    const jumpButtonEl = this.shadowRoot!.querySelector('.sequence__control--jump-button') as HTMLButtonElement;
    const handleClick = () => {
      const {sequenceNumber, parentTimeline} = this.animSequence!.getHierarchy();
      parentTimeline!.jumpToPosition(sequenceNumber - 1);
    };

    jumpButtonEl.addEventListener('click', handleClick);
  }

  toggleDarkenSchedule(state: boolean) {
    const overlayEl = this.shadowRoot!.querySelector('.sequence__dark-overlay') as HTMLElement;
    if (state === true) {
      overlayEl.classList.add('sequence__dark-overlay--shown');
    }
    else {
      overlayEl.classList.remove('sequence__dark-overlay--shown');
    }
  }

  togglePlayLight(state: boolean) {
    const lightEl = this.shadowRoot!.querySelector('.sequence__control--play-light') as HTMLElement;
    if (state === true) {
      lightEl.classList.add('sequence__control--active');
    }
    else {
      lightEl.classList.remove('sequence__control--active');
    }
  }
}
