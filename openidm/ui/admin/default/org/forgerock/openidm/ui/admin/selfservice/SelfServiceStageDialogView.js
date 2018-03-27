"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "bootstrap", "handlebars", "form2js", "org/forgerock/openidm/ui/admin/selfservice/AbstractSelfServiceView", "org/forgerock/openidm/ui/admin/selfservice/GenericSelfServiceStageView", "org/forgerock/commons/ui/common/util/UIUtils", "org/forgerock/openidm/ui/admin/util/AdminUtils", "bootstrap-dialog"], function ($, _, boostrap, handlebars, form2js, AbstractSelfServiceView, GenericSelfServiceStageView, UiUtils, AdminUtils, BootstrapDialog) {

    var SelfServiceStageDialogView = AbstractSelfServiceView.extend({
        element: "#dialogs",
        noBaseTemplate: true,
        model: {},
        render: function render(args) {
            var _this = this;

            var view,
                viewPromise = $.Deferred(),
                archievedData = _.clone(args.data);

            require(["org/forgerock/openidm/ui/admin/selfservice/" + args.type], function (result) {
                viewPromise.resolve(result);
            }, function () {
                viewPromise.reject(GenericSelfServiceStageView);
            });

            $.when(viewPromise).always(function (foundView) {
                view = foundView;
                var currentDialog = $('<div id="SelfServiceStageDialog"></div>');
                _this.setElement(currentDialog);
                $("#dialogs").append(currentDialog);

                _this.parentRender(function () {
                    _this.dialog = BootstrapDialog.show({
                        title: $.t("templates.selfservice.user." + args.type + "Title"),
                        type: BootstrapDialog.TYPE_DEFAULT,
                        size: BootstrapDialog.SIZE_WIDE,
                        message: '<div id="SelfServiceStageDialog"></div>',
                        onshown: function onshown(dialogRef) {
                            view.render(args, dialogRef);
                        },
                        buttons: [{
                            label: $.t("common.form.close"),
                            action: function action(dialogRef) {
                                dialogRef.close();
                            }
                        }, {
                            label: $.t("common.form.save"),
                            cssClass: "btn-primary",
                            id: "saveUserConfig",
                            action: function action(dialogRef) {
                                if (this.hasClass("disabled")) {
                                    return false;
                                } else {
                                    args.saveCallback(view.getData(), archievedData);
                                    dialogRef.close();
                                }
                            }
                        }]
                    });
                });
            });
        }
    });

    return new SelfServiceStageDialogView();
});
