# MeChama - Especificação de APIs

## Índice
1. [Visão Geral](#visão-geral)
2. [Autenticação](#autenticação)
3. [Auth Service](#auth-service)
4. [User Service](#user-service)
5. [Search Service](#search-service)
6. [Booking Service](#booking-service)
7. [Payment Service](#payment-service)
8. [Review Service](#review-service)
9. [Notification Service](#notification-service)
10. [Calendar Service](#calendar-service)
11. [Admin Service](#admin-service)

---

## Visão Geral

### Base URLs

**Desenvolvimento**:
- API Gateway: `http://localhost:3000/api`
- Auth Service: `http://localhost:3001`
- User Service: `http://localhost:3002`

**Produção**:
- API Gateway: `https://api.mechama.com.br`

### Headers Padrão

```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer <access_token>
X-Request-ID: <uuid>
X-Client-Version: <version>
```

### Response Pattern

**Sucesso**:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "req_123",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

**Erro**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos",
    "details": [
      {
        "field": "email",
        "message": "Email inválido"
      }
    ]
  },
  "meta": {
    "requestId": "req_123",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### HTTP Status Codes

| Code | Descrição |
|------|-----------|
| 200 | OK - Sucesso |
| 201 | Created - Recurso criado |
| 204 | No Content - Sucesso sem corpo |
| 400 | Bad Request - Dados inválidos |
| 401 | Unauthorized - Não autenticado |
| 403 | Forbidden - Sem permissão |
| 404 | Not Found - Recurso não encontrado |
| 409 | Conflict - Conflito (ex: email duplicado) |
| 422 | Unprocessable Entity - Validação falhou |
| 429 | Too Many Requests - Rate limit excedido |
| 500 | Internal Server Error - Erro do servidor |
| 503 | Service Unavailable - Serviço indisponível |

### Rate Limiting

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642252800
```

**Limites**:
- Anônimo: 20 req/min
- Autenticado: 100 req/min
- Premium: 500 req/min

---

## Autenticação

### JWT Structure

**Access Token** (15 min):
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "CUSTOMER",
  "permissions": ["bookings:create", "bookings:read"],
  "type": "access",
  "iat": 1642248000,
  "exp": 1642248900
}
```

**Refresh Token** (7 dias):
```json
{
  "sub": "user_id",
  "type": "refresh",
  "iat": 1642248000,
  "exp": 1642852800
}
```

### Authorization Header

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Auth Service

### POST /auth/register

Registra novo usuário.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123",
  "role": "CUSTOMER", // or "PROFESSIONAL"
  "fullName": "João Silva",
  "phone": "+5511999999999",
  "acceptTerms": true
}
```

**Validation**:
- `email`: Email válido, único
- `password`: Mínimo 8 caracteres, 1 maiúscula, 1 número, 1 caractere especial
- `fullName`: 2-255 caracteres
- `phone`: Formato E.164
- `acceptTerms`: true (obrigatório)

**Response** (201):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "CUSTOMER",
      "emailVerified": false,
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "message": "Email de verificação enviado"
  }
}
```

**Errors**:
- 409: Email já cadastrado
- 422: Validação falhou

---

### POST /auth/login

Autentica usuário.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "CUSTOMER",
      "emailVerified": true
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc...",
      "expiresIn": 900 // seconds
    }
  }
}
```

**Errors**:
- 401: Credenciais inválidas
- 403: Email não verificado
- 423: Conta suspensa

---

### POST /auth/refresh

Renova access token.

**Request Body**:
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...", // rotated
    "expiresIn": 900
  }
}
```

**Errors**:
- 401: Refresh token inválido ou expirado

---

### POST /auth/logout

Invalida tokens.

**Request Body**:
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response** (204): No Content

---

### POST /auth/verify-email

Verifica email do usuário.

**Request Body**:
```json
{
  "token": "verification_token_123"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "message": "Email verificado com sucesso",
    "user": {
      "id": "uuid",
      "emailVerified": true
    }
  }
}
```

**Errors**:
- 400: Token inválido ou expirado

---

### POST /auth/forgot-password

Solicita reset de senha.

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "message": "Email de recuperação enviado"
  }
}
```

---

### POST /auth/reset-password

Reseta senha do usuário.

**Request Body**:
```json
{
  "token": "reset_token_123",
  "newPassword": "NewSecureP@ss123"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "message": "Senha alterada com sucesso"
  }
}
```

**Errors**:
- 400: Token inválido ou expirado
- 422: Senha não atende requisitos

---

### POST /auth/oauth/:provider

OAuth login (Google, Facebook).

**Path Params**:
- `provider`: google | facebook

**Request Body**:
```json
{
  "code": "oauth_authorization_code",
  "redirectUri": "https://mechama.com.br/auth/callback"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@gmail.com",
      "role": "CUSTOMER",
      "authProvider": "GOOGLE"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc...",
      "expiresIn": 900
    },
    "isNewUser": false
  }
}
```

---

### POST /auth/2fa/enable

Habilita autenticação de dois fatores.

**Headers**: Authorization required

**Response** (200):
```json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,...",
    "secret": "JBSWY3DPEHPK3PXP",
    "backupCodes": [
      "12345678",
      "87654321",
      ...
    ]
  }
}
```

---

### POST /auth/2fa/verify

Verifica código 2FA.

**Headers**: Authorization required

**Request Body**:
```json
{
  "code": "123456"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "message": "2FA habilitado com sucesso"
  }
}
```

**Errors**:
- 400: Código inválido

---

## User Service

### GET /users/:id

Busca usuário por ID.

**Headers**: Authorization required

**Path Params**:
- `id`: UUID do usuário

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "CUSTOMER",
    "profile": {
      "fullName": "João Silva",
      "avatarUrl": "https://...",
      "bio": "...",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Errors**:
- 403: Sem permissão para ver este usuário
- 404: Usuário não encontrado

---

### PUT /users/:id

Atualiza dados do usuário.

**Headers**: Authorization required

**Path Params**:
- `id`: UUID do usuário

**Request Body** (partial):
```json
{
  "phone": "+5511999999999",
  "profile": {
    "fullName": "João Silva Santos",
    "bio": "Nova bio"
  }
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "phone": "+5511999999999",
    "profile": {
      "fullName": "João Silva Santos",
      "bio": "Nova bio",
      "updatedAt": "2024-01-15T11:00:00Z"
    }
  }
}
```

**Errors**:
- 403: Sem permissão
- 422: Dados inválidos

---

### POST /users/:id/avatar

Upload de avatar.

**Headers**: 
- Authorization required
- Content-Type: multipart/form-data

**Request Body** (multipart):
```
avatar: <file>
```

**File Constraints**:
- Max size: 5MB
- Formats: JPEG, PNG, WebP
- Min dimensions: 200x200px

**Response** (200):
```json
{
  "success": true,
  "data": {
    "avatarUrl": "https://cdn.mechama.com.br/avatars/uuid.jpg"
  }
}
```

**Errors**:
- 400: Arquivo inválido
- 413: Arquivo muito grande

---

### GET /professionals/:id

Busca perfil profissional.

**Path Params**:
- `id`: UUID do profissional

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "fullName": "Maria Souza",
    "avatarUrl": "https://...",
    "bio": "Encanadora com 10 anos de experiência",
    "experienceYears": 10,
    "status": "APPROVED",
    "rating": {
      "avg": 4.8,
      "count": 127
    },
    "totalBookings": 234,
    "categories": [
      {
        "id": "uuid",
        "name": "Encanamento",
        "slug": "plumbing"
      }
    ],
    "services": [
      {
        "id": "uuid",
        "name": "Reparo de vazamento",
        "description": "...",
        "price": {
          "amount": 15000,
          "currency": "BRL",
          "formatted": "R$ 150,00"
        },
        "type": "IN_PERSON",
        "duration": 120
      }
    ],
    "certifications": [
      {
        "id": "uuid",
        "title": "Certificado SENAI",
        "issuer": "SENAI",
        "issueDate": "2020-05-15",
        "verified": true
      }
    ],
    "portfolio": [
      {
        "id": "uuid",
        "title": "Instalação residencial",
        "imageUrl": "https://...",
        "description": "..."
      }
    ],
    "addresses": [
      {
        "id": "uuid",
        "city": "São Paulo",
        "state": "SP",
        "neighborhood": "Vila Mariana"
      }
    ]
  }
}
```

