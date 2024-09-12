import { AnimClip } from "../AnimClip";
import { AnimSequence } from "../AnimSequence";
import { AnimTimeline } from "../AnimTimeline";
import { getOpeningTag, indexToOrdinal } from "./helpers";

export type ClipErrorGenerator = {
  <TError extends Error>(error: TError): TError;
  // elementOverride is used only in the constructor where this.domElem is not yet defined
  <TError extends Error>(ErrorClass: new (message: string) => TError, msg: string, elementOverride?: Element): TError;
};

export type SequenceErrorGenerator = {
  <TError extends Error>(error: TError): TError;
  <TError extends Error>(ErrorClass: new (message: string) => TError, msg: string): TError;
};

export type TimelineErrorGenerator = {
  <TError extends Error>(error: TError): TError;
  <TError extends Error>(ErrorClass: new (message: string) => TError, msg: string): TError;
};

export type GeneralErrorGenerator = {
  <TError extends Error>(
    ErrorClassOrInstance: TError | (new (message: string) => TError),
    msg: string,
    components?: {timeline?: AnimTimeline, sequence?: AnimSequence, clip?: AnimClip, element?: Element}): TError,
};

class CommitStylesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CommitStylesError';
  }
}

class InvalidElementError extends TypeError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidElementError';
  }
}

class InvalidEntranceAttempt extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidEntranceAttempt';
  }
}

class InvalidExitAttempt extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidExitAttempt';
  }
}

class InvalidPhasePositionError extends RangeError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPhasePositionError';
  }
}

class LockedOperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LockedOperationError';
  }
}

class TimeParadoxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LockedOperationError';
  }
}

class ChildPlaybackError extends LockedOperationError {
  constructor(message: string) {
    super(message);
    this.name = 'ChildPlaybackError';
  }
}

class InvalidChildError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidChildError';
  }
}

export const CustomErrors = {
  CommitStylesError,
  InvalidElementError,
  InvalidEntranceAttempt,
  InvalidExitAttempt,
  InvalidPhasePositionError,
  LockedOperationError,
  TimeParadoxError,
  ChildPlaybackError,
  InvalidChildError,
};

export const errorTip = (tip: string) => {
  return `\n\n${'*'.repeat(10)}\n${tip}\n${'*'.repeat(10)}`;
};

export const generateError: GeneralErrorGenerator = (ErrorClassOrInstance, msg = '<unspecified error>', components = {}) => {
  const {timeline, sequence, clip, element} = components;
  const locationPostfix = (
    `\n\n${'-'.repeat(25)}LOCATION${'-'.repeat(25)}` +
    (timeline
      ? `\nTimeline: [Timeline Name: ${timeline.getConfig().timelineName}]` +
        `\n          [At Step# ${timeline.getStatus().stepNumber}]` +
        (sequence ? `\n          [At Index ${timeline.findSequenceIndex(sequence!)} (the ${indexToOrdinal(timeline.findSequenceIndex(sequence!))} sequence)]` : '') +
        ((sequence || clip) ? `\n${'-'.repeat(20)}` : '')
      : ''
    ) +
    (sequence
      ? `\nSequence: [Tag: ${sequence.getTag()}] [Description: ${sequence.getDescription()}]` +
        (clip ? `\n          [At Index ${sequence.findClipIndex(clip!)} (the ${indexToOrdinal(sequence.findClipIndex(clip!))} clip)]` : '') +
        (clip ? `\n${'-'.repeat(20)}` : '')
      : ''
    ) +
    (clip
      ? `\nClip:     [Category: ${clip.getEffectDetails('category')}] [Effect: ${clip.getEffectDetails('effectName')}]` +
        `\nDOM Tag:  ${getOpeningTag(element)}`
      : ''
    ) +
    `\n${'-'.repeat(58)}`
  );
  if (ErrorClassOrInstance instanceof Error) {
    /** @ts-ignore */
    return (new ErrorClassOrInstance.constructor(ErrorClassOrInstance.message + locationPostfix, {cause: ErrorClassOrInstance}));
  }
  return new ErrorClassOrInstance(`${msg}` + locationPostfix);
};
