"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true); // Ensure the theme is applied only on the client side
  }, []);

  if (!mounted) {
    return <>{children}</>; // Avoid hydration mismatch by rendering nothing during SSR
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