**Errors**:
- 404: Profissional não encontrado

---

### PUT /professionals/:id

Atualiza perfil profissional.

**Headers**: Authorization required

**Path Params**:
- `id`: UUID do profissional

**Request Body** (partial):
```json
{
  "bio": "Nova bio atualizada",
  "experienceYears": 11,
  "businessName": "Maria Souza Encanamento LTDA",
  "cnpj": "12345678000190"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "bio": "Nova bio atualizada",
    "experienceYears": 11,
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

---

### POST /professionals/:id/services

Cria novo serviço.

**Headers**: Authorization required

**Path Params**:
- `id`: UUID do profissional

**Request Body**:
```json
{
  "name": "Instalação de torneira",
  "description": "Instalação completa de torneiras",
  "categoryId": "uuid",
  "serviceType": "IN_PERSON",
  "pricingType": "FIXED",
  "priceAmount": 8000, // R$ 80,00
  "durationMinutes": 90
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Instalação de torneira",
    "categoryId": "uuid",
    "serviceType": "IN_PERSON",
    "price": {
      "amount": 8000,
      "type": "FIXED",
      "formatted": "R$ 80,00"
    },
    "duration": 90,
    "isActive": true,
    "createdAt": "2024-01-15T11:00:00Z"
  }
}
```

---

### POST /professionals/:id/portfolio

Adiciona item ao portfólio.

**Headers**: 
- Authorization required
- Content-Type: multipart/form-data

**Request Body**:
```
title: "Instalação residencial"
description: "Instalação completa em casa de 3 quartos"
image: <file>
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Instalação residencial",
    "description": "Instalação completa em casa de 3 quartos",
    "imageUrl": "https://cdn.mechama.com.br/portfolio/uuid.jpg",
    "createdAt": "2024-01-15T11:00:00Z"
  }
}
```

---

### POST /professionals/:id/certifications

Adiciona certificação.

**Headers**: Authorization required

**Request Body**:
```json
{
  "title": "Certificado SENAI - Hidráulica",
  "issuer": "SENAI",
  "issueDate": "2020-05-15",
  "expiryDate": "2025-05-15",
  "credentialId": "SENAI123456",
  "credentialUrl": "https://senai.br/verify/123456"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Certificado SENAI - Hidráulica",
    "issuer": "SENAI",
    "issueDate": "2020-05-15",
    "verified": false,
    "createdAt": "2024-01-15T11:00:00Z"
  }
}
```

---

### POST /addresses

Cria endereço.

**Headers**: Authorization required

**Request Body**:
```json
{
  "type": "HOME",
  "street": "Rua das Flores",
  "number": "123",
  "complement": "Apto 45",
  "neighborhood": "Vila Mariana",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "04567-890",
  "isDefault": true
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "HOME",
    "street": "Rua das Flores",
    "number": "123",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "04567-890",
    "location": {
      "lat": -23.5965,
      "lng": -46.6425
    },
    "isDefault": true,
    "createdAt": "2024-01-15T11:00:00Z"
  }
}
```

---

## Search Service

### GET /search/professionals

Busca profissionais.

**Query Params**:
```
q: string (busca por nome, serviço, categoria)
category: uuid[] (filtro por categorias)
city: string
state: string (UF)
lat: number
lng: number
radius: number (km, default: 10)
minRating: number (1-5)
maxPrice: number (centavos)
minPrice: number (centavos)
serviceType: ONLINE | IN_PERSON | BOTH
availability: boolean
sort: relevance | rating | price | distance
page: number (default: 1)
limit: number (default: 20, max: 100)
```

**Request Example**:
```
GET /search/professionals?q=encanador&city=São%20Paulo&minRating=4&sort=rating&page=1&limit=20
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "uuid",
        "fullName": "Maria Souza",
        "avatarUrl": "https://...",
        "bio": "Encanadora com 10 anos...",
        "rating": {
          "avg": 4.8,
          "count": 127
        },
        "categories": ["Encanamento", "Hidráulica"],
        "priceRange": {
          "min": 5000,
          "max": 30000,
          "formatted": "R$ 50 - R$ 300"
        },
        "distance": 2.5, // km
        "location": {
          "city": "São Paulo",
          "state": "SP",
          "neighborhood": "Vila Mariana"
        },
        "availability": {
          "hasAvailability": true,
          "nextAvailable": "2024-01-16T09:00:00Z"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 145,
      "pages": 8
    },
    "aggregations": {
      "categories": [
        { "key": "Encanamento", "count": 89 },
        { "key": "Hidráulica", "count": 56 }
      ],
      "priceRanges": [
        { "range": "0-5000", "count": 23 },
        { "range": "5000-10000", "count": 67 },
        { "range": "10000-20000", "count": 45 },
        { "range": "20000+", "count": 10 }
      ],
      "avgRating": 4.3
    }
  },
  "meta": {
    "took": 45, // ms
    "requestId": "req_123"
  }
}
```

---

### GET /search/suggestions

Autocomplete de busca.

**Query Params**:
- `q`: string (termo de busca)
- `limit`: number (default: 10)

**Request Example**:
```
GET /search/suggestions?q=encan&limit=10
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "type": "category",
        "text": "Encanamento",
        "highlight": "<em>Encan</em>amento"
      },
      {
        "type": "service",
        "text": "Encanador emergencial",
        "highlight": "<em>Encan</em>ador emergencial"
      },
      {
        "type": "professional",
        "text": "Maria Souza - Encanadora",
        "id": "uuid",
        "highlight": "Maria Souza - <em>Encan</em>adora"
      }
    ]
  }
}
```

---

## Booking Service

### POST /bookings

Cria novo agendamento.

**Headers**: Authorization required

**Request Body**:
```json
{
  "professionalId": "uuid",
  "serviceId": "uuid",
  "scheduledDate": "2024-01-20",
  "scheduledTime": "14:00",
  "serviceType": "IN_PERSON",
  "addressId": "uuid",
  "customerNotes": "Portão azul, interfone apto 45"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "customerId": "uuid",
    "professionalId": "uuid",
    "serviceId": "uuid",
    "status": "PENDING",
    "scheduledDate": "2024-01-20",
    "scheduledTime": "14:00:00",
    "duration": 120,
    "serviceType": "IN_PERSON",
    "address": {
      "street": "Rua das Flores",
      "number": "123",
      "city": "São Paulo"
    },
    "price": {
      "amount": 15000,
      "platformFee": 2250,
      "professionalAmount": 12750,
      "formatted": "R$ 150,00"
    },
    "createdAt": "2024-01-15T11:00:00Z"
  }
}
```

**Errors**:
- 409: Horário não disponível
- 422: Data/hora inválida

---

### GET /bookings/:id

Busca agendamento por ID.

**Headers**: Authorization required

**Path Params**:
- `id`: UUID do agendamento

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "CONFIRMED",
    "customer": {
      "id": "uuid",
      "fullName": "João Silva",
      "avatarUrl": "https://...",
      "phone": "+5511999999999"
    },
    "professional": {
      "id": "uuid",
      "fullName": "Maria Souza",
      "avatarUrl": "https://...",
      "phone": "+5511888888888"
    },
    "service": {
      "id": "uuid",
      "name": "Reparo de vazamento",
      "category": "Encanamento"
    },
    "scheduledDate": "2024-01-20",
    "scheduledTime": "14:00:00",
    "duration": 120,
    "serviceType": "IN_PERSON",
    "address": {
      "street": "Rua das Flores",
      "number": "123",
      "complement": "Apto 45",
      "city": "São Paulo"
    },
    "price": {
      "amount": 15000,
      "formatted": "R$ 150,00"
    },
    "payment": {
      "id": "uuid",
      "status": "AUTHORIZED",
      "method": "CREDIT_CARD"
    },
    "customerNotes": "Portão azul",
    "professionalNotes": "Levar equipamento X",
    "timeline": [
      {
        "status": "PENDING",
        "timestamp": "2024-01-15T11:00:00Z"
      },
      {
        "status": "CONFIRMED",
        "timestamp": "2024-01-15T11:30:00Z"
      }
    ],
    "createdAt": "2024-01-15T11:00:00Z",
    "updatedAt": "2024-01-15T11:30:00Z"
  }
}
```

