const fileManager = {
    fileListElement: null,
    pathDisplay: null,
    searchBar: null,
    deleteButton: null,
    contextMenu: null,
    currentPath: "",
    pathHistory: [],
    selectedItems: [],
    draggedItemPath: null,
    currentContextMenuPath: null,
    currentItemList: [],

    renderFileManagerHTML(e) {
        let t = document.createElement("div");
        t.className = "container mt-3";
        let n = document.createElement("nav");
        n.id = "path-display", n.setAttribute("aria-label", "breadcrumb");
        let l = document.createElement("ol");
        l.className = "breadcrumb", n.appendChild(l), t.appendChild(n);
        let a = document.createElement("div");
        a.className = "d-flex", a.style.gap = ".25em";
        let i = document.createElement("div");
        i.id = "search-bar", i.className = "mb-3 w-100";
        let o = document.createElement("input");
        o.className = "form-control", o.placeholder = "Tìm kiếm tên...", o.oninput = function () {
            fileManager.searchItems(fileManager.value)
        }, i.appendChild(o), a.appendChild(i);
        let s = document.createElement("div");
        s.className = "d-flex justify-content-between align-items-center mb-3 d-inline";
        let r = document.createElement("button");
        r.id = "delete-button", r.className = "btn btn-danger", r.style.display = "none", r.onclick = function () {
            fileManager.deleteSelected()
        };
        let c = document.createElement("i");
        c.className = "bi bi-trash", r.appendChild(c), s.appendChild(r);
        let d = document.createElement("span");
        d.id = "selected-count", d.className = "text-muted small d-inline", s.appendChild(d), a.appendChild(s), t.appendChild(a);
        let p = document.createElement("div");
        p.className = "mb-3 d-block d-sm-none";
        let h = document.createElement("input");
        h.type = "file", h.className = "form-control", h.multiple = !0, h.onchange = function () {
            fileManager.handleMobileUpload(fileManager.files)
        }, p.appendChild(h), t.appendChild(p);
        let u = document.createElement("ul");
        u.id = "file-list", u.ondragover = function (e) {
            fileManager.handleDragOver(e)
        }, u.ondrop = function (e) {
            fileManager.handleDrop(e)
        };
        let y = document.createElement("li");
        y.className = "text-center p-5", y.textContent = "Kéo và thả thư mục hoặc tệp vào đây", u.appendChild(y), t.appendChild(u);
        let m = document.createElement("div");
        m.id = "context-menu";
        let f = document.createElement("ul");
        f.className = "list-group", [{
            text: "Đổi tên",
            class: "rename-option",
            action: "renameContextItem"
        }, {
            text: "Xóa",
            class: "delete-option",
            action: "deleteContextItem"
        }, {
            text: "Chọn",
            class: "select-option",
            action: "selectContextItem"
        }, {
            text: "Bỏ chọn",
            class: "unselect-option",
            action: "unselectContextItem"
        }, {
            text: "Thêm thư mục",
            class: "create-folder-option",
            action: "createFolder"
        }].forEach(e => {
            let t = document.createElement("li");
            t.className = `list-group-item ${e.class}`, t.textContent = e.text, t.onclick = function () {
                fileManager[e.action]()
            }, f.appendChild(t)
        }), m.appendChild(f), t.appendChild(m), e && e instanceof HTMLElement ? e.appendChild(t) : root.appendChild(t);
        fileManager.fileListElement = document.getElementById("file-list");
        fileManager.pathDisplay = document.getElementById("path-display");
        fileManager.searchBar = document.getElementById("search-bar");
        fileManager.deleteButton = document.getElementById("delete-button");
        fileManager.contextMenu = document.getElementById("context-menu");
        return t
    },

    async loadFiles(e = "") {
        fileManager.currentPath = e.replace(/\\/g, "/");
        fileManager.updatePathDisplay();
        if (e !== fileManager.currentPath && fileManager.pathHistory[fileManager.pathHistory.length - 1] !== fileManager.currentPath) {
            fileManager.pathHistory.push(fileManager.currentPath);
        }
        let t = await fetch(`/api/list?path=${e}`),
            n = await t.json();
        fileManager.currentItemList = n;
        fileManager.renderItemList(n);
        fileManager.deleteButton.style.display = fileManager.selectedItems.length > 0 ? "block" : "none";
    },

    updatePathDisplay() {
        let e = fileManager.pathDisplay.querySelector(".breadcrumb");
        e.innerHTML = "";
        let t = document.createElement("li");
        t.className = "breadcrumb-item";
        let n = document.createElement("a");
        n.href = "#", n.textContent = "./data", n.onclick = e => {
            e.preventDefault(), fileManager.loadFiles("")
        }, t.appendChild(n), e.appendChild(t);
        let l = fileManager.currentPath.split("/").filter(e => "" !== e),
            a = "";
        l.forEach((t, n) => {
            a += `/${t}`;
            let i = document.createElement("li"),
                o = n === l.length - 1;
            if (i.className = o ? "breadcrumb-item active" : "breadcrumb-item", o) i.setAttribute("aria-current", "page"), i.textContent = t;
            else {
                let s = document.createElement("a");
                s.href = "#", s.textContent = t;
                let r = a.startsWith("/") ? a.slice(1) : a;
                s.onclick = e => {
                    e.preventDefault(), fileManager.loadFiles(r)
                }, i.appendChild(s)
            }
            e.appendChild(i)
        })
    },

    renderItemList(e) {
        fileManager.fileListElement.innerHTML = "";
        if (0 !== e.length) {
            e.forEach(e => {
                let t = document.createElement("li");
                t.classList.add("d-flex", "align-items-center"), t.dataset.path = e.path, t.dataset.type = e.type, t.draggable = !0, t.innerHTML = `<span class="icon ${"folder" === e.type ? "folder-icon" : "file-icon"}"></span> <span style=flex:1>${e.name}</span> <button class='action-btn btn btn-light btn-sm' style=border:none><i class='bi bi-three-dots-vertical'></i></button>`, t.classList.toggle("selected", fileManager.selectedItems.includes(e.path)), t.addEventListener("click", n => {
                    n.stopPropagation();
                    let l = n.ctrlKey || n.metaKey;
                    if (l) {
                        let a = fileManager.selectedItems.indexOf(e.path); - 1 !== a ? (fileManager.selectedItems.splice(a, 1), t.classList.remove("selected")) : (fileManager.selectedItems.push(e.path), t.classList.add("selected")), fileManager.deleteButton.style.display = fileManager.selectedItems.length > 0 ? "block" : "none"
                    } else "folder" === e.type ? fileManager.loadFiles(e.path) : fileManager.handleFileClick(e)
                }), fileManager.fileListElement.appendChild(t), t.querySelector(".action-btn").addEventListener("click", t => {
                    t.stopPropagation(), fileManager.currentContextMenuPath = e.path, fileManager.showContextMenu(t.clientX, t.clientY, !0, "" !== fileManager.currentPath, "folder" === e.type)
                })
            })
        } else {
            fileManager.fileListElement.innerHTML = '<li class="text-center p-3">Không có mục nào</li>'
        }
    },

    handleFileClick(e) {
        let t = e.path,
            n = t.split(".").pop().toLowerCase();
        if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(n)) {
            fileManager.openImage(t);
        } else if (["mp4", "webm", "ogg", "avi", "mov"].includes(n)) {
            fileManager.openVideo(t);
        } else if (["mp3", "wav", "ogg", "flac", "aac"].includes(n)) {
            fileManager.openAudio(t);
        } else if (["txt", 'json', "md", "html"].includes(n)) { // Loại bỏ 'json' ở đây
            notify.notifyAction("Mở trình chỉnh sửa văn bản", "info"), fileManager.editTextFile(t);
        } else {
            notify.notifyAction("Không hỗ trợ xem tệp này");
        }
    },

    openImage(e) {
        let t = document.createElement("div");
        t.style.position = "fixed", t.style.top = "0", t.style.left = "0", t.style.width = "100vw", t.style.height = "100vh", t.style.backgroundColor = "rgba(0, 0, 0, 0.8)", t.style.display = "flex", t.style.justifyContent = "center", t.style.alignItems = "center", t.style.zIndex = "1100", t.style.cursor = "pointer";
        let n = document.createElement("div");
        n.style.position = "relative";
        let l = document.createElement("img");
        l.src = `/api/view?path=${encodeURIComponent(e)}`, l.alt = "Image", l.style.maxWidth = "90vw", l.style.maxHeight = "90vh", l.style.transition = "transform 0.2s ease-in-out";
        let a = document.createElement("div");

        function i(e, t) {
            let n = l.getBoundingClientRect(),
                i = e - n.left,
                o = t - n.top;
            a.style.backgroundImage = `url(${l.src})`, a.style.backgroundSize = `${2 * l.width}px ${2 * l.height}px`, a.style.backgroundPosition = `-${2 * i - 100}px -${2 * o - 100}px`, a.style.top = o - 100 + "px", a.style.left = i - 100 + "px", a.style.display = "block"
        }
        a.style.position = "absolute", a.style.border = "5px solid #fff", a.style.display = "none", a.style.pointerEvents = "none", a.style.zIndex = "10", a.style.width = "200px", a.style.height = "200px", n.appendChild(l), n.appendChild(a), t.appendChild(n), root.appendChild(t), t.addEventListener("click", e => {
            e.target === t && root.removeChild(t)
        }), l.addEventListener("mousemove", e => {
            i(e.clientX, e.clientY)
        }), l.addEventListener("mouseleave", () => {
            a.style.display = "none"
        }), l.addEventListener("touchmove", e => {
            if (1 === e.touches.length) {
                let t = e.touches[0];
                i(t.clientX, t.clientY)
            }
        }), l.addEventListener("touchend", () => {
            a.style.display = "none"
        })
    },

    openVideo(e) {
        let t = document.createElement("div");
        t.style.position = "fixed", t.style.top = "0", t.style.left = "0", t.style.width = "100vw", t.style.height = "100vh", t.style.backgroundColor = "rgba(0, 0, 0, 0.8)", t.style.display = "flex", t.style.justifyContent = "center", t.style.alignItems = "center", t.style.zIndex = "1100", t.style.cursor = "pointer";
        let n = document.createElement("div");
        n.style.position = "relative";
        let l = document.createElement("video");
        l.src = `/api/view?path=${encodeURIComponent(e)}`, l.controls = !0, l.style.maxWidth = "90vw", l.style.maxHeight = "90vh", l.autoplay = !0, n.appendChild(l), t.appendChild(n), root.appendChild(t), t.addEventListener("click", e => {
            e.target === t && root.removeChild(t)
        })
    },

    openAudio(e) {
        let t = document.createElement("div");
        t.style.position = "fixed", t.style.top = "0", t.style.left = "0", t.style.width = "100vw", t.style.height = "100vh", t.style.backgroundColor = "rgba(0, 0, 0, 0.8)", t.style.display = "flex", t.style.justifyContent = "center", t.style.alignItems = "center", t.style.zIndex = "1100", t.style.cursor = "pointer";
        let n = document.createElement("div");
        n.style.background = "#fff", n.style.padding = "20px", n.style.borderRadius = "8px", n.style.textAlign = "center", n.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)", n.style.maxWidth = "90vw";
        let l = document.createElement("audio");
        l.src = `/api/view?path=${encodeURIComponent(e)}`, l.controls = !0, l.autoplay = !0, l.style.width = "100%";
        let a = document.createElement("div");
        a.textContent = `🎵 Đang phát: ${decodeURIComponent(e.split("/").pop())}`, a.style.marginBottom = "10px", a.style.fontWeight = "bold";
        let i = document.createElement("button");
        i.textContent = "Đóng", i.className = "btn btn-secondary mt-2", i.onclick = () => root.removeChild(t), n.appendChild(a), n.appendChild(l), n.appendChild(i), t.appendChild(n), root.appendChild(t), t.addEventListener("click", e => {
            e.target === t && root.removeChild(t)
        })
    },

    editTextFile(e) {
        let t = document.createElement("div");
        t.style.position = "fixed", t.style.top = "0", t.style.left = "0", t.style.width = "100vw", t.style.height = "100vh", t.style.backgroundColor = "rgba(0, 0, 0, 0.8)", t.style.display = "flex", t.style.justifyContent = "center", t.style.alignItems = "center", t.style.zIndex = "1100";
        let n = document.createElement("div");
        n.style.backgroundColor = "#fff", n.style.padding = "20px", n.style.borderRadius = "8px", n.style.maxWidth = "90vw", n.style.maxHeight = "90vh", n.style.width = "600px", n.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)", n.style.display = "flex", n.style.flexDirection = "column", n.style.gap = "10px", n.innerHTML = `<h5>Chỉnh sửa tệp: <span style=font-size:.9em;word-break:break-all>${e}</span></h5><textarea id=file-edit-text style=flex:1;min-height:300px;resize:vertical;padding:10px></textarea><div class=text-end><button class="btn btn-primary me-2"onclick='fileManager.saveFile("${e}")'>💾 Lưu</button> <button class="btn btn-secondary"onclick=fileManager.closeEditor()>✖ Đóng</button></div>`, t.appendChild(n), root.appendChild(t), fetch(`/api/view?path=${encodeURIComponent(e)}`).then(e => e.text()).then(e => {
            document.getElementById("file-edit-text").value = e
        }).catch(e => notify.notifyAction("Không thể tải tệp để chỉnh sửa.")), window.currentTextEditorOverlay = t
    },

    saveFile(e) {
        let t = document.getElementById("file-edit-text").value;
        notify.notifyPromise("Đang lưu tệp", fetch("/api/save", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                path: e,
                content: t
            })
        }).then(e => e.json()).then(e => {
            if (!e.success) throw Error(e.error || "Lỗi không xác định")
        }))
    },

    async createFolder() {
        let e = prompt("Nhập tên thư mục mới:");
        if (e) {
            fetch("/api/create/folder", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: e,
                    path: fileManager.currentPath
                })
            }).then(e => e.json()).then(e => {
                notify.notifyAction(e.message || e.error, e.success ? "success" : "warning"), fileManager.loadFiles(fileManager.currentPath)
            })
        }
    },

    async deleteSelected(e) {
        let t = e || fileManager.selectedItems;
        if (t.length > 0 && confirm(`Bạn có chắc chắn muốn xóa ${t.length} mục đã chọn?`)) {
            let n = await fetch("/api/delete", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    items: t
                })
            }),
                l = await n.json();
            notify.notifyAction(l.message || l.error), fileManager.loadFiles(fileManager.currentPath), fileManager.selectedItems = [], fileManager.deleteButton.style.display = "none"
        } else if (e && e.length > 0) {
            fileManager.loadFiles(fileManager.currentPath);
        } else {
            notify.notifyAction("Vui lòng chọn ít nhất một mục để xóa.");
        }
    },

    async renameSelected(e) {
        let t = e || (1 === fileManager.selectedItems.length ? fileManager.selectedItems[0] : null);
        if (!t) {
            return notify.notifyAction("Vui lòng chọn một mục để đổi tên.");
        }
        let n = prompt("Nhập tên mới:");
        if (n) {
            fetch("/api/rename", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    oldPath: t,
                    newName: n
                })
            }).then(e => e.json()).then(e => {
                notify.notifyAction(e.message || e.error, e.success ? "success" : "warning"), fileManager.loadFiles(fileManager.currentPath), fileManager.selectedItems = [], fileManager.deleteButton.style.display = "none"
            })
        }
    },

    async goBack() {
        if (fileManager.pathHistory.length > 1) {
            fileManager.pathHistory.pop();
            let e = fileManager.pathHistory.pop();
            await fileManager.loadFiles(e);
        } else {
            await fileManager.loadFiles(""), fileManager.pathHistory = []
        }
    },

    closeEditor() {
        if (window.currentTextEditorOverlay) {
            root.removeChild(window.currentTextEditorOverlay);
            window.currentTextEditorOverlay = null;
        }
    },

    handleMobileUpload(e) {
        for (let t of e) {
            let n = fileManager.currentPath || "";
            fileManager.uploadFileWithRelativePath(t, n + "/" + t.name);
        }
        fileManager.loadFiles(fileManager.currentPath);
    },

    handleDragOver(e) {
        e.preventDefault();
    },

    async handleDrop(e) {
        e.preventDefault();
        let t = e.dataTransfer.items;
        if (!t || 0 === t.length) return;
        let n = [];
        for (let l of t) {
            let a = (l && typeof l.webkitGetAsEntry === 'function') ? l.webkitGetAsEntry() : undefined;
            if (a) {
                n.push(fileManager.traverseFileTree(a, fileManager.currentPath));
            }
        }
        await Promise.all(n);
        await fileManager.loadFiles(fileManager.currentPath);
    },

    async traverseFileTree(e, t) {
        if (e.isFile) {
            return new Promise(n => {
                e.file(async e => {
                    let l = fileManager.pathJoin(t, e.name);
                    await fileManager.uploadFileWithRelativePath(e, l);
                    n();
                })
            });
        }
        if (e.isDirectory) {
            let n = e.createReader(),
                l = await new Promise(e => n.readEntries(e)),
                a = fileManager.pathJoin(t, e.name);
            await fileManager.createFolderOnServer(a);
            let i = l.map(e => fileManager.traverseFileTree(e, a));
            await Promise.all(i);
        }
    },

    async uploadFileWithRelativePath(e, t) {
        let n = new FormData;
        n.append("file", e), n.append("relativePath", fileManager.pathDirname(t));
        let l = await fetch("/api/upload", {
            method: "POST",
            body: n
        }),
            a = await l.json();
        a.error ? (console.error(a.error), notify.notifyAction(`Lỗi khi tải lên: ${e.name}`, "danger")) : notify.notifyAction(`Tải lên ${e.name} thành công`, "success")
    },

    async createFolderOnServer(e) {
        let t = await fetch("/api/create/folder", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: fileManager.pathBasename(e),
                path: fileManager.pathDirname(e)
            })
        }),
            n = await t.json();
        if (n.error) {
            console.error(`Lỗi khi tạo thư mục: ${e}`, n.error);
        }
    },

    pathJoin(...e) {
        return e.join("/").replace(/\/+/g, "/")
    },

    pathDirname(e) {
        let t = e.split("/").filter(Boolean);
        t.pop();
        return t.join("/")
    },

    pathBasename(e) {
        let t = e.split("/").filter(Boolean);
        return t[t.length - 1] || ""
    },

    async uploadFile(e, t) {
        let n = new FormData;
        n.append("file", e), n.append("relativePath", t);
        let l = await fetch("/api/upload", {
            method: "POST",
            body: n
        }),
            a = await l.json();
        if (a.error) {
            notify.notifyAction(`Lỗi khi tải lên ${e.name}: ${a.error}`);
        }
    },

    handleDragOverFolder(e) {
        e.preventDefault(), fileManager.classList.add("drag-over-target")
    },

    async handleDropIntoFolder(e) {
        e.preventDefault(), fileManager.classList.remove("drag-over-target");
        if (fileManager.draggedItemPath) {
            let t = `${fileManager.dataset.path}/${fileManager.draggedItemPath.split("/").pop()}`,
                n = await fetch("/api/move", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        oldPath: fileManager.draggedItemPath,
                        newPath: t
                    })
                }),
                l = await n.json();
            if (l.error) {
                notify.notifyAction(`Lỗi khi di chuyển: ${l.error}`);
            }
            fileManager.loadFiles(fileManager.currentPath);
            fileManager.draggedItemPath = null;
        } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            let a = e.dataTransfer.files,
                i = fileManager.dataset.path;
            console.log("Thả tệp từ máy tính vào thư mục:", i);
            for (let o of a) {
                await fileManager.uploadFile(o, i);
            }
            fileManager.loadFiles(fileManager.currentPath);
        }
    },

    showContextMenu(e, t, n, l, a) {
        let i = window.innerWidth,
            o = window.innerHeight,
            s = fileManager.contextMenu.querySelector(".rename-option"),
            r = fileManager.contextMenu.querySelector(".delete-option"),
            c = fileManager.contextMenu.querySelector(".select-option"),
            d = fileManager.contextMenu.querySelector(".unselect-option"),
            p = fileManager.contextMenu.querySelector(".create-folder-option");
        s.style.display = n ? "block" : "none", r.style.display = n ? "block" : "none", c.style.display = n && !fileManager.selectedItems.includes(fileManager.currentContextMenuPath) ? "block" : "none", d.style.display = n && fileManager.selectedItems.includes(fileManager.currentContextMenuPath) ? "block" : "none", p.style.display = n ? "none" : "block", e + 180 > i && (e = i - 180 - 10), t + 240 > o && (t = o - 240 - 10), fileManager.contextMenu.style.left = e + "px", fileManager.contextMenu.style.top = t + "px", fileManager.contextMenu.style.display = "block"
    },

    renameContextItem() {
        fileManager.contextMenu.style.display = "none";
        fileManager.renameSelected(fileManager.currentContextMenuPath);
        fileManager.currentContextMenuPath = null;
    },

    deleteContextItem() {
        fileManager.contextMenu.style.display = "none";
        fileManager.deleteSelected([fileManager.currentContextMenuPath]);
        fileManager.currentContextMenuPath = null;
    },

    selectContextItem() {
        if (fileManager.currentContextMenuPath && !fileManager.selectedItems.includes(fileManager.currentContextMenuPath)) {
            fileManager.selectedItems.push(fileManager.currentContextMenuPath);
            let e = Array.from(fileManager.fileListElement.children).find(e => e.dataset.path === fileManager.currentContextMenuPath);
            if (e) {
                e.classList.add("selected");
            }
            fileManager.deleteButton.style.display = fileManager.selectedItems.length > 0 ? "block" : "none";
        }
        fileManager.contextMenu.style.display = "none";
        fileManager.currentContextMenuPath = null;
    },

    unselectContextItem() {
        if (fileManager.currentContextMenuPath && fileManager.selectedItems.includes(fileManager.currentContextMenuPath)) {
            fileManager.selectedItems = fileManager.selectedItems.filter(e => e !== fileManager.currentContextMenuPath);
            let e = Array.from(fileManager.fileListElement.children).find(e => e.dataset.path === fileManager.currentContextMenuPath);
            if (e) {
                e.classList.remove("selected");
            }
            fileManager.deleteButton.style.display = fileManager.selectedItems.length > 0 ? "block" : "none";
        }
        fileManager.contextMenu.style.display = "none";
        fileManager.currentContextMenuPath = null;
    },

    searchItems(e) {
        fileManager.renderItemList(fileManager.currentItemList.filter(t => t.name.toLowerCase().includes(e.toLowerCase())));
    },

    init() {
        fileManager.renderFileManagerHTML();
        document.addEventListener("keydown", e => {
            if (e.ctrlKey && "Backspace" === e.key) {
                e.preventDefault();
                fileManager.goBack();
            }
        });
        fileManager.fileListElement.addEventListener("contextmenu", e => {
            e.preventDefault();
            let t = e.target.closest("li[data-path]");
            if (t) {
                fileManager.currentContextMenuPath = t.dataset.path;
                let n = "folder" === t.dataset.type;
                fileManager.showContextMenu(e.clientX, e.clientY, !0, "" !== fileManager.currentPath, n);
            } else {
                fileManager.showContextMenu(e.clientX, e.clientY, !1, "" !== fileManager.currentPath, !1);
            }
        });
        document.addEventListener("click", () => {
            fileManager.contextMenu.style.display = "none";
            fileManager.currentContextMenuPath = null;
        });
        let longPressTimer = null;
        fileManager.fileListElement.addEventListener("touchstart", e => {
            if ("LI" === e.target.tagName || e.target.closest("li")) return;
            longPressTimer = setTimeout(() => {
                fileManager.showContextMenu(e.touches[0].clientX, e.touches[0].clientY, !1, "" !== fileManager.currentPath, !1);
            }, 800);
        });
        fileManager.fileListElement.addEventListener("touchend", () => {
            clearTimeout(longPressTimer);
        });
        fileManager.loadFiles();
    }
};
