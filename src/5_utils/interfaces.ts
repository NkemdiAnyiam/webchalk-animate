// import { AnimClipConfig } from "../AnimClip";
// import { PresetEffectDefinition } from "../Webchalk";
// import { PrefixProps } from "./utilityTypes";

import { AnimClip } from "../1_playbackStructures/AnimationClip";
import type { TextEditorClip } from "../1_playbackStructures/AnimationClipCategories";
import { EffectFrameGeneratorSet } from "../2_animationEffects/presetEffectCreation";
import { Union } from "./utilityTypes";

/**
 * A practical union of the 3 subclasses of {@link Element}.
 * Mostly useful for autocompletions. For example, the `style` property does
 * not exist on {@link Element}, but it does exist on its subclasses. 
 */
export type DOMElement = HTMLElement | SVGElement | MathMLElement;

/**
 * Options for determining the offset to add to an element's translation.
 */
interface TranslationOffset {
  /**
   * Determines offsets to apply to both X and Y positional components.
   *  * The offset is applied _after_ {@link alignment} is applied.
   *  * It is a string in the form "{@link CssLength} {@link CssLength}".
   * @example
   * ```ts
   * // move 12px right and 50% of own height down
   * {selfOffset: "12px 50%"}
   * ```
   */
  selfOffset: `${CssLength} ${CssLength}`;
}

// CHANGE NOTE: Use strings in the format of <number><CssLengthUnit> and remove XY things
/**
 * An options object for the translate animation.
 */
export interface TranslateOptions extends TranslationOffset {
  /**
   * The distances to travel in the X and Y directions.
   *  * It is a string in the form "{@link CssLength} {@link CssLength}".
   * @example
   * ```ts
   * // move 12px right and 50% of own height down
   * {translate: "12px 50%"}
   * ```
   */
  translate: `${CssLength} ${CssLength}`;
}

/**
 * An options object for the move-to animation.
 */
export interface MoveToOptions extends TranslationOffset {
  /** Determines horizontal and vertical alignment with target element. */
  alignment: `${CssXAlignment} ${CssYAlignment}`;
  /**
   * The offset with respect to the target's left and top bound.
   *  * The offset is applied _after_ {@link alignment} is applied.
   *  * It is a string in the form "{@link CssLength} {@link CssLength}".
   * @example
   * ```ts
   * // move 12px right and 50% of target element's height down
   * {targetOffset: "12px 50%"}
   * ```
   */
  targetOffset: `${CssLength} ${CssLength}`;
  /** If `true`, there will be no horizontal translation with respect to the target element (offsets still apply). */
  preserveX: boolean;
  /** If `true`, there will be no vertical translation with respect to the target element (offsets still apply). */
  preserveY: boolean;
}

/**
 * An options object for the scroll-self animation.
 */
export interface ScrollingOptions {
  /** Determines the intersection point of the scrolling container with respect to its top-left bound. */
  scrollableOffset?: [x: MultiUnitPlacementX, y: MultiUnitPlacementY];
  /** Determines the intersection point of the scroll target with respect to its top-left corner. */
  targetOffset?: [x: MultiUnitPlacementX, y: MultiUnitPlacementY];
  /** If `true`, the scrolling container will not scroll horizontally. */
  preserveX?: boolean;
  /** If `true`, the scrolling container will not scroll vertically. */
  preserveY?: boolean;
};

/**
 * A few common options for units in CSS.
 *  * `"px"` refers to pixels.
 *  * `"rem"` refers to root em.
 *  * `"%"` refers to a percentage.
 * @see [CSS values and units](https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/Values_and_units)
 */
export type CssLengthUnit = | 'px' | 'rem' | '%';
/** A string in the form of a number and a CSS length unit, such as `"12px"`. */
export type CssLength = `${number}${CssLengthUnit}` | '0';
/**
 * Keywords for common alignments along the y-axis.
 *  * `"top"` indicates a distance of 0% from the top of an element.
 *  * `"middle"` indicates a distance of 50% from the top of an element.
 *  * `"bottom"` indicates a distance of 100% from the top of an element.
 */
export type CssYAlignment = | 'top' | 'middle' | 'bottom';
/**
 * Keywords for common alignments along the x-axis.
 *  * `"left"` indicates a distance of 0% from the left of an element.
 *  * `"center"` indicates a distance of 50% from the left of an element.
 *  * `"right"` indicates a distance of 100% from the left of an element.
 */
