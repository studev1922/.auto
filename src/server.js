import os from 'node:os'
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors'; // Import middleware CORS
import { exec } from 'child_process';
import fileManageAPI from './file_api.js'

async function openURL(url) {
    exec(`start "" "${url}"`, (error) => {
        if (error) {
            console.error('Lỗi khi mở URL:', error);
        } else {
            console.log(`Đã mở URL: ${url}`);
        }
    });
}

export default async (__dirname) => {
    const app = express();
    const port = 3000;

    // Middleware
    app.use(bodyParser.json());
    app.use(cors());
    app.use(express.static('public'));
    
    // Xử lý tệp qua API
    fileManageAPI(app, __dirname)

    // Start server
    app.listen(port, () => {
        console.log(`\nStart server on http://localhost:${port}`);
    });

    let ipAddress = null, networkInterfaces = os.networkInterfaces();
    // Lấy địa chỉ IPv4 của máy chủ
    for (const ifName in networkInterfaces) {
        const interfaces = networkInterfaces[ifName];
        for (const interfaceInfo of interfaces) {
            if (interfaceInfo.family === 'IPv4' && !interfaceInfo.internal) {
                ipAddress = interfaceInfo.address;
                break;
            }
        }
        if (ipAddress) break;
    }

    if (ipAddress) await openURL(`http://${ipAddress}:${port}`);
}