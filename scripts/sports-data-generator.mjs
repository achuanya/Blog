// 运动文章数据生成器 - 独立ES模块版本
// 用于在构建时生成运动文章数据JSON文件

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const BLOG_PATH = path.join(__dirname, '../src/data/blog');
const OUTPUT_DIR = path.join(__dirname, '../public/data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'sports-articles.json');

/**
 * 提取图片URL
 * @param {string} content - 文章内容
 * @returns {string|null} - 第一张图片的URL
 */
function extractFirstImage(content) {
  // 匹配 <Img src="..." /> 组件
  const imgComponentMatch = content.match(/<Img\s+src="([^"]+)"/);
  if (imgComponentMatch) {
    return imgComponentMatch[1];
  }
  
  // 匹配标准 markdown 图片语法 ![alt](url)
  const markdownImgMatch = content.match(/!\[[^\]]*\]\(([^)]+)\)/);
  if (markdownImgMatch) {
    return markdownImgMatch[1];
  }
  
  // 匹配 HTML img 标签
  const htmlImgMatch = content.match(/<img[^>]+src="([^"]+)"/);
  if (htmlImgMatch) {
    return htmlImgMatch[1];
  }
  
  return null;
}

/**
 * 生成文章URL
 * @param {string} slug - 文章slug
 * @returns {string} - 文章完整URL
 */
function generateArticleUrl(slug) {
  return `https://lhasa.icu/${slug}/`;
}

/**
 * 处理图片URL，确保是完整的URL
 * @param {string} imageUrl - 原始图片URL
 * @param {string} ogImage - frontmatter中的ogImage
 * @returns {string|null} - 处理后的图片URL
 */
function processImageUrl(imageUrl, ogImage) {
  // 优先使用ogImage
  if (ogImage) {
    return ogImage;
  }
  
  if (!imageUrl) {
    return null;
  }
  
  // 如果是相对路径，转换为绝对路径
  if (!imageUrl.startsWith('http') && !imageUrl.startsWith('//')) {
    // 假设图片存储在CDN上，根据实际情况调整
    return `https://cos.lhasa.icu/ArticlePictures/${imageUrl}`;
  }
  
  return imageUrl;
}

/**
 * 从文件路径提取slug
 * @param {string} filePath - 文件路径
 * @returns {string} - slug
 */
function extractSlugFromPath(filePath) {
  const fileName = path.basename(filePath, path.extname(filePath));
  return fileName;
}

/**
 * 主函数：搜集运动文章数据
 */
async function generateSportsData() {
  try {
    console.log("开始搜集运动文章数据...");
    
    // 查找所有运动分类的文章文件
    const sportsPattern = path.join(BLOG_PATH, 'sports/**/*.{md,mdx}').replace(/\\/g, '/');
    const sportsFiles = glob.sync(sportsPattern);
    
    console.log(`找到 ${sportsFiles.length} 个运动文章文件`);
    
    const sportsData = [];
    
    // 处理每个文件
    for (const filePath of sportsFiles) {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const { data: frontmatter, content } = matter(fileContent);
        
        // 跳过草稿
        if (frontmatter.draft) {
          continue;
        }
        
        // 确保是运动分类
        if (frontmatter.category !== 'sports') {
          continue;
        }
        
        // 提取slug
        const slug = frontmatter.slug || extractSlugFromPath(filePath);
        
        // 提取第一张图片
        const firstImage = extractFirstImage(content);
        
        // 处理图片URL
        const imageUrl = processImageUrl(firstImage, frontmatter.ogImage);
        
        // 处理日期
        const pubDate = new Date(frontmatter.pubDatetime);
        const modDate = frontmatter.modDatetime ? new Date(frontmatter.modDatetime) : null;
        
        sportsData.push({
           // 文章日期
           date: pubDate.toISOString().split('T')[0],
           // 文章标题
           title: frontmatter.title,
           // 文章配图
           image: imageUrl,
           // 文章URL
           url: generateArticleUrl(slug),
           // 额外信息
           slug: slug,
           description: frontmatter.description || ''
         });
      
    } catch (error) {
      console.warn(`处理文件 ${filePath} 时出错:`, error.message);
    }
  }
  
  // 按日期排序（最新的在前）
  sportsData.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // 创建输出目录
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // 删除旧文件（如果存在）
  if (fs.existsSync(OUTPUT_FILE)) {
    fs.unlinkSync(OUTPUT_FILE);
    console.log("删除旧的数据文件");
  }
  
  // 生成JSON数据
  const jsonData = {
    generated: new Date().toISOString(),
    total: sportsData.length,
    articles: sportsData
  };
  
  // 写入文件
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(jsonData, null, 2), 'utf-8');
  
  console.log(`运动文章数据已生成: ${OUTPUT_FILE}`);
  console.log(`共处理 ${sportsData.length} 篇文章`);
  
  // 输出统计信息
  const withImages = sportsData.filter(article => article.image).length;
  const featuredCount = sportsData.filter(article => article.featured).length;
  
  console.log(`有配图的文章: ${withImages}/${sportsData.length}`);
  console.log(`精选文章: ${featuredCount}/${sportsData.length}`);
  
  return jsonData;
  
} catch (error) {
  console.error("生成运动文章数据时出错:", error);
  throw error;
}
}

// 执行脚本
generateSportsData()
  .then(() => {
    console.log("运动文章数据生成完成！");
    process.exit(0);
  })
  .catch((error) => {
    console.error("脚本执行失败:", error);
    process.exit(1);
  });