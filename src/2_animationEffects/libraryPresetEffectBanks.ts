import {
  EntranceClip,
  ExitClip,
  EmphasisClip,
  MotionClip,
  TransitionClip,
  ScrollerClip,
  ConnectorEntranceClip,
  ConnectorExitClip,
} from "../1_playbackStructures/AnimationClipCategories";
import { webimator } from "../Webimator";
import { EffectGeneratorBank } from "./generationTypes";
import { computeSelfScrollingBounds, negateNumString, overrideHidden, splitXYAlignmentString, splitXYTupleString, unOverrideHidden } from "../4_utils/helpers";
import { MoveToOptions, TranslateOptions, CssLengthUnit, ScrollingOptions } from "../4_utils/interfaces";
import { useEasing } from "./easing";
import { CustomErrors } from "../4_utils/errors";
export { LibraryPresetEntranceEffects, LibraryPresetConnectorEntranceEffects, LibraryPresetConnectorExitEffects, LibraryPresetMotionEffects, LibraryPresetEmphasisEffects, LibraryPresetExitEffects, LibraryPresetScrollEffects, LibraryPresetTransitionEffects } from "../1_playbackStructures/AnimationClipCategories";

// type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }

type OrthoDirection = 'left' | 'top' | 'right' | 'bottom';
type DiagDirection = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
type Direction = OrthoDirection | DiagDirection;

/*-:**************************************************************************************************************************/
/*-:****************************************        ENTRANCES        *********************************************************/
/*-:**************************************************************************************************************************/
/**
 * @category hidden
 */
