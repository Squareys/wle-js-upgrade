#!/usr/bin/env node
import {migrateScript} from './wle-js-upgrade.mjs';
import glob from 'glob';

const filenames = await glob([process.argv[2]]);
if (filenames.length === 0) {
    throw new Error('No files found that match the pattern');
}

for (const filename of filenames) {
    if (!migrateScript(filename)) {
        process.exit(1);
    }
}
