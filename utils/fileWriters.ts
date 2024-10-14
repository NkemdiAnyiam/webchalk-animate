import * as fs from "fs";
import { getTagMatches } from "./stringTools";

interface WriteBetweenTextOptions {
  startMarker: RegExp;
  endMarker: RegExp;
  newContent: string;
  searchStart?: number;
  searchId: string;
}

export async function writeBetweenText(filePath: string, options: WriteBetweenTextOptions): Promise<void> {
  const {
    startMarker,
    endMarker,
    newContent,
    searchStart = 0,
    searchId,
  } = options;

  try {
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');

    const startTag = getTagMatches(fileContent.substring(searchStart), startMarker).find(tag => tag.includes(searchId));
    if (!startTag) {
      throw new Error(`Start text "${startMarker}" not found in the file.`);
    }
    const startIndex = fileContent.indexOf(startTag, searchStart) + startTag.length;
    const endTag = getTagMatches(fileContent.substring(startIndex), endMarker).find(tag => tag.includes(searchId));
    if (!endTag) {
      throw new Error(`End text "${endMarker}" not found in the file.`);
    }
    const endIndex = fileContent.indexOf(endTag, startIndex);

    const modifiedContent = fileContent.substring(0, startIndex) +
      newContent +
      fileContent.substring(endIndex);

    if (fileContent === modifiedContent) { return; }

    await fs.promises.writeFile(filePath, modifiedContent, 'utf-8');
  } catch (err) {
    console.error('Error:', err);
  }
}
