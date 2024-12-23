import { CustomErrors } from "./errors";
import { CssLength, CssXAlignment, CssYAlignment, ScrollingOptions, ParsedMultiUnitPlacement, MultiUnitPlacementX, MultiUnitPlacementY, StyleProperty } from "./interfaces";
import { KeyOf, PickFromArray } from "./utilityTypes";

export function asserter<T extends unknown>(val: T, tar: any): T | undefined {
  return val === tar ? val : undefined;
}

export function xor(a: unknown, b: unknown) {
  return ( a || b ) && !( a && b );
}

export function xnor(a: unknown, b: unknown) {
  return !xor(a, b);
}

export function nor(a: unknown, b: unknown) {
  return !(a || b);
}

export const equalWithinTol = (numA: number, numB: number): boolean => Math.abs(numA - numB) < 0.001;
export const mergeArrays = <T>(...arrays: (Array<T> | undefined)[]): Array<T> => Array.from(new Set(new Array<T>().concat(...arrays.filter(arr => arr !== undefined))));
export function findLastIndex<T>(array: Array<T>, predicate: (value: T, index: number, obj: T[]) => boolean): number {
  let l = array.length;
  while (l--) {
    if (predicate(array[l], l, array)) { return l; }
  }
  return -1;
}
export const negateNumString = (str: string): string => str[0] === '-' ? str.slice(1) : `-${str}`;

export function numToOrdinal(value: number | `${number}`) {
  const suffixes = ["th", "st", "nd", "rd"];
  
  return value + ((num: number) => {
    // Get ones digit of number
    const onesDigit = num % 10;

    // Handle special cases for 11, 12, 13  
    if (num % 100 >= 11 && num % 100 <= 13) {
      return "th";
    }

    // Pick suffix from array based on ones digit
    return onesDigit < 4 ? suffixes[onesDigit] : suffixes[0]; 
  })(Number(value));
}

export function indexToOrdinal(value: number | `${number}`) {
  return numToOrdinal(Number(value) + 1);
}

export const createStyles = (rules: string = ''): void => {
  const sheet = document.createElement('style');
  sheet.id = `webchalk-global-styles`;
  sheet.innerHTML = rules;
  document.body.appendChild(sheet);
};

export const getOpeningTag = (element: Element | null | undefined): string => {
  if (!element) { return String(element); }
  const htmlText = element.outerHTML;
  const start  = htmlText.search(/</);
  const end  = htmlText.search(/>/);
  return htmlText.substring(start, end + 1);
};

export const overrideHidden = (...elements: Element[]): void => { for (const element of elements) {element.classList.value += ` webchalk-force-show`} };
export const unOverrideHidden = (...elements: Element[]): void => { for (const element of elements) {element.classList.value = element.classList.value.replace(` webchalk-force-show`, '')} };

export const parseXYTupleString = (tupleStr: `${CssLength} ${CssLength}` | undefined): [x: CssLength, y: CssLength] | undefined => {
  return tupleStr?.split(' ')
    // convert any '0' to '0px' to make compatible with CSS calc() usage
    .map(str => str === '0' ? '0px' : str) as [x: CssLength, y: CssLength] | undefined;
};
export const parseXYAlignmentString = (tupleStr: `${CssXAlignment} ${CssYAlignment}` | undefined): [x: CssXAlignment, y: CssYAlignment] | undefined => {
  return tupleStr?.split(' ') as [x: CssXAlignment, y: CssYAlignment] | undefined;
};

