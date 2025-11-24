import React, { PropsWithChildren } from "react";
import { TRPCReactProvider } from "@/trpc/client";
import { Toaster } from "@/components/ui/sonner";
import { NuqsAdapter } from "nuqs/adapters/next";

const Providers = ({ children }: PropsWithChildren) => {
  return (
    <NuqsAdapter>
      <TRPCReactProvider>
        <Toaster />
        {children}
      </TRPCReactProvider>
    </NuqsAdapter>
  );
};

export default Providers;
