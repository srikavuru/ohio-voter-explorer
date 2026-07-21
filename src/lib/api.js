import { auth } from './firebase';

async function authedFetch(path, options = {}) {
  const token = await auth.currentUser?.getIdToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`/api${path}`, { ...options, headers });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

export function searchVoters(params) {
  const query = new URLSearchParams(params).toString();
  return authedFetch(`/search-voters?${query}`);
}

export function getVoterDetail(id) {
  return authedFetch(`/voter-detail?id=${encodeURIComponent(id)}`);
}

export function askAI(question) {
  return authedFetch('/ask-ai', {
    method: 'POST',
    body: JSON.stringify({ question }),
  });
}
