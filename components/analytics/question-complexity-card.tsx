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

interface Complexity {
  complexity: string;
  count: number;
}

interface QuestionComplexityCardProps {
  complexityData?: Complexity[];
}

export function QuestionComplexityCard({
  complexityData,
}: QuestionComplexityCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Question Complexity</CardTitle>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p>
                Distribution of query complexity levels. Complex questions
                typically require more processing time and knowledge retrieval
                steps, while simple questions can be answered more quickly.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <CardDescription>
          Simple vs complex questions - impacts response quality and processing
          time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          {complexityData?.map((item) => (
            <div
              key={item.complexity}
              className="flex-1 flex items-center justify-between gap-4 text-center"
            >
              <Badge variant="secondary">{item.complexity} Questions</Badge>
              <div className="font-bold">{item.count}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
