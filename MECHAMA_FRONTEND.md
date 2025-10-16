# MeChama - Frontend & Mobile

## Índice
1. [Frontend Web (Next.js)](#frontend-web-nextjs)
2. [Mobile (React Native)](#mobile-react-native)
3. [Design System](#design-system)
4. [State Management](#state-management)
5. [Performance](#performance)
6. [SEO](#seo)

---

## Frontend Web (Next.js)

### Stack Tecnológica

- **Framework**: Next.js 14+ (App Router)
- **Linguagem**: TypeScript
- **Styling**: Tailwind CSS + CSS Modules
- **UI Components**: Radix UI + Headless UI
- **Forms**: React Hook Form + Zod
- **State**: Zustand + TanStack Query
- **Animações**: Framer Motion
- **Charts**: Recharts
- **Maps**: React Google Maps API
- **Payments**: Stripe Elements

### Estrutura de Pastas

```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   ├── forgot-password/
│   │   └── page.tsx
│   └── layout.tsx
├── (customer)/
│   ├── dashboard/
│   │   └── page.tsx
│   ├── search/
│   │   └── page.tsx
│   ├── professionals/
│   │   └── [id]/
│   │       └── page.tsx
│   ├── bookings/
│   │   ├── page.tsx
│   │   ├── [id]/
│   │   │   └── page.tsx
│   │   └── new/
│   │       └── page.tsx
│   ├── profile/
│   │   └── page.tsx
│   └── layout.tsx
├── (professional)/
│   ├── dashboard/
│   │   └── page.tsx
│   ├── bookings/
│   │   └── page.tsx
│   ├── services/
│   │   └── page.tsx
│   ├── calendar/
│   │   └── page.tsx
│   ├── earnings/
│   │   └── page.tsx
│   ├── profile/
│   │   └── page.tsx
│   └── layout.tsx
├── (admin)/
│   ├── dashboard/
│   │   └── page.tsx
│   ├── users/
│   │   └── page.tsx
│   ├── professionals/
│   │   └── page.tsx
│   ├── bookings/
│   │   └── page.tsx
│   ├── payments/
│   │   └── page.tsx
│   └── layout.tsx
├── api/
│   └── ... (API routes for webhooks, uploads)
├── layout.tsx
├── page.tsx
└── globals.css

components/
├── ui/
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   ├── modal.tsx
│   ├── dropdown.tsx
│   ├── avatar.tsx
│   ├── badge.tsx
│   ├── skeleton.tsx
│   └── ...
├── forms/
│   ├── login-form.tsx
│   ├── register-form.tsx
│   ├── booking-form.tsx
│   └── ...
├── layout/
│   ├── header.tsx
│   ├── sidebar.tsx
│   ├── footer.tsx
│   └── ...
├── features/
│   ├── search/
│   │   ├── search-bar.tsx
│   │   ├── filters.tsx
│   │   ├── results-list.tsx
│   │   └── professional-card.tsx
│   ├── booking/
│   │   ├── calendar-picker.tsx
│   │   ├── time-slots.tsx
│   │   ├── payment-form.tsx
│   │   └── booking-summary.tsx
│   ├── professional/
│   │   ├── profile-header.tsx
│   │   ├── services-list.tsx
│   │   ├── portfolio-gallery.tsx
│   │   └── reviews-section.tsx
│   └── ...
└── providers/
    ├── auth-provider.tsx
    ├── query-provider.tsx
    └── theme-provider.tsx

lib/
├── api/
│   ├── client.ts
│   ├── auth.ts
│   ├── bookings.ts
│   ├── professionals.ts
│   └── ...
├── hooks/
│   ├── use-auth.ts
│   ├── use-bookings.ts
│   ├── use-search.ts
│   └── ...
├── utils/
│   ├── format.ts
│   ├── validation.ts
│   └── ...
├── stores/
│   ├── auth-store.ts
│   ├── booking-store.ts
│   └── ...
└── types/
    ├── api.ts
    ├── models.ts
    └── ...

public/
├── images/
├── icons/
└── ...
```

### Páginas Principais

#### 1. Landing Page (/)

```tsx
// app/page.tsx
import { Hero } from '@/components/landing/hero';
import { Features } from '@/components/landing/features';
import { HowItWorks } from '@/components/landing/how-it-works';
import { Categories } from '@/components/landing/categories';
import { Testimonials } from '@/components/landing/testimonials';
import { CTA } from '@/components/landing/cta';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Features />
      <HowItWorks />
      <Categories />
      <Testimonials />
      <CTA />
    </main>
  );
}
```

#### 2. Search Page

```tsx
// app/(customer)/search/page.tsx
'use client';

import { useState } from 'react';
import { useSearch } from '@/lib/hooks/use-search';
import { SearchBar } from '@/components/features/search/search-bar';
import { Filters } from '@/components/features/search/filters';
import { ResultsList } from '@/components/features/search/results-list';
import { Map } from '@/components/features/search/map';

export default function SearchPage() {
  const [view, setView] = useState<'list' | 'map'>('list');
  const { results, filters, setFilters, isLoading } = useSearch();

  return (
    <div className="container mx-auto py-8">
      <SearchBar />
      
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1">
          <Filters value={filters} onChange={setFilters} />
        </aside>

        <main className="lg:col-span-3">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {results?.total} profissionais encontrados
            </h2>
            
            <div className="flex gap-2">
              <button
                onClick={() => setView('list')}
                className={view === 'list' ? 'active' : ''}
              >
                Lista
              </button>
              <button
                onClick={() => setView('map')}
                className={view === 'map' ? 'active' : ''}
              >
                Mapa
              </button>
            </div>
          </div>

          {view === 'list' ? (
            <ResultsList results={results?.results} loading={isLoading} />
          ) : (
            <Map professionals={results?.results} />
          )}
        </main>
      </div>
    </div>
  );
}
```

#### 3. Professional Profile

```tsx
// app/(customer)/professionals/[id]/page.tsx
import { getProfessional } from '@/lib/api/professionals';
import { ProfileHeader } from '@/components/features/professional/profile-header';
import { ServicesList } from '@/components/features/professional/services-list';
import { Portfolio } from '@/components/features/professional/portfolio-gallery';
import { Reviews } from '@/components/features/professional/reviews-section';
import { BookingCard } from '@/components/features/professional/booking-card';

interface Props {
  params: { id: string };
}

export default async function ProfessionalPage({ params }: Props) {
  const professional = await getProfessional(params.id);

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <main className="lg:col-span-2">
          <ProfileHeader professional={professional} />
          <ServicesList services={professional.services} />
          <Portfolio items={professional.portfolio} />
          <Reviews
            reviews={professional.reviews}
            rating={professional.rating}
          />
        </main>

        <aside className="lg:col-span-1">
          <BookingCard professional={professional} />
        </aside>
      </div>
    </div>
  );
}
```

#### 4. Booking Flow

```tsx
// app/(customer)/bookings/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ServiceSelect } from '@/components/features/booking/service-select';
import { DateTimePicker } from '@/components/features/booking/date-time-picker';
import { AddressForm } from '@/components/features/booking/address-form';
import { PaymentForm } from '@/components/features/booking/payment-form';
import { BookingSummary } from '@/components/features/booking/booking-summary';
import { useCreateBooking } from '@/lib/hooks/use-bookings';

export default function NewBookingPage() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({});
  const router = useRouter();
  const createBooking = useCreateBooking();

  const handleNext = (stepData: any) => {
    setData({ ...data, ...stepData });
    setStep(step + 1);
  };

  const handleSubmit = async (paymentData: any) => {
    const booking = await createBooking.mutateAsync({
      ...data,
      ...paymentData
    });
    
    router.push(`/bookings/${booking.id}`);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Stepper currentStep={step} steps={4} />
        </div>

        {step === 1 && (
          <ServiceSelect onNext={handleNext} />
        )}
        
        {step === 2 && (
          <DateTimePicker
            serviceId={data.serviceId}
            onNext={handleNext}
            onBack={() => setStep(1)}
          />
        )}
        
        {step === 3 && (
          <AddressForm
            onNext={handleNext}
            onBack={() => setStep(2)}
          />
        )}
        
        {step === 4 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <PaymentForm
                onSubmit={handleSubmit}
                onBack={() => setStep(3)}
              />
            </div>
            <div className="lg:col-span-1">
              <BookingSummary data={data} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

#### 5. Professional Dashboard

```tsx
// app/(professional)/dashboard/page.tsx
import { getStats } from '@/lib/api/professionals';
import { StatsCards } from '@/components/features/dashboard/stats-cards';
import { RevenueChart } from '@/components/features/dashboard/revenue-chart';
import { UpcomingBookings } from '@/components/features/dashboard/upcoming-bookings';
import { RecentReviews } from '@/components/features/dashboard/recent-reviews';

export default async function ProfessionalDashboard() {
  const stats = await getStats();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <RevenueChart data={stats.revenue} />
        <UpcomingBookings bookings={stats.upcomingBookings} />
      </div>

      <div className="mt-8">
        <RecentReviews reviews={stats.recentReviews} />
      </div>
    </div>
  );
}
```

### API Client

```typescript
// lib/api/client.ts
import axios, { AxiosError } from 'axios';
import { getSession } from 'next-auth/react';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
apiClient.interceptors.request.use(async (config) => {
  const session = await getSession();
  
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }

  return config;
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired, try refresh
      const session = await getSession();
      
      if (session?.refreshToken) {
        try {
          const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
            refreshToken: session.refreshToken
          });

          // Update session
          // ... (implementation depends on auth library)

          // Retry original request
          return apiClient.request(error.config!);
        } catch {
          // Refresh failed, logout
          window.location.href = '/login';
        }
      }
    }

    throw error;
  }
);

export default apiClient;
```

### State Management

```typescript
// lib/stores/auth-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  role: 'CUSTOMER' | 'PROFESSIONAL' | 'ADMIN';
  profile: any;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false })
    }),
    {
      name: 'auth-storage'
    }
  )
);

