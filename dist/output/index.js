import { highlight } from 'cli-highlight';
import { getHeader, stripHeader } from '../parser/index.js';
import fs from 'fs';
import child_process from 'node:child_process';
const OUTPUT_PATH = './out/ref.md';
const MARKDOWN_SYNTAX_MAP = {
    '```js': 'javascript',
    '```js-nolint': 'javascript',
    '```html': 'html',
    '```css': 'css',
    '```plain': 'plaintext'
};
/**
 * Returns coding language for a given markdown codeblock indicator
 * @param markdown
 * @returns {string | null}
 */
const mapMarkdownToLang = (markdown) => {
    if (markdown in MARKDOWN_SYNTAX_MAP) {
        return MARKDOWN_SYNTAX_MAP[markdown];
    }
    return null;
};
/**
 * Opens a file in the user defined editor or vim
 * @param {string} path
 */
const openEditor = (path) => {
    const editor = process.env.EDITOR || 'vim';
    const child = child_process.spawn(editor, [path], {
        stdio: 'inherit'
    });
    child.on('exit', () => { });
};
/**
* Take raw markdown MDN doc and write it to a file after formatting
* @param {string} document
*/
const writeDocToFile = (document) => {
    const writeStream = fs.createWriteStream(OUTPUT_PATH, { flags: 'w', encoding: 'utf8' });
    // Remove 'Specifications' section and everything below it
    // This includes 'Browser Compatibility' and 'See Also'
    const index = document.indexOf('## Specifications');
    if (index !== -1) {
        document = document.slice(0, index);
    }
    // Remove MDN header and write document to file
    let doc = document;
    const header = getHeader(document);
    if (header) {
        writeStream.write(`# ${header.title}\n`);
        doc = stripHeader(document);
    }
    // Write rest of document to file
    const docArr = doc.split('\n');
    docArr.forEach((line) => writeStream.write(line + '\n'));
    writeStream.end();
};
/**
* Take raw markdown MDN doc and format it before outputting to the console
* @param {string} document
*/
const printDoc = (document) => {
    // Remove 'Specifications' section and everything below it
    // This includes 'Browser Compatibility' and 'See Also'
    const index = document.indexOf('## Specifications');
    if (index !== -1) {
        document = document.slice(0, index);
    }
    const header = getHeader(document);
    let strippedDoc = document;
    if (header) {
        console.log(`# ${header.title}`);
        strippedDoc = stripHeader(document);
    }
    const docArr = strippedDoc.split('\n');
    let shouldHighlight = false;
    let highlightLang = 'javascript';
    docArr.forEach((line) => {
        // Check for syntax highlighting
        if (line in MARKDOWN_SYNTAX_MAP) {
            shouldHighlight = true;
            highlightLang = mapMarkdownToLang(line) || 'javascript';
            console.log('------------');
            return;
        }
        if (line === '```') {
            shouldHighlight = false;
            console.log('------------');
            return;
        }
        if (shouldHighlight) {
            console.log(highlight(line, { language: highlightLang }));
        }
        else {
            console.log(line);
        }
    });
};
export { printDoc, writeDocToFile, openEditor, OUTPUT_PATH };
