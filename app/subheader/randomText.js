(function(define) {
define(function(require) {

	var when = require('when');

	return function(source) {
		return when(source, function(source) {
			return source[Math.floor(Math.random() * source.length)];
		});
	};

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
