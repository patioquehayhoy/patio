import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

const SPINNER_FRAMES = {
  dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  arc: ['◜', '◠', '◝', '◞', '◡', '◟'],
  line: ['/', '-', '\\', '|', '\\', '-'],
  pulse: ['·', '•', '●', '•'],
  patio: ['·', '•', '●', '•'],
} as const;

type SpinnerVariant = keyof typeof SPINNER_FRAMES;

type AgentSpinnerProps = {
  color?: string;
  size?: number;
  speed?: number;
  style?: StyleProp<ViewStyle>;
  variant?: SpinnerVariant;
};

export function AgentSpinner({
  color = '#1D1D1F',
  size = 24,
  speed = 90,
  style,
  variant = 'dots',
}: AgentSpinnerProps) {
  const frames = SPINNER_FRAMES[variant];
  const [frame, setFrame] = useState(0);
  const containerSize = useMemo(() => Math.max(32, Math.round(size * 1.65)), [size]);

  useEffect(() => {
    const id = setInterval(() => {
      setFrame((current) => (current + 1) % frames.length);
    }, speed);

    return () => clearInterval(id);
  }, [frames.length, speed]);

  return (
    <View style={[styles.container, { width: containerSize, height: containerSize }, style]}>
      <Text
        allowFontScaling={false}
        style={[styles.text, { color, fontSize: size, lineHeight: Math.round(size * 1.18) }]}>
        {frames[frame]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: 'Courier',
    fontWeight: '900',
    includeFontPadding: false,
    textAlign: 'center',
  },
});
