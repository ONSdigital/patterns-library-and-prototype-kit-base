import * as path from 'path';
import merge from 'webpack-merge';
import glob from 'glob';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import globImporter from 'node-sass-glob-importer';
import { NoEmitOnErrorsPlugin, NamedModulesPlugin } from 'webpack';
import ProgressBarPlugin from 'progress-bar-webpack-plugin';
import CircularDependencyPlugin from 'circular-dependency-plugin';
import FixStyleOnlyEntriesPlugin from 'webpack-fix-style-only-entries';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import postcssPlugins from './postcss.config';

const OUT_DIR = 'build';

const core = {
  context: `${__dirname}/src`,

  output: {
    path: path.join(process.cwd(), OUT_DIR),
    filename: '[name].js',
    chunkFilename: '[name].js'
  },

  resolve: {
    extensions: ['.js', '.njk', '.html'],
    modules: ['./node_modules'],
    alias: {
      js: path.resolve(__dirname, './src/js'),
      components: path.resolve(__dirname, './src/components'),
      tests: path.resolve(__dirname, './src/tests'),
      stubs: path.resolve(__dirname, './src/tests/stubs')
    }
  },

  resolveLoader: {
    modules: ['./node_modules']
  },

  plugins: [
    new NoEmitOnErrorsPlugin(),

    new NamedModulesPlugin(),

    new ProgressBarPlugin(),

    new CircularDependencyPlugin({
      exclude: /(\\|\/)node_modules(\\|\/)/,
      failOnError: false
    })
  ]
};

const jsCore = merge(core, {
  entry: {
    'scripts/bundle': ['./js/polyfills/index.js', './js/index.js'],
    'scripts/patternlib': ['./js/patternlib/index.js']
  },

  output: {
    publicPath: '/',
    chunkFilename: 'scripts/[name].js'
  },

  module: {
    rules: [
      {
        test: /\.(njk|html)$/,
        exclude: /(node_modules)/,
        loader: 'nunjucks-loader',
        query: {
          root: `${__dirname}/src`
        }
      }
    ]
  }

  // optimization: {
  //   splitChunks: {
  //     cacheGroups: {
  //       vendors: {
  //         test: /[\\/]node_modules[\\/]/,
  //         chunks: 'all',
  //         priority: 1,
  //         reuseExistingChunk: true,
  //         minChunks: 2,
  //         name: 'scripts/vendors',
  //       }
  //     }
  //   },
  // }
});

export default function(mode) {
  const devMode = mode === 'development';

  return {
    nonJs: merge(core, {
      mode,

      entry: {
        responsive: ['./scss/responsive.scss'],
        patternlib: ['./scss/patternlib.scss'],
        error: ['./scss/error.scss'],
        html: glob.sync('./**/*.{njk,html}', { cwd: 'src', ignore: './**/_*.{njk,html}' })
      },

      module: {
        rules: [
          // Styles
          {
            include: [path.join(process.cwd(), 'src/scss')],
            test: /\.scss$/,
            use: [
              MiniCssExtractPlugin.loader,
              {
                loader: 'css-loader',
                options: {
                  sourceMap: false,
                  importLoaders: 1
                }
              },
              {
                loader: 'postcss-loader',
                options: {
                  indent: 'postcss',
                  plugins: postcssPlugins
                }
              },
              {
                loader: 'sass-loader',
                options: {
                  sourceMap: false,
                  precision: 8,
                  includePaths: [path.join(process.cwd(), 'src/scss')],
                  importer: globImporter()
                }
              }
            ]
          },
          // Templates
          {
            test: /\.(njk|html)$/,
            loaders: [
              {
                loader: 'file-loader',
                options: {
                  name: '[path][name].html'
                }
              },
              {
                loader: path.resolve('./lib/nunjucks-html-loader.js'),
                options: {
                  searchPaths: `${__dirname}/src`,
                  layoutPath: 'views/layouts',
                  context: {
                    devMode,
                    isPatternLib: true
                  }
                }
              }
            ]
          },
          {
            test: /\.(jpg|png|webp|gif|otf|ttf|woff|woff2|ani)$/,
            loader: 'url-loader',
            options: {
              name: '[name].[hash:20].[ext]',
              limit: 10000
            }
          },
          {
            test: /\.(eot|svg|cur)$/,
            loader: 'file-loader',
            options: {
              name: '[name].[hash:20].[ext]',
              limit: 10000
            }
          }
        ]
      },

      plugins: [
        new MiniCssExtractPlugin({
          filename: '[name].css',
          chunkFilename: '[name].css'
        }),

        new FixStyleOnlyEntriesPlugin({
          extensions: ['scss', 'njk', 'html'],
          silent: true
        }),

        new CopyWebpackPlugin(
          [
            {
              from: {
                glob: 'fonts/**/*',
                dot: true
              }
            },
            {
              from: {
                glob: 'img/**/*',
                dot: true
              }
            },
            {
              from: {
                glob: 'favicons/**/*',
                dot: true
              }
            }
          ],
          {
            ignore: ['.gitkeep'],
            debug: 'warning'
          }
        )
      ]
    }),

    es2015plus: merge(jsCore, {
      mode,

      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /(node_modules)/,
            use: {
              loader: 'babel-loader',
              options: {
                babelrc: false,
                presets: [
                  [
                    '@babel/preset-env',
                    {
                      modules: false,
                      targets: {
                        browsers: ['Chrome >= 60', 'Safari >= 10.1', 'iOS >= 10.3', 'Firefox >= 54', 'Edge >= 15']
                      }
                    }
                  ]
                ],
                plugins: ['@babel/plugin-syntax-dynamic-import', '@babel/plugin-proposal-class-properties', 'rewiremock/babel']
              }
            }
          }
        ]
      }
    }),

    es5: merge(jsCore, {
      mode,

      output: {
        filename: '[name].es5.js',
        chunkFilename: 'scripts/[name].es5.js'
      },

      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /(node_modules)/,
            use: {
              loader: 'babel-loader',
              options: {
                babelrc: false,
                presets: [
                  [
                    '@babel/preset-env',
                    {
                      modules: false,
                      targets: {
                        browsers: ['last 3 versions']
                      }
                    }
                  ]
                ],
                plugins: ['@babel/plugin-syntax-dynamic-import', '@babel/plugin-proposal-class-properties', 'rewiremock/babel']
              }
            }
          }
        ]
      }
    })
  };
}
