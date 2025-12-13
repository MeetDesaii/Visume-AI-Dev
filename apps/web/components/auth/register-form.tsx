"use client";

import { Loader2, UserPlus, Shield, AlertCircle } from "lucide-react";
import { Button } from "@visume/ui/components/button";
import { Input } from "@visume/ui/components/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@visume/ui/components/form";
import { useSignUp } from "@clerk/nextjs";
import { cn } from "@visume/ui/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface SignupFormProps {
  className?: string;
}

const signUpSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignUpFormValues = z.infer<typeof signUpSchema>;

interface ClerkError {
  errors?: Array<{
    message: string;
    longMessage?: string;
    code?: string;
  }>;
  message?: string;
}

export function RegisterForm({
  className,
  ...props
}: SignupFormProps & React.ComponentProps<"div">) {
  const { isLoaded, signUp } = useSignUp();
  const router = useRouter();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Sign-up mutation
  const signUpMutation = useMutation({
    mutationFn: async (values: SignUpFormValues) => {
      if (!isLoaded || !signUp) {
        throw new Error("Sign up is not ready");
      }

      await signUp.create({
        firstName: values.firstName,
        lastName: values.lastName,
        emailAddress: values.email,
        password: values.password,
      });

      const verificationEmail = await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      return verificationEmail;
    },
    onSuccess: (verificationEmail) => {
      if (verificationEmail.status === "missing_requirements") {
        toast.success("Verification code sent to your email");
        router.push("/verify");
      }
    },
    onError: (error: ClerkError) => {
      // Extract error message from Clerk error format
      const errorMessage =
        error.errors?.[0]?.longMessage ||
        error.errors?.[0]?.message ||
        error.message ||
        "Failed to create account. Please try again.";

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
      if (!isLoaded || !signUp) {
        throw new Error("Sign up is not ready");
      }

      await signUp.authenticateWithRedirect({
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
        "Failed to sign up with OAuth. Please try again.";

      form.setError("root", {
        type: "manual",
        message: errorMessage,
      });
    },
  });

  const handleSubmit = (values: SignUpFormValues) => {
    signUpMutation.mutate(values);
  };

  const signUpWith = (strategy: "oauth_google" | "oauth_linkedin") => {
    oauthMutation.mutate(strategy);
  };

  const isLoading = signUpMutation.isPending || oauthMutation.isPending;
  const formError = form.formState.errors.root?.message;

  return (
    <div
      className={cn(
<<<<<<< Updated upstream
        "flex flex-col gap-6 bg-white dark:bg-black rounded-2xl p-6 drop-shadow-2xl",
        className,
=======
        "flex flex-col gap-6 bg-white dark:bg-accent dark:bg-black rounded-2xl p-6 drop-shadow-2xl",
        className
>>>>>>> Stashed changes
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
            Already have an account?{" "}
            <Link href="/sign-in" className="underline underline-offset-4">
              Login
            </Link>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-1">
          <Button
            variant="outline"
            type="button"
            size="lg"
            className="w-full"
            onClick={() => signUpWith("oauth_google")}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
            )}
            Continue with Google
          </Button>
        </div>
        <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
          <span className="bg-background text-muted-foreground relative z-10 px-2">
            Or
          </span>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Display form-level errors */}
            {formError && (
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/50 p-4">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 dark:text-red-400">
                    {formError}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 ">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John"
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
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Doe"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
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
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Sign up
                </>
              )}
            </Button>
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
