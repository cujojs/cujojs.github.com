define(['./highlight.pack'], function(highlight) {
	return {
		load: function(name, require, done) {
			require(['text!' + name], function(code) {
				var highlighted, result;

				highlighted = highlight.highlightAuto(code);
				result = '<pre><code class="' + highlighted.language + '">'
					+ highlighted.value + '</code></pre>';
				done(highlight.fixMarkup(result, '  '));
			});
		}
	}
});
