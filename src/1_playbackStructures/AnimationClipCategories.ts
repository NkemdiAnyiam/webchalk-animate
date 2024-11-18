import { AnimClip, AnimClipConfig, AnimClipModifiers } from "./AnimationClip";
import { CustomErrors, errorTip } from "../4_utils/errors";
import { getPartial, parseMultiUnitPlacement } from "../4_utils/helpers";
import { Webimator } from "../Webimator";
import { DOMElement, MultiUnitPlacementX, MultiUnitPlacementY, ParsedMultiUnitPlacement } from "../4_utils/interfaces";
import { PickFromArray } from "../4_utils/utilityTypes";
import { WebimatorConnectorElement, WebimatorConnectorElementConfig } from "../3_components/WebimatorConnectorElement";
import { EffectGenerator, EffectGeneratorBank, EffectOptions, Layer3MutableClipConfig } from "../2_animationEffects/generationTypes";
import { libPresetEntrances, libPresetExits, libPresetEmphases, libPresetMotions, libPresetConnectorEntrances, libPresetConnectorExits, libPresetTransitions, libPresetScrolls } from "../2_animationEffects/libraryPresetEffectBanks";

/** @ignore */
export type Layer4MutableConfig<TClipClass extends AnimClip, TEffectGenerator extends EffectGenerator> = Omit<Layer3MutableClipConfig<TClipClass>, keyof TEffectGenerator['immutableConfig']>;

/*-:***************************************************************************************************************************/
/*-:*******************************************        ENTRANCE        ********************************************************/
/*-:***************************************************************************************************************************/
/**
 * Contains configuration options used to define both the timing and effects of the animation clip.
 * Used as the last argument in the `Entrance()` factory function created by {@link Webimator.createAnimationClipFactories}.
 * Also returned by {@link EntranceClip.getConfig}.
 *  * Contains additional properties:
 *    * {@link EntranceClipModifiers.hideNowType | hideNowType}
 * @see {@link EntranceClip.getConfig}
 * 
 * @category Entrance
 */
export interface EntranceClipConfig extends AnimClipConfig {
  /**
   * Determines whether/how the element should be hidden as soon as the clip is instantiated
   * (i.e., right when Entrance() is called). This can be convenient because it ensures that the
   * element will be hidden before the entrance clip is played.
   *  * if `null`, the clip does not attempt to hide the element upon the clip's instantiation
   *  * if `'display-none'`, the element is unrendered by setting the CSS `display` to `none`
   *  * if `'visibility-hidden'`, the element is turned invisible by setting the CSS `visibility` to `hidden`
   * @see [display: none & visibility: hidden](https://www.freecodecamp.org/news/css-display-none-and-visibility-hidden-the-difference/)
   */
  hideNowType: 'display-none' | 'visibility-hidden' | null;
}

/**
 * Contains details about how the DOM element is modified beyond just the effect of the animation (such as modifying CSS classes).
 * Returned by {@link EntranceClip.getModifiers}.
 *  * Contains additional properties:
 *    * {@link EntranceClipModifiers.hideNowType | hideNowType}
 * 
 * @see {@link EntranceClip.getModifiers}
 * 
 * @category Entrance
 */
export interface EntranceClipModifiers extends AnimClipModifiers, Pick<EntranceClipConfig, 'hideNowType'> {}

/**
 * Used to reveal an element that was hidden.
 * 
 * <!-- EX:S id="AnimClip.desc" code-type="comment-block" -->
 * A "clip" is the smallest building block of a timeline. It is essentially a [DOM element, effect] pair,
 * where a "DOM element" is some HTML element on the page and the effect is the animation effect that
 * will be applied to it (asynchronously).
 * 
 * The {@link AnimClip} class is abstract, meaning it cannot be instantiated. But it has several subclasses such as 
 * {@link EntranceClip}, {@link MotionClip}, {@link TransitionClip}, etc. Webimator provides convenient factory functions
 * that can be used to create such clips—the factory functions can be obtained from {@link Webimator.createAnimationClipFactories}.
 * Examples are shown below.
 * 
 * Generally (with some exceptions), using a clip factory function follows this format:
 * `const clip = <factory func>(<some element>, <effect name>, [<effect options>], {<optional clip configuration>});`
 * <!-- EX:E id="AnimClip.desc" -->
 * 
 * @example
 * <!-- EX:S id="EntranceClip.example" code-type="ts" -->
 * ```ts
 * // retrieve entrance clip factory function;
 * const { Entrance } = webimator.createAnimationClipFactories();
 * 
 * // select elements from the DOM
 * const square = document.querySelector('.square');
 * const circle = document.querySelector('.circle');
 * const triangle = document.querySelector('.triangle');
 * 
 * // A = element, B = effect name, C = effect options, D = configuration (optional)
 * 
 * // create three entrance clips using factory function
 * //                     A       B          C
 * const clip1 = Entrance(square, '~appear', []);
 * //                     A       B          C              D
 * const clip2 = Entrance(circle, '~fly-in', ['from-left'], {duration: 2000, easing: 'ease-out'});
 * //                     A         B            C                 D
 * const clip3 = Entrance(triangle, '~pinwheel', [2, 'clockwise'], {playbackRate: 2, delay: 1000});
 * 
 * // play clips (all will play at the same time because they are asynchronous)
 * clip1.play();
 * clip2.play();
 * clip3.play();
 * ```
 * <!-- EX:E id="EntranceClip.example" code-type="ts" -->
 * 
 * @category Entrance
 * @hideconstructor
 */
export class EntranceClip<TEffectGenerator extends EffectGenerator<EntranceClip, EntranceClipConfig> = EffectGenerator> extends AnimClip<TEffectGenerator, EntranceClipConfig> {
  protected get category(): 'Entrance' { return 'Entrance'; }
  private backwardsHidingMethod: ExitClipConfig['exitType'] = '' as ExitClipConfig['exitType'];

  get categoryImmutableConfig() {
    return {
      commitsStyles: false,
    } satisfies Partial<EntranceClipConfig>;
  }

  get categoryDefaultConfig() {
    return {
      ...AnimClip.baseDefaultConfig,
      hideNowType: null,
      ...this.categoryImmutableConfig,
    } satisfies EntranceClipConfig;
  }

  /**
   * @returns additional properties for entrance configuration:
   *  * {@link EntranceClipConfig.hideNowType | hideNowType}
   * @inheritdoc *
   */
  getConfig(): EntranceClipConfig {
    return super.getConfig();
  }

  /**
   * Returns details about how the DOM element is modified beyond just the effect of the animation.
   * @returns an object containing
   *  * {@link AnimClipModifiers.cssClasses|cssClasses},
   *  * {@link AnimClipModifiers.commitsStyles|commitsStyles},
   *  * {@link AnimClipModifiers.composite|composite},
   *  * {@link EntranceClipModifiers.hideNowType|hideNowType},
   */
  getModifiers(): EntranceClipModifiers;
  /**
   * Returns the value of a single specific property.
   * @param propName - name of the desired property
   * @ignore
   */
  getModifiers<T extends keyof EntranceClipModifiers>(propName: T): EntranceClipModifiers[T];
  /**
   * Returns an object containing a subset of the object that would normally be returned.
   * @param propNames - array of strings specifying which properties should be included.
   * @ignore
   */
  getModifiers<T extends (keyof EntranceClipModifiers)[]>(propNames: (keyof EntranceClipModifiers)[] | T): PickFromArray<EntranceClipModifiers, T>;
  /**
   * @group Property Getter Methods
   */
  getModifiers(specifics?: keyof EntranceClipModifiers | (keyof EntranceClipModifiers)[]) {
    const config = this.config;
    const result: EntranceClipModifiers = {
      ...super.getModifiers(),
      hideNowType: config.hideNowType,
    };
    
    return specifics ? getPartial(result, specifics) : result;
  }

  /**@internal*/
  constructor(domElem: DOMElement | null | undefined, effectName: string, effectGeneratorBank: EffectGeneratorBank) {
    super(domElem, effectName, effectGeneratorBank);
    super.preventConnector();
  }

