"use client";

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';
import Link from 'next/link';
import CartButton from '@/components/CartButton';

export default function CheckoutPage() {
  const { items, total, removeFromCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const [formData, setFormData] = useState({
    nombre_cliente: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    departamento: '',
    metodo_pago: 'Efectivo contra entrega',
  });

  // Cupones
  const [couponCode, setCouponCode] = useState('');
  const [couponData, setCouponData] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    setCouponError('');
    
    try {
      const { data, error } = await supabase
        .from('cupones')
        .select('*')
        .eq('codigo', couponCode.toUpperCase())
        .eq('activo', true)
        .single();
        
      if (error || !data) {
        setCouponError('Cupón inválido o expirado.');
        setCouponData(null);
        return;
      }
      
      // Chequeos extras: expiración, usos max
      if (data.fecha_expiracion && new Date(data.fecha_expiracion) < new Date()) {
        setCouponError('El cupón ha expirado.');
        setCouponData(null);
        return;
      }
      if (data.usos_max !== null && data.usos_actuales >= data.usos_max) {
        setCouponError('El cupón ha alcanzado su límite de usos.');
        setCouponData(null);
        return;
      }
      
      setCouponData(data);
    } catch (e) {
      setCouponError('Error al validar cupón.');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const discountAmount = couponData 
    ? (couponData.tipo === 'percent' ? (total * (couponData.descuento / 100)) : couponData.descuento)
    : 0;
  const finalTotal = Math.max(0, total - discountAmount);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    
    setIsSubmitting(true);
    
    try {
      // 1. Crear el pedido
      const codigo_pedido = `VB-${Math.floor(Math.random() * 1000000)}`;
      
      const { data: pedidoData, error: pedidoError } = await supabase
        .from('pedidos')
        .insert({
          codigo: codigo_pedido,
          nombre_cliente: formData.nombre_cliente,
          telefono: formData.telefono,
          direccion: formData.direccion,
          ciudad: formData.ciudad,
          departamento: formData.departamento,
          metodo_pago: formData.metodo_pago,
          subtotal: total,
          total: finalTotal,
          descuento_total: discountAmount,
          cupon_id: couponData?.id || null,
          estado: 'pending'
        })
        .select()
        .single();

      if (pedidoError) throw pedidoError;

      // 2. Insertar detalles del pedido
      const detalles = items.map(item => ({
        pedido_id: pedidoData.id,
        producto_id: item.id,
        cantidad: item.cantidad,
        precio_unit: item.precio,
        subtotal: item.precio * item.cantidad
      }));

      const { error: detallesError } = await supabase
        .from('detalles_pedido')
        .insert(detalles);

      if (detallesError) throw detallesError;

      // 3. Vaciar carrito y mostrar éxito
      items.forEach(item => removeFromCart(item.id));
      setSuccess(true);
      
    } catch (error) {
      console.error('Error al procesar el pedido:', error);
      alert('Hubo un error al procesar tu pedido. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.successState}>
            <div className={styles.successIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h1 className={styles.title}>¡Pedido Confirmado!</h1>
            <p className={styles.successMessage}>
              Tu pedido ha sido registrado con éxito. Te contactaremos pronto para coordinar el envío.
            </p>
            <Link href="/shop" className="btn-primary">
              Volver a la Tienda
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <nav style={{ position: 'absolute', top: 0, left: 0, width: '100%', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 600 }}>Velvet Beauty</Link>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <Link href="/shop" className="hover:text-primary">Tienda</Link>
          <CartButton />
        </div>
      </nav>

      <div className={styles.container}>
        <h1 className={styles.title}>Finalizar Compra</h1>

        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            No tienes productos en el carrito.
            <br /><br />
            <Link href="/shop" className="btn-primary">Ir a la Tienda</Link>
          </div>
        ) : (
          <div className={styles.checkoutLayout}>
            <div>
              <h2 className={styles.sectionTitle}>Datos de Envío</h2>
              <form id="checkout-form" className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Nombre Completo</label>
                  <input required name="nombre_cliente" value={formData.nombre_cliente} onChange={handleChange} className={styles.input} type="text" placeholder="Tu nombre" />
                </div>
                
                <div className={styles.row}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Teléfono</label>
                    <input required name="telefono" value={formData.telefono} onChange={handleChange} className={styles.input} type="tel" placeholder="Tu celular" />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Departamento</label>
                    <input required name="departamento" value={formData.departamento} onChange={handleChange} className={styles.input} type="text" placeholder="Ej: Antioquia" />
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Ciudad</label>
                    <input required name="ciudad" value={formData.ciudad} onChange={handleChange} className={styles.input} type="text" placeholder="Ej: Medellín" />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Dirección</label>
                    <input required name="direccion" value={formData.direccion} onChange={handleChange} className={styles.input} type="text" placeholder="Tu dirección completa" />
                  </div>
                </div>

                <div className={styles.inputGroup} style={{ marginTop: '16px' }}>
                  <label className={styles.label}>Método de Pago</label>
                  <select name="metodo_pago" value={formData.metodo_pago} onChange={handleChange} className={styles.input}>
                    <option value="Efectivo contra entrega">Efectivo contra entrega</option>
                    <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                  </select>
                </div>
              </form>
            </div>

            <div>
              <div className={styles.summary}>
                <h2 className={styles.sectionTitle}>Resumen del Pedido</h2>
                
                <div style={{ marginBottom: '24px' }}>
                  {items.map(item => (
                    <div key={item.id} className={styles.summaryItem}>
                      <div className={styles.itemInfo}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.imagen} alt={item.nombre} className={styles.itemImage} />
                        <div>
                          <p className={styles.itemName}>{item.nombre}</p>
                          <p className={styles.itemQty}>Cant: {item.cantidad}</p>
                        </div>
                      </div>
                      <div style={{ fontWeight: 500 }}>
                        ${(item.precio * item.cantidad).toLocaleString('es-CO')}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <label className={styles.label} style={{ marginBottom: '8px', display: 'block' }}>¿Tienes un cupón de descuento?</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="CÓDIGO" 
                      className={styles.input}
                      style={{ flex: 1, textTransform: 'uppercase' }}
                      disabled={!!couponData || isApplyingCoupon}
                    />
                    {!couponData ? (
                      <button 
                        onClick={applyCoupon}
                        disabled={isApplyingCoupon || !couponCode.trim()}
                        style={{ padding: '0 16px', background: 'var(--text-color)', color: '#fff', borderRadius: '8px', fontWeight: 600 }}
                      >
                        Aplicar
                      </button>
                    ) : (
                      <button 
                        onClick={() => { setCouponData(null); setCouponCode(''); }}
                        style={{ padding: '0 16px', background: '#ff4d4f', color: '#fff', borderRadius: '8px', fontWeight: 600 }}
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                  {couponError && <p style={{ color: '#ff4d4f', fontSize: '0.85rem', marginTop: '8px' }}>{couponError}</p>}
                  {couponData && <p style={{ color: '#52c41a', fontSize: '0.85rem', marginTop: '8px' }}>Cupón aplicado con éxito.</p>}
                </div>

                <div className={styles.summaryTotals}>
                  <div className={styles.totalRow}>
                    <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                    <span>${total.toLocaleString('es-CO')}</span>
                  </div>
                  <div className={styles.totalRow}>
                    <span style={{ color: 'var(--text-muted)' }}>Envío</span>
                    <span>¡Gratis!</span>
                  </div>
                  {couponData && (
                    <div className={styles.totalRow} style={{ color: '#52c41a' }}>
                      <span>Descuento ({couponCode.toUpperCase()})</span>
                      <span>-${discountAmount.toLocaleString('es-CO')}</span>
                    </div>
                  )}
                  <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                    <span>Total</span>
                    <span>${finalTotal.toLocaleString('es-CO')}</span>
                  </div>
                </div>

                <button 
                  type="submit" 
                  form="checkout-form"
                  className={styles.submitButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Procesando...' : 'Confirmar Pedido'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