// lib/hooks/use-auth.ts
import { useAuthStore } from '@/lib/stores/auth-store';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api/client';

export function useAuth() {
  const { user, isAuthenticated, setUser, logout: logoutStore } = useAuthStore();
  const router = useRouter();

  const login = async (credentials: LoginCredentials) => {
    const data = await apiClient.post('/auth/login', credentials);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await apiClient.post('/auth/logout');
    logoutStore();
    router.push('/login');
  };

  return {
    user,
    isAuthenticated,
    login,
    logout
  };
}
```

---

## Mobile (React Native)

### Stack Tecnológica

- **Framework**: React Native + Expo
- **Linguagem**: TypeScript
- **Navigation**: React Navigation v6
- **State**: Zustand + TanStack Query
- **Forms**: React Hook Form + Zod
- **UI**: React Native Paper + Custom Components
- **Maps**: React Native Maps
- **Payments**: Stripe React Native SDK
- **Push**: Firebase Cloud Messaging

### Estrutura de Pastas

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── _layout.tsx
│   ├── (customer)/
│   │   ├── index.tsx
│   │   ├── search.tsx
│   │   ├── professionals/
│   │   │   └── [id].tsx
│   │   ├── bookings/
│   │   │   ├── index.tsx
│   │   │   └── [id].tsx
│   │   └── _layout.tsx
│   ├── (professional)/
│   │   ├── index.tsx
│   │   ├── bookings.tsx
│   │   ├── services.tsx
│   │   └── _layout.tsx
│   └── _layout.tsx
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── ...
│   ├── features/
│   │   ├── search/
│   │   ├── booking/
│   │   └── professional/
│   └── layout/
│       ├── Header.tsx
│       ├── TabBar.tsx
│       └── ...
├── lib/
│   ├── api/
│   ├── hooks/
│   ├── stores/
│   └── utils/
├── navigation/
│   ├── AppNavigator.tsx
│   └── types.ts
└── theme/
    ├── colors.ts
    ├── typography.ts
    └── index.ts
```

