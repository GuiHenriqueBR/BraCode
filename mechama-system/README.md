# MeChama - Plataforma de Serviços

## Visão Geral
MeChama é uma plataforma digital que conecta clientes a prestadores de serviços, tanto online quanto presenciais. O sistema permite buscas avançadas, agendamento em tempo real, pagamentos seguros e uma interface intuitiva para usuários e profissionais.

## Arquitetura do Sistema

### Microserviços
- **API Gateway**: Roteamento e autenticação centralizada
- **User Service**: Gestão de usuários (clientes/profissionais)
- **Auth Service**: Autenticação e autorização
- **Search Service**: Busca e filtros avançados
- **Booking Service**: Agendamento e calendário
- **Payment Service**: Processamento de pagamentos
- **Rating Service**: Avaliações e feedback
- **Notification Service**: Notificações e comunicação
- **Admin Service**: Painel administrativo

### Stack Tecnológica
- **Frontend**: Next.js 14 + TypeScript + TailwindCSS
- **Backend**: Node.js + NestJS + TypeScript
- **Banco de Dados**: PostgreSQL + Redis + Elasticsearch
- **Pagamentos**: Stripe Connect
- **Infraestrutura**: Docker + Kubernetes
- **Cloud**: AWS (S3, RDS, ElastiCache, EKS)

## Estrutura do Projeto

```
mechama-system/
├── apps/
│   ├── web/                    # Frontend Next.js
│   ├── mobile/                 # React Native (futuro)
│   └── admin/                  # Painel administrativo
├── services/
│   ├── api-gateway/           # Gateway principal
│   ├── user-service/          # Gestão de usuários
│   ├── auth-service/          # Autenticação
│   ├── search-service/        # Busca e filtros
│   ├── booking-service/       # Agendamentos
│   ├── payment-service/       # Pagamentos
│   ├── rating-service/        # Avaliações
│   ├── notification-service/  # Notificações
│   └── admin-service/         # Administração
├── packages/
│   ├── shared/                # Código compartilhado
│   ├── database/              # Schemas e migrations
│   └── types/                 # TypeScript types
├── infrastructure/
│   ├── docker/                # Docker configs
│   ├── k8s/                   # Kubernetes manifests
│   └── terraform/             # Infrastructure as Code
└── docs/                      # Documentação
```

## Funcionalidades Principais

### Para Clientes
- Cadastro e login (email/OAuth/2FA)
- Busca avançada de profissionais
- Agendamento de serviços
- Pagamentos seguros
- Avaliações e feedback
- Histórico de serviços

### Para Profissionais
- Perfil profissional completo
- Gestão de serviços e preços
- Agenda sincronizada
- Dashboard financeiro
- Gestão de avaliações

### Para Administradores
- Painel de controle geral
- Gestão de usuários
- Moderação de conteúdo
- Relatórios e analytics
- Gestão de transações

## Fluxo de Desenvolvimento

### Fase 1 - MVP (2-3 meses)
- [ ] Estrutura base dos microserviços
- [ ] Sistema de autenticação
- [ ] Cadastro de usuários básico
- [ ] Busca simples
- [ ] Agendamento básico
- [ ] Integração de pagamentos

### Fase 2 - Funcionalidades Avançadas (2-3 meses)
- [ ] Busca avançada com filtros
- [ ] Sistema de avaliações
- [ ] Dashboard profissional
- [ ] Painel administrativo
- [ ] Notificações

### Fase 3 - Escalabilidade (2-3 meses)
- [ ] App móvel
- [ ] Chat em tempo real
- [ ] Analytics avançados
- [ ] Machine Learning para recomendações
- [ ] Otimizações de performance

## Segurança e Compliance
- HTTPS obrigatório
- JWT com refresh tokens
- OAuth 2.0 (Google/Facebook)
- Criptografia de dados sensíveis
- Compliance com LGPD
- PCI DSS para pagamentos

## Como Executar

### Pré-requisitos
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Desenvolvimento Local
```bash
# Clonar o repositório
git clone <repo-url>
cd mechama-system

# Instalar dependências
npm install

# Configurar ambiente
cp .env.example .env

# Subir serviços de infraestrutura
docker-compose up -d postgres redis elasticsearch

# Executar migrations
npm run db:migrate

# Iniciar serviços em modo desenvolvimento
npm run dev
```

## Contribuição
Consulte [CONTRIBUTING.md](./CONTRIBUTING.md) para diretrizes de contribuição.

## Licença
Este projeto está sob licença MIT. Consulte [LICENSE](./LICENSE) para mais informações.