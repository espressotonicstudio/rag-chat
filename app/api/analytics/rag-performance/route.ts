import { NextRequest, NextResponse } from "next/server";
import { axiomQueryClient } from "@/lib/axiom/axiom";
import { auth } from "@/app/(auth)/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get("hours") || "24");
    const dataset = process.env.AXIOM_DATASET!;

    // Query for overall pipeline performance
    const performanceQuery = `
      ['${dataset}']
      | where _time > ago(${hours}h)
      | where message == "rag_middleware_complete"
      | where isnotnull(['fields.total_duration_ms'])
      | project total_duration_ms = ['fields.total_duration_ms'], _time
      | summarize
          avg_duration = avg(total_duration_ms),
          p50_duration = percentile(total_duration_ms, 50),
          p95_duration = percentile(total_duration_ms, 95),
          p99_duration = percentile(total_duration_ms, 99),
          total_requests = count()
    `;

    // Query for step-by-step timing breakdown
    const stepTimingQuery = `
      ['${dataset}']
      | where _time > ago(${hours}h)
      | where message in ("rag_classification_complete", "rag_hyde_complete", "rag_embedding_complete", "rag_retrieval_complete", "rag_similarity_ranking_complete", "rag_quality_filtering_complete", "rag_diversity_complete")
      | where isnotnull(['fields.duration_ms'])
      | project step = case(
          message == "rag_classification_complete", "classification",
          message == "rag_hyde_complete", "hyde",
          message == "rag_embedding_complete", "embedding",
          message == "rag_retrieval_complete", "retrieval",
          message == "rag_similarity_ranking_complete", "similarity_ranking",
          message == "rag_quality_filtering_complete", "quality_filtering",
          message == "rag_diversity_complete", "diversity",
          "unknown"
        ), ['fields.duration_ms'], _time
      | summarize
          avg_duration = avg(['fields.duration_ms']),
          p95_duration = percentile(['fields.duration_ms'], 95),
          count = count()
        by step
      | order by avg_duration desc
    `;

    // Query for success/failure rates
    const successRateQuery = `
      ['${dataset}']
      | where _time > ago(${hours}h)
      | where message in ("rag_middleware_complete", "rag_middleware_skip")
      | project success = case(message == "rag_middleware_complete", "success", "skipped"), _time
      | where isnotnull(success)
      | summarize count = count() by success
    `;

    const [performanceResult, stepTimingResult, successRateResult] =
      await Promise.all([
        axiomQueryClient.query(performanceQuery),
        axiomQueryClient.query(stepTimingQuery),
        axiomQueryClient.query(successRateQuery),
      ]);

    // Helper function to extract aggregation value by operation name
    const getAggregationValue = (
      aggregations: any[],
      opName: string
    ): number => {
      const agg = aggregations?.find((a: any) => a.op === opName);
      return agg?.value || 0;
    };

    // Extract data from buckets.totals instead of matches
    const performanceData =
      performanceResult.buckets?.totals?.map((bucket: any) => ({
        avg_duration: getAggregationValue(bucket.aggregations, "avg_duration"),
        p50_duration: getAggregationValue(bucket.aggregations, "p50_duration"),
        p95_duration: getAggregationValue(bucket.aggregations, "p95_duration"),
        p99_duration: getAggregationValue(bucket.aggregations, "p99_duration"),
        total_requests: getAggregationValue(
          bucket.aggregations,
          "total_requests"
        ),
      })) || [];

    const stepTimingData =
      stepTimingResult.buckets?.totals?.map((bucket: any) => ({
        step: bucket.group?.step || "unknown",
        avg_duration: getAggregationValue(bucket.aggregations, "avg_duration"),
        p95_duration: getAggregationValue(bucket.aggregations, "p95_duration"),
        count: getAggregationValue(bucket.aggregations, "count"),
      })) || [];

    const successRateData =
      successRateResult.buckets?.totals?.map((bucket: any) => ({
        success: bucket.group?.success || "unknown",
        count: getAggregationValue(bucket.aggregations, "count"),
      })) || [];

    return NextResponse.json({
      success: true,
      data: {
        timeRange: `${hours} hours`,
        performance: performanceData,
        stepTiming: stepTimingData,
        successRate: successRateData,
      },
      metadata: {
        performanceTotal: performanceResult.status?.rowsExamined || 0,
        stepTimingTotal: stepTimingResult.status?.rowsExamined || 0,
        successRateTotal: successRateResult.status?.rowsExamined || 0,
        dataset: dataset,
        // Add debug info to understand the structure
        bucketStructure: {
          performanceBuckets: performanceResult.buckets?.totals?.length || 0,
          stepTimingBuckets: stepTimingResult.buckets?.totals?.length || 0,
          successRateBuckets: successRateResult.buckets?.totals?.length || 0,
        },
      },
    });
  } catch (error) {
    console.error("Performance analytics API error:", error);

    // Check if it's a field not found error, which indicates no data exists
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("field") && errorMessage.includes("not found")) {
      return NextResponse.json({
        success: true,
        data: {
          timeRange: `24 hours`,
          performance: [],
          stepTiming: [],
          successRate: [],
        },
        metadata: {
          performanceTotal: 0,
          stepTimingTotal: 0,
          successRateTotal: 0,
          dataset: process.env.AXIOM_DATASET,
        },
        message:
          "No RAG performance data found in the specified time range. Data will appear after users interact with the chat system.",
      });
    }

    return NextResponse.json(
      {
        error: "Failed to fetch performance analytics data",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
