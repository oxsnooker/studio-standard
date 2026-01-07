import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ExpensesPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-headline text-3xl md:text-4xl">Expense Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>Record Expenses</CardTitle>
          <CardDescription>
            Log and track all club expenses like rent, salaries, and maintenance. (Coming Soon)
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
