(() => {
  const gallery = document.querySelector('[data-work-gallery]');
  const dialog = document.querySelector('[data-work-dialog]');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (gallery && dialog && typeof dialog.showModal === 'function') {
    const content = dialog.querySelector('[data-work-content]');
    const cache = new Map();
    const initialTitle = document.title;
    const stateKey = 'ondoWorkOverlay';
    let sourceLink = null;
    let transitioning = false;
    let pendingClose = false;
    let oldOverflow = '';

    const fly = async (from, to, src) => {
      if (reduced.matches || !from.width || !to.width) return;
      const image = new Image();
      image.src = src;
      image.alt = '';
      image.setAttribute('aria-hidden', 'true');
      Object.assign(image.style, {
        position: 'fixed', left: `${from.x}px`, top: `${from.y}px`,
        width: `${from.width}px`, height: `${from.height}px`,
        zIndex: '100', pointerEvents: 'none', objectFit: 'cover', transformOrigin: 'top left'
      });
      dialog.append(image);
      try {
        await image.animate([
          { transform: 'translate(0,0) scale(1)' },
          { offset: .7, transform: `translate(${(to.x - from.x) * .97}px,${(to.y - from.y) * .97 - 6}px) scale(${to.width / from.width * 1.015})` },
          { transform: `translate(${to.x - from.x}px,${to.y - from.y}px) scale(${to.width / from.width})` }
        ], { duration: 650, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' }).finished;
      } catch (_) {
        // Closing a page or changing motion preferences can cancel an animation.
      } finally { image.remove(); }
    };

    const closeVisual = async () => {
      if (transitioning) { pendingClose = true; return; }
      if (!dialog.open) return;
      transitioning = true;
      const art = content.querySelector('.work-detail__cover img');
      const original = sourceLink?.querySelector('img');
      if (art && original) {
        const destination = original.getBoundingClientRect();
        if (destination.bottom > 0 && destination.top < innerHeight) {
          const start = art.getBoundingClientRect();
          art.style.opacity = '0';
          await fly(start, destination, art.src);
        }
      }
      dialog.close();
      document.body.style.overflow = oldOverflow;
      content.replaceChildren();
      document.title = initialTitle;
      sourceLink?.focus({ preventScroll: true });
      transitioning = false;
      pendingClose = false;
    };

    const requestClose = () => {
      if (transitioning) { pendingClose = true; return; }
      if (history.state?.[stateKey]) history.back();
      else closeVisual();
    };

    const open = async (link, pushHistory = true) => {
      if (transitioning || dialog.open) return;
      transitioning = true;
      pendingClose = false;
      link.setAttribute('aria-busy', 'true');
      try {
        let article = cache.get(link.href);
        if (!article) {
          const response = await fetch(link.href);
          if (!response.ok) throw new Error('Work detail unavailable');
          const parsed = new DOMParser().parseFromString(await response.text(), 'text/html');
          article = parsed.querySelector('.work-detail');
          if (!article) throw new Error('Work detail missing');
          cache.set(link.href, article);
        }
        const detail = article.cloneNode(true);
        const title = detail.querySelector('h1');
        title.id = 'media-dialog-title';
        content.replaceChildren(detail);
        const art = detail.querySelector('.work-detail__cover img');
        await art.decode().catch(() => {});
        const original = link.querySelector('img');
        const start = original.getBoundingClientRect();
        sourceLink = link;
        oldOverflow = document.body.style.overflow;
        dialog.showModal();
        document.body.style.overflow = 'hidden';
        document.title = `${title.textContent} | ondo`;
        if (pushHistory) history.pushState({ ...history.state, [stateKey]: link.href }, '', link.href);
        art.style.opacity = '0';
        const copy = detail.querySelector('.work-detail__content');
        if (!reduced.matches) copy.animate([
          { opacity: 0, transform: 'translateY(12px)' },
          { opacity: 1, transform: 'none' }
        ], { duration: 650, delay: 140, fill: 'both', easing: 'cubic-bezier(.22,1,.36,1)' });
        await fly(start, art.getBoundingClientRect(), original.src);
        art.style.opacity = '1';
      } catch (_) {
        window.location.assign(link.href);
      } finally {
        link.removeAttribute('aria-busy');
        transitioning = false;
        if (pendingClose) requestClose();
      }
    };

    gallery.addEventListener('click', event => {
      const link = event.target.closest('.media-work');
      if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      open(link);
    });
    dialog.querySelector('[data-work-close]').addEventListener('click', requestClose);
    dialog.addEventListener('cancel', event => { event.preventDefault(); requestClose(); });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) requestClose();
    });
    window.addEventListener('popstate', () => {
      const workURL = history.state?.[stateKey];
      if (workURL) {
        const link = Array.from(gallery.querySelectorAll('.media-work')).find(item => item.href === workURL);
        if (link) open(link, false);
      } else closeVisual();
    });
  }

  const videos = document.querySelector('[data-video-gallery]');
  if (videos) {
    let active = null;
    const restore = () => {
      if (!active) return;
      active.media.replaceChildren(active.poster);
      active.close.hidden = true;
      active = null;
    };
    videos.addEventListener('click', event => {
      const stop = event.target.closest('[data-video-stop]');
      if (stop) { const card = stop.closest('.media-video'); restore(); card.querySelector('[data-video-play]')?.focus(); return; }
      const link = event.target.closest('[data-video-play]');
      if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const url = new URL(link.href);
      const id = url.hostname === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v');
      if (!id || !/^[\w-]{11}$/.test(id)) return;
      event.preventDefault();
      restore();
      const card = link.closest('.media-video');
      const frame = document.createElement('iframe');
      frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      frame.title = card.querySelector('h2').textContent;
      frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      frame.allowFullscreen = true;
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      const media = card.querySelector('.media-video__media');
      const close = card.querySelector('[data-video-stop]');
      active = { media, poster: link, close };
      media.replaceChildren(frame);
      close.hidden = false;
      close.focus({ preventScroll: true });
    });
    window.addEventListener('pagehide', restore);
  }
})();
