"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@visume/ui/components/empty";
import { ArrowDown, Sparkles } from "lucide-react";
import { Label } from "@visume/ui/components/label";
import { ScrollArea } from "@visume/ui/components/scroll-area";
import { Badge } from "@visume/ui/components/badge";
import { sortSuggestions } from "@/lib/sortSuggestions";
import { cn } from "@visume/ui/lib/utils";
import { ResumeReview, ResumeWithOutJob } from "@visume/types";
import TailorResume from "./tailor-resume";
import { Separator } from "@visume/ui/components/separator";

export default function ResumeSuggestionsList({
  review,
  resume,
}: {
  review: ResumeReview;
  resume: ResumeWithOutJob;
}) {
  console.log("🚀 ~ ResumeSuggestionsList ~ review:", review);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  if (Object.keys(review).length === 0)
    return (
      <div className="grid place-content-center ">
        <Empty>
          <EmptyHeader>
            <EmptyTitle className="text-xl font-semibold">
              AI Job Tailoring
            </EmptyTitle>
            <EmptyDescription>
              You haven&apos;t tailored your resume yet. Get suggestions by
              tailoring your resume.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <TailorResume resume={resume} review={review} />
          </EmptyContent>
        </Empty>
      </div>
    );

  const sortedSuggestion = sortSuggestions(review.suggestions, {
    sortItems: true,
  });

  return (
    <div>
      <div className="border-b px-4 py-3">
        <h2 className="text-lg text-muted-foreground">
          AI Tailored Suggestions
        </h2>
      </div>

      <ScrollArea className=" h-[calc(100vh_-_90px)] ">
        <div className="">
          <div className="border-y  py-2 px-4 flex items-center text-primary bg-primary/10 justify-between">
            <Label>
              <Sparkles className="size-4 text-primary" />
              AI Suggestion
            </Label>

            <button
              type="button"
              className="font-medium cursor-pointer"
              onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
            >
              {isSummaryExpanded ? "Collapse" : "Expand"}
            </button>
          </div>

          {!isSummaryExpanded ? (
            <div
              className="text-sm! space-y-3 px-3 p-4 cursor-pointer bg-primary/5"
              onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
            >
              <p>{review.summary.slice(0, 200)}</p>...
            </div>
          ) : (
            <div className="text-sm! space-y-3 px-3 p-4 bg-primary/5">
              <ReactMarkdown>{review.summary}</ReactMarkdown>
            </div>
          )}
        </div>
        {sortedSuggestion.map((sugg) => (
          <div key={sugg.sectionName} className="space-y-3">
            <Label className="border-y   py-2 px-4 flex items-center">
              <sugg.icon className="size-5" />
              {sugg.sectionName}
            </Label>
            {sugg.items.map((item) => (
              <div
                className={cn(
                  "py-4 px-3 rounded-md  border mx-3 mb-3 transition-all ease-out",
                  item.priority === "RECOMMENDED"
                    ? "bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 hover:ring-primary ring-2 ring-transparent"
                    : "bg-destructive/15 dark:bg-destructive/20 hover:bg-destructive/20 hover:ring-destructive ring-2 ring-transparent",
                )}
                key={item._id}
              >
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-semibold text-accent-foreground">
                    {item.title}
                  </h4>
                  <Badge
                    size="sm"
                    variant="outline"
                    className={cn(
                      item.priority === "RECOMMENDED"
                        ? "border-primary/40 text-primary"
                        : "border-destructive/40 text-destructive",
                    )}
                  >
                    {item.priority}
                  </Badge>
                </div>
                <p className="text-sm mt-3.5 text-muted-foreground ">
                  {item.description}
                </p>

                {/* <div>{resume[item.path]}</div> */}
                <Separator
                  className={cn(
                    "my-4",
                    item.priority === "RECOMMENDED"
                      ? "bg-primary/40 "
                      : "bg-destructive/40 ",
                  )}
                />
                <div className="space-y-4">
                  {item.operation.actual && item.operation.actual !== "" ? (
                    <div>
                      {item.operation.action === "REPLACE" ? (
                        <span className="text-sm line-through">
                          {item.operation.actual}
                        </span>
                      ) : item.sectionName.includes("Skills") ? (
                        <Badge
                          variant="outline"
                          className={cn(
                            "line-through",
                            item.priority === "RECOMMENDED"
                              ? "border-primary/40 text-primary"
                              : "border-destructive/40 text-destructive",
                          )}
                        >
                          {item.operation.actual}
                        </Badge>
                      ) : (
                        <span className="text-sm line-through">
                          {item.operation.actual}
                        </span>
                      )}
                    </div>
                  ) : null}
                  {item.operation.value && item.operation.value !== "" ? (
                    <div>
                      <div className="mb-2 w-full">
                        {item.operation.action === "REPLACE" ? (
                          <div className="flex justify-center items-center py-1">
                            <ArrowDown className="size-4 text-center" />
                          </div>
                        ) : item.operation.action === "ADD" ? (
                          <Label>Add</Label>
                        ) : (
                          <Label>Remove</Label>
                        )}
                      </div>

                      {item.operation.action === "REPLACE" ? (
                        <span className="text-sm">{item.operation.value}</span>
                      ) : item.sectionName.includes("Skill") ? (
                        <Badge
                          variant="outline"
                          className={cn(
                            item.priority === "RECOMMENDED"
                              ? "border-primary/40 text-primary"
                              : "border-destructive/40 text-destructive",
                          )}
                        >
                          {item.operation.value}
                        </Badge>
                      ) : (
                        <span className="text-sm ">{item.operation.value}</span>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}
