const path = require("path")
const index = path.resolve(__dirname, "src", "index.tsx")

module.exports = {
	entry: ["@babel/polyfill", index],
	output: {
		filename: "bundle.min.js",
		path: __dirname + "/dist",
	},

	resolve: {
		extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
	},

	module: {
		rules: [
			{
				test: /\.(js|ts)x?$/,
				exclude: /(?:node_modules|\.min\.js$|dist\/)/,
				use: "babel-loader",
			},
		],
	},
}
