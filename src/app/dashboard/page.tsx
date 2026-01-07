'use client';

import { SummaryCard } from "@/components/dashboard/summary-card";
import { DollarSign, LayoutGrid, Hourglass, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

const chartData = [
  { day: "Mon", revenue: 550 },
  { day: "Tue", revenue: 720 },
  { day: "Wed", revenue: 890 },
  { day: "Thu", revenue: 680 },
  { day: "Fri", revenue: 1100 },
  { day: "Sat", revenue: 1500 },
  { day: "Sun", revenue: 1300 },
];

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig;

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-headline text-3xl md:text-4xl">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard 
          title="Today's Revenue" 
          value="$1,345" 
          icon={DollarSign} 
          change="+15% from yesterday" 
        />
        <SummaryCard 
          title="Tables Running" 
          value="4 / 6" 
          icon={LayoutGrid} 
          change="66% occupancy" 
        />
        <SummaryCard 
          title="Avg. Session" 
          value="1h 25m" 
          icon={Hourglass} 
          change="-5m from yesterday" 
        />
        <SummaryCard 
          title="Today's Profit" 
          value="$980" 
          icon={TrendingUp} 
          change="Expenses: $365" 
          isProfit={true} 
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Weekly Revenue</CardTitle>
          <CardDescription>A summary of revenue over the past 7 days.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="day"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
