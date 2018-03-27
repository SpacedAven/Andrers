"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/openidm/ui/admin/settings/audit/AuditAdminAbstractView", "org/forgerock/commons/ui/common/util/UIUtils", "org/forgerock/commons/ui/common/main/Configuration", "bootstrap-dialog", "org/forgerock/commons/ui/common/main/ValidatorsManager", "selectize"], function ($, _, AuditAdminAbstractView, UIUtils, Conf, BootstrapDialog, ValidatorsManager) {

    var AuditFilterPoliciesDialog = AuditAdminAbstractView.extend({
        template: "templates/admin/settings/audit/AuditFilterPoliciesDialogTemplate.html",
        el: "#dialogs",
        events: {},

        /**
         * Opens the dialog
         *
         * @param configs
         * @param callback
         */
        render: function render(configs, callback) {
            var _this = this,
                title = "";

            this.model = _.extend({}, configs);
            this.data = {};

            this.data.topics = this.getTopics();

            if (this.model.newFilter) {
                title = $.t("templates.audit.filterPolicies.add");
            } else {
                title = $.t("templates.audit.filterPolicies.edit");
                this.data.filter = this.model.filter;
            }

            this.model.currentDialog = $('<div id="AuditFilterPoliciesDialog"></div>');
            this.setElement(this.model.currentDialog);
            $('#dialogs').append(this.model.currentDialog);

            _.bind(UIUtils.renderTemplate, this)(this.template, this.$el, _.extend({}, Conf.globalData, this.data), _.bind(function () {

                this.$el.find(".type-select").selectize();
                this.$el.find(".topic-select").selectize();
                // Will be supported next release
                //this.$el.find(".include-exclude-select").selectize();

                if (!this.model.newFilter) {
                    this.$el.find(".type-select")[0].selectize.setValue(this.data.filter.typeLiteral);
                    this.$el.find(".topic-select")[0].selectize.setValue(this.data.filter.topic);
                    // Will be supported next release
                    //this.$el.find(".include-exclude-select")[0].selectize.setValue(this.data.filter.includeExcludeLiteral);
                }
            }, this), "replace");

            BootstrapDialog.show({
                title: title,
                size: BootstrapDialog.SIZE_WIDE,
                type: BootstrapDialog.TYPE_DEFAULT,
                message: this.model.currentDialog,
                onshown: _.bind(function () {
                    ValidatorsManager.bindValidators(this.$el.find(".audit-filter-form"));
                    ValidatorsManager.validateAllFields(this.$el.find(".audit-filter-form"));

                    if (callback) {
                        callback();
                    }
                }, this),
                buttons: [{
                    label: $.t("common.form.cancel"),
                    action: function action(dialogRef) {
                        dialogRef.close();
                    }
                }, {
                    label: $.t("common.form.submit"),
                    id: "submitAuditFilters",
                    cssClass: "btn-primary",
                    action: _.bind(function (dialogRef) {
                        if (this.model.saveCallback) {
                            this.model.saveCallback(this.$el.find(".type-select").val(), "excludeIf",
                            // Will be supported next release
                            //this.$el.find(".include-exclude-select").val(),
                            "/" + this.$el.find(".topic-select").val() + "/" + this.$el.find(".location-input").val());
                        }
                        dialogRef.close();
                    }, _this)
                }]
            });
        },

        validationSuccessful: function validationSuccessful(event) {
            AuditAdminAbstractView.prototype.validationSuccessful(event);

            if (ValidatorsManager.formValidated(this.$el.find("#submitAuditFilters"))) {
                this.$el.parentsUntil(".model-content").find("#submitAuditFilters").prop('disabled', false);
            }
        },

        validationFailed: function validationFailed(event, details) {
            AuditAdminAbstractView.prototype.validationFailed(event, details);

            this.$el.parentsUntil(".model-content").find("#submitAuditFilters").prop('disabled', true);
        }
    });

    return new AuditFilterPoliciesDialog();
});
