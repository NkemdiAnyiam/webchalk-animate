import * as fs from "fs";
import { dedent } from "./dedent";
import { escapeRegex, regexIndexAfter, regexIndexOf } from "./stringTools";

interface ReadTextBetweenOptions {
  startMarker: string;
  endMarker: string;
  searchStart?: number;
  searchResultMeta?: { endIndex: number; spaceLength: number, id: string };
  readId?: boolean;
  granularity: 'char' | 'line';
}

export function readTextBetween(filePath: string, options: ReadTextBetweenOptions): string | null {
  const {
    startMarker,
    endMarker,
    searchStart = 0,
    searchResultMeta,
    readId = false,
    granularity = 'char',
  } = options;

  const fileContent = fs.readFileSync(filePath, 'utf-8');

  const startIndex = granularity === 'char'
    ? fileContent.indexOf(startMarker, searchStart)
    : regexIndexAfter(fileContent, new RegExp(escapeRegex(startMarker)), searchStart);
  if (startIndex === -1) {
    return null; // Start marker not found
  }
  
  if (readId) {
    const id = fileContent.substring(startIndex).match(new RegExp(`${escapeRegex(`${startMarker}`)} id="(.*)"`))?.[1];
    if (!id) { throw new Error(`id not found`); }
    if (searchResultMeta) { searchResultMeta.id = id; }
    else { throw new Error(`No meta object to insert id into`); }
  }

  const endIndex = granularity === 'char'
    ? fileContent.indexOf(endMarker, startIndex + startMarker.length)
    : regexIndexOf(fileContent, new RegExp(escapeRegex(endMarker)), startIndex);
  if (searchResultMeta) { searchResultMeta.endIndex = endIndex; }
  if (endIndex === -1) {
    return null; // End marker not found
  }

  const textBetween = fileContent.substring(startIndex + (granularity === 'char' ? startMarker.length : 0), endIndex);
  
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
