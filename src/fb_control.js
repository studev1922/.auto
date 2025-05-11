import fs from 'node:fs';
import axios from 'axios';
import FormData from 'form-data';
import m, { utils as u, menu, driver } from './module.js';

let dir = null, url = 'https://www.facebook.com/me'
const on = {

}
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
            menu.std.alert(`Đã set cookies(${cookies.c_user}): "${url}"`)
            return cookies
        },
        async loadRelayOperationData(d) {
            await d.get(url);
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
            await d.get(url);
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
    }
}


export default async (__dirname) => {
    dir = `${__dirname}/fb_profile`;
    const dirData = '.data', txtNamed = 'post.txt', res_success = 'success', res_error = 'error';

    let choosers = [
        ['Exit', null],
        ['Login', fb_mnu.fb_login]
    ]

    Object.keys(await m.file.readJsonOr(m.env.USER_DATA_JSON)).length && choosers.push(['Mở trang Facebook', void 0])
    await menu.internalization(choosers, false)
}