import { setView, setCurrentEditSlug, state } from './state.js';

export function initRouter({ onList, onNew, onEdit }) {
  const handle = (hash) => {
    if (!hash || hash === '#' || hash === '#/' || hash.startsWith('#/list')) {
      setView('list');
      onList?.();
      return;
    }
    if (hash.startsWith('#/new')) {
      setView('editor');
      setCurrentEditSlug(null);
      onNew?.();
      return;
    }
    const editMatch = hash.match(/^#\/edit\/(.+)$/);
    if (editMatch) {
      setView('editor');
      setCurrentEditSlug(decodeURIComponent(editMatch[1]));
      onEdit?.(state.currentEditSlug);
      return;
    }
    setView('list');
    onList?.();
  };

  window.addEventListener('hashchange', () => handle(location.hash));
  handle(location.hash);
}