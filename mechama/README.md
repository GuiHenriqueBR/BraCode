# MeChama - Plataforma de Serviços

Plataforma digital que conecta clientes a prestadores de serviços, oferecendo busca avançada, agendamento em tempo real, pagamentos seguros e interface intuitiva.

## 🚀 Stack Tecnológica

### Backend
- **Framework**: NestJS (Node.js + TypeScript)
- **Database**: PostgreSQL 16, Redis 7, MongoDB 7
- **Search**: Elasticsearch 8
- **Queue**: RabbitMQ
- **API**: REST + GraphQL

### Frontend
- **Web**: Next.js 14 (React + TypeScript)
- **Mobile**: React Native + Expo
- **UI**: Tailwind CSS + Radix UI
- **State**: Zustand + TanStack Query

### Infraestrutura
- **Container**: Docker + Kubernetes
- **Cloud**: AWS (EKS, RDS, S3, CloudFront)
- **CI/CD**: GitHub Actions + ArgoCD
- **Monitoring**: Prometheus, Grafana, ELK, Sentry

## 📁 Estrutura do Projeto

```
mechama/
├── backend/          # API NestJS
├── frontend/         # Web Next.js
├── mobile/           # App React Native
├── docs/             # Documentação técnica
├── scripts/          # Scripts utilitários
└── .github/          # GitHub Actions
```

## 🛠️ Setup de Desenvolvimento

### Pré-requisitos
- Node.js 20+
- Docker & Docker Compose
- Git

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/mechama/mechama.git
cd mechama
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

4. Inicie os serviços com Docker:
```bash
npm run docker:dev
```

5. Execute as migrations:
```bash
cd backend && npm run migration:run
```

6. Inicie o desenvolvimento:
```bash
npm run dev
```

### URLs de Desenvolvimento

- **API**: http://localhost:3000/api
- **Swagger**: http://localhost:3000/api/docs
- **Web**: http://localhost:3001
- **RabbitMQ**: http://localhost:15672 (admin/admin)
- **MailHog**: http://localhost:8025

## 📚 Documentação

- [Arquitetura](../MECHAMA_ARCHITECTURE.md)
- [Database Schema](../MECHAMA_DATABASE_SCHEMA.md)
- [API Specification](../MECHAMA_API_SPECIFICATION.md)
- [Auth & Security](../MECHAMA_AUTH_SECURITY.md)
- [Integrations](../MECHAMA_INTEGRATIONS.md)
- [Frontend](../MECHAMA_FRONTEND.md)
- [CI/CD](../MECHAMA_CICD_INFRA.md)

## 🧪 Testes

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## 🔧 Scripts Disponíveis

```bash
npm run dev              # Desenvolvimento (backend + frontend)
npm run build            # Build production
npm run lint             # Lint code
npm run format           # Format code
npm run docker:dev       # Start Docker services
npm run docker:down      # Stop Docker services
```

## 🚢 Deploy

### Staging
```bash
git push origin staging
```

### Production
```bash
git push origin main
# Requer aprovação manual no GitHub Actions
```

## 📊 Monitoramento

- **Logs**: Kibana (http://logs.mechama.com.br)
- **Metrics**: Grafana (http://metrics.mechama.com.br)
- **Errors**: Sentry (https://sentry.io/mechama)

## 🤝 Contribuindo

1. Crie uma branch: `git checkout -b feature/nova-feature`
2. Commit: `git commit -m 'feat: adiciona nova feature'`
3. Push: `git push origin feature/nova-feature`
4. Abra um Pull Request

### Commit Convention
Seguimos o padrão [Conventional Commits](https://www.conventionalcommits.org/):
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Tarefas gerais

## 📄 Licença

Propriedade da MeChama - Todos os direitos reservados

## 👥 Time

- Backend: 2 devs senior
- Frontend: 2 devs senior
- Mobile: 1 dev senior
- DevOps: 1 dev senior

---

**Desenvolvido com 💙 pela equipe MeChama**
