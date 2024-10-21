/**** MD-S id="import webimator" */
import { webimator } from 'webimator';
/**** MD-E id="import webimator" */
/**** MD-S id="import paths" */
import * as WebimatorTypes from 'webimator/types-and-interfaces';
import * as WebimatorErrors from "webimator/error-handling";
import * as WebimatorEasing from "webimator/easing";
/**** MD-E id="import paths" */

const { AnimSequence, AnimClip } = WebimatorTypes;

/**** MD-S id="usage__webimator.createAnimationClipFactories()" */
const clipFactories = webimator.createAnimationClipFactories();
/**** MD-E id="usage__webimator.createAnimationClipFactories()" */

if (false) {
  webimator./**** MD-S id="clip-factories-method" MD-G */createAnimationClipFactories()/**** MD-E */;
  /**** MD-S id="webimator-clip-factories-method" MD-G */
  webimator.createAnimationClipFactories();
  /**** MD-E */

  /**** MD-S id="usage__create-sequence" */
  webimator.newSequence()
  /**** MD-E id="usage__create-sequence" */
  /**** MD-S id="usage__add-clips" */
  AnimSequence.prototype.addClips()
  /**** MD-E id="usage__add-clips" */
}

if (false) {
/**** MD-S id="usage__create-basic-clips" */
const sqrEl = document.querySelector('.square');
const ent = clipFactories.Entrance(sqrEl, '~pinwheel', [2, 'clockwise']);
const ext = clipFactories.Exit(sqrEl, '~fade-out', [], {duration: 1500});
/**** MD-E id="usage__create-basic-clips" */

/**** MD-S id="usage__badly-play-basic-clips" */
ent.play();
ext.play();
ext.rewind();
ent.rewind();
// ↑ AnimClip.prototype.play() and rewind() are asynchronous,
// so these will actually attempt to run all at the same time,
// ultimately causing an error
/**** MD-E id="usage__badly-play-basic-clips" */

/**** MD-S id="usage__play-basic-clips" */
// the entrance clip plays, and THEN the motion clip plays, and THEN the
// motion clip plays, and THEN the motion clip rewinds, and THEN the
// entrance clip rewinds
ent.play().then(() => {
  ext.play().then(() => {
    ext.rewind().then(() => {
      ent.rewind();
    })
  });
});

// exact same thing but using async/await syntax
(async function() {
  await ent.play();
  await ext.play();
  await ext.rewind();
  ent.rewind();
})();
/**** MD-E id="usage__play-basic-clips" */
}

if (false) {
/**** MD-S id="usage__create-sequence-clips" --> */
// get clip factory functions
const { Entrance, Exit, Motion } = webimator.createAnimationClipFactories();

// select elements from page
const sqrEl = document.querySelector('.square');
const circEl = document.querySelector('.circle');
const triEl = document.querySelector('.triangle');

// create animation clips
const enterSquare = Entrance(sqrEl, '~pinwheel', [2, 'clockwise']);
const enterCircle = Entrance(circEl, '~fade-in', []);

// create sequence with configuration options and animation clips
const seq = webimator.newSequence(
  // optional configuration object
  {playbackRate: 2, description: 'Enter all the shapes'},
  // 4 animation clips
  enterSquare,
  enterCircle,
  Entrance(triEl, '~fly-in', ['from-bottom-left']),
  Entrance(document.querySelector('.pentagon'), '~appear', []),
);

// add more clips to the sequence
seq.addClips(
  Motion(circEl, '~move-to', [sqrEl]),
  Exit(sqrEl, '~fade-out', []),
);

seq.play().then(() => seq.rewind());
/**** MD-E id="usage__create-sequence-clips" --> */
}


if (false) {
AnimClip.prototype.getTiming().
  /**** MD-S id="usage__starts-with-clip" MD-G */startsWithPrevious/**** MD-E */
AnimClip.prototype.getTiming().
  /**** MD-S id="usage__starts-next-clip" MD-G */startsNextClipToo/**** MD-E */
  

// get clip factory functions
const { Entrance, Exit, Motion } = webimator.createAnimationClipFactories();

// select elements from page
const sqrEl = document.querySelector('.square');
const circEl = document.querySelector('.circle');
const triEl = document.querySelector('.triangle');
const pentaEl = document.querySelector('.pentagon');

/**** MD-S id="usage__sequencing-clips" */
// create sequence
const seq = webimator.newSequence(
  // optional configuration object
  {description: 'No one likes Pentagon!'},
  // 6 animation clips
  /** A */
  Entrance(sqrEl, '~fade-in', []), // A + 0ms
  Entrance(circEl, '~fade-in', [], {startsWithPrevious: true}), // A + 0ms
  Entrance(triEl, '~fade-in', [], {startsWithPrevious: true}), // A + 0ms
  /** B */
  Entrance(pentaEl, '~fly-in', ['from-left']), // B + 0ms
  /** C */
  Exit(circEl, '~fade-out', [], {startsNextClipToo: true}), // C + 0ms
  Exit(sqrEl, '~fade-out', [], {delay: 150, endDelay: 2}), // C + 150ms
  Exit(triEl, '~fade-out', [], {delay: 300, startsWithPrevious: true}), // C + 452ms (NOT C + 300ms!!!)
);

seq.play().then(() => seq.rewind());
/**** MD-E id="usage__sequencing-clips" */
}

if (false) {
/****MD-S id="create-timeline"*/
// get clip factory functions
const { Entrance, Exit, Motion } = webimator.createAnimationClipFactories();

// select elements from page
const sqrEl = document.querySelector('.square');
const circEl = document.querySelector('.circle');

// create sequences
const seq1 = webimator.newSequence(
  {tag: 'ABC'},
  Entrance(sqrEl, '~fade-in', []),
  Entrance(circEl, '~fade-in', []),
);

const seq2 = webimator.newSequence(
  Motion(sqrEl, '~move-to', [circEl]),
  Exit(circEl, '~sink-down', [], {startsWithPrevious: true}),
);

const seq3 = webimator.newSequence(
  {autoplays: true},
  Exit(circEl, '~fade-out', []),
);

// create new timeline
const /****MD-S id="usage__timeline" MD-G*/tLine/****MD-E*/ = webimator.newTimeline(
  // optional config object
  {debugMode: true, timelineName: /****MD-S id="usage__timeline-name" MD-G*/'Basics'/****MD-E*/},
  // 3 sequences
  seq1,
  seq2,
  seq3,
);

// first step() plays seq1
tLine.step('forward')
  // second step() plays seq2, and then seq3 plays afterwards because seq3 has autoplay set
  .then(() => tLine.step('forward'))
  // instantly jumps back to right before seq1 (which has the 'tag' config set to "ABC")
  .then(() => tLine.jumpToSequenceTag('ABC'));
/****MD-E id="create-timeline"*/
}
