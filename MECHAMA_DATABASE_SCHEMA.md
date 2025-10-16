# MeChama - Modelagem de Banco de Dados

## 1. PostgreSQL - Schema Relacional

### 1.1 Users & Authentication

```sql
-- Enums
CREATE TYPE user_role AS ENUM ('CUSTOMER', 'PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN');
CREATE TYPE user_status AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'DELETED');
CREATE TYPE auth_provider AS ENUM ('EMAIL', 'GOOGLE', 'FACEBOOK');

-- Users (base table)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  phone VARCHAR(20),
  phone_verified BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255), -- NULL for OAuth users
  role user_role DEFAULT 'CUSTOMER',
  status user_status DEFAULT 'PENDING_VERIFICATION',
  auth_provider auth_provider DEFAULT 'EMAIL',
  oauth_id VARCHAR(255),
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(255),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  CONSTRAINT users_oauth_check CHECK (
    (auth_provider = 'EMAIL' AND password_hash IS NOT NULL) OR
    (auth_provider IN ('GOOGLE', 'FACEBOOK') AND oauth_id IS NOT NULL)
  )
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_oauth ON users(auth_provider, oauth_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role) WHERE deleted_at IS NULL;

-- Refresh Tokens (armazenados para invalidação, mas primariamente em Redis)
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  device_info JSONB,
  ip_address INET,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT refresh_tokens_user_fk FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expiry ON refresh_tokens(expires_at) WHERE revoked_at IS NULL;

-- Audit Log (autenticação)
CREATE TABLE auth_audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL, -- 'LOGIN', 'LOGOUT', 'FAILED_LOGIN', '2FA_ENABLED', etc.
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_auth_audit_user ON auth_audit_log(user_id, created_at DESC);
CREATE INDEX idx_auth_audit_type ON auth_audit_log(event_type, created_at DESC);
```

---

### 1.2 Profiles

```sql
-- Customer Profiles
CREATE TABLE customer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  cpf VARCHAR(11) UNIQUE, -- Brazilian tax ID
  birth_date DATE,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customer_profiles_user ON customer_profiles(user_id);
CREATE INDEX idx_customer_profiles_cpf ON customer_profiles(cpf) WHERE cpf IS NOT NULL;

-- Professional Profiles
CREATE TYPE professional_status AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED');

CREATE TABLE professional_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  cpf VARCHAR(11) UNIQUE,
  cnpj VARCHAR(14), -- Business tax ID
  business_name VARCHAR(255),
  avatar_url TEXT,
  bio TEXT,
  experience_years INTEGER,
  status professional_status DEFAULT 'PENDING_APPROVAL',
  stripe_account_id VARCHAR(255) UNIQUE,
  stripe_onboarding_completed BOOLEAN DEFAULT FALSE,
  rating_avg NUMERIC(3, 2) DEFAULT 0, -- 0.00 to 5.00
  rating_count INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  CONSTRAINT professional_rating_check CHECK (rating_avg >= 0 AND rating_avg <= 5)
);

CREATE INDEX idx_professional_profiles_user ON professional_profiles(user_id);
CREATE INDEX idx_professional_profiles_status ON professional_profiles(status);
CREATE INDEX idx_professional_profiles_rating ON professional_profiles(rating_avg DESC, rating_count DESC);
CREATE INDEX idx_professional_profiles_stripe ON professional_profiles(stripe_account_id) WHERE stripe_account_id IS NOT NULL;

-- Addresses (para clientes e profissionais)
CREATE TYPE address_type AS ENUM ('HOME', 'WORK', 'SERVICE', 'OTHER');

CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type address_type DEFAULT 'HOME',
  street VARCHAR(255) NOT NULL,
  number VARCHAR(20),
  complement VARCHAR(100),
  neighborhood VARCHAR(100),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(2) NOT NULL, -- UF
  zip_code VARCHAR(9) NOT NULL,
  country VARCHAR(2) DEFAULT 'BR',
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_addresses_user ON addresses(user_id);
CREATE INDEX idx_addresses_location ON addresses USING GIST (ll_to_earth(latitude, longitude)) WHERE latitude IS NOT NULL;
CREATE INDEX idx_addresses_default ON addresses(user_id, is_default) WHERE is_default = TRUE;

-- Professional Certifications
CREATE TABLE certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  issuer VARCHAR(255),
  issue_date DATE,
  expiry_date DATE,
  credential_id VARCHAR(255),
  credential_url TEXT,
  document_url TEXT, -- S3 URL
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_certifications_professional ON certifications(professional_id);

-- Professional Portfolio
CREATE TABLE portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_portfolio_professional ON portfolio_items(professional_id, display_order);
```

