import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Card,
  Field,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
  useThemeColors,
} from '@/components/budget/ui';
import { useBudget } from '@/src/context/BudgetContext';

export default function AddScreen() {
  const colors = useThemeColors();
  const {
    period,
    people,
    paymentMethods,
    transactionTypes,
    addTransaction,
  } = useBudget();

  const categoryOptions = useMemo(() => {
    const all = [
      ...period.variable,
      ...period.fixed,
      ...period.savings,
      ...period.debts,
      ...period.income,
    ].map((c) => c.name);
    return Array.from(new Set(all));
  }, [period]);

  const today = new Date();
  const defaultDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;

  const [date, setDate] = useState(defaultDate);
  const [type, setType] = useState(transactionTypes[1] ?? '✨ Variable Expenses');
  const [category, setCategory] = useState(categoryOptions[0] ?? 'Groceries 🛒');
  const [person, setPerson] = useState(people[0] ?? 'Both');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState(paymentMethods[0] ?? 'Cash');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const filteredCategories = useMemo(() => {
    if (type.includes('Variable')) return period.variable.map((c) => c.name);
    if (type.includes('Fixed')) return period.fixed.map((c) => c.name);
    if (type.includes('Savings')) return period.savings.map((c) => c.name);
    if (type.includes('Debts')) return period.debts.map((c) => c.name);
    if (type.includes('Income')) return period.income.map((c) => c.name);
    return categoryOptions;
  }, [type, period, categoryOptions]);

  async function onSave() {
    const parsed = Number(amount.replace(/[$,]/g, ''));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      Alert.alert('Amount required', 'Enter a valid amount greater than zero.');
      return;
    }
    setSaving(true);
    try {
      const result = await addTransaction({
        date,
        type,
        category,
        person,
        amount: Math.round(parsed * 100) / 100,
        method,
        notes,
      });
      setAmount('');
      setNotes('');
      Alert.alert(
        'Logged',
        result.synced
          ? 'Saved to the app and synced to Google Sheets.'
          : `${result.message} It still appears in Activity on this device.`
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Title>Quick add</Title>
        <Subtitle>Logs against {period.name}. Writes to the sheet when a webhook is configured.</Subtitle>

        <Field label="Date" value={date} onChangeText={setDate} placeholder="M/D/YYYY" />
        <Field
          label="Amount"
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />

        <Chooser
          label="Type"
          options={transactionTypes}
          value={type}
          onChange={(v) => {
            setType(v);
            const nextCats =
              v.includes('Variable')
                ? period.variable
                : v.includes('Fixed')
                  ? period.fixed
                  : v.includes('Savings')
                    ? period.savings
                    : v.includes('Debts')
                      ? period.debts
                      : v.includes('Income')
                        ? period.income
                        : [];
            if (nextCats[0]) setCategory(nextCats[0].name);
          }}
        />
        <Chooser
          label="Category"
          options={filteredCategories.length ? filteredCategories : categoryOptions}
          value={category}
          onChange={setCategory}
        />
        <Chooser label="Person" options={people} value={person} onChange={setPerson} />
        <Chooser label="Payment method" options={paymentMethods} value={method} onChange={setMethod} />
        <Field
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional"
        />

        <PrimaryButton label={saving ? 'Saving…' : 'Save transaction'} onPress={onSave} disabled={saving} />

        <Card style={{ marginTop: 16, marginBottom: 28 }}>
          <Text style={{ color: colors.text, fontFamily: 'DMSans_700Bold', marginBottom: 6 }}>
            Sheet write-back
          </Text>
          <Text style={{ color: colors.textSecondary, fontFamily: 'DMSans_400Regular', lineHeight: 20 }}>
            Deploy `family-budget/scripts/SheetsWrite.gs` as a Google Apps Script web app, then set
            EXPO_PUBLIC_SHEETS_WEBHOOK_URL. Until then, adds stay on-device and update local KPIs.
          </Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}

function Chooser({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const colors = useThemeColors();
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: colors.textSecondary, fontFamily: 'DMSans_500Medium', fontSize: 12, marginBottom: 6 }}>
        {label}
      </Text>
      <View style={styles.wrap}>
        {options.map((opt) => {
          const active = opt === value;
          return (
            <Pressable
              key={opt}
              onPress={() => onChange(opt)}
              style={[
                styles.chip,
                {
                  borderColor: active ? colors.tint : colors.border,
                  backgroundColor: active ? '#D8EDE7' : colors.card,
                },
              ]}>
              <Text
                style={{
                  color: active ? colors.tint : colors.text,
                  fontFamily: 'DMSans_500Medium',
                  fontSize: 12,
                }}>
                {opt}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
});
