#!/usr/bin/env node
import {migrateScript} from './wle-js-upgrade.mjs';

async function main() {
    const filenames = process.argv.slice(2);
    if (filenames.length === 0) {
        throw new Error('No files found that match the pattern');
    }

    for (const filename of filenames) {
        console.log('>', filename);
        await migrateScript(filename);
    }
}

main();
