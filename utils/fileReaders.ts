import * as fs from "fs";
import { dedent } from "./dedent";
import { escapeRegex, getTagMatch, getTagMatches } from "./stringTools";
import { CodeType } from "./fileWriters";

export interface SearchResultMeta {
  indexCache: number;
  spaceLength: number,
  id: string;
  codeType: CodeType;
}

interface ReadTextBetweenOptions {
  startMarker: RegExp;
  endMarker: RegExp;
  searchStart?: number;
  searchResultMeta?: SearchResultMeta;
  readId?: boolean;
  searchId?: string;
  codeType?: CodeType;
}

export function readTextBetween(filePath: string, options: ReadTextBetweenOptions): string | null {
  const {
    startMarker,
    endMarker,
    searchStart = 0,
    searchResultMeta,
    readId = false,
    searchId,
    codeType = 'standard',
  } = options;

  const fileContent = fs.readFileSync(filePath, 'utf-8');

  const startTag = searchId
    // if searchId is provided, find the general start tag that contains it
    ? getTagMatches(fileContent.substring(searchStart), startMarker).find(tag => tag.includes(searchId))
    // otherwise, just find the first matching start tag (given searchStart)
    : getTagMatch(fileContent.substring(searchStart), startMarker);
  if (!startTag) { return null; }
  const startReadIndex = fileContent.indexOf(startTag, searchStart) + startTag.length;
  if (startReadIndex === -1) {
    throw new Error(`Somehow, startReadIndex could not be computed.`); // Start marker not found
  }

  if (searchResultMeta) {
    searchResultMeta.codeType = codeType ?? startTag.match(/code-type="(.*?)"/)?.[1] as CodeType;
  }
  
  // id is either searchId (if provided) or the id from the found startTag
  const id = searchId ?? startTag.match(/id="(.*?)"/)?.[1];
  if (!id) { throw new Error(`id not found in startTag "${startTag}"`); }
  // if readId, read the id into searchResultMeta
  if (readId) {
    if (searchResultMeta) { searchResultMeta.id = id; }
    else { throw new Error(`No meta object to insert id into`); }
  }

  const endTag = getTagMatches(fileContent.substring(startReadIndex), endMarker).find(tag => tag.includes(id));
  if (!endTag) {
    throw new Error(`End tag for given end marker "${endMarker}" and id "${id}" could not be found.`)
  }
  const endReadIndex = fileContent.indexOf(endTag, startReadIndex);
  if (endReadIndex === -1) {
    throw new Error(`End marker corresponding to\n\tstart marker "${startMarker}", \n\tid "${id}"\nnot found`); // End marker not found
  }
  if (searchResultMeta) { searchResultMeta.indexCache = endReadIndex; }

  // compute the text between the startTag and endTag
  const textBetween = fileContent.substring(startReadIndex, endReadIndex);
  
  // if the id was read into a search result meta object,
  // compute the amount of space at the beginning of the line containing the id
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
