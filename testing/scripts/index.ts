import { WebFlik } from 'webflik';
import { WbfkClassTypes } from 'webflik/types'

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
});

{
  const thing: WbfkClassTypes['AnimSequence'] = WebFlik.newSequence();

  const func = function(sequence: WbfkClassTypes['AnimSequence']) {

  }

  func(WebFlik.newSequence())

  const connector = document.querySelector<WbfkClassTypes['WbfkConnector']>('.connector--red');
}

const square = document.querySelector('.square');

const ent = Entrance(square, '~appear', []);

console.log(ent.generateTimePromise === ent.generateTimePromise);

const entrance = Entrance(square, '~fly-in', ['from-bottom'], {duration: 2000, hideNowType: 'display-none'});
const motion = Motion(square, '~translate', [{translate: '200px, 200px'}], {duration: 2000});

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

  const seq = WebFlik.newSequence(
    entrance,
    motion,
  );
  

  motion.addRoadblocks('forward', 'activePhase', '25%', [() => wait(2000)]);
  motion.addRoadblocks('backward', 'activePhase', '50%', [() => wait(2000)]);
  
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

  const timeline = WebFlik.newTimeline({timelineName: 'Basic'}).addSequences(seq);

  timeline.step('forward');
  // timeline.toggleSkipping({forceState: 'on'}).then(() => {
  //   console.log('HEY, EVERYONE!!!');
  // })
})()
