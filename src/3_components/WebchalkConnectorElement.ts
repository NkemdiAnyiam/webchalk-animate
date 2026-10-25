import { CustomErrorClasses } from "../4_utils/errors";
import { equalWithinTol, getBoundingClientRectOfHidden, parseMultiUnitPlacement } from "../4_utils/helpers";
import { DOMElement, MultiUnitOrderedPairString, ParsedMultiUnitPlacement } from "../4_utils/interfaces";
import { ShapeFactories } from "../Webchalk";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(
  /*css*/`:host {
    /* marker opacity property registered in injectGlobals() */
    --marker-a-opacity: 1;
    --marker-b-opacity: 1;
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    stroke: black;
    fill: black;
    display: initial;
    line-height: 0 !important;
    pointer-events: none;
  }
  
  .connector__svg {
    pointer-events: all;
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
    display: none;
    stroke: none;
  }`
);

/**
 * An object containing configuration options for a new {@link WebchalkConnectorElement}.
 * @category Interfaces
 * @interface
 */
export type WebchalkConnectorElementConfig = {
  autoRedrawEnabled: boolean;
};

/**
 * An object containing configuration options to define the styling, location, and behavior of the new connector.
 * 
 * @category Interface
 * @interface
 */
type CreateConnectorConfig = {
  /**
   * A tuple specifying the location in the DOM where the connector should be inserted. If `null`, the connector will not
   * be automatically inserted to the DOM.
   * @defaultValue
   * ```ts
   * ['last-child', document.querySelector('.webchalk-assets-container')]
   * ```
   */
  domLocation: [where: 'before' | 'after' | 'first-child' | 'last-child', element: Element | null | undefined] | null;
  /**
   * If `true`, the endpoints of the connector will continuously update to match any positional changes in the target elements.
   * @remarks
   * If {@link CreateConnectorConfig.domLocation|domLocation} is used to insert the connector close to the target endpoints
   * and neither endpoints will undergo transformations, specifying `false` is appropriate for optimization since the
   * target elements will not be moving with respect to the connector.
   * @defaultValue
   * ```ts
   * true
   * ```
   */
  autoRedrawEnabled: boolean;
  /**
   * An array of CSS classes that will be added to the connector's HTML class attribute.
   */
  cssClasses: string[];
  /**
   * An id that will be applied to the connectors HTML id attribute.
   */
  cssId: string;
  /**
   * An object for adding a marker shape at the connector's points.
   */
  markers: {
    /**
     * An object whose presence indicates to add a marker to point A. The width and height can optionally be set as well.
     * If `null` is provided instead of an object, the marker is removed.
     */
    A?: ConnectorMarkerDimensions | null;
    /**
     * An object whose presence indicates to add a marker to point B. The width and height can optionally be set as well.
     * If `null` is provided instead of an object, the marker is removed.
     */
    B?: ConnectorMarkerDimensions | null;
  }
};

/**
 * An object specifying the width and height of a marker at a point for a {@link WebchalkConnectorElement}.
 * 
 * @category Subtypes
 */
type ConnectorMarkerDimensions = {
  /**
   * A string representing the width of the marker in pixels.
   * Example:
   *  * `{width: '10px'}`
   * 
   * @defaultValue
   * ```ts
   * '5px'
   * ```
   */
  width?: `${number}${'px'}`;
  /**
   * A string representing the height of the marker in pixels.
   * Example:
   *  * `{height: '10px'}`
   * @defaultValue
   * ```ts
   * '7px'
   * ```
   */
  height?: `${number}${'px'}`;
};

