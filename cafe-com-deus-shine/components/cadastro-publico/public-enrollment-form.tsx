"use client";

import { useActionState } from "react";
import {
  submitPublicEnrollmentAction,
  type PublicEnrollmentActionState,
} from "@/app/actions/public-enrollment";
import {
  AVAILABILITY_DAYS,
  AVAILABILITY_DAY_LABELS,
  AVAILABILITY_PERIODS,
  AVAILABILITY_PERIOD_LABELS,
} from "@/lib/validators/participant.schema";
import { Button } from "@/components/ui/Button";

// Campos grandes de propósito (item do Q2): quem preenche isto está em pé,
// no celular, na saída de um evento — não é a mesma tela densa do
// cadastro administrativo.
const inputClass =
  "w-full rounded-xl border border-border bg-card px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-primary";
const labelClass = "text-sm font-medium text-foreground";

export function PublicEnrollmentForm({ code }: { code: string }) {
  const [state, action, pending] = useActionState<PublicEnrollmentActionState, FormData>(
    submitPublicEnrollmentAction,
    undefined,
  );

  if (state?.status === "success" || state?.status === "duplicate") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-semibold text-foreground">Inscrição recebida! 💛</h1>
        <p className="text-sm text-muted-foreground">
          {state.status === "duplicate"
            ? "Você já está cadastrada — nossa equipe vai entrar em contato."
            : "Muito obrigada por se inscrever! Nossa equipe vai entrar em contato em breve."}
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="code" value={code} />

      {/* Honeypot: escondido fora da tela (não display:none sozinho), sem
          label visível, fora da ordem de tabulação e do leitor de tela —
          só um bot que preenche todo input encontrado chega aqui. */}
      <div
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", top: "-9999px" }}
      >
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="full_name">
          Seu nome completo
        </label>
        <input id="full_name" name="full_name" required autoComplete="name" className={inputClass} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="preferred_name">
          Como prefere ser chamada
        </label>
        <input id="preferred_name" name="preferred_name" autoComplete="nickname" className={inputClass} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="birth_date">
          Data de nascimento
        </label>
        <input id="birth_date" name="birth_date" type="date" className={inputClass} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="phone">
          Seu telefone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          required
          placeholder="(11) 99999-9999"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="whatsapp">
          Seu WhatsApp (se for diferente do telefone)
        </label>
        <input
          id="whatsapp"
          name="whatsapp"
          type="tel"
          inputMode="numeric"
          placeholder="(11) 99999-9999"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="city">
          Cidade
        </label>
        <input id="city" name="city" autoComplete="address-level2" className={inputClass} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="neighborhood">
          Bairro
        </label>
        <input id="neighborhood" name="neighborhood" className={inputClass} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="email">
          E-mail (opcional)
        </label>
        <input id="email" name="email" type="email" autoComplete="email" className={inputClass} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="address">
          Endereço
        </label>
        <input id="address" name="address" required className={inputClass} />
      </div>

      <div className="flex flex-col gap-2">
        <span className={labelClass}>Dias disponíveis</span>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {AVAILABILITY_DAYS.map((day) => (
            <label key={day} className="flex items-center gap-1.5 text-sm text-foreground">
              <input type="checkbox" name="availability_days" value={day} />
              {AVAILABILITY_DAY_LABELS[day]}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className={labelClass}>Períodos disponíveis</span>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {AVAILABILITY_PERIODS.map((period) => (
            <label key={period} className="flex items-center gap-1.5 text-sm text-foreground">
              <input type="checkbox" name="availability_period" value={period} />
              {AVAILABILITY_PERIOD_LABELS[period]}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="location_preference">
          Prefere um encontro perto de onde?
        </label>
        <input id="location_preference" name="location_preference" required className={inputClass} />
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" name="home_meeting_ok" defaultChecked className="h-4 w-4 shrink-0" />
        Disponível para encontros em casa
      </label>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="other_notes">
          Outras informações relevantes (opcional)
        </label>
        <textarea id="other_notes" name="other_notes" rows={3} className={inputClass} />
      </div>

      <label className="flex items-start gap-2.5 rounded-xl border border-border bg-muted p-4 text-sm text-foreground">
        <input type="checkbox" name="consent_accepted" required className="mt-0.5 h-4 w-4 shrink-0" />
        Li e concordo em ser contatada pela equipe do Café com Deus Shine.
      </label>

      {state?.status === "error" && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full py-3.5 text-base">
        {pending ? "Enviando..." : "Quero me inscrever"}
      </Button>
    </form>
  );
}
