"use strict";

/*
 * Copyright 2014-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["underscore", "org/forgerock/openidm/ui/admin/mapping/util/MappingAdminAbstractView", "org/forgerock/openidm/ui/admin/mapping/scheduling/SchedulerView", "org/forgerock/openidm/ui/admin/mapping/scheduling/LiveSyncView", "org/forgerock/openidm/ui/admin/delegates/SchedulerDelegate"], function (_, MappingAdminAbstractView, SchedulerView, LiveSyncView, SchedulerDelegate) {

    var ScheduleView = MappingAdminAbstractView.extend({
        template: "templates/admin/mapping/ScheduleTemplate.html",
        element: "#mappingContent",
        noBaseTemplate: true,

        render: function render(args, callback) {

            this.parentRender(_.bind(function () {

                SchedulerDelegate.availableSchedules().then(_.bind(function (schedules) {
                    SchedulerView.render({ "schedules": schedules });
                    LiveSyncView.render({ "schedules": schedules });

                    if (callback) {
                        callback();
                    }
                }, this));
            }, this));
        }
    });

    return new ScheduleView();
});
