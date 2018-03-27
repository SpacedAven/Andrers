"use strict";

/*
 * Copyright 2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "moment", "bootstrap", "bootstrap-dialog", "org/forgerock/commons/ui/user/profile/AbstractUserProfileTab", "org/forgerock/openidm/ui/common/delegates/SocialDelegate", "org/forgerock/openidm/ui/common/delegates/SiteConfigurationDelegate", "org/forgerock/commons/ui/common/main/Configuration"], function ($, _, moment, bootstrap, BootstrapDialog, AbstractUserProfileTab, SocialDelegate, SiteConfigurationDelegate, Configuration) {
    var SignInAndSecurityView = AbstractUserProfileTab.extend({
        template: "templates/profile/signInAndSecurity/SignInAndSecurityTab.html",
        model: {},
        events: _.extend({
            "click .checkbox input": "formSubmit"
        }, AbstractUserProfileTab.prototype.events),
        data: {
            showSocial: false,
            showKBA: false
        },
        partials: ["partials/providers/_providerBadge.html"],
        /**
         Expected by all dynamic user profile tabs - returns a map of details necessary to render the nav tab
         */
        getTabDetail: function getTabDetail() {
            return {
                "panelId": "signInAndSecurityTab",
                "label": $.t("common.user.profileMenu.signIn")
            };
        },

        render: function render(args, callback) {
            var _this = this;

            if (args.user.lastChanged && args.user.lastChanged.date) {
                this.data.lastChanged = moment.utc(args.user.lastChanged.date).format("LLL");
            } else {
                this.data.lastChanged = null;
            }

            $.when(SocialDelegate.providerList(), SiteConfigurationDelegate.getConfiguration()).then(function (socialProviders, configuration) {
                if (socialProviders.providers.length > 0) {
                    _this.data.showSocial = true;
                    _this.data.socialProviders = socialProviders.providers;
                }

                _this.data.showKBA = configuration.kbaEnabled;

                //One final check for openidm-admin
                if (Configuration.loggedUser.component === "repo/internal/user") {
                    _this.data.showKBA = false;
                    _this.data.showSocial = false;
                }

                _this.parentRender(function () {
                    if (callback) {
                        callback();
                    }
                });
            });
        }
    });

    return new SignInAndSecurityView();
});
