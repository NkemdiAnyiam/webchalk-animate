import { AnimClip, AnimClipConfig } from "./AnimClip";
import { EffectOptions, EffectGenerator, EffectGeneratorBank } from "./WebFlik";
import { CustomErrors, errorTip } from "./utils/errors";
import { parseMultiUnitPlacement } from "./utils/helpers";
import { ParsedMultiUnitPlacement, MultiUnitPlacementX, MultiUnitPlacementY, StripFrozenConfig } from "./utils/interfaces";
import { WbfkConnector, WbfkConnectorConfig } from "./WbfkConnector";

// type PartialOmit<T, U> = Partial<Omit<T, keyof U>>;
export type Layer3MutableClipConfig<TClipClass extends AnimClip> = Omit<ReturnType<TClipClass['getConfig']>, keyof TClipClass['categoryImmutableConfig']>;
type Layer4MutableConfig<TClipClass extends AnimClip, TEffectGenerator extends EffectGenerator> = Omit<Layer3MutableClipConfig<TClipClass>, keyof TEffectGenerator['immutableConfig']>;

/*-:***************************************************************************************************************************/
/*-:*******************************************        ENTRANCE        ********************************************************/
/*-:***************************************************************************************************************************/
/**
 * @category Entrance
 */
export interface EntranceClipConfig extends AnimClipConfig {
  hideNowType: 'display-none' | 'visibility-hidden' | null;
}

/**
 * @category Entrance
 * @hideconstructor
 */
export class EntranceClip<TEffectGenerator extends EffectGenerator<EntranceClip, EntranceClipConfig> = EffectGenerator> extends AnimClip<TEffectGenerator, EntranceClipConfig> {
  protected get category(): 'Entrance' { return 'Entrance'; }
  private backwardsHidingMethod: ExitClipConfig['exitType'] = '' as ExitClipConfig['exitType'];

