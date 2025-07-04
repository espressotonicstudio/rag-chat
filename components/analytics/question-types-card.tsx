import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Classification {
  classification_type: string;
  count: number;
  avg_confidence: number;
  high_confidence_count: number;
}

interface QuestionTypesCardProps {
  classifications?: Classification[];
}

export function QuestionTypesCard({ classifications }: QuestionTypesCardProps) {
  const getQuestionTypeColor = (type: string) => {
    const colors = {
      "product-service-inquiry":
        "bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-900",
      "pricing-cost-question":
        "bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900",
      "location-hours-contact":
        "bg-purple-100 text-purple-800 hover:bg-purple-200 hover:text-purple-900",
      "booking-appointment":
        "bg-orange-100 text-orange-800 hover:bg-orange-200 hover:text-orange-900",
      "support-help-question":
        "bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900",
      "company-about-info":
        "bg-indigo-100 text-indigo-800 hover:bg-indigo-200 hover:text-indigo-900",
      "general-inquiry":
        "bg-gray-100 text-gray-800 hover:bg-gray-200 hover:text-gray-900",
      "casual-statement":
        "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 hover:text-yellow-900",
      other:
        "bg-slate-100 text-slate-800 hover:bg-slate-200 hover:text-slate-900",
    };
    return (
      colors[type as keyof typeof colors] ||
      "bg-gray-100 text-gray-800 hover:bg-gray-200 hover:text-gray-900"
    );
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

  return (
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
                AI-powered classification of user queries by intent and business
                value. Focus on high-value types for conversion optimization.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <CardDescription>
          What are visitors asking about? Focus on high-value question types.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Question Type</TableHead>
              <TableHead>Business Value</TableHead>
              <TableHead className="text-right">Count</TableHead>
              <TableHead className="text-right">Confidence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classifications?.map((item) => (
              <TableRow key={item.classification_type}>
                <TableCell>
                  <Badge
                    className={cn(
                      getQuestionTypeColor(item.classification_type),
                      "first-letter:capitalize inline-block"
                    )}
                  >
                    {item.classification_type.replace("-", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="text-xs"
                  >
                    {getBusinessValue(item.classification_type)} Value
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {item.count}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                    {Math.round(item.avg_confidence * 100)}%
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p>
                          Average confidence score for this classification type.
                          Higher confidence indicates more accurate
                          categorization.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
