import Link from "next/link";
import React from "react";
import { Button } from "@visume/ui/components/button";
import { ArrowRight, LogIn } from "lucide-react";

export default function Header() {
  return (
    <nav className="flex justify-between items-center p-4 container mx-auto">
      <h1 className="text-xl">Visume AI</h1>

      <div className="flex gap-4">
        <Link href="/sign-in">
          <Button size="lg" variant="secondary">
            <LogIn />
            Login
          </Button>
        </Link>
        <Link href="/sign-up">
          <Button size="lg">
            Get Started
            <ArrowRight />
          </Button>
        </Link>
      </div>
    </nav>
  );
}