---

### PUT /bookings/:id/confirm

Profissional confirma agendamento.

**Headers**: Authorization required (professional only)

**Path Params**:
- `id`: UUID do agendamento

**Request Body** (optional):
```json
{
  "professionalNotes": "Confirmado. Chegarei às 14h."
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "CONFIRMED",
    "confirmedAt": "2024-01-15T11:30:00Z"
  }
}
```

**Errors**:
- 403: Apenas o profissional pode confirmar
- 409: Status inválido para confirmação

---

### PUT /bookings/:id/cancel

Cancela agendamento.

**Headers**: Authorization required

**Path Params**:
- `id`: UUID do agendamento

**Request Body**:
```json
{
  "reason": "Motivo do cancelamento"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "CANCELLED",
    "cancellationReason": "Motivo do cancelamento",
    "cancelledAt": "2024-01-15T12:00:00Z",
    "refund": {
      "amount": 15000,
      "status": "processing",
      "estimatedDate": "2024-01-17"
    }
  }
}
```

---

### PUT /bookings/:id/complete

Profissional marca como concluído.

**Headers**: Authorization required (professional only)

**Path Params**:
- `id`: UUID do agendamento

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "COMPLETED",
    "completedAt": "2024-01-20T16:00:00Z",
    "payment": {
      "status": "CAPTURED",
      "payout": {
        "amount": 12750,
        "estimatedArrival": "2024-01-21"
      }
    }
  }
}
```

---

### GET /bookings/customer/:customerId

Lista agendamentos do cliente.

**Headers**: Authorization required

**Path Params**:
- `customerId`: UUID do cliente

**Query Params**:
- `status`: PENDING | CONFIRMED | COMPLETED | CANCELLED
- `page`: number
- `limit`: number

**Response** (200):
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "uuid",
        "professional": {
          "fullName": "Maria Souza",
          "avatarUrl": "https://..."
        },
        "service": {
          "name": "Reparo de vazamento"
        },
        "scheduledDate": "2024-01-20",
        "scheduledTime": "14:00",
        "status": "CONFIRMED",
        "price": {
          "amount": 15000,
          "formatted": "R$ 150,00"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "pages": 1
    }
  }
}
```

