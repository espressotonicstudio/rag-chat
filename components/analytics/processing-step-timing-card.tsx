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

interface StepTiming {
  step: string;
  avg_duration: number;
  p95_duration: number;
  count: number;
}

interface ProcessingStepTimingCardProps {
  stepTiming?: StepTiming[];
}

export function ProcessingStepTimingCard({
  stepTiming,
}: ProcessingStepTimingCardProps) {
  const getStepTooltip = (stepName: string) => {
    const tooltips = {
      classification:
        "Determines if the query requires RAG processing based on content analysis",
      hyde: "Hypothetical Document Embeddings - generates expected answer to improve retrieval",
      embedding:
        "Converts query text into vector embeddings for similarity search",
      retrieval:
        "Searches knowledge base for relevant documents using embeddings",
      similarity_ranking: "Ranks retrieved documents by relevance to the query",
      quality_filtering:
        "Filters out low-quality or irrelevant retrieved content",
      diversity:
        "Ensures retrieved content covers different aspects of the query",
    };
    return tooltips[stepName as keyof typeof tooltips] || "RAG processing step";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Processing Step Timing</CardTitle>
        <CardDescription>
          Which steps take the most time? Optimization targets.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stepTiming
            ?.sort((a, b) => b.avg_duration - a.avg_duration)
            .map((step) => (
              <div
                key={step.step}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="capitalize"
                  >
                    {step.step.replace("_", " ")}
                  </Badge>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>{getStepTooltip(step.step)}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {(step.avg_duration / 1000).toFixed(3)}s
                  </div>
                  <div className="text-xs text-muted-foreground">
                    P95: {(step.p95_duration / 1000).toFixed(3)}s
                  </div>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
