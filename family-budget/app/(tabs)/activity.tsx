import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  Card,
  Screen,
  Segmented,
  Subtitle,
  Title,
  useThemeColors,
} from '@/components/budget/ui';
import { useBudget } from '@/src/context/BudgetContext';
import { formatMoney } from '@/src/lib/money';

export default function ActivityScreen() {
  const colors = useThemeColors();
  const { transactions, people, personFilter, setPersonFilter, refreshing, refresh, period } =
    useBudget();
  const [typeFilter, setTypeFilter] = useState('All');

  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      if (t.type) set.add(simplifyType(t.type));
    });
    return ['All', ...Array.from(set)];
  }, [transactions]);

  const filtered = transactions.filter((t) => {
    if (typeFilter === 'All') return true;
    return simplifyType(t.type) === typeFilter;
  });

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.tint} />}>
        <Title>Activity</Title>
        <Subtitle>
          {filtered.length} transactions · {period.name}
        </Subtitle>

        <Segmented
          options={['All', ...people]}
          value={personFilter}
          onChange={setPersonFilter}
        />
        <Segmented options={typeOptions} value={typeFilter} onChange={setTypeFilter} />

        <View style={{ gap: 8, marginBottom: 24 }}>
          {filtered.map((txn, idx) => (
            <Card key={`${txn.date}-${txn.category}-${txn.amount}-${idx}`}>
              <View style={styles.row}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={[styles.cat, { color: colors.text }]} numberOfLines={1}>
                    {txn.category || 'Untitled'}
                  </Text>
                  <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
                    {txn.date} · {simplifyType(txn.type)}
                    {txn.person ? ` · ${stripEmoji(txn.person)}` : ''}
                    {txn.pendingSync ? ' · pending sync' : ''}
                  </Text>
                  {txn.notes ? (
                    <Text style={[styles.notes, { color: colors.textSecondary }]} numberOfLines={2}>
                      {txn.notes}
                    </Text>
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.amount,
                    {
                      color: txn.type.includes('Income') || txn.type.includes('Transfer In')
                        ? colors.success
                        : colors.text,
                    },
                  ]}>
                  {txn.type.includes('Income') || txn.type.includes('Transfer In')
                    ? formatMoney(txn.amount, { signed: true })
                    : formatMoney(txn.amount)}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

function simplifyType(type: string) {
  if (type.includes('Variable')) return 'Variable';
  if (type.includes('Fixed')) return 'Fixed';
  if (type.includes('Savings')) return 'Savings';
  if (type.includes('Debts')) return 'Debt';
  if (type.includes('Income')) return 'Income';
  if (type.includes('Transfer')) return 'Transfer';
  return type || 'Other';
}

function stripEmoji(s: string) {
  return s.replace(/[^\w\s&'.-]/g, '').trim() || s;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  cat: { fontFamily: 'DMSans_700Bold', fontSize: 15 },
  meta: { fontFamily: 'DMSans_400Regular', fontSize: 12, marginTop: 3 },
  notes: { fontFamily: 'DMSans_400Regular', fontSize: 12, marginTop: 4 },
  amount: { fontFamily: 'DMSans_700Bold', fontSize: 15 },
});
