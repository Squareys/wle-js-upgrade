import 'jasmine';

import {exec} from 'child_process';
import {copyFileSync} from 'node:fs';
import {readFileSync} from 'fs';

function execAsync(cmd) {
    return new Promise((resolve, _) => {
        exec(cmd, (error, stdout, stderr) => {
            resolve({error, stdout, stderr});
        });
    });
}

function compareFiles(filenameA, filenameB) {
    const expectedContents = readFileSync(filenameA).toString().split('\n');
    const actualContents = readFileSync(filenameB).toString().split('\n');
    expect(actualContents).toEqual(expectedContents);
}

describe('cli', () => {
    it('file not found', async () => {
        const {error} = await execAsync('wle-js-upgrade ./test/does-not-exist.js');
        expect(error).not.toEqual(null);
    });

    it('test-component', async () => {
        copyFileSync('./test/test-component.input.js', './test/test-component.js');

        const {error} = await execAsync('wle-js-upgrade ./test/test-component.js');
        expect(error).toBe(null);
        compareFiles('./test/test-component.expected.js', './test/test-component.js');
    });

    it('test-entrypoint-rc2', async () => {
        copyFileSync('./test/index.rc2.input.js', './test/index.js');

        const {error} = await execAsync('wle-js-upgrade ./test/index.js');
        expect(error).toBe(null);
        compareFiles('./test/index.expected.js', './test/index.js');
    });

    it('test-entrypoint', async () => {
        copyFileSync('./test/index.input.js', './test/index.js');

        const {error} = await execAsync('wle-js-upgrade ./test/index.js');
        expect(error).toBe(null);
        compareFiles('./test/index.expected.js', './test/index.js');
    });
});
