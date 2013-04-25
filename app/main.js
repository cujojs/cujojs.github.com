define({ // Wire spec

	helloSample: {
		wire: { spec: 'app/hello-sample/spec' }
	},

	contactsSample: {
		wire: { spec: 'app/contacts-sample/spec' }
	},

	homepageSample: {
		wire: { spec: 'app/homepage-sample/spec' }
	},

	theme: { module: 'css!theme/basic.css' },

	subheader: {
		render: {
			template: { module: 'text!app/subheader/template.html' },
			replace: { text: { $ref: 'subheaderText' } }
		},
		insert: { last: { $ref: 'first!.header-content' } }
	},

	subheaderText: {
		create: {
			module: 'app/subheader/randomText',
			args: { module: 'i18n!app/subheader/strings' }
		}
	},

	$plugins: [
		'wire/debug',
		{ module: 'wire/dom', classes: { init: 'loading' } },
		'wire/dom/render'
	]
});