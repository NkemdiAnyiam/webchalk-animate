import { CustomErrorClasses } from "../4_utils/errors";
import { equalWithinTol, getBoundingClientRectOfHidden, parseMultiUnitPlacement } from "../4_utils/helpers";
import { DOMElement, MultiUnitPlacementX, MultiUnitPlacementY, ParsedMultiUnitPlacement } from "../4_utils/interfaces";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(
  /*css*/`:host {
    /* marker opacity property registered in injectGlobals() */
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
  }`
);

export type WebchalkConnectorElementConfig = {
  pointTrackingEnabled: boolean;
};

type CreateConnectorConfig = {
  /**
   * A tuple specifying the location in the DOM where the connector should be inserted. If `null`, the connector will not
   * be automatically inserted to the DOM.
   * @defaultValue
   * ```ts
   * ['last-child', document.querySelector('.webchalk-assets-container')]
   * ```
   */
  domLocation?: [where: 'before' | 'after' | 'first-child' | 'last-child', element: Element | null | undefined] | null;
  /**
   * If `true`, the endpoints of the connector will continuously update to match any positional changes in the target elements.
   * @remarks
   * If {@link CreateConnectorConfig.domLocation|domLocation} is used to insert the connector close to the target endpoints
   * and neither endpoints will undergo transformations, specifying `false` is appropriate for optimization since the target elements will
   * not be moving with respect to the connector.
   * @defaultValue
   * ```ts
   * true
   * ```
   */
  pointTrackingEnabled?: boolean; // TODO: rename to something simple like `tracking`
  /**
   * An array of CSS classes that will be added to the connector's HTML class attribute.
   */
  cssClasses?: string[];
  /**
   * An id that will be applied to the connectors HTML id attribute.
   */
  cssId?: string;
};

export interface CreateConnector {
  /**
   * Creates a new {@link WebchalkConnectorElement} and (by default) attached it to the DOM.
   * @param pointA - The element target for endpoint A of the connector.
   * @param pointB - The element target for endpoint B of the connector.
   * @param config - A configuration object for defining the behavior, location, and some attributes of the connector.
   * @returns A new {@link WebchalkConnectorElement} instance.
   */
  createConnector(
    // TODO: prohibit `number` as an option
    pointA: [elemA: Element | null | undefined, xPlacement: number | MultiUnitPlacementX, yPlacement: number | MultiUnitPlacementY],
    pointB: [elemB: Element | null | undefined, xPlacement: number | MultiUnitPlacementX, yPlacement: number | MultiUnitPlacementY],
    config: CreateConnectorConfig
  ): WebchalkConnectorElement;
}

export class WebchalkConnectorElement extends HTMLElement {
  /**@internal*/ static addToCustomElementRegistry() { customElements.define('webchalk-connector', WebchalkConnectorElement); }
  private static staticId: number = 0;

  static create<T extends Parameters<CreateConnector['createConnector']>>(pointA: T[0], pointB: T[1], config: T[2]): WebchalkConnectorElement {
    // validate endpoints
    if (!(pointA[0] instanceof Element)) { throw new CustomErrorClasses.InvalidElementError(`Point A element must not be null or undefined.`); }
    if (!(pointB[0] instanceof Element)) { throw new CustomErrorClasses.InvalidElementError(`Point B element must not be null or undefined.`); }
    
    // create connector and set endpoints
    const newConnector = new WebchalkConnectorElement();
    newConnector.pointA = [pointA[0] as DOMElement, parseMultiUnitPlacement(pointA[1], 'horizontal'), parseMultiUnitPlacement(pointA[2], 'vertical')];
    newConnector.pointB = [pointB[0] as DOMElement, parseMultiUnitPlacement(pointB[1], 'horizontal'), parseMultiUnitPlacement(pointB[2], 'vertical')];

    // handle config
    const {
      domLocation = ['last-child', document.querySelector('.webchalk-assets-container')],
      cssClasses = [],
      cssId,
      pointTrackingEnabled = true,
    } = config;

    newConnector.pointTrackingEnabled = pointTrackingEnabled;
    newConnector.classList.add(...cssClasses);
    if (cssId) { newConnector.id = cssId; }

    // insert connector into DOM
    if (domLocation !== null) {
      const [insLocation, insRefPoint] = domLocation;
      if (!insRefPoint) { throw new CustomErrorClasses.InvalidElementError(`The DOM element used as an insertion reference point must not be null or undefined.`); }
      let where = '' as InsertPosition;

      switch(insLocation) {
        case "before": where = 'beforebegin'; break;
        case "after": where = 'afterend'; break;
        case "first-child": where = 'afterbegin'; break;
        case "last-child": where = 'beforeend'; break;
        default: throw new RangeError(`Invalid insertion location "${insLocation}". Must be "before", "first-child", "last-child", or "after".`);
      }

      insRefPoint.insertAdjacentElement(where, newConnector);
      
      if (pointTrackingEnabled) { newConnector.continuouslyUpdateEndpoints(); }
      else { newConnector.updateEndpoints(); }
    }

    return newConnector;
  }

