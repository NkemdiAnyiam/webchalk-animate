import { AnimBlock, AnimBlockConfig } from "./AnimBlock";
import { GeneratorParams, AnimationBank, AnimationBankEntry } from "./WebFlik";
import { CustomErrors, errorTip } from "./utils/errors";
import { parseMultiUnitPlacement } from "./utils/helpers";
import { AnimationCategory, ParsedMultiUnitPlacement, MultiUnitPlacementX, MultiUnitPlacementY } from "./utils/interfaces";
import { WbfkConnector, WbfkConnectorConfig } from "./WbfkConnector";

/*****************************************************************************************************************************/
/*********************************************        ENTRANCE        ********************************************************/
/*****************************************************************************************************************************/
export type EntranceBlockConfig = AnimBlockConfig & {
  hideNowType: 'display-none' | 'visibility-hidden' | null;
};
export class EntranceBlock<TBankEntry extends AnimationBankEntry<EntranceBlock, EntranceBlockConfig> = AnimationBankEntry> extends AnimBlock<TBankEntry> {
  private backwardsHidingMethod: ExitBlockConfig['exitType'] = '' as ExitBlockConfig['exitType'];

  protected get defaultConfig(): Partial<EntranceBlockConfig> {
    return {
      commitsStyles: false,
      runGeneratorsNow: true,
      hideNowType: null,
    };
  }

  /**@internal*/initialize(animArgs: GeneratorParams<TBankEntry>, userConfig: Partial<EntranceBlockConfig> = {}) {
    super.initialize(animArgs, userConfig);

    const hideNow = userConfig.hideNowType ?? this.bankEntry.config?.hideNowType ?? this.defaultConfig.hideNowType!;
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
export class ExitBlock<TBankEntry extends AnimationBankEntry<ExitBlock, ExitBlockConfig> = AnimationBankEntry> extends AnimBlock<TBankEntry> {
  private exitType: ExitBlockConfig['exitType'] = '' as ExitBlockConfig['exitType'];

  protected get defaultConfig(): Partial<ExitBlockConfig> {
    return {
      commitsStyles: false,
      runGeneratorsNow: true,
      exitType: 'display-none',
    };
  }

  /**@internal*/initialize(animArgs: GeneratorParams<TBankEntry>, userConfig: Partial<ExitBlockConfig> = {}) {
    super.initialize(animArgs, userConfig);

    const exitType = userConfig.exitType ?? this.bankEntry.config?.exitType ?? this.defaultConfig.exitType!;
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
export class EmphasisBlock<TBankEntry extends AnimationBankEntry = AnimationBankEntry> extends AnimBlock<TBankEntry> {
  protected get defaultConfig(): Partial<AnimBlockConfig> {
    return {};
  }
}

/*****************************************************************************************************************************/
/**********************************************        MOTION        *********************************************************/
/*****************************************************************************************************************************/
export class MotionBlock<TBankEntry extends AnimationBankEntry = AnimationBankEntry> extends AnimBlock<TBankEntry> {
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
export class ScrollerBlock<TBankEntry extends AnimationBankEntry = AnimationBankEntry> extends AnimBlock<TBankEntry> {
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
export class TransitionBlock<TBankEntry extends AnimationBankEntry<TransitionBlock, TransitionBlockConfig> = AnimationBankEntry> extends AnimBlock<TBankEntry> {
  // determines whether properties affected by this transition should be removed from inline style upon finishing animation
  private removeInlineStyleOnFinish: boolean = false;

  protected get defaultConfig(): Partial<TransitionBlockConfig> {
    return {};
  }

  /**@internal*/initialize(animArgs: GeneratorParams<TBankEntry>, userConfig: Partial<TransitionBlockConfig> = {}) {
    super.initialize(animArgs, userConfig);
    this.removeInlineStyleOnFinish = userConfig.removeInlineStylesOnFinish ?? this.bankEntry.config?.removeInlineStylesOnFinish ?? this.defaultConfig.removeInlineStylesOnFinish!;
    return this;
  }

  protected _onFinishForward(): void {
    if (this.removeInlineStyleOnFinish) {
      const keyframe = this.animArgs[0] as Keyframe;
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
    animName: string,
    bank: AnimationBank,
    category: AnimationCategory,
    connectorConfig: Partial<WbfkConnectorConfig> = {},
    ) {
    super(connectorElem, animName, bank, category);

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
export class ConnectorEntranceBlock<TBankEntry extends AnimationBankEntry = AnimationBankEntry> extends AnimBlock<TBankEntry> {
  domElem: WbfkConnector;

  protected get defaultConfig(): Partial<AnimBlockConfig> {
    return {
      commitsStyles: false,
      // runGeneratorsNow: true,
    };
  }

  constructor(connectorElem: WbfkConnector | null | undefined, public animName: string, bank: AnimationBank, category: AnimationCategory) {
    super(connectorElem, animName, bank, category);

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
export class ConnectorExitBlock<TBankEntry extends AnimationBankEntry = AnimationBankEntry> extends AnimBlock<TBankEntry> {
  domElem: WbfkConnector;

  protected get defaultConfig(): Partial<AnimBlockConfig> {
    return {
      commitsStyles: false,
      // runGeneratorsNow: true,
    };
  }

  constructor(connectorElem: WbfkConnector | null | undefined, public animName: string, bank: AnimationBank, category: AnimationCategory) {
    super(connectorElem, animName, bank, category);

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
