import hljs from './highlight.min.js';
import typescript from './typescript.min.js';
import xml from './xml.min.js';
import scss from './scss.min.js';


hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('scss', scss);

export { hljs };
