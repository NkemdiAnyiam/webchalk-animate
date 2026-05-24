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
