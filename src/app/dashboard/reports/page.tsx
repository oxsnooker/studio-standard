'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, DollarSign, CreditCard, Utensils, Hourglass } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, startOfDay, endOfDay } from 'date-fns';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Bill } from '@/lib/types';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Skeleton } from '@/components/ui/skeleton';


interface ReportData {
  totalRevenue: number;
  tableRevenue: number;
  productRevenue: number;
  cashPayments: number;
  upiPayments: number;
  totalTransactions: number;
}

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--accent))",
  },
  cash: {
    label: "Cash",
    color: "hsl(var(--primary))",
  },
  upi: {
    label: "UPI",
    color: "hsl(var(--secondary))",
  }
} satisfies ChartConfig;


export default function ReportsPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [isDatePickerOpen, setDatePickerOpen] = useState(false);
  const firestore = useFirestore();

  const billsQuery = useMemoFirebase(() => {
    if (!firestore || !date) return null;
    const start = startOfDay(date);
    const end = endOfDay(date);
    return query(
      collection(firestore, 'bills'),
      where('billDate', '>=', start.toISOString()),
      where('billDate', '<=', end.toISOString())
    );
  }, [firestore, date]);

  const { data: bills, isLoading } = useCollection<Bill>(billsQuery);

  const reportData: ReportData | null = useMemo(() => {
    if (!bills) return null;

    return bills.reduce(
      (acc, bill) => {
        const tableRev = bill.tableBill || 0;
        const productRev = bill.itemsBill || 0;
        
        acc.totalRevenue += bill.totalAmount;
        acc.tableRevenue += tableRev;
        acc.productRevenue += productRev;
        acc.totalTransactions += 1;

        if (bill.paymentMethod === 'cash') {
          acc.cashPayments += bill.amountPaid;
        } else if (bill.paymentMethod === 'upi') {
          acc.upiPayments += bill.amountPaid;
        }
        
        return acc;
      },
      {
        totalRevenue: 0,
        tableRevenue: 0,
        productRevenue: 0,
        cashPayments: 0,
        upiPayments: 0,
        totalTransactions: 0,
      }
    );
  }, [bills]);
  
  const chartData = [
    { type: 'Table', revenue: reportData?.tableRevenue || 0 },
    { type: 'Products', revenue: reportData?.productRevenue || 0 },
  ];

  const paymentChartData = [
      { type: 'Cash', value: reportData?.cashPayments || 0 },
      { type: 'UPI', value: reportData?.upiPayments || 0 },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="font-headline text-3xl md:text-4xl">Revenue Reports</h1>
        <Popover open={isDatePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[280px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(day) => {
                if (day) {
                    setDate(day)
                    setDatePickerOpen(false)
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      
      {isLoading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => <Card key={i}><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-10 w-1/2" /></CardContent></Card>)}
          </div>
      )}

      {!isLoading && reportData && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${reportData.totalRevenue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">{reportData.totalTransactions} transactions</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Table Revenue</CardTitle>
                        <Hourglass className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${reportData.tableRevenue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">From table sessions</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Product Revenue</CardTitle>
                        <Utensils className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${reportData.productRevenue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">From snacks & drinks</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Payments</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold">Cash: ${reportData.cashPayments.toFixed(2)}</div>
                        <div className="text-lg font-bold">UPI: ${reportData.upiPayments.toFixed(2)}</div>
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue Breakdown</CardTitle>
                        <CardDescription>Comparison of revenue sources.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[250px] w-full">
                            <BarChart accessibilityLayer data={chartData} layout="vertical">
                                <CartesianGrid horizontal={false} />
                                <XAxis type="number" dataKey="revenue" hide />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent indicator="dot" />}
                                />
                                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={5} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Payment Methods</CardTitle>
                        <CardDescription>How customers paid.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <ChartContainer config={chartConfig} className="h-[250px] w-full">
                            <BarChart accessibilityLayer data={paymentChartData} layout="vertical">
                                <CartesianGrid horizontal={false} />
                                <XAxis type="number" dataKey="value" hide />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent indicator="dot" />}
                                />
                                <Bar dataKey="value" radius={5}>
                                    {paymentChartData.map(entry => (
                                        <div key={entry.type} style={{backgroundColor: entry.type === 'Cash' ? 'var(--color-cash)' : 'var(--color-upi)'}}></div>
                                    ))}
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
          </>
      )}

      {!isLoading && bills?.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No Data</CardTitle>
            <CardDescription>
              There is no sales data available for {date ? format(date, "PPP") : 'the selected date'}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Please select another date to view reports.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
