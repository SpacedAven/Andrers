#!/bin/sh
#
# Copyright 2013-2017 ForgeRock AS. All Rights Reserved
#
# Use of this code requires a commercial software license with ForgeRock AS.
# or with one of its affiliates. All use shall be exclusively subject
# to such license between the licensee and ForgeRock AS.
#

# resolve links - $0 may be a softlink
PRG="$0"

while [ -h "$PRG" ]; do
  ls=`ls -ld "$PRG"`
  link=`expr "$ls" : '.*-> \(.*\)$'`
  if expr "$link" : '/.*' > /dev/null; then
    PRG="$link"
  else
    PRG=`dirname "$PRG"`/"$link"
  fi
done

echo "Executing $PRG..."

# Get standard environment variables
PRGDIR=`dirname "$PRG"`

OPENIDM_HOME=${OPENIDM_HOME:-`(cd "$PRGDIR"; pwd)`}
echo "Starting shell in $OPENIDM_HOME"

java $JAVA_OPTS -classpath "$OPENIDM_HOME/bin/*:$OPENIDM_HOME/bundle/*" \
     -Dopenidm.system.server.root="$OPENIDM_HOME" \
     org.forgerock.openidm.shell.impl.Main "$@"
