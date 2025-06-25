import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  HelpCircle,
  MousePointer,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useState } from "react";

interface SuggestedQuestion {
  question_id: string;
  question_text: string;
  click_count: number;
}

interface ContextBreakdown {
  context: string;
  click_count: number;
}

interface SuggestedQuestionsCardProps {
  totalClicks?: number;
  topQuestions?: SuggestedQuestion[];
  contextBreakdown?: ContextBreakdown[];
  timeRange?: number;
}

type SortDirection = "asc" | "desc" | null;

export function SuggestedQuestionsCard({
  totalClicks = 0,
  topQuestions = [],
  contextBreakdown = [],
  timeRange = 24,
}: SuggestedQuestionsCardProps) {
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const uniqueQuestions = topQuestions.length;
  const avgClicksPerQuestion =
    uniqueQuestions > 0
      ? Math.round((totalClicks / uniqueQuestions) * 10) / 10
      : 0;
  const topContext =
    contextBreakdown.length > 0
      ? contextBreakdown.reduce((prev, current) =>
          prev.click_count > current.click_count ? prev : current
        ).context
      : null;

  const getContextLabel = (context: string) => {
    const labels = {
      chat_interface: "Chat Interface",
      management_interface: "Management",
    };
    return labels[context as keyof typeof labels] || context;
  };

  const sortedQuestions = [...topQuestions].sort((a, b) => {
    if (sortDirection === "desc") {
      return b.click_count - a.click_count;
    } else if (sortDirection === "asc") {
      return a.click_count - b.click_count;
    }
    return 0;
  });

  const handleSort = () => {
    if (sortDirection === "desc") {
      setSortDirection("asc");
    } else if (sortDirection === "asc") {
      setSortDirection(null);
    } else {
      setSortDirection("desc");
    }
  };

  const getSortIcon = () => {
    if (sortDirection === "desc") return <ArrowDown className="h-4 w-4" />;
    if (sortDirection === "asc") return <ArrowUp className="h-4 w-4" />;
    return <ArrowUpDown className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg">Suggested Questions</CardTitle>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p>
                Analytics for suggested questions that users click on. Track
                which questions are most popular and where users are engaging
                with suggestions.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* High Level Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {totalClicks}
            </div>
            <div className="text-sm text-muted-foreground text-center">
              Total Clicks
            </div>
          </div>

          <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {uniqueQuestions}
            </div>
            <div className="text-sm text-muted-foreground text-center">
              Unique Questions
            </div>
          </div>

          <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {avgClicksPerQuestion}
            </div>
            <div className="text-sm text-muted-foreground text-center">
              Avg Clicks/Question
            </div>
          </div>

          <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
            <div className="text-sm font-semibold text-orange-600">
              {topContext ? getContextLabel(topContext) : "N/A"}
            </div>
            <div className="text-sm text-muted-foreground text-center">
              Top Source
            </div>
          </div>
        </div>

        {/* Questions Table */}
        {topQuestions.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">Question Performance</h4>
              <div className="text-sm text-muted-foreground">
                Last{" "}
                {timeRange === 24 ? "24h" : timeRange === 168 ? "7d" : "30d"}
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60%]">Question</TableHead>
                    <TableHead className="w-[40%]">
                      <button
                        onClick={handleSort}
                        className="flex items-center gap-2 hover:text-foreground transition-colors"
                      >
                        Count
                        {getSortIcon()}
                      </button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedQuestions.map((question, index) => (
                    <TableRow key={question.question_id}>
                      <TableCell className="font-medium">
                        <div className="flex items-start gap-2">
                          <Badge
                            variant="outline"
                            className="text-xs shrink-0"
                          >
                            #{index + 1}
                          </Badge>
                          <div className="min-w-0">
                            <p className="text-sm line-clamp-2 leading-relaxed">
                              {question.question_text}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MousePointer className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">
                            {question.click_count}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12 text-muted-foreground">
            <MousePointer className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">
              No suggested question clicks recorded yet
            </p>
            <p className="text-sm">
              Users will see this data when they start clicking suggested
              questions
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
