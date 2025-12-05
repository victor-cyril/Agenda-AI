import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { generateAvatarUri, TGenerateAvatarProps } from "@/lib/avatar";
import { cn } from "@/lib/utils";

const GeneratedAvatar = (
  props: TGenerateAvatarProps & {
    seed: string;
    className?: string;
    variant?: "botttsNeutral" | "initials";
  }
) => {
  const { seed, className, variant = "initials" } = props;

  return (
    <Avatar className={cn(className)}>
      <AvatarImage
        src={generateAvatarUri({ seed, variant })}
        alt="Generated Avatar"
      />
      <AvatarFallback>{seed.charAt(0).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
};

export default GeneratedAvatar;
