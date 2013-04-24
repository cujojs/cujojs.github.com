define({

	theme: { module: 'css!theme/basic.css' },

	strings: { module: 'i18n!app/subheader/strings' },

	subheader: {
		element: { $ref: 'dom.first!.subheader' },
		properties: {
			innerHTML: {
				create: { module: 'app/subheader/randomText', args: { $ref: 'strings.phrases'} } }
		}
	},

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
		bind: {
			to: { $ref: 'helloSources' }
		}
	},

	contactsContainer: { $ref: 'dom.first!.cujo-contacts-container' },

	contactsAppContainer: {
		render: { module: 'text!app/contacts-app/template.html' },
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
				}
			]]
		},
		bind: {
			to: { $ref: 'contactsSources' }
		}
	},

	plugins: [
//		{ module: 'wire/debug' },
		{ module: 'wire/dom', classes: { init: 'loading' } },
		{ module: 'wire/dom/render' },
		{ module: 'wire/on' },
		{ module: 'wire/aop' },
		{ module: 'cola' }
	]
});