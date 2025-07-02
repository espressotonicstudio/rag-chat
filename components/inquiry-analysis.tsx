import { ChatAnalysis } from "@/schema";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  User,
  Target,
  ThumbsUp,
  ThumbsDown,
  ArrowUp,
  AlertCircle,
  Lightbulb,
  FileText,
  PlayCircle,
  Loader2,
  HelpCircle,
  ChartNetworkIcon,
} from "lucide-react";
import { useState } from "react";

const getStatusColor = (status: string) => {
  switch (status) {
    case "resolved":
      return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200 hover:text-green-900 transition-colors cursor-default";
    case "unresolved":
      return "bg-red-100 text-red-800 border-red-200 hover:bg-red-200 hover:text-red-900 transition-colors cursor-default";
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 hover:text-yellow-900 transition-colors cursor-default";
    case "aborted":
      return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 hover:text-gray-900 transition-colors cursor-default";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 hover:text-gray-900 transition-colors cursor-default";
  }
};

const getSentimentColor = (sentiment: string) => {
  switch (sentiment) {
    case "positive":
      return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200 hover:text-green-900 transition-colors cursor-default";
    case "negative":
      return "bg-red-100 text-red-800 border-red-200 hover:bg-red-200 hover:text-red-900 transition-colors cursor-default";
    case "neutral":
      return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 hover:text-blue-900 transition-colors cursor-default";
    case "mixed":
      return "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200 hover:text-purple-900 transition-colors cursor-default";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 hover:text-gray-900 transition-colors cursor-default";
  }
};

const getComplexityColor = (complexity: string) => {
  switch (complexity) {
    case "simple":
      return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200 hover:text-green-900 transition-colors cursor-default";
    case "moderate":
      return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 hover:text-yellow-900 transition-colors cursor-default";
    case "complex":
      return "bg-red-100 text-red-800 border-red-200 hover:bg-red-200 hover:text-red-900 transition-colors cursor-default";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 hover:text-gray-900 transition-colors cursor-default";
  }
};

const getPerformanceColor = (performance: string) => {
  switch (performance) {
    case "excellent":
      return "bg-green-100 text-green-900 border-green-200 hover:bg-green-200 hover:text-green-950 transition-colors cursor-default";
    case "good":
      return "bg-blue-100 text-blue-900 border-blue-200 hover:bg-blue-200 hover:text-blue-950 transition-colors cursor-default";
    case "adequate":
      return "bg-yellow-100 text-yellow-900 border-yellow-200 hover:bg-yellow-200 hover:text-yellow-950 transition-colors cursor-default";
    case "needs_improvement":
      return "bg-red-100 text-red-900 border-red-200 hover:bg-red-200 hover:text-red-950 transition-colors cursor-default";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 hover:text-gray-900 transition-colors cursor-default";
  }
};

const getSatisfactionIcon = (satisfaction: string) => {
  switch (satisfaction) {
    case "clearly_satisfied":
      return <ThumbsUp className="h-4 w-4 text-green-600" />;
    case "somewhat_satisfied":
      return <ThumbsUp className="h-4 w-4 text-blue-600" />;
    case "neutral":
      return <User className="h-4 w-4 text-gray-600" />;
    case "dissatisfied":
      return <ThumbsDown className="h-4 w-4 text-orange-600" />;
    case "very_dissatisfied":
      return <ThumbsDown className="h-4 w-4 text-red-600" />;
    default:
      return <User className="h-4 w-4 text-gray-600" />;
  }
};

export const InquiryAnalysisCheck = ({ id }: { id: string }) => {
  const {
    data: analysis,
    isLoading,
    error,
  } = useSWR<ChatAnalysis>(`/inquiries/api/analyze?id=${id}`, {
    revalidateOnFocus: false,
  });

  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }

  if (error) {
    return <AlertCircle className="h-4 w-4 text-red-500" />;
  }

  if (!analysis) {
    return "Analyze";
  }

  return (
    <>
      <Badge className={getStatusColor(analysis.status)}>
        {analysis.status.replace("_", " ")}
      </Badge>
      <ChartNetworkIcon className="h-4 w-4 text-muted-foreground" />
    </>
  );
};

