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

interface SkipReason {
  reason: string;
  count: number;
}

interface RagSkipAnalysisCardProps {
  skipReasons?: SkipReason[];
}

export function RagSkipAnalysisCard({ skipReasons }: RagSkipAnalysisCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>RAG Skip Analysis</CardTitle>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p>
                Reasons why queries bypass RAG processing. Common reasons
                include simple greetings, unclear queries, or off-topic
                questions that don't benefit from knowledge retrieval.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <CardDescription>
          Why are queries not using RAG? Optimization opportunities.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Skip Reason</TableHead>
              <TableHead className="text-right">Count</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {skipReasons?.map((item) => (
              <TableRow key={item.reason}>
                <TableCell>
                  <Badge variant="secondary">
                    {item.reason.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {item.count}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
