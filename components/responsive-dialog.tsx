"use client";

import {
  Credenza,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  description: string;
  children: React.ReactNode | (() => React.ReactNode);
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  classNames?: {
    content?: string;
    overlayclassname?: string;
  };
}

const ResponsiveDialog = (props: Props) => {
  const {
    title,
    description,
    children,
    open = false,
    onOpenChange,
    classNames,
  } = props;

  const content = typeof children === "function" ? children() : children;

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent
        className={cn(
          "md:max-w-[600px] mx-auto sm:rounded-2xl max-xs:mt-0!",
          classNames?.content
        )}
        overlayclassname={cn(
          "backdrop-blur-none",
          classNames?.overlayclassname
        )}
      >
        <CredenzaHeader>
          <CredenzaTitle>{title}</CredenzaTitle>
          <CredenzaDescription>{description}</CredenzaDescription>
        </CredenzaHeader>

        <div className="p-4">{content}</div>
      </CredenzaContent>
    </Credenza>
  );
};

export default ResponsiveDialog;