---

### GET /bookings/professional/:professionalId

Lista agendamentos do profissional.

**Headers**: Authorization required

**Path Params**:
- `professionalId`: UUID do profissional

**Response**: Estrutura similar ao endpoint do cliente

---

### GET /availability/:professionalId

Consulta disponibilidade.

**Path Params**:
- `professionalId`: UUID do profissional

**Query Params**:
- `date`: YYYY-MM-DD (data desejada)
- `serviceId`: UUID do serviço (para calcular duração)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "date": "2024-01-20",
    "availableSlots": [
      {
        "start": "09:00",
        "end": "11:00"
      },
      {
        "start": "14:00",
        "end": "16:00"
      },
      {
        "start": "16:00",
        "end": "18:00"
      }
    ],
    "businessHours": {
      "start": "09:00",
      "end": "18:00"
    }
  }
}
```

---

## Payment Service

### POST /payments/create-intent

Cria intenção de pagamento (Stripe).

**Headers**: Authorization required

**Request Body**:
```json
{
  "bookingId": "uuid",
  "paymentMethodId": "pm_123", // Stripe payment method ID
  "savePaymentMethod": true
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "paymentId": "uuid",
    "clientSecret": "pi_123_secret_456",
    "amount": 15000,
    "currency": "BRL",
    "status": "requires_confirmation"
  }
}
```

---

### POST /payments/confirm

Confirma pagamento.

**Headers**: Authorization required

**Request Body**:
```json
{
  "paymentId": "uuid",
  "paymentIntentId": "pi_123"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "paymentId": "uuid",
    "status": "AUTHORIZED",
    "amount": 15000,
    "method": "CREDIT_CARD",
    "last4": "4242",
    "brand": "visa"
  }
}
```

---

### POST /payments/refund

Solicita reembolso.

**Headers**: Authorization required

**Request Body**:
```json
{
  "paymentId": "uuid",
  "amount": 15000, // opcional, default: total
  "reason": "Serviço cancelado pelo profissional"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "refundId": "uuid",
    "amount": 15000,
    "status": "pending",
    "estimatedArrival": "2024-01-17"
  }
}
```

---

### GET /payments/balance/:professionalId

Consulta saldo do profissional.

**Headers**: Authorization required

**Path Params**:
- `professionalId`: UUID do profissional

**Response** (200):
```json
{
  "success": true,
  "data": {
    "available": {
      "amount": 125000,
      "formatted": "R$ 1.250,00"
    },
    "pending": {
      "amount": 45000,
      "formatted": "R$ 450,00"
    },
    "nextPayout": {
      "amount": 125000,
      "date": "2024-01-16"
    }
  }
}
```

---

### POST /payments/payout

Solicita transferência (saque).

**Headers**: Authorization required

**Request Body**:
```json
{
  "amount": 50000, // opcional, default: available balance
  "description": "Saque semanal"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "payoutId": "uuid",
    "amount": 50000,
    "status": "pending",
    "arrivalDate": "2024-01-17"
  }
}
```

---

## Review Service

### POST /reviews

Cria avaliação.

**Headers**: Authorization required

**Request Body**:
```json
{
  "bookingId": "uuid",
  "rating": 5,
  "comment": "Excelente profissional! Pontual e competente."
}
```

**Validation**:
- Apenas cliente do booking pode avaliar
- Apenas bookings com status COMPLETED
- 1 avaliação por booking

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "bookingId": "uuid",
    "customerId": "uuid",
    "professionalId": "uuid",
    "rating": 5,
    "comment": "Excelente profissional! Pontual e competente.",
    "createdAt": "2024-01-20T17:00:00Z"
  }
}
```

