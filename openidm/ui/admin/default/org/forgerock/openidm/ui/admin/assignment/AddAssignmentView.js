"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "form2js", "org/forgerock/openidm/ui/admin/util/AdminAbstractView", "org/forgerock/commons/ui/common/main/ValidatorsManager", "org/forgerock/openidm/ui/common/delegates/ConfigDelegate", "org/forgerock/openidm/ui/common/delegates/ResourceDelegate", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/util/Constants"], function ($, _, form2js, AdminAbstractView, ValidatorsManager, ConfigDelegate, ResourceDelegate, EventManager, Constants) {
    var AddAssignmentView = AdminAbstractView.extend({
        template: "templates/admin/assignment/AddAssignmentViewTemplate.html",
        element: "#assignmentHolder",
        events: {
            "click #addAssignment": "addAssignment",
            "onValidate": "onValidate"
        },
        partials: ["partials/_alert.html"],
        data: {},
        model: {},
        render: function render(args, callback) {
            ConfigDelegate.readEntity("sync").then(_.bind(function (sync) {
                this.data.mappings = sync.mappings;
                this.data.mappingsEmpty = this.findMappings(sync.mappings);

                this.model.serviceUrl = ResourceDelegate.getServiceUrl(args);
                this.model.args = args;

                this.parentRender(_.bind(function () {
                    ValidatorsManager.bindValidators(this.$el.find("#addAssignmentForm"));

                    this.$el.find("#assignmentName")[0].focus();

                    if (callback) {
                        callback();
                    }
                }, this));
            }, this));
        },

        /**
         * @param sync - Array of mappings available
         * @returns {boolean} - Returns if there are any mappings available
         *
         * Used to detect if there are any mappings available for assignments to be tied to
         */
        findMappings: function findMappings(sync) {
            var mappingsEmpty = false;

            if (sync.length === 0) {
                mappingsEmpty = true;
            }

            return mappingsEmpty;
        },

        /**
         * @param event - Validation event
         *
         * This function is overridden to give additional checking for if there are any mappings available.
         * If there are mappings available we do not want to allow users to create assignments.
         */
        validationSuccessful: function validationSuccessful(event) {
            if (this.data.mappingsEmpty) {
                this.$el.find("#addAssignment").attr("disabled", true);
            } else {
                AdminAbstractView.prototype.validationSuccessful(event);
            }
        },

        addAssignment: function addAssignment(event) {
            event.preventDefault();

            var formVal = form2js(this.$el.find('#addAssignmentForm')[0], '.', true);

            ResourceDelegate.createResource(this.model.serviceUrl, null, formVal, _.bind(function (result) {
                EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, "assignmentSaveSuccess");

                this.model.args.push(result._id);

                EventManager.sendEvent(Constants.ROUTE_REQUEST, { routeName: "adminEditManagedObjectView", args: this.model.args });
            }, this));
        }
    });

    return new AddAssignmentView();
});
