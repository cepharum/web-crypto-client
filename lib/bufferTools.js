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

/**
 * This class provides support for the handling of Uint8Array data buffers
 */
export default class BufferTools {

	/**
	 * Behaves similar to Array.concat():
	 * The concat() method is used to merge two or more data buffers.
	 * This method does not change the existing buffers, but instead returns a new buffer.
	 *
	 * @param {Array<Uint8Array>|Array<ArrayBuffer>} dataBuffers
	 * 		List of data buffers which shall be concatenated
	 * @returns {Uint8Array}
	 * 		Resulting data buffer with data from all given buffers
	 */
	static concat( ...dataBuffers ) {
		if ( typeof dataBuffers !== "object" || dataBuffers.length === 0 ) {
			throw new Error( "BufferTools.concat(): Invalid arguments" );
		}

		let newSize = 0;
		const buffers = [];
		for ( let k = 0; k < dataBuffers.length; k++ ) {
			buffers[k] = dataBuffers[k] instanceof ArrayBuffer ? new Uint8Array( dataBuffers[k] ) : dataBuffers[k];
			if ( buffers[k] instanceof Uint8Array ) {
				newSize += buffers[k].byteLength;
			} else {
				throw new Error( "BufferTools.concat(): Invalid arguments" );
			}
		}

		let currPos = 0;
		const newBuf = new Uint8Array( newSize );
		for ( let k = 0; k < buffers.length; k++ ) {
			newBuf.set( buffers[k], currPos );
			currPos += buffers[k].byteLength;
		}

		return newBuf;
	}

	/**
	 * This function cuts the given data buffer into two parts,
	 * which are returned as the two elements of a new array.
	 *
	 * @param {Uint8Array|ArrayBuffer} dataBuffer12
	 * 		Data buffer
	 * @param {number} splitPos
	 * 		Position
	 * @returns {Array<Uint8Array>}
	 * 		Array containing the two separated buffers
	 */
	static splitInTwo( dataBuffer12, splitPos ) {
		const buf12 = dataBuffer12 instanceof ArrayBuffer ? new Uint8Array( dataBuffer12 ) : dataBuffer12;
		if ( !( buf12 instanceof Uint8Array ) || typeof splitPos !== "number" ) {
			throw new Error( "BufferTools.split(): Invalid arguments" );
		}

		return [
			buf12.subarray( 0, splitPos ),
			buf12.subarray( splitPos )
		];
	}

	/**
	 * This method converts the given ASCII string into a proper data buffer.
	 *
	 * @param {string} dataString
	 * 		String which shall be converted into data buffer
	 * @returns {Uint8Array}
	 * 		Converted data buffer
	 */
	static fromAscii( dataString ) {
		if ( typeof dataString !== "string" ) {
			throw new Error( "BufferTools.fromAscii(): Invalid arguments" );
		}

		const buf = new Uint8Array( dataString.length );
		for ( let i = 0; i < dataString.length; i++ ) {
			buf[i] = dataString.charCodeAt( i );
		}

		return buf;
	}

	/**
	 * This method extracts the ASCII-string which is contained in the given data buffer.
	 *
	 * @param {Uint8Array|ArrayBuffer} dataBuffer
	 * 		Data buffer which describes an ASCII-string
	 * @returns {string}
	 * 		Extracted ASCII-string
	 */
	static toAscii( dataBuffer ) {
		const buf = dataBuffer instanceof ArrayBuffer ? new Uint8Array( dataBuffer ) : dataBuffer;
		if ( !( buf instanceof Uint8Array ) ) {
			throw new Error( "BufferTools.toAscii(): Invalid arguments" );
		}

		return String.fromCharCode.apply( null, new Uint8Array( buf ) );
	}

	/**
	 * This method converts the given hexadecimal string into a proper data buffer.
	 *
	 * @param {string} dataString
	 * 		String with hexadecimal description of the data
	 * @returns {Uint8Array}
	 * 		Converted data buffer
	 */
	static fromHex( dataString ) {
		if ( typeof dataString !== "string" || dataString.length % 2 != 0 ) {
			throw new Error( "BufferTools.fromHex(): Invalid arguments" );
		}

		const str = dataString.toLowerCase( dataString );
		const digits = [ "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f" ];

		const buf = new Uint8Array( str.length / 2 );
		for ( let i = 0, k = 0; i < str.length; ) {
			const d1 = digits.indexOf( str[i++] );
			const d2 = digits.indexOf( str[i++] );
			if ( d1 === -1 || d2 === -1 ) {
				throw new Error( "BufferTools.fromHex(): Invalid arguments" );
			}
			buf[k++] = ( 16 * d1 ) + d2;
		}

		return buf;
	}

