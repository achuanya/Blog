import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// 主页
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

export { router as staticRouter };