import { WordTokenizer } from "natural";
// @ts-ignore - stopword module doesn't have types
import { removeStopwords, eng } from "stopword";
import { Chunk } from "@/schema";

interface BM25Result {
  chunk: Chunk;
  score: number;
  rank: number;
}

interface BM25Index {
  documents: Array<{
    id: string;
    tokens: string[];
    termFreq: Map<string, number>;
    docLength: number;
  }>;
  totalDocs: number;
  avgDocLength: number;
  termDocFreq: Map<string, number>; // How many documents contain each term
}

export class BM25Search {
  private tokenizer: WordTokenizer;
  private index: BM25Index | null = null;

  // BM25 parameters
  private readonly k1 = 1.2; // Controls term frequency saturation
  private readonly b = 0.75; // Controls length normalization

  constructor() {
    this.tokenizer = new WordTokenizer();
  }

  /**
   * Preprocesses text by tokenizing, removing stopwords, and stemming
   */
  private preprocessText(text: string): string[] {
    // Convert to lowercase and tokenize
    const tokens = this.tokenizer.tokenize(text.toLowerCase()) || [];

    // Remove stopwords
    const filtered = removeStopwords(tokens, eng);

    // Apply basic stemming (simplified for performance)
    const stemmed = filtered.map((token: string) => {
      // Simple stemming rules for common suffixes
      if (token.endsWith("ing")) return token.slice(0, -3);
      if (token.endsWith("ed")) return token.slice(0, -2);
      if (token.endsWith("es")) return token.slice(0, -2);
      if (token.endsWith("s") && token.length > 3) return token.slice(0, -1);
      return token;
    });

    return stemmed.filter((token: string) => token.length > 2); // Filter very short tokens
  }

  /**
   * Builds the BM25 index from chunks
   */
  buildIndex(chunks: Chunk[]): void {
    const documents = [];
    const termDocFreq = new Map<string, number>();
    let totalDocLength = 0;

    for (const chunk of chunks) {
      const tokens = this.preprocessText(chunk.content);
      const termFreq = new Map<string, number>();

      // Count term frequencies
      tokens.forEach((token) => {
        termFreq.set(token, (termFreq.get(token) || 0) + 1);
      });

      // Update document frequency for each unique term
      const uniqueTerms = new Set(tokens);
      uniqueTerms.forEach((term) => {
        termDocFreq.set(term, (termDocFreq.get(term) || 0) + 1);
      });

      documents.push({
        id: chunk.id,
        tokens,
        termFreq,
        docLength: tokens.length,
      });

      totalDocLength += tokens.length;
    }

    this.index = {
      documents,
      totalDocs: chunks.length,
      avgDocLength: totalDocLength / chunks.length,
      termDocFreq,
    };
  }

  /**
   * Calculates IDF (Inverse Document Frequency) for a term
   */
  private calculateIDF(term: string): number {
    if (!this.index) return 0;

    const docFreq = this.index.termDocFreq.get(term) || 0;
    if (docFreq === 0) return 0;

    // BM25 IDF formula: log((N - df + 0.5) / (df + 0.5))
    const N = this.index.totalDocs;
    return Math.log((N - docFreq + 0.5) / (docFreq + 0.5));
  }

  /**
   * Calculates BM25 score for a document given query terms
   */
  private calculateBM25Score(queryTerms: string[], docIndex: number): number {
    if (!this.index) return 0;

    const doc = this.index.documents[docIndex];
    let score = 0;

    queryTerms.forEach((term) => {
      const termFreq = doc.termFreq.get(term) || 0;
      if (termFreq === 0) return;

      const idf = this.calculateIDF(term);
      const docLength = doc.docLength;
      const avgDocLength = this.index!.avgDocLength;

      // BM25 formula
      const numerator = termFreq * (this.k1 + 1);
      const denominator =
        termFreq + this.k1 * (1 - this.b + this.b * (docLength / avgDocLength));

      score += idf * (numerator / denominator);
    });

    return score;
  }

  /**
   * Searches for chunks using BM25 scoring
   */
  search(query: string, chunks: Chunk[], topK: number = 10): BM25Result[] {
    if (!chunks.length) return [];

    // Build index if not exists or if chunks changed
    if (!this.index || this.index.totalDocs !== chunks.length) {
      console.log(`[BM25] Building index for ${chunks.length} chunks`);
      this.buildIndex(chunks);
    }

    if (!this.index) return [];

    const queryTerms = this.preprocessText(query);
    console.log(
      `[BM25] Query processed: "${query}" -> [${queryTerms.join(", ")}]`
    );

    if (queryTerms.length === 0) {
      console.log(`[BM25] No valid query terms found after preprocessing`);
      return [];
    }

    const results: Array<{ chunk: Chunk; score: number }> = [];
    let scoredDocuments = 0;
    let zeroScoreDocuments = 0;

    // Calculate BM25 score for each document
    this.index.documents.forEach((doc, index) => {
      const chunk = chunks.find((c) => c.id === doc.id);
      if (!chunk) return;

      const score = this.calculateBM25Score(queryTerms, index);
      if (score > 0) {
        results.push({ chunk, score });
        scoredDocuments++;
      } else {
        zeroScoreDocuments++;
      }
    });

    console.log(
      `[BM25] Scoring complete: ${scoredDocuments} documents scored > 0, ${zeroScoreDocuments} with zero scores`
    );

    // Sort by score (descending) and return top K with ranks
    results.sort((a, b) => b.score - a.score);

    const topResults = results.slice(0, topK).map((result, index) => ({
      ...result,
      rank: index + 1,
    }));

    console.log(
      `[BM25] Top ${Math.min(topK, topResults.length)} results:`,
      topResults.map((r) => ({
        rank: r.rank,
        score: r.score.toFixed(4),
        contentPreview: r.chunk.content.substring(0, 50) + "...",
      }))
    );

    return topResults;
  }

  /**
   * Gets debug information about the search
   */
  getDebugInfo(query: string): {
    queryTerms: string[];
    indexStats: {
      totalDocs: number;
      avgDocLength: number;
      vocabularySize: number;
    } | null;
  } {
    const queryTerms = this.preprocessText(query);

    const indexStats = this.index
      ? {
          totalDocs: this.index.totalDocs,
          avgDocLength: this.index.avgDocLength,
          vocabularySize: this.index.termDocFreq.size,
        }
      : null;

    return { queryTerms, indexStats };
  }
}
