# MeChama - Arquitetura do Sistema

## Visão Geral da Arquitetura

### 1. Arquitetura de Microserviços

```
┌─────────────────────────────────────────────────────────────────┐
│                         API Gateway (Kong/Nginx)                 │
│                    Rate Limiting, Auth, Routing                  │
└─────────────────────────────────────────────────────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            │                       │                       │
    ┌───────▼──────┐        ┌──────▼──────┐        ┌──────▼──────┐
    │   Auth       │        │   User      │        │  Booking    │
    │   Service    │        │   Service   │        │  Service    │
    └──────────────┘        └─────────────┘        └─────────────┘
            │                       │                       │
    ┌───────▼──────┐        ┌──────▼──────┐        ┌──────▼──────┐
    │   Payment    │        │   Search    │        │  Review     │
    │   Service    │        │   Service   │        │  Service    │
    └──────────────┘        └─────────────┘        └─────────────┘
            │                       │                       │
    ┌───────▼──────┐        ┌──────▼──────┐        ┌──────▼──────┐
    │Notification  │        │   Calendar  │        │   Admin     │
    │   Service    │        │   Service   │        │  Service    │
    └──────────────┘        └─────────────┘        └─────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────┐
        │                           │                       │
    ┌───▼────┐              ┌──────▼──────┐        ┌──────▼──────┐
    │  Redis │              │ PostgreSQL  │        │  MongoDB    │
    │ Cache  │              │   Primary   │        │   Logs      │
    └────────┘              └─────────────┘        └─────────────┘
        │                           │                       │
    ┌───▼────┐              ┌──────▼──────┐        ┌──────▼──────┐
    │RabbitMQ│              │Elasticsearch│        │   AWS S3    │
    │ Queue  │              │   Search    │        │   Storage   │
    └────────┘              └─────────────┘        └─────────────┘
```

### 2. Stack Tecnológica

#### Backend
- **Framework**: NestJS (Node.js)
- **Linguagem**: TypeScript
- **Padrões**: Clean Architecture, DDD, CQRS
- **API**: REST + GraphQL (para queries complexas)
- **Comunicação**: gRPC entre microserviços, REST para clientes

#### Frontend
- **Web**: Next.js 14+ (App Router)
- **Mobile**: React Native + Expo
- **State Management**: Zustand/Redux Toolkit
- **UI Components**: Radix UI + Tailwind CSS
- **Forms**: React Hook Form + Zod
- **API Client**: TanStack Query (React Query)

#### Banco de Dados
- **PostgreSQL**: Dados relacionais (usuários, serviços, transações)
- **Redis**: Cache, sessões, rate limiting
- **MongoDB**: Logs, analytics, dados não estruturados
- **Elasticsearch**: Busca avançada de profissionais e serviços

#### Infraestrutura
- **Container**: Docker + Docker Compose (dev), Kubernetes (prod)
- **Cloud**: AWS (primário) - EC2, RDS, ElastiCache, S3, CloudFront
- **CI/CD**: GitHub Actions + ArgoCD
- **Monitoring**: Grafana + Prometheus + Sentry
- **Logs**: ELK Stack (Elasticsearch, Logstash, Kibana)

#### Segurança
- **Auth**: JWT + Refresh Tokens (Redis)
- **OAuth**: Passport.js (Google, Facebook)
- **2FA**: TOTP (Time-based OTP) via speakeasy
- **Rate Limiting**: Redis + express-rate-limit
- **HTTPS**: Let's Encrypt + Cloudflare
- **PCI DSS**: Stripe Connect (compliance gerenciado)

---

## 3. Microserviços Detalhados

### 3.1 Auth Service
**Responsabilidade**: Autenticação, autorização, gestão de sessões

**Endpoints principais**:
```
POST   /auth/register
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh
POST   /auth/verify-email
POST   /auth/forgot-password
POST   /auth/reset-password
POST   /auth/oauth/google
POST   /auth/oauth/facebook
POST   /auth/2fa/enable
POST   /auth/2fa/verify
```

