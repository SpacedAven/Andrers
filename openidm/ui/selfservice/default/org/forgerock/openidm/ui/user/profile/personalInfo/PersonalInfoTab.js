"use strict";

/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "moment", "org/forgerock/commons/ui/user/profile/AbstractUserProfileTab", "org/forgerock/commons/ui/common/util/UIUtils", "org/forgerock/openidm/ui/user/profile/personalInfo/PersonalInfoFieldView", "org/forgerock/openidm/ui/common/delegates/ResourceDelegate", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/util/Constants"], function ($, _, moment, AbstractUserProfileTab, UIUtils, PersonalInfoFieldView, ResourceDelegate, Configuration, EventManager, Constants) {

    var PersonalInfoTabView = AbstractUserProfileTab.extend({
        template: "templates/profile/personalInfo/PersonalInfoTab.html",
        events: {
            "show.bs.collapse .panel-collapse": "closePreviousField",
            "keydown form": "preventKeyDownSubmission"
        },
        model: {},

        /**
         Expected by all dynamic user profile tabs - returns a map of details necessary to render the nav tab
         */
        getTabDetail: function getTabDetail() {
            return {
                "panelId": "personalInfoTab",
                "label": $.t("common.user.profileMenu.personalInformation")
            };
        },

        /**
         * Render tab and set up and render fields
         */
        render: function render(args, callback) {
            var _this = this;

            if (args.user.lastChanged && args.user.lastChanged.date) {
                this.data.lastUpdated = moment.utc(args.user.lastChanged.date).format("LLL");
            } else {
                this.data.lastUpdated = null;
            }

            this.parentRender(function () {
                var fields = {};
                var panelBody = _this.$el.find("#personalInfo");

                _.forEach(args.profileDetails, function (detail) {
                    var schemaName = detail.schemaName,
                        title = detail.title;

                    var element = $("<div>", { "class": "panel panel-default", "data-Id": schemaName });
                    var justification = _.has(detail, "justification") ? detail.justification : $.t("templates.personalInfo.justificationPlaceholder");
                    var submit = _.bind(_this.submit, _this);
                    var value = args.user[schemaName];
                    var readonly = _.has(detail, "policies") && _.find(detail.policies, { policyId: "read-only" });

                    panelBody.append(element);
                    fields[schemaName] = new PersonalInfoFieldView({ element: element, readonly: readonly, schemaName: schemaName, title: title, value: value, submit: submit, justification: justification });
                    fields[schemaName].render();
                });

                _this.model.fields = fields;

                if (callback) {
                    callback();
                }
            });
        },


        /**
         * Patch the user model with the local data and persist it. if successful,
         * call `submitSuccess` with a list of the values that changed.
         */
        submit: function submit(fieldData) {
            var _this2 = this;

            Configuration.loggedUser.save(fieldData, { patch: true }).then(function (data) {
                var changedFields = _.map(_.keys(fieldData), function (key) {
                    return { schemaName: key, value: data[key] };
                });
                _this2.submitSuccess(changedFields);
            });
        },


        /**
         * update changed field with new data then send success event
         * @param  {array} changedFields -- list of fields that changed
         */
        submitSuccess: function submitSuccess(changedFields) {
            var _this3 = this;

            _.forEach(changedFields, function (fieldData) {
                _this3.model.fields[fieldData.schemaName].updateValue(fieldData.value);
            });
            EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, "profileUpdateSuccessful");
        },


        /**
         * close inactive field collapse panels
         */
        closePreviousField: function closePreviousField(event) {
            var _this4 = this;

            var targetId = $(event.target).data("id");

            _.forEach(_.keys(this.model.fields), function (fieldName) {
                var field = _this4.model.fields[fieldName];

                if (fieldName !== targetId && field.isOpen()) {
                    field.cancelChanges(event);
                }
            });
        },


        /**
         * prevent keydown on ENTER key from triggering default form submission behavior
         */
        preventKeyDownSubmission: function preventKeyDownSubmission(event) {
            // Enter key
            if (event.keyCode === 13) {
                event.preventDefault();
            }
        },


        /**
         * overwrite uneeded generic tab method
         */
        reloadFormData: _.noop,

        /**
         * overwrite uneeded generic tab method
         */
        checkChanges: _.noop

    });

    return new PersonalInfoTabView();
});
