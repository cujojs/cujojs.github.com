define({

	controller: {
		create: 'app/tabs/controller',
		properties: {
			querySelector: { $ref: 'dom.first!' },
			tabs: { $ref: 'tabs' },
			stack: { $ref: 'stack' }
		},
		on: {
			tabs: { 'click:.item': 'activate' }
		},
		after: {
			'collection.onSync': 'init'
		}
	},

	css: { module: 'css!app/tabs/structure.css' },

	tabs: {
		render: {
			template: { module: 'text!app/tabs/tabs.html' }
		},
		insert: { last: 'root' },
		bind: {
			to: { $ref: 'collection' },
			bindings: {
				id: '.tab-title'
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

	plugins: [
		{ module: 'wire/dom' },
		{ module: 'wire/dom/render' },
		{ module: 'wire/on' },
		{ module: 'wire/aop' },
		{ module: 'cola' }
	]
});