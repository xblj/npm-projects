const ExternalPlugin = require('webpack/lib/ExternalModule');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const PLUGIN_ID = 'AutoExternalWebpackPlugin';

class AutoExternalWebpackPlugin {
  constructor(options) {
    this.options = options;
  }
  apply(compiler) {
    compiler.hooks.normalModuleFactory.tap(PLUGIN_ID, (normalModuleFactory) => {
      normalModuleFactory.hooks.factory.tap(
        PLUGIN_ID,
        (factory) => (data, callback) => {
          const dependency = data.dependencies[0];
          const moduleName = dependency.request;
          const config = this.options[moduleName];
          if (config) {
            // 外部引用模块，不需要打包
            callback(
              null,
              new ExternalPlugin(config.variable, 'windows', dependency.request)
            );
          } else {
            factory(data, callback);
          }
        }
      );
    });

    compiler.hooks.compilation.tap(PLUGIN_ID, (compilation) => {
      HtmlWebpackPlugin.getHooks(compilation).alterAssetTags.tapAsync(
        PLUGIN_ID,
        (data, cb) => {
          const { assetTags } = data;

          const { options } = this;
          const objArr = Object.keys(options).map((key) => {
            return {
              tagName: 'script',
              attributes: {
                type: 'text/javascript',
                src: options[key].src,
                head: true,
              },
            };
          });

          cb(null, {
            ...data,
            assetTags: {
              ...assetTags,
              scripts: [...assetTags.scripts, ...objArr],
            },
          });
        }
      );
      HtmlWebpackPlugin.getHooks(compilation).alterAssetTagGroups.tapAsync(
        PLUGIN_ID,
        (data, cb) => {
          console.log(data);
          let { bodyTags, headTags } = data;
          bodyTags = bodyTags.filter((script) => {
            const { attributes } = script;
            if (attributes.head) {
              delete attributes.head;
              headTags.push(script);
            }
            return !attributes.head;
          });

          cb(null, {
            ...data,
            bodyTags,
            headTags,
          });
        }
      );
    });
  }
}

module.exports = AutoExternalWebpackPlugin;
