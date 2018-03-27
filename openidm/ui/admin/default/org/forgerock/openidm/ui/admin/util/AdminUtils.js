"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "handlebars", "org/forgerock/commons/ui/common/main/AbstractConfigurationAware", "org/forgerock/openidm/ui/common/delegates/ConfigDelegate", "org/forgerock/openidm/ui/admin/delegates/ConnectorDelegate", "org/forgerock/commons/ui/common/util/ModuleLoader", "org/forgerock/commons/ui/common/util/UIUtils"], function ($, _, Handlebars, AbstractConfigurationAware, ConfigDelegate, ConnectorDelegate, ModuleLoader, UIUtils) {

    var obj = {};

    /**
     * Retrieves a list of connectors and managed objects and creates an array of resources
     *
     * @returns {promise} promise - resolves with an array of strings
     */
    obj.getAvailableResourceEndpoints = function () {
        var connectorPromise = ConnectorDelegate.currentConnectors(),
            managedPromise = ConfigDelegate.readEntity("managed"),
            resources = [];

        return $.when(connectorPromise, managedPromise).then(_.bind(function (connectors, managedObjects) {
            _.each(managedObjects.objects, _.bind(function (managed) {
                resources.push("managed/" + managed.name);
            }, this));

            _.each(connectors, _.bind(function (connector) {
                _.each(connector.objectTypes, _.bind(function (ot) {
                    if (ot !== "__ALL__") {
                        resources.push("system/" + connector.name + "/" + ot);
                    }
                }, this));
            }, this));

            return resources;
        }, this));
    };

    /**
     * @param name
     * @returns {string}
     *
     * This function takes in a word and capitalizes the first letter
     */
    obj.capitalizeName = function (name) {
        return name.charAt(0).toUpperCase() + name.substr(1);
    };

    obj.findPropertiesList = function (type, required) {
        var connectorUrl,
            properties,
            propertiesPromise = $.Deferred();

        if (type[0] === "system") {
            ConnectorDelegate.currentConnectors().then(_.bind(function (connectors) {
                connectorUrl = _.find(connectors, function (connector) {
                    return connector.name === type[1];
                }, this);

                if (connectorUrl && connectorUrl.config && connectorUrl.config.length > 0) {
                    connectorUrl = connectorUrl.config.split("/");

                    ConfigDelegate.readEntity(connectorUrl[1] + "/" + connectorUrl[2]).then(_.bind(function (config) {
                        if (required) {
                            properties = _.pick(config.objectTypes[type[2]].properties, function (property) {
                                return property.required === true;
                            });
                        } else {
                            properties = config.objectTypes[type[2]].properties;
                        }

                        propertiesPromise.resolve(properties, config);
                    }, this));
                } else {
                    propertiesPromise.resolve([]);
                }
            }, this));
        } else if (type[0] === "managed") {
            ConfigDelegate.readEntity("managed").then(_.bind(function (managed) {
                properties = _.find(managed.objects, function (managedObject) {
                    return managedObject.name === type[1];
                }, this);

                if (properties.schema && properties.schema.properties) {
                    if (required) {

                        properties = _.pick(properties.schema.properties, function (value, key) {
                            var found = false;

                            _.each(properties.schema.required, function (field) {
                                if (field === key) {
                                    found = true;
                                }
                            });

                            return found;
                        });

                        propertiesPromise.resolve(properties);
                    } else {
                        propertiesPromise.resolve(properties.schema.properties);
                    }
                } else {
                    propertiesPromise.resolve([]);
                }
            }, this));
        } else {
            propertiesPromise.resolve([]);
        }

        return propertiesPromise;
    };

    /**
     * @param {string} message The text provided in the main body of the dialog
     * @param {Function} confirmCallback Fired when the delete button is clicked
     *
     * @example
     *  AdminUtils.confirmDeleteDialog($.t("templates.admin.ResourceEdit.confirmDelete"), _.bind(function(){
     *      //Useful stuff here
     *  }, this));
     */
    obj.confirmDeleteDialog = function (message, confirmCallback) {
        ModuleLoader.load("bootstrap-dialog").then(function (BootstrapDialog) {
            var btnType = "btn-danger";

            BootstrapDialog.show({
                title: $.t('common.form.confirm') + " " + $.t('common.form.delete'),
                type: "type-danger",
                message: message,
                id: "frConfirmationDialog",
                buttons: [{
                    label: $.t('common.form.cancel'),
                    id: "frConfirmationDialogBtnClose",
                    action: function action(dialog) {
                        dialog.close();
                    }
                }, {
                    label: $.t('common.form.delete'),
                    cssClass: btnType,
                    id: "frConfirmationDialogBtnDelete",
                    action: function action(dialog) {
                        if (confirmCallback) {
                            confirmCallback();
                        }
                        dialog.close();
                    }
                }]
            });
        });
    };

    /**
     * @param availableProps {array} - array of a resource's availableProps objects from findPropertiesList
     * @param existingFields {array} - properties to be filtered out
     * @returns {array}
     *
     * This function filters out the all props that are named "_id", are not of type string,
     * are encrypted, or are already existing in the current list of availableProps
     */
    obj.filteredPropertiesList = function (availableProps, existingFields) {
        return _.chain(availableProps).omit(function (prop, key) {
            return prop.type !== "string" || key === "_id" || _.has(prop, "encryption") || _.contains(existingFields, key);
        }).keys().sortBy().value();
    };
    /**
    This function attempts to load a partial file from partials/extensionDirectory
    with the same name as partialName. If the partial exists it returns a promise
    resolving with a string representing the name of the partial to be used in the
    form template or false if no partial exists.
     @param extensionDirectory {string}
    @param partialName {string}
    @returns promise
    **/
    obj.loadExtensionPartial = function (extensionDirectory, partialName) {
        var promise = $.Deferred(),
            path = "partials/" + extensionDirectory + "/" + partialName + ".html";

        $.ajax({
            url: path,
            success: function success(data) {
                Handlebars.registerPartial(partialName, Handlebars.compile(data));
                promise.resolve(partialName);
            },
            error: function error(e) {
                promise.resolve(false);
            }
        });

        return promise;
    };

    /**
    * This function takes in a table row click event and returns the index of the clicked row
    *
    * @param {object} event - a click event
    * @returns {number} - the index of the clicked table row
    */
    obj.getClickedRowIndex = function (e) {
        var index;

        _.each($(e.currentTarget).closest("table tbody").find("tr"), function (tr, i) {
            if (tr === $(e.currentTarget).closest("tr")[0]) {
                index = i;
            }
        });

        return index;
    };
    /**
     * @param {object} view the view where the tabs exist
     * @param {string} newTab a string representing a hash address to the anchor of the new tab to be viewed
     * @param {Function} confirmCallback Fired when the "Save Changes" button is clicked
     */
    obj.confirmSaveChanges = function (view, newTab, confirmCallback, cancelCallback) {
        var overrides = {
            title: $.t("common.form.save") + "?",
            okText: $.t("common.form.save"),
            cancelText: $.t("templates.admin.ResourceEdit.discard"),
            cancelCallback: function cancelCallback() {
                view.render(view.args, function () {
                    view.$el.find('a[href="' + newTab + '"]').tab('show');
                });
            }
        };

        if (cancelCallback) {
            overrides.cancelCallback = cancelCallback;
        }

        UIUtils.confirmDialog($.t("templates.admin.ResourceEdit.saveChangesMessage"), "danger", confirmCallback, overrides);
    };

    /**
     * @description A handlebars helper checking if an item is contained in a list
     *
     * @example:
     *
     * {{#contains ["cat", "dog"]  "bird"}}
     *      <span>DOES CONTAIN ITEM</span>
     * {{else}}
     *      <span>DOES NOT CONTAIN</span>
     * {{/contains}}
     */
    Handlebars.registerHelper("contains", function (list, item, options) {
        if (_.indexOf(list, item) >= 0) {
            return options.fn(item);
        } else {
            return options.inverse(item);
        }
    });

    /**
     * @description A handlebars helper that "eaches" over the union of two lists
     *
     * @example:
     *
     * {{#eachTwoLists ["cat", "dog"]  ["bird", "cat", "bug"]}}
     *      <span>{{this}}</span>
     * {{/eachTwoLists}}
     *
     * Looks like: cat dog bird bug
     */
    Handlebars.registerHelper("eachTwoLists", function (list1, list2, options) {
        var ret = "";

        _.each(_.union(list1, list2), function (val) {
            ret = ret + options.fn(val);
        });

        return ret;
    });

    return obj;
});
