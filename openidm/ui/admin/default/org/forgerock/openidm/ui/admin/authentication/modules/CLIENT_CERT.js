"use strict";

/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "form2js", "jsonEditor", "org/forgerock/openidm/ui/admin/authentication/AuthenticationAbstractView"], function ($, _, Form2js, JSONEditor, AuthenticationAbstractView) {

    var ClientCertView = AuthenticationAbstractView.extend({
        template: "templates/admin/authentication/modules/CLIENT_CERT.html",

        knownProperties: AuthenticationAbstractView.prototype.knownProperties.concat(["allowedAuthenticationIdPatterns"]),

        render: function render(args) {
            var _this = this;

            this.data = _.clone(args, true);
            // Client Cert Modules have access to an additional resource: "security/truststore"
            this.data.resources.push("security/truststore");
            this.data.userOrGroupValue = "userRoles";
            this.data.userOrGroupOptions = _.clone(AuthenticationAbstractView.prototype.userOrGroupOptions, true);
            this.data.customProperties = this.getCustomPropertiesList(this.knownProperties, this.data.config.properties || {});
            this.data.userOrGroupDefault = this.getUserOrGroupDefault(this.data.config || {});

            this.parentRender(function () {
                _this.setupAllowedAuthIdPatterns(_this.data.config.properties.allowedAuthenticationIdPatterns);

                _this.postRenderComponents({
                    "customProperties": _this.data.customProperties,
                    "name": _this.data.config.name,
                    "augmentSecurityContext": _this.data.config.properties.augmentSecurityContext || {},
                    "userOrGroup": _this.data.userOrGroupDefault
                });
            });
        },

        getCustomPropertyConfigs: function getCustomPropertyConfigs() {
            return { "allowedAuthenticationIdPatterns": this.allowedAuthIdPatternsEditor.getValue() };
        },

        setupAllowedAuthIdPatterns: function setupAllowedAuthIdPatterns(defaultValue) {
            var schema = {
                "title": $.t("templates.auth.modules.allowedAuthIdPatterns"),
                "type": "array",
                "format": "table",
                "items": {
                    "type": "string",
                    "title": $.t("templates.auth.modules.pattern")
                }
            };

            this.allowedAuthIdPatternsEditor = new JSONEditor(this.$el.find("#allowedAuthenticationIdPatterns")[0], _.extend({
                schema: schema,
                startval: defaultValue
            }, this.JSONEditorDefaults));
        }
    });

    return new ClientCertView();
});