  get categoryImmutableConfig() {
    return {
      commitsStyles: false,
      commitStylesForcefully: false,
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
   * - {@link EntranceClipConfig.hideNowType | hideNowType}
   * @inheritdoc *
   */
  getConfig(): EntranceClipConfig {
    return this.config;
  }

  constructor(domElem: Element | null | undefined, effectName: string, effectGeneratorBank: EffectGeneratorBank) {
    super(domElem, effectName, effectGeneratorBank);
    super.preventConnector();
  }

  /**@internal*/
  initialize(effectOptions: EffectOptions<TEffectGenerator>, effectConfig: Partial<Layer4MutableConfig<EntranceClip, TEffectGenerator>> = {}) {
    super.initialize(effectOptions, effectConfig);

    const hideNow = (effectConfig as Partial<EntranceClipConfig>).hideNowType ?? this.effectGenerator.defaultConfig?.hideNowType ?? this.categoryDefaultConfig.hideNowType!;
    switch(hideNow) {
      case "display-none":
        this.domElem.classList.add('wbfk-hidden');
        break;
      case "visibility-hidden":
        this.domElem.classList.add('wbfk-invisible');
        break;
      default:
        break;
    }

    return this;
  }

  protected _onStartForward(): void {
    if (this.domElem.classList.contains('wbfk-hidden')) {
      this.backwardsHidingMethod = 'display-none';
      this.domElem.classList.remove('wbfk-hidden');
    }
    else if (this.domElem.classList.contains('wbfk-invisible')) {
      this.backwardsHidingMethod = 'visibility-hidden';
      this.domElem.classList.remove('wbfk-invisible');
    }
    // error case
    else {
      const { display, visibility } = getComputedStyle(this.domElem);
      let str = ``;
      if (display === 'none') {
        str = `The element being entered is hidden with CSS 'display: none', but it was not using the class "wbfk-hidden".` +
        ` An element needs to be unrendered using the class "wbfk-hidden" in order for Entrance() to act on it.`;
      }
      else if (visibility === 'hidden') {
        str = `The element being entered is hidden with CSS 'visibility: hidden', but it was not using the class "wbfk-invisible".` +
        ` An element needs to be unrendered using the class "wbfk-invisible" in order for Entrance() to act on it.`;
      }
      else {
        str = `Entrance() can only play on elements that are already hidden, but this element was not hidden.` +
        ` To hide an element, you can 1) use the 'hideNowType' config option to immediately hide the element from the very start,` +
        ` 2) hide it with Exit() before the Entrance() animation runs, or` +
        ` 3) manually add either "wbfk-hidden" or "wbfk-invisible" to its CSS class list in the HTML.`;
      }
      throw this.generateError(CustomErrors.InvalidEntranceAttempt,
        str +
        `${errorTip(
          `Tip: Adding "wbfk-hidden" to an element's CSS class list applies a 'display: none' CSS style, which completely unrenders an element.` +
          ` "wbfk-invisible" applies a 'visibility: hidden' CSS style, which just makes the element invisible while still taking up space.` +
          ` When using 'exitType' with Exit() or 'hideNowType' with Entrance(), you may set the config options to "display-none" (the default for exitType)` +
          ` or "visibility-hidden", but behind the scenes, this just determines whether to add` +
          ` the class "wbfk-hidden" or the class "wbfk-invisible".`
        )}`
      );
    }
  }

  protected _onFinishBackward(): void {
    switch(this.backwardsHidingMethod) {
      case "display-none": this.domElem.classList.add('wbfk-hidden'); break;
      case "visibility-hidden": this.domElem.classList.add('wbfk-invisible'); break;
      default: throw this.generateError(Error, `This error should NEVER be reached.`);
    }
  }
}


/*-:***************************************************************************************************************************/
/*-:*********************************************        EXIT        **********************************************************/
/*-:***************************************************************************************************************************/
/**
 * @category Exit
 */
export interface ExitClipConfig extends AnimClipConfig {
  exitType: 'display-none' | 'visibility-hidden';
};

/**
 * @category Exit
 * @hideconstructor
 */
export class ExitClip<TEffectGenerator extends EffectGenerator<ExitClip, ExitClipConfig> = EffectGenerator> extends AnimClip<TEffectGenerator, ExitClipConfig> {
  protected get category(): 'Exit' { return 'Exit'; }
  private exitType: ExitClipConfig['exitType'] = '' as ExitClipConfig['exitType'];

  get categoryImmutableConfig() {
    return {
      commitsStyles: false,
      commitStylesForcefully: false,
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
   * - {@link ExitClipConfig.exitType | exitType}
   * @inheritdoc *
   */
  getConfig() {
    return this.config;
  }

  constructor(domElem: Element | null | undefined, effectName: string, effectGeneratorBank: EffectGeneratorBank) {
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

  protected mergeConfigs(layer4Config: Partial<ExitClipConfig>, effectGeneratorConfig: Partial<ExitClipConfig>): ExitClipConfig {
    return {
      ...super.mergeConfigs(layer4Config, effectGeneratorConfig),
    } as ExitClipConfig;
  }

  protected _onStartForward(): void {
    let hidingClassName = '';
    if (this.domElem.classList.contains('wbfk-hidden')) { hidingClassName = 'wbfk-hidden'; }
    if (this.domElem.classList.contains('wbfk-invisible')) { hidingClassName = 'wbfk-invisible'; }
    const { display, visibility } = getComputedStyle(this.domElem);
    const hiddenDisplay = display === 'none';
    const hiddenVisibility = visibility === 'hidden';
    const hidden = hiddenDisplay || hiddenVisibility;

    if (!hidingClassName || !hidden) { return; }

    throw this.generateError(CustomErrors.InvalidExitAttempt,
      `Exit() can only play on elements that are not already hidden. The element here is already hidden by the following:`
      + (hidingClassName ? `\n - WebFlik's CSS hiding class "${hidingClassName}"` : '')
      + ((hidingClassName !== 'wbfk-hidden' && hiddenDisplay) ? `\n - CSS property 'display: none'` : '')
      + ((hidingClassName !== 'wbfk-invisible' && hiddenVisibility) ? `\n - CSS property 'visibility: hidden'` : '')
    );
  }

  protected _onFinishForward(): void {
    switch(this.exitType) {
      case "display-none": this.domElem.classList.add('wbfk-hidden'); break;
      case "visibility-hidden": this.domElem.classList.add('wbfk-invisible'); break;
    }
  }

  protected _onStartBackward(): void {
    switch(this.exitType) {
      case "display-none": this.domElem.classList.remove('wbfk-hidden'); break;
      case "visibility-hidden": this.domElem.classList.remove('wbfk-invisible'); break;
    }
  }
}

/*-:***************************************************************************************************************************/
/*-:*******************************************        EMPHASIS        ********************************************************/
/*-:***************************************************************************************************************************/
/**
 * @category Emphasis
 */
export interface EmphasisClipConfig extends AnimClipConfig {
  
};

/**
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
    return this.config;
  }
}

/*-:***************************************************************************************************************************/
/*-:********************************************        MOTION        *********************************************************/
/*-:***************************************************************************************************************************/
/**
 * @category Motion
 */
export interface MotionClipConfig extends AnimClipConfig {
  
};

/**
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
    return this.config;
  }
}

/*-:***************************************************************************************************************************/
/*-:*******************************************        SCROLLER        ********************************************************/
/*-:***************************************************************************************************************************/
/**
 * @category Scroller
 */
export interface ScrollerClipConfig extends AnimClipConfig {
  
};

/**
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
    return this.config;
  }
}

/*-:***************************************************************************************************************************/
/*-:******************************************        TRANSITION        *******************************************************/
/*-:***************************************************************************************************************************/
/**
 * @category Transition
 */
export interface TransitionClipConfig extends AnimClipConfig {
  removeInlineStylesOnFinish: boolean;
}

/**
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
   * - {@link TransitionClipConfig.removeInlineStylesOnFinish | removeInlineStylesOnFinish}
   * @inheritdoc *
   */
  getConfig() {
    return this.config;
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
 * @category Connector Setter
 */
export interface ConnectorSetterClipConfig extends AnimClipConfig {
  
};

/**
 * @category Connector Setter
 * @hideconstructor
 */
export class ConnectorSetterClip extends AnimClip<EffectGenerator, ConnectorSetterClipConfig> {
  protected get category(): 'Connector Setter' { return 'Connector Setter'; }
  domElem: WbfkConnector;
  previousPointA?: [elemA: Element, xPlacement: ParsedMultiUnitPlacement, yPlacement: ParsedMultiUnitPlacement];
  previousPointB?: [elemB: Element, xPlacement: ParsedMultiUnitPlacement, yPlacement: ParsedMultiUnitPlacement];
  pointA: [elemA: Element, xPlacement: ParsedMultiUnitPlacement, yPlacement: ParsedMultiUnitPlacement] | 'use-preserved';
  pointB: [elemB: Element, xPlacement: ParsedMultiUnitPlacement, yPlacement: ParsedMultiUnitPlacement] | 'use-preserved';

  connectorConfig: WbfkConnectorConfig = {} as WbfkConnectorConfig;
  previousConnectorConfig: WbfkConnectorConfig = {} as WbfkConnectorConfig;

  get categoryImmutableConfig() {
    return {
      duration: 0,
      commitsStyles: false,
      commitStylesForcefully: false,
      runGeneratorsNow: true,
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
    return this.config;
  }
  
  constructor(
    connectorElem: WbfkConnector | null | undefined,
    pointA: [elemA: Element | null | undefined, xPlacement: number | MultiUnitPlacementX, yPlacement: number | MultiUnitPlacementY] | ['preserve'],
    pointB: [elemB: Element | null | undefined, xPlacement: number | MultiUnitPlacementX, yPlacement: number | MultiUnitPlacementY] | ['preserve'],
    effectName: string,
    effectGeneratorBank: EffectGeneratorBank,
    connectorConfig: Partial<WbfkConnectorConfig> = {},
    ) {
    super(connectorElem, effectName, effectGeneratorBank);

    if (!(connectorElem instanceof WbfkConnector)) { throw this.generateError(CustomErrors.InvalidElementError, `Must pass ${WbfkConnector.name} element.`); }

    const pointAElement = pointA[0] === 'preserve' ? connectorElem!.pointA?.[0] : pointA?.[0];
    if (!(pointAElement instanceof Element)) {
      throw this.generateError(CustomErrors.InvalidElementError, `Point A element must not be null or undefined.`);
    }
    const pointBElement = pointB[0] === 'preserve' ? connectorElem?.pointB?.[0] : pointB?.[0];
    if (!(pointBElement instanceof Element)) {
      throw this.generateError(CustomErrors.InvalidElementError, `Point B element must not be null or undefined.`);
    }

    this.domElem = connectorElem;
    this.pointA = pointA[0] === 'preserve' ? 'use-preserved' : [pointAElement, parseMultiUnitPlacement(pointA[1], 'horizontal'), parseMultiUnitPlacement(pointA[2], 'vertical')];
    this.pointB = pointB[0] === 'preserve' ? 'use-preserved' : [pointBElement, parseMultiUnitPlacement(pointB[1], 'horizontal'), parseMultiUnitPlacement(pointB[2], 'vertical')];

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

  applyLineConfig(connectorConfig: Partial<WbfkConnectorConfig>): WbfkConnectorConfig {
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
 * @category Connector Entrance
 */
export interface ConnectorEntranceClipConfig extends AnimClipConfig {
  hideNowType: 'display-none' | null;
};

/**
 * @category Connector Entrance
 * @hideconstructor
 */
export class ConnectorEntranceClip<TEffectGenerator extends EffectGenerator<ConnectorEntranceClip, ConnectorEntranceClipConfig> = EffectGenerator> extends AnimClip<TEffectGenerator, ConnectorEntranceClipConfig> {
  protected get category(): 'Connector Entrance' { return 'Connector Entrance'; }
  domElem: WbfkConnector;

  get categoryImmutableConfig() {
    return {
      commitsStyles: false,
      commitStylesForcefully: false,
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
   * - {@link ConnectorEntranceClipConfig.hideNowType | hideNowType}
   * @inheritdoc *
   */
  getConfig() {
    return this.config;
  }

  constructor(connectorElem: WbfkConnector | null | undefined, effectName: string, effectGeneratorBank: EffectGeneratorBank) {
    super(connectorElem, effectName, effectGeneratorBank);

    if (!(connectorElem instanceof WbfkConnector)) { throw this.generateError(CustomErrors.InvalidElementError, `Must pass ${WbfkConnector.name} element.`); }
    this.domElem = connectorElem;
  }

  /**@internal*/
  initialize(effectOptions: EffectOptions<TEffectGenerator>, effectConfig: Partial<Layer4MutableConfig<ConnectorEntranceClip, TEffectGenerator>> = {}) {
    super.initialize(effectOptions, effectConfig);

    const hideNow = (effectConfig as ConnectorEntranceClipConfig).hideNowType ?? this.effectGenerator.defaultConfig?.hideNowType ?? this.categoryDefaultConfig.hideNowType!;
    switch(hideNow) {
      case "display-none":
        this.domElem.classList.add('wbfk-hidden');
        break;
      default:
        break;
    }

    return this;
  }

  protected _onStartForward(): void {
    if (!this.domElem.classList.contains('wbfk-hidden')) {
      const { display } = getComputedStyle(this.domElem);
      let str = ``;
      if (display === 'none') {
        str = `The element being entered is hidden with CSS 'display: none', but it was not using the class "wbfk-hidden".` +
        ` A connector element needs to be unrendered using the class "wbfk-hidden" in order for ConnectorEntrance() to act on it.`;
      }
      else if (this.domElem.classList.contains('wbfk-invisible')) {
        str = `The connector element being entered is hidden with the WebFlik CSS class "wbfk-invisible",` +
        ` but connectors must only be hidden using the class "wbfk-hidden".`;
      }
      else {
        str = `ConnectorEntrance() can only play on connectors that are already hidden, but this element was not hidden.` +
        ` To hide a connector element, you can 1) use the 'hideNowType' config option to immediately hide the element from the very start,` +
        ` 2) hide it with ConnectorExit() before the ConnectorEntrance() animation runs, or` +
        ` 3) manually add "wbfk-hidden" to its CSS class list in the HTML.`;
      }
      throw this.generateError(CustomErrors.InvalidEntranceAttempt,
        str +
        `${errorTip(
          `Tip: Adding "wbfk-hidden" to an element's CSS class list applies a 'display: none' CSS style, which completely unrenders an element.` +
          ` When using 'hideNowType' with ConnectorEntrance(), you may set the config option to "display-none",` +
          ` but behind the scenes, this just determines whether to adds the class "wbfk-hidden".`
        )}`
      );
    }

    this.domElem.classList.remove('wbfk-hidden');
    this.domElem.updateEndpoints();
    if (this.domElem.pointTrackingEnabled) {
      this.domElem.continuouslyUpdateEndpoints();
    }
  }

  protected _onFinishBackward(): void {
    this.domElem.cancelContinuousUpdates();
    this.domElem.classList.add('wbfk-hidden');
  }
}

/*-:***************************************************************************************************************************/
/*-:****************************************        CONNECTOR EXIT        *****************************************************/
/*-:***************************************************************************************************************************/
/**
 * @category Connector Exit
 */
export interface ConnectorExitClipConfig extends AnimClipConfig {
  
};

/**
 * @category Connector Exit
 * @hideconstructor
 */
export class ConnectorExitClip<TEffectGenerator extends EffectGenerator<ConnectorExitClip, ConnectorExitClipConfig> = EffectGenerator> extends AnimClip<TEffectGenerator, ConnectorExitClipConfig> {
  protected get category(): 'Connector Exit' { return 'Connector Exit'; }
  domElem: WbfkConnector;

  get categoryImmutableConfig() {
    return {
      commitsStyles: false,
      commitStylesForcefully: false,
    } satisfies Partial<ConnectorExitClipConfig>;
  }

  get categoryDefaultConfig() {
    return {
      ...AnimClip.baseDefaultConfig,
      ...this.categoryImmutableConfig,
    } satisfies ConnectorExitClipConfig;
  }

  getConfig() {
    return this.config;
  }

  constructor(connectorElem: WbfkConnector | null | undefined, effectName: string, effectGeneratorBank: EffectGeneratorBank) {
    super(connectorElem, effectName, effectGeneratorBank);

    if (!(connectorElem instanceof WbfkConnector)) { throw this.generateError(CustomErrors.InvalidElementError, `Must pass ${WbfkConnector.name} element.`); }

    this.domElem = connectorElem;
  }

  protected _onStartForward(): void {
    let hidingClassName = '';
    if (this.domElem.classList.contains('wbfk-hidden')) { hidingClassName = 'wbfk-hidden'; }
    if (this.domElem.classList.contains('wbfk-invisible')) { hidingClassName = 'wbfk-invisible'; }
    const { display, visibility } = getComputedStyle(this.domElem);
    const hiddenDisplay = display === 'none';
    const hiddenVisibility = visibility === 'hidden';
    const hidden = hiddenDisplay || hiddenVisibility;

    if (!hidingClassName || !hidden) { return; }

    throw this.generateError(CustomErrors.InvalidExitAttempt,
      `ConnectorExit() can only play on elements that are not already hidden. The connector here is already hidden by the following:`
      + (hidingClassName ? `\n - WebFlik's CSS hiding class "${hidingClassName}"` : '')
      + ((hidingClassName !== 'wbfk-hidden' && hiddenDisplay) ? `\n - CSS property 'display: none'` : '')
      + ((hidingClassName !== 'wbfk-invisible' && hiddenVisibility) ? `\n - CSS property 'visibility: hidden'` : '')
    );
  }

  protected _onStartBackward(): void {
    this.domElem.classList.remove('wbfk-hidden');
    this.domElem.updateEndpoints();
    if (this.domElem.pointTrackingEnabled) {
      this.domElem.continuouslyUpdateEndpoints();
    }
  }

  protected _onFinishForward(): void {
    this.domElem.cancelContinuousUpdates();
    this.domElem.classList.add('wbfk-hidden');
  }
}