  /**@internal*/
  initialize(effectOptions: EffectOptions<TEffectGenerator>, effectConfig: Partial<Layer4MutableConfig<EntranceClip, TEffectGenerator>> = {}) {
    super.initialize(effectOptions, effectConfig);

    const hideNow = (effectConfig as Partial<EntranceClipConfig>).hideNowType ?? this.effectGenerator.defaultConfig?.hideNowType ?? this.categoryDefaultConfig.hideNowType!;
    switch(hideNow) {
      case "display-none":
        this.domElem.classList.add('wbmtr-display-none');
        break;
      case "visibility-hidden":
        this.domElem.classList.add('wbmtr-visibility-hidden');
        break;
      default:
        break;
    }

    return this;
  }

  protected _onStartForward(): void {
    if (this.domElem.classList.contains('wbmtr-display-none')) {
      this.backwardsHidingMethod = 'display-none';
      this.domElem.classList.remove('wbmtr-display-none');
    }
    else if (this.domElem.classList.contains('wbmtr-visibility-hidden')) {
      this.backwardsHidingMethod = 'visibility-hidden';
      this.domElem.classList.remove('wbmtr-visibility-hidden');
    }
    // error case
    else {
      // Note: the render state of the parent element has no effect on the display and visibility values from
      // getComputedStyle() for a child element
      const { display, visibility } = getComputedStyle(this.domElem);
      let str = ``;
      if (display === 'none') {
        str = `The element being entered is hidden with CSS 'display: none', but it was not using the class "wbmtr-display-none".` +
        ` An element needs to be unrendered using the class "wbmtr-display-none" in order for Entrance() to act on it.`;
      }
      else if (visibility === 'hidden') {
        str = `The element being entered is hidden with CSS 'visibility: hidden', but it was not using the class "wbmtr-visibility-hidden".` +
        ` An element needs to be unrendered using the class "wbmtr-visibility-hidden" in order for Entrance() to act on it.`;
      }
      else {
        str = `Entrance() can only play on elements that are already hidden, but this element was not hidden.` +
        ` To hide an element, you can 1) use the 'hideNowType' config option to immediately hide the element from the very start,` +
        ` 2) hide it with Exit() before the Entrance() animation runs, or` +
        ` 3) manually add either "wbmtr-display-none" or "wbmtr-visibility-hidden" to its CSS class list in the HTML.`;
      }
      throw this.generateError(CustomErrors.InvalidEntranceAttempt,
        str +
        `${errorTip(
          `Tip: Adding "wbmtr-display-none" to an element's CSS class list applies a 'display: none' CSS style, which completely unrenders an element.` +
          ` "wbmtr-visibility-hidden" applies a 'visibility: hidden' CSS style, which just makes the element invisible while still taking up space.` +
          ` When using 'exitType' with Exit() or 'hideNowType' with Entrance(), you may set the config options to "display-none" (the default for exitType)` +
          ` or "visibility-hidden", but behind the scenes, this just determines whether to add` +
          ` the class "wbmtr-display-none" or the class "wbmtr-visibility-hidden".`
        )}`
      );
    }
  }

  protected _onFinishBackward(): void {
    switch(this.backwardsHidingMethod) {
      case "display-none": this.domElem.classList.add('wbmtr-display-none'); break;
      case "visibility-hidden": this.domElem.classList.add('wbmtr-visibility-hidden'); break;
      default: throw this.generateError(Error, `This error should NEVER be reached.`);
    }
  }
}


/*-:***************************************************************************************************************************/
/*-:*********************************************        EXIT        **********************************************************/
/*-:***************************************************************************************************************************/
/**
 * Contains configuration options used to define both the timing and effects of the animation clip.
 * Used as the last argument in the `Exit()` factory function created by {@link Webimator.createAnimationClipFactories}.
 * Also returned by {@link ExitClip.getConfig}.
 *  * Contains additional properties:
 *    * {@link ExitClipModifiers.exitType | exitType}
 * @see {@link ExitClip.getConfig}
 * 
 * @category Exit
 */
export interface ExitClipConfig extends AnimClipConfig {
  /**
   * Determines how the element should be hidden when the clip has finished playing.
   *  * if `'display-none'`, the element is unrendered by setting the CSS `display` to `none`
   *  * if `'visibility-hidden'`, the element is turned invisible by setting the CSS `visibility` to `hidden`
   * @see [display: none & visibility: hidden](https://www.freecodecamp.org/news/css-display-none-and-visibility-hidden-the-difference/)
   */
  exitType: 'display-none' | 'visibility-hidden';
};

/**
 * Contains details about how the DOM element is modified beyond just the effect of the animation (such as modifying CSS classes).
 * Returned by {@link ExitClip.getModifiers}.
 *  * Contains additional properties:
 *    * {@link ExitClipModifiers.exitType | exitType}
 * 
 * @see {@link ExitClip.getModifiers}
 * 
 * @category Exit
 */
interface ExitClipModifiers extends AnimClipModifiers, Pick<ExitClipConfig, 'exitType'> {}

/**
 * Used to unrender or make invisible an element.
 * 
 * <!-- EX:S id="AnimClip.desc" code-type="comment-block" -->
 * A "clip" is the smallest building block of a timeline. It is essentially a [DOM element, effect] pair,
 * where a "DOM element" is some HTML element on the page and the effect is the animation effect that
 * will be applied to it (asynchronously).
 * 
 * The {@link AnimClip} class is abstract, meaning it cannot be instantiated. But it has several subclasses such as 
 * {@link EntranceClip}, {@link MotionClip}, {@link TransitionClip}, etc. Webimator provides convenient factory functions
 * that can be used to create such clips—the factory functions can be obtained from {@link Webimator.createAnimationClipFactories}.
 * Examples are shown below.
 * 
 * Generally (with some exceptions), using a clip factory function follows this format:
 * `const clip = <factory func>(<some element>, <effect name>, [<effect options>], {<optional clip configuration>});`
 * <!-- EX:E id="AnimClip.desc" -->
 * 
 * @example
 * <!-- EX:S id="ExitClip.example" code-type="ts" -->
 * ```ts
 * // retrieve exit clip factory function;
 * const { Exit } = webimator.createAnimationClipFactories();
 * 
 * // select elements from the DOM
 * const square = document.querySelector('.square');
 * const circle = document.querySelector('.circle');
 * const triangle = document.querySelector('.triangle');
 * 
 * // A = element, B = effect name, C = effect options, D = configuration (optional)
 * 
 * // create three exit clips using factory function
 * //                 A       B             C
 * const clip1 = Exit(square, '~disappear', []);
 * //                 A       B           C            D
 * const clip2 = Exit(circle, '~fly-out', ['to-left'], {duration: 2000, easing: 'ease-in'});
 * //                 A         B            C                        D
 * const clip3 = Exit(triangle, '~pinwheel', [2, 'counterclockwise'], {playbackRate: 2, delay: 1000});
 * 
 * // play clips (all will play at the same time because they are asynchronous)
 * clip1.play();
 * clip2.play();
 * clip3.play();
 * ```
 * <!-- EX:E id="ExitClip.example" -->
 * 
 * @category Exit
 * @hideconstructor
 */
export class ExitClip<TEffectGenerator extends EffectGenerator<ExitClip, ExitClipConfig> = EffectGenerator> extends AnimClip<TEffectGenerator, ExitClipConfig> {
  protected get category(): 'Exit' { return 'Exit'; }
  private exitType: ExitClipConfig['exitType'] = '' as ExitClipConfig['exitType'];

  get categoryImmutableConfig() {
    return {
      commitsStyles: false,
    } satisfies Partial<ExitClipConfig>;
  }

  get categoryDefaultConfig() {
    return {
      ...AnimClip.baseDefaultConfig,
      exitType: 'display-none',
      ...this.categoryImmutableConfig,
    } satisfies ExitClipConfig;
  }

  /**
   * @returns additional properties for exit configuration:
   *  * {@link ExitClipConfig.exitType | exitType}
   * @inheritdoc *
   */
  getConfig() {
    return super.getConfig();
  }

  /**
   * Returns details about how the DOM element is modified beyond just the effect of the animation.
   * @returns an object containing
   *  * {@link AnimClipModifiers.cssClasses|cssClasses},
   *  * {@link AnimClipModifiers.commitsStyles|commitsStyles},
   *  * {@link AnimClipModifiers.composite|composite},
   *  * {@link ExitClipModifiers.exitType|exitType},
   */
  getModifiers(): ExitClipModifiers;
  /**
   * Returns the value of a single specific property.
   * @param propName - name of the desired property
   * @ignore
   */
  getModifiers<T extends keyof ExitClipModifiers>(propName: T): ExitClipModifiers[T];
  /**
   * Returns an object containing a subset of the object that would normally be returned.
   * @param propNames - array of strings specifying which properties should be included.
   * @ignore
   */
  getModifiers<T extends (keyof ExitClipModifiers)[]>(propNames: (keyof ExitClipModifiers)[] | T): PickFromArray<ExitClipModifiers, T>;
  /**
   * @group Property Getter Methods
   */
  getModifiers(specifics?: keyof ExitClipModifiers | (keyof ExitClipModifiers)[]) {
    const config = this.config;
    const result: ExitClipModifiers = {
      ...super.getModifiers(),
      exitType: config.exitType,
    };
    
    return specifics ? getPartial(result, specifics) : result;
  }

  /**@internal*/
  constructor(domElem: DOMElement | null | undefined, effectName: string, effectGeneratorBank: EffectGeneratorBank) {
    super(domElem, effectName, effectGeneratorBank);
    super.preventConnector();
  }

  /**@internal*/initialize(effectOptions: EffectOptions<TEffectGenerator>, effectConfig: Partial<Layer4MutableConfig<ExitClip, TEffectGenerator>> = {}) {
    super.initialize(effectOptions, effectConfig);

    const exitType = (effectConfig as ExitClipConfig).exitType ?? this.effectGenerator.defaultConfig?.exitType ?? this.categoryDefaultConfig.exitType!;
    if (exitType !== 'display-none' && exitType !== 'visibility-hidden') {
      throw this.generateError(RangeError, `Invalid 'exitType' config value "${exitType}". Must be "display-none" or "visibility-hidden".`);
    }
    this.exitType = exitType;

    return this;
  }

  protected _onStartForward(): void {
    let hidingClassName = '';
    if (this.domElem.classList.contains('wbmtr-display-none')) { hidingClassName = 'wbmtr-display-none'; }
    if (this.domElem.classList.contains('wbmtr-visibility-hidden')) { hidingClassName = 'wbmtr-visibility-hidden'; }
    const { display, visibility } = getComputedStyle(this.domElem);
    const hiddenDisplay = display === 'none';
    const hiddenVisibility = visibility === 'hidden';
    const hidden = hiddenDisplay || hiddenVisibility;

    if (!hidingClassName || !hidden) { return; }

    throw this.generateError(CustomErrors.InvalidExitAttempt,
      `Exit() can only play on elements that are not already hidden. The element here is already hidden by the following:`
      + (hidingClassName ? `\n - Webimator's CSS hiding class "${hidingClassName}"` : '')
      + ((hidingClassName !== 'wbmtr-display-none' && hiddenDisplay) ? `\n - CSS property 'display: none'` : '')
      + ((hidingClassName !== 'wbmtr-visibility-hidden' && hiddenVisibility) ? `\n - CSS property 'visibility: hidden'` : '')
    );
  }

  protected _onFinishForward(): void {
    switch(this.exitType) {
      case "display-none": this.domElem.classList.add('wbmtr-display-none'); break;
      case "visibility-hidden": this.domElem.classList.add('wbmtr-visibility-hidden'); break;
    }
  }

  protected _onStartBackward(): void {
    switch(this.exitType) {
      case "display-none": this.domElem.classList.remove('wbmtr-display-none'); break;
      case "visibility-hidden": this.domElem.classList.remove('wbmtr-visibility-hidden'); break;
    }
  }
}

