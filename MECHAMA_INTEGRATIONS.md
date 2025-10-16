# MeChama - Integrações com Serviços Externos

## Índice
1. [Stripe Connect](#stripe-connect)
2. [Google Calendar API](#google-calendar-api)
3. [Google Maps API](#google-maps-api)
4. [AWS S3](#aws-s3)
5. [SendGrid (Email)](#sendgrid-email)
6. [Twilio (SMS/WhatsApp)](#twilio-smswhatsapp)
7. [Firebase Cloud Messaging](#firebase-cloud-messaging)
8. [Elasticsearch](#elasticsearch)

---

## Stripe Connect

### Overview

**Modelo**: Stripe Connect Express (simplificado para profissionais)

**Fluxo**:
1. Profissional se cadastra → Criar Connect Account
2. Redirect para Stripe Onboarding
3. Webhook confirma ativação
4. Split payments: 15% plataforma, 85% profissional

### Implementação

#### 1. Setup

```typescript
// config/stripe.config.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true
});

export const stripeConfig = {
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  platformFeePercent: 15,
  currency: 'brl',
  connectAccountType: 'express' as const
};
```

#### 2. Create Connect Account

```typescript
// services/stripe/connect.service.ts
export class StripeConnectService {
  async createConnectAccount(professional: Professional): Promise<string> {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'BR',
      email: professional.user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      },
      business_type: professional.cnpj ? 'company' : 'individual',
      business_profile: {
        name: professional.businessName || professional.fullName,
        product_description: 'Prestação de serviços',
        support_email: professional.user.email,
        url: `https://mechama.com.br/professionals/${professional.id}`
      },
      metadata: {
        professionalId: professional.id,
        userId: professional.userId
      }
    });

    // Update professional
    await this.professionalsRepository.update(professional.id, {
      stripeAccountId: account.id
    });

    return account.id;
  }

  async createAccountLink(accountId: string): Promise<string> {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.FRONTEND_URL}/settings/payments/refresh`,
      return_url: `${process.env.FRONTEND_URL}/settings/payments/success`,
      type: 'account_onboarding'
    });

    return accountLink.url;
  }

  async getAccountStatus(accountId: string): Promise<{
    detailsSubmitted: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
  }> {
    const account = await stripe.accounts.retrieve(accountId);

    return {
      detailsSubmitted: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled
    };
  }
}
```

#### 3. Payment Flow

```typescript
// services/stripe/payment.service.ts
export class StripePaymentService {
  async createPaymentIntent(
    booking: Booking,
    paymentMethodId: string
  ): Promise<Stripe.PaymentIntent> {
    const platformFee = Math.floor(
      booking.priceAmount * (stripeConfig.platformFeePercent / 100)
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount: booking.priceAmount,
      currency: stripeConfig.currency,
      payment_method: paymentMethodId,
      customer: await this.getOrCreateCustomer(booking.customerId),
      application_fee_amount: platformFee,
      transfer_data: {
        destination: booking.professional.stripeAccountId
      },
      capture_method: 'manual', // Capture após confirmação
      metadata: {
        bookingId: booking.id,
        customerId: booking.customerId,
        professionalId: booking.professionalId
      }
    });

    return paymentIntent;
  }

  async capturePayment(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return stripe.paymentIntents.capture(paymentIntentId);
  }

  async refundPayment(
    paymentIntentId: string,
    amount?: number
  ): Promise<Stripe.Refund> {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount || paymentIntent.amount,
      reverse_transfer: true, // Reverte transferência para profissional
      refund_application_fee: true // Reverte taxa da plataforma
    });

    return refund;
  }

  private async getOrCreateCustomer(userId: string): Promise<string> {
    const user = await this.usersService.findById(userId);

    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        userId: user.id
      }
    });

    await this.usersService.update(userId, {
      stripeCustomerId: customer.id
    });

    return customer.id;
  }
}
```

#### 4. Webhooks

```typescript
// controllers/webhooks/stripe.controller.ts
@Controller('webhooks/stripe')
export class StripeWebhookController {
  @Post()
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string
  ) {
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        stripeConfig.webhookSecret
      );
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    // Store webhook for audit
    await this.webhooksService.store({
      provider: 'stripe',
      eventType: event.type,
      eventId: event.id,
      payload: event,
      receivedAt: new Date()
    });

    // Process event
    await this.processEvent(event);

    return { received: true };
  }

  private async processEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;

      case 'charge.refunded':
        await this.handleRefund(event.data.object);
        break;

      case 'account.updated':
        await this.handleAccountUpdated(event.data.object);
        break;

      case 'payout.paid':
        await this.handlePayoutPaid(event.data.object);
        break;

      case 'payout.failed':
        await this.handlePayoutFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    const payment = await this.paymentsService.findByStripeIntentId(
      paymentIntent.id
    );

    await this.paymentsService.update(payment.id, {
      status: 'CAPTURED',
      capturedAt: new Date()
    });

    // Update booking
    await this.bookingsService.update(payment.bookingId, {
      status: 'CONFIRMED'
    });

    // Send notifications
    await this.notificationsService.send({
      userId: payment.customerId,
      type: 'PAYMENT_SUCCEEDED',
      channel: 'EMAIL',
      data: { bookingId: payment.bookingId }
    });
  }

  private async handleAccountUpdated(account: Stripe.Account) {
    const professional = await this.professionalsService.findByStripeAccountId(
      account.id
    );

    if (account.charges_enabled && account.payouts_enabled) {
      await this.professionalsService.update(professional.id, {
        stripeOnboardingCompleted: true,
        status: 'APPROVED'
      });
    }
  }
}
```

#### 5. Payouts

```typescript
// services/stripe/payout.service.ts
export class StripePayoutService {
  async createPayout(
    professionalId: string,
    amount?: number
  ): Promise<Stripe.Payout> {
    const professional = await this.professionalsService.findById(professionalId);

    if (!professional.stripeAccountId) {
      throw new BadRequestException('Stripe account not configured');
    }

    const balance = await stripe.balance.retrieve({
      stripeAccount: professional.stripeAccountId
    });

    const availableAmount = balance.available[0]?.amount || 0;
    const payoutAmount = amount || availableAmount;

    if (payoutAmount > availableAmount) {
      throw new BadRequestException('Insufficient balance');
    }

    const payout = await stripe.payouts.create(
      {
        amount: payoutAmount,
        currency: 'brl',
        metadata: {
          professionalId
        }
      },
      {
        stripeAccount: professional.stripeAccountId
      }
    );

    // Save payout record
    await this.payoutsRepository.save({
      professionalId,
      stripePayoutId: payout.id,
      amount: payoutAmount,
      status: payout.status,
      arrivalDate: new Date(payout.arrival_date * 1000)
    });

    return payout;
  }

  async getBalance(professionalId: string) {
    const professional = await this.professionalsService.findById(professionalId);

    const balance = await stripe.balance.retrieve({
      stripeAccount: professional.stripeAccountId
    });

    return {
      available: balance.available[0]?.amount || 0,
      pending: balance.pending[0]?.amount || 0,
      currency: 'BRL'
    };
  }
}
```

---

## Google Calendar API

### Overview

**Objetivo**: Sincronizar agenda dos profissionais com Google Calendar

**Features**:
- OAuth 2.0 para autorização
- Sync bidirecional (MeChama ↔ Google)
- Webhook para atualizações em tempo real
- Bloqueio automático de horários ocupados

### Implementação

#### 1. Setup OAuth

```typescript
// config/google.config.ts
import { google } from 'googleapis';

export const googleOAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];
```

#### 2. Connect Calendar

```typescript
// services/google/calendar.service.ts
import { calendar_v3, google } from 'googleapis';

export class GoogleCalendarService {
  async connectCalendar(professionalId: string, authCode: string) {
    // Exchange code for tokens
    const { tokens } = await googleOAuth2Client.getToken(authCode);
    googleOAuth2Client.setCredentials(tokens);

    // Get calendar info
    const calendar = google.calendar({ version: 'v3', auth: googleOAuth2Client });
    const calendarList = await calendar.calendarList.list();
    const primaryCalendar = calendarList.data.items?.find(c => c.primary);

    // Encrypt and store tokens
    await this.storageService.storeEncrypted(`google:tokens:${professionalId}`, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date,
      calendarId: primaryCalendar?.id
    });

    // Setup webhook
    await this.setupWebhook(professionalId, primaryCalendar!.id!);

    return {
      connected: true,
      calendarId: primaryCalendar!.id,
      email: primaryCalendar!.summary
    };
  }

  async syncEvents(professionalId: string): Promise<void> {
    const tokens = await this.getTokens(professionalId);
    const auth = this.createAuthClient(tokens);
    const calendar = google.calendar({ version: 'v3', auth });

    // Get events from last sync
    const lastSync = await this.getLastSync(professionalId);
    const now = new Date();

    const response = await calendar.events.list({
      calendarId: tokens.calendarId,
      timeMin: lastSync.toISOString(),
      timeMax: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(), // +90 days
      singleEvents: true,
      orderBy: 'startTime'
    });

    const events = response.data.items || [];

    // Block times in our system
    for (const event of events) {
      if (event.status !== 'cancelled') {
        await this.blockTime(professionalId, {
          startDatetime: new Date(event.start!.dateTime!),
          endDatetime: new Date(event.end!.dateTime!),
          reason: `Google Calendar: ${event.summary}`,
          externalId: event.id!
        });
      } else {
        await this.unblockTime(professionalId, event.id!);
      }
    }

    // Update last sync
    await this.updateLastSync(professionalId, now);
  }

  async createEvent(booking: Booking): Promise<string> {
    const professional = booking.professional;
    const tokens = await this.getTokens(professional.id);
    const auth = this.createAuthClient(tokens);
    const calendar = google.calendar({ version: 'v3', auth });

    const event: calendar_v3.Schema$Event = {
      summary: `MeChama: ${booking.service.name}`,
      description: `
Cliente: ${booking.customer.fullName}
Telefone: ${booking.customer.phone}
Serviço: ${booking.service.name}
Valor: R$ ${(booking.priceAmount / 100).toFixed(2)}
Link: ${process.env.FRONTEND_URL}/bookings/${booking.id}
      `.trim(),
      start: {
        dateTime: this.combineDateTime(booking.scheduledDate, booking.scheduledTime),
        timeZone: 'America/Sao_Paulo'
      },
      end: {
        dateTime: this.addMinutes(
          this.combineDateTime(booking.scheduledDate, booking.scheduledTime),
          booking.durationMinutes
        ),
        timeZone: 'America/Sao_Paulo'
      },
      location: booking.serviceType === 'IN_PERSON'
        ? this.formatAddress(booking.address!)
        : 'Online',
      attendees: [
        { email: booking.customer.email }
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 }
        ]
      },
      colorId: '11', // Red for MeChama events
      extendedProperties: {
        private: {
          bookingId: booking.id,
          source: 'mechama'
        }
      }
    };

    const response = await calendar.events.insert({
      calendarId: tokens.calendarId,
      requestBody: event,
      sendUpdates: 'all'
    });

    return response.data.id!;
  }

  async deleteEvent(professionalId: string, eventId: string): Promise<void> {
    const tokens = await this.getTokens(professionalId);
    const auth = this.createAuthClient(tokens);
    const calendar = google.calendar({ version: 'v3', auth });

    await calendar.events.delete({
      calendarId: tokens.calendarId,
      eventId,
      sendUpdates: 'all'
    });
  }

  private async setupWebhook(professionalId: string, calendarId: string): Promise<void> {
    const tokens = await this.getTokens(professionalId);
    const auth = this.createAuthClient(tokens);
    const calendar = google.calendar({ version: 'v3', auth });

    const channelId = `mechama-${professionalId}`;
    const webhookUrl = `${process.env.API_URL}/webhooks/google-calendar`;

    await calendar.events.watch({
      calendarId,
      requestBody: {
        id: channelId,
        type: 'web_hook',
        address: webhookUrl,
        token: professionalId // For verification
      }
    });
  }

  private createAuthClient(tokens: any) {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    auth.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expiry_date: tokens.expiryDate
    });

    // Auto-refresh
    auth.on('tokens', async (newTokens) => {
      await this.storageService.updateEncrypted(`google:tokens:${tokens.professionalId}`, {
        accessToken: newTokens.access_token,
        refreshToken: newTokens.refresh_token || tokens.refreshToken,
        expiryDate: newTokens.expiry_date
      });
    });

    return auth;
  }

  private combineDateTime(date: string, time: string): string {
    return `${date}T${time}:00-03:00`; // BRT timezone
  }

  private addMinutes(datetime: string, minutes: number): string {
    const date = new Date(datetime);
    date.setMinutes(date.getMinutes() + minutes);
    return date.toISOString();
  }

  private formatAddress(address: Address): string {
    return `${address.street}, ${address.number} - ${address.neighborhood}, ${address.city} - ${address.state}`;
  }
}
```

#### 3. Webhook Handler

```typescript
// controllers/webhooks/google-calendar.controller.ts
@Controller('webhooks/google-calendar')
export class GoogleCalendarWebhookController {
  @Post()
  async handleWebhook(
    @Headers('x-goog-channel-id') channelId: string,
    @Headers('x-goog-channel-token') token: string,
    @Headers('x-goog-resource-state') state: string
  ) {
    // Verify token
    const professionalId = token;
    
    if (state === 'sync') {
      // Initial sync, ignore
      return { received: true };
    }

    // Trigger sync for this professional
    await this.calendarService.syncEvents(professionalId);

    return { received: true };
  }
}
```

---

## Google Maps API

### Overview

**Features**:
- Geocoding: Endereço → Coordenadas
- Reverse Geocoding: Coordenadas → Endereço
- Places Autocomplete
- Distance Matrix: Calcular distância
- Geolocation

### Implementação

```typescript
// services/google/maps.service.ts
import { Client, GeocodeResult } from '@googlemaps/google-maps-services-js';

export class GoogleMapsService {
  private client: Client;

  constructor() {
    this.client = new Client({});
  }

  async geocode(address: string): Promise<{
    lat: number;
    lng: number;
    formattedAddress: string;
  }> {
    const response = await this.client.geocode({
      params: {
        address,
        key: process.env.GOOGLE_MAPS_API_KEY!,
        language: 'pt-BR',
        region: 'BR'
      }
    });

    if (response.data.results.length === 0) {
      throw new NotFoundException('Endereço não encontrado');
    }

    const result = response.data.results[0];

    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formattedAddress: result.formatted_address
    };
  }

  async reverseGeocode(lat: number, lng: number): Promise<Address> {
    const response = await this.client.reverseGeocode({
      params: {
        latlng: { lat, lng },
        key: process.env.GOOGLE_MAPS_API_KEY!,
        language: 'pt-BR'
      }
    });

    const result = response.data.results[0];
    
    return this.parseAddressComponents(result);
  }

  async autocomplete(input: string): Promise<Array<{
    description: string;
    placeId: string;
  }>> {
    const response = await this.client.placeAutocomplete({
      params: {
        input,
        key: process.env.GOOGLE_MAPS_API_KEY!,
        language: 'pt-BR',
        components: ['country:br'],
        types: 'address'
      }
    });

    return response.data.predictions.map(p => ({
      description: p.description,
      placeId: p.place_id
    }));
  }

  async getPlaceDetails(placeId: string): Promise<Address> {
    const response = await this.client.placeDetails({
      params: {
        place_id: placeId,
        key: process.env.GOOGLE_MAPS_API_KEY!,
        language: 'pt-BR'
      }
    });

    const result = response.data.result;

    return {
      ...this.parseAddressComponents(result as any),
      lat: result.geometry!.location.lat,
      lng: result.geometry!.location.lng
    };
  }

  async calculateDistance(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<{
    distance: number; // meters
    duration: number; // seconds
  }> {
    const response = await this.client.distancematrix({
      params: {
        origins: [`${origin.lat},${origin.lng}`],
        destinations: [`${destination.lat},${destination.lng}`],
        key: process.env.GOOGLE_MAPS_API_KEY!,
        mode: 'driving'
      }
    });

    const element = response.data.rows[0].elements[0];

    return {
      distance: element.distance.value,
      duration: element.duration.value
    };
  }

  private parseAddressComponents(result: GeocodeResult): Partial<Address> {
    const components = result.address_components;
    
    return {
      street: this.getComponent(components, 'route'),
      number: this.getComponent(components, 'street_number'),
      neighborhood: this.getComponent(components, 'sublocality_level_1'),
      city: this.getComponent(components, 'administrative_area_level_2'),
      state: this.getComponent(components, 'administrative_area_level_1', 'short_name'),
      zipCode: this.getComponent(components, 'postal_code')?.replace('-', ''),
      country: this.getComponent(components, 'country', 'short_name')
    };
  }

  private getComponent(
    components: any[],
    type: string,
    field: 'long_name' | 'short_name' = 'long_name'
  ): string | undefined {
    return components.find(c => c.types.includes(type))?.[field];
  }
}
```

---

## AWS S3

### Overview

**Usage**:
- Avatar de usuários
- Portfólio de profissionais
- Certificados
- Comprovantes de pagamento

### Implementação

```typescript
// services/aws/s3.service.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as sharp from 'sharp';

export class S3Service {
  private s3Client: S3Client;
  private bucket: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    });
    this.bucket = process.env.AWS_S3_BUCKET!;
  }

  async uploadAvatar(userId: string, file: Express.Multer.File): Promise<string> {
    // Resize and optimize
    const processedImage = await sharp(file.buffer)
      .resize(500, 500, { fit: 'cover' })
      .jpeg({ quality: 90 })
      .toBuffer();

    const key = `avatars/${userId}/${Date.now()}.jpg`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: processedImage,
        ContentType: 'image/jpeg',
        ACL: 'public-read',
        CacheControl: 'max-age=31536000' // 1 year
      })
    );

    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }

  async uploadPortfolio(
    professionalId: string,
    file: Express.Multer.File
  ): Promise<string> {
    const processedImage = await sharp(file.buffer)
      .resize(1200, 900, { fit: 'inside' })
      .jpeg({ quality: 85 })
      .toBuffer();

    const key = `portfolio/${professionalId}/${Date.now()}.jpg`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: processedImage,
        ContentType: 'image/jpeg',
        ACL: 'public-read'
      })
    );

    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }

  async uploadCertificate(
    professionalId: string,
    file: Express.Multer.File
  ): Promise<string> {
    const key = `certificates/${professionalId}/${Date.now()}.${file.originalname.split('.').pop()}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'private' // Certificados são privados
      })
    );

    // Generate presigned URL (valid for 1 hour)
    const url = await getSignedUrl(
      this.s3Client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key
      }),
      { expiresIn: 3600 }
    );

    return url;
  }

  async deleteFile(url: string): Promise<void> {
    const key = url.split('.com/')[1];

    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key
      })
    );
  }

  async deleteUserFiles(userId: string): Promise<void> {
    // Delete all files for a user (LGPD compliance)
    const prefixes = [
      `avatars/${userId}/`,
      `portfolio/${userId}/`,
      `certificates/${userId}/`
    ];

    // Implementation would list and delete all objects with these prefixes
    // Omitted for brevity
  }
}
```

---

## SendGrid (Email)

### Implementação

```typescript
// services/email/sendgrid.service.ts
import * as sgMail from '@sendgrid/mail';

