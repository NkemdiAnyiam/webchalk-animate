import { EasingString, PresetLinearEasingKey } from "../2_animationEffects/easing";
import { webimator } from "../Webimator";

{
/**** example--Webimator.newSequence-1.1 */
// retrieve clip factory functions
const clipFactories = webimator.createAnimationClipFactories();
// select a (presumable) square-shaped element from the DOM
const squareEl = document.querySelector(".square");

// create sequence with some configuration options and some animation clips
const seq = webimator.newSequence(
  { description: "Fade in square, move it, and fade out", playbackRate: 2 },
  clipFactories.Entrance(squareEl, "~fade-in", []),
  clipFactories.Motion(squareEl, "~translate", [{ translate: "200px, 500px" }]),
  clipFactories.Exit(squareEl, "~fade-out", [])
);
// play sequence
seq.play();
/**** end example */
}

{
/**** example--Webimator.newSequence-1.2 */
// SAME EXAMPLE BUT WITH DESTRUCTURING ASSIGNMENT FOR THE CLIP FACTORY FUNCTIONS

const {Entrance, Exit, Motion} = webimator.createAnimationClipFactories();
const squareEl = document.querySelector('.square');

const seq = webimator.newSequence(
  {description: 'Fade in square, move it, and fade out', playbackRate: 2},
  Entrance(squareEl, '~fade-in', []),
  Motion(squareEl, '~translate', [{translate: '200px, 500px'}]),
  Exit(squareEl, '~fade-out', []),
);
seq.play();
/**** end example */
}

{
/**** example--Webimator.newSequence-2.1 */
// retrieve clip factory functions
const clipFactories = webimator.createAnimationClipFactories();
// select a (presumable) square-shaped element from the DOM
const squareEl = document.querySelector('.square');

// create sequence with some animation clips
const seq = webimator.newSequence(
   clipFactories.Entrance(squareEl, '~fade-in', []),
   clipFactories.Motion(squareEl, '~translate', [{translate: '200px, 500px'}]),
   clipFactories.Exit(squareEl, '~fade-out', []),
);
// play sequence
seq.play();
/**** end example */
}

{
/**** example--Webimator.newSequence-2.2 */
// SAME EXAMPLE BUT WITH DESTRUCTURING ASSIGNMENT FOR THE CLIP FACTORY FUNCTIONS

const {Entrance, Exit, Motion} = webimator.createAnimationClipFactories();
const squareEl = document.querySelector('.square');

const seq = webimator.newSequence(
   Entrance(squareEl, '~fade-in', []),
   Motion(squareEl, '~translate', [{translate: '200px, 500px'}]),
   Exit(squareEl, '~fade-out', []),
);
seq.play();
/**** end example */
}

{
/**** example--Webimator.newTimeline-1 */
// retrieve some clip factory functions
const {Entrance, Exit, Motion} = webimator.createAnimationClipFactories();
// select presumably a square element and a circle element from the DOM
const squareEl = document.querySelector('.square');
const circleEl = document.querySelector('.circle');

// create first sequence
const seq1 = webimator.newSequence(
   {description: 'Fade in square, move it, and fade out', playbackRate: 2},
   Entrance(squareEl, '~fade-in', []),
   Motion(squareEl, '~translate', [{translate: '200px, 500px'}]),
   Exit(squareEl, '~fade-out', []),
);

// create second sequence
const seq2 = webimator.newSequence(
   {description: 'Fade in circle and move it'},
   Entrance(circleEl, '~fly-in', ['from-left']),
   Motion(circleEl, '~translate', [{translateX: '250px'}]),
);

// create timeline with some configuration and both sequences
const timeline = webimator.newTimeline(
   {timelineName: 'Moving Shapes', autoLinksButtons: true},
   seq1,
   seq2,
);

// step forward twice, playing both sequences
timeline.step('forward')
  .then(() => timeline.step('forward'));
/**** end example */
}

{
/**** example--Webimator.newTimeline-2 */
// retrieve some clip factory functions
const {Entrance, Exit, Motion} = webimator.createAnimationClipFactories();
// select presumably a square element and a circle element from the DOM
const squareEl = document.querySelector('.square');
const circleEl = document.querySelector('.circle');

// create first sequence
const seq1 = webimator.newSequence(
  {description: 'Fade in square, move it, and fade out', playbackRate: 2},
  Entrance(squareEl, '~fade-in', []),
  Motion(squareEl, '~translate', [{translate: '200px, 500px'}]),
  Exit(squareEl, '~fade-out', []),
);

// create second sequence
const seq2 = webimator.newSequence(
  {description: 'Fade in circle and move it'},
  Entrance(circleEl, '~fly-in', ['from-left']),
  Motion(circleEl, '~translate', [{translateX: '250px'}]),
);

// create timeline with both sequences
const timeline = webimator.newTimeline(
   seq1,
   seq2,
);
/**** end example */
}

