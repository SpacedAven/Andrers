"use strict";

/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "bootstrap", "org/forgerock/openidm/ui/common/dashboard/widgets/AbstractWidget", "org/forgerock/commons/ui/common/main/Router", "org/forgerock/openidm/ui/admin/util/ClusterUtils"], function ($, _, bootstrap, AbstractWidget, router, ClusterUtils) {
    var widgetInstance = {},
        Widget = AbstractWidget.extend({
        template: "templates/admin/dashboard/widgets/ClusterStatusWidgetTemplate.html",
        model: {
            "overrideTemplate": "dashboard/widget/_clusterStatusConfig",
            "defaultRefreshRate": 30000, //30 seconds
            "hasExpandedNodes": false
        },
        widgetRender: function widgetRender(args, callback) {
            var _this2 = this;

            //widgetRender will sometimes be called with no args
            if (args && args.widget) {
                this.data.refreshRate = args.widget.refreshRate;
            }

            //add to events and load settings partial
            this.events["click .refreshClusterData"] = "reloadWidget";
            this.events["click a.toggle-node-detail"] = "toggleNodeDetail";
            this.partials.push("partials/dashboard/widget/_clusterStatusConfig.html");
            this.partials.push("partials/util/_clusterNodeDetail.html");

            //set the startView to be used in conditional logic to make sure we are
            //still on the dashboard page
            this.startView = this.startView || router.currentRoute.view;

            //add the refresh button to the the ellipse under the "Settings" button
            this.data.menuItems = [{
                "icon": "fa-refresh",
                "menuClass": "refreshClusterData",
                "title": $.t("dashboard.clusterStatusWidget.refresh")
            }];

            ClusterUtils.getClusterData().then(function (cluster) {
                if (cluster) {
                    _this2.data.cluster = _.sortBy(cluster, function (o) {
                        o.showDetails = false;
                        //since we are mapping over all the nodes do a check to
                        //see if this instanceId is in the this.data.expandedNodes array
                        if (_this2.data.expandedNodes && _.contains(_this2.data.expandedNodes, o.instanceId)) {
                            //if so set the showDetail to true
                            o.showDetails = true;
                        }
                        return o.instanceId;
                    });
                }

                _this2.parentRender(function () {
                    if (!_this2.model.hasExpandedNodes) {
                        _this2.delayDataRefresh();
                    } else {
                        _this2.model.hasExpandedNodes = false;
                    }
                    if (callback) {
                        callback(_this2);
                    }
                });
            });
        },
        /**
        * This function sets a delayed refresh (checking first to make sure
        * we are still on the same page the timer originally started on)
        * to get the most recent status of the cluster.
        * The default value is set in this.model.defaultRefreshRate which is
        * used when there have been no override widget settings set
        */
        delayDataRefresh: function delayDataRefresh() {
            // have to set _this because "this" is bound to the window in delay()
            var _this = this;
            //check to make sure this function is called only when we are
            //on page where the "timer" was originally started
            if (this.startView === router.currentRoute.view) {
                _.delay(function () {
                    _this.widgetRender();
                }, this.data.refreshRate || this.model.defaultRefreshRate);
            }
        },
        reloadWidget: function reloadWidget(e) {
            if (e) {
                e.preventDefault();
            }

            this.widgetRender();
        },
        /**
        * This function is called on node row click and opens up a BootstrapDialog which loads node details
        **/
        toggleNodeDetail: function toggleNodeDetail(e) {
            var instanceId = $(e.target).closest("a").attr("instanceId"),
                parent = $(e.target).closest(".clusterNode_row");

            e.preventDefault();

            if (!this.data.expandedNodes) {
                this.data.expandedNodes = [instanceId];
            } else if (_.contains(this.data.expandedNodes, instanceId)) {
                this.data.expandedNodes = _.reject(this.data.expandedNodes, function (nodeId) {
                    return nodeId === instanceId;
                });
            } else {
                this.data.expandedNodes.push(instanceId);
            }

            this.model.hasExpandedNodes = true;

            this.reloadWidget();
        }
    });

    widgetInstance.generateWidget = function (loadingObject, callback) {
        var widget = {};

        $.extend(true, widget, new Widget());

        widget.render(loadingObject, callback);

        return widget;
    };

    return widgetInstance;
});
