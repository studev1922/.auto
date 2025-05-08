import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { stdin as input, stdout as output } from 'process';

const rl = readline.createInterface({ input, output });
const txt = {
    /**
     * @param {String} t : text = "abc"
     * @param  {...String} e : text = 'a','b', => true
     * @returns {Boolean} 'a','b','d' => false
     */
    contains(t, ...e) { if ("string" != typeof t) return !1; for (let r of e) if ("string" != typeof r || !t.includes(r)) return !1; return !0 },
    /**
     * @param {String} t : text = 'chào'
     * @returns : text = 'ch\u00e0o'
     */
    encode(t) { let e = ""; for (let r = 0; r < t.length; r++) { let o = t.charCodeAt(r); o > 127 ? e += "\\u" + o.toString(16).padStart(4, "0") : e += t[r] } return e },
    /**
     * @param {String} t : text = 'ch\u00e0o'
     * @returns {String} : text = 'chào'
     */
    decode: t => t.replace(/\\u([\d\w]{4})/gi, function (_, i) { return String.fromCharCode(parseInt(i, 16)) })
}

const code = {
    /**
     * @param {object} e : {a:1,b:'abc:123'}
     * @returns {string} text = 'a=1; b=abc%3A123'
     */
    cookieEncode(e) { let n = ""; for (let o in e) if (e.hasOwnProperty(o)) { let t = encodeURIComponent(o), r = encodeURIComponent(e[o]); n += `${t}=${r};` } return n },
    /**
     *  => 
     * @param {String} t : text = 'a=1; b=abc%3A123' 
     * @returns {object} object = {a:1,b:'abc:123'}
     */
    cookieDecode(t) { let e = {}; if (!t) return e; let i = t.split(";"); return i.forEach(t => { let i = t.trim().split("="); if (2 === i.length) { let r = i[0].trim(), l = decodeURIComponent(i[1].trim()); e[r] = l } }), e },
    /**
     * @param {object} o : object = {a:1,b:'abc:123'}
     * @returns {string} text = 'a=1&b=abc%3A123'
     */
    queryEncode(o) { let e = new URLSearchParams; for (let r in o) o.hasOwnProperty(r) && e.append(r, o[r]); return e.toString() },
    /**
     * @param {String} t : text = 'a=1&b=abc%3A123'
     * @returns {object} object = {a:1,b:'abc:123'}
     */
    queryDecode(t) { if ("string" == typeof t) t = new URLSearchParams(t); else if (!(t instanceof URLSearchParams)) throw Error("Must be URLSearchParams."); return Object.fromEntries(t.entries()) }
}

const doc = {
    select: (s, o) => (o || document).querySelector(s),
    selects: (s, o) => (o || document).querySelectorAll(s),
    /**
     * @param {keyof HTMLElementTagNameMap} t : 
     * @param {object} a : attribute
     * @param {CSSStyleDeclaration} s : style
     * @param {...HTMLElement} c : children
     * @returns {HTMLElement} : new Element
     */
    cre: (t, a, s, ...c) => { let e = document.createElement(t); for (let r in a) e.setAttribute(r, a[r]); return m.doc.style(e, s), m.doc.children(1, e, ...c), e },
    /**
     * @param {HTMLElement} e : element
     * @param {CSSStyleDeclaration} s : style 
     */
    style: (e, s = {}) => { if (e && e.style) for (let n in s) e.style[n] = s[n] },
    /**
     * @param {Boolean} i : is appendChild || prepend
     * @param {HTMLElement} e : element
     * @param {...HTMLElement} c : children
     */
    children: (i = 1, e, ...c) => { a = i ? "appendChild" : "prepend", e && c && c.forEach(o => { o instanceof Node ? e.appendChild(o) : "string" == typeof o && e[a](o = document.createTextNode(o)) }) },
    /**
     * @param {HTMLElement} e : element.
     * @param {keyof HTMLElementEventMap} t : type
     * @param {EventListenerOrEventListenerObject} l : call back function 
     * @param {boolean|AddEventListenerOptions} [o] : options
     * @returns {void}
     */
    evt: function (e, t, l, o) { e && e[evt](t, l, o) }
}

