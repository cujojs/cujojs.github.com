define({

	// Load a basic theme. This is just a CSS file, and since a moduleLoader is
	// configured in run.js, curl knows to load this as CSS.
	theme: { module: 'theme/basic.css' },

	strings: { module: 'i18n!app/subheader/strings' },

	subheader: {
		element: { $ref: 'dom.first!.subheader' },
		properties: {
			innerHTML: {
				create: { module: 'app/subheader/randomText', args: { $ref: 'strings.phrases'} } }
		}
	},

	contacts: {
		wire: {
			spec: 'contacts/app/main',
			provide: {
				root: { $ref: 'dom.first!.cujo-contacts' }
			}
		}
	},

	// Wire.js plugins
	plugins: [
		{ module: 'wire/dom', classes: { init: 'loading' } }
	]
});