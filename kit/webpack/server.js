/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */

// ----------------------
// IMPORTS

/* NPM */
import webpack from 'webpack';
import WebpackConfig from 'webpack-config';

/* Local */
import { css } from './common';

// Filesystem utilities to build up externals
import fs from 'fs'
import path from 'path';

// Creating externals, and whitelisted packages to include in bundle.
const res = p => path.resolve(__dirname, p);
const nodeModules = res('../../node_modules');
const externals = fs
  .readdirSync(nodeModules)
  .filter(x => !/\.bin|react-universal-component|extract-css-chunks-webpack-plugin|webpack-flush-chunks/.test(x))
  .reduce((externals, mod) => {
    externals[mod] = `commonjs ${mod}`
    return externals
  }, {});
externals['react-dom/server'] = 'commonjs react-dom/server';

// ----------------------

// Helper function to recursively filter through loaders, and apply the
// supplied function
function recursiveLoader(root = {}, func) {
  if (root.rules) {
    root.use.forEach(l => recursiveLoader(l, func));
  }
  if (root.loader) return func(root);
  return false;
}

export default new WebpackConfig().extend({
  '[root]/base.js': conf => {
    // Prevent file emission, since the browser bundle will already have done it
    conf.module.rules.forEach(loader => {
      recursiveLoader(loader, l => {
        if (l.loader === 'file-loader') {
          // eslint-disable-next-line
          l.query.emitFile = false;
        }
      });
    });
    return conf;
  },
}).merge({

  // Set the target to Node.js, since we'll be running the bundle on the server
  target: 'node',

  node: {
    __dirname: false,
  },

  module: {
    rules: [
      // CSS loaders
      ...(function* loadCss() {
        for (const loader of css.rules) {
          // Iterate over CSS/SASS/LESS and yield local and global mod configs
          for (const mod of css.getModuleRegExp(loader.ext)) {
            yield {
              test: new RegExp(mod[0]),
              use: [
                {
                  loader: 'css-loader/locals',
                  query: Object.assign({}, css.loaderDefaults, mod[1]),
                },
                'postcss-loader',
                ...loader.use,
              ],
            };
          }
        }
      }()),
      // .js(x) files can extend the `.babelrc` file at the root of the project
      // (which was used to spawn Webpack in the first place), because that's
      // exactly the same polyfill config we'll want to use for this bundle
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: [
            'react',
          ],
          plugins: [
            'transform-object-rest-spread',
            'syntax-dynamic-import',
            'transform-class-properties',
            'transform-decorators-legacy',
            'universal-import',
          ],
        },
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      // We're running on the Node.js server, so set `SERVER` to true
      SERVER: true,
    }),

    // Limiting chunk count for dynamic loading
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1
    }),
  ],
  // No need to transpile `node_modules` files, since they'll obviously
  // still be available to Node.js when we run the resulting `server.js` entry
  externals
});