**Dependências**:
- Redis: Tokens, sessões, blacklist
- PostgreSQL: Usuários, credenciais
- RabbitMQ: Email verification queue

**Tecnologias**:
- bcrypt/argon2: Hash de senhas
- jsonwebtoken: JWT
- passport: OAuth
- speakeasy: 2FA

---

### 3.2 User Service
**Responsabilidade**: Perfis, dados pessoais, profissionais

**Endpoints principais**:
```
GET    /users/:id
PUT    /users/:id
DELETE /users/:id
GET    /users/:id/profile
PUT    /users/:id/profile
POST   /users/:id/avatar
GET    /professionals/:id
PUT    /professionals/:id
POST   /professionals/:id/portfolio
POST   /professionals/:id/certifications
GET    /professionals/:id/services
POST   /professionals/:id/services
```

**Dependências**:
- PostgreSQL: Perfis, dados profissionais
- AWS S3: Imagens, portfólio, certificados
- Redis: Cache de perfis
- Elasticsearch: Indexação para busca

---

### 3.3 Search Service
**Responsabilidade**: Busca avançada de profissionais e serviços

**Endpoints principais**:
```
GET    /search/professionals
GET    /search/services
POST   /search/advanced
GET    /search/suggestions
GET    /search/filters
```

**Features**:
- Busca por geolocalização (raio em km)
- Filtros: categoria, preço, avaliação, disponibilidade
- Ordenação: relevância, preço, avaliação, distância
- Sugestões autocomplete
- Faceted search (agregações)

**Dependências**:
- Elasticsearch: Engine de busca
- Redis: Cache de resultados
- PostgreSQL: Dados complementares

**Indexação**:
```json
{
  "professional_index": {
    "id": "uuid",
    "name": "text",
    "category": "keyword",
    "services": "text[]",
    "location": "geo_point",
    "price_range": "integer_range",
    "rating": "float",
    "total_reviews": "integer",
    "availability": "boolean",
    "certifications": "keyword[]",
    "created_at": "date"
  }
}
```

---

### 3.4 Booking Service
**Responsabilidade**: Agendamentos, disponibilidade, gestão de agenda

**Endpoints principais**:
```
POST   /bookings
GET    /bookings/:id
PUT    /bookings/:id
DELETE /bookings/:id
GET    /bookings/customer/:customerId
GET    /bookings/professional/:professionalId
GET    /bookings/:id/availability
POST   /bookings/:id/confirm
POST   /bookings/:id/cancel
POST   /bookings/:id/complete
```

**Estados do agendamento**:
```
pending → confirmed → in_progress → completed
pending → cancelled (cliente ou profissional)
pending → rejected (profissional)
```

**Dependências**:
- PostgreSQL: Agendamentos
- Redis: Lock de horários (evitar double booking)
- Google Calendar API: Sincronização
- RabbitMQ: Notificações assíncronas

**Integração Google Calendar**:
- OAuth 2.0 para acesso
- Sincronização bidirecional
- Webhook para atualização em tempo real

---

### 3.5 Payment Service
**Responsabilidade**: Pagamentos, retenção, transferências, reembolsos

**Endpoints principais**:
```
POST   /payments/create-intent
POST   /payments/confirm
POST   /payments/capture
POST   /payments/refund
GET    /payments/:id
GET    /payments/customer/:customerId
GET    /payments/professional/:professionalId
POST   /payments/payout
GET    /payments/balance/:professionalId
POST   /payments/dispute
```

**Fluxo de pagamento**:
```
1. Cliente agenda → Payment Intent (Stripe)
2. Pagamento autorizado → Status "pending"
3. Profissional aceita → Captura parcial (15% fee)
4. Serviço concluído → Captura total
5. Transferência para profissional → D+1 útil
```

**Taxa da plataforma**: 15% sobre valor total

**Métodos de pagamento**:
- Cartão de crédito/débito (Stripe)
- PIX (Stripe + parceiros)
- Boleto (opcional)

**Dependências**:
- Stripe Connect: Processamento
- PostgreSQL: Transações
- RabbitMQ: Processamento assíncrono
- Webhooks: Eventos do Stripe

