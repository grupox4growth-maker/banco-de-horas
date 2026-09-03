# Ponto & Banco de Horas

Sistema de controle de ponto, **banco de horas** e **banco de produtividade** dos funcionários,
com painel do gerente e área individual de cada funcionário — feito em **Next.js** e pronto para
publicar na **Vercel** com **Postgres (Neon)**.

## O que ele faz

- **Login e senha** por pessoa (gerente e funcionários), com sessão segura em cookie httpOnly.
- **Recuperação de senha por e-mail** (link seguro, uso único, expira em 1 hora) via Resend.
- Registro dos 6 horários: **entrada, saída/volta do almoço, início/fim do intervalo e saída**.
- Cálculo automático de **horas trabalhadas × previstas**, **saldo do dia** e **banco de horas** (a favor / devendo).
- **Detecção de atraso** com sugestão de compensação (chegou 10 min atrasado → almoço/saída deslocam 10 min).
- **Banco de produtividade** por funcionário (pontos positivos e negativos).
- **Observações e avisos** do gerente para cada funcionário.
- **Jornada configurável por funcionário** (horários, carga diária, dias da semana, descontar intervalo).

## Segurança

- Senhas guardadas com **bcrypt** (hash + salt), nunca em texto puro.
- Sessão assinada com **JWT (jose)** em cookie **httpOnly**; autorização checada **no servidor** em toda ação.
- Middleware protege as rotas do gerente e do funcionário.
- Tokens de redefinição são guardados **cifrados (SHA-256)**; o token puro só existe no link do e-mail.

---

## Como publicar na Vercel (passo a passo)

Você **não precisa** ter Node instalado no seu computador — a Vercel compila o projeto.

### 1. Coloque o código no GitHub
- Crie um repositório novo em <https://github.com/new> (pode ser privado).
- Envie esta pasta para o repositório (pelo site do GitHub em "uploading files", ou pelo GitHub Desktop).

### 2. Importe na Vercel
- Entre em <https://vercel.com/new> e importe o repositório.
- **Não** clique em Deploy ainda — primeiro configure o banco e as variáveis (passos 3 e 4).

### 3. Crie o banco de dados (Postgres/Neon)
- No projeto da Vercel, aba **Storage → Create Database → Postgres** (Neon) → **Connect**.
- Isso cria automaticamente várias variáveis de conexão. O nome exato varia conforme a versão da
  integração — pode ser `DATABASE_URL` / `DATABASE_URL_UNPOOLED`, ou `POSTGRES_PRISMA_URL` /
  `POSTGRES_URL_NON_POOLING`.
- Este projeto usa **diretamente** os nomes que a integração cria — você **não precisa** criar
  variáveis de banco manualmente. O `schema.prisma` lê:
  - `POSTGRES_PRISMA_URL` (conexão com pooler, própria para o Prisma)
  - `DATABASE_URL_UNPOOLED` (conexão direta, usada nas migrações / `db push`)
  - Só confira, em **Settings → Environment Variables**, que esses dois nomes existem na lista.

### 4. Configure as demais variáveis (Settings → Environment Variables)
| Variável | Valor |
|---|---|
| `SESSION_SECRET` | um texto aleatório longo (ex.: gere em <https://generate-secret.vercel.app/48>) |
| `RESEND_API_KEY` | sua chave do Resend (veja abaixo) |
| `EMAIL_FROM` | `Ponto <onboarding@resend.dev>` (para teste) ou um remetente do seu domínio verificado |
| `APP_URL` | a URL do app, ex.: `https://seu-app.vercel.app` (pode ajustar depois do 1º deploy) |

> Ao adicionar cada variável, deixe marcados **todos os ambientes** (Production, Preview e Development).
> O build cria as tabelas do banco, então as variáveis de conexão precisam estar disponíveis no build.

### 5. E-mail (Resend)
- Crie conta em <https://resend.com>, gere uma **API Key** e cole em `RESEND_API_KEY`.
- Para testes, use o remetente `onboarding@resend.dev`. Para produção, verifique seu domínio no Resend
  e use um endereço dele em `EMAIL_FROM`.

### 6. Deploy
- Clique em **Deploy**. No build, o projeto **cria as tabelas automaticamente** (`prisma db push`).
- Ao terminar, ajuste `APP_URL` para o domínio final (se necessário) e faça **Redeploy**.

### 7. Primeiro acesso
- Abra a URL do app. Como ainda não há gerente, você cai na tela **Configuração inicial**:
  crie a **conta do gerente** (nome, usuário, e-mail e senha). Pronto — você entra no painel.
- Em **Funcionários**, copie o **link de convite** e envie para a equipe.
- Cada funcionário abre o link e faz o **próprio cadastro** (nome, usuário e senha) — e passa a
  aparecer automaticamente na lista do gerente. O gerente ajusta a **jornada** de cada um em **Editar**.
- Precisa invalidar o link antigo? Em **Funcionários → Gerar novo link**.

> A tela de configuração inicial só funciona **enquanto não existir nenhum gerente**. Depois disso, ela redireciona para o login.

---

## Rodar localmente (opcional, exige Node 18+)

```bash
npm install
cp .env.example .env      # preencha os valores
npm run db:push           # cria as tabelas no banco
npm run dev               # http://localhost:3000
```

Para criar a conta do gerente pela linha de comando (alternativa à tela /setup):

```bash
# preencha SEED_MANAGER_* no .env
npm run seed
```

## Estrutura

- `prisma/schema.prisma` — modelo do banco (usuários, pontos, produtividade, avisos, tokens de reset).
- `src/lib/` — `auth` (senha/sessão), `time` (cálculo de banco de horas), `email`, `prisma`, `guards`.
- `src/lib/actions/` — ações de servidor (login, funcionários, ponto, produtividade, avisos).
- `src/app/` — páginas (login, setup, forgot, reset, dashboard, employees, me, produtividade).
- `src/components/` — componentes de interface.

## Observação sobre o `prisma db push` no build

Para facilitar (sem Node local), o build roda `prisma db push`, que sincroniza o banco com o schema.
Ao evoluir o schema no futuro com dados reais, considere migrar para `prisma migrate` para ter
histórico de migrações e evitar perda de dados acidental.
