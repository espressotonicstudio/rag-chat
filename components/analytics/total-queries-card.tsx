import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Users, HelpCircle } from "lucide-react";

interface TotalQueriesCardProps {
  totalQueries: number;
  timeRange: number;
}

export function TotalQueriesCard({
  totalQueries,
  timeRange,
}: TotalQueriesCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="h-3 w-3 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p>
                Total number of chat messages processed by your RAG system in
                the selected time period. This includes both successful RAG
                responses and queries that were skipped.
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
  );
}
