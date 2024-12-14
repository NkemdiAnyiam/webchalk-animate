import { readTextBetween, SearchResultMeta } from "./fileReaders";
import { CodeType, writeBetweenText, WriteMeta } from "./fileWriters";

const directoryPrefix = `${__dirname}/../src`;

const sources = {
  filePaths: [`${directoryPrefix}/TSDocExamples/TSDocExamples.ts`],
  startMarker: /\/\*\*\*\* EX:S .*? \*\//,
  endMarker: /\/\*\*\*\* EX:E .*? \*\//,
};

const targets = {
  filePaths: [
    `${directoryPrefix}/Webimator.ts`,
    `${directoryPrefix}/1_playbackStructures/AnimationClip.ts`,
    `${directoryPrefix}/1_playbackStructures/AnimationClipCategories.ts`,
    `${directoryPrefix}/1_playbackStructures/AnimationTimeline.ts`,
    `${directoryPrefix}/2_animationEffects/easing.ts`,
    `${directoryPrefix}/2_animationEffects/compositionTypes.ts`,
    `${directoryPrefix}/2_animationEffects/libraryPresetEffectBanks.ts`,
  ],
  startMarker: /\* \<\!-- EX:S .*? --\>/,
  endMarker: /\* \<\!-- EX:E .*? --\>/,
};

function removeTsIgnore(text: string): string {
  return text.replaceAll(/\s\/\*\* @ts-ignore \*\//g, '');
}

async function overwrite() {
  // for every file that contains @example tags we want to fill (indicated by a special tag)...
  for (const targetPath of targets.filePaths) {
    const searchResultMeta: SearchResultMeta = {indexCache: 0, spaceLength: 0, id: '', codeType: 'standard'};
    let foundTargetText: string | null;
    const targetMatches: {targetId: string, spaceLength: number, codeType: CodeType}[] = [];
    // for each special tag in the given file, store the found target text an the target tag id
    while (true) {
      foundTargetText = readTextBetween(
        targetPath,
        {
          startMarker: targets.startMarker,
          endMarker: targets.endMarker,
          searchStart: searchResultMeta.indexCache,
          searchResultMeta: searchResultMeta,
          readId: true,
        }
      )

      if (foundTargetText === null) { break; }

      targetMatches.push({
        targetId: searchResultMeta.id,
        spaceLength: searchResultMeta.spaceLength ?? 0,
        codeType: searchResultMeta.codeType
      });
    }
  
    // search for the target tag's id within whichever source file contains the real code
    const writeMeta: WriteMeta = {
      lastIndex: 0,
    };
    for (const {targetId, spaceLength, codeType} of targetMatches) {
      let foundCode = false;
      // search each source path until the one containing the id is found
      for (const sourcePath of sources.filePaths) {
        // read the source path to see if it contains the id (and thus the example code)
        let exampleCode = readTextBetween(
          sourcePath,
          {
            startMarker: sources.startMarker,
            endMarker: sources.endMarker,
            searchId: targetId,
          }
        )?.trim();

        // if not found, continue, checking the next source path
        if (!exampleCode) { continue; }
    
        // if the id was found, then we also have the text for the source code.
        // now inject the code into the target file, replacing/updating whatever was there before
        foundCode = true;
        await writeBetweenText(
          targetPath,
          {
            startMarker: targets.startMarker,
            endMarker: targets.endMarker,
            searchId: targetId,
            newContent: removeTsIgnore(`${exampleCode}`),
            prependLines: `${' '.repeat(spaceLength)}* `,
            beforeend: `${' '.repeat(spaceLength)}`,
            writeMeta,
            searchStart: writeMeta.lastIndex,
          }
        );
        break;
      }
      if (!foundCode) { throw new Error(`Example code for id "${targetId}" not found.`); }
    }
  }
}

overwrite();
