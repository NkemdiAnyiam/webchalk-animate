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
  const clipTracksAll = [...document.querySelectorAll('.sequence__clip-tracks')] as HTMLDivElement[];

  for (let i = 0; i < clipTracksAll.length; ++i) {
    const clipTracks = clipTracksAll[i];

    const handleClick = (e: MouseEvent) => {
      const clipTrack = (e.target as HTMLElement);
      // only do process if a track was clicked
      if (!clipTrack.classList.contains('sequence__track-body')) { return; }

      // unhighlight all text to prevent annoying dragging issues
      document.getSelection()?.removeAllRanges();
      // prevent user selection to handle other annoying dragging issues
      clipTracks.classList.add('user-select-none');

      const handleDrag = (e: MouseEvent) => {
        const [x, y] = [e.movementX, e.movementY];
        const schedule = clipTracks.closest('.sequence__schedule') as HTMLDivElement;
        if (y !== 0) {
          clipTracks.scrollTo({top: y < 0 ? Math.floor(clipTracks.scrollTop - y) : Math.ceil(clipTracks.scrollTop - y), behavior: 'instant'});
        }
        if (x !== 0) {
          schedule.scrollTo({left: x < 0 ? Math.floor(schedule.scrollLeft - x) : Math.ceil(schedule.scrollLeft - x), behavior: 'instant'});
        }
      }

      const handleRelease = (e: MouseEvent) => {
        // remove all event listeners related to dragging this schedule
        clipTracks.classList.remove('user-select-none');
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

attachTimelineUIResizer();
attachScheduleDraggers();
