import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  Card,
  CategoryBar,
  Screen,
  Segmented,
  Subtitle,
  Title,
  useThemeColors,
} from '@/components/budget/ui';
import { useBudget } from '@/src/context/BudgetContext';
import type { MoneyCategory } from '@/src/types';

type GroupKey = 'Variable' | 'Fixed' | 'Savings' | 'Debts' | 'Income';

export default function CategoriesScreen() {
  const colors = useThemeColors();
  const { period, refreshing, refresh } = useBudget();
  const [group, setGroup] = useState<GroupKey>('Variable');

  const items = useMemo(() => {
    const map: Record<GroupKey, MoneyCategory[]> = {
      Variable: period.variable,
      Fixed: period.fixed,
      Savings: period.savings,
      Debts: period.debts,
      Income: period.income,
    };
    return [...map[group]].sort((a, b) => b.actual - a.actual);
  }, [group, period]);

  const spent = items.reduce((s, i) => s + i.actual, 0);
  const budgeted = items.reduce((s, i) => s + i.budget, 0);

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.tint} />}>
        <Title>Categories</Title>
        <Subtitle>
          {period.name} · {group.toLowerCase()} actual {spent.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          {budgeted > 0
            ? ` of ${budgeted.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} budgeted`
            : ''}
        </Subtitle>

        <Segmented
          options={['Variable', 'Fixed', 'Savings', 'Debts', 'Income']}
          value={group}
          onChange={(v) => setGroup(v as GroupKey)}
        />

        <Card style={{ marginBottom: 24 }}>
          {items.length === 0 ? (
            <Text style={{ color: colors.textSecondary, fontFamily: 'DMSans_400Regular' }}>
              No categories in this group.
            </Text>
          ) : (
            items.map((item) => (
              <CategoryBar
                key={item.name}
                name={item.name}
                actual={item.actual}
                budget={item.budget}
              />
            ))
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({});
