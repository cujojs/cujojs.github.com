define({

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

	$plugins: [
		{ module: 'wire/debug' },
		{ module: 'wire/dom' },
		{ module: 'wire/dom/render' },
		{ module: 'wire/on' },
		{ module: 'cola' }
	]
});