**Segurança**:
- PCI DSS Level 1 (via Stripe)
- Tokenização de cartões
- 3D Secure para transações
- Detecção de fraude (Stripe Radar)

---

### 3.6 Review Service
**Responsabilidade**: Avaliações, comentários, moderação

**Endpoints principais**:
```
POST   /reviews
GET    /reviews/:id
PUT    /reviews/:id
DELETE /reviews/:id (apenas admin)
GET    /reviews/professional/:professionalId
POST   /reviews/:id/response
GET    /reviews/customer/:customerId
POST   /reviews/:id/report
GET    /reviews/pending-moderation
```

**Regras de negócio**:
- Apenas clientes que finalizaram serviço podem avaliar
- 1 avaliação por serviço
- Profissional pode responder 1 vez
- Avaliações anônimas não permitidas
- Moderação para conteúdo inapropriado

**Dependências**:
- PostgreSQL: Avaliações
- MongoDB: Histórico de moderação
- RabbitMQ: Fila de moderação
- ML Service (futuro): Detecção de spam/abuso

---

### 3.7 Notification Service
**Responsabilidade**: Email, SMS, Push, in-app notifications

**Endpoints principais**:
```
POST   /notifications/send
GET    /notifications/user/:userId
PUT    /notifications/:id/read
DELETE /notifications/:id
GET    /notifications/preferences/:userId
PUT    /notifications/preferences/:userId
```

**Canais**:
- **Email**: SendGrid/AWS SES
- **SMS**: Twilio
- **Push**: Firebase Cloud Messaging
- **WhatsApp**: WhatsApp Business API

**Templates**:
- Confirmação de cadastro
- Agendamento criado/confirmado/cancelado
- Pagamento processado/falhado
- Nova avaliação
- Mensagem de chat
- Promoções (com opt-in)

**Dependências**:
- PostgreSQL: Preferências
- RabbitMQ: Fila de envio
- Redis: Deduplicação, rate limiting
- Serviços externos: SendGrid, Twilio, FCM

---

### 3.8 Calendar Service
**Responsabilidade**: Sincronização de agendas externas

**Endpoints principais**:
```
POST   /calendar/connect/google
POST   /calendar/sync/:professionalId
GET    /calendar/events/:professionalId
POST   /calendar/block-time
DELETE /calendar/block-time/:id
```

**Features**:
- OAuth com Google Calendar
- Sincronização bidirecional
- Bloqueio de horários
- Detecção de conflitos
- Webhook para atualizações

---

### 3.9 Admin Service
**Responsabilidade**: Painel administrativo, moderação, analytics

**Endpoints principais**:
```
GET    /admin/dashboard
GET    /admin/users
PUT    /admin/users/:id/status
GET    /admin/professionals/pending
PUT    /admin/professionals/:id/approve
GET    /admin/transactions
GET    /admin/disputes
PUT    /admin/disputes/:id/resolve
GET    /admin/reports
GET    /admin/analytics
```

**Funcionalidades**:
- Aprovação de profissionais
- Moderação de conteúdo
- Gestão de disputas
- Analytics e relatórios
- Gestão de categorias/serviços
- Configurações de plataforma

---

## 4. Segurança e Compliance

### 4.1 Autenticação e Autorização

**JWT Strategy**:
```typescript
{
  access_token: {
    expiry: "15m",
    payload: { userId, role, permissions }
  },
  refresh_token: {
    expiry: "7d",
    storage: "Redis",
    rotation: true
  }
}
```

**RBAC (Role-Based Access Control)**:
```
Roles:
- CUSTOMER: cliente padrão
- PROFESSIONAL: prestador de serviço
- ADMIN: administrador
- SUPER_ADMIN: super administrador

Permissions:
- users:read, users:write, users:delete
- bookings:read, bookings:write, bookings:cancel
- payments:read, payments:refund
- reviews:read, reviews:write, reviews:moderate
- admin:all
```

### 4.2 OWASP Top 10 Mitigations

