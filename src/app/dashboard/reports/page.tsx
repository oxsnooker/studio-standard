import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-headline text-3xl md:text-4xl">Revenue Reports</h1>
      <Card>
        <CardHeader>
          <CardTitle>Daily & Weekly Reports</CardTitle>
          <CardDescription>
            Detailed reports on revenue from tables and snacks will be available here. (Coming Soon)
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
