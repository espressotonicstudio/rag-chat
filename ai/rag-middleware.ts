import { auth } from "@/app/(auth)/auth";
import { getChunksByFilePaths } from "@/app/db";
import { google } from "@ai-sdk/google";
import {
  cosineSimilarity,
  embed,
  LanguageModelV1Middleware,
  generateObject,
  generateText,
} from "ai";
import { z } from "zod";
import { logger } from "@/lib/axiom/server";
import { randomUUID } from "crypto";
import { HybridSearch } from "./hybrid-search";
import { geminiReranker } from "./gemini-reranker";

// schema for validating the custom provider metadata
const selectionSchema = z.object({
  chatId: z.object({
    value: z.string(),
  }),
  apiKey: z.object({
    value: z.string(),
  }),
  files: z.object({
    selection: z.array(z.string()),
  }),
});

// enhanced classification schema for small business website visitors
const classificationSchema = z.object({
  type: z.enum([
    "product-service-inquiry", // asking about products, services, features, availability
    "pricing-cost-question", // asking about prices, costs, fees, payment options
    "location-hours-contact", // asking about location, hours, contact info, directions
    "booking-appointment", // asking about scheduling, booking, availability
    "support-help-question", // asking for help, troubleshooting, how-to questions
    "company-about-info", // asking about company history, team, values, story
    "general-inquiry", // general questions that need business context
    "casual-statement", // casual statements or greetings that don't need context
    "other", // unclear or off-topic
  ]),
  complexity: z.enum(["simple", "complex"]),
  requiresContext: z.boolean(),
  confidence: z.number().min(0).max(1), // how confident the classification is
});

