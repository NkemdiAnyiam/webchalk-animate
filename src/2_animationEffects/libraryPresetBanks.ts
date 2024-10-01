import {
  EntranceClip,          EntranceClipConfig,
  ExitClip,              ExitClipConfig,
  EmphasisClip,          EmphasisClipConfig,
  MotionClip,            MotionClipConfig,
  TransitionClip,        TransitionClipConfig,
  ScrollerClip,          ScrollerClipConfig,
  ConnectorEntranceClip, ConnectorEntranceClipConfig,
  ConnectorExitClip,     ConnectorExitClipConfig,
  Layer3MutableClipConfig,
  // ImmutableLayer2EntranceClipConfig,
} from "../1_playbackStructures/AnimClipCategories";
import { EffectGeneratorBank, webimator } from "../Webimator";
import { computeSelfScrollingBounds, negateNumString, overrideHidden, splitXYAlignmentString, splitXYTupleString, unOverrideHidden } from "../4_utils/helpers";
import { MoveToOptions, TranslateOptions, CssLengthUnit, ScrollingOptions } from "../4_utils/interfaces";
import { useEasing } from "../4_utils/easing";

// type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }

type OrthoDirection = 'left' | 'top' | 'right' | 'bottom';
type DiagDirection = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
type Direction = OrthoDirection | DiagDirection;

/**
 * @ignore
 * @internal
 */
type docsScriptRunner = {
  /**
   * <script>
   *  window.onload = () => {
   *    // remove property sections and navigation links associated with doscScriptRunner
   *    document.querySelector('a#______').closest('.tsd-panel.tsd-member').remove();
   *    [...document.querySelectorAll('a[href$="#______"]')].forEach((elem) => elem.remove());
   * 
   *    // remove interface signature and GitHub source
   *    document.querySelector('.col-content > .tsd-signature').remove();
   *    document.querySelector('.col-content > .tsd-sources').remove();
   * 
   *    // for each member
   *    const members = [...document.querySelectorAll('.tsd-panel.tsd-member')];
   *    for (const member of members) {
   *      // remove member signature
   *      member.querySelector(':scope > .tsd-signature').remove();
   *      // remove signatures of objects returned by generator functions
   *      member.querySelector(':scope h5 + ul.tsd-parameters')?.remove();
   *      const h5List = [...member.querySelectorAll(':scope h5')];
   *      for (const h5 of h5List) { h5.classList.add('custom-color'); }
   *      // remove return title for objects returned by generator functions
   *      member.querySelector('.tsd-returns-title')?.remove();
   *      // remove duplicate list of config objects' properties
   *      member.querySelector(':scope li.tsd-parameter ul.tsd-parameters:has(> li.tsd-parameter > h5')?.remove();
   *    }
   *  }
   * </script>
   */
  ______: any
}

/**
 * 
 * @interface
 */
export type LibraryEntrances = typeof libPresetEntrances & docsScriptRunner;

/**
 * 
 * @interface
 */
export type LibraryExits = typeof libPresetExits & docsScriptRunner;

/**
 * 
 * @interface
 */
export type LibraryEmphases = typeof libPresetEmphases & docsScriptRunner;

/**
 * 
 * @interface
 */
export type LibraryMotions = typeof libPresetMotions & docsScriptRunner;

/**
 * 
 * @interface
 */
export type LibraryConnectorEntrances = typeof libPresetConnectorEntrances & docsScriptRunner;

/**
 * 
 * @interface
 */
export type LibraryConnectorExits = typeof libPresetConnectorExits & docsScriptRunner;

/**
 * 
 * @interface
 */
export type LibraryTransitions = typeof libPresetTransitions & docsScriptRunner;

/**
 * 
 * @interface
 */
export type LibraryScrolls = typeof libPresetScrolls & docsScriptRunner;

/*-:**************************************************************************************************************************/
/*-:****************************************        ENTRANCES        *********************************************************/
/*-:**************************************************************************************************************************/
/**
 * @category hidden
 */
