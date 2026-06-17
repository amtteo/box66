import { cn } from "@/lib/utils";

import { LogoIcon } from "./logo-icon";
import { LogoText } from "./logo-text";

type LogoProps = {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showIcon?: boolean;
  showText?: boolean;
};

export function Logo({
  className,
  iconClassName,
  textClassName,
  showIcon = true,
  showText = true,
}: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {showIcon ? <LogoIcon className={iconClassName} /> : null}
      {showText ? <LogoText className={textClassName} /> : null}
    </span>
  );
}

export { LogoIcon, LogoText };
