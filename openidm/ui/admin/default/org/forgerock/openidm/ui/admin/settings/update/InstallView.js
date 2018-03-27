"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/openidm/ui/admin/util/AdminAbstractView", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/openidm/ui/admin/delegates/MaintenanceDelegate"], function ($, _, AdminAbstractView, Constants, MaintenanceDelegate) {
    var InstallView = AdminAbstractView.extend({
        template: "templates/admin/settings/update/InstallTemplate.html",
        element: "#install",
        noBaseTemplate: true,
        events: {
            "click .restartNow": "restartNow"
        },
        data: {
            "successful": false,
            "msg": "",
            "percent": 0,
            "responseJSON": ""
        },
        model: {},

        /**
         * @param configs
         * @param configs.runningID {string}
         * @param configs.archiveModel {object}
         * @param configs.success {function}
         * @param configs.error {function}
         * @param [callback]
         */

        render: function render(configs, callback) {
            this.model = configs;

            this.data = _.extend(this.data, _.pick(this.model, ["successful", "msg", "percent", "responseJSON"]));

            function finishRender() {
                $("#menu, #footer, #settingsBody").hide();
                this.$el.show();

                this.parentRender(_.bind(function () {
                    if (this.data.successful && this.model.archiveModel.get("restartRequired")) {
                        this.restartNow();
                    } else if (this.data.successful && !this.model.archiveModel.get("restartRequired")) {
                        this.installationReport();
                    } else if (this.data.repoUpdates) {
                        this.showRepoUpdates(this.data.lastID);
                    } else if (this.model.runningID) {
                        this.model.failedOnce = 0;
                        this.pollInstall(this.model.runningID);
                    }

                    if (callback) {
                        callback();
                    }
                }, this));
            }

            function preRender() {
                if (this.model.response) {
                    this.data.responseJSON = JSON.stringify(this.model.response);
                }

                if (this.model.archiveModel && !this.model.runningID) {

                    this.model.version = this.model.archiveModel.get("toVersion");

                    MaintenanceDelegate.update(this.model.archiveModel.get("archive")).then(_.bind(function (response) {
                        this.model.runningID = response._id;
                        _.bind(finishRender, this)();
                    }, this), _.bind(function () {
                        this.showUI();
                        this.model.error(this.model.runningID);
                    }, this));
                } else {
                    _.bind(finishRender, this)();
                }
            }
            _.bind(preRender, this)();
        },

        showRepoUpdates: function showRepoUpdates() {
            var _this = this;

            this.data.final = true;

            MaintenanceDelegate.getRepoUpdates(this.model.archiveModel.get("archive")).then(function (data) {
                _this.data.repoUpdatesList = data;

                _this.model.repoUpdates({
                    "archiveModel": _this.model.archiveModel,
                    "data": _this.data,
                    "model": _this.model
                });
                _this.showUI();
            });
        },

        showUI: function showUI() {
            $("#menu, #footer, #settingsBody").show();
            this.$el.hide();
        },

        /**
         * Restarts IDM then waits for the last update id.
         */
        restartNow: function restartNow() {

            if (!this.model.restarted) {
                this.$el.find(".restart").text($.t("templates.update.install.restarting"));

                MaintenanceDelegate.restartIDM().then(_.bind(function () {
                    this.waitForLastUpdateID(_.bind(this.installationReport, this));
                }, this));
            }
        },

        installationReport: function installationReport() {
            this.showUI();
            this.model.success({
                "runningID": this.model.runningID,
                "version": this.model.archiveModel.get("toVersion"),
                "response": this.model.response
            });
        },
        /**
         * If the UI has not tracked a restart before then we assume this is the first time we have begun waiting on a last update ID.
         *
         * We set a 60 second timeout, if IDM is going to restart it is going to do it in 60 seconds or less.
         * We can assume an error if this timeout is allowed to complete.
         *
         * If the restart hasn't timed out we poll the lastupdate id and compare it with a previous copy.
         * These values should be the same after the restart is complete.
         *
         * @param callback
         */
        waitForLastUpdateID: function waitForLastUpdateID(callback) {
            if (!this.model.restarted) {
                this.model.restarted = true;

                _.delay(_.bind(function () {
                    this.model.timeout = true;
                }, this), 60000);
            }

            if (!this.model.timeout) {
                // Poll endpoint once every five seconds so don't bog down the ui with AJAX calls.
                _.delay(_.bind(function () {
                    MaintenanceDelegate.getLastUpdateId().then(_.bind(function (response) {

                        if (this.model.lastUpdateId !== response.lastUpdateId) {
                            this.model.lastUpdateId = response.lastUpdateId;
                            this.waitForLastUpdateID(callback);
                        } else {
                            callback();
                        }
                    }, this), _.bind(function () {
                        this.waitForLastUpdateID(callback);
                    }, this));
                }, this), 5000);
            } else {
                this.model.error("Restart timed out.");
            }
        },

        /**
         * While the install is "IN_PROGRESS" we keep polling for updates.
         * @param id
         */
        pollInstall: function pollInstall(id) {

            MaintenanceDelegate.getLogDetails(id).then(_.bind(function (response) {
                if (response && response.status === "IN_PROGRESS") {
                    // This delay is to given a moment to take in the status
                    _.delay(_.bind(function () {
                        this.render(_.extend(this.model, {
                            "runningID": this.model.runningID,
                            "percent": Math.floor(response.completedTasks / response.totalTasks * 100),
                            "msg": response.statusMessage,
                            "version": this.model.version
                        }));
                    }, this), 5000);
                } else if (response && (response.status === "COMPLETE" || response.status === "PENDING_REPO_UPDATES")) {
                    this.$el.find("#updateInstallerContainer .progress-bar").css("width", "100%");

                    // This delay is to given a moment to take in the completion status
                    _.delay(_.bind(function () {
                        this.render(_.extend(this.model, {
                            "successful": true,
                            "runningID": this.model.runningID,
                            "files": response.files,
                            "response": response,
                            "version": this.model.version
                        }));
                    }, this), 5000);
                } else if (response && response.status === "REVERTED") {
                    this.showUI();
                    this.model.error($.t("templates.update.install.reverted"));
                } else if ((!response || !response.status) && this.model.failedOnce === 0) {
                    this.model.failedOnce = 1;
                    _.delay(_.bind(this.pollInstall, this, id), 5000);
                } else {
                    this.showUI();
                    this.model.error($.t("templates.update.install.failedStatus") + " " + id);
                }
            }, this), _.bind(function () {
                this.showUI();
                this.model.error($.t("templates.update.install.genericFail"));
            }, this));
        }
    });

    return new InstallView();
});
