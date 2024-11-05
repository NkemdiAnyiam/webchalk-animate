import { EasingString, PresetLinearEasingKey } from "../2_animationEffects/easing";
import { webimator } from "../Webimator";

{
/**** EX:S id="Webimator.newSequence-1.1" */
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
/**** EX:E id="Webimator.newSequence-1.1" */
}

{
/**** EX:S id="Webimator.newSequence-1.2" */
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
/**** EX:E id="Webimator.newSequence-1.2" */
}

{
/**** EX:S id="Webimator.newSequence-2.1" */
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
/**** EX:E id="Webimator.newSequence-2.1" */
}

{
/**** EX:S id="Webimator.newSequence-2.2" */
// SAME EXAMPLE BUT WITH DESTRUCTURING ASSIGNMENT FOR THE CLIP FACTORY FUNCTIONS

const {Entrance, Exit, Motion} = webimator.createAnimationClipFactories();
const squareEl = document.querySelector('.square');

const seq = webimator.newSequence(
   Entrance(squareEl, '~fade-in', []),
   Motion(squareEl, '~translate', [{translate: '200px, 500px'}]),
   Exit(squareEl, '~fade-out', []),
);
seq.play();
/**** EX:E id="Webimator.newSequence-2.2" */
}

{
/**** EX:S id="Webimator.newTimeline-1" */
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
/**** EX:E id="Webimator.newTimeline-1" */
}

{
/**** EX:S id="Webimator.newTimeline-2" */
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
/**** EX:E id="Webimator.newTimeline-2" */
}

{
/**** EX:S id="Webimator.createAnimationClipFactories-1.1" */
const square = document.querySelector('.square');
// Using the method and using one of the `Entrance()` factory function
const clipFactories = webimator.createAnimationClipFactories();
const ent = clipFactories.Entrance(square, '~fly-in', ['from-top'], {duration: 2000});
ent.play();
/**** EX:E id="Webimator.createAnimationClipFactories-1.1" */
}

{
/**** EX:S id="Webimator.createAnimationClipFactories-1.2" */
const square = document.querySelector('.square');
// Using destructuring assignment to conveniently extract the `Entrance()` and `Motion()` factory functions
const {Entrance, Motion} = webimator.createAnimationClipFactories();
const ent = Entrance(square, '~fly-in', ['from-top'], {duration: 2000});
const mot1 = Motion(square, '~translate', [{translateX: '500px'}], {duration: 1000});
const mot2 = Motion(square, '~translate', [{translateY: '500px'}], {duration: 500});
// clips are added to a sequence
const seq = webimator.newSequence(ent, mot1, mot2);
seq.play();
/**** EX:E id="Webimator.createAnimationClipFactories-1.2" */
}

{
/**** EX:S id="Webimator.createAnimationClipFactories-1.3" */
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
/**** EX:E id="Webimator.createAnimationClipFactories-1.3" */
}













{
/**** EX:S id="AnimClip.desc" */
/*
A "clip" is the smallest building block of a timeline. It is essentially a [DOM element, effect] pair,
where a "DOM element" is some HTML element on the page and the effect is the animation effect that
will be applied to it (asynchronously).

The {@link AnimClip} class is abstract, meaning it cannot be instantiated. But it has several subclasses such as 
{@link EntranceClip}, {@link MotionClip}, {@link TransitionClip}, etc. Webimator provides convenient factory functions
that can be used to create such clips—the factory functions can be obtained from {@link Webimator.createAnimationClipFactories}.
Examples are shown below.

Generally (with some exceptions), using a clip factory function follows this format:
`const clip = <factory func>(<some element>, <effect name>, [<effect options>], {<optional clip configuration>});`
*/
/**** EX:E id="AnimClip.desc" */

/**** EX:S id="AnimClip.class" */
// retrieve the clip factory functions
const clipFactories = webimator.createAnimationClipFactories();

// select an element from the DOM
const square = document.querySelector('.square');

// A = element, B = effect name, C = effect options, D = configuration (optional)

// create 3 animation clips using the clip factory functions Entrance(), Motion(), and Emphasis()
//                                     A       B           C
const entClip = clipFactories.Entrance(square, '~fade-in', []);
//                                   A       B             C
const motClip = clipFactories.Motion(square, '~translate', [{translateX: '500px', offsetSelf: '50%, 50%'}]);
//                                     A       B             C        D
const empClip = clipFactories.Emphasis(square, '~highlight', ['red'], {duration: 2000, easing: 'ease-in'});

(async () => {
  // play the clips one at a time
  await entClip.play();
  await motClip.play();
  await empClip.play();
  // rewind the clips one at a time
  await empClip.rewind();
  await motClip.rewind();
  await entClip.rewind();
})();
/**** EX:E id="AnimClip.class" */
}

