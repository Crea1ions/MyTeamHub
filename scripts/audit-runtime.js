#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Repository Runtime Audit Script
 * Classifies all files as: Code, Runtime, or Documentation
 */

const REPO_ROOT = path.join(__dirname, '..');
const GIT_DIR = path.join(REPO_ROOT, '.git');

// Files/patterns that should be classified as RUNTIME
const RUNTIME_PATTERNS = [
  /^data\/sessions-index\.json$/,
  /^data\/agents\/.*\.agent\.md$/,
  /^logs\//,
  /^playwright-screenshots\//,
  /^test-results\//,
  /^runtime\//,
  /^AUDIT_.*\.md$/,
  /^FIX_.*\.md$/,
  /^UI_UX_AUDIT_.*\.md$/,
  /^npm-audit-server\.json$/,
  /^\.env/,
  /^server\/\.openclaw_device\.json$/,
  /^data\/projects\/[^/]+\/sessions\//,
  /^data\/projects\/[^/]+\/execution\.log$/,
];

// Files/patterns that should be classified as DOCUMENTATION
const DOCUMENTATION_PATTERNS = [
  /\.md$/,
  /^docs\//,
  /^\.?README/,
  /^LICENSE$/,
  /^PLAN/,
  /CHANGELOG/,
];

// Files/patterns that should be classified as CODE
const CODE_PATTERNS = [
  /^server\//,
  /^ui\//,
  /^tests\//,
  /^__tests__\//,
  /^playwright-tests\//,
  /^scripts\//,
  /^data\/prompts\//,
  /\.js$/,
  /\.json$/,
  /\.ts$/,
  /\.tsx$/,
  /\.html$/,
  /\.css$/,
  /package\.json$/,
  /package-lock\.json$/,
];

// Exceptions - files that override classifications
const EXCEPTIONS = {
  runtime: [
    'data/projects', // data/projects should generally be tracked EXCEPT sessions
  ],
};

/**
 * Classify a file path
 */
function classifyFile(filePath) {
  // Skip git dir and node_modules
  if (filePath.startsWith('.git/') || filePath.startsWith('node_modules/')) {
    return { type: 'SKIP', reason: 'system directory' };
  }

  // Check RUNTIME patterns first (more specific)
  for (const pattern of RUNTIME_PATTERNS) {
    if (pattern.test(filePath)) {
      return { type: 'RUNTIME', reason: `matches runtime pattern: ${pattern}` };
    }
  }

  // Check DOCUMENTATION patterns
  for (const pattern of DOCUMENTATION_PATTERNS) {
    if (pattern.test(filePath)) {
      return { type: 'DOCUMENTATION', reason: `matches doc pattern: ${pattern}` };
    }
  }

  // Check CODE patterns
  for (const pattern of CODE_PATTERNS) {
    if (pattern.test(filePath)) {
      return { type: 'CODE', reason: `matches code pattern: ${pattern}` };
    }
  }

  // Default to CODE (most files are source)
  return { type: 'CODE', reason: 'default classification' };
}

/**
 * Walk directory recursively
 */
function walkDir(dir, callback, baseDir = '') {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const relPath = path.join(baseDir, file);

    // Skip certain system directories
    if (file === '.git' || file === 'node_modules' || file === '.idea') {
      continue;
    }

    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      walkDir(fullPath, callback, relPath);
    } else {
      callback(relPath, stat.size);
    }
  }
}

/**
 * Main audit function
 */
function runAudit() {
  const results = {
    timestamp: new Date().toISOString(),
    repository: REPO_ROOT,
    summary: {
      CODE: [],
      RUNTIME: [],
      DOCUMENTATION: [],
      SKIP: [],
    },
    statistics: {
      CODE: 0,
      RUNTIME: 0,
      DOCUMENTATION: 0,
      SKIP: 0,
      total: 0,
    },
    issues: [],
  };

  // Walk all files
  walkDir(REPO_ROOT, (filePath, size) => {
    const classification = classifyFile(filePath);
    const type = classification.type;

    results.summary[type].push({
      path: filePath,
      size: size,
      reason: classification.reason,
    });

    results.statistics[type]++;
    results.statistics.total++;
  });

  // Identify potential issues
  for (const runtimeFile of results.summary.RUNTIME) {
    if (runtimeFile.path.includes('node_modules')) {
      results.issues.push({
        severity: 'WARNING',
        message: `Runtime file in node_modules: ${runtimeFile.path}`,
      });
    }
  }

  // Check for uncommitted runtime patterns
  if (fs.existsSync(GIT_DIR)) {
    const allowedRuntimeInGit = [];
    const notAllowed = results.summary.RUNTIME.filter(f =>
      !f.path.includes('node_modules'),
    );

    if (notAllowed.length > 0) {
      results.issues.push({
        severity: 'INFO',
        message: `Found ${notAllowed.length} runtime files in repo (expected to be in .gitignore)`,
        files: notAllowed.slice(0, 10).map(f => f.path),
      });
    }
  }

  return results;
}

// Execute
const audit = runAudit();

// Output results
console.log(JSON.stringify(audit, null, 2));

// Save to file
const outputPath = path.join(REPO_ROOT, '.runtime-audit.json');
fs.writeFileSync(outputPath, JSON.stringify(audit, null, 2), 'utf8');

console.error(`\n✅ Audit complete. Results saved to: ${outputPath}`);
console.error(`\nSummary:`);
console.error(`  CODE: ${audit.statistics.CODE} files`);
console.error(`  RUNTIME: ${audit.statistics.RUNTIME} files`);
console.error(`  DOCUMENTATION: ${audit.statistics.DOCUMENTATION} files`);
console.error(`  SKIP: ${audit.statistics.SKIP} files`);
console.error(`  TOTAL: ${audit.statistics.total} files`);

if (audit.issues.length > 0) {
  console.error(`\n⚠️  Issues found:`);
  audit.issues.forEach(issue => {
    console.error(`  [${issue.severity}] ${issue.message}`);
    if (issue.files) {
      issue.files.forEach(f => console.error(`    - ${f}`));
    }
  });
}
