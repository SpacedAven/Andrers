"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["underscore", "org/forgerock/openidm/ui/admin/util/AdminAbstractView", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/openidm/ui/common/delegates/ConfigDelegate", "org/forgerock/commons/ui/common/main/ValidatorsManager"], function (_, AdminAbstractView, eventManager, constants, ConfigDelegate, validatorsManager) {

    var SelfServiceView = AdminAbstractView.extend({
        template: "templates/admin/settings/SelfServiceTemplate.html",
        element: "#selfServiceContainer",
        noBaseTemplate: true,
        events: {
            "click #saveSelfServiceURL": "saveSelfServiceURL"
        },
        model: {
            uiContextObject: {}
        },
        data: {
            selfServiceURL: ""
        },

        render: function render(args, callback) {
            this.data.docHelpUrl = constants.DOC_URL;

            ConfigDelegate.readEntity("ui.context/selfservice").then(_.bind(function (data) {
                this.model.uiContextObject = data;
                this.data.selfServiceURL = data.urlContextRoot;

                this.parentRender(_.bind(function () {
                    validatorsManager.bindValidators(this.$el.find("#systemConfigForm"));
                    validatorsManager.validateAllFields(this.$el.find("#systemConfigForm"));
                }, this));
            }, this));
        },

        saveSelfServiceURL: function saveSelfServiceURL(e) {
            e.preventDefault();
            this.model.uiContextObject.urlContextRoot = this.$el.find("#selfServiceURL").val();

            ConfigDelegate.updateEntity("ui.context/selfservice", this.model.uiContextObject).then(_.bind(function () {
                eventManager.sendEvent(constants.EVENT_DISPLAY_MESSAGE_REQUEST, "selfServiceSaveSuccess");
            }, this));
        }
    });

    return new SelfServiceView();
});
