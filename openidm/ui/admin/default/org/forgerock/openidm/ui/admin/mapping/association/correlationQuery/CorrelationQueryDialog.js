"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/util/UIUtils", "org/forgerock/openidm/ui/admin/mapping/association/correlationQuery/CorrelationQueryBuilderView", "bootstrap-dialog"], function ($, _, AbstractView, conf, uiUtils, CorrelationQueryBuilderView, BootstrapDialog) {

    var CorrelationQueryDialog = AbstractView.extend({
        template: "templates/admin/mapping/association/correlationQuery/CorrelationQueryDialogTemplate.html",
        el: "#dialogs",
        events: {},
        model: {},

        render: function render(args, callback) {
            var _this = this;

            this.model.saveCallback = callback;
            this.model.currentDialog = $('<div id="CorrelationQueryDialog"></div>');
            this.setElement(this.model.currentDialog);
            $('#dialogs').append(this.model.currentDialog);

            BootstrapDialog.show({
                title: $.t("templates.correlation.dialogTitle"),
                size: BootstrapDialog.SIZE_WIDE,
                type: BootstrapDialog.TYPE_DEFAULT,
                message: this.model.currentDialog,
                onshown: function onshown(dialogRef) {
                    uiUtils.renderTemplate(_this.template, _this.$el, _.extend({}, conf.globalData, this.data), _.bind(function () {
                        args.validation = _.bind(function (valid) {
                            if (valid) {
                                dialogRef.getButton('submitQueryDialog').enable();
                                this.$el.parent().find("#correlationQueryWarning").hide();
                            } else {
                                dialogRef.getButton('submitQueryDialog').disable();
                                this.$el.parent().find("#correlationQueryWarning").show();
                            }
                        }, this);

                        CorrelationQueryBuilderView.render(args);

                        var copy = this.$el.find("#correlationQueryWarning").clone();
                        this.$el.find("#correlationQueryWarning").remove();
                        this.$el.parent().find(".ui-dialog-buttonpane").prepend(copy);
                    }, _this), "replace");

                    dialogRef.getButton('submitQueryDialog').disable();
                },
                buttons: [{
                    label: $.t("common.form.cancel"),
                    action: function action(dialogRef) {
                        dialogRef.close();
                    }
                }, {
                    label: $.t("common.form.submit"),
                    id: "submitQueryDialog",
                    cssClass: "btn-primary",
                    action: function action(dialogRef) {
                        if (_this.model.saveCallback) {
                            _this.model.saveCallback(CorrelationQueryBuilderView.getQuery());
                        }

                        dialogRef.close();
                    }
                }]
            });
        }
    });

    return new CorrelationQueryDialog();
});