export function parseMultiUnitPlacement(offset: number | MultiUnitPlacementY, alignment: 'vertical'): ParsedMultiUnitPlacement;
export function parseMultiUnitPlacement(offset: number | MultiUnitPlacementX, alignment: 'horizontal'): ParsedMultiUnitPlacement;
export function parseMultiUnitPlacement(offset: number | MultiUnitPlacementX | MultiUnitPlacementY, alignment: 'vertical' | 'horizontal'): ParsedMultiUnitPlacement {
  if (typeof offset === 'number') { return [offset, 0]; }

  let match;
  
  switch(alignment) {
    case 'horizontal':
      match =
        offset.match(/^((?:-)?\d+(?:\.\d+)?\%|left|center|right)(?: (\+|-) ((?:-)?\d+(?:\.\d+)?px))?$/)
        || offset.match(/^((?:-)?\d+(?:\.\d+)?px|left|center|right)(?: (\+|-) ((?:-)?\d+(?:\.\d+)?\%))?$/);
      break;
    case 'vertical':
      match =
        offset.match(/^((?:-)?\d+(?:\.\d+)?\%|top|center|bottom)(?: (\+|-) ((?:-)?\d+(?:\.\d+)?px))?$/)
        || offset.match(/^((?:-)?\d+(?:\.\d+)?px|top|center|bottom)(?: (\+|-) ((?:-)?\d+(?:\.\d+)?\%))?$/);
      break;
    default:
      throw new RangeError(`Invalid alignment value ${alignment}. Must be 'horizontal' or 'vertical'.`);
  }

  
  if (!match) {
    throw new RangeError(`Invalid offset string ${offset} using alignment ${alignment}.`);
  }

  const [val1, operator = '+', val2] = match.slice(1, 4);
  const sign = operator === '+' ? 1 : -1;

  // if first value is a percentage, then the second MUST be px (or nothing)
  if (val1.includes('%')) {
    return [Number.parseFloat(val1) / 100, Number.parseFloat(val2 ?? '0px') * sign];
  }
  // if the first value is px, then the second MUST be a percentage (or nothing), so just swap placement in tuple
  else if (val1.includes('px')) {
    return [Number.parseFloat(val2 ?? '0%') / 100, Number.parseFloat(val1) * sign];
  }
  // otherwise, first value must be a keyword, and second could be px, %, or nothing
  else {
    let alignmentPerc;
    switch(val1 as CssXAlignment | CssYAlignment) {
      case "left":
      case "top":
        alignmentPerc = 0;
        break;
      case "right":
      case "bottom":
        alignmentPerc = 1;
        break;
      case "center":
        alignmentPerc = 0.5;
        break;
      default:
        throw new RangeError(`Something wrong occured for ${val1} to be ${val1}`);
    }

    // if second value is a percentage
    if (val2?.includes('%')) {
      return [alignmentPerc + Number.parseFloat(val2 ?? '0%') / 100 * sign, 0];
    }
    // if second value is px
    else {
      return [alignmentPerc, Number.parseFloat(val2 ?? '0px') * sign];
    }
  }
}

export const computeSelfScrollingBounds = (scrollable: Element, target: Element, scrollOptions: ScrollingOptions): {fromXY: [number, number], toXY: [number, number]} => {
  // determines the intersection point of the target
  const [offsetPercX, offsetPixelsX] = parseMultiUnitPlacement(scrollOptions.targetOffset?.[0] ?? '0px', 'horizontal');
  const [offsetPercY, offsetPixelsY] = parseMultiUnitPlacement(scrollOptions.targetOffset?.[1] ?? '0px', 'vertical');
  // determines the intersection point of the scrolling container
  const [placementOffsetPercX, placementOffsetPixelsX] = parseMultiUnitPlacement(scrollOptions.scrollableOffset?.[0] ?? '0px', 'horizontal');
  const [placementOffsetPercY, placementOffsetPixelsY] = parseMultiUnitPlacement(scrollOptions.scrollableOffset?.[1] ?? '0px', 'vertical');

  const selfRect = scrollable.getBoundingClientRect();
  const targetRect = target!.getBoundingClientRect();
  const targetInnerLeft = targetRect.left - selfRect.left + (scrollable === document.documentElement ? 0 : scrollable.scrollLeft);
  const targetInnerTop = targetRect.top - selfRect.top + (scrollable === document.documentElement ? 0 : scrollable.scrollTop);
  // The maximum view height should be the height of the scrolling container,
  // but it can only be as large as the viewport height since all scrolling should be
  // with respect to what the user can see.
  // The same logic applies for max width
  const maxSelfViewWidth = Math.min(selfRect.width, window.innerWidth);
  const maxSelfViewHeight = Math.min(selfRect.height, window.innerHeight);

  // initial position of the intersection point of the target relative to the top of the scrolling container
  // note that offsetPixels and placementOffsetPixels effectively mean the same thing
  const oldTargetIntersectionPointPos = [
    targetInnerLeft + (targetRect.width * offsetPercX) + offsetPixelsX + placementOffsetPixelsX,
    targetInnerTop + (targetRect.height * offsetPercY) + offsetPixelsY + placementOffsetPixelsY
  ];
  // new position of the intersection point of the target relative to the top of the scrolling container
  const newTargetIntersectionPointPos = [
    oldTargetIntersectionPointPos[0] - (maxSelfViewWidth * placementOffsetPercX),
    oldTargetIntersectionPointPos[1] - (maxSelfViewHeight * placementOffsetPercY),
  ];
  // set to just start scrolling from current scroll position
  const fromXY: [number, number] = [scrollable.scrollLeft, scrollable.scrollTop];
  // If new target intersection is larger (lower) than initial,
  // we'd need to scroll the screen up to move the target intersection down to it.
  // Same logic but opposite for needing to scroll down.
  // Same logic applies to horizontal scrolling with left and right instead of up and down.
  const [scrollDirectionX, scrollDirectionY] = [
    newTargetIntersectionPointPos[0] > oldTargetIntersectionPointPos[0] ? 'left' : 'right',
    newTargetIntersectionPointPos[1] > oldTargetIntersectionPointPos[1] ? 'up' : 'down',
  ];

  const toXY: [number, number] = [0, 0];

  switch(scrollDirectionX) {
    case "left":
      // Capped at 0 because that's the minimum scrollLeft value
      toXY[0] = Math.max(newTargetIntersectionPointPos[0], 0);
      break;
    case "right":
      // Capped at the highest scrollWidth value, which equals the scroll width minus the
      // minimum between the width of the scrolling container and the viewport width)
      toXY[0] = Math.min(newTargetIntersectionPointPos[0], scrollable.scrollWidth - maxSelfViewWidth);
      break;
  }
  switch(scrollDirectionY) {
    case "up":
      // Capped at 0 because that's the minimum scrollTop value
      toXY[1] = Math.max(newTargetIntersectionPointPos[1], 0);
      break;
    case "down":
      // Capped at the highest scrollTop value, which equals the scroll height minus the
      // minimum between the height of the scrolling container and the viewport height)
      toXY[1] = Math.min(newTargetIntersectionPointPos[1], scrollable.scrollHeight - maxSelfViewHeight);
      break;
  }

  return {fromXY, toXY};
};

