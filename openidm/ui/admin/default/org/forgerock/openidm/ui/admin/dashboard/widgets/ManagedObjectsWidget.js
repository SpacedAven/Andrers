"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

/**
 * The contents of this file are subject to the terms of the Common Development and
 * Distribution License (the License). You may not use this file except in compliance with the
 * License.
 *
 * You can obtain a copy of the License at legal/CDDLv1.0.txt. See the License for the
 * specific language governing permission and limitations under the License.
 *
 * When distributing Covered Software, include this CDDL Header Notice in each file and include
 * the License file at legal/CDDLv1.0.txt. If applicable, add the following below the CDDL
 * Header, with the fields enclosed by brackets [] replaced by your own identifying
 * information: "Portions copyright [year] [name of copyright owner]".
 *
 * Copyright 2017 ForgeRock AS.
 */

define(["jquery", "underscore", "d3", "cola", "org/forgerock/openidm/ui/common/dashboard/widgets/AbstractWidget", "org/forgerock/openidm/ui/common/delegates/ConfigDelegate"], function ($, _, d3, webcola, AbstractWidget, ConfigDelegate) {
    var widgetInstance = {},
        Widget = AbstractWidget.extend({
        template: "templates/admin/dashboard/widgets/ManagedObjectsWidgetTemplate.html",
        model: {
            "graph": {}
        },
        data: {
            "relationships": []
        },
        widgetRender: function widgetRender(args, callback) {
            var _this2 = this;

            this.processManagedConfig(function () {
                _this2.parentRender(function () {

                    _this2.model.cleanedRelationships = _this2.cleanRelationshipData(_this2.data.relationships);

                    var _createObjectLinksAnd = _this2.createObjectLinksAndNodes(_this2.model.cleanedRelationships);

                    var _createObjectLinksAnd2 = _slicedToArray(_createObjectLinksAnd, 2);

                    _this2.model.graph.nodes = _createObjectLinksAnd2[0];
                    _this2.model.graph.links = _createObjectLinksAnd2[1];

                    _this2.model.graph.groups = _this2.createGroups(_this2.model.graph.nodes);
                    _this2.model.graph.constraints = _this2.createConstraints(_this2.model.graph.groups);

                    _this2.renderGraph();

                    if (callback) {
                        callback(_this2);
                    }
                });
            });
        },
        /*
         * reads managed and parses data for each managed object with relationships
         */
        processManagedConfig: function processManagedConfig(callback) {
            var _this3 = this;

            ConfigDelegate.readEntity("managed").then(function (managed) {
                _.each(managed.objects, function (object) {
                    var managedObject = { "data": [] };

                    // track icon class or add default
                    if (object.schema.icon) {
                        managedObject.iconClass = object.schema.icon;
                    } else {
                        managedObject.iconClass = "fa-database";
                    }

                    _.each(object.schema.properties, function (property, name) {
                        var widgetObject = {},
                            processRelationships = function processRelationships(prop, type) {
                            widgetObject = _.pick(prop, "resourceCollection", "reverseRelationship", "reversePropertyName");
                            widgetObject.resourceCollection = _.map(widgetObject.resourceCollection, "path");
                            widgetObject.relationshipType = type;
                            widgetObject.required = _.contains(object.schema.required, name);
                            widgetObject.name = name;
                            managedObject.name = object.name;
                            managedObject.data.push(widgetObject);
                        };

                        if (property.type === "relationship") {
                            processRelationships(property, "one");
                        } else if (property.type === "array" && property.items.type === "relationship") {
                            processRelationships(property.items, "many");
                        }
                    });
                    _this3.data.relationships.push(managedObject);
                });

                if (callback) {
                    callback();
                }
            });
        },
        cleanRelationshipData: function cleanRelationshipData(relationships) {
            var accum = [];

            _.each(relationships, function (obj) {
                var temp = {};

                temp.name = obj.name;
                temp.icon = obj.iconClass;
                temp.nodes = _.map(obj.data, function (collection) {
                    return _.pick(collection, "name", "relationshipType", "required", "reverseRelationship");
                });
                temp.targetNodes = _.map(obj.data, function (resource) {
                    return _.reduce(resource.resourceCollection, function (_obj, coll) {
                        _obj.property = resource.reversePropertyName;
                        _obj.obj = coll.split("/")[1];
                        return _obj;
                    }, {});
                });

                accum.push(temp);
            });
            return accum;
        },
        /*
         * creates models for nodes (i.e. table rows) and links
         */
        createObjectLinksAndNodes: function createObjectLinksAndNodes(relationships) {
            var _this4 = this;

            this.tempRelationships = _.cloneDeep(this.data.relationships);

            var links = [],
                nodes = [],
                nodeID = 0,
                name,
                manObj,
                temp,
                _this = this;

            _.each(relationships, function (managedObj) {
                _.each(managedObj.nodes, function (node, i) {
                    var link = {},
                        exists = _.find(nodes, function (n) {
                        return n.managedObj === managedObj.name && n.name === node.name;
                    });

                    if (!exists) {
                        // source node
                        nodes.push(_this4.createNode(nodeID, managedObj.name, node.name, node.relationshipType, node.required));
                        nodeID += 1;
                        // target node
                        nodes.push(_this4.createNode(nodeID, managedObj.targetNodes[i].obj, managedObj.targetNodes[i].property));
                        nodeID += 1;

                        // create link
                        link.source = nodeID - 2;
                        link.target = nodeID - 1;
                        links.push(link);
                    }
                });
            });

            var _fixNodesAndLinks = this.fixNodesAndLinks(nodes, links);

            var _fixNodesAndLinks2 = _slicedToArray(_fixNodesAndLinks, 2);

            nodes = _fixNodesAndLinks2[0];
            links = _fixNodesAndLinks2[1];

            var _addTargetPropsToNode = this.addTargetPropsToNodes(nodes, links);

            var _addTargetPropsToNode2 = _slicedToArray(_addTargetPropsToNode, 2);

            nodes = _addTargetPropsToNode2[0];
            links = _addTargetPropsToNode2[1];


            return [nodes, links];
        },
        /*
        * removes duplicate nodes when using multiple resource collections
        */
        fixNodesAndLinks: function fixNodesAndLinks(nodes, links) {
            var duplicates, keeper, targetAdjust, sourceAdjust;

            _.each(nodes, function (node, i, list) {
                duplicates = _.filter(list, function (elem) {
                    return node.managedObj === elem.managedObj && node.name === elem.name;
                });

                if (duplicates.length > 1) {
                    keeper = _.sortBy(duplicates, "id").shift();

                    // remove duplicates and update links
                    _.each(duplicates, function (dup) {
                        links = _.map(links, function (link) {

                            if (link.source === dup.id) {
                                link.source = keeper.id;
                            } else if (link.target === dup.id) {
                                link.target = keeper.id;
                            }
                            return link;
                        });
                        nodes = _.difference(nodes, duplicates);
                        nodes.push(keeper);
                    });
                }
            });
            //adjust ids to match index
            nodes = _.map(nodes, function (node, i) {
                if (i !== node.id) {

                    targetAdjust = _.filter(links, function (link) {
                        return link.target === node.id;
                    });

                    sourceAdjust = _.filter(links, function (link) {
                        return link.source === node.id;
                    });

                    if (sourceAdjust.length > targetAdjust.length) {
                        _.each(sourceAdjust, function (adj) {
                            adj.source = i;
                        });
                    } else {
                        _.each(targetAdjust, function (adj) {
                            adj.target = i;
                        });
                    }

                    node.id = i;
                }
                return node;
            });
            return [nodes, links];
        },

        addTargetPropsToNodes: function addTargetPropsToNodes(nodes, links) {
            var _this5 = this;

            var highlightGroups = [];

            _.each(links, function (link, i, list) {
                var targetData = _this5.getTargetData(nodes[link.target]),
                    sharedLinks = [];

                sharedLinks = _.filter(list, function (l) {
                    return l.source === link.source || l.target === link.target;
                });

                if (sharedLinks.length > 1) {
                    highlightGroups.push(_.uniq(_.reduce(sharedLinks, function (acum, link) {
                        return acum.concat([link.source, link.target]);
                    }, [])));
                }

                if (!nodes[link.source].required) {
                    var group = _.find(_this5.model.cleanedRelationships, function (obj) {
                        return obj.name === nodes[link.source].managedObj;
                    });

                    nodes[link.source].required = group.nodes[0].required;
                    nodes[link.source].type = group.nodes[0].relationshipType;
                }

                nodes[link.source].targetName = nodes[link.target].name;
                nodes[link.source].targetObj = nodes[link.target].managedObj;
                nodes[link.target].required = targetData.required;
                nodes[link.target].type = targetData.relationshipType;

                link.sourceCount = _.findWhere(_this5.data.relationships, { "name": nodes[link.source].managedObj }).data.length;
                link.targetCount = _.findWhere(_this5.data.relationships, { "name": nodes[link.target].managedObj }).data.length;
            });

            highlightGroups = _.uniq(highlightGroups, function (group) {
                return JSON.stringify(group);
            });

            // add highlight class to nodes with multiple resource collections
            _.each(highlightGroups, function (group) {
                var count = 1;
                _.each(group, function (num) {
                    nodes[num].class = "highlight-" + count;
                });
                count += 1;
            });

            return [nodes, links];
        },

        getTargetData: function getTargetData(node) {
            return _.findWhere(_.findWhere(this.data.relationships, { "name": node.managedObj }).data, { "name": node.name });
        },

        createNode: function createNode(id, managedObj, name, relationshipType, required) {
            return {
                "managedObj": managedObj,
                "name": name,
                "id": id,
                "height": 50,
                "width": 220,
                "type": relationshipType,
                "required": required
            };
        },

        createGroups: function createGroups(nodes) {
            var _this6 = this;

            var groups = [],
                group;

            _.each(nodes, function (node, i, list) {
                group = _.find(groups, function (el) {
                    return el.name === node.managedObj;
                });

                if (group) {
                    groups = _.without(groups, group);
                    group.leaves.push(i);
                } else {
                    group = {};
                    group.name = node.managedObj;
                    group.iconClass = "fa " + _this6.fetchIcon(group.name);
                    group.leaves = [i];
                }
                groups.push(group);
            });

            return groups;
        },

        fetchIcon: function fetchIcon(ManagedObjName) {
            return _.find(this.data.relationships, { name: ManagedObjName }).iconClass;
        },
        /*
         * constraints restrict the layout of groups and nodes by applying coordinate rules
         * an alignment constraint has the following structure:
               {
                    "type": "alignment",
                    "axis": "x",
                    "offsets": [
                        {"node": "1","offset": "0"},
                        {"node": "2", "offset": "0"},
                        {"node": "3", "offset": "0"}
                    ]
                }
         * this indicates the center of node 1, 2, and 3 are aligned on the x axis
         */
        createConstraints: function createConstraints(groups) {
            var _this7 = this;

            var constraints = [],
                constraintX,
                constraintY,
                singleNodeGroups = [],
                constraintObj = {};

            //keep rows stacked and close together
            _.each(groups, function (group) {
                if (group.leaves.length === 1) {
                    singleNodeGroups.push(group);
                }

                if (group.leaves.length > 1) {
                    var yOffset = 0;

                    constraintX = {};
                    constraintX.type = "alignment";
                    constraintX.axis = "x";
                    constraintX.offsets = [];

                    constraintY = {};
                    constraintY.type = "alignment";
                    constraintY.axis = "y";
                    constraintY.offsets = [];

                    _.each(group.leaves, function (leaf) {
                        var alignmentX = {},
                            alignmentY = {};

                        alignmentX.node = leaf;
                        alignmentX.offset = 0;
                        alignmentY.node = leaf;

                        if (constraintY.offsets.length) {
                            yOffset += 50;
                        }

                        alignmentY.offset = yOffset;
                        constraintX.offsets.push(alignmentX);
                        constraintY.offsets.push(alignmentY);
                    });
                    constraints.push(constraintX, constraintY);
                }
            });

            // prevent single node groups from overlapping
            _.each(singleNodeGroups, function (group, i, list) {
                _.each(list, function (g) {
                    var targetObj = _this7.model.graph.nodes[group.leaves[0]].targetObj,
                        matchObj = _this7.model.graph.nodes[g.leaves[0]].targetObj;

                    if (group !== g && targetObj === matchObj) {
                        constraints.push({
                            "axis": "y",
                            "left": group.leaves[0],
                            "right": g.leaves[0],
                            "gap": 160
                        });
                    }
                });
            });

            return constraints;
        },
        /*
         * instantiates all svgs for display and controls how they are positioned
         * and all actions the user can take
         */
        renderGraph: function renderGraph() {
            var _this8 = this;

            var width = $('#managedObjectsDisplay').width(),
                graph = _.cloneDeep(this.model.graph),
                height = width * (9 / 16),
                cola,
                svg,
                group,
                drag,
                node,
                label,
                path,
                zoom;
            /*
            * cola is adaptor for D3 that replaces the force layout - adding node stability
            * FlowLayout causes edges to have a separation constraint generated between the
            * source and target node. 'x' incourages a left-to-right direction ('y' top-to-bottom) and
            * the integer value is the minimum spacing between linked nodes.
            *
            * "handleDisconnected" applies an algorithm to nodes with one link or less to roughly space them
            * "avoidOverlaps" prevents nodes from overlapping
            */
            cola = webcola.d3adaptor(d3).avoidOverlaps(true).flowLayout('x', 550).handleDisconnected(true).size([width, height]);

            zoom = d3.behavior.zoom().scaleExtent([0.3, 1.5]).on("zoom", function () {
                svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
            });

            svg = this.instantiateSvgContainerAndStems(width, height, zoom);

            cola.constraints(graph.constraints).symmetricDiffLinkLengths(120).nodes(graph.nodes).links(graph.links).groups(graph.groups).start();

            drag = cola.drag().on("dragstart", this.dragStart);
            group = this.instantiateGroups(svg, graph, drag);
            node = this.instantiateNodes(svg, graph, drag);
            path = this.instantiatePaths(svg, cola);
            label = this.instantiateLabels(svg, graph, drag);

            cola.on("tick", function () {
                var iconShift = 50,
                    pad = 5,
                    headerMargin = 70,
                    tableMargin = 5;

                _this8.updatePaths(cola, svg);

                if (!_this8.model.resized) {
                    _this8.model.resized = true;
                    setTimeout(function () {
                        _this8.zoomToFit(1500, zoom);
                    }, 2000);
                }

                node.attr("x", function (d) {
                    return d.x - d.width / 2 + pad;
                }).attr("y", function (d) {
                    return d.y - d.height / 2 + pad;
                });

                group.select(".group").attr("x", function (d) {
                    return d.bounds.x;
                }).attr("y", function (d) {
                    return d.bounds.y;
                }).attr("width", function (d) {
                    return d.bounds.width();
                }).attr("height", function (d) {
                    return d.bounds.height();
                });

                group.select("foreignObject").attr("x", function (d) {
                    return d.bounds.x;
                }).attr("y", function (d) {
                    return d.bounds.y - iconShift;
                });

                // align table headers
                group.select("text").attr("x", function (d) {
                    return d.bounds.x + headerMargin;
                }).attr("y", function (d) {
                    return d.bounds.y - tableMargin;
                });

                // center text in table rows
                label.attr("x", function (d) {
                    return d.x - this.getBBox().width / 2;
                }).attr("y", function (d) {
                    return d.y + this.getBBox().height / 4;
                });
            });
        },
        /*
        * fits graph to canvas
        */
        zoomToFit: function zoomToFit(transitionDuration, zoom) {
            var root = d3.select("g.canvas"),
                bounds = root.node().getBBox(),
                parent = root.node().parentElement,
                fullWidth = parent.clientWidth || parent.parentNode.clientWidth,
                fullHeight = parent.clientHeight || parent.parentNode.clientHeight,
                width = bounds.width,
                height = bounds.height,
                midX = bounds.x + width / 2,
                midY = bounds.y + height / 2,
                scale,
                translate;

            if (width === 0 || height === 0) {
                return;
            } // nothing to fit

            scale = 0.90 / Math.max(width / fullWidth, height / fullHeight);
            translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

            root.transition().duration(transitionDuration || 0) // milliseconds
            .call(zoom.translate(translate).scale(scale).event);
        },
        /*
        * create parent container for widget and define markers for path ends
        */
        instantiateSvgContainerAndStems: function instantiateSvgContainerAndStems(width, height, zoom) {
            // svg paths for all markers - many-optional, many-required, one-optional and one-required (left and right)
            var svg,
                stems = [{ "name": "rightManyReq", "path": "M25 25 L50 10 M25 25 L50 40 M25 25 L50 25 M25 10 L25 40", "refX": 45, "refY": 25, "legend": "many - required" }, { "name": "leftManyReq", "path": "M25 25 L0 10 M25 25 L0 25 M25 25 L0 40 M25 10 L25 40", "refX": 5, "refY": 25 }, { "name": "rightManyOpt", "path": "M25 25 L50 10 M25 25 L50 40 M25 25 L50 25 M15 15 a 10 10 0 1 0 1 0 Z", "refX": 45, "refY": 25, "legend": "many - optional" }, { "name": "leftManyOpt", "path": "M25 25 L0 10 M25 25 L0 25 M25 25 L0 40 M35 15 a 10 10 0 1 0 1 0 Z", "refX": 5, "refY": 25 }, { "name": "rightOneReq", "path": "M25 25 L50 25 M25 10 L25 40", "refX": 45, "refY": 25, "legend": "one - required" }, { "name": "leftOneReq", "path": "M25 25 L0 25 M25 10 L25 40", "refX": 5, "refY": 25 }, { "name": "rightOneOpt", "path": "M25 25 L50 25 M15 15 a 10 10 0 1 0 1 0 Z", "refX": 45, "refY": 25, "legend": "one - optional" }, { "name": "leftOneOpt", "path": "M25 25 L0 25 M35 15 a 10 10 0 1 0 1 0 Z", "refX": 5, "refY": 25 }],
                legendStems = _.filter(stems, function (stem) {
                return stem.legend;
            }),
                markerSize = 25;

            svg = d3.select("#managedObjectsDisplay").append("svg:svg").call(zoom).attr("width", width).attr("height", height).on("mousedown.zoom", null).on("dblclick.zoom", null).on("mouseup", this.unhighlight).append("svg:g").attr("class", "canvas");

            // create definitions for markers to be consumed by paths
            svg.append("defs").selectAll("marker").data(stems).enter().append("marker").attr("id", function (d) {
                return "marker_" + d.name;
            }).attr("class", "marker").attr("viewBox", "-25 0 100 100").attr("refX", function (d) {
                return d.refX;
            }).attr("refY", function (d) {
                return d.refY;
            }).attr("markerHeight", markerSize).attr("markerWidth", markerSize).append("path").attr("d", function (d) {
                return d.path;
            });

            this.createLegend(legendStems);

            return svg;
        },
        /*
        * Build legend for widget and resize based on canvas size
        */
        createLegend: function createLegend(stems) {
            var legend,
                paddingX = 40,
                paddingY = 30,
                lineHeight = 35,
                nudge = 10,
                stemX = 275,
                pathDrop = 20,
                textDrop = 55,
                textX = 30,
                corner = 8,
                idealSize = 1 / 8; // 1/nth the total container size

            legend = d3.select("#managedObjectsDisplay svg").append("g").attr("class", "legendGroup").selectAll("g").data(stems).enter().append("g");

            legend.append("path").attr("class", "legend").attr("d", function (d) {
                return d.path;
            }).attr("transform", function (d, i) {
                return "translate(" + stemX + "," + (lineHeight * i + pathDrop) + ")";
            });

            legend.append("text").attr("class", "legendText").attr("y", function (d, i) {
                return lineHeight * i + textDrop;
            }).attr("x", textX).text(function (d) {
                return d.legend;
            });

            d3.select(".legendGroup").insert("rect", ":first-child").attr("class", "legendContainer").attr("height", function () {
                return $('.legendGroup').get(0).getBBox().height + paddingY;
            }).attr("width", function () {
                return $('.legendGroup').get(0).getBBox().width + paddingX;
            }).attr("rx", corner).attr("ry", corner).attr("x", nudge).attr("y", nudge);

            d3.select(".legendGroup").attr("transform", function (d) {
                var scaleFactor = $('#managedObjectsDisplay').width() / $('.legendGroup').get(0).getBBox().width * idealSize;

                return "scale(" + scaleFactor + ")";
            });
        },
        /*
        * populate svg elements for groups including icons and object names
        */
        instantiateGroups: function instantiateGroups(svg, graph, drag) {
            var group;

            _.each(graph.groups, function (g) {
                g.padding = 3;
            });

            group = svg.selectAll("g").data(graph.groups).enter().append("g").call(drag);

            group.append("rect").attr("rx", 8).attr("ry", 8).attr("class", "group").attr("id", function (d) {
                return "group_" + d.name;
            });

            group.append('svg:foreignObject').append("xhtml:body").html(function (d) {
                return '<div class="image circle" id="icon_' + d.name + '"><i class="' + d.iconClass + '"></i></div>';
            });

            group.append("text").attr("class", "objName").attr("id", function (d) {
                return "header_" + d.name;
            }).text(function (d) {
                return d.name;
            });

            return group;
        },
        /*
        * populate svg nodes and attach event listeners
        */
        instantiateNodes: function instantiateNodes(svg, graph, drag) {
            var pad = 5,
                node;

            node = svg.selectAll(".node").data(graph.nodes).enter().append("rect").attr("class", function (d) {
                return "node " + d.class;
            }).attr("id", function (d) {
                return "node_" + d.managedObj + "_" + d.name;
            }).attr("width", function (d) {
                return d.width - 2 * pad;
            }).attr("height", function (d) {
                return d.height - 2 * pad;
            }).attr("rx", 5).attr("ry", 5).call(drag);

            node.on("mousedown", this.highlight, this.dragStart).on("mouseup", this.unhighlight);

            node.append("title").text(function (d) {
                return d.name;
            });

            return node;
        },
        /*
        * create data required for paths and populate svg elements
        */
        instantiatePaths: function instantiatePaths(svg, cola) {
            var _this9 = this;

            var pairs = this.makePairs(cola.links(), cola.nodes()),
                pathData = this.createPathData(pairs),
                stepData = this.createStepData(pathData, cola.groups()),
                path;

            path = svg.append("g").attr("class", "pathGroup").selectAll("path").data(stepData).enter().append("path").attr("class", "line").attr("d", this.makeSteps(stepData)).attr("id", function (d, i) {
                return "path_" + pairs[i].source.managedObj + "_" + pairs[i].source.name + "_" + pairs[i].target.managedObj + "_" + pairs[i].target.name;
            }).attr("marker-start", function (d, i) {
                return _this9.addMarkers(pathData[i], "startMarker");
            }).attr("marker-end", function (d, i) {
                return _this9.addMarkers(pathData[i], "endMarker");
            });

            return path;
        },
        /*
        * create text element for table rows and add events
        */
        instantiateLabels: function instantiateLabels(svg, graph, drag) {
            var label = svg.selectAll(".label").data(graph.nodes).enter().append("text").attr("class", "label").attr("id", function (d) {
                return "label_" + d.managedObj + "_" + d.name;
            }).text(function (d) {
                return d.name;
            }).call(drag);

            label.on("mousedown", this.highlight).on("mouseup", this.unhighlight);

            return label;
        },
        /*
        * change opacity of all svgs except the clicked node and related path and target node
        */
        highlight: function highlight(node) {
            var sourceNode = "#node_" + node.managedObj + "_" + node.name,
                sourceGroup = "#group_" + node.managedObj,
                sourceIcon = "#icon_" + node.managedObj,
                sourceHeader = "#header_" + node.managedObj,
                sourceLabel = "#label_" + node.managedObj + "_" + node.name,
                targetNode,
                targetGroup,
                targetIcon,
                targetHeader,
                targetLabel,
                targetParts,
                connectingPath;

            d3.selectAll(".line, .group, .image, .node, .label, .objName, i, circle").classed("muted", true);
            if (node.class) {
                var members = $("." + node.class),
                    pathIDsParts = [],
                    pathIDs = [];

                _.each(members, function (member) {
                    pathIDsParts.push(member.id.split(/_(.+)/)[1]);

                    d3.select(member).classed("muted", false);
                    d3.select("#icon_" + member.id.split("_")[1]).select("i").classed("muted", false);
                    d3.select("#label_" + member.id.split(/_(.+)/)[1]).classed("muted", false);
                    d3.select("#group_" + member.id.split("_")[1]).classed("muted", false);
                    d3.select("#header_" + member.id.split("_")[1]).classed("muted", false);
                    d3.select("#icon_" + member.id.split("_")[1]).classed("muted", false);
                });

                _.each(pathIDsParts, function (part, i, list) {
                    _.each(list, function (p) {
                        if (part.split("_")[1] !== p.split("_")[1]) {
                            pathIDs.push("path_" + p + "_" + part, "path_" + part + "_" + p);
                        }
                    });
                });

                _.each(_.uniq(pathIDs), function (id) {
                    d3.select("#" + id).classed("muted", false);
                });
            } else {
                if (!node.targetName) {
                    targetParts = $("path[id$='_" + node.managedObj + "_" + node.name + "']").attr("id").split("_");
                    connectingPath = "#path_" + targetParts[1] + "_" + targetParts[2] + "_" + node.managedObj + "_" + node.name;
                    targetNode = "#node_" + targetParts[1] + "_" + targetParts[2];
                    targetGroup = "#group_" + targetParts[1];
                    targetIcon = "#icon_" + targetParts[1];
                    targetHeader = "#header_" + targetParts[1];
                    targetLabel = "#label_" + targetParts[1] + "_" + targetParts[2];
                } else {
                    connectingPath = "#path_" + node.managedObj + "_" + node.name + "_" + node.targetObj + "_" + node.targetName;
                    targetNode = "#node_" + node.targetObj + "_" + node.targetName;
                    targetGroup = "#group_" + node.targetObj;
                    targetIcon = "#icon_" + node.targetObj;
                    targetHeader = "#header_" + node.targetObj;
                    targetLabel = "#label_" + node.targetObj + "_" + node.targetName;
                }
                d3.select(sourceNode).classed("muted", false);
                d3.select(sourceGroup).classed("muted", false);
                d3.select(sourceIcon).classed("muted", false);
                d3.select(sourceIcon).select("i").classed("muted", false);
                d3.select(sourceHeader).classed("muted", false);
                d3.select(sourceLabel).classed("muted", false);
                d3.select(targetNode).classed("muted", false);
                d3.select(targetGroup).classed("muted", false);
                d3.select(targetIcon).classed("muted", false);
                d3.select(targetIcon).select("i").classed("muted", false);
                d3.select(targetHeader).classed("muted", false);
                d3.select(targetLabel).classed("muted", false);
                d3.select(connectingPath).classed("muted", false);
            }
        },

        unhighlight: function unhighlight() {
            d3.selectAll(".line, .group, .image, .node, .label, .objName, i").classed("muted", false);
        },

        dragStart: function dragStart(d) {
            d.fixed = true;
        },

        addMarkers: function addMarkers(d, location) {
            return "url(#marker_" + d[location] + ")";
        },

        makePairs: function makePairs(links, nodes) {

            return _.map(links, function (link) {
                var pair = {};

                pair.source = nodes[link.source.id];
                pair.target = nodes[link.target.id];

                return pair;
            });
        },

        updatePaths: function updatePaths(cola, svg) {
            var _this10 = this;

            var pairs = this.makePairs(cola.links(), cola.nodes()),
                pathData = this.createPathData(pairs),
                stepData = this.createStepData(pathData, cola.groups()),
                nudgedStepData = this.nudgeSegments(stepData);

            svg.select(".pathGroup").selectAll("path").data(stepData).attr("d", this.makeSteps(nudgedStepData)).attr("marker-start", function (d, i) {
                return _this10.addMarkers(pathData[i], "startMarker");
            }).attr("marker-end", function (d, i) {
                return _this10.addMarkers(pathData[i], "endMarker");
            });
        },
        /*
        * takes a pair of nodes with a link between them and creates step data to generate path
        */
        createPathData: function createPathData(pairs) {
            var _this11 = this;

            return _.map(pairs, function (pair) {
                var data = {},
                    start = [],
                    end = [],
                    xShift = pair.source.width / 2;

                data.width = pair.source.width;
                data.startY = pair.source.y;
                data.endY = pair.target.y;
                data.isSameObj = false;

                data.isAbove = _this11.isAbove(data.startY, data.endY);
                data.isLeft = _this11.isLeft(pair.source.x, pair.target.x);
                data.sourceName = pair.source.managedObj;
                data.targetName = pair.target.managedObj;

                if (pair.source.managedObj === pair.target.managedObj) {
                    data.endX = pair.source.x - xShift;
                    data.startX = data.endX;
                    data.isSameObj = true;
                    start.push("right");
                    end.push("right");
                } else if (data.isLeft) {
                    data.startX = pair.source.x + xShift;
                    data.endX = pair.target.x - xShift;
                    start.push("left");
                    end.push("right");
                } else {
                    data.startX = pair.source.x - xShift;
                    data.endX = pair.target.x + xShift;
                    start.push("right");
                    end.push("left");
                }

                start.push(_.startCase(pair.source.type));
                end.push(_.startCase(pair.target.type));

                if (pair.source.required) {
                    start.push("Req");
                } else {
                    start.push("Opt");
                }

                if (pair.target.required) {
                    end.push("Req");
                } else {
                    end.push("Opt");
                }

                data.startMarker = start.join("");
                data.endMarker = end.join("");

                return data;
            });
        },

        makeSteps: function makeSteps(d) {
            return d3.svg.line().x(function (d) {
                return d.x;
            }).y(function (d) {
                return d.y;
            }).interpolate("step-before");
        },

        isAbove: function isAbove(y1, y2) {
            return y1 < y2;
        },

        isLeft: function isLeft(x1, x2) {
            return x1 < x2;
        },

        getMidPoint: function getMidPoint(x1, x2) {
            return (x1 + x2) / 2;
        },
        /*
        * Paths showing connections between relationship properties are created
        * from a series of vertices (x,y) which indicate the steps to generate
        */
        createStepData: function createStepData(links, groups) {
            return _.map(links, function (link) {
                var stemLength = 75,
                    padding = 40,
                    x = Math.min(link.startX, link.endX),
                    X = Math.max(link.startX, link.endX),
                    y,
                    Y,
                    pathPoints = [],
                    _navigateObstacles,
                    secondToLast,
                    last;

                if (link.isSameObj) {
                    return [{ "x": x, "y": link.startY }, { "x": x - stemLength, "y": link.startY }, { "x": x - stemLength, "y": link.endY }, { "x": x, "y": link.endY }];
                } else if (x === link.startX) {
                    y = link.startY;
                    Y = link.endY;
                    x += stemLength;
                } else {
                    Y = link.startY;
                    y = link.endY;
                    x -= stemLength;
                }

                secondToLast = { "x": X, "y": link.endY };
                last = { "x": link.endX, "y": link.endY };

                pathPoints.push({ "x": link.startX, "y": link.startY }, { "x": x, "y": link.startY });

                _navigateObstacles = function navigateObstacles(x, X, y, Y, name) {
                    var newX,
                        newY,
                        obstacle = _.find(groups, function (group) {
                        // group is between path terminals
                        return group.name !== name && x < group.bounds.x && group.bounds.x < X && (group.bounds.y < y && group.bounds.Y > y || group.bounds.y < Y && group.bounds.Y > Y || group.bounds.y > y && group.bounds.Y < Y);
                    });
                    if (obstacle) {
                        pathPoints.push({ "x": obstacle.bounds.x - padding, "y": y });
                        newX = obstacle.bounds.X + padding;
                        // find shortest path
                        if (Math.abs(y - obstacle.bounds.y) + Math.abs(Y - obstacle.bounds.y) + padding < Math.abs(y - obstacle.bounds.Y) + Math.abs(Y - obstacle.bounds.Y)) {
                            // go over obstacle
                            newY = obstacle.bounds.y - padding * 2;
                        } else {
                            // go under obstacle
                            newY = obstacle.bounds.Y + padding;
                        }
                        return _navigateObstacles(newX, X, newY, Y, name);
                    } else {
                        // no obstacle in path
                        pathPoints.push(secondToLast, last);
                        return pathPoints;
                    }
                };

                return _navigateObstacles(x, X, y, Y, link.targetName);
            });
        },
        /*
        * when paths overlap move the offending line segment for better visuals
        */
        nudgeSegments: function nudgeSegments(data) {
            var nudge = 6,
                matches,
                pieces = [];

            // only need to adjust second or second to last segment
            _.each(data, function (paths) {
                if (paths[1].x !== paths[paths.length - 2].x) {
                    pieces.push(paths[1], paths[paths.length - 2]);
                }
            });

            // nudge overlapping segments
            _.each(pieces, function (point, i, list) {
                matches = _.filter(list, function (val) {
                    return point.x === val.x;
                });

                if (matches.length > 1) {
                    _.each(matches, function (match, i) {
                        match.x -= nudge * i;
                    });
                }
            });

            return data;
        }
    });

    widgetInstance.generateWidget = function (loadingObject, callback) {
        var widget = {};

        $.extend(true, widget, new Widget());

        widget.render(loadingObject, callback);

        return widget;
    };

    return widgetInstance;
});
