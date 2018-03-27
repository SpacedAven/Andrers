"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "handlebars", "org/forgerock/openidm/ui/admin/delegates/ClusterDelegate", "org/forgerock/openidm/ui/admin/delegates/SchedulerDelegate", "org/forgerock/openidm/ui/admin/util/SchedulerUtils", "bootstrap-dialog", "moment", "org/forgerock/commons/ui/common/util/UIUtils"], function ($, _, handlebars, ClusterDelegate, SchedulerDelegate, SchedulerUtils, BootstrapDialog, moment, UIUtils) {

    var obj = {};

    obj.getClusterData = function () {
        var _this = this;

        //get the info for all the nodes in the cluster
        return ClusterDelegate.getNodes().then(function (cluster) {
            return _this.getDetailsForNodes(cluster.results);
        });
    };
    /**
     * This function takes a list of nodes, looks for any jobs that may be running
     * on any of those nodes, matches nodes with jobs, and returns an array of node objects
     * with a "runningJobs" array attached
     *
     * @param {array} clusterNodes - an array of node objects to gather details on
     * @returns {promise}
     **/
    obj.getDetailsForNodes = function (clusterNodes) {
        //pluck out the nodeIds into an array
        var nodeIds = _.map(clusterNodes, "instanceId");
        //get all the scheduler/job triggers that have been picked up by any of these nodes
        //and return an array of node objects with info about any currently running jobs on that node
        return SchedulerDelegate.getSchedulerTriggersForAllNodes().then(function (jobs) {
            //loop over each clusterNode
            return _.map(clusterNodes, function (node) {
                var runningJobs = [];
                //loop over all jobs, match up the ones for this node,
                //and add them to the runningJobs array
                _.each(jobs, function (job) {
                    if (job.triggers[0] && job.triggers[0].nodeId === node.instanceId) {
                        runningJobs.push({
                            job: job,
                            link: "scheduler/edit/" + job._id + "/",
                            typeData: SchedulerUtils.getScheduleTypeData(job)
                        });
                    }
                });
                //convert startup and shutdown into readable dates
                node.startup = moment(node.startup).format('MMMM Do YYYY, h:mm:ss a');
                if (node.shutdown) {
                    node.shutdown = moment(node.shutdown).format('MMMM Do YYYY, h:mm:ss a');
                }
                //add the runningJobs and jobCount to the node object
                return _.extend(node, {
                    runningJobs: runningJobs,
                    jobCount: runningJobs.length
                });
            });
        });
    };

    return obj;
});
