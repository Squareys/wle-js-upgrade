/**
 * Convert Wonderland Engine 0.9.5 JavaScript code to Wonderland Engine 1.0.0 code.
 *
 * # Usage
 *
 *   node wonderland-js-upgrade.mjs <your-file>.js
 *   node wonderland-js-upgrade.mjs *.js
 */
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

/** Convert a string to CamelCase */
function toCamelCase(str: string) {
    return str.replace(/(?:^\w|[A-Z-]|\b\w|\s+)/g, function (match, _) {
        if (+match === 0) return '';
        if (/\s+|-/.test(match)) return '';
        return match.toUpperCase();
    });
}

/** Convert `WL.Type.String` to `Type.String` */
function convertParamTypes(params: string) {
    return params.replaceAll('WL.Type', 'Type');
}

/** Find scope end matching starting { at given index */
function getScopeEnd(code: string, start: number) {
    let count = 1;
    for (let i = start + 1; i < code.length; ++i) {
        if (code[i] == '{') ++count;
        if (code[i] == '}') --count;
        if (count == 0) return i;
    }

    throw new Error('Unmatched scope in code, starting at ' + start.toString());
}

/** Convert `init: async function(params)` to `async init(params)` */
function convertFunctions(
    functions: string,
    apiImports: string[],
    glMatrixImports: string[]
) {
    /* Move global types use to imports */
    const regex_Texture = /new\s*WL\.Texture\s*\(([^\);]*)\)\s*;/gm;
    functions = functions.replace(regex_Texture, (m, _) => {
        apiImports.push('Texture');
        return m.replace(/WL\.Texture\s*\(/g, 'Texture(this.engine, ');
    });

    /* Find glMatrix.(this)., replace with (this). and add import */
    const regex_glMatrix = /glMatrix\.([^\.;,]*)\./g;
    functions = functions.replace(regex_glMatrix, (m, _) => {
        const type = m.substr(9, m.length - 10);
        glMatrixImports.push(type);
        return type + '.';
    });

    /* Replace global WL use that should be this.engine now */
    for (const symbol of [
        'canvas',
        'scene',
        'physics',
        'onXRSession',
        'arSupported',
        'vrSupported',
        'onSceneLoaded',
        'textures',
    ])
        functions = functions.replaceAll('WL.' + symbol, 'this.engine.' + symbol);

    /* Replace global WL.xr* use that should be this.engine.xr now */
    for (const symbol of [
        ['xrSession', 'session'],
        ['xrFrame', 'frame'],
        ['xrBaseLayer', 'baseLayer'],
    ])
        functions = functions.replaceAll('WL.' + symbol[0], 'this.engine.xr.' + symbol[1]);

    /* Replace getTranslationWorld */
    for (const symbol of [
        ['getTranslationWorld', 'getPositionWorld'],
        ['getTranslationLocal', 'getPositionLocal'],
        ['getForward', 'getForwardWorld'],
    ])
        functions = functions.replaceAll('.' + symbol[0], '.' + symbol[1]);

    /* This regex matches `functionName: (async)? function(params) {`
     * for replacement with ES6 class version */
    const regex_functions =
        /(async\s*)?([a-zA-Z_]+)(?<!if|for|while|switch)\s*(?::\s*(async)?\s*function)?\s*\((.*)\)\s*\{/gm;

    const matches = functions.matchAll(regex_functions);

    if (!matches) return functions;

    let result = '';
    let lastMatchEnd = 0;

    for (const m of matches) {
        const name = m[2];
        const isAsync = !!m[1] || !!m[3];
        const params = m[4];

        const converted = `${isAsync ? 'async ' : ''}${name}(${params || ''}) {`;

        const index = m.index || 0;
        result += functions.substr(lastMatchEnd, index - lastMatchEnd) + converted;
        lastMatchEnd = index + m[0].length;

        /* Find closing bracket to remove ',' */
        let scopeEnd = getScopeEnd(functions, lastMatchEnd);
        /* We only support ',' directly after closing bracket.
         * Replace with newline to keep functions string length same,
         * prettier cleans up after.
         * Note: This function is never run for functions already in ES6
         *  syntax, so removal will not happen. */
        if (functions[scopeEnd + 1] == ',') {
            functions =
                functions.substr(0, scopeEnd + 1) +
                '\n' +
                functions.substr(scopeEnd + 2, functions.length - (scopeEnd + 2));
        }
    }

    result += functions.substr(lastMatchEnd, functions.length - lastMatchEnd);

    return result;
}

/**
 * Convert `WL.registerComponent('my-comp', {}, {})` to `class MyComp extends Component { ... }`
 */
function convertComponents(
    contents: string,
    apiImports: string[],
    glMatrixImports: string[]
) {
    /* This monster regex matches the three parameters of the WL.registerComponent() calls into
     * match groups 1-3 */
    const regex_registerComp =
        /WL\.registerComponent\(\s*[\'\"]([^\'\"]+)[\"\']\s*,\s*\{/gm;

    const matches = contents.matchAll(regex_registerComp);
    if (!matches) return contents;

    let lastMatchEnd = 0;
    let result = '';
    for (const m of matches) {
        const typeName = m[1];
        console.log('Migrating component', typeName);
        apiImports.push('Component');
        const index = m.index || 0;
        const propsScopeStart = index + m[0].length;
        const propsScopeEnd = getScopeEnd(contents, propsScopeStart);
        const propertiesInput = contents.substr(
            propsScopeStart,
            propsScopeEnd - propsScopeStart
        );
        const properties = convertParamTypes(propertiesInput);
        if (properties != propertiesInput) {
            apiImports.push('Type');
        }

        const scopeStart = contents.indexOf('{', propsScopeEnd + 1) + 1;
        const scopeEnd = getScopeEnd(contents, scopeStart);
        const functions = convertFunctions(
            contents.substr(scopeStart, scopeEnd - scopeStart),
            apiImports,
            glMatrixImports
        );

        const converted = `export class ${toCamelCase(typeName)} extends Component {
    static TypeName = '${typeName}';
    static Properties = {${properties}};

    ${functions}}`;

        result += contents.substr(lastMatchEnd, index - lastMatchEnd) + converted;
        lastMatchEnd = contents.indexOf(';', scopeEnd) + 1; /* Removes final }); */
    }

    result += contents.substr(lastMatchEnd, contents.length - lastMatchEnd);
    return result;
}

function generateImports(lib: string, imports: string[]) {
    if (imports.length === 0) return '';
    const uniqueImports = [...new Set(imports)].sort();
    return `import {${uniqueImports.join(', ')}} from '${lib}';\n`;
}

function convertIndex(contents: string) {
    const hasConstants = contents.indexOf('/* wle:auto-constants:start */') >= 0;
    const hasImports = contents.indexOf('/* wle:auto-imports:start */') >= 0;
    const hasXRButtonSetup = contents.indexOf('function setupButtonsXR() {') >= 0;
    const hasOldLoadRuntime = contents.indexOf('await loadRuntime(RuntimeBaseName,') >= 0;

    if (hasOldLoadRuntime || (hasImports && (!hasConstants || !hasXRButtonSetup))) {
        console.log('Detected outdated entrypoint file. Replacing contents.');
        return readFileSync(__dirname + '/../data/index.js', 'utf8');
    }

    return contents;
}

/* Parse filename argument and check existence */
export async function migrateScript(filename: string) {
    if (!existsSync(filename)) {
        throw new Error(filename + ' does not exist.');
    }

    /* Keep track of imports from @wonderlandengine/api */
    const apiImports: string[] = [];
    const glMatrixImports: string[] = [];

    /* Read the script and convert components */
    let contents = readFileSync(filename, 'utf8');
    contents = convertIndex(contents);
    contents = convertComponents(contents, apiImports, glMatrixImports);

    /* Add imports */
    let imports =
        generateImports('@wonderlandengine/api', apiImports) +
        generateImports('gl-matrix', glMatrixImports);
    console.log(imports);
    contents = (imports ? imports + '\n' : '') + contents;

    /* Overwrite the input file with the result */
    writeFileSync(filename, contents);

    console.log('Wrote', filename);
    console.log('Running prettier on', filename);

    /* Run prettier, if possible */
    try {
        /* @ts-ignore */
        const cli = await import('prettier/cli.js');
        cli.default.run(['--write', filename]);
    } catch (e) {
        console.warn(e);
        console.warn('Warning: Could not find prettier');
        console.warn('You will want to run prettier yourself.');
    }

    return true;
}
