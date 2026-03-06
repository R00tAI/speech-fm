/**
 * App Layout - Tab Navigator
 * Voice | RPG | Settings
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { Microphone, Sword, GearSix } from 'phosphor-react-native';
import { colors } from '@/lib/theme';

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.amber,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: 'SpaceMono-Regular',
          fontSize: 10,
          letterSpacing: 1,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Voice',
          tabBarIcon: ({ color, size }) => (
            <Microphone size={size} color={color} weight="bold" />
          ),
        }}
      />
      <Tabs.Screen
        name="rpg"
        options={{
          title: 'RPG',
          tabBarIcon: ({ color, size }) => (
            <Sword size={size} color={color} weight="bold" />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <GearSix size={size} color={color} weight="bold" />
          ),
        }}
      />
    </Tabs>
  );
}