1. **Injection**: Prepared statements (TypeORM/Prisma), input validation (Zod)
2. **Broken Auth**: JWT + refresh tokens, 2FA, session management
3. **Sensitive Data Exposure**: HTTPS everywhere, encryption at rest (AWS KMS)
4. **XML External Entities**: N/A (JSON only)
5. **Broken Access Control**: RBAC, ownership validation
6. **Security Misconfiguration**: Helmet.js, CORS, security headers
7. **XSS**: Input sanitization, CSP headers, DOMPurify
8. **Insecure Deserialization**: Type validation (Zod), no eval()
9. **Components with Known Vulnerabilities**: Dependabot, npm audit
10. **Insufficient Logging**: Structured logging (Winston), audit trails

### 4.3 LGPD Compliance

- **Consentimento explícito**: Opt-in para marketing
- **Direito ao esquecimento**: Endpoint de exclusão de dados
- **Portabilidade**: Export de dados em JSON
- **Minimização**: Coleta apenas dados necessários
- **Anonimização**: Analytics sem PII
- **DPO**: Designado no sistema
- **Relatório de vazamento**: Protocolo de 72h

---

## 5. Infraestrutura e DevOps

### 5.1 Ambiente de Desenvolvimento

**Docker Compose Stack**:
```yaml
services:
  - api-gateway: Kong/Nginx
  - auth-service: NestJS
  - user-service: NestJS
  - booking-service: NestJS
  - payment-service: NestJS
  - search-service: NestJS
  - review-service: NestJS
  - notification-service: NestJS
  - calendar-service: NestJS
  - admin-service: NestJS
  - postgres: PostgreSQL 16
  - redis: Redis 7
  - mongodb: MongoDB 7
  - elasticsearch: Elasticsearch 8
  - rabbitmq: RabbitMQ 3.12
  - minio: S3-compatible (local)
```

### 5.2 Kubernetes (Produção)

**Namespaces**:
- `production`: Produção
- `staging`: Homologação
- `development`: Desenvolvimento

**Resources**:
```yaml
Deployment:
  - replicas: 3 (min), 10 (max)
  - autoscaling: HPA (CPU 70%, Memory 80%)
  - rolling update: maxSurge 1, maxUnavailable 0
  
Service:
  - type: ClusterIP (interno)
  - LoadBalancer (API Gateway)
  
Ingress:
  - controller: Nginx Ingress
  - TLS: cert-manager (Let's Encrypt)
  - rate limiting: 100 req/min
```

### 5.3 CI/CD Pipeline

**GitHub Actions Workflow**:
```
1. Commit → Branch
2. Lint (ESLint, Prettier)
3. Unit Tests (Jest, >80% coverage)
4. Build (TypeScript)
5. Integration Tests (Supertest)
6. Security Scan (Snyk, OWASP Dependency Check)
7. Build Docker Image
8. Push to Registry (AWS ECR)
9. Deploy to Staging (ArgoCD)
10. E2E Tests (Playwright)
11. Manual Approval
12. Deploy to Production (Blue/Green)
13. Health Check
14. Rollback (se falhar)
```

### 5.4 Monitoring e Observability

**Stack**:
- **Metrics**: Prometheus + Grafana
- **Logs**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Tracing**: Jaeger (OpenTelemetry)
- **APM**: Sentry (errors), Datadog (performance)
- **Uptime**: UptimeRobot, PagerDuty (alertas)

**Dashboards**:
- Request rate, latency, error rate (RED metrics)
- CPU, memory, disk (USE metrics)
- Database connections, query performance
- Cache hit rate
- Message queue depth
- Business metrics (bookings, revenue, users)

**Alertas**:
- Error rate > 1%
- Latency p99 > 1s
- CPU > 80%
- Memory > 85%
- Disk > 90%
- Database connections > 80%

---

## 6. Escalabilidade e Performance

### 6.1 Estratégias de Cache

