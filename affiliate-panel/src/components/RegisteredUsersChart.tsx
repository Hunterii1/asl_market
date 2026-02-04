import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";

export type ChartPoint = { name: string; count: number };

const TEAL = "#14b8a6";

function formatDateLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("fa-IR", { month: "numeric", day: "numeric" });
  } catch {
    return dateStr;
  }
}

type TimeRange = "all" | "month" | "week";

export function RegisteredUsersChart({ data }: { data: ChartPoint[] }) {
  const [range, setRange] = useState<TimeRange>("all");

  const chartData = useMemo(() => {
    const raw = (data || []).map((d) => ({
      ...d,
      count: Number(d.count) || 0,
      label: formatDateLabel(d.name),
    }));
    if (range === "week") return raw.slice(-7);
    if (range === "month") return raw.slice(-30);
    return raw;
  }, [data, range]);

  if ((data || []).length === 0) return null;

  return (
    <div className="h-[280px] w-full" dir="ltr">
      {/* هدر: سمت راست عنوان و آیکن، سمت چپ دکمه‌های بازه */}
      <div className="flex items-start justify-between gap-4 mb-4" dir="rtl">
        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-1">
          {(["all", "month", "week"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                range === r
                  ? "bg-teal-500/90 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              {r === "all" ? "همه" : r === "month" ? "ماه" : "هفته"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-teal-500/10 p-1.5">
            <TrendingUp className="h-4 w-4 text-teal-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">ثبت‌نام روزانه</p>
            <p className="text-xs text-muted-foreground">تعداد کاربران ثبت‌نام‌شده</p>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={TEAL} stopOpacity={0.5} />
              <stop offset="100%" stopColor={TEAL} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--muted-foreground) / 0.2)"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tickFormatter={formatDateLabel}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toLocaleString("fa-IR")}K` : String(v))}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid hsl(var(--border))",
              boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
              background: "hsl(var(--card))",
            }}
            labelFormatter={formatDateLabel}
            formatter={(value: number) => [
              value?.toLocaleString?.("fa-IR") ?? value,
              "تعداد ثبت‌نام",
            ]}
            labelStyle={{ fontFamily: "inherit" }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke={TEAL}
            strokeWidth={2}
            fill="url(#areaGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
