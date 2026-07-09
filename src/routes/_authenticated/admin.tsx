import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  FileSpreadsheet,
  Loader2,
  LogOut,
  Trash2,
  Upload,
  Users,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { checkIsAdmin, deleteReport, uploadReport } from "@/lib/reports.functions";
import { parseExcelFile, monthLabel, MONTH_NAMES_AR } from "@/lib/excel";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAdminFn = useServerFn(checkIsAdmin);
  const uploadFn = useServerFn(uploadReport);
  const deleteFn = useServerFn(deleteReport);

  const adminCheck = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => isAdminFn(),
  });

  const reportsQuery = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("year", { ascending: false })
        .order("month", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const now = new Date();
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());
  const [file, setFile] = useState<File | null>(null);
  const [replace, setReplace] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const years = useMemo(() => {
    const y = now.getFullYear();
    return [y - 2, y - 1, y, y + 1];
  }, [now]);

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error("اختر ملف Excel");
    setUploading(true);
    try {
      const parsed = await parseExcelFile(file);
      if (!parsed.iqamaColumn) {
        throw new Error(
          "لم يتم العثور على عمود رقم الإقامة في الملف. تأكد من وجود عمود مثل: رقم الإقامة / Iqama / ID",
        );
      }
      if (parsed.rows.length === 0) throw new Error("الملف فارغ");

      // Upload raw file to storage
      const path = `${year}/${String(month).padStart(2, "0")}-${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage
        .from("reports")
        .upload(path, file, { upsert: true });
      if (upErr) throw new Error(upErr.message);

      const res = await uploadFn({
        data: {
          month,
          year,
          fileName: file.name,
          storagePath: path,
          headers: parsed.headers,
          iqamaColumn: parsed.iqamaColumn,
          nameColumn: parsed.nameColumn,
          rows: parsed.rows as Record<string, unknown>[],
          replace,
        },
      });
      toast.success(`تم رفع التقرير بنجاح (${res.count} مندوب)`);
      setFile(null);
      setReplace(false);
      if (fileRef.current) fileRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.message ?? "فشل الرفع");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFn({ data: { id } });
      toast.success("تم حذف التقرير");
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.message ?? "فشل الحذف");
    }
  };

  if (adminCheck.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!adminCheck.data?.isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="mx-auto mb-3 h-10 w-10 text-destructive" />
            <h3 className="text-lg font-semibold">غير مصرح</h3>
            <p className="mt-2 text-sm text-muted-foreground">حسابك لا يملك صلاحيات الإدارة.</p>
            <Button variant="outline" className="mt-4" onClick={signOut}>
              تسجيل الخروج
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalRiders = reportsQuery.data?.reduce((s, r) => s + (r.rider_count ?? 0), 0) ?? 0;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold">لوحة إدارة التقارير</h1>
            <p className="text-xs text-muted-foreground">إدارة تقارير المناديب الشهرية</p>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="ms-2 h-4 w-4" />
            خروج
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="عدد التقارير"
            value={reportsQuery.data?.length ?? 0}
            icon={FileSpreadsheet}
          />

          <StatCard
            label="آخر تقرير"
            value={
              reportsQuery.data?.[0]
                ? monthLabel(reportsQuery.data[0].month, reportsQuery.data[0].year)
                : "—"
            }
            icon={CheckCircle2}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              رفع تقرير جديد
            </CardTitle>
            <CardDescription>اختر الشهر والسنة ثم ارفع ملف Excel</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>الشهر</Label>
                <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES_AR.map((n, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {n} ({String(i + 1).padStart(2, "0")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>السنة</Label>
                <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>ملف Excel</Label>
                <Input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <div className="md:col-span-4 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={replace} onCheckedChange={(v) => setReplace(v === true)} />
                  استبدال إذا كان يوجد تقرير لنفس الشهر
                </label>
                <Button type="submit" disabled={uploading || !file}>
                  {uploading ? (
                    <>
                      <Loader2 className="ms-2 h-4 w-4 animate-spin" />
                      جاري الرفع...
                    </>
                  ) : (
                    <>
                      <Upload className="ms-2 h-4 w-4" />
                      رفع التقرير
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>التقارير المرفوعة</CardTitle>
          </CardHeader>
          <CardContent>
            {reportsQuery.isLoading && (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {reportsQuery.data && reportsQuery.data.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                لا توجد تقارير بعد. ارفع أول تقرير أعلاه.
              </p>
            )}
            {reportsQuery.data && reportsQuery.data.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الشهر</TableHead>
                    <TableHead>السنة</TableHead>
                    <TableHead>اسم الملف</TableHead>
                    <TableHead>عدد المناديب</TableHead>
                    <TableHead>تاريخ الرفع</TableHead>
                    <TableHead className="text-end">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportsQuery.data.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{MONTH_NAMES_AR[r.month - 1]}</TableCell>
                      <TableCell>{r.year}</TableCell>
                      <TableCell className="max-w-xs truncate">{r.file_name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{r.rider_count}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString("ar-SA")}
                      </TableCell>
                      <TableCell className="text-end">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>حذف التقرير؟</AlertDialogTitle>
                              <AlertDialogDescription>
                                سيتم حذف تقرير {monthLabel(r.month, r.year)} وجميع بيانات المناديب
                                المرتبطة به. لا يمكن التراجع.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDelete(r.id)}
                              >
                                حذف
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between pt-6">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="mt-1 text-2xl font-bold">{value}</div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
