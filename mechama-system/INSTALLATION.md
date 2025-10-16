# Guia de Instalação - MeChama

## Pré-requisitos

### Software Necessário
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** 9+ (incluído com Node.js)
- **Docker** e **Docker Compose** ([Download](https://www.docker.com/))
- **Git** ([Download](https://git-scm.com/))

### Serviços Externos (Configuração Opcional)
- **Stripe Account** para pagamentos
- **Google Cloud Console** para OAuth e Maps
- **Facebook Developer** para OAuth
- **AWS Account** para S3 (armazenamento)

## Instalação Rápida

### 1. Clone o Repositório
```bash
git clone <repository-url>
cd mechama-system
```

### 2. Instale as Dependências
```bash
npm install
```

### 3. Configure as Variáveis de Ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```bash
# Banco de dados
DATABASE_URL="postgresql://mechama:mechama123@localhost:5432/mechama"
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# OAuth (opcional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Stripe (opcional)
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-publishable-key"
```

### 4. Inicie os Serviços de Infraestrutura
```bash
docker-compose up -d postgres redis elasticsearch
```

### 5. Execute as Migrações do Banco
```bash
npm run db:migrate
```

### 6. Inicie os Serviços
```bash
npm run dev
```

## Verificação da Instalação

### Verifique se os serviços estão funcionando:

1. **API Gateway**: http://localhost:3000/health
2. **Auth Service**: http://localhost:3002/health
3. **User Service**: http://localhost:3001/health

### Teste a API:
```bash
# Registrar um usuário
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "João",
    "lastName": "Silva",
    "role": "CLIENT"
  }'
```

## Configuração Detalhada

### Banco de Dados PostgreSQL

Se você quiser usar uma instância externa do PostgreSQL:

```bash
# Conecte-se ao seu PostgreSQL
psql -h localhost -U postgres

# Crie o banco de dados
CREATE DATABASE mechama;
CREATE USER mechama WITH PASSWORD 'mechama123';
GRANT ALL PRIVILEGES ON DATABASE mechama TO mechama;
```

### Redis

Para usar uma instância externa do Redis:
```bash
# Instale o Redis
# Ubuntu/Debian
sudo apt install redis-server

# macOS
brew install redis

# Inicie o Redis
redis-server
```

### Elasticsearch

Para busca avançada (opcional):
```bash
# Docker
docker run -d \
  --name mechama-elasticsearch \
  -p 9200:9200 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  docker.elastic.co/elasticsearch/elasticsearch:8.11.0
```

## Configuração de Produção

### 1. Variáveis de Ambiente de Produção
```bash
NODE_ENV=production
JWT_SECRET="your-super-secure-production-jwt-secret"
DATABASE_URL="postgresql://user:pass@prod-host:5432/mechama"
REDIS_URL="redis://prod-redis-host:6379"
```

### 2. Build para Produção
```bash
npm run build
```

### 3. Inicie em Produção
```bash
npm start
```

## Docker Compose Completo

Para executar todo o sistema com Docker:

```bash
# Inicie todos os serviços
docker-compose up -d

# Verifique os logs
docker-compose logs -f

# Pare todos os serviços
docker-compose down
```

## Kubernetes (Avançado)

Para deploy em Kubernetes:

```bash
# Aplique os manifests
kubectl apply -f infrastructure/k8s/

# Verifique o status
kubectl get pods -n mechama

# Acesse os logs
kubectl logs -f deployment/api-gateway -n mechama
```

## Troubleshooting

### Problemas Comuns

1. **Erro de conexão com PostgreSQL**
   ```bash
   # Verifique se o PostgreSQL está rodando
   docker-compose ps postgres
   
   # Verifique os logs
   docker-compose logs postgres
   ```

2. **Erro de conexão com Redis**
   ```bash
   # Teste a conexão
   redis-cli ping
   
   # Ou via Docker
   docker-compose exec redis redis-cli ping
   ```

3. **Porta já em uso**
   ```bash
   # Encontre o processo usando a porta
   lsof -i :3000
   
   # Mate o processo
   kill -9 <PID>
   ```

4. **Problemas de permissão**
   ```bash
   # Limpe o cache do npm
   npm cache clean --force
   
   # Reinstale as dependências
   rm -rf node_modules package-lock.json
   npm install
   ```

### Logs e Monitoramento

```bash
# Logs do API Gateway
tail -f logs/combined.log

# Logs de erro
tail -f logs/error.log

# Logs do Docker Compose
docker-compose logs -f
```

## Scripts Úteis

```bash
# Desenvolvimento
npm run dev              # Inicia todos os serviços em modo desenvolvimento
npm run dev:web          # Inicia apenas o frontend
npm run dev:gateway      # Inicia apenas o API Gateway

# Banco de dados
npm run db:migrate       # Executa migrações
npm run db:seed          # Popula dados iniciais
npm run db:reset         # Reseta o banco de dados

# Docker
npm run docker:up        # Inicia containers
npm run docker:down      # Para containers

# Testes
npm test                 # Executa testes
npm run test:watch       # Executa testes em modo watch

# Build
npm run build            # Build de produção
npm run lint             # Verifica código
npm run type-check       # Verifica tipos TypeScript
```

## Próximos Passos

1. Configure os serviços externos (Stripe, Google, etc.)
2. Customize as configurações conforme sua necessidade
3. Execute os testes para verificar se tudo está funcionando
4. Consulte a documentação da API em `/docs`

## Suporte

- **Documentação**: Consulte os arquivos em `/docs`
- **Issues**: Abra uma issue no repositório
- **Logs**: Sempre verifique os logs em caso de problemas