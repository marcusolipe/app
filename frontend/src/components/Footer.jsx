import { Link } from "react-router-dom";
import { Search } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative grain overflow-hidden bg-[#0B132B] text-white mt-24" data-testid="site-footer">
      <div className="max-w-7xl mx-auto px-6 py-14 grid gap-10 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 font-display text-3xl font-black">
            <span className="w-10 h-10 rounded-full border-4 border-[#FF2A7A] bg-[#00C2FF]/30 grid place-items-center">
              <Search className="w-4 h-4 text-[#FFB800]" />
            </span>
            PATY <span className="text-[#FF2A7A]">INVESTIGA</span>
          </div>
          <p className="mt-4 text-white/70 max-w-xs">A verdade por trás dos fatos em Angra dos Reis e na Costa Verde.</p>
        </div>
        <div className="flex flex-col gap-2 text-white/80">
          <span className="font-display font-bold text-[#FFB800] mb-1">Seções</span>
          <Link to="/noticias" className="hover:text-[#00C2FF]">Notícias</Link>
          <Link to="/entrevistas" className="hover:text-[#00C2FF]">Entrevistas</Link>
          <Link to="/videos" className="hover:text-[#00C2FF]">Matérias em Vídeo</Link>
          <Link to="/reels" className="hover:text-[#00C2FF]">Reels</Link>
          <Link to="/colunas" className="hover:text-[#00C2FF]">Colunas Sociais</Link>
          <Link to="/agenda" className="hover:text-[#00C2FF]">Agenda de Eventos</Link>
        </div>
        <div className="text-white/70">
          <span className="font-display font-bold text-[#FFB800]">Tem uma pauta?</span>
          <p className="mt-2">Mande sua dica para a Paty investigar. Angra dos Reis • RJ</p>
          <p className="mt-6 text-xs text-white/40">© {new Date().getFullYear()} Paty Investiga. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
