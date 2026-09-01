import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { getParticipant, getParticipantTimeline } from "@/lib/services/participants.service";
import { PARTICIPANT_STATUS_BADGE, PARTICIPANT_STATUS_LABELS } from "@/lib/participant-status-labels";
import { Timeline } from "@/components/participantes/timeline";
import { ErasureRequestForm } from "@/components/participantes/erasure-request-form";
import { AttendanceHistory } from "@/components/participantes/attendance-history";
import { getParticipantAttendanceHistory } from "@/lib/services/attendance.service";
import { FollowUpForm } from "@/components/acompanhamento/followup-form";
import { FollowUpsList } from "@/components/acompanhamento/followups-list";
import { AttentionBadge } from "@/components/acompanhamento/attention-badge";
import { ContactStatusTracker } from "@/components/acompanhamento/contact-status-tracker";
import { listFollowUps, computeAttentionAlerts } from "@/lib/services/followup.service";
import { listContactStatusHistory } from "@/lib/services/contact-status.service";
import { ContactButtons } from "@/components/participantes/contact-buttons";
import { CONTACT_STATUS_BADGE, CONTACT_STATUS_LABELS } from "@/lib/participant-status-labels";
import { BackLink } from "@/components/ui/BackLink";

export default async function MinhaParticipantePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [participant, timeline, attendance] = await Promise.all([
    getParticipant(id),
    getParticipantTimeline(id),
    getParticipantAttendanceHistory(id),
  ]);

  if (!participant) notFound();

  const [followUps, alertsMap, contactHistory] = await Promise.all([
    listFollowUps(id),
    computeAttentionAlerts([{ id: participant.id, status: participant.status }]),
    listContactStatusHistory(id),
  ]);
  const alerts = alertsMap.get(id);

  return (
    <div className="flex flex-col gap-6">
      <BackLink href="/minhas-participantes" label="Minhas participantes" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-foreground">{participant.full_name}</h1>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${PARTICIPANT_STATUS_BADGE[participant.status]}`}
            >
              {PARTICIPANT_STATUS_LABELS[participant.status]}
            </span>
            {!participant.anonymized_at && (
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${CONTACT_STATUS_BADGE[participant.contact_status]}`}
              >
                {CONTACT_STATUS_LABELS[participant.contact_status]}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Grupo: {participant.group?.name ?? "sem grupo"}
          </p>
          <div className="mt-2">
            <AttentionBadge alerts={alerts} />
          </div>
        </div>
        {!participant.anonymized_at && (
          <Link
            href={`/minhas-participantes/${id}/editar`}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            <Pencil size={15} />
            Editar
          </Link>
        )}
      </div>

      {participant.anonymized_at ? (
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">
            Os dados pessoais desta participante foram anonimizados a pedido do titular (LGPD).
          </p>
        </Card>
      ) : (
        <>
          <ContactButtons whatsapp={participant.whatsapp} phone={participant.phone} />

          <Card className="p-6">
            <p className="text-sm font-semibold text-foreground">Informações</p>
            <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <Info label="Telefone" value={participant.phone} />
              <Info label="WhatsApp" value={participant.whatsapp} />
              <Info label="Cidade / Bairro" value={[participant.city, participant.neighborhood].filter(Boolean).join(" / ")} />
            </dl>
          </Card>

          <ContactStatusTracker
            participantId={id}
            currentStatus={participant.contact_status}
            history={contactHistory}
            basePath="/minhas-participantes"
          />
        </>
      )}

      <Card className="p-6">
        <p className="text-sm font-semibold text-foreground">Jornada</p>
        <div className="mt-3">
          <Timeline entries={timeline} />
        </div>
      </Card>

      <Card className="p-6">
        <p className="mb-3 text-sm font-semibold text-foreground">Presença</p>
        <AttendanceHistory history={attendance} />
      </Card>

      {!participant.anonymized_at && (
        <Card className="p-6">
          <p className="mb-3 text-sm font-semibold text-foreground">Registrar acompanhamento</p>
          <FollowUpForm participantId={id} basePath="/minhas-participantes" />
        </Card>
      )}

      <Card className="p-6">
        <p className="mb-3 text-sm font-semibold text-foreground">Acompanhamentos</p>
        <FollowUpsList followUps={followUps} />
      </Card>

      {!participant.anonymized_at && <ErasureRequestForm participantId={id} isLeaderRoute />}
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value || "—"}</dd>
    </div>
  );
}
