import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export type ChartPoint = { name: string; count: number };

const PRIMARY = "hsl(var(--primary))";
const PRIMARY_LIGHT = "hsl(var(--primary) / 0.6)";

function formatDateLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("fa-IR", { month: "short", day: "numeric", year: "2-digit" });
  } catch {
    return dateStr;
  }
}

export function RegisteredUsersChart({ data }: { data: ChartPoint[] }) {
  const chartData = (data || []).map((d) => ({
    ...d,
    count: Number(d.count) || 0,
    label: formatDateLabel(d.name),
  }));

  if (chartData.length === 0) return null;

  return (
    <div className="h-[260px] w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 12, right: 12, left: 0, bottom: 8 }}
          barSize={chartData.length <= 14 ? 28 : 20}
          barCategoryGap="12%"
        >
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={PRIMARY} stopOpacity={1} />
              <stop offset="100%" stopColor={PRIMARY_LIGHT} stopOpacity={0.85} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
          <XAxis
            dataKey="name"
            tickFormatter={formatDateLabel}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid hsl(var(--border))",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
            labelFormatter={formatDateLabel}
            formatter={(value: number) => [value?.toLocaleString?.("fa-IR") ?? value, "تعداد ثبت‌نام"]}
            labelStyle={{ fontFamily: "inherit" }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
            {chartData.map((_, index) => (
              <Cell key={index} fill="url(#barGradient)" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
