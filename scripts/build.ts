import esbuild from 'esbuild';
import origManifest from '../manifest.json';
import { join } from 'path';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'fs';
import { PluginManifest } from 'replugged/dist/types/addon';

const CHROME_VERSION = '91';
const REPLUGGED_FOLDER_NAME = 'replugged';
const manifest: PluginManifest = origManifest;
const prod = process.argv.includes('--prod');
const watch = process.argv.includes('--watch');

const CONFIG_PATH = (() => {
  if (process.platform === 'win32') return join(process.env.APPDATA || '', REPLUGGED_FOLDER_NAME);
  else if (process.platform === 'darwin')
    return join(process.env.HOME || '', 'Library', 'Application Support', REPLUGGED_FOLDER_NAME);
  else
    return join(
      process.env?.XDG_CONFIG_HOME || process.env.HOME || '',
      '.config',
      REPLUGGED_FOLDER_NAME,
    );
})();

const globalModules: esbuild.Plugin = {
  name: 'globalModules',
  setup: (build) => {
    build.onResolve({ filter: /^replugged.+$/ }, (args) => {
      if (args.kind !== 'import-statement') return;
      return {
        errors: [{ text: `Import from "replugged" instead of using "${args.path}".` }],
      };
    });

    build.onResolve({ filter: /^replugged$/ }, (args) => {
      if (args.kind !== 'import-statement') return;
      return { path: args.path, namespace: 'replugged' };
    });

    build.onLoad({ filter: /.*/, namespace: 'replugged' }, () => {
      return { contents: 'module.exports = window.replugged' };
    });
  },
};

const install: esbuild.Plugin = {
  name: 'install',
  setup: (build) => {
    build.onStart(() => {
      console.log(
        '🛠️  Building for',
        prod ? '\x1b[39;32m\x1b[22;1m🌐 Production' : '\x1b[39;34m\x1b[22;1m🔨 Development',
        '\x1b[0mand',
        !process.env.NO_INSTALL && !process.argv.includes('--no-install')
          ? '\x1b[39;32m\x1b[22;1minstalling'
          : '\x1b[39;31m\x1b[22;1mnot installing',
      );
      if (existsSync('dist')) for (const file of readdirSync('dist')) rmSync(join('dist', file));
      else mkdirSync('dist');
      writeFileSync('dist/manifest.json', JSON.stringify(manifest));
    });
    build.onEnd(() => {
      if (!process.env.NO_INSTALL && !process.argv.includes('--no-install')) {
        const dest = join(CONFIG_PATH, 'plugins', manifest.id);
        if (existsSync(dest)) rmSync(dest, { recursive: true });
        cpSync('dist', dest, { recursive: true });
        console.log('Installed updated version');
      }
    });
  },
};

const common: esbuild.BuildOptions = {
  absWorkingDir: join(__dirname, '..'),
  bundle: true,
  format: 'esm' as esbuild.Format,
  logLevel: 'info',
  minify: prod,
  platform: 'browser',
  target: `chrome${CHROME_VERSION}`,
  plugins: [globalModules, install],
  sourcemap: !prod,
  watch,
};

const targets = [];

if ('renderer' in manifest) {
  targets.push(
    esbuild.build({
      ...common,
      entryPoints: [manifest.renderer],
      outfile: 'dist/renderer.js',
    }),
  );

  manifest.renderer = 'renderer.js';
}

if ('plaintextPatches' in manifest) {
  targets.push(
    esbuild.build({
      ...common,
      entryPoints: [manifest.plaintextPatches],
      outfile: 'dist/plaintextPatches.js',
    }),
  );

  manifest.plaintextPatches = 'plaintextPatches.js';
}

Promise.all(targets);
