"use strict";

/*
 * Copyright 2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "moment", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/util/UIUtils", "org/forgerock/commons/ui/user/profile/AbstractUserProfileTab"], function ($, _, moment, Configuration, UIUtils, AbstractUserProfileTab) {
    var SharingView = AbstractUserProfileTab.extend({
        template: "templates/profile/uma/ActivityTab.html",
        model: {},
        events: _.extend({
            "change .checkbox input": "formSubmit"
        }, AbstractUserProfileTab.prototype.events),

        /**
         Expected by all dynamic user profile tabs - returns a map of details necessary to render the nav tab
         */
        getTabDetail: function getTabDetail() {
            return {
                "panelId": "activityTab",
                "label": $.t("common.user.profileMenu.activity")
            };
        },

        render: function render(args, callback) {
            this.model.resourceSet = Configuration.loggedUser.attributes.resourceSet;
            this.data.auditHistory = Configuration.loggedUser.attributes.auditHistory;

            //format eventTime
            _.map(this.data.auditHistory, function (obj) {
                obj.eventTime = moment(obj.eventTime).fromNow();
                var resource = _.find(this.model.resourceSet, { '_id': obj.resourceSetId });

                if (!_.isUndefined(resource) && !_.isEmpty(resource.icon_uri)) {
                    obj.icon_uri = resource.icon_uri;
                } else {
                    obj.icon_uri = "images/resource.png";
                }

                if (obj.type === "Policy_Updated") {
                    obj.action = $.t("templates.activity.updated");
                } else {
                    obj.action = $.t("templates.activity.created");
                }
            }, this);

            this.parentRender(function () {
                if (callback) {
                    callback();
                }
            });
        }
    });

    return new SharingView();
});
