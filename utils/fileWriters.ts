import * as fs from "fs";
import { getLine, getTagMatches } from "./stringTools";

export type CodeType = 'ts' | 'standard' | 'inline-code' | 'html' | 'css' | 'comment-block';

export interface WriteMeta {
  lastIndex: number;
}

interface WriteBetweenTextOptions {
  startMarker: RegExp;
  endMarker: RegExp;
  newContent: string;
  searchStart?: number;
  searchId: string;
  codeType?: CodeType;
  prependLines?: string;
  beforeend?: string;
  afterbegin?: string;
  arrange?: 'inline' | 'block';
  writeMeta?: WriteMeta;
  nestedTagRemoval?: RegExp[];
}

export async function writeBetweenText(filePath: string, options: WriteBetweenTextOptions): Promise<void> {
  const {
    startMarker,
    endMarker,
    newContent,
    searchStart = 0,
    searchId,
    prependLines = '',
    beforeend = '',
    afterbegin = '',
    writeMeta,
    nestedTagRemoval = [],
  } = options;

  try {
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');

    const startTag = getTagMatches(fileContent.substring(searchStart), startMarker).find(tag => tag.includes(searchId));
    if (!startTag) {
      throw new Error(`Start text "${startMarker}" with id "${searchId}" not found in the file.`);
    }
    const startIndex = fileContent.indexOf(startTag, searchStart) + startTag.length;
    
    const possibleEndTags = getTagMatches(fileContent.substring(startIndex), endMarker);
    const endTag = startTag.includes('MD-G')
      ? possibleEndTags[0] // greedy
      : possibleEndTags.find(tag => tag.includes(searchId)); // matching id
    if (!endTag) {
      throw new Error(`End text "${endMarker}" with id "${searchId}" not found in the file.`);
    }
    const endIndex = fileContent.indexOf(endTag, startIndex);

    if (writeMeta) {
      writeMeta.lastIndex = startIndex;
    }


    const wrapper = (content: string, codeType: CodeType) => {
      switch(codeType) {
        case "html":
          return `\`\`\`html\n${content}\n\`\`\``;
        case "css":
          return `\`\`\`css\n${content}\n\`\`\``;
        case "ts":
          return `\`\`\`ts\n${content}\n\`\`\``;
        case "standard":
          return content;
        case "inline-code":
          return `\`${content.trim()}\``;
        case "comment-block":
          return content.replace(/(?:\/\*(\r\n|\n)?)|(?:(\r\n|\n)?\*\/)/g, '');
        default: throw new Error(`Invalid codeType "${codeType}"`);
      }
    }

    const removeNestedTags = (text: string, nestedTagRemoval: RegExp[]): string => {
      return nestedTagRemoval.reduce((txt, removalRegex) => txt.replaceAll(new RegExp(removalRegex, 'g'), ''), text);
    }
    
    const codeType = options.codeType ?? startTag.match(/code-type="(.*?)"/)?.[1] as CodeType ?? 'standard';
    const arrange: typeof options.arrange =
      options.arrange
      ?? (codeType === 'inline-code' ? 'inline' : null)
      ?? (getLine(fileContent, startTag, searchStart) === getLine(fileContent, endTag, searchStart) ? 'inline' : 'block');

    const modifiedContent =
      fileContent.substring(0, startIndex)
      + afterbegin
      + (arrange === 'block' ? '\n' : '')
      + prependLines
      + removeNestedTags(wrapper(newContent.replaceAll(/(^\n*)|(\n*$)/g, ''), codeType), nestedTagRemoval)
        .split(`\n`).join(`\n${prependLines}`)
      + (arrange === 'block' ? '\n' : '')
      + beforeend
      + fileContent.substring(endIndex);

    if (fileContent === modifiedContent) { return; }

    await fs.promises.writeFile(filePath, modifiedContent, 'utf-8');
  } catch (err) {
    console.error('Error:', err);
  }
}
