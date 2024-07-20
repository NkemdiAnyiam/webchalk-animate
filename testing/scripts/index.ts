import { AnimTimeline, WebFlik } from "webflik";

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
  await wait(1000);
  motion.play();
  await wait(500);
  motion.pause();
  await wait(500);
  motion.finish();
  await wait(500);
  console.log(motion.getStatus().paused);
  motion.unpause();
  motion.finish();
  console.log(motion.getStatus().paused);
})()