export interface DrawConnector {
  /**
   * Factory function for creating a new {@link WebchalkConnectorElement}.
   * By default, the new connector will automatically be attached to the DOM.
   * @param pointA - A {@link ConnectorPointInput} representing the target for point A of the connector.
   * @param pointB - A {@link ConnectorPointInput} representing the target for point B of the connector.
   * @param config - A {@link CreateConnectorConfig} configuration object for defining the behavior, location, and some attributes of the connector.
   * @returns A new {@link WebchalkConnectorElement} instance.
   * 
   * @remarks
   * If `null` is provided for {@link pointA} or {@link pointB}, then the point will be empty and the connector will not be drawn.
   * Points can be added later using {@link WebchalkConnectorElement.setPoints}
   * 
   * @example
   * <!-- EX:S id="drawConnector.example" code-type="ts" -->
   * ```ts
   * const { drawConnector } = webchalk.shapeFactories;
   * 
   * // SELECT ELEMENTS FROM THE SCREEN
   * const square = document.querySelector('.square');
   * const circle = document.querySelector('.circle');
   * 
   * // CREATE VARIOUS CONNECTORS
   * // Creates a connector and immediately displays it on the screen.
   * // It connects the center points of the two selected elements (presumably a square and circle).
   * const conn = drawConnector([square, '(center, middle)'], [circle, '(center, middle)']);
   * 
   * // Creates a connector that also gets added to the screen, but it doesn't point to anything.
   * const connEmpty = drawConnector(null, null);
   * // The endpoints can be set later using connEmpty.setPoints() or ConnectorEntrance().
   * connEmpty.setPoints({A: [square, '(center, bottom + 20px)'], B: [circle, '(20% + 30px, 50px)']});
   * 
   * // A configuration object can be used to configure the connector.
   * // For example, the default insertion location can be changed with the {domLocation:} option.
   * const connModified = drawConnector([square, '(center, top)'], [circle, '(center, top)'], {
   *   cssClasses: ['cool-styling', 'my-css-class', 'another-class'],
   *   domLocation: ['first-child', document.querySelector('.my-container')],
   *   autoRedrawEnabled: false, // prevents connector from following the two elements if they move
   * });
   * ```
   * <!-- EX:E id="drawConnector.example" -->
   */
  drawConnector(
    pointA: ConnectorPointInput | null,
    pointB: ConnectorPointInput | null,
    config?: Partial<CreateConnectorConfig>
  ): WebchalkConnectorElement;
}

/**
 * A tuple representing an endpoint for a {@link WebchalkConnectorElement}. Returned by {@link WebchalkConnectorElement.getPoints}
 *  * The first entry is the element that will be pointed at.
 *  * The second entry is a string ({@link MultiUnitOrderedPairString}) representing the offset of the point with respect to the element.
 * 
 * @see {@link WebchalkConnectorElement.getPoints}
 */
export type ConnectorPoint = [element: DOMElement, placement: MultiUnitOrderedPairString];

/**
 * A tuple representing an endpoint for a {@link WebchalkConnectorElement}. Used in {@link ShapeFactories.drawConnector}.
 *  * The first entry of the tuple is the element that will be pointed at.
 *  * The second entry of the tuple is a string ({@link MultiUnitOrderedPairString})
 * representing the offset of the point with respect to the element.
 * 
 * @see {@link ShapeFactories.drawConnector}
 */
export type ConnectorPointInput = [element: Element | null | undefined, placement: MultiUnitOrderedPairString];

export class WebchalkConnectorElement extends HTMLElement {
  /**@internal*/ static addToCustomElementRegistry() { customElements.define('webchalk-connector', WebchalkConnectorElement); }
  private static staticId: number = 0;
  private static observedAttributes = ['tracking-disabled', 'marker-a', 'marker-b'];

  /** @see {@link ShapeFactories.drawConnector} */
  static create<T extends Parameters<DrawConnector['drawConnector']>>(pointA: T[0], pointB: T[1], config: T[2] = {}): WebchalkConnectorElement {
    const newConnector = new WebchalkConnectorElement();
    newConnector.setPoints({A: pointA, B: pointB});

    // handle config
    const {
      autoRedrawEnabled = true,
      cssClasses = [],
      cssId,
      markers,
      domLocation = ['last-child', document.querySelector('.webchalk-assets-container')],
    } = config;

    newConnector.autoRedrawEnabled = autoRedrawEnabled;
    newConnector.classList.add(...cssClasses);
    if (cssId) { newConnector.id = cssId; }
    if (markers) { newConnector.setMarkers(markers); }

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
    }

