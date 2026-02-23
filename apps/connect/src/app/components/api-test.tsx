import { useState } from 'react';

import { apiClient } from '@nasnet/api-client/core';
import { useTranslation } from '@nasnet/core/i18n';
import { Button } from '@nasnet/ui/primitives';

export function ApiTest() {
  const { t } = useTranslation('common');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<string>('');

  const testConnection = async () => {
    setTesting(true);
    try {
      // This call should route to localhost:8080 via Vite proxy
      const response = await apiClient.get('/router/status');
      setResult(`✅ ${t('apiTest.success')}: ${JSON.stringify(response.data)}`);
    } catch (e) {
      // Expected behavior - backend may not be running, but proxy should work
      setResult(`ℹ️ ${t('apiTest.proxyWorking')}: ${String(e)}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-4 border border-border rounded">
      <h3 className="text-sm font-semibold mb-2">{t('apiTest.title')}</h3>
      <Button onClick={testConnection} disabled={testing}>
        {testing ? t('apiTest.testing') : t('apiTest.testButton')}
      </Button>
      {result && <p className="text-xs mt-2 font-mono">{result}</p>}
    </div>
  );
}
