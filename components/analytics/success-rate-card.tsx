import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Target, HelpCircle } from "lucide-react";

interface SuccessRateCardProps {
  successfulQueries: number;
  skippedQueries: number;
}

export function SuccessRateCard({
  successfulQueries,
  skippedQueries,
}: SuccessRateCardProps) {
  const totalQueries = successfulQueries + skippedQueries;
  const successRate =
    totalQueries > 0 ? Math.round((successfulQueries / totalQueries) * 100) : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="h-3 w-3 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p>
                Percentage of queries that successfully used RAG processing vs
                those that were skipped. Higher rates indicate better RAG
                engagement and relevance detection.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Target className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{successRate}%</div>
        <p className="text-xs text-muted-foreground">RAG engagement rate</p>
      </CardContent>
    </Card>
  );
}
