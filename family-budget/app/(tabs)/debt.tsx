import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  Card,
  MetricChip,
  Screen,
  Subtitle,
  Title,
  useThemeColors,
} from '@/components/budget/ui';
import { useBudget } from '@/src/context/BudgetContext';
import { formatMoney } from '@/src/lib/money';

export default function DebtScreen() {
  const colors = useThemeColors();
  const { creditSummary, cards, refreshing, refresh } = useBudget();
  const active = cards.filter((c) => c.remaining > 0);
  const paid = cards.filter((c) => c.remaining <= 0);

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.tint} />}>
        <Title>Debt</Title>
        <Subtitle>{creditSummary.periodLabel || 'Credit card payoff'}</Subtitle>

        <View style={styles.chipGrid}>
          <MetricChip label="Remaining" value={creditSummary.remaining} />
          <MetricChip label="Paid so far" value={creditSummary.forwardPaid} />
          <MetricChip label="Monthly interest" value={creditSummary.monthlyInterest} />
          <MetricChip label="Period paid" value={creditSummary.currentPeriodPaid} />
        </View>

        <Card style={{ marginBottom: 12 }}>
          <Text style={[styles.bigLabel, { color: colors.textSecondary }]}>Overall payoff</Text>
          <Text style={[styles.bigValue, { color: colors.tint }]}>
            {creditSummary.payoffPercent.toFixed(1)}%
          </Text>
          <View style={[styles.track, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.fill,
                {
                  width: `${Math.min(100, creditSummary.payoffPercent)}%`,
                  backgroundColor: colors.tint,
                },
              ]}
            />
          </View>
          <Text style={{ color: colors.textSecondary, fontFamily: 'DMSans_400Regular', marginTop: 8 }}>
            {creditSummary.cardsPaidInFull} cards paid in full · APR ~{creditSummary.weightedApr}%
          </Text>
        </Card>

        <Text style={[styles.section, { color: colors.text }]}>In progress</Text>
        <View style={{ gap: 8, marginBottom: 16 }}>
          {active.map((card) => (
            <Card key={card.name}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardName, { color: colors.text }]}>{card.name}</Text>
                  <Text style={{ color: colors.textSecondary, fontFamily: 'DMSans_400Regular', fontSize: 12 }}>
                    {stripEmoji(card.owner)} · {card.apr}% APR · {card.status}
                  </Text>
                </View>
                <Text style={[styles.cardBal, { color: colors.danger }]}>
                  {formatMoney(card.remaining)}
                </Text>
              </View>
              <View style={[styles.track, { backgroundColor: colors.border, marginTop: 10 }]}>
                <View
                  style={[
                    styles.fill,
                    {
                      width: `${Math.min(100, Math.max(0, card.percentPaid))}%`,
                      backgroundColor: colors.info,
                    },
                  ]}
                />
              </View>
              <Text style={{ color: colors.textSecondary, fontFamily: 'DMSans_400Regular', fontSize: 11, marginTop: 6 }}>
                {card.percentPaid.toFixed(1)}% paid · util {card.utilization.toFixed(0)}% · interest{' '}
                {formatMoney(card.monthlyInterest)}/mo
              </Text>
            </Card>
          ))}
        </View>

        {paid.length > 0 ? (
          <>
            <Text style={[styles.section, { color: colors.text }]}>Paid in full</Text>
            <Card style={{ marginBottom: 24 }}>
              {paid.map((card) => (
                <Text
                  key={card.name}
                  style={{
                    color: colors.textSecondary,
                    fontFamily: 'DMSans_400Regular',
                    marginBottom: 6,
                  }}>
                  {card.name} · {stripEmoji(card.owner)}
                </Text>
              ))}
            </Card>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function stripEmoji(s: string) {
  return s.replace(/[^\w\s&'.-]/g, '').trim() || s;
}

const styles = StyleSheet.create({
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  bigLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bigValue: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 36,
    marginVertical: 4,
  },
  track: { height: 8, borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
  section: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 18,
    marginBottom: 8,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  cardName: { fontFamily: 'DMSans_700Bold', fontSize: 15 },
  cardBal: { fontFamily: 'DMSans_700Bold', fontSize: 15 },
});
