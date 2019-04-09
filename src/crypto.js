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

const Database = require( "./indexedDB" );
const BufferTools = require( "./bufferTools" );

const db = Database.serveObject();

const CryptoInterface = window.crypto || window.msCrypto;
if ( !CryptoInterface || !CryptoInterface.subtle ) {
	throw new Error( "FATAL ERROR: Can't access Web Crypto API on this system." );
}

const CryptoAsymmetricAlgorithm = {
	name: "RSA-OAEP",
	modulusLength: "2048",
	publicExponent: new Uint8Array( [ 0x01, 0x00, 0x01 ] ),
	hash: { name: "SHA-256" }
};

/**
 * This class offers an interface to the Web Crypto API of modern browsers.
 */
class Crypto {

	/**
	 * @param {string|null} databaseName
	 * 		Name of the local database where the encryption keys shall be stored, or
	 *		null if the instance shall be limited to functions where no local database access is needed.
	 */
	constructor( databaseName = null ) {
		if ( databaseName != null && ( typeof databaseName !== "string" || databaseName === "" ) ) {
			throw new Error( "Crypto: Invalid arguments" );
		}

		this.publicKey = null;
		this.privateKey = null;
		this.publicKeyExport = null;
		this.privateKeyExport = null;

		this.dbName = databaseName;
		if ( this.dbName != null ) {
			db.init( this.dbName, "crypto" );
		}

		this.accessPath = "default";
	}

	/**
	 * This function sets the identifier
	 * which will be used to identify the correct key-pair in the database.
	 *
	 * @param {string} accessPath
	 * 		Database identifier of the asymmetric key-pair, e.g. "gsap"
	 * @returns {this}
	 * 		Object's instance
	 */
	setAccessPath( accessPath ) {
		if ( typeof accessPath !== "string" || accessPath === "" ) {
			throw new Error( "Crypto: Invalid arguments" );
		}

		this.accessPath = accessPath;
		return this;
	}

	/**
	 * @returns {boolean}
	 * 		True iff a private and a public key are accessible through the object.
	 */
	hasKeyPair() {
		return typeof this.publicKeyExport === "string" &&
			this.publicKey instanceof window.CryptoKey &&
			this.privateKey instanceof window.CryptoKey;
	}

	/**
	 * @returns {boolean}
	 * 		True iff a public key is accessible through the object.
	 */
	hasPublicKey() {
		return typeof this.publicKeyExport === "string" &&
			this.publicKey instanceof window.CryptoKey;
	}

	/**
	 * @returns {boolean}
	 * 		True iff the Web Crypto API is accessible.
	 */
	static isAvailable() {
		return CryptoInterface != null;
	}

	/**
	 * @returns {string|null}
	 * 		The public key string out of the JSON Web Key structure, or
	 *		null if no public key is accessible through the object.
	 */
	getPublicKeyString() {
		return this.publicKeyExport;
	}

	/**
	 * This function returns the export data which contains the
	 * asymmetric key-pair.
	 *
	 * This data is prepared and encoded during key-generation
	 * when a password is given to generateKeyPair().
	 *
	 * @returns {string|null}
	 *		String with the export data, or
	 *		null iff no export-data was prepared during initialisation
	 */
	getPrivateKeyString() {
		return this.privateKeyExport || null;
	}

