"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/openidm/ui/admin/settings/audit/AuditAdminAbstractView", "org/forgerock/openidm/ui/admin/delegates/AuditDelegate", "org/forgerock/commons/ui/common/util/UIUtils", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/openidm/ui/admin/util/InlineScriptEditor", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/ValidatorsManager", "bootstrap-dialog", "jsonEditor", "bootstrap-tabdrop", "selectize"], function ($, _, AuditAdminAbstractView, AuditDelegate, uiUtils, conf, InlineScriptEditor, constants, ValidatorsManager, BootstrapDialog, JSONEditor) {

    var AuditEventHandlersDialog = AuditAdminAbstractView.extend({
        template: "templates/admin/settings/audit/AuditEventHandlersDialogTemplate.html",
        el: "#dialogs",
        events: {},
        model: {},

        render: function render(args, callback) {
            var _this = this,
                title = "";

            this.data = _.clone(args);

            // We don't want JSON Editor handeling these fields, we will add them back to the config before saving.
            if (_.has(this.data.eventHandler, "config")) {
                if (_.has(this.data.eventHandler.config, "name")) {
                    this.data.name = this.data.eventHandler.config.name;
                    delete this.data.eventHandler.config.name;
                }
                if (_.has(this.data.eventHandler.config, "topics")) {
                    this.data.selectedTopics = this.data.eventHandler.config.topics;
                    delete this.data.eventHandler.config.topics;
                }

                if (_.has(this.data.eventHandler.config, "enabled")) {
                    this.data.enabled = this.data.eventHandler.config.enabled;
                    delete this.data.eventHandler.config.enabled;
                    // When the property enabled is not present but a handler is, treat it as enabled.
                } else {
                    this.data.enabled = true;
                }
            }

            if (this.data.newEventHandler) {
                title = $.t("templates.audit.eventHandlers.dialog.add") + ": " + _.last(this.data.eventHandlerType.split("."));
            } else {
                title = $.t("templates.audit.eventHandlers.dialog.edit") + ": " + this.data.name;
            }

            this.data.topics = _.union(this.data.selectedTopics, this.getTopics());

            AuditDelegate.availableHandlers().then(_.bind(function (data) {
                this.data.handler = _.findWhere(data, { "class": this.data.eventHandlerType });

                this.model.currentDialog = $('<div id="AuditEventHandlersDialog"></div>');
                this.setElement(this.model.currentDialog);
                $('#dialogs').append(this.model.currentDialog);

                BootstrapDialog.show({
                    title: title,
                    size: BootstrapDialog.SIZE_WIDE,
                    type: BootstrapDialog.TYPE_DEFAULT,
                    message: this.model.currentDialog,
                    onshown: function onshown() {
                        _this.renderTemplate(_this.data);
                    },
                    buttons: [{
                        label: $.t("common.form.cancel"),
                        action: function action(dialogRef) {
                            dialogRef.close();
                        }
                    }, {
                        label: $.t("common.form.submit"),
                        id: "submitAuditEventHandlers",
                        cssClass: "btn-primary",
                        action: _.bind(function (dialogRef) {
                            var data = {
                                eventHandler: {}
                            };

                            data.eventHandler.class = this.data.eventHandlerType;

                            if (!_.isEmpty(this.data.schemaEditor)) {
                                data.eventHandler.config = this.data.schemaEditor.getValue();
                            }

                            data.eventHandler.config.name = this.$el.find("#eventHandlerName").val();
                            data.eventHandler.config.topics = this.$el.find(".topics").val();
                            data.eventHandler.config.enabled = this.$el.find("#enabled").is(":checked");

                            if (callback) {
                                callback(data);
                            }

                            dialogRef.close();
                        }, _this)
                    }]
                });
            }, this));
        },

        /**
         * Performs a deep search of a provided object,
         * if any nested properties has the key "description" it is translated.
         * @param schema
         */
        translateDescriptions: function translateDescriptions(schema) {
            if (_.has(schema, "description")) {
                schema.description = $.t(schema.description);
            }

            _.forEach(schema, function (subSchema) {
                if (_.isObject(subSchema)) {
                    this.translateDescriptions(subSchema);
                }
            }, this);
        },

        renderTemplate: function renderTemplate(data) {
            uiUtils.renderTemplate(this.template, this.$el, _.extend({}, conf.globalData, data), _.bind(function (data) {
                var schema = {};

                if (_.has(this.data.handler, "config")) {
                    schema = this.data.handler.config;

                    //override the endOfLineSymbols in the csv handler and set the default delimiterChar
                    if (schema.properties && schema.properties.formatting && schema.properties.formatting.properties && schema.properties.formatting.properties.endOfLineSymbols) {
                        if (_.has(schema, "properties.formatting.properties.delimiterChar") && (!_.has(this.data.eventHandler.config, "formatting.delimiterChar") || !this.data.eventHandler.config.formatting.delimiterChar)) {
                            this.data.eventHandler.config = this.data.eventHandler.config || {};
                            this.data.eventHandler.config.formatting = this.data.eventHandler.config.formatting || {};
                            this.data.eventHandler.config.formatting.delimiterChar = ",";
                        }

                        schema.properties.formatting.properties.endOfLineSymbols.enum = [String.fromCharCode(10), String.fromCharCode(13), String.fromCharCode(13) + String.fromCharCode(10)];
                        schema.properties.formatting.properties.endOfLineSymbols.options = {
                            "enum_titles": [$.t("templates.audit.eventHandlers.endOfLineSymbols.linefeed"), $.t("templates.audit.eventHandlers.endOfLineSymbols.carriageReturn"), $.t("templates.audit.eventHandlers.endOfLineSymbols.carriageReturnLinefeed")]
                        };
                    }
                }

                if (!_.isEmpty(schema)) {

                    if (_.has(schema.properties, "name")) {
                        delete schema.properties.name;
                    }
                    if (_.has(schema.properties, "topics")) {
                        delete schema.properties.topics;
                    }
                    if (_.has(schema.properties, "enabled")) {
                        delete schema.properties.enabled;
                    }

                    // default value for signatureInterval
                    if (_.has(schema, "properties.security.properties.signatureInterval") && (!_.has(this.data.eventHandler.config, "security.signatureInterval") || !this.data.eventHandler.config.security.signatureInterval)) {
                        this.data.eventHandler.config = this.data.eventHandler.config || {};
                        this.data.eventHandler.config.security = this.data.eventHandler.config.security || {};
                        this.data.eventHandler.config.security.signatureInterval = "1 hour";
                    }

                    this.translateDescriptions(schema);
                    this.data.schemaEditor = new JSONEditor(this.$el.find("#auditEventHandlerConfig")[0], {
                        "schema": schema,
                        "disable_edit_json": true,
                        "disable_array_reorder": false,
                        "disable_collapse": true,
                        "disable_properties": false,
                        "show_errors": "never",
                        "template": "handlebars",
                        "iconlib": "fontawesome4",
                        "theme": "bootstrap3",
                        "no_additional_properties": false,
                        "additionalItems": true,
                        "required_by_default": true
                    });

                    this.data.schemaEditor.setValue(this.data.eventHandler.config);
                }

                this.$el.find(".topics").selectize({
                    delimiter: ',',
                    persist: false,
                    create: false,
                    items: this.data.selectedTopics
                });

                if (_.isEmpty(schema.properties)) {
                    this.$el.find(".jsonEditorContainer").hide();
                }

                ValidatorsManager.bindValidators(this.$el.find("#auditEventHandlersForm"));
                ValidatorsManager.validateAllFields(this.$el.find("#auditEventHandlersForm"));
            }, this), "replace");
        },

        validationSuccessful: function validationSuccessful(event) {
            AuditAdminAbstractView.prototype.validationSuccessful(event);

            if (ValidatorsManager.formValidated(this.$el.find("#auditEventHandlersForm"))) {
                this.$el.parentsUntil(".model-content").find("#submitAuditEventHandlers").prop('disabled', false);
            }
        },

        validationFailed: function validationFailed(event, details) {
            AuditAdminAbstractView.prototype.validationFailed(event, details);

            this.$el.parentsUntil(".model-content").find("#submitAuditEventHandlers").prop('disabled', true);
        }
    });

    return new AuditEventHandlersDialog();
});
