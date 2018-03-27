"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/openidm/ui/util/delegates/AMDelegate", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/openidm/ui/common/delegates/SiteConfigurationDelegate", "org/forgerock/commons/ui/common/components/Navigation", "org/forgerock/openidm/ui/common/delegates/ConfigDelegate", "org/forgerock/openidm/ui/util/delegates/ConsentDelegate", "UserProfileView"], function ($, _, AMDelegate, conf, commonSiteConfigurationDelegate, nav, ConfigDelegate, ConsentDelegate, UserProfileView) {

    var obj = Object.create(commonSiteConfigurationDelegate),
        hasKba = false,
        amDataEndpoints,
        cachedUserComponent = null;

    obj.adminCheck = false;

    obj.getConfiguration = function (successCallback, errorCallback) {
        return commonSiteConfigurationDelegate.getConfiguration().then(function (configuration) {
            if (configuration.kbaEnabled === true) {
                hasKba = true;
            }

            if (configuration.amDataEndpoints) {
                amDataEndpoints = configuration.amDataEndpoints;
            }
            return obj.checkForDifferences().then(function () {
                if (successCallback) {
                    successCallback(configuration);
                }
                return configuration;
            });
        }, errorCallback);
    };

    obj.getProfileTabs = function () {
        var _this = this;

        var promise = $.Deferred();

        ConfigDelegate.readEntity("ui/profile").then(function (profile) {
            $.when(ConsentDelegate.getConsentMappings(), _this.getDataFromOpenAM()).then(function (consentMappings, openamData) {

                if (consentMappings.length === 0) {
                    _.remove(profile.tabs, function (tab) {
                        return tab.name === "privacyAndConsent";
                    });
                }

                if (_.isNull(openamData.resourceSet)) {
                    _.remove(profile.tabs, function (tab) {
                        return tab.name === "sharing";
                    });
                } else {
                    //add the resources set list to the current user
                    conf.loggedUser.attributes.resourceSet = openamData.resourceSet;
                }

                if (_.isNull(openamData.auditHistory)) {
                    _.remove(profile.tabs, function (tab) {
                        return tab.name === "auditHistory";
                    });
                } else {
                    //add the activity list to the current user
                    conf.loggedUser.attributes.auditHistory = openamData.auditHistory;
                }

                if (!openamData.trustedDevices.length) {
                    _.remove(profile.tabs, function (tab) {
                        return tab.name === "trustedDevice";
                    });
                } else {
                    //add the trustedDevices list to the current user
                    conf.loggedUser.attributes.trustedDevices = openamData.trustedDevices;
                }

                if (!openamData.oauthApplications.length) {
                    _.remove(profile.tabs, function (tab) {
                        return tab.name === "oauthApplication";
                    });
                } else {
                    //add the oauthApplications list to the current user
                    conf.loggedUser.attributes.oauthApplications = openamData.oauthApplications;
                }

                promise.resolve(profile.tabs);
            });
        }, function () {
            promise.resolve([{
                "name": "personalInfoTab",
                "view": "org/forgerock/openidm/ui/user/profile/personalInfo/PersonalInfoTab"
            }, {
                "name": "signInAndSecurity",
                "view": "org/forgerock/openidm/ui/user/profile/signInAndSecurity/SignInAndSecurityTab"
            }, {
                "name": "preference",
                "view": "org/forgerock/openidm/ui/user/profile/PreferencesTab"
            }, {
                "name": "privacyAndConsent",
                "view": "org/forgerock/openidm/ui/user/profile/PrivacyAndConsent"
            }]);
        });

        return promise;
    };

    obj.checkForDifferences = function () {
        var adminIndex;

        if (conf.loggedUser && _.contains(conf.loggedUser.uiroles, "ui-admin") && !obj.adminCheck) {
            nav.configuration.userBar.unshift({
                "id": "admin_link",
                "href": "/admin",
                "i18nKey": "openidm.admin.label"
            });

            obj.adminCheck = true;
        } else if (conf.loggedUser && !_.contains(conf.loggedUser.uiroles, "ui-admin")) {
            adminIndex = _.findIndex(nav.configuration.userBar, { 'href': '/admin' });

            if (adminIndex !== -1) {
                nav.configuration.userBar.splice(adminIndex, 1);
            }

            obj.adminCheck = false;
        }

        nav.reload();

        // every time the logged-in user component changes, reregister appropriate profile tabs
        if (conf.loggedUser && conf.loggedUser.component !== cachedUserComponent) {
            cachedUserComponent = conf.loggedUser.component;
            UserProfileView.resetTabs();
            // repo/internal/user records don't support "fancy" tabs like kba and social providers
            if (conf.loggedUser.component !== "repo/internal/user") {
                //ConfigDelegate.readEntity("ui/profile")
                return obj.getProfileTabs().then(function (tabList) {
                    var promise = $.Deferred(),
                        requireList = [];

                    if (tabList.length) {
                        _.each(tabList, function (tab) {
                            requireList.push(tab.view);
                        });

                        require(requireList, function () {
                            _.each(_.toArray(arguments), UserProfileView.registerTab, UserProfileView);
                            promise.resolve();
                        });
                    } else {
                        promise.resolve();
                    }

                    return promise;
                });
            } else {
                var promise = $.Deferred(),
                    requireList = [];

                return obj.getProfileTabs().then(function (tabList) {
                    tabList = _.filter(tabList, function (tab) {
                        return _.includes(["personalInfoTab", "signInAndSecurity"], tab.name);
                    });

                    if (tabList.length) {
                        _.each(tabList, function (tab) {
                            requireList.push(tab.view);
                        });

                        require(requireList, function () {
                            _.each(_.toArray(arguments), UserProfileView.registerTab, UserProfileView);
                            promise.resolve();
                        });
                    } else {
                        promise.resolve();
                    }

                    return promise;
                });
            }
        }

        return $.Deferred().resolve();
    };

    obj.getDataFromOpenAM = function () {
        if (amDataEndpoints) {
            AMDelegate.setDataPoints(amDataEndpoints, conf.loggedUser.authenticationId);

            return $.when(AMDelegate.getTrustedDevices(), AMDelegate.getOAuthApplications(), AMDelegate.getAuditHistory(), AMDelegate.getResourceSet()).then(function (trustedDevices, oauthApplications, auditHistory, resourceSet) {
                return {
                    trustedDevices: trustedDevices[0].result,
                    oauthApplications: oauthApplications[0].result,
                    resourceSet: resourceSet ? resourceSet.result : null,
                    auditHistory: auditHistory ? auditHistory.result : null
                };
            });
        } else {
            return $.Deferred().resolve({
                trustedDevices: [],
                oauthApplications: [],
                resourceSet: null,
                auditHistory: null
            });
        }
    };

    return obj;
});
