import { Link, useLocation } from "react-router-dom";
import { Wheat, Moon, Sun, Globe } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  const cycleLang = () => {
    const langs = ["en", "hi", "mr"];
    const currentIndex = langs.indexOf(i18n.language);
    const nextLang = langs[(currentIndex + 1) % langs.length];
    i18n.changeLanguage(nextLang);
  };

  const getLangDisplay = () => {
    const langMap: Record<string, string> = { en: "EN", hi: "हिंदी", mr: "मराठी" };
    return langMap[i18n.language] || "EN";
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg gradient-hero flex items-center justify-center">
            <Wheat className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-heading font-bold text-foreground tracking-tight">{t('common.brand')}</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {[
            { label: t('nav.dashboard'), path: "/dashboard" },
            { label: t('nav.prices'), path: "/prices" },
            { label: t('nav.calculator'), path: "/calculator" },
            { label: t('nav.smartSell'), path: "/smart-sell" },
            { label: t('nav.trends'), path: "/trends" },
          ].map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={cycleLang}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Globe className="w-4 h-4" />
            {getLangDisplay()}
          </button>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
