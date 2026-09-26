import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, Image,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../src/api';
import { colors, spacing, radius, fontSize } from '../src/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!mobile || !password) {
      Alert.alert('Error', 'Please enter mobile and password');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', {
        mobile,
        password,
        is_admin: true,
      });
      const { token, user } = res.data;
      if (!user?.is_admin) {
        Alert.alert('Access Denied', 'This app is for admins only.');
        return;
      }
      await SecureStore.setItemAsync('admin_token', token);
      await SecureStore.setItemAsync('admin_user', JSON.stringify(user));
      router.replace('/(tabs)/dashboard');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Check credentials.';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo / Title */}
        <View style={styles.logoBox}>
          <View style={styles.logoCircle}>
            <Ionicons name="cricket" size={48} color={colors.accent} />
          </View>
          <Text style={styles.appName}>PitchPlay</Text>
          <Text style={styles.appSub}>Admin Console</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>🔒 ADMIN ONLY</Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <Text style={styles.label}>Mobile Number</Text>
          <View style={styles.inputRow}>
            <Ionicons name="phone-portrait-outline" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="Enter admin mobile"
              placeholderTextColor={colors.textDim}
              value={mobile}
              onChangeText={setMobile}
              keyboardType="phone-pad"
              maxLength={10}
              autoComplete="tel"
            />
          </View>

          <Text style={[styles.label, { marginTop: spacing.md }]}>Password</Text>
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="Enter admin password"
              placeholderTextColor={colors.textDim}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              autoComplete="password"
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              <Ionicons
                name={showPass ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={18} color={colors.white} />
                <Text style={styles.btnText}>Login as Admin</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>PitchPlay Admin v1.0 · Secure Access</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  logoBox: { alignItems: 'center', marginBottom: spacing.xl },
  logoCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: colors.card,
    borderWidth: 2, borderColor: colors.accent,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.md,
  },
  appName: { fontSize: fontSize.xxxl, fontWeight: '800', color: colors.text, letterSpacing: 1 },
  appSub: { fontSize: fontSize.md, color: colors.textMuted, marginTop: 2 },
  badge: {
    marginTop: spacing.sm,
    backgroundColor: `${colors.danger}22`,
    borderWidth: 1, borderColor: colors.danger,
    borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 4,
  },
  badgeText: { color: colors.danger, fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 1.5 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.cardBorder,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  label: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600', marginBottom: spacing.xs },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.inputBg,
    borderWidth: 1, borderColor: colors.inputBorder,
    borderRadius: radius.md, paddingHorizontal: spacing.md, height: 52,
  },
  input: { flex: 1, color: colors.text, fontSize: fontSize.md },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.md, height: 52,
    marginTop: spacing.lg,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: colors.white, fontSize: fontSize.md, fontWeight: '700' },
  footer: { textAlign: 'center', color: colors.textDim, fontSize: fontSize.xs },
});
