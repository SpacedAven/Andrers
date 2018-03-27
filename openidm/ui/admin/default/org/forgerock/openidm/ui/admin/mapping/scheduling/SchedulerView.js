"use strict";

/*
 * Copyright 2014-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/openidm/ui/admin/mapping/util/MappingAdminAbstractView", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/openidm/ui/common/delegates/ConfigDelegate", "org/forgerock/openidm/ui/admin/delegates/SchedulerDelegate", "org/forgerock/openidm/ui/admin/util/Scheduler"], function ($, _, MappingAdminAbstractView, eventManager, constants, ConfigDelegate, SchedulerDelegate, Scheduler) {

    var ScheduleView = MappingAdminAbstractView.extend({
        template: "templates/admin/mapping/scheduling/SchedulerTemplate.html",
        element: "#schedulerView",
        noBaseTemplate: true,
        events: {
            "click #addNew": "addReconciliation"
        },
        model: {
            mapping: {}
        },

        render: function render(args, callback) {
            var promises = [],
                tempPromises;

            this.model.mapping = _.omit(this.getCurrentMapping(), "recon");

            this.parentRender(_.bind(function () {

                SchedulerDelegate.availableSchedules().then(_.bind(function (schedules) {
                    if (schedules.result.length > 0) {
                        _.each(schedules.result, function (scheduleId) {
                            tempPromises = SchedulerDelegate.specificSchedule(scheduleId._id);

                            promises.push(tempPromises);

                            tempPromises.then(_.bind(function (schedule) {
                                if (schedule.invokeService.indexOf("sync") >= 0 && schedule.invokeContext.mapping === this.model.mapping.name) {
                                    Scheduler.generateScheduler({
                                        "element": this.$el.find("#scheduleList"),
                                        "defaults": {
                                            enabled: schedule.enabled,
                                            schedule: schedule.schedule,
                                            persisted: schedule.persisted,
                                            misfirePolicy: schedule.misfirePolicy
                                        },
                                        "onDelete": this.reconDeleted,
                                        "invokeService": schedule.invokeService,
                                        "scheduleId": scheduleId._id
                                    });
                                    this.$el.find("#addNew").hide();
                                }
                            }, this));
                        }, this);
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
            }, this));
        },

        reconDeleted: function reconDeleted(id, name, element) {
            element.parent().find("#addNew").show();
            element.remove();
        },

        addReconciliation: function addReconciliation() {
            SchedulerDelegate.addSchedule({
                "type": "cron",
                "invokeService": "sync",
                "schedule": "0 0 * * * ?",
                "persisted": true,
                "enabled": false,
                "invokeContext": {
                    "action": "reconcile",
                    "mapping": this.model.mapping.name
                }
            }).then(_.bind(function (newSchedule) {
                Scheduler.generateScheduler({
                    "element": this.$el.find("#scheduleList"),
                    "defaults": {},
                    "onDelete": this.reconDeleted,
                    "invokeService": newSchedule.invokeService,
                    "scheduleId": newSchedule._id
                });

                this.$el.find("#addNew").hide();

                eventManager.sendEvent(constants.EVENT_DISPLAY_MESSAGE_REQUEST, "scheduleCreated");
            }, this));
        }
    });

    return new ScheduleView();
});
