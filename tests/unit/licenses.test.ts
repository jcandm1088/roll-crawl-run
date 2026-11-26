import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';

const root = (p: string) => new URL(`../../${p}`, import.meta.url);
const read = (p: string) => readFileSync(root(p), 'utf8');
const lock = JSON.parse(read('package-lock.json'));
const installed = (name: string) => lock.packages[`node_modules/${name}`].version as string;

const COMPONENTS = [
  { pkg: '@fontsource/fraunces', file: 'fraunces-OFL-1.1.txt', license: 'OFL-1.1', copyright: 'Copyright 2020 The Fraunces Project Authors' },
  { pkg: '@fontsource/inter', file: 'inter-OFL-1.1.txt', license: 'OFL-1.1', copyright: 'Copyright 2016 The Inter Project Authors' },
  { pkg: 'preact', file: 'preact-MIT.txt', license: 'MIT', copyright: 'Copyright (c) 2015-present Jason Miller' },
  { pkg: 'idb', file: 'idb-ISC.txt', license: 'ISC', copyright: 'Copyright (c) 2016, Jake Archibald' },
  { pkg: 'lucide-static', file: 'lucide-ISC-and-feather-MIT.txt', license: 'ISC', copyright: 'Lucide Icons and Contributors' },
];

describe('third-party license compliance', () => {
  it('ships an exact copy of each installed package’s license file', () => {
    for (const c of COMPONENTS) {
      expect(read(`public/licenses/${c.file}`)).toBe(read(`node_modules/${c.pkg}/LICENSE`));
      expect(read(`public/licenses/${c.file}`)).toContain(c.copyright);
      expect(JSON.parse(read(`node_modules/${c.pkg}/package.json`)).license).toBe(c.license);
    }
    expect(readdirSync(root('public/licenses/')).sort()).toEqual(COMPONENTS.map((c) => c.file).sort());
  });

  it('THIRD_PARTY_NOTICES.md lists every component with its installed version and license file', () => {
    const notices = read('THIRD_PARTY_NOTICES.md');
    for (const c of COMPONENTS) {
      expect(notices).toContain(installed(c.pkg));
      expect(notices).toContain(`public/licenses/${c.file}`);
    }
    expect(read('public/licenses/lucide-ISC-and-feather-MIT.txt')).toContain('Copyright (c) 2013-present Cole Bemis');
  });

  it('covers every runtime dependency', () => {
    const deps = Object.keys(JSON.parse(read('package.json')).dependencies).sort();
    expect(deps).toEqual(['@fontsource/fraunces', '@fontsource/inter', 'idb', 'preact']);
    // lucide-static is a devDependency but its icons are embedded in the bundle, so it is covered too.
  });

  it('the About screen lists the same files and versions', () => {
    const about = read('src/ui/screens/settings/Settings.tsx');
    for (const c of COMPONENTS) {
      expect(about).toContain(`file: '${c.file}'`);
      expect(about).toContain(installed(c.pkg));
    }
  });

  it('license texts are precached for offline use', () => {
    expect(read('vite.config.ts')).toContain("readdirSync(new URL('./public/licenses/'");
  });

  it('does not add a license for the application itself (owner decision deferred)', () => {
    const files = readdirSync(root(''));
    expect(files.filter((f) => /^(LICENSE|LICENCE|COPYING)(\.|$)/i.test(f))).toEqual([]);
  });
});
