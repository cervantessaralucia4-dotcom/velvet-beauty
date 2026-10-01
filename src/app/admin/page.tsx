import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import styles from './page.module.css';

export default async function AdminDashboard() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  const { data: pedidos } = await supabase
    .from('pedidos')
    .select('*')
    .order('creado_en', { ascending: false });

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.title}>Velvet Admin</div>
        <form action="/auth/signout" method="post">
          <button type="submit" className={styles.logout}>Cerrar Sesión</button>
        </form>
      </header>

      <div className={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>Últimos Pedidos</h2>
          <a href="/admin/productos/nuevo" style={{ background: 'var(--primary-color)', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
            + Nuevo Producto
          </a>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Código</th>
                <th className={styles.th}>Cliente</th>
                <th className={styles.th}>Fecha</th>
                <th className={styles.th}>Total</th>
                <th className={styles.th}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {pedidos?.length === 0 ? (
                <tr className={styles.tr}>
                  <td className={styles.td} colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
                    No hay pedidos todavía.
                  </td>
                </tr>
              ) : (
                pedidos?.map((pedido) => (
                  <tr key={pedido.id} className={styles.tr}>
                    <td className={styles.td}><strong>{pedido.codigo}</strong></td>
                    <td className={styles.td}>
                      {pedido.nombre_cliente}
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{pedido.ciudad}</div>
                    </td>
                    <td className={styles.td}>{new Date(pedido.creado_en).toLocaleDateString()}</td>
                    <td className={styles.td}>${pedido.total.toLocaleString('es-CO')}</td>
                    <td className={styles.td}>
                      <span className={`${styles.badge} ${styles[pedido.estado] || styles.pending}`}>
                        {pedido.estado.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