	/**
	 * This function generates a new key-pair for asymmetric encryption,
	 * stores it in the database and makes it accessible for the service.
	 *
	 * Case 1: Export password given.
	 *	1. Generate asymmetric key-pair which can be exported
	 *	2. Export private key into object
	 *	3. Export public key into string
	 *	4. Reimport private key into object which **can't** be exported
	 *	5. Generate symmetric key based on given password
	 *	6. Encrypt exported private key
	 *	7. Store the asymmetric key-pair together with the exports in the database
	 *
	 * Case 2: No export password given.
	 *	1. Generate asymmetric key-pair where the private key **can't** be exported
	 *	2. --
	 *	3. Export public key into string
	 *	4. --
	 *	5. --
	 *	6. --
	 *	7. Store the asymmetric key-pair together with the exported public key in the database
	 *
	 * @param {string|null} exportPassword
	 * 		Password which will later be used to export the private key, or
	 * 		null if it shall not be possible to export the private key
	 * @returns {Promise<null>}
	 * 		Resolves after the new key-pair was successfully created and stored in the database
	 */
	generateKeyPair( exportPassword = null ) {
		if ( exportPassword != null && ( typeof exportPassword !== "string" || exportPassword === "" ) ) {
			return Promise.reject( new Error( "Crypto: Invalid arguments" ) );
		}
		if ( CryptoInterface == null || this.dbName == null || !db.isReady() ) {
			return Promise.reject( new Error( "Crypto: Service is not available" ) );
		}

		this.privateKey = null;
		this.publicKey = null;
		this.privateKeyExport = null;
		this.publicKeyExport = null;

		const keys = {};

		let privateKeyJWK;

		// Step 1: Generate asymmetric key-pair (always)
		return CryptoInterface.subtle.generateKey(
			CryptoAsymmetricAlgorithm,
			exportPassword != null,
			[ "encrypt", "decrypt" ]
		)
			.then( result => {
				keys.public = result.publicKey;

				// Step 2: Export private key into object (if needed)
				if ( exportPassword != null ) {
					return CryptoInterface.subtle.exportKey(
						"jwk",
						result.privateKey
					);
				}
				keys.private = result.privateKey;
				return true;
			} )
			.then( result => {
				if ( exportPassword != null ) {
					privateKeyJWK = result;
				}

				// Step 3: Export public key into string (always)
				return CryptoInterface.subtle.exportKey(
					"jwk",
					keys.public
				);
			} )
			.then( result => {
				keys.publicExport = "$ceph1-publ$jwk$" + result.n;

				// Step 4: Reimport private key (if needed)
				if ( exportPassword != null ) {
					return CryptoInterface.subtle.importKey(
						"jwk",
						privateKeyJWK,
						CryptoAsymmetricAlgorithm,
						false,
						["decrypt"]
					);
				}
				return true;
			} )
			.then( result => {
				if ( exportPassword != null ) {
					keys.private = result;

					// Step 5 + 6: Create symmetric key and use it to encrypt private-key (if needed)
					return this.encryptData( JSON.stringify( privateKeyJWK ), exportPassword );
				}
				return true;
			} )
			.then( result => {
				if ( exportPassword != null ) {
					keys.privateExport = `$ceph1-priv$hex$${result}`;
				}

				// Step 7: Save asymmetric key-pair in database (always)
				return db.writeItem( this.accessPath, keys );
			} )
			.then( () => {
				this.privateKey = keys.private;
				this.publicKey = keys.public;
				this.privateKeyExport = keys.privateExport;
				this.publicKeyExport = keys.publicExport;
			} );
	}

	/**
	 * This function determines if a key-pair for asymmetric encryption
	 * was stored in the database, before. The key-pair is then loaded
	 * so that it can be used by the mixin.
	 *
	 * @returns {Promise<null>}
	 * 		Resolves after the key-pair was successfully loaded from database
	 */
	loadKeyPair() {
		if ( CryptoInterface == null || this.dbName == null || !db.isReady() ) {
			return Promise.reject( new Error( "Crypto: Service is not available" ) );
		}

		this.privateKey = null;
		this.publicKey = null;
		this.privateKeyExport = null;
		this.publicKeyExport = null;

		return db.readItem( this.accessPath )
			.then( keys => {
				if ( keys != null ) {
					this.privateKey = keys.private || null;
					this.publicKey = keys.public || null;
					this.privateKeyExport = keys.privateExport || null;
					this.publicKeyExport = keys.publicExport || null;
				}
			} );
	}

