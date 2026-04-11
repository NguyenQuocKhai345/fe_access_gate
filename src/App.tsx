import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppErrorBoundary } from "@/components/error/app-error-boundary";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { router } from "@/app/router";
import { registerAccessTokenGetter } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";

const queryClient = new QueryClient();
registerAccessTokenGetter(() => useAuthStore.getState().token);

function App() {
  return (
    <AppErrorBoundary>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        storageKey="template-ui-theme"
      >
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <RouterProvider router={router} />
            <Toaster richColors />
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  );
}

export default App;
