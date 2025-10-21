import { getCollection } from "astro:content";

export interface BlogStats {
  runningDays: number;
  totalPosts: number;
  totalWords: number;
  totalWordsInWan: string;
}

export async function getBlogStats(): Promise<BlogStats> {
  const startDate = new Date('2018-08-31');
  const currentDate = new Date();
  
  const timeDiff = currentDate.getTime() - startDate.getTime();
  const runningDays = Math.floor(timeDiff / (1000 * 3600 * 24));
  
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  const totalPosts = posts.length;
  
  let totalWords = 0;
  
  posts.forEach(post => {
    const descriptionLength = post.data.description?.length || 0;
    const estimatedWords = descriptionLength * 15;
    totalWords += estimatedWords;
  });
  
  if (totalWords < posts.length * 1000) {
    totalWords = posts.length * 1500;
  }
  
  const totalWordsInWan = (totalWords / 10000).toFixed(1);
  
  return {
    runningDays,
    totalPosts,
    totalWords,
    totalWordsInWan
  };
}