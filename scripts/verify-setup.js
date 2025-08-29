#!/usr/bin/env node

/**
 * Setup verification script for AI Virtual Wardrobe
 * Checks that all required configuration is in place
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🔍 Verifying AI Virtual Wardrobe setup...\n');

let hasErrors = false;

// Check required files
const requiredFiles = [
  'package.json',
  'tsconfig.json',
  'vite.config.ts',
  'index.html',
  'index.tsx',
  'styles.css',
  'env.d.ts',
  '.env.example',
  '.gitignore'
];

console.log('📁 Checking required files:');
requiredFiles.forEach(file => {
  const filePath = join(projectRoot, file);
  if (existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - Missing!`);
    hasErrors = true;
  }
});

// Check TypeScript configuration
console.log('\n⚙️  Checking TypeScript configuration:');
try {
  const tsConfig = JSON.parse(readFileSync(join(projectRoot, 'tsconfig.json'), 'utf8'));
  
  if (tsConfig.compilerOptions?.strict) {
    console.log('  ✅ Strict mode enabled');
  } else {
    console.log('  ❌ Strict mode not enabled');
    hasErrors = true;
  }
  
  if (tsConfig.compilerOptions?.jsx === 'react-jsx') {
    console.log('  ✅ React JSX configured');
  } else {
    console.log('  ❌ React JSX not properly configured');
    hasErrors = true;
  }
  
  if (tsConfig.compilerOptions?.paths?.['@/*']) {
    console.log('  ✅ Path aliases configured');
  } else {
    console.log('  ❌ Path aliases not configured');
    hasErrors = true;
  }
} catch (error) {
  console.log('  ❌ Error reading tsconfig.json:', error.message);
  hasErrors = true;
}

// Check package.json
console.log('\n📦 Checking package.json:');
try {
  const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));
  
  const requiredDeps = ['react', 'react-dom', '@google/genai'];
  const requiredDevDeps = ['typescript', 'vite', '@types/react', '@types/react-dom'];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies?.[dep]) {
      console.log(`  ✅ ${dep} dependency`);
    } else {
      console.log(`  ❌ ${dep} dependency missing`);
      hasErrors = true;
    }
  });
  
  requiredDevDeps.forEach(dep => {
    if (packageJson.devDependencies?.[dep]) {
      console.log(`  ✅ ${dep} dev dependency`);
    } else {
      console.log(`  ❌ ${dep} dev dependency missing`);
      hasErrors = true;
    }
  });
  
  const requiredScripts = ['dev', 'build', 'preview', 'type-check'];
  requiredScripts.forEach(script => {
    if (packageJson.scripts?.[script]) {
      console.log(`  ✅ ${script} script`);
    } else {
      console.log(`  ❌ ${script} script missing`);
      hasErrors = true;
    }
  });
} catch (error) {
  console.log('  ❌ Error reading package.json:', error.message);
  hasErrors = true;
}

// Check environment setup
console.log('\n🌍 Checking environment setup:');
if (existsSync(join(projectRoot, '.env.example'))) {
  console.log('  ✅ .env.example exists');
} else {
  console.log('  ❌ .env.example missing');
  hasErrors = true;
}

if (existsSync(join(projectRoot, '.env'))) {
  console.log('  ✅ .env file exists');
} else {
  console.log('  ⚠️  .env file not found (copy from .env.example)');
}

// Check styling setup
console.log('\n🎨 Checking styling setup:');
try {
  const indexHtml = readFileSync(join(projectRoot, 'index.html'), 'utf8');
  
  if (indexHtml.includes('tailwindcss.com')) {
    console.log('  ✅ Tailwind CSS CDN configured');
  } else {
    console.log('  ❌ Tailwind CSS CDN not found');
    hasErrors = true;
  }
  
  if (indexHtml.includes('/styles.css')) {
    console.log('  ✅ Custom styles linked');
  } else {
    console.log('  ❌ Custom styles not linked');
    hasErrors = true;
  }
} catch (error) {
  console.log('  ❌ Error reading index.html:', error.message);
  hasErrors = true;
}

// Check utility directories
console.log('\n📂 Checking utility directories:');
const utilityDirs = ['constants', 'utils', 'components', 'services'];
utilityDirs.forEach(dir => {
  if (existsSync(join(projectRoot, dir))) {
    console.log(`  ✅ ${dir}/ directory`);
  } else {
    console.log(`  ❌ ${dir}/ directory missing`);
    hasErrors = true;
  }
});

// Final result
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ Setup verification failed! Please fix the issues above.');
  process.exit(1);
} else {
  console.log('✅ Setup verification passed! Your project is ready to go.');
  console.log('\nNext steps:');
  console.log('1. Copy .env.example to .env and add your API keys');
  console.log('2. Run "npm install" to install dependencies');
  console.log('3. Run "npm run dev" to start development server');
  process.exit(0);
}