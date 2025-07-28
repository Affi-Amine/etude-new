# Etude SaaS Project - Lesson Management Platform

A multi-tenant lesson management platform for teachers in Tunisia, built with Next.js, Tailwind CSS, and modern web technologies.

## Features

- **Authentication & Authorization**: Secure login/signup system with pending approval workflow
- **Dashboard**: Comprehensive teacher dashboard with KPIs and analytics
- **Student Management**: CRUD operations for students with group assignments
- **Group Management**: Create and manage student groups with pricing
- **Lesson Scheduling**: Calendar-based lesson scheduling with drag-and-drop
- **Analytics**: Earnings dashboard, attendance tracking, and performance metrics
- **Responsive Design**: Mobile-first design with RTL support for Arabic/French

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v3.4
- **State Management**: Zustand
- **UI Components**: Custom components with Headless UI
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/Affi-Amine/etude-saas-project.git
cd etude-saas-project
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                 # Next.js app router pages
│   ├── auth/           # Authentication pages
│   └── dashboard/      # Dashboard pages
├── components/         # Reusable UI components
│   ├── ui/            # Base UI components
│   └── layout/        # Layout components
├── lib/               # Utility functions
└── store/             # Zustand state management
```

## Current Status

✅ Landing page with hero, features, and testimonials
✅ Authentication system (login/signup)
✅ Dashboard layout with navigation
✅ Student management with CRUD operations
✅ Group management with pricing
✅ Lesson scheduling interface
✅ Analytics dashboard with charts
✅ Profile management
✅ Responsive design with Tailwind CSS

## Future Enhancements

- [ ] Backend integration with GraphQL API
- [ ] PostgreSQL database with multi-tenancy
- [ ] Google Calendar synchronization
- [ ] Email notifications with SendGrid
- [ ] Real-time updates
- [ ] Mobile app

## Contributing

This is a learning project for building modern SaaS applications. Feel free to explore and suggest improvements!

## License

MIT License - see LICENSE file for details.
