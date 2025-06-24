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

    // Query for classification distribution - key BI metric
    const classificationQuery = `
      ['${dataset}']
      | where _time > ago(${hours}h)
      | where message == "rag_classification_complete"
      | where isnotnull(['fields.classification_type'])
      | project classification_type = ['fields.classification_type'], complexity = ['fields.complexity'], confidence = ['fields.confidence'], requires_context = ['fields.requires_context'], _time
      | summarize
          count = count(),
          avg_confidence = avg(confidence),
          high_confidence_count = countif(confidence > 0.8)
        by classification_type
      | order by count desc
    `;

    // Query for skip reasons - important for understanding when RAG isn't used
    const skipReasonQuery = `
      ['${dataset}']
      | where _time > ago(${hours}h)
      | where message == "rag_middleware_skip"
      | where isnotnull(['fields.reason'])
      | project reason = ['fields.reason'], _time
      | summarize count = count() by reason
      | order by count desc
    `;

    // Query for complexity distribution
    const complexityQuery = `
      ['${dataset}']
      | where _time > ago(${hours}h)
      | where message == "rag_classification_complete"
      | where isnotnull(['fields.complexity'])
      | project complexity = ['fields.complexity'], _time
      | summarize count = count() by complexity
    `;

    const [classificationResult, skipReasonResult, complexityResult] =
      await Promise.all([
        axiomQueryClient.query(classificationQuery),
        axiomQueryClient.query(skipReasonQuery),
        axiomQueryClient.query(complexityQuery),
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
    const classificationData =
      classificationResult.buckets?.totals?.map((bucket: any) => ({
        classification_type: bucket.group?.classification_type || "unknown",
        count: getAggregationValue(bucket.aggregations, "count"),
        avg_confidence: getAggregationValue(
          bucket.aggregations,
          "avg_confidence"
        ),
        high_confidence_count: getAggregationValue(
          bucket.aggregations,
          "high_confidence_count"
        ),
      })) || [];

    const skipReasonData =
      skipReasonResult.buckets?.totals?.map((bucket: any) => ({
        reason: bucket.group?.reason || "unknown",
        count: getAggregationValue(bucket.aggregations, "count"),
      })) || [];

    const complexityData =
      complexityResult.buckets?.totals?.map((bucket: any) => ({
        complexity: bucket.group?.complexity || "unknown",
        count: getAggregationValue(bucket.aggregations, "count"),
      })) || [];

    // Calculate total queries from classification data
    const totalQueries = classificationData.reduce(
      (sum, item) => sum + item.count,
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        timeRange: `${hours} hours`,
        classification: classificationData,
        skipReasons: skipReasonData,
        complexity: complexityData,
        totalQueries: totalQueries,
      },
      metadata: {
        classificationTotal: classificationResult.status?.rowsExamined || 0,
        skipReasonsTotal: skipReasonResult.status?.rowsExamined || 0,
        complexityTotal: complexityResult.status?.rowsExamined || 0,
        dataset: dataset,
        // Add debug info to understand the structure
        bucketStructure: {
          classificationBuckets:
            classificationResult.buckets?.totals?.length || 0,
          skipReasonBuckets: skipReasonResult.buckets?.totals?.length || 0,
          complexityBuckets: complexityResult.buckets?.totals?.length || 0,
        },
      },
    });
  } catch (error) {
    console.error("Analytics API error:", error);

    // Check if it's a field not found error, which indicates no data exists
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("field") && errorMessage.includes("not found")) {
      return NextResponse.json({
        success: true,
        data: {
          timeRange: `24 hours`,
          classification: [],
          skipReasons: [],
          complexity: [],
          totalQueries: 0,
        },
        metadata: {
          classificationTotal: 0,
          skipReasonsTotal: 0,
          complexityTotal: 0,
          dataset: process.env.AXIOM_DATASET,
        },
        message:
          "No RAG analytics data found in the specified time range. Data will appear after users interact with the chat system.",
      });
    }

    return NextResponse.json(
      { error: "Failed to fetch analytics data", details: errorMessage },
      { status: 500 }
    );
  }
}
