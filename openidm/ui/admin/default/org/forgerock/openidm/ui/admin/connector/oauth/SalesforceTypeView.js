"use strict";

/*
 * Copyright 2014-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/openidm/ui/admin/connector/oauth/AbstractOAuthView", "org/forgerock/openidm/ui/admin/delegates/ExternalAccessDelegate", "org/forgerock/commons/ui/common/main/Router", "org/forgerock/openidm/ui/common/delegates/ConfigDelegate", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/openidm/ui/admin/delegates/ConnectorDelegate"], function ($, _, AbstractOAuthView, ExternalAccessDelegate, router, ConfigDelegate, eventManager, constants, ConnectorDelegate) {

    var SalesforceTypeView = AbstractOAuthView.extend({
        events: {
            "change .url-radio": "changeUrl"
        },
        data: {
            "callbackURL": window.location.protocol + "//" + window.location.host + "/admin/oauth.html",
            "urlTypes": [{
                "name": "Production",
                "value": "https://login.salesforce.com/services/oauth2/token",
                "id": "productionRadio",
                "readonly": true,
                "selected": false
            }, {
                "name": "Sandbox",
                "value": "https://test.salesforce.com/services/oauth2/token",
                "id": "sandboxRadio",
                "readonly": true,
                "selected": false
            }, {
                "name": "Custom",
                "value": "https://[custom domain name]/services/oauth2/token",
                "id": "customRadio",
                "readonly": false,
                "selected": false
            }]
        },
        getScopes: function getScopes() {
            var salesforceScope = "id%20api%20refresh_token";

            return salesforceScope;
        },

        getAuthUrl: function getAuthUrl() {
            var url = this.$el.find("#OAuthurl").val().replace("/token", "/authorize");

            return url;
        },

        getToken: function getToken(mergedResult, oAuthCode) {
            return ExternalAccessDelegate.getToken(mergedResult.configurationProperties.clientId, oAuthCode, window.location.protocol + "//" + window.location.host + "/admin/oauth.html", mergedResult.configurationProperties.loginUrl, mergedResult._id.replace("/", "_"));
        },

        setToken: function setToken(refeshDetails, connectorDetails, connectorLocation, urlArgs) {
            if (refeshDetails.refresh_token !== undefined) {
                connectorDetails.configurationProperties.refreshToken = refeshDetails.refresh_token;
                connectorDetails.enabled = true;
            } else {
                connectorDetails.configurationProperties.refreshToken = null;
                connectorDetails.enabled = false;
            }

            connectorDetails.configurationProperties.instanceUrl = refeshDetails.instance_url;

            ConnectorDelegate.testConnector(connectorDetails).then(_.bind(function (testResult) {
                connectorDetails.objectTypes = testResult.objectTypes;

                ConfigDelegate.updateEntity(connectorLocation, connectorDetails).then(_.bind(function () {
                    _.delay(function () {
                        eventManager.sendEvent(constants.EVENT_CHANGE_VIEW, { route: router.configuration.routes.connectorListView });
                    }, 1500);
                }, this));
            }, this));
        },

        cleanResult: function cleanResult(mergedResult) {
            delete mergedResult.urlRadio;

            return mergedResult;
        },

        connectorSpecificChanges: function connectorSpecificChanges(connectorDetails) {
            if (connectorDetails.configurationProperties.loginUrl) {
                if (this.data.urlTypes[0].value === connectorDetails.configurationProperties.loginUrl) {
                    this.data.urlTypes[0].selected = true;
                } else if (this.data.urlTypes[1].value === connectorDetails.configurationProperties.loginUrl) {
                    this.data.urlTypes[1].selected = true;
                } else {
                    this.data.urlTypes[2].selected = true;
                }
            } else {
                this.data.urlTypes[0].selected = true;
            }
        },

        connectorSpecificValidation: function connectorSpecificValidation() {
            if (this.data.connectorDefaults.configurationProperties.loginUrl && this.data.connectorDefaults.configurationProperties.loginUrl === this.$el.find("#OAuthurl").val()) {
                return false;
            } else {
                return true;
            }
        },

        changeUrl: function changeUrl(event) {
            var radio = event.target,
                id = $(event.target).prop("id");

            if (id === "productionRadio" || id === "sandboxRadio") {
                $("#OAuthurl").prop('readonly', true);
            } else {
                $("#OAuthurl").prop('readonly', false);
            }

            $("#OAuthurl").val($(radio).val());
        }
    });

    return new SalesforceTypeView();
});