export type CssXAlignment = | 'left' | 'center' | 'right';

/** A string in the form of a number and the '%' sign, such as `"50%"`. */
export type percentage = `${number}%`;
/** A string in the form of a number and 'px', such as `"12px"`. */
export type pixels = `${number}px`
/** A string that is simply either the plus sign `"+"` or the minus sign `"-"`. */
export type operator = '+' | '-';

/**
 * Denotes an X coordinate alignment in the following formats:
 *  * {@link percentage} (such as `"50%"`).
 *  * {@link pixels} (such as `"12px"`).
 *  * {@link CssXAlignment} (such as `"center"` (which is equivalent to `"50%"`) and `"left"` (which is equivalent to `"0%"`)).
 *  * {@link percentage} (+|-) {@link pixels} or {@link pixels} (+|-) {@link percentage} (such as `"50% - 12px"` and `"30px - 20%"`).
 *  * {@link CssXAlignment} (+|-) ({@link pixels}|{@link percentage}) (such as `"left + 50%"` and `"center - 12px"`).
 */
export type MultiUnitPlacementX = percentage | pixels | CssXAlignment | `${percentage} ${operator} ${pixels}` | `${pixels} ${operator} ${percentage}` | `${CssXAlignment} ${operator} ${pixels | percentage}`;

/**
 * Denotes an X coordinate alignment in the following formats:
 *  * {@link percentage} (such as `"50%"`).
 *  * {@link pixels} (such as `"12px"`).
 *  * {@link CssYAlignment} (such as `"middle"` (which is equivalent to `"50%"`) and `"top"` (which is equivalent to `"0%"`)).
 *  * {@link percentage} (+|-) {@link pixels} or {@link pixels} (+|-) {@link percentage} (such as `"50% - 12px"` and `"30px - 20%"`).
 *  * {@link CssYAlignment} (+|-) ({@link pixels}|{@link percentage}) (such as `"top + 50%"` and `"middle - 12px"`).
 */
export type MultiUnitPlacementY = percentage | pixels | CssYAlignment | `${percentage} ${operator} ${pixels}` | `${pixels} ${operator} ${percentage}` | `${CssYAlignment} ${operator} ${pixels | percentage}`;

/**
 * Denotes an (X, Y) coordinate pair in the string form `"(X, Y)"`,
 * where X is a {@link MultiUnitPlacementX} and Y is a {@link MultiUnitPlacementY}. Examples:
 *  * `"(50%, 20px)"`
 *  * `"(50% + 35px, bottom)"`
 *  * `"(center + 40%, 30px - 12%)"`
 *  * `"(center, middle)"`
 */
export type MultiUnitOrderedPairString = `(${MultiUnitPlacementX}, ${MultiUnitPlacementY})`;

/**
 * A tuple containing the result of parsing a multi-unit placement string
 * into a percentage number (where 1 means 100%) and a pixels number.
 */
export type ParsedMultiUnitPlacement = [percentage: number, pixels: number];

/**
 * All the possible values of an {@link AnimClip} subclass instance's category value.
 */
export type EffectCategory =
  | 'Entrance'
  | 'Exit'
  | 'Emphasis'
  | 'Motion'
  | 'Transition'
  | 'Scroller'
  | 'Connector Entrance'
  | 'Connector Exit'
  | 'Text Editor';

/**
 * The possible formats for writing keyframes. The two accepted forms
 * are {@link PropertyIndexedKeyframes} and—more commonly used—{@link Keyframe}[].
 * 
 * Used in {@link EffectFrameGeneratorSet}.
 * 
 * @see [Keyframe Formats](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Keyframe_Formats)
 */
export type Keyframes = PropertyIndexedKeyframes | Keyframe[];

/**
 * A function that is supposed to mutate the properties of JavaScript objects by
 * utilizing the result of calling {@link AnimClip.computeTween}
 * (_or_ by utilizing the result of some other value that may already be updating onscreen).
 * The function will automatically run on every frame (as in, the device's frame rate),
 * and the output of {@link AnimClip.computeTween} automatically changes on every frame according
 * to the clip's duration, so the outcome is ultimately the illusion of a
 * smooth animation because the target JavaScript properties will change
 * at the device's frame rate.
 * 
 * Used in {@link EffectFrameGeneratorSet}.
 * 
 * @remarks
 * The reason the return type is `void` is because there is no need to return any value since the mutation should occur directly within the function.
 * 
 * @see {@link AnimClip.computeTween}
 * @see {@link EffectFrameGeneratorSet}
 */
