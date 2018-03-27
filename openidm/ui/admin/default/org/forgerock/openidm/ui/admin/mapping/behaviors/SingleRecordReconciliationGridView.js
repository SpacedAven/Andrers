"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/openidm/ui/admin/mapping/util/MappingAdminAbstractView", "org/forgerock/openidm/ui/admin/delegates/ReconDelegate", "org/forgerock/openidm/ui/common/delegates/SearchDelegate", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/components/Messages"], function ($, _, MappingAdminAbstractView, reconDelegate, searchDelegate, conf, messagesManager) {
    var SingleRecordReconciliationGridView = MappingAdminAbstractView.extend({
        template: "templates/admin/mapping/behaviors/SingleRecordReconciliationGridTemplate.html",
        data: {},
        element: "#testSyncGrid",
        noBaseTemplate: true,
        events: {
            "click #syncUser": "syncNow"
        },

        syncNow: function syncNow() {
            reconDelegate.triggerReconById(this.data.mapping.name, conf.globalData.testSyncSource._id).then(_.bind(function (recon) {
                this.loadData(recon[0]._id, true);
            }, this));
        },

        render: function render(args) {

            this.data.recon = args.recon;
            this.data.sync = this.getSyncConfig();
            this.data.mapping = this.getCurrentMapping();
            this.data.mappingName = this.getMappingName();

            this.data.showChangedPropertyMessage = false;

            this.loadData();
        },

        loadData: function loadData(newReconId, waitForReconToPropagate) {
            var _this = this;

            var reconId = newReconId || this.data.recon._id,
                doLoad = _.bind(function () {
                this.parentRender(_.bind(function () {
                    this.$el.find(".changed").popover({
                        placement: 'top',
                        container: 'body',
                        html: 'true',
                        title: ''
                    });
                }, this));
            }, this),
                targetProm = $.Deferred(),
                delayTime = waitForReconToPropagate ? 1000 : 0;

            if (conf.globalData.testSyncSource && this.data.mapping.properties.length) {
                this.data.sampleSource_txt = conf.globalData.testSyncSource[this.data.mapping.properties[0].source];
                this.$el.parent().find(".sampleSourceAction").show();

                //we need to give the new recon time to record itself
                _.delay(function () {
                    reconDelegate.getLastAuditForObjectId(reconId, "sourceObjectId", _this.data.mapping.source + "/" + conf.globalData.testSyncSource._id).then(_.bind(function (audit) {
                        var targetObjectId;

                        if (audit.result.length) {
                            targetObjectId = audit.result[0].targetObjectId;
                            if (newReconId) {
                                if (audit.result[0].status === "SUCCESS") {
                                    messagesManager.messages.addMessage({ "message": $.t("templates.sync.testSync.singleRecordReconciliationComplete") });
                                } else {
                                    if (audit.result[0].messageDetail && audit.result[0].messageDetail.message) {
                                        messagesManager.messages.addMessage({ "type": "error", "message": audit.result[0].messageDetail.message });
                                    } else if (audit.result[0].message && audit.result[0].message.length) {
                                        messagesManager.messages.addMessage({ "type": "error", "message": audit.result[0].message });
                                    } else {
                                        messagesManager.messages.addMessage({ "type": "error", "message": $.t("config.messages.UserMessages.unknown") });
                                    }
                                }
                            }

                            if (targetObjectId && targetObjectId.replace(this.data.mapping.target + "/", "") !== "null") {
                                searchDelegate.searchResults(this.data.mapping.target, ["_id"], targetObjectId.replace(this.data.mapping.target + "/", ""), "eq").then(function (qry) {
                                    if (qry.length) {
                                        targetProm.resolve(qry[0]);
                                    }
                                });
                            } else {
                                targetProm.resolve(false);
                            }
                        } else {
                            targetProm.resolve(false);
                        }

                        targetProm.then(_.bind(function (target) {
                            this.data.showSampleSource = true;

                            this.data.propMap = _.map($.extend({}, true, this.data.mapping.properties), _.bind(function (p, i) {
                                var targetBefore = "",
                                    targetValue = target[p.target] || "",
                                    changed = false;

                                if (newReconId) {
                                    targetBefore = this.data.propMap[i].targetValue;

                                    if (targetBefore !== targetValue) {
                                        changed = true;
                                        this.data.showChangedPropertyMessage = true;
                                    }
                                }

                                return {
                                    source: p.source,
                                    sourceValue: conf.globalData.testSyncSource[p.source],
                                    target: p.target,
                                    targetValue: targetValue,
                                    targetBefore: targetBefore,
                                    changed: changed
                                };
                            }, this));

                            doLoad();
                        }, this));
                    }, _this));
                }, delayTime);
            } else {
                this.data.showSampleSource = false;
                this.data.sampleSource_txt = "";
                this.$el.parent().find(".sampleSourceAction").hide();
                doLoad();
            }
        }
    });

    return new SingleRecordReconciliationGridView();
});
