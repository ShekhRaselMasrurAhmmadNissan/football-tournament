import Link from "next/link";
import Image from "next/image";
import { Shield } from "lucide-react";

export function BrandLogo({
  size = 40,
  href = "/",
  withText = true,
  subtitle,
  title,
  className,
  onClick,
}: {
  size?: number;
  href?: string | null;
  withText?: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
  onClick?: () => void;
}) {
  const content = (
    <span className={`group flex items-center gap-3 ${className ?? ""}`}>
      <span
        className="relative grid shrink-0 place-items-center overflow-hidden rounded-xl bg-black ring-1 ring-primary/40 shadow-[0_8px_28px_-12px_var(--primary)]"
        style={{ width: size, height: size }}
      >
        <Image
          src="/Logo.png"
          alt="Magura Golden Football Club crest"
          width={size}
          height={size}
          priority
          className="size-full object-contain"
        />
      </span>
      {withText && (
        <span className="hidden flex-col leading-none sm:flex">
          <span className="font-heading text-sm font-semibold tracking-tight">{title}</span>
          <span className="text-[0.65rem] font-medium tracking-[0.18em] text-muted-foreground uppercase">
            {subtitle}
          </span>
        </span>
      )}
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} onClick={onClick}>
      {content}
    </Link>
  );
}

export function LogoFallback() {
  return (
    <span className="grid size-10 place-items-center rounded-xl bg-primary/15 ring-1 ring-primary/40">
      <Shield className="size-5 text-primary" />
    </span>
  );
}
