import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors, { palette } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { clampPercent, formatMoney } from '@/src/lib/money';

export function useThemeColors() {
  const scheme = useColorScheme() ?? 'light';
  return Colors[scheme];
}

export function Screen({ children, style, ...rest }: ViewProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.background,
          paddingTop: Math.max(insets.top, 12),
          paddingBottom: insets.bottom + 8,
        },
        style,
      ]}
      {...rest}>
      {children}
    </View>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  const colors = useThemeColors();
  return <Text style={[styles.title, { color: colors.text }]}>{children}</Text>;
}

export function Subtitle({ children }: { children: React.ReactNode }) {
  const colors = useThemeColors();
  return <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{children}</Text>;
}

export function Card({ children, style, ...rest }: ViewProps) {
  const colors = useThemeColors();
  return (
    <View
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}
      {...rest}>
      {children}
    </View>
  );
}

export function HeroStat({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string;
  value: number;
  hint?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}) {
  const colors = useThemeColors();
  const toneColor =
    tone === 'success'
      ? colors.success
      : tone === 'warning'
        ? colors.warning
        : tone === 'danger'
          ? colors.danger
          : tone === 'info'
            ? colors.info
            : colors.text;

  return (
    <Card style={styles.heroCard}>
      <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.heroValue, { color: toneColor }]}>{formatMoney(value)}</Text>
      {hint ? <Text style={[styles.heroHint, { color: colors.textSecondary }]}>{hint}</Text> : null}
    </Card>
  );
}

export function MetricChip({ label, value }: { label: string; value: number }) {
  const colors = useThemeColors();
  return (
    <View style={[styles.chip, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <Text style={[styles.chipLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.chipValue, { color: colors.text }]}>{formatMoney(value)}</Text>
    </View>
  );
}

export function CategoryBar({
  name,
  actual,
  budget,
}: {
  name: string;
  actual: number;
  budget: number;
}) {
  const colors = useThemeColors();
  const pct = clampPercent(actual, budget);
  const over = budget > 0 ? actual > budget : actual > 0 && budget === 0;
  const remaining = budget - actual;
  const fill = over ? colors.danger : colors.tint;

  return (
    <View style={styles.catRow}>
      <View style={styles.catHeader}>
        <Text style={[styles.catName, { color: colors.text }]} numberOfLines={1}>
          {name}
        </Text>
        <Text style={[styles.catAmount, { color: over ? colors.danger : colors.text }]}>
          {formatMoney(actual)}
          {budget > 0 ? ` / ${formatMoney(budget)}` : ''}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${budget > 0 ? pct : actual > 0 ? 100 : 0}%`,
              backgroundColor: fill,
            },
          ]}
        />
      </View>
      <Text style={[styles.catMeta, { color: colors.textSecondary }]}>
        {budget > 0
          ? `${formatMoney(remaining)} left · ${pct}% used`
          : actual > 0
            ? 'No envelope set this period'
            : 'Unused'}
      </Text>
    </View>
  );
}

export function Segmented({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const colors = useThemeColors();
  return (
    <View style={[styles.segmented, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[
              styles.segment,
              active && { backgroundColor: palette.tealSoft },
            ]}>
            <Text
              style={[
                styles.segmentText,
                { color: active ? palette.tealDeep : colors.textSecondary },
              ]}
              numberOfLines={1}>
              {opt.replace(/[^\w\s&'.-]/g, '').trim() || opt}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primaryBtn,
        { backgroundColor: palette.teal, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
      ]}>
      <Text style={styles.primaryBtnText}>{label}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  ...props
}: { label: string } & TextInputProps) {
  const colors = useThemeColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textSecondary}
        style={[
          styles.input,
          { color: colors.text, borderColor: colors.border, backgroundColor: colors.card },
        ]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 16,
  },
  title: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 30,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 14,
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  heroCard: {
    flex: 1,
    minHeight: 120,
    justifyContent: 'center',
  },
  heroLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroValue: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 34,
    marginTop: 6,
    letterSpacing: -0.8,
  },
  heroHint: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    marginTop: 8,
    lineHeight: 16,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: '47%',
    flexGrow: 1,
  },
  chipLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
  },
  chipValue: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    marginTop: 4,
  },
  catRow: {
    marginBottom: 14,
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  catName: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    flex: 1,
  },
  catAmount: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
  },
  track: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  catMeta: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    marginTop: 4,
  },
  segmented: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 14,
    padding: 4,
    gap: 4,
    marginBottom: 12,
  },
  segment: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  segmentText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
  },
  primaryBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: 'DMSans_700Bold',
    color: '#fff',
    fontSize: 16,
  },
  field: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
  },
});
