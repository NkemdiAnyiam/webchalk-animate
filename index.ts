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
const correctClip = Motion(redSquare, '~translate', [{translate: '20rem 20rem'}], {duration: 1000});
const studentClip = Motion(redSquare, '~translate', [{translate: '10rem 20rem'}], {duration: 1000});
const result = correctClip.compare(studentClip, ['category', 'effectName']);
console.log('comparison result:', result);

const timeline = webchalk.newTimeline({timelineName: 'Main'});
timeline.attachPaneUI();
timeline.attachPlaybackButtonsUI();
timeline.setKeyboardShortcuts({
  stepBackward: 'ArrowLeft',
  pause: 'Space',
  stepForward: 'ArrowRight',
  fastForward: 'F',
  toggleSkipping: 'S',
});

const seq1 = webchalk.newSequence(
  {
    description: 'Move the thingamabob to the other element, demonstrating how doing things in an orderly manner accomplishes some cool example.',
    jumpTag: 'JIMMINY!'
  },
  [
  ]);
  seq1.addClips([
    Motion(redSquare, '~translate', [{translate: '200px 0'}], {startsWithPrevious: true, description: 'Move red square'}),
    Motion(blueCircle, '~translate', [{translate: '200px 0'}], {startsWithPrevious: true, description: 'Move blue circle', delay: 1000, cssClasses: {toAddOnFinish: ['yo', 'bro']}}),
    TextEditor(redSquare, '~insert-text', ['HELLO WORLD! To what do I owe you all the pleasure?'], {durationOrRate: '300wpm', startsWithPrevious: true, description: 'Insert text to square', delay: 1000}),
    Exit(redSquare, '~fade-out', [], {duration: 1000, description: 'Exit red square'}),
    Motion(blueCircle, '~translate', [{translate: '200px 0'}], {startsWithPrevious: true, description: 'Move blue circle', delay: 1000}),
    Motion(blueCircle, '~translate', [{translate: '200px 0'}], {startsWithPrevious: true, description: 'Move blue circle', delay: 1000}),
    Motion(blueCircle, '~translate', [{translate: '200px 0'}], {startsWithPrevious: false, description: 'Move blue circle', delay: 1000}),
    Entrance(redSquare, '~pinwheel', [1, 'clockwise'], {duration: 500, description: 'Enter red square'},),
    // Motion(blueCircle, '~translate', [{translate: '200px 0'}], {startsWithPrevious: true, description: 'Move blue circle', delay: 5000}),
    Exit(redSquare, '~fade-out', [], {description: 'Exit red square'}),
]);
seq1.setHeadings({h2: 'Iteration 1', h3: 'Create array'});
timeline.addSequences([seq1]);
// // seq1.animClips[0].scheduleResolver('forward', 'activePhase', 'beginning').then(() => {
// //   console.log('HIIIIIII')
// // })
// // seq1.animClips[1].scheduleResolver('forward', 'delayPhase', '25%').then(() => {
// //   console.log('HOOOOOOOO')
// // })
// // seq1.animClips[1].scheduleResolver('backward', 'delayPhase', '25%', {label: 'Log "HEEEEEEEE"'}).then(() => {
// //   console.log('HEEEEEEEEEE')
// // })
// // seq1.animClips[1].scheduleResolver('backward', 'delayPhase', '25%', {label: 'Show off'}).then(() => {
// //   console.log('HEEEEEEEEEE')
// // })
// // seq1.animClips[1].scheduleResolver('backward', 'delayPhase', '25%', {label: 'Log "HEEEEEEEE"'}).then(() => {
// //   console.log('HEEEEEEEEEE')
// // })
// seq1.animClips[1].scheduleResolver('backward', 'activePhase', '25%', {label: 'Show off'}).then(() => {
//   console.log('HEEEEEEEEEE');
// });
// // seq1.animClips[1].unscheduleResolver(prom.id);
// const id = seq1.animClips[1].scheduleTask('activePhase', '0%', {onPlay: () => {console.log('YO')}, onRewind: () => {console.log('YOOOOOO')}}, {frequencyLimit: 2, description: 'Log "YO"'});
// // seq1.animClips[1].unscheduleTask(id);
// // seq1.animClips[1].scheduleTask('activePhase', '35%',  {onRewind: () => {console.log('YO')}}, {frequencyLimit: 2, description: 'fhj'});

const seq2 = webchalk.newSequence({autoplays: false, autoplaysNextSequence: true});
seq2.addClips([
  Motion(blueCircle, '~translate', [{translate: '200px 200px'}], {duration: 1000, description: 'Move blue circle diagonally'}),
  Motion(blueCircle, '~translate', [{translate: '200px 0'}], {duration: 1000, description: 'Move blue circle'}),
  // TextEditor(blueCircle, '~insert-text', ['HELLO WORLD! To what do I owe you all the pleasure?'], {durationOrRate: '300wpm', startsWithPrevious: true}),
  Exit(blueCircle, '~fade-out', [], {description: 'Exit blue circle'}),
]);
timeline.addSequences([seq2]);

const seq3 = webchalk.newSequence({jumpTag: 'Iteration 8', headings: {h3: "Compare x and y",}});
seq3.addClips([
  Entrance(blueCircle, '~fade-in', [], {description: 'Enter blue circle'}),
  Exit(blueCircle, '~fade-out', [], {description: 'Exit blue circle'}),
  Entrance(blueCircle, '~fade-in', [], {description: 'Enter blue circle'}),
]);
timeline.addSequences([seq3]);

const seq4 = webchalk.newSequence();
seq4.addClips([
  Motion(blueCircle, '~translate', [{translate: '-200px -200px'}], {duration: 1000, description: 'Move blue circle up and left'}),
  Motion(blueCircle, '~translate', [{translate: '-200px 0'}], {duration: 1000, description: 'Move blue circle left'}),
  Motion(blueCircle, '~translate', [{translate: '-200px 0'}], {duration: 1000, description: 'Move blue circle left'}),
]);
timeline.addSequences([seq4]);

// for (let i = 0; i < 150; ++i) {
//   // timeline.addSequences([
//   //   webchalk.newSequence([
//   //     Motion(blueCircle, '~translate', [{translate: '200px 200px'}]),
//   //     Motion(blueCircle, '~translate', [{translate: '-200px -200px'}]),
//   //     Motion(blueCircle, '~translate', [{translate: '-200px -200px'}]),
//   //     Motion(blueCircle, '~translate', [{translate: '-200px -200px'}]),
//   //   ])
//   // ])
//   seq4.addClips([
//     Motion(blueCircle, '~translate', [{translate: '-200px -200px'}], {duration: 1000, description: 'Move blue circle up and left'}),
//     Motion(blueCircle, '~translate', [{translate: '-200px -200px'}], {duration: 1000, description: 'Move blue circle up and left'}),
//     // Motion(blueCircle, '~translate', [{translate: '-200px -200px'}], {duration: 1000, description: 'Move blue circle up and left'}),
//     // Motion(blueCircle, '~translate', [{translate: '-200px -200px'}], {duration: 1000, description: 'Move blue circle up and left'}),
//   ]);
// }

// seq2.removeClipsAt(0, 2);

// timeline.removeSequencesAt(1, 3)
