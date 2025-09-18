import express from 'express';
import { BlogService } from '../services/BlogService.js';

const router = express.Router();
const blogService = new BlogService();

// 获取文章列表
router.get('/posts', async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    const posts = await blogService.getPosts({ category, page: parseInt(page), limit: parseInt(limit) });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取单篇文章
router.get('/posts/:slug', async (req, res) => {
  try {
    const post = await blogService.getPost(req.params.slug);
    if (!post) {
      return res.status(404).json({ error: '文章不存在' });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建新文章
router.post('/posts', async (req, res) => {
  try {
    const post = await blogService.createPost(req.body);
    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 更新文章
router.put('/posts/:slug', async (req, res) => {
  try {
    const post = await blogService.updatePost(req.params.slug, req.body);
    res.json(post);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 删除文章
router.delete('/posts/:slug', async (req, res) => {
  try {
    await blogService.deletePost(req.params.slug);
    res.json({ message: '文章删除成功' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 获取分类列表
router.get('/categories', async (req, res) => {
  try {
    const categories = await blogService.getCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取标签列表
router.get('/tags', async (req, res) => {
  try {
    const tags = await blogService.getTags();
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router as blogRouter };