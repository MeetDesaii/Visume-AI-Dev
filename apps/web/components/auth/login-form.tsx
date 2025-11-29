"use client";

import { useRouter } from "next/navigation";
import { Loader2, LogIn, Shield, AlertCircle } from "lucide-react";
import { IconBrandGoogleFilled } from "@tabler/icons-react";
import { Button } from "@visume/ui/components/button";
import { Input } from "@visume/ui/components/input";
import Link from "next/link";
import { cn } from "@visume/ui/lib/utils";
import { useSignIn } from "@clerk/nextjs";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@visume/ui/components/form";
import { useMutation } from "@tanstack/react-query";

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type SignInFormValues = z.infer<typeof signInSchema>;

interface ClerkError {
  errors?: Array<{
    message: string;
    longMessage?: string;
    code?: string;
  }>;
  message?: string;
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Sign-in mutation
  const signInMutation = useMutation({
    mutationFn: async (values: SignInFormValues) => {
      if (!isLoaded || !signIn) {
        throw new Error("Sign in is not ready");
      }

      const result = await signIn.create({
        identifier: values.email,
        password: values.password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        return result;
      }

      throw new Error("Sign in incomplete");
    },
    onSuccess: () => {
      router.push("/dashboard");
    },
    onError: (error: ClerkError) => {
      // Extract error message from Clerk error format
      const errorMessage =
        error.errors?.[0]?.longMessage ||
        error.errors?.[0]?.message ||
        error.message ||
        "Invalid email or password. Please try again.";

      // Set form-level error
      form.setError("root", {
        type: "manual",
        message: errorMessage,
      });
    },
  });

  // OAuth mutation
  const oauthMutation = useMutation({
    mutationFn: async (strategy: "oauth_google" | "oauth_linkedin") => {
      if (!isLoaded || !signIn) {
        throw new Error("Sign in is not ready");
      }

      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard",
      });
    },
    onError: (error: ClerkError) => {
      const errorMessage =
        error.errors?.[0]?.longMessage ||
        error.errors?.[0]?.message ||
        error.message ||
        "Failed to sign in with OAuth. Please try again.";

      form.setError("root", {
        type: "manual",
        message: errorMessage,
      });
    },
  });

  const onSubmit = (values: SignInFormValues) => {
    signInMutation.mutate(values);
  };

  const signInWith = (strategy: "oauth_google" | "oauth_linkedin") => {
    oauthMutation.mutate(strategy);
  };

  const isLoading = signInMutation.isPending || oauthMutation.isPending;
  const formError = form.formState.errors.root?.message;

  return (
    <div
      className={cn(
        "flex flex-col gap-6 bg-white border dark:bg-black/50 backdrop-blur-sm rounded-2xl p-6  drop-shadow-2xl",
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-center gap-2">
          <Link
            href="/"
            className="flex flex-col items-center gap-2 font-medium"
          >
            <div className="flex size-8 items-center justify-center rounded-md">
              <Shield className="size-6" />
            </div>
            <span className="sr-only">Visume AI</span>
          </Link>
          <h1 className="text-2xl font-bold">Welcome to Visume AI</h1>
          <div className="text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="underline underline-offset-4">
              Sign up
            </Link>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-1">
          <Button
            variant="outline"
            type="button"
            size="lg"
            className="w-full"
            onClick={() => signInWith("oauth_google")}
            disabled={isLoading}
          >
            <IconBrandGoogleFilled />
            Continue with Google
          </Button>
        </div>
        <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
          <span className="bg-background text-muted-foreground relative z-10 px-2">
            Or
          </span>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              {formError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/50 p-3">
                  <AlertCircle className="size-4 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800 dark:text-red-400">
                      {formError}
                    </p>
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john.doe@example.com"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Log in
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
