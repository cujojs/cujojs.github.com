define({// Wire spec

	theme: { module: 'css!contacts/theme/basic.css' },

	headerView: {
		render: {
			template: { module: 'text!contacts/app/header/template.html' },
			replace: { module: 'i18n!contacts/app/header/strings' }
		},
		insert: { first: 'root' }
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
			'click:.contact': 'contacts.edit'
		},
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
			css: { module: 'css!contacts/app/edit/structure.css' }
		},
		insert: { after: 'listView' },
		on: {
			submit: 'form.getValues | contacts.update'
		}
	},

	footerView: {
		render: {
			template: { module: 'text!contacts/app/footer/template.html' },
			replace: { module: 'i18n!contacts/app/footer/strings.js' }
		},
		insert: { last: 'root' }
	},
	
	controller: {
		create: 'contacts/app/controller',
		properties: {
			_form: { $ref: 'editView' },
			_updateForm: { compose: 'form.setValues' }
		},
		connect: {
			'contacts.onEdit': 'editContact'
		}
	},
	
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
		},
		connect: {
			'onUpdate': 'editView.reset'
		}
	},

	contactStore: {
		create: {
			module: 'cola/adapter/LocalStorage',
			args: 'contacts-demo'
		},
		bind: { $ref: 'contacts' }
	},
	
	form: { module: 'cola/dom/form' },
	cleanContact: { module: 'contacts/app/contacts/cleanContact' },
	generateMetadata: { module: 'contacts/app/contacts/generateMetadata' },

	$plugins: ['wire/dom','wire/dom/render','wire/on','wire/aop','wire/connect','cola']
});