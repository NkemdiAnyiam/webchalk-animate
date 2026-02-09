// import { AnimClipConfig } from "../AnimClip";
// import { PresetEffectDefinition } from "../Webchalk";
// import { PrefixProps } from "./utilityTypes";

import { AnimClip } from "../1_playbackStructures/AnimationClip";
import { EffectFrameGeneratorSet } from "../2_animationEffects/presetEffectCreation";
import { Union } from "./utilityTypes";

// type FrozenPrefix = '__';
// export type FromFrozenKey<S extends string> = S extends `${FrozenPrefix}${infer key}` ? key : never;
// export type FromFrozenKeys<T extends Partial<AnimClipConfig> | undefined> = keyof { [key in Extract<keyof T, string> as FromFrozenKey<key>]: void };
// export type ToFrozenKey<S extends string> = S extends `${FrozenPrefix}${string}` ? never : `${FrozenPrefix}${S}`;
// export type ToFrozenKeys<T extends AnimClipConfig> = keyof { [key in Extract<keyof T, string> as ToFrozenKey<key>]: void }

// export type AddFreezableConfig<TClipConfig extends AnimClipConfig> = PrefixProps<TClipConfig, FrozenPrefix> & TClipConfig;

// /**
//  * Returns {@link TClipConfig} without any props marked as frozen in {@link TPresetEffectDefinition}'s config.
//  * @interface StripFrozenConfig
//  * @template TClipConfig - Configuration interface for AnimClip or an AnimClip subclass.
//  * @template TPresetEffectDefinition - An effect definition in any preset effect bank.
//  */
// export type StripFrozenConfig<
//   TClipConfig extends AnimClipConfig,
//   TPresetEffectDefinition extends PresetEffectDefinition
// > = Omit<TClipConfig, FromFrozenKeys<TPresetEffectDefinition['defaultConfig']>>;

/**
 * Practical union of the 3 subclasses of {@link Element}.
 * Mostly useful for autocompletions. For example, the `style` property does
 * not exist on {@link Element}, but it does exist on its subclasses. 
 */
export type DOMElement = HTMLElement | SVGElement | MathMLElement;

// TODO: maybe move CssLength-based examples to be injected

/**
 * Options for determining the offset to add to an element's translation.
 */
