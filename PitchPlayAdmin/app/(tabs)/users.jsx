import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert, TextInput, Modal, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/api';
import { colors, spacing, radius, fontSize } from '../../src/theme';

const UserCard = ({ user, onBlock, onWallet }) => {
  const isBlocked = user.is_blocked;
  const statusColor = isBlocked ? colors.danger : user.is_verified ? colors.accent : colors.warning;

  return (
    <View style={[styles.card, { borderLeftColor: statusColor }]}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user.name?.[0] || user.mobile?.[0] || '?').toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text style={styles.name}>{user.name || 'Unknown'}</Text>
          <Text style={styles.mobile}>📱 {user.mobile}</Text>
          <View style={styles.tagRow}>
            {user.is_admin && <View style={[styles.tag, { borderColor: colors.gold, backgroundColor: `${colors.gold}22` }]}>
              <Text style={[styles.tagText, { color: colors.gold }]}>ADMIN</Text></View>}
            {user.is_verified && <View style={[styles.tag, { borderColor: colors.accent, backgroundColor: `${colors.accent}22` }]}>
              <Text style={[styles.tagText, { color: colors.accent }]}>✓ KYC</Text></View>}
            {isBlocked && <View style={[styles.tag, { borderColor: colors.danger, backgroundColor: `${colors.danger}22` }]}>
              <Text style={[styles.tagText, { color: colors.danger }]}>BLOCKED</Text></View>}
          </View>
        </View>
        <View style={styles.walletBox}>
          <Text style={styles.walletAmt}>₹{(user.wallet_balance || 0).toFixed(0)}</Text>
          <Text style={styles.walletLabel}>Wallet</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statVal}>{user.total_contests || 0}</Text>
          <Text style={styles.statLbl}>Contests</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statVal}>₹{(user.total_winnings || 0).toFixed(0)}</Text>
          <Text style={styles.statLbl}>Winnings</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statVal}>{user.referral_code || '—'}</Text>
          <Text style={styles.statLbl}>Ref Code</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statVal}>{user.upi_id || '—'}</Text>
          <Text style={styles.statLbl}>UPI</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: isBlocked ? colors.accent : colors.danger }]}
          onPress={() => onBlock(user)}
        >
          <Ionicons name={isBlocked ? 'checkmark-circle' : 'ban'} size={14} color={isBlocked ? colors.accent : colors.danger} />
          <Text style={[styles.actionText, { color: isBlocked ? colors.accent : colors.danger }]}>
            {isBlocked ? 'Unblock' : 'Block'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { borderColor: colors.gold }]} onPress={() => onWallet(user)}>
          <Ionicons name="wallet" size={14} color={colors.gold} />
          <Text style={[styles.actionText, { color: colors.gold }]}>Adjust Wallet</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const WalletModal = ({ user, visible, onClose, onDone }) => {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [type, setType] = useState('credit');
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { Alert.alert('Error', 'Enter a valid amount'); return; }
    setLoading(true);
    try {
      await api.post(`/admin/users/${user._id}/wallet`, {
        action: type,
        amount: amt,
        note: note || `Admin ${type}`,
      });
      Alert.alert('✅ Done', `Wallet ${type}ed ₹${amt} for ${user.name}`);
      setAmount(''); setNote(''); onDone(); onClose();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>💰 Adjust Wallet</Text>
          <Text style={styles.modalSub}>{user?.name} — Current: ₹{(user?.wallet_balance || 0).toFixed(0)}</Text>

          <View style={styles.typeRow}>
            {['credit', 'debit'].map(t => (
              <TouchableOpacity key={t}
                style={[styles.typeBtn, type === t && styles.typeBtnActive]}
                onPress={() => setType(t)}>
                <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextActive]}>
                  {t === 'credit' ? '➕ Credit' : '➖ Debit'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>Amount (₹)</Text>
          <TextInput style={styles.inp} placeholder="e.g. 100" placeholderTextColor={colors.textDim}
            value={amount} onChangeText={setAmount} keyboardType="numeric" />

          <Text style={styles.inputLabel}>Note</Text>
          <TextInput style={styles.inp} placeholder="Admin adjustment reason" placeholderTextColor={colors.textDim}
            value={note} onChangeText={setNote} />

          <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handle} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Apply</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function UsersScreen() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [walletUser, setWalletUser] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data || []);
    } catch (e) { console.warn(e.message); }
    finally { setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setRefreshing(true); load(); };

  const handleBlock = (user) => {
    const isBlocked = user.is_blocked;
    Alert.alert(
      isBlocked ? '✅ Unblock User' : '🚫 Block User',
      `${isBlocked ? 'Unblock' : 'Block'} ${user.name || user.mobile}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isBlocked ? 'Unblock' : 'Block',
          style: isBlocked ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await api.post(`/admin/users/${user._id}/block`, { blocked: !isBlocked });
              load();
            } catch (e) {
              Alert.alert('Error', e.response?.data?.detail || 'Failed');
            }
          },
        },
      ]
    );
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || u.name?.toLowerCase().includes(q) || u.mobile?.includes(q) || u.upi_id?.includes(q);
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search name, mobile, UPI..."
          placeholderTextColor={colors.textDim}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={styles.resultCount}>{filtered.length} users</Text>

      <FlatList
        data={filtered}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <UserCard user={item} onBlock={handleBlock} onWallet={setWalletUser} />
        )}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={56} color={colors.textDim} />
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
      />

      {walletUser && (
        <WalletModal user={walletUser} visible={!!walletUser} onClose={() => setWalletUser(null)} onDone={load} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.card, margin: spacing.md,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder,
    paddingHorizontal: spacing.md, height: 48,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: fontSize.md },
  resultCount: { color: colors.textDim, fontSize: fontSize.xs, marginHorizontal: spacing.md, marginBottom: 4 },
  card: {
    backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.cardBorder, borderLeftWidth: 4, padding: spacing.md,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: `${colors.accent}33`, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: colors.accent, fontSize: fontSize.lg, fontWeight: '800' },
  name: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  mobile: { color: colors.textMuted, fontSize: fontSize.sm },
  tagRow: { flexDirection: 'row', gap: 4, marginTop: 4 },
  tag: { borderWidth: 1, borderRadius: radius.full, paddingHorizontal: 6, paddingVertical: 1 },
  tagText: { fontSize: 10, fontWeight: '700' },
  walletBox: { alignItems: 'flex-end' },
  walletAmt: { color: colors.gold, fontSize: fontSize.lg, fontWeight: '800' },
  walletLabel: { color: colors.textDim, fontSize: fontSize.xs },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.cardBorder },
  stat: { alignItems: 'center' },
  statVal: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  statLbl: { color: colors.textDim, fontSize: 10 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 5 },
  actionText: { fontSize: fontSize.xs, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60, gap: spacing.sm },
  emptyText: { color: colors.textMuted, fontSize: fontSize.md },
  // Modal
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.lg },
  modal: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.lg },
  modalTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800', marginBottom: 4 },
  modalSub: { color: colors.textMuted, fontSize: fontSize.sm, marginBottom: spacing.md },
  typeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  typeBtn: { flex: 1, padding: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center' },
  typeBtnActive: { borderColor: colors.accent, backgroundColor: `${colors.accent}22` },
  typeBtnText: { color: colors.textMuted, fontWeight: '600', fontSize: fontSize.sm },
  typeBtnTextActive: { color: colors.accent },
  inputLabel: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600', marginBottom: 4, marginTop: spacing.sm },
  inp: {
    backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder,
    borderRadius: radius.md, padding: spacing.md, color: colors.text, fontSize: fontSize.md,
  },
  btn: { backgroundColor: colors.accent, borderRadius: radius.md, height: 48, justifyContent: 'center', alignItems: 'center', marginTop: spacing.md },
  btnText: { color: colors.white, fontSize: fontSize.md, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', marginTop: spacing.sm, padding: spacing.sm },
  cancelText: { color: colors.textMuted, fontSize: fontSize.sm },
});
