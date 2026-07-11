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

type View = "signin" | "forgot-request" | "forgot-verify";

function AuthPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // forgot password state
  const [resetEmail, setResetEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

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

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(resetEmail);
    setLoading(false);
    // رسالة عامة سواء البريد موجود أو لا، لأسباب أمنية
    toast.success("لو البريد الإلكتروني ده مسجل عندنا، هيوصلك كود عليه");
    setView("forgot-verify");
  };

  const verifyCodeAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error("كلمة المرور الجديدة لازم تكون 6 حروف على الأقل");
    setLoading(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: resetEmail,
      token: code,
      type: "recovery",
    });
    if (verifyError) {
      setLoading(false);
      return toast.error("الكود غلط أو منتهي، جرب تطلب كود جديد");
    }
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (updateError) return toast.error(updateError.message);
    toast.success("تم تغيير كلمة المرور بنجاح");
    navigate({ to: "/admin" });
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
            {view === "signin" && "سجل الدخول للوصول إلى إدارة التقارير"}
            {view === "forgot-request" && "أدخل بريدك الإلكتروني لإرسال كود إعادة التعيين"}
            {view === "forgot-verify" && "أدخل الكود وكلمة المرور الجديدة"}
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
                  setView("forgot-request");
                }}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
              >
                نسيت كلمة المرور؟
              </button>
            </form>
          )}

          {view === "forgot-request" && (
            <form onSubmit={requestCode} className="space-y-4 pt-2">
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
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "إرسال الكود"}
              </Button>
              <button
                type="button"
                onClick={() => setView("signin")}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
              >
                رجوع لتسجيل الدخول
              </button>
            </form>
          )}

          {view === "forgot-verify" && (
            <form onSubmit={verifyCodeAndReset} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="code">الكود المرسل على البريد</Label>
                <Input id="code" type="text" required value={code} onChange={(e) => setCode(e.target.value)} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    dir="ltr"
                    className="pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                    aria-label={showNewPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "تأكيد وتغيير كلمة المرور"}
              </Button>
              <button
                type="button"
                onClick={() => setView("forgot-request")}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
              >
                لم يصلك كود؟ إعادة الإرسال
              </button>
            </form>
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
