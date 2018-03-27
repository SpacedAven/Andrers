/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */
package bin.defaults.script.roles

import static org.forgerock.json.JsonValue.object
import static org.forgerock.json.JsonValue.field
import static org.forgerock.json.resource.ResourcePath.resourcePath

import org.forgerock.openidm.util.DateUtil
import org.forgerock.json.JsonValue
import org.forgerock.openidm.sync.SyncContext

def syncContext = context.containsContext(SyncContext.class) \
    ? context.asContext(SyncContext.class)
    : null;

def mappingSource = mappingConfig.source.getObject() as String
def sourceObject = source as JsonValue
def oldSource = oldSource as JsonValue

mappingName =  mappingConfig.name.getObject() as String

try {
    if (!mappingSource.equals("managed/user") && syncContext == null) {
        return;
    }

    JsonValue lastSyncEffectiveAssignments = oldSource != null \
        ? oldSource.get("lastSync").get(mappingName).get("effectiveAssignments")
        : sourceObject.get("lastSync").get(mappingName).get("effectiveAssignments");
    JsonValue sourceObjectEffectiveAssignments = sourceObject.get("effectiveAssignments");

    if (cacheEffectiveAssignments(lastSyncEffectiveAssignments, sourceObjectEffectiveAssignments)) {
        def patch = [["operation" : "replace",
                      "field" : "/lastSync/"+ mappingName,
                      "value" : object(
                                    field("effectiveAssignments", sourceObjectEffectiveAssignments),
                                    field("timestamp", DateUtil.getDateUtil().now()))]];

        syncContext.disableSync()
        JsonValue patched = openidm.patch(
                resourcePath(mappingSource).child(sourceObject.get("_id").asString()).toString(), null, patch);
        source.put("_rev", patched.get("_rev").asString());
    }
} finally {
    if (syncContext != null) {
        syncContext.enableSync();
    }
}

/**
 * Determine if effective assignments are used and
 * check whether we should cache the effective assignments
 * in the lastSync attribute of managed/user if so.
 *
 * @return true to cache; false otherwise
 */
private boolean cacheEffectiveAssignments(JsonValue lastSyncEffectiveAssignments,
        JsonValue sourceObjectEffectiveAssignments ) {
    return sourceObjectEffectiveAssignments.isNotNull() \
        && !sameAssignments(lastSyncEffectiveAssignments.copy(), sourceObjectEffectiveAssignments.copy())
}


/**
 * Determine if the assignments in the array of assignments
 * are the same.
 *
 * @param lastSyncEA lastSyncEffectiveAssignments JsonValue.
 * @param sourceObjectEA sourceObjectEffectiveAssignments JsonValue.
 * @return true is they are the same; false otherwise
 */
private boolean sameAssignments(JsonValue lastSyncEA, JsonValue sourceObjectEA) {
    return lastSyncEA.isEqualTo(sourceObjectEA)
}
