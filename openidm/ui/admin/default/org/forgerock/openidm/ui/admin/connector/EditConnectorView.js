"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "backbone", "backgrid", "form2js", "handlebars", "org/forgerock/openidm/ui/admin/connector/AbstractConnectorView", "org/forgerock/commons/ui/common/util/ObjectUtil", "org/forgerock/openidm/ui/common/util/BackgridUtils", "org/forgerock/openidm/ui/common/delegates/ConfigDelegate", "org/forgerock/openidm/ui/admin/delegates/ConnectorDelegate", "org/forgerock/openidm/ui/admin/connector/ConnectorRegistry", "org/forgerock/openidm/ui/admin/connector/ConnectorTypeView", "org/forgerock/openidm/ui/admin/util/ConnectorUtils", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/openidm/ui/admin/util/InlineScriptEditor", "org/forgerock/openidm/ui/admin/connector/liveSyncDialog", "org/forgerock/commons/ui/common/main/Router", "org/forgerock/openidm/ui/admin/util/Scheduler", "org/forgerock/openidm/ui/admin/delegates/SchedulerDelegate", "org/forgerock/commons/ui/common/util/UIUtils", "org/forgerock/commons/ui/common/main/ValidatorsManager", "org/forgerock/openidm/ui/admin/connector/ConnectorDataTabView", "bootstrap-tabdrop"], function ($, _, Backbone, Backgrid, form2js, Handlebars, AbstractConnectorView, ObjectUtil, BackgridUtils, ConfigDelegate, ConnectorDelegate, ConnectorRegistry, ConnectorType, connectorUtils, constants, eventManager, InlineScriptEditor, liveSyncDialog, router, Scheduler, SchedulerDelegate, UIUtils, validatorsManager, ConnectorDataTabView) {

    var AddEditConnectorView = AbstractConnectorView.extend({
        template: "templates/admin/connector/EditConnectorTemplate.html",
        events: {
            "change #connectorType": "loadConnectorTemplate",
            "click #updateSync": "syncFormSubmit",
            "click #updateAdvanced": "advancedFormSubmit",
            "click .addSchedule": "addLiveSync",
            "click .edit-objectType": "editObjectType",
            "click .delete-objectType": "deleteObjectType",
            "click #addObjectType": "addObjectType",
            "click #deleteResource": "deleteResource",
            "change #selectObjectConfig": "changeObjectTypeConfig",
            "change .retryOptions": "retryOptionChanged",
            "change .maxRetries": "pendingSyncChangesCheck",
            "change .postRetryAction": "postRetryActionChange",
            "change #connectorForm :input": "connectorChangesCheck",
            "keypress #connectorForm :input": "connectorFlowCheck",
            "paste #connectorForm :input": "connectorFlowCheck",
            "change #advancedForm :input": "advancedChangesCheck",
            "click .editSchedule": "editSchedule"
        },
        partials: ["partials/connector/_liveSyncGrid.html"],
        data: {},
        model: {},
        objectTypeConfigs: {
            "org.forgerock.openicf.connectors.ldap-connector": [{
                "displayName": "Saved Configuration",
                "fileName": "savedConfig",
                "type": "ldap"
            }, {
                "displayName": "AD LDAP Configuration",
                "fileName": "provisioner.openicf-adldap",
                "type": "ldap"
            }, {
                "displayName": "ADLDS LDAP Configuration",
                "fileName": "provisioner.openicf-adldsldap",
                "type": "ldap"
            }, {
                "displayName": "DJ LDAP Configuration",
                "fileName": "provisioner.openicf-ldap",
                "type": "ldap"
            }, {
                "displayName": "Full LDAP Configuration",
                "fileName": "fullConfig",
                "type": "ldap"
            }]
        },
        connectorList: null,
        connectorTypeRef: null,
        liveSyncCollection: null,
        oAuthConnector: false,

        render: function render(args, callback) {
            var _this2 = this;

            this.liveSyncCollection = new Backbone.Collection();
            this.data = {};
            this.data.docHelpUrl = constants.DOC_URL;
            this.data.versionDisplay = {};
            this.data.currentMainVersion = null;
            this.data.objectTypes = null;
            this.data.versionCheck = null;
            this.oAuthConnector = false;
            this.connectorTypeRef = null;
            this.connectorList = null;
            this.postActionBlockScript = null;
            this.connectorTypeRef = null;
            this.userDefinedObjectTypes = null;
            this.data.showDataFor = args[1];

            //Get available list of connectors
            $.when(ConnectorDelegate.availableConnectors()).then(function (connectors) {
                _this2.data.connectors = connectors.connectorRef;

                //Build Connector type selection
                _this2.data.versionDisplay = _.chain(_this2.data.connectors).groupBy(function (connectorRef) {
                    return connectorRef.displayName;
                }).pairs().sortBy(function (connectorRef) {
                    return connectorRef[0];
                }).map(function (connectorRef) {
                    connectorRef[1].displayName = connectorRef[0];

                    return {
                        "groupName": connectorRef[0],
                        "versions": connectorRef[1]
                    };
                }).value();

                var splitDetails = args[0].match(/(.*?)_(.*)/).splice(1),
                    urlArgs = router.convertCurrentUrlToJSON(),
                    version = void 0;

                _this2.data.editState = true;
                _this2.data.systemType = splitDetails[0];
                _this2.data.connectorId = splitDetails[1];
                _this2.data.availableObjectTypes = {};

                //Get current connector details
                _this2.getConnectorInfo().then(function (connectorInfo) {
                    var tempVersion = void 0,
                        data = connectorInfo.data;

                    if (connectorInfo.testResult) {
                        //availableObjectTypes are objectTypes that exist in the connector schema
                        _this2.data.availableObjectTypes = _this2.sortAvailableObjectTypes(connectorInfo.testResult.objectTypes);
                        _this2.data.hasAvailableObjectTypes = !_.isEmpty(_this2.data.availableObjectTypes);
                    }

                    _this2.data.connectorIcon = connectorUtils.getIcon(data.connectorRef.connectorName);
                    _this2.currentObjectTypeLoaded = "savedConfig";
                    _this2.data.objectTypeDefaultConfigs = _this2.objectTypeConfigs[data.connectorRef.bundleName];

                    _this2.data.connectorName = data.name;
                    _this2.data.connectorTypeName = data.connectorRef.connectorName;

                    _this2.data.enabled = data.enabled;

                    //Need a check here in the instances where connectors do not have enable
                    if (_.isUndefined(_this2.data.enabled)) {
                        _this2.data.enabled = true;
                    }

                    _this2.data.poolConfigOption = data.poolConfigOption;
                    _this2.data.resultsHandlerConfig = data.resultsHandlerConfig;
                    _this2.data.operationTimeout = data.operationTimeout;

                    if (_this2.data.resultsHandlerConfig) {
                        _this2.data.resultsHandlerConfig.enableAttributesToGetSearchResultsHandler = _this2.data.resultsHandlerConfig.enableAttributesToGetSearchResultsHandler === "true" || _this2.data.resultsHandlerConfig.enableAttributesToGetSearchResultsHandler === true;
                        _this2.data.resultsHandlerConfig.enableCaseInsensitiveFilter = _this2.data.resultsHandlerConfig.enableCaseInsensitiveFilter === "true" || _this2.data.resultsHandlerConfig.enableCaseInsensitiveFilter === true;
                        _this2.data.resultsHandlerConfig.enableFilteredResultsHandler = _this2.data.resultsHandlerConfig.enableFilteredResultsHandler === "true" || _this2.data.resultsHandlerConfig.enableFilteredResultsHandler === true;
                        _this2.data.resultsHandlerConfig.enableNormalizingResultsHandler = _this2.data.resultsHandlerConfig.enableNormalizingResultsHandler === "true" || _this2.data.resultsHandlerConfig.enableNormalizingResultsHandler === true;
                    }

                    //Store in memory version of connector details. This is to ensure we can move around tabs and keep the correct data state.
                    _this2.model.connectorDetails = data;

                    //Build a version object
                    _.each(_this2.data.versionDisplay, function (group) {
                        group.versions = _.map(group.versions, function (v) {
                            v.selected = v.connectorName === this.data.connectorTypeName && v.bundleVersion === data.connectorRef.bundleVersion && v.systemType === this.data.systemType;
                            return v;
                        }, this);
                    }, _this2);

                    _this2.previousObjectType = data.objectTypes;
                    _this2.data.objectTypes = data.objectTypes;

                    //Filter down to the current edited connector Type
                    _this2.data.versionDisplay = _.filter(_this2.data.versionDisplay, function (connector) {
                        return data.connectorRef.connectorName === connector.versions[0].connectorName;
                    });

                    var _versionRangeCheck = _this2.versionRangeCheck(data.connectorRef.bundleVersion);

                    var _versionRangeCheck2 = _slicedToArray(_versionRangeCheck, 2);

                    _this2.data.fullversion = _versionRangeCheck2[0];
                    _this2.data.currentMainVersion = _versionRangeCheck2[1];

                    data.connectorRef.bundleVersion = _this2.data.fullversion;

                    //Filter the connector types down to the current major version
                    _this2.data.versionDisplay[0].versions = _.filter(_this2.data.versionDisplay[0].versions, function (version) {
                        tempVersion = _this2.findMainVersion(version.bundleVersion);

                        return parseFloat(_this2.data.currentMainVersion) === parseFloat(tempVersion);
                    });

                    version = _this2.data.fullversion;

                    if (version.indexOf("(") !== -1 || version.indexOf(")") !== -1 || version.indexOf("[") !== -1 || version.indexOf("]") !== -1) {
                        version = version.replace(/\[|\)|\(|\]/g, '');
                        version = version.split(",");
                        version = version[0].split(".");
                        version = version[0] + "." + version[1];
                    } else {
                        version = version.split(".");
                        version = version[0] + "." + version[1];
                    }

                    if (version >= 1.4) {
                        _this2.data.versionCheck = true;
                    } else {
                        _this2.data.versionCheck = false;
                    }

                    //Get the connector type for top header display
                    _this2.data.displayConnectorType = _this2.data.versionDisplay[0].versions[0].displayName;

                    //OAuth branch
                    if (urlArgs.params && urlArgs.params.code) {
                        _this2.oAuthCode = urlArgs.params.code;

                        ConnectorRegistry.getConnectorModule(_this2.data.connectorTypeName + "_" + _this2.data.currentMainVersion).then(function (connectorTypeRef) {
                            _this2.connectorTypeRef = connectorTypeRef;
                            _this2.connectorTypeRef.getToken(data, _this2.oAuthCode).then(function (tokenDetails) {
                                _this2.connectorTypeRef.setToken(tokenDetails, data, _this2.data.systemType + "/" + _this2.data.connectorId, urlArgs);
                            });
                        });
                    } else {
                        _this2.parentRender(function () {
                            //Sync settings
                            if (data.syncFailureHandler && _.has(data.syncFailureHandler, "maxRetries")) {
                                switch (data.syncFailureHandler.maxRetries) {
                                    case 0:
                                        _this2.$el.find(".retryOptions").val("0").change();
                                        break;
                                    case -1:
                                        _this2.$el.find(".retryOptions").val("-1").change();
                                        break;
                                    default:
                                        _this2.$el.find(".retryOptions").val("*").change();
                                        _this2.$el.find(".maxRetries").val(data.syncFailureHandler.maxRetries);
                                        break;
                                }

                                _this2.$el.find("#connectorWarningMessage .message .sync-pending").remove();
                                _this2.warningMessageCheck();
                            }

                            if (data.syncFailureHandler && _.has(data.syncFailureHandler.postRetryAction, "script")) {
                                _this2.$el.find(".postRetryAction").val("script");
                                _this2.postActionBlockScript = InlineScriptEditor.generateScriptEditor({
                                    "element": _this2.$el.find(".postActionBlock .script"),
                                    "eventName": "",
                                    "deleteElement": false,
                                    "scriptData": data.syncFailureHandler.postRetryAction.script
                                });
                                _this2.$el.find(".postActionBlock .script").show();
                            } else if (data.syncFailureHandler) {
                                _this2.$el.find(".postRetryAction").val(data.syncFailureHandler.postRetryAction);
                            }

                            //set validation for the connector form
                            validatorsManager.bindValidators(_this2.$el.find("#connectorForm"));

                            //alert if a connector is currently set to a bundle version that is outside the bundleVersion range
                            if (_this2.data.rangeFound) {
                                _this2.$el.find("#connectorWarningMessage .message").append('<div class="pending-changes connector-version">' + $.t("config.messages.ConnectorMessages.connectorVersionChange", { "range": _this2.data.oldVersion, "version": data.connectorRef.bundleVersion }) + '</div>');
                                _this2.$el.find("#connectorWarningMessage").show();
                            }

                            //Get connector template
                            ConnectorRegistry.getConnectorModule(_this2.data.connectorTypeName + "_" + _this2.data.currentMainVersion).then(function (connectorTypeRef) {
                                _this2.connectorTypeRef = connectorTypeRef;

                                //Determine if the template is OAuth
                                if (_this2.connectorTypeRef.oAuthConnector) {
                                    _this2.oAuthConnector = true;
                                } else {
                                    _this2.oAuthConnector = false;
                                }

                                //Render the connector template / details
                                _this2.connectorTypeRef.render({ "connectorType": _this2.data.connectorTypeName + "_" + _this2.data.currentMainVersion,
                                    "animate": true,
                                    "connectorDefaults": data,
                                    "editState": _this2.data.editState,
                                    "systemType": _this2.data.systemType }, function () {
                                    validatorsManager.validateAllFields(_this2.$el);

                                    //Set the current newest version incase there is a range
                                    _this2.connectorTypeRef.data.connectorDefaults.connectorRef.bundleVersion = data.connectorRef.bundleVersion;
                                    _this2.setSubmitFlow();

                                    _this2.model.originalForm = _this2.cleanseObject(form2js('connectorForm', '.', false));

                                    _this2.$el.find(".nav-tabs").tabdrop();

                                    if (callback) {
                                        callback();
                                    }
                                });

                                _this2.setupLiveSync();

                                if (_this2.data.showDataFor) {
                                    _this2.$el.find('a[href="#connectorDataTab"]').tab('show');
                                    _this2.loadObjectTypeDataTab(_this2.data.showDataFor);
                                } else if (_.keys(_this2.data.objectTypes).length) {
                                    _this2.loadObjectTypeDataTab();
                                }
                            });
                        });
                    }
                });
            });
        },
        getConnectorInfo: function getConnectorInfo() {
            var _this3 = this;

            return ConfigDelegate.readEntity(this.data.systemType + "/" + this.data.connectorId).then(function (data) {
                return _this3.doConnectorTest(data).then(function (testResult) {
                    return { data: data, testResult: testResult };
                });
            }).then(function (results) {
                var data = results.data,
                    testResult = results.testResult;


                return results;
            });
        },
        doConnectorTest: function doConnectorTest(provisionerConfig) {
            var promise = $.Deferred();

            ConnectorDelegate.testConnector(provisionerConfig).done(function (connectorTestResult) {
                promise.resolve(connectorTestResult);
            }).fail(function () {
                promise.resolve(undefined);
            });

            return promise;
        },

        sortAvailableObjectTypes: function sortAvailableObjectTypes(connectorObjectTypes) {
            var transformed = {};

            //sort the object keys and created a new object with the sorted keys
            _.each(_.keys(connectorObjectTypes).sort(), function (ot) {
                transformed[ot] = connectorObjectTypes[ot];
            });

            return transformed;
        },

        connectorFlowCheck: function connectorFlowCheck() {
            if (this.oAuthConnector) {
                this.setSubmitFlow();
            }
        },

        deleteResource: function deleteResource(event) {
            var connectorPath = "config/" + this.data.systemType + "/" + this.data.connectorId;

            event.preventDefault();

            connectorUtils.deleteConnector(this.data.connectorName, connectorPath, function () {
                eventManager.sendEvent(constants.EVENT_CHANGE_VIEW, { route: router.configuration.routes.connectorListView });
            });
        },

        advancedFormSubmit: function advancedFormSubmit(event) {
            var _this4 = this;

            event.preventDefault();

            var advancedData = this.cleanseObject(form2js('advancedForm', '.', false)),
                mergedResults = this.advancedDetailsGenerate(this.getConnectorConfig(), advancedData);

            ConfigDelegate.updateEntity(this.data.systemType + "/" + this.data.connectorId, mergedResults).then(function () {
                _this4.setConnectorConfig(mergedResults);

                eventManager.sendEvent(constants.EVENT_DISPLAY_MESSAGE_REQUEST, "advancedSaved");

                _this4.$el.find("#connectorWarningMessage .message .advanced-pending").remove();

                _this4.warningMessageCheck();
            });
        },

        advancedDetailsGenerate: function advancedDetailsGenerate(oldAdvanced, newAdvanced) {
            var mergedResults = {},
                tempNumber = void 0,
                defaultOperationTimeout = -1,
                defaultPoolConfigOption = 10;

            $.extend(true, mergedResults, oldAdvanced, newAdvanced);

            //Need to convert all strings to numbers also some safety check to prevent bad values
            _.each(mergedResults.operationTimeout, function (value, key) {
                tempNumber = parseInt(value, 10);

                if (!_.isNaN(tempNumber)) {
                    mergedResults.operationTimeout[key] = parseInt(value, 10);
                } else {
                    mergedResults.operationTimeout[key] = defaultOperationTimeout;
                }
            });

            _.each(mergedResults.poolConfigOption, function (value, key) {
                tempNumber = parseInt(value, 10);

                if (!_.isNaN(tempNumber)) {
                    mergedResults.poolConfigOption[key] = parseInt(value, 10);
                } else {
                    mergedResults.poolConfigOption[key] = defaultPoolConfigOption;
                }
            });

            return mergedResults;
        },

        //Saves the connector tab
        connectorFormSubmit: function connectorFormSubmit(event) {
            var _this5 = this;

            event.preventDefault();

            var updatedForm = this.cleanseObject(form2js('connectorForm', '.', false)),
                patch = this.generateConnectorPatch(this.model.originalForm, updatedForm, this.connectorTypeRef.connectorSaved, this.connectorTypeRef);

            this.data.enabled = updatedForm.enabled;

            ConfigDelegate.patchEntity({ "id": this.data.systemType + "/" + this.data.connectorId }, patch).then(function (preTestResult) {
                _this5.connectorTest(ConnectorDelegate.testConnector(preTestResult), preTestResult, updatedForm);
                _.delay(function () {
                    _this5.loadObjectTypeDataTab();
                }, 1500);
            });
        },

        /**
         *
         * @param testPromise - A promise directed at the testing service in IDM
         * @param preTestResult - The json object of the pre test connector config
         * @param updatedForm - The current form2js object updated
         *
         * Tests the current connector configuration
         */
        connectorTest: function connectorTest(testPromise, preTestResult, updatedForm) {
            var _this6 = this;

            testPromise.then(function () {
                _this6.connectorPass(preTestResult, updatedForm);
            }, function (failMessage) {
                _this6.connectorFail(preTestResult, updatedForm, failMessage);
            });
        },

        /**
         *
         * @param preTestResult - The json object of the pre test connector config
         * @param updatedForm - The current form2js object updated
         *
         * This function fires as a result of a test passing this will set the enable back to true (if originally enabled)
         * and update the configuration
         */
        connectorPass: function connectorPass(preTestResult, updatedForm) {
            var _this7 = this;

            if (updatedForm.enabled) {
                ConfigDelegate.patchEntity({ "id": this.data.systemType + "/" + this.data.connectorId }, [{
                    field: "/enabled",
                    operation: "replace",
                    value: true
                }]).then(function (postTestResult) {
                    _this7.updateSuccessfulConfig(updatedForm, postTestResult);
                });
            } else {
                this.updateSuccessfulConfig(updatedForm, preTestResult);
            }

            ConnectorDelegate.deleteCurrentConnectorsCache();
        },

        /**
         *
         * @param preTestResult - The json object of the pre test connector config
         * @param updatedForm - The current form2js object updated
         * @param failMessage - This is the failure message the UI will use to display
         *
         *  This function fires as a result of a test failing this will keep the enabled state false
         *  and display a proper error message in the UI
         */
        connectorFail: function connectorFail(preTestResult, updatedForm, failMessage) {
            eventManager.sendEvent(constants.EVENT_DISPLAY_MESSAGE_REQUEST, "connectorTestFailed");

            this.model.originalForm = updatedForm;
            this.setConnectorConfig(preTestResult);

            this.$el.find("#connectorEnabled").prop('checked', false);

            this.showError(failMessage);

            ConnectorDelegate.deleteCurrentConnectorsCache();
        },

        /**
         *
         * @param oldForm - The form2js of the form when originally loaded or saved
         * @param currentForm - The current form2js form
         * @returns {*} A patch object for the first connector patch
         *
         * Generates the connector patch object and makes a call to any custom logic per connector needs
         */
        generateConnectorPatch: function generateConnectorPatch(oldForm, currentForm, connectorSpecificChangesEvent, connector) {
            var patch;

            patch = ObjectUtil.generatePatchSet(currentForm, oldForm);

            patch.push({
                field: "/enabled",
                operation: "replace",
                value: false
            });

            if (connectorSpecificChangesEvent) {
                patch = connectorSpecificChangesEvent.call(this, patch, this.getConnectorConfig(), connector);
            }

            return patch;
        },

        /**
         *
         * @param updatedForm - Newly gathered form2js object
         * @param connectorConfig - Connector configuration object
         *
         * Called when the connector has been successfully updated resulting in a UI clean up and in memory configuration update
         */
        updateSuccessfulConfig: function updateSuccessfulConfig(updatedForm, connectorConfig) {
            eventManager.sendEvent(constants.EVENT_DISPLAY_MESSAGE_REQUEST, "connectorSaved");

            this.model.originalForm = updatedForm;
            this.setConnectorConfig(connectorConfig);

            this.$el.find("#connectorWarningMessage .message .connector-version").remove();
            this.$el.find("#connectorWarningMessage .message .connector-pending").remove();
            this.warningMessageCheck();
            this.$el.find("#connectorErrorMessage").hide();
        },

        //Saves the sync tab
        syncFormSubmit: function syncFormSubmit() {
            var _this8 = this;

            var syncData = this.cleanseObject(form2js('syncForm', '.', false)),
                connectorDetails = this.getConnectorConfig();

            connectorDetails.syncFailureHandler.maxRetries = parseInt(syncData.syncFailureHandler.maxRetries, 10);
            connectorDetails.syncFailureHandler.postRetryAction = syncData.syncFailureHandler.postRetryAction;

            if (connectorDetails.syncFailureHandler.postRetryAction === "script") {
                connectorDetails.syncFailureHandler.postRetryAction = { "script": this.postActionBlockScript.generateScript() };
            }

            ConfigDelegate.updateEntity(this.data.systemType + "/" + this.data.connectorId, connectorDetails).then(function () {
                eventManager.sendEvent(constants.EVENT_DISPLAY_MESSAGE_REQUEST, "liveSyncSaved");

                _this8.setConnectorConfig(connectorDetails);

                _this8.$el.find("#connectorWarningMessage .message .sync-pending").remove();
                _this8.warningMessageCheck();
            });
        },

        //Saves the object type tab
        objectTypeFormSubmit: function objectTypeFormSubmit(message) {
            var _this9 = this;

            if (!this.userDefinedObjectTypes) {
                this.userDefinedObjectTypes = this.data.objectTypes;
            }

            this.model.connectorDetails.objectTypes = this.userDefinedObjectTypes;

            ConfigDelegate.updateEntity(this.data.systemType + "/" + this.data.connectorId, this.model.connectorDetails).then(function () {
                _this9.previousObjectType = _this9.userDefinedObjectTypes;
                eventManager.sendEvent(constants.EVENT_DISPLAY_MESSAGE_REQUEST, message);

                _this9.$el.find("#connectorWarningMessage .message .objecttype-pending").remove();

                _this9.warningMessageCheck();

                _this9.updateActionDropdown(_this9.previousObjectType);

                //have to put this delay here because there is a lag between saving the connector
                //and when it is actually available to be read
                _.delay(function () {
                    _this9.loadObjectTypeDataTab();
                }, 1000);
            });
        },

        //When adding a new object type
        addObjectType: function addObjectType(e) {
            var newObjectTypeName = this.$el.find("#availableObjectTypes option:selected").val();

            if (e) {
                e.preventDefault();
            }

            //check to make sure there is a selected new object and there is not already an objectType by the newObjectTypeName
            if (newObjectTypeName && newObjectTypeName.length && !this.data.objectTypes[newObjectTypeName]) {
                this.data.objectTypes[newObjectTypeName] = this.data.availableObjectTypes[newObjectTypeName];
                this.renderObjectTypes(this.data.objectTypes);
                this.objectTypeFormSubmit("objectTypeAdded");
            } else if (newObjectTypeName === undefined) {
                eventManager.sendEvent(constants.EVENT_CHANGE_VIEW, { route: router.configuration.routes.addObjectTypeView, args: [this.data.systemType + "_" + this.data.connectorId] });
            }
        },

        //will hide warning message if no messages left
        warningMessageCheck: function warningMessageCheck() {
            if (this.$el.find("#connectorWarningMessage .message .pending-changes").length === 0) {
                this.$el.find("#connectorWarningMessage").hide();
            }
        },

        addLiveSync: function addLiveSync() {
            var source = this.$el.find(".sources option:selected");

            if (source.length > 0) {

                liveSyncDialog.render({
                    "source": source.val(),
                    "changeType": "add"
                }, _.bind(this.amendLiveSyncGrid, this));
            }
        },

        amendLiveSyncGrid: function amendLiveSyncGrid(schedule) {
            var row = {
                "source": schedule.source,
                "id": schedule.scheduleId,
                "enabled": schedule.enabled,
                "persisted": schedule.persisted
            };

            if (schedule.changeType === "add") {
                this.liveSyncCollection.add(row);
                this.$el.find('.sources [value="' + schedule.source + '"]').remove();
            } else if (schedule.changeType === "edit") {
                this.liveSyncCollection.set(row, { remove: false });
            }
            this.renderGrid();
            this.changeDropdown();
        },

        editSchedule: function editSchedule(e) {
            e.preventDefault();

            var scheduleName = $(e.currentTarget.closest("tr")).data("source"),
                scheduleId = $(e.currentTarget.closest("tr")).data("id");

            liveSyncDialog.render({
                "id": scheduleId,
                "source": scheduleName,
                "changeType": "edit"
            }, _.bind(this.amendLiveSyncGrid, this));
        },

        renderGrid: function renderGrid() {

            var state = "",
                liveSyncGrid = void 0,
                RenderRow = null,
                _this = this;

            this.$el.find("#liveSyncSchedule table").remove();

            RenderRow = Backgrid.Row.extend({
                render: function render() {
                    RenderRow.__super__.render.apply(this, arguments);

                    this.$el.attr('data-source', this.model.attributes.source);
                    this.$el.attr('data-enabled', this.model.attributes.enabled);
                    this.$el.attr('data-persisted', this.model.attributes.persisted);
                    this.$el.attr('data-id', this.model.id);

                    return this;
                }
            });

            liveSyncGrid = new Backgrid.Grid({
                className: "group-field-block table backgrid",
                row: RenderRow,
                columns: BackgridUtils.addSmallScreenCell([{
                    name: "source",
                    sortable: false,
                    editable: false,
                    cell: Backgrid.Cell.extend({
                        render: function render() {
                            var display = '<div data-sync="' + this.model.attributes.source + '">' + _.startCase(_.last(this.model.attributes.source.split("/"))) + '</div>';

                            this.$el.html(display);

                            return this;
                        }
                    })
                }, {
                    name: "enabled",
                    sortable: false,
                    editable: false,
                    cell: Backgrid.Cell.extend({ className: "text-muted" })
                }, {
                    name: "persisted",
                    sortable: false,
                    editable: false,
                    cell: Backgrid.Cell.extend({ className: "text-muted" })
                }, {
                    name: "",
                    sortable: false,
                    editable: false,
                    cell: Backgrid.Cell.extend({
                        events: {
                            "click .deleteSchedule": "deleteSchedule"
                        },

                        deleteSchedule: function deleteSchedule(e) {
                            e.preventDefault();

                            var scheduleName = this.model.attributes.source,
                                scheduleId = this.model.id;

                            _this.$el.find(".sources").append("<option value='" + scheduleName + "'>" + _.startCase(_.last(scheduleName.split("/"))) + "</option>");

                            SchedulerDelegate.deleteSchedule(scheduleId).then(function () {
                                eventManager.sendEvent(constants.EVENT_DISPLAY_MESSAGE_REQUEST, "scheduleDeleted");
                                _this.$el.find("tr[data-id=" + scheduleId + "]").remove();
                                _this.liveSyncCollection.remove({ id: scheduleId });
                                _this.changeDropdown();

                                if (_this.$el.find('tbody tr[data-source]').length === 0) {
                                    _this.$el.find('#liveSyncSchedule table').remove();
                                }
                            });
                        },

                        render: function render() {
                            this.$el.html(Handlebars.compile("{{> connector/_liveSyncGrid}}")());

                            this.delegateEvents();
                            return this;
                        }
                    })
                }]),
                collection: this.liveSyncCollection
            });

            this.$el.find("#liveSyncTable").append(liveSyncGrid.render().el);
        },

        changeDropdown: function changeDropdown() {
            if (this.$el.find(".sources option").length === 0) {
                this.$el.find(".addSchedule").prop('disabled', true);
                this.$el.find(".sources").prop('disabled', true);
            } else {
                this.$el.find(".addSchedule").prop('disabled', false);
                this.$el.find(".sources").prop('disabled', false);
            }
        },

        setupLiveSync: function setupLiveSync() {
            var _this10 = this;

            this.$el.find("#schedules table tbody").empty();

            SchedulerDelegate.getLiveSyncSchedulesByConnectorName(this.model.connectorDetails.name).then(function (schedules) {

                if (schedules.length > 0) {
                    _.each(schedules, function (schedule) {
                        _this10.liveSyncCollection.add({
                            source: schedule.invokeContext.source,
                            id: schedule._id,
                            enabled: schedule.enabled,
                            persisted: schedule.persisted });
                    });
                    _this10.renderGrid();
                }

                _this10.updateLiveSyncObjects();
                _this10.changeDropdown();
            });

            if (!this.postActionBlockScript) {
                this.postActionBlockScript = InlineScriptEditor.generateScriptEditor({
                    "element": this.$el.find(".postActionBlock .script"),
                    "eventName": "",
                    "deleteElement": false
                });
            }
        },

        updateLiveSyncObjects: function updateLiveSyncObjects() {
            var _this11 = this;

            var objectTypes = [];

            if (this.model.connectorDetails.name) {
                this.$el.find(".nameFieldMessage").hide();

                if (this.userDefinedObjectTypes && _.size(this.userDefinedObjectTypes) > 0) {
                    objectTypes = _.map(this.userDefinedObjectTypes, function (object, key) {
                        return "system/" + _this11.model.connectorDetails.name + "/" + key;
                    });
                } else {
                    objectTypes = _.map(this.data.objectTypes, function (object, key) {
                        return "system/" + _this11.model.connectorDetails.name + "/" + key;
                    });
                }

                this.$el.find(".sources").empty();

                if (objectTypes && _.size(objectTypes) > 0) {
                    this.$el.find(".objectTypeFieldMessage").hide();

                    // For each possible liveSync
                    _.each(objectTypes, function (objectName) {
                        // The source is not scheduled add it to dropdown
                        if (_this11.liveSyncCollection.where({ source: objectName }).length === 0) {
                            _this11.$el.find(".sources").append("<option value='" + objectName + "'>" + _.startCase(_.last(objectName.split("/"))) + "</option>");
                            _this11.$el.find(".addLiveSync").prop('disabled', false);
                            _this11.$el.find(".sources").prop('disabled', false);
                        }
                    });
                } else {
                    this.$el.find(".objectTypeFieldMessage").show();
                    this.$el.find(".addLiveSync").prop('disabled', true);
                    this.$el.find(".sources").prop('disabled', true);
                }
            } else {
                this.$el.find(".objectTypeFieldMessage").hide();
                this.$el.find(".addLiveSync").prop('disabled', true);
                this.$el.find(".sources").prop('disabled', true);
                this.$el.find(".nameFieldMessage").show();
            }
        },

        retryOptionChanged: function retryOptionChanged() {
            switch (this.$el.find(".retryOptions").val()) {
                case "0":
                    this.$el.find(".maxRetries").val("0");
                    this.$el.find(".postActionBlock").hide();
                    break;
                case "-1":
                    this.$el.find(".maxRetries").val("-1");
                    this.$el.find(".postActionBlock").show();
                    break;
                case "*":
                    this.$el.find(".maxRetries").val("5");
                    this.$el.find(".postActionBlock").show();
                    break;
            }

            this.pendingSyncChangesCheck();
        },

        postRetryActionChange: function postRetryActionChange() {
            if (this.$el.find(".postRetryAction").val() === "script") {
                this.$el.find(".postActionBlock .script").show();
            } else {
                this.$el.find(".postActionBlock .script").hide();
            }

            this.pendingSyncChangesCheck();
        },

        pendingSyncChangesCheck: function pendingSyncChangesCheck() {
            if (this.$el.find("#connectorWarningMessage .message .sync-pending").length === 0) {
                this.$el.find("#connectorWarningMessage .message").append('<div class="pending-changes sync-pending">' + $.t("templates.connector.pendingSync") + '</div>');
                this.$el.find("#connectorWarningMessage").show();
            }
        },

        connectorChangesCheck: function connectorChangesCheck() {
            if (this.$el.find("#connectorWarningMessage .message .connector-pending").length === 0) {
                this.$el.find("#connectorWarningMessage .message").append('<div class="pending-changes connector-pending">' + $.t("templates.connector.pendingConnectorChanges") + '</div>');
                this.$el.find("#connectorWarningMessage").show();
            }
        },

        advancedChangesCheck: function advancedChangesCheck() {
            if (this.$el.find("#connectorWarningMessage .message .advanced-pending").length === 0) {
                this.$el.find("#connectorWarningMessage .message").append('<div class="pending-changes advanced-pending">' + $.t("templates.connector.advanced.pendingAdvancedChanges") + '</div>');
                this.$el.find("#connectorWarningMessage").show();
            }
        },

        //This function is to find the newest version of a connector and verify that it falls within a user provided range
        versionRangeCheck: function versionRangeCheck(version) {
            var _this12 = this;

            var cleanVersion = null,
                tempVersion = void 0,
                tempMinorVersion = void 0,
                mainVersion = void 0,
                minorVersion = void 0;

            //Checks to see if there is a range
            if (version.indexOf("(") !== -1 || version.indexOf(")") !== -1 || version.indexOf("[") !== -1 || version.indexOf("]") !== -1) {
                if (this.data.versionDisplay[0].versions.length === 1) {
                    cleanVersion = this.data.versionDisplay[0].versions[0].bundleVersion;
                    mainVersion = this.findMainVersion(cleanVersion);
                } else {
                    _.each(this.data.versionDisplay[0].versions, function (versions) {
                        if (cleanVersion === null) {
                            cleanVersion = versions.bundleVersion;
                        } else {
                            tempVersion = _this12.findMainVersion(versions.bundleVersion);
                            tempMinorVersion = _this12.findMinorVersion(versions.bundleVersion);

                            mainVersion = _this12.findMainVersion(cleanVersion);
                            minorVersion = _this12.findMinorVersion(cleanVersion);

                            //Parse float is used to convert the returned string version to a number to allow basic comparison of greater / lesser value
                            if (parseFloat(mainVersion) < parseFloat(tempVersion)) {
                                cleanVersion = versions.bundleVersion;
                            } else if (parseFloat(mainVersion) === parseFloat(tempVersion)) {
                                if (parseFloat(minorVersion) < parseFloat(tempMinorVersion)) {
                                    cleanVersion = versions.bundleVersion;
                                }
                            }
                        }
                    });
                }
                if (this.isRangeValid(cleanVersion, version)) {
                    this.data.rangeFound = false;
                    cleanVersion = version;
                } else {
                    this.data.rangeFound = true;
                    this.data.oldVersion = version;
                }
            } else {
                this.data.rangeFound = false;
                cleanVersion = version;
                mainVersion = this.findMainVersion(cleanVersion);
            }

            return [cleanVersion, mainVersion];
        },

        // make sure current connector version falls within bundleVersion range
        isRangeValid: function isRangeValid(mainVersion, range) {
            var startRange = void 0,
                endRange = void 0;

            var _range$split = range.split(",");

            var _range$split2 = _slicedToArray(_range$split, 2);

            startRange = _range$split2[0];
            endRange = _range$split2[1];

            startRange = this.findMainVersion(startRange.slice(1));
            endRange = this.findMainVersion(endRange.slice(0, -1));

            return mainVersion >= startRange && mainVersion < endRange;
        },


        //Returns the current provisioner based on a merged copy of the connector defaults and what was set in the template by the user
        setConnectorConfig: function setConnectorConfig(config) {
            this.model.connectorDetails = config;
        },
        getConnectorConfig: function getConnectorConfig() {
            return _.cloneDeep(this.model.connectorDetails);
        },

        /**
         * This function is required for OAuth connectors. This should be removed in the future when we have time to refactor the oAuth connectors to utilize patch.
         *
         * @returns Returns a connctor object resulting from the original connector object and the form2js results from the connector form
         */
        getProvisioner: function getProvisioner() {
            var connectorData = {},
                connDetails = this.getConnectorConfig(),
                mergedResult = {};

            connectorData = form2js('connectorForm', '.', false);

            delete connectorData.connectorType;

            connectorData.configurationProperties.readSchema = false;
            connectorData.objectTypes = {};

            $.extend(true, mergedResult, connDetails, connectorData);

            mergedResult.objectTypes = this.userDefinedObjectTypes || this.data.objectTypes;

            return mergedResult;
        },

        //Renders the object type table
        renderObjectTypes: function renderObjectTypes(newObjectTypes) {
            var _this13 = this;

            this.userDefinedObjectTypes = newObjectTypes;

            this.$el.find("#objectTypesTab table tbody").empty();

            _.each(this.userDefinedObjectTypes, function (object, key) {
                _this13.$el.find("#objectTypesTab table tbody").append("<tr data-objecttype='" + key + "'><td>" + key + "</td>" + "<td><button class='btn btn-link edit-objectType'><i class='fa fa-pencil'></i></button>" + "<button class='btn btn-link delete-objectType'><i class='fa fa-times'></i></button></td></tr>");
            });

            this.updateLiveSyncObjects();

            if (this.$el.find("#connectorWarningMessage .message .objecttype-pending").length === 0) {
                this.$el.find("#connectorWarningMessage .message").append('<div class="pending-changes objecttype-pending">' + $.t("templates.connector.pendingObjectTypes") + '</div>');
                this.$el.find("#connectorWarningMessage").show();
            }
        },

        //Since we are using tab panels we need custom validate to correctly enable / disable the connector submit
        validationSuccessful: function validationSuccessful(event) {
            AbstractConnectorView.prototype.validationSuccessful(event);

            this.$el.find("#submitConnector").attr("disabled", false);
        },

        validationFailed: function validationFailed(event, details) {
            AbstractConnectorView.prototype.validationFailed(event, details);

            this.$el.find("#submitConnector").attr("disabled", true);
        },

        //When clicking the pencil for an object type
        editObjectType: function editObjectType(event) {
            var objectTypeName = $(event.target).parents("tr").attr("data-objectType");

            eventManager.sendEvent(constants.EVENT_CHANGE_VIEW, { route: router.configuration.routes.editObjectTypeView, args: [this.data.systemType + "_" + this.data.connectorId, objectTypeName] });
        },

        //When clicking the delete icon for an object type
        deleteObjectType: function deleteObjectType(event) {
            var _this14 = this;

            UIUtils.confirmDialog($.t("templates.connector.objectTypes.deleteObjectTypeConfirmation"), "danger", function () {
                var objectTypeName = $(event.target).parents("tr").attr("data-objectType");

                if (!_this14.userDefinedObjectTypes) {
                    _this14.userDefinedObjectTypes = _this14.data.objectTypes;
                }

                delete _this14.userDefinedObjectTypes[objectTypeName];

                _this14.renderObjectTypes(_this14.userDefinedObjectTypes);
                _this14.objectTypeFormSubmit("objectTypeDeleted");
            });
        },

        //After saving or deleting an object type re-renders the action list so it is in sync with the available data pieces
        updateActionDropdown: function updateActionDropdown(objectTypes) {
            this.$el.find(".dropdown-menu .data-link").remove();

            _.each(objectTypes, function (object, key) {
                this.$el.find(".dropdown-menu .divider").before('<li class="data-link">' + '<a href="#resource/system/' + this.data.connectorId + '/' + key + '/list/"><i class="fa fa-database"> Data (' + key + ')</i></a>' + '</li>');
            }, this);
        },

        //Used when an object type template selector is available.
        changeObjectTypeConfig: function changeObjectTypeConfig(event) {
            var _this15 = this;

            var value = $(event.target).val(),
                type = $(event.target).attr("data-type");

            if (!this.userDefinedObjectTypes) {
                this.userDefinedObjectTypes = this.data.objectTypes;
            }

            $(event.target).val(this.currentObjectTypeLoaded);

            UIUtils.jqConfirm($.t('templates.connector.objectTypes.changeConfiguration'), function () {
                if (value === "fullConfig") {
                    _this15.model.connectorDetails.configurationProperties.readSchema = true;

                    ConnectorDelegate.testConnector(_this15.model.connectorDetails).then(function (result) {
                        eventManager.sendEvent(constants.EVENT_DISPLAY_MESSAGE_REQUEST, "objectTypeLoaded");

                        _this15.renderObjectTypes(result.objectTypes);
                    }, function () {
                        eventManager.sendEvent(constants.EVENT_DISPLAY_MESSAGE_REQUEST, "objectTypeFailedToLoad");
                    });
                } else if (value === "savedConfig") {
                    if (_this15.previousObjectType) {
                        _this15.renderObjectTypes(_this15.previousObjectType);
                    }
                } else {
                    ConnectorDelegate.connectorDefault(value, type).then(function (result) {
                        eventManager.sendEvent(constants.EVENT_DISPLAY_MESSAGE_REQUEST, "objectTypeLoaded");

                        _this15.renderObjectTypes(result.objectTypes);
                    }, function () {
                        eventManager.sendEvent(constants.EVENT_DISPLAY_MESSAGE_REQUEST, "objectTypeFailedToLoad");
                    });
                }

                _this15.currentObjectTypeLoaded = value;
                $(event.target).val(_this15.currentObjectTypeLoaded);
            });
        },

        loadObjectTypeDataTab: function loadObjectTypeDataTab(objectType) {
            if (!objectType) {
                objectType = _.keys(this.data.objectTypes)[0];
            }

            ConnectorDataTabView.render([this, objectType]);
        }
    });

    return new AddEditConnectorView();
});
