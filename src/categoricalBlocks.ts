import { AnimBlock, AnimBlockConfig } from "./AnimBlock";
import { EffectOptions, EffectGeneratorBank, EffectGenerator } from "./WebFlik";
import { CustomErrors, errorTip } from "./utils/errors";
import { parseMultiUnitPlacement } from "./utils/helpers";
import { EffectCategory, ParsedMultiUnitPlacement, MultiUnitPlacementX, MultiUnitPlacementY } from "./utils/interfaces";
import { WbfkConnector, WbfkConnectorConfig } from "./WbfkConnector";

/*****************************************************************************************************************************/
/*********************************************        ENTRANCE        ********************************************************/
/*****************************************************************************************************************************/
export type EntranceBlockConfig = AnimBlockConfig & {
  hideNowType: 'display-none' | 'visibility-hidden' | null;
};
export class EntranceBlock<TEffectGenerator extends EffectGenerator<EntranceBlock, EntranceBlockConfig> = EffectGenerator> extends AnimBlock<TEffectGenerator> {
  private backwardsHidingMethod: ExitBlockConfig['exitType'] = '' as ExitBlockConfig['exitType'];

  protected get defaultConfig(): Partial<EntranceBlockConfig> {
    return {
      commitsStyles: false,
      runGeneratorsNow: true,
      hideNowType: null,
    };
  }

