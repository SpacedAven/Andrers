"use strict";

/*
 * Copyright 2014-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/commons/ui/common/main/AbstractView", "moment", "handlebars"], function ($, _, AbstractView, moment, handlebars) {

    var ReconDetailsView = AbstractView.extend({
        template: "templates/admin/util/ReconDetailsTemplate.html",
        element: "#syncStatusDetails",
        noBaseTemplate: true,
        events: {
            "click .toggle-data": "toggleData"
        },

        render: function render(syncDetails, callback) {
            this.data.syncDetails = syncDetails;

            if (syncDetails) {
                if (_.isEmpty(syncDetails.sourceProcessedByNode)) {
                    this.data.syncDetails.sourceProcessedByNode = false;
                }
            }

            handlebars.registerHelper('millisecondsToTimeDisplay', function (t) {
                return moment.utc(t).format("HH:mm:ss:SSS");
            });

            this.parentRender(_.bind(function () {
                this.$el.find(".fa-info-circle").popover({
                    content: function content() {
                        return $(this).attr("data-title");
                    },
                    container: 'body',
                    placement: 'top',
                    html: 'true',
                    title: ''
                });

                if (callback) {
                    callback();
                }
            }, this));
        },
        toggleData: function toggleData(e) {
            var elementId = $(e.target).closest(".toggle-data").attr("id"),
                //either "showReconResults", "showDuration"
            listElement = this.$el.find("#" + elementId);

            e.preventDefault();

            if (this.data[elementId]) {
                listElement.addClass("hover");
            } else {
                listElement.removeClass("hover");
            }

            this.data[elementId] = !this.data[elementId];

            this.render(this.data.syncDetails);
        }

    });

    return new ReconDetailsView();
});
