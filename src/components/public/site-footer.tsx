import Link from "next/link";
import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3 lg:col-span-2">
            <div className="flex items-center gap-2">
              <Image src="/logo-icono-sin-letras.png" alt="" width={28} height={28} className="size-7" />
              <span className="text-base font-semibold text-foreground">MediPet System</span>
            </div>
            <p className="max-w-xs text-sm text-muted-foreground">
              La plataforma SaaS integral para clínicas veterinarias, hospitales y pet shops: pacientes, expedientes,
              inventario, facturación, compras, agenda y reportes en un solo lugar.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Producto</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/precios" className="hover:text-foreground">Precios</Link></li>
              <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
              <li><Link href="/faq" className="hover:text-foreground">Preguntas frecuentes</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Empresa</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/contacto" className="hover:text-foreground">Contacto</Link></li>
              <li><Link href="/demo" className="hover:text-foreground">Solicitar demo</Link></li>
              <li><Link href="/login" className="hover:text-foreground">Iniciar sesión</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} MediPet System. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
