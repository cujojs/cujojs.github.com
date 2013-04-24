define({

	theme: { module: 'css!contacts/theme/basic.css' },

	//
	// VIEWS
	//
	headerView: {
		render: {
			template: { module: 'text!contacts/app/header/template.html' },
			replace: { module: 'i18n!contacts/app/header/strings' },
			css: { module: 'css!contacts/app/header/style.css' }
		},
		insert: { first: 'root' }
	},

	contactsContainer: { $ref: 'dom.first!.contacts-view-container', at: 'root' },

	listView: {
		render: {
			template: {module: 'text!contacts/app/list/template.html' },
			css: { module: 'css!contacts/app/list/style.css' }
		},
		insert: { first: 'contactsContainer' },
		bind: {
			to: { $ref: 'contacts' },
			comparator: { module: 'contacts/app/list/compareByLastFirst' },
			bindings: {
				firstName: '.first-name',
				lastName: '.last-name'
			}
		}
	},

	editView: {
		render: {
			template: { module: 'text!contacts/app/edit/template.html' },
			replace: { module: 'i18n!contacts/app/edit/strings' },
			css: { module: 'css!contacts/app/edit/style.css' }
		},
		insert: { last: 'contactsContainer' }
	},

	editForm: {
		element: { $ref: 'dom.first!form', at: 'editView' },
		connect: { 
			'contacts.onUpdate': 'reset'
		}
	},
	
	footerView: {
		render: {
			template: { module: 'text!contacts/app/footer/template.html' },
			replace: { module: 'i18n!contacts/app/footer/strings.js' },
			css: { module: 'css!contacts/app/footer/style.css' }
		},
		insert: { last: 'root' }
	},
	
	//
	// CONTROLLER
	//
	controller: {
		create: 'contacts/app/controller',
		properties: {
			_form: { $ref: 'editForm' },
			_updateForm: { compose: 'form.setValues' }
		},
		on: {
			editForm: {
				'submit' : 'form.getValues | contacts.update'
			},
			listView: {
				'click:.contact':'contacts.edit'
			}
		},
		connect: {
			'contacts.onEdit': 'editContact'
		}
	},
	
	//
	// COLA
	//
	contacts: {
		create: {
			module: 'cola/Collection',
			args: {
				strategyOptions: {
					validator: { module: 'contacts/app/edit/validateContact' }
				}
			}
		},
		before: {
			add: 'cleanContact | generateMetadata',
			update: 'cleanContact | generateMetadata'
		}
	},

	contactStore: {
		create: {
			module: 'cola/adapter/LocalStorage',
			args: 'contacts-demo'
		},
		bind: {
			to: { $ref: 'contacts' }
		}
	},
	
	//
	// HELPERS
	//
	form: { module: 'cola/dom/form' },
	cleanContact: { module: 'contacts/app/contacts/cleanContact' },
	generateMetadata: { module: 'contacts/app/contacts/generateMetadata' },

	// Wire.js plugins
	plugins: [
		{ module: 'wire/dom' },
		{ module: 'wire/dom/render' },
		{ module: 'wire/on' },
		{ module: 'wire/aop' },
		{ module: 'wire/connect' },
		{ module: 'cola' }
	]
});