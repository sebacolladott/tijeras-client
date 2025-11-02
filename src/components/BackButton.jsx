import { useCallback } from "react";
import { useNavigate } from "react-router";
import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function BackButton({ fallback = "/", children, className, ...props }) {
  const navigate = useNavigate();

  const handleBack = useCallback(() => {
    try {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate(fallback, { replace: true });
      }
    } catch {
      navigate(fallback, { replace: true });
    }
  }, [navigate, fallback]);

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={cn("gap-1", className)}
      aria-label="Volver"
      {...props}
    >
      <ArrowLeftIcon className="w-4 h-4" />
      {children || "Volver"}
    </Button>
  );
}