{
/**** example--Webimator.createAnimationClipFactories-1.1 */
const square = document.querySelector('.square');
// Using the method and using one of the `Entrance()` factory function
const clipFactories = webimator.createAnimationClipFactories();
const ent = clipFactories.Entrance(square, '~fly-in', ['from-top'], {duration: 2000});
ent.play();
/**** end example */
}

{
/**** example--Webimator.createAnimationClipFactories-1.2 */
const square = document.querySelector('.square');
// Using destructuring assignment to conveniently extract the `Entrance()` and `Motion()` factory functions
const {Entrance, Motion} = webimator.createAnimationClipFactories();
const ent = Entrance(square, '~fly-in', ['from-top'], {duration: 2000});
const mot1 = Motion(square, '~translate', [{translateX: '500px'}], {duration: 1000});
const mot2 = Motion(square, '~translate', [{translateY: '500px'}], {duration: 500});
// clips are added to a sequence
const seq = webimator.newSequence(ent, mot1, mot2);
seq.play();
/**** end example */
}

{
/**** example--Webimator.createAnimationClipFactories-1.3 */
// Extending the preset entrances and motions banks with custom effects
const clipFactories = webimator.createAnimationClipFactories({
  // CUSTOM ENTRANCES
  customEntranceEffects: {
    coolZoomIn: {
      generateKeyframes(initialScale: number) {
        return {
          forwardFrames: [
            {scale: initialScale, opacity: 0},
            {scale: 1, opacity: 1}
          ],
          // (backwardFrames could have been omitted in this case because
          // the reversal of forwardFrames is exactly equivalent)
          backwardFrames: [
            {scale: 1, opacity: 1},
            {scale: initialScale, opacity: 0}
          ]
        };
      }
    },

    blinkIn: {
      generateKeyframes() {
        return {
          forwardFrames: [
            {opacity: 0}, {opacity: 1}, {opacity: 0}, {opacity: 1}, {opacity: 0}, {opacity: 1}
          ],
          // (backwardFrames omitted because the reversal of forwardFrames is exactly equivalent)
        };
      }
    }
  },

  // CUSTOM EXITS
  customExitEffects: {
    // a custom animation effect for flying out to the left side of the screen
    flyOutLeft: {
      generateKeyframeGenerators() {
        const computeTranslationStr = () => {
          const orthogonalDistance = -(this.domElem.getBoundingClientRect().right);
          const translationString = `${orthogonalDistance}px 0px`;
          return translationString;
        }
  
        return {
          forwardGenerator: () => {
            return [
              {translate: computeTranslationStr()}
            ];
          },
          // backwardGenerator could have been omitted because the result of running forwardGenerator()
          // again and reversing the keyframes produces the same desired rewinding effect in this case
          backwardGenerator: () => {
            return [
              {translate: computeTranslationStr()},
              {translate: `0 0`}
            ];
          }
        };
      },
      
      immutableConfig: {
        // this means that the translation is added onto the element's position instead of replacing it
        composite: 'accumulate',
      }
    },
  }
});

const square = document.querySelector('.square');
// the custom animations you created are now valid as well as detected by TypeScript
const ent1 = clipFactories.Entrance(square, 'coolZoomIn', [0.2]);
const ent2 = clipFactories.Entrance(square, 'blinkIn', []);
const ext = clipFactories.Exit(square, 'flyOutLeft', []);
/**** end example */
}













{
/**** example--AnimClip.generateTimePromise-1 */
async function testFunc() {
  const { Entrance } = webimator.createAnimationClipFactories();
  const square = document.querySelector('.square');
  const ent = Entrance(square, '~fade-in', []);
  // wait until ent is played and gets 1/5 of the way through the active phase of the animation
  await ent.generateTimePromise('forward', 'activePhase', '20%');
  console.log('1/5 done playing!');
}

testFunc();
/**** end example */
}