/*-:***************************************************************************************************************************/
/*-:*******************************************        EMPHASIS        ********************************************************/
/*-:***************************************************************************************************************************/
/**
 * Contains configuration options used to define both the timing and effects of the animation clip.
 * Used as the last argument in the `Emphasis()` factory function created by {@link Webimator.createAnimationClipFactories}.
 * Also returned by {@link EmphasisClip.getConfig}.
 *  * Contains additional properties:
 *    * (none)
 * @see {@link EmphasisClip.getConfig}
 * 
 * @category Emphasis
 */
export interface EmphasisClipConfig extends AnimClipConfig {
  
};

/**
 * Used to emphasize an element in someway (like highlighting).
 * 
 * <!-- EX:S id="AnimClip.desc" code-type="comment-block" -->
 * A "clip" is the smallest building block of a timeline. It is essentially a [DOM element, effect] pair,
 * where a "DOM element" is some HTML element on the page and the effect is the animation effect that
 * will be applied to it (asynchronously).
 * 
 * The {@link AnimClip} class is abstract, meaning it cannot be instantiated. But it has several subclasses such as 
 * {@link EntranceClip}, {@link MotionClip}, {@link TransitionClip}, etc. Webimator provides convenient factory functions
 * that can be used to create such clips—the factory functions can be obtained from {@link Webimator.createAnimationClipFactories}.
 * Examples are shown below.
 * 
 * Generally (with some exceptions), using a clip factory function follows this format:
 * `const clip = <factory func>(<some element>, <effect name>, [<effect options>], {<optional clip configuration>});`
 * <!-- EX:E id="AnimClip.desc" -->
 * 
 * @example
 * <!-- EX:S id="EmphasisClip.example" code-type="ts" -->
 * ```ts
 * // retrieve emphasis clip factory function;
 * const { Emphasis } = webimator.createAnimationClipFactories();
 * 
 * // select element from the DOM
 * const importantText = document.querySelector('.important-text');
 * 
 * // A = element, B = effect name, C = effect options, D = configuration (optional)
 * 
 * // create emphasis clip using factory function
 * const clip1 = Emphasis(
 *   importantText, // A
 *   '~highlight', // B
 *   ['yellow'], // C
 *   { // D
 *     cssClasses: {toAddOnStart: ['.bold', '.italics']},
 *     duration: 1000,
 *   },
 * );
 * 
 * // play clip
 * clip1.play();
 * ```
 * <!-- EX:E id="EmphasisClip.example" -->
 * 
 * @category Emphasis
 * @hideconstructor
 */
export class EmphasisClip<TEffectGenerator extends EffectGenerator<EmphasisClip, EmphasisClipConfig> = EffectGenerator> extends AnimClip<TEffectGenerator, EmphasisClipConfig> {
  protected get category(): 'Emphasis' { return 'Emphasis'; }
  get categoryImmutableConfig() {
    return {
    } satisfies Partial<EmphasisClipConfig>;
  }

  get categoryDefaultConfig() {
    return {
      ...AnimClip.baseDefaultConfig,
      ...this.categoryImmutableConfig,
    } satisfies EmphasisClipConfig;
  }

  getConfig() {
    return super.getConfig();
  }
}

/*-:***************************************************************************************************************************/
/*-:********************************************        MOTION        *********************************************************/
/*-:***************************************************************************************************************************/
/**
 * Contains configuration options used to define both the timing and effects of the animation clip.
 * Used as the last argument in the `Motion()` factory function created by {@link Webimator.createAnimationClipFactories}.
 * Also returned by {@link MotionClip.getConfig}.
 *  * Contains additional properties:
 *    * (none)
 * @see {@link MotionClip.getConfig}
 * 
 * @category Motion
 */
export interface MotionClipConfig extends AnimClipConfig {
  
};

