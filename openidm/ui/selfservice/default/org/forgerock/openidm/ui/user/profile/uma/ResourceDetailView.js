"use strict";

/*
 * Copyright 2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/commons/ui/common/main/Configuration"], function ($, _, AbstractView, Configuration) {
    var ResourceDetailView = AbstractView.extend({
        template: "templates/profile/uma/ResourceDetailView.html",
        events: {},

        /**
         * load template and bind validators
         */
        render: function render(args, callback) {
            var _this = this;

            this.data.user = Configuration.loggedUser.authenticationId;

            this.data.resource = _.find(Configuration.loggedUser.attributes.resourceSet, function (resource) {
                return resource.resourceOwnerId === _this.data.user && resource._id === args[0];
            });

            this.data.noResources = _.has(this.data.resource, "policy.permissions") === false;
            this.parentRender(function () {
                if (callback) {
                    callback();
                }
            });
        }
    });

    return new ResourceDetailView();
});
