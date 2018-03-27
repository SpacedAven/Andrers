"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/openidm/ui/admin/mapping/util/MappingScriptsView"], function ($, _, MappingScriptsView) {
    var ReconciliationScriptView = MappingScriptsView.extend({
        element: "#reconQueryView",
        noBaseTemplate: true,
        events: {
            "click .addScript": "addScript",
            "click .saveScripts": "saveScripts"
        },
        model: {
            scripts: ["result"],
            scriptEditors: {},
            successMessage: "triggeredByReconSaveSuccess"
        },

        render: function render() {
            this.parentRender(function () {
                this.init();

                //Needs to be out of scope since this dom element isn't in the $el and we need access to the script widget
                $("#reconQueryViewBody").on("shown.bs.collapse", _.bind(function () {
                    this.model.scriptEditors.result.refresh();
                }, this));
            });
        }
    });

    return new ReconciliationScriptView();
});
