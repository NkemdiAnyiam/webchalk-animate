/**** MD-S id="import webimator" */
import { webimator } from 'webimator';
/**** MD-E id="import webimator" */
/**** MD-S id="import paths" */
import * as WebimatorTypes from 'webimator/types-and-interfaces';
import * as WebimatorErrors from "webimator/error-handling";
import * as WebimatorEasing from "webimator/easing";
/**** MD-E id="import paths" */

const { AnimSequence } = WebimatorTypes;

/**** MD-S id="usage__webimator.createAnimationClipFactories()" */
const clipFactories = webimator.createAnimationClipFactories();
/**** MD-E id="usage__webimator.createAnimationClipFactories()" */

if (false) {
  webimator./**** MD-S id="clip-factories-method" */createAnimationClipFactories()/**** MD-E id="clip-factories-method" */;
  /**** MD-S id="webimator-clip-factories-method" */webimator.createAnimationClipFactories();/**** MD-E id="webimator-clip-factories-method" */

  /**** MD-S id="usage__create-sequence" */
  webimator.newSequence()
  /**** MD-E id="usage__create-sequence" */
  /**** MD-S id="usage__add-clips" */
  AnimSequence.prototype.addClips()
  /**** MD-E id="usage__add-clips" */
}

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

{
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
  Entrance(document.querySelector('.pentagon'), '~appear', [])
);

// add more clips to the sequence
seq.addClips(
  Motion(circEl, '~move-to', [sqrEl]),
  Exit(sqrEl, '~fade-out', [])
);

seq.play().then(() => seq.rewind());
/**** MD-E id="usage__create-sequence-clips" --> */
}