**Errors**:
- 403: Não autorizado a avaliar
- 409: Booking já avaliado

---

### POST /reviews/:id/response

Profissional responde avaliação.

**Headers**: Authorization required (professional only)

**Path Params**:
- `id`: UUID da avaliação

**Request Body**:
```json
{
  "response": "Obrigado pelo feedback! Foi um prazer atendê-lo."
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "professionalResponse": "Obrigado pelo feedback! Foi um prazer atendê-lo.",
    "professionalResponseAt": "2024-01-20T18:00:00Z"
  }
}
```

---

### GET /reviews/professional/:professionalId

Lista avaliações do profissional.

**Path Params**:
- `professionalId`: UUID do profissional

**Query Params**:
- `rating`: number (filtro por nota)
- `page`: number
- `limit`: number

**Response** (200):
```json
{
  "success": true,
  "data": {
    "summary": {
      "avgRating": 4.8,
      "totalReviews": 127,
      "distribution": {
        "5": 89,
        "4": 28,
        "3": 7,
        "2": 2,
        "1": 1
      }
    },
    "reviews": [
      {
        "id": "uuid",
        "customer": {
          "fullName": "João Silva",
          "avatarUrl": "https://..."
        },
        "booking": {
          "service": "Reparo de vazamento",
          "completedAt": "2024-01-20T16:00:00Z"
        },
        "rating": 5,
        "comment": "Excelente profissional!",
        "professionalResponse": "Obrigado!",
        "professionalResponseAt": "2024-01-20T18:00:00Z",
        "createdAt": "2024-01-20T17:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 127,
      "pages": 7
    }
  }
}
```

