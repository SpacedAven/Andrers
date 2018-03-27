"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/openidm/ui/admin/util/AdminAbstractView", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/openidm/ui/admin/delegates/SchedulerDelegate", "org/forgerock/openidm/ui/admin/delegates/MaintenanceDelegate"], function ($, _, AdminAbstractView, Constants, SchedulerDelegate, MaintenanceDelegate) {

    var VersionsView = AdminAbstractView.extend({
        template: "templates/admin/settings/update/MaintenanceModeTemplate.html",
        element: "#maintenanceModeView",
        noBaseTemplate: true,
        events: {},
        data: {
            "enterMaintenanceMode": false
        },
        model: {},

        /**
         *
         * @param configs {object}
         * @param configs.enterMaintenanceMode {boolean}
         * @param [callback]
         */
        render: function render(configs, callback) {

            this.data.enterMaintenanceMode = configs.enterMaintenanceMode;
            this.model.success = configs.success;
            this.model.error = configs.error;

            this.parentRender(_.bind(function () {
                if (this.data.enterMaintenanceMode) {
                    this.model.archive = configs.archive;
                    this.enterMaintenanceMode();
                } else {
                    this.model.data = configs.data;
                    this.exitMaintenanceMode();
                }

                if (callback) {
                    callback();
                }
            }, this));
        },

        enterMaintenanceMode: function enterMaintenanceMode() {
            this.$el.find(".shuttingDownScheduler").show();

            SchedulerDelegate.pauseJobs().then(_.bind(function (schedulerResult) {
                this.$el.find(".remainingSchedules").show();

                if (schedulerResult.success) {

                    this.pollSchedules(_.bind(function () {

                        MaintenanceDelegate.enable().then(_.bind(function (data) {
                            if (data.maintenanceEnabled === true) {
                                this.$el.find(".enterMaintenanceMode").show();
                                this.$el.find(".gettingPreviewData").show();

                                MaintenanceDelegate.preview(this.model.archive).then(_.bind(function (files) {
                                    this.$el.find(".success").show();

                                    // Give a moment to read the success string
                                    _.delay(_.bind(function () {
                                        this.model.success(files, this.model.archiveModel);
                                    }, this), 300);
                                }, this), _.bind(function () {
                                    this.model.error();
                                }, this));
                            } else {
                                this.model.error();
                            }
                        }, this));
                    }, this));
                } else {
                    this.model.error();
                }
            }, this));
        },

        // Wait until all schedules are completed to fire the callback
        pollSchedules: function pollSchedules(callback) {
            SchedulerDelegate.listCurrentlyExecutingJobs().then(_.bind(function (schedulerResult) {

                if (schedulerResult.length === 0) {
                    this.$el.find(".remainingSchedules").hide();
                    this.$el.find(".schedulerShutDownSuccess").show();
                    callback();
                } else {
                    this.$el.find(".remainingSchedules strong").html(schedulerResult.length);
                    _.delay(_.bind(function () {
                        this.pollSchedules(callback);
                    }, this), 500);
                }
            }, this));
        },

        exitMaintenanceMode: function exitMaintenanceMode() {
            var _this = this;

            MaintenanceDelegate.disable().then(function (data) {

                _this.$el.find(".resumeSchedules").show();

                if (data.maintenanceEnabled === false) {
                    if (_this.model.data && _this.model.data.response && _this.model.data.response.status === "COMPLETE") {
                        _this.showReport();
                    } else {
                        SchedulerDelegate.resumeJobs().then(function (schedulerResult) {
                            if (schedulerResult.success) {
                                _this.showReport();
                            } else {
                                _this.model.error();
                            }
                        });
                    }
                } else {
                    _this.model.error();
                }
            });
        },

        showReport: function showReport() {
            var _this2 = this;

            this.$el.find(".success").show();

            // Give a moment to read the success string
            _.delay(function () {
                _this2.model.success(_this2.model.data);
            }, 300);
        }
    });

    return new VersionsView();
});
