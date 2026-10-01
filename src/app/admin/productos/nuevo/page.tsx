"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NuevoProductoPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [marcas, setMarcas] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    nombre: '',
    slug: '',
    precio: '',
    stock: '10',
    imagen: '',
    categoria_id: '',
    marca_id: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: cats }, { data: mrks }] = await Promise.all([
        supabase.from('categorias').select('id, nombre'),
        supabase.from('marcas').select('id, nombre')
      ]);
      setCategorias(cats || []);
      setMarcas(mrks || []);
      if (cats?.length) setFormData(prev => ({ ...prev, categoria_id: cats[0].id.toString() }));
      if (mrks?.length) setFormData(prev => ({ ...prev, marca_id: mrks[0].id.toString() }));
    };
    fetchData();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const { error } = await supabase.from('productos').insert({
      nombre: formData.nombre,
      slug: formData.slug || formData.nombre.toLowerCase().replace(/ /g, '-'),
      precio: parseFloat(formData.precio),
      stock: parseInt(formData.stock),
      imagen: formData.imagen,
      categoria_id: parseInt(formData.categoria_id),
      marca_id: parseInt(formData.marca_id),
      activo: true
    });

    setIsSubmitting(false);

    if (error) {
      alert('Error al crear producto: ' + error.message);
    } else {
      router.push('/admin');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '24px', background: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem' }}>Nuevo Producto</h1>
        <Link href="/admin" style={{ color: 'var(--text-muted)' }}>Cancelar</Link>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Nombre del Producto</label>
          <input required type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Precio ($)</label>
            <input required type="number" min="0" value={formData.precio} onChange={e => setFormData({...formData, precio: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Stock</label>
            <input required type="number" min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Categoría</label>
            <select value={formData.categoria_id} onChange={e => setFormData({...formData, categoria_id: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Marca</label>
            <select value={formData.marca_id} onChange={e => setFormData({...formData, marca_id: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>URL de la Imagen (Opcional)</label>
          <input type="url" value={formData.imagen} onChange={e => setFormData({...formData, imagen: e.target.value})} placeholder="https://..." style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ marginTop: '16px', padding: '16px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '100px', cursor: 'pointer', fontWeight: 600 }}>
          {isSubmitting ? 'Guardando...' : 'Crear Producto'}
        </button>
      </form>
    </div>
  );
}
