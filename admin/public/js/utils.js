// Utility helpers
export function formatDate(dateStr) {
  const d = new Date((dateStr || '').replace(' ', 'T'));
  const dd = d.getDate().toString().padStart(2, '0');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const mmm = months[d.getMonth() || 0];
  const yyyy = d.getFullYear();
  return `${dd} ${mmm}, ${yyyy}`;
}

export function resolveOgImage(ogImage, slug, siteBase = 'https://lhasa.icu') {
  if (!ogImage) return `${siteBase}/${slug}.png`;
  if (typeof ogImage === 'string') return ogImage;
  if (Array.isArray(ogImage) && ogImage.length > 0) return resolveOgImage(ogImage[0], slug, siteBase);
  if (typeof ogImage === 'object' && ogImage.src) return ogImage.src;
  return `${siteBase}/${slug}.png`;
}

export function escapeHtml(s = '') {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}