**Redis Multi-Layer**:
```
L1 - Application Cache (in-memory):
  - User sessions: 15min TTL
  - JWT blacklist: token expiry TTL

L2 - Redis Cache:
  - User profiles: 1h TTL
  - Professional profiles: 30min TTL
  - Search results: 5min TTL
  - Categories/Services: 24h TTL
  
L3 - CDN (CloudFront):
  - Static assets: 1 year
  - Images: 30 days
  - API responses (public): 1min
```

**Cache Invalidation**:
- Event-driven (RabbitMQ)
- Write-through pattern
- Time-based expiration
- Tag-based invalidation

### 6.2 Database Optimization

**PostgreSQL**:
```sql
-- Particionamento de bookings por data
CREATE TABLE bookings_2024_01 PARTITION OF bookings
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Índices compostos
CREATE INDEX idx_professionals_location_rating 
  ON professionals USING btree (location, rating DESC);

-- Índice GiST para geolocalização
CREATE INDEX idx_professionals_location_gist
  ON professionals USING GIST (location);
```

**Read Replicas**:
- 1 Primary (write)
- 2 Replicas (read)
- Load balancing com PgBouncer

**Connection Pooling**:
- PgBouncer: 100 conexões max
- Application pool: 20 conexões por instância

### 6.3 Horizontal Scaling

**Stateless Services**:
- Auto-scaling baseado em CPU/Memory
- Load balancing com Nginx/HAProxy
- Session storage em Redis (shared)

**Sharding (futuro)**:
- Sharding por região geográfica
- Sharding por tenant (white-label)

### 6.4 Message Queue

**RabbitMQ Exchanges**:
```
Exchanges:
  - booking.events (topic)
  - payment.events (topic)
  - notification.events (fanout)
  
Queues:
  - email.queue (durable, persistent)
  - sms.queue (durable, persistent)
  - push.queue (durable, persistent)
  - analytics.queue (lazy, low priority)
```

**Dead Letter Queue**:
- Retry: 3 tentativas com backoff exponencial
- DLQ para análise de falhas

---

## 7. Integrações Externas

### 7.1 Stripe Connect

**Fluxo de Onboarding**:
```
1. Profissional solicita cadastro
2. Create Stripe Connect Account (Express)
3. Redirect para Stripe onboarding
4. Webhook: account.updated
5. Ativar conta profissional
```

**Split Payment**:
```typescript
{
  amount: 10000, // R$ 100,00
  application_fee_amount: 1500, // 15% = R$ 15,00
  transfer_data: {
    destination: professionalStripeAccountId
  }
}
```

### 7.2 Google Calendar API

**OAuth Flow**:
```
1. User consent screen
2. Authorization code
3. Exchange for access/refresh tokens
4. Store encrypted in DB
5. Refresh token rotation
```

**Sync Strategy**:
- Webhook push notifications
- Incremental sync (apenas delta)
- Full sync diário (off-peak)

### 7.3 Google Maps API

**Features**:
- Geocoding: Endereço → Lat/Lng
- Places API: Autocomplete
- Distance Matrix: Cálculo de distância
- Geolocation: IP → Location

**Otimização**:
- Cache de coordenadas (Redis)
- Batch requests
- Free tier: 28,000 requests/mês

### 7.4 WhatsApp Business API

**Use Cases**:
- Confirmação de agendamento
- Lembretes 24h antes
- Notificação de pagamento
- Suporte ao cliente

**Provider**: Twilio WhatsApp API

---

## 8. Roadmap de Implementação

### Fase 1 - MVP (3 meses)
**Objetivo**: Produto mínimo viável para validação

**Escopo**:
- ✅ Auth Service (email/senha, JWT)
- ✅ User Service (perfis básicos)
- ✅ Search Service (busca simples)
- ✅ Booking Service (agendamento básico)
- ✅ Payment Service (Stripe, cartão)
- ✅ Review Service (avaliações)
- ✅ Frontend Web (Next.js)
- ✅ Admin básico

**Tecnologias**:
- Monolito modular (NestJS)
- PostgreSQL + Redis
- Deploy: Docker Compose (VPS)

### Fase 2 - Growth (3 meses)
**Objetivo**: Crescimento e refinamento

