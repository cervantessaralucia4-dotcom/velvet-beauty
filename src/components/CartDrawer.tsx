"use client";

import { useCart } from '@/context/CartContext';
import styles from './CartDrawer.module.css';
import Link from 'next/link';

export default function CartDrawer() {
  const { isCartOpen, setIsCartOpen, items, updateQuantity, removeFromCart, total } = useCart();

  return (
    <>
      <div 
        className={`${styles.overlay} ${isCartOpen ? styles.overlayOpen : ''}`} 
        onClick={() => setIsCartOpen(false)}
      />
      <div className={`${styles.drawer} ${isCartOpen ? styles.drawerOpen : ''}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>Tu Carrito</h2>
          <button className={styles.closeButton} onClick={() => setIsCartOpen(false)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={styles.itemsContainer}>
          {items.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Tu carrito está vacío.</p>
              <button 
                onClick={() => setIsCartOpen(false)}
                style={{ marginTop: '16px', color: 'var(--primary-color)', textDecoration: 'underline' }}
              >
                Seguir comprando
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className={styles.item}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.imagen} alt={item.nombre} className={styles.itemImage} />
                <div className={styles.itemDetails}>
                  <span className={styles.itemBrand}>{item.marca}</span>
                  <h4 className={styles.itemName}>{item.nombre}</h4>
                  <span className={styles.itemPrice}>${item.precio.toLocaleString('es-CO')}</span>
                  
                  <div className={styles.itemActions}>
                    <div className={styles.quantityControls}>
                      <button className={styles.qtyButton} onClick={() => updateQuantity(item.id, item.cantidad - 1)}>-</button>
                      <span className={styles.qty}>{item.cantidad}</span>
                      <button className={styles.qtyButton} onClick={() => updateQuantity(item.id, item.cantidad + 1)}>+</button>
                    </div>
                    <button className={styles.removeButton} onClick={() => removeFromCart(item.id)}>
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.totalRow}>
              <span>Total</span>
              <span style={{ color: 'var(--primary-color)' }}>${total.toLocaleString('es-CO')}</span>
            </div>
            <Link href="/checkout" className={styles.checkoutButton} onClick={() => setIsCartOpen(false)}>
              Ir a Pagar
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
