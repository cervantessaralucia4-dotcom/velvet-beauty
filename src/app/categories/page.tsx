import { createClient } from '@/lib/supabase/server';
import styles from './page.module.css';
import Link from 'next/link';
import CartButton from '@/components/CartButton';

export const metadata = {
  title: 'Categorías | Velvet Beauty',
  description: 'Explora nuestras categorías de belleza',
};

export default async function CategoriesPage() {
  const supabase = await createClient();
  
  const { data: categorias } = await supabase
    .from('categorias')
    .select('*')
    .eq('activa', true);

  return (
    <main className={styles.main}>
      <nav style={{ position: 'sticky', top: 0, width: '100%', padding: '24px', zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 600 }}>Velvet Beauty</Link>
        <div style={{ display: 'flex', gap: '24px', fontSize: '0.9rem', fontWeight: 500, alignItems: 'center' }}>
          <Link href="/" style={{ transition: 'color var(--transition-fast)' }} className="hover:text-primary">Inicio</Link>
          <Link href="/shop" style={{ transition: 'color var(--transition-fast)' }} className="hover:text-primary">Tienda</Link>
          <Link href="/categories" style={{ transition: 'color var(--transition-fast)', color: 'var(--primary-color)' }}>Categorías</Link>
          <CartButton />
        </div>
      </nav>

      <div className="container">
        <header className={styles.header}>
          <h1 className={styles.title}>Nuestras Categorías</h1>
          <p className={styles.subtitle}>Encuentra lo que buscas por tipo de producto</p>
        </header>

        <div className={styles.grid}>
          {categorias?.map((cat) => (
            <Link href={`/shop?categoria=${cat.id}`} key={cat.id} className={styles.categoryCard}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={cat.imagen || 'https://images.unsplash.com/photo-1571781537222-386851214041?auto=format&fit=crop&q=80&w=600&h=800'} 
                alt={cat.nombre}
                className={styles.image}
              />
              <div className={styles.overlay}>
                <h2 className={styles.categoryName}>{cat.nombre}</h2>
                <p className={styles.categoryDesc}>{cat.descripcion}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
