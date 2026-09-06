(function () {
  var panel = document.getElementById('inner-navigation');
  var trigger = document.querySelector('[data-inner-menu-open]');
  if (!panel || !trigger) return;
  var closeButton = panel.querySelector('[data-inner-menu-close]');
  var media = window.matchMedia('(max-width: 768px)');
  var opened = false;
  var timer;
  var scrollY = 0;
  var previousStyle;
  var siblings = [];
  function close(restoreFocus) {
    if (!opened) return;
    opened = false;
    panel.classList.remove('is-open');
    panel.inert = true;
    trigger.setAttribute('aria-expanded', 'false');
    siblings.forEach(function (item) { item.element.inert = item.inert; });
    if (previousStyle === null) document.body.removeAttribute('style');
    else document.body.setAttribute('style', previousStyle);
    window.scrollTo(0, scrollY);
    if (restoreFocus) trigger.focus({preventScroll: true});
    timer = window.setTimeout(function () { panel.hidden = true; }, 180);
  }
  trigger.addEventListener('click', function () {
    if (!media.matches || opened) return;
    clearTimeout(timer);
    opened = true;
    scrollY = window.scrollY;
    previousStyle = document.body.getAttribute('style');
    document.body.style.position = 'fixed';
    document.body.style.top = -scrollY + 'px';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    siblings = Array.from(document.body.children).filter(function (el) {
      return el !== panel && !['SCRIPT', 'STYLE', 'SVG'].includes(el.tagName);
    }).map(function (el) { var entry = {element: el, inert: el.inert}; el.inert = true; return entry; });
    panel.hidden = false;
    panel.inert = false;
    trigger.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(function () {
      if (!opened) return;
      panel.classList.add('is-open');
      closeButton.focus({preventScroll: true});
    });
  });
  closeButton.addEventListener('click', function () { close(true); });
  panel.addEventListener('click', function (event) { if (event.target.closest('a')) close(false); });
  document.addEventListener('keydown', function (event) {
    if (!opened) return;
    if (event.key === 'Escape') { event.preventDefault(); close(true); }
    if (event.key === 'Tab') {
      var links = Array.from(panel.querySelectorAll('a[href], button'));
      var first = links[0], last = links[links.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  media.addEventListener('change', function () { if (!media.matches) close(true); });
  window.addEventListener('pagehide', function () { close(false); });
})();