/**
 * <!-- EX:S id="AnimClip.desc" code-type="comment-block" -->
 * A "clip" is the smallest building block of a timeline. It is essentially a [DOM element, effect] pair,
 * where a "DOM element" is some HTML element on the page and the effect is the animation effect that
 * will be applied to it (asynchronously).
 * 
 * The {@link AnimClip} class is abstract, meaning it cannot be instantiated. But it has several subclasses such as 
 * {@link EntranceClip}, {@link MotionClip}, {@link TransitionClip}, etc. Webimator provides convenient factory functions
 * that can be used to create such clips—the factory functions can be obtained from {@link Webimator.createAnimationClipFactories}.
 * Examples are shown below.
 * 
 * Generally (with some exceptions), using a clip factory function follows this format:
 * `const clip = <factory func>(<some element>, <effect name>, [<effect options>], {<optional clip configuration>});`
 * <!-- EX:E id="AnimClip.desc" -->
 * 
 * @example
 * <!-- EX:S id="MotionClip.example" code-type="ts" -->
 * ```ts
 * // retrieve motion clip factory function;
 * const { Motion } = webimator.createAnimationClipFactories();
 * 
 * // select elements from the DOM
 * const square = document.querySelector('.square');
 * const circle = document.querySelector('.circle');
 * const triangle = document.querySelector('.triangle');
 * 
 * // A = element, B = effect name, C = effect options, D = configuration (optional)
 * 
 * // create motion clips using factory function
 * //                   A       B             C
 * const clip1 = Motion(square, '~translate', [{translate: '200px, 300rem'}]);
 * //                   A       B           C
 * const clip2 = Motion(circle, '~move-to', [document.querySelector('body'), {alignment: 'center center'}]);
 * //                   A         B           C                                                             D
 * const clip3 = Motion(triangle, '~move-to', [circle, {alignment: 'center top', selfOffset: '0%, -100%'}], {duration: 2000});
 * 
 * // play clips one at a time
 * (async() => {
 *   await clip1.play(); // square moves 200px right and 300rem down
 *   await clip2.play(); // circle moves to center itself horizontally and vertically with the <body>
 *   await clip3.play(); // triangle moves to sit on top of the circle, horizontally centered
 * })()
 * ```
 * <!-- EX:E id="MotionClip.example"  -->
 * 
 * @category Motion
 * @hideconstructor
 */
export class MotionClip<TEffectGenerator extends EffectGenerator<MotionClip, MotionClipConfig> = EffectGenerator> extends AnimClip<TEffectGenerator, MotionClipConfig> {
  protected get category(): 'Motion' { return 'Motion'; }
  get categoryImmutableConfig() {
    return {
      
    } satisfies Partial<MotionClipConfig>;
  }

  get categoryDefaultConfig() {
    return {
      ...AnimClip.baseDefaultConfig,
      composite: 'accumulate',
      ...this.categoryImmutableConfig,
    } satisfies MotionClipConfig;
  }

  getConfig() {
    return super.getConfig();
  }
}

/*-:***************************************************************************************************************************/
/*-:*******************************************        SCROLLER        ********************************************************/
/*-:***************************************************************************************************************************/
/**
 * Contains configuration options used to define both the timing and effects of the animation clip.
 * Used as the last argument in the `Scroller()` factory function created by {@link Webimator.createAnimationClipFactories}.
 * Also returned by {@link ScrollerClip.getConfig}.
 *  * Contains additional properties:
 *    * (none)
 * @see {@link ScrollerClip.getConfig}
 * 
 * @category Scroller
 */
export interface ScrollerClipConfig extends AnimClipConfig {
  
};

/**
 * Used to scroll an element.
 * 
 * <!-- EX:S id="AnimClip.desc" code-type="comment-block" -->
 * A "clip" is the smallest building block of a timeline. It is essentially a [DOM element, effect] pair,
 * where a "DOM element" is some HTML element on the page and the effect is the animation effect that
 * will be applied to it (asynchronously).
 * 
 * The {@link AnimClip} class is abstract, meaning it cannot be instantiated. But it has several subclasses such as 
 * {@link EntranceClip}, {@link MotionClip}, {@link TransitionClip}, etc. Webimator provides convenient factory functions
 * that can be used to create such clips—the factory functions can be obtained from {@link Webimator.createAnimationClipFactories}.
 * Examples are shown below.
 * 
 * Generally (with some exceptions), using a clip factory function follows this format:
 * `const clip = <factory func>(<some element>, <effect name>, [<effect options>], {<optional clip configuration>});`
 * <!-- EX:E id="AnimClip.desc" -->
 * 
 * @example
 * <!-- EX:S id="ScrollerClip.example" code-type="ts" -->
 * ```ts
 * // retrieve scroller clip factory function;
 * const { Scroller } = webimator.createAnimationClipFactories();
 * 
 * // select elements from the DOM
 * const sideBar = document.querySelector('.side-bar');
 * const mainPage = document.querySelector('.main');
 * 
 * // A = element, B = effect name, C = effect options, D = configuration (optional)
 * 
 * // create scroller clips using factory function
 * //                     A        B               C                                          D
 * const clip1 = Scroller(sideBar, '~scroll-self', [sideBar?.querySelector('.contact-link')], {duration: 1000});
 * const clip2 = Scroller(
 *   mainPage, // A
 *   '~scroll-self', // B
 *   [ // C
 *     mainPage?.querySelector('.testimonials'),
 *     {
 *       scrollableOffset: ['0px', 'center'],
 *       targetOffset: ['0px', 'top'],
 *     },
 *   ],
 *   { // D
 *     duration: 2000,
 *     easing: 'ease-in-out'
 *   },
 * );
 * 
 * // play clips one at a time
 * (async() => {
 *   // side bar scrolls to a presumed contact link
 *   await clip1.play();
 *   // main page scrolls to a presumed testimonials section.
 *   // the top of the testimonials section aligns with the center of the page
 *   await clip2.play();
 * })();
 * ```
 * <!-- EX:E id="ScrollerClip.example" -->
 * 
 * @category Scroller
 * @hideconstructor
 */
// TODO: implement rewindScrollBehavior: 'prior-user-position' | 'prior-scroll-target' = 'prior-scroll-target'
export class ScrollerClip<TEffectGenerator extends EffectGenerator<ScrollerClip, ScrollerClipConfig> = EffectGenerator> extends AnimClip<TEffectGenerator, ScrollerClipConfig> {
  protected get category(): 'Scroller' { return 'Scroller'; }
  get categoryImmutableConfig() {
    return {
    } satisfies Partial<ScrollerClipConfig>;
  }

  get categoryDefaultConfig() {
    return {
      ...AnimClip.baseDefaultConfig,
      commitsStyles: false,
      ...this.categoryImmutableConfig,
    } satisfies ScrollerClipConfig;
  }

  getConfig() {
    return super.getConfig();
  }
}

/*-:***************************************************************************************************************************/
/*-:******************************************        TRANSITION        *******************************************************/
/*-:***************************************************************************************************************************/
/**
 * Contains configuration options used to define both the timing and effects of the animation clip.
 * Used as the last argument in the `Transition()` factory function created by {@link Webimator.createAnimationClipFactories}.
 * Also returned by {@link TransitionClip.getConfig}.
 *  * Contains additional properties:
 *    * {@link TransitionClipModifiers.removeInlineStylesOnFinish | removeInlineStylesOnFinish}
 * @see {@link TransitionClip.getConfig}
 * 
 * @category Transition
 */
export interface TransitionClipConfig extends AnimClipConfig {
  /**
   * If `true`, any CSS property that this clip's effect targeted will be removed from the
   * element's inline style after the clip finishes playing. For example, if a transition _to_
   * a style involved changing `width` and `backgroundColor`, then the line styles for `width`
   * and `background-color` will be deleted after the transition completes.
   * 
   * @remark
   * Practically, this is intended for the specific use case when an element is
   * transitioning _to_ a new style that is identical to its original state (as in, the transition style
   * is the _same_ as what is already specified in some CSS style for the element, so the inline style resulting
   * from the transition is redundant). Removing the inline styles can be useful for preventing their higher precedence from
   * impacting future attempts to modify the element's styles through normal CSS.
   */
  removeInlineStylesOnFinish: boolean;
}

/**
 * Contains details about how the DOM element is modified beyond just the effect of the animation (such as modifying CSS classes).
 * Returned by {@link TransitionClip.getModifiers}.
 *  * Contains additional properties:
 *    * {@link TransitionClipModifiers.removeInlineStylesOnFinish | removeInlineStylesOnFinish}
 * 
 * @see {@link TransitionClip.getModifiers}
 * 
 * @category Transition
 */
export interface TransitionClipModifiers extends AnimClipModifiers, Pick<TransitionClipConfig, 'removeInlineStylesOnFinish'> {}

