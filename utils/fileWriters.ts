import * as fs from "fs";

export async function writeBetweenText(filePath: string, startText: string, endText: string, newContent: string, searchIndex: number = 0): Promise<void> {
  try {
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');

    const startIndex = fileContent.indexOf(startText, searchIndex);
    const endIndex = fileContent.indexOf(endText, startIndex + startText.length + searchIndex);

    if (startIndex === -1 || endIndex === -1) {
      throw new Error('Start or end text not found in the file.');
    }

    const modifiedContent = fileContent.substring(0, startIndex + startText.length) +
      newContent +
      fileContent.substring(endIndex);

    if (fileContent === modifiedContent) { return; }

    await fs.promises.writeFile(filePath, modifiedContent, 'utf-8');
  } catch (err) {
    console.error('Error:', err);
  }
}
