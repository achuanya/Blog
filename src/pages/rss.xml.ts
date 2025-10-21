import rss from "@astrojs/rss";
import { getCollection, render } from "astro:content";
import { getPath } from "@/utils/getPath";
import getSortedPosts from "@/utils/getSortedPosts";
import { SITE } from "@/config";

import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { getContainerRenderer as getMDXRenderer } from "@astrojs/mdx";
import { loadRenderers } from "astro:container";

export async function GET(context: any) {
  const posts = await getCollection("blog");
  const sortedPosts = getSortedPosts(posts);

  const renderers = await loadRenderers([getMDXRenderer()]);
  const container = await AstroContainer.create({ renderers });

  const items = [];
  for (const post of sortedPosts) {
    const { Content } = await render(post);
    let content = await container.renderToString(Content);
    
    if (content) {
      content = content.replace(/<figcaption[^>]*class="[^"]*img-caption[^"]*"[^>]*>.*?<\/figcaption>/gs, '');
      content = content.replace(/<div[^>]*class="[^"]*exif-tooltip[^"]*"[^>]*>.*?<\/div>/gs, '');
      content = content.replace(/<figure[^>]*class="[^"]*img-container[^"]*"[^>]*>\s*<div[^>]*class="[^"]*img-wrapper[^"]*"[^>]*>\s*<img[^>]*>\s*<\/div>\s*<\/figure>/gs, 
        (match) => {
          const imgMatch = match.match(/<img[^>]*>/g);
          return imgMatch ? imgMatch[0] : '';
        });
    }
    
    items.push({
      title: post.data.title,
      link: SITE.website.replace(/\/$/, "") + getPath(post.id, post.filePath),
      description: post.data.description,
      pubDate: new Date(post.data.modDatetime ?? post.data.pubDatetime),
      ...(content ? { content } : {}),
    });
  }

  const logo = `
  <image>
    <url>${SITE.logo}</url>
    <title>${SITE.title}</title>
    <link>${SITE.website}</link>
  </image>`;

  return rss({
    title: SITE.title,
    description: SITE.desc,
    site: SITE.website,
    items,
    customData: `<language>${SITE.lang || "zh-CN"}</language>\n${logo}`,
  });
}