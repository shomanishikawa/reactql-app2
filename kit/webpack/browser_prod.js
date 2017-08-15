/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */

// This config generates a production-grade browser bundle.  It minifies and
// optimises all Javascript source code, and extracts and processes CSS before
// dumping it in a finished `styles.css` file in the `dist` folder

// ----------------------
// IMPORTS

/* Node */

import { join } from 'path';

import StatsPlugin from 'stats-webpack-plugin';
/* NPM */

import webpack from 'webpack';
import WebpackConfig from 'webpack-config';

// In dev, we inlined stylesheets inside our JS bundles.  Now that we're
// building for production, we'll extract them out into a separate .css file
// that can be called from our final HTML.  This plugin does the heavy lifting
import ExtractTextPlugin from 'extract-text-webpack-plugin';

// Compression plugin for generating `.gz` static files
import ZopfliPlugin from 'zopfli-webpack-plugin';

// Generate .br files, using the Brotli compression algorithm
import BrotliPlugin from 'brotli-webpack-plugin';

// Chunk Manifest plugin for generating a chunk asset manifest
import ChunkManifestPlugin from 'chunk-manifest-webpack-plugin';

// Plugin for computing chunk hash
import WebpackChunkHash from 'webpack-chunk-hash';

// Manifest plugin for generating an asset manifest
import ManifestPlugin from 'webpack-manifest-plugin';

// Bundle Analyzer plugin for viewing interactive treemap of bundle
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

// Copy files from `PATH.static` to `PATHS.public`
import CopyWebpackPlugin from 'copy-webpack-plugin';

// Chalk library for adding color to console messages
import chalk from 'chalk';

/* Local */

// Common config
import { css, webpackProgress } from './common';

// Our local path configuration, so webpack knows where everything is/goes
import PATHS from '../../config/paths';

// Project configuration to control build settings
import { BUNDLE_ANALYZER } from '../../config/project';

// Used to extract css chunks, replaces extract-text-webpack-plugin
import ExtractCssChunks from 'extract-css-chunks-webpack-plugin';

// ----------------------

// Extend the `browser.js` config
export default new WebpackConfig().extend({
  '[root]/browser.js': config => {
    // Optimise images
    config.module.rules.find(l => l.test.toString() === /\.(jpe?g|png|gif|svg)$/i.toString())
      .use.push({
        loader: 'image-webpack-loader',
        // workaround for https://github.com/tcoopman/image-webpack-loader/issues/88
        options: {},
      });

    // Removing plugins defined in browser.js, as they break dynamic bundling
    delete config.plugins;

    return config;
  },
}).merge({
  output: {
    // Filenames will be <name>.<chunkhash>.js in production on the browser
    filename: '[name].[chunkhash].js',
    chunkFilename: '[name].[chunkhash].js',
  },
  module: {
    rules: [
      ...css.getExtractCSSLoaders(ExtractCssChunks),
    ],
  },
  // Minify, optimise
  plugins: [
    webpackProgress(
      `${chalk.magenta.bold('ReactQL browser bundle')} in ${chalk.bgMagenta.white.bold('production mode')}`,
    ),

    // Set NODE_ENV to 'production', so that React will minify our bundle
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'production',
      DEBUG: false,
    }),

    // Check for errors, and refuse to emit anything with issues
    new webpack.NoEmitOnErrorsPlugin(),

    // Minimize
    new webpack.optimize.UglifyJsPlugin({
      output: {
        comments: false,
      },
      exclude: [/\.min\.js$/gi], // skip pre-minified libs
    }),

    // A plugin for a more aggressive chunk merging strategy
    new webpack.optimize.AggressiveMergingPlugin(),

    // Compress assets into .gz files, so that our Koa static handler can
    // serve those instead of the full-sized version
    new ZopfliPlugin({
      // Use Zopfli compression
      algorithm: 'zopfli',
      // Overwrite the default 80% compression-- anything is better than
      // nothing
      minRatio: 0.99,
    }),

    // Also generate .br files, with Brotli compression-- often significantly
    // smaller than the gzip equivalent, but not yet universally supported
    new BrotliPlugin({
      // Overwrite the default 80% compression-- anything is better than
      // nothing
      minRatio: 0.99,
    }),

    // Fire up CSS extraction
    new ExtractCssChunks,

    // Extract webpack bootstrap logic into a separate file
    new webpack.optimize.CommonsChunkPlugin({
      name: 'manifest',
      minChunks: Infinity,
    }),

    // Map hash to module id
    new webpack.HashedModuleIdsPlugin(),

    // Compute chunk hash
    new WebpackChunkHash(),

    // Generate chunk manifest
    new ChunkManifestPlugin({
      // Put this in `dist` rather than `dist/public`
      filename: '../chunk-manifest.json',
      manifestVariable: 'webpackManifest',
    }),

    // Generate assets manifest
    new ManifestPlugin({
      // Put this in `dist` rather than `dist/public`
      fileName: '../manifest.json',
      // Prefix assets with '/' so that they can be referenced from any route
      publicPath: '/',
    }),

    // Output interactive bundle report
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: join(PATHS.dist, 'report.html'),
      openAnalyzer: BUNDLE_ANALYZER.openAnalyzer,
    }),

    // Enable scope hoisting to speed up JS loading
    new webpack.optimize.ModuleConcatenationPlugin(),

    // Copy files from `PATHS.static` to `dist/public`.  No transformations
    // will be performed on the files-- they'll be copied as-is
    new CopyWebpackPlugin([
      {
        from: PATHS.static,
        force: true, // This flag forces overwrites between versions
      },
    ]),

    // Vendor chunk
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: module => (
         // this assumes your vendor imports exist in the node_modules directory
         module.context && module.context.indexOf('node_modules') !== -1
      ),
    }),

    // Commons bootstrap chunk
    new webpack.optimize.CommonsChunkPlugin({
      names: ['bootstrap'], // needed to put webpack bootstrap code before chunks
      filename: '[name].js',
      minChunks: Infinity
    }),

    new StatsPlugin('stats.json'),

    // Create a `SERVER` constant that's false in the browser-- we'll use this to
    // determine whether we're running on a Node server and set this to true
    // in the server.js config
    new webpack.DefinePlugin({
      SERVER: false,
    }),
  ],
});
