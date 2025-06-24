import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface Performance {
  avg_duration: number;
  p50_duration: number;
  p95_duration: number;
  p99_duration: number;
  total_requests: number;
}

interface ResponseTimeDistributionCardProps {
  performance?: Performance;
}

export function ResponseTimeDistributionCard({
  performance,
}: ResponseTimeDistributionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Response Time Distribution</CardTitle>
        <CardDescription>
          End-to-end RAG processing performance metrics.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {performance && (
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
                {(performance.avg_duration / 1000).toFixed(2)}s
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
                      95% of requests complete faster than this time. Useful for
                      identifying worst-case performance.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="text-lg font-semibold">
                {(performance.p95_duration / 1000).toFixed(2)}s
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
                      Median response time - 50% of requests are faster, 50% are
                      slower. Less affected by outliers than average.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="text-lg font-semibold">
                {(performance.p50_duration / 1000).toFixed(2)}s
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
                      99% of requests complete faster than this time. Represents
                      the slowest 1% of requests.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="text-lg font-semibold">
                {(performance.p99_duration / 1000).toFixed(2)}s
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
