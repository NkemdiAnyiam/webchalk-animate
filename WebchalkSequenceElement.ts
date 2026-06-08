import * as fs from 'fs';
import { stylesheet } from './componentStyleString';

import { createElFromString } from './src/4_utils/helpers';
import { AnimSequence } from './src/1_playbackStructures/AnimationSequence';
import { AnimClip } from './src/1_playbackStructures/AnimationClip';
import { WebchalkTimelinePaneElement } from './WebchalkTimelinePane';

const str = fs.readFileSync('./htmlComponents/sequence.html', 'utf-8');

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

export class WebchalkSequenceElement extends HTMLElement {
  /**@internal*/ static addToCustomElementRegistry() { customElements.define('webchalk-sequence', WebchalkSequenceElement); }
  maxSecondsDisplayed: number = 0;
  private playheadEl: HTMLElement;
  private playheadTrailEl: HTMLElement;
  
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

  insertClips(insertionIndex: number, newClips: AnimClip[], allClips: AnimClip[]) {
    const sequenceClips = this.shadowRoot!.querySelector('.sequence__clips') as HTMLElement;

    // clip elements will be made for any clips that don't have ui attached

    // insert the first clip and then use it as the insertion point
    const firstNewClip = newClips[0];
    if (!firstNewClip.uiAttached) { firstNewClip.attachUI(); }
    firstNewClip.updateClipNumber(insertionIndex + 1);

    if (insertionIndex === 0) {
      sequenceClips.insertAdjacentElement('afterbegin', firstNewClip.webchalkClipEl!);
    }
    else if (sequenceClips.children[insertionIndex - 1]) {
      sequenceClips.children[insertionIndex - 1].insertAdjacentElement('afterend', firstNewClip.webchalkClipEl!);
    }
    else {
      sequenceClips.insertAdjacentElement('beforeend', firstNewClip.webchalkClipEl!);
    }
    let insertionPoint: AnimClip;

    // insert new clip elements
    for (let i = insertionIndex + 1; i < newClips.length; ++i) {
      insertionPoint = newClips[i - 1];
      const newClip = newClips[i];
      if (!newClip.uiAttached) { newClip.attachUI(); }
      newClip.updateClipNumber(i + 1);
      insertionPoint.webchalkClipEl?.insertAdjacentElement('afterend', newClip.webchalkClipEl!);
    }

    // update clip numbers for any pre-existing clips after the insertion index
    for (let i = insertionIndex + newClips.length; i < allClips.length; ++i) {
      allClips[i].updateClipNumber(i + 1);
    }
  }

  buildTracksFromSequence(sequence: AnimSequence) {
    const sequenceTracks = this.shadowRoot!.querySelector('.sequence__clips') as HTMLElement;

    requestAnimationFrame(() => {
      for (let i = 0; i < sequence.animClips.length; ++i) {
        const clip = sequence.animClips[i];
        // TODO: check to make sure clip element is actually built first
        sequenceTracks.appendChild(clip.webchalkClipEl!);
      }
      
      this.updateMaxSecondsDisplayed(sequence.maxTime / 1000);
    });
  }

  private playheadForwardLoop(inProgressClips: Map<number, AnimClip>) {
    if (this.stop) {
      this.stop = false;
      return;
    }

    const clip = [...inProgressClips.values()][0];
    if (clip) {
      const currScheduleMs = clip.fullStartTime + clip.currentTime;
      this.playheadTrailEl.style.width = `${hem(msToNumHem(currScheduleMs))}`;
      this.playheadEl.style.translate = `${hem(msToNumHem(currScheduleMs))}`;
    }

    requestAnimationFrame(() => {
      this.playheadForwardLoop(inProgressClips);
    });
  }

  updateDescription(description: string) {
    const sequenceDescriptionEl = this.shadowRoot!.querySelector('.sequence__description') as HTMLElement;
    sequenceDescriptionEl.textContent = `${description}.`;
  }

  private playheadBackwardLoop(inProgressClips: Map<number, AnimClip>) {
    if (this.stop) {
      this.stop = false;
      return;
    }

    const clip = [...inProgressClips.values()][0];
    if (clip) {
      const currScheduleMs = clip.fullFinishTime - clip.currentTime;
      this.playheadTrailEl.style.width = `${hem(msToNumHem(currScheduleMs))}`;
      this.playheadEl.style.translate = `${hem(msToNumHem(currScheduleMs))}`;
    }

    requestAnimationFrame(() => {
      this.playheadBackwardLoop(inProgressClips);
    });
  }

  startPlayhead(inProgressClips: Map<number, AnimClip>, direction: 'forward' | 'backward') {
    if (direction === 'forward') {
      requestAnimationFrame(() => {
        this.playheadForwardLoop(inProgressClips);
      });
    }
    else if (direction === 'backward') {
      requestAnimationFrame(() => {
        this.playheadBackwardLoop(inProgressClips);
      });
    }
    else {
      throw new RangeError(`Invalid direction '${direction}'. Must be 'forward' or 'backward'.`)
    }
  }

  private stop = false;

  stopPlayhead(maxTimeMs: number) {
    this.stop = true;
    this.playheadEl.style.translate = `${hem(msToNumHem(maxTimeMs))}`;
    this.playheadTrailEl.style.width = `${hem(msToNumHem(maxTimeMs))}`;
  }

  attachScheduleDraggers() {
    const clipTracks = this.shadowRoot?.querySelector('.sequence__clips') as HTMLDivElement;
    const schedule = clipTracks.closest('.sequence__schedule') as HTMLDivElement;

    const handleClick = (e: MouseEvent) => {
      // need to select from composedPath() because e.target would just see webchalk-clip
      const clickTarget = e.composedPath()[0] as HTMLElement;
      // only do process if a track was clicked
      if (!clickTarget.classList.contains('clip__body')) { return; }

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