    return newConnector;
  }

  private connectorId: number = 0;
  readonly markerIdPrefix: string;
  get usesMarkerA(): boolean {
    return this.hasAttribute('marker-a') && this.getAttribute('marker-a') !== 'false';
  }
  set usesMarkerA(usesMarkerA: boolean) {
    if (usesMarkerA) { this.setAttribute('marker-a', 'true'); }
    else { this.removeAttribute('marker-a'); }
  }
  get usesMarkerB(): boolean {
    return this.hasAttribute('marker-b') && this.getAttribute('marker-b') !== 'false';
  }
  set usesMarkerB(usesMarkerB: boolean) {
    if (usesMarkerB) { this.setAttribute('marker-b', 'true'); }
    else { this.removeAttribute('marker-b'); }
  }
  private lineLayer: SVGLineElement;
  private lineMask: SVGLineElement;
  private gBody: SVGGElement;
  private mask: SVGMaskElement;
  get lineElement(): Readonly<SVGLineElement> { return this.lineLayer; }

  private pointAComputed: [elemA: DOMElement, xPlacement: ParsedMultiUnitPlacement, yPlacement: ParsedMultiUnitPlacement] | null = null;
  private pointBComputed: [elemB: DOMElement, xPlacement: ParsedMultiUnitPlacement, yPlacement: ParsedMultiUnitPlacement] | null = null;
  private pointA: ConnectorPoint | null = null;
  private pointB: ConnectorPoint | null = null;
  get autoRedrawEnabled(): boolean { return !this.hasAttribute('tracking-disabled') || this.getAttribute('tracking-disabled') === 'false'; };
  set autoRedrawEnabled(trackingEnabled: boolean) {
    if (trackingEnabled) { this.removeAttribute('tracking-disabled'); }
    else { this.setAttribute('tracking-disabled', 'true'); }
  }
  private haltContinuousUpdates = false;
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

    // TODO: In the future, https://github.com/w3c/csswg-drafts/issues/8361 could help prevent <svg> from contributing to overflow
    const htmlString = /*html*/`
      <style>
        .connector__line--layer {
          marker-start: url(#${markerIdPrefix}-a--layer);
          marker-end: url(#${markerIdPrefix}-b--layer);
        }

        #${markerIdPrefix}-a--layer {
          opacity: var(--marker-a-opacity);
        }
        #${markerIdPrefix}-b--layer {
          opacity: var(--marker-b-opacity);
        }

        :host([marker-a]) marker[id^=${markerIdPrefix}-a] {
          display: revert;
        }
        :host([marker-b]) marker[id^=${markerIdPrefix}-b] {
          display: revert;
        }
      </style>

      <svg class="connector__svg">
        <g class="connector__g-body">
          <mask id="${maskId}" maskUnits="userSpaceOnUse">
            <g class="connector__mask-group">
              <marker id="${markerIdPrefix}-a--mask" orient="auto-start-reverse"></marker>
              <marker id="${markerIdPrefix}-b--mask" orient="auto"></marker>

              <line
                marker-start="url(#${markerIdPrefix}-a--mask)"
                marker-end="url(#${markerIdPrefix}-b--mask)"
                class="connector__line connector__line--mask"
              />
            </g>
          </mask>

          <g mask="url(#${maskId})" class="connector__layer-group">
            <marker id="${markerIdPrefix}-a--layer" orient="auto-start-reverse"></marker>
            <marker id="${markerIdPrefix}-b--layer" orient="auto"></marker>

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

    this.setMarkers({
      ...(this.usesMarkerA ? {A: {}} : {}),
      ...(this.usesMarkerB ? {B: {}} : {}),
    }
    );
    this.checkInlinePoints();
  }

  private attributeChangedCallback(attrName: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) { return; }

    switch(attrName) {
      case 'tracking-disabled':
        if (newValue === null || newValue === 'false') {
          this.resumeAutoRedraw();
        }
        else {
          this.pauseAutoRedraw();
        }
        break;

      // case 'marker-a':
      //   if (newValue === null || newValue === 'false') {
      //     this.shadowRoot?.getElementById(`${this.markerIdPrefix}-a--layer`)?.style.setProperty('display', 'none');
      //     this.shadowRoot?.getElementById(`${this.markerIdPrefix}-a--mask`)?.style.setProperty('display', 'none');
      //   }
      //   else {
      //     this.shadowRoot?.getElementById(`${this.markerIdPrefix}-a--layer`)?.style.removeProperty('display');
      //     this.shadowRoot?.getElementById(`${this.markerIdPrefix}-a--mask`)?.style.removeProperty('display');
      //   }
      //   break;

      // case 'marker-b':
      //   if (newValue === null || newValue === 'false') {
      //     this.shadowRoot?.getElementById(`${this.markerIdPrefix}-a--layer`)?.style.setProperty('display', 'none');
      //     this.shadowRoot?.getElementById(`${this.markerIdPrefix}-a--mask`)?.style.setProperty('display', 'none');
      //   }
      //   else {
      //     this.shadowRoot?.getElementById(`${this.markerIdPrefix}-a--layer`)?.style.removeProperty('display');
      //     this.shadowRoot?.getElementById(`${this.markerIdPrefix}-a--mask`)?.style.removeProperty('display');
      //   }
      //   break;
    }
  }

  private connectedCallback() {
    if (this.autoRedrawEnabled) { this.resumeAutoRedraw(); }
    else { this.redraw(); }
  }

  private disconnectedCallback() {
    this.pauseAutoRedraw();
  }

  /**
   * Checks to see if the connector was defined with attributes specifying what points to use and then applies them.
   */
  private checkInlinePoints() {
    const A = this.checkInlinePointsHelper('A');
    const B = this.checkInlinePointsHelper('B');
    if (A && B) {
      this.setPoints({A: A, B: B});
    }
  }

  private checkInlinePointsHelper(pointLetter: string): [Element, MultiUnitOrderedPairString] | null {
    const pointSpecifier = this.getAttribute(`point-${pointLetter.toLowerCase()}`);
    if (!pointSpecifier) { return null; }
    
    // example: ".first-block, (left, 20% + 30px)"
    const matchPointFormat = pointSpecifier.match(/(.+),\s*(\(.+\))/);
    if (!matchPointFormat) { throw new CustomErrorClasses.InvalidConnectorError(``); }

    const [selector, ordPair] = matchPointFormat.slice(1) as [string, MultiUnitOrderedPairString];

    const targElem = document.querySelector(selector);
    if (!targElem) { throw new CustomErrorClasses.InvalidConnectorError(''); }

    return [targElem, ordPair];
  }

  /**
   * Sets or removes visual markers for the specified points of the connector using either {@link ConnectorMarkerDimensions} to set a marker or `null` to remove a marker.
   * @param newMarkers - An object that indicates which points to edit. Unspecified points are not changed.
   */
  setMarkers(newMarkers: CreateConnectorConfig['markers']) {
    const {
      A, B
    } = newMarkers;

    if (A) {
      this.usesMarkerA = true;
      this.setMarkersHelper(A, 'A');
    }
    else if (A === null) {
      this.usesMarkerA = false;
    }

    if (B) {
      this.usesMarkerB = true;
      this.setMarkersHelper(B, 'B');
    }
    else if (B === null) {
      this.usesMarkerB = false;
    }
  }

  private setMarkersHelper(dimensions: ConnectorMarkerDimensions, letter: 'A' | 'B') {
    const capital = letter.toUpperCase() as Uppercase<typeof letter>;
    const lower = letter.toLowerCase() as Lowercase<typeof letter>;

    if (dimensions.width) { this.setAttribute('marker-a-width', dimensions.width); }
    if (dimensions.height) { this.setAttribute('marker-a-height', dimensions.height); }
    const markerWidth = Number.parseFloat(this.getAttribute('marker-a-width') ?? this.getAttribute('marker-width') ?? '5px');
    const markerHeight = Number.parseFloat(this.getAttribute('marker-a-height') ?? this.getAttribute('marker-height') ?? '7px');
    
    const oldMarkerEl = this.gBody.querySelector(`marker#${this.markerIdPrefix}-${lower}--layer`) as SVGMarkerElement;
    const newMarkerAStr = /*html*/`
      <marker id="${this.markerIdPrefix}-${lower}--layer" markerWidth="${markerWidth}" markerHeight="${markerHeight}"
      refX="${markerWidth-1}" refY="${markerHeight/2}" orient=${capital === 'A' ? 'auto-start-reverse' : 'auto'}>
        <path d="M0,0 L0,${markerHeight} L${markerWidth},${markerHeight/2} L0,0" />
      </marker>
    `;
    oldMarkerEl.insertAdjacentHTML('afterend', newMarkerAStr);
    oldMarkerEl.remove();
    
    const oldMarkerAMaskEl = this.gBody.querySelector(`marker#${this.markerIdPrefix}-${lower}--mask`) as SVGMarkerElement;
    const newMarkerAMaskStr = /*html*/`
      <marker id="${this.markerIdPrefix}-${lower}--mask" markerWidth="${markerWidth}" markerHeight="${markerHeight}"
      refX="${markerWidth-1}" refY="${markerHeight/2}" orient=${capital === 'A' ? 'auto-start-reverse' : 'auto'}>
        <path d="M0,0 L0,${markerHeight} L${markerWidth},${markerHeight/2} L0,0" />
      </marker>
    `;
    oldMarkerAMaskEl.insertAdjacentHTML('afterend', newMarkerAMaskStr);
    oldMarkerAMaskEl.remove();
  }

  /**
   * Removes the markers from the specified points of the connector.
   * This is equivalent to calling {@link WebchalkConnectorElement.setMarkers | setMarkers()}
   * and setting the specified markers to `null`.
   * @param points - A string indicating which points should have their markers removed.
   */
  removeMarkers(points: 'A' | 'B' | 'both') {
    switch(points) {
      case "A":
        this.setMarkers({A: null});
        break;
      case "B":
        this.setMarkers({B: null});
        break;
      case "both":
        this.setMarkers({A: null, B: null});
        break;
      default: throw new RangeError(`Invalid string value "${points}". Must specify "A", "B", or "both".`);
    }
  }

  /**
   * Returns an object containing the connector's points.
   * @returns An object containing each {@link ConnectorPoint} for the connector.
   */
  getPoints() {
    return {
      A: this.pointA ? [...this.pointA] as ConnectorPoint : null,
      B: this.pointB ? [...this.pointB] as ConnectorPoint : null
    }
  }

  /**
   * Sets or removes the specified points of the connector using either {@link ConnectorPointInput} to set a point or `null` to remove a point.
   * @param newPoints - An object that indicates which points to edit. Unspecified points are not changed.
   * @param options - An options object specifying additional configuration options.
   * @param options.updateNow - If `true`, the connector will visually update immediately after the new points are set.
   * @returns The now current points of the connector (result of {@link WebchalkConnectorElement.getPoints | getPoints()}).
   */
  setPoints(newPoints: {
    A?: ConnectorPointInput | null;
    B?: ConnectorPointInput | null;
  }, options: {
    /**
     * If `true`, the connector will visually update after the new points are set.
     * @defaultValue
     * ```ts
     * true
     * ```
    */
    updateNow?: boolean;
  } = {}) {
    const {A, B} = newPoints;

    // validate endpoints
    if (A && !(A[0] instanceof Element)) {
      throw new CustomErrorClasses.InvalidElementError(`Point A was specified, but the provided element (${A[0]}) is not a valid element.`);    
    }
    else if (A === null) {
      this.pointAComputed = this.pointA = null;
    }
    if (B && !(B[0] instanceof Element)) {
      throw new CustomErrorClasses.InvalidElementError(`Point B was specified, but the provided element (${B[0]}) is not a valid element.`);
    }
    else if (B === null) {
      this.pointBComputed = this.pointB = null;
    }

    if (A) {
      this.pointA = [...A] as [DOMElement, MultiUnitOrderedPairString]; // we already know A[0] must be a valid element by here
      this.pointAComputed = [A[0] as DOMElement, ...parseMultiUnitPlacement(A[1])];
    }
    if (B) {
      this.pointB = [...B] as [DOMElement, MultiUnitOrderedPairString];
      this.pointBComputed = [B[0] as DOMElement, ...parseMultiUnitPlacement(B[1])];
    }

    const {updateNow = true} = options;
    if (!updateNow) { this.pauseAutoRedraw(); }
    else {
      if (this.autoRedrawEnabled) { this.resumeAutoRedraw(); }
      else { this.redraw(); }
    }

    return this.getPoints();
  }

  /**
   * Sets the specified points of the connector to `null`. This is equivalent to calling {@link WebchalkConnectorElement.setPoints | setPoints()}
   * and setting the specified points to `null`.
   * @param points - A string indicating which points to remove.
   */
  removePoints(points: 'A' | 'B' | 'both') {
    switch(points) {
      case "A":
        this.setPoints({A: null});
        break;
      case "B":
        this.setPoints({B: null});
        break;
      case "both":
        this.setPoints({A: null, B: null});
        break;
      default: throw new RangeError(`Invalid string value "${points}". Must specify "A", "B", or "both".`);
    }
  }

  /**
   * Recomputes the positions of the connector's points and updates them accordingly.
   * @returns 
   */
  redraw = (): void => {
    const pointA = this.pointAComputed;
    const pointB = this.pointBComputed;
    if (!this.isConnected) {
      this.pauseAutoRedraw();
      return;
    }
    if (!pointA || !pointB || !pointA[0].isConnected || !pointB[0].isConnected) {
      this.ax = this.ay = this.bx = this.by = 0;
      // this.pauseAutoRedraw();
      return;
    }

    // to properly place the endpoints, we need the positions of their bounding boxes
    
    // CHANGE NOTE: Use offsetParent instead of direct parent to properly get nearest positioned ancestor
    const offsetParent = this.offsetParent;

    // if offsetParent is null, then the connector or an ancestor is invisible (so no point in updating)
    if (!offsetParent) { return; }

    // The x and y coordinates of the line need to be with respect to the left top of document.
    // Thus, we must subtract the offsetParent element's current left and top from the total offset.
    // But because elements start in their parent's Content box (which excludes the border) instead of the Fill area,
    // (which includes the border), our element's left and top are offset by the offsetParent element's border width with
    // respect to the actual bounding box of the offsetParent. Therefore, we must subtract the offsetParent's border thicknesses as well.
    const {left: offsetParentLeft, top: offsetParentTop} = offsetParent.getBoundingClientRect();
    const connectorLeftOffset = -offsetParentLeft - Number.parseFloat(getComputedStyle(offsetParent).borderLeftWidth);
    const connectorTopOffset = -offsetParentTop - Number.parseFloat(getComputedStyle(offsetParent).borderTopWidth);

    // Get the bounding rectangles for A reference element and B reference element.
    // Elements are forcefully unhidden using override to allow access to bounding box.
    // The override class is appended without classList.add() so that multiple applications
    // of the class do not interfere with each other upon removal.
    const {left: aLeft, right: aRight, top: aTop, bottom: aBottom} = getBoundingClientRectOfHidden(pointA[0]);
    const {left: bLeft, right: bRight, top: bTop, bottom: bBottom} = getBoundingClientRectOfHidden(pointB[0]);

    // Change x and y coords of our <svg>'s nested <line> based on the bounding boxes of the A and B reference elements.
    // The offset with respect to the reference elements' lefts and tops is calculated using linear interpolation.
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

  /**
   * Tells the connector to continuously call {@link WebchalkConnectorElement.redraw | redraw()} (meaning the points will automatically
   * update if the target elements change position).
   *  * This method is automatically called whenever the connector is reattached to the DOM.
   * 
   * @remarks
   * This is generally activated by default because it is useful for keeping connectors updated when elements change positions
   * on the screen. But for deliberate optimization, it can be completely disabled
   * by setting {@link WebchalkConnectorElement.autoRedrawEnabled | autoRedrawEnabled} to `false`.
   */
  resumeAutoRedraw(): void {
    if (!this.autoRedrawEnabled) {
      throw new CustomErrorClasses.InvalidConnectorError(`Cannot initiate automatic point tracking while {autoRedrawEnabled: false}.`);
    }
    if (!isNaN(this.continuousTrackingReqId)) { this.pauseAutoRedraw(); }
    this.haltContinuousUpdates = false;
    this.redrawRAF();
  }

  private redrawRAF = (): void => {
    if (this.haltContinuousUpdates) { return; }
    this.redraw();
    this.continuousTrackingReqId = window.requestAnimationFrame(this.redrawRAF);
  }

  /**
   * Tells the connector to stop continuously calling {@link WebchalkConnectorElement.redraw | redraw()} (meaning the points will not
   * be updated even if the target elements change position).
   *  * This method is automatically called whenever the connector is removed from the DOM.
   * @returns 
   */
  pauseAutoRedraw(): void {
    if (isNaN(this.continuousTrackingReqId)) { return; }
    this.haltContinuousUpdates = true;
    window.cancelAnimationFrame(this.continuousTrackingReqId);
    this.continuousTrackingReqId = NaN;
  }
}
