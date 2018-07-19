const path = require("path");
const fs = require("fs");
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");

var dir_app = path.resolve(__dirname, "app");
var dir_build = path.resolve(__dirname, "build");
var dir_html = path.resolve(__dirname, "html");
var dir_data = path.resolve(__dirname, "data");
var dir_geo = path.resolve(
  __dirname,
  "./node_modules/@ripe-rnd/ui-components/data/geo"
);

console.log(path.resolve(__dirname));
module.exports = {
  entry: [
    "babel-polyfill",
    "react-hot-loader/patch",
    "webpack/hot/only-dev-server",
    path.resolve(dir_app, "index.js") //,
    //path.resolve(dir_app, "worker.js")
    //path.resolve(dir_app, "worker.probeUpdates.js")
  ],
  module: {
    rules: [
      {
        test: /\.js[x]?$/,
        //include: [/app/],
        // includes don't work with linked (local) modules,
        // such as the @ripe-rnd/ui-components
        // so excluding is the way to go.
        exclude: [
          /.*node_modules\/((?!@ripe-rnd).)*$/ //,
          ///\.worker\.js$/
        ],
        use: ["babel-loader"]
      },
      {
        test: /\.less$/,
        use: [
          { loader: "style-loader" },
          { loader: "css-loader" },
          { loader: "less-loader" }
        ]
      },
      {
        test: /\.css$/,
        use: [
          { loader: "style-loader" },
          { loader: "css-loader", options: { modules: true } }
        ]
      }
      // },
      // {
      //     test: /\.worker\.js$/,
      //     use: [{ loader: "worker-loader" }, { loader: "babel-loader" }]
      // }
    ]
  },
  resolve: {
    extensions: ["*", ".js", ".jsx"],
    symlinks: false,
    alias: {
      react: path.resolve("./node_modules/react"),
      "styled-components": path.resolve(
        __dirname,
        "node_modules",
        "styled-components"
      )
    }
  },
  output: {
    path: dir_build,
    publicPath: "/",
    filename: "bundle.js"
  },
  //context: dir_app,
  devtool: "cheap-module-source-map",
  devServer: {
    host: "4040.ripe.net",
    port: 4040,
    hot: true,
    public: "4040.ripe.net",
    disableHostCheck: true,
    headers: {
      "Access-Control-Allow-Origin": "*"
    },
    contentBase: dir_build,
    historyApiFallback: {
      rewrites: [
        { from: /bundle\.js/, to: "/bundle.js" },
        { from: /index\.html/, to: "/index.html" },
        { from: /as\/[0-9]+/, to: "/index.html" }
      ]
    }
  },
  plugins: [
    new CopyWebpackPlugin([
      { from: dir_html },
      { from: dir_geo, to: "geo/" },
      { from: "./node_modules/socket.io-client/dist/socket.io.js" }
    ]),
    // enable HMR globally
    new webpack.HotModuleReplacementPlugin(),
    // prints more readable module names in the browser console on HMR updates
    new webpack.NamedModulesPlugin()
  ]
};
