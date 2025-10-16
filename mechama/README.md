# MeChama - Plataforma de Serviços

## 🚀 Visão Geral

MeChama é uma plataforma digital moderna que conecta clientes a prestadores de serviços, tanto online quanto presenciais. O sistema oferece buscas avançadas, agendamento em tempo real, pagamentos seguros e uma interface intuitiva para usuários e profissionais.

## ✨ Funcionalidades Principais

### Para Clientes
- 🔐 **Autenticação Segura**: Login com email/senha, OAuth (Google/Facebook) e 2FA
- 🔍 **Busca Avançada**: Filtros por região, preço, avaliação, categorias e disponibilidade
- 📅 **Agendamento Inteligente**: Integração com Google Calendar e horários em tempo real
- 💳 **Pagamentos Seguros**: Integração com Stripe (PIX, cartão de crédito/débito)
- ⭐ **Sistema de Avaliações**: Avalie profissionais e serviços após o atendimento
- 📱 **Interface Responsiva**: Experiência otimizada para desktop e mobile

### Para Profissionais
- 👤 **Perfil Completo**: Portfólio, certificações, habilidades e disponibilidade
- 📊 **Dashboard Financeiro**: Acompanhe ganhos, saldo e transações
- 📅 **Gestão de Agenda**: Controle de horários e disponibilidade
- 💰 **Gestão de Serviços**: Crie e gerencie seus serviços e preços
- 📈 **Analytics**: Relatórios de performance e clientes

### Para Administradores
- 🛠️ **Painel de Controle**: Gestão completa da plataforma
- 👥 **Gestão de Usuários**: Controle de clientes e profissionais
- 📊 **Relatórios Analíticos**: Métricas e insights do negócio
- 🔧 **Moderação**: Controle de conteúdo e avaliações

## 🏗️ Arquitetura

### Backend (Microserviços)
- **API Gateway**: Ponto de entrada único com NestJS
- **Auth Service**: Autenticação e autorização JWT + OAuth
- **Users Service**: Gestão de usuários e perfis
- **Services Service**: Catálogo de serviços e profissionais
- **Payments Service**: Processamento de pagamentos (Stripe Connect)
- **Notifications Service**: Notificações push e email
- **Scheduling Service**: Agendamento e integração com calendários
- **Reviews Service**: Sistema de avaliações e reviews

### Frontend
- **Web App**: Next.js 14 com TypeScript e TailwindCSS
- **Mobile App**: React Native (planejado)

### Banco de Dados
- **PostgreSQL**: Dados relacionais principais
- **Redis**: Cache e sessões
- **MongoDB**: Dados não estruturados (logs, analytics)
- **Elasticsearch**: Busca e indexação

### Infraestrutura
- **Docker**: Containerização de serviços
- **Kubernetes**: Orquestração (produção)
- **AWS/GCP**: Cloud hosting
- **CI/CD**: GitHub Actions

## 🛠️ Tecnologias

### Backend
- **Node.js** + **NestJS** - Framework principal
- **PostgreSQL** + **Prisma** - Banco de dados e ORM
- **Redis** - Cache e sessões
- **JWT** + **OAuth2** - Autenticação
- **Stripe Connect** - Pagamentos
- **Docker** + **Kubernetes** - Containerização

### Frontend
- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **TailwindCSS** - Estilização
- **React Query** - Gerenciamento de estado
- **Zustand** - Estado global
- **Framer Motion** - Animações

### DevOps
- **Docker** - Containerização
- **Docker Compose** - Desenvolvimento local
- **GitHub Actions** - CI/CD
- **Terraform** - Infraestrutura como código

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- Docker e Docker Compose
- Git

### Instalação Rápida

1. **Clone o repositório**
   ```bash
   git clone https://github.com/mechama/platform.git
   cd mechama
   ```

2. **Execute o script de setup**
   ```bash
   ./scripts/setup.sh
   ```

3. **Configure as variáveis de ambiente**
   ```bash
   cp .env.example .env
   # Edite o arquivo .env com suas configurações
   ```

4. **Inicie os serviços**
   ```bash
   npm run dev
   ```

### Instalação Manual

1. **Instale as dependências**
   ```bash
   npm run install:all
   ```

2. **Configure o banco de dados**
   ```bash
   docker-compose up -d postgres redis mongodb elasticsearch
   ```

3. **Execute as migrações**
   ```bash
   cd backend/gateway
   npx prisma migrate dev
   ```

4. **Inicie os serviços de desenvolvimento**
   ```bash
   npm run dev
   ```

## 📁 Estrutura do Projeto

```
mechama/
├── backend/
│   ├── gateway/              # API Gateway
│   └── services/             # Microserviços
│       ├── auth/            # Autenticação
│       ├── users/           # Usuários
│       ├── services/        # Serviços
│       ├── payments/        # Pagamentos
│       ├── notifications/   # Notificações
│       ├── scheduling/      # Agendamento
│       └── reviews/         # Avaliações
├── frontend/                 # Aplicação web
├── mobile/                   # App móvel (futuro)
├── shared/                   # Tipos e utilitários compartilhados
├── infrastructure/           # Docker, K8s, Terraform
├── scripts/                  # Scripts de automação
└── docs/                     # Documentação
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev                  # Inicia todos os serviços
npm run dev:backend         # Apenas backend
npm run dev:frontend        # Apenas frontend

# Build
npm run build               # Build completo
npm run build:backend       # Build backend
npm run build:frontend      # Build frontend

# Testes
npm run test                # Todos os testes
npm run test:backend        # Testes backend
npm run test:frontend       # Testes frontend

# Linting
npm run lint                # Lint completo
npm run lint:backend        # Lint backend
npm run lint:frontend       # Lint frontend

# Docker
npm run docker:up           # Inicia containers
npm run docker:down         # Para containers
npm run docker:build        # Build containers
```

## 🔐 Segurança

- **Autenticação JWT** com refresh tokens
- **OAuth2** (Google, Facebook)
- **2FA** opcional
- **Criptografia** de dados sensíveis
- **Validação rigorosa** de inputs
- **Rate limiting** e proteção contra ataques
- **HTTPS** obrigatório
- **Certificações PCI DSS** para pagamentos

## 📊 Monitoramento

- **Health checks** para todos os serviços
- **Logs estruturados** com Winston
- **Métricas** com Prometheus
- **Alertas** com Grafana
- **Tracing** distribuído com Jaeger

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

- **Email**: suporte@mechama.com
- **Discord**: [MeChama Community](https://discord.gg/mechama)
- **Documentação**: [docs.mechama.com](https://docs.mechama.com)

## 🗺️ Roadmap

### Fase 1 (MVP) - ✅ Concluído
- [x] Estrutura base do projeto
- [x] Autenticação e autorização
- [x] Sistema de usuários
- [x] Catálogo de serviços
- [x] Sistema de pagamentos básico

### Fase 2 (Lançamento) - 🚧 Em Desenvolvimento
- [ ] App móvel React Native
- [ ] Sistema de notificações push
- [ ] Chat em tempo real
- [ ] Integração com Google Maps
- [ ] Sistema de avaliações completo

### Fase 3 (Escala) - 📋 Planejado
- [ ] Machine Learning para recomendações
- [ ] Analytics avançado
- [ ] Integração com mais provedores de pagamento
- [ ] API pública para terceiros
- [ ] Sistema de afiliados

---

**Desenvolvido com ❤️ pela equipe MeChama**