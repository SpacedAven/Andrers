"use strict";

/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "org/forgerock/openidm/ui/admin/authentication/AuthenticationAbstractView"], function ($, _, AuthenticationAbstractView) {

    var OpenAMSessionView = AuthenticationAbstractView.extend({
        template: "templates/admin/authentication/modules/OPENAM_SESSION.html",

        knownProperties: AuthenticationAbstractView.prototype.knownProperties.concat(["openamDeploymentUrl", "openamSSOTokenCookieName", "openamUserAttribute", "groupComparisonMethod", "truststoreType", "truststorePath", "truststorePassword"]),

        render: function render(args) {
            var _this = this;

            this.data = _.clone(args, true);
            this.data.userOrGroupValue = "userRoles";
            this.data.userOrGroupOptions = _.clone(AuthenticationAbstractView.prototype.userOrGroupOptions, true);
            this.data.customProperties = this.getCustomPropertiesList(this.knownProperties, this.data.config.properties || {});
            this.data.userOrGroupDefault = this.getUserOrGroupDefault(this.data.config || {});

            this.parentRender(function () {
                _this.postRenderComponents({
                    "customProperties": _this.data.customProperties,
                    "name": _this.data.config.name,
                    "augmentSecurityContext": _this.data.config.properties.augmentSecurityContext || {},
                    "userOrGroup": _this.data.userOrGroupDefault
                });
            });
        }

    });

    return new OpenAMSessionView();
});