---

### POST /reviews/:id/report

Reporta avaliação inapropriada.

**Headers**: Authorization required

**Path Params**:
- `id`: UUID da avaliação

**Request Body**:
```json
{
  "reason": "Conteúdo ofensivo"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "reportId": "uuid",
    "status": "pending",
    "message": "Denúncia recebida. Será analisada em até 24h."
  }
}
```

---

## Notification Service

### GET /notifications

Lista notificações do usuário.

**Headers**: Authorization required

**Query Params**:
- `channel`: EMAIL | SMS | PUSH | IN_APP
- `read`: boolean
- `page`: number
- `limit`: number

**Response** (200):
```json
{
  "success": true,
  "data": {
    "unreadCount": 5,
    "notifications": [
      {
        "id": "uuid",
        "type": "booking_confirmed",
        "channel": "IN_APP",
        "title": "Agendamento confirmado",
        "message": "Maria Souza confirmou seu agendamento para 20/01 às 14h",
        "data": {
          "bookingId": "uuid",
          "professionalId": "uuid"
        },
        "read": false,
        "createdAt": "2024-01-15T11:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

---

### PUT /notifications/:id/read

Marca notificação como lida.

**Headers**: Authorization required

**Path Params**:
- `id`: UUID da notificação

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "read": true,
    "readAt": "2024-01-15T12:00:00Z"
  }
}
```

