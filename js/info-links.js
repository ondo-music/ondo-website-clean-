(function () {
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var links = document.querySelectorAll('.info-motion-link');
  if (!links.length) return;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1 });

  links.forEach(function (link) {
    link.classList.add('is-pending');
    link.addEventListener('focus', function () {
      link.classList.add('is-visible');
      observer.unobserve(link);
    }, { once: true });
    observer.observe(link);
  });
})();
