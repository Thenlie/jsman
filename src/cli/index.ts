import { Command } from 'commander';
import { openEditor, DEFAULT_OUTPUT_PATH, printDoc, writeDocToFile } from './output.js';
import { stripJsxRef } from '../parser/index.js';
import { getFirstSection } from '../parser/sections.js';
import { findMDNFile } from './file_handler.js';

const program = new Command();
const GENERIC_ERROR_MESSAGE =
    'Error: Something went wrong while attempting to find the selected MDN directory.\nPlease try again with a different query.';

type SupportedLanguages = 'javascript' | 'html' | 'css';

/**
 * Runs when any CLI command is executed. Handles finding the correct file and outputting it
 * based on the user defined options
 * @param {SupportedLanguages} lang
 * @param {string}str
 * @param {{output: string, section: string}} options
 * @returns {Promise<void>}
 */
const commandActionHandler = async (
    lang: SupportedLanguages,
    str: string,
    options: { output: string; section: string; path: string }
): Promise<void> => {
    let document = await findMDNFile(lang, str);
    if (!document) {
        console.error('[commandActionHandler]', GENERIC_ERROR_MESSAGE);
        return;
    }
    if (options.section !== 'none') {
        document = getFirstSection(document, options.section);
    }
    const strippedDoc = stripJsxRef(document);

    if (!strippedDoc) {
        console.error(
            '[commandActionHandler] Error: Nothing was returned from stripJsxRef!\nDocument:',
            document
        );
        return;
    }

    if (options.output === 'stdout') {
        printDoc(strippedDoc);
    } else if (options.output === 'vim') {
        writeDocToFile(strippedDoc);
        openEditor(DEFAULT_OUTPUT_PATH);
    } else if (options.output === 'file' && options.path) {
        writeDocToFile(strippedDoc, options.path);
    }
};

const cli = () => {
    program.name('mdnman').description('MDN reference CLI');

    program
        .command('js')
        .description('Search the MDN JavaScript reference library')
        .argument('<string>', 'query to search')
        .option('-o, --output <stdout | file | vim>', 'output type', 'stdout')
        .option('-s, --section <string>', 'specified section of MDN doc', 'none')
        .option('-p, --path <string>', 'output path', './out/ref.md')
        .action(async (str, options) => commandActionHandler('javascript', str, options));

    program
        .command('html')
        .description('Search the MDN HTML reference library')
        .argument('<string>', 'query to search')
        .option('-o, --output <stdout | vim>', 'output type', 'stdout')
        .option('-s, --section <string>', 'specified section of MDN doc', 'none')
        .action(async (str, options) => commandActionHandler('html', str, options));

    program
        .command('css')
        .description('Search the MDN CSS reference library')
        .argument('<string>', 'query to search')
        .option('-o, --output <stdout | vim>', 'output type', 'stdout')
        .option('-s, --section <string>', 'specified section of MDN doc', 'none')
        .action(async (str, options) => commandActionHandler('css', str, options));

    program.parse();
};

export default cli;
export * from './output.js';
