"use strict";

const path = require( "path" );

module.exports = {
	// mode: "production",
	mode: "none",
	entry: "./src/crypto.js",
	output: {
		path: path.resolve( __dirname, "dist" ),
		filename: "web-crypto-client.umd.js",
		library: "WebCryptoClient",
		libraryTarget: "umd",
	},
	target: "web",
};
