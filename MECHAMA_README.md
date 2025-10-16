# MeChama - Planejamento Completo do Sistema

## 📋 Visão Geral

**MeChama** é uma plataforma digital que conecta clientes a prestadores de serviços, oferecendo busca avançada, agendamento em tempo real, pagamentos seguros e interface intuitiva.

---

## 📚 Documentação Técnica

Este repositório contém o planejamento completo do sistema MeChama, dividido em 7 documentos técnicos:

### 1. [Arquitetura do Sistema](./MECHAMA_ARCHITECTURE.md)
- **Microserviços**: 9 serviços especializados (Auth, User, Booking, Payment, etc.)
- **Stack Backend**: NestJS, TypeScript, PostgreSQL, Redis, MongoDB, Elasticsearch
- **Stack Frontend**: Next.js 14, React Native, Tailwind CSS
- **Infraestrutura**: AWS (EKS, RDS, ElastiCache, S3), Docker, Kubernetes
- **Escalabilidade**: Auto-scaling, cache multi-layer, CDN global

### 2. [Modelagem de Banco de Dados](./MECHAMA_DATABASE_SCHEMA.md)
- **PostgreSQL**: 20+ tabelas (users, professionals, bookings, payments, reviews)
- **Redis**: Cache, sessions, rate limiting, locks
- **MongoDB**: Logs, analytics, webhooks
- **Elasticsearch**: Busca avançada de profissionais com geolocalização

### 3. [Especificação de APIs](./MECHAMA_API_SPECIFICATION.md)
- **Auth Service**: Login, registro, OAuth, 2FA, password reset
- **User Service**: Perfis de clientes e profissionais
- **Search Service**: Busca com filtros e geolocalização
- **Booking Service**: Agendamentos, disponibilidade, confirmação
- **Payment Service**: Stripe payments, split, refunds, payouts
- **Review Service**: Avaliações, respostas, moderação

### 4. [Autenticação e Segurança](./MECHAMA_AUTH_SECURITY.md)
- **JWT**: Access tokens (15 min) + Refresh tokens (7 dias)
- **RBAC**: Roles (Customer, Professional, Admin) com permissions
- **OAuth 2.0**: Google e Facebook login
- **2FA**: TOTP com backup codes
- **OWASP Top 10**: Mitigações completas
- **LGPD**: Compliance com direito ao esquecimento e portabilidade

### 5. [Integrações Externas](./MECHAMA_INTEGRATIONS.md)
- **Stripe Connect**: Pagamentos, split (15% fee), payouts
- **Google Calendar**: Sync bidirecional, webhooks
- **Google Maps**: Geocoding, autocomplete, distance matrix
- **AWS S3**: Upload de imagens, certificados
- **SendGrid**: Emails transacionais
- **Twilio**: SMS e WhatsApp
- **Firebase**: Push notifications

### 6. [Frontend e Mobile](./MECHAMA_FRONTEND.md)
- **Web**: Next.js 14 (App Router), Tailwind CSS, Radix UI
- **Mobile**: React Native + Expo, React Navigation
- **State**: Zustand + TanStack Query
- **Forms**: React Hook Form + Zod
- **Performance**: Code splitting, image optimization, caching
- **SEO**: Metadata, structured data, sitemap

### 7. [CI/CD e Infraestrutura](./MECHAMA_CICD_INFRA.md)
- **AWS**: EKS, RDS Multi-AZ, ElastiCache, S3, CloudFront
- **Kubernetes**: Deployments, HPA, Ingress (ALB)
- **CI/CD**: GitHub Actions, ArgoCD (GitOps)
- **Monitoring**: Prometheus, Grafana, ELK, Jaeger, Sentry
- **Disaster Recovery**: Backups automáticos, failover, RTO < 1h

---

## 🏗️ Arquitetura High-Level

```
┌─────────────────────────────────────────────────────────────────┐
│                         API Gateway (Kong)                       │
└─────────────────────────┬───────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
   │  Auth   │       │  User   │       │ Booking │
   │ Service │       │ Service │       │ Service │
   └─────────┘       └─────────┘       └─────────┘
        │                 │                 │
   ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
   │ Payment │       │ Search  │       │ Review  │
   │ Service │       │ Service │       │ Service │
   └─────────┘       └─────────┘       └─────────┘
        │
   ┌────▼────────────────────────────────┐
   │  PostgreSQL  │  Redis  │  MongoDB   │
   │ Elasticsearch│   S3    │  RabbitMQ  │
   └──────────────────────────────────────┘
```

---

## 🚀 Roadmap de Implementação

### Fase 1 - MVP (3 meses)
**Objetivo**: Produto mínimo viável para validação

✅ **Backend**:
- Auth Service (email/senha, JWT)
- User Service (perfis básicos)
- Search Service (busca simples)
- Booking Service (agendamento básico)
- Payment Service (Stripe, cartão)
- Review Service (avaliações)

