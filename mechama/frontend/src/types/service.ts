export interface Service {
  id: string;
  title: string;
  description: string;
  category: ServiceCategory;
  type: ServiceType;
  price: number;
  duration: number;
  skills: string[];
  images?: string[];
  availability: string;
  location?: string;
  requirements?: string;
  cancellationPolicy?: string;
  isActive: boolean;
  professionalId: string;
  professional: Professional;
  createdAt: string;
  updatedAt: string;
}

export enum ServiceCategory {
  BEAUTY = 'beauty',
  HEALTH = 'health',
  EDUCATION = 'education',
  TECHNOLOGY = 'technology',
  HOME = 'home',
  BUSINESS = 'business',
  TRANSPORT = 'transport',
  OTHER = 'other',
}

export enum ServiceType {
  ONLINE = 'online',
  IN_PERSON = 'in_person',
  BOTH = 'both',
}

export interface Professional {
  id: string;
  userId: string;
  user: User;
  bio: string;
  categories: ServiceCategory[];
  skills: string[];
  experienceYears: number;
  certifications?: string[];
  portfolioUrls?: string[];
  availability: string;
  serviceRadius: number;
  website?: string;
  socialMedia?: Record<string, string>;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  isVerified: boolean;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchFilters {
  query?: string;
  categories?: ServiceCategory[];
  latitude?: number;
  longitude?: number;
  radius?: number;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: SortBy;
  page?: number;
  limit?: number;
}

export enum SortBy {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  RATING_DESC = 'rating_desc',
  DISTANCE_ASC = 'distance_asc',
  NEWEST = 'newest',
}

export interface SearchResults {
  services: Service[];
  professionals: Professional[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}