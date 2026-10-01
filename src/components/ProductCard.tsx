"use client";

import { useCart } from '@/context/CartContext';
import styles from '@/app/shop/page.module.css';

export default function ProductCard({ producto }: { producto: any }) {
  const { addToCart } = useCart();

  return (
    <div className={styles.productCard}>
      <div className={styles.imageContainer}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={producto.imagen || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=400&h=400'} 
          alt={producto.nombre} 
          className={styles.image}
        />
        {producto.stock < 10 && producto.stock > 0 && (
          <span className={styles.badge}>¡Últimas unidades!</span>
        )}
      </div>
      <div className={styles.productInfo}>
        <p className={styles.brand}>{producto.marcas?.nombre}</p>
        <h3 className={styles.productName}>{producto.nombre}</h3>
        <p className={styles.price}>
          ${Number(producto.precio).toLocaleString('es-CO')}
        </p>
        <button 
          className={styles.addToCart}
          onClick={() => addToCart(producto)}
        >
          Añadir al carrito
        </button>
      </div>
    </div>
  );
}
