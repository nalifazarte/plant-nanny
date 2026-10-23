// Pause animation outside the viewport, in background tabs, and for reduced motion.
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const regions = new Set();
let enabled = true, celebrationTimer;
const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  for (const entry of entries) entry.target.classList.toggle('is-in-view', entry.isIntersecting);
}, { rootMargin: '20px' }) : null;
function updatePause() {
  document.documentElement.classList.toggle('motion-paused', !enabled || reduced.matches || document.hidden);
}
export function syncMotion(options) {
  if (options) enabled = options.enabled !== false;
  updatePause();
  for (const region of regions) {
    if (!region.isConnected) { observer?.unobserve(region); regions.delete(region); }
  }
  for (const region of document.querySelectorAll('.plant-scene, .garden-thumb, .custom-preview, .empty-garden')) {
    if (regions.has(region)) continue;
    regions.add(region);
    if (observer) observer.observe(region); else region.classList.add('is-in-view');
  }
}
export function celebrateWater() {
  if (!enabled || reduced.matches || document.hidden) return;
  const region = document.querySelector('.plant-scene');
  if (!region) return;
  clearTimeout(celebrationTimer);
  region.classList.remove('is-watered');
  requestAnimationFrame(() => {
    if (!region.isConnected) return;
    region.classList.add('is-watered');
    celebrationTimer = setTimeout(() => region.classList.remove('is-watered'), 1500);
  });
}
document.addEventListener('visibilitychange', updatePause);
if (reduced.addEventListener) reduced.addEventListener('change', updatePause);
else reduced.addListener(updatePause);
