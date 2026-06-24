// ===== nav.js =====
// 全ページ共通のナビゲーションを動的に挿入する

const BASE = (function() {
  const m = window.location.pathname.match(/^(\/[^/]+\/)/);
  return m ? m[1] : '/';
})();

const NAV_LINKS = [
  { href: BASE + 'index.html',   label: 'Dashboard' },
  { href: BASE + 'input.html',   label: 'Record' },
  { href: BASE + 'records.html', label: 'History' },
  { href: BASE + 'graph.html',   label: 'Graph' },
  { href: BASE + 'pr.html',      label: 'PR' },
  { href: BASE + 'goals.html',   label: 'Goals' },
  { href: BASE + 'poster.html',  label: 'Poster' },
  { href: BASE + 'card.html',    label: 'Card' },
];

document.addEventListener('DOMContentLoaded', function() {
  const navEl = document.getElementById('nav');
  if (!navEl) return;

  const currentPath = window.location.pathname;

  const linksHTML = NAV_LINKS.map(function(link) {
    const isActive = currentPath.endsWith(link.href.replace('/', ''));
    return `<a href="${link.href}" class="${isActive ? 'active' : ''}">${link.label}</a>`;
  }).join('');

  // ブランド名 + リンク を挿入
  navEl.innerHTML = `
    <nav>
      <span class="nav-brand">G — GROWTH</span>
      ${linksHTML}
    </nav>
  `;
});
