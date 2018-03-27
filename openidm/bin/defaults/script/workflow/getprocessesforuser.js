/*
 * Copyright 2012-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

if (request.method !== "read") {
    throw {
        "code" : 403,
        "message" : "Access denied"
    };
}

(function () {
    var
    containsRole = function(object, items) {
        var i;
        for (i = 0; i < items.length; i++) {
            if (items[i] !== null && object !== null && items[i] === object) {
                return true;
            }
        }
        return false;
    },

    isProcessAvailableForUser = function(processAccessPolicies, processDefinition, userRoles) {
        var i,
            props,
            property,
            matches,
            requiresRole;

        for (i = 0; i < processAccessPolicies.length; i++) {
            props =  processAccessPolicies[i].propertiesCheck;
            property = props.property;
            matches = props.matches;
            requiresRole = props.requiresRole;

            if (processDefinition[property].match(matches)) {
                if (containsRole(requiresRole, userRoles)) {
                    return true;
                }
            }
        }
        return false;
    },

    getProcessesAvailableForUser = function(processDefinitions, userRoles) {
        var processesAvailableToUser = [],
            processAccessPolicies = openidm.read("config/process/access").workflowAccess,
            processDefinition,
            i;

        for (i = 0; i < processDefinitions.length; i++) {
            processDefinition = processDefinitions[i];
            if (isProcessAvailableForUser(processAccessPolicies, processDefinition, userRoles)) {
                processesAvailableToUser.push(processDefinition);
            }
        }
        return { "processes": processesAvailableToUser.sort(function (a,b) {
                return a.name > b.name ? 1 : -1;
            })
        };
    },
    processDefinitions = openidm.query("workflow/processdefinition", {
        "_queryId": "query-all-ids"
    }).result;

    return getProcessesAvailableForUser(processDefinitions, context.security.authorization.roles);

} ());
