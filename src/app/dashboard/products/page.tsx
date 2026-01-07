import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ProductsPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-headline text-3xl md:text-4xl">Snacks & Drinks</h1>
      <Card>
        <CardHeader>
          <CardTitle>Product Management</CardTitle>
          <CardDescription>
            Add, edit, and manage all snacks, drinks, and other items. (Coming Soon)
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
