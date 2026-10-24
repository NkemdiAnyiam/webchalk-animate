import { webchalk } from 'webchalk-animate';
import * as WebchalkTypes from 'webchalk-animate/types';
import * as WebchalkErrors from "webchalk-animate/error-handling";
import * as WebchalkUtils from "webchalk-animate/utility-functions";
import { definePresetEffectBank, webchalkPresetEffectBanks, useEasing, copyPresetEffectFromBank } from 'webchalk-animate/preset-effect-suite';
import { customEmphases, customEntrances, customExits, customMotions } from './effects';

console.log(WebchalkTypes.AnimClip);

// webchalk.initializeEffectPlayers({
//   additionalEntranceEffectBank:
// });

const {
  Motion,
  Entrance,
  Emphasis,
  Exit,
  ConnectorEntrance,
  TextEditor,
} = webchalk.createAnimationClipFactories({
  additionalEntranceEffectBank: customEntrances,
  additionalExitEffectBank: customExits,
  additionalEmphasisEffectBank: customEmphases,
  additionalMotionEffectBank: customMotions
});

{
  const thing: WebchalkTypes.AnimSequence = webchalk.newSequence();

  const func = function(sequence: WebchalkTypes.AnimSequence) {

  }

  func(webchalk.newSequence())


  const connector = document.querySelector<WebchalkTypes.WebchalkConnectorElement>('.connector--1');
  console.log('is connector (should true): ', connector instanceof WebchalkTypes.WebchalkConnectorElement);

  console.log('is sequence (should true): ', webchalk.newSequence() instanceof WebchalkTypes.AnimSequence);
}

const square = document.querySelector('.square');
const circle1 = document.querySelector('.circle.circle--1');
const circle4 = document.querySelector('.circle.circle--4');

const ent = Entrance(square, '~appear', []);

// console.log(ent.scheduleResolver === ent.scheduleResolver);

const entrance: WebchalkTypes.EntranceClip = Entrance(square, '~fly-in', ['from-bottom'], {hideNowType: 'display-none'});
const motion = Motion(square, '~translate', [{translate: '200px 200px'}], {duration: 1000, easing: 'bounce-out'});
// const entrance: WebchalkTypes.EntranceClip = Entrance(square, '~fly-in', ['from-bottom'], {duration: 1000});
// const motion = Motion(square, 'translateRight', [500], {duration: 1000, easing: 'bounce-out'});
console.log(entrance.getModifiers());
console.log(entrance.getModifiers('hideNowType'));
console.log(entrance.getModifiers(['cssClasses', 'composite']));

entrance.getTiming()
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// wait(1000).then(() => {
//   motion.finish();

//   wait(1000).then(() => {
//     motion.rewind().then(() => {
//       wait(1000).then(() => {
//         motion.rewind();
//         motion.finish();
//       })
//     });
//   })
// })

