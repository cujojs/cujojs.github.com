define({

	theme: { module: 'theme/basic.css' },

	strings: { module: 'i18n!app/subheader/strings' },

	subheader: {
		element: { $ref: 'dom.first!.subheader' },
		properties: {
			innerHTML: {
				create: { module: 'app/subheader/randomText', args: { $ref: 'strings.phrases'} } }
		}
	},

	contactsContainer: { $ref: 'dom.first!.cujo-contacts-container' },

	contactsAppContainer: {
		render: { module: 'text!app/contacts-app/template.html' },
		insert: { last: { $ref: 'dom.first!.app' }, at: 'contactsContainer' }
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
					id: 'controller.js',
					content: { module: 'highlight!contacts/app/controller.js' }
				},
				{
					id: 'list/template.html',
					content: { module: 'highlight!contacts/app/list/template.html' }
				},
				{
					id: 'edit/template.html',
					content: { module: 'highlight!contacts/app/edit/template.html' }
				}
			]]
		},
		bind: {
			to: { $ref: 'contactsSources' }
		}
	},

	plugins: [
		{ module: 'wire/dom', classes: { init: 'loading' } },
		{ module: 'wire/dom/render' },
		{ module: 'wire/on' },
		{ module: 'wire/aop' },
		{ module: 'cola' }
	]
});