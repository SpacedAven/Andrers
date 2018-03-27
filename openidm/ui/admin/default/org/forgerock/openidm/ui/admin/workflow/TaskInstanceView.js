"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "handlebars", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/util/UIUtils", "org/forgerock/commons/ui/common/main/AbstractModel", "org/forgerock/openidm/ui/admin/util/WorkflowUtils", "org/forgerock/commons/ui/common/util/DateUtil"], function ($, _, Handlebars, AbstractView, eventManager, Constants, UIUtils, AbstractModel, WorkflowUtils, DateUtil) {
    var TaskModel = AbstractModel.extend({ url: "/" + Constants.context + "/workflow/taskinstance" }),
        ProcessModel = AbstractModel.extend({ url: "/" + Constants.context + "/workflow/processdefinition" }),
        UserModel = AbstractModel.extend({ url: "/" + Constants.context + "/managed/user" }),
        TaskInstanceView = AbstractView.extend({
        template: "templates/admin/workflow/TaskInstanceViewTemplate.html",

        events: {
            "click .assignTask": "showCandidateUserSelection"
        },
        render: function render(args, callback) {
            var process = new ProcessModel(),
                assignee = new UserModel();

            this.data = {
                showForm: false,
                canAssign: false
            };

            this.model = new TaskModel();

            this.model.id = args[0];

            this.model.fetch().then(_.bind(function () {
                var fetchArr = [];

                this.data.task = this.model.toJSON();

                if (this.data.task.assignee) {
                    assignee.id = this.data.task.assignee;
                    fetchArr.push(assignee.fetch());
                }

                process.id = this.data.task.processDefinitionId;
                fetchArr.push(process.fetch());

                $.when.apply($, fetchArr).done(_.bind(function () {
                    var formTemplate = _.filter(this.data.task.formProperties, function (p) {
                        return _.has(p, "_formGenerationTemplate");
                    });

                    this.data.process = process.toJSON();
                    this.data.assignee = assignee.toJSON();

                    if (formTemplate.length) {
                        this.data.showForm = true;

                        this.data.taskForm = Handlebars.compile(formTemplate[0]._formGenerationTemplate)(this.data.task);
                    }

                    if (!this.data.showForm && this.data.process.formGenerationTemplate) {
                        this.data.showForm = true;

                        this.data.taskForm = Handlebars.compile(this.data.process.formGenerationTemplate)(this.data.task);
                    }

                    this.parentRender(_.bind(function () {

                        if (this.data.showForm) {
                            this.populateTaskForm();
                        }

                        if (callback) {
                            callback();
                        }
                    }, this));
                }, this));
            }, this));
        },
        showCandidateUserSelection: function showCandidateUserSelection(e) {
            if (e) {
                e.preventDefault();
            }

            WorkflowUtils.showCandidateUserSelection(this);
        },
        populateTaskForm: function populateTaskForm() {
            /*
             * sometimes form input fields have no replacement tokens like:
             *    <input type="text" value="" name="userName"/>
             * in this case form values will not be filled in when doing Handlebars.compile(html)(data)
             *
             * if there are replacement tokens like:
             *    <input type="text" value="{{variables.userName}}" name="userName"/>
             * it will work fine
             *
             * this loop is a fail safe so all forms are filled in with the task's variable values
             */
            _.each(_.keys(this.data.task.variables), _.bind(function (key) {
                this.$el.find("[name=" + key + "]").val(this.data.task.variables[key]);
            }, this));

            this.$el.find("#taskForm :input").prop("disabled", true);

            this.$el.find("#taskForm .error").hide();
        }
    });

    return new TaskInstanceView();
});