export const ragMiddleware: LanguageModelV1Middleware = {
  transformParams: async ({ params }) => {
    const { prompt: messages, providerMetadata } = params;

    // validate the provider metadata with Zod:
    const { success, data } = selectionSchema.safeParse(providerMetadata);

    // Start tracking overall RAG middleware performance
    const startTime = Date.now();
    const sessionId = data?.chatId.value ?? randomUUID();

    logger.info("rag_middleware_start", {
      session_id: sessionId,
      timestamp: new Date().toISOString(),
    });

    if (!success) {
      logger.info("rag_middleware_skip", {
        session_id: sessionId,
        reason: "no_files_selected",
        duration_ms: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });
      return params; // no files selected
    }

    const selection = data.files.selection;

    const recentMessage = messages.pop();

    if (!recentMessage || recentMessage.role !== "user") {
      if (recentMessage) {
        messages.push(recentMessage);
      }

      logger.info("rag_middleware_skip", {
        session_id: sessionId,
        reason: "no_user_message",
        duration_ms: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });
      return params;
    }

    const lastUserMessageContent = recentMessage.content
      .filter((content) => content.type === "text")
      .map((content) => content.text)
      .join("\n");

    // Enhanced classification for better query routing
    const classificationStart = Date.now();
    logger.info("rag_classification_start", {
      session_id: sessionId,
      question: lastUserMessageContent,
      timestamp: new Date().toISOString(),
    });

    const { object: classification } = await generateObject({
      // fast model for classification:
      model: google("gemini-2.5-flash-lite-preview-06-17"),
      schema: classificationSchema,
      system: `Analyze the user message and classify it with the following criteria:

        TYPE CLASSIFICATION:
        - product-service-inquiry: Asking about products, services, features, availability, specifications, "What do you offer?"
        - pricing-cost-question: Asking about prices, costs, fees, payment options, discounts, "How much does it cost?"
        - location-hours-contact: Asking about location, hours, contact info, directions, parking, "Where are you located?"
        - booking-appointment: Asking about scheduling, booking, availability, reservations, "Can I book an appointment?"
        - support-help-question: Asking for help, troubleshooting, how-to questions, technical support, "How do I...?"
        - company-about-info: Asking about company history, team, values, story, experience, "Tell me about your company"
        - general-inquiry: General questions about the business that need context but don't fit other categories
        - casual-statement: Casual statements, greetings, or comments that don't need business context
        - other: Unclear, off-topic, or unrelated to the business

        COMPLEXITY:
        - simple: Direct, single-concept questions from website visitors
        - complex: Multi-part questions or questions requiring detailed explanations

        REQUIRES_CONTEXT:
        - true: Needs information from business documents/website to answer properly
        - false: Can be answered without additional business context

        CONFIDENCE: Rate 0-1 how confident you are in this classification`,
      prompt: lastUserMessageContent,
    });

    logger.info("rag_classification_complete", {
      session_id: sessionId,
      classification_type: classification.type,
      complexity: classification.complexity,
      requires_context: classification.requiresContext,
      confidence: classification.confidence,
      duration_ms: Date.now() - classificationStart,
      timestamp: new Date().toISOString(),
    });

    // Only use RAG for questions that require context
    if (!classification?.requiresContext || classification?.type === "other") {
      logger.info("rag_middleware_skip", {
        session_id: sessionId,
        reason: "no_context_required",
        classification_type: classification.type,
        requires_context: classification.requiresContext,
        duration_ms: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });
      messages.push(recentMessage);
      return params;
    }

    // Type the classification for better TypeScript support
    const typedClassification = classification as z.infer<
      typeof classificationSchema
    >;

    // Use hypothetical document embeddings:
    const hydeStart = Date.now();
    logger.info("rag_hyde_start", {
      session_id: sessionId,
      timestamp: new Date().toISOString(),
    });

    const { text: hypotheticalAnswer } = await generateText({
      // fast model for generating hypothetical answer:
      model: google("gemini-2.5-flash-lite-preview-06-17"),
      system: "Answer the users question:",
      prompt: lastUserMessageContent,
    });

    logger.info("rag_hyde_complete", {
      session_id: sessionId,
      hypothetical_answer_length: hypotheticalAnswer.length,
      duration_ms: Date.now() - hydeStart,
      timestamp: new Date().toISOString(),
    });

    // Embed the hypothetical answer
    const embeddingStart = Date.now();
    logger.info("rag_embedding_start", {
      session_id: sessionId,
      timestamp: new Date().toISOString(),
    });

    const { embedding: hypotheticalAnswerEmbedding } = await embed({
      model: google.textEmbeddingModel("text-embedding-004"),
      value: hypotheticalAnswer,
    });

    logger.info("rag_embedding_complete", {
      session_id: sessionId,
      embedding_dimensions: hypotheticalAnswerEmbedding.length,
      duration_ms: Date.now() - embeddingStart,
      timestamp: new Date().toISOString(),
    });

    // find relevant chunks based on the selection
    const retrievalStart = Date.now();
    logger.info("rag_retrieval_start", {
      session_id: sessionId,
      selected_files: selection.length,
      timestamp: new Date().toISOString(),
    });

    const chunksBySelection = await getChunksByFilePaths({
      filePaths: selection.map((path) => `${data.apiKey.value}/${path}`),
    });

    // First, calculate semantic similarities using HyDE embeddings
    const semanticStart = Date.now();
    logger.info("rag_semantic_search_start", {
      session_id: sessionId,
      chunks_to_process: chunksBySelection.length,
      timestamp: new Date().toISOString(),
    });

    const semanticResults = chunksBySelection.map((chunk) => ({
      chunk,
      similarity: cosineSimilarity(
        hypotheticalAnswerEmbedding,
        chunk.embedding
      ),
      rank: 0, // Will be set after sorting
    }));

    // Sort by similarity and assign ranks
    semanticResults.sort((a, b) => b.similarity - a.similarity);
    semanticResults.forEach((result, index) => {
      result.rank = index + 1;
    });

    // Log semantic search results
    const semanticScores = semanticResults.map((r) => r.similarity);
    const topSemanticChunks = semanticResults.slice(0, 10);

    logger.info("rag_semantic_search_complete", {
      session_id: sessionId,
      semantic_results_count: semanticResults.length,
      avg_semantic_score:
        semanticScores.reduce((a, b) => a + b, 0) / semanticScores.length,
      min_semantic_score: Math.min(...semanticScores),
      max_semantic_score: Math.max(...semanticScores),
      top_10_semantic_scores: topSemanticChunks.map((r) => ({
        score: r.similarity,
        content_preview: r.chunk.content.substring(0, 100),
        file_path: r.chunk.filePath,
      })),
      duration_ms: Date.now() - semanticStart,
      timestamp: new Date().toISOString(),
    });

    // Initialize hybrid search with adaptive configuration
    const hybridStart = Date.now();
    const optimalAlpha = getOptimalAlpha(
      typedClassification,
      lastUserMessageContent
    );

    logger.info("rag_hybrid_search_start", {
      session_id: sessionId,
      query_type: typedClassification.type,
      query_complexity: typedClassification.complexity,
      optimal_alpha: optimalAlpha,
      query_preview: lastUserMessageContent.substring(0, 200),
      timestamp: new Date().toISOString(),
    });

    const hybridSearchConfig = {
      alpha: optimalAlpha,
      topK: Math.min(chunksBySelection.length, 50),
      semanticThreshold: 0.1,
      bm25Threshold: 0.0,
      enableAdaptiveWeighting: true,
    };

    const hybridSearch = new HybridSearch(hybridSearchConfig);

    // Get debug info about the hybrid search configuration
    const hybridDebugInfo = hybridSearch.getDebugInfo(
      lastUserMessageContent,
      chunksBySelection
    );

    logger.info("rag_hybrid_search_config", {
      session_id: sessionId,
      config: hybridSearchConfig,
      query_analysis: hybridDebugInfo.query,
      bm25_debug: hybridDebugInfo.bm25Debug,
      timestamp: new Date().toISOString(),
    });

    // Perform hybrid search combining semantic and BM25 results
    const hybridResults = hybridSearch.search(
      lastUserMessageContent,
      chunksBySelection,
      semanticResults
    );

    // Log detailed hybrid search results
    const hybridScores = hybridResults.map((r) => r.hybridScore);
    const sourceDistribution = {
      semantic: hybridResults.filter((r) => r.source === "semantic").length,
      bm25: hybridResults.filter((r) => r.source === "bm25").length,
      both: hybridResults.filter((r) => r.source === "both").length,
    };

    logger.info("rag_hybrid_search_complete", {
      session_id: sessionId,
      hybrid_results_count: hybridResults.length,
      source_distribution: sourceDistribution,
      avg_hybrid_score:
        hybridScores.length > 0
          ? hybridScores.reduce((a, b) => a + b, 0) / hybridScores.length
          : 0,
      min_hybrid_score: hybridScores.length > 0 ? Math.min(...hybridScores) : 0,
      max_hybrid_score: hybridScores.length > 0 ? Math.max(...hybridScores) : 0,
      top_5_hybrid_results: hybridResults.slice(0, 5).map((r) => ({
        rank: r.rank,
        hybrid_score: r.hybridScore,
        semantic_score: r.semanticScore,
        bm25_score: r.bm25Score,
        source: r.source,
        content_preview: r.chunk.content.substring(0, 100),
        file_path: r.chunk.filePath,
      })),
      alpha_used: optimalAlpha,
      semantic_weight_percent: Math.round(optimalAlpha * 100),
      bm25_weight_percent: Math.round((1 - optimalAlpha) * 100),
      duration_ms: Date.now() - hybridStart,
      timestamp: new Date().toISOString(),
    });

    // Convert hybrid results back to the expected format with similarity scores
    const chunksWithSimilarity = hybridResults.map((result) => ({
      ...result.chunk,
      similarity: result.hybridScore, // Use hybrid score as similarity
      hybridScore: result.hybridScore,
      semanticScore: result.semanticScore,
      bm25Score: result.bm25Score,
      source: result.source,
    }));

    logger.info("rag_retrieval_complete", {
      session_id: sessionId,
      chunks_retrieved: chunksBySelection.length,
      hybrid_results_count: hybridResults.length,
      hybrid_alpha: hybridSearchConfig.alpha,
      sources_distribution: {
        semantic: hybridResults.filter((r) => r.source === "semantic").length,
        bm25: hybridResults.filter((r) => r.source === "bm25").length,
        both: hybridResults.filter((r) => r.source === "both").length,
      },
      duration_ms: Date.now() - retrievalStart,
      timestamp: new Date().toISOString(),
    });

    // rank the chunks by similarity and take the top K
    const similarityStart = Date.now();
    logger.info("rag_similarity_ranking_start", {
      session_id: sessionId,
      chunks_to_rank: chunksWithSimilarity.length,
      timestamp: new Date().toISOString(),
    });

    chunksWithSimilarity.sort((a, b) => b.similarity - a.similarity);

    // Determine optimal K based on classification
    function getOptimalK(
      classificationResult: z.infer<typeof classificationSchema>,
      questionLength: number,
      selectedFiles: number,
      availableChunks: number
    ): number {
      let baseK = 8;

      // Adjust based on visitor inquiry type
      switch (classificationResult.type) {
        case "product-service-inquiry":
          baseK = 10; // Product questions need comprehensive details and features
          break;
        case "pricing-cost-question":
          baseK = 6; // Pricing questions need focused, specific information
          break;
        case "location-hours-contact":
          baseK = 4; // Contact info questions need minimal, precise details
          break;
        case "booking-appointment":
          baseK = 6; // Booking questions need specific process and availability info
          break;
        case "support-help-question":
          baseK = 8; // Support questions need step-by-step guidance
          break;
        case "company-about-info":
          baseK = 8; // About questions need company story and background
          break;
        case "general-inquiry":
          baseK = 8; // General inquiries get standard context
          break;
        default:
          baseK = 4; // Conservative for casual statements and other types
      }

      // Adjust for complexity
      if (classificationResult.complexity === "complex") {
        baseK += 4;
      }

      // Adjust for question length (longer questions suggest more context needed)
      if (questionLength > 100) baseK += 2;
      if (questionLength > 200) baseK += 2;

      // Adjust for number of selected files
      if (selectedFiles < 3) {
        baseK = Math.min(baseK, 6); // Fewer files = less noise tolerance
      }

      // Cap based on available chunks and confidence
      const maxK = Math.floor(availableChunks * 0.4); // Don't use more than 40% of available chunks
      if (classificationResult.confidence < 0.7) {
        baseK = Math.min(baseK, 6); // Lower confidence = more conservative
      }

      return Math.min(baseK, maxK, 15); // Hard cap at 15
    }

    // Determine optimal alpha (semantic vs keyword weighting) based on classification
    function getOptimalAlpha(
      classificationResult: z.infer<typeof classificationSchema>,
      query: string
    ): number {
      let baseAlpha = 0.7; // Default: 70% semantic, 30% keyword

      // Adjust based on query type
      switch (classificationResult.type) {
        case "product-service-inquiry":
          baseAlpha = 0.8; // Favor semantic for conceptual product questions
          break;
        case "pricing-cost-question":
          baseAlpha = 0.4; // Favor keyword for specific pricing terms
          break;
        case "location-hours-contact":
          baseAlpha = 0.3; // Strongly favor keyword for exact contact info
          break;
        case "booking-appointment":
          baseAlpha = 0.5; // Balanced for booking-related terms
          break;
        case "support-help-question":
          baseAlpha = 0.6; // Slightly favor semantic for broader support context
          break;
        case "company-about-info":
          baseAlpha = 0.8; // Favor semantic for company story and values
          break;
        default:
          baseAlpha = 0.7; // Default balanced approach
      }

      // Adjust for query characteristics
      const hasSpecificTerms =
        /\b(price|cost|\$|phone|email|address|hours|schedule|appointment)\b/i.test(
          query
        );
      if (hasSpecificTerms) {
        baseAlpha -= 0.2; // Favor keyword for specific terms
      }

      const hasQuotedTerms = /["'].*["']/.test(query);
      if (hasQuotedTerms) {
        baseAlpha -= 0.3; // Strongly favor keyword for quoted exact matches
      }

      return Math.max(0.1, Math.min(0.9, baseAlpha));
    }

    const k = getOptimalK(
      typedClassification,
      lastUserMessageContent.length,
      selection.length,
      chunksWithSimilarity.length
    );

    // Configure diversity settings based on question type
    const diversityConfig = {
      maxChunksPerFile:
        typedClassification.type === "product-service-inquiry" ? 4 : 3,
      contentSimilarityThreshold:
        typedClassification.type === "pricing-cost-question" ? 0.9 : 0.85,
      preferSpreadAcrossSources: typedClassification.complexity === "complex",
    };

    // Configure quality thresholds based on visitor intent
    const qualityThresholds: Record<string, number> = {
      "product-service-inquiry": 0.25, // Broader context for comprehensive answers
      "pricing-cost-question": 0.35, // Higher precision for specific pricing
      "location-hours-contact": 0.45, // Very specific information needed
      "booking-appointment": 0.3, // Specific booking process info
      "support-help-question": 0.2, // Broader context for troubleshooting
      "company-about-info": 0.25, // Company story can be broad
      "general-inquiry": 0.3, // Standard threshold
      "casual-statement": 0.15, // Very low threshold for casual interactions
      other: 0.2, // Conservative threshold for unclear questions
    };

    const baseQualityThreshold =
      qualityThresholds[typedClassification.type] || 0.25;

    logger.info("rag_similarity_ranking_complete", {
      session_id: sessionId,
      duration_ms: Date.now() - similarityStart,
      timestamp: new Date().toISOString(),
    });

    // Apply quality thresholds to filter out low-relevance chunks
    const qualityFilterStart = Date.now();
    logger.info("rag_quality_filtering_start", {
      session_id: sessionId,
      base_threshold: baseQualityThreshold,
      chunks_before_filtering: chunksWithSimilarity.length,
      timestamp: new Date().toISOString(),
    });

    let appliedThreshold = baseQualityThreshold;
    let qualityChunks = chunksWithSimilarity.filter(
      (chunk) => chunk.similarity >= appliedThreshold
    );

    // Progressive threshold relaxation if we don't have enough quality chunks
    const targetMinChunks = Math.max(3, Math.floor(k * 0.6)); // At least 60% of target K

    if (qualityChunks.length < targetMinChunks && appliedThreshold > 0.15) {
      logger.info("rag_quality_threshold_relaxation", {
        session_id: sessionId,
        original_threshold: baseQualityThreshold,
        chunks_found: qualityChunks.length,
        target_min_chunks: targetMinChunks,
        timestamp: new Date().toISOString(),
      });

      // First relaxation: reduce threshold by 0.1
      appliedThreshold = Math.max(0.15, baseQualityThreshold - 0.1);
      qualityChunks = chunksWithSimilarity.filter(
        (chunk) => chunk.similarity >= appliedThreshold
      );

      // Second relaxation if still insufficient
      if (
        qualityChunks.length < Math.floor(k * 0.4) &&
        appliedThreshold > 0.15
      ) {
        appliedThreshold = Math.max(0.15, baseQualityThreshold - 0.2);
        qualityChunks = chunksWithSimilarity.filter(
          (chunk) => chunk.similarity >= appliedThreshold
        );
      }
    }

    // Calculate quality metrics for logging
    const similarities = qualityChunks.map((chunk) => chunk.similarity);
    const avgSimilarity =
      similarities.length > 0
        ? similarities.reduce((a, b) => a + b, 0) / similarities.length
        : 0;
    const minSimilarity =
      similarities.length > 0 ? Math.min(...similarities) : 0;
    const maxSimilarity =
      similarities.length > 0 ? Math.max(...similarities) : 0;

    logger.info("rag_quality_filtering_complete", {
      session_id: sessionId,
      threshold_applied: appliedThreshold,
      threshold_relaxed: appliedThreshold !== baseQualityThreshold,
      chunks_before_filtering: chunksWithSimilarity.length,
      chunks_after_filtering: qualityChunks.length,
      chunks_filtered_out: chunksWithSimilarity.length - qualityChunks.length,
      average_similarity: avgSimilarity,
      min_similarity: minSimilarity,
      max_similarity: maxSimilarity,
      duration_ms: Date.now() - qualityFilterStart,
      timestamp: new Date().toISOString(),
    });

    // Use quality-filtered chunks for diversity processing
    const chunksForDiversity = qualityChunks;

    // Apply result diversity to prevent redundant chunks
    const diversityStart = Date.now();
    logger.info("rag_diversity_start", {
      session_id: sessionId,
      target_k: k,
      diversity_config: diversityConfig,
      quality_filtered_chunks: chunksForDiversity.length,
      timestamp: new Date().toISOString(),
    });

    const diverseChunks = [];
    const fileChunkCounts = new Map<string, number>();
    const selectedChunkEmbeddings: number[][] = [];

    for (const chunk of chunksForDiversity) {
      // 1. Check file-level diversity
      const currentFileCount = fileChunkCounts.get(chunk.filePath) || 0;
      if (currentFileCount >= diversityConfig.maxChunksPerFile) {
        continue;
      }

      // 2. Check content similarity with already selected chunks
      const tooSimilarToExisting = selectedChunkEmbeddings.some(
        (existingEmbedding) =>
          cosineSimilarity(chunk.embedding, existingEmbedding) >
          diversityConfig.contentSimilarityThreshold
      );
      if (tooSimilarToExisting) {
        continue;
      }

      // 3. Add chunk and update counters
      diverseChunks.push(chunk);
      selectedChunkEmbeddings.push(chunk.embedding);
      fileChunkCounts.set(chunk.filePath, currentFileCount + 1);

      // Stop when we have enough diverse chunks
      if (diverseChunks.length >= k) {
        break;
      }
    }

    // Fallback: if we don't have enough diverse chunks, gradually relax constraints
    if (diverseChunks.length < Math.floor(k * 0.7)) {
      console.log(
        "Insufficient diverse chunks, applying fallback with relaxed constraints"
      );

      // Reset and try with relaxed file limit
      diverseChunks.length = 0;
      fileChunkCounts.clear();
      selectedChunkEmbeddings.length = 0;
      const relaxedMaxPerFile = diversityConfig.maxChunksPerFile + 2;

      for (const chunk of chunksForDiversity) {
        const currentFileCount = fileChunkCounts.get(chunk.filePath) || 0;
        if (currentFileCount >= relaxedMaxPerFile) continue;

        const tooSimilarToExisting = selectedChunkEmbeddings.some(
          (existingEmbedding) =>
            cosineSimilarity(chunk.embedding, existingEmbedding) > 0.9
        );
        if (tooSimilarToExisting) continue;

        diverseChunks.push(chunk);
        selectedChunkEmbeddings.push(chunk.embedding);
        fileChunkCounts.set(chunk.filePath, currentFileCount + 1);

        if (diverseChunks.length >= k) break;
      }
    }

    // Final fallback: use top quality chunks if still insufficient
    const topKChunks =
      diverseChunks.length >= Math.floor(k * 0.5)
        ? diverseChunks
        : chunksForDiversity.slice(0, k);

    logger.info("rag_diversity_complete", {
      session_id: sessionId,
      diverse_chunks_found: diverseChunks.length,
      final_chunks_selected: topKChunks.length,
      used_diversity_results: topKChunks === diverseChunks,
      file_distribution: Object.fromEntries(fileChunkCounts),
      duration_ms: Date.now() - diversityStart,
      timestamp: new Date().toISOString(),
    });

    // Debug logging (remove in production if needed)
    console.log("RAG Classification:", {
      type: typedClassification.type,
      complexity: typedClassification.complexity,
      requiresContext: typedClassification.requiresContext,
      confidence: typedClassification.confidence,
      selectedK: k,
      availableChunks: chunksWithSimilarity.length,
      diverseChunks: diverseChunks.length,
      usedDiverseResults: topKChunks === diverseChunks,
      fileDistribution: Object.fromEntries(fileChunkCounts),
      questionLength: lastUserMessageContent.length,
    });

    // Gemini Reranking Integration
    const rerankingStart = Date.now();
    logger.info("rag_reranking_start", {
      session_id: sessionId,
      candidate_count: topKChunks.length,
      query_length: lastUserMessageContent.length,
      timestamp: new Date().toISOString(),
    });

    // Convert topKChunks to format expected by reranker
    const candidatesForReranking = topKChunks.map((chunk) => ({
      content: chunk.content,
      score: chunk.similarity,
      metadata: {
        id: chunk.id,
        filePath: chunk.filePath,
        source: chunk.source,
      },
    }));

    const { rerankedDocuments, metrics: rerankingMetrics } =
      await geminiReranker.quickRerank(
        lastUserMessageContent,
        candidatesForReranking,
        Math.min(8, topKChunks.length) // Limit to top 8 for reranking
      );

    // Convert back to original format
    const rerankedChunks = rerankedDocuments.map((doc) => ({
      id: doc.metadata.id,
      content: doc.content,
      filePath: doc.metadata.filePath,
      similarity: doc.score, // Use reranked score
      source: doc.metadata.source,
      reranked: true,
      originalIndex: doc.originalIndex,
    }));

    logger.info("rag_reranking_complete", {
      session_id: sessionId,
      reranked_count: rerankedChunks.length,
      score_improvement:
        rerankedChunks.length > 0
          ? rerankedChunks[0].similarity - (topKChunks[0]?.similarity || 0)
          : 0,
      ...rerankingMetrics,
      duration_ms: Date.now() - rerankingStart,
      timestamp: new Date().toISOString(),
    });

    // Use reranked results as final chunks
    const finalTopKChunks =
      rerankedChunks.length > 0 ? rerankedChunks : topKChunks;

    // Enhanced logging with reranking metrics
    console.log("rag_middleware_complete", {
      session_id: sessionId,
      total_duration_ms: Date.now() - startTime,
      classification_type: typedClassification.type,
      classification_confidence: typedClassification.confidence,
      chunks_selected: topKChunks.length,
      files_processed: selection.length,
      chunks_available: chunksWithSimilarity.length,
      chunks_after_quality_filter: qualityChunks.length,
      quality_threshold_applied: appliedThreshold,
      quality_threshold_relaxed: appliedThreshold !== baseQualityThreshold,
      chunks_filtered_by_quality:
        chunksWithSimilarity.length - qualityChunks.length,
      used_diversity: topKChunks === diverseChunks,
      final_avg_similarity:
        topKChunks.length > 0
          ? topKChunks.reduce((acc, chunk) => acc + chunk.similarity, 0) /
            topKChunks.length
          : 0,
      hybrid_search_metrics: {
        alpha_used: optimalAlpha,
        semantic_weight_percent: Math.round(optimalAlpha * 100),
        bm25_weight_percent: Math.round((1 - optimalAlpha) * 100),
        final_sources_distribution: {
          semantic: topKChunks.filter((c) => c.source === "semantic").length,
          bm25: topKChunks.filter((c) => c.source === "bm25").length,
          both: topKChunks.filter((c) => c.source === "both").length,
        },
        avg_hybrid_score:
          topKChunks.length > 0
            ? topKChunks.reduce(
                (acc, chunk) => acc + (chunk.hybridScore || 0),
                0
              ) / topKChunks.length
            : 0,
        avg_semantic_score:
          topKChunks.length > 0
            ? topKChunks.reduce(
                (acc, chunk) => acc + (chunk.semanticScore || 0),
                0
              ) / topKChunks.length
            : 0,
        avg_bm25_score:
          topKChunks.length > 0
            ? topKChunks.reduce(
                (acc, chunk) => acc + (chunk.bm25Score || 0),
                0
              ) / topKChunks.length
            : 0,
      },
      reranking_metrics: rerankingMetrics,
      context_tokens_estimated: topKChunks.reduce(
        (acc, chunk) => acc + chunk.content.length,
        0
      ),
      timestamp: new Date().toISOString(),
    });

    // add the chunks to the last user message
    messages.push({
      role: "user",
      content: [
        ...recentMessage.content,
        {
          type: "text",
          text: `Here is some relevant information that you can use to answer the question. Respond as if you are the business owner.`,
        },
        ...finalTopKChunks.map((chunk: any) => ({
          type: "text" as const,
          text: chunk.content,
        })),
      ],
    });

    return { ...params, prompt: messages };
  },
};
