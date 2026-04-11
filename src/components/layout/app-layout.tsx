import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hook/use-auth";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { routePaths } from "@/config/route-paths";

export const AppLayout = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, isSigningOut, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error: unknown) {
      console.error("Sign out request failed:", error);
    }
    navigate(routePaths.login);
  };

  const toggleLanguage = async () => {
    const nextLanguage = i18n.language === "en" ? "hi" : "en";
    await i18n.changeLanguage(nextLanguage);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
          <Link to={routePaths.home} className="font-semibold tracking-tight">
            {t("appName")}
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={toggleLanguage}>
              <Languages className="mr-2 size-4" />
              {i18n.language.toUpperCase()}
            </Button>
            <ThemeToggle />
            {isAuthenticated ? (
              <Button variant="default" size="sm" onClick={handleSignOut} disabled={isSigningOut}>
                {t("signOut")}
              </Button>
            ) : (
              <Button asChild variant="default" size="sm">
                <Link to={routePaths.login}>{t("signIn")}</Link>
              </Button>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <Outlet />
      </main>
    </div>
  );
};
