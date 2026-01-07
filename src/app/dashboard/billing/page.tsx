import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function BillingPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-headline text-3xl md:text-4xl">Billing History</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Bills</CardTitle>
          <CardDescription>
            A complete log of all past bills will be displayed here. (Coming Soon)
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
