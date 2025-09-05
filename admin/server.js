import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { blogRouter } from './routes/blog.js';
import { staticRouter } from './routes/static.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 路由
app.use('/api', blogRouter);
app.use('/', staticRouter);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`🚀 博客管理系统启动成功！`);
  console.log(`📱 管理界面: http://localhost:${PORT}`);
  console.log(`🔗 API 地址: http://localhost:${PORT}/api`);
});