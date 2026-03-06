/**
 * Sign In Screen
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CRTText } from '@/components/common/CRTText';
import { colors, spacing, radii } from '@/lib/theme';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = useCallback(async () => {
    if (!isLoaded) return;

    setLoading(true);
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(app)');
      } else {
        console.log('Sign in incomplete:', JSON.stringify(result, null, 2));
      }
    } catch (err: any) {
      Alert.alert('Sign In Failed', err?.errors?.[0]?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [isLoaded, email, password, signIn, setActive, router]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <View style={styles.header}>
          <CRTText size="xxl" color="amber" glow bold>
            SPEECH.FM
          </CRTText>
          <CRTText size="sm" color="amber" dim style={styles.subtitle}>
            VOICE AI TERMINAL
          </CRTText>
        </View>

        <View style={styles.form}>
          <CRTText size="xs" color="amber" dim style={styles.label}>
            EMAIL
          </CRTText>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="operator@speech.fm"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <CRTText size="xs" color="amber" dim style={styles.label}>
            PASSWORD
          </CRTText>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignIn}
            disabled={loading}
          >
            <CRTText size="md" color="amber" bold>
              {loading ? 'AUTHENTICATING...' : '> SIGN IN'}
            </CRTText>
          </TouchableOpacity>

          <Link href="/(auth)/sign-up" asChild>
            <TouchableOpacity style={styles.linkButton}>
              <CRTText size="sm" color="amber" dim>
                NO ACCOUNT? REGISTER
              </CRTText>
            </TouchableOpacity>
          </Link>
        </View>

        <View style={styles.footer}>
          <CRTText size="xs" color="amber" dim>
            ■ SECURE CONNECTION ESTABLISHED
          </CRTText>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  subtitle: {
    marginTop: spacing.xs,
    letterSpacing: 4,
  },
  form: {
    gap: spacing.sm,
  },
  label: {
    marginTop: spacing.sm,
    letterSpacing: 2,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    padding: spacing.md,
    color: colors.amber,
    fontFamily: 'SpaceMono-Regular',
    fontSize: 14,
  },
  button: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.amber,
    borderRadius: radii.sm,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  linkButton: {
    alignItems: 'center',
    padding: spacing.md,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
});
