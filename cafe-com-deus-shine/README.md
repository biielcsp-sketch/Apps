This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Segurança

### Variáveis de ambiente

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e
`SUPABASE_SERVICE_ROLE_KEY` (ver `.env.example`) são validadas no boot do
servidor (`instrumentation.ts` → `lib/env.ts`) — se alguma estiver ausente
ou em formato inválido, a aplicação falha ao subir com uma mensagem clara
em vez de rodar com uma feature de segurança silenciosamente desativada.

### Auditoria de dependências

Rode manualmente antes de cada deploy (ainda não é automatizado em CI):

```bash
npm audit --production
```

Se aparecer uma vulnerabilidade de severidade alta/crítica numa dependência
que o projeto já usa em produção, pare e avalie o caso antes de decidir se
atualiza a versão, substitui a dependência ou aceita o risco
temporariamente — não é uma decisão puramente técnica. `package-lock.json`
está commitado no repositório para que `npm ci`/`npm audit` sejam
reprodutíveis.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
