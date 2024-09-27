// import { AnimClipConfig } from "../AnimClip";
// import { EffectGenerator } from "../WebFlik";
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
 * Options for determing the offset to add to an element's translation.
 */
interface TranslationOffset {
  /** determines offsets to apply to both X and Y positional properties */
  offsetSelf: `${CssLength}, ${CssLength}`;
  /** determines additional horizontal offset */
  offsetSelfX: CssLength;
  /** determines additional vertical offset */
  offsetSelfY: CssLength;
}

// CHANGE NOTE: Use strings in the format of <number><CssLengthUnit> and remove XY things
/**
 * Options for the translate animation.
 */
export interface TranslateOptions extends TranslationOffset {
  /** distances to travel in the X and Y directions */
  translate: `${CssLength}, ${CssLength}`;
  /** distance to travel in the X direction */
  translateX: CssLength;
  /** distance to travel in the Y direction */
  translateY: CssLength;
}

/**
 * Options for the move-to animation.
 */
export interface MoveToOptions extends TranslationOffset {
  /** determines horizontal and vertical alignment with target element */
  alignment: `${CssXAlignment} ${CssYAlignment}`
  /** determines vertical alignment with target element */
  alignmentY: CssYAlignment;
  /** determines horizontal alignment with target element */
  alignmentX: CssXAlignment;
  /** offset with respect to target's left and top bound */
  offsetTarget: `${CssLength}, ${CssLength}`;
  /** offset based on target's left bound or width (50% pushes us 50% of the target element's width rightward) */
  offsetTargetX: CssLength;
  /** offset based on target's top bound or height (5% pushes us 50% of the target element's height downward) */
  offsetTargetY: CssLength;
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
  /** determines the horizontal intersection point of the scrolling container with respect to its left bound */
  scrollableOffsetX?: MultiUnitPlacementX | number;
  /** determines the vertical intersection point of the scrolling container with respect to its top bound */
  scrollableOffsetY?: MultiUnitPlacementY | number;
  /** determines the intersection point of the scroll target with respect to its top-left corner */
  targetOffset?: [x: MultiUnitPlacementX | number, y: MultiUnitPlacementY | number];
  /** determines the horizontal intersection point of the scroll target with respect to its left bound */
  targetOffsetX?: MultiUnitPlacementX | number;
  /** determines the vertical intersection point of the scroll target with respect to its top bound */
  targetOffsetY?: MultiUnitPlacementY | number;
  /** if `true`, the scrolling container will not scroll horizontally */
  preserveX?: boolean;
  /** if `true`, the scrolling container will not scroll vertically */
  preserveY?: boolean;
};

export type CssLengthUnit = | 'px' | 'rem' | '%';
/** String in the form of a number and a CSS length unit, such as `"12px"`. */
export type CssLength = `${number}${CssLengthUnit}`;
export type CssYAlignment = | 'top' | 'bottom' | 'center';
export type CssXAlignment = | 'left' | 'right' | 'center';

/** String in the form of a number and the '%' sign, such as `"50%"`. */
export type percentage = `${number}%`;
/** String in the form of a number and 'px', such as `"12px"`. */
export type pixels = `${number}px`
export type operator = '+' | '-';

/**
 * Denotes an X coordinate alignment in the following formats:
 * - {@link percentage} (such as `"50%"`)
 * - {@link pixels} (such as `"12px"`)
 * - {@link CssXAlignment} (such as `"center"` (which is equivalent to `"50%"`) and `"left"` (which is equivalent to `"0%"`))
 * - {@link percentage} (+|-) {@link pixels} or {@link pixels} (+|-) {@link percentage} (such as `"50% - 12px"` and `"30px - 20%"`)
 * - {@link CssXAlignment} (+|-) ({@link pixels}|{@link percentage}) (such as `"left + 50%"` and `"center - 12px"`)
 */
export type MultiUnitPlacementX = percentage | pixels | CssXAlignment | `${percentage} ${operator} ${pixels}` | `${pixels} ${operator} ${percentage}` | `${CssXAlignment} ${operator} ${pixels | percentage}`;

/**
 * Denotes an X coordinate alignment in the following formats:
 * - {@link percentage} (such as `"50%"`)
 * - {@link pixels} (such as `"12px"`)
 * - {@link CssYAlignment} (such as `"center"` (which is equivalent to `"50%"`) and `"top"` (which is equivalent to `"0%"`))
 * - {@link percentage} (+|-) {@link pixels} or {@link pixels} (+|-) {@link percentage} (such as `"50% - 12px"` and `"30px - 20%"`)
 * - {@link CssYAlignment} (+|-) ({@link pixels}|{@link percentage}) (such as `"top + 50%"` and `"center - 12px"`)
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
