"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertCircle,
  TrendingUp,
  Users,
  Zap,
  Clock,
  Target,
  HelpCircle,
} from "lucide-react";

interface AnalyticsData {
  classification: Array<{
    classification_type: string;
    count: number;
    avg_confidence: number;
    high_confidence_count: number;
  }>;
  skipReasons: Array<{
    reason: string;
    count: number;
  }>;
  complexity: Array<{
    complexity: string;
    count: number;
  }>;
  totalQueries: number;
  timeRange: string;
}

interface PerformanceData {
  performance: Array<{
    avg_duration: number;
    p50_duration: number;
    p95_duration: number;
    p99_duration: number;
    total_requests: number;
  }>;
  stepTiming: Array<{
    step: string;
    avg_duration: number;
    p95_duration: number;
    count: number;
  }>;
  successRate: Array<{
    success: string;
    count: number;
  }>;
  timeRange: string;
}

export function RagAnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [performanceData, setPerformanceData] =
    useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(24);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [analyticsResponse, performanceResponse] = await Promise.all([
        fetch(`/api/analytics/rag-classification?hours=${timeRange}`),
        fetch(`/api/analytics/rag-performance?hours=${timeRange}`),
      ]);

      if (!analyticsResponse.ok || !performanceResponse.ok) {
        throw new Error("Failed to fetch analytics data");
      }

      const analyticsResult = await analyticsResponse.json();
      const performanceResult = await performanceResponse.json();

      setAnalyticsData(analyticsResult.data);
      setPerformanceData(performanceResult.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const getQuestionTypeColor = (type: string) => {
    const colors = {
      "product-service-inquiry": "bg-blue-100 text-blue-800",
      "pricing-cost-question": "bg-green-100 text-green-800",
      "location-hours-contact": "bg-purple-100 text-purple-800",
      "booking-appointment": "bg-orange-100 text-orange-800",
      "support-help-question": "bg-red-100 text-red-800",
      "company-about-info": "bg-indigo-100 text-indigo-800",
      "general-inquiry": "bg-gray-100 text-gray-800",
      "casual-statement": "bg-yellow-100 text-yellow-800",
      other: "bg-slate-100 text-slate-800",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getBusinessValue = (type: string) => {
    const values = {
      "product-service-inquiry": "High",
      "pricing-cost-question": "Very High",
      "location-hours-contact": "High",
      "booking-appointment": "Very High",
      "support-help-question": "Medium",
      "company-about-info": "Medium",
      "general-inquiry": "Medium",
      "casual-statement": "Low",
      other: "Low",
    };
    return values[type as keyof typeof values] || "Unknown";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="flex items-center gap-2 p-6">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-700">Error loading analytics: {error}</span>
          <Button
            onClick={fetchData}
            variant="outline"
            size="sm"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const totalQueries = analyticsData?.totalQueries || 0;
  const successfulQueries =
    performanceData?.successRate.find((r) => r.success === "success")?.count ||
    0;
  const skippedQueries =
    performanceData?.successRate.find((r) => r.success === "skipped")?.count ||
    0;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Time Range Selector */}
        <div className="flex gap-2">
          {[24, 168, 720].map((hours) => (
            <Button
              key={hours}
              variant={timeRange === hours ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(hours)}
            >
              {hours === 24 ? "24h" : hours === 168 ? "7d" : "30d"}
            </Button>
          ))}
          <Button
            onClick={fetchData}
            variant="outline"
            size="sm"
          >
            Refresh
          </Button>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">
                  Total Queries
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>
                      Total number of chat messages processed by your RAG system
                      in the selected time period. This includes both successful
                      RAG responses and queries that were skipped.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQueries}</div>
              <p className="text-xs text-muted-foreground">Last {timeRange}h</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">
                  Success Rate
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>
                      Percentage of queries that successfully used RAG
                      processing vs those that were skipped. Higher rates
                      indicate better RAG engagement and relevance detection.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalQueries > 0
                  ? Math.round(
                      (successfulQueries /
                        (successfulQueries + skippedQueries)) *
                        100
                    )
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">
                RAG engagement rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">
                  Avg Response Time
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>
                      Average time taken for complete RAG processing pipeline
                      from query classification to final response generation.
                      Lower is better for user experience.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performanceData?.performance[0]?.avg_duration
                  ? (
                      performanceData.performance[0].avg_duration / 1000
                    ).toFixed(2) + "s"
                  : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                End-to-end processing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">
                  High Value Queries
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>
                      Number of queries identified as high business value
                      (product inquiries, pricing questions, booking requests).
                      These represent potential conversion opportunities.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData?.classification
                  .filter((c) =>
                    [
                      "product-service-inquiry",
                      "pricing-cost-question",
                      "booking-appointment",
                    ].includes(c.classification_type)
                  )
                  .reduce((sum, c) => sum + c.count, 0) || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Conversion opportunities
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs
          defaultValue="business"
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="business">Business Intelligence</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent
            value="business"
            className="space-y-4"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Question Classification */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle>Question Types</CardTitle>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p>
                          AI-powered classification of user queries by intent
                          and business value. Focus on high-value types for
                          conversion optimization.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <CardDescription>
                    What are visitors asking about? Focus on high-value question
                    types.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analyticsData?.classification.map((item) => (
                      <div
                        key={item.classification_type}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            className={getQuestionTypeColor(
                              item.classification_type
                            )}
                          >
                            {item.classification_type.replace("-", " ")}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-xs"
                          >
                            {getBusinessValue(item.classification_type)} Value
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{item.count}</div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {Math.round(item.avg_confidence * 100)}% conf
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-sm">
                                <p>
                                  Average confidence score for this
                                  classification type. Higher confidence
                                  indicates more accurate categorization.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Skip Reasons */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle>RAG Skip Analysis</CardTitle>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p>
                          Reasons why queries bypass RAG processing. Common
                          reasons include simple greetings, unclear queries, or
                          off-topic questions that don't benefit from knowledge
                          retrieval.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <CardDescription>
                    Why are queries not using RAG? Optimization opportunities.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analyticsData?.skipReasons.map((item) => (
                      <div
                        key={item.reason}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {item.reason.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="font-semibold">{item.count}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Complexity Distribution */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle>Question Complexity</CardTitle>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p>
                          Distribution of query complexity levels. Complex
                          questions typically require more processing time and
                          knowledge retrieval steps, while simple questions can
                          be answered more quickly.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <CardDescription>
                    Simple vs complex questions - impacts response quality and
                    processing time.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    {analyticsData?.complexity.map((item) => (
                      <div
                        key={item.complexity}
                        className="flex-1 flex items-center justify-between gap-4 text-center"
                      >
                        <Badge variant="secondary">
                          {item.complexity} Questions
                        </Badge>
                        <div className="text-2xl font-bold">{item.count}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent
            value="performance"
            className="space-y-4"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Performance Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Response Time Distribution</CardTitle>
                  <CardDescription>
                    End-to-end RAG processing performance metrics.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {performanceData?.performance[0] && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          Average
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm">
                              <p>Mean response time across all RAG requests</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="text-lg font-semibold">
                          {(
                            performanceData.performance[0].avg_duration / 1000
                          ).toFixed(2)}
                          s
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          P95
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm">
                              <p>
                                95% of requests complete faster than this time.
                                Useful for identifying worst-case performance.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="text-lg font-semibold">
                          {(
                            performanceData.performance[0].p95_duration / 1000
                          ).toFixed(2)}
                          s
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          P50
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm">
                              <p>
                                Median response time - 50% of requests are
                                faster, 50% are slower. Less affected by
                                outliers than average.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="text-lg font-semibold">
                          {(
                            performanceData.performance[0].p50_duration / 1000
                          ).toFixed(2)}
                          s
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          P99
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm">
                              <p>
                                99% of requests complete faster than this time.
                                Represents the slowest 1% of requests.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="text-lg font-semibold">
                          {(
                            performanceData.performance[0].p99_duration / 1000
                          ).toFixed(2)}
                          s
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Step Timing Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Processing Step Timing</CardTitle>
                  <CardDescription>
                    Which steps take the most time? Optimization targets.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {performanceData?.stepTiming
                      .sort((a, b) => b.avg_duration - a.avg_duration)
                      .map((step) => {
                        const getStepTooltip = (stepName: string) => {
                          const tooltips = {
                            classification:
                              "Determines if the query requires RAG processing based on content analysis",
                            hyde: "Hypothetical Document Embeddings - generates expected answer to improve retrieval",
                            embedding:
                              "Converts query text into vector embeddings for similarity search",
                            retrieval:
                              "Searches knowledge base for relevant documents using embeddings",
                            similarity_ranking:
                              "Ranks retrieved documents by relevance to the query",
                            quality_filtering:
                              "Filters out low-quality or irrelevant retrieved content",
                            diversity:
                              "Ensures retrieved content covers different aspects of the query",
                          };
                          return (
                            tooltips[stepName as keyof typeof tooltips] ||
                            "RAG processing step"
                          );
                        };

                        return (
                          <div
                            key={step.step}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="capitalize"
                              >
                                {step.step.replace("_", " ")}
                              </Badge>
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-sm">
                                  <p>{getStepTooltip(step.step)}</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">
                                {(step.avg_duration / 1000).toFixed(3)}s
                              </div>
                              <div className="text-xs text-muted-foreground">
                                P95: {(step.p95_duration / 1000).toFixed(3)}s
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