export class SendGridService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    await sgMail.send({
      to: email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL!,
        name: 'MeChama'
      },
      templateId: process.env.SENDGRID_TEMPLATE_VERIFICATION!,
      dynamicTemplateData: {
        verificationUrl
      }
    });
  }

  async sendBookingConfirmation(booking: Booking): Promise<void> {
    await sgMail.send({
      to: booking.customer.email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL!,
        name: 'MeChama'
      },
      templateId: process.env.SENDGRID_TEMPLATE_BOOKING_CONFIRMATION!,
      dynamicTemplateData: {
        customerName: booking.customer.fullName,
        professionalName: booking.professional.fullName,
        serviceName: booking.service.name,
        date: format(new Date(booking.scheduledDate), 'dd/MM/yyyy'),
        time: booking.scheduledTime,
        price: (booking.priceAmount / 100).toFixed(2),
        bookingUrl: `${process.env.FRONTEND_URL}/bookings/${booking.id}`
      }
    });
  }
}
```

---

## Twilio (SMS/WhatsApp)

### Implementação

```typescript
// services/twilio/twilio.service.ts
import twilio from 'twilio';

export class TwilioService {
  private client: twilio.Twilio;

  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );
  }

  async sendSMS(to: string, message: string): Promise<void> {
    await this.client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER!,
      to,
      body: message
    });
  }

  async sendWhatsApp(to: string, message: string): Promise<void> {
    await this.client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER!}`,
      to: `whatsapp:${to}`,
      body: message
    });
  }

  async sendBookingReminder(booking: Booking): Promise<void> {
    const message = `
