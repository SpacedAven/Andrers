/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/**
 * Performs necessary setup on a reconciliation event.
 *
 * Pre-loads all roles.
 * Pre-loads all assignments associated with the current mapping.
 *
 * The following variables are supplied:
 *   context: the current request context
 *   mappingConfig: the mapping configuration
 */

import org.forgerock.openidm.sync.ReconContext;
import org.forgerock.services.context.Context;

def reconContext = context.asContext(ReconContext.class)
def source = mappingConfig.source.getObject() as String
def target = mappingConfig.target.getObject() as String

if ((target.equals("managed/user") || source.equals("managed/user")) && reconContext != null) {
    def assignments = openidm.query("managed/assignment", [ "_queryFilter" : '/mapping eq ' + mappingConfig.name ]).result
    def roles = openidm.query("managed/role", [ "_queryFilter" : 'true' ], [ "*", "assignments" ]).result

    reconContext.put("assignments", assignments)
    reconContext.put("roles", roles)
}
