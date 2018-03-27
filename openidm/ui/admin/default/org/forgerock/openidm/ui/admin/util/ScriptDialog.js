"use strict";

/*
 * Copyright 2014-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/util/UIUtils", "org/forgerock/commons/ui/common/main/ValidatorsManager", "org/forgerock/openidm/ui/admin/util/InlineScriptEditor", "bootstrap-dialog"], function ($, _, AbstractView, conf, uiUtils, validatorsManager, InlineScriptEditor, BootstrapDialog) {
    var ScriptDialog = AbstractView.extend({
        element: "#dialogs",
        events: {},
        data: {},

        render: function render(args, callback) {
            var _this = this;

            this.currentDialog = $('<div id="scriptManagerDialogForm"></div>');

            $('#dialogs').append(this.currentDialog);

            this.setElement(this.currentDialog);

            BootstrapDialog.show({
                title: args.scriptDialogTitle || "Script Manager",
                type: BootstrapDialog.TYPE_DEFAULT,
                message: this.currentDialog,
                size: BootstrapDialog.SIZE_WIDE,
                cssClass: "script-large-dialog",
                onshown: function onshown(dialogRef) {
                    args.element = _this.$el;
                    if (!args.disableValidation) {
                        args.validationCallback = _.bind(function (result) {
                            if (result) {
                                $("#scriptDialogOkay").prop("disabled", false);
                            } else {
                                $("#scriptDialogOkay").prop("disabled", true);
                            }
                        }, _this);
                    }

                    _this.scriptEditor = InlineScriptEditor.generateScriptEditor(args, _.bind(function () {
                        if (callback) {
                            callback();
                        }
                    }, _this));
                },
                buttons: [{
                    label: $.t("common.form.cancel"),
                    id: "scriptDialogCancel",
                    action: function action(dialogRef) {
                        dialogRef.close();
                    }
                }, {
                    label: $.t('common.form.save'),
                    id: "scriptDialogOkay",
                    cssClass: "btn-primary",
                    action: _.bind(function (dialogRef) {
                        if (args.saveCallback) {
                            args.saveCallback(this.generateScript());
                        }

                        dialogRef.close();
                    }, _this)
                }]
            });
        },

        getInlineEditor: function getInlineEditor() {
            return this.scriptEditor.getInlineEditor();
        },

        generateScript: function generateScript() {
            return this.scriptEditor.generateScript();
        }
    });

    return new ScriptDialog();
});