const pathValue = {
    key_path(o, t) { let n = []; return !function f(l, x) { if ("object" == typeof l && null !== l) { if (Array.isArray(l)) l.forEach((t, n) => { let l = [...x]; l.length > 0 ? l[l.length - 1] += `[${n}]` : l.push(`[${n}]`), f(t, l) }); else for (let i in l) i === t && n.push([...x, i].join(".")), f(l[i], [...x, i]) } }(o, []), n },
    val_path(o, t) { let n = []; return !function f(t, i, x) { if ("string" == typeof i && "string" == typeof t && t.includes(i) || t === i) { n.push(x.join(".")); return } if ("object" == typeof t && null !== t) { if (Array.isArray(t)) t.forEach((t, n) => { let r = [...x]; x.length > 0 ? r[r.length - 1] += `[${n}]` : r.push(`[${n}]`), f(t, i, r) }); else for (let r in t) f(t[r], i, [...x, r]) } }(o, t, []), n.map(o => o.startsWith("]") && 0 === o.indexOf("[") ? "[" + o : o) },
    shortcut(e, t) { return function e(i) { if ("object" == typeof i && null !== i) { if (Array.isArray(i)) for (let r of i) { let f = e(r); if (void 0 !== f) return f } else { if (t in i) return i[t]; for (let n in i) { let o = e(i[n]); if (void 0 !== o) return o } } } }(e) },
    shortcuts(e, t) { let f = []; return !function e(n) { if ("object" == typeof n && null !== n) { if (Array.isArray(n)) for (let i of n) e(i); else for (let l in t in n && f.push(n[t]), n) e(n[l]) } }(e), f }
}

const file = {
    /**
     * Reads the content of a file.
     * @param {...string} filePath - The path to the file.
     * @param {string} encoding - The file encoding (default: 'utf-8').
     * @returns {Promise<string | null>} - The file content, or null on error.
     */
    async readFile(filePaths, encoding = 'utf-8') {
        const pathsToTry = Array.isArray(filePaths) ? filePaths : [filePaths];
        for (const filePath of pathsToTry) {
            try {
                const content = await fs.promises.readFile(filePath, { encoding });
                return content;
            } catch (error) {
                console.warn(`Cannot read file '${filePath}': ${error.message}`);
            }
        }
        // Nếu vòng lặp hoàn thành mà không trả về nội dung, nghĩa là không đọc được tệp nào
        const errorMessage = pathsToTry.length > 1
            ? `Cannot read any file from: ${pathsToTry.join(', ')}`
            : `Files doesn't exist: ${pathsToTry[0]}`;
        throw new Error(errorMessage);
    },
    /**
     * Writes data to a file.
     * @param {string} filePath - The path to the file.
     * @param {string} data - The data to write.
     * @param {string} encoding - The file encoding (default: 'utf-8').
     * @returns {Promise<boolean>} - True on success, false on error.
     */
    async writeFile(filePath, data, encoding = 'utf-8') {
        try {
            await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
            await fs.promises.writeFile(filePath, data, { encoding });
            return true;
        } catch (error) {
            throw new Error(`Error writing to file '${filePath}': ${error.message}`);
        }
    },

    /**
     * Reads and parses JSON data from a file.
     * @param {string} filePath - The path to the file.
     * @param {string} encoding - The file encoding (default: 'utf-8').
     * @returns {Promise<any | null>} - The parsed JSON data, or null on error.
     */
    async readAsJson(filePath, encoding = 'utf-8') {
        try {
            const data = await fs.promises.readFile(filePath, { encoding });
            return JSON.parse(data);
        } catch (error) {
            throw new Error(`Error reading or parsing JSON from '${filePath}': ${error.message}`);
        }
    },

    /**
     * Writes JSON data to a file.
     * @param {string} filePath - The path to the file.
     * @param {any} data - The JSON data to write.
     * @param {string} encoding - The file encoding (default: 'utf-8').
     * @param {number} indent - The indentation level (default: 4).
     * @param {boolean} ensureAscii - Whether to ensure ASCII characters (default: false).
     * @returns {Promise<boolean>} - True on success, false on error.
     */
    async writeAsJson(filePath, data, encoding = 'utf-8', indent = 4, ensureAscii = false) {
        try {
            await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
            const jsonData = JSON.stringify(data, null, indent);
            await fs.promises.writeFile(filePath, jsonData, { encoding });
            return true;
        } catch (error) {
            throw new Error(`Error writing JSON to '${filePath}': ${error.message}`);
        }
    },

    /**
     * Reads image file paths from a directory.
     * @param {string} dirPath - The path to the directory.
     * @returns {string[]} - An array of image file paths.
     */
    readImages(dirPath) {
        const images = [];
        const extensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp'];
        try {
            const filenames = fs.readdirSync(dirPath);
            for (const filename of filenames) {
                if (extensions.some(ext => filename.toLowerCase().endsWith(ext))) {
                    images.push(path.join(dirPath, filename));
                }
            }
        } catch (error) {
            console.error(`Error reading images from directory '${dirPath}': ${error.message}`);
            return [];
        }
        return images;
    },
}

