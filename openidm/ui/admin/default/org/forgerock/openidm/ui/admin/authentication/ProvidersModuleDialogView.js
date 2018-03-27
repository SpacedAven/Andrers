"use strict";

/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/openidm/ui/admin/util/AdminUtils", "org/forgerock/commons/ui/common/util/UIUtils", "org/forgerock/commons/ui/common/main/ValidatorsManager", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/openidm/ui/common/delegates/ConfigDelegate", "bootstrap-dialog", "org/forgerock/openidm/ui/admin/authentication/AuthenticationAbstractView", "org/forgerock/openidm/ui/admin/delegates/ExternalAccessDelegate", "org/forgerock/openidm/ui/admin/selfservice/SelfServiceUtils"], function ($, _, AdminUtils, UIUtils, ValidatorsManager, Configuration, EventManager, Constants, ConfigDelegate, BootstrapDialog, AuthenticationAbstractView, ExternalAccessDelegate, SelfServiceUtils) {

    var ProvidersModuleDialogView = AuthenticationAbstractView.extend({
        template: "templates/admin/authentication/ProvidersModuleDialogViewTemplate.html",
        element: "#dialogs",
        noBaseTemplate: true,
        events: {
            "change #amURL": "generateAuthFromWellKnownURL",
            "click .btn-copy": "copyToClipboard"
        },
        partials: ["partials/_alert.html"],
        model: {
            defaultConfig: {
                "name": "OAUTH_CLIENT",
                "properties": {
                    "augmentSecurityContext": {
                        "type": "text/javascript",
                        "globals": {
                            "sessionValidationBaseEndpoint": ""
                        },
                        "file": "auth/amSessionCheck.js"
                    },
                    "propertyMapping": {
                        "authenticationId": "uid",
                        "userRoles": "authzRoles"
                    },
                    "defaultUserRoles": ["openidm-authorized"],
                    "idpConfig": {
                        "provider": "OPENAM",
                        "icon": "<button class=\"btn btn-lg btn-default btn-block btn-social-provider\"><img src=\"images/forgerock_logo.png\">Sign In</button>",
                        "scope": ["openid"],
                        "authenticationIdKey": "sub",
                        "clientId": "",
                        "clientSecret": "",
                        "authorizationEndpoint": "",
                        "tokenEndpoint": "",
                        "endSessionEndpoint": "",
                        "wellKnownEndpoint": "https://openam.example.com/openam/oauth2/.well-known/openid-configuration",
                        "redirectUri": "https://localhost:8443/oauthReturn/",
                        "configClass": "org.forgerock.oauth.clients.oidc.OpenIDConnectClientConfiguration",
                        "displayIcon": "forgerock",
                        "enabled": true
                    },
                    "queryOnResource": "system/ldap/account"
                },
                "enabled": false
            }
        },
        data: {
            pw_filler: $.t("common.form.passwordPlaceholder"),
            AMDocHelpUrl: Constants.AM_DOC_URL
        },
        /**
         * @param configs {object}
         * @param configs.config {object} - the existing config for the module
         * @param callback
         */
        render: function render(configs) {
            var _this = this;

            _.extend(this.model, configs);
            var self = this;

            this.data.interruptClose = false;

            if (_.isEmpty(this.model.config)) {
                this.setConfig(this.model.defaultConfig);
            } else {
                this.setConfig(this.model.config);
            }

            this.data.uri = window.location.protocol + "//" + window.location.host + "/";

            AdminUtils.getAvailableResourceEndpoints().then(function (resources) {
                _this.data.resources = resources;
            }).then(function () {
                var promise = new $.Deferred();
                _this.parentRender(function () {
                    return promise.resolve();
                });
                return promise;
            }).then(function () {
                _this.model.currentDialog = $('<div id="ProviderModuleDialog"></div>');
                _this.setElement(_this.model.currentDialog);
                $('#dialogs').append(_this.model.currentDialog);

                BootstrapDialog.show({
                    title: $.t("templates.auth.providers.providerDialogTitle"),
                    size: BootstrapDialog.SIZE_WIDE,
                    type: BootstrapDialog.TYPE_DEFAULT,
                    message: _this.model.currentDialog,
                    onshown: function onshown() {
                        UIUtils.renderTemplate(self.template, self.$el, _.extend({}, Configuration.globalData, self.data), function () {
                            // Validates starting values
                            self.generateAuthFromWellKnownURL(true);

                            ValidatorsManager.bindValidators(self.$el.find("form"));
                            ValidatorsManager.validateAllFields(self.$el.find("form"));
                        }, "replace");
                    },
                    onhide: function onhide() {
                        if (!self.data.interruptClose) {
                            self.model.cancelCallback();
                        }
                    },
                    buttons: [{
                        label: $.t("common.form.cancel"),
                        action: function action(dialogRef) {
                            dialogRef.close();
                        }
                    }, {
                        label: $.t("common.form.submit"),
                        id: "submitAuth",
                        cssClass: "btn-primary",
                        action: function action(dialogRef) {
                            if (this.hasClass("disabled")) {
                                return false;
                            }

                            var saveConfig = self.getSaveConfig();

                            if (saveConfig) {
                                self.saveConfig(saveConfig);
                                self.data.interruptClose = true;
                                dialogRef.close();
                            }
                        }
                    }]
                });
            });
        },

        copyToClipboard: function copyToClipboard(e) {
            // Select the content
            $(e.currentTarget).closest(".input-group").find("input").select();
            // Copy to the clipboard
            document.execCommand('copy');
        },

        getConfig: function getConfig() {
            return this.data.currentConfig;
        },

        setConfig: function setConfig(config) {
            this.data.currentConfig = config;
        },

        getSaveConfig: function getSaveConfig() {
            var currentConfig = this.getConfig(),
                id = this.$el.find("#amClientID").val(),
                secret = this.$el.find("#amClientSecret").val(),
                queryOnResource = this.$el.find("[name='properties.queryOnResource']").val();

            if (secret.length > 0) {
                _.set(currentConfig.properties.idpConfig, "clientSecret", secret);
            }

            _.set(currentConfig.properties.idpConfig, "clientId", id);
            _.set(currentConfig.properties, "queryOnResource", queryOnResource);
            _.set(currentConfig, "enabled", true);
            _.set(currentConfig.properties, "idpConfig.redirectUri", window.location.protocol + "//" + window.location.host + "/oauthReturn/");

            return currentConfig;
        },

        getAuthModulesConfig: function getAuthModulesConfig(authData, AMAuthConfig) {
            var allAuthModules = _.get(authData, "authModules");

            // Set cache period
            _.set(authData, "sessionModule.properties.maxTokenLifeSeconds", "5");
            _.set(authData, "sessionModule.properties.tokenIdleTimeSeconds", "5");
            delete authData.sessionModule.properties.maxTokenLifeMinutes;
            delete authData.sessionModule.properties.tokenIdleTimeMinutes;

            // Disable all modules besides static user and internal user which are always enabled.
            _.map(allAuthModules, function (module) {
                module.enabled = module.name === "STATIC_USER" || module.name === "INTERNAL_USER";
            });

            var openAMModuleIndex = this.getAMModuleIndex(allAuthModules);

            // If the OPENAM modules doesn't exist push it
            if (openAMModuleIndex === -1) {
                allAuthModules.push(AMAuthConfig);

                // If it does exist, replace it
            } else {
                allAuthModules[openAMModuleIndex] = AMAuthConfig;
            }

            return authData;
        },

        saveConfig: function saveConfig(AMAuthConfig) {
            var _this2 = this;

            var newAuth = this.getAuthModulesConfig(this.getAuthenticationData(), AMAuthConfig);
            this.setProperties(["authModules", "sessionModule"], newAuth);

            var _SelfServiceUtils$get = SelfServiceUtils.getAMDetailsFromWellknownEndpoint(AMAuthConfig.properties.idpConfig.wellKnownEndpoint),
                openAMBaseUrl = _SelfServiceUtils$get.openAMBaseUrl,
                authenticationEndpoint = _SelfServiceUtils$get.authenticationEndpoint,
                amDataEndpoints = _SelfServiceUtils$get.amDataEndpoints;

            if (openAMBaseUrl && authenticationEndpoint && amDataEndpoints) {
                return SelfServiceUtils.setAMAutoLogin(openAMBaseUrl, authenticationEndpoint).then(function () {
                    return _this2.saveAmDataEndpoints(amDataEndpoints);
                }).then(function () {
                    return _this2.saveAuthentication();
                });
            } else {
                return this.saveAuthentication();
            }
        },

        generateAuthFromWellKnownURL: function generateAuthFromWellKnownURL(suppressMsg) {
            var _this3 = this;

            var wellKnownURL = this.$el.find("#amURL").val(),
                currentConfig = this.getConfig();

            ExternalAccessDelegate.externalRestRequest(wellKnownURL).then(function (config) {
                var sessionValidationBaseEndpoint = wellKnownURL.replace('oauth2', 'json').replace('.well-known/openid-configuration', 'sessions/');

                _.set(currentConfig.properties.idpConfig, "wellKnownEndpoint", wellKnownURL);
                _.set(currentConfig.properties.idpConfig, "authorizationEndpoint", config.authorization_endpoint);
                _.set(currentConfig.properties.idpConfig, "tokenEndpoint", config.token_endpoint);
                _.set(currentConfig.properties.idpConfig, "endSessionEndpoint", config.end_session_endpoint);
                _.set(currentConfig.properties.augmentSecurityContext, "globals.sessionValidationBaseEndpoint", sessionValidationBaseEndpoint);

                _this3.setConfig(currentConfig);

                _this3.$el.find("#wellKnownURLError").hide();
                _this3.customValidate();
            }, function () {
                if (!suppressMsg) {
                    EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, "amAuthWellKnownEndpointFailure");
                }
                _this3.$el.find("#wellKnownURLError").show();
                $("#submitAuth").toggleClass("disabled", true);
            });
        },

        validationSuccessful: function validationSuccessful(event) {
            AuthenticationAbstractView.prototype.validationSuccessful(event);
            this.customValidate();
        },

        validationFailed: function validationFailed(event, details) {
            AuthenticationAbstractView.prototype.validationFailed(event, details);
            this.customValidate();
        },

        customValidate: function customValidate() {
            var formValid = ValidatorsManager.formValidated(this.$el.find("form"));

            // If there is a url provided, but it isn't valid
            if (this.$el.find("#wellKnownURLError").is(":visible")) {
                $("#submitAuth").toggleClass("disabled", true);
            } else {
                $("#submitAuth").toggleClass("disabled", !formValid);
            }
        }

    });

    return new ProvidersModuleDialogView();
});
