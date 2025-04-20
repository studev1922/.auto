let tryFetch = async (relayNamed = "ComposerStoryCreateMutation_facebookRelayOperation") => {
    document.querySelector(".x1l1ennw").children[1]?.querySelector("[role]").click();
    let m = { match(e, t) { let r = [], n = RegExp(t); for (let o of e) n.test(o) && r.push(o); return r }, join: (...e) => Object.assign(...e), merger(...e) { let t = {}; return e.forEach(e => { !function e(t, r) { for (let n in r) r.hasOwnProperty(n) && ("object" != typeof r[n] || null === r[n] || Array.isArray(r[n]) ? Array.isArray(r[n]) ? (t[n] || (t[n] = []), t[n] = t[n].concat(r[n].filter(e => null !== e))) : t[n] = r[n] : (t[n] || (t[n] = {}), e(t[n], r[n]))) }(t, e) }), t }, txt: { contains(e, ...t) { if ("string" != typeof e) return !1; for (let r of t) if ("string" != typeof r || !e.includes(r)) return !1; return !0 }, encode(e) { let t = ""; for (let r = 0; r < e.length; r++) { let n = e.charCodeAt(r); n > 127 ? t += "\\u" + n.toString(16).padStart(4, "0") : t += e[r] } return t }, decode: e => e.replace(/\\u([\d\w]{4})/gi, function (e, t) { return String.fromCharCode(parseInt(t, 16)) }) }, code: { cookieEncode(e) { let t = ""; for (let r in e) if (e.hasOwnProperty(r)) { let n; t += `${encodeURIComponent(r)}=${encodeURIComponent(e[r])};` } return t }, cookieDecode(e) { let t = {}; return e ? (e.split(";").forEach(e => { let r = e.trim().split("="); if (2 === r.length) { let n = r[0].trim(), o = decodeURIComponent(r[1].trim()); t[n] = o } }), t) : t }, queryEncode(e) { let t = new URLSearchParams; for (let r in e) e.hasOwnProperty(r) && t.append(r, e[r]); return t.toString() }, queryDecode(e) { if ("string" == typeof e) e = new URLSearchParams(e); else if (!(e instanceof URLSearchParams)) throw Error("Must be URLSearchParams."); return Object.fromEntries(e.entries()) } }, doc: { select: (e, t) => (t || document).querySelector(e), selects: (e, t) => (t || document).querySelectorAll(e), cre(e, t, r, ...n) { let o = document.createElement(e); for (let i in t) o.setAttribute(i, t[i]); return m.doc.style(o, r), m.doc.children(1, o, ...n), o }, style(e, t = {}) { if (e && e.style) for (let r in t) e.style[r] = t[r] }, children(e = 1, t, ...r) { a = e ? "appendChild" : "prepend", t && r && r.forEach(e => { e instanceof Node ? t.appendChild(e) : "string" == typeof e && t[a](e = document.createTextNode(e)) }) }, evt: function (e, t, r, n) { e && e[evt](t, r, n) } }, path: { key_path(e, t) { let r = []; return !function e(n, o) { if ("object" == typeof n && null !== n) { if (Array.isArray(n)) n.forEach((t, r) => { let n = [...o]; n.length > 0 ? n[n.length - 1] += `[${r}]` : n.push(`[${r}]`), e(t, n) }); else for (let i in n) i === t && r.push([...o, i].join(".")), e(n[i], [...o, i]) } }(e, []), r }, val_path(e, t) { let r = []; return !function e(t, n, o) { if ("string" == typeof n && "string" == typeof t && t.includes(n) || t === n) { r.push(o.join(".")); return } if ("object" == typeof t && null !== t) { if (Array.isArray(t)) t.forEach((t, r) => { let i = [...o]; o.length > 0 ? i[i.length - 1] += `[${r}]` : i.push(`[${r}]`), e(t, n, i) }); else for (let i in t) e(t[i], n, [...o, i]) } }(e, t, []), r.map(e => e.startsWith("]") && 0 === e.indexOf("[") ? "[" + e : e) }, shortcut: (e, t) => (function e(r) { if ("object" == typeof r && null !== r) { if (Array.isArray(r)) for (let n of r) { let o = e(n); if (void 0 !== o) return o } else { if (t in r) return r[t]; for (let i in r) { let l = e(r[i]); if (void 0 !== l) return l } } } })(e), shortcuts(e, t) { let r = []; return !function e(n) { if ("object" == typeof n && null !== n) { if (Array.isArray(n)) for (let o of n) e(o); else for (let i in t in n && r.push(n[t]), n) e(n[i]) } }(e), r } } };
    let m2 = { data() { let e = dataElement.innerText; if (!e) return {}; let t = JSON.parse(e), r = t.u; if (!r || r.length <= 10) return { fb_dtsg: t.f }; let a = r.substring(10).split("&").map(e => e.split("=")); a.push(["fb_dtsg", t.f]); let l = Object.fromEntries(a); return delete l.jazoest, l }, async _facebookRelayOperation(...e) { let t = /__d\("([^"]+)",\[\],\(function\(.+?\)\{e\.exports="([^"]+)"\}\)/g, r = {}; (await Promise.all(Array.from(document.querySelectorAll("link[rel=preload][as=script]")).map(e => fetch(e.href).then(e => e.text())))).forEach(e => { let a; for (; null !== (a = t.exec(e));)r[a[1]] = a[2] }); let a = Object.fromEntries(Object.entries(r).sort(([e], [t]) => e.localeCompare(t))); if (0 === e.length) return a; { let l = {}; return e.forEach(e => { a.hasOwnProperty(e) && (l[e] = a[e]) }), l } }, async _extractRelayOperationData(...e) { let t = /params:\s*\{\s*id:\s*b\("([^"]+)"\),\s*metadata:\s*{[^}]*},\s*name:\s*"([^"]+)",\s*operationKind:\s*"[^"]*",\s*text:\s*null,\s*providedVariables:\s*\{([^}]*)\}\s*\}/g, r = /\s*([^:]+):\s*b\("([^"]+)"\)/g; return Promise.all(Array.from(document.querySelectorAll("link[rel=preload][as=script]")).map(e => fetch(e.href).then(e => e.text()))).then(a => { let l = {}; for (let o of a) { let n; for (; null !== (n = t.exec(o));) { let s = n[1], i = n[3], c = {}, p; for (; null !== (p = r.exec(i));) { let f = p[1].trim().replace(",", ""), u = p[2]; try { c[f] = require(u).get() } catch (d) { c[f] = u } } l[s] = c } } if (0 === e.length) return l; { let y = {}; return e.forEach(e => { l.hasOwnProperty(e) && (y[e] = l[e]) }), y } }) } }
    function random_txt(t) { let r = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", n = ""; for (let o = 0; o < t; o++)n += r.charAt(Math.floor(Math.random() * r.length)); return n }
    let dat = { data: m2.data(), doc_ids: await m2._facebookRelayOperation(relayNamed), providedVariables: await m2._extractRelayOperationData(relayNamed) }; console.log(dat);
    let body = Object.assign(
        { doc_id: dat.doc_ids[relayNamed] },
        dat.data,
        {
            variables: JSON.stringify(Object.assign({
                "input": {
                    "actor_id": "61550924364135",
                    "source": "WWW",
                    "attachments": [],
                    "audience": {
                        "privacy": {
                            "allow": [],
                            "base_state": "EVERYONE",
                            "deny": [],
                        }
                    },
                    "message": {
                        "ranges": [],
                        "text": random_txt(20)
                    }
                },
                "useDefaultActor": false, //@todo: check this
                "feedLocation": "TIMELINE",
                "feedbackSource": 0,
                "focusCommentID": null,
                "gridMediaWidth": 230,
                "groupID": null,
                "scale": require("WebPixelRatio").get(),
                "privacySelectorRenderLocation": "COMET_STREAM",
                "checkPhotosToReelsUpsellEligibility": true,
                "renderLocation": "timeline",
                "useDefaultActor": false,
                "inviteShortLinkKey": null,
                "isFeed": false,
                "isFundraiser": false,
                "isFunFactPost": false,
                "isGroup": false,
                "isEvent": false,
                "isTimeline": true,
                "isSocialLearning": false,
                "isPageNewsFeed": false,
                "isProfileReviews": false,
                "isWorkSharedDraft": false,
                "hashtag": null,
                "canUserManageOffers": false,
            }, dat.providedVariables[relayNamed]))
        }
    )


    let res = await fetch("https://www.facebook.com/api/graphql/", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: m.code.queryEncode(body)
    });

    res = await res.json();
    console.log(Object.keys(res), res);
}

await tryFetch();