	/**
	 * This function imports a public key which is given as a string taken from a JSON Web Key.
	 *
	 * The service can then encrypt messages using this public key.
	 *
	 * No database connection is needed for this method.
	 *
	 * @param {string} keyString
	 * 		Public key in the format "$ceph1-publ$jwk$<key>"
	 * @returns {Promise<boolean>}
	 * 		Resolves after the key was successfully imported
	 */
	importPublicKey( keyString ) {
		if ( typeof keyString !== "string" || keyString === "" || keyString.substr( 0, 16 ) !== "$ceph1-publ$jwk$" ) {
			return Promise.reject( new Error( "Crypto: Invalid arguments" ) );
		}
		if ( CryptoInterface == null ) {
			return Promise.reject( new Error( "Crypto: Service is not available" ) );
		}

		this.publicKey = null;
		this.privateKey = null;
		this.publicKeyExport = null;
		this.privateKeyExport = null;

		const keyJWK = {
			alg: "RSA-OAEP-256",
			e: "AQAB",
			ext: true,
			// eslint-disable-next-line camelcase
			key_ops: ["encrypt"],
			kty: "RSA",
			n: keyString.substr( 16 ),
		};

		return CryptoInterface.subtle.importKey(
			"jwk",
			keyJWK,
			CryptoAsymmetricAlgorithm,
			true,
			["encrypt"]
		)
			.then( result => {
				this.publicKey = result;
				this.publicKeyExport = keyString;
			} );
	}

	/**
	 * This function checks if a given password is the correct export-password.
	 *
	 * @param {string} exportPassword
	 *		Password which shall be checked
	 * @returns {boolean}
	 *		True iff the given password is correct, i.e. it was used to encrypt the export-data
	 */
	checkExportPassword( exportPassword ) {
		if ( typeof exportPassword !== "string" || exportPassword === "" ) {
			throw new Error( "Invalid arguments" );
		}
		if ( CryptoInterface == null ) {
			return Promise.reject( new Error( "Crypto: Service is not available" ) );
		}
		if ( this.privateKeyExport == null || this.privateKeyExport.substr( 0, 16 ) !== "$ceph1-priv$hex$" ) {
			throw new Error( "Crypto: Export data missing" );
		}

		return this.decryptData( this.privateKeyExport.substr( 16 ), exportPassword )
			.then( result => {
				if ( result == null ) {
					return false;
				}
				const privateKeyJWK = JSON.parse( result );
				return this.publicKeyExport === "$ceph1-publ$jwk$" + privateKeyJWK.n;
			} );
	}

	/**
	 * This function takes a private key which was generated by this service
	 * and imports it back into an object to decrypt data
	 *
	 * @param {string} pKeyString
	 *		Private key in the format "$ceph1-priv$hex$<encrypted-key>"
	 * @param {string} exportPassword
	 *		Password which was used to encrypt the private key
	 * @returns {Promise<boolean>}
	 *		Resolves after the private key was successfully imported
	 */
	importPrivateKey( pKeyString, exportPassword ) {
		if ( typeof pKeyString !== "string" || pKeyString.substr( 0, 16 ) !== "$ceph1-priv$hex$" || typeof exportPassword !== "string" || exportPassword === "" ) {
			throw new Error( "Invalid arguments" );
		}
		if ( CryptoInterface == null || this.dbName == null || !db.isReady() ) {
			return Promise.reject( new Error( "Crypto: Service is not available" ) );
		}

		const keys = {
			privateExport:	pKeyString,
		};

		let privateKeyJWK;

		return this.decryptData( pKeyString.substr( 16 ), exportPassword )
			.then( result => {
				if ( result == null ) {
					return false;
				}
				privateKeyJWK = JSON.parse( result );
				keys.publicExport = "$ceph1-publ$jwk$" + privateKeyJWK.n;

				// Import private key into CryptoKey:
				return CryptoInterface.subtle.importKey(
					"jwk",
					privateKeyJWK,
					CryptoAsymmetricAlgorithm,
					false,
					["decrypt"]
				);
			} )
			.then( result => {
				if ( result === false ) {
					return false;
				}
				keys.private = result;

				// Import public key into CryptoKey:
				const keyJWK = {
					alg: "RSA-OAEP-256",
					e: "AQAB",
					ext: true,
					// eslint-disable-next-line camelcase
					key_ops: ["encrypt"],
					kty: "RSA",
					n: keys.publicExport.substr( 16 ),
				};
				return CryptoInterface.subtle.importKey(
					"jwk",
					keyJWK,
					CryptoAsymmetricAlgorithm,
					true,
					["encrypt"]
				);
			} )
			.then( result => {
				if ( result === false ) {
					return false;
				}
				keys.public = result;

				// Save asymmetric key-pair in database:
				return db.writeItem( this.accessPath, keys );
			} )
			.then( result => {
				if ( result === false ) {
					return false;
				}

				this.publicKey = keys.public;
				this.privateKey = keys.private;
				this.publicKeyExport = keys.publicExport;
				this.privateKeyExport = keys.privateExport;
				return true;
			} );
	}

