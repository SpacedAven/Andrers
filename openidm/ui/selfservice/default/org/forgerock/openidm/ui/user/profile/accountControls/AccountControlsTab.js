"use strict";

/*
 * Copyright 2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "org/forgerock/commons/ui/user/profile/AbstractUserProfileTab", "org/forgerock/commons/ui/common/main/Configuration"], function ($, _, AbstractUserProfileTab, Configuration) {
    var AccountControlsView = AbstractUserProfileTab.extend({
        template: "templates/profile/accountControls/AccountControlsTab.html",
        events: _.extend({
            "click .fr-download-profile": "downloadAccount"
        }, AbstractUserProfileTab.prototype.events),

        getTabDetail: function getTabDetail() {
            return {
                "panelId": "accountControlsTab",
                "label": $.t("common.user.profileMenu.accountControls")
            };
        },

        render: function render(args, callback) {
            this.parentRender(function () {
                if (callback) {
                    callback();
                }
            });
        },

        downloadAccount: function downloadAccount(event) {
            event.preventDefault();

            var anchor = $("<a style='display: none;'/>"),
                data = JSON.stringify(Configuration.loggedUser.attributes, null, 4),
                url,
                name = "userProfile.json";

            //IE support
            if (navigator.msSaveBlob) {
                return navigator.msSaveBlob(new Blob([data], { type: "data:application/json" }), name);
            } else {
                url = window.URL.createObjectURL(new Blob([data], { type: "data:application/json" }));

                anchor.attr("href", url);
                anchor.attr("download", name);
                anchor.attr("id", "downloadLink");

                this.$el.append(anchor);

                anchor[0].click();

                //fixes firefox html removal bug
                setTimeout(function () {
                    window.URL.revokeObjectURL(url);
                    anchor.remove();
                }, 500);
            }
        }
    });

    return new AccountControlsView();
});
