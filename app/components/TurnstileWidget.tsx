"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile: {
      render: (el: HTMLElement, opts: object) => string | number;
      remove: (id: string | number) => void;
      reset: (id: string | number) => void;
    };
  }
}

interface Props {
  siteKey: string;
  onSuccess: (token: string) => void;
  onExpired?: () => void;
  onError?: () => void;
}

export default function TurnstileWidget({ siteKey, onSuccess, onExpired, onError }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | number | null>(null);

  // Dùng ref để callback không cần vào deps của useEffect
  const cbRef = useRef({ onSuccess, onExpired, onError });
  useEffect(() => { cbRef.current = { onSuccess, onExpired, onError }; });

  useEffect(() => {
    let cancelled = false;

    function render() {
      if (cancelled || !containerRef.current || widgetIdRef.current !== null) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback:          (t: string) => cbRef.current.onSuccess(t),
        "expired-callback":()          => cbRef.current.onExpired?.(),
        "error-callback":  ()          => cbRef.current.onError?.(),
      });
    }

    if (window.turnstile) {
      render();
    } else if (!document.getElementById("cf-turnstile-script")) {
      const script = document.createElement("script");
      script.id = "cf-turnstile-script";
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = render;
      document.head.appendChild(script);
    } else {
      // Script đang tải — poll
      const poll = setInterval(() => {
        if (window.turnstile) { clearInterval(poll); render(); }
      }, 100);
      return () => { clearInterval(poll); cancelled = true; };
    }

    return () => {
      cancelled = true;
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey]);

  return <div ref={containerRef} />;
}