### Navegação

```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';
import { useAuthStore } from '@/lib/stores/auth-store';

export default function RootLayout() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Stack>
      {!isAuthenticated ? (
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="(customer)" options={{ headerShown: false }} />
          <Stack.Screen name="(professional)" options={{ headerShown: false }} />
        </>
      )}
    </Stack>
  );
}

// app/(customer)/_layout.tsx
import { Tabs } from 'expo-router';
import { Home, Search, Calendar, User } from 'lucide-react-native';

export default function CustomerLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => <Home color={color} />
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Buscar',
          tabBarIcon: ({ color }) => <Search color={color} />
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Agendamentos',
          tabBarIcon: ({ color }) => <Calendar color={color} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <User color={color} />
        }}
      />
    </Tabs>
  );
}
```

### Componentes

```typescript
// components/features/search/SearchBar.tsx
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Search, Filter } from 'lucide-react-native';
import { useState } from 'react';

export function SearchBar({ onSearch, onFilterPress }: SearchBarProps) {
  const [query, setQuery] = useState('');

  return (
    <View className="flex-row items-center bg-white rounded-full px-4 py-2 shadow-sm">
      <Search size={20} color="#666" />
      
      <TextInput
        className="flex-1 ml-3 text-base"
        placeholder="Buscar serviços ou profissionais..."
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={() => onSearch(query)}
      />

      <TouchableOpacity onPress={onFilterPress}>
        <Filter size={20} color="#666" />
      </TouchableOpacity>
    </View>
  );
}

// components/features/professional/ProfessionalCard.tsx
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Star, MapPin } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export function ProfessionalCard({ professional }: Props) {
  const router = useRouter();

  return (
    <TouchableOpacity
      className="bg-white rounded-lg p-4 mb-4 shadow-sm"
      onPress={() => router.push(`/professionals/${professional.id}`)}
    >
      <View className="flex-row">
        <Image
          source={{ uri: professional.avatarUrl }}
          className="w-20 h-20 rounded-full"
        />
        
        <View className="flex-1 ml-4">
          <Text className="text-lg font-bold">{professional.fullName}</Text>
          
          <View className="flex-row items-center mt-1">
            <Star size={16} color="#FFC107" fill="#FFC107" />
            <Text className="ml-1 text-sm text-gray-600">
              {professional.rating.avg.toFixed(1)} ({professional.rating.count})
            </Text>
          </View>

          <View className="flex-row items-center mt-1">
            <MapPin size={16} color="#666" />
            <Text className="ml-1 text-sm text-gray-600">
              {professional.location.city} - {professional.distance?.toFixed(1)}km
            </Text>
          </View>

          <Text className="mt-2 text-base font-semibold text-primary">
            A partir de {professional.priceRange.formatted}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
```

