
;(function (curl) {

	var config = {
		packages: [
			// Define application-level packages
			{ name: 'contacts', location: 'sample-apps/contacts' },
			{ name: 'hello', location: 'sample-apps/hello' },

			// Add third-party packages here
			{ name: 'curl', location: 'lib/curl/src/curl', main: '../curl' },
			{ name: 'wire', location: 'lib/wire', main: 'wire' },
			{ name: 'cola', location: 'lib/cola', main: 'cola' },
			{ name: 'when', location: 'lib/when', main: 'when' },
			{ name: 'meld', location: 'lib/meld', main: 'meld' },
			{ name: 'poly', location: 'lib/poly' },

			{ name: 'highlight', location: 'lib/highlight', main: 'amd' }
		],
		// Polyfill everything ES5-ish
		preloads: ['poly/object', 'poly/array', 'poly/function']
	};

	curl(config, ['wire!app/main']);

}(curl));
/**
 * poly common functions
 *
 * (c) copyright 2011-2012 Brian Cavalier and John Hann
 *
 * This module is part of the cujo.js family of libraries (http://cujojs.com/).
 *
 * Licensed under the MIT License at:
 * 		http://www.opensource.org/licenses/mit-license.php
 *
 */
define('poly/lib/_base', ['require', 'exports', 'module'], function (require, exports, module) {

	var toString;

	toString = ({}).toString;

	exports.isFunction = function (o) {
		return typeof o == 'function';
	};

	exports.isString = function (o) {
		return toString.call(o) == '[object String]';
	};

	exports.toString = function (o) {
		return toString.apply(o);
	};

	exports.createCaster = function (caster, name) {
		return function cast (o) {
			if (o == null) throw new TypeError(name + ' method called on null or undefined');
			return caster(o);
		}
	}

});
/**
 * Function polyfill / shims
 *
 * (c) copyright 2011-2012 Brian Cavalier and John Hann
 *
 * This module is part of the cujo.js family of libraries (http://cujojs.com/).
 *
 * Licensed under the MIT License at:
 * 		http://www.opensource.org/licenses/mit-license.php
 */
define('poly/function', ['poly/lib/_base'], function (base) {
"use strict";

	var bind,
		slice = [].slice,
		proto = Function.prototype,
		featureMap;

	featureMap = {
		'function-bind': 'bind'
	};

	function has (feature) {
		var prop = featureMap[feature];
		return base.isFunction(proto[prop]);
	}

	// check for missing features
	if (!has('function-bind')) {
		// adapted from Mozilla Developer Network example at
		// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
		bind = function bind (obj) {
			var args = slice.call(arguments, 1),
				self = this,
				nop = function () {},
				bound = function () {
				  return self.apply(this instanceof nop ? this : (obj || {}), args.concat(slice.call(arguments)));
				};
			nop.prototype = this.prototype || {}; // Firefox cries sometimes if prototype is undefined
			bound.prototype = new nop();
			return bound;
		};
		proto.bind = bind;
	}

	return {};

});
/**
 * Object polyfill / shims
 *
 * (c) copyright 2011-2012 Brian Cavalier and John Hann
 *
 * This module is part of the cujo.js family of libraries (http://cujojs.com/).
 *
 * Licensed under the MIT License at:
 * 		http://www.opensource.org/licenses/mit-license.php
 */
/**
 * The goal of these shims is to emulate a JavaScript 1.8.5+ environments as
 * much as possible.  While it's not feasible to fully shim Object,
 * we can try to maximize code compatibility with older js engines.
 *
 * Note: these shims cannot fix `for (var p in obj) {}`. Instead, use this:
 *     Object.keys(obj).forEach(function (p) {}); // shimmed Array
 *
 * Also, these shims can't prevent writing to object properties.
 *
 * If you want your code to fail loudly if a shim can't mimic ES5 closely
 * then set the AMD loader config option `failIfShimmed`.  Possible values
 * for `failIfShimmed` include:
 *
 * true: fail on every shimmed Object function
 * false: fail never
 * function: fail for shims whose name returns true from function (name) {}
 *
 * By default, no shims fail.
 *
 * The following functions are safely shimmed:
 * create (unless the second parameter is specified since that calls defineProperties)
 * keys
 * getOwnPropertyNames
 * getPrototypeOf
 * isExtensible
 *
 * In order to play nicely with several third-party libs (including Promises/A
 * implementations), the following functions don't fail by default even though
 * they can't be correctly shimmed:
 * freeze
 * seal
 * isFrozen
 * isSealed
 *
 * Note: this shim doesn't do anything special with IE8's minimally useful
 * Object.defineProperty(domNode).
 *
 * The poly/strict module will set failIfShimmed to fail for some shims.
 * See the documentation for more information.
 *
 * IE missing enum properties fixes copied from kangax:
 * https://github.com/kangax/protolicious/blob/master/experimental/object.for_in.js
 *
 */
define('poly/object', ['poly/lib/_base'], function (base) {
"use strict";

	var refObj,
		refProto,
		getPrototypeOf,
		keys,
		featureMap,
		shims,
		undef;

	refObj = Object;
	refProto = refObj.prototype;

	getPrototypeOf = typeof {}.__proto__ == 'object'
		? function (object) { return object.__proto__; }
		: function (object) { return object.constructor ? object.constructor.prototype : refProto; };

	keys = !hasNonEnumerableProps
		? _keys
		: (function (masked) {
			return function (object) {
				var result = _keys(object), i = 0, m;
				while (m = masked[i++]) {
					if (hasProp(object, m)) result.push(m);
				}
				return result;
			}
		}([ 'constructor', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'toString', 'toLocaleString', 'valueOf' ]));

	featureMap = {
		'object-create': 'create',
		'object-freeze': 'freeze',
		'object-isfrozen': 'isFrozen',
		'object-seal': 'seal',
		'object-issealed': 'isSealed',
		'object-getprototypeof': 'getPrototypeOf',
		'object-keys': 'keys',
		'object-getownpropertynames': 'getOwnPropertyNames',
		'object-defineproperty': 'defineProperty',
		'object-defineproperties': 'defineProperties',
		'object-isextensible': 'isExtensible',
		'object-preventextensions': 'preventExtensions',
		'object-getownpropertydescriptor': 'getOwnPropertyDescriptor'
	};

	shims = {};

	function hasNonEnumerableProps () {
		for (var p in { toString: 1 }) return false;
		return true;
	}

	function createFlameThrower (feature) {
		return function () {
			throw new Error('poly/object: ' + feature + ' is not safely supported.');
		}
	}

	function has (feature) {
		var prop = featureMap[feature];
		return prop in refObj;
	}

	function PolyBase () {}

	// for better compression
	function hasProp (object, name) {
		return object.hasOwnProperty(name);
	}

	function _keys (object) {
		var result = [];
		for (var p in object) {
			if (hasProp(object, p)) {
				result.push(p);
			}
		}
		return result;
	}

	if (!has('object-create')) {
		Object.create = shims.create = function create (proto, props) {
			var obj;

			if (typeof proto != 'object') throw new TypeError('prototype is not of type Object or Null.');

			PolyBase.prototype = proto;
			obj = new PolyBase(props);
			PolyBase.prototype = null;

			if (arguments.length > 1) {
				// defineProperties could throw depending on `shouldThrow`
				Object.defineProperties(obj, props);
			}

			return obj;
		};
	}

	if (!has('object-freeze')) {
		Object.freeze = shims.freeze = function freeze (object) {
			return object;
		};
	}

	if (!has('object-isfrozen')) {
		Object.isFrozen = shims.isFrozen = function isFrozen (object) {
			return false;
		};
	}

	if (!has('object-seal')) {
		Object.seal = shims.seal = function seal (object) {
			return object;
		};
	}

	if (!has('object-issealed')) {
		Object.isSealed = shims.isSealed = function isSealed (object) {
			return false;
		};
	}

	if (!has('object-getprototypeof')) {
		Object.getPrototypeOf = shims.getPrototypeOf = getPrototypeOf;
	}

	if (!has('object-keys')) {
		Object.keys = keys;
	}

	if (!has('object-getownpropertynames')) {
		Object.getOwnPropertyNames = shims.getOwnPropertyNames = function getOwnPropertyNames (object) {
			return keys(object);
		};
	}

	if (!has('object-defineproperty') || !has('object-defineproperties')) {
		Object.defineProperty = shims.defineProperty = function defineProperty (object, name, descriptor) {
			object[name] = descriptor && descriptor.value;
			return object;
		};
	}

	if (!has('object-defineproperties') || !has('object-create')) {
		Object.defineProperties = shims.defineProperties = function defineProperties (object, descriptors) {
			var names, name;
			names = keys(descriptors);
			while ((name = names.pop())) {
				Object.defineProperty(object, name, descriptors[name]);
			}
			return object;
		};
	}

	if (!has('object-isextensible')) {
		Object.isExtensible = shims.isExtensible = function isExtensible (object) {
			var prop = '_poly_';
			try {
				// create unique property name
				while (prop in object) prop += '_';
				// try to set it
				object[prop] = 1;
				return hasProp(object, prop);
			}
			catch (ex) { return false; }
			finally {
				try { delete object[prop]; } catch (ex) { /* squelch */ }
			}
		};
	}

	if (!has('object-preventextensions')) {
		Object.preventExtensions = shims.preventExtensions = function preventExtensions (object) {
			return object;
		};
	}

	if (!has('object-getownpropertydescriptor')) {
		Object.getOwnPropertyDescriptor = shims.getOwnPropertyDescriptor = function getOwnPropertyDescriptor (object, name) {
			return hasProp(object, name)
				? {
					value: object[name],
					enumerable: true,
					configurable: true,
					writable: true
				}
				: undef;
		};
	}

	function failIfShimmed (failTest) {
		var shouldThrow;

		if (typeof failTest == 'function') {
			shouldThrow = failTest;
		}
		else {
			// assume truthy/falsey
			shouldThrow = function () { return failTest; };
		}

		// create throwers for some features
		for (var feature in shims) {
			Object[feature] = shouldThrow(feature)
				? createFlameThrower(feature)
				: shims[feature];
		}
	}

	// this is effectively a no-op, so why execute it?
	//failIfShimmed(false);

	return {
		failIfShimmed: failIfShimmed
	};

});
/*
	Array -- a stand-alone module for using Javascript 1.6 array features
	in lame-o browsers that don't support Javascript 1.6

	(c) copyright 2011-2012 Brian Cavalier and John Hann

	This module is part of the cujo.js family of libraries (http://cujojs.com/).

	Licensed under the MIT License at:
		http://www.opensource.org/licenses/mit-license.php
*/
/*
	This module is under 1kB when compiled/gzipped and is compatible with
	has() pre-processors (<400 bytes when compiled for modern browsers).

	wrapper API:

	This module will wrap native methods to normalize array calls to
	be unified across js engines that support the array methods
	natively with those that don't:

	define(['poly/lib/shim/array'], function (array) {
		var items = [1, 2, 3];
		array.forEach(items, function (item) {
			console.log(item);
		};
	});

	forEach(array, lambda [, context]);
	every(array, lambda [, context]);
	some(array, lambda [, context]);
	filter(array, lambda [, context]);
	map(array, lambda [, context]);
	indexOf(arr, item [, fromIndex]);
	lastIndexOf(arr, item [, fromIndex]);
	reduce(arr, reduceFunc [, initialValue]);
	reduceRight(arr, reduceFunc [, initialValue]);
	isArray(object)

	polyfill API:

	You may also use this module to augment the Array.prototype of
	older js engines by loading it via the poly! plugin prefix:

	define(['poly!poly/lib/shim/array'], function () {
		var items = [1, 2, 3];
		items.forEach(function (item) {
			console.log(item);
		};
	});

	All of the wrapper API methods are shimmed and are reasonably close to
	the ES5 specification, but may vary slightly in unforeseen edge cases:

	var array = [1, 2, 3];

	array.forEach(lambda [, context]);
	array.every(lambda [, context]);
	array.some(lambda [, context]);
	array.filter(lambda [, context]);
	array.map(lambda [, context]);
	array.indexOf(item [, fromIndex]);
	array.lastIndexOf(item [, fromIndex]);
	array.reduce(reduceFunc [, initialValue]);
	array.reduceRight(reduceFunc [, initialValue]);
	Array.isArray(object)

 */

define('poly/array', ['poly/lib/_base'], function (base) {
"use strict";

	var proto = Array.prototype,
		toString = {}.toString,
		featureMap,
		toObject,
		_reduce,
		_find,
		undef;

	featureMap = {
		'array-foreach': 'forEach',
		'array-every': 'every',
		'array-some': 'some',
		'array-map': 'map',
		'array-filter': 'filter',
		'array-reduce': 'reduce',
		'array-reduceright': 'reduceRight',
		'array-indexof': 'indexOf',
		'array-lastindexof': 'lastIndexOf'
	};

	toObject = base.createCaster(Object, 'Array');

	function toArrayLike (o) {
		return (base.toString(o) == '[object String]')
			? o.split('')
			: toObject(o);
	}

	function isArray (o) {
		return toString.call(o) == '[object Array]';
	}

	function has (feature) {
		var prop = featureMap[feature];
		return base.isFunction(proto[prop]);
	}

	function returnTruthy () {
		return 1;
	}

	function returnValue (val) {
		return val;
	}

	/***** iterators *****/

	function _iterate (arr, lambda, continueFunc, context, start, inc) {

		var alo, len, i, end;

		alo = toArrayLike(arr);
		len = alo.length >>> 0;

		if (start === undef) start = 0;
		if (!inc) inc = 1;
		end = inc < 0 ? -1 : len;

		if (!base.isFunction(lambda)) {
			throw new TypeError(lambda + ' is not a function');
		}
		if (start == end) {
			return false;
		}
		if ((start <= end) ^ (inc > 0)) {
			throw new TypeError('Invalid length or starting index');
		}

		for (i = start; i != end; i = i + inc) {
			if (i in alo) {
				if (!continueFunc(lambda.call(context, alo[i], i, alo), i, alo[i])) {
					return false;
				}
			}
		}

		return true;
	}

	if (!has('array-foreach')) {
		proto.forEach = function forEach (lambda) {
			// arguments[+1] is to fool google closure compiler into NOT adding a function argument!
			_iterate(this, lambda, returnTruthy, arguments[+1]);
		};
	}

	if (!has('array-every')) {
		proto.every = function every (lambda) {
			// arguments[+1] is to fool google closure compiler into NOT adding a function argument!
			return _iterate(this, lambda, returnValue, arguments[+1]);
		};
	}

	if (!has('array-some')) {
		proto.some = function some (lambda) {
			// arguments[+1] is to fool google closure compiler into NOT adding a function argument!
			return _iterate(this, lambda, function (val) { return !val; }, arguments[+1]);
		};
	}

	/***** mutators *****/

	if(!has('array-map')) {
		proto.map = function map (lambda) {
			var arr, result;

			arr = this;
			result = new Array(arr.length);

			// arguments[+1] is to fool google closure compiler into NOT adding a function argument!
			_iterate(arr, lambda, function (val, i) { result[i] = val; return 1; }, arguments[+1]);

			return result;
		};
	}

	if (!has('array-filter')) {
		proto.filter = function filter (lambda) {
			var arr, result;

			arr = this;
			result = [];

			_iterate(arr, lambda, function (val, i, orig) {
				// use a copy of the original value in case
				// the lambda function changed it
				if (val) {
					result.push(orig);
				}
				return 1;
			}, arguments[1]);

			return result;
		};
	}

	/***** reducers *****/

	if (!has('array-reduce') || !has('array-reduceright')) {

		_reduce = function _reduce (reduceFunc, inc, initialValue, hasInitialValue) {
			var reduced, startPos, initialValuePos;

			startPos = initialValuePos = inc > 0 ? -1 : toArrayLike(this).length >>> 0;

			// If no initialValue, use first item of array (we know length !== 0 here)
			// and adjust i to start at second item
			if (!hasInitialValue) {
				_iterate(this, returnValue, function (val, i) {
					reduced = val;
					initialValuePos = i;
				}, null, startPos + inc, inc);
				if (initialValuePos == startPos) {
					// no intial value and no items in array!
					throw new TypeError();
				}
			}
			else {
				// If initialValue provided, use it
				reduced = initialValue;
			}

			// Do the actual reduce
			_iterate(this, function (item, i, arr) {
				reduced = reduceFunc(reduced, item, i, arr);
			}, returnTruthy, null, initialValuePos + inc, inc);

			// we have a reduced value!
			return reduced;
		};

		if (!has('array-reduce')) {
			proto.reduce = function reduce (reduceFunc /*, initialValue */) {
				return _reduce.call(this, reduceFunc, 1, arguments[+1], arguments.length > 1);
			};
		}

		if (!has('array-reduceright')) {
			proto.reduceRight = function reduceRight (reduceFunc /*, initialValue */) {
				return _reduce.call(this, reduceFunc, -1, arguments[+1], arguments.length > 1);
			};
		}
	}

	/***** finders *****/

	if (!has('array-indexof') || !has('array-lastindexof')) {

		_find = function _find (arr, item, from, forward) {
			var len = toArrayLike(arr).length >>> 0, foundAt = -1;

			// convert to number, or default to start or end positions
			from = isNaN(from) ? (forward ? 0 : len - 1) : Number(from);
			// negative means it's an offset from the end position
			if (from < 0) {
				from = len + from - 1;
			}

			_iterate(arr, returnValue, function (val, i) {
				if (val === item) {
					foundAt = i;
				}
				return foundAt == -1;
			}, null, from, forward ? 1 : -1);

			return foundAt;
		};

		if (!has('array-indexof')) {
			proto.indexOf = function indexOf (item) {
				// arguments[+1] is to fool google closure compiler into NOT adding a function argument!
				return _find(this, item, arguments[+1], true);
			};
		}

		if (!has('array-lastindexof')) {
			proto.lastIndexOf = function lastIndexOf (item) {
				// arguments[+1] is to fool google closure compiler into NOT adding a function argument!
				return _find(this, item, arguments[+1], false);
			};
		}
	}

	if (!Array.isArray) {
		Array.isArray = isArray;
	}

});

;define('curl/plugin/i18n!app/subheader/strings', function () {
	return {"phrases":["The <em>un</em>framework: Free your code","Create, modify, and <em>test</em> with ease","Scale your team as your app grows","Use the web. Don't circumvent it"]};
});

;define('curl/plugin/i18n!hello/app/strings.js', function () {
	return {"name":"What's your name?","hint":"Type your name","hello":"Hello"};
});

;define('curl/plugin/i18n!contacts/app/edit/strings', function () {
	return {"firstName":"First Name","lastName":"Last Name","phone":"Phone Number","email":"E-Mail","save":"Save","clear":"Clear"};
});

;define('app/hello-sample/spec', {

	helloApp: {
		wire: {
			spec: 'hello/app/main',
			provide: {
				root: { $ref: 'dom.first!.cujo-hello-container .app' }
			}
		}
	},

	helloCode: {
		wire: {
			spec: 'app/tabs/spec',
			provide: {
				root: { $ref: 'dom.first!.cujo-hello-container .code' },
				collection: { $ref: 'helloSources' }
			}
		}
	},

	helloSources: { create: 'cola/Collection' },
	helloSourcesData: {
		create: {
			module: 'cola/adapter/Array',
			args: [[
				{
					id: 1,
					name: 'template.html',
					content: { module: 'highlight!hello/app/template.html' }
				},
				{
					id: 2,
					name: 'controller.js',
					content: { module: 'highlight!hello/app/controller.js' }
				},
				{
					id: 3,
					name: 'strings.js',
					content: { module: 'highlight!hello/app/strings.js' }
				},
				{
					id: 4,
					name: 'main.js',
					content: { module: 'highlight!hello/app/main.js' }
				}
			]]
		},
		bind: { $ref: 'helloSources' }
	},

	$plugins: ['wire/dom', 'wire/dom/render', 'wire/on', 'cola']
});

;define('app/contacts-sample/spec', {

	contactsContainer: { $ref: 'dom.first!.cujo-contacts-container' },

	contactsAppContainer: {
		render: { module: 'text!app/contacts-sample/template.html' },
		insert: { last: { $ref: 'dom.first!.cujo-contacts-container .app' } }
	},

	contactsApp: {
		wire: {
			spec: 'contacts/app/main',
			provide: {
				root: { $ref: 'contactsAppContainer' }
			}
		}
	},

	contactsCode: {
		wire: {
			spec: 'app/tabs/spec',
			provide: {
				root: { $ref: 'dom.first!.code', at: { $ref: 'contactsContainer' } },
				collection: { $ref: 'contactsSources' }
			}
		}
	},

	contactsSources: { create: 'cola/Collection' },
	contactsSourcesData: {
		create: {
			module: 'cola/adapter/Array',
			args: [[
				{
					id: 1,
					name: 'controller.js',
					content: { module: 'highlight!contacts/app/controller.js' }
				},
				{
					id: 2,
					name: 'list/template.html',
					content: { module: 'highlight!contacts/app/list/template.html' }
				},
				{
					id: 3,
					name: 'edit/template.html',
					content: { module: 'highlight!contacts/app/edit/template.html' }
				},
				{
					id: 4,
					name: 'main.js',
					content: { module: 'highlight!contacts/app/main.js' }
				}
			]]
		},
		bind: { $ref: 'contactsSources' }
	},

	$plugins: ['wire/dom', 'wire/dom/render', 'wire/on', 'cola']
});

;define('app/homepage-sample/spec', {

	homepageCode: {
		wire: {
			spec: 'app/tabs/spec',
			provide: {
				root: { $ref: 'dom.first!.cujo-homepage-container .code' },
				collection: { $ref: 'homepageSources' }
			}
		}
	},

	homepageImage: {
		element: { $ref: 'dom.first!.cujo-homepage-container .screenshot' },
		properties: { src: 'assets/img/cujojs-com.png' }
	},

	homepageSources: { create: 'cola/Collection' },
	homepageSourcesData: {
		create: {
			module: 'cola/adapter/Array',
			args: [[
				{
					id: 1,
					name: 'main.js',
					content: { module: 'highlight!app/main.js' }
				},
				{
					id: 2,
					name: 'selectText.js',
					content: { module: 'highlight!app/subheader/selectText.js' }
				},
				{
					id: 3,
					name: 'selectText-test.js',
					content: { module: 'highlight!test/subheader/selectText-test.js' }
				}
			]]
		},
		bind: { $ref: 'homepageSources' }
	},

	$plugins: ['wire/dom', 'wire/on', 'cola']
});

