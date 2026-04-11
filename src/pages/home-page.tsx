import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { routePaths } from "@/config/route-paths";

export const HomePage = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("homeTitle")}</h1>
        <p className="text-muted-foreground">{t("homeDescription")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Starter capabilities</CardTitle>
          <CardDescription>{t("protectedRouteHint")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to={routePaths.dashboard}>Open protected dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={routePaths.register}>Create account</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
