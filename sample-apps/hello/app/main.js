define({ // Wire spec

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