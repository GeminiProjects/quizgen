# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QuizGen (校园演讲即时测评系统) is a real-time assessment system for campus presentations. It enables speakers to generate AI-powered quizzes during presentations, audiences to answer questions with instant feedback, and organizers to manage lecture series with participation metrics.

## Tech Stack

- **Frontend**: Next.js 15 with React 19, TailwindCSS v4, Shadcn/ui components
- **Database**: PostgreSQL (Neon Serverless) with Drizzle ORM
- **Package Manager**: Bun (v1.2.18) - ALWAYS use `bun` instead of `npm`, `yarn`, or `pnpm`
- **Build System**: Turborepo monorepo
- **Code Quality**: Ultracite for linting/formatting

## Monorepo Structure

```
/apps/web          - Next.js frontend application
/packages/db       - Database layer with Drizzle ORM
/packages/ui       - Shared UI components library (Shadcn/ui)
/packages/tsconfig - Shared TypeScript configurations
/packages/auth     - Authentication package (Better Auth)
/tools/git-sum     - Git statistics utility
```

## Common Commands

### Development
```bash
bun dev              # Start all dev servers
bun dev --filter=web # Start only web app
bun build           # Build all packages
bun test            # Run all tests
bun lint            # Run Ultracite linting
bun format          # Format code with Ultracite
```

### Database Operations (from packages/db)
```bash
bun db:push      # Push schema changes to database
bun db:generate  # Generate migration files
bun db:migrate   # Run pending migrations
bun db:studio    # Open Drizzle Studio GUI
bun db:reset     # Reset database (destructive)
```

### Running Individual Apps
```bash
cd apps/web && bun dev  # Run Next.js app with Turbopack
```

## Architecture Principles

1. **Unified User Model**: Single user table with dynamic role assignment based on context (speaker/audience/organizer)
2. **Snake Case Database**: All database fields use snake_case naming convention
3. **Server Components First**: Leverage React Server Components for better performance
4. **Type Safety**: Full TypeScript coverage with strict mode enabled

## Database Schema

Key entities:
- `users` - Managed by Better Auth
- `organizations` - Groups hosting lecture series (password-protected)
- `lectures` - Individual presentation sessions
- `materials` - Pre-uploaded presentation content
- `transcripts` - Real-time speech transcriptions
- `quiz_items` - AI-generated questions
- `attempts` - User quiz responses

## Development Guidelines

1. **Use Bun**: All commands should use `bun` not `node`, `npm`, or `yarn`
2. **Frontend Best Practices**: Follow cursor rules in `.cursor/rules/frontend.mdc`:
   - Use early returns for readability
   - Style with Tailwind classes only
   - Prefix event handlers with "handle" (e.g., `handleClick`)
   - Implement accessibility features
   - Use `const` arrow functions with TypeScript types
3. **Database Conventions**: 
   - Use snake_case for all database fields
   - Define relations in schema files
   - Use Drizzle's query builder for type-safe queries

## Current Implementation Status

- ✅ Basic UI structure (dashboard, speaker/audience views)
- ✅ Database schema defined
- ✅ Frontend component library setup
- ⏳ Backend API implementation pending
- ⏳ Authentication integration pending
- ⏳ Real-time features pending
- ⏳ AI quiz generation pending

## Environment Variables

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Authentication secret

## Testing Approach

Currently no test framework is configured. When implementing tests, use `bun test` with Bun's built-in test runner.