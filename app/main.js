define({ // Wire spec

	helloSample: { wire: 'app/hello-sample/spec' },

	contactsSample: { wire: 'app/contacts-sample/spec' },

	homepageSample: { wire: 'app/homepage-sample/spec' },

	subheaderStrings: { module: 'i18n!app/subheader/strings' },
	subheaderText: {
		create: {
			module: 'app/subheader/selectText',
			args: { $ref: 'subheaderStrings.phrases' }
		}
	},

	subheader: {
		element: { $ref: 'first!.subheader' },
		properties: { innerHTML: { $ref: 'subheaderText' } }
	},

	highlightTheme: { module: 'css!highlight/github.css' },

	$plugins: [{ module: 'wire/dom', classes: { init: 'loading' } }]
});