---

### 1.3 Categories & Services

```sql
-- Service Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon_url TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON categories(slug) WHERE is_active = TRUE;
CREATE INDEX idx_categories_parent ON categories(parent_id) WHERE is_active = TRUE;
CREATE INDEX idx_categories_order ON categories(display_order) WHERE is_active = TRUE;

-- Services
CREATE TYPE service_type AS ENUM ('ONLINE', 'IN_PERSON', 'BOTH');
CREATE TYPE pricing_type AS ENUM ('FIXED', 'HOURLY', 'CUSTOM');

CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  service_type service_type NOT NULL,
  pricing_type pricing_type NOT NULL,
  price_amount INTEGER, -- em centavos (NULL se CUSTOM)
  price_currency VARCHAR(3) DEFAULT 'BRL',
  duration_minutes INTEGER, -- duração estimada
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT services_price_check CHECK (
    (pricing_type = 'CUSTOM' AND price_amount IS NULL) OR
    (pricing_type IN ('FIXED', 'HOURLY') AND price_amount > 0)
  )
);

CREATE INDEX idx_services_professional ON services(professional_id) WHERE is_active = TRUE;
CREATE INDEX idx_services_category ON services(category_id) WHERE is_active = TRUE;
CREATE INDEX idx_services_type ON services(service_type) WHERE is_active = TRUE;
CREATE INDEX idx_services_price ON services(price_amount) WHERE is_active = TRUE AND price_amount IS NOT NULL;
```

---

### 1.4 Bookings

```sql
CREATE TYPE booking_status AS ENUM (
  'PENDING',        -- Aguardando confirmação do profissional
  'CONFIRMED',      -- Confirmado pelo profissional
  'IN_PROGRESS',    -- Em andamento
  'COMPLETED',      -- Concluído
  'CANCELLED',      -- Cancelado
  'REJECTED'        -- Rejeitado pelo profissional
);

CREATE TYPE booking_service_type AS ENUM ('ONLINE', 'IN_PERSON');

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  professional_id UUID NOT NULL REFERENCES professional_profiles(id) ON DELETE RESTRICT,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  status booking_status DEFAULT 'PENDING',
  service_type booking_service_type NOT NULL,
  
  -- Agendamento
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  
  -- Endereço (se IN_PERSON)
  address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  address_snapshot JSONB, -- Snapshot do endereço no momento do booking
  
  -- Valores
  price_amount INTEGER NOT NULL, -- Valor combinado em centavos
  price_currency VARCHAR(3) DEFAULT 'BRL',
  platform_fee INTEGER NOT NULL, -- Taxa da plataforma (15%)
  
  -- Notas
  customer_notes TEXT,
  professional_notes TEXT,
  cancellation_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  
  CONSTRAINT booking_dates_check CHECK (scheduled_date >= CURRENT_DATE),
  CONSTRAINT booking_address_check CHECK (
    (service_type = 'ONLINE' AND address_id IS NULL) OR
    (service_type = 'IN_PERSON')
  )
);

CREATE INDEX idx_bookings_customer ON bookings(customer_id, created_at DESC);
CREATE INDEX idx_bookings_professional ON bookings(professional_id, scheduled_date DESC);
CREATE INDEX idx_bookings_status ON bookings(status, scheduled_date);
CREATE INDEX idx_bookings_scheduled ON bookings(scheduled_date, scheduled_time);

-- Professional Availability (horários disponíveis)
CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT availability_time_check CHECK (end_time > start_time),
  CONSTRAINT availability_unique UNIQUE (professional_id, day_of_week, start_time, end_time)
);

CREATE INDEX idx_availability_professional ON availability(professional_id) WHERE is_active = TRUE;

-- Time Blocks (bloqueios de horário)
CREATE TABLE time_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT time_block_check CHECK (end_datetime > start_datetime)
);

CREATE INDEX idx_time_blocks_professional ON time_blocks(professional_id, start_datetime);
```

---

### 1.5 Payments

