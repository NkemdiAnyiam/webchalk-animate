import * as fs from "fs";
import { escapeRegex, regexIndexAfter, regexIndexOf } from "./stringTools";

interface WriteBetweenTextOptions {
  startText: string;
  endText: string;
  newContent: string;
  searchStart?: number;
  granularity: 'char' | 'line';
}

export async function writeBetweenText(filePath: string, options: WriteBetweenTextOptions): Promise<void> {
  const {
    startText,
    endText,
    newContent,
    searchStart = 0,
    granularity,
  } = options;

  try {
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');

    const startIndex = granularity === 'char'
      ? fileContent.indexOf(startText, searchStart)
      : regexIndexAfter(fileContent, new RegExp(escapeRegex(startText)), searchStart);
    const endIndex = granularity === 'char'
      ? fileContent.indexOf(endText, startIndex + startText.length + searchStart)
      : regexIndexOf(fileContent, new RegExp(escapeRegex(endText)), startIndex);

    if (startIndex === -1 || endIndex === -1) {
      throw new Error('Start or end text not found in the file.');
    }

    const modifiedContent = fileContent.substring(0, startIndex + (granularity === 'char' ? startText.length : 0)) +
      newContent +
      fileContent.substring(endIndex);

    if (fileContent === modifiedContent) { return; }

    await fs.promises.writeFile(filePath, modifiedContent, 'utf-8');
  } catch (err) {
    console.error('Error:', err);
  }
}
