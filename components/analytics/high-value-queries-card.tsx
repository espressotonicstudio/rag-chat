import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TrendingUp, HelpCircle } from "lucide-react";

interface Classification {
  classification_type: string;
  count: number;
  avg_confidence: number;
  high_confidence_count: number;
}

interface HighValueQueriesCardProps {
  classifications?: Classification[];
}

export function HighValueQueriesCard({
  classifications,
}: HighValueQueriesCardProps) {
  const highValueCount =
    classifications
      ?.filter((c) =>
        [
          "product-service-inquiry",
          "pricing-cost-question",
          "booking-appointment",
        ].includes(c.classification_type)
      )
      .reduce((sum, c) => sum + c.count, 0) || 0;

  return (
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
                Number of queries identified as high business value (product
                inquiries, pricing questions, booking requests). These represent
                potential conversion opportunities.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{highValueCount}</div>
        <p className="text-xs text-muted-foreground">
          Conversion opportunities
        </p>
      </CardContent>
    </Card>
  );
}
