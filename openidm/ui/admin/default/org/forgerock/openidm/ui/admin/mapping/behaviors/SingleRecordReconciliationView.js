"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/openidm/ui/admin/mapping/util/MappingAdminAbstractView", "org/forgerock/openidm/ui/common/delegates/SearchDelegate", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/openidm/ui/admin/mapping/util/MappingUtils", "org/forgerock/openidm/ui/admin/mapping/behaviors/SingleRecordReconciliationGridView"], function ($, _, MappingAdminAbstractView, searchDelegate, conf, mappingUtils, SingleRecordReconciliationGridView) {

    var SingleRecordReconciliationView = MappingAdminAbstractView.extend({
        template: "templates/admin/mapping/behaviors/SingleRecordReconciliationTemplate.html",
        data: {},
        element: "#testSyncView",
        noBaseTemplate: true,
        events: {
            "click #refreshSourceRecord": "refreshSourceRecord",
            "click #removeSourceRecord": "removeSourceRecord"
        },
        refreshSourceRecord: function refreshSourceRecord(e) {
            e.preventDefault();

            if (conf.globalData.testSyncSource) {
                searchDelegate.searchResults(this.data.mapping.source, ["_id"], conf.globalData.testSyncSource._id, "eq").then(_.bind(function (qry) {
                    conf.globalData.testSyncSource = qry[0];
                    this.data.showChangedPropertyMessage = false;
                    SingleRecordReconciliationGridView.loadData();
                }, this));
            }
        },
        removeSourceRecord: function removeSourceRecord(e) {
            e.preventDefault();

            if (conf.globalData.testSyncSource) {
                delete conf.globalData.testSyncSource;
                this.data.showChangedPropertyMessage = false;
                this.data.showSampleSource = false;
                $("#findSampleSource", this.$el).val("");
                SingleRecordReconciliationGridView.loadData();
            }
        },
        render: function render(args, callback) {
            this.data.recon = args.recon;
            this.data.mapping = this.getCurrentMapping();

            this.parentRender(_.bind(function () {
                if (this.data.recon) {
                    this.setupSearch();
                    SingleRecordReconciliationGridView.render(this.data);
                } else {
                    this.$el.closest("#singleRecordRecon").hide();
                }
            }, this));

            if (callback) {
                callback();
            }
        },

        setupSearch: function setupSearch() {
            var autocompleteProps = _.pluck(this.data.mapping.properties, "source").slice(0, this.getNumRepresentativeProps());

            mappingUtils.setupSampleSearch($("#findSampleSource", this.$el), this.data.mapping, autocompleteProps, _.bind(function (item) {
                conf.globalData.testSyncSource = item;
                if (this.data.propMap) {
                    this.data.showChangedPropertyMessage = false;
                    delete this.data.propMap;
                }

                SingleRecordReconciliationGridView.loadData();
            }, this));
        }
    });

    return new SingleRecordReconciliationView();
});
