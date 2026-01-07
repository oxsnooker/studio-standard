import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function StaffPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-headline text-3xl md:text-4xl">Staff Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>Staff Accounts</CardTitle>
          <CardDescription>
            Create and manage staff accounts and view activity logs. (Coming Soon)
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