export const libPresetEntrances = {
  /** Makes the element appear instantaneously. */
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
   * Makes thing fly in from offscreen from the specified direction.
   */
  [`~fly-in`]: {
    /**
     * 
     * @param direction - geee
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

  [`~pinwheel`]: {
    /**
     * 
     * @param numSpins 
     * @param direction 
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
} satisfies EffectGeneratorBank<EntranceClip, Layer3MutableClipConfig<EntranceClip>, false>;

/*-:**************************************************************************************************************************/
/*-:******************************************        EXITS        ***********************************************************/
/*-:**************************************************************************************************************************/
/**
 * @category hidden
 */
export const libPresetExits = {
  [`~disappear`]: {
    /**
     * 
     * @returns 
     */
    generateKeyframes() {
      return {forwardFrames: []};
    },
    defaultConfig: {},
    immutableConfig: {
      duration: 0,
    } as const,
  },

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

  [`~fly-out`]: {
    /**
     * 
     * @param direction 
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

  [`~pinwheel`]: {
    /**
     * 
     * @param numSpins 
     * @param direction 
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
} satisfies EffectGeneratorBank<ExitClip, Layer3MutableClipConfig<ExitClip>, false>;

/*-:**************************************************************************************************************************/
/*-:*****************************************        EMPHASES        *********************************************************/
/*-:**************************************************************************************************************************/
/**
 * @category hidden
 */
export const libPresetEmphases = {
  [`~highlight`]: {
    /**
     * Highlights the element.
     * @param color - the color to use for the highlight
     * @returns 
     */
    generateKeyframeGenerators(color: string = 'default') {
      // (this.domElem as HTMLElement).style.setProperty(`--wbmtr-highlight-color`, 'red');
      // let prevVal = '';
      // if ((this.domElem as HTMLElement).getAttribute('style')?.includes('--wbmtr-highlight-color')) {
      //   prevVal = getComputedStyle(this.domElem as HTMLElement).getPropertyValue('--wbmtr-highlight-color');
      // };

      // get the previous highlight color of the element (if none, it naturally uses the value from :root)
      const prevColor = getComputedStyle(this.domElem as HTMLElement).getPropertyValue('--wbmtr-highlight-color');
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

  [`~un-highlight`]: {
    /**
     * 
     * @returns 
     */
    generateKeyframes() {
      return {
        forwardFrames: [ {backgroundPositionX: '0%'}, {backgroundPositionX: '100%'}],
      } as const;
    },
    defaultConfig: {
      cssClasses: { toRemoveOnFinish: [`wbmtr-highlightable`] },
    } as const,
    immutableConfig: {},
  },
} satisfies EffectGeneratorBank<EmphasisClip, Layer3MutableClipConfig<EmphasisClip>, false>;

/*-:**************************************************************************************************************************/
/*-:*****************************************        MOTIONS        **********************************************************/
/*-:**************************************************************************************************************************/
/**
 * @category hidden
 */
export const libPresetMotions = {
  ['~move-to']: {
    /**
     * 
     * @param targetElem 
     * @param translationOptions 
     * @returns 
     */
    generateKeyframes(targetElem: Element | null | undefined, translationOptions: Partial<MoveToOptions> = {}) {
      if (!targetElem) {
        throw new TypeError(`Target for ~move-to must not be null`);
      }

      const alignmentComponents = splitXYAlignmentString(translationOptions.alignment);
      const offsetSelfComponents = splitXYTupleString(translationOptions.offsetSelf);
      const offsetTargetComponents = splitXYTupleString(translationOptions.offsetTarget);

      const {
        alignmentX = alignmentComponents?.[0] ?? 'left',
        alignmentY = alignmentComponents?.[1] ?? 'top',
        offsetSelfX = offsetSelfComponents?.[0] ?? '0px',
        offsetSelfY = offsetSelfComponents?.[1] ?? '0px',
        offsetTargetX = offsetTargetComponents?.[0] ?? '0px',
        offsetTargetY = offsetTargetComponents?.[1] ?? '0px',
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
      let offsetTargetXTrans = offsetTargetX;
      let offsetTargetYTrans = offsetTargetY;
      if (typeof offsetTargetX === 'string') {
        const match = offsetTargetX.match(/(-?\d+(?:\.\d*)?)(\D+)/);
        if (!match) { throw new RangeError(`Invalid offsetTargetX value ${offsetTargetX}`); }
        const num = Number(match[1]);
        const unit = match[2] as CssLengthUnit;
        if (unit === '%') { offsetTargetXTrans = `${(num/100) * rectTarget.width}px`; }
      }
      if (typeof offsetTargetY === 'string') {
        const match = offsetTargetY.match(/(-?\d+(?:\.\d*)?)(\D+)/);
        if (!match) { throw new RangeError(`Invalid offsetTargetY value ${offsetTargetY}`); }
        const num = Number(match[1]);
        const unit = match[2] as CssLengthUnit;
        if (unit === '%') { offsetTargetYTrans = `${(num/100) * rectTarget.height}px`; }
      }
      
      return {
        forwardFrames: [
          {translate: `calc(${baseXTrans}px + ${offsetSelfX} + ${offsetTargetXTrans}) calc(${baseYTrans}px + ${offsetSelfY} + ${offsetTargetYTrans})`}
        ],
        backwardFrames: [
          {translate: `calc(${-baseXTrans}px + ${negateNumString(offsetSelfX)} + ${negateNumString(offsetTargetXTrans)}) calc(${-baseYTrans}px + ${negateNumString(offsetSelfY)} + ${negateNumString(offsetTargetYTrans)})`}
        ],
      };
    },
    defaultConfig: {},
    immutableConfig: {},
  },

  ['~translate']: {
    /**
     * 
     * @param translationOptions 
     * @returns 
     */
    generateKeyframes(translationOptions: Partial<TranslateOptions> = {}) {
      const translationComponents = splitXYTupleString(translationOptions.translate);
      const offsetSelfComponents =  splitXYTupleString(translationOptions.offsetSelf);

      const {
        translateX = translationComponents?.[0] ?? '0px',
        translateY = translationComponents?.[1] ?? '0px',
        offsetSelfX = offsetSelfComponents?.[0] ?? '0px',
        offsetSelfY = offsetSelfComponents?.[1] ?? '0px',
      } = translationOptions;
      
      return {
        forwardFrames: [{translate: `calc(${translateX} + ${offsetSelfX}) calc(${translateY} + ${offsetSelfY})`}],
        backwardFrames: [{translate: `calc(${negateNumString(translateX)} + ${negateNumString(offsetSelfX)})`
                            + ` calc(${negateNumString(translateY)} + ${negateNumString(offsetSelfY)})`}],
      };
    },
    defaultConfig: {},
    immutableConfig: {},
  },
} satisfies EffectGeneratorBank<MotionClip, Layer3MutableClipConfig<MotionClip>, false>;

/*-:**************************************************************************************************************************/
/*-:***************************************        TRANSITIONS        ********************************************************/
/*-:**************************************************************************************************************************/
/**
 * @category hidden
 */
export const libPresetTransitions = {
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
} satisfies EffectGeneratorBank<TransitionClip, Layer3MutableClipConfig<TransitionClip>, false>;

/*-:**************************************************************************************************************************/
/*-:***********************************        CONNECTOR ENTRANCES      ******************************************************/
/*-:**************************************************************************************************************************/
/**
 * @category hidden
 */
export const libPresetConnectorEntrances = {
  [`~appear`]: {
    /**
     * 
     * @returns 
     */
    generateKeyframes() {
      return {forwardFrames: []} as const;
    },
    defaultConfig: {
      duration: 0
    } as const,
    immutableConfig: {},
  },

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
  [`~trace`]: {
    /**
     * 
     * @param direction 
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
} satisfies EffectGeneratorBank<ConnectorEntranceClip, Layer3MutableClipConfig<ConnectorEntranceClip>, false>;

/*-:**************************************************************************************************************************/
/*-:*************************************        CONNECTOR EXITS        ******************************************************/
/*-:**************************************************************************************************************************/
/**
 * @category hidden
 */
export const libPresetConnectorExits = {
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

  [`~trace`]: {
    /**
     * 
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
} satisfies EffectGeneratorBank<ConnectorExitClip, Layer3MutableClipConfig<ConnectorExitClip>, false>;

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

  [`~scroll-self`]: {
    /**
     * 
     * @param target 
     * @param scrollOptions 
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
} satisfies EffectGeneratorBank<ScrollerClip, Layer3MutableClipConfig<ScrollerClip>, false>;
