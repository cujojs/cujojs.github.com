define({// Wire spec

	contactsCollection: { wire: 'contacts/app/collection/spec' },

	controller: {
		create: 'contacts/app/controller',
		properties: {
			_form: { $ref: 'editView' },
			_updateForm: { $ref: 'form.setValues' }
		},
		connect: {
			'contactsCollection.onEdit': 'editContact'
		}
	},

	editView: {
		render: {
			template: { module: 'text!contacts/app/edit/template.html' },
			replace: { module: 'i18n!contacts/app/edit/strings' },
			css: { module: 'css!contacts/app/edit/structure.css' }
		},
		insert: { after: 'listView' },
		on: {
			submit: 'form.getValues | contactsCollection.update'
		},
		connect: {
			'contactsCollection.onUpdate': 'reset'
		}
	},

	listView: {
		render: {
			template: {module: 'text!contacts/app/list/template.html' },
			css: { module: 'css!contacts/app/list/structure.css' }
		},
		insert: {
			first: { $ref: 'dom.first!.contacts-view-container', at: 'root' }
		},
		on: {
			'click:.contact': 'contactsCollection.edit'
		},
		bind: {
			to: { $ref: 'contactsCollection' },
			comparator: { module: 'contacts/app/list/compareByLastFirst' },
			bindings: {
				firstName: '.first-name',
				lastName: '.last-name'
			}
		}
	},

	theme: { module: 'css!contacts/theme/basic.css' },
	form: { module: 'cola/dom/form' },

	$plugins: ['wire/dom','wire/dom/render','wire/on','wire/connect','cola']
});