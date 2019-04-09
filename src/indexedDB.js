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

/**
 * This class handles connections to the browser's IndexedDB.
 */
class Database {

	/**
	 *
	 */
	constructor() {
		this.connection = null;
		this.databaseName = null;
		this.storeName = null;
		if ( !window.indexedDB ) {
			throw new Error( "FATAL ERROR: IndexedDB not available." );
		}
	}

	/**
	 * @param {string} databaseName
	 * 		Name of the database to use
	 * @param {string} storeName
	 * 		Name of the object storage to use
	 * @returns {boolean}
	 * 		True with success
	 * @throws
	 * 		An Error is thrown if the instance is already connected to another database.
	 */
	init( databaseName, storeName ) {
		if ( this.connection != null && this.databaseName !== databaseName ) {
			throw new Error( "Can't reconfigure database connection. It's already established." );
		}
		this.databaseName = databaseName;
		this.storeName = storeName;
		return true;
	}

	/**
	 * @returns {boolean}
	 * 		True iff the database object was correctly initialised.
	 */
	isReady() {
		return this.databaseName != null && this.storeName != null;
	}

	/**
	 * This function opens a connection to the database.
	 * The name of the database and the object storage was given with the constructor.
	 *
	 * @returns {Promise<null>}
	 * 		Resolves after the database connection was successfully established.
	 * @throws
	 * 		An Error is thrown if the connection can't be established.
	 */
	open() {
		return new Promise( resolve => {
			if ( !window.indexedDB ) {
				throw new Error( "FATAL ERROR: IndexedDB not available." );
			}
			if ( this.connection != null ) {
				resolve();
				return;
			}
			const request = window.indexedDB.open( this.databaseName, 1 );
			request.onerror = event => {
				throw new Error( event.target.errorCode );
			};
			request.onupgradeneeded = event => {
				this.connection = event.target.result;
				this.connection.createObjectStore( this.storeName, { keyPath: "key" } );
			};
			request.onsuccess = event => {
				this.connection = event.target.result;
				resolve();
			};
		} );
	}

	/**
	 * This function writes a record into the database.
	 * If a record with the same key already exists, the old record is overwritten.
	 *
	 * @param {string} key
	 * 		Identifier of the new database record
	 * @param {*} value
	 * 		Content to write into the database record
	 * @return {Promise<null>}
	 * 		Resolves after the data was successfully written to the database
	 */
	writeItem( key, value ) {
		return this.open()
			.then( () => new Promise( resolve => {
				const transaction = this.connection.transaction( this.storeName, "readwrite" );
				transaction.onerror = event => {
					throw new Error( event.target.errorCode );
				};
				const request = transaction.objectStore( this.storeName ).put( { key: key, value: value } );
				request.onsuccess = () => {
					resolve();
				};
				request.onerror = event => {
					throw new Error( event.target.errorCode );
				};
			} ) );
	}

	/**
	 * This function queries the data of a database record.
	 *
	 * @param {string} key
	 * 		Identifier of the database record
	 * @returns {Promise<*|null>}
	 * 		Resolves with the content of the database record, or
	 *		with null if the record doesn't exist
	 */
	readItem( key ) {
		return this.open()
			.then( () => new Promise( resolve => {
				const transaction = this.connection.transaction( this.storeName );
				transaction.onerror = event => {
					throw new Error( event.target.errorCode );
				};
				const request = transaction.objectStore( this.storeName ).get( key );
				request.onsuccess = event => {
					if ( event.target.result == null ) {
						resolve( null );
					} else {
						resolve( event.target.result.value );
					}
				};
				request.onerror = event => {
					throw new Error( event.target.errorCode );
				};
			} ) );
	}

	/**
	 * This function removes one record out of the database.
	 *
	 * If the record doesn't exist the function still returns with true.
	 *
	 * @param {string} key
	 * 		Identifier of the database record to delete.
	 * @returns {Promise<null>}
	 * 		Resolves after the record was successfully deleted from the database
	 */
	removeItem( key ) {
		return this.open()
			.then( () => new Promise( resolve => {
				const transaction = this.connection.transaction( this.storeName, "readwrite" );
				transaction.onerror = event => {
					throw new Error( event.target.errorCode );
				};
				const request = transaction.objectStore( this.storeName ).delete( key );
				request.onsuccess = () => {
					resolve();
				};
				request.onerror = event => {
					throw new Error( event.target.errorCode );
				};
			} ) );
	}
}

const db = new Database();

module.exports = {
	serveObject() {
		return db;
	}
};
