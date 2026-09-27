import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

export type ScrollEdges = { top: boolean; bottom: boolean };

const EMPTY_EDGES: ScrollEdges = { top: false, bottom: false };
const EDGE_TOLERANCE = 1;

type ScrollMetrics = {
  viewKey: string | number;
  offset: number;
  viewport: number;
  content: number;
};

/** Use the same viewKey on the ScrollView to reset its native offset too. */
export function useScrollEdges(viewKey: string | number = 'default') {
  const metrics = useRef<ScrollMetrics>({ viewKey, offset: 0, viewport: 0, content: 0 });
  const currentEdges = useRef<ScrollEdges>(EMPTY_EDGES);
  const [edges, setEdges] = useState<ScrollEdges>(EMPTY_EDGES);

  const publish = useCallback((next: ScrollEdges) => {
    if (next.top === currentEdges.current.top && next.bottom === currentEdges.current.bottom) return;
    currentEdges.current = next;
    setEdges(next);
  }, []);

  useLayoutEffect(() => {
    metrics.current = { viewKey, offset: 0, viewport: 0, content: 0 };
    publish(EMPTY_EDGES);
  }, [publish, viewKey]);

  const update = useCallback((next: Partial<Omit<ScrollMetrics, 'viewKey'>>) => {
    // Ignore callbacks still in flight from the previous native scroll view.
    if (metrics.current.viewKey !== viewKey) return;
    const measured = { ...metrics.current, ...next };
    metrics.current = measured;
    if (measured.viewport <= 0 || measured.content <= 0) {
      publish(EMPTY_EDGES);
      return;
    }
    const maximumOffset = Math.max(0, measured.content - measured.viewport);
    const offset = Math.max(0, Math.min(measured.offset, maximumOffset));
    publish({
      top: offset > EDGE_TOLERANCE,
      bottom: maximumOffset - offset > EDGE_TOLERANCE,
    });
  }, [publish, viewKey]);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    update({ offset: contentOffset.y, viewport: layoutMeasurement.height, content: contentSize.height });
  }, [update]);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    update({ viewport: event.nativeEvent.layout.height });
  }, [update]);

  const onContentSizeChange = useCallback((_width: number, height: number) => {
    update({ content: height });
  }, [update]);

  // Hide the previous view's edges during the render before the layout reset.
  const visibleEdges = metrics.current.viewKey === viewKey ? edges : EMPTY_EDGES;
  return { ...visibleEdges, onScroll, onLayout, onContentSizeChange };
}
