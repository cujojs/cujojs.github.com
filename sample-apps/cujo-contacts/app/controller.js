define(function() {

	function ContactsController() {}

	ContactsController.prototype = {
		_form: null,
		_updateForm: null,

		editContact: function(contact) {
			this._updateForm(this._form, contact);
		}
	};

	return ContactsController;

});