{
/**** example--AnimClip.generateTimePromise-2 */

async function testFunc() {
  const { Entrance } = webimator.createAnimationClipFactories();
  const square = document.querySelector('.square');
  const ent = Entrance(square, '~fade-in', []);
   // wait until ent is eventually rewound and gets 4/5 of the way through rewinding the active phase of the animation
   await ent.generateTimePromise('backward', 'activePhase', '20%');
   console.log('4/5 done rewinding!');
}

testFunc();
/**** end example */
}

{
/**** example--AnimClip.addRoadblocks-1 */
async function wait(milliseconds: number) { // Promise-based timer
   return new Promise(resolve => setTimeout(resolve, milliseconds));
}

const square = document.querySelector('.square');
const { Entrance } = webimator.createAnimationClipFactories();
const ent = Entrance(square, '~fade-in', []);

// adds 1 roadblock that will pause the clip once the clip is 15% through the delay phase
ent.addRoadblocks('forward', 'activePhase', '15%', [function(){ return wait(2000); }]);
// adds 2 more roadblocks at the same point.
const someOtherPromise = Promise.resolve(); // instantly resolved promise
ent.addRoadblocks('forward', 'activePhase', '15%', [function(){ return wait(3000); }, someOtherPromise]);
// adds 1 roadblock at 40% into the endDelay phase
ent.addRoadblocks('forward', 'endDelayPhase', '40%', [new Promise(resolve => {})]);

ent.play();
// ↑ Once ent is 15% through the active phase, it will pause and handle its roadblocks.
// "wait(2000)" resolves after 2 seconds.
// "wait(3000)" resolves after 3 seconds.
// someOtherPromise blocks the clip's playback. Presumably, its resolver is eventually called from somewhere outside.
// Once someOtherPromise is resolved, there are no more roadblocks at this point, so playback is resumed.
// Once ent is 40% through the endDelay phase, it will pause and handle its roadblocks
// The newly created promise obviously has no way to be resolved, so the clip is unfortunately stuck.
/**** end example */
}

{
/**** example--AnimClip.computeTween-1 */
const {Entrance} = webimator.createAnimationClipFactories({
  customEntranceEffects: {
    rotate: {
      generateRafMutators(degrees: number) {
        return {
          // when playing, keep computing the value between 0 and 'degrees'
          forwardMutator: () => { this.domElem.style.rotate = this.computeTween(0, degrees)+'deg'; },
          // when rewinding, keep computing the value between 'degrees' and 0
          backwardMutator: () => { this.domElem.style.rotate = this.computeTween(degrees, 0)+'deg'; }
        };
      }
    }
  },
});

const someElement = document.querySelector('.some-element');

(async () => {
  await Entrance(someElement, 'rotate', [360], {duration: 2000}).play();
  // ↑ At 1.5 seconds (or 1500ms), the animation is 1.5/2 = 75% done playing.
  // Thus, computeTween(0, 360) at that exactly moment would...
  // return the value 75% of the way between 0 and 360 (= 270).
  // Therefore, at 1.5 seconds of playing, someElement's rotation is set to "270deg".
  
  await Entrance(someElement, 'rotate', [360], {duration: 2000}).rewind();
  // ↑ At 0.5 seconds (or 500ms), the animation is 0.5/2 = 25% done rewinding.
  // Thus, computeTween(360, 0) at that exactly moment would...
  // return the value 25% of the way between 360 and 0 (= 270).
  // Therefore, at 0.5 seconds of rewinding, someElement's rotation is set to "270deg".
})();
/**** end example */
}







{
/**** example--PresetLinearEasingKey-1 */
const str1: PresetLinearEasingKey = 'power2-in';
const str2: PresetLinearEasingKey = 'expo-in-out';
/** @ts-ignore */
const str3: PresetLinearEasingKey = 'expo'; // INVALID
/**** end example */
}

{
/**** example--EasingString-1 */
const str1: EasingString = 'power2-in'; // valid (matches PresetLinearEasingKey)
const str2: EasingString = 'expo-in-out'; // valid (matches PresetLinearEasingKey)
/** @ts-ignore */
const str5: EasingString = 'cubic-bezier(0.25, 0.1, 0.25, 1)'; // valid (matches string and is also a valid <easing-function>)
const str4: EasingString = 'ease-in'; // valid (matches TrivialCssEasingFunction)

const str3: EasingString = 'expo'; // valid (matches string) but will lead to a runtime error
/** @ts-ignore */
const str5: EasingString = 'cubic-bezier(0.25, 0.1, 0.25)'; // valid (matches string) but will lead to a runtime error
/**** end example */
}








