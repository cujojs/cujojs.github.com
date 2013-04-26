(function(curl) {

	var config = {
		// baseUrl: '',
		//paths: {
			// Configure paths here
		//},
		packages: [
			// Define application-level packages
			{ name: 'contacts', location: 'sample-apps/contacts' },
			{ name: 'hello', location: 'sample-apps/hello' },

			// Add third-party packages here
			{ name: 'curl', location: 'lib/curl/src/curl' },
			{ name: 'wire', location: 'lib/wire', main: 'wire' },
			{ name: 'cola', location: 'lib/cola', main: 'cola' },
			{ name: 'when', location: 'lib/when', main: 'when' },
			{ name: 'meld', location: 'lib/meld', main: 'meld' },
			{ name: 'poly', location: 'lib/poly' },

			{ name: 'highlight', location: 'lib/highlight', main: 'amd' }
		],
		// Polyfill everything ES5-ish
		preloads: ['poly/all']
	};

	curl(config, ['wire!app/main']);

})(curl);