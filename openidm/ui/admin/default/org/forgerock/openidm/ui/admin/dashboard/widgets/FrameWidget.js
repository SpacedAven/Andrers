"use strict";

/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "bootstrap", "org/forgerock/openidm/ui/common/dashboard/widgets/AbstractWidget"], function ($, _, bootstrap, AbstractWidget) {
    var widgetInstance = {},
        Widget = AbstractWidget.extend({
        template: "templates/admin/dashboard/widgets/FrameWidgetTemplate.html",
        model: {
            "overrideTemplate": "dashboard/widget/_frameConfig"
        },

        widgetRender: function widgetRender(args, callback) {
            this.data.height = args.widget.height;
            this.data.width = args.widget.width;
            this.data.frameUrl = args.widget.frameUrl;

            this.partials.push("partials/dashboard/widget/_frameConfig.html");

            this.parentRender(_.bind(function () {
                this.$el.parent().find(".widget-section-title .widget-title").text(args.widget.title);

                if (callback) {
                    callback(this);
                }
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
