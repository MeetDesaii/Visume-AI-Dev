"use client";
import { useSignUp } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@visume/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@visume/ui/components/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@visume/ui/components/input-otp";
import { Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const verifySchema = z.object({
  code: z.string().length(6, "Verification code must be 6 digits"),
});

export default function VerifyEmailPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const verifyForm = useForm<z.infer<typeof verifySchema>>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      code: "",
    },
  });

  async function onVerify(values: z.infer<typeof verifySchema>) {
    if (!isLoaded) return;

    setIsLoading(true);
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: values.code,
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        router.push("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.errors?.[0]?.message || "Invalid verification code");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className=" rounded-2xl shadow-md px-8 py-4">
      <div className="w-full max-w-md space-y-8 mb-8 ">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">
            Verify your email
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a verification code to your email
          </p>
        </div>
      </div>
      <Form {...verifyForm}>
        <form
          onSubmit={verifyForm.handleSubmit(onVerify)}
          className="space-y-6"
        >
          <FormField
            control={verifyForm.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                {/* <FormLabel>Verification Code</FormLabel> */}
                <FormControl>
                  <InputOTP maxLength={6} {...field}>
                    <InputOTPGroup className="w-full justify-center">
                      <InputOTPSlot index={0} className="size-12" />
                      <InputOTPSlot index={1} className="size-12" />
                      <InputOTPSlot index={2} className="size-12" />
                      <InputOTPSlot index={3} className="size-12" />
                      <InputOTPSlot index={4} className="size-12" />
                      <InputOTPSlot index={5} className="size-12" />
                    </InputOTPGroup>
                  </InputOTP>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify Email
          </Button>

          <Link href="/sign-up">
            <Button type="button" variant="ghost" className="w-full">
              Back to sign up
            </Button>
          </Link>
        </form>
      </Form>
    </div>
  );
}
