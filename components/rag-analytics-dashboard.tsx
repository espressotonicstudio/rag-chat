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
  AlertCircle,
  TrendingUp,
  Users,
  Zap,
  Clock,
  Target,
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
            <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQueries}</div>
            <p className="text-xs text-muted-foreground">Last {timeRange}h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalQueries > 0
                ? Math.round(
                    (successfulQueries / (successfulQueries + skippedQueries)) *
                      100
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">RAG engagement rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Response Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceData?.performance[0]?.avg_duration
                ? Math.round(performanceData.performance[0].avg_duration) + "ms"
                : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              End-to-end processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              High Value Queries
            </CardTitle>
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
                <CardTitle>Question Types</CardTitle>
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
                        <div className="text-xs text-muted-foreground">
                          {Math.round(item.avg_confidence * 100)}% conf
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
                <CardTitle>RAG Skip Analysis</CardTitle>
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
          </div>

          {/* Complexity Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Question Complexity</CardTitle>
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
                    className="flex-1 text-center"
                  >
                    <div className="text-2xl font-bold">{item.count}</div>
                    <div className="text-sm text-muted-foreground capitalize">
                      {item.complexity} Questions
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
                      <div className="text-sm text-muted-foreground">
                        Average
                      </div>
                      <div className="text-lg font-semibold">
                        {Math.round(
                          performanceData.performance[0].avg_duration
                        )}
                        ms
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">P95</div>
                      <div className="text-lg font-semibold">
                        {Math.round(
                          performanceData.performance[0].p95_duration
                        )}
                        ms
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">P50</div>
                      <div className="text-lg font-semibold">
                        {Math.round(
                          performanceData.performance[0].p50_duration
                        )}
                        ms
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">P99</div>
                      <div className="text-lg font-semibold">
                        {Math.round(
                          performanceData.performance[0].p99_duration
                        )}
                        ms
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
                    .map((step) => (
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
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {Math.round(step.avg_duration)}ms
                          </div>
                          <div className="text-xs text-muted-foreground">
                            P95: {Math.round(step.p95_duration)}ms
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
