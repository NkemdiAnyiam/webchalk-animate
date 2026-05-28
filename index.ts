import { webchalk } from './src/index';
console.log(webchalk);

const {
  Entrance,
  Exit,
  Emphasis,
  Motion,
  TextEditor,
  ConnectorEntrance,
  ConnectorExit,
  ConnectorSetter,
  Scroller,
  Transition,
} = webchalk.createAnimationClipFactories();

const redSquare = document.querySelector('.square');

const seq1 = webchalk.newSequence([
  Motion(redSquare, '~translate', [{translate: '20rem 20rem'}]),
]);
const timeline = webchalk.newTimeline({timelineName: 'main'});
timeline.addSequences([seq1]);


const attachTimelineUIResizer = () => {
  const timelineUI = document.querySelector('.timeline') as HTMLDivElement;

  const handleClick = (e: MouseEvent) => {
    const timelineResizer = (e.target as HTMLElement);
    // only do process if resizer was clicked
    if (!timelineResizer.classList.contains('timeline__resizer')) { return; }

    // unhighlight all text to prevent annoying dragging issues
    document.getSelection()?.removeAllRanges();
    // prevent selection in order to prevent other annoying dragging issues
    timelineUI.classList.add('user-select-none');

    const handleDrag = (e: MouseEvent) => {
      // change UI height based on mouse movement
      const y = e.movementY;
      timelineUI.style.height = `${Number.parseFloat(getComputedStyle(timelineUI).height) - y}px`;
    }

    const handleRelease = (e: MouseEvent) => {
      // remove all event listeners
      timelineUI.classList.remove('user-select-none');
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleRelease);
      window.removeEventListener('mouseleave', handleRelease);
    }

    // add listeners for handling drag and release to window
    window.addEventListener('mousemove', handleDrag);
    window.addEventListener('mouseup', handleRelease);
    window.addEventListener('mouseleave', handleRelease);
  };

  timelineUI.addEventListener('mousedown', handleClick);
};

const attachScheduleDraggers = () => {
  const clipTracksAll = [...document.querySelectorAll('.sequence__tracks')] as HTMLDivElement[];

  for (let i = 0; i < clipTracksAll.length; ++i) {
    const clipTracks = clipTracksAll[i];
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
};

const attachClipInfoBoxResizer = (infoBox: HTMLDivElement) => {
  const handleClick = (e: MouseEvent) => {
    const boxResizer = (e.target as HTMLElement);
    // only do process if resizer was clicked
    if (!boxResizer.classList.contains('clip-info-box__resizer')) { return; }

    // unhighlight all text to prevent annoying dragging issues
    document.getSelection()?.removeAllRanges();
    // prevent selection in order to prevent other annoying dragging issues
    infoBox.classList.add('user-select-none');

    const handleDrag = (e: MouseEvent) => {
      // change box width based on mouse movement
      const x = e.movementX;
      infoBox.style.flexBasis = `${Number.parseFloat(getComputedStyle(infoBox).flexBasis) - x}px`;
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
  
  infoBox.addEventListener('mousedown', handleClick);
  detachClipInfoBoxResizer = () => infoBox.removeEventListener('mousedown', handleClick);
};

attachTimelineUIResizer();
attachScheduleDraggers();


let detachClipInfoBoxResizer: () => void;

const infoBox = document.querySelector('.clip-info-box') as HTMLDivElement;
infoBox.remove();

const infoButton = document.querySelector('.clip__info-button') as HTMLButtonElement;
infoButton.addEventListener('click', () => {
  const queriedInfoBox = document.querySelector('.clip-info-box');
  if (queriedInfoBox) {
    detachClipInfoBoxResizer?.();
    queriedInfoBox.remove();
  }
  else {
    document.querySelector('.sequence__schedule-inner-wrapper')!.insertAdjacentElement('afterend', infoBox);
    attachClipInfoBoxResizer(infoBox);
  }
});


const playhead = document.querySelector('.sequence__playhead') as HTMLDivElement;
const tracks = document.querySelector('.sequence__tracks') as HTMLDivElement;
console.log(playhead);

const loop = () => {
  if (playhead.getBoundingClientRect().right >= tracks.getBoundingClientRect().right - 1) { return; }
  playhead.style.translate = Number.parseFloat(getComputedStyle(playhead).translate) + 1 + 'px';
  checkEdge(playhead);
  requestAnimationFrame(loop);
};

requestAnimationFrame(loop);

const checkEdge = (playhead: HTMLDivElement) => {
  const pEdge = playhead.getBoundingClientRect().right
  const screenEdge = document.documentElement.getBoundingClientRect().right;

  if (pEdge >= screenEdge - 10) {
    console.log('HELLO');
    const schedule = playhead.closest('.sequence__schedule') as HTMLDivElement;
    schedule.scrollTo({left: schedule.scrollLeft + pEdge - 100, behavior: 'instant'});
  }
};

// checkEdge(playhead);
