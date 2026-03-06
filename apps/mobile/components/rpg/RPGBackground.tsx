/**
 * RPGBackground - Full screen background image for RPG scene
 */

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRPGStore } from '@/stores/rpg-store';

const { width, height } = Dimensions.get('window');

export function RPGBackground() {
  const backgroundUrl = useRPGStore(s => s.activeScene.backgroundUrl);

  if (!backgroundUrl) return null;

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: backgroundUrl }}
        style={styles.image}
        contentFit="cover"
        transition={500}
      />
      <View style={styles.overlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    width,
    height,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});