✅ **Frontend**:
- Web (Next.js): Landing, busca, perfil, agendamento
- Admin básico

✅ **Infra**:
- Monolito modular (NestJS)
- PostgreSQL + Redis
- Deploy: Docker Compose (VPS)

### Fase 2 - Growth (3 meses)
**Objetivo**: Crescimento e refinamento

🔄 **Features**:
- Notification Service completo
- Calendar Service (Google sync)
- Search avançada (Elasticsearch)
- Mobile App (React Native)
- Chat em tempo real (Socket.io)
- PIX payments
- OAuth (Google, Facebook)

🔄 **Infra**:
- Migração para microserviços
- Kubernetes (AWS EKS)
- CI/CD completo

### Fase 3 - Scale (3+ meses)
**Objetivo**: Escala e otimização

📋 **Features**:
- ML recommendations
- Analytics avançado
- Multi-tenant (white-label)
- International expansion
- API pública (developers)
- Marketplace de plugins

📋 **Infra**:
- Multi-region
- CDN global
- Data Lake (analytics)

---

## 💰 Estimativa de Custos

### MVP (até 1k usuários)
- **Infraestrutura AWS**: ~$400/mês
- **Serviços externos**: ~$50/mês
- **Total**: ~$450/mês + 3% GMV (Stripe)

### Crescimento (10k usuários ativos)
- **Infraestrutura AWS**: ~$2,000/mês
- **Serviços externos**: ~$500/mês
- **Total**: ~$2,500/mês + 3% GMV

### Escala (100k+ usuários)
- **Infraestrutura AWS**: ~$10,000/mês
- **Serviços externos**: ~$2,000/mês
- **Total**: ~$12,000/mês + 3% GMV

---

## 👥 Time Necessário (MVP)

### Backend (2 devs senior)
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

### Frontend (2 devs senior)
- Setup + design system: 2 semanas
- Auth/Onboarding: 2 semanas
- Search/Listing: 2 semanas
- Professional profile: 2 semanas
- Booking flow: 3 semanas
- Payment: 2 semanas
- Dashboard: 3 semanas
- Admin: 2 semanas
**Total**: ~18 semanas

### Mobile (1 dev senior - Fase 2)
- Setup: 1 semana
- Core features: 8 semanas
- Testing: 2 semanas
**Total**: ~11 semanas

---

## 🔐 Segurança

### Autenticação
- ✅ JWT com refresh token rotation
- ✅ OAuth 2.0 (Google, Facebook)
- ✅ 2FA (TOTP)
- ✅ Password hashing (Argon2)
- ✅ Rate limiting
- ✅ Account lockout

### Autorização
- ✅ RBAC (Role-Based Access Control)
- ✅ Permission-based access
- ✅ Resource ownership validation

### OWASP Top 10
- ✅ Injection: Prepared statements, input validation (Zod)
- ✅ Broken Auth: JWT, 2FA, session management
- ✅ XSS: CSP, DOMPurify, input sanitization
- ✅ Sensitive Data: HTTPS, encryption at-rest, KMS
- ✅ Access Control: RBAC, ownership checks

### Compliance
- ✅ **LGPD**: Consentimento, direito ao esquecimento, portabilidade
- ✅ **PCI DSS**: Via Stripe Connect (Level 1)

---

## 📊 Monitoramento

### Métricas
- **RED**: Request rate, Error rate, Duration (latency)
- **USE**: Utilization, Saturation, Errors
- **Business**: Bookings, revenue, active users

### Stack
- **Metrics**: Prometheus + Grafana
- **Logs**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Tracing**: Jaeger (OpenTelemetry)
- **APM**: Sentry
- **Uptime**: UptimeRobot, PagerDuty

### Alertas
- Error rate > 1%
- Latency p99 > 1s
- CPU > 80%
- Database connections > 80%
- Pod crash looping

---

## 🔄 CI/CD Pipeline

```
Commit → Lint → Tests → Security Scan → Build → Push to ECR
  ↓
Deploy to Staging → E2E Tests → Manual Approval
  ↓
Deploy to Production (Blue/Green) → Smoke Tests → Health Check
  ↓
Success ✅ / Rollback ❌
```

### Ferramentas
- **CI**: GitHub Actions
- **CD**: ArgoCD (GitOps)
- **Registry**: AWS ECR
- **Orchestration**: Kubernetes (EKS)

---

## 🛡️ Disaster Recovery

### Backup
- **RDS**: Diário, retenção 30 dias, cross-region
- **Redis**: Snapshot diário
- **S3**: Versioning + lifecycle

### Recovery
- **RTO**: < 1 hora
- **RPO**: < 15 minutos
- **Strategy**: Multi-AZ, read replicas, failover automático

---

