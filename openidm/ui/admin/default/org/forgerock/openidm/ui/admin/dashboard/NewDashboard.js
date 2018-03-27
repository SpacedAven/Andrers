"use strict";

/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/openidm/ui/admin/util/AdminAbstractView", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/main/Router", "org/forgerock/commons/ui/common/main/ValidatorsManager", "org/forgerock/openidm/ui/common/delegates/ConfigDelegate", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/openidm/ui/admin/delegates/SiteConfigurationDelegate"], function ($, _, AdminAbstractView, Configuration, Router, ValidatorsManager, ConfigDelegate, EventManager, Constants, SiteConfigurationDelegate) {

    var DashboardView = AdminAbstractView.extend({
        template: "templates/admin/dashboard/NewDashboardTemplate.html",
        events: {
            "submit #NewDashboardForm": "addNewDashboard",
            "onValidate": "onValidate"
        },
        model: {
            "adminDashboards": []
        },

        render: function render(args, callback) {
            var adminDashboards = [];

            ConfigDelegate.readEntity("ui/dashboard").then(_.bind(function (dashboardConfig) {
                this.model.uiConf = dashboardConfig;

                if (_.has(this.model.uiConf, "adminDashboards")) {
                    this.model.adminDashboards = this.model.uiConf.adminDashboards;
                }

                this.data.existingDashboards = _.pluck(this.model.adminDashboards, "name");

                this.parentRender(_.bind(function () {
                    ValidatorsManager.bindValidators(this.$el.find("#NewDashboardForm"));
                    this.$el.find("#DashboardName").focus();
                    if (callback) {
                        callback();
                    }
                }, this));
            }, this));
        },

        addNewDashboard: function addNewDashboard(e) {
            e.preventDefault();

            var isDefault = this.$el.find("#DefaultDashboard").is(":checked");

            if (isDefault) {
                _.each(this.model.adminDashboards, function (dashboard) {
                    dashboard.isDefault = false;
                }, this);
            }
            this.model.adminDashboards.push({
                "name": this.$el.find("#DashboardName").val(),
                "isDefault": isDefault,
                "widgets": []
            });

            ConfigDelegate.updateEntity("ui/dashboard", this.model.uiConf).then(_.bind(function () {
                EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, "newDashboardCreated");
                EventManager.sendEvent(Constants.EVENT_UPDATE_NAVIGATION);
                EventManager.sendEvent(Constants.EVENT_CHANGE_VIEW, { route: {
                        view: "org/forgerock/openidm/ui/admin/dashboard/Dashboard",
                        role: "ui-admin",
                        url: "dashboard/" + (this.model.adminDashboards.length - 1)
                    } });
            }, this));
        }
    });

    return new DashboardView();
});
