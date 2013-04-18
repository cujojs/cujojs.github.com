define({

	$exports: {
		render: { module: 'text!app/contacts/app/template.html' }
	},

	contactsCode: {
		wire: {
			spec: 'app/tabs/spec',
			provide: {
				root: { $ref: 'dom.first!.code', at: 'root' },
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
					id: 'controller.js',
					content: { module: 'text!contacts/app/controller.js' }
				},
				{
					id: 'list/template.html',
					content: { module: 'text!contacts/app/list/template.html' }
				}
			]]
		},
		bind: {
			to: { $ref: 'contactsSources' }
		}
	},

	contactsApp: {
		wire: {
			spec: 'contacts/app/main',
			provide: {
				root: { $ref: 'dom.first!.app', at: 'root' }
			}
		}
	},

	plugins: [
		{ module: 'wire/debug' },
		{ module: 'wire/dom', classes: { init: 'loading' } },
		{ module: 'wire/dom/render' },
		{ module: 'wire/on' },
		{ module: 'cola' }
	]

})