import { AnimBlock, AnimBlockConfig } from "./AnimBlock";
import { AnimationBank, AnimationBankEntry } from "./WebFlik";
import { CustomErrors } from "./utils/errors";
import { equalWithinTol, overrideHidden, parseMultiUnitPlacement, unOverrideHidden } from "./utils/helpers";
import { AnimationCategory, ParsedMultiUnitPlacement, MultiUnitPlacementX, MultiUnitPlacementY } from "./utils/interfaces";

export type WbfkConnectorConfig = {
  pointTrackingEnabled: boolean;
};

/* @ts-ignore */
if (window.CSS.registerProperty) {
  /* @ts-ignore */
  window.CSS.registerProperty({
    name: "--b-marker-opacity",
    syntax: "<number>",
    inherits: true,
    initialValue: '1',
  });

  /* @ts-ignore */
  window.CSS.registerProperty({
    name: "--a-marker-opacity",
    syntax: "<number>",
    inherits: true,
    initialValue: '1',
  });
}

// CHANGE NOTE: Completely get rid of obsolete AnimBlockLineUpdater
export class WbfkConnector extends HTMLElement {
  private static staticId: number = 0;

  private connectorId: number = 0;
  readonly markerIdPrefix: string;
  usesMarkerB: boolean = false;
  usesMarkerA: boolean = false;
  private lineLayer: SVGLineElement;
  private lineMask: SVGLineElement;
  private gBody: SVGGElement;
  private mask: SVGMaskElement;
  get lineElement(): Readonly<SVGLineElement> { return this.lineLayer; }

  pointA: [elemA: Element, xPlacement: ParsedMultiUnitPlacement, yPlacement: ParsedMultiUnitPlacement] = [document.body, [0,0], [0,0]];
  pointB: [elemB: Element, xPlacement: ParsedMultiUnitPlacement, yPlacement: ParsedMultiUnitPlacement] = [document.body, [0,100], [0,100]];
  pointTrackingEnabled: boolean = true;
  private continuousTrackingReqId: number = NaN;

  get ax(): number { return this.lineLayer.x1.baseVal.value; }
  get bx(): number { return this.lineLayer.x2.baseVal.value; }
  get ay(): number { return this.lineLayer.y1.baseVal.value; }
  get by(): number { return this.lineLayer.y2.baseVal.value; }

  set ax(val: number) {
    this.lineLayer.x1.baseVal.value = val;
    this.lineMask.x1.baseVal.value = val;
  }
  set bx(val: number) {
    this.lineLayer.x2.baseVal.value = val;
    this.lineMask.x2.baseVal.value = val;
  }
  set ay(val: number) {
    this.lineLayer.y1.baseVal.value = val;
    this.lineMask.y1.baseVal.value = val;
  }
  set by(val: number) {
    this.lineLayer.y2.baseVal.value = val;
    this.lineMask.y2.baseVal.value = val;
  }

  getBoundingClientRect() {
    return this.gBody.getBoundingClientRect();
  }
  
