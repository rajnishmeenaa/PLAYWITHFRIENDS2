import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert, Modal, TextInput, ScrollView,
  ActivityIndicator, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/api';
import { colors, spacing, radius, fontSize } from '../../src/theme';

const STATUS_COLORS = {
  active: colors.accent,
  completed: colors.textMuted,
  cancelled: colors.danger,
  settling: colors.gold,
};

const ContestCard = ({ contest, onSettle, onEdit, onDelete }) => {
  const statusColor = STATUS_COLORS[contest.status] || colors.textMuted;
  const filled = contest.entry_count || 0;
  const max = contest.max_entries || 1;
  const fillPct = Math.min((filled / max) * 100, 100);

  return (
    <View style={[styles.card, { borderLeftColor: statusColor }]}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>{contest.title}</Text>
          <View style={styles.tagRow}>
            <View style={[styles.tag, { backgroundColor: `${statusColor}22`, borderColor: statusColor }]}>
              <Text style={[styles.tagText, { color: statusColor }]}>{contest.status?.toUpperCase()}</Text>
            </View>
            <Text style={styles.cardSub}>
              {contest.contest_type === 'solo' ? '👤 Solo' : '👥 H2H'} · ₹{contest.entry_fee} entry
            </Text>
          </View>
        </View>
        <View style={styles.prizeBox}>
          <Text style={styles.prizeAmount}>₹{contest.prize_pool}</Text>
          <Text style={styles.prizeLabel}>Pool</Text>
        </View>
      </View>

      {/* Fill bar */}
      <View style={styles.fillBar}>
        <View style={[styles.fillProgress, { width: `${fillPct}%`, backgroundColor: statusColor }]} />
      </View>
      <Text style={styles.fillText}>{filled}/{max} entries ({fillPct.toFixed(0)}%)</Text>

      {/* Match info */}
      {contest.match_name && (
        <Text style={styles.matchName}>🏏 {contest.match_name}</Text>
      )}

      {/* Actions */}
      <View style={styles.cardActions}>
        {contest.status === 'active' && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: `${colors.gold}22`, borderColor: colors.gold }]}
            onPress={() => onSettle(contest)}>
            <Ionicons name="trophy" size={14} color={colors.gold} />
            <Text style={[styles.actionBtnText, { color: colors.gold }]}>Settle</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: `${colors.info}22`, borderColor: colors.info }]}
          onPress={() => onEdit(contest)}>
          <Ionicons name="pencil" size={14} color={colors.info} />
          <Text style={[styles.actionBtnText, { color: colors.info }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: `${colors.danger}22`, borderColor: colors.danger }]}
          onPress={() => onDelete(contest)}>
          <Ionicons name="trash" size={14} color={colors.danger} />
          <Text style={[styles.actionBtnText, { color: colors.danger }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const CreateContestModal = ({ visible, onClose, onCreated }) => {
  const [form, setForm] = useState({
    title: '', match_name: '', contest_type: 'solo',
    entry_fee: '', prize_pool: '', max_entries: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleCreate = async () => {
    if (!form.title || !form.entry_fee || !form.prize_pool || !form.max_entries) {
      Alert.alert('Missing Fields', 'Please fill title, entry fee, prize pool, and max entries.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/contests', {
        ...form,
        entry_fee: parseFloat(form.entry_fee),
        prize_pool: parseFloat(form.prize_pool),
        max_entries: parseInt(form.max_entries),
      });
      Alert.alert('✅ Created', 'Contest created successfully!');
      onCreated();
      onClose();
      setForm({ title: '', match_name: '', contest_type: 'solo', entry_fee: '', prize_pool: '', max_entries: '', description: '' });
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to create contest');
    } finally {
      setLoading(false);
    }
  };

  const F = ({ label, k, keyType, placeholder }) => (
    <View style={{ marginBottom: spacing.sm }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder || label}
        placeholderTextColor={colors.textDim}
        value={form[k]}
        onChangeText={(v) => set(k, v)}
        keyboardType={keyType || 'default'}
      />
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>➕ New Contest</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md }}>
          <F label="Title *" k="title" placeholder="e.g. IPL Grand League" />
          <F label="Match Name" k="match_name" placeholder="e.g. MI vs CSK" />
          <F label="Description" k="description" />

          <Text style={styles.label}>Type</Text>
          <View style={styles.typeRow}>
            {['solo', 'h2h'].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeBtn, form.contest_type === t && styles.typeBtnActive]}
                onPress={() => set('contest_type', t)}
              >
                <Text style={[styles.typeBtnText, form.contest_type === t && styles.typeBtnTextActive]}>
                  {t === 'solo' ? '👤 Solo' : '👥 H2H'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <F label="Entry Fee (₹) *" k="entry_fee" keyType="numeric" placeholder="e.g. 50" />
          <F label="Prize Pool (₹) *" k="prize_pool" keyType="numeric" placeholder="e.g. 500" />
          <F label="Max Entries *" k="max_entries" keyType="numeric" placeholder="e.g. 10" />

          <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleCreate} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.white} /> : (
              <>
                <Ionicons name="add-circle" size={18} color={colors.white} />
                <Text style={styles.btnText}>Create Contest</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default function ContestsScreen() {
  const [contests, setContests] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    try {
      const res = await api.get('/contests');
      setContests(res.data || []);
    } catch (e) {
      console.warn('Contests load error', e.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setRefreshing(true); load(); };

  const handleSettle = (contest) => {
    Alert.alert(
      '🏆 Settle Contest',
      `Settle "${contest.title}"? This will declare a winner and distribute prizes.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Settle Now',
          style: 'default',
          onPress: async () => {
            try {
              await api.post(`/contests/${contest._id}/settle`, {});
              Alert.alert('✅ Settled', 'Contest settled and prizes distributed!');
              load();
            } catch (e) {
              Alert.alert('Error', e.response?.data?.detail || 'Failed to settle');
            }
          },
        },
      ]
    );
  };

  const handleDelete = (contest) => {
    Alert.alert(
      '🗑️ Delete Contest',
      `Delete "${contest.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/contests/${contest._id}`);
              load();
            } catch (e) {
              Alert.alert('Error', e.response?.data?.detail || 'Failed to delete');
            }
          },
        },
      ]
    );
  };

  const filters = ['all', 'active', 'completed', 'cancelled'];
  const filtered = filter === 'all' ? contests : contests.filter(c => c.status === filter);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Filter chips */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, padding: spacing.sm }}>
          {filters.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, filter === f && styles.chipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)} {f === 'all' ? `(${contests.length})` : `(${contests.filter(c => c.status === f).length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ContestCard
            contest={item}
            onSettle={handleSettle}
            onEdit={() => Alert.alert('Edit', 'Edit feature coming soon')}
            onDelete={handleDelete}
          />
        )}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="trophy-outline" size={56} color={colors.textDim} />
            <Text style={styles.emptyText}>No contests found</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowCreate(true)}>
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>

      <CreateContestModal visible={showCreate} onClose={() => setShowCreate(false)} onCreated={load} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.cardBorder, borderLeftWidth: 4,
    padding: spacing.md,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs },
  cardTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '700', marginBottom: 4 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tag: { borderWidth: 1, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  tagText: { fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 0.8 },
  cardSub: { color: colors.textMuted, fontSize: fontSize.xs },
  prizeBox: { alignItems: 'flex-end' },
  prizeAmount: { color: colors.gold, fontSize: fontSize.lg, fontWeight: '800' },
  prizeLabel: { color: colors.textDim, fontSize: fontSize.xs },
  fillBar: { height: 4, backgroundColor: colors.cardBorder, borderRadius: 2, marginVertical: spacing.xs },
  fillProgress: { height: 4, borderRadius: 2 },
  fillText: { color: colors.textDim, fontSize: fontSize.xs, marginBottom: spacing.xs },
  matchName: { color: colors.textMuted, fontSize: fontSize.xs, marginBottom: spacing.sm },
  cardActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 5 },
  actionBtnText: { fontSize: fontSize.xs, fontWeight: '600' },
  filterRow: { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full, backgroundColor: colors.cardBorder },
  chipActive: { backgroundColor: colors.accent },
  chipText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600' },
  chipTextActive: { color: colors.white },
  empty: { alignItems: 'center', paddingTop: 60, gap: spacing.sm },
  emptyText: { color: colors.textMuted, fontSize: fontSize.md },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center',
    elevation: 8, shadowColor: colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8,
  },
  // Modal styles
  modalContainer: { flex: 1, backgroundColor: colors.bg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  modalTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '800' },
  label: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600', marginBottom: 4 },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.inputBorder,
    borderRadius: radius.md, padding: spacing.md, color: colors.text, fontSize: fontSize.md,
  },
  typeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  typeBtn: { flex: 1, padding: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center' },
  typeBtnActive: { borderColor: colors.accent, backgroundColor: `${colors.accent}22` },
  typeBtnText: { color: colors.textMuted, fontWeight: '600' },
  typeBtnTextActive: { color: colors.accent },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.accent, borderRadius: radius.md, height: 52, marginTop: spacing.md,
  },
  btnText: { color: colors.white, fontSize: fontSize.md, fontWeight: '700' },
});
