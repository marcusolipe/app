import { Link } from "react-router-dom";

export const Logo = ({ className = "h-14 sm:h-16" }) => (
  <Link to="/" data-testid="navbar-brand-logo" className="inline-flex items-center shrink-0 transition-transform duration-300 hover:scale-105 hover:-rotate-1">
    <img src="/logo.png" alt="PATY INVESTIGA" className={`${className} w-auto`} />
  </Link>
);