  /**@internal*/initialize(effectOptions: EffectOptions<TEffectGenerator>, effectConfig: Partial<EntranceBlockConfig> = {}) {
    super.initialize(effectOptions, effectConfig);

    const hideNow = effectConfig.hideNowType ?? this.effectGenerator.config?.hideNowType ?? this.defaultConfig.hideNowType!;
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
        str = `Entrance() can only act on elements that are already hidden, but this element was not hidden.` +
        ` To hide an element, you can 1) use the 'hideNowType' config option to immediately hide the element from the very start, 2) exit it with Exit(), or` +
        ` 3) manually add either "wbfk-hidden" or "wbfk-invisible" to its class list in the HTML.`;
      }
      throw this.generateError(CustomErrors.InvalidEntranceAttempt,
        str +
        `${errorTip(
          `Tip: "wbfk-hidden" applies a 'display: none' CSS style, which completely unrenders an element.` +
          ` "wbfk-invisible" applies a 'visibility: hidden' CSS style, which just makes the element invisible while still taking up space.` +
          ` When using 'exitType' with Exit() or 'hideNowType' with Entrance(), you may set the config options to "display-none" (the default for exitType) or "visibility-hidden", but behind the scenes, this just determines whether to add` +
          ` the class "wbfk-hidden" or the class "wbfk-invisible" at the end of the animation.`
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


/*****************************************************************************************************************************/
/***********************************************        EXIT        **********************************************************/
/*****************************************************************************************************************************/
export type ExitBlockConfig = AnimBlockConfig & {
  exitType: 'display-none' | 'visibility-hidden';
};
// TODO: prevent already hidden blocks from being allowed to use exit animation
export class ExitBlock<TEffectGenerator extends EffectGenerator<ExitBlock, ExitBlockConfig> = EffectGenerator> extends AnimBlock<TEffectGenerator> {
  private exitType: ExitBlockConfig['exitType'] = '' as ExitBlockConfig['exitType'];

  protected get defaultConfig(): Partial<ExitBlockConfig> {
    return {
      commitsStyles: false,
      runGeneratorsNow: true,
      exitType: 'display-none',
    };
  }

  /**@internal*/initialize(effectOptions: EffectOptions<TEffectGenerator>, effectConfig: Partial<ExitBlockConfig> = {}) {
    super.initialize(effectOptions, effectConfig);

    const exitType = effectConfig.exitType ?? this.effectGenerator.config?.exitType ?? this.defaultConfig.exitType!;
    if (exitType !== 'display-none' && exitType !== 'visibility-hidden') {
      throw this.generateError(RangeError, `Invalid 'exitType' config value "${exitType}". Must be "display-none" or "visibility-hidden".`);
    }
    this.exitType = exitType;

    return this;
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

/*****************************************************************************************************************************/
/*********************************************        EMPHASIS        ********************************************************/
/*****************************************************************************************************************************/
export class EmphasisBlock<TEffectGenerator extends EffectGenerator = EffectGenerator> extends AnimBlock<TEffectGenerator> {
  protected get defaultConfig(): Partial<AnimBlockConfig> {
    return {};
  }
}

/*****************************************************************************************************************************/
/**********************************************        MOTION        *********************************************************/
/*****************************************************************************************************************************/
export class MotionBlock<TEffectGenerator extends EffectGenerator = EffectGenerator> extends AnimBlock<TEffectGenerator> {
  protected get defaultConfig(): Partial<AnimBlockConfig> {
    return {
      composite: 'accumulate',
    };
  }
}

/*****************************************************************************************************************************/
/*********************************************        SCROLLER        ********************************************************/
/*****************************************************************************************************************************/
// TODO: implement rewindScrollBehavior: 'prior-user-position' | 'prior-scroll-target' = 'prior-scroll-target'
export class ScrollerBlock<TEffectGenerator extends EffectGenerator = EffectGenerator> extends AnimBlock<TEffectGenerator> {
  protected get defaultConfig(): Partial<AnimBlockConfig> {
    return {
      commitsStyles: false,
    };
  }
}

/*****************************************************************************************************************************/
/********************************************        TRANSITION        *******************************************************/
/*****************************************************************************************************************************/
export type TransitionBlockConfig = AnimBlockConfig & {
  removeInlineStylesOnFinish: boolean;
}
export class TransitionBlock<TEffectGenerator extends EffectGenerator<TransitionBlock, TransitionBlockConfig> = EffectGenerator> extends AnimBlock<TEffectGenerator> {
  // determines whether properties affected by this transition should be removed from inline style upon finishing animation
  private removeInlineStyleOnFinish: boolean = false;

  protected get defaultConfig(): Partial<TransitionBlockConfig> {
    return {};
  }

  /**@internal*/initialize(effectOptions: EffectOptions<TEffectGenerator>, effectConfig: Partial<TransitionBlockConfig> = {}) {
    super.initialize(effectOptions, effectConfig);
    this.removeInlineStyleOnFinish = effectConfig.removeInlineStylesOnFinish ?? this.effectGenerator.config?.removeInlineStylesOnFinish ?? this.defaultConfig.removeInlineStylesOnFinish!;
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

/*****************************************************************************************************************************/
/*****************************************        CONNECTOR SETTER        ****************************************************/
/*****************************************************************************************************************************/
export class ConnectorSetterBlock extends AnimBlock {
  domElem: WbfkConnector;
  previousPointA?: [elemA: Element, xPlacement: ParsedMultiUnitPlacement, yPlacement: ParsedMultiUnitPlacement];
  previousPointB?: [elemB: Element, xPlacement: ParsedMultiUnitPlacement, yPlacement: ParsedMultiUnitPlacement];
  pointA: [elemA: Element, xPlacement: ParsedMultiUnitPlacement, yPlacement: ParsedMultiUnitPlacement] | 'use-preserved';
  pointB: [elemB: Element, xPlacement: ParsedMultiUnitPlacement, yPlacement: ParsedMultiUnitPlacement] | 'use-preserved';

  connectorConfig: WbfkConnectorConfig = {} as WbfkConnectorConfig;
  previousConnectorConfig: WbfkConnectorConfig = {} as WbfkConnectorConfig;
  protected get defaultConfig(): Partial<AnimBlockConfig> {
    return {
      duration: 0,
      commitsStyles: false,
      runGeneratorsNow: true,
      startsNextBlock: true,
    };
  }
  
  constructor(
    connectorElem: WbfkConnector | null | undefined,
    pointA: [elemA: Element | null | undefined, xPlacement: number | MultiUnitPlacementX, yPlacement: number | MultiUnitPlacementY] | ['preserve'],
    pointB: [elemB: Element | null | undefined, xPlacement: number | MultiUnitPlacementX, yPlacement: number | MultiUnitPlacementY] | ['preserve'],
    effectName: string,
    bank: EffectGeneratorBank,
    category: EffectCategory,
    connectorConfig: Partial<WbfkConnectorConfig> = {},
    ) {
    super(connectorElem, effectName, bank, category);

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

/*****************************************************************************************************************************/
/****************************************        CONNECTOR ENTRANCE        ***************************************************/
/*****************************************************************************************************************************/
export class ConnectorEntranceBlock<TEffectGenerator extends EffectGenerator = EffectGenerator> extends AnimBlock<TEffectGenerator> {
  domElem: WbfkConnector;

  protected get defaultConfig(): Partial<AnimBlockConfig> {
    return {
      commitsStyles: false,
      // runGeneratorsNow: true,
    };
  }

  constructor(connectorElem: WbfkConnector | null | undefined, public effectName: string, bank: EffectGeneratorBank, category: EffectCategory) {
    super(connectorElem, effectName, bank, category);

    if (!(connectorElem instanceof WbfkConnector)) { throw this.generateError(CustomErrors.InvalidElementError, `Must pass ${WbfkConnector.name} element.`); }
    this.domElem = connectorElem;
  }

  protected _onStartForward(): void {
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

/*****************************************************************************************************************************/
/******************************************        CONNECTOR EXIT        *****************************************************/
/*****************************************************************************************************************************/
export class ConnectorExitBlock<TEffectGenerator extends EffectGenerator = EffectGenerator> extends AnimBlock<TEffectGenerator> {
  domElem: WbfkConnector;

  protected get defaultConfig(): Partial<AnimBlockConfig> {
    return {
      commitsStyles: false,
      // runGeneratorsNow: true,
    };
  }

  constructor(connectorElem: WbfkConnector | null | undefined, public effectName: string, bank: EffectGeneratorBank, category: EffectCategory) {
    super(connectorElem, effectName, bank, category);

    if (!(connectorElem instanceof WbfkConnector)) { throw this.generateError(CustomErrors.InvalidElementError, `Must pass ${WbfkConnector.name} element.`); }

    this.domElem = connectorElem;
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
