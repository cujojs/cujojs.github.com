/**
 * findTabs
 * @author: brian
 */
(function(define) {
define(function() {

	var slice = [].slice;

	return {
		querySelector: null,
		tabs: null,
		stack: null,
		activeClass: 'active',
		idAttr: 'data-cola-id',

		activate: function(e) {
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