## 📝 Principais Funcionalidades

### Para Clientes
- ✅ Busca avançada de profissionais (filtros, geolocalização)
- ✅ Perfil detalhado do profissional (portfólio, avaliações, certificações)
- ✅ Agendamento online com disponibilidade em tempo real
- ✅ Pagamento seguro (Stripe: cartão, PIX)
- ✅ Avaliação de serviços
- ✅ Histórico de agendamentos
- ✅ Notificações (email, SMS, push)

### Para Profissionais
- ✅ Perfil profissional completo
- ✅ Cadastro de serviços e preços
- ✅ Gestão de agenda (sync com Google Calendar)
- ✅ Dashboard financeiro
- ✅ Gestão de portfólio e certificações
- ✅ Recebimento de pagamentos (Stripe Connect)
- ✅ Resposta a avaliações

### Para Administradores
- ✅ Dashboard analítico
- ✅ Aprovação de profissionais
- ✅ Moderação de conteúdo
- ✅ Gestão de disputas
- ✅ Relatórios financeiros
- ✅ Gestão de usuários

---

## 🌟 Diferenciais Técnicos

1. **Arquitetura Escalável**: Microserviços com auto-scaling horizontal
2. **Performance**: Cache multi-layer, CDN, code splitting
3. **Segurança**: OWASP compliance, LGPD, PCI DSS via Stripe
4. **Observabilidade**: Logs, metrics, traces, alerts completos
5. **DevOps**: CI/CD automático, blue/green deployment, rollback
6. **Resiliência**: Multi-AZ, backups, disaster recovery

---

## 📦 Tecnologias Principais

### Backend
- **Framework**: NestJS (Node.js + TypeScript)
- **Database**: PostgreSQL 16, Redis 7, MongoDB 7
- **Search**: Elasticsearch 8
- **Queue**: RabbitMQ
- **API**: REST + GraphQL

### Frontend
- **Web**: Next.js 14 (React), Tailwind CSS
- **Mobile**: React Native + Expo
- **State**: Zustand, TanStack Query
- **UI**: Radix UI, Headless UI

### Infraestrutura
- **Cloud**: AWS (EKS, RDS, S3, CloudFront)
- **Container**: Docker, Kubernetes
- **CI/CD**: GitHub Actions, ArgoCD
- **Monitoring**: Prometheus, Grafana, ELK, Sentry

### Integrações
- **Payments**: Stripe Connect
- **Calendar**: Google Calendar API
- **Maps**: Google Maps API
- **Storage**: AWS S3
- **Email**: SendGrid
- **SMS**: Twilio
- **Push**: Firebase Cloud Messaging

---

## 📈 Métricas de Sucesso

### Técnicas
- ✅ Uptime: 99.9%
- ✅ Latency P99: < 500ms
- ✅ Error rate: < 0.1%
- ✅ Code coverage: > 80%
- ✅ Deploy frequency: Daily

### Negócio
- 📊 GMV (Gross Merchandise Value)
- 📊 Taxa de conversão (busca → agendamento)
- 📊 NPS (Net Promoter Score)
- 📊 CAC (Customer Acquisition Cost)
- 📊 LTV (Lifetime Value)

---

## 🚦 Próximos Passos

1. **Validação de Mercado** (2 semanas)
   - Pesquisa com público-alvo
   - Definição de personas
   - Prototipação de telas

2. **Setup do Projeto** (1 semana)
   - Criar repositórios (mono-repo)
   - Setup de infraestrutura AWS
   - CI/CD pipeline básico

3. **Desenvolvimento MVP** (12 semanas)
   - Sprint 1-2: Auth + User
   - Sprint 3-4: Search + Booking
   - Sprint 5-6: Payment + Review
   - Sprint 7-8: Frontend Web
   - Sprint 9-10: Admin + Testes
   - Sprint 11-12: Ajustes + Deploy

4. **Beta Testing** (4 semanas)
   - Lançamento fechado
   - Coleta de feedback
   - Ajustes e correções

5. **Lançamento Oficial** (2 semanas)
   - Marketing e divulgação
   - Onboarding de usuários
   - Suporte ativo

---

## 📞 Contato

Para dúvidas ou mais informações sobre o planejamento técnico:

- **Documentação**: Este repositório
- **Arquitetura**: [MECHAMA_ARCHITECTURE.md](./MECHAMA_ARCHITECTURE.md)
- **APIs**: [MECHAMA_API_SPECIFICATION.md](./MECHAMA_API_SPECIFICATION.md)
- **Segurança**: [MECHAMA_AUTH_SECURITY.md](./MECHAMA_AUTH_SECURITY.md)

---

## 📄 Licença

Este planejamento é propriedade intelectual do projeto MeChama.

---

**Desenvolvido com 💙 pela equipe MeChama**

*Última atualização: Janeiro 2025*
