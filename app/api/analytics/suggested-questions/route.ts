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
    const hours = parseInt(searchParams.get("hours") || "168"); // Default to 7 days (168 hours)
    const dataset = process.env.AXIOM_DATASET!;

    // Query for total clicks and context breakdown
    const totalClicksQuery = `
      ['${dataset}']
      | where _time > ago(${hours}h)
      | where message == "suggested_question_click"
      | where isnotnull(['fields.question_id'])
      | project context = ['fields.context'], question_id = ['fields.question_id'], _time
      | summarize
          total_clicks = count(),
          chat_interface_clicks = countif(context == "chat_interface"),
          management_interface_clicks = countif(context == "management_interface")
    `;

    // Query for clicks by individual questions
    const clicksByQuestionQuery = `
      ['${dataset}']
      | where _time > ago(${hours}h)
      | where message == "suggested_question_click"
      | where isnotnull(['fields.question_id'])
      | project question_id = ['fields.question_id'], question_text = ['fields.question_text'], context = ['fields.context'], _time
      | summarize
          click_count = count(),
          unique_contexts = dcount(context),
          last_clicked = max(_time)
        by question_id, question_text
      | order by click_count desc
      | limit 20
    `;

    // Query for daily click trends
    const dailyTrendsQuery = `
      ['${dataset}']
      | where _time > ago(${hours}h)
      | where message == "suggested_question_click"
      | where isnotnull(['fields.question_id'])
      | project day = bin(_time, 1d), context = ['fields.context'], _time
      | summarize
          total_clicks = count(),
          chat_clicks = countif(context == "chat_interface")
        by day
      | order by day asc
    `;

    // Query for context breakdown over time
    const contextBreakdownQuery = `
      ['${dataset}']
      | where _time > ago(${hours}h)
      | where message == "suggested_question_click"
      | where isnotnull(['fields.context'])
      | project context = ['fields.context'], _time
      | summarize click_count = count() by context
      | order by click_count desc
    `;

    const [
      totalClicksResult,
      clicksByQuestionResult,
      dailyTrendsResult,
      contextBreakdownResult,
    ] = await Promise.all([
      axiomQueryClient.query(totalClicksQuery),
      axiomQueryClient.query(clicksByQuestionQuery),
      axiomQueryClient.query(dailyTrendsQuery),
      axiomQueryClient.query(contextBreakdownQuery),
    ]);

    // Helper function to extract aggregation value by operation name
    const getAggregationValue = (
      aggregations: any[],
      opName: string
    ): number => {
      const agg = aggregations?.find((a: any) => a.op === opName);
      return agg?.value || 0;
    };

    // Extract total clicks data
    const totalClicksData = totalClicksResult.buckets?.totals?.[0] || {};
    const totalClicks = getAggregationValue(
      (totalClicksData as any)?.aggregations || [],
      "total_clicks"
    );
    const chatInterfaceClicks = getAggregationValue(
      (totalClicksData as any)?.aggregations || [],
      "chat_interface_clicks"
    );
    const managementInterfaceClicks = getAggregationValue(
      (totalClicksData as any)?.aggregations || [],
      "management_interface_clicks"
    );

    // Extract clicks by question data
    const clicksByQuestionData =
      clicksByQuestionResult.buckets?.totals?.map((bucket: any) => ({
        question_id: bucket.group?.question_id || "unknown",
        question_text: bucket.group?.question_text || "Unknown Question",
        click_count: getAggregationValue(bucket.aggregations, "click_count"),
        unique_contexts: getAggregationValue(
          bucket.aggregations,
          "unique_contexts"
        ),
        last_clicked: bucket.group?.last_clicked || null,
      })) || [];

    // Extract daily trends data
    const dailyTrendsData =
      dailyTrendsResult.buckets?.totals?.map((bucket: any) => ({
        date: bucket.group?.day || null,
        total_clicks: getAggregationValue(bucket.aggregations, "total_clicks"),
        chat_clicks: getAggregationValue(bucket.aggregations, "chat_clicks"),
      })) || [];

    // Extract context breakdown data
    const contextBreakdownData =
      contextBreakdownResult.buckets?.totals?.map((bucket: any) => ({
        context: bucket.group?.context || "unknown",
        click_count: getAggregationValue(bucket.aggregations, "click_count"),
      })) || [];

    // Create clicksByContext object for backward compatibility
    const clicksByContext = contextBreakdownData.reduce((acc, item) => {
      acc[item.context] = item.click_count;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      data: {
        timeRange: `${hours} hours`,
        totalClicks: totalClicks,
        clicksByQuestion: clicksByQuestionData,
        clicksByContext: clicksByContext,
        dailyClicks: dailyTrendsData,
        topQuestions: clicksByQuestionData.slice(0, 10), // Top 10 most clicked
        contextBreakdown: contextBreakdownData,
      },
      metadata: {
        totalClicksTotal: totalClicksResult.status?.rowsExamined || 0,
        clicksByQuestionTotal: clicksByQuestionResult.status?.rowsExamined || 0,
        dailyTrendsTotal: dailyTrendsResult.status?.rowsExamined || 0,
        contextBreakdownTotal: contextBreakdownResult.status?.rowsExamined || 0,
        dataset: dataset,
        bucketStructure: {
          totalClicksBuckets: totalClicksResult.buckets?.totals?.length || 0,
          clicksByQuestionBuckets:
            clicksByQuestionResult.buckets?.totals?.length || 0,
          dailyTrendsBuckets: dailyTrendsResult.buckets?.totals?.length || 0,
          contextBreakdownBuckets:
            contextBreakdownResult.buckets?.totals?.length || 0,
        },
      },
    });
  } catch (error) {
    console.error("Suggested Questions Analytics API error:", error);

    // Check if it's a field not found error, which indicates no data exists
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("field") && errorMessage.includes("not found")) {
      return NextResponse.json({
        success: true,
        data: {
          timeRange: `168 hours`,
          totalClicks: 0,
          clicksByQuestion: [],
          clicksByContext: {},
          dailyClicks: [],
          topQuestions: [],
          contextBreakdown: [],
        },
        metadata: {
          totalClicksTotal: 0,
          clicksByQuestionTotal: 0,
          dailyTrendsTotal: 0,
          contextBreakdownTotal: 0,
          dataset: process.env.AXIOM_DATASET,
        },
        message:
          "No suggested question click data found in the specified time range. Data will appear after users click on suggested questions in the chat interface.",
      });
    }

    return NextResponse.json(
      {
        error: "Failed to fetch suggested questions analytics data",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.apiKey) {
    return Response.json("Unauthorized", { status: 401 });
  }

  const { questionId, questionText, context } = await request.json();

  // This would typically log to your analytics system
  // In your case, this will be handled by the Axiom tracking
  // so this endpoint might not be needed, but could be useful
  // for server-side tracking or additional processing

  return Response.json({ success: true });
}
