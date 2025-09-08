import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// Express服务器专注于API服务，前端页面由Vite处理
// 如需静态文件服务，可在此添加具体的静态资源路由

export { router as staticRouter };