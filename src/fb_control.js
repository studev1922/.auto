import fs from 'node:fs';
import axios from 'axios';
import FormData from 'form-data';
import path from 'path';
import inquirer from 'inquirer';
import m, { utils as u, menu, driver } from './module.js';
import './types/type_fb.js';

const FB_URL = 'https://www.facebook.com/me'
const FB_GRAPHQL = 'https://www.facebook.com/api/graphql'
const FB_UPLOAD = 'https://upload.facebook.com/ajax/react_composer/attachments/photo/upload'
const _time = function () { let t = new Date, e = t.getFullYear(), a = String(t.getMonth() + 1).padStart(2, "0"), r = String(t.getDate()).padStart(2, "0"), n = String(t.getHours()).padStart(2, "0"), d = String(t.getMinutes()).padStart(2, "0"), g = String(t.getSeconds()).padStart(2, "0"), p = String(t.getMilliseconds()).padStart(3, "0"); return `${e}.${a}.${r}-${n}.${d}.${g}.${p}` }
function sleep(ms) { return new Promise(n => setTimeout(n, ms)) }
const s = menu.std

const fb_mnu = {
    secure: {
        async logOut(d) {
            await d.get(FB_URL);
            await d.manage().deleteAllCookies();
            await d.navigate().refresh();
            menu.std.alert('Logout (clear cookies)')
        },
        async setCookie(d, cookie_txt) {
            let cookies = m.code.cookieDecode(cookie_txt)
            await d.get(FB_URL);
            for (let name of Object.keys(cookies)) {
                await d.manage().addCookie({
                    name, domain: '.facebook.com',
                    value: encodeURIComponent(cookies[name]),
                    path: '/',
                    secure: true,
                    httpOnly: !('c_user,presence,wd'.includes(name))
                });
            }
            await d.get(FB_URL);
            menu.std.alert(`Đã set cookies(${cookies.c_user}): "${FB_URL}"`)
            return cookies
        },
        async loadRelayOperationData(d) {
            await d.get(FB_URL);
            let script = await m.file.readFile(m.env.RELAY_OPERATION_SCRIPT)
            let relayOperation = await d.executeScript(script)
            await m.file.writeAsJson(m.env.RELAY_OPERATION_JSON, relayOperation)
            menu.std.alert(`Đã lưu _RelayOperationData : ${m.env.RELAY_OPERATION_JSON}`)
        },
    },
    sys: {
        async saveUserDat(d, cookies) {
            if (!fs.existsSync(m.env.RELAY_OPERATION_JSON)) await fb_mnu.secure.loadRelayOperationData(d);
            let script = m.file.readFile(m.env.USER_DATA_SCRIPT)
            let user_dat = await m.file.readJsonOr(m.env.USER_DATA_JSON)
            let result = await d.executeScript(script)
            result[cookies.c_user].cookie = m.code.cookieEncode(cookies)
            user_dat = Object.assign(user_dat, result)
            await m.file.writeAsJson(m.env.USER_DATA_JSON, user_dat);
            menu.std.info(`Save (${Object.keys(result)})`)
            return result
        }
    },
    async loginByCookie() {
        const d = await driver.getDriver(0, false);
        let cookies, cookie_txt = await menu.std.input('Dán cookies vào đây:')
        try {
            if (cookie_txt?.length > 10) {
                await fb_mnu.secure.logOut(d);
                cookies = await fb_mnu.secure.setCookie(d, cookie_txt);
            }
            if (await driver.until(d, '[role=banner]', 15)) {
                await fb_mnu.sys.saveUserDat(d, cookies)
            } else menu.std.info(`Đăng nhập(${cookies.c_user}) thất bại.`)
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
        const d = await driver.getDriver(0, false);
        try {
            await fb_mnu.secure.logOut(d);
            await d.get(FB_URL);
            if (await driver.until(d, '[role=banner]', 9999)) {
                menu.std.info('Logged in')
                menu.std.info('Get all cookies...')
                let cookies = Object.fromEntries((await d.manage().getCookies()).map(a => (menu.std.info(a.name), [a.name, decodeURIComponent(a.value)])))
                menu.std.info("Cookies're saving...")
                await fb_mnu.sys.saveUserDat(d, cookies)
                menu.std.info("Cookies have been saved.")
            } else menu.std.info('Login failed.')
        } catch (error) {
            console.error(error)
            menu.std.error('Error : loginByCookie()')
        } finally {
            await d.close()
            menu.std.alert('Thoát trình duyệt')
        }
    },
    async fb_login() {
        await menu.internalization([
            ['Exit', null],
            ['Login By Cookies', fb_mnu.loginByCookie],
            ['Login By Account', fb_mnu.loginByAccount],
        ], false);
    },
    async fb_open_personal_page() {
        const meta_dat = await m.file.readJsonOr(m.env.USER_DATA_JSON)
        const d = await driver.getDriver(0, 0)
        async function open(c_user) {
            let cookie_txt = meta_dat[c_user].cookie
            await fb_mnu.secure.logOut(d);
            await fb_mnu.secure.setCookie(d, cookie_txt)
            if (await driver.until(d, '[role=banner]', 15)) {
                menu.std.info(`Đã đăng nhập(${c_user})!`)
            } else menu.std.alert(`Đăng nhập(${c_user}) thất bại.`)
        }

        let choosers = [['Exit', null]]
        for (let k of Object.keys(meta_dat))
            choosers.push([`Mở profile(${k})`, async _ => await open(k)])
        await menu.internalization(choosers, false)
        await d.close()
    },
    async fb_mutation() {
        const txtNamed = 'post.txt', jsonNamed = 'data.json', res_success = 'success', res_error = 'error'
        const _userData = await m.file.readJsonOr(m.env.USER_DATA_JSON)
        const _groupIds = await m.file.readJsonOr(m.env.GROUP_IDS_JSON, [])
        const { doc_ids, providedVariables } = await m.file.readAsJson(m.env.RELAY_OPERATION_JSON)
        function renderVariables(e = { renderLocation: 'timeline', hashtag: null }) { let i = e.renderLocation || "timeline", a = { feedLocation: i.toUpperCase(), canUserManageOffers: !1, checkPhotosToReelsUpsellEligibility: !0, feedbackSource: 0, gridMediaWidth: 230, hashtag: null }; return Object.assign(a, { isEvent: "event" === i, isFeed: "homepage_stream" === i, isFundraiser: "fundraiser_page" === i, isFunFactPost: !1, isGroup: "group" === i, isPageNewsFeed: "pages_feed" === i, isProfileReviews: "PAGE_SURFACE_RECOMMENDATIONS" === a.feedLocation, isSocialLearning: "group_units" === i, isTimeline: "timeline" === i || "bizweb_self_view" === i, isWorkSharedDraft: !1, privacySelectorRenderLocation: "COMET_STREAM", renderLocation: i, scale: 1 }, e) }
        function shuffleArray(e) { let l = e.slice(); for (let r = l.length - 1; r > 0; r--) { let t = Math.floor(Math.random() * (r + 1));[l[r], l[t]] = [l[t], l[r]] } return l }

        const on = {
            mutation: {
                /**
                 * @param {UDat} [u_dat] 
                 * @param {string} imgPath 
                 * @returns {Promise<ResPhoto|null>}
                 */
                upload_image: async (u_dat, imgPath) => {
                    const c = 'append', f = new FormData();
                    f[c]('source', '8');
                    f[c]('waterfallxapp', 'comet');
                    f[c]('profile_id', u_dat.nes.__user);
                    f[c]('upload_id', `jsc_c_${Math.random().toString(36).substring(2, 12)}`);
                    f[c]('farr', await fs.promises.readFile(imgPath), { filename: path.basename(imgPath), contentType: null });

                    const res = await axios.post(
                        `${FB_UPLOAD}?${m.code.queryEncode(u_dat.nes)}`
                        , { headers: Object.assign({ 'Cookie': u_dat.cookie }, f.getHeaders()) }
                        , f
                    );

                    if (!res) return
                    console.log(s.info(`POST(${res.statusText})\t:\t${res.status}\t:\t`), imgPath);
                    let { photoID, imageSrc } = JSON.parse(res.data.substring(9)).payload
                    return { id: photoID, src: imageSrc }
                },
                /**
                 * @param {string} name 
                 * @param {UDat} [u_dat] 
                 * @param {{input: object,renderVariables: object}} variableParts
                 * @returns {Promise<*>}
                 */
                post: async (name, u_dat, variableParts) => {
                    let variables = JSON.stringify({ ...variableParts, ...providedVariables[name] })
                    let headers = { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': u_dat.cookie }
                    let body = Object.assign({ doc_id: doc_ids[name], variables }, u_dat.nes)
                    await m.file.writeAsJson(`session/${_time()}.json`, body, 'utf-8')
                    return await axios.post(FB_GRAPHQL, m.code.queryEncode(body), { headers })
                },
            },
            action: {
                /**
                 * @param {Array<string>} imgPaths 
                 * @param {AttachKey} _key
                 * @returns {Promise<ResPhoto[]>}
                 */
                upload_images: async (pathImages, _key = 'photo' || 'media') => {
                    let attachments = [];
                    if (!pathImages || pathImages.length <= 0) return attachments
                    for (let pathImage of pathImages) {
                        let res = await on.mutation.upload_image(pathImage)
                        if (res) attachments.push({ [_key]: { id: res.id, src: res.src } })
                    }
                    return attachments
                },
                handle_response: async (response, folder) => {
                    let { data, errors, extensions } = response.data
                    if (typeof data === 'string' && data.startsWith('for')) data = JSON.parse(data.substring(9))
                    if (data) await file.writeAsJson(`res/${folder}/post ${res_success}.json`, data);
                    if (errors) await file.writeAsJson(`res/${folder}/post ${res_error}.json`, errors);
                    return { [folder]: { data, errors } }
                }
            }
        }

        const choosers = {
            /**
             * @param {InquirerType} type 
             * @returns {Promise<*>}
             */
            async inquirer(type, message, choices) { return (await inquirer.prompt([{ type, message, choices, name: 'value' }])).value },
            userData: async _ => choosers.inquirer('checkbox', 'Chọn tài khoản:', Object.keys(_userData)),
            groupIds: async _ => choosers.inquirer('checkbox', 'Chọn nhóm:', _groupIds),
        }

        const audiences = {
            timeline: (base_state = 'EVERYONE', allow = [], deny = []) => ({ privacy: { allow, deny, base_state } }),
            group: to_id => ({ to_id }),
        }

        async function _post(u_ids, mutationNamed) {
            /**
             * @param {UDat} u_dat 
             * @param {PostValue} _v 
             * @param {RenderLocation} renderLocation 
             */
            const _once = async (u_dat, _v = {}, renderLocation = 'timeline') => {
                let attachments = await on.action.upload_images(_v.pathImages);
                let response = await on.mutation.post(mutationNamed, u_dat, {
                    input: {
                        source: 'WWW',
                        actor_id: u_dat.nes.__user,
                        message: { ranges: [], text: _v.textToPost },
                        audience: audiences[renderLocation](),
                        attachments,
                    },
                    ...renderVariables({ renderLocation }),
                    ...providedVariables[mutationNamed],
                })
                return await on.action.handle_response(response, _v.folder) // handle response
            }

            for (let folder of (await fs.promises.readdir(m.env.DATA_DIRECTORY, { withFileTypes: false }))) {
                const dir = `${m.env.DATA_DIRECTORY}/${folder}`
                const pathImages = shuffleArray(m.file.readImages(dir));
                const textToPost = await (async _ => { let a; try { a = await file.readFile(`${dir}/${txtNamed}`) } catch (r) { a = '' } return a })();
                for (const __user of u_ids) {
                    s.alert(`POST(${__user})\t:\t"${folder}"`)
                    let resFile = `${folder}/${__user}/${_time()}.json`
                    let res = await _once(_userData[__user], { pathImages, textToPost, folder }, 'timeline');
                    await m.file.writeAsJson(`res/${resFile}`, res, 'utf-8')
                    s.info(`Nghỉ: (15s)`, await sleep(15 * 1e3)) // 15 giây nghỉ giữa các tài khoản
                }
                s.info(`Nghỉ: (15p)`, await sleep(15 * 60 * 1e3)) // 15 phút nghỉ giữa các lần post
            }
        }

        const post = {
            to_profile: async () => {
                let mutationNamed = 'ComposerStoryCreateMutation_facebookRelayOperation'
                let all_res = await _post(await choosers.userData(), mutationNamed)
            },

        }

        await menu.internalization([
            ['Exit', null],
            ['Post to profile', post.to_profile],
            // ['Post to group', post.group],
            // ['Comment', post.comment],
        ], false)
    }
}


export default fb_mnu.fb_mutation
// export default async (__dirname) => {
//     dir = `${__dirname}/fb_profile`;2
//     const dirData = '.data', txtNamed = 'post.txt', res_success = 'success', res_error = 'error';

//     let choosers = [['Exit', null], ['Login', fb_mnu.fb_login]]
//     if (Object.keys(await m.file.readJsonOr(m.env.USER_DATA_JSON)).length) {
//         choosers.push(['Mở trang Facebook', fb_mnu.fb_open_personal_page])
//         choosers.push(['Create mutation', fb_mnu.fb_mutation])
//     }
//     await menu.internalization(choosers, false)
// }