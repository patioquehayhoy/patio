import { useEffect, useState } from 'react';
import { Keyboard, Platform, useWindowDimensions } from 'react-native';

// Use the keyboard's top edge, so Android adjustResize isn't counted twice.
export function useSheetKeyboard() {
  const { height } = useWindowDimensions();
  const [keyboardTop, setKeyboardTop] = useState<number | null>(null);
  useEffect(() => {
    const change = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidShow', (event) => {
      if (Platform.OS === 'ios') Keyboard.scheduleLayoutAnimation(event);
      setKeyboardTop(event.endCoordinates.height > 0 ? event.endCoordinates.screenY : null);
    });
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardTop(null));
    return () => { change.remove(); hide.remove(); };
  }, []);
  const keyboardInset = keyboardTop === null ? 0 : Math.max(0, height - keyboardTop);
  return { keyboardInset, keyboardVisible: keyboardTop !== null, viewportHeight: height - keyboardInset };
}
