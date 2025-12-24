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
import { webchalk } from "../WebChalk";
import { createCustomEffectComposerBank, EffectComposerBank } from "./customEffectCreation";
import { computeSelfScrollingBounds, deepFreeze, getBoundingClientRectOfHidden, negateNumString, parseXYAlignmentString, parseXYTupleString } from "../4_utils/helpers";
import { MoveToOptions, TranslateOptions, CssLengthUnit, ScrollingOptions, Keyframes } from "../4_utils/interfaces";
import { useEasing } from "./easing";
import { CustomErrors } from "../4_utils/errors";
export type {
  LibraryPresetEntranceEffects as EntranceEffects,
  LibraryPresetConnectorEntranceEffects as ConnectorEntranceEffects,
  LibraryPresetConnectorExitEffects as ConnectorExitEffects,
  LibraryPresetMotionEffects as MotionEffects,
  LibraryPresetEmphasisEffects as EmphasisEffects,
  LibraryPresetExitEffects as ExitEffects,
  LibraryPresetScrollEffects as ScrollEffects,
  LibraryPresetTransitionEffects as TransitionEffects
} from "../1_playbackStructures/AnimationClipCategories";

// type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }

type OrthoDirection = 'left' | 'top' | 'right' | 'bottom';
type DiagDirection = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
type Direction = OrthoDirection | DiagDirection;

const clipClosed_bottom = 'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)';
const clipClosed_left = 'polygon(0 0, 0 0, 0 100%, 0 100%)';
const clipClosed_top = 'polygon(0 0, 100% 0, 100% 0, 0 0)';
const clipClosed_right = 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)';
const clipOpened = 'polygon(0 0%, 100% 0%, 100% 100%, 0 100%)';

/*-:**************************************************************************************************************************/
/*-:****************************************        ENTRANCES        *********************************************************/
/*-:**************************************************************************************************************************/
/**
 * @category hidden
 */
