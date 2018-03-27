"use strict";

/*
 * Copyright 2014-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/openidm/ui/common/util/FilterEditor", "ldapjs-filter", "bootstrap-dialog"], function ($, _, FilterEditor, ldapjs, BootstrapDialog) {
    var LDAPFilterDialog = FilterEditor.extend({
        el: "#dialogs",
        getFilterString: function getFilterString() {
            return ldapjs.serializeFilterTree(this.data.filter);
        },
        returnFilterString: function returnFilterString(e) {
            e.preventDefault();
            if (_.has(this.data.filter, "op") && this.data.filter.op === "none") {
                this.updatePromise.resolve("");
            } else {
                this.updatePromise.resolve(this.getFilterString());
            }

            this.currentDialog.close();
        },
        render: function render(params) {
            if (typeof params.filterString === "string" && params.filterString.length) {
                this.data.filter = ldapjs.buildFilterTree(params.filterString);
            } else {
                this.data.filter = { "op": "none", "children": [] };
            }
            this.data.filterString = params.filterString;
            this.updatePromise = params.promise;

            this.dialogContent = $('<div id="attributeDialog"></div>');
            this.setElement(this.dialogContent);
            $('#dialogs').append(this.dialogContent);

            this.events["click input[type=submit]"] = _.bind(this.returnFilterString, this);
            this.delegateEvents(this.events);

            this.data.config.tags = _.uniq(this.data.config.tags.concat(["extensibleMatchAND", "extensibleMatchOR"]));

            this.currentDialog = new BootstrapDialog({
                title: $.t("templates.connector.ldapConnector.filterTitle", { type: params.type }),
                size: BootstrapDialog.SIZE_WIDE,
                type: BootstrapDialog.TYPE_DEFAULT,
                message: this.dialogContent,
                onshown: _.bind(function () {
                    this.renderExpressionTree();
                }, this)
            });

            this.currentDialog.realize();
            this.currentDialog.open();
        }
    });

    return new LDAPFilterDialog();
});
