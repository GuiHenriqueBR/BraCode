-- Initialize MeChama database
-- This script creates the initial database structure

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE mechama'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'mechama')\gexec

-- Connect to the mechama database
\c mechama;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('client', 'professional', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE service_category AS ENUM (
        'beauty', 'health', 'education', 'technology', 
        'home', 'business', 'transport', 'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE service_type AS ENUM ('online', 'in_person', 'both');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE appointment_type AS ENUM ('online', 'in_person');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE appointment_status AS ENUM (
        'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM (
        'pending', 'completed', 'failed', 'refunded'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM (
        'credit_card', 'debit_card', 'pix', 'bank_transfer'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'appointment_created', 'appointment_confirmed', 'appointment_cancelled',
        'appointment_reminder', 'payment_received', 'payment_failed',
        'review_received', 'message_received', 'system_update'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_professional_id ON services(professional_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_professional_id ON appointments(professional_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_reviews_professional_id ON reviews(professional_id);
CREATE INDEX IF NOT EXISTS idx_reviews_service_id ON reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Create full-text search indexes
CREATE INDEX IF NOT EXISTS idx_services_search ON services USING gin(to_tsvector('portuguese', title || ' ' || description));
CREATE INDEX IF NOT EXISTS idx_professional_profiles_search ON professional_profiles USING gin(to_tsvector('portuguese', bio));

-- Insert initial data
INSERT INTO service_categories (name, slug, description, icon, is_active) VALUES
('Beleza', 'beauty', 'Serviços de beleza e estética', 'sparkles', true),
('Saúde', 'health', 'Serviços de saúde e bem-estar', 'heart', true),
('Educação', 'education', 'Aulas e cursos particulares', 'academic-cap', true),
('Tecnologia', 'technology', 'Serviços de TI e desenvolvimento', 'computer-desktop', true),
('Casa', 'home', 'Serviços domésticos e reformas', 'home', true),
('Negócios', 'business', 'Serviços empresariais', 'briefcase', true),
('Transporte', 'transport', 'Serviços de transporte', 'truck', true),
('Outros', 'other', 'Outros serviços', 'ellipsis-horizontal', true)
ON CONFLICT (slug) DO NOTHING;

-- Create admin user (password: admin123)
INSERT INTO users (id, email, password, first_name, last_name, role, is_verified, created_at, updated_at) VALUES
('admin-001', 'admin@mechama.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4Qz8K2', 'Admin', 'MeChama', 'admin', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

COMMIT;