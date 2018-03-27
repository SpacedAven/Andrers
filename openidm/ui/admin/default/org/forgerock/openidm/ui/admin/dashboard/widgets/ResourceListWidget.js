"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "bootstrap", "org/forgerock/openidm/ui/common/dashboard/widgets/AbstractWidget", "org/forgerock/openidm/ui/admin/delegates/SyncDelegate", "org/forgerock/openidm/ui/admin/delegates/ConnectorDelegate", "org/forgerock/openidm/ui/common/delegates/ConfigDelegate", "org/forgerock/openidm/ui/admin/util/ConnectorUtils"], function ($, _, bootstrap, AbstractWidget, SyncDelegate, ConnectorDelegate, ConfigDelegate, ConnectorUtils) {
    var widgetInstance = {},
        Widget = AbstractWidget.extend({
        template: "templates/admin/dashboard/widgets/ResourceListWidgetTemplate.html",

        widgetRender: function widgetRender(args, callback) {
            var tempIconClass;

            $.when(SyncDelegate.mappingDetails(), ConnectorDelegate.currentConnectors(), ConfigDelegate.readEntity("managed")).then(_.bind(function (sync, connectors, managedObjects) {
                _.each(connectors, _.bind(function (connector) {
                    tempIconClass = ConnectorUtils.getIcon(connector.connectorRef.connectorName);
                    connector.iconClass = tempIconClass.iconClass;
                    connector.iconSrc = tempIconClass.src;
                }, this));

                sync.mappings = _.sortBy(_.sortBy(sync.mappings, 'name'));
                this.data.mappings = sync.mappings.slice(0, 4);

                connectors = _.sortBy(_.sortBy(connectors, 'displayName'));
                this.data.connectors = connectors.slice(0, 4);

                managedObjects.objects = _.sortBy(_.sortBy(managedObjects.objects, 'name'));
                this.data.managedObjects = managedObjects.objects.slice(0, 4);

                this.parentRender(_.bind(function () {
                    if (callback) {
                        callback(this);
                    }
                }, this));
            }, this));
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
