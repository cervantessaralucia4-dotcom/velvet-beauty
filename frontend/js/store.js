// ============================================================
//  VELVET BEAUTY — Estado global: Carrito y Wishlist
//  Persistencia en localStorage + eventos personalizados
// ============================================================

// ── CARRITO ───────────────────────────────────────────────────
export const Cart = {
  _key: 'vb_cart',

  get() {
    return JSON.parse(localStorage.getItem(this._key) || '[]');
  },

  save(items) {
    localStorage.setItem(this._key, JSON.stringify(items));
    document.dispatchEvent(new CustomEvent('cart:updated', { detail: items }));
  },

  add(producto, cantidad = 1) {
    const items = this.get();
    const exist = items.find(i => i.producto_id === producto.id);
    if (exist) {
      exist.cantidad = Math.min(exist.cantidad + cantidad, exist.stock || 99);
    } else {
      items.push({
        producto_id: producto.id,
        nombre:      producto.nombre,
        marca:       producto.marca_nombre || producto.marca,
        precio:      parseFloat(producto.precio),
        imagen:      producto.imagen || '',
        stock:       producto.stock  || 99,
        cantidad,
      });
    }
    this.save(items);
    return items;
  },

  remove(productoId) {
    this.save(this.get().filter(i => i.producto_id !== productoId));
  },

  updateQty(productoId, cantidad) {
    const items = this.get();
    const item  = items.find(i => i.producto_id === productoId);
    if (item) {
      item.cantidad = Math.max(1, Math.min(cantidad, item.stock || 99));
      this.save(items);
    }
  },

  clear() { this.save([]); },

  get count()    { return this.get().reduce((s, i) => s + i.cantidad, 0); },
  get subtotal() { return this.get().reduce((s, i) => s + i.precio * i.cantidad, 0); },

  toOrderPayload(extra = {}) {
    return {
      items: this.get().map(i => ({
        producto_id: i.producto_id,
        cantidad:    i.cantidad,
      })),
      ...extra,
    };
  },
};

// ── WISHLIST ──────────────────────────────────────────────────
export const Wishlist = {
  _key: 'vb_wishlist',

  get() { return JSON.parse(localStorage.getItem(this._key) || '[]'); },

  save(ids) {
    localStorage.setItem(this._key, JSON.stringify(ids));
    document.dispatchEvent(new CustomEvent('wishlist:updated', { detail: ids }));
  },

  toggle(productoId) {
    const ids = this.get();
    const idx = ids.indexOf(productoId);
    if (idx === -1) { ids.push(productoId); }
    else            { ids.splice(idx, 1);   }
    this.save(ids);
    return idx === -1; // true = añadido, false = eliminado
  },

  has(productoId) { return this.get().includes(productoId); },

  clear() { this.save([]); },
};

// ── CUPÓN activo ──────────────────────────────────────────────
export const CouponState = {
  _key: 'vb_coupon',

  get() { return JSON.parse(sessionStorage.getItem(this._key) || 'null'); },

  set(cupon) { sessionStorage.setItem(this._key, JSON.stringify(cupon)); },

  clear() { sessionStorage.removeItem(this._key); },

  calcDescuento(subtotal) {
    const c = this.get();
    if (!c) return 0;
    return c.tipo === 'percent'
      ? Math.round(subtotal * c.descuento / 100)
      : Math.min(c.descuento, subtotal);
  },
};
