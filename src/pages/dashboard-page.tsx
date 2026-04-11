import { useAuth } from "@/hook/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Protected dashboard</CardTitle>
        <CardDescription>
          This route is protected by auth state and available after successful login.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-sm text-muted-foreground">Signed in as:</p>
        <p className="font-medium">{user?.email ?? "demo@template.dev"}</p>
      </CardContent>
    </Card>
  );
};
