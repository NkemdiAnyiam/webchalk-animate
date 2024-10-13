import * as fs from "fs";
import { dedent } from "./dedent";

interface ReadTextBetweenOptions {
  startMarker: string;
  endMarker: string;
  searchStart?: number;
  searchResultMeta?: { endIndex: number; spaceLength: number };
}

export function readTextBetween(filePath: string, options: ReadTextBetweenOptions): string | null {
  const {
    startMarker,
    endMarker,
    searchStart = 0,
    searchResultMeta,
  } = options;

  const fileContent = fs.readFileSync(filePath, 'utf-8');

  const startIndex = fileContent.indexOf(startMarker, searchStart);
  if (startIndex === -1) {
    return null; // Start marker not found
  }

  const endIndex = fileContent.indexOf(endMarker, startIndex + startMarker.length);
  if (searchResultMeta) { searchResultMeta.endIndex = endIndex; }
  if (endIndex === -1) {
    return null; // End marker not found
  }

  const textBetween = fileContent.substring(startIndex + startMarker.length, endIndex);
  
  if (searchResultMeta) {
    const divId = textBetween.match(/^(.*)">/)?.[1] ?? '';
    const reg = new RegExp(`.*${divId}`);
    const startingLine = fileContent.match(reg)![0];
    searchResultMeta.spaceLength = startingLine.match(/^\s*/)?.[0].length ?? 0;
  }

  return textBetween;
}

interface ReadLinesOptions {
  start?: number;
  end?: number;
  shouldDedent?: boolean;
}

export function readLines(filePath: string, options: ReadLinesOptions) {
  const {
    start = 0,
    end = undefined,
    shouldDedent = false,
  } = options;

  const fileContent = fs.readFileSync(filePath, 'utf-8');

  const lines = fileContent.split(/\r\n|\n/);
  const resultText = lines.slice(start - 1, end ?? lines.length).join('\n')
  return shouldDedent ? dedent(resultText) : resultText;
}