/**
 * Used to make an element transition to or from a given {@link Keyframe}.
 * 
 * <!-- EX:S id="AnimClip.desc" code-type="comment-block" -->
 * A "clip" is the smallest building block of a timeline. It is essentially a [DOM element, effect] pair,
 * where a "DOM element" is some HTML element on the page and the effect is the animation effect that
 * will be applied to it (asynchronously).
 * 
 * The {@link AnimClip} class is abstract, meaning it cannot be instantiated. But it has several subclasses such as 
 * {@link EntranceClip}, {@link MotionClip}, {@link TransitionClip}, etc. Webimator provides convenient factory functions
 * that can be used to create such clips—the factory functions can be obtained from {@link Webimator.createAnimationClipFactories}.
 * Examples are shown below.
 * 
 * Generally (with some exceptions), using a clip factory function follows this format:
 * `const clip = <factory func>(<some element>, <effect name>, [<effect options>], {<optional clip configuration>});`
 * <!-- EX:E id="AnimClip.desc" -->
 * 
 * @example
 * <!-- EX:S id="TransitionClip.example" code-type="ts" -->
 * ```ts
 * // retrieve transition clip factory function;
 * const { Transition } = webimator.createAnimationClipFactories();
 * 
 * // select elements from the DOM
 * const square = document.querySelector('.square');
 * const textBox = document.querySelector('.text-box');
 * const triangle = document.querySelector('.triangle');
 * 
 * // A = element, B = effect name, C = effect options, D = configuration (optional)
 * 
 * // create transition clips using factory function
 * //                       A       B      C                                              D
 * const clip1 = Transition(square, '~to', [{backgroundColor: 'lightred', width: '50%'}], {duration: 1000});
 * //                       A        B      C
 * const clip2 = Transition(textBox, '~to', [{fontSize: '30px', color: 'blue'}]);
 * //                       A         B        C
 * const clip3 = Transition(triangle, '~from', [{opacity: '0'}]);
 * 
 * // play clips (all will play at the same time because they are asynchronous)
 * clip1.play(); // square transitions to turn red and shrink to half width
 * clip2.play(); // text box font size transitions to have font size of 30px and text color blue
 * clip3.play(); // triangle transitions FROM 0 opacity to its current opacity
 * ```
 * <!-- EX:E id="TransitionClip.example" -->
 * 
 * @category Transition
 * @hideconstructor
 */
export class TransitionClip<TEffectGenerator extends EffectGenerator<TransitionClip, TransitionClipConfig> = EffectGenerator> extends AnimClip<TEffectGenerator, TransitionClipConfig> {
  protected get category(): 'Transition' { return 'Transition'; }
  // determines whether properties affected by this transition should be removed from inline style upon finishing animation
  private removeInlineStyleOnFinish: boolean = false;

  get categoryImmutableConfig() {
    return {
      
    } satisfies Partial<TransitionClipConfig>;
  }

  get categoryDefaultConfig() {
    return {
      ...AnimClip.baseDefaultConfig,
      removeInlineStylesOnFinish: false,
      ...this.categoryImmutableConfig,
    } satisfies TransitionClipConfig;
  }

  /**
   * @returns additional properties for transition configuration:
   *  * {@link TransitionClipConfig.removeInlineStylesOnFinish | removeInlineStylesOnFinish}
   * @inheritdoc *
   */
  getConfig() {
    return super.getConfig();
  }

  /**
   * Returns details about how the DOM element is modified beyond just the effect of the animation.
   * @returns an object containing
   *  * {@link AnimClipModifiers.cssClasses|cssClasses},
   *  * {@link AnimClipModifiers.commitsStyles|commitsStyles},
   *  * {@link AnimClipModifiers.composite|composite},
   *  * {@link TransitionClipModifiers.removeInlineStylesOnFinish|removeInlineStylesOnFinish},
   */
  getModifiers(): TransitionClipModifiers;
  /**
   * Returns the value of a single specific property.
   * @param propName - name of the desired property
   * @ignore
   */
  getModifiers<T extends keyof TransitionClipModifiers>(propName: T): TransitionClipModifiers[T];
  /**
   * Returns an object containing a subset of the object that would normally be returned.
   * @param propNames - array of strings specifying which properties should be included.
   * @ignore
   */
  getModifiers<T extends (keyof TransitionClipModifiers)[]>(propNames: (keyof TransitionClipModifiers)[] | T): PickFromArray<TransitionClipModifiers, T>;
  /**
   * @group Property Getter Methods
   */
  getModifiers(specifics?: keyof TransitionClipModifiers | (keyof TransitionClipModifiers)[]) {
    const config = this.config;
    const result: TransitionClipModifiers = {
      ...super.getModifiers(),
      removeInlineStylesOnFinish: config.removeInlineStylesOnFinish,
    };
    
    return specifics ? getPartial(result, specifics) : result;
  }

  /**@internal*/initialize(effectOptions: EffectOptions<TEffectGenerator>, effectConfig: Partial<Layer4MutableConfig<TransitionClip, TEffectGenerator>> = {}) {
    super.initialize(effectOptions, effectConfig);
    this.removeInlineStyleOnFinish = (effectConfig as TransitionClipConfig).removeInlineStylesOnFinish ?? this.effectGenerator.defaultConfig?.removeInlineStylesOnFinish ?? this.categoryDefaultConfig.removeInlineStylesOnFinish!;
    return this;
  }

  protected _onFinishForward(): void {
    if (this.removeInlineStyleOnFinish) {
      const keyframe = this.effectOptions[0] as Keyframe;
      for (const property in keyframe) {
        (this.domElem as HTMLElement).style[property as any] = "";
      }
    }
  }
}

/*-:***************************************************************************************************************************/
/*-:***************************************        CONNECTOR SETTER        ****************************************************/
/*-:***************************************************************************************************************************/
/**
 * Used to set the endpoints of a {@link WebimatorConnectorElement}.
 * 
 * Contains configuration options used to define both the timing and effects of the animation clip.
 * Returned by {@link ConnectorSetterClip.getConfig}.
 *  * Contains additional properties:
 *    * (none)
 * @see {@link EntranceClip.getConfig}
 * 
 * @category Connector Setter
 */
export interface ConnectorSetterClipConfig extends AnimClipConfig {
  
};

/**
 * <!-- EX:S id="AnimClip.desc" code-type="comment-block" -->
 * A "clip" is the smallest building block of a timeline. It is essentially a [DOM element, effect] pair,
 * where a "DOM element" is some HTML element on the page and the effect is the animation effect that
 * will be applied to it (asynchronously).
 * 
 * The {@link AnimClip} class is abstract, meaning it cannot be instantiated. But it has several subclasses such as 
 * {@link EntranceClip}, {@link MotionClip}, {@link TransitionClip}, etc. Webimator provides convenient factory functions
 * that can be used to create such clips—the factory functions can be obtained from {@link Webimator.createAnimationClipFactories}.
 * Examples are shown below.
 * 
 * Generally (with some exceptions), using a clip factory function follows this format:
 * `const clip = <factory func>(<some element>, <effect name>, [<effect options>], {<optional clip configuration>});`
 * <!-- EX:E id="AnimClip.desc" -->
 * The factory function for creating {@link ConnectorSetterClip}s is one such exception.
 * It follows the form `<factory func>(<connector element>, [<point A>], [<point B>], {<optional configuration>})`.
 * Additionally, "\<some element\>" must be of type {@link WebimatorConnectorElement} (our custom `<wbmtr-connector>` HTML element).
 * 
 * @example
 * <!-- EX:S id="ConnectorSetterClip.example" code-type="ts" -->
 * ```ts
 * // retrieve connector setter clip factory function;
 * const { ConnectorSetter } = webimator.createAnimationClipFactories();
 * 
 * // select connector elements from the DOM
 * const topConnector = document.querySelector('.connector--thick');
 * const middleConnector = document.querySelector('.connector--skinny');
 * const verticalConnector = document.querySelector('.connector--red');
 * const bottomConnector = document.querySelector('.connector--dashed');
 * // select other elements from the DOM
 * const circle1 = document.querySelector('.circle--left');
 * const circle2 = document.querySelector('.circle--right');
 * 
 * // A = connector element, B = point a, C = point b, D = configuration (optional)
 * 
 * // create connector setter clips using factory function
 * //                            A             B                           C
 * const clip1 = ConnectorSetter(topConnector, [circle1, 'center', 'top'], [circle2, 'center', 'top']);
 * //                            A                B                             C
 * const clip2 = ConnectorSetter(middleConnector, [circle1, 'right', 'center'], [circle2, 'left', 'center']);
 * //                            A                  B                                   C
 * const clip3 = ConnectorSetter(verticalConnector, [topConnector, 'center', 'center'], [middleConnector, 'center', 'center']);
 * const clip4 = ConnectorSetter(
 *   bottomConnector, // A
 *   [circle1, 'center', 'center'], // B
 *   [circle2, 'center', 'center'], // C
 *   {pointTrackingEnabled: false}, // D
 * );
 * 
 * // play clips (all will play at the same time because they are asynchronous)
 * // topConnector's endpoints are set to the center-tops of circle1 and circle2
 * clip1.play();
 * 
 * // middleConnector's endpoints are set to the right-center of circle1 and left-center of circle2
 * clip2.play();
 * 
 * // verticalConnector's endpoints are set to the midpoints of topConnector and middleConnector
 * clip3.play();
 * 
 * // bottomConnector's endpoints are set to the center-bottoms of circle1 and circle2,
 * // but its endpoints will NOT be updated if the circles move
 * clip4.play();
 * 
 * // if the connectors are then drawn using ConnectorEntrance(), their endpoints will match
 * // what was set according to ConnectorSetter()
 * ```
 * <!-- EX:E id="ConnectorSetterClip.example" -->
 * 
 * @category Connector Setter
 * @hideconstructor
 */
