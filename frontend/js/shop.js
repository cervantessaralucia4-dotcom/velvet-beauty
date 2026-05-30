// ============================================================
//  VELVET BEAUTY — Página Shop (frontend/js/shop.js)
// ============================================================

import { ProductosAPI, CategoriasAPI, MarcasAPI } from './api.js';
import { Cart, Wishlist } from './store.js';

const $ = id => document.getElementById(id);

let currentFilters = {
  categoria: '',
  marca:     '',
  precio_max: 400000,
  q:         '',
  orden:     'default',
  page:      1,
};

export async function initShop(catSlug = '') {
  if (catSlug) currentFilters.categoria = catSlug;
  await Promise.all([loadBrandFilters(), loadProducts()]);
}

async function loadBrandFilters() {
  try {
    const marcas = await MarcasAPI.listar();
    const container = $('brand-filters');
    if (!container) return;
    container.innerHTML = marcas.map(m => `
      <div class="filter-check">
        <input type="checkbox" class="brand-filter" data-slug="${m.slug}" id="fm-${m.id}">
        <span>${m.nombre}</span>
      </div>`).join('');

    container.querySelectorAll('.brand-filter').forEach(cb =>
      cb.addEventListener('change', loadProducts)
    );
  } catch {}
}

export async function loadProducts() {
  const grid = $('shop-products');
  const countEl = $('shop-count');
  if (!grid) return;

  // Leer filtros del DOM
  const cats = ['makeup','skincare','haircare'].filter(c => $('f-' + c)?.checked);
  currentFilters.categoria = cats.length === 1 ? cats[0] : (cats.length > 1 ? cats.join(',') : '');

  const brands = [...document.querySelectorAll('.brand-filter:checked')].map(b => b.dataset.slug);
  currentFilters.marca = brands.join(',');

  currentFilters.precio_max = parseInt($('price-filter')?.value || 400000);
  currentFilters.q          = $('search-input')?.value.trim() || '';
  currentFilters.orden      = $('sort-select')?.value || 'default';

  grid.innerHTML = `<div style="grid-column:1/-1;display:grid;grid-template-columns:repeat(4,1fr);gap:1.5rem">${skeleton(8)}</div>`;

  try {
    const params = {
      limit: 12,
      page:  currentFilters.page,
      orden: currentFilters.orden,
    };
    if (currentFilters.categoria) params.categoria = currentFilters.categoria;
    if (currentFilters.marca)     params.marca     = currentFilters.marca;
    if (currentFilters.precio_max < 400000) params.precio_max = currentFilters.precio_max;
    if (currentFilters.q)         params.q         = currentFilters.q;

    const res    = await ProductosAPI.listar(params);
    const prods  = res.data || [];

    window._productsCache = [...(window._productsCache || []), ...prods];

    if (countEl) countEl.textContent = `${res.total || prods.length} productos encontrados`;

    grid.innerHTML = prods.length
      ? prods.map(p => window.renderCard(p)).join('')
      : `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--warm-gray)">
           <div style="font-size:2.5rem;margin-bottom:1rem;opacity:.3">🔍</div>
           <p style="font-family:var(--ff-serif);font-size:1.2rem">Sin resultados</p>
           <p style="font-size:.85rem;margin-top:.5rem">Prueba con otros filtros</p>
         </div>`;
  } catch (e) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--warm-gray)">Error al cargar productos: ${e.message}</div>`;
  }
}

function skeleton(n) {
  return Array(n).fill(`
    <div style="background:var(--white);border-radius:12px;overflow:hidden">
      <div style="aspect-ratio:3/4;background:linear-gradient(90deg,var(--blush) 25%,var(--nude) 50%,var(--blush) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite"></div>
      <div style="padding:1rem"><div style="height:10px;background:var(--blush);border-radius:4px;margin-bottom:8px;width:50%"></div><div style="height:14px;background:var(--blush);border-radius:4px"></div></div>
    </div>`).join('');
}

// Exposición global para el HTML
window.applyFilters      = loadProducts;
window.updatePriceLabel  = () => {
  const v = parseInt($('price-filter')?.value || 400000);
  const el = $('price-label');
  if (el) el.textContent = window.fmt(v);
};