{
/**** EX:S id="EntranceClip.example" */
// retrieve entrance clip factory function;
const { Entrance } = webimator.createAnimationClipFactories();

// select elements from the DOM
const square = document.querySelector('.square');
const circle = document.querySelector('.circle');
const triangle = document.querySelector('.triangle');

// A = element, B = effect name, C = effect options, D = configuration (optional)

// create three entrance clips using factory function
//                     A       B          C
const clip1 = Entrance(square, '~appear', []);
//                     A       B          C              D
const clip2 = Entrance(circle, '~fly-in', ['from-left'], {duration: 2000, easing: 'ease-out'});
//                     A         B            C                 D
const clip3 = Entrance(triangle, '~pinwheel', [2, 'clockwise'], {playbackRate: 2, delay: 1000});

// play clips (all will play at the same time because they are asynchronous)
clip1.play();
clip2.play();
clip3.play();
/**** EX:E id="EntranceClip.example" */
}

{
/**** EX:S id="ExitClip.example" */
// retrieve exit clip factory function;
const { Exit } = webimator.createAnimationClipFactories();

// select elements from the DOM
const square = document.querySelector('.square');
const circle = document.querySelector('.circle');
const triangle = document.querySelector('.triangle');

// A = element, B = effect name, C = effect options, D = configuration (optional)

// create three exit clips using factory function
//                 A       B             C
const clip1 = Exit(square, '~disappear', []);
//                 A       B           C            D
const clip2 = Exit(circle, '~fly-out', ['to-left'], {duration: 2000, easing: 'ease-in'});
//                 A         B            C                        D
const clip3 = Exit(triangle, '~pinwheel', [2, 'counterclockwise'], {playbackRate: 2, delay: 1000});

// play clips (all will play at the same time because they are asynchronous)
clip1.play();
clip2.play();
clip3.play();
/**** EX:E id="ExitClip.example" */
}

{
/**** EX:S id="EmphasisClip.example" */
// retrieve emphasis clip factory function;
const { Emphasis } = webimator.createAnimationClipFactories();

// select element from the DOM
const importantText = document.querySelector('.important-text');

// A = element, B = effect name, C = effect options, D = configuration (optional)

// create emphasis clip using factory function
const clip1 = Emphasis(
  importantText, // A
  '~highlight', // B
  ['yellow'], // C
  { // D
    cssClasses: {toAddOnStart: ['.bold', '.italics']},
    duration: 1000,
  },
);

// play clip
clip1.play();
/**** EX:E id="EmphasisClip.example" */
}

{
/**** EX:S id="MotionClip.example" */
// retrieve motion clip factory function;
const { Motion } = webimator.createAnimationClipFactories();

// select elements from the DOM
const square = document.querySelector('.square');
const circle = document.querySelector('.circle');
const triangle = document.querySelector('.triangle');

// A = element, B = effect name, C = effect options, D = configuration (optional)

// create motion clips using factory function
//                   A       B             C
const clip1 = Motion(square, '~translate', [{translate: '200px, 300rem'}]);
//                   A       B           C
const clip2 = Motion(circle, '~move-to', [document.querySelector('body'), {alignment: 'center center'}]);
//                   A         B           C                                                       D
const clip3 = Motion(triangle, '~move-to', [circle, {alignmentX: 'center', offsetSelfY: '-100%'}], {duration: 2000});

// play clips one at a time
(async() => {
  await clip1.play(); // square moves 200px right and 300rem down
  await clip2.play(); // circle moves to center itself horizontally and vertically with the <body>
  await clip3.play(); // triangle moves to sit on top of the circle, horizontally centered
})()
/**** EX:E id="MotionClip.example" */
}