export class ConnectorSetterClip extends AnimClip<EffectGenerator, ConnectorSetterClipConfig> {
  protected get category(): 'Connector Setter' { return 'Connector Setter'; }
  domElem: WebimatorConnectorElement;
  previousPointA?: [elemA: DOMElement, xPlacement: ParsedMultiUnitPlacement, yPlacement: ParsedMultiUnitPlacement];
  previousPointB?: [elemB: DOMElement, xPlacement: ParsedMultiUnitPlacement, yPlacement: ParsedMultiUnitPlacement];
  pointA: [elemA: DOMElement, xPlacement: ParsedMultiUnitPlacement, yPlacement: ParsedMultiUnitPlacement] | 'use-preserved';
  pointB: [elemB: DOMElement, xPlacement: ParsedMultiUnitPlacement, yPlacement: ParsedMultiUnitPlacement] | 'use-preserved';

  connectorConfig: WebimatorConnectorElementConfig = {} as WebimatorConnectorElementConfig;
  previousConnectorConfig: WebimatorConnectorElementConfig = {} as WebimatorConnectorElementConfig;

  get categoryImmutableConfig() {
    return {
      duration: 0,
      commitsStyles: false,
      startsNextClipToo: true,
    } satisfies Partial<ConnectorSetterClipConfig>;
  }

  get categoryDefaultConfig() {
    return {
      ...AnimClip.baseDefaultConfig,
      ...this.categoryImmutableConfig,
    } satisfies ConnectorSetterClipConfig;
  }

  getConfig() {
    return super.getConfig();
  }
  
  /**@internal*/
  constructor(
    connectorElem: WebimatorConnectorElement | null | undefined,
    pointA: [elemA: Element | null | undefined, xPlacement: number | MultiUnitPlacementX, yPlacement: number | MultiUnitPlacementY] | ['preserve'],
    pointB: [elemB: Element | null | undefined, xPlacement: number | MultiUnitPlacementX, yPlacement: number | MultiUnitPlacementY] | ['preserve'],
    effectName: string,
    effectGeneratorBank: EffectGeneratorBank,
    connectorConfig: Partial<WebimatorConnectorElementConfig> = {},
    ) {
    super(connectorElem, effectName, effectGeneratorBank);

    if (!(connectorElem instanceof WebimatorConnectorElement)) { throw this.generateError(CustomErrors.InvalidElementError, `Must pass WebimatorConnectorElement element. The element received was instead ${Object.getPrototypeOf(connectorElem).constructor.name}.`); }

    const pointAElement = pointA[0] === 'preserve' ? connectorElem!.pointA?.[0] : pointA?.[0];
    if (!(pointAElement instanceof Element)) {
      throw this.generateError(CustomErrors.InvalidElementError, `Point A element must not be null or undefined.`);
    }
    const pointBElement = pointB[0] === 'preserve' ? connectorElem?.pointB?.[0] : pointB?.[0];
    if (!(pointBElement instanceof Element)) {
      throw this.generateError(CustomErrors.InvalidElementError, `Point B element must not be null or undefined.`);
    }

    this.domElem = connectorElem;
    this.pointA = pointA[0] === 'preserve' ? 'use-preserved' : [pointAElement as DOMElement, parseMultiUnitPlacement(pointA[1], 'horizontal'), parseMultiUnitPlacement(pointA[2], 'vertical')];
    this.pointB = pointB[0] === 'preserve' ? 'use-preserved' : [pointBElement as DOMElement, parseMultiUnitPlacement(pointB[1], 'horizontal'), parseMultiUnitPlacement(pointB[2], 'vertical')];

    this.connectorConfig = this.applyLineConfig(connectorConfig);
  }

  protected _onStartForward(): void {
    this.previousPointA = this.domElem.pointA;
    this.previousPointB = this.domElem.pointB;
    this.previousConnectorConfig.pointTrackingEnabled = this.domElem.pointTrackingEnabled;
    if (this.pointA !== 'use-preserved') { this.domElem.pointA = this.pointA; }
    if (this.pointB !== 'use-preserved') { this.domElem.pointB = this.pointB; }
    this.domElem.pointTrackingEnabled = this.connectorConfig.pointTrackingEnabled;
  }

  protected _onStartBackward(): void {
    this.domElem.pointA = this.previousPointA!;
    this.domElem.pointB = this.previousPointB!;
    this.domElem.pointTrackingEnabled = this.previousConnectorConfig.pointTrackingEnabled;
  }

  applyLineConfig(connectorConfig: Partial<WebimatorConnectorElementConfig>): WebimatorConnectorElementConfig {
    return {
      pointTrackingEnabled: this.domElem.pointTrackingEnabled,
      ...connectorConfig,
    };
  }
}

/*-:***************************************************************************************************************************/
/*-:**************************************        CONNECTOR ENTRANCE        ***************************************************/
/*-:***************************************************************************************************************************/
/**
 * Contains configuration options used to define both the timing and effects of the animation clip.
 * Used as the last argument in the `ConnectorEntrance()` factory function created by {@link Webimator.createAnimationClipFactories}.
 * Also returned by {@link ConnectorEntranceClip.getConfig}.
 *  * Contains additional properties:
 *    * {@link ConnectorEntranceClipModifiers.hideNowType | hideNowType}
 * @see {@link ConnectorEntranceClip.getConfig}
 * 
 * @category Connector Entrance
 */
export interface ConnectorEntranceClipConfig extends AnimClipConfig {
  hideNowType: 'display-none' | null;
};

/**
 * Contains details about how the DOM element is modified beyond just the effect of the animation (such as modifying CSS classes).
 * Returned by {@link ConnectorEntranceClip.getModifiers}.
 *  * Contains additional properties:
 *    * {@link ConnectorEntranceClipModifiers.hideNowType | hideNowType}
 * 
 * @see {@link ConnectorEntranceClip.getModifiers}
 * 
 * @category Connector Entrance
 */
export interface ConnectorEntranceClipModifiers extends AnimClipModifiers, Pick<ConnectorEntranceClipConfig, 'hideNowType'> {}

