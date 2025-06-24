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

## RAG Analytics Features

### Analytics Dashboard (`/analytics`)

The application includes a comprehensive analytics dashboard that provides insights into:

#### Classification Analytics

- **Query Distribution**: Breakdown of query types (direct_answer, rag_enhanced, context_dependent, ambiguous)
- **Complexity Analysis**: Distribution of query complexity levels (simple, moderate, complex)
- **Confidence Metrics**: Average confidence scores and high-confidence query counts
- **Skip Reasons**: Understanding when and why RAG is bypassed

#### Performance Analytics (API: `/api/analytics/rag-performance`)

- **Pipeline Performance**: End-to-end timing with percentiles (P50, P95, P99)
- **Step-by-Step Breakdown**: Individual timing for each RAG step:
  - Classification
  - HyDE (Hypothetical Document Embeddings)
  - Embedding generation
  - Retrieval
  - Similarity ranking
  - Quality filtering
  - Diversity enhancement
- **Success Rates**: RAG completion vs. skip rates

### Logged Events

The RAG middleware automatically logs the following events to Axiom:

1. **`rag_middleware_skip`** - When RAG is bypassed

   - `reason`: Why RAG was skipped
   - `query`: The original query
   - `classification_type`: Query classification

2. **`rag_classification_complete`** - Query classification results

   - `classification_type`: Type of query
   - `complexity`: Query complexity level
   - `confidence`: Classification confidence score
   - `requires_context`: Whether context is needed
   - `duration_ms`: Classification timing

3. **`rag_[step]_complete`** - Individual step completions

   - `duration_ms`: Step execution time
   - Step-specific metadata

4. **`rag_middleware_complete`** - Full pipeline completion
   - `total_duration_ms`: End-to-end timing
   - `steps_completed`: Number of steps executed
   - `final_confidence`: Overall confidence score

## Key Benefits for RAG Chat App

1. **RAG Performance Optimization**: Identify bottlenecks in the retrieval pipeline
2. **Query Intelligence**: Understand query patterns and classification accuracy
3. **Quality Monitoring**: Track confidence scores and filtering effectiveness
4. **User Experience**: Monitor response times and success rates
5. **Cost Optimization**: Analyze when RAG is skipped vs. utilized
6. **Debugging**: Detailed step-by-step execution logs for troubleshooting

## Privacy & Compliance

- No personally identifiable information (PII) is logged
- Chat content can be optionally logged (configure as needed)
- All tracking follows GDPR/CCPA guidelines
- Data retention follows Axiom's standard policies

## Next Steps

1. Install dependencies: `pnpm install` ✓
2. Set up environment variables in `.env.local`
3. Deploy and test the integration
4. Start chatting to generate analytics data
5. Visit `/analytics` to view the dashboard
6. Create custom Axiom dashboards for additional monitoring
7. Set up alerts for key metrics (response time, error rates, etc.)

## Analytics API Endpoints

### Classification Analytics

```
GET /api/analytics/rag-classification?hours=24
```

Returns query classification distribution, complexity analysis, and skip reasons.

### Performance Analytics

```
GET /api/analytics/rag-performance?hours=24
```

Returns pipeline performance metrics, step timing, and success rates.

Both endpoints support the `hours` parameter to specify the time range (default: 24 hours).
