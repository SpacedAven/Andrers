"use strict";

/*
 * Copyright 2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/util/UIUtils", "org/forgerock/commons/ui/user/profile/AbstractUserProfileTab"], function ($, _, Configuration, UIUtils, AbstractUserProfileTab) {
    var SharingView = AbstractUserProfileTab.extend({
        template: "templates/profile/uma/SharingTab.html",
        events: _.extend({}, AbstractUserProfileTab.prototype.events),

        /**
         Expected by all dynamic user profile tabs - returns a map of details necessary to render the nav tab
         */
        getTabDetail: function getTabDetail() {
            return {
                "panelId": "SharingTab",
                "label": $.t("common.user.profileMenu.sharing")
            };
        },

        render: function render(args, callback) {
            var _this = this;

            this.data.user = Configuration.loggedUser.authenticationId;

            this.data.resourceSet = _.filter(Configuration.loggedUser.attributes.resourceSet, function (resource) {
                return resource.resourceOwnerId === _this.data.user;
            });

            _.each(this.data.resourceSet, function (resource) {
                if (_.has(resource, "policy.permissions") && resource.policy.permissions.length) {
                    if (resource.policy.permissions.length === 1) {
                        resource.shareText = $.t("templates.sharing.sharedWithOne");
                    } else {
                        resource.shareText = $.t("templates.sharing.sharedWithMany", { "number": resource.policy.permissions.length });
                    }
                } else {
                    resource.shareText = $.t("templates.sharing.notShared");
                }
            });

            this.parentRender(function () {
                if (callback) {
                    callback();
                }
            });
        }
    });

    return new SharingView();
});
