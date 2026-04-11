import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { routePaths } from "@/config/route-paths";

export const NotFoundPage = () => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">404</p>
      <h1 className="text-4xl font-semibold tracking-tight">{t("pageNotFound")}</h1>
      <p className="text-muted-foreground">The page you requested does not exist.</p>
      <Button asChild>
        <Link to={routePaths.home}>{t("goHome")}</Link>
      </Button>
    </div>
  );
};
