import { webchalk } from './src/index';

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
  ]);
  seq1.addClips([
    Motion(redSquare, '~translate', [{translate: '200px 0'}], {startsWithPrevious: true, description: 'Move red square'}),
    Motion(blueCircle, '~translate', [{translate: '200px 0'}],
      {startsWithPrevious: true, description: 'Move blue circle', delay: 1000, cssClasses: {toAddOnFinish: ['yo', 'bro']}}
    ),
    TextEditor(redSquare, '~insert-text', ['HELLO WORLD! To what do I owe you all the pleasure?'],
      {durationOrRate: '300wpm', startsWithPrevious: true, description: 'Insert text', delay: 1000}
    ),
    Exit(redSquare, '~fade-out', [], {duration: 1000}),
    Motion(blueCircle, '~translate', [{translate: '200px 0'}], {startsWithPrevious: true, description: 'Move blue circle', delay: 1000}),
    Motion(blueCircle, '~translate', [{translate: '200px 0'}], {startsWithPrevious: true, description: 'Move blue circle', delay: 1000}),
    // Motion(blueCircle, '~translate', [{translate: '200px 0'}], {startsWithPrevious: false, description: 'Move blue circle', delay: 1000}),
    // Motion(blueCircle, '~translate', [{translate: '200px 0'}], {startsWithPrevious: false, description: 'Move blue circle', delay: 1000}),
    // Motion(blueCircle, '~translate', [{translate: '200px 0'}], {startsWithPrevious: false, description: 'Move blue circle', delay: 1000}),
    // Motion(blueCircle, '~translate', [{translate: '200px 0'}], {startsWithPrevious: false, description: 'Move blue circle', delay: 1000}),
    // Motion(blueCircle, '~translate', [{translate: '200px 0'}], {startsWithPrevious: false, description: 'Move blue circle', delay: 1000}),
    Motion(blueCircle, '~translate', [{translate: '200px 0'}], {startsWithPrevious: false, description: 'Move blue circle', delay: 1000}),
    Entrance(redSquare, '~pinwheel', [1, 'clockwise'], {duration: 500, description: 'Enter red square'},),
    // Motion(blueCircle, '~translate', [{translate: '200px 0'}], {startsWithPrevious: true, description: 'Move blue circle', delay: 5000}),
    Exit(redSquare, '~fade-out', []),
]);
timeline.addSequences([seq1]);

const seq2 = webchalk.newSequence({autoplays: true, autoplaysNextSequence: true});
seq2.addClips([
  Motion(blueCircle, '~translate', [{translate: '200px 200px'}], {duration: 1000}),
  Motion(blueCircle, '~translate', [{translate: '200px 0'}], {duration: 1000}),
  // TextEditor(blueCircle, '~insert-text', ['HELLO WORLD! To what do I owe you all the pleasure?'], {durationOrRate: '300wpm', startsWithPrevious: true}),
  Exit(blueCircle, '~fade-out', []),
]);
timeline.addSequences([seq2]);

const seq3 = webchalk.newSequence();
seq3.addClips([
  Entrance(blueCircle, '~fade-in', []),
  Exit(blueCircle, '~fade-out', []),
  Entrance(blueCircle, '~fade-in', []),
]);
timeline.addSequences([seq3]);

const seq4 = webchalk.newSequence();
seq4.addClips([
  Motion(blueCircle, '~translate', [{translate: '-200px -200px'}], {duration: 1000}),
  Motion(blueCircle, '~translate', [{translate: '-200px 0'}], {duration: 1000}),
  Motion(blueCircle, '~translate', [{translate: '-200px 0'}], {duration: 1000}),
]);
timeline.addSequences([seq4]);

// seq2.removeClipsAt(0, 2);

// timeline.removeSequencesAt(1, 3)

timeline.attachUI();
