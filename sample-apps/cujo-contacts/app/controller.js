define(['cola/dom/form'], function(form) {

	function ContactsController(editForm) {
		this._editForm = editForm;
	}

	// TODO: Is there a better way of doing this? e.g., a way to bind the form to the
	//       contact being edited in contacts.onEdit
	ContactsController.prototype.editContact = function(contact) {
		form.setValues(this._editForm, contact);
	};

	return ContactsController;

});