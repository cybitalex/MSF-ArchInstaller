import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Card,
  HeroStat,
  MetricChip,
  Screen,
  Segmented,
  Subtitle,
  Title,
  useThemeColors,
} from '@/components/budget/ui';
import { useBudget } from '@/src/context/BudgetContext';
import { daysLeftInPeriod, formatMoney } from '@/src/lib/money';

export default function HomeScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const {
    loading,
    refreshing,
    error,
    source,
    period,
    periods,
    setActivePeriod,
    personFilter,
    setPersonFilter,
    people,
    refresh,
  } = useBudget();

  const daysLeft = daysLeftInPeriod(period.endDate);
  const personOptions = ['All', ...people];

  if (loading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={colors.tint} size="large" />
        <Text style={{ color: colors.textSecondary, marginTop: 12, fontFamily: 'DMSans_400Regular' }}>
          Loading budget…
        </Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.tint} />}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Title>Family Budget</Title>
            <Subtitle>
              {period.startDate} – {period.endDate}
              {daysLeft != null ? ` · ${daysLeft} day${daysLeft === 1 ? '' : 's'} left` : ''}
            </Subtitle>
          </View>
          <Pressable
            onPress={() => router.push('/(tabs)/add')}
            style={({ pressed }) => [
              styles.addBtn,
              { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1 },
            ]}>
            <SymbolView
              name={{ ios: 'plus', android: 'add', web: 'add' }}
              tintColor="#fff"
              size={22}
            />
          </Pressable>
        </View>

        <Segmented
          options={periods.map((p) => p.name)}
          value={period.name}
          onChange={setActivePeriod}
        />
        <Segmented options={personOptions} value={personFilter} onChange={setPersonFilter} />

        {error ? (
          <Card style={[styles.banner, { borderColor: colors.warning }]}>
            <Text style={{ color: colors.warning, fontFamily: 'DMSans_500Medium' }}>
              Live sync issue — showing {source} data
            </Text>
            <Text style={{ color: colors.textSecondary, fontFamily: 'DMSans_400Regular', marginTop: 4 }}>
              {error}
            </Text>
          </Card>
        ) : (
          <Text style={[styles.source, { color: colors.textSecondary }]}>
            {source === 'live' ? 'Synced from Google Sheet' : 'Offline fixture'} · pull to refresh
          </Text>
        )}

        <View style={styles.heroRow}>
          <HeroStat
            label="Left to spend"
            value={period.kpis.leftToSpend}
            hint="Income after expenses, debt, and savings"
            tone={period.kpis.leftToSpend >= 0 ? 'success' : 'danger'}
          />
          <HeroStat
            label="Left to budget"
            value={period.kpis.leftToBudget}
            hint="Income still unassigned to envelopes"
            tone="info"
          />
        </View>

        <View style={styles.chipGrid}>
          <MetricChip label="Income" value={period.kpis.actualIncome} />
          <MetricChip label="Expenses" value={period.kpis.actualExpenses} />
          <MetricChip label="Debt paid" value={period.kpis.actualDebt} />
          <MetricChip label="Savings" value={period.kpis.actualSavings} />
        </View>

        <Card style={{ marginTop: 8, marginBottom: 24 }}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>This period flow</Text>
          <FlowRow
            label="Budgeted income"
            value={period.kpis.budgetedIncome}
            color={colors.textSecondary}
          />
          <FlowRow label="Spent" value={period.kpis.actualExpenses} color={colors.warning} />
          <FlowRow label="Debt" value={period.kpis.actualDebt} color={colors.danger} />
          <FlowRow label="Saved" value={period.kpis.actualSavings} color={colors.info} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <FlowRow
            label="Remaining to spend"
            value={period.kpis.leftToSpend}
            color={colors.success}
            bold
          />
        </Card>
      </ScrollView>
    </Screen>
  );
}

function FlowRow({
  label,
  value,
  color,
  bold,
}: {
  label: string;
  value: number;
  color: string;
  bold?: boolean;
}) {
  return (
    <View style={styles.flowRow}>
      <Text
        style={{
          color,
          fontFamily: bold ? 'DMSans_700Bold' : 'DMSans_400Regular',
          fontSize: 14,
        }}>
        {label}
      </Text>
      <Text
        style={{
          color,
          fontFamily: bold ? 'DMSans_700Bold' : 'DMSans_500Medium',
          fontSize: 14,
        }}>
        {formatMoney(value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  heroRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  sectionLabel: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 18,
    marginBottom: 10,
  },
  flowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  divider: { height: 1, marginVertical: 8 },
  banner: { marginBottom: 10 },
  source: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    marginBottom: 10,
  },
});
