import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Keyboard, PanResponder } from 'react-native';
import * as Haptics from 'expo-haptics';

import { SHEET_DISMISS_MS, SHEET_DRAG_ACTIVATION, SHEET_SPRING, shouldDismissSheet } from '@/lib/sheet-motion';

const SHEET_SPRING_JS = { ...SHEET_SPRING, useNativeDriver: false } as const;
type Detent = 'medium' | 'large';
type Options = {
  isFiltering: boolean;
  sheetMode: 'nearby' | 'saved' | null;
  searchActive: boolean;
  keyboardVisible: boolean;
  windowHeight: number;
  mediumGap: number;
  emptyResults: boolean;
  closeSheet: () => void;
  revealNavigation?: () => void;
};

// Logical dismissal and native removal are separate: navigation returns when
// the list is dismissed, and only the current exit may remove its native view.
export function useExploreSheet(options: Options) {
  const latest = useRef(options);
  latest.current = options;
  const [hidden, setHidden] = useState(false);
  const [presentation, setPresentation] = useState(0);
  const showSheet = (options.isFiltering && !hidden) || options.sheetMode !== null;
  // Navigation never sits behind the cards: it returns only when no sheet is up
  // and the search keyboard is closed.
  const showNavigation = !showSheet && !(options.searchActive && options.keyboardVisible);
  const revealNavigation = options.revealNavigation;
  const visible = useRef(showSheet);
  visible.current = showSheet;
  const [sheetView, setSheetView] = useState({ mounted: showSheet, filtering: options.isFiltering });
  const [sheetDetent, setSheetDetent] = useState<Detent>('medium');
  const detent = useRef<Detent>('medium');
  const restY = useRef(0);
  const dragStart = useRef(0);
  const dragging = useRef(false);
  const dragAxis = useRef<'vertical' | 'horizontal' | null>(null);
  const dismissing = useRef(false);
  const transition = useRef(0);
  const sheetTranslateY = useRef(new Animated.Value(0)).current;
  // Layout uses JS; translation uses the native driver, on separate views.
  const sheetTopExtra = useRef(new Animated.Value(0)).current;
  const sheetVisibleHeightRef = useRef(options.windowHeight);

  const reopenSheet = useCallback(() => {
    // Also handles focus/submit before a pending dismissal has rendered.
    transition.current += 1;
    sheetTranslateY.stopAnimation();
    dismissing.current = false;
    setHidden(false);
    setPresentation((value) => value + 1);
  }, [sheetTranslateY]);

  const dismissSheet = useCallback(() => {
    if (!visible.current || dismissing.current) return;
    dismissing.current = true;
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    // Preserve the submitted term and pins when hiding search results.
    if (latest.current.isFiltering) setHidden(true);
    else latest.current.closeSheet();
    latest.current.revealNavigation?.();
  }, []);

  const settleSheetToDetent = useCallback((next: Detent) => {
    restY.current = next === 'medium' ? latest.current.mediumGap : 0;
    detent.current = next;
    setSheetDetent(next);
    Animated.spring(sheetTopExtra, { toValue: restY.current, ...SHEET_SPRING_JS }).start();
    Animated.spring(sheetTranslateY, { toValue: 0, ...SHEET_SPRING }).start();
  }, [sheetTopExtra, sheetTranslateY]);

  const activateSheetHandle = useCallback(() => {
    if (!visible.current || dismissing.current) return;
    if (latest.current.isFiltering) {
      Haptics.selectionAsync().catch(() => {});
      settleSheetToDetent(detent.current === 'medium' ? 'large' : 'medium');
    } else dismissSheet();
  }, [dismissSheet, settleSheetToDetent]);

  const restorePosition = useCallback(() => {
    Animated.spring(sheetTopExtra, { toValue: restY.current, ...SHEET_SPRING_JS }).start();
    Animated.spring(sheetTranslateY, { toValue: 0, ...SHEET_SPRING }).start();
  }, [sheetTopExtra, sheetTranslateY]);

  // Stable handlers read current state rather than the first render's search.
  const sheetPanResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => visible.current && !dismissing.current,
    onPanResponderGrant: () => {
      dragging.current = true;
      dragAxis.current = null;
      sheetTopExtra.stopAnimation();
      sheetTranslateY.stopAnimation();
      dragStart.current = restY.current;
    },
    onPanResponderMove: (_event, gesture) => {
      if (!visible.current || dismissing.current) return;
      if (!dragAxis.current) {
        if (Math.max(Math.abs(gesture.dx), Math.abs(gesture.dy)) < SHEET_DRAG_ACTIVATION) return;
        dragAxis.current = Math.abs(gesture.dy) > Math.abs(gesture.dx) ? 'vertical' : 'horizontal';
      }
      if (dragAxis.current !== 'vertical') return;
      if (!latest.current.isFiltering) {
        sheetTranslateY.setValue(Math.max(0, gesture.dy));
        return;
      }
      const total = Math.max(0, dragStart.current + gesture.dy);
      sheetTopExtra.setValue(Math.min(total, latest.current.mediumGap));
      sheetTranslateY.setValue(Math.max(0, total - latest.current.mediumGap));
    },
    onPanResponderRelease: (_event, gesture) => {
      dragging.current = false;
      if (!visible.current || dismissing.current) return;
      if (dragAxis.current === null && Math.max(Math.abs(gesture.dx), Math.abs(gesture.dy)) < SHEET_DRAG_ACTIVATION) {
        activateSheetHandle();
        return;
      }
      if (dragAxis.current !== 'vertical') { restorePosition(); return; }
      if (!latest.current.isFiltering) {
        if (shouldDismissSheet(gesture.dy, gesture.vy)) dismissSheet();
        else restorePosition();
        return;
      }
      const total = Math.max(0, dragStart.current + gesture.dy);
      const medium = latest.current.mediumGap;
      if (total >= medium && shouldDismissSheet(total - medium, gesture.vy)) { dismissSheet(); return; }
      if (shouldDismissSheet(0, -gesture.vy)) { settleSheetToDetent('large'); return; }
      if (shouldDismissSheet(0, gesture.vy)) { settleSheetToDetent('medium'); return; }
      settleSheetToDetent(total > medium / 2 ? 'medium' : 'large');
    },
    onPanResponderTerminate: () => {
      dragging.current = false;
      if (visible.current && !dismissing.current) restorePosition();
    },
  }), [activateSheetHandle, dismissSheet, restorePosition, settleSheetToDetent, sheetTopExtra, sheetTranslateY]);

  useEffect(() => {
    if (!options.isFiltering) setHidden(false);
  }, [options.isFiltering]);

  useEffect(() => {
    if (showNavigation) revealNavigation?.();
  }, [showNavigation, revealNavigation]);

  useEffect(() => {
    const current = ++transition.current;
    sheetTopExtra.stopAnimation();
    sheetTranslateY.stopAnimation();
    if (showSheet) {
      dismissing.current = false;
      detent.current = 'medium';
      setSheetDetent('medium');
      restY.current = latest.current.isFiltering
        ? latest.current.emptyResults ? 0 : latest.current.mediumGap : 0;
      sheetTopExtra.setValue(restY.current);
      sheetTranslateY.setValue(latest.current.windowHeight);
      setSheetView({ mounted: true, filtering: latest.current.isFiltering });
      Animated.spring(sheetTranslateY, { toValue: 0, ...SHEET_SPRING }).start();
    } else {
      // Exactly one exit, including swipe. A cancelled or stale completion
      // cannot unmount a newer search or run after the screen is removed.
      Animated.timing(sheetTranslateY, {
        toValue: Math.max(120, sheetVisibleHeightRef.current),
        duration: SHEET_DISMISS_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && transition.current === current) setSheetView((value) => value.mounted ? { ...value, mounted: false } : value);
      });
    }
    return () => {
      transition.current += 1;
      sheetTranslateY.stopAnimation();
      sheetTopExtra.stopAnimation();
    };
  }, [showSheet, options.isFiltering, presentation, sheetTopExtra, sheetTranslateY]);

  useEffect(() => {
    if (!showSheet || !options.isFiltering || sheetDetent !== 'medium' || dragging.current || dismissing.current) return;
    restY.current = options.emptyResults ? 0 : options.mediumGap;
    Animated.spring(sheetTopExtra, { toValue: restY.current, ...SHEET_SPRING_JS }).start();
  }, [options.mediumGap, options.emptyResults, options.isFiltering, showSheet, sheetDetent, sheetTopExtra]);

  return {
    activateSheetHandle, dismissSheet, reopenSheet, sheetDetent, sheetPanResponder,
    sheetTopExtra, sheetTranslateY, sheetView, sheetVisibleHeightRef, showNavigation, showSheet,
  };
}