export const InquiryAnalysis = ({ id }: { id: string }) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const {
    data: analysis,
    isLoading,
    error,
    mutate,
  } = useSWR<ChatAnalysis>(`/inquiries/api/analyze?id=${id}`);

  const requestAnalysis = async () => {
    try {
      setIsRequesting(true);
      const response = await fetch("/inquiries/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error("Failed to request analysis");
      }

      mutate();
    } catch (error) {
      console.error("Error requesting analysis:", error);
    } finally {
      setIsRequesting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Analysis Available</h3>
            <p className="text-sm text-muted-foreground mb-6">
              This inquiry hasn't been analyzed yet. Click the button below to
              generate an AI-powered analysis.
            </p>
            <Button
              onClick={requestAnalysis}
              disabled={isRequesting}
              className="w-full"
            >
              {isRequesting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Analysis...
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Generate Analysis
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Analysis Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Unable to load analysis data.
          </p>
          <Button
            onClick={requestAnalysis}
            disabled={isRequesting}
            variant="outline"
            className="w-full"
          >
            {isRequesting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4 mr-2" />
                Retry Analysis
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4 p-3 overflow-y-auto">
        {/* Header Card with Status and Key Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Inquiry Analysis
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Overview of inquiry status, sentiment, and key metrics</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Status:
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className={getStatusColor(analysis.status)}>
                      {analysis.status.replace("_", " ")}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Current resolution status of the inquiry</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Sentiment:
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className={getSentimentColor(analysis.sentiment)}>
                      {analysis.sentiment}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Overall emotional tone detected in the conversation</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Complexity:
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className={getComplexityColor(analysis.complexity)}>
                      {analysis.complexity}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Technical complexity level of the inquiry and its
                      resolution
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle
                  className={`h-4 w-4 ${
                    analysis.firstContactResolution
                      ? "text-green-500"
                      : "text-gray-400"
                  }`}
                />
                <span
                  className={
                    analysis.firstContactResolution
                      ? "text-green-700"
                      : "text-gray-600"
                  }
                >
                  First Contact Resolution
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowUp
                  className={`h-4 w-4 ${
                    analysis.escalationRequested
                      ? "text-orange-500"
                      : "text-gray-400"
                  }`}
                />
                <span
                  className={
                    analysis.escalationRequested
                      ? "text-orange-700"
                      : "text-gray-600"
                  }
                >
                  Escalation{" "}
                  {analysis.escalationRequested ? "Requested" : "Not Required"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Summary
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>AI-generated summary of the inquiry and its resolution</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {analysis.summary}
            </p>
          </CardContent>
        </Card>

        {/* Categories and Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              Classification & Performance
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Detailed categorization and performance metrics for this
                    inquiry
                  </p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Issue Category</span>
                <Badge
                  variant="outline"
                  className="hover:bg-muted hover:text-foreground transition-colors cursor-default"
                >
                  {analysis.issueCategory.replace("_", " ")}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Resolution Quality</span>
                <Badge
                  variant="outline"
                  className="hover:bg-muted hover:text-foreground transition-colors cursor-default"
                >
                  {analysis.resolutionQuality.replace("_", " ")}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Agent Performance</span>
                <Badge
                  className={getPerformanceColor(analysis.agentPerformance)}
                >
                  {analysis.agentPerformance.replace("_", " ")}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Customer Satisfaction
                </span>
                <div className="flex items-center gap-2">
                  {getSatisfactionIcon(analysis.satisfactionIndicators)}
                  <span className="text-sm capitalize">
                    {analysis.satisfactionIndicators.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Topics */}
        {analysis.keyTopics && analysis.keyTopics.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4" />
                Key Topics
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Main topics and themes identified in the conversation</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {analysis.keyTopics.map((topic, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="hover:bg-secondary/80 hover:text-secondary-foreground transition-colors cursor-default"
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Improvement Opportunities */}
        {analysis.improvementOpportunities &&
          analysis.improvementOpportunities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightbulb className="h-4 w-4" />
                  Improvement Opportunities
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        AI-identified opportunities to improve support quality
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.improvementOpportunities.map(
                    (opportunity, index) => (
                      <li
                        key={index}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span className="text-orange-500 mt-0.5">•</span>
                        {opportunity}
                      </li>
                    )
                  )}
                </ul>
              </CardContent>
            </Card>
          )}

        {/* Timestamp */}
        <div className="text-xs text-muted-foreground text-center">
          Analyzed on {new Date(analysis.createdAt).toLocaleString()}
        </div>
      </div>
    </TooltipProvider>
  );
};
