define(function() {

	/**
	 * Validate a contact
	 */
	return function validateContact(contact) {
		var valid, result;
		result = { valid: true, errors: [] };

		valid = contact && 'firstName' in contact && contact.firstName.trim();
		if(!valid) {
			result.valid = false;
			result.errors.push({ property: 'firstName', message: 'missing' });
		}

		valid = contact && 'lastName' in contact && contact.lastName.trim();
		if(!valid) {
			result.valid = false;
			result.errors.push({ property: 'lastName', message: 'missing' });
		}

		return result;
	}

});