# MeChama - Plataforma de Serviços

## Visão Geral
MeChama é uma plataforma digital que conecta clientes a prestadores de serviços, tanto online quanto presenciais. O sistema permite buscas avançadas, agendamento em tempo real, pagamentos seguros e uma interface intuitiva para usuários e profissionais.

## Arquitetura

### Backend
- **Framework**: NestJS com TypeScript
- **Banco de Dados**: PostgreSQL (principal) + Redis (cache) + MongoDB (logs)
- **Busca**: Elasticsearch
- **Pagamentos**: Stripe Connect
- **Autenticação**: JWT + OAuth (Google/Facebook)
- **Arquitetura**: Microserviços

### Frontend
- **Framework**: Next.js 14 com TypeScript
- **Styling**: TailwindCSS + shadcn/ui
- **Estado**: Zustand + React Query
- **Maps**: Google Maps API
- **Notificações**: Firebase Cloud Messaging

### Infraestrutura
- **Containerização**: Docker + Docker Compose
- **Orquestração**: Kubernetes
- **Cloud**: AWS
- **CI/CD**: GitHub Actions

## Estrutura do Projeto

```
mechama/
├── apps/
│   ├── api/                 # Backend API (NestJS)
│   ├── web/                 # Frontend Web (Next.js)
│   └── mobile/              # Mobile App (React Native)
├── packages/
│   ├── shared/              # Código compartilhado
│   ├── ui/                  # Componentes UI
│   └── types/               # Tipos TypeScript
├── services/
│   ├── auth/                # Serviço de autenticação
│   ├── payments/            # Serviço de pagamentos
│   ├── search/              # Serviço de busca
│   └── notifications/       # Serviço de notificações
├── infrastructure/
│   ├── docker/              # Configurações Docker
│   ├── k8s/                 # Manifests Kubernetes
│   └── terraform/           # Infraestrutura como código
└── docs/                    # Documentação
```

## Funcionalidades Principais

### Para Clientes
- Cadastro e login seguro
- Busca avançada de serviços
- Agendamento em tempo real
- Pagamentos integrados
- Avaliações e reviews
- Histórico de serviços

### Para Profissionais
- Perfil completo com portfólio
- Gestão de agenda
- Dashboard financeiro
- Gestão de serviços e preços
- Sistema de avaliações

### Para Administradores
- Painel de controle
- Gestão de usuários
- Relatórios analíticos
- Moderação de conteúdo

## Tecnologias

### Backend
- Node.js + NestJS
- PostgreSQL + Prisma ORM
- Redis
- Elasticsearch
- Stripe API
- JWT + OAuth2

### Frontend
- Next.js 14
- TypeScript
- TailwindCSS
- shadcn/ui
- React Query
- Zustand

### DevOps
- Docker
- Kubernetes
- AWS
- GitHub Actions
- Terraform

## Como Executar

### Pré-requisitos
- Node.js 18+
- Docker e Docker Compose
- PostgreSQL
- Redis

### Desenvolvimento
```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env

# Executar com Docker Compose
docker-compose up -d

# Executar em modo desenvolvimento
npm run dev
```

## Licença
MIT