"use client";

import { useCart } from "@/context/CartContext";

export default function CartButton() {
  const { items, setIsCartOpen } = useCart();
  
  const totalItems = items.reduce((acc, item) => acc + item.cantidad, 0);

  return (
    <button 
      onClick={() => setIsCartOpen(true)}
      style={{
        background: 'var(--surface-color)',
        border: '1px solid var(--border-color)',
        padding: '8px 16px',
        borderRadius: '100px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: 'var(--text-color)',
        fontWeight: 500,
        position: 'relative',
        transition: 'all var(--transition-fast)'
      }}
      className="hover:border-primary"
      onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--primary-color)')}
      onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
      {totalItems > 0 && (
        <span style={{
          position: 'absolute',
          top: '-5px',
          right: '-5px',
          background: 'var(--primary-color)',
          color: '#fff',
          fontSize: '0.75rem',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%'
        }}>
          {totalItems}
        </span>
      )}
    </button>
  );
}
