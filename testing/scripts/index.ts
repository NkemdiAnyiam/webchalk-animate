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

const motion = Motion(square, '~translate', [{translate: '200px, 200px'}], {});

motion.finish();
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

wait(1000).then(() => {
  motion.finish();

  wait(1000).then(() => {
    motion.rewind().then(() => {
      wait(1000).then(() => {
        motion.rewind();
        motion.finish();
      })
    });
  })
})
