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
    overlayClassName?: string;
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
          "md:max-w-[600px] mx-auto sm:rounded-2xl min-h-[300px] max-xs:mt-0!",
          classNames?.content
        )}
        overlayClassName={cn(
          "backdrop-blur-none",
          classNames?.overlayClassName
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
