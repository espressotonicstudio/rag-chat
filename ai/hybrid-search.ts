import { BM25Search } from "./bm25-search";
import { Chunk } from "@/schema";

interface SemanticResult {
  chunk: Chunk;
  similarity: number;
  rank: number;
}

interface HybridResult {
  chunk: Chunk;
  hybridScore: number;
  semanticScore: number;
  bm25Score: number;
  rank: number;
  source: "semantic" | "bm25" | "both";
}

interface HybridSearchConfig {
  alpha: number; // Weight for semantic vs BM25 (0 = pure BM25, 1 = pure semantic)
  topK: number;
  semanticThreshold: number; // Minimum similarity score for semantic results
  bm25Threshold: number; // Minimum BM25 score for keyword results
  enableAdaptiveWeighting: boolean;
}

export class HybridSearch {
  private bm25: BM25Search;
  private config: HybridSearchConfig;

  constructor(config: Partial<HybridSearchConfig> = {}) {
    this.bm25 = new BM25Search();
    this.config = {
      alpha: 0.7, // Default: favor semantic search slightly
      topK: 10,
      semanticThreshold: 0.3,
      bm25Threshold: 0.1,
      enableAdaptiveWeighting: true,
      ...config,
    };
  }

  /**
   * Detects query type and adjusts weighting accordingly
   */
  private getAdaptiveAlpha(query: string): number {
    if (!this.config.enableAdaptiveWeighting) return this.config.alpha;

    const lowercaseQuery = query.toLowerCase();

    // Rules for adjusting alpha based on query characteristics
    let alpha = this.config.alpha;

    // Favor keyword search for:
    if (
      // Queries with exact terms, codes, or IDs
      /\b[A-Z]{2,}\b|\b\d{2,}\b|[\w\-\.]+@[\w\-\.]+/.test(query) ||
      // Queries with quotes (exact phrases)
      /"[^"]*"/.test(query) ||
      // Short queries (often specific terms)
      query.split(" ").length <= 2 ||
      // Queries with technical terms
      /\b(api|endpoint|function|method|class|interface)\b/i.test(query)
    ) {
      alpha = Math.max(0.3, alpha - 0.3); // Increase BM25 weight
    }

    // Favor semantic search for:
    if (
      // Long, natural language questions
      query.split(" ").length >= 6 ||
      // Questions starting with question words
      /^(what|how|why|when|where|who|which|can|should|would|could|is|are|does|do)\b/i.test(
        query
      ) ||
      // Conceptual queries
      /\b(concept|principle|idea|theory|approach|strategy)\b/i.test(query)
    ) {
      alpha = Math.min(0.9, alpha + 0.2); // Increase semantic weight
    }

