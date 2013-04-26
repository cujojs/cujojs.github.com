define(function() {

	return function(contact) {
		contact.firstName = contact.firstName && contact.firstName.trim() || '';
		contact.lastName = contact.lastName && contact.lastName.trim() || '';
		contact.phone = contact.phone && contact.phone.trim() || '';
		contact.email = contact.email && contact.email.trim() || '';
		return contact;
	}

});