  constructor() {
    super();
    this.connectorId = WbfkConnector.staticId++;
    const shadow = this.attachShadow({mode: 'open'});

    const markerIdPrefix = `markerArrow--${this.connectorId}`;
    this.markerIdPrefix = markerIdPrefix;
    const maskId = `mask--${this.connectorId}`;
    this.usesMarkerA = this.hasAttribute('a-marker');
    this.usesMarkerB = this.hasAttribute('b-marker');
    this.pointTrackingEnabled = !this.hasAttribute('tracking-disabled');
    const markerWidth: number = Number(this.getAttribute('marker-width')) || 5;
    const markerHeight: number = Number(this.getAttribute('marker-height')) || 7;

    // TODO: In the future, https://github.com/w3c/csswg-drafts/issues/8361 could help prevent <svg> from contributing to overflow
    const htmlString = /*html*/`
      <style>
        :host {
          --a-marker-opacity: 1;
          --b-marker-opacity: 1;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          stroke: black;
          fill: black;
          display: initial;
          line-height: 0 !important;
          overflow: visible !important;
          visibility: hidden !important;
        }
        
        .connector__svg {
          visibility: hidden !important;
          overflow: visible !important;
        }
              
        .connector__g-body {
          visibility: initial;
        }
        
        .connector__mask-group {
          stroke: white !important;
          fill: white !important;
        }
        
        .connector__layer-group {
                  
        }
        
        .connector__line {
          fill: none;
        }
        
        .connector__line--mask {
          stroke-dashoffset: 0 !important;
        }
        
        .connector__line--layer {
          stroke-dasharray: 1 !important;
        }
        
        marker {
          stroke: none;
        }
      
        .connector__line--layer {
          marker-start: url(#${markerIdPrefix}-a--layer);
          marker-end: url(#${markerIdPrefix}-b--layer);
        }

        #${markerIdPrefix}-a--layer {
          opacity: var(--a-marker-opacity);
        }
        #${markerIdPrefix}-b--layer {
          opacity: var(--b-marker-opacity);
        }
      </style>

      <svg class="connector__svg">
        <g class="connector__g-body">
          <mask id="${maskId}" maskUnits="userSpaceOnUse">
            <g class="connector__mask-group">
              ${
                this.usesMarkerA ?
                `<marker id="${markerIdPrefix}-a--mask" markerWidth="${markerWidth}" markerHeight="${markerHeight}" refX="${markerWidth-1}" refY="${markerHeight/2}" orient="auto-start-reverse">
                  <path d="M0,0 L0,${markerHeight} L${markerWidth},${markerHeight/2} L0,0" />
                </marker>` :
                ''
              }
              ${
                this.usesMarkerB ?
                `<marker id="${markerIdPrefix}-b--mask" markerWidth="${markerWidth}" markerHeight="${markerHeight}" refX="${markerWidth-1}" refY="${markerHeight/2}" orient="auto">
                  <path d="M0,0 L0,${markerHeight} L${markerWidth},${markerHeight/2} L0,0" />
                </marker>` :
                ''
              }

              <line
                ${this.usesMarkerA ? `marker-start="url(#${markerIdPrefix}-a--mask)"` : ''}
                ${this.usesMarkerB ? `marker-end="url(#${markerIdPrefix}-b--mask)"` : ''}
                class="connector__line connector__line--mask"
              />
            </g>
          </mask>

          <g mask="url(#${maskId})" class="connector__layer-group">
            ${
              this.usesMarkerA ?
              `<marker id="${markerIdPrefix}-a--layer" markerWidth="${markerWidth}" markerHeight="${markerHeight}" refX="${markerWidth-1}" refY="${markerHeight/2}" orient="auto-start-reverse">
                <path d="M0,0 L0,${markerHeight} L${markerWidth},${markerHeight/2} L0,0" />
              </marker>` :
              ''
            }
            ${
              this.usesMarkerB ?
              `<marker id="${markerIdPrefix}-b--layer" markerWidth="${markerWidth}" markerHeight="${markerHeight}" refX="${markerWidth-1}" refY="${markerHeight/2}" orient="auto">
                <path d="M0,0 L0,${markerHeight} L${markerWidth},${markerHeight/2} L0,0" />
              </marker>` :
              ''
            }

            <line
              class="connector__line connector__line--layer"
              pathLength="1"
            />
          </g>
        </g>
      </svg>
    `;

    const template = document.createElement('template');
    template.innerHTML = htmlString;
    const element = template.content.cloneNode(true);
    shadow.append(element);
    
    this.gBody = shadow.querySelector('.connector__g-body') as SVGGElement;
    this.lineLayer = this.gBody.querySelector('.connector__line--layer') as SVGLineElement;
    this.lineMask = this.gBody.querySelector('.connector__line--mask') as SVGLineElement;
    this.mask = this.gBody.querySelector('mask') as SVGMaskElement;
  }

