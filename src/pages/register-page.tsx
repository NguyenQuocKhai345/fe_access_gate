import { isAxiosError } from "axios";
import type { FormEvent } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hook/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { routePaths } from "@/config/route-paths";

type RegisterFormState = {
  email: string;
  password: string;
};

const initialState: RegisterFormState = {
  email: "",
  password: "",
};

export const RegisterPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isRegistering, register } = useAuth();

  const [form, setForm] = useState<RegisterFormState>(initialState);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    try {
      await register(form);
      navigate(routePaths.dashboard, { replace: true });
    } catch (error) {
      if (isAxiosError(error) && error.response?.data) {
        setErrorMessage("Unable to create account with the provided details.");
      } else {
        setErrorMessage("Something went wrong while creating your account.");
      }
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>{t("registerTitle")}</CardTitle>
          <CardDescription>
            Plug in your backend endpoint to complete the signup flow.
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
                minLength={8}
                required
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              />
            </div>
            {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
            <Button className="w-full" type="submit" disabled={isRegistering}>
              {isRegistering ? "Creating account..." : t("register")}
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            Already registered?{" "}
            <Link
              to={routePaths.login}
              className="font-medium text-foreground underline underline-offset-4"
            >
              {t("signIn")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
