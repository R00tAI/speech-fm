/**
 * VoiceControls - Connect/disconnect, mic toggle, status display
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Microphone, MicrophoneSlash, Phone, PhoneDisconnect } from 'phosphor-react-native';
import { useVoice } from './VoiceProvider';
import { useVoiceStore } from '@/stores/voice-store';
import { CRTText } from '@/components/common/CRTText';
import { colors, phosphorColors, spacing, radii } from '@/lib/theme';

export function VoiceControls() {
  const { startConversation, endConversation } = useVoice();
  const isConnected = useVoiceStore(s => s.isConnected);
  const isSpeaking = useVoiceStore(s => s.isSpeaking);
  const isListening = useVoiceStore(s => s.isListening);
  const isThinking = useVoiceStore(s => s.isThinking);
  const phosphorColor = useVoiceStore(s => s.phosphorColor);

  const palette = phosphorColors[phosphorColor];

  const handleConnect = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isConnected) {
      await endConversation();
    } else {
      await startConversation();
    }
  };

  const getStatusText = () => {
    if (!isConnected) return 'DISCONNECTED';
    if (isThinking) return 'PROCESSING...';
    if (isSpeaking) return 'SPEAKING';
    if (isListening) return 'LISTENING';
    return 'CONNECTED';
  };

  const getStatusColor = () => {
    if (!isConnected) return colors.textMuted;
    if (isThinking) return colors.blue;
    if (isSpeaking) return palette.primary;
    if (isListening) return colors.green;
    return palette.primary;
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
        <CRTText size="xs" color={phosphorColor} dim>
          {getStatusText()}
        </CRTText>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.connectButton,
            {
              borderColor: isConnected ? colors.error : palette.primary,
              backgroundColor: isConnected ? `${colors.error}15` : `${palette.primary}15`,
            },
          ]}
          onPress={handleConnect}
          activeOpacity={0.7}
        >
          {isConnected ? (
            <PhoneDisconnect size={28} color={colors.error} weight="bold" />
          ) : (
            <Phone size={28} color={palette.primary} weight="bold" />
          )}
        </TouchableOpacity>
      </View>

      <CRTText size="xs" color={phosphorColor} dim style={styles.hint}>
        {isConnected ? 'TAP TO DISCONNECT' : 'TAP TO CONNECT'}
      </CRTText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  connectButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {
    letterSpacing: 2,
  },
});
