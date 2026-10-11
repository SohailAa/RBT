const { execSync } = require('child_process');

function run(cmd) {
  return execSync(cmd, { stdio: 'inherit' });
}

const msg = process.argv.slice(2).join(' ') || `Update ${new Date().toISOString().replace('T', ' ').slice(0, 19)}`;

console.log('1. Running smoke tests...');
try {
  run('node test.js');
} catch (e) {
  console.error('\nTests failed! Aborting push to prevent breaking the live site.');
  process.exit(1);
}

console.log('\n2. Staging changes...');
run('git add -A');

console.log(`\n3. Committing: "${msg}"...`);
try {
  run(`git commit -m "${msg}"`);
} catch (e) {
  console.log('No new changes to commit.');
}

console.log('\n4. Pushing to GitHub (main)...');
run('git push origin main');

console.log('\nSUCCESS: Pushed to GitHub (main)!');
console.log('Vercel will automatically detect this push and update your live site within ~20-30 seconds.');
