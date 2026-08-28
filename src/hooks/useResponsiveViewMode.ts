import { useEffect, useState } from 'react';
import { useBreakpoint } from '@/hooks/useMediaQuery';

export type ViewMode = 'card' | 'table';

/**
 * Defaults to card on mobile/tablet and table on desktop.
 * Manual toggle is preserved until breakpoint family changes.
 */
export function useResponsiveViewMode(
  preferredDesktop: ViewMode = 'table',
): [ViewMode, (mode: ViewMode) => void] {
  const { isDesktop } = useBreakpoint();
  const [mode, setMode] = useState<ViewMode>(
    isDesktop ? preferredDesktop : 'card',
  );

  useEffect(() => {
    setMode(isDesktop ? preferredDesktop : 'card');
  }, [isDesktop, preferredDesktop]);

  return [mode, setMode];
}
