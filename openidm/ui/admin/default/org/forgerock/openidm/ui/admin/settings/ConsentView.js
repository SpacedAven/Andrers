"use strict";

/*
 * Copyright 2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["underscore", "jquery", "form2js", "org/forgerock/openidm/ui/admin/util/AdminAbstractView", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/openidm/ui/common/delegates/ConfigDelegate"], function (_, $, form2js, AdminAbstractView, EventManager, Constants, ConfigDelegate) {

    var ConsentView = AdminAbstractView.extend({
        template: "templates/admin/settings/ConsentTemplate.html",
        element: "#consentContainer",
        noBaseTemplate: true,
        events: {
            "click #saveConsent": "saveConsent"
        },
        model: {
            fileFound: false
        },
        data: {
            consentEnabled: false
        },

        render: function render(args) {
            var _this = this;

            $.when(ConfigDelegate.readEntityAlways("consent"), ConfigDelegate.readEntityAlways("selfservice/registration")).then(function (consent, registration) {
                if (!_.isUndefined(consent)) {
                    _this.data.consentEnabled = consent.enabled;
                    _this.model.fileFound = true;
                } else {
                    _this.data.consentEnabled = false;
                    _this.model.fileFound = false;
                }

                _this.model.registration = registration;

                _this.parentRender();
            });
        },

        saveConsent: function saveConsent(event) {
            event.preventDefault();

            var formDetails = form2js("consentForm");

            if (this.model.fileFound) {
                ConfigDelegate.updateEntity("consent", formDetails).then(function () {
                    EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, "consentSaveSuccess");
                });
            } else {
                this.model.fileFound = true;

                ConfigDelegate.createEntity("consent", formDetails).then(function () {
                    EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, "consentSaveSuccess");
                });
            }

            if (!formDetails.enabled && !_.isUndefined(this.model.registration)) {
                var index = _.findIndex(this.model.registration.stageConfigs, function (config) {
                    return config.name === "consent";
                });

                if (index !== -1) {
                    this.model.registration.stageConfigs = _.filter(this.model.registration.stageConfigs, function (config) {
                        return config.name !== "consent";
                    });

                    ConfigDelegate.updateEntity("selfservice/registration", this.model.registration);
                }
            }
        }
    });

    return new ConsentView();
});