---

### GET /notifications/preferences

Busca preferências de notificação.

**Headers**: Authorization required

**Response** (200):
```json
{
  "success": true,
  "data": {
    "emailEnabled": true,
    "smsEnabled": true,
    "pushEnabled": true,
    "whatsappEnabled": false,
    "bookingNotifications": true,
    "paymentNotifications": true,
    "reviewNotifications": true,
    "marketingNotifications": false
  }
}
```

---

### PUT /notifications/preferences

Atualiza preferências.

**Headers**: Authorization required

**Request Body** (partial):
```json
{
  "emailEnabled": false,
  "marketingNotifications": true
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "emailEnabled": false,
    "marketingNotifications": true,
    "updatedAt": "2024-01-15T12:00:00Z"
  }
}
```

---

## Calendar Service

### POST /calendar/connect/google

Conecta Google Calendar.

**Headers**: Authorization required

**Request Body**:
```json
{
  "authCode": "google_oauth_code",
  "redirectUri": "https://mechama.com.br/settings/calendar"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "connected": true,
    "calendarId": "primary",
    "email": "professional@gmail.com"
  }
}
```

---

### POST /calendar/sync/:professionalId

Sincroniza agenda.

**Headers**: Authorization required

**Path Params**:
- `professionalId`: UUID do profissional

**Response** (200):
```json
{
  "success": true,
  "data": {
    "syncedEvents": 12,
    "blockedSlots": 5,
    "lastSync": "2024-01-15T12:00:00Z"
  }
}
```

---

### POST /calendar/block-time

Bloqueia horário manualmente.

**Headers**: Authorization required

**Request Body**:
```json
{
  "startDatetime": "2024-01-20T09:00:00Z",
  "endDatetime": "2024-01-20T11:00:00Z",
  "reason": "Compromisso pessoal"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "startDatetime": "2024-01-20T09:00:00Z",
    "endDatetime": "2024-01-20T11:00:00Z",
    "reason": "Compromisso pessoal",
    "createdAt": "2024-01-15T12:00:00Z"
  }
}
```

---

## Admin Service

### GET /admin/dashboard

Dashboard administrativo.

