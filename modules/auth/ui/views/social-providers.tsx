import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import React from "react";
import { FaGithub, FaGoogle } from "react-icons/fa";

type TSocialProviders = "github" | "google";

const SocialProviders = (props: {
  buttonDisabled?: boolean;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}) => {
  const { setError, buttonDisabled } = props;
  const [isLoadingState, setIsLoadingState] = React.useState(false);

  const isLoading = (provider: TSocialProviders) => {
    return (isLoadingState || buttonDisabled) && currentProvider === provider;
  };

  const [currentProvider, setCurrentProvider] =
    React.useState<TSocialProviders | null>(null);

  const onSocial = async (provider: TSocialProviders) => {
    setError(null);
    setCurrentProvider(provider);
    setIsLoadingState(true);

    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: "/",
    });

    setIsLoadingState(false);
    if (error?.message) setError(error.message);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <Button
        variant="outline"
        className="w-full"
        type="button"
        disabled={isLoading("google")}
        onClick={() => onSocial("google")}
      >
        <FaGoogle />
        {isLoading("google") ? "Loading Google..." : "Google"}
      </Button>
      <Button
        variant="outline"
        className="w-full"
        type="button"
        disabled={isLoading("github")}
        onClick={() => onSocial("github")}
      >
        <FaGithub />
        {isLoading("github") ? "Loading GitHub..." : "GitHub"}
      </Button>
    </div>
  );
};

export default SocialProviders;