  updateEndpoints = (/*errorGenerator?: ErrorGenerator*/): void => {
    const pointA = this.pointA;
    const pointB = this.pointB;
    if (!pointA || !pointB) { return; }

    // to properly place the endpoints, we need the positions of their bounding boxes
    
    // CHANGE NOTE: Use offsetParent instead of direct parent to properly get nearest positioned ancestor
    const offsetParent = this.offsetParent;

    // if offsetParent is null, then the connector or an ancestory is invisible (so no point in updating)
    if (!offsetParent) {
      return;
      // this.clearTrackingInterval();
      // const parentElement = this.parentElement;
      // const parentInvisible = parentElement && !parentElement.offsetParent
      //   && (parentElement !== document.documentElement)
      //   && (parentElement !== document.querySelector('body'))
      //   && (getComputedStyle(parentElement).position !== 'fixed');
      // const errorArr = [
      //   `Cannot call updateEndpoints() while the connector or its parent element is invisible.${parentInvisible ? ` In this case, the parent was found to be hidden.` : ''}`,
      //   this.pointTrackingEnabled ? `\nThis connector also has points-tracking enabled (which allows it to continuously update its endpoings), so we have disabled it.` : '',
      //   this.pointTrackingEnabled ? `If this connector does not need to continuously update its endpoints, you can set its 'pointTrackingEnabled' config setting to false to prevent this error.` : '',
      //   this.pointTrackingEnabled && parentInvisible ?
      //     `If this connector needs to continuously update its endpoints, make sure to Exit it if its parent is about to be hidden—this safely pauses the tracking until the connector is visible again.` : '',
      // ]
      // throw errorGenerator ? errorGenerator(ConnectorError, errorArr.join(' ')) : new ConnectorError(errorArr.join(' '));
    }

    // The x and y coordinates of the line need to be with respect to the top left of document
    // Thus, we must subtract the offsetParent element's current top and left from the total offset
    // But because elements start in their parent's Content box (which excludes the border) instead of the Fill area,...
    // (which includes the border), our element's top and left are offset by the offsetParent element's border width with...
    // ...respect to the actual bounding box of the offsetParent. Therefore, we must subtract the offsetParent's border thicknesses as well.
    const {left: offsetParentLeft, top: offsetParentTop} = offsetParent.getBoundingClientRect();
    const connectorLeftOffset = -offsetParentLeft - Number.parseFloat(getComputedStyle(offsetParent).borderLeftWidth);
    const connectorTopOffset = -offsetParentTop - Number.parseFloat(getComputedStyle(offsetParent).borderTopWidth);

    // get the bounding rectangles for A reference element and B reference element
    // CHANGE NOTE: elements are unhidden using override to allow access to bounding box
    // the override class is appended without classList.add() so that multiple applications...
    // of the class do not interfere with each other upon removal
    const [aHidden, bHidden] = [pointA[0].classList.value.includes('wbfk-hidden'), pointB[0].classList.value.includes('wbfk-hidden')];
    if (aHidden) overrideHidden(pointA[0]);
    if (bHidden) overrideHidden(pointB[0]);
    const {left: aLeft, right: aRight, top: aTop, bottom: aBottom} = pointA[0].getBoundingClientRect();
    const {left: bLeft, right: bRight, top: bTop, bottom: bBottom} = pointB[0].getBoundingClientRect();
    if (aHidden) unOverrideHidden(pointA[0]);
    if (bHidden) unOverrideHidden(pointB[0]);

    // change x and y coords of our <svg>'s nested <line> based on the bounding boxes of the A and B reference elements
    // the offset with respect to the reference elements' tops and lefts is calculated using linear interpolation
    const ax = (1 - pointA[1][0]) * aLeft + (pointA[1][0]) * aRight  + pointA[1][1] + connectorLeftOffset;
    const ay = (1 - pointA[2][0]) * aTop  + (pointA[2][0]) * aBottom + pointA[2][1] + connectorTopOffset;
    const bx = (1 - pointB[1][0]) * bLeft + (pointB[1][0]) * bRight  + pointB[1][1] + connectorLeftOffset;
    const by = (1 - pointB[2][0]) * bTop  + (pointB[2][0]) * bBottom + pointB[2][1] + connectorTopOffset;
    let changedX = false;
    let changedY = false;
    if (!equalWithinTol(ax, this.ax)) {
      this.ax = ax;
      changedX = true;
    }
    if (!equalWithinTol(ay, this.ay)) {
      this.ay = ay;
      changedY = true;
    }
    if (!equalWithinTol(bx, this.bx)) {
      this.bx = bx;
      changedX = true;
    }
    if (!equalWithinTol(by, this.by)) {
      this.by = by;
      changedY = true;
    }
    // When modifying the coordinates of the <line> within the <mask>, the mask bounds apparently are not updated.
    // This causes the line to be cut off, so the width, height, and location of the mask need to be changed
    // to properly frame the masked line. 25px of padding are added to account for markers.
    if (changedX) {
      this.mask.width.baseVal.valueAsString = `${Math.abs(bx - ax) + 50}`;
      this.mask.x.baseVal.valueAsString = `${Math.min(ax, bx) - 25}`;
    }
    if (changedY) {
      this.mask.height.baseVal.valueAsString = `${Math.abs(by - ay) + 50}`;
      this.mask.y.baseVal.valueAsString = `${Math.min(ay, by) - 25}`;
    }
  }

  // CHANGE NOTE: Use requestAnimationFrame() loop instead of setInterval() to laglessly update endpoints
  continuouslyUpdateEndpoints = (): void => {
    this.updateEndpoints();
    this.continuousTrackingReqId = window.requestAnimationFrame(this.continuouslyUpdateEndpoints);
  }

  cancelContinuousUpdates (): void {
    window.cancelAnimationFrame(this.continuousTrackingReqId);
  }
}

customElements.define('wbfk-connector', WbfkConnector);

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
