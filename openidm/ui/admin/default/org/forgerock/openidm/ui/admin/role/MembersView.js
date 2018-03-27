"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "handlebars", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/openidm/ui/common/resource/RelationshipArrayView", "org/forgerock/openidm/ui/common/resource/ResourceCollectionSearchDialog", "org/forgerock/openidm/ui/admin/role/MembersDialog"], function ($, _, Handlebars, AbstractView, RelationshipArrayView, ResourceCollectionSearchDialog, MembersDialog) {
    var MembersView = new RelationshipArrayView();

    //overriding the render function here to remove the checkboxes from grid rows
    //that have the _grantType set to conditional
    //accomplished by adding the onGridChange arg
    MembersView.render = function (args, callback) {
        args.onGridChange = _.bind(function () {
            var membersList = this.$el.find("#relationshipArray-members tbody, #relationshipArray-roles tbody");

            this.removeConditionalGrantCheckboxes(membersList);

            if (callback) {
                callback();
            }
        }, this);

        RelationshipArrayView.prototype.render.call(this, args, callback);
    };
    /**
     * @param memberList {object} - a jquery object representing the data rows from the members list grid
     */
    MembersView.removeConditionalGrantCheckboxes = function (membersList) {
        _.each(membersList.find("tr"), function (row) {
            var rowIsConditional = $(row).find("td:contains('conditional')").length;

            if (rowIsConditional) {
                $(row).find(".select-row-cell input[type=checkbox]").remove();
            }
        });
    };

    MembersView.openResourceCollectionDialog = function (propertyValue) {
        var opts = this.getResourceCollectionDialogOptions(propertyValue);

        new MembersDialog().renderDialog(opts);
    };

    return MembersView;
});
