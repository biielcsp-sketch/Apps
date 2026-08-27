import { Card } from "@/components/ui/Card";

export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="border-primary p-4">
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}
