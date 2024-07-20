import { AnimTimeline, WebFlik, AnimSequence } from "webflik";

const {Motion, Entrance} = WebFlik.createAnimationFactories({
  customEntranceEffects: {
    hello: {
      generateKeyframes() {
        return [[]]
      },
      config: {
        
      },
    },
  },
})

const square = document.querySelector('.square');

const ent = Entrance(square, '~appear', []);

const entrance = Entrance(square, '~fade-in', [], {duration: 2000, hideNowType: 'display-none'});
const motion = Motion(square, '~translate', [{translate: '200px, 200px'}], {duration: 2000});

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

  const seq = new AnimSequence(
    entrance,
    motion,
  );

  motion.addRoadblocks('forward', 'activePhase', '25%', [() => wait(2000)]);
  motion.addRoadblocks('backward', 'activePhase', '50%', [() => wait(2000)]);

  // seq.play();
  // await seq.finish().then(() => {
  //   console.log('HELLO WORLD')
  // });

  // seq.rewind();
  // seq.finish().then(() => {
  //   console.log('WE BACK')
  // });

  const timeline = new AnimTimeline().addSequences(seq);

  timeline.step('forward');
  timeline.toggleSkipping({forceState: 'on'}).then(() => {
    console.log('HEY, EVERYONE!!!');
  })
})()
