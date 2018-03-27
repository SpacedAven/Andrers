/*
 * Copyright 2014-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

require.config({
    map: {
        "*" : {
            "Footer": "org/forgerock/openidm/ui/common/components/Footer",
            "ThemeManager": "org/forgerock/openidm/ui/common/util/ThemeManager",
            "LoginView": "org/forgerock/openidm/ui/common/login/LoginView",
            "LoginDialog": "org/forgerock/openidm/ui/common/login/LoginDialog",
            "NavigationFilter" : "org/forgerock/commons/ui/common/components/navigation/filters/RoleFilter",
            // TODO: Remove this when there are no longer any references to the "underscore" dependency
            "underscore": "lodash"
        }
    },
    paths: {
        i18next: "libs/i18next-1.7.3-min",
        backbone: "libs/backbone-1.1.2-min",
        "backbone.paginator": "libs/backbone.paginator.min-2.0.2-min",
        "backbone-relational": "libs/backbone-relational-0.9.0-min",
        "backgrid": "libs/backgrid.min-0.3.5-min",
        "backgrid-filter": "libs/backgrid-filter.min-0.3.5-min",
        "backgrid-paginator": "libs/backgrid-paginator.min-0.3.5-min",
        "backgrid-selectall": "libs/backgrid-select-all-0.3.5-min",
        lodash: "libs/lodash-3.10.1-min",
        js2form: "libs/js2form-2.0-769718a",
        form2js: "libs/form2js-2.0-769718a",
        spin: "libs/spin-2.0.1-min",
        jquery: "libs/jquery-2.1.1-min",
        cron: "libs/jquery-cron-f831f2",
        xdate: "libs/xdate-0.8-min",
        doTimeout: "libs/jquery.ba-dotimeout-1.0-min",
        handlebars: "libs/handlebars-4.0.5",
        "bootstrap-tabdrop": "libs/bootstrap-tabdrop-1.0",
        bootstrap: "libs/bootstrap-3.3.5-custom",
        "bootstrap-dialog": "libs/bootstrap-dialog-1.34.4-min",
        "bootstrap-datetimepicker": "libs/bootstrap-datetimepicker-4.14.30-min",
        placeholder: "libs/jquery.placeholder-2.0.8",
        selectize : "libs/selectize-0.12.1-min",
        d3 : "libs/d3-3.5.5-min",
        moment: "libs/moment-2.18.1-min",
        "moment-timezone": "libs/moment-timezone-with-data-0.5.4-min",
        jsonEditor: "libs/jsoneditor-0.7.9-min",
        "ldapjs-filter": "libs/ldapjs-filter-2253-min",
        faiconpicker: "libs/fontawesome-iconpicker-1.0.0-min",
        dimple : "libs/dimple-2.1.2-min",
        sinon : "libs/sinon-1.15.4",
        dragula : "libs/dragula-3.6.7-min",
        trumbowyg: "libs/trumbowyg-2.4.2-min",
        calHeatmap: "libs/cal-heatmap-3.6.2-min",
        cola: "libs/cola-3.3.3-min",
        stickyTableHeaders: "libs/jquery.stickytableheaders-0.1.19-min",
        owl: "libs/owl.carousel-2.2.1-custom"
    },

    shim: {
        underscore: {
            exports: "_"
        },
        backbone: {
            deps: ["underscore"],
            exports: "Backbone"
        },
        "backbone.paginator": {
            deps: ["backbone"]
        },
        "backgrid": {
            deps: ["jquery", "underscore", "backbone"],
            exports: "Backgrid"
        },
        "backgrid-filter": {
            deps: ["backgrid"]
        },
        "backgrid-paginator": {
            deps: ["backgrid", "backbone.paginator"]
        },
        "backgrid-selectall": {
            deps: ["backgrid"]
        },
        js2form: {
            exports: "js2form"
        },
        form2js: {
            exports: "form2js"
        },
        spin: {
            exports: "spin"
        },
        jsonEditor: {
            deps: ["handlebars"],
            init: function (Handlebars) {
                window.Handlebars = Handlebars;
                return this.JSONEditor;
            },
            exports: "JSONEditor"
        },
        cron: {
            deps: ["jquery"]
        },
        xdate: {
            exports: "xdate"
        },
        doTimeout: {
            deps: ["jquery"],
            exports: "doTimeout"
        },
        handlebars: {
            exports: "handlebars"
        },
        i18next: {
            deps: ["jquery", "handlebars"],
            exports: "i18n"
        },
        moment: {
            exports: "moment"
        },
        "moment-timezone": {
            deps: ["moment"],
            exports: "moment-timezone"
        },
        selectize: {
            deps: ["jquery"]
        },
        d3: {
            exports: "d3"
        },
        sinon: {
            exports: "sinon"
        },
        trumbowyg: {
            exports: "trumbowyg",
            deps: ["jquery"]
        },
        calHeatmap: {
            exports: "calHeatmap",
            deps: ["d3"]
        },
        cola: {
            exports: "cola"
        },
        dimple: {
            exports: "dimple",
            deps: ["d3"]
        },
        bootstrap: {
            deps: ["jquery"],
            init: function ($) {
                $.fn.popover.Constructor.DEFAULTS.trigger = 'hover focus';
                return this.bootstrap;
            }
        },
        placeholder: {
            deps: ["jquery"]
        },
        'bootstrap-dialog': {
            deps: ["jquery", "underscore","backbone", "bootstrap"]
        },
        'bootstrap-tabdrop': {
            deps: ["jquery", "bootstrap"]
        },
        stickyTableHeaders : {
            deps: ["jquery"]
        },
        owl : {
            deps: ["jquery"]
        }
    }
});

require([
    "jquery",
    "org/forgerock/commons/ui/common/util/Constants",
    "org/forgerock/commons/ui/common/main/EventManager",
    "jsonEditor",
    "trumbowyg",
    "org/forgerock/openidm/ui/common/util/JSONEditorSetupUtils",

    "org/forgerock/commons/ui/common/main",
    "org/forgerock/openidm/ui/common/main",
    "org/forgerock/openidm/ui/admin/main",
    "config/main",
    "underscore",
    "backbone",
    "handlebars",
    "i18next",
    "spin",
    "placeholder",
    "selectize"
], function(
    $,
    Constants,
    EventManager,
    JSONEditor,
    trumbowyg) {

    EventManager.sendEvent(Constants.EVENT_DEPENDENCIES_LOADED);

    JSONEditor.defaults.options.theme = 'bootstrap3';
    JSONEditor.defaults.options.iconlib = "fontawesome4";
    $.trumbowyg.svgPath = '/admin/img/trumbowyg-2.4.2.svg';
});
