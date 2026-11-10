import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, FormError, Input, Label, Select } from '@nasnet/ui';
import type { SchedulerResponse, UpdateSchedulerRequest } from '../../api';
import { useLanguage } from '../../state/LanguageContext';
import {
  DOMESTIC_COUNTRIES,
  INTERVAL_PRESETS,
  MAX_INTERVAL_DAYS,
  countryName,
  intervalDays,
  toTimeInput,
} from './schedule';
import styles from './SettingsPage.module.scss';

const CUSTOM = 'custom';

/** Only the parts the user changed. */
export interface DomesticSettingsChange {
  schedule?: UpdateSchedulerRequest;
  country?: string;
}

interface Props {
  /** Null when the router has no update scheduler; the schedule fields are then hidden. */
  scheduler: SchedulerResponse | null;
  /** Null when the backend cannot read the country; the country field is then hidden. */
  country: string | null;
  disabled?: boolean;
  onSubmit: (change: DomesticSettingsChange) => Promise<void>;
}

function initialValues(scheduler: SchedulerResponse | null) {
  if (!scheduler) return { choice: '7', customDays: '', time: '12:00' };
  const days = intervalDays(scheduler.interval);
  const preset = days !== null && (INTERVAL_PRESETS as readonly number[]).includes(days);
  return {
    choice: preset ? String(days) : CUSTOM,
    customDays: days !== null && !preset ? String(days) : '',
    time: toTimeInput(scheduler.startTime) || '12:00',
  };
}

/** Edits the country, interval and start time in place; the parent remounts it after a save. */
export function DomesticScheduleForm({ scheduler, country, disabled, onSubmit }: Props) {
  const { t } = useTranslation('tools');
  const { intlLocale } = useLanguage();
  const initial = initialValues(scheduler);
  const [countryValue, setCountryValue] = useState(country ?? '');
  const [choice, setChoice] = useState(initial.choice);
  const [customDays, setCustomDays] = useState(initial.customDays);
  const [time, setTime] = useState(initial.time);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);

  const days = choice === CUSTOM ? Number(customDays) : Number(choice);
  const daysError =
    choice !== CUSTOM
      ? null
      : !/^\d+$/.test(customDays.trim()) || days < 1 || days > MAX_INTERVAL_DAYS
        ? t('settings.domestic.form.daysInvalid', { max: MAX_INTERVAL_DAYS })
        : null;
  const timeError = /^\d{2}:\d{2}$/.test(time) ? null : t('settings.domestic.form.timeInvalid');
  const scheduleDirty =
    !!scheduler &&
    (choice !== initial.choice || customDays !== initial.customDays || time !== initial.time);
  const countryDirty = country !== null && countryValue !== country;
  const dirty = scheduleDirty || countryDirty;

  // Keep a code the router already uses even when it is not in the list.
  const countryCodes: string[] = [...DOMESTIC_COUNTRIES];
  if (country && !countryCodes.includes(country)) countryCodes.push(country);
  const countryOptions = countryCodes.map((code) => ({
    value: code,
    label: `${countryName(code, intlLocale)} (${code})`,
  }));
  const locked = disabled || busy;

  const options = [
    ...INTERVAL_PRESETS.map((value) => ({
      value: String(value),
      label: t('settings.domestic.every', { count: value }),
    })),
    { value: CUSTOM, label: t('settings.domestic.form.custom') },
  ];

  const reset = () => {
    setCountryValue(country ?? '');
    setChoice(initial.choice);
    setCustomDays(initial.customDays);
    setTime(initial.time);
    setTouched(false);
  };

  const submit = async () => {
    setTouched(true);
    if (scheduleDirty && (daysError || timeError)) return;
    setBusy(true);
    try {
      await onSubmit({
        ...(scheduleDirty ? { schedule: { interval: `${days}d`, startTime: `${time}:00` } } : {}),
        ...(countryDirty ? { country: countryValue } : {}),
      });
    } catch {
      // The caller shows the error toast and keeps the edits.
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className={styles.scheduleForm}
      data-testid="domestic-schedule-form"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      {country !== null ? (
        <Label as="div" className={styles.scheduleField}>
          <span>{t('settings.domestic.country')}</span>
          <Select
            aria-label={t('settings.domestic.country')}
            value={countryValue}
            onChange={setCountryValue}
            options={countryOptions}
            disabled={locked}
          />
        </Label>
      ) : null}
      {scheduler ? (
        <>
          <Label as="div" className={styles.scheduleField}>
            <span>{t('settings.domestic.interval')}</span>
            <Select
              aria-label={t('settings.domestic.interval')}
              value={choice}
              onChange={setChoice}
              options={options}
              disabled={locked}
            />
          </Label>
          {choice === CUSTOM ? (
            <Label className={styles.scheduleField}>
              <span>{t('settings.domestic.form.days')}</span>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_INTERVAL_DAYS}
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                onBlur={() => setTouched(true)}
                dir="ltr"
                disabled={locked}
                aria-invalid={touched && !!daysError}
              />
              {touched && daysError ? <FormError>{daysError}</FormError> : null}
            </Label>
          ) : null}
          <Label className={styles.scheduleField}>
            <span>{t('settings.domestic.startTime')}</span>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              dir="ltr"
              disabled={locked}
              aria-invalid={touched && !!timeError}
            />
            {touched && timeError ? <FormError>{timeError}</FormError> : null}
          </Label>
        </>
      ) : null}
      <div className={styles.scheduleActions}>
        {dirty ? (
          <Button type="button" variant="ghost" onClick={reset} disabled={busy}>
            {t('common.cancel')}
          </Button>
        ) : null}
        <Button type="submit" variant="primary" disabled={locked || !dirty}>
          {busy ? t('settings.domestic.form.saving') : t('settings.domestic.form.save')}
        </Button>
      </div>
    </form>
  );
}