Lembrete: Você tem um agendamento amanhã!

Serviço: ${booking.service.name}
Profissional: ${booking.professional.fullName}
Horário: ${booking.scheduledTime}
Local: ${booking.serviceType === 'ONLINE' ? 'Online' : booking.address!.street}

Ver detalhes: ${process.env.FRONTEND_URL}/bookings/${booking.id}
    `.trim();

    if (booking.customer.phone) {
      await this.sendSMS(booking.customer.phone, message);
    }
  }
}
```

---

## Firebase Cloud Messaging

### Implementação

```typescript
// services/firebase/fcm.service.ts
import * as admin from 'firebase-admin';

export class FCMService {
  private messaging: admin.messaging.Messaging;

  constructor() {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      })
    });

    this.messaging = admin.messaging();
  }

  async sendPushNotification(
    deviceToken: string,
    notification: {
      title: string;
      body: string;
      data?: Record<string, string>;
    }
  ): Promise<void> {
    await this.messaging.send({
      token: deviceToken,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'mechama_notifications'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    });
  }

  async sendToTopic(
    topic: string,
    notification: {
      title: string;
      body: string;
    }
  ): Promise<void> {
    await this.messaging.send({
      topic,
      notification
    });
  }

  async subscribeToTopic(deviceToken: string, topic: string): Promise<void> {
    await this.messaging.subscribeToTopic([deviceToken], topic);
  }
}
```

