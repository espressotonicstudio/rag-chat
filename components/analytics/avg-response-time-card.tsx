import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Clock, HelpCircle } from "lucide-react";

interface AvgResponseTimeCardProps {
  avgDuration?: number;
}

export function AvgResponseTimeCard({ avgDuration }: AvgResponseTimeCardProps) {
  const avgResponseTime = avgDuration
    ? (avgDuration / 1000).toFixed(2) + "s"
    : "N/A";

  return (
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
                Average time taken for complete RAG processing pipeline from
                query classification to final response generation. Lower is
                better for user experience.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Clock className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{avgResponseTime}</div>
        <p className="text-xs text-muted-foreground">End-to-end processing</p>
      </CardContent>
    </Card>
  );
}
