"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { Copy, Check, RefreshCw } from "lucide-react";
import { createLeaderAction, type LeaderCreateState } from "@/app/actions/leaders";
import { Button } from "@/components/ui/Button";

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary";
const labelClass = "text-sm font-medium text-foreground";

// Sem I, l, O, 0, 1: a senha vai ser lida em voz alta ou digitada à mão do
// outro lado, e esses caracteres são os que mais geram confusão.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

function generatePassword(length = 12) {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => ALPHABET[n % ALPHABET.length]).join("");
}

export function LeaderCreateForm() {
  const [state, action, pending] = useActionState<LeaderCreateState, FormData>(
    createLeaderAction,
    undefined,
  );
  // A senha fica só aqui no navegador: o servidor recebe uma vez, no envio,
  // e não devolve. É este valor que o painel de sucesso mostra.
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  if (state?.status === "created") {
    const message =
      `Oi, ${state.fullName}! Seu acesso ao Café com Deus Shine está pronto.\n\n` +
      `E-mail: ${state.email}\n` +
      `Senha provisória: ${password}\n\n` +
      `No primeiro acesso o app vai pedir para você criar uma senha só sua.`;

    async function copyMessage() {
      try {
        await navigator.clipboard.writeText(message);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Sem permissão de área de transferência: o texto continua à vista
        // no campo abaixo, é só selecionar e copiar na mão.
        messageRef.current?.select();
      }
    }

    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-primary/30 bg-muted p-4">
          <h2 className="text-base font-semibold text-foreground">
            Acesso criado para {state.fullName}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Nenhum e-mail foi enviado. Copie a mensagem abaixo e mande para ela pelo
            WhatsApp — a senha provisória não aparece de novo depois que você sair desta
            tela.
          </p>
        </div>

        <textarea
          ref={messageRef}
          readOnly
          rows={7}
          value={message}
          className={`${inputClass} font-mono text-xs`}
        />

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={copyMessage} className="flex items-center gap-1.5">
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copiado" : "Copiar mensagem"}
          </Button>
          <Link
            href={`/liderancas/${state.leaderId}`}
            className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            Ver cadastro da líder
          </Link>
          <Link
            href="/liderancas/nova"
            className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            Cadastrar outra
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
        A líder recebe uma senha provisória, que você passa para ela por WhatsApp. No
        primeiro acesso o app pede para ela criar a senha dela. Nenhum e-mail é enviado.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className={labelClass} htmlFor="full_name">Nome completo</label>
          <input id="full_name" name="full_name" required className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className={labelClass} htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" required className={inputClass} />
          <p className="text-xs text-muted-foreground">
            É com esse e-mail que ela entra no app.
          </p>
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className={labelClass} htmlFor="password">Senha provisória</label>
          <div className="flex gap-2">
            <input
              id="password"
              name="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="off"
              className={`${inputClass} font-mono`}
            />
            <button
              type="button"
              onClick={() => setPassword(generatePassword())}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              <RefreshCw size={16} />
              Gerar
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Pelo menos 8 caracteres. Ela troca no primeiro acesso.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="phone">Telefone</label>
          <input id="phone" name="phone" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="whatsapp">WhatsApp</label>
          <input id="whatsapp" name="whatsapp" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="city">Cidade</label>
          <input id="city" name="city" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="neighborhood">Bairro</label>
          <input id="neighborhood" name="neighborhood" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className={labelClass} htmlFor="meeting_address">Endereço do encontro</label>
          <input id="meeting_address" name="meeting_address" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="region">Região de atuação</label>
          <input id="region" name="region" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="role">Papel</label>
          <select id="role" name="role" defaultValue="lider" className={inputClass}>
            <option value="lider">Líder</option>
            <option value="co_lider">Co-líder</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="max_capacity">Capacidade máxima</label>
          <input
            id="max_capacity"
            name="max_capacity"
            type="number"
            min={1}
            defaultValue={12}
            required
            className={inputClass}
          />
        </div>
      </div>

      {state?.status === "error" && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Criando acesso..." : "Cadastrar líder"}
      </Button>
    </form>
  );
}
