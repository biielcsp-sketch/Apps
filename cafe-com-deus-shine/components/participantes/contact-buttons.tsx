import { MessageCircle, Phone } from "lucide-react";

// Assume número brasileiro (único contexto do app) — só dígitos, com
// DDI 55 se ainda não tiver.
function toWhatsAppUrl(raw: string) {
  const digits = raw.replace(/\D/g, "");
  const withCountryCode = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${withCountryCode}`;
}

function toTelUrl(raw: string) {
  return `tel:${raw.replace(/\D/g, "")}`;
}

export function ContactButtons({
  whatsapp,
  phone,
}: {
  whatsapp?: string | null;
  phone?: string | null;
}) {
  const whatsappNumber = whatsapp || phone;
  const callNumber = phone || whatsapp;

  if (!whatsappNumber && !callNumber) return null;

  return (
    <div className="flex gap-3">
      {whatsappNumber && (
        <a
          href={toWhatsAppUrl(whatsappNumber)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
        >
          <MessageCircle size={18} />
          WhatsApp
        </a>
      )}
      {callNumber && (
        <a
          href={toTelUrl(callNumber)}
          className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-medium text-foreground hover:bg-muted"
        >
          <Phone size={18} />
        </a>
      )}
    </div>
  );
}
