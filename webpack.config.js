const path = require('path');

module.exports = {
    // webpack folder's entry js - excluded from jekll's build process.
    entry: {
        main: './webpack/entry.js',
    },
    output: {
      // we're going to put the generated file in the assets folder so jekyll will grab it.
        path: '/assets/js/',
        filename: "bundle.js"
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /(node_modules)/,
          loader: 'babel-loader',
          query: {
            presets: ['react', 'es2015']
          }
        }
      ]
    }
  };
