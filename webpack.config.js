const exclude = /(?:node_modules|\.min\.js$|dist\/)/

module.exports = {
	entry: "./src/index.tsx",
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
				exclude,
				use: "babel-loader",
			},
		],
	},
}
