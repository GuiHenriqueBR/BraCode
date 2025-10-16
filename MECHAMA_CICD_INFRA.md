# MeChama - CI/CD e Infraestrutura

## Índice
1. [Infraestrutura AWS](#infraestrutura-aws)
2. [Docker & Kubernetes](#docker--kubernetes)
3. [CI/CD Pipeline](#cicd-pipeline)
4. [Ambientes](#ambientes)
5. [Monitoring & Observability](#monitoring--observability)
6. [Disaster Recovery](#disaster-recovery)

---

## Infraestrutura AWS

### Arquitetura Cloud

```
┌─────────────────────────────────────────────────────────────────┐
│                          Route 53 (DNS)                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                   ┌─────────▼─────────┐
                   │   CloudFront CDN   │
                   │   (Static Assets)  │
                   └─────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼───────┐    ┌──────▼──────┐    ┌───────▼───────┐
│   S3 Bucket   │    │     ALB      │    │  CloudFront   │
│  (Frontend)   │    │(Load Balancer)│   │    (Images)   │
└───────────────┘    └──────┬──────┘    └───────────────┘
                             │
                   ┌─────────▼─────────┐
                   │    EKS Cluster     │
                   │   (Kubernetes)     │
                   └─────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼───────┐    ┌──────▼──────┐    ┌───────▼───────┐
│  RDS Postgres │    │  ElastiCache│    │   OpenSearch  │
│   (Primary)   │    │   (Redis)   │    │(Elasticsearch)│
└───────────────┘    └─────────────┘    └───────────────┘
        │
┌───────▼───────┐
│  RDS Postgres │
│  (Read Replica)│
└───────────────┘
```

### Recursos AWS

#### 1. Compute

**EKS (Elastic Kubernetes Service)**:
- **Node Groups**: 
  - `api-nodes`: t3.large (2 vCPU, 8 GB RAM) - API services
  - `worker-nodes`: t3.medium (2 vCPU, 4 GB RAM) - Workers/jobs
- **Auto Scaling**: 3-10 nodes
- **Region**: us-east-1 (primary), us-west-2 (DR)

**ECR (Elastic Container Registry)**:
- Private registry para Docker images
- Lifecycle policy: manter últimas 10 tags
- Scan de vulnerabilidades habilitado

#### 2. Database

**RDS PostgreSQL**:
- **Instance**: db.t3.medium (2 vCPU, 4 GB RAM)
- **Engine**: PostgreSQL 16
- **Multi-AZ**: Sim (alta disponibilidade)
- **Read Replicas**: 2 (para queries de leitura)
- **Backup**: Automático diário, retenção 30 dias
- **Encryption**: At-rest (AES-256)

**ElastiCache Redis**:
- **Node Type**: cache.t3.micro (2 nodes)
- **Engine**: Redis 7.0
- **Cluster Mode**: Enabled
- **Backup**: Snapshot diário

**DocumentDB (MongoDB-compatible)**:
- **Instance**: db.t3.medium
- **Replication**: 3 réplicas
- **Uso**: Logs, analytics

#### 3. Storage

**S3 Buckets**:
- `mechama-assets-prod`: Assets públicos (avatares, portfólio)
- `mechama-private-prod`: Certificados, documentos (private)
- `mechama-backups-prod`: Backups de banco
- **Lifecycle**: Mover para Glacier após 90 dias

**CloudFront**:
- Distribuição global
- Cache: TTL 24h para images, 1h para API responses
- Invalidação automática via CI/CD

#### 4. Networking

**VPC**:
- **CIDR**: 10.0.0.0/16
- **Subnets**:
  - Public: 10.0.1.0/24, 10.0.2.0/24 (ALB)
  - Private: 10.0.10.0/24, 10.0.11.0/24 (EKS)
  - Database: 10.0.20.0/24, 10.0.21.0/24 (RDS)

**Security Groups**:
- `alb-sg`: 80, 443 (internet)
- `eks-sg`: 443, 8080-8090 (ALB → EKS)
- `rds-sg`: 5432 (EKS → RDS)
- `redis-sg`: 6379 (EKS → Redis)

**NAT Gateway**:
- Para acesso à internet dos nós privados

#### 5. Secrets Management

**Secrets Manager**:
- Database credentials
- API keys (Stripe, Google, etc.)
- JWT secrets
- Rotation automática de segredos

**Parameter Store**:
- Configurações não-sensíveis
- Feature flags

---

## Docker & Kubernetes

### Dockerfiles

#### Backend (NestJS)

```dockerfile
# Dockerfile.api
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

USER nestjs

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

#### Frontend (Next.js)

```dockerfile
# Dockerfile.web
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
```

### Kubernetes Manifests

#### Deployment

```yaml
# k8s/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-service
  namespace: production
  labels:
    app: api-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-service
  template:
    metadata:
      labels:
        app: api-service
    spec:
      containers:
      - name: api
        image: 123456789.dkr.ecr.us-east-1.amazonaws.com/mechama-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secrets
              key: url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: jwt-secrets
              key: secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: api-service
  namespace: production
spec:
  selector:
    app: api-service
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
```

#### Horizontal Pod Autoscaler

```yaml
# k8s/api-hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

#### Ingress (ALB)

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: mechama-ingress
  namespace: production
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-east-1:123456789:certificate/xxx
    alb.ingress.kubernetes.io/ssl-redirect: "443"
    alb.ingress.kubernetes.io/healthcheck-path: /health
spec:
  rules:
  - host: api.mechama.com.br
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 80
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: mechama-api
  EKS_CLUSTER: mechama-production

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Type check
        run: npm run type-check
      
      - name: Unit tests
        run: npm run test:unit
      
      - name: Integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/coverage-final.json

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      
      - name: OWASP Dependency Check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: 'mechama'
          path: '.'
          format: 'HTML'
      
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: dependency-check-report
          path: dependency-check-report.html

  build:
    needs: [test, security]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Login to ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2
      
      - name: Build, tag, and push image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG -f Dockerfile.api .
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
      
      - name: Scan image
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ steps.login-ecr.outputs.registry }}/${{ env.ECR_REPOSITORY }}:${{ github.sha }}
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Update kubeconfig
        run: |
          aws eks update-kubeconfig --name ${{ env.EKS_CLUSTER }} --region ${{ env.AWS_REGION }}
      
      - name: Deploy to Kubernetes
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          kubectl set image deployment/api-service \
            api=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG \
            -n production
          
          kubectl rollout status deployment/api-service -n production
      
      - name: Run smoke tests
        run: |
          kubectl run smoke-test \
            --image=curlimages/curl:latest \
            --rm -i --restart=Never \
            -- curl -f http://api-service/health
      
      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Deployment to production completed'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: always()

  rollback:
    needs: deploy
    runs-on: ubuntu-latest
    if: failure()
    steps:
      - name: Rollback deployment
        run: |
          kubectl rollout undo deployment/api-service -n production
          kubectl rollout status deployment/api-service -n production
```

### ArgoCD (GitOps)

```yaml
# argocd/application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: mechama-api
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/mechama/infra
    targetRevision: HEAD
    path: k8s/production
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
  revisionHistoryLimit: 10
```

---

## Ambientes

### Development

**Infraestrutura**:
- Docker Compose local
- PostgreSQL, Redis, MongoDB containers
- Localstack (mock AWS services)

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: mechama_dev
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"

  elasticsearch:
    image: elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"

  localstack:
    image: localstack/localstack
    environment:
      - SERVICES=s3,secretsmanager
    ports:
      - "4566:4566"

volumes:
  postgres_data:
```

### Staging

**Infraestrutura**:
- EKS cluster dedicado
- RDS PostgreSQL (db.t3.micro)
- ElastiCache Redis (cache.t3.micro)
- Dados anonimizados de produção

**Deploy**:
- Automático via merge para `staging` branch
- Testes E2E executados

### Production

**Infraestrutura**:
- EKS cluster (3-10 nodes)
- RDS PostgreSQL Multi-AZ (db.t3.medium)
- ElastiCache Redis Cluster
- CloudFront CDN
- Route 53 DNS

**Deploy**:
- Blue/Green deployment
- Manual approval requerida
- Smoke tests antes de finalizar
- Rollback automático em caso de falha

---

## Monitoring & Observability

### Stack de Monitoramento

**Prometheus + Grafana**:
```yaml
# k8s/prometheus.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
    
    scrape_configs:
      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
            action: replace
            target_label: __metrics_path__
            regex: (.+)
          - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
            action: replace
            regex: ([^:]+)(?::\d+)?;(\d+)
            replacement: $1:$2
            target_label: __address__
```

**Dashboards Grafana**:
- **API Metrics**: Request rate, latency, error rate
- **Database**: Connections, query performance, replication lag
- **Cache**: Hit rate, memory usage, evictions
- **Business**: Bookings created, revenue, active users

### Logging (ELK Stack)

**Filebeat → Logstash → Elasticsearch → Kibana**

```yaml
# k8s/filebeat.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: filebeat-config
  namespace: logging
data:
  filebeat.yml: |
    filebeat.inputs:
    - type: container
      paths:
        - /var/log/containers/*.log
      processors:
        - add_kubernetes_metadata:
            host: ${NODE_NAME}
            matchers:
            - logs_path:
                logs_path: "/var/log/containers/"
    
    output.logstash:
      hosts: ["logstash:5044"]
```

### Distributed Tracing (Jaeger)

```typescript
// lib/tracing/jaeger.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const sdk = new NodeSDK({
  traceExporter: new JaegerExporter({
    endpoint: process.env.JAEGER_ENDPOINT
  }),
  instrumentations: [getNodeAutoInstrumentations()]
});

sdk.start();
```

### APM (Sentry)

```typescript
// lib/monitoring/sentry.ts
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new ProfilingIntegration()
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  beforeSend(event, hint) {
    // Filter sensitive data
    if (event.request?.data) {
      delete event.request.data.password;
      delete event.request.data.token;
    }
    return event;
  }
});
```

### Alertas (PagerDuty)

```yaml
# k8s/alertmanager.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: alertmanager-config
  namespace: monitoring
data:
  alertmanager.yml: |
    route:
      group_by: ['alertname', 'cluster', 'service']
      group_wait: 10s
      group_interval: 10s
      repeat_interval: 12h
      receiver: 'pagerduty'
      routes:
        - match:
            severity: critical
          receiver: 'pagerduty'
        - match:
            severity: warning
          receiver: 'slack'
    
    receivers:
      - name: 'pagerduty'
        pagerduty_configs:
          - service_key: '<pagerduty-integration-key>'
      
      - name: 'slack'
        slack_configs:
          - api_url: '<slack-webhook-url>'
            channel: '#alerts'
            title: 'Alert: {{ .GroupLabels.alertname }}'
            text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

### Alertas Configurados

```yaml
# k8s/prometheus-rules.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-rules
  namespace: monitoring
data:
  alerts.yml: |
    groups:
      - name: api_alerts
        rules:
          - alert: HighErrorRate
            expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
            for: 5m
            labels:
              severity: critical
            annotations:
              summary: "High error rate detected"
              description: "Error rate is {{ $value }} errors/sec"
          
          - alert: HighLatency
            expr: histogram_quantile(0.99, http_request_duration_seconds_bucket) > 1
            for: 5m
            labels:
              severity: warning
            annotations:
              summary: "High API latency"
              description: "P99 latency is {{ $value }}s"
          
          - alert: DatabaseConnectionsHigh
            expr: pg_stat_activity_count > 80
            for: 5m
            labels:
              severity: warning
            annotations:
              summary: "Database connections high"
              description: "{{ $value }} connections active"
          
          - alert: PodCrashLooping
            expr: rate(kube_pod_container_status_restarts_total[15m]) > 0
            for: 5m
            labels:
              severity: critical
            annotations:
              summary: "Pod is crash looping"
              description: "Pod {{ $labels.pod }} is restarting"
```

---

## Disaster Recovery

### Backup Strategy

**Database (RDS)**:
- **Automated**: Diário, retenção 30 dias
- **Manual**: Antes de migrations críticas
- **Point-in-Time Recovery**: Até 35 dias
- **Cross-Region**: Snapshot replicado para us-west-2

**Redis (ElastiCache)**:
- **Snapshot**: Diário
- **Retention**: 7 dias

**MongoDB (DocumentDB)**:
- **Snapshot**: Diário
- **Retention**: 14 dias

**S3**:
- **Versioning**: Habilitado
- **Lifecycle**: Glacier após 90 dias
- **Cross-Region Replication**: Para DR bucket

### Recovery Procedures

#### RTO (Recovery Time Objective): < 1 hora
#### RPO (Recovery Point Objective): < 15 minutos

**Procedure**:

1. **Detectar Falha**:
   - Alertas automáticos (PagerDuty)
   - Dashboards (Grafana)
   - Health checks falhando

2. **Avaliar Impacto**:
   - Determinar escopo (service, region, total)
   - Verificar causa raiz

3. **Failover Automático** (se configurado):
   - RDS Multi-AZ: Failover automático (< 2 min)
   - EKS: Pods redistribuídos automaticamente

4. **Failover Manual** (se necessário):
   ```bash
   # Promover read replica
   aws rds promote-read-replica \
     --db-instance-identifier mechama-replica-1
   
   # Atualizar DNS para região DR
   aws route53 change-resource-record-sets \
     --hosted-zone-id Z123456 \
     --change-batch file://failover-dns.json
   
   # Deploy em região DR
   kubectl config use-context eks-us-west-2
   kubectl apply -f k8s/production/
   ```

5. **Restore de Backup** (se dados corrompidos):
   ```bash
   # Restore RDS from snapshot
   aws rds restore-db-instance-from-db-snapshot \
     --db-instance-identifier mechama-restored \
     --db-snapshot-identifier mechama-snapshot-2024-01-15
   
   # Restore S3 from versioning
   aws s3api list-object-versions \
     --bucket mechama-private-prod \
     --prefix users/
   
   aws s3api restore-object \
     --bucket mechama-private-prod \
     --key users/123/document.pdf \
     --version-id abc123
   ```

6. **Verificação**:
   - Health checks passando
   - Smoke tests executados
   - Métricas normalizadas

7. **Post-Mortem**:
   - Documentar incidente
   - Ações corretivas
   - Melhorias no processo

---

## Conclusão

Este documento cobre:

1. **Infraestrutura AWS**: EKS, RDS, ElastiCache, S3, CloudFront
2. **Docker/Kubernetes**: Deployments, services, HPA, ingress
3. **CI/CD**: GitHub Actions, ArgoCD, blue/green deployment
4. **Ambientes**: Development, Staging, Production
5. **Monitoring**: Prometheus, Grafana, ELK, Jaeger, Sentry
6. **Disaster Recovery**: Backups, failover, restore procedures

A infraestrutura está pronta para:
- **Alta disponibilidade**: Multi-AZ, auto-scaling
- **Segurança**: VPC, security groups, secrets management
- **Observabilidade**: Logs, metrics, traces, alerts
- **Resiliência**: Backups, DR, rollback automático
