/**
 * (c) 2018 cepharum GmbH, Berlin, http://cepharum.de
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2018 cepharum GmbH
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * @author: cepharum
 */

"use strict";

const Crypto = require( "crypto" );

module.exports = {
	/**
	 * This function takes a password and a salt string and
	 * generates a corresponding hash.
	 *
	 * @param {string} password
	 * 		The password to be hashed in clear text
	 * @param {string|null} salt
	 * 		A generated and encoded salt string which will be used for the hashing;
	 * 		Set to null if a new salt shall be generated (16 bytes long)
	 * @param {string} encoding
	 * 		Encoding of the given salt which shall also be used for the hash string's components;
	 * 		Possible values: "base64" or "hex"
	 * @returns {string}
	 * 		Salted hash in the format "$ceph1$<encoding>$<salt-encoded>$<hash-encoded>"
	 */
	hashPassword( password, salt = null, encoding = "base64" ) {
		if (
			typeof password !== "string" || password === "" ||
			( salt != null && ( typeof salt !== "string" || salt === "" ) ) ||
			( encoding !== "base64" && encoding !== "hex" )
		) {
			throw new Error( "Crypto: Invalid arguments" );
		}

		let saltEncoded;
		if ( salt == null ) {
			const saltBuffer = Crypto.randomBytes( 16 );
			saltEncoded = saltBuffer.toString( encoding );
		} else if ( encoding === "base64" ) {
			const saltMatch = /^([^=]+)=*$/.exec( salt );
			if ( ! saltMatch ) {
				throw new Error( "Crypto: Encoding failed" );
			}
			saltEncoded = saltMatch[1];
		} else {
			saltEncoded = salt;
		}

		const hexMessage = Buffer.from( password ).toString( "hex" ) + (
			encoding === "base64" ?
				Buffer.from( saltEncoded, "base64" ).toString( "hex" ) :
				saltEncoded
		);

		const hashService = Crypto.createHash( "sha256" );
		hashService.update( hexMessage, "hex" );
		const hash = hashService.digest( encoding );

		let hashEncoded;
		if ( encoding === "base64" ) {
			const hashMatch = /^([^=]+)=*$/.exec( hash );
			if ( ! hashMatch ) {
				throw new Error( "Crypto: Encoding failed" );
			}
			hashEncoded = hashMatch[1];
		} else {
			hashEncoded = hash;
		}

		return `$ceph1$${encoding}$${saltEncoded}$${hashEncoded}`;
	},

	/**
	 * This function takes a password and a hash string and
	 * checks if both are matching.
	 *
	 * @param {string} password
	 * 		Password in clear text
	 * @param {string} hash
	 * 		Full hash-string in the format "$ceph1$<encoding>$<salt-encoded>$<hash-encoded>"
	 * @returns {boolean}
	 * 		Returns true iff the given password and the hash fit together
	 */
	checkPassword( password, hash ) {
		if (
			typeof password !== "string" || password === "" ||
			typeof hash !== "string" || hash === ""
		) {
			throw new Error( "Crypto: Invalid arguments" );
		}

		const hashMatch = /^\$ceph1\$([^$]+)\$([^$]+)\$([^$]+)$/.exec( hash );
		if ( !hashMatch ) {
			return null;
		}

		const encoding = hashMatch[1];
		if ( encoding !== "base64" && encoding !== "hex" ) {
			return null;
		}

		const hexMessage = Buffer.from( password ).toString( "hex" ) + (
			encoding === "base64" ?
				Buffer.from( hashMatch[2], "base64" ).toString( "hex" ) :
				hashMatch[2]
		);

		const hashService = Crypto.createHash( "sha256" );
		hashService.update( hexMessage, "hex" );
		const newHash = hashService.digest( encoding );

		if ( encoding === "base64" ) {
			const newHashMatch = /^([^=]+)=*$/.exec( newHash );
			if ( ! newHashMatch ) {
				throw new Error( "Crypto: Encoding failed" );
			}
			return hashMatch[3] === newHashMatch[1];
		}

		return hashMatch[3] === newHash;
	},

	/**
	 * @param {string} hash
	 * 		Hash string in format "$ceph1$<encoding>$<salt-encoded>$<hash-encoded"
	 * @returns {string|null}
	 * 		Base64-encoded salt string, or
	 * 		null if the hash string isn't well formatted
	 */
	queryPasswordSalt( hash ) {
		if ( typeof hash !== "string" || hash === "" ) {
			throw new Error( "Crypto: Invalid arguments" );
		}

		const hashMatch = /^\$ceph1\$([^$]+)\$([^$]+)\$([^$]+)$/.exec( hash );
		if ( !hashMatch ) {
			return null;
		}

		const encoding = hashMatch[1];
		if ( encoding !== "base64" && encoding !== "hex" ) {
			return null;
		}

		if ( encoding === "base64" ) {
			return hashMatch[2];
		}

		return Buffer.from( hashMatch[2], "hex" ).toString( "base64" );
	},
};
