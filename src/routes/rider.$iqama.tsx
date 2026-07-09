import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowRight, Calendar, Loader2, Search, User } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { monthLabel } from "@/lib/excel";

const search = z.object({
  reportId: z.string().uuid().optional(),
});

export const Route = createFileRoute("/rider/$iqama")({
  validateSearch: search,
  component: RiderPage,
});

function RiderPage() {
  const { iqama } = Route.useParams();
  const { reportId } = Route.useSearch();
  const navigate = useNavigate();
  const [query, setQuery] = useState(iqama);

  const riderQuery = useQuery({
    queryKey: ["rider", iqama],
    queryFn: async () => {
      const { data: rider, error } = await supabase
        .from("riders")
        .select("id, iqama_number, rider_name")
        .eq("iqama_number", iqama)
        .maybeSingle();
      if (error) throw error;
      if (!rider) return null;
      const { data: reports } = await supabase
        .from("rider_reports")
        .select("report_id, reports!inner(id, month, year, file_name)")
        .eq("rider_id", rider.id)
        .order("year", { referencedTable: "reports", ascending: false })
        .order("month", { referencedTable: "reports", ascending: false });
      return { rider, reports: reports ?? [] };
    },
  });

  const reportData = useQuery({
    queryKey: ["rider-report", iqama, reportId],
    enabled: !!reportId && !!riderQuery.data?.rider,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rider_reports")
        .select("data, columns, reports!inner(month, year, file_name)")
        .eq("rider_id", riderQuery.data!.rider.id)
        .eq("report_id", reportId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate({ to: "/rider/$iqama", params: { iqama: q }, search: {} });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      <header className="border-b border-border/50 bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowRight className="ms-1 inline h-4 w-4" />
            العودة
          </Link>
          {/* <form onSubmit={submit} className="flex flex-1 max-w-md gap-2 mx-4">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="رقم الإقامة"
                className="pr-9"
              />
            </div>
            <Button type="submit">استعلام</Button>
          </form> */}
          <div className="w-16" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {riderQuery.isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!riderQuery.isLoading && !riderQuery.data && (
          <Card className="mx-auto max-w-md text-center">
            <CardContent className="pt-8 pb-8">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">لم يتم العثور على المندوب</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                لا توجد بيانات مسجلة برقم الإقامة: <span className="font-mono">{iqama}</span>
              </p>
            </CardContent>
          </Card>
        )}

        {riderQuery.data && (
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <aside className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">المندوب</div>
                      <div className="font-semibold">{riderQuery.data.rider.rider_name || "—"}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">رقم الإقامة</div>
                  <div className="font-mono text-sm">{riderQuery.data.rider.iqama_number}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">الأشهر المتاحة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {riderQuery.data.reports.length === 0 && (
                    <div className="text-sm text-muted-foreground">لا توجد تقارير</div>
                  )}
                  {riderQuery.data.reports.map((r) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const rep = r.reports as any;
                    const active = reportId === rep.id;
                    return (
                      <Link
                        key={rep.id}
                        to="/rider/$iqama"
                        params={{ iqama }}
                        search={{ reportId: rep.id }}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
                          active
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border hover:bg-accent"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {monthLabel(rep.month, rep.year)}
                        </span>
                        {active && <Badge variant="secondary">مفتوح</Badge>}
                      </Link>
                    );
                  })}
                </CardContent>
              </Card>
            </aside>

            <section>
              {!reportId && (
                <Card>
                  <CardContent className="py-20 text-center">
                    <Calendar className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">اختر شهراً لعرض التقرير</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      اضغط على أحد الأشهر في القائمة الجانبية.
                    </p>
                  </CardContent>
                </Card>
              )}
              {reportId && reportData.isLoading && (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              {reportId && reportData.data && (
                <ReportView data={reportData.data as unknown as RiderReportView} />
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

interface RiderReportView {
  data: Record<string, unknown>;
  columns: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reports: any;
}

function isNumericLike(v: unknown): v is number {
  if (typeof v === "number") return Number.isFinite(v);
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return true;
  return false;
}

const HIGHLIGHT_KEYS = {
  total: ["total", "orders", "الطلبات", "إجمالي", "اجمالي", "deliveries", "التوصيلات"],
  hours: ["hour", "ساعات", "ساعة"],
  salary: ["net", "salary", "راتب", "صافي", "المستحق"],
};

function pickMetric(data: Record<string, unknown>, keys: string[]) {
  const lower = Object.keys(data).map((k) => [k, k.toLowerCase()] as const);
  for (const key of keys) {
    const hit = lower.find(([, l]) => l.includes(key.toLowerCase()));
    if (hit && isNumericLike(data[hit[0]])) {
      return { label: hit[0], value: data[hit[0]] };
    }
  }
  return null;
}

function ReportView({ data }: { data: RiderReportView }) {
  const rowData = data.data;
  const columns = useMemo(() => {
    if (Array.isArray(data.columns) && data.columns.length > 0) return data.columns;
    return Object.keys(rowData);
  }, [data.columns, rowData]);

  const metrics = [
    { label: "إجمالي الطلبات", metric: pickMetric(rowData, HIGHLIGHT_KEYS.total) },
    { label: "ساعات العمل", metric: pickMetric(rowData, HIGHLIGHT_KEYS.hours) },
    { label: "صافي الراتب", metric: pickMetric(rowData, HIGHLIGHT_KEYS.salary) },
  ].filter((m) => m.metric);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const report = data.reports as any;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">تقرير</div>
          <h2 className="text-2xl font-bold">{monthLabel(report.month, report.year)}</h2>
        </div>
        <Badge variant="outline" className="font-mono text-xs">
          {report.file_name}
        </Badge>
      </div>

      {metrics.length > 0 && (
        <div className="sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((m, i) => (
            <Card
              key={i}
              className="border-primary/20 mb-1 bg-gradient-to-br from-primary/5 to-transparent"
            >
              <CardContent className="pt-6">
                <div className="text-xs text-muted-foreground">{m.label}</div>
                <div className="mt-1 text-2xl font-bold tabular-nums">
                  {String(m.metric!.value)}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{m.metric!.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">جميع بيانات الشهر</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {columns.map((col) => {
              const val = rowData[col];
              if (val === undefined || val === null || val === "") return null;
              return (
                <div key={col} className="rounded-lg border border-border/60 bg-background p-3">
                  <div className="text-xs text-muted-foreground">{col}</div>
                  <div className="mt-1 truncate font-medium tabular-nums" title={String(val)}>
                    {String(val)}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
