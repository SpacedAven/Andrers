/*
 * Copyright 2012-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

if (request.method !== "action") {
    throw {
        "code" : 403,
        "message" : "Access denied"
    };
}

if (!request.additionalParameters || !request.additionalParameters.taskId) {
    throw "Required param: taskId";
}

(function () {
    var getUserById = function(userId) {
        var user = openidm.read("managed/user/"+userId);
        if (!user) {
            user = openidm.read("repo/internal/user/"+userId);
        }
        return user;
    },
    getUserByName = function(userName) {
        var params = {
                "_queryId": "for-userName",
                "uid": userName
            },
            result = openidm.query("managed/user", params),
            user = false;

        if (result.result && result.result.length === 1) {
            user = result.result[0];
        }
        if (!user) {
            user = openidm.read("repo/internal/user/"+userName);
        }
        return user;
    },
    getDisplayableOf = function(user) {
        if (user.givenName || user.familyName) {
            return user.givenName + " " + user.familyName;
        } else {
            return user.userName ? user.userName : user._id;
        }
    },
    taskDefinitionQueryParams,
    taskDefinition,
    taskCandidateUserArray,
    candidateUserTaskDefinition,
    taskCandidateGroupArray,
    candidateGroupTaskDefinition,
    i,j,
    usersToAdd = {},
    availableUsersToAssign,
    candidateUsers = [],
    candidateUser,
    candidateGroups = [],
    candidateGroup,
    params,
    result,
    user,
    username,
    assigneeUserName,
    task = openidm.read("workflow/taskinstance/" + request.additionalParameters.taskId);

    if (!task) {
        throw "Task Not Found";
    }

    taskDefinitionQueryParams = {
        "_queryId": "query-taskdefinition",
        "processDefinitionId": task.processDefinitionId,
        "taskDefinitionKey": task.taskDefinitionKey
    };
    taskDefinition = openidm.query("workflow/taskdefinition", taskDefinitionQueryParams);

    taskCandidateUserArray = taskDefinition.taskCandidateUser.toArray();
    for (i = 0; i < taskCandidateUserArray.length; i++) {
        candidateUserTaskDefinition = taskCandidateUserArray[i];
        candidateUsers.push(candidateUserTaskDefinition.expressionText);
    }

    taskCandidateGroupArray = taskDefinition.taskCandidateGroup.toArray();
    for (i = 0; i < taskCandidateGroupArray.length; i++) {
        candidateGroupTaskDefinition = taskCandidateGroupArray[i];
        candidateGroups.push(candidateGroupTaskDefinition.expressionText);
    }


    for (i = 0; i < candidateGroups.length; i++) {
        candidateGroup = candidateGroups[i];
        result = openidm.query("managed/role/" + candidateGroup + "/members", {"_queryFilter": "true"}, ["*"]);

        if (result.result && result.result.length > 0) {
            for (j = 0; j < result.result.length; j++) {
                user = result.result[j];
                usersToAdd[user.userName] = user;
            }
        }

        result = openidm.query("repo/internal/user", params);

        if (result.result && result.result.length > 0) {
            for (j = 0; j < result.result.length; j++) {
                user = result.result[j];
                username = user.userName ? user.userName : user._id;
                usersToAdd[username] = user;
            }
        }
    }

    for (i = 0; i < candidateUsers.length; i++) {
        candidateUser = candidateUsers[i];
        usersToAdd[candidateUser] = user;
    }


    availableUsersToAssign = { users : [] };
    for (username in usersToAdd) {
        if (usersToAdd.hasOwnProperty(username)) {
            user = getUserByName(username);
            if (user) {
                availableUsersToAssign.users.push({_id: user._id, username: username, displayableName: getDisplayableOf(user)});
            }
        }
    }

    assigneeUserName = task.assignee;
    if (assigneeUserName && assigneeUserName !== '') {
        user = getUserByName(assigneeUserName);
        if (user) {
            availableUsersToAssign.assignee = {_id: user._id, username: assigneeUserName, displayableName: getDisplayableOf(user)};
        }
    }

    return availableUsersToAssign;
}());
