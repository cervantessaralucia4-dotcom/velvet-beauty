// ============================================================
//  VELVET BEAUTY — App principal (frontend/js/app.js)
//  Inicializa la tienda, renderiza productos desde la API
// ============================================================

import { ProductosAPI, CuponesAPI, PedidosAPI, UploadAPI, MarcasAPI } from './api.js';
import { Cart, Wishlist, CouponState } from './store.js';

// ── Helpers UI ────────────────────────────────────────────────
const $ = id => document.getElementById(id);

function fmt(n) {
  return '$' + Number(n).toLocaleString('es-CO');
}

function toast(msg, type = 'success') {
  const t = $('toast');
  const icon = type === 'error' ? '✕' : '✦';
  t.querySelector('.toast-icon').textContent = icon;
  $('toast-msg').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

function skeleton(n = 4) {
  return Array(n).fill(`
    <div style="background:var(--white);border-radius:12px;overflow:hidden;box-shadow:var(--shadow)">
      <div style="aspect-ratio:3/4;background:linear-gradient(90deg,var(--blush) 25%,var(--nude) 50%,var(--blush) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite"></div>
      <div style="padding:1rem">
        <div style="height:10px;background:var(--blush);border-radius:4px;margin-bottom:8px;width:50%"></div>
        <div style="height:14px;background:var(--blush);border-radius:4px;margin-bottom:8px"></div>
        <div style="height:12px;background:var(--blush);border-radius:4px;width:40%"></div>
      </div>
    </div>`).join('');
}

// ── Render tarjeta de producto ────────────────────────────────
function renderCard(prod) {
  const inWish   = Wishlist.has(prod.id);
  const discount = prod.precio_original
    ? Math.round((1 - prod.precio / prod.precio_original) * 100)
    : 0;
  const etiquetas = Array.isArray(prod.etiquetas) ? prod.etiquetas : [];
  const badge     = etiquetas[0] || '';

  return `
  <div class="prod-card" data-id="${prod.id}">
    <div class="prod-img">
      ${prod.imagen
        ? `<img src="/uploads/productos/${prod.imagen}" alt="${prod.nombre}" loading="lazy" style="width:100%;aspect-ratio:3/4;object-fit:cover;display:block">`
        : `<div class="product-visual ${prod.categoria_slug === 'makeup' ? 'pv1' : prod.categoria_slug === 'skincare' ? 'pv3' : 'pv4'}" style="width:100%;aspect-ratio:3/4;display:flex;align-items:center;justify-content:center;font-size:3rem;opacity:.3">${prod.categoria_slug === 'makeup' ? '💄' : prod.categoria_slug === 'skincare' ? '🧴' : '✨'}</div>`}
      ${badge ? `<div class="prod-badge">${badge}</div>` : ''}
      ${discount ? `<div class="prod-badge" style="top:auto;bottom:48px;background:var(--charcoal)">-${discount}%</div>` : ''}
      <button class="prod-wish ${inWish ? 'active' : ''}" data-wish="${prod.id}">
        ${inWish ? '♥' : '♡'}
      </button>
      <div class="prod-actions">
        <button class="btn-primary" data-add="${prod.id}" style="flex:1;padding:8px;font-size:.75rem">+ Al carrito</button>
        <button class="btn-outline" data-quick="${prod.id}" style="padding:8px 12px;font-size:.75rem;color:white;border-color:rgba(255,255,255,.4)">Vista rápida</button>
      </div>
    </div>
    <div class="prod-info" data-detail="${prod.id}" style="cursor:pointer">
      <div class="prod-brand">${prod.marca_nombre}</div>
      <div class="prod-name">${prod.nombre}</div>
      <div class="prod-stars">★★★★★ <span style="color:var(--warm-gray);font-size:.75rem">(${Number(prod.num_resenas).toLocaleString()})</span></div>
      <div>
        <span class="prod-price">${fmt(prod.precio)}</span>
        ${prod.precio_original ? `<span class="prod-price-old">${fmt(prod.precio_original)}</span>` : ''}
      </div>
    </div>
  </div>`;
}

// ── Carrito badge ─────────────────────────────────────────────
function updateCartBadge() {
  const badge = $('cart-badge');
  const count = Cart.count;
  badge.style.display = count > 0 ? 'flex' : 'none';
  badge.textContent   = count;
}

// ── Render drawer carrito ─────────────────────────────────────
function renderCartDrawer() {
  const items = Cart.get();
  const list  = $('cart-items-list');
  const foot  = $('cart-foot');

  if (items.length === 0) {
    list.innerHTML = `<div class="cart-empty">
      <div class="cart-empty-icon">🛍</div>
      <p>Tu bolsa está vacía</p>
      <small>Añade productos que te enamoren</small>
      <br><br>
      <button class="btn-primary" onclick="closeCart();showPage('shop')" style="margin-top:1rem">Explorar tienda</button>
    </div>`;
    foot.innerHTML = '';
    return;
  }

  list.innerHTML = items.map(item => `
    <div class="cart-item">
      <div class="cart-item-img">
        ${item.imagen
          ? `<img src="/uploads/productos/${item.imagen}" alt="${item.nombre}" style="width:72px;height:90px;object-fit:cover;border-radius:8px">`
          : `<div style="width:72px;height:90px;border-radius:8px;background:var(--blush);display:flex;align-items:center;justify-content:center;font-size:1.5rem;opacity:.4">✦</div>`}
      </div>
      <div>
        <div class="cart-item-brand">${item.marca}</div>
        <div class="cart-item-name">${item.nombre}</div>
        <div class="cart-item-qty">
          <button class="ciq" data-cart-qty="${item.producto_id}" data-delta="-1">−</button>
          <span style="font-size:.9rem;font-weight:500">${item.cantidad}</span>
          <button class="ciq" data-cart-qty="${item.producto_id}" data-delta="1">+</button>
          <button class="ciq" data-cart-remove="${item.producto_id}" style="margin-left:8px;color:var(--warm-gray)">🗑</button>
        </div>
      </div>
      <div class="cart-item-price">${fmt(item.precio * item.cantidad)}</div>
    </div>`).join('');

  const coupon   = CouponState.get();
  const subtotal = Cart.subtotal;
  const disc     = CouponState.calcDescuento(subtotal);

  foot.innerHTML = `
    <div class="coupon-row">
      <input class="coupon-input" id="cart-coupon-input" type="text" placeholder="Código de descuento" value="${coupon ? coupon.codigo : ''}">
      <button class="coupon-btn" id="cart-apply-coupon">Aplicar</button>
    </div>
    ${coupon ? `<div class="coupon-ok">✓ ${coupon.codigo} — ahorras ${fmt(disc)}</div>` : ''}
    <div class="subtotal-row"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
    <div class="subtotal-row"><span>Envío</span><span style="color:var(--deep-rose)">Gratis ✓</span></div>
    ${disc ? `<div class="subtotal-row"><span>Descuento</span><span style="color:var(--deep-rose)">−${fmt(disc)}</span></div>` : ''}
    <div class="total-row"><span>Total</span><span>${fmt(subtotal - disc)}</span></div>
    <button class="btn-primary" id="cart-checkout-btn" style="width:100%;padding:14px;font-size:.88rem">Finalizar compra →</button>
  `;

  // Eventos del drawer
  foot.querySelector('#cart-apply-coupon')?.addEventListener('click', async () => {
    const code = $('cart-coupon-input').value.trim().toUpperCase();
    if (!code) return;
    try {
      const res = await CuponesAPI.validar(code);
      CouponState.set({ ...res.data, codigo: code });
      toast(`✦ Cupón ${code} aplicado`);
      renderCartDrawer();
    } catch (e) {
      CouponState.clear();
      toast(e.message, 'error');
    }
  });

  foot.querySelector('#cart-checkout-btn')?.addEventListener('click', () => {
    closeCart();
    showPage('checkout');
  });
}

// Delegación de eventos en el drawer
document.getElementById('cart-items-list')?.addEventListener('click', e => {
  const qtyBtn = e.target.closest('[data-cart-qty]');
  const remBtn = e.target.closest('[data-cart-remove]');
  if (qtyBtn) {
    Cart.updateQty(parseInt(qtyBtn.dataset.cartQty), Cart.get().find(i => i.producto_id === parseInt(qtyBtn.dataset.cartQty))?.cantidad + parseInt(qtyBtn.dataset.delta));
    renderCartDrawer();
  }
  if (remBtn) {
    Cart.remove(parseInt(remBtn.dataset.cartRemove));
    renderCartDrawer();
  }
});

// Eventos globales de la grilla de productos (delegación)
document.addEventListener('click', e => {
  const addBtn   = e.target.closest('[data-add]');
  const wishBtn  = e.target.closest('[data-wish]');
  const quickBtn = e.target.closest('[data-quick]');
  const detBtn   = e.target.closest('[data-detail]');

  if (addBtn) {
    const id = parseInt(addBtn.dataset.add);
    // Buscar producto en caché
    const prod = window._productsCache?.find(p => p.id === id);
    if (prod) { Cart.add(prod); toast(`✦ ${prod.nombre} añadida`); }
    return;
  }

  if (wishBtn) {
    const id    = parseInt(wishBtn.dataset.wish);
    const added = Wishlist.toggle(id);
    wishBtn.textContent = added ? '♥' : '♡';
    wishBtn.classList.toggle('active', added);
    toast(added ? '♡ Añadida a favoritas' : 'Eliminada de favoritas');
    return;
  }

  if (quickBtn) {
    openQuickView(parseInt(quickBtn.dataset.quick));
    return;
  }

  if (detBtn) {
    showDetail(parseInt(detBtn.dataset.detail));
  }
});

// Escuchar carrito actualizado
document.addEventListener('cart:updated', updateCartBadge);

// ── Cargar productos destacados (Home) ─────────────────────────
async function loadFeatured() {
  const el = $('featured-products');
  if (!el) return;
  el.innerHTML = skeleton(4);
  try {
    const res = await ProductosAPI.listar({ destacado: 1, limit: 4 });
    const prods = res.data || [];
    window._productsCache = [...(window._productsCache || []), ...prods];
    el.innerHTML = prods.map(renderCard).join('') || '<p style="color:var(--warm-gray)">Sin productos destacados</p>';
  } catch (e) {
    el.innerHTML = '<p style="color:var(--warm-gray)">No se pudieron cargar los productos</p>';
  }
}

// ── Cargar novedades (Home) ────────────────────────────────────
async function loadNewArrivals() {
  const el = $('new-products');
  if (!el) return;
  el.innerHTML = skeleton(4);
  try {
    const res = await ProductosAPI.listar({ orden: 'nuevo', limit: 4 });
    const prods = res.data || [];
    window._productsCache = [...(window._productsCache || []), ...prods];
    el.innerHTML = prods.map(renderCard).join('');
  } catch (e) { el.innerHTML = ''; }
}

// ── Cargar marcas ─────────────────────────────────────────────
async function loadBrands() {
  const el = $('brands-strip');
  if (!el) return;
  try {
    const marcas = await MarcasAPI.listar();
    el.innerHTML = marcas.slice(0, 8).map(m =>
      `<span class="brand-item">${m.nombre}</span>`
    ).join('');
  } catch {}
}

// ── Inicializar la app ────────────────────────────────────────
async function init() {
  updateCartBadge();
  await Promise.all([loadFeatured(), loadNewArrivals(), loadBrands()]);
}

// Exportar funciones que necesita el HTML
window.openCart     = () => { renderCartDrawer(); $('cart-overlay').classList.add('open'); $('cart-drawer').classList.add('open'); };
window.closeCart    = () => { $('cart-overlay').classList.remove('open'); $('cart-drawer').classList.remove('open'); };
window.renderCartDrawer = renderCartDrawer;
window.updateCartBadge  = updateCartBadge;
window.toast            = toast;
window.fmt              = fmt;
window.renderCard       = renderCard;
window.loadFeatured     = loadFeatured;

init();