	/**
	 * This function removes the RSA key-pair for asymmetric encryption
	 * from the memory and from the database.
	 *
	 * @returns {Promise<boolean>}
	 * 		Resolves after the key-pair was successfully removed from the database
	 */
	removeKeyPair() {
		if ( this.dbName == null || !db.isReady() ) {
			return Promise.reject( new Error( "Crypto: Service is not available" ) );
		}

		this.privateKey = null;
		this.publicKey = null;
		this.privateKeyExport = null;
		this.publicKeyExport = null;

		return db.removeItem( this.accessPath );
	}


	/**
	 * This function encodes a given object.
	 *
	 * A public RSA-key must have been loaded or generated before.
	 *
	 * The object is converted into a JSON-string and encrypted using a freshly generated symmetric key.
	 * The new key will be asymmetrically encrypted with the public-key.
	 *
	 * The encrypted message contains the object together with some random noise.
	 * The encrypted key contains the used initialisation vector, too.
	 * Both values are returned in a common object as Base64-encoded strings,
	 * e.g. { message: "fuA8/3dH79...", key: "8d+2Ky7aTe..." }
	 *
	 * @param {Object} dataObject
	 * 		Data which shall be encoded
	 * @param {number} version
	 *		Used to determine the encryption algorithm which shall be used (default: 2 - AES-GCM)
	 * @returns {Promise<Object>}
	 * 		Resolves with an object which contains the encrypted message and the encrypted symmetric key.
	 */
	encryptObject( dataObject, version = 2 ) {
		if ( CryptoInterface == null || typeof dataObject != "object" ) {
			return Promise.reject( new Error( "Crypto: Invalid arguments" ) );
		}

		let sAlgo, ivBytes;
		switch ( version ) {
			case 1 :	sAlgo = { name: "AES-CBC", length: 256 };	ivBytes = 16;	break;
			case 2 :	sAlgo = { name: "AES-GCM", length: 256 };	ivBytes = 12;	break;
			default :	return Promise.reject( new Error( "Crypto: Invalid arguments" ) );
		}

		let sKey, sKeyBuffer, cipherBuffer;
		const plainBuffer = BufferTools.fromObject( dataObject, true );
		if ( plainBuffer == null ) {
			return Promise.reject( new Error( "Crypto: Invalid arguments" ) );
		}

		const iVectorBuffer = new Uint8Array( ivBytes );
		CryptoInterface.getRandomValues( iVectorBuffer );

		return CryptoInterface.subtle.generateKey( sAlgo, true, [ "encrypt", "decrypt" ] )
			.then( result => {
				sKey = result;

				return CryptoInterface.subtle.encrypt( { name: sAlgo.name, iv: iVectorBuffer }, sKey, plainBuffer );
			} )
			.then( result => {
				cipherBuffer = result;

				return CryptoInterface.subtle.exportKey( "raw", sKey );
			} )
			.then( result => {
				sKeyBuffer = result;

				return CryptoInterface.subtle.encrypt(
					{ name: "RSA-OAEP" }, this.publicKey, BufferTools.concat( iVectorBuffer, sKeyBuffer )
				);
			} )
			.then( keyBuffer => {
				return {
					message: window.btoa( BufferTools.toAscii( cipherBuffer ) ),
					key:     window.btoa( BufferTools.toAscii( keyBuffer ) ),
					version: 2,
				};
			} );
	}

