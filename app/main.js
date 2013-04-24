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

	helloSample: {
		wire: { spec: 'app/hello-sample/spec' }
	},

	contactsSample: {
		wire: { spec: 'app/contacts-sample/spec' }
	},

	$plugins: [
		{ module: 'wire/dom', classes: { init: 'loading' } },
	]
});