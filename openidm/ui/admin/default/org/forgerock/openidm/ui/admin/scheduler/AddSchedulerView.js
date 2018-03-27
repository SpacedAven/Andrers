"use strict";

/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["lodash", "moment", "moment-timezone", "org/forgerock/openidm/ui/admin/scheduler/AbstractSchedulerView"], function (_, moment, momentTimezone, AbstractSchedulerView) {

    var AddSchedulerView;

    AddSchedulerView = AbstractSchedulerView.extend({
        template: "templates/admin/scheduler/AddSchedulerViewTemplate.html",
        isNew: true,
        render: function render(args, callback) {
            this.data.schedule = {
                "schedule": "0 0 * * * ?",
                "enabled": false,
                "persisted": true,
                "type": "cron",
                "misfirePolicy": "fireAndProceed",
                "invokeService": "sync",
                "invokeLogLevel": "info",
                "timeZone": null,
                "startTime": null,
                "endTime": null,
                "concurrentExecution": false,
                "invokeContext": {
                    "action": "reconcile"
                }
            };

            if (this.data.scriptProperty) {
                delete this.data.scriptProperty;
            }

            this.schedule = _.cloneDeep(this.data.schedule);
            _.bindAll(this);

            this.renderForm();
        },

        resetSchedule: _.noop
    });

    return new AddSchedulerView();
});
