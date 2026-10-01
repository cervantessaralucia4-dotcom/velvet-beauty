import styles from "./page.module.css";
import Link from "next/link";
import CartButton from "@/components/CartButton";

export default function Home() {
  return (
    <main>
      {/* Navbar Minimal */}
      <nav style={{ position: 'fixed', top: 0, width: '100%', padding: '24px', zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 600 }}>Velvet Beauty</div>
        <div style={{ display: 'flex', gap: '24px', fontSize: '0.9rem', fontWeight: 500, alignItems: 'center' }}>
          <Link href="/shop" style={{ transition: 'color var(--transition-fast)' }} className="hover:text-primary">Tienda</Link>
          <Link href="/categories" style={{ transition: 'color var(--transition-fast)' }} className="hover:text-primary">Categorías</Link>
          <Link href="/login" style={{ transition: 'color var(--transition-fast)' }} className="hover:text-primary">Login</Link>
          <CartButton />
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBackground} />
        
        <div className={`${styles.heroContent} container`}>
          <div className={`${styles.badge} animate-fade-in`}>
            Nueva Colección 2026
          </div>
          
          <h1 className={`${styles.title} animate-fade-in delay-100`}>
            Descubre tu belleza <br />
            <span>auténtica</span>
          </h1>
          
          <p className={`${styles.description} animate-fade-in delay-200`}>
            Explora nuestra selección premium de maquillaje, cuidado de la piel y cabello. 
            Formulaciones exclusivas diseñadas para resaltar tu esencia natural.
          </p>
          
          <div className={`${styles.actions} animate-fade-in delay-300`}>
            <Link href="/shop" className="btn-primary">
              Comprar Ahora
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '8px' }}>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link href="/about" className={styles.btnSecondary}>
              Nuestra Historia
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className="container">
          <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '16px' }}>La Diferencia Velvet</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '40px' }}>Calidad excepcional en cada detalle.</p>
          
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>✨</div>
              <h3 className={styles.featureTitle}>Fórmulas Premium</h3>
              <p className={styles.featureDesc}>
                Ingredientes cuidadosamente seleccionados que nutren tu piel mientras realzan tu belleza natural. Sin parabenos ni crueldad animal.
              </p>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🚚</div>
              <h3 className={styles.featureTitle}>Envío Express</h3>
              <p className={styles.featureDesc}>
                Disfruta de envíos rápidos y seguros en todo el país. Tus productos favoritos en la puerta de tu casa en menos de 48 horas.
              </p>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>💫</div>
              <h3 className={styles.featureTitle}>Asesoría Personalizada</h3>
              <p className={styles.featureDesc}>
                Nuestros expertos en belleza están disponibles para ayudarte a encontrar la rutina perfecta para tu tipo de piel.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