  private connectorId: number = 0;
  readonly markerIdPrefix: string;
  usesMarkerB: boolean = false;
  usesMarkerA: boolean = false;
  private lineLayer: SVGLineElement;
  private lineMask: SVGLineElement;
  private gBody: SVGGElement;
  private mask: SVGMaskElement;
  get lineElement(): Readonly<SVGLineElement> { return this.lineLayer; }

  pointA: [elemA: DOMElement, xPlacement: ParsedMultiUnitPlacement, yPlacement: ParsedMultiUnitPlacement] = [document.body, [0,0], [0,0]];
  pointB: [elemB: DOMElement, xPlacement: ParsedMultiUnitPlacement, yPlacement: ParsedMultiUnitPlacement] = [document.body, [0,100], [0,100]];
  pointTrackingEnabled: boolean = true;
  private continuousTrackingReqId: number = NaN;

  get ax(): number { return this.lineLayer.x1.baseVal.value; }
  get bx(): number { return this.lineLayer.x2.baseVal.value; }
  get ay(): number { return this.lineLayer.y1.baseVal.value; }
  get by(): number { return this.lineLayer.y2.baseVal.value; }

  private set ax(val: number) {
    this.lineLayer.x1.baseVal.value = val;
    this.lineMask.x1.baseVal.value = val;
  }
  private set bx(val: number) {
    this.lineLayer.x2.baseVal.value = val;
    this.lineMask.x2.baseVal.value = val;
  }
  private set ay(val: number) {
    this.lineLayer.y1.baseVal.value = val;
    this.lineMask.y1.baseVal.value = val;
  }
  private set by(val: number) {
    this.lineLayer.y2.baseVal.value = val;
    this.lineMask.y2.baseVal.value = val;
  }

  getBoundingClientRect() {
    return this.gBody.getBoundingClientRect();
  }
  
  constructor() {
    super();
    this.connectorId = WebchalkConnectorElement.staticId++;
    const shadow = this.attachShadow({mode: 'open'});
    shadow.adoptedStyleSheets = [stylesheet];

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

  resetEndpoints() {
    this.pointA = [document.body, [0,0], [0,0]];
    this.pointB = [document.body, [0,100], [0,100]];
  }

  updateEndpoints = (/*errorGenerator?: ErrorGenerator*/): void => {
    const pointA = this.pointA;
    const pointB = this.pointB;
    if (!pointA || !pointB) {
      console.warn(`This connector is missing at least one point and thus cannot be updated.`);
      this.cancelContinuousUpdates();
      return;
    }

    // to properly place the endpoints, we need the positions of their bounding boxes
    
    // CHANGE NOTE: Use offsetParent instead of direct parent to properly get nearest positioned ancestor
    const offsetParent = this.offsetParent;

    // if offsetParent is null, then the connector or an ancestry is invisible (so no point in updating)
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
      //   this.pointTrackingEnabled ? `\nThis connector also has points-tracking enabled (which allows it to continuously update its endpoints), so we have disabled it.` : '',
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
    const {left: aLeft, right: aRight, top: aTop, bottom: aBottom} = getBoundingClientRectOfHidden(pointA[0]);
    const {left: bLeft, right: bRight, top: bTop, bottom: bBottom} = getBoundingClientRectOfHidden(pointB[0]);

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

  continuouslyUpdateEndpoints(): void {
    if (!isNaN(this.continuousTrackingReqId)) { return; }
    this.continuouslyUpdateEndpointsRAF();
  }

  continuouslyUpdateEndpointsRAF = (): void => {
    this.updateEndpoints();
    this.continuousTrackingReqId = window.requestAnimationFrame(this.continuouslyUpdateEndpointsRAF);
  }

  cancelContinuousUpdates(): void {
    if (isNaN(this.continuousTrackingReqId)) { return; }
    window.cancelAnimationFrame(this.continuousTrackingReqId);
    this.continuousTrackingReqId = NaN;
  }
}
