import { useCallback, useEffect, useState } from "react";

export function resolveRoutePath<T extends string>(pathname: string, allowed: readonly T[], fallback: T): T {
  return allowed.includes(pathname as T) ? (pathname as T) : fallback;
}

function mevcutYol<T extends string>(allowed: readonly T[], fallback: T): T {
  if (typeof window === "undefined") return fallback;
  return resolveRoutePath(window.location.pathname, allowed, fallback);
}

/**
 * State tabanlı panel sekmesini URL ile senkron tutar.
 * İlk açılışta mevcut pathname okunur; panel içi geçişlerde pushState,
 * tarayıcı geri/ileri hareketlerinde popstate kullanılır.
 */
export function useBrowserRoute<T extends string>(allowed: readonly T[], fallback: T) {
  const [path, setPath] = useState<T>(() => mevcutYol(allowed, fallback));

  useEffect(() => {
    function geriIleriDinle() {
      setPath(mevcutYol(allowed, fallback));
    }

    window.addEventListener("popstate", geriIleriDinle);
    return () => window.removeEventListener("popstate", geriIleriDinle);
  }, [allowed, fallback]);

  const navigate = useCallback((next: T) => {
    if (typeof window !== "undefined" && window.location.pathname !== next) {
      window.history.pushState({}, "", next);
    }
    setPath(next);
  }, []);

  return [path, navigate] as const;
}
