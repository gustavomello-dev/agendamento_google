# Barbearia do Mestre — Sistema de Agendamento

Aplicação web mobile-first para agendamento de horários. Back-end em Node.js/Express/Sequelize, banco **PostgreSQL no Supabase**, app hospedado no **Railway**, com integração automática ao Google Agenda.

## Stack técnica

- **Back-end:** Node.js, Express, Sequelize, Express Handlebars, CORS, dotenv
- **Banco de dados:** PostgreSQL, hospedado no **Supabase**
- **Front-end:** HTML + CSS + JavaScript puro (servido pelo próprio Express — back-end e front-end sobem juntos)
- **Integração:** Google Calendar API
- **Hospedagem do app:** Railway (recomendado) — Render como alternativa

## Por que essa combinação (e não "tudo no Supabase")

O Supabase é um banco de dados (mais autenticação/storage/functions), não um lugar pra rodar um servidor Express como este. As "Edge Functions" dele usam Deno, não Node, e servem pra funções pontuais — não pra um app inteiro com views renderizadas e arquivos estáticos. Migrar pra lá seria reescrever o projeto quase do zero, sem necessidade.

O que realmente faz sentido, e é o que este projeto usa:
- **Supabase** → só o banco de dados (Postgres gerenciado)
- **Railway** → o app inteiro (back-end + front-end juntos, já que o Express serve as duas coisas)

Por que Railway em vez de Render:
| | Railway | Render (free) | Render (pago) |
|---|---|---|---|
| App dorme por inatividade | Não | Sim (15 min) | Não |
| Domínio próprio | Em qualquer plano | **Não disponível** | Sim |
| Custo aproximado | ~US$5/mês | Grátis | ~US$7/mês |

## Estrutura do projeto

```
barbearia-agendamento/
├── config/
│   ├── database.js         # Conexão Sequelize/Postgres (DATABASE_URL — Supabase)
│   ├── servicos.js         # Lista de serviços e duração (fonte única)
│   └── googleCalendar.js   # Integração com o Google Agenda
├── models/Agendamento.js
├── controllers/agendamentoController.js
├── routes/agendamentoRoutes.js
├── views/ (layouts/main, home, agendar, consultar .handlebars)
├── public/ (css/style.css, js/utils.js, js/agendar.js, js/consultar.js)
├── server.js
├── railway.json            # Config de deploy do Railway (recomendado)
├── render.yaml              # Config de deploy do Render (alternativa)
├── package.json
└── .env.example
```

## 1. Banco de dados no Supabase

