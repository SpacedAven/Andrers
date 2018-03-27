"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/openidm/ui/admin/util/AdminAbstractView", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/openidm/ui/common/delegates/ConfigDelegate", "org/forgerock/openidm/ui/common/dashboard/widgets/MemoryUsageWidget", "org/forgerock/openidm/ui/common/dashboard/widgets/CPUUsageWidget", "org/forgerock/openidm/ui/common/dashboard/widgets/FullHealthWidget", "org/forgerock/openidm/ui/admin/dashboard/widgets/MappingReconResultsWidget", "org/forgerock/openidm/ui/admin/dashboard/widgets/ResourceListWidget", "org/forgerock/openidm/ui/common/dashboard/widgets/QuickStartWidget", "org/forgerock/openidm/ui/admin/dashboard/widgets/FrameWidget", "org/forgerock/openidm/ui/admin/dashboard/widgets/RelationshipWidget", "org/forgerock/openidm/ui/admin/dashboard/widgets/ClusterStatusWidget", "org/forgerock/openidm/ui/admin/dashboard/widgets/AuditDataOverTimeWidget", "org/forgerock/openidm/ui/admin/dashboard/widgets/ManagedObjectsWidget", "org/forgerock/openidm/ui/admin/dashboard/widgets/SocialRegistrationOverTimeWidget", "org/forgerock/openidm/ui/admin/dashboard/widgets/SocialLoginCountWidget", "org/forgerock/openidm/ui/admin/dashboard/widgets/SocialRegistrationCountWidget", "org/forgerock/openidm/ui/admin/dashboard/widgets/MetricsWidget"], function ($, _, AdminAbstractView, eventManager, constants, conf, ConfigDelegate, MemoryUsageWidget, CPUUsageWidget, FullHealthWidget, MappingReconResultsWidget, ResourceListWidget, QuickStartWidget, FrameWidget, RelationshipWidget, ClusterStatusWidget, AuditDataOverTimeWidget, ManagedObjectsWidget, SocialRegistrationOverTimeWidget, SocialLoginCountWidget, SocialRegistrationCountWidget, MetricsWidget) {

    var dwlInstance = {},
        widgetList = {
        lifeCycleMemoryHeap: {
            name: $.t("dashboard.memoryUsageHeap"),
            widget: MemoryUsageWidget,
            desc: $.t("dashboard.widgetDescriptions.lifeCycleMemoryHeap"),
            defaultSize: "small"
        },
        lifeCycleMemoryNonHeap: {
            name: $.t("dashboard.memoryUsageNonHeap"),
            widget: MemoryUsageWidget,
            desc: $.t("dashboard.widgetDescriptions.lifeCycleMemoryNonHeap"),
            defaultSize: "small"
        },
        systemHealthFull: {
            name: $.t("dashboard.systemHealth"),
            widget: FullHealthWidget,
            desc: $.t("dashboard.widgetDescriptions.systemHealthFull"),
            defaultSize: "large"
        },
        cpuUsage: {
            name: $.t("dashboard.cpuUsage"),
            widget: CPUUsageWidget,
            desc: $.t("dashboard.widgetDescriptions.cpuUsage"),
            defaultSize: "small"
        },
        lastRecon: {
            name: $.t("dashboard.lastReconciliation"),
            widget: MappingReconResultsWidget,
            desc: $.t("dashboard.widgetDescriptions.lastRecon"),
            defaultSize: "large"
        },
        resourceList: {
            name: $.t("dashboard.resources"),
            widget: ResourceListWidget,
            desc: $.t("dashboard.widgetDescriptions.resourceList"),
            defaultSize: "large"
        },
        quickStart: {
            name: $.t("dashboard.quickStart.quickStartTitle"),
            widget: QuickStartWidget,
            desc: $.t("dashboard.widgetDescriptions.quickStart"),
            defaultSize: "large"
        },
        frame: {
            name: $.t("dashboard.frameWidget.frameWidgetTitle"),
            widget: FrameWidget,
            desc: $.t("dashboard.widgetDescriptions.frame"),
            defaultSize: "large"
        },
        relationship: {
            name: $.t("dashboard.relationshipWidget.relationshipTitle"),
            widget: RelationshipWidget,
            desc: $.t("dashboard.widgetDescriptions.relationship"),
            defaultSize: "large"
        },
        clusterStatus: {
            name: $.t("dashboard.clusterStatusWidget.clusterStatusTitle"),
            widget: ClusterStatusWidget,
            desc: $.t("dashboard.widgetDescriptions.clusterStatus"),
            defaultSize: "large"
        },
        audit: {
            name: $.t("dashboard.auditData.widgetTitle"),
            widget: AuditDataOverTimeWidget,
            desc: $.t("dashboard.widgetDescriptions.auditData"),
            defaultSize: "large",
            defaults: {
                minRange: "#b0d4cd",
                maxRange: "#24423c",
                legendRange: {
                    week: [10, 30, 90, 270, 810],
                    month: [500, 2500, 5000],
                    year: [10000, 40000, 100000, 250000]
                }
            }
        },
        socialLogin: {
            name: $.t("dashboard.socialDetailsWidget.dailyLogin"),
            widget: SocialLoginCountWidget,
            desc: $.t("dashboard.widgetDescriptions.dailyLogin"),
            defaultSize: "small"
        },
        socialRegistration: {
            name: $.t("dashboard.socialDetailsWidget.dailyRegistration"),
            widget: SocialRegistrationCountWidget,
            desc: $.t("dashboard.widgetDescriptions.dailyRegistration"),
            defaultSize: "small"
        },
        socialRegistrationOverTime: {
            name: $.t("dashboard.socialRegistrationOverTime.socialRegistrationOverTimeTitle"),
            widget: SocialRegistrationOverTimeWidget,
            desc: $.t("dashboard.widgetDescriptions.socialRegistrationOverTime"),
            defaultSize: "large"
        },
        ManagedObjects: {
            name: $.t("dashboard.managedObjectsWidget.managedObjectsTitle"),
            widget: ManagedObjectsWidget,
            desc: $.t("dashboard.widgetDescriptions.managedObjects"),
            defaultSize: "large"
        }
    },
        DashboardWidgetLoader = AdminAbstractView.extend({
        template: "templates/dashboard/DashboardWidgetLoaderTemplate.html",
        noBaseTemplate: true,
        model: {},
        data: {},

        render: function render(args, callback) {
            this.element = args.element;

            this.data.widgetType = args.widget.type;
            this.data.widget = widgetList[args.widget.type];

            this.parentRender(_.bind(function () {
                args.element = this.$el.find(".widget");
                args.title = this.data.widget.name;
                args.showConfigButton = true;

                this.model.widget = widgetList[this.data.widgetType].widget.generateWidget(args, callback);
            }, this));
        }
    });

    dwlInstance.generateWidget = function (loadingObject, callback) {
        var widget = {};

        $.extend(true, widget, new DashboardWidgetLoader());

        widget.render(loadingObject, callback);

        return widget;
    };

    dwlInstance.getWidgetList = function () {
        return ConfigDelegate.readEntity("metrics").then(function (response) {
            if (response.enabled) {
                widgetList.Metrics = {
                    name: $.t("dashboard.metricsWidget.metricsTitle"),
                    widget: MetricsWidget,
                    desc: $.t("dashboard.widgetDescriptions.metrics"),
                    defaultSize: "large"
                };
            }

            return widgetList;
        });
    };

    return dwlInstance;
});
