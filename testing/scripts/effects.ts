import * as WebchalkTypes from 'webchalk-animate/types';
import * as WebchalkUtils from "webchalk-animate/utility-functions";
import { copyPresetEffectFromBank, definePresetEffectBank, useEasing, webchalkPresetEffectBanks } from "webchalk-animate/preset-effect-suite";

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

const negateNumString = (str: string): string => str[0] === '-' ? str.slice(1) : `-${str}`;

export const customEntrances = definePresetEffectBank(
  'Entrance',
  {
    hello: {
      buildFrameGenerators() {
        return {};
      },
      defaultConfig: {
        easing: 'cubic-bezier(0.230, 1.000, 0.320, 1.000)',
      },
    },

    ['roll-in-blurred-left']: {
      buildFrameGenerators() {
        return {
          keyframesGenerator_play: () => [
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

    '~fly-in': copyPresetEffectFromBank(webchalkPresetEffectBanks.entranceBank, '~fly-in', {
        addedDefaultConfig: {},
        addedImmutableConfig: {
          duration: 1000,
          playbackRate: 1,
          delay: 0,
          endDelay: 0,
          easing: 'linear'
        }
      }
    ),

    'fade-in-red': {
      buildFrameGenerators() {
        return {
          keyframesGenerator_play: () => [{opacity: 0}, {}],
          mutatorGenerator_play: () => () => {
            this.domElem.style.backgroundColor = `rgb(255 ${this.computeTween(255, 0)} ${this.computeTween(255, 0)})`
          }
        }
      }
    },

    /**
     * The element flies in from the bottom of the screen and ends up
     * slightly too high, then settles down to its final position.
     */
    riseUp: {
      /**
       * 
       * @returns 
       */
      buildFrameGenerators() {
        const belowViewportDist = () => window.innerHeight - this.domElem.getBoundingClientRect().top;

        return {
          keyframesGenerator_play: () => [
            {opacity: 0, composite: 'replace'},
            {translate: `0 ${belowViewportDist()}px`, offset: 0, easing: useEasing('power2-out')},
            {translate: `0 -25px`, offset: 0.83333},
            {translate: `0 -25px`, offset: 0.86, easing: useEasing('power1-in')},
            {translate: `0 0`},
          ],
        };
      },
      defaultConfig: {
        composite: 'accumulate',
      } as const,
      immutableConfig: {} as const,
      howOftenBuildGenerators: 'on-first-play-only',
    },
  }
);

export const customExits = definePresetEffectBank(
  'Exit',
  {
    ['hinge']: {
      buildFrameGenerators() {
        return {
          // keyframesPlayedGenerator: () => [],
          // keyframesRewoundGenerator: () => [],
          // mutatorPlayedGenerator: () => () => {},
          // mutatorRewoundGenerator: () => () => {},
          
        };
      },
      defaultConfig: {},
      immutableConfig: {},
    },

    // a custom animation effect for flying out to the left side of the screen
    // while displaying the percentage progress in the element's text content
    flyOutLeft: {
      buildFrameGenerators() {
        const computeTranslationStr = () => {
          const orthogonalDistance = -(this.domElem.getBoundingClientRect().right);
          const translationString = `${orthogonalDistance}px 0px`;
          return translationString;
        }
  
        // return EffectFrameGeneratorSet
        return {
          keyframesGenerator_play: () => {
            // return Keyframes (Keyframe[])
            return [
              {translate: computeTranslationStr()}
            ];
          },

          // not needed
          // keyframesGenerator_rewind: () => {
          //   // return Keyframes (Keyframe[])
          //   return [
          //     {translate: computeTranslationStr()},
          //     {translate: `0 0`}
          //   ];
          // },

          mutatorGenerator_play: () => {
            // return Mutator
            return () => {
              // note that this completely replaces the contents of the element
              this.domElem.textContent = `${this.computeTween(0, 100)}%`;
            };
          },

          // not needed
          // mutatorGenerator_rewind: () => {
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
      buildFrameGenerators() {
        return {
          reverseKeyframesEffect: true,
          keyframesGenerator_play: () => [{opacity: 0}, {}],
          mutatorGenerator_play: () => () => {
            this.domElem.style.backgroundColor = `rgb(255 ${this.computeTween(255, 0)} ${this.computeTween(255, 0)})`
          }
        }
      }
    },

    sinkDown: {
      buildFrameGenerators() {
        const belowViewportDist = () => window.innerHeight - this.domElem.getBoundingClientRect().top;

        // return frame generator set
        return {
          reverseKeyframesEffect: true,
          keyframesGenerator_play: () => {
            // return Keyframes (Keyframe[])
            return [
              {opacity: 0, composite: 'replace'},
              {translate: `0 ${belowViewportDist()}px`, offset: 0, easing: useEasing('power2-out')},
              {translate: `0 -25px`, offset: 0.83333},
              {translate: `0 -25px`, offset: 0.86, easing: useEasing('power1-in')},
              {translate: `0 0`},
            ];
          },
          // It would be a pain to figure out what the backward keyframes should look like 
          // for rewinding this effect. Fortunately, the desired rewinding effect happens to
          // be equivalent to re-using keyframesGenerator_play() and using its reverse,
          // so keyframesGenerator_rewind can be omitted.
          // ---------------------------------------------------------------------------------------
          // keyframesGenerator_rewind: () => {
          //   // return Keyframes (Keyframe[])
          //   return [] // ??????
          // },
        };
      },
      defaultConfig: {
        composite: 'accumulate',
      } as const,
      immutableConfig: {} as const,
      howOftenBuildGenerators: 'on-first-play-only',
    },
  }
);

export const customEmphases = definePresetEffectBank(
  'Emphasis',
  {
    becomeGreen: {
      buildFrameGenerators(partnerEl: Element) {
        const getOrigCol = (elem: Element) => {
          const [, r, g, b] = this.getStyles(elem, 'backgroundColor').match(/rgb\((\d+), (\d+), (\d+)\)/)!.map(numStr => Number(numStr));
          return [r, g, b];
        };
        const [r1, g1, b1] = getOrigCol(this.domElem)
        const [r2, g2, b2] = getOrigCol(partnerEl);

        return {
          mutatorGenerator_play: () => {
            return () => { this.domElem.style.backgroundColor = `rgb(${this.computeTween(r1, 0)} ${this.computeTween(g1, 255)} ${this.computeTween(b1, 0)})`; }
          },
          // mutatorGenerator_rewind: () => {
          //   return () => { this.domElem.style.backgroundColor = `rgb(${this.computeTween(0, 255)} 255 ${this.computeTween(0, 255)})`; }
          // },
          nestedEffectFrameGeneratorSets: [
            {
              domElem: partnerEl as WebchalkTypes.DOMElement,
              mutatorGenerator_play: () => {
                return () => { (partnerEl as WebchalkTypes.DOMElement).style.backgroundColor = `rgb(${this.computeTween(r2, 0)} ${this.computeTween(g2, 255)} ${this.computeTween(b2, 0)})`; }
              }
            }
          ]
        }
      },
      defaultConfig: {},
      howOftenBuildGenerators: 'on-every-play',
    }
  }
);

export const customMotions = definePresetEffectBank(
  'Motion',
  {
    translateRight: {
      buildFrameGenerators(numPixels: number) {
        const createTranslationString = () => {
          if (numPixels <= 0) { throw RangeError(`Number of pixels must exceed 0.`) }
          const translationString = `${numPixels}px`;
          return translationString;
        }
  
        return {
          keyframesGenerator_play: () => {
            return [
              {translate: createTranslationString()}
            ];
          },
          // keyframesGenerator_rewind could have been omitted because the result of running keyframesGenerator_play()
          // again and reversing the keyframes produces the same desired rewinding effect in this case
          keyframesGenerator_rewind: () => {
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
      buildFrameGenerators() {
        const initPos = {...this.getStyles(['translate'])};
        
        return {
          keyframesGenerator_play: () => {
            return [initPos, {translate: '200px 500px'}]
          },
        }
      },
      defaultConfig: {composite: 'replace'}
    },
    
    scrollTo: {
      buildFrameGenerators(yPosition: number) {
        const initialPosition = this.domElem.scrollTop;
  
        // return EffectFrameGeneratorSet
        return {
          // The mutation is to use the scrollTo() method on the element.
          // Thanks to computeTween(), there will be a smooth scroll
          // from initialPosition to yPosition
          mutatorGenerator_play: () => {
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
          // scrolling, size changes, etc.). So we must define mutatorGenerator_rewind()
          // to do exactly that.
          mutatorGenerator_rewind: () => {
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

    swap: {
      buildFrameGenerators(swapEl: Element | null | undefined) {
        if (!swapEl) {
          throw new TypeError(`Swap target must not be null or undefined`);
        }

        function computeTranslation(self: WebchalkTypes.DOMElement, targetElem: WebchalkTypes.DOMElement, translationOptions: Partial<WebchalkTypes.MoveToOptions>) {
          const alignmentComponents = WebchalkUtils.parseXYAlignmentString(translationOptions.alignment);
          const selfOffsetComponents = WebchalkUtils.parseXYTupleString(translationOptions.selfOffset);
          const targetOffsetComponents = WebchalkUtils.parseXYTupleString(translationOptions.targetOffset);

          const alignmentX = alignmentComponents?.[0] ?? 'left';
          const alignmentY = alignmentComponents?.[1] ?? 'top';
          const selfOffsetX = selfOffsetComponents?.[0] ?? '0px';
          const selfOffsetY = selfOffsetComponents?.[1] ?? '0px';
          const targetOffsetX = targetOffsetComponents?.[0] ?? '0px';
          const targetOffsetY = targetOffsetComponents?.[1] ?? '0px';
          const {
            preserveX = false,
            preserveY = false,
          } = translationOptions;
          
          // get the bounding boxes of our DOM element and the target element
          const rectSelf = WebchalkUtils.getBoundingClientRectOfHidden(self);
          const rectTarget = WebchalkUtils.getBoundingClientRectOfHidden(targetElem);

          // the displacement will start as the difference between the target element's position and our element's position
          const baseXTrans: number = alignmentX === 'center'
            ? ((rectTarget.left + rectTarget.width/2) - (rectSelf.left + rectSelf.width/2))
            : (preserveX ? 0 : rectTarget[alignmentX] - rectSelf[alignmentX]);
          const baseYTrans: number = alignmentY === 'middle'
            ? ((rectTarget.top + rectTarget.height/2) - (rectSelf.top + rectSelf.height/2))
            : (preserveY ? 0 : rectTarget[alignmentY] - rectSelf[alignmentY]);

          // there may also be additional offset with respect to the target element
          let targetOffsetXTrans = targetOffsetX;
          let targetOffsetYTrans = targetOffsetY;
          if (typeof targetOffsetX === 'string') {
            const match = targetOffsetX.match(/(-?\d+(?:\.\d*)?)(\D+)/);
            if (!match) { throw new RangeError(`Invalid targetOffsetX value ${targetOffsetX}`); }
            const num = Number(match[1]);
            const unit = match[2] as WebchalkTypes.CssLengthUnit;
            if (unit === '%') { targetOffsetXTrans = `${(num/100) * rectTarget.width}px`; }
          }
          if (typeof targetOffsetY === 'string') {
            const match = targetOffsetY.match(/(-?\d+(?:\.\d*)?)(\D+)/);
            if (!match) { throw new RangeError(`Invalid targetOffsetY value ${targetOffsetY}`); }
            const num = Number(match[1]);
            const unit = match[2] as WebchalkTypes.CssLengthUnit;
            if (unit === '%') { targetOffsetYTrans = `${(num/100) * rectTarget.height}px`; }
          }
          
          return {
            keyframesGenerator_play: () => [
              {translate: `calc(${baseXTrans}px + ${selfOffsetX} + ${targetOffsetXTrans}) calc(${baseYTrans}px + ${selfOffsetY} + ${targetOffsetYTrans})`}
            ],
            keyframesGenerator_rewind: () => [
              {translate: `calc(${-baseXTrans}px + ${negateNumString(selfOffsetX)} + ${negateNumString(targetOffsetXTrans)}) calc(${-baseYTrans}px + ${negateNumString(selfOffsetY)} + ${negateNumString(targetOffsetYTrans)})`}
            ],
          };
        }

        const selfFrameGens = computeTranslation(this.domElem, swapEl as WebchalkTypes.DOMElement, {});
        const partnerFrameGens = computeTranslation(swapEl as WebchalkTypes.DOMElement, this.domElem, {});

        return {
          keyframesGenerator_play: selfFrameGens.keyframesGenerator_play,
          keyframesGenerator_rewind: selfFrameGens.keyframesGenerator_rewind,
          nestedEffectFrameGeneratorSets: [
            {
              domElem: swapEl,
              keyframesGenerator_play: partnerFrameGens.keyframesGenerator_play,
              keyframesGenerator_rewind: partnerFrameGens.keyframesGenerator_rewind,
            }
          ]
        };
      },
      defaultConfig: webchalkPresetEffectBanks.motionBank['~move-to'].defaultConfig,
      immutableConfig: webchalkPresetEffectBanks.motionBank['~move-to'].immutableConfig,
      howOftenBuildGenerators: webchalkPresetEffectBanks.motionBank['~move-to'].howOftenBuildGenerators,
    }
  }
);
