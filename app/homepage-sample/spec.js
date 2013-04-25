define({

	homepageCode: {
		wire: {
			spec: 'app/tabs/spec',
			provide: {
				root: { $ref: 'dom.first!.cujo-homepage-container .code' },
				collection: { $ref: 'homepageSources' }
			}
		}
	},

	homepageSources: { create: 'cola/Collection' },
	homepageSourcesData: {
		create: {
			module: 'cola/adapter/Array',
			args: [[
				{
					id: 1,
					name: 'main.js',
					content: { module: 'highlight!app/main.js' }
				}
			]]
		},
		bind: { $ref: 'homepageSources' }
	},

	$plugins: ['wire/dom', 'wire/on', 'cola']
});