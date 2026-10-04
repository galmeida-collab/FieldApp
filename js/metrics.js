import { SCRIPT_URL } from './config.js';

let lastFetchTime = 0;

export async function fetchCloudMetrics(passcode, force = false) {
  const now = Date.now();
  if (!force && now - lastFetchTime < 300000) { 
    const cached = localStorage.getItem('ae_cloud_metrics');
    if (cached) return JSON.parse(cached);
  }

  try {
    const res = await fetch(`${SCRIPT_URL}?passcode=${encodeURIComponent(passcode)}`, { method: 'GET' });
    if (!res.ok) throw new Error('Failed to fetch metrics');
    const data = await res.json();
    if (data.status === 'success') {
      localStorage.setItem('ae_cloud_metrics', JSON.stringify(data));
      localStorage.setItem('ae_cloud_metrics_time', new Date().toISOString());
      lastFetchTime = now;
      return data;
    } else {
      throw new Error(data.message || 'Server error');
    }
  } catch (e) {
    console.error('Metrics fetch error:', e);
    const cached = localStorage.getItem('ae_cloud_metrics');
    if (cached) {
      return JSON.parse(cached);
    }
    throw e;
  }
}
