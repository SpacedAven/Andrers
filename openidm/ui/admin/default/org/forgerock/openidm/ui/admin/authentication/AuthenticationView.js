"use strict";

/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/openidm/ui/admin/authentication/AuthenticationAbstractView", "org/forgerock/openidm/ui/admin/authentication/SessionModuleView", "org/forgerock/openidm/ui/admin/authentication/AuthenticationModuleView", "org/forgerock/openidm/ui/admin/authentication/ProvidersView"], function ($, _, AuthenticationAbstractView, SessionModuleView, AuthenticationModuleView, ProvidersView) {

    var AuthenticationView = AuthenticationAbstractView.extend({
        template: "templates/admin/authentication/AuthenticationTemplate.html",
        noBaseTemplate: false,
        element: "#content",
        events: {
            "show.bs.tab #providerTab a[data-toggle='tab']": "renderProviders",
            "show.bs.tab #sessionTab a[data-toggle='tab']": "renderSession",
            "show.bs.tab #modulesTab a[data-toggle='tab']": "renderModules"
        },
        data: {},
        model: {},

        render: function render(args, callback) {
            this.retrieveAuthenticationData(_.bind(function () {
                this.parentRender(function () {
                    ProvidersView.render();

                    if (callback) {
                        callback();
                    }
                });
            }, this));
        },

        renderProviders: function renderProviders(e) {
            ProvidersView.render();
        },
        renderSession: function renderSession(e) {
            SessionModuleView.render();
        },
        renderModules: function renderModules(e) {
            AuthenticationModuleView.render();
        },

        save: function save(e) {
            e.preventDefault();

            this.saveAuthentication().then(function () {
                ProvidersView.render();
            });
        }
    });

    return new AuthenticationView();
});
