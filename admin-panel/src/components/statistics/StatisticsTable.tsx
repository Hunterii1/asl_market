import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatisticsTableProps {
  data: Array<{
    category: string;
    value: number | string;
    change: number;
    trend: 'up' | 'down';
  }>;
  title: string;
}

export function StatisticsTable({ data, title }: StatisticsTableProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">دسته‌بندی</TableHead>
                <TableHead className="text-right">مقدار</TableHead>
                <TableHead className="text-right">تغییرات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.category}</TableCell>
                  <TableCell>{item.value}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.trend === 'up' ? (
                        <TrendingUp className="w-4 h-4 text-success" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-destructive" />
                      )}
                      <Badge
                        variant={item.trend === 'up' ? 'default' : 'destructive'}
                        className={cn(
                          item.trend === 'up' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                        )}
                      >
                        {item.change > 0 ? '+' : ''}{item.change}%
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

