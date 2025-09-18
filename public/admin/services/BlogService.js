import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import slugify from 'slugify';
import dayjs from 'dayjs';
import yaml from 'js-yaml';

export class BlogService {
  constructor() {
    // 博客文章根目录（相对于项目根目录）
    this.blogPath = path.resolve('../src/data/blog');
    this.categories = ['life', 'sports', 'startup', 'technology'];
  }

  // 获取文章列表
  async getPosts({ category, page = 1, limit = 10 } = {}) {
    const posts = [];
    const searchDirs = category ? [category] : this.categories;

    for (const cat of searchDirs) {
      const categoryPath = path.join(this.blogPath, cat);
      try {
        const years = await fs.readdir(categoryPath);
        
        for (const year of years) {
          const yearPath = path.join(categoryPath, year);
          const files = await fs.readdir(yearPath);
          
          for (const file of files) {
            if (file.endsWith('.md') || file.endsWith('.mdx')) {
              const filePath = path.join(yearPath, file);
              const content = await fs.readFile(filePath, 'utf-8');
              const { data } = matter(content);
              
              posts.push({
                slug: path.basename(file, path.extname(file)),
                category: cat,
                year,
                filename: file,
                ...data,
                pubDatetime: dayjs(data.pubDatetime).format('YYYY-MM-DD HH:mm:ss')
              });
            }
          }
        }
      } catch (error) {
        console.warn(`无法读取分类目录 ${cat}:`, error.message);
      }
    }

    // 按发布时间排序
    posts.sort((a, b) => new Date(b.pubDatetime) - new Date(a.pubDatetime));

    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPosts = posts.slice(startIndex, endIndex);

    return {
      posts: paginatedPosts,
      total: posts.length,
      page,
      limit,
      totalPages: Math.ceil(posts.length / limit)
    };
  }

  // 获取单篇文章
  async getPost(slug) {
    for (const category of this.categories) {
      const categoryPath = path.join(this.blogPath, category);
      try {
        const years = await fs.readdir(categoryPath);
        
        for (const year of years) {
          const yearPath = path.join(categoryPath, year);
          const files = await fs.readdir(yearPath);
          
          for (const file of files) {
            if (file.endsWith('.md') || file.endsWith('.mdx')) {
              const filePath = path.join(yearPath, file);
              const content = await fs.readFile(filePath, 'utf-8');
              const { data, content: markdown } = matter(content);
              
              // 使用frontmatter中的slug，如果没有则使用文件名
              const postSlug = data.slug || path.basename(file, path.extname(file));
              
              if (postSlug === slug) {
                return {
                  slug: postSlug,
                  category,
                  year,
                  filename: file,
                  content: markdown,
                  ...data
                };
              }
            }
          }
        }
      } catch (error) {
        console.warn(`搜索文章时出错 ${category}:`, error.message);
      }
    }
    return null;
  }

  // 创建新文章
  async createPost(postData) {
    const { 
      title, 
      category = 'technology', 
      content = '', 
      tags = [], 
      description = '',
      featured = false,
      draft = false,
      ogImage = '',
      // 新增：是否使用 MDX，从而允许在正文中直接写 <Img ... />
      useMDX = false
    } = postData;
    
    if (!title) {
      throw new Error('文章标题不能为空');
    }

    if (!description) {
      throw new Error('文章描述不能为空');
    }

    // 生成 slug - 优先使用用户提供的 canonicalURL，否则从标题生成
    let slug;
    if (postData.canonicalURL && postData.canonicalURL.trim()) {
      // 用户提供了自定义 slug，进行清理和验证
      slug = postData.canonicalURL.trim()
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5\-_]/g, '-') // 允许中文、英文、数字、连字符、下划线
        .replace(/-+/g, '-') // 合并多个连字符
        .replace(/^-|-$/g, ''); // 移除首尾连字符
      
