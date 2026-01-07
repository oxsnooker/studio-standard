import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function StockPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-headline text-3xl md:text-4xl">Stock Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>Inventory Tracking</CardTitle>
          <CardDescription>
            Manage stock levels for all products, including snacks, drinks, and other items. (Coming Soon)
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