**Headers**: Authorization required (admin only)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "metrics": {
      "totalUsers": 15234,
      "totalProfessionals": 3456,
      "activeBookings": 234,
      "totalRevenue": 1250000,
      "platformFees": 187500
    },
    "recentActivity": [
      {
        "type": "new_user",
        "user": { "id": "uuid", "name": "João Silva" },
        "timestamp": "2024-01-15T11:00:00Z"
      }
    ],
    "pendingActions": {
      "professionalApprovals": 12,
      "disputes": 3,
      "reviewReports": 5
    }
  }
}
```

---

### GET /admin/professionals/pending

Lista profissionais pendentes de aprovação.

**Headers**: Authorization required (admin only)

**Query Params**:
- `page`: number
- `limit`: number

**Response** (200):
```json
{
  "success": true,
  "data": {
    "professionals": [
      {
        "id": "uuid",
        "fullName": "Carlos Santos",
        "email": "carlos@example.com",
        "cpf": "12345678900",
        "categories": ["Encanamento"],
        "certifications": [
          {
            "title": "SENAI Hidráulica",
            "documentUrl": "https://..."
          }
        ],
        "createdAt": "2024-01-14T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "total": 12
    }
  }
}
```

---

### PUT /admin/professionals/:id/approve

Aprova profissional.

**Headers**: Authorization required (admin only)

**Path Params**:
- `id`: UUID do profissional

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "APPROVED",
    "approvedAt": "2024-01-15T12:00:00Z"
  }
}
```

---

### PUT /admin/professionals/:id/reject

Rejeita profissional.

**Headers**: Authorization required (admin only)

**Path Params**:
- `id`: UUID do profissional

**Request Body**:
```json
{
  "reason": "Documentação incompleta"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "REJECTED",
    "rejectedAt": "2024-01-15T12:00:00Z",
    "rejectionReason": "Documentação incompleta"
  }
}
```

---

### GET /admin/disputes

Lista disputas.

**Headers**: Authorization required (admin only)

**Query Params**:
- `status`: OPEN | IN_PROGRESS | RESOLVED
- `page`: number

**Response** (200):
```json
{
  "success": true,
  "data": {
    "disputes": [
      {
        "id": "uuid",
        "payment": {
          "id": "uuid",
          "amount": 15000
        },
        "booking": {
          "id": "uuid",
          "service": "Reparo de vazamento"
        },
        "raisedBy": {
          "id": "uuid",
          "name": "João Silva",
          "role": "CUSTOMER"
        },
        "reason": "Serviço não realizado",
        "status": "OPEN",
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ]
  }
}
```

---

### PUT /admin/disputes/:id/resolve

Resolve disputa.

**Headers**: Authorization required (admin only)

**Path Params**:
- `id`: UUID da disputa

**Request Body**:
```json
{
  "resolution": "Reembolso total aprovado",
  "action": "REFUND", // REFUND | PAYOUT | NONE
  "amount": 15000
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "RESOLVED",
    "resolution": "Reembolso total aprovado",
    "resolvedAt": "2024-01-15T12:00:00Z"
  }
}
```

---

## WebSocket Events

### Connection

```javascript
const socket = io('wss://api.mechama.com.br', {
  auth: {
    token: accessToken
  }
});
```

### Events (Client → Server)

```javascript
// Join room
socket.emit('join', { userId });

// Leave room
socket.emit('leave', { userId });
```

### Events (Server → Client)

```javascript
// Nova notificação
socket.on('notification', (data) => {
  // { type: 'booking_confirmed', ... }
});

// Atualização de agendamento
socket.on('booking:updated', (data) => {
  // { bookingId, status, ... }
});

// Pagamento processado
socket.on('payment:completed', (data) => {
  // { paymentId, amount, ... }
});

// Nova mensagem (chat - futuro)
socket.on('message:received', (data) => {
  // { messageId, from, text, ... }
});
```

---

## Webhooks

### Stripe Webhooks

**Endpoint**: `POST /webhooks/stripe`

**Events**:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`
- `payout.paid`
- `payout.failed`
- `account.updated`

**Signature Validation**:
```javascript
const signature = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  req.body,
  signature,
  webhookSecret
);
```

---

## Error Codes

| Code | Descrição |
|------|-----------|
| `VALIDATION_ERROR` | Dados de entrada inválidos |
| `AUTHENTICATION_ERROR` | Token inválido ou expirado |
| `AUTHORIZATION_ERROR` | Sem permissão |
| `NOT_FOUND` | Recurso não encontrado |
| `CONFLICT` | Conflito (ex: email duplicado) |
| `RATE_LIMIT_ERROR` | Limite de requisições excedido |
| `PAYMENT_ERROR` | Erro no pagamento |
| `STRIPE_ERROR` | Erro do Stripe |
| `EXTERNAL_SERVICE_ERROR` | Erro em serviço externo |
| `INTERNAL_ERROR` | Erro interno do servidor |

---

## Conclusão

Esta especificação cobre todos os endpoints principais do sistema MeChama, seguindo:

1. **RESTful principles**: Recursos bem definidos, verbos HTTP corretos
2. **Consistência**: Padrões de request/response uniformes
3. **Segurança**: Autenticação JWT, RBAC, validação
4. **Escalabilidade**: Paginação, caching, rate limiting
5. **Developer Experience**: Documentação clara, exemplos práticos
6. **Error Handling**: Códigos de erro padronizados, mensagens úteis

Use esta spec como contrato entre frontend e backend durante o desenvolvimento.
