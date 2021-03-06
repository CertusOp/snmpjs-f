/*
 * Copyright (c) 2015 Jan Van Buggenhout.  All rights reserved.
 * Copyright (c) 2013 Joyent, Inc.  All rights reserved.
 */

var util = require('util');
var Receiver = require('./receiver');
var PDU = require('./protocol/pdu');

function
Listener(options)
{
	Receiver.call(this, options);
	this._connections = [];
}
util.inherits(Listener, Receiver);

Listener.prototype.bind = function bind(arg, cb) {
	var self = this;
	var conn;

	if (typeof (arg) !== 'object')
		throw new TypeError('arg (object) is required');
	if (typeof (arg.family) !== 'string')
		throw new TypeError('arg.family (string) is required');
	if (typeof (arg.port) !== 'number')
		throw new TypeError('arg.port (number) is required');
	if (typeof (arg.addr) !== 'undefined' &&
	    typeof (arg.addr) !== 'string')
		throw new TypeError('arg.addr must be a string');

	if (typeof (cb) !== 'undefined' && typeof (cb) !== 'function')
		throw new TypeError('cb must be a function');

	conn = this.createSocket(arg.family);
	this._connections.push(conn);

	conn.on('listening', function () {
		self._log.info('Bound to %s:%d',
		    conn.address().address,
		    conn.address().port);
		if (cb)
			cb();
	});

	conn.on('error', function (err) {
		if (cb)
			cb(err || new Error('Unknown binding error'));
		else
			throw err;
	});

	conn.bind({ port: arg.port, address: arg.addr, exclusive: !!arg.exclusive });
};

Listener.prototype.close = function close() {
	var self = this;

	this._connections.forEach(function (c) {
		var addr = c.address();
		if ( addr) self._log.info('Shutting down endpoint %s:%d',
		               addr.address, addr.port);
		c.close();
	});
};

module.exports = Listener;