export const libPresetEntrances = createCustomEffectComposerBank('Entrance', {
  /** Element appears instantaneously. */
  [`~appear`]: {
    /**
     * 
     * @returns 
     */
    composeEffect() {
      return {} as const;
    },
    defaultConfig: {} as const,
    immutableConfig: {
      easing: 'linear',
      duration: 0,
      composite: 'replace',
    } as const,
    effectCompositionFrequency: 'on-first-play-only',
  },

  /** Element fades in, starting from 0 opacity. */
  [`~fade-in`]: {
    /**
     * 
     * @returns 
     */
    composeEffect() {
      return {
        forwardKeyframesGenerator: () => [ {opacity: '0'}, {} ],
      } as const;
    },
    defaultConfig: {} as const,
    immutableConfig: {
      composite: 'replace',
    } as const,
    effectCompositionFrequency: 'on-first-play-only',
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
    composeEffect(direction: `from-${Direction}` = 'from-bottom') {
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
        forwardKeyframesGenerator: () => [ {translate: computeTranslationStr()}, {translate: `0 0`} ],
        // backwardKeyframesGenerator () => [ {translate: computeTranslationStr()} ]
      };
    },
    defaultConfig: {
      composite: 'accumulate',
    } as const,
    immutableConfig: {},
    effectCompositionFrequency: 'on-first-play-only',
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
    composeEffect(numSpins: number = 2, direction: 'clockwise' | 'counterclockwise' = 'counterclockwise') {
      return {
        forwardKeyframesGenerator: () => [
          {
            rotate: `z ${360 * numSpins * (direction === 'clockwise' ? -1 : 1)}deg`,
            scale: 0,
            opacity: 0,
          },
          {},
        ],
      } as const;
    },
    defaultConfig: {} as const,
    immutableConfig: {} as const,
    effectCompositionFrequency: 'on-first-play-only',
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
    composeEffect() {
      const belowViewportDist = () => window.innerHeight - this.domElem.getBoundingClientRect().top;

      return {
        forwardKeyframesGenerator: () => [
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
    effectCompositionFrequency: 'on-first-play-only',
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
    composeEffect(direction: 'from-bottom' | 'from-left' | 'from-top' | 'from-right' = 'from-bottom') {
      let keyframes: Keyframes;
      switch(direction) {
        case 'from-bottom':
          keyframes = [ {clipPath: clipClosed_bottom}, {clipPath: clipOpened} ];
          break;

        case 'from-left':  
          keyframes = [ {clipPath: clipClosed_left}, {clipPath: clipOpened} ];
          break;
          
        case 'from-top':
          keyframes = [ {clipPath: clipClosed_top}, {clipPath: clipOpened} ];
          break;

        case 'from-right':
          keyframes = [ {clipPath: clipClosed_right}, {clipPath: clipOpened} ];
          break;

        default:
          throw new RangeError(`Invalid direction "${direction}". Must be "from-top", "from-right", "from-bottom", or "from-left"`);
      }

      return {
        forwardKeyframesGenerator: () => keyframes,
      };
    },
    defaultConfig: {} as const,
    immutableConfig: {
      composite: 'replace',
    } as const,
    effectCompositionFrequency: 'on-first-play-only',
  },

  /**
   * Element slides in from the specified direction while also wiping.
   * Particularly effective if the element is adjacent to a different element, making it look as if it
   * is sliding out of that element like a dropdown expanding.
   */
  ['~slide-in']: {
    /**
     * 
     * @param direction - direction from which to slide
     * @returns 
     */
    composeEffect(direction: 'from-left' | 'from-top' | 'from-right' | 'from-bottom' = 'from-top') {
      const genStartFrames = (dir: typeof direction) => {
        switch(dir) {
          case 'from-left':
            return {
              translate: `-100% 0`,
              clipPath: clipClosed_right,
              // marginLeft: -getBoundingClientRectOfHidden(this.domElem).width+'px',
            };
          case 'from-top':
            return {
              translate: `0% -100%`,
              clipPath: clipClosed_bottom,
              marginBottom: -getBoundingClientRectOfHidden(this.domElem).height+'px',
            };
          case 'from-right':
            return {
              translate: `100% 0`,
              clipPath: clipClosed_left,
              marginRight: -getBoundingClientRectOfHidden(this.domElem).width+'px',
            };
          case 'from-bottom':
            return {
              translate: `0% 100%`,
              clipPath: clipClosed_top,
              // marginTop: -getBoundingClientRectOfHidden(this.domElem).height+'px',
            };
          default: throw new TypeError(`Invalid direction "${direction}"`);
        }
      };

      return {
        forwardKeyframesGenerator: () => [
          genStartFrames(direction),
          { clipPath: clipOpened },
        ],
      };
    },
    defaultConfig: {
      duration: 100,
    } as const,
    immutableConfig: {
      composite: 'accumulate',
    } as const,
    effectCompositionFrequency: 'on-first-play-only',
  },

  // invalidProperty: 5,
}); // satisfies EffectComposerBank<EntranceClip> & {[`__EFFECT_CATEGORY: Entrance`]?: never};

/*-:**************************************************************************************************************************/
/*-:******************************************        EXITS        ***********************************************************/
/*-:**************************************************************************************************************************/
/**
 * @category hidden
 */
export const libPresetExits = createCustomEffectComposerBank('Exit', {
  /** Element disappears instantaneously. */
  [`~disappear`]: {
    /**
     * 
     * @returns 
     */
    composeEffect() {
      return {} as const;
    },
    defaultConfig: {} as const,
    immutableConfig: {
      duration: 0,
      easing: 'linear',
      composite: 'replace',
    } as const,
    effectCompositionFrequency: 'on-first-play-only',
  },

  /** Element fades out to 0 opacity. */
  [`~fade-out`]: {
    /**
     * 
     * @returns 
     */
    composeEffect() {
      return {
        forwardKeyframesGenerator: () => [{}, {opacity: '0'}],
      } as const;
    },
    defaultConfig: {} as const,
    immutableConfig: {
      composite: 'replace',
    } as const,
    effectCompositionFrequency: 'on-first-play-only',
  },

  /** Element flies offscreen towards the specified direction */
  [`~fly-out`]: {
    /**
     * 
     * @param direction - direction to which the element should exit
     * @returns 
     */
    composeEffect(direction: `to-${OrthoDirection | DiagDirection}` = 'to-bottom') {
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
        forwardKeyframesGenerator: () => [ {translate: computeTranslationStr()} ],
        // backwardKeyframesGenerator: () => [ {translate: computeTranslationStr()}, {translate: `0 0`} ]
      };
    },
    defaultConfig: {} as const,
    immutableConfig: {
      composite: 'accumulate',
    } as const,
    effectCompositionFrequency: 'on-first-play-only',
  },

  /** Element spins and shrinks while fading out. */
  [`~pinwheel`]: {
    /**
     * 
     * @param numSpins - number of times the element will spin
     * @param direction - direction of the spin
     * @returns 
     */
    composeEffect(numSpins: number = 2, direction: 'clockwise' | 'counterclockwise' = 'clockwise') {
      return {
        forwardKeyframesGenerator: () => [
          {},
          {
            rotate: `z ${360 * numSpins * (direction === 'clockwise' ? 1 : -1)}deg`,
            scale: 0,
            opacity: 0,
          },
        ],
      } as const;
    },
     defaultConfig: {} as const,
     immutableConfig: {} as const, // TODO: figure out good way to set composite
     effectCompositionFrequency: 'on-first-play-only',
  },

  /**
   * Element floats up slightly and then accelerates to the bottom of the screen.
   */
  [`~sink-down`]: {
    /**
     * 
     * @returns 
     */
    composeEffect() {
      const belowViewportDist = () => window.innerHeight - this.domElem.getBoundingClientRect().top;

      return {
        reverseKeyframesEffect: true,
        forwardKeyframesGenerator: () => [
          {opacity: 0, composite: 'replace'},
          {translate: `0 ${belowViewportDist()}px`, offset: 0, easing: useEasing('power2-out')},
          {translate: `0 -25px`, offset: 0.83333},
          {translate: `0 -25px`, offset: 0.86, easing: useEasing('power1-in')},
          {translate: `0 0`},
        ],
        // forwardKeyframesGenerator: () => [
        //   {translate: `0 0`, easing: useEasing('power1-out')},
        //   {translate: `0 -25px`, offset: 0.14 },
        //   {translate: `0 -25px`, easing: useEasing('power2-in'), offset: 0.16666666},
        //   {translate: `0 ${belowViewportDist()}px`, offset: 1},
        //   {opacity: 0, composite: 'replace'},
        // ],
      };
    },
    defaultConfig: {} as const,
    immutableConfig: {
      composite: 'accumulate',
    } as const,
    effectCompositionFrequency: 'on-first-play-only',
  },
  
  /** Element is wiped off, starting from the specified direction. */
  [`~wipe`]: {
    /**
     * 
     * @param direction 
     * @returns 
     */
    composeEffect(direction: 'from-bottom' | 'from-left' | 'from-top' | 'from-right' = 'from-bottom') {
      let keyframes: Keyframes;

      switch(direction) {
        case 'from-bottom':
          keyframes = [ {clipPath: clipOpened}, {clipPath: clipClosed_top} ];
          break;
        case 'from-left':
          keyframes = [ {clipPath: clipOpened}, {clipPath: clipClosed_right} ];
          break;
        case 'from-top':
          keyframes = [ {clipPath: clipOpened}, {clipPath: clipClosed_bottom} ];
          break;
        case 'from-right':
          keyframes = [ {clipPath: clipOpened}, {clipPath: clipClosed_left} ];
          break;
        default:
          throw new RangeError(`Invalid direction "${direction}". Must be "from-top", "from-right", "from-bottom", or "from-left"`);
      }

      return {
        forwardKeyframesGenerator: () => keyframes,
      };
    },
    defaultConfig: {} as const,
    immutableConfig: {
      composite: 'replace',
    } as const,
    effectCompositionFrequency: 'on-first-play-only',
  },

  /**
   * Element slides out to the specified direction while also wiping.
   * Particularly effective if the element is adjacent to a different element, making it look as if it
   * is sliding into that element like a dropdown collapsing.
   */
  ['~slide-out']: {
    /**
     * 
     * @param direction - direction to which to slide
     * @returns 
     */
    composeEffect(direction: 'to-left' | 'to-top' | 'to-right' | 'to-bottom' = 'to-top') {
      const genEndFrames = (dir: typeof direction) => {
        switch(dir) {
          case 'to-left':
            return {
              translate: `-100% 0`,
              clipPath: clipClosed_right,
              // marginLeft: -getBoundingClientRectOfHidden(this.domElem).width+'px',
            };
          case 'to-top':
            return {
              translate: `0% -100%`,
              clipPath: clipClosed_bottom,
              marginBottom: -getBoundingClientRectOfHidden(this.domElem).height+'px',
            };
          case 'to-right':
            return {
              translate: `100% 0`,
              clipPath: clipClosed_left,
              marginRight: -getBoundingClientRectOfHidden(this.domElem).width+'px',
            };
          case 'to-bottom':
            return {
              translate: `0% 100%`,
              clipPath: clipClosed_top,
              // marginTop: -getBoundingClientRectOfHidden(this.domElem).height+'px',
            };
          default: throw new TypeError(`Invalid direction "${direction}"`);
        }
      };

      return {
        forwardKeyframesGenerator: () => [
          { clipPath: clipOpened },
          genEndFrames(direction),
        ],
      };
    },
    defaultConfig: {
      duration: 100,
    } as const,
    immutableConfig: {
      composite: 'accumulate',
    } as const,
    effectCompositionFrequency: 'on-first-play-only',
  },
}); // satisfies EffectComposerBank<ExitClip>;

/*-:**************************************************************************************************************************/
/*-:*****************************************        EMPHASES        *********************************************************/
/*-:**************************************************************************************************************************/
/**
 * @category hidden
 */
export const libPresetEmphases = createCustomEffectComposerBank('Emphasis', {
  /**
   * Element is highlighted in the specified color.
   */
  [`~highlight`]: {
    /**
     * 
     * @param color - color to use for the highlight
     * @returns 
     */
    composeEffect(color: string = 'default') {
      // this.domElem.style.setProperty(`--webchalk-highlight-color`, 'red');
      // let prevVal = '';
      // if (this.domElem.getAttribute('style')?.includes('--webchalk-highlight-color')) {
      //   prevVal = getComputedStyle(this.domElem).getPropertyValue('--webchalk-highlight-color');
      // };

      // get the previous highlight color of the element (if none, it naturally uses the value from :root)
      const prevColor = this.getStyles('--webchalk-highlight-color');
      // if color is 'default', use :root's highlight color
      const finalColor = color === 'default' ? this.getStyles(document.documentElement, '--webchalk-highlight-color') : color;
      
      return {
        forwardKeyframesGenerator: () => {
          if (this.domElem.dataset.webchalkHighlighted) {
            throw new CustomErrors.InvalidEffectError(`Cannot highlight an element that is already highlighted.`);
          }
          this.domElem.dataset.webchalkHighlighted = String(true);

          return [
            {['--webchalk-highlight-color']: prevColor, easing: 'step-start'}, // step-start -> steps(1, jump-start)
            {backgroundPositionX: '100%', offset: 0},
            {backgroundPositionX: '0%', offset: 1},
            {['--webchalk-highlight-color']: finalColor}
          ];
        },
        backwardKeyframesGenerator: () => {
          delete this.domElem.dataset.webchalkHighlighted;

          return [
            {['--webchalk-highlight-color']: finalColor, easing: 'step-end'}, // step-end -> steps(1, jump-end)
            {backgroundPositionX: '0%', offset: 0},
            {backgroundPositionX: '100%', offset: 1},
            {['--webchalk-highlight-color']: prevColor}
          ];
        },
      };
    },
    defaultConfig: {
      cssClasses: { toAddOnStart: [`webchalk-highlightable`] },
      // invalidProp: 4,
    } as const,
    immutableConfig: {
      composite: 'replace',
    } as const,
    effectCompositionFrequency: 'on-every-play',
  },

  /** Element is unhighlighted. */
  [`~un-highlight`]: {
    /**
     * 
     * @returns 
     */
    composeEffect() {
      if (!this.domElem.classList.contains(`webchalk-highlightable`)) {
        throw new CustomErrors.InvalidEffectError(`Cannot un-highlight an element that was not already highlighted.`);
      }

      return {
        forwardKeyframesGenerator: () => {
          switch (this.getStatus('direction')) {
            // if playing, dataset highlighted should become false
            case 'forward':
              delete this.domElem.dataset.webchalkHighlighted;
              break;
            // if rewinding, dataset highlighted should become true
            case 'backward':
              this.domElem.dataset.webchalkHighlighted = String(true);
              break;
            default: throw new Error(`Something very wrong occurred for an error to arise here.`);
          }

          return [ {backgroundPositionX: '0%'}, {backgroundPositionX: '100%'}];
        },
      } as const;
    },
    defaultConfig: {
      cssClasses: { toRemoveOnFinish: [`webchalk-highlightable`] },
    } as const,
    immutableConfig: {
      composite: 'replace',
    } as const,
    effectCompositionFrequency: 'on-every-play',
  },
}); // satisfies EffectComposerBank<EmphasisClip>;

/*-:**************************************************************************************************************************/
/*-:*****************************************        MOTIONS        **********************************************************/
/*-:**************************************************************************************************************************/
/**
 * @category hidden
 */
export const libPresetMotions = createCustomEffectComposerBank('Motion', {
  /** Element is moved with respect to another element. */
  ['~move-to']: {
    /**
     * 
     * @param targetElem - element to which our element should move
     * @param translationOptions - options defining the behavior of the motion
     * @returns 
     */
    composeEffect(targetElem: Element | null | undefined, translationOptions: Partial<MoveToOptions> = {}) {
      if (!targetElem) {
        throw new TypeError(`Target for ~move-to must not be null`);
      }

      const alignmentComponents = parseXYAlignmentString(translationOptions.alignment);
      const selfOffsetComponents = parseXYTupleString(translationOptions.selfOffset);
      const targetOffsetComponents = parseXYTupleString(translationOptions.targetOffset);

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
      const rectSelf = getBoundingClientRectOfHidden(this.domElem);
      const rectTarget = getBoundingClientRectOfHidden(targetElem);

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
        forwardKeyframesGenerator: () => [
          {translate: `calc(${baseXTrans}px + ${selfOffsetX} + ${targetOffsetXTrans}) calc(${baseYTrans}px + ${selfOffsetY} + ${targetOffsetYTrans})`}
        ],
        backwardKeyframesGenerator: () => [
          {translate: `calc(${-baseXTrans}px + ${negateNumString(selfOffsetX)} + ${negateNumString(targetOffsetXTrans)}) calc(${-baseYTrans}px + ${negateNumString(selfOffsetY)} + ${negateNumString(targetOffsetYTrans)})`}
        ],
      };
    },
    defaultConfig: {} as const,
    immutableConfig: {
      composite: 'accumulate',
    } as const,
    effectCompositionFrequency: 'on-every-play',
  },

  /** Element moves based on the specified translation options. */
  ['~translate']: {
    /**
     * 
     * @param translationOptions - options defining the behavior of the motion
     * @returns 
     */
    composeEffect(translationOptions: Partial<TranslateOptions> = {}) {
      const translationComponents = parseXYTupleString(translationOptions.translate);
      const selfOffsetComponents =  parseXYTupleString(translationOptions.selfOffset);

      const translateX = translationComponents?.[0] ?? '0px';
      const translateY = translationComponents?.[1] ?? '0px';
      const selfOffsetX = selfOffsetComponents?.[0] ?? '0px';
      const selfOffsetY = selfOffsetComponents?.[1] ?? '0px';
      
      return {
        forwardKeyframesGenerator: () => [{translate: `calc(${translateX} + ${selfOffsetX}) calc(${translateY} + ${selfOffsetY})`}],
        backwardKeyframesGenerator: () => [{translate: `calc(${negateNumString(translateX)} + ${negateNumString(selfOffsetX)})`
                            + ` calc(${negateNumString(translateY)} + ${negateNumString(selfOffsetY)})`}],
      };
    },
    defaultConfig: {
      composite: 'accumulate',
    } as const,
    immutableConfig: {} as const,
    effectCompositionFrequency: 'on-first-play-only',
  },
}); // satisfies EffectComposerBank<MotionClip>;

