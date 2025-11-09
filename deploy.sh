#!/bin/bash

# PetRent MVP Deployment Script
# This script automates the deployment process for different environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}"
    echo "=================================="
    echo "  PetRent MVP Deployment"
    echo "=================================="
    echo -e "${NC}"
}

print_step() {
    echo -e "${YELLOW}➤ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Install dependencies
install_dependencies() {
    print_step "Installing dependencies..."
    npm ci --silent
    print_success "Dependencies installed"
}

# Setup environment
setup_environment() {
    print_step "Setting up environment..."
    
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_success "Created .env from template"
        else
            print_error ".env.example not found"
            exit 1
        fi
    else
        print_success ".env already exists"
    fi
    
    # Generate a random session secret if not set
    if grep -q "your-super-secret-session-key" .env 2>/dev/null; then
        local secret=$(openssl rand -base64 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
        sed -i.bak "s/your-super-secret-session-key-change-this-in-production/$secret/g" .env
        rm -f .env.bak
        print_success "Generated new session secret"
    fi
}

# Initialize database
init_database() {
    print_step "Initializing database..."
    node -e "
        const sqlite3 = require('sqlite3').verbose();
        const db = new sqlite3.Database('./pet_rental.db');
        db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, email TEXT UNIQUE, password TEXT, firstName TEXT, lastName TEXT, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)');
        db.close();
        console.log('Database initialized');
    "
    print_success "Database initialized"
}

# Start the application
start_application() {
    local mode=${1:-"development"}
    
    print_step "Starting application in $mode mode..."
    
    if [ "$mode" = "production" ]; then
        # Check if PM2 is available
        if command -v pm2 &> /dev/null; then
            pm2 start server.js --name "petrental-mvp" --env production
            print_success "Application started with PM2"
        else
            NODE_ENV=production nohup node server.js > app.log 2>&1 &
            echo $! > petrental.pid
            print_success "Application started in background"
        fi
    else
        if command -v nodemon &> /dev/null; then
            nodemon server.js &
            echo $! > petrental.pid
            print_success "Application started with nodemon"
        else
            node server.js &
            echo $! > petrental.pid
            print_success "Application started"
        fi
    fi
}

# Health check
health_check() {
    print_step "Performing health check..."
    sleep 3
    
    if curl -s http://localhost:3000 > /dev/null; then
        print_success "Application is running and accessible"
        print_success "Visit http://localhost:3000 to access PetRent"
    else
        print_error "Health check failed. Application may not be running properly."
        return 1
    fi
}

# Docker deployment
deploy_docker() {
    print_step "Deploying with Docker..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Build and start
    docker-compose up -d --build
    print_success "Docker deployment completed"
    print_success "Visit http://localhost:3000 to access PetRent"
}

# Stop application
stop_application() {
    print_step "Stopping application..."
    
    if [ -f petrental.pid ]; then
        local pid=$(cat petrental.pid)
        if kill -0 $pid 2>/dev/null; then
            kill $pid
            rm -f petrental.pid
            print_success "Application stopped"
        else
            print_error "Process $pid not found"
        fi
    else
        print_error "PID file not found"
    fi
    
    # Stop PM2 if running
    if command -v pm2 &> /dev/null; then
        pm2 stop petrental-mvp 2>/dev/null || true
    fi
}

# Show logs
show_logs() {
    if [ -f app.log ]; then
        print_step "Application logs:"
        tail -n 50 app.log
    else
        print_error "No log file found"
    fi
}

# Main deployment function
deploy() {
    local mode=${1:-"development"}
    local method=${2:-"local"}
    
    print_header
    
    case $method in
        "docker")
            deploy_docker
            health_check
            ;;
        "local")
            check_prerequisites
            install_dependencies
            setup_environment
            init_database
            start_application $mode
            health_check
            ;;
        *)
            print_error "Invalid deployment method: $method"
            print_error "Usage: $0 [development|production] [local|docker]"
            exit 1
            ;;
    esac
}

# Show help
show_help() {
    echo "PetRent MVP Deployment Script"
    echo ""
    echo "Usage:"
    echo "  $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  deploy [mode] [method]    Deploy the application"
    echo "  stop                      Stop the application"
    echo "  logs                      Show application logs"
    echo "  help                      Show this help message"
    echo ""
    echo "Parameters:"
    echo "  mode      - 'development' or 'production' (default: development)"
    echo "  method    - 'local' or 'docker' (default: local)"
    echo ""
    echo "Examples:"
    echo "  $0 deploy development local    # Local development deployment"
    echo "  $0 deploy production docker    # Production Docker deployment"
    echo "  $0 deploy                     # Development local deployment"
    echo "  $0 stop                       # Stop the application"
    echo "  $0 logs                       # Show logs"
}

# Main script logic
case "${1:-deploy}" in
    "deploy")
        deploy "${2:-development}" "${3:-local}"
        ;;
    "stop")
        stop_application
        ;;
    "logs")
        show_logs
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac