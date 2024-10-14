import * as fs from "fs";
import { dedent } from "./dedent";

interface ReadTextBetweenOptions {
  startMarker: string;
  endMarker: string;
  searchStart?: number;
  searchResultMeta?: { endIndex: number; spaceLength: number, id: string };
  readId?: boolean;
}

export function readTextBetween(filePath: string, options: ReadTextBetweenOptions): string | null {
  const {
    startMarker,
    endMarker,
    searchStart = 0,
    searchResultMeta,
    readId = false,
  } = options;

  const fileContent = fs.readFileSync(filePath, 'utf-8');

  const startIndex = fileContent.indexOf(startMarker, searchStart);
  if (startIndex === -1) {
    return null; // Start marker not found
  }

  function escapeRegex(string: string) {
    return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
  }
  
  if (readId) {
    const id = fileContent.substring(startIndex).match(new RegExp(`${escapeRegex(`${startMarker}`)} id="(.*)"`))?.[1];
    if (!id) { throw new Error(`id not found`); }
    if (searchResultMeta) { searchResultMeta.id = id; }
    else { throw new Error(`No meta object to insert id into`); }
  }

  const endIndex = fileContent.indexOf(endMarker, startIndex + startMarker.length);
  if (searchResultMeta) { searchResultMeta.endIndex = endIndex; }
  if (endIndex === -1) {
    return null; // End marker not found
  }

  const textBetween = fileContent.substring(startIndex + startMarker.length, endIndex);
  
  if (searchResultMeta && readId) {
    const reg = new RegExp(`.*${escapeRegex(searchResultMeta.id)}`);
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