	/**
	 * The data of the given buffer will be converted into a hexadecimal string.
	 *
	 * @param {Uint8Array|ArrayBuffer} dataBuffer
	 * 		Data buffer which describes a hexadecimal string
	 * @returns {string}
	 * 		Extracted hexadecimal string
	 */
	static toHex( dataBuffer ) {
		const buf = dataBuffer instanceof ArrayBuffer ? new Uint8Array( dataBuffer ) : dataBuffer;
		if ( !( buf instanceof Uint8Array ) ) {
			throw new Error( "BufferTools.toHex(): Invalid arguments" );
		}

		const digits = "0123456789abcdef";
		let hexBytes = "";

		for ( let i = 0; i < buf.byteLength; i++ ) {
			hexBytes += digits[Math.floor( buf[i] / 16 )] + digits[buf[i] % 16];
		}

		return hexBytes;
	}

	/**
	 * The given object will be converted into a data buffer
	 * which contains the object's data in form of a JSON-string.
	 *
	 * Set addNoise to true if you want some noise characters to be included
	 * into the data buffer before and after the JSON-string.
	 * This can be useful for encryption purposes.
	 *
	 * @param {object} dataObject
	 * 		Object which shall be converted into a data buffer
	 * @param {boolean} addNoise
	 * 		True iff you want the buffer to be filled with some additional noise
	 * @returns {Uint8Array}
	 * 		Data buffer containing the object's JSON-string (surrounded by noise if requested)
	 */
	static fromObject( dataObject, addNoise = false ) {
		if ( typeof dataObject !== "object" ) {
			throw new Error( "BufferTools.fromObject(): Invalid arguments" );
		}

		let dataBuffer = BufferTools.fromAscii( JSON.stringify( dataObject ) );

		if ( addNoise ) {
			const c = window.crypto || window.msCrypto;
			if ( !c ) {
				throw new Error( "BufferTools.fromObject(): Missing library" );
			}

			const nonNoiseCharacters = [ "{".charCodeAt( 0 ), "}".charCodeAt( 0 ), 0 ];
			const noiseConfig = new Uint8Array( 3 );
			c.getRandomValues( noiseConfig );
			noiseConfig[0] = ( noiseConfig[0] % 50 ) + 15;	// Amount of noise characters before JSON string
			noiseConfig[1] = ( noiseConfig[1] % 50 ) + 15;	// Amount of noise characters after JSON string
			noiseConfig[2] = nonNoiseCharacters.indexOf( noiseConfig[2] ) === -1 ? noiseConfig[2] : 32; // Replacement for non-noise characters

			const noiseBuffer = new Uint8Array( noiseConfig[0] + noiseConfig[1] );
			c.getRandomValues( noiseBuffer );
			for ( let k = 0; k < nonNoiseCharacters.length; k++ ) {
				for ( let i = 0; i < noiseBuffer.byteLength; i++ ) {
					if ( noiseBuffer[i] === nonNoiseCharacters[k] ) { noiseBuffer[i] = noiseConfig[2]; }
				}
			}

			const buf13 = BufferTools.splitInTwo( noiseBuffer, noiseConfig[0] );
			dataBuffer = BufferTools.concat( buf13[0], dataBuffer, buf13[1] );
		}

		return dataBuffer;
	}

	/**
	 * This function takes a data buffer and extracts the object
	 * which must be included as a JSON-string.
	 *
	 * If the buffer contains some noise before and after the JSON-string,
	 * this noise will be ignored.
	 *
	 * @param {ArrayBuffer} dataBuffer
	 * 		Data block containg the object, e.g. from BufferTools.fromObject()
	 * @returns {object|null}
	 * 		Extracted object
	 */
	static toObject( dataBuffer ) {
		const buf = dataBuffer instanceof ArrayBuffer ? new Uint8Array( dataBuffer ) : dataBuffer;
		if ( !( buf instanceof Uint8Array ) ) {
			throw new Error( "BufferTools.toObject(): Invalid arguments" );
		}

		let dataString = String.fromCharCode.apply( null, buf );
		const matches = /^[^{]*({.+})[^}]*$/.exec( dataString );
		if ( matches == null ) {
			throw new Error( "BufferTools.toObject(): Invalid arguments" );
		}
		dataString = matches[1];

		let dataObject;
		try {
			dataObject = JSON.parse( dataString );
		} catch( error ) {
			throw new Error( `BufferTools.toObject(): ${error.message}` );
		}

		return dataObject;
	}
}