/*-:**************************************************************************************************************************/
/*-:***************************************        TRANSITIONS        ********************************************************/
/*-:**************************************************************************************************************************/
/**
 * @category hidden
 */
export const libPresetTransitions = deepFreeze({
  /** Element transitions from the specified {@link Keyframe} to its current state. */
  ['~from']: {
    /**
     * 
     * @param keyframe - a _single_ {@link Keyframe} object dictating the beginning state of the transition
     * @see [Keyframe Formats (way #1)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Keyframe_Formats)
     * @see [Keyframe Properties](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Keyframe_Formats#attributes)
     * @returns 
     * 
     * @example
     * <!-- EX:S id="Transition.~from" code-type="ts" -->
     * ```ts
     * const { Transition } = webchalk.createAnimationClipFactories();
     * 
     *   // get element from DOM and set its styles (just to give some explicit values to look at)
     *   const square = document.querySelector('.square') as HTMLElement;
     *   square.style.opacity = '0.5';
     *   square.style.backgroundColor = 'black';
     *   square.style.width = '200px';
     * 
     *   // A = element, B = effect name, C = effect options, D = configuration (optional)
     *   
     *   //                       A       B        C                                                     D
     *   const clip1 = Transition(square, '~from', [{opacity: '0', backgroundColor: 'red', width: '0'}], {duration: 2000});
     *   //                       A       B        C                    D
     *   const clip2 = Transition(square, '~from', [{width: '5000px'}], {duration: 1000});
     * 
     *   (async () => {
     *     // The square instantly becomes invisible (0 opacity), turns red, and has 0 width. Then over 2 seconds, it
     *     // transitions back to its state before the transition (0.5 opacity, black background, and 200px width).
     *     await clip1.play();
     * 
     *     // The square instantly becomes 5000px. Then over 1 second, it transitions back to 200px width.
     *     await clip2.play();
     *   })();
     * ```
     * <!-- EX:E id="Transition.~from" -->
     */
    composeEffect(keyframe: Keyframe) {
      return {
        forwardKeyframesGenerator: () => [{...keyframe}, {}],
      };
    },
    defaultConfig: {} as const,
    immutableConfig: {
      commitsStyles: false,
    } as const,
    effectCompositionFrequency: 'on-first-play-only',
  },

  /** Element transitions from its current state to the specified {@link Keyframe}. */
  ['~to']: {
    /**
     * 
     * @param keyframe - a _single_ {@link Keyframe} object dictating the end state of the transition
     * @see [Keyframe Formats (way #1)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Keyframe_Formats)
     * @see [Keyframe Properties](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Keyframe_Formats#attributes)
     * @returns 
     * 
     * @example
     * <!-- EX:S id="Transition.~to" code-type="ts" -->
     * ```ts
     * const { Transition } = webchalk.createAnimationClipFactories();
     * 
     *   // get element from DOM and set its styles (just to give some explicit values to look at)
     *   const square = document.querySelector('.square') as HTMLElement;
     *   square.style.opacity = '0.5';
     *   square.style.backgroundColor = 'black';
     *   square.style.width = '200px';
     * 
     *   // A = element, B = effect name, C = effect options, D = configuration (optional)
     *   
     *   //                       A       B      C                                                     D
     *   const clip1 = Transition(square, '~to', [{opacity: '0', backgroundColor: 'red', width: '0'}], {duration: 2000});
     *   //                       A       B      C                            D
     *   const clip2 = Transition(square, '~to', [{opacity: '1', width: '5000px'}], {duration: 1000});
     *   const clip3 = Transition(square, '~to', [{width: '200px'}], {duration: 0.5, removeInlineStylesOnFinish: true});
     * 
     *   (async () => {
     *     // Over 2 seconds, the square transitions to having 0 opacity, a red background color, and 0 width.
     *     await clip1.play();
     * 
     *     // Over 1 second, the square transitions to have 100% opacity and 5000px width.
     *     await clip2.play();
     * 
     *     // Over 0.5 seconds, the square transitions to having 200px.
     *     // Because of removeInlineStylesOnFinish, the inline styles related to this clip (i.e., just the width) will be
     *     // removed from the element in the HTML after the clip finishes. This is reasonable here since the very original
     *     // width of the square is 200px.
     *     await clip3.play();
     *   })();
     * ```
     * <!-- EX:E id="Transition.~to" -->
     */
    composeEffect(keyframe: Keyframe) {
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
        forwardKeyframesGenerator: () => [original, {...keyframe}],
      };
    },
    defaultConfig: {} as const,
    immutableConfig: {} as const,
    effectCompositionFrequency: 'on-every-play',
  },
}) satisfies EffectComposerBank<TransitionClip>;