	/**
	 * This function takes the results of encryptObject and
	 * decrypts the contained object.
	 *
	 * A asymmetric key-pair must be loaded before.
	 *
	 * The public RSA-key which was used for encryption
	 * has to fit to the currently loaded private key.
	 *
	 * @param {string} keyString
	 * 		Base64-encoded string with the asymmetric encrypted key and initialisation vector
	 * @param {string} messageString
	 * 		Base64-encoded string with the symmetric encrypted object
	 * @param {number} version
	 *		Used to determine the encryption algorithm which shall be used (default: 2 - AES-GCM)
	 * @returns {Promise<Object|false|null>}
	 * 		Resolves with the decrypted object, or
	 *		with false if the private key doesn't fit
	 */
	decryptObject( keyString, messageString, version = 2 ) {
		if ( typeof keyString !== "string" || typeof messageString !== "string" ) {
			return Promise.reject( new Error( "Crypto: Invalid arguments" ) );
		}
		if ( CryptoInterface == null ) {
			return Promise.reject( new Error( "Crypto: Service is not available." ) );
		}
		if ( !this.hasKeyPair() ) {
			return Promise.reject( new Error( "Crypto: The private key is missing, decryption is not available." ) );
		}

		let sAlgo, ivBytes;
		switch ( version ) {
			case 1 :	sAlgo = { name: "AES-CBC", length: 256 };	ivBytes = 16;	break;
			case 2 :	sAlgo = { name: "AES-GCM", length: 256 };	ivBytes = 12;	break;
			default :	return Promise.reject( new Error( "Crypto: Invalid arguments" ) );
		}

		let iVectorBuffer, sKeyBuffer, sKey;
		const cipherBuffer = BufferTools.fromAscii( window.atob( messageString ) );
		const keyBuffer = BufferTools.fromAscii( window.atob( keyString ) );

		return CryptoInterface.subtle.decrypt( { name: "RSA-OAEP" }, this.privateKey, keyBuffer )
			.then( result => {
				const bufArray = BufferTools.splitInTwo( result, ivBytes );
				iVectorBuffer = bufArray[0];
				sKeyBuffer = bufArray[1];

				return CryptoInterface.subtle.importKey( "raw", sKeyBuffer, sAlgo, false, [ "encrypt", "decrypt" ] );
			} )
			.then( result => {
				sKey = result;

				return CryptoInterface.subtle.decrypt( { name: sAlgo.name, iv: iVectorBuffer }, sKey, cipherBuffer );
			} )
			.then( plainBuffer => BufferTools.toObject( plainBuffer ) )
			.catch( error => {
				if ( error.name === "OperationError" ) {
					return false;
				}

				throw error;
			} );
	}


	/**
	 *
	 * @param {Object} dataObject
	 *		Data which shall be encoded using the private key.
	 * @returns {Promise<Object>}
	 *		Resolves with an object which contains
	 *		the encrypted message and the encrypted symmetric key.
	 * /
	encryptPublicObject( dataObject ) {


	}

	/**
	 *
	 * @param {*} keyString
	 * @param {*} messageString
	 * /
	decryptPublicObject( keyString, messageString ) {

	}



	/**
	 * Generates a symmetric key using the given password and
	 * encrypts the given data-string with this key.
	 *
	 * @param {string} dataString
	 *		String with the data that shall be encoded
	 * @param {string} password
	 *		Password which will be needed to decrypt the data, later.
	 * @returns {string}
	 *		String with the encoded data
	 */
	encryptData( dataString, password, version = 2 ) {
		if ( typeof dataString !== "string" || typeof password !== "string" || password === "" ) {
			return Promise.reject( new Error( "Crypto: Invalid arguments" ) );
		}
		if ( CryptoInterface == null ) {
			return Promise.reject( new Error( "Crypto: Service is not available" ) );
		}

		let sAlgo, ivBytes;
		switch ( version ) {
			case 1 :	sAlgo = { name: "AES-CBC", length: 256 };	ivBytes = 16;	break;
			case 2 :	sAlgo = { name: "AES-GCM", length: 256 };	ivBytes = 12;	break;
			default :	return Promise.reject( new Error( "Crypto: Invalid arguments" ) );
		}

		const iVector = new Uint8Array( ivBytes );
		CryptoInterface.getRandomValues( iVector );
		const iVectorString = BufferTools.toHex( iVector );

		const sKeyBuffer = new Uint8Array( sAlgo.length / 8 );
		for ( let i = 0; i < sKeyBuffer.byteLength; i++ ) {
			sKeyBuffer[i] = password.charCodeAt( i % password.length );
		}

		const dataBuffer = BufferTools.fromObject( { data: dataString }, true );

		return CryptoInterface.subtle.importKey( "raw", sKeyBuffer, sAlgo, false, [ "encrypt", "decrypt" ] )
			.then( sKey => {

				return CryptoInterface.subtle.encrypt( { name: sAlgo.name, iv: iVector }, sKey, dataBuffer );
			} )
			.then( encryptedBuffer => {

				return iVectorString + BufferTools.toHex( encryptedBuffer );
			} );
	}

