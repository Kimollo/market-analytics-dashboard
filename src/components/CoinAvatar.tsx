import { useEffect, useState } from "react";

interface CoinAvatarProps {
  image: string | null;
  symbol: string;
  size?: "sm" | "md";
}

export function CoinAvatar({ image, symbol, size = "md" }: CoinAvatarProps) {
  const [failed, setFailed] = useState(false);
  const dimension = size === "sm" ? "h-8 w-8" : "h-10 w-10";

  useEffect(() => {
    setFailed(false);
  }, [image]);

  if (!image || failed) {
    return (
      <span
        className={`${dimension} grid shrink-0 place-items-center rounded-full bg-zinc-800 text-[10px] font-semibold uppercase tracking-wide text-zinc-300`}
        aria-hidden="true"
      >
        {symbol.slice(0, 3)}
      </span>
    );
  }

  return (
    <img
      src={image}
      alt=""
      width={size === "sm" ? 32 : 40}
      height={size === "sm" ? 32 : 40}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`${dimension} shrink-0 rounded-full bg-zinc-800`}
    />
  );
}
