const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, 'truffle_project', 'build', 'contracts');
const targetDir = path.join(root, 'src', 'contracts');
const files = ['Projects.json', 'RequestManager.json'];

if (!fs.existsSync(sourceDir)) {
  console.error(`Source directory not found: ${sourceDir}`);
  process.exit(1);
}

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

let failed = false;

for (const fileName of files) {
  const sourcePath = path.join(sourceDir, fileName);
  const targetPath = path.join(targetDir, fileName);

  if (!fs.existsSync(sourcePath)) {
    console.error(`Contract artifact not found: ${sourcePath}`);
    failed = true;
    continue;
  }

  try {
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`Copied ${fileName} to src/contracts/`);
  } catch (error) {
    console.error(`Failed to copy ${fileName}:`, error);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log('Contract artifacts copied successfully.');