	/**
	 * Generates a symmetric key using the given password and tries to decrypt the encoded data.
	 *
	 * This function is used to revert the encoding of encryptData().
	 *
	 * @param {string} encryptedData
	 *		String with the data which was encrypted with encryptData() and the given password
	 * @param {string} password
	 *		Password to use for decryption
	 * @param {number} version
	 *		Used to determine the encryption algorithm which shall be used (default: 2 - AES-GCM)
	 * @returns {string|null}
	 *		Decrypted data iff the password was correct, or
	 *		null in case of problems with the password
	 */
	decryptData( encryptedData, password, version = 2 ) {
		if ( typeof encryptedData !== "string" || encryptedData.length < 32 || typeof password !== "string" || password === "" ) {
			return Promise.reject( new Error( "Crypto: Invalid arguments" ) );
		}
		if ( CryptoInterface == null ) {
			return Promise.reject( new Error( "Crypto: Service is not available" ) );
		}

		let sAlgo, ivBytes;
		switch ( version ) {
			case 1 :	sAlgo = { name: "AES-CBC", length: 256 };	ivBytes = 16;	break;
			case 2 :	sAlgo = { name: "AES-GCM", length: 256 };	ivBytes = 12;	break;
			default :	return Promise.reject( new Error( "Crypto: Invalid arguments" ) );
		}

		const iVectorString = encryptedData.substr( 0, ivBytes * 2 );
		const iVector = BufferTools.fromHex( iVectorString );

		const sKeyBuffer = new Uint8Array( sAlgo.length / 8 );
		for ( let i = 0; i < sKeyBuffer.byteLength; i++ ) {
			sKeyBuffer[i] = password.charCodeAt( i % password.length );
		}

		const encryptedBuffer = BufferTools.fromHex( encryptedData.substr( ivBytes * 2 ) );

		return CryptoInterface.subtle.importKey( "raw", sKeyBuffer, sAlgo, false, [ "encrypt", "decrypt" ] )
			.then( sKey => {

				return CryptoInterface.subtle.decrypt( { name: sAlgo.name, iv: iVector }, sKey, encryptedBuffer );
			} )
			.then( dataBuffer => {
				const obj = BufferTools.toObject( dataBuffer );
				if ( typeof obj !== "object" || !obj.hasOwnProperty( "data" ) || typeof obj.data !== "string" ) {
					return null;
				}

				return obj.data;
			} )
			.catch( () => {
				return null;
			} );
	}
}

const cryptosPublic = {};
const cryptosFull = {};