export type Mutator = () => void;

/**
 * The standard CSS style property names in camelCase form.
 *  * Standard names are autocompleted, but non-standard values are still allowed (this accounts
 * for custom CSS variables)
 */
export type StyleProperty = Union<
  Extract<
    keyof Omit<
      CSSStyleDeclaration,
      | 'length'
      | 'parentRule'
      | 'getPropertyPriority'
      | 'getPropertyValue'
      | 'item'
      | 'removeProperty'
      | 'setProperty'
    >,
    string>,
  string
>;

/**
 * @ignore
 */
export type TextNodeDatum = {
  textNode: Text;
  origVal: string;
  words: string[];
  numWordsRestored: number;
  numCharsRestored: number;
  numWordsToDelete: number;
  numCharsToDelete: number;
  head: boolean;
  captureIndex: number;
};

/**
 * @ignore
 */
export type InfixTextNodeList = TextNodeDatum[];

// keeps track of the stats related to the words and characters in the root element
/**
 * @ignore
 */
export type RootNodeEditStats = {
  totalWords: number; // total number of words in the entire structure
  totalChars: number; // total number of chars in the entire structure
  wordsAdded: number; // number of words restored to the structure
  charsAdded: number; // number of characters restored to the structure
  wordsRemoved: number; // number of words removed from the structure
  charsRemoved: number; // number of characters removed from the structure
};

/**
 * A string indicating the rate of text editing. Accepts wpm (words per minute) or cpm (characters per minute).
 * Examples:
 *  * `"300wpm"`
 *  * `"1500cpm"`
 */
export type TextEditRate = `${number}${'wpm' | 'cpm'}`

/**
 * An object containing options for specifying the behavior of a text editing effect within a {@link TextEditorClip}.
 * 
 * @see {@link TextEditorClip}
 */
