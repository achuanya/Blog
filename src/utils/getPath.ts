import { BLOG_PATH } from "@/content.config";
import { slugifyStr } from "./slugify";

export function getSlugFromPath(
  id: string,
  _filePath?: string | undefined
) {
  const blogId = id.split("/");
  const slug = blogId.length > 0 ? blogId.slice(-1)[0] : id;
  return slug;
}

export function getPath(
  id: string,
  filePath: string | undefined,
  includeBase = true,
  useSimpleUrl = true,
  customPrefix?: string,
  addTrailingSlash = true
) {
  if (useSimpleUrl && !customPrefix) {
    const slug = getSlugFromPath(id, filePath);
    return addTrailingSlash ? `/${slug}/` : `/${slug}`;
  }

  if (customPrefix) {
    const slug = getSlugFromPath(id, filePath);
    return addTrailingSlash ? `${customPrefix}/${slug}/` : `${customPrefix}/${slug}`;
  }

  const pathSegments = filePath
    ?.replace(BLOG_PATH, "")
    .split("/")
    .filter(path => path !== "")
    .filter(path => !path.startsWith("_"))
    .slice(0, -1)
    .map(segment => slugifyStr(segment));

  const basePath = includeBase ? "/posts" : "";

  const blogId = id.split("/");
  const slug = blogId.length > 0 ? blogId.slice(-1) : blogId;

  if (!pathSegments || pathSegments.length < 1) {
    const path = [basePath, slug].join("/");
    return addTrailingSlash ? path + "/" : path;
  }

  const path = [basePath, ...pathSegments, slug].join("/");
  return addTrailingSlash ? path + "/" : path;
}