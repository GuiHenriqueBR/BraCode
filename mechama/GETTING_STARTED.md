# MeChama - Guia de Início Rápido

## ⚡ Setup Rápido (5 minutos)

### 1. Clone e Instale

```bash
git clone https://github.com/mechama/mechama.git
cd mechama
npm install
```

### 2. Configure o Ambiente

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

### 3. Inicie os Serviços

```bash
# Inicia PostgreSQL, Redis, MongoDB, Elasticsearch, RabbitMQ
npm run docker:dev
```

Aguarde ~30 segundos para os serviços iniciarem completamente.

### 4. Execute as Migrations

```bash
cd backend
npm run migration:run
cd ..
```

### 5. Inicie o Desenvolvimento

```bash
npm run dev
```

✅ Pronto! Acesse:
- **API**: http://localhost:3000/api
- **Docs**: http://localhost:3000/api/docs
- **Web**: http://localhost:3001

---

## 🔍 Verificando o Setup

### Health Check da API

```bash
curl http://localhost:3000/api/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 123.45
}
```

### Serviços Docker

```bash
docker ps
```

Você deve ver 7 containers rodando:
- ✅ mechama-postgres
- ✅ mechama-redis
- ✅ mechama-mongodb
- ✅ mechama-elasticsearch
- ✅ mechama-rabbitmq
- ✅ mechama-localstack
- ✅ mechama-mailhog

---

## 🛠️ Desenvolvimento

### Estrutura de Branches

- `main` → Produção
- `staging` → Homologação
- `develop` → Desenvolvimento
- `feature/*` → Novas features
- `fix/*` → Correções

### Workflow de Desenvolvimento

1. **Crie uma branch**:
```bash
git checkout -b feature/nome-da-feature
```

2. **Desenvolva e teste**:
```bash
npm run dev              # Desenvolvimento
npm run test             # Testes unitários
npm run test:e2e         # Testes E2E
```

3. **Lint e Format**:
```bash
npm run lint             # Verifica erros
npm run format           # Formata código
```

4. **Commit**:
```bash
git add .
git commit -m "feat: adiciona nova funcionalidade"
```

5. **Push e PR**:
```bash
git push origin feature/nome-da-feature
# Abra Pull Request no GitHub
```

---

## 📝 Tarefas Comuns

### Criar Nova Migration

```bash
cd backend
npm run typeorm migration:create src/database/migrations/NomeDaMigration
```

### Rodar Seeds

```bash
cd backend
npm run seed
```

### Build para Produção

```bash
npm run build
```

### Limpar Tudo

```bash
npm run docker:down
docker volume prune -f
rm -rf node_modules backend/node_modules frontend/node_modules
npm install
```

---

## 🐛 Troubleshooting

### Porta já em uso

```bash
# Mata processos nas portas 3000 e 3001
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### Containers não iniciam

```bash
# Para todos os containers
docker stop $(docker ps -aq)

# Remove volumes
docker volume prune -f

# Reinicia
npm run docker:dev
```

### Elasticsearch sem memória

Aumente a memória do Docker:
- Docker Desktop → Settings → Resources → Memory: 4GB+

Ou ajuste o heap no `docker-compose.dev.yml`:
```yaml
ES_JAVA_OPTS: "-Xms256m -Xmx256m"
```

### Database connection refused

```bash
# Verifica se o PostgreSQL está rodando
docker logs mechama-postgres

# Recria o container
docker-compose -f docker-compose.dev.yml up -d --force-recreate postgres
```

---

## 📚 Próximos Passos

1. ✅ Leia a [Arquitetura](../MECHAMA_ARCHITECTURE.md)
2. ✅ Explore a [API Docs](http://localhost:3000/api/docs)
3. ✅ Veja [Database Schema](../MECHAMA_DATABASE_SCHEMA.md)
4. ✅ Configure [Integrações](../MECHAMA_INTEGRATIONS.md)
5. ✅ Entenda [Autenticação](../MECHAMA_AUTH_SECURITY.md)

---

## 💬 Ajuda

- **Slack**: #mechama-dev
- **Docs**: https://docs.mechama.com.br
- **Issues**: https://github.com/mechama/mechama/issues

---

**Happy Coding! 🚀**