(async function() {
  // await wait(1000);
  // motion.play();
  // await wait(500);
  // motion.pause();
  // await wait(500);
  // motion.finish();
  // await wait(500);
  // console.log(motion.getStatus().paused);
  // motion.unpause();
  // motion.finish();
  // console.log(motion.getStatus().paused);

  // motion.addRoadblocks('forward', 'activePhase', '25%', [() => wait(2000)]);

  // await motion.finish().then((e) => {
  //   e.getTiming();
  //   e.pause()
  // });
  // console.log('HELLO WORLD')

  const seq = webchalk.newSequence(
    [
      // entrance,
      // Transition(square, '~from', [{opacity: '0', backgroundColor: 'red', width: '0'}], {duration: 2000}),
      // Transition(square, '~to', [{width: '20rem'}], {}),
      // Transition(square, '~to', [{width: '10rem'}], {removeInlineStylesOnFinish: true}),
      motion,
      Motion(square, '~translate', [{translate: '0 200px'}], {duration: 250}),
      Emphasis(square, '~highlight', [], {}),
      Emphasis(square, '~un-highlight', [], {}),
      Emphasis(square, '~highlight', ['purple'], {}),
      Emphasis(square, '~un-highlight', [], {}),
      ConnectorEntrance(document.querySelector('.connector--2'), '~trace', ['from-A'], {
        newPoints: {A: [square, '(left, top)'], B: [square, '(right, bottom)']}
      }),
    ]
  );
  

  // motion.addRoadblocks('forward', 'activePhase', '25%', [() => wait(2000)]);
  // motion.addRoadblocks('backward', 'activePhase', '50%', [() => wait(2000)]);
  
  motion.getStatus().inProgress

  // seq.

  // seq.play();
  // await seq.finish().then(() => {
  //   console.log('HELLO WORLD')
  // });

  // seq.rewind();
  // seq.finish().then(() => {
  //   console.log('WE BACK')
  // });

  const textBox = document.querySelector('.text-box');
  const textBox2 = document.querySelector('.text-box-2');
  const tEdit = TextEditor(textBox, '~delete-text', [], {startsNextClipToo: true, durationOrRate: '500wpm'});
  // tEdit.scheduleTask('activePhase', 'end', {onPlay: () => wait(500), onRewind: () => wait(500)}, {frequencyLimit: 2});
  tEdit.scheduleTask('activePhase', 'beginning', {onPlay: () => {
    tEdit.scheduleTask('activePhase', '50%', {onPlay: () => wait(500), onRewind: () => wait(500)}, {frequencyLimit: 1, description: 'Wait 0.5s both ways.'});
  }}, {frequencyLimit: 2, description: 'Schedule waits halfway through effect.'});
  const tEdit2 = TextEditor(textBox2, '~replace-text', ['What in tarnation was supposed to happen when you did that?'], {startsWithPrevious: true});
  tEdit2.scheduleTask('activePhase', '80%', {onPlay: () => wait(1000), onRewind: () => wait(2000)}, {frequencyLimit: 1, description: 'Pause for 1s.'});

  const timeline = webchalk.newTimeline({timelineName: 'Basic', debugMode: true});
  timeline.ui.attachPlaybackButtons();
  timeline.ui.setKeyboardShortcuts({
    fastForward: 'F', 
    pause: 'Space',
    stepBackward: 'ArrowLeft',
    stepForward: 'ArrowRight',
    toggleSkipping: 'S'
  });
  timeline.ui.attachTimelinePane();
  // await wait(1000);
  const testAdjacency = webchalk.newSequence([
    tEdit,
    tEdit2,
    // TextEditor(textBox, 'delete-text', [], {startsNextClipToo: false}),
    // TextEditor(textBox, 'insert-text', ['This is the new text']),
    Entrance(square, 'riseUp', [], {duration: 1000, startsWithPrevious: true}),
  ]);

  const array = document.querySelector('.array');
  const arrayVal = document.querySelector('.array__value');
  Motion(array, '~move-to', [document.querySelector('body'), {alignment: 'center middle'}], {duration: 0}).play();

  timeline.addSequences(
    [
      // webchalk.newSequence([
      //   TextEditor(arrayVal, 'replace-text', [68])
      // ]),
      testAdjacency,
      seq,

      // webchalk.newSequence([
      //   Motion(circle, '~move-to', [square, {alignment: 'center center'}]),
      //   Motion(square, '~move-to', [circle, {alignment: 'center center'}], {startsWithPrevious: true, delay: 500}),
      // ]),

      webchalk.newSequence([
        Exit(square, 'fade-out-red', [], {duration: 1000}),
        Entrance(square, 'riseUp', [], {duration: 1000, delay: 500}),
        Exit(square, 'flyOutLeft', [], {duration: 2000}),
        Entrance(square, '~appear', [], {delay: 500})
      ]),
    ]
  );
  // await timeline.step('forward');
  // await timeline.step('backward');
  // timeline.removeSequences(seq);
  // timeline.addSequences(seq);

  // setTimeout(() => seq.removeClips(entrance), 3000);

  // timeline.step('forward');
  // timeline.toggleSkipping({forceState: 'on'}).then(() => {
  //   console.log('HEY, EVERYONE!!!');
  // })

  // function dequoteJSON(obj: object) {
  //   return JSON.stringify(obj, null, 2)
  //     .replace(/^[\t ]*"[^:\n\r]+(?<!\\)":/gm, (match) => `${match.replace(/"/g, "")}`);
  // }

  // const str = JSON.stringify(Exit(square, 'fade-out-red', [], {duration: 1000, cssClasses: {toAddOnFinish: ['yo', 'bro']}}).getConfig(), null, 2)

  // console.log(str);
  // console.log(dequoteJSON(Exit(square, 'fade-out-red', [], {duration: 1000, cssClasses: {toAddOnFinish: ['yo', 'bro']}}).getConfig()));

  const motionSwap = Motion(circle1, 'swap', [circle4], {duration: 1000});
  motionSwap.scheduleTask('activePhase', '55%', {onPlay: () => wait(2000), onRewind: () => wait(2000)});

  timeline.addSequences([
    webchalk.newSequence([
      Motion(circle1, '~translate', [{translate: '900px 0'}]),
      Motion(circle1, 'translateRel', []),
      // Emphasis(circle1, 'becomeGreen', [circle4!], {startsNextClipToo: true}),
      motionSwap,
      Motion(circle1, '~translate', [{translate: '200px 0'}]),
    ]),
  ]);
})();
