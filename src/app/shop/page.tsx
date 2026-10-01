import { createClient } from '@/lib/supabase/server'
import styles from './page.module.css'
import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import CartButton from '@/components/CartButton'

export const metadata = {
  title: 'Tienda | Velvet Beauty',
  description: 'Explora nuestra selección premium de maquillaje y cuidado personal.',
}

export default async function ShopPage() {
  const supabase = await createClient()
  
  // Obtener los productos desde Supabase
  const { data: productos, error } = await supabase
    .from('productos')
    .select('*, marcas(nombre)')
    .eq('activo', true)
    
  if (error) {
    console.error('Error al obtener productos:', error)
  }

  return (
    <main className={styles.main}>
      <nav style={{ position: 'sticky', top: 0, width: '100%', padding: '24px', zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 600 }}>Velvet Beauty</Link>
        <div style={{ display: 'flex', gap: '24px', fontSize: '0.9rem', fontWeight: 500, alignItems: 'center' }}>
          <Link href="/" style={{ transition: 'color var(--transition-fast)' }} className="hover:text-primary">Inicio</Link>
          <Link href="/shop" style={{ transition: 'color var(--transition-fast)', color: 'var(--primary-color)' }}>Tienda</Link>
          <CartButton />
        </div>
      </nav>

      <div className="container">
        <header className={styles.header}>
          <h1 className={styles.title}>Nuestra Colección</h1>
          <p className={styles.subtitle}>Encuentra tus favoritos de belleza</p>
        </header>

        <div className={styles.productGrid}>
          {productos?.map((producto) => (
            <ProductCard key={producto.id} producto={producto} />
          ))}
        </div>
        
        {(!productos || productos.length === 0) && (
          <div className={styles.emptyState}>
            <p>No se encontraron productos por el momento.</p>
          </div>
        )}
      </div>
    </main>
  )
}
