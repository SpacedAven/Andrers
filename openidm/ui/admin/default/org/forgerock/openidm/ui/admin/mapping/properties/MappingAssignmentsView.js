"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/openidm/ui/admin/mapping/util/MappingAdminAbstractView", "org/forgerock/openidm/ui/common/delegates/ResourceDelegate"], function ($, _, MappingAdminAbstractView, ResourceDelegate) {

    var MappingAssignmentsView = MappingAdminAbstractView.extend({
        template: "templates/admin/mapping/properties/MappingAssignmentsViewTemplate.html",
        element: "#mappingAssignments",
        noBaseTemplate: true,
        events: {},
        model: {},
        data: {},

        render: function render(args, callback) {
            this.model.mappingName = this.getMappingName();
            this.model.mapping = this.getCurrentMapping();

            ResourceDelegate.searchResource("/mapping eq '" + this.model.mappingName + "'", "managed/assignment").then(_.bind(function (assignments) {

                this.data.assignments = assignments.result;

                this.parentRender(_.bind(function () {
                    if (this.data.assignments.length > 0) {
                        //Needs to be above the view scope to open the parent panel
                        $("a[href='#assignmentsBody']").collapse("show");
                        $("#assignmentsBody").toggleClass("in", true);
                    }

                    if (callback) {
                        callback();
                    }
                }, this));
            }, this));
        }
    });

    return new MappingAssignmentsView();
});