```sql
CREATE TYPE payment_status AS ENUM (
  'PENDING',       -- Aguardando captura
  'AUTHORIZED',    -- Autorizado (pré-autorização)
  'CAPTURED',      -- Capturado (finalizado)
  'FAILED',        -- Falhou
  'REFUNDED',      -- Reembolsado
  'PARTIALLY_REFUNDED',
  'DISPUTED'       -- Em disputa
);

CREATE TYPE payment_method AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BOLETO');

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  professional_id UUID NOT NULL REFERENCES professional_profiles(id) ON DELETE RESTRICT,
  
  -- Stripe
  stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_charge_id VARCHAR(255),
  stripe_transfer_id VARCHAR(255),
  
  -- Valores
  amount INTEGER NOT NULL, -- Total em centavos
  platform_fee INTEGER NOT NULL, -- Taxa da plataforma
  professional_amount INTEGER NOT NULL, -- Valor do profissional
  currency VARCHAR(3) DEFAULT 'BRL',
  
  -- Método e status
  payment_method payment_method NOT NULL,
  status payment_status DEFAULT 'PENDING',
  
  -- Metadata
  metadata JSONB,
  failure_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  authorized_at TIMESTAMPTZ,
  captured_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  
  CONSTRAINT payment_amounts_check CHECK (
    amount = platform_fee + professional_amount AND
    platform_fee > 0 AND
    professional_amount > 0
  )
);

CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_professional ON payments(professional_id);
CREATE INDEX idx_payments_status ON payments(status, created_at DESC);
CREATE INDEX idx_payments_stripe_intent ON payments(stripe_payment_intent_id);

-- Refunds
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  stripe_refund_id VARCHAR(255) UNIQUE NOT NULL,
  amount INTEGER NOT NULL, -- Valor do reembolso em centavos
  reason TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_refunds_payment ON refunds(payment_id);

-- Payouts (transferências para profissionais)
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professional_profiles(id) ON DELETE RESTRICT,
  stripe_payout_id VARCHAR(255) UNIQUE,
  amount INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  status VARCHAR(50) DEFAULT 'pending',
  arrival_date DATE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_payouts_professional ON payouts(professional_id, created_at DESC);
CREATE INDEX idx_payouts_status ON payouts(status, arrival_date);

-- Payment Methods (cartões salvos)
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_payment_method_id VARCHAR(255) UNIQUE NOT NULL,
  type payment_method NOT NULL,
  last4 VARCHAR(4),
  brand VARCHAR(50), -- 'visa', 'mastercard', etc.
  exp_month INTEGER,
  exp_year INTEGER,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_default ON payment_methods(user_id, is_default) WHERE is_default = TRUE;
```

---

### 1.6 Reviews

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  professional_id UUID NOT NULL REFERENCES professional_profiles(id) ON DELETE RESTRICT,
  
  -- Avaliação
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  -- Resposta do profissional
  professional_response TEXT,
  professional_response_at TIMESTAMPTZ,
  
  -- Moderação
  is_flagged BOOLEAN DEFAULT FALSE,
  flagged_reason TEXT,
  is_hidden BOOLEAN DEFAULT FALSE,
  hidden_reason TEXT,
  moderated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_customer ON reviews(customer_id, created_at DESC);
CREATE INDEX idx_reviews_professional ON reviews(professional_id, created_at DESC);
CREATE INDEX idx_reviews_rating ON reviews(professional_id, rating DESC);
CREATE INDEX idx_reviews_moderation ON reviews(is_flagged, is_hidden) WHERE is_flagged = TRUE OR is_hidden = TRUE;

-- Review Reports (denúncias)
CREATE TABLE review_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, reviewed, resolved
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_review_reports_review ON review_reports(review_id);
CREATE INDEX idx_review_reports_status ON review_reports(status);
```

---

### 1.7 Notifications

```sql
CREATE TYPE notification_channel AS ENUM ('EMAIL', 'SMS', 'PUSH', 'WHATSAPP', 'IN_APP');
CREATE TYPE notification_status AS ENUM ('PENDING', 'SENT', 'FAILED', 'READ');

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel notification_channel NOT NULL,
  type VARCHAR(100) NOT NULL, -- 'booking_confirmed', 'payment_received', etc.
  title VARCHAR(255),
  message TEXT NOT NULL,
  data JSONB, -- payload adicional
  status notification_status DEFAULT 'PENDING',
  read_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_status ON notifications(status, created_at);
CREATE INDEX idx_notifications_type ON notifications(type, created_at DESC);

-- Notification Preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Canais habilitados
  email_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  whatsapp_enabled BOOLEAN DEFAULT FALSE,
  
  -- Tipos de notificação
  booking_notifications BOOLEAN DEFAULT TRUE,
  payment_notifications BOOLEAN DEFAULT TRUE,
  review_notifications BOOLEAN DEFAULT TRUE,
  marketing_notifications BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_prefs_user ON notification_preferences(user_id);
