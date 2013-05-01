var buster, assert, sentinel;

buster = require('buster');
assert = buster.assert;
sentinel = {};

buster.testCase('controller', {
	'should update node.innerHTML': function() {
		var controller, node;

		node = {};

		controller = Object.create(require('../app/controller'));
		controller.node = node;
		controller.update({ target: { value: sentinel }});

		assert.same(node.innerHTML, sentinel);
	}
});