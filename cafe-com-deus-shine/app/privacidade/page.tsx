import { LegalPage } from "@/components/legal/legal-page";

export const metadata = {
  title: "Política de Privacidade — Café com Deus Shine",
  description:
    "Como o Café com Deus Shine trata os dados pessoais de quem participa dos encontros.",
};

// Página pública. Além de ser o certo para um sistema que guarda dado
// pessoal, é o endereço que o Google exige para publicar o app que dá
// acesso ao Google Drive do mural.
export default function PrivacidadePage() {
  return (
    <LegalPage title="Política de Privacidade" updatedAt="8 de setembro de 2026">
      <p>
        O Café com Deus Shine é o sistema que a nossa comunidade usa para organizar os
        encontros mensais de mulheres: quem participa, em qual café, quem lidera cada
        grupo e o que foi combinado. Esta página explica, em português claro, quais dados
        guardamos, por quê, quem enxerga cada coisa e como pedir para sair.
      </p>

      <h2>Quem é responsável</h2>
      <p>
        A comunidade Café com Deus Shine. Para qualquer assunto desta página, fale com a
        equipe pelo e-mail <strong>cafecomdeus.shine@gmail.com</strong>.
      </p>

      <h2>Que dados guardamos</h2>
      <p>De quem se inscreve para participar dos encontros:</p>
      <ul>
        <li>Nome completo e como prefere ser chamada</li>
        <li>Telefone e WhatsApp</li>
        <li>E-mail, quando informado</li>
        <li>Data de nascimento, quando informada</li>
        <li>Cidade, bairro e endereço — usados para achar o café mais perto de você</li>
        <li>Dias e períodos em que consegue participar</li>
        <li>Presença nos encontros</li>
        <li>Anotações de acompanhamento feitas pela sua líder</li>
      </ul>
      <p>
        De quem lidera ou administra: nome, e-mail de acesso, telefone e o registro das
        ações feitas no sistema (quem alterou o quê e quando), que existe para permitir
        auditoria.
      </p>

      <h2>Para que usamos</h2>
      <ul>
        <li>Encontrar o grupo mais próximo de onde você mora e que caiba no seu horário</li>
        <li>Permitir que sua líder entre em contato e acompanhe sua caminhada</li>
        <li>Organizar os encontros, a presença e o material do mês</li>
      </ul>
      <p>
        Não vendemos, não alugamos e não compartilhamos esses dados com ninguém para fins
        comerciais ou de publicidade.
      </p>

      <h2>Quem enxerga o quê</h2>
      <ul>
        <li>
          <strong>Sua líder</strong> vê os dados das participantes do café dela, incluindo
          as anotações de acompanhamento que ela mesma escreveu.
        </li>
        <li>
          <strong>A administração</strong> (pastora e equipe) vê todos os cafés, porque é
          quem distribui as participantes entre os grupos.
        </li>
        <li>
          <strong>Você</strong> vê os seus próprios dados e pode corrigi-los pelo app.
        </li>
        <li>
          <strong>Outras participantes</strong> não veem seus dados de contato. No mural,
          aparecem apenas as fotos e os vídeos publicados, com o nome de quem publicou.
        </li>
      </ul>
      <p>
        Essas regras não são só de tela: elas são aplicadas no próprio banco de dados, de
        modo que uma pessoa não consegue acessar dados de outro café nem por caminhos
        indiretos.
      </p>

      <h2>Fotos e vídeos do mural</h2>
      <p>
        As fotos e os vídeos dos encontros ficam guardados numa pasta do Google Drive da
        conta da comunidade, e o sistema os exibe apenas para quem participa daquele café.
        Se você aparece numa foto e quer que ela saia, fale com a sua líder ou escreva para
        o e-mail acima — retiramos.
      </p>

      <h2>Onde os dados ficam</h2>
      <p>
        O sistema é hospedado na Netlify e o banco de dados fica no Supabase, com os
        servidores nos Estados Unidos. As fotos e os vídeos ficam no Google Drive. O acesso
        é sempre por conexão criptografada, e as senhas ficam guardadas de forma cifrada —
        nem a administração consegue lê-las.
      </p>

      <h2>Por quanto tempo</h2>
      <p>
        Enquanto você participar da comunidade. Se pedir para sair, seus dados pessoais são
        anonimizados: nome, contatos e endereço são apagados, e o que resta é apenas a
        contagem histórica dos encontros, sem ligação com você.
      </p>

      <h2>Seus direitos</h2>
      <p>
        Pela Lei Geral de Proteção de Dados (LGPD), você pode a qualquer momento pedir para
        ver, corrigir ou apagar seus dados, saber com quem foram compartilhados, e retirar o
        consentimento que deu ao se inscrever. É só escrever para
        <strong> cafecomdeus.shine@gmail.com</strong> — respondemos em até 15 dias.
      </p>
      <p>
        Retirar o consentimento não apaga o que já aconteceu, mas encerra o uso dos seus
        dados dali em diante.
      </p>

      <h2>Crianças e adolescentes</h2>
      <p>
        Os encontros são para mulheres adultas. Não cadastramos menores de 18 anos.
      </p>

      <h2>Mudanças nesta política</h2>
      <p>
        Se algo mudar, atualizamos esta página e a data no topo. Mudanças que afetem o uso
        dos seus dados são avisadas pela sua líder.
      </p>
    </LegalPage>
  );
}
