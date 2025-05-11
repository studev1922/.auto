import fs from 'node:fs';
import axios from 'axios';
import FormData from 'form-data';
import m, { utils as u, menu, driver } from './module.js';

const audiences = {
    me: (base_state = 'EVERYONE', allow = [], deny = []) => ({ privacy: { allow, deny, base_state } }),
    group: to_id => ({ to_id }),
}
export default async (__dirname) => {
    const profile = `${__dirname}\\profile-1`
    const dirData = '.data', txtNamed = 'post.txt', res_success = 'success', res_error = 'error';
    let cookies, url = 'https://www.facebook.com/me'
    const fb_mnu = {
        secure: {
            async logOut(d) {
                await d.get(url);
                await d.manage().deleteAllCookies();
                await d.navigate().refresh();
                menu.std.alert('Logout (clear cookies)')
            },
            async setCookie(d, cookie_txt) {
                let cookies = m.code.cookieDecode(cookie_txt)
                await d.get(url);
                for (let name of Object.keys(cookies)) {
                    await d.manage().addCookie({
                        name, domain: '.facebook.com',
                        value: encodeURIComponent(cookies[name]),
                        path: '/',
                        secure: true,
                        httpOnly: !('c_user,presence,wd'.includes(name))
                    });
                }
                await d.get(url);
                menu.std.alert(`Đã set cookies : "${url}"`)
            },
            async loadRelayOperationData(d) {
                await d.get(url);
                menu.std.info('Load script from: ' + m.env.DAT_SCRIPT)
                let script = await m.file.readFile(m.env.DAT_SCRIPT)
                menu.std.info('Execute script...')
                let nes_json = await d.executeScript(script)
                menu.std.info('Execute done!')
                menu.std.info('Write data...')
                await m.file.writeAsJson(m.env.PATH_NES_DATA, nes_json)
                menu.std.alert(`Đã lưu _RelayOperationData : ${m.env.PATH_NES_DATA}`)
            },
        },
        async loginByCookie() {
            const d = await driver.getDriver(profile, false);
            let cookie_txt = await menu.std.input('Dán cookies vào đây:')
            try {
                if (cookie_txt?.length > 10) {
                    await fb_mnu.secure.logOut(d);
                    await fb_mnu.secure.setCookie(d, cookie_txt);
                }
                if (await driver.until(d, '[role=banner]', 15)) {
                    menu.std.info('Đã đăng nhập')
                    await m.file.writeFile(m.env.PATH_COOKIES, cookie_txt);
                    await fb_mnu.secure.loadRelayOperationData(d)
                } else menu.std.info('Đăng nhập thất bại.')
            } catch (error) {
                console.error(error)
                menu.std.error('Error : loginByCookie()')
            } finally {
                await d.close()
                menu.std.alert('Thoát trình duyệt')
                cookies = cookie_txt
            }
        },
        async loginByAccount() {
            const d = await driver.getDriver(profile, false);
            try {
                await fb_mnu.secure.logOut(d);
                await d.get(url);
                if (await driver.until(d, '[role=banner]', 9999)) {
                    menu.std.info('Logged in')
                    menu.std.info('Get all cookies...')
                    let cookie_txt = m.code.cookieEncode(
                        Object.fromEntries(
                            (await d.manage().getCookies())
                                .map(e => {
                                    menu.std.info(e.name)
                                    return [e.name, decodeURIComponent(e.value)]
                                })
                        )
                    )
                    menu.std.info("Cookies're saving...")
                    await m.file.writeFile(m.env.PATH_COOKIES, cookie_txt);
                    cookies = cookie_txt
                    menu.std.info("Cookies have been saved.")
                    await fb_mnu.secure.loadRelayOperationData(d)
                } else menu.std.info('Login failed.')
            } catch (error) {
                console.error(error)
                menu.std.error('Error : loginByCookie()')
            } finally {
                await d.close()
                menu.std.alert('Thoát trình duyệt')
            }
        }
    }

    try {
        cookies = await m.file.readFile(m.env.PATH_COOKIES)
    } catch (err) {
        while (!fs.existsSync(m.env.PATH_NES_DATA) || !fs.existsSync(m.env.PATH_COOKIES))
            await menu.internalization([
                ['Login By Cookies', fb_mnu.loginByCookie],
                ['Login By Account', fb_mnu.loginByAccount],
            ], false);
    }

    const nes = Object.assign(await m.file.readAsJson(m.env.PATH_NES_DATA), { renderVariables: u.renderVariables() })
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
            return await axios.post(m.env.FB_GRAPH, m.code.queryEncode(body), { headers })
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
                `${m.env.FB_UPLOAD}?${m.code.queryEncode(nes.data)}`,
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
}