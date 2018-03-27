"use strict";

/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "form2js", "org/forgerock/openidm/ui/admin/authentication/AuthenticationAbstractView", "org/forgerock/openidm/ui/admin/delegates/ExternalAccessDelegate", "libs/codemirror/lib/codemirror", "libs/codemirror/mode/xml/xml"], function ($, _, Form2js, AuthenticationAbstractView, ExternalAccessDelegate, codemirror) {

    var OAuthClientView = AuthenticationAbstractView.extend({
        template: "templates/admin/authentication/modules/OAUTH_CLIENT.html",
        partials: AuthenticationAbstractView.prototype.partials.concat(["partials/_alert.html"]),

        knownProperties: AuthenticationAbstractView.prototype.knownProperties.concat(["idpConfig"]),

        getConfig: function getConfig() {
            var config = AuthenticationAbstractView.prototype.getConfig.call(this);

            if (this.model.iconCode && _.has(config, "properties.idpConfig.icon")) {
                config.properties.idpConfig.icon = this.model.iconCode.getValue();
            }

            return config;
        },

        render: function render(args) {
            var _this = this;

            this.data = _.clone(args, true);
            if (!_.has(this.data, "config.properties.idpConfig")) {
                this.data.config.properties.idpConfig = {
                    provider: "providerName"
                };
            }
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

                _this.model.iconCode = codemirror.fromTextArea(_this.$el.find(".button-html")[0], {
                    lineNumbers: true,
                    viewportMargin: Infinity,
                    theme: "forgerock",
                    mode: "xml",
                    htmlMode: true,
                    lineWrapping: true
                });
            });
        }
    });

    return new OAuthClientView();
});
