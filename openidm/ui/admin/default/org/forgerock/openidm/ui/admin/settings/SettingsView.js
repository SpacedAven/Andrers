"use strict";

/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["underscore", "jquery", "handlebars", "org/forgerock/openidm/ui/admin/util/AdminAbstractView", "org/forgerock/openidm/ui/admin/settings/audit/AuditView", "org/forgerock/openidm/ui/admin/settings/SelfServiceView", "org/forgerock/openidm/ui/admin/settings/ConsentView", "org/forgerock/openidm/ui/admin/settings/UpdateView", "org/forgerock/commons/ui/common/main/Router", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/main/AbstractDelegate", "bootstrap-tabdrop"], function (_, $, Handlebars, AdminAbstractView, AuditView, SelfServiceView, ConsentView, UpdateView, Router, Constants, EventManager, AbstractDelegate) {

    var SettingsView = AdminAbstractView.extend({
        template: "templates/admin/settings/SettingsTemplate.html",
        events: {
            "click a[data-toggle=tab]": "updateRoute"
        },

        render: function render(args, callback) {
            this.data.tabName = args[0] || "audit";

            this.data.maintenanceModeDelegate = new AbstractDelegate(Constants.host + "/" + Constants.context + "/maintenance");

            this.data.maintenanceModeDelegate.serviceCall({
                url: "?_action=status",
                type: "POST"

            }).then(_.bind(function (data) {
                this.data.maintenanceMode = data.maintenanceEnabled;

                if (data.maintenanceEnabled) {
                    this.data.tabName = "update";
                    EventManager.sendEvent(Constants.ROUTE_REQUEST, {
                        routeName: "settingsView",
                        args: [this.data.tabName],
                        trigger: false
                    });
                }
            }, this));

            this.parentRender(_.bind(function () {
                if (!this.data.maintenanceMode) {
                    AuditView.render();
                    SelfServiceView.render();
                    ConsentView.render();
                }

                UpdateView.render({ step: "version" }, _.bind(function () {
                    this.$el.find(".nav-tabs").tabdrop();
                }, this));

                if (callback) {
                    callback();
                }
            }, this));
        },

        updateRoute: function updateRoute(e) {
            if (e) {
                e.preventDefault();
            }

            if ($(e.currentTarget).parent().hasClass("disabled")) {
                return false;
            } else {
                var route = $(e.currentTarget).attr("data-route");
                EventManager.sendEvent(Constants.ROUTE_REQUEST, {
                    routeName: "settingsView",
                    args: [route],
                    trigger: true
                });
            }
        }
    });

    Handlebars.registerHelper('sw', function (val, val2, options) {
        if (val.indexOf(val2) === 0) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    });

    return new SettingsView();
});
