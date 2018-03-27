"use strict";

/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "moment", "moment-timezone", "handlebars", "bootstrap-dialog", "org/forgerock/commons/ui/common/util/UIUtils", "org/forgerock/openidm/ui/admin/scheduler/AbstractSchedulerView", "org/forgerock/openidm/ui/admin/delegates/SchedulerDelegate", "org/forgerock/openidm/ui/admin/util/SchedulerUtils", "org/forgerock/openidm/ui/admin/util/ClusterUtils", "org/forgerock/openidm/ui/admin/delegates/ClusterDelegate"], function ($, _, moment, momentTimezone, handlebars, BootstrapDialog, UIUtils, AbstractSchedulerView, SchedulerDelegate, SchedulerUtils, ClusterUtils, ClusterDelegate) {

    var EditSchedulerView;

    EditSchedulerView = AbstractSchedulerView.extend({
        template: "templates/admin/scheduler/EditSchedulerViewTemplate.html",
        isNew: false,
        events: _.extend({
            "click #nodeDetailsButton": "openNodeDetailDialog"
        }, AbstractSchedulerView.prototype.events),
        render: function render(args, callback) {
            var _this = this;

            this.data.schedulerId = args[0];

            SchedulerDelegate.specificSchedule(args[0]).then(function (schedule) {
                if (schedule.triggers.length > 0) {
                    _this.data.nodeId = schedule.triggers[0].nodeId;
                }
                if (schedule.invokeContext && schedule.invokeContext.scan) {
                    _this.data.scriptProperty = schedule.invokeContext.scan.taskState.started.split("/")[1] || "";
                }
                schedule = _.set(schedule, "invokeService", _this.serviceType(schedule.invokeService));
                schedule = _.omit(schedule, "triggers", "nextRunDate");
                _this.data.schedule = _.cloneDeep(schedule);
                _this.schedule = _.cloneDeep(schedule);
                _this.data.scheduleJSON = JSON.stringify(schedule, null, 4);
                _this.data.sheduleTypeData = SchedulerUtils.getScheduleTypeData(schedule);

                _this.renderForm(function () {
                    _this.disable(".save-cancel-btn");
                });
            });
        },
        /**
        * This function is called on node row click and opens up a BootstrapDialog which loads node details
        **/
        openNodeDetailDialog: function openNodeDetailDialog(e) {
            var nodeId = $(e.target).closest("a").attr("nodeId");

            e.preventDefault();

            ClusterDelegate.getIndividualNode(nodeId).then(function (node) {
                ClusterUtils.getDetailsForNodes([node]).then(function (nodes) {
                    //since we are passing in only one node we need node[0]
                    UIUtils.preloadPartial("partials/util/_clusterNodeDetail.html").then(function () {
                        var details = $(handlebars.compile("{{> util/_clusterNodeDetail }}")(node));

                        BootstrapDialog.show({
                            title: nodes[0].instanceId,
                            type: BootstrapDialog.TYPE_DEFAULT,
                            message: details,
                            size: BootstrapDialog.SIZE_WIDE,
                            buttons: [{
                                label: $.t('common.form.close'),
                                id: "clusterNodeDetailDialogCloseBtn",
                                action: function action(dialogRef) {
                                    dialogRef.close();
                                }
                            }]
                        });
                    });
                });
            });
        }

    });

    return new EditSchedulerView();
});
