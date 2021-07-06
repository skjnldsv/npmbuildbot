// Based on https://github.com/skjnldsv/read-package-engines-version-actions/blob/fe94c407635f5e08a1bcbe43a605aef9991c9683/src/getNodeVersion.ts

import fs from 'fs';
import { join } from 'path';

/**
 * Find package.json with path.
 * @param path
 */
export const findPackageJson = (path) => {
  return fs.readFileSync(join(path, 'package.json')).toString();
};

/**
 * Get engines versions field within package.json
 * @param type
 * @param path
 * @param fallback
 */
const getEngineVersionFor = (
  type,
  path,
  fallback
) => {
  const packageJson = findPackageJson(path);
  const engines = JSON.parse(packageJson).engines;

  if (engines && engines[type]) {
    return engines[type];
  }

  if (fallback) {
    return fallback;
  }

  return '';
};

/**
 * Get engines node version field within package.json
 * @param path
 * @param fallback
 */
export const getNodeVersion = (path, fallback) => {
  return getEngineVersionFor('node', path, fallback);
};

/**
 * Get engines npm version field within package.json
 * @param path
 * @param fallback
 */
export const getNpmVersion = (path, fallback) => {
  return getEngineVersionFor('npm', path, fallback);
};
