import { createCustomEffectComposer, createCustomEffectComposerBank } from "../2_animationEffects/customEffectCreation";
import { EasingString, PresetLinearEasingKey, useEasing } from "../2_animationEffects/easing";
import { webchalk } from "../WebChalk";

{
/**** EX:S id="WebChalk.newSequence-1.1" */
// retrieve clip factory functions
const clipFactories = webchalk.createAnimationClipFactories();
// select a (presumable) square-shaped element from the DOM
const squareEl = document.querySelector(".square");

// create sequence with some configuration options and some animation clips
const seq = webchalk.newSequence(
  { description: "Fade in square, move it, and fade out", playbackRate: 2 },
  [
    clipFactories.Entrance(squareEl, "~fade-in", []),
    clipFactories.Motion(squareEl, "~translate", [{ translate: "200px 500px" }]),
    clipFactories.Exit(squareEl, "~fade-out", []),
  ]
);
// play sequence
seq.play();
/**** EX:E id="WebChalk.newSequence-1.1" */
}

{
/**** EX:S id="WebChalk.newSequence-1.2" */
// SAME EXAMPLE BUT WITH DESTRUCTURING ASSIGNMENT FOR THE CLIP FACTORY FUNCTIONS

const {Entrance, Exit, Motion} = webchalk.createAnimationClipFactories();
const squareEl = document.querySelector('.square');

const seq = webchalk.newSequence(
  {description: 'Fade in square, move it, and fade out', playbackRate: 2},
  [
    Entrance(squareEl, '~fade-in', []),
    Motion(squareEl, '~translate', [{translate: '200px 500px'}]),
    Exit(squareEl, '~fade-out', []),
  ]
);
seq.play();
/**** EX:E id="WebChalk.newSequence-1.2" */
}

{
/**** EX:S id="WebChalk.newSequence-2.1" */
// retrieve clip factory functions
const clipFactories = webchalk.createAnimationClipFactories();
// select a (presumable) square-shaped element from the DOM
const squareEl = document.querySelector('.square');

// create sequence with some animation clips
const seq = webchalk.newSequence(
  [
    clipFactories.Entrance(squareEl, '~fade-in', []),
    clipFactories.Motion(squareEl, '~translate', [{translate: '200px 500px'}]),
    clipFactories.Exit(squareEl, '~fade-out', []),
  ]
);
// play sequence
seq.play();
/**** EX:E id="WebChalk.newSequence-2.1" */
}

{
/**** EX:S id="WebChalk.newSequence-2.2" */
// SAME EXAMPLE BUT WITH DESTRUCTURING ASSIGNMENT FOR THE CLIP FACTORY FUNCTIONS

const {Entrance, Exit, Motion} = webchalk.createAnimationClipFactories();
const squareEl = document.querySelector('.square');

const seq = webchalk.newSequence(
  [
    Entrance(squareEl, '~fade-in', []),
    Motion(squareEl, '~translate', [{translate: '200px 500px'}]),
    Exit(squareEl, '~fade-out', []),
  ]
);
seq.play();
/**** EX:E id="WebChalk.newSequence-2.2" */
}

{
/**** EX:S id="WebChalk.newTimeline-1" */
// retrieve some clip factory functions
const {Entrance, Exit, Motion} = webchalk.createAnimationClipFactories();
// select presumably a square element and a circle element from the DOM
const squareEl = document.querySelector('.square');
const circleEl = document.querySelector('.circle');

// create first sequence
const seq1 = webchalk.newSequence(
   {description: 'Fade in square, move it, and fade out', playbackRate: 2},
   [
     Entrance(squareEl, '~fade-in', []),
     Motion(squareEl, '~translate', [{translate: '200px 500px'}]),
     Exit(squareEl, '~fade-out', []),
   ]
);

// create second sequence
const seq2 = webchalk.newSequence(
   {description: 'Fade in circle and move it'},
   [
     Entrance(circleEl, '~fly-in', ['from-left']),
     Motion(circleEl, '~translate', [{translate: '250px 0px'}]),
   ]
);

// create timeline with some configuration and both sequences
const timeline = webchalk.newTimeline(
   {timelineName: 'Moving Shapes', autoLinksButtons: true},
   [seq1, seq2]
);

// step forward twice, playing both sequences
timeline.step('forward')
  .then(() => timeline.step('forward'));
/**** EX:E id="WebChalk.newTimeline-1" */
}

{
/**** EX:S id="WebChalk.newTimeline-2" */
// retrieve some clip factory functions
const {Entrance, Exit, Motion} = webchalk.createAnimationClipFactories();
// select presumably a square element and a circle element from the DOM
const squareEl = document.querySelector('.square');
const circleEl = document.querySelector('.circle');

// create first sequence
const seq1 = webchalk.newSequence(
  {description: 'Fade in square, move it, and fade out', playbackRate: 2},
  [
    Entrance(squareEl, '~fade-in', []),
    Motion(squareEl, '~translate', [{translate: '200px 500px'}]),
    Exit(squareEl, '~fade-out', []),
  ]
);

// create second sequence
const seq2 = webchalk.newSequence(
  {description: 'Fade in circle and move it'},
  [
    Entrance(circleEl, '~fly-in', ['from-left']),
    Motion(circleEl, '~translate', [{translate: '250px 0px'}]),
  ]
);

// create timeline with both sequences
const timeline = webchalk.newTimeline(
  [seq1, seq2]
);
/**** EX:E id="WebChalk.newTimeline-2" */
}

{
/**** EX:S id="WebChalk.createAnimationClipFactories-1.1" */
const square = document.querySelector('.square');
// Using the method and using one of the `Entrance()` factory function
const clipFactories = webchalk.createAnimationClipFactories();
const ent = clipFactories.Entrance(square, '~fly-in', ['from-top'], {duration: 2000});
ent.play();
/**** EX:E id="WebChalk.createAnimationClipFactories-1.1" */
}

{
/**** EX:S id="WebChalk.createAnimationClipFactories-1.2" */
const square = document.querySelector('.square');
// Using destructuring assignment to conveniently extract the `Entrance()` and `Motion()` factory functions
const {Entrance, Motion} = webchalk.createAnimationClipFactories();
const ent = Entrance(square, '~fly-in', ['from-top'], {duration: 2000});
const mot1 = Motion(square, '~translate', [{translate: '500px 0px'}], {duration: 1000});
const mot2 = Motion(square, '~translate', [{translate: '0px 500px'}], {duration: 500});
// clips are added to a sequence
const seq = webchalk.newSequence([ent, mot1, mot2]);
seq.play();
/**** EX:E id="WebChalk.createAnimationClipFactories-1.2" */
}