/*-:**************************************************************************************************************************/
/*-:***********************************        CONNECTOR ENTRANCES      ******************************************************/
/*-:**************************************************************************************************************************/
/**
 * @category hidden
 */
export const libPresetConnectorEntrances = deepFreeze({
  /** Connector appears instantaneously. */
  [`~appear`]: {
    /**
     * 
     * @returns 
     */
    composeEffect() {
      return {} as const;
    },
    defaultConfig: {} as const,
    immutableConfig: {
      composite: 'replace',
      duration: 0,
      easing: 'linear',
    } as const,
    effectCompositionFrequency: 'on-first-play-only',
  },

  /** Connector fades in, starting from 0 opacity. */
  [`~fade-in`]: {
    /**
     * 
     * @returns 
     */
    composeEffect() {
      return {
        forwardKeyframesGenerator: () => [ {opacity: '0'}, {}],
      } as const;
    },
    defaultConfig: {},
    immutableConfig: {
      composite: 'replace',
    } as const,
    effectCompositionFrequency: 'on-first-play-only',
  },

  // TODO: Fix new bugs surrounding animating custom variables
  /** Connector is wiped on from the specified direction as if being drawn. */
  [`~trace`]: {
    /**
     * 
     * @param direction - direction from which the connector should be traced
     * @returns 
     */
    composeEffect(direction: 'from-A' | 'from-B' | 'from-top' | 'from-bottom' | 'from-left' | 'from-right' = 'from-A') {
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

      let keyframes: Keyframes;

      switch(direction) {
        case 'from-A':
          keyframes = fromAFrames;
          break;

        case 'from-B':
          keyframes = fromBFrames;
          break;

        case 'from-top':
          keyframes = this.domElem.ay <= this.domElem.by ? fromAFrames : fromBFrames;
          break;

        case 'from-bottom':
          keyframes = this.domElem.ay >= this.domElem.by ? fromAFrames : fromBFrames;
          break;

        case 'from-left':
          keyframes = this.domElem.ax <= this.domElem.bx ? fromAFrames : fromBFrames;
          break;

        case 'from-right':
          keyframes = this.domElem.ax >= this.domElem.bx ? fromAFrames : fromBFrames;
          break;

        default:
          throw new RangeError(`Invalid direction "${direction}". Must be "from-A", "from-B", "from-top", "from-bottom", "from-left", or "from-right"`);
      }

      return {
        forwardKeyframesGenerator: () => keyframes,
      };
    },
    defaultConfig: {} as const,
    immutableConfig: {
      composite: 'replace',
    } as const,
    effectCompositionFrequency: 'on-every-play',
  },
}) satisfies EffectComposerBank<ConnectorEntranceClip>;

