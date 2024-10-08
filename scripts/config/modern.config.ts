import fs from 'node:fs';
import path from 'node:path';
import {
  type CliPlugin,
  type ModuleTools,
  type PartialBaseBuildConfig,
  defineConfig,
  moduleTools,
} from '@modern-js/module-tools';

export const define = {
  RSBUILD_VERSION: require('../../packages/core/package.json').version,
};

export const commonExternals = [
  'webpack',
  '@rspack/core',
  '@rsbuild/core',
  /[\\/]compiled[\\/]/,
  /node:/,
];

export const BUILD_TARGET = {
  node: 'es2021',
  client: 'es2017',
} as const;

export const requireShim = {
  // use import.meta['url'] to bypass bundle-require replacement of import.meta.url
  js: `import { createRequire } from 'module';
var require = createRequire(import.meta['url']);\n`,
};

export const esmBuildConfig: PartialBaseBuildConfig = {
  format: 'esm',
  target: BUILD_TARGET.node,
  define,
  autoExtension: true,
  shims: true,
  externals: commonExternals,
  banner: requireShim,
  dts: false,
};

export const cjsBuildConfig: PartialBaseBuildConfig = {
  format: 'cjs',
  target: BUILD_TARGET.node,
  define,
  autoExtension: true,
  externals: commonExternals,
  dts: false,
};

export const dualBuildConfigs: PartialBaseBuildConfig[] = [
  cjsBuildConfig,
  esmBuildConfig,
  {
    buildType: 'bundleless',
    dts: {
      only: true,
    },
  },
];

export const emitTypePkgJsonPlugin: CliPlugin<ModuleTools> = {
  name: 'emit-type-pkg-json-plugin',

  setup() {
    return {
      afterBuild() {
        const typesDir = path.join(process.cwd(), 'dist-types');
        const pkgPath = path.join(typesDir, 'package.json');
        if (!fs.existsSync(typesDir)) {
          fs.mkdirSync(typesDir);
        }
        fs.writeFileSync(
          pkgPath,
          JSON.stringify({
            '//': 'This file is for making TypeScript work with moduleResolution node16+.',
            version: '1.0.0',
          }),
          'utf8',
        );
      },
    };
  },
};

export const configForSeparateTypesPackage = defineConfig({
  plugins: [moduleTools(), emitTypePkgJsonPlugin],
  buildConfig: [
    cjsBuildConfig,
    esmBuildConfig,
    {
      buildType: 'bundleless',
      dts: {
        distPath: '../dist-types',
        only: true,
      },
    },
  ],
});
