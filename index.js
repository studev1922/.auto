import fs from 'node:fs';
import path from 'node:path';
import axios from 'axios';
import FormData from 'form-data';
import { fileURLToPath } from 'url'

import server from './src/server.js';
import audiences from './src/audiences.js';
import m, { utils as u, menu } from './src/module.js';

const mnu = {
    post: async () => {
        const dirData = '.data'
        const txtNamed = 'post.txt'
        const res_success = 'success'
        const res_error = 'error'
        const cookies = await m.file.readFile([m.env.PATH_COOKIES, '.asset/_cookie.txt'])
        const nes = await m.file.readAsJson(m.env.PATH_NES_DATA)
        nes.renderVariables = u.renderVariables()
        let mutation = {
            post: async (name, audience, message, attachments) => {
                let variables = JSON.stringify(Object.assign({
                    "input": {
                        "source": "WWW", audience, attachments, message,
                        "actor_id": nes.data.__user
                    }
                }, nes.renderVariables, nes.providedVariables[name]))
                let headers = { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': cookies }
                let body = Object.assign({ doc_id: nes.doc_ids[name], variables }, nes.data)
                // await m.file.writeAsJson(`session/${Date.now()}.json`, body, 'utf-8')
                return await axios.post(m.env.URL_GRAPH, m.code.queryEncode(body), { headers })
            },
            upload_image: async (imgPath) => {
                let handle_res = res => {
                    if (!res) return
                    console.log(`POST(${res.statusText})\t:\t${res.status}\t:\t`, imgPath);
                    let payload = JSON.parse(res.data.substring(9)).payload
                    return { id: payload.photoID, src: payload.imageSrc }
                }
                const formData = new FormData();
                formData.append('source', '8');
                formData.append('waterfallxapp', 'comet');
                formData.append('profile_id', nes.data.__user);
                formData.append('upload_id', `jsc_c_${Math.random().toString(36).substring(2, 12)}`);
                formData.append('farr', await fs.promises.readFile(imgPath), { filename: path.basename(imgPath), contentType: null });

                const res = await axios.post(
                    `${m.env.URL_UPLOAD}?${m.code.queryEncode(nes.data)}`,
                    formData,
                    { headers: Object.assign({ 'Cookie': cookies }, formData.getHeaders()) }
                );
                return handle_res(res)
            }
        }
        async function _post(audience = audiences.me(), fnw = new Date().toLocaleString('vi').replaceAll(':', '.').replaceAll('/', '-')) {
            let dirEach = async (h_image, h_mutation, h_response) => {
                let logs = [], prepare = {
                    images: (dir) => u.shuffleArray(m.file.readImages(dir)),
                    fields: async (dir) => {
                        let post, data;
                        try { post = await m.file.readFile(`${dir}/${txtNamed}`) } catch (error) { }
                        try { data = await m.file.readAsJson(`${dir}/data.json`) } catch (error) { }
                        return { post: post || '', data: data || {} }
                    }
                }
                console.log('\n');
                let dirs = (await fs.promises.readdir(dirData, { withFileTypes: false }))
                for (let dir of dirs) {
                    let folder = `${dirData}/${dir}`, fields = await prepare.fields(folder);
                    let attachments = await h_image(prepare.images(folder)) // upload images
                    let res = await h_mutation(fields, attachments) // post mutation
                    logs.push(await h_response(res, dir)) // handle response
                }
                return logs
            }
            let handle = {
                upload_images: async (imgPaths) => {
                    if (!imgPaths || imgPaths.length <= 0) return []
                    let attachments = [];
                    for (let imgPath of imgPaths) {
                        let res = await mutation.upload_image(imgPath)
                        if (res) attachments.push({ photo: { id: res.id, src: res.src } })
                    }
                    return attachments
                },
                post_mutation: async (fields, attachments) => {
                    let mutationNamed = 'ComposerStoryCreateMutation_facebookRelayOperation'
                    let message = { ranges: [], text: fields.post }
                    return await mutation.post(mutationNamed, audience, message, attachments)
                },
                handle_response: async (response, folder) => {
                    let { data, errors, extensions } = response.data
                    if (typeof data === 'string' && data.startsWith('for')) data = JSON.parse(data.substring(9))
                    if (data) await m.file.writeAsJson(`res/${fnw}/${folder}/post ${res_success}.json`, data);
                    if (errors) await m.file.writeAsJson(`res/${fnw}/${folder}/post ${res_error}.json`, errors);
                    return { [folder]: { data, errors } }
                }
            }
            return await dirEach(handle.upload_images, handle.post_mutation, handle.handle_response)
        }

        const post = {
            me: async () => {
                let fnw = new Date().toLocaleString('vi').replaceAll(':', '.').replaceAll('/', '-')
                await _post(audiences.me(), fnw)
                    .then(resLogs => {
                        m.file.writeAsJson(`res/${fnw}/res_data.json`, resLogs)
                        console.log('Done!');
                    })
                    .catch(console.error).finally(() => process.exit(0))
            },
            group: async () => {
                const group_ids = [
                    '633488806310573'
                ]
                for (const group_id of group_ids) {
                    let fnw = new Date().toLocaleString('vi').replaceAll(':', '.').replaceAll('/', '-')
                    await _post(audiences.group(group_id), fnw)
                        .then(resLogs => {
                            m.file.writeAsJson(`res/${fnw}/res_data.json`, resLogs)
                            console.log('Done!');
                        })
                        .catch(console.error).finally(() => process.exit(0))
                }
            }
        }

        await menu.internalization([
            ['Exit', null],
            ['Post me', post.me],
            ['Post group', post.group],
        ], false)
    },
    onServer: async () => await server(path.dirname(fileURLToPath(import.meta.url))),
}

await menu.internalization([
    ['Exit', null],
    ['Create post', mnu.post],
    ['Start The Server', mnu.onServer],
], true)