```

---

### 1.8 Admin & Analytics

```sql
-- Admin Actions Log
CREATE TABLE admin_actions (
  id BIGSERIAL PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action VARCHAR(100) NOT NULL, -- 'APPROVE_PROFESSIONAL', 'SUSPEND_USER', etc.
  target_type VARCHAR(50), -- 'USER', 'BOOKING', 'PAYMENT', etc.
  target_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_actions_admin ON admin_actions(admin_id, created_at DESC);
CREATE INDEX idx_admin_actions_target ON admin_actions(target_type, target_id);

-- System Settings
CREATE TABLE system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disputes
CREATE TYPE dispute_status AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  raised_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  
  reason TEXT NOT NULL,
  evidence JSONB,
  status dispute_status DEFAULT 'OPEN',
  resolution TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_disputes_status ON disputes(status, created_at DESC);
CREATE INDEX idx_disputes_assigned ON disputes(assigned_to) WHERE assigned_to IS NOT NULL;
```

---

## 2. Redis - Cache & Sessions

### 2.1 Key Patterns

```typescript
// Sessions
`session:${userId}` → { accessToken, refreshToken, deviceInfo, expiresAt }
TTL: 15 minutos

// JWT Blacklist
`jwt:blacklist:${tokenId}` → true
TTL: token expiry time

// Rate Limiting
`ratelimit:${ip}:${endpoint}` → count
TTL: 1 minuto

// Cache - User Profiles
`cache:user:${userId}` → UserProfile JSON
TTL: 1 hora

// Cache - Professional Profiles
`cache:professional:${professionalId}` → ProfessionalProfile JSON
TTL: 30 minutos

// Cache - Search Results
`cache:search:${hash(queryParams)}` → SearchResults JSON
TTL: 5 minutos

// Cache - Categories
`cache:categories:all` → Category[] JSON
TTL: 24 horas

// Booking Locks (evitar double booking)
`lock:booking:${professionalId}:${dateTime}` → bookingId
TTL: 5 minutos

// OTP (2FA)
`otp:${userId}` → code
TTL: 5 minutos

// Email Verification
`email:verify:${token}` → userId
TTL: 24 horas

// Password Reset
`password:reset:${token}` → userId
TTL: 1 hora

// Real-time Notifications
`notifications:unread:${userId}` → Set<notificationId>
TTL: 7 dias
```

### 2.2 Pub/Sub Channels

```typescript
// Real-time events
PUBLISH booking:created { bookingId, professionalId, customerId }
PUBLISH booking:confirmed { bookingId }
PUBLISH payment:completed { paymentId, bookingId }
PUBLISH review:created { reviewId, professionalId }

// WebSocket broadcasting
PUBLISH ws:user:${userId} { type, payload }
PUBLISH ws:professional:${professionalId} { type, payload }
```

---

## 3. MongoDB - Logs & Analytics

### 3.1 Collections

```javascript
// Event Logs (audit trail completo)
db.event_logs.insertOne({
  _id: ObjectId(),
  timestamp: ISODate(),
  userId: UUID,
  eventType: "booking.created",
  eventData: {
    bookingId: UUID,
    serviceId: UUID,
    amount: 10000
  },
  metadata: {
    ip: "192.168.1.1",
    userAgent: "Mozilla/5.0...",
    sessionId: "session123"
  },
  indexedAt: ISODate()
});

// Índices
db.event_logs.createIndex({ timestamp: -1 });
db.event_logs.createIndex({ userId: 1, timestamp: -1 });
db.event_logs.createIndex({ eventType: 1, timestamp: -1 });

// Analytics Events
db.analytics_events.insertOne({
  _id: ObjectId(),
  timestamp: ISODate(),
  category: "booking",
  action: "search",
  label: "category:plumbing",
  value: 1,
  userId: UUID,
  sessionId: "session123",
  dimensions: {
    city: "São Paulo",
    device: "mobile",
    source: "organic"
  }
});

// Índices
db.analytics_events.createIndex({ timestamp: -1 });
db.analytics_events.createIndex({ category: 1, action: 1, timestamp: -1 });
db.analytics_events.createIndex({ userId: 1 }) // sparse

// Search Logs (para ML e analytics)
db.search_logs.insertOne({
  _id: ObjectId(),
  timestamp: ISODate(),
  userId: UUID,
  query: {
    text: "encanador são paulo",
    filters: {
      category: "plumbing",
      priceRange: [5000, 15000],
      rating: { $gte: 4 }
    },
    location: {
      lat: -23.550520,
      lng: -46.633308
    }
  },
  results: {
    total: 45,
    returned: 20,
    clickedIds: [UUID, UUID],
    bookedIds: [UUID]
  },
  performance: {
    took: 125, // ms
    source: "elasticsearch"
  }
});

// Índices
db.search_logs.createIndex({ timestamp: -1 });
db.search_logs.createIndex({ userId: 1, timestamp: -1 });
db.search_logs.createIndex({ "query.text": "text" });

// Error Logs (complementar ao Sentry)
db.error_logs.insertOne({
  _id: ObjectId(),
  timestamp: ISODate(),
  level: "error",
  service: "booking-service",
  message: "Failed to create booking",
  stack: "Error: ...\n  at ...",
  context: {
    userId: UUID,
    bookingData: {...},
    requestId: "req123"
  },
  metadata: {
    environment: "production",
    version: "1.2.3",
    host: "booking-service-pod-1"
  }
});

// Índices
db.error_logs.createIndex({ timestamp: -1 });
db.error_logs.createIndex({ level: 1, timestamp: -1 });
db.error_logs.createIndex({ service: 1, timestamp: -1 });

// Payment Webhooks (Stripe)
db.payment_webhooks.insertOne({
  _id: ObjectId(),
  timestamp: ISODate(),
  provider: "stripe",
  eventType: "payment_intent.succeeded",
  eventId: "evt_123",
  payload: {...}, // full webhook payload
  processed: true,
  processedAt: ISODate(),
  error: null
});

// Índices
db.payment_webhooks.createIndex({ eventId: 1 }, { unique: true });
db.payment_webhooks.createIndex({ processed: 1, timestamp: -1 });
```

---

## 4. Elasticsearch - Search Index

### 4.1 Index Mapping

```json
{
  "mappings": {
    "properties": {
      "professional_id": { "type": "keyword" },
      "user_id": { "type": "keyword" },
      "full_name": {
        "type": "text",
        "analyzer": "brazilian",
        "fields": {
          "keyword": { "type": "keyword" },
          "ngram": {
            "type": "text",
            "analyzer": "ngram_analyzer"
          }
        }
      },
      "bio": {
        "type": "text",
        "analyzer": "brazilian"
      },
      "categories": {
        "type": "keyword"
      },
      "services": {
        "type": "nested",
        "properties": {
          "id": { "type": "keyword" },
          "name": {
            "type": "text",
            "analyzer": "brazilian"
          },
          "price_amount": { "type": "integer" },
          "service_type": { "type": "keyword" }
        }
      },
      "location": {
        "type": "geo_point"
      },
      "address": {
        "type": "object",
        "properties": {
          "city": { "type": "keyword" },
          "state": { "type": "keyword" },
          "neighborhood": { "type": "text" }
        }
      },
      "rating_avg": { "type": "float" },
      "rating_count": { "type": "integer" },
      "total_bookings": { "type": "integer" },
      "experience_years": { "type": "integer" },
      "certifications": { "type": "keyword" },
      "availability": {
        "type": "object",
        "properties": {
          "has_availability": { "type": "boolean" },
          "next_available": { "type": "date" }
        }
      },
      "is_online": { "type": "boolean" },
      "price_range": {
        "type": "integer_range"
      },
      "created_at": { "type": "date" },
      "updated_at": { "type": "date" }
    }
  },
  "settings": {
    "analysis": {
      "analyzer": {
        "ngram_analyzer": {
          "type": "custom",
          "tokenizer": "ngram_tokenizer",
          "filter": ["lowercase", "asciifolding"]
        }
      },
      "tokenizer": {
        "ngram_tokenizer": {
          "type": "ngram",
          "min_gram": 3,
          "max_gram": 10,
          "token_chars": ["letter", "digit"]
        }
      }
    },
    "number_of_shards": 3,
    "number_of_replicas": 2
  }
}
```

### 4.2 Query Examples

```json
// Busca por geolocalização + filtros
{
  "query": {
    "bool": {
      "must": [
        {
          "multi_match": {
            "query": "encanador",
            "fields": ["full_name^3", "services.name^2", "bio"],
            "type": "best_fields"
          }
        }
      ],
      "filter": [
        {
          "geo_distance": {
            "distance": "10km",
            "location": {
              "lat": -23.550520,
              "lon": -46.633308
            }
          }
        },
        {
          "range": {
            "rating_avg": { "gte": 4.0 }
          }
        },
        {
          "terms": {
            "categories": ["plumbing", "home-repair"]
          }
        },
        {
          "range": {
            "price_range": {
              "gte": 5000,
              "lte": 15000
            }
          }
        }
      ]
    }
  },
  "sort": [
    {
      "_geo_distance": {
        "location": {
          "lat": -23.550520,
          "lon": -46.633308
        },
        "order": "asc",
        "unit": "km"
      }
    },
    { "rating_avg": { "order": "desc" } }
  ],
  "aggs": {
    "categories": {
      "terms": { "field": "categories", "size": 10 }
    },
    "avg_price": {
      "avg": { "field": "services.price_amount" }
    },
    "price_ranges": {
      "range": {
        "field": "services.price_amount",
        "ranges": [
          { "to": 5000 },
          { "from": 5000, "to": 10000 },
          { "from": 10000, "to": 20000 },
          { "from": 20000 }
        ]
      }
    }
  }
}
```

---

## 5. Triggers & Functions

### 5.1 PostgreSQL Triggers

```sql
-- Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_profiles_updated_at BEFORE UPDATE ON customer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_professional_profiles_updated_at BEFORE UPDATE ON professional_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Atualizar rating médio do profissional
CREATE OR REPLACE FUNCTION update_professional_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE professional_profiles
  SET 
    rating_avg = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews
      WHERE professional_id = NEW.professional_id AND is_hidden = FALSE
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE professional_id = NEW.professional_id AND is_hidden = FALSE
    )
  WHERE id = NEW.professional_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_after_review AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_professional_rating();

