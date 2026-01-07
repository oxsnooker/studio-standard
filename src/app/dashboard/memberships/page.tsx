import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function MembershipsPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-headline text-3xl md:text-4xl">Membership Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>Membership Plans</CardTitle>
          <CardDescription>
            Create and manage membership plans and track member hours. (Coming Soon)
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
