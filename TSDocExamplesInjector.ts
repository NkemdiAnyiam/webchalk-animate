import * as fs from "fs";

const directoryPrefix = `${__dirname}/src`;

const sources = {
  filePaths: [`${directoryPrefix}/TSDocExamples/TSDocExamples.ts`],
  startMarker: `/**** example--`,
  endMarker: `/**** end example */`,
};

const targets = {
  filePaths: [
    `${directoryPrefix}/Webimator.ts`,
    `${directoryPrefix}/1_playbackStructures/AnimationClip.ts`,
    `${directoryPrefix}/2_animationEffects/easing.ts`,
    `${directoryPrefix}/2_animationEffects/generationTypes.ts`,
  ],
  startMarker: `* <div id="example--`,
  endMarker: `* </div>`,
};

function wrapCodeText(text: string, spaceLength: number): string {
  const spaces = ' '.repeat(spaceLength);
  const content = text
    .replaceAll(/\s*\/\*\* @ts-ignore \*\//g, '')
    .split('\n')
    .join(`\n${spaces}* `);

  return `\n${spaces}* @example\n${spaces}* \`\`\`ts\n${spaces}* ${content}\n${spaces}* \`\`\`\n${spaces}`;
}






function readTextBetween(filePath: string, startMarker: string, endMarker: string, searchIndex: number = 0, searchResultMeta?: {endIndex: number, spaceLength?: number}): string | null {
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  const startIndex = fileContent.indexOf(startMarker, searchIndex);
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






async function writeBetweenText(filePath: string, startText: string, endText: string, newContent: string, searchIndex: number = 0): Promise<void> {
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

    await fs.promises.writeFile(filePath, modifiedContent, 'utf-8');
  } catch (err) {
    console.error('Error:', err);
  }
}






async function overwrite() {
  // for every file that contains @example tags we want to fill (indicated by a specific <div>)...
  for (const targetPath of targets.filePaths) {
    const searchResultMeta = {endIndex: -1, spaceLength: 0};
    let foundTargetText: string | null;
    const targetMatches: {targetDivId: string, spaceLength: number}[] = [];
    // for each special <div> in the given file, store the found target text an the target div id
    while (foundTargetText = readTextBetween(targetPath, targets.startMarker, targets.endMarker, searchResultMeta.endIndex, searchResultMeta)) {
      const targetDivId = foundTargetText.match(/^(.*)">/)?.[1] ?? '';
      targetMatches.push({targetDivId, spaceLength: searchResultMeta.spaceLength ?? 0});
    }
  
    // search for the special div's id within whichever source file contains the real code
    for (const {targetDivId, spaceLength} of targetMatches) {
      let foundCode = false;
      for (const sourcePath of sources.filePaths) {
        let exampleCode = readTextBetween(sourcePath, `${sources.startMarker}${targetDivId} */`, sources.endMarker, 0)?.trim();
        if (!exampleCode) { continue; }
    
        // if the id was found, then we also have the text for the source code.
        // now inject the code into the target file, replacing/updating whatever was there before
        foundCode = true;
        await writeBetweenText(targetPath, `${targets.startMarker}${targetDivId}">`, targets.endMarker, wrapCodeText(`${exampleCode}`, spaceLength));
        break;
      }
      if (!foundCode) { throw new Error(`Example code for "${targetDivId}" not found.`); }
    }
  }
}

overwrite();