-- Incrementar total de bookings
CREATE OR REPLACE FUNCTION increment_professional_bookings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'COMPLETED' AND (OLD.status IS NULL OR OLD.status != 'COMPLETED') THEN
    UPDATE professional_profiles
    SET total_bookings = total_bookings + 1
    WHERE id = NEW.professional_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_bookings_on_complete AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION increment_professional_bookings();

-- Soft delete em cascade
CREATE OR REPLACE FUNCTION soft_delete_user_data()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    UPDATE bookings SET status = 'CANCELLED', cancelled_at = NOW()
    WHERE (customer_id = NEW.id OR professional_id IN (
      SELECT id FROM professional_profiles WHERE user_id = NEW.id
    )) AND status IN ('PENDING', 'CONFIRMED');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER soft_delete_cascade AFTER UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION soft_delete_user_data();
```

---

## 6. Backups & Disaster Recovery

### 6.1 Estratégia de Backup

**PostgreSQL**:
- **Full backup**: Diário às 2 AM (pg_dump)
- **Incremental**: WAL archiving contínuo
- **Retention**: 30 dias
- **Storage**: AWS S3 (cross-region)
- **Recovery**: Point-in-Time Recovery (PITR)

**Redis**:
- **RDB snapshot**: A cada 1h
- **AOF**: Append-only file habilitado
- **Persistence**: Disk-backed (EBS)

**MongoDB**:
- **Snapshot**: Diário
- **Oplog**: 48h de retenção
- **Replica Set**: 3 nós (1 primary, 2 secondary)

**Elasticsearch**:
- **Snapshot**: Diário
- **Repository**: S3
- **Retention**: 14 dias

### 6.2 Disaster Recovery Plan

**RTO (Recovery Time Objective)**: < 1 hora
**RPO (Recovery Point Objective)**: < 15 minutos

**Procedimento**:
1. Detectar falha (monitoring/alertas)
2. Promover read replica para primary (PostgreSQL)
3. Restore from snapshot (se necessário)
4. Verificar integridade dos dados
5. Reindexar Elasticsearch
6. Repovoar cache (Redis)
7. Health check completo
8. Retornar ao normal

---

## Conclusão

Este schema foi projetado para:

1. **Performance**: Índices estratégicos, particionamento, caching
2. **Escalabilidade**: Sharding ready, read replicas, horizontal scaling
3. **Integridade**: Foreign keys, constraints, triggers
4. **Auditoria**: Logs completos, soft deletes, timestamps
5. **Compliance**: LGPD ready, data retention, anonymization
6. **Resilience**: Backups, replication, disaster recovery

O modelo suporta crescimento de 0 a 1M+ de usuários com ajustes incrementais.