      // 确保 slug 不为空
      if (!slug) {
        slug = slugify(title, { lower: true, strict: true }) || `post-${Date.now().toString().slice(-6)}`;
      }
    } else {
      // 用户没有提供 slug，从标题自动生成
      if (/[\u4e00-\u9fa5]/.test(title)) {
        // 中文标题处理
        slug = title.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '-')
                   .replace(/-+/g, '-')
                   .replace(/^-|-$/g, '')
                   .toLowerCase();
        
        if (!slug) {
          slug = `post-${Date.now().toString().slice(-6)}`;
        }
      } else {
        // 英文标题使用 slugify
        slug = slugify(title, { lower: true, strict: true });
        if (!slug) {
          slug = `post-${Date.now().toString().slice(-6)}`;
        }
      }
    }
    
    // 获取当前年份
    const year = new Date().getFullYear().toString();
    
    // 构建文件路径（新增：根据 useMDX 选择扩展名）
    const ext = useMDX ? '.mdx' : '.md';
    const categoryPath = path.join(this.blogPath, category, year);
    const filePath = path.join(categoryPath, `${slug}${ext}`);
    
    // 确保目录存在
    await fs.mkdir(categoryPath, { recursive: true });
    
    // 检查文件是否已存在
    try {
      await fs.access(filePath);
      throw new Error('同名文章已存在');
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
    
    // 构建完整的 Front Matter，按照正确的字段顺序
    const frontMatter = {
      author: '游钓四方',
      draft: Boolean(draft),
      featured: Boolean(featured),
      category,
      pubDatetime: new Date(new Date().getTime() + 8 * 60 * 60 * 1000).toISOString().replace(/:\d{2}\.\d{3}Z$/, '+08:00'),
      title,
      slug
    };

    // 添加可选字段（按顺序）
    if (ogImage && ogImage.trim()) {
      frontMatter.ogImage = ogImage.trim();
    }
    
    // 添加tags字段
    frontMatter.tags = Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []);
    
    // 添加description字段
    frontMatter.description = description.trim();
    
    // 使用自定义选项生成文件内容，避免 YAML 格式问题
    const fileContent = matter.stringify(content, frontMatter, {
      engines: {
        yaml: {
          stringify: (obj) => {
            // 自定义 YAML 序列化，确保格式正确
            return yaml.dump(obj, {
              quotingType: '"',
              forceQuotes: false,
              lineWidth: -1,
              noRefs: true,
              skipInvalid: true,
              flowLevel: -1,
              styles: {
                '!!str': 'plain'
              }
            });
          }
        }
      }
    });
    
    // 写入文件
    await fs.writeFile(filePath, fileContent, 'utf-8');
    
    return {
      slug,
      category,
      year,
      filename: `${slug}${ext}`,
      ...frontMatter
    };
  }

  // 更新文章
  async updatePost(slug, postData) {
    const existingPost = await this.getPost(slug);
    if (!existingPost) {
      throw new Error('文章不存在');
    }
  
    const oldFilePath = path.join(this.blogPath, existingPost.category, existingPost.year, existingPost.filename);
    // 现有扩展名（.md 或 .mdx）
    const existingExt = path.extname(existingPost.filename) || '.md';
    // 目标扩展名（可由 useMDX 覆写）
    const targetExt = (typeof postData.useMDX !== 'undefined')
      ? (postData.useMDX ? '.mdx' : '.md')
      : existingExt;
    const extChanged = targetExt !== existingExt;

    // 处理标签
    let processedTags = postData.tags;
    if (typeof processedTags === 'string') {
      processedTags = processedTags.split(',').map(t => t.trim()).filter(t => t);
    }
    
    // 处理新的 slug
    let newSlug = existingPost.slug;
    if (postData.canonicalURL && postData.canonicalURL.trim() && postData.canonicalURL.trim() !== existingPost.slug) {
      // 用户修改了 slug，需要生成新的 slug 并重命名文件
      newSlug = postData.canonicalURL.trim()
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5\-_]/g, '-') // 允许中文、英文、数字、连字符、下划线
        .replace(/-+/g, '-') // 合并多个连字符
        .replace(/^-|-$/g, ''); // 移除首尾连字符
      
      // 确保 slug 不为空
      if (!newSlug) {
        newSlug = existingPost.slug;
      }
    }
    
    // 检查是否有实际内容变化（排除仅分类变化）
    const hasContentChange = (
      postData.title !== existingPost.title ||
      postData.description !== existingPost.description ||
      postData.content !== existingPost.content ||
      newSlug !== existingPost.slug ||
      Boolean(postData.featured) !== Boolean(existingPost.featured) ||
      Boolean(postData.draft) !== Boolean(existingPost.draft) ||
      (postData.ogImage || '') !== (existingPost.ogImage || '') ||
      JSON.stringify(processedTags || []) !== JSON.stringify(existingPost.tags || [])
    );
    
    // 检查是否仅修改了分类
    const onlyCategoryChanged = (
      postData.category !== existingPost.category &&
      !hasContentChange
    );
    
    // 更新数据，确保包含所有字段
    const updatedData = {
      ...existingPost,
      ...postData,
      slug: newSlug,  // 使用新的 slug
      tags: processedTags || existingPost.tags || []
    };
    
    // 只有在有实际内容变化且不是仅分类变化时才添加 modDatetime
    if (hasContentChange && !onlyCategoryChanged) {
      updatedData.modDatetime = new Date(new Date().getTime() + 8 * 60 * 60 * 1000).toISOString().replace(/:\d{2}\.\d{3}Z$/, '+08:00');
    }
  
    // 处理布尔值字段
    if ('featured' in postData) {
      updatedData.featured = Boolean(postData.featured);
    }
    if ('draft' in postData) {
      updatedData.draft = Boolean(postData.draft);
    }
  
    // 处理 description，确保不包含特殊符号
    if (updatedData.description) {
      updatedData.description = updatedData.description.trim();
    }
  
    // 清理不需要的字段
    const cleanedData = { ...updatedData };
    ['canonicalURL', 'timezone'].forEach(key => {
      delete cleanedData[key];
    });
    
    // 清理空的 ogImage
    if (cleanedData.ogImage === '') {
      delete cleanedData.ogImage;
    }
    
    const { content, ...frontMatter } = cleanedData;
    
    // 重新排序frontMatter字段以确保顺序一致
    const orderedFrontMatter = {
      author: frontMatter.author || '游钓四方',
      draft: Boolean(frontMatter.draft),
      featured: Boolean(frontMatter.featured),
      category: frontMatter.category,
      pubDatetime: frontMatter.pubDatetime
    };
    
    // 只有在有 modDatetime 时才添加到字段排序中
    if (frontMatter.modDatetime) {
      orderedFrontMatter.modDatetime = frontMatter.modDatetime;
    }
    
    orderedFrontMatter.title = frontMatter.title;
    orderedFrontMatter.slug = newSlug;  // 使用新的 slug
    
    // 添加可选字段（按顺序）
    if (frontMatter.ogImage) {
      orderedFrontMatter.ogImage = frontMatter.ogImage;
    }
    
    orderedFrontMatter.tags = frontMatter.tags || [];
    orderedFrontMatter.description = frontMatter.description || '';
    
    // 使用自定义选项生成新的文件内容
    const fileContent = matter.stringify(content || '', orderedFrontMatter, {
      engines: {
        yaml: {
          stringify: (obj) => {
            return yaml.dump(obj, {
              quotingType: '"',
              forceQuotes: false,
              lineWidth: -1,
              noRefs: true,
              skipInvalid: true,
              flowLevel: -1,
              styles: {
                '!!str': 'plain'
              }
            });
          }
        }
      }
    });
    
    // 检查是否需要移动文件（分类或slug或扩展名发生变化）
    const categoryChanged = frontMatter.category !== existingPost.category;
    const slugChanged = newSlug !== existingPost.slug;
    
    if (categoryChanged || slugChanged || extChanged) {
      // 需要移动文件到新位置
      let targetYear = existingPost.year; // 默认保持原年份
      
      // 如果分类发生变化，使用 pubDatetime 确定目标年份
      if (categoryChanged) {
        if (frontMatter.pubDatetime) {
          targetYear = new Date(frontMatter.pubDatetime).getFullYear().toString();
        } else {
          // 如果没有 pubDatetime，保持原年份
          targetYear = existingPost.year;
        }
      }
      
      const newFilename = `${newSlug}${targetExt}`;
      const newFilePath = path.join(this.blogPath, frontMatter.category, targetYear, newFilename);
      
      // 确保新目录存在
      await fs.mkdir(path.dirname(newFilePath), { recursive: true });
      
      // 检查新文件路径是否已存在
      try {
        await fs.access(newFilePath);
        if (newFilePath !== oldFilePath) {
          throw new Error(`目标位置已存在同名文件，无法移动`);
        }
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
      
      // 写入新文件
      await fs.writeFile(newFilePath, fileContent, 'utf-8');
      
      // 删除旧文件（如果路径不同）
      if (newFilePath !== oldFilePath) {
        await fs.unlink(oldFilePath);
      }
      
      // 更新返回数据中的文件信息
      cleanedData.filename = newFilename;
      cleanedData.category = frontMatter.category;
      cleanedData.year = targetYear;
    } else {
      // 分类/slug/扩展名都没有变化，直接更新原文件
      await fs.writeFile(oldFilePath, fileContent, 'utf-8');
    }
    
    return cleanedData;
  }

  // 删除文章
  async deletePost(slug) {
    const post = await this.getPost(slug);
    if (!post) {
      throw new Error('文章不存在');
    }

    const filePath = path.join(this.blogPath, post.category, post.year, post.filename);
    await fs.unlink(filePath);
  }

  // 获取分类列表
  async getCategories() {
    const categories = [];
    for (const category of this.categories) {
      const categoryPath = path.join(this.blogPath, category);
      try {
        const stats = await fs.stat(categoryPath);
        if (stats.isDirectory()) {
          categories.push({
            name: category,
            displayName: this.getCategoryDisplayName(category)
          });
        }
      } catch (error) {
        // 目录不存在，跳过
      }
    }
    return categories;
  }

  // 获取标签列表
  async getTags() {
    const { posts } = await this.getPosts({ limit: 1000 });
    const tagSet = new Set();
    
    posts.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => tagSet.add(tag));
      }
    });
    
    return Array.from(tagSet).sort();
  }

  // 获取分类显示名称
  getCategoryDisplayName(category) {
    const displayNames = {
      life: '生活',
      sports: '运动',
      startup: '创业',
      technology: '技术'
    };
    return displayNames[category] || category;
  }
}