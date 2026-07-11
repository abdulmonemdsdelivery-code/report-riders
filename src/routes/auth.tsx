import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

type View = "signin" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("تم تسجيل الدخول");
    navigate({ to: "/admin" });
  };

  const sendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    // رسالة عامة سواء البريد موجود عندنا أو لا، لأسباب أمنية
    setResetSent(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary/5 via-background to-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle>لوحة الإدارة</CardTitle>
          <CardDescription>
            {view === "signin" ? "سجل الدخول للوصول إلى إدارة التقارير" : "أدخل بريدك الإلكتروني لإرسال رابط إعادة التعيين"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {view === "signin" && (
            <form onSubmit={signIn} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    dir="ltr"
                    className="pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                    aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "دخول"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email);
                  setResetSent(false);
                  setView("forgot");
                }}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
              >
                نسيت كلمة المرور؟
              </button>
            </form>
          )}

          {view === "forgot" && (
            <div className="space-y-4 pt-2">
              {resetSent ? (
                <p className="text-sm text-center text-muted-foreground">
                  لو البريد الإلكتروني ده مسجل عندنا، هيوصلك رابط لتغيير كلمة المرور. افتح الإيميل ودوس على الرابط.
                </p>
              ) : (
                <form onSubmit={sendResetLink} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="resetEmail">البريد الإلكتروني</Label>
                    <Input
                      id="resetEmail"
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      dir="ltr"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "إرسال رابط إعادة التعيين"}
                  </Button>
                </form>
              )}
              <button
                type="button"
                onClick={() => setView("signin")}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
              >
                رجوع لتسجيل الدخول
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
              العودة إلى صفحة الاستعلام
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
