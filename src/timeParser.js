const MAX_DURATION_MS = 10 * 365 * 24 * 60 * 60 * 1000; // 10 years

const UNIT_MAP = {
  s: 1000, sec: 1000, secs: 1000, second: 1000, seconds: 1000,
  m: 60000, min: 60000, mins: 60000, minute: 60000, minutes: 60000,
  h: 3600000, hr: 3600000, hrs: 3600000, hour: 3600000, hours: 3600000,
  d: 86400000, day: 86400000, days: 86400000,
  w: 604800000, week: 604800000, weeks: 604800000,
};

const HUMAN_LABELS = {
  w: 'week', d: 'day', h: 'hour', m: 'minute', s: 'second',
};

const TOKEN_REGEX = /(\d+)\s*(seconds?|secs?|sec|minutes?|mins?|min|hours?|hrs?|hr|days?|weeks?|[smhdw])(?=\s|\d|$)/gi;

function parseTime(input) {
  if (!input || typeof input !== 'string') return null;

  const matches = [...input.matchAll(TOKEN_REGEX)];
  if (matches.length === 0) return null;

  let totalMs = 0;

  for (const match of matches) {
    const value = parseInt(match[1], 10);
    const unitKey = match[2].toLowerCase();
    const multiplier = UNIT_MAP[unitKey];

    if (!multiplier || value <= 0) return null;

    totalMs += value * multiplier;
  }

  if (totalMs <= 0 || totalMs > MAX_DURATION_MS) return null;

  return { ms: totalMs, humanReadable: formatDuration(totalMs) };
}

function findTimeBoundary(tokens) {
  let lastGoodIndex = 0;
  let lastMatchCount = 0;
  let missStreak = 0;

  for (let i = 1; i <= tokens.length; i++) {
    const candidate = tokens.slice(0, i).join(' ');
    const matches = [...candidate.matchAll(TOKEN_REGEX)];
    if (matches.length > 0 && matches.length > lastMatchCount) {
      lastGoodIndex = i;
      lastMatchCount = matches.length;
      missStreak = 0;
    } else if (lastGoodIndex > 0) {
      missStreak++;
      if (missStreak >= 2) break;
    }
  }

  return lastGoodIndex;
}

function formatDuration(ms) {
  const parts = [];
  const units = [
    { key: 'w', div: 604800000 },
    { key: 'd', div: 86400000 },
    { key: 'h', div: 3600000 },
    { key: 'm', div: 60000 },
    { key: 's', div: 1000 },
  ];

  let remaining = ms;
  for (const { key, div } of units) {
    const count = Math.floor(remaining / div);
    if (count > 0) {
      const label = HUMAN_LABELS[key];
      parts.push(`${count} ${label}${count !== 1 ? 's' : ''}`);
      remaining -= count * div;
    }
  }

  return parts.join(', ') || '0 seconds';
}

module.exports = { parseTime, findTimeBoundary, formatDuration };
