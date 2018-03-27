"use strict";

/*
 * Copyright 2014-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["lodash", "jquery", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/AbstractDelegate"], function (_, $, Constants, AbstractDelegate) {

    var obj = new AbstractDelegate(Constants.host + "/" + Constants.context + "/scheduler/job");

    obj.availableSchedules = function () {
        return obj.serviceCall({
            url: "?_queryId=query-all-ids",
            type: "GET"
        });
    };

    obj.specificSchedule = function (scheduleId) {
        return obj.serviceCall({
            url: "/" + scheduleId,
            type: "GET"
        }).then(function (resp) {
            return resp;
        });
    };

    obj.saveSchedule = function (scheduleId, schedule) {
        return obj.serviceCall({
            url: "/" + scheduleId,
            type: "PUT",
            data: JSON.stringify(schedule)
        });
    };

    obj.deleteSchedule = function (scheduleId) {
        return obj.serviceCall({
            url: "/" + scheduleId,
            type: "DELETE"
        });
    };

    obj.addSchedule = function (schedule) {
        return obj.serviceCall({
            url: "?_action=create",
            type: "POST",
            data: JSON.stringify(schedule)
        });
    };

    obj.pauseJobs = function () {
        return obj.serviceCall({
            url: "?_action=pauseJobs",
            type: "POST"
        });
    };

    obj.resumeJobs = function () {
        return obj.serviceCall({
            url: "?_action=resumeJobs",
            type: "POST"
        });
    };

    obj.listCurrentlyExecutingJobs = function () {
        return obj.serviceCall({
            url: "?_action=listCurrentlyExecutingJobs",
            type: "POST"
        });
    };

    obj.getReconSchedulesByMappingName = function (mappingName) {
        return obj.serviceCall({
            url: "?_queryFilter=invokeContext/action/ eq 'reconcile' and invokeContext/mapping/ eq '" + mappingName + "'",
            type: "GET"
        }).then(function (response) {
            return response.result;
        });
    };

    obj.getLiveSyncSchedulesByConnectorName = function (connectorName) {
        return obj.serviceCall({
            url: "?_queryFilter=invokeContext/action/ eq 'liveSync'",
            type: "GET"
        }).then(function (response) {
            return _.filter(response.result, function (sched) {
                return sched.invokeContext.source.split("/")[1] === connectorName;
            });
        });
    };
    /**
    * @returns {promise} - an array of scheduler jobs that are currently running on all cluster nodes
    **/
    obj.getSchedulerTriggersForAllNodes = function (nodeIds) {
        return obj.serviceCall({
            url: "?_queryFilter=persisted eq true and triggers/0/nodeId pr and triggers/0/state gt 0",
            type: "GET",
            suppressSpinner: true
        }).then(function (response) {
            return response.result;
        }, function () {
            return;
        });
    };

    obj.validate = function (cronString) {
        return obj.serviceCall({
            url: "?_action=validateQuartzCronExpression",
            type: "POST",
            data: JSON.stringify({ "cronExpression": cronString })
        });
    };

    return obj;
});
