"use client";

import { useState, useTransition } from "react";
import { CONTACT_STATUS_ORDER, CONTACT_STATUS_LABELS } from "@/lib/participant-status-labels";
import { logContactStatusAction } from "@/app/actions/contact-status";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { Enums } from "@/types/database.types";
import type { ContactStatusHistoryEntry } from "@/lib/services/contact-status.service";

export function ContactStatusTracker({
  participantId,
  currentStatus,
  history,
  basePath,
}: {
  participantId: string;
  currentStatus: Enums<"contact_status">;
  history: ContactStatusHistoryEntry[];
  basePath: string;
}) {
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const [pendingStatus, setPendingStatus] = useState<Enums<"contact_status"> | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handlePickStatus(status: Enums<"contact_status">) {
    setError(null);
    setPendingStatus(status);
    startTransition(async () => {
      const result = await logContactStatusAction(participantId, status, note, basePath);
      setPendingStatus(null);
      if (result?.error) setError(result.error);
      else setNote("");
    });
  }

  function handleSaveNote() {
    if (!note.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await logContactStatusAction(participantId, currentStatus, note, basePath);
      if (result?.error) setError(result.error);
      else setNote("");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Status do acompanhamento
        </p>
        <div className="flex flex-wrap gap-2">
          {CONTACT_STATUS_ORDER.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => handlePickStatus(status)}
              disabled={pending}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                status === currentStatus
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {pendingStatus === status ? "Salvando..." : CONTACT_STATUS_LABELS[status]}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Anotações
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder="Registre o que conversou ou tentou..."
          className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        <Button
          type="button"
          variant="secondary"
          onClick={handleSaveNote}
          disabled={pending || !note.trim()}
          className="mt-3 w-full"
        >
          {pending && !pendingStatus ? "Salvando..." : "Salvar anotação"}
        </Button>
      </Card>

      <Card className="p-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Histórico
        </p>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum registro ainda.</p>
        ) : (
          <ol className="flex flex-col gap-4 border-l-2 border-border pl-4">
            {history.map((entry) => (
              <li key={entry.id}>
                <p className="text-sm font-medium text-foreground">
                  {CONTACT_STATUS_LABELS[entry.status]}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(entry.created_at).toLocaleDateString("pt-BR")} às{" "}
                  {new Date(entry.created_at).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {entry.changed_by_name && ` · ${entry.changed_by_name}`}
                  {entry.note && ` · ${entry.note}`}
                </p>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
