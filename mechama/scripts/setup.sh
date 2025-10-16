#!/bin/bash

# MeChama Setup Script
# This script sets up the development environment for the MeChama platform

set -e

echo "🚀 Setting up MeChama development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    print_success "Node.js $(node -v) is installed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing root dependencies..."
    npm install
    
    print_status "Installing shared dependencies..."
    cd shared && npm install && cd ..
    
    print_status "Installing backend dependencies..."
    cd backend/gateway && npm install && cd ../..
    
    print_status "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
    
    print_success "All dependencies installed"
}

# Setup environment files
setup_env() {
    print_status "Setting up environment files..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        print_success "Created .env file from .env.example"
        print_warning "Please update the .env file with your actual configuration values"
    else
        print_warning ".env file already exists, skipping..."
    fi
    
    # Create .env files for each service
    for service in auth users services payments notifications scheduling reviews; do
        if [ ! -f "backend/services/$service/.env" ]; then
            cp .env "backend/services/$service/.env"
            print_status "Created .env for $service service"
        fi
    done
}

# Start Docker services
start_docker() {
    print_status "Starting Docker services..."
    docker-compose up -d postgres redis mongodb elasticsearch
    
    print_status "Waiting for services to be ready..."
    sleep 10
    
    print_success "Docker services started"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # This would typically run Prisma migrations
    # For now, we'll just print a message
    print_warning "Database migrations should be run manually after the services are started"
    print_status "To run migrations: cd backend/gateway && npx prisma migrate dev"
}

# Build the project
build_project() {
    print_status "Building the project..."
    
    print_status "Building shared package..."
    cd shared && npm run build && cd ..
    
    print_status "Building backend..."
    cd backend/gateway && npm run build && cd ../..
    
    print_status "Building frontend..."
    cd frontend && npm run build && cd ..
    
    print_success "Project built successfully"
}

# Main setup function
main() {
    echo "=========================================="
    echo "    MeChama Platform Setup"
    echo "=========================================="
    echo
    
    check_docker
    check_node
    install_dependencies
    setup_env
    start_docker
    run_migrations
    
    echo
    echo "=========================================="
    print_success "Setup completed successfully!"
    echo "=========================================="
    echo
    echo "Next steps:"
    echo "1. Update the .env file with your configuration"
    echo "2. Run database migrations: cd backend/gateway && npx prisma migrate dev"
    echo "3. Start the development servers: npm run dev"
    echo "4. Open http://localhost:3008 in your browser"
    echo
    echo "For more information, check the README.md file"
}

# Run main function
main "$@"