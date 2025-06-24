# RAG Chat with Analytics

This application demonstrates advanced retrieval augmented generation (RAG) with comprehensive analytics and observability. Built using the [Language Model Middleware](https://sdk.vercel.ai/docs/ai-sdk-core/middleware#language-model-middleware), [AI SDK](https://sdk.vercel.ai/docs), [Next.js](https://nextjs.org/), and [Axiom](https://axiom.co/) for logging and analytics.

## Features

- 🤖 **Advanced RAG Pipeline**: Multi-step retrieval with classification, HyDE, embeddings, similarity ranking, quality filtering, and diversity
- 📊 **Real-time Analytics**: Comprehensive dashboard showing RAG performance, classification metrics, and usage patterns
- 🔍 **Query Intelligence**: Automatic query classification and complexity analysis
- 📈 **Performance Monitoring**: Step-by-step timing analysis and bottleneck identification
- 🛡️ **Quality Assurance**: Built-in quality filtering and confidence scoring
- 🎯 **Smart Routing**: Context-aware query routing and skip logic

## Deploy your own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fai-sdk-preview-internal-knowledge-base&env=OPENAI_API_KEY%2CAUTH_SECRET&envDescription=API%20keys%20needed%20for%20application&envLink=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fai-sdk-preview-internal-knowledge-base%2Fblob%2Fmain%2F.env.example&stores=%5B%7B%22type%22%3A%22blob%22%7D%2C%7B%22type%22%3A%22postgres%22%7D%5D)

## How to use

Run [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) with [npm](https://docs.npmjs.com/cli/init), [Yarn](https://yarnpkg.com/lang/en/docs/cli/create/), or [pnpm](https://pnpm.io) to bootstrap the example:

```bash
npx create-next-app --example https://github.com/vercel-labs/ai-sdk-preview-internal-knowledge-base ai-sdk-preview-internal-knowledge-base-example
```

```bash
yarn create next-app --example https://github.com/vercel-labs/ai-sdk-preview-internal-knowledge-base ai-sdk-preview-internal-knowledge-base-example
```

```bash
pnpm create next-app --example https://github.com/vercel-labs/ai-sdk-preview-internal-knowledge-base ai-sdk-preview-internal-knowledge-base-example
```

To run the example locally you need to:

1. Sign up for accounts with the AI providers you want to use (e.g., OpenAI, Anthropic).
2. Obtain API keys for each provider.
3. Set up Axiom for analytics (see [AXIOM_SETUP.md](./AXIOM_SETUP.md) for detailed instructions).
4. Set the required environment variables as shown in the `.env.example` file, but in a new file called `.env`.
5. `npm install` to install the required dependencies.
6. `npm run dev` to launch the development server.

## Analytics Dashboard

Once you have Axiom set up and users start chatting, you can access the analytics dashboard at:

- **Classification Analytics**: `/analytics` - View query classification distribution, complexity analysis, and skip reasons
- **Performance Analytics**: Available via API at `/api/analytics/rag-performance` - Monitor step-by-step timing and bottlenecks

### Key Metrics Tracked

- **Query Classification**: Direct answers, RAG-enhanced, context-dependent, and ambiguous queries
- **Performance Timing**: End-to-end pipeline performance and individual step breakdowns
- **Quality Metrics**: Confidence scores, context requirements, and filtering effectiveness
- **Usage Patterns**: Skip reasons, complexity distribution, and success rates

## Learn More

To learn more about the AI SDK or Next.js by Vercel, take a look at the following resources:

- [AI SDK Documentation](https://sdk.vercel.ai/docs)
- [Next.js Documentation](https://nextjs.org/docs)
