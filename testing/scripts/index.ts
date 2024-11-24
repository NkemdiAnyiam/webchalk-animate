import { webimator } from 'webimator';
import * as WebimatorTypes from 'webimator/types-and-interfaces';
import * as WebimatorErrors from "webimator/error-handling";
import * as WebimatorEasing from "webimator/easing";

console.log(WebimatorTypes.AnimClip);

/* css */`
@keyframes roll-in-blurred-left {
  0% {
    transform: translateX(-1000px) rotate(-720deg);
    filter: blur(50px);
    opacity: 0;
  }
  100% {
    transform: translateX(0) rotate(0deg);
    filter: blur(0);
    opacity: 1;
  }
}

@keyframes hinge {
  0% {
    animation-timing-function: ease-in-out;
  }

  20%,
  60% {
    transform: rotate3d(0, 0, 1, 80deg);
    animation-timing-function: ease-in-out;
  }

  40%,
  80% {
    transform: rotate3d(0, 0, 1, 60deg);
    animation-timing-function: ease-in-out;
    opacity: 1;
  }

  to {
    transform: translate3d(0, 700px, 0);
    opacity: 0;
  }
}
`


const {Motion, Entrance, Emphasis, Exit, ConnectorSetter, ConnectorEntrance, Transition} = webimator.createAnimationClipFactories({
  customEntranceEffects: {
    hello: {
      composeEffect() {
        return {};
      },
      defaultConfig: {
        easing: 'cubic-bezier(0.230, 1.000, 0.320, 1.000)',
      },
    },

    ['roll-in-blurred-left']: {
      composeEffect() {
        return {
          forwardFramesGenerator: () => [
            {
              transform: `translateX(-1000px) rotate(-720deg)`,
              filter: `blur(50px)`,
              opacity: 0,
            },
            {}
          ]
        }
      },
      defaultConfig: {
        easing: 'cubic-bezier(0.230, 1.000, 0.320, 1.000)',
      },
    },

    'fade-in-red': {
      composeEffect() {
        return {
          forwardFramesGenerator: () => [{opacity: 0}, {}],
          forwardRafGenerator: () => () => {
            this.domElem.style.backgroundColor = `rgb(255 ${this.computeTween(255, 0)} ${this.computeTween(255, 0)})`
          }
        }
      }
    }
  },

  customExitEffects: {
    ['hinge']: {
      composeEffect() {
        return {
          forwardFramesGenerator: () => [
            {
                "offset": 0,
                "easing": "ease-in-out",
                "composite": "auto",
                transformOrigin: "top left"
            },
            {
                "offset": 0,
                "easing": "ease",
                "composite": "replace",
                "transform": "none",
                "opacity": "1",
            },
            {
                "offset": 0.2,
                "easing": "ease-in-out",
                "composite": "auto",
                "transform": "rotate3d(0, 0, 1, 80deg)",
            },
            {
                "offset": 0.4,
                "easing": "ease-in-out",
                "composite": "auto",
                "transform": "rotate3d(0, 0, 1, 60deg)",
                "opacity": "1",
            },
            {
                "offset": 0.6,
                "easing": "ease-in-out",
                "composite": "auto",
                "transform": "rotate3d(0, 0, 1, 80deg)",
            },
            {
                "offset": 0.8,
                "easing": "ease-in-out",
                "composite": "auto",
                "transform": "rotate3d(0, 0, 1, 60deg)",
                "opacity": "1",
            },
            {
                "offset": 1,
                "easing": "ease",
                "composite": "auto",
                "transform": "translate3d(0px, 700px, 0px)",
                "opacity": "0",
                transformOrigin: "top left"
            }
          ]
        };
      }
    }
  }
});

{
  const thing: WebimatorTypes.AnimSequence = webimator.newSequence();

  const func = function(sequence: WebimatorTypes.AnimSequence) {

  }

  func(webimator.newSequence())


  const connector = document.querySelector<WebimatorTypes.WebimatorConnectorElement>('.connector--1');
  console.log('is connector (should true): ', connector instanceof WebimatorTypes.WebimatorConnectorElement);

  console.log('is sequence (should true): ', webimator.newSequence() instanceof WebimatorTypes.AnimSequence);
}

const square = document.querySelector('.square');

const ent = Entrance(square, '~appear', []);

// console.log(ent.generateTimePromise === ent.generateTimePromise);

const entrance: WebimatorTypes.EntranceClip = Entrance(square, '~fly-in', ['from-bottom'], {duration: 1000, hideNowType: 'display-none'});
const motion = Motion(square, '~translate', [{translate: '200px 200px'}], {duration: 1000, easing: 'bounce-out'});
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

  const seq = webimator.newSequence(
    entrance,
    // Transition(square, '~from', [{opacity: '0', backgroundColor: 'red', width: '0'}], {duration: 2000}),
    // Transition(square, '~to', [{width: '20rem'}], {}),
    // Transition(square, '~to', [{width: '10rem'}], {removeInlineStylesOnFinish: true}),
    motion,
    Emphasis(square, '~highlight', [], {}),
    Emphasis(square, '~un-highlight', [], {}),
    Emphasis(square, '~highlight', ['purple'], {}),
    Emphasis(square, '~un-highlight', [], {}),
    ConnectorSetter(document.querySelector('.connector--2'), [square, 'left', 'top'], [square, 'right', 'bottom']),
    ConnectorEntrance(document.querySelector('.connector--2'), '~trace', ['from-A']),
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

  const timeline = webimator.newTimeline({timelineName: 'Basic', autoLinksButtons: false, debugMode: true});
  timeline.linkPlaybackButtons();
  // await wait(1000);
  timeline.addSequences(seq);
  // await timeline.step('forward');
  // await timeline.step('backward');
  // timeline.removeSequences(seq);
  // timeline.addSequences(seq);

  // setTimeout(() => seq.removeClips(entrance), 3000);

  // timeline.step('forward');
  // timeline.toggleSkipping({forceState: 'on'}).then(() => {
  //   console.log('HEY, EVERYONE!!!');
  // })
})()
