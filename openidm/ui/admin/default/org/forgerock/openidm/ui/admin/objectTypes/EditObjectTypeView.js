"use strict";

/*
 * Copyright 2014-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "form2js", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/main/ValidatorsManager", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/Router", "org/forgerock/openidm/ui/common/delegates/ConfigDelegate", "org/forgerock/commons/ui/common/util/UIUtils", "bootstrap-tabdrop", "org/forgerock/openidm/ui/admin/objectTypes/schema/SchemaEditorView", "org/forgerock/commons/ui/common/components/ChangesPending", "org/forgerock/openidm/ui/admin/util/AdminUtils", "org/forgerock/openidm/ui/admin/delegates/ConnectorDelegate"], function ($, _, form2js, AbstractView, EventManager, validatorsManager, Constants, Router, ConfigDelegate, UIUtils, tabdrop, SchemaEditorView, ChangesPending, AdminUtils, ConnectorDelegate) {

    var EditObjectTypeView = AbstractView.extend({
        template: "templates/admin/objectTypes/EditObjectTypeTemplate.html",
        events: {
            "click #saveObjectType": "saveObjectType",
            "onValidate": "onValidate",
            "click #deleteObjectType": "deleteObjectType",
            "click #generalDetails": "makeChanges",
            "keyup input": "makeChanges"
        },
        partials: [],
        model: {},

        render: function render(args, callback) {
            var _this = this;

            /*
                args[0] comes in looking like this => "provisioner.openicf_ldap"
                splitDetails turns it into this => ["provisioner.openicf", "ldap"]
            */
            var splitDetails = args[0].match(/(.*?)_(.*)/).splice(1);

            this.data.fullConnectorName = args[0];
            this.data.systemType = splitDetails[0];
            this.data.connectorId = splitDetails[1];
            this.data.objectTypeName = args[1];
            this.args = args;

            //Get current connector details
            ConfigDelegate.readEntity(this.data.systemType + "/" + this.data.connectorId).then(function (connectorConfig) {
                ConnectorDelegate.testConnector(connectorConfig).then(function (connectorTestResult) {
                    _this.model.connectorConfig = _.cloneDeep(connectorConfig);

                    _this.data.objectType = connectorConfig.objectTypes[_this.data.objectTypeName];

                    _this.data.availableObjectTypes = connectorTestResult.objectTypes;

                    _this.objectTypeRender(callback);
                });
            });
        },

        objectTypeRender: function objectTypeRender(callback) {
            var _this2 = this;

            this.parentRender(function () {
                validatorsManager.bindValidators(_this2.$el);
                validatorsManager.validateAllFields(_this2.$el);

                _this2.$el.find(".nav-tabs").tabdrop();

                SchemaEditorView.render([_this2], function () {
                    if (callback) {
                        callback();
                    }
                });

                _this2.model.changesModule = ChangesPending.watchChanges({
                    element: _this2.$el.find(".changes-pending-container"),
                    undo: true,
                    watchedObj: _.clone(_this2.model.connectorConfig, true),
                    undoCallback: function undoCallback() {
                        _this2.render(_this2.args, function () {
                            _this2.$el.find('a[href="#detailsContainer"]').tab('show');
                        });
                    }
                });

                _this2.makeChanges();

                _this2.setTabChangeEvent();

                if (_this2.data.currentTab) {
                    _this2.$el.find('a[href="' + _this2.data.currentTab + '"]').tab('show');
                }
            });
        },

        saveObjectType: function saveObjectType(e, callback) {
            var _this3 = this;

            if (e) {
                e.preventDefault();
            }

            this.makeChanges();

            ConfigDelegate.updateEntity(this.data.systemType + "/" + this.data.connectorId, this.model.connectorConfig).then(function () {
                EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, "objectTypeSaved");
                _this3.objectTypeRender();

                if (callback) {
                    callback();
                }
            });
        },

        deleteObjectType: function deleteObjectType(event) {
            event.preventDefault();

            UIUtils.confirmDialog($.t("templates.connector.objectTypes.deleteObjectTypeConfirmation"), "danger", _.bind(function () {
                var _this4 = this;

                delete this.model.connectorConfig.objectTypes[this.data.objectTypeName];

                ConfigDelegate.updateEntity(this.data.systemType + "/" + this.data.connectorId, this.model.connectorConfig).then(function () {
                    EventManager.sendEvent(Constants.EVENT_CHANGE_VIEW, { route: Router.configuration.routes.editConnectorView, args: [_this4.data.systemType + "_" + _this4.data.connectorId] });
                });
            }, this));
        },
        /**
        This function is called any time the form is updated. It updates the current config,
        checks with the changes pending module for any differences with the original form,
        toggles the save button on when there are changes, and off when the form is current.
        **/
        makeChanges: function makeChanges() {
            var data = form2js('detailsForm', '.', true);

            //check to see if the object type name has changed
            if (this.data.objectTypeName !== data.name) {
                delete this.model.connectorConfig.objectTypes[this.data.objectTypeName];
            }

            this.data.objectType.id = data.objectTypeId;
            this.data.objectType.nativeType = data.nativeType;

            this.model.connectorConfig.objectTypes[data.name] = this.data.objectType;

            this.model.changesModule.makeChanges(_.clone(this.model.connectorConfig));

            if (this.model.changesModule.isChanged()) {
                this.$el.find("#saveObjectType").prop("disabled", false);
            } else {
                this.$el.find("#saveObjectType").prop("disabled", true);
            }
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
                _this5.data.currentTab = e.target.hash;

                //check to see if there are changes pending
                if (_this5.$el.find(".changes-pending-container:visible").length) {
                    //stop processing this tab change
                    e.preventDefault();
                    //throw up a confirmation dialog
                    AdminUtils.confirmSaveChanges(_this5, e.target.hash, function () {
                        //once confirmed save the form then continue showing the new tab
                        _this5.saveObjectType(false, function () {
                            _this5.$el.find('a[href="' + e.target.hash + '"]').tab('show');
                        });
                    });
                }
            });
        }
    });

    return new EditObjectTypeView();
});
