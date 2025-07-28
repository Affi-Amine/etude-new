#!/bin/bash

# Database setup script for lesson platform
# This script sets up PostgreSQL database with multi-tenant support

set -e

echo "🚀 Setting up PostgreSQL database for lesson platform..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL not found. Please install PostgreSQL first."
    exit 1
else
    echo "✅ PostgreSQL is already installed"
    psql --version
fi

# Test PostgreSQL connection
if ! psql postgres -c "SELECT 1;" &> /dev/null; then
    echo "❌ Cannot connect to PostgreSQL. Please ensure PostgreSQL is running."
    echo "💡 Try: brew services start postgresql@14"
    exit 1
else
    echo "✅ PostgreSQL connection successful"
fi

# Database configuration
DB_NAME="lesson_platform_db"
DB_USER=$(whoami)

echo "🗄️ Setting up database..."

# Create database if it doesn't exist
if ! psql postgres -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo "📦 Creating database $DB_NAME..."
    createdb $DB_NAME
else
    echo "✅ Database $DB_NAME already exists"
fi

echo "🔧 Setting up database extensions and functions..."

# Run initialization script
psql -d $DB_NAME -f prisma/init.sql

echo "📋 Running Prisma migrations..."

# Generate Prisma client and run migrations
npx prisma generate
npx prisma db push

echo "🌱 Seeding database with initial data..."

# Run seed script if it exists
if [ -f "prisma/seed.ts" ]; then
    npx prisma db seed
else
    echo "⚠️ No seed script found. Skipping seeding."
fi

echo "✅ Database setup completed successfully!"
echo "📊 Database URL: postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
echo "🔗 You can connect to the database using:"
echo "   psql -U $DB_USER -d $DB_NAME"