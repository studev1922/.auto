import path from 'node:path';
import { fileURLToPath } from 'url'

import server from './src/server.js';
import { menu } from './src/module.js';

const mnu = {
    onServer: async () => await server(path.dirname(fileURLToPath(import.meta.url))),
}

await menu.internalization([
    ['Exit', null],
    ['Start The Server', mnu.onServer],
], true)