    return alpha;
  }

  /**
   * Normalizes scores to 0-1 range using min-max normalization
   */
  private normalizeScores(scores: number[]): number[] {
    if (scores.length === 0) return [];

    const min = Math.min(...scores);
    const max = Math.max(...scores);

    if (max === min) return scores.map(() => 1); // All scores are equal

    return scores.map((score) => (score - min) / (max - min));
  }

  /**
   * Performs hybrid search combining semantic and BM25 results
   */
  search(
    query: string,
    chunks: Chunk[],
    semanticResults: SemanticResult[]
  ): HybridResult[] {
    if (!chunks.length) return [];

    console.log(`[HYBRID] Starting hybrid search for query: "${query}"`);
    console.log(
      `[HYBRID] Available chunks: ${chunks.length}, semantic results: ${semanticResults.length}`
    );

    // Get adaptive alpha for this query
    const alpha = this.getAdaptiveAlpha(query);
    console.log(
      `[HYBRID] Adaptive alpha calculated: ${alpha.toFixed(3)} (${Math.round(
        alpha * 100
      )}% semantic, ${Math.round((1 - alpha) * 100)}% BM25)`
    );

    // Get BM25 results
    console.log(
      `[HYBRID] Getting BM25 results (requesting top ${
        this.config.topK * 2
      })...`
    );
    const bm25Results = this.bm25.search(query, chunks, this.config.topK * 2);

    // Create maps for quick lookup
    const semanticMap = new Map<string, SemanticResult>();
    const bm25Map = new Map<string, { score: number; rank: number }>();

    let semanticFiltered = 0;
    semanticResults.forEach((result) => {
      if (result.similarity >= this.config.semanticThreshold) {
        semanticMap.set(result.chunk.id, result);
      } else {
        semanticFiltered++;
      }
    });

    let bm25Filtered = 0;
    bm25Results.forEach((result) => {
      if (result.score >= this.config.bm25Threshold) {
        bm25Map.set(result.chunk.id, {
          score: result.score,
          rank: result.rank,
        });
      } else {
        bm25Filtered++;
      }
    });

    console.log(
      `[HYBRID] Filtered results: semantic ${semanticMap.size}/${semanticResults.length} (${semanticFiltered} below threshold), BM25 ${bm25Map.size}/${bm25Results.length} (${bm25Filtered} below threshold)`
    );
    console.log(
      `[HYBRID] Thresholds: semantic >= ${this.config.semanticThreshold}, BM25 >= ${this.config.bm25Threshold}`
    );

    // Get all unique chunk IDs
    const allChunkIds = new Set([
      ...Array.from(semanticMap.keys()),
      ...Array.from(bm25Map.keys()),
    ]);

    // Collect all scores for normalization
    const allSemanticScores = Array.from(semanticMap.values()).map(
      (r) => r.similarity
    );
    const allBm25Scores = Array.from(bm25Map.values()).map((r) => r.score);

    // Normalize scores
    const normalizedSemanticScores = this.normalizeScores(allSemanticScores);
    const normalizedBm25Scores = this.normalizeScores(allBm25Scores);

    // Create normalized score maps
    const semanticScoreMap = new Map<string, number>();
    const bm25ScoreMap = new Map<string, number>();

    Array.from(semanticMap.entries()).forEach(([id, result], index) => {
      semanticScoreMap.set(id, normalizedSemanticScores[index] || 0);
    });

    Array.from(bm25Map.entries()).forEach(([id, result], index) => {
      bm25ScoreMap.set(id, normalizedBm25Scores[index] || 0);
    });

    // Calculate hybrid scores
    const hybridResults: HybridResult[] = [];

    allChunkIds.forEach((chunkId) => {
      const semanticScore = semanticScoreMap.get(chunkId) || 0;
      const bm25Score = bm25ScoreMap.get(chunkId) || 0;

      // Hybrid score calculation: H = α * semantic + (1-α) * bm25
      const hybridScore = alpha * semanticScore + (1 - alpha) * bm25Score;

      // Determine source
      let source: "semantic" | "bm25" | "both";
      if (semanticScore > 0 && bm25Score > 0) {
        source = "both";
      } else if (semanticScore > 0) {
        source = "semantic";
      } else {
        source = "bm25";
      }

      // Get the chunk
      const chunk =
        semanticMap.get(chunkId)?.chunk || chunks.find((c) => c.id === chunkId);

      if (chunk && hybridScore > 0) {
        hybridResults.push({
          chunk,
          hybridScore,
          semanticScore: semanticMap.get(chunkId)?.similarity || 0,
          bm25Score: bm25Map.get(chunkId)?.score || 0,
          rank: 0, // Will be set after sorting
          source,
        });
      }
    });

    // Sort by hybrid score and assign ranks
    hybridResults.sort((a, b) => b.hybridScore - a.hybridScore);
    hybridResults.forEach((result, index) => {
      result.rank = index + 1;
    });

    const finalResults = hybridResults.slice(0, this.config.topK);

    // Log fusion results
    const sourceStats = {
      semantic: finalResults.filter((r) => r.source === "semantic").length,
      bm25: finalResults.filter((r) => r.source === "bm25").length,
      both: finalResults.filter((r) => r.source === "both").length,
    };

    console.log(
      `[HYBRID] Fusion complete. Final results: ${finalResults.length}/${this.config.topK}`
    );
    console.log(
      `[HYBRID] Source distribution: ${sourceStats.semantic} semantic-only, ${sourceStats.bm25} BM25-only, ${sourceStats.both} both`
    );
    console.log(
      `[HYBRID] Top 3 results:`,
      finalResults.slice(0, 3).map((r) => ({
        rank: r.rank,
        hybridScore: r.hybridScore.toFixed(4),
        semanticScore: r.semanticScore.toFixed(4),
        bm25Score: r.bm25Score.toFixed(4),
        source: r.source,
        preview: r.chunk.content.substring(0, 60) + "...",
      }))
    );

    return finalResults;
  }

  /**
   * Gets debug information about the hybrid search
   */
  getDebugInfo(query: string, chunks: Chunk[]) {
    const alpha = this.getAdaptiveAlpha(query);
    const bm25Debug = this.bm25.getDebugInfo(query);

    return {
      config: this.config,
      adaptiveAlpha: alpha,
      query: {
        original: query,
        length: query.split(" ").length,
        hasQuotes: /"[^"]*"/.test(query),
        hasExactTerms: /\b[A-Z]{2,}\b|\b\d{2,}\b/.test(query),
      },
      bm25Debug,
    };
  }

  /**
   * Updates configuration
   */
  updateConfig(newConfig: Partial<HybridSearchConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
}
