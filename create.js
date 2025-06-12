#!/usr/bin/env node

const path = require('path');
const fs = require('fs-extra');
const prompts = require('prompts');
const { execSync } = require('child_process');

async function main() {
  const response = await prompts({
    type: 'text',
    name: 'projectName',
    message: 'Project name:',
    initial: 'hedra-avatar-app',
    validate: name => name ? true : 'Project name cannot be empty',
  });

  const projectName = response.projectName.trim();
  const templateDir = path.join(__dirname, 'template');
  const targetDir = path.join(process.cwd(), projectName);

  if (fs.existsSync(targetDir)) {
    const overwrite = await prompts({
      type: 'confirm',
      name: 'value',
      message: `Directory "${projectName}" already exists. Overwrite?`,
      initial: false,
    });
    if (!overwrite.value) {
      console.log('Aborted.');
      process.exit(1);
    }
    fs.removeSync(targetDir);
  }

  console.log(`\nCreating project in ${targetDir}...`);
  await fs.copy(templateDir, targetDir);

  // Rename .env.example -> .env
  const envExamplePath = path.join(targetDir, '.env.example');
  const envPath = path.join(targetDir, '.env');
  if (fs.existsSync(envExamplePath)) {
    fs.moveSync(envExamplePath, envPath, { overwrite: true });
  }

  // Install dependencies
  console.log('\nInstalling dependencies. This might take a minute...');
  execSync('npm install', { cwd: targetDir, stdio: 'inherit' });

  // Done
  console.log('\n✅ Success! Your Hedra Avatar app is ready.\n');
  console.log(`Next steps:
  cd ${projectName}
  npm start

Your app will be available at http://localhost:3000 once both frontend and backend are running.
`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