module.exports = {
	servePublicObject( id = 0 ) {
		if ( !cryptosPublic[id] ) {
			cryptosPublic[id] = new Crypto();
		}
		return cryptosPublic[id];
	},

	serveFullObject( databaseName ) {
		if ( !cryptosFull[databaseName] ) {
			cryptosFull[databaseName] = new Crypto( databaseName );
		}
		return cryptosFull[databaseName];
	},

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
	 * @returns {Promise<string>}
	 * 		Resolves with salted hash in the format "$ceph1$<encoding>$<salt-encoded>$<hash-encoded>"
	 */
	hashPassword( password, salt = null, encoding = "base64" ) {
		if (
			typeof password !== "string" || password === "" ||
			( salt != null && ( typeof salt !== "string" || salt === "" ) ) ||
			( encoding !== "base64" && encoding !== "hex" )
		) {
			return Promise.reject( new Error( "Crypto: Invalid arguments" ) );
		}
		if ( CryptoInterface == null ) {
			return Promise.reject( new Error( "Crypto: Service is not available." ) );
		}

		let saltString, saltEncoded;
		try {
			if ( salt == null ) {
				const saltBuffer = new Uint8Array( 16 );
				CryptoInterface.getRandomValues( saltBuffer );
				saltString = BufferTools.toAscii( saltBuffer );
				saltEncoded = encoding === "base64" ? window.btoa( saltString ) : BufferTools.toHex( saltBuffer );
			} else if ( encoding === "base64" ) {
				saltString = window.atob( salt );
				const saltMatch = /^([^=]+)=*$/.exec( salt );
				if ( ! saltMatch ) {
					throw new Error( "Crypto: Encoding failed" );
				}
				saltEncoded = saltMatch[1];
			} else {
				saltString = BufferTools.toAscii( BufferTools.fromHex( salt ) );
				saltEncoded = salt;
			}
		} catch( error ) {
			return Promise.reject( error );
		}

		return CryptoInterface.subtle.digest( "SHA-256", BufferTools.fromAscii( password + saltString ) )
			.then( hashBuffer => {
				let hashEncoded;
				if ( encoding === "base64" ) {
					const hashMatch = /^([^=]+)=*$/.exec( window.btoa( BufferTools.toAscii( hashBuffer ) ) );
					if ( ! hashMatch ) {
						throw new Error( "Crypto: Encoding failed" );
					}
					hashEncoded = hashMatch[1];
				} else {
					hashEncoded = BufferTools.toHex( hashBuffer );
				}

				return `$ceph1$${encoding}$${saltEncoded}$${hashEncoded}`;
			} );
	},

	/**
	 * This function takes a password and a hash string and
	 * checks if both are matching.
	 *
	 * @param {string} password
	 * 		Password in clear text
	 * @param {string} hash
	 * 		Full hash-string in the format "$ceph1$<encoding>$<salt-encoded>$<hash-encoded>"
	 * @returns {Promise<boolean>}
	 * 		Resolves with true iff given password and hash fit together
	 */
	checkPassword( password, hash ) {
		if (
			typeof password !== "string" || password === "" ||
			typeof hash !== "string" || hash === ""
		) {
			return Promise.reject( new Error( "Crypto: Invalid arguments" ) );
		}
		if ( CryptoInterface == null ) {
			return Promise.reject( new Error( "Crypto: Service is not available." ) );
		}

		const hashMatch = /^\$ceph1\$([^$]+)\$([^$]+)\$([^$]+)$/.exec( hash );
		if ( !hashMatch ) {
			return Promise.reject( new Error( "Crypto: Invalid arguments" ) );
		}

		const encoding = hashMatch[1];
		if ( encoding !== "base64" && encoding !== "hex" ) {
			return Promise.reject( new Error( "Crypto: Invalid arguments" ) );
		}

		let saltString, hashString;
		if ( encoding === "base64" ) {
			saltString = window.atob( hashMatch[2] );
			hashString = window.atob( hashMatch[3] );
		} else {
			saltString = BufferTools.toAscii( BufferTools.fromHex( hashMatch[2] ) );
			hashString = BufferTools.toAscii( BufferTools.fromHex( hashMatch[3] ) );
		}

		return CryptoInterface.subtle.digest( "SHA-256", BufferTools.fromAscii( password + saltString ) )
			.then( result => hashString === BufferTools.toAscii( result ) );
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

		return BufferTools.toHex( BufferTools.fromAscii( window.atob( hashMatch[2] ) ) );
	},
};

export default modules.exports;
