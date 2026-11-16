import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { Show, UserButton } from "@clerk/react";
import { Menu, Shield, Search } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Logo } from "@/components/Logo";

const LINKS = [
  { to: "/", label: "Início", id: "home" },
  { to: "/noticias", label: "Notícias", id: "noticias" },
  { to: "/entrevistas", label: "Entrevistas", id: "entrevistas" },
  { to: "/videos", label: "Vídeos", id: "materias-video" },
  { to: "/reels", label: "Reels", id: "reels" },
  { to: "/colunas", label: "Colunas Sociais", id: "colunas-sociais" },
];

const linkCls = ({ isActive }) =>
  `px-3.5 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${
    isActive ? "bg-[#0B132B] text-[#FFB800]" : "text-[#0B132B] hover:bg-[#FFB800]/30"
  }`;

const AdminButton = ({ onClick }) => (
  <Link to="/admin" onClick={onClick} data-testid="nav-link-admin"
    className="inline-flex items-center gap-2 rounded-full bg-[#FF2A7A] text-white px-4 py-2 text-sm font-bold shadow-[0_4px_0_#0B132B] hover:translate-y-[2px] hover:shadow-[0_2px_0_#0B132B] transition-transform">
    <Shield className="w-4 h-4" /> Admin
  </Link>
);

export default function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/85 border-b border-[#0B132B]/10">
      <div className="h-1.5 bg-[linear-gradient(90deg,#FFB800,#FF2A7A,#00C2FF,#00D18F)]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 py-2">
        <Logo />
        <nav className="hidden lg:flex items-center gap-1">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end className={linkCls} data-testid={`nav-link-${l.id}`}>{l.label}</NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <div className="hidden lg:block"><AdminButton /></div>
          <Show when="signed-in"><UserButton /></Show>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="lg:hidden p-2 rounded-xl bg-[#FFB800]" data-testid="mobile-menu-button" aria-label="Menu">
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-[#FFFBF2]">
              <SheetTitle className="font-display flex items-center gap-2"><Search className="w-4 h-4 text-[#FF2A7A]" /> Navegue</SheetTitle>
              <div className="flex flex-col gap-2 mt-6">
                {LINKS.map((l) => (
                  <NavLink key={l.to} to={l.to} end onClick={() => setOpen(false)} className={linkCls} data-testid={`mobile-nav-link-${l.id}`}>{l.label}</NavLink>
                ))}
                <div className="mt-4"><AdminButton onClick={() => setOpen(false)} /></div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