interface TranslationOffset {
  /**
   * determines offsets to apply to both X and Y positional components
   *  * the offset is applied _after_ {@link alignment} is applied
   *  * string in the form "{@link CssLength} {@link CssLength}"
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
 * Options for the translate animation.
 */
export interface TranslateOptions extends TranslationOffset {
  /**
   * distances to travel in the X and Y directions
   *  * string in the form "{@link CssLength} {@link CssLength}"
   * @example
   * ```ts
   * // move 12px right and 50% of own height down
   * {translate: "12px 50%"}
   * ```
   */
  translate: `${CssLength} ${CssLength}`;
}

/**
 * Options for the move-to animation.
 */
export interface MoveToOptions extends TranslationOffset {
  /** determines horizontal and vertical alignment with target element */
  alignment: `${CssXAlignment} ${CssYAlignment}`;
  /**
   * offset with respect to target's left and top bound
   *  * the offset is applied _after_ {@link alignment} is applied
   *  * string in the form "{@link CssLength} {@link CssLength}"
   * @example
   * ```ts
   * // move 12px right and 50% of target element's height down
   * {targetOffset: "12px 50%"}
   * ```
   */
  targetOffset: `${CssLength} ${CssLength}`;
  /** if `true`, there will be no horizontal translation with respect to the target element (offsets still apply) */
  preserveX: boolean;
  /** if `true`, there will be no vertical translation with respect to the target element (offsets still apply) */
  preserveY: boolean;
}

/**
 * Options for the scroll-self animation
 */
export interface ScrollingOptions {
  /** determines the intersection point of the scrolling container with respect to its top-left bound */
  scrollableOffset?: [x: MultiUnitPlacementX | number, y: MultiUnitPlacementY | number];
  /** determines the intersection point of the scroll target with respect to its top-left corner */
  targetOffset?: [x: MultiUnitPlacementX | number, y: MultiUnitPlacementY | number];
  /** if `true`, the scrolling container will not scroll horizontally */
  preserveX?: boolean;
  /** if `true`, the scrolling container will not scroll vertically */
  preserveY?: boolean;
};

/**
 * A few common options for units in CSS.
 *  * `"px"` refers to pixels
 *  * `"rem"` refers to root em
 *  * `"%"` refers to a percentage
 * @see [CSS values and units](https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/Values_and_units)
 */
export type CssLengthUnit = | 'px' | 'rem' | '%';
/** String in the form of a number and a CSS length unit, such as `"12px"`. */
export type CssLength = `${number}${CssLengthUnit}` | '0';
/**
 * Keywords for common alignments along the y-axis.
 *  * `"top"` indicates a distance of 0% from the top of an element
 *  * `"center"` indicates a distance of 50% from the top of an element
 *  * `"bottom"` indicates a distance of 100% from the top of an element
 */
export type CssYAlignment = | 'top' | 'bottom' | 'center';
/**
 * Keywords for common alignments along the x-axis.
 *  * `"left"` indicates a distance of 0% from the left of an element
 *  * `"center"` indicates a distance of 50% from the left of an element
 *  * `"right"` indicates a distance of 100% from the left of an element
 */
export type CssXAlignment = | 'left' | 'right' | 'center';

/** String in the form of a number and the '%' sign, such as `"50%"`. */
export type percentage = `${number}%`;
/** String in the form of a number and 'px', such as `"12px"`. */
export type pixels = `${number}px`
/** Simply the plus sign `"+"` or the minus sign `"-"`. */
export type operator = '+' | '-';

/**
 * Denotes an X coordinate alignment in the following formats:
 *  * {@link percentage} (such as `"50%"`)
 *  * {@link pixels} (such as `"12px"`)
 *  * {@link CssXAlignment} (such as `"center"` (which is equivalent to `"50%"`) and `"left"` (which is equivalent to `"0%"`))
 *  * {@link percentage} (+|-) {@link pixels} or {@link pixels} (+|-) {@link percentage} (such as `"50% - 12px"` and `"30px - 20%"`)
 *  * {@link CssXAlignment} (+|-) ({@link pixels}|{@link percentage}) (such as `"left + 50%"` and `"center - 12px"`)
 */
export type MultiUnitPlacementX = percentage | pixels | CssXAlignment | `${percentage} ${operator} ${pixels}` | `${pixels} ${operator} ${percentage}` | `${CssXAlignment} ${operator} ${pixels | percentage}`;

/**
 * Denotes an X coordinate alignment in the following formats:
 *  * {@link percentage} (such as `"50%"`)
 *  * {@link pixels} (such as `"12px"`)
 *  * {@link CssYAlignment} (such as `"center"` (which is equivalent to `"50%"`) and `"top"` (which is equivalent to `"0%"`))
 *  * {@link percentage} (+|-) {@link pixels} or {@link pixels} (+|-) {@link percentage} (such as `"50% - 12px"` and `"30px - 20%"`)
 *  * {@link CssYAlignment} (+|-) ({@link pixels}|{@link percentage}) (such as `"top + 50%"` and `"center - 12px"`)
 */
export type MultiUnitPlacementY = percentage | pixels | CssYAlignment | `${percentage} ${operator} ${pixels}` | `${pixels} ${operator} ${percentage}` | `${CssYAlignment} ${operator} ${pixels | percentage}`;

/**
 * Tuple containing the result of parsing a multi-unit placement string
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
  | 'Connector Setter'
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
 * Standard CSS style property names in camelCase form.
 * * Standard names are autocompleted, but non-standard values are still allowed (this accounts
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

export type TextEditRate = `${number}${'wpm' | 'cpm'}`
