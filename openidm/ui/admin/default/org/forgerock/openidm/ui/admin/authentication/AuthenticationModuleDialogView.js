"use strict";

/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "bootstrap-dialog", "org/forgerock/openidm/ui/admin/authentication/AuthenticationAbstractView", "org/forgerock/openidm/ui/admin/util/AdminUtils", "selectize"], function ($, _, BootstrapDialog, AuthenticationAbstractView, AdminUtils) {

    var AuthenticationModuleDialogView = AuthenticationAbstractView.extend({
        element: "#dialogs",
        noBaseTemplate: true,
        events: {
            "click .advancedForm > div > h3": "toggleAdvanced",
            "change .changes-watched": "changed"
        },
        model: {},
        data: {},

        /**
         * @param configs {object}
         * @param configs.config {object} - the existing config for the module
         * @param callback
         */
        render: function render(configs) {
            this.model = _.extend({
                defaultUserRoles: ["openidm-admin", "openidm-authorized", "openidm-cert", "openidm-reg", "openidm-task-manager"]
            }, configs);

            this.model.readableName = $.t("templates.auth.modules." + this.model.config.name + ".name");

            //TODO: OPENIDM-6189 - When ModuleLoader properly rejects promises use the following commented out code and remove the getModuleView function.
            //var viewPath = "org/forgerock/openidm/ui/admin/authentication/modules/test" + this.model.config.name;

            // Get resources and get the JSON schema
            //$.when(AdminUtils.getAvailableResourceEndpoints(), ModuleLoader.load(viewPath))
            $.when(AdminUtils.getAvailableResourceEndpoints(), this.getModuleView(this.model.config.name)).done(_.bind(function (resources, view) {
                var _this = this;

                $("#missingTemplateError").toggleClass("hidden", true);
                this.parentRender(function () {
                    var self = _this,
                        prefix = $.t("templates.auth.modules.edit");

                    if (_this.model.newModule) {
                        prefix = $.t("templates.auth.modules.new");
                    }

                    _this.model.currentDialog = $('<div id="AuthenticationModuleDialog"></div>');
                    _this.setElement(_this.model.currentDialog);
                    $('#dialogs').append(_this.model.currentDialog);

                    BootstrapDialog.show({
                        title: prefix + " " + _this.model.readableName + " " + $.t("templates.auth.modules.authFieldsetName"),
                        size: BootstrapDialog.SIZE_WIDE,
                        type: BootstrapDialog.TYPE_DEFAULT,
                        message: '<div id="AuthenticationModuleDialogContainer"></div>',
                        onshown: function onshown() {
                            view.render(_.extend({ "resources": resources }, _this.model));
                        },
                        buttons: [{
                            label: $.t("common.form.cancel"),
                            action: function action(dialogRef) {
                                dialogRef.close();
                            }
                        }, {
                            label: $.t("common.form.save"),
                            id: "submitAuth",
                            cssClass: "btn-primary",
                            action: function action(dialogRef) {
                                if (this.hasClass("disabled")) {
                                    return false;
                                }

                                self.model.saveCallback(view.getConfig());
                                dialogRef.close();
                            }
                        }]
                    });
                });
            }, this)).fail(function (brokenModuleName) {
                $("#missingTemplateError").toggleClass("hidden", false);
                $("#missingTemplateName").text(brokenModuleName);
            });
        },

        /**
         * Gets the view corresponding to the moduleName provided
         *
         * @param moduleName
         * @returns {promise}
         */
        getModuleView: function getModuleView(moduleName) {
            var viewPromise = $.Deferred();

            require(["org/forgerock/openidm/ui/admin/authentication/modules/" + moduleName], function (result) {
                viewPromise.resolve(result);
            }, function () {
                viewPromise.reject(moduleName);
            });

            return viewPromise;
        }
    });

    return new AuthenticationModuleDialogView();
});
