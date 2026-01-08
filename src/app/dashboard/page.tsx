'use client';

import { useMemo } from 'react';
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
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Bill, BilliardTable } from '@/lib/types';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig;

export default function DashboardPage() {
  const firestore = useFirestore();

  // Fetch bills from the last 7 days for the chart
  const sevenDaysAgo = useMemo(() => startOfDay(subDays(new Date(), 6)), []);
  const billsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'bills'),
      where('billDate', '>=', sevenDaysAgo.toISOString())
    );
  }, [firestore, sevenDaysAgo]);
  const { data: bills, isLoading: isLoadingBills } = useCollection<Bill>(billsQuery);

  // Fetch all tables
  const tablesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'tables');
  }, [firestore]);
  const { data: tables, isLoading: isLoadingTables } = useCollection<BilliardTable>(tablesQuery);

  // Calculate metrics
  const dashboardData = useMemo(() => {
    if (!bills || !tables) return null;
    
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const todayBills = bills.filter(bill => {
        const billDate = new Date(bill.billDate);
        return billDate >= todayStart && billDate <= todayEnd;
    });

    const todaysRevenue = todayBills.reduce((sum, bill) => sum + bill.totalAmount, 0);

    const tablesInUse = tables.filter(table => table.status === 'in-use').length;
    const totalTables = tables.length;
    const occupancy = totalTables > 0 ? Math.round((tablesInUse / totalTables) * 100) : 0;
    
    // Prepare data for the weekly chart
    const weeklyRevenue = Array.from({ length: 7 }, (_, i) => {
        const date = startOfDay(subDays(new Date(), i));
        const dayBills = bills.filter(bill => {
            const billDate = new Date(bill.billDate);
            return startOfDay(billDate).getTime() === date.getTime();
        });
        const total = dayBills.reduce((sum, bill) => sum + bill.totalAmount, 0);
        return {
            day: format(date, 'EEE'),
            revenue: total,
        };
    }).reverse();


    return {
      todaysRevenue,
      tablesInUse,
      totalTables,
      occupancy,
      weeklyRevenue,
    };
  }, [bills, tables]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-headline text-3xl md:text-4xl">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard 
          title="Today's Revenue" 
          value={`₹${dashboardData?.todaysRevenue.toFixed(2) || '0.00'}`}
          icon={DollarSign} 
          change={isLoadingBills ? 'Loading...' : `${dashboardData?.weeklyRevenue.find(d => d.day === format(new Date(), 'EEE'))?.revenue ? '' : 'No'} sales today`}
        />
        <SummaryCard 
          title="Tables Running" 
          value={isLoadingTables ? '... / ...' : `${dashboardData?.tablesInUse} / ${dashboardData?.totalTables}`} 
          icon={LayoutGrid} 
          change={`${dashboardData?.occupancy || 0}% occupancy`} 
        />
        <SummaryCard 
          title="Avg. Session" 
          value="--" 
          icon={Hourglass} 
          change="Data coming soon" 
        />
        <SummaryCard 
          title="Today's Profit" 
          value="--" 
          icon={TrendingUp} 
          change="Data coming soon" 
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
            <BarChart accessibilityLayer data={dashboardData?.weeklyRevenue}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="day"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
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
