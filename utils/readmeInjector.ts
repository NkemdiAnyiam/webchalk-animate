import { readTextBetween, SearchResultMeta } from "./fileReaders";
import { CodeType, writeBetweenText, WriteMeta } from "./fileWriters";

const sourcesDirectoryPrefix = `${__dirname}/../markdown-code`;
const readmeDir = `${__dirname}/../README.md`;

// const searchResultMeta: SearchResultMeta = {indexCache: 0, spaceLength: 0, id: '', codeType: 'standard'}

// TESTING
// const res = readTextBetween(
//   readmeDir,
//   {
//     startMarker: /\<\!-- MD-S .*? --\>/,
//     endMarker: /\<\!-- MD-E .*? --\>/,
//     readId: true,
//     searchResultMeta,
//     searchStart: searchResultMeta.indexCache,
//   }
// );

// const res2 = readTextBetween(
//   `${__dirname}/../markdown-code/src/usage.ts`,
//   {
//     startMarker: /\/\*\*\*\* MD-S .*? *\//,
//     endMarker: /\/\*\*\*\* MD-E .*? *\//,
//     searchId: searchResultMeta.id,
//   }
// );

// // console.log(res2)

// writeBetweenText(
//   readmeDir,
//   {
//     startMarker: /\<\!-- MD-S .*? --\>/,
//     endMarker: /\<\!-- MD-E .*? --\>/,
//     searchId: searchResultMeta.id,
//     newContent: res2?.trim() ?? '',
//   }
// )




const sources = {
  filePaths: [
    `${sourcesDirectoryPrefix}/src/usage.ts`,
    `${sourcesDirectoryPrefix}/public/usage.html`,
    `${sourcesDirectoryPrefix}/public/styles/usage.css`,
  ],
  startMarker: /(?:\/\*\*\*\*\s*MD-S(?:\s.*?\s*)?\*\/)|(?:\<\!--\s*MD-S(?:\s.*?\s*)?--\>)/,
  endMarker: /(?:\/\*\*\*\*\s*MD-E(?:\s.*?\s*)?\*\/)|(?:\<\!--\s*MD-E(?:\s.*?\s*)?--\>)/,
};

const targets = {
  filePaths: [
    readmeDir,
  ],
  startMarker: /\<\!--\s*MD-S(?:\s.*?\s*)?--\>/,
  endMarker: /\<\!--\s*MD-E(?:\s.*?\s*)?--\>/,
};

function removeTsIgnore(text: string): string {
  return text.replaceAll(/\s*\/\*\* @ts-ignore \*\//g, '');
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
      );

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
    }
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
            beforeend: `${' '.repeat(spaceLength)}`,
            writeMeta,
            searchStart: writeMeta.lastIndex,
            nestedTagRemoval: [sources.startMarker, sources.endMarker],
          }
        );
        break;
      }
      if (!foundCode) { throw new Error(`Example code for id "${targetId}" not found.`); }
    }
  }
}

overwrite();