{
/**** EX:S id="WebChalk.createAnimationClipFactories-1.3" */
// Extending the preset entrances and motions banks with custom effects
const clipFactories = webchalk.createAnimationClipFactories({
  // CUSTOM ENTRANCES
  customEntranceEffects: {
    coolZoomIn: {
      composeEffect(initialScale: number) {
        return {
          forwardKeyframesGenerator: () => [
            {scale: initialScale, opacity: 0},
            {scale: 1, opacity: 1}
          ],
          // (backwardFrames could have been omitted in this case because
          // the reversal of forwardFrames is exactly equivalent)
          backwardKeyframesGenerator: () => [
            {scale: 1, opacity: 1},
            {scale: initialScale, opacity: 0}
          ]
        };
      }
    },

    blinkIn: {
      composeEffect() {
        return {
          forwardKeyframesGenerator: () => [
            {opacity: 0}, {opacity: 1}, {opacity: 0}, {opacity: 1}, {opacity: 0}, {opacity: 1}
          ],
          // (backwardKeyframesGenerator() omitted because the reversal of
          // forwardKeyframesGenerator() is exactly equivalent)
        };
      }
    }
  },

  // CUSTOM EXITS
  customExitEffects: {
    // a custom animation effect for flying out to the left side of the screen
    flyOutLeft: {
      composeEffect() {
        const computeTranslationStr = () => {
          const orthogonalDistance = -(this.domElem.getBoundingClientRect().right);
          const translationString = `${orthogonalDistance}px 0px`;
          return translationString;
        }
  
        return {
          forwardKeyframesGenerator: () => {
            return [
              {translate: computeTranslationStr()}
            ];
          },
          // backwardKeyframesGenerator could have been omitted because the result
          // of running forwardKeyframesGenerator() again and reversing the keyframes
          // produces the same desired rewinding effect in this case
          backwardKeyframesGenerator: () => {
            return [
              {translate: computeTranslationStr()},
              {translate: `0 0`}
            ];
          }
        };
      },
      
      immutableConfig: {
        // this means that the translation is added onto the element's position
        // instead of replacing it
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
/**** EX:E id="WebChalk.createAnimationClipFactories-1.3" */
}













{
/**** EX:S id="AnimClip.desc" */
/*
A "clip" is the smallest building block of a timeline. It is essentially a [DOM element, effect] pair,
where a "DOM element" is some HTML element on the page and the effect is the animation effect that
will be applied to it (asynchronously).

The {@link AnimClip} class is abstract, meaning it cannot be instantiated. But it has several subclasses such as 
{@link EntranceClip}, {@link MotionClip}, {@link TransitionClip}, etc. WebChalk provides convenient factory functions
that can be used to create such clips—the factory functions can be obtained from {@link WebChalk.createAnimationClipFactories}.
Examples are shown below.

Generally (with some exceptions), using a clip factory function follows this format:
`const clip = <factory func>(<some element>, <effect name>, [<effect options>], {<optional clip configuration>});`
*/
/**** EX:E id="AnimClip.desc" */

/**** EX:S id="AnimClip.class" */
// retrieve the clip factory functions
const clipFactories = webchalk.createAnimationClipFactories();

// select an element from the DOM
const square = document.querySelector('.square');

// A = element, B = effect name, C = effect options, D = configuration (optional)

// create 3 animation clips using the clip factory functions Entrance(), Motion(), and Emphasis()
//                                     A       B           C
const entClip = clipFactories.Entrance(square, '~fade-in', []);
//                                   A       B             C
const motClip = clipFactories.Motion(square, '~translate', [{translate: '500px 0px', selfOffset: '50% 50%'}]);
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
const { Entrance } = webchalk.createAnimationClipFactories();

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
const { Exit } = webchalk.createAnimationClipFactories();

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
const { Emphasis } = webchalk.createAnimationClipFactories();

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
const { Motion } = webchalk.createAnimationClipFactories();

// select elements from the DOM
const square = document.querySelector('.square');
const circle = document.querySelector('.circle');
const triangle = document.querySelector('.triangle');

// A = element, B = effect name, C = effect options, D = configuration (optional)

// create motion clips using factory function
//                   A       B             C
const clip1 = Motion(square, '~translate', [{translate: '200px 300rem'}]);
//                   A       B           C
const clip2 = Motion(circle, '~move-to', [document.querySelector('body'), {alignment: 'center center'}]);
//                   A         B           C                                                             D
const clip3 = Motion(triangle, '~move-to', [circle, {alignment: 'center top', selfOffset: '0% -100%'}], {duration: 2000});

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
const { Scroller } = webchalk.createAnimationClipFactories();

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
      scrollableOffset: ['0px', 'center'],
      targetOffset: ['0px', 'top'],
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
const { Transition } = webchalk.createAnimationClipFactories();

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
const { ConnectorSetter } = webchalk.createAnimationClipFactories();

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
const { ConnectorEntrance } = webchalk.createAnimationClipFactories();

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
const { ConnectorExit } = webchalk.createAnimationClipFactories();

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
/**** EX:S id="AnimClip.schedulePromise-1" */
async function testFunc() {
  const { Entrance } = webchalk.createAnimationClipFactories();
  const square = document.querySelector('.square');
  const ent = Entrance(square, '~fade-in', []);
  // wait until ent is played and gets 1/5 of the way through the active phase of the animation
  await ent.schedulePromise('forward', 'activePhase', '20%');
  console.log('1/5 done playing!');
}

testFunc();
/**** EX:E id="AnimClip.schedulePromise-1" */
}

{
/**** EX:S id="AnimClip.schedulePromise-2" */

async function testFunc() {
  const { Entrance } = webchalk.createAnimationClipFactories();
  const square = document.querySelector('.square');
  const ent = Entrance(square, '~fade-in', []);
   // wait until ent is eventually rewound and gets 4/5 of the way through rewinding the active phase of the animation
   await ent.schedulePromise('backward', 'activePhase', '20%');
   console.log('4/5 done rewinding!');
}

testFunc();
/**** EX:E id="AnimClip.schedulePromise-2" */
}

{
/**** EX:S id="AnimClip.scheduleTask-1" */
async function wait(milliseconds: number) { // Promise-based timer
   return new Promise(resolve => setTimeout(resolve, milliseconds));
}

const square = document.querySelector('.square');
const { Entrance } = webchalk.createAnimationClipFactories();
const ent = Entrance(square, '~fade-in', [], {endDelay: 1500});

// adds 1 task that will pause the clip for 2 seconds once the clip is 15% through the active phase
ent.scheduleTask('activePhase', '15%', {onPlay: () => wait(2000)});
// adds 1 more task at the same point that will pause the clip for 3 seconds.
ent.scheduleTask('activePhase', '15%', {onPlay: () => wait(3000)});
// adds 1 task at 40% into the endDelay phase that will...
// ... log 'HELLO' if the clip is playing forward
// ... log 'WORLD' if the clip is rewinding
ent.scheduleTask('endDelayPhase', '40%', {
  onPlay: () => console.log('HELLO'),
  onRewind: () => console.log('WORLD')
});

(async () => {
  await ent.play();
  // ↑
  // Once ent is 15% through the active phase, it will pause and handle its scheduled tasks.
  // -- "wait(2000)" resolves after 2 seconds.
  // -- "wait(3000)" resolves after 3 seconds.
  // There are no more tasks at this point, so playback is resumed.
  // Once ent is 40% through the endDelay phase, it will pause and handle its tasks
  // -- 'HELLO' is logged to the console
  // There are no more tasks at this point, so playback is resumed.
  await ent.rewind();
  // ↑
  // Once ent rewinds back to the 40% point of the endDelay phase, it will pause and...
  // ... handle its scheduled tasks
  // -- 'WORLD' is logged to the console
  // There are no more tasks at this point, so playback is resumed.
})();
/**** EX:E id="AnimClip.scheduleTask-1" */
}

{
/**** EX:S id="AnimClip.computeTween-1" */
const {Entrance} = webchalk.createAnimationClipFactories({
  customEntranceEffects: {
    rotate: {
      composeEffect(degrees: number) {
        return {
          // when playing, keep computing the value between 0 and 'degrees'
          forwardMutatorGenerator: () => () => { this.domElem.style.rotate = this.computeTween(0, degrees)+'deg'; },
          // when rewinding, keep computing the value between 'degrees' and 0
          backwardMutatorGenerator: () => () => { this.domElem.style.rotate = this.computeTween(degrees, 0)+'deg'; }
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
const {Entrance, Motion, Exit} = webchalk.createAnimationClipFactories();
const square = document.querySelector('.square');

const tLine = webchalk.newTimeline(
  [
    webchalk.newSequence(
      {jumpTag: 'flickering'},
      [
        Entrance(square, '~appear', [], {endDelay: 500}),
        Exit(square, '~disappear', [], {endDelay: 500}),
        Entrance(square, '~appear', [], {endDelay: 500}),
        Exit(square, '~disappear', [], {endDelay: 500}),
        Entrance(square, '~appear', [], {endDelay: 500}),
        Exit(square, '~disappear', [], {endDelay: 500}),
      ]
    ),

    webchalk.newSequence(
      {jumpTag: 'move around'},
      [
        Motion(square, '~translate', [{translate: '200px 0px'}]),
        Motion(square, '~translate', [{translate: '0px 200px'}]),
        Motion(square, '~translate', [{translate: '-200px 0px'}]),
        Motion(square, '~translate', [{translate: '0px -200px'}]),
      ]
    ),

    webchalk.newSequence(
      {jumpTag: 'go away', autoplays: true},
      [
        Exit(square, '~pinwheel', []),
      ]
    ),
  ]
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
/**** EX:S id="ComposedEffect.keyframes-generators" */
const clipFactories = webchalk.createAnimationClipFactories({
  customEntranceEffects: {
    // -----------------------------------------------------------------
    // ----------------------------EXAMPLE 1----------------------------
    // -----------------------------------------------------------------
    // Let us pretend you made this custom entrance animation effect named 'zoomIn'.
    // For this animation, you wrote the forward keyframes generator and
    // then verified that the desired rewinding effect is exactly equivalent
    // to playing the keyframes produced by forwardKeyframesGenerator() in reverse,
    // so you omit backwardKeyframesGenerator.
    zoomIn: {
      composeEffect(initialScale: number) {
        // return ComposedEffect
        return {
          forwardKeyframesGenerator: () => {
            console.log('About to return keyframes!');
            // return Keyframes (Keyframe[])
            return [
              {scale: initialScale, opacity: 0}, // Keyframe 1
              {}                                 // Keyframe 2
            ];
          },
          // backwardKeyframesGenerator() can be omitted in this case because
          // the reversal of the forward keyframes is exactly equivalent.
          // It is written below for demonstration purposes but commented out.
          // -----------------------------------------------------------------------
          // backwardKeyframesGenerator: () => {
          //   // return Keyframes (Keyframe[])
          //   return [
          //     {},                               // Keyframe 1
          //     {scale: initialScale, opacity: 0} // Keyframe 2
          //   ];
          // },
        };
      }
    },
  },

  customMotionEffects: {
    // -----------------------------------------------------------------
    // ----------------------------EXAMPLE 2----------------------------
    // -----------------------------------------------------------------
    // Let us pretend you made this custom animation effect for moving an element rightward.
    // For this animation, you wrote the forward keyframes generator and then
    // checked to see if the desired rewinding effect could be achieved by just reusing
    // forwardKeyframesGenerator() and reversing the result. You realize that this effect is NOT
    // a candidate for that shortcut, so you write backwardKeyframesEffect.
    translateRight: {
      composeEffect(numPixels: number) {
        // a helper function you wrote that will exist within a closure scoped to composeEffect()
        const createTranslationString = () => {
          if (numPixels <= 0) { throw RangeError(`Number of pixels must exceed 0.`) }
          const translationString = `${numPixels}px`;
          return translationString;
        }
  
        // return ComposedEffect
        return {
          forwardKeyframesGenerator: () => {
            // return Keyframes (Keyframe[])
            return [
              {translate: createTranslationString()} // Keyframe
            ];
          },
          // backwardKeyframesGenerator() must be specified because reversing the keyframes produced
          // by forwardKeyframesGenerator() would not have the intended effect (because of
          // {composite: accumulate}, trying to simply use the reversal of
          // {translate: createTranslationString()} from forwardKeyframesGenerator() would actually
          // cause the target element to jump an additional numPixels pixels to the right
          // before sliding left, which is not the intended rewinding effect).
          backwardKeyframesGenerator: () => {
            // return Keyframes (Keyframe[])
            return [
              {translate: '-'+createTranslationString()}, // Keyframe
            ];
          },
        };
      },
      immutableConfig: {
        // this means that the translation is added onto the element's position
        // instead of replacing it
        composite: 'accumulate',
      },
      effectCompositionFrequency: 'on-first-play-only',
    },
  }
});

const element = document.querySelector('.some-element');
(async () => {
  const ent = clipFactories.Entrance(element, 'zoomIn', [0.2]);
  await ent.play();
  // ↑ forwardKeyframesGenerator() will run and produce the Keyframe array
  // [{scale: initialScale, opacity: 0}, {scale: 1, opacity: 1}].
  // That Keyframe array is used for the animation effect as the clip plays forward.

  await ent.rewind();
  // ↑ Since backwardKeyframesGenerator() was not set, the clip will run forwardKeyframesGenerator()
  // again and just use its effect in reverse when rewinding (which would be exactly equivalent
  // to specifying backwardKeyframesGenerator() and having it return
  // [{}, {scale: initialScale, opacity: 0}]).
  // In other words, forwardKeyframesGenerator() will run again to produce the Keyframe array
  // [{scale: initialScale, opacity: 0}, {}], then
  // the Keyframe array is used for the animation effect but set to go in reverse,
  // and the effect is used as the clip rewinds.

  const mot = clipFactories.Motion(element, 'translateRight', [756]);
  await mot.play();
  // ↑ forwardKeyframesGenerator() will run and produce the Keyframes array [{translate: '756px'}].
  // That Keyframe array is used for the animation effect as the clip plays.

  await mot.rewind();
  // ↑ backwawrdFramesGenerator() will run and produce the Keyframe array [{translate: '-756px'}].
  // That Keyframe array is used for the animation effect as the clip rewinds.
})();
/**** EX:E id="ComposedEffect.keyframes-generators" */
}

{
/**** EX:S id="ComposedEffect.mutator-generators" */
const clipFactories = webchalk.createAnimationClipFactories({
  customMotionEffects: {
    // a custom animation for scrolling to a specific point on the page.
    scrollTo: {
      composeEffect(yPosition: number) {
        const initialPosition = this.domElem.scrollTop;
  
        // return ComposedEffect
        return {
          // The mutation is to use the scrollTo() method on the element.
          // Thanks to computeTween(), there will be a smooth scroll
          // from initialPosition to yPosition
          forwardMutatorGenerator: () => {
            // return Mutator
            return () => {
              this.domElem.scrollTo({
                top: this.computeTween(initialPosition, yPosition),
                behavior: 'instant'
              });
            };
          },

          // The forward mutation loop is not invertible because reversing it requires
          // re-computing the element's scroll position at the time of rewinding
          // (which may have since changed for any number of reasons, including user
          // scrolling, size changes, etc.). So we must define backwardMutatorGenerator()
          // to do exactly that.
          backwardMutatorGenerator: () => {
            // return Mutator
            return () => {
              const currentPosition = this.domElem.scrollTop;
              this.domElem.scrollTo({
                top: this.computeTween(currentPosition, initialPosition),
                behavior: 'instant'
              });
            };
          },
        };
      }
    },
  }
});

const element = document.querySelector('.some-element');
const mot = clipFactories.Motion(element, 'scrollTo', [1020]);
mot.play().then(mot.rewind);
/**** EX:E id="ComposedEffect.mutator-generators" */
}

{
/**** EX:S id="EffectComposer.composeEffect-1" */
// EXAMPLES WHERE BACKWARD GENERATORS CAN BE OMITTED
const clipFactories = webchalk.createAnimationClipFactories({
  customEmphasisEffects: {
    // -----------------------------------------------------------------
    // ----------------------------EXAMPLE 1----------------------------
    // -------------------------transparencyHalf------------------------
    // -----------------------------------------------------------------
    transparencyHalf: {
      composeEffect() {
        const initialOpacity = this.getStyles('opacity');

        // return ComposedEffect
        return {
          forwardKeyframesGenerator: () => {
            // return Keyframes (Keyframe[])
            return [{opacity: initialOpacity}, {opacity: 0.5}];
          },
          // Notice how the backward generator would be equivalent to running the forward generator
          // and reversing the effect of the keyframes. That means that the forward keyframes
          // generator is invertible, and the backward generator can be omitted.
          backwardKeyframesGenerator: () => {
            // return Keyframes (Keyframe[])
            return [{opacity: 0.5}, {opacity: initialOpacity}];
          },
        };
      },
    },

    // Exactly equivalent to transparencyHalf because the keyframe generator
    // is invertible
    transparencyHalf_shortcut: {
      composeEffect() {
        const initialOpacity = this.getStyles('opacity');

        // return ComposedEffect
        return {
          forwardKeyframesGenerator: () => {
            // return Keyframes (Keyframe[])
            return [{opacity: initialOpacity}, {opacity: 0.5}];
          },
        };
      },
    },
  },

  customEntranceEffects: {
    // -----------------------------------------------------------------
    // ----------------------------EXAMPLE 2----------------------------
    // ------------------------------shyIn------------------------------
    // -----------------------------------------------------------------
    // Element shyly enters, hesitantly fading and scaling in and out until it
    // reaches full opacity and scale
    shyIn: {
      composeEffect() {
        // return ComposedEffect
        return {
          forwardKeyframesGenerator: () => {
            // return Keyframes (PropertyIndexedKeyframes)
            return {
              opacity: [0, 0.5, 0.1, 0.7, 0, 1],
              scale: [0, 0.5, 0.1, 0.7, 0, 1],
            };
          },
          // Notice how the backward generator would be equivalent to running the forward generator
          // and reversing the effect of the keyframes. That means that the forward keyframes
          // generator is invertible.
          backwardKeyframesGenerator: () => {
            // return Keyframes (PropertyIndexedKeyframes) 
            return {
              opacity: [1, 0, 0.7, 0.1, 0.5, 0],
              scale: [1, 0, 0.7, 0.1, 0.5, 0],
            };
          },
        };
      },
    },

    // Exactly equivalent to shyIn because the keyframes generator is invertible.
    shyIn_shortcut: {
      composeEffect() {
        // return ComposedEffect
        return {
          forwardKeyframesGenerator: () => {
            // return Keyframes (PropertyIndexedKeyframes)
            return {
              opacity: [0, 0.5, 0.1, 0.7, 0, 1],
              scale: [0, 0.5, 0.1, 0.7, 0, 1],
            };
          },
        };
      },
    },

    // -----------------------------------------------------------------
    // ----------------------------EXAMPLE 3----------------------------
    // -----------------------riseUp and sinkDown-----------------------
    // -----------------------------------------------------------------
    // Replicates PowerPoint's Rise Up animation.
    // Element flies in from the bottom of the screen and ends up
    // slightly too high, then settles down to its final position.
    riseUp: {
      composeEffect() {
        const belowViewportDist = () => {
          return window.innerHeight - this.domElem.getBoundingClientRect().top;
        };

        // return Composed Effect
        return {
          forwardKeyframesGenerator: () => {
            // return Keyframes (Keyframe[])
            return [
              {
                opacity: 0,
                composite: 'replace'
              },
              {
                translate: `0 ${belowViewportDist()}px`,
                offset: 0,
                easing: useEasing('power2-out')
              },
              {
                translate: `0 -25px`,
                offset: 0.83333
              },
              {
                translate: `0 -25px`,
                offset: 0.86,
                easing: useEasing('power1-in')
              },
              {translate: `0 0`},
            ];
          },
          // It would be a pain to figure out what the backward keyframes should look like 
          // for rewinding this effect. Fortunately, the forward generator is invertible,
          // (trust me—it is true) so backwardKeyframesGenerator() can be omitted.
          // ---------------------------------------------------------------------------------------
          // backwardKeyframesGenerator: () => {
          //   // return Keyframes (Keyframe[])
          //   return [] // ??????
          // },
        };
      },
      defaultConfig: {
        composite: 'accumulate',
      },
      immutableConfig: {},
    },
  },

  customExitEffects: {
    // Replicates PowerPoint's Sink Down animation, which is the opposite of Rise Up.
    // Element floats up slightly and then accelerates to the bottom of the screen.
    sinkDown: {
      composeEffect() {
        const belowViewportDist = () => {
          return window.innerHeight - this.domElem.getBoundingClientRect().top;
        };

        // return Composed Effect
        return {
          // Most of the time, when you write your own custom entrance/exit effect, you will want
          // to write the corresponding exit/entrance effect. If you write flyIn, you'll probably
          // write flyOut; if you write slideOut, you'll probably write slideIn; if you write riseUp,
          // you'll probably write sinkDown. The beauty is that if riseUp and sinkDown are opposites,
          // then we know that playing riseUp should be the same as rewinding sinkDown. Therefore,
          // we can copy-paste the logic from riseUp's forwardKeyframesGenerator() and simply set
          // reverseKeyframesEffect to true. Once again, we have gotten
          // away with just figuring out what the forward keyframes look like without having
          // to figure out what the other set looks like.
          // ---------------------------------------------------------------------------------------
          reverseKeyframesEffect: true,
          forwardKeyframesGenerator: () => {
            // return Keyframes (Keyframe[])
            return [
              {
                opacity: 0,
                composite: 'replace'
              },
              {
                translate: `0 ${belowViewportDist()}px`,
                offset: 0,
                easing: useEasing('power2-out'),
              },
              {
                translate: `0 -25px`,
                offset: 0.83333
              },
              {
                translate: `0 -25px`,
                offset: 0.86,
                easing: useEasing('power1-in')
              },
              {translate: `0 0`},
            ];
          },

          // backwardKeyframesGenerator: () => {
          //   // return Keyframes (Keyframe[])
          //   return [] // ??????
          // },
        };
      },
      defaultConfig: {
        composite: 'accumulate',
      },
      immutableConfig: {},
    },

    // -----------------------------------------------------------------
    // ----------------------------EXAMPLE 4----------------------------
    // ----------------------------flyOutLeft---------------------------
    // -----------------------------------------------------------------
    // a custom animation effect for flying out to the left side of the screen
    // while displaying the percentage progress in the element's text content
    flyOutLeft: {
      composeEffect() {
        const computeTranslationStr = () => {
          const orthogonalDistance = -(this.domElem.getBoundingClientRect().right);
          const translationString = `${orthogonalDistance}px 0px`;
          return translationString;
        }
  
        // return ComposedEffect
        return {
          forwardKeyframesGenerator: () => {
            // return Keyframes (Keyframe[])
            return [
              {translate: computeTranslationStr()}
            ];
          },

          // Notice how the backward generator would be equivalent to running the forward generator
          // and reversing the effect of the keyframes (even though the composite value is
          // 'accumulate', it's still invertible because exit effects' changes are never committed).
          // That means that the forward keyframes generator is invertible.
          // --------------------------------------------------------------------------------------
          backwardKeyframesGenerator: () => {
            // return Keyframes (Keyframe[])
            return [
              {translate: computeTranslationStr()},
              {translate: `0 0`}
            ];
          },

          forwardMutatorGenerator: () => {
            // return Mutator
            return () => {
              this.domElem.textContent = `${this.computeTween(0, 100)}%`;
            };
          },

          // Notice how the backward generator would be equivalent to running the forward generator
          // and reversing the effect of the mutator. That means that the mutator generator is
          // invertible. (Note that it may not always be the case that BOTH the keyframes
          // generators and the forward mutator generator are invertible).
          // --------------------------------------------------------------------------------------
          backwardMutatorGenerator: () => {
            // return Mutator
            return () => {
              this.domElem.textContent = `${this.computeTween(100, 0)}%`;
            };
          },
        };
      },
      defaultConfig: {
        duration: 1000,
        easing: "ease-in",
      },
      immutableConfig: {
        // this means that the translation is added onto the element's position
        // instead of replacing it
        composite: 'accumulate',
      },
    },

    // Exactly equivalent to flyOutLeft
    flyOutLeft_shortcut: {
      composeEffect() {
        const computeTranslationStr = () => {
          const orthogonalDistance = -(this.domElem.getBoundingClientRect().right);
          const translationString = `${orthogonalDistance}px 0px`;
          return translationString;
        }
  
        // return ComposedEffect
        return {
          forwardKeyframesGenerator: () => {
            // return Keyframes (Keyframe[])
            return [
              {translate: computeTranslationStr()}
            ];
          },

          forwardMutatorGenerator: () => {
            // return Mutator
            return () => {
              this.domElem.textContent = `${this.computeTween(0, 100)}%`;
            };
          },
        };
      },
      defaultConfig: {
        duration: 1000,
        easing: "ease-in",
      },
      immutableConfig: {
        composite: 'accumulate',
      },
    },
  },
});
/**** EX:E id="EffectComposer.composeEffect-1" */
}

{
/**** EX:S id="EffectComposer.composeEffect-2" */
// EXAMPLES WHERE BACKWARD GENERATORS CANNOT BE OMITTED
const clipFactories = webchalk.createAnimationClipFactories({
  customMotionEffects: {
    // a custom animation for translating a certain number of pixels to the right
    translateRight: {
      composeEffect(numPixels: number) {
        // a helper function you wrote that will exist within a closure scoped to composeEffect()
        const createTranslationString = () => {
          if (numPixels <= 0) { throw RangeError(`Number of pixels must exceed 0.`) }
          const translationString = `${numPixels}px`;
          return translationString;
        }
  
        // return ComposedEffect
        return {
          forwardKeyframesGenerator: () => {
            // return Keyframes (Keyframe][])
            return [
              {translate: createTranslationString()} // Keyframe
            ];
          },
          // backwardKeyframesGenerator() must be specified because reversing the keyframes produced
          // by forwardKeyframesGenerator() would not have the intended effect (due to
          // {composite: 'accumulate'}, trying to simply use the reversal of
          // {translate: createTranslationString()} from forwardKeyframesGenerator() would actually
          // cause the target element to jump an additional numPixels pixels to the right
          // before sliding left, which is not the intended rewinding effect).
          backwardKeyframesGenerator: () => {
            // return Keyframes (Keyframe[])
            return [
              {translate: '-'+createTranslationString()}, // Keyframe
            ];
          }
        };
      },
      immutableConfig: {
        // this means that the translation is added onto the element's position
        // instead of replacing it
        composite: 'accumulate',
      },
    },

    // a custom animation for scrolling to a specific point on the page.
    scrollTo: {
      composeEffect(yPosition: number) {
        const initialPosition = this.domElem.scrollTop;
  
        // return ComposedEffect
        return {
          // The mutation is to use the scrollTo() method on the element.
          // Thanks to computeTween(), there will be a smooth scroll
          // from initialPosition to yPosition
          forwardMutatorGenerator: () => {
            // return Mutator
            return () => {
              this.domElem.scrollTo({
                top: this.computeTween(initialPosition, yPosition),
                behavior: 'instant'
              });
            };
          },

          // The forward mutation loop is not invertible because reversing it requires
          // re-computing the element's scroll position at the time of rewinding
          // (which may have since changed for any number of reasons, including user
          // scrolling, size changes, etc.). So we must define backwardMutatorGenerator()
          // to do exactly that.
          backwardMutatorGenerator: () => {
            // return Mutator
            return () => {
              const currentPosition = this.domElem.scrollTop;
              this.domElem.scrollTo({
                top: this.computeTween(currentPosition, initialPosition),
                behavior: 'instant'
              });
            };
          }
        };
      },
    },
  }
});
/**** EX:E id="EffectComposer.composeEffect-2" */
}

{
/**** EX:S id="EffectComposer.defaultConfig" */
const clipFactories = webchalk.createAnimationClipFactories({
  customEntranceEffects: {
    // Element fades in, starting from 0 opacity.
    fadeIn: {
      composeEffect() {
        return {
          forwardKeyframesGenerator: () => {
            return [ {opacity: '0'}, {} ];
          },
        } as const;
      },
    },

    fadeIn_default: {
      composeEffect() {
        return {forwardKeyframesGenerator: () => {
          return [ {opacity: '0'}, {} ];
        },
        } as const;
      },
      defaultConfig: {
        duration: 2000,
      },
    },
  }
});

// select element from DOM
const element = document.querySelector('.some-element');

const ent1 = clipFactories.Entrance(element, 'fadeIn', [], {});
// ↑ duration will be set to whatever the default duration is for all
// EntranceClip objects

const ent2 = clipFactories.Entrance(element, 'fadeIn_default', [], {});
// ↑ duration will be set to 2000 because that is what was specified in
// the 'fadeIn_default' effect definition

const ent3 = clipFactories.Entrance(element, 'fadeIn_default', [], {duration: 1000});
// ↑ duration will be set to 1000 because configuration settings set in the
// clip factory function call will overwrite any default settings
/**** EX:E id="EffectComposer.defaultConfig" */
}

{
/**** EX:S id="EffectComposer.immutableConfig" */
const clipFactories = webchalk.createAnimationClipFactories({
  customEntranceEffects: {
    appear: {
      composeEffect() {
        return {
          forwardKeyframesGenerator: () => {
            return [];
          },
        };
      },
    },

    appear_immutable: {
      composeEffect() {
        return {
          forwardKeyframesGenerator: () => {
            return [];
          },
        };
      },
      immutableConfig: {
        duration: 0,
        easing: 'linear',
        composite: 'replace',
      },
    },
  }
});

// select element from DOM
const element = document.querySelector('.some-element');

const ent1 = clipFactories.Entrance(element, 'appear', [], {duration: 1000});
// ↑ no issues

const ent2 = clipFactories.Entrance(element, 'appear_immutable', [], {endDelay: 1000});
// ↑ no issues (there is no immutable setting on endDelay for 'appear_immutable')

/** @ts-ignore */
const ent3 = clipFactories.Entrance(element, 'appear_immutable', [], {duration: 1000});
// ↑ TypeScript compiler error will be thrown because duration is not allowed to be set
// when using the 'appear_immutable' effect. When running the code, this duration will
// simply be ignored in favor of the immutable duration setting.
/**** EX:E id="EffectComposer.immutableConfig" */
}

{
/**** EX:S id="EffectComposer.effectCompositionFrequency" */
// global variable that will be used in the fadeOut_exclusive effect.
let usedFadeOutEx = false;

const clipFactories = webchalk.createAnimationClipFactories({
  customExitEffects: {
    // A custom effect you wrote for fading an element out.
    // Here, it makes no difference what effectCompositionFrequency is set to.
    //
    // - If set to 'on-first-play-only', then composeEffect() will run only once
    // (on the first play()). Thus, forwardKeyframesGenerator() is defined
    // only once and is set to return [{}, {opacity: 0}].
    //
    // - If set to 'on-every-play', then EVERY time the clip
    // plays, composeEffect() plays. Thus, forwardKeyframesGenerator()
    // will keep being redefined and set to be a function that
    // returns [{}, {opacity: 0}]. It made no difference because 
    // the body of forwardKeyframesGenerator() remains the same.
    //
    // Thus, it makes no difference what effectCompositionFrequency is set to.
    // For the sake of optimization, you decide to set it to 'on-first-play-only'
    // (which is the default value anyway, but it adds more clarity).
    fadeOut: {
      composeEffect() {
        return {
          forwardKeyframesGenerator: () => {
            return [{}, {opacity: 0}];
          },
        };
      },
      
      effectCompositionFrequency: 'on-first-play-only',
    },

    // A custom animation effect you made that can only be used by one animation clip
    // (Why you would ever do something this is unclear, but the reason does not matter.)
    // Here, effectCompositionFrequency must be set to 'on-first-play-only'.
    //
    // - If set to 'on-first-play-only', then the global variable usedFadeOutEx is
    // checked for truthiness and then set to true on the first (and only) running of
    // composeEffect(). On subsequent calls to play(), composeEffect() does not re-run, so
    // the if-condition is not run again. However, any OTHER clip that uses the fadeOut_exclusive
    // effect will fail on their first play() because they need to run composeEffect() for
    // the first time and will throw the error (because usedFadeOutEx is already set to true).
    // This is the desired behavior.
    //
    // - If set to 'on-every-play', then composeEffect() will run on every play(). Thus,
    // playing the same clip twice will always cause an error because it will run into
    // the if-conditional again after usedFadeOutEx is already set to true, which is
    // NOT the desired behavior.
    //
    // The difference is that 'on-first-play-only' causes the if-conditional to run
    // only once, while 'on-every-play' causes it to be encountered a second time.
    fadeOut_exclusive: {
      composeEffect() {
        if (usedFadeOutEx) {
          throw new Error(`Only one clip is allowed to use the 'fadeOut_exclusive' effect.`);
        }
        usedFadeOutEx = true;
  
        return {
          forwardKeyframesGenerator: () => {
            return [ {}, {opacity: 0} ];
          },
        };
      },

      effectCompositionFrequency: 'on-first-play-only',
    },

    // A custom animation effect you made for flying out to the left side of the screen.
    // Here, it makes no difference what effectCompositionFrequency is set to.
    //
    // - If set to 'on-first-play-only', then composeEffect() will run only once. Thus,
    // forwardKeyframesGenerator() is defined only once, and the closure containing
    // computeTranslationStr() will also only be made once. On every play(),
    // forwardKeyframesGenerator() uses computeTranslationStr() to compute
    // the translation, so the translation will always be recomputed.
    // This is the desired behavior.
    //
    // - If set to 'on-every-play', then every time play() is called to play the clip,
    // composeEffect() is called again, creating a new closure containing a function
    // called computeTranslationStr() and returning a new forwardKeyframesGenerator()
    // that uses computeTranslationStr() to compute the translation. It makes no
    // difference since the bodies of computeTranslationStr() and
    // forwardKeyframesGenerator() remain the same, so this is functionally the
    // same as the previous paragraph.
    // This is the desired behavior.
    //
    // Thus, it makes no difference what effectCompositionFrequency is set to.
    // For the sake of optimization, you decide to set it to 'on-first-play-only'.
    flyOutLeft1: {
      composeEffect() {
        const computeTranslationStr = () => {
          // compute distance between right side of element and left side of viewport
          const orthogonalDistance = -(this.domElem.getBoundingClientRect().right);
          // create translation string
          const translationString = `${orthogonalDistance}px 0px`;
          return translationString;
        }
  
        return {
          forwardKeyframesGenerator: () => {
            return [
              {translate: computeTranslationStr()}
            ];
          },
          // backwardKeyframesGenerator could have been omitted, but for ease of
          // visual understanding, they are kept for the flyOut effects
          backwardKeyframesGenerator: () => {
            return [
              {translate: computeTranslationStr()},
              {translate: `0 0`}
            ];
          }
        };
      },
      
      immutableConfig: {
        composite: 'accumulate',
      },

      effectCompositionFrequency: 'on-first-play-only',
    },

    // A custom animation effect for flying out either left or right (random).
    // Here, effectCompositionFrequency must be set to 'on-every-play'.
    //
    // - If set to 'on-first-play-only', then leftOrRight is defined only once. Thus,
    // once the clip plays for the first time, leftOrRight will be permanently set
    // to 'go left' or 'go right' within the closure created by composeEffect(),
    // so the element's direction will not be randomized each time.
    // This is NOT the desired effect.
    //
    // - If set to 'on-every-play', then every time play() is called to play the clip,
    // composeEffect() is called again. The variable leftOrRight is thus recomputed, so
    // the result of computeTranslationStr() will be randomly left or right every time
    // the clip is played.
    // This is the desired behavior.
    //
    // The difference is that 'on-every-play' causes the effect to use a fresh
    // leftOrRight on each play, while 'on-first-play-only' does not.
    flyOutRandom: {
      composeEffect() {
        // 50% change of going left or right
        const leftOrRight = Math.random() < 0.5 ? 'go left' : 'go right';

        const computeTranslationStr = () => {
          // compute distance between right side of element and left side of viewport
          const distGoingLeft = -(this.domElem.getBoundingClientRect().right);
          // compute distance between left side of element and right side of viewport
          const distGoingRight = window.innerWidth - this.domElem.getBoundingClientRect().left;
          // choose distance based on leftOrRight
          const orthogonalDistance = leftOrRight === 'go left' ? distGoingLeft : distGoingRight;
          // create translation string
          const translationString = `${orthogonalDistance}px 0px`;
          return translationString;
        }
  
        return {
          forwardKeyframesGenerator: () => {
            return [
              {translate: computeTranslationStr()}
            ];
          },
          backwardKeyframesGenerator: () => {
            return [
              {translate: computeTranslationStr()},
              {translate: `0 0`}
            ];
          }
        };
      },
      
      immutableConfig: {
        composite: 'accumulate',
      },

      effectCompositionFrequency: 'on-every-play',
    },
  }
});
/**** EX:E id="EffectComposer.effectCompositionFrequency" */
}

{
/**** EX:S id="createCustomEffectComposer" */
// CREATE CUSTOM EFFECT COMPOSERS

const zoomIn = createCustomEffectComposer(
  'Entrance',
  {
    composeEffect(initialScale: number) {
      // return ComposedEffect
      return {
        forwardKeyframesGenerator: () => {
          // return Keyframes (Keyframe[])
          return [
            {scale: initialScale, opacity: 0},
            {}
          ];
        },
      };
    }
  }
);

const fadeIn = createCustomEffectComposer(
  'Entrance',
  {
    composeEffect() {
      return {
        forwardKeyframesGenerator: () => {
          return [{opacity: 0}, {}];
        }
      };
    },
    defaultConfig: { duration: 1000, easing: 'ease-in' },
  }
);

const flyOutLeft = createCustomEffectComposer(
  'Exit',
  {
    composeEffect() {
      const computeTranslationStr = () => {
        const orthogonalDistance = -(this.domElem.getBoundingClientRect().right);
        const translationString = `${orthogonalDistance}px 0px`;
        return translationString;
      }

      // return ComposedEffect
      return {
        forwardKeyframesGenerator: () => {
          // return Keyframes (Keyframe[])
          return [
            {translate: computeTranslationStr()}
          ];
        },
      };
    },
    defaultConfig: {
      duration: 1000,
      easing: "ease-in",
    },
    immutableConfig: {
      composite: 'accumulate',
    },
  }
);

// CREATE CLIP FACTORIES AND PASS IN CUSTOM EFFECT COMPOSERS
const clipFactories = webchalk.createAnimationClipFactories({
  customEntranceEffects: {
    zoomIn,
    fadeIn,
  },
  customExitEffects: {
    flyOutLeft
  }
});

const square = document.querySelector('.square');

// your custom effects are now part of the presets (along with full Intellisense)
const ent1 = clipFactories.Entrance(square, 'zoomIn', [0.1]);
const ent2 = clipFactories.Entrance(square, 'fadeIn', []);
const ext2 = clipFactories.Exit(square, 'flyOutLeft', []);
/**** EX:E id="createCustomEffectComposer" */
}

{
/**** EX:S id="createCustomEffectComposerBank" */
// CREATE CUSTOM EFFECT COMPOSER BANKS

// bank with 2 effect composers for a "zoomIn" effect and a "fadeIn" effect
const customEntrances = createCustomEffectComposerBank(
  'Entrance',
  {
    zoomIn: {
      composeEffect(initialScale: number) {
        // return ComposedEffect
        return {
          forwardKeyframesGenerator: () => {
            // return Keyframes (Keyframe[])
            return [
              {scale: initialScale, opacity: 0},
              {}
            ];
          },
        };
      }
    },

    fadeIn: {
      composeEffect() {
        return {
          forwardKeyframesGenerator: () => {
            return [{opacity: 0}, {}];
          }
        };
      },
      defaultConfig: { duration: 1000, easing: 'ease-in' },
    }
  }
);

// bank with 1 effect composer for a "flyOutLeft" effect
const customExits = createCustomEffectComposerBank(
  'Exit',
  {
    flyOutLeft: {
      composeEffect() {
        const computeTranslationStr = () => {
          const orthogonalDistance = -(this.domElem.getBoundingClientRect().right);
          const translationString = `${orthogonalDistance}px 0px`;
          return translationString;
        }
  
        // return ComposedEffect
        return {
          forwardKeyframesGenerator: () => {
            // return Keyframes (Keyframe[])
            return [
              {translate: computeTranslationStr()}
            ];
          },
        };
      },
      defaultConfig: {
        duration: 1000,
        easing: "ease-in",
      },
      immutableConfig: {
        composite: 'accumulate',
      },
    }
  }
)

// CREATE CLIP FACTORIES AND PASS IN CUSTOM EFFECT COMPOSER BANKS
const clipFactories = webchalk.createAnimationClipFactories({
  customEntranceEffects: customEntrances,
  customExitEffects: customExits,
});

const square = document.querySelector('.square');

// your custom effects are now part of the presets (along with full Intellisense)
const ent1 = clipFactories.Entrance(square, 'zoomIn', [0.1]);
const ent2 = clipFactories.Entrance(square, 'fadeIn', []);
const ext2 = clipFactories.Exit(square, 'flyOutLeft', []);
/**** EX:E id="createCustomEffectComposerBank" */
}











{
  /**** EX:S id="Transition.~from" */
  const { Transition } = webchalk.createAnimationClipFactories();

  // get element from DOM and set its styles (just to give some explicit values to look at)
  const square = document.querySelector('.square') as HTMLElement;
  square.style.opacity = '0.5';
  square.style.backgroundColor = 'black';
  square.style.width = '200px';

  // A = element, B = effect name, C = effect options, D = configuration (optional)
  
  //                       A       B        C                                                     D
  const clip1 = Transition(square, '~from', [{opacity: '0', backgroundColor: 'red', width: '0'}], {duration: 2000});
  //                       A       B        C                    D
  const clip2 = Transition(square, '~from', [{width: '5000px'}], {duration: 1000});

  (async () => {
    // The square instantly becomes invisible (0 opacity), turns red, and has 0 width. Then over 2 seconds, it
    // transitions back to its state before the transition (0.5 opacity, black background, and 200px width).
    await clip1.play();

    // The square instantly becomes 5000px. Then over 1 second, it transitions back to 200px width.
    await clip2.play();
  })();
  /**** EX:E id="Transition.~from" */
}

{
  /**** EX:S id="Transition.~to" */
  const { Transition } = webchalk.createAnimationClipFactories();

  // get element from DOM and set its styles (just to give some explicit values to look at)
  const square = document.querySelector('.square') as HTMLElement;
  square.style.opacity = '0.5';
  square.style.backgroundColor = 'black';
  square.style.width = '200px';

  // A = element, B = effect name, C = effect options, D = configuration (optional)
  
  //                       A       B      C                                                     D
  const clip1 = Transition(square, '~to', [{opacity: '0', backgroundColor: 'red', width: '0'}], {duration: 2000});
  //                       A       B      C                            D
  const clip2 = Transition(square, '~to', [{opacity: '1', width: '5000px'}], {duration: 1000});
  const clip3 = Transition(square, '~to', [{width: '200px'}], {duration: 0.5, removeInlineStylesOnFinish: true});

  (async () => {
    // Over 2 seconds, the square transitions to having 0 opacity, a red background color, and 0 width.
    await clip1.play();

    // Over 1 second, the square transitions to have 100% opacity and 5000px width.
    await clip2.play();

    // Over 0.5 seconds, the square transitions to having 200px.
    // Because of removeInlineStylesOnFinish, the inline styles related to this clip (i.e., just the width) will be
    // removed from the element in the HTML after the clip finishes. This is reasonable here since the very original
    // width of the square is 200px.
    await clip3.play();
  })();
  /**** EX:E id="Transition.~to" */
}
