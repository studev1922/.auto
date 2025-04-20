import fs from 'node:fs';
import path from 'node:path';
import FormData from 'form-data';
import axios from 'axios';

let m = {
    match(t, e) { let o = [], f = RegExp(e); for (let n of t) f.test(n) && o.push(n); return o },
    join: (...o) => Object.assign(...o),
    /**
     * @param {...Object|Array} params 
     */
    merger(...r) { let n = {}; return r.forEach(r => { !function r(n, t) { for (let e in t) t.hasOwnProperty(e) && ("object" != typeof t[e] || null === t[e] || Array.isArray(t[e]) ? Array.isArray(t[e]) ? (n[e] || (n[e] = []), n[e] = n[e].concat(t[e].filter(r => null !== r))) : n[e] = t[e] : (n[e] || (n[e] = {}), r(n[e], t[e]))) }(n, r) }), n },
    txt: {
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
    },
    code: {
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
    },
    doc: {
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
    },
    path: {
        key_path(o, t) { let n = []; return !function f(l, x) { if ("object" == typeof l && null !== l) { if (Array.isArray(l)) l.forEach((t, n) => { let l = [...x]; l.length > 0 ? l[l.length - 1] += `[${n}]` : l.push(`[${n}]`), f(t, l) }); else for (let i in l) i === t && n.push([...x, i].join(".")), f(l[i], [...x, i]) } }(o, []), n },
        val_path(o, t) { let n = []; return !function f(t, i, x) { if ("string" == typeof i && "string" == typeof t && t.includes(i) || t === i) { n.push(x.join(".")); return } if ("object" == typeof t && null !== t) { if (Array.isArray(t)) t.forEach((t, n) => { let r = [...x]; x.length > 0 ? r[r.length - 1] += `[${n}]` : r.push(`[${n}]`), f(t, i, r) }); else for (let r in t) f(t[r], i, [...x, r]) } }(o, t, []), n.map(o => o.startsWith("]") && 0 === o.indexOf("[") ? "[" + o : o) },
        shortcut(e, t) { return function e(i) { if ("object" == typeof i && null !== i) { if (Array.isArray(i)) for (let r of i) { let f = e(r); if (void 0 !== f) return f } else { if (t in i) return i[t]; for (let n in i) { let o = e(i[n]); if (void 0 !== o) return o } } } }(e) },
        shortcuts(e, t) { let f = []; return !function e(n) { if ("object" == typeof n && null !== n) { if (Array.isArray(n)) for (let i of n) e(i); else for (let l in t in n && f.push(n[t]), n) e(n[l]) } }(e), f }
    },

    // MODULES
    file: {
        /**
         * Reads the content of a file.
         * @param {string} filePath - The path to the file.
         * @param {string} encoding - The file encoding (default: 'utf-8').
         * @returns {Promise<string | null>} - The file content, or null on error.
         */
        async readFile(filePath, encoding = 'utf-8') {
            try {
                return await fs.promises.readFile(filePath, { encoding });
            } catch (error) {
                throw new Error(`Error reading file '${filePath}': ${error.message}`);
            }
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
    },
    env: {
        URL_UPLOAD: 'https://upload.facebook.com/ajax/react_composer/attachments/photo/upload',
        URL_GRAPH: 'https://www.facebook.com/api/graphql',
    }
}
const u = {
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
}

const dirData = '.data'
const txtNamed = 'post.txt'
const res_success = 'success'
const res_error = 'error'
const nes = await m.file.readAsJson('.asset/nes.json')
const cookies = await m.file.readFile('.asset/cookies.txt')
let mutation = {
    post: async (name, audience, message, attachments) => {
        let variables = JSON.stringify(Object.assign({
            "input": {
                "source": "WWW", audience, attachments, message,
                "actor_id": nes.data.__user
            }
        }, nes.variables2, nes.providedVariables[name]))
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
        let upUrl = `${m.env.URL_UPLOAD}?${m.code.queryEncode(nes.data)}`;
        let imageName = path.basename(imgPath);
        let imageBuffer = await fs.promises.readFile(imgPath);
        let contentType;

        const fData = new FormData();
        fData.append('source', '8');
        fData.append('waterfallxapp', 'comet');
        fData.append('profile_id', nes.data.__user);
        fData.append('upload_id', `jsc_c_${Math.random().toString(36).substring(2, 12)}`);
        fData.append('farr', imageBuffer, { filename: imageName, contentType: contentType, });

        const res = await axios.post(upUrl, fData, {
            headers: Object.assign({
                'Cookie': cookies
            }, fData.getHeaders()),
        });
        return handle_res(res)
    }
}

nes['variables2'] = {
    checkPhotosToReelsUpsellEligibility: true,
    feedLocation: "TIMELINE",
    feedbackSource: 0,
    gridMediaWidth: 230,
    isTimeline: true,
    privacySelectorRenderLocation: "COMET_STREAM",
    renderLocation: "timeline",
    scale: 1,
    focusCommentID: null,
    groupID: null,
    hashtag: null,
    inviteShortLinkKey: null,
    useDefaultActor: false, //@todo: check this
    canUserManageOffers: false,
    isEvent: false,
    isFeed: false,
    isFunFactPost: false,
    isFundraiser: false,
    isGroup: false,
    isPageNewsFeed: false,
    isProfileReviews: false,
    isSocialLearning: false,
    isWorkSharedDraft: false,
}

async function post_me() {
    let dirEach = async (h_image, h_mutation, h_response) => {
        let log = [], prepare = {
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
            log.push(await h_response(res, dir)) // handle response
        }
        return log
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
            let audience = { privacy: { allow: [], deny: [], base_state: 'EVERYONE' } }
            return await mutation.post(mutationNamed, audience, message, attachments)
        },
        handle_response: async (response, folder) => {
            let { data, errors, extensions } = response.data, fnw = new Date().toLocaleString('vi').replaceAll(':', '.').replaceAll('/', '-')
            if (typeof data === 'string' && data.startsWith('for')) data = JSON.parse(data.substring(9))
            if (data) await m.file.writeAsJson(`res/${fnw}/${folder}/post ${res_success}.json`, data);
            if (errors) await m.file.writeAsJson(`res/${fnw}/${folder}/post ${res_error}.json`, errors);
            return { [folder]: { data, errors } }
        }
    }
    return await dirEach(handle.upload_images, handle.post_mutation, handle.handle_response)
}

await post_me()
    .then(_ => console.log('Done!'))
    .catch(err => console.error(err))
    .finally(() => process.exit(0))