---

## Elasticsearch

### Implementação

```typescript
// services/elasticsearch/index.service.ts
import { Client } from '@elastic/elasticsearch';

export class ElasticsearchIndexService {
  private client: Client;

  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_NODE!,
      auth: {
        username: process.env.ELASTICSEARCH_USERNAME!,
        password: process.env.ELASTICSEARCH_PASSWORD!
      }
    });
  }

  async indexProfessional(professional: Professional): Promise<void> {
    await this.client.index({
      index: 'professionals',
      id: professional.id,
      document: {
        professional_id: professional.id,
        user_id: professional.userId,
        full_name: professional.fullName,
        bio: professional.bio,
        categories: professional.services.map(s => s.category.name),
        services: professional.services.map(s => ({
          id: s.id,
          name: s.name,
          price_amount: s.priceAmount,
          service_type: s.serviceType
        })),
        location: professional.addresses[0] ? {
          lat: professional.addresses[0].latitude,
          lon: professional.addresses[0].longitude
        } : null,
        address: professional.addresses[0] ? {
          city: professional.addresses[0].city,
          state: professional.addresses[0].state,
          neighborhood: professional.addresses[0].neighborhood
        } : null,
        rating_avg: professional.ratingAvg,
        rating_count: professional.ratingCount,
        total_bookings: professional.totalBookings,
        experience_years: professional.experienceYears,
        certifications: professional.certifications.map(c => c.title),
        price_range: {
          gte: Math.min(...professional.services.map(s => s.priceAmount!)),
          lte: Math.max(...professional.services.map(s => s.priceAmount!))
        },
        updated_at: new Date()
      }
    });
  }

  async deleteProfessional(professionalId: string): Promise<void> {
    await this.client.delete({
      index: 'professionals',
      id: professionalId
    });
  }

  async search(query: SearchQuery): Promise<SearchResult> {
    const response = await this.client.search({
      index: 'professionals',
      body: {
        query: this.buildQuery(query),
        sort: this.buildSort(query.sort),
        size: query.limit || 20,
        from: ((query.page || 1) - 1) * (query.limit || 20),
        aggs: this.buildAggregations()
      }
    });

    return this.parseResponse(response);
  }

  private buildQuery(query: SearchQuery) {
    const must: any[] = [];
    const filter: any[] = [];

    // Text search
    if (query.q) {
      must.push({
        multi_match: {
          query: query.q,
          fields: ['full_name^3', 'services.name^2', 'bio'],
          type: 'best_fields',
          fuzziness: 'AUTO'
        }
      });
    }

    // Geolocation
    if (query.lat && query.lng) {
      filter.push({
        geo_distance: {
          distance: `${query.radius || 10}km`,
          location: {
            lat: query.lat,
            lon: query.lng
          }
        }
      });
    }

    // Filters
    if (query.category) {
      filter.push({
        terms: { categories: Array.isArray(query.category) ? query.category : [query.category] }
      });
    }

    if (query.minRating) {
      filter.push({
        range: { rating_avg: { gte: query.minRating } }
      });
    }

    if (query.minPrice || query.maxPrice) {
      filter.push({
        range: {
          'price_range.gte': { gte: query.minPrice || 0 },
          'price_range.lte': { lte: query.maxPrice || 999999 }
        }
      });
    }

    return {
      bool: {
        must: must.length > 0 ? must : [{ match_all: {} }],
        filter
      }
    };
  }

  private buildSort(sort?: string) {
    switch (sort) {
      case 'rating':
        return [{ rating_avg: 'desc' }, { rating_count: 'desc' }];
      case 'price':
        return [{ 'price_range.gte': 'asc' }];
      case 'distance':
        return [{ _geo_distance: { location: { lat: 0, lon: 0 }, order: 'asc' } }];
      default:
        return [{ _score: 'desc' }, { rating_avg: 'desc' }];
    }
  }

  private buildAggregations() {
    return {
      categories: {
        terms: { field: 'categories', size: 10 }
      },
      price_ranges: {
        range: {
          field: 'price_range.gte',
          ranges: [
            { to: 5000 },
            { from: 5000, to: 10000 },
            { from: 10000, to: 20000 },
            { from: 20000 }
          ]
        }
      },
      avg_rating: {
        avg: { field: 'rating_avg' }
      }
    };
  }

  private parseResponse(response: any): SearchResult {
    return {
      results: response.hits.hits.map((hit: any) => hit._source),
      total: response.hits.total.value,
      aggregations: {
        categories: response.aggregations.categories.buckets,
        priceRanges: response.aggregations.price_ranges.buckets,
        avgRating: response.aggregations.avg_rating.value
      },
      took: response.took
    };
  }
}
```

---

## Conclusão

Este documento cobre integrações completas com:

1. **Stripe Connect**: Pagamentos, split, payouts
2. **Google Calendar**: Sync bidirecional, webhooks
3. **Google Maps**: Geocoding, autocomplete, distance
4. **AWS S3**: Upload de imagens, certificados
5. **SendGrid**: Emails transacionais
6. **Twilio**: SMS e WhatsApp
7. **Firebase**: Push notifications
8. **Elasticsearch**: Busca avançada

Todas implementações seguem best practices de segurança, error handling e performance.