1. Crie uma conta em [supabase.com](https://supabase.com/) → **New Project**.
2. Escolha nome, uma senha forte para o banco (guarde) e região próxima (ex: São Paulo/`sa-east-1`).
3. Aguarde o projeto subir (1-2 min).
4. **Project Settings → Database → Connect** → aba **Session pooler** (recomendado para apps de longa duração como este).
5. Copie a connection string, algo como:
   ```
   postgresql://postgres.xxxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
   ```
6. Troque `[YOUR-PASSWORD]` pela senha do passo 2. Essa é a sua `DATABASE_URL`.

> As tabelas são criadas sozinhas na primeira vez que o servidor sobe — não precisa mexer no Supabase além disso.

## 2. Deploy do app no Railway

1. Suba o projeto para o GitHub (`.env` e `config/credentials.json` ficam de fora, protegidos pelo `.gitignore`).
2. Em [railway.app](https://railway.app/) → **New Project → Deploy from GitHub repo** → selecione o repositório.
3. O Railway detecta automaticamente que é um app Node (via `railway.json` + `package.json`) e já faz o primeiro deploy.
4. Vá em **Variables** e adicione:
   - `DATABASE_URL` → a connection string do Supabase (passo 1)
   - `GOOGLE_CREDENTIALS_JSON` → conteúdo inteiro do JSON da conta de serviço do Google, em uma linha só
   - `GOOGLE_CALENDAR_ID` → e-mail do Gmail do barbeiro
   - `NODE_ENV` → `production`

   (Não precisa configurar `PORT` — o Railway injeta essa variável automaticamente e o `server.js` já usa `process.env.PORT`.)

5. Salvar as variáveis dispara um novo deploy. Em **Settings → Networking**, clique em **Generate Domain** para ter uma URL pública tipo `barbearia-agendamento.up.railway.app` já com HTTPS.

### Gerando o `GOOGLE_CREDENTIALS_JSON`
1. [Google Cloud Console](https://console.cloud.google.com/) → crie um projeto → ative a **Google Calendar API**.
2. Credenciais → Criar credenciais → **Conta de serviço** → aba Chaves → Adicionar chave → JSON.
3. Copie o conteúdo inteiro do arquivo baixado e cole em `GOOGLE_CREDENTIALS_JSON` no Railway.
4. No Google Agenda do barbeiro → Configurações → Compartilhar com pessoas específicas → cole o `client_email` do JSON → permissão "Fazer alterações nos eventos".

## 3. Domínio próprio (ex: www.suabarbearia.com)

### Comprar o domínio
- `.com.br` → [registro.br](https://registro.br/) (precisa de CPF/CNPJ, é o registrador oficial do Brasil)
- `.com` → Namecheap, Cloudflare Registrar, GoDaddy, etc.

### Apontar o domínio pro Railway
1. No Railway: **seu serviço → Settings → Networking → Custom Domain** → digite o domínio (ex: `www.suabarbearia.com`).
2. O Railway mostra um **CNAME** e um **TXT** para você cadastrar no painel de DNS do seu domínio (onde comprou). Os dois registros são obrigatórios — sem o TXT, o domínio não valida.
3. No painel de DNS do domínio, crie:
   - Um registro **CNAME** apontando `www` para o valor que o Railway deu (ex: `xxxxx.up.railway.app`)
   - Um registro **TXT** com o valor de verificação que o Railway deu
4. Propagação de DNS pode levar de alguns minutos a algumas horas. O Railway emite o certificado HTTPS automaticamente assim que valida.
5. Se quiser que `suabarbearia.com` (sem `www`) também funcione, repita o processo — alguns provedores de DNS exigem um registro tipo **ALIAS/ANAME** em vez de CNAME para o domínio raiz (CNAME puro não é permitido na raiz pelo padrão DNS). O painel do seu registrador geralmente indica isso.

## Rodando localmente (opcional)

```bash
npm install
cp .env.example .env
```
Preencha `DATABASE_URL` com a connection string do Supabase (pode usar o mesmo banco em dev e produção, já que é uma barbearia só) ou aponte para um Postgres local via `DB_HOST`/`DB_USER`/etc. Para o Google Agenda em dev, é mais prático colocar o arquivo baixado em `config/credentials.json`.

```bash
npm run dev    # com nodemon
npm start
```
Acesse `http://localhost:3000`.

## Alternativa: Render em vez de Railway

O `render.yaml` continua no projeto caso prefira o Render. Só lembre: no plano gratuito o app dorme após 15 min, e domínio próprio só é liberado no plano pago (~US$7/mês) — nesse caso o Railway tende a sair mais em conta e sem esse limite de domínio.

## Rotas da API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/` | Página inicial |
| GET | `/agendar` | Formulário de novo agendamento |
| GET | `/consultar` | Formulário de consulta |
| POST | `/api/agendamentos` | Cria um agendamento + evento no Google Agenda |
| GET | `/api/agendamentos?telefone=&nome=` | Busca agendamentos por telefone e/ou nome |
| GET | `/api/agendamentos/horarios-disponiveis?dia=YYYY-MM-DD` | Lista horários já ocupados em um dia |

## Personalizando

- **Serviços e duração:** `config/servicos.js`
- **Horários de atendimento:** array `HORARIOS` em `public/js/agendar.js`
- **Cores e identidade visual:** variáveis CSS no topo de `public/css/style.css`
- **Endereço/telefone no rodapé:** `views/home.handlebars`

## Decisões tomadas

- **Banco no Supabase:** pausa só após 7 dias sem consultas, tem painel próprio, funciona como Postgres comum.
- **Session Pooler do Supabase:** evita problema de IPv6 (a conexão direta é IPv6 por padrão) e é o modo certo pra uma conexão persistente de servidor, como esta.
- **App no Railway em vez do Render:** não dorme e libera domínio próprio em qualquer plano — resolve os dois problemas de uma vez.
- **Credencial do Google via variável de ambiente:** `credentials.json` não vai pro GitHub (fica no `.gitignore`); em produção é lido via `GOOGLE_CREDENTIALS_JSON`.
- **Um dia + horário só pode ter um agendamento:** garantido por índice único no banco.
- **Telefone salvo só com dígitos:** evita que formatações diferentes impeçam a consulta de encontrar o agendamento.

## Sugestões de evolução

- Painel do barbeiro para listar/cancelar os agendamentos do dia
- Cancelamento de agendamento pelo próprio cliente
- Confirmação automática por WhatsApp
