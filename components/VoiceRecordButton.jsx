// components/VoiceRecordButton.jsx
// The large circular record control — the centrepiece of the Dictation screen.
// Idle: teal circle with a white microphone glyph.
// Recording: red circle with a white stop square, plus soft pulsing rings.
// This is a PRESENTATION component: it shows state and reports taps via onPress.
// The actual recording logic stays in the Dictation screen (we don't move it).

import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/theme";

export default function VoiceRecordButton({ recording, onPress, size = 96 }) {
  // Pulsing rings while recording.
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (recording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(0);
    }
  }, [recording]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

  return (
    <View style={styles.wrap}>
      {recording ? (
        <Animated.View
          style={[
            styles.ring,
            {
              width: size, height: size, borderRadius: size / 2,
              transform: [{ scale: ringScale }], opacity: ringOpacity,
            },
          ]}
        />
      ) : null}
      <Pressable onPress={onPress}>
        {({ pressed }) => (
          <View
            style={[
              styles.button,
              {
                width: size, height: size, borderRadius: size / 2,
                backgroundColor: recording ? colors.recording : colors.teal,
              },
              pressed && { opacity: 0.85 },
            ]}
          >
            {recording ? (
              <View style={styles.stopSquare} />
            ) : (
              <Text style={styles.mic}>🎤</Text>
            )}
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute", backgroundColor: colors.teal },
  button: { alignItems: "center", justifyContent: "center" },
  mic: { fontSize: 34 },
  stopSquare: { width: 28, height: 28, borderRadius: 6, backgroundColor: colors.onNavy },
});