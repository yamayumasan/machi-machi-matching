const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all folders including workspace root for monorepo support
config.watchFolders = [
  ...(config.watchFolders || []),
  workspaceRoot,
];

// Let Metro know about workspace packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Fix duplicate React issue in monorepo
// Force all React imports to resolve to the same instance
config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  'react-dom': path.resolve(projectRoot, 'node_modules/react-dom'),
};

// Block duplicate React from workspace root using resolveRequest
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Block react/react-native from workspace root
  if (
    (moduleName === 'react' || moduleName === 'react-native' || moduleName === 'react-dom') &&
    context.originModulePath.includes(workspaceRoot) &&
    !context.originModulePath.includes(path.join(workspaceRoot, 'packages/mobile'))
  ) {
    return {
      filePath: path.resolve(projectRoot, 'node_modules', moduleName, 'index.js'),
      type: 'sourceFile',
    };
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
