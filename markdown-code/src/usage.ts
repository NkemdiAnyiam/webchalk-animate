/**** MD-S id="import webimator" */
import { webimator } from 'webimator';
/**** MD-E id="import webimator" */
/**** MD-S id="import paths" */
import * as WebimatorTypes from 'webimator/types-and-interfaces';
import * as WebimatorErrors from "webimator/error-handling";
import * as WebimatorEasing from "webimator/easing";
/**** MD-E id="import paths" */

/**** MD-S id="usage__webimator.createAnimationClipFactories()" */
const clipFactories = webimator.createAnimationClipFactories();
/**** MD-E id="usage__webimator.createAnimationClipFactories()" */

/**** MD-S id="usage__create-basic-clips" */
const sqrEl = document.querySelector('.square');
const ent = clipFactories.Entrance(sqrEl, '~pinwheel', [2, 'clockwise']);
const mot = clipFactories.Exit(sqrEl, '~fade-out', [], {duration: 1500});
/**** MD-E id="usage__create-basic-clips" */

/**** MD-S id="usage__badly-play-basic-clips" */
ent.play();
mot.play();
mot.rewind();
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
  mot.play().then(() => {
    mot.rewind().then(() => {
      ent.rewind();
    })
  });
});

// exact same thing but using async/await syntax
(async function() {
  await ent.play();
  await mot.play();
  await mot.rewind();
  ent.rewind();
})();
/**** MD-E id="usage__play-basic-clips" */
