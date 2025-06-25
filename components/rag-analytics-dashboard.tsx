"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AlertCircle } from "lucide-react";
import { fetcher } from "@/utils/functions";
import {
  TotalQueriesCard,
  SuccessRateCard,
  AvgResponseTimeCard,
  HighValueQueriesCard,
  QuestionTypesCard,
  RagSkipAnalysisCard,
  QuestionComplexityCard,
  ResponseTimeDistributionCard,
  ProcessingStepTimingCard,
  SuggestedQuestionsCard,
} from "@/components/analytics";

// API Response interfaces to match the actual API structure
interface ApiResponse<T> {
  success: boolean;
  data: T;
  metadata?: any;
  message?: string;
}

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

interface SuggestedQuestionsData {
  totalClicks: number;
  clicksByQuestion: Array<{
    question_id: string;
    question_text: string;
    click_count: number;
  }>;
  contextBreakdown: Array<{
    context: string;
    click_count: number;
  }>;
  dailyTrends: Array<{
    date: string;
    click_count: number;
  }>;
  topQuestions: Array<{
    question_id: string;
    question_text: string;
    click_count: number;
  }>;
  timeRange: string;
}

export function RagAnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState(24);

  // SWR hooks for data fetching
  const {
    data: analyticsResponse,
    error: analyticsError,
    isLoading: analyticsLoading,
    mutate: mutateAnalytics,
  } = useSWR<ApiResponse<AnalyticsData>>(
    `/api/analytics/rag-classification?hours=${timeRange}`,
    fetcher
  );

  const {
    data: performanceResponse,
    error: performanceError,
    isLoading: performanceLoading,
    mutate: mutatePerformance,
  } = useSWR<ApiResponse<PerformanceData>>(
    `/api/analytics/rag-performance?hours=${timeRange}`,
    fetcher
  );

  const {
    data: suggestedQuestionsResponse,
    error: suggestedQuestionsError,
    isLoading: suggestedQuestionsLoading,
    mutate: mutateSuggestedQuestions,
  } = useSWR<ApiResponse<SuggestedQuestionsData>>(
    `/api/analytics/suggested-questions?hours=${timeRange}`,
    fetcher
  );

  // Extract data from API responses
  const analyticsData = analyticsResponse?.data;
  const performanceData = performanceResponse?.data;
  const suggestedQuestionsData = suggestedQuestionsResponse?.data;

  const loading =
    analyticsLoading || performanceLoading || suggestedQuestionsLoading;
  const error = analyticsError || performanceError || suggestedQuestionsError;

  const refreshData = () => {
    mutateAnalytics();
    mutatePerformance();
    mutateSuggestedQuestions();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-12" />
          <Skeleton className="h-8 w-12" />
          <Skeleton className="h-8 w-12" />
          <Skeleton className="h-8 w-12" />
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
          <span className="text-red-700">
            Error loading analytics:{" "}
            {error.message || "An unknown error occurred"}
          </span>
          <Button
            onClick={refreshData}
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
    performanceData?.successRate?.find((r) => r.success === "success")?.count ||
    0;
  const skippedQueries =
    performanceData?.successRate?.find((r) => r.success === "skipped")?.count ||
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
            onClick={refreshData}
            variant="outline"
            size="sm"
          >
            Refresh
          </Button>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <TotalQueriesCard
            totalQueries={totalQueries}
            timeRange={timeRange}
          />
          <SuccessRateCard
            successfulQueries={successfulQueries}
            skippedQueries={skippedQueries}
          />
          <AvgResponseTimeCard
            avgDuration={performanceData?.performance?.[0]?.avg_duration}
          />
          <HighValueQueriesCard
            classifications={analyticsData?.classification}
          />
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs
          defaultValue="business"
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="business">Business Intelligence</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="engagement">User Engagement</TabsTrigger>
          </TabsList>

          <TabsContent
            value="business"
            className="space-y-4"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <QuestionTypesCard
                classifications={analyticsData?.classification}
              />
              <RagSkipAnalysisCard skipReasons={analyticsData?.skipReasons} />
              <QuestionComplexityCard
                complexityData={analyticsData?.complexity}
              />
            </div>
          </TabsContent>

          <TabsContent
            value="performance"
            className="space-y-4"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ResponseTimeDistributionCard
                performance={performanceData?.performance?.[0]}
              />
              <ProcessingStepTimingCard
                stepTiming={performanceData?.stepTiming}
              />
            </div>
          </TabsContent>

          <TabsContent
            value="engagement"
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4">
              <SuggestedQuestionsCard
                totalClicks={suggestedQuestionsData?.totalClicks}
                topQuestions={suggestedQuestionsData?.topQuestions}
                contextBreakdown={suggestedQuestionsData?.contextBreakdown}
                timeRange={timeRange}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
