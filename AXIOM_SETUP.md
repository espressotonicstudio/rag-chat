# Axiom Integration Setup

This RAG Chat application has been integrated with Axiom for comprehensive observability and logging.

## Installation

1. Install the required dependencies:

```bash
pnpm install
```

The following Axiom packages have been added:

- `@axiomhq/js` - Main Axiom client library
- `@axiomhq/logging` - Logging utilities
- `@axiomhq/nextjs` - Next.js specific integrations
- `@axiomhq/react` - React hooks and components

## Environment Setup

Add the following environment variables to your `.env.local` file:

```env
AXIOM_TOKEN=your_axiom_token_here
AXIOM_DATASET=your_dataset_name_here
```

### Getting Axiom Credentials

1. Sign up for an Axiom account at [https://app.axiom.co/](https://app.axiom.co/)
2. Create a new dataset in your Axiom dashboard (e.g., "rag-chat-logs")
3. Generate an API token with access to your dataset
4. Add these values to your `.env.local` file

## What's Included

The integration includes:

### Automatic Logging

- **Request logging** - All HTTP requests are automatically logged via middleware
- **Error tracking** - Application errors are automatically captured
- **Web vitals** - Performance metrics collection

### Manual Tracking Capabilities

- **User interactions** - Button clicks, form submissions
- **Scroll depth tracking** - User engagement metrics
- **Custom events** - Flexible event tracking system

## Files Created/Modified

### Core Axiom Files

- `lib/axiom/axiom.ts` - Main Axiom client configuration
- `lib/axiom/server.ts` - Server-side logger setup
- `lib/axiom/client.ts` - Client-side logger and React hooks
- `lib/axiom/tracking.ts` - Tracking utilities and custom hooks
- `app/api/axiom/route.ts` - Proxy endpoint for client-side logging

### Integration Files

- `instrumentation.ts` - Error handling integration
- `middleware.ts` - Request logging middleware (integrated with NextAuth)
- `package.json` - Added Axiom dependencies

## Usage

### Server-side Logging

```tsx
import { logger } from "@/lib/axiom/server";
```

### Client-side Logging

```tsx
import { useLogger } from "@/lib/axiom/client";
```

### Tracking Hooks

```tsx
import {
  useScrollTracking,
  useButtonTracking,
  useFormTracking,
} from "@/lib/axiom/tracking";
```

### Web Vitals

```tsx
import { WebVitals } from "@/lib/axiom/client";
```

## Key Benefits for RAG Chat App

1. **Chat Analytics**: Track user interactions with the chat system
2. **Performance Monitoring**: Monitor API response times and error rates
3. **User Engagement**: Understand how users interact with the knowledge base
4. **Error Tracking**: Quickly identify and debug issues
5. **Usage Patterns**: Analyze popular queries and topics

## Privacy & Compliance

- No personally identifiable information (PII) is logged
- Chat content can be optionally logged (configure as needed)
- All tracking follows GDPR/CCPA guidelines
- Data retention follows Axiom's standard policies

## Next Steps

1. Install dependencies: `pnpm install` ✓
2. Set up environment variables in `.env.local`
3. Deploy and test the integration
4. Create Axiom dashboards for monitoring
5. Set up alerts for key metrics
