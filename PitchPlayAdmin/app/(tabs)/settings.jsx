import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Switch, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import api, { BASE_URL } from '../../src/api';
import { colors, spacing, radius, fontSize } from '../../src/theme';

const Section = ({ title, icon, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={18} color={colors.accent} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

const SettingRow = ({ label, value, onEdit, sensitive }) => (
  <View style={styles.row}>
    <View style={{ flex: 1 }}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {sensitive ? (value ? '••••••••••••' : 'Not set') : (value || 'Not set')}
      </Text>
    </View>
    <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
      <Ionicons name="pencil" size={14} color={colors.info} />
    </TouchableOpacity>
  </View>
);

export default function SettingsScreen() {
  const router = useRouter();
  const [paySettings, setPaySettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Edit states
  const [rzpKeyId, setRzpKeyId] = useState('');
  const [rzpSecret, setRzpSecret] = useState('');
  const [upiId, setUpiId] = useState('');
  const [minWithdraw, setMinWithdraw] = useState('');
  const [maxWithdraw, setMaxWithdraw] = useState('');
  const [adminMobile, setAdminMobile] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/payment-settings');
      const s = res.data || {};
      setPaySettings(s);
      setRzpKeyId(s.razorpay_key_id || '');
      setRzpSecret(s.razorpay_key_secret || '');
      setUpiId(s.admin_upi_id || '');
      setMinWithdraw(String(s.min_withdrawal || 100));
      setMaxWithdraw(String(s.max_withdrawal || 50000));
      const userStr = await SecureStore.getItemAsync('admin_user');
      if (userStr) {
        const u = JSON.parse(userStr);
        setAdminMobile(u.mobile || '');
      }
    } catch (e) { console.warn(e.message); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setRefreshing(true); load(); };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await api.put('/admin/payment-settings', {
        razorpay_key_id: rzpKeyId.trim(),
        razorpay_key_secret: rzpSecret.trim(),
        admin_upi_id: upiId.trim(),
        min_withdrawal: parseFloat(minWithdraw) || 100,
        max_withdrawal: parseFloat(maxWithdraw) || 50000,
      });
      Alert.alert('✅ Saved', 'Payment settings updated successfully!');
      load();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const testRazorpay = async () => {
    setTesting(true);
    try {
      const res = await api.post('/admin/payment-settings/test-razorpay', {});
      if (res.data?.success) {
        Alert.alert('✅ Connected!', `Razorpay connected successfully!\n\nAccount: ${res.data.account_id || 'N/A'}`);
      } else {
        Alert.alert('❌ Failed', res.data?.error || 'Connection test failed');
      }
    } catch (e) {
      Alert.alert('❌ Error', e.response?.data?.detail || 'Razorpay test failed. Check your keys.');
    } finally {
      setTesting(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => {
          await SecureStore.deleteItemAsync('admin_token');
          await SecureStore.deleteItemAsync('admin_user');
          router.replace('/login');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: 60 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      {/* Server Info */}
      <Section title="Server Info" icon="server">
        <View style={styles.infoCard}>
          <Ionicons name="globe" size={20} color={colors.accent} />
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={styles.infoLabel}>Backend URL</Text>
            <Text style={styles.infoVal} numberOfLines={1}>{BASE_URL}</Text>
          </View>
        </View>
        <View style={[styles.infoCard, { marginTop: 8 }]}>
          <Ionicons name="person" size={20} color={colors.accent} />
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={styles.infoLabel}>Admin Mobile</Text>
            <Text style={styles.infoVal}>{adminMobile}</Text>
          </View>
        </View>
      </Section>

      {/* Razorpay Settings */}
      <Section title="Razorpay Payment Gateway" icon="card">
        <View style={styles.razorStatus}>
          <View style={[styles.statusDot, { backgroundColor: rzpKeyId ? colors.accent : colors.warning }]} />
          <Text style={[styles.statusText, { color: rzpKeyId ? colors.accent : colors.warning }]}>
            {rzpKeyId ? 'Live Mode' : 'Demo Mode (No Keys Set)'}
          </Text>
        </View>

        <Text style={styles.label}>Key ID</Text>
        <TextInput
          style={styles.input}
          placeholder="rzp_live_xxxxxxxxxxxx"
          placeholderTextColor={colors.textDim}
          value={rzpKeyId}
          onChangeText={setRzpKeyId}
          autoCapitalize="none"
        />

        <Text style={[styles.label, { marginTop: spacing.sm }]}>Key Secret</Text>
        <TextInput
          style={styles.input}
          placeholder="Your Razorpay secret key"
          placeholderTextColor={colors.textDim}
          value={rzpSecret}
          onChangeText={setRzpSecret}
          secureTextEntry
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.testBtn, testing && { opacity: 0.6 }]}
          onPress={testRazorpay}
          disabled={testing}
        >
          {testing ? <ActivityIndicator color={colors.text} size="small" /> : (
            <>
              <Ionicons name="wifi" size={16} color={colors.text} />
              <Text style={styles.testBtnText}>Test Connection</Text>
            </>
          )}
        </TouchableOpacity>
      </Section>

      {/* UPI Settings */}
      <Section title="UPI / Direct Deposit" icon="qr-code">
        <Text style={styles.label}>Admin UPI ID</Text>
        <TextInput
          style={styles.input}
          placeholder="yourupi@bank"
          placeholderTextColor={colors.textDim}
          value={upiId}
          onChangeText={setUpiId}
          autoCapitalize="none"
        />
        <Text style={styles.hint}>
          This UPI ID is shown to users on the deposit screen as the payment destination.
        </Text>
      </Section>

      {/* Withdrawal Limits */}
      <Section title="Withdrawal Limits" icon="trending-down">
        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Min Amount (₹)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={minWithdraw}
              onChangeText={setMinWithdraw}
              placeholderTextColor={colors.textDim}
            />
          </View>
          <View style={{ width: spacing.sm }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Max Amount (₹)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={maxWithdraw}
              onChangeText={setMaxWithdraw}
              placeholderTextColor={colors.textDim}
            />
          </View>
        </View>
      </Section>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveBtn, saving && { opacity: 0.6 }]}
        onPress={saveSettings}
        disabled={saving}
      >
        {saving ? <ActivityIndicator color={colors.white} /> : (
          <>
            <Ionicons name="save" size={18} color={colors.white} />
            <Text style={styles.saveBtnText}>Save All Settings</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Danger Zone */}
      <Section title="Account" icon="shield">
        <TouchableOpacity style={styles.dangerBtn} onPress={handleLogout}>
          <Ionicons name="log-out" size={18} color={colors.danger} />
          <Text style={styles.dangerText}>Logout from Admin App</Text>
        </TouchableOpacity>
      </Section>

      <Text style={styles.version}>PitchPlay Admin v1.0.0 · Built with ❤️</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' },
  section: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.cardBorder,
    padding: spacing.md, marginBottom: spacing.md,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  sectionTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '800' },
  infoCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bg, borderRadius: radius.md, padding: spacing.sm,
  },
  infoLabel: { color: colors.textMuted, fontSize: fontSize.xs },
  infoVal: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
  razorStatus: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md,
    padding: spacing.sm, backgroundColor: colors.bg, borderRadius: radius.sm,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: fontSize.sm, fontWeight: '600' },
  label: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600', marginBottom: 4 },
  input: {
    backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder,
    borderRadius: radius.md, padding: spacing.md, color: colors.text, fontSize: fontSize.md,
  },
  hint: { color: colors.textDim, fontSize: fontSize.xs, marginTop: 4, fontStyle: 'italic' },
  testBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.cardBorder, borderRadius: radius.md, height: 42, marginTop: spacing.md,
  },
  testBtnText: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
  twoCol: { flexDirection: 'row' },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.accent, borderRadius: radius.lg, height: 56, marginBottom: spacing.md,
  },
  saveBtnText: { color: colors.white, fontSize: fontSize.lg, fontWeight: '800' },
  dangerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderWidth: 1, borderColor: colors.danger, borderRadius: radius.md,
    padding: spacing.md, justifyContent: 'center',
  },
  dangerText: { color: colors.danger, fontWeight: '700', fontSize: fontSize.md },
  version: { textAlign: 'center', color: colors.textDim, fontSize: fontSize.xs, marginTop: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  rowLabel: { color: colors.textMuted, fontSize: fontSize.xs },
  rowValue: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
  editBtn: { padding: spacing.sm },
});