**Escopo**:
- 🔄 Notification Service completo
- 🔄 Calendar Service (Google sync)
- 🔄 Search avançada (Elasticsearch)
- 🔄 Mobile App (React Native)
- 🔄 Chat em tempo real (Socket.io)
- 🔄 PIX payments
- 🔄 OAuth (Google, Facebook)

**Infra**:
- Migração para microserviços
- Kubernetes (AWS EKS)
- CI/CD completo

### Fase 3 - Scale (3+ meses)
**Objetivo**: Escala e otimização

**Escopo**:
- 📋 ML recommendations
- 📋 Analytics avançado
- 📋 Multi-tenant (white-label)
- 📋 International expansion
- 📋 API pública (developers)
- 📋 Marketplace de plugins

**Infra**:
- Multi-region
- CDN global
- Data Lake (analytics)

---

## 9. Estimativas e Recursos

### Time Necessário (MVP)

**Backend** (2 devs senior):
- Setup infra: 1 semana
- Auth Service: 2 semanas
- User/Professional: 2 semanas
- Booking: 3 semanas
- Payment: 3 semanas
- Search: 2 semanas
- Review: 1 semana
- Admin: 2 semanas
- Testes/ajustes: 2 semanas
**Total**: ~18 semanas

**Frontend** (2 devs senior):
- Setup + design system: 2 semanas
- Auth/Onboarding: 2 semanas
- Search/Listing: 2 semanas
- Professional profile: 2 semanas
- Booking flow: 3 semanas
- Payment: 2 semanas
- Dashboard: 3 semanas
- Admin: 2 semanas
**Total**: ~18 semanas

**Mobile** (1 dev senior - Fase 2):
- Setup: 1 semana
- Core features: 8 semanas
- Testing: 2 semanas
**Total**: ~11 semanas

### Custos Mensais Estimados (MVP)

**Infraestrutura**:
- AWS EC2 (3x t3.medium): $150
- RDS PostgreSQL (db.t3.medium): $80
- ElastiCache Redis: $50
- S3 + CloudFront: $30
- ALB + Route53: $30
**Subtotal**: ~$340/mês

**Serviços Externos**:
- Stripe: 2.9% + $0.30 por transação
- SendGrid: $20/mês (40k emails)
- Twilio SMS: pay-as-you-go
- Google Maps: $0 (free tier)
- Sentry: $26/mês (dev tier)
**Subtotal**: ~$46/mês + variável

**Total Estimado (infra)**: ~$400/mês (MVP)

**Escalado (10k usuários ativos)**:
- Infraestrutura: ~$2,000/mês
- Serviços externos: ~$500/mês
- Stripe fees: 3% do GMV
**Total**: ~$2,500/mês + % GMV

---

## 10. Riscos e Mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Vazamento de dados | Alto | Baixa | Criptografia, auditorias, LGPD compliance |
| Fraude de pagamento | Alto | Média | Stripe Radar, verificação de identidade |
| Falha em pagamento | Alto | Média | Retry logic, fallback, monitoring |
| Indisponibilidade | Médio | Baixa | HA, auto-scaling, multi-AZ |
| Performance ruim | Médio | Média | Cache, CDN, load testing |
| Baixa adoção | Alto | Média | MVP rápido, feedback loop, marketing |
| Regulação/Legal | Alto | Baixa | Jurídico, T&C claros, compliance |

---

## Conclusão

Esta arquitetura foi desenhada para:

1. **Escalabilidade**: Microserviços, cache, auto-scaling
2. **Confiabilidade**: HA, monitoring, circuit breakers
3. **Segurança**: OWASP, PCI DSS, LGPD, encryption
4. **Performance**: CDN, cache multi-layer, DB optimization
5. **Manutenibilidade**: Clean code, testes, CI/CD
6. **Custo-efetividade**: Pay-as-you-grow, serverless onde possível

O sistema está pronto para escalar de 0 a 100k+ usuários com ajustes incrementais, mantendo alta qualidade e baixo TCO (Total Cost of Ownership).
