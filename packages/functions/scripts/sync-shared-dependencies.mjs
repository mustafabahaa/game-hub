import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const branch = 'refs/heads/main';
const repositories = {
  '@monochrome-ui/design-system': 'mustafabahaa/monochrome-ui',
  '@agentic-ai/core': 'mustafabahaa/agentic-ai',
};

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const npm = (...args) => execFileSync(process.execPath, [process.env.npm_execpath, ...args], { stdio: 'inherit' });

function getMainRevision(repository) {
  const remote = execFileSync('git', [
    'ls-remote', '--exit-code', `https://github.com/${repository}.git`, branch,
  ], { encoding: 'utf8', timeout: 30_000 }).trim();
  const [revision, ref] = remote.split(/\s+/);
  if (!/^[a-f0-9]{40}$/.test(revision) || ref !== branch) {
    throw new Error(`Could not resolve ${repository} main.`);
  }
  return revision;
}

function getInstalledPackages(names) {
  const result = spawnSync(process.execPath, [
    process.env.npm_execpath, 'ls', ...names, '--depth=0', '--json', '--long',
  ], { encoding: 'utf8' });
  return result.status === 0 ? JSON.parse(result.stdout).dependencies : {};
}

function needsSync(name, revision, lock, installed) {
  const suffix = `#${revision}`;
  return !lock.packages?.[`node_modules/${name}`]?.resolved?.endsWith(suffix)
    || !installed?.[name]?.resolved?.endsWith(suffix);
}

try {
  const manifest = readJson('package.json');
  const dependencies = { ...manifest.devDependencies, ...manifest.dependencies };
  const revisions = Object.entries(repositories)
    .filter(([name]) => name in dependencies)
    .map(([name, repository]) => {
      if (dependencies[name] !== `github:${repository}#main`) {
        throw new Error(`Set ${name} to github:${repository}#main in package.json.`);
      }
      return [name, getMainRevision(repository)];
    });
  const names = revisions.map(([name]) => name);
  if (names.length > 0) {
    const lock = readJson('package-lock.json');
    const installed = getInstalledPackages(names);
    const stale = revisions.filter(([name, revision]) => needsSync(name, revision, lock, installed));

    if (stale.length > 0) {
      console.log(`Syncing ${stale.map(([name]) => name).join(', ')} from main…`);
      npm('update', ...stale.map(([name]) => name), '--no-audit', '--no-fund');
      const updatedLock = readJson('package-lock.json');
      const updatedPackages = getInstalledPackages(names);
      for (const [name, revision] of revisions) {
        if (needsSync(name, revision, updatedLock, updatedPackages)) {
          throw new Error(`${name} did not resolve to ${revision.slice(0, 7)}. Rerun the build to check main again.`);
        }
      }
    }

    console.log(revisions.map(([name, revision]) => `${name} is up to date (${revision.slice(0, 7)}).`).join('\n'));
  }
} catch (error) {
  console.error(`Shared dependency sync failed: ${error.message}`);
  process.exitCode = 1;
}
