// ===== nav.js =====
// 全ページ共通のナビゲーションを動的に挿入する

const NAV_LINKS = [
  { href: '/index.html',   label: 'Dashboard' },
  { href: '/input.html',   label: 'Record' },
  { href: '/records.html', label: 'History' },
  { href: '/graph.html',   label: 'Graph' },
  { href: '/pr.html',      label: 'PR' },
  { href: '/goals.html',   label: 'Goals' },
  { href: '/poster.html',  label: 'Poster' },
  { href: '/card.html',    label: 'Card' },
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
