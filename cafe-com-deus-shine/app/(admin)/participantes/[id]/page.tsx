import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { Card } from "@/components/ui/Card";
import {
  getParticipant,
  getParticipantTimeline,
  listActiveLeadersForSelect,
} from "@/lib/services/participants.service";
import { PARTICIPANT_STATUS_BADGE, PARTICIPANT_STATUS_LABELS } from "@/lib/participant-status-labels";
import { Timeline } from "@/components/participantes/timeline";
import { AdminPanel } from "@/components/participantes/admin-panel";
import { ErasureRequestForm } from "@/components/participantes/erasure-request-form";
import { AttendanceHistory } from "@/components/participantes/attendance-history";
import { getParticipantAttendanceHistory } from "@/lib/services/attendance.service";
import { FollowUpForm } from "@/components/acompanhamento/followup-form";
import { FollowUpsList } from "@/components/acompanhamento/followups-list";
import { AttentionBadge } from "@/components/acompanhamento/attention-badge";
import { listFollowUps, computeAttentionAlerts } from "@/lib/services/followup.service";
import { CopySignupLink } from "@/components/participantes/copy-signup-link";
import { BackLink } from "@/components/ui/BackLink";

export default async function ParticipantePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [participant, timeline, leaders, attendance] = await Promise.all([
    getParticipant(id),
    getParticipantTimeline(id),
    listActiveLeadersForSelect(),
    getParticipantAttendanceHistory(id),
  ]);

  if (!participant) notFound();

  const [followUps, alertsMap] = await Promise.all([
    listFollowUps(id),
    computeAttentionAlerts([{ id: participant.id, status: participant.status }]),
  ]);
  const alerts = alertsMap.get(id);

  return (
    <div className="flex flex-col gap-6">
      <BackLink href="/participantes" label="Participantes" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-foreground">{participant.full_name}</h1>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${PARTICIPANT_STATUS_BADGE[participant.status]}`}
            >
              {PARTICIPANT_STATUS_LABELS[participant.status]}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Líder: {participant.leader?.full_name ?? "sem líder"} · Grupo:{" "}
            {participant.group?.name ?? "sem grupo"}
          </p>
          <div className="mt-2">
            <AttentionBadge alerts={alerts} />
          </div>
        </div>
        {!participant.anonymized_at && (
          <Link
            href={`/participantes/${id}/editar`}
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
            Os dados pessoais desta participante foram anonimizados em{" "}
            {new Date(participant.anonymized_at).toLocaleDateString("pt-BR")} a pedido do titular
            (LGPD). O histórico de jornada é preservado sem dados identificáveis.
          </p>
        </Card>
      ) : (
        <Card className="p-6">
          <p className="text-sm font-semibold text-foreground">Informações</p>
          <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <Info label="Telefone" value={participant.phone} />
            <Info label="WhatsApp" value={participant.whatsapp} />
            <Info label="E-mail" value={participant.email} />
            <Info label="Cidade / Bairro" value={[participant.city, participant.neighborhood].filter(Boolean).join(" / ")} />
            <Info label="Endereço" value={participant.address} />
            <Info label="Data de inscrição" value={new Date(participant.enrollment_date).toLocaleDateString("pt-BR")} />
          </dl>
        </Card>
      )}

      {!participant.anonymized_at && (
        <Card className="p-6">
          <p className="mb-3 text-sm font-semibold text-foreground">Acesso ao sistema</p>
          {participant.profile_id ? (
            <p className="text-sm text-muted-foreground">
              Acesso ativo — {participant.account?.email ?? "e-mail não encontrado"}
            </p>
          ) : participant.email ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Ela ainda não tem acesso. Peça para acessar o link abaixo e criar a própria senha
                usando o e-mail cadastrado: <span className="font-medium text-foreground">{participant.email}</span>.
              </p>
              <CopySignupLink />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Esta participante não tem e-mail cadastrado.{" "}
              <Link href={`/participantes/${id}/editar`} className="font-medium text-primary">
                Adicione um e-mail
              </Link>{" "}
              antes de pedir para ela criar o acesso.
            </p>
          )}
        </Card>
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
          <FollowUpForm participantId={id} basePath="/participantes" />
        </Card>
      )}

      <Card className="p-6">
        <p className="mb-3 text-sm font-semibold text-foreground">Acompanhamentos</p>
        <FollowUpsList followUps={followUps} />
      </Card>

      {!participant.anonymized_at && (
        <>
          <AdminPanel participant={participant} leaders={leaders} />
          <ErasureRequestForm participantId={id} isLeaderRoute={false} />
        </>
      )}
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
