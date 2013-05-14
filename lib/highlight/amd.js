define(['./highlight.pack'], function(highlight) {

	var map, encodeRx;

	map = { 34: '\\"', 13: '\\r', 12: '\\f', 10: '\\n', 9: '\\t', 8: '\\b' };
	encodeRx = /["\n\f\t\r\b]/g;

	return {

		load: function(name, require, done) {
			require(['text!' + name], function(code) {
				done(toMarkup(code));
			});
		},

		compile: function(pluginId, resId, req, io, config) {
			var absId;

			absId = pluginId + '!' + resId;

			io.read(resId, function (code) {
				io.write(
					'define("' + absId + '", function () {\n' +
					'\treturn "' + jsEncode(toMarkup(code)) + '";\n' +
					'});\n'
				);
			}, io.error);
		}
	};

	function jsEncode (text) {
		return text.replace(encodeRx, function (c) {
			return map[c.charCodeAt(0)];
		});
	}

	function toMarkup(code) {
		var highlighted, result;

		highlighted = highlight.highlightAuto(code);
		result = '<pre><code class="' + highlighted.language + '">'
			+ highlighted.value + '</code></pre>';
		return highlight.fixMarkup(result, '  ');
	}
});
