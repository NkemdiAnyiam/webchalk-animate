import * as fs from 'fs';
import { stylesheet } from './componentStyleString';

import { createElFromString, TBA_DURATION } from './src/4_utils/helpers';
import { EffectCategory } from './src/4_utils/interfaces';
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

// TODO: playhead forward position should be equivalent to the fullStartTime of any inProgressClip + that clip's currentTime
// playhead backward position should be equivalent the the fullFinishTime of any inProgressClip - that clip's currentTime

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
  insertTrack(
    index: number,
    pseudoClip: {
      effectCategory: EffectCategory;
      effectName: string;
      effectDescription: string;
      startsWithPrev: boolean;
      startsNextClipToo: boolean;
      delay: number;
      duration: number;
      endDelay: number;
    },
  ) {
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

    // TODO: move somewhere else

    const {
      effectCategory,
      effectName,
      effectDescription,
      startsWithPrev,
      startsNextClipToo,
      delay,
      duration,
      endDelay,
    } = pseudoClip;

    const trackBefore = sequenceTracks.querySelector(`:scope > :nth-child(${(index + 1) - 1})`) as HTMLElement;
    const hemBefore = trackBefore ? hemFromClip(trackBefore.querySelector('.clip')!, {startsWith: startsWithPrev}) : 0;

    const trackStr = /*html*/`
      <div class="sequence__track">
        <div class="sequence__track-header">
          <span class="sequence__track-number">${index + 1}.</span>
        </div>
        <div class="sequence__track-body">
          <div class="clip clip--${effectCategory.toLowerCase().replaceAll(' ', '-')}" style="margin-left: ${hem(hemBefore)};">
            <div class="clip__length-bars">
              <div class="clip__length-bar clip__length-bar--delay" style="width: ${hem(msToNumHem(delay))};${delay === 0 ? ' border: none;' : ''}"></div>
              <div class="clip__length-bar clip__length-bar--duration" style="width: ${hem(msToNumHem(duration === TBA_DURATION ? 0 : duration))};"></div>
              <div class="clip__length-bar clip__length-bar--end-delay" style="width: ${hem(msToNumHem(endDelay))};${endDelay === 0 ? ' border: none;' : ''}"></div>
            </div>
            <div class="clip__label">
              <div class="clip__effect-category">
                <div class="clip__effect-category-icon">${categoryToAbbrev(effectCategory)}</div>
              </div>
              <div class="clip__effect-name-box">
                <div class="clip__effect-name">${effectName}</div>
              </div>
              <div class="clip__description-box">
                <p class="clip__description-text">
                  ${effectDescription}
                </p>
              </div>
              <div class="clip__info-button-box">
                <button class="clip__info-button">i</button>
              </div>
            </div>
          </div>
        </div>
      </div>`
    ;

    const track = createElFromString(trackStr) as HTMLElement;
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

  buildTracksFromSequence(
    sequence: AnimSequence,
  ) {
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

    const sequenceTracks = this.shadowRoot!.querySelector('.sequence__tracks') as HTMLDivElement;

    requestAnimationFrame(() => {
      for (let i = 0; i < sequence.animClips.length; ++i) {
        const clip = sequence.animClips[i];
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
        const trackNumber = i + 1;

        const trackStr = /*html*/`
          <div class="sequence__track">
            <div class="sequence__track-header">
              <span class="sequence__track-number">${trackNumber}.</span>
            </div>
            <div class="sequence__track-body">
              <div class="clip clip--${category.toLowerCase().replaceAll(' ', '-')}" style="margin-left: ${hem(msToNumHem(fullStartTime))};">
                <div class="clip__length-bars">
                  <div class="clip__length-bar clip__length-bar--delay" style="width: ${hem(msToNumHem(delay))};${delay === 0 ? ' border: none;' : ''}"></div>
                  <div class="clip__length-bar clip__length-bar--duration" style="width: ${hem(msToNumHem(duration === TBA_DURATION ? 0 : duration))};"></div>
                  <div class="clip__length-bar clip__length-bar--end-delay" style="width: ${hem(msToNumHem(endDelay))};${endDelay === 0 ? ' border: none;' : ''}"></div>
                </div>
                <div class="clip__label">
                  <div class="clip__effect-category">
                    <div class="clip__effect-category-icon">${categoryToAbbrev(category)}</div>
                  </div>
                  <div class="clip__effect-name-box">
                    <div class="clip__effect-name">${effectName}</div>
                  </div>
                  <div class="clip__description-box">
                    <p class="clip__description-text">
                      
                    </p>
                  </div>
                  <div class="clip__info-button-box">
                    <button class="clip__info-button">i</button>
                  </div>
                </div>
              </div>
            </div>
          </div>`
        ;

        const track = createElFromString(trackStr) as HTMLElement;
        track.querySelector('.clip__description-text')!.textContent = description;
        sequenceTracks.appendChild(track);
      }
      
      this.updateMaxSecondsDisplayed(sequence.maxTime / 1000);
    });
  }

  updateTracks(indexClipPairs: [index: number, clip: AnimClip][], sequence: AnimSequence) {
    const sequenceTracks = this.shadowRoot!.querySelector('.sequence__tracks') as HTMLDivElement;

    function msToHem(ms: number) { return ms / 1000 * getHemsPerSecond(); }

    requestAnimationFrame(() => {
      for (const [index, clip] of indexClipPairs) {
        let nthChild = index + 1;
        const clipEl = sequenceTracks.querySelector(`.sequence__track:nth-child(${nthChild}) .clip`) as HTMLElement;
        clipEl.style.marginLeft = hem(msToHem(clip.fullStartTime));
        
        // TODO: only do if rate-based clip
        const durationBarEl = clipEl.querySelector('.clip__length-bar--duration') as HTMLElement;
        durationBarEl.style.width = hem(msToHem(clip.getTiming('duration')));
      }
    });

    this.updateMaxSecondsDisplayed(sequence.maxTime / 1000);
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
