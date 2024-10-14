import { readTextBetween, SearchResultMeta } from "./fileReaders";
import { writeBetweenText } from "./fileWriters";

const readmeDir = `${__dirname}/../README.md`;

const searchResultMeta: SearchResultMeta = {indexCache: 0, spaceLength: 0, id: ''}

// TESTING
const res = readTextBetween(
  readmeDir,
  {
    startMarker: /\<\!-- MD-START .*? --\>/,
    endMarker: /\<\!-- MD-END .*? --\>/,
    // granularity: 'char',
    readId: true,
    searchResultMeta,
    searchStart: searchResultMeta.indexCache,
  }
);

const res2 = readTextBetween(
  `${__dirname}/../markdown-code/src/usage.ts`,
  {
    startMarker: /\/\*\*\*\* MD-START .*? *\//,
    endMarker: /\/\*\*\*\* MD-END .*? *\//,
    searchId: searchResultMeta.id,
    // granularity: 'tag',
  }
);

// console.log(res2)

writeBetweenText(
  readmeDir,
  {
    startMarker: /\<\!-- MD-START .*? --\>/,
    endMarker: /\<\!-- MD-END .*? --\>/,
    searchId: searchResultMeta.id,
    // granularity: 'tag',
    newContent: res2 ?? '',
  }
)
