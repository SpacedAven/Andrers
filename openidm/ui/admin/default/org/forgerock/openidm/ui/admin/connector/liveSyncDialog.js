"use strict";

/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "bootstrap-dialog", "org/forgerock/openidm/ui/admin/connector/AbstractConnectorView", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/openidm/ui/admin/delegates/SchedulerDelegate", "org/forgerock/commons/ui/common/util/UIUtils"], function ($, _, BootstrapDialog, AbstractConnectorView, Constants, EventManager, SchedulerDelegate, UIUtils) {

    var LiveSyncDialog = AbstractConnectorView.extend({
        template: "templates/admin/connector/liveSyncDialogTemplate.html",
        el: "#dialogs",
        liveSyncObject: {},
        callback: null,
        /**
         * Opens the dialog
         *
         * @param configs
         * @param callback
         */
        render: function render(configs, callback) {
            var _this = this;

            var title = "";

            this.liveSyncObject.source = configs.source;
            this.liveSyncObject.changeType = configs.changeType;
            this.invokeService = configs.invokeService;
            this.currentDialog = $('<div id="liveSyncForm"></div>');
            this.setElement(this.currentDialog);
            this.callback = callback;

            $('#dialogs').append(this.currentDialog);

            if (this.liveSyncObject.changeType === "add") {
                title = $.t("templates.connector.liveSync.addTitle") + _.startCase(_.last(this.liveSyncObject.source.split("/")));
            } else {
                title = $.t("templates.connector.liveSync.editTitle") + _.startCase(_.last(this.liveSyncObject.source.split("/")));
                this.liveSyncObject.scheduleId = configs.id;
            }

            BootstrapDialog.show({
                title: title,
                type: BootstrapDialog.TYPE_DEFAULT,
                message: this.currentDialog,
                size: BootstrapDialog.SIZE_WIDE,
                onshow: function onshow() {
                    UIUtils.renderTemplate(_this.template, _this.$el, "replace");
                },
                onshown: function onshown() {
                    for (var i = 1; i < 60; i++) {
                        if (60 % i === 0) {
                            _this.$el.find('.liveSyncSchedule').append("<option value='" + i + "'>" + i + "</option>");
                        }
                    }
                },
                buttons: [{
                    label: $.t("common.form.cancel"),
                    action: function action(dialogRef) {
                        dialogRef.close();
                    }
                }, {
                    label: $.t("common.form.submit"),
                    cssClass: "btn-primary addSchedule",
                    action: function action(dialogRef) {
                        if (callback) {
                            _this.updateLiveSyncObject();

                            if (_this.liveSyncObject.changeType === "edit") {
                                _this.saveSchedule();
                            } else {
                                _this.addSchedule();
                            }
                            dialogRef.close();
                        }

                        dialogRef.close();
                    }
                }]
            });
        },

        updateLiveSyncObject: function updateLiveSyncObject() {
            this.liveSyncObject.schedule = "*/" + this.$el.find(".liveSyncSchedule").val() + " * * * * ?";
            this.liveSyncObject.persisted = this.$el.find(".persisted").is(":checked");
            this.liveSyncObject.enabled = this.$el.find(".enabled").is(":checked");
            this.liveSyncObject.misfirePolicy = this.$el.find(".misfirePolicy").val();
        },

        addSchedule: function addSchedule() {
            var _this2 = this;

            SchedulerDelegate.addSchedule({
                "type": "cron",
                "invokeService": "provisioner",
                "schedule": this.liveSyncObject.schedule,
                "persisted": this.liveSyncObject.persisted,
                "misfirePolicy": this.liveSyncObject.misfirePolicy,
                "enabled": this.liveSyncObject.enabled,
                "invokeContext": {
                    "action": "liveSync",
                    "source": this.liveSyncObject.source
                }
            }).then(function (newSchedule) {
                _this2.liveSyncObject.scheduleId = newSchedule._id;

                _this2.saveSchedule();
            });
        },

        saveSchedule: function saveSchedule() {
            var _this3 = this;

            SchedulerDelegate.specificSchedule(this.liveSyncObject.scheduleId).then(function (schedule) {
                schedule.enabled = _this3.liveSyncObject.enabled;
                schedule.misfirePolicy = _this3.liveSyncObject.misfirePolicy;
                schedule.persisted = _this3.liveSyncObject.persisted;
                schedule.schedule = _this3.liveSyncObject.schedule;

                SchedulerDelegate.saveSchedule(_this3.liveSyncObject.scheduleId, schedule).then(function () {
                    EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, "scheduleSaved");
                    _this3.callback(_this3.liveSyncObject);
                });
            });
        }
    });

    return new LiveSyncDialog();
});