const fun = {
    match(t, e) { let o = [], f = RegExp(e); for (let n of t) f.test(n) && o.push(n); return o },
    join: (...o) => Object.assign(...o),
    /**
     * @param {...Object|Array} params 
     */
    merger(...r) { let n = {}; return r.forEach(r => { !function r(n, t) { for (let e in t) t.hasOwnProperty(e) && ("object" != typeof t[e] || null === t[e] || Array.isArray(t[e]) ? Array.isArray(t[e]) ? (n[e] || (n[e] = []), n[e] = n[e].concat(t[e].filter(r => null !== r))) : n[e] = t[e] : (n[e] || (n[e] = {}), r(n[e], t[e]))) }(n, r) }), n },
}

const utils = {
    random_txt(t) { let r = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", n = ""; for (let o = 0; o < t; o++)n += r.charAt(Math.floor(Math.random() * r.length)); return n }
    , shuffleArray(arr) {
        if (!arr || arr.length <= 1) {
            return arr; // No need to shuffle if empty or has only one element
        }
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]]; // Hoán đổi phần tử
        }
        return arr;
    }
    , renderVariables: (e = { renderLocation: 'timeline', hashtag: null }) => { let i = e.renderLocation || "timeline", a = { feedLocation: i.toUpperCase(), canUserManageOffers: !1, checkPhotosToReelsUpsellEligibility: !0, feedbackSource: 0, gridMediaWidth: 230, hashtag: null }; return Object.assign(a, { isEvent: "event" === i, isFeed: "homepage_stream" === i, isFundraiser: "fundraiser_page" === i, isFunFactPost: !1, isGroup: "group" === i, isPageNewsFeed: "pages_feed" === i, isProfileReviews: "PAGE_SURFACE_RECOMMENDATIONS" === a.feedLocation, isSocialLearning: "group_units" === i, isTimeline: "timeline" === i || "bizweb_self_view" === i, isWorkSharedDraft: !1, privacySelectorRenderLocation: "COMET_STREAM", renderLocation: i, scale: 1 }, e) }
}

const menu = {
    /**
     * Displays a menu and handles user input.
     * @param {Array<[string, Function | null]>} menuItems - An array of menu items,
     * where each item is a tuple/array containing the item text and its corresponding
     * function (or null for exit).
     * @returns {[string, Function | null] | null} - The selected menu item (text and function),
     * or null if the user chooses to exit.
     */
    _createMenu(menuItems) {
        const maxLength = Math.max(...menuItems.map(item => item[0].length));
        const width = maxLength + 6;

        console.log(`+${'-'.repeat(width)}+`);
        menuItems.forEach((item, i) => {
            console.log(`| ${i + 1}: ${item[0].padEnd(maxLength)} |`);
        });
        console.log(`+${'-'.repeat(width)}+`);

        return new Promise((resolve) => {
            const getChoice = () => { // Declare a recursive function.
                rl.question('Chọn chức năng (nhập số): ', (choice) => {
                    const numChoice = Number(choice); // Convert input to a Number.
                    if (Number.isNaN(numChoice)) {
                        console.log(`Không có ${choice}, thử lại.`);
                        getChoice(); // Use recursion to repeat the question.
                    } else if (numChoice >= 1 && numChoice <= menuItems.length) {
                        resolve(menuItems[numChoice - 1]);
                        // rl.close(); // Resolve instead of close, caller handles closing.
                    } else {
                        console.log(`Không có ${choice}, thử lại.`);
                        getChoice(); // Use recursion to repeat the question.
                    }
                });
            };
            getChoice(); // Start the recursive function.
        });
    },

    /**
     * Displays a menu, executes the selected function, and handles program flow.
     * @param {Array<[string, Function | null]>} menuItems - An array of menu items.
     * @param {boolean} isClear - Whether to clear the console before displaying the menu.
     * (default: true).
     */
    async internalization(menuItems, isClear = true) {
        while (true) {
            const select = await menu._createMenu(menuItems);
            if (select === null || select[1] === null) {
                return;
            } else if (typeof select[1] === 'function') {
                console.log(select[0]); await select[1]();
            }
            if (isClear) console.clear();
        }
    },
};

export { utils, menu }
export default {
    match: fun.match,
    join: fun.join,
    merger: fun.merger,
    txt, code, doc, path: pathValue, file
}