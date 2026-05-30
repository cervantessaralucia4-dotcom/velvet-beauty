// ============================================================
//  VELVET BEAUTY — Checkout (frontend/js/checkout.js)
// ============================================================

import { PedidosAPI, CuponesAPI, UploadAPI } from './api.js';
import { Cart, CouponState } from './store.js';

const $ = id => document.getElementById(id);
let selectedPayment = 'Nequi';
let uploadedFile    = null;

export function initCheckout() {
  renderOrderSummary();

  $('co-coupon')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') validateCoupon();
  });
}

function renderOrderSummary() {
  const items    = Cart.get();
  const subtotal = Cart.subtotal;
  const coupon   = CouponState.get();
  const disc     = CouponState.calcDescuento(subtotal);
  const total    = subtotal - disc;

  const itemsEl = $('checkout-items');
  if (itemsEl) {
    itemsEl.innerHTML = items.map(item => `
      <div class="summary-item" style="margin-bottom:12px">
        <div class="summary-item-img">
          ${item.imagen
            ? `<img src="/uploads/productos/${item.imagen}" alt="${item.nombre}" style="width:48px;height:60px;object-fit:cover;border-radius:6px">`
            : `<div style="width:48px;height:60px;border-radius:6px;background:var(--blush);display:flex;align-items:center;justify-content:center;opacity:.5;font-size:1rem">✦</div>`}
        </div>
        <div>
          <div class="summary-item-name">${item.nombre} ×${item.cantidad}</div>
          <div class="summary-item-brand">${item.marca}</div>
        </div>
        <div class="summary-item-price">${window.fmt(item.precio * item.cantidad)}</div>
      </div>`).join('');
  }

  const set = (id, val) => { const el = $(id); if (el) el.textContent = val; };
  set('co-subtotal', window.fmt(subtotal));
  set('co-total',    window.fmt(total));

  const discRow = $('co-disc-row');
  if (discRow) {
    discRow.style.display = disc ? 'flex' : 'none';
    const discEl = $('co-disc');
    if (discEl) discEl.textContent = '−' + window.fmt(disc);
  }

  if (coupon && $('co-coupon')) {
    $('co-coupon').value = coupon.codigo;
  }
}

window.selectPay = function(el, method) {
  document.querySelectorAll('.pay-opt').forEach(o => o.classList.remove('active'));
  el.classList.add('active');
  selectedPayment = method;
};

window.fileSelected = function(input) {
  uploadedFile = input.files[0] || null;
  const fn = $('file-name');
  if (fn) fn.textContent = uploadedFile ? `📎 ${uploadedFile.name}` : '';
};

window.validateCoupon = async function() {
  const code  = $('co-coupon')?.value.trim().toUpperCase();
  const msgEl = $('co-coupon-msg');
  if (!code) return;

  try {
    const res = await CuponesAPI.validar(code);
    CouponState.set({ ...res.data, codigo: code });
    if (msgEl) { msgEl.style.color = 'var(--deep-rose)'; msgEl.textContent = `✓ ${code} — ${res.data.tipo === 'percent' ? res.data.descuento + '% de descuento' : 'Descuento de ' + window.fmt(res.data.descuento)}`; }
    renderOrderSummary();
  } catch (e) {
    CouponState.clear();
    if (msgEl) { msgEl.style.color = '#c0392b'; msgEl.textContent = e.message; }
    renderOrderSummary();
  }
};

window.placeOrder = async function() {
  const fields = {
    nombre_cliente: $('co-name')?.value.trim(),
    telefono:       $('co-phone')?.value.trim(),
    direccion:      $('co-address')?.value.trim(),
    ciudad:         $('co-city')?.value.trim(),
    departamento:   $('co-dept')?.value.trim(),
  };

  for (const [k, v] of Object.entries(fields)) {
    if (!v) { window.toast('Por favor completa todos los campos requeridos', 'error'); return; }
  }
  if (Cart.get().length === 0) { window.toast('Tu carrito está vacío', 'error'); return; }

  const coupon = CouponState.get();
  const payload = Cart.toOrderPayload({
    ...fields,
    metodo_pago:   selectedPayment,
    notas:         $('co-notes')?.value.trim() || '',
    cupon_codigo:  coupon?.codigo || '',
  });

  const btn = document.querySelector('[onclick="placeOrder()"]');
  if (btn) { btn.disabled = true; btn.textContent = 'Procesando...'; }

  try {
    const res = await PedidosAPI.crear(payload);
    const pedidoId = res.data?.pedido_id;

    // Subir comprobante si existe
    if (uploadedFile && pedidoId) {
      try {
        await UploadAPI.comprobante(pedidoId, uploadedFile);
      } catch {}
    }

    Cart.clear();
    CouponState.clear();
    window.updateCartBadge();

    window.toast(`✦ Pedido ${res.data?.codigo} confirmado`);
    setTimeout(() => {
      window.showPage('home');
      setTimeout(() => window.toast('Gracias por tu compra, te contactaremos pronto ♡'), 1500);
    }, 1200);

  } catch (e) {
    window.toast(e.message, 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Confirmar pedido ✦'; }
  }
};
