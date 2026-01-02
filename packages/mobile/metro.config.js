const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch shared package
config.watchFolders = [workspaceRoot];

// Let Metro know about workspace packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Disable package exports for workspace packages
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
