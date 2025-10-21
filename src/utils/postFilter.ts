import type { CollectionEntry } from "astro:content";
import { SITE } from "@/config";

const postFilter = ({ data }: CollectionEntry<"blog">) => {
  const isPublishTimePassed =
    Date.now() >
    new Date(data.pubDatetime).getTime() - SITE.scheduledPostMargin;
  
  // 开发环境下显示所有文章（包括草稿）
  if (import.meta.env.DEV) {
    return true;
  }
  
  return !data.draft && isPublishTimePassed;
};

export default postFilter;