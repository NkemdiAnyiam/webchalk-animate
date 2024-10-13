import { readTextBetween } from "./utils/fileReaders";
import { writeBetweenText } from "./utils/fileWriters";

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

async function overwrite() {
  // for every file that contains @example tags we want to fill (indicated by a specific <div>)...
  for (const targetPath of targets.filePaths) {
    const searchResultMeta = {endIndex: -1, spaceLength: 0};
    let foundTargetText: string | null;
    const targetMatches: {targetDivId: string, spaceLength: number}[] = [];
    // for each special <div> in the given file, store the found target text an the target div id
    while (foundTargetText = readTextBetween(
        targetPath,
        {
          startMarker: targets.startMarker,
          endMarker: targets.endMarker,
          searchStart: searchResultMeta.endIndex,
          searchResultMeta: searchResultMeta,
        }
      )
    ) {
      const targetDivId = foundTargetText.match(/^(.*)">/)?.[1] ?? '';
      targetMatches.push({targetDivId, spaceLength: searchResultMeta.spaceLength ?? 0});
    }
  
    // search for the special div's id within whichever source file contains the real code
    for (const {targetDivId, spaceLength} of targetMatches) {
      let foundCode = false;
      // search each source path until the one containing the id is found
      for (const sourcePath of sources.filePaths) {
        // read the source path to see if it contains the id (and thus the example code)
        let exampleCode = readTextBetween(
          sourcePath,
          {
            startMarker: `${sources.startMarker}${targetDivId} */`,
            endMarker: sources.endMarker
          }
        )?.trim();

        // if not found, continue, checking then next source path
        if (!exampleCode) { continue; }
    
        // if the id was found, then we also have the text for the source code.
        // now inject the code into the target file, replacing/updating whatever was there before
        foundCode = true;
        await writeBetweenText(
          targetPath,
          {
            startText: `${targets.startMarker}${targetDivId}">`,
            endText: targets.endMarker,
            newContent: wrapCodeText(`${exampleCode}`, spaceLength)
          }
        );
        break;
      }
      if (!foundCode) { throw new Error(`Example code for "${targetDivId}" not found.`); }
    }
  }
}

overwrite();