{
/**** EX:S id="ScrollerClip.example" */
// retrieve scroller clip factory function;
const { Scroller } = webimator.createAnimationClipFactories();

// select elements from the DOM
const sideBar = document.querySelector('.side-bar');
const mainPage = document.querySelector('.main');

// A = element, B = effect name, C = effect options, D = configuration (optional)

// create scroller clips using factory function
//                     A        B               C                                          D
const clip1 = Scroller(sideBar, '~scroll-self', [sideBar?.querySelector('.contact-link')], {duration: 1000});
const clip2 = Scroller(
  mainPage, // A
  '~scroll-self', // B
  [ // C
    mainPage?.querySelector('.testimonials'),
    {
      scrollableOffsetY: 'center',
      targetOffsetY: 'top',
    },
  ],
  { // D
    duration: 2000,
    easing: 'ease-in-out'
  },
);

// play clips one at a time
(async() => {
  // side bar scrolls to a presumed contact link
  await clip1.play();
  // main page scrolls to a presumed testimonials section.
  // the top of the testimonials section aligns with the center of the page
  await clip2.play();
})();
/**** EX:E id="ScrollerClip.example" */
}

{
/**** EX:S id="TransitionClip.example" */
// retrieve transition clip factory function;
const { Transition } = webimator.createAnimationClipFactories();

// select elements from the DOM
const square = document.querySelector('.square');
const textBox = document.querySelector('.text-box');
const triangle = document.querySelector('.triangle');

// A = element, B = effect name, C = effect options, D = configuration (optional)

// create transition clips using factory function
//                       A       B      C                                              D
const clip1 = Transition(square, '~to', [{backgroundColor: 'lightred', width: '50%'}], {duration: 1000});
//                       A        B      C
const clip2 = Transition(textBox, '~to', [{fontSize: '30px', color: 'blue'}]);
//                       A         B        C
const clip3 = Transition(triangle, '~from', [{opacity: '0'}]);

// play clips (all will play at the same time because they are asynchronous)
clip1.play(); // square transitions to turn red and shrink to half width
clip2.play(); // text box font size transitions to have font size of 30px and text color blue
clip3.play(); // triangle transitions FROM 0 opacity to its current opacity
/**** EX:E id="TransitionClip.example" */
}

{
/**** EX:S id="ConnectorSetterClip.example" */
// retrieve connector setter clip factory function;
const { ConnectorSetter } = webimator.createAnimationClipFactories();

// select connector elements from the DOM
const topConnector = document.querySelector('.connector--thick');
const middleConnector = document.querySelector('.connector--skinny');
const verticalConnector = document.querySelector('.connector--red');
const bottomConnector = document.querySelector('.connector--dashed');
// select other elements from the DOM
const circle1 = document.querySelector('.circle--left');
const circle2 = document.querySelector('.circle--right');

// A = connector element, B = point a, C = point b, D = configuration (optional)

// create connector setter clips using factory function
//                            A             B                           C
const clip1 = ConnectorSetter(topConnector, [circle1, 'center', 'top'], [circle2, 'center', 'top']);
//                            A                B                             C
const clip2 = ConnectorSetter(middleConnector, [circle1, 'right', 'center'], [circle2, 'left', 'center']);
//                            A                  B                                   C
const clip3 = ConnectorSetter(verticalConnector, [topConnector, 'center', 'center'], [middleConnector, 'center', 'center']);
const clip4 = ConnectorSetter(
  bottomConnector, // A
  [circle1, 'center', 'center'], // B
  [circle2, 'center', 'center'], // C
  {pointTrackingEnabled: false}, // D
);

// play clips (all will play at the same time because they are asynchronous)
// topConnector's endpoints are set to the center-tops of circle1 and circle2
clip1.play();

// middleConnector's endpoints are set to the right-center of circle1 and left-center of circle2
clip2.play();

// verticalConnector's endpoints are set to the midpoints of topConnector and middleConnector
clip3.play();

// bottomConnector's endpoints are set to the center-bottoms of circle1 and circle2,
// but its endpoints will NOT be updated if the circles move
clip4.play();

// if the connectors are then drawn using ConnectorEntrance(), their endpoints will match
// what was set according to ConnectorSetter()
/**** EX:E id="ConnectorSetterClip.example" */
}

