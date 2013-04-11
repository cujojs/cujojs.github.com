define({

	// Load a basic theme. This is just a CSS file, and since a moduleLoader is
	// configured in run.js, curl knows to load this as CSS.
	theme: { module: 'theme/basic.css' },

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
		{ module: 'wire/dom', classes: { init: 'loading' } },
		{ module: 'wire/dom/render' }
	]
});