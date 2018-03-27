"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "handlebars", "jsonEditor", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/util/UIUtils", "org/forgerock/commons/ui/common/main/ServiceInvoker", "org/forgerock/openidm/ui/common/delegates/ResourceDelegate", "org/forgerock/commons/ui/common/components/Messages", "org/forgerock/openidm/ui/common/resource/ResourceCollectionSearchDialog", "org/forgerock/openidm/ui/common/resource/RelationshipArrayView", "org/forgerock/openidm/ui/common/resource/ResourceCollectionRelationshipsView", "org/forgerock/openidm/ui/common/util/ResourceCollectionUtils", "org/forgerock/openidm/ui/common/linkedView/LinkedView", "org/forgerock/commons/ui/common/main/Router", "org/forgerock/commons/ui/common/main/ValidatorsManager", "bootstrap"], function ($, _, handlebars, JSONEditor, AbstractView, eventManager, constants, uiUtils, serviceInvoker, resourceDelegate, messagesManager, ResourceCollectionSearchDialog, RelationshipArrayView, ResourceCollectionRelationshipsView, resourceCollectionUtils, LinkedView, router, ValidatorsManager) {
    var EditResourceView = AbstractView.extend({
        template: "templates/admin/resource/EditResourceViewTemplate.html",
        tabViewOverrides: {},
        events: {
            "click .saveBtn": "save",
            "keyup": "fireEventsFromForm",
            "click #backBtn": "backToList",
            "click #deleteBtn": "deleteObject",
            "click .resetBtn": "reset",
            "onValidate": "onValidate"
        },
        partials: ["partials/resource/_relationshipDisplay.html"],
        render: function render(args, callback) {
            var resourceReadPromise,
                objectId = args[0] === "managed" ? args[2] : args[3],
                displayField;

            resourceDelegate.getSchema(args).then(_.bind(function (schema) {
                var readUrl;

                this.data.args = args;

                this.data.objectType = args[0];
                this.data.isSystemResource = false;
                this.objectName = args[1];
                this.data.serviceUrl = resourceDelegate.getServiceUrl(args);

                readUrl = this.data.serviceUrl + "/" + objectId + "?_fields=" + resourceCollectionUtils.getFieldsToExpand(schema.properties);

                if (this.data.objectType === "system") {
                    this.data.isSystemResource = true;
                    this.objectName += "/" + args[2];
                    readUrl = this.data.serviceUrl + "/" + objectId;
                    this.data.systemType = args[4];
                }

                if (objectId) {
                    resourceReadPromise = serviceInvoker.restCall({
                        url: readUrl
                    });
                    this.objectId = objectId;
                    this.data.newObject = false;
                } else {
                    resourceReadPromise = $.Deferred().resolve({});
                    this.data.newObject = true;
                }

                resourceReadPromise.then(_.bind(function (resource) {
                    this.data.objectTitle = schema.title || this.objectName;

                    this.data.schema = schema;

                    if (this.data.isSystemResource) {
                        this.data.objectTitle = this.objectName;
                    }

                    if (!this.data.newObject) {
                        if (this.data.isSystemResource) {
                            displayField = _.chain(schema.properties).map(function (val, key) {
                                val.name = key;return val;
                            }).where({ nativeName: "__NAME__" }).value();

                            if (displayField) {
                                displayField = displayField[0].name;
                            } else {
                                displayField = _.keys(schema.properties)[0];
                            }
                        } else {
                            _.map(schema.order, function (propName) {
                                if (!displayField && schema.properties[propName].viewable) {
                                    displayField = propName;
                                }
                            });
                        }

                        this.data.objectDisplayText = resource[displayField];
                    }

                    this.data.backBtnText = $.t("templates.admin.ResourceEdit.backToList", { objectTitle: this.data.objectTitle });

                    this.parentRender(function () {

                        schema = this.handleArrayOfTypes(schema);

                        this.setupEditor(resource, schema);

                        ValidatorsManager.bindValidators(this.$el.find("#resource"), [this.data.objectType, this.objectName, this.objectId || "*"].join("/"), _.bind(function () {

                            this.editor.on('change', _.bind(function () {
                                this.showPendingChanges();
                            }, this));

                            if (!this.data.newObject) {
                                this.linkedView = new LinkedView();
                                this.linkedView.element = "#linkedView";

                                this.linkedView.render({ id: resource._id, resourcePath: this.data.objectType + "/" + this.objectName + "/" });
                            }

                            if (callback) {
                                callback();
                            }

                            this.$el.find("input[type='text']:visible")[0].focus();
                        }, this));

                        this.setTabChangeEvent();
                    });
                }, this));
            }, this));
        },
        setupEditor: function setupEditor(resource, schema) {
            var propCount = 0,
                filteredProperties,
                filteredObject = resource;

            this.oldObject = $.extend(true, {}, filteredObject);

            filteredProperties = resourceCollectionUtils.convertRelationshipTypes(_.omit(schema.properties, function (p) {
                return !p.viewable && p.type !== "relationship";
            }));

            if (!_.isEmpty(filteredProperties)) {
                filteredObject = _.pick(filteredObject, _.keys(filteredProperties));
            }

            JSONEditor.defaults.options = {
                theme: "bootstrap3",
                iconlib: "fontawesome4",
                disable_edit_json: true,
                disable_array_reorder: true,
                disable_collapse: true,
                disable_properties: true,
                show_errors: "never",
                formHorizontal: true
            };

            if (schema.order) {
                _.each(schema.order, _.bind(function (prop) {
                    schema.properties[prop].propertyOrder = propCount++;

                    if (!_.has(filteredObject, prop) && schema.properties[prop].viewable && schema.properties[prop].type === "object" && _.keys(schema.properties[prop].properties).length > 0) {
                        //set all sub props to null
                        _.each(schema.properties[prop].properties, function (subProperty, key) {
                            _.set(filteredObject, [prop, key], null);
                        });
                    } else if (schema.properties[prop].viewable && !_.has(filteredObject, prop)) {
                        filteredObject[prop] = null;
                    }
                }, this));
            }

            if (this.data.isSystemResource) {
                schema.title = this.data.objectTitle;
                if (this.data.newObject) {
                    _.each(schema.properties, function (p) {
                        p.required = true;
                    });
                }
            }

            this.editor = new JSONEditor(document.getElementById("resource"), { schema: _.omit(schema, "allSchemas") });
            this.editor.setValue(filteredObject);
            this.addTooltips();

            this.convertResourceCollectionFields(filteredObject, schema).then(_.bind(function () {

                this.$el.find(".json-editor-btn-collapse").prop("disabled", true);
            }, this));

            if (this.data.isSystemResource) {
                this.$el.find(".row select").hide();
                this.$el.find(".row input").prop("disabled", true);
                this.$el.find(".row button").hide();
            }
        },

        showPendingChanges: function showPendingChanges() {
            var changedFields = this.generateChangedFieldsList(),
                filteredChangedFields = this.filterUndefinedBooleanFields(changedFields);

            this.showHidePendingChangesElement(filteredChangedFields);
        },

        /**
         *
         * @typedef {object} Field
         * @property {string} propertyName - the name of the corresponding schema property
         * @property {string} title - the title of the the corresponding schema property
         * @property {*} newValue - value of the changed field
         */

        /**
         * Diff the current state of the form against the previous to create an
         * array of changed Fields
         * @return {Field[]}
         */
        generateChangedFieldsList: function generateChangedFieldsList() {
            var newValue = _.extend({}, this.oldObject, this.getFormValue()),
                changedFields = [];

            _.each(newValue, _.bind(function (val, key) {
                var relationshipType = this.data.schema.properties[key] && this.data.schema.properties[key].typeRelationship,
                    hasVal = !!(val && val.toString().length) || val === 0;

                if (!this.oldObject[key] && hasVal || !relationshipType && this.oldObject[key] && !_.isEqual(this.oldObject[key], val) || relationshipType && hasVal && !_.isEqual(JSON.parse(val), this.oldObject[key])) {
                    if (this.data.schema.properties && this.data.schema.properties[key] && this.data.schema.properties[key].title && this.data.schema.properties[key].title.length) {
                        changedFields.push({ propertyName: key, title: this.data.schema.properties[key].title, newValue: val });
                    } else {
                        changedFields.push({ propertyName: key, newValue: val, title: key });
                    }
                }
            }, this));

            return changedFields;
        },

        /**
         * jsonEditor will set undefined boolean fields to be false casuing them to seem like
         * they have changed. This function filters out such fields before passing to pending changes
         * rendering
         * @param  {Field[]} changedFields
         * @return {Field[]} filtered list of changed Fields
         */
        filterUndefinedBooleanFields: function filterUndefinedBooleanFields(changedFields) {
            var _this2 = this;

            var getNestedBooleanPaths = function getNestedBooleanPaths(schemaProperty) {
                var path = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

                // traverse schema and collect path steps to any nested boolean properties
                if (schemaProperty.type === "boolean") {
                    return path.concat(schemaProperty.propName);
                } else if (schemaProperty.type === "object") {
                    return _.pairs(schemaProperty.properties).map(function (propertyPair) {
                        return [schemaProperty.propName].concat(getNestedBooleanPaths(_.last(propertyPair)));
                    }).reduce(function (acc, nestedPath) {
                        if (_.some(nestedPath, _.isArray)) {
                            return acc.concat(_.tail(nestedPath).map(function (stepTail) {
                                return [_.first(nestedPath)].concat(stepTail);
                            }));
                        } else {
                            return acc.concat([nestedPath]);
                        }
                    }, []);
                } else {
                    return path;
                }
            },
                checkForBooleanChanges = function checkForBooleanChanges(field, pathArray) {
                return _.some(pathArray.map(function (path) {
                    if (_.has(_this2.oldObject, path)) {
                        return true;
                    } else {
                        return _.isArray(path) ? _.get(field.newValue, _.tail(path)) : field.newValue;
                    }
                }));
            };

            return changedFields.filter(function (field) {
                var schemaProperty = _this2.data.schema.properties[field.propertyName],
                    nestedBooleanPaths = getNestedBooleanPaths(schemaProperty);

                return _.isEmpty(nestedBooleanPaths) ? true : checkForBooleanChanges(field, nestedBooleanPaths);
            });
        },

        /**
         * Add/remove changes pending element from the dom based on the current state of the form
         * @param  {Field[]} changedFields list of fields that have changed.
         */
        showHidePendingChangesElement: function showHidePendingChangesElement(changedFields) {
            var noChanges = _.isEmpty(changedFields),
                fieldsHtml = changedFields.length ? "<br/>- " + changedFields.map(function (field) {
                return field.title;
            }).join("<br/>- ") : "";

            this.$el.find(".changedFields").html(fieldsHtml);
            this.$el.find(".resetBtn").attr("disabled", noChanges);
            this.$el.find(".resourceChangesPending")[noChanges ? "hide" : "show"]();
        },

        /* To accommodate a popover the addTooltips function transforms the following html:
         *
         * <div class=" form-group">
         *      <label class=" control-label">Username</label>
         *      <input type="text" class="form-control" name="root[userName]">
         *      <p class="help-block">The Username</p>
         * </div>
         *
         * into:
         *
         * <div class=" form-group">
         *      <label class=" control-label">Username</label> <i class="fa fa-info-circle info" title="" data-original-title="The Username"></i>
         *      <input type="text" class="form-control" name="root[userName]">
         *      <p class="help-block"></p>
         * </div>
         *
         */
        addTooltips: function addTooltips() {
            var propertyDescriptionSpan = this.$el.find("p.help-block"),
                objectHeader = this.$el.find("#resource").find("h3:eq(0)"),
                objectDescriptionSpan = objectHeader.next(),

            // this text escaped since it's being inserted into an attribute
            tipDescription = _.escape(objectDescriptionSpan.text());

            $.each(propertyDescriptionSpan, function (span) {
                // this text escaped since it's being inserted into an attribute
                var tipDescription = _.escape($(this).text());
                var iconElement = $('<i class="fa fa-info-circle info" title="' + tipDescription + '"/>');
                $(this).parent().find("label").after(iconElement);
                $(this).empty();
            });

            if (objectDescriptionSpan.text().length > 0) {
                var iconElement = $('<i class="fa fa-info-circle info" title="' + tipDescription + '"/>');
                objectHeader.append(iconElement);
                objectDescriptionSpan.empty();
            }

            this.$el.find(".info").popover({
                content: function content() {
                    return $(this).attr("data-original-title");
                },
                placement: 'top',
                container: 'body',
                html: 'true',
                template: '<div class="popover popover-info" role="tooltip"><div class="popover-content"></div></div>'
            });
        },
        getFormValue: function getFormValue() {
            var formVal = this.editor.getValue();

            if (!this.data.newObject) {
                /*
                The following _.each() was placed here to account for JSONEditor.setValue()
                turning a property that exists but has a null value into an empty text field.
                Upon calling JSONEditor.getValue() the previously null property will be set to and empty string.
                 This loop filters out previously null values that have not been changed.
                */
                _.each(_.keys(formVal), function (key) {
                    // The old property must be null or undefined
                    if (this.oldObject[key] === null || this.oldObject[key] === undefined) {
                        var isObject = _.isObject(formVal[key]);
                        var falseyNotZero = !formVal[key] && formVal[key] !== 0;
                        var isEmpty = _.isEmpty(formVal[key]);
                        var isEmptyString = _.isString(formVal[key]) && isEmpty;
                        var nonNumeric = !_.isNumber(formVal[key]);
                        var isNotTrue = formVal[key] !== true;
                        var isFalseOrEmpty = falseyNotZero || isEmptyString && nonNumeric && isNotTrue;

                        // The property isn't an object and it is false or empty
                        // OR it is an object and empty
                        if (!isObject && isFalseOrEmpty || isObject && isEmpty) {
                            formVal[key] = this.oldObject[key];
                        } else if ((this.oldObject[key] === null || this.oldObject[key] === undefined) && formVal[key] === 0) {
                            //special case for number fields set to null or undefined in the oldObject and 0 in the JSONEditor
                            formVal[key] = undefined;
                        }
                    }
                }, this);
            } else {
                _.each(this.$el.find(".resourceCollectionValue"), function (element) {
                    try {
                        formVal[$(element).attr("propname")] = JSON.parse($(element).val());
                    } catch (e) {
                        // Ignored
                    }
                });
            }

            return formVal;
        },
        save: function save(e, callback) {
            var _this3 = this;

            var formVal = this.getFormValue(),
                successCallback = function successCallback(editedObject, xhr) {
                var msg = _this3.data.newObject ? "templates.admin.ResourceEdit.addSuccess" : "templates.admin.ResourceEdit.editSuccess",
                    editRouteName = !_this3.data.isSystemResource ? "adminEditManagedObjectView" : "adminEditSystemObjectView";

                messagesManager.messages.addMessage({ "message": $.t(msg, { objectTitle: _this3.data.objectTitle }) });
                _this3.data.editedObject = editedObject;

                if (_this3.data.newObject) {
                    _this3.data.args.push(editedObject._id);
                    eventManager.sendEvent(constants.EVENT_CHANGE_VIEW, { route: router.configuration.routes[editRouteName], args: _this3.data.args, callback: callback });
                } else {
                    if (!_.isUndefined(xhr)) {
                        _this3.render(_this3.data.args, callback);
                    }
                }
            };

            if (e) {
                e.preventDefault();

                if ($(e.currentTarget).attr("disabled") === "disabled") {
                    return false;
                }
            }

            if (this.data.newObject) {
                formVal = _.omit(formVal, function (val) {
                    return val === "" || val === null;
                });
                resourceDelegate.createResource(this.data.serviceUrl, formVal._id, formVal, successCallback);
            } else {
                if (!this.data.isSystemResource) {
                    _.each(this.$el.find(".resourceCollectionValue"), function (element) {
                        var val = $(element).val();

                        if (val.length) {
                            val = JSON.parse($(element).val());
                        } else {
                            val = null;
                        }
                        formVal[$(element).attr("propname")] = val;
                    });
                    resourceDelegate.patchResourceDifferences(this.data.serviceUrl, { id: this.oldObject._id, rev: this.oldObject._rev }, this.oldObject, _.extend({}, this.oldObject, formVal), successCallback);
                } else {
                    resourceDelegate.updateResource(this.data.serviceUrl, this.oldObject._id, formVal, successCallback);
                }
            }
        },
        backToList: function backToList(e) {
            if (e) {
                e.preventDefault();
            }

            if (!this.data.isSystemResource) {
                eventManager.sendEvent(constants.ROUTE_REQUEST, { routeName: "adminListManagedObjectView", args: this.data.args });
            } else {
                var args = [this.data.systemType, this.data.args[2]]; //["provisioner.openicf_ldap", "account"]

                eventManager.sendEvent(constants.ROUTE_REQUEST, { routeName: "adminListSystemObjectView", args: args });
            }
        },
        reset: function reset(e) {
            var _this4 = this;

            var thisTab = this.$el.find('.nav-tabs .active a')[0].hash;

            if (e) {
                e.preventDefault();
            }

            if ($(e.currentTarget).attr("disabled") === "disabled") {
                return false;
            }

            this.render(this.data.args, function () {
                _this4.$el.find('a[href="' + thisTab + '"]').tab('show');
            });
        },
        deleteObject: function deleteObject(e, callback) {
            if (e) {
                e.preventDefault();
            }

            uiUtils.confirmDialog($.t("templates.admin.ResourceEdit.confirmDelete", { objectTitle: this.data.objectTitle }), "danger", _.bind(function () {
                resourceDelegate.deleteResource(this.data.serviceUrl, this.objectId, _.bind(function () {
                    messagesManager.messages.addMessage({ "message": $.t("templates.admin.ResourceEdit.deleteSuccess", { objectTitle: this.data.objectTitle }) });
                    this.backToList();
                    if (callback) {
                        callback();
                    }
                }, this));
            }, this));
        },
        /**
         * looks through the resource's schema, finds all relationship fields, and either converts
         * the JSONEditor representation of the field to a relationship UI in the case of singleton relationships
         * or in the case of arrays of relationships it converts that into its own tab with it's own grid of data
         * and actions
         *
         * @param {Object} filteredObject
         * @param {Object} schema
         * @returns {promise}
         */
        convertResourceCollectionFields: function convertResourceCollectionFields(filteredObject, schema) {
            var _this = this,
                _getFields,
                _convertField,
                convertArrayField,
                showRelationships,
                addTab;

            _getFields = function getFields(properties, parent) {
                var promises;

                promises = _.map(properties, function (prop, key) {
                    prop.propName = key;
                    if (prop.type === "object") {
                        var newparent = void 0;
                        if (parent) {
                            newparent = parent + "\\." + key;
                        } else {
                            newparent = "\\." + key;
                        }
                        return _getFields(prop.properties, newparent);
                    }

                    if (parent) {
                        prop.selector = parent + "\\." + key;
                    } else {
                        prop.selector = "\\." + key;
                    }

                    if (prop.type === "array") {
                        if (prop.items && prop.items.resourceCollection && _.has(filteredObject, key)) {
                            prop.parentObjectId = _this.objectId;
                            prop.relationshipUrl = _this.data.objectType + "/" + _this.objectName + "/" + _this.objectId + "/" + prop.propName;
                            prop.typeRelationship = true;
                            prop.parentDisplayText = _this.data.objectDisplayText;
                            return convertArrayField(prop);
                        }
                    }

                    if (prop.resourceCollection) {
                        return _convertField(prop);
                    }

                    // nothing special needed for this field
                    return $.Deferred().resolve();
                });

                return $.when.apply($, promises);
            };

            /**
             * converts a singleton relationship field into a button that opens an instance of ResourceCollectionSearchDialog
             * if the property has no value the button will be a create button
             * if the property has a value the button will be a link button with the related resource's display text and the resource's icon
             */
            _convertField = function convertField(prop) {
                var el = _this.$el.find("#0-root" + prop.selector.replace(/\./g, "-")),
                    //this is the JSONEditor field to be hidden and changed by the button/dialog
                editButtonId = "relationshipLink-" + prop.propName,
                    removeButtonId = "removeRelationshipLink-" + prop.propName,
                    relationshipDisplay = $(handlebars.compile("{{> resource/_relationshipDisplay}}")({
                    "newRelationship": true,
                    "displayText": $.t("templates.admin.ResourceEdit.addResource", { resource: prop.title }),
                    "editButtonId": editButtonId
                })),
                    propertyValuePath,
                    iconClass,
                    resourceCollectionSchema,
                    resourceEditPath = function resourceEditPath() {
                    var val = JSON.parse(el.val()),
                        route = "resource/",
                        pathArray = val._ref.split("/");

                    pathArray.pop();

                    route += pathArray.join("/") + "/edit/" + val._id;

                    return route;
                };

                if (el.val() && el.val().length && el.val() !== "null") {
                    propertyValuePath = resourceCollectionUtils.getPropertyValuePath(JSON.parse(el.val()));
                    resourceCollectionSchema = _.findWhere(_this.data.schema.allSchemas, { name: propertyValuePath.split("/")[propertyValuePath.split("/").length - 1] });

                    if (resourceCollectionSchema) {
                        iconClass = resourceCollectionSchema.schema.icon;
                    }

                    relationshipDisplay = $(handlebars.compile("{{> resource/_relationshipDisplay}}")({
                        "iconClass": iconClass || "fa-cube",
                        "displayText": resourceCollectionUtils.getDisplayText(prop, JSON.parse(el.val()), resourceCollectionUtils.getResourceCollectionIndex(_this.data.schema, propertyValuePath, prop.propName)),
                        "editButtonText": $.t("templates.admin.ResourceEdit.updateResource", { resource: prop.title }),
                        "removeButtonText": $.t("templates.admin.ResourceEdit.removeResource", { resource: prop.title }),
                        "propName": prop.propName,
                        "resourceEditPath": resourceEditPath()
                    }));
                }

                relationshipDisplay.click(function (e) {
                    var opts = {
                        property: prop,
                        propertyValue: el.val(),
                        schema: _this.data.schema,
                        onChange: function onChange(value, originalPropertyValue, newText) {
                            _this.editor.getEditor("root" + prop.selector.replace("\\", "")).setValue(JSON.stringify(value));
                            relationshipDisplay.remove();
                            _convertField(prop);
                            _this.$el.find("#resourceEditLink-" + prop.propName).text(newText);
                        }
                    };

                    if ($(e.target).attr("id") === editButtonId || $(e.target).closest(".updateRelationshipButton").attr("id") === editButtonId) {
                        e.preventDefault();
                        new ResourceCollectionSearchDialog().render(opts);
                    }
                    if ($(e.target).attr("id") === removeButtonId || $(e.target).closest(".removeRelationshipButton").attr("id") === removeButtonId) {
                        e.preventDefault();
                        _this.editor.getEditor("root" + prop.selector.replace("\\", "")).setValue("null");
                        relationshipDisplay.remove();
                        _convertField(prop);
                        //_this.$el.find("#resourceEditLink-" + prop.propName).text("");
                        _this.showPendingChanges();
                    }
                });

                el.attr("style", "display: none !important");
                el.attr("propname", prop.propName);
                el.addClass("resourceCollectionValue");
                if (prop.viewable) {
                    el.after(relationshipDisplay);
                } else {
                    el.closest(".row").find(".control-label").hide();
                }

                return $.Deferred().resolve();
            };

            convertArrayField = function convertArrayField(prop) {
                var doConversion = function doConversion(tabView) {
                    _this.editor.getEditor('root' + prop.selector.replace("\\", "")).destroy();

                    //in case this relationship array field is returned by default
                    //remove it from the original version of the resource
                    if (_this.oldObject[prop.propName]) {
                        delete _this.oldObject[prop.propName];
                    }

                    return addTab(prop, {
                        templateId: "tabContentTemplate",
                        tabView: tabView,
                        viewId: "relationshipArray-" + prop.propName,
                        contentId: "resource-" + prop.propName,
                        contentClass: "resourceCollectionArray",
                        headerText: prop.title
                    });
                };

                //check for tabViewOverride
                if (_this.tabViewOverrides[prop.propName]) {
                    doConversion(_this.tabViewOverrides[prop.propName]);
                } else {
                    doConversion(new RelationshipArrayView());
                }
            };

            showRelationships = function showRelationships(prop) {
                return addTab(prop, {
                    templateId: "relationshipsTemplate",
                    tabView: new ResourceCollectionRelationshipsView(),
                    viewId: "resourceCollectionRelationship-" + prop.propName,
                    contentId: "relationship-" + prop.propName,
                    contentClass: "resourceCollectionRelationships",
                    headerText: prop.resourceCollection.label
                });
            };

            addTab = function addTab(prop, opts) {
                var tabHeader = _this.$el.find("#tabHeaderTemplate").clone(),
                    tabContent = _this.$el.find("#" + opts.templateId).clone(),
                    promise = $.Deferred();

                if (!_this.data.newObject) {
                    tabHeader.attr("id", "tabHeader_" + opts.contentId);
                    tabHeader.find("a").attr("href", "#" + opts.contentId).text(opts.headerText);
                    tabHeader.show();

                    tabContent.attr("id", opts.contentId);
                    tabContent.find("." + opts.contentClass).attr("id", opts.viewId);

                    _this.$el.find("#linkedSystemsTabHeader").before(tabHeader);
                    _this.$el.find("#resource-linkedSystems").before(tabContent);

                    opts.tabView.render({ element: "#" + opts.viewId, prop: prop, schema: schema, onChange: opts.onChange }, function () {
                        promise.resolve();
                    });
                } else {
                    promise.resolve();
                }

                return promise;
            };

            return _getFields(schema.properties);
        },
        /**
        * This function looks for instances of properties whose schema.type is an array
        * then grabs the first value of the array that is not "null" and sets the type to
        * that value so jsonEditor does not have to decide on types. The reason we are
        * doing this is because we set empty values to null anyway so if a user wants
        * to set a value to null all they will have to do is set the value to an empty string
        * in the case of string types, no array values for array types, false for boolean type,
        * or empty object for object types.
        **/
        handleArrayOfTypes: function handleArrayOfTypes(schema) {
            _.each(schema.properties, function (property) {
                if (_.isArray(property.type)) {
                    property.type = _.pull(property.type, "null")[0];
                }
            });

            return schema;
        },
        /**
        * This function sets an event for each bootstrap tab on "show" which looks for any
        * pending form changes in the currently visible tab. If there are changes the the tab
        * change is halted and a dialog is displayed asking the user if he/she would like to discard
        * or save the changes before actually changing tabs.
        *
        * @param {string} tabId - (optional) specific tab on which to set the change event...otherwise the event will be set on all tabs
        **/
        setTabChangeEvent: function setTabChangeEvent(tabId) {
            var _this5 = this;

            var scope = this.$el;

            if (tabId) {
                scope = scope.find("#" + tabId);
            }

            //look for all bootstrap tabs within "scope"
            scope.on('show.bs.tab', 'a[data-toggle="tab"]', function (e) {
                //check to see if there are changes pending
                if (_this5.$el.find(".resourceChangesPending:visible").length) {
                    //stop processing this tab change
                    e.preventDefault();
                    //throw up a confirmation dialog
                    _this5.confirmSaveChanges(e.target.hash, function () {
                        //once confirmed save the form then continue showing the new tab
                        _this5.save(false, function () {
                            _this5.$el.find('a[href="' + e.target.hash + '"]').tab('show');
                        });
                    });
                }
            });
        },
        /**
         * @param {string} newTab a string representing a hash address to the anchor of the new tab to be viewed
         * @param {Function} confirmCallback Fired when the "Save Changes" button is clicked
         *
         * @example
         *  AdminUtils.confirmSaveChanges("#password",_.bind(function(){
         *      //Useful stuff here
         *  }, this));
         */
        confirmSaveChanges: function confirmSaveChanges(newTab, confirmCallback) {
            var _this6 = this;

            var overrides = {
                title: $.t("templates.admin.ResourceEdit.warningPendingChanges"),
                okText: $.t("common.form.save"),
                cancelText: $.t("templates.admin.ResourceEdit.discard"),
                cancelCallback: function cancelCallback() {
                    _this6.render(_this6.data.args, function () {
                        _this6.$el.find('a[href="' + newTab + '"]').tab('show');
                    });
                }
            };

            if (!ValidatorsManager.formValidated(this.$el)) {
                overrides.okText = $.t("common.form.cancel");
                confirmCallback = $.noop();
            }

            uiUtils.confirmDialog("", "danger", confirmCallback, overrides);
        },

        // fools JSONeditor to fire change event on keyup
        fireEventsFromForm: function fireEventsFromForm(event) {
            // allows for enter to trigger save
            if (event.keyCode === 13) {
                this.save();
            } else {
                // keeps the state unchanged but shows changesPending
                $(event.target).blur();
                $(event.target).focus();
            }
        }
    });

    return new EditResourceView();
});
