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
				},
				{
					id: 2,
					name: 'selectText.js',
					content: { module: 'highlight!app/subheader/selectText.js' }
				},
				{
					id: 3,
					name: 'selectText-test.js',
					content: { module: 'highlight!test/subheader/selectText-test.js' }
				}
			]]
		},
		bind: { $ref: 'homepageSources' }
	},

	$plugins: ['wire/dom', 'wire/on', 'cola']
});