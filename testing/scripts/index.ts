import { webchalk } from 'webchalk-animate';
import * as WebChalkTypes from 'webchalk-animate/types-and-interfaces';
import * as WebChalkErrors from "webchalk-animate/error-handling";
import * as WebChalkEasing from "webchalk-animate/easing";
import * as WebChalkUtils from "webchalk-animate/utility-functions";
import { createCustomEffectComposerBank } from 'webchalk-animate/custom-effect-creation';

console.log(WebChalkTypes.AnimClip);

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
const customEntrances = createCustomEffectComposerBank(
  'Entrance',
  {
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
          forwardKeyframesGenerator: () => [
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
          forwardKeyframesGenerator: () => [{opacity: 0}, {}],
          forwardMutatorGenerator: () => () => {
            this.domElem.style.backgroundColor = `rgb(255 ${this.computeTween(255, 0)} ${this.computeTween(255, 0)})`
          }
        }
      }
    },

    /**
     * Element flies in from the bottom of the screen and ends up
     * slightly too high, then settles down to its final position.
     */
    riseUp: {
      /**
       * 
       * @returns 
       */
      composeEffect() {
        const belowViewportDist = () => window.innerHeight - this.domElem.getBoundingClientRect().top;

        return {
          forwardKeyframesGenerator: () => [
            {opacity: 0, composite: 'replace'},
            {translate: `0 ${belowViewportDist()}px`, offset: 0, easing: WebChalkEasing.useEasing('power2-out')},
            {translate: `0 -25px`, offset: 0.83333},
            {translate: `0 -25px`, offset: 0.86, easing: WebChalkEasing.useEasing('power1-in')},
            {translate: `0 0`},
          ],
        };
      },
      defaultConfig: {
        composite: 'accumulate',
      } as const,
      immutableConfig: {} as const,
      effectCompositionFrequency: 'on-first-play-only',
    },
  }
);

const customExits = createCustomEffectComposerBank(
  'Exit',
  {
    ['hinge']: {
      composeEffect() {
        return {
          forwardKeyframesGenerator: () => [
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
    },

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

          // not needed
          // backwardKeyframesGenerator: () => {
          //   // return Keyframes (Keyframe[])
          //   return [
          //     {translate: computeTranslationStr()},
          //     {translate: `0 0`}
          //   ];
          // },

          forwardMutatorGenerator: () => {
            // return Mutator
            return () => {
              this.domElem.textContent = `${this.computeTween(0, 100)}%`;
            };
          },

          // not needed
          // backwardMutatorGenerator: () => {
          //   // return Mutator
          //   return () => {
          //     this.domElem.textContent = `${this.computeTween(100, 0)}%`;
          //   };
          // },
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
      }
    },

    'fade-out-red': {
      composeEffect() {
        return {
          reverseKeyframesEffect: true,
          forwardKeyframesGenerator: () => [{opacity: 0}, {}],
          forwardMutatorGenerator: () => () => {
            this.domElem.style.backgroundColor = `rgb(255 ${this.computeTween(255, 0)} ${this.computeTween(255, 0)})`
          }
        }
      }
    },

    sinkDown: {
      composeEffect() {
        const belowViewportDist = () => window.innerHeight - this.domElem.getBoundingClientRect().top;

        // return Composed Effect
        return {
          reverseKeyframesEffect: true,
          forwardKeyframesGenerator: () => {
            // return Keyframes (Keyframe[])
            return [
              {opacity: 0, composite: 'replace'},
              {translate: `0 ${belowViewportDist()}px`, offset: 0, easing: WebChalkEasing.useEasing('power2-out')},
              {translate: `0 -25px`, offset: 0.83333},
              {translate: `0 -25px`, offset: 0.86, easing: WebChalkEasing.useEasing('power1-in')},
              {translate: `0 0`},
            ];
          },
          // It would be a pain to figure out what the backward keyframes should look like 
          // for rewinding this effect. Fortunately, the desired rewinding effect happens to
          // be equivalent to re-using forwardKeyframesGenerator() and using its reverse,
          // so backwardKeyframesGenerator can be omitted.
          // ---------------------------------------------------------------------------------------
          // backwardKeyframesGenerator: () => {
          //   // return Keyframes (Keyframe[])
          //   return [] // ??????
          // },
        };
      },
      defaultConfig: {
        composite: 'accumulate',
      } as const,
      immutableConfig: {} as const,
      effectCompositionFrequency: 'on-first-play-only',
    },
  }
);

const customEmphases = createCustomEffectComposerBank(
  'Emphasis',
  {
    becomeGreen: {
      composeEffect() {
        return {
          forwardMutatorGenerator: () => {
            return () => { this.domElem.style.backgroundColor = `rgb(${this.computeTween(255, 0)} 255 ${this.computeTween(255, 0)})` }
          },
        }
      },
      defaultConfig: {},
    }
  }
);

const customMotions = createCustomEffectComposerBank(
  'Motion',
  {
    translateRight: {
      composeEffect(numPixels: number) {
        const createTranslationString = () => {
          if (numPixels <= 0) { throw RangeError(`Number of pixels must exceed 0.`) }
          const translationString = `${numPixels}px`;
          return translationString;
        }
  
        return {
          forwardKeyframesGenerator: () => {
            return [
              {translate: createTranslationString()}
            ];
          },
          // backwardKeyframesGenerator could have been omitted because the result of running forwardKeyframesGenerator()
          // again and reversing the keyframes produces the same desired rewinding effect in this case
          backwardKeyframesGenerator: () => {
            return [
              {translate: '-'+createTranslationString()},
            ];
          }
        };
      },
      
      immutableConfig: {
        // this means that the translation is added onto the element's position instead of replacing it
        composite: 'accumulate',
      }
    },

    translateRel: {
      composeEffect() {
        return {
          forwardKeyframesGenerator: () => {
            return [{...this.getStyles(['translate'])}, {translate: '200px 500px'}]
          },
        }
      },
      defaultConfig: {composite: 'replace'}
    },
    
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
);

const {Motion, Entrance, Emphasis, Exit, ConnectorSetter, ConnectorEntrance, Transition} = webchalk.createAnimationClipFactories({
  customEntranceEffects: customEntrances,
  customExitEffects: customExits,
  customEmphasisEffects: customEmphases,
  customMotionEffects: customMotions
});

{
  const thing: WebChalkTypes.AnimSequence = webchalk.newSequence();

  const func = function(sequence: WebChalkTypes.AnimSequence) {

  }

  func(webchalk.newSequence())


  const connector = document.querySelector<WebChalkTypes.WebChalkConnectorElement>('.connector--1');
  console.log('is connector (should true): ', connector instanceof WebChalkTypes.WebChalkConnectorElement);

  console.log('is sequence (should true): ', webchalk.newSequence() instanceof WebChalkTypes.AnimSequence);
}

const square = document.querySelector('.square');
const circle = document.querySelector('.circle.circle--1');

const ent = Entrance(square, '~appear', []);

// console.log(ent.generateTimePromise === ent.generateTimePromise);

const entrance: WebChalkTypes.EntranceClip = Entrance(square, '~fly-in', ['from-bottom'], {duration: 1000, hideNowType: 'display-none'});
const motion = Motion(square, '~translate', [{translate: '200px 200px'}], {duration: 1000, easing: 'bounce-out'});
// const entrance: WebChalkTypes.EntranceClip = Entrance(square, '~fly-in', ['from-bottom'], {duration: 1000});
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
    entrance,
    // Transition(square, '~from', [{opacity: '0', backgroundColor: 'red', width: '0'}], {duration: 2000}),
    // Transition(square, '~to', [{width: '20rem'}], {}),
    // Transition(square, '~to', [{width: '10rem'}], {removeInlineStylesOnFinish: true}),
    motion,
    Motion(square, '~translate', [{translate: '0 200px'}], {duration: 250}),
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

  const timeline = webchalk.newTimeline({timelineName: 'Basic', autoLinksButtons: false, debugMode: true});
  timeline.linkPlaybackButtons();
  // await wait(1000);
  timeline.addSequences(seq);
  timeline.addSequences(webchalk.newSequence(
    Exit(square, 'fade-out-red', [], {duration: 1000}),
    Entrance(square, 'riseUp', [], {duration: 1000, delay: 500}),
    Exit(square, 'flyOutLeft', [], {duration: 2000}),
    Entrance(square, '~appear', [], {delay: 500})
  ))
  // await timeline.step('forward');
  // await timeline.step('backward');
  // timeline.removeSequences(seq);
  // timeline.addSequences(seq);

  // setTimeout(() => seq.removeClips(entrance), 3000);

  // timeline.step('forward');
  // timeline.toggleSkipping({forceState: 'on'}).then(() => {
  //   console.log('HEY, EVERYONE!!!');
  // })

  timeline.addSequences(webchalk.newSequence(
    Motion(circle, '~translate', [{translate: '900px 0'}], {delay: 500}),
    Motion(circle, 'translateRel', []),
  ));
})();
