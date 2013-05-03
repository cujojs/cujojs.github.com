(function(define) {
define(function(require) {

	var buster, selectText;

	buster = require('buster');
	selectText = require('../../app/subheader/selectText');

	buster.testCase('subheader/selectText', {
		'should return empty string when input is empty': function() {
			assert.equals(selectText([]), '');
		},

		'should call provided selector function': function() {
			var spy, input;

			input = ['a', 'b', 'c'];
			spy = this.stub().returns(1);

			selectText(input, spy);
			assert.calledOnceWith(spy, input.length);
		},

		'should return selected string': function() {
			var spy, input;

			input = ['a', 'b', 'c'];
			spy = this.stub().returns(1);

			assert.equals(selectText(input, spy), 'b');
		}
	});

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));

