// ============================================================
//  VELVET BEAUTY — Cliente API (frontend/js/api.js)
//  Centraliza todas las llamadas al backend PHP
// ============================================================

const API_BASE = window.VB_API || 'http://localhost:8000/api';

// ── Utilidad base ─────────────────────────────────────────────
async function apiRequest(method, endpoint, body = null, isFormData = false) {
  const token = localStorage.getItem('vb_admin_token');
  const headers = {};

  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (token)       headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = isFormData ? body : JSON.stringify(body);

  const res = await fetch(`${API_BASE}${endpoint}`, opts);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data.error || `Error ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

// ── Productos ─────────────────────────────────────────────────
export const ProductosAPI = {
  listar: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest('GET', `/productos${qs ? '?' + qs : ''}`);
  },
  obtener:  (id)   => apiRequest('GET',    `/productos/${id}`),
  crear:    (data) => apiRequest('POST',   '/productos', data),
  editar:   (id, data) => apiRequest('PUT', `/productos/${id}`, data),
  eliminar: (id)   => apiRequest('DELETE', `/productos/${id}`),
};

// ── Pedidos ───────────────────────────────────────────────────
export const PedidosAPI = {
  crear: (data) => apiRequest('POST', '/pedidos', data),
  listar: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest('GET', `/pedidos${qs ? '?' + qs : ''}`);
  },
  obtener:         (id)          => apiRequest('GET', `/pedidos/${id}`),
  actualizarEstado:(id, estado)  => apiRequest('PUT', `/pedidos/${id}`, { estado }),
};

// ── Cupones ───────────────────────────────────────────────────
export const CuponesAPI = {
  validar: (codigo) => apiRequest('POST', '/cupones/validar', { codigo }),
  listar:  ()       => apiRequest('GET',  '/cupones'),
  crear:   (data)   => apiRequest('POST', '/cupones', data),
  editar:  (id, data) => apiRequest('PUT', `/cupones/${id}`, data),
  eliminar:(id)     => apiRequest('DELETE', `/cupones/${id}`),
};

// ── Auth ──────────────────────────────────────────────────────
export const AuthAPI = {
  login:  (email, password) => apiRequest('POST', '/auth/login', { email, password }),
  logout: ()                => apiRequest('POST', '/auth/logout'),
  me:     ()                => apiRequest('GET',  '/auth/me'),
};

// ── Upload ────────────────────────────────────────────────────
export const UploadAPI = {
  comprobante: (pedidoId, file) => {
    const fd = new FormData();
    fd.append('pedido_id', pedidoId);
    fd.append('comprobante', file);
    return apiRequest('POST', '/upload/comprobante', fd, true);
  },
  imagenProducto: (file) => {
    const fd = new FormData();
    fd.append('imagen', file);
    return apiRequest('POST', '/upload/producto', fd, true);
  },
};

// ── Stats (Admin) ─────────────────────────────────────────────
export const StatsAPI = {
  dashboard: () => apiRequest('GET', '/stats'),
};

// ── Marcas / Categorias ───────────────────────────────────────
export const MarcasAPI      = { listar: () => apiRequest('GET', '/marcas') };
export const CategoriasAPI  = { listar: () => apiRequest('GET', '/categorias') };
