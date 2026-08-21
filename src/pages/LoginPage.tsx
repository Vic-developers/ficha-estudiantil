import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { siteConfig } from "@/config/site";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function LoginPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signIn, signUp } = useAuth();

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "register" && !name.trim()) {
      toast.error("El nombre es obligatorio.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.");
      setLoading(false);
      return;
    }

    const result =
      mode === "login"
        ? await signIn(email.trim(), password)
        : await signUp(name.trim(), email.trim(), password);

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    if (mode === "register") {
      toast.success(
        "Cuenta creada. Un administrador debe aprobarla antes de que puedas iniciar sesión."
      );
      setMode("login");
      setLoading(false);
      return;
    }

    toast.success("Sesión iniciada.");
    navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-subtle">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{siteConfig.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {siteConfig.description}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-card">
          <Tabs
            value={mode}
            onValueChange={(v) => setMode(v as "login" | "register")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
              <TabsTrigger value="register">Registrarse</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    autoComplete="name"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
              </Button>
            </form>
          </Tabs>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Los nuevos usuarios se registran con rol de consulta y quedan
          pendientes hasta que un administrador los apruebe. Un administrador
          puede asignar permisos desde Usuarios.
        </p>
      </div>
    </div>
  );
}