import React, { useRef, useState } from 'react';
import { Button, FieldStack } from '@nasnet/ui';
import { ClipboardPaste, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { messageText, type Action, type Message, type State } from '../../state';
import { parseWireguardConfig } from './parseWireguardConfig';
import styles from './IpMaskWireguardConfig.module.scss';

interface Props {
  state: State;
  dispatch: React.Dispatch<Action>;
}

export function IpMaskWireguardConfig({ state, dispatch }: Props) {
  const { t } = useTranslation('easyConfig');
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<Message | null>(null);

  const applyConfig = (text: string) => {
    const parsed = parseWireguardConfig(text);
    if (!parsed) {
      setError({ key: 'ipMask.wireguard.invalid' });
      return;
    }
    setError(null);
    dispatch({ type: 'setField', field: 'wgConfig', value: text });
    dispatch({ type: 'setField', field: 'wgPrivateKey', value: parsed.privateKey });
    dispatch({ type: 'setField', field: 'wgPeerPublicKey', value: parsed.peerPublicKey });
    dispatch({ type: 'setField', field: 'wgEndpoint', value: parsed.endpoint });
    dispatch({ type: 'setField', field: 'wgEndpointPort', value: parsed.endpointPort });
    dispatch({ type: 'setField', field: 'wgAllowedIps', value: parsed.allowedIps });
    if (parsed.mtu) dispatch({ type: 'setField', field: 'wgMtu', value: parsed.mtu });
    if (parsed.persistentKeepalive)
      dispatch({ type: 'setField', field: 'wgKeepalive', value: parsed.persistentKeepalive });
  };

  const onUpload = () => fileRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    dispatch({ type: 'setField', field: 'wgConfig', value: text });
    applyConfig(text);
    e.target.value = '';
  };

  const onPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        setError({ key: 'ipMask.wireguard.clipboardEmpty' });
        return;
      }
      dispatch({ type: 'setField', field: 'wgConfig', value: text });
      applyConfig(text);
    } catch {
      setError({ key: 'ipMask.wireguard.clipboardFailed' });
    }
  };

  return (
    <FieldStack>
      <div className={styles.wrap}>
        <textarea
          className={styles.textarea}
          value={state.wgConfig}
          onChange={(e) => {
            const text = e.target.value;
            dispatch({ type: 'setField', field: 'wgConfig', value: text });
            if (text.trim() && parseWireguardConfig(text)) applyConfig(text);
            else if (error) setError(null);
          }}
          placeholder={t('ipMask.wireguard.placeholder')}
          aria-label={t('ipMask.wireguard.ariaLabel')}
        />
        <div className={styles.actions}>
          <Button type="button" variant="success" onClick={onUpload}>
            <Upload size={14} strokeWidth={2} /> {t('ipMask.wireguard.upload')}
          </Button>
          <Button type="button" variant="primary" onClick={onPaste}>
            <ClipboardPaste size={14} strokeWidth={2} /> {t('ipMask.wireguard.paste')}
          </Button>
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".conf,.txt,text/plain"
        onChange={onFileChange}
        style={{ display: 'none' }}
      />
      {error ? (
        <p className={styles.error}>{messageText(error)}</p>
      ) : (
        <p className={styles.caption}>{t('ipMask.wireguard.caption')}</p>
      )}
    </FieldStack>
  );
}
