import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    navigate({ to: "/rider/$iqama", params: { iqama: q } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      <header className="border-b border-border/50 bg-background/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Truck className="h-5 w-5" />
            </div>
            <span className="font-semibold">نظام تقارير المناديب</span>
          </div>
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ShieldCheck className="h-4 w-4" />
            دخول الإدارة
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col items-center px-6 pb-20 pt-20 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          نظام مباشر ومحدث شهرياً
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          استعلام تقارير المناديب
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground">
          أدخل رقم الإقامة الخاص بك لعرض تقاريرك الشهرية من الأداء والرواتب.
        </p>

        <form onSubmit={submit} className="mt-10 flex w-full max-w-xl flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="رقم الإقامة "
              className="h-12 pr-10 text-base"
              autoFocus
            />
          </div>
          <Button type="submit" size="lg" className="h-12 px-8">
            استعلام
          </Button>
        </form>

        <div className="mt-16 grid w-full max-w-2xl gap-4 sm:grid-cols-1">
          {[
            { title: "شهري", desc: "تقارير محدثة كل شهر" },
            { title: "شامل", desc: "أداء + راتب + خصومات" },
            { title: "آمن", desc: "بيانات محمية ومشفرة" },
            { title: "فئة", desc: "عرض فئة هنقر وما سبب الفئة" },
          ].map((it) => (
            <div
              key={it.title}
              className="rounded-xl border border-border/60 bg-card p-4 text-start"
            >
              <div className="text-sm font-semibold text-foreground">{it.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">{it.desc}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
