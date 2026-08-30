import { useEffect, useState } from 'react';
import { useBreakpoint } from '@/hooks/useMediaQuery';

export type ViewMode = 'card' | 'table';

export type ResponsiveViewModeControls = {
  /** Table view is blocked on phones (< 768px). */
  allowTable: boolean;
  isMobile: boolean;
};

/**
 * Mobile (<768): always card — table forbidden.
 * Tablet/Desktop: defaults to preferredDesktop; user can toggle.
 */
export function useResponsiveViewMode(
  preferredDesktop: ViewMode = 'table',
): [ViewMode, (mode: ViewMode) => void, ResponsiveViewModeControls] {
  const { isMobile } = useBreakpoint();
  const [mode, setMode] = useState<ViewMode>(
    isMobile ? 'card' : preferredDesktop,
  );

  useEffect(() => {
    if (isMobile) {
      setMode('card');
      return;
    }
    setMode(preferredDesktop);
  }, [isMobile, preferredDesktop]);

  const setViewMode = (next: ViewMode) => {
    if (isMobile && next === 'table') return;
    setMode(next);
  };

  return [
    mode,
    setViewMode,
    { allowTable: !isMobile, isMobile },
  ];
}
