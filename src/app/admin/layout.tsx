import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | Velvet Beauty",
  description: "Panel de administración de Velvet Beauty",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f4f5' }}>
      {/* El panel de admin puede tener su propio estilo global base aquí */}
      {children}
    </div>
  );
}
