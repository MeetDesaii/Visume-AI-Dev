# @visume/types

Centralized TypeScript types, interfaces, and type definitions for Visume AI v3 monorepo.

## Overview

This package provides a single source of truth for all shared types across the Visume AI application. It eliminates duplicate type definitions and ensures type safety across package boundaries.

## Structure

```
src/
├── index.ts           # Main barrel export
├── models/            # Database model types (User, Resume, Job)
├── enums/             # String literal unions and constants
├── api/               # API request/response types
├── ai/                # AI service types (analysis, generation, parsing)
├── web/               # Web app types (hooks, forms, pages)
└── common/            # Shared utility types
```

## Usage

### Import from root

```typescript
import { User, Resume, SubscriptionTier, ApiResponse } from "@visume/types";
```

### Import from specific modules

```typescript
import { User, Resume } from "@visume/types/models";
import { SubscriptionTier, AuthProvider } from "@visume/types/enums";
import { ApiResponse, ApiError } from "@visume/types/api";
import { ResumeAnalysis, ParsedResume } from "@visume/types/ai";
```

## Package Exports

- `@visume/types` - All types
- `@visume/types/models` - Database model types
- `@visume/types/enums` - Enumeration types
- `@visume/types/api` - API types
- `@visume/types/ai` - AI service types
- `@visume/types/web` - Web application types
- `@visume/types/common` - Common utility types

## Type Categories

### Models

Plain TypeScript interfaces matching database schemas (without Mongoose Document extension).

### Enums

String literal union types with companion constants for runtime access.

### API

Request/response wrappers, error types, authentication payloads.

### AI

Types for AI analysis, generation, parsing, and configuration.

### Web

Frontend-specific types for hooks, forms, and pages.

### Common

Shared utility types like pagination, metadata, and helpers.

## Development

```bash
# Type check
pnpm type-check

# Lint
pnpm lint
```

## Notes

- This package uses TypeScript's type-only imports/exports
- All enums use string literal unions (not TypeScript `enum`)
- Database Document interfaces live in `@visume/database`
- Zod schemas live in `@visume/ai-core` (types are re-exported here)
