import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/api';
import { colors, spacing, radius, fontSize } from '../../src/theme';

const STATUS_COLORS = {
  pending: colors.warning,
  approved: colors.accent,
  rejected: colors.danger,
  processing: colors.info,
};

const WithdrawalCard = ({ item, onApprove, onReject }) => {
  const statusColor = STATUS_COLORS[item.status] || colors.textMuted;
  const isPending = item.status === 'pending';
  const date = new Date(item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <View style={[styles.card, { borderLeftColor: statusColor }]}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{item.user_name || item.user_mobile || 'User'}</Text>
          <Text style={styles.upi}>🏦 {item.upi_id || 'No UPI'}</Text>
          <Text style={styles.date}>📅 {date}</Text>
        </View>
        <View style={styles.amtBox}>
          <Text style={styles.amt}>₹{item.amount}</Text>
          <View style={[styles.badge, { borderColor: statusColor, backgroundColor: `${statusColor}22` }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>{item.status?.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {item.note && <Text style={styles.note}>💬 {item.note}</Text>}

      {isPending && (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.btn, styles.btnApprove]} onPress={() => onApprove(item)}>
            <Ionicons name="checkmark-circle" size={16} color={colors.white} />
            <Text style={styles.btnText}>Approve & Pay</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnReject]} onPress={() => onReject(item)}>
            <Ionicons name="close-circle" size={16} color={colors.white} />
            <Text style={styles.btnText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status === 'approved' && (
        <View style={styles.approvedBanner}>
          <Ionicons name="checkmark-circle" size={14} color={colors.accent} />
          <Text style={styles.approvedText}>Paid via UPI · {item.processed_at ? new Date(item.processed_at).toLocaleDateString('en-IN') : ''}</Text>
        </View>
      )}
    </View>
  );
};

const SummaryBanner = ({ withdrawals }) => {
  const pending = withdrawals.filter(w => w.status === 'pending');
  const total = pending.reduce((s, w) => s + (w.amount || 0), 0);

  return (
    <View style={styles.summary}>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryVal}>{pending.length}</Text>
        <Text style={styles.summaryLbl}>Pending</Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryItem}>
        <Text style={[styles.summaryVal, { color: colors.gold }]}>₹{total.toFixed(0)}</Text>
        <Text style={styles.summaryLbl}>To Pay</Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryItem}>
        <Text style={styles.summaryVal}>{withdrawals.filter(w => w.status === 'approved').length}</Text>
        <Text style={styles.summaryLbl}>Approved</Text>
      </View>
    </View>
  );
};

export default function WithdrawalsScreen() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState({});

  const load = useCallback(async () => {
    try {
      const res = await api.get('/withdrawals');
      setWithdrawals(res.data || []);
    } catch (e) { console.warn(e.message); }
    finally { setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setRefreshing(true); load(); };

  const handleDecision = async (item, action, reason = '') => {
    setLoading(prev => ({ ...prev, [item._id]: true }));
    try {
      await api.post(`/withdrawals/${item._id}/decision`, {
        action,
        note: reason || (action === 'approved' ? 'Approved by admin' : 'Rejected by admin'),
      });
      if (action === 'approved') {
        Alert.alert(
          '✅ Approved!',
          `₹${item.amount} marked as paid to ${item.upi_id}.\n\nPlease send the payment via your UPI app:\n📱 ${item.upi_id}`,
          [{ text: 'OK', onPress: load }]
        );
      } else {
        load();
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed');
    } finally {
      setLoading(prev => ({ ...prev, [item._id]: false }));
    }
  };

  const handleApprove = (item) => {
    Alert.alert(
      '✅ Approve Withdrawal',
      `Pay ₹${item.amount} to:\n\n👤 ${item.user_name || 'User'}\n🏦 ${item.upi_id}\n\nRemember to actually send the UPI payment!`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark as Paid', onPress: () => handleDecision(item, 'approved') },
      ]
    );
  };

  const handleReject = (item) => {
    Alert.alert(
      '❌ Reject Withdrawal',
      `Reject ₹${item.amount} request from ${item.user_name || 'User'}? The amount will be returned to their wallet.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reject', style: 'destructive', onPress: () => handleDecision(item, 'rejected') },
      ]
    );
  };

  const filters = ['pending', 'approved', 'rejected', 'all'];
  const filtered = filter === 'all' ? withdrawals : withdrawals.filter(w => w.status === filter);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SummaryBanner withdrawals={withdrawals} />

      {/* Filter */}
      <View style={styles.filterRow}>
        {filters.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filter === f && styles.chipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          loading[item._id]
            ? <ActivityIndicator color={colors.accent} style={{ marginVertical: 20 }} />
            : <WithdrawalCard item={item} onApprove={handleApprove} onReject={handleReject} />
        )}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="wallet-outline" size={56} color={colors.textDim} />
            <Text style={styles.emptyText}>No withdrawals in this category</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row', backgroundColor: colors.card,
    borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
    paddingVertical: spacing.md,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryVal: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800' },
  summaryLbl: { color: colors.textMuted, fontSize: fontSize.xs },
  summaryDivider: { width: 1, backgroundColor: colors.cardBorder },
  filterRow: {
    flexDirection: 'row', gap: spacing.sm, padding: spacing.sm,
    backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
  },
  chip: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: radius.full, backgroundColor: colors.cardBorder },
  chipActive: { backgroundColor: colors.accent },
  chipText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600' },
  chipTextActive: { color: colors.white },
  card: {
    backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.cardBorder, borderLeftWidth: 4, padding: spacing.md,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  userName: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  upi: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 2 },
  date: { color: colors.textDim, fontSize: fontSize.xs, marginTop: 2 },
  amtBox: { alignItems: 'flex-end', gap: 4 },
  amt: { color: colors.gold, fontSize: fontSize.xl, fontWeight: '800' },
  badge: { borderWidth: 1, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 0.8 },
  note: { color: colors.textMuted, fontSize: fontSize.xs, fontStyle: 'italic', marginBottom: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: radius.md, height: 40 },
  btnApprove: { backgroundColor: colors.accent },
  btnReject: { backgroundColor: colors.danger },
  btnText: { color: colors.white, fontSize: fontSize.sm, fontWeight: '700' },
  approvedBanner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  approvedText: { color: colors.accent, fontSize: fontSize.xs },
  empty: { alignItems: 'center', paddingTop: 60, gap: spacing.sm },
  emptyText: { color: colors.textMuted, fontSize: fontSize.md },
});
