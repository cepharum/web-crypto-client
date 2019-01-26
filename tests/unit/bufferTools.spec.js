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

import Should from "should";

import BufferTools from "../../../src/services/bufferTools";

describe( "Service class BufferTools", () => {

	it( "is available", () => {
		Should.exist( BufferTools );
	} );

	describe( "exposes a static method concat() which", () => {
		it( "is a function" , () => {
			BufferTools.concat.should.be.Function();
		} );

		it( "only takes rest parameter", () => {
			BufferTools.concat.should.have.length( 0 );
		} );

		it( "returns a data buffer", () => {
			const concatenated = BufferTools.concat( new Uint8Array( 17 ) );

			concatenated.should.be.an.instanceof( Uint8Array );
		} );

		it( "handles a single data buffer", () => {
			const a1 = [ 12, 64, 34, 78 ];

			const concatenated1 = BufferTools.concat( new Uint8Array( 17 ) );
			const concatenated2 = BufferTools.concat( Uint8Array.from( a1 ) );

			concatenated1.should.be.an.instanceof( Uint8Array );
			concatenated1.should.have.length( 17 );
			concatenated2.should.be.an.instanceof( Uint8Array );
			concatenated2.should.be.deepEqual( Uint8Array.from( a1 ) );
		} );

		it( "concatenates two data buffers", () => {
			const a1 = [ 12, 64, 34, 78 ];
			const a2 = [ 93, 22, 65 ];
			const a12 = a1.concat( a2 );

			const concatenated = BufferTools.concat(
				Uint8Array.from( a1 ),
				Uint8Array.from( a2 ),
			);

			concatenated.should.be.an.instanceof( Uint8Array );
			concatenated.should.be.deepEqual( Uint8Array.from( a12 ) );
		} );

		it( "concatenates three data buffers", () => {
			const a1 = [ 46, 129, 34, 245, 201, 0, 5 ];
			const a2 = [ 4, 3, 8, 91 ];
			const a3 = [ 84, 85, 64, 34, 16, 25 ];
			const a123 = a1.concat( a2, a3 );

			const concatenated = BufferTools.concat(
				Uint8Array.from( a1 ),
				Uint8Array.from( a2 ),
				Uint8Array.from( a3 ),
			);

			concatenated.should.be.an.instanceof( Uint8Array );
			concatenated.should.be.deepEqual( Uint8Array.from( a123 ) );
		} );

		it( "concatenates five data buffers", () => {
			const a1 = [ 46, 129, 34, 245, 201, 0, 5 ];
			const a2 = [ 4, 3, 8, 91 ];
			const a3 = [ 84, 85, 64, 34, 16, 25 ];
			const a4 = [ 0, 0, 0 ];
			const a5 = [ 79, 79, 79, 79, 79 ];
			const a12345 = a1.concat( a2, a3, a4, a5 );

			const concatenated = BufferTools.concat(
				Uint8Array.from( a1 ),
				Uint8Array.from( a2 ),
				Uint8Array.from( a3 ),
				Uint8Array.from( a4 ),
				Uint8Array.from( a5 ),
			);

			concatenated.should.be.an.instanceof( Uint8Array );
			concatenated.should.be.deepEqual( Uint8Array.from( a12345 ) );
		} );

		it( "handles empty data buffers correctly", () => {
			const a1 = [];
			const a2 = [ 4, 3, 8, 91 ];
			const a3 = [];
			const a4 = [ 0, 0, 0 ];
			const a5 = [];
			const a12345 = a1.concat( a2, a3, a4, a5 );

			const concatenated = BufferTools.concat(
				Uint8Array.from( a1 ),
				Uint8Array.from( a2 ),
				Uint8Array.from( a3 ),
				Uint8Array.from( a4 ),
				Uint8Array.from( a5 )
			);

			concatenated.should.be.an.instanceof( Uint8Array );
			concatenated.should.be.deepEqual( Uint8Array.from( a12345 ) );
		} );

		it( "reverts the conversion of splitInTwo()", () => {
			const a1 = [ 46, 129, 34, 245, 201, 0, 5, 4, 3, 8, 91 ];

			const split = BufferTools.splitInTwo( Uint8Array.from( a1 ), 6 );
			const reverted = BufferTools.concat( split[0], split[1] );

			reverted.should.be.an.instanceof( Uint8Array );
			reverted.should.be.deepEqual( Uint8Array.from( a1 ) );
		} );
	} );

	describe( "exposes a static method splitInTwo() which", () => {
		it( "is a function" , () => {
			BufferTools.splitInTwo.should.be.Function();
		} );

		it( "takes two parameters", () => {
			BufferTools.splitInTwo.should.have.length( 2 );
		} );

		it( "returns an array with two data buffers", () => {
			const split = BufferTools.splitInTwo( new Uint8Array( 17 ), 5 );

			split.should.be.an.Array().which.has.length( 2 );
			split[0].should.be.an.instanceof( Uint8Array );
			split[1].should.be.an.instanceof( Uint8Array );
		} );

		it( "splits a data buffer into two parts", () => {
			const a1 = [ 46, 129, 34, 245, 201, 0, 5 ];
			const a2 = [ 4, 3, 8, 91 ];
			const a12 = a1.concat( a2 );

			const split = BufferTools.splitInTwo( Uint8Array.from( a12 ), a1.length );

			split.should.be.an.Array().which.has.length( 2 );
			split[0].should.be.deepEqual( Uint8Array.from( a1 ) );
			split[1].should.be.deepEqual( Uint8Array.from( a2 ) );
		} );

		it( "handles negative cut-positions correctly", () => {
			const a1 = [ 46, 129, 34, 245, 201, 0, 5 ];
			const a2 = [ 4, 3, 8, 91 ];
			const a12 = a1.concat( a2 );

			const split = BufferTools.splitInTwo( Uint8Array.from( a12 ), -a2.length );

			split.should.be.an.Array().which.has.length( 2 );
			split[0].should.be.deepEqual( Uint8Array.from( a1 ) );
			split[1].should.be.deepEqual( Uint8Array.from( a2 ) );
		} );

		it( "handles boundary cut-positions correctly", () => {
			const a1 = [ 46, 129, 34, 245, 201, 0, 5 ];

			const split1 = BufferTools.splitInTwo( Uint8Array.from( a1 ), 0 );
			const split2 = BufferTools.splitInTwo( Uint8Array.from( a1 ), a1.length );

			split1.should.be.an.Array().which.has.length( 2 );
			split1[0].should.be.deepEqual( Uint8Array.from( [] ) );
			split1[1].should.be.deepEqual( Uint8Array.from( a1 ) );

			split2.should.be.an.Array().which.has.length( 2 );
			split2[0].should.be.deepEqual( Uint8Array.from( a1 ) );
			split2[1].should.be.deepEqual( Uint8Array.from( [] ) );
		} );

		it( "ignores out-of-range cut-positions", () => {
			const a1 = [ 46, 129, 34, 245, 201, 0, 5 ];

			const split1 = BufferTools.splitInTwo( Uint8Array.from( a1 ), -100 );
			const split2 = BufferTools.splitInTwo( Uint8Array.from( a1 ), 100 );

			split1.should.be.an.Array().which.has.length( 2 );
			split1[0].should.be.deepEqual( Uint8Array.from( [] ) );
			split1[1].should.be.deepEqual( Uint8Array.from( a1 ) );

			split2.should.be.an.Array().which.has.length( 2 );
			split2[0].should.be.deepEqual( Uint8Array.from( a1 ) );
			split2[1].should.be.deepEqual( Uint8Array.from( [] ) );
		} );

		it( "reverts the conversion of concat()", () => {
			const a1 = [ 12, 64, 34, 78 ];
			const a2 = [ 93, 22, 65 ];

			const concatenated = BufferTools.concat(
				Uint8Array.from( a1 ),
				Uint8Array.from( a2 ),
			);
			const reverted = BufferTools.splitInTwo( concatenated, a1.length );

			reverted.should.be.an.Array().which.has.length( 2 );
			reverted[0].should.be.deepEqual( Uint8Array.from( a1 ) );
			reverted[1].should.be.deepEqual( Uint8Array.from( a2 ) );
		} );
	} );

	describe( "exposes a static method fromAscii() which", () => {
		it( "is a function" , () => {
			BufferTools.fromAscii.should.be.Function();
		} );

		it( "takes one parameter", () => {
			BufferTools.fromAscii.should.have.length( 1 );
		} );

		it( "returns a data buffer", () => {
			const s1 = "Hello world!";

			const converted = BufferTools.fromAscii( s1 );

			converted.should.be.an.instanceof( Uint8Array );
		} );

		it( "converts a string", () => {
			const s1 = "Hello world!";
			const a1 = [ 0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21 ];

			const converted = BufferTools.fromAscii( s1 );

			converted.should.be.an.instanceof( Uint8Array );
			converted.should.be.deepEqual( Uint8Array.from( a1 ) );
		} );

		it( "handles empty string", () => {
			const s1 = "";
			const a1 = [];

			const converted = BufferTools.fromAscii( s1 );

			converted.should.be.an.instanceof( Uint8Array );
			converted.should.be.deepEqual( Uint8Array.from( a1 ) );
		} );

		it( "handles non-ASCII characters (char-code in 0..255)", () => {
			const s1 = "\u0000Hello\u0005\u00f0\u0000\u00ffworld!\u0010";
			const a1 = [ 0x00, 0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x05, 0xf0, 0x00, 0xff, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21, 0x10 ];

			const converted = BufferTools.fromAscii( s1 );

			converted.should.be.an.instanceof( Uint8Array );
			converted.should.be.deepEqual( Uint8Array.from( a1 ) );
		} );

		it( "reverts the conversion of toAscii()", () => {
			const a1 = [ 0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21 ];
			const a2 = [ 0x00, 0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x05, 0xf0, 0x00, 0xff, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21, 0x10 ];

			const converted1 = BufferTools.toAscii( Uint8Array.from( a1 ) );
			const reverted1 = BufferTools.fromAscii( converted1 );
			const converted2 = BufferTools.toAscii( Uint8Array.from( a2 ) );
			const reverted2 = BufferTools.fromAscii( converted2 );

			reverted1.should.be.an.instanceof( Uint8Array );
			reverted1.should.be.deepEqual( Uint8Array.from( a1 ) );
			reverted2.should.be.an.instanceof( Uint8Array );
			reverted2.should.be.deepEqual( Uint8Array.from( a2 ) );
		} );
	} );

	describe( "exposes a static method toAscii() which", () => {
		it( "is a function" , () => {
			BufferTools.toAscii.should.be.Function();
		} );

		it( "takes one parameter", () => {
			BufferTools.toAscii.should.have.length( 1 );
		} );

		it( "returns a string", () => {
			const a1 = [ 0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21 ];

			const converted = BufferTools.toAscii( Uint8Array.from( a1 ) );

			converted.should.be.a.String();
		} );

		it( "converts a data buffer", () => {
			const a1 = [ 0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21 ];
			const s1 = "Hello world!";

			const converted = BufferTools.toAscii( Uint8Array.from( a1 ) );

			converted.should.be.a.String().which.equals( s1 );
		} );

		it( "handles empty string", () => {
			const a1 = [];
			const s1 = "";

			const converted = BufferTools.toAscii( Uint8Array.from( a1 ) );

			converted.should.be.a.String().which.equals( s1 );
		} );

		it( "handles non-ASCII characters (char-code in 0..255)", () => {
			const a1 = [ 0x00, 0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x05, 0xf0, 0x00, 0xff, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21, 0x10 ];
			const s1 = "\u0000Hello\u0005\u00f0\u0000\u00ffworld!\u0010";

			const converted = BufferTools.toAscii( Uint8Array.from( a1 ) );

			converted.should.be.a.String().which.equals( s1 );
		} );

		it( "reverts the conversion of fromAscii()", () => {
			const s1 = "Hello world!";
			const s2 = "\u0000Hello\u0005\u00f0\u0000\u00ffworld!\u0010";

			const converted1 = BufferTools.fromAscii( s1 );
			const reverted1 = BufferTools.toAscii( converted1 );
			const converted2 = BufferTools.fromAscii( s2 );
			const reverted2 = BufferTools.toAscii( converted2 );

			reverted1.should.be.a.String().which.equals( s1 );
			reverted2.should.be.a.String().which.equals( s2 );
		} );
	} );

	describe( "exposes a static method fromHex() which", () => {
		it( "is a function" , () => {
			BufferTools.fromHex.should.be.Function();
		} );

		it( "takes one parameter", () => {
			BufferTools.fromHex.should.have.length( 1 );
		} );

		it( "returns a data buffer", () => {
			const h1 = "48656c6c6f20776f726c6421";

			const converted = BufferTools.fromHex( h1 );

			converted.should.be.an.instanceof( Uint8Array );
		} );

		it( "converts hex strings as expected", () => {
			const h1 = "48656c6c6f20776f726c6421";
			const h2 = "0048656c6c6f05f000ff776f726c642110";

			const a1 = [ 0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21 ];
			const a2 = [ 0x00, 0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x05, 0xf0, 0x00, 0xff, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21, 0x10 ];

			const converted1 = BufferTools.fromHex( h1 );
			const converted2 = BufferTools.fromHex( h2 );

			converted1.should.be.an.instanceof( Uint8Array );
			converted1.should.be.deepEqual( Uint8Array.from( a1 ) );
			converted2.should.be.an.instanceof( Uint8Array );
			converted2.should.be.deepEqual( Uint8Array.from( a2 ) );
		} );

		it( "handles empty string", () => {
			const h1 = "";
			const a1 = [];

			const converted = BufferTools.fromHex( h1 );

			converted.should.be.an.instanceof( Uint8Array );
			converted.should.be.deepEqual( Uint8Array.from( a1 ) );
		} );

		it( "failes with non-hex strings", () => {
			const h1 = "486";
			const h2 = "48659h";
			const h3 = "4865 -";
			const h4 = "äö?=";

			( () => BufferTools.fromHex( h1 ) ).should.throw();
			( () => BufferTools.fromHex( h2 ) ).should.throw();
			( () => BufferTools.fromHex( h3 ) ).should.throw();
			( () => BufferTools.fromHex( h4 ) ).should.throw();
		} );

		it( "reverts the conversion of toHex()", () => {
			const a1 = [ 0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21 ];
			const a2 = [ 0x00, 0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x05, 0xf0, 0x00, 0xff, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21, 0x10 ];

			const converted1 = BufferTools.toHex( Uint8Array.from( a1 ) );
			const reverted1 = BufferTools.fromHex( converted1 );
			const converted2 = BufferTools.toHex( Uint8Array.from( a2 ) );
			const reverted2 = BufferTools.fromHex( converted2 );

			reverted1.should.be.an.instanceof( Uint8Array );
			reverted1.should.be.deepEqual( Uint8Array.from( a1 ) );
			reverted2.should.be.an.instanceof( Uint8Array );
			reverted2.should.be.deepEqual( Uint8Array.from( a2 ) );
		} );
	} );

	describe( "exposes a static method toHex() which", () => {
		it( "is a function" , () => {
			BufferTools.toHex.should.be.Function();
		} );

		it( "takes one parameter", () => {
			BufferTools.toHex.should.have.length( 1 );
		} );

		it( "returns a string", () => {
			const a1 = [ 0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21 ];

			const converted = BufferTools.toHex( Uint8Array.from( a1 ) );

			converted.should.be.a.String();
		} );

		it( "converts data buffers as expected", () => {
			const a1 = [ 0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21 ];
			const a2 = [ 0x00, 0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x05, 0xf0, 0x00, 0xff, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21, 0x10 ];

			const h1 = "48656c6c6f20776f726c6421";
			const h2 = "0048656c6c6f05f000ff776f726c642110";

			const converted1 = BufferTools.toHex( Uint8Array.from( a1 ) );
			const converted2 = BufferTools.toHex( Uint8Array.from( a2 ) );

			converted1.should.be.a.String().which.equals( h1 );
			converted2.should.be.a.String().which.equals( h2 );
		} );

		it( "handles empty string", () => {
			const a1 = [];
			const h1 = "";

			const converted = BufferTools.toHex( Uint8Array.from( a1 ) );

			converted.should.be.a.String().which.equals( h1 );
		} );

		it( "reverts the conversion of fromHex()", () => {
			const h1 = "48656c6c6f20776f726c6421";
			const h2 = "0048656c6c6f05f000ff776f726c642110";

			const converted1 = BufferTools.fromHex( h1 );
			const reverted1 = BufferTools.toHex( converted1 );
			const converted2 = BufferTools.fromHex( h2 );
			const reverted2 = BufferTools.toHex( converted2 );

			reverted1.should.be.a.String().which.equals( h1 );
			reverted2.should.be.a.String().which.equals( h2 );
		} );
	} );

	describe( "exposes a static method fromObject() which", () => {
		it( "is a function" , () => {
			BufferTools.fromObject.should.be.Function();
		} );

		it( "expects at least one parameter", () => {
			BufferTools.fromObject.should.have.length( 1 );
		} );

		it( "returns a data buffer", () => {
			const o1 = { message: "Hello world!" };

			const converted = BufferTools.fromObject( o1 );

			converted.should.be.an.instanceof( Uint8Array );
		} );

		it( "converts a simple object as expected", () => {
			const o1 = { message: "Hello world!" };
			const a1 = [
				0x7b, 0x22,
				0x6d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65,
				0x22, 0x3a, 0x22,
				0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21,
				0x22, 0x7d
			];

			const converted = BufferTools.fromObject( o1 );

			converted.should.be.an.instanceof( Uint8Array );
			converted.should.be.deepEqual( Uint8Array.from( a1 ) );
		} );

		it( "converts a complex object", () => {
			const o1 = { message: "Hello world!", locations: [ { place: "Luleå", country: "Sweden", timezone: "Europe/Stockholm" }, { place: "Berlin", country: "German", timezone: "Europe/Berlin" } ] };
			const j1 = JSON.stringify( o1 );

			const converted = BufferTools.fromObject( o1 );

			converted.should.be.an.instanceof( Uint8Array ).which.has.length( j1.length );
		} );

		it( "will try to add noise using Web Crypto API", () => {
		// it( "may add noise while converting an object", () => {
			const o1 = { message: "Hello world!" };
			const o2 = { message: "Hello world!", locations: [ { place: "Luleå", country: "Sweden", timezone: "Europe/Stockholm" }, { place: "Berlin", country: "German", timezone: "Europe/Berlin" } ] };

			// const window = { crypto: { getRandomValues( dataBuffer ) {
			// 	if ( !( dataBuffer instanceof Uint8Array ) ) {
			// 		throw new Error( "Invalid arguments" );
			// 	}
			// 	for ( let i = 0; i < dataBuffer.byteLength; i++ ) {
			// 		dataBuffer[i] = Math.floor( Math.random() * 256 );
			// 	}
			// } } };

			( () => BufferTools.fromObject( o1, true ) ).should.throw( /Missing library/ );
			( () => BufferTools.fromObject( o2, true ) ).should.throw( /Missing library/ );

			// const j1 = JSON.stringify( o1 );
			// const j2 = JSON.stringify( o2 );
			//
			// const converted1 = BufferTools.fromObject( o1, true );
			// const converted2 = BufferTools.fromObject( o2, true );
			//
			// converted1.should.be.an.instanceof( Uint8Array )
			// 	.and.should.have.property( "byteLength" )
			// 	.which.is.above( j1.length + 20 );
			// converted2.should.be.an.instanceof( Uint8Array )
			// 	.and.should.have.property( "byteLength" )
			// 	.which.is.above( j2.length + 20 );
		} );
	} );

	describe( "exposes a static method toObject() which", () => {
		it( "is a function" , () => {
			BufferTools.toObject.should.be.Function();
		} );

		it( "takes one parameter", () => {
			BufferTools.toObject.should.have.length( 1 );
		} );

		it( "returns an object", () => {
			const a1 = [
				0x7b, 0x22,
				0x6d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65,
				0x22, 0x3a, 0x22,
				0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21,
				0x22, 0x7d
			];

			const converted = BufferTools.toObject( Uint8Array.from( a1 ) );

			converted.should.be.an.Object();
		} );

		it( "extracts a simple object as expected", () => {
			const a1 = [
				0x7b, 0x22,
				0x6d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65,
				0x22, 0x3a, 0x22,
				0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21,
				0x22, 0x7d
			];
			const o1 = { message: "Hello world!" };

			const converted = BufferTools.toObject( Uint8Array.from( a1 ) );

			converted.should.be.an.Object().which.is.deepEqual( o1 );
		} );

		it( "extracts a simple object even if noise was added", () => {
			const a1 = [
				0xf2, 0x24, 0x0d, 0x93, 0x73, 0x22, 0x20, 0x6c, 0x65, 0x78, 0x41, 0x37, 0x39, 0x2d, 0x52, 0x82, 0xd4, 0xb1,
				0x7b, 0x22,
				0x6d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65,
				0x22, 0x3a, 0x22,
				0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21,
				0x22, 0x7d,
				0x9a, 0x10, 0x02, 0x52, 0x48, 0x23, 0x32, 0x99, 0xd0, 0x4a, 0x79, 0x64, 0x55, 0x0a, 0x4f, 0xbe, 0xc6, 0x88
			];
			const o1 = { message: "Hello world!" };

			const converted = BufferTools.toObject( Uint8Array.from( a1 ) );

			converted.should.be.an.Object().which.is.deepEqual( o1 );
		} );

		it( "reverts the conversion of fromObject()", () => {
			const o1 = { message: "Hello world!" };

			const converted = BufferTools.fromObject( o1 );
			const reverted = BufferTools.toObject( converted );

			reverted.should.be.an.Object().which.is.deepEqual( o1 );
		} );

		it( "reverts the conversion of fromObject() with a complex object", () => {
			const o1 = { message: "Hello world!", locations: [ { place: "Luleå", country: "Sweden", timezone: "Europe/Stockholm" }, { place: "Berlin", country: "German", timezone: "Europe/Berlin" } ] };

			const converted = BufferTools.fromObject( o1 );
			const reverted = BufferTools.toObject( converted );

			reverted.should.be.an.Object().which.is.deepEqual( o1 );
		} );
	} );
} );