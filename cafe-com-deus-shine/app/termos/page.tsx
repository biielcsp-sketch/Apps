import { LegalPage } from "@/components/legal/legal-page";

export const metadata = {
  title: "Termos de Uso — Café com Deus Shine",
  description: "As regras de uso do sistema Café com Deus Shine.",
};

// Página pública, par da /privacidade. O Google pede as duas ao publicar
// o app que dá acesso ao Drive do mural.
export default function TermosPage() {
  return (
    <LegalPage title="Termos de Uso" updatedAt="8 de setembro de 2026">
      <p>
        Estas são as regras de uso do sistema Café com Deus Shine — o aplicativo que a
        nossa comunidade usa para organizar os encontros mensais de mulheres. Ao usar o
        sistema, você concorda com o que está aqui.
      </p>

      <h2>Para que serve</h2>
      <p>
        O sistema organiza os encontros: cadastro de quem quer participar, distribuição
        entre os cafés, registro de presença, material do mês, Bíblia e o mural de fotos e
        vídeos. Ele é de uso interno da comunidade — não é um serviço aberto ao público
        nem um produto comercial. Não cobramos nada por ele.
      </p>

      <h2>Sua conta</h2>
      <ul>
        <li>O acesso é pessoal. Não empreste sua senha.</li>
        <li>
          Se você desconfiar que alguém entrou na sua conta, troque a senha e avise a
          equipe.
        </li>
        <li>
          A administração pode desativar um acesso quando a pessoa deixa a comunidade ou
          quando há uso indevido.
        </li>
      </ul>

      <h2>O que você não deve fazer</h2>
      <ul>
        <li>
          Publicar no mural conteúdo ofensivo, que exponha alguém constrangida ou que não
          tenha a ver com os encontros.
        </li>
        <li>
          Publicar foto ou vídeo de outra pessoa sem que ela saiba e concorde.
        </li>
        <li>
          Repassar para fora da comunidade os dados de contato ou o que foi conversado em
          confiança dentro do grupo.
        </li>
        <li>Tentar acessar dados de cafés dos quais você não participa.</li>
      </ul>
      <p>
        A administração pode retirar do mural qualquer publicação que fuja disso, e
        encerrar o acesso de quem insistir.
      </p>

      <h2>O que é publicado no mural</h2>
      <p>
        As fotos e os vídeos continuam sendo de quem os tirou. Ao publicar, você autoriza a
        comunidade a exibi-los dentro do sistema, para as participantes daquele café. Não
        usamos esse material em propaganda nem fora do aplicativo sem falar com você antes.
        Para tirar alguma coisa do mural, fale com a sua líder.
      </p>

      <h2>Seus dados</h2>
      <p>
        Como tratamos os dados pessoais está na{" "}
        <a href="/privacidade" className="text-primary underline">
          Política de Privacidade
        </a>
        .
      </p>

      <h2>Disponibilidade</h2>
      <p>
        Fazemos o possível para o sistema estar sempre no ar, mas ele depende de serviços de
        terceiros e pode ficar indisponível por manutenção ou por falha fora do nosso
        alcance. Nesses casos, os encontros acontecem do mesmo jeito — o aplicativo ajuda a
        organizar, não substitui a comunidade.
      </p>

      <h2>Mudanças</h2>
      <p>
        Se estas regras mudarem, atualizamos esta página e a data no topo.
      </p>

      <h2>Falar com a gente</h2>
      <p>
        <strong>cafecomdeus.shine@gmail.com</strong>
      </p>
    </LegalPage>
  );
}