{
/**** example--KeyframesGenerator.generateKeyframes-1 */
const clipFactories = webimator.createAnimationClipFactories({
  customEntranceEffects: {
    // a custom 'zoomIn' entrance animation effect that you might make
    zoomIn: {
      generateKeyframes(initialScale: number) {
        return {
          forwardFrames: [
            {scale: initialScale, opacity: 0},
            {scale: 1, opacity: 1}
          ],
          // (backwardFrames could have been omitted in this case because
          // the reversal of forwardFrames is exactly equivalent)
          backwardFrames: [
            {scale: 1, opacity: 1},
            {scale: initialScale, opacity: 0}
          ]
        };
      }
    }
  },
});

const element = document.querySelector('.some-element');
const ent = clipFactories.Entrance(element, 'zoomIn', [0.2]);
ent.play().then(ent.rewind);
/**** end example */
}

{
/**** example--KeyframesGeneratorsGenerator.generateKeyframeGenerators-1 */
const clipFactories = webimator.createAnimationClipFactories({
  customExitEffects: {
    // a custom animation effect for flying out to the left side of the screen
    flyOutLeft: {
      generateKeyframeGenerators() {
        const computeTranslationStr = () => {
          const orthogonalDistance = -(this.domElem.getBoundingClientRect().right);
          const translationString = `${orthogonalDistance}px 0px`;
          return translationString;
        }
  
        return {
          forwardGenerator: () => {
            return [
              {translate: computeTranslationStr()}
            ];
          },
          // backwardGenerator could have been omitted because the result of running forwardGenerator()
          // again and reversing the keyframes produces the same desired rewinding effect in this case
          backwardGenerator: () => {
            return [
              {translate: computeTranslationStr()},
              {translate: `0 0`}
            ];
          }
        };
      },
      
      immutableConfig: {
        // this means that the translation is added onto the element's position instead of replacing it
        composite: 'accumulate',
      }
    },
  }
});

const element = document.querySelector('.some-element');
const ext = clipFactories.Exit(element, 'flyOutLeft', []);
ext.play().then(ext.rewind);
/**** end example */
}

{
/**** example--RafMutatorsGenerator.generateRafMutators-1 */
const clipFactories = webimator.createAnimationClipFactories({
  customMotionEffects: {
    // a custom animation for scrolling to a specific position (but when
    // rewinding, it will snap to yPosition before scrolling to the initial position, which
    // may feel janky. This could be solved with generateRafMutatorGenerators())
    scrollTo: {
      generateRafMutators(yPosition: number) {
        const initialPosition = this.domElem.scrollTop;
  
        return {
          forwardMutator: () => {
            this.domElem.scrollTo({
              top: this.computeTween(initialPosition, yPosition),
              behavior: 'instant'
            });
          },
          backwardMutator: () => {
            this.domElem.scrollTo({
              top: this.computeTween(yPosition, initialPosition),
              behavior: 'instant'
            });
          }
        };
      }
    },
  }
});

const element = document.querySelector('.some-element');
const mot = clipFactories.Motion(element, 'scrollTo', [1020]);
mot.play().then(mot.rewind);
/**** end example */
}

{
/**** example--RafMutatorsGeneratorsGenerator.generateRafMutatorGenerators-1 */
const clipFactories = webimator.createAnimationClipFactories({
  customMotionEffects: {
    // a custom animation for scrolling to a specific point on the page.
    // when rewinding, the current scroll position is computed on the spot so that
    // it can smoothly scroll from THERE to the initial position.
    scrollToImproved: {
      generateRafMutatorGenerators(yPosition: number) {
        const initialPosition = this.domElem.scrollTop;
  
        return {
          forwardGenerator: () => {
            const forwardMutator = () => {
              this.domElem.scrollTo({
                top: this.computeTween(initialPosition, yPosition),
                behavior: 'instant'
              });
            };
            return forwardMutator;
          },

          backwardGenerator: () => {
            const backwardMutator = () => {
              const currentPosition = this.domElem.scrollTop;
              this.domElem.scrollTo({
                top: this.computeTween(currentPosition, initialPosition),
                behavior: 'instant'
              });
            };
            return backwardMutator;
          }
        };
      }
    },
  }
});

const element = document.querySelector('.some-element');
const mot = clipFactories.Motion(element, 'scrollToImproved', [1020]);
mot.play().then(mot.rewind);
/**** end example */
}
