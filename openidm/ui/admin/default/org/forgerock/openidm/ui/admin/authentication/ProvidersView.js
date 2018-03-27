"use strict";

/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/openidm/ui/admin/authentication/AuthenticationAbstractView", "org/forgerock/openidm/ui/admin/authentication/ProvidersModuleDialogView", "org/forgerock/openidm/ui/admin/selfservice/SelfServiceUtils", "org/forgerock/openidm/ui/common/delegates/SocialDelegate"], function ($, _, AuthenticationAbstractView, ProvidersModuleDialogView, SelfServiceUtils, SocialDelegate) {

    var ProvidersView = AuthenticationAbstractView.extend({
        template: "templates/admin/authentication/ProvidersTemplate.html",
        element: "#providerContainer",
        noBaseTemplate: true,
        events: {
            "change .providerSelection": "providerChanged",
            "click .edit-am-module": "openAMWindow"
        },
        data: {
            localChecked: true
        },
        model: {},
        partials: ["partials/providers/_providerBadge.html", "partials/_alert.html"],

        render: function render(configs, callback) {
            var _this = this;

            var allModules = _.get(this.getAuthenticationData(), "authModules"),
                amModuleIndex = this.getAMModuleIndex(allModules);

            // If there is an OPENAM module and it is enabled then local is not checked
            this.data.localChecked = !(amModuleIndex !== -1 && allModules[amModuleIndex].enabled);

            SocialDelegate.providerList().then(function (availableProviders) {
                _this.data.providerList = availableProviders.providers;

                _this.parentRender(_.bind(function () {
                    if (callback) {
                        callback();
                    }
                }, _this));
            });
        },

        /**
         * Called when the radio button changes value.
         *
         * @param e
         */
        providerChanged: function providerChanged(e) {
            this.selectProvider(this.$el.find("input[name=providerSelection]:checked").val());
        },

        /**
         * Given a name of a provider this will set the disable state and make any configuration changes necessary to align with the selection.
         *
         * @param selectedProvider {string} - "am" or "local"
         */
        selectProvider: function selectProvider(selectedProvider, skipDataChanges) {
            if (selectedProvider !== "am" && selectedProvider !== "local") {
                selectedProvider = "local";
            }

            var selectedRadio = this.$el.find(".providerSelection[value=" + selectedProvider + "]"),
                selectedPanel = selectedRadio.closest(".provider-panel"),
                allPanel = this.$el.find(".provider-panel");

            selectedPanel.removeClass("disabled");
            allPanel.not(selectedPanel).addClass("disabled");
            selectedRadio.prop("checked", true);

            if (!skipDataChanges) {
                switch (selectedProvider) {
                    case "am":
                        this.openAMWindow();
                        break;

                    case "local":
                    default:
                        this.removeURLsFromUIConfig();
                        this.setProperties(["authModules", "sessionModule"], this.getLocalAuthConfig(this.getAuthenticationData()));
                        this.saveAuthentication().then(function () {
                            SelfServiceUtils.setLocalAutoLogin();
                        });
                        break;
                }
            }
        },

        getLocalAuthConfig: function getLocalAuthConfig(authData) {
            var allAuthModules = _.get(authData, "authModules");

            // Set cache period
            _.set(authData, "sessionModule.properties.maxTokenLifeMinutes", "120");
            _.set(authData, "sessionModule.properties.tokenIdleTimeMinutes", "30");
            delete authData.sessionModule.properties.maxTokenLifeSeconds;
            delete authData.sessionModule.properties.tokenIdleTimeSeconds;

            // Enable all modules
            _.each(allAuthModules, function (module) {
                module.enabled = true;
            });

            // If the OPENAM module exists, disable it.
            var openAMModuleIndex = this.getAMModuleIndex(allAuthModules);
            if (openAMModuleIndex !== -1) {
                allAuthModules[openAMModuleIndex].enabled = false;
            }

            return authData;
        },

        openAMWindow: function openAMWindow(e) {
            var _this2 = this;

            var allModules = _.get(this.getAuthenticationData(), "authModules"),
                existingAMConfig = allModules[this.getAMModuleIndex(allModules)];

            ProvidersModuleDialogView.render({
                "config": existingAMConfig || {},
                "cancelCallback": function cancelCallback() {
                    var allModules = _.get(_this2.getAuthenticationData(), "authModules"),
                        amModuleIndex = _this2.getAMModuleIndex(allModules);

                    // If there isn't an enabled OPENAM module then revert to local
                    if (!(amModuleIndex !== -1 && allModules[amModuleIndex].enabled)) {
                        _this2.selectProvider("local", true);
                    }
                }
            }, _.noop);
        }

    });

    return new ProvidersView();
});
