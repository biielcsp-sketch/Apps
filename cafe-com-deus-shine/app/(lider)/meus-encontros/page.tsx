import Link from "next/link";
import { Plus } from "lucide-react";
import { listMeetings } from "@/lib/services/meetings.service";
import { MeetingsList } from "@/components/encontros/meetings-list";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function EncontrosPage() {
  const meetings = await listMeetings();

  return (
    <div>
      <PageHeader title="Encontros">
        <Link
          href="/meus-encontros/novo"
          className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          <Plus size={16} />
          Novo encontro
        </Link>
      </PageHeader>
      <div className="mt-4">
        <MeetingsList meetings={meetings} basePath="/meus-encontros" />
      </div>
    </div>
  );
}
