import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const sourceDir = path.join(rootDir, 'src');
const enPath = path.join(sourceDir, 'locales', 'en.json');
const ruPath = path.join(sourceDir, 'locales', 'ru.json');

const SOURCE_FILE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const T_CALL_REGEX = /\bt\s*\(\s*['"`]([^'"`]+)['"`]/g;
const IGNORED_PREFIXES = ['admin.', 'caseStudies.', 'about.teamMembers.'];

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const walkFiles = (dirPath, out = []) => {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      walkFiles(fullPath, out);
      continue;
    }

    if (SOURCE_FILE_EXTENSIONS.has(path.extname(entry.name))) {
      out.push(fullPath);
    }
  }
  return out;
};

const getByPath = (obj, keyPath) => {
  return keyPath.split('.').reduce((acc, token) => {
    if (acc === null || acc === undefined) {
      return undefined;
    }
    return acc[token];
  }, obj);
};

const formatList = (title, values) => {
  if (values.length === 0) {
    return '';
  }
  return `${title}\n${values.map((value) => `  - ${value}`).join('\n')}\n`;
};

const files = walkFiles(sourceDir);
const usedKeys = new Set();

for (const filePath of files) {
  const contents = fs.readFileSync(filePath, 'utf8');
  const matches = contents.matchAll(T_CALL_REGEX);

  for (const match of matches) {
    const key = match[1]?.trim();
    if (!key || key.includes('${')) {
      continue;
    }
    usedKeys.add(key);
  }
}

const en = readJson(enPath);
const ru = readJson(ruPath);

const missingInEn = [];
const missingInRu = [];
const typeMismatches = [];

for (const key of [...usedKeys].sort()) {
  if (IGNORED_PREFIXES.some((prefix) => key.startsWith(prefix))) {
    continue;
  }

  const enValue = getByPath(en, key);
  const ruValue = getByPath(ru, key);

  if (enValue === undefined) {
    missingInEn.push(key);
  }

  if (ruValue === undefined) {
    missingInRu.push(key);
  }

  if (enValue !== undefined && ruValue !== undefined) {
    const enType = Array.isArray(enValue) ? 'array' : typeof enValue;
    const ruType = Array.isArray(ruValue) ? 'array' : typeof ruValue;
    if (enType !== ruType) {
      typeMismatches.push(`${key} (en: ${enType}, ru: ${ruType})`);
    }
  }
}

if (missingInEn.length || missingInRu.length || typeMismatches.length) {
  console.error('i18n integrity check failed.');
  process.stderr.write(formatList('Missing in en.json:', missingInEn));
  process.stderr.write(formatList('Missing in ru.json:', missingInRu));
  process.stderr.write(formatList('Type mismatches:', typeMismatches));
  process.exit(1);
}

console.log(`i18n integrity check passed. Checked ${usedKeys.size} translation keys.`);
