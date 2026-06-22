import * as fs from 'fs';

const cssFileNames = [
  'main',
];

const cssFolderPath = `${__dirname}/../src/3_components/pane-ui/templates/styles/css`;
const tsFolderPath = `${__dirname}/../src/3_components/pane-ui/templates/ts`

for (const cssFileName of cssFileNames) {
  fs.readFile(
    `${cssFolderPath}/${cssFileName}.css`,
    {encoding: 'utf-8'},
    (err, cssStr) => {
      if (err) { throw new Error(err.message + `\nCSS Path: ${cssFolderPath}/${cssFileName}.css}`); }

      const tsStr = `export const stylesheet = new CSSStyleSheet();\nstylesheet.replaceSync(/*css*/\`\n${cssStr.trim()}\n\`);\n`
      const tsFileName = `componentStyleSheet`;
      fs.writeFile(`${tsFolderPath}/${tsFileName}.ts`, tsStr, { encoding: 'utf-8' }, (err) => {
        if (err) { throw new Error(err.message + `\nTS Path: ${tsFolderPath}/${tsFileName}.ts}`); }
      });
    }
  );
}
