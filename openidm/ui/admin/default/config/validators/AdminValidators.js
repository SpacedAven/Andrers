"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/commons/ui/common/util/Constants"], function ($, _, Constants) {
    var obj = {
        "changed": {
            "name": "Changed field",
            "dependencies": [],
            "validator": function validator(el, input, callback) {
                callback();
            }
        },
        "requiredURL": {
            "name": "URL required",
            "dependencies": [],
            "validator": function validator(el, input, callback) {
                var v = $(input).val();
                // This regex verifies there are no spaces in the context and that only valid URL characters are included.
                if (v.length > 0 && !/^[a-zA-Z0-9\-\.\_\~\:\/\?\#\[\]\@\!\$\&\'\(\)\*\+\,\;\=]+$/.test(v)) {
                    callback(["Not a valid URL"]);
                    return;
                }

                if (v === "/" + Constants.context || v === "/admin" || v === "/system") {
                    callback(["The URL cannot be one of the following reserved names: '" + Constants.context + "', 'admin' or 'system'."]);
                    return;
                }

                callback();
            }
        },
        "certificate": {
            "name": "Valid Certificate String",
            "dependencies": [],
            "validator": function validator(el, input, callback) {

                var v = $(input).val();
                if (v.length && !v.match(/\-\-\-\-\-BEGIN CERTIFICATE\-\-\-\-\-\n[^\-]*\n\-\-\-\-\-END CERTIFICATE\-\-\-\-\-\s*$/)) {
                    callback(["Invalid Certificate"]);
                    return;
                }

                callback();
            }
        },
        "bothRequired": {
            "name": "Two Required Fields",
            "dependencies": [],
            "validator": function validator(el, input, callback) {
                var inputs = input.parent().parent().find("input"),
                    secondInput;

                if (inputs.length !== 2) {
                    callback([$.t("templates.scriptEditor.bothRequired")]);
                    return;
                }

                if (!$(inputs[0]).val() || $(inputs[0]).val() === "") {
                    callback([$.t("templates.scriptEditor.bothRequired")]);
                    return;
                }

                if (!$(inputs[1]).val() || $(inputs[1]).val() === "") {
                    callback([$.t("templates.scriptEditor.bothRequired")]);
                    return;
                }

                secondInput = inputs.not(input);

                if (secondInput.hasClass("field-error")) {
                    secondInput.trigger("blur");
                }

                secondInput.attr("data-validation-status", "ok");

                callback();
            }
        },
        "spaceCheck": {
            "name": "Whitespace validator",
            "dependencies": [],
            "validator": function validator(el, input, callback) {
                var v = input.val();
                if (!v || v === "" || v.indexOf(' ') !== -1) {
                    callback([$.t("common.form.validation.spaceNotAllowed")]);
                    return;
                }

                callback();
            }
        },
        "uniqueShortList": {
            "name": "Unique value amongst a short list of values loaded in the client",
            "dependencies": [],
            "validator": function validator(el, input, callback) {
                var v = input.val().toUpperCase().trim(),
                    usedNames = JSON.parse($(input).attr("data-unique-list").toUpperCase());

                if (v.length > 0 && !_.contains(usedNames, v)) {
                    callback();
                } else {
                    callback([$.t("common.form.validation.unique")]);
                }
            }
        },
        "restrictedCharacters": {
            "name": "Cannot contain any of the following characters ;",
            "dependencies": [],
            "validator": function validator(el, input, callback) {
                var v = input.val(),
                    pattern = input.attr("restrictedCharacterPattern") || "^[a-z0-9]+$",
                    description = input.attr("restrictedCharacterDescription") || "Non-alphanumeric",
                    characterCheck = new RegExp(pattern, 'i').test(v);

                if (characterCheck) {
                    callback();
                } else {
                    callback($.t("common.form.validation.CANNOT_CONTAIN_CHARACTERS", { "forbiddenChars": description }));
                }
            }
        },
        "isPositiveNumber": {
            "name": "The input value must a number greater than or equal to zero",
            "dependencies": [],
            "validator": function validator(el, input, callback) {
                var val = Number(input.val());

                if (input.val().length > 0 && !_.isNaN(val) && val >= 0) {
                    callback();
                } else {
                    callback($.t("common.form.validation.IS_NUMBER"));
                }
            }
        },
        "validEmailAddressFormat": {
            "name": "The input value must be valid email address format",
            "dependencies": [],
            "validator": function validator(el, input, callback) {
                var val = input.val(),
                    emailFormatCheck = /.+@.+\..+/i.test(val);

                if (emailFormatCheck) {
                    callback();
                } else {
                    callback($.t("common.form.validation.VALID_EMAIL_ADDRESS_FORMAT"));
                }
            }
        }
    };

    return obj;
});
