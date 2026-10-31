import * as fs from 'fs';
import { shadowStyleSheetString } from './ts/shadowStyleSheetString';

let sheetString: string;
if (process.env.NODE_ENV === 'development') {
  sheetString = fs.readFileSync(__dirname+'/css/main.css', {encoding: 'utf-8'});
}
else {
  sheetString = shadowStyleSheetString;
}

export const shadowStyleSheet = new CSSStyleSheet();
shadowStyleSheet.replaceSync(sheetString);
