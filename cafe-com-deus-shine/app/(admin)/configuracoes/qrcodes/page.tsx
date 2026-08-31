import {
  getOrCreateDefaultEnrollmentSource,
  listEnrollmentRegistrations,
} from "@/lib/services/enrollment-sources.service";
import { QrCodeTabs } from "@/components/qrcodes/qrcode-tabs";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function QrCodesPage() {
  const source = await getOrCreateDefaultEnrollmentSource();
  const registrations = await listEnrollmentRegistrations(source.code);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="QR Code de Cadastro"
        description="Um único QR fixo, permanente, que sempre leva ao formulário de inscrição público."
      />

      <QrCodeTabs code={source.code} registrations={registrations} />
    </div>
  );
}