{
/**** EX:S id="ConnectorEntranceClip.example" */
// retrieve connector entrance clip factory function;
const { ConnectorEntrance } = webimator.createAnimationClipFactories();

// select connector elements from the DOM
const topConnector = document.querySelector('.connector--thick');
const middleConnector = document.querySelector('.connector--skinny');
const verticalConnector = document.querySelector('.connector--red');
const bottomConnector = document.querySelector('.connector--dashed');

// A = element, B = effect name, C = effect options, D = configuration (optional)

// create connector entrance clips using factory function
//                              A             B           C   D             
const clip1 = ConnectorEntrance(topConnector, '~fade-in', [], {duration: 2000, playbackRate: 2});
//                              A                B         C
const clip2 = ConnectorEntrance(middleConnector, '~trace', ['from-A']);
//                              A                  B         C                D
const clip3 = ConnectorEntrance(verticalConnector, '~trace', ['from-bottom'], {delay: 500});
//                              A                B          C
const clip4 = ConnectorEntrance(bottomConnector, '~appear', []);

// play clips (all will play at the same time because they are asynchronous)
clip1.play(); // topConnector fades in
clip2.play(); // middleConnector is drawn from its point A to its point B
clip3.play(); // verticalConnector is draw starting from whichever endpoint is lower
clip4.play(); // bottomConnector appears instantly
/**** EX:E id="ConnectorEntranceClip.example" */
}

{
/**** EX:S id="ConnectorExitClip.example" */
// retrieve connector exit clip factory function;
const { ConnectorExit } = webimator.createAnimationClipFactories();

// select connector elements from the DOM
const topConnector = document.querySelector('.connector--thick');
const middleConnector = document.querySelector('.connector--skinny');
const verticalConnector = document.querySelector('.connector--red');
const bottomConnector = document.querySelector('.connector--dashed');

// A = element, B = effect name, C = effect options, D = configuration (optional)

// create connector exit clips using factory function
//                          A             B            C   D             
const clip1 = ConnectorExit(topConnector, '~fade-out', [], {duration: 2000, playbackRate: 2});
//                          A                B         C
const clip2 = ConnectorExit(middleConnector, '~trace', ['from-B']);
//                          A                  B         C             D
const clip3 = ConnectorExit(verticalConnector, '~trace', ['from-top'], {delay: 500});
//                          A                B             C
const clip4 = ConnectorExit(bottomConnector, '~disappear', []);

// play clips (all will play at the same time because they are asynchronous)
clip1.play(); // topConnector fades out
clip2.play(); // middleConnector is erased from its point B to its point A
clip3.play(); // verticalConnector is erased starting from whichever endpoint is higher
clip4.play(); // bottomConnector disappears instantly
/**** EX:E id="ConnectorExitClip.example" */
}

{
/**** EX:S id="AnimClip.generateTimePromise-1" */
async function testFunc() {
  const { Entrance } = webimator.createAnimationClipFactories();
  const square = document.querySelector('.square');
  const ent = Entrance(square, '~fade-in', []);
  // wait until ent is played and gets 1/5 of the way through the active phase of the animation
  await ent.generateTimePromise('forward', 'activePhase', '20%');
  console.log('1/5 done playing!');
}

testFunc();
/**** EX:E id="AnimClip.generateTimePromise-1" */
}

{
/**** EX:S id="AnimClip.generateTimePromise-2" */

async function testFunc() {
  const { Entrance } = webimator.createAnimationClipFactories();
  const square = document.querySelector('.square');
  const ent = Entrance(square, '~fade-in', []);
   // wait until ent is eventually rewound and gets 4/5 of the way through rewinding the active phase of the animation
   await ent.generateTimePromise('backward', 'activePhase', '20%');
   console.log('4/5 done rewinding!');
}

testFunc();
/**** EX:E id="AnimClip.generateTimePromise-2" */
}

{
/**** EX:S id="AnimClip.addRoadblocks-1" */
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
/**** EX:E id="AnimClip.addRoadblocks-1" */
}

