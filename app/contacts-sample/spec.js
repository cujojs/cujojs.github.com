define({

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