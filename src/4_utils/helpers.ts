import { CustomErrorClasses } from "./errors";
import { CssLength, CssXAlignment, CssYAlignment, ScrollingOptions, ParsedMultiUnitPlacement, MultiUnitPlacementX, MultiUnitPlacementY, StyleProperty, TextNodeDatum, RootNodeEditStats, InfixTextNodeList } from "./interfaces";
import { KeyOf, PickFromArray } from "./utilityTypes";

/**
 * 
 * @param val 
 * @param tar 
 * @returns 
 * 
 * @ignore
 */
export function asserter<T extends unknown>(val: T, tar: any): T | undefined {
  return val === tar ? val : undefined;
}

/**
 * 
 * @param a 
 * @param b 
 * @returns 
 * 
 * @ignore
 */
export function xor(a: unknown, b: unknown) {
  return ( a || b ) && !( a && b );
}

/**
 * 
 * @param a 
 * @param b 
 * @returns 
 * 
 * @ignore
 */
export function xnor(a: unknown, b: unknown) {
  return !xor(a, b);
}

/**
 * 
 * @param a 
 * @param b 
 * @returns 
 * 
 * @ignore
 */
export function nor(a: unknown, b: unknown) {
  return !(a || b);
}

export const equalWithinTol = (numA: number, numB: number): boolean => Math.abs(numA - numB) < 0.001;

/**
 * 
 * @param arrays 
 * @returns
 *  
 * @ignore
 */
export const mergeArrays = <T>(...arrays: (Array<T> | undefined)[]): Array<T> => Array.from(new Set(new Array<T>().concat(...arrays.filter(arr => arr !== undefined))));

/**
 * 
 * @param array 
 * @param predicate 
 * @returns
 *  
 * @ignore
 */
export function findLastIndex<T>(array: Array<T>, predicate: (value: T, index: number, obj: T[]) => boolean): number {
  let l = array.length;
  while (l--) {
    if (predicate(array[l], l, array)) { return l; }
  }
  return -1;
}

/**
 * 
 * @param str 
 * @returns 
 * 
 * @ignore
 */
export const negateNumString = (str: string): string => str[0] === '-' ? str.slice(1) : `-${str}`;

/**
 * Deep freezes an object.
 * @param obj - The object to be deep-frozen.
 * @returns The now frozen {@link obj}.
 * @remarks
 * CREDITS: https://decipher.dev/30-seconds-of-typescript/docs/deepFreeze/
 * 
 * @ignore
 */
export const deepFreeze = <T extends object>(obj: T) => {
  Object.keys(obj).forEach((prop) => {
    if (
      typeof obj[prop as keyof T] === 'object' &&
      !Object.isFrozen(obj[prop as keyof T])
    ) {
      /**@ts-ignore*/
      deepFreeze(obj[prop as keyof T]);
    }
  });
  return Object.freeze(obj);
};

/**
 * 
 * @param value 
 * @returns 
 * 
 * @ignore
 */
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

/**
 * 
 * @param value 
 * @returns 
 * 
 * @ignore
 */
export function indexToOrdinal(value: number | `${number}`) {
  return numToOrdinal(Number(value) + 1);
}

/**
 * 
 * @param rules 
 * 
 * @ignore
 */
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

/**
 * 
 * @param elements 
 * 
 * @ignore
 */
export const overrideHidden = (...elements: Element[]): void => { for (const element of elements) {element.classList.value += ` webchalk-force-show`} };

/**
 * 
 * @param elements 
 * 
 * @ignore
 */
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
        throw new RangeError(`Something wrong occurred for ${val1} to be ${val1}`);
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

/**
 * 
 * @param scrollable 
 * @param target 
 * @param scrollOptions 
 * @returns 
 * 
 * @ignore
 */
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
 * 
 * @ignore
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
 * or the value of a singular property of the source object.
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

/**
 * 
 * @param text 
 * @param tabLength 
 * @returns 
 * 
 * @ignore
 */
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

/**
 * Removes tabs from a template string that are the result of writing the string over multiple lines in the editor.
 * @param text - the template string
 * @returns The string without any tabs.
 * 
 * @ignore
 */
export function detab(text: TemplateStringsArray, ...placeholders: any[]): string {
  return text.map((str, i) => `${str}${placeholders[i] ?? ''}`).join('').replace(/[^\S\r\n]+/g, ' ');
}