/**
 * Functional, type-safe version of
 * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/call | Function.prototype.call}.
 * @param callableFunction - function whose `call` method we want to invoke
 * @param thisArg - value to use for the `thisArg` parameter for `callableFunction.call()`
 * @param args - arguments to pass to the `args` parameter for `callableFunction.call()`
 * @returns The result of `callableFunction.call(thisArg, ...args)`.
 */
export function call<TFunction extends ([...args]: unknown[]) => unknown>(
  callableFunction: TFunction,
  thisArg: unknown,
  ...args: Parameters<TFunction>
): ReturnType<TFunction> {
  return callableFunction.call(thisArg, ...args) as ReturnType<TFunction>;
}

/**
 * Returns either an object containing a subset of properties of the specified source object
 * or the value of a singluar property of the source object.
 * @param source - the object whose properties should be targeted
 * @param props - a singular property name or an array of property names
 * @returns A singular value if {@link props} is a string or an object containing a subset of properties if {@link props} is an array of strings.
 */
export function getPartial<Source extends object, T extends (keyof Source)[] = (keyof Source)[]>(source: Source, props: (keyof Source)[] | T | KeyOf<Source>): PickFromArray<Source, T> | Source[keyof Source] {
  if (typeof props === 'string') {
    return source[props];
  }
  return Object.fromEntries(
    Object.entries(source)
      .filter(([key, _]) => props.includes(key as keyof Source))
  ) as Pick<Source, keyof Source>;
}

export function dedent(text: string, tabLength: number = 2): string {
  // split lines by carriage return + newline or newline
  // then replace all leading tabs (or leading tabs mixed with leading spaces) with spaces
  const lines = text
    .split(/\r\n|\n/)
    .map(line => {
      const leadSpacesAndTabs = line.match(/^\s*/)?.[0] ?? '';
      return `${leadSpacesAndTabs.replaceAll(/\t/g, ' '.repeat(tabLength))}${line.trimStart()}`;
    });

  // find the minimum amount of leading spaces across the lines (not including empty lines)
  let minIndent = Infinity;
  for (const line of lines) {
    if (line === '') { continue; }
    const leadSpaces = line.match(/^\s*/)?.[0] ?? '';
    minIndent = Math.min(minIndent, leadSpaces.length);
  }

  // return the joined lines with the beginnings trimmed by the minimum amount of leading spaces
  return lines
    .map(line => line !== '' ? line.substring(minIndent) : '')
    .join('\n');
}

export function detab(text: TemplateStringsArray | string): string {
  if (typeof text === 'string') { return text.replace(/\n +/g, '\n').replace(/ +/g, ' '); /*return text.replaceAll(/(\t|\s)/g, ' ');*/ }
  return text.map(str => str.replace(/\n +/g, '\n').replace(/ +/g, ' ')).join(' ');
}

/**
 * Gets the bounding rectangle of an element even if it is unrendered.
 * @param element - the element on which to call `getBoundingClientRect()`
 * @returns The bounding client rectange of {@link element}.
 */
export function getBoundingClientRectOfHidden(element: Element | null): DOMRect {
  if (!element) { throw new TypeError(`Element must not be null or undefined.`); }
  if (element.classList.value.includes('webchalk-display-none')) {
    overrideHidden(element);
    const boundingRect = element.getBoundingClientRect();
    unOverrideHidden(element);
    return boundingRect;
  }
  return element.getBoundingClientRect();
}
