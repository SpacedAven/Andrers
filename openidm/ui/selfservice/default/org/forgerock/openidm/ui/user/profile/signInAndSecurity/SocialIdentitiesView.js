"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "bootstrap", "bootstrap-dialog", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/util/OAuth", "org/forgerock/commons/ui/common/main/Router", "org/forgerock/openidm/ui/common/delegates/SocialDelegate", "org/forgerock/commons/ui/common/util/UIUtils"], function ($, _, bootstrap, BootstrapDialog, AbstractView, Configuration, Constants, EventManager, OAuth, Router, SocialDelegate, UIUtils) {
    var SocialIdentitiesView = AbstractView.extend({
        template: "templates/profile/signInAndSecurity/SocialIdentitiesTemplate.html",
        events: {
            "click .social-toggle": "toggleAction",
            "click .closeErrorMsg": "closeErrorMsg"
        },
        partials: ["partials/providers/_providerCircle.html"],

        /**
         Expected by all dynamic user profile tabs - returns a map of details necessary to render the nav tab
         */
        getTabDetail: function getTabDetail() {
            return {
                "panelId": "socialIdentities",
                "label": $.t("templates.socialIdentities.socialIdentities")
            };
        },

        model: {},

        render: function render(args, callback) {
            var _this = this;

            var params = Router.convertCurrentUrlToJSON().params;

            if (!_.isEmpty(params) && _.has(params, "oauthReturn") && _.has(params, "provider")) {
                opener.require("org/forgerock/openidm/ui/user/profile/signInAndSecurity/SocialIdentitiesView").oauthReturn(params);
                window.close();
                return;
            } else {

                this.data.user = Configuration.loggedUser.toJSON();
                SocialDelegate.providerList().then(function (response) {
                    _this.data.providers = response.providers;

                    _.each(_this.data.providers, function (provider, index) {
                        _this.activateProviders(provider, index);

                        provider.displayName = _.capitalize(provider.provider);
                    });

                    _this.parentRender(function () {
                        _this.$el.find("#idpUnbindError").hide();
                        if (callback) {
                            callback();
                        }
                    });
                });
            }
        },

        activateProviders: function activateProviders(provider, index) {
            if (_.has(this.data.user, "idpData") && _.has(this.data.user.idpData, provider.provider) && this.data.user.idpData[provider.provider].enabled) {
                this.data.providers[index].active = true;
            }
        },

        getProviderName: function getProviderName(panel) {
            return $(panel).data("name");
        },
        getProviderObj: function getProviderObj(providerName) {
            return _.filter(this.data.providers, function (obj) {
                return obj.provider === providerName;
            })[0];
        },


        toggleAction: function toggleAction(event) {
            var _this2 = this;

            event.preventDefault();

            var panel = $(event.target).parents(".panel-collapse");

            if (!panel.find("[type=checkbox]").prop("checked")) {
                this.getOptions(panel).then(function (options) {
                    _this2.oauthPopup(options);
                });
            } else {
                this.disconnectDialog(panel);
            }
        },

        oauthReturn: function oauthReturn(params) {
            var panel = this.$el.find(".panel-collapse[data-name=\"" + params.provider + "\"]");

            Configuration.loggedUser.bindProvider(params.provider).then(function () {
                panel.find("[type=checkbox]").prop("checked", true);
                EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, "saveSocialProvider");
            });
        },

        getOptions: function getOptions(panel) {
            var options = {};

            options.windowName = this.getProviderName(panel);
            return this.getUrl(options.windowName).then(function (path) {
                options.path = path;
                return options;
            });
        },

        oauthPopup: function oauthPopup(options) {
            var oauthWindow = null,
                width = screen.width * (2 / 3),
                height = screen.height * (2 / 3);

            options.windowName = options.windowName || 'ConnectWithOAuth';
            options.windowOptions = options.windowOptions || 'location=0,status=0,width=' + width + ',height=' + height;

            options.callback = options.callback || function () {
                window.location.reload();
            };

            oauthWindow = window.open(options.path, options.windowName, options.windowOptions);
        },

        disconnectDialog: function disconnectDialog(panel) {

            BootstrapDialog.show({
                title: $.t("templates.socialIdentities.confirmTitle") + _.capitalize(this.getProviderName(panel)) + "?",
                type: BootstrapDialog.TYPE_DANGER,
                message: $.t("templates.socialIdentities.confirmMessage") + _.capitalize(this.getProviderName(panel)) + ".",
                buttons: [{
                    label: $.t("common.form.cancel"),
                    id: "disconnectCancel",
                    action: function action(dialogRef) {
                        dialogRef.close();

                        $(panel).prop('checked', true);
                    }
                }, {
                    label: $.t('common.form.confirm'),
                    id: "disconnectConfirm",
                    cssClass: "btn-danger",
                    action: _.bind(function (dialogRef) {
                        dialogRef.close();

                        this.unbindProvider(panel);
                    }, this)
                }]
            });
        },

        unbindProvider: function unbindProvider(panel) {
            var _this3 = this;

            var providerName = this.getProviderName(panel);

            Configuration.loggedUser.unbindProvider(providerName).then(function (result) {
                _this3.alignProvidersArray(result);
                panel.find("[type=checkbox]").prop("checked", false);
                EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, "removeSocialProvider");
            }, function (err) {
                _this3.data.unbindText = $.t(err.responseJSON.message, { provider: _.startCase(providerName) });
                UIUtils.renderTemplate(_this3.template, _this3.$el, _this3.data, $.noop(), "replace");
                _this3.$el.find("#idpUnbindError").show();
                delete _this3.data.unbindText;
            });
        },

        alignProvidersArray: function alignProvidersArray(result) {
            _.each(this.data.providers, function (provider, index) {
                if (result.idpData[provider.provider]) {
                    provider.active = result.idpData[provider.provider].enabled;
                } else {
                    provider.active = false;
                }
            });
        },

        getUrl: function getUrl(provider) {
            return SocialDelegate.getAuthRedirect(provider, OAuth.getRedirectURI("#" + Router.getLink(Router.currentRoute, ["&provider=" + provider + "&oauthReturn=true"])));
        },

        getCurrentRoute: function getCurrentRoute() {
            return Router.currentRoute;
        },


        closeErrorMsg: function closeErrorMsg(event) {
            if (event) {
                event.preventDefault();
            }
            this.$el.find("#idpUnbindError").hide();
        }

    });

    return new SocialIdentitiesView();
});
