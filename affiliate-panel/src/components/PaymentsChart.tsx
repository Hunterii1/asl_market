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
import { Wallet } from "lucide-react";
import {
  formatJalaliShort,
  formatJalaliLong,
  isInCurrentJalaliMonth,
  isInCurrentWeek,
} from "@/lib/jalali";

export type PaymentsChartPoint = { name: string; amount: number; count?: number };

const ORANGE = "#f97316";

type TimeRange = "all" | "month" | "week";

function formatToman(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toLocaleString("fa-IR")}M`;
  if (value >= 1000) return `${(value / 1000).toLocaleString("fa-IR")}K`;
  return value?.toLocaleString?.("fa-IR") ?? "0";
}

export function PaymentsChart({ data }: { data: PaymentsChartPoint[] }) {
  const [range, setRange] = useState<TimeRange>("all");

  const chartData = useMemo(() => {
    const raw = (data || []).map((d) => ({
      name: d.name,
      amount: Number(d.amount ?? d.count ?? 0) || 0,
    }));
    if (range === "week") return raw.filter((d) => isInCurrentWeek(d.name));
    if (range === "month") return raw.filter((d) => isInCurrentJalaliMonth(d.name));
    return raw;
  }, [data, range]);

  if ((data || []).length === 0) return null;

  const dateRangeText =
    chartData.length > 0
      ? chartData.length === 1
        ? formatJalaliLong(chartData[0].name)
        : `از ${formatJalaliLong(chartData[0].name)} تا ${formatJalaliLong(chartData[chartData.length - 1].name)}`
      : null;

  return (
    <div className="w-full min-w-0" dir="ltr">
      <div className="flex items-start justify-between gap-4 mb-4" dir="rtl">
        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-1">
          {(["all", "month", "week"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                range === r
                  ? "bg-orange-500/90 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              {r === "all" ? "همه" : r === "month" ? "ماه" : "هفته"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <div className="rounded-lg bg-orange-500/10 p-1.5 shrink-0">
            <Wallet className="h-4 w-4 text-orange-500" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">پرداخت‌ها بر اساس روز</p>
            <p className="text-xs text-muted-foreground">مبلغ پرداخت‌های تأییدشده (تومان)</p>
            {dateRangeText && (
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                {dateRangeText}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="h-[260px] w-full pr-1 pb-1" style={{ minHeight: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 12, right: 16, left: 8, bottom: 12 }}
          >
            <defs>
              <linearGradient id="paymentsAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ORANGE} stopOpacity={0.5} />
                <stop offset="100%" stopColor={ORANGE} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--muted-foreground) / 0.2)"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tickFormatter={formatJalaliShort}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              tickFormatter={(v) => formatToman(Number(v))}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid hsl(var(--border))",
                boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                background: "hsl(var(--card))",
              }}
              labelFormatter={formatJalaliLong}
              formatter={(value: number) => [
                `${Number(value).toLocaleString("fa-IR")} تومان`,
                "مبلغ",
              ]}
              labelStyle={{ fontFamily: "inherit" }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke={ORANGE}
              strokeWidth={2}
              fill="url(#paymentsAreaGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