/**
 * Used to reveal a {@link WebimatorConnectorElement} that was hidden.
 * 
 * <!-- EX:S id="AnimClip.desc" code-type="comment-block" -->
 * A "clip" is the smallest building block of a timeline. It is essentially a [DOM element, effect] pair,
 * where a "DOM element" is some HTML element on the page and the effect is the animation effect that
 * will be applied to it (asynchronously).
 * 
 * The {@link AnimClip} class is abstract, meaning it cannot be instantiated. But it has several subclasses such as 
 * {@link EntranceClip}, {@link MotionClip}, {@link TransitionClip}, etc. Webimator provides convenient factory functions
 * that can be used to create such clips—the factory functions can be obtained from {@link Webimator.createAnimationClipFactories}.
 * Examples are shown below.
 * 
 * Generally (with some exceptions), using a clip factory function follows this format:
 * `const clip = <factory func>(<some element>, <effect name>, [<effect options>], {<optional clip configuration>});`
 * <!-- EX:E id="AnimClip.desc" -->
 * 
 * "\<some element\>" here must be of type {@link WebimatorConnectorElement} (our custom `<wbmtr-connector>` HTML element).
 * 
 * Note that {@link ConnectorEntranceClip}s are merely for _entering_ connectors, not setting their endpoints.
 * A connector's endpoints must be set (using a {@link ConnectorSetterClip}), and then a {@link ConnectorEntranceClip}
 * can be used to draw the connector.
 * 
 * @example
 * <!-- EX:S id="ConnectorEntranceClip.example" code-type="ts" -->
 * ```ts
 * // retrieve connector entrance clip factory function;
 * const { ConnectorEntrance } = webimator.createAnimationClipFactories();
 * 
 * // select connector elements from the DOM
 * const topConnector = document.querySelector('.connector--thick');
 * const middleConnector = document.querySelector('.connector--skinny');
 * const verticalConnector = document.querySelector('.connector--red');
 * const bottomConnector = document.querySelector('.connector--dashed');
 * 
 * // A = element, B = effect name, C = effect options, D = configuration (optional)
 * 
 * // create connector entrance clips using factory function
 * //                              A             B           C   D             
 * const clip1 = ConnectorEntrance(topConnector, '~fade-in', [], {duration: 2000, playbackRate: 2});
 * //                              A                B         C
 * const clip2 = ConnectorEntrance(middleConnector, '~trace', ['from-A']);
 * //                              A                  B         C                D
 * const clip3 = ConnectorEntrance(verticalConnector, '~trace', ['from-bottom'], {delay: 500});
 * //                              A                B          C
 * const clip4 = ConnectorEntrance(bottomConnector, '~appear', []);
 * 
 * // play clips (all will play at the same time because they are asynchronous)
 * clip1.play(); // topConnector fades in
 * clip2.play(); // middleConnector is drawn from its point A to its point B
 * clip3.play(); // verticalConnector is draw starting from whichever endpoint is lower
 * clip4.play(); // bottomConnector appears instantly
 * ```
 * <!-- EX:E id="ConnectorEntranceClip.example" -->
 * 
 * @category Connector Entrance
 * @hideconstructor
 */
export class ConnectorEntranceClip<TEffectGenerator extends EffectGenerator<ConnectorEntranceClip, ConnectorEntranceClipConfig> = EffectGenerator> extends AnimClip<TEffectGenerator, ConnectorEntranceClipConfig> {
  protected get category(): 'Connector Entrance' { return 'Connector Entrance'; }
  domElem: WebimatorConnectorElement;

  get categoryImmutableConfig() {
    return {
      commitsStyles: false,
    } satisfies Partial<ConnectorEntranceClipConfig>;
  }

  get categoryDefaultConfig() {
    return {
      ...AnimClip.baseDefaultConfig,
      hideNowType: null,
      ...this.categoryImmutableConfig,
    } satisfies ConnectorEntranceClipConfig;
  }

  /**
   * @returns additional properties for connector entrance configuration:
   *  * {@link ConnectorEntranceClipConfig.hideNowType | hideNowType}
   * @inheritdoc *
   */
  getConfig() {
    return super.getConfig();
  }

  /**
   * Returns details about how the DOM element is modified beyond just the effect of the animation.
   * @returns an object containing
   *  * {@link AnimClipModifiers.cssClasses|cssClasses},
   *  * {@link AnimClipModifiers.commitsStyles|commitsStyles},
   *  * {@link AnimClipModifiers.composite|composite},
   *  * {@link ConnectorEntranceClipModifiers.hideNowType|hideNowType},
   */
  getModifiers(): ConnectorEntranceClipModifiers;
  /**
   * Returns the value of a single specific property.
   * @param propName - name of the desired property
   * @ignore
   */
  getModifiers<T extends keyof ConnectorEntranceClipModifiers>(propName: T): ConnectorEntranceClipModifiers[T];
  /**
   * Returns an object containing a subset of the object that would normally be returned.
   * @param propNames - array of strings specifying which properties should be included.
   * @ignore
   */
  getModifiers<T extends (keyof ConnectorEntranceClipModifiers)[]>(propNames: (keyof ConnectorEntranceClipModifiers)[] | T): PickFromArray<ConnectorEntranceClipModifiers, T>;
  /**
   * @group Property Getter Methods
   */
  getModifiers(specifics?: keyof ConnectorEntranceClipModifiers | (keyof ConnectorEntranceClipModifiers)[]) {
    const config = this.config;
    const result: ConnectorEntranceClipModifiers = {
      ...super.getModifiers(),
      hideNowType: config.hideNowType,
    };
    
    return specifics ? getPartial(result, specifics) : result;
  }

  /**@internal*/
  constructor(connectorElem: WebimatorConnectorElement | null | undefined, effectName: string, effectGeneratorBank: EffectGeneratorBank) {
    super(connectorElem, effectName, effectGeneratorBank);

    if (!(connectorElem instanceof WebimatorConnectorElement)) { throw this.generateError(CustomErrors.InvalidElementError, `Must pass ${WebimatorConnectorElement.name} element. The element received was instead ${Object.getPrototypeOf(connectorElem).constructor.name}.`); }
    this.domElem = connectorElem;
  }

  /**@internal*/
  initialize(effectOptions: EffectOptions<TEffectGenerator>, effectConfig: Partial<Layer4MutableConfig<ConnectorEntranceClip, TEffectGenerator>> = {}) {
    super.initialize(effectOptions, effectConfig);

    const hideNow = (effectConfig as ConnectorEntranceClipConfig).hideNowType ?? this.effectGenerator.defaultConfig?.hideNowType ?? this.categoryDefaultConfig.hideNowType!;
    switch(hideNow) {
      case "display-none":
        this.domElem.classList.add('wbmtr-display-none');
        break;
      default:
        break;
    }

    return this;
  }

