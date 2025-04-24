import fs from 'node:fs';
import path from 'node:path';
import axios from 'axios';
import FormData from 'form-data';
import express from 'express';
import mime from 'mime';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url'
import multer from 'multer';
import cors from 'cors'; // Import middleware CORS

import audiences from './src/audiences.js';
import m, { utils as u, menu } from './src/module.js';


const dirData = '.data'
const txtNamed = 'post.txt'
const res_success = 'success'
const res_error = 'error'
const nes = await m.file.readAsJson(m.env.PATH_NES_DATA)
const cookies = await m.file.readFile([m.env.PATH_COOKIES, '.asset/_cookie.txt'])
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
        let fnw = new Date().toLocaleString('vi').replaceAll(':', '.').replaceAll('/', '-')
        await _post(audiences.group('633488806310573'), fnw)
            .then(resLogs => {
                m.file.writeAsJson(`res/${fnw}/res_data.json`, resLogs)
                console.log('Done!');
            })
            .catch(console.error).finally(() => process.exit(0))
    }
}

const mnu = {
    post: async () => {
        await menu.internalization([
            ['Exit', null],
            ['Post me', post.me],
            ['Post group', post.group],
        ], false)
    },
    onServer: async () => {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        const app = express();
        const port = 3000;
        const dataDir = path.join(__dirname, '.data');

        // Middleware
        app.use(bodyParser.json());
        app.use(cors());
        app.use(express.static('public'));

        // Hàm xử lý đường dẫn an toàn
        const fullPath = (e = "") => { let l = path.normalize(e).replace(/^(\.\.(\/|\\|$))+/, ""); return path.join(dataDir, l) };
        const storage = multer.diskStorage({ async destination(a, i, e) { try { await fs.promises.mkdir(dataDir, { recursive: !0 }), e(null, dataDir) } catch (n) { e(n) } }, filename(a, i, e) { e(null, i.originalname) } });

        const upload = multer({ storage });
        app.post('/api/upload', upload.single('file'), async (req, res) => {
            if (!req.file) {
                return res.status(400).json({ error: 'Không có tệp nào được tải lên.' });
            }

            const relativePath = req.body.relativePath || '';
            const destDir = fullPath(relativePath);
            const destPath = path.join(destDir, req.file.originalname);

            try {
                await fs.promises.mkdir(destDir, { recursive: true });
                await fs.promises.rename(req.file.path, destPath);
                res.json({ message: `Tệp '${req.file.originalname}' đã được tải lên thành công.` });
            } catch (err) {
                console.error('Lỗi khi xử lý file tải lên:', err);
                res.status(500).json({ error: 'Không thể xử lý file tải lên.' });
            }
        });

        app.get('/api/list', async (req, res) => {
            const relativePath = req.query.path || '';
            const targetPath = fullPath(relativePath);

            try {
                const items = await fs.promises.readdir(targetPath, { withFileTypes: true });
                const response = items.map(item => ({
                    name: item.name,
                    type: item.isDirectory() ? 'folder' : 'file',
                    path: path.join(relativePath, item.name).replace(/\\/g, '/')
                }));
                res.json(response);
            } catch (error) {
                console.error('Lỗi khi liệt kê thư mục:', error);
                res.status(500).json({ error: 'Không thể truy cập thư mục.' });
            }
        });

        app.get('/api/view', (req, res) => {
            try {
                const filePath = fullPath(decodeURIComponent(req.query.path)); // Tự xử lý full path theo project bạn

                if (!fs.existsSync(filePath)) {
                    return res.status(404).send('File not found');
                }

                const stat = fs.statSync(filePath);
                const fileSize = stat.size;
                const range = req.headers.range;

                const contentType = mime.getType(filePath) || 'application/octet-stream';

                if (range) {
                    const parts = range.replace(/bytes=/, "").split("-");
                    const start = parseInt(parts[0], 10);
                    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

                    if (start >= fileSize || end >= fileSize) {
                        return res.status(416).send('Requested range not satisfiable');
                    }

                    const chunkSize = (end - start) + 1;
                    const fileStream = fs.createReadStream(filePath, { start, end });

                    res.writeHead(206, {
                        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                        'Accept-Ranges': 'bytes',
                        'Content-Length': chunkSize,
                        'Content-Type': contentType,
                    });

                    fileStream.pipe(res);
                } else {
                    res.writeHead(200, {
                        'Content-Length': fileSize,
                        'Content-Type': contentType,
                    });

                    fs.createReadStream(filePath).pipe(res);
                }
            } catch (err) {
                console.error('Error in /api/view:', err);
                res.status(500).send('Internal Server Error');
            }
        });


        app.post('/api/save', async (req, res) => {
            const { path, content } = req.body;
            try {
                const filePath = fullPath(path);
                await fs.promises.writeFile(filePath, content, 'utf-8');
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: 'Không thể lưu tệp.' });
            }
        });

        app.post('/api/create/folder', async (req, res) => {
            const { name, path: relativePath } = req.body;
            const newFolderPath = fullPath(path.join(relativePath, name));

            try {
                await fs.promises.mkdir(newFolderPath, { recursive: true });
                res.json({ message: 'Thư mục đã được tạo thành công.' });
            } catch (error) {
                console.error('Lỗi khi tạo thư mục:', error);
                res.status(500).json({ error: 'Không thể tạo thư mục.' });
            }
        });

        app.delete('/api/delete', async (req, res) => {
            const { items } = req.body;

            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ error: 'Vui lòng chọn các mục để xóa.' });
            }

            try {
                const deletePromises = items.map(async (relativePath) => {
                    const itemPath = fullPath(relativePath);
                    const stats = await fs.promises.stat(itemPath);
                    if (stats.isDirectory()) {
                        await fs.promises.rm(itemPath, { recursive: true, force: true });
                    } else {
                        await fs.promises.unlink(itemPath);
                    }
                });

                await Promise.all(deletePromises);
                res.json({ message: 'Các mục đã được xóa thành công.' });
            } catch (error) {
                console.error('Lỗi khi xóa mục:', error);
                res.status(500).json({ error: 'Không thể xóa một hoặc nhiều mục.' });
            }
        });

        app.post('/api/rename', async (req, res) => {
            const { oldPath, newName } = req.body;
            const oldFullPath = fullPath(oldPath);
            const newDir = path.dirname(oldFullPath);
            const newFullPath = path.join(newDir, newName);

            try {
                // Nếu đích tồn tại, xóa trước (ghi đè)
                if (fs.existsSync(newFullPath)) {
                    const stats = await fs.promises.stat(newFullPath);
                    if (stats.isDirectory()) {
                        await fs.promises.rm(newFullPath, { recursive: true, force: true });
                    } else {
                        await fs.promises.unlink(newFullPath);
                    }
                }

                // Đổi tên (rename)
                await fs.promises.rename(oldFullPath, newFullPath);

                res.json({ message: 'Đã đổi tên thành công (ghi đè nếu cần).' });
            } catch (error) {
                console.error('Lỗi khi đổi tên:', error);
                res.status(500).json({ error: 'Không thể đổi tên. Có thể tệp đang mở hoặc lỗi hệ thống.' });
            }
        });

        app.post('/api/move', async (req, res) => {
            const { oldPath, newPath } = req.body;
            const oldFullPath = fullPath(oldPath);
            const newFullPath = fullPath(newPath);

            try {
                await fs.promises.rename(oldFullPath, newFullPath);
                res.json({ message: 'Đã di chuyển thành công.' });
            } catch (error) {
                console.error('Lỗi khi di chuyển:', error);
                res.status(500).json({ error: 'Không thể di chuyển.' });
            }
        });

        app.listen(port, () => {
            console.log(`Máy chủ đang lắng nghe tại http://localhost:${port}`);
        });
    },
}

await menu.internalization([
    ['Exit', null],
    ['Create post', mnu.post],
    ['Start The Server', mnu.onServer],
], true)
