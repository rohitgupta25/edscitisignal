import { readBlockConfig } from '../../scripts/aem.js';

const DEFAULT_SOURCE = '/management.json';
const PROJECT_NAME_KEYS = ['project name', 'project-name', 'project_name', 'projectname'];
const TASK_NAME_KEYS = ['task name', 'task-name', 'task_name', 'taskname'];

function normalizeKey(key = '') {
  return String(key).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isEmptyValue(value) {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'string') return value.trim() === '';
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

function getSourceUrl(block) {
  const config = readBlockConfig(block);
  return config.source || config.url || config.feed || DEFAULT_SOURCE;
}

function resolveRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function findFieldValue(row, candidateKeys) {
  const normalizedCandidateKeys = candidateKeys.map((key) => normalizeKey(key));
  const match = Object.entries(row).find(
    ([key]) => normalizedCandidateKeys.includes(normalizeKey(key)),
  );
  return match ? match[1] : '';
}

function isInternalKey(key) {
  const normalized = normalizeKey(key);
  return ['path', 'url', 'source', 'image'].includes(normalized);
}

function formatValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => formatValue(item)).join(', ');
  }

  if (value && typeof value === 'object') {
    return Object.entries(value)
      .map(([key, val]) => `${key}: ${formatValue(val)}`)
      .join(', ');
  }

  return String(value);
}

function createDetailsRow(label, value) {
  const row = document.createElement('div');
  row.className = 'management__detail';

  const dt = document.createElement('dt');
  dt.textContent = label;

  const dd = document.createElement('dd');
  const formatted = formatValue(value);

  if (/^https?:\/\//.test(formatted)) {
    const link = document.createElement('a');
    link.href = formatted;
    link.textContent = formatted;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    dd.append(link);
  } else {
    dd.textContent = formatted;
  }

  row.append(dt, dd);
  return row;
}

function createCard(row) {
  const article = document.createElement('article');
  article.className = 'management__card';

  const title = findFieldValue(row, PROJECT_NAME_KEYS) || 'Untitled Project';
  const subtitle = findFieldValue(row, TASK_NAME_KEYS);

  const titleEl = document.createElement('h3');
  titleEl.className = 'management__title';
  titleEl.textContent = title;
  article.append(titleEl);

  if (subtitle && !isEmptyValue(subtitle)) {
    const subtitleEl = document.createElement('p');
    subtitleEl.className = 'management__subtitle';
    subtitleEl.textContent = subtitle;
    article.append(subtitleEl);
  }

  const details = document.createElement('dl');
  details.className = 'management__details';

  const projectNameNorm = PROJECT_NAME_KEYS.map((key) => normalizeKey(key));
  const taskNameNorm = TASK_NAME_KEYS.map((key) => normalizeKey(key));

  Object.entries(row)
    .filter(([key, value]) => {
      const normalized = normalizeKey(key);
      if (projectNameNorm.includes(normalized) || taskNameNorm.includes(normalized)) return false;
      if (isInternalKey(key)) return false;
      return !isEmptyValue(value);
    })
    .forEach(([key, value]) => {
      details.append(createDetailsRow(key, value));
    });

  if (details.children.length > 0) {
    article.append(details);
  }

  return article;
}

export default async function decorate(block) {
  const source = getSourceUrl(block);
  block.textContent = '';

  try {
    const response = await fetch(source);
    if (!response.ok) throw new Error(`Failed to load management data: ${response.status}`);

    const json = await response.json();
    const rows = resolveRows(json);

    if (!rows.length) {
      block.innerHTML = '<p class="management__message">No management records found.</p>';
      return;
    }

    const list = document.createElement('div');
    list.className = 'management__list';
    rows.forEach((row) => list.append(createCard(row)));

    block.append(list);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    block.innerHTML = '<p class="management__message">Unable to load management records.</p>';
  }
}
