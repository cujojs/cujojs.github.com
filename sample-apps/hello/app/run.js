(function(curl) {

	var config = {
		packages: [
			// Add third-party packages here
			{ name: 'curl', location: 'lib/curl/src/curl' },
			{ name: 'wire', location: 'lib/wire', main: 'wire' },
			{ name: 'cola', location: 'lib/cola', main: 'cola' },
			{ name: 'when', location: 'lib/when', main: 'when' },
			{ name: 'meld', location: 'lib/meld', main: 'meld' },
			{ name: 'poly', location: 'lib/poly' }
		],
		// Polyfill everything ES5-ish
		preloads: ['poly/all']
	};

	curl(config, ['wire!app/main']);

})(curl);