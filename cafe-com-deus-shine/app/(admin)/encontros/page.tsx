import Link from "next/link";
import { Plus } from "lucide-react";
import { listMeetings } from "@/lib/services/meetings.service";
import { MeetingsList } from "@/components/encontros/meetings-list";

export default async function EncontrosPage() {
  const meetings = await listMeetings();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Encontros</h1>
        <Link
          href="/encontros/novo"
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          <Plus size={16} />
          Novo encontro
        </Link>
      </div>
      <div className="mt-4">
        <MeetingsList meetings={meetings} basePath="/encontros" />
      </div>
    </div>
  );
}
