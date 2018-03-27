"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/openidm/ui/admin/mapping/util/MappingAdminAbstractView", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/openidm/ui/common/delegates/ConfigDelegate", "org/forgerock/openidm/ui/admin/delegates/SchedulerDelegate"], function ($, _, MappingAdminAbstractView, eventManager, constants, ConfigDelegate, SchedulerDelegate) {

    var ScheduleView = MappingAdminAbstractView.extend({
        template: "templates/admin/mapping/scheduling/LiveSyncTemplate.html",
        element: "#liveSyncView",
        noBaseTemplate: true,
        events: {
            "click .saveLiveSync": "saveLiveSync"
        },
        model: {
            mapping: {},
            sync: {}
        },

        render: function render(args, callback) {
            var seconds = "",
                promises = [],
                tempPromises,
                foundLiveSync = false;

            this.model.mapping = _.omit(this.getCurrentMapping(), "recon");
            this.model.sync = this.getSyncConfig();

            this.parentRender(_.bind(function () {
                this.$el.find(".noLiveSyncMessage").hide();
                this.$el.find(".systemObjectMessage").hide();

                if (this.model.mapping.hasOwnProperty("enableSync")) {
                    this.$el.find(".liveSyncEnabled").prop('checked', this.model.mapping.enableSync);
                } else {
                    this.$el.find(".liveSyncEnabled").prop('checked', true);
                }

                if (args.schedules.result.length > 0) {
                    _.each(args.schedules.result, function (scheduleId) {
                        tempPromises = SchedulerDelegate.specificSchedule(scheduleId._id);

                        promises.push(tempPromises);

                        tempPromises.then(_.bind(function (schedule) {

                            // There is a liveSync Scheduler and it is enabled and the source matches the source of the mapping
                            if (schedule.invokeService.indexOf("provisioner") >= 0 && schedule.enabled && schedule.invokeContext.source === this.model.mapping.source) {
                                seconds = schedule.schedule.substr(schedule.schedule.indexOf("/") + 1);
                                seconds = seconds.substr(0, seconds.indexOf("*") - 1);

                                this.$el.find(".noLiveSyncMessage").hide();
                                this.$el.find(".systemObjectMessage").show();
                                this.$el.find(".managedSourceMessage").hide();
                                this.$el.find(".liveSyncSeconds").text(seconds);

                                foundLiveSync = true;

                                // This is a recon schedule
                            } else if (schedule.invokeService.indexOf("sync") >= 0) {

                                // The mapping is of a managed object
                                if (this.model.mapping.source.indexOf("managed/") >= 0) {
                                    this.$el.find(".noLiveSyncMessage").hide();
                                    this.$el.find(".systemObjectMessage").hide();
                                    this.$el.find(".managedSourceMessage").show();
                                } else if (!foundLiveSync) {
                                    this.$el.find(".noLiveSyncMessage").show();
                                    this.$el.find(".systemObjectMessage").hide();
                                    this.$el.find(".managedSourceMessage").hide();
                                }
                            }
                        }, this));
                    }, this);
                } else if (this.model.mapping.source.indexOf("managed/") >= 0) {
                    this.$el.find(".noLiveSyncMessage").hide();
                    this.$el.find(".systemObjectMessage").hide();
                    this.$el.find(".managedSourceMessage").show();
                } else {
                    this.$el.find(".noLiveSyncMessage").show();
                    this.$el.find(".systemObjectMessage").hide();
                    this.$el.find(".managedSourceMessage").hide();
                }

                if (promises.length !== 0) {
                    $.when.apply($, promises).then(_.bind(function () {
                        this.$el.find(".schedule-input-body").show();

                        if (callback) {
                            callback();
                        }
                    }, this));
                } else {
                    this.$el.find(".schedule-input-body").show();

                    if (callback) {
                        callback();
                    }
                }
            }, this));
        },

        saveLiveSync: function saveLiveSync() {
            this.model.mapping.enableSync = this.$el.find(".liveSyncEnabled").prop("checked");

            this.AbstractMappingSave(this.model.mapping, _.bind(function () {
                eventManager.sendEvent(constants.EVENT_DISPLAY_MESSAGE_REQUEST, "syncLiveSyncSaveSuccess");
            }, this));
        }
    });

    return new ScheduleView();
});
