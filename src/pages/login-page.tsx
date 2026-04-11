import { isAxiosError } from "axios";
import type { FormEvent } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hook/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { routePaths } from "@/config/route-paths";

type LoginFormState = {
  email: string;
  password: string;
};

const initialState: LoginFormState = {
  email: "demo@template.dev",
  password: "password123",
};

export const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isSigningIn, signIn } = useAuth();

  const [form, setForm] = useState<LoginFormState>(initialState);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const nextPath =
    typeof location.state?.from === "string" ? location.state.from : routePaths.dashboard;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    try {
      await signIn(form);
      navigate(nextPath, { replace: true });
    } catch (error) {
      if (isAxiosError(error) && error.response?.data) {
        setErrorMessage("Unable to sign in with the provided credentials.");
      } else {
        setErrorMessage("Something went wrong while signing in. Please try again.");
      }
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>{t("loginTitle")}</CardTitle>
          <CardDescription>
            Use your backend endpoint or keep this as starter boilerplate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                required
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              />
            </div>
            {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
            <Button className="w-full" type="submit" disabled={isSigningIn}>
              {isSigningIn ? "Signing in..." : t("signIn")}
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            New here?{" "}
            <Link
              to={routePaths.register}
              className="font-medium text-foreground underline underline-offset-4"
            >
              {t("register")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