{
/**** EX:S id="AnimClip.computeTween-1" */
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
/**** EX:E id="AnimClip.computeTween-1" */
}






{
/**** EX:S id="AnimTimeline.jumpToSequenceTag" */
const {Entrance, Motion, Exit} = webimator.createAnimationClipFactories();
const square = document.querySelector('.square');

const tLine = webimator.newTimeline(
  webimator.newSequence(
    {jumpTag: 'flickering'},
    Entrance(square, '~appear', [], {endDelay: 500}),
    Exit(square, '~disappear', [], {endDelay: 500}),
    Entrance(square, '~appear', [], {endDelay: 500}),
    Exit(square, '~disappear', [], {endDelay: 500}),
    Entrance(square, '~appear', [], {endDelay: 500}),
    Exit(square, '~disappear', [], {endDelay: 500}),
  ),

  webimator.newSequence(
    {jumpTag: 'move around'},
    Motion(square, '~translate', [{translateX: '200px'}]),
    Motion(square, '~translate', [{translateY: '200px'}]),
    Motion(square, '~translate', [{translateX: '-200px'}]),
    Motion(square, '~translate', [{translateY: '-200px'}]),
  ),

  webimator.newSequence(
    {jumpTag: 'go away', autoplays: true},
    Exit(square, '~pinwheel', []),
  )
);

// Promise-based timer
async function wait(milliseconds: number) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

(async () => {
  // jump straight to sequence with tag "move around"
  await tLine.jumpToSequenceTag('move around');

  await wait (1000); // wait 1 second

  // jump to sequence whose tag contains "flick"
  // (so now we're back at the beginning of the timeline)
  await tLine.jumpToSequenceTag(/flick/);

  await wait (1000); // wait 1 second

  // jump to sequence with tag "move around"
  // then look forward to see if any sequences have {autoplays: true}
  // the next one does, so it continues, skipping to the third sequence
  await tLine.jumpToSequenceTag('move around', {autoplayDetection: 'forward'});

  await wait (1000); // wait 1 second

  // play the last sequence
  await tLine.step('forward');
})();
/**** EX:E id="AnimTimeline.jumpToSequenceTag" */
}







{
/**** EX:S id="PresetLinearEasingKey-1" */
const str1: PresetLinearEasingKey = 'power2-in';
const str2: PresetLinearEasingKey = 'expo-in-out';
/** @ts-ignore */
const str3: PresetLinearEasingKey = 'expo'; // INVALID
/**** EX:E id="PresetLinearEasingKey-1" */
}

{
/**** EX:S id="EasingString-1" */
const str1: EasingString = 'power2-in'; // valid (matches PresetLinearEasingKey)
const str2: EasingString = 'expo-in-out'; // valid (matches PresetLinearEasingKey)
/** @ts-ignore */
const str3: EasingString = 'cubic-bezier(0.25, 0.1, 0.25, 1)'; // valid (matches string and is also a valid <easing-function>)
const str4: EasingString = 'ease-in'; // valid (matches TrivialCssEasingFunction)

const str5: EasingString = 'expo'; // valid (matches string) but will lead to a runtime error
/** @ts-ignore */
const str6: EasingString = 'cubic-bezier(0.25, 0.1, 0.25)'; // valid (matches string) but will lead to a runtime error
/**** EX:E id="EasingString-1" */
}








{
/**** EX:S id="KeyframesGenerator.generateKeyframes-1" */
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
/**** EX:E id="KeyframesGenerator.generateKeyframes-1" */
}

{
/**** EX:S id="KeyframesGeneratorsGenerator.generateKeyframeGenerators-1" */
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
/**** EX:E id="KeyframesGeneratorsGenerator.generateKeyframeGenerators-1" */
}

{
/**** EX:S id="RafMutatorsGenerator.generateRafMutators-1" */
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
/**** EX:E id="RafMutatorsGenerator.generateRafMutators-1" */
}

{
/**** EX:S id="RafMutatorsGeneratorsGenerator.generateRafMutatorGenerators-1" */
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
/**** EX:E id="RafMutatorsGeneratorsGenerator.generateRafMutatorGenerators-1" */
}