export const libPresetEntrances = {
  /** Element appears instantaneously. */
  [`~appear`]: {
    /**
     * 
     * @returns 
     */
    generateKeyframes() {
      return {forwardFrames: []} as const;
    },
    defaultConfig: {

    } as const,
    immutableConfig: {
      duration: 0,
    } as const,
  },

  /** Element fades in, starting from 0 opacity. */
  [`~fade-in`]: {
    /**
     * 
     * @returns 
     */
    generateKeyframes() {
      return {
        forwardFrames: [ {opacity: '0'}, {} ]
      } as const;
    },
    defaultConfig: {},
    immutableConfig: {},
  },

  /**
   * Element flies in from offscreen from the specified direction.
   */
  [`~fly-in`]: {
    /**
     * 
     * @param direction - direction from which the element should enter
     * @returns 
     */
    generateKeyframeGenerators(direction: `from-${Direction}` = 'from-bottom') {
      const computeOrthoDist = (dir: `from-${OrthoDirection}`) => {
        const {left, right, top, bottom} = this.domElem.getBoundingClientRect();
        switch(dir) {
          case "from-left": return -right;
          case "from-right": return window.innerWidth - left;
          case "from-top": return -bottom;
          case "from-bottom": return window.innerHeight - top;
        }
      };

      const computeTranslationStr = () => {
        switch(direction) {
          case 'from-left': return `${computeOrthoDist('from-left')}px 0`;
          case 'from-right': return `${computeOrthoDist('from-right')}px 0`;
          case 'from-top': return `0 ${computeOrthoDist('from-top')}px`;
          case 'from-bottom': return `0 ${computeOrthoDist('from-bottom')}px`;
          case 'from-top-left': return `${computeOrthoDist('from-left')}px ${computeOrthoDist('from-top')}px`;
          case 'from-top-right': return `${computeOrthoDist('from-right')}px ${computeOrthoDist('from-top')}px`;
          case 'from-bottom-left': return `${computeOrthoDist('from-left')}px ${computeOrthoDist('from-bottom')}px`;
          case 'from-bottom-right': return `${computeOrthoDist('from-right')}px ${computeOrthoDist('from-bottom')}px`;
          default: throw new RangeError(`Invalid fromDirection "${direction}". Must be "from-left", "from-right", "from-top",`
            + ` "from-bottom", "from-top-left", "from-top-right", "from-bottom-left", or "from-bottom-right".`);
        }
      };

      return {
        forwardGenerator: () => [ {translate: computeTranslationStr()}, {translate: `0 0`} ],
        // backwardGenerator () => [ {translate: computeTranslationStr()} ]
      };
    },
    defaultConfig: {
      runGeneratorsNow: false,
      composite: 'accumulate',
    } as const,
    immutableConfig: {},
  },

  /**
   * Element spins and zooms into view while fading in.
   */
  [`~pinwheel`]: {
    /**
     * 
     * @param numSpins - number of times the element will spin
     * @param direction - direction of the rotation
     * @returns 
     */
    generateKeyframes(numSpins: number = 2, direction: 'clockwise' | 'counterclockwise' = 'counterclockwise') {
      return {
        forwardFrames: [
          {
            rotate: `z ${360 * numSpins * (direction === 'clockwise' ? -1 : 1)}deg`,
            scale: 0,
            opacity: 0,
          },
          {},
        ]
      } as const;
    },
    defaultConfig: {},
    immutableConfig: {},
  },

  /**
   * Element flies in from the bottom of the screen and ends up
   * slightly too high, then settles down to its final position.
   */
  [`~rise-up`]: {
    /**
     * 
     * @returns 
     */
    generateKeyframeGenerators() {
      return {
        forwardGenerator: () => [
          {translate: `0 ${window.innerHeight - this.domElem.getBoundingClientRect().top}px`, opacity: 0, easing: useEasing('power2-out')},
          {translate: `0 -25px`, offset: 0.83333},
          {translate: `0 -25px`, offset: 0.86, easing: useEasing('power1-in')},
          {translate: `0 0`},
        ],
      };
    },
    defaultConfig: {
      composite: 'accumulate',
    } as const,
    immutableConfig: {},
  },

  /**
   * Element is wiped on, starting from the specified direction.
   */
  [`~wipe`]: {
    /**
     * 
     * @param direction - direction from which to begin the wipe
     * @returns 
     */
    generateKeyframes(direction: 'from-bottom' | 'from-left' | 'from-top' | 'from-right' = 'from-bottom') {
      switch(direction) {
        case 'from-bottom':
          return {
            forwardFrames: [
              {clipPath: 'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)'},
              {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
            ]
          };

        case 'from-left':
          return {
            forwardFrames: [
              {clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)'},
              {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
            ]
          };

        case 'from-top':
          return {
            forwardFrames: [
              {clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)'},
              {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
            ]
          };

        case 'from-right':
          return {
            forwardFrames: [
              {clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)'},
              {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
            ]
          };

        default:
          throw new RangeError(`Invalid direction "${direction}". Must be "from-top", "from-right", "from-bottom", or "from-left"`);
      }
    },
    defaultConfig: {},
    immutableConfig: {},
  },

  // invalidProperty: 5,
} satisfies EffectGeneratorBank<EntranceClip>;

/*-:**************************************************************************************************************************/
/*-:******************************************        EXITS        ***********************************************************/
/*-:**************************************************************************************************************************/
/**
 * @category hidden
 */
export const libPresetExits = {
  /** Element disappears instantaneously. */
  [`~disappear`]: {
    /**
     * 
     * @returns 
     */
    generateKeyframes() {
      return {forwardFrames: []} as const;
    },
    defaultConfig: {},
    immutableConfig: {
      duration: 0,
    } as const,
  },

  /** Element fades out to 0 opacity. */
  [`~fade-out`]: {
    /**
     * 
     * @returns 
     */
    generateKeyframes() {
      return {
        forwardFrames: [{}, {opacity: '0'}]
      } as const;
    },
    defaultConfig: {},
    immutableConfig: {},
  },

  /** Element flies offscreen towards the specified direction */
  [`~fly-out`]: {
    /**
     * 
     * @param direction - direction to which the element should exit
     * @returns 
     */
    generateKeyframeGenerators(direction: `to-${OrthoDirection | DiagDirection}` = 'to-bottom') {
      const computeOrthoDist = (dir: `to-${OrthoDirection}`) => {
        const {left, right, top, bottom} = this.domElem.getBoundingClientRect();
        switch(dir) {
          case "to-left": return -right;
          case "to-right": return window.innerWidth - left;
          case "to-top": return -bottom;
          case "to-bottom": return window.innerHeight - top;
        }
      };

      const computeTranslationStr = () => {
        switch(direction) {
          case 'to-left': return `${computeOrthoDist('to-left')}px 0`;
          case 'to-right': return `${computeOrthoDist('to-right')}px 0`;
          case 'to-top': return `0 ${computeOrthoDist('to-top')}px`;
          case 'to-bottom': return `0 ${computeOrthoDist('to-bottom')}px`;
          case 'to-top-left': return `${computeOrthoDist('to-left')}px ${computeOrthoDist('to-top')}px`;
          case 'to-top-right': return `${computeOrthoDist('to-right')}px ${computeOrthoDist('to-top')}px`;
          case 'to-bottom-left': return `${computeOrthoDist('to-left')}px ${computeOrthoDist('to-bottom')}px`;
          case 'to-bottom-right': return `${computeOrthoDist('to-right')}px ${computeOrthoDist('to-bottom')}px`;
          default: throw new RangeError(`Invalid fromDirection "${direction}". Must be "to-left", "to-right", "to-top", "to-bottom", "to-top-left", "to-top-right", "to-bottom-left", or "to-bottom-right".`);
        }
      };

      return {
        forwardGenerator: () => [ {translate: computeTranslationStr()} ],
        // backwardGenerator: () => [ {translate: computeTranslationStr()}, {translate: `0 0`} ]
      };
    },
    defaultConfig: {
      runGeneratorsNow: false,
      composite: 'accumulate',
    } as const,
    immutableConfig: {},
  },

  /** Element spins and shrinks while fading out. */
  [`~pinwheel`]: {
    /**
     * 
     * @param numSpins - number of times the element will spin
     * @param direction - direction of the spin
     * @returns 
     */
    generateKeyframes(numSpins: number = 2, direction: 'clockwise' | 'counterclockwise' = 'clockwise') {
      return {
        forwardFrames: [
          {},
          {
            rotate: `z ${360 * numSpins * (direction === 'clockwise' ? 1 : -1)}deg`,
            scale: 0,
            opacity: 0,
          },
        ]
      } as const;
    },
     defaultConfig: {},
     immutableConfig: {},
  },

  /**
   * Element floats up slightly and then accelerates to the bottom of the screen.
   */
  [`~sink-down`]: {
    /**
     * 
     * @returns 
     */
    generateKeyframeGenerators() {
      return {
        forwardGenerator: () => [
          {translate: `0 0`, easing: useEasing('power1-out')},
          {translate: `0 -25px`, offset: 0.14 },
          {translate: `0 -25px`, easing: useEasing('power2-in'), offset: 0.16666666},
          {translate: `0 ${window.innerHeight - this.domElem.getBoundingClientRect().top}px`, opacity: 0},
        ],
      };
    },
    defaultConfig: {
      composite: 'accumulate',
    } as const,
    immutableConfig: {},
  },
  
  /** Element is wiped off, starting from the specified direction. */
  [`~wipe`]: {
    /**
     * 
     * @param direction 
     * @returns 
     */
    generateKeyframes(direction: 'from-bottom' | 'from-left' | 'from-top' | 'from-right' = 'from-bottom') {
      switch(direction) {
        case 'from-bottom':
          return {
            forwardFrames: [
              {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
              {clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)'},
            ]
          };

        case 'from-left':
          return {
            forwardFrames: [
              {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
              {clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)'},
            ]
          };

        case 'from-top':
          return {
            forwardFrames: [
              {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
              {clipPath: 'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)'},
            ]
          };

        case 'from-right':
          return {
            forwardFrames: [
              {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
              {clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)'},
            ]
          };

        default:
          throw new RangeError(`Invalid direction "${direction}". Must be "from-top", "from-right", "from-bottom", or "from-left"`);
      }
    },
    defaultConfig: {},
    immutableConfig: {},
  },
} satisfies EffectGeneratorBank<ExitClip>;

/*-:**************************************************************************************************************************/
/*-:*****************************************        EMPHASES        *********************************************************/
/*-:**************************************************************************************************************************/
/**
 * @category hidden
 */
export const libPresetEmphases = {
  /**
   * Element is highlighted in the specified color.
   */
  [`~highlight`]: {
    /**
     * 
     * @param color - color to use for the highlight
     * @returns 
     */
    generateKeyframeGenerators(color: string = 'default') {
      // this.domElem.style.setProperty(`--wbmtr-highlight-color`, 'red');
      // let prevVal = '';
      // if (this.domElem.getAttribute('style')?.includes('--wbmtr-highlight-color')) {
      //   prevVal = getComputedStyle(this.domElem).getPropertyValue('--wbmtr-highlight-color');
      // };

      // TODO: Prevent highlighting an element that is already highlighted
      // get the previous highlight color of the element (if none, it naturally uses the value from :root)
      const prevColor = getComputedStyle(this.domElem).getPropertyValue('--wbmtr-highlight-color');
      // if color is 'default', use :root's highlight color
      const finalColor = color === 'default'
        ? getComputedStyle(document.documentElement).getPropertyValue('--wbmtr-highlight-color')
        : color;
      return {
        forwardGenerator: () => [
          {['--wbmtr-highlight-color']: prevColor, easing: 'step-start'}, // step-start -> steps(1, jump-start)
          {backgroundPositionX: '100%', offset: 0},
          {backgroundPositionX: '0%', offset: 1},
          {['--wbmtr-highlight-color']: finalColor}
        ],
        backwardGenerator: () => [
          {['--wbmtr-highlight-color']: finalColor, easing: 'step-end'}, // step-end -> steps(1, jump-end)
          {backgroundPositionX: '0%', offset: 0},
          {backgroundPositionX: '100%', offset: 1},
          {['--wbmtr-highlight-color']: prevColor}
        ]};
    },
    defaultConfig: {
      cssClasses: { toAddOnStart: [`wbmtr-highlightable`] },
      // invalidProp: 4,
    } as const,
    immutableConfig: {},
  },

  /** Element is unhighlighted. */
  [`~un-highlight`]: {
    /**
     * 
     * @returns 
     */
    generateKeyframes() {
      if (!this.domElem.classList.contains(`wbmtr-highlightable`)) {
        throw new CustomErrors.InvalidEffectError(`Cannot un-highlight an element that was not already highlighted.`);
      }
      return {
        forwardFrames: [ {backgroundPositionX: '0%'}, {backgroundPositionX: '100%'}],
      } as const;
    },
    defaultConfig: {
      cssClasses: { toRemoveOnFinish: [`wbmtr-highlightable`] },
    } as const,
    immutableConfig: {},
  },
} satisfies EffectGeneratorBank<EmphasisClip>;

/*-:**************************************************************************************************************************/
/*-:*****************************************        MOTIONS        **********************************************************/
/*-:**************************************************************************************************************************/
/**
 * @category hidden
 */
export const libPresetMotions = {
  /** Element is moved with respect to another element. */
  ['~move-to']: {
    /**
     * 
     * @param targetElem - element to which our element should move
     * @param translationOptions - options defining the behavior of the motion
     * @returns 
     */
    generateKeyframes(targetElem: Element | null | undefined, translationOptions: Partial<MoveToOptions> = {}) {
      if (!targetElem) {
        throw new TypeError(`Target for ~move-to must not be null`);
      }

      const alignmentComponents = splitXYAlignmentString(translationOptions.alignment);
      const selfOffsetComponents = splitXYTupleString(translationOptions.selfOffset);
      const targetOffsetComponents = splitXYTupleString(translationOptions.targetOffset);

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
      // TODO: Make available to developers a way to forcefully get the bounding rect
      overrideHidden(this.domElem, targetElem);
      const rectSelf = this.domElem.getBoundingClientRect();
      const rectTarget = targetElem.getBoundingClientRect();
      unOverrideHidden(this.domElem, targetElem);

      // the displacement will start as the difference between the target element's position and our element's position
      const baseXTrans: number = alignmentX === 'center'
        ? ((rectTarget.left + rectTarget.width/2) - (rectSelf.left + rectSelf.width/2))
        : (preserveX ? 0 : rectTarget[alignmentX] - rectSelf[alignmentX]);
      const baseYTrans: number = alignmentY === 'center'
        ? ((rectTarget.top + rectTarget.height/2) - (rectSelf.top + rectSelf.height/2))
        : (preserveY ? 0 : rectTarget[alignmentY] - rectSelf[alignmentY]);

      // there may also be additional offset with respect to the target element
      let targetOffsetXTrans = targetOffsetX;
      let targetOffsetYTrans = targetOffsetY;
      if (typeof targetOffsetX === 'string') {
        const match = targetOffsetX.match(/(-?\d+(?:\.\d*)?)(\D+)/);
        if (!match) { throw new RangeError(`Invalid targetOffsetX value ${targetOffsetX}`); }
        const num = Number(match[1]);
        const unit = match[2] as CssLengthUnit;
        if (unit === '%') { targetOffsetXTrans = `${(num/100) * rectTarget.width}px`; }
      }
      if (typeof targetOffsetY === 'string') {
        const match = targetOffsetY.match(/(-?\d+(?:\.\d*)?)(\D+)/);
        if (!match) { throw new RangeError(`Invalid targetOffsetY value ${targetOffsetY}`); }
        const num = Number(match[1]);
        const unit = match[2] as CssLengthUnit;
        if (unit === '%') { targetOffsetYTrans = `${(num/100) * rectTarget.height}px`; }
      }
      
      return {
        forwardFrames: [
          {translate: `calc(${baseXTrans}px + ${selfOffsetX} + ${targetOffsetXTrans}) calc(${baseYTrans}px + ${selfOffsetY} + ${targetOffsetYTrans})`}
        ],
        backwardFrames: [
          {translate: `calc(${-baseXTrans}px + ${negateNumString(selfOffsetX)} + ${negateNumString(targetOffsetXTrans)}) calc(${-baseYTrans}px + ${negateNumString(selfOffsetY)} + ${negateNumString(targetOffsetYTrans)})`}
        ],
      };
    },
    defaultConfig: {},
    immutableConfig: {},
  },

  /** Element moves based on the specified translation options. */
  ['~translate']: {
    /**
     * 
     * @param translationOptions - options defining the behavior of the motion
     * @returns 
     */
    generateKeyframes(translationOptions: Partial<TranslateOptions> = {}) {
      const translationComponents = splitXYTupleString(translationOptions.translate);
      const selfOffsetComponents =  splitXYTupleString(translationOptions.selfOffset);

      const translateX = translationComponents?.[0] ?? '0px';
      const translateY = translationComponents?.[1] ?? '0px';
      const selfOffsetX = selfOffsetComponents?.[0] ?? '0px';
      const selfOffsetY = selfOffsetComponents?.[1] ?? '0px';
      
      return {
        forwardFrames: [{translate: `calc(${translateX} + ${selfOffsetX}) calc(${translateY} + ${selfOffsetY})`}],
        backwardFrames: [{translate: `calc(${negateNumString(translateX)} + ${negateNumString(selfOffsetX)})`
                            + ` calc(${negateNumString(translateY)} + ${negateNumString(selfOffsetY)})`}],
      };
    },
    defaultConfig: {},
    immutableConfig: {},
  },
} satisfies EffectGeneratorBank<MotionClip>;

/*-:**************************************************************************************************************************/
/*-:***************************************        TRANSITIONS        ********************************************************/
/*-:**************************************************************************************************************************/
/**
 * @category hidden
 */
export const libPresetTransitions = {
  /** Element transitions from the specified keyframe to its current state.  */
  ['~from']: {
    /**
     * 
     * @param keyframe 
     * @returns 
     */
    generateKeyframes(keyframe: Keyframe) {
      return {
        forwardFrames: [{...keyframe}, {}]
      };
    },
    defaultConfig: {
      commitsStyles: false,
    } as const,
    immutableConfig: {},
  },

  /** Element transitions from its current state to the specified keyframe. */
  ['~to']: {
    /**
     * 
     * @param keyframe 
     * @returns 
     */
    generateKeyframes(keyframe: Keyframe) {
      const computedStyles = getComputedStyle(this.domElem);
      const original = Object.keys(keyframe).reduce((acc, key) => {
        // when longhand properties are set in CSS (like border-right), the corresponding shorthand property is NOT set in the
        // CSSStyleDeclaration (i.e., getComputedStyle()), so we cannot rely on shorthand when we want to transition back to
        // the original style. So if key is some applicable shorthand, we must convert to longhand to store as the original.
        let longhandKeys: (keyof CSSStyleDeclaration)[] = [];
        switch(key) {
          case 'border':
          case 'margin':
          case 'padding':
            longhandKeys = [`${key}Top`, `${key}Right`, `${key}Bottom`, `${key}Left`];
            break;
          case 'borderRadius':
            longhandKeys = [`borderTopLeftRadius`, `borderTopRightRadius`, `borderBottomRightRadius`, `borderBottomLeftRadius`];
            break;
          // TODO: Check to see if inset needs to be handled as well
          // if the key is already longhand (such as opacity), key will be the only entry
          default:
            longhandKeys = [key as keyof CSSStyleDeclaration];
        }
        
        return {...acc, ...longhandKeys.reduce((acc, key) => {return {...acc, [key]: computedStyles[key]}}, {})};
      }, {});
      return {
        forwardFrames: [original, {...keyframe}]
      };
    },
    defaultConfig: {},
    immutableConfig: {},
  },
} satisfies EffectGeneratorBank<TransitionClip>;

/*-:**************************************************************************************************************************/
/*-:***********************************        CONNECTOR ENTRANCES      ******************************************************/
/*-:**************************************************************************************************************************/
/**
 * @category hidden
 */
export const libPresetConnectorEntrances = {
  /** Connector appears instantaneously. */
  [`~appear`]: {
    /**
     * 
     * @returns 
     */
    generateKeyframes() {
      return {forwardFrames: []} as const;
    },
    defaultConfig: {} as const,
    immutableConfig: {
      duration: 0,
    } as const,
  },

  /** Connector fades in, starting from 0 opacity. */
  [`~fade-in`]: {
    /**
     * 
     * @returns 
     */
    generateKeyframes() {
      return {
        forwardFrames: [ {opacity: '0'}, {}],
      } as const;
    },
    defaultConfig: {},
    immutableConfig: {},
  },

  // TODO: Fix new bugs surrounding animating custom variables
  /** Connector is wiped on from the specified direction as if being drawn. */
  [`~trace`]: {
    /**
     * 
     * @param direction - direction from which the connector should be traced
     * @returns 
     */
    generateKeyframes(direction: 'from-A' | 'from-B' | 'from-top' | 'from-bottom' | 'from-left' | 'from-right' = 'from-A') {
      // using CSS variables to control marker-end or marker-start opacity with easing step-end
      // makes it possible to instantly hide a marker and re-reveal it at the end
      const fromAFrames = [
        {['--b-marker-opacity']: 0, easing: 'step-end'},
        {strokeDashoffset: 1, offset: 0},
        {strokeDashoffset: 0, offset: 1},
        {['--b-marker-opacity']: 1},
      ];

      const fromBFrames = [
        {['--a-marker-opacity']: 0, easing: 'step-end'},
        {strokeDashoffset: -1, offset: 0},
        {strokeDashoffset: 0, offset: 1},
        {['--a-marker-opacity']: 1},
      ];

      switch(direction) {
        case 'from-A':
          return {forwardFrames: fromAFrames};

        case 'from-B':
          return {forwardFrames: fromBFrames};

        case 'from-top':
          return {forwardFrames: this.domElem.ay <= this.domElem.by ? fromAFrames : fromBFrames};

        case 'from-bottom':
          return {forwardFrames: this.domElem.ay >= this.domElem.by ? fromAFrames : fromBFrames};

        case 'from-left':
          return {forwardFrames: this.domElem.ax <= this.domElem.bx ? fromAFrames : fromBFrames};

        case 'from-right':
          return {forwardFrames: this.domElem.ax >= this.domElem.bx ? fromAFrames : fromBFrames};

        default:
          throw new RangeError(`Invalid direction "${direction}". Must be "from-A", "from-B", "from-top", "from-bottom", "from-left", or "from-right"`);
      }
    },
    defaultConfig: {},
    immutableConfig: {},
  },
} satisfies EffectGeneratorBank<ConnectorEntranceClip>;

/*-:**************************************************************************************************************************/
/*-:*************************************        CONNECTOR EXITS        ******************************************************/
/*-:**************************************************************************************************************************/
/**
 * @category hidden
 */
export const libPresetConnectorExits = {
  /** Connector disappears instantaneously. */
  [`~disappear`]: {
    /**
     * 
     * @returns 
     */
    generateKeyframes() {
      return {forwardFrames: []} as const;
    },
    defaultConfig: {} as const,
    immutableConfig: {
      duration: 0,
    } as const,
  },

  /** Connector fades out to 0 opacity. */
  [`~fade-out`]: {
    /**
     * 
     * @returns 
     */
    generateKeyframes() {
      return {
        forwardFrames: [ {}, {opacity: '0'} ],
      } as const;
    },
    defaultConfig: {},
    immutableConfig: {},
  },

  /** Connector is wiped off from the specified direction as if being erased. */
  [`~trace`]: {
    /**
     * 
     * @param direction - direction from which the connector should be traced
     * @returns 
     */
    generateKeyframes(direction: 'from-A' | 'from-B' | 'from-top' | 'from-bottom' | 'from-left' | 'from-right' = 'from-A') {
      const fromStartFrames = [
        {['--a-marker-opacity']: 1, easing: 'step-start'},
        {strokeDashoffset: 0, offset: 0},
        {strokeDashoffset: -1, offset: 1},
        {['--a-marker-opacity']: 0},
      ];

      const fromEndFrames = [
        {['--b-marker-opacity']: 1, easing: 'step-start'},
        {strokeDashoffset: 0, offset: 0},
        {strokeDashoffset: 1, offset: 1},
        {['--b-marker-opacity']: 0},
      ];

      switch(direction) {
        case 'from-A':
          return {forwardFrames: fromStartFrames};

        case 'from-B':
          return {forwardFrames: fromEndFrames};

        case 'from-top':
          return {forwardFrames: this.domElem.ay <= this.domElem.by ? fromStartFrames : fromEndFrames};

        case 'from-bottom':
          return {forwardFrames: this.domElem.ay >= this.domElem.by ? fromStartFrames : fromEndFrames};

        case 'from-left':
          return {forwardFrames: this.domElem.ax <= this.domElem.bx ? fromStartFrames : fromEndFrames};

        case 'from-right':
          return {forwardFrames: this.domElem.ax >= this.domElem.bx ? fromStartFrames : fromEndFrames};

        default:
          throw new RangeError(`Invalid direction "${direction}". Must be "from-A", "from-B", "from-top", "from-bottom", "from-left", or "from-right"`);
      }
    },
    defaultConfig: {},
    immutableConfig: {},
  },
} satisfies EffectGeneratorBank<ConnectorExitClip>;

/*-:**************************************************************************************************************************/
/*-:*****************************************        SCROLLS        **********************************************************/
/*-:**************************************************************************************************************************/
/**
 * @category hidden
 */
export const libPresetScrolls = {
  // [`~scroll-self`]: {
  //   generateRafMutators(target: Element | null | undefined, scrollOptions: Partial<ScrollingOptions> = {}) {
  //     if (!target) { throw new TypeError(`Target for ~scroll-self must not be null`); }
  //     const {
  //       preserveX = false,
  //       preserveY = false,
  //     } = scrollOptions;

  //     const {
  //       fromXY: [x_from, y_from],
  //       toXY: [x_to, y_to]
  //     } = computeSelfScrollingBounds(this.domElem, target, scrollOptions);

  //     const forwardMutator = () => {
  //       this.domElem.scrollTo({
  //         /* @ts-ignore */
  //         behavior: "instant",
  //         ...(!preserveX ? {left: this.computeTween(x_from, x_to)} : {}),
  //         ...(!preserveY ? {top: this.computeTween(y_from, y_to)} : {}),
  //       });
  //     };

  //     const backwardMutator = () => {
  //       this.domElem.scrollTo({
  //         /* @ts-ignore */
  //         behavior: "instant",
  //         ...(!preserveX ? {left: this.computeTween(x_to, x_from)} : {}),
  //         ...(!preserveY ? {top: this.computeTween(y_to, y_from)} : {}),
  //       });
  //     };

  //     return [forwardMutator, backwardMutator];
  //   },
  //   config: {
  //     runGeneratorsNow: false,
  //   }
  // },

  /** Element is scrolled with respect to a child element. */
  [`~scroll-self`]: {
    /**
     * 
     * @param target - child element to which our element should scroll
     * @param scrollOptions - options defining the behavior of the scroll
     * @returns 
     */
    generateRafMutatorGenerators(target: Element | null | undefined, scrollOptions: Partial<ScrollingOptions> = {}) {
      if (!target) { throw new TypeError(`Target for ~scroll-self must not be null`); }
      const {
        preserveX = false,
        preserveY = false,
      } = scrollOptions;

      let [x_from, y_from, x_to, y_to] = [0, 0, 0, 0];

      const forwardGenerator = () => {
        const {
          fromXY,
          toXY
        } = computeSelfScrollingBounds(this.domElem, target, scrollOptions);
        [x_from, y_from] = fromXY;
        [x_to, y_to] = toXY;
        webimator.scrollAnchorsStack.push([target, scrollOptions]);

        if (getComputedStyle(target).display === 'none') {
          // TODO: improve warning
          console.warn('Tried to scroll to invisible element');
          return () => {};
        }
        return () => {
          this.domElem.scrollTo({
            /* @ts-ignore */
            behavior: "instant",
            ...(!preserveX ? {left: this.computeTween(x_from, x_to)} : {}),
            ...(!preserveY ? {top: this.computeTween(y_from, y_to)} : {}),
          });
        }
      };

      const backwardGenerator = () => {
        webimator.scrollAnchorsStack.pop();
        if (webimator.scrollAnchorsStack.length > 0) {
          const [anchor, anchorOptions] = webimator.scrollAnchorsStack[webimator.scrollAnchorsStack.length - 1];

          const {
            fromXY: [x_from, y_from],
            toXY: [x_to, y_to]
          } = computeSelfScrollingBounds(this.domElem, anchor, anchorOptions);
  
          return () => {
            this.domElem.scrollTo({
              /* @ts-ignore */
              behavior: "instant",
              ...(!preserveX ? {left: this.computeTween(x_from, x_to)} : {}),
              ...(!preserveY ? {top: this.computeTween(y_from, y_to)} : {}),
            });
          }
        }
        else {
          return () => {
            this.domElem.scrollTo({
              /* @ts-ignore */
              behavior: "instant",
              ...(!preserveX ? {left: this.computeTween(x_to, x_from)} : {}),
              ...(!preserveY ? {top: this.computeTween(y_to, y_from)} : {}),
            });
          }
        }
      };

      return {forwardGenerator, backwardGenerator};
    },
    defaultConfig: {
      runGeneratorsNow: false,
    } as const,
    immutableConfig: {},
  },
} satisfies EffectGeneratorBank<ScrollerClip>;
