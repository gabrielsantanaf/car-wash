# CarWash SaaS

SaaS multi-tenant para gestão de postos de lavagem de veículos. Resolve quatro dores operacionais centrais: agendamento público pelos clientes (sem cadastro), gerenciamento de fila de lavagem, notificações automáticas via WhatsApp e proteção contra no-show.

## Funcionalidades

- **Agendamento público** — clientes agendam pelo link do posto sem criar conta
- **Confirmação anti-no-show** — link de confirmação via WhatsApp com prazo configurável
- **Fila de lavagem** — interface operacional para atendentes e lavadores
- **Notificações WhatsApp** — confirmação, lembrete 2h antes e aviso de conclusão
- **Gestão de capacidade** — vagas por faixa de horário e dia da semana
- **Multi-tenancy** — múltiplos postos isolados por `tenant_id`
- **Background jobs** — cancelamento automático de confirmações expiradas e envio de lembretes

---

## Stack

| Serviço              | Tecnologia                  | Porta |
|----------------------|-----------------------------|-------|
| Frontend             | Next.js 15 + Tailwind CSS   | 3000  |
| Backend              | Python 3.12 + FastAPI        | 8000  |
| Notification Service | Python 3.12 + FastAPI        | 8001  |
| Evolution API        | Evolution API v2 (WhatsApp) | 8080  |
| Banco de dados       | PostgreSQL 16               | 5432  |
| Cache                | Redis 7                     | 6379  |
| Reverse Proxy        | Nginx                       | 80    |

---

## Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) >= 24
- [Docker Compose](https://docs.docker.com/compose/) >= 2.20

---

## Rodando localmente

### 1. Clone o repositório

```bash
git clone <url-do-repo>
cd carWash
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` se necessário. Para desenvolvimento local, os valores padrão já funcionam.

### 3. Suba todos os containers

```bash
docker compose up --build
```

Na primeira execução o Docker irá:
- Construir as imagens do backend, notification-service e frontend
- Criar os bancos `carwash` e `evolution` no PostgreSQL
- Rodar as migrations do Alembic automaticamente
- Subir todos os 7 serviços

### 4. Primeiro acesso — Setup do posto

Acesse **`http://localhost/setup`** e siga os dois passos:

1. **Criar o posto** — defina nome e slug (ex: `lava-ze`)
2. **Criar a conta de administrador** — email e senha do owner

Após o setup, o link público do posto será `http://localhost/lava-ze`.

---

## Estrutura do projeto

```
carWash/
├── docker-compose.yml
├── .env.example
├── nginx/
│   └── nginx.conf
├── postgres-init/
│   └── 01-init.sql          # Cria banco 'evolution' além do 'carwash'
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   │       └── 0001_initial.py
│   └── app/
│       ├── core/            # config, database, security, dependencies, scheduler
│       ├── auth/            # login, JWT, refresh token
│       ├── tenants/         # cadastro e configuração dos postos
│       ├── users/           # funcionários por tenant
│       ├── clients/         # clientes identificados por telefone
│       ├── vehicles/        # veículos por cliente
│       ├── booking/         # agendamento público (sem autenticação)
│       ├── scheduling/      # gestão interna de agendamentos
│       ├── capacity/        # faixas de horário e vagas
│       ├── queue/           # fila de lavagem
│       └── notifications/   # disparo e histórico de mensagens
├── notification-service/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py
│   └── app/
│       ├── config.py
│       └── router.py        # POST /send → Evolution API
└── frontend/
    ├── Dockerfile
    └── src/
        ├── app/
        │   ├── setup/           # Onboarding: criar posto + owner
        │   ├── login/           # Acesso para funcionários
        │   ├── [slug]/          # Página pública de agendamento
        │   │   └── confirm/[token]/  # Confirmação de presença
        │   ├── (owner)/         # Painel do dono
        │   │   ├── dashboard/
        │   │   ├── appointments/
        │   │   ├── clients/
        │   │   ├── queue/
        │   │   ├── capacity/
        │   │   ├── users/
        │   │   └── settings/
        │   ├── (attendant)/     # Painel do atendente
        │   │   ├── appointments/
        │   │   └── queue/
        │   └── (washer)/        # Interface do lavador (mobile-first)
        │       └── queue/
        ├── components/
        │   ├── sidebar.tsx
        │   └── internal-layout.tsx
        └── lib/
            ├── api.ts           # Axios com interceptors JWT
            └── utils.ts         # cn() helper
```

### Convenção de módulos (backend)

Cada módulo segue a estrutura:

```
<módulo>/
├── models.py      # Modelos SQLAlchemy
├── schemas.py     # Pydantic (request/response)
├── repository.py  # Acesso ao banco (apenas aqui)
├── service.py     # Regras de negócio
└── router.py      # Endpoints FastAPI
```

**Regra de dependência:** `router → service → repository`. Regras de negócio nunca ficam nas routes. Banco acessado exclusivamente pelos repositories.

---

## Arquitetura

```
Cliente (browser)
      │
      ▼
   Nginx :80
   ├── /        → Frontend Next.js :3000
   └── /api/    → Backend FastAPI :8000
                      │
                      ├── PostgreSQL :5432
                      │
                      └── POST /send
                              │
                              ▼
                    Notification Service :8001
                              │
                              ▼
                       Evolution API :8080
                              │
                              ▼
                           WhatsApp
```

O backend **nunca** acessa a Evolution API diretamente. Toda comunicação WhatsApp passa pelo notification-service, que isola falhas externas.

---

## Rotas da API

### Públicas (sem autenticação)

| Método | Rota                         | Descrição                              |
|--------|------------------------------|----------------------------------------|
| GET    | `/booking/{slug}/slots`      | Horários disponíveis (próximos 14 dias)|
| POST   | `/booking/{slug}`            | Criar agendamento                      |
| GET    | `/booking/confirm/{token}`   | Confirmar presença via link            |
| POST   | `/tenants`                   | Criar novo tenant                      |
| POST   | `/setup/owner`               | Criar primeiro owner de um tenant      |
| POST   | `/auth/login`                | Login de funcionário                   |
| POST   | `/auth/refresh`              | Renovar access token                   |
| GET    | `/health`                    | Health check                           |

### Autenticadas (JWT Bearer)

| Método | Rota                          | Roles permitidos         |
|--------|-------------------------------|--------------------------|
| GET    | `/tenants/me`                 | owner, attendant, washer |
| PATCH  | `/tenants/me`                 | owner                    |
| GET    | `/users`                      | owner                    |
| POST   | `/users`                      | owner                    |
| DELETE | `/users/{id}`                 | owner                    |
| GET    | `/clients`                    | owner, attendant         |
| GET    | `/clients/{id}`               | owner, attendant         |
| PUT    | `/clients/{id}/unblock`       | owner                    |
| GET    | `/vehicles/client/{client_id}`| owner, attendant         |
| POST   | `/vehicles`                   | owner, attendant         |
| GET    | `/appointments`               | owner, attendant         |
| POST   | `/appointments`               | owner, attendant         |
| PUT    | `/appointments/{id}/status`   | owner, attendant         |
| GET    | `/capacity`                   | owner, attendant         |
| POST   | `/capacity`                   | owner, attendant         |
| PUT    | `/capacity/{id}`              | owner, attendant         |
| GET    | `/queue`                      | owner, attendant, washer |
| POST   | `/queue/{appointment_id}`     | owner, attendant         |
| PUT    | `/queue/{id}/status`          | owner, attendant, washer |
| POST   | `/notifications/retry/{id}`   | owner, attendant         |

Documentação Swagger disponível em **`http://localhost:8000/docs`** (apenas em desenvolvimento).

---

## Modelo de dados

```
Tenant ──< User
       ──< Client ──< Vehicle
       ──< CapacitySlot
       ──< Appointment ──< QueueEntry
                       ──< Notification
```

### Status do Appointment

```
pending → scheduled → in_queue → in_progress → done
                  └──────────────────────────→ cancelled
```

- `pending` — criado, aguardando confirmação WhatsApp
- `scheduled` — confirmado pelo cliente
- `in_queue` — atendente adicionou à fila
- `in_progress` — lavador iniciou (automático quando QueueEntry → washing)
- `done` — concluído
- `cancelled` — cancelado (confirmação expirou ou cancelamento manual)

### Status do QueueEntry

```
waiting → washing → drying → done
```

---

## Autenticação

JWT com refresh token. O payload do token contém:

```json
{
  "user_id": "uuid",
  "tenant_id": "uuid",
  "role": "owner | attendant | washer"
}
```

Rotas públicas de agendamento identificam o tenant pelo **slug na URL**, sem JWT.

---

## Background Jobs (APScheduler)

Dois jobs rodam automaticamente:

| Job                    | Intervalo | O que faz                                                                 |
|------------------------|-----------|---------------------------------------------------------------------------|
| `expire_confirmations` | 5 min     | Cancela appointments `pending` com token expirado, incrementa `noshow_count`, bloqueia cliente se atingir `max_noshows` |
| `send_reminders`       | 15 min    | Envia WhatsApp de lembrete para appointments `scheduled` nas próximas 2h  |

---

## Roles e permissões

| Recurso                      | owner | attendant | washer |
|------------------------------|:-----:|:---------:|:------:|
| Dashboard e métricas         | ✓     | ✗         | ✗      |
| Clientes e veículos          | ✓     | ✓         | ✗      |
| Agendamentos                 | ✓     | ✓         | ✗      |
| Gestão de capacidade         | ✓     | ✓         | ✗      |
| Fila (visualizar)            | ✓     | ✓         | ✓      |
| Fila (atualizar status)      | ✓     | ✓         | ✓      |
| Bloquear/desbloquear cliente | ✓     | ✗         | ✗      |
| Configurações do posto       | ✓     | ✗         | ✗      |
| Gestão de usuários           | ✓     | ✗         | ✗      |

---

## Variáveis de ambiente

| Variável                    | Descrição                                      | Padrão                  |
|-----------------------------|------------------------------------------------|-------------------------|
| `DATABASE_URL`              | URL de conexão PostgreSQL (asyncpg)            | —                       |
| `JWT_SECRET`                | Chave secreta para assinar tokens JWT          | —                       |
| `JWT_ALGORITHM`             | Algoritmo do JWT                               | `HS256`                 |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Expiração do access token               | `60`                    |
| `JWT_REFRESH_TOKEN_EXPIRE_DAYS`  | Expiração do refresh token               | `30`                    |
| `EVOLUTION_API_URL`         | URL da Evolution API                           | `http://evolution:8080` |
| `EVOLUTION_API_KEY`         | Chave de autenticação da Evolution API         | —                       |
| `EVOLUTION_INSTANCE`        | Nome da instância WhatsApp no Evolution        | `carwash`               |
| `NOTIFICATION_SERVICE_URL`  | URL interna do notification-service            | `http://notification:8001` |
| `APP_ENV`                   | Ambiente (`development` ou `production`)       | `development`           |
| `APP_BASE_URL`              | URL pública do frontend (usada nos links)      | `http://localhost:3000` |

---

## Comandos úteis

```bash
# Subir tudo
docker compose up --build

# Subir em background
docker compose up -d --build

# Ver logs de um serviço
docker compose logs -f backend
docker compose logs -f frontend

# Reiniciar um serviço específico
docker compose restart backend

# Parar tudo (preserva volumes/dados)
docker compose down

# Parar tudo e remover volumes (reset completo)
docker compose down -v

# Rodar migrations manualmente
docker compose exec backend alembic upgrade head

# Criar nova migration
docker compose exec backend alembic revision --autogenerate -m "descricao"

# Acessar o banco diretamente
docker compose exec postgres psql -U carwash -d carwash

# Ver todos os containers e status
docker compose ps
```

---

## Configurando o WhatsApp (Evolution API)

1. Acesse `http://localhost:8080` (Evolution API)
2. Crie uma instância com o nome definido em `EVOLUTION_INSTANCE` (padrão: `carwash`)
3. Escaneie o QR Code com o WhatsApp do número do posto
4. Após conectado, as notificações serão enviadas automaticamente

> **Atenção:** A Evolution API é uma solução não-oficial do WhatsApp. Para produção com volume maior, considere migrar para a API oficial (Meta Cloud API).

---

## Deploy em produção

### Pontos obrigatórios antes de ir a produção:

1. **Altere o `JWT_SECRET`** para uma string longa e aleatória:
   ```bash
   openssl rand -hex 64
   ```

2. **Configure SSL no Nginx** com Let's Encrypt ou outro certificado.

3. **Ajuste o CORS** — em `main.py`, `APP_ENV=production` restringe o CORS ao `APP_BASE_URL`.

4. **Remova o Swagger** — já está desabilitado automaticamente quando `APP_ENV != development`.

5. **Configure o `APP_BASE_URL`** com a URL pública real do servidor (usada nos links de confirmação enviados por WhatsApp).

6. **Ajuste os volumes do Docker** para paths persistentes no servidor.

---

## Fora do escopo (MVP)

Os itens abaixo foram deliberadamente excluídos:

- Pagamento online integrado
- Relatórios financeiros avançados
- Customização visual por tenant (logo, cores)
- App mobile nativo
- Link de acompanhamento em tempo real para o cliente
- Onboarding self-service com múltiplos tenants
- Login de cliente com senha
- Avaliação/review do serviço pelo cliente
