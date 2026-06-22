import * as fs from 'fs';

const htmlFileNames = [
  'clip-info-box',
  'clip',
  'sequence',
  'timeline-pane',
];

const htmlFolderPath = `${__dirname}/../componentTemplates/html`;
const tsFolderPath = `${__dirname}/../componentTemplates/ts`

for (const htmlFileName of htmlFileNames) {
  fs.readFile(
    `${htmlFolderPath}/${htmlFileName}.html`,
    {encoding: 'utf-8'},
    (err, htmlStr) => {
      if (err) { throw new Error(err.message + ` HTML Path: ${htmlFolderPath}/${htmlFileName}.html}`); }

      const tsStr = `export const htmlComponentStr = /*html*/\`\n${htmlStr.trim()}\n\`;\n`
      const tsFileName = htmlFileNameToTsFileName(htmlFileName);
      fs.writeFile(`${tsFolderPath}/${tsFileName}.ts`, tsStr, { encoding: 'utf-8' }, (err) => {
        if (err) { throw new Error(err.message + ` TS Path: ${tsFolderPath}/${tsFileName}.ts}`); }
      });
    }
  );
}

function htmlFileNameToTsFileName(htmlFileName: string) {
  return htmlFileName.replaceAll(/\-[a-z]/g, (match) => match[1].toUpperCase());
}
