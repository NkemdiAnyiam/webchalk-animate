// import { AnimClipConfig } from "../AnimClip";
// import { EffectGenerator } from "../Webimator";
// import { PrefixProps } from "./utilityTypes";

// type FrozenPrefix = '__';
// export type FromFrozenKey<S extends string> = S extends `${FrozenPrefix}${infer key}` ? key : never;
// export type FromFrozenKeys<T extends Partial<AnimClipConfig> | undefined> = keyof { [key in Extract<keyof T, string> as FromFrozenKey<key>]: void };
// export type ToFrozenKey<S extends string> = S extends `${FrozenPrefix}${string}` ? never : `${FrozenPrefix}${S}`;
// export type ToFrozenKeys<T extends AnimClipConfig> = keyof { [key in Extract<keyof T, string> as ToFrozenKey<key>]: void }

// export type AddFreezableConfig<TClipConfig extends AnimClipConfig> = PrefixProps<TClipConfig, FrozenPrefix> & TClipConfig;

// /**
//  * Returns TClipConfig without any props marked as frozen in TEffectGenerator's config.
//  * @interface StripFrozenConfig
//  * @typeParam TClipConfig - Configuration interface for AnimClip or an AnimClip subclass.
//  * @typeParam TEffectGenerator - An effect generator defined in any generator bank.
//  */
// export type StripFrozenConfig<
//   TClipConfig extends AnimClipConfig,
//   TEffectGenerator extends EffectGenerator
// > = Omit<TClipConfig, FromFrozenKeys<TEffectGenerator['defaultConfig']>>;

/**
 * Practical union of the 3 subclasses of {@link Element}.
 * Mostly useful for autocompletions. For example, the `style` property does
 * not exist on {@link Element}, but it does exist on its subclasses. 
 */
export type DOMElement = HTMLElement | SVGElement | MathMLElement;

// TODO: maybe move CssLength-based examples to be injected

/**
 * Options for determing the offset to add to an element's translation.
 */
interface TranslationOffset {
  /**
   * determines offsets to apply to both X and Y positional components
   *  * the offset is applied _after_ {@link alignment} is applied
   *  * string in the form "{@link CssLength}, {@link CssLength}"
   * @example
   * ```ts
   * {selfOffset: "12px, 50%"}
   * ```
   */
  selfOffset: `${CssLength}, ${CssLength}`; // move 12px right and 50% of own height down
}

// CHANGE NOTE: Use strings in the format of <number><CssLengthUnit> and remove XY things
/**
 * Options for the translate animation.
 */
export interface TranslateOptions extends TranslationOffset {
  /**
   * distances to travel in the X and Y directions
   *  * string in the form "{@link CssLength}, {@link CssLength}"
   * @example
   * ```ts
   * {translate: "12px, 50%"} // move 12px right and 50% of own height down
   * ```
   */
  translate: `${CssLength}, ${CssLength}`;
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
   *  * string in the form "{@link CssLength}, {@link CssLength}"
   * @example
   * ```ts
   * {targetOffset: "12px, 50%"} // move 12px right and 50% of target element's height down
   * ```
   */
  targetOffset: `${CssLength}, ${CssLength}`;
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
export type CssLength = `${number}${CssLengthUnit}`;
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
  | 'Connector Exit';

/**
 * The possible formats for writing keyframes. The two accepted forms
 * are {@link PropertyIndexedKeyframes} and—more commonly used—{@link Keyframe}[].
 * @see [Keyframe Formats](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Keyframe_Formats)
 */
export type Keyframes = PropertyIndexedKeyframes | Keyframe[];