### Push Notifications

```typescript
// lib/notifications/push.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import apiClient from '@/lib/api/client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true
  })
});

export async function registerForPushNotifications() {
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Permissão de notificações negada!');
      return;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C'
    });
  }

  // Save token to backend
  if (token) {
    await apiClient.post('/users/push-token', { token });
  }

  return token;
}

export function useNotificationListener() {
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      // Navigate based on notification type
      if (data.bookingId) {
        router.push(`/bookings/${data.bookingId}`);
      }
    });

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, []);
}
```

---

## Design System

### Cores

```typescript
// theme/colors.ts
export const colors = {
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA'
  },
  secondary: {
    500: '#10B981',
    600: '#059669'
  },
  error: {
    500: '#EF4444',
    600: '#DC2626'
  },
  warning: {
    500: '#F59E0B',
    600: '#D97706'
  },
  success: {
    500: '#10B981',
    600: '#059669'
  },
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    500: '#6B7280',
    900: '#111827'
  }
};
```

### Tipografia

```typescript
// theme/typography.ts
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['Fira Code', 'monospace']
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem'
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  }
};
```

### Componentes UI

```tsx
// components/ui/Button.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
        outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50',
        ghost: 'text-gray-700 hover:bg-gray-100',
        danger: 'bg-error-600 text-white hover:bg-error-700'
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-5 text-base',
        lg: 'h-14 px-8 text-lg'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  loading,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner className="mr-2" />}
      {children}
    </button>
  );
}
```

---

## Performance

### Code Splitting

```tsx
// Dynamic imports
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('@/components/features/search/map'), {
  loading: () => <MapSkeleton />,
  ssr: false
});

const Chart = dynamic(() => import('@/components/features/dashboard/chart'), {
  loading: () => <ChartSkeleton />
});
```

### Image Optimization

```tsx
import Image from 'next/image';

<Image
  src={professional.avatarUrl}
  alt={professional.fullName}
  width={500}
  height={500}
  priority
  placeholder="blur"
  blurDataURL="data:image/..."
/>
```

### Caching com TanStack Query

```typescript
// lib/hooks/use-professionals.ts
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';

export function useProfessional(id: string) {
  return useQuery({
    queryKey: ['professional', id],
    queryFn: () => apiClient.get(`/professionals/${id}`),
    staleTime: 5 * 60 * 1000, // 5 min
    cacheTime: 30 * 60 * 1000 // 30 min
  });
}

export function useSearch(filters: SearchFilters) {
  return useQuery({
    queryKey: ['search', filters],
    queryFn: () => apiClient.get('/search/professionals', { params: filters }),
    staleTime: 2 * 60 * 1000, // 2 min
    keepPreviousData: true
  });
}
```

---

## SEO

### Metadata

```tsx
// app/professionals/[id]/page.tsx
import { Metadata } from 'next';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const professional = await getProfessional(params.id);

  return {
    title: `${professional.fullName} - ${professional.categories[0]} | MeChama`,
    description: professional.bio,
    openGraph: {
      title: professional.fullName,
      description: professional.bio,
      images: [professional.avatarUrl],
      type: 'profile'
    },
    twitter: {
      card: 'summary_large_image',
      title: professional.fullName,
      description: professional.bio,
      images: [professional.avatarUrl]
    }
  };
}
```

### Structured Data

```tsx
// components/seo/ProfessionalStructuredData.tsx
export function ProfessionalStructuredData({ professional }: Props) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: professional.fullName,
    description: professional.bio,
    image: professional.avatarUrl,
    address: {
      '@type': 'PostalAddress',
      addressLocality: professional.location.city,
      addressRegion: professional.location.state,
      addressCountry: 'BR'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: professional.rating.avg,
      reviewCount: professional.rating.count
    },
    priceRange: professional.priceRange.formatted
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
```

---

## Conclusão

Este documento cobre:

1. **Next.js**: App Router, páginas, componentes
2. **React Native**: Expo, navegação, push notifications
3. **Design System**: Cores, tipografia, componentes
4. **State Management**: Zustand, TanStack Query
5. **Performance**: Code splitting, caching, image optimization
6. **SEO**: Metadata, structured data

A estrutura está pronta para escalar e manter alta performance.
