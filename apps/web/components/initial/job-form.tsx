"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@visume/ui/components/form";
import { Input } from "@visume/ui/components/input";
import { Button } from "@visume/ui/components/button";
import { Textarea } from "@visume/ui/components/textarea";
import { useApiClient } from "@/hooks/use-api-client";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Loader2 } from "lucide-react";
import { InitialSetupDetails, SetupProgress } from "@/app/initial/page";

export const formSchema = z.object({
  title: z.string().min(2).max(50),
  company: z.string().min(2).max(50),
  description: z.string().min(30).max(5000),
});

export default function JobForm({
  handleProgress,
  handleResumeAndJobDetails,
}: {
  handleProgress: (step: number, form: SetupProgress["form"]) => void;
  handleResumeAndJobDetails: ({ resume, job }: InitialSetupDetails) => void;
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      company: "",
      description: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const { title, description, company } = values;
    handleResumeAndJobDetails({
      job: {
        company: { name: company, domain: "" },
        description,
        title,
        keywords: [],
      },
    });
    handleProgress(2, "RESUME_UPLOAD_FORM");
  }

  return (
    <section className="flex flex-col justify-center gap-10">
      <div className="space-y-2">
        <h1 className="text-xl font-bold">Add your Job details</h1>
        <p className="text-muted-foreground text-sm">
          Let&apos;s get you started with your resume.
        </p>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className={`space-y-8 w-xl`}
        >
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Software Engineer"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Google" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Paste  the full job description here..."
                    {...field}
                    rows={5}
                    className="text-sm h-32"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-between items-center">
            <p className="text-muted-foreground text-sm">
              Now upload your resume to match with the job description.
            </p>
            <Button type="submit">
              Continue
              <ArrowRight />
            </Button>
          </div>
        </form>
      </Form>
    </section>
  );
}
