import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      appName: "Vite React Shadcn Template",
      homeTitle: "Production-ready starter for modern React apps",
      homeDescription:
        "Routing, auth flow, error boundaries, dark mode, and quality automation are all prewired.",
      dashboardTitle: "Dashboard",
      dashboardDescription: "This route is protected and accessible only after login.",
      loginTitle: "Sign in",
      registerTitle: "Create account",
      email: "Email",
      password: "Password",
      signIn: "Sign in",
      register: "Register",
      signOut: "Sign out",
      goHome: "Go to home",
      pageNotFound: "Page not found",
      protectedRouteHint: "Try opening /dashboard before login to test route protection.",
    },
  },
  hi: {
    translation: {
      appName: "Vite React Shadcn Template",
      homeTitle: "Modern React apps ke liye production-ready starter",
      homeDescription:
        "Routing, auth flow, error boundaries, dark mode aur quality automation sab prewired hain.",
      dashboardTitle: "Dashboard",
      dashboardDescription: "Yeh route protected hai aur login ke baad hi access hoga.",
      loginTitle: "Sign in",
      registerTitle: "Account banayein",
      email: "Email",
      password: "Password",
      signIn: "Sign in",
      register: "Register",
      signOut: "Sign out",
      goHome: "Home par jayein",
      pageNotFound: "Page nahi mili",
      protectedRouteHint:
        "Route protection test karne ke liye login se pehle /dashboard open karein.",
    },
  },
} as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
