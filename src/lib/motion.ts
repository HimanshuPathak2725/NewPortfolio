// Native scrolling stays in charge. These animations only polish the page.
export function initMotion() {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const seen = new WeakSet<Element>();
  const animations = new Set<Animation>();
  let observer: IntersectionObserver | undefined;

  function track(animation: Animation) {
    animations.add(animation);
    const remove = () => animations.delete(animation);
    animation.finished.then(remove, remove);
  }

  function stop() {
    observer?.disconnect();
    observer = undefined;
    animations.forEach((animation) => animation.cancel());
    animations.clear();
  }

  function start() {
    stop();
    if (preference.matches || !('IntersectionObserver' in window) || !('animate' in Element.prototype)) return;

    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || seen.has(entry.target)) return;
        seen.add(entry.target);
        observer?.unobserve(entry.target);

        if (entry.target.matches('.section-divider')) {
          const path = entry.target.querySelector<SVGPathElement>('path');
          if (!path) return;
          const length = path.getTotalLength();
          track(path.animate([
            { strokeDasharray: String(length), strokeDashoffset: String(length) },
            { strokeDasharray: String(length), strokeDashoffset: '0' },
          ], { duration: 450, easing: 'ease-out' }));
          return;
        }

        // Animate once, without hiding content before JavaScript runs.
        // Skip the initial viewport and restored scroll position to avoid a flash.
        if (entry.boundingClientRect.top < window.innerHeight - 40) return;
        track(entry.target.animate([
          { opacity: 0.8, transform: 'translateY(6px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ], { duration: 360, easing: 'cubic-bezier(0.2, 0.6, 0.3, 1)' }));
      });
    }, { threshold: 0, rootMargin: '0px 0px 24px 0px' });

    document.querySelectorAll(
      '.section-heading, .entry-list > li, .section-divider',
    ).forEach((element) => {
      if (!seen.has(element)) observer?.observe(element);
    });
  }

  start();
  preference.addEventListener('change', start);
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) start();
  });
}