  protected _onStartForward(): void {
    if (!this.domElem.classList.contains('wbmtr-display-none')) {
      const { display } = getComputedStyle(this.domElem);
      let str = ``;
      if (display === 'none') {
        str = `The element being entered is hidden with CSS 'display: none', but it was not using the class "wbmtr-display-none".` +
        ` A connector element needs to be unrendered using the class "wbmtr-display-none" in order for ConnectorEntrance() to act on it.`;
      }
      else if (this.domElem.classList.contains('wbmtr-visibility-hidden')) {
        str = `The connector element being entered is hidden with the Webimator CSS class "wbmtr-visibility-hidden",` +
        ` but connectors must only be hidden using the class "wbmtr-display-none".`;
      }
      else {
        str = `ConnectorEntrance() can only play on connectors that are already hidden, but this element was not hidden.` +
        ` To hide a connector element, you can 1) use the 'hideNowType' config option to immediately hide the element from the very start,` +
        ` 2) hide it with ConnectorExit() before the ConnectorEntrance() animation runs, or` +
        ` 3) manually add "wbmtr-display-none" to its CSS class list in the HTML.`;
      }
      throw this.generateError(CustomErrors.InvalidEntranceAttempt,
        str +
        `${errorTip(
          `Tip: Adding "wbmtr-display-none" to an element's CSS class list applies a 'display: none' CSS style, which completely unrenders an element.` +
          ` When using 'hideNowType' with ConnectorEntrance(), you may set the config option to "display-none",` +
          ` but behind the scenes, this just determines whether to adds the class "wbmtr-display-none".`
        )}`
      );
    }

    this.domElem.classList.remove('wbmtr-display-none');
    this.domElem.updateEndpoints();
    if (this.domElem.pointTrackingEnabled) {
      this.domElem.continuouslyUpdateEndpoints();
    }
  }

  protected _onFinishBackward(): void {
    this.domElem.cancelContinuousUpdates();
    this.domElem.classList.add('wbmtr-display-none');
  }
}

/*-:***************************************************************************************************************************/
/*-:****************************************        CONNECTOR EXIT        *****************************************************/
/*-:***************************************************************************************************************************/
/**
 * Contains configuration options used to define both the timing and effects of the animation clip.
 * Used as the last argument in the `ConnectorExit()` factory function created by {@link Webimator.createAnimationClipFactories}.
 * Also returned by {@link ConnectorExitClip.getConfig}.
 *  * Contains additional properties:
 *    * (none)
 * @see {@link ConnectorExitClip.getConfig}
 * 
 * @category Connector Exit
 */
export interface ConnectorExitClipConfig extends AnimClipConfig {
  
};

/**
 * Used to unrender a {@link WebimatorConnectorElement}.
 * 
 * <!-- EX:S id="AnimClip.desc" code-type="comment-block" -->
 * A "clip" is the smallest building block of a timeline. It is essentially a [DOM element, effect] pair,
 * where a "DOM element" is some HTML element on the page and the effect is the animation effect that
 * will be applied to it (asynchronously).
 * 
 * The {@link AnimClip} class is abstract, meaning it cannot be instantiated. But it has several subclasses such as 
 * {@link EntranceClip}, {@link MotionClip}, {@link TransitionClip}, etc. Webimator provides convenient factory functions
 * that can be used to create such clips—the factory functions can be obtained from {@link Webimator.createAnimationClipFactories}.
 * Examples are shown below.
 * 
 * Generally (with some exceptions), using a clip factory function follows this format:
 * `const clip = <factory func>(<some element>, <effect name>, [<effect options>], {<optional clip configuration>});`
 * <!-- EX:E id="AnimClip.desc" -->
 * "\<some element\>" must be of type {@link WebimatorConnectorElement} (our custom `<wbmtr-connector>` HTML element).
 * 
 * @example
 * <!-- EX:S id="ConnectorEntranceClip.example" code-type="ts" -->
 * ```ts
 * // retrieve connector entrance clip factory function;
 * const { ConnectorEntrance } = webimator.createAnimationClipFactories();
 * 
 * // select connector elements from the DOM
 * const topConnector = document.querySelector('.connector--thick');
 * const middleConnector = document.querySelector('.connector--skinny');
 * const verticalConnector = document.querySelector('.connector--red');
 * const bottomConnector = document.querySelector('.connector--dashed');
 * 
 * // A = element, B = effect name, C = effect options, D = configuration (optional)
 * 
 * // create connector entrance clips using factory function
 * //                              A             B           C   D             
 * const clip1 = ConnectorEntrance(topConnector, '~fade-in', [], {duration: 2000, playbackRate: 2});
 * //                              A                B         C
 * const clip2 = ConnectorEntrance(middleConnector, '~trace', ['from-A']);
 * //                              A                  B         C                D
 * const clip3 = ConnectorEntrance(verticalConnector, '~trace', ['from-bottom'], {delay: 500});
 * //                              A                B          C
 * const clip4 = ConnectorEntrance(bottomConnector, '~appear', []);
 * 
 * // play clips (all will play at the same time because they are asynchronous)
 * clip1.play(); // topConnector fades in
 * clip2.play(); // middleConnector is drawn from its point A to its point B
 * clip3.play(); // verticalConnector is draw starting from whichever endpoint is lower
 * clip4.play(); // bottomConnector appears instantly
 * ```
 * <!-- EX:E id="ConnectorEntranceClip.example" -->
 * 
 * @category Connector Exit
 * @hideconstructor
 */
export class ConnectorExitClip<TEffectGenerator extends EffectGenerator<ConnectorExitClip, ConnectorExitClipConfig> = EffectGenerator> extends AnimClip<TEffectGenerator, ConnectorExitClipConfig> {
  protected get category(): 'Connector Exit' { return 'Connector Exit'; }
  domElem: WebimatorConnectorElement;

  get categoryImmutableConfig() {
    return {
      commitsStyles: false,
    } satisfies Partial<ConnectorExitClipConfig>;
  }

  get categoryDefaultConfig() {
    return {
      ...AnimClip.baseDefaultConfig,
      ...this.categoryImmutableConfig,
    } satisfies ConnectorExitClipConfig;
  }

  getConfig() {
    return super.getConfig();
  }

  /**@internal*/
  constructor(connectorElem: WebimatorConnectorElement | null | undefined, effectName: string, effectGeneratorBank: EffectGeneratorBank) {
    super(connectorElem, effectName, effectGeneratorBank);

    if (!(connectorElem instanceof WebimatorConnectorElement)) { throw this.generateError(CustomErrors.InvalidElementError, `Must pass ${WebimatorConnectorElement.name} element. The element received was instead ${Object.getPrototypeOf(connectorElem).constructor.name}.`); }

    this.domElem = connectorElem;
  }

  protected _onStartForward(): void {
    let hidingClassName = '';
    if (this.domElem.classList.contains('wbmtr-display-none')) { hidingClassName = 'wbmtr-display-none'; }
    if (this.domElem.classList.contains('wbmtr-visibility-hidden')) { hidingClassName = 'wbmtr-visibility-hidden'; }
    const { display, visibility } = getComputedStyle(this.domElem);
    const hiddenDisplay = display === 'none';
    const hiddenVisibility = visibility === 'hidden';
    const hidden = hiddenDisplay || hiddenVisibility;

    if (!hidingClassName || !hidden) { return; }

    throw this.generateError(CustomErrors.InvalidExitAttempt,
      `ConnectorExit() can only play on elements that are not already hidden. The connector here is already hidden by the following:`
      + (hidingClassName ? `\n - Webimator's CSS hiding class "${hidingClassName}"` : '')
      + ((hidingClassName !== 'wbmtr-display-none' && hiddenDisplay) ? `\n - CSS property 'display: none'` : '')
      + ((hidingClassName !== 'wbmtr-visibility-hidden' && hiddenVisibility) ? `\n - CSS property 'visibility: hidden'` : '')
    );
  }

  protected _onStartBackward(): void {
    this.domElem.classList.remove('wbmtr-display-none');
    this.domElem.updateEndpoints();
    if (this.domElem.pointTrackingEnabled) {
      this.domElem.continuouslyUpdateEndpoints();
    }
  }

  protected _onFinishForward(): void {
    this.domElem.cancelContinuousUpdates();
    this.domElem.classList.add('wbmtr-display-none');
  }
}

/**
 * Typings for the preset entrance animation effects that come with the library's entrance effect bank.
 * 
 * @category Entrance
 * @interface
 */
export type LibraryPresetEntranceEffects = typeof libPresetEntrances;

/**
 * Typings for the preset exit animation effects that come with the library's exit effect bank.
 * 
 * @category Exit
 * @interface
 */
export type LibraryPresetExitEffects = typeof libPresetExits;

/**
 * Typings for the preset emphasis animation effects that come with the library's emphasis bank.
 * 
 * @category Emphasis
 * @interface
 */
export type LibraryPresetEmphasisEffects = typeof libPresetEmphases;

/**
 * Typings for the preset motion animation effects that come with the library's motion effect bank.
 * 
 * @category Motion
 * @interface
 */
export type LibraryPresetMotionEffects = typeof libPresetMotions;

/**
 * Typings for the preset connector entrance animation effects that come with the library's connector entrance effect bank.
 * 
 * @category Connector Entrance
 * @interface
 */
export type LibraryPresetConnectorEntranceEffects = typeof libPresetConnectorEntrances;

/**
 * Typings for the preset connector exit animation effects that come with the library's connector exit effect bank.
 * 
 * @category Connector Exit
 * @interface
 */
export type LibraryPresetConnectorExitEffects = typeof libPresetConnectorExits;

/**
 * Typings for the preset transition animation effects that come with the library's transition effect bank.
 * 
 * @category Transition
 * @interface
 */
export type LibraryPresetTransitionEffects = typeof libPresetTransitions;

/**
 * Typings for the preset scroller animation effects that come with the library's scroller effect bank.
 * 
 * @category Scroller
 * @interface
 */
export type LibraryPresetScrollEffects = typeof libPresetScrolls;
