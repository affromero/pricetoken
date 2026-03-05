'use client';

import { useState, useEffect, useCallback } from 'react';
import { EXTRACTION_PROVIDERS } from '@/lib/fetcher/ai-registry';
import styles from './page.module.css';

interface VerificationAgent {
  provider: string;
  model: string;
}

interface ConfigData {
  extractionProvider: string;
  extractionModel: string;
  verificationAgents: VerificationAgent[];
  maxTextLength: number;
  enabled: boolean;
}

export default function AdminConfigPage() {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [newAgentProvider, setNewAgentProvider] = useState('');
  const [newAgentModel, setNewAgentModel] = useState('');

  const loadConfig = useCallback(async () => {
    const res = await fetch('/api/admin/config');
    if (res.ok) {
      const json = await res.json();
      setConfig(json.data);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setStatus(null);

    const res = await fetch('/api/admin/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });

    if (res.ok) {
      setStatus({ type: 'success', message: 'Config saved' });
    } else {
      const json = await res.json();
      setStatus({ type: 'error', message: json.error ?? 'Save failed' });
    }
    setSaving(false);
  };

  if (!config) return null;

  const provider = EXTRACTION_PROVIDERS[config.extractionProvider];
  const models = provider?.models ?? [];

  return (
    <>
      <h1>Fetcher Config</h1>
      <div className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Extraction Provider</label>
          <select
            className={styles.select}
            value={config.extractionProvider}
            onChange={(e) => {
              const newProvider = e.target.value;
              const firstModel = EXTRACTION_PROVIDERS[newProvider]?.models[0]?.id ?? '';
              setConfig({ ...config, extractionProvider: newProvider, extractionModel: firstModel });
            }}
          >
            {Object.entries(EXTRACTION_PROVIDERS).map(([key, p]) => (
              <option key={key} value={key}>
                {p.displayName}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Model</label>
          <select
            className={styles.select}
            value={config.extractionModel}
            onChange={(e) => setConfig({ ...config, extractionModel: e.target.value })}
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Max Text Length</label>
          <input
            className={styles.input}
            type="number"
            value={config.maxTextLength}
            onChange={(e) => setConfig({ ...config, maxTextLength: Number(e.target.value) })}
            min={1000}
            max={100000}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Verification Agents</label>
          <div className={styles.agentList}>
            {config.verificationAgents.map((agent, i) => (
              <div key={`${agent.provider}-${agent.model}`} className={styles.agentRow}>
                <span className={styles.agentLabel}>
                  {EXTRACTION_PROVIDERS[agent.provider]?.displayName ?? agent.provider} / {agent.model}
                </span>
                <button
                  className={styles.removeButton}
                  onClick={() => {
                    const next = config.verificationAgents.filter((_, idx) => idx !== i);
                    setConfig({ ...config, verificationAgents: next });
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className={styles.addAgentRow}>
            <select
              className={styles.select}
              value={newAgentProvider}
              onChange={(e) => {
                setNewAgentProvider(e.target.value);
                setNewAgentModel(EXTRACTION_PROVIDERS[e.target.value]?.models[0]?.id ?? '');
              }}
            >
              <option value="">Provider...</option>
              {Object.entries(EXTRACTION_PROVIDERS).map(([key, p]) => (
                <option key={key} value={key}>{p.displayName}</option>
              ))}
            </select>
            <select
              className={styles.select}
              value={newAgentModel}
              onChange={(e) => setNewAgentModel(e.target.value)}
              disabled={!newAgentProvider}
            >
              <option value="">Model...</option>
              {(EXTRACTION_PROVIDERS[newAgentProvider]?.models ?? []).map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <button
              className={styles.button}
              disabled={!newAgentProvider || !newAgentModel}
              onClick={() => {
                setConfig({
                  ...config,
                  verificationAgents: [...config.verificationAgents, { provider: newAgentProvider, model: newAgentModel }],
                });
                setNewAgentProvider('');
                setNewAgentModel('');
              }}
            >
              Add
            </button>
          </div>
        </div>

        <div className={styles.toggle}>
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
          />
          <span className={styles.toggleLabel}>Fetcher enabled</span>
        </div>

        <button className={styles.button} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>

        {status && (
          <div className={`${styles.status} ${status.type === 'success' ? styles.success : styles.error}`}>
            {status.message}
          </div>
        )}
      </div>
    </>
  );
}