export type TextEditOptions = {
  /**
   * If `true`, a case-insensitive search will be used if {@link TextEditOptions.match|match} is specified.
   * @defaultValue
   * ```ts
   * false
   * ```
   * @remarks
   * This applies when {@link TextEditOptions.match|match} is a {@link RegExp} as well. So do _not_ attempt to specify the
   * `i` flag when specifying a regular expression to match—it will be ignored.
   * 
   * @example
   * <!-- EX:S id="TextEditOptions.ignoreMatchCase" code-type="ts" -->
   * ```ts
   * const { TextEditor } = webchalk.createAnimationClipFactories();
   * 
   * // Get element from the DOM. Let's say it at least contains the text "Hello world! How are you?"
   * const textBox = document.querySelector('.text-box');
   * 
   * // Creates a clip that searches the target element for the text "hello world" and deletes it.
   * const clip = TextEditor(textBox, '~delete-text', [{ignoreMatchCase: true, match: 'hEllO WOrlD'}]);
   * 
   * // Result: changes textBox's contents to "! How are you?".
   * clip.play();
   * ```
   * <!-- EX:E id="TextEditOptions.ignoreMatchCase" -->
  */
  ignoreMatchCase?: boolean;
  /**
   * If specified, `match` will be used to limit the text operation to only the specific matching text (if found).
   *  * When inserting text, `match` can be used to determine _where_ to insert the new text.
   *  * If deleting or replacing text, `match` can be used to determine _what_ text to delete or replace
   * (if `match` is not specified, all text will be deleted or replaced).
   * 
   * @example
   * <!-- EX:S id="TextEditOptions.match" code-type="ts" -->
   * ```ts
   * const { TextEditor } = webchalk.createAnimationClipFactories();
   * 
   * // Get element from the DOM. Let's say it at least contains the text "Hello! How are you?"
   * const textBox = document.querySelector('.text-box');
   * 
   * // Creates a clip that searches textBox for the string "Hello"
   * // and inserts " world" after it.
   * const clip1 = TextEditor(textBox, '~insert-text', [' world', {match: 'Hello'}]);
   * 
   * // Creates a clip that searches textBox for the string "is the weather"
   * // and replaces it with "are you".
   * const clip2 = TextEditor(textBox, '~replace-text', ['is the weather', {match: 'are you'}]);
   * 
   * // Result: changes textBox's contents to "Hello world! How is the weather?".
   * webchalk.newSequence([clip1, clip2]).play();
   * ```
   * <!-- EX:E id="TextEditOptions.match" -->
   */
  match?: string | RegExp;
  /**
   * If `true`, then if {@link TextEditOptions.match|match} contains capturing groups—portions enclosed in parentheses, as in
   * `/My ID is (\w\d)+, and my number is (\d+)/`—each group will be inserted by, deleted, or replaced
   * (whatever operation is being performed) instead of the entire match.
   * @defaultValue
   * ```ts
   * false
   * ```
   * 
   * @example
   * <!-- EX:S id="TextEditOptions.useCaptureGroups" code-type="ts" -->
   * ```ts
   * const { TextEditor } = webchalk.createAnimationClipFactories();
   * 
   * // Get element from the DOM. Let's say it at least contains
   * // the text "My ID is E777, and my number is 111-111-1111".
   * const textBox = document.querySelector('.text-box');
   * 
   * // Creates a clip that looks for a string matching the regex /My ID is (\w\d)+, and my number is (\d+)/
   * // and replaces the portions in parentheses with "A090" and "555-123-1234".
   * const clip = TextEditor(textBox, '~replace-text', [
   *   ['A090', '[REDACTED]'],
   *   {
   *     match: /My ID is (\w\d)+, and my number is (\d+)/,
   *     useCaptureGroups: true
   *   }
   * ]);
   * 
   * // Result: changes textBox's contents to "My ID is A090, and my number is [REDACTED]".
   * clip.play();
   * ```
   * <!-- EX:E id="TextEditOptions.useCaptureGroups" -->
   */
  useCaptureGroups?: boolean;
  /**
   * If `true`, then {@link TextEditOptions.match|match} (if specified) will search for _all_ matching results instead of
   * just stopping at one.
   * @defaultValue
   * ```ts
   * false
   * ```
   */
  findAllMatches?: boolean;
  /**
   * An aesthetic option that determines whether text should be inserted/deleted by characters at a time or words at a time.
   * @defaultValue
   * ```ts
   * 'by-character'
   * ```
   * @remarks
   * The default value is `'by-character'` because that is typically less jarring for the eyes than whole words.
   */
  letterChunking?: 'by-character' | 'by-word';
  /**
   * If `true` and {@link TextEditOptions.findAllMatches|findAllMatches} is also `true`, then all matches will be treated as one
   * large single match. This option is only meaningful when inserting an array of new strings.
   * @defaultValue
   * ```ts
   * true
   * ```
   * 
   * @example
   * <!-- EX:S id="TextEditOptions.joinMatches" code-type="ts" -->
   * ```ts
   * const { TextEditor } = webchalk.createAnimationClipFactories();
   * 
   * // Get element from the DOM. Let's say it at least contains
   * // the text "I tried the door. I tried the window. I tried the chimney."
   * const textBox = document.querySelector('.text-box');
   * 
   * // Creates a clip that searches textBox for every occurrence of the string "I tried"
   * // and alternates between inserting the string " entering" and the string " breaking" after them.
   * // (This is because {joinMatches} is true by default.)
   * const clip1 = TextEditor(textBox, '~insert-text', [
   *   [' entering', ' breaking'],
   *   {
   *     match: 'I tried',
   *     findAllMatches: true,
   *   }
   * ]);
   * 
   * // Creates a clip that searches textBox for every occurrence of the string "I"
   * // and alternates between replacing them with the string "He" and the string "She".
   * const clip2 = TextEditor(textBox, '~replace-text', [
   *   ['He', 'She'],
   *   {
   *     match: 'I',
   *     findAllMatches: true,
   *   }
   * ]);
   * 
   * // Creates a clip that searches textBox for every occurrence of the string "I"
   * // and replaces them only with the string "He". This is because {joinMatches} was set to false,
   * // so each occurrence of "I" is treated completely independently. "She" goes completely unused,
   * // which is likely not what was intended.
   * // Let's not use this clip.
   * const clip3Bad = TextEditor(textBox, '~replace-text', [
   *   ['He', 'She'],
   *   {
   *     match: 'I',
   *     findAllMatches: true,
   *     joinMatches: false
   *   }
   * ]);
   * 
   * // Creates a clip that searches textBox for every occurrence of a string that matches
   * // the regular expression /(.*) tried .* the (.*)\./ and alternates between replacing
   * // the two captured groups with "Tim" & "front", "Sarah" & "side", and "Jeremy" & "top".
   * const clip4 = TextEditor(textBox, '~replace-text', [
   *   ['Tim', 'front', 'Sarah', 'side', 'Jeremy', 'top'],
   *   {
   *     match: /(.*) tried .* the (.*)\./,
   *     findAllMatches: true,
   *   }
   * ]);
   * 
   * // Creates a clip that searches textBox for every occurrence of a string that matches
   * // the regular expression /(.*) tried .* the (.*)\./ and replaces each pair of captured groups
   * // only with "Tim" & "front". This is because {joinMatches} was set to false, so each occurrence
   * // of matches for /(.*) tried .* the (.*)\./ is treated completely independently. "Sarah",
   * // "side", "Jeremy", and "top" go completely unused, which is likely not what was intended.
   * // Let's not use this clip.
   * const clip5Bad = TextEditor(textBox, '~replace-text', [
   *   ['Tim', 'front', 'Sarah', 'side', 'Jeremy', 'top'],
   *   {
   *     match: /(.*) tried .* the (.*)\./,
   *     findAllMatches: true,
   *     joinMatches: false,
   *   }
   * ]);
   * 
   * // Result: changes textBox's contents from "I tried the door. I tried the window. I tried the chimney"
   * // to "Tim tried entering the front. Sarah tried breaking the side. Jeremy tried entering the top."
   * webchalk.newSequence([
   *   // clip1 -> "I tried entering the door. I tried breaking the window. I tried entering the chimney."
   *   clip1,
   *   // clip2 -> "He tried entering the door. She tried breaking the window. He tried entering the chimney."
   *   clip2,
   *   // clip4 -> "Tim tried entering the front. Sarah tried breaking the side. Jeremy tried entering the top."
   *   clip4,
   * ]).play();
   * ```
   * <!-- EX:E id="TextEditOptions.joinMatches" -->
   */
  joinMatches?: boolean;
  /**
   * A string determining where to insert new text relative to
   * {@link TextEditOptions.match|match} (or if no match is specified, relative to the entire text).
   * @defaultValue
   * ```ts
   * 'after'
   * ```
   * 
   * @example
   * <!-- EX:S id="TextEditOptions.position" code-type="ts" -->
   * ```ts
   * const { TextEditor } = webchalk.createAnimationClipFactories();
   * 
   * // Get element from the DOM. Let's say it at least contains the text "Hello! How are you?"
   * const textBox = document.querySelector('.text-box');
   * 
   * // Creates a clip that searches textBox for the string "Hello"
   * // and inserts " world" after it (because {position} is "after" by default).
   * const clip1 = TextEditor(textBox, '~insert-text', [' world', {match: 'Hello'}]);
   * 
   * // Creates a clip that searches textBox for the string "Hello"
   * // and inserts "Hi! " before it.
   * const clip2 = TextEditor(textBox, '~insert-text', ['Hi! ', {match: 'Hello', position: 'before'}]);
   * 
   * // Result: changes textBox's contents to "Hi! Hello world! How are you?".
   * webchalk.newSequence([clip1, clip2]).play();
   * ```
   * <!-- EX:E id="TextEditOptions.position" -->
   */
  position?: 'before' | 'after'
};

/**
 * Strings representing common keyboard shortcut values.
 */
export type KeyboardKey = Union<
  Lowercase<
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M'
  | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z'
  >
  | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '0'
  | 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown'
  | 'Space' | 'Enter' | 'Backspace'
, string>;

/**
 * An object that can be used to assign (or remove with `null`) keyboard shortcuts for the specified playback functionalities.
 */
export type KeyboardShortcutOptions = {
  stepForward?: KeyboardKey | null;
  stepBackward?: KeyboardKey | null;
  pause?: KeyboardKey | null;
  fastForward?: KeyboardKey | null;
  toggleSkipping?: KeyboardKey | null;
};
