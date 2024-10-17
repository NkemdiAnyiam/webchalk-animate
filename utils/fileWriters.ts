import * as fs from "fs";
import { getLine, getTagMatches } from "./stringTools";

export type CodeType = 'ts' | 'standard';

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
  arrange?: 'inline' | 'block'
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
  } = options;

  try {
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');

    const startTag = getTagMatches(fileContent.substring(searchStart), startMarker).find(tag => tag.includes(searchId));
    if (!startTag) {
      throw new Error(`Start text "${startMarker}" with id "${searchId}" not found in the file.`);
    }
    const startIndex = fileContent.indexOf(startTag, searchStart) + startTag.length;
    const endTag = getTagMatches(fileContent.substring(startIndex), endMarker).find(tag => tag.includes(searchId));
    if (!endTag) {
      throw new Error(`End text "${endMarker}" with id "${searchId}" not found in the file.`);
    }
    const endIndex = fileContent.indexOf(endTag, startIndex);


    const wrapper = (content: string, codeType: CodeType) => {
      switch(codeType) {
        case "ts":
          return `\`\`\`ts\n${content}\n\`\`\``
        case "standard":
          return content;
        case "inline-code":
          return `\`${content.trim()}\``;
        default: throw new Error(`Invalid codeType "${codeType}"`);
      }
    }
    
    const arrange: typeof options.arrange =
      options.arrange
      ?? (getLine(fileContent, startTag, searchStart) === getLine(fileContent, endTag, searchStart) ? 'inline' : 'block');
    const codeType = options.codeType ?? startTag.match(/code-type="(.*?)"/)?.[1] as CodeType ?? 'standard';

    const modifiedContent =
      fileContent.substring(0, startIndex)
      + afterbegin
      + (arrange === 'block' ? '\n' : '')
      + prependLines
      + wrapper(newContent.replaceAll(/(^\n*)|(\n*$)/g, ''), codeType)
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
