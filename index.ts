import { webchalk } from './src/index';
import { WebchalkSequenceElement } from './WebchalkSequenceElement';
import { WebchalkTimelinePaneElement } from './WebchalkTimelinePane';

WebchalkTimelinePaneElement.addToCustomElementRegistry();
WebchalkSequenceElement.addToCustomElementRegistry();

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
// Motion(redSquare, '~translate', [{translate: '20rem 20rem'}])

const seq1 = webchalk.newSequence([
  Exit(redSquare, '~fade-out', []),
]);
seq1.addClips([
  Entrance(redSquare, '~pinwheel', [1], {delay: 500, duration: 1000, endDelay: 200}),
  Motion(redSquare, '~translate', [{translate: '200px 200px'}], {startsWithPrevious: true}),
  TextEditor(redSquare, '~insert-text', ['HELLO WORLD! To what do I owe you all the pleasure?'], {durationOrRate: '300wpm', startsWithPrevious: true}),
  Exit(redSquare, '~fade-out', []),
]);
const timeline = webchalk.newTimeline({timelineName: 'main'});
timeline.addSequences([seq1]);

const webchalkTimelinePane = document.querySelector('webchalk-timeline-pane') as WebchalkTimelinePaneElement;
const webchalkSequence = webchalkTimelinePane.shadowRoot!.querySelector('webchalk-sequence') as WebchalkSequenceElement;
seq1.webchalkSequence = webchalkSequence;
webchalkSequence.buildTracksFromSequence(seq1);


timeline.step('forward');

// const shadowRoot = (document.querySelector('webchalk-timeline-pane') as WebchalkTimelinePaneElement).shadowRoot;

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

let detachClipInfoBoxResizer: () => void;

// const infoBox = document.querySelector('.clip-info-box') as HTMLDivElement;
// infoBox.remove();

// const infoButton = document.querySelector('.clip__info-button') as HTMLButtonElement;
// infoButton.addEventListener('click', () => {
//   const queriedInfoBox = document.querySelector('.clip-info-box');
//   if (queriedInfoBox) {
//     detachClipInfoBoxResizer?.();
//     queriedInfoBox.remove();
//   }
//   else {
//     document.querySelector('.sequence__schedule-inner-wrapper')!.insertAdjacentElement('afterend', infoBox);
//     attachClipInfoBoxResizer(infoBox);
//   }
// });


const playhead = document.querySelector('.sequence__playhead') as HTMLDivElement;
const tracks = document.querySelector('.sequence__tracks') as HTMLDivElement;

const loop = () => {
  if (playhead.getBoundingClientRect().right >= tracks.getBoundingClientRect().right - 1) { return; }
  playhead.style.translate = Number.parseFloat(getComputedStyle(playhead).translate) + 1 + 'px';
  checkEdge(playhead);
  requestAnimationFrame(loop);
};

// requestAnimationFrame(loop);

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
