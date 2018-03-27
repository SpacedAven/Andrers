"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["underscore", "org/forgerock/openidm/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/EventManager"], function (_, Constants, EventManager) {
    var obj = [{
        startEvent: Constants.EVENT_HANDLE_DEFAULT_ROUTE,
        description: "",
        override: true,
        dependencies: ["org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/main/Router"],
        processDescription: function processDescription(event, Configuration, Router) {
            if (Configuration.loggedUser) {
                EventManager.sendEvent(Constants.EVENT_CHANGE_VIEW, { route: Router.configuration.routes.landingPage });
            } else {
                EventManager.sendEvent(Constants.EVENT_CHANGE_VIEW, { route: Router.configuration.routes.login });
            }
        }
    }, {
        startEvent: Constants.EVENT_OAUTH_REGISTER,
        description: "Attempt to claim or register a user from an oauth provider",
        dependencies: ["org/forgerock/commons/ui/user/delegates/AnonymousProcessDelegate", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/main/Router", "org/forgerock/commons/ui/common/util/URIUtils"],
        processDescription: function processDescription(event, AnonymousProcessDelegate, Configuration, Router, URIUtils) {
            var delegate = new AnonymousProcessDelegate("selfservice/socialUserClaim"),
                params = {
                clientToken: localStorage.getItem("dataStoreToken")
            },
                fragmentQueryString = "";

            if (event.args && event.args[0]) {
                fragmentQueryString = "&" + event.args[0];
                params = URIUtils.parseQueryString(event.args[0]);
            }
            /*
             First social provider login fail we attempt to locate an account to claim
             */
            delegate.submit(params).then(function (claimResult) {
                if (_.has(claimResult, "additions.successUrl")) {
                    Configuration.globalData.auth.validatedGoto = encodeURIComponent(claimResult.additions.successUrl);
                }

                /*
                 If successful account located
                */
                if (_.get(claimResult, "additions.claimedProfile")) {
                    if (_.get(claimResult, "additions.oauthLogin")) {
                        EventManager.sendEvent(Constants.EVENT_LOGIN_REQUEST, {
                            oauthLogin: true,
                            attemptRegister: false,
                            suppressMessage: false,
                            failureCallback: function failureCallback(reason) {
                                EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, "socialAuthenticationFailed");

                                if (event.errorCallback) {
                                    event.errorCallback();
                                } else {
                                    EventManager.sendEvent(Constants.EVENT_CHANGE_VIEW, {
                                        route: Router.configuration.routes.login,
                                        args: ["&preventAutoLogin=true"]
                                    });
                                }
                            }
                        });
                    } else if (_.has(claimResult, "additions.successUrl")) {
                        window.location.href = _.get(claimResult, "additions.successUrl");
                    } else {
                        // unusual, but possible to claim a social account without being able to auto-login
                        EventManager.sendEvent(Constants.EVENT_CHANGE_VIEW, {
                            route: Router.configuration.routes.login,
                            args: ["&preventAutoLogin=true"]
                        });
                    }
                } else if (Configuration.globalData.selfRegistration) {
                    /*
                     If account claim fails to find an account pass through to registration
                     */
                    EventManager.sendEvent(Constants.EVENT_CHANGE_VIEW, {
                        route: Router.configuration.routes.selfRegistration,
                        args: ["/", "&oauthRegister=true" + fragmentQueryString]
                    });
                } else {
                    EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, "socialAuthenticationFailed");

                    EventManager.sendEvent(Constants.EVENT_CHANGE_VIEW, {
                        route: Router.configuration.routes.login,
                        args: ["&preventAutoLogin=true"]
                    });
                }
            }, function (claimResult) {
                /*
                 Hard fail when multiple accounts or some unknown critical failure
                 */
                EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, "socialAuthenticationFailed");

                if (event.errorCallback) {
                    event.errorCallback();
                } else {
                    EventManager.sendEvent(Constants.EVENT_CHANGE_VIEW, {
                        route: Router.configuration.routes.login,
                        args: ["&preventAutoLogin=true"]
                    });
                }
            });
        }
    }];

    return obj;
});