/*-:**************************************************************************************************************************/
/*-:*************************************        CONNECTOR EXITS        ******************************************************/
/*-:**************************************************************************************************************************/
/**
 * @category hidden
 */
export const libPresetConnectorExits = deepFreeze({
  /** Connector disappears instantaneously. */
  [`~disappear`]: {
    /**
     * 
     * @returns 
     */
    composeEffect() {
      return {} as const;
    },
    defaultConfig: {} as const,
    immutableConfig: {
      composite: 'replace',
      duration: 0,
      easing: 'linear',
    } as const,
    effectCompositionFrequency: 'on-first-play-only',
  },

  /** Connector fades out to 0 opacity. */
  [`~fade-out`]: {
    /**
     * 
     * @returns 
     */
    composeEffect() {
      return {
        forwardKeyframesGenerator: () => [ {}, {opacity: '0'} ],
      } as const;
    },
    defaultConfig: {} as const,
    immutableConfig: {
      composite: 'replace',
    } as const,
    effectCompositionFrequency: 'on-first-play-only',
  },

  /** Connector is wiped off from the specified direction as if being erased. */
  [`~trace`]: {
    /**
     * 
     * @param direction - direction from which the connector should be traced
     * @returns 
     */
    composeEffect(direction: 'from-A' | 'from-B' | 'from-top' | 'from-bottom' | 'from-left' | 'from-right' = 'from-A') {
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

      let keyframes : Keyframes;

      switch(direction) {
        case 'from-A':
          keyframes = fromStartFrames;
          break;

        case 'from-B':
          keyframes = fromEndFrames;
          break;

        case 'from-top':
          keyframes = this.domElem.ay <= this.domElem.by ? fromStartFrames : fromEndFrames;
          break;

        case 'from-bottom':
          keyframes = this.domElem.ay >= this.domElem.by ? fromStartFrames : fromEndFrames
          break;

        case 'from-left':
          keyframes = this.domElem.ax <= this.domElem.bx ? fromStartFrames : fromEndFrames;
          break;

        case 'from-right':
          keyframes = this.domElem.ax >= this.domElem.bx ? fromStartFrames : fromEndFrames
          break;

        default:
          throw new RangeError(`Invalid direction "${direction}". Must be "from-A", "from-B", "from-top", "from-bottom", "from-left", or "from-right"`);
      }

      return {
        forwardKeyframesGenerator: () => keyframes,
      }
    },
    defaultConfig: {} as const,
    immutableConfig: {
      composite: 'replace',
    } as const,
    effectCompositionFrequency: 'on-every-play',
  },
}) satisfies EffectComposerBank<ConnectorExitClip>;

