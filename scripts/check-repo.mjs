import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const requiredFiles = [
  'README.md',
  'LICENSE',
  'CHANGELOG.md',
  'SECURITY.md',
  'CONTRIBUTING.md',
  'package.json',
  'src/main.js',
  'src/preload.js',
  'src/renderer/index.html',
  'src/renderer/renderer.js',
  'src/renderer/styles.css',
  'docs/engineering-decisions.md',
  'docs/releasing.md',
];

const ignoredDirectories = new Set(['.git', 'node_modules', 'release', 'dist', '.idea', '.vscode']);
const ignoredFiles = new Set(['.DS_Store', 'Thumbs.db']);
const textExtensions = new Set(['.js', '.mjs', '.cjs', '.json', '.md', '.html', '.css', '.sh', '.bat', '.yml', '.yaml', '.txt']);
const javascriptExtensions = new Set(['.js', '.mjs', '.cjs']);

const sensitivePatterns = [
  { label: 'private key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { label: 'GitHub token', pattern: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/ },
  { label: 'AWS access key', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { label: 'personal Windows path', pattern: /[A-Za-z]:\\Users\\[^\\\r\n]+/ },
  { label: 'personal macOS path', pattern: /\/Users\/[^/\s]+\// },
  { label: 'personal Linux path', pattern: /\/home\/[^/\s]+\// },
];

function fail(message) {
  console.error(`✗ ${message}`);
  process.exitCode = 1;
}

function walk(directory) {
  const files = [];
  for (const entry of readdirSync(directory)) {
    const absolutePath = join(directory, entry);
    const repoPath = relative(root, absolutePath).replaceAll('\\', '/');
    const stat = statSync(absolutePath);
    if (stat.isDirectory()) {
      // Local dependencies, build output and editor metadata are expected to exist
      // after development/builds. They are excluded from Git and must not be
      // scanned as repository source.
      if (ignoredDirectories.has(entry)) continue;
      files.push(...walk(absolutePath));
    } else {
      if (ignoredFiles.has(entry) || entry.startsWith('.env')) continue;
      files.push({ absolutePath, repoPath });
    }
  }
  return files;
}

for (const file of requiredFiles) {
  try {
    statSync(join(root, file));
  } catch {
    fail(`required file is missing: ${file}`);
  }
}

const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
if (packageJson.license !== 'MIT') fail('package.json license must be MIT');
if (packageJson.private !== true) fail('package.json should remain private to prevent accidental npm publication');
if (packageJson.build?.appId !== 'app.mark.editor') fail('application ID must remain app.mark.editor');
if (packageJson.build?.productName !== 'Mark') fail('productName must remain Mark');
if (packageJson.name !== 'mark-desktop') fail('package name must remain mark-desktop');

for (const section of ['dependencies', 'devDependencies']) {
  for (const [name, version] of Object.entries(packageJson[section] || {})) {
    if (/^[~^*]/.test(version)) fail(`${section}.${name} is not pinned to an exact version`);
  }
}

const gitignore = readFileSync(join(root, '.gitignore'), 'utf8');
for (const requiredIgnore of ['node_modules/', 'release/', 'dist/', '.env']) {
  if (!gitignore.includes(requiredIgnore)) fail(`.gitignore must exclude ${requiredIgnore}`);
}

const files = walk(root);
for (const { absolutePath, repoPath } of files) {
  const extension = extname(repoPath).toLowerCase();
  if (javascriptExtensions.has(extension)) {
    try {
      execFileSync(process.execPath, ['--check', absolutePath], { stdio: 'pipe' });
    } catch (error) {
      fail(`JavaScript syntax check failed: ${repoPath}\n${error.stderr?.toString() || error.message}`);
    }
  }

  if (!textExtensions.has(extension) && !['LICENSE', '.gitignore', '.gitattributes', '.editorconfig'].includes(repoPath)) continue;
  const content = readFileSync(absolutePath, 'utf8');
  for (const { label, pattern } of sensitivePatterns) {
    if (pattern.test(content)) fail(`${label} found in ${repoPath}`);
  }
}

if (!process.exitCode) console.log('✓ Repository checks passed');
