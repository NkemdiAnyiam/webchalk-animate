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

  updateMaxSecondsDisplayed(time: number) {
    if (Math.ceil(time) > this.maxSecondsDisplayed) {
      const newMaxTime = Math.ceil(time);
      const sequenceScheduleTimes = this.shadowRoot!.querySelector('.sequence__schedule-times');
      const sequenceTicks = this.shadowRoot!.querySelector('.sequence__ticks');

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

      requestAnimationFrame(() => {
        for (let currSeconds = this.maxSecondsDisplayed + 1; currSeconds <= Math.ceil(newMaxTime); ++currSeconds) {
          const scheduleTimeWrapper = createElFromString<HTMLElement>(/*html*/`
            <div class="sequence__schedule-time-wrapper">
              <span class="sequence__schedule-time">0:${String(currSeconds).padStart(2, '0')}</span>
            </div>`
          );
  
          sequenceScheduleTimes?.appendChild(scheduleTimeWrapper);
        }
        sequenceTicks?.insertAdjacentHTML('beforeend', ticksString);
        
        this.maxSecondsDisplayed = newMaxTime;
      });

    }
    else if (Math.floor(time) < this.maxSecondsDisplayed) {

    }
  }

  // TODO: update to read from actual start times and not margins
  insertTrack(index: number, clip: AnimClip) {
    const sequenceTracks = this.shadowRoot!.querySelector('.sequence__tracks') as HTMLDivElement;

    function hemFromClip(clip: HTMLElement, options: { startsWith?: boolean } = {}): number {
      return Number.parseFloat(
        clip.style.marginLeft.match(/calc\((-?\d+(?:\.\d+)?|-?\.\d+) \* var\(--hem\)\)/)?.[1] ?? '-3'
      ) + (
        options.startsWith
          ? Number.parseFloat((clip.querySelector('.clip__length-bar--delay') as HTMLElement)
            .style.width
            .match(/calc\((-?\d+(?:\.\d+)?|-?\.\d+) \* var\(--hem\)\)/)?.[1] ?? '-3'
          )
          : Number.parseFloat((clip.querySelector('.clip__length-bar--delay') as HTMLElement)
            .style.width
            .match(/calc\((-?\d+(?:\.\d+)?|-?\.\d+) \* var\(--hem\)\)/)?.[1] ?? '-3'
          ) + Number.parseFloat((clip.querySelector('.clip__length-bar--duration') as HTMLElement)
            .style.width
            .match(/calc\((-?\d+(?:\.\d+)?|-?\.\d+) \* var\(--hem\)\)/)?.[1] ?? '-3'
          ) + Number.parseFloat((clip.querySelector('.clip__length-bar--end-delay') as HTMLElement)
            .style.width
            .match(/calc\((-?\d+(?:\.\d+)?|-?\.\d+) \* var\(--hem\)\)/)?.[1] ?? '-3'
          )
      );
    }
    
    // const trackBefore = sequenceTracks.querySelector(`:scope > :nth-child(${(index + 1) - 1})`) as HTMLElement;

    const trackStr = /*html*/`
      <div class="sequence__track">
        <div class="sequence__track-header">
          <span class="sequence__track-number">${index + 1}.</span>
        </div>
        <div class="sequence__track-body"></div>
      </div>`
    ;

    const track = createElFromString(trackStr) as HTMLElement;
    track.querySelector('.sequence__track-body')!.insertAdjacentElement('beforeend', clip.webchalkClipEl!);
    const trackAfter = sequenceTracks.querySelector(`:scope > :nth-child(${index + 1})`);
    if (!trackAfter) {
      sequenceTracks.appendChild(track);
    }
    else {
      trackAfter.insertAdjacentElement('beforebegin', track);
      const trackClip = track.querySelector('.clip') as HTMLElement;
      let currAfterTrack: Element | null = trackAfter;
      let currTrackNumber = index + 1;
      // TODO: instead, base off of start times to prevent compounding pixel errors
      while (currAfterTrack) {
        currAfterTrack.querySelector('.sequence__track-number')!.textContent = String(++currTrackNumber);
        const currAfterTrackClip = currAfterTrack.querySelector('.clip') as HTMLElement;
        console.log(currAfterTrackClip.style.marginLeft);
        console.log(currAfterTrack);
        currAfterTrackClip.style.marginLeft = hem(hemFromClip(currAfterTrackClip) + hemFromClip(trackClip, {startsWith: true}));
        currAfterTrack = currAfterTrack.nextElementSibling;
      }
    }
  }

  buildTracksFromSequence(sequence: AnimSequence) {
    const sequenceTracks = this.shadowRoot!.querySelector('.sequence__tracks') as HTMLElement;

    requestAnimationFrame(() => {
      for (let i = 0; i < sequence.animClips.length; ++i) {
        const trackStr = /*html*/`
          <div class="sequence__track">
            <div class="sequence__track-header">
              <span class="sequence__track-number">${i + 1}.</span>
            </div>
            <div class="sequence__track-body"></div>
          </div>`
        ;

        const track = createElFromString(trackStr) as HTMLElement;
        const clip = sequence.animClips[i];
        clip.webchalkClipEl?.updateFullStartTime(clip.fullStartTime);
        track.querySelector('.sequence__track-body')!.insertAdjacentElement('beforeend',clip.webchalkClipEl!);
        sequenceTracks.appendChild(track);
      }
      
      this.updateMaxSecondsDisplayed(sequence.maxTime / 1000);
    });
  }

  updateSchedule(clips: AnimClip[], maxTimeMs: number) {
    requestAnimationFrame(() => {
      for (const clip of clips) {
        const clipEl = clip.webchalkClipEl!;
        clipEl.updateFullStartTime(clip.fullStartTime);
      }
    });

    this.updateMaxSecondsDisplayed(maxTimeMs / 1000);
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
