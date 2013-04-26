define(function() {

	/**
	 * Custom comparator to sort contacts by last name, and then
	 * by first name.
	 * NOTE: This algorithm would likely need to be internationalized
	 * @param {object} contact1
	 * @param {object} contact2
	 * @return {number} 0 if contact1 and contact2 have the same last and first name
	 *  -1 if contact1 is alphabetically before contact2
	 *  1 if contact1 is alphabetically after contact2
	 */
	return function(contact1, contact2) {
		var result = compareName(contact1.lastName, contact2.lastName);

		if(result === 0) {
			result = compareName(contact1.firstName, contact2.firstName)
		}

		return result;
	};

	/**
	 * Compare two strings case-insensitively
	 * @param {string} name1
	 * @param {string} name2
	 * @returns {number} 0 if name1 == name2
	 *  -1 if name1 < name2
	 *  1 if name1 > name2
	 */
	function compareName(name1, name2) {
		if(name1 == null) {
			name1 = '';
		}

		if(name2 == null) {
			name2 = '';
		}

		name1 = name1.toLowerCase();
		name2 = name2.toLowerCase();

		return name1 < name2 ? -1
			: name1 > name2 ? 1
				: 0;
	}
});