/**
 * Gets the bounding rectangle of an element even if it is unrendered.
 * @param element - the element on which to call `getBoundingClientRect()`
 * @returns The bounding client rectangle of {@link element}.
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

/**
 * @ignore
 */
export const WORDS_REGEX = /\W*((\w+)'?(\w+)?)\W*|\W+/g;

/**
 * @ignore
 */
export const TBA_DURATION = 1234567.7654321;

/**
 * @ignore
 */
export const PERCENTAGE_REGEX = /^(-?\d+(\.\d*)?)%$/;

/**
 * @ignore
 */
export const RELATIVE_TIME_POSITION_REGEX = new RegExp(`^(?:${PERCENTAGE_REGEX.source}|beginning|end)$`);

// forms a list of data related to Text nodes in a DFS traversal (so it's sequential)
/**
 * Forms a list of data related to {@link Text} nodes in a DFS traversal
 * @param node - the root {@link Node} at which the traversal will begin
 * @param options - options for matching
 * @returns A list that contains sequential data about matched {@link Text} nodes.
 * 
 * @ignore
 */
export function constructInfixTextNodeList(node: Node, options: {
  match?: string | RegExp;
  findAllMatches: boolean;
  ignoreMatchCase: boolean;
}): InfixTextNodeList {
  if (!node) { throw new TypeError(`Element must not be null or undefined`); }
  
  const {
    match,
    findAllMatches,
    ignoreMatchCase,
  } = options;
  
  const textContent = node.textContent!;
  const infixTextNodeList: TextNodeDatum[] = [];

  const ranges: [number, number, number][] = [];
  let startIndex: number = 0;
  let endIndex: number;
  let matchString: string = '';
  // start is unspecified
  if (match === undefined) {
    startIndex = 0;
    endIndex = textContent.length;
    ranges.push([startIndex, endIndex, 0]);
  }
  // start is a string to match
  else if (typeof match === 'string') {
    let matchFound = false;
    const condition = ignoreMatchCase
      ? () => startIndex = textContent.toLowerCase().indexOf(match.toLowerCase(), startIndex)
      : () => startIndex = textContent.indexOf(match, startIndex);
    while(condition() !== -1) {
      matchFound = true;
      matchString = match; // ???
      endIndex = startIndex + match.length;
      ranges.push([startIndex, endIndex, 0]);

      if (!findAllMatches) { break; }

      ++startIndex;
    }
    if (!matchFound) {
      throw new RangeError(`Matching string "${match}" not found`);
    }
  }
  else if (match instanceof RegExp) {
    const matchResults = [...textContent.matchAll(new RegExp(match, 'dg' + (ignoreMatchCase ? 'i' : '')))];
    // if there are match results...
    if (matchResults) {
      // attempt to loop through the matches to push [startIndex, endIndex] ranges
      for (let i = 0; i < matchResults.length; ++i) {
        const res = matchResults[i];
        // if there are capture groups, push each capture instead of the whole match
        if (res.indices![1]) {
          for (let j = 1; j < res.indices!.length; ++j) {
            [startIndex, endIndex] = res.indices![j];
            // check to make sure there are no nested capture groups
            for (let k = j + 1; k < res.indices!.length; ++k) {
              const [startIndexK, endIndexK] = res.indices![k];
              if (Math.max(startIndex, startIndexK) < Math.min(endIndex, endIndexK)) {
                throw new RangeError(`Invalid regex ${match}. Nested capture groups are not allowed.`);
              }
            }
            ranges.push([startIndex, endIndex, j - 1]);
          }
        }
        else {
          [startIndex, endIndex] = res.indices![0];
          ranges.push([startIndex, endIndex, 0]);
        }
        if (!findAllMatches) { break; }
      }
    }
    else {
      throw new RangeError(`Matching regex ${match} not found`);
    }
    // matchString = result[0];
  }
  else {
    throw new TypeError(`Invalid type passed for match. Must be a string, regular expression, or omitted.`)
  }
  // // start is a number
  // else {
  //   startIndex = start;
  //   if (start >= textContent.length) {
  //     throw new RangeError(`Starting index "${start}" lies after the end of the text content.`);
  //   }
  // }

  const meta = {
    matchFound: false,
    matchString,
    ranges,
    currRangeIndex: 0,
    matchEndFound: false,
    indexCount: 0,
    textLength: node.textContent?.length ?? 0,
  };
  constructInfixTextNodeListR(node, infixTextNodeList, meta);
  
  // if (!meta.matchFound) {
  //   throw new RangeError(`Matching string "${match}" not found.`);
  // }
  
  return infixTextNodeList;
}

/**
 * 
 * @param node 
 * @param infixTextNodeList 
 * @param meta 
 * @returns 
 * 
 * @ignore
 */
function constructInfixTextNodeListR(
  node: Node,
  infixTextNodeList: TextNodeDatum[],
  meta: {
    matchFound: boolean;
    matchEndFound: boolean;
    matchString?: string;
    ranges: [number, number, number][];
    currRangeIndex: number;
    indexCount: number;
    textLength: number;
  }
) {
  if (!(node instanceof Text)) {
    const childNodes = [...node.childNodes];
    for (const childNode of childNodes) {
      constructInfixTextNodeListR(childNode, infixTextNodeList, meta);
    }
    return;
  }
  
  const {matchFound, matchString, ranges, currRangeIndex, matchEndFound, indexCount} = meta;
  const [startIndex, endIndex, captureIndex]: [number, number, number] = ranges[currRangeIndex] ?? [NaN, NaN, NaN];
  const nodeTextLength = node.nodeValue!.length;
  meta.indexCount += nodeTextLength;
  
  if (isNaN(endIndex) || (indexCount >= endIndex && startIndex !== endIndex)) { return; }
  
  // if start of match was found in a previous iteration...
  if (matchFound) {
    // if start was not entirely contained in previous nodes, see if the ending...
    // ... is present here
    if (!matchEndFound) {
      // if start still not fully contained by this point, push the node and move on to the next node
      if (endIndex > indexCount + nodeTextLength) {
        const datum: TextNodeDatum = {
        textNode: node,
        origVal: node.nodeValue!, words: node.nodeValue!.match(WORDS_REGEX) ?? [],
        numWordsRestored: 0, numCharsRestored: 0, numCharsToDelete: 0, numWordsToDelete: 0,
        head: false,
        captureIndex,
      };
        datum.numWordsToDelete = numWordsInNode(datum); // set number of words that can be removed
        datum.numCharsToDelete = numCharsInNode(datum); // set number of chars that can be removed
        infixTextNodeList.push(datum);
        return;
      }

      // otherwise, split the node at the end of the match and push the left portion of the split,...
      // ... leaving the right of the split to continue being processed if necessary
      // meta.matchEndFound = true;

      const splitIndexCount = indexCount + (nodeTextLength - node.nodeValue!.length);
      let rightOfSplit: Text | undefined;
      if (endIndex !== indexCount + node.nodeValue!.length) {
        rightOfSplit = node.splitText(endIndex - splitIndexCount);
      }

      const datum: TextNodeDatum = {
        textNode: node,
        origVal: node.nodeValue!, words: node.nodeValue!.match(WORDS_REGEX) ?? [],
        numWordsRestored: 0, numCharsRestored: 0, numCharsToDelete: 0, numWordsToDelete: 0,
        head: false,
        captureIndex,
      };
      datum.numWordsToDelete = numWordsInNode(datum); // set number of words that can be removed
      datum.numCharsToDelete = numCharsInNode(datum); // set number of chars that can be removed
      infixTextNodeList.push(datum);

      meta.matchFound = false;
      ++meta.currRangeIndex;
      
      if (rightOfSplit) {
        meta.indexCount -= rightOfSplit.nodeValue!.length;
        constructInfixTextNodeListR(rightOfSplit, infixTextNodeList, meta);
      }

      return;
    }
  }

  // LOOKING FOR START MATCH
  // check to see if starting index is contained within this node
  if (indexCount + nodeTextLength <= startIndex) { return; }
  meta.matchFound = true;

  // split at that index (relatively) if necessary and continue processing with the right of the split
  if (startIndex !== indexCount) {
    node = node.splitText(startIndex - indexCount);
  }

  // if the full match is not contained within this node, push this node and...
  // ... continue with next nodes
  if (endIndex > indexCount + nodeTextLength) {
    const datum: TextNodeDatum = {
      textNode: node as Text,
      origVal: node.nodeValue!, words: node.nodeValue!.match(WORDS_REGEX) ?? [],
      numWordsRestored: 0, numCharsRestored: 0, numCharsToDelete: 0, numWordsToDelete: 0,
      head: true,
      captureIndex,
    };
    datum.numWordsToDelete = numWordsInNode(datum); // set number of words that can be removed
    datum.numCharsToDelete = numCharsInNode(datum); // set number of chars that can be removed
    infixTextNodeList.push(datum);
    return;
  }
  
  // ending index is contained within this node, so split at that point if necessary
  const splitIndexCount = indexCount + (nodeTextLength - node.nodeValue!.length);
  let rightOfSplit: Text | undefined;
  // if (endIndex !== splitIndexCount) {
    rightOfSplit = (node as Text).splitText(endIndex - splitIndexCount);
  // }
  
  // if start index and end index match, insert a new empty text node to...
  // ... represent that in-between space
  if (startIndex === endIndex) {
    node.parentNode!.insertBefore(new Text(), node);
    node = node.previousSibling as Text;
  }
  const datum: TextNodeDatum = {
    textNode: node as Text,
    origVal: node.nodeValue!, words: node.nodeValue!.match(WORDS_REGEX) ?? [],
    numWordsRestored: 0, numCharsRestored: 0, numCharsToDelete: 0, numWordsToDelete: 0,
    head: true,
    captureIndex,
  };
  datum.numWordsToDelete = numWordsInNode(datum); // set number of words that can be removed
  datum.numCharsToDelete = numCharsInNode(datum); // set number of chars that can be removed
  infixTextNodeList.push(datum);

  meta.matchFound = false;
  ++meta.currRangeIndex;
  
  if (rightOfSplit) {
    meta.indexCount -= rightOfSplit.nodeValue!.length;
    constructInfixTextNodeListR(rightOfSplit, infixTextNodeList, meta);
  }

  return;
}

// remove from the Text nodes such that only the given percentage of total words or characters are shown overall
// Note that if 'by-word' is used, only ttStats.wordsRemoved gets updated, not ttStats.charsRemoved (and vice versa)
/**
 * 
 * @param infixTextNodeList 
 * @param percentage 
 * @param rootEditStats 
 * @param splitType 
 * 
 * @ignore
 */
export function infixTextDelete(infixTextNodeList: TextNodeDatum[], percentage: number, rootEditStats: RootNodeEditStats, splitType: 'by-word' | 'by-character') {
  // minimum amount of words and characters that can be present given current percentage
  const wordAllowance = Math.ceil(rootEditStats.totalWords * percentage);
  const charAllowance = Math.ceil(rootEditStats.totalChars * percentage);
  const reversedList = [...infixTextNodeList];
  reversedList.reverse();

  switch(splitType) {
    case 'by-word':
      // while the total number of words added is less than allowance...
      while (rootEditStats.wordsRemoved < wordAllowance) {
        // for each text node entry... 
        for (const datum of reversedList) {
          if (rootEditStats.wordsRemoved >= wordAllowance) { break; }
          const {textNode, words} = datum;
          // add string fragments until text node is either completed or until the allowance is reached
          let wordsToRemove = '';
          while(rootEditStats.wordsRemoved < wordAllowance && datum.numWordsToDelete > 0) {
            datum.numWordsToDelete -= 1; // decrement nextWordIndex
            wordsToRemove += words[datum.numWordsToDelete];
            rootEditStats.wordsRemoved += 1;
          }
          textNode.nodeValue = textNode.nodeValue!.substring(0, textNode.nodeValue!.length - wordsToRemove.length)
        }
      }
      break;
    case 'by-character':
      // while the total number of chars added is less than allowance...
      while (rootEditStats.charsRemoved < charAllowance) {
        // for each text node entry... 
        for (const datum of reversedList) {
          if (rootEditStats.charsRemoved >= charAllowance) { break; }
          const {textNode, origVal} = datum;
          // add characters until text node value is restored completed or until the allowance is reached
          let charsToRemove = '';
          while(rootEditStats.charsRemoved < charAllowance && datum.numCharsToDelete > 0) {
            datum.numCharsToDelete -= 1; // decrement nextCharIndex
            charsToRemove += origVal[datum.numCharsToDelete];
            rootEditStats.charsRemoved += 1;
          }
          textNode.nodeValue = textNode.nodeValue!.substring(0, textNode.nodeValue!.length - charsToRemove.length);
        }
      }
      break;
    default:
      throw new Error(`Invalid 'splitType' value "${splitType}"`);
  }
}

// add to the Text nodes such that only the given percentage of total words or characters are shown overall
// Note that if 'by-word' is used, only ttStats.wordsAdded gets updated, not ttStats.charsAdded (and vice versa)
/**
 * 
 * @param infixTextNodeList 
 * @param percentage 
 * @param rootEditStats 
 * @param splitType 
 * 
 * @ignore
 */
export function infixTextInsert(infixTextNodeList: TextNodeDatum[], percentage: number, rootEditStats: RootNodeEditStats, splitType: 'by-word' | 'by-character') {
  // maximum amount of words and characters that can be present given current percentage
  const wordAllowance = Math.ceil(rootEditStats.totalWords * percentage);
  const charAllowance = Math.ceil(rootEditStats.totalChars * percentage);

  switch(splitType) {
    case 'by-word':
      // while the total number of words added is less than allowance...
      while (rootEditStats.wordsAdded < wordAllowance) {
        // for each text node entry... 
        for (const datum of infixTextNodeList) {
          if (rootEditStats.wordsAdded >= wordAllowance) { break; }
          const {textNode, words} = datum;
          // add string fragments until text node is either completed or until the allowance is reached
          let wordsToAdd = '';
          while(rootEditStats.wordsAdded < wordAllowance && datum.numWordsRestored < words.length) {
            wordsToAdd += words[datum.numWordsRestored];
            datum.numWordsRestored += 1; // increment nextWordIndex
            rootEditStats.wordsAdded += 1;
          }
          textNode.nodeValue += wordsToAdd;
        }
      }
      break;
    case 'by-character':
      // while the total number of chars added is less than allowance...
      while (rootEditStats.charsAdded < charAllowance) {
        // for each text node entry... 
        for (const datum of infixTextNodeList) {
          if (rootEditStats.charsAdded >= charAllowance) { break; }
          const {textNode, origVal} = datum;
          // add characters until text node value is restored completed or until the allowance is reached
          let charsToAdd = '';
          while(rootEditStats.charsAdded < charAllowance && datum.numCharsRestored < numCharsInNode(datum)) {
            charsToAdd += origVal[datum.numCharsRestored];
            datum.numCharsRestored += 1; // increment nextCharIndex
            rootEditStats.charsAdded += 1;
          }
          textNode.nodeValue += charsToAdd;
        }
      }
      break;
    default:
      throw new Error(`Invalid 'splitType' value "${splitType}"`);
  }
}

// returns the number of characters in a Text node
/**
 * 
 * @param datum 
 * @returns 
 * @ignore
 */
export function numCharsInNode(datum: TextNodeDatum): number { return datum.words.reduce((sum, str) => sum + str.length, 0); }
// returns the number of words in a Text node
/**
 * 
 * @param datum 
 * @returns 
 * @ignore
 */
export function numWordsInNode(datum: TextNodeDatum): number { return datum.words.length; }
// returns the total number of words and characters in the root element (just considering text from Text nodes)
function totalWords_totalChars(infixTextNodeList: TextNodeDatum[]): Pick<RootNodeEditStats, 'totalChars' | 'totalWords'> {
  const [totalWords, totalChars] = infixTextNodeList.reduce((sumTuple, datum) => [
    sumTuple[0] + numWordsInNode(datum),
    sumTuple[1] + numCharsInNode(datum)
  ], [0,0]);
  return { totalWords, totalChars };
}

/**
 * 
 * @param infixList 
 * @param operation 
 * @returns 
 * 
 * @ignore
 */
export function createRootNodeEditStats(infixList: InfixTextNodeList, operation: 'insert' | 'delete'): RootNodeEditStats {
  switch(operation) {
    case "insert":
      return {
        ...totalWords_totalChars(infixList),
        wordsAdded: 0, charsAdded: 0, wordsRemoved: 0, charsRemoved: 0,
      };
    case "delete":
      return {
        ...totalWords_totalChars(infixList),
        wordsAdded: 0, charsAdded: 0, wordsRemoved: 0, charsRemoved: 0,
      };
    default: throw new RangeError(`Invalid operation "${operation}". Must be "insert" or "delete".`);
  }
}

export function generateId(): string { return Math.random().toString(20).substring(2, 32) + String(Date.now()); }
