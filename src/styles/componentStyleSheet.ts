import * as fs from 'fs';
import { componentStyleString } from './ts/componentStyleString';

let sheetString: string;
if (process.env.NODE_ENV === 'development') {
  sheetString = fs.readFileSync(__dirname+'/css/main.css', {encoding: 'utf-8'});
}
else {
  sheetString = componentStyleString;
}

export const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(sheetString);
