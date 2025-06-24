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
import { HelpCircle } from "lucide-react";

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
        <div className="space-y-3">
          {classifications?.map((item) => (
            <div
              key={item.classification_type}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Badge
                  className={getQuestionTypeColor(item.classification_type)}
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
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {Math.round(item.avg_confidence * 100)}% conf
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
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
