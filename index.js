import path from 'node:path';
import { fileURLToPath } from 'url'
import server from './src/server.js';
import fbmodel from './src/fb_control.js';
import m, { menu } from './src/module.js';


const __dirname = path.dirname(fileURLToPath(import.meta.url))
const mnu = {
    onFacebook: async () => await fbmodel(__dirname),
    onServer: async () => await server(__dirname),
}
await mnu.onFacebook();

// await menu.internalization([
//     ['Exit', null],
//     ['Facebook', mnu.onFacebook],
//     ['Manage File Upload', mnu.onServer],
// ], false)