// ============================================================
//  VELVET BEAUTY — Admin Panel (frontend/js/admin.js)
// ============================================================

import { AuthAPI, StatsAPI, PedidosAPI, ProductosAPI, CuponesAPI } from './api.js';

const $ = id => document.getElementById(id);
const fmt = n => '$' + Number(n).toLocaleString('es-CO');

// ── Login ─────────────────────────────────────────────────────
export async function adminLogin(email, password) {
  try {
    const res = await AuthAPI.login(email, password);
    localStorage.setItem('vb_admin_token', res.data.token);
    localStorage.setItem('vb_admin_name',  res.data.admin.nombre);
    window.toast('Bienvenida, ' + res.data.admin.nombre);
    return true;
  } catch (e) {
    window.toast(e.message, 'error');
    return false;
  }
}

export function adminLogout() {
  localStorage.removeItem('vb_admin_token');
  localStorage.removeItem('vb_admin_name');
  window.showPage('home');
}

function isAdminLogged() {
  return !!localStorage.getItem('vb_admin_token');
}

// ── Dashboard ─────────────────────────────────────────────────
export async function renderAdminDashboard() {
  if (!isAdminLogged()) { renderLoginForm(); return; }

  try {
    const stats = await StatsAPI.dashboard();

    // Cards
    $('admin-stats').innerHTML = `
      <div class="stat-card">
        <div class="stat-card-label">Ventas totales</div>
        <div class="stat-card-val">${fmt(stats.ventas_total)}</div>
        <div class="stat-card-sub">Este mes: ${fmt(stats.ventas_mes)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">Pedidos</div>
        <div class="stat-card-val">${stats.total_pedidos}</div>
        <div class="stat-card-sub">${stats.pedidos_pending} pendientes</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">Productos</div>
        <div class="stat-card-val">${stats.total_productos}</div>
        <div class="stat-card-sub" style="color:${stats.sin_stock > 0 ? '#c0392b':'var(--deep-rose)'}">
          ${stats.sin_stock > 0 ? stats.sin_stock + ' sin stock ⚠' : 'Todo en stock ✓'}
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">Cupones activos</div>
        <div class="stat-card-val">${stats.cupones_activos}</div>
        <div class="stat-card-sub">${stats.total_usos_cupones} usos totales</div>
      </div>`;

    // Tabla pedidos recientes
    renderOrdersTable(stats.pedidos_recientes, 'recent-orders-table');

  } catch (e) {
    if (e.message.includes('401')) { adminLogout(); return; }
    $('admin-stats').innerHTML = `<p style="color:#c0392b">Error: ${e.message}</p>`;
  }
}

// ── Pedidos ───────────────────────────────────────────────────
export async function renderAdminOrders() {
  const wrap = $('orders-table-wrap');
  if (!wrap) return;
  try {
    const res    = await PedidosAPI.listar({ limit: 50 });
    const orders = res.data || [];
    renderOrdersTable(orders, 'orders-table-wrap', true);
  } catch (e) {
    wrap.innerHTML = `<p style="padding:1rem;color:#c0392b">${e.message}</p>`;
  }
}

function renderOrdersTable(orders, containerId, full = false) {
  const el = $(containerId);
  if (!el) return;
  const header = full
    ? '<th>ID</th><th>Cliente</th><th>Teléfono</th><th>Items</th><th>Total</th><th>Pago</th><th>Estado</th><th>Fecha</th><th>Acción</th>'
    : '<th>ID</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Fecha</th>';

  el.innerHTML = `
    ${full ? `<div class="admin-table-head"><h3>Todos los pedidos</h3><span style="font-size:.82rem;color:var(--warm-gray)">${orders.length} pedidos</span></div>` : ''}
    <table>
      <thead><tr>${header}</tr></thead>
      <tbody>${orders.map(o => `<tr>
        <td style="font-weight:700;color:var(--deep-rose)">${o.codigo}</td>
        <td style="font-weight:500">${o.nombre_cliente}</td>
        ${full ? `<td style="color:var(--warm-gray);font-size:.82rem">${o.telefono}</td><td>${o.items || '—'}</td>` : ''}
        <td style="font-weight:600">${fmt(o.total)}</td>
        ${full ? `<td style="font-size:.82rem">${o.metodo_pago || '—'}</td>` : ''}
        <td>${statusBadge(o.estado)}</td>
        <td style="color:var(--warm-gray);font-size:.82rem">${(o.creado_en || '').split('T')[0]}</td>
        ${full ? `<td>
          <select onchange="updateOrderStatus(${o.id},this.value)" style="border:1px solid var(--blush);border-radius:4px;padding:4px 8px;font-size:.75rem;font-family:var(--ff-sans)">
            ${['pending','confirmed','shipped','delivered','cancelled'].map(s => `<option value="${s}" ${o.estado===s?'selected':''}>${{pending:'Pendiente',confirmed:'Confirmado',shipped:'Enviado',delivered:'Entregado',cancelled:'Cancelado'}[s]}</option>`).join('')}
          </select>
        </td>` : ''}
      </tr>`).join('')}</tbody>
    </table>`;
}

window.updateOrderStatus = async (id, estado) => {
  try {
    await PedidosAPI.actualizarEstado(id, estado);
    window.toast('Estado actualizado');
  } catch (e) { window.toast(e.message, 'error'); }
};

// ── Productos ─────────────────────────────────────────────────
export async function renderAdminProducts() {
  const wrap = $('products-table-wrap');
  if (!wrap) return;
  try {
    const res   = await ProductosAPI.listar({ limit: 100 });
    const prods = res.data || [];

    wrap.innerHTML = `
      <div class="admin-table-head">
        <h3>Catálogo</h3>
        <span style="font-size:.82rem;color:var(--warm-gray)">${prods.length} productos</span>
      </div>
      <table>
        <thead><tr><th>Producto</th><th>Marca</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>${prods.map(p => `<tr>
          <td style="font-weight:500">${p.nombre}</td>
          <td><span style="color:var(--deep-rose);font-weight:600;font-size:.8rem">${p.marca_nombre}</span></td>
          <td style="text-transform:capitalize;font-size:.83rem">${p.categoria}</td>
          <td style="font-weight:600">${fmt(p.precio)}</td>
          <td><span style="color:${p.stock > 0 ? 'var(--charcoal)' : '#c0392b'};font-weight:${p.stock === 0 ? 700 : 400}">${p.stock}${p.stock === 0 ? ' ⚠' : ''}</span></td>
          <td><span class="status-badge ${p.activo ? 'status-confirmed' : 'status-pending'}">${p.activo ? 'Activo' : 'Inactivo'}</span></td>
          <td>
            <button class="tbl-btn" onclick="openEditProduct(${p.id})">Editar</button>
            <button class="tbl-btn danger" onclick="deleteProduct(${p.id}, this)">Eliminar</button>
          </td>
        </tr>`).join('')}</tbody>
      </table>`;
  } catch (e) {
    wrap.innerHTML = `<p style="padding:1rem;color:#c0392b">${e.message}</p>`;
  }
}

window.deleteProduct = async (id, btn) => {
  if (!confirm('¿Eliminar este producto?')) return;
  try {
    await ProductosAPI.eliminar(id);
    btn.closest('tr').remove();
    window.toast('Producto eliminado');
  } catch (e) { window.toast(e.message, 'error'); }
};

window.openEditProduct = (id) => window.toast('Editor de producto #' + id + ' — integra con tu modal');
window.openAddProduct  = ()   => window.toast('Formulario nuevo producto — abre modal con form');

// ── Cupones ───────────────────────────────────────────────────
export async function renderAdminCoupons() {
  const wrap = $('coupons-table-wrap');
  if (!wrap) return;
  try {
    const cupones = await CuponesAPI.listar();
    wrap.innerHTML = `
      <div class="admin-table-head"><h3>Cupones de descuento</h3></div>
      <table>
        <thead><tr><th>Código</th><th>Descuento</th><th>Tipo</th><th>Expira</th><th>Usos</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>${cupones.map(c => `<tr>
          <td style="font-weight:700;letter-spacing:.08em">${c.codigo}</td>
          <td style="font-weight:600;color:var(--deep-rose)">${c.tipo === 'percent' ? c.descuento + '%' : fmt(c.descuento)}</td>
          <td style="font-size:.82rem">${c.tipo === 'percent' ? 'Porcentaje' : 'Monto fijo'}</td>
          <td style="color:var(--warm-gray);font-size:.82rem">${c.fecha_expiracion || 'Sin límite'}</td>
          <td>${c.usos_actuales}${c.usos_max ? ' / ' + c.usos_max : ''}</td>
          <td><span class="status-badge ${c.activo ? 'status-confirmed' : 'status-pending'}">${c.activo ? 'Activo' : 'Inactivo'}</span></td>
          <td>
            <button class="tbl-btn" onclick="toggleCoupon(${c.id}, ${c.activo})">${c.activo ? 'Desactivar' : 'Activar'}</button>
            <button class="tbl-btn danger" onclick="deleteCoupon(${c.id}, this)">Eliminar</button>
          </td>
        </tr>`).join('')}</tbody>
      </table>`;
  } catch (e) {
    wrap.innerHTML = `<p style="padding:1rem;color:#c0392b">${e.message}</p>`;
  }
}

window.toggleCoupon = async (id, activo) => {
  try {
    await CuponesAPI.editar(id, { activo: activo ? 0 : 1 });
    window.toast('Cupón actualizado');
    renderAdminCoupons();
  } catch (e) { window.toast(e.message, 'error'); }
};

window.deleteCoupon = async (id, btn) => {
  if (!confirm('¿Eliminar este cupón?')) return;
  try {
    await CuponesAPI.eliminar(id);
    btn.closest('tr').remove();
    window.toast('Cupón eliminado');
  } catch (e) { window.toast(e.message, 'error'); }
};

window.openAddCoupon = () => window.toast('Formulario nuevo cupón');

function statusBadge(s) {
  const map = { pending: 'status-pending', confirmed: 'status-confirmed', delivered: 'status-delivered', shipped: 'status-confirmed', cancelled: 'status-pending' };
  const labels = { pending: 'Pendiente', confirmed: 'Confirmado', shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado' };
  return `<span class="status-badge ${map[s] || ''}">${labels[s] || s}</span>`;
}

// Exportar función de renderAdmin para el HTML
window.renderAdmin = async function() {
  await Promise.all([renderAdminDashboard(), renderAdminOrders(), renderAdminProducts(), renderAdminCoupons()]);
};
