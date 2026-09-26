import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import api from '../../src/api';
import { colors, spacing, radius, fontSize } from '../../src/theme';

const StatCard = ({ icon, label, value, color, sub }) => (
  <View style={[styles.statCard, { borderLeftColor: color || colors.accent }]}>
    <View style={[styles.statIcon, { backgroundColor: `${color || colors.accent}22` }]}>
      <Ionicons name={icon} size={22} color={color || colors.accent} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.statValue}>{value ?? '—'}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  </View>
);

const SectionHeader = ({ title, onRefresh }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {onRefresh && (
      <TouchableOpacity onPress={onRefresh}>
        <Ionicons name="refresh" size={16} color={colors.textMuted} />
      </TouchableOpacity>
    )}
  </View>
);

export default function DashboardScreen() {
  const [stats, setStats] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [statsRes] = await Promise.all([api.get('/admin/stats')]);
      setStats(statsRes.data);
      const userStr = await SecureStore.getItemAsync('admin_user');
      if (userStr) setAdminUser(JSON.parse(userStr));
    } catch (e) {
      console.warn('Dashboard load error', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const fmt = (n) => {
    if (n === undefined || n === null) return '—';
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
    return `₹${n}`;
  };

  const fmtNum = (n) => {
    if (n === undefined || n === null) return '—';
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return `${n}`;
  };

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? '🌅 Good morning' :
    now.getHours() < 17 ? '☀️ Good afternoon' :
    '🌙 Good evening';

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadText}>Loading dashboard…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Welcome Banner */}
      <View style={styles.banner}>
        <View>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.adminName}>{adminUser?.name || 'Admin'} 👋</Text>
          <Text style={styles.bannerSub}>PitchPlay Control Center</Text>
        </View>
        <View style={styles.liveDot}>
          <View style={styles.dot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      {/* Revenue Stats */}
      <SectionHeader title="💰 Revenue" onRefresh={onRefresh} />
      <View style={styles.statsGrid}>
        <StatCard
          icon="cash"
          label="Total Deposits"
          value={fmt(stats?.total_deposits)}
          color={colors.accent}
          sub={`${fmtNum(stats?.total_users)} users`}
        />
        <StatCard
          icon="wallet"
          label="Total Winnings Paid"
          value={fmt(stats?.total_winnings)}
          color={colors.gold}
        />
        <StatCard
          icon="trending-up"
          label="Platform Revenue"
          value={fmt((stats?.total_deposits || 0) - (stats?.total_winnings || 0))}
          color={colors.info}
        />
        <StatCard
          icon="time"
          label="Pending Withdrawals"
          value={fmt(stats?.pending_withdrawals_amount)}
          color={colors.warning}
          sub={`${stats?.pending_withdrawals_count || 0} requests`}
        />
      </View>

      {/* Contest Stats */}
      <SectionHeader title="🏆 Contests" />
      <View style={styles.statsGrid}>
        <StatCard
          icon="trophy"
          label="Active Contests"
          value={stats?.active_contests ?? 0}
          color={colors.accent}
        />
        <StatCard
          icon="checkmark-circle"
          label="Completed"
          value={stats?.completed_contests ?? 0}
          color={colors.textMuted}
        />
        <StatCard
          icon="people"
          label="Total Entries"
          value={fmtNum(stats?.total_entries)}
          color={colors.info}
        />
        <StatCard
          icon="star"
          label="Prize Pool"
          value={fmt(stats?.total_prize_pool)}
          color={colors.gold}
        />
      </View>

      {/* User Stats */}
      <SectionHeader title="👥 Users" />
      <View style={styles.statsGrid}>
        <StatCard icon="person-add" label="Total Users" value={fmtNum(stats?.total_users)} color={colors.accent} />
        <StatCard icon="shield-checkmark" label="Verified" value={fmtNum(stats?.verified_users)} color={colors.success} />
        <StatCard icon="ban" label="Blocked" value={stats?.blocked_users ?? 0} color={colors.danger} />
        <StatCard icon="gift" label="Referrals" value={fmtNum(stats?.total_referrals)} color={colors.gold} />
      </View>

      {/* Quick Actions */}
      <SectionHeader title="⚡ Quick Actions" />
      <View style={styles.actionGrid}>
        {[
          { icon: 'add-circle', label: 'New Contest', color: colors.accent, route: '/contests' },
          { icon: 'checkmark-done', label: 'Approve Payouts', color: colors.gold, route: '/withdrawals' },
          { icon: 'people', label: 'Manage Users', color: colors.info, route: '/users' },
          { icon: 'settings', label: 'Payment Settings', color: colors.warning, route: '/settings' },
        ].map((item) => (
          <TouchableOpacity key={item.label} style={[styles.actionCard, { borderColor: `${item.color}44` }]}>
            <Ionicons name={item.icon} size={26} color={item.color} />
            <Text style={[styles.actionLabel, { color: item.color }]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.lastUpdated}>
        Last updated: {now.toLocaleTimeString('en-IN')}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadText: { color: colors.textMuted, fontSize: fontSize.md },

  banner: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.cardBorder,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4, borderLeftColor: colors.accent,
  },
  greeting: { color: colors.textMuted, fontSize: fontSize.sm },
  adminName: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800' },
  bannerSub: { color: colors.textDim, fontSize: fontSize.xs, marginTop: 2 },
  liveDot: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  liveText: { color: colors.accent, fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 1.5 },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.sm, marginTop: spacing.md,
  },
  sectionTitle: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '700', letterSpacing: 0.5 },

  statsGrid: { gap: spacing.sm, marginBottom: spacing.sm },
  statCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.cardBorder,
    borderLeftWidth: 4,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  statIcon: { width: 44, height: 44, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  statValue: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800' },
  statLabel: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 1 },
  statSub: { color: colors.textDim, fontSize: fontSize.xs, marginTop: 2 },

  actionGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    width: '47%',
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionLabel: { fontSize: fontSize.sm, fontWeight: '700', textAlign: 'center' },

  lastUpdated: {
    textAlign: 'center',
    color: colors.textDim,
    fontSize: fontSize.xs,
    marginTop: spacing.md,
  },
});