/*-:**************************************************************************************************************************/
/*-:*****************************************        SCROLLS        **********************************************************/
/*-:**************************************************************************************************************************/
/**
 * @category hidden
 */
export const libPresetScrolls = deepFreeze({
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
    composeEffect(target: Element | null | undefined, scrollOptions: Partial<ScrollingOptions> = {}) {
      if (!target) { throw new TypeError(`Target for ~scroll-self must not be null`); }
      const {
        preserveX = false,
        preserveY = false,
      } = scrollOptions;

      let [x_from, y_from, x_to, y_to] = [0, 0, 0, 0];

      const forwardMutatorGenerator = () => {
        const {
          fromXY,
          toXY
        } = computeSelfScrollingBounds(this.domElem, target, scrollOptions);
        [x_from, y_from] = fromXY;
        [x_to, y_to] = toXY;
        webchalk.scrollAnchorsStack.push([target, scrollOptions]);

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

      const backwardMutatorGenerator = () => {
        webchalk.scrollAnchorsStack.pop();
        if (webchalk.scrollAnchorsStack.length > 0) {
          const [anchor, anchorOptions] = webchalk.scrollAnchorsStack[webchalk.scrollAnchorsStack.length - 1];

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

      return {
        forwardMutatorGenerator,
        backwardMutatorGenerator,
      };
    },
    defaultConfig: {} as const,
    immutableConfig: {
      composite: 'replace',
    } as const,
    effectCompositionFrequency: 'on-first-play-only',
  },
}) satisfies EffectComposerBank<ScrollerClip>;