;(function(define) {
define('app/subheader/selectText', function () {

	/**
	 * Selects a text string from the provided strings array
	 */
	return function(strings, selector) {
		var len = strings && strings.length;
		return len ? strings[(selector || defaultSelector)(len)] : '';
	};

	function defaultSelector(n) {
		return Math.floor(Math.random() * n);
	}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));

;define('hello/app/main', { // Wire spec

	controller: {
		create: 'hello/app/controller',
		properties: {
			node: { $ref: 'first!span', at: 'view' }
		},
		on: { view: { 'input': 'update' } }
	},

	view: {
		render: {
			template: { module: 'text!hello/app/template.html' },
			replace: { module: 'i18n!hello/app/strings.js' }
		},
		insert: { last: 'root' }
	},

	$plugins: ['wire/dom', 'wire/dom/render', 'wire/on']
});

;define('app/tabs/spec', {

	controller: {
		create: 'app/tabs/controller',
		properties: {
			querySelector: { $ref: 'dom.first!' },
			tabs: { $ref: 'tabs' },
			stack: { $ref: 'stack' }
		},
		on: {
			tabs: { 'click:.item': 'activateTab' }
		},
		after: {
			'collection.onSync': 'init'
		}
	},

	tabs: {
		render: {
			template: { module: 'text!app/tabs/tabs.html' },
			css: { module: 'css!app/tabs/structure.css' }
		},
		insert: { last: 'root' },
		bind: {
			to: { $ref: 'collection' },
			bindings: {
				name: '.tab-title'
			}
		}
	},

	stack: {
		render: {
			template: { module: 'text!app/tabs/stack.html' }
		},
		insert: { after: 'tabs' },
		bind: {
			to: { $ref: 'collection' },
			bindings: {
				content: { attr: 'innerHTML' }
			}
		}
	},

	plugins: ['wire/dom', 'wire/dom/render', 'wire/on', 'wire/aop', 'cola']
});

;define('highlight/amd!hello/app/template.html', function () {
	return "<pre><code class=\"xml\"><span class=\"tag\">&lt;<span class=\"title\">div</span>&gt;</span>\n    <span class=\"tag\">&lt;<span class=\"title\">label</span>&gt;</span>${name} <span class=\"tag\">&lt;<span class=\"title\">input</span> <span class=\"attribute\">placeholder</span>=<span class=\"value\">\"${hint}\"</span>/&gt;</span><span class=\"tag\">&lt;/<span class=\"title\">label</span>&gt;</span>\n    <span class=\"tag\">&lt;<span class=\"title\">p</span>&gt;</span>${hello} <span class=\"tag\">&lt;<span class=\"title\">span</span>&gt;</span><span class=\"tag\">&lt;/<span class=\"title\">span</span>&gt;</span>!<span class=\"tag\">&lt;/<span class=\"title\">p</span>&gt;</span>\n<span class=\"tag\">&lt;/<span class=\"title\">div</span>&gt;</span></code></pre>";
});

;define('highlight/amd!hello/app/controller.js', function () {
	return "<pre><code class=\"javascript\">define(<span class=\"function\"><span class=\"keyword\">function</span><span class=\"params\">()</span> {</span>\n  <span class=\"keyword\">return</span> {\n    update: <span class=\"function\"><span class=\"keyword\">function</span><span class=\"params\">(e)</span> {</span>\n      <span class=\"keyword\">this</span>.node.innerHTML = e.target.value;\n    }\n  };\n});</code></pre>";
});

;define('highlight/amd!hello/app/strings.js', function () {
	return "<pre><code class=\"javascript\">define({ <span class=\"comment\">// i18n</span>\n  name: <span class=\"string\">'What\'s your name?'</span>,\n  hint: <span class=\"string\">'Type your name'</span>,\n  hello: <span class=\"string\">'Hello'</span>\n});</code></pre>";
});

;define('highlight/amd!hello/app/main.js', function () {
	return "<pre><code class=\"javascript\">define({ <span class=\"comment\">// Wire spec</span>\n\n  controller: {\n    create: <span class=\"string\">'hello/app/controller'</span>,\n    properties: {\n      node: { $ref: <span class=\"string\">'first!span'</span>, at: <span class=\"string\">'view'</span> }\n    },\n    on: { view: { <span class=\"string\">'input'</span>: <span class=\"string\">'update'</span> } }\n  },\n\n  view: {\n    render: {\n      template: { module: <span class=\"string\">'text!hello/app/template.html'</span> },\n      replace: { module: <span class=\"string\">'i18n!hello/app/strings.js'</span> }\n    },\n    insert: { last: <span class=\"string\">'root'</span> }\n  },\n\n  $plugins: [<span class=\"string\">'wire/dom'</span>, <span class=\"string\">'wire/dom/render'</span>, <span class=\"string\">'wire/on'</span>]\n});</code></pre>";
});

;define('contacts/app/main', {// Wire spec

	contactsCollection: { wire: 'contacts/app/collection/spec' },

	controller: {
		create: 'contacts/app/controller',
		properties: {
			_form: { $ref: 'editView' },
			_updateForm: { $ref: 'form.setValues' }
		},
		connect: {
			'contactsCollection.onEdit': 'editContact'
		}
	},

	editView: {
		render: {
			template: { module: 'text!contacts/app/edit/template.html' },
			replace: { module: 'i18n!contacts/app/edit/strings' },
			css: { module: 'css!contacts/app/edit/structure.css' }
		},
		insert: { after: 'listView' },
		on: {
			submit: 'form.getValues | contactsCollection.update'
		},
		connect: {
			'contactsCollection.onChange': 'reset'
		}
	},

	listView: {
		render: {
			template: {module: 'text!contacts/app/list/template.html' },
			css: { module: 'css!contacts/app/list/structure.css' }
		},
		insert: {
			first: { $ref: 'dom.first!.contacts-view-container', at: 'root' }
		},
		on: {
			'click:.contact': 'contactsCollection.edit',
			'click:.remove': 'contactsCollection.remove'
		},
		bind: {
			to: { $ref: 'contactsCollection' },
			comparator: { module: 'contacts/app/list/compareByLastFirst' },
			bindings: {
				firstName: '.first-name',
				lastName: '.last-name'
			}
		}
	},

	theme: { module: 'css!contacts/theme/basic.css' },
	form: { module: 'cola/dom/form' },

	$plugins: ['wire/dom','wire/dom/render','wire/on','wire/connect','cola']
});

;define('highlight/amd!contacts/app/controller.js', function () {
	return "<pre><code class=\"javascript\">define(<span class=\"function\"><span class=\"keyword\">function</span><span class=\"params\">()</span> {</span>\n\n  <span class=\"keyword\">return</span> {\n    editContact: <span class=\"function\"><span class=\"keyword\">function</span><span class=\"params\">(contact)</span> {</span>\n      <span class=\"keyword\">this</span>._updateForm(<span class=\"keyword\">this</span>._form, contact);\n    }\n  };\n\n});</code></pre>";
});

;define('highlight/amd!contacts/app/list/template.html', function () {
	return "<pre><code class=\"xml\"><span class=\"tag\">&lt;<span class=\"title\">ul</span> <span class=\"attribute\">class</span>=<span class=\"value\">\"contact-list-view\"</span>&gt;</span>\n    <span class=\"tag\">&lt;<span class=\"title\">li</span> <span class=\"attribute\">class</span>=<span class=\"value\">\"contact\"</span>&gt;</span>\n        <span class=\"tag\">&lt;<span class=\"title\">span</span> <span class=\"attribute\">class</span>=<span class=\"value\">\"remove\"</span>&gt;</span>&amp;times;<span class=\"tag\">&lt;/<span class=\"title\">span</span>&gt;</span>\n        <span class=\"tag\">&lt;<span class=\"title\">span</span> <span class=\"attribute\">class</span>=<span class=\"value\">\"first-name\"</span>&gt;</span><span class=\"tag\">&lt;/<span class=\"title\">span</span>&gt;</span>\n        <span class=\"tag\">&lt;<span class=\"title\">span</span> <span class=\"attribute\">class</span>=<span class=\"value\">\"last-name\"</span>&gt;</span><span class=\"tag\">&lt;/<span class=\"title\">span</span>&gt;</span>\n    <span class=\"tag\">&lt;/<span class=\"title\">li</span>&gt;</span>\n<span class=\"tag\">&lt;/<span class=\"title\">ul</span>&gt;</span></code></pre>";
});

;define('highlight/amd!contacts/app/edit/template.html', function () {
	return "<pre><code class=\"xml\"><span class=\"tag\">&lt;<span class=\"title\">form</span> <span class=\"attribute\">class</span>=<span class=\"value\">\"edit-contact-view\"</span>&gt;</span>\n    <span class=\"tag\">&lt;<span class=\"title\">fieldset</span>&gt;</span>\n        <span class=\"tag\">&lt;<span class=\"title\">label</span>&gt;</span>\n            <span class=\"tag\">&lt;<span class=\"title\">span</span>&gt;</span>${firstName}<span class=\"tag\">&lt;/<span class=\"title\">span</span>&gt;</span>\n            <span class=\"tag\">&lt;<span class=\"title\">input</span> <span class=\"attribute\">type</span>=<span class=\"value\">\"text\"</span> <span class=\"attribute\">class</span>=<span class=\"value\">\"first-name\"</span> <span class=\"attribute\">name</span>=<span class=\"value\">\"firstName\"</span>/&gt;</span>\n        <span class=\"tag\">&lt;/<span class=\"title\">label</span>&gt;</span>\n        <span class=\"tag\">&lt;<span class=\"title\">label</span>&gt;</span>\n            <span class=\"tag\">&lt;<span class=\"title\">span</span>&gt;</span>${lastName}<span class=\"tag\">&lt;/<span class=\"title\">span</span>&gt;</span>\n            <span class=\"tag\">&lt;<span class=\"title\">input</span> <span class=\"attribute\">type</span>=<span class=\"value\">\"text\"</span> <span class=\"attribute\">class</span>=<span class=\"value\">\"last-name\"</span> <span class=\"attribute\">name</span>=<span class=\"value\">\"lastName\"</span>/&gt;</span>\n        <span class=\"tag\">&lt;/<span class=\"title\">label</span>&gt;</span>\n        <span class=\"tag\">&lt;<span class=\"title\">label</span>&gt;</span>\n            <span class=\"tag\">&lt;<span class=\"title\">span</span>&gt;</span>${phone}<span class=\"tag\">&lt;/<span class=\"title\">span</span>&gt;</span>\n            <span class=\"tag\">&lt;<span class=\"title\">input</span> <span class=\"attribute\">type</span>=<span class=\"value\">\"text\"</span> <span class=\"attribute\">name</span>=<span class=\"value\">\"phone\"</span>&gt;</span>\n        <span class=\"tag\">&lt;/<span class=\"title\">label</span>&gt;</span>\n        <span class=\"tag\">&lt;<span class=\"title\">label</span>&gt;</span>\n            <span class=\"tag\">&lt;<span class=\"title\">span</span>&gt;</span>${email}<span class=\"tag\">&lt;/<span class=\"title\">span</span>&gt;</span>\n            <span class=\"tag\">&lt;<span class=\"title\">input</span> <span class=\"attribute\">type</span>=<span class=\"value\">\"text\"</span> <span class=\"attribute\">name</span>=<span class=\"value\">\"email\"</span>&gt;</span>\n        <span class=\"tag\">&lt;/<span class=\"title\">label</span>&gt;</span>\n    <span class=\"tag\">&lt;/<span class=\"title\">fieldset</span>&gt;</span>\n    <span class=\"tag\">&lt;<span class=\"title\">input</span> <span class=\"attribute\">type</span>=<span class=\"value\">\"text\"</span> <span class=\"attribute\">name</span>=<span class=\"value\">\"id\"</span>/&gt;</span>\n    <span class=\"tag\">&lt;<span class=\"title\">fieldset</span> <span class=\"attribute\">class</span>=<span class=\"value\">\"controls\"</span>&gt;</span>\n        <span class=\"tag\">&lt;<span class=\"title\">input</span> <span class=\"attribute\">type</span>=<span class=\"value\">\"submit\"</span> <span class=\"attribute\">value</span>=<span class=\"value\">\"${save}\"</span>&gt;</span>\n        <span class=\"tag\">&lt;<span class=\"title\">input</span> <span class=\"attribute\">type</span>=<span class=\"value\">\"reset\"</span> <span class=\"attribute\">value</span>=<span class=\"value\">\"${clear}\"</span>&gt;</span>\n    <span class=\"tag\">&lt;/<span class=\"title\">fieldset</span>&gt;</span>\n<span class=\"tag\">&lt;/<span class=\"title\">form</span>&gt;</span></code></pre>";
});

;define('highlight/amd!contacts/app/main.js', function () {
	return "<pre><code class=\"javascript\">define({<span class=\"comment\">// Wire spec</span>\n\n  contactsCollection: { wire: <span class=\"string\">'contacts/app/collection/spec'</span> },\n\n  controller: {\n    create: <span class=\"string\">'contacts/app/controller'</span>,\n    properties: {\n      _form: { $ref: <span class=\"string\">'editView'</span> },\n      _updateForm: { $ref: <span class=\"string\">'form.setValues'</span> }\n    },\n    connect: {\n      <span class=\"string\">'contactsCollection.onEdit'</span>: <span class=\"string\">'editContact'</span>\n    }\n  },\n\n  editView: {\n    render: {\n      template: { module: <span class=\"string\">'text!contacts/app/edit/template.html'</span> },\n      replace: { module: <span class=\"string\">'i18n!contacts/app/edit/strings'</span> },\n      css: { module: <span class=\"string\">'css!contacts/app/edit/structure.css'</span> }\n    },\n    insert: { after: <span class=\"string\">'listView'</span> },\n    on: {\n      submit: <span class=\"string\">'form.getValues | contactsCollection.update'</span>\n    },\n    connect: {\n      <span class=\"string\">'contactsCollection.onChange'</span>: <span class=\"string\">'reset'</span>\n    }\n  },\n\n  listView: {\n    render: {\n      template: {module: <span class=\"string\">'text!contacts/app/list/template.html'</span> },\n      css: { module: <span class=\"string\">'css!contacts/app/list/structure.css'</span> }\n    },\n    insert: {\n      first: { $ref: <span class=\"string\">'dom.first!.contacts-view-container'</span>, at: <span class=\"string\">'root'</span> }\n    },\n    on: {\n      <span class=\"string\">'click:.contact'</span>: <span class=\"string\">'contactsCollection.edit'</span>,\n      <span class=\"string\">'click:.remove'</span>: <span class=\"string\">'contactsCollection.remove'</span>\n    },\n    bind: {\n      to: { $ref: <span class=\"string\">'contactsCollection'</span> },\n      comparator: { module: <span class=\"string\">'contacts/app/list/compareByLastFirst'</span> },\n      bindings: {\n        firstName: <span class=\"string\">'.first-name'</span>,\n        lastName: <span class=\"string\">'.last-name'</span>\n      }\n    }\n  },\n\n  theme: { module: <span class=\"string\">'css!contacts/theme/basic.css'</span> },\n  form: { module: <span class=\"string\">'cola/dom/form'</span> },\n\n  $plugins: [<span class=\"string\">'wire/dom'</span>,<span class=\"string\">'wire/dom/render'</span>,<span class=\"string\">'wire/on'</span>,<span class=\"string\">'wire/connect'</span>,<span class=\"string\">'cola'</span>]\n});</code></pre>";
});

;define('highlight/amd!app/main.js', function () {
	return "<pre><code class=\"javascript\">define({ <span class=\"comment\">// Wire spec</span>\n\n  helloSample: { wire: <span class=\"string\">'app/hello-sample/spec'</span> },\n\n  contactsSample: { wire: <span class=\"string\">'app/contacts-sample/spec'</span> },\n\n  homepageSample: { wire: <span class=\"string\">'app/homepage-sample/spec'</span> },\n\n  subheaderStrings: { module: <span class=\"string\">'i18n!app/subheader/strings'</span> },\n  subheaderText: {\n    create: {\n      module: <span class=\"string\">'app/subheader/selectText'</span>,\n      args: { $ref: <span class=\"string\">'subheaderStrings.phrases'</span> }\n    }\n  },\n\n  subheader: {\n    render: {\n      template: { module: <span class=\"string\">'text!app/subheader/template.html'</span> },\n      replace: { text: { $ref: <span class=\"string\">'subheaderText'</span> } },\n      at: { $ref: <span class=\"string\">'first!.subheader'</span> }\n    }\n  },\n\n  highlightTheme: { module: <span class=\"string\">'css!highlight/github.css'</span> },\n\n  $plugins: [\n    { module: <span class=\"string\">'wire/dom'</span>, classes: { init: <span class=\"string\">'loading'</span> } },\n    <span class=\"string\">'wire/dom/render'</span>\n  ]\n});</code></pre>";
});

;define('highlight/amd!app/subheader/selectText.js', function () {
	return "<pre><code class=\"javascript\">(<span class=\"function\"><span class=\"keyword\">function</span><span class=\"params\">(define)</span> {</span>\ndefine(<span class=\"function\"><span class=\"keyword\">function</span><span class=\"params\">()</span> {</span>\n\n  <span class=\"comment\">/**\n   * Selects a text string from the provided strings array\n   */</span>\n  <span class=\"keyword\">return</span> <span class=\"function\"><span class=\"keyword\">function</span><span class=\"params\">(strings, selector)</span> {</span>\n    <span class=\"keyword\">var</span> len = strings &amp;&amp; strings.length;\n    <span class=\"keyword\">return</span> len ? strings[(selector || defaultSelector)(len)] : <span class=\"string\">''</span>;\n  };\n\n  <span class=\"function\"><span class=\"keyword\">function</span> <span class=\"title\">defaultSelector</span><span class=\"params\">(n)</span> {</span>\n    <span class=\"keyword\">return</span> Math.floor(Math.random() * n);\n  }\n\n});\n}(<span class=\"keyword\">typeof</span> define === <span class=\"string\">'function'</span> &amp;&amp; define.amd ? define : <span class=\"function\"><span class=\"keyword\">function</span><span class=\"params\">(factory)</span> {</span> module.exports = factory(); }));\n</code></pre>";
});

;define('highlight/amd!test/subheader/selectText-test.js', function () {
	return "<pre><code class=\"javascript\">(<span class=\"function\"><span class=\"keyword\">function</span><span class=\"params\">(define)</span> {</span>\ndefine(<span class=\"function\"><span class=\"keyword\">function</span><span class=\"params\">(require)</span> {</span>\n\n  <span class=\"keyword\">var</span> buster, selectText;\n\n  buster = require(<span class=\"string\">'buster'</span>);\n  selectText = require(<span class=\"string\">'../../app/subheader/selectText'</span>);\n\n  buster.testCase(<span class=\"string\">'subheader/selectText'</span>, {\n    <span class=\"string\">'should return empty string when input is empty'</span>: <span class=\"function\"><span class=\"keyword\">function</span><span class=\"params\">()</span> {</span>\n      assert.equals(selectText([]), <span class=\"string\">''</span>);\n    },\n\n    <span class=\"string\">'should return empty string when input not provided'</span>: <span class=\"function\"><span class=\"keyword\">function</span><span class=\"params\">()</span> {</span>\n      assert.equals(selectText(), <span class=\"string\">''</span>);\n    },\n\n    <span class=\"string\">'should call provided selector function'</span>: <span class=\"function\"><span class=\"keyword\">function</span><span class=\"params\">()</span> {</span>\n      <span class=\"keyword\">var</span> spy, input;\n\n      input = [<span class=\"string\">'a'</span>, <span class=\"string\">'b'</span>, <span class=\"string\">'c'</span>];\n      spy = <span class=\"keyword\">this</span>.stub().returns(<span class=\"number\">1</span>);\n\n      selectText(input, spy);\n      assert.calledOnceWith(spy, input.length);\n    },\n\n    <span class=\"string\">'should return selected string'</span>: <span class=\"function\"><span class=\"keyword\">function</span><span class=\"params\">()</span> {</span>\n      <span class=\"keyword\">var</span> spy, input;\n\n      input = [<span class=\"string\">'a'</span>, <span class=\"string\">'b'</span>, <span class=\"string\">'c'</span>];\n      spy = <span class=\"keyword\">this</span>.stub().returns(<span class=\"number\">1</span>);\n\n      assert.equals(selectText(input, spy), <span class=\"string\">'b'</span>);\n    }\n  });\n\n});\n}(<span class=\"keyword\">typeof</span> define === <span class=\"string\">'function'</span> &amp;&amp; define.amd ? define : <span class=\"function\"><span class=\"keyword\">function</span><span class=\"params\">(factory)</span> {</span> module.exports = factory(require); }));\n\n</code></pre>";
});

;define('hello/app/controller', function () {
	return {
		update: function(e) {
			this.node.innerHTML = e.target.value;
		}
	};
});

;define('curl/plugin/text!hello/app/template.html', function () {
	return "<div>\n    <label>${name} <input placeholder=\"${hint}\"/></label>\n    <p>${hello} <span></span>!</p>\n</div>";
});

;(function(define) {
define('app/tabs/controller', function () {

	var slice = [].slice;

	return {
		querySelector: null,
		tabs: null,
		stack: null,
		activeClass: 'active',
		idAttr: 'data-cola-id',

		activateTab: function(e) {
			e.preventDefault();
			var name = e.selectorTarget.getAttribute(this.idAttr);

			swapClasses(this._findActive(e.currentTarget), e.selectorTarget);
			swapClasses(this._findActiveStack(), this._findStackByName(name));
		},

		init: function() {
			var qs, nameQuery, activeSelector;

			qs = this.querySelector;
			nameQuery = '[' + this.idAttr + '="';
			activeSelector = '.' + this.activeClass;

			this._findActive = partial(qs, activeSelector);
			this._findActiveStack = partial(qs, activeSelector, this.stack);
			this._findStackByName = function(name) {
				return qs(nameQuery + name + '"]', this.stack);
			};

			this._initActive(partial(qs, '['+this.idAttr+']'), ' '+this.activeClass);
		},

		_initActive: function (qs, cls) {
			qs(this.tabs).className += cls;
			qs(this.stack).className += cls;
		}
	};

	function partial(f) {
		var args = slice.call(arguments, 1);
		return function() {
			return f.apply(this, args.concat(slice.call(arguments)));
		}
	}

	function swapClasses(el1, el2) {
		var tmp = el1.className;
		el1.className = el2.className;
		el2.className = tmp;

		return el2;
	}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));

;define('curl/plugin/text!app/subheader/template.html', function () {
	return "<h2>${text}</h2>\n";
});

;define('contacts/app/collection/spec', {

	$exports: { $ref: 'contacts' },

	contacts: {
		create: {
			module: 'cola/Collection',
			args: {
				strategyOptions: {
					validator: { module: 'contacts/app/collection/validateContact' }
				}
			}
		},
		before: {
			add: 'cleanContact | generateMetadata',
			update: 'cleanContact | generateMetadata'
		}
	},

	contactStore: {
		create: {
			module: 'cola/adapter/LocalStorage',
			args: 'contacts-demo'
		},
		bind: { $ref: 'contacts' }
	},

	cleanContact: { module: 'contacts/app/collection/cleanContact' },
	generateMetadata: { module: 'contacts/app/collection/generateMetadata' },

	$plugins: ['wire/dom', 'wire/on', 'wire/aop', 'cola']

});

;define('contacts/app/controller', function () {

	return {
		editContact: function(contact) {
			this._updateForm(this._form, contact);
		}
	};

});

;define('curl/plugin/text!contacts/app/edit/template.html', function () {
	return "<form class=\"edit-contact-view\">\n    <fieldset>\n        <label>\n            <span>${firstName}</span>\n            <input type=\"text\" class=\"first-name\" name=\"firstName\"/>\n        </label>\n        <label>\n            <span>${lastName}</span>\n            <input type=\"text\" class=\"last-name\" name=\"lastName\"/>\n        </label>\n        <label>\n            <span>${phone}</span>\n            <input type=\"text\" name=\"phone\">\n        </label>\n        <label>\n            <span>${email}</span>\n            <input type=\"text\" name=\"email\">\n        </label>\n    </fieldset>\n    <input type=\"text\" name=\"id\"/>\n    <fieldset class=\"controls\">\n        <input type=\"submit\" value=\"${save}\">\n        <input type=\"reset\" value=\"${clear}\">\n    </fieldset>\n</form>";
});

;define('curl/plugin/text!contacts/app/list/template.html', function () {
	return "<ul class=\"contact-list-view\">\n    <li class=\"contact\">\n        <span class=\"remove\">&times;</span>\n        <span class=\"first-name\"></span>\n        <span class=\"last-name\"></span>\n    </li>\n</ul>";
});

;define('contacts/app/list/compareByLastFirst', function () {

	/**
	 * Custom comparator to sort contacts by last name, and then
	 * by first name.
	 * NOTE: This algorithm would likely need to be internationalized
	 * @param {object} contact1
	 * @param {object} contact2
	 * @return {number} 0 if contact1 and contact2 have the same last and first name
	 *  -1 if contact1 is alphabetically before contact2
	 *  1 if contact1 is alphabetically after contact2
	 */
	return function(contact1, contact2) {
		var result = compareName(contact1.lastName, contact2.lastName);

		if(result === 0) {
			result = compareName(contact1.firstName, contact2.firstName)
		}

		return result;
	};

	/**
	 * Compare two strings case-insensitively
	 * @param {string} name1
	 * @param {string} name2
	 * @returns {number} 0 if name1 == name2
	 *  -1 if name1 < name2
	 *  1 if name1 > name2
	 */
	function compareName(name1, name2) {
		if(name1 == null) {
			name1 = '';
		}

		if(name2 == null) {
			name2 = '';
		}

		name1 = name1.toLowerCase();
		name2 = name2.toLowerCase();

		return name1 < name2 ? -1
			: name1 > name2 ? 1
				: 0;
	}
});
/** @license MIT License (c) copyright B Cavalier & J Hann */

(function (define) {
define('cola/dom/form', function () {

	var forEach, slice;

	forEach = Array.prototype.forEach;
	slice = Array.prototype.slice;

	return {
		getValues: formToObject,
		getMultiSelectValue: getMultiSelectValue,
		setValues: objectToForm,
		setElementValue: setElementValue,
		setGroupValue: setGroupValue,
		setMultiSelectValue: setMultiSelectValue,
		isCheckable: isCheckable
	};

	function objectToForm(form, object, filter) {
		var els;

		els = form.elements;
		if(typeof filter !== 'function') {
			filter = alwaysInclude;
		}

		Object.keys(object).forEach(function(name) {

			var el, value;

			value = object[name];
			el = els[name];

			if(!filter(el, name, value)) return;

			if(el.length) {
				setGroupValue(el, value);
			} else {
				setElementValue(el, value);
			}

		});

		return form;
	}

	function setGroupValue(group, value) {
		var getBooleanValue;

		getBooleanValue = Array.isArray(value)
			? function(array, el) { return array.indexOf(el.value) >= 0; }
			: function(value, el) { return el.value == value; };

		forEach.call(group, function(el, i) {
			if(isCheckable(el)) {
				el.checked = getBooleanValue(value, el);
			} else {
				el.value = textValue(value[i]);
			}
		});
	}

	function setElementValue(el, value) {

		if(isCheckable(el)) {

			el.checked = !!value;

		} else if(el.multiple && el.options) {

			if(!Array.isArray(value)) {
				el.value = textValue(value);
			} else {
				setMultiSelectValue(el, value);
			}

		} else {
			el.value = textValue(value);
		}
	}

	function setMultiSelectValue(select, values) {
		var i, option, options;
		options = select.options;
		i = 0;
		while ((option = options[i++])) {
			if(values.indexOf(option.value) >= 0) {
				option.selected = true;
			}
		}
	}

	function textValue(value) {
		return value == null ? '' : value;
	}

	function isCheckable(el) {
		return el.type == 'radio' || el.type == 'checkbox';
	}

	/**
	 * Simple routine to pull input values out of a form.
	 * @param form {HTMLFormElement}
	 * @return {Object} populated object
	 */
	function formToObject (formOrEvent, filter) {
		var obj, form, els, seen, i, el, name, value;

		form = formOrEvent.selectorTarget || formOrEvent.target || formOrEvent;

		if(typeof filter !== 'function') {
			filter = alwaysInclude;
		}

		obj = {};

		els = form.elements;
		seen = {}; // finds checkbox groups
		i = 0;

		while ((el = els[i++])) {
			name = el.name;
			// skip over non-named elements and fieldsets (that have no value)
			if (!name || !('value' in el) || !filter(el)) continue;

			value = el.value;

			if (el.type == 'radio') {
				// only grab one radio value (to ensure that the property
				// is always set, we set false if none are checked)
				if (el.checked) obj[name] = value;
				else if (!(name in seen)) obj[name] = false;
			}
			else if (el.type == 'checkbox') {
				if (!(name in seen)) {
					// we're going against normal form convention by ensuring
					// the object always has a property of the given name.
					// forms would normally not submit a checkbox if it isn't
					// checked.
					// Note: IE6&7 don't support el.hasAttribute() so we're using el.attributes[]
					obj[name] = el.attributes['value'] ? !!el.checked && value : !!el.checked;
				}
				else if (el.checked) {
					// collect checkbox groups into an array.
					// if we found a false value, none have been checked so far
					obj[name] = (name in obj && obj[name] !== false)
						? [].concat(obj[name], value)
						: [value];
				}
			}
			else if (el.type == 'file') {
				if (!(name in seen)) {
					obj[name] = getFileInputValue(el);
				}
			}
			else if (el.multiple && el.options) {
				// grab all selected options
				obj[name] = getMultiSelectValue(el);
			}
			else {
				obj[name] = value;
			}

			seen[name] = name;
		}

		return obj;
	}

	function getFileInputValue (fileInput) {
		if ('files' in fileInput) {
			return fileInput.multiple ? slice.call(fileInput.files) : fileInput.files[0];
		} else {
			return fileInput.value;
		}
	}

	function getMultiSelectValue (select) {
		var values, options, i, option;
		values = [];
		options = select.options;
		i = 0;
		while ((option = options[i++])) {
			if (option.selected) values.push(option.value);
		}
		return values;
	}

	function alwaysInclude() {
		return true;
	}

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(); }
));

;define('contacts/app/collection/validateContact', function () {

	/**
	 * Validate a contact
	 */
	return function validateContact(contact) {
		var valid, result;
		result = { valid: true, errors: [] };

		valid = contact && 'firstName' in contact && contact.firstName.trim();
		if(!valid) {
			result.valid = false;
			result.errors.push({ property: 'firstName', message: 'missing' });
		}

		valid = contact && 'lastName' in contact && contact.lastName.trim();
		if(!valid) {
			result.valid = false;
			result.errors.push({ property: 'lastName', message: 'missing' });
		}

		return result;
	}

});

;define('contacts/app/collection/cleanContact', function () {

	return function(contact) {
		contact.firstName = contact.firstName && contact.firstName.trim() || '';
		contact.lastName = contact.lastName && contact.lastName.trim() || '';
		contact.phone = contact.phone && contact.phone.trim() || '';
		contact.email = contact.email && contact.email.trim() || '';
		return contact;
	}

});

;define('contacts/app/collection/generateMetadata', function () {

	/**
	 * Since we're using a datastore (localStorage) that doesn't generate ids and such
	 * for us, this transform generates a GUID id and a dateCreated.  It can be
	 * injected into a pipeline for creating new todos.
	 */
	return function generateMetadata(item) {
		if (!item.id || item.id.length == 0) {
			item.id = guidLike();
			item.dateCreated = new Date().getTime();
		}

		return item;
	};

	// GUID-like generation, not actually a GUID, tho, from:
	// http://stackoverflow.com/questions/7940616/what-makes-this-pseudo-guid-generator-better-than-math-random
	function s4() {
		return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
	}

	function guidLike() {
		return (s4()+s4()+"-"+s4()+"-"+s4()+"-"+s4()+"-"+s4()+s4()+s4());
	}

});

;define('curl/plugin/_fetchText', function () {

	var xhr, progIds;

	progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'];

	xhr = function () {
		if (typeof XMLHttpRequest !== "undefined") {
			// rewrite the getXhr method to always return the native implementation
			xhr = function () {
				return new XMLHttpRequest();
			};
		}
		else {
			// keep trying progIds until we find the correct one, then rewrite the getXhr method
			// to always return that one.
			var noXhr = xhr = function () {
				throw new Error("getXhr(): XMLHttpRequest not available");
			};
			while (progIds.length > 0 && xhr === noXhr) (function (id) {
				try {
					new ActiveXObject(id);
					xhr = function () {
						return new ActiveXObject(id);
					};
				}
				catch (ex) {
				}
			}(progIds.shift()));
		}
		return xhr();
	};

	function fetchText (url, callback, errback) {
		var x = xhr();
		x.open('GET', url, true);
		x.onreadystatechange = function (e) {
			if (x.readyState === 4) {
				if (x.status < 400) {
					callback(x.responseText);
				}
				else {
					errback(new Error('fetchText() failed. status: ' + x.statusText));
				}
			}
		};
		x.send(null);
	}

	return fetchText;

});
/** MIT License (c) copyright B Cavalier & J Hann */

/**
 * curl domReady
 *
 * Licensed under the MIT License at:
 * 		http://www.opensource.org/licenses/mit-license.php
 */

/**
 * usage:
 *  require(['ModuleA', 'curl/domReady'], function (ModuleA, domReady) {
 * 		var a = new ModuleA();
 * 		domReady(function () {
 * 			document.body.appendChild(a.domNode);
 * 		});
 * 	});
 *
 * also: check out curl's domReady! plugin
 *
 * HT to Bryan Forbes who wrote the initial domReady code:
 * http://www.reigndropsfall.net/
 *
 */
(function (global, doc) {

	var
		readyState = 'readyState',
		// keep these quoted so closure compiler doesn't squash them
		readyStates = { 'loaded': 1, 'interactive': 1, 'complete': 1 },
		callbacks = [],
		fixReadyState = doc && typeof doc[readyState] != "string",
		// IE needs this cuz it won't stop setTimeout if it's already queued up
		completed = false,
		pollerTime = 10,
		addEvent,
		remover,
		removers = [],
		pollerHandle,
		undef;

	function ready () {
		completed = true;
		clearTimeout(pollerHandle);
		while (remover = removers.pop()) remover();
		if (fixReadyState) {
			doc[readyState] = "complete";
		}
		// callback all queued callbacks
		var cb;
		while ((cb = callbacks.shift())) {
			cb();
		}
	}

	var testEl;
	function isDomManipulable () {
		// question: implement Diego Perini's IEContentLoaded instead?
		// answer: The current impl seems more future-proof rather than a
		// non-standard method (doScroll). i don't care if the rest of the js
		// world is using doScroll! They can have fun repairing their libs when
		// the IE team removes doScroll in IE 13. :)
		if (!doc.body) return false; // no body? we're definitely not ready!
		if (!testEl) testEl = doc.createTextNode('');
		try {
			// webkit needs to use body. doc
			doc.body.removeChild(doc.body.appendChild(testEl));
			testEl = undef;
			return true;
		}
		catch (ex) {
			return false;
		}
	}

	function checkDOMReady (e) {
		var isReady;
		// all browsers except IE will be ready when readyState == 'interactive'
		// so we also must check for document.body
		isReady = readyStates[doc[readyState]] && isDomManipulable();
		if (!completed && isReady) {
			ready();
		}
		return isReady;
	}

	function poller () {
		checkDOMReady();
		if (!completed) {
			pollerHandle = setTimeout(poller, pollerTime);
		}
	}

	// select the correct event listener function. all of our supported
	// browsers will use one of these
	if ('addEventListener' in global) {
		addEvent = function (node, event) {
			node.addEventListener(event, checkDOMReady, false);
			return function () { node.removeEventListener(event, checkDOMReady, false); };
		};
	}
	else {
		addEvent = function (node, event) {
			node.attachEvent('on' + event, checkDOMReady);
			return function () { node.detachEvent(event, checkDOMReady); };
		};
	}

	if (doc) {
		if (!checkDOMReady()) {
			// add event listeners and collect remover functions
			removers = [
				addEvent(global, 'load'),
				addEvent(doc, 'readystatechange'),
				addEvent(global, 'DOMContentLoaded')
			];
			// additionally, poll for readystate
			pollerHandle = setTimeout(poller, pollerTime);
		}
	}

	define('curl/domReady', function () {

		// this is simply a callback, but make it look like a promise
		function domReady (cb) {
			if (completed) cb(); else callbacks.push(cb);
		}
		domReady['then'] = domReady;
		domReady['amd'] = true;

		return domReady;

	});

}(this, this.document));

;define('curl/plugin/text!app/contacts-sample/template.html', function () {
	return "<div class=\"cujo-contacts\">\n    <div class=\"contacts-view-container\"></div>\n</div>";
});

;define('curl/plugin/text!app/tabs/tabs.html', function () {
	return "<ul class=\"tabs\">\n    <li class=\"item\"><a href=\"#\" class=\"tab-title\"></a></li>\n</ul>";
});

;define('curl/plugin/text!app/tabs/stack.html', function () {
	return "<ul class=\"stack\">\n    <li class=\"item\"></li>\n</ul>";
});
/** @license MIT License (c) copyright 2011-2013 original author or authors */

/**
 * A lightweight CommonJS Promises/A and when() implementation
 * when is part of the cujo.js family of libraries (http://cujojs.com/)
 *
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author Brian Cavalier
 * @author John Hann
 * @version 2.0.1
 */
(function(define) { 'use strict';
define('when/when', function () {

	// Public API

	when.defer     = defer;      // Create a deferred
	when.resolve   = resolve;    // Create a resolved promise
	when.reject    = reject;     // Create a rejected promise

	when.join      = join;       // Join 2 or more promises

	when.all       = all;        // Resolve a list of promises
	when.map       = map;        // Array.map() for promises
	when.reduce    = reduce;     // Array.reduce() for promises

	when.any       = any;        // One-winner race
	when.some      = some;       // Multi-winner race

	when.isPromise = isPromise;  // Determine if a thing is a promise

	/**
	 * Register an observer for a promise or immediate value.
	 *
	 * @param {*} promiseOrValue
	 * @param {function?} [onFulfilled] callback to be called when promiseOrValue is
	 *   successfully fulfilled.  If promiseOrValue is an immediate value, callback
	 *   will be invoked immediately.
	 * @param {function?} [onRejected] callback to be called when promiseOrValue is
	 *   rejected.
	 * @param {function?} [onProgress] callback to be called when progress updates
	 *   are issued for promiseOrValue.
	 * @returns {Promise} a new {@link Promise} that will complete with the return
	 *   value of callback or errback or the completion value of promiseOrValue if
	 *   callback and/or errback is not supplied.
	 */
	function when(promiseOrValue, onFulfilled, onRejected, onProgress) {
		// Get a trusted promise for the input promiseOrValue, and then
		// register promise handlers
		return resolve(promiseOrValue).then(onFulfilled, onRejected, onProgress);
	}

	/**
	 * Trusted Promise constructor.  A Promise created from this constructor is
	 * a trusted when.js promise.  Any other duck-typed promise is considered
	 * untrusted.
	 * @constructor
	 * @name Promise
	 */
	function Promise(then) {
		this.then = then;
	}

	Promise.prototype = {
		/**
		 * Register a rejection handler.  Shortcut for .then(undefined, onRejected)
		 * @param {function?} onRejected
		 * @return {Promise}
		 */
		otherwise: function(onRejected) {
			return this.then(undef, onRejected);
		},

		/**
		 * Ensures that onFulfilledOrRejected will be called regardless of whether
		 * this promise is fulfilled or rejected.  onFulfilledOrRejected WILL NOT
		 * receive the promises' value or reason.  Any returned value will be disregarded.
		 * onFulfilledOrRejected may throw or return a rejected promise to signal
		 * an additional error.
		 * @param {function} onFulfilledOrRejected handler to be called regardless of
		 *  fulfillment or rejection
		 * @returns {Promise}
		 */
		ensure: function(onFulfilledOrRejected) {
			var self = this;

			return this.then(injectHandler, injectHandler).yield(self);

			function injectHandler() {
				return resolve(onFulfilledOrRejected());
			}
		},

		/**
		 * Shortcut for .then(function() { return value; })
		 * @param  {*} value
		 * @return {Promise} a promise that:
		 *  - is fulfilled if value is not a promise, or
		 *  - if value is a promise, will fulfill with its value, or reject
		 *    with its reason.
		 */
		'yield': function(value) {
			return this.then(function() {
				return value;
			});
		},

		/**
		 * Assumes that this promise will fulfill with an array, and arranges
		 * for the onFulfilled to be called with the array as its argument list
		 * i.e. onFulfilled.apply(undefined, array).
		 * @param {function} onFulfilled function to receive spread arguments
		 * @return {Promise}
		 */
		spread: function(onFulfilled) {
			return this.then(function(array) {
				// array may contain promises, so resolve its contents.
				return all(array, function(array) {
					return onFulfilled.apply(undef, array);
				});
			});
		},

		/**
		 * Shortcut for .then(onFulfilledOrRejected, onFulfilledOrRejected)
		 * @deprecated
		 */
		always: function(onFulfilledOrRejected, onProgress) {
			return this.then(onFulfilledOrRejected, onFulfilledOrRejected, onProgress);
		}
	};

	/**
	 * Returns a resolved promise. The returned promise will be
	 *  - fulfilled with promiseOrValue if it is a value, or
	 *  - if promiseOrValue is a promise
	 *    - fulfilled with promiseOrValue's value after it is fulfilled
	 *    - rejected with promiseOrValue's reason after it is rejected
	 * @param  {*} value
	 * @return {Promise}
	 */
	function resolve(value) {
		return promise(function(resolve) {
			resolve(value);
		});
	}

	/**
	 * Returns a rejected promise for the supplied promiseOrValue.  The returned
	 * promise will be rejected with:
	 * - promiseOrValue, if it is a value, or
	 * - if promiseOrValue is a promise
	 *   - promiseOrValue's value after it is fulfilled
	 *   - promiseOrValue's reason after it is rejected
	 * @param {*} promiseOrValue the rejected value of the returned {@link Promise}
	 * @return {Promise} rejected {@link Promise}
	 */
	function reject(promiseOrValue) {
		return when(promiseOrValue, rejected);
	}

	/**
	 * Creates a new Deferred with fully isolated resolver and promise parts,
	 * either or both of which may be given out safely to consumers.
	 * The resolver has resolve, reject, and progress.  The promise
	 * only has then.
	 *
	 * @return {{
	 * promise: Promise,
	 * resolver: {
	 *	resolve: function:Promise,
	 *	reject: function:Promise,
	 *	notify: function:Promise
	 * }}}
	 */
	function defer() {
		var deferred, pending, resolved;

		// Optimize object shape
		deferred = {
			promise: undef, resolve: undef, reject: undef, notify: undef,
			resolver: { resolve: undef, reject: undef, notify: undef }
		};

		deferred.promise = pending = promise(makeDeferred);

		return deferred;

		function makeDeferred(resolvePending, rejectPending, notifyPending) {
			deferred.resolve = deferred.resolver.resolve = function(value) {
				if(resolved) {
					return resolve(value);
				}
				resolved = true;
				resolvePending(value);
				return pending;
			};

			deferred.reject  = deferred.resolver.reject  = function(reason) {
				if(resolved) {
					return resolve(rejected(reason));
				}
				resolved = true;
				rejectPending(reason);
				return pending;
			};

			deferred.notify  = deferred.resolver.notify  = function(update) {
				notifyPending(update);
				return update;
			};
		}
	}

	/**
	 * Creates a new promise whose fate is determined by resolver.
	 * @private (for now)
	 * @param {function} resolver function(resolve, reject, notify)
	 * @returns {Promise} promise whose fate is determine by resolver
	 */
	function promise(resolver) {
		var value, handlers = [];

		// Call the provider resolver to seal the promise's fate
		try {
			resolver(promiseResolve, promiseReject, promiseNotify);
		} catch(e) {
			promiseReject(e);
		}

		// Return the promise
		return new Promise(then);

		/**
		 * Register handlers for this promise.
		 * @param [onFulfilled] {Function} fulfillment handler
		 * @param [onRejected] {Function} rejection handler
		 * @param [onProgress] {Function} progress handler
		 * @return {Promise} new Promise
		 */
		function then(onFulfilled, onRejected, onProgress) {
			return promise(function(resolve, reject, notify) {
				handlers
				// Call handlers later, after resolution
				? handlers.push(function(value) {
					value.then(onFulfilled, onRejected, onProgress)
						.then(resolve, reject, notify);
				})
				// Call handlers soon, but not in the current stack
				: enqueue(function() {
					value.then(onFulfilled, onRejected, onProgress)
						.then(resolve, reject, notify);
				});
			});
		}

		/**
		 * Transition from pre-resolution state to post-resolution state, notifying
		 * all listeners of the ultimate fulfillment or rejection
		 * @param {*|Promise} val resolution value
		 */
		function promiseResolve(val) {
			if(!handlers) {
				return;
			}

			value = coerce(val);
			scheduleHandlers(handlers, value);

			handlers = undef;
		}

		/**
		 * Reject this promise with the supplied reason, which will be used verbatim.
		 * @param {*} reason reason for the rejection
		 */
		function promiseReject(reason) {
			promiseResolve(rejected(reason));
		}

		/**
		 * Issue a progress event, notifying all progress listeners
		 * @param {*} update progress event payload to pass to all listeners
		 */
		function promiseNotify(update) {
			if(handlers) {
				scheduleHandlers(handlers, progressing(update));
			}
		}
	}

	/**
	 * Coerces x to a trusted Promise
	 *
	 * @private
	 * @param {*} x thing to coerce
	 * @returns {Promise} Guaranteed to return a trusted Promise.  If x
	 *   is trusted, returns x, otherwise, returns a new, trusted, already-resolved
	 *   Promise whose resolution value is:
	 *   * the resolution value of x if it's a foreign promise, or
	 *   * x if it's a value
	 */
	function coerce(x) {
		if(x instanceof Promise) {
			return x;
		} else if (x !== Object(x)) {
			return fulfilled(x);
		}

		return promise(function(resolve, reject, notify) {
			enqueue(function() {
				try {
					// We must check and assimilate in the same tick, but not the
					// current tick, careful only to access promiseOrValue.then once.
					var untrustedThen = x.then;

					if(typeof untrustedThen === 'function') {
						fcall(untrustedThen, x, resolve, reject, notify);
					} else {
						// It's a value, create a fulfilled wrapper
						resolve(fulfilled(x));
					}

				} catch(e) {
					// Something went wrong, reject
					reject(e);
				}
			});
		});
	}

	/**
	 * Create an already-fulfilled promise for the supplied value
	 * @private
	 * @param {*} value
	 * @return {Promise} fulfilled promise
	 */
	function fulfilled(value) {
		var self = new Promise(function (onFulfilled) {
			try {
				return typeof onFulfilled == 'function'
					? coerce(onFulfilled(value)) : self;
			} catch (e) {
				return rejected(e);
			}
		});

		return self;
	}

	/**
	 * Create an already-rejected promise with the supplied rejection reason.
	 * @private
	 * @param {*} reason
	 * @return {Promise} rejected promise
	 */
	function rejected(reason) {
		var self = new Promise(function (_, onRejected) {
			try {
				return typeof onRejected == 'function'
					? coerce(onRejected(reason)) : self;
			} catch (e) {
				return rejected(e);
			}
		});

		return self;
	}

	/**
	 * Create a progress promise with the supplied update.
	 * @private
	 * @param {*} update
	 * @return {Promise} progress promise
	 */
	function progressing(update) {
		var self = new Promise(function (_, __, onProgress) {
			try {
				return typeof onProgress == 'function'
					? progressing(onProgress(update)) : self;
			} catch (e) {
				return progressing(e);
			}
		});

		return self;
	}

	/**
	 * Schedule a task that will process a list of handlers
	 * in the next queue drain run.
	 * @private
	 * @param {Array} handlers queue of handlers to execute
	 * @param {*} value passed as the only arg to each handler
	 */
	function scheduleHandlers(handlers, value) {
		enqueue(function() {
			var handler, i = 0;
			while (handler = handlers[i++]) {
				handler(value);
			}
		});
	}

	/**
	 * Determines if promiseOrValue is a promise or not
	 *
	 * @param {*} promiseOrValue anything
	 * @returns {boolean} true if promiseOrValue is a {@link Promise}
	 */
	function isPromise(promiseOrValue) {
		return promiseOrValue && typeof promiseOrValue.then === 'function';
	}

	/**
	 * Initiates a competitive race, returning a promise that will resolve when
	 * howMany of the supplied promisesOrValues have resolved, or will reject when
	 * it becomes impossible for howMany to resolve, for example, when
	 * (promisesOrValues.length - howMany) + 1 input promises reject.
	 *
	 * @param {Array} promisesOrValues array of anything, may contain a mix
	 *      of promises and values
	 * @param howMany {number} number of promisesOrValues to resolve
	 * @param {function?} [onFulfilled] resolution handler
	 * @param {function?} [onRejected] rejection handler
	 * @param {function?} [onProgress] progress handler
	 * @returns {Promise} promise that will resolve to an array of howMany values that
	 *  resolved first, or will reject with an array of
	 *  (promisesOrValues.length - howMany) + 1 rejection reasons.
	 */
	function some(promisesOrValues, howMany, onFulfilled, onRejected, onProgress) {

		checkCallbacks(2, arguments);

		return when(promisesOrValues, function(promisesOrValues) {

			return promise(resolveSome).then(onFulfilled, onRejected, onProgress);

			function resolveSome(resolve, reject, notify) {
				var toResolve, toReject, values, reasons, fulfillOne, rejectOne, len, i;

				len = promisesOrValues.length >>> 0;

				toResolve = Math.max(0, Math.min(howMany, len));
				values = [];

				toReject = (len - toResolve) + 1;
				reasons = [];

				// No items in the input, resolve immediately
				if (!toResolve) {
					resolve(values);

				} else {
					rejectOne = function(reason) {
						reasons.push(reason);
						if(!--toReject) {
							fulfillOne = rejectOne = noop;
							reject(reasons);
						}
					};

					fulfillOne = function(val) {
						// This orders the values based on promise resolution order
						values.push(val);
						if (!--toResolve) {
							fulfillOne = rejectOne = noop;
							resolve(values);
						}
					};

					for(i = 0; i < len; ++i) {
						if(i in promisesOrValues) {
							when(promisesOrValues[i], fulfiller, rejecter, notify);
						}
					}
				}

				function rejecter(reason) {
					rejectOne(reason);
				}

				function fulfiller(val) {
					fulfillOne(val);
				}
			}
		});
	}

	/**
	 * Initiates a competitive race, returning a promise that will resolve when
	 * any one of the supplied promisesOrValues has resolved or will reject when
	 * *all* promisesOrValues have rejected.
	 *
	 * @param {Array|Promise} promisesOrValues array of anything, may contain a mix
	 *      of {@link Promise}s and values
	 * @param {function?} [onFulfilled] resolution handler
	 * @param {function?} [onRejected] rejection handler
	 * @param {function?} [onProgress] progress handler
	 * @returns {Promise} promise that will resolve to the value that resolved first, or
	 * will reject with an array of all rejected inputs.
	 */
	function any(promisesOrValues, onFulfilled, onRejected, onProgress) {

		function unwrapSingleResult(val) {
			return onFulfilled ? onFulfilled(val[0]) : val[0];
		}

		return some(promisesOrValues, 1, unwrapSingleResult, onRejected, onProgress);
	}

	/**
	 * Return a promise that will resolve only once all the supplied promisesOrValues
	 * have resolved. The resolution value of the returned promise will be an array
	 * containing the resolution values of each of the promisesOrValues.
	 * @memberOf when
	 *
	 * @param {Array|Promise} promisesOrValues array of anything, may contain a mix
	 *      of {@link Promise}s and values
	 * @param {function?} [onFulfilled] resolution handler
	 * @param {function?} [onRejected] rejection handler
	 * @param {function?} [onProgress] progress handler
	 * @returns {Promise}
	 */
	function all(promisesOrValues, onFulfilled, onRejected, onProgress) {
		checkCallbacks(1, arguments);
		return map(promisesOrValues, identity).then(onFulfilled, onRejected, onProgress);
	}

	/**
	 * Joins multiple promises into a single returned promise.
	 * @return {Promise} a promise that will fulfill when *all* the input promises
	 * have fulfilled, or will reject when *any one* of the input promises rejects.
	 */
	function join(/* ...promises */) {
		return map(arguments, identity);
	}

	/**
	 * Traditional map function, similar to `Array.prototype.map()`, but allows
	 * input to contain {@link Promise}s and/or values, and mapFunc may return
	 * either a value or a {@link Promise}
	 *
	 * @param {Array|Promise} array array of anything, may contain a mix
	 *      of {@link Promise}s and values
	 * @param {function} mapFunc mapping function mapFunc(value) which may return
	 *      either a {@link Promise} or value
	 * @returns {Promise} a {@link Promise} that will resolve to an array containing
	 *      the mapped output values.
	 */
	function map(array, mapFunc) {
		return when(array, function(array) {

			return promise(resolveMap);

			function resolveMap(resolve, reject, notify) {
				var results, len, toResolve, resolveOne, i;

				// Since we know the resulting length, we can preallocate the results
				// array to avoid array expansions.
				toResolve = len = array.length >>> 0;
				results = [];

				if(!toResolve) {
					resolve(results);
				} else {

					resolveOne = function(item, i) {
						when(item, mapFunc).then(function(mapped) {
							results[i] = mapped;

							if(!--toResolve) {
								resolve(results);
							}
						}, reject, notify);
					};

					// Since mapFunc may be async, get all invocations of it into flight
					for(i = 0; i < len; i++) {
						if(i in array) {
							resolveOne(array[i], i);
						} else {
							--toResolve;
						}
					}
				}
			}
		});
	}

	/**
	 * Traditional reduce function, similar to `Array.prototype.reduce()`, but
	 * input may contain promises and/or values, and reduceFunc
	 * may return either a value or a promise, *and* initialValue may
	 * be a promise for the starting value.
	 *
	 * @param {Array|Promise} promise array or promise for an array of anything,
	 *      may contain a mix of promises and values.
	 * @param {function} reduceFunc reduce function reduce(currentValue, nextValue, index, total),
	 *      where total is the total number of items being reduced, and will be the same
	 *      in each call to reduceFunc.
	 * @returns {Promise} that will resolve to the final reduced value
	 */
	function reduce(promise, reduceFunc /*, initialValue */) {
		var args = fcall(slice, arguments, 1);

		return when(promise, function(array) {
			var total;

			total = array.length;

			// Wrap the supplied reduceFunc with one that handles promises and then
			// delegates to the supplied.
			args[0] = function (current, val, i) {
				return when(current, function (c) {
					return when(val, function (value) {
						return reduceFunc(c, value, i, total);
					});
				});
			};

			return reduceArray.apply(array, args);
		});
	}

	//
	// Utilities, etc.
	//

	var reduceArray, slice, fcall, nextTick, handlerQueue,
		timeout, funcProto, call, arrayProto, undef;

	//
	// Shared handler queue processing
	//
	// Credit to Twisol (https://github.com/Twisol) for suggesting
	// this type of extensible queue + trampoline approach for
	// next-tick conflation.

	handlerQueue = [];

	/**
	 * Enqueue a task. If the queue is not currently scheduled to be
	 * drained, schedule it.
	 * @param {function} task
	 */
	function enqueue(task) {
		if(handlerQueue.push(task) === 1) {
			scheduleDrainQueue();
		}
	}

	/**
	 * Schedule the queue to be drained in the next tick.
	 */
	function scheduleDrainQueue() {
		nextTick(drainQueue);
	}

	/**
	 * Drain the handler queue entirely or partially, being careful to allow
	 * the queue to be extended while it is being processed, and to continue
	 * processing until it is truly empty.
	 */
	function drainQueue() {
		var task, i = 0;

		while(task = handlerQueue[i++]) {
			task();
		}

		handlerQueue = [];
	}

	//
	// Capture function and array utils
	//
	/*global setTimeout,setImmediate,window,process*/

	// capture setTimeout to avoid being caught by fake timers used in time based tests
	timeout = setTimeout;
	nextTick = typeof setImmediate === 'function'
		? typeof window === 'undefined'
			? setImmediate
			: setImmediate.bind(window)
		: typeof process === 'object' && process.nextTick
			? process.nextTick
			: function(task) { timeout(task, 0); };

	// Safe function calls
	funcProto = Function.prototype;
	call = funcProto.call;
	fcall = funcProto.bind
		? call.bind(call)
		: function(f, context) {
			return f.apply(context, slice.call(arguments, 2));
		};

	// Safe array ops
	arrayProto = [];
	slice = arrayProto.slice;

	// ES5 reduce implementation if native not available
	// See: http://es5.github.com/#x15.4.4.21 as there are many
	// specifics and edge cases.  ES5 dictates that reduce.length === 1
	// This implementation deviates from ES5 spec in the following ways:
	// 1. It does not check if reduceFunc is a Callable
	reduceArray = arrayProto.reduce ||
		function(reduceFunc /*, initialValue */) {
			/*jshint maxcomplexity: 7*/
			var arr, args, reduced, len, i;

			i = 0;
			arr = Object(this);
			len = arr.length >>> 0;
			args = arguments;

			// If no initialValue, use first item of array (we know length !== 0 here)
			// and adjust i to start at second item
			if(args.length <= 1) {
				// Skip to the first real element in the array
				for(;;) {
					if(i in arr) {
						reduced = arr[i++];
						break;
					}

					// If we reached the end of the array without finding any real
					// elements, it's a TypeError
					if(++i >= len) {
						throw new TypeError();
					}
				}
			} else {
				// If initialValue provided, use it
				reduced = args[1];
			}

			// Do the actual reduce
			for(;i < len; ++i) {
				if(i in arr) {
					reduced = reduceFunc(reduced, arr[i], i, arr);
				}
			}

			return reduced;
		};

	//
	// Utility functions
	//

	/**
	 * Helper that checks arrayOfCallbacks to ensure that each element is either
	 * a function, or null or undefined.
	 * @private
	 * @param {number} start index at which to start checking items in arrayOfCallbacks
	 * @param {Array} arrayOfCallbacks array to check
	 * @throws {Error} if any element of arrayOfCallbacks is something other than
	 * a functions, null, or undefined.
	 */
	function checkCallbacks(start, arrayOfCallbacks) {
		// TODO: Promises/A+ update type checking and docs
		var arg, i = arrayOfCallbacks.length;

		while(i > start) {
			arg = arrayOfCallbacks[--i];

			if (arg != null && typeof arg != 'function') {
				throw new Error('arg '+i+' must be a function');
			}
		}
	}

	function noop() {}

	function identity(x) {
		return x;
	}

	return when;
});
})(
	typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(); }
);
/** MIT License (c) copyright B Cavalier & J Hann */

/**
 * curl style! plugin
 */

define('curl/plugin/style', function () {

	var nonRelUrlRe, findUrlRx, undef, doc, head;

	if (typeof window != 'undefined') {
		doc = window.document;
		head = doc.head || doc.getElementsByTagName('head')[0];
	}

	// tests for absolute urls and root-relative urls
	nonRelUrlRe = /^\/|^[^:]*:\/\//;
	// Note: this will fail if there are parentheses in the url
	findUrlRx = /url\s*\(['"]?([^'"\)]*)['"]?\)/g;

	function translateUrls (cssText, baseUrl) {
		return cssText.replace(findUrlRx, function (all, url) {
			return 'url("' + translateUrl(url, baseUrl) + '")';
		});
	}

	function translateUrl (url, parentPath) {
		// if this is a relative url
		if (!nonRelUrlRe.test(url)) {
			// append path onto it
			url = parentPath + url;
		}
		return url;
	}

	/***** style element functions *****/

	var currentStyle, callbacks = [];

	function createStyle (cssText, callback, errback) {

		try {
			clearTimeout(createStyle.debouncer);
			if (createStyle.accum) {
				createStyle.accum.push(cssText);
			}
			else {
				createStyle.accum = [cssText];
				currentStyle = doc.createStyleSheet ? doc.createStyleSheet() :
					head.appendChild(doc.createElement('style'));
			}

			callbacks.push({
				callback: callback,
				errback: errback,
				sheet: currentStyle
			});

			createStyle.debouncer = setTimeout(function () {
				var style, allCssText;

				try {
					style = currentStyle;
					currentStyle = undef;

					allCssText = createStyle.accum.join('\n');
					createStyle.accum = undef;

					// for safari which chokes on @charset "UTF-8";
					// TODO: see if Safari 5.x and up still complain
					allCssText = allCssText.replace(/.+charset[^;]+;/g, '');

					// IE 6-8 won't accept the W3C method for inserting css text
					'cssText' in style ? style.cssText = allCssText :
						style.appendChild(doc.createTextNode(allCssText));

					waitForDocumentComplete(notify);
				}
				catch (ex) {
					// just notify most recent errback. no need to spam
					errback(ex);
				}

			}, 0);

		}
		catch (ex) {
			errback(ex);
		}

	}

	function notify () {
		var list = callbacks;
		callbacks = [];
		for (var i = 0, len = list.length; i < len; i++) {
			list[i].callback(list[i].sheet);
		}
	}

	/**
	 * Keep checking for the document readyState to be "complete" since
	 * Chrome doesn't apply the styles to the document until that time.
	 * If we return before readyState == 'complete', Chrome may not have
	 * applied the styles, yet.
	 * Chrome only.
	 * @private
	 * @param cb
	 */
	function waitForDocumentComplete (cb) {
		// this isn't exactly the same as domReady (when dom can be
		// manipulated). it's later (when styles are applied).
		// chrome needs this (and opera?)
		function complete () {
			if (isDocumentComplete()) {
				cb();
			}
			else {
				setTimeout(complete, 10);
			}
		}
		complete();
	}

	/**
	 * Returns true if the documents' readyState == 'complete' or the
	 * document doesn't implement readyState.
	 * Chrome only.
	 * @private
	 * @return {Boolean}
	 */
	function isDocumentComplete () {
		return !doc.readyState || doc.readyState == 'complete';
	}

	createStyle.load = function (absId, req, loaded, config) {
		// get css text
		req([absId], function (cssText) {
			// TODO: translate urls?
			createStyle(cssText, loaded, loaded.error);
		});
	};
	
	createStyle.translateUrls = translateUrls;

	return createStyle;
});
/** MIT License (c) copyright B Cavalier & J Hann */

(function (define) {
define('cola/relational/propertiesKey', function () {
	"use strict";

	var defaultSeparator, undef;

	defaultSeparator = '|';

	/**
	 * Creates a transform whose input is an object and whose output
	 * is the value of object[propName] if propName is a String, or
	 * if propName is an Array, the Array.prototype.join()ed values
	 * of all the property names in the Array.
	 * @param propName {String|Array} name(s) of the property(ies) on the input object to return
	 * @return {Function} transform function(object) returns any
	 */
	return function(propName, separator) {

		if (typeof propName == 'string') {
			return function (object) {
				return object && object[propName];
			};

		} else {
			if (arguments.length === 1) separator = defaultSeparator;

			return function (object) {
				if (!object) return undef;

				var values, i, len, val;

				values = [];
				for (i = 0, len = propName.length; i < len; i++) {
					val = object[propName[i]];
					if (val != null) values.push(val);
				}

				return values.join( separator);
			};
		}
	};

});
}(
typeof define == 'function'
	? define
	: function (factory) { module.exports = factory(); }
));
/** @license MIT License (c) copyright 2011-2013 original author or authors */

/**
 * meld
 * Aspect Oriented Programming for Javascript
 *
 * meld is part of the cujo.js family of libraries (http://cujojs.com/)
 *
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author Brian Cavalier
 * @author John Hann
 * @version 1.3.0
 */
(function (define) {
define('meld/meld', function () {

	//
	// Public API
	//

	// Add a single, specific type of advice
	// returns a function that will remove the newly-added advice
	meld.before =         adviceApi('before');
	meld.around =         adviceApi('around');
	meld.on =             adviceApi('on');
	meld.afterReturning = adviceApi('afterReturning');
	meld.afterThrowing =  adviceApi('afterThrowing');
	meld.after =          adviceApi('after');

	// Access to the current joinpoint in advices
	meld.joinpoint =      joinpoint;

	// DEPRECATED: meld.add(). Use meld() instead
	// Returns a function that will remove the newly-added aspect
	meld.add =            function() { return meld.apply(null, arguments); };

	/**
	 * Add an aspect to all matching methods of target, or to target itself if
	 * target is a function and no pointcut is provided.
	 * @param {object|function} target
	 * @param {string|array|RegExp|function} [pointcut]
	 * @param {object} aspect
	 * @param {function?} aspect.before
	 * @param {function?} aspect.on
	 * @param {function?} aspect.around
	 * @param {function?} aspect.afterReturning
	 * @param {function?} aspect.afterThrowing
	 * @param {function?} aspect.after
	 * @returns {{ remove: function }|function} if target is an object, returns a
	 *  remover { remove: function } whose remove method will remove the added
	 *  aspect. If target is a function, returns the newly advised function.
	 */
	function meld(target, pointcut, aspect) {
		var pointcutType, remove;

		if(arguments.length < 3) {
			return addAspectToFunction(target, pointcut);
		} else {
			if (isArray(pointcut)) {
				remove = addAspectToAll(target, pointcut, aspect);
			} else {
				pointcutType = typeof pointcut;

				if (pointcutType === 'string') {
					if (typeof target[pointcut] === 'function') {
						remove = addAspectToMethod(target, pointcut, aspect);
					}

				} else if (pointcutType === 'function') {
					remove = addAspectToAll(target, pointcut(target), aspect);

				} else {
					remove = addAspectToMatches(target, pointcut, aspect);
				}
			}

			return remove;
		}

	}

	function Advisor(target, func) {

		var orig, advisor, advised;

		this.target = target;
		this.func = func;
		this.aspects = {};

		orig = this.orig = target[func];
		advisor = this;

		advised = this.advised = function() {
			var context, joinpoint, args, callOrig, afterType;

			// If called as a constructor (i.e. using "new"), create a context
			// of the correct type, so that all advice types (including before!)
			// are called with the correct context.
			if(this instanceof advised) {
				// shamelessly derived from https://github.com/cujojs/wire/blob/c7c55fe50238ecb4afbb35f902058ab6b32beb8f/lib/component.js#L25
				context = objectCreate(orig.prototype);
				callOrig = function (args) {
					return applyConstructor(orig, context, args);
				};

			} else {
				context = this;
				callOrig = function(args) {
					return orig.apply(context, args);
				};

			}

			args = slice.call(arguments);
			afterType = 'afterReturning';

			// Save the previous joinpoint and set the current joinpoint
			joinpoint = pushJoinpoint({
				target: context,
				method: func,
				args: args
			});

			try {
				advisor._callSimpleAdvice('before', context, args);

				try {
					joinpoint.result = advisor._callAroundAdvice(context, func, args, callOrigAndOn);
				} catch(e) {
					joinpoint.result = joinpoint.exception = e;
					// Switch to afterThrowing
					afterType = 'afterThrowing';
				}

				args = [joinpoint.result];

				callAfter(afterType, args);
				callAfter('after', args);

				if(joinpoint.exception) {
					throw joinpoint.exception;
				}

				return joinpoint.result;

			} finally {
				// Restore the previous joinpoint, if necessary.
				popJoinpoint();
			}

			function callOrigAndOn(args) {
				var result = callOrig(args);
				advisor._callSimpleAdvice('on', context, args);

				return result;
			}

			function callAfter(afterType, args) {
				advisor._callSimpleAdvice(afterType, context, args);
			}
		};

		defineProperty(advised, '_advisor', { value: advisor, configurable: true });
	}

	Advisor.prototype = {

		/**
		 * Invoke all advice functions in the supplied context, with the supplied args
		 *
		 * @param adviceType
		 * @param context
		 * @param args
		 */
		_callSimpleAdvice: function(adviceType, context, args) {

			// before advice runs LIFO, from most-recently added to least-recently added.
			// All other advice is FIFO
			var iterator, advices;

			advices = this.aspects[adviceType];
			if(!advices) {
				return;
			}

			iterator = iterators[adviceType];

			iterator(this.aspects[adviceType], function(aspect) {
				var advice = aspect.advice;
				advice && advice.apply(context, args);
			});
		},

		/**
		 * Invoke all around advice and then the original method
		 *
		 * @param context
		 * @param method
		 * @param args
		 * @param applyOriginal
		 */
		_callAroundAdvice: function (context, method, args, applyOriginal) {
			var len, aspects;

			aspects = this.aspects.around;
			len = aspects ? aspects.length : 0;

			/**
			 * Call the next function in the around chain, which will either be another around
			 * advice, or the orig method.
			 * @param i {Number} index of the around advice
			 * @param args {Array} arguments with with to call the next around advice
			 */
			function callNext(i, args) {
				// If we exhausted all aspects, finally call the original
				// Otherwise, if we found another around, call it
				return i < 0
					? applyOriginal(args)
					: callAround(aspects[i].advice, i, args);
			}

			function callAround(around, i, args) {
				var proceedCalled, joinpoint;

				proceedCalled = 0;

				// Joinpoint is immutable
				// TODO: Use Object.freeze once v8 perf problem is fixed
				joinpoint = pushJoinpoint({
					target: context,
					method: method,
					args: args,
					proceed: proceedCall,
					proceedApply: proceedApply,
					proceedCount: proceedCount
				});

				try {
					// Call supplied around advice function
					return around.call(context, joinpoint);
				} finally {
					popJoinpoint();
				}

				/**
				 * The number of times proceed() has been called
				 * @return {Number}
				 */
				function proceedCount() {
					return proceedCalled;
				}

				/**
				 * Proceed to the original method/function or the next around
				 * advice using original arguments or new argument list if
				 * arguments.length > 0
				 * @return {*} result of original method/function or next around advice
				 */
				function proceedCall(/* newArg1, newArg2... */) {
					return proceed(arguments.length > 0 ? slice.call(arguments) : args);
				}

				/**
				 * Proceed to the original method/function or the next around
				 * advice using original arguments or new argument list if
				 * newArgs is supplied
				 * @param [newArgs] {Array} new arguments with which to proceed
				 * @return {*} result of original method/function or next around advice
				 */
				function proceedApply(newArgs) {
					return proceed(newArgs || args);
				}

				/**
				 * Create proceed function that calls the next around advice, or
				 * the original.  May be called multiple times, for example, in retry
				 * scenarios
				 * @param [args] {Array} optional arguments to use instead of the
				 * original arguments
				 */
				function proceed(args) {
					proceedCalled++;
					return callNext(i - 1, args);
				}

			}

			return callNext(len - 1, args);
		},

		/**
		 * Adds the supplied aspect to the advised target method
		 *
		 * @param aspect
		 */
		add: function(aspect) {

			var advisor, aspects;

			advisor = this;
			aspects = advisor.aspects;

			insertAspect(aspects, aspect);

			return {
				remove: function () {
					var remaining = removeAspect(aspects, aspect);

					// If there are no aspects left, restore the original method
					if (!remaining) {
						advisor.remove();
					}
				}
			};
		},

		/**
		 * Removes the Advisor and thus, all aspects from the advised target method, and
		 * restores the original target method, copying back all properties that may have
		 * been added or updated on the advised function.
		 */
		remove: function () {
			delete this.advised._advisor;
			this.target[this.func] = this.orig;
		}
	};

	/**
	 * Returns the advisor for the target object-function pair.  A new advisor
	 * will be created if one does not already exist.
	 * @param target {*} target containing a method with tthe supplied methodName
	 * @param methodName {String} name of method on target for which to get an advisor
	 * @return {Object|undefined} existing or newly created advisor for the supplied method
	 */
	Advisor.get = function(target, methodName) {
		if(!(methodName in target)) {
			return;
		}

		var advisor, advised;

		advised = target[methodName];

		if(typeof advised !== 'function') {
			throw new Error('Advice can only be applied to functions: ' + methodName);
		}

		advisor = advised._advisor;
		if(!advisor) {
			advisor = new Advisor(target, methodName);
			target[methodName] = advisor.advised;
		}

		return advisor;
	};

	/**
	 * Add an aspect to a pure function, returning an advised version of it.
	 * NOTE: *only the returned function* is advised.  The original (input) function
	 * is not modified in any way.
	 * @param func {Function} function to advise
	 * @param aspect {Object} aspect to add
	 * @return {Function} advised function
	 */
	function addAspectToFunction(func, aspect) {
		var name, placeholderTarget;

		name = func.name || '_';

		placeholderTarget = {};
		placeholderTarget[name] = func;

		addAspectToMethod(placeholderTarget, name, aspect);

		return placeholderTarget[name];

	}

	function addAspectToMethod(target, method, aspect) {
		var advisor = Advisor.get(target, method);

		return advisor && advisor.add(aspect);
	}

	function addAspectToAll(target, methodArray, aspect) {
		var removers, added, f, i;

		removers = [];
		i = 0;

		while((f = methodArray[i++])) {
			added = addAspectToMethod(target, f, aspect);
			added && removers.push(added);
		}

		return createRemover(removers);
	}

	function addAspectToMatches(target, pointcut, aspect) {
		var removers = [];
		// Assume the pointcut is a an object with a .test() method
		for (var p in target) {
			// TODO: Decide whether hasOwnProperty is correct here
			// Only apply to own properties that are functions, and match the pointcut regexp
			if (typeof target[p] == 'function' && pointcut.test(p)) {
				// if(object.hasOwnProperty(p) && typeof object[p] === 'function' && pointcut.test(p)) {
				removers.push(addAspectToMethod(target, p, aspect));
			}
		}

		return createRemover(removers);
	}

	function createRemover(removers) {
		return {
			remove: function() {
				for (var i = removers.length - 1; i >= 0; --i) {
					removers[i].remove();
				}
			}
		};
	}

	// Create an API function for the specified advice type
	function adviceApi(type) {
		return function(target, method, adviceFunc) {
			var aspect = {};

			if(arguments.length === 2) {
				aspect[type] = method;
				return meld(target, aspect);
			} else {
				aspect[type] = adviceFunc;
				return meld(target, method, aspect);
			}
		};
	}

	/**
	 * Insert the supplied aspect into aspectList
	 * @param aspectList {Object} list of aspects, categorized by advice type
	 * @param aspect {Object} aspect containing one or more supported advice types
	 */
	function insertAspect(aspectList, aspect) {
		var adviceType, advice, advices;

		for(adviceType in iterators) {
			advice = aspect[adviceType];

			if(advice) {
				advices = aspectList[adviceType];
				if(!advices) {
					aspectList[adviceType] = advices = [];
				}

				advices.push({
					aspect: aspect,
					advice: advice
				});
			}
		}
	}

	/**
	 * Remove the supplied aspect from aspectList
	 * @param aspectList {Object} list of aspects, categorized by advice type
	 * @param aspect {Object} aspect containing one or more supported advice types
	 * @return {Number} Number of *advices* left on the advised function.  If
	 *  this returns zero, then it is safe to remove the advisor completely.
	 */
	function removeAspect(aspectList, aspect) {
		var adviceType, advices, remaining;

		remaining = 0;

		for(adviceType in iterators) {
			advices = aspectList[adviceType];
			if(advices) {
				remaining += advices.length;

				for (var i = advices.length - 1; i >= 0; --i) {
					if (advices[i].aspect === aspect) {
						advices.splice(i, 1);
						--remaining;
						break;
					}
				}
			}
		}

		return remaining;
	}

	function applyConstructor(C, instance, args) {
		try {
			// Try to define a constructor, but don't care if it fails
			defineProperty(instance, 'constructor', {
				value: C,
				enumerable: false
			});
		} catch(e) {
			// ignore
		}

		C.apply(instance, args);

		return instance;
	}

	var currentJoinpoint, joinpointStack,
		ap, prepend, append, iterators, slice, isArray, defineProperty, objectCreate;

	// TOOD: Freeze joinpoints when v8 perf problems are resolved
//	freeze = Object.freeze || function (o) { return o; };

	joinpointStack = [];

	ap      = Array.prototype;
	prepend = ap.unshift;
	append  = ap.push;
	slice   = ap.slice;

	isArray = Array.isArray || function(it) {
		return Object.prototype.toString.call(it) == '[object Array]';
	};

	// Check for a *working* Object.defineProperty, fallback to
	// simple assignment.
	defineProperty = definePropertyWorks()
		? Object.defineProperty
		: function(obj, prop, descriptor) {
		obj[prop] = descriptor.value;
	};

	objectCreate = Object.create ||
		(function() {
			function F() {}
			return function(proto) {
				F.prototype = proto;
				var instance = new F();
				F.prototype = null;
				return instance;
			};
		}());

	iterators = {
		// Before uses reverse iteration
		before: forEachReverse,
		around: false
	};

	// All other advice types use forward iteration
	// Around is a special case that uses recursion rather than
	// iteration.  See Advisor._callAroundAdvice
	iterators.on
		= iterators.afterReturning
		= iterators.afterThrowing
		= iterators.after
		= forEach;

	function forEach(array, func) {
		for (var i = 0, len = array.length; i < len; i++) {
			func(array[i]);
		}
	}

	function forEachReverse(array, func) {
		for (var i = array.length - 1; i >= 0; --i) {
			func(array[i]);
		}
	}

	function joinpoint() {
		return currentJoinpoint;
	}

	function pushJoinpoint(newJoinpoint) {
		joinpointStack.push(currentJoinpoint);
		return currentJoinpoint = newJoinpoint;
	}

	function popJoinpoint() {
		return currentJoinpoint = joinpointStack.pop();
	}

	function definePropertyWorks() {
		try {
			return 'x' in Object.defineProperty({}, 'x', {});
		} catch (e) { /* return falsey */ }
	}

	return meld;

});
})(typeof define == 'function' && define.amd ? define : function (factory) { module.exports = factory(); }
);
/** MIT License (c) copyright B Cavalier & J Hann */

/**
 * curl domReady loader plugin
 *
 * Licensed under the MIT License at:
 * 		http://www.opensource.org/licenses/mit-license.php
 *
 */

/**
 *
 * allows the curl/domReady module to be used like a plugin
 * this is for better compatibility with other loaders.
 *
 * Usage:
 *
 * curl(["domReady!"]).then(doSomething);
 *
 * TODO: use "../domReady" instead of "curl/domReady" when curl's make.sh is updated to use cram
 */

define('curl/plugin/domReady', ['curl/domReady'], function (domReady) {

	return {

		'load': function (name, req, cb, cfg) {
			domReady(cb);
		}

	};

});
/** MIT License (c) copyright B Cavalier & J Hann */

/**
 * curl text! loader plugin
 *
 * Licensed under the MIT License at:
 * 		http://www.opensource.org/licenses/mit-license.php
 */

/**
 * TODO: load xdomain text, too, somehow
 *
 */

define('curl/plugin/text', ['curl/plugin/_fetchText'], function (fetchText) {

	return {

		'normalize': function (resourceId, toAbsId) {
			// remove options
			return resourceId ? toAbsId(resourceId.split("!")[0]) : resourceId;
		},

		load: function (resourceName, req, callback, config) {
			// remove suffixes (future)
			// get the text
			fetchText(req['toUrl'](resourceName), callback, callback['error'] || error);
		},

		'cramPlugin': '../cram/text'

	};

	function error (ex) {
		throw ex;
	}

});
/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * wire/domReady plugin
 * A base wire/domReady module that plugins can use if they need domReady.  Simply
 * add 'wire/domReady' to your plugin module dependencies
 * (e.g. require(['wire/domReady', ...], function(domReady, ...) { ... })) and you're
 * set.
 *
 * wire is part of the cujo.js family of libraries (http://cujojs.com/)
 *
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Returns a function that accepts a callback to be called when the DOM is ready.
 *
 * You can also use your AMD loader's paths config to map wire/domReady to whatever
 * domReady function you might want to use.  See documentation for your AMD loader
 * for specific instructions.  For curl.js and requirejs, it will be something like:
 *
 *  paths: {
 *      'wire/domReady': 'path/to/my/domReady'
 *  }
 */

(function(global) {
define('wire/domReady', ['require'], function (req) {

	// Try require.ready first
	return (global.require && global.require.ready) || function (cb) {
		// If it's not available, assume a domReady! plugin is available
		req(['domReady!'], function () {
			// Using domReady! as a plugin will automatically wait for domReady
			// so we can just call the callback.
			cb();
		});
	};

});
})(this);
/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 */

(function(define){ 'use strict';
define('wire/lib/object', function () {

	var hasOwn;

	hasOwn = Object.prototype.hasOwnProperty.call.bind(Object.prototype.hasOwnProperty);

	return {
		hasOwn: hasOwn,
		isObject: isObject,
		inherit: inherit,
		mixin: mixin
	};

	function isObject(it) {
		// In IE7 tos.call(null) is '[object Object]'
		// so we need to check to see if 'it' is
		// even set
		return it && Object.prototype.toString.call(it) == '[object Object]';
	}

	function inherit(parent) {
		return parent ? Object.create(parent) : {};
	}

	/**
	 * Brute force copy own properties from -> to. Effectively an
	 * ES6 Object.assign polyfill, usable with Array.prototype.reduce.
	 * @param {object} to
	 * @param {object} from
	 * @returns {object} to
	 */
	function mixin(to, from) {
		if(!from) {
			return to;
		}

		return Object.keys(from).reduce(function(to, key) {
			to[key] = from[key];
			return to;
		}, to);
	}

});
})(typeof define == 'function'
	// AMD
	? define
	// CommonJS
	: function(factory) { module.exports = factory(); }
);
/** @license MIT License (c) copyright 2010-2013 original author or authors */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author: Brian Cavalier
 * @author: John Hann
 */

(function(define) { 'use strict';
define('wire/lib/plugin/priority', function () {

	var basePriority, defaultPriority;

	basePriority = -99;
	defaultPriority = 0;

	return {
		basePriority: basePriority,
		sortReverse: prioritizeReverse
	};

	function prioritizeReverse(list) {
		return list.sort(byReversePriority);
	}

	function byReversePriority(a, b) {
		var aPriority, bPriority;

		aPriority = a.priority || defaultPriority;
		bPriority = b.priority || defaultPriority;

		return aPriority < bPriority ? -1
			: aPriority > bPriority ? 1 : 0;
	}


});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * apply.js
 * Helper for using arguments-based and variadic callbacks with any
 * {@link Promise} that resolves to an array.
 *
 * @author brian@hovercraftstudios.com
 */

(function(define) {
define('when/apply', function () {

    var toString = Object.prototype.toString;

    /**
     * Creates a function that accepts a function that takes individual
     * arguments (it can be variadic, too), and returns a new function that
     * takes a single array as its only param:
     *
     * function argBased(a, b, c) {
     *   return a + b + c;
     * }
     *
     * argBased(1, 2, 3); // 6
     *
     * // Create an array-based version of argBased
     * var arrayBased = apply(argBased);
     * var inputs = [1, 2, 3];
     *
     * arrayBased(inputs); // 6
     *
     * With promises:
     *
     * var d = when.defer();
     * d.promise.then(arrayBased);
     *
     * d.resolve([1, 2, 3]); // arrayBased called with args 1, 2, 3 -> 6
     *
     * @param f {Function} arguments-based function
     *
     * @returns {Function} a new function that accepts an array
     */
    return function(f) {
        /**
         * @param array {Array} must be an array of arguments to use to apply the original function
         *
         * @returns the result of applying f with the arguments in array.
         */
        return function(array) {
            // It better be an array
            if(toString.call(array) != '[object Array]') {
                throw new Error('apply called with non-array arg');
            }

            return f.apply(null, array);
        };
    };

});
})(
	typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); }
	// Boilerplate for AMD and Node
);


/** MIT License (c) copyright B Cavalier & J Hann */

(function (define) {
define('cola/comparator/naturalOrder', function () {
	"use strict";

	return function(a, b) {
		return a == b ? 0
			: a < b ? -1
			: 1;
	};

});
}(
	typeof define == 'function'
		? define
		: function (factory) { module.exports = factory(); }
));

;(function (define) {
define('cola/adapterResolver', function () {
"use strict";

	return {
		/**
		 * Finds an adapter for the given object and the role.
		 * This is overly simplistic for now. We can replace this
		 * resolver later.
		 * @param object {Object}
		 * @description Loops through all Adapters registered with
		 * AdapterResolver.register, calling each Adapter's canHandle
		 * method. Adapters added later are found first.
		 */
		resolve: function(object) {
			var adapters, i, Adapter;

			adapters = this.adapters;

			if (adapters) {
				i = adapters.length;
				while ((Adapter = adapters[--i])) {
					if (Adapter.canHandle(object)) {
						return Adapter;
					}
				}
			}
		},

		register: function(Adapter) {
			var adapters = this.adapters;
			if(adapters.indexOf(Adapter) === -1) {
				adapters.push(Adapter);
			}
		}
	};

});
}(
	typeof define == 'function'
		? define
		: function (factory) { module.exports = factory(); }
));

;(function (define) {
define('cola/network/strategy/collectThenDeliver', function () {

	var defaultCollectionProperty, defaultPreserveCollection, isArray, undef;

	defaultCollectionProperty = 'items';
	defaultPreserveCollection = false;

	isArray = Array.isArray || function (o) {
		return Object.prototype.toString.call(o) == '[object Array]';
	};

	/**
	 *
	 * @param [options] {Object}
	 * @param [options.collectionProperty] {String} the name of the array
	 *   that will hold the collected items on the collector. If the collector
	 *   is an array, this option is ignored.
	 * @param [options.preserveCollection] {Boolean} set this to true to
	 *   preserve any existing items in the collector when starting a new
	 *   collection (i.e. a "collect" event happens).  Typically, you'd want
	 *   to start a fresh collection each time, but this is a way to pre-
	 *   load certain items.  This option is ignored if the collector is an
	 *   array.
	 * @return {Function}
	 *
	 * @description
	 * Note: this strategy relies on select and unselect events carrying
	 * the data item with them. (This is the intended behavior, but devs
	 * have the option to send something else.)
	 */
	return function (options) {
		var collProp, preserve, collector, collection, index;

		if (!options) options = {};

		collProp = options.collectionProperty || defaultCollectionProperty;
		preserve = options.preserveCollection || defaultPreserveCollection;

		return function collectThenDeliver (source, dest, data, type, api) {

			// if we're currently collecting
			if (collector) {
				if (api.isBefore()) {
					// cancel if we get another "collect" event
					if ('collect' == type) {
						// TODO: how do we notify the system why we canceled?
						// queue an "error" event?
						api.cancel();
					}
				}
				else if (api.isAfter()) {
					// watch for select
					if (type == 'select') {
						collect(data, source.identifier(data));
					}
					// also watch for unselect events and remove events
					else if (type == 'unselect' || type == 'remove') {
						uncollect(data, source.identifier(data));
					}
					// watch for "submit" events
					else if ('submit' == type) {
						api.queueEvent(source, collector, 'deliver');
						stopCollecting();
					}
					// watch for cancel events
					else if ('cancel' == type) {
						stopCollecting();
					}
				}
			}
			// if we're not collecting
			else {
				if (api.isAfter()) {
					// watch for "collect" events
					if ('collect' == type) {
						startCollecting(data);
					}
				}
			}

		};

		function startCollecting (data) {
			collector = data || [];
			// figure out where to collect
			if (isArray(collector)) {
				// collector is the collection. append to it
				collection = collector;
			}
			else {
				// use a property on collector
				collection = data[collProp];
				if (!collection) {
					collection = data[collProp] = [];
				}
			}
			// figure out if we need to remove any existing items
			if (!preserve && collection.length) {
				collection.splice(0, collection.length);
			}
			// create index
			index = {};
		}

		function stopCollecting () {
			collector = index = null;
		}

		function collect (item, id) {
			var pos = index[id];
			if (pos === undef) {
				index[id] = collection.push(item) - 1;
			}
		}

		function uncollect (item, id) {
			var pos = index[id];
			if (pos >= 0) {
				collection.splice(pos, 1);
				delete index[id];
				adjustIndex(pos);
			}
		}

		function adjustIndex (fromPos) {
			var id;
			for (id in index) {
				if (index[id] > fromPos) {
					index[id]--;
				}
			}
		}

	};

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(); }
));

;(function (define) {
define('cola/network/strategy/validate', function () {
	"use strict";

	/**
	 * Executes a configured validator and issues a validation event
	 * with the results in response to an add or update event.
	 * *Cancels* the add or update if validation fails
	 * @param [options.validator] {Function} validator function
	 * @return {Function} a network strategy function.
	 */
	return function configure (options) {

		var validator = (options && options.validator) || defaultValidator;

		return function validate (source, dest, data, type, api) {
			// Run validator on items before add or update
			var result;

			if (api.isBefore() && ('add' == type || 'update' == type)) {
				result = validator(data);

				if (!result.valid) api.cancel();

				api.queueEvent(source, result, 'validate');
			}
		};

	};

	function defaultValidator(item) {
		return { valid: item != null };
	}

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(); }
));

;(function (define) {
define('cola/network/strategy/changeEvent', function () {
	"use strict";

	var beforeEvents, afterEvents;

	beforeEvents = {
		sync: 1
	};
	afterEvents = {
		add: 1,
		update: 1,
		remove: 1
	};

	/**
	 * Trigger a change event as a result of other events.
	 * @return {Function} a network strategy function.
	 */
	return function configure () {

		return function queueChange (source, dest, data, type, api) {
			if (api.isBefore() && beforeEvents[type]
				|| api.isAfter() && afterEvents[type]) {
				api.queueEvent(source, data, 'change');
			}
		};

	};

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(); }
));
/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 */

(function(define){ 'use strict';
define('wire/lib/array', function () {


	var slice = [].slice;

	return {
		delegate: delegateArray,
		fromArguments: fromArguments,
		union: union
	};

	/**
	 * Creates a new {Array} with the same contents as array
	 * @param array {Array}
	 * @return {Array} a new {Array} with the same contents as array. If array is falsey,
	 *  returns a new empty {Array}
	 */
	function delegateArray(array) {
		return array ? [].concat(array) : [];
	}

	function fromArguments(args, index) {
		return slice.call(args, index||0);
	}

	/**
	 * Returns a new set that is the union of the two supplied sets
	 * @param {Array} a1 set
	 * @param {Array} a2 set
	 * @returns {Array} union of a1 and a2
	 */
	function union(a1, a2) {
		// If either is empty, return the other
		if(!a1.length) {
			return a2.slice();
		} else if(!a2.length) {
			return a1.slice();
		}

		return a2.reduce(function(union, a2item) {
			if(union.indexOf(a2item) === -1) {
				union.push(a2item);
			}
			return union;
		}, a1.slice());
	}

});
})(typeof define == 'function'
	// AMD
	? define
	// CommonJS
	: function(factory) { module.exports = factory(); }
);
/** MIT License (c) copyright B Cavalier & J Hann */

(function (define) {
define('cola/identifier/property', function () {
	"use strict";

	/**
	 * Returns an identifier function that uses the supplied
	 * propName as the item's identifier.
	 */
	return function(propName) {

		return function(item) {
			return item && item[propName];
		}

	};

});
}(
	typeof define == 'function'
		? define
		: function (factory) { module.exports = factory(); }
));
/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * DirectedGraph
 * @author: brian@hovercraftstudios.com
 */
(function(define) {
define('wire/lib/graph/DirectedGraph', function () {

	/**
	 * A simple directed graph
	 * @constructor
	 */
	function DirectedGraph() {
		this.vertices = {};
	}

	DirectedGraph.prototype = {
		/**
		 * Add a new edge from one vertex to another
		 * @param {string} from vertex at the tail of the edge
		 * @param {string} to vertex at the head of the edge
		 */
		addEdge: function(from, to) {
			this._getOrCreateVertex(to);
			this._getOrCreateVertex(from).edges[to] = 1;
		},

		/**
		 * Adds and initializes new vertex, or returns an existing vertex
		 * if one with the supplied name already exists
		 * @param {string} name vertex name
		 * @return {object} the new vertex, with an empty edge set
		 * @private
		 */
		_getOrCreateVertex: function(name) {
			var v = this.vertices[name];
			if(!v) {
				v = this.vertices[name] = { name: name, edges: {} };
			}

			return v;
		},

		/**
		 * Removes an edge, if it exits
		 * @param {string} from vertex at the tail of the edge
		 * @param {string} to vertex at the head of the edge
		 */
		removeEdge: function(from, to) {
			var outbound = this.vertices[from];
			if(outbound) {
				delete outbound.edges[to];
			}
		},

		/**
		 * Calls lambda once for each vertex in the graph passing
		 * the vertex as the only param.
		 * @param {function} lambda
		 */
		eachVertex: function(lambda) {
			var vertices, v;

			vertices = this.vertices;
			for(v in vertices) {
				lambda(vertices[v]);
			}
		},

		/**
		 * Calls lambda once for every outbound edge of the supplied vertex
		 * @param {string} vertex vertex name whose edges will be passed to lambda
		 * @param {function} lambda
		 */
		eachEdgeFrom: function(vertex, lambda) {
			var v, e, vertices;

			vertices = this.vertices;
			v = vertices[vertex];

			if(!v) {
				return;
			}

			for(e in v.edges) {
				lambda(v, vertices[e]);
			}
		}
	};

	return DirectedGraph;

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));

;(function (define) {
define('cola/enqueue', function () {
	"use strict";

	var enqueue;

	if (typeof process !== "undefined") {
		// node
		enqueue = process.nextTick;
	} else if (typeof msSetImmediate === "function") {
		// IE 10. From http://github.com/kriskowal/q
		// bind is necessary
		enqueue = msSetImmediate.bind(window);
	} else if (typeof setImmediate === "function") {
		enqueue = setImmediate;
	} else if (typeof MessageChannel !== "undefined") {
		enqueue = initMessageChannel();
	} else {
		// older envs w/only setTimeout
		enqueue = function (task) {
			setTimeout(task, 0);
		};
	}

	return enqueue;

	/**
	 * MessageChannel for browsers that support it
	 * From http://www.nonblocking.io/2011/06/windownexttick.html
	 */
	function initMessageChannel() {
		var channel, head, tail;

		channel = new MessageChannel();
		head = {};
		tail = head;

		channel.port1.onmessage = function () {
			var task;

			head = head.next;
			task = head.task;
			delete head.task;

			task();
		};

		return function (task) {
			tail = tail.next = {task: task};
			channel.port2.postMessage(0);
		};
	}
});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(); }
));

/** MIT License (c) copyright B Cavalier & J Hann */

(function (define) {
define('cola/SortedMap', function () {

	var undef, missing = {};

	/**
	 * @constructor
	 * @param identifier {Function}
	 * @param comparator {Function}
	 */
	function SortedMap (identifier, comparator) {

		// identifier is required, comparator is optional

		this.clear();

		/**
		 * Fetches a value item for the given key item or the special object,
		 * missing, if the value item was not found.
		 * @private
		 * @param keyItem
		 * @returns {Object} the value item that was set for the supplied
		 * key item or the special object, missing, if it was not found.
		 */
		this._fetch = function (keyItem) {
			var symbol = identifier(keyItem);
			return symbol in this._index ? this._index[symbol] : missing;
		};

		/**
		 * Performs a binary search to find the bucket position of a
		 * key item within the key items list.  Only used if we have a
		 * comparator.
		 * @private
		 * @param keyItem
		 * @param exactMatch {Boolean} if true, must be an exact match to the key
		 *   item, not just the correct position for a key item that sorts
		 *   the same.
		 * @returns {Number|Undefined}
		 */
		this._pos = function (keyItem, exactMatch) {
			var pos, sorted, symbol;
			sorted = this._sorted;
			symbol = identifier(keyItem);
			function getKey (pos) { return sorted[pos] ? sorted[pos][0].key : {}; }
			pos = binarySearch(0, sorted.length, keyItem, getKey, comparator);
			if (exactMatch) {
				if (symbol != identifier(sorted[pos][0].key)) {
					pos = -1;
				}
			}
			return pos;
		};
		this._bucketOffset = function (bucketPos) {
			var total, i;
			total = 0;
			for (i = 0; i < bucketPos; i++) {
				total += this._sorted[i].length;
			}
			return total;
		};

		if (!comparator) {
			this._pos = function (keyItem, exact) {
				return exact ? -1 : this._sorted.length;
			};
		}

		/**
		 * Given a keyItem and its bucket position in the list of key items,
		 * inserts an value item into the bucket of value items.
		 * This method can be overridden by other objects that need to
		 * have objects in the same order as the key values.
		 * @private
		 * @param valueItem
		 * @param keyItem
		 * @param pos
		 * @returns {Number} the absolute position of this item amongst
		 *   all items in all buckets.
		 */
		this._insert = function (keyItem, pos, valueItem) {
			var pair, symbol, entry, absPos;

			// insert into index
			pair = { key: keyItem, value: valueItem };
			symbol = identifier(keyItem);
			this._index[symbol] = pair;

			// insert into sorted table
			if (pos >= 0) {
				absPos = this._bucketOffset(pos);
				entry = this._sorted[pos] && this._sorted[pos][0];
				// is this a new row (at end of array)?
				if (!entry) {
					this._sorted[pos] = [pair];
				}
				// are there already items of the same sort position here?
				else if (comparator(entry.key, keyItem) == 0) {
					absPos += this._sorted[pos].push(pair) - 1;
				}
				// or do we need to insert a new row?
				else {
					this._sorted.splice(pos, 0, [pair]);
				}
			}
			else {
				absPos = -1;
			}

			return absPos;
		};

		/**
		 * Given a key item and its bucket position in the list of key items,
		 * removes a value item from the bucket of value items.
		 * This method can be overridden by other objects that need to
		 * have objects in the same order as the key values.
		 * @private
		 * @param keyItem
		 * @param pos
		 * @returns {Number} the absolute position of this item amongst
		 *   all items in all buckets.
		 */
		this._remove = function remove (keyItem, pos) {
			var symbol, entries, i, entry, absPos;

			symbol = identifier(keyItem);

			// delete from index
			delete this._index[symbol];

			// delete from sorted table
			if (pos >= 0) {
				absPos = this._bucketOffset(pos);
				entries = this._sorted[pos] || [];
				i = entries.length;
				// find it and remove it
				while ((entry = entries[--i])) {
					if (symbol == identifier(entry.key)) {
						entries.splice(i, 1);
						break;
					}
				}
				absPos += i;
				// if we removed all pairs at this position
				if (entries.length == 0) {
					this._sorted.splice(pos, 1);
				}
			}
			else {
				absPos = -1;
			}

			return absPos;
		};

		this._setComparator = function (newComparator) {
			var p, pair, pos;
			comparator = newComparator;
			this._sorted = [];
			for (p in this._index) {
				pair = this._index[p];
				pos = this._pos(pair.key);
				this._insert(pair.key, pos, pair.value);
			}
		};

	}

	SortedMap.prototype = {

		get: function (keyItem) {
			var pair;
			pair = this._fetch(keyItem);
			return pair == missing ? undef : pair.value;
		},

		add: function (keyItem, valueItem) {
			var pos, absPos;

			if (arguments.length < 2) throw new Error('SortedMap.add: must supply keyItem and valueItem args');

			// don't insert twice. bail if we already have it
			if (this._fetch(keyItem) != missing) return;

			// find pos and insert
			pos = this._pos(keyItem);
			absPos = this._insert(keyItem, pos, valueItem);

			return absPos;
		},

		remove: function (keyItem) {
			var valueItem, pos, absPos;

			// don't remove if we don't already have it
			valueItem = this._fetch(keyItem);
			if (valueItem == missing) return;

			// find positions and delete
			pos = this._pos(keyItem, true);
			absPos = this._remove(keyItem, pos);

			return absPos;
		},

		forEach: function (lambda) {
			var i, j, len, len2, entries;

			for (i = 0, len = this._sorted.length; i < len; i++) {
				entries = this._sorted[i];
				for (j = 0, len2 = entries.length; j < len2; j++) {
					lambda(entries[j].value, entries[j].key);
				}
			}
		},

		clear: function() {
			// hashmap of object-object pairs
			this._index = {};

			// 2d array of objects
			this._sorted = [];
		},

		setComparator: function (comparator) {
			this._setComparator(comparator);
		}

	};


	return SortedMap;

	/**
	 * Searches through a list of items, looking for the correct slot
	 * for a new item to be added.
	 * @param min {Number} points at the first possible slot
	 * @param max {Number} points at the slot after the last possible slot
	 * @param item anything comparable via < and >
	 * @param getter {Function} a function to retrieve a item at a specific
	 * 	 slot: function (pos) { return items[pos]; }
	 * @param comparator {Function} function to compare to items. must return
	 *   a number.
	 * @returns {Number} returns the slot where the item should be placed
	 *   into the list.
	 */
	function binarySearch (min, max, item, getter, comparator) {
		var mid, compare;
		if (max <= min) return min;
		do {
			mid = Math.floor((min + max) / 2);
			compare = comparator(item, getter(mid));
			if (isNaN(compare)) throw new Error('SortedMap: invalid comparator result ' + compare);
			// if we've narrowed down to a choice of just two slots
			if (max - min <= 1) {
				return compare == 0 ? mid : compare > 0 ? max : min;
			}
			// don't use mid +/- 1 or we may miss in-between values
			if (compare > 0) min = mid;
			else if (compare < 0) max = mid;
			else return mid;
		}
 		while (true);
	}

});
}(
	typeof define == 'function'
		? define
		: function (factory) { module.exports = factory(require); }
));

;(function (define) {
define('cola/dom/classList', ['require', 'exports'], function (require, exports) {

	// TODO: use has() to select code to use node.classList / DOMSettableTokenList

	var splitClassNameRx = /\s+/;

	var classRx = '(\\s+|^)(classNames)(\\b(?![\\-_])|$)';
	var trimLeadingRx = /^\s+/;
	var splitClassNamesRx = /(\b\s+\b)|(\s+)/g;

	/**
	 * Returns the list of class names on a node as an array.
	 * @param node {HTMLElement}
	 * @returns {Array}
	 */
	function getClassList (node) {
		return node.className.split(splitClassNameRx);
	}

	/**
	 * Adds a list of class names on a node and optionally removes some.
	 * @param node {HTMLElement}
	 * @param list {Array|Object} a list of class names to add.
	 * @param [list.add] {Array} a list of class names to add.
	 * @param [list.remove] {Array} a list of class names to remove.
	 * @returns {Array} the resulting class names on the node
	 *
	 * @description The list param may be supplied with any of the following:
	 *   simple array:
	 *     setClassList(node, ['foo-box', 'bar-box']) (all added)
	 *   simple array w/ remove property:
	 *     list = ['foo-box', 'bar-box'];
	 *     list.remove = ['baz-box'];
	 *     setClassList(node, list);
	 *   object with add and remove array properties:
	 *     list = {
	 *       add: ['foo-box', 'bar-box'],
	 *       remove: ['baz-box']
	 *     };
	 *     setClassList(node, list);
	 */
	function setClassList (node, list) {
		var adds, removes;
		if (list) {
			// figure out what to add and remove
			adds = list.add || list || [];
			removes = list.remove || [];
			node.className = spliceClassNames(node.className, removes, adds);
		}
		return getClassList(node);
	}

	function getClassSet (node) {
		var set, classNames, className;
		set = {};
		classNames = node.className.split(splitClassNameRx);
		while ((className = classNames.pop())) set[className] = true;
		return set;
	}

	/**
	 *
	 * @param node
	 * @param classSet {Object}
	 * @description
	 * Example bindings:
	 * 	stepsCompleted: {
	 *  	node: 'viewNode',
	 *  	prop: 'classList',
	 *  	enumSet: ['one', 'two', 'three']
	 * 	},
	 *  permissions: {
	 * 		node: 'myview',
	 * 		prop: 'classList',
	 * 		enumSet: {
	 * 			modify: 'can-edit-data',
	 * 			create: 'can-add-data',
	 * 			remove: 'can-delete-data'
	 * 		}
	 *  }
	 */
	function setClassSet (node, classSet) {
		var removes, adds, p, newList;

		removes = [];
		adds = [];

		for (p in classSet) {
			if (p) {
				if (classSet[p]) {
					adds.push(p);
				}
				else {
					removes.push(p);
				}
			}
		}

		return node.className = spliceClassNames(node.className, removes, adds);
	}

	// class parsing

	var openRx, closeRx, innerRx, innerSpacesRx, outerSpacesRx;

	openRx = '(?:\\b\\s+|^\\s*)(';
	closeRx = ')(?:\\b(?!-))|(?:\\s*)$';
	innerRx = '|';
	innerSpacesRx = /\b\s+\b/;
	outerSpacesRx = /^\s+|\s+$/;

	/**
	 * Adds and removes class names to a string.
	 * @private
	 * @param className {String} current className
	 * @param removes {Array} class names to remove
	 * @param adds {Array} class names to add
	 * @returns {String} modified className
	 */
	function spliceClassNames (className, removes, adds) {
		var rx, leftovers;
		// create regex to find all removes *and adds* since we're going to
		// remove them all to prevent duplicates.
		removes = trim(removes.concat(adds).join(' '));
		adds = trim(adds.join(' '));
		rx = new RegExp(openRx
			+ removes.replace(innerSpacesRx, innerRx)
			+ closeRx, 'g');
		// remove and add
		return trim(className.replace(rx, function (m) {
			// if nothing matched, we're at the end
			return !m && adds ? ' '  + adds : '';
		}));
	}

	function trim (str) {
		// don't worry about high-unicode spaces. they should never be here.
		return str.replace(outerSpacesRx, '');
	}


	function addClass (className, str) {
		var newClass = removeClass(className, str);
		if(newClass && className) {
			newClass += ' ';
		}

		return newClass + className;
	}

	function removeClass (removes, tokens) {
		var rx;

		if (!removes) {
			return tokens;
		}

		// convert space-delimited tokens with bar-delimited (regexp `or`)
		removes = removes.replace(splitClassNamesRx, function (m, inner, edge) {
			// only replace inner spaces with |
			return edge ? '' : '|';
		});

		// create one-pass regexp
		rx = new RegExp(classRx.replace('classNames', removes), 'g');

		// remove all tokens in one pass (wish we could trim leading
		// spaces in the same pass! at least the trim is not a full
		// scan of the string)
		return tokens.replace(rx, '').replace(trimLeadingRx, '');
	}

	return {
		addClass: addClass,
		removeClass: removeClass,
		getClassList: getClassList,
		setClassList: setClassList,
		getClassSet: getClassSet,
		setClassSet: setClassSet
	};

});
}(
	typeof define == 'function'
		? define
		: function (factory) { module.exports = factory(require); }
));

;(function (define) {
define('cola/network/strategy/base', function () {

	/**
	 * Creates a base strategy function.  If no earlier strategy cancels
	 * the event, this strategy will apply it to the destination adapter.
	 * @param options {Object} not currently used
	 * @return {Function} a network strategy function
	 */
	return function (options) {

		return function baseStrategy (source, dest, data, type, api) {
			if (api.isPropagating() && type in dest) {
				if (api.isHandled()) return;
				if (typeof dest[type] != 'function') {
					throw new Error('baseStrategy: ' + type + ' is not a function.');
				}
				return dest[type](data);
			}
		};

	};

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(); }
));

;(function (define) {
define('cola/network/strategy/targetFirstItem', function () {
"use strict";

	/**
	 * Targets the first item added after a sync.
	 * @param [options] {Object} not currently used.
	 * @return {Function} a network strategy function.
	 */
	return function configure (options) {
		var first = true;

		return function targetFirstItem (source, dest, data, type, api) {
			// check to send "target" event before it gets on the network
			// since sync strategies may squelch network events
			if (api.isBefore()) {
				if (first && 'add' == type) {
					api.queueEvent(source, data, 'target');
					first = false;
				}
				else if ('sync' == type) {
					first = true;
				}
			}
		};

	};

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(); }
));

;(function (define) {
define('cola/network/strategy/syncAfterJoin', function () {

	/**
	 * Returns a strategy function that fires a "sync" function after
	 * an adapter joins the network.  If the adapter has a truthy `provide`
	 * option set, a "sync from" event is fired. Otherwise, a "sync to me"
	 * request is sent.
	 * @param [options] {Object} options.
	 * @param [options.isProvider] {Function} function (adapter) { return bool; }
	 *   returns true for adapters that should be considered to be data
	 *   providers.  If not supplied, the default isProvider looks for a
	 *   truthy property on the adapters options called "provide".  If that
	 *   doesn't exist, it checks for data by calling the adapter's forEach.
	 *   If the adapter has data, it is considered to be a provider.
	 * @return {Function} a network strategy function
	 */
	return function (options) {
		var isProvider;

		if (!options) options = {};

		isProvider = options.isProvider || defaultIsProvider;

		return function syncAfterJoin (source, dest, data, type, api) {

			// process this strategy after sending to network
			if ('join' == type && api.isAfter()) {
				if (isProvider(source)) {
					// request to sync *from* source (provide)
					api.queueEvent(source, true, 'sync');
				}
				else {
					// request to sync *to* source (consume)
					api.queueEvent(source, false, 'sync');
				}
			}

		};

	};

	function defaultIsProvider (adapter) {
		return adapter.provide;
	}

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(); }
));

;(function (define) {
define('cola/network/strategy/syncDataDirectly', function () {
"use strict";

	/**
	 * Creates a strategy to push all data from a source into the consumers
	 * in the network directly (rather than as a sequence of 'add' events
	 * in the network) when a sync event happens.
	 *
	 * @description This strategy helps eliminate loops and complexities
	 * when data providers and consumers are added at unpredictable times.
	 * During a sync, all 'add' events are squelched while providers push
	 * all items to all consumers.
	 *
	 * @param [options.providersAreConsumers] {Boolean} if truthy, providers
	 *   are also treated as consumers and receive items from other providers.
	 * @return {Function} a network strategy function
	 */
	return function (options) {
		var synced, providers, consumers, undef;

		if (!options) options = {};

		// TODO: consider putting these on the api object so they can be shared across strategies
		// a list of all known providers and consumers
		// these lists tend to be very small
		providers = [];
		consumers = [];
		// the adapter currently being synced
		synced = undef;

		return function syncDataDirectly (source, dest, provide, type, api) {
			// this strategy stops sync events before going on the network
			if ('sync' == type && api.isBefore()) {
				synced = source;
				try {
					if (provide) {
						// provide data onto consumers in network
						if (typeof source.forEach != 'function') {
							throw new Error('syncDataDirectly: provider doesn\'t have `forEach()`.');
						}
						// keep track of providers
						add(providers, synced);
						// also add to consumers list, if specified
						if (options.providersAreConsumers) {
							add(consumers, synced);
						}
						// push data to all consumers
						forEach(consumers, function (consumer) {
							source.forEach(function (item) {
								consumer.add(item);
							});
						});
					}
					else {
						// keep track of consumers
						add(consumers, synced);
						// provide data onto consumers in network
						if (typeof source.add == 'function') {
							// consume data from all providers
							forEach(providers, function (provider) {
								provider.forEach(function (item) {
									synced.add(item);
								});
							});
						}
					}
					// the sync event never gets onto the network:
					api.cancel();
				}
				finally {
					synced = undef;
				}
			}
			// stop 'add' events between adapters while sync'ing, but allow
			// strategies interested in the event to see it before
			else if ('add' == type && synced && !api.isBefore()) {
				api.cancel();
			}
			// keep track of adapters that leave
			else if ('leave' == type && api.isAfter()) {
				// these just end up being noops if the source isn't in the list
				remove(providers, source);
				remove(consumers, source);
			}
		};

		function add (list, adapter) {
			list.push(adapter);
		}

		function remove (list, adapter) {
			forEach(list, function (provider, i , providers) {
				if (provider == adapter) {
					providers.splice(i, 1);
				}
			});
		}

		function forEach (list, lambda) {
			var i, obj;
			i = list.length;
			while ((obj = list[--i])) {
				lambda(obj, i, list);
			}
		}

	};

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(); }
));

;
/** MIT License (c) copyright B Cavalier & J Hann */

(function (define) {
define('cola/comparator/byProperty', ['require', 'cola/comparator/naturalOrder'], function (require, $cram_r0) {
	"use strict";

	var naturalOrder = $cram_r0;

	return function(propName, comparator) {
		if(!comparator) comparator = naturalOrder;

		return function(a, b) {
			return comparator(a[propName], b[propName]);
		};
	};

});
}(
	typeof define == 'function'
		? define
		: function (factory) { module.exports = factory(require); }
));
/** MIT License (c) copyright B Cavalier & J Hann */

(function (define) {
define('cola/identifier/default', ['require', 'cola/identifier/property'], function (require, $cram_r0) {
	"use strict";

	var property = $cram_r0;

	return property('id');

});
}(
	typeof define == 'function'
		? define
		: function (factory) { module.exports = factory(require); }
));
/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * Tarjan directed graph cycle detection
 * @author: brian@hovercraftstudios.com
 */
(function(define) {
define('wire/lib/graph/tarjan', function () {

	var undef;

	/**
	 * Tarjan directed graph cycle detection.
	 * See http://en.wikipedia.org/wiki/Tarjan's_strongly_connected_components_algorithm
	 *
	 * WARNING: For efficiency, this adds properties to the vertices in the
	 * graph.  It doesn't really matter for wire's internal purposes.
	 *
	 * @param {DirectedGraph} digraph
	 * @return {Array} each element is a set (Array) of vertices involved
	 * in a cycle.
	 */
	return function tarjan(digraph) {

		var index, stack, scc;

		index = 0;
		stack = [];

		scc = [];

		// Clear out any old cruft that may be hanging around
		// from a previous run.  Maybe should do this afterward?
		digraph.eachVertex(function(v) {
			delete v.index;
			delete v.lowlink;
			delete v.onStack;
		});

		// Start the depth first search
		digraph.eachVertex(function(v) {
			if(v.index === undef) {
				findStronglyConnected(digraph, v)
			}
		});

		// Tarjan algorithm for a single node
		function findStronglyConnected(dg, v) {
			var vertices, vertex;

			v.index = v.lowlink = index;
			index += 1;
			pushStack(stack, v);

			dg.eachEdgeFrom(v.name, function(v, w) {

				if(w.index === undef) {
					// Continue depth first search
					findStronglyConnected(dg, w);
					v.lowlink = Math.min(v.lowlink, w.lowlink);
				} else if(w.onStack) {
					v.lowlink = Math.min(v.lowlink, w.index);
				}

			});

			if(v.lowlink === v.index) {
				vertices = [];
				if(stack.length) {
					do {
						vertex = popStack(stack);
						vertices.push(vertex);
					} while(v !== vertex)
				}

				if(vertices.length) {
					scc.push(vertices);
				}
			}
		}

		return scc;
	};

	/**
	 * Push a vertex on the supplied stack, but also tag the
	 * vertex as being on the stack so we don't have to scan the
	 * stack later in order to tell.
	 * @param {Array} stack
	 * @param {object} vertex
	 */
	function pushStack(stack, vertex) {
		stack.push(vertex);
		vertex.onStack = 1;
	}

	/**
	 * Pop an item off the supplied stack, being sure to un-tag it
	 * @param {Array} stack
	 * @return {object|undefined} vertex
	 */
	function popStack(stack) {
		var v = stack.pop();
		if(v) {
			delete v.onStack;
		}

		return v;
	}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * formatCycles
 * @author: brian@hovercraftstudios.com
 */
(function(define) {
define('wire/lib/graph/formatCycles', function () {
	/**
	 * If there are cycles, format them for output
	 * @param {Array} cycles array of reference resolution cycles
	 * @return {String} formatted string
	 */
	return function formatCycles(cycles) {
		return cycles.map(function (sc) {
			return '[' + sc.map(function (v) {
					return v.name;
				}
			).join(', ') + ']';
		}).join(', ');
	}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
/** MIT License (c) copyright B Cavalier & J Hann */

// TODO: Evaluate whether ArrayAdapter should use SortedMap internally to
// store items in sorted order based on its comparator

(function(define) {
define('cola/adapter/Array', ['require', 'when/when'], function (require, $cram_r0) {

	"use strict";

	var when, methods, undef;
	when = $cram_r0;

	/**
	 * Manages a collection of objects taken from the supplied dataArray
	 * @param dataArray {Array} array of data objects to use as the initial
	 * population
	 * @param options.identifier {Function} function that returns a key/id for
	 * a data item.
	 * @param options.comparator {Function} comparator function that will
	 * be propagated to other adapters as needed
	 */
	function ArrayAdapter(dataArray, options) {

		if(!options) options = {};

		this._options = options;

		// Use the default comparator if none provided.
		// The consequences of this are that the default comparator will
		// be propagated to downstream adapters *instead of* an upstream
		// adapter's comparator
		this.comparator = options.comparator || this._defaultComparator;

		this.identifier = options.identifier || defaultIdentifier;

		if('provide' in options) {
			this.provide = options.provide;
		}

		this._array = dataArray;
		this.clear();

		var self = this;
		when(dataArray, function(array) {
			mixin(self, methods);
			self._init(array);
		});
	}

	ArrayAdapter.prototype = {

		provide: true,

		_init: function(dataArray) {
			if(dataArray && dataArray.length) {
				addAll(this, dataArray);
			}
		},

		/**
		 * Default comparator that uses an item's position in the array
		 * to order the items.  This is important when an input array is already
		 * in sorted order, so the user doesn't have to specify a comparator,
		 * and so the order can be propagated to other adapters.
		 * @param a
		 * @param b
		 * @return {Number} -1 if a is before b in the input array
		 *  1 if a is after b in the input array
		 *  0 iff a and b have the same symbol as returned by the configured identifier
		 */
		_defaultComparator: function(a, b) {
			var aIndex, bIndex;

			aIndex = this._index(this.identifier(a));
			bIndex = this._index(this.identifier(b));

			return aIndex - bIndex;
		},

		comparator: undef,

		identifier: undef,

		// just stubs for now
		getOptions: function () {
			return this._options;
		},

		forEach: function(lambda) { return this._forEach(lambda); },

		add: function(item) { return this._add(item); },

		remove: function(item) { return this._remove(item); },

		update: function(item) { return this._update(item); },

		clear: function() { return this._clear(); }
	};

	methods = {

		_forEach: function(lambda) {
			var i, data, len;

			i = 0;
			data = this._data;
			len = data.length;

			for(; i < len; i++) {
				// TODO: Should we catch exceptions here?
				lambda(data[i]);
			}
		},

		_add: function(item) {
			var key, index;

			key = this.identifier(item);
			index = this._index;

			if(key in index) return null;

			index[key] = this._data.push(item) - 1;

			return index[key];
		},

		_remove: function(itemOrId) {
			var key, at, index, data;

			key = this.identifier(itemOrId);
			index = this._index;

			if(!(key in index)) return null;

			data = this._data;

			at = index[key];
			data.splice(at, 1);

			// Rebuild index
			this._index = buildIndex(data, this.identifier);

			return at;
		},

		_update: function (item) {
			var key, at, index;

			key = this.identifier(item);
			index = this._index;

			at = index[key];

			if (at >= 0) {
				this._data[at] = item;
			}
			else {
				index[key] = this._data.push(item) - 1;
			}

			return at;
		},

		_clear: function() {
			this._data = [];
			this._index = {};
		}

	};

	mixin(ArrayAdapter.prototype, methods, makePromiseAware);

	/**
	 *
	 * @param to
	 * @param from
	 * @param [transform]
	 */
	function mixin(to, from, transform) {
		var name, func;
		for(name in from) {
			if(from.hasOwnProperty(name)) {
				func = from[name];
				to[name] = transform ? transform(func) : func;
			}
		}

		return to;
	}

	/**
	 * Returns a new function that will delay execution of the supplied
	 * function until this._resultSetPromise has resolved.
	 *
	 * @param func {Function} original function
	 * @return {Promise}
	 */
	function makePromiseAware(func) {
		return function promiseAware() {
			var self, args;

			self = this;
			args = Array.prototype.slice.call(arguments);

			return when(this._array, function() {
				return func.apply(self, args);
			});
		}
	}

	ArrayAdapter.canHandle = function(it) {
		return it && (when.isPromise(it) || Object.prototype.toString.call(it) == '[object Array]');
	};

	function defaultIdentifier(item) {
		return typeof item == 'object' ? item.id : item;
	}

	/**
	 * Adds all the items, starting at the supplied start index,
	 * to the supplied adapter.
	 * @param adapter
	 * @param items
	 */
	function addAll(adapter, items) {
		for(var i = 0, len = items.length; i < len; i++) {
			adapter.add(items[i]);
		}
	}

	function buildIndex(items, keyFunc) {
		var index, i, len;

		index = {};

		for(i = 0, len = items.length; i < len; i++) {
			index[keyFunc(items[i])] = i;
		}

		return index;
	}

	return ArrayAdapter;
});

})(
	typeof define == 'function'
		? define
		: function(factory) { module.exports = factory(require); }
);
/** @license MIT License (c) copyright original author or authors */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 */

(function(define){ 'use strict';
define('wire/lib/instantiate', function () {

	var undef;

	/**
	 * Creates an object by either invoking ctor as a function and returning the result,
	 * or by calling new ctor().  It uses a simple heuristic to try to guess which approach
	 * is the "right" one.
	 *
	 * @param ctor {Function} function or constructor to invoke
	 * @param args {Array} array of arguments to pass to ctor in either case
	 *
	 * @return The result of invoking ctor with args, with or without new, depending on
	 * the strategy selected.
	 */
	return function instantiate(ctor, args, forceConstructor) {

		var begotten, ctorResult;

		if (forceConstructor || isConstructor(ctor)) {
			begotten = Object.create(ctor.prototype);
			defineConstructorIfPossible(begotten, ctor);
			ctorResult = ctor.apply(begotten, args);
			if(ctorResult !== undef) {
				begotten = ctorResult;
			}

		} else {
			begotten = ctor.apply(undef, args);

		}

		return begotten === undef ? null : begotten;
	};

	/**
	 * Carefully sets the instance's constructor property to the supplied
	 * constructor, using Object.defineProperty if available.  If it can't
	 * set the constructor in a safe way, it will do nothing.
	 *
	 * @param instance {Object} component instance
	 * @param ctor {Function} constructor
	 */
	function defineConstructorIfPossible(instance, ctor) {
		try {
			Object.defineProperty(instance, 'constructor', {
				value: ctor,
				enumerable: false
			});
		} catch(e) {
			// If we can't define a constructor, oh well.
			// This can happen if in envs where Object.defineProperty is not
			// available, or when using cujojs/poly or other ES5 shims
		}
	}

	/**
	 * Determines whether the supplied function should be invoked directly or
	 * should be invoked using new in order to create the object to be wired.
	 *
	 * @param func {Function} determine whether this should be called using new or not
	 *
	 * @returns {Boolean} true iff func should be invoked using new, false otherwise.
	 */
	function isConstructor(func) {
		var is = false, p;
		for (p in func.prototype) {
			if (p !== undef) {
				is = true;
				break;
			}
		}

		return is;
	}

});
})(typeof define == 'function'
	// AMD
	? define
	// CommonJS
	: function(factory) {
		module.exports = factory();
	}
);

;(function(define) {
define('wire/lib/invoker', function () {

	return function(methodName, args) {
		return function(target) {
			return target[methodName].apply(target, args);
		};
	};

});
})(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); });

;

;(function (define, global, document) {
define('cola/dom/has', function () {
	"use strict";

	function has(feature) {
		var test = has.cache[feature];
		if (typeof test == 'function') {
			// run it now and cache result
			test = (has.cache[feature] = has.cache[feature]());
		}
		return test;
	}

	has.cache = {
		"dom-addeventlistener": function () {
			return document && 'addEventListener' in document || 'addEventListener' in global;
		},
		"dom-createevent": function () {
			return document && 'createEvent' in document;
		}
	};

	return has;

});
}(
	typeof define == 'function'
		? define
		: function (factory) { module.exports = factory(); },
	this,
	this.document
));
/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 */

(function(define){ 'use strict';
define('wire/lib/WireProxy', ['require', 'wire/lib/object', 'wire/lib/array'], function (require, $cram_r0, $cram_r1) {

	var object, array;

	object = $cram_r0;
	array = $cram_r1;

	/**
	 * A base proxy for all components that wire creates.  It allows wire's
	 * internals and plugins to work with components using a standard interface.
	 * WireProxy instances may be extended to specialize the behavior of the
	 * interface for a particular type of component.  For example, there is a
	 * specialized version for DOM Nodes.
	 * @param {*} target value to be proxied
	 *  instance being proxied
	 * @constructor
	 */
	function WireProxy(target) {
		Object.defineProperty(this, 'target', { value: target });
	}

	WireProxy.prototype = {
		get: function (property) {
			return this.target[property];
		},

		set: function (property, value) {
			this.target[property] = value;
			return value;
		},

		invoke: function (method, args) {
			var target = this.target;

			if (typeof method === 'string') {
				method = target[method];
			}

			return method.apply(target, array.fromArguments(args));
		},

		destroy: function() {},

		clone: function (options) {
			// don't try to clone a primitive
			var target = this.target;

			if (typeof target == 'function') {
				// cloneThing doesn't clone functions, so clone here:
				return target.bind();
			} else if (typeof target != 'object') {
				return target;
			}

			return cloneThing(target, options || {});
		}
	};

	WireProxy.create = createProxy;
	WireProxy.isProxy = isProxy;
	WireProxy.getTarget = getTarget;
	WireProxy.extend = extendProxy;

	return WireProxy;

	/**
	 * Creates a new WireProxy for the supplied target. See WireProxy
	 * @param {*} target value to be proxied
	 * @returns {WireProxy}
	 */
	function createProxy(target) {
		return new WireProxy(target);
	}

	/**
	 * Returns a new WireProxy, whose prototype is proxy, with extensions
	 * as own properties.  This is the "official" way to extend the functionality
	 * of an existing WireProxy.
	 * @param {WireProxy} proxy proxy to extend
	 * @param extensions
	 * @returns {*}
	 */
	function extendProxy(proxy, extensions) {
		if(!isProxy(proxy)) {
			throw new Error('Cannot extend non-WireProxy');
		}

		return object.mixin(Object.create(proxy), extensions);
	}

	/**
	 * Returns true if it is a WireProxy
	 * @param {*} it
	 * @returns {boolean}
	 */
	function isProxy(it) {
		return it instanceof WireProxy;
	}

	/**
	 * If it is a WireProxy (see isProxy), returns it's target.  Otherwise,
	 * returns it;
	 * @param {*} it
	 * @returns {*}
	 */
	function getTarget(it) {
		return isProxy(it) ? it.target : it;
	}

	function cloneThing (thing, options) {
		var deep, inherited, clone, prop;
		deep = options.deep;
		inherited = options.inherited;

		// Note: this filters out primitive properties and methods
		if (typeof thing != 'object') {
			return thing;
		}
		else if (thing instanceof Date) {
			return new Date(thing.getTime());
		}
		else if (thing instanceof RegExp) {
			return new RegExp(thing);
		}
		else if (Array.isArray(thing)) {
			return deep
				? thing.map(function (i) { return cloneThing(i, options); })
				: thing.slice();
		}
		else {
			clone = thing.constructor ? new thing.constructor() : {};
			for (prop in thing) {
				if (inherited || object.hasOwn(thing, prop)) {
					clone[prop] = deep
						? cloneThing(thing[prop], options)
						: thing[prop];
				}
			}
			return clone;
		}
	}

});
})(typeof define == 'function'
	// AMD
	? define
	// CommonJS
	: function(factory) { module.exports = factory(require); }
);

;define('highlight/github.css', ['curl/plugin/style', 'require'], function (injector, require) { var text = "/*\n\ngithub.com style (c) Vasily Polovnyov <vast@whiteants.net>\n\n*/\n\npre code {\n  display: block; padding: 0.5em;\n  color: #333;\n  background: #fff\n  /*background: #f8f8ff*/\n}\n\npre .comment,\npre .template_comment,\npre .diff .header,\npre .javadoc {\n  color: #998;\n  font-style: italic\n}\n\npre .keyword,\npre .css .rule .keyword,\npre .winutils,\npre .javascript .title,\npre .nginx .title,\npre .subst,\npre .request,\npre .status {\n  color: #333;\n  font-weight: bold\n}\n\npre .number,\npre .hexcolor,\npre .ruby .constant {\n  color: #099;\n}\n\npre .string,\npre .tag .value,\npre .phpdoc,\npre .tex .formula {\n  color: #d14\n}\n\npre .title,\npre .id,\npre .coffeescript .params,\npre .scss .preprocessor {\n  color: #900;\n  font-weight: bold\n}\n\npre .javascript .title,\npre .lisp .title,\npre .clojure .title,\npre .subst {\n  font-weight: normal\n}\n\npre .class .title,\npre .haskell .type,\npre .vhdl .literal,\npre .tex .command {\n  color: #458;\n  font-weight: bold\n}\n\npre .tag,\npre .tag .title,\npre .rules .property,\npre .django .tag .keyword {\n  color: #000080;\n  font-weight: normal\n}\n\npre .attribute,\npre .variable,\npre .lisp .body {\n  color: #008080\n}\n\npre .regexp {\n  color: #009926\n}\n\npre .class {\n  color: #458;\n  font-weight: bold\n}\n\npre .symbol,\npre .ruby .symbol .string,\npre .lisp .keyword,\npre .tex .special,\npre .prompt {\n  color: #990073\n}\n\npre .built_in,\npre .lisp .title,\npre .clojure .built_in {\n  color: #0086b3\n}\n\npre .preprocessor,\npre .pi,\npre .doctype,\npre .shebang,\npre .cdata {\n  color: #999;\n  font-weight: bold\n}\n\npre .deletion {\n  background: #fdd\n}\n\npre .addition {\n  background: #dfd\n}\n\npre .diff .change {\n  background: #0086b3\n}\n\npre .chunk {\n  color: #aaa\n}\n"; if (0) text = injector.translateUrls(text, require.toUrl("")); return text; });
define('curl/plugin/css!highlight/github.css', ['curl/plugin/style!highlight/github.css'], function (sheet) { return sheet; });
/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * wire/cola plugin
 *
 * wire is part of the cujo.js family of libraries (http://cujojs.com/)
 *
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 */

(function(define) {
define('cola/cola', ['when/when', 'cola/relational/propertiesKey', 'cola/comparator/byProperty'], function (when, propertiesKey, byProperty) {

	var defaultComparator, defaultQuerySelector, defaultQuerySelectorAll,
		defaultOn, excludeOptions;

	defaultComparator = byProperty('id');
	defaultQuerySelector = { $ref: 'dom.first!' };
	defaultQuerySelectorAll = { $ref: 'dom.all!' };
	defaultOn = { $ref: 'on!' };

	function initBindOptions(incomingOptions, pluginOptions, resolver) {
		var options, identifier, comparator;

		if(resolver.isRef(incomingOptions)) {
			incomingOptions = { to: incomingOptions };
		}
		options = copyOwnProps(incomingOptions, pluginOptions);

		if(!options.querySelector) {
			options.querySelector = defaultQuerySelector;
		}

		if(!options.querySelectorAll) {
			options.querySelectorAll = defaultQuerySelectorAll;
		}

		if(!options.on) {
			options.on = defaultOn;
		}

		// TODO: Extend syntax for identifier and comparator
		// to allow more fields, and more complex expressions
		identifier = options.identifier;
		options.identifier = typeof identifier == 'string' || Array.isArray(identifier)
			? propertiesKey(identifier)
			: identifier;

		comparator = options.comparator || defaultComparator;
		options.comparator = typeof comparator == 'string'
			? byProperty(comparator)
			: comparator;

		return options;
	}

	function doBind(facet, options, wire) {
		var target = facet.target;

		return when(wire(initBindOptions(facet.options, options, wire.resolver)),
			function(options) {
				var to = options.to;
				if (!to) throw new Error('wire/cola: "to" must be specified');

				to.addSource(target, copyOwnProps(options));
				return target;
			}
		);
	}

	/**
	 * We don't want to copy the module property from the plugin options, and
	 * wire adds the id property, so we need to filter that out too.
	 * @type {Object}
	 */
	excludeOptions = {
		id: 1,
		module: 1
	};

	return {
		wire$plugin: function(pluginOptions) {

			var options, p;

			options = {};

			if(arguments.length) {
				pluginOptions = arguments[arguments.length-1];

				for(p in pluginOptions) {
					if(!(p in excludeOptions)) {
						options[p] = pluginOptions[p];
					}
				}
			}

			function bindFacet(resolver, facet, wire) {
				resolver.resolve(doBind(facet, options, wire));
			}

			return {
				facets: {
					bind: {
						ready: bindFacet
					}
				}
			};
		}
	};

	/**
	 * Copies own properties from each src object in the arguments list
	 * to a new object and returns it.  Properties further to the right
	 * win.
	 *
	 * @return {Object} a new object with own properties from all srcs.
	 */
	function copyOwnProps(/*srcs...*/) {
		var i, len, p, src, dst;

		dst = {};

		for(i = 0, len = arguments.length; i < len; i++) {
			src = arguments[i];
			if(src) {
				for(p in src) {
					if(src.hasOwnProperty(p)) {
						dst[p] = src[p];
					}
				}
			}
		}

		return dst;
	}
});
})(typeof define == 'function'
	// use define for AMD if available
	? define
	: function(deps, factory) { module.exports = factory.apply(this, deps.map(require)); }
);
/** MIT License (c) copyright B Cavalier & J Hann */

(function(global, define) {
define('cola/adapter/LocalStorage', ['require', 'cola/identifier/default', 'when/when'], function (require, $cram_r0, $cram_r1) {

	"use strict";

	var when, defaultIdentifier, undef;

	defaultIdentifier = $cram_r0;
	when = $cram_r1;

	function LocalStorageAdapter(namespace, options) {
		if (!namespace) throw new Error('cola/LocalStorageAdapter: must provide a storage namespace');

		this._namespace = namespace;

		if (!options) options = {};

		if('provide' in options) {
			this.provide = options.provide;
		}

		this._storage = options.localStorage || global.localStorage;

		if(!this._storage) throw new Error('cola/LocalStorageAdapter: localStorage not available, must be supplied in options');

		this.identifier = options.identifier || defaultIdentifier;

		var data = this._storage.getItem(namespace);
		this._data = data ? JSON.parse(data) : {};
	}

	LocalStorageAdapter.prototype = {

		provide: true,

		identifier: undef,

		getOptions: function() {
			return {};
		},

		forEach: function(lambda) {
			var data = this._data;
			for(var key in data) {
				lambda(data[key]);
			}
		},

		add: function(item) {
			var id = this.identifier(item);

			if(id in this._data) return null;

			this._data[id] = item;
			this._sync();

			return id;
		},

		remove: function(item) {
			var id = this.identifier(item);

			if(!(id in this._data)) return null;

			delete this._data[id];

			this._sync();

			return item;
		},

		update: function(item) {
			var id = this.identifier(item);

			if(!(id in this._data)) return null;

			this._data[id] = item;

			this._sync();

			return item;
		},

		clear: function() {
			this._storage.removeItem(this._namespace);
		},

		_sync: function() {
			this._storage.setItem(this._namespace, JSON.stringify(this._data));
		}

	};

	return LocalStorageAdapter;

});
})(this.window || global,
	typeof define == 'function'
		? define
		: function(factory) { module.exports = factory(require); }
);

;

;(function (define) {
define('cola/dom/guess', ['require', 'cola/dom/has', 'cola/dom/classList'], function (require, $cram_r0, $cram_r1) {
"use strict";

	var guess, has, classList, formValueNodeRx, formClickableRx,
		attrToProp, customAccessors;

	has = $cram_r0;
	classList = $cram_r1;

	formValueNodeRx = /^(input|select|textarea)$/i;
	formClickableRx = /^(checkbox|radio)/i;

	attrToProp = {
		'class': 'className',
		'for': 'htmlFor'
		// textContent is added to this list if necessary
	};

	customAccessors = {
		classList: {
			get: classList.getClassList,
			set: classList.setClassList
		},
		classSet: {
			get: classList.getClassSet,
			set: classList.setClassSet
		}
	};

	guess = {
		isFormValueNode: isFormValueNode,

		eventsForNode: guessEventsFor,

		propForNode: guessPropFor,

		getNodePropOrAttr: initSetGet,

		setNodePropOrAttr: initSetGet
	};

	return guess;

	function isFormValueNode (node) {
		return formValueNodeRx.test(node.tagName);
	}

	function isClickableFormNode (node) {
		return isFormValueNode(node) && formClickableRx.test(node.type);
	}

	function guessEventsFor (node) {
		if (Array.isArray(node)) {
			// get unique list of events
			return node.reduce(function (events, node) {
				return events.concat(guessEventsFor(node).filter(function (event) {
					return event && events.indexOf(event) < 0;
				}));
			},[]);
		}
		else if (isFormValueNode(node)) {
			return [isClickableFormNode(node) ? 'click' : 'change', 'focusout'];
		}

		return [];
	}

	function guessPropFor (node) {
		return isFormValueNode(node)
			? isClickableFormNode(node) ? 'checked' : 'value'
			: 'textContent';
	}

	/**
	 * Returns a property or attribute of a node.
	 * @param node {Node}
	 * @param name {String}
	 * @returns the value of the property or attribute
	 */
	function getNodePropOrAttr (node, name) {
		var accessor, prop;
		accessor = customAccessors[name];
		prop = attrToProp[name] || name;

		if (accessor) {
			return accessor.get(node);
		}
		else if (prop in node) {
			return node[prop];
		}
		else {
			return node.getAttribute(prop);
		}
	}

	/**
	 * Sets a property of a node.
	 * @param node {Node}
	 * @param name {String}
	 * @param value
	 */
	function setNodePropOrAttr (node, name, value) {
		var accessor, prop;
		accessor = customAccessors[name];
		prop = attrToProp[name] || name;

		// this gets around a nasty IE6 bug with <option> elements
		if (node.nodeName == 'option' && prop == 'innerText') {
			prop = 'text';
		}

		if (accessor) {
			return accessor.set(node, value);
		}
		else if (prop in node) {
			node[prop] = value;
		}
		else {
			node.setAttribute(prop, value);
		}

		return value;
	}

	/**
	 * Initializes the dom setter and getter at first invocation.
	 * @private
	 * @param node
	 * @param attr
	 * @param [value]
	 * @return {*}
	 */
	function initSetGet (node, attr, value) {
		// test for innerText/textContent
		attrToProp.textContent
			= ('textContent' in node) ? 'textContent' : 'innerText';
		// continue normally
		guess.setNodePropOrAttr = setNodePropOrAttr;
		guess.getNodePropOrAttr = getNodePropOrAttr;
		return arguments.length == 3
			? setNodePropOrAttr(node, attr, value)
			: getNodePropOrAttr(node, attr);
	}

});
}(
	typeof define == 'function'
		? define
		: function (factory) { module.exports = factory(require); }
));
/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * wire/dom/base
 * provides basic dom creation capabilities for plugins.
 *
 * wire is part of the cujo.js family of libraries (http://cujojs.com/)
 *
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 */
(function (define) {
define('wire/lib/dom/base', ['require', 'wire/lib/WireProxy', 'wire/lib/plugin/priority'], function (require, $cram_r0, $cram_r1) {

	var WireProxy, priority, classRx, trimLeadingRx, splitClassNamesRx, nodeProxyInvoke;

	WireProxy = $cram_r0;
	priority = $cram_r1;

	classRx = '(\\s+|^)(classNames)(\\b(?![\\-_])|$)';
	trimLeadingRx = /^\s+/;
	splitClassNamesRx = /(\b\s+\b)|(\s+)/g;

	/**
	 * Adds one or more css classes to a dom element.
	 * @param el {HTMLElement}
	 * @param className {String} a single css class or several, space-delimited
	 *   css classes.
	 */
	function addClass (el, className) {
		var newClass;

		newClass = _stripClass(el.className, className);

		el.className = newClass + (newClass && className ? ' ' : '') + className;
	}

	/**
	 * Removes one or more css classes from a dom element.
	 * @param el {HTMLElement}
	 * @param className {String} a single css class or several, space-delimited
	 *   css classes.
	 */
	function removeClass (el, className) {
		el.className = _stripClass(el.className, className);
	}

	/**
	 * Adds or removes one or more css classes from a dom element.
	 * @param el {HTMLElement}
	 * @param className {String} a single css class or several, space-delimited
	 *   css classes.
	 */
	function toggleClass (el, className) {
		var unalteredClass;

		// save copy of what _stripClass would return if className
		// was not found
		unalteredClass = el.className.replace(trimLeadingRx, '');

		// remove className
		el.className = _stripClass(el.className, className);

		// add className if it wasn't removed
		if (unalteredClass == el.className) {
			el.className = unalteredClass + (unalteredClass && className ? ' ' : '') + className;
		}
	}

	/**
	 * Super fast, one-pass, non-looping routine to remove one or more
	 * space-delimited tokens from another space-delimited set of tokens.
	 * @private
	 * @param tokens
	 * @param removes
	 */
	function _stripClass (tokens, removes) {
		var rx;

		if (!removes) {
			return tokens;
		}

		// convert space-delimited tokens with bar-delimited (regexp `or`)
		removes = removes.replace(splitClassNamesRx, function (m, inner, edge) {
			// only replace inner spaces with |
			return edge ? '' : '|';
		});

		// create one-pass regexp
		rx = new RegExp(classRx.replace('classNames', removes), 'g');

		// remove all tokens in one pass (wish we could trim leading
		// spaces in the same pass! at least the trim is not a full
		// scan of the string)
		return tokens.replace(rx, '').replace(trimLeadingRx, '');
	}

	if (document && document.appendChild.apply) {
		// normal browsers
		nodeProxyInvoke = function jsInvoke (node, method, args) {
			if(typeof method == 'string') {
				method = node[method];
			}
			return method.apply(node, args);
		};
	}
	else {
		// IE 6-8 ("native" methods don't have .apply()) so we have
		// to use eval())
		nodeProxyInvoke = function evalInvoke (node, method, args) {
			var argsList;

			if(typeof method == 'function') {
				return method.apply(node, args);
			}

			// iirc, no node methods have more than 4 parameters
			// (addEventListener), so 5 should be safe. Note: IE needs
			// the exact number of arguments or it will throw!
			argsList = ['a', 'b', 'c', 'd', 'e'].slice(0, args.length).join(',');

			// function to execute eval (no need for global eval here
			// since the code snippet doesn't reference out-of-scope vars).
			function invoke (a, b, c, d, e) {
				/*jshint evil:true*/
				return eval('node.' + method + '(' + argsList + ');');
			}

			// execute and return result
			return invoke.apply(this, args);
		};
	}

	function byId(id) {
		return document.getElementById(id);
	}

	function queryAll(selector, root) {
		return (root||document).querySelectorAll(selector);
	}

	function query(selector, root) {
		return (root||document).querySelector(selector);
	}

	/**
	 * Places a node into the DOM at the location specified around
	 * a reference node.
	 * Note: replace is problematic if the dev expects to use the node
	 * as a wire component.  The component reference will still point
	 * at the node that was replaced.
	 * @param node {HTMLElement}
	 * @param refNode {HTMLElement}
	 * @param location {String} or {Number} "before", "after", "first", "last",
	 *   or the position within the children of refNode
	 */
	function placeAt(node, refNode, location) {
		var parent, i;

		if ('length' in refNode) {
			for (i = 0; i < refNode.length; i++) {
				placeAt(i === 0 ? node : node.cloneNode(true), refNode[i], location);
			}
			return node;
		}

		parent = refNode.parentNode;

		// `if else` is more compressible than switch
		if (!isNaN(location)) {
			if (location < 0) {
				location = 0;
			}
			_insertBefore(refNode, node, refNode.childNodes[location]);
		}
		else if(location == 'at') {
			refNode.innerHTML = '';
			_appendChild(refNode, node);
		}
		else if(location == 'last') {
			_appendChild(refNode, node);
		}
		else if(location == 'first') {
			_insertBefore(refNode, node, refNode.firstChild);
		}
		else if(location == 'before') {
			// TODO: throw if parent missing?
			_insertBefore(parent, node, refNode);
		}
		else if(location == 'after') {
			// TODO: throw if parent missing?
			if (refNode == parent.lastChild) {
				_appendChild(parent, node);
			}
			else {
				_insertBefore(parent, node, refNode.nextSibling);
			}
		}
		else {
			throw new Error('Unknown dom insertion command: ' + location);
		}

		return node;
	}

	// these are for better compressibility since compressors won't
	// compress native DOM methods.
	function _insertBefore(parent, node, refNode) {
		parent.insertBefore(node, refNode);
	}

	function _appendChild(parent, node) {
		parent.appendChild(node);
	}

	function isNode(it) {
		return typeof Node === "object"
			? it instanceof Node
			: it && typeof it === "object" && typeof it.nodeType === "number" && typeof it.nodeName==="string";
	}

	function NodeProxy() {}

	NodeProxy.prototype = {
		get: function (name) {
			var node = this.target;

			if (name in node) {
				return node[name];
			}
			else {
				return node.getAttribute(name);
			}
		},

		set: function (name, value) {
			var node = this.target;

			if (name in node) {
				return node[name] = value;
			}
			else {
				return node.setAttribute(name, value);
			}
		},

		invoke: function (method, args) {
			return nodeProxyInvoke(this.target, method, args);
		},

		destroy: function () {
			var node = this.target;

			// if we added a destroy method on the node, call it.
			// TODO: find a better way to release events instead of using this mechanism
			if (node.destroy) {
				node.destroy();
			}
			// removal from document will destroy node as soon as all
			// references to it go out of scope.
			var parent = node.parentNode;
			if (parent) {
				parent.removeChild(node);
			}
		},

		clone: function (options) {
			if (!options) {
				options = {};
			}
			// default is to clone deep (when would anybody not want deep?)
			return this.target.cloneNode(!('deep' in options) || options.deep);
		}
	};

	proxyNode.priority = priority.basePriority;
	function proxyNode (proxy) {

		if (!isNode(proxy.target)) {
			return proxy;
		}

		return WireProxy.extend(proxy, NodeProxy.prototype);
	}

	return {

		byId: byId,
		querySelector: query,
		querySelectorAll: queryAll,
		placeAt: placeAt,
		addClass: addClass,
		removeClass: removeClass,
		toggleClass: toggleClass,
		proxyNode: proxyNode

	};

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(require); }
));

;define('app/tabs/structure.css', ['curl/plugin/style', 'require'], function (injector, require) { var text = ".tabs {\n    position: relative;\n    padding: 0;\n    margin: 0;\n    line-height: 1;\n}\n\n.tabs .item {\n    display: inline-block;\n    list-style-type: none;\n}\n\n.stack {\n    height: 100%;\n    position: relative;\n    padding: 0;\n    margin: 0;\n    clear: both;\n}\n\n.stack .item {\n    display: none;\n    list-style-type: none;\n    position: relative;\n    left: 0;\n    top: 0;\n    right: 0;\n}\n\n.stack .item.active {\n    display: block;\n}"; if (0) text = injector.translateUrls(text, require.toUrl("")); return text; });
define('curl/plugin/css!app/tabs/structure.css', ['curl/plugin/style!app/tabs/structure.css'], function (sheet) { return sheet; });

;
/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 */

(function(define){ 'use strict';
	define('wire/lib/WireContext', ['require', 'wire/lib/object'], function (require, $cram_r0) {

		var object, undef;

		object = $cram_r0;

		function WireContext() {}

		WireContext.inherit = function(parent, api) {
			var contextApi, context;

			contextApi = object.inherit(parent);
			object.mixin(contextApi, api);

			WireContext.prototype = contextApi;

			context = new WireContext();
			WireContext.prototype = undef;

			return context;
		};

		return WireContext;

	});
}(typeof define === 'function' ? define : function(factory) { module.exports = factory(require); }));

;define('contacts/app/edit/structure.css', ['curl/plugin/style', 'require'], function (injector, require) { var text = ".edit-contact-view {\n\tpadding: 0;\n\tposition: absolute;\n\tright: 0;\n\theight: 100%;\n\twidth: 70%;\n}\n\n.edit-contact-view fieldset {\n\tmargin: .5em 1em;\n}\n\n.edit-contact-view label {\n\tdisplay: block;\n\twidth: 100%;\n}\n\n.edit-contact-view label span {\n    display: inline-block;\n    padding: 0 2px;\n    width: 7em;\n}\n\n.edit-contact-view input[type=\"text\"] {\n\twidth: 8em;\n}\n\n.edit-contact-view input[name=\"id\"] {\n    display: none;\n}\n\n.edit-contact-view .controls {\n    position: absolute;\n    bottom: 0;\n}\n"; if (0) text = injector.translateUrls(text, require.toUrl("")); return text; });
define('curl/plugin/css!contacts/app/edit/structure.css', ['curl/plugin/style!contacts/app/edit/structure.css'], function (sheet) { return sheet; });
/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * sequence.js
 *
 * Run a set of task functions in sequence.  All tasks will
 * receive the same args.
 *
 * @author brian@hovercraftstudios.com
 */

(function(define) {
define('when/sequence', ['require', 'when/when'], function (require, $cram_r0) {

	var when;

	when = $cram_r0;

	/**
	 * Run array of tasks in sequence with no overlap
	 * @param tasks {Array|Promise} array or promiseForArray of task functions
	 * @param [args] {*} arguments to be passed to all tasks
	 * @return {Promise} promise for an array containing
	 * the result of each task in the array position corresponding
	 * to position of the task in the tasks array
	 */
	return function sequence(tasks /*, args... */) {
		var args = Array.prototype.slice.call(arguments, 1);
		return when.reduce(tasks, function(results, task) {
			return when(task.apply(null, args), function(result) {
				results.push(result);
				return results;
			});
		}, []);
	};

});
})(
	typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); }
	// Boilerplate for AMD and Node
);



;(function (define) {
define('cola/dom/bindingHandler', ['require', 'cola/dom/guess', 'cola/dom/form'], function (require, $cram_r0, $cram_r1) {
"use strict";

	var slice, guess, form;

	slice = Array.prototype.slice;
	guess = $cram_r0;
	form = $cram_r1;

	defaultNodeHandler.inverse = defaultInverseNodeHandler;

	/*
	TODO: inverse bind handler:
	V create "on!" wire reference resolver
	2. look for inverse property in spec that acts as an each.inverse
	3. look for inverse on "each" handler
	4. provide an inverse function for our defaultNodeHandler
	5. use guess.js to guess events
	 */

	/*
	bind: {
		to: { $ref: 'colaThing' },
		map: {
			prop1: [
				{ selector: 'input.my' , attr: 'value' },
				{ selector: 'a selector', handler: { $ref: 'someFunction' } },
				{ selector: '.selector', attr: 'text', handler: { $ref: 'aNodeHandlerFunction' } }
				{
					selector: '.many',
					attr: 'text',
					each: { $ref: 'aNodeHandlerFunction' },
					all: { $ref: 'aNodeListHandlerFunction' }
				}
			]
		}
	}

	function aNodeHandlerFunction (node, data, info, doDefault) {
		var selector, attr, data, prop;
		selector = info.selector;
		attr = info.attr;
		prop = info.prop;
		doDefault(node, info);
	}

	function aNodeListHandlerFunction (nodes, data, info, doDefault) {
		var selector, attr, data, prop;
		selector = info.selector;
		attr = info.attr;
		prop = info.prop;
		nodes.forEach(function (node) {
			doDefault(node, info);
		});
	}

	*/

	/**
	 *
	 * @param rootNode {HTMLElement} the node at which to base the
	 *   nodeFinder searches
	 * @param options {Object}
	 * @param options.nodeFinder {Function} querySelector, querySelectorAll, or
	 *   another function that returns HTML elements given a string and a DOM
	 *   node to search from: function (string, root) { return nodeOrList; }
	 * @return {Function} the returned function creates a binding handler
	 *   for a given binding. it is assumed that the binding has been
	 *   normalized. function (binding, prop) { return handler; }
	 */
	return function configureHandlerCreator (rootNode, options) {
		var nodeFinder, eventBinder;

		nodeFinder = options.nodeFinder || options.querySelectorAll || options.querySelector;
		eventBinder = options.on;

		if(!nodeFinder) throw new Error('bindingHandler: options.nodeFinder must be provided');

		nodeFinder = createSafeNodeFinder(nodeFinder);

		return function createBindingHandler (binding, prop) {
			var bindingsAsArray, unlisteners, currItem;

			bindingsAsArray = normalizeBindings(binding, prop);
			unlisteners = addEventListeners();

			function handler (item) {

				currItem = item;

				bindingsAsArray.forEach(function (binding) {
					var each, all, nodes;

					each = binding.each;
					all = binding.all;

					// get all affected nodes
					nodes = nodeFinder(binding.selector, rootNode);

					// run handler for entire nodelist, if any
					if (all) all(nodes, item, binding, defaultNodeListHandler);

					// run custom or default handler for each node
					nodes.forEach(function (node) {
						each(node, item, binding, defaultNodeHandler);
					});

				});

			}

			handler.unlisten = unlistenAll;

			return handler;

			function unlistenAll () {
				unlisteners.forEach(function (unlisten) {
					unlisten();
				});
			}

			function addEventListeners () {
				return bindingsAsArray.reduce(function (unlisteners, binding) {
					var inverse, events;
					function doInverse (e) {
						inverse.call(this, currItem, e);
					}
					// grab some nodes to use to guess events to watch
					events = guess.eventsForNode(nodeFinder(binding.selector, rootNode));
					if (events.length > 0) {
						inverse = createInverseHandler(binding, handler);
						events.forEach(function (event) {
							unlisteners.push(eventBinder(rootNode, event, doInverse, binding.selector));
						});
					}
					return unlisteners;
				}, []);
			}

		};

	};

	function normalizeBindings (binding, defaultProp) {
		var normalized;

		normalized = [].concat(binding);

		return normalized.map(function (binding) {
			var norm;

			if (typeof binding == 'string') {
				norm = { selector: binding };
			} else {
				norm = Object.create(binding);
			}

			norm.each = binding.each || binding.handler || defaultNodeHandler;
			if (!norm.prop) norm.prop = defaultProp;
			return norm;
		});
	}

	function defaultNodeListHandler (nodes, data, info) {
		nodes.forEach(function (node) {
			defaultNodeHandler(node, data, info);
		})
	}

	function defaultNodeHandler (node, data, info) {
		var attr, value, current;
		if(node.form) {
			form.setValues(node.form, data, function(_, name) {
				return name === info.prop;
			});
		} else {
			attr = info.attr || guess.propForNode(node);
			value = data[info.prop];
			// always compare first to try to prevent unnecessary IE reflow/repaint
			current = guess.getNodePropOrAttr(node, attr);
			if (current !== value) {
				guess.setNodePropOrAttr(node, attr, value);
			}
		}
	}

	function defaultInverseNodeHandler (node, data, info) {
		var attr, value;

		if(node.form) {
			value = form.getValues(node.form, function(el) {
				return el === node || el.name === node.name;
			});
			data[info.prop] = value[info.prop];
		} else {
			attr = info.attr || guess.propForNode(node);
			data[info.prop] = guess.getNodePropOrAttr(node, attr);
		}
	}

	function createInverseHandler (binding, propToDom) {
		var domToProp = binding.inverse || binding.each.inverse;
		return function (item, e) {
			var node = e.target;
			// update item
			if (item) domToProp(node, item, binding);
			// is there any other way to know which binding.each/binding.all to execute?
			propToDom(item);
		}
	}

	function createSafeNodeFinder (nodeFinder) {
		return function (selector, rootNode) {
			if (!selector) return [rootNode];
			else return toArray(nodeFinder.apply(this, arguments));
		}
	}

	function toArray (any) {
		if (!any) return []; // nothin
		else if (Array.isArray(any)) return any; // array
		else if (any.length) return slice.call(any); // nodelist
		else return [any]; // single node
	}

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(require); }
));

;
/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * wire/dom/render plugin
 * wire plugin that provides a factory for dom nodes via a simple html
 * template.
 *
 * wire is part of the cujo.js family of libraries (http://cujojs.com/)
 *
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 */

define('wire/dom/render', ['wire/lib/dom/base', 'when/when'], function (base, when) {

	var parentTypes, parseTemplateRx, getFirstTagNameRx, isPlainTagNameRx,
		pluginInstance, undef;

	// elements that could be used as root nodes and their natural parent type
	parentTypes = {
		'li': 'ul',
		'td': 'tr',
		'tr': 'tbody',
		'tbody': 'table',
		'thead': 'table',
		'tfoot': 'table',
		'caption': 'table',
		'col': 'table',
		'colgroup': 'table',
		'option': 'select'
	};

	parseTemplateRx = /\$\{([^}]*)\}/g;
	getFirstTagNameRx = /<\s*(\w+)/;
	isPlainTagNameRx = /^[A-Za-z]\w*$/;

	/**
	 * Constructs a DOM node and child nodes from a template string.
	 * Information contained in a hashmap is merged into the template
	 * via tokens (${name}) before rendering into DOM nodes.
	 * Nothing is done with the css parameter at this time.
	 * @param template {String} html template
	 * @param hashmap {Object} string replacements hash
	 * @param optRefNode {HTMLElement} node to replace with root node of rendered template
	 * @returns {HTMLElement}
	 */
	function render (template, hashmap, optRefNode /*, optCss */) {
		var node;

		// replace tokens (before attempting to find top tag name)
		template = replaceTokens('' + template, hashmap);

		if (isPlainTagNameRx.test(template)) {
			// just 'div' or 'a' or 'tr', for example
			node = document.createElement(template);
		}
		else {
			// create node from template
			node = createElementFromTemplate(template);
		}

		if (optRefNode) {
			node = safeReplaceElement(node, optRefNode);
		}

		return node;
	}

	pluginInstance = {
		factories: {
			render: domRenderFactory
		},
		proxies: [
			base.proxyNode
		]
	};

	render.wire$plugin = function (/* options */) {
		return pluginInstance;
	};

	/**
	 * Finds the first html element in a string, extracts its tag name,
	 * and looks up the natural parent element tag name for this element.
	 * @private
	 * @param template {String}
	 * @returns {String} the parent tag name, or 'div' if none was found.
	 */
	function getParentTagName (template) {
		var matches;

		// TODO: throw if no element was ever found?
		matches = template.match(getFirstTagNameRx);

		return parentTypes[matches && matches[1]] || 'div';
	}

	/**
	 * Creates an element from a text template.  This function does not
	 * support multiple elements in a template.  Leading and trailing
	 * text and/or comments are also ignored.
	 * @private
	 * @param template {String}
	 * @returns {HTMLElement} the element created from the template
	 */
	function createElementFromTemplate (template) {
		var parentTagName, parent, first, child;

		parentTagName = getParentTagName(template);
		parent = document.createElement(parentTagName);
		parent.innerHTML = template;

		// we just want to return first element (nodelists and fragments
		// are tricky), so we loop through all top-level children to ensure
		// we only have one.

		// try html5-ish API
		first = parent.firstElementChild;
		child = parent.lastElementChild;

		// old dom API
		if (!first) {
			child = parent.firstChild;
			while (child) {
				if (child.nodeType == 1 && !first) {
					first = child;
				}
				child = child.nextSibling;
			}
		}

		if (first != child) {
			throw new Error('render: only one element per template is supported.');
		}

		return first;
	}

	/**
	 * Creates rendered dom trees for the "render" factory.
	 * @param resolver
	 * @param componentDef
	 * @param wire
	 */
	function domRenderFactory (resolver, componentDef, wire) {
		when(wire(componentDef.options), function (options) {
			var template;
			template = options.template || options;
			return render(template, options.replace, options.at, options.css);
		}).then(resolver.resolve, resolver.reject);
	}

	/**
	 * Replaces a dom node, while preserving important attributes
	 * of the original.
	 * @private
	 * @param oldNode {HTMLElement}
	 * @param newNode {HTMLElement}
	 * @returns {HTMLElement} newNode
	 */
	function safeReplaceElement (newNode, oldNode) {
		var i, attr, parent;

		for (i = 0; i < oldNode.attributes.length; i++) {
			attr = oldNode.attributes[i];
			if ('class' == attr.name) {
				// merge css classes
				// TODO: if we want to be smart about not duplicating classes, implement spliceClassNames from cola/dom/render
				newNode.className = (oldNode.className ? oldNode.className + ' ' : '')
					+ newNode.className;
			}
			// Note: IE6&7 don't support node.hasAttribute() so we're using node.attributes
			else if (!newNode.attributes[attr.name]) {
				newNode.setAttribute(attr.name, oldNode.getAttribute(attr.name));
			}
		}
		parent = oldNode.parentNode;
		if (parent) {
			parent.replaceChild(newNode, oldNode);
		}
		return newNode;
	}

	/**
	 * Replaces simple tokens in a string.  Tokens are in the format ${key}.
	 * Tokens are replaced by values looked up in an associated hashmap.
	 * If a token's key is not found in the hashmap, an empty string is
	 * inserted instead.
	 * @private
	 * @param template
	 * @param hashmap {Object} the names of the properties of this object
	 * are used as keys. The values replace the token in the string.
	 * @param [missing] {Function} callback that deals with missing properties
	 * @returns {String}
	 */
	function replaceTokens (template, hashmap, missing) {
		if (!hashmap) {
			return template;
		}
		
		if (!missing) {
			missing = blankIfMissing;
		}
		
		return template.replace(parseTemplateRx, function (m, token) {
			return missing(findProperty(hashmap, token));
		});
	}

	function findProperty (obj, propPath) {
		var props, prop;
		props = propPath.split('.');
		while (obj && (prop = props.shift())) {
			obj = obj[prop];
		}
		return obj;
	}

	function blankIfMissing (val) { return val == undef ? '' : val; }

	return render;

});

;define('contacts/app/list/structure.css', ['curl/plugin/style', 'require'], function (injector, require) { var text = ".contact-list-view {\n\tposition: absolute;\n\theight: 100%;\n\twidth: 30%;\n    margin: 0;\n    padding: 0;\n}\n\n.contact-list-view .contact {\n    padding: .25em;\n\tlist-style: none;\n}\n\n.contact-list-view {\n\toverflow-y: auto;\n}\n\n.contact-list-view .remove {\n    color: #aaa;\n    opacity: 0;\n}\n\n.contact-list-view .contact:hover .remove {\n    opacity: 1;\n}"; if (0) text = injector.translateUrls(text, require.toUrl("")); return text; });
define('curl/plugin/css!contacts/app/list/structure.css', ['curl/plugin/style!contacts/app/list/structure.css'], function (sheet) { return sheet; });
/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * functional
 * Helper library for working with pure functions in wire and wire plugins
 *
 * NOTE: This lib assumes Function.prototype.bind is available
 *
 * wire is part of the cujo.js family of libraries (http://cujojs.com/)
 *
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 */
(function (define) { 'use strict';
define('wire/lib/functional', ['require', 'when/when'], function (require, $cram_r0) {

	var when, slice;

	when = $cram_r0;
	slice = [].slice;

	/**
	 * Create a partial function
	 * @param f {Function}
	 * @param [args] {*} additional arguments will be bound to the returned partial
	 * @return {Function}
	 */
	function partial(f, args/*...*/) {
		// What we want here is to allow the partial function to be called in
		// any context, by attaching it to an object, or using partialed.call/apply
		// That's why we're not using Function.bind() here.  It has no way to bind
		// arguments but allow the context to default.  In other words, you MUST bind
		// the the context to something with Function.bind().

		// Optimization: return f if no args provided
		if(arguments.length == 1) {
			return f;
		}

		args = slice.call(arguments, 1);

		return function() {
			return f.apply(this, args.concat(slice.call(arguments)));
		};
	}

	/**
	 * Compose functions
	 * @param funcs {Array} array of functions to compose
	 * @return {Function} composed function
	 */
	function compose(funcs) {

		var first;
		first = funcs[0];
		funcs = funcs.slice(1);

		return function composed() {
			var context = this;
			return funcs.reduce(function(result, f) {
				return conditionalWhen(result, function(result) {
					return f.call(context, result);
				});
			}, first.apply(this, arguments));
		};
	}

	/**
	 * Parses the function composition string, resolving references as needed, and
	 * composes a function from the resolved refs.
	 * @param proxy {Object} wire proxy on which to invoke the final method of the composition
	 * @param composeString {String} function composition string
	 *  of the form: 'transform1 | transform2 | ... | methodOnProxyTarget"
	 *  @param {function} wire
	 * @param {function} wire.resolveRef function to use is resolving references, returns a promise
	 * @param {function} wire.getProxy function used to obtain a proxy for a component
	 * @return {Promise} a promise for the composed function
	 */
	compose.parse = function parseCompose(proxy, composeString, wire) {

		var bindSpecs, resolveRef, getProxy;

		if(typeof composeString != 'string') {
			return wire(composeString).then(function(func) {
				return createProxyInvoker(proxy, func);
			});
		}

		bindSpecs = composeString.split(/\s*\|\s*/);
		resolveRef = wire.resolveRef;
		getProxy = wire.getProxy;

		function createProxyInvoker(proxy, method) {
			return function() {
				return proxy.invoke(method, arguments);
			};
		}

		function createBound(proxy, bindSpec) {
			var target, method;

			target = bindSpec.split('.');

			if(target.length > 2) {
				throw new Error('Only 1 "." is allowed in refs: ' + bindSpec);
			}

			if(target.length > 1) {
				method = target[1];
				target = target[0];
				if(!target) {
					return function(target) {
						return target[method].apply(target, slice.call(arguments, 1));
					};
				}
				return when(getProxy(target), function(proxy) {
					return createProxyInvoker(proxy, method);
				});
			} else {
				if(proxy && typeof proxy.get(bindSpec) == 'function') {
					return createProxyInvoker(proxy, bindSpec);
				} else {
					return resolveRef(bindSpec);
				}
			}

		}

		// First, resolve each transform function, stuffing it into an array
		// The result of this reduce will an array of concrete functions
		// Then add the final context[method] to the array of funcs and
		// return the composition.
		return when.reduce(bindSpecs, function(funcs, bindSpec) {
			return when(createBound(proxy, bindSpec), function(func) {
				funcs.push(func);
				return funcs;
			});
		}, []).then(
			function(funcs) {
				var context = proxy && proxy.target;
				return (funcs.length == 1 ? funcs[0] : compose(funcs)).bind(context);
			}
		);
	};

	function conditionalWhen(promiseOrValue, onFulfill, onReject) {
		return when.isPromise(promiseOrValue)
			? when(promiseOrValue, onFulfill, onReject)
			: onFulfill(promiseOrValue);
	}

	return {
		compose: compose,
		partial: partial
	};

});
})(typeof define == 'function'
	// AMD
	? define
	// CommonJS
	: function(factory) { module.exports = factory(require); }
);
/** MIT License (c) copyright B Cavalier & J Hann */


(function (define) {
define('cola/dom/adapter/Node', ['require', 'cola/dom/bindingHandler', 'cola/dom/guess'], function (require, $cram_r0, $cram_r1) {
"use strict";

	var bindingHandler, guess;

	bindingHandler = $cram_r0;
	guess = $cram_r1;

	/**
	 * Creates a cola adapter for interacting with dom nodes.  Be sure to
	 * unwatch any watches to prevent memory leaks in Internet Explorer 6-8.
	 * @constructor
	 * @param rootNode {Node}
	 * @param options {Object}
	 */
	function NodeAdapter (rootNode, options) {

		this._rootNode = rootNode;

		// set options
		options.bindings = guessBindingsFromDom(this._rootNode, options);

		this._options = options;
		this._handlers = {};

		this._createItemToDomHandlers(options.bindings);
	}

	NodeAdapter.prototype = {

		getOptions: function () {
			return this._options;
		},

		set: function (item) {
			this._item = item;
			this._itemToDom(item, this._handlers);
		},

		update: function (item) {
			this._item = item;
			this._itemToDom(item, item);
		},

		destroy: function () {
			this._handlers.forEach(function (handler) {
				if (handler.unlisten) handler.unlisten();
			});
		},

		properties: function(lambda) {
			lambda(this._item);
		},

		_itemToDom: function (item, hash) {
			var p, handler;
			for (p in hash) {
				handler = this._handlers[p];
				if (handler) handler(item);
			}
		},

		_createItemToDomHandlers: function (bindings) {
			var creator;

			creator = bindingHandler(this._rootNode, this._options);

			Object.keys(bindings).forEach(function (b) {
				this._handlers[b] = creator(bindings[b], b);
			}, this);
		}

	};

	/**
	 * Tests whether the given object is a candidate to be handled by
	 * this adapter. Returns true if this is a DOMNode (or looks like one).
	 * @param obj
	 * @returns {Boolean}
	 */
	NodeAdapter.canHandle = function (obj) {
		// crude test if an object is a node.
		return obj && obj.tagName && obj.getAttribute && obj.setAttribute;
	};

	return NodeAdapter;

	function guessBindingsFromDom(rootNode, options) {
		var nodeFinder, nodes, bindings;

		bindings = options.bindings || {};
		nodeFinder = options.nodeFinder || options.querySelectorAll || options.querySelector;

		nodes = nodeFinder('[name],[data-cola-binding]', rootNode);

		if(nodes) {
			Array.prototype.forEach.call(nodes, function(n) {
				var name, attr;

				attr = n.name ? 'name' : 'data-cola-binding';
				name = guess.getNodePropOrAttr(n, attr);
				if(name && !(name in bindings)) {
					bindings[name] = '[' + attr + '="' + name + '"]';
				}
			});
		}

		return bindings;
	}

});
}(
	typeof define == 'function'
		? define
		: function (factory) { module.exports = factory(require); }
));
/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * dom plugin helper
 *
 * wire is part of the cujo.js family of libraries (http://cujojs.com/)
 *
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 */
define('wire/lib/plugin-base/dom', ['wire/domReady', 'when/when', 'wire/lib/dom/base', 'wire/lib/object'], function (domReady, when, base, object) {

	function getElementFactory (resolver, componentDef, wire) {
		when(wire(componentDef.options), function (element) {

			if (!element || !element.nodeType || !element.tagName) {
				throw new Error('dom: non-element reference provided to element factory');
			}

			return element;
		}).then(resolver.resolve, resolver.reject);
	}

	return function createDomPlugin(options) {

		var getById, query, first, addClass, removeClass, placeAt,
			doById, doPlaceAt, resolveQuery;

		getById = options.byId || base.byId;
		query = options.query || base.querySelectorAll;
		first = options.first || base.querySelector;
		addClass = options.addClass;
		placeAt = options.placeAt || base.placeAt;
		removeClass = options.removeClass;

		function doByIdImpl(resolver, name) {
			var node;

			// if dev omitted name, they're looking for the resolver itself
			if (!name) {
				return resolver.resolve(getById);
			}

			node = getById(name);
			if (node) {
				resolver.resolve(node);
			} else {
				resolver.reject(new Error("No DOM node with id: " + name));
			}
		}

		doById = function(resolver, name /*, refObj, wire*/) {
			domReady(function() {
				doById = doByIdImpl;
				doByIdImpl(resolver, name);
			});
		};

		function doQuery(name, refObj, root, queryFunc) {
			var result, i;

			result = queryFunc(name, root);

			// if dev supplied i, try to use it
			if (typeof refObj.i != 'undefined') {
				i = refObj.i;
				if (result[i]) { // do not use `i in result` since IE gives a false positive
					return result[i];
				} else {
					throw new Error("Query '" + name + "' did not find an item at position " + i);
				}
			} else if (queryFunc == first && !result) {
				throw new Error("Query '" + name + "' did not find anything");
			} else {
				return result;
			}
		}

		function doPlaceAtImpl(resolver, facet, wire) {
			var futureRefNode, node, options, operation;

			options = facet.options;
			node = facet.target;

			// get first property and use it as the operation
			for (var p in options) {
				if (object.hasOwn(options, p)) {
					operation = p;
					break;
				}
			}

			futureRefNode = wire(makeQueryRef(options[operation]));

			when(futureRefNode, function (refNode) {
				return placeAt(node, refNode, operation);
			}).then(resolver.resolve, resolver.reject);
		}

		doPlaceAt = function(resolver, facet, wire) {
			domReady(function() {
				doPlaceAt = doPlaceAtImpl;
				doPlaceAtImpl(resolver, facet, wire);
			});
		};

		function resolveQueryImpl(resolver, name, refObj, wire, queryFunc) {
			var futureRoot;

			if (!queryFunc) {
				queryFunc = query;
			}

			// if dev omitted name, they're looking for the resolver itself
			if (!name) {
				return resolver.resolve(queryFunc);
			}

			// get string ref or object ref
			if (refObj.at && !refObj.isRoot) {
				futureRoot = wire(makeQueryRoot(refObj.at));
			}

			// sizzle will default to document if refObj.at is unspecified
			when(futureRoot, function (root) {
				return doQuery(name, refObj, root, queryFunc);
			}).then(resolver.resolve, resolver.reject);
		}

		/**
		 *
		 * @param resolver {Resolver} resolver to notify when the ref has been resolved
		 * @param name {String} the dom query
		 * @param refObj {Object} the full reference object, including options
		 * @param wire {Function} wire()
		 * @param [queryFunc] {Function} the function to use to query the dom
		 */
		resolveQuery = function(resolver, name, refObj, wire, queryFunc) {

			domReady(function() {
				resolveQuery = resolveQueryImpl;
				resolveQueryImpl(resolver, name, refObj, wire, queryFunc);
			});

		};

		/**
		 * dom.first! resolver.
		 *
		 * @param resolver {Resolver} resolver to notify when the ref has been resolved
		 * @param name {String} the dom query
		 * @param refObj {Object} the full reference object, including options
		 * @param wire {Function} wire()
		 */
		function resolveFirst(resolver, name, refObj, wire) {
			resolveQuery(resolver, name, refObj, wire, first);
		}

		function makeQueryRoot(ref) {

			var root = makeQueryRef(ref);

			if(root) {
				root.isRoot = true;
			}

			return root;
		}

		function makeQueryRef(ref) {
			return typeof ref == 'string' ? { $ref: ref } : ref;
		}

		function createResolver(resolverFunc, options) {
			return function(resolver, name, refObj, wire) {
				if(!refObj.at) {
					refObj.at = options.at;
				} else {
					refObj.at = makeQueryRoot(refObj.at);
				}

				return resolverFunc(resolver, name, refObj, wire);
			};
		}

		function handleClasses(node, add, remove) {
			if(add) {
				addClass(node, add);
			}

			if(remove) {
				removeClass(node, remove);
			}
		}

		/**
		 * DOM plugin factory
		 */
		return function(options) {
			var classes, resolvers, facets, factories, context, htmlElement;

			options.at = makeQueryRoot(options.at);
			classes = options.classes;
			context = {};

			if(classes) {
				domReady(function() {
					htmlElement = document.getElementsByTagName('html')[0];
				});

				context.initialize = function (resolver) {
					domReady(function () {
						handleClasses(htmlElement, classes.init);
						resolver.resolve();
					});
				};
				context.ready = function (resolver) {
					domReady(function () {
						handleClasses(htmlElement, classes.ready, classes.init);
						resolver.resolve();
					});
				};
				if(classes.ready) {
					context.destroy = function (resolver) {
						domReady(function () {
							handleClasses(htmlElement, null, classes.ready);
							resolver.resolve();
						});
					};
				}
			}

			factories = {
				element: getElementFactory
			};

			facets = {
				insert: {
					initialize: doPlaceAt
				}
			};

			resolvers = {};
			// id and dom are synonyms
			// dom is deprecated and for backward compat only
			resolvers.id = resolvers.dom = doById;

			if (query) {
				// dom.first is deprecated
				resolvers.first = createResolver(resolveFirst, options);
				resolvers['dom.first'] = function() {
					// TODO: Deprecation warning
					resolvers.first.apply(resolvers, arguments);
				};

				// all and query are synonyms
				resolvers.all = resolvers.query = createResolver(resolveQuery, options);
				resolvers['dom.all'] = resolvers['dom.query'] = function() {
					// TODO: Deprecation warning
					resolvers.query.apply(resolvers, arguments);
				};
			}

			return {
				context: context,
				resolvers: resolvers,
				facets: facets,
				factories: factories,
				proxies: [
					base.proxyNode
				]
			};

		};
	};
});

;define('contacts/theme/basic.css', ['curl/plugin/style', 'require'], function (injector, require) { var text = ".cujo-contacts fieldset {\n\tborder: none;\n}\n\n.cujo-contacts input[type=\"text\"] {\n    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;\n    font-size: 1em;\n    margin: .5em 0 1em 0;\n}\n\n::-webkit-input-placeholder {\n    color: #acacac;\n}\n:-moz-placeholder {\n    color: #acacac;\n}\n::-moz-placeholder {\n    color: #acacac;\n}\n:-ms-input-placeholder {\n    color: #acacac;\n}\n\n.cujo-contacts label {\n    color: #acacac;\n    font-weight: normal;\n}\n\n.cujo-contacts {\n\twidth: auto;\n    margin: 0 auto;\n\toverflow: visible;\n}\n\n.cujo-contacts  .contacts-view-container {\n\tposition: relative;\n\theight: 100%;\n\twidth: auto;\n\tmin-height: 400px;\n\toverflow: hidden;\n\tclear: both;\n}\n\n.cujo-contacts .contact-list-view {\n    background-color: #fafafa;\n    cursor: pointer;\n}\n"; if (0) text = injector.translateUrls(text, require.toUrl("")); return text; });
define('curl/plugin/css!contacts/theme/basic.css', ['curl/plugin/style!contacts/theme/basic.css'], function (sheet) { return sheet; });
/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * Loading and merging modules
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author: brian@hovercraftstudios.com
 */
(function(define) { 'use strict';
define('wire/lib/loader', ['require', 'when/when', 'wire/lib/object'], function (require, $cram_r0, $cram_r1) {

	var when, mixin, wrapPlatformLoader;

	when = $cram_r0;
	mixin = $cram_r1.mixin;

	// Get the platform's loader
	wrapPlatformLoader = typeof exports == 'object'
		? function(require) {
			return function(moduleId) {
				try {
					return when.resolve(require(moduleId));
				} catch(e) {
					return when.reject(e);
				}
			};
		}
		: function (require) {
			return function(moduleId) {
				var deferred = when.defer();
				require([moduleId], deferred.resolve, deferred.reject);
				return deferred.promise;
			};
		};

	return getModuleLoader;

	/**
	 * Create a module loader
	 * @param {function} [platformLoader] platform require function with which
	 *  to configure the module loader
	 * @param {function} [parentLoader] existing module loader from which
	 *  the new module loader will inherit, if provided.
	 * @return {Object} module loader with load() and merge() methods
	 */
	function getModuleLoader(platformLoader, parentLoader) {
		var loadModule = typeof platformLoader == 'function'
			? wrapPlatformLoader(platformLoader)
			: parentLoader || wrapPlatformLoader(require);

		return {
			load: loadModule,
			merge: function(specs) {
				return when(specs, function(specs) {
					return when.resolve(Array.isArray(specs)
						? mergeAll(specs, loadModule)
						: (typeof specs === 'string' ? loadModule(specs) : specs));
				});
			}
		};
	}

	function mergeAll(specs, loadModule) {
		return when.reduce(specs, function(merged, module) {
			return typeof module == 'string'
				? when(loadModule(module), function(spec) { return mixin(merged, spec); })
				: mixin(merged, module);
		}, {});
	}

});
}(typeof define === 'function' ? define : function(factory) { module.exports = factory(require); }));


;(function (define) {
define('cola/dom/adapter/NodeList', ['require', 'cola/SortedMap', 'cola/dom/classList', 'cola/dom/adapter/Node'], function (require, $cram_r0, $cram_r1, $cram_r2) {
"use strict";

	var SortedMap, classList, NodeAdapter,
		defaultIdAttribute, defaultTemplateSelector, listElementsSelector,
		colaListBindingStates, allBindingStates, undef;

	SortedMap = $cram_r0;
	classList = $cram_r1;
	NodeAdapter = $cram_r2;

	defaultTemplateSelector = '[data-cola-role="item-template"]';
	defaultIdAttribute = 'data-cola-id';
	listElementsSelector = 'tr,li';

	colaListBindingStates = {
		empty: 'cola-list-empty',
		bound: 'cola-list-bound',
		unbound: 'cola-list-unbound'
	};

	allBindingStates = Object.keys(colaListBindingStates).map(function(key) {
		return colaListBindingStates[key];
	}).join(' ');

	/**
	 * Manages a collection of dom trees that are synced with a data
	 * collection.
	 * @constructor
	 * @param rootNode {Node} node to serve as a template for items
	 * in the collection / list.
	 * @param {object} options
	 * @param options.comparator {Function} comparator function to use for
	 *  ordering nodes
	 * @param [options.containerNode] {Node} optional parent to all itemNodes. If
	 * omitted, the parent of rootNode is assumed to be containerNode.
	 * @param [options.querySelector] {Function} DOM query function
	 * @param [options.itemTemplateSelector] {String}
	 * @param [options.idAttribute] {String}
	 * @param [options.containerAttribute] {String}
	 */
	function NodeListAdapter (rootNode, options) {
		var container, self;

		if(!options) options = {};

		this._options = options;

		this.comparator = options.comparator;
		this.identifier = options.identifier;

		this._rootNode = rootNode;

		// 1. find templateNode
		this._templateNode = findTemplateNode(rootNode, options);

		// 2. get containerNode
		// TODO: should we get the container node just-in-time?
		container = options.containerNode || this._templateNode.parentNode;

		if (!container) {
			throw new Error('No container node found for NodeListAdapter.');
		}

		this._containerNode = container;

		this._initTemplateNode();

		// keep track of itemCount, so we can set the cola-list-XXX state
		this._itemCount = undef;
		this._checkBoundState();

		self = this;
		// list of sorted data items, nodes, and unwatch functions
		this._itemData = new SortedMap(
			function(item) {
				return self.identifier(item);
			},
			function (a, b) {
				return self.comparator(a, b);
			}
		);

		this._itemsById = {};

	}

	NodeListAdapter.prototype = {

		add: function (item) {
			var adapter, index;

			// create adapter
			adapter = this._createNodeAdapter(item);

			// add to map
			index = this._itemData.add(item, adapter);

			// figure out where to insert into dom
			if (index >= 0) {
				this._itemCount = (this._itemCount||0) + 1;
				// insert
				this._insertNodeAt(adapter._rootNode, index);
				this._checkBoundState();

				this._itemsById[this.identifier(item)] = item;
			}
		},

		remove: function (item) {
			var adapter, node;

			// grab node we're about to remove
			adapter = this._itemData.get(item);

			// remove item
			this._itemData.remove(item);

			if (adapter) {
				this._itemCount--;
				node = adapter._rootNode;
				// remove from dom
				node.parentNode.removeChild(node);
				this._checkBoundState();

				delete this._itemsById[this.identifier(item)];
			}
		},

		update: function (item) {
			var adapter, index, key;

			adapter = this._itemData.get(item);

			if (!adapter) {
				this.add(item);
			}
			else {
				this._updating = adapter;
				try {
					adapter.update(item);
					this._itemData.remove(item);
					index = this._itemData.add(item, adapter);

					key = this.identifier(item);
					this._itemsById[key] = item;

					this._insertNodeAt(adapter._rootNode, index);
				}
				finally {
					delete this._updating;
				}
			}

		},

		forEach: function (lambda) {
			this._itemData.forEach(lambda);
		},

		setComparator: function (comparator) {
			var i = 0, self = this;
			this.comparator = comparator;
			this._itemData.setComparator(comparator);
			this._itemData.forEach(function (adapter, item) {
				self._insertNodeAt(adapter._rootNode, i++);
			});
		},

		getOptions: function () {
			return this._options;
		},

		findItem: function (eventOrElement) {
			var node, idAttr, id;

			// using feature sniffing to detect if this is an event object
			// TODO: use instanceof HTMLElement where supported
			if (!(eventOrElement && eventOrElement.target && eventOrElement.stopPropagation && eventOrElement.preventDefault
				|| eventOrElement && eventOrElement.nodeName && eventOrElement.nodeType == 1))
				return; // not comments or text nodes

			// test for an event or an element (duck-typing by using
			// the same features we're sniffing below helps kill two birds...)
			node = eventOrElement.nodeType
				? eventOrElement
				: eventOrElement.target || eventOrElement.srcElement;

			if (!node) return;

			idAttr = this._options.idAttribute || defaultIdAttribute;

			// start at node and work up
			do id = node.getAttribute(idAttr);
			while (id == null && (node = node.parentNode) && node.nodeType == 1);

			return id != null && this._itemsById[id];
		},

		findNode: function (thing) {
			var item, data;

			if (!thing) return;

			// what is this thing?
			if (typeof thing == 'string' || typeof thing == 'number') {
				item = this._itemsById[thing];
			}
			else {
				// try this.get in case thing is an event or node
				// otherwise, assume it's a data item
				item = this.findItem(thing) || thing;
			}

			if (item != null) {
				// determine if this data item is ours
				data = this._itemData.get(item);
			}

			return data && data._rootNode;
		},

		/**
		 * Compares two data items.  Works just like the comparator function
		 * for Array.prototype.sort. This comparator is used to sort the
		 * items in the list.
		 * This property should be injected.  If not supplied, the list
		 * will rely on one assigned by cola.
		 * @param a {Object}
		 * @param b {Object}
		 * @returns {Number} -1, 0, 1
		 */
		comparator: undef,

		identifier: undef,

		destroy: function () {
			this._itemData.forEach(function (adapter) {
				adapter.destroy();
			});
		},

		_initTemplateNode: function () {
			var templateNode = this._templateNode;
			// remove from document
			if (templateNode.parentNode) {
				templateNode.parentNode.removeChild(templateNode);
			}
			// remove any styling to hide template node (ideally, devs
			// would use a css class for this, but whatevs)
			// css class: .cola-list-unbound .my-template-node { display: none }
			if (templateNode.style.display) {
				templateNode.style.display = '';
			}
			// remove id because we're going to duplicate
			if (templateNode.id) {
				templateNode.id = '';
			}
		},

		_createNodeAdapter: function (item) {
			var node, adapter, idAttr, origUpdate, self;

			// create NodeAdapter
			node = this._templateNode.cloneNode(true);
			adapter = new NodeAdapter(node, this._options);
			adapter.set(item);

			// label node for quick identification from events
			if (this.identifier) {
				idAttr = this._options.idAttribute || defaultIdAttribute;
				adapter._rootNode.setAttribute(idAttr, this.identifier(item));
			}

			// override update() method to call back
			origUpdate = adapter.update;
			self = this;
			adapter.update = function (item) {
				// update node(s) in NodeAdapter
				origUpdate.call(adapter, item);
				// cascade to us if we didn't initiate update()
				if (self._updating != adapter) {
					self.update(item);
				}
			};

			return adapter;
		},

		_insertNodeAt: function (node, index) {
			var parent, refNode;
			parent = this._containerNode;
			refNode = parent.childNodes[index];
			// Firefox cries when you try to insert before yourself
			// which can happen if we're moving into the same position.
			if (node != refNode) {
				parent.insertBefore(node, refNode);
			}
		},

		_checkBoundState: function () {
			var states, isBound, isEmpty;
			states = [];
			isBound = this._itemCount != null;
			isEmpty = this._itemCount == 0;

			if(!isBound) {
				states.push(colaListBindingStates.unbound);
			}

			if(isEmpty) {
				states.push(colaListBindingStates.empty);
			}

			if(isBound && !isEmpty) {
				states.push(colaListBindingStates.bound);
			}

			setBindingStates(states.join(' '), this._rootNode);
		}

	};

	NodeListAdapter.canHandle = function (obj) {
		// crude test if an object is a node.
		return obj && obj.tagName && obj.insertBefore && obj.removeChild;
	};

	function setBindingStates(states, node) {
		node.className = classList.addClass(states, classList.removeClass(allBindingStates, node.className));
	}

	function findTemplateNode (root, options) {
		var useBestGuess, node;

		// user gave no explicit instructions
		useBestGuess = !options.itemTemplateSelector;

		if (options.querySelector) {
			// if no selector, try default selector
			node = options.querySelector(options.itemTemplateSelector || defaultTemplateSelector, root);
			// if still not found, search around for a list element
			if (!node && useBestGuess) {
				node = options.querySelector(listElementsSelector, root);
			}
		}
		if (!node && useBestGuess) {
			node = root.firstChild;
		}
		// if still not found, throw
		if (!node) {
			throw new Error('NodeListAdapter: could not find itemTemplate node');
		}
		return node;
	}

	return NodeListAdapter;

});
}(
	typeof define == 'function'
		? define
		: function (factory) { module.exports = factory(require); }
));
/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * wire/dom plugin
 * wire plugin that provides a resource resolver for dom nodes, by id, in the
 * current page.  This allows easy wiring of page-specific dom references into
 * generic components that may be page-independent, i.e. makes it easier to write
 * components that can be used on multiple pages, but still require a reference
 * to one or more nodes on the page.
 *
 * wire is part of the cujo.js family of libraries (http://cujojs.com/)
 *
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 */

define('wire/dom', ['wire/lib/plugin-base/dom', 'wire/lib/dom/base'], function (createDomPlugin, base) {

	return createDomPlugin({
		addClass: base.addClass,
		removeClass: base.removeClass
	});

});
/**
 * eventQueue
 * @author: brian
 */
(function(define) {
define('cola/hub/eventProcessor', ['require', 'when/when', 'cola/enqueue'], function (require, $cram_r0, $cram_r1) {

	var when, enqueue;

	when = $cram_r0;
	enqueue = $cram_r1;

	return {

		makeBeforeEventName: function (name) {
			return makeEventName('before', name);
		},

		makeEventName: function(name) {
			return makeEventName('on', name);
		},

		/**
		 * Queue an event for processing later
		 * @param source
		 * @param data
		 * @param type
		 */
		queueEvent: function (source, data, type) {
			// if queue length is zero, we need to start processing it again
			var queueNeedsRestart = this.queue.length == 0;

			// enqueue event
			this.queue.push({ source: source, data: data, type: type });

			// start processing, if necessary
			return queueNeedsRestart && this._dispatchNextEvent();
		},

		/**
		 * Process an event immediately
		 * @param source
		 * @param data
		 * @param type
		 */
		processEvent: function(source, data, type) {
			var self = this;

			this.inflight = when(this.inflight).always(function() {
				return self.eventProcessor(source, data, type);
			});

			return this.inflight;
		},

		_dispatchNextEvent: function () {
			var event, remaining, deferred, self;

			self = this;

			// get the next event, if any
			event = this.queue.shift();
			remaining = this.queue.length;

			// Ensure resolution is next turn, even if no event
			// is actually dispatched.
			deferred = when.defer();
			enqueue(function () {
				var inflight = event && self.processEvent(event.source, event.data, event.type);
				deferred.resolve(inflight);
			});

			// Only continue processing the queue if it's not empty
			if(remaining) {
				deferred.promise.always(function() {
					self._dispatchNextEvent();
				});
			}

			return deferred.promise;

		}
	};

	function makeEventName (prefix, name) {
		return prefix + name.charAt(0).toUpperCase() + name.substr(1);
	}

});
}(typeof define === 'function' ? define : function(factory) { module.exports = factory(require); }));
/** MIT License (c) copyright B Cavalier & J Hann */

(function(define) {
define('cola/adapter/Query', ['require', 'when/when', 'cola/SortedMap'], function (require, $cram_r0, $cram_r1) {

//	"use strict";

	var when, SortedMap, undef;

	when = $cram_r0;
	SortedMap = $cram_r1;

	/**
	 * Manages a collection of objects taken a queryable data source, which
	 * must provide query, add, and remove methods
	 * @constructor
	 * @param datasource {Object} queryable data source with query, add, put, remove methods
	 * @param [options.comparator] {Function} comparator function that will
	 * be propagated to other adapters as needed.  Note that QueryAdapter does not
	 * use this comparator internally.
	 */
	function QueryAdapter(datasource, options) {

		var identifier, dsQuery, self;

		if(!datasource) throw new Error('cola/QueryAdapter: datasource must be provided');

		this._datasource = datasource;

		if(!options) options = {};

		this._options = options;

		if('provide' in options) {
			this.provide = options.provide;
		}

		// Always use the datasource's identity as the identifier
		identifier = this.identifier =
			function(item) {
				// TODO: remove dojo-specific behavior
				return datasource.getIdentity(item);
			};

		// If no comparator provided, generate one that uses
		// the object identity
		this.comparator = this._options.comparator ||
			function(a, b) {
				var aKey, bKey;

				aKey = identifier(a);
				bKey = identifier(b);

				return aKey == bKey ? 0
					: aKey < bKey ? -1
					: 1;
			};

		this._items = new SortedMap(identifier, this.comparator);

		// override the store's query
		dsQuery = datasource.query;
		self = this;
		datasource.query = function(query) {
			return self._queue(function() {
				return when(dsQuery.call(datasource, arguments), function(results) {
					self._items = new SortedMap(self.identifier, self.comparator);
					self._initResultSet(results);
					return results;
				});
			});
		};

	}

	QueryAdapter.prototype = {

		provide: true,

		comparator: undef,

		identifier: undef,

		query: function(query) {
			return this._datasource.query.apply(this._datasource, arguments);
		},

		/**
		 * Adds op to the internal queue of async tasks to ensure that
		 * it will run in the order added and not overlap with other async tasks
		 * @param op {Function} async task (function that returns a promise) to add
		 *  to the internal queue
		 * @return {Promise} promise that will resolver/reject when op has completed
		 * @private
		 */
		_queue: function(op) {
			this._inflight = when(this._inflight, function() {
				return op();
			});

			return this._inflight;
		},

		/**
		 * Initialized the internal map of items
		 * @param results {Array} array of result items
		 * @private
		 */
		_initResultSet: function (results) {
			var map, i, len, item, self;

			map = this._items;
			map.clear();

			self = this;
			for(i = 0, len = results.length; i < len; i++) {
				item = results[i];
				map.add(item, item);
				self.add(item);
			}
		},

		getOptions: function() {
			return this._options;
		},

		forEach: function(lambda) {
			var self = this;
			return this._queue(function() {
				return self._items.forEach(lambda);
			});
		},

		add: function(item) {
			var items, added, self;

			items = this._items;
			added = items.add(item, item);

			if(added >= 0 && !this._dontCallDatasource) {

				self = this;

				// This is optimistic, maybe overly so.  It notifies listeners
				// that the item is added, even though there may be an inflight
				// async store.add().  If the add fails, it tries to revert
				// by removing the item from the local map, notifying listeners
				// that it is removed, and "rethrowing" the failure.
				// When we move all data to a central SortedMap, we can handle
				// this behavior with a strategy.
				return when(this._datasource.add(item),
					function(returned) {
						if (self._itemWasUpdatedByDatasource(returned)) {
							self._execMethodWithoutCallingDatasource('update', returned);
						}
					},
					function(err) {
						self._execMethodWithoutCallingDatasource('remove', item);
						throw err;
					}
				);
			}
		},

		// TODO: allow an item or an id to be provided
		remove: function(item) {
			var removed, items;

			items = this._items;
			removed = items.remove(item);

			if(removed >= 0 && !this._dontCallDatasource) {

				// TODO: remove dojo-specific behavior
				var id = this._datasource.getIdentity(item);

				// Similar to add() above, this should be replaced with a
				// central SortedMap and strategy.
				return when(this._datasource.remove(id),
					null, // If all goes according to plan, great, nothing to do
					function(err) {
						self._execMethodWithoutCallingDatasource('add', item);
						throw err;
					}
				);
			}
		},

		update: function(item) {
			var orig, items, self;

			items = this._items;
			orig = items.get(item);

			if(orig) {
				this._replace(orig, item);

				if (!this._dontCallDatasource) {
					self = this;

					// Similar to add() above, this should be replaced with a
					// central SortedMap and strategy.
					return when(this._datasource.put(item),
						function(returned) {
							if (self._itemWasUpdatedByDatasource(returned)) {
								self._execMethodWithoutCallingDatasource('update', returned);
							}
						},
						function(err) {
							self._execMethodWithoutCallingDatasource('update', orig);
							throw err;
						}
					);
				}
			}
		},

		_replace: function(oldItem, newItem) {
			this._items.remove(oldItem);
			this._items.add(newItem, newItem);
		},

		_itemWasUpdatedByDatasource: function(item) {
			return hasProperties(item);
		},

		_execMethodWithoutCallingDatasource: function(method, item) {
			this._dontCallDatasource = true;
			try {
				return this[method](item);
			}
			finally {
				this._dontCallDatasource = false;
			}
		},

		clear: function() {
			this._initResultSet([]);
		}
	};

	QueryAdapter.canHandle = function(it) {
		return it && typeof it.query == 'function' && !(it instanceof QueryAdapter);
	};

	return QueryAdapter;

	function hasProperties (o) {
		if (!o) return false;
		for (var p in o) return true;
	}

});

})(
	typeof define == 'function'
		? define
		: function(factory) { module.exports = factory(require); }
);

;(function (define) {
define('cola/network/strategy/compose', ['require', 'when/when'], function (require, $cram_r0) {
"use strict";

	var when = $cram_r0;

	/**
	 * Returns a network strategy that is a composition of two or more
	 * other strategies.  The strategies are executed in the order
	 * in which they're provided.  If any strategy cancels, the remaining
	 * strategies are never executed and the cancel is sent back to the Hub.
	 *
	 * @param strategies {Array} collection of network strategies.
	 * @return {Function} a composite network strategy function
	 */
	return function composeStrategies (strategies) {
		return function (source, dest, data, type, api) {

			return when.reduce(strategies,
				function(result, strategy) {
					var strategyResult = strategy(source, dest, data, type, api);
					return api.isCanceled()
						? when.reject(strategyResult)
						: strategyResult;
				},
				data
			).then(propagateSuccess, propagateSuccess);

		}

	};

	function propagateSuccess(x) {
		return x;
	}

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(require); }
));
/**
 * collectionAdapterResolver
 * @author: brian
 */
(function(define) {
define('cola/collectionAdapterResolver', ['require', 'cola/adapterResolver', 'cola/adapter/Array', 'cola/dom/adapter/NodeList', 'cola/adapter/Query'], function (require, $cram_r0, $cram_r1, $cram_r2, $cram_r3) {

	var adapterResolver = $cram_r0;

	return Object.create(adapterResolver, {
		adapters: { value: [
			$cram_r1,
			$cram_r2,
			$cram_r3
		]}
	});

});
}(typeof define === 'function' ? define : function(factory) { module.exports = factory(require); }));
/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Helper module that parses incoming and outgoing method-call-based
 * connection specs. This module is used by wire plugins to parse connections.
 *
 * Incoming connection forms:
 *
 * 'srcComponent.triggerMethod': 'method'
 * 'srcComponent.triggerMethod': 'transforms | method'
 * srcComponent: {
 *   triggerMethod1: 'method',
 *   triggerMethod2: 'transforms | method',
 *   ...
 * }
 *
 * Outgoing connection forms:
 *
 * eventName: 'destComponent.method'
 * eventName: 'transforms | destComponent.method'
 * eventName: {
 *   destComponent1: 'method',
 *   destComponent2: 'transforms | method',
 *   ...
 * }
 *
 */

(function(define){ 'use strict';
define('wire/lib/connection', ['require', 'when/when', 'wire/lib/array', 'wire/lib/functional'], function (require, $cram_r0, $cram_r1, $cram_r2) {

	var when, array, functional;

	when = $cram_r0;
	array = $cram_r1;
	functional = $cram_r2;

	return {
		parse: parse,
		parseIncoming: parseIncoming,
		parseOutgoing: parseOutgoing
	};

	/**
	 * Determines if the connections are incoming or outgoing, and invokes parseIncoming
	 * or parseOutgoing accordingly.
	 * @param proxy
	 * @param connect
	 * @param options
	 * @param wire {Function} wire function to use to wire, resolve references, and get proxies
	 * @param createConnection {Function} callback that will do the work of creating
	 *  the actual connection from the parsed information
	 * @return {Promise} promise that resolves when connections have been created, or
	 *  rejects if an error occurs.
	 */
	function parse(proxy, connect, options, wire, createConnection) {
		var source, eventName;

		// First, determine the direction of the connection(s)
		// If ref is a method on target, connect it to another object's method, i.e. calling a method on target
		// causes a method on the other object to be called.
		// If ref is a reference to another object, connect that object's method to a method on target, i.e.
		// calling a method on the other object causes a method on target to be called.

		source = connect.split('.');
		eventName = source[1];
		source = source[0];

		return when(wire.resolveRef(source),
			function(source) {
				return parseIncoming(source, eventName, proxy, connect, options, wire, createConnection);
			},
			function() {
				return parseOutgoing(proxy, connect, options, wire, createConnection);
			}
		);
	}

	/**
	 * Parse incoming connections and call createConnection to do the work of
	 * creating the connection.
	 *
	 * @param source
	 * @param eventName
	 * @param targetProxy
	 * @param connect
	 * @param options
	 * @param wire {Function} wire function to use to wire, resolve references, and get proxies
	 * @param createConnection {Function} callback that will do the work of creating
	 *  the actual connection from the parsed information
	 * @return {Promise} promise that resolves when connections have been created, or
	 *  rejects if an error occurs.
	 */
	function parseIncoming(source, eventName, targetProxy, connect, options, wire, createConnection) {
		var promise, methodName;

		if(eventName) {
			// 'component.eventName': 'methodName'
			// 'component.eventName': 'transform | methodName'

			methodName = options;

			promise = when(functional.compose.parse(targetProxy, methodName, wire),
				function(func) {
					return createConnection(source, eventName, proxyInvoker(targetProxy, func));
				}
			);

		} else {
			// componentName: {
			//   eventName: 'methodName'
			//   eventName: 'transform | methodName'
			// }

			source = methodName;
			promise = when(wire.resolveRef(connect), function(source) {
				var name, promises;

				function createConnectionFactory(source, name, targetProxy) {
					return function(func) {
						return createConnection(source, name, proxyInvoker(targetProxy, func));
					};
				}

				promises = [];
				for(name in options) {
					promises.push(when(functional.compose.parse(targetProxy, options[name], wire),
						createConnectionFactory(source, name, targetProxy)
					));
				}

				return when.all(promises);
			});
		}

		return promise;

	}

	/**
	 * Parse outgoing connections and call createConnection to do the actual work of
	 * creating the connection.  Supported forms:
	 *
	 * @param proxy
	 * @param connect
	 * @param options
	 * @param wire {Function} wire function to use to wire, resolve references, and get proxies
	 * @param createConnection {Function} callback that will do the work of creating
	 *  the actual connection from the parsed information
	 * @return {Promise} promise that resolves when connections have been created, or
	 *  rejects if an error occurs.
	 */
	function parseOutgoing(proxy, connect, options, wire, createConnection) {
		return createOutgoing(proxy.target, connect, proxy, connect, options, wire, createConnection);
	}

	function createOutgoing(source, eventName, targetProxy, connect, options, wire, createConnection) {
		var promise, promises, resolveAndConnectOneOutgoing, name;

		function connectOneOutgoing(targetProxy, targetMethodSpec) {
			return when(functional.compose.parse(targetProxy, targetMethodSpec, wire),
				function(func) {
					return createConnection(source, eventName, proxyInvoker(targetProxy, func));
				});

		}

		if(typeof options == 'string') {
			// eventName: 'transform | componentName.methodName'
			promise = connectOneOutgoing(targetProxy, options);

		} else {
			// eventName: {
			//   componentName: 'methodName'
			//   componentName: 'transform | methodName'
			// }
			promises = [];

			resolveAndConnectOneOutgoing = function(targetRef, targetMethodSpec) {
				return when(wire.getProxy(targetRef), function(targetProxy) {
					return connectOneOutgoing(targetProxy, targetMethodSpec);
				});
			};

			for(name in options) {
				promises.push(resolveAndConnectOneOutgoing(name, options[name]));
			}

			promise = when.all(promises);
		}

		return promise;
	}

	function proxyInvoker(proxy, method) {
		return function() {
			return proxy.invoke(method, arguments);
		};
	}

});
})(typeof define == 'function'
	// AMD
	? define
	// CommonJS
	: function(factory) { module.exports = factory(require); }
);
/** @license MIT License (c) copyright 2010-2013 original author or authors */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author: Brian Cavalier
 * @author: John Hann
 */

(function(define) { 'use strict';
define('wire/lib/advice', ['require', 'when/when'], function (require, $cram_r0) {

	var when;

	when = $cram_r0;

	// Very simple advice functions for internal wire use only.
	// This is NOT a replacement for meld.  These advices stack
	// differently and will not be as efficient.
	return {
		after: after,
		beforeAsync: beforeAsync,
		afterAsync: afterAsync
	};

	/**
	 * Execute advice after f, passing f's return value to advice
	 * @param {function} f function to advise
	 * @param {function} advice function to execute after f
	 * @returns {function} advised function
	 */
	function after(f, advice) {
		return function() {
			return advice.call(this, f.apply(this, arguments));
		}
	}

	/**
	 * Execute f after a promise returned by advice fulfills. The same args
	 * will be passed to both advice and f.
	 * @param {function} f function to advise
	 * @param {function} advice function to execute before f
	 * @returns {function} advised function which always returns a promise
	 */
	function beforeAsync(f, advice) {
		return function() {
			var self, args;

			self = this;
			args = arguments;

			return when(args, function() {
				return advice.apply(self, args);
			}).then(function() {
				return f.apply(self, args);
			});
		}
	}

	/**
	 * Execute advice after a promise returned by f fulfills. The same args
	 * will be passed to both advice and f.
	 * @param {function} f function to advise
	 * @param {function} advice function to execute after f
	 * @returns {function} advised function which always returns a promise
	 */
	function afterAsync(f, advice) {
		return function() {
			var self = this;

			return when(arguments, function(args) {
				return f.apply(self, args);
			}).then(function(result) {
				return advice.call(self, result);
			});
		}
	}


});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * wire/aop plugin
 * Provides AOP for components created via wire, including Decorators,
 * Introductions (mixins), and Pointcut-based Aspect Weaving.
 *
 * wire is part of the cujo.js family of libraries (http://cujojs.com/)
 *
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 */
(function(define) { 'use strict';
define('wire/aop', ['require', 'meld/meld', 'when/when', 'when/sequence', 'wire/lib/connection'], function (require, $cram_r0, $cram_r1, $cram_r2, $cram_r3) {

	var meld, when, sequence, connection, adviceTypes, adviceStep, undef;

	meld = $cram_r0;
	when = $cram_r1;
	sequence = $cram_r2;
	connection = $cram_r3;

	// "after" is not included in these standard advice types because
	// it is created as promise-aware advice.
	adviceTypes = ['before', 'around', 'afterReturning', 'afterThrowing'];
	adviceStep = 'connect:before';

    //
    // Decoration
    //

    function applyDecorator(target, Decorator, args) {
        args = args ? [target].concat(args) : [target];

        Decorator.apply(null, args);
    }

    function makeDecorator(decorator, args, wire) {
		return function(target) {
			function apply(Decorator) {
				return args
					? when(wire(args), function (resolvedArgs) {
					applyDecorator(target, Decorator, resolvedArgs);
				})
					: applyDecorator(target, Decorator);
			}

			return when(wire.resolveRef(decorator), apply);
		};
    }

    function decorateFacet(resolver, facet, wire) {
        var target, options, tasks;

        target = facet.target;
        options = facet.options;
        tasks = [];

        for(var decoratorRefName in options) {
            tasks.push(makeDecorator(decoratorRefName, options[decoratorRefName], wire));
        }

		resolver.resolve(sequence(tasks, target));
    }

	//
	// Simple advice
	//

	function addSingleAdvice(addAdviceFunc, advices, proxy, advice, options, wire) {

		function handleAopConnection(srcObject, srcMethod, adviceHandler) {
			checkAdvisable(srcObject, srcMethod);
			advices.push(addAdviceFunc(srcObject, srcMethod, adviceHandler));
		}

		return connection.parse(proxy, advice, options, wire, handleAopConnection);
	}

	function checkAdvisable(source, method) {
		if (!(typeof method == 'function' || typeof source[method] == 'function')) {
			throw new TypeError('Cannot add advice to non-method: ' + method);
		}
	}

	function makeSingleAdviceAdd(adviceType) {
		return function (source, sourceMethod, advice) {
			return meld[adviceType](source, sourceMethod, advice);
		};
	}

	function addAfterFulfillingAdvice(source, sourceMethod, advice) {
		return meld.afterReturning(source, sourceMethod, function(promise) {
			return when(promise, advice);
		});
	}

	function addAfterRejectingAdvice(source, sourceMethod, advice) {
		return meld.afterReturning(source, sourceMethod, function(promise) {
			return when(promise, null, advice);
		});
	}

	function addAfterPromiseAdvice(source, sourceMethod, advice) {
		return meld.after(source, sourceMethod, function(promise) {
			return when(promise, advice, advice);
		});
	}

	function makeAdviceFacet(addAdviceFunc, advices) {
		return function(resolver, facet, wire) {
			var advice, target, advicesToAdd, promises;

			target = facet;
			advicesToAdd = facet.options;
			promises = [];

			for(advice in advicesToAdd) {
				promises.push(addSingleAdvice(addAdviceFunc, advices,
					target, advice, advicesToAdd[advice], wire));
			}

			resolver.resolve(when.all(promises));
		};
	}

    //
    // Aspect Weaving
    //

    function applyAspectCombined(target, aspect, wire, add) {
        return when(wire.resolveRef(aspect), function (aspect) {
            var pointcut = aspect.pointcut;

            if (pointcut) {
                add(target, pointcut, aspect);
            }

            return target;
        });
    }

    function applyAspectSeparate(target, aspect, wire, add) {
        var pointcut, advice;

        pointcut = aspect.pointcut;
        advice = aspect.advice;

        function applyAdvice(pointcut) {
            return when(wire.resolveRef(advice), function (aspect) {
                add(target, pointcut, aspect);
                return target;
            });
        }

        return typeof pointcut === 'string'
            ? when(wire.resolveRef(pointcut, applyAdvice))
            : applyAdvice(pointcut);
    }

    function weave(resolver, proxy, wire, options, add) {
		// TODO: Refactor weaving to use proxy.invoke

        var target, path, aspects, applyAdvice;

        aspects = options.aspects;
        path = proxy.path;

        if (!aspects || path === undef) {
            resolver.resolve();
            return;
        }

        target = proxy.target;
        applyAdvice = applyAspectCombined;

        // Reduce will preserve order of aspects being applied
        resolver.resolve(when.reduce(aspects, function(target, aspect) {
            var aspectPath;

            if (aspect.advice) {
                aspectPath = aspect.advice;
                applyAdvice = applyAspectSeparate;
            } else {
                aspectPath = aspect;
            }

            return typeof aspectPath === 'string' && aspectPath !== path
                ? applyAdvice(target, aspect, wire, add)
                : target;

        }, target));
    }

	/**
	 * Creates wire/aop plugin instances.
	 *
	 * @param options {Object} options passed to the plugin
	 */
    return function(options) {

		// Track aspects so they can be removed when the context is destroyed
		var woven, plugin, i, len, adviceType;

		woven = [];

		/**
		 * Function to add an aspect and remember it in the current context
		 * so that it can be removed when the context is destroyed.
		 * @param target
		 * @param pointcut
		 * @param aspect
		 */
		function add(target, pointcut, aspect) {
			woven.push(meld.add(target, pointcut, aspect));
		}

		function makeFacet(step, callback) {
			var facet = {};

			facet[step] = function(resolver, proxy, wire) {
				callback(resolver, proxy, wire);
			};

			return facet;
		}

		// Plugin
		plugin = {
			context: {
				destroy: function(resolver) {
					woven.forEach(function(aspect) {
						aspect.remove();
					});
					resolver.resolve();
				}
			},
			facets: {
				decorate:       makeFacet('configure:after', decorateFacet),
				afterFulfilling: makeFacet(adviceStep, makeAdviceFacet(addAfterFulfillingAdvice, woven)),
				afterRejecting:  makeFacet(adviceStep, makeAdviceFacet(addAfterRejectingAdvice, woven)),
				after: makeFacet(adviceStep, makeAdviceFacet(addAfterPromiseAdvice, woven))
			}
		};

		if(options.aspects) {
			plugin.create = function(resolver, proxy, wire) {
				weave(resolver, proxy, wire, options, add);
			};
		}

		// Add all regular single advice facets
		for(i = 0, len = adviceTypes.length; i<len; i++) {
			adviceType = adviceTypes[i];
			plugin.facets[adviceType] = makeFacet(adviceStep, makeAdviceFacet(makeSingleAdviceAdd(adviceType), woven));
		}

		return plugin;
};
});
})(typeof define == 'function'
	// use define for AMD if available
	? define
    : function(factory) { module.exports = factory(require); }
);
/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * plugins
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 * @author: brian@hovercraftstudios.com
 */
(function(define) {
define('wire/lib/plugin/registry', ['require', 'when/when', 'wire/lib/array', 'wire/lib/object', 'wire/lib/plugin/priority'], function (require, $cram_r0, $cram_r1, $cram_r2, $cram_r3) {

	var when, array, object, priority, nsKey, nsSeparator;

	when = $cram_r0;
	array = $cram_r1;
	object = $cram_r2;
	priority = $cram_r3;

	nsKey = '$ns';
	nsSeparator = ':';

	function PluginRegistry() {
		this.plugins = [];
		this._namespaces = {};

		this.contextListeners = [];
		this.listeners = [];
		this.proxiers =  [];
		this.resolvers = {};
		this.factories = {};
		this.facets =    {};
	}

	PluginRegistry.prototype = {
		scanModule: function (module, spec, namespace) {
			var self, pluginFactory;

			pluginFactory = discoverPlugin(module);

			if (!allowPlugin(pluginFactory, this.plugins)) {
				return when.resolve();
			}

			// Add to singleton plugins list to only allow one instance
			// of this plugin in the current context.
			this.plugins.push(pluginFactory);

			// Initialize the plugin for this context
			self = this;
			return when(pluginFactory(spec),
				function (plugin) {
					plugin && self.registerPlugin(plugin, namespace || getNamespace(spec));
				}
			).yield();
		},

		registerPlugin: function (plugin, namespace) {
			addNamespace(namespace, this._namespaces);

			addPlugin(plugin.resolvers, this.resolvers, namespace);
			addPlugin(plugin.factories, this.factories, namespace);
			addPlugin(plugin.facets, this.facets, namespace);

			this.listeners.push(plugin);
			if(plugin.context) {
				this.contextListeners.push(plugin.context);
			}

			this._registerProxies(plugin.proxies);
		},

		_registerProxies: function (proxiesToAdd) {
			if (!proxiesToAdd) {
				return;
			}

			this.proxiers = priority.sortReverse(array.union(this.proxiers, proxiesToAdd));
		}
	};

	return PluginRegistry;

	function discoverPlugin(module) {
		var plugin;

		if(typeof module.wire$plugin === 'function') {
			plugin = module.wire$plugin;
		} else if(typeof module === 'function') {
			plugin = module;
		}

		return plugin;
	}

	function getNamespace(spec) {
		var namespace;
		if(typeof spec === 'object' && nsKey in spec) {
			// A namespace was provided
			namespace = spec[nsKey];
		}

		return namespace;
	}

	function addNamespace(namespace, namespaces) {
		if(namespace && namespace in namespaces) {
			throw new Error('plugin namespace already in use: ' + namespace);
		} else {
			namespaces[namespace] = 1;
		}
	}

	function allowPlugin(plugin, existing) {
		return typeof plugin === 'function' && existing.indexOf(plugin) === -1;
	}

	function addPlugin(src, registry, namespace) {
		var newPluginName, namespacedName;
		for (newPluginName in src) {
			namespacedName = makeNamespace(newPluginName, namespace);
			if (object.hasOwn(registry, namespacedName)) {
				throw new Error("Two plugins for same type in scope: " + namespacedName);
			}

			registry[namespacedName] = src[newPluginName];
		}
	}

	function makeNamespace(pluginName, namespace) {
		return namespace ? (namespace + nsSeparator + pluginName) : pluginName;
	}
});
}(typeof define === 'function' ? define : function(factory) { module.exports = factory(require); }));
/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * wire/connect plugin
 * wire plugin that can connect synthetic events (method calls) on one
 * component to methods of another object.  For example, connecting a
 * view's onClick event (method) to a controller's _handleViewClick method:
 *
 * view: {
 *     create: 'myView',
 *     ...
 * },
 * controller: {
 *     create: 'myController',
 *     connect: {
 *         'view.onClick': '_handleViewClick'
 *     }
 * }
 *
 * It also supports arbitrary transforms on the data that flows over the
 * connection.
 *
 * transformer: {
 *     module: 'myTransformFunction'
 * },
 * view: {
 *     create: 'myView',
 *     ...
 * },
 * controller: {
 *     create: 'myController',
 *     connect: {
 *         'view.onClick': 'transformer | _handleViewClick'
 *     }
 * }
 *
 * wire is part of the cujo.js family of libraries (http://cujojs.com/)
 *
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 */

(function(define) {
define('wire/connect', ['when/when', 'meld/meld', 'wire/lib/functional', 'wire/lib/connection'], function (when, meld, functional, connection) {

	return function eventsPlugin(/* options */) {

		var connectHandles = [];

		function handleConnection(instance, methodName, handler) {
			connectHandles.push(meld.on(instance, methodName, handler));
		}

		function doConnect(proxy, connect, options, wire) {
			return connection.parse(proxy, connect, options, wire, handleConnection);
		}

		function connectFacet(wire, facet) {
			var promises, connects;

			connects = facet.options;
			promises = Object.keys(connects).map(function(key) {
				return doConnect(facet, key, connects[key], wire);
			});

			return when.all(promises);
		}

		return {
			context: {
				destroy: function(resolver) {
					connectHandles.forEach(function(handle) {
						handle.remove();
					});
					resolver.resolve();
				}
			},
			facets: {
				// A facet named "connect" that runs during the connect
				// lifecycle phase
				connect: {
					connect: function(resolver, facet, wire) {
						resolver.resolve(connectFacet(wire, facet));
					}
				}
			}
		};
    };
});
})(typeof define == 'function'
	? define
	: function(deps, factory) {
		module.exports = factory.apply(this, deps.map(function(x) {
			return require(x);
		}));
	}
);

/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * wire/plugin-base/on
 *
 * wire is part of the cujo.js family of libraries (http://cujojs.com/)
 *
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 */
(function (define) {
define('wire/lib/plugin-base/on', ['when/when', 'when/apply', 'wire/lib/functional', 'wire/lib/connection'], function (when, apply, functional, connection) {
"use strict";

	var theseAreNotEvents, thisLooksLikeCssRx, eventSplitterRx, undef;

	theseAreNotEvents = {
		selector: 1,
		transform: 1,
		preventDefault: 1,
		stopPropagation: 1
	};

	thisLooksLikeCssRx = /#|\.|-|[^,]\s[^,]/;
	eventSplitterRx = /\s*,\s*/;

	return function createOnPlugin (options) {
		var on;

		on = options.on;

		return function eventsPlugin (options) {

			var removers = [];

			if (!options) {
				options = {};
			}

			function createConnection(source, eventsString, handler) {
				var events, prevent, stop;

				events = splitEventSelectorString(eventsString);
				prevent = options.preventDefault;
				stop = options.stopPropagation;

				removers = removers.concat(
					registerHandlers(events, source, handler, prevent, stop)
				);
			}

			function parseIncomingOn(source, targetProxy, connections, wire) {

				// NOTE: Custom parsing for incoming connections

				// target is the node to which to connect, and
				// right hand side is a specification of an event
				// and a handler method on the current component
				//
				//	component: {
				//		on: {
				//			otherComponent: {
				//				selector: 'a.nav',
				//				transform: { $ref: 'myTransformFunc' }, // optional
				//				click: 'handlerMethodOnComponent',
				//				keypress: 'anotherHandlerOnComponent'
				//			}
				//		}
				//	}
				var target, event, events, selector, prevent, stop, method, transform, promises;

				target = targetProxy.target;
				promises = [];

				// Extract options
				selector = connections.selector;
				transform = connections.transform;
				prevent = connections.preventDefault || options.preventDefault;
				stop = connections.stopPropagation || options.stopPropagation;

				/**
				 * Compose a transform pipeline and then pass it to addConnection
				 */
				function createTransformedConnection(events, targetMethod, transformPromise) {
					return when(transformPromise, function(transform) {
						var composed = functional.compose([transform, targetMethod]).bind(targetProxy.target);
						removers = removers.concat(
							registerHandlers(events, source, function() {
								return targetProxy.invoke(composed, arguments);
							}, prevent, stop)
						);
					});
				}

				for (event in connections) {
					// Skip reserved names, such as 'selector'
					if (!(event in theseAreNotEvents)) {
						// If there's an explicit transform, compose a transform pipeline manually,
						// Otherwise, let the connection lib do it's thing
						if(transform) {
							// TODO: Remove this long form?  It'd simplify the code a lot
							events = splitEventSelectorString(event, selector);
							method = connections[event];
							promises.push(createTransformedConnection(events, target[method], wire(transform)));
						} else {
							promises.push(connection.parseIncoming(source, event, targetProxy, options, connections[event], wire, createConnection));
						}
					}
				}

				return when.all(promises);
			}

			function parseOn (proxy, refName, connections, wire) {
				// First, figure out if the left-hand-side is a ref to
				// another component, or an event/delegation string
				return when(wire.resolveRef(refName),
					function (source) {
						// It's an incoming connection, parse it as such
						return parseIncomingOn(source, proxy, connections, wire);
					},
					function () {
						// Failed to resolve refName as a reference, assume it
						// is an outgoing event with the current component (which
						// must be a Node) as the source
						return connection.parseOutgoing(proxy, refName, connections, wire, createConnection);
					}
				);

			}

			function onFacet (wire, facet) {
				var promises, connections;

				connections = facet.options;
				promises = [];

				for (var ref in connections) {
					promises.push(parseOn(facet, ref, connections[ref], wire));
				}

				return when.all(promises);
			}

			return {
				context: {
					destroy: function(resolver) {
						removers.forEach(function(remover) {
							remover();
						});
						resolver.resolve();
					}
				},
				facets: {
					on: {
						connect: function (resolver, facet, wire) {
							resolver.resolve(onFacet(wire, facet));
						}
					}
				},
				resolvers: {
					on: function(resolver, name /*, refObj, wire*/) {
						resolver.resolve(name ? createOnResolver(name) : on);
					}
				}
			};
		};

		function registerHandlers (events, node, callback, prevent, stop) {
			var removers, handler;
			removers = [];
			for (var i = 0, len = events.length; i < len; i++) {
				handler = makeEventHandler(callback, prevent, stop);
				removers.push(on(node, events[i], handler, events.selector));
			}
			return removers;
		}

		/**
		 * Returns a function that creates event handlers.  The event handlers
		 * are pre-configured with one or more selectors and one
		 * or more event types.  The syntax is identical to the "on" facet.
		 * Note that the returned handler does not auto-magically call
		 * event.preventDefault() or event.stopPropagation() like the "on"
		 * facet does.
		 * @private
		 * @param eventSelector {String} event/selector string that can be
		 *   parsed by splitEventSelectorString()
		 * @return {Function} a function that can be used to create event
		 *   handlers. It returns an "unwatch" function and takes any of
		 *   the following argument signatures:
		 *     function (handler) {}
		 *     function (rootNode, handler) {}
		 */
		function createOnResolver (eventSelector) {
			var events;
			// split event/selector string
			events = splitEventSelectorString(eventSelector, '');
			return function () {
				var args, node, handler, unwatches;
				// resolve arguments
				args = Array.prototype.slice.call(arguments, 0, 3);
				node = args.length > 1 ? args.shift() : document;
				handler = args[0];

				unwatches = [];
				events.forEach(function (event) {
					// create a handler for each event
					unwatches.push(on(node, event, handler, events.selector));
				});
				// return unwatcher of all events
				return function () {
					unwatches.forEach(function (unwatch) { unwatch(); });
				};
			};
		}

	};

	function preventDefaultIfNav (e) {
		var node, nodeName, nodeType, isNavEvent;
		node = e.selectorTarget || e.target || e.srcElement;
		if (node) {
			nodeName = node.tagName;
			nodeType = node.type && node.type.toLowerCase();
			// catch links and submit buttons/inputs in forms
			isNavEvent = ('click' == e.type && 'A' == nodeName)
				|| ('submit' == nodeType && node.form)
				|| ('submit' == e.type && 'FORM' == nodeName);
			if (isNavEvent) {
				preventDefaultAlways(e);
			}
		}
	}

	function preventDefaultAlways (e) {
		e.preventDefault();
	}

	function stopPropagationAlways (e) {
		e.stopPropagation();
	}

	function never () {}

	function makeEventHandler (handler, prevent, stop) {
		var preventer, stopper;
		preventer = prevent == undef || prevent == 'auto'
			? preventDefaultIfNav
			: prevent ? preventDefaultAlways : never;
		stopper = stop ? stopPropagationAlways : never;

		// Use proxy.invoke instead of trying to call methods
		// directly on proxy.target
		return function (e) {
			preventer(e);
			stopper(e);
			return handler.apply(this, arguments);
		};
	}

	/**
	 * Splits an event-selector string into one or more combinations of
	 * selectors and event types.
	 * Examples:
	 *   ".target:click" --> {selector: '.target', event: 'click' }
	 *   ".mylist:first-child:click, .mylist:last-child:click" --> [
	 *     { selector: '.mylist:first-child', event: 'click' },
	 *     { selector: '.mylist:last-child', event: 'click' }
	 *   ]
	 *   ".mylist:first-child, .mylist:last-child:click" --> {
	 *     selector: '.mylist:first-child, .mylist:last-child',
	 *     event: 'click'
	 *   }
	 * @private
	 * @param string {String}
	 * @param defaultSelector {String}
	 * @returns {Array} an array of event names. if a selector was specified
	 *   the array has a selectors {String} property
	 */
	function splitEventSelectorString (string, defaultSelector) {
		var split, events, selectors;

		// split on first colon to get events and selectors
		split = string.split(':', 2);
		events = split[0];
		selectors = split[1] || defaultSelector;

		// look for css stuff in event (dev probably forgot event?)
		// css stuff: hash, dot, spaces without a comma
		if (thisLooksLikeCssRx.test(events)) {
			throw new Error('on! resolver: malformed event-selector string (event missing?)');
		}

		// split events
		events = events.split(eventSplitterRx);
		if (selectors) {
			events.selector = selectors;
		}

		return events;
	}

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (deps, factory) { module.exports = factory.apply(this, deps.map(require)); }
));

;(function (define) {
define('cola/network/strategy/minimal', ['require', 'cola/network/strategy/compose', 'cola/network/strategy/base', 'cola/network/strategy/targetFirstItem', 'cola/network/strategy/syncAfterJoin', 'cola/network/strategy/syncDataDirectly'], function (require, $cram_r0, $cram_r1, $cram_r2, $cram_r3, $cram_r4) {
"use strict";

	var
		compose = $cram_r0,
		base = $cram_r1,
		targetFirstItem = $cram_r2,
		syncAfterJoin = $cram_r3,
		syncDataDirectly = $cram_r4;

	/**
	 * This is a composition of the minimal strategies to actually do something
	 * meaningful with cola.
	 *
	 * @param options {Object} a conglomeration of all of the options for the
	 *   strategies used.
	 * @param options.targetFirstItem {Boolean} if truthy, the strategy
	 * will automatically target the first item that is added to the network.
	 * If falsey, it will not automatically target.
	 *
	 * @return {Function} a composite network strategy function
	 */
	return function (options) {

		var strategies;

		// configure strategies
		strategies = [
			syncAfterJoin(options),
			syncDataDirectly(options)
		];

		if(options && options.targetFirstItem) {
			strategies.push(targetFirstItem(options));
		}

		strategies.push(base(options));

		// compose them
		return compose(strategies);

	};

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(require); }
));
/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * wire/on plugin
 * wire plugin that provides an "on" facet to connect to dom events,
 * and includes support for delegation
 *
 * wire is part of the cujo.js family of libraries (http://cujojs.com/)
 *
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 */
(function (define) {
define('wire/on', ['wire/lib/plugin-base/on', 'wire/lib/dom/base'], function (createOnPlugin, base) {
"use strict";

	var contains;

	/**
	 * Listens for dom events at the given node.  If a selector is provided,
	 * events are filtered to only nodes matching the selector.  Note, however,
	 * that children of the matching nodes can also fire events that bubble.
	 * To determine the matching node, use the event object's selectorTarget
	 * property instead of it's target property.
	 * @param node {HTMLElement} element at which to listen
	 * @param event {String} event name ('click', 'mouseenter')
	 * @param handler {Function} handler function with the following signature: function (e) {}
	 * @param [selector] {String} optional css query string to use to
	 * @return {Function} removes the event handler
	 */
	function on (node, event, handler /*, selector */) {
		var selector = arguments[3];

		if (selector) {
			handler = filteringHandler(node, selector, handler);
		}

		node.addEventListener(event, handler, false);

		return function remove () {
			node.removeEventListener(node, handler, false);
		};
	}

	on.wire$plugin = createOnPlugin({
		on: on
	});

	if (document && document.compareDocumentPosition) {
		contains = function w3cContains (refNode, testNode) {
			return (refNode.compareDocumentPosition(testNode) & 16) == 16;
		};
	}
	else {
		contains = function oldContains (refNode, testNode) {
			return refNode.contains(testNode);
		};
	}

	return on;

	/**
	 * This is a brute-force method of checking if an event target
	 * matches a query selector.
	 * @private
	 * @param node {Node}
	 * @param selector {String}
	 * @param handler {Function} function (e) {}
	 * @returns {Function} function (e) {}
	 */
	function filteringHandler (node, selector, handler) {
		return function (e) {
			var target, matches, i, len, match;
			// if e.target matches the selector, call the handler
			target = e.target;
			matches = base.querySelectorAll(selector, node);
			for (i = 0, len = matches.length; i < len; i++) {
				match = matches[i];
				if (target == match || contains(match, target)) {
					e.selectorTarget = match;
					return handler(e);
				}
			}
		};
	}

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (deps, factory) { module.exports = factory.apply(this, deps.map(require)); }
));
/** @license MIT License (c) copyright 2010-2013 original author or authors */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author: Brian Cavalier
 * @author: John Hann
 */

(function(define) { 'use strict';
define('wire/lib/ComponentFactory', ['require', 'when/when', 'wire/lib/object', 'wire/lib/WireProxy'], function (require, $cram_r0, $cram_r1, $cram_r2) {

	var when, object, WireProxy, undef;

	when = $cram_r0;
	object = $cram_r1;
	WireProxy = $cram_r2;

	function ComponentFactory(lifecycle, plugins, pluginApi) {
		this.plugins = plugins;
		this.pluginApi = pluginApi;
		this.lifecycle = lifecycle;
		this.proxies = [];
	}

	ComponentFactory.prototype = {

		create: function(component) {
			var found;

			// Look for a factory, then use it to create the object
			found = this.getFactory(component.spec);
			return found
				? this._create(component, found.factory, found.options)
				: when.reject(component);
		},

		_create: function(component, factory, options) {
			var instance, self;

			instance = when.defer();
			self = this;

			factory(instance.resolver, options,
				this.pluginApi.contextualize(component.id));

			return instance.promise.then(function(instance) {
				return self.processComponent(component, instance);
			});
		},

		processComponent: function(component, instance) {
			var self, proxy;

			self = this;
			proxy = this.createProxy(instance, component);

			return self.initInstance(proxy).then(
				function(proxy) {
					return self.startupInstance(proxy);
				}
			).then(WireProxy.getTarget);
		},

		initInstance: function(proxy) {
			return this.lifecycle.init(proxy);
		},

		startupInstance: function(proxy) {
			return this.lifecycle.startup(proxy);
		},

		createProxy: function(instance, component) {
			var proxy;

			if (WireProxy.isProxy(instance)) {
				proxy = instance;
				instance = WireProxy.getTarget(proxy);
			} else {
				proxy = WireProxy.create(instance);
			}

			if(component) {
				proxy.id = component.id;
				proxy.metadata = component;
			}

			return this.initProxy(proxy);
		},

		initProxy: function(proxy) {

			var proxiers = this.plugins.proxiers;

			// Allow proxy plugins to process/modify the proxy
			proxy = proxiers.reduce(
				function(proxy, proxier) {
					var overridden = proxier(proxy);
					return WireProxy.isProxy(overridden) ? overridden : proxy;
				},
				proxy
			);

			this._registerProxy(proxy);

			return proxy;

		},

		destroy: function() {
			var proxies, lifecycle;

			proxies = this.proxies;
			lifecycle = this.lifecycle;

			return shutdownComponents().then(destroyComponents);

			function shutdownComponents() {
				return when.reduce(proxies,
					function(_, proxy) { return lifecycle.shutdown(proxy); },
					undef);
			}

			function destroyComponents() {
				return when.reduce(proxies,
					function(_, proxy) { return proxy.destroy(); },
					undef);
			}
		},

		_registerProxy: function(proxy) {
			if(proxy.metadata) {
				proxy.path = proxy.metadata.path;
				this.proxies.push(proxy);
			}
		},

		getFactory: function(spec) {
			var f, factories, found;

			factories = this.plugins.factories;

			for (f in factories) {
				if (object.hasOwn(spec, f)) {
					found = {
						factory: factories[f],
						options: {
							options: spec[f],
							spec: spec
						}
					};
					break;
				}
			}

			// Intentionally returns undefined if no factory found
			return found;

		}
	};

	return ComponentFactory;

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));

;(function (define) {
define('cola/network/strategy/default', ['require', 'cola/network/strategy/compose', 'cola/network/strategy/minimal', 'cola/network/strategy/collectThenDeliver', 'cola/network/strategy/validate', 'cola/network/strategy/changeEvent'], function (require, $cram_r0, $cram_r1, $cram_r2, $cram_r3, $cram_r4) {
	"use strict";

	// Note: browser loaders and builders require that we don't "meta-program"
	// the require() calls:
	var compose, minimal, collectThenDeliver, validate, changeEvent;

	compose = $cram_r0;
	minimal = $cram_r1;
	collectThenDeliver = $cram_r2;
	validate = $cram_r3;
	changeEvent = $cram_r4;

	/**
	 * This is a composition of the strategies that Brian and I think
	 * make sense. :)
	 *
	 * @param options {Object} a conglomeration of all of the options for the
	 *   strategies used.
	 * @param options.targetFirstItem {Boolean} if truthy, the strategy
	 * will automatically target the first item that is added to the network.
	 * If falsey, it will not automatically target.
	 * @param options.validator {Function} if provided, will be used
	 * to validate data items on add and update events
	 *
	 * @return {Function} a composite network strategy function
	 */
	return function (options) {

		// compose them
		return compose([
			// Validate should be early so it can cancel other events
			// when validation fails
			validate(options),
			collectThenDeliver(options),
			// Change event support should be earlier than sync events
			// so that it can translate them
			changeEvent(options),
			minimal(options)
		]);

	};

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(require); }
));
/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 */

(function(define){ 'use strict';
define('wire/lib/lifecycle', ['require', 'when/when'], function (require, $cram_r0) {

	var when, safeNonFacetNames;

	when = $cram_r0;
	safeNonFacetNames = {
		id: { value: 1 }
	};

	function Lifecycle(plugins, pluginApi) {
		this._plugins = plugins;
		this._pluginApi = pluginApi;
	}

	Lifecycle.prototype = {
		init: createLifecyclePhase(['create', 'configure', 'initialize']),
		startup: createLifecyclePhase(['connect', 'ready']),
		shutdown: createLifecyclePhase(['destroy'])
	};

	return Lifecycle;

	/**
	 * Generate a method to process all steps in a lifecycle phase
	 * @return {Function}
	 */
	function createLifecyclePhase(steps) {
		steps = generateSteps(steps);

		return function(proxy) {
			var plugins, pluginApi;

			plugins = this._plugins;
			pluginApi = this._pluginApi.contextualize(proxy.id);

			return when.reduce(steps, function (unused, step) {
				return processFacets(step, proxy, pluginApi, plugins);
			}, proxy);
		};
	}

	function processFacets(step, proxy, api, plugins) {
		var promises, metadata, options, name, spec, facets, safeNames, unprocessed;

		promises = [];
		metadata = proxy.metadata;
		spec = metadata.spec;
		facets = plugins.facets;
		safeNames = Object.create(plugins.factories, safeNonFacetNames);
		unprocessed = [];

		for(name in spec) {
			if(name in facets) {
				options = spec[name];
				if (options) {
					processStep(promises, facets[name], step, proxy, options, api);
				}
			} else if (!(name in safeNames)) {
				unprocessed.push(name);
			}
		}

		if(unprocessed.length) {
			return when.reject(unrecognizedFacets(proxy, unprocessed, spec));
		} else {
			return when.all(promises).then(function () {
				return processListeners(step, proxy, api, plugins.listeners);
			}).yield(proxy);
		}
	}

	function processListeners(step, proxy, api, listeners) {
		var listenerPromises = [];

		for (var i = 0; i < listeners.length; i++) {
			processStep(listenerPromises, listeners[i], step, proxy, {}, api);
		}

		return when.all(listenerPromises);
	}

	function processStep(promises, processor, step, proxy, options, api) {
		var facet, pendingFacet;

		if (processor && processor[step]) {
			pendingFacet = when.defer();
			promises.push(pendingFacet.promise);

			facet = Object.create(proxy);
			facet.options = options;
			processor[step](pendingFacet.resolver, facet, api);
		}
	}

	function generateSteps(steps) {
		return steps.reduce(reduceSteps, []);
	}

	function reduceSteps(lifecycle, step) {
		lifecycle.push(step + ':before');
		lifecycle.push(step);
		lifecycle.push(step + ':after');
		return lifecycle;
	}

	function unrecognizedFacets(proxy, unprocessed, spec) {
		return new Error('unrecognized facets in ' + proxy.id + ', maybe you forgot a plugin? ' + unprocessed.join(', ') + '\n' + JSON.stringify(spec));
	}

});
})(typeof define == 'function'
	// AMD
	? define
	// CommonJS
	: function(factory) { module.exports = factory(require); }
);
/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * Plugin that allows wire to be used as a plugin within a wire spec
 *
 * wire is part of the cujo.js family of libraries (http://cujojs.com/)
 *
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 */

(function(define) {
define('wire/lib/plugin/wirePlugin', ['require', 'when/when', 'wire/lib/object'], function (require, $cram_r0, $cram_r1) {

	var when, object;

	when = $cram_r0;
	object = $cram_r1;

	return function(/* options */) {

		var ready = when.defer();

		return {
			context: {
				ready: function(resolver) {
					ready.resolve();
					resolver.resolve();
				}
			},
			resolvers: {
				wire: wireResolver
			},
			factories: {
				wire: wireFactory
			}
		};

		/**
		 * Factory that creates either a child context, or a *function* that will create
		 * that child context.  In the case that a child is created, this factory returns
		 * a promise that will resolve when the child has completed wiring.
		 *
		 * @param {Object} resolver used to resolve with the created component
		 * @param {Object} componentDef component spec for the component to be created
		 * @param {function} wire scoped wire function
		 */
		function wireFactory(resolver, componentDef, wire) {
			var options, module, provide, defer, waitParent, result;

			options = componentDef.options;

			// Get child spec and options
			if(object.isObject(options) && 'spec' in options) {
				module = options.spec;
				waitParent = options.waitParent;
				defer = options.defer;
				provide = options.provide;
			} else {
				module = options;
			}

			function init(context) {
				var initialized;

				if(provide) {
					initialized = when(wire(provide), function(provides) {
						object.mixin(context.instances, provides);
					});
				}

				return initialized;
			}

			function createChild(/** {Object|String}? */ mixin) {
				var spec, config;

				spec = mixin ? [].concat(module, mixin) : module;
				config = { initializers: [init] };

				var child = wire.createChild(spec, config);
				return defer ? child
					: when(child, function(child) {
					return object.hasOwn(child, '$exports') ? child.$exports : child;
				});
			}

			if (defer) {
				// Resolve with the createChild *function* itself
				// which can be used later to wire the spec
				result = createChild;

			} else if(waitParent) {

				var childPromise = when(ready.promise, function() {
					// ensure nothing is passed to createChild here
					return createChild();
				});

				result = wrapChild(childPromise);

			} else {
				result = createChild(componentDef.spec);
			}

			resolver.resolve(result);
		}
	};

	function wrapChild(promise) {
		return { promise: promise };
	}

	/**
	 * Builtin reference resolver that resolves to the context-specific
	 * wire function.
	 */
	function wireResolver(resolver, _, __, wire) {
		resolver.resolve(wire.createChild);
	}

});
}(typeof define === 'function' ? define : function(factory) { module.exports = factory(require); }));
/** @license MIT License (c) copyright B Cavalier & J Hann */

/*global setTimeout:true, clearTimeout:true*/

/**
 * timeout.js
 *
 * Helper that returns a promise that rejects after a specified timeout,
 * if not explicitly resolved or rejected before that.
 *
 * @author brian@hovercraftstudios.com
 */

(function(define) {
define('when/timeout', ['require', 'when/when'], function (require, $cram_r0) {

    var when, undef;

	when = $cram_r0;

    /**
     * Returns a new promise that will automatically reject after msec if
     * the supplied promise doesn't resolve or reject before that.
     *
     * Usage:
     *
     * var d = when.defer();
     * // Setup d however you need
     *
     * // return a new promise that will timeout if d doesn't resolve/reject first
     * return timeout(d.promise, 1000);
     *
     * @param promise anything - any promise or value that should trigger
     *  the returned promise to resolve or reject before the msec timeout
     * @param msec {Number} timeout in milliseconds
     *
     * @returns {Promise}
     */
    return function timeout(promise, msec) {
        var deferred, timeoutRef;

        deferred = when.defer();

        timeoutRef = setTimeout(function onTimeout() {
            timeoutRef && deferred.reject(new Error('timed out'));
        }, msec);

        function cancelTimeout() {
            clearTimeout(timeoutRef);
            timeoutRef = undef;
        }

        when(promise,
            function(value) {
                cancelTimeout();
                deferred.resolve(value);
            },
            function(reason) {
                cancelTimeout();
                deferred.reject(reason);
            },
			deferred.notify
        );

        return deferred.promise;
    };

});
})(
	typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); }
	// Boilerplate for AMD and Node
);


/**
 * trackInflightRefs
 * @author: brian@hovercraftstudios.com
 */
(function(define) {
define('wire/lib/graph/trackInflightRefs', ['require', 'when/timeout', 'wire/lib/graph/tarjan', 'wire/lib/graph/formatCycles'], function (require, $cram_r0, $cram_r1, $cram_r2) {

	var timeout, findStronglyConnected, formatCycles, refCycleCheckTimeout;

	timeout = $cram_r0;
	findStronglyConnected = $cram_r1;
	formatCycles = $cram_r2;

	refCycleCheckTimeout = 5000;

	/**
	 * Advice to track inflight refs using a directed graph
	 * @param {DirectedGraph} graph
	 * @param {Resolver} resolver
	 * @param {number} cycleTimeout how long to wait for any one reference to resolve
	 *  before performing cycle detection. This basically debounces cycle detection
	 */
	return function trackInflightRefs(graph, resolver, cycleTimeout) {
		var create = resolver.create;

		if(typeof cycleTimeout != 'number') {
			cycleTimeout = refCycleCheckTimeout;
		}

		resolver.create = function() {
			var ref, resolve;

			ref = create.apply(resolver, arguments);

			resolve = ref.resolve;
			ref.resolve = function() {
				var inflight = resolve.apply(ref, arguments);
				return trackInflightRef(graph, cycleTimeout, inflight, ref.name, arguments[1]);
			};

			return ref;
		};

		return resolver;
	};


	/**
	 * Add this reference to the reference graph, and setup a timeout that will fire if the refPromise
	 * has not resolved in a reasonable amount.  If the timeout fires, check the current graph for cycles
	 * and fail wiring if we find any.
	 * @param {DirectedGraph} refGraph graph to use to track cycles
	 * @param {number} cycleTimeout how long to wait for any one reference to resolve
	 *  before performing cycle detection. This basically debounces cycle detection
	 * @param {object} refPromise promise for reference resolution
	 * @param {string} refName reference being resolved
	 * @param {string} onBehalfOf some indication of another component on whose behalf this
	 *  reference is being resolved.  Used to build a reference graph and detect cycles
	 * @return {object} promise equivalent to refPromise but that may be rejected if cycles are detected
	 */
	function trackInflightRef(refGraph, cycleTimeout, refPromise, refName, onBehalfOf) {

		onBehalfOf = onBehalfOf||'?';
		refGraph.addEdge(onBehalfOf, refName);

		return timeout(refPromise, cycleTimeout).then(
			function(resolved) {
				refGraph.removeEdge(onBehalfOf, refName);
				return resolved;
			},
			function() {
				var stronglyConnected, cycles;

				stronglyConnected = findStronglyConnected(refGraph);
				cycles = stronglyConnected.filter(function(node) {
					return node.length > 1;
				});

				if(cycles.length) {
					// Cycles detected
					throw new Error('Possible circular refs:\n'
						+ formatCycles(cycles));
				}

				return refPromise;
			}
		);
	}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 */

(function(define){ 'use strict';
define('wire/lib/resolver', ['require', 'when/when', 'when/timeout', 'wire/lib/object'], function (require, $cram_r0, $cram_r1, $cram_r2) {

	var when, timeout, object;

	when = $cram_r0;
	timeout = $cram_r1;
	object = $cram_r2;

	/**
	 * Create a reference resolve that uses the supplied plugins and pluginApi
	 * @param {object} config
	 * @param {object} config.plugins plugin registry
	 * @param {object} config.pluginApi plugin Api to provide to resolver plugins
	 *  when resolving references
	 * @constructor
	 */
	function Resolver(resolvers, pluginApi) {
		this._resolvers = resolvers;
		this._pluginApi = pluginApi;
	}

	Resolver.prototype = {

		/**
		 * Determine if it is a reference spec that can be resolved by this resolver
		 * @param {*} it
		 * @return {boolean} true iff it is a reference
		 */
		isRef: function(it) {
			return it && object.hasOwn(it, '$ref');
		},

		/**
		 * Parse it, which must be a reference spec, into a reference object
		 * @param {object|string} it
		 * @param {string?} it.$ref
		 * @return {object} reference object
		 */
		parse: function(it) {
			return this.isRef(it)
				? this.create(it.$ref, it)
				: this.create(it, {});
		},

		/**
		 * Creates a reference object
		 * @param {string} name reference name
		 * @param {object} options
		 * @return {{resolver: String, name: String, options: object, resolve: Function}}
		 */
		create: function(name, options) {
			var self, split, resolver;

			self = this;

			split = name.indexOf('!');
			resolver = name.substring(0, split);
			name = name.substring(split + 1);

			return {
				resolver: resolver,
				name: name,
				options: options,
				resolve: function(fallback, onBehalfOf) {
					return this.resolver
						? self._resolve(resolver, name, options, onBehalfOf)
						: fallback(name, options);
				}
			};
		},

		/**
		 * Do the work of resolving a reference using registered plugins
		 * @param {string} resolverName plugin resolver name (e.g. "dom"), the part before the "!"
		 * @param {string} name reference name, the part after the "!"
		 * @param {object} options additional options to pass thru to a resolver plugin
		 * @param {string|*} onBehalfOf some indication of another component on whose behalf this
		 *  reference is being resolved.  Used to build a reference graph and detect cycles
		 * @return {object} promise for the resolved reference
		 * @private
		 */
		_resolve: function(resolverName, name, options, onBehalfOf) {
			var deferred, resolver, api;

			deferred = when.defer();

			if (resolverName) {
				resolver = this._resolvers[resolverName];

				if (resolver) {
					api = this._pluginApi.contextualize(onBehalfOf);
					resolver(deferred.resolver, name, options||{}, api);
				} else {
					deferred.reject(new Error('No resolver plugin found: ' + resolverName));
				}

			} else {
				deferred.reject(new Error('Cannot resolve ref: ' + name));
			}

			return deferred.promise;
		}
	};

	return Resolver;

});
})(typeof define == 'function'
	// AMD
	? define
	// CommonJS
	: function(factory) { module.exports = factory(require); }
);
/**
 * base
 * @author: brian
 */
(function(define) {
define('cola/hub/Base', ['require', 'when/when', 'cola/hub/eventProcessor', 'cola/network/strategy/default', 'cola/identifier/default'], function (require, $cram_r0, $cram_r1, $cram_r2, $cram_r3) {

	var when, baseEvents, eventProcessor, simpleStrategy, defaultIdentifier,
		beforePhase, propagatingPhase, afterPhase, canceledPhase,
		undef;

	when = $cram_r0;
	eventProcessor = $cram_r1;
	simpleStrategy = $cram_r2;
	defaultIdentifier = $cram_r3;

	// TODO: make these configurable/extensible
	baseEvents = {
		// basic item events. most of these come with data. devs can
		// decide to use these events for their own purposes or send
		// different data than described here, the following list outlines
		// the intended behavior.
		update: 1, // data == item updated
		change: 1, // data == event type that caused the change
		validate: 1, // data == validation result object with at least a boolean valid prop
		// mode events
		abort: 1, // abort the current mode (no data)
		submit: 1, // finalize the current mode (no data)
		// edit event
		edit: 1, // enter edit mode (data == item to edit)
		// network-level events (not to be used by adapters)
		join: 1, // an adapter has joined (data == adapter)
		sync: 1, // adapters need to sync (data == boolean. true == provider)
		leave: 1 // an adapter has left (data == adapter)
	};

	/**
	 * Signal that event has not yet been pushed onto the network.
	 * Return false to prevent the event from being pushed.
	 */
	beforePhase = {};

	/**
	 * Signal that event is currently being propagated to adapters.
	 */
	propagatingPhase = {};

	/**
	 * Signal that an event has already been pushed onto the network.
	 * Return value is ignored since the event has already propagated.
	 */
	afterPhase = {};

	/**
	 * Signal that an event was canceled and not pushed onto the network.
	 * Return value is ignored since the event has already propagated.
	 */
	canceledPhase = {};

	function BaseHub(options) {
		var eventTypes, t;

		this.adapters = [];

		if (!options) options = {};

		this.identifier = options.identifier || defaultIdentifier;

		this.eventProcessor = Object.create(eventProcessor, {
			queue: { value: [] },
			eventProcessor: { value: this.processEvent.bind(this) }
		});

		eventTypes = this.eventTypes;
		for(t in eventTypes) {
			this.addApi(t);
		}
	}

	BaseHub.prototype = {

		eventTypes: baseEvents,

		dispatchEvent:  function (name, data) {
			try {
				return this[name](data);
			}
			catch (ex) {
				// TODO: do something with this exception
				return false;
			}
		},

		createAdapter: function (source, options) {
			var Adapter = this.resolver.resolve(source);
			return Adapter ? new Adapter(source, options) : source;
		},

		addSource: function (source, options) {
			var adapter, proxy;

			if (!options) options = {};

			if (!options.identifier) options.identifier = this.identifier;

			// create an adapter for this source
			adapter = this.createAdapter(source, options);
			proxy = this._createAdapterProxy(adapter, options);
			proxy.origSource = source;

			// save the proxied adapter
			this.adapters.push(proxy);

			this.eventProcessor.processEvent(proxy, null, 'join');

			return adapter;
		},

		/*
		 1. call events.beforeXXX(data)
		 2. call strategy on each source/dest pair w/ event XXX and data
		 - cancel iteration if any strategy returns false for any pair
		 3. if not canceled, call events.XXX(data)
		 */
		processEvent: function (source, data, type) {
			var context, strategyApi, self, strategy, adapters;

			context = {};
			self = this;
			strategy = this.strategy;
			adapters = this.adapters;

			return when(
				self.dispatchEvent(eventProcessor.makeBeforeEventName(type), data)
			).then(
				function (result) {
					context.canceled = result === false;
					if (context.canceled) return when.reject(context);

					context.phase = beforePhase;
					strategyApi = createStrategyApi(context, self.eventProcessor);

					return strategy(source, undef, data, type, strategyApi);
				}
			).then(
				function () {
					context.phase = propagatingPhase;
					return when.map(adapters, function (adapter) {
						if (source != adapter) {
							return strategy(source, adapter, data, type, strategyApi);
						}
					});
				}
			).then(
				function () {
					context.phase = context.canceled
						? canceledPhase
						: afterPhase;
					return strategy(source, undef, data, type, strategyApi);
				}
			).then(
				function (result) {
					context.canceled = result === false;
					if (context.canceled) return when.reject(context);

					return self.dispatchEvent(eventProcessor.makeEventName(type), data);
				}
			).then(
				function () {
					return context;
				}
			);
		},

		destroy: function () {
				var adapters, adapter;

			adapters = this.adapters;

			while ((adapter = adapters.pop())) {
				if (typeof adapter.destroy == 'function') {
					adapter.destroy();
				}
			}
		},

		addApi: function (name) {
			this._addApiMethod(name);
			this._addApiEvent(name);
		},

		_createAdapterProxy: function (adapter, options) {
			var eventFinder, name, method, proxy;

			proxy = Object.create(adapter);

			// keep copy of original source so we can match it up later
			if('provide' in options) {
				proxy.provide = options.provide;
			}

			// sniff for event hooks
			eventFinder = this.configureEventFinder(options.eventNames);

			// override methods that require event hooks
			for (name in adapter) {
				method = adapter[name];
				if (typeof method == 'function' && eventFinder(name)) {
					// store original method on proxy (to stop recursion)
					proxy[name] = callOriginalMethod(adapter, method);
					// change public api of adapter to call back into hub
					observeMethod(this.eventProcessor, adapter, name, method);
					// ensure hub has a public method of the same name
					this.addApi(name);
				}
			}

			return proxy;
		},

		configureEventFinder: function (option) {
			var eventTypes = this.eventTypes;
			return typeof option == 'function'
				? option
				: function (name) { return name in eventTypes; };
		},

		_addApiMethod: function (name) {
			var adapters, self, eventProcessor;

			adapters = this.adapters;
			eventProcessor = this.eventProcessor;
			self = this;

			if (!this[name]) {
				this[name] = function (anything) {
					var sourceInfo;

					sourceInfo = self._findItemFor(anything);

					if(!sourceInfo) {
						sourceInfo = {
							item: anything,
							source: findAdapterForSource(arguments[1], adapters)
						};
					}

					return eventProcessor.queueEvent(sourceInfo.source, sourceInfo.item, name);
				};
			}
		},

		_addApiEvent: function (name) {
			var eventName = this.eventProcessor.makeEventName(name);
			// add function stub to api
			if (!this[eventName]) {
				this[eventName] = function (data) {};
			}
			// add beforeXXX stub, too
			eventName = this.eventProcessor.makeBeforeEventName(name);
			if (!this[eventName]) {
				this[eventName] = function (data) {};
			}
		},

		_findItemFor: function (anything) {
			var item, i, adapters, adapter;

			adapters = this.adapters;

			// loop through adapters that have the getItemForEvent() method
			// to try to find out which adapter and which data item
			i = 0;
			while (!item && (adapter = adapters[i++])) {
				if (adapter.findItem) {
					item = adapter.findItem(anything);
				}
			}

			return item && { item: item };
		}
	};

	return BaseHub;

	function createStrategyApi (context, eventProcessor) {
		return {
			queueEvent: function(source, data, type) {
				return eventProcessor.queueEvent(source, data, type);
			},
			cancel: function () { context.canceled = true; },
			isCanceled: function () { return !!context.canceled; },
			handle: function () { context.handled = true; },
			isHandled: function () { return !!context.handled; },
			isBefore: function () { return isPhase(beforePhase); },
			isAfter: function () { return isPhase(afterPhase); },
			isAfterCanceled: function () { return isPhase(canceledPhase); },
			isPropagating: function () { return isPhase(propagatingPhase); }
		};

		function isPhase (phase) {
			return context.phase == phase;
		}
	}

	function callOriginalMethod (adapter, orig) {
		return function () {
			return orig.apply(adapter, arguments);
		};
	}

	function observeMethod (queue, adapter, type, origMethod) {
		return adapter[type] = function (data) {
			queue.queueEvent(adapter, data, type);
			return origMethod.call(adapter, data);
		};
	}

	function findAdapterForSource (source, adapters) {
		var i, adapter, found;

		// loop through adapters and find which one was created for this source
		i = 0;
		while (!found && (adapter = adapters[i++])) {
			if (adapter.origSource == source) {
				found = adapter;
			}
		}

		return found;
	}

});
}(typeof define === 'function' ? define : function(factory) { module.exports = factory(require); }));
/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * Base wire plugin that provides properties, init, and destroy facets, and
 * a proxy for plain JS objects.
 *
 * wire is part of the cujo.js family of libraries (http://cujojs.com/)
 *
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 */

(function(define) { 'use strict';
define('wire/lib/plugin/basePlugin', ['require', 'when/when', 'wire/lib/object', 'wire/lib/functional', 'wire/lib/instantiate', 'wire/lib/invoker'], function (require, $cram_r0, $cram_r1, $cram_r2, $cram_r3, $cram_r4) {

	var when, object, functional, instantiate, createInvoker,
		whenAll, obj, pluginInstance, undef;

	when = $cram_r0;
	object = $cram_r1;
	functional = $cram_r2;
	instantiate = $cram_r3;
	createInvoker = $cram_r4;

	whenAll = when.all;

	obj = {};

	function asArray(it) {
		return Array.isArray(it) ? it : [it];
	}

	function invoke(func, proxy, args, wire) {
        return when(wire(args, func, proxy.path),
			function (resolvedArgs) {
				return proxy.invoke(func, asArray(resolvedArgs));
			}
		);
	}

	function invokeAll(facet, wire) {
		var options = facet.options;

		if(typeof options == 'string') {
			return invoke(options, facet, [], wire);

		} else {
			var promises, funcName;
			promises = [];

			for(funcName in options) {
				promises.push(invoke(funcName, facet, options[funcName], wire));
			}

			return whenAll(promises);
		}
	}

	//
	// Mixins
	//

	function mixin(target, src) {
		var name, s;

		for(name in src) {
			s = src[name];
			if(!(name in target) || (target[name] !== s && (!(name in obj) || obj[name] !== s))) {
				target[name] = s;
			}
		}

		return target;
	}

	function doMixin(target, introduction, wire) {
		introduction = typeof introduction == 'string'
			? wire.resolveRef(introduction)
			: wire(introduction);

		return when(introduction, mixin.bind(null, target));
	}

	function mixinFacet(resolver, facet, wire) {
		var target, intros;

		target = facet.target;
		intros = facet.options;

		if(!Array.isArray(intros)) {
			intros = [intros];
		}

		resolver.resolve(when.reduce(intros, function(target, intro) {
			return doMixin(target, intro, wire);
		}, target));
	}

    /**
     * Factory that handles cases where you need to create an object literal
     * that has a property whose name would trigger another wire factory.
     * For example, if you need an object literal with a property named "create",
     * which would normally cause wire to try to construct an instance using
     * a constructor or other function, and will probably result in an error,
     * or an unexpected result:
     * myObject: {
     *      create: "foo"
     *    ...
     * }
     *
     * You can use the literal factory to force creation of an object literal:
     * myObject: {
     *    literal: {
     *      create: "foo"
     *    }
     * }
     *
     * which will result in myObject.create == "foo" rather than attempting
     * to create an instance of an AMD module whose id is "foo".
     */
	function literalFactory(resolver, spec /*, wire */) {
		resolver.resolve(spec.options);
	}

	/**
	 * @deprecated Use create (instanceFactory) instead
	 * @param resolver
	 * @param componentDef
	 * @param wire
	 */
	function protoFactory(resolver, componentDef, wire) {
		var parentRef, promise;

        parentRef = componentDef.options;

        promise = typeof parentRef === 'string'
                ? wire.resolveRef(parentRef)
                : wire(parentRef);

		resolver.resolve(promise.then(Object.create));
	}

	function propertiesFacet(resolver, facet, wire) {

		var properties, path, setProperty, propertiesSet;

		properties = facet.options;
		path = facet.path;
		setProperty = facet.set.bind(facet);

		propertiesSet = when.map(Object.keys(facet.options), function(key) {
			return wire(properties[key], facet.path)
				.then(function(wiredProperty) {
					setProperty(key, wiredProperty);
				}
			);
		});

		resolver.resolve(propertiesSet);
	}

	function invokerFactory(resolver, componentDef, wire) {

		var invoker = wire(componentDef.options).then(function (invokerContext) {
			// It'd be nice to use wire.getProxy() then proxy.invoke()
			// here, but that means the invoker must always return
			// a promise.  Not sure that's best, so for now, just
			// call the method directly
			return createInvoker(invokerContext.method, invokerContext.args);
		});

		resolver.resolve(invoker);
	}

	function invokerFacet(resolver, facet, wire) {
		resolver.resolve(invokeAll(facet, wire));
	}

    //noinspection JSUnusedLocalSymbols
    /**
     * Wrapper for use with when.reduce that calls the supplied destroyFunc
     * @param [unused]
     * @param destroyFunc {Function} destroy function to call
     */
    function destroyReducer(unused, destroyFunc) {
        return destroyFunc();
    }

	function cloneFactory(resolver, componentDef, wire) {
		var sourceRef, options, cloned;

		if (wire.resolver.isRef(componentDef.options.source)) {
			sourceRef = componentDef.options.source;
			options = componentDef.options;
		}
		else {
			sourceRef = componentDef.options;
			options = {};
		}

		cloned = wire(sourceRef).then(function (ref) {
			return when(wire.getProxy(ref), function (proxy) {
				if (!proxy.clone) {
					throw new Error('No clone function found for ' + componentDef.id);
				}

				return proxy.clone(options);
			});
		});

		resolver.resolve(cloned);
	}

	function moduleFactory(resolver, componentDef, wire) {
		resolver.resolve(wire.loadModule(componentDef.options));
	}

	/**
	 * Factory that uses an AMD module either directly, or as a
	 * constructor or plain function to create the resulting item.
	 *
	 * @param {Object} resolver resolver to resolve with the created component
	 * @param {Object} componentDef portion of the spec for the component to be created
	 * @param {function} wire
	 */
	function instanceFactory(resolver, componentDef, wire) {
		var create, args, isConstructor, module, instance;

		create = componentDef.options;

		if (typeof create == 'string') {
			module = wire.loadModule(create);
		} else if(wire.resolver.isRef(create)) {
			module = wire(create);
		} else if(object.isObject(create) && create.module) {
			module = wire.loadModule(create.module);
			args = create.args ? wire(asArray(create.args)) : [];
			isConstructor = create.isConstructor;
		} else {
			module = create;
		}

		instance = when.join(module, args).spread(createInstance);

		resolver.resolve(instance);

		// Load the module, and use it to create the object
		function createInstance(module, args) {
			// We'll either use the module directly, or we need
			// to instantiate/invoke it.
			return typeof module == 'function'
				? instantiate(module, args, isConstructor)
				: Object.create(module);
		}
	}

	function composeFactory(resolver, componentDef, wire) {
		var options, promise;

		options = componentDef.options;

		if(typeof options == 'string') {
			promise = functional.compose.parse(undef, options, wire);
		} else {
			// Assume it's an array of things that will wire to functions
			promise = when(wire(options), function(funcArray) {
				return functional.compose(funcArray);
			});
		}

		resolver.resolve(promise);
	}

	pluginInstance = {
		factories: {
			module: moduleFactory,
			create: instanceFactory,
			literal: literalFactory,
			prototype: protoFactory,
			clone: cloneFactory,
			compose: composeFactory,
			invoker: invokerFactory
		},
		facets: {
			// properties facet.  Sets properties on components
			// after creation.
			properties: {
				configure: propertiesFacet
			},
			mixin: {
				configure: mixinFacet
			},
			// init facet.  Invokes methods on components during
			// the "init" stage.
			init: {
				initialize: invokerFacet
			},
			// ready facet.  Invokes methods on components during
			// the "ready" stage.
			ready: {
				ready: invokerFacet
			},
			// destroy facet.  Registers methods to be invoked
			// on components when the enclosing context is destroyed
			destroy: {
				destroy: invokerFacet
			}
		}
	};

	// "introduce" is deprecated, but preserved here for now.
	pluginInstance.facets.introduce = pluginInstance.facets.mixin;

	return function(/* options */) {
		return pluginInstance;
	};
});
})(typeof define == 'function'
	? define
	: function(factory) { module.exports = factory(require); }
);
/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author brian@hovercraftstudios.com
 */

(function(define) { 'use strict';
define('wire/lib/scope', ['require', 'when/when', 'when/sequence', 'wire/lib/array', 'wire/lib/object', 'wire/lib/loader', 'wire/lib/ComponentFactory', 'wire/lib/lifecycle', 'wire/lib/resolver', 'wire/lib/WireProxy', 'wire/lib/plugin/registry'], function (require, $cram_r0, $cram_r1, $cram_r2, $cram_r3, $cram_r4, $cram_r5, $cram_r6, $cram_r7, $cram_r8, $cram_r9) {

	var when, defer, sequence, array, object, loader,
		ComponentFactory, Lifecycle, Resolver, WireProxy, PluginRegistry,
		undef;

	when = $cram_r0;
	sequence = $cram_r1;
	array = $cram_r2;
	object = $cram_r3;
	loader = $cram_r4;
	ComponentFactory = $cram_r5;
	Lifecycle = $cram_r6;
	Resolver = $cram_r7;
	WireProxy = $cram_r8;
	PluginRegistry = $cram_r9;

	defer = when.defer;

	function Scope(parent, options) {
		this.parent = parent||{};
		object.mixin(this, options);
	}

	Scope.prototype = {

		init: function(spec) {

			this._inherit(this.parent);
			this._init();
			this._configure();

			return this._startup(spec).yield(this);
		},

		_inherit: function(parent) {

			this.instances = this._inheritInstances(parent);
			this.components = object.inherit(parent.components);

			this.path = this._createPath(this.name, parent.path);

			this.plugins = parent.plugins;

			this.initializers = array.delegate(this.initializers);

			this.moduleLoader = loader(this.require, parent.moduleLoader).load;

			// TODO: Fix this
			// When the parent begins its destroy phase, this child must
			// begin its destroy phase and complete it before the parent.
			// The context hierarchy will be destroyed from child to parent.
			if (parent.destroyed) {
				when(parent.destroyed, this.destroy.bind(this));
			}
		},

		_inheritInstances: function(parent) {
			return object.inherit(parent.instances);
		},

		_createChild: function(spec, options) {
			return this.createContext(spec, this, options);
		},

		_init: function() {
			this._pluginApi = this._initPluginApi();
		},

		_initPluginApi: function() {
			// Plugin API
			// wire() API that is passed to plugins.
			var self, pluginApi;

			self = this;
			pluginApi = {};

			pluginApi.contextualize = function(name) {
				function contextualApi(spec, id) {
					return self._resolveItem(self._createComponentDef(id, spec));
				}

				contextualApi.createChild = self._createChild.bind(self);
				contextualApi.loadModule = self.getModule.bind(self);
				contextualApi.resolver = self.resolver;
				contextualApi.addComponent = addComponent;
				contextualApi.addInstance = addInstance;

				contextualApi.resolveRef = function(ref) {
					var onBehalfOf = arguments.length > 1 ? arguments[2] : name;
					return self._resolveRef(ref, onBehalfOf);
				};

				contextualApi.getProxy = function(nameOrComponent) {
					var onBehalfOf = arguments.length > 1 ? arguments[2] : name;
					return self.getProxy(nameOrComponent, onBehalfOf);
				};

				return contextualApi;
			};

			return pluginApi;

			function addComponent(component, id) {
				var def, instance;

				def = self._createComponentDef(id);
				instance = self.componentFactory.processComponent(def, component);

				return self._makeResolvable(def, instance);
			}

			function addInstance(instance, id) {
				self._makeResolvable(self._createComponentDef(id), instance);
				return when.resolve(instance);
			}
		},

		_configure: function() {
			var plugins, pluginApi, self, destroyed;

			plugins = this.plugins;
			pluginApi = this._pluginApi;

			this.resolver = this._createResolver(plugins, pluginApi);
			this.componentFactory = this._createComponentFactory(plugins, pluginApi);

			self = this;
			destroyed = defer();
			this.destroyed = destroyed.promise;

			this._destroy = function() {
				this._destroy = noop;
				destroyed.resolve();

				return this._destroyComponents().then(function() {
					return self._releaseResources();
				});
			};
		},

		_startup: function(spec) {
			var self = this;

			return this._executeInitializers().then(function() {
				var parsed = self._parseSpec(spec);
				return self._createComponents(parsed).then(function() {
					return self._awaitInstances(parsed);
				});
			});
		},

		destroy: function() {
			return this._destroy();
		},

		_destroy: noop,

		_destroyComponents: function() {
			var instances = this.instances;

			return this.componentFactory.destroy().then(function() {
				for (var p in  instances) {
					delete instances[p];
				}
			});
		},

		_releaseResources: function() {
			// Free Objects
			this.instances = this.components = this.parent
				= this.resolver = this.componentFactory
				= this._pluginApi = this.plugins
				= undef;
		},

		getModule: function(moduleId) {
			return typeof moduleId == 'string'
				? this.moduleLoader(moduleId)
				: when.resolve(moduleId);
		},

		getProxy: function(nameOrComponent, onBehalfOf) {
			var componentFactory = this.componentFactory;
			return typeof nameOrComponent == 'string'
				? when(this._resolveRefName(nameOrComponent, {}, onBehalfOf), function (component) {
					return componentFactory.createProxy(component);
				})
				: componentFactory.createProxy(nameOrComponent);
		},

		_createResolver: function(plugins, pluginApi) {
			return new Resolver(plugins.resolvers, pluginApi);
		},

		_createComponentFactory: function(plugins, pluginApi) {
			var self, factory, init, lifecycle;

			self = this;

			lifecycle = new Lifecycle(plugins, pluginApi);
			factory = new ComponentFactory(lifecycle, plugins, pluginApi);

			init = factory.initInstance;
			factory.initInstance = function() {
				return when(init.apply(factory, arguments), function(proxy) {
					return self._makeResolvable(proxy.metadata, proxy);
				});
			};

			return factory;
		},

		_executeInitializers: function() {
			return sequence(this.initializers, this);
		},

		_parseSpec: function(spec) {
			var instances, components, plugins, id, d;

			instances = this.instances;
			components = {};

			// Setup a promise for each item in this scope
			for (id in spec) {
				if(id === '$plugins' || id === 'plugins') {
					plugins = spec[id];
				} else if (!object.hasOwn(instances, id)) {
					// An initializer may have inserted concrete components
					// into the context.  If so, they override components of the
					// same name from the input spec
					d = defer();
					components[id] = this._createComponentDef(id, spec[id], d.resolver);
					instances[id] = d.promise;
				}
			}

			return {
				plugins: plugins,
				components: components,
				instances: instances
			};
		},

		_createComponentDef: function(id, spec, resolver) {
			return {
				id: id,
				spec: spec,
				path: this._createPath(id, this.path),
				resolver: resolver
			};
		},

		_createComponents: function(parsed) {
			// Process/create each item in scope and resolve its
			// promise when completed.
			var self, components;

			self = this;
			components = parsed.components;
			return when.map(Object.keys(components), function(name) {
				return self._createScopeItem(components[name]);
			});
		},

		_awaitInstances: function(parsed) {
			var instances = parsed.instances;
			return when.map(Object.keys(instances), function(id) {
				return instances[id];
			});
		},

		_createScopeItem: function(component) {
			// NOTE: Order is important here.
			// The object & local property assignment MUST happen before
			// the chain resolves so that the concrete item is in place.
			// Otherwise, the whole scope can be marked as resolved before
			// the final item has been resolved.
			var self, item;

			self = this;
			item = this._resolveItem(component).then(function (resolved) {
				self._makeResolvable(component, resolved);
				return resolved;
			});

			component.resolver.resolve(item);
			return item;
		},

		_makeResolvable: function(component, instance) {
			var id = component.id;
			if(id != null) {
				this.instances[id] = WireProxy.getTarget(instance);
			}

			return instance;
		},

		_resolveItem: function(component) {
			var item, spec;

			spec = component.spec;

			if (this.resolver.isRef(spec)) {
				// Reference
				item = this._resolveRef(spec, component.id);
			} else {
				// Component
				item = this._createItem(component);
			}

			return item;
		},

		_createItem: function(component) {
			var created, spec;

			spec = component.spec;

			if (Array.isArray(spec)) {
				// Array
				created = this._createArray(component);

			} else if (object.isObject(spec)) {
				// component spec, create the component
				created = this._createComponent(component);

			} else {
				// Plain value
				created = when.resolve(spec);
			}

			return created;
		},

		_createArray: function(component) {
			var self, id, i;

			self = this;
			id = component.id;
			i = 0;

			// Minor optimization, if it's an empty array spec, just return an empty array.
			return when.map(component.spec, function(item) {
				var componentDef = self._createComponentDef(id + '[' + (i++) + ']', item);
				return self._resolveItem(componentDef);
			});
		},

		_createComponent: function(component) {
			var self = this;

			return this.componentFactory.create(component)
				.otherwise(function (reason) {
					if(reason !== component) {
						throw reason;
					}

					// No factory found, treat object spec as a nested scope
					return new Scope(self)
						.init(component.spec)
						.then(function (childScope) {
							// TODO: find a lighter weight solution
							// We're paying the cost of creating a complete scope,
							// then discarding everything except the instance map.
							return object.mixin({}, childScope.instances);
						}
					);
				}
			);
		},

		_resolveRef: function(ref, onBehalfOf) {
			var scope;

			ref = this.resolver.parse(ref);
			scope = onBehalfOf == ref.name && this.parent.instances ? this.parent : this;

			return this._doResolveRef(ref, scope.instances, onBehalfOf);
		},

		_resolveRefName: function(refName, options, onBehalfOf) {
			var ref = this.resolver.create(refName, options);

			return this._doResolveRef(ref, this.instances, onBehalfOf);
		},

		_doResolveRef: function(ref, scope, onBehalfOf) {
			return ref.resolve(function (name) {
				return resolveDeepName(name, scope);
			}, onBehalfOf);
		},

		_createPath: function(name, basePath) {
			var path = basePath || this.path;
			return (path && name) ? (path + '.' + name) : name;
		}
	};

	return Scope;

	function resolveDeepName(name, scope) {
		var parts = name.split('.');

		if(parts.length > 2) {
			return when.reject('Only 1 "." is allowed in refs: ' + name);
		}

		return when.reduce(parts, function(scope, segment) {
			return segment in scope
				? scope[segment]
				: when.reject('Cannot resolve ref: ' + name);
		}, scope);
	}

	function noop() {}

});
})(typeof define == 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }
);
/**
 * Collection
 */
(function(define) {
define('cola/Collection', ['require', 'cola/hub/Base', 'cola/collectionAdapterResolver', 'cola/network/strategy/default'], function (require, $cram_r0, $cram_r1, $cram_r2) {

	var Base, resolver, eventTypes, simpleStrategy;

	Base = $cram_r0;
	resolver = $cram_r1;
	simpleStrategy = $cram_r2;

	eventTypes = extend(Base.prototype.eventTypes, {
		// collection item events. most of these come with data. devs can
		// decide to use these events for their own purposes or send
		// different data than described here, the following list outlines
		// the intended behavior.
		add: 1, // data == item added
		remove: 1, // data == item removed
		target: 1, // data == item targeted TODO: rename this to "point"?
		// multi-item events
		select: 1, // select an item (data == item)
		unselect: 1, // deselect an item (data == item)
		// batch events
		collect: 1, // start of batch mode (until abort or submit) (data = batch purpose)
		deliver: 1 // collected items (data = batch purpose with collected items array as property)
	});

	function Collection(options) {
		Base.call(this, options);

		if(!options) {
			options = {};
		}

		this.strategy = options.strategy;
		if (!this.strategy) this.strategy = simpleStrategy(options.strategyOptions);

	}

	Collection.prototype = Object.create(Base.prototype, {

		eventTypes: { value: eventTypes },

		resolver: { value: resolver },

		forEach: {
			value: function forEach(lambda) {
				var provider = this.getProvider();
				return provider && provider.forEach(lambda);
			}
		},

		findItem: {
			value: function (anything) {
				var info = this._findItemFor(anything);
				return info && info.item;
			}
		},

		findNode: {
			value: function (anything) {
				var info = this._findNodeFor(anything);
				return info && info.node;
			}
		},

		getProvider: {
			value: function () {
				var a, i = this.adapters.length;
				while(a = this.adapters[--i]) {
					if(a.provide) return a;
				}
			}
		},

		_findNodeFor: {
			value: function (anything) {
				var node, i, adapters, adapter;

				adapters = this.adapters;

				// loop through adapters that have the findNode() method
				// to try to find out which adapter and which node
				i = 0;
				while (!node && (adapter = adapters[i++])) {
					if (adapter.findNode) {
						node = adapter.findNode(anything);
					}
				}

				return node && { node: node };
			}
		}

	});

	return Collection;

	function extend(base, mixin) {
		var extended = Object.create(base);
		for(var p in mixin) {
			extended[p] = mixin[p];
		}

		return extended;
	}

});
}(typeof define === 'function' ? define : function(factory) { module.exports = factory(require); }));
/**
 * defaultPlugins
 * @author: brian
 */
(function(define) {
define('wire/lib/plugin/defaultPlugins', ['require', 'wire/lib/plugin/wirePlugin', 'wire/lib/plugin/basePlugin'], function (require, $cram_r0, $cram_r1) {

	return [
		$cram_r0,
		$cram_r1
	];

});
}(typeof define === 'function' ? define : function(factory) { module.exports = factory(require); }));
/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 */

(function(define){ 'use strict';
define('wire/lib/Container', ['require', 'when/when', 'wire/lib/advice', 'wire/lib/WireContext', 'wire/lib/scope', 'wire/lib/plugin/registry', 'wire/lib/plugin/defaultPlugins', 'wire/lib/graph/DirectedGraph', 'wire/lib/graph/trackInflightRefs'], function (require, $cram_r0, $cram_r1, $cram_r2, $cram_r3, $cram_r4, $cram_r5, $cram_r6, $cram_r7) {

	var when, advice, WireContext, Scope, PluginRegistry, defaultPlugins,
		DirectedGraph, trackInflightRefs, slice, scopeProto, undef;

	when = $cram_r0;
	advice = $cram_r1;
	WireContext = $cram_r2;
	Scope = $cram_r3;
	PluginRegistry = $cram_r4;
	defaultPlugins = $cram_r5;
	DirectedGraph = $cram_r6;
	trackInflightRefs = $cram_r7;
	slice = Array.prototype.slice;

	scopeProto = Scope.prototype;

	function Container() {
		Scope.apply(this, arguments);
	}

	/**
	 * Container inherits from Scope, adding plugin support and
	 * context level events.
	 */
	Container.prototype = Object.create(scopeProto, {
		_inheritInstances: { value: function(parent) {
			var publicApi = {
				wire: this._createChild.bind(this),
				destroy: this.destroy.bind(this),
				resolve: this._resolveRef.bind(this)
			};

			return WireContext.inherit(parent.instances, publicApi);
		}},

		_init: { value: advice.after(
			scopeProto._init,
			function() {
				this.plugins = new PluginRegistry();
				return this._installDefaultPlugins();
			}
		)},

		_startup: { value: advice.after(
			scopeProto._startup,
			function(started) {
				var self = this;
				return when(started).otherwise(function(e) {
					return self._contextEvent('error', e).yield(started);
				});
			}
		)},

		_installDefaultPlugins: { value: function() {
			return this._installPlugins(defaultPlugins);
		}},

		_installPlugins: { value: function(plugins) {
			if(!plugins) {
				return when.resolve();
			}

			var self, registry, installed;

			self = this;
			registry = this.plugins;

			if(Array.isArray(plugins)) {
				installed = plugins.map(function(plugin) {
					return installPlugin(plugin);
				});
			} else {
				installed = Object.keys(plugins).map(function(namespace) {
					return installPlugin(plugins[namespace], namespace);
				});
			}

			return when.all(installed);

			function installPlugin(pluginSpec, namespace) {
				var module, t;

				t = typeof pluginSpec;
				if(t == 'string') {
					module = pluginSpec;
					pluginSpec = {};
				} else if(typeof pluginSpec.module == 'string') {
					module = pluginSpec.module;
				} else {
					module = pluginSpec;
				}

				return self.getModule(module).then(function(plugin) {
					return registry.scanModule(plugin, pluginSpec, namespace);
				});
			}
		}},

		_createResolver: { value: advice.after(
			scopeProto._createResolver,
			function(resolver) {
				return trackInflightRefs(
					new DirectedGraph(), resolver, this.refCycleTimeout);
			}
		)},

		_contextEvent: { value: function (type, data) {
			var api, listeners;

			if(!this.contextEventApi) {
				this.contextEventApi = this._pluginApi.contextualize(this.path);
			}

			api = this.contextEventApi;
			listeners = this.plugins.contextListeners;

			return when.reduce(listeners, function(undef, listener) {
				var d;

				if(listener[type]) {
					d = when.defer();
					listener[type](d.resolver, api, data);
					return d.promise;
				}

				return undef;
			}, undef);
		}},

		_createComponents: { value: advice.beforeAsync(
			scopeProto._createComponents,
			function(parsed) {
				var self = this;
				return this._installPlugins(parsed.plugins).then(function() {
					return self._contextEvent('initialize');
				});
			}
		)},

		_awaitInstances: { value: advice.afterAsync(
			scopeProto._awaitInstances,
			function() {
				return this._contextEvent('ready');
			}
		)},

		_destroyComponents: { value: advice.beforeAsync(
			scopeProto._destroyComponents,
			function() {
				return this._contextEvent('shutdown');
			}
		)},

		_releaseResources: { value: advice.beforeAsync(
			scopeProto._releaseResources,
			function() {
				return this._contextEvent('destroy');
			}
		)}
	});

	return Container;

});
}(typeof define === 'function' ? define : function(factory) { module.exports = factory(require); }));
/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 */

(function(define){ 'use strict';
define('wire/lib/context', ['require', 'wire/lib/loader', 'wire/lib/Container'], function (require, $cram_r0, $cram_r1) {

	var loader, Container;

	loader = $cram_r0;
	Container = $cram_r1;

	/**
	 * Creates a new context from the supplied specs, with the supplied parent context.
	 * If specs is an {Array}, it may be a mixed array of string module ids, and object
	 * literal specs.  All spec module ids will be loaded, and then all specs will be
	 * merged from left-to-right (rightmost wins), and the resulting, merged spec will
	 * be wired.
	 * @private
	 *
	 * @param {String|Object|String[]|Object[]} specs
	 * @param {Object} parent context
	 * @param {Object} [options]
	 *
	 * @return {Promise} a promise for the new context
	 */
	return function createContext(specs, parent, options) {
		// Do the actual wiring after all specs have been loaded

		if(!options) { options = {}; }
		if(!parent)  { parent  = {}; }

		options.createContext = createContext;

		var moduleLoader = loader(options.require, parent.moduleLoader);

		return moduleLoader.merge(specs).then(function(spec) {
			var container = new Container(parent, options);

			// Expose only the component instances and controlled API
			return container.init(spec).then(function(self) {
				return self.instances;
			});
		});
	};

});
}(typeof define === 'function' ? define : function(factory) { module.exports = factory(require); }));
/** @license MIT License (c) copyright B Cavalier & J Hann */

/*jshint sub:true*/

/**
 * wire
 * Javascript IOC Container
 *
 * wire is part of the cujo.js family of libraries (http://cujojs.com/)
 *
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @version 0.9.2
 */
(function(rootSpec, define){ 'use strict';
define('wire/wire', ['require', 'wire/lib/context'], function (require, $cram_r0) {

	var createContext, rootContext, rootOptions;

	wire.version = '0.9.2';

	createContext = $cram_r0;

	rootOptions = { require: require };

	/**
	 * Main Programmtic API.  The top-level wire function that wires contexts
	 * as direct children of the (possibly implicit) root context.  It ensures
	 * that the root context has been wired before wiring children.
	 *
	 * @public
	 *
	 * @param spec {Object|String|Array|Promise} can be any one of the following:
	 *  1. Object - wiring spec
	 *  2. String - module id of the wiring spec to load and then wire
	 *  3. Array - mixed array of Strings and Objects, each of which is either
	 *   a wiring spec, or the module id of a wiring spec
	 *  4. Promise - a promise for any of the above
	 *  @param options {Object} wiring options
	 *  @param [options.require] {Function} the platform loader function.  Wire will
	 *   attempt to automatically detect what loader to use (AMD, CommonJS, etc.), but
	 *   if you want to explicitly provide it, you can do so.  In some cases this can
	 *   be useful such as providing a local AMD require function so that module ids
	 *   *within the wiring spec* can be relative.
	 *  @return {Promise} a promise for the resulting wired context
	 */
	function wire(spec, options) {

		// If the root context is not yet wired, wire it first
		if (!rootContext) {
			rootContext = createContext(rootSpec, null, rootOptions);
		}

		// Use the rootContext to wire all new contexts.
		return rootContext.then(function (root) {
			return root.wire(spec, options);
		});
	}

	/**
	 * AMD Loader plugin API
	 * @param name {String} spec module id, or comma-separated list of module ids
	 * @param require {Function} loader-provide local require function
	 * @param callback {Function} callback to call when wiring is completed. May have
	 *  and error property that a function to call to inform the AMD loader of an error.
	 *  See here: https://groups.google.com/forum/?fromgroups#!topic/amd-implement/u0f161drdJA
	 */
	wire.load = function amdLoad(name, require, callback /*, config */) {
		// If it's a string, try to split on ',' since it could be a comma-separated
		// list of spec module ids
		var errback = callback.error || function(e) {
			// Throw uncatchable exception for loaders that don't support
			// AMD error handling.  This will propagate up to the host environment
			setTimeout(function() { throw e; }, 0);
		};

		wire(name.split(','), { require: require }).then(callback, errback);
	};

	/**
	 * AMD Builder plugin API
	 */
	// pluginBuilder: './builder/rjs'
	wire['pluginBuilder'] = './builder/rjs';
	wire['cramPlugin'] = './builder/cram';

	return wire;

});
})(
	this['wire'] || {},
	typeof define == 'function' && define.amd
		? define : function(factory) { module.exports = factory(require); }
);

;define('app/main', ['wire/wire', 'wire/dom', 'wire/dom/render', 'app/hello-sample/spec', 'app/contacts-sample/spec', 'app/homepage-sample/spec', 'curl/plugin/i18n!app/subheader/strings', 'app/subheader/selectText', 'curl/plugin/text!app/subheader/template.html', 'curl/plugin/css!highlight/github.css', 'wire/on', 'cola/cola', 'hello/app/main', 'app/tabs/spec', 'cola/Collection', 'cola/adapter/Array', 'highlight/amd!hello/app/template.html', 'highlight/amd!hello/app/controller.js', 'highlight/amd!hello/app/strings.js', 'highlight/amd!hello/app/main.js', 'curl/plugin/text!app/contacts-sample/template.html', 'contacts/app/main', 'highlight/amd!contacts/app/controller.js', 'highlight/amd!contacts/app/list/template.html', 'highlight/amd!contacts/app/edit/template.html', 'highlight/amd!contacts/app/main.js', 'highlight/amd!app/main.js', 'highlight/amd!app/subheader/selectText.js', 'highlight/amd!test/subheader/selectText-test.js', 'hello/app/controller', 'curl/plugin/text!hello/app/template.html', 'curl/plugin/i18n!hello/app/strings.js', 'wire/aop', 'app/tabs/controller', 'curl/plugin/text!app/tabs/tabs.html', 'curl/plugin/css!app/tabs/structure.css', 'curl/plugin/text!app/tabs/stack.html', 'wire/connect', 'contacts/app/collection/spec', 'contacts/app/controller', 'curl/plugin/text!contacts/app/edit/template.html', 'curl/plugin/i18n!contacts/app/edit/strings', 'curl/plugin/css!contacts/app/edit/structure.css', 'curl/plugin/text!contacts/app/list/template.html', 'curl/plugin/css!contacts/app/list/structure.css', 'contacts/app/list/compareByLastFirst', 'curl/plugin/css!contacts/theme/basic.css', 'cola/dom/form', 'contacts/app/collection/validateContact', 'cola/adapter/LocalStorage', 'contacts/app/collection/cleanContact', 'contacts/app/collection/generateMetadata'], { 
	helloSample: { wire: 'app/hello-sample/spec' },

	contactsSample: { wire: 'app/contacts-sample/spec' },

	homepageSample: { wire: 'app/homepage-sample/spec' },

	subheaderStrings: { module: 'i18n!app/subheader/strings' },
	subheaderText: {
		create: {
			module: 'app/subheader/selectText',
			args: { $ref: 'subheaderStrings.phrases' }
		}
	},

	subheader: {
		render: {
			template: { module: 'text!app/subheader/template.html' },
			replace: { text: { $ref: 'subheaderText' } },
			at: { $ref: 'first!.subheader' }
		}
	},

	highlightTheme: { module: 'css!highlight/github.css' },

	$plugins: [
		{ module: 'wire/dom', classes: { init: 'loading' } },
		'wire/dom/render'
	]
});
