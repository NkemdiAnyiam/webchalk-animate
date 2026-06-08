import { webchalk } from './src/index';
import { WebchalkClipElement } from './WebchalkClipElement';
import { WebchalkSequenceElement } from './WebchalkSequenceElement';
import { WebchalkTimelinePaneElement } from './WebchalkTimelinePane';

WebchalkTimelinePaneElement.addToCustomElementRegistry();
WebchalkSequenceElement.addToCustomElementRegistry();
WebchalkClipElement.addToCustomElementRegistry();

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
const blueCircle = document.querySelector('.circle');
// Motion(redSquare, '~translate', [{translate: '20rem 20rem'}])

const timeline = webchalk.newTimeline({timelineName: 'Main'});

const seq1 = webchalk.newSequence(
  {description: 'Move the thingamabob to the other element, demonstrating how doing things in an orderly manner accomplishes some cool example.'},
  [
  // Exit(redSquare, '~fade-out', [], {duration: 1000}),
]);
seq1.addClips([
  Entrance(redSquare, '~pinwheel', [1], {duration: 500, description: 'Enter red square', hideNowType: 'display-none'},),
  Motion(redSquare, '~translate', [{translate: '200px 0'}], {startsWithPrevious: true, description: 'Move red square'}),
  Motion(blueCircle, '~translate', [{translate: '200px 0'}], {startsWithPrevious: true, description: 'Move blue circle', delay: 1000}),
  TextEditor(redSquare, '~insert-text', ['HELLO WORLD! To what do I owe you all the pleasure?'],
    {durationOrRate: '300wpm', startsWithPrevious: true, description: 'Insert text', delay: 1000}
  ),
  Motion(blueCircle, '~translate', [{translate: '200px 0'}], {startsWithPrevious: true, description: 'Move blue circle', delay: 1000}),
  Motion(blueCircle, '~translate', [{translate: '200px 0'}], {startsWithPrevious: true, description: 'Move blue circle', delay: 1000}),
  Motion(blueCircle, '~translate', [{translate: '200px 0'}], {startsWithPrevious: false, description: 'Move blue circle', delay: 1000}),
  // Motion(blueCircle, '~translate', [{translate: '200px 0'}], {startsWithPrevious: true, description: 'Move blue circle', delay: 5000}),
  // // Exit(redSquare, '~fade-out', []),
]);
timeline.addSequences([seq1]);

// const seq2 = webchalk.newSequence();
// seq2.addClips([
//   Motion(blueCircle, '~translate', [{translate: '200px 200px'}], {duration: 1000}),
//   Motion(blueCircle, '~translate', [{translate: '200px 0'}], {duration: 1000}),
//   TextEditor(blueCircle, '~insert-text', ['HELLO WORLD! To what do I owe you all the pleasure?'], {durationOrRate: '300wpm', startsWithPrevious: true}),
//   Exit(blueCircle, '~fade-out', []),
// ]);
// timeline.addSequences([seq2]);

timeline.attachUI();

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
