document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1"></' + 'script>');
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('leaflet')) :
	typeof define === 'function' && define.amd ? define(['exports', 'leaflet'], factory) :
	(factory((global.VizArtGeo = {}),global.L));
}(this, (function (exports,L) { 'use strict';

L = L && L.hasOwnProperty('default') ? L['default'] : L;

var version = "0.7.7";

var xhtml = "http://www.w3.org/1999/xhtml";

var namespaces = {
  svg: "http://www.w3.org/2000/svg",
  xhtml: xhtml,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};

var namespace = function (name) {
  var prefix = name += "",
      i = prefix.indexOf(":");
  if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
  return namespaces.hasOwnProperty(prefix) ? { space: namespaces[prefix], local: name } : name;
};

function creatorInherit(name) {
  return function () {
    var document = this.ownerDocument,
        uri = this.namespaceURI;
    return uri === xhtml && document.documentElement.namespaceURI === xhtml ? document.createElement(name) : document.createElementNS(uri, name);
  };
}

function creatorFixed(fullname) {
  return function () {
    return this.ownerDocument.createElementNS(fullname.space, fullname.local);
  };
}

var creator = function (name) {
  var fullname = namespace(name);
  return (fullname.local ? creatorFixed : creatorInherit)(fullname);
};

var matcher = function matcher(selector) {
  return function () {
    return this.matches(selector);
  };
};

if (typeof document !== "undefined") {
  var element = document.documentElement;
  if (!element.matches) {
    var vendorMatches = element.webkitMatchesSelector || element.msMatchesSelector || element.mozMatchesSelector || element.oMatchesSelector;
    matcher = function matcher(selector) {
      return function () {
        return vendorMatches.call(this, selector);
      };
    };
  }
}

var matcher$1 = matcher;

var filterEvents = {};

var event = null;

if (typeof document !== "undefined") {
  var element$1 = document.documentElement;
  if (!("onmouseenter" in element$1)) {
    filterEvents = { mouseenter: "mouseover", mouseleave: "mouseout" };
  }
}

function filterContextListener(listener, index, group) {
  listener = contextListener(listener, index, group);
  return function (event) {
    var related = event.relatedTarget;
    if (!related || related !== this && !(related.compareDocumentPosition(this) & 8)) {
      listener.call(this, event);
    }
  };
}

function contextListener(listener, index, group) {
  return function (event1) {
    var event0 = event; // Events can be reentrant (e.g., focus).
    event = event1;
    try {
      listener.call(this, this.__data__, index, group);
    } finally {
      event = event0;
    }
  };
}

function parseTypenames(typenames) {
  return typenames.trim().split(/^|\s+/).map(function (t) {
    var name = "",
        i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    return { type: t, name: name };
  });
}

function onRemove(typename) {
  return function () {
    var on = this.__on;
    if (!on) return;
    for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
      if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.capture);
      } else {
        on[++i] = o;
      }
    }
    if (++i) on.length = i;else delete this.__on;
  };
}

function onAdd(typename, value, capture) {
  var wrap = filterEvents.hasOwnProperty(typename.type) ? filterContextListener : contextListener;
  return function (d, i, group) {
    var on = this.__on,
        o,
        listener = wrap(value, i, group);
    if (on) for (var j = 0, m = on.length; j < m; ++j) {
      if ((o = on[j]).type === typename.type && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.capture);
        this.addEventListener(o.type, o.listener = listener, o.capture = capture);
        o.value = value;
        return;
      }
    }
    this.addEventListener(typename.type, listener, capture);
    o = { type: typename.type, name: typename.name, value: value, listener: listener, capture: capture };
    if (!on) this.__on = [o];else on.push(o);
  };
}

var selection_on = function (typename, value, capture) {
  var typenames = parseTypenames(typename + ""),
      i,
      n = typenames.length,
      t;

  if (arguments.length < 2) {
    var on = this.node().__on;
    if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
      for (i = 0, o = on[j]; i < n; ++i) {
        if ((t = typenames[i]).type === o.type && t.name === o.name) {
          return o.value;
        }
      }
    }
    return;
  }

  on = value ? onAdd : onRemove;
  if (capture == null) capture = false;
  for (i = 0; i < n; ++i) {
    this.each(on(typenames[i], value, capture));
  }return this;
};

var sourceEvent = function () {
  var current = event,
      source;
  while (source = current.sourceEvent) {
    current = source;
  }return current;
};

var point = function (node, event) {
  var svg = node.ownerSVGElement || node;

  if (svg.createSVGPoint) {
    var point = svg.createSVGPoint();
    point.x = event.clientX, point.y = event.clientY;
    point = point.matrixTransform(node.getScreenCTM().inverse());
    return [point.x, point.y];
  }

  var rect = node.getBoundingClientRect();
  return [event.clientX - rect.left - node.clientLeft, event.clientY - rect.top - node.clientTop];
};

var mouse = function (node) {
  var event = sourceEvent();
  if (event.changedTouches) event = event.changedTouches[0];
  return point(node, event);
};

function none() {}

var selector = function (selector) {
  return selector == null ? none : function () {
    return this.querySelector(selector);
  };
};

var selection_select = function (select) {
  if (typeof select !== "function") select = selector(select);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
      }
    }
  }

  return new Selection(subgroups, this._parents);
};

function empty() {
  return [];
}

var selectorAll = function (selector) {
  return selector == null ? empty : function () {
    return this.querySelectorAll(selector);
  };
};

var selection_selectAll = function (select) {
  if (typeof select !== "function") select = selectorAll(select);

  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        subgroups.push(select.call(node, node.__data__, i, group));
        parents.push(node);
      }
    }
  }

  return new Selection(subgroups, parents);
};

var selection_filter = function (match) {
  if (typeof match !== "function") match = matcher$1(match);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }

  return new Selection(subgroups, this._parents);
};

var sparse = function (update) {
  return new Array(update.length);
};

var selection_enter = function () {
  return new Selection(this._enter || this._groups.map(sparse), this._parents);
};

function EnterNode(parent, datum) {
  this.ownerDocument = parent.ownerDocument;
  this.namespaceURI = parent.namespaceURI;
  this._next = null;
  this._parent = parent;
  this.__data__ = datum;
}

EnterNode.prototype = {
  constructor: EnterNode,
  appendChild: function appendChild(child) {
    return this._parent.insertBefore(child, this._next);
  },
  insertBefore: function insertBefore(child, next) {
    return this._parent.insertBefore(child, next);
  },
  querySelector: function querySelector(selector) {
    return this._parent.querySelector(selector);
  },
  querySelectorAll: function querySelectorAll(selector) {
    return this._parent.querySelectorAll(selector);
  }
};

var constant$1 = function (x) {
  return function () {
    return x;
  };
};

var keyPrefix = "$"; // Protect against keys like “__proto__”.

function bindIndex(parent, group, enter, update, exit, data) {
  var i = 0,
      node,
      groupLength = group.length,
      dataLength = data.length;

  // Put any non-null nodes that fit into update.
  // Put any null nodes into enter.
  // Put any remaining data into enter.
  for (; i < dataLength; ++i) {
    if (node = group[i]) {
      node.__data__ = data[i];
      update[i] = node;
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }

  // Put any non-null nodes that don’t fit into exit.
  for (; i < groupLength; ++i) {
    if (node = group[i]) {
      exit[i] = node;
    }
  }
}

function bindKey(parent, group, enter, update, exit, data, key) {
  var i,
      node,
      nodeByKeyValue = {},
      groupLength = group.length,
      dataLength = data.length,
      keyValues = new Array(groupLength),
      keyValue;

  // Compute the key for each node.
  // If multiple nodes have the same key, the duplicates are added to exit.
  for (i = 0; i < groupLength; ++i) {
    if (node = group[i]) {
      keyValues[i] = keyValue = keyPrefix + key.call(node, node.__data__, i, group);
      if (keyValue in nodeByKeyValue) {
        exit[i] = node;
      } else {
        nodeByKeyValue[keyValue] = node;
      }
    }
  }

  // Compute the key for each datum.
  // If there a node associated with this key, join and add it to update.
  // If there is not (or the key is a duplicate), add it to enter.
  for (i = 0; i < dataLength; ++i) {
    keyValue = keyPrefix + key.call(parent, data[i], i, data);
    if (node = nodeByKeyValue[keyValue]) {
      update[i] = node;
      node.__data__ = data[i];
      nodeByKeyValue[keyValue] = null;
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }

  // Add any remaining nodes that were not bound to data to exit.
  for (i = 0; i < groupLength; ++i) {
    if ((node = group[i]) && nodeByKeyValue[keyValues[i]] === node) {
      exit[i] = node;
    }
  }
}

var selection_data = function (value, key) {
  if (!value) {
    data = new Array(this.size()), j = -1;
    this.each(function (d) {
      data[++j] = d;
    });
    return data;
  }

  var bind = key ? bindKey : bindIndex,
      parents = this._parents,
      groups = this._groups;

  if (typeof value !== "function") value = constant$1(value);

  for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
    var parent = parents[j],
        group = groups[j],
        groupLength = group.length,
        data = value.call(parent, parent && parent.__data__, j, parents),
        dataLength = data.length,
        enterGroup = enter[j] = new Array(dataLength),
        updateGroup = update[j] = new Array(dataLength),
        exitGroup = exit[j] = new Array(groupLength);

    bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

    // Now connect the enter nodes to their following update node, such that
    // appendChild can insert the materialized enter node before this node,
    // rather than at the end of the parent node.
    for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
      if (previous = enterGroup[i0]) {
        if (i0 >= i1) i1 = i0 + 1;
        while (!(next = updateGroup[i1]) && ++i1 < dataLength) {}
        previous._next = next || null;
      }
    }
  }

  update = new Selection(update, parents);
  update._enter = enter;
  update._exit = exit;
  return update;
};

var selection_exit = function () {
  return new Selection(this._exit || this._groups.map(sparse), this._parents);
};

var selection_merge = function (selection$$1) {

  for (var groups0 = this._groups, groups1 = selection$$1._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }

  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }

  return new Selection(merges, this._parents);
};

var selection_order = function () {

  for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
    for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
      if (node = group[i]) {
        if (next && next !== node.nextSibling) next.parentNode.insertBefore(node, next);
        next = node;
      }
    }
  }

  return this;
};

var selection_sort = function (compare) {
  if (!compare) compare = ascending;

  function compareNode(a, b) {
    return a && b ? compare(a.__data__, b.__data__) : !a - !b;
  }

  for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        sortgroup[i] = node;
      }
    }
    sortgroup.sort(compareNode);
  }

  return new Selection(sortgroups, this._parents).order();
};

function ascending(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

var selection_call = function () {
  var callback = arguments[0];
  arguments[0] = this;
  callback.apply(null, arguments);
  return this;
};

var selection_nodes = function () {
  var nodes = new Array(this.size()),
      i = -1;
  this.each(function () {
    nodes[++i] = this;
  });
  return nodes;
};

var selection_node = function () {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
      var node = group[i];
      if (node) return node;
    }
  }

  return null;
};

var selection_size = function () {
  var size = 0;
  this.each(function () {
    ++size;
  });
  return size;
};

var selection_empty = function () {
  return !this.node();
};

var selection_each = function (callback) {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
      if (node = group[i]) callback.call(node, node.__data__, i, group);
    }
  }

  return this;
};

function attrRemove(name) {
  return function () {
    this.removeAttribute(name);
  };
}

function attrRemoveNS(fullname) {
  return function () {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}

function attrConstant(name, value) {
  return function () {
    this.setAttribute(name, value);
  };
}

function attrConstantNS(fullname, value) {
  return function () {
    this.setAttributeNS(fullname.space, fullname.local, value);
  };
}

function attrFunction(name, value) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttribute(name);else this.setAttribute(name, v);
  };
}

function attrFunctionNS(fullname, value) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttributeNS(fullname.space, fullname.local);else this.setAttributeNS(fullname.space, fullname.local, v);
  };
}

var selection_attr = function (name, value) {
  var fullname = namespace(name);

  if (arguments.length < 2) {
    var node = this.node();
    return fullname.local ? node.getAttributeNS(fullname.space, fullname.local) : node.getAttribute(fullname);
  }

  return this.each((value == null ? fullname.local ? attrRemoveNS : attrRemove : typeof value === "function" ? fullname.local ? attrFunctionNS : attrFunction : fullname.local ? attrConstantNS : attrConstant)(fullname, value));
};

var defaultView = function (node) {
    return node.ownerDocument && node.ownerDocument.defaultView || // node is a Node
    node.document && node // node is a Window
    || node.defaultView; // node is a Document
};

function styleRemove(name) {
  return function () {
    this.style.removeProperty(name);
  };
}

function styleConstant(name, value, priority) {
  return function () {
    this.style.setProperty(name, value, priority);
  };
}

function styleFunction(name, value, priority) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) this.style.removeProperty(name);else this.style.setProperty(name, v, priority);
  };
}

var selection_style = function (name, value, priority) {
  return arguments.length > 1 ? this.each((value == null ? styleRemove : typeof value === "function" ? styleFunction : styleConstant)(name, value, priority == null ? "" : priority)) : styleValue(this.node(), name);
};

function styleValue(node, name) {
  return node.style.getPropertyValue(name) || defaultView(node).getComputedStyle(node, null).getPropertyValue(name);
}

function propertyRemove(name) {
  return function () {
    delete this[name];
  };
}

function propertyConstant(name, value) {
  return function () {
    this[name] = value;
  };
}

function propertyFunction(name, value) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) delete this[name];else this[name] = v;
  };
}

var selection_property = function (name, value) {
  return arguments.length > 1 ? this.each((value == null ? propertyRemove : typeof value === "function" ? propertyFunction : propertyConstant)(name, value)) : this.node()[name];
};

function classArray(string) {
  return string.trim().split(/^|\s+/);
}

function classList(node) {
  return node.classList || new ClassList(node);
}

function ClassList(node) {
  this._node = node;
  this._names = classArray(node.getAttribute("class") || "");
}

ClassList.prototype = {
  add: function add(name) {
    var i = this._names.indexOf(name);
    if (i < 0) {
      this._names.push(name);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  remove: function remove(name) {
    var i = this._names.indexOf(name);
    if (i >= 0) {
      this._names.splice(i, 1);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  contains: function contains(name) {
    return this._names.indexOf(name) >= 0;
  }
};

function classedAdd(node, names) {
  var list = classList(node),
      i = -1,
      n = names.length;
  while (++i < n) {
    list.add(names[i]);
  }
}

function classedRemove(node, names) {
  var list = classList(node),
      i = -1,
      n = names.length;
  while (++i < n) {
    list.remove(names[i]);
  }
}

function classedTrue(names) {
  return function () {
    classedAdd(this, names);
  };
}

function classedFalse(names) {
  return function () {
    classedRemove(this, names);
  };
}

function classedFunction(names, value) {
  return function () {
    (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
  };
}

var selection_classed = function (name, value) {
  var names = classArray(name + "");

  if (arguments.length < 2) {
    var list = classList(this.node()),
        i = -1,
        n = names.length;
    while (++i < n) {
      if (!list.contains(names[i])) return false;
    }return true;
  }

  return this.each((typeof value === "function" ? classedFunction : value ? classedTrue : classedFalse)(names, value));
};

function textRemove() {
  this.textContent = "";
}

function textConstant(value) {
  return function () {
    this.textContent = value;
  };
}

function textFunction(value) {
  return function () {
    var v = value.apply(this, arguments);
    this.textContent = v == null ? "" : v;
  };
}

var selection_text = function (value) {
  return arguments.length ? this.each(value == null ? textRemove : (typeof value === "function" ? textFunction : textConstant)(value)) : this.node().textContent;
};

function htmlRemove() {
  this.innerHTML = "";
}

function htmlConstant(value) {
  return function () {
    this.innerHTML = value;
  };
}

function htmlFunction(value) {
  return function () {
    var v = value.apply(this, arguments);
    this.innerHTML = v == null ? "" : v;
  };
}

var selection_html = function (value) {
  return arguments.length ? this.each(value == null ? htmlRemove : (typeof value === "function" ? htmlFunction : htmlConstant)(value)) : this.node().innerHTML;
};

function raise() {
  if (this.nextSibling) this.parentNode.appendChild(this);
}

var selection_raise = function () {
  return this.each(raise);
};

function lower() {
  if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
}

var selection_lower = function () {
  return this.each(lower);
};

var selection_append = function (name) {
  var create = typeof name === "function" ? name : creator(name);
  return this.select(function () {
    return this.appendChild(create.apply(this, arguments));
  });
};

function constantNull() {
  return null;
}

var selection_insert = function (name, before) {
  var create = typeof name === "function" ? name : creator(name),
      select = before == null ? constantNull : typeof before === "function" ? before : selector(before);
  return this.select(function () {
    return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
  });
};

function remove() {
  var parent = this.parentNode;
  if (parent) parent.removeChild(this);
}

var selection_remove = function () {
  return this.each(remove);
};

var selection_datum = function (value) {
    return arguments.length ? this.property("__data__", value) : this.node().__data__;
};

function dispatchEvent(node, type, params) {
  var window = defaultView(node),
      event = window.CustomEvent;

  if (typeof event === "function") {
    event = new event(type, params);
  } else {
    event = window.document.createEvent("Event");
    if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;else event.initEvent(type, false, false);
  }

  node.dispatchEvent(event);
}

function dispatchConstant(type, params) {
  return function () {
    return dispatchEvent(this, type, params);
  };
}

function dispatchFunction(type, params) {
  return function () {
    return dispatchEvent(this, type, params.apply(this, arguments));
  };
}

var selection_dispatch = function (type, params) {
  return this.each((typeof params === "function" ? dispatchFunction : dispatchConstant)(type, params));
};

var root$1 = [null];

function Selection(groups, parents) {
  this._groups = groups;
  this._parents = parents;
}

function selection() {
  return new Selection([[document.documentElement]], root$1);
}

Selection.prototype = selection.prototype = {
  constructor: Selection,
  select: selection_select,
  selectAll: selection_selectAll,
  filter: selection_filter,
  data: selection_data,
  enter: selection_enter,
  exit: selection_exit,
  merge: selection_merge,
  order: selection_order,
  sort: selection_sort,
  call: selection_call,
  nodes: selection_nodes,
  node: selection_node,
  size: selection_size,
  empty: selection_empty,
  each: selection_each,
  attr: selection_attr,
  style: selection_style,
  property: selection_property,
  classed: selection_classed,
  text: selection_text,
  html: selection_html,
  raise: selection_raise,
  lower: selection_lower,
  append: selection_append,
  insert: selection_insert,
  remove: selection_remove,
  datum: selection_datum,
  on: selection_on,
  dispatch: selection_dispatch
};

var select = function (selector) {
    return typeof selector === "string" ? new Selection([[document.querySelector(selector)]], [document.documentElement]) : new Selection([[selector]], root$1);
};

var noop = { value: function value() {} };

function dispatch() {
  for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
    if (!(t = arguments[i] + "") || t in _) throw new Error("illegal type: " + t);
    _[t] = [];
  }
  return new Dispatch(_);
}

function Dispatch(_) {
  this._ = _;
}

function parseTypenames$1(typenames, types) {
  return typenames.trim().split(/^|\s+/).map(function (t) {
    var name = "",
        i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
    return { type: t, name: name };
  });
}

Dispatch.prototype = dispatch.prototype = {
  constructor: Dispatch,
  on: function on(typename, callback) {
    var _ = this._,
        T = parseTypenames$1(typename + "", _),
        t,
        i = -1,
        n = T.length;

    // If no callback was specified, return the callback of the given type and name.
    if (arguments.length < 2) {
      while (++i < n) {
        if ((t = (typename = T[i]).type) && (t = get(_[t], typename.name))) return t;
      }return;
    }

    // If a type was specified, set the callback for the given type and name.
    // Otherwise, if a null callback was specified, remove callbacks of the given name.
    if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
    while (++i < n) {
      if (t = (typename = T[i]).type) _[t] = set(_[t], typename.name, callback);else if (callback == null) for (t in _) {
        _[t] = set(_[t], typename.name, null);
      }
    }

    return this;
  },
  copy: function copy() {
    var copy = {},
        _ = this._;
    for (var t in _) {
      copy[t] = _[t].slice();
    }return new Dispatch(copy);
  },
  call: function call(type, that) {
    if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) {
      args[i] = arguments[i + 2];
    }if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (t = this._[type], i = 0, n = t.length; i < n; ++i) {
      t[i].value.apply(that, args);
    }
  },
  apply: function apply(type, that, args) {
    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (var t = this._[type], i = 0, n = t.length; i < n; ++i) {
      t[i].value.apply(that, args);
    }
  }
};

function get(type, name) {
  for (var i = 0, n = type.length, c; i < n; ++i) {
    if ((c = type[i]).name === name) {
      return c.value;
    }
  }
}

function set(type, name, callback) {
  for (var i = 0, n = type.length; i < n; ++i) {
    if (type[i].name === name) {
      type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
      break;
    }
  }
  if (callback != null) type.push({ name: name, value: callback });
  return type;
}



var index = Object.freeze({
	dispatch: dispatch
});

var _typeof$1 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};











var classCallCheck$1 = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass$1 = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();







var get$2 = function get(object, property, receiver) {
  if (object === null) object = Function.prototype;
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent === null) {
      return undefined;
    } else {
      return get(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;

    if (getter === undefined) {
      return undefined;
    }

    return getter.call(receiver);
  }
};

var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};











var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

var frame = 0;
var timeout = 0;
var interval = 0;
var pokeDelay = 1000;
var taskHead;
var taskTail;
var clockLast = 0;
var clockNow = 0;
var clockSkew = 0;
var clock = (typeof performance === "undefined" ? "undefined" : _typeof$1(performance)) === "object" && performance.now ? performance : Date;
var setFrame = (typeof window === "undefined" ? "undefined" : _typeof$1(window)) === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function (f) {
  setTimeout(f, 17);
};

function now() {
  return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
}

function clearNow() {
  clockNow = 0;
}

function Timer() {
  this._call = this._time = this._next = null;
}

Timer.prototype = timer.prototype = {
  constructor: Timer,
  restart: function restart(callback, delay, time) {
    if (typeof callback !== "function") throw new TypeError("callback is not a function");
    time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
    if (!this._next && taskTail !== this) {
      if (taskTail) taskTail._next = this;else taskHead = this;
      taskTail = this;
    }
    this._call = callback;
    this._time = time;
    sleep();
  },
  stop: function stop() {
    if (this._call) {
      this._call = null;
      this._time = Infinity;
      sleep();
    }
  }
};

function timer(callback, delay, time) {
  var t = new Timer();
  t.restart(callback, delay, time);
  return t;
}

function timerFlush() {
  now(); // Get the current time, if not already set.
  ++frame; // Pretend we’ve set an alarm, if we haven’t already.
  var t = taskHead,
      e;
  while (t) {
    if ((e = clockNow - t._time) >= 0) t._call.call(null, e);
    t = t._next;
  }
  --frame;
}

function wake() {
  clockNow = (clockLast = clock.now()) + clockSkew;
  frame = timeout = 0;
  try {
    timerFlush();
  } finally {
    frame = 0;
    nap();
    clockNow = 0;
  }
}

function poke() {
  var now = clock.now(),
      delay = now - clockLast;
  if (delay > pokeDelay) clockSkew -= delay, clockLast = now;
}

function nap() {
  var t0,
      t1 = taskHead,
      t2,
      time = Infinity;
  while (t1) {
    if (t1._call) {
      if (time > t1._time) time = t1._time;
      t0 = t1, t1 = t1._next;
    } else {
      t2 = t1._next, t1._next = null;
      t1 = t0 ? t0._next = t2 : taskHead = t2;
    }
  }
  taskTail = t0;
  sleep(time);
}

function sleep(time) {
  if (frame) return; // Soonest alarm already set, or will be.
  if (timeout) timeout = clearTimeout(timeout);
  var delay = time - clockNow;
  if (delay > 24) {
    if (time < Infinity) timeout = setTimeout(wake, delay);
    if (interval) interval = clearInterval(interval);
  } else {
    if (!interval) clockLast = clockNow, interval = setInterval(poke, pokeDelay);
    frame = 1, setFrame(wake);
  }
}

var timeout$1 = function (callback, delay, time) {
  var t = new Timer();
  delay = delay == null ? 0 : +delay;
  t.restart(function (elapsed) {
    t.stop();
    callback(elapsed + delay);
  }, delay, time);
  return t;
};

var emptyOn = dispatch("start", "end", "interrupt");
var emptyTween = [];

var CREATED = 0;
var SCHEDULED = 1;
var STARTING = 2;
var STARTED = 3;
var RUNNING = 4;
var ENDING = 5;
var ENDED = 6;

var schedule = function (node, name, id, index, group, timing) {
  var schedules = node.__transition;
  if (!schedules) node.__transition = {};else if (id in schedules) return;
  create(node, id, {
    name: name,
    index: index, // For context during callback.
    group: group, // For context during callback.
    on: emptyOn,
    tween: emptyTween,
    time: timing.time,
    delay: timing.delay,
    duration: timing.duration,
    ease: timing.ease,
    timer: null,
    state: CREATED
  });
};

function init(node, id) {
  var schedule = node.__transition;
  if (!schedule || !(schedule = schedule[id]) || schedule.state > CREATED) throw new Error("too late");
  return schedule;
}

function set$1(node, id) {
  var schedule = node.__transition;
  if (!schedule || !(schedule = schedule[id]) || schedule.state > STARTING) throw new Error("too late");
  return schedule;
}

function get$1$1(node, id) {
  var schedule = node.__transition;
  if (!schedule || !(schedule = schedule[id])) throw new Error("too late");
  return schedule;
}

function create(node, id, self) {
  var schedules = node.__transition,
      tween;

  // Initialize the self timer when the transition is created.
  // Note the actual delay is not known until the first callback!
  schedules[id] = self;
  self.timer = timer(schedule, 0, self.time);

  function schedule(elapsed) {
    self.state = SCHEDULED;
    self.timer.restart(start, self.delay, self.time);

    // If the elapsed delay is less than our first sleep, start immediately.
    if (self.delay <= elapsed) start(elapsed - self.delay);
  }

  function start(elapsed) {
    var i, j, n, o;

    // If the state is not SCHEDULED, then we previously errored on start.
    if (self.state !== SCHEDULED) return stop();

    for (i in schedules) {
      o = schedules[i];
      if (o.name !== self.name) continue;

      // While this element already has a starting transition during this frame,
      // defer starting an interrupting transition until that transition has a
      // chance to tick (and possibly end); see d3/d3-transition#54!
      if (o.state === STARTED) return timeout$1(start);

      // Interrupt the active transition, if any.
      // Dispatch the interrupt event.
      if (o.state === RUNNING) {
        o.state = ENDED;
        o.timer.stop();
        o.on.call("interrupt", node, node.__data__, o.index, o.group);
        delete schedules[i];
      }

      // Cancel any pre-empted transitions. No interrupt event is dispatched
      // because the cancelled transitions never started. Note that this also
      // removes this transition from the pending list!
      else if (+i < id) {
          o.state = ENDED;
          o.timer.stop();
          delete schedules[i];
        }
    }

    // Defer the first tick to end of the current frame; see d3/d3#1576.
    // Note the transition may be canceled after start and before the first tick!
    // Note this must be scheduled before the start event; see d3/d3-transition#16!
    // Assuming this is successful, subsequent callbacks go straight to tick.
    timeout$1(function () {
      if (self.state === STARTED) {
        self.state = RUNNING;
        self.timer.restart(tick, self.delay, self.time);
        tick(elapsed);
      }
    });

    // Dispatch the start event.
    // Note this must be done before the tween are initialized.
    self.state = STARTING;
    self.on.call("start", node, node.__data__, self.index, self.group);
    if (self.state !== STARTING) return; // interrupted
    self.state = STARTED;

    // Initialize the tween, deleting null tween.
    tween = new Array(n = self.tween.length);
    for (i = 0, j = -1; i < n; ++i) {
      if (o = self.tween[i].value.call(node, node.__data__, self.index, self.group)) {
        tween[++j] = o;
      }
    }
    tween.length = j + 1;
  }

  function tick(elapsed) {
    var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING, 1),
        i = -1,
        n = tween.length;

    while (++i < n) {
      tween[i].call(null, t);
    }

    // Dispatch the end event.
    if (self.state === ENDING) {
      self.on.call("end", node, node.__data__, self.index, self.group);
      stop();
    }
  }

  function stop() {
    self.state = ENDED;
    self.timer.stop();
    delete schedules[id];
    for (var i in schedules) {
      return;
    } // eslint-disable-line no-unused-vars
    delete node.__transition;
  }
}

var interrupt = function (node, name) {
  var schedules = node.__transition,
      schedule$$1,
      active,
      empty = true,
      i;

  if (!schedules) return;

  name = name == null ? null : name + "";

  for (i in schedules) {
    if ((schedule$$1 = schedules[i]).name !== name) {
      empty = false;continue;
    }
    active = schedule$$1.state > STARTING && schedule$$1.state < ENDING;
    schedule$$1.state = ENDED;
    schedule$$1.timer.stop();
    if (active) schedule$$1.on.call("interrupt", node, node.__data__, schedule$$1.index, schedule$$1.group);
    delete schedules[i];
  }

  if (empty) delete node.__transition;
};

var selection_interrupt = function (name) {
  return this.each(function () {
    interrupt(this, name);
  });
};

var define = function (constructor, factory, prototype) {
  constructor.prototype = factory.prototype = prototype;
  prototype.constructor = constructor;
};

function extend(parent, definition) {
  var prototype = Object.create(parent.prototype);
  for (var key in definition) {
    prototype[key] = definition[key];
  }return prototype;
}

function Color() {}

var _darker = 0.7;
var _brighter = 1 / _darker;

var reI = "\\s*([+-]?\\d+)\\s*";
var reN = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\s*";
var reP = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)%\\s*";
var reHex3 = /^#([0-9a-f]{3})$/;
var reHex6 = /^#([0-9a-f]{6})$/;
var reRgbInteger = new RegExp("^rgb\\(" + [reI, reI, reI] + "\\)$");
var reRgbPercent = new RegExp("^rgb\\(" + [reP, reP, reP] + "\\)$");
var reRgbaInteger = new RegExp("^rgba\\(" + [reI, reI, reI, reN] + "\\)$");
var reRgbaPercent = new RegExp("^rgba\\(" + [reP, reP, reP, reN] + "\\)$");
var reHslPercent = new RegExp("^hsl\\(" + [reN, reP, reP] + "\\)$");
var reHslaPercent = new RegExp("^hsla\\(" + [reN, reP, reP, reN] + "\\)$");

var named = {
  aliceblue: 0xf0f8ff,
  antiquewhite: 0xfaebd7,
  aqua: 0x00ffff,
  aquamarine: 0x7fffd4,
  azure: 0xf0ffff,
  beige: 0xf5f5dc,
  bisque: 0xffe4c4,
  black: 0x000000,
  blanchedalmond: 0xffebcd,
  blue: 0x0000ff,
  blueviolet: 0x8a2be2,
  brown: 0xa52a2a,
  burlywood: 0xdeb887,
  cadetblue: 0x5f9ea0,
  chartreuse: 0x7fff00,
  chocolate: 0xd2691e,
  coral: 0xff7f50,
  cornflowerblue: 0x6495ed,
  cornsilk: 0xfff8dc,
  crimson: 0xdc143c,
  cyan: 0x00ffff,
  darkblue: 0x00008b,
  darkcyan: 0x008b8b,
  darkgoldenrod: 0xb8860b,
  darkgray: 0xa9a9a9,
  darkgreen: 0x006400,
  darkgrey: 0xa9a9a9,
  darkkhaki: 0xbdb76b,
  darkmagenta: 0x8b008b,
  darkolivegreen: 0x556b2f,
  darkorange: 0xff8c00,
  darkorchid: 0x9932cc,
  darkred: 0x8b0000,
  darksalmon: 0xe9967a,
  darkseagreen: 0x8fbc8f,
  darkslateblue: 0x483d8b,
  darkslategray: 0x2f4f4f,
  darkslategrey: 0x2f4f4f,
  darkturquoise: 0x00ced1,
  darkviolet: 0x9400d3,
  deeppink: 0xff1493,
  deepskyblue: 0x00bfff,
  dimgray: 0x696969,
  dimgrey: 0x696969,
  dodgerblue: 0x1e90ff,
  firebrick: 0xb22222,
  floralwhite: 0xfffaf0,
  forestgreen: 0x228b22,
  fuchsia: 0xff00ff,
  gainsboro: 0xdcdcdc,
  ghostwhite: 0xf8f8ff,
  gold: 0xffd700,
  goldenrod: 0xdaa520,
  gray: 0x808080,
  green: 0x008000,
  greenyellow: 0xadff2f,
  grey: 0x808080,
  honeydew: 0xf0fff0,
  hotpink: 0xff69b4,
  indianred: 0xcd5c5c,
  indigo: 0x4b0082,
  ivory: 0xfffff0,
  khaki: 0xf0e68c,
  lavender: 0xe6e6fa,
  lavenderblush: 0xfff0f5,
  lawngreen: 0x7cfc00,
  lemonchiffon: 0xfffacd,
  lightblue: 0xadd8e6,
  lightcoral: 0xf08080,
  lightcyan: 0xe0ffff,
  lightgoldenrodyellow: 0xfafad2,
  lightgray: 0xd3d3d3,
  lightgreen: 0x90ee90,
  lightgrey: 0xd3d3d3,
  lightpink: 0xffb6c1,
  lightsalmon: 0xffa07a,
  lightseagreen: 0x20b2aa,
  lightskyblue: 0x87cefa,
  lightslategray: 0x778899,
  lightslategrey: 0x778899,
  lightsteelblue: 0xb0c4de,
  lightyellow: 0xffffe0,
  lime: 0x00ff00,
  limegreen: 0x32cd32,
  linen: 0xfaf0e6,
  magenta: 0xff00ff,
  maroon: 0x800000,
  mediumaquamarine: 0x66cdaa,
  mediumblue: 0x0000cd,
  mediumorchid: 0xba55d3,
  mediumpurple: 0x9370db,
  mediumseagreen: 0x3cb371,
  mediumslateblue: 0x7b68ee,
  mediumspringgreen: 0x00fa9a,
  mediumturquoise: 0x48d1cc,
  mediumvioletred: 0xc71585,
  midnightblue: 0x191970,
  mintcream: 0xf5fffa,
  mistyrose: 0xffe4e1,
  moccasin: 0xffe4b5,
  navajowhite: 0xffdead,
  navy: 0x000080,
  oldlace: 0xfdf5e6,
  olive: 0x808000,
  olivedrab: 0x6b8e23,
  orange: 0xffa500,
  orangered: 0xff4500,
  orchid: 0xda70d6,
  palegoldenrod: 0xeee8aa,
  palegreen: 0x98fb98,
  paleturquoise: 0xafeeee,
  palevioletred: 0xdb7093,
  papayawhip: 0xffefd5,
  peachpuff: 0xffdab9,
  peru: 0xcd853f,
  pink: 0xffc0cb,
  plum: 0xdda0dd,
  powderblue: 0xb0e0e6,
  purple: 0x800080,
  rebeccapurple: 0x663399,
  red: 0xff0000,
  rosybrown: 0xbc8f8f,
  royalblue: 0x4169e1,
  saddlebrown: 0x8b4513,
  salmon: 0xfa8072,
  sandybrown: 0xf4a460,
  seagreen: 0x2e8b57,
  seashell: 0xfff5ee,
  sienna: 0xa0522d,
  silver: 0xc0c0c0,
  skyblue: 0x87ceeb,
  slateblue: 0x6a5acd,
  slategray: 0x708090,
  slategrey: 0x708090,
  snow: 0xfffafa,
  springgreen: 0x00ff7f,
  steelblue: 0x4682b4,
  tan: 0xd2b48c,
  teal: 0x008080,
  thistle: 0xd8bfd8,
  tomato: 0xff6347,
  turquoise: 0x40e0d0,
  violet: 0xee82ee,
  wheat: 0xf5deb3,
  white: 0xffffff,
  whitesmoke: 0xf5f5f5,
  yellow: 0xffff00,
  yellowgreen: 0x9acd32
};

define(Color, color, {
  displayable: function displayable() {
    return this.rgb().displayable();
  },
  toString: function toString() {
    return this.rgb() + "";
  }
});

function color(format) {
  var m;
  format = (format + "").trim().toLowerCase();
  return (m = reHex3.exec(format)) ? (m = parseInt(m[1], 16), new Rgb(m >> 8 & 0xf | m >> 4 & 0x0f0, m >> 4 & 0xf | m & 0xf0, (m & 0xf) << 4 | m & 0xf, 1) // #f00
  ) : (m = reHex6.exec(format)) ? rgbn(parseInt(m[1], 16)) // #ff0000
  : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
  : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
  : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
  : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
  : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
  : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
  : named.hasOwnProperty(format) ? rgbn(named[format]) : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0) : null;
}

function rgbn(n) {
  return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
}

function rgba(r, g, b, a) {
  if (a <= 0) r = g = b = NaN;
  return new Rgb(r, g, b, a);
}

function rgbConvert(o) {
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Rgb();
  o = o.rgb();
  return new Rgb(o.r, o.g, o.b, o.opacity);
}

function rgb(r, g, b, opacity) {
  return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
}

function Rgb(r, g, b, opacity) {
  this.r = +r;
  this.g = +g;
  this.b = +b;
  this.opacity = +opacity;
}

define(Rgb, rgb, extend(Color, {
  brighter: function brighter(k) {
    k = k == null ? _brighter : Math.pow(_brighter, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  darker: function darker(k) {
    k = k == null ? _darker : Math.pow(_darker, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  rgb: function rgb() {
    return this;
  },
  displayable: function displayable() {
    return 0 <= this.r && this.r <= 255 && 0 <= this.g && this.g <= 255 && 0 <= this.b && this.b <= 255 && 0 <= this.opacity && this.opacity <= 1;
  },
  toString: function toString() {
    var a = this.opacity;a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
    return (a === 1 ? "rgb(" : "rgba(") + Math.max(0, Math.min(255, Math.round(this.r) || 0)) + ", " + Math.max(0, Math.min(255, Math.round(this.g) || 0)) + ", " + Math.max(0, Math.min(255, Math.round(this.b) || 0)) + (a === 1 ? ")" : ", " + a + ")");
  }
}));

function hsla(h, s, l, a) {
  if (a <= 0) h = s = l = NaN;else if (l <= 0 || l >= 1) h = s = NaN;else if (s <= 0) h = NaN;
  return new Hsl(h, s, l, a);
}

function hslConvert(o) {
  if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Hsl();
  if (o instanceof Hsl) return o;
  o = o.rgb();
  var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      min = Math.min(r, g, b),
      max = Math.max(r, g, b),
      h = NaN,
      s = max - min,
      l = (max + min) / 2;
  if (s) {
    if (r === max) h = (g - b) / s + (g < b) * 6;else if (g === max) h = (b - r) / s + 2;else h = (r - g) / s + 4;
    s /= l < 0.5 ? max + min : 2 - max - min;
    h *= 60;
  } else {
    s = l > 0 && l < 1 ? 0 : h;
  }
  return new Hsl(h, s, l, o.opacity);
}

function hsl(h, s, l, opacity) {
  return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
}

function Hsl(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}

define(Hsl, hsl, extend(Color, {
  brighter: function brighter(k) {
    k = k == null ? _brighter : Math.pow(_brighter, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  darker: function darker(k) {
    k = k == null ? _darker : Math.pow(_darker, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  rgb: function rgb() {
    var h = this.h % 360 + (this.h < 0) * 360,
        s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
        l = this.l,
        m2 = l + (l < 0.5 ? l : 1 - l) * s,
        m1 = 2 * l - m2;
    return new Rgb(hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2), hsl2rgb(h, m1, m2), hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2), this.opacity);
  },
  displayable: function displayable() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && 0 <= this.l && this.l <= 1 && 0 <= this.opacity && this.opacity <= 1;
  }
}));

/* From FvD 13.37, CSS Color Module Level 3 */
function hsl2rgb(h, m1, m2) {
  return (h < 60 ? m1 + (m2 - m1) * h / 60 : h < 180 ? m2 : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60 : m1) * 255;
}

var deg2rad = Math.PI / 180;
var rad2deg = 180 / Math.PI;

var Kn = 18;
var Xn = 0.950470;
var Yn = 1;
var Zn = 1.088830;
var t0 = 4 / 29;
var t1 = 6 / 29;
var t2 = 3 * t1 * t1;
var t3 = t1 * t1 * t1;

function labConvert(o) {
  if (o instanceof Lab) return new Lab(o.l, o.a, o.b, o.opacity);
  if (o instanceof Hcl) {
    var h = o.h * deg2rad;
    return new Lab(o.l, Math.cos(h) * o.c, Math.sin(h) * o.c, o.opacity);
  }
  if (!(o instanceof Rgb)) o = rgbConvert(o);
  var b = rgb2xyz(o.r),
      a = rgb2xyz(o.g),
      l = rgb2xyz(o.b),
      x = xyz2lab((0.4124564 * b + 0.3575761 * a + 0.1804375 * l) / Xn),
      y = xyz2lab((0.2126729 * b + 0.7151522 * a + 0.0721750 * l) / Yn),
      z = xyz2lab((0.0193339 * b + 0.1191920 * a + 0.9503041 * l) / Zn);
  return new Lab(116 * y - 16, 500 * (x - y), 200 * (y - z), o.opacity);
}

function lab(l, a, b, opacity) {
  return arguments.length === 1 ? labConvert(l) : new Lab(l, a, b, opacity == null ? 1 : opacity);
}

function Lab(l, a, b, opacity) {
  this.l = +l;
  this.a = +a;
  this.b = +b;
  this.opacity = +opacity;
}

define(Lab, lab, extend(Color, {
  brighter: function brighter(k) {
    return new Lab(this.l + Kn * (k == null ? 1 : k), this.a, this.b, this.opacity);
  },
  darker: function darker(k) {
    return new Lab(this.l - Kn * (k == null ? 1 : k), this.a, this.b, this.opacity);
  },
  rgb: function rgb$$1() {
    var y = (this.l + 16) / 116,
        x = isNaN(this.a) ? y : y + this.a / 500,
        z = isNaN(this.b) ? y : y - this.b / 200;
    y = Yn * lab2xyz(y);
    x = Xn * lab2xyz(x);
    z = Zn * lab2xyz(z);
    return new Rgb(xyz2rgb(3.2404542 * x - 1.5371385 * y - 0.4985314 * z), // D65 -> sRGB
    xyz2rgb(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z), xyz2rgb(0.0556434 * x - 0.2040259 * y + 1.0572252 * z), this.opacity);
  }
}));

function xyz2lab(t) {
  return t > t3 ? Math.pow(t, 1 / 3) : t / t2 + t0;
}

function lab2xyz(t) {
  return t > t1 ? t * t * t : t2 * (t - t0);
}

function xyz2rgb(x) {
  return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
}

function rgb2xyz(x) {
  return (x /= 255) <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

function hclConvert(o) {
  if (o instanceof Hcl) return new Hcl(o.h, o.c, o.l, o.opacity);
  if (!(o instanceof Lab)) o = labConvert(o);
  var h = Math.atan2(o.b, o.a) * rad2deg;
  return new Hcl(h < 0 ? h + 360 : h, Math.sqrt(o.a * o.a + o.b * o.b), o.l, o.opacity);
}

function hcl(h, c, l, opacity) {
  return arguments.length === 1 ? hclConvert(h) : new Hcl(h, c, l, opacity == null ? 1 : opacity);
}

function Hcl(h, c, l, opacity) {
  this.h = +h;
  this.c = +c;
  this.l = +l;
  this.opacity = +opacity;
}

define(Hcl, hcl, extend(Color, {
  brighter: function brighter(k) {
    return new Hcl(this.h, this.c, this.l + Kn * (k == null ? 1 : k), this.opacity);
  },
  darker: function darker(k) {
    return new Hcl(this.h, this.c, this.l - Kn * (k == null ? 1 : k), this.opacity);
  },
  rgb: function rgb$$1() {
    return labConvert(this).rgb();
  }
}));

var A = -0.14861;
var B = +1.78277;
var C = -0.29227;
var D = -0.90649;
var E = +1.97294;
var ED = E * D;
var EB = E * B;
var BC_DA = B * C - D * A;

function cubehelixConvert(o) {
  if (o instanceof Cubehelix) return new Cubehelix(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Rgb)) o = rgbConvert(o);
  var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      l = (BC_DA * b + ED * r - EB * g) / (BC_DA + ED - EB),
      bl = b - l,
      k = (E * (g - l) - C * bl) / D,
      s = Math.sqrt(k * k + bl * bl) / (E * l * (1 - l)),
      // NaN if l=0 or l=1
  h = s ? Math.atan2(k, bl) * rad2deg - 120 : NaN;
  return new Cubehelix(h < 0 ? h + 360 : h, s, l, o.opacity);
}

function cubehelix(h, s, l, opacity) {
  return arguments.length === 1 ? cubehelixConvert(h) : new Cubehelix(h, s, l, opacity == null ? 1 : opacity);
}

function Cubehelix(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}

define(Cubehelix, cubehelix, extend(Color, {
  brighter: function brighter(k) {
    k = k == null ? _brighter : Math.pow(_brighter, k);
    return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
  },
  darker: function darker(k) {
    k = k == null ? _darker : Math.pow(_darker, k);
    return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
  },
  rgb: function rgb$$1() {
    var h = isNaN(this.h) ? 0 : (this.h + 120) * deg2rad,
        l = +this.l,
        a = isNaN(this.s) ? 0 : this.s * l * (1 - l),
        cosh = Math.cos(h),
        sinh = Math.sin(h);
    return new Rgb(255 * (l + a * (A * cosh + B * sinh)), 255 * (l + a * (C * cosh + D * sinh)), 255 * (l + a * (E * cosh)), this.opacity);
  }
}));

function basis(t1, v0, v1, v2, v3) {
  var t2 = t1 * t1,
      t3 = t2 * t1;
  return ((1 - 3 * t1 + 3 * t2 - t3) * v0 + (4 - 6 * t2 + 3 * t3) * v1 + (1 + 3 * t1 + 3 * t2 - 3 * t3) * v2 + t3 * v3) / 6;
}

var basis$1 = function (values) {
  var n = values.length - 1;
  return function (t) {
    var i = t <= 0 ? t = 0 : t >= 1 ? (t = 1, n - 1) : Math.floor(t * n),
        v1 = values[i],
        v2 = values[i + 1],
        v0 = i > 0 ? values[i - 1] : 2 * v1 - v2,
        v3 = i < n - 1 ? values[i + 2] : 2 * v2 - v1;
    return basis((t - i / n) * n, v0, v1, v2, v3);
  };
};

var constant$2 = function (x) {
  return function () {
    return x;
  };
};

function linear(a, d) {
  return function (t) {
    return a + t * d;
  };
}

function exponential(a, b, y) {
  return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function (t) {
    return Math.pow(a + t * b, y);
  };
}

function hue(a, b) {
  var d = b - a;
  return d ? linear(a, d > 180 || d < -180 ? d - 360 * Math.round(d / 360) : d) : constant$2(isNaN(a) ? b : a);
}

function gamma(y) {
  return (y = +y) === 1 ? nogamma : function (a, b) {
    return b - a ? exponential(a, b, y) : constant$2(isNaN(a) ? b : a);
  };
}

function nogamma(a, b) {
  var d = b - a;
  return d ? linear(a, d) : constant$2(isNaN(a) ? b : a);
}

var interpolateRgb = (function rgbGamma(y) {
  var color$$1 = gamma(y);

  function rgb$$1(start, end) {
    var r = color$$1((start = rgb(start)).r, (end = rgb(end)).r),
        g = color$$1(start.g, end.g),
        b = color$$1(start.b, end.b),
        opacity = nogamma(start.opacity, end.opacity);
    return function (t) {
      start.r = r(t);
      start.g = g(t);
      start.b = b(t);
      start.opacity = opacity(t);
      return start + "";
    };
  }

  rgb$$1.gamma = rgbGamma;

  return rgb$$1;
})(1);

function rgbSpline(spline) {
  return function (colors) {
    var n = colors.length,
        r = new Array(n),
        g = new Array(n),
        b = new Array(n),
        i,
        color$$1;
    for (i = 0; i < n; ++i) {
      color$$1 = rgb(colors[i]);
      r[i] = color$$1.r || 0;
      g[i] = color$$1.g || 0;
      b[i] = color$$1.b || 0;
    }
    r = spline(r);
    g = spline(g);
    b = spline(b);
    color$$1.opacity = 1;
    return function (t) {
      color$$1.r = r(t);
      color$$1.g = g(t);
      color$$1.b = b(t);
      return color$$1 + "";
    };
  };
}

var rgbBasis = rgbSpline(basis$1);

var array = function (a, b) {
  var nb = b ? b.length : 0,
      na = a ? Math.min(nb, a.length) : 0,
      x = new Array(nb),
      c = new Array(nb),
      i;

  for (i = 0; i < na; ++i) {
    x[i] = interpolate(a[i], b[i]);
  }for (; i < nb; ++i) {
    c[i] = b[i];
  }return function (t) {
    for (i = 0; i < na; ++i) {
      c[i] = x[i](t);
    }return c;
  };
};

var date = function (a, b) {
  var d = new Date();
  return a = +a, b -= a, function (t) {
    return d.setTime(a + b * t), d;
  };
};

var reinterpolate = function (a, b) {
  return a = +a, b -= a, function (t) {
    return a + b * t;
  };
};

var object = function (a, b) {
  var i = {},
      c = {},
      k;

  if (a === null || (typeof a === "undefined" ? "undefined" : _typeof$1(a)) !== "object") a = {};
  if (b === null || (typeof b === "undefined" ? "undefined" : _typeof$1(b)) !== "object") b = {};

  for (k in b) {
    if (k in a) {
      i[k] = interpolate(a[k], b[k]);
    } else {
      c[k] = b[k];
    }
  }

  return function (t) {
    for (k in i) {
      c[k] = i[k](t);
    }return c;
  };
};

var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
var reB = new RegExp(reA.source, "g");

function zero(b) {
  return function () {
    return b;
  };
}

function one(b) {
  return function (t) {
    return b(t) + "";
  };
}

var interpolateString = function (a, b) {
  var bi = reA.lastIndex = reB.lastIndex = 0,
      // scan index for next number in b
  am,
      // current match in a
  bm,
      // current match in b
  bs,
      // string preceding current number in b, if any
  i = -1,
      // index in s
  s = [],
      // string constants and placeholders
  q = []; // number interpolators

  // Coerce inputs to strings.
  a = a + "", b = b + "";

  // Interpolate pairs of numbers in a & b.
  while ((am = reA.exec(a)) && (bm = reB.exec(b))) {
    if ((bs = bm.index) > bi) {
      // a string precedes the next number in b
      bs = b.slice(bi, bs);
      if (s[i]) s[i] += bs; // coalesce with previous string
      else s[++i] = bs;
    }
    if ((am = am[0]) === (bm = bm[0])) {
      // numbers in a & b match
      if (s[i]) s[i] += bm; // coalesce with previous string
      else s[++i] = bm;
    } else {
      // interpolate non-matching numbers
      s[++i] = null;
      q.push({ i: i, x: reinterpolate(am, bm) });
    }
    bi = reB.lastIndex;
  }

  // Add remains of b.
  if (bi < b.length) {
    bs = b.slice(bi);
    if (s[i]) s[i] += bs; // coalesce with previous string
    else s[++i] = bs;
  }

  // Special optimization for only a single match.
  // Otherwise, interpolate each of the numbers and rejoin the string.
  return s.length < 2 ? q[0] ? one(q[0].x) : zero(b) : (b = q.length, function (t) {
    for (var i = 0, o; i < b; ++i) {
      s[(o = q[i]).i] = o.x(t);
    }return s.join("");
  });
};

var interpolate = function (a, b) {
    var t = typeof b === "undefined" ? "undefined" : _typeof$1(b),
        c;
    return b == null || t === "boolean" ? constant$2(b) : (t === "number" ? reinterpolate : t === "string" ? (c = color(b)) ? (b = c, interpolateRgb) : interpolateString : b instanceof color ? interpolateRgb : b instanceof Date ? date : Array.isArray(b) ? array : typeof b.valueOf !== "function" && typeof b.toString !== "function" || isNaN(b) ? object : reinterpolate)(a, b);
};

var interpolateRound = function (a, b) {
  return a = +a, b -= a, function (t) {
    return Math.round(a + b * t);
  };
};

var degrees = 180 / Math.PI;

var identity$1 = {
  translateX: 0,
  translateY: 0,
  rotate: 0,
  skewX: 0,
  scaleX: 1,
  scaleY: 1
};

var decompose = function (a, b, c, d, e, f) {
  var scaleX, scaleY, skewX;
  if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
  if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
  if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
  if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
  return {
    translateX: e,
    translateY: f,
    rotate: Math.atan2(b, a) * degrees,
    skewX: Math.atan(skewX) * degrees,
    scaleX: scaleX,
    scaleY: scaleY
  };
};

var cssNode;
var cssRoot;
var cssView;
var svgNode;

function parseCss(value) {
  if (value === "none") return identity$1;
  if (!cssNode) cssNode = document.createElement("DIV"), cssRoot = document.documentElement, cssView = document.defaultView;
  cssNode.style.transform = value;
  value = cssView.getComputedStyle(cssRoot.appendChild(cssNode), null).getPropertyValue("transform");
  cssRoot.removeChild(cssNode);
  value = value.slice(7, -1).split(",");
  return decompose(+value[0], +value[1], +value[2], +value[3], +value[4], +value[5]);
}

function parseSvg(value) {
  if (value == null) return identity$1;
  if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
  svgNode.setAttribute("transform", value);
  if (!(value = svgNode.transform.baseVal.consolidate())) return identity$1;
  value = value.matrix;
  return decompose(value.a, value.b, value.c, value.d, value.e, value.f);
}

function interpolateTransform(parse, pxComma, pxParen, degParen) {

  function pop(s) {
    return s.length ? s.pop() + " " : "";
  }

  function translate(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push("translate(", null, pxComma, null, pxParen);
      q.push({ i: i - 4, x: reinterpolate(xa, xb) }, { i: i - 2, x: reinterpolate(ya, yb) });
    } else if (xb || yb) {
      s.push("translate(" + xb + pxComma + yb + pxParen);
    }
  }

  function rotate(a, b, s, q) {
    if (a !== b) {
      if (a - b > 180) b += 360;else if (b - a > 180) a += 360; // shortest path
      q.push({ i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: reinterpolate(a, b) });
    } else if (b) {
      s.push(pop(s) + "rotate(" + b + degParen);
    }
  }

  function skewX(a, b, s, q) {
    if (a !== b) {
      q.push({ i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: reinterpolate(a, b) });
    } else if (b) {
      s.push(pop(s) + "skewX(" + b + degParen);
    }
  }

  function scale(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push(pop(s) + "scale(", null, ",", null, ")");
      q.push({ i: i - 4, x: reinterpolate(xa, xb) }, { i: i - 2, x: reinterpolate(ya, yb) });
    } else if (xb !== 1 || yb !== 1) {
      s.push(pop(s) + "scale(" + xb + "," + yb + ")");
    }
  }

  return function (a, b) {
    var s = [],
        // string constants and placeholders
    q = []; // number interpolators
    a = parse(a), b = parse(b);
    translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
    rotate(a.rotate, b.rotate, s, q);
    skewX(a.skewX, b.skewX, s, q);
    scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
    a = b = null; // gc
    return function (t) {
      var i = -1,
          n = q.length,
          o;
      while (++i < n) {
        s[(o = q[i]).i] = o.x(t);
      }return s.join("");
    };
  };
}

var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");

function cubehelix$1(hue$$1) {
  return function cubehelixGamma(y) {
    y = +y;

    function cubehelix$$1(start, end) {
      var h = hue$$1((start = cubehelix(start)).h, (end = cubehelix(end)).h),
          s = nogamma(start.s, end.s),
          l = nogamma(start.l, end.l),
          opacity = nogamma(start.opacity, end.opacity);
      return function (t) {
        start.h = h(t);
        start.s = s(t);
        start.l = l(Math.pow(t, y));
        start.opacity = opacity(t);
        return start + "";
      };
    }

    cubehelix$$1.gamma = cubehelixGamma;

    return cubehelix$$1;
  }(1);
}

cubehelix$1(hue);
var cubehelixLong = cubehelix$1(nogamma);

function tweenRemove(id, name) {
  var tween0, tween1;
  return function () {
    var schedule$$1 = set$1(this, id),
        tween = schedule$$1.tween;

    // If this node shared tween with the previous node,
    // just assign the updated shared tween and we’re done!
    // Otherwise, copy-on-write.
    if (tween !== tween0) {
      tween1 = tween0 = tween;
      for (var i = 0, n = tween1.length; i < n; ++i) {
        if (tween1[i].name === name) {
          tween1 = tween1.slice();
          tween1.splice(i, 1);
          break;
        }
      }
    }

    schedule$$1.tween = tween1;
  };
}

function tweenFunction(id, name, value) {
  var tween0, tween1;
  if (typeof value !== "function") throw new Error();
  return function () {
    var schedule$$1 = set$1(this, id),
        tween = schedule$$1.tween;

    // If this node shared tween with the previous node,
    // just assign the updated shared tween and we’re done!
    // Otherwise, copy-on-write.
    if (tween !== tween0) {
      tween1 = (tween0 = tween).slice();
      for (var t = { name: name, value: value }, i = 0, n = tween1.length; i < n; ++i) {
        if (tween1[i].name === name) {
          tween1[i] = t;
          break;
        }
      }
      if (i === n) tween1.push(t);
    }

    schedule$$1.tween = tween1;
  };
}

var transition_tween = function (name, value) {
  var id = this._id;

  name += "";

  if (arguments.length < 2) {
    var tween = get$1$1(this.node(), id).tween;
    for (var i = 0, n = tween.length, t; i < n; ++i) {
      if ((t = tween[i]).name === name) {
        return t.value;
      }
    }
    return null;
  }

  return this.each((value == null ? tweenRemove : tweenFunction)(id, name, value));
};

function tweenValue(transition, name, value) {
  var id = transition._id;

  transition.each(function () {
    var schedule$$1 = set$1(this, id);
    (schedule$$1.value || (schedule$$1.value = {}))[name] = value.apply(this, arguments);
  });

  return function (node) {
    return get$1$1(node, id).value[name];
  };
}

var interpolate$1 = function (a, b) {
    var c;
    return (typeof b === "number" ? reinterpolate : b instanceof color ? interpolateRgb : (c = color(b)) ? (b = c, interpolateRgb) : interpolateString)(a, b);
};

function attrRemove$1(name) {
  return function () {
    this.removeAttribute(name);
  };
}

function attrRemoveNS$1(fullname) {
  return function () {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}

function attrConstant$1(name, interpolate$$1, value1) {
  var value00, interpolate0;
  return function () {
    var value0 = this.getAttribute(name);
    return value0 === value1 ? null : value0 === value00 ? interpolate0 : interpolate0 = interpolate$$1(value00 = value0, value1);
  };
}

function attrConstantNS$1(fullname, interpolate$$1, value1) {
  var value00, interpolate0;
  return function () {
    var value0 = this.getAttributeNS(fullname.space, fullname.local);
    return value0 === value1 ? null : value0 === value00 ? interpolate0 : interpolate0 = interpolate$$1(value00 = value0, value1);
  };
}

function attrFunction$1(name, interpolate$$1, value) {
  var value00, value10, interpolate0;
  return function () {
    var value0,
        value1 = value(this);
    if (value1 == null) return void this.removeAttribute(name);
    value0 = this.getAttribute(name);
    return value0 === value1 ? null : value0 === value00 && value1 === value10 ? interpolate0 : interpolate0 = interpolate$$1(value00 = value0, value10 = value1);
  };
}

function attrFunctionNS$1(fullname, interpolate$$1, value) {
  var value00, value10, interpolate0;
  return function () {
    var value0,
        value1 = value(this);
    if (value1 == null) return void this.removeAttributeNS(fullname.space, fullname.local);
    value0 = this.getAttributeNS(fullname.space, fullname.local);
    return value0 === value1 ? null : value0 === value00 && value1 === value10 ? interpolate0 : interpolate0 = interpolate$$1(value00 = value0, value10 = value1);
  };
}

var transition_attr = function (name, value) {
  var fullname = namespace(name),
      i = fullname === "transform" ? interpolateTransformSvg : interpolate$1;
  return this.attrTween(name, typeof value === "function" ? (fullname.local ? attrFunctionNS$1 : attrFunction$1)(fullname, i, tweenValue(this, "attr." + name, value)) : value == null ? (fullname.local ? attrRemoveNS$1 : attrRemove$1)(fullname) : (fullname.local ? attrConstantNS$1 : attrConstant$1)(fullname, i, value + ""));
};

function attrTweenNS(fullname, value) {
  function tween() {
    var node = this,
        i = value.apply(node, arguments);
    return i && function (t) {
      node.setAttributeNS(fullname.space, fullname.local, i(t));
    };
  }
  tween._value = value;
  return tween;
}

function attrTween(name, value) {
  function tween() {
    var node = this,
        i = value.apply(node, arguments);
    return i && function (t) {
      node.setAttribute(name, i(t));
    };
  }
  tween._value = value;
  return tween;
}

var transition_attrTween = function (name, value) {
  var key = "attr." + name;
  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error();
  var fullname = namespace(name);
  return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
};

function delayFunction(id, value) {
  return function () {
    init(this, id).delay = +value.apply(this, arguments);
  };
}

function delayConstant(id, value) {
  return value = +value, function () {
    init(this, id).delay = value;
  };
}

var transition_delay = function (value) {
  var id = this._id;

  return arguments.length ? this.each((typeof value === "function" ? delayFunction : delayConstant)(id, value)) : get$1$1(this.node(), id).delay;
};

function durationFunction(id, value) {
  return function () {
    set$1(this, id).duration = +value.apply(this, arguments);
  };
}

function durationConstant(id, value) {
  return value = +value, function () {
    set$1(this, id).duration = value;
  };
}

var transition_duration = function (value) {
  var id = this._id;

  return arguments.length ? this.each((typeof value === "function" ? durationFunction : durationConstant)(id, value)) : get$1$1(this.node(), id).duration;
};

function easeConstant(id, value) {
  if (typeof value !== "function") throw new Error();
  return function () {
    set$1(this, id).ease = value;
  };
}

var transition_ease = function (value) {
  var id = this._id;

  return arguments.length ? this.each(easeConstant(id, value)) : get$1$1(this.node(), id).ease;
};

var transition_filter = function (match) {
  if (typeof match !== "function") match = matcher$1(match);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }

  return new Transition(subgroups, this._parents, this._name, this._id);
};

var transition_merge = function (transition$$1) {
  if (transition$$1._id !== this._id) throw new Error();

  for (var groups0 = this._groups, groups1 = transition$$1._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }

  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }

  return new Transition(merges, this._parents, this._name, this._id);
};

function start(name) {
  return (name + "").trim().split(/^|\s+/).every(function (t) {
    var i = t.indexOf(".");
    if (i >= 0) t = t.slice(0, i);
    return !t || t === "start";
  });
}

function onFunction(id, name, listener) {
  var on0,
      on1,
      sit = start(name) ? init : set$1;
  return function () {
    var schedule$$1 = sit(this, id),
        on = schedule$$1.on;

    // If this node shared a dispatch with the previous node,
    // just assign the updated shared dispatch and we’re done!
    // Otherwise, copy-on-write.
    if (on !== on0) (on1 = (on0 = on).copy()).on(name, listener);

    schedule$$1.on = on1;
  };
}

var transition_on = function (name, listener) {
  var id = this._id;

  return arguments.length < 2 ? get$1$1(this.node(), id).on.on(name) : this.each(onFunction(id, name, listener));
};

function removeFunction(id) {
  return function () {
    var parent = this.parentNode;
    for (var i in this.__transition) {
      if (+i !== id) return;
    }if (parent) parent.removeChild(this);
  };
}

var transition_remove = function () {
  return this.on("end.remove", removeFunction(this._id));
};

var transition_select = function (select$$1) {
  var name = this._name,
      id = this._id;

  if (typeof select$$1 !== "function") select$$1 = selector(select$$1);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group[i]) && (subnode = select$$1.call(node, node.__data__, i, group))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
        schedule(subgroup[i], name, id, i, subgroup, get$1$1(node, id));
      }
    }
  }

  return new Transition(subgroups, this._parents, name, id);
};

var transition_selectAll = function (select$$1) {
  var name = this._name,
      id = this._id;

  if (typeof select$$1 !== "function") select$$1 = selectorAll(select$$1);

  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        for (var children = select$$1.call(node, node.__data__, i, group), child, inherit = get$1$1(node, id), k = 0, l = children.length; k < l; ++k) {
          if (child = children[k]) {
            schedule(child, name, id, k, children, inherit);
          }
        }
        subgroups.push(children);
        parents.push(node);
      }
    }
  }

  return new Transition(subgroups, parents, name, id);
};

var Selection$1 = selection.prototype.constructor;

var transition_selection = function () {
  return new Selection$1(this._groups, this._parents);
};

function styleRemove$1(name, interpolate$$1) {
    var value00, value10, interpolate0;
    return function () {
        var value0 = styleValue(this, name),
            value1 = (this.style.removeProperty(name), styleValue(this, name));
        return value0 === value1 ? null : value0 === value00 && value1 === value10 ? interpolate0 : interpolate0 = interpolate$$1(value00 = value0, value10 = value1);
    };
}

function styleRemoveEnd(name) {
    return function () {
        this.style.removeProperty(name);
    };
}

function styleConstant$1(name, interpolate$$1, value1) {
    var value00, interpolate0;
    return function () {
        var value0 = styleValue(this, name);
        return value0 === value1 ? null : value0 === value00 ? interpolate0 : interpolate0 = interpolate$$1(value00 = value0, value1);
    };
}

function styleFunction$1(name, interpolate$$1, value) {
    var value00, value10, interpolate0;
    return function () {
        var value0 = styleValue(this, name),
            value1 = value(this);
        if (value1 == null) value1 = (this.style.removeProperty(name), styleValue(this, name));
        return value0 === value1 ? null : value0 === value00 && value1 === value10 ? interpolate0 : interpolate0 = interpolate$$1(value00 = value0, value10 = value1);
    };
}

var transition_style = function (name, value, priority) {
    var i = (name += "") === "transform" ? interpolateTransformCss : interpolate$1;
    return value == null ? this.styleTween(name, styleRemove$1(name, i)).on("end.style." + name, styleRemoveEnd(name)) : this.styleTween(name, typeof value === "function" ? styleFunction$1(name, i, tweenValue(this, "style." + name, value)) : styleConstant$1(name, i, value + ""), priority);
};

function styleTween(name, value, priority) {
  function tween() {
    var node = this,
        i = value.apply(node, arguments);
    return i && function (t) {
      node.style.setProperty(name, i(t), priority);
    };
  }
  tween._value = value;
  return tween;
}

var transition_styleTween = function (name, value, priority) {
  var key = "style." + (name += "");
  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error();
  return this.tween(key, styleTween(name, value, priority == null ? "" : priority));
};

function textConstant$1(value) {
  return function () {
    this.textContent = value;
  };
}

function textFunction$1(value) {
  return function () {
    var value1 = value(this);
    this.textContent = value1 == null ? "" : value1;
  };
}

var transition_text = function (value) {
  return this.tween("text", typeof value === "function" ? textFunction$1(tweenValue(this, "text", value)) : textConstant$1(value == null ? "" : value + ""));
};

var transition_transition = function () {
  var name = this._name,
      id0 = this._id,
      id1 = newId();

  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        var inherit = get$1$1(node, id0);
        schedule(node, name, id1, i, group, {
          time: inherit.time + inherit.delay + inherit.duration,
          delay: 0,
          duration: inherit.duration,
          ease: inherit.ease
        });
      }
    }
  }

  return new Transition(groups, this._parents, name, id1);
};

var id = 0;

function Transition(groups, parents, name, id) {
  this._groups = groups;
  this._parents = parents;
  this._name = name;
  this._id = id;
}

function transition(name) {
  return selection().transition(name);
}

function newId() {
  return ++id;
}

var selection_prototype = selection.prototype;

Transition.prototype = transition.prototype = {
  constructor: Transition,
  select: transition_select,
  selectAll: transition_selectAll,
  filter: transition_filter,
  merge: transition_merge,
  selection: transition_selection,
  transition: transition_transition,
  call: selection_prototype.call,
  nodes: selection_prototype.nodes,
  node: selection_prototype.node,
  size: selection_prototype.size,
  empty: selection_prototype.empty,
  each: selection_prototype.each,
  on: transition_on,
  attr: transition_attr,
  attrTween: transition_attrTween,
  style: transition_style,
  styleTween: transition_styleTween,
  text: transition_text,
  remove: transition_remove,
  tween: transition_tween,
  delay: transition_delay,
  duration: transition_duration,
  ease: transition_ease
};

function cubicOut(t) {
  return --t * t * t + 1;
}

function cubicInOut(t) {
  return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
}

var exponent = 3;

var polyIn = function custom(e) {
  e = +e;

  function polyIn(t) {
    return Math.pow(t, e);
  }

  polyIn.exponent = custom;

  return polyIn;
}(exponent);

var polyOut = function custom(e) {
  e = +e;

  function polyOut(t) {
    return 1 - Math.pow(1 - t, e);
  }

  polyOut.exponent = custom;

  return polyOut;
}(exponent);

var polyInOut = function custom(e) {
  e = +e;

  function polyInOut(t) {
    return ((t *= 2) <= 1 ? Math.pow(t, e) : 2 - Math.pow(2 - t, e)) / 2;
  }

  polyInOut.exponent = custom;

  return polyInOut;
}(exponent);

var overshoot = 1.70158;

var backIn = function custom(s) {
  s = +s;

  function backIn(t) {
    return t * t * ((s + 1) * t - s);
  }

  backIn.overshoot = custom;

  return backIn;
}(overshoot);

var backOut = function custom(s) {
  s = +s;

  function backOut(t) {
    return --t * t * ((s + 1) * t + s) + 1;
  }

  backOut.overshoot = custom;

  return backOut;
}(overshoot);

var backInOut = function custom(s) {
  s = +s;

  function backInOut(t) {
    return ((t *= 2) < 1 ? t * t * ((s + 1) * t - s) : (t -= 2) * t * ((s + 1) * t + s) + 2) / 2;
  }

  backInOut.overshoot = custom;

  return backInOut;
}(overshoot);

var tau = 2 * Math.PI;
var amplitude = 1;
var period = 0.3;

var elasticIn = function custom(a, p) {
  var s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau);

  function elasticIn(t) {
    return a * Math.pow(2, 10 * --t) * Math.sin((s - t) / p);
  }

  elasticIn.amplitude = function (a) {
    return custom(a, p * tau);
  };
  elasticIn.period = function (p) {
    return custom(a, p);
  };

  return elasticIn;
}(amplitude, period);

var elasticOut = function custom(a, p) {
  var s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau);

  function elasticOut(t) {
    return 1 - a * Math.pow(2, -10 * (t = +t)) * Math.sin((t + s) / p);
  }

  elasticOut.amplitude = function (a) {
    return custom(a, p * tau);
  };
  elasticOut.period = function (p) {
    return custom(a, p);
  };

  return elasticOut;
}(amplitude, period);

var elasticInOut = function custom(a, p) {
  var s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau);

  function elasticInOut(t) {
    return ((t = t * 2 - 1) < 0 ? a * Math.pow(2, 10 * t) * Math.sin((s - t) / p) : 2 - a * Math.pow(2, -10 * t) * Math.sin((s + t) / p)) / 2;
  }

  elasticInOut.amplitude = function (a) {
    return custom(a, p * tau);
  };
  elasticInOut.period = function (p) {
    return custom(a, p);
  };

  return elasticInOut;
}(amplitude, period);

var defaultTiming = {
  time: null, // Set on use.
  delay: 0,
  duration: 250,
  ease: cubicInOut
};

function inherit(node, id) {
  var timing;
  while (!(timing = node.__transition) || !(timing = timing[id])) {
    if (!(node = node.parentNode)) {
      return defaultTiming.time = now(), defaultTiming;
    }
  }
  return timing;
}

var selection_transition = function (name) {
  var id, timing;

  if (name instanceof Transition) {
    id = name._id, name = name._name;
  } else {
    id = newId(), (timing = defaultTiming).time = now(), name = name == null ? null : name + "";
  }

  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        schedule(node, name, id, i, group, timing || inherit(node, id));
      }
    }
  }

  return new Transition(groups, this._parents, name, id);
};

selection.prototype.interrupt = selection_interrupt;
selection.prototype.transition = selection_transition;

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};





function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var chroma = createCommonjsModule(function (module, exports) {
/**
 * @license
 *
 * chroma.js - JavaScript library for color conversions
 * 
 * Copyright (c) 2011-2017, Gregor Aisch
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 * 
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 * 
 * 3. The name Gregor Aisch may not be used to endorse or promote products
 *    derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL GREGOR AISCH OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
 * BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
 * EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 */

(function () {
  var Color,
      DEG2RAD,
      LAB_CONSTANTS,
      PI,
      PITHIRD,
      RAD2DEG,
      TWOPI,
      _guess_formats,
      _guess_formats_sorted,
      _input,
      _interpolators,
      abs,
      atan2,
      _bezier,
      _blend,
      blend_f,
      brewer,
      burn,
      chroma,
      clip_rgb,
      cmyk2rgb,
      colors,
      cos,
      css2rgb,
      darken,
      dodge,
      each,
      floor,
      hcg2rgb,
      hex2rgb,
      hsi2rgb,
      hsl2css,
      hsl2rgb,
      hsv2rgb,
      interpolate,
      interpolate_hsx,
      interpolate_lab,
      interpolate_num,
      interpolate_rgb,
      lab2lch,
      lab2rgb,
      lab_xyz,
      lch2lab,
      lch2rgb,
      lighten,
      limit,
      log,
      luminance_x,
      m,
      max,
      multiply,
      normal,
      num2rgb,
      overlay,
      pow,
      rgb2cmyk,
      rgb2css,
      rgb2hcg,
      rgb2hex,
      rgb2hsi,
      rgb2hsl,
      rgb2hsv,
      rgb2lab,
      rgb2lch,
      rgb2luminance,
      rgb2num,
      rgb2temperature,
      rgb2xyz,
      rgb_xyz,
      rnd,
      root,
      round,
      screen,
      sin,
      sqrt,
      temperature2rgb,
      type,
      unpack,
      w3cx11,
      xyz_lab,
      xyz_rgb,
      slice = [].slice;

  type = function () {

    /*
    for browser-safe type checking+
    ported from jQuery's $.type
     */
    var classToType, len, name, o, ref;
    classToType = {};
    ref = "Boolean Number String Function Array Date RegExp Undefined Null".split(" ");
    for (o = 0, len = ref.length; o < len; o++) {
      name = ref[o];
      classToType["[object " + name + "]"] = name.toLowerCase();
    }
    return function (obj) {
      var strType;
      strType = Object.prototype.toString.call(obj);
      return classToType[strType] || "object";
    };
  }();

  limit = function limit(x, min, max) {
    if (min == null) {
      min = 0;
    }
    if (max == null) {
      max = 1;
    }
    if (x < min) {
      x = min;
    }
    if (x > max) {
      x = max;
    }
    return x;
  };

  unpack = function unpack(args) {
    if (args.length >= 3) {
      return [].slice.call(args);
    } else {
      return args[0];
    }
  };

  clip_rgb = function clip_rgb(rgb) {
    var i, o;
    rgb._clipped = false;
    rgb._unclipped = rgb.slice(0);
    for (i = o = 0; o < 3; i = ++o) {
      if (i < 3) {
        if (rgb[i] < 0 || rgb[i] > 255) {
          rgb._clipped = true;
        }
        if (rgb[i] < 0) {
          rgb[i] = 0;
        }
        if (rgb[i] > 255) {
          rgb[i] = 255;
        }
      } else if (i === 3) {
        if (rgb[i] < 0) {
          rgb[i] = 0;
        }
        if (rgb[i] > 1) {
          rgb[i] = 1;
        }
      }
    }
    if (!rgb._clipped) {
      delete rgb._unclipped;
    }
    return rgb;
  };

  PI = Math.PI, round = Math.round, cos = Math.cos, floor = Math.floor, pow = Math.pow, log = Math.log, sin = Math.sin, sqrt = Math.sqrt, atan2 = Math.atan2, max = Math.max, abs = Math.abs;

  TWOPI = PI * 2;

  PITHIRD = PI / 3;

  DEG2RAD = PI / 180;

  RAD2DEG = 180 / PI;

  chroma = function chroma() {
    if (arguments[0] instanceof Color) {
      return arguments[0];
    }
    return function (func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor(),
          result = func.apply(child, args);
      return Object(result) === result ? result : child;
    }(Color, arguments, function () {});
  };

  _interpolators = [];

  if ('object' !== "undefined" && module !== null && module.exports != null) {
    module.exports = chroma;
  }

  if (typeof undefined === 'function' && undefined.amd) {
    undefined([], function () {
      return chroma;
    });
  } else {
    root = 'object' !== "undefined" && exports !== null ? exports : this;
    root.chroma = chroma;
  }

  chroma.version = '1.3.4';

  _input = {};

  _guess_formats = [];

  _guess_formats_sorted = false;

  Color = function () {
    function Color() {
      var arg, args, chk, len, len1, me, mode, o, w;
      me = this;
      args = [];
      for (o = 0, len = arguments.length; o < len; o++) {
        arg = arguments[o];
        if (arg != null) {
          args.push(arg);
        }
      }
      mode = args[args.length - 1];
      if (_input[mode] != null) {
        me._rgb = clip_rgb(_input[mode](unpack(args.slice(0, -1))));
      } else {
        if (!_guess_formats_sorted) {
          _guess_formats = _guess_formats.sort(function (a, b) {
            return b.p - a.p;
          });
          _guess_formats_sorted = true;
        }
        for (w = 0, len1 = _guess_formats.length; w < len1; w++) {
          chk = _guess_formats[w];
          mode = chk.test.apply(chk, args);
          if (mode) {
            break;
          }
        }
        if (mode) {
          me._rgb = clip_rgb(_input[mode].apply(_input, args));
        }
      }
      if (me._rgb == null) {
        console.warn('unknown format: ' + args);
      }
      if (me._rgb == null) {
        me._rgb = [0, 0, 0];
      }
      if (me._rgb.length === 3) {
        me._rgb.push(1);
      }
    }

    Color.prototype.toString = function () {
      return this.hex();
    };

    Color.prototype.clone = function () {
      return chroma(me._rgb);
    };

    return Color;
  }();

  chroma._input = _input;

  /**
  	ColorBrewer colors for chroma.js
  
  	Copyright (c) 2002 Cynthia Brewer, Mark Harrower, and The 
  	Pennsylvania State University.
  
  	Licensed under the Apache License, Version 2.0 (the "License"); 
  	you may not use this file except in compliance with the License.
  	You may obtain a copy of the License at	
  	http://www.apache.org/licenses/LICENSE-2.0
  
  	Unless required by applicable law or agreed to in writing, software distributed
  	under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
  	CONDITIONS OF ANY KIND, either express or implied. See the License for the
  	specific language governing permissions and limitations under the License.
  
      @preserve
   */

  chroma.brewer = brewer = {
    OrRd: ['#fff7ec', '#fee8c8', '#fdd49e', '#fdbb84', '#fc8d59', '#ef6548', '#d7301f', '#b30000', '#7f0000'],
    PuBu: ['#fff7fb', '#ece7f2', '#d0d1e6', '#a6bddb', '#74a9cf', '#3690c0', '#0570b0', '#045a8d', '#023858'],
    BuPu: ['#f7fcfd', '#e0ecf4', '#bfd3e6', '#9ebcda', '#8c96c6', '#8c6bb1', '#88419d', '#810f7c', '#4d004b'],
    Oranges: ['#fff5eb', '#fee6ce', '#fdd0a2', '#fdae6b', '#fd8d3c', '#f16913', '#d94801', '#a63603', '#7f2704'],
    BuGn: ['#f7fcfd', '#e5f5f9', '#ccece6', '#99d8c9', '#66c2a4', '#41ae76', '#238b45', '#006d2c', '#00441b'],
    YlOrBr: ['#ffffe5', '#fff7bc', '#fee391', '#fec44f', '#fe9929', '#ec7014', '#cc4c02', '#993404', '#662506'],
    YlGn: ['#ffffe5', '#f7fcb9', '#d9f0a3', '#addd8e', '#78c679', '#41ab5d', '#238443', '#006837', '#004529'],
    Reds: ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d'],
    RdPu: ['#fff7f3', '#fde0dd', '#fcc5c0', '#fa9fb5', '#f768a1', '#dd3497', '#ae017e', '#7a0177', '#49006a'],
    Greens: ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'],
    YlGnBu: ['#ffffd9', '#edf8b1', '#c7e9b4', '#7fcdbb', '#41b6c4', '#1d91c0', '#225ea8', '#253494', '#081d58'],
    Purples: ['#fcfbfd', '#efedf5', '#dadaeb', '#bcbddc', '#9e9ac8', '#807dba', '#6a51a3', '#54278f', '#3f007d'],
    GnBu: ['#f7fcf0', '#e0f3db', '#ccebc5', '#a8ddb5', '#7bccc4', '#4eb3d3', '#2b8cbe', '#0868ac', '#084081'],
    Greys: ['#ffffff', '#f0f0f0', '#d9d9d9', '#bdbdbd', '#969696', '#737373', '#525252', '#252525', '#000000'],
    YlOrRd: ['#ffffcc', '#ffeda0', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#bd0026', '#800026'],
    PuRd: ['#f7f4f9', '#e7e1ef', '#d4b9da', '#c994c7', '#df65b0', '#e7298a', '#ce1256', '#980043', '#67001f'],
    Blues: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'],
    PuBuGn: ['#fff7fb', '#ece2f0', '#d0d1e6', '#a6bddb', '#67a9cf', '#3690c0', '#02818a', '#016c59', '#014636'],
    Viridis: ['#440154', '#482777', '#3f4a8a', '#31678e', '#26838f', '#1f9d8a', '#6cce5a', '#b6de2b', '#fee825'],
    Spectral: ['#9e0142', '#d53e4f', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#e6f598', '#abdda4', '#66c2a5', '#3288bd', '#5e4fa2'],
    RdYlGn: ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#d9ef8b', '#a6d96a', '#66bd63', '#1a9850', '#006837'],
    RdBu: ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#f7f7f7', '#d1e5f0', '#92c5de', '#4393c3', '#2166ac', '#053061'],
    PiYG: ['#8e0152', '#c51b7d', '#de77ae', '#f1b6da', '#fde0ef', '#f7f7f7', '#e6f5d0', '#b8e186', '#7fbc41', '#4d9221', '#276419'],
    PRGn: ['#40004b', '#762a83', '#9970ab', '#c2a5cf', '#e7d4e8', '#f7f7f7', '#d9f0d3', '#a6dba0', '#5aae61', '#1b7837', '#00441b'],
    RdYlBu: ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee090', '#ffffbf', '#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695'],
    BrBG: ['#543005', '#8c510a', '#bf812d', '#dfc27d', '#f6e8c3', '#f5f5f5', '#c7eae5', '#80cdc1', '#35978f', '#01665e', '#003c30'],
    RdGy: ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#ffffff', '#e0e0e0', '#bababa', '#878787', '#4d4d4d', '#1a1a1a'],
    PuOr: ['#7f3b08', '#b35806', '#e08214', '#fdb863', '#fee0b6', '#f7f7f7', '#d8daeb', '#b2abd2', '#8073ac', '#542788', '#2d004b'],
    Set2: ['#66c2a5', '#fc8d62', '#8da0cb', '#e78ac3', '#a6d854', '#ffd92f', '#e5c494', '#b3b3b3'],
    Accent: ['#7fc97f', '#beaed4', '#fdc086', '#ffff99', '#386cb0', '#f0027f', '#bf5b17', '#666666'],
    Set1: ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf', '#999999'],
    Set3: ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f'],
    Dark2: ['#1b9e77', '#d95f02', '#7570b3', '#e7298a', '#66a61e', '#e6ab02', '#a6761d', '#666666'],
    Paired: ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', '#ffff99', '#b15928'],
    Pastel2: ['#b3e2cd', '#fdcdac', '#cbd5e8', '#f4cae4', '#e6f5c9', '#fff2ae', '#f1e2cc', '#cccccc'],
    Pastel1: ['#fbb4ae', '#b3cde3', '#ccebc5', '#decbe4', '#fed9a6', '#ffffcc', '#e5d8bd', '#fddaec', '#f2f2f2']
  };

  (function () {
    var key, results;
    results = [];
    for (key in brewer) {
      results.push(brewer[key.toLowerCase()] = brewer[key]);
    }
    return results;
  })();

  /**
  	X11 color names
  
  	http://www.w3.org/TR/css3-color/#svg-color
   */

  w3cx11 = {
    aliceblue: '#f0f8ff',
    antiquewhite: '#faebd7',
    aqua: '#00ffff',
    aquamarine: '#7fffd4',
    azure: '#f0ffff',
    beige: '#f5f5dc',
    bisque: '#ffe4c4',
    black: '#000000',
    blanchedalmond: '#ffebcd',
    blue: '#0000ff',
    blueviolet: '#8a2be2',
    brown: '#a52a2a',
    burlywood: '#deb887',
    cadetblue: '#5f9ea0',
    chartreuse: '#7fff00',
    chocolate: '#d2691e',
    coral: '#ff7f50',
    cornflower: '#6495ed',
    cornflowerblue: '#6495ed',
    cornsilk: '#fff8dc',
    crimson: '#dc143c',
    cyan: '#00ffff',
    darkblue: '#00008b',
    darkcyan: '#008b8b',
    darkgoldenrod: '#b8860b',
    darkgray: '#a9a9a9',
    darkgreen: '#006400',
    darkgrey: '#a9a9a9',
    darkkhaki: '#bdb76b',
    darkmagenta: '#8b008b',
    darkolivegreen: '#556b2f',
    darkorange: '#ff8c00',
    darkorchid: '#9932cc',
    darkred: '#8b0000',
    darksalmon: '#e9967a',
    darkseagreen: '#8fbc8f',
    darkslateblue: '#483d8b',
    darkslategray: '#2f4f4f',
    darkslategrey: '#2f4f4f',
    darkturquoise: '#00ced1',
    darkviolet: '#9400d3',
    deeppink: '#ff1493',
    deepskyblue: '#00bfff',
    dimgray: '#696969',
    dimgrey: '#696969',
    dodgerblue: '#1e90ff',
    firebrick: '#b22222',
    floralwhite: '#fffaf0',
    forestgreen: '#228b22',
    fuchsia: '#ff00ff',
    gainsboro: '#dcdcdc',
    ghostwhite: '#f8f8ff',
    gold: '#ffd700',
    goldenrod: '#daa520',
    gray: '#808080',
    green: '#008000',
    greenyellow: '#adff2f',
    grey: '#808080',
    honeydew: '#f0fff0',
    hotpink: '#ff69b4',
    indianred: '#cd5c5c',
    indigo: '#4b0082',
    ivory: '#fffff0',
    khaki: '#f0e68c',
    laserlemon: '#ffff54',
    lavender: '#e6e6fa',
    lavenderblush: '#fff0f5',
    lawngreen: '#7cfc00',
    lemonchiffon: '#fffacd',
    lightblue: '#add8e6',
    lightcoral: '#f08080',
    lightcyan: '#e0ffff',
    lightgoldenrod: '#fafad2',
    lightgoldenrodyellow: '#fafad2',
    lightgray: '#d3d3d3',
    lightgreen: '#90ee90',
    lightgrey: '#d3d3d3',
    lightpink: '#ffb6c1',
    lightsalmon: '#ffa07a',
    lightseagreen: '#20b2aa',
    lightskyblue: '#87cefa',
    lightslategray: '#778899',
    lightslategrey: '#778899',
    lightsteelblue: '#b0c4de',
    lightyellow: '#ffffe0',
    lime: '#00ff00',
    limegreen: '#32cd32',
    linen: '#faf0e6',
    magenta: '#ff00ff',
    maroon: '#800000',
    maroon2: '#7f0000',
    maroon3: '#b03060',
    mediumaquamarine: '#66cdaa',
    mediumblue: '#0000cd',
    mediumorchid: '#ba55d3',
    mediumpurple: '#9370db',
    mediumseagreen: '#3cb371',
    mediumslateblue: '#7b68ee',
    mediumspringgreen: '#00fa9a',
    mediumturquoise: '#48d1cc',
    mediumvioletred: '#c71585',
    midnightblue: '#191970',
    mintcream: '#f5fffa',
    mistyrose: '#ffe4e1',
    moccasin: '#ffe4b5',
    navajowhite: '#ffdead',
    navy: '#000080',
    oldlace: '#fdf5e6',
    olive: '#808000',
    olivedrab: '#6b8e23',
    orange: '#ffa500',
    orangered: '#ff4500',
    orchid: '#da70d6',
    palegoldenrod: '#eee8aa',
    palegreen: '#98fb98',
    paleturquoise: '#afeeee',
    palevioletred: '#db7093',
    papayawhip: '#ffefd5',
    peachpuff: '#ffdab9',
    peru: '#cd853f',
    pink: '#ffc0cb',
    plum: '#dda0dd',
    powderblue: '#b0e0e6',
    purple: '#800080',
    purple2: '#7f007f',
    purple3: '#a020f0',
    rebeccapurple: '#663399',
    red: '#ff0000',
    rosybrown: '#bc8f8f',
    royalblue: '#4169e1',
    saddlebrown: '#8b4513',
    salmon: '#fa8072',
    sandybrown: '#f4a460',
    seagreen: '#2e8b57',
    seashell: '#fff5ee',
    sienna: '#a0522d',
    silver: '#c0c0c0',
    skyblue: '#87ceeb',
    slateblue: '#6a5acd',
    slategray: '#708090',
    slategrey: '#708090',
    snow: '#fffafa',
    springgreen: '#00ff7f',
    steelblue: '#4682b4',
    tan: '#d2b48c',
    teal: '#008080',
    thistle: '#d8bfd8',
    tomato: '#ff6347',
    turquoise: '#40e0d0',
    violet: '#ee82ee',
    wheat: '#f5deb3',
    white: '#ffffff',
    whitesmoke: '#f5f5f5',
    yellow: '#ffff00',
    yellowgreen: '#9acd32'
  };

  chroma.colors = colors = w3cx11;

  lab2rgb = function lab2rgb() {
    var a, args, b, g, l, r, x, y, z;
    args = unpack(arguments);
    l = args[0], a = args[1], b = args[2];
    y = (l + 16) / 116;
    x = isNaN(a) ? y : y + a / 500;
    z = isNaN(b) ? y : y - b / 200;
    y = LAB_CONSTANTS.Yn * lab_xyz(y);
    x = LAB_CONSTANTS.Xn * lab_xyz(x);
    z = LAB_CONSTANTS.Zn * lab_xyz(z);
    r = xyz_rgb(3.2404542 * x - 1.5371385 * y - 0.4985314 * z);
    g = xyz_rgb(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z);
    b = xyz_rgb(0.0556434 * x - 0.2040259 * y + 1.0572252 * z);
    return [r, g, b, args.length > 3 ? args[3] : 1];
  };

  xyz_rgb = function xyz_rgb(r) {
    return 255 * (r <= 0.00304 ? 12.92 * r : 1.055 * pow(r, 1 / 2.4) - 0.055);
  };

  lab_xyz = function lab_xyz(t) {
    if (t > LAB_CONSTANTS.t1) {
      return t * t * t;
    } else {
      return LAB_CONSTANTS.t2 * (t - LAB_CONSTANTS.t0);
    }
  };

  LAB_CONSTANTS = {
    Kn: 18,
    Xn: 0.950470,
    Yn: 1,
    Zn: 1.088830,
    t0: 0.137931034,
    t1: 0.206896552,
    t2: 0.12841855,
    t3: 0.008856452
  };

  rgb2lab = function rgb2lab() {
    var b, g, r, ref, ref1, x, y, z;
    ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
    ref1 = rgb2xyz(r, g, b), x = ref1[0], y = ref1[1], z = ref1[2];
    return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
  };

  rgb_xyz = function rgb_xyz(r) {
    if ((r /= 255) <= 0.04045) {
      return r / 12.92;
    } else {
      return pow((r + 0.055) / 1.055, 2.4);
    }
  };

  xyz_lab = function xyz_lab(t) {
    if (t > LAB_CONSTANTS.t3) {
      return pow(t, 1 / 3);
    } else {
      return t / LAB_CONSTANTS.t2 + LAB_CONSTANTS.t0;
    }
  };

  rgb2xyz = function rgb2xyz() {
    var b, g, r, ref, x, y, z;
    ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
    r = rgb_xyz(r);
    g = rgb_xyz(g);
    b = rgb_xyz(b);
    x = xyz_lab((0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / LAB_CONSTANTS.Xn);
    y = xyz_lab((0.2126729 * r + 0.7151522 * g + 0.0721750 * b) / LAB_CONSTANTS.Yn);
    z = xyz_lab((0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / LAB_CONSTANTS.Zn);
    return [x, y, z];
  };

  chroma.lab = function () {
    return function (func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor(),
          result = func.apply(child, args);
      return Object(result) === result ? result : child;
    }(Color, slice.call(arguments).concat(['lab']), function () {});
  };

  _input.lab = lab2rgb;

  Color.prototype.lab = function () {
    return rgb2lab(this._rgb);
  };

  _bezier = function bezier(colors) {
    var I, I0, I1, c, lab0, lab1, lab2, lab3, ref, ref1, ref2;
    colors = function () {
      var len, o, results;
      results = [];
      for (o = 0, len = colors.length; o < len; o++) {
        c = colors[o];
        results.push(chroma(c));
      }
      return results;
    }();
    if (colors.length === 2) {
      ref = function () {
        var len, o, results;
        results = [];
        for (o = 0, len = colors.length; o < len; o++) {
          c = colors[o];
          results.push(c.lab());
        }
        return results;
      }(), lab0 = ref[0], lab1 = ref[1];
      I = function I(t) {
        var i, lab;
        lab = function () {
          var o, results;
          results = [];
          for (i = o = 0; o <= 2; i = ++o) {
            results.push(lab0[i] + t * (lab1[i] - lab0[i]));
          }
          return results;
        }();
        return chroma.lab.apply(chroma, lab);
      };
    } else if (colors.length === 3) {
      ref1 = function () {
        var len, o, results;
        results = [];
        for (o = 0, len = colors.length; o < len; o++) {
          c = colors[o];
          results.push(c.lab());
        }
        return results;
      }(), lab0 = ref1[0], lab1 = ref1[1], lab2 = ref1[2];
      I = function I(t) {
        var i, lab;
        lab = function () {
          var o, results;
          results = [];
          for (i = o = 0; o <= 2; i = ++o) {
            results.push((1 - t) * (1 - t) * lab0[i] + 2 * (1 - t) * t * lab1[i] + t * t * lab2[i]);
          }
          return results;
        }();
        return chroma.lab.apply(chroma, lab);
      };
    } else if (colors.length === 4) {
      ref2 = function () {
        var len, o, results;
        results = [];
        for (o = 0, len = colors.length; o < len; o++) {
          c = colors[o];
          results.push(c.lab());
        }
        return results;
      }(), lab0 = ref2[0], lab1 = ref2[1], lab2 = ref2[2], lab3 = ref2[3];
      I = function I(t) {
        var i, lab;
        lab = function () {
          var o, results;
          results = [];
          for (i = o = 0; o <= 2; i = ++o) {
            results.push((1 - t) * (1 - t) * (1 - t) * lab0[i] + 3 * (1 - t) * (1 - t) * t * lab1[i] + 3 * (1 - t) * t * t * lab2[i] + t * t * t * lab3[i]);
          }
          return results;
        }();
        return chroma.lab.apply(chroma, lab);
      };
    } else if (colors.length === 5) {
      I0 = _bezier(colors.slice(0, 3));
      I1 = _bezier(colors.slice(2, 5));
      I = function I(t) {
        if (t < 0.5) {
          return I0(t * 2);
        } else {
          return I1((t - 0.5) * 2);
        }
      };
    }
    return I;
  };

  chroma.bezier = function (colors) {
    var f;
    f = _bezier(colors);
    f.scale = function () {
      return chroma.scale(f);
    };
    return f;
  };

  /*
      chroma.js
  
      Copyright (c) 2011-2013, Gregor Aisch
      All rights reserved.
  
      Redistribution and use in source and binary forms, with or without
      modification, are permitted provided that the following conditions are met:
  
      * Redistributions of source code must retain the above copyright notice, this
        list of conditions and the following disclaimer.
  
      * Redistributions in binary form must reproduce the above copyright notice,
        this list of conditions and the following disclaimer in the documentation
        and/or other materials provided with the distribution.
  
      * The name Gregor Aisch may not be used to endorse or promote products
        derived from this software without specific prior written permission.
  
      THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
      AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
      IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
      DISCLAIMED. IN NO EVENT SHALL GREGOR AISCH OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
      INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
      BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
      DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
      OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
      NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
      EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
  
      @source: https://github.com/gka/chroma.js
   */

  chroma.cubehelix = function (start, rotations, hue, gamma, lightness) {
    var dh, dl, f;
    if (start == null) {
      start = 300;
    }
    if (rotations == null) {
      rotations = -1.5;
    }
    if (hue == null) {
      hue = 1;
    }
    if (gamma == null) {
      gamma = 1;
    }
    if (lightness == null) {
      lightness = [0, 1];
    }
    dh = 0;
    if (type(lightness) === 'array') {
      dl = lightness[1] - lightness[0];
    } else {
      dl = 0;
      lightness = [lightness, lightness];
    }
    f = function f(fract) {
      var a, amp, b, cos_a, g, h, l, r, sin_a;
      a = TWOPI * ((start + 120) / 360 + rotations * fract);
      l = pow(lightness[0] + dl * fract, gamma);
      h = dh !== 0 ? hue[0] + fract * dh : hue;
      amp = h * l * (1 - l) / 2;
      cos_a = cos(a);
      sin_a = sin(a);
      r = l + amp * (-0.14861 * cos_a + 1.78277 * sin_a);
      g = l + amp * (-0.29227 * cos_a - 0.90649 * sin_a);
      b = l + amp * (+1.97294 * cos_a);
      return chroma(clip_rgb([r * 255, g * 255, b * 255]));
    };
    f.start = function (s) {
      if (s == null) {
        return start;
      }
      start = s;
      return f;
    };
    f.rotations = function (r) {
      if (r == null) {
        return rotations;
      }
      rotations = r;
      return f;
    };
    f.gamma = function (g) {
      if (g == null) {
        return gamma;
      }
      gamma = g;
      return f;
    };
    f.hue = function (h) {
      if (h == null) {
        return hue;
      }
      hue = h;
      if (type(hue) === 'array') {
        dh = hue[1] - hue[0];
        if (dh === 0) {
          hue = hue[1];
        }
      } else {
        dh = 0;
      }
      return f;
    };
    f.lightness = function (h) {
      if (h == null) {
        return lightness;
      }
      if (type(h) === 'array') {
        lightness = h;
        dl = h[1] - h[0];
      } else {
        lightness = [h, h];
        dl = 0;
      }
      return f;
    };
    f.scale = function () {
      return chroma.scale(f);
    };
    f.hue(hue);
    return f;
  };

  chroma.random = function () {
    var code, digits, i, o;
    digits = '0123456789abcdef';
    code = '#';
    for (i = o = 0; o < 6; i = ++o) {
      code += digits.charAt(floor(Math.random() * 16));
    }
    return new Color(code);
  };

  chroma.average = function (colors, mode) {
    var A, alpha, c, cnt, dx, dy, first, i, l, len, o, xyz, xyz2;
    if (mode == null) {
      mode = 'rgb';
    }
    l = colors.length;
    colors = colors.map(function (c) {
      return chroma(c);
    });
    first = colors.splice(0, 1)[0];
    xyz = first.get(mode);
    cnt = [];
    dx = 0;
    dy = 0;
    for (i in xyz) {
      xyz[i] = xyz[i] || 0;
      cnt.push(!isNaN(xyz[i]) ? 1 : 0);
      if (mode.charAt(i) === 'h' && !isNaN(xyz[i])) {
        A = xyz[i] / 180 * PI;
        dx += cos(A);
        dy += sin(A);
      }
    }
    alpha = first.alpha();
    for (o = 0, len = colors.length; o < len; o++) {
      c = colors[o];
      xyz2 = c.get(mode);
      alpha += c.alpha();
      for (i in xyz) {
        if (!isNaN(xyz2[i])) {
          xyz[i] += xyz2[i];
          cnt[i] += 1;
          if (mode.charAt(i) === 'h') {
            A = xyz[i] / 180 * PI;
            dx += cos(A);
            dy += sin(A);
          }
        }
      }
    }
    for (i in xyz) {
      xyz[i] = xyz[i] / cnt[i];
      if (mode.charAt(i) === 'h') {
        A = atan2(dy / cnt[i], dx / cnt[i]) / PI * 180;
        while (A < 0) {
          A += 360;
        }
        while (A >= 360) {
          A -= 360;
        }
        xyz[i] = A;
      }
    }
    return chroma(xyz, mode).alpha(alpha / l);
  };

  _input.rgb = function () {
    var k, ref, results, v;
    ref = unpack(arguments);
    results = [];
    for (k in ref) {
      v = ref[k];
      results.push(v);
    }
    return results;
  };

  chroma.rgb = function () {
    return function (func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor(),
          result = func.apply(child, args);
      return Object(result) === result ? result : child;
    }(Color, slice.call(arguments).concat(['rgb']), function () {});
  };

  Color.prototype.rgb = function (round) {
    if (round == null) {
      round = true;
    }
    if (round) {
      return this._rgb.map(Math.round).slice(0, 3);
    } else {
      return this._rgb.slice(0, 3);
    }
  };

  Color.prototype.rgba = function (round) {
    if (round == null) {
      round = true;
    }
    if (!round) {
      return this._rgb.slice(0);
    }
    return [Math.round(this._rgb[0]), Math.round(this._rgb[1]), Math.round(this._rgb[2]), this._rgb[3]];
  };

  _guess_formats.push({
    p: 3,
    test: function test(n) {
      var a;
      a = unpack(arguments);
      if (type(a) === 'array' && a.length === 3) {
        return 'rgb';
      }
      if (a.length === 4 && type(a[3]) === "number" && a[3] >= 0 && a[3] <= 1) {
        return 'rgb';
      }
    }
  });

  hex2rgb = function hex2rgb(hex) {
    var a, b, g, r, rgb, u;
    if (hex.match(/^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)) {
      if (hex.length === 4 || hex.length === 7) {
        hex = hex.substr(1);
      }
      if (hex.length === 3) {
        hex = hex.split("");
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      u = parseInt(hex, 16);
      r = u >> 16;
      g = u >> 8 & 0xFF;
      b = u & 0xFF;
      return [r, g, b, 1];
    }
    if (hex.match(/^#?([A-Fa-f0-9]{8})$/)) {
      if (hex.length === 9) {
        hex = hex.substr(1);
      }
      u = parseInt(hex, 16);
      r = u >> 24 & 0xFF;
      g = u >> 16 & 0xFF;
      b = u >> 8 & 0xFF;
      a = round((u & 0xFF) / 0xFF * 100) / 100;
      return [r, g, b, a];
    }
    if (_input.css != null && (rgb = _input.css(hex))) {
      return rgb;
    }
    throw "unknown color: " + hex;
  };

  rgb2hex = function rgb2hex(channels, mode) {
    var a, b, g, hxa, r, str, u;
    if (mode == null) {
      mode = 'rgb';
    }
    r = channels[0], g = channels[1], b = channels[2], a = channels[3];
    r = Math.round(r);
    g = Math.round(g);
    b = Math.round(b);
    u = r << 16 | g << 8 | b;
    str = "000000" + u.toString(16);
    str = str.substr(str.length - 6);
    hxa = '0' + round(a * 255).toString(16);
    hxa = hxa.substr(hxa.length - 2);
    return "#" + function () {
      switch (mode.toLowerCase()) {
        case 'rgba':
          return str + hxa;
        case 'argb':
          return hxa + str;
        default:
          return str;
      }
    }();
  };

  _input.hex = function (h) {
    return hex2rgb(h);
  };

  chroma.hex = function () {
    return function (func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor(),
          result = func.apply(child, args);
      return Object(result) === result ? result : child;
    }(Color, slice.call(arguments).concat(['hex']), function () {});
  };

  Color.prototype.hex = function (mode) {
    if (mode == null) {
      mode = 'rgb';
    }
    return rgb2hex(this._rgb, mode);
  };

  _guess_formats.push({
    p: 4,
    test: function test(n) {
      if (arguments.length === 1 && type(n) === "string") {
        return 'hex';
      }
    }
  });

  hsl2rgb = function hsl2rgb() {
    var args, b, c, g, h, i, l, o, r, ref, s, t1, t2, t3;
    args = unpack(arguments);
    h = args[0], s = args[1], l = args[2];
    if (s === 0) {
      r = g = b = l * 255;
    } else {
      t3 = [0, 0, 0];
      c = [0, 0, 0];
      t2 = l < 0.5 ? l * (1 + s) : l + s - l * s;
      t1 = 2 * l - t2;
      h /= 360;
      t3[0] = h + 1 / 3;
      t3[1] = h;
      t3[2] = h - 1 / 3;
      for (i = o = 0; o <= 2; i = ++o) {
        if (t3[i] < 0) {
          t3[i] += 1;
        }
        if (t3[i] > 1) {
          t3[i] -= 1;
        }
        if (6 * t3[i] < 1) {
          c[i] = t1 + (t2 - t1) * 6 * t3[i];
        } else if (2 * t3[i] < 1) {
          c[i] = t2;
        } else if (3 * t3[i] < 2) {
          c[i] = t1 + (t2 - t1) * (2 / 3 - t3[i]) * 6;
        } else {
          c[i] = t1;
        }
      }
      ref = [round(c[0] * 255), round(c[1] * 255), round(c[2] * 255)], r = ref[0], g = ref[1], b = ref[2];
    }
    if (args.length > 3) {
      return [r, g, b, args[3]];
    } else {
      return [r, g, b];
    }
  };

  rgb2hsl = function rgb2hsl(r, g, b) {
    var h, l, min, ref, s;
    if (r !== void 0 && r.length >= 3) {
      ref = r, r = ref[0], g = ref[1], b = ref[2];
    }
    r /= 255;
    g /= 255;
    b /= 255;
    min = Math.min(r, g, b);
    max = Math.max(r, g, b);
    l = (max + min) / 2;
    if (max === min) {
      s = 0;
      h = Number.NaN;
    } else {
      s = l < 0.5 ? (max - min) / (max + min) : (max - min) / (2 - max - min);
    }
    if (r === max) {
      h = (g - b) / (max - min);
    } else if (g === max) {
      h = 2 + (b - r) / (max - min);
    } else if (b === max) {
      h = 4 + (r - g) / (max - min);
    }
    h *= 60;
    if (h < 0) {
      h += 360;
    }
    return [h, s, l];
  };

  chroma.hsl = function () {
    return function (func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor(),
          result = func.apply(child, args);
      return Object(result) === result ? result : child;
    }(Color, slice.call(arguments).concat(['hsl']), function () {});
  };

  _input.hsl = hsl2rgb;

  Color.prototype.hsl = function () {
    return rgb2hsl(this._rgb);
  };

  hsv2rgb = function hsv2rgb() {
    var args, b, f, g, h, i, p, q, r, ref, ref1, ref2, ref3, ref4, ref5, s, t, v;
    args = unpack(arguments);
    h = args[0], s = args[1], v = args[2];
    v *= 255;
    if (s === 0) {
      r = g = b = v;
    } else {
      if (h === 360) {
        h = 0;
      }
      if (h > 360) {
        h -= 360;
      }
      if (h < 0) {
        h += 360;
      }
      h /= 60;
      i = floor(h);
      f = h - i;
      p = v * (1 - s);
      q = v * (1 - s * f);
      t = v * (1 - s * (1 - f));
      switch (i) {
        case 0:
          ref = [v, t, p], r = ref[0], g = ref[1], b = ref[2];
          break;
        case 1:
          ref1 = [q, v, p], r = ref1[0], g = ref1[1], b = ref1[2];
          break;
        case 2:
          ref2 = [p, v, t], r = ref2[0], g = ref2[1], b = ref2[2];
          break;
        case 3:
          ref3 = [p, q, v], r = ref3[0], g = ref3[1], b = ref3[2];
          break;
        case 4:
          ref4 = [t, p, v], r = ref4[0], g = ref4[1], b = ref4[2];
          break;
        case 5:
          ref5 = [v, p, q], r = ref5[0], g = ref5[1], b = ref5[2];
      }
    }
    return [r, g, b, args.length > 3 ? args[3] : 1];
  };

  rgb2hsv = function rgb2hsv() {
    var b, delta, g, h, min, r, ref, s, v;
    ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
    min = Math.min(r, g, b);
    max = Math.max(r, g, b);
    delta = max - min;
    v = max / 255.0;
    if (max === 0) {
      h = Number.NaN;
      s = 0;
    } else {
      s = delta / max;
      if (r === max) {
        h = (g - b) / delta;
      }
      if (g === max) {
        h = 2 + (b - r) / delta;
      }
      if (b === max) {
        h = 4 + (r - g) / delta;
      }
      h *= 60;
      if (h < 0) {
        h += 360;
      }
    }
    return [h, s, v];
  };

  chroma.hsv = function () {
    return function (func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor(),
          result = func.apply(child, args);
      return Object(result) === result ? result : child;
    }(Color, slice.call(arguments).concat(['hsv']), function () {});
  };

  _input.hsv = hsv2rgb;

  Color.prototype.hsv = function () {
    return rgb2hsv(this._rgb);
  };

  num2rgb = function num2rgb(num) {
    var b, g, r;
    if (type(num) === "number" && num >= 0 && num <= 0xFFFFFF) {
      r = num >> 16;
      g = num >> 8 & 0xFF;
      b = num & 0xFF;
      return [r, g, b, 1];
    }
    console.warn("unknown num color: " + num);
    return [0, 0, 0, 1];
  };

  rgb2num = function rgb2num() {
    var b, g, r, ref;
    ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
    return (r << 16) + (g << 8) + b;
  };

  chroma.num = function (num) {
    return new Color(num, 'num');
  };

  Color.prototype.num = function (mode) {
    if (mode == null) {
      mode = 'rgb';
    }
    return rgb2num(this._rgb, mode);
  };

  _input.num = num2rgb;

  _guess_formats.push({
    p: 1,
    test: function test(n) {
      if (arguments.length === 1 && type(n) === "number" && n >= 0 && n <= 0xFFFFFF) {
        return 'num';
      }
    }
  });

  hcg2rgb = function hcg2rgb() {
    var _c, _g, args, b, c, f, g, h, i, p, q, r, ref, ref1, ref2, ref3, ref4, ref5, t, v;
    args = unpack(arguments);
    h = args[0], c = args[1], _g = args[2];
    c = c / 100;
    g = g / 100 * 255;
    _c = c * 255;
    if (c === 0) {
      r = g = b = _g;
    } else {
      if (h === 360) {
        h = 0;
      }
      if (h > 360) {
        h -= 360;
      }
      if (h < 0) {
        h += 360;
      }
      h /= 60;
      i = floor(h);
      f = h - i;
      p = _g * (1 - c);
      q = p + _c * (1 - f);
      t = p + _c * f;
      v = p + _c;
      switch (i) {
        case 0:
          ref = [v, t, p], r = ref[0], g = ref[1], b = ref[2];
          break;
        case 1:
          ref1 = [q, v, p], r = ref1[0], g = ref1[1], b = ref1[2];
          break;
        case 2:
          ref2 = [p, v, t], r = ref2[0], g = ref2[1], b = ref2[2];
          break;
        case 3:
          ref3 = [p, q, v], r = ref3[0], g = ref3[1], b = ref3[2];
          break;
        case 4:
          ref4 = [t, p, v], r = ref4[0], g = ref4[1], b = ref4[2];
          break;
        case 5:
          ref5 = [v, p, q], r = ref5[0], g = ref5[1], b = ref5[2];
      }
    }
    return [r, g, b, args.length > 3 ? args[3] : 1];
  };

  rgb2hcg = function rgb2hcg() {
    var _g, b, c, delta, g, h, min, r, ref;
    ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
    min = Math.min(r, g, b);
    max = Math.max(r, g, b);
    delta = max - min;
    c = delta * 100 / 255;
    _g = min / (255 - delta) * 100;
    if (delta === 0) {
      h = Number.NaN;
    } else {
      if (r === max) {
        h = (g - b) / delta;
      }
      if (g === max) {
        h = 2 + (b - r) / delta;
      }
      if (b === max) {
        h = 4 + (r - g) / delta;
      }
      h *= 60;
      if (h < 0) {
        h += 360;
      }
    }
    return [h, c, _g];
  };

  chroma.hcg = function () {
    return function (func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor(),
          result = func.apply(child, args);
      return Object(result) === result ? result : child;
    }(Color, slice.call(arguments).concat(['hcg']), function () {});
  };

  _input.hcg = hcg2rgb;

  Color.prototype.hcg = function () {
    return rgb2hcg(this._rgb);
  };

  css2rgb = function css2rgb(css) {
    var aa, ab, hsl, i, m, o, rgb, w;
    css = css.toLowerCase();
    if (chroma.colors != null && chroma.colors[css]) {
      return hex2rgb(chroma.colors[css]);
    }
    if (m = css.match(/rgb\(\s*(\-?\d+),\s*(\-?\d+)\s*,\s*(\-?\d+)\s*\)/)) {
      rgb = m.slice(1, 4);
      for (i = o = 0; o <= 2; i = ++o) {
        rgb[i] = +rgb[i];
      }
      rgb[3] = 1;
    } else if (m = css.match(/rgba\(\s*(\-?\d+),\s*(\-?\d+)\s*,\s*(\-?\d+)\s*,\s*([01]|[01]?\.\d+)\)/)) {
      rgb = m.slice(1, 5);
      for (i = w = 0; w <= 3; i = ++w) {
        rgb[i] = +rgb[i];
      }
    } else if (m = css.match(/rgb\(\s*(\-?\d+(?:\.\d+)?)%,\s*(\-?\d+(?:\.\d+)?)%\s*,\s*(\-?\d+(?:\.\d+)?)%\s*\)/)) {
      rgb = m.slice(1, 4);
      for (i = aa = 0; aa <= 2; i = ++aa) {
        rgb[i] = round(rgb[i] * 2.55);
      }
      rgb[3] = 1;
    } else if (m = css.match(/rgba\(\s*(\-?\d+(?:\.\d+)?)%,\s*(\-?\d+(?:\.\d+)?)%\s*,\s*(\-?\d+(?:\.\d+)?)%\s*,\s*([01]|[01]?\.\d+)\)/)) {
      rgb = m.slice(1, 5);
      for (i = ab = 0; ab <= 2; i = ++ab) {
        rgb[i] = round(rgb[i] * 2.55);
      }
      rgb[3] = +rgb[3];
    } else if (m = css.match(/hsl\(\s*(\-?\d+(?:\.\d+)?),\s*(\-?\d+(?:\.\d+)?)%\s*,\s*(\-?\d+(?:\.\d+)?)%\s*\)/)) {
      hsl = m.slice(1, 4);
      hsl[1] *= 0.01;
      hsl[2] *= 0.01;
      rgb = hsl2rgb(hsl);
      rgb[3] = 1;
    } else if (m = css.match(/hsla\(\s*(\-?\d+(?:\.\d+)?),\s*(\-?\d+(?:\.\d+)?)%\s*,\s*(\-?\d+(?:\.\d+)?)%\s*,\s*([01]|[01]?\.\d+)\)/)) {
      hsl = m.slice(1, 4);
      hsl[1] *= 0.01;
      hsl[2] *= 0.01;
      rgb = hsl2rgb(hsl);
      rgb[3] = +m[4];
    }
    return rgb;
  };

  rgb2css = function rgb2css(rgba) {
    var mode;
    mode = rgba[3] < 1 ? 'rgba' : 'rgb';
    if (mode === 'rgb') {
      return mode + '(' + rgba.slice(0, 3).map(round).join(',') + ')';
    } else if (mode === 'rgba') {
      return mode + '(' + rgba.slice(0, 3).map(round).join(',') + ',' + rgba[3] + ')';
    } else {}
  };

  rnd = function rnd(a) {
    return round(a * 100) / 100;
  };

  hsl2css = function hsl2css(hsl, alpha) {
    var mode;
    mode = alpha < 1 ? 'hsla' : 'hsl';
    hsl[0] = rnd(hsl[0] || 0);
    hsl[1] = rnd(hsl[1] * 100) + '%';
    hsl[2] = rnd(hsl[2] * 100) + '%';
    if (mode === 'hsla') {
      hsl[3] = alpha;
    }
    return mode + '(' + hsl.join(',') + ')';
  };

  _input.css = function (h) {
    return css2rgb(h);
  };

  chroma.css = function () {
    return function (func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor(),
          result = func.apply(child, args);
      return Object(result) === result ? result : child;
    }(Color, slice.call(arguments).concat(['css']), function () {});
  };

  Color.prototype.css = function (mode) {
    if (mode == null) {
      mode = 'rgb';
    }
    if (mode.slice(0, 3) === 'rgb') {
      return rgb2css(this._rgb);
    } else if (mode.slice(0, 3) === 'hsl') {
      return hsl2css(this.hsl(), this.alpha());
    }
  };

  _input.named = function (name) {
    return hex2rgb(w3cx11[name]);
  };

  _guess_formats.push({
    p: 5,
    test: function test(n) {
      if (arguments.length === 1 && w3cx11[n] != null) {
        return 'named';
      }
    }
  });

  Color.prototype.name = function (n) {
    var h, k;
    if (arguments.length) {
      if (w3cx11[n]) {
        this._rgb = hex2rgb(w3cx11[n]);
      }
      this._rgb[3] = 1;
      this;
    }
    h = this.hex();
    for (k in w3cx11) {
      if (h === w3cx11[k]) {
        return k;
      }
    }
    return h;
  };

  lch2lab = function lch2lab() {

    /*
    Convert from a qualitative parameter h and a quantitative parameter l to a 24-bit pixel.
    These formulas were invented by David Dalrymple to obtain maximum contrast without going
    out of gamut if the parameters are in the range 0-1.
    
    A saturation multiplier was added by Gregor Aisch
     */
    var c, h, l, ref;
    ref = unpack(arguments), l = ref[0], c = ref[1], h = ref[2];
    h = h * DEG2RAD;
    return [l, cos(h) * c, sin(h) * c];
  };

  lch2rgb = function lch2rgb() {
    var L$$1, a, args, b, c, g, h, l, r, ref, ref1;
    args = unpack(arguments);
    l = args[0], c = args[1], h = args[2];
    ref = lch2lab(l, c, h), L$$1 = ref[0], a = ref[1], b = ref[2];
    ref1 = lab2rgb(L$$1, a, b), r = ref1[0], g = ref1[1], b = ref1[2];
    return [r, g, b, args.length > 3 ? args[3] : 1];
  };

  lab2lch = function lab2lch() {
    var a, b, c, h, l, ref;
    ref = unpack(arguments), l = ref[0], a = ref[1], b = ref[2];
    c = sqrt(a * a + b * b);
    h = (atan2(b, a) * RAD2DEG + 360) % 360;
    if (round(c * 10000) === 0) {
      h = Number.NaN;
    }
    return [l, c, h];
  };

  rgb2lch = function rgb2lch() {
    var a, b, g, l, r, ref, ref1;
    ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
    ref1 = rgb2lab(r, g, b), l = ref1[0], a = ref1[1], b = ref1[2];
    return lab2lch(l, a, b);
  };

  chroma.lch = function () {
    var args;
    args = unpack(arguments);
    return new Color(args, 'lch');
  };

  chroma.hcl = function () {
    var args;
    args = unpack(arguments);
    return new Color(args, 'hcl');
  };

  _input.lch = lch2rgb;

  _input.hcl = function () {
    var c, h, l, ref;
    ref = unpack(arguments), h = ref[0], c = ref[1], l = ref[2];
    return lch2rgb([l, c, h]);
  };

  Color.prototype.lch = function () {
    return rgb2lch(this._rgb);
  };

  Color.prototype.hcl = function () {
    return rgb2lch(this._rgb).reverse();
  };

  rgb2cmyk = function rgb2cmyk(mode) {
    var b, c, f, g, k, m, r, ref, y;
    if (mode == null) {
      mode = 'rgb';
    }
    ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
    r = r / 255;
    g = g / 255;
    b = b / 255;
    k = 1 - Math.max(r, Math.max(g, b));
    f = k < 1 ? 1 / (1 - k) : 0;
    c = (1 - r - k) * f;
    m = (1 - g - k) * f;
    y = (1 - b - k) * f;
    return [c, m, y, k];
  };

  cmyk2rgb = function cmyk2rgb() {
    var alpha, args, b, c, g, k, m, r, y;
    args = unpack(arguments);
    c = args[0], m = args[1], y = args[2], k = args[3];
    alpha = args.length > 4 ? args[4] : 1;
    if (k === 1) {
      return [0, 0, 0, alpha];
    }
    r = c >= 1 ? 0 : 255 * (1 - c) * (1 - k);
    g = m >= 1 ? 0 : 255 * (1 - m) * (1 - k);
    b = y >= 1 ? 0 : 255 * (1 - y) * (1 - k);
    return [r, g, b, alpha];
  };

  _input.cmyk = function () {
    return cmyk2rgb(unpack(arguments));
  };

  chroma.cmyk = function () {
    return function (func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor(),
          result = func.apply(child, args);
      return Object(result) === result ? result : child;
    }(Color, slice.call(arguments).concat(['cmyk']), function () {});
  };

  Color.prototype.cmyk = function () {
    return rgb2cmyk(this._rgb);
  };

  _input.gl = function () {
    var i, k, o, rgb, v;
    rgb = function () {
      var ref, results;
      ref = unpack(arguments);
      results = [];
      for (k in ref) {
        v = ref[k];
        results.push(v);
      }
      return results;
    }.apply(this, arguments);
    for (i = o = 0; o <= 2; i = ++o) {
      rgb[i] *= 255;
    }
    return rgb;
  };

  chroma.gl = function () {
    return function (func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor(),
          result = func.apply(child, args);
      return Object(result) === result ? result : child;
    }(Color, slice.call(arguments).concat(['gl']), function () {});
  };

  Color.prototype.gl = function () {
    var rgb;
    rgb = this._rgb;
    return [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, rgb[3]];
  };

  rgb2luminance = function rgb2luminance(r, g, b) {
    var ref;
    ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
    r = luminance_x(r);
    g = luminance_x(g);
    b = luminance_x(b);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  luminance_x = function luminance_x(x) {
    x /= 255;
    if (x <= 0.03928) {
      return x / 12.92;
    } else {
      return pow((x + 0.055) / 1.055, 2.4);
    }
  };

  _interpolators = [];

  interpolate = function interpolate(col1, col2, f, m) {
    var interpol, len, o, res;
    if (f == null) {
      f = 0.5;
    }
    if (m == null) {
      m = 'rgb';
    }

    /*
    interpolates between colors
    f = 0 --> me
    f = 1 --> col
     */
    if (type(col1) !== 'object') {
      col1 = chroma(col1);
    }
    if (type(col2) !== 'object') {
      col2 = chroma(col2);
    }
    for (o = 0, len = _interpolators.length; o < len; o++) {
      interpol = _interpolators[o];
      if (m === interpol[0]) {
        res = interpol[1](col1, col2, f, m);
        break;
      }
    }
    if (res == null) {
      throw "color mode " + m + " is not supported";
    }
    return res.alpha(col1.alpha() + f * (col2.alpha() - col1.alpha()));
  };

  chroma.interpolate = interpolate;

  Color.prototype.interpolate = function (col2, f, m) {
    return interpolate(this, col2, f, m);
  };

  chroma.mix = interpolate;

  Color.prototype.mix = Color.prototype.interpolate;

  interpolate_rgb = function interpolate_rgb(col1, col2, f, m) {
    var xyz0, xyz1;
    xyz0 = col1._rgb;
    xyz1 = col2._rgb;
    return new Color(xyz0[0] + f * (xyz1[0] - xyz0[0]), xyz0[1] + f * (xyz1[1] - xyz0[1]), xyz0[2] + f * (xyz1[2] - xyz0[2]), m);
  };

  _interpolators.push(['rgb', interpolate_rgb]);

  Color.prototype.luminance = function (lum, mode) {
    var cur_lum, eps, max_iter, _test;
    if (mode == null) {
      mode = 'rgb';
    }
    if (!arguments.length) {
      return rgb2luminance(this._rgb);
    }
    if (lum === 0) {
      this._rgb = [0, 0, 0, this._rgb[3]];
    } else if (lum === 1) {
      this._rgb = [255, 255, 255, this._rgb[3]];
    } else {
      eps = 1e-7;
      max_iter = 20;
      _test = function test(l, h) {
        var lm, m;
        m = l.interpolate(h, 0.5, mode);
        lm = m.luminance();
        if (Math.abs(lum - lm) < eps || !max_iter--) {
          return m;
        }
        if (lm > lum) {
          return _test(l, m);
        }
        return _test(m, h);
      };
      cur_lum = rgb2luminance(this._rgb);
      this._rgb = (cur_lum > lum ? _test(chroma('black'), this) : _test(this, chroma('white'))).rgba();
    }
    return this;
  };

  temperature2rgb = function temperature2rgb(kelvin) {
    var b, g, r, temp;
    temp = kelvin / 100;
    if (temp < 66) {
      r = 255;
      g = -155.25485562709179 - 0.44596950469579133 * (g = temp - 2) + 104.49216199393888 * log(g);
      b = temp < 20 ? 0 : -254.76935184120902 + 0.8274096064007395 * (b = temp - 10) + 115.67994401066147 * log(b);
    } else {
      r = 351.97690566805693 + 0.114206453784165 * (r = temp - 55) - 40.25366309332127 * log(r);
      g = 325.4494125711974 + 0.07943456536662342 * (g = temp - 50) - 28.0852963507957 * log(g);
      b = 255;
    }
    return [r, g, b];
  };

  rgb2temperature = function rgb2temperature() {
    var b, eps, g, maxTemp, minTemp, r, ref, rgb, temp;
    ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
    minTemp = 1000;
    maxTemp = 40000;
    eps = 0.4;
    while (maxTemp - minTemp > eps) {
      temp = (maxTemp + minTemp) * 0.5;
      rgb = temperature2rgb(temp);
      if (rgb[2] / rgb[0] >= b / r) {
        maxTemp = temp;
      } else {
        minTemp = temp;
      }
    }
    return round(temp);
  };

  chroma.temperature = chroma.kelvin = function () {
    return function (func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor(),
          result = func.apply(child, args);
      return Object(result) === result ? result : child;
    }(Color, slice.call(arguments).concat(['temperature']), function () {});
  };

  _input.temperature = _input.kelvin = _input.K = temperature2rgb;

  Color.prototype.temperature = function () {
    return rgb2temperature(this._rgb);
  };

  Color.prototype.kelvin = Color.prototype.temperature;

  chroma.contrast = function (a, b) {
    var l1, l2, ref, ref1;
    if ((ref = type(a)) === 'string' || ref === 'number') {
      a = new Color(a);
    }
    if ((ref1 = type(b)) === 'string' || ref1 === 'number') {
      b = new Color(b);
    }
    l1 = a.luminance();
    l2 = b.luminance();
    if (l1 > l2) {
      return (l1 + 0.05) / (l2 + 0.05);
    } else {
      return (l2 + 0.05) / (l1 + 0.05);
    }
  };

  chroma.distance = function (a, b, mode) {
    var d, i, l1, l2, ref, ref1, sum_sq;
    if (mode == null) {
      mode = 'lab';
    }
    if ((ref = type(a)) === 'string' || ref === 'number') {
      a = new Color(a);
    }
    if ((ref1 = type(b)) === 'string' || ref1 === 'number') {
      b = new Color(b);
    }
    l1 = a.get(mode);
    l2 = b.get(mode);
    sum_sq = 0;
    for (i in l1) {
      d = (l1[i] || 0) - (l2[i] || 0);
      sum_sq += d * d;
    }
    return Math.sqrt(sum_sq);
  };

  chroma.deltaE = function (a, b, L$$1, C) {
    var L1, L2, a1, a2, b1, b2, c1, c2, c4, dH2, delA, delB, delC, delL, f, h1, ref, ref1, ref2, ref3, sc, sh, sl, t, v1, v2, v3;
    if (L$$1 == null) {
      L$$1 = 1;
    }
    if (C == null) {
      C = 1;
    }
    if ((ref = type(a)) === 'string' || ref === 'number') {
      a = new Color(a);
    }
    if ((ref1 = type(b)) === 'string' || ref1 === 'number') {
      b = new Color(b);
    }
    ref2 = a.lab(), L1 = ref2[0], a1 = ref2[1], b1 = ref2[2];
    ref3 = b.lab(), L2 = ref3[0], a2 = ref3[1], b2 = ref3[2];
    c1 = sqrt(a1 * a1 + b1 * b1);
    c2 = sqrt(a2 * a2 + b2 * b2);
    sl = L1 < 16.0 ? 0.511 : 0.040975 * L1 / (1.0 + 0.01765 * L1);
    sc = 0.0638 * c1 / (1.0 + 0.0131 * c1) + 0.638;
    h1 = c1 < 0.000001 ? 0.0 : atan2(b1, a1) * 180.0 / PI;
    while (h1 < 0) {
      h1 += 360;
    }
    while (h1 >= 360) {
      h1 -= 360;
    }
    t = h1 >= 164.0 && h1 <= 345.0 ? 0.56 + abs(0.2 * cos(PI * (h1 + 168.0) / 180.0)) : 0.36 + abs(0.4 * cos(PI * (h1 + 35.0) / 180.0));
    c4 = c1 * c1 * c1 * c1;
    f = sqrt(c4 / (c4 + 1900.0));
    sh = sc * (f * t + 1.0 - f);
    delL = L1 - L2;
    delC = c1 - c2;
    delA = a1 - a2;
    delB = b1 - b2;
    dH2 = delA * delA + delB * delB - delC * delC;
    v1 = delL / (L$$1 * sl);
    v2 = delC / (C * sc);
    v3 = sh;
    return sqrt(v1 * v1 + v2 * v2 + dH2 / (v3 * v3));
  };

  Color.prototype.get = function (modechan) {
    var channel, i, me, mode, ref, src;
    me = this;
    ref = modechan.split('.'), mode = ref[0], channel = ref[1];
    src = me[mode]();
    if (channel) {
      i = mode.indexOf(channel);
      if (i > -1) {
        return src[i];
      } else {
        return console.warn('unknown channel ' + channel + ' in mode ' + mode);
      }
    } else {
      return src;
    }
  };

  Color.prototype.set = function (modechan, value) {
    var channel, i, me, mode, ref, src;
    me = this;
    ref = modechan.split('.'), mode = ref[0], channel = ref[1];
    if (channel) {
      src = me[mode]();
      i = mode.indexOf(channel);
      if (i > -1) {
        if (type(value) === 'string') {
          switch (value.charAt(0)) {
            case '+':
              src[i] += +value;
              break;
            case '-':
              src[i] += +value;
              break;
            case '*':
              src[i] *= +value.substr(1);
              break;
            case '/':
              src[i] /= +value.substr(1);
              break;
            default:
              src[i] = +value;
          }
        } else {
          src[i] = value;
        }
      } else {
        console.warn('unknown channel ' + channel + ' in mode ' + mode);
      }
    } else {
      src = value;
    }
    return chroma(src, mode).alpha(me.alpha());
  };

  Color.prototype.clipped = function () {
    return this._rgb._clipped || false;
  };

  Color.prototype.alpha = function (a) {
    if (arguments.length) {
      return chroma.rgb([this._rgb[0], this._rgb[1], this._rgb[2], a]);
    }
    return this._rgb[3];
  };

  Color.prototype.darken = function (amount) {
    var lab, me;
    if (amount == null) {
      amount = 1;
    }
    me = this;
    lab = me.lab();
    lab[0] -= LAB_CONSTANTS.Kn * amount;
    return chroma.lab(lab).alpha(me.alpha());
  };

  Color.prototype.brighten = function (amount) {
    if (amount == null) {
      amount = 1;
    }
    return this.darken(-amount);
  };

  Color.prototype.darker = Color.prototype.darken;

  Color.prototype.brighter = Color.prototype.brighten;

  Color.prototype.saturate = function (amount) {
    var lch, me;
    if (amount == null) {
      amount = 1;
    }
    me = this;
    lch = me.lch();
    lch[1] += amount * LAB_CONSTANTS.Kn;
    if (lch[1] < 0) {
      lch[1] = 0;
    }
    return chroma.lch(lch).alpha(me.alpha());
  };

  Color.prototype.desaturate = function (amount) {
    if (amount == null) {
      amount = 1;
    }
    return this.saturate(-amount);
  };

  Color.prototype.premultiply = function () {
    var a, rgb;
    rgb = this.rgb();
    a = this.alpha();
    return chroma(rgb[0] * a, rgb[1] * a, rgb[2] * a, a);
  };

  _blend = function blend(bottom, top, mode) {
    if (!_blend[mode]) {
      throw 'unknown blend mode ' + mode;
    }
    return _blend[mode](bottom, top);
  };

  blend_f = function blend_f(f) {
    return function (bottom, top) {
      var c0, c1;
      c0 = chroma(top).rgb();
      c1 = chroma(bottom).rgb();
      return chroma(f(c0, c1), 'rgb');
    };
  };

  each = function each(f) {
    return function (c0, c1) {
      var i, o, out;
      out = [];
      for (i = o = 0; o <= 3; i = ++o) {
        out[i] = f(c0[i], c1[i]);
      }
      return out;
    };
  };

  normal = function normal(a, b) {
    return a;
  };

  multiply = function multiply(a, b) {
    return a * b / 255;
  };

  darken = function darken(a, b) {
    if (a > b) {
      return b;
    } else {
      return a;
    }
  };

  lighten = function lighten(a, b) {
    if (a > b) {
      return a;
    } else {
      return b;
    }
  };

  screen = function screen(a, b) {
    return 255 * (1 - (1 - a / 255) * (1 - b / 255));
  };

  overlay = function overlay(a, b) {
    if (b < 128) {
      return 2 * a * b / 255;
    } else {
      return 255 * (1 - 2 * (1 - a / 255) * (1 - b / 255));
    }
  };

  burn = function burn(a, b) {
    return 255 * (1 - (1 - b / 255) / (a / 255));
  };

  dodge = function dodge(a, b) {
    if (a === 255) {
      return 255;
    }
    a = 255 * (b / 255) / (1 - a / 255);
    if (a > 255) {
      return 255;
    } else {
      return a;
    }
  };

  _blend.normal = blend_f(each(normal));

  _blend.multiply = blend_f(each(multiply));

  _blend.screen = blend_f(each(screen));

  _blend.overlay = blend_f(each(overlay));

  _blend.darken = blend_f(each(darken));

  _blend.lighten = blend_f(each(lighten));

  _blend.dodge = blend_f(each(dodge));

  _blend.burn = blend_f(each(burn));

  chroma.blend = _blend;

  chroma.analyze = function (data) {
    var len, o, r, val;
    r = {
      min: Number.MAX_VALUE,
      max: Number.MAX_VALUE * -1,
      sum: 0,
      values: [],
      count: 0
    };
    for (o = 0, len = data.length; o < len; o++) {
      val = data[o];
      if (val != null && !isNaN(val)) {
        r.values.push(val);
        r.sum += val;
        if (val < r.min) {
          r.min = val;
        }
        if (val > r.max) {
          r.max = val;
        }
        r.count += 1;
      }
    }
    r.domain = [r.min, r.max];
    r.limits = function (mode, num) {
      return chroma.limits(r, mode, num);
    };
    return r;
  };

  chroma.scale = function (colors, positions) {
    var _classes, _colorCache, _colors, _correctLightness, _domain, _fixed, _max, _min, _mode, _nacol, _out, _padding, _pos, _spread, _useCache, classifyValue, f, getClass, getColor, resetCache, setColors, tmap;
    _mode = 'rgb';
    _nacol = chroma('#ccc');
    _spread = 0;
    _fixed = false;
    _domain = [0, 1];
    _pos = [];
    _padding = [0, 0];
    _classes = false;
    _colors = [];
    _out = false;
    _min = 0;
    _max = 1;
    _correctLightness = false;
    _colorCache = {};
    _useCache = true;
    setColors = function setColors(colors) {
      var c, col, o, ref, ref1, w;
      if (colors == null) {
        colors = ['#fff', '#000'];
      }
      if (colors != null && type(colors) === 'string' && chroma.brewer != null) {
        colors = chroma.brewer[colors] || chroma.brewer[colors.toLowerCase()] || colors;
      }
      if (type(colors) === 'array') {
        colors = colors.slice(0);
        for (c = o = 0, ref = colors.length - 1; 0 <= ref ? o <= ref : o >= ref; c = 0 <= ref ? ++o : --o) {
          col = colors[c];
          if (type(col) === "string") {
            colors[c] = chroma(col);
          }
        }
        _pos.length = 0;
        for (c = w = 0, ref1 = colors.length - 1; 0 <= ref1 ? w <= ref1 : w >= ref1; c = 0 <= ref1 ? ++w : --w) {
          _pos.push(c / (colors.length - 1));
        }
      }
      resetCache();
      return _colors = colors;
    };
    getClass = function getClass(value) {
      var i, n;
      if (_classes != null) {
        n = _classes.length - 1;
        i = 0;
        while (i < n && value >= _classes[i]) {
          i++;
        }
        return i - 1;
      }
      return 0;
    };
    tmap = function tmap(t) {
      return t;
    };
    classifyValue = function classifyValue(value) {
      var i, maxc, minc, n, val;
      val = value;
      if (_classes.length > 2) {
        n = _classes.length - 1;
        i = getClass(value);
        minc = _classes[0] + (_classes[1] - _classes[0]) * (0 + _spread * 0.5);
        maxc = _classes[n - 1] + (_classes[n] - _classes[n - 1]) * (1 - _spread * 0.5);
        val = _min + (_classes[i] + (_classes[i + 1] - _classes[i]) * 0.5 - minc) / (maxc - minc) * (_max - _min);
      }
      return val;
    };
    getColor = function getColor(val, bypassMap) {
      var c, col, i, k, o, p, ref, t;
      if (bypassMap == null) {
        bypassMap = false;
      }
      if (isNaN(val)) {
        return _nacol;
      }
      if (!bypassMap) {
        if (_classes && _classes.length > 2) {
          c = getClass(val);
          t = c / (_classes.length - 2);
          t = _padding[0] + t * (1 - _padding[0] - _padding[1]);
        } else if (_max !== _min) {
          t = (val - _min) / (_max - _min);
          t = _padding[0] + t * (1 - _padding[0] - _padding[1]);
          t = Math.min(1, Math.max(0, t));
        } else {
          t = 1;
        }
      } else {
        t = val;
      }
      if (!bypassMap) {
        t = tmap(t);
      }
      k = Math.floor(t * 10000);
      if (_useCache && _colorCache[k]) {
        col = _colorCache[k];
      } else {
        if (type(_colors) === 'array') {
          for (i = o = 0, ref = _pos.length - 1; 0 <= ref ? o <= ref : o >= ref; i = 0 <= ref ? ++o : --o) {
            p = _pos[i];
            if (t <= p) {
              col = _colors[i];
              break;
            }
            if (t >= p && i === _pos.length - 1) {
              col = _colors[i];
              break;
            }
            if (t > p && t < _pos[i + 1]) {
              t = (t - p) / (_pos[i + 1] - p);
              col = chroma.interpolate(_colors[i], _colors[i + 1], t, _mode);
              break;
            }
          }
        } else if (type(_colors) === 'function') {
          col = _colors(t);
        }
        if (_useCache) {
          _colorCache[k] = col;
        }
      }
      return col;
    };
    resetCache = function resetCache() {
      return _colorCache = {};
    };
    setColors(colors);
    f = function f(v) {
      var c;
      c = chroma(getColor(v));
      if (_out && c[_out]) {
        return c[_out]();
      } else {
        return c;
      }
    };
    f.classes = function (classes) {
      var d;
      if (classes != null) {
        if (type(classes) === 'array') {
          _classes = classes;
          _domain = [classes[0], classes[classes.length - 1]];
        } else {
          d = chroma.analyze(_domain);
          if (classes === 0) {
            _classes = [d.min, d.max];
          } else {
            _classes = chroma.limits(d, 'e', classes);
          }
        }
        return f;
      }
      return _classes;
    };
    f.domain = function (domain) {
      var c, d, k, len, o, ref, w;
      if (!arguments.length) {
        return _domain;
      }
      _min = domain[0];
      _max = domain[domain.length - 1];
      _pos = [];
      k = _colors.length;
      if (domain.length === k && _min !== _max) {
        for (o = 0, len = domain.length; o < len; o++) {
          d = domain[o];
          _pos.push((d - _min) / (_max - _min));
        }
      } else {
        for (c = w = 0, ref = k - 1; 0 <= ref ? w <= ref : w >= ref; c = 0 <= ref ? ++w : --w) {
          _pos.push(c / (k - 1));
        }
      }
      _domain = [_min, _max];
      return f;
    };
    f.mode = function (_m) {
      if (!arguments.length) {
        return _mode;
      }
      _mode = _m;
      resetCache();
      return f;
    };
    f.range = function (colors, _pos) {
      setColors(colors, _pos);
      return f;
    };
    f.out = function (_o) {
      _out = _o;
      return f;
    };
    f.spread = function (val) {
      if (!arguments.length) {
        return _spread;
      }
      _spread = val;
      return f;
    };
    f.correctLightness = function (v) {
      if (v == null) {
        v = true;
      }
      _correctLightness = v;
      resetCache();
      if (_correctLightness) {
        tmap = function tmap(t) {
          var L0, L1, L_actual, L_diff, L_ideal, max_iter, pol, t0, t1;
          L0 = getColor(0, true).lab()[0];
          L1 = getColor(1, true).lab()[0];
          pol = L0 > L1;
          L_actual = getColor(t, true).lab()[0];
          L_ideal = L0 + (L1 - L0) * t;
          L_diff = L_actual - L_ideal;
          t0 = 0;
          t1 = 1;
          max_iter = 20;
          while (Math.abs(L_diff) > 1e-2 && max_iter-- > 0) {
            (function () {
              if (pol) {
                L_diff *= -1;
              }
              if (L_diff < 0) {
                t0 = t;
                t += (t1 - t) * 0.5;
              } else {
                t1 = t;
                t += (t0 - t) * 0.5;
              }
              L_actual = getColor(t, true).lab()[0];
              return L_diff = L_actual - L_ideal;
            })();
          }
          return t;
        };
      } else {
        tmap = function tmap(t) {
          return t;
        };
      }
      return f;
    };
    f.padding = function (p) {
      if (p != null) {
        if (type(p) === 'number') {
          p = [p, p];
        }
        _padding = p;
        return f;
      } else {
        return _padding;
      }
    };
    f.colors = function (numColors, out) {
      var dd, dm, i, o, ref, result, results, samples, w;
      if (arguments.length < 2) {
        out = 'hex';
      }
      result = [];
      if (arguments.length === 0) {
        result = _colors.slice(0);
      } else if (numColors === 1) {
        result = [f(0.5)];
      } else if (numColors > 1) {
        dm = _domain[0];
        dd = _domain[1] - dm;
        result = function () {
          results = [];
          for (var o = 0; 0 <= numColors ? o < numColors : o > numColors; 0 <= numColors ? o++ : o--) {
            results.push(o);
          }
          return results;
        }.apply(this).map(function (i) {
          return f(dm + i / (numColors - 1) * dd);
        });
      } else {
        colors = [];
        samples = [];
        if (_classes && _classes.length > 2) {
          for (i = w = 1, ref = _classes.length; 1 <= ref ? w < ref : w > ref; i = 1 <= ref ? ++w : --w) {
            samples.push((_classes[i - 1] + _classes[i]) * 0.5);
          }
        } else {
          samples = _domain;
        }
        result = samples.map(function (v) {
          return f(v);
        });
      }
      if (chroma[out]) {
        result = result.map(function (c) {
          return c[out]();
        });
      }
      return result;
    };
    f.cache = function (c) {
      if (c != null) {
        return _useCache = c;
      } else {
        return _useCache;
      }
    };
    return f;
  };

  if (chroma.scales == null) {
    chroma.scales = {};
  }

  chroma.scales.cool = function () {
    return chroma.scale([chroma.hsl(180, 1, .9), chroma.hsl(250, .7, .4)]);
  };

  chroma.scales.hot = function () {
    return chroma.scale(['#000', '#f00', '#ff0', '#fff'], [0, .25, .75, 1]).mode('rgb');
  };

  chroma.analyze = function (data, key, filter) {
    var add, k, len, o, r, val, visit;
    r = {
      min: Number.MAX_VALUE,
      max: Number.MAX_VALUE * -1,
      sum: 0,
      values: [],
      count: 0
    };
    if (filter == null) {
      filter = function filter() {
        return true;
      };
    }
    add = function add(val) {
      if (val != null && !isNaN(val)) {
        r.values.push(val);
        r.sum += val;
        if (val < r.min) {
          r.min = val;
        }
        if (val > r.max) {
          r.max = val;
        }
        r.count += 1;
      }
    };
    visit = function visit(val, k) {
      if (filter(val, k)) {
        if (key != null && type(key) === 'function') {
          return add(key(val));
        } else if (key != null && type(key) === 'string' || type(key) === 'number') {
          return add(val[key]);
        } else {
          return add(val);
        }
      }
    };
    if (type(data) === 'array') {
      for (o = 0, len = data.length; o < len; o++) {
        val = data[o];
        visit(val);
      }
    } else {
      for (k in data) {
        val = data[k];
        visit(val, k);
      }
    }
    r.domain = [r.min, r.max];
    r.limits = function (mode, num) {
      return chroma.limits(r, mode, num);
    };
    return r;
  };

  chroma.limits = function (data, mode, num) {
    var aa, ab, ac, ad, ae, af, ag, ah, ai, aj, ak, al, am, assignments, best, centroids, cluster, clusterSizes, dist, i, j, kClusters, limits, max_log, min, min_log, mindist, n, nb_iters, newCentroids, o, p, pb, pr, ref, ref1, ref10, ref11, ref12, ref13, ref14, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, repeat, sum, tmpKMeansBreaks, v, value, values, w;
    if (mode == null) {
      mode = 'equal';
    }
    if (num == null) {
      num = 7;
    }
    if (type(data) === 'array') {
      data = chroma.analyze(data);
    }
    min = data.min;
    max = data.max;
    sum = data.sum;
    values = data.values.sort(function (a, b) {
      return a - b;
    });
    if (num === 1) {
      return [min, max];
    }
    limits = [];
    if (mode.substr(0, 1) === 'c') {
      limits.push(min);
      limits.push(max);
    }
    if (mode.substr(0, 1) === 'e') {
      limits.push(min);
      for (i = o = 1, ref = num - 1; 1 <= ref ? o <= ref : o >= ref; i = 1 <= ref ? ++o : --o) {
        limits.push(min + i / num * (max - min));
      }
      limits.push(max);
    } else if (mode.substr(0, 1) === 'l') {
      if (min <= 0) {
        throw 'Logarithmic scales are only possible for values > 0';
      }
      min_log = Math.LOG10E * log(min);
      max_log = Math.LOG10E * log(max);
      limits.push(min);
      for (i = w = 1, ref1 = num - 1; 1 <= ref1 ? w <= ref1 : w >= ref1; i = 1 <= ref1 ? ++w : --w) {
        limits.push(pow(10, min_log + i / num * (max_log - min_log)));
      }
      limits.push(max);
    } else if (mode.substr(0, 1) === 'q') {
      limits.push(min);
      for (i = aa = 1, ref2 = num - 1; 1 <= ref2 ? aa <= ref2 : aa >= ref2; i = 1 <= ref2 ? ++aa : --aa) {
        p = (values.length - 1) * i / num;
        pb = floor(p);
        if (pb === p) {
          limits.push(values[pb]);
        } else {
          pr = p - pb;
          limits.push(values[pb] * (1 - pr) + values[pb + 1] * pr);
        }
      }
      limits.push(max);
    } else if (mode.substr(0, 1) === 'k') {

      /*
      implementation based on
      http://code.google.com/p/figue/source/browse/trunk/figue.js#336
      simplified for 1-d input values
       */
      n = values.length;
      assignments = new Array(n);
      clusterSizes = new Array(num);
      repeat = true;
      nb_iters = 0;
      centroids = null;
      centroids = [];
      centroids.push(min);
      for (i = ab = 1, ref3 = num - 1; 1 <= ref3 ? ab <= ref3 : ab >= ref3; i = 1 <= ref3 ? ++ab : --ab) {
        centroids.push(min + i / num * (max - min));
      }
      centroids.push(max);
      while (repeat) {
        for (j = ac = 0, ref4 = num - 1; 0 <= ref4 ? ac <= ref4 : ac >= ref4; j = 0 <= ref4 ? ++ac : --ac) {
          clusterSizes[j] = 0;
        }
        for (i = ad = 0, ref5 = n - 1; 0 <= ref5 ? ad <= ref5 : ad >= ref5; i = 0 <= ref5 ? ++ad : --ad) {
          value = values[i];
          mindist = Number.MAX_VALUE;
          for (j = ae = 0, ref6 = num - 1; 0 <= ref6 ? ae <= ref6 : ae >= ref6; j = 0 <= ref6 ? ++ae : --ae) {
            dist = abs(centroids[j] - value);
            if (dist < mindist) {
              mindist = dist;
              best = j;
            }
          }
          clusterSizes[best]++;
          assignments[i] = best;
        }
        newCentroids = new Array(num);
        for (j = af = 0, ref7 = num - 1; 0 <= ref7 ? af <= ref7 : af >= ref7; j = 0 <= ref7 ? ++af : --af) {
          newCentroids[j] = null;
        }
        for (i = ag = 0, ref8 = n - 1; 0 <= ref8 ? ag <= ref8 : ag >= ref8; i = 0 <= ref8 ? ++ag : --ag) {
          cluster = assignments[i];
          if (newCentroids[cluster] === null) {
            newCentroids[cluster] = values[i];
          } else {
            newCentroids[cluster] += values[i];
          }
        }
        for (j = ah = 0, ref9 = num - 1; 0 <= ref9 ? ah <= ref9 : ah >= ref9; j = 0 <= ref9 ? ++ah : --ah) {
          newCentroids[j] *= 1 / clusterSizes[j];
        }
        repeat = false;
        for (j = ai = 0, ref10 = num - 1; 0 <= ref10 ? ai <= ref10 : ai >= ref10; j = 0 <= ref10 ? ++ai : --ai) {
          if (newCentroids[j] !== centroids[i]) {
            repeat = true;
            break;
          }
        }
        centroids = newCentroids;
        nb_iters++;
        if (nb_iters > 200) {
          repeat = false;
        }
      }
      kClusters = {};
      for (j = aj = 0, ref11 = num - 1; 0 <= ref11 ? aj <= ref11 : aj >= ref11; j = 0 <= ref11 ? ++aj : --aj) {
        kClusters[j] = [];
      }
      for (i = ak = 0, ref12 = n - 1; 0 <= ref12 ? ak <= ref12 : ak >= ref12; i = 0 <= ref12 ? ++ak : --ak) {
        cluster = assignments[i];
        kClusters[cluster].push(values[i]);
      }
      tmpKMeansBreaks = [];
      for (j = al = 0, ref13 = num - 1; 0 <= ref13 ? al <= ref13 : al >= ref13; j = 0 <= ref13 ? ++al : --al) {
        tmpKMeansBreaks.push(kClusters[j][0]);
        tmpKMeansBreaks.push(kClusters[j][kClusters[j].length - 1]);
      }
      tmpKMeansBreaks = tmpKMeansBreaks.sort(function (a, b) {
        return a - b;
      });
      limits.push(tmpKMeansBreaks[0]);
      for (i = am = 1, ref14 = tmpKMeansBreaks.length - 1; am <= ref14; i = am += 2) {
        v = tmpKMeansBreaks[i];
        if (!isNaN(v) && limits.indexOf(v) === -1) {
          limits.push(v);
        }
      }
    }
    return limits;
  };

  hsi2rgb = function hsi2rgb(h, s, i) {

    /*
    borrowed from here:
    http://hummer.stanford.edu/museinfo/doc/examples/humdrum/keyscape2/hsi2rgb.cpp
     */
    var args, b, g, r;
    args = unpack(arguments);
    h = args[0], s = args[1], i = args[2];
    if (isNaN(h)) {
      h = 0;
    }
    h /= 360;
    if (h < 1 / 3) {
      b = (1 - s) / 3;
      r = (1 + s * cos(TWOPI * h) / cos(PITHIRD - TWOPI * h)) / 3;
      g = 1 - (b + r);
    } else if (h < 2 / 3) {
      h -= 1 / 3;
      r = (1 - s) / 3;
      g = (1 + s * cos(TWOPI * h) / cos(PITHIRD - TWOPI * h)) / 3;
      b = 1 - (r + g);
    } else {
      h -= 2 / 3;
      g = (1 - s) / 3;
      b = (1 + s * cos(TWOPI * h) / cos(PITHIRD - TWOPI * h)) / 3;
      r = 1 - (g + b);
    }
    r = limit(i * r * 3);
    g = limit(i * g * 3);
    b = limit(i * b * 3);
    return [r * 255, g * 255, b * 255, args.length > 3 ? args[3] : 1];
  };

  rgb2hsi = function rgb2hsi() {

    /*
    borrowed from here:
    http://hummer.stanford.edu/museinfo/doc/examples/humdrum/keyscape2/rgb2hsi.cpp
     */
    var b, g, h, i, min, r, ref, s;
    ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
    TWOPI = Math.PI * 2;
    r /= 255;
    g /= 255;
    b /= 255;
    min = Math.min(r, g, b);
    i = (r + g + b) / 3;
    s = 1 - min / i;
    if (s === 0) {
      h = 0;
    } else {
      h = (r - g + (r - b)) / 2;
      h /= Math.sqrt((r - g) * (r - g) + (r - b) * (g - b));
      h = Math.acos(h);
      if (b > g) {
        h = TWOPI - h;
      }
      h /= TWOPI;
    }
    return [h * 360, s, i];
  };

  chroma.hsi = function () {
    return function (func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor(),
          result = func.apply(child, args);
      return Object(result) === result ? result : child;
    }(Color, slice.call(arguments).concat(['hsi']), function () {});
  };

  _input.hsi = hsi2rgb;

  Color.prototype.hsi = function () {
    return rgb2hsi(this._rgb);
  };

  interpolate_hsx = function interpolate_hsx(col1, col2, f, m) {
    var dh, hue, hue0, hue1, lbv, lbv0, lbv1, res, sat, sat0, sat1, xyz0, xyz1;
    if (m === 'hsl') {
      xyz0 = col1.hsl();
      xyz1 = col2.hsl();
    } else if (m === 'hsv') {
      xyz0 = col1.hsv();
      xyz1 = col2.hsv();
    } else if (m === 'hcg') {
      xyz0 = col1.hcg();
      xyz1 = col2.hcg();
    } else if (m === 'hsi') {
      xyz0 = col1.hsi();
      xyz1 = col2.hsi();
    } else if (m === 'lch' || m === 'hcl') {
      m = 'hcl';
      xyz0 = col1.hcl();
      xyz1 = col2.hcl();
    }
    if (m.substr(0, 1) === 'h') {
      hue0 = xyz0[0], sat0 = xyz0[1], lbv0 = xyz0[2];
      hue1 = xyz1[0], sat1 = xyz1[1], lbv1 = xyz1[2];
    }
    if (!isNaN(hue0) && !isNaN(hue1)) {
      if (hue1 > hue0 && hue1 - hue0 > 180) {
        dh = hue1 - (hue0 + 360);
      } else if (hue1 < hue0 && hue0 - hue1 > 180) {
        dh = hue1 + 360 - hue0;
      } else {
        dh = hue1 - hue0;
      }
      hue = hue0 + f * dh;
    } else if (!isNaN(hue0)) {
      hue = hue0;
      if ((lbv1 === 1 || lbv1 === 0) && m !== 'hsv') {
        sat = sat0;
      }
    } else if (!isNaN(hue1)) {
      hue = hue1;
      if ((lbv0 === 1 || lbv0 === 0) && m !== 'hsv') {
        sat = sat1;
      }
    } else {
      hue = Number.NaN;
    }
    if (sat == null) {
      sat = sat0 + f * (sat1 - sat0);
    }
    lbv = lbv0 + f * (lbv1 - lbv0);
    return res = chroma[m](hue, sat, lbv);
  };

  _interpolators = _interpolators.concat(function () {
    var len, o, ref, results;
    ref = ['hsv', 'hsl', 'hsi', 'hcl', 'lch', 'hcg'];
    results = [];
    for (o = 0, len = ref.length; o < len; o++) {
      m = ref[o];
      results.push([m, interpolate_hsx]);
    }
    return results;
  }());

  interpolate_num = function interpolate_num(col1, col2, f, m) {
    var n1, n2;
    n1 = col1.num();
    n2 = col2.num();
    return chroma.num(n1 + (n2 - n1) * f, 'num');
  };

  _interpolators.push(['num', interpolate_num]);

  interpolate_lab = function interpolate_lab(col1, col2, f, m) {
    var res, xyz0, xyz1;
    xyz0 = col1.lab();
    xyz1 = col2.lab();
    return res = new Color(xyz0[0] + f * (xyz1[0] - xyz0[0]), xyz0[1] + f * (xyz1[1] - xyz0[1]), xyz0[2] + f * (xyz1[2] - xyz0[2]), m);
  };

  _interpolators.push(['lab', interpolate_lab]);
}).call(commonjsGlobal);
});

var ascending$1 = function (a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
};

var bisector = function (compare) {
  if (compare.length === 1) compare = ascendingComparator(compare);
  return {
    left: function left(a, x, lo, hi) {
      if (lo == null) lo = 0;
      if (hi == null) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (compare(a[mid], x) < 0) lo = mid + 1;else hi = mid;
      }
      return lo;
    },
    right: function right(a, x, lo, hi) {
      if (lo == null) lo = 0;
      if (hi == null) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (compare(a[mid], x) > 0) hi = mid;else lo = mid + 1;
      }
      return lo;
    }
  };
};

function ascendingComparator(f) {
  return function (d, x) {
    return ascending$1(f(d), x);
  };
}

var ascendingBisect = bisector(ascending$1);
var bisectRight = ascendingBisect.right;

function pair(a, b) {
  return [a, b];
}

var number = function (x) {
  return x === null ? NaN : +x;
};

var extent = function (values, valueof) {
  var n = values.length,
      i = -1,
      value,
      min,
      max;

  if (valueof == null) {
    while (++i < n) {
      // Find the first comparable value.
      if ((value = values[i]) != null && value >= value) {
        min = max = value;
        while (++i < n) {
          // Compare the remaining values.
          if ((value = values[i]) != null) {
            if (min > value) min = value;
            if (max < value) max = value;
          }
        }
      }
    }
  } else {
    while (++i < n) {
      // Find the first comparable value.
      if ((value = valueof(values[i], i, values)) != null && value >= value) {
        min = max = value;
        while (++i < n) {
          // Compare the remaining values.
          if ((value = valueof(values[i], i, values)) != null) {
            if (min > value) min = value;
            if (max < value) max = value;
          }
        }
      }
    }
  }

  return [min, max];
};

var identity$2 = function (x) {
  return x;
};

var range$1 = function (start, stop, step) {
  start = +start, stop = +stop, step = (n = arguments.length) < 2 ? (stop = start, start = 0, 1) : n < 3 ? 1 : +step;

  var i = -1,
      n = Math.max(0, Math.ceil((stop - start) / step)) | 0,
      range = new Array(n);

  while (++i < n) {
    range[i] = start + i * step;
  }

  return range;
};

var e10 = Math.sqrt(50);
var e5 = Math.sqrt(10);
var e2 = Math.sqrt(2);

var ticks = function (start, stop, count) {
    var reverse = stop < start,
        i = -1,
        n,
        ticks,
        step;

    if (reverse) n = start, start = stop, stop = n;

    if ((step = tickIncrement(start, stop, count)) === 0 || !isFinite(step)) return [];

    if (step > 0) {
        start = Math.ceil(start / step);
        stop = Math.floor(stop / step);
        ticks = new Array(n = Math.ceil(stop - start + 1));
        while (++i < n) {
            ticks[i] = (start + i) * step;
        }
    } else {
        start = Math.floor(start * step);
        stop = Math.ceil(stop * step);
        ticks = new Array(n = Math.ceil(start - stop + 1));
        while (++i < n) {
            ticks[i] = (start - i) / step;
        }
    }

    if (reverse) ticks.reverse();

    return ticks;
};

function tickIncrement(start, stop, count) {
    var step = (stop - start) / Math.max(0, count),
        power = Math.floor(Math.log(step) / Math.LN10),
        error = step / Math.pow(10, power);
    return power >= 0 ? (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1) * Math.pow(10, power) : -Math.pow(10, -power) / (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1);
}

function tickStep(start, stop, count) {
    var step0 = Math.abs(stop - start) / Math.max(0, count),
        step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10)),
        error = step0 / step1;
    if (error >= e10) step1 *= 10;else if (error >= e5) step1 *= 5;else if (error >= e2) step1 *= 2;
    return stop < start ? -step1 : step1;
}

var sturges = function (values) {
  return Math.ceil(Math.log(values.length) / Math.LN2) + 1;
};

var threshold = function (values, p, valueof) {
  if (valueof == null) valueof = number;
  if (!(n = values.length)) return;
  if ((p = +p) <= 0 || n < 2) return +valueof(values[0], 0, values);
  if (p >= 1) return +valueof(values[n - 1], n - 1, values);
  var n,
      i = (n - 1) * p,
      i0 = Math.floor(i),
      value0 = +valueof(values[i0], i0, values),
      value1 = +valueof(values[i0 + 1], i0 + 1, values);
  return value0 + (value1 - value0) * (i - i0);
};

var max = function (values, valueof) {
  var n = values.length,
      i = -1,
      value,
      max;

  if (valueof == null) {
    while (++i < n) {
      // Find the first comparable value.
      if ((value = values[i]) != null && value >= value) {
        max = value;
        while (++i < n) {
          // Compare the remaining values.
          if ((value = values[i]) != null && value > max) {
            max = value;
          }
        }
      }
    }
  } else {
    while (++i < n) {
      // Find the first comparable value.
      if ((value = valueof(values[i], i, values)) != null && value >= value) {
        max = value;
        while (++i < n) {
          // Compare the remaining values.
          if ((value = valueof(values[i], i, values)) != null && value > max) {
            max = value;
          }
        }
      }
    }
  }

  return max;
};

var merge$1 = function (arrays) {
  var n = arrays.length,
      m,
      i = -1,
      j = 0,
      merged,
      array;

  while (++i < n) {
    j += arrays[i].length;
  }merged = new Array(j);

  while (--n >= 0) {
    array = arrays[n];
    m = array.length;
    while (--m >= 0) {
      merged[--j] = array[m];
    }
  }

  return merged;
};

var min$1 = function (values, valueof) {
  var n = values.length,
      i = -1,
      value,
      min;

  if (valueof == null) {
    while (++i < n) {
      // Find the first comparable value.
      if ((value = values[i]) != null && value >= value) {
        min = value;
        while (++i < n) {
          // Compare the remaining values.
          if ((value = values[i]) != null && min > value) {
            min = value;
          }
        }
      }
    }
  } else {
    while (++i < n) {
      // Find the first comparable value.
      if ((value = valueof(values[i], i, values)) != null && value >= value) {
        min = value;
        while (++i < n) {
          // Compare the remaining values.
          if ((value = valueof(values[i], i, values)) != null && min > value) {
            min = value;
          }
        }
      }
    }
  }

  return min;
};

var sum = function (values, valueof) {
  var n = values.length,
      i = -1,
      value,
      sum = 0;

  if (valueof == null) {
    while (++i < n) {
      if (value = +values[i]) sum += value; // Note: zero and null are equivalent.
    }
  } else {
    while (++i < n) {
      if (value = +valueof(values[i], i, values)) sum += value;
    }
  }

  return sum;
};

function length(d) {
  return d.length;
}

// Computes the decimal coefficient and exponent of the specified number x with
// significant digits p, where x is positive and p is in [1, 21] or undefined.
// For example, formatDecimal(1.23) returns ["123", 0].
var formatDecimal = function (x, p) {
  if ((i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e")) < 0) return null; // NaN, ±Infinity
  var i,
      coefficient = x.slice(0, i);

  // The string returned by toExponential either has the form \d\.\d+e[-+]\d+
  // (e.g., 1.2e+3) or the form \de[-+]\d+ (e.g., 1e+3).
  return [coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient, +x.slice(i + 1)];
};

var exponent$1 = function (x) {
  return x = formatDecimal(Math.abs(x)), x ? x[1] : NaN;
};

var formatGroup = function (grouping, thousands) {
  return function (value, width) {
    var i = value.length,
        t = [],
        j = 0,
        g = grouping[0],
        length = 0;

    while (i > 0 && g > 0) {
      if (length + g + 1 > width) g = Math.max(1, width - length);
      t.push(value.substring(i -= g, i + g));
      if ((length += g + 1) > width) break;
      g = grouping[j = (j + 1) % grouping.length];
    }

    return t.reverse().join(thousands);
  };
};

var formatNumerals = function (numerals) {
  return function (value) {
    return value.replace(/[0-9]/g, function (i) {
      return numerals[+i];
    });
  };
};

var formatDefault = function (x, p) {
  x = x.toPrecision(p);

  out: for (var n = x.length, i = 1, i0 = -1, i1; i < n; ++i) {
    switch (x[i]) {
      case ".":
        i0 = i1 = i;break;
      case "0":
        if (i0 === 0) i0 = i;i1 = i;break;
      case "e":
        break out;
      default:
        if (i0 > 0) i0 = 0;break;
    }
  }

  return i0 > 0 ? x.slice(0, i0) + x.slice(i1 + 1) : x;
};

var prefixExponent;

var formatPrefixAuto = function (x, p) {
    var d = formatDecimal(x, p);
    if (!d) return x + "";
    var coefficient = d[0],
        exponent = d[1],
        i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1,
        n = coefficient.length;
    return i === n ? coefficient : i > n ? coefficient + new Array(i - n + 1).join("0") : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i) : "0." + new Array(1 - i).join("0") + formatDecimal(x, Math.max(0, p + i - 1))[0]; // less than 1y!
};

var formatRounded = function (x, p) {
    var d = formatDecimal(x, p);
    if (!d) return x + "";
    var coefficient = d[0],
        exponent = d[1];
    return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1) : coefficient + new Array(exponent - coefficient.length + 2).join("0");
};

var formatTypes = {
  "": formatDefault,
  "%": function _(x, p) {
    return (x * 100).toFixed(p);
  },
  "b": function b(x) {
    return Math.round(x).toString(2);
  },
  "c": function c(x) {
    return x + "";
  },
  "d": function d(x) {
    return Math.round(x).toString(10);
  },
  "e": function e(x, p) {
    return x.toExponential(p);
  },
  "f": function f(x, p) {
    return x.toFixed(p);
  },
  "g": function g(x, p) {
    return x.toPrecision(p);
  },
  "o": function o(x) {
    return Math.round(x).toString(8);
  },
  "p": function p(x, _p) {
    return formatRounded(x * 100, _p);
  },
  "r": formatRounded,
  "s": formatPrefixAuto,
  "X": function X(x) {
    return Math.round(x).toString(16).toUpperCase();
  },
  "x": function x(_x) {
    return Math.round(_x).toString(16);
  }
};

// [[fill]align][sign][symbol][0][width][,][.precision][type]
var re = /^(?:(.)?([<>=^]))?([+\-\( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?([a-z%])?$/i;

function formatSpecifier(specifier) {
  return new FormatSpecifier(specifier);
}

formatSpecifier.prototype = FormatSpecifier.prototype; // instanceof

function FormatSpecifier(specifier) {
  if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);

  var match,
      fill = match[1] || " ",
      align = match[2] || ">",
      sign = match[3] || "-",
      symbol = match[4] || "",
      zero = !!match[5],
      width = match[6] && +match[6],
      comma = !!match[7],
      precision = match[8] && +match[8].slice(1),
      type = match[9] || "";

  // The "n" type is an alias for ",g".
  if (type === "n") comma = true, type = "g";

  // Map invalid types to the default format.
  else if (!formatTypes[type]) type = "";

  // If zero fill is specified, padding goes after sign and before digits.
  if (zero || fill === "0" && align === "=") zero = true, fill = "0", align = "=";

  this.fill = fill;
  this.align = align;
  this.sign = sign;
  this.symbol = symbol;
  this.zero = zero;
  this.width = width;
  this.comma = comma;
  this.precision = precision;
  this.type = type;
}

FormatSpecifier.prototype.toString = function () {
  return this.fill + this.align + this.sign + this.symbol + (this.zero ? "0" : "") + (this.width == null ? "" : Math.max(1, this.width | 0)) + (this.comma ? "," : "") + (this.precision == null ? "" : "." + Math.max(0, this.precision | 0)) + this.type;
};

var identity$3 = function (x) {
  return x;
};

var prefixes = ["y", "z", "a", "f", "p", "n", "µ", "m", "", "k", "M", "G", "T", "P", "E", "Z", "Y"];

var formatLocale = function (locale) {
  var group = locale.grouping && locale.thousands ? formatGroup(locale.grouping, locale.thousands) : identity$3,
      currency = locale.currency,
      decimal = locale.decimal,
      numerals = locale.numerals ? formatNumerals(locale.numerals) : identity$3,
      percent = locale.percent || "%";

  function newFormat(specifier) {
    specifier = formatSpecifier(specifier);

    var fill = specifier.fill,
        align = specifier.align,
        sign = specifier.sign,
        symbol = specifier.symbol,
        zero = specifier.zero,
        width = specifier.width,
        comma = specifier.comma,
        precision = specifier.precision,
        type = specifier.type;

    // Compute the prefix and suffix.
    // For SI-prefix, the suffix is lazily computed.
    var prefix = symbol === "$" ? currency[0] : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : "",
        suffix = symbol === "$" ? currency[1] : /[%p]/.test(type) ? percent : "";

    // What format function should we use?
    // Is this an integer type?
    // Can this type generate exponential notation?
    var formatType = formatTypes[type],
        maybeSuffix = !type || /[defgprs%]/.test(type);

    // Set the default precision if not specified,
    // or clamp the specified precision to the supported range.
    // For significant precision, it must be in [1, 21].
    // For fixed precision, it must be in [0, 20].
    precision = precision == null ? type ? 6 : 12 : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision)) : Math.max(0, Math.min(20, precision));

    function format(value) {
      var valuePrefix = prefix,
          valueSuffix = suffix,
          i,
          n,
          c;

      if (type === "c") {
        valueSuffix = formatType(value) + valueSuffix;
        value = "";
      } else {
        value = +value;

        // Perform the initial formatting.
        var valueNegative = value < 0;
        value = formatType(Math.abs(value), precision);

        // If a negative value rounds to zero during formatting, treat as positive.
        if (valueNegative && +value === 0) valueNegative = false;

        // Compute the prefix and suffix.
        valuePrefix = (valueNegative ? sign === "(" ? sign : "-" : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;
        valueSuffix = valueSuffix + (type === "s" ? prefixes[8 + prefixExponent / 3] : "") + (valueNegative && sign === "(" ? ")" : "");

        // Break the formatted value into the integer “value” part that can be
        // grouped, and fractional or exponential “suffix” part that is not.
        if (maybeSuffix) {
          i = -1, n = value.length;
          while (++i < n) {
            if (c = value.charCodeAt(i), 48 > c || c > 57) {
              valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
              value = value.slice(0, i);
              break;
            }
          }
        }
      }

      // If the fill character is not "0", grouping is applied before padding.
      if (comma && !zero) value = group(value, Infinity);

      // Compute the padding.
      var length = valuePrefix.length + value.length + valueSuffix.length,
          padding = length < width ? new Array(width - length + 1).join(fill) : "";

      // If the fill character is "0", grouping is applied after padding.
      if (comma && zero) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";

      // Reconstruct the final output based on the desired alignment.
      switch (align) {
        case "<":
          value = valuePrefix + value + valueSuffix + padding;break;
        case "=":
          value = valuePrefix + padding + value + valueSuffix;break;
        case "^":
          value = padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length);break;
        default:
          value = padding + valuePrefix + value + valueSuffix;break;
      }

      return numerals(value);
    }

    format.toString = function () {
      return specifier + "";
    };

    return format;
  }

  function formatPrefix(specifier, value) {
    var f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier)),
        e = Math.max(-8, Math.min(8, Math.floor(exponent$1(value) / 3))) * 3,
        k = Math.pow(10, -e),
        prefix = prefixes[8 + e / 3];
    return function (value) {
      return f(k * value) + prefix;
    };
  }

  return {
    format: newFormat,
    formatPrefix: formatPrefix
  };
};

var locale$1;
var format;
var formatPrefix;

defaultLocale({
  decimal: ".",
  thousands: ",",
  grouping: [3],
  currency: ["$", ""]
});

function defaultLocale(definition) {
  locale$1 = formatLocale(definition);
  format = locale$1.format;
  formatPrefix = locale$1.formatPrefix;
  return locale$1;
}

var precisionFixed = function (step) {
  return Math.max(0, -exponent$1(Math.abs(step)));
};

var precisionPrefix = function (step, value) {
  return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent$1(value) / 3))) * 3 - exponent$1(Math.abs(step)));
};

var precisionRound = function (step, max) {
  step = Math.abs(step), max = Math.abs(max) - step;
  return Math.max(0, exponent$1(max) - exponent$1(step)) + 1;
};

var prefix = "$";

function Map$1() {}

Map$1.prototype = map$2.prototype = {
  constructor: Map$1,
  has: function has(key) {
    return prefix + key in this;
  },
  get: function get(key) {
    return this[prefix + key];
  },
  set: function set(key, value) {
    this[prefix + key] = value;
    return this;
  },
  remove: function remove(key) {
    var property = prefix + key;
    return property in this && delete this[property];
  },
  clear: function clear() {
    for (var property in this) {
      if (property[0] === prefix) delete this[property];
    }
  },
  keys: function keys() {
    var keys = [];
    for (var property in this) {
      if (property[0] === prefix) keys.push(property.slice(1));
    }return keys;
  },
  values: function values() {
    var values = [];
    for (var property in this) {
      if (property[0] === prefix) values.push(this[property]);
    }return values;
  },
  entries: function entries() {
    var entries = [];
    for (var property in this) {
      if (property[0] === prefix) entries.push({ key: property.slice(1), value: this[property] });
    }return entries;
  },
  size: function size() {
    var size = 0;
    for (var property in this) {
      if (property[0] === prefix) ++size;
    }return size;
  },
  empty: function empty() {
    for (var property in this) {
      if (property[0] === prefix) return false;
    }return true;
  },
  each: function each(f) {
    for (var property in this) {
      if (property[0] === prefix) f(this[property], property.slice(1), this);
    }
  }
};

function map$2(object, f) {
  var map = new Map$1();

  // Copy constructor.
  if (object instanceof Map$1) object.each(function (value, key) {
    map.set(key, value);
  });

  // Index array by numeric index or specified key function.
  else if (Array.isArray(object)) {
      var i = -1,
          n = object.length,
          o;

      if (f == null) while (++i < n) {
        map.set(i, object[i]);
      } else while (++i < n) {
        map.set(f(o = object[i], i, object), o);
      }
    }

    // Convert object to map.
    else if (object) for (var key in object) {
        map.set(key, object[key]);
      }return map;
}

function Set$1() {}

var proto = map$2.prototype;

Set$1.prototype = set$3.prototype = {
  constructor: Set$1,
  has: proto.has,
  add: function add(value) {
    value += "";
    this[prefix + value] = value;
    return this;
  },
  remove: proto.remove,
  clear: proto.clear,
  values: proto.keys,
  size: proto.size,
  empty: proto.empty,
  each: proto.each
};

function set$3(object, f) {
  var set = new Set$1();

  // Copy constructor.
  if (object instanceof Set$1) object.each(function (value) {
    set.add(value);
  });

  // Otherwise, assume it’s an array.
  else if (object) {
      var i = -1,
          n = object.length;
      if (f == null) while (++i < n) {
        set.add(object[i]);
      } else while (++i < n) {
        set.add(f(object[i], i, object));
      }
    }

  return set;
}

var array$2 = Array.prototype;

var map$4 = array$2.map;
var slice$1 = array$2.slice;

var implicit = { name: "implicit" };

function ordinal(range) {
  var index = map$2(),
      domain = [],
      unknown = implicit;

  range = range == null ? [] : slice$1.call(range);

  function scale(d) {
    var key = d + "",
        i = index.get(key);
    if (!i) {
      if (unknown !== implicit) return unknown;
      index.set(key, i = domain.push(d));
    }
    return range[(i - 1) % range.length];
  }

  scale.domain = function (_) {
    if (!arguments.length) return domain.slice();
    domain = [], index = map$2();
    var i = -1,
        n = _.length,
        d,
        key;
    while (++i < n) {
      if (!index.has(key = (d = _[i]) + "")) index.set(key, domain.push(d));
    }return scale;
  };

  scale.range = function (_) {
    return arguments.length ? (range = slice$1.call(_), scale) : range.slice();
  };

  scale.unknown = function (_) {
    return arguments.length ? (unknown = _, scale) : unknown;
  };

  scale.copy = function () {
    return ordinal().domain(domain).range(range).unknown(unknown);
  };

  return scale;
}

function band() {
  var scale = ordinal().unknown(undefined),
      domain = scale.domain,
      ordinalRange = scale.range,
      range = [0, 1],
      step,
      bandwidth,
      round = false,
      paddingInner = 0,
      paddingOuter = 0,
      align = 0.5;

  delete scale.unknown;

  function rescale() {
    var n = domain().length,
        reverse = range[1] < range[0],
        start = range[reverse - 0],
        stop = range[1 - reverse];
    step = (stop - start) / Math.max(1, n - paddingInner + paddingOuter * 2);
    if (round) step = Math.floor(step);
    start += (stop - start - step * (n - paddingInner)) * align;
    bandwidth = step * (1 - paddingInner);
    if (round) start = Math.round(start), bandwidth = Math.round(bandwidth);
    var values = range$1(n).map(function (i) {
      return start + step * i;
    });
    return ordinalRange(reverse ? values.reverse() : values);
  }

  scale.domain = function (_) {
    return arguments.length ? (domain(_), rescale()) : domain();
  };

  scale.range = function (_) {
    return arguments.length ? (range = [+_[0], +_[1]], rescale()) : range.slice();
  };

  scale.rangeRound = function (_) {
    return range = [+_[0], +_[1]], round = true, rescale();
  };

  scale.bandwidth = function () {
    return bandwidth;
  };

  scale.step = function () {
    return step;
  };

  scale.round = function (_) {
    return arguments.length ? (round = !!_, rescale()) : round;
  };

  scale.padding = function (_) {
    return arguments.length ? (paddingInner = paddingOuter = Math.max(0, Math.min(1, _)), rescale()) : paddingInner;
  };

  scale.paddingInner = function (_) {
    return arguments.length ? (paddingInner = Math.max(0, Math.min(1, _)), rescale()) : paddingInner;
  };

  scale.paddingOuter = function (_) {
    return arguments.length ? (paddingOuter = Math.max(0, Math.min(1, _)), rescale()) : paddingOuter;
  };

  scale.align = function (_) {
    return arguments.length ? (align = Math.max(0, Math.min(1, _)), rescale()) : align;
  };

  scale.copy = function () {
    return band().domain(domain()).range(range).round(round).paddingInner(paddingInner).paddingOuter(paddingOuter).align(align);
  };

  return rescale();
}

function pointish(scale) {
  var copy = scale.copy;

  scale.padding = scale.paddingOuter;
  delete scale.paddingInner;
  delete scale.paddingOuter;

  scale.copy = function () {
    return pointish(copy());
  };

  return scale;
}

function point$1() {
  return pointish(band().paddingInner(1));
}

var constant$4 = function (x) {
  return function () {
    return x;
  };
};

var number$1 = function (x) {
  return +x;
};

var unit = [0, 1];

function deinterpolateLinear(a, b) {
  return (b -= a = +a) ? function (x) {
    return (x - a) / b;
  } : constant$4(b);
}

function deinterpolateClamp(deinterpolate) {
  return function (a, b) {
    var d = deinterpolate(a = +a, b = +b);
    return function (x) {
      return x <= a ? 0 : x >= b ? 1 : d(x);
    };
  };
}

function reinterpolateClamp(reinterpolate$$1) {
  return function (a, b) {
    var r = reinterpolate$$1(a = +a, b = +b);
    return function (t) {
      return t <= 0 ? a : t >= 1 ? b : r(t);
    };
  };
}

function bimap(domain, range, deinterpolate, reinterpolate$$1) {
  var d0 = domain[0],
      d1 = domain[1],
      r0 = range[0],
      r1 = range[1];
  if (d1 < d0) d0 = deinterpolate(d1, d0), r0 = reinterpolate$$1(r1, r0);else d0 = deinterpolate(d0, d1), r0 = reinterpolate$$1(r0, r1);
  return function (x) {
    return r0(d0(x));
  };
}

function polymap(domain, range, deinterpolate, reinterpolate$$1) {
  var j = Math.min(domain.length, range.length) - 1,
      d = new Array(j),
      r = new Array(j),
      i = -1;

  // Reverse descending domains.
  if (domain[j] < domain[0]) {
    domain = domain.slice().reverse();
    range = range.slice().reverse();
  }

  while (++i < j) {
    d[i] = deinterpolate(domain[i], domain[i + 1]);
    r[i] = reinterpolate$$1(range[i], range[i + 1]);
  }

  return function (x) {
    var i = bisectRight(domain, x, 1, j) - 1;
    return r[i](d[i](x));
  };
}

function copy(source, target) {
  return target.domain(source.domain()).range(source.range()).interpolate(source.interpolate()).clamp(source.clamp());
}

// deinterpolate(a, b)(x) takes a domain value x in [a,b] and returns the corresponding parameter t in [0,1].
// reinterpolate(a, b)(t) takes a parameter t in [0,1] and returns the corresponding domain value x in [a,b].
function continuous(deinterpolate, reinterpolate$$1) {
  var domain = unit,
      range = unit,
      interpolate$$1 = interpolate,
      clamp = false,
      piecewise,
      output,
      input;

  function rescale() {
    piecewise = Math.min(domain.length, range.length) > 2 ? polymap : bimap;
    output = input = null;
    return scale;
  }

  function scale(x) {
    return (output || (output = piecewise(domain, range, clamp ? deinterpolateClamp(deinterpolate) : deinterpolate, interpolate$$1)))(+x);
  }

  scale.invert = function (y) {
    return (input || (input = piecewise(range, domain, deinterpolateLinear, clamp ? reinterpolateClamp(reinterpolate$$1) : reinterpolate$$1)))(+y);
  };

  scale.domain = function (_) {
    return arguments.length ? (domain = map$4.call(_, number$1), rescale()) : domain.slice();
  };

  scale.range = function (_) {
    return arguments.length ? (range = slice$1.call(_), rescale()) : range.slice();
  };

  scale.rangeRound = function (_) {
    return range = slice$1.call(_), interpolate$$1 = interpolateRound, rescale();
  };

  scale.clamp = function (_) {
    return arguments.length ? (clamp = !!_, rescale()) : clamp;
  };

  scale.interpolate = function (_) {
    return arguments.length ? (interpolate$$1 = _, rescale()) : interpolate$$1;
  };

  return rescale();
}

var tickFormat = function (domain, count, specifier) {
  var start = domain[0],
      stop = domain[domain.length - 1],
      step = tickStep(start, stop, count == null ? 10 : count),
      precision;
  specifier = formatSpecifier(specifier == null ? ",f" : specifier);
  switch (specifier.type) {
    case "s":
      {
        var value = Math.max(Math.abs(start), Math.abs(stop));
        if (specifier.precision == null && !isNaN(precision = precisionPrefix(step, value))) specifier.precision = precision;
        return formatPrefix(specifier, value);
      }
    case "":
    case "e":
    case "g":
    case "p":
    case "r":
      {
        if (specifier.precision == null && !isNaN(precision = precisionRound(step, Math.max(Math.abs(start), Math.abs(stop))))) specifier.precision = precision - (specifier.type === "e");
        break;
      }
    case "f":
    case "%":
      {
        if (specifier.precision == null && !isNaN(precision = precisionFixed(step))) specifier.precision = precision - (specifier.type === "%") * 2;
        break;
      }
  }
  return format(specifier);
};

function linearish(scale) {
  var domain = scale.domain;

  scale.ticks = function (count) {
    var d = domain();
    return ticks(d[0], d[d.length - 1], count == null ? 10 : count);
  };

  scale.tickFormat = function (count, specifier) {
    return tickFormat(domain(), count, specifier);
  };

  scale.nice = function (count) {
    if (count == null) count = 10;

    var d = domain(),
        i0 = 0,
        i1 = d.length - 1,
        start = d[i0],
        stop = d[i1],
        step;

    if (stop < start) {
      step = start, start = stop, stop = step;
      step = i0, i0 = i1, i1 = step;
    }

    step = tickIncrement(start, stop, count);

    if (step > 0) {
      start = Math.floor(start / step) * step;
      stop = Math.ceil(stop / step) * step;
      step = tickIncrement(start, stop, count);
    } else if (step < 0) {
      start = Math.ceil(start * step) / step;
      stop = Math.floor(stop * step) / step;
      step = tickIncrement(start, stop, count);
    }

    if (step > 0) {
      d[i0] = Math.floor(start / step) * step;
      d[i1] = Math.ceil(stop / step) * step;
      domain(d);
    } else if (step < 0) {
      d[i0] = Math.ceil(start * step) / step;
      d[i1] = Math.floor(stop * step) / step;
      domain(d);
    }

    return scale;
  };

  return scale;
}

function linear$2() {
  var scale = continuous(deinterpolateLinear, reinterpolate);

  scale.copy = function () {
    return copy(scale, linear$2());
  };

  return linearish(scale);
}

var nice = function (domain, interval) {
  domain = domain.slice();

  var i0 = 0,
      i1 = domain.length - 1,
      x0 = domain[i0],
      x1 = domain[i1],
      t;

  if (x1 < x0) {
    t = i0, i0 = i1, i1 = t;
    t = x0, x0 = x1, x1 = t;
  }

  domain[i0] = interval.floor(x0);
  domain[i1] = interval.ceil(x1);
  return domain;
};

function deinterpolate(a, b) {
  return (b = Math.log(b / a)) ? function (x) {
    return Math.log(x / a) / b;
  } : constant$4(b);
}

function reinterpolate$1(a, b) {
  return a < 0 ? function (t) {
    return -Math.pow(-b, t) * Math.pow(-a, 1 - t);
  } : function (t) {
    return Math.pow(b, t) * Math.pow(a, 1 - t);
  };
}

function pow10(x) {
  return isFinite(x) ? +("1e" + x) : x < 0 ? 0 : x;
}

function powp(base) {
  return base === 10 ? pow10 : base === Math.E ? Math.exp : function (x) {
    return Math.pow(base, x);
  };
}

function logp(base) {
  return base === Math.E ? Math.log : base === 10 && Math.log10 || base === 2 && Math.log2 || (base = Math.log(base), function (x) {
    return Math.log(x) / base;
  });
}

function quantile() {
  var domain = [],
      range = [],
      thresholds = [];

  function rescale() {
    var i = 0,
        n = Math.max(1, range.length);
    thresholds = new Array(n - 1);
    while (++i < n) {
      thresholds[i - 1] = threshold(domain, i / n);
    }return scale;
  }

  function scale(x) {
    if (!isNaN(x = +x)) return range[bisectRight(thresholds, x)];
  }

  scale.invertExtent = function (y) {
    var i = range.indexOf(y);
    return i < 0 ? [NaN, NaN] : [i > 0 ? thresholds[i - 1] : domain[0], i < thresholds.length ? thresholds[i] : domain[domain.length - 1]];
  };

  scale.domain = function (_) {
    if (!arguments.length) return domain.slice();
    domain = [];
    for (var i = 0, n = _.length, d; i < n; ++i) {
      if (d = _[i], d != null && !isNaN(d = +d)) domain.push(d);
    }domain.sort(ascending$1);
    return rescale();
  };

  scale.range = function (_) {
    return arguments.length ? (range = slice$1.call(_), rescale()) : range.slice();
  };

  scale.quantiles = function () {
    return thresholds.slice();
  };

  scale.copy = function () {
    return quantile().domain(domain).range(range);
  };

  return scale;
}

var t0$1 = new Date();
var t1$1 = new Date();

function newInterval(floori, offseti, count, field) {

  function interval(date) {
    return floori(date = new Date(+date)), date;
  }

  interval.floor = interval;

  interval.ceil = function (date) {
    return floori(date = new Date(date - 1)), offseti(date, 1), floori(date), date;
  };

  interval.round = function (date) {
    var d0 = interval(date),
        d1 = interval.ceil(date);
    return date - d0 < d1 - date ? d0 : d1;
  };

  interval.offset = function (date, step) {
    return offseti(date = new Date(+date), step == null ? 1 : Math.floor(step)), date;
  };

  interval.range = function (start, stop, step) {
    var range = [];
    start = interval.ceil(start);
    step = step == null ? 1 : Math.floor(step);
    if (!(start < stop) || !(step > 0)) return range; // also handles Invalid Date
    do {
      range.push(new Date(+start));
    } while ((offseti(start, step), floori(start), start < stop));
    return range;
  };

  interval.filter = function (test) {
    return newInterval(function (date) {
      if (date >= date) while (floori(date), !test(date)) {
        date.setTime(date - 1);
      }
    }, function (date, step) {
      if (date >= date) {
        if (step < 0) while (++step <= 0) {
          while (offseti(date, -1), !test(date)) {} // eslint-disable-line no-empty
        } else while (--step >= 0) {
          while (offseti(date, +1), !test(date)) {} // eslint-disable-line no-empty
        }
      }
    });
  };

  if (count) {
    interval.count = function (start, end) {
      t0$1.setTime(+start), t1$1.setTime(+end);
      floori(t0$1), floori(t1$1);
      return Math.floor(count(t0$1, t1$1));
    };

    interval.every = function (step) {
      step = Math.floor(step);
      return !isFinite(step) || !(step > 0) ? null : !(step > 1) ? interval : interval.filter(field ? function (d) {
        return field(d) % step === 0;
      } : function (d) {
        return interval.count(0, d) % step === 0;
      });
    };
  }

  return interval;
}

var millisecond = newInterval(function () {
  // noop
}, function (date, step) {
  date.setTime(+date + step);
}, function (start, end) {
  return end - start;
});

// An optimized implementation for this simple case.
millisecond.every = function (k) {
  k = Math.floor(k);
  if (!isFinite(k) || !(k > 0)) return null;
  if (!(k > 1)) return millisecond;
  return newInterval(function (date) {
    date.setTime(Math.floor(date / k) * k);
  }, function (date, step) {
    date.setTime(+date + step * k);
  }, function (start, end) {
    return (end - start) / k;
  });
};

var durationSecond$1 = 1e3;
var durationMinute$1 = 6e4;
var durationHour$1 = 36e5;
var durationDay$1 = 864e5;
var durationWeek$1 = 6048e5;

var second = newInterval(function (date) {
  date.setTime(Math.floor(date / durationSecond$1) * durationSecond$1);
}, function (date, step) {
  date.setTime(+date + step * durationSecond$1);
}, function (start, end) {
  return (end - start) / durationSecond$1;
}, function (date) {
  return date.getUTCSeconds();
});

var minute = newInterval(function (date) {
  date.setTime(Math.floor(date / durationMinute$1) * durationMinute$1);
}, function (date, step) {
  date.setTime(+date + step * durationMinute$1);
}, function (start, end) {
  return (end - start) / durationMinute$1;
}, function (date) {
  return date.getMinutes();
});

var hour = newInterval(function (date) {
  var offset = date.getTimezoneOffset() * durationMinute$1 % durationHour$1;
  if (offset < 0) offset += durationHour$1;
  date.setTime(Math.floor((+date - offset) / durationHour$1) * durationHour$1 + offset);
}, function (date, step) {
  date.setTime(+date + step * durationHour$1);
}, function (start, end) {
  return (end - start) / durationHour$1;
}, function (date) {
  return date.getHours();
});

var day = newInterval(function (date) {
  date.setHours(0, 0, 0, 0);
}, function (date, step) {
  date.setDate(date.getDate() + step);
}, function (start, end) {
  return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute$1) / durationDay$1;
}, function (date) {
  return date.getDate() - 1;
});

function weekday(i) {
  return newInterval(function (date) {
    date.setDate(date.getDate() - (date.getDay() + 7 - i) % 7);
    date.setHours(0, 0, 0, 0);
  }, function (date, step) {
    date.setDate(date.getDate() + step * 7);
  }, function (start, end) {
    return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute$1) / durationWeek$1;
  });
}

var sunday = weekday(0);
var monday = weekday(1);
var tuesday = weekday(2);
var wednesday = weekday(3);
var thursday = weekday(4);
var friday = weekday(5);
var saturday = weekday(6);

var month = newInterval(function (date) {
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
}, function (date, step) {
  date.setMonth(date.getMonth() + step);
}, function (start, end) {
  return end.getMonth() - start.getMonth() + (end.getFullYear() - start.getFullYear()) * 12;
}, function (date) {
  return date.getMonth();
});

var year = newInterval(function (date) {
  date.setMonth(0, 1);
  date.setHours(0, 0, 0, 0);
}, function (date, step) {
  date.setFullYear(date.getFullYear() + step);
}, function (start, end) {
  return end.getFullYear() - start.getFullYear();
}, function (date) {
  return date.getFullYear();
});

// An optimized implementation for this simple case.
year.every = function (k) {
  return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function (date) {
    date.setFullYear(Math.floor(date.getFullYear() / k) * k);
    date.setMonth(0, 1);
    date.setHours(0, 0, 0, 0);
  }, function (date, step) {
    date.setFullYear(date.getFullYear() + step * k);
  });
};

var utcMinute = newInterval(function (date) {
  date.setUTCSeconds(0, 0);
}, function (date, step) {
  date.setTime(+date + step * durationMinute$1);
}, function (start, end) {
  return (end - start) / durationMinute$1;
}, function (date) {
  return date.getUTCMinutes();
});

var utcHour = newInterval(function (date) {
  date.setUTCMinutes(0, 0, 0);
}, function (date, step) {
  date.setTime(+date + step * durationHour$1);
}, function (start, end) {
  return (end - start) / durationHour$1;
}, function (date) {
  return date.getUTCHours();
});

var utcDay = newInterval(function (date) {
  date.setUTCHours(0, 0, 0, 0);
}, function (date, step) {
  date.setUTCDate(date.getUTCDate() + step);
}, function (start, end) {
  return (end - start) / durationDay$1;
}, function (date) {
  return date.getUTCDate() - 1;
});

function utcWeekday(i) {
  return newInterval(function (date) {
    date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 7 - i) % 7);
    date.setUTCHours(0, 0, 0, 0);
  }, function (date, step) {
    date.setUTCDate(date.getUTCDate() + step * 7);
  }, function (start, end) {
    return (end - start) / durationWeek$1;
  });
}

var utcSunday = utcWeekday(0);
var utcMonday = utcWeekday(1);
var utcTuesday = utcWeekday(2);
var utcWednesday = utcWeekday(3);
var utcThursday = utcWeekday(4);
var utcFriday = utcWeekday(5);
var utcSaturday = utcWeekday(6);

var utcMonth = newInterval(function (date) {
  date.setUTCDate(1);
  date.setUTCHours(0, 0, 0, 0);
}, function (date, step) {
  date.setUTCMonth(date.getUTCMonth() + step);
}, function (start, end) {
  return end.getUTCMonth() - start.getUTCMonth() + (end.getUTCFullYear() - start.getUTCFullYear()) * 12;
}, function (date) {
  return date.getUTCMonth();
});

var utcYear = newInterval(function (date) {
  date.setUTCMonth(0, 1);
  date.setUTCHours(0, 0, 0, 0);
}, function (date, step) {
  date.setUTCFullYear(date.getUTCFullYear() + step);
}, function (start, end) {
  return end.getUTCFullYear() - start.getUTCFullYear();
}, function (date) {
  return date.getUTCFullYear();
});

// An optimized implementation for this simple case.
utcYear.every = function (k) {
  return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function (date) {
    date.setUTCFullYear(Math.floor(date.getUTCFullYear() / k) * k);
    date.setUTCMonth(0, 1);
    date.setUTCHours(0, 0, 0, 0);
  }, function (date, step) {
    date.setUTCFullYear(date.getUTCFullYear() + step * k);
  });
};

function localDate(d) {
  if (0 <= d.y && d.y < 100) {
    var date = new Date(-1, d.m, d.d, d.H, d.M, d.S, d.L);
    date.setFullYear(d.y);
    return date;
  }
  return new Date(d.y, d.m, d.d, d.H, d.M, d.S, d.L);
}

function utcDate(d) {
  if (0 <= d.y && d.y < 100) {
    var date = new Date(Date.UTC(-1, d.m, d.d, d.H, d.M, d.S, d.L));
    date.setUTCFullYear(d.y);
    return date;
  }
  return new Date(Date.UTC(d.y, d.m, d.d, d.H, d.M, d.S, d.L));
}

function newYear(y) {
  return { y: y, m: 0, d: 1, H: 0, M: 0, S: 0, L: 0 };
}

function formatLocale$1(locale) {
  var locale_dateTime = locale.dateTime,
      locale_date = locale.date,
      locale_time = locale.time,
      locale_periods = locale.periods,
      locale_weekdays = locale.days,
      locale_shortWeekdays = locale.shortDays,
      locale_months = locale.months,
      locale_shortMonths = locale.shortMonths;

  var periodRe = formatRe(locale_periods),
      periodLookup = formatLookup(locale_periods),
      weekdayRe = formatRe(locale_weekdays),
      weekdayLookup = formatLookup(locale_weekdays),
      shortWeekdayRe = formatRe(locale_shortWeekdays),
      shortWeekdayLookup = formatLookup(locale_shortWeekdays),
      monthRe = formatRe(locale_months),
      monthLookup = formatLookup(locale_months),
      shortMonthRe = formatRe(locale_shortMonths),
      shortMonthLookup = formatLookup(locale_shortMonths);

  var formats = {
    "a": formatShortWeekday,
    "A": formatWeekday,
    "b": formatShortMonth,
    "B": formatMonth,
    "c": null,
    "d": formatDayOfMonth,
    "e": formatDayOfMonth,
    "H": formatHour24,
    "I": formatHour12,
    "j": formatDayOfYear,
    "L": formatMilliseconds,
    "m": formatMonthNumber,
    "M": formatMinutes,
    "p": formatPeriod,
    "S": formatSeconds,
    "U": formatWeekNumberSunday,
    "w": formatWeekdayNumber,
    "W": formatWeekNumberMonday,
    "x": null,
    "X": null,
    "y": formatYear,
    "Y": formatFullYear,
    "Z": formatZone,
    "%": formatLiteralPercent
  };

  var utcFormats = {
    "a": formatUTCShortWeekday,
    "A": formatUTCWeekday,
    "b": formatUTCShortMonth,
    "B": formatUTCMonth,
    "c": null,
    "d": formatUTCDayOfMonth,
    "e": formatUTCDayOfMonth,
    "H": formatUTCHour24,
    "I": formatUTCHour12,
    "j": formatUTCDayOfYear,
    "L": formatUTCMilliseconds,
    "m": formatUTCMonthNumber,
    "M": formatUTCMinutes,
    "p": formatUTCPeriod,
    "S": formatUTCSeconds,
    "U": formatUTCWeekNumberSunday,
    "w": formatUTCWeekdayNumber,
    "W": formatUTCWeekNumberMonday,
    "x": null,
    "X": null,
    "y": formatUTCYear,
    "Y": formatUTCFullYear,
    "Z": formatUTCZone,
    "%": formatLiteralPercent
  };

  var parses = {
    "a": parseShortWeekday,
    "A": parseWeekday,
    "b": parseShortMonth,
    "B": parseMonth,
    "c": parseLocaleDateTime,
    "d": parseDayOfMonth,
    "e": parseDayOfMonth,
    "H": parseHour24,
    "I": parseHour24,
    "j": parseDayOfYear,
    "L": parseMilliseconds,
    "m": parseMonthNumber,
    "M": parseMinutes,
    "p": parsePeriod,
    "S": parseSeconds,
    "U": parseWeekNumberSunday,
    "w": parseWeekdayNumber,
    "W": parseWeekNumberMonday,
    "x": parseLocaleDate,
    "X": parseLocaleTime,
    "y": parseYear,
    "Y": parseFullYear,
    "Z": parseZone,
    "%": parseLiteralPercent
  };

  // These recursive directive definitions must be deferred.
  formats.x = newFormat(locale_date, formats);
  formats.X = newFormat(locale_time, formats);
  formats.c = newFormat(locale_dateTime, formats);
  utcFormats.x = newFormat(locale_date, utcFormats);
  utcFormats.X = newFormat(locale_time, utcFormats);
  utcFormats.c = newFormat(locale_dateTime, utcFormats);

  function newFormat(specifier, formats) {
    return function (date) {
      var string = [],
          i = -1,
          j = 0,
          n = specifier.length,
          c,
          pad,
          format;

      if (!(date instanceof Date)) date = new Date(+date);

      while (++i < n) {
        if (specifier.charCodeAt(i) === 37) {
          string.push(specifier.slice(j, i));
          if ((pad = pads[c = specifier.charAt(++i)]) != null) c = specifier.charAt(++i);else pad = c === "e" ? " " : "0";
          if (format = formats[c]) c = format(date, pad);
          string.push(c);
          j = i + 1;
        }
      }

      string.push(specifier.slice(j, i));
      return string.join("");
    };
  }

  function newParse(specifier, newDate) {
    return function (string) {
      var d = newYear(1900),
          i = parseSpecifier(d, specifier, string += "", 0);
      if (i != string.length) return null;

      // The am-pm flag is 0 for AM, and 1 for PM.
      if ("p" in d) d.H = d.H % 12 + d.p * 12;

      // Convert day-of-week and week-of-year to day-of-year.
      if ("W" in d || "U" in d) {
        if (!("w" in d)) d.w = "W" in d ? 1 : 0;
        var day$$1 = "Z" in d ? utcDate(newYear(d.y)).getUTCDay() : newDate(newYear(d.y)).getDay();
        d.m = 0;
        d.d = "W" in d ? (d.w + 6) % 7 + d.W * 7 - (day$$1 + 5) % 7 : d.w + d.U * 7 - (day$$1 + 6) % 7;
      }

      // If a time zone is specified, all fields are interpreted as UTC and then
      // offset according to the specified time zone.
      if ("Z" in d) {
        d.H += d.Z / 100 | 0;
        d.M += d.Z % 100;
        return utcDate(d);
      }

      // Otherwise, all fields are in local time.
      return newDate(d);
    };
  }

  function parseSpecifier(d, specifier, string, j) {
    var i = 0,
        n = specifier.length,
        m = string.length,
        c,
        parse;

    while (i < n) {
      if (j >= m) return -1;
      c = specifier.charCodeAt(i++);
      if (c === 37) {
        c = specifier.charAt(i++);
        parse = parses[c in pads ? specifier.charAt(i++) : c];
        if (!parse || (j = parse(d, string, j)) < 0) return -1;
      } else if (c != string.charCodeAt(j++)) {
        return -1;
      }
    }

    return j;
  }

  function parsePeriod(d, string, i) {
    var n = periodRe.exec(string.slice(i));
    return n ? (d.p = periodLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseShortWeekday(d, string, i) {
    var n = shortWeekdayRe.exec(string.slice(i));
    return n ? (d.w = shortWeekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseWeekday(d, string, i) {
    var n = weekdayRe.exec(string.slice(i));
    return n ? (d.w = weekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseShortMonth(d, string, i) {
    var n = shortMonthRe.exec(string.slice(i));
    return n ? (d.m = shortMonthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseMonth(d, string, i) {
    var n = monthRe.exec(string.slice(i));
    return n ? (d.m = monthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseLocaleDateTime(d, string, i) {
    return parseSpecifier(d, locale_dateTime, string, i);
  }

  function parseLocaleDate(d, string, i) {
    return parseSpecifier(d, locale_date, string, i);
  }

  function parseLocaleTime(d, string, i) {
    return parseSpecifier(d, locale_time, string, i);
  }

  function formatShortWeekday(d) {
    return locale_shortWeekdays[d.getDay()];
  }

  function formatWeekday(d) {
    return locale_weekdays[d.getDay()];
  }

  function formatShortMonth(d) {
    return locale_shortMonths[d.getMonth()];
  }

  function formatMonth(d) {
    return locale_months[d.getMonth()];
  }

  function formatPeriod(d) {
    return locale_periods[+(d.getHours() >= 12)];
  }

  function formatUTCShortWeekday(d) {
    return locale_shortWeekdays[d.getUTCDay()];
  }

  function formatUTCWeekday(d) {
    return locale_weekdays[d.getUTCDay()];
  }

  function formatUTCShortMonth(d) {
    return locale_shortMonths[d.getUTCMonth()];
  }

  function formatUTCMonth(d) {
    return locale_months[d.getUTCMonth()];
  }

  function formatUTCPeriod(d) {
    return locale_periods[+(d.getUTCHours() >= 12)];
  }

  return {
    format: function format(specifier) {
      var f = newFormat(specifier += "", formats);
      f.toString = function () {
        return specifier;
      };
      return f;
    },
    parse: function parse(specifier) {
      var p = newParse(specifier += "", localDate);
      p.toString = function () {
        return specifier;
      };
      return p;
    },
    utcFormat: function utcFormat(specifier) {
      var f = newFormat(specifier += "", utcFormats);
      f.toString = function () {
        return specifier;
      };
      return f;
    },
    utcParse: function utcParse(specifier) {
      var p = newParse(specifier, utcDate);
      p.toString = function () {
        return specifier;
      };
      return p;
    }
  };
}

var pads = { "-": "", "_": " ", "0": "0" };
var numberRe = /^\s*\d+/;
var percentRe = /^%/;
var requoteRe = /[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g;

function pad(value, fill, width) {
  var sign = value < 0 ? "-" : "",
      string = (sign ? -value : value) + "",
      length = string.length;
  return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string);
}

function requote(s) {
  return s.replace(requoteRe, "\\$&");
}

function formatRe(names) {
  return new RegExp("^(?:" + names.map(requote).join("|") + ")", "i");
}

function formatLookup(names) {
  var map = {},
      i = -1,
      n = names.length;
  while (++i < n) {
    map[names[i].toLowerCase()] = i;
  }return map;
}

function parseWeekdayNumber(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 1));
  return n ? (d.w = +n[0], i + n[0].length) : -1;
}

function parseWeekNumberSunday(d, string, i) {
  var n = numberRe.exec(string.slice(i));
  return n ? (d.U = +n[0], i + n[0].length) : -1;
}

function parseWeekNumberMonday(d, string, i) {
  var n = numberRe.exec(string.slice(i));
  return n ? (d.W = +n[0], i + n[0].length) : -1;
}

function parseFullYear(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 4));
  return n ? (d.y = +n[0], i + n[0].length) : -1;
}

function parseYear(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.y = +n[0] + (+n[0] > 68 ? 1900 : 2000), i + n[0].length) : -1;
}

function parseZone(d, string, i) {
  var n = /^(Z)|([+-]\d\d)(?:\:?(\d\d))?/.exec(string.slice(i, i + 6));
  return n ? (d.Z = n[1] ? 0 : -(n[2] + (n[3] || "00")), i + n[0].length) : -1;
}

function parseMonthNumber(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.m = n[0] - 1, i + n[0].length) : -1;
}

function parseDayOfMonth(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.d = +n[0], i + n[0].length) : -1;
}

function parseDayOfYear(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 3));
  return n ? (d.m = 0, d.d = +n[0], i + n[0].length) : -1;
}

function parseHour24(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.H = +n[0], i + n[0].length) : -1;
}

function parseMinutes(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.M = +n[0], i + n[0].length) : -1;
}

function parseSeconds(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.S = +n[0], i + n[0].length) : -1;
}

function parseMilliseconds(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 3));
  return n ? (d.L = +n[0], i + n[0].length) : -1;
}

function parseLiteralPercent(d, string, i) {
  var n = percentRe.exec(string.slice(i, i + 1));
  return n ? i + n[0].length : -1;
}

function formatDayOfMonth(d, p) {
  return pad(d.getDate(), p, 2);
}

function formatHour24(d, p) {
  return pad(d.getHours(), p, 2);
}

function formatHour12(d, p) {
  return pad(d.getHours() % 12 || 12, p, 2);
}

function formatDayOfYear(d, p) {
  return pad(1 + day.count(year(d), d), p, 3);
}

function formatMilliseconds(d, p) {
  return pad(d.getMilliseconds(), p, 3);
}

function formatMonthNumber(d, p) {
  return pad(d.getMonth() + 1, p, 2);
}

function formatMinutes(d, p) {
  return pad(d.getMinutes(), p, 2);
}

function formatSeconds(d, p) {
  return pad(d.getSeconds(), p, 2);
}

function formatWeekNumberSunday(d, p) {
  return pad(sunday.count(year(d), d), p, 2);
}

function formatWeekdayNumber(d) {
  return d.getDay();
}

function formatWeekNumberMonday(d, p) {
  return pad(monday.count(year(d), d), p, 2);
}

function formatYear(d, p) {
  return pad(d.getFullYear() % 100, p, 2);
}

function formatFullYear(d, p) {
  return pad(d.getFullYear() % 10000, p, 4);
}

function formatZone(d) {
  var z = d.getTimezoneOffset();
  return (z > 0 ? "-" : (z *= -1, "+")) + pad(z / 60 | 0, "0", 2) + pad(z % 60, "0", 2);
}

function formatUTCDayOfMonth(d, p) {
  return pad(d.getUTCDate(), p, 2);
}

function formatUTCHour24(d, p) {
  return pad(d.getUTCHours(), p, 2);
}

function formatUTCHour12(d, p) {
  return pad(d.getUTCHours() % 12 || 12, p, 2);
}

function formatUTCDayOfYear(d, p) {
  return pad(1 + utcDay.count(utcYear(d), d), p, 3);
}

function formatUTCMilliseconds(d, p) {
  return pad(d.getUTCMilliseconds(), p, 3);
}

function formatUTCMonthNumber(d, p) {
  return pad(d.getUTCMonth() + 1, p, 2);
}

function formatUTCMinutes(d, p) {
  return pad(d.getUTCMinutes(), p, 2);
}

function formatUTCSeconds(d, p) {
  return pad(d.getUTCSeconds(), p, 2);
}

function formatUTCWeekNumberSunday(d, p) {
  return pad(utcSunday.count(utcYear(d), d), p, 2);
}

function formatUTCWeekdayNumber(d) {
  return d.getUTCDay();
}

function formatUTCWeekNumberMonday(d, p) {
  return pad(utcMonday.count(utcYear(d), d), p, 2);
}

function formatUTCYear(d, p) {
  return pad(d.getUTCFullYear() % 100, p, 2);
}

function formatUTCFullYear(d, p) {
  return pad(d.getUTCFullYear() % 10000, p, 4);
}

function formatUTCZone() {
  return "+0000";
}

function formatLiteralPercent() {
  return "%";
}

var locale$2;
var timeFormat;
var timeParse;
var utcFormat;
var utcParse;

defaultLocale$1({
  dateTime: "%x, %X",
  date: "%-m/%-d/%Y",
  time: "%-I:%M:%S %p",
  periods: ["AM", "PM"],
  days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
});

function defaultLocale$1(definition) {
  locale$2 = formatLocale$1(definition);
  timeFormat = locale$2.format;
  timeParse = locale$2.parse;
  utcFormat = locale$2.utcFormat;
  utcParse = locale$2.utcParse;
  return locale$2;
}

var isoSpecifier = "%Y-%m-%dT%H:%M:%S.%LZ";

function formatIsoNative(date) {
    return date.toISOString();
}

var formatIso = Date.prototype.toISOString ? formatIsoNative : utcFormat(isoSpecifier);

function parseIsoNative(string) {
  var date = new Date(string);
  return isNaN(date) ? null : date;
}

var parseIso = +new Date("2000-01-01T00:00:00.000Z") ? parseIsoNative : utcParse(isoSpecifier);

var durationSecond = 1000;
var durationMinute = durationSecond * 60;
var durationHour = durationMinute * 60;
var durationDay = durationHour * 24;
var durationWeek = durationDay * 7;
var durationMonth = durationDay * 30;
var durationYear = durationDay * 365;

function date$1(t) {
  return new Date(t);
}

function number$2(t) {
  return t instanceof Date ? +t : +new Date(+t);
}

function calendar(year$$1, month$$1, week, day$$1, hour$$1, minute$$1, second$$1, millisecond$$1, format) {
  var scale = continuous(deinterpolateLinear, reinterpolate),
      invert = scale.invert,
      domain = scale.domain;

  var formatMillisecond = format(".%L"),
      formatSecond = format(":%S"),
      formatMinute = format("%I:%M"),
      formatHour = format("%I %p"),
      formatDay = format("%a %d"),
      formatWeek = format("%b %d"),
      formatMonth = format("%B"),
      formatYear = format("%Y");

  var tickIntervals = [[second$$1, 1, durationSecond], [second$$1, 5, 5 * durationSecond], [second$$1, 15, 15 * durationSecond], [second$$1, 30, 30 * durationSecond], [minute$$1, 1, durationMinute], [minute$$1, 5, 5 * durationMinute], [minute$$1, 15, 15 * durationMinute], [minute$$1, 30, 30 * durationMinute], [hour$$1, 1, durationHour], [hour$$1, 3, 3 * durationHour], [hour$$1, 6, 6 * durationHour], [hour$$1, 12, 12 * durationHour], [day$$1, 1, durationDay], [day$$1, 2, 2 * durationDay], [week, 1, durationWeek], [month$$1, 1, durationMonth], [month$$1, 3, 3 * durationMonth], [year$$1, 1, durationYear]];

  function tickFormat(date$$1) {
    return (second$$1(date$$1) < date$$1 ? formatMillisecond : minute$$1(date$$1) < date$$1 ? formatSecond : hour$$1(date$$1) < date$$1 ? formatMinute : day$$1(date$$1) < date$$1 ? formatHour : month$$1(date$$1) < date$$1 ? week(date$$1) < date$$1 ? formatDay : formatWeek : year$$1(date$$1) < date$$1 ? formatMonth : formatYear)(date$$1);
  }

  function tickInterval(interval$$1, start, stop, step) {
    if (interval$$1 == null) interval$$1 = 10;

    // If a desired tick count is specified, pick a reasonable tick interval
    // based on the extent of the domain and a rough estimate of tick size.
    // Otherwise, assume interval is already a time interval and use it.
    if (typeof interval$$1 === "number") {
      var target = Math.abs(stop - start) / interval$$1,
          i = bisector(function (i) {
        return i[2];
      }).right(tickIntervals, target);
      if (i === tickIntervals.length) {
        step = tickStep(start / durationYear, stop / durationYear, interval$$1);
        interval$$1 = year$$1;
      } else if (i) {
        i = tickIntervals[target / tickIntervals[i - 1][2] < tickIntervals[i][2] / target ? i - 1 : i];
        step = i[1];
        interval$$1 = i[0];
      } else {
        step = tickStep(start, stop, interval$$1);
        interval$$1 = millisecond$$1;
      }
    }

    return step == null ? interval$$1 : interval$$1.every(step);
  }

  scale.invert = function (y) {
    return new Date(invert(y));
  };

  scale.domain = function (_) {
    return arguments.length ? domain(map$4.call(_, number$2)) : domain().map(date$1);
  };

  scale.ticks = function (interval$$1, step) {
    var d = domain(),
        t0 = d[0],
        t1 = d[d.length - 1],
        r = t1 < t0,
        t;
    if (r) t = t0, t0 = t1, t1 = t;
    t = tickInterval(interval$$1, t0, t1, step);
    t = t ? t.range(t0, t1 + 1) : []; // inclusive stop
    return r ? t.reverse() : t;
  };

  scale.tickFormat = function (count, specifier) {
    return specifier == null ? tickFormat : format(specifier);
  };

  scale.nice = function (interval$$1, step) {
    var d = domain();
    return (interval$$1 = tickInterval(interval$$1, d[0], d[d.length - 1], step)) ? domain(nice(d, interval$$1)) : scale;
  };

  scale.copy = function () {
    return copy(scale, calendar(year$$1, month$$1, week, day$$1, hour$$1, minute$$1, second$$1, millisecond$$1, format));
  };

  return scale;
}

var scaleTime = function () {
  return calendar(year, month, sunday, day, hour, minute, second, millisecond, timeFormat).domain([new Date(2000, 0, 1), new Date(2000, 0, 2)]);
};

var colors = function (s) {
  return s.match(/.{6}/g).map(function (x) {
    return "#" + x;
  });
};

var schemeCategory10 = colors("1f77b4ff7f0e2ca02cd627289467bd8c564be377c27f7f7fbcbd2217becf");

var schemeCategory20b = colors("393b795254a36b6ecf9c9ede6379398ca252b5cf6bcedb9c8c6d31bd9e39e7ba52e7cb94843c39ad494ad6616be7969c7b4173a55194ce6dbdde9ed6");

var schemeCategory20c = colors("3182bd6baed69ecae1c6dbefe6550dfd8d3cfdae6bfdd0a231a35474c476a1d99bc7e9c0756bb19e9ac8bcbddcdadaeb636363969696bdbdbdd9d9d9");

var schemeCategory20 = colors("1f77b4aec7e8ff7f0effbb782ca02c98df8ad62728ff98969467bdc5b0d58c564bc49c94e377c2f7b6d27f7f7fc7c7c7bcbd22dbdb8d17becf9edae5");

var interpolateCubehelixDefault = cubehelixLong(cubehelix(300, 0.5, 0.0), cubehelix(-240, 0.5, 1.0));

var warm = cubehelixLong(cubehelix(-100, 0.75, 0.35), cubehelix(80, 1.50, 0.8));

var cool = cubehelixLong(cubehelix(260, 0.75, 0.35), cubehelix(80, 1.50, 0.8));

var rainbow = cubehelix();

var interpolateRainbow = function (t) {
  if (t < 0 || t > 1) t -= Math.floor(t);
  var ts = Math.abs(t - 0.5);
  rainbow.h = 360 * t - 100;
  rainbow.s = 1.5 - 1.5 * ts;
  rainbow.l = 0.8 - 0.9 * ts;
  return rainbow + "";
};

function ramp(range) {
  var n = range.length;
  return function (t) {
    return range[Math.max(0, Math.min(n - 1, Math.floor(t * n)))];
  };
}

var interpolateViridis = ramp(colors("44015444025645045745055946075a46085c460a5d460b5e470d60470e6147106347116447136548146748166848176948186a481a6c481b6d481c6e481d6f481f70482071482173482374482475482576482677482878482979472a7a472c7a472d7b472e7c472f7d46307e46327e46337f463480453581453781453882443983443a83443b84433d84433e85423f854240864241864142874144874045884046883f47883f48893e49893e4a893e4c8a3d4d8a3d4e8a3c4f8a3c508b3b518b3b528b3a538b3a548c39558c39568c38588c38598c375a8c375b8d365c8d365d8d355e8d355f8d34608d34618d33628d33638d32648e32658e31668e31678e31688e30698e306a8e2f6b8e2f6c8e2e6d8e2e6e8e2e6f8e2d708e2d718e2c718e2c728e2c738e2b748e2b758e2a768e2a778e2a788e29798e297a8e297b8e287c8e287d8e277e8e277f8e27808e26818e26828e26828e25838e25848e25858e24868e24878e23888e23898e238a8d228b8d228c8d228d8d218e8d218f8d21908d21918c20928c20928c20938c1f948c1f958b1f968b1f978b1f988b1f998a1f9a8a1e9b8a1e9c891e9d891f9e891f9f881fa0881fa1881fa1871fa28720a38620a48621a58521a68522a78522a88423a98324aa8325ab8225ac8226ad8127ad8128ae8029af7f2ab07f2cb17e2db27d2eb37c2fb47c31b57b32b67a34b67935b77937b87838b9773aba763bbb753dbc743fbc7340bd7242be7144bf7046c06f48c16e4ac16d4cc26c4ec36b50c46a52c56954c56856c66758c7655ac8645cc8635ec96260ca6063cb5f65cb5e67cc5c69cd5b6ccd5a6ece5870cf5773d05675d05477d1537ad1517cd2507fd34e81d34d84d44b86d54989d5488bd6468ed64590d74393d74195d84098d83e9bd93c9dd93ba0da39a2da37a5db36a8db34aadc32addc30b0dd2fb2dd2db5de2bb8de29bade28bddf26c0df25c2df23c5e021c8e020cae11fcde11dd0e11cd2e21bd5e21ad8e219dae319dde318dfe318e2e418e5e419e7e419eae51aece51befe51cf1e51df4e61ef6e620f8e621fbe723fde725"));

var magma = ramp(colors("00000401000501010601010802010902020b02020d03030f03031204041405041606051806051a07061c08071e0907200a08220b09240c09260d0a290e0b2b100b2d110c2f120d31130d34140e36150e38160f3b180f3d19103f1a10421c10441d11471e114920114b21114e22115024125325125527125829115a2a115c2c115f2d11612f116331116533106734106936106b38106c390f6e3b0f703d0f713f0f72400f74420f75440f764510774710784910784a10794c117a4e117b4f127b51127c52137c54137d56147d57157e59157e5a167e5c167f5d177f5f187f601880621980641a80651a80671b80681c816a1c816b1d816d1d816e1e81701f81721f817320817521817621817822817922827b23827c23827e24828025828125818326818426818627818827818928818b29818c29818e2a81902a81912b81932b80942c80962c80982d80992d809b2e7f9c2e7f9e2f7fa02f7fa1307ea3307ea5317ea6317da8327daa337dab337cad347cae347bb0357bb2357bb3367ab5367ab73779b83779ba3878bc3978bd3977bf3a77c03a76c23b75c43c75c53c74c73d73c83e73ca3e72cc3f71cd4071cf4070d0416fd2426fd3436ed5446dd6456cd8456cd9466bdb476adc4869de4968df4a68e04c67e24d66e34e65e44f64e55064e75263e85362e95462ea5661eb5760ec5860ed5a5fee5b5eef5d5ef05f5ef1605df2625df2645cf3655cf4675cf4695cf56b5cf66c5cf66e5cf7705cf7725cf8745cf8765cf9785df9795df97b5dfa7d5efa7f5efa815ffb835ffb8560fb8761fc8961fc8a62fc8c63fc8e64fc9065fd9266fd9467fd9668fd9869fd9a6afd9b6bfe9d6cfe9f6dfea16efea36ffea571fea772fea973feaa74feac76feae77feb078feb27afeb47bfeb67cfeb77efeb97ffebb81febd82febf84fec185fec287fec488fec68afec88cfeca8dfecc8ffecd90fecf92fed194fed395fed597fed799fed89afdda9cfddc9efddea0fde0a1fde2a3fde3a5fde5a7fde7a9fde9aafdebacfcecaefceeb0fcf0b2fcf2b4fcf4b6fcf6b8fcf7b9fcf9bbfcfbbdfcfdbf"));

var inferno = ramp(colors("00000401000501010601010802010a02020c02020e03021004031204031405041706041907051b08051d09061f0a07220b07240c08260d08290e092b10092d110a30120a32140b34150b37160b39180c3c190c3e1b0c411c0c431e0c451f0c48210c4a230c4c240c4f260c51280b53290b552b0b572d0b592f0a5b310a5c320a5e340a5f3609613809623909633b09643d09653e0966400a67420a68440a68450a69470b6a490b6a4a0c6b4c0c6b4d0d6c4f0d6c510e6c520e6d540f6d550f6d57106e59106e5a116e5c126e5d126e5f136e61136e62146e64156e65156e67166e69166e6a176e6c186e6d186e6f196e71196e721a6e741a6e751b6e771c6d781c6d7a1d6d7c1d6d7d1e6d7f1e6c801f6c82206c84206b85216b87216b88226a8a226a8c23698d23698f24699025689225689326679526679727669827669a28659b29649d29649f2a63a02a63a22b62a32c61a52c60a62d60a82e5fa92e5eab2f5ead305dae305cb0315bb1325ab3325ab43359b63458b73557b93556ba3655bc3754bd3853bf3952c03a51c13a50c33b4fc43c4ec63d4dc73e4cc83f4bca404acb4149cc4248ce4347cf4446d04545d24644d34743d44842d54a41d74b3fd84c3ed94d3dda4e3cdb503bdd513ade5238df5337e05536e15635e25734e35933e45a31e55c30e65d2fe75e2ee8602de9612bea632aeb6429eb6628ec6726ed6925ee6a24ef6c23ef6e21f06f20f1711ff1731df2741cf3761bf37819f47918f57b17f57d15f67e14f68013f78212f78410f8850ff8870ef8890cf98b0bf98c0af98e09fa9008fa9207fa9407fb9606fb9706fb9906fb9b06fb9d07fc9f07fca108fca309fca50afca60cfca80dfcaa0ffcac11fcae12fcb014fcb216fcb418fbb61afbb81dfbba1ffbbc21fbbe23fac026fac228fac42afac62df9c72ff9c932f9cb35f8cd37f8cf3af7d13df7d340f6d543f6d746f5d949f5db4cf4dd4ff4df53f4e156f3e35af3e55df2e661f2e865f2ea69f1ec6df1ed71f1ef75f1f179f2f27df2f482f3f586f3f68af4f88ef5f992f6fa96f8fb9af9fc9dfafda1fcffa4"));

var plasma = ramp(colors("0d088710078813078916078a19068c1b068d1d068e20068f2206902406912605912805922a05932c05942e05952f059631059733059735049837049938049a3a049a3c049b3e049c3f049c41049d43039e44039e46039f48039f4903a04b03a14c02a14e02a25002a25102a35302a35502a45601a45801a45901a55b01a55c01a65e01a66001a66100a76300a76400a76600a76700a86900a86a00a86c00a86e00a86f00a87100a87201a87401a87501a87701a87801a87a02a87b02a87d03a87e03a88004a88104a78305a78405a78606a68707a68808a68a09a58b0aa58d0ba58e0ca48f0da4910ea3920fa39410a29511a19613a19814a099159f9a169f9c179e9d189d9e199da01a9ca11b9ba21d9aa31e9aa51f99a62098a72197a82296aa2395ab2494ac2694ad2793ae2892b02991b12a90b22b8fb32c8eb42e8db52f8cb6308bb7318ab83289ba3388bb3488bc3587bd3786be3885bf3984c03a83c13b82c23c81c33d80c43e7fc5407ec6417dc7427cc8437bc9447aca457acb4679cc4778cc4977cd4a76ce4b75cf4c74d04d73d14e72d24f71d35171d45270d5536fd5546ed6556dd7566cd8576bd9586ada5a6ada5b69db5c68dc5d67dd5e66de5f65de6164df6263e06363e16462e26561e26660e3685fe4695ee56a5de56b5de66c5ce76e5be76f5ae87059e97158e97257ea7457eb7556eb7655ec7754ed7953ed7a52ee7b51ef7c51ef7e50f07f4ff0804ef1814df1834cf2844bf3854bf3874af48849f48948f58b47f58c46f68d45f68f44f79044f79143f79342f89441f89540f9973ff9983ef99a3efa9b3dfa9c3cfa9e3bfb9f3afba139fba238fca338fca537fca636fca835fca934fdab33fdac33fdae32fdaf31fdb130fdb22ffdb42ffdb52efeb72dfeb82cfeba2cfebb2bfebd2afebe2afec029fdc229fdc328fdc527fdc627fdc827fdca26fdcb26fccd25fcce25fcd025fcd225fbd324fbd524fbd724fad824fada24f9dc24f9dd25f8df25f8e125f7e225f7e425f6e626f6e826f5e926f5eb27f4ed27f3ee27f3f027f2f227f1f426f1f525f0f724f0f921"));

function sequential(interpolator) {
  var x0 = 0,
      x1 = 1,
      clamp = false;

  function scale(x) {
    var t = (x - x0) / (x1 - x0);
    return interpolator(clamp ? Math.max(0, Math.min(1, t)) : t);
  }

  scale.domain = function (_) {
    return arguments.length ? (x0 = +_[0], x1 = +_[1], scale) : [x0, x1];
  };

  scale.clamp = function (_) {
    return arguments.length ? (clamp = !!_, scale) : clamp;
  };

  scale.interpolator = function (_) {
    return arguments.length ? (interpolator = _, scale) : interpolator;
  };

  scale.copy = function () {
    return sequential(interpolator).domain([x0, x1]).clamp(clamp);
  };

  return linearish(scale);
}

var colors$1 = function (specifier) {
  var n = specifier.length / 6 | 0,
      colors = new Array(n),
      i = 0;
  while (i < n) {
    colors[i] = "#" + specifier.slice(i * 6, ++i * 6);
  }return colors;
};

var schemeAccent = colors$1("7fc97fbeaed4fdc086ffff99386cb0f0027fbf5b17666666");

var schemeDark2 = colors$1("1b9e77d95f027570b3e7298a66a61ee6ab02a6761d666666");

var schemePaired = colors$1("a6cee31f78b4b2df8a33a02cfb9a99e31a1cfdbf6fff7f00cab2d66a3d9affff99b15928");

var schemePastel1 = colors$1("fbb4aeb3cde3ccebc5decbe4fed9a6ffffcce5d8bdfddaecf2f2f2");

var schemePastel2 = colors$1("b3e2cdfdcdaccbd5e8f4cae4e6f5c9fff2aef1e2cccccccc");

var schemeSet1 = colors$1("e41a1c377eb84daf4a984ea3ff7f00ffff33a65628f781bf999999");

var schemeSet2 = colors$1("66c2a5fc8d628da0cbe78ac3a6d854ffd92fe5c494b3b3b3");

var schemeSet3 = colors$1("8dd3c7ffffb3bebadafb807280b1d3fdb462b3de69fccde5d9d9d9bc80bdccebc5ffed6f");

var ramp$1 = function (scheme) {
  return rgbBasis(scheme[scheme.length - 1]);
};

var scheme = new Array(3).concat("d8b365f5f5f55ab4ac", "a6611adfc27d80cdc1018571", "a6611adfc27df5f5f580cdc1018571", "8c510ad8b365f6e8c3c7eae55ab4ac01665e", "8c510ad8b365f6e8c3f5f5f5c7eae55ab4ac01665e", "8c510abf812ddfc27df6e8c3c7eae580cdc135978f01665e", "8c510abf812ddfc27df6e8c3f5f5f5c7eae580cdc135978f01665e", "5430058c510abf812ddfc27df6e8c3c7eae580cdc135978f01665e003c30", "5430058c510abf812ddfc27df6e8c3f5f5f5c7eae580cdc135978f01665e003c30").map(colors$1);

var interpolateBrBG = ramp$1(scheme);

var scheme$1 = new Array(3).concat("af8dc3f7f7f77fbf7b", "7b3294c2a5cfa6dba0008837", "7b3294c2a5cff7f7f7a6dba0008837", "762a83af8dc3e7d4e8d9f0d37fbf7b1b7837", "762a83af8dc3e7d4e8f7f7f7d9f0d37fbf7b1b7837", "762a839970abc2a5cfe7d4e8d9f0d3a6dba05aae611b7837", "762a839970abc2a5cfe7d4e8f7f7f7d9f0d3a6dba05aae611b7837", "40004b762a839970abc2a5cfe7d4e8d9f0d3a6dba05aae611b783700441b", "40004b762a839970abc2a5cfe7d4e8f7f7f7d9f0d3a6dba05aae611b783700441b").map(colors$1);

var interpolatePRGn = ramp$1(scheme$1);

var scheme$2 = new Array(3).concat("e9a3c9f7f7f7a1d76a", "d01c8bf1b6dab8e1864dac26", "d01c8bf1b6daf7f7f7b8e1864dac26", "c51b7de9a3c9fde0efe6f5d0a1d76a4d9221", "c51b7de9a3c9fde0eff7f7f7e6f5d0a1d76a4d9221", "c51b7dde77aef1b6dafde0efe6f5d0b8e1867fbc414d9221", "c51b7dde77aef1b6dafde0eff7f7f7e6f5d0b8e1867fbc414d9221", "8e0152c51b7dde77aef1b6dafde0efe6f5d0b8e1867fbc414d9221276419", "8e0152c51b7dde77aef1b6dafde0eff7f7f7e6f5d0b8e1867fbc414d9221276419").map(colors$1);

var interpolatePiYG = ramp$1(scheme$2);

var scheme$3 = new Array(3).concat("998ec3f7f7f7f1a340", "5e3c99b2abd2fdb863e66101", "5e3c99b2abd2f7f7f7fdb863e66101", "542788998ec3d8daebfee0b6f1a340b35806", "542788998ec3d8daebf7f7f7fee0b6f1a340b35806", "5427888073acb2abd2d8daebfee0b6fdb863e08214b35806", "5427888073acb2abd2d8daebf7f7f7fee0b6fdb863e08214b35806", "2d004b5427888073acb2abd2d8daebfee0b6fdb863e08214b358067f3b08", "2d004b5427888073acb2abd2d8daebf7f7f7fee0b6fdb863e08214b358067f3b08").map(colors$1);

var interpolatePuOr = ramp$1(scheme$3);

var scheme$4 = new Array(3).concat("ef8a62f7f7f767a9cf", "ca0020f4a58292c5de0571b0", "ca0020f4a582f7f7f792c5de0571b0", "b2182bef8a62fddbc7d1e5f067a9cf2166ac", "b2182bef8a62fddbc7f7f7f7d1e5f067a9cf2166ac", "b2182bd6604df4a582fddbc7d1e5f092c5de4393c32166ac", "b2182bd6604df4a582fddbc7f7f7f7d1e5f092c5de4393c32166ac", "67001fb2182bd6604df4a582fddbc7d1e5f092c5de4393c32166ac053061", "67001fb2182bd6604df4a582fddbc7f7f7f7d1e5f092c5de4393c32166ac053061").map(colors$1);

var interpolateRdBu = ramp$1(scheme$4);

var scheme$5 = new Array(3).concat("ef8a62ffffff999999", "ca0020f4a582bababa404040", "ca0020f4a582ffffffbababa404040", "b2182bef8a62fddbc7e0e0e09999994d4d4d", "b2182bef8a62fddbc7ffffffe0e0e09999994d4d4d", "b2182bd6604df4a582fddbc7e0e0e0bababa8787874d4d4d", "b2182bd6604df4a582fddbc7ffffffe0e0e0bababa8787874d4d4d", "67001fb2182bd6604df4a582fddbc7e0e0e0bababa8787874d4d4d1a1a1a", "67001fb2182bd6604df4a582fddbc7ffffffe0e0e0bababa8787874d4d4d1a1a1a").map(colors$1);

var interpolateRdGy = ramp$1(scheme$5);

var scheme$6 = new Array(3).concat("fc8d59ffffbf91bfdb", "d7191cfdae61abd9e92c7bb6", "d7191cfdae61ffffbfabd9e92c7bb6", "d73027fc8d59fee090e0f3f891bfdb4575b4", "d73027fc8d59fee090ffffbfe0f3f891bfdb4575b4", "d73027f46d43fdae61fee090e0f3f8abd9e974add14575b4", "d73027f46d43fdae61fee090ffffbfe0f3f8abd9e974add14575b4", "a50026d73027f46d43fdae61fee090e0f3f8abd9e974add14575b4313695", "a50026d73027f46d43fdae61fee090ffffbfe0f3f8abd9e974add14575b4313695").map(colors$1);

var interpolateRdYlBu = ramp$1(scheme$6);

var scheme$7 = new Array(3).concat("fc8d59ffffbf91cf60", "d7191cfdae61a6d96a1a9641", "d7191cfdae61ffffbfa6d96a1a9641", "d73027fc8d59fee08bd9ef8b91cf601a9850", "d73027fc8d59fee08bffffbfd9ef8b91cf601a9850", "d73027f46d43fdae61fee08bd9ef8ba6d96a66bd631a9850", "d73027f46d43fdae61fee08bffffbfd9ef8ba6d96a66bd631a9850", "a50026d73027f46d43fdae61fee08bd9ef8ba6d96a66bd631a9850006837", "a50026d73027f46d43fdae61fee08bffffbfd9ef8ba6d96a66bd631a9850006837").map(colors$1);

var interpolateRdYlGn = ramp$1(scheme$7);

var scheme$8 = new Array(3).concat("fc8d59ffffbf99d594", "d7191cfdae61abdda42b83ba", "d7191cfdae61ffffbfabdda42b83ba", "d53e4ffc8d59fee08be6f59899d5943288bd", "d53e4ffc8d59fee08bffffbfe6f59899d5943288bd", "d53e4ff46d43fdae61fee08be6f598abdda466c2a53288bd", "d53e4ff46d43fdae61fee08bffffbfe6f598abdda466c2a53288bd", "9e0142d53e4ff46d43fdae61fee08be6f598abdda466c2a53288bd5e4fa2", "9e0142d53e4ff46d43fdae61fee08bffffbfe6f598abdda466c2a53288bd5e4fa2").map(colors$1);

var interpolateSpectral = ramp$1(scheme$8);

var scheme$9 = new Array(3).concat("e5f5f999d8c92ca25f", "edf8fbb2e2e266c2a4238b45", "edf8fbb2e2e266c2a42ca25f006d2c", "edf8fbccece699d8c966c2a42ca25f006d2c", "edf8fbccece699d8c966c2a441ae76238b45005824", "f7fcfde5f5f9ccece699d8c966c2a441ae76238b45005824", "f7fcfde5f5f9ccece699d8c966c2a441ae76238b45006d2c00441b").map(colors$1);

var interpolateBuGn = ramp$1(scheme$9);

var scheme$10 = new Array(3).concat("e0ecf49ebcda8856a7", "edf8fbb3cde38c96c688419d", "edf8fbb3cde38c96c68856a7810f7c", "edf8fbbfd3e69ebcda8c96c68856a7810f7c", "edf8fbbfd3e69ebcda8c96c68c6bb188419d6e016b", "f7fcfde0ecf4bfd3e69ebcda8c96c68c6bb188419d6e016b", "f7fcfde0ecf4bfd3e69ebcda8c96c68c6bb188419d810f7c4d004b").map(colors$1);

var interpolateBuPu = ramp$1(scheme$10);

var scheme$11 = new Array(3).concat("e0f3dba8ddb543a2ca", "f0f9e8bae4bc7bccc42b8cbe", "f0f9e8bae4bc7bccc443a2ca0868ac", "f0f9e8ccebc5a8ddb57bccc443a2ca0868ac", "f0f9e8ccebc5a8ddb57bccc44eb3d32b8cbe08589e", "f7fcf0e0f3dbccebc5a8ddb57bccc44eb3d32b8cbe08589e", "f7fcf0e0f3dbccebc5a8ddb57bccc44eb3d32b8cbe0868ac084081").map(colors$1);

var interpolateGnBu = ramp$1(scheme$11);

var scheme$12 = new Array(3).concat("fee8c8fdbb84e34a33", "fef0d9fdcc8afc8d59d7301f", "fef0d9fdcc8afc8d59e34a33b30000", "fef0d9fdd49efdbb84fc8d59e34a33b30000", "fef0d9fdd49efdbb84fc8d59ef6548d7301f990000", "fff7ecfee8c8fdd49efdbb84fc8d59ef6548d7301f990000", "fff7ecfee8c8fdd49efdbb84fc8d59ef6548d7301fb300007f0000").map(colors$1);

var interpolateOrRd = ramp$1(scheme$12);

var scheme$13 = new Array(3).concat("ece2f0a6bddb1c9099", "f6eff7bdc9e167a9cf02818a", "f6eff7bdc9e167a9cf1c9099016c59", "f6eff7d0d1e6a6bddb67a9cf1c9099016c59", "f6eff7d0d1e6a6bddb67a9cf3690c002818a016450", "fff7fbece2f0d0d1e6a6bddb67a9cf3690c002818a016450", "fff7fbece2f0d0d1e6a6bddb67a9cf3690c002818a016c59014636").map(colors$1);

var interpolatePuBuGn = ramp$1(scheme$13);

var scheme$14 = new Array(3).concat("ece7f2a6bddb2b8cbe", "f1eef6bdc9e174a9cf0570b0", "f1eef6bdc9e174a9cf2b8cbe045a8d", "f1eef6d0d1e6a6bddb74a9cf2b8cbe045a8d", "f1eef6d0d1e6a6bddb74a9cf3690c00570b0034e7b", "fff7fbece7f2d0d1e6a6bddb74a9cf3690c00570b0034e7b", "fff7fbece7f2d0d1e6a6bddb74a9cf3690c00570b0045a8d023858").map(colors$1);

var interpolatePuBu = ramp$1(scheme$14);

var scheme$15 = new Array(3).concat("e7e1efc994c7dd1c77", "f1eef6d7b5d8df65b0ce1256", "f1eef6d7b5d8df65b0dd1c77980043", "f1eef6d4b9dac994c7df65b0dd1c77980043", "f1eef6d4b9dac994c7df65b0e7298ace125691003f", "f7f4f9e7e1efd4b9dac994c7df65b0e7298ace125691003f", "f7f4f9e7e1efd4b9dac994c7df65b0e7298ace125698004367001f").map(colors$1);

var interpolatePuRd = ramp$1(scheme$15);

var scheme$16 = new Array(3).concat("fde0ddfa9fb5c51b8a", "feebe2fbb4b9f768a1ae017e", "feebe2fbb4b9f768a1c51b8a7a0177", "feebe2fcc5c0fa9fb5f768a1c51b8a7a0177", "feebe2fcc5c0fa9fb5f768a1dd3497ae017e7a0177", "fff7f3fde0ddfcc5c0fa9fb5f768a1dd3497ae017e7a0177", "fff7f3fde0ddfcc5c0fa9fb5f768a1dd3497ae017e7a017749006a").map(colors$1);

var interpolateRdPu = ramp$1(scheme$16);

var scheme$17 = new Array(3).concat("edf8b17fcdbb2c7fb8", "ffffcca1dab441b6c4225ea8", "ffffcca1dab441b6c42c7fb8253494", "ffffccc7e9b47fcdbb41b6c42c7fb8253494", "ffffccc7e9b47fcdbb41b6c41d91c0225ea80c2c84", "ffffd9edf8b1c7e9b47fcdbb41b6c41d91c0225ea80c2c84", "ffffd9edf8b1c7e9b47fcdbb41b6c41d91c0225ea8253494081d58").map(colors$1);

var interpolateYlGnBu = ramp$1(scheme$17);

var scheme$18 = new Array(3).concat("f7fcb9addd8e31a354", "ffffccc2e69978c679238443", "ffffccc2e69978c67931a354006837", "ffffccd9f0a3addd8e78c67931a354006837", "ffffccd9f0a3addd8e78c67941ab5d238443005a32", "ffffe5f7fcb9d9f0a3addd8e78c67941ab5d238443005a32", "ffffe5f7fcb9d9f0a3addd8e78c67941ab5d238443006837004529").map(colors$1);

var interpolateYlGn = ramp$1(scheme$18);

var scheme$19 = new Array(3).concat("fff7bcfec44fd95f0e", "ffffd4fed98efe9929cc4c02", "ffffd4fed98efe9929d95f0e993404", "ffffd4fee391fec44ffe9929d95f0e993404", "ffffd4fee391fec44ffe9929ec7014cc4c028c2d04", "ffffe5fff7bcfee391fec44ffe9929ec7014cc4c028c2d04", "ffffe5fff7bcfee391fec44ffe9929ec7014cc4c02993404662506").map(colors$1);

var interpolateYlOrBr = ramp$1(scheme$19);

var scheme$20 = new Array(3).concat("ffeda0feb24cf03b20", "ffffb2fecc5cfd8d3ce31a1c", "ffffb2fecc5cfd8d3cf03b20bd0026", "ffffb2fed976feb24cfd8d3cf03b20bd0026", "ffffb2fed976feb24cfd8d3cfc4e2ae31a1cb10026", "ffffccffeda0fed976feb24cfd8d3cfc4e2ae31a1cb10026", "ffffccffeda0fed976feb24cfd8d3cfc4e2ae31a1cbd0026800026").map(colors$1);

var interpolateYlOrRd = ramp$1(scheme$20);

var scheme$21 = new Array(3).concat("deebf79ecae13182bd", "eff3ffbdd7e76baed62171b5", "eff3ffbdd7e76baed63182bd08519c", "eff3ffc6dbef9ecae16baed63182bd08519c", "eff3ffc6dbef9ecae16baed64292c62171b5084594", "f7fbffdeebf7c6dbef9ecae16baed64292c62171b5084594", "f7fbffdeebf7c6dbef9ecae16baed64292c62171b508519c08306b").map(colors$1);

var interpolateBlues = ramp$1(scheme$21);

var scheme$22 = new Array(3).concat("e5f5e0a1d99b31a354", "edf8e9bae4b374c476238b45", "edf8e9bae4b374c47631a354006d2c", "edf8e9c7e9c0a1d99b74c47631a354006d2c", "edf8e9c7e9c0a1d99b74c47641ab5d238b45005a32", "f7fcf5e5f5e0c7e9c0a1d99b74c47641ab5d238b45005a32", "f7fcf5e5f5e0c7e9c0a1d99b74c47641ab5d238b45006d2c00441b").map(colors$1);

var interpolateGreens = ramp$1(scheme$22);

var scheme$23 = new Array(3).concat("f0f0f0bdbdbd636363", "f7f7f7cccccc969696525252", "f7f7f7cccccc969696636363252525", "f7f7f7d9d9d9bdbdbd969696636363252525", "f7f7f7d9d9d9bdbdbd969696737373525252252525", "fffffff0f0f0d9d9d9bdbdbd969696737373525252252525", "fffffff0f0f0d9d9d9bdbdbd969696737373525252252525000000").map(colors$1);

var interpolateGreys = ramp$1(scheme$23);

var scheme$24 = new Array(3).concat("efedf5bcbddc756bb1", "f2f0f7cbc9e29e9ac86a51a3", "f2f0f7cbc9e29e9ac8756bb154278f", "f2f0f7dadaebbcbddc9e9ac8756bb154278f", "f2f0f7dadaebbcbddc9e9ac8807dba6a51a34a1486", "fcfbfdefedf5dadaebbcbddc9e9ac8807dba6a51a34a1486", "fcfbfdefedf5dadaebbcbddc9e9ac8807dba6a51a354278f3f007d").map(colors$1);

var interpolatePurples = ramp$1(scheme$24);

var scheme$25 = new Array(3).concat("fee0d2fc9272de2d26", "fee5d9fcae91fb6a4acb181d", "fee5d9fcae91fb6a4ade2d26a50f15", "fee5d9fcbba1fc9272fb6a4ade2d26a50f15", "fee5d9fcbba1fc9272fb6a4aef3b2ccb181d99000d", "fff5f0fee0d2fcbba1fc9272fb6a4aef3b2ccb181d99000d", "fff5f0fee0d2fcbba1fc9272fb6a4aef3b2ccb181da50f1567000d").map(colors$1);

var interpolateReds = ramp$1(scheme$25);

var scheme$26 = new Array(3).concat("fee6cefdae6be6550d", "feeddefdbe85fd8d3cd94701", "feeddefdbe85fd8d3ce6550da63603", "feeddefdd0a2fdae6bfd8d3ce6550da63603", "feeddefdd0a2fdae6bfd8d3cf16913d948018c2d04", "fff5ebfee6cefdd0a2fdae6bfd8d3cf16913d948018c2d04", "fff5ebfee6cefdd0a2fdae6bfd8d3cf16913d94801a636037f2704").map(colors$1);

var interpolateOranges = ramp$1(scheme$26);

/**
 * Checks if `value` is `undefined`.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is `undefined`, else `false`.
 * @example
 *
 * _.isUndefined(void 0);
 * // => true
 *
 * _.isUndefined(null);
 * // => false
 */
function isUndefined(value) {
    return value === undefined;
}

/**
 * Checks if `value` is `null`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is `null`, else `false`.
 * @example
 *
 * _.isNull(null);
 * // => true
 *
 * _.isNull(void 0);
 * // => false
 */
function isNull(value) {
    return value === null;
}

var _typeof = typeof Symbol === "function" && _typeof$1(Symbol.iterator) === "symbol" ? function (obj) {
    return typeof obj === 'undefined' ? 'undefined' : _typeof$1(obj);
} : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj === 'undefined' ? 'undefined' : _typeof$1(obj);
};

var classCallCheck = function classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
};

var createClass = function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
        }
    }

    return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);
        if (staticProps) defineProperties(Constructor, staticProps);
        return Constructor;
    };
}();

/** Detect free variable `global` from Node.js. */
var freeGlobal = (typeof global === 'undefined' ? 'undefined' : _typeof(global)) == 'object' && global && global.Object === Object && global;

/** Detect free variable `self`. */
var freeSelf = (typeof self === 'undefined' ? 'undefined' : _typeof(self)) == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/** Built-in value references. */
var _Symbol = root.Symbol;

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/** Built-in value references. */
var symToStringTag$1 = _Symbol ? _Symbol.toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
    var isOwn = hasOwnProperty.call(value, symToStringTag$1),
        tag = value[symToStringTag$1];

    try {
        value[symToStringTag$1] = undefined;
        var unmasked = true;
    } catch (e) {}

    var result = nativeObjectToString.call(value);
    if (unmasked) {
        if (isOwn) {
            value[symToStringTag$1] = tag;
        } else {
            delete value[symToStringTag$1];
        }
    }
    return result;
}

/** Used for built-in method references. */
var objectProto$1 = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString$1 = objectProto$1.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
    return nativeObjectToString$1.call(value);
}

/** `Object#toString` result references. */
var nullTag = '[object Null]';
var undefinedTag = '[object Undefined]';

/** Built-in value references. */
var symToStringTag = _Symbol ? _Symbol.toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
    if (value == null) {
        return value === undefined ? undefinedTag : nullTag;
    }
    return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
    return value != null && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) == 'object';
}

/** `Object#toString` result references. */
var numberTag = '[object Number]';

/**
 * Checks if `value` is classified as a `Number` primitive or object.
 *
 * **Note:** To exclude `Infinity`, `-Infinity`, and `NaN`, which are
 * classified as numbers, use the `_.isFinite` method.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a number, else `false`.
 * @example
 *
 * _.isNumber(3);
 * // => true
 *
 * _.isNumber(Number.MIN_VALUE);
 * // => true
 *
 * _.isNumber(Infinity);
 * // => true
 *
 * _.isNumber('3');
 * // => false
 */
function isNumber(value) {
    return typeof value == 'number' || isObjectLike(value) && baseGetTag(value) == numberTag;
}

/**
 * Checks if `value` is `NaN`.
 *
 * **Note:** This method is based on
 * [`Number.isNaN`](https://mdn.io/Number/isNaN) and is not the same as
 * global [`isNaN`](https://mdn.io/isNaN) which returns `true` for
 * `undefined` and other non-number values.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
 * @example
 *
 * _.isNaN(NaN);
 * // => true
 *
 * _.isNaN(new Number(NaN));
 * // => true
 *
 * isNaN(undefined);
 * // => true
 *
 * _.isNaN(undefined);
 * // => false
 */
function isNaN$1(value) {
    // An `NaN` primitive is the only value that is not equal to itself.
    // Perform the `toStringTag` check first to avoid errors with some
    // ActiveX objects in IE.
    return isNumber(value) && value != +value;
}

var check = function check(d) {
    return isUndefined(d) || isNull(d) || isNaN$1(d) ? false : true;
};

var s4 = function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
};

var uuid = function uuid() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
};

//Trying to figure out how to detect touch devices (exept for laptops with touch screens)
//Since there's no need to have a mouseover function for touch
//There has to be a more foolproof way than this...
//var mobileSize = true;
//if (!("ontouchstart" in document.documentElement) | window.innerWidth > 900) mobileSize = false;
var mobileAndTabletCheck = function mobileAndTabletCheck() {
    var check = false;
    (function (a) {
        if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
    })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
};

var containerWidth = function containerWidth(container) {
    return parseInt(container.node().getBoundingClientRect().width, 10) || 300;
};
var containerHeight = function containerHeight(container) {
    return parseInt(container.node().getBoundingClientRect().height, 10) || 400;
};

/*
 Sanitize and provide default for the container height.
 */
var sanitizeHeight = function sanitizeHeight(height, container) {
    return container.node() === null ? 0 : height || containerHeight(container) || 300;
};

/*
 Sanitize and provide default for the container width.
 */
var sanitizeWidth = function sanitizeWidth(width, container) {
    return container.node() === null ? 0 : width || containerWidth(container) || 400;
};

/*
 Calculate the available height for a chart.
 */
var availableHeight = function availableHeight(height, container, margin) {
    return Math.max(0, sanitizeHeight(height, container) - margin.top - margin.bottom);
};

/*
 Calculate the available width for a chart.
 */
var availableWidth = function availableWidth(width, container, margin) {
    return Math.max(0, sanitizeWidth(width, container) - margin.left - margin.right);
};

var assignBound = function assignBound(containerId, _opt) {
    _opt.chart.width = sanitizeWidth(_opt.chart.width, select(containerId));
    _opt.chart.height = sanitizeHeight(_opt.chart.height, select(containerId));
    _opt.chart.innerWidth = availableWidth(_opt.chart.width, select(containerId), _opt.chart.margin);
    _opt.chart.innerHeight = availableHeight(_opt.chart.height, select(containerId), _opt.chart.margin);
};

var resizeBound = function resizeBound(containerId, _opt, _size) {
    if (!check(_size) || !check(_size.width) || !!check(_size.height)) {
        // recalculate width and height
        delete _opt.chart['width'];
        delete _opt.chart['height'];
    }

    assignBound(containerId, _opt);
};

/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
    this.__data__ = [];
    this.size = 0;
}

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
    return value === other || value !== value && other !== other;
}

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf(array, key) {
    var length = array.length;
    while (length--) {
        if (eq(array[length][0], key)) {
            return length;
        }
    }
    return -1;
}

/** Used for built-in method references. */
var arrayProto = Array.prototype;

/** Built-in value references. */
var splice = arrayProto.splice;

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete(key) {
    var data = this.__data__,
        index = assocIndexOf(data, key);

    if (index < 0) {
        return false;
    }
    var lastIndex = data.length - 1;
    if (index == lastIndex) {
        data.pop();
    } else {
        splice.call(data, index, 1);
    }
    --this.size;
    return true;
}

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet(key) {
    var data = this.__data__,
        index = assocIndexOf(data, key);

    return index < 0 ? undefined : data[index][1];
}

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas(key) {
    return assocIndexOf(this.__data__, key) > -1;
}

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet(key, value) {
    var data = this.__data__,
        index = assocIndexOf(data, key);

    if (index < 0) {
        ++this.size;
        data.push([key, value]);
    } else {
        data[index][1] = value;
    }
    return this;
}

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache(entries) {
    var index = -1,
        length = entries == null ? 0 : entries.length;

    this.clear();
    while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
    }
}

// Add methods to `ListCache`.
ListCache.prototype.clear = listCacheClear;
ListCache.prototype['delete'] = listCacheDelete;
ListCache.prototype.get = listCacheGet;
ListCache.prototype.has = listCacheHas;
ListCache.prototype.set = listCacheSet;

/**
 * Removes all key-value entries from the stack.
 *
 * @private
 * @name clear
 * @memberOf Stack
 */
function stackClear() {
    this.__data__ = new ListCache();
    this.size = 0;
}

/**
 * Removes `key` and its value from the stack.
 *
 * @private
 * @name delete
 * @memberOf Stack
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function stackDelete(key) {
    var data = this.__data__,
        result = data['delete'](key);

    this.size = data.size;
    return result;
}

/**
 * Gets the stack value for `key`.
 *
 * @private
 * @name get
 * @memberOf Stack
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function stackGet(key) {
    return this.__data__.get(key);
}

/**
 * Checks if a stack value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Stack
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function stackHas(key) {
    return this.__data__.has(key);
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
    var type = typeof value === 'undefined' ? 'undefined' : _typeof(value);
    return value != null && (type == 'object' || type == 'function');
}

/** `Object#toString` result references. */
var asyncTag = '[object AsyncFunction]';
var funcTag$1 = '[object Function]';
var genTag$1 = '[object GeneratorFunction]';
var proxyTag = '[object Proxy]';

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
    if (!isObject(value)) {
        return false;
    }
    // The use of `Object#toString` avoids issues with the `typeof` operator
    // in Safari 9 which returns 'object' for typed arrays and other constructors.
    var tag = baseGetTag(value);
    return tag == funcTag$1 || tag == genTag$1 || tag == asyncTag || tag == proxyTag;
}

/** Used to detect overreaching core-js shims. */
var coreJsData = root['__core-js_shared__'];

/** Used to detect methods masquerading as native. */
var maskSrcKey = function () {
    var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
    return uid ? 'Symbol(src)_1.' + uid : '';
}();

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
    return !!maskSrcKey && maskSrcKey in func;
}

/** Used for built-in method references. */
var funcProto$1 = Function.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString$1 = funcProto$1.toString;

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to convert.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
    if (func != null) {
        try {
            return funcToString$1.call(func);
        } catch (e) {}
        try {
            return func + '';
        } catch (e) {}
    }
    return '';
}

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used for built-in method references. */
var funcProto = Function.prototype;
var objectProto$2 = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty$1 = objectProto$2.hasOwnProperty;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' + funcToString.call(hasOwnProperty$1).replace(reRegExpChar, '\\$&').replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$');

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
    if (!isObject(value) || isMasked(value)) {
        return false;
    }
    var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
    return pattern.test(toSource(value));
}

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
    return object == null ? undefined : object[key];
}

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
    var value = getValue(object, key);
    return baseIsNative(value) ? value : undefined;
}

/* Built-in method references that are verified to be native. */
var Map = getNative(root, 'Map');

/* Built-in method references that are verified to be native. */
var nativeCreate = getNative(Object, 'create');

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear() {
    this.__data__ = nativeCreate ? nativeCreate(null) : {};
    this.size = 0;
}

/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
    var result = this.has(key) && delete this.__data__[key];
    this.size -= result ? 1 : 0;
    return result;
}

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/** Used for built-in method references. */
var objectProto$3 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$2 = objectProto$3.hasOwnProperty;

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet(key) {
    var data = this.__data__;
    if (nativeCreate) {
        var result = data[key];
        return result === HASH_UNDEFINED ? undefined : result;
    }
    return hasOwnProperty$2.call(data, key) ? data[key] : undefined;
}

/** Used for built-in method references. */
var objectProto$4 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$3 = objectProto$4.hasOwnProperty;

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas(key) {
    var data = this.__data__;
    return nativeCreate ? data[key] !== undefined : hasOwnProperty$3.call(data, key);
}

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED$1 = '__lodash_hash_undefined__';

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet(key, value) {
    var data = this.__data__;
    this.size += this.has(key) ? 0 : 1;
    data[key] = nativeCreate && value === undefined ? HASH_UNDEFINED$1 : value;
    return this;
}

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash(entries) {
    var index = -1,
        length = entries == null ? 0 : entries.length;

    this.clear();
    while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
    }
}

// Add methods to `Hash`.
Hash.prototype.clear = hashClear;
Hash.prototype['delete'] = hashDelete;
Hash.prototype.get = hashGet;
Hash.prototype.has = hashHas;
Hash.prototype.set = hashSet;

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear() {
    this.size = 0;
    this.__data__ = {
        'hash': new Hash(),
        'map': new (Map || ListCache)(),
        'string': new Hash()
    };
}

/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
    var type = typeof value === 'undefined' ? 'undefined' : _typeof(value);
    return type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean' ? value !== '__proto__' : value === null;
}

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData(map, key) {
    var data = map.__data__;
    return isKeyable(key) ? data[typeof key == 'string' ? 'string' : 'hash'] : data.map;
}

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete(key) {
    var result = getMapData(this, key)['delete'](key);
    this.size -= result ? 1 : 0;
    return result;
}

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet(key) {
    return getMapData(this, key).get(key);
}

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas(key) {
    return getMapData(this, key).has(key);
}

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet(key, value) {
    var data = getMapData(this, key),
        size = data.size;

    data.set(key, value);
    this.size += data.size == size ? 0 : 1;
    return this;
}

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache(entries) {
    var index = -1,
        length = entries == null ? 0 : entries.length;

    this.clear();
    while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
    }
}

// Add methods to `MapCache`.
MapCache.prototype.clear = mapCacheClear;
MapCache.prototype['delete'] = mapCacheDelete;
MapCache.prototype.get = mapCacheGet;
MapCache.prototype.has = mapCacheHas;
MapCache.prototype.set = mapCacheSet;

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/**
 * Sets the stack `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Stack
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the stack cache instance.
 */
function stackSet(key, value) {
    var data = this.__data__;
    if (data instanceof ListCache) {
        var pairs$$1 = data.__data__;
        if (!Map || pairs$$1.length < LARGE_ARRAY_SIZE - 1) {
            pairs$$1.push([key, value]);
            this.size = ++data.size;
            return this;
        }
        data = this.__data__ = new MapCache(pairs$$1);
    }
    data.set(key, value);
    this.size = data.size;
    return this;
}

/**
 * Creates a stack cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Stack(entries) {
    var data = this.__data__ = new ListCache(entries);
    this.size = data.size;
}

// Add methods to `Stack`.
Stack.prototype.clear = stackClear;
Stack.prototype['delete'] = stackDelete;
Stack.prototype.get = stackGet;
Stack.prototype.has = stackHas;
Stack.prototype.set = stackSet;

/**
 * A specialized version of `_.forEach` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
function arrayEach(array, iteratee) {
    var index = -1,
        length = array == null ? 0 : array.length;

    while (++index < length) {
        if (iteratee(array[index], index, array) === false) {
            break;
        }
    }
    return array;
}

var defineProperty$1 = function () {
    try {
        var func = getNative(Object, 'defineProperty');
        func({}, '', {});
        return func;
    } catch (e) {}
}();

/**
 * The base implementation of `assignValue` and `assignMergeValue` without
 * value checks.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function baseAssignValue(object, key, value) {
    if (key == '__proto__' && defineProperty$1) {
        defineProperty$1(object, key, {
            'configurable': true,
            'enumerable': true,
            'value': value,
            'writable': true
        });
    } else {
        object[key] = value;
    }
}

/** Used for built-in method references. */
var objectProto$5 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$4 = objectProto$5.hasOwnProperty;

/**
 * Assigns `value` to `key` of `object` if the existing value is not equivalent
 * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * for equality comparisons.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function assignValue(object, key, value) {
    var objValue = object[key];
    if (!(hasOwnProperty$4.call(object, key) && eq(objValue, value)) || value === undefined && !(key in object)) {
        baseAssignValue(object, key, value);
    }
}

/**
 * Copies properties of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy properties from.
 * @param {Array} props The property identifiers to copy.
 * @param {Object} [object={}] The object to copy properties to.
 * @param {Function} [customizer] The function to customize copied values.
 * @returns {Object} Returns `object`.
 */
function copyObject(source, props, object, customizer) {
    var isNew = !object;
    object || (object = {});

    var index = -1,
        length = props.length;

    while (++index < length) {
        var key = props[index];

        var newValue = customizer ? customizer(object[key], source[key], key, object, source) : undefined;

        if (newValue === undefined) {
            newValue = source[key];
        }
        if (isNew) {
            baseAssignValue(object, key, newValue);
        } else {
            assignValue(object, key, newValue);
        }
    }
    return object;
}

/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */
function baseTimes(n, iteratee) {
    var index = -1,
        result = Array(n);

    while (++index < n) {
        result[index] = iteratee(index);
    }
    return result;
}

/** `Object#toString` result references. */
var argsTag$1 = '[object Arguments]';

/**
 * The base implementation of `_.isArguments`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 */
function baseIsArguments(value) {
    return isObjectLike(value) && baseGetTag(value) == argsTag$1;
}

/** Used for built-in method references. */
var objectProto$7 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$6 = objectProto$7.hasOwnProperty;

/** Built-in value references. */
var propertyIsEnumerable = objectProto$7.propertyIsEnumerable;

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
var isArguments = baseIsArguments(function () {
    return arguments;
}()) ? baseIsArguments : function (value) {
    return isObjectLike(value) && hasOwnProperty$6.call(value, 'callee') && !propertyIsEnumerable.call(value, 'callee');
};

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

/**
 * This method returns `false`.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {boolean} Returns `false`.
 * @example
 *
 * _.times(2, _.stubFalse);
 * // => [false, false]
 */
function stubFalse() {
    return false;
}

/** Detect free variable `exports`. */
var freeExports = (typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && (typeof module === 'undefined' ? 'undefined' : _typeof(module)) == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Built-in value references. */
var Buffer = moduleExports ? root.Buffer : undefined;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined;

/**
 * Checks if `value` is a buffer.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
 * @example
 *
 * _.isBuffer(new Buffer(2));
 * // => true
 *
 * _.isBuffer(new Uint8Array(2));
 * // => false
 */
var isBuffer = nativeIsBuffer || stubFalse;

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/** Used to detect unsigned integer values. */
var reIsUint = /^(?:0|[1-9]\d*)$/;

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
    length = length == null ? MAX_SAFE_INTEGER : length;
    return !!length && (typeof value == 'number' || reIsUint.test(value)) && value > -1 && value % 1 == 0 && value < length;
}

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER$1 = 9007199254740991;

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
    return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER$1;
}

/** `Object#toString` result references. */
var argsTag$2 = '[object Arguments]';
var arrayTag$1 = '[object Array]';
var boolTag$1 = '[object Boolean]';
var dateTag$1 = '[object Date]';
var errorTag$1 = '[object Error]';
var funcTag$2 = '[object Function]';
var mapTag$1 = '[object Map]';
var numberTag$2 = '[object Number]';
var objectTag$1 = '[object Object]';
var regexpTag$1 = '[object RegExp]';
var setTag$1 = '[object Set]';
var stringTag$1 = '[object String]';
var weakMapTag$1 = '[object WeakMap]';

var arrayBufferTag$1 = '[object ArrayBuffer]';
var dataViewTag$1 = '[object DataView]';
var float32Tag$1 = '[object Float32Array]';
var float64Tag$1 = '[object Float64Array]';
var int8Tag$1 = '[object Int8Array]';
var int16Tag$1 = '[object Int16Array]';
var int32Tag$1 = '[object Int32Array]';
var uint8Tag$1 = '[object Uint8Array]';
var uint8ClampedTag$1 = '[object Uint8ClampedArray]';
var uint16Tag$1 = '[object Uint16Array]';
var uint32Tag$1 = '[object Uint32Array]';

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags = {};
typedArrayTags[float32Tag$1] = typedArrayTags[float64Tag$1] = typedArrayTags[int8Tag$1] = typedArrayTags[int16Tag$1] = typedArrayTags[int32Tag$1] = typedArrayTags[uint8Tag$1] = typedArrayTags[uint8ClampedTag$1] = typedArrayTags[uint16Tag$1] = typedArrayTags[uint32Tag$1] = true;
typedArrayTags[argsTag$2] = typedArrayTags[arrayTag$1] = typedArrayTags[arrayBufferTag$1] = typedArrayTags[boolTag$1] = typedArrayTags[dataViewTag$1] = typedArrayTags[dateTag$1] = typedArrayTags[errorTag$1] = typedArrayTags[funcTag$2] = typedArrayTags[mapTag$1] = typedArrayTags[numberTag$2] = typedArrayTags[objectTag$1] = typedArrayTags[regexpTag$1] = typedArrayTags[setTag$1] = typedArrayTags[stringTag$1] = typedArrayTags[weakMapTag$1] = false;

/**
 * The base implementation of `_.isTypedArray` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 */
function baseIsTypedArray(value) {
    return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
}

/**
 * The base implementation of `_.unary` without support for storing metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 */
function baseUnary(func) {
    return function (value) {
        return func(value);
    };
}

/** Detect free variable `exports`. */
var freeExports$1 = (typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule$1 = freeExports$1 && (typeof module === 'undefined' ? 'undefined' : _typeof(module)) == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports$1 = freeModule$1 && freeModule$1.exports === freeExports$1;

/** Detect free variable `process` from Node.js. */
var freeProcess = moduleExports$1 && freeGlobal.process;

/** Used to access faster Node.js helpers. */
var nodeUtil = function () {
    try {
        return freeProcess && freeProcess.binding && freeProcess.binding('util');
    } catch (e) {}
}();

/* Node.js helper references. */
var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;

/** Used for built-in method references. */
var objectProto$6 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$5 = objectProto$6.hasOwnProperty;

/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */
function arrayLikeKeys(value, inherited) {
    var isArr = isArray(value),
        isArg = !isArr && isArguments(value),
        isBuff = !isArr && !isArg && isBuffer(value),
        isType = !isArr && !isArg && !isBuff && isTypedArray(value),
        skipIndexes = isArr || isArg || isBuff || isType,
        result = skipIndexes ? baseTimes(value.length, String) : [],
        length = result.length;

    for (var key in value) {
        if ((inherited || hasOwnProperty$5.call(value, key)) && !(skipIndexes && (
        // Safari 9 has enumerable `arguments.length` in strict mode.
        key == 'length' ||
        // Node.js 0.10 has enumerable non-index properties on buffers.
        isBuff && (key == 'offset' || key == 'parent') ||
        // PhantomJS 2 has enumerable non-index properties on typed arrays.
        isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset') ||
        // Skip index properties.
        isIndex(key, length)))) {
            result.push(key);
        }
    }
    return result;
}

/** Used for built-in method references. */
var objectProto$9 = Object.prototype;

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
function isPrototype(value) {
    var Ctor = value && value.constructor,
        proto = typeof Ctor == 'function' && Ctor.prototype || objectProto$9;

    return value === proto;
}

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
    return function (arg) {
        return func(transform(arg));
    };
}

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeKeys = overArg(Object.keys, Object);

/** Used for built-in method references. */
var objectProto$8 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$7 = objectProto$8.hasOwnProperty;

/**
 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeys(object) {
    if (!isPrototype(object)) {
        return nativeKeys(object);
    }
    var result = [];
    for (var key in Object(object)) {
        if (hasOwnProperty$7.call(object, key) && key != 'constructor') {
            result.push(key);
        }
    }
    return result;
}

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
    return value != null && isLength(value.length) && !isFunction(value);
}

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
function keys(object) {
    return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
}

/**
 * The base implementation of `_.assign` without support for multiple sources
 * or `customizer` functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @returns {Object} Returns `object`.
 */
function baseAssign(object, source) {
    return object && copyObject(source, keys(source), object);
}

/**
 * This function is like
 * [`Object.keys`](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * except that it includes inherited enumerable properties.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function nativeKeysIn(object) {
    var result = [];
    if (object != null) {
        for (var key in Object(object)) {
            result.push(key);
        }
    }
    return result;
}

/** Used for built-in method references. */
var objectProto$10 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$8 = objectProto$10.hasOwnProperty;

/**
 * The base implementation of `_.keysIn` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeysIn(object) {
    if (!isObject(object)) {
        return nativeKeysIn(object);
    }
    var isProto = isPrototype(object),
        result = [];

    for (var key in object) {
        if (!(key == 'constructor' && (isProto || !hasOwnProperty$8.call(object, key)))) {
            result.push(key);
        }
    }
    return result;
}

/**
 * Creates an array of the own and inherited enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keysIn(new Foo);
 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
 */
function keysIn$1(object) {
    return isArrayLike(object) ? arrayLikeKeys(object, true) : baseKeysIn(object);
}

/**
 * The base implementation of `_.assignIn` without support for multiple sources
 * or `customizer` functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @returns {Object} Returns `object`.
 */
function baseAssignIn(object, source) {
    return object && copyObject(source, keysIn$1(source), object);
}

/** Detect free variable `exports`. */
var freeExports$2 = (typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule$2 = freeExports$2 && (typeof module === 'undefined' ? 'undefined' : _typeof(module)) == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports$2 = freeModule$2 && freeModule$2.exports === freeExports$2;

/** Built-in value references. */
var Buffer$1 = moduleExports$2 ? root.Buffer : undefined;
var allocUnsafe = Buffer$1 ? Buffer$1.allocUnsafe : undefined;

/**
 * Creates a clone of  `buffer`.
 *
 * @private
 * @param {Buffer} buffer The buffer to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Buffer} Returns the cloned buffer.
 */
function cloneBuffer(buffer, isDeep) {
    if (isDeep) {
        return buffer.slice();
    }
    var length = buffer.length,
        result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);

    buffer.copy(result);
    return result;
}

/**
 * Copies the values of `source` to `array`.
 *
 * @private
 * @param {Array} source The array to copy values from.
 * @param {Array} [array=[]] The array to copy values to.
 * @returns {Array} Returns `array`.
 */
function copyArray(source, array) {
    var index = -1,
        length = source.length;

    array || (array = Array(length));
    while (++index < length) {
        array[index] = source[index];
    }
    return array;
}

/**
 * A specialized version of `_.filter` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
function arrayFilter(array, predicate) {
    var index = -1,
        length = array == null ? 0 : array.length,
        resIndex = 0,
        result = [];

    while (++index < length) {
        var value = array[index];
        if (predicate(value, index, array)) {
            result[resIndex++] = value;
        }
    }
    return result;
}

/**
 * This method returns a new empty array.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {Array} Returns the new empty array.
 * @example
 *
 * var arrays = _.times(2, _.stubArray);
 *
 * console.log(arrays);
 * // => [[], []]
 *
 * console.log(arrays[0] === arrays[1]);
 * // => false
 */
function stubArray() {
    return [];
}

/** Used for built-in method references. */
var objectProto$11 = Object.prototype;

/** Built-in value references. */
var propertyIsEnumerable$1 = objectProto$11.propertyIsEnumerable;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeGetSymbols = Object.getOwnPropertySymbols;

/**
 * Creates an array of the own enumerable symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */
var getSymbols = !nativeGetSymbols ? stubArray : function (object) {
    if (object == null) {
        return [];
    }
    object = Object(object);
    return arrayFilter(nativeGetSymbols(object), function (symbol) {
        return propertyIsEnumerable$1.call(object, symbol);
    });
};

/**
 * Copies own symbols of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy symbols from.
 * @param {Object} [object={}] The object to copy symbols to.
 * @returns {Object} Returns `object`.
 */
function copySymbols(source, object) {
    return copyObject(source, getSymbols(source), object);
}

/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */
function arrayPush(array, values) {
    var index = -1,
        length = values.length,
        offset = array.length;

    while (++index < length) {
        array[offset + index] = values[index];
    }
    return array;
}

/** Built-in value references. */
var getPrototype = overArg(Object.getPrototypeOf, Object);

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeGetSymbols$1 = Object.getOwnPropertySymbols;

/**
 * Creates an array of the own and inherited enumerable symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */
var getSymbolsIn = !nativeGetSymbols$1 ? stubArray : function (object) {
    var result = [];
    while (object) {
        arrayPush(result, getSymbols(object));
        object = getPrototype(object);
    }
    return result;
};

/**
 * Copies own and inherited symbols of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy symbols from.
 * @param {Object} [object={}] The object to copy symbols to.
 * @returns {Object} Returns `object`.
 */
function copySymbolsIn(source, object) {
    return copyObject(source, getSymbolsIn(source), object);
}

/**
 * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
 * `keysFunc` and `symbolsFunc` to get the enumerable property names and
 * symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @param {Function} symbolsFunc The function to get the symbols of `object`.
 * @returns {Array} Returns the array of property names and symbols.
 */
function baseGetAllKeys(object, keysFunc, symbolsFunc) {
    var result = keysFunc(object);
    return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
}

/**
 * Creates an array of own enumerable property names and symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names and symbols.
 */
function getAllKeys(object) {
    return baseGetAllKeys(object, keys, getSymbols);
}

/**
 * Creates an array of own and inherited enumerable property names and
 * symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names and symbols.
 */
function getAllKeysIn(object) {
    return baseGetAllKeys(object, keysIn$1, getSymbolsIn);
}

/* Built-in method references that are verified to be native. */
var DataView = getNative(root, 'DataView');

/* Built-in method references that are verified to be native. */
var Promise$1 = getNative(root, 'Promise');

/* Built-in method references that are verified to be native. */
var Set = getNative(root, 'Set');

/* Built-in method references that are verified to be native. */
var WeakMap = getNative(root, 'WeakMap');

/** `Object#toString` result references. */
var mapTag$2 = '[object Map]';
var objectTag$2 = '[object Object]';
var promiseTag = '[object Promise]';
var setTag$2 = '[object Set]';
var weakMapTag$2 = '[object WeakMap]';

var dataViewTag$2 = '[object DataView]';

/** Used to detect maps, sets, and weakmaps. */
var dataViewCtorString = toSource(DataView);
var mapCtorString = toSource(Map);
var promiseCtorString = toSource(Promise$1);
var setCtorString = toSource(Set);
var weakMapCtorString = toSource(WeakMap);

/**
 * Gets the `toStringTag` of `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
var getTag = baseGetTag;

// Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
if (DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag$2 || Map && getTag(new Map()) != mapTag$2 || Promise$1 && getTag(Promise$1.resolve()) != promiseTag || Set && getTag(new Set()) != setTag$2 || WeakMap && getTag(new WeakMap()) != weakMapTag$2) {
    getTag = function getTag(value) {
        var result = baseGetTag(value),
            Ctor = result == objectTag$2 ? value.constructor : undefined,
            ctorString = Ctor ? toSource(Ctor) : '';

        if (ctorString) {
            switch (ctorString) {
                case dataViewCtorString:
                    return dataViewTag$2;
                case mapCtorString:
                    return mapTag$2;
                case promiseCtorString:
                    return promiseTag;
                case setCtorString:
                    return setTag$2;
                case weakMapCtorString:
                    return weakMapTag$2;
            }
        }
        return result;
    };
}

var getTag$1 = getTag;

/** Used for built-in method references. */
var objectProto$12 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$9 = objectProto$12.hasOwnProperty;

/**
 * Initializes an array clone.
 *
 * @private
 * @param {Array} array The array to clone.
 * @returns {Array} Returns the initialized clone.
 */
function initCloneArray(array) {
    var length = array.length,
        result = array.constructor(length);

    // Add properties assigned by `RegExp#exec`.
    if (length && typeof array[0] == 'string' && hasOwnProperty$9.call(array, 'index')) {
        result.index = array.index;
        result.input = array.input;
    }
    return result;
}

/** Built-in value references. */
var Uint8Array = root.Uint8Array;

/**
 * Creates a clone of `arrayBuffer`.
 *
 * @private
 * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
 * @returns {ArrayBuffer} Returns the cloned array buffer.
 */
function cloneArrayBuffer(arrayBuffer) {
    var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
    new Uint8Array(result).set(new Uint8Array(arrayBuffer));
    return result;
}

/**
 * Creates a clone of `dataView`.
 *
 * @private
 * @param {Object} dataView The data view to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned data view.
 */
function cloneDataView(dataView, isDeep) {
    var buffer = isDeep ? cloneArrayBuffer(dataView.buffer) : dataView.buffer;
    return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
}

/**
 * Adds the key-value `pair` to `map`.
 *
 * @private
 * @param {Object} map The map to modify.
 * @param {Array} pair The key-value pair to add.
 * @returns {Object} Returns `map`.
 */
function addMapEntry(map, pair) {
    // Don't return `map.set` because it's not chainable in IE 11.
    map.set(pair[0], pair[1]);
    return map;
}

/**
 * A specialized version of `_.reduce` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {*} [accumulator] The initial value.
 * @param {boolean} [initAccum] Specify using the first element of `array` as
 *  the initial value.
 * @returns {*} Returns the accumulated value.
 */
function arrayReduce(array, iteratee, accumulator, initAccum) {
    var index = -1,
        length = array == null ? 0 : array.length;

    if (initAccum && length) {
        accumulator = array[++index];
    }
    while (++index < length) {
        accumulator = iteratee(accumulator, array[index], index, array);
    }
    return accumulator;
}

/**
 * Converts `map` to its key-value pairs.
 *
 * @private
 * @param {Object} map The map to convert.
 * @returns {Array} Returns the key-value pairs.
 */
function mapToArray(map) {
    var index = -1,
        result = Array(map.size);

    map.forEach(function (value, key) {
        result[++index] = [key, value];
    });
    return result;
}

/** Used to compose bitmasks for cloning. */
var CLONE_DEEP_FLAG$2 = 1;

/**
 * Creates a clone of `map`.
 *
 * @private
 * @param {Object} map The map to clone.
 * @param {Function} cloneFunc The function to clone values.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned map.
 */
function cloneMap(map, isDeep, cloneFunc) {
    var array = isDeep ? cloneFunc(mapToArray(map), CLONE_DEEP_FLAG$2) : mapToArray(map);
    return arrayReduce(array, addMapEntry, new map.constructor());
}

/** Used to match `RegExp` flags from their coerced string values. */
var reFlags = /\w*$/;

/**
 * Creates a clone of `regexp`.
 *
 * @private
 * @param {Object} regexp The regexp to clone.
 * @returns {Object} Returns the cloned regexp.
 */
function cloneRegExp(regexp) {
    var result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
    result.lastIndex = regexp.lastIndex;
    return result;
}

/**
 * Adds `value` to `set`.
 *
 * @private
 * @param {Object} set The set to modify.
 * @param {*} value The value to add.
 * @returns {Object} Returns `set`.
 */
function addSetEntry(set, value) {
    // Don't return `set.add` because it's not chainable in IE 11.
    set.add(value);
    return set;
}

/**
 * Converts `set` to an array of its values.
 *
 * @private
 * @param {Object} set The set to convert.
 * @returns {Array} Returns the values.
 */
function setToArray(set) {
    var index = -1,
        result = Array(set.size);

    set.forEach(function (value) {
        result[++index] = value;
    });
    return result;
}

/** Used to compose bitmasks for cloning. */
var CLONE_DEEP_FLAG$3 = 1;

/**
 * Creates a clone of `set`.
 *
 * @private
 * @param {Object} set The set to clone.
 * @param {Function} cloneFunc The function to clone values.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned set.
 */
function cloneSet(set, isDeep, cloneFunc) {
    var array = isDeep ? cloneFunc(setToArray(set), CLONE_DEEP_FLAG$3) : setToArray(set);
    return arrayReduce(array, addSetEntry, new set.constructor());
}

/** Used to convert symbols to primitives and strings. */
var symbolProto = _Symbol ? _Symbol.prototype : undefined;
var symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

/**
 * Creates a clone of the `symbol` object.
 *
 * @private
 * @param {Object} symbol The symbol object to clone.
 * @returns {Object} Returns the cloned symbol object.
 */
function cloneSymbol(symbol) {
    return symbolValueOf ? Object(symbolValueOf.call(symbol)) : {};
}

/**
 * Creates a clone of `typedArray`.
 *
 * @private
 * @param {Object} typedArray The typed array to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned typed array.
 */
function cloneTypedArray(typedArray, isDeep) {
    var buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
    return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
}

/** `Object#toString` result references. */
var boolTag$2 = '[object Boolean]';
var dateTag$2 = '[object Date]';
var mapTag$3 = '[object Map]';
var numberTag$3 = '[object Number]';
var regexpTag$2 = '[object RegExp]';
var setTag$3 = '[object Set]';
var stringTag$2 = '[object String]';
var symbolTag$1 = '[object Symbol]';

var arrayBufferTag$2 = '[object ArrayBuffer]';
var dataViewTag$3 = '[object DataView]';
var float32Tag$2 = '[object Float32Array]';
var float64Tag$2 = '[object Float64Array]';
var int8Tag$2 = '[object Int8Array]';
var int16Tag$2 = '[object Int16Array]';
var int32Tag$2 = '[object Int32Array]';
var uint8Tag$2 = '[object Uint8Array]';
var uint8ClampedTag$2 = '[object Uint8ClampedArray]';
var uint16Tag$2 = '[object Uint16Array]';
var uint32Tag$2 = '[object Uint32Array]';

/**
 * Initializes an object clone based on its `toStringTag`.
 *
 * **Note:** This function only supports cloning values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to clone.
 * @param {string} tag The `toStringTag` of the object to clone.
 * @param {Function} cloneFunc The function to clone values.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneByTag(object, tag, cloneFunc, isDeep) {
    var Ctor = object.constructor;
    switch (tag) {
        case arrayBufferTag$2:
            return cloneArrayBuffer(object);

        case boolTag$2:
        case dateTag$2:
            return new Ctor(+object);

        case dataViewTag$3:
            return cloneDataView(object, isDeep);

        case float32Tag$2:case float64Tag$2:
        case int8Tag$2:case int16Tag$2:case int32Tag$2:
        case uint8Tag$2:case uint8ClampedTag$2:case uint16Tag$2:case uint32Tag$2:
            return cloneTypedArray(object, isDeep);

        case mapTag$3:
            return cloneMap(object, isDeep, cloneFunc);

        case numberTag$3:
        case stringTag$2:
            return new Ctor(object);

        case regexpTag$2:
            return cloneRegExp(object);

        case setTag$3:
            return cloneSet(object, isDeep, cloneFunc);

        case symbolTag$1:
            return cloneSymbol(object);
    }
}

/** Built-in value references. */
var objectCreate = Object.create;

/**
 * The base implementation of `_.create` without support for assigning
 * properties to the created object.
 *
 * @private
 * @param {Object} proto The object to inherit from.
 * @returns {Object} Returns the new object.
 */
var baseCreate = function () {
    function object() {}
    return function (proto) {
        if (!isObject(proto)) {
            return {};
        }
        if (objectCreate) {
            return objectCreate(proto);
        }
        object.prototype = proto;
        var result = new object();
        object.prototype = undefined;
        return result;
    };
}();

/**
 * Initializes an object clone.
 *
 * @private
 * @param {Object} object The object to clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneObject(object) {
    return typeof object.constructor == 'function' && !isPrototype(object) ? baseCreate(getPrototype(object)) : {};
}

/** Used to compose bitmasks for cloning. */
var CLONE_DEEP_FLAG$1 = 1;
var CLONE_FLAT_FLAG = 2;
var CLONE_SYMBOLS_FLAG$1 = 4;

/** `Object#toString` result references. */
var argsTag = '[object Arguments]';
var arrayTag = '[object Array]';
var boolTag = '[object Boolean]';
var dateTag = '[object Date]';
var errorTag = '[object Error]';
var funcTag = '[object Function]';
var genTag = '[object GeneratorFunction]';
var mapTag = '[object Map]';
var numberTag$1 = '[object Number]';
var objectTag = '[object Object]';
var regexpTag = '[object RegExp]';
var setTag = '[object Set]';
var stringTag = '[object String]';
var symbolTag = '[object Symbol]';
var weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]';
var dataViewTag = '[object DataView]';
var float32Tag = '[object Float32Array]';
var float64Tag = '[object Float64Array]';
var int8Tag = '[object Int8Array]';
var int16Tag = '[object Int16Array]';
var int32Tag = '[object Int32Array]';
var uint8Tag = '[object Uint8Array]';
var uint8ClampedTag = '[object Uint8ClampedArray]';
var uint16Tag = '[object Uint16Array]';
var uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values supported by `_.clone`. */
var cloneableTags = {};
cloneableTags[argsTag] = cloneableTags[arrayTag] = cloneableTags[arrayBufferTag] = cloneableTags[dataViewTag] = cloneableTags[boolTag] = cloneableTags[dateTag] = cloneableTags[float32Tag] = cloneableTags[float64Tag] = cloneableTags[int8Tag] = cloneableTags[int16Tag] = cloneableTags[int32Tag] = cloneableTags[mapTag] = cloneableTags[numberTag$1] = cloneableTags[objectTag] = cloneableTags[regexpTag] = cloneableTags[setTag] = cloneableTags[stringTag] = cloneableTags[symbolTag] = cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] = cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
cloneableTags[errorTag] = cloneableTags[funcTag] = cloneableTags[weakMapTag] = false;

/**
 * The base implementation of `_.clone` and `_.cloneDeep` which tracks
 * traversed objects.
 *
 * @private
 * @param {*} value The value to clone.
 * @param {boolean} bitmask The bitmask flags.
 *  1 - Deep clone
 *  2 - Flatten inherited properties
 *  4 - Clone symbols
 * @param {Function} [customizer] The function to customize cloning.
 * @param {string} [key] The key of `value`.
 * @param {Object} [object] The parent object of `value`.
 * @param {Object} [stack] Tracks traversed objects and their clone counterparts.
 * @returns {*} Returns the cloned value.
 */
function baseClone(value, bitmask, customizer, key, object, stack) {
    var result,
        isDeep = bitmask & CLONE_DEEP_FLAG$1,
        isFlat = bitmask & CLONE_FLAT_FLAG,
        isFull = bitmask & CLONE_SYMBOLS_FLAG$1;

    if (customizer) {
        result = object ? customizer(value, key, object, stack) : customizer(value);
    }
    if (result !== undefined) {
        return result;
    }
    if (!isObject(value)) {
        return value;
    }
    var isArr = isArray(value);
    if (isArr) {
        result = initCloneArray(value);
        if (!isDeep) {
            return copyArray(value, result);
        }
    } else {
        var tag = getTag$1(value),
            isFunc = tag == funcTag || tag == genTag;

        if (isBuffer(value)) {
            return cloneBuffer(value, isDeep);
        }
        if (tag == objectTag || tag == argsTag || isFunc && !object) {
            result = isFlat || isFunc ? {} : initCloneObject(value);
            if (!isDeep) {
                return isFlat ? copySymbolsIn(value, baseAssignIn(result, value)) : copySymbols(value, baseAssign(result, value));
            }
        } else {
            if (!cloneableTags[tag]) {
                return object ? value : {};
            }
            result = initCloneByTag(value, tag, baseClone, isDeep);
        }
    }
    // Check for circular references and return its corresponding clone.
    stack || (stack = new Stack());
    var stacked = stack.get(value);
    if (stacked) {
        return stacked;
    }
    stack.set(value, result);

    var keysFunc = isFull ? isFlat ? getAllKeysIn : getAllKeys : isFlat ? keysIn : keys;

    var props = isArr ? undefined : keysFunc(value);
    arrayEach(props || value, function (subValue, key) {
        if (props) {
            key = subValue;
            subValue = value[key];
        }
        // Recursively populate clone (susceptible to call stack limits).
        assignValue(result, key, baseClone(subValue, bitmask, customizer, key, value, stack));
    });
    return result;
}

/** Used to compose bitmasks for cloning. */
var CLONE_DEEP_FLAG = 1;
var CLONE_SYMBOLS_FLAG = 4;

/**
 * This method is like `_.clone` except that it recursively clones `value`.
 *
 * @static
 * @memberOf _
 * @since 1.0.0
 * @category Lang
 * @param {*} value The value to recursively clone.
 * @returns {*} Returns the deep cloned value.
 * @see _.clone
 * @example
 *
 * var objects = [{ 'a': 1 }, { 'b': 2 }];
 *
 * var deep = _.cloneDeep(objects);
 * console.log(deep[0] === objects[0]);
 * // => false
 */
function cloneDeep(value) {
    return baseClone(value, CLONE_DEEP_FLAG | CLONE_SYMBOLS_FLAG);
}

var BaseOpt = {
    // v1.0
    chart: {
        type: null,
        width: null,
        height: null,
        className: null,
        margin: {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0
        },
        background: {
            color: null,
            opacity: 1
        }
    },
    animation: {
        enabled: true,
        duration: {
            add: 500,
            update: 1000,
            remove: 500,
            color: 500,
            quickUpdate: 500
        }
    },
    events: {
        render: null,
        update: null,
        drilldown: null,
        drillup: null,
        drillupall: null,
        selection: null
    },
    color: {
        scheme: '', // string or array
        type: '',
        kmeans: true
    },
    plots: {},
    tooltip: {
        className: null,
        enabled: true,
        duration: 500,
        formatter: function formatter() {}
    },
    data: {},

    // v2.0
    title: {
        enabled: false,
        text: null,
        style: '',
        align: "center"
    },

    legend: {
        enabled: false
    }
};

/**
 * This function is like `assignValue` except that it doesn't assign
 * `undefined` values.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function assignMergeValue(object, key, value) {
    if (value !== undefined && !eq(object[key], value) || value === undefined && !(key in object)) {
        baseAssignValue(object, key, value);
    }
}

/**
 * Creates a base function for methods like `_.forIn` and `_.forOwn`.
 *
 * @private
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseFor(fromRight) {
    return function (object, iteratee, keysFunc) {
        var index = -1,
            iterable = Object(object),
            props = keysFunc(object),
            length = props.length;

        while (length--) {
            var key = props[fromRight ? length : ++index];
            if (iteratee(iterable[key], key, iterable) === false) {
                break;
            }
        }
        return object;
    };
}

/**
 * The base implementation of `baseForOwn` which iterates over `object`
 * properties returned by `keysFunc` and invokes `iteratee` for each property.
 * Iteratee functions may exit iteration early by explicitly returning `false`.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @returns {Object} Returns `object`.
 */
var baseFor = createBaseFor();

/**
 * This method is like `_.isArrayLike` except that it also checks if `value`
 * is an object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array-like object,
 *  else `false`.
 * @example
 *
 * _.isArrayLikeObject([1, 2, 3]);
 * // => true
 *
 * _.isArrayLikeObject(document.body.children);
 * // => true
 *
 * _.isArrayLikeObject('abc');
 * // => false
 *
 * _.isArrayLikeObject(_.noop);
 * // => false
 */
function isArrayLikeObject(value) {
    return isObjectLike(value) && isArrayLike(value);
}

/** `Object#toString` result references. */
var objectTag$3 = '[object Object]';

/** Used for built-in method references. */
var funcProto$2 = Function.prototype;
var objectProto$13 = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString$2 = funcProto$2.toString;

/** Used to check objects for own properties. */
var hasOwnProperty$10 = objectProto$13.hasOwnProperty;

/** Used to infer the `Object` constructor. */
var objectCtorString = funcToString$2.call(Object);

/**
 * Checks if `value` is a plain object, that is, an object created by the
 * `Object` constructor or one with a `[[Prototype]]` of `null`.
 *
 * @static
 * @memberOf _
 * @since 0.8.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * _.isPlainObject(new Foo);
 * // => false
 *
 * _.isPlainObject([1, 2, 3]);
 * // => false
 *
 * _.isPlainObject({ 'x': 0, 'y': 0 });
 * // => true
 *
 * _.isPlainObject(Object.create(null));
 * // => true
 */
function isPlainObject(value) {
    if (!isObjectLike(value) || baseGetTag(value) != objectTag$3) {
        return false;
    }
    var proto = getPrototype(value);
    if (proto === null) {
        return true;
    }
    var Ctor = hasOwnProperty$10.call(proto, 'constructor') && proto.constructor;
    return typeof Ctor == 'function' && Ctor instanceof Ctor && funcToString$2.call(Ctor) == objectCtorString;
}

/**
 * Converts `value` to a plain object flattening inherited enumerable string
 * keyed properties of `value` to own properties of the plain object.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {Object} Returns the converted plain object.
 * @example
 *
 * function Foo() {
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.assign({ 'a': 1 }, new Foo);
 * // => { 'a': 1, 'b': 2 }
 *
 * _.assign({ 'a': 1 }, _.toPlainObject(new Foo));
 * // => { 'a': 1, 'b': 2, 'c': 3 }
 */
function toPlainObject(value) {
    return copyObject(value, keysIn$1(value));
}

/**
 * A specialized version of `baseMerge` for arrays and objects which performs
 * deep merges and tracks traversed objects enabling objects with circular
 * references to be merged.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @param {string} key The key of the value to merge.
 * @param {number} srcIndex The index of `source`.
 * @param {Function} mergeFunc The function to merge values.
 * @param {Function} [customizer] The function to customize assigned values.
 * @param {Object} [stack] Tracks traversed source values and their merged
 *  counterparts.
 */
function baseMergeDeep(object, source, key, srcIndex, mergeFunc, customizer, stack) {
    var objValue = object[key],
        srcValue = source[key],
        stacked = stack.get(srcValue);

    if (stacked) {
        assignMergeValue(object, key, stacked);
        return;
    }
    var newValue = customizer ? customizer(objValue, srcValue, key + '', object, source, stack) : undefined;

    var isCommon = newValue === undefined;

    if (isCommon) {
        var isArr = isArray(srcValue),
            isBuff = !isArr && isBuffer(srcValue),
            isTyped = !isArr && !isBuff && isTypedArray(srcValue);

        newValue = srcValue;
        if (isArr || isBuff || isTyped) {
            if (isArray(objValue)) {
                newValue = objValue;
            } else if (isArrayLikeObject(objValue)) {
                newValue = copyArray(objValue);
            } else if (isBuff) {
                isCommon = false;
                newValue = cloneBuffer(srcValue, true);
            } else if (isTyped) {
                isCommon = false;
                newValue = cloneTypedArray(srcValue, true);
            } else {
                newValue = [];
            }
        } else if (isPlainObject(srcValue) || isArguments(srcValue)) {
            newValue = objValue;
            if (isArguments(objValue)) {
                newValue = toPlainObject(objValue);
            } else if (!isObject(objValue) || srcIndex && isFunction(objValue)) {
                newValue = initCloneObject(srcValue);
            }
        } else {
            isCommon = false;
        }
    }
    if (isCommon) {
        // Recursively merge objects and arrays (susceptible to call stack limits).
        stack.set(srcValue, newValue);
        mergeFunc(newValue, srcValue, srcIndex, customizer, stack);
        stack['delete'](srcValue);
    }
    assignMergeValue(object, key, newValue);
}

/**
 * The base implementation of `_.merge` without support for multiple sources.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @param {number} srcIndex The index of `source`.
 * @param {Function} [customizer] The function to customize merged values.
 * @param {Object} [stack] Tracks traversed source values and their merged
 *  counterparts.
 */
function baseMerge(object, source, srcIndex, customizer, stack) {
    if (object === source) {
        return;
    }
    baseFor(source, function (srcValue, key) {
        if (isObject(srcValue)) {
            stack || (stack = new Stack());
            baseMergeDeep(object, source, key, srcIndex, baseMerge, customizer, stack);
        } else {
            var newValue = customizer ? customizer(object[key], srcValue, key + '', object, source, stack) : undefined;

            if (newValue === undefined) {
                newValue = srcValue;
            }
            assignMergeValue(object, key, newValue);
        }
    }, keysIn$1);
}

/**
 * This method returns the first argument it receives.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Util
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'a': 1 };
 *
 * console.log(_.identity(object) === object);
 * // => true
 */
function identity$$1(value) {
    return value;
}

/**
 * A faster alternative to `Function#apply`, this function invokes `func`
 * with the `this` binding of `thisArg` and the arguments of `args`.
 *
 * @private
 * @param {Function} func The function to invoke.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {Array} args The arguments to invoke `func` with.
 * @returns {*} Returns the result of `func`.
 */
function apply(func, thisArg, args) {
    switch (args.length) {
        case 0:
            return func.call(thisArg);
        case 1:
            return func.call(thisArg, args[0]);
        case 2:
            return func.call(thisArg, args[0], args[1]);
        case 3:
            return func.call(thisArg, args[0], args[1], args[2]);
    }
    return func.apply(thisArg, args);
}

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * A specialized version of `baseRest` which transforms the rest array.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @param {Function} transform The rest array transform.
 * @returns {Function} Returns the new function.
 */
function overRest(func, start, transform) {
    start = nativeMax(start === undefined ? func.length - 1 : start, 0);
    return function () {
        var args = arguments,
            index = -1,
            length = nativeMax(args.length - start, 0),
            array = Array(length);

        while (++index < length) {
            array[index] = args[start + index];
        }
        index = -1;
        var otherArgs = Array(start + 1);
        while (++index < start) {
            otherArgs[index] = args[index];
        }
        otherArgs[start] = transform(array);
        return apply(func, this, otherArgs);
    };
}

/**
 * Creates a function that returns `value`.
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Util
 * @param {*} value The value to return from the new function.
 * @returns {Function} Returns the new constant function.
 * @example
 *
 * var objects = _.times(2, _.constant({ 'a': 1 }));
 *
 * console.log(objects);
 * // => [{ 'a': 1 }, { 'a': 1 }]
 *
 * console.log(objects[0] === objects[1]);
 * // => true
 */
function constant(value) {
    return function () {
        return value;
    };
}

/**
 * The base implementation of `setToString` without support for hot loop shorting.
 *
 * @private
 * @param {Function} func The function to modify.
 * @param {Function} string The `toString` result.
 * @returns {Function} Returns `func`.
 */
var baseSetToString = !defineProperty$1 ? identity$$1 : function (func, string) {
    return defineProperty$1(func, 'toString', {
        'configurable': true,
        'enumerable': false,
        'value': constant(string),
        'writable': true
    });
};

/** Used to detect hot functions by number of calls within a span of milliseconds. */
var HOT_COUNT = 800;
var HOT_SPAN = 16;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeNow = Date.now;

/**
 * Creates a function that'll short out and invoke `identity` instead
 * of `func` when it's called `HOT_COUNT` or more times in `HOT_SPAN`
 * milliseconds.
 *
 * @private
 * @param {Function} func The function to restrict.
 * @returns {Function} Returns the new shortable function.
 */
function shortOut(func) {
    var count = 0,
        lastCalled = 0;

    return function () {
        var stamp = nativeNow(),
            remaining = HOT_SPAN - (stamp - lastCalled);

        lastCalled = stamp;
        if (remaining > 0) {
            if (++count >= HOT_COUNT) {
                return arguments[0];
            }
        } else {
            count = 0;
        }
        return func.apply(undefined, arguments);
    };
}

/**
 * Sets the `toString` method of `func` to return `string`.
 *
 * @private
 * @param {Function} func The function to modify.
 * @param {Function} string The `toString` result.
 * @returns {Function} Returns `func`.
 */
var setToString = shortOut(baseSetToString);

/**
 * The base implementation of `_.rest` which doesn't validate or coerce arguments.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @returns {Function} Returns the new function.
 */
function baseRest(func, start) {
    return setToString(overRest(func, start, identity$$1), func + '');
}

/**
 * Checks if the given arguments are from an iteratee call.
 *
 * @private
 * @param {*} value The potential iteratee value argument.
 * @param {*} index The potential iteratee index or key argument.
 * @param {*} object The potential iteratee object argument.
 * @returns {boolean} Returns `true` if the arguments are from an iteratee call,
 *  else `false`.
 */
function isIterateeCall(value, index, object) {
    if (!isObject(object)) {
        return false;
    }
    var type = typeof index === 'undefined' ? 'undefined' : _typeof(index);
    if (type == 'number' ? isArrayLike(object) && isIndex(index, object.length) : type == 'string' && index in object) {
        return eq(object[index], value);
    }
    return false;
}

/**
 * Creates a function like `_.assign`.
 *
 * @private
 * @param {Function} assigner The function to assign values.
 * @returns {Function} Returns the new assigner function.
 */
function createAssigner(assigner) {
    return baseRest(function (object, sources) {
        var index = -1,
            length = sources.length,
            customizer = length > 1 ? sources[length - 1] : undefined,
            guard = length > 2 ? sources[2] : undefined;

        customizer = assigner.length > 3 && typeof customizer == 'function' ? (length--, customizer) : undefined;

        if (guard && isIterateeCall(sources[0], sources[1], guard)) {
            customizer = length < 3 ? undefined : customizer;
            length = 1;
        }
        object = Object(object);
        while (++index < length) {
            var source = sources[index];
            if (source) {
                assigner(object, source, index, customizer);
            }
        }
        return object;
    });
}

/**
 * This method is like `_.merge` except that it accepts `customizer` which
 * is invoked to produce the merged values of the destination and source
 * properties. If `customizer` returns `undefined`, merging is handled by the
 * method instead. The `customizer` is invoked with six arguments:
 * (objValue, srcValue, key, object, source, stack).
 *
 * **Note:** This method mutates `object`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} sources The source objects.
 * @param {Function} customizer The function to customize assigned values.
 * @returns {Object} Returns `object`.
 * @example
 *
 * function customizer(objValue, srcValue) {
 *   if (_.isArray(objValue)) {
 *     return objValue.concat(srcValue);
 *   }
 * }
 *
 * var object = { 'a': [1], 'b': [2] };
 * var other = { 'a': [3], 'b': [4] };
 *
 * _.mergeWith(object, other, customizer);
 * // => { 'a': [1, 3], 'b': [2, 4] }
 */
var mergeWith = createAssigner(function (object, source, srcIndex, customizer) {
    baseMerge(object, source, srcIndex, customizer);
});

/**
 * This method is like `_.assign` except that it recursively merges own and
 * inherited enumerable string keyed properties of source objects into the
 * destination object. Source properties that resolve to `undefined` are
 * skipped if a destination value exists. Array and plain object properties
 * are merged recursively. Other objects and value types are overridden by
 * assignment. Source objects are applied from left to right. Subsequent
 * sources overwrite property assignments of previous sources.
 *
 * **Note:** This method mutates `object`.
 *
 * @static
 * @memberOf _
 * @since 0.5.0
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @returns {Object} Returns `object`.
 * @example
 *
 * var object = {
 *   'a': [{ 'b': 2 }, { 'd': 4 }]
 * };
 *
 * var other = {
 *   'a': [{ 'c': 3 }, { 'e': 5 }]
 * };
 *
 * _.merge(object, other);
 * // => { 'a': [{ 'b': 2, 'c': 3 }, { 'd': 4, 'e': 5 }] }
 */
var merge = createAssigner(function (object, source, srcIndex) {
    baseMerge(object, source, srcIndex);
});

var MergeCustomizer = function MergeCustomizer(objValue, srcValue) {
    if (isArray(objValue)) {

        var hasObjDef = false;
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = objValue[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var d = _step.value;

                if (isObject(d)) {
                    hasObjDef = true;
                    break;
                }
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        if (hasObjDef === false) {
            // copy rather than concat
            return srcValue;
        } else if (objValue.length === 0) {
            // target is placeholder but not template
            return srcValue;
        } else if (objValue.length === 1) {
            // the single and first value is used as template
            var _template = objValue[0];

            return srcValue.map(function (d) {
                var _tep = cloneDeep(_template);
                return merge(_tep, d);
            });
        } else {
            // target has multiple values, all source are merged by index

            return objValue.map(function (d, i) {
                var _tep = cloneDeep(d);

                if (srcValue.length > i) {
                    return merge(_tep, srcValue[i]);
                } else {
                    return _tep;
                }
            });
        }
    }
};

var mergeOptions = function mergeOptions(_target, _source) {
    mergeWith(_target, _source, MergeCustomizer);

    return _target;
};

var mergeBase = function mergeBase() {
    for (var _len = arguments.length, opts = Array(_len), _key = 0; _key < _len; _key++) {
        opts[_key] = arguments[_key];
    }

    var _base = cloneDeep(BaseOpt);

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = opts[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var o = _step.value;

            mergeOptions(_base, o);
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    return _base;
};

var Globals = {
    DataType: {
        DATE: 'date',
        NUMBER: 'number',
        STRING: 'string'
    },

    ColorType: {
        GRADIENT: 'gradient',
        DISTINCT: 'distinct',
        CATEGORICAL: 'categorical',
        DIVERGENT: 'divergent'
    }

};

var MetroCold5 = ['#1bcebf', '#24bbd2', '#1572ca', '#1f33a1', '#5f26c1'];

var MetroRain3 = ['#79e70f', '#10d9ec', '#1f97e7'];

var MetroRain8 = ['#abe70f', '#79e70f', '#0fe71f', '#0fe7d4', '#10d9ec', '#10c5ec', '#1fb2e7', '#1f97e7'];

var TheMetLight = ["#F44336", "#E91E63", "#9C27B0", "#673AB7", "#3F51B5", "#2196F3", "#03A9F4", "#00BCD4", "#009688", "#4CAF50", "#8BC34A", "#CDDC39", "#FFEB3B", "#FFC107", "#FF9800", "#FF5722"];

var DefaultCategoricalColor = {
    scheme: TheMetLight,
    type: Globals.ColorType.CATEGORICAL
};

var confusionLines = {
    "Protanope": {
        x: 0.7465,
        y: 0.2535,
        m: 1.273463,
        yint: -0.073894
    },
    "Deuteranope": {
        x: 1.4,
        y: -0.4,
        m: 0.968437,
        yint: 0.003331
    },
    "Tritanope": {
        x: 0.1748,
        y: 0.0,
        m: 0.062921,
        yint: 0.292119
    }
};

var simulate_cache = {};

var simulate = function simulate(lab, type) {
    var _amount = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;

    // WARNING: may return [NaN, NaN, NaN]

    var amount = _amount;
    // Cache
    var key = lab.join('-') + '-' + type + '-' + amount;
    var cache = simulate_cache[key];
    if (cache) return cache;

    // Get data from type
    var confuse_x = confusionLines[type].x;
    var confuse_y = confusionLines[type].y;
    var confuse_m = confusionLines[type].m;
    var confuse_yint = confusionLines[type].yint;

    // Code adapted from http://galacticmilk.com/labs/Color-Vision/Javascript/Color.Vision.Simulate.js
    var color = chroma.lab(lab[0], lab[1], lab[2]);
    var sr = color.rgb()[0];
    var sg = color.rgb()[1];
    var sb = color.rgb()[2];
    var dr = sr; // destination color
    var dg = sg;
    var db = sb;
    // Convert source color into XYZ color space
    var pow_r = Math.pow(sr, 2.2);
    var pow_g = Math.pow(sg, 2.2);
    var pow_b = Math.pow(sb, 2.2);
    var X = pow_r * 0.412424 + pow_g * 0.357579 + pow_b * 0.180464; // RGB->XYZ (sRGB:D65)
    var Y = pow_r * 0.212656 + pow_g * 0.715158 + pow_b * 0.0721856;
    var Z = pow_r * 0.0193324 + pow_g * 0.119193 + pow_b * 0.950444;
    // Convert XYZ into xyY Chromacity Coordinates (xy) and Luminance (Y)
    var chroma_x = X / (X + Y + Z);
    var chroma_y = Y / (X + Y + Z);
    // Generate the "Confusion Line" between the source color and the Confusion Point
    var m = (chroma_y - confuse_y) / (chroma_x - confuse_x); // slope of Confusion Line
    var yint = chroma_y - chroma_x * m; // y-intercept of confusion line (x-intercept = 0.0)
    // How far the xy coords deviate from the simulation
    var deviate_x = (confuse_yint - yint) / (m - confuse_m);
    var deviate_y = m * deviate_x + yint;
    // Compute the simulated color's XYZ coords
    X = deviate_x * Y / deviate_y;
    Z = (1.0 - (deviate_x + deviate_y)) * Y / deviate_y;
    // Neutral grey calculated from luminance (in D65)
    var neutral_X = 0.312713 * Y / 0.329016;
    var neutral_Z = 0.358271 * Y / 0.329016;
    // Difference between simulated color and neutral grey
    var diff_X = neutral_X - X;
    var diff_Z = neutral_Z - Z;
    var diff_r = diff_X * 3.24071 + diff_Z * -0.498571; // XYZ->RGB (sRGB:D65)
    var diff_g = diff_X * -0.969258 + diff_Z * 0.0415557;
    var diff_b = diff_X * 0.0556352 + diff_Z * 1.05707;
    // Convert to RGB color space
    dr = X * 3.24071 + Y * -1.53726 + Z * -0.498571; // XYZ->RGB (sRGB:D65)
    dg = X * -0.969258 + Y * 1.87599 + Z * 0.0415557;
    db = X * 0.0556352 + Y * -0.203996 + Z * 1.05707;
    // Compensate simulated color towards a neutral fit in RGB space
    var fit_r = ((dr < 0.0 ? 0.0 : 1.0) - dr) / diff_r;
    var fit_g = ((dg < 0.0 ? 0.0 : 1.0) - dg) / diff_g;
    var fit_b = ((db < 0.0 ? 0.0 : 1.0) - db) / diff_b;
    var adjust = Math.max( // highest value
    fit_r > 1.0 || fit_r < 0.0 ? 0.0 : fit_r, fit_g > 1.0 || fit_g < 0.0 ? 0.0 : fit_g, fit_b > 1.0 || fit_b < 0.0 ? 0.0 : fit_b);
    // Shift proportional to the greatest shift
    dr = dr + adjust * diff_r;
    dg = dg + adjust * diff_g;
    db = db + adjust * diff_b;
    // Apply gamma correction
    dr = Math.pow(dr, 1.0 / 2.2);
    dg = Math.pow(dg, 1.0 / 2.2);
    db = Math.pow(db, 1.0 / 2.2);
    // Anomylize colors
    dr = sr * (1.0 - amount) + dr * amount;
    dg = sg * (1.0 - amount) + dg * amount;
    db = sb * (1.0 - amount) + db * amount;
    var dcolor = chroma.rgb(dr, dg, db);
    var result = dcolor.lab();
    simulate_cache[key] = result;
    return result;
};

// http://www.brucelindbloom.com/index.html?Eqn_DeltaE_CMC.html
var _cmcDistance = function _cmcDistance(lab1, lab2, l, c) {
    var L1 = lab1[0];
    var L2 = lab2[0];
    var a1 = lab1[1];
    var a2 = lab2[1];
    var b1 = lab1[2];
    var b2 = lab2[2];
    var C1 = Math.sqrt(Math.pow(a1, 2) + Math.pow(b1, 2));
    var C2 = Math.sqrt(Math.pow(a2, 2) + Math.pow(b2, 2));
    var deltaC = C1 - C2;
    var deltaL = L1 - L2;
    var deltaa = a1 - a2;
    var deltab = b1 - b2;
    var deltaH = Math.sqrt(Math.pow(deltaa, 2) + Math.pow(deltab, 2) + Math.pow(deltaC, 2));
    var H1 = Math.atan2(b1, a1) * (180 / Math.PI);
    while (H1 < 0) {
        H1 += 360;
    }
    var F = Math.sqrt(Math.pow(C1, 4) / (Math.pow(C1, 4) + 1900));
    var T = 164 <= H1 && H1 <= 345 ? 0.56 + Math.abs(0.2 * Math.cos(H1 + 168)) : 0.36 + Math.abs(0.4 * Math.cos(H1 + 35));
    var S_L = lab1[0] < 16 ? 0.511 : 0.040975 * L1 / (1 + 0.01765 * L1);
    var S_C = 0.0638 * C1 / (1 + 0.0131 * C1) + 0.638;
    var S_H = S_C * (F * T + 1 - F);
    var result = Math.sqrt(Math.pow(deltaL / (l * S_L), 2) + Math.pow(deltaC / (c * S_C), 2) + Math.pow(deltaH / S_H, 2));
    return result;
};

var _euclidianDistance = function _euclidianDistance(lab1, lab2) {
    return Math.sqrt(Math.pow(lab1[0] - lab2[0], 2) + Math.pow(lab1[1] - lab2[1], 2) + Math.pow(lab1[2] - lab2[2], 2));
};

var compromiseDistance = function compromiseDistance(lab1, lab2) {
    var distances = [];
    var coeffs = [];
    distances.push(_cmcDistance(lab1, lab2, 2, 1));
    coeffs.push(1000);
    var types = ['Protanope', 'Deuteranope', 'Tritanope'];

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = types[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var type = _step.value;

            var lab1_cb = simulate(lab1, type);
            var lab2_cb = simulate(lab2, type);
            if (!(lab1_cb.some(isNaN) || lab2_cb.some(isNaN))) {
                var c = void 0;
                switch (type) {
                    case 'Protanope':
                        c = 100;
                        break;
                    case 'Deuteranope':
                        c = 500;
                        break;
                    case 'Tritanope':
                        c = 1;
                        break;
                }
                distances.push(_cmcDistance(lab1_cb, lab2_cb, 2, 1));
                coeffs.push(c);
            }
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    var total = 0;
    var count = 0;
    distances.forEach(function (d, i) {
        total += coeffs[i] * d;
        count += coeffs[i];
    });
    return total / count;
};

var distanceColorblind = function distanceColorblind(lab1, lab2, type) {
    var lab1_cb = simulate(lab1, type);
    var lab2_cb = simulate(lab2, type);
    return _cmcDistance(lab1_cb, lab2_cb, 2, 1);
};

var getColorDistance = function getColorDistance(lab1, lab2) {
    var _type = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'Default';

    switch (_type) {
        case 'Default':
            return _euclidianDistance(lab1, lab2);
        case 'Euclidian':
            return _euclidianDistance(lab1, lab2);
        case 'CMC':
            return _cmcDistance(lab1, lab2, 2, 1);
        case 'Compromise':
            return compromiseDistance(lab1, lab2);
        default:
            return distanceColorblind(lab1, lab2, _type);
    }
};

var LAB_CONSTANTS = {
    // Corresponds roughly to RGB brighter/darker
    Kn: 18,

    // D65 standard referent
    Xn: 0.950470,
    Yn: 1,
    Zn: 1.088830,

    t0: 0.137931034, // 4 / 29
    t1: 0.206896552, // 6 / 29
    t2: 0.12841855, // 3 * t1 * t1
    t3: 0.008856452 // t1 * t1 * t1
};

var xyz_rgb = function xyz_rgb(r) {
    return Math.round(255 * (r <= 0.00304 ? 12.92 * r : 1.055 * Math.pow(r, 1 / 2.4) - 0.055));
};

var lab_xyz = function lab_xyz(labConstants, t) {
    return t > labConstants.t1 ? t * t * t : labConstants.t2 * (t - labConstants.t0);
};

var validateLab = function validateLab(lab) {
    // Code from Chroma.js 2016

    var l = lab[0];
    var a = lab[1];
    var b = lab[2];

    var y = (l + 16) / 116;
    var x = isNaN(a) ? y : y + a / 500;
    var z = isNaN(b) ? y : y - b / 200;

    y = LAB_CONSTANTS.Yn * lab_xyz(LAB_CONSTANTS, y);
    x = LAB_CONSTANTS.Xn * lab_xyz(LAB_CONSTANTS, x);
    z = LAB_CONSTANTS.Zn * lab_xyz(LAB_CONSTANTS, z);

    var r = xyz_rgb(3.2404542 * x - 1.5371385 * y - 0.4985314 * z); // D65 -> sRGB
    var g = xyz_rgb(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z);
    b = xyz_rgb(0.0556434 * x - 0.2040259 * y + 1.0572252 * z);

    return r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255;
};

/**
 * General condition for selecting the color space
 *
 * @param _schema {
 *      h: [min, max],
 *      c: [min, max],
 *      l: [min, max]
 * }
 * @return sub color space
 */
var withinRange = function withinRange(min, max$$1, d) {
    return d >= min && d <= max$$1;
};
var hcondition = function hcondition(preset, hcl) {
    return withinRange(preset.hmin, preset.hmax, hcl[0]);
};
var ccondition = function ccondition(preset, hcl) {
    return withinRange(preset.cmin, preset.cmax, hcl[1]);
};
var lcondition = function lcondition(preset, hcl) {
    return withinRange(preset.lmin, preset.lmax, hcl[2]);
};

var selectHCL = function selectHCL(preset, hcl) {
    return hcondition(preset, hcl) && ccondition(preset, hcl) && lcondition(preset, hcl);
};

var HclSelector = function () {
    function HclSelector(preset) {
        classCallCheck(this, HclSelector);

        this.preset = preset;
    }

    createClass(HclSelector, [{
        key: "validate",
        value: function validate(hcl) {
            return selectHCL(this.preset, hcl);
        }
    }]);
    return HclSelector;
}();

/** `Object#toString` result references. */
var stringTag$3 = '[object String]';

/**
 * Checks if `value` is classified as a `String` primitive or object.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a string, else `false`.
 * @example
 *
 * _.isString('abc');
 * // => true
 *
 * _.isString(1);
 * // => false
 */
function isString(value) {
    return typeof value == 'string' || !isArray(value) && isObjectLike(value) && baseGetTag(value) == stringTag$3;
}

/** `Object#toString` result references. */
var symbolTag$2 = '[object Symbol]';

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
    return (typeof value === 'undefined' ? 'undefined' : _typeof(value)) == 'symbol' || isObjectLike(value) && baseGetTag(value) == symbolTag$2;
}

/**
 * The base implementation of methods like `_.max` and `_.min` which accepts a
 * `comparator` to determine the extremum value.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} iteratee The iteratee invoked per iteration.
 * @param {Function} comparator The comparator used to compare values.
 * @returns {*} Returns the extremum value.
 */
function baseExtremum(array, iteratee, comparator) {
    var index = -1,
        length = array.length;

    while (++index < length) {
        var value = array[index],
            current = iteratee(value);

        if (current != null && (computed === undefined ? current === current && !isSymbol(current) : comparator(current, computed))) {
            var computed = current,
                result = value;
        }
    }
    return result;
}

/**
 * The base implementation of `_.gt` which doesn't coerce arguments.
 *
 * @private
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if `value` is greater than `other`,
 *  else `false`.
 */
function baseGt(value, other) {
    return value > other;
}

/**
 * Computes the maximum value of `array`. If `array` is empty or falsey,
 * `undefined` is returned.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Math
 * @param {Array} array The array to iterate over.
 * @returns {*} Returns the maximum value.
 * @example
 *
 * _.max([4, 2, 8, 6]);
 * // => 8
 *
 * _.max([]);
 * // => undefined
 */
function max$1(array) {
    return array && array.length ? baseExtremum(array, identity$$1, baseGt) : undefined;
}

/**
 * The base implementation of `_.lt` which doesn't coerce arguments.
 *
 * @private
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if `value` is less than `other`,
 *  else `false`.
 */
function baseLt(value, other) {
    return value < other;
}

/**
 * Computes the minimum value of `array`. If `array` is empty or falsey,
 * `undefined` is returned.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Math
 * @param {Array} array The array to iterate over.
 * @returns {*} Returns the minimum value.
 * @example
 *
 * _.min([4, 2, 8, 6]);
 * // => 2
 *
 * _.min([]);
 * // => undefined
 */
function min(array) {
    return array && array.length ? baseExtremum(array, identity$$1, baseLt) : undefined;
}

/* taken from https://simplestatistics.org/ */

/**
 * Given an array of x, this will find the extent of the
 * x and return an array of breaks that can be used
 * to categorize the x into a number of classes. The
 * returned array will always be 1 longer than the number of
 * classes because it includes the minimum value.
 *
 * @param {Array<number>} x an array of number values
 * @param {number} nClasses number of desired classes
 * @returns {Array<number>} array of class break positions
 * @example
 * equalIntervalBreaks([1, 2, 3, 4, 5, 6], 4); //= [1, 2.25, 3.5, 4.75, 6]
 */
var equalIntervalBreaks = function equalIntervalBreaks(x /*: Array<number> */, nClasses /*:number*/) /*: Array<number> */{

    if (x.length < 2) {
        return x;
    }

    var theMin = min(x),
        theMax = max$1(x);

    // the first break will always be the minimum value
    // in the xset
    var breaks = [theMin];

    // The size of each break is the full range of the x
    // divided by the number of classes requested
    var breakSize = (theMax - theMin) / nClasses;

    // In the case of nClasses = 1, this loop won't run
    // and the returned breaks will be [min, max]
    for (var i = 1; i < nClasses; i++) {
        breaks.push(breaks[0] + breakSize * i);
    }

    // the last break will always be the
    // maximum.
    breaks.push(theMax);

    return breaks;
};

var SchemeReds = 'Reds';
var SchemeBlues = 'Blues';
var SchemeGreens = 'Greens';
var SchemeGreys = 'Greys';
var SchemeOranges = 'Oranges';
var SchemePurples = 'Purples';
var SchemeBuGn = 'BuGn';
var SchemeBuPu = 'BuPu';
var SchemeGnBu = 'GnBu';
var SchemeOrRd = 'OrRd';
var SchemePuBuGn = 'PuBuGn';
var SchemePuBu = 'PuBu';
var SchemePuRd = 'PuRd';
var SchemeRdPu = 'RdPu';
var SchemeYlGnBu = 'YlGnBu';
var SchemeYlGn = 'YlGn';
var SchemeYlOrBr = 'YlOrBr';
var SchemeYlOrRd = 'YlOrRd';
var SchemeViridis = 'Viridis';
var SchemeInferno = 'Inferno';
var SchemeMagma = 'Magma';
var SchemePlasma = 'Plasma';
var SchemeWarm = 'Warm';
var SchemeCool = 'Cool';
var SchemeRainbow = 'Rainbow';
var SchemeCubehelix = 'Cubehelix';

var interpolateSequentialScheme = function interpolateSequentialScheme(_scheme) {
    if (!isFunction(_scheme) && !isString(_scheme)) {
        throw new Error(_scheme + 'is invalid');
    }

    // user specified interpolator
    if (isFunction(_scheme)) {
        return _scheme;
    }

    //shortcode for internal interpolators
    switch (_scheme) {

        // sequential single hue
        case SchemeBlues:
            return interpolateBlues;

        case SchemeGreens:
            return interpolateGreens;

        case SchemeGreys:
            return interpolateGreys;

        case SchemeOranges:
            return interpolateOranges;

        case SchemeReds:
            return interpolateReds;

        case SchemePurples:
            return interpolatePurples;

        // Sequential (Multi-Hue)
        case SchemeBuGn:
            return interpolateBuGn;

        case SchemeBuPu:
            return interpolateBuPu;

        case SchemeGnBu:
            return interpolateGnBu;

        case SchemeOrRd:
            return interpolateOrRd;

        case SchemePuBuGn:
            return interpolatePuBuGn;

        case SchemePuBu:
            return interpolatePuBu;

        case SchemePuRd:
            return interpolatePuRd;

        case SchemeRdPu:
            return interpolateRdPu;

        case SchemeYlGnBu:
            return interpolateYlGnBu;

        case SchemeYlGn:
            return interpolateYlGn;

        case SchemeYlOrBr:
            return interpolateYlOrBr;

        case SchemeYlOrRd:
            return interpolateYlOrRd;

        // R Color
        case SchemeViridis:
            return interpolateViridis;

        case SchemeInferno:
            return inferno;

        case SchemeMagma:
            return magma;

        case SchemePlasma:
            return plasma;

        case SchemeWarm:
            return warm;

        case SchemeCool:
            return cool;

        case SchemeRainbow:
            return interpolateRainbow;

        case SchemeCubehelix:
            return interpolateCubehelixDefault;

        default:
            return null;
    }
};

var formatter = format(".0%");

var linearStops = function linearStops(scheme$$1) {
    if (isString(scheme$$1) || isFunction(scheme$$1)) {
        var _seqScale = sequential(interpolateSequentialScheme(scheme$$1)).domain([0, 1]); // explicit domain, not really need to do so

        var _data = range$1(0, 1, 0.1);
        _data.push(1); // range is 0-0.9

        return _data.map(function (d) {
            return {
                offset: formatter(d),
                color: _seqScale(d)
            };
        });
    } else if (isArray(scheme$$1)) {
        var count = scheme$$1.length;

        if (count > 1) {
            var steps = equalIntervalBreaks([0, 1], count - 1);

            return steps.map(function (d, i) {
                return {
                    offset: formatter(d),
                    color: scheme$$1[i]
                };
            });
        } else {
            console.log('linear gradient requires at least two colors');
        }
    }
};

var SchemeAccent = 'Accent';
var SchemeDark2 = 'Dark2';
var SchemePaired = 'Paired';
var SchemePastel1 = 'Pastel1';
var SchemePastel2 = 'Pastel2';
var SchemeSet1 = 'Set1';
var SchemeSet2 = 'Set2';
var SchemeSet3 = 'Set3';
var SchemeCategory10 = 'Category10';
var SchemeCategory20 = 'Category20';
var SchemeCategory20b = 'Category20b';
var SchemeCategory20c = 'Category20c';

var SchemeBrBG = "BrBG";
var SchemePRGn = "PRGn";
var SchemePiYG = "PiYG";
var SchemePuOr = "PuOr";
var SchemeRdBu = "RdBu";
var SchemeRdGy = "RdGy";
var SchemeRdYlBu = "RdYlBu";
var SchemeRdYlGn = "RdYlGn";
var SchemeSpectral = "Spectral";

/* taken from https://simplestatistics.org/ */

/**
 * For a sorted input, counting the number of unique values
 * is possible in constant time and constant memory. This is
 * a simple implementation of the algorithm.
 *
 * Values are compared with `===`, so objects and non-primitive objects
 * are not handled in any special way.
 *
 * @param {Array<*>} x an array of any kind of value
 * @returns {number} count of unique values
 * @example
 * uniqueCountSorted([1, 2, 3]); // => 3
 * uniqueCountSorted([1, 1, 1]); // => 1
 */
var uniqueCountSorted = function uniqueCountSorted(x /*: Array<any>*/) /*: number */{
    var uniqueValueCount = 0,
        lastSeenValue = void 0;
    for (var i = 0; i < x.length; i++) {
        if (i === 0 || x[i] !== lastSeenValue) {
            lastSeenValue = x[i];
            uniqueValueCount++;
        }
    }
    return uniqueValueCount;
};

/* taken from https://simplestatistics.org/ */

/**
 * Sort an array of numbers by their numeric value, ensuring that the
 * array is not changed in place.
 *
 * This is necessary because the default behavior of .sort
 * in JavaScript is to sort arrays as string values
 *
 *     [1, 10, 12, 102, 20].sort()
 *     // output
 *     [1, 10, 102, 12, 20]
 *
 * @param {Array<number>} x input array
 * @return {Array<number>} sorted array
 * @private
 * @example
 * numericSort([3, 2, 1]) // => [1, 2, 3]
 */
var numericSort = function numericSort(x /*: Array<number> */) /*: Array<number> */{
    return x
    // ensure the array is not changed in-place
    .slice()
    // comparator function that treats input as numeric
    .sort(function (a, b) {
        return a - b;
    });
};

/* taken from https://simplestatistics.org/ */
/**
 * Create a new column x row matrix.
 *
 * @private
 * @param {number} columns
 * @param {number} rows
 * @return {Array<Array<number>>} matrix
 * @example
 * makeMatrix(10, 10);
 */
function makeMatrix(columns, rows) {
    var matrix = [];
    for (var i = 0; i < columns; i++) {
        var column = [];
        for (var j = 0; j < rows; j++) {
            column.push(0);
        }
        matrix.push(column);
    }
    return matrix;
}

/**
 * Generates incrementally computed values based on the sums and sums of
 * squares for the data array
 *
 * @private
 * @param {number} j
 * @param {number} i
 * @param {Array<number>} sums
 * @param {Array<number>} sumsOfSquares
 * @return {number}
 * @example
 * ssq(0, 1, [-1, 0, 2], [1, 1, 5]);
 */
function ssq(j, i, sums, sumsOfSquares) {
    var sji = void 0; // s(j, i)
    if (j > 0) {
        var muji = (sums[i] - sums[j - 1]) / (i - j + 1); // mu(j, i)
        sji = sumsOfSquares[i] - sumsOfSquares[j - 1] - (i - j + 1) * muji * muji;
    } else {
        sji = sumsOfSquares[i] - sums[i] * sums[i] / (i + 1);
    }
    if (sji < 0) {
        return 0;
    }
    return sji;
}

/**
 * Function that recursively divides and conquers computations
 * for cluster j
 *
 * @private
 * @param {number} iMin Minimum index in cluster to be computed
 * @param {number} iMax Maximum index in cluster to be computed
 * @param {number} cluster Index of the cluster currently being computed
 * @param {Array<Array<number>>} matrix
 * @param {Array<Array<number>>} backtrackMatrix
 * @param {Array<number>} sums
 * @param {Array<number>} sumsOfSquares
 */
function fillMatrixColumn(iMin, iMax, cluster, matrix, backtrackMatrix, sums, sumsOfSquares) {
    if (iMin > iMax) {
        return;
    }

    // Start at midpoint between iMin and iMax
    var i = Math.floor((iMin + iMax) / 2);

    matrix[cluster][i] = matrix[cluster - 1][i - 1];
    backtrackMatrix[cluster][i] = i;

    var jlow = cluster; // the lower end for j

    if (iMin > cluster) {
        jlow = Math.max(jlow, backtrackMatrix[cluster][iMin - 1] || 0);
    }
    jlow = Math.max(jlow, backtrackMatrix[cluster - 1][i] || 0);

    var jhigh = i - 1; // the upper end for j
    if (iMax < matrix.length - 1) {
        jhigh = Math.min(jhigh, backtrackMatrix[cluster][iMax + 1] || 0);
    }

    var sji = void 0;
    var sjlowi = void 0;
    var ssqjlow = void 0;
    var ssqj = void 0;
    for (var j = jhigh; j >= jlow; --j) {
        sji = ssq(j, i, sums, sumsOfSquares);

        if (sji + matrix[cluster - 1][jlow - 1] >= matrix[cluster][i]) {
            break;
        }

        // Examine the lower bound of the cluster border
        sjlowi = ssq(jlow, i, sums, sumsOfSquares);

        ssqjlow = sjlowi + matrix[cluster - 1][jlow - 1];

        if (ssqjlow < matrix[cluster][i]) {
            // Shrink the lower bound
            matrix[cluster][i] = ssqjlow;
            backtrackMatrix[cluster][i] = jlow;
        }
        jlow++;

        ssqj = sji + matrix[cluster - 1][j - 1];
        if (ssqj < matrix[cluster][i]) {
            matrix[cluster][i] = ssqj;
            backtrackMatrix[cluster][i] = j;
        }
    }

    fillMatrixColumn(iMin, i - 1, cluster, matrix, backtrackMatrix, sums, sumsOfSquares);
    fillMatrixColumn(i + 1, iMax, cluster, matrix, backtrackMatrix, sums, sumsOfSquares);
}

/**
 * Initializes the main matrices used in Ckmeans and kicks
 * off the divide and conquer cluster computation strategy
 *
 * @private
 * @param {Array<number>} data sorted array of values
 * @param {Array<Array<number>>} matrix
 * @param {Array<Array<number>>} backtrackMatrix
 */
function fillMatrices(data, matrix, backtrackMatrix) {
    var nValues = matrix[0].length;

    // Shift values by the median to improve numeric stability
    var shift = data[Math.floor(nValues / 2)];

    // Cumulative sum and cumulative sum of squares for all values in data array
    var sums = [];
    var sumsOfSquares = [];

    // Initialize first column in matrix & backtrackMatrix
    for (var i = 0, shiftedValue; i < nValues; ++i) {
        shiftedValue = data[i] - shift;
        if (i === 0) {
            sums.push(shiftedValue);
            sumsOfSquares.push(shiftedValue * shiftedValue);
        } else {
            sums.push(sums[i - 1] + shiftedValue);
            sumsOfSquares.push(sumsOfSquares[i - 1] + shiftedValue * shiftedValue);
        }

        // Initialize for cluster = 0
        matrix[0][i] = ssq(0, i, sums, sumsOfSquares);
        backtrackMatrix[0][i] = 0;
    }

    // Initialize the rest of the columns
    var iMin = void 0;
    for (var cluster = 1; cluster < matrix.length; ++cluster) {
        if (cluster < matrix.length - 1) {
            iMin = cluster;
        } else {
            // No need to compute matrix[K-1][0] ... matrix[K-1][N-2]
            iMin = nValues - 1;
        }

        fillMatrixColumn(iMin, nValues - 1, cluster, matrix, backtrackMatrix, sums, sumsOfSquares);
    }
}

/**
 * Ckmeans clustering is an improvement on heuristic-based clustering
 * approaches like Jenks. The algorithm was developed in
 * [Haizhou Wang and Mingzhou Song](http://journal.r-project.org/archive/2011-2/RJournal_2011-2_Wang+Song.pdf)
 * as a [dynamic programming](https://en.wikipedia.org/wiki/Dynamic_programming) approach
 * to the problem of clustering numeric data into groups with the least
 * within-group sum-of-squared-deviations.
 *
 * Minimizing the difference within groups - what Wang & Song refer to as
 * `withinss`, or within sum-of-squares, means that groups are optimally
 * homogenous within and the data is split into representative groups.
 * This is very useful for visualization, where you may want to represent
 * a continuous variable in discrete color or style groups. This function
 * can provide groups that emphasize differences between data.
 *
 * Being a dynamic approach, this algorithm is based on two matrices that
 * store incrementally-computed values for squared deviations and backtracking
 * indexes.
 *
 * This implementation is based on Ckmeans 3.4.6, which introduced a new divide
 * and conquer approach that improved runtime from O(kn^2) to O(kn log(n)).
 *
 * Unlike the [original implementation](https://cran.r-project.org/web/packages/Ckmeans.1d.dp/index.html),
 * this implementation does not include any code to automatically determine
 * the optimal number of clusters: this information needs to be explicitly
 * provided.
 *
 * ### References
 * _Ckmeans.1d.dp: Optimal k-means Clustering in One Dimension by Dynamic
 * Programming_ Haizhou Wang and Mingzhou Song ISSN 2073-4859
 *
 * from The R Journal Vol. 3/2, December 2011
 * @param {Array<number>} x input data, as an array of number values
 * @param {number} nClusters number of desired classes. This cannot be
 * greater than the number of values in the data array.
 * @returns {Array<Array<number>>} clustered input
 * @throws {Error} if the number of requested clusters is higher than the size of the data
 * @example
 * ckmeans([-1, 2, -1, 2, 4, 5, 6, -1, 2, -1], 3);
 * // The input, clustered into groups of similar numbers.
 * //= [[-1, -1, -1, -1], [2, 2, 2], [4, 5, 6]]);
 */
var ckmeans = function ckmeans(x /*: Array<number> */, nClusters /*: number */) /*: Array<Array<number>> */{

    if (nClusters > x.length) {
        throw new Error('cannot generate more classes than there are data values');
    }

    var sorted = numericSort(x),


    // we'll use this as the maximum number of clusters
    uniqueCount = uniqueCountSorted(sorted);

    // if all of the input values are identical, there's one cluster
    // with all of the input in it.
    if (uniqueCount === 1) {
        return [sorted];
    }

    // named 'S' originally
    var matrix = makeMatrix(nClusters, sorted.length),


    // named 'J' originally
    backtrackMatrix = makeMatrix(nClusters, sorted.length);

    // This is a dynamic programming way to solve the problem of minimizing
    // within-cluster sum of squares. It's similar to linear regression
    // in this way, and this calculation incrementally computes the
    // sum of squares that are later read.
    fillMatrices(sorted, matrix, backtrackMatrix);

    // The real work of Ckmeans clustering happens in the matrix generation:
    // the generated matrices encode all possible clustering combinations, and
    // once they're generated we can solve for the best clustering groups
    // very quickly.
    var clusters = [],
        clusterRight = backtrackMatrix[0].length - 1;

    // Backtrack the clusters from the dynamic programming matrix. This
    // starts at the bottom-right corner of the matrix (if the top-left is 0, 0),
    // and moves the cluster target with the loop.
    for (var cluster = backtrackMatrix.length - 1; cluster >= 0; cluster--) {

        var clusterLeft = backtrackMatrix[cluster][clusterRight];

        // fill the cluster from the sorted input by taking a slice of the
        // array. the backtrack matrix makes this easy - it stores the
        // indexes where the cluster should start and end.
        clusters[cluster] = sorted.slice(clusterLeft, clusterRight + 1);

        if (cluster > 0) {
            clusterRight = clusterLeft - 1;
        }
    }

    return clusters;
};

var warn = function warn(msg) {
    if (console) {
        console.warn(msg);
    }
};

var _smartSequential = function _smartSequential(_scheme, _data) {
    var _scale = linear$2();

    var schemeLen = _scheme.length;
    var dataLen = _data.length;

    var theDarkest = _scheme[schemeLen - 1];

    if (schemeLen === 0) {
        // nothing to do
    } else if (dataLen === 1) {
        // use the darkest
        _scale = ordinal().domain(_data[0]).range([theDarkest]);
    } else if (dataLen === schemeLen) {
        // use every single color
        _scale.domain(_data).range(_scheme);
    } else if (dataLen < schemeLen) {
        // sort data from the smallest to the largest

        var _trimmed = new Array(dataLen);

        var increment = (schemeLen - 1) / (dataLen - 1);
        var index = schemeLen - 1;

        for (var i = dataLen - 2; i > 0; i--) {
            index -= increment;
            _trimmed[i] = _scheme[i];
        }

        _trimmed[0] = _scheme[0];
        _trimmed[dataLen - 1] = theDarkest;

        _scale.domain(_data).range(_trimmed);
    } else {
        // use kmeans
        var clusters = ckmeans(_data, schemeLen - 1);
        var breakpoints = clusters.map(function (d) {
            return d[d.length - 1];
        });
        var _domain = [clusters[0][0]].concat(breakpoints);

        _scale.domain(_domain).range(_scheme);
    }

    return _scale;
};

var gradientColor = function gradientColor(scheme$$1, _data) {
    var _scheme = void 0;

    if (!isString(scheme$$1) && !isArray(scheme$$1) && !isFunction(scheme$$1)) {
        warn('color scheme is invalid: should be string, array or d3 interpolator');
        warn('MetroRain3 will be used by default');
        _scheme = MetroRain3;
    } else {
        _scheme = scheme$$1;
    }

    if (isString(_scheme)) {
        var _interpolated = interpolateSequentialScheme(_scheme);
        if (_interpolated === null) {
            warn('color scheme is not found');
            warn('MetroRain3 will be used by default');
            _scheme = MetroRain3;

            return _smartSequential(_scheme, _data);
        } else {
            return sequential(_interpolated).domain(extent(_data));
        }
    } else if (isFunction(_scheme)) {
        return sequential(_scheme).domain(extent(_data));
    } else if (isArray(_scheme)) {
        return _smartSequential(_scheme, _data);
    }
};

var _distinctStops = function _distinctStops(scheme$$1, distinction) {
    var _color = sequential(scheme$$1).domain(extent(distinction));
    return distinction.sort(ascending$1).map(function (d) {
        return _color(d);
    });
};

var distinctColor = function distinctColor(scheme$$1) {
    var distinction = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [0, 0.33, 0.66, 1];

    if (distinction.length < 2) {
        warn('distinction  must contains at least 3 elements, [0, 0.33, 0.66, 1] will be used by default');
    }

    var _distinction = distinction.length < 2 ? [0, 0.33, 0.66, 1] : distinction;

    var _scheme = void 0;

    if (!isString(scheme$$1) && !isArray(scheme$$1) && !isFunction(scheme$$1)) {
        warn('color scheme is invalid: should be string, array or d3 interpolator');
        warn(' MetroRain3 will be used by default');
        _scheme = MetroRain3;
    } else {
        _scheme = scheme$$1;
    }

    var _scale = quantile().domain(_distinction);

    if (isString(_scheme)) {
        var _interpolated = interpolateSequentialScheme(_scheme);

        if (_interpolated === null) {
            warn('color scheme is not found');
            warn('MetroRain3 will be used by default');

            _scheme = MetroRain3;
            _scale.range(_scheme);
        } else {
            _scale.range(_distinctStops(_interpolated, _distinction));
        }
    } else if (isFunction(_scheme)) {
        _scale.range(_distinctStops(_scheme, _distinction));
    } else if (isArray(_scheme)) {
        _scale.range(_scheme);
    }

    return _scale;
};

var interpolateDivergentScheme = function interpolateDivergentScheme(_scheme) {
    switch (_scheme) {
        // categorical
        case SchemeBrBG:
            return interpolateBrBG;

        case SchemePRGn:
            return interpolatePRGn;

        case SchemePiYG:
            return interpolatePiYG;

        case SchemePuOr:
            return interpolatePuOr;

        case SchemeRdBu:
            return interpolateRdBu;

        case SchemeRdGy:
            return interpolateRdGy;

        case SchemeRdYlBu:
            return interpolateRdYlBu;

        case SchemeRdYlGn:
            return interpolateRdYlGn;

        case SchemeSpectral:
            return interpolateSpectral;

        default:
            return null;
    }
};

var divergentColor = function divergentColor(scheme$$1) {
    warn('divergent not implemented yet');

    var _scheme = void 0;
    if (!isString(scheme$$1) && !isArray(scheme$$1) && !isFunction(scheme$$1)) {
        warn('color scheme is invalid: should be string, array or d3 interpolator');
        warn('SchemeRdYlGn will be used by default');
        _scheme = SchemeRdYlGn;
    } else {
        _scheme = scheme$$1;
    }

    if (isString(_scheme)) {
        var _interpolated = interpolateDivergentScheme(_scheme);

        if (_interpolated === null) {
            warn('color scheme is not found');
            warn('SchemeRdYlGn will be used by default');

            _scheme = SchemeRdYlGn;
            return sequential(interpolateDivergentScheme(_scheme));
        } else {
            return sequential(_interpolated);
        }
    } else if (isFunction(_scheme)) {
        return sequential(_scheme);
    } else {
        return null;
    }
};

var interpolateCategoricalScheme = function interpolateCategoricalScheme(_scheme) {
    switch (_scheme) {
        // categorical
        case SchemeAccent:
            return schemeAccent;

        case SchemeDark2:
            return schemeDark2;

        case SchemePaired:
            return schemePaired;

        case SchemePastel1:
            return schemePastel1;

        case SchemePastel2:
            return schemePastel2;

        case SchemeSet1:
            return schemeSet1;

        case SchemeSet2:
            return schemeSet2;

        case SchemeSet3:
            return schemeSet3;

        // categorical
        case SchemeCategory10:
            return schemeCategory10;

        case SchemeCategory20:
            return schemeCategory20;

        case SchemeCategory20b:
            return schemeCategory20b;

        case SchemeCategory20c:
            return schemeCategory20c;

        default:
            return null;
    }
};

var _selectFromScheme = function _selectFromScheme(interpolator, num) {
    var scale = sequential(interpolator);

    if (num <= 1) {
        return scale(1);
    } else {
        //https://github.com/d3/d3-array#range
        return range$1(num).map(function (d) {
            return scale(d / (num - 1));
        });
    }
};

var categoricalColor = function categoricalColor(scheme$$1) {
    var _num = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

    var _scheme = scheme$$1;
    if (!isString(scheme$$1) && !isArray(scheme$$1) && !isFunction(scheme$$1)) {
        warn('color scheme is invalid: should be string, array or d3 interpolator');
        warn('MetroRain8 will be used by default');
        _scheme = MetroRain8;
    }

    var selectNum = _num <= 1 ? 12 : _num;
    // warn('categorical number is invalid: should be larger than 0');
    // warn('12 will be used by default');

    if (isString(_scheme)) {
        var colorSet = interpolateCategoricalScheme(_scheme) || interpolateSequentialScheme(_scheme) || interpolateDivergentScheme(_scheme);

        if (colorSet != null) {
            if (isArray(colorSet)) {
                return ordinal().range(colorSet);
            } else {
                return ordinal().range(_selectFromScheme(colorSet, selectNum));
            }
        } else {
            return ordinal().range(MetroRain8);
        }
    } else if (isFunction(_scheme)) {
        return ordinal().range(_selectFromScheme(_scheme, selectNum));
    } else {
        return ordinal().range(_scheme);
    }
};

/**
 * A specialized version of `_.map` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function arrayMap(array, iteratee) {
    var index = -1,
        length = array == null ? 0 : array.length,
        result = Array(length);

    while (++index < length) {
        result[index] = iteratee(array[index], index, array);
    }
    return result;
}

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED$2 = '__lodash_hash_undefined__';

/**
 * Adds `value` to the array cache.
 *
 * @private
 * @name add
 * @memberOf SetCache
 * @alias push
 * @param {*} value The value to cache.
 * @returns {Object} Returns the cache instance.
 */
function setCacheAdd(value) {
    this.__data__.set(value, HASH_UNDEFINED$2);
    return this;
}

/**
 * Checks if `value` is in the array cache.
 *
 * @private
 * @name has
 * @memberOf SetCache
 * @param {*} value The value to search for.
 * @returns {number} Returns `true` if `value` is found, else `false`.
 */
function setCacheHas(value) {
    return this.__data__.has(value);
}

/**
 *
 * Creates an array cache object to store unique values.
 *
 * @private
 * @constructor
 * @param {Array} [values] The values to cache.
 */
function SetCache(values) {
    var index = -1,
        length = values == null ? 0 : values.length;

    this.__data__ = new MapCache();
    while (++index < length) {
        this.add(values[index]);
    }
}

// Add methods to `SetCache`.
SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
SetCache.prototype.has = setCacheHas;

/**
 * A specialized version of `_.some` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if any element passes the predicate check,
 *  else `false`.
 */
function arraySome(array, predicate) {
    var index = -1,
        length = array == null ? 0 : array.length;

    while (++index < length) {
        if (predicate(array[index], index, array)) {
            return true;
        }
    }
    return false;
}

/**
 * Checks if a `cache` value for `key` exists.
 *
 * @private
 * @param {Object} cache The cache to query.
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function cacheHas(cache, key) {
    return cache.has(key);
}

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG$2 = 1;
var COMPARE_UNORDERED_FLAG$1 = 2;

/**
 * A specialized version of `baseIsEqualDeep` for arrays with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Array} array The array to compare.
 * @param {Array} other The other array to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `array` and `other` objects.
 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
 */
function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
    var isPartial = bitmask & COMPARE_PARTIAL_FLAG$2,
        arrLength = array.length,
        othLength = other.length;

    if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
        return false;
    }
    // Assume cyclic values are equal.
    var stacked = stack.get(array);
    if (stacked && stack.get(other)) {
        return stacked == other;
    }
    var index = -1,
        result = true,
        seen = bitmask & COMPARE_UNORDERED_FLAG$1 ? new SetCache() : undefined;

    stack.set(array, other);
    stack.set(other, array);

    // Ignore non-index properties.
    while (++index < arrLength) {
        var arrValue = array[index],
            othValue = other[index];

        if (customizer) {
            var compared = isPartial ? customizer(othValue, arrValue, index, other, array, stack) : customizer(arrValue, othValue, index, array, other, stack);
        }
        if (compared !== undefined) {
            if (compared) {
                continue;
            }
            result = false;
            break;
        }
        // Recursively compare arrays (susceptible to call stack limits).
        if (seen) {
            if (!arraySome(other, function (othValue, othIndex) {
                if (!cacheHas(seen, othIndex) && (arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
                    return seen.push(othIndex);
                }
            })) {
                result = false;
                break;
            }
        } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
            result = false;
            break;
        }
    }
    stack['delete'](array);
    stack['delete'](other);
    return result;
}

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG$3 = 1;
var COMPARE_UNORDERED_FLAG$2 = 2;

/** `Object#toString` result references. */
var boolTag$3 = '[object Boolean]';
var dateTag$3 = '[object Date]';
var errorTag$2 = '[object Error]';
var mapTag$4 = '[object Map]';
var numberTag$4 = '[object Number]';
var regexpTag$3 = '[object RegExp]';
var setTag$4 = '[object Set]';
var stringTag$4 = '[object String]';
var symbolTag$3 = '[object Symbol]';

var arrayBufferTag$3 = '[object ArrayBuffer]';
var dataViewTag$4 = '[object DataView]';

/** Used to convert symbols to primitives and strings. */
var symbolProto$1 = _Symbol ? _Symbol.prototype : undefined;
var symbolValueOf$1 = symbolProto$1 ? symbolProto$1.valueOf : undefined;

/**
 * A specialized version of `baseIsEqualDeep` for comparing objects of
 * the same `toStringTag`.
 *
 * **Note:** This function only supports comparing values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {string} tag The `toStringTag` of the objects to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
    switch (tag) {
        case dataViewTag$4:
            if (object.byteLength != other.byteLength || object.byteOffset != other.byteOffset) {
                return false;
            }
            object = object.buffer;
            other = other.buffer;

        case arrayBufferTag$3:
            if (object.byteLength != other.byteLength || !equalFunc(new Uint8Array(object), new Uint8Array(other))) {
                return false;
            }
            return true;

        case boolTag$3:
        case dateTag$3:
        case numberTag$4:
            // Coerce booleans to `1` or `0` and dates to milliseconds.
            // Invalid dates are coerced to `NaN`.
            return eq(+object, +other);

        case errorTag$2:
            return object.name == other.name && object.message == other.message;

        case regexpTag$3:
        case stringTag$4:
            // Coerce regexes to strings and treat strings, primitives and objects,
            // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
            // for more details.
            return object == other + '';

        case mapTag$4:
            var convert = mapToArray;

        case setTag$4:
            var isPartial = bitmask & COMPARE_PARTIAL_FLAG$3;
            convert || (convert = setToArray);

            if (object.size != other.size && !isPartial) {
                return false;
            }
            // Assume cyclic values are equal.
            var stacked = stack.get(object);
            if (stacked) {
                return stacked == other;
            }
            bitmask |= COMPARE_UNORDERED_FLAG$2;

            // Recursively compare objects (susceptible to call stack limits).
            stack.set(object, other);
            var result = equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
            stack['delete'](object);
            return result;

        case symbolTag$3:
            if (symbolValueOf$1) {
                return symbolValueOf$1.call(object) == symbolValueOf$1.call(other);
            }
    }
    return false;
}

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG$4 = 1;

/** Used for built-in method references. */
var objectProto$15 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$12 = objectProto$15.hasOwnProperty;

/**
 * A specialized version of `baseIsEqualDeep` for objects with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
    var isPartial = bitmask & COMPARE_PARTIAL_FLAG$4,
        objProps = getAllKeys(object),
        objLength = objProps.length,
        othProps = getAllKeys(other),
        othLength = othProps.length;

    if (objLength != othLength && !isPartial) {
        return false;
    }
    var index = objLength;
    while (index--) {
        var key = objProps[index];
        if (!(isPartial ? key in other : hasOwnProperty$12.call(other, key))) {
            return false;
        }
    }
    // Assume cyclic values are equal.
    var stacked = stack.get(object);
    if (stacked && stack.get(other)) {
        return stacked == other;
    }
    var result = true;
    stack.set(object, other);
    stack.set(other, object);

    var skipCtor = isPartial;
    while (++index < objLength) {
        key = objProps[index];
        var objValue = object[key],
            othValue = other[key];

        if (customizer) {
            var compared = isPartial ? customizer(othValue, objValue, key, other, object, stack) : customizer(objValue, othValue, key, object, other, stack);
        }
        // Recursively compare objects (susceptible to call stack limits).
        if (!(compared === undefined ? objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack) : compared)) {
            result = false;
            break;
        }
        skipCtor || (skipCtor = key == 'constructor');
    }
    if (result && !skipCtor) {
        var objCtor = object.constructor,
            othCtor = other.constructor;

        // Non `Object` object instances with different constructors are not equal.
        if (objCtor != othCtor && 'constructor' in object && 'constructor' in other && !(typeof objCtor == 'function' && objCtor instanceof objCtor && typeof othCtor == 'function' && othCtor instanceof othCtor)) {
            result = false;
        }
    }
    stack['delete'](object);
    stack['delete'](other);
    return result;
}

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG$1 = 1;

/** `Object#toString` result references. */
var argsTag$3 = '[object Arguments]';
var arrayTag$2 = '[object Array]';
var objectTag$4 = '[object Object]';

/** Used for built-in method references. */
var objectProto$14 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$11 = objectProto$14.hasOwnProperty;

/**
 * A specialized version of `baseIsEqual` for arrays and objects which performs
 * deep comparisons and tracks traversed objects enabling objects with circular
 * references to be compared.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} [stack] Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
    var objIsArr = isArray(object),
        othIsArr = isArray(other),
        objTag = objIsArr ? arrayTag$2 : getTag$1(object),
        othTag = othIsArr ? arrayTag$2 : getTag$1(other);

    objTag = objTag == argsTag$3 ? objectTag$4 : objTag;
    othTag = othTag == argsTag$3 ? objectTag$4 : othTag;

    var objIsObj = objTag == objectTag$4,
        othIsObj = othTag == objectTag$4,
        isSameTag = objTag == othTag;

    if (isSameTag && isBuffer(object)) {
        if (!isBuffer(other)) {
            return false;
        }
        objIsArr = true;
        objIsObj = false;
    }
    if (isSameTag && !objIsObj) {
        stack || (stack = new Stack());
        return objIsArr || isTypedArray(object) ? equalArrays(object, other, bitmask, customizer, equalFunc, stack) : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
    }
    if (!(bitmask & COMPARE_PARTIAL_FLAG$1)) {
        var objIsWrapped = objIsObj && hasOwnProperty$11.call(object, '__wrapped__'),
            othIsWrapped = othIsObj && hasOwnProperty$11.call(other, '__wrapped__');

        if (objIsWrapped || othIsWrapped) {
            var objUnwrapped = objIsWrapped ? object.value() : object,
                othUnwrapped = othIsWrapped ? other.value() : other;

            stack || (stack = new Stack());
            return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
        }
    }
    if (!isSameTag) {
        return false;
    }
    stack || (stack = new Stack());
    return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
}

/**
 * The base implementation of `_.isEqual` which supports partial comparisons
 * and tracks traversed objects.
 *
 * @private
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @param {boolean} bitmask The bitmask flags.
 *  1 - Unordered comparison
 *  2 - Partial comparison
 * @param {Function} [customizer] The function to customize comparisons.
 * @param {Object} [stack] Tracks traversed `value` and `other` objects.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 */
function baseIsEqual(value, other, bitmask, customizer, stack) {
    if (value === other) {
        return true;
    }
    if (value == null || other == null || !isObjectLike(value) && !isObjectLike(other)) {
        return value !== value && other !== other;
    }
    return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
}

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG = 1;
var COMPARE_UNORDERED_FLAG = 2;

/**
 * The base implementation of `_.isMatch` without support for iteratee shorthands.
 *
 * @private
 * @param {Object} object The object to inspect.
 * @param {Object} source The object of property values to match.
 * @param {Array} matchData The property names, values, and compare flags to match.
 * @param {Function} [customizer] The function to customize comparisons.
 * @returns {boolean} Returns `true` if `object` is a match, else `false`.
 */
function baseIsMatch(object, source, matchData, customizer) {
    var index = matchData.length,
        length = index,
        noCustomizer = !customizer;

    if (object == null) {
        return !length;
    }
    object = Object(object);
    while (index--) {
        var data = matchData[index];
        if (noCustomizer && data[2] ? data[1] !== object[data[0]] : !(data[0] in object)) {
            return false;
        }
    }
    while (++index < length) {
        data = matchData[index];
        var key = data[0],
            objValue = object[key],
            srcValue = data[1];

        if (noCustomizer && data[2]) {
            if (objValue === undefined && !(key in object)) {
                return false;
            }
        } else {
            var stack = new Stack();
            if (customizer) {
                var result = customizer(objValue, srcValue, key, object, source, stack);
            }
            if (!(result === undefined ? baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG, customizer, stack) : result)) {
                return false;
            }
        }
    }
    return true;
}

/**
 * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` if suitable for strict
 *  equality comparisons, else `false`.
 */
function isStrictComparable(value) {
    return value === value && !isObject(value);
}

/**
 * Gets the property names, values, and compare flags of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the match data of `object`.
 */
function getMatchData(object) {
    var result = keys(object),
        length = result.length;

    while (length--) {
        var key = result[length],
            value = object[key];

        result[length] = [key, value, isStrictComparable(value)];
    }
    return result;
}

/**
 * A specialized version of `matchesProperty` for source values suitable
 * for strict equality comparisons, i.e. `===`.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @param {*} srcValue The value to match.
 * @returns {Function} Returns the new spec function.
 */
function matchesStrictComparable(key, srcValue) {
    return function (object) {
        if (object == null) {
            return false;
        }
        return object[key] === srcValue && (srcValue !== undefined || key in Object(object));
    };
}

/**
 * The base implementation of `_.matches` which doesn't clone `source`.
 *
 * @private
 * @param {Object} source The object of property values to match.
 * @returns {Function} Returns the new spec function.
 */
function baseMatches(source) {
    var matchData = getMatchData(source);
    if (matchData.length == 1 && matchData[0][2]) {
        return matchesStrictComparable(matchData[0][0], matchData[0][1]);
    }
    return function (object) {
        return object === source || baseIsMatch(object, source, matchData);
    };
}

/** Used to match property names within property paths. */
var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/;
var reIsPlainProp = /^\w*$/;

/**
 * Checks if `value` is a property name and not a property path.
 *
 * @private
 * @param {*} value The value to check.
 * @param {Object} [object] The object to query keys on.
 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
 */
function isKey(value, object) {
    if (isArray(value)) {
        return false;
    }
    var type = typeof value === 'undefined' ? 'undefined' : _typeof(value);
    if (type == 'number' || type == 'symbol' || type == 'boolean' || value == null || isSymbol(value)) {
        return true;
    }
    return reIsPlainProp.test(value) || !reIsDeepProp.test(value) || object != null && value in Object(object);
}

/** Error message constants. */
var FUNC_ERROR_TEXT = 'Expected a function';

/**
 * Creates a function that memoizes the result of `func`. If `resolver` is
 * provided, it determines the cache key for storing the result based on the
 * arguments provided to the memoized function. By default, the first argument
 * provided to the memoized function is used as the map cache key. The `func`
 * is invoked with the `this` binding of the memoized function.
 *
 * **Note:** The cache is exposed as the `cache` property on the memoized
 * function. Its creation may be customized by replacing the `_.memoize.Cache`
 * constructor with one whose instances implement the
 * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
 * method interface of `clear`, `delete`, `get`, `has`, and `set`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to have its output memoized.
 * @param {Function} [resolver] The function to resolve the cache key.
 * @returns {Function} Returns the new memoized function.
 * @example
 *
 * var object = { 'a': 1, 'b': 2 };
 * var other = { 'c': 3, 'd': 4 };
 *
 * var values = _.memoize(_.values);
 * values(object);
 * // => [1, 2]
 *
 * values(other);
 * // => [3, 4]
 *
 * object.a = 2;
 * values(object);
 * // => [1, 2]
 *
 * // Modify the result cache.
 * values.cache.set(object, ['a', 'b']);
 * values(object);
 * // => ['a', 'b']
 *
 * // Replace `_.memoize.Cache`.
 * _.memoize.Cache = WeakMap;
 */
function memoize(func, resolver) {
    if (typeof func != 'function' || resolver != null && typeof resolver != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
    }
    var memoized = function memoized() {
        var args = arguments,
            key = resolver ? resolver.apply(this, args) : args[0],
            cache = memoized.cache;

        if (cache.has(key)) {
            return cache.get(key);
        }
        var result = func.apply(this, args);
        memoized.cache = cache.set(key, result) || cache;
        return result;
    };
    memoized.cache = new (memoize.Cache || MapCache)();
    return memoized;
}

// Expose `MapCache`.
memoize.Cache = MapCache;

/** Used as the maximum memoize cache size. */
var MAX_MEMOIZE_SIZE = 500;

/**
 * A specialized version of `_.memoize` which clears the memoized function's
 * cache when it exceeds `MAX_MEMOIZE_SIZE`.
 *
 * @private
 * @param {Function} func The function to have its output memoized.
 * @returns {Function} Returns the new memoized function.
 */
function memoizeCapped(func) {
    var result = memoize(func, function (key) {
        if (cache.size === MAX_MEMOIZE_SIZE) {
            cache.clear();
        }
        return key;
    });

    var cache = result.cache;
    return result;
}

/** Used to match property names within property paths. */
var reLeadingDot = /^\./;
var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

/** Used to match backslashes in property paths. */
var reEscapeChar = /\\(\\)?/g;

/**
 * Converts `string` to a property path array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the property path array.
 */
var stringToPath = memoizeCapped(function (string) {
    var result = [];
    if (reLeadingDot.test(string)) {
        result.push('');
    }
    string.replace(rePropName, function (match, number, quote, string) {
        result.push(quote ? string.replace(reEscapeChar, '$1') : number || match);
    });
    return result;
});

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/** Used to convert symbols to primitives and strings. */
var symbolProto$2 = _Symbol ? _Symbol.prototype : undefined;
var symbolToString = symbolProto$2 ? symbolProto$2.toString : undefined;

/**
 * The base implementation of `_.toString` which doesn't convert nullish
 * values to empty strings.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString(value) {
    // Exit early for strings to avoid a performance hit in some environments.
    if (typeof value == 'string') {
        return value;
    }
    if (isArray(value)) {
        // Recursively convert values (susceptible to call stack limits).
        return arrayMap(value, baseToString) + '';
    }
    if (isSymbol(value)) {
        return symbolToString ? symbolToString.call(value) : '';
    }
    var result = value + '';
    return result == '0' && 1 / value == -INFINITY ? '-0' : result;
}

/**
 * Converts `value` to a string. An empty string is returned for `null`
 * and `undefined` values. The sign of `-0` is preserved.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 * @example
 *
 * _.toString(null);
 * // => ''
 *
 * _.toString(-0);
 * // => '-0'
 *
 * _.toString([1, 2, 3]);
 * // => '1,2,3'
 */
function toString(value) {
    return value == null ? '' : baseToString(value);
}

/**
 * Casts `value` to a path array if it's not one.
 *
 * @private
 * @param {*} value The value to inspect.
 * @param {Object} [object] The object to query keys on.
 * @returns {Array} Returns the cast property path array.
 */
function castPath(value, object) {
    if (isArray(value)) {
        return value;
    }
    return isKey(value, object) ? [value] : stringToPath(toString(value));
}

/** Used as references for various `Number` constants. */
var INFINITY$1 = 1 / 0;

/**
 * Converts `value` to a string key if it's not a string or symbol.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {string|symbol} Returns the key.
 */
function toKey(value) {
    if (typeof value == 'string' || isSymbol(value)) {
        return value;
    }
    var result = value + '';
    return result == '0' && 1 / value == -INFINITY$1 ? '-0' : result;
}

/**
 * The base implementation of `_.get` without support for default values.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to get.
 * @returns {*} Returns the resolved value.
 */
function baseGet(object, path) {
    path = castPath(path, object);

    var index = 0,
        length = path.length;

    while (object != null && index < length) {
        object = object[toKey(path[index++])];
    }
    return index && index == length ? object : undefined;
}

/**
 * Gets the value at `path` of `object`. If the resolved value is
 * `undefined`, the `defaultValue` is returned in its place.
 *
 * @static
 * @memberOf _
 * @since 3.7.0
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to get.
 * @param {*} [defaultValue] The value returned for `undefined` resolved values.
 * @returns {*} Returns the resolved value.
 * @example
 *
 * var object = { 'a': [{ 'b': { 'c': 3 } }] };
 *
 * _.get(object, 'a[0].b.c');
 * // => 3
 *
 * _.get(object, ['a', '0', 'b', 'c']);
 * // => 3
 *
 * _.get(object, 'a.b.c', 'default');
 * // => 'default'
 */
function get$1(object, path, defaultValue) {
    var result = object == null ? undefined : baseGet(object, path);
    return result === undefined ? defaultValue : result;
}

/**
 * The base implementation of `_.hasIn` without support for deep paths.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {Array|string} key The key to check.
 * @returns {boolean} Returns `true` if `key` exists, else `false`.
 */
function baseHasIn(object, key) {
    return object != null && key in Object(object);
}

/**
 * Checks if `path` exists on `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} path The path to check.
 * @param {Function} hasFunc The function to check properties.
 * @returns {boolean} Returns `true` if `path` exists, else `false`.
 */
function hasPath(object, path, hasFunc) {
    path = castPath(path, object);

    var index = -1,
        length = path.length,
        result = false;

    while (++index < length) {
        var key = toKey(path[index]);
        if (!(result = object != null && hasFunc(object, key))) {
            break;
        }
        object = object[key];
    }
    if (result || ++index != length) {
        return result;
    }
    length = object == null ? 0 : object.length;
    return !!length && isLength(length) && isIndex(key, length) && (isArray(object) || isArguments(object));
}

/**
 * Checks if `path` is a direct or inherited property of `object`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path to check.
 * @returns {boolean} Returns `true` if `path` exists, else `false`.
 * @example
 *
 * var object = _.create({ 'a': _.create({ 'b': 2 }) });
 *
 * _.hasIn(object, 'a');
 * // => true
 *
 * _.hasIn(object, 'a.b');
 * // => true
 *
 * _.hasIn(object, ['a', 'b']);
 * // => true
 *
 * _.hasIn(object, 'b');
 * // => false
 */
function hasIn(object, path) {
    return object != null && hasPath(object, path, baseHasIn);
}

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG$5 = 1;
var COMPARE_UNORDERED_FLAG$3 = 2;

/**
 * The base implementation of `_.matchesProperty` which doesn't clone `srcValue`.
 *
 * @private
 * @param {string} path The path of the property to get.
 * @param {*} srcValue The value to match.
 * @returns {Function} Returns the new spec function.
 */
function baseMatchesProperty(path, srcValue) {
    if (isKey(path) && isStrictComparable(srcValue)) {
        return matchesStrictComparable(toKey(path), srcValue);
    }
    return function (object) {
        var objValue = get$1(object, path);
        return objValue === undefined && objValue === srcValue ? hasIn(object, path) : baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG$5 | COMPARE_UNORDERED_FLAG$3);
    };
}

/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new accessor function.
 */
function baseProperty(key) {
    return function (object) {
        return object == null ? undefined : object[key];
    };
}

/**
 * A specialized version of `baseProperty` which supports deep paths.
 *
 * @private
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new accessor function.
 */
function basePropertyDeep(path) {
    return function (object) {
        return baseGet(object, path);
    };
}

/**
 * Creates a function that returns the value at `path` of a given object.
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Util
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new accessor function.
 * @example
 *
 * var objects = [
 *   { 'a': { 'b': 2 } },
 *   { 'a': { 'b': 1 } }
 * ];
 *
 * _.map(objects, _.property('a.b'));
 * // => [2, 1]
 *
 * _.map(_.sortBy(objects, _.property(['a', 'b'])), 'a.b');
 * // => [1, 2]
 */
function property(path) {
    return isKey(path) ? baseProperty(toKey(path)) : basePropertyDeep(path);
}

/**
 * The base implementation of `_.iteratee`.
 *
 * @private
 * @param {*} [value=_.identity] The value to convert to an iteratee.
 * @returns {Function} Returns the iteratee.
 */
function baseIteratee(value) {
    // Don't store the `typeof` result in a variable to avoid a JIT bug in Safari 9.
    // See https://bugs.webkit.org/show_bug.cgi?id=156034 for more details.
    if (typeof value == 'function') {
        return value;
    }
    if (value == null) {
        return identity$$1;
    }
    if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) == 'object') {
        return isArray(value) ? baseMatchesProperty(value[0], value[1]) : baseMatches(value);
    }
    return property(value);
}

/**
 * The base implementation of `_.forOwn` without support for iteratee shorthands.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
function baseForOwn(object, iteratee) {
    return object && baseFor(object, iteratee, keys);
}

/**
 * Creates a `baseEach` or `baseEachRight` function.
 *
 * @private
 * @param {Function} eachFunc The function to iterate over a collection.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseEach(eachFunc, fromRight) {
    return function (collection, iteratee) {
        if (collection == null) {
            return collection;
        }
        if (!isArrayLike(collection)) {
            return eachFunc(collection, iteratee);
        }
        var length = collection.length,
            index = fromRight ? length : -1,
            iterable = Object(collection);

        while (fromRight ? index-- : ++index < length) {
            if (iteratee(iterable[index], index, iterable) === false) {
                break;
            }
        }
        return collection;
    };
}

/**
 * The base implementation of `_.forEach` without support for iteratee shorthands.
 *
 * @private
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array|Object} Returns `collection`.
 */
var baseEach = createBaseEach(baseForOwn);

/**
 * The base implementation of `_.map` without support for iteratee shorthands.
 *
 * @private
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function baseMap(collection, iteratee) {
    var index = -1,
        result = isArrayLike(collection) ? Array(collection.length) : [];

    baseEach(collection, function (value, key, collection) {
        result[++index] = iteratee(value, key, collection);
    });
    return result;
}

/**
 * Creates an array of values by running each element in `collection` thru
 * `iteratee`. The iteratee is invoked with three arguments:
 * (value, index|key, collection).
 *
 * Many lodash methods are guarded to work as iteratees for methods like
 * `_.every`, `_.filter`, `_.map`, `_.mapValues`, `_.reject`, and `_.some`.
 *
 * The guarded methods are:
 * `ary`, `chunk`, `curry`, `curryRight`, `drop`, `dropRight`, `every`,
 * `fill`, `invert`, `parseInt`, `random`, `range`, `rangeRight`, `repeat`,
 * `sampleSize`, `slice`, `some`, `sortBy`, `split`, `take`, `takeRight`,
 * `template`, `trim`, `trimEnd`, `trimStart`, and `words`
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Collection
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 * @example
 *
 * function square(n) {
 *   return n * n;
 * }
 *
 * _.map([4, 8], square);
 * // => [16, 64]
 *
 * _.map({ 'a': 4, 'b': 8 }, square);
 * // => [16, 64] (iteration order is not guaranteed)
 *
 * var users = [
 *   { 'user': 'barney' },
 *   { 'user': 'fred' }
 * ];
 *
 * // The `_.property` iteratee shorthand.
 * _.map(users, 'user');
 * // => ['barney', 'fred']
 */
function map(collection, iteratee) {
    var func = isArray(collection) ? arrayMap : baseMap;
    return func(collection, baseIteratee(iteratee, 3));
}

var genericColor = function genericColor(_color, _data) {
    var _scheme = _color.scheme;
    var _type = _color.type;

    switch (_type) {
        case Globals.ColorType.GRADIENT:
            return gradientColor(_scheme, _data);

        case Globals.ColorType.DISTINCT:
            var _valMap = _data ? map(_color.distinction, function (d) {
                return max(_data) * +d;
            }) : _color.distinction;

            return distinctColor(_scheme, _valMap);

        case Globals.ColorType.DIVERGENT:
            return divergentColor(_scheme, _data);

        case Globals.ColorType.CATEGORICAL:
            return categoricalColor(_scheme);

        default:
            warn('color type should be gradient, distinct, divergent and categorical');
            break;
    }
};

var AbstractChart = function () {
    function AbstractChart(containerId, _userOptions) {
        classCallCheck(this, AbstractChart);

        this._isMobileSize = mobileAndTabletCheck();
        this._containerId = containerId;
        this._options = this.createOptions(_userOptions);

        assignBound(containerId, this._options);

        this._id = uuid();
        this._data;
        this._color;
        this._container;
        this._listeners = dispatch('resize');
    }

    createClass(AbstractChart, [{
        key: 'render',
        value: function render(_data) {
            this.data(_data);
            this._color = this._provideColor();

            this._container = select(this._containerId).append("svg").attr("width", this._options.chart.width).attr("height", this._options.chart.height).attr("preserveAspectRatio", "xMinYMin meet").attr("viewBox", "0 0 " + this._options.chart.width + " " + this._options.chart.height).classed("vizart-chart", true);

            this._svg = this._container.append("g").attr("transform", "translate(" + this._options.chart.margin.left + "," + this._options.chart.margin.top + ")");
        }
    }, {
        key: 'on',
        value: function on(_name, _callback) {
            this._listeners.on(_name, _callback);
        }
    }, {
        key: 'resize',
        value: function resize(_size) {
            resizeBound(this._containerId, this._options, _size);

            this._container.attr("width", this._options.chart.width).attr("height", this._options.chart.height);

            this._listeners.call('resize');
        }
    }, {
        key: 'update',
        value: function update() {
            this._color = this._provideColor();
        }
    }, {
        key: 'data',
        value: function data(_data) {
            if (check(_data) === true) {
                this._data = _data;
            }
            return this._data;
        }
    }, {
        key: 'createOptions',
        value: function createOptions(_userOptions) {
            throw new Error('this is an abstract method');
        }
    }, {
        key: 'options',
        value: function options(_options) {
            if (check(_options) === true) {
                mergeOptions(this._options, _options);
            }

            return this._options;
        }
    }, {
        key: 'transitionColor',
        value: function transitionColor(colorOptions) {
            this._options.color = colorOptions;
            this._color = this._provideColor();
        }
    }, {
        key: '_provideColor',
        value: function _provideColor() {
            return genericColor(this._options.color);
        }
    }]);
    return AbstractChart;
}();

//Taken from http://bl.ocks.org/mbostock/7555321
//Wraps SVG text
var wrapSVGText = function wrapSVGText(text, width) {
    text.each(function () {
        var text = select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.4,

        // ems
        y = text.attr("y"),
            x = text.attr("x"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
        }
    });
};

var pi$1 = Math.PI;
var tau$1 = 2 * pi$1;
var epsilon = 1e-6;
var tauEpsilon = tau$1 - epsilon;

function Path() {
  this._x0 = this._y0 = // start of current subpath
  this._x1 = this._y1 = null; // end of current subpath
  this._ = "";
}

function path() {
  return new Path();
}

Path.prototype = path.prototype = {
  constructor: Path,
  moveTo: function moveTo(x, y) {
    this._ += "M" + (this._x0 = this._x1 = +x) + "," + (this._y0 = this._y1 = +y);
  },
  closePath: function closePath() {
    if (this._x1 !== null) {
      this._x1 = this._x0, this._y1 = this._y0;
      this._ += "Z";
    }
  },
  lineTo: function lineTo(x, y) {
    this._ += "L" + (this._x1 = +x) + "," + (this._y1 = +y);
  },
  quadraticCurveTo: function quadraticCurveTo(x1, y1, x, y) {
    this._ += "Q" + +x1 + "," + +y1 + "," + (this._x1 = +x) + "," + (this._y1 = +y);
  },
  bezierCurveTo: function bezierCurveTo(x1, y1, x2, y2, x, y) {
    this._ += "C" + +x1 + "," + +y1 + "," + +x2 + "," + +y2 + "," + (this._x1 = +x) + "," + (this._y1 = +y);
  },
  arcTo: function arcTo(x1, y1, x2, y2, r) {
    x1 = +x1, y1 = +y1, x2 = +x2, y2 = +y2, r = +r;
    var x0 = this._x1,
        y0 = this._y1,
        x21 = x2 - x1,
        y21 = y2 - y1,
        x01 = x0 - x1,
        y01 = y0 - y1,
        l01_2 = x01 * x01 + y01 * y01;

    // Is the radius negative? Error.
    if (r < 0) throw new Error("negative radius: " + r);

    // Is this path empty? Move to (x1,y1).
    if (this._x1 === null) {
      this._ += "M" + (this._x1 = x1) + "," + (this._y1 = y1);
    }

    // Or, is (x1,y1) coincident with (x0,y0)? Do nothing.
    else if (!(l01_2 > epsilon)) {}

      // Or, are (x0,y0), (x1,y1) and (x2,y2) collinear?
      // Equivalently, is (x1,y1) coincident with (x2,y2)?
      // Or, is the radius zero? Line to (x1,y1).
      else if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon) || !r) {
          this._ += "L" + (this._x1 = x1) + "," + (this._y1 = y1);
        }

        // Otherwise, draw an arc!
        else {
            var x20 = x2 - x0,
                y20 = y2 - y0,
                l21_2 = x21 * x21 + y21 * y21,
                l20_2 = x20 * x20 + y20 * y20,
                l21 = Math.sqrt(l21_2),
                l01 = Math.sqrt(l01_2),
                l = r * Math.tan((pi$1 - Math.acos((l21_2 + l01_2 - l20_2) / (2 * l21 * l01))) / 2),
                t01 = l / l01,
                t21 = l / l21;

            // If the start tangent is not coincident with (x0,y0), line to.
            if (Math.abs(t01 - 1) > epsilon) {
              this._ += "L" + (x1 + t01 * x01) + "," + (y1 + t01 * y01);
            }

            this._ += "A" + r + "," + r + ",0,0," + +(y01 * x20 > x01 * y20) + "," + (this._x1 = x1 + t21 * x21) + "," + (this._y1 = y1 + t21 * y21);
          }
  },
  arc: function arc(x, y, r, a0, a1, ccw) {
    x = +x, y = +y, r = +r;
    var dx = r * Math.cos(a0),
        dy = r * Math.sin(a0),
        x0 = x + dx,
        y0 = y + dy,
        cw = 1 ^ ccw,
        da = ccw ? a0 - a1 : a1 - a0;

    // Is the radius negative? Error.
    if (r < 0) throw new Error("negative radius: " + r);

    // Is this path empty? Move to (x0,y0).
    if (this._x1 === null) {
      this._ += "M" + x0 + "," + y0;
    }

    // Or, is (x0,y0) not coincident with the previous point? Line to (x0,y0).
    else if (Math.abs(this._x1 - x0) > epsilon || Math.abs(this._y1 - y0) > epsilon) {
        this._ += "L" + x0 + "," + y0;
      }

    // Is this arc empty? We’re done.
    if (!r) return;

    // Does the angle go the wrong way? Flip the direction.
    if (da < 0) da = da % tau$1 + tau$1;

    // Is this a complete circle? Draw two arcs to complete the circle.
    if (da > tauEpsilon) {
      this._ += "A" + r + "," + r + ",0,1," + cw + "," + (x - dx) + "," + (y - dy) + "A" + r + "," + r + ",0,1," + cw + "," + (this._x1 = x0) + "," + (this._y1 = y0);
    }

    // Is this arc non-empty? Draw an arc!
    else if (da > epsilon) {
        this._ += "A" + r + "," + r + ",0," + +(da >= pi$1) + "," + cw + "," + (this._x1 = x + r * Math.cos(a1)) + "," + (this._y1 = y + r * Math.sin(a1));
      }
  },
  rect: function rect(x, y, w, h) {
    this._ += "M" + (this._x0 = this._x1 = +x) + "," + (this._y0 = this._y1 = +y) + "h" + +w + "v" + +h + "h" + -w + "Z";
  },
  toString: function toString() {
    return this._;
  }
};

var constant$5 = function (x) {
  return function constant() {
    return x;
  };
};

var abs = Math.abs;
var atan2 = Math.atan2;
var cos = Math.cos;
var max$1$1 = Math.max;
var min$2 = Math.min;
var sin = Math.sin;
var sqrt$1 = Math.sqrt;

var epsilon$1 = 1e-12;
var pi$2 = Math.PI;
var halfPi$1 = pi$2 / 2;
var tau$2 = 2 * pi$2;

function acos(x) {
  return x > 1 ? 0 : x < -1 ? pi$2 : Math.acos(x);
}

function asin(x) {
  return x >= 1 ? halfPi$1 : x <= -1 ? -halfPi$1 : Math.asin(x);
}

function arcInnerRadius(d) {
  return d.innerRadius;
}

function arcOuterRadius(d) {
  return d.outerRadius;
}

function arcStartAngle(d) {
  return d.startAngle;
}

function arcEndAngle(d) {
  return d.endAngle;
}

function arcPadAngle(d) {
  return d && d.padAngle; // Note: optional!
}

function intersect(x0, y0, x1, y1, x2, y2, x3, y3) {
  var x10 = x1 - x0,
      y10 = y1 - y0,
      x32 = x3 - x2,
      y32 = y3 - y2,
      t = (x32 * (y0 - y2) - y32 * (x0 - x2)) / (y32 * x10 - x32 * y10);
  return [x0 + t * x10, y0 + t * y10];
}

// Compute perpendicular offset line of length rc.
// http://mathworld.wolfram.com/Circle-LineIntersection.html
function cornerTangents(x0, y0, x1, y1, r1, rc, cw) {
  var x01 = x0 - x1,
      y01 = y0 - y1,
      lo = (cw ? rc : -rc) / sqrt$1(x01 * x01 + y01 * y01),
      ox = lo * y01,
      oy = -lo * x01,
      x11 = x0 + ox,
      y11 = y0 + oy,
      x10 = x1 + ox,
      y10 = y1 + oy,
      x00 = (x11 + x10) / 2,
      y00 = (y11 + y10) / 2,
      dx = x10 - x11,
      dy = y10 - y11,
      d2 = dx * dx + dy * dy,
      r = r1 - rc,
      D = x11 * y10 - x10 * y11,
      d = (dy < 0 ? -1 : 1) * sqrt$1(max$1$1(0, r * r * d2 - D * D)),
      cx0 = (D * dy - dx * d) / d2,
      cy0 = (-D * dx - dy * d) / d2,
      cx1 = (D * dy + dx * d) / d2,
      cy1 = (-D * dx + dy * d) / d2,
      dx0 = cx0 - x00,
      dy0 = cy0 - y00,
      dx1 = cx1 - x00,
      dy1 = cy1 - y00;

  // Pick the closer of the two intersection points.
  // TODO Is there a faster way to determine which intersection to use?
  if (dx0 * dx0 + dy0 * dy0 > dx1 * dx1 + dy1 * dy1) cx0 = cx1, cy0 = cy1;

  return {
    cx: cx0,
    cy: cy0,
    x01: -ox,
    y01: -oy,
    x11: cx0 * (r1 / r - 1),
    y11: cy0 * (r1 / r - 1)
  };
}

var arc = function () {
  var innerRadius = arcInnerRadius,
      outerRadius = arcOuterRadius,
      cornerRadius = constant$5(0),
      padRadius = null,
      startAngle = arcStartAngle,
      endAngle = arcEndAngle,
      padAngle = arcPadAngle,
      context = null;

  function arc() {
    var buffer,
        r,
        r0 = +innerRadius.apply(this, arguments),
        r1 = +outerRadius.apply(this, arguments),
        a0 = startAngle.apply(this, arguments) - halfPi$1,
        a1 = endAngle.apply(this, arguments) - halfPi$1,
        da = abs(a1 - a0),
        cw = a1 > a0;

    if (!context) context = buffer = path();

    // Ensure that the outer radius is always larger than the inner radius.
    if (r1 < r0) r = r1, r1 = r0, r0 = r;

    // Is it a point?
    if (!(r1 > epsilon$1)) context.moveTo(0, 0);

    // Or is it a circle or annulus?
    else if (da > tau$2 - epsilon$1) {
        context.moveTo(r1 * cos(a0), r1 * sin(a0));
        context.arc(0, 0, r1, a0, a1, !cw);
        if (r0 > epsilon$1) {
          context.moveTo(r0 * cos(a1), r0 * sin(a1));
          context.arc(0, 0, r0, a1, a0, cw);
        }
      }

      // Or is it a circular or annular sector?
      else {
          var a01 = a0,
              a11 = a1,
              a00 = a0,
              a10 = a1,
              da0 = da,
              da1 = da,
              ap = padAngle.apply(this, arguments) / 2,
              rp = ap > epsilon$1 && (padRadius ? +padRadius.apply(this, arguments) : sqrt$1(r0 * r0 + r1 * r1)),
              rc = min$2(abs(r1 - r0) / 2, +cornerRadius.apply(this, arguments)),
              rc0 = rc,
              rc1 = rc,
              t0,
              t1;

          // Apply padding? Note that since r1 ≥ r0, da1 ≥ da0.
          if (rp > epsilon$1) {
            var p0 = asin(rp / r0 * sin(ap)),
                p1 = asin(rp / r1 * sin(ap));
            if ((da0 -= p0 * 2) > epsilon$1) p0 *= cw ? 1 : -1, a00 += p0, a10 -= p0;else da0 = 0, a00 = a10 = (a0 + a1) / 2;
            if ((da1 -= p1 * 2) > epsilon$1) p1 *= cw ? 1 : -1, a01 += p1, a11 -= p1;else da1 = 0, a01 = a11 = (a0 + a1) / 2;
          }

          var x01 = r1 * cos(a01),
              y01 = r1 * sin(a01),
              x10 = r0 * cos(a10),
              y10 = r0 * sin(a10);

          // Apply rounded corners?
          if (rc > epsilon$1) {
            var x11 = r1 * cos(a11),
                y11 = r1 * sin(a11),
                x00 = r0 * cos(a00),
                y00 = r0 * sin(a00);

            // Restrict the corner radius according to the sector angle.
            if (da < pi$2) {
              var oc = da0 > epsilon$1 ? intersect(x01, y01, x00, y00, x11, y11, x10, y10) : [x10, y10],
                  ax = x01 - oc[0],
                  ay = y01 - oc[1],
                  bx = x11 - oc[0],
                  by = y11 - oc[1],
                  kc = 1 / sin(acos((ax * bx + ay * by) / (sqrt$1(ax * ax + ay * ay) * sqrt$1(bx * bx + by * by))) / 2),
                  lc = sqrt$1(oc[0] * oc[0] + oc[1] * oc[1]);
              rc0 = min$2(rc, (r0 - lc) / (kc - 1));
              rc1 = min$2(rc, (r1 - lc) / (kc + 1));
            }
          }

          // Is the sector collapsed to a line?
          if (!(da1 > epsilon$1)) context.moveTo(x01, y01);

          // Does the sector’s outer ring have rounded corners?
          else if (rc1 > epsilon$1) {
              t0 = cornerTangents(x00, y00, x01, y01, r1, rc1, cw);
              t1 = cornerTangents(x11, y11, x10, y10, r1, rc1, cw);

              context.moveTo(t0.cx + t0.x01, t0.cy + t0.y01);

              // Have the corners merged?
              if (rc1 < rc) context.arc(t0.cx, t0.cy, rc1, atan2(t0.y01, t0.x01), atan2(t1.y01, t1.x01), !cw);

              // Otherwise, draw the two corners and the ring.
              else {
                  context.arc(t0.cx, t0.cy, rc1, atan2(t0.y01, t0.x01), atan2(t0.y11, t0.x11), !cw);
                  context.arc(0, 0, r1, atan2(t0.cy + t0.y11, t0.cx + t0.x11), atan2(t1.cy + t1.y11, t1.cx + t1.x11), !cw);
                  context.arc(t1.cx, t1.cy, rc1, atan2(t1.y11, t1.x11), atan2(t1.y01, t1.x01), !cw);
                }
            }

            // Or is the outer ring just a circular arc?
            else context.moveTo(x01, y01), context.arc(0, 0, r1, a01, a11, !cw);

          // Is there no inner ring, and it’s a circular sector?
          // Or perhaps it’s an annular sector collapsed due to padding?
          if (!(r0 > epsilon$1) || !(da0 > epsilon$1)) context.lineTo(x10, y10);

          // Does the sector’s inner ring (or point) have rounded corners?
          else if (rc0 > epsilon$1) {
              t0 = cornerTangents(x10, y10, x11, y11, r0, -rc0, cw);
              t1 = cornerTangents(x01, y01, x00, y00, r0, -rc0, cw);

              context.lineTo(t0.cx + t0.x01, t0.cy + t0.y01);

              // Have the corners merged?
              if (rc0 < rc) context.arc(t0.cx, t0.cy, rc0, atan2(t0.y01, t0.x01), atan2(t1.y01, t1.x01), !cw);

              // Otherwise, draw the two corners and the ring.
              else {
                  context.arc(t0.cx, t0.cy, rc0, atan2(t0.y01, t0.x01), atan2(t0.y11, t0.x11), !cw);
                  context.arc(0, 0, r0, atan2(t0.cy + t0.y11, t0.cx + t0.x11), atan2(t1.cy + t1.y11, t1.cx + t1.x11), cw);
                  context.arc(t1.cx, t1.cy, rc0, atan2(t1.y11, t1.x11), atan2(t1.y01, t1.x01), !cw);
                }
            }

            // Or is the inner ring just a circular arc?
            else context.arc(0, 0, r0, a10, a00, cw);
        }

    context.closePath();

    if (buffer) return context = null, buffer + "" || null;
  }

  arc.centroid = function () {
    var r = (+innerRadius.apply(this, arguments) + +outerRadius.apply(this, arguments)) / 2,
        a = (+startAngle.apply(this, arguments) + +endAngle.apply(this, arguments)) / 2 - pi$2 / 2;
    return [cos(a) * r, sin(a) * r];
  };

  arc.innerRadius = function (_) {
    return arguments.length ? (innerRadius = typeof _ === "function" ? _ : constant$5(+_), arc) : innerRadius;
  };

  arc.outerRadius = function (_) {
    return arguments.length ? (outerRadius = typeof _ === "function" ? _ : constant$5(+_), arc) : outerRadius;
  };

  arc.cornerRadius = function (_) {
    return arguments.length ? (cornerRadius = typeof _ === "function" ? _ : constant$5(+_), arc) : cornerRadius;
  };

  arc.padRadius = function (_) {
    return arguments.length ? (padRadius = _ == null ? null : typeof _ === "function" ? _ : constant$5(+_), arc) : padRadius;
  };

  arc.startAngle = function (_) {
    return arguments.length ? (startAngle = typeof _ === "function" ? _ : constant$5(+_), arc) : startAngle;
  };

  arc.endAngle = function (_) {
    return arguments.length ? (endAngle = typeof _ === "function" ? _ : constant$5(+_), arc) : endAngle;
  };

  arc.padAngle = function (_) {
    return arguments.length ? (padAngle = typeof _ === "function" ? _ : constant$5(+_), arc) : padAngle;
  };

  arc.context = function (_) {
    return arguments.length ? (context = _ == null ? null : _, arc) : context;
  };

  return arc;
};

function Linear(context) {
  this._context = context;
}

Linear.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function point(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0:
        this._point = 1;this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);break;
      case 1:
        this._point = 2; // proceed
      default:
        this._context.lineTo(x, y);break;
    }
  }
};

var curveLinear = function (context) {
  return new Linear(context);
};

function x(p) {
  return p[0];
}

function y(p) {
  return p[1];
}

var line = function () {
  var x$$1 = x,
      y$$1 = y,
      defined = constant$5(true),
      context = null,
      curve = curveLinear,
      output = null;

  function line(data) {
    var i,
        n = data.length,
        d,
        defined0 = false,
        buffer;

    if (context == null) output = curve(buffer = path());

    for (i = 0; i <= n; ++i) {
      if (!(i < n && defined(d = data[i], i, data)) === defined0) {
        if (defined0 = !defined0) output.lineStart();else output.lineEnd();
      }
      if (defined0) output.point(+x$$1(d, i, data), +y$$1(d, i, data));
    }

    if (buffer) return output = null, buffer + "" || null;
  }

  line.x = function (_) {
    return arguments.length ? (x$$1 = typeof _ === "function" ? _ : constant$5(+_), line) : x$$1;
  };

  line.y = function (_) {
    return arguments.length ? (y$$1 = typeof _ === "function" ? _ : constant$5(+_), line) : y$$1;
  };

  line.defined = function (_) {
    return arguments.length ? (defined = typeof _ === "function" ? _ : constant$5(!!_), line) : defined;
  };

  line.curve = function (_) {
    return arguments.length ? (curve = _, context != null && (output = curve(context)), line) : curve;
  };

  line.context = function (_) {
    return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), line) : context;
  };

  return line;
};

var area = function () {
  var x0 = x,
      x1 = null,
      y0 = constant$5(0),
      y1 = y,
      defined = constant$5(true),
      context = null,
      curve = curveLinear,
      output = null;

  function area(data) {
    var i,
        j,
        k,
        n = data.length,
        d,
        defined0 = false,
        buffer,
        x0z = new Array(n),
        y0z = new Array(n);

    if (context == null) output = curve(buffer = path());

    for (i = 0; i <= n; ++i) {
      if (!(i < n && defined(d = data[i], i, data)) === defined0) {
        if (defined0 = !defined0) {
          j = i;
          output.areaStart();
          output.lineStart();
        } else {
          output.lineEnd();
          output.lineStart();
          for (k = i - 1; k >= j; --k) {
            output.point(x0z[k], y0z[k]);
          }
          output.lineEnd();
          output.areaEnd();
        }
      }
      if (defined0) {
        x0z[i] = +x0(d, i, data), y0z[i] = +y0(d, i, data);
        output.point(x1 ? +x1(d, i, data) : x0z[i], y1 ? +y1(d, i, data) : y0z[i]);
      }
    }

    if (buffer) return output = null, buffer + "" || null;
  }

  function arealine() {
    return line().defined(defined).curve(curve).context(context);
  }

  area.x = function (_) {
    return arguments.length ? (x0 = typeof _ === "function" ? _ : constant$5(+_), x1 = null, area) : x0;
  };

  area.x0 = function (_) {
    return arguments.length ? (x0 = typeof _ === "function" ? _ : constant$5(+_), area) : x0;
  };

  area.x1 = function (_) {
    return arguments.length ? (x1 = _ == null ? null : typeof _ === "function" ? _ : constant$5(+_), area) : x1;
  };

  area.y = function (_) {
    return arguments.length ? (y0 = typeof _ === "function" ? _ : constant$5(+_), y1 = null, area) : y0;
  };

  area.y0 = function (_) {
    return arguments.length ? (y0 = typeof _ === "function" ? _ : constant$5(+_), area) : y0;
  };

  area.y1 = function (_) {
    return arguments.length ? (y1 = _ == null ? null : typeof _ === "function" ? _ : constant$5(+_), area) : y1;
  };

  area.lineX0 = area.lineY0 = function () {
    return arealine().x(x0).y(y0);
  };

  area.lineY1 = function () {
    return arealine().x(x0).y(y1);
  };

  area.lineX1 = function () {
    return arealine().x(x1).y(y0);
  };

  area.defined = function (_) {
    return arguments.length ? (defined = typeof _ === "function" ? _ : constant$5(!!_), area) : defined;
  };

  area.curve = function (_) {
    return arguments.length ? (curve = _, context != null && (output = curve(context)), area) : curve;
  };

  area.context = function (_) {
    return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), area) : context;
  };

  return area;
};

var descending$1 = function (a, b) {
  return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
};

var identity$6 = function (d) {
  return d;
};

var pie = function () {
  var value = identity$6,
      sortValues = descending$1,
      sort = null,
      startAngle = constant$5(0),
      endAngle = constant$5(tau$2),
      padAngle = constant$5(0);

  function pie(data) {
    var i,
        n = data.length,
        j,
        k,
        sum = 0,
        index = new Array(n),
        arcs = new Array(n),
        a0 = +startAngle.apply(this, arguments),
        da = Math.min(tau$2, Math.max(-tau$2, endAngle.apply(this, arguments) - a0)),
        a1,
        p = Math.min(Math.abs(da) / n, padAngle.apply(this, arguments)),
        pa = p * (da < 0 ? -1 : 1),
        v;

    for (i = 0; i < n; ++i) {
      if ((v = arcs[index[i] = i] = +value(data[i], i, data)) > 0) {
        sum += v;
      }
    }

    // Optionally sort the arcs by previously-computed values or by data.
    if (sortValues != null) index.sort(function (i, j) {
      return sortValues(arcs[i], arcs[j]);
    });else if (sort != null) index.sort(function (i, j) {
      return sort(data[i], data[j]);
    });

    // Compute the arcs! They are stored in the original data's order.
    for (i = 0, k = sum ? (da - n * pa) / sum : 0; i < n; ++i, a0 = a1) {
      j = index[i], v = arcs[j], a1 = a0 + (v > 0 ? v * k : 0) + pa, arcs[j] = {
        data: data[j],
        index: i,
        value: v,
        startAngle: a0,
        endAngle: a1,
        padAngle: p
      };
    }

    return arcs;
  }

  pie.value = function (_) {
    return arguments.length ? (value = typeof _ === "function" ? _ : constant$5(+_), pie) : value;
  };

  pie.sortValues = function (_) {
    return arguments.length ? (sortValues = _, sort = null, pie) : sortValues;
  };

  pie.sort = function (_) {
    return arguments.length ? (sort = _, sortValues = null, pie) : sort;
  };

  pie.startAngle = function (_) {
    return arguments.length ? (startAngle = typeof _ === "function" ? _ : constant$5(+_), pie) : startAngle;
  };

  pie.endAngle = function (_) {
    return arguments.length ? (endAngle = typeof _ === "function" ? _ : constant$5(+_), pie) : endAngle;
  };

  pie.padAngle = function (_) {
    return arguments.length ? (padAngle = typeof _ === "function" ? _ : constant$5(+_), pie) : padAngle;
  };

  return pie;
};

var curveRadialLinear = curveRadial(curveLinear);

function Radial(curve) {
  this._curve = curve;
}

Radial.prototype = {
  areaStart: function areaStart() {
    this._curve.areaStart();
  },
  areaEnd: function areaEnd() {
    this._curve.areaEnd();
  },
  lineStart: function lineStart() {
    this._curve.lineStart();
  },
  lineEnd: function lineEnd() {
    this._curve.lineEnd();
  },
  point: function point(a, r) {
    this._curve.point(r * Math.sin(a), r * -Math.cos(a));
  }
};

function curveRadial(curve) {

  function radial(context) {
    return new Radial(curve(context));
  }

  radial._curve = curve;

  return radial;
}

function lineRadial(l) {
  var c = l.curve;

  l.angle = l.x, delete l.x;
  l.radius = l.y, delete l.y;

  l.curve = function (_) {
    return arguments.length ? c(curveRadial(_)) : c()._curve;
  };

  return l;
}

var radialLine = function () {
  return lineRadial(line().curve(curveRadialLinear));
};

var radialArea = function () {
  var a = area().curve(curveRadialLinear),
      c = a.curve,
      x0 = a.lineX0,
      x1 = a.lineX1,
      y0 = a.lineY0,
      y1 = a.lineY1;

  a.angle = a.x, delete a.x;
  a.startAngle = a.x0, delete a.x0;
  a.endAngle = a.x1, delete a.x1;
  a.radius = a.y, delete a.y;
  a.innerRadius = a.y0, delete a.y0;
  a.outerRadius = a.y1, delete a.y1;
  a.lineStartAngle = function () {
    return lineRadial(x0());
  }, delete a.lineX0;
  a.lineEndAngle = function () {
    return lineRadial(x1());
  }, delete a.lineX1;
  a.lineInnerRadius = function () {
    return lineRadial(y0());
  }, delete a.lineY0;
  a.lineOuterRadius = function () {
    return lineRadial(y1());
  }, delete a.lineY1;

  a.curve = function (_) {
    return arguments.length ? c(curveRadial(_)) : c()._curve;
  };

  return a;
};

var slice$2 = Array.prototype.slice;

var noop$2 = function () {};

function _point(that, x, y) {
  that._context.bezierCurveTo((2 * that._x0 + that._x1) / 3, (2 * that._y0 + that._y1) / 3, (that._x0 + 2 * that._x1) / 3, (that._y0 + 2 * that._y1) / 3, (that._x0 + 4 * that._x1 + x) / 6, (that._y0 + 4 * that._y1 + y) / 6);
}

function Basis(context) {
  this._context = context;
}

Basis.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._y0 = this._y1 = NaN;
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    switch (this._point) {
      case 3:
        _point(this, this._x1, this._y1); // proceed
      case 2:
        this._context.lineTo(this._x1, this._y1);break;
    }
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function point(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0:
        this._point = 1;this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);break;
      case 1:
        this._point = 2;break;
      case 2:
        this._point = 3;this._context.lineTo((5 * this._x0 + this._x1) / 6, (5 * this._y0 + this._y1) / 6); // proceed
      default:
        _point(this, x, y);break;
    }
    this._x0 = this._x1, this._x1 = x;
    this._y0 = this._y1, this._y1 = y;
  }
};

var curveBasis = function (context) {
  return new Basis(context);
};

function BasisClosed(context) {
  this._context = context;
}

BasisClosed.prototype = {
  areaStart: noop$2,
  areaEnd: noop$2,
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = NaN;
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    switch (this._point) {
      case 1:
        {
          this._context.moveTo(this._x2, this._y2);
          this._context.closePath();
          break;
        }
      case 2:
        {
          this._context.moveTo((this._x2 + 2 * this._x3) / 3, (this._y2 + 2 * this._y3) / 3);
          this._context.lineTo((this._x3 + 2 * this._x2) / 3, (this._y3 + 2 * this._y2) / 3);
          this._context.closePath();
          break;
        }
      case 3:
        {
          this.point(this._x2, this._y2);
          this.point(this._x3, this._y3);
          this.point(this._x4, this._y4);
          break;
        }
    }
  },
  point: function point(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0:
        this._point = 1;this._x2 = x, this._y2 = y;break;
      case 1:
        this._point = 2;this._x3 = x, this._y3 = y;break;
      case 2:
        this._point = 3;this._x4 = x, this._y4 = y;this._context.moveTo((this._x0 + 4 * this._x1 + x) / 6, (this._y0 + 4 * this._y1 + y) / 6);break;
      default:
        _point(this, x, y);break;
    }
    this._x0 = this._x1, this._x1 = x;
    this._y0 = this._y1, this._y1 = y;
  }
};

var curveBasisClosed = function (context) {
  return new BasisClosed(context);
};

function BasisOpen(context) {
  this._context = context;
}

BasisOpen.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._y0 = this._y1 = NaN;
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    if (this._line || this._line !== 0 && this._point === 3) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function point(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0:
        this._point = 1;break;
      case 1:
        this._point = 2;break;
      case 2:
        this._point = 3;var x0 = (this._x0 + 4 * this._x1 + x) / 6,
            y0 = (this._y0 + 4 * this._y1 + y) / 6;this._line ? this._context.lineTo(x0, y0) : this._context.moveTo(x0, y0);break;
      case 3:
        this._point = 4; // proceed
      default:
        _point(this, x, y);break;
    }
    this._x0 = this._x1, this._x1 = x;
    this._y0 = this._y1, this._y1 = y;
  }
};

var curveBasisOpen = function (context) {
  return new BasisOpen(context);
};

function Bundle(context, beta) {
  this._basis = new Basis(context);
  this._beta = beta;
}

Bundle.prototype = {
  lineStart: function lineStart() {
    this._x = [];
    this._y = [];
    this._basis.lineStart();
  },
  lineEnd: function lineEnd() {
    var x = this._x,
        y = this._y,
        j = x.length - 1;

    if (j > 0) {
      var x0 = x[0],
          y0 = y[0],
          dx = x[j] - x0,
          dy = y[j] - y0,
          i = -1,
          t;

      while (++i <= j) {
        t = i / j;
        this._basis.point(this._beta * x[i] + (1 - this._beta) * (x0 + t * dx), this._beta * y[i] + (1 - this._beta) * (y0 + t * dy));
      }
    }

    this._x = this._y = null;
    this._basis.lineEnd();
  },
  point: function point(x, y) {
    this._x.push(+x);
    this._y.push(+y);
  }
};

var curveBundle = (function custom(beta) {

  function bundle(context) {
    return beta === 1 ? new Basis(context) : new Bundle(context, beta);
  }

  bundle.beta = function (beta) {
    return custom(+beta);
  };

  return bundle;
})(0.85);

function _point$1(that, x, y) {
  that._context.bezierCurveTo(that._x1 + that._k * (that._x2 - that._x0), that._y1 + that._k * (that._y2 - that._y0), that._x2 + that._k * (that._x1 - x), that._y2 + that._k * (that._y1 - y), that._x2, that._y2);
}

function Cardinal(context, tension) {
  this._context = context;
  this._k = (1 - tension) / 6;
}

Cardinal.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    switch (this._point) {
      case 2:
        this._context.lineTo(this._x2, this._y2);break;
      case 3:
        _point$1(this, this._x1, this._y1);break;
    }
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function point(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0:
        this._point = 1;this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);break;
      case 1:
        this._point = 2;this._x1 = x, this._y1 = y;break;
      case 2:
        this._point = 3; // proceed
      default:
        _point$1(this, x, y);break;
    }
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};

var curveCardinal = (function custom(tension) {

  function cardinal(context) {
    return new Cardinal(context, tension);
  }

  cardinal.tension = function (tension) {
    return custom(+tension);
  };

  return cardinal;
})(0);

function CardinalClosed(context, tension) {
  this._context = context;
  this._k = (1 - tension) / 6;
}

CardinalClosed.prototype = {
  areaStart: noop$2,
  areaEnd: noop$2,
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._x5 = this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = this._y5 = NaN;
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    switch (this._point) {
      case 1:
        {
          this._context.moveTo(this._x3, this._y3);
          this._context.closePath();
          break;
        }
      case 2:
        {
          this._context.lineTo(this._x3, this._y3);
          this._context.closePath();
          break;
        }
      case 3:
        {
          this.point(this._x3, this._y3);
          this.point(this._x4, this._y4);
          this.point(this._x5, this._y5);
          break;
        }
    }
  },
  point: function point(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0:
        this._point = 1;this._x3 = x, this._y3 = y;break;
      case 1:
        this._point = 2;this._context.moveTo(this._x4 = x, this._y4 = y);break;
      case 2:
        this._point = 3;this._x5 = x, this._y5 = y;break;
      default:
        _point$1(this, x, y);break;
    }
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};

var curveCardinalClosed = (function custom(tension) {

  function cardinal(context) {
    return new CardinalClosed(context, tension);
  }

  cardinal.tension = function (tension) {
    return custom(+tension);
  };

  return cardinal;
})(0);

function CardinalOpen(context, tension) {
  this._context = context;
  this._k = (1 - tension) / 6;
}

CardinalOpen.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    if (this._line || this._line !== 0 && this._point === 3) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function point(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0:
        this._point = 1;break;
      case 1:
        this._point = 2;break;
      case 2:
        this._point = 3;this._line ? this._context.lineTo(this._x2, this._y2) : this._context.moveTo(this._x2, this._y2);break;
      case 3:
        this._point = 4; // proceed
      default:
        _point$1(this, x, y);break;
    }
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};

var curveCardinalOpen = (function custom(tension) {

  function cardinal(context) {
    return new CardinalOpen(context, tension);
  }

  cardinal.tension = function (tension) {
    return custom(+tension);
  };

  return cardinal;
})(0);

function _point$2(that, x, y) {
  var x1 = that._x1,
      y1 = that._y1,
      x2 = that._x2,
      y2 = that._y2;

  if (that._l01_a > epsilon$1) {
    var a = 2 * that._l01_2a + 3 * that._l01_a * that._l12_a + that._l12_2a,
        n = 3 * that._l01_a * (that._l01_a + that._l12_a);
    x1 = (x1 * a - that._x0 * that._l12_2a + that._x2 * that._l01_2a) / n;
    y1 = (y1 * a - that._y0 * that._l12_2a + that._y2 * that._l01_2a) / n;
  }

  if (that._l23_a > epsilon$1) {
    var b = 2 * that._l23_2a + 3 * that._l23_a * that._l12_a + that._l12_2a,
        m = 3 * that._l23_a * (that._l23_a + that._l12_a);
    x2 = (x2 * b + that._x1 * that._l23_2a - x * that._l12_2a) / m;
    y2 = (y2 * b + that._y1 * that._l23_2a - y * that._l12_2a) / m;
  }

  that._context.bezierCurveTo(x1, y1, x2, y2, that._x2, that._y2);
}

function CatmullRom(context, alpha) {
  this._context = context;
  this._alpha = alpha;
}

CatmullRom.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
    this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0;
  },
  lineEnd: function lineEnd() {
    switch (this._point) {
      case 2:
        this._context.lineTo(this._x2, this._y2);break;
      case 3:
        this.point(this._x2, this._y2);break;
    }
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function point(x, y) {
    x = +x, y = +y;

    if (this._point) {
      var x23 = this._x2 - x,
          y23 = this._y2 - y;
      this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
    }

    switch (this._point) {
      case 0:
        this._point = 1;this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);break;
      case 1:
        this._point = 2;break;
      case 2:
        this._point = 3; // proceed
      default:
        _point$2(this, x, y);break;
    }

    this._l01_a = this._l12_a, this._l12_a = this._l23_a;
    this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};

var curveCatmullRom = (function custom(alpha) {

  function catmullRom(context) {
    return alpha ? new CatmullRom(context, alpha) : new Cardinal(context, 0);
  }

  catmullRom.alpha = function (alpha) {
    return custom(+alpha);
  };

  return catmullRom;
})(0.5);

function CatmullRomClosed(context, alpha) {
  this._context = context;
  this._alpha = alpha;
}

CatmullRomClosed.prototype = {
  areaStart: noop$2,
  areaEnd: noop$2,
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._x5 = this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = this._y5 = NaN;
    this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0;
  },
  lineEnd: function lineEnd() {
    switch (this._point) {
      case 1:
        {
          this._context.moveTo(this._x3, this._y3);
          this._context.closePath();
          break;
        }
      case 2:
        {
          this._context.lineTo(this._x3, this._y3);
          this._context.closePath();
          break;
        }
      case 3:
        {
          this.point(this._x3, this._y3);
          this.point(this._x4, this._y4);
          this.point(this._x5, this._y5);
          break;
        }
    }
  },
  point: function point(x, y) {
    x = +x, y = +y;

    if (this._point) {
      var x23 = this._x2 - x,
          y23 = this._y2 - y;
      this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
    }

    switch (this._point) {
      case 0:
        this._point = 1;this._x3 = x, this._y3 = y;break;
      case 1:
        this._point = 2;this._context.moveTo(this._x4 = x, this._y4 = y);break;
      case 2:
        this._point = 3;this._x5 = x, this._y5 = y;break;
      default:
        _point$2(this, x, y);break;
    }

    this._l01_a = this._l12_a, this._l12_a = this._l23_a;
    this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};

var curveCatmullRomClosed = (function custom(alpha) {

  function catmullRom(context) {
    return alpha ? new CatmullRomClosed(context, alpha) : new CardinalClosed(context, 0);
  }

  catmullRom.alpha = function (alpha) {
    return custom(+alpha);
  };

  return catmullRom;
})(0.5);

function CatmullRomOpen(context, alpha) {
  this._context = context;
  this._alpha = alpha;
}

CatmullRomOpen.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
    this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0;
  },
  lineEnd: function lineEnd() {
    if (this._line || this._line !== 0 && this._point === 3) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function point(x, y) {
    x = +x, y = +y;

    if (this._point) {
      var x23 = this._x2 - x,
          y23 = this._y2 - y;
      this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
    }

    switch (this._point) {
      case 0:
        this._point = 1;break;
      case 1:
        this._point = 2;break;
      case 2:
        this._point = 3;this._line ? this._context.lineTo(this._x2, this._y2) : this._context.moveTo(this._x2, this._y2);break;
      case 3:
        this._point = 4; // proceed
      default:
        _point$2(this, x, y);break;
    }

    this._l01_a = this._l12_a, this._l12_a = this._l23_a;
    this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};

var curveCatmullRomOpen = (function custom(alpha) {

  function catmullRom(context) {
    return alpha ? new CatmullRomOpen(context, alpha) : new CardinalOpen(context, 0);
  }

  catmullRom.alpha = function (alpha) {
    return custom(+alpha);
  };

  return catmullRom;
})(0.5);

function LinearClosed(context) {
  this._context = context;
}

LinearClosed.prototype = {
  areaStart: noop$2,
  areaEnd: noop$2,
  lineStart: function lineStart() {
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    if (this._point) this._context.closePath();
  },
  point: function point(x, y) {
    x = +x, y = +y;
    if (this._point) this._context.lineTo(x, y);else this._point = 1, this._context.moveTo(x, y);
  }
};

var curveLinearClosed = function (context) {
  return new LinearClosed(context);
};

function sign(x) {
  return x < 0 ? -1 : 1;
}

// Calculate the slopes of the tangents (Hermite-type interpolation) based on
// the following paper: Steffen, M. 1990. A Simple Method for Monotonic
// Interpolation in One Dimension. Astronomy and Astrophysics, Vol. 239, NO.
// NOV(II), P. 443, 1990.
function slope3(that, x2, y2) {
  var h0 = that._x1 - that._x0,
      h1 = x2 - that._x1,
      s0 = (that._y1 - that._y0) / (h0 || h1 < 0 && -0),
      s1 = (y2 - that._y1) / (h1 || h0 < 0 && -0),
      p = (s0 * h1 + s1 * h0) / (h0 + h1);
  return (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0;
}

// Calculate a one-sided slope.
function slope2(that, t) {
  var h = that._x1 - that._x0;
  return h ? (3 * (that._y1 - that._y0) / h - t) / 2 : t;
}

// According to https://en.wikipedia.org/wiki/Cubic_Hermite_spline#Representations
// "you can express cubic Hermite interpolation in terms of cubic Bézier curves
// with respect to the four values p0, p0 + m0 / 3, p1 - m1 / 3, p1".
function _point$3(that, t0, t1) {
  var x0 = that._x0,
      y0 = that._y0,
      x1 = that._x1,
      y1 = that._y1,
      dx = (x1 - x0) / 3;
  that._context.bezierCurveTo(x0 + dx, y0 + dx * t0, x1 - dx, y1 - dx * t1, x1, y1);
}

function MonotoneX(context) {
  this._context = context;
}

MonotoneX.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._y0 = this._y1 = this._t0 = NaN;
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    switch (this._point) {
      case 2:
        this._context.lineTo(this._x1, this._y1);break;
      case 3:
        _point$3(this, this._t0, slope2(this, this._t0));break;
    }
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function point(x, y) {
    var t1 = NaN;

    x = +x, y = +y;
    if (x === this._x1 && y === this._y1) return; // Ignore coincident points.
    switch (this._point) {
      case 0:
        this._point = 1;this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);break;
      case 1:
        this._point = 2;break;
      case 2:
        this._point = 3;_point$3(this, slope2(this, t1 = slope3(this, x, y)), t1);break;
      default:
        _point$3(this, this._t0, t1 = slope3(this, x, y));break;
    }

    this._x0 = this._x1, this._x1 = x;
    this._y0 = this._y1, this._y1 = y;
    this._t0 = t1;
  }
};

function MonotoneY(context) {
  this._context = new ReflectContext(context);
}

(MonotoneY.prototype = Object.create(MonotoneX.prototype)).point = function (x, y) {
  MonotoneX.prototype.point.call(this, y, x);
};

function ReflectContext(context) {
  this._context = context;
}

ReflectContext.prototype = {
  moveTo: function moveTo(x, y) {
    this._context.moveTo(y, x);
  },
  closePath: function closePath() {
    this._context.closePath();
  },
  lineTo: function lineTo(x, y) {
    this._context.lineTo(y, x);
  },
  bezierCurveTo: function bezierCurveTo(x1, y1, x2, y2, x, y) {
    this._context.bezierCurveTo(y1, x1, y2, x2, y, x);
  }
};

function monotoneX(context) {
  return new MonotoneX(context);
}

function monotoneY(context) {
  return new MonotoneY(context);
}

function Natural(context) {
  this._context = context;
}

Natural.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._x = [];
    this._y = [];
  },
  lineEnd: function lineEnd() {
    var x = this._x,
        y = this._y,
        n = x.length;

    if (n) {
      this._line ? this._context.lineTo(x[0], y[0]) : this._context.moveTo(x[0], y[0]);
      if (n === 2) {
        this._context.lineTo(x[1], y[1]);
      } else {
        var px = controlPoints(x),
            py = controlPoints(y);
        for (var i0 = 0, i1 = 1; i1 < n; ++i0, ++i1) {
          this._context.bezierCurveTo(px[0][i0], py[0][i0], px[1][i0], py[1][i0], x[i1], y[i1]);
        }
      }
    }

    if (this._line || this._line !== 0 && n === 1) this._context.closePath();
    this._line = 1 - this._line;
    this._x = this._y = null;
  },
  point: function point(x, y) {
    this._x.push(+x);
    this._y.push(+y);
  }
};

// See https://www.particleincell.com/2012/bezier-splines/ for derivation.
function controlPoints(x) {
  var i,
      n = x.length - 1,
      m,
      a = new Array(n),
      b = new Array(n),
      r = new Array(n);
  a[0] = 0, b[0] = 2, r[0] = x[0] + 2 * x[1];
  for (i = 1; i < n - 1; ++i) {
    a[i] = 1, b[i] = 4, r[i] = 4 * x[i] + 2 * x[i + 1];
  }a[n - 1] = 2, b[n - 1] = 7, r[n - 1] = 8 * x[n - 1] + x[n];
  for (i = 1; i < n; ++i) {
    m = a[i] / b[i - 1], b[i] -= m, r[i] -= m * r[i - 1];
  }a[n - 1] = r[n - 1] / b[n - 1];
  for (i = n - 2; i >= 0; --i) {
    a[i] = (r[i] - a[i + 1]) / b[i];
  }b[n - 1] = (x[n] + a[n - 1]) / 2;
  for (i = 0; i < n - 1; ++i) {
    b[i] = 2 * x[i + 1] - a[i + 1];
  }return [a, b];
}

var curveNatural = function (context) {
  return new Natural(context);
};

function Step(context, t) {
  this._context = context;
  this._t = t;
}

Step.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._x = this._y = NaN;
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    if (0 < this._t && this._t < 1 && this._point === 2) this._context.lineTo(this._x, this._y);
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    if (this._line >= 0) this._t = 1 - this._t, this._line = 1 - this._line;
  },
  point: function point(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0:
        this._point = 1;this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);break;
      case 1:
        this._point = 2; // proceed
      default:
        {
          if (this._t <= 0) {
            this._context.lineTo(this._x, y);
            this._context.lineTo(x, y);
          } else {
            var x1 = this._x * (1 - this._t) + x * this._t;
            this._context.lineTo(x1, this._y);
            this._context.lineTo(x1, y);
          }
          break;
        }
    }
    this._x = x, this._y = y;
  }
};

var curveStep = function (context) {
  return new Step(context, 0.5);
};

function stepBefore(context) {
  return new Step(context, 0);
}

function stepAfter(context) {
  return new Step(context, 1);
}

var none$1 = function (series, order) {
  if (!((n = series.length) > 1)) return;
  for (var i = 1, j, s0, s1 = series[order[0]], n, m = s1.length; i < n; ++i) {
    s0 = s1, s1 = series[order[i]];
    for (j = 0; j < m; ++j) {
      s1[j][1] += s1[j][0] = isNaN(s0[j][1]) ? s0[j][0] : s0[j][1];
    }
  }
};

var none$2 = function (series) {
  var n = series.length,
      o = new Array(n);
  while (--n >= 0) {
    o[n] = n;
  }return o;
};

function stackValue(d, key) {
  return d[key];
}

var stack = function () {
  var keys = constant$5([]),
      order = none$2,
      offset = none$1,
      value = stackValue;

  function stack(data) {
    var kz = keys.apply(this, arguments),
        i,
        m = data.length,
        n = kz.length,
        sz = new Array(n),
        oz;

    for (i = 0; i < n; ++i) {
      for (var ki = kz[i], si = sz[i] = new Array(m), j = 0, sij; j < m; ++j) {
        si[j] = sij = [0, +value(data[j], ki, j, data)];
        sij.data = data[j];
      }
      si.key = ki;
    }

    for (i = 0, oz = order(sz); i < n; ++i) {
      sz[oz[i]].index = i;
    }

    offset(sz, oz);
    return sz;
  }

  stack.keys = function (_) {
    return arguments.length ? (keys = typeof _ === "function" ? _ : constant$5(slice$2.call(_)), stack) : keys;
  };

  stack.value = function (_) {
    return arguments.length ? (value = typeof _ === "function" ? _ : constant$5(+_), stack) : value;
  };

  stack.order = function (_) {
    return arguments.length ? (order = _ == null ? none$2 : typeof _ === "function" ? _ : constant$5(slice$2.call(_)), stack) : order;
  };

  stack.offset = function (_) {
    return arguments.length ? (offset = _ == null ? none$1 : _, stack) : offset;
  };

  return stack;
};

var stackOffsetExpand = function (series, order) {
  if (!((n = series.length) > 0)) return;
  for (var i, n, j = 0, m = series[0].length, y; j < m; ++j) {
    for (y = i = 0; i < n; ++i) {
      y += series[i][j][1] || 0;
    }if (y) for (i = 0; i < n; ++i) {
      series[i][j][1] /= y;
    }
  }
  none$1(series, order);
};

var stackOffsetSilhouette = function (series, order) {
  if (!((n = series.length) > 0)) return;
  for (var j = 0, s0 = series[order[0]], n, m = s0.length; j < m; ++j) {
    for (var i = 0, y = 0; i < n; ++i) {
      y += series[i][j][1] || 0;
    }s0[j][1] += s0[j][0] = -y / 2;
  }
  none$1(series, order);
};

var stackOffsetWiggle = function (series, order) {
  if (!((n = series.length) > 0) || !((m = (s0 = series[order[0]]).length) > 0)) return;
  for (var y = 0, j = 1, s0, m, n; j < m; ++j) {
    for (var i = 0, s1 = 0, s2 = 0; i < n; ++i) {
      var si = series[order[i]],
          sij0 = si[j][1] || 0,
          sij1 = si[j - 1][1] || 0,
          s3 = (sij0 - sij1) / 2;
      for (var k = 0; k < i; ++k) {
        var sk = series[order[k]],
            skj0 = sk[j][1] || 0,
            skj1 = sk[j - 1][1] || 0;
        s3 += skj0 - skj1;
      }
      s1 += sij0, s2 += s3 * sij0;
    }
    s0[j - 1][1] += s0[j - 1][0] = y;
    if (s1) y -= s2 / s1;
  }
  s0[j - 1][1] += s0[j - 1][0] = y;
  none$1(series, order);
};

var ascending$2 = function (series) {
  var sums = series.map(sum$1);
  return none$2(series).sort(function (a, b) {
    return sums[a] - sums[b];
  });
};

function sum$1(series) {
  var s = 0,
      i = -1,
      n = series.length,
      v;
  while (++i < n) {
    if (v = +series[i][1]) s += v;
  }return s;
}

var stackOrderDescending = function (series) {
  return ascending$2(series).reverse();
};

var stackOrderInsideOut = function (series) {
  var n = series.length,
      i,
      j,
      sums = series.map(sum$1),
      order = none$2(series).sort(function (a, b) {
    return sums[b] - sums[a];
  }),
      top = 0,
      bottom = 0,
      tops = [],
      bottoms = [];

  for (i = 0; i < n; ++i) {
    j = order[i];
    if (top < bottom) {
      top += sums[j];
      tops.push(j);
    } else {
      bottom += sums[j];
      bottoms.push(j);
    }
  }

  return bottoms.reverse().concat(tops);
};

var slice$3 = Array.prototype.slice;

var identity$7 = function (x) {
  return x;
};

var top = 1;
var right = 2;
var bottom = 3;
var left = 4;
var epsilon$2 = 1e-6;

function translateX(x) {
  return "translate(" + (x + 0.5) + ",0)";
}

function translateY(y) {
  return "translate(0," + (y + 0.5) + ")";
}

function number$3(scale) {
  return function (d) {
    return +scale(d);
  };
}

function center(scale) {
  var offset = Math.max(0, scale.bandwidth() - 1) / 2; // Adjust for 0.5px offset.
  if (scale.round()) offset = Math.round(offset);
  return function (d) {
    return +scale(d) + offset;
  };
}

function entering() {
  return !this.__axis;
}

function axis(orient, scale) {
  var tickArguments = [],
      tickValues = null,
      tickFormat = null,
      tickSizeInner = 6,
      tickSizeOuter = 6,
      tickPadding = 3,
      k = orient === top || orient === left ? -1 : 1,
      x = orient === left || orient === right ? "x" : "y",
      transform = orient === top || orient === bottom ? translateX : translateY;

  function axis(context) {
    var values = tickValues == null ? scale.ticks ? scale.ticks.apply(scale, tickArguments) : scale.domain() : tickValues,
        format = tickFormat == null ? scale.tickFormat ? scale.tickFormat.apply(scale, tickArguments) : identity$7 : tickFormat,
        spacing = Math.max(tickSizeInner, 0) + tickPadding,
        range = scale.range(),
        range0 = +range[0] + 0.5,
        range1 = +range[range.length - 1] + 0.5,
        position = (scale.bandwidth ? center : number$3)(scale.copy()),
        selection = context.selection ? context.selection() : context,
        path = selection.selectAll(".domain").data([null]),
        tick = selection.selectAll(".tick").data(values, scale).order(),
        tickExit = tick.exit(),
        tickEnter = tick.enter().append("g").attr("class", "tick"),
        line = tick.select("line"),
        text = tick.select("text");

    path = path.merge(path.enter().insert("path", ".tick").attr("class", "domain").attr("stroke", "#000"));

    tick = tick.merge(tickEnter);

    line = line.merge(tickEnter.append("line").attr("stroke", "#000").attr(x + "2", k * tickSizeInner));

    text = text.merge(tickEnter.append("text").attr("fill", "#000").attr(x, k * spacing).attr("dy", orient === top ? "0em" : orient === bottom ? "0.71em" : "0.32em"));

    if (context !== selection) {
      path = path.transition(context);
      tick = tick.transition(context);
      line = line.transition(context);
      text = text.transition(context);

      tickExit = tickExit.transition(context).attr("opacity", epsilon$2).attr("transform", function (d) {
        return isFinite(d = position(d)) ? transform(d) : this.getAttribute("transform");
      });

      tickEnter.attr("opacity", epsilon$2).attr("transform", function (d) {
        var p = this.parentNode.__axis;return transform(p && isFinite(p = p(d)) ? p : position(d));
      });
    }

    tickExit.remove();

    path.attr("d", orient === left || orient == right ? "M" + k * tickSizeOuter + "," + range0 + "H0.5V" + range1 + "H" + k * tickSizeOuter : "M" + range0 + "," + k * tickSizeOuter + "V0.5H" + range1 + "V" + k * tickSizeOuter);

    tick.attr("opacity", 1).attr("transform", function (d) {
      return transform(position(d));
    });

    line.attr(x + "2", k * tickSizeInner);

    text.attr(x, k * spacing).text(format);

    selection.filter(entering).attr("fill", "none").attr("font-size", 10).attr("font-family", "sans-serif").attr("text-anchor", orient === right ? "start" : orient === left ? "end" : "middle");

    selection.each(function () {
      this.__axis = position;
    });
  }

  axis.scale = function (_) {
    return arguments.length ? (scale = _, axis) : scale;
  };

  axis.ticks = function () {
    return tickArguments = slice$3.call(arguments), axis;
  };

  axis.tickArguments = function (_) {
    return arguments.length ? (tickArguments = _ == null ? [] : slice$3.call(_), axis) : tickArguments.slice();
  };

  axis.tickValues = function (_) {
    return arguments.length ? (tickValues = _ == null ? null : slice$3.call(_), axis) : tickValues && tickValues.slice();
  };

  axis.tickFormat = function (_) {
    return arguments.length ? (tickFormat = _, axis) : tickFormat;
  };

  axis.tickSize = function (_) {
    return arguments.length ? (tickSizeInner = tickSizeOuter = +_, axis) : tickSizeInner;
  };

  axis.tickSizeInner = function (_) {
    return arguments.length ? (tickSizeInner = +_, axis) : tickSizeInner;
  };

  axis.tickSizeOuter = function (_) {
    return arguments.length ? (tickSizeOuter = +_, axis) : tickSizeOuter;
  };

  axis.tickPadding = function (_) {
    return arguments.length ? (tickPadding = +_, axis) : tickPadding;
  };

  return axis;
}





function axisBottom(scale) {
  return axis(bottom, scale);
}

function axisLeft(scale) {
  return axis(left, scale);
}

var require$$0 = ( index && undefined ) || index;

// Word cloud layout by Jason Davies, https://www.jasondavies.com/wordcloud/
// Algorithm due to Jonathan Feinberg, http://static.mrfeinberg.com/bv_ch03.pdf

var dispatch$2 = require$$0.dispatch;

var cloudRadians = Math.PI / 180;
var cw = 1 << 11 >> 5;
var ch = 1 << 11;

var index$1 = function () {
  var size = [256, 256],
      text = cloudText,
      font = cloudFont,
      fontSize = cloudFontSize,
      fontStyle = cloudFontNormal,
      fontWeight = cloudFontNormal,
      rotate = cloudRotate,
      padding = cloudPadding,
      spiral = archimedeanSpiral,
      words = [],
      timeInterval = Infinity,
      event = dispatch$2("word", "end"),
      timer = null,
      random = Math.random,
      cloud = {},
      canvas = cloudCanvas;

  cloud.canvas = function (_) {
    return arguments.length ? (canvas = functor(_), cloud) : canvas;
  };

  cloud.start = function () {
    var contextAndRatio = getContext(canvas()),
        board = zeroArray((size[0] >> 5) * size[1]),
        bounds = null,
        n = words.length,
        i = -1,
        tags = [],
        data = words.map(function (d, i) {
      d.text = text.call(this, d, i);
      d.font = font.call(this, d, i);
      d.style = fontStyle.call(this, d, i);
      d.weight = fontWeight.call(this, d, i);
      d.rotate = rotate.call(this, d, i);
      d.size = ~~fontSize.call(this, d, i);
      d.padding = padding.call(this, d, i);
      return d;
    }).sort(function (a, b) {
      return b.size - a.size;
    });

    if (timer) clearInterval(timer);
    timer = setInterval(step, 0);
    step();

    return cloud;

    function step() {
      var start = Date.now();
      while (Date.now() - start < timeInterval && ++i < n && timer) {
        var d = data[i];
        d.x = size[0] * (random() + .5) >> 1;
        d.y = size[1] * (random() + .5) >> 1;
        cloudSprite(contextAndRatio, d, data, i);
        if (d.hasText && place(board, d, bounds)) {
          tags.push(d);
          event.call("word", cloud, d);
          if (bounds) cloudBounds(bounds, d);else bounds = [{ x: d.x + d.x0, y: d.y + d.y0 }, { x: d.x + d.x1, y: d.y + d.y1 }];
          // Temporary hack
          d.x -= size[0] >> 1;
          d.y -= size[1] >> 1;
        }
      }
      if (i >= n) {
        cloud.stop();
        event.call("end", cloud, tags, bounds);
      }
    }
  };

  cloud.stop = function () {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    return cloud;
  };

  function getContext(canvas) {
    canvas.width = canvas.height = 1;
    var ratio = Math.sqrt(canvas.getContext("2d").getImageData(0, 0, 1, 1).data.length >> 2);
    canvas.width = (cw << 5) / ratio;
    canvas.height = ch / ratio;

    var context = canvas.getContext("2d");
    context.fillStyle = context.strokeStyle = "red";
    context.textAlign = "center";

    return { context: context, ratio: ratio };
  }

  function place(board, tag, bounds) {
    var perimeter = [{ x: 0, y: 0 }, { x: size[0], y: size[1] }],
        startX = tag.x,
        startY = tag.y,
        maxDelta = Math.sqrt(size[0] * size[0] + size[1] * size[1]),
        s = spiral(size),
        dt = random() < .5 ? 1 : -1,
        t = -dt,
        dxdy,
        dx,
        dy;

    while (dxdy = s(t += dt)) {
      dx = ~~dxdy[0];
      dy = ~~dxdy[1];

      if (Math.min(Math.abs(dx), Math.abs(dy)) >= maxDelta) break;

      tag.x = startX + dx;
      tag.y = startY + dy;

      if (tag.x + tag.x0 < 0 || tag.y + tag.y0 < 0 || tag.x + tag.x1 > size[0] || tag.y + tag.y1 > size[1]) continue;
      // TODO only check for collisions within current bounds.
      if (!bounds || !cloudCollide(tag, board, size[0])) {
        if (!bounds || collideRects(tag, bounds)) {
          var sprite = tag.sprite,
              w = tag.width >> 5,
              sw = size[0] >> 5,
              lx = tag.x - (w << 4),
              sx = lx & 0x7f,
              msx = 32 - sx,
              h = tag.y1 - tag.y0,
              x = (tag.y + tag.y0) * sw + (lx >> 5),
              last;
          for (var j = 0; j < h; j++) {
            last = 0;
            for (var i = 0; i <= w; i++) {
              board[x + i] |= last << msx | (i < w ? (last = sprite[j * w + i]) >>> sx : 0);
            }
            x += sw;
          }
          delete tag.sprite;
          return true;
        }
      }
    }
    return false;
  }

  cloud.timeInterval = function (_) {
    return arguments.length ? (timeInterval = _ == null ? Infinity : _, cloud) : timeInterval;
  };

  cloud.words = function (_) {
    return arguments.length ? (words = _, cloud) : words;
  };

  cloud.size = function (_) {
    return arguments.length ? (size = [+_[0], +_[1]], cloud) : size;
  };

  cloud.font = function (_) {
    return arguments.length ? (font = functor(_), cloud) : font;
  };

  cloud.fontStyle = function (_) {
    return arguments.length ? (fontStyle = functor(_), cloud) : fontStyle;
  };

  cloud.fontWeight = function (_) {
    return arguments.length ? (fontWeight = functor(_), cloud) : fontWeight;
  };

  cloud.rotate = function (_) {
    return arguments.length ? (rotate = functor(_), cloud) : rotate;
  };

  cloud.text = function (_) {
    return arguments.length ? (text = functor(_), cloud) : text;
  };

  cloud.spiral = function (_) {
    return arguments.length ? (spiral = spirals[_] || _, cloud) : spiral;
  };

  cloud.fontSize = function (_) {
    return arguments.length ? (fontSize = functor(_), cloud) : fontSize;
  };

  cloud.padding = function (_) {
    return arguments.length ? (padding = functor(_), cloud) : padding;
  };

  cloud.random = function (_) {
    return arguments.length ? (random = _, cloud) : random;
  };

  cloud.on = function () {
    var value = event.on.apply(event, arguments);
    return value === event ? cloud : value;
  };

  return cloud;
};

function cloudText(d) {
  return d.text;
}

function cloudFont() {
  return "serif";
}

function cloudFontNormal() {
  return "normal";
}

function cloudFontSize(d) {
  return Math.sqrt(d.value);
}

function cloudRotate() {
  return (~~(Math.random() * 6) - 3) * 30;
}

function cloudPadding() {
  return 1;
}

// Fetches a monochrome sprite bitmap for the specified text.
// Load in batches for speed.
function cloudSprite(contextAndRatio, d, data, di) {
  if (d.sprite) return;
  var c = contextAndRatio.context,
      ratio = contextAndRatio.ratio;

  c.clearRect(0, 0, (cw << 5) / ratio, ch / ratio);
  var x = 0,
      y = 0,
      maxh = 0,
      n = data.length;
  --di;
  while (++di < n) {
    d = data[di];
    c.save();
    c.font = d.style + " " + d.weight + " " + ~~((d.size + 1) / ratio) + "px " + d.font;
    var w = c.measureText(d.text + "m").width * ratio,
        h = d.size << 1;
    if (d.rotate) {
      var sr = Math.sin(d.rotate * cloudRadians),
          cr = Math.cos(d.rotate * cloudRadians),
          wcr = w * cr,
          wsr = w * sr,
          hcr = h * cr,
          hsr = h * sr;
      w = Math.max(Math.abs(wcr + hsr), Math.abs(wcr - hsr)) + 0x1f >> 5 << 5;
      h = ~~Math.max(Math.abs(wsr + hcr), Math.abs(wsr - hcr));
    } else {
      w = w + 0x1f >> 5 << 5;
    }
    if (h > maxh) maxh = h;
    if (x + w >= cw << 5) {
      x = 0;
      y += maxh;
      maxh = 0;
    }
    if (y + h >= ch) break;
    c.translate((x + (w >> 1)) / ratio, (y + (h >> 1)) / ratio);
    if (d.rotate) c.rotate(d.rotate * cloudRadians);
    c.fillText(d.text, 0, 0);
    if (d.padding) c.lineWidth = 2 * d.padding, c.strokeText(d.text, 0, 0);
    c.restore();
    d.width = w;
    d.height = h;
    d.xoff = x;
    d.yoff = y;
    d.x1 = w >> 1;
    d.y1 = h >> 1;
    d.x0 = -d.x1;
    d.y0 = -d.y1;
    d.hasText = true;
    x += w;
  }
  var pixels = c.getImageData(0, 0, (cw << 5) / ratio, ch / ratio).data,
      sprite = [];
  while (--di >= 0) {
    d = data[di];
    if (!d.hasText) continue;
    var w = d.width,
        w32 = w >> 5,
        h = d.y1 - d.y0;
    // Zero the buffer
    for (var i = 0; i < h * w32; i++) {
      sprite[i] = 0;
    }x = d.xoff;
    if (x == null) return;
    y = d.yoff;
    var seen = 0,
        seenRow = -1;
    for (var j = 0; j < h; j++) {
      for (var i = 0; i < w; i++) {
        var k = w32 * j + (i >> 5),
            m = pixels[(y + j) * (cw << 5) + (x + i) << 2] ? 1 << 31 - i % 32 : 0;
        sprite[k] |= m;
        seen |= m;
      }
      if (seen) seenRow = j;else {
        d.y0++;
        h--;
        j--;
        y++;
      }
    }
    d.y1 = d.y0 + seenRow;
    d.sprite = sprite.slice(0, (d.y1 - d.y0) * w32);
  }
}

// Use mask-based collision detection.
function cloudCollide(tag, board, sw) {
  sw >>= 5;
  var sprite = tag.sprite,
      w = tag.width >> 5,
      lx = tag.x - (w << 4),
      sx = lx & 0x7f,
      msx = 32 - sx,
      h = tag.y1 - tag.y0,
      x = (tag.y + tag.y0) * sw + (lx >> 5),
      last;
  for (var j = 0; j < h; j++) {
    last = 0;
    for (var i = 0; i <= w; i++) {
      if ((last << msx | (i < w ? (last = sprite[j * w + i]) >>> sx : 0)) & board[x + i]) return true;
    }
    x += sw;
  }
  return false;
}

function cloudBounds(bounds, d) {
  var b0 = bounds[0],
      b1 = bounds[1];
  if (d.x + d.x0 < b0.x) b0.x = d.x + d.x0;
  if (d.y + d.y0 < b0.y) b0.y = d.y + d.y0;
  if (d.x + d.x1 > b1.x) b1.x = d.x + d.x1;
  if (d.y + d.y1 > b1.y) b1.y = d.y + d.y1;
}

function collideRects(a, b) {
  return a.x + a.x1 > b[0].x && a.x + a.x0 < b[1].x && a.y + a.y1 > b[0].y && a.y + a.y0 < b[1].y;
}

function archimedeanSpiral(size) {
  var e = size[0] / size[1];
  return function (t) {
    return [e * (t *= .1) * Math.cos(t), t * Math.sin(t)];
  };
}

function rectangularSpiral(size) {
  var dy = 4,
      dx = dy * size[0] / size[1],
      x = 0,
      y = 0;
  return function (t) {
    var sign = t < 0 ? -1 : 1;
    // See triangular numbers: T_n = n * (n + 1) / 2.
    switch (Math.sqrt(1 + 4 * sign * t) - sign & 3) {
      case 0:
        x += dx;break;
      case 1:
        y += dy;break;
      case 2:
        x -= dx;break;
      default:
        y -= dy;break;
    }
    return [x, y];
  };
}

// TODO reuse arrays?
function zeroArray(n) {
  var a = [],
      i = -1;
  while (++i < n) {
    a[i] = 0;
  }return a;
}

function cloudCanvas() {
  return document.createElement("canvas");
}

function functor(d) {
  return typeof d === "function" ? d : function () {
    return d;
  };
}

var spirals = {
  archimedean: archimedeanSpiral,
  rectangular: rectangularSpiral
};

var TooltipTpl = "<div class=\'tooltip-content\' style=\'border-color: {{borderStroke}};\'>" + "<div class=\'tooltip-header\'>{{header}}</div>" + "<div class=\'tooltip-row\'>" + "<div class=\'col\'>{{name}} </div>" + "<div class=\'col\'>{{value}} </div>" + "</div>" + "</div>";

var _typeof$2 = typeof Symbol === "function" && _typeof$1(Symbol.iterator) === "symbol" ? function (obj) {
    return typeof obj === 'undefined' ? 'undefined' : _typeof$1(obj);
} : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj === 'undefined' ? 'undefined' : _typeof$1(obj);
};

var classCallCheck$2 = function classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
};

var createClass$2 = function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
        }
    }

    return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);
        if (staticProps) defineProperties(Constructor, staticProps);
        return Constructor;
    };
}();

var get$3 = function get(object$$1, property, receiver) {
    if (object$$1 === null) object$$1 = Function.prototype;
    var desc = Object.getOwnPropertyDescriptor(object$$1, property);

    if (desc === undefined) {
        var parent = Object.getPrototypeOf(object$$1);

        if (parent === null) {
            return undefined;
        } else {
            return get(parent, property, receiver);
        }
    } else if ("value" in desc) {
        return desc.value;
    } else {
        var getter = desc.get;

        if (getter === undefined) {
            return undefined;
        }

        return getter.call(receiver);
    }
};

var inherits$1 = function inherits$$1(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof$1(superClass)));
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};

var possibleConstructorReturn$1 = function possibleConstructorReturn$$1(self, call) {
    if (!self) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && ((typeof call === 'undefined' ? 'undefined' : _typeof$1(call)) === "object" || typeof call === "function") ? call : self;
};

var AbstractCartesianChart = function (_AbstractChart) {
    inherits$1(AbstractCartesianChart, _AbstractChart);

    function AbstractCartesianChart(canvasId, _userOptions) {
        classCallCheck$2(this, AbstractCartesianChart);

        var _this = possibleConstructorReturn$1(this, (AbstractCartesianChart.__proto__ || Object.getPrototypeOf(AbstractCartesianChart)).call(this, canvasId, _userOptions));

        _this._getMetric = function () {
            return _this._options.data.y[0];
        };
        _this._getDimension = function () {
            return _this._options.data.x;
        };
        _this._getDimensionVal = function (d) {
            return d[_this._getDimension().accessor];
        };
        _this._getMetricVal = function (d) {
            return d[_this._getMetric().accessor];
        };

        _this._x = function (d) {
            return _this._getDimension().scale(_this._getDimensionVal(d));
        };

        _this._y = function (d) {
            return _this._getMetric().scale(_this._getMetricVal(d));
        };

        _this._c = function (d) {
            if (d.color) {
                return d.color;
            }

            switch (_this._options.color.type) {
                case Globals.ColorType.CATEGORICAL:
                    return _this._color(_this._getDimensionVal(d));
                case Globals.ColorType.GRADIENT:
                case Globals.ColorType.DISTINCT:
                    return _this._color(_this._getMetricVal(d));
                default:
                    return _this._color(_this._getMetricVal(d));
            }
        };
        return _this;
    }

    createClass$2(AbstractCartesianChart, [{
        key: 'render',
        value: function render(_data) {
            get$3(AbstractCartesianChart.prototype.__proto__ || Object.getPrototypeOf(AbstractCartesianChart.prototype), 'render', this).call(this, _data);

            this._tooltip = select(this._containerId).append("div").attr('id', 'tooltip-' + uuid()).attr('class', 'vizart-tooltip').style("opacity", 0);
        }
    }, {
        key: 'sort',
        value: function sort(_accessor, direction) {
            this._options.ordering = {
                accessor: _accessor,
                direction: direction
            };

            this.update();
        }
    }, {
        key: '_hasNegativeValue',
        value: function _hasNegativeValue() {
            var hasNegative = false;

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                dataLoop: for (var _iterator = this.data()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var d = _step.value;
                    var _iteratorNormalCompletion2 = true;
                    var _didIteratorError2 = false;
                    var _iteratorError2 = undefined;

                    try {
                        for (var _iterator2 = this._options.data.y[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                            var _y = _step2.value;

                            if (d[_y.accessor] < 0) {
                                hasNegative = true;
                                break dataLoop;
                            }
                        }
                    } catch (err) {
                        _didIteratorError2 = true;
                        _iteratorError2 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion2 && _iterator2.return) {
                                _iterator2.return();
                            }
                        } finally {
                            if (_didIteratorError2) {
                                throw _iteratorError2;
                            }
                        }
                    }
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            return hasNegative;
        }
    }, {
        key: '_getTooltipHTML',
        value: function _getTooltipHTML(d) {
            return TooltipTpl.replace("{{header}}", this._getDimensionVal(d)).replace("{{name}}", this._getMetric().name).replace("{{value}}", this._getMetricVal(d)).replace("{{borderStroke}}", this._c(d));
        }

        //todo not a nice way to use 'this', need to improve

    }, {
        key: '_bindTooltip',
        value: function _bindTooltip(_selector) {
            var polar = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

            var that = this;

            function _mouseMove(d) {
                that._tooltip.transition().duration(that._options.tooltip.duration).style("opacity", 1);

                var coordinates = mouse(this);
                var x = coordinates[0];
                var y = coordinates[1];

                if (polar === true) {
                    that._tooltip.style("left", x + that._options.chart.width / 2 + "px").style("top", y + that._options.chart.height / 2 + 90 + "px").html(that._getTooltipHTML(d));
                } else {
                    that._tooltip.style("left", x < 40 ? x : x - 22 + "px").style("top", y < 40 ? y + 34 : y - 34 + "px").html(that._getTooltipHTML(d));
                }
            }

            function _mouseOut() {
                that._tooltip.transition().duration(that._options.tooltip.duration).style("opacity", 0);
            }

            _selector.on("mousemove", _mouseMove).on("mouseout", _mouseOut);
        }
    }]);
    return AbstractCartesianChart;
}(AbstractChart);

var Stacks = {
    Expand: 'expand',
    Zero: 'zero',
    Silhouette: 'silhouette',
    Wiggle: 'wiggle'
};

/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear$1() {
    this.__data__ = [];
    this.size = 0;
}

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq$1(value, other) {
    return value === other || value !== value && other !== other;
}

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf$1(array$$1, key) {
    var length = array$$1.length;
    while (length--) {
        if (eq$1(array$$1[length][0], key)) {
            return length;
        }
    }
    return -1;
}

/** Used for built-in method references. */
var arrayProto$1 = Array.prototype;

/** Built-in value references. */
var splice$1 = arrayProto$1.splice;

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete$1(key) {
    var data = this.__data__,
        index = assocIndexOf$1(data, key);

    if (index < 0) {
        return false;
    }
    var lastIndex = data.length - 1;
    if (index == lastIndex) {
        data.pop();
    } else {
        splice$1.call(data, index, 1);
    }
    --this.size;
    return true;
}

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet$1(key) {
    var data = this.__data__,
        index = assocIndexOf$1(data, key);

    return index < 0 ? undefined : data[index][1];
}

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas$1(key) {
    return assocIndexOf$1(this.__data__, key) > -1;
}

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet$1(key, value) {
    var data = this.__data__,
        index = assocIndexOf$1(data, key);

    if (index < 0) {
        ++this.size;
        data.push([key, value]);
    } else {
        data[index][1] = value;
    }
    return this;
}

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache$1(entries$$1) {
    var index = -1,
        length = entries$$1 == null ? 0 : entries$$1.length;

    this.clear();
    while (++index < length) {
        var entry = entries$$1[index];
        this.set(entry[0], entry[1]);
    }
}

// Add methods to `ListCache`.
ListCache$1.prototype.clear = listCacheClear$1;
ListCache$1.prototype['delete'] = listCacheDelete$1;
ListCache$1.prototype.get = listCacheGet$1;
ListCache$1.prototype.has = listCacheHas$1;
ListCache$1.prototype.set = listCacheSet$1;

/**
 * Removes all key-value entries from the stack.
 *
 * @private
 * @name clear
 * @memberOf Stack
 */
function stackClear$1() {
    this.__data__ = new ListCache$1();
    this.size = 0;
}

/**
 * Removes `key` and its value from the stack.
 *
 * @private
 * @name delete
 * @memberOf Stack
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function stackDelete$1(key) {
    var data = this.__data__,
        result = data['delete'](key);

    this.size = data.size;
    return result;
}

/**
 * Gets the stack value for `key`.
 *
 * @private
 * @name get
 * @memberOf Stack
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function stackGet$1(key) {
    return this.__data__.get(key);
}

/**
 * Checks if a stack value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Stack
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function stackHas$1(key) {
    return this.__data__.has(key);
}

/** Detect free variable `global` from Node.js. */
var freeGlobal$1 = (typeof global === 'undefined' ? 'undefined' : _typeof$2(global)) == 'object' && global && global.Object === Object && global;

/** Detect free variable `self`. */
var freeSelf$1 = (typeof self === 'undefined' ? 'undefined' : _typeof$2(self)) == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root$3 = freeGlobal$1 || freeSelf$1 || Function('return this')();

/** Built-in value references. */
var _Symbol$1 = root$3.Symbol;

/** Used for built-in method references. */
var objectProto$1$1 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$1$1 = objectProto$1$1.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString$1$1 = objectProto$1$1.toString;

/** Built-in value references. */
var symToStringTag$1$1 = _Symbol$1 ? _Symbol$1.toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag$1(value) {
    var isOwn = hasOwnProperty$1$1.call(value, symToStringTag$1$1),
        tag = value[symToStringTag$1$1];

    try {
        value[symToStringTag$1$1] = undefined;
        var unmasked = true;
    } catch (e) {}

    var result = nativeObjectToString$1$1.call(value);
    if (unmasked) {
        if (isOwn) {
            value[symToStringTag$1$1] = tag;
        } else {
            delete value[symToStringTag$1$1];
        }
    }
    return result;
}

/** Used for built-in method references. */
var objectProto$2$1 = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString$1$2 = objectProto$2$1.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString$1(value) {
    return nativeObjectToString$1$2.call(value);
}

/** `Object#toString` result references. */
var nullTag$1 = '[object Null]';
var undefinedTag$1 = '[object Undefined]';

/** Built-in value references. */
var symToStringTag$1$2 = _Symbol$1 ? _Symbol$1.toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag$1(value) {
    if (value == null) {
        return value === undefined ? undefinedTag$1 : nullTag$1;
    }
    return symToStringTag$1$2 && symToStringTag$1$2 in Object(value) ? getRawTag$1(value) : objectToString$1(value);
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject$1(value) {
    var type = typeof value === 'undefined' ? 'undefined' : _typeof$2(value);
    return value != null && (type == 'object' || type == 'function');
}

/** `Object#toString` result references. */
var asyncTag$1 = '[object AsyncFunction]';
var funcTag$1$1 = '[object Function]';
var genTag$1$1 = '[object GeneratorFunction]';
var proxyTag$1 = '[object Proxy]';

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction$1(value) {
    if (!isObject$1(value)) {
        return false;
    }
    // The use of `Object#toString` avoids issues with the `typeof` operator
    // in Safari 9 which returns 'object' for typed arrays and other constructors.
    var tag = baseGetTag$1(value);
    return tag == funcTag$1$1 || tag == genTag$1$1 || tag == asyncTag$1 || tag == proxyTag$1;
}

/** Used to detect overreaching core-js shims. */
var coreJsData$1 = root$3['__core-js_shared__'];

/** Used to detect methods masquerading as native. */
var maskSrcKey$1 = function () {
    var uid = /[^.]+$/.exec(coreJsData$1 && coreJsData$1.keys && coreJsData$1.keys.IE_PROTO || '');
    return uid ? 'Symbol(src)_1.' + uid : '';
}();

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked$1(func) {
    return !!maskSrcKey$1 && maskSrcKey$1 in func;
}

/** Used for built-in method references. */
var funcProto$1$1 = Function.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString$1$1 = funcProto$1$1.toString;

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to convert.
 * @returns {string} Returns the source code.
 */
function toSource$1(func) {
    if (func != null) {
        try {
            return funcToString$1$1.call(func);
        } catch (e) {}
        try {
            return func + '';
        } catch (e) {}
    }
    return '';
}

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar$1 = /[\\^$.*+?()[\]{}|]/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor$1 = /^\[object .+?Constructor\]$/;

/** Used for built-in method references. */
var funcProto$1$2 = Function.prototype;
var objectProto$1$2 = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString$1$2 = funcProto$1$2.toString;

/** Used to check objects for own properties. */
var hasOwnProperty$1$2 = objectProto$1$2.hasOwnProperty;

/** Used to detect if a method is native. */
var reIsNative$1 = RegExp('^' + funcToString$1$2.call(hasOwnProperty$1$2).replace(reRegExpChar$1, '\\$&').replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$');

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative$1(value) {
    if (!isObject$1(value) || isMasked$1(value)) {
        return false;
    }
    var pattern = isFunction$1(value) ? reIsNative$1 : reIsHostCtor$1;
    return pattern.test(toSource$1(value));
}

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue$1(object$$1, key) {
    return object$$1 == null ? undefined : object$$1[key];
}

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative$1(object$$1, key) {
    var value = getValue$1(object$$1, key);
    return baseIsNative$1(value) ? value : undefined;
}

/* Built-in method references that are verified to be native. */
var Map$2 = getNative$1(root$3, 'Map');

/* Built-in method references that are verified to be native. */
var nativeCreate$1 = getNative$1(Object, 'create');

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear$1() {
    this.__data__ = nativeCreate$1 ? nativeCreate$1(null) : {};
    this.size = 0;
}

/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete$1(key) {
    var result = this.has(key) && delete this.__data__[key];
    this.size -= result ? 1 : 0;
    return result;
}

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED$1$1 = '__lodash_hash_undefined__';

/** Used for built-in method references. */
var objectProto$3$1 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$2$1 = objectProto$3$1.hasOwnProperty;

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet$1(key) {
    var data = this.__data__;
    if (nativeCreate$1) {
        var result = data[key];
        return result === HASH_UNDEFINED$1$1 ? undefined : result;
    }
    return hasOwnProperty$2$1.call(data, key) ? data[key] : undefined;
}

/** Used for built-in method references. */
var objectProto$4$1 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$3$1 = objectProto$4$1.hasOwnProperty;

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas$1(key) {
    var data = this.__data__;
    return nativeCreate$1 ? data[key] !== undefined : hasOwnProperty$3$1.call(data, key);
}

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED$1$2 = '__lodash_hash_undefined__';

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet$1(key, value) {
    var data = this.__data__;
    this.size += this.has(key) ? 0 : 1;
    data[key] = nativeCreate$1 && value === undefined ? HASH_UNDEFINED$1$2 : value;
    return this;
}

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash$1(entries$$1) {
    var index = -1,
        length = entries$$1 == null ? 0 : entries$$1.length;

    this.clear();
    while (++index < length) {
        var entry = entries$$1[index];
        this.set(entry[0], entry[1]);
    }
}

// Add methods to `Hash`.
Hash$1.prototype.clear = hashClear$1;
Hash$1.prototype['delete'] = hashDelete$1;
Hash$1.prototype.get = hashGet$1;
Hash$1.prototype.has = hashHas$1;
Hash$1.prototype.set = hashSet$1;

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear$1() {
    this.size = 0;
    this.__data__ = {
        'hash': new Hash$1(),
        'map': new (Map$2 || ListCache$1)(),
        'string': new Hash$1()
    };
}

/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable$1(value) {
    var type = typeof value === 'undefined' ? 'undefined' : _typeof$2(value);
    return type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean' ? value !== '__proto__' : value === null;
}

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData$1(map, key) {
    var data = map.__data__;
    return isKeyable$1(key) ? data[typeof key == 'string' ? 'string' : 'hash'] : data.map;
}

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete$1(key) {
    var result = getMapData$1(this, key)['delete'](key);
    this.size -= result ? 1 : 0;
    return result;
}

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet$1(key) {
    return getMapData$1(this, key).get(key);
}

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas$1(key) {
    return getMapData$1(this, key).has(key);
}

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet$1(key, value) {
    var data = getMapData$1(this, key),
        size = data.size;

    data.set(key, value);
    this.size += data.size == size ? 0 : 1;
    return this;
}

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache$1(entries$$1) {
    var index = -1,
        length = entries$$1 == null ? 0 : entries$$1.length;

    this.clear();
    while (++index < length) {
        var entry = entries$$1[index];
        this.set(entry[0], entry[1]);
    }
}

// Add methods to `MapCache`.
MapCache$1.prototype.clear = mapCacheClear$1;
MapCache$1.prototype['delete'] = mapCacheDelete$1;
MapCache$1.prototype.get = mapCacheGet$1;
MapCache$1.prototype.has = mapCacheHas$1;
MapCache$1.prototype.set = mapCacheSet$1;

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE$1 = 200;

/**
 * Sets the stack `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Stack
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the stack cache instance.
 */
function stackSet$1(key, value) {
    var data = this.__data__;
    if (data instanceof ListCache$1) {
        var pairs$$1 = data.__data__;
        if (!Map$2 || pairs$$1.length < LARGE_ARRAY_SIZE$1 - 1) {
            pairs$$1.push([key, value]);
            this.size = ++data.size;
            return this;
        }
        data = this.__data__ = new MapCache$1(pairs$$1);
    }
    data.set(key, value);
    this.size = data.size;
    return this;
}

/**
 * Creates a stack cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Stack$1(entries$$1) {
    var data = this.__data__ = new ListCache$1(entries$$1);
    this.size = data.size;
}

// Add methods to `Stack`.
Stack$1.prototype.clear = stackClear$1;
Stack$1.prototype['delete'] = stackDelete$1;
Stack$1.prototype.get = stackGet$1;
Stack$1.prototype.has = stackHas$1;
Stack$1.prototype.set = stackSet$1;

/**
 * A specialized version of `_.forEach` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
function arrayEach$1(array$$1, iteratee) {
    var index = -1,
        length = array$$1 == null ? 0 : array$$1.length;

    while (++index < length) {
        if (iteratee(array$$1[index], index, array$$1) === false) {
            break;
        }
    }
    return array$$1;
}

var defineProperty$1$1 = function () {
    try {
        var func = getNative$1(Object, 'defineProperty');
        func({}, '', {});
        return func;
    } catch (e) {}
}();

/**
 * The base implementation of `assignValue` and `assignMergeValue` without
 * value checks.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function baseAssignValue$1(object$$1, key, value) {
    if (key == '__proto__' && defineProperty$1$1) {
        defineProperty$1$1(object$$1, key, {
            'configurable': true,
            'enumerable': true,
            'value': value,
            'writable': true
        });
    } else {
        object$$1[key] = value;
    }
}

/** Used for built-in method references. */
var objectProto$5$1 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$4$1 = objectProto$5$1.hasOwnProperty;

/**
 * Assigns `value` to `key` of `object` if the existing value is not equivalent
 * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * for equality comparisons.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function assignValue$1(object$$1, key, value) {
    var objValue = object$$1[key];
    if (!(hasOwnProperty$4$1.call(object$$1, key) && eq$1(objValue, value)) || value === undefined && !(key in object$$1)) {
        baseAssignValue$1(object$$1, key, value);
    }
}

/**
 * Copies properties of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy properties from.
 * @param {Array} props The property identifiers to copy.
 * @param {Object} [object={}] The object to copy properties to.
 * @param {Function} [customizer] The function to customize copied values.
 * @returns {Object} Returns `object`.
 */
function copyObject$1(source, props, object$$1, customizer) {
    var isNew = !object$$1;
    object$$1 || (object$$1 = {});

    var index = -1,
        length = props.length;

    while (++index < length) {
        var key = props[index];

        var newValue = customizer ? customizer(object$$1[key], source[key], key, object$$1, source) : undefined;

        if (newValue === undefined) {
            newValue = source[key];
        }
        if (isNew) {
            baseAssignValue$1(object$$1, key, newValue);
        } else {
            assignValue$1(object$$1, key, newValue);
        }
    }
    return object$$1;
}

/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */
function baseTimes$1(n, iteratee) {
    var index = -1,
        result = Array(n);

    while (++index < n) {
        result[index] = iteratee(index);
    }
    return result;
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike$1(value) {
    return value != null && (typeof value === 'undefined' ? 'undefined' : _typeof$2(value)) == 'object';
}

/** `Object#toString` result references. */
var argsTag$1$1 = '[object Arguments]';

/**
 * The base implementation of `_.isArguments`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 */
function baseIsArguments$1(value) {
    return isObjectLike$1(value) && baseGetTag$1(value) == argsTag$1$1;
}

/** Used for built-in method references. */
var objectProto$7$1 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$6$1 = objectProto$7$1.hasOwnProperty;

/** Built-in value references. */
var propertyIsEnumerable$1$1 = objectProto$7$1.propertyIsEnumerable;

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
var isArguments$1 = baseIsArguments$1(function () {
    return arguments;
}()) ? baseIsArguments$1 : function (value) {
    return isObjectLike$1(value) && hasOwnProperty$6$1.call(value, 'callee') && !propertyIsEnumerable$1$1.call(value, 'callee');
};

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray$1 = Array.isArray;

/**
 * This method returns `false`.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {boolean} Returns `false`.
 * @example
 *
 * _.times(2, _.stubFalse);
 * // => [false, false]
 */
function stubFalse$1() {
    return false;
}

/** Detect free variable `exports`. */
var freeExports$1$1 = (typeof exports === 'undefined' ? 'undefined' : _typeof$2(exports)) == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule$1$1 = freeExports$1$1 && (typeof module === 'undefined' ? 'undefined' : _typeof$2(module)) == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports$1$1 = freeModule$1$1 && freeModule$1$1.exports === freeExports$1$1;

/** Built-in value references. */
var Buffer$1$1 = moduleExports$1$1 ? root$3.Buffer : undefined;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeIsBuffer$1 = Buffer$1$1 ? Buffer$1$1.isBuffer : undefined;

/**
 * Checks if `value` is a buffer.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
 * @example
 *
 * _.isBuffer(new Buffer(2));
 * // => true
 *
 * _.isBuffer(new Uint8Array(2));
 * // => false
 */
var isBuffer$1 = nativeIsBuffer$1 || stubFalse$1;

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER$1$1 = 9007199254740991;

/** Used to detect unsigned integer values. */
var reIsUint$1 = /^(?:0|[1-9]\d*)$/;

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex$1(value, length) {
    length = length == null ? MAX_SAFE_INTEGER$1$1 : length;
    return !!length && (typeof value == 'number' || reIsUint$1.test(value)) && value > -1 && value % 1 == 0 && value < length;
}

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER$1$2 = 9007199254740991;

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength$1(value) {
    return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER$1$2;
}

/** `Object#toString` result references. */
var argsTag$2$1 = '[object Arguments]';
var arrayTag$1$1 = '[object Array]';
var boolTag$1$1 = '[object Boolean]';
var dateTag$1$1 = '[object Date]';
var errorTag$1$1 = '[object Error]';
var funcTag$2$1 = '[object Function]';
var mapTag$1$1 = '[object Map]';
var numberTag$1$1 = '[object Number]';
var objectTag$1$1 = '[object Object]';
var regexpTag$1$1 = '[object RegExp]';
var setTag$1$1 = '[object Set]';
var stringTag$1$1 = '[object String]';
var weakMapTag$1$1 = '[object WeakMap]';

var arrayBufferTag$1$1 = '[object ArrayBuffer]';
var dataViewTag$1$1 = '[object DataView]';
var float32Tag$1$1 = '[object Float32Array]';
var float64Tag$1$1 = '[object Float64Array]';
var int8Tag$1$1 = '[object Int8Array]';
var int16Tag$1$1 = '[object Int16Array]';
var int32Tag$1$1 = '[object Int32Array]';
var uint8Tag$1$1 = '[object Uint8Array]';
var uint8ClampedTag$1$1 = '[object Uint8ClampedArray]';
var uint16Tag$1$1 = '[object Uint16Array]';
var uint32Tag$1$1 = '[object Uint32Array]';

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags$1 = {};
typedArrayTags$1[float32Tag$1$1] = typedArrayTags$1[float64Tag$1$1] = typedArrayTags$1[int8Tag$1$1] = typedArrayTags$1[int16Tag$1$1] = typedArrayTags$1[int32Tag$1$1] = typedArrayTags$1[uint8Tag$1$1] = typedArrayTags$1[uint8ClampedTag$1$1] = typedArrayTags$1[uint16Tag$1$1] = typedArrayTags$1[uint32Tag$1$1] = true;
typedArrayTags$1[argsTag$2$1] = typedArrayTags$1[arrayTag$1$1] = typedArrayTags$1[arrayBufferTag$1$1] = typedArrayTags$1[boolTag$1$1] = typedArrayTags$1[dataViewTag$1$1] = typedArrayTags$1[dateTag$1$1] = typedArrayTags$1[errorTag$1$1] = typedArrayTags$1[funcTag$2$1] = typedArrayTags$1[mapTag$1$1] = typedArrayTags$1[numberTag$1$1] = typedArrayTags$1[objectTag$1$1] = typedArrayTags$1[regexpTag$1$1] = typedArrayTags$1[setTag$1$1] = typedArrayTags$1[stringTag$1$1] = typedArrayTags$1[weakMapTag$1$1] = false;

/**
 * The base implementation of `_.isTypedArray` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 */
function baseIsTypedArray$1(value) {
    return isObjectLike$1(value) && isLength$1(value.length) && !!typedArrayTags$1[baseGetTag$1(value)];
}

/**
 * The base implementation of `_.unary` without support for storing metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 */
function baseUnary$1(func) {
    return function (value) {
        return func(value);
    };
}

/** Detect free variable `exports`. */
var freeExports$1$2 = (typeof exports === 'undefined' ? 'undefined' : _typeof$2(exports)) == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule$1$2 = freeExports$1$2 && (typeof module === 'undefined' ? 'undefined' : _typeof$2(module)) == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports$1$2 = freeModule$1$2 && freeModule$1$2.exports === freeExports$1$2;

/** Detect free variable `process` from Node.js. */
var freeProcess$1 = moduleExports$1$2 && freeGlobal$1.process;

/** Used to access faster Node.js helpers. */
var nodeUtil$1 = function () {
    try {
        return freeProcess$1 && freeProcess$1.binding && freeProcess$1.binding('util');
    } catch (e) {}
}();

/* Node.js helper references. */
var nodeIsTypedArray$1 = nodeUtil$1 && nodeUtil$1.isTypedArray;

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
var isTypedArray$1 = nodeIsTypedArray$1 ? baseUnary$1(nodeIsTypedArray$1) : baseIsTypedArray$1;

/** Used for built-in method references. */
var objectProto$6$1 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$5$1 = objectProto$6$1.hasOwnProperty;

/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */
function arrayLikeKeys$1(value, inherited) {
    var isArr = isArray$1(value),
        isArg = !isArr && isArguments$1(value),
        isBuff = !isArr && !isArg && isBuffer$1(value),
        isType = !isArr && !isArg && !isBuff && isTypedArray$1(value),
        skipIndexes = isArr || isArg || isBuff || isType,
        result = skipIndexes ? baseTimes$1(value.length, String) : [],
        length = result.length;

    for (var key in value) {
        if ((inherited || hasOwnProperty$5$1.call(value, key)) && !(skipIndexes && (
        // Safari 9 has enumerable `arguments.length` in strict mode.
        key == 'length' ||
        // Node.js 0.10 has enumerable non-index properties on buffers.
        isBuff && (key == 'offset' || key == 'parent') ||
        // PhantomJS 2 has enumerable non-index properties on typed arrays.
        isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset') ||
        // Skip index properties.
        isIndex$1(key, length)))) {
            result.push(key);
        }
    }
    return result;
}

/** Used for built-in method references. */
var objectProto$9$1 = Object.prototype;

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
function isPrototype$1(value) {
    var Ctor = value && value.constructor,
        proto = typeof Ctor == 'function' && Ctor.prototype || objectProto$9$1;

    return value === proto;
}

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg$1(func, transform) {
    return function (arg) {
        return func(transform(arg));
    };
}

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeKeys$1 = overArg$1(Object.keys, Object);

/** Used for built-in method references. */
var objectProto$8$1 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$7$1 = objectProto$8$1.hasOwnProperty;

/**
 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeys$1(object$$1) {
    if (!isPrototype$1(object$$1)) {
        return nativeKeys$1(object$$1);
    }
    var result = [];
    for (var key in Object(object$$1)) {
        if (hasOwnProperty$7$1.call(object$$1, key) && key != 'constructor') {
            result.push(key);
        }
    }
    return result;
}

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike$1(value) {
    return value != null && isLength$1(value.length) && !isFunction$1(value);
}

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
function keys$2(object$$1) {
    return isArrayLike$1(object$$1) ? arrayLikeKeys$1(object$$1) : baseKeys$1(object$$1);
}

/**
 * The base implementation of `_.assign` without support for multiple sources
 * or `customizer` functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @returns {Object} Returns `object`.
 */
function baseAssign$1(object$$1, source) {
    return object$$1 && copyObject$1(source, keys$2(source), object$$1);
}

/**
 * This function is like
 * [`Object.keys`](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * except that it includes inherited enumerable properties.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function nativeKeysIn$1(object$$1) {
    var result = [];
    if (object$$1 != null) {
        for (var key in Object(object$$1)) {
            result.push(key);
        }
    }
    return result;
}

/** Used for built-in method references. */
var objectProto$10$1 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$8$1 = objectProto$10$1.hasOwnProperty;

/**
 * The base implementation of `_.keysIn` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeysIn$1(object$$1) {
    if (!isObject$1(object$$1)) {
        return nativeKeysIn$1(object$$1);
    }
    var isProto = isPrototype$1(object$$1),
        result = [];

    for (var key in object$$1) {
        if (!(key == 'constructor' && (isProto || !hasOwnProperty$8$1.call(object$$1, key)))) {
            result.push(key);
        }
    }
    return result;
}

/**
 * Creates an array of the own and inherited enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keysIn(new Foo);
 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
 */
function keysIn$1$1(object$$1) {
    return isArrayLike$1(object$$1) ? arrayLikeKeys$1(object$$1, true) : baseKeysIn$1(object$$1);
}

/**
 * The base implementation of `_.assignIn` without support for multiple sources
 * or `customizer` functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @returns {Object} Returns `object`.
 */
function baseAssignIn$1(object$$1, source) {
    return object$$1 && copyObject$1(source, keysIn$1$1(source), object$$1);
}

/** Detect free variable `exports`. */
var freeExports$2$1 = (typeof exports === 'undefined' ? 'undefined' : _typeof$2(exports)) == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule$2$1 = freeExports$2$1 && (typeof module === 'undefined' ? 'undefined' : _typeof$2(module)) == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports$2$1 = freeModule$2$1 && freeModule$2$1.exports === freeExports$2$1;

/** Built-in value references. */
var Buffer$1$2 = moduleExports$2$1 ? root$3.Buffer : undefined;
var allocUnsafe$1 = Buffer$1$2 ? Buffer$1$2.allocUnsafe : undefined;

/**
 * Creates a clone of  `buffer`.
 *
 * @private
 * @param {Buffer} buffer The buffer to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Buffer} Returns the cloned buffer.
 */
function cloneBuffer$1(buffer, isDeep) {
    if (isDeep) {
        return buffer.slice();
    }
    var length = buffer.length,
        result = allocUnsafe$1 ? allocUnsafe$1(length) : new buffer.constructor(length);

    buffer.copy(result);
    return result;
}

/**
 * Copies the values of `source` to `array`.
 *
 * @private
 * @param {Array} source The array to copy values from.
 * @param {Array} [array=[]] The array to copy values to.
 * @returns {Array} Returns `array`.
 */
function copyArray$1(source, array$$1) {
    var index = -1,
        length = source.length;

    array$$1 || (array$$1 = Array(length));
    while (++index < length) {
        array$$1[index] = source[index];
    }
    return array$$1;
}

/**
 * A specialized version of `_.filter` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
function arrayFilter$1(array$$1, predicate) {
    var index = -1,
        length = array$$1 == null ? 0 : array$$1.length,
        resIndex = 0,
        result = [];

    while (++index < length) {
        var value = array$$1[index];
        if (predicate(value, index, array$$1)) {
            result[resIndex++] = value;
        }
    }
    return result;
}

/**
 * This method returns a new empty array.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {Array} Returns the new empty array.
 * @example
 *
 * var arrays = _.times(2, _.stubArray);
 *
 * console.log(arrays);
 * // => [[], []]
 *
 * console.log(arrays[0] === arrays[1]);
 * // => false
 */
function stubArray$1() {
    return [];
}

/** Used for built-in method references. */
var objectProto$11$1 = Object.prototype;

/** Built-in value references. */
var propertyIsEnumerable$1$2 = objectProto$11$1.propertyIsEnumerable;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeGetSymbols$1$1 = Object.getOwnPropertySymbols;

/**
 * Creates an array of the own enumerable symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */
var getSymbols$1 = !nativeGetSymbols$1$1 ? stubArray$1 : function (object$$1) {
    if (object$$1 == null) {
        return [];
    }
    object$$1 = Object(object$$1);
    return arrayFilter$1(nativeGetSymbols$1$1(object$$1), function (symbol$$1) {
        return propertyIsEnumerable$1$2.call(object$$1, symbol$$1);
    });
};

/**
 * Copies own symbols of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy symbols from.
 * @param {Object} [object={}] The object to copy symbols to.
 * @returns {Object} Returns `object`.
 */
function copySymbols$1(source, object$$1) {
    return copyObject$1(source, getSymbols$1(source), object$$1);
}

/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */
function arrayPush$1(array$$1, values$$1) {
    var index = -1,
        length = values$$1.length,
        offset = array$$1.length;

    while (++index < length) {
        array$$1[offset + index] = values$$1[index];
    }
    return array$$1;
}

/** Built-in value references. */
var getPrototype$1 = overArg$1(Object.getPrototypeOf, Object);

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeGetSymbols$1$2 = Object.getOwnPropertySymbols;

/**
 * Creates an array of the own and inherited enumerable symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */
var getSymbolsIn$1 = !nativeGetSymbols$1$2 ? stubArray$1 : function (object$$1) {
    var result = [];
    while (object$$1) {
        arrayPush$1(result, getSymbols$1(object$$1));
        object$$1 = getPrototype$1(object$$1);
    }
    return result;
};

/**
 * Copies own and inherited symbols of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy symbols from.
 * @param {Object} [object={}] The object to copy symbols to.
 * @returns {Object} Returns `object`.
 */
function copySymbolsIn$1(source, object$$1) {
    return copyObject$1(source, getSymbolsIn$1(source), object$$1);
}

/**
 * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
 * `keysFunc` and `symbolsFunc` to get the enumerable property names and
 * symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @param {Function} symbolsFunc The function to get the symbols of `object`.
 * @returns {Array} Returns the array of property names and symbols.
 */
function baseGetAllKeys$1(object$$1, keysFunc, symbolsFunc) {
    var result = keysFunc(object$$1);
    return isArray$1(object$$1) ? result : arrayPush$1(result, symbolsFunc(object$$1));
}

/**
 * Creates an array of own enumerable property names and symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names and symbols.
 */
function getAllKeys$1(object$$1) {
    return baseGetAllKeys$1(object$$1, keys$2, getSymbols$1);
}

/**
 * Creates an array of own and inherited enumerable property names and
 * symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names and symbols.
 */
function getAllKeysIn$1(object$$1) {
    return baseGetAllKeys$1(object$$1, keysIn$1$1, getSymbolsIn$1);
}

/* Built-in method references that are verified to be native. */
var DataView$1 = getNative$1(root$3, 'DataView');

/* Built-in method references that are verified to be native. */
var Promise$1$1 = getNative$1(root$3, 'Promise');

/* Built-in method references that are verified to be native. */
var Set$2 = getNative$1(root$3, 'Set');

/* Built-in method references that are verified to be native. */
var WeakMap$1 = getNative$1(root$3, 'WeakMap');

/** `Object#toString` result references. */
var mapTag$2$1 = '[object Map]';
var objectTag$2$1 = '[object Object]';
var promiseTag$1 = '[object Promise]';
var setTag$2$1 = '[object Set]';
var weakMapTag$2$1 = '[object WeakMap]';

var dataViewTag$2$1 = '[object DataView]';

/** Used to detect maps, sets, and weakmaps. */
var dataViewCtorString$1 = toSource$1(DataView$1);
var mapCtorString$1 = toSource$1(Map$2);
var promiseCtorString$1 = toSource$1(Promise$1$1);
var setCtorString$1 = toSource$1(Set$2);
var weakMapCtorString$1 = toSource$1(WeakMap$1);

/**
 * Gets the `toStringTag` of `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
var getTag$1$1 = baseGetTag$1;

// Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
if (DataView$1 && getTag$1$1(new DataView$1(new ArrayBuffer(1))) != dataViewTag$2$1 || Map$2 && getTag$1$1(new Map$2()) != mapTag$2$1 || Promise$1$1 && getTag$1$1(Promise$1$1.resolve()) != promiseTag$1 || Set$2 && getTag$1$1(new Set$2()) != setTag$2$1 || WeakMap$1 && getTag$1$1(new WeakMap$1()) != weakMapTag$2$1) {
    getTag$1$1 = function getTag(value) {
        var result = baseGetTag$1(value),
            Ctor = result == objectTag$2$1 ? value.constructor : undefined,
            ctorString = Ctor ? toSource$1(Ctor) : '';

        if (ctorString) {
            switch (ctorString) {
                case dataViewCtorString$1:
                    return dataViewTag$2$1;
                case mapCtorString$1:
                    return mapTag$2$1;
                case promiseCtorString$1:
                    return promiseTag$1;
                case setCtorString$1:
                    return setTag$2$1;
                case weakMapCtorString$1:
                    return weakMapTag$2$1;
            }
        }
        return result;
    };
}

var getTag$1$2 = getTag$1$1;

/** Used for built-in method references. */
var objectProto$12$1 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$9$1 = objectProto$12$1.hasOwnProperty;

/**
 * Initializes an array clone.
 *
 * @private
 * @param {Array} array The array to clone.
 * @returns {Array} Returns the initialized clone.
 */
function initCloneArray$1(array$$1) {
    var length = array$$1.length,
        result = array$$1.constructor(length);

    // Add properties assigned by `RegExp#exec`.
    if (length && typeof array$$1[0] == 'string' && hasOwnProperty$9$1.call(array$$1, 'index')) {
        result.index = array$$1.index;
        result.input = array$$1.input;
    }
    return result;
}

/** Built-in value references. */
var Uint8Array$1 = root$3.Uint8Array;

/**
 * Creates a clone of `arrayBuffer`.
 *
 * @private
 * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
 * @returns {ArrayBuffer} Returns the cloned array buffer.
 */
function cloneArrayBuffer$1(arrayBuffer) {
    var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
    new Uint8Array$1(result).set(new Uint8Array$1(arrayBuffer));
    return result;
}

/**
 * Creates a clone of `dataView`.
 *
 * @private
 * @param {Object} dataView The data view to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned data view.
 */
function cloneDataView$1(dataView, isDeep) {
    var buffer = isDeep ? cloneArrayBuffer$1(dataView.buffer) : dataView.buffer;
    return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
}

/**
 * Adds the key-value `pair` to `map`.
 *
 * @private
 * @param {Object} map The map to modify.
 * @param {Array} pair The key-value pair to add.
 * @returns {Object} Returns `map`.
 */
function addMapEntry$1(map, pair) {
    // Don't return `map.set` because it's not chainable in IE 11.
    map.set(pair[0], pair[1]);
    return map;
}

/**
 * A specialized version of `_.reduce` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {*} [accumulator] The initial value.
 * @param {boolean} [initAccum] Specify using the first element of `array` as
 *  the initial value.
 * @returns {*} Returns the accumulated value.
 */
function arrayReduce$1(array$$1, iteratee, accumulator, initAccum) {
    var index = -1,
        length = array$$1 == null ? 0 : array$$1.length;

    if (initAccum && length) {
        accumulator = array$$1[++index];
    }
    while (++index < length) {
        accumulator = iteratee(accumulator, array$$1[index], index, array$$1);
    }
    return accumulator;
}

/**
 * Converts `map` to its key-value pairs.
 *
 * @private
 * @param {Object} map The map to convert.
 * @returns {Array} Returns the key-value pairs.
 */
function mapToArray$1(map) {
    var index = -1,
        result = Array(map.size);

    map.forEach(function (value, key) {
        result[++index] = [key, value];
    });
    return result;
}

/** Used to compose bitmasks for cloning. */
var CLONE_DEEP_FLAG$2$1 = 1;

/**
 * Creates a clone of `map`.
 *
 * @private
 * @param {Object} map The map to clone.
 * @param {Function} cloneFunc The function to clone values.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned map.
 */
function cloneMap$1(map, isDeep, cloneFunc) {
    var array$$1 = isDeep ? cloneFunc(mapToArray$1(map), CLONE_DEEP_FLAG$2$1) : mapToArray$1(map);
    return arrayReduce$1(array$$1, addMapEntry$1, new map.constructor());
}

/** Used to match `RegExp` flags from their coerced string values. */
var reFlags$1 = /\w*$/;

/**
 * Creates a clone of `regexp`.
 *
 * @private
 * @param {Object} regexp The regexp to clone.
 * @returns {Object} Returns the cloned regexp.
 */
function cloneRegExp$1(regexp) {
    var result = new regexp.constructor(regexp.source, reFlags$1.exec(regexp));
    result.lastIndex = regexp.lastIndex;
    return result;
}

/**
 * Adds `value` to `set`.
 *
 * @private
 * @param {Object} set The set to modify.
 * @param {*} value The value to add.
 * @returns {Object} Returns `set`.
 */
function addSetEntry$1(set$$1, value) {
    // Don't return `set.add` because it's not chainable in IE 11.
    set$$1.add(value);
    return set$$1;
}

/**
 * Converts `set` to an array of its values.
 *
 * @private
 * @param {Object} set The set to convert.
 * @returns {Array} Returns the values.
 */
function setToArray$1(set$$1) {
    var index = -1,
        result = Array(set$$1.size);

    set$$1.forEach(function (value) {
        result[++index] = value;
    });
    return result;
}

/** Used to compose bitmasks for cloning. */
var CLONE_DEEP_FLAG$3$1 = 1;

/**
 * Creates a clone of `set`.
 *
 * @private
 * @param {Object} set The set to clone.
 * @param {Function} cloneFunc The function to clone values.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned set.
 */
function cloneSet$1(set$$1, isDeep, cloneFunc) {
    var array$$1 = isDeep ? cloneFunc(setToArray$1(set$$1), CLONE_DEEP_FLAG$3$1) : setToArray$1(set$$1);
    return arrayReduce$1(array$$1, addSetEntry$1, new set$$1.constructor());
}

/** Used to convert symbols to primitives and strings. */
var symbolProto$1$1 = _Symbol$1 ? _Symbol$1.prototype : undefined;
var symbolValueOf$1$1 = symbolProto$1$1 ? symbolProto$1$1.valueOf : undefined;

/**
 * Creates a clone of the `symbol` object.
 *
 * @private
 * @param {Object} symbol The symbol object to clone.
 * @returns {Object} Returns the cloned symbol object.
 */
function cloneSymbol$1(symbol$$1) {
    return symbolValueOf$1$1 ? Object(symbolValueOf$1$1.call(symbol$$1)) : {};
}

/**
 * Creates a clone of `typedArray`.
 *
 * @private
 * @param {Object} typedArray The typed array to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned typed array.
 */
function cloneTypedArray$1(typedArray, isDeep) {
    var buffer = isDeep ? cloneArrayBuffer$1(typedArray.buffer) : typedArray.buffer;
    return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
}

/** `Object#toString` result references. */
var boolTag$2$1 = '[object Boolean]';
var dateTag$2$1 = '[object Date]';
var mapTag$3$1 = '[object Map]';
var numberTag$2$1 = '[object Number]';
var regexpTag$2$1 = '[object RegExp]';
var setTag$3$1 = '[object Set]';
var stringTag$2$1 = '[object String]';
var symbolTag$1$1 = '[object Symbol]';

var arrayBufferTag$2$1 = '[object ArrayBuffer]';
var dataViewTag$3$1 = '[object DataView]';
var float32Tag$2$1 = '[object Float32Array]';
var float64Tag$2$1 = '[object Float64Array]';
var int8Tag$2$1 = '[object Int8Array]';
var int16Tag$2$1 = '[object Int16Array]';
var int32Tag$2$1 = '[object Int32Array]';
var uint8Tag$2$1 = '[object Uint8Array]';
var uint8ClampedTag$2$1 = '[object Uint8ClampedArray]';
var uint16Tag$2$1 = '[object Uint16Array]';
var uint32Tag$2$1 = '[object Uint32Array]';

/**
 * Initializes an object clone based on its `toStringTag`.
 *
 * **Note:** This function only supports cloning values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to clone.
 * @param {string} tag The `toStringTag` of the object to clone.
 * @param {Function} cloneFunc The function to clone values.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneByTag$1(object$$1, tag, cloneFunc, isDeep) {
    var Ctor = object$$1.constructor;
    switch (tag) {
        case arrayBufferTag$2$1:
            return cloneArrayBuffer$1(object$$1);

        case boolTag$2$1:
        case dateTag$2$1:
            return new Ctor(+object$$1);

        case dataViewTag$3$1:
            return cloneDataView$1(object$$1, isDeep);

        case float32Tag$2$1:case float64Tag$2$1:
        case int8Tag$2$1:case int16Tag$2$1:case int32Tag$2$1:
        case uint8Tag$2$1:case uint8ClampedTag$2$1:case uint16Tag$2$1:case uint32Tag$2$1:
            return cloneTypedArray$1(object$$1, isDeep);

        case mapTag$3$1:
            return cloneMap$1(object$$1, isDeep, cloneFunc);

        case numberTag$2$1:
        case stringTag$2$1:
            return new Ctor(object$$1);

        case regexpTag$2$1:
            return cloneRegExp$1(object$$1);

        case setTag$3$1:
            return cloneSet$1(object$$1, isDeep, cloneFunc);

        case symbolTag$1$1:
            return cloneSymbol$1(object$$1);
    }
}

/** Built-in value references. */
var objectCreate$1 = Object.create;

/**
 * The base implementation of `_.create` without support for assigning
 * properties to the created object.
 *
 * @private
 * @param {Object} proto The object to inherit from.
 * @returns {Object} Returns the new object.
 */
var baseCreate$1 = function () {
    function object$$1() {}
    return function (proto) {
        if (!isObject$1(proto)) {
            return {};
        }
        if (objectCreate$1) {
            return objectCreate$1(proto);
        }
        object$$1.prototype = proto;
        var result = new object$$1();
        object$$1.prototype = undefined;
        return result;
    };
}();

/**
 * Initializes an object clone.
 *
 * @private
 * @param {Object} object The object to clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneObject$1(object$$1) {
    return typeof object$$1.constructor == 'function' && !isPrototype$1(object$$1) ? baseCreate$1(getPrototype$1(object$$1)) : {};
}

/** Used to compose bitmasks for cloning. */
var CLONE_DEEP_FLAG$1$1 = 1;
var CLONE_FLAT_FLAG$1 = 2;
var CLONE_SYMBOLS_FLAG$1$1 = 4;

/** `Object#toString` result references. */
var argsTag$1$2 = '[object Arguments]';
var arrayTag$1$2 = '[object Array]';
var boolTag$1$2 = '[object Boolean]';
var dateTag$1$2 = '[object Date]';
var errorTag$1$2 = '[object Error]';
var funcTag$1$2 = '[object Function]';
var genTag$1$2 = '[object GeneratorFunction]';
var mapTag$1$2 = '[object Map]';
var numberTag$1$2 = '[object Number]';
var objectTag$1$2 = '[object Object]';
var regexpTag$1$2 = '[object RegExp]';
var setTag$1$2 = '[object Set]';
var stringTag$1$2 = '[object String]';
var symbolTag$1$2 = '[object Symbol]';
var weakMapTag$1$2 = '[object WeakMap]';

var arrayBufferTag$1$2 = '[object ArrayBuffer]';
var dataViewTag$1$2 = '[object DataView]';
var float32Tag$1$2 = '[object Float32Array]';
var float64Tag$1$2 = '[object Float64Array]';
var int8Tag$1$2 = '[object Int8Array]';
var int16Tag$1$2 = '[object Int16Array]';
var int32Tag$1$2 = '[object Int32Array]';
var uint8Tag$1$2 = '[object Uint8Array]';
var uint8ClampedTag$1$2 = '[object Uint8ClampedArray]';
var uint16Tag$1$2 = '[object Uint16Array]';
var uint32Tag$1$2 = '[object Uint32Array]';

/** Used to identify `toStringTag` values supported by `_.clone`. */
var cloneableTags$1 = {};
cloneableTags$1[argsTag$1$2] = cloneableTags$1[arrayTag$1$2] = cloneableTags$1[arrayBufferTag$1$2] = cloneableTags$1[dataViewTag$1$2] = cloneableTags$1[boolTag$1$2] = cloneableTags$1[dateTag$1$2] = cloneableTags$1[float32Tag$1$2] = cloneableTags$1[float64Tag$1$2] = cloneableTags$1[int8Tag$1$2] = cloneableTags$1[int16Tag$1$2] = cloneableTags$1[int32Tag$1$2] = cloneableTags$1[mapTag$1$2] = cloneableTags$1[numberTag$1$2] = cloneableTags$1[objectTag$1$2] = cloneableTags$1[regexpTag$1$2] = cloneableTags$1[setTag$1$2] = cloneableTags$1[stringTag$1$2] = cloneableTags$1[symbolTag$1$2] = cloneableTags$1[uint8Tag$1$2] = cloneableTags$1[uint8ClampedTag$1$2] = cloneableTags$1[uint16Tag$1$2] = cloneableTags$1[uint32Tag$1$2] = true;
cloneableTags$1[errorTag$1$2] = cloneableTags$1[funcTag$1$2] = cloneableTags$1[weakMapTag$1$2] = false;

/**
 * The base implementation of `_.clone` and `_.cloneDeep` which tracks
 * traversed objects.
 *
 * @private
 * @param {*} value The value to clone.
 * @param {boolean} bitmask The bitmask flags.
 *  1 - Deep clone
 *  2 - Flatten inherited properties
 *  4 - Clone symbols
 * @param {Function} [customizer] The function to customize cloning.
 * @param {string} [key] The key of `value`.
 * @param {Object} [object] The parent object of `value`.
 * @param {Object} [stack] Tracks traversed objects and their clone counterparts.
 * @returns {*} Returns the cloned value.
 */
function baseClone$1(value, bitmask, customizer, key, object$$1, stack$$1) {
    var result,
        isDeep = bitmask & CLONE_DEEP_FLAG$1$1,
        isFlat = bitmask & CLONE_FLAT_FLAG$1,
        isFull = bitmask & CLONE_SYMBOLS_FLAG$1$1;

    if (customizer) {
        result = object$$1 ? customizer(value, key, object$$1, stack$$1) : customizer(value);
    }
    if (result !== undefined) {
        return result;
    }
    if (!isObject$1(value)) {
        return value;
    }
    var isArr = isArray$1(value);
    if (isArr) {
        result = initCloneArray$1(value);
        if (!isDeep) {
            return copyArray$1(value, result);
        }
    } else {
        var tag = getTag$1$2(value),
            isFunc = tag == funcTag$1$2 || tag == genTag$1$2;

        if (isBuffer$1(value)) {
            return cloneBuffer$1(value, isDeep);
        }
        if (tag == objectTag$1$2 || tag == argsTag$1$2 || isFunc && !object$$1) {
            result = isFlat || isFunc ? {} : initCloneObject$1(value);
            if (!isDeep) {
                return isFlat ? copySymbolsIn$1(value, baseAssignIn$1(result, value)) : copySymbols$1(value, baseAssign$1(result, value));
            }
        } else {
            if (!cloneableTags$1[tag]) {
                return object$$1 ? value : {};
            }
            result = initCloneByTag$1(value, tag, baseClone$1, isDeep);
        }
    }
    // Check for circular references and return its corresponding clone.
    stack$$1 || (stack$$1 = new Stack$1());
    var stacked = stack$$1.get(value);
    if (stacked) {
        return stacked;
    }
    stack$$1.set(value, result);

    var keysFunc = isFull ? isFlat ? getAllKeysIn$1 : getAllKeys$1 : isFlat ? keysIn : keys$2;

    var props = isArr ? undefined : keysFunc(value);
    arrayEach$1(props || value, function (subValue, key) {
        if (props) {
            key = subValue;
            subValue = value[key];
        }
        // Recursively populate clone (susceptible to call stack limits).
        assignValue$1(result, key, baseClone$1(subValue, bitmask, customizer, key, value, stack$$1));
    });
    return result;
}

/** Used to compose bitmasks for cloning. */
var CLONE_DEEP_FLAG$1$2 = 1;
var CLONE_SYMBOLS_FLAG$1$2 = 4;

/**
 * This method is like `_.clone` except that it recursively clones `value`.
 *
 * @static
 * @memberOf _
 * @since 1.0.0
 * @category Lang
 * @param {*} value The value to recursively clone.
 * @returns {*} Returns the deep cloned value.
 * @see _.clone
 * @example
 *
 * var objects = [{ 'a': 1 }, { 'b': 2 }];
 *
 * var deep = _.cloneDeep(objects);
 * console.log(deep[0] === objects[0]);
 * // => false
 */
function cloneDeep$1(value) {
    return baseClone$1(value, CLONE_DEEP_FLAG$1$2 | CLONE_SYMBOLS_FLAG$1$2);
}

/** Used for built-in method references. */
var objectProto$13$1 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$10$1 = objectProto$13$1.hasOwnProperty;

/**
 * The base implementation of `_.has` without support for deep paths.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {Array|string} key The key to check.
 * @returns {boolean} Returns `true` if `key` exists, else `false`.
 */
function baseHas(object$$1, key) {
    return object$$1 != null && hasOwnProperty$10$1.call(object$$1, key);
}

/** `Object#toString` result references. */
var symbolTag$2$1 = '[object Symbol]';

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol$1(value) {
    return (typeof value === 'undefined' ? 'undefined' : _typeof$2(value)) == 'symbol' || isObjectLike$1(value) && baseGetTag$1(value) == symbolTag$2$1;
}

/** Used to match property names within property paths. */
var reIsDeepProp$1 = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/;
var reIsPlainProp$1 = /^\w*$/;

/**
 * Checks if `value` is a property name and not a property path.
 *
 * @private
 * @param {*} value The value to check.
 * @param {Object} [object] The object to query keys on.
 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
 */
function isKey$1(value, object$$1) {
    if (isArray$1(value)) {
        return false;
    }
    var type = typeof value === 'undefined' ? 'undefined' : _typeof$2(value);
    if (type == 'number' || type == 'symbol' || type == 'boolean' || value == null || isSymbol$1(value)) {
        return true;
    }
    return reIsPlainProp$1.test(value) || !reIsDeepProp$1.test(value) || object$$1 != null && value in Object(object$$1);
}

/** Error message constants. */
var FUNC_ERROR_TEXT$1 = 'Expected a function';

/**
 * Creates a function that memoizes the result of `func`. If `resolver` is
 * provided, it determines the cache key for storing the result based on the
 * arguments provided to the memoized function. By default, the first argument
 * provided to the memoized function is used as the map cache key. The `func`
 * is invoked with the `this` binding of the memoized function.
 *
 * **Note:** The cache is exposed as the `cache` property on the memoized
 * function. Its creation may be customized by replacing the `_.memoize.Cache`
 * constructor with one whose instances implement the
 * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
 * method interface of `clear`, `delete`, `get`, `has`, and `set`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to have its output memoized.
 * @param {Function} [resolver] The function to resolve the cache key.
 * @returns {Function} Returns the new memoized function.
 * @example
 *
 * var object = { 'a': 1, 'b': 2 };
 * var other = { 'c': 3, 'd': 4 };
 *
 * var values = _.memoize(_.values);
 * values(object);
 * // => [1, 2]
 *
 * values(other);
 * // => [3, 4]
 *
 * object.a = 2;
 * values(object);
 * // => [1, 2]
 *
 * // Modify the result cache.
 * values.cache.set(object, ['a', 'b']);
 * values(object);
 * // => ['a', 'b']
 *
 * // Replace `_.memoize.Cache`.
 * _.memoize.Cache = WeakMap;
 */
function memoize$1(func, resolver) {
    if (typeof func != 'function' || resolver != null && typeof resolver != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT$1);
    }
    var memoized = function memoized() {
        var args = arguments,
            key = resolver ? resolver.apply(this, args) : args[0],
            cache = memoized.cache;

        if (cache.has(key)) {
            return cache.get(key);
        }
        var result = func.apply(this, args);
        memoized.cache = cache.set(key, result) || cache;
        return result;
    };
    memoized.cache = new (memoize$1.Cache || MapCache$1)();
    return memoized;
}

// Expose `MapCache`.
memoize$1.Cache = MapCache$1;

/** Used as the maximum memoize cache size. */
var MAX_MEMOIZE_SIZE$1 = 500;

/**
 * A specialized version of `_.memoize` which clears the memoized function's
 * cache when it exceeds `MAX_MEMOIZE_SIZE`.
 *
 * @private
 * @param {Function} func The function to have its output memoized.
 * @returns {Function} Returns the new memoized function.
 */
function memoizeCapped$1(func) {
    var result = memoize$1(func, function (key) {
        if (cache.size === MAX_MEMOIZE_SIZE$1) {
            cache.clear();
        }
        return key;
    });

    var cache = result.cache;
    return result;
}

/** Used to match property names within property paths. */
var reLeadingDot$1 = /^\./;
var rePropName$1 = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

/** Used to match backslashes in property paths. */
var reEscapeChar$1 = /\\(\\)?/g;

/**
 * Converts `string` to a property path array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the property path array.
 */
var stringToPath$1 = memoizeCapped$1(function (string) {
    var result = [];
    if (reLeadingDot$1.test(string)) {
        result.push('');
    }
    string.replace(rePropName$1, function (match, number, quote, string) {
        result.push(quote ? string.replace(reEscapeChar$1, '$1') : number || match);
    });
    return result;
});

/**
 * A specialized version of `_.map` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function arrayMap$1(array$$1, iteratee) {
    var index = -1,
        length = array$$1 == null ? 0 : array$$1.length,
        result = Array(length);

    while (++index < length) {
        result[index] = iteratee(array$$1[index], index, array$$1);
    }
    return result;
}

/** Used as references for various `Number` constants. */
var INFINITY$1$1 = 1 / 0;

/** Used to convert symbols to primitives and strings. */
var symbolProto$1$2 = _Symbol$1 ? _Symbol$1.prototype : undefined;
var symbolToString$1 = symbolProto$1$2 ? symbolProto$1$2.toString : undefined;

/**
 * The base implementation of `_.toString` which doesn't convert nullish
 * values to empty strings.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString$1(value) {
    // Exit early for strings to avoid a performance hit in some environments.
    if (typeof value == 'string') {
        return value;
    }
    if (isArray$1(value)) {
        // Recursively convert values (susceptible to call stack limits).
        return arrayMap$1(value, baseToString$1) + '';
    }
    if (isSymbol$1(value)) {
        return symbolToString$1 ? symbolToString$1.call(value) : '';
    }
    var result = value + '';
    return result == '0' && 1 / value == -INFINITY$1$1 ? '-0' : result;
}

/**
 * Converts `value` to a string. An empty string is returned for `null`
 * and `undefined` values. The sign of `-0` is preserved.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 * @example
 *
 * _.toString(null);
 * // => ''
 *
 * _.toString(-0);
 * // => '-0'
 *
 * _.toString([1, 2, 3]);
 * // => '1,2,3'
 */
function toString$1(value) {
    return value == null ? '' : baseToString$1(value);
}

/**
 * Casts `value` to a path array if it's not one.
 *
 * @private
 * @param {*} value The value to inspect.
 * @param {Object} [object] The object to query keys on.
 * @returns {Array} Returns the cast property path array.
 */
function castPath$1(value, object$$1) {
    if (isArray$1(value)) {
        return value;
    }
    return isKey$1(value, object$$1) ? [value] : stringToPath$1(toString$1(value));
}

/** Used as references for various `Number` constants. */
var INFINITY$1$2 = 1 / 0;

/**
 * Converts `value` to a string key if it's not a string or symbol.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {string|symbol} Returns the key.
 */
function toKey$1(value) {
    if (typeof value == 'string' || isSymbol$1(value)) {
        return value;
    }
    var result = value + '';
    return result == '0' && 1 / value == -INFINITY$1$2 ? '-0' : result;
}

/**
 * Checks if `path` exists on `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} path The path to check.
 * @param {Function} hasFunc The function to check properties.
 * @returns {boolean} Returns `true` if `path` exists, else `false`.
 */
function hasPath$1(object$$1, path, hasFunc) {
    path = castPath$1(path, object$$1);

    var index = -1,
        length = path.length,
        result = false;

    while (++index < length) {
        var key = toKey$1(path[index]);
        if (!(result = object$$1 != null && hasFunc(object$$1, key))) {
            break;
        }
        object$$1 = object$$1[key];
    }
    if (result || ++index != length) {
        return result;
    }
    length = object$$1 == null ? 0 : object$$1.length;
    return !!length && isLength$1(length) && isIndex$1(key, length) && (isArray$1(object$$1) || isArguments$1(object$$1));
}

/**
 * Checks if `path` is a direct property of `object`.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path to check.
 * @returns {boolean} Returns `true` if `path` exists, else `false`.
 * @example
 *
 * var object = { 'a': { 'b': 2 } };
 * var other = _.create({ 'a': _.create({ 'b': 2 }) });
 *
 * _.has(object, 'a');
 * // => true
 *
 * _.has(object, 'a.b');
 * // => true
 *
 * _.has(object, ['a', 'b']);
 * // => true
 *
 * _.has(other, 'a');
 * // => false
 */
function has(object$$1, path) {
    return object$$1 != null && hasPath$1(object$$1, path, baseHas);
}

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED$2$1 = '__lodash_hash_undefined__';

/**
 * Adds `value` to the array cache.
 *
 * @private
 * @name add
 * @memberOf SetCache
 * @alias push
 * @param {*} value The value to cache.
 * @returns {Object} Returns the cache instance.
 */
function setCacheAdd$1(value) {
    this.__data__.set(value, HASH_UNDEFINED$2$1);
    return this;
}

/**
 * Checks if `value` is in the array cache.
 *
 * @private
 * @name has
 * @memberOf SetCache
 * @param {*} value The value to search for.
 * @returns {number} Returns `true` if `value` is found, else `false`.
 */
function setCacheHas$1(value) {
    return this.__data__.has(value);
}

/**
 *
 * Creates an array cache object to store unique values.
 *
 * @private
 * @constructor
 * @param {Array} [values] The values to cache.
 */
function SetCache$1(values$$1) {
    var index = -1,
        length = values$$1 == null ? 0 : values$$1.length;

    this.__data__ = new MapCache$1();
    while (++index < length) {
        this.add(values$$1[index]);
    }
}

// Add methods to `SetCache`.
SetCache$1.prototype.add = SetCache$1.prototype.push = setCacheAdd$1;
SetCache$1.prototype.has = setCacheHas$1;

/**
 * A specialized version of `_.some` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if any element passes the predicate check,
 *  else `false`.
 */
function arraySome$1(array$$1, predicate) {
    var index = -1,
        length = array$$1 == null ? 0 : array$$1.length;

    while (++index < length) {
        if (predicate(array$$1[index], index, array$$1)) {
            return true;
        }
    }
    return false;
}

/**
 * Checks if a `cache` value for `key` exists.
 *
 * @private
 * @param {Object} cache The cache to query.
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function cacheHas$1(cache, key) {
    return cache.has(key);
}

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG$2$1 = 1;
var COMPARE_UNORDERED_FLAG$1$1 = 2;

/**
 * A specialized version of `baseIsEqualDeep` for arrays with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Array} array The array to compare.
 * @param {Array} other The other array to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `array` and `other` objects.
 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
 */
function equalArrays$1(array$$1, other, bitmask, customizer, equalFunc, stack$$1) {
    var isPartial = bitmask & COMPARE_PARTIAL_FLAG$2$1,
        arrLength = array$$1.length,
        othLength = other.length;

    if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
        return false;
    }
    // Assume cyclic values are equal.
    var stacked = stack$$1.get(array$$1);
    if (stacked && stack$$1.get(other)) {
        return stacked == other;
    }
    var index = -1,
        result = true,
        seen = bitmask & COMPARE_UNORDERED_FLAG$1$1 ? new SetCache$1() : undefined;

    stack$$1.set(array$$1, other);
    stack$$1.set(other, array$$1);

    // Ignore non-index properties.
    while (++index < arrLength) {
        var arrValue = array$$1[index],
            othValue = other[index];

        if (customizer) {
            var compared = isPartial ? customizer(othValue, arrValue, index, other, array$$1, stack$$1) : customizer(arrValue, othValue, index, array$$1, other, stack$$1);
        }
        if (compared !== undefined) {
            if (compared) {
                continue;
            }
            result = false;
            break;
        }
        // Recursively compare arrays (susceptible to call stack limits).
        if (seen) {
            if (!arraySome$1(other, function (othValue, othIndex) {
                if (!cacheHas$1(seen, othIndex) && (arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack$$1))) {
                    return seen.push(othIndex);
                }
            })) {
                result = false;
                break;
            }
        } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack$$1))) {
            result = false;
            break;
        }
    }
    stack$$1['delete'](array$$1);
    stack$$1['delete'](other);
    return result;
}

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG$3$1 = 1;
var COMPARE_UNORDERED_FLAG$2$1 = 2;

/** `Object#toString` result references. */
var boolTag$3$1 = '[object Boolean]';
var dateTag$3$1 = '[object Date]';
var errorTag$2$1 = '[object Error]';
var mapTag$4$1 = '[object Map]';
var numberTag$3$1 = '[object Number]';
var regexpTag$3$1 = '[object RegExp]';
var setTag$4$1 = '[object Set]';
var stringTag$3$1 = '[object String]';
var symbolTag$3$1 = '[object Symbol]';

var arrayBufferTag$3$1 = '[object ArrayBuffer]';
var dataViewTag$4$1 = '[object DataView]';

/** Used to convert symbols to primitives and strings. */
var symbolProto$2$1 = _Symbol$1 ? _Symbol$1.prototype : undefined;
var symbolValueOf$1$2 = symbolProto$2$1 ? symbolProto$2$1.valueOf : undefined;

/**
 * A specialized version of `baseIsEqualDeep` for comparing objects of
 * the same `toStringTag`.
 *
 * **Note:** This function only supports comparing values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {string} tag The `toStringTag` of the objects to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalByTag$1(object$$1, other, tag, bitmask, customizer, equalFunc, stack$$1) {
    switch (tag) {
        case dataViewTag$4$1:
            if (object$$1.byteLength != other.byteLength || object$$1.byteOffset != other.byteOffset) {
                return false;
            }
            object$$1 = object$$1.buffer;
            other = other.buffer;

        case arrayBufferTag$3$1:
            if (object$$1.byteLength != other.byteLength || !equalFunc(new Uint8Array$1(object$$1), new Uint8Array$1(other))) {
                return false;
            }
            return true;

        case boolTag$3$1:
        case dateTag$3$1:
        case numberTag$3$1:
            // Coerce booleans to `1` or `0` and dates to milliseconds.
            // Invalid dates are coerced to `NaN`.
            return eq$1(+object$$1, +other);

        case errorTag$2$1:
            return object$$1.name == other.name && object$$1.message == other.message;

        case regexpTag$3$1:
        case stringTag$3$1:
            // Coerce regexes to strings and treat strings, primitives and objects,
            // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
            // for more details.
            return object$$1 == other + '';

        case mapTag$4$1:
            var convert = mapToArray$1;

        case setTag$4$1:
            var isPartial = bitmask & COMPARE_PARTIAL_FLAG$3$1;
            convert || (convert = setToArray$1);

            if (object$$1.size != other.size && !isPartial) {
                return false;
            }
            // Assume cyclic values are equal.
            var stacked = stack$$1.get(object$$1);
            if (stacked) {
                return stacked == other;
            }
            bitmask |= COMPARE_UNORDERED_FLAG$2$1;

            // Recursively compare objects (susceptible to call stack limits).
            stack$$1.set(object$$1, other);
            var result = equalArrays$1(convert(object$$1), convert(other), bitmask, customizer, equalFunc, stack$$1);
            stack$$1['delete'](object$$1);
            return result;

        case symbolTag$3$1:
            if (symbolValueOf$1$2) {
                return symbolValueOf$1$2.call(object$$1) == symbolValueOf$1$2.call(other);
            }
    }
    return false;
}

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG$4$1 = 1;

/** Used for built-in method references. */
var objectProto$15$1 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$12$1 = objectProto$15$1.hasOwnProperty;

/**
 * A specialized version of `baseIsEqualDeep` for objects with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalObjects$1(object$$1, other, bitmask, customizer, equalFunc, stack$$1) {
    var isPartial = bitmask & COMPARE_PARTIAL_FLAG$4$1,
        objProps = getAllKeys$1(object$$1),
        objLength = objProps.length,
        othProps = getAllKeys$1(other),
        othLength = othProps.length;

    if (objLength != othLength && !isPartial) {
        return false;
    }
    var index = objLength;
    while (index--) {
        var key = objProps[index];
        if (!(isPartial ? key in other : hasOwnProperty$12$1.call(other, key))) {
            return false;
        }
    }
    // Assume cyclic values are equal.
    var stacked = stack$$1.get(object$$1);
    if (stacked && stack$$1.get(other)) {
        return stacked == other;
    }
    var result = true;
    stack$$1.set(object$$1, other);
    stack$$1.set(other, object$$1);

    var skipCtor = isPartial;
    while (++index < objLength) {
        key = objProps[index];
        var objValue = object$$1[key],
            othValue = other[key];

        if (customizer) {
            var compared = isPartial ? customizer(othValue, objValue, key, other, object$$1, stack$$1) : customizer(objValue, othValue, key, object$$1, other, stack$$1);
        }
        // Recursively compare objects (susceptible to call stack limits).
        if (!(compared === undefined ? objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack$$1) : compared)) {
            result = false;
            break;
        }
        skipCtor || (skipCtor = key == 'constructor');
    }
    if (result && !skipCtor) {
        var objCtor = object$$1.constructor,
            othCtor = other.constructor;

        // Non `Object` object instances with different constructors are not equal.
        if (objCtor != othCtor && 'constructor' in object$$1 && 'constructor' in other && !(typeof objCtor == 'function' && objCtor instanceof objCtor && typeof othCtor == 'function' && othCtor instanceof othCtor)) {
            result = false;
        }
    }
    stack$$1['delete'](object$$1);
    stack$$1['delete'](other);
    return result;
}

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG$1$1 = 1;

/** `Object#toString` result references. */
var argsTag$3$1 = '[object Arguments]';
var arrayTag$2$1 = '[object Array]';
var objectTag$3$1 = '[object Object]';

/** Used for built-in method references. */
var objectProto$14$1 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$11$1 = objectProto$14$1.hasOwnProperty;

/**
 * A specialized version of `baseIsEqual` for arrays and objects which performs
 * deep comparisons and tracks traversed objects enabling objects with circular
 * references to be compared.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} [stack] Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function baseIsEqualDeep$1(object$$1, other, bitmask, customizer, equalFunc, stack$$1) {
    var objIsArr = isArray$1(object$$1),
        othIsArr = isArray$1(other),
        objTag = objIsArr ? arrayTag$2$1 : getTag$1$2(object$$1),
        othTag = othIsArr ? arrayTag$2$1 : getTag$1$2(other);

    objTag = objTag == argsTag$3$1 ? objectTag$3$1 : objTag;
    othTag = othTag == argsTag$3$1 ? objectTag$3$1 : othTag;

    var objIsObj = objTag == objectTag$3$1,
        othIsObj = othTag == objectTag$3$1,
        isSameTag = objTag == othTag;

    if (isSameTag && isBuffer$1(object$$1)) {
        if (!isBuffer$1(other)) {
            return false;
        }
        objIsArr = true;
        objIsObj = false;
    }
    if (isSameTag && !objIsObj) {
        stack$$1 || (stack$$1 = new Stack$1());
        return objIsArr || isTypedArray$1(object$$1) ? equalArrays$1(object$$1, other, bitmask, customizer, equalFunc, stack$$1) : equalByTag$1(object$$1, other, objTag, bitmask, customizer, equalFunc, stack$$1);
    }
    if (!(bitmask & COMPARE_PARTIAL_FLAG$1$1)) {
        var objIsWrapped = objIsObj && hasOwnProperty$11$1.call(object$$1, '__wrapped__'),
            othIsWrapped = othIsObj && hasOwnProperty$11$1.call(other, '__wrapped__');

        if (objIsWrapped || othIsWrapped) {
            var objUnwrapped = objIsWrapped ? object$$1.value() : object$$1,
                othUnwrapped = othIsWrapped ? other.value() : other;

            stack$$1 || (stack$$1 = new Stack$1());
            return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack$$1);
        }
    }
    if (!isSameTag) {
        return false;
    }
    stack$$1 || (stack$$1 = new Stack$1());
    return equalObjects$1(object$$1, other, bitmask, customizer, equalFunc, stack$$1);
}

/**
 * The base implementation of `_.isEqual` which supports partial comparisons
 * and tracks traversed objects.
 *
 * @private
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @param {boolean} bitmask The bitmask flags.
 *  1 - Unordered comparison
 *  2 - Partial comparison
 * @param {Function} [customizer] The function to customize comparisons.
 * @param {Object} [stack] Tracks traversed `value` and `other` objects.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 */
function baseIsEqual$1(value, other, bitmask, customizer, stack$$1) {
    if (value === other) {
        return true;
    }
    if (value == null || other == null || !isObjectLike$1(value) && !isObjectLike$1(other)) {
        return value !== value && other !== other;
    }
    return baseIsEqualDeep$1(value, other, bitmask, customizer, baseIsEqual$1, stack$$1);
}

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG$1$2 = 1;
var COMPARE_UNORDERED_FLAG$1$2 = 2;

/**
 * The base implementation of `_.isMatch` without support for iteratee shorthands.
 *
 * @private
 * @param {Object} object The object to inspect.
 * @param {Object} source The object of property values to match.
 * @param {Array} matchData The property names, values, and compare flags to match.
 * @param {Function} [customizer] The function to customize comparisons.
 * @returns {boolean} Returns `true` if `object` is a match, else `false`.
 */
function baseIsMatch$1(object$$1, source, matchData, customizer) {
    var index = matchData.length,
        length = index,
        noCustomizer = !customizer;

    if (object$$1 == null) {
        return !length;
    }
    object$$1 = Object(object$$1);
    while (index--) {
        var data = matchData[index];
        if (noCustomizer && data[2] ? data[1] !== object$$1[data[0]] : !(data[0] in object$$1)) {
            return false;
        }
    }
    while (++index < length) {
        data = matchData[index];
        var key = data[0],
            objValue = object$$1[key],
            srcValue = data[1];

        if (noCustomizer && data[2]) {
            if (objValue === undefined && !(key in object$$1)) {
                return false;
            }
        } else {
            var stack$$1 = new Stack$1();
            if (customizer) {
                var result = customizer(objValue, srcValue, key, object$$1, source, stack$$1);
            }
            if (!(result === undefined ? baseIsEqual$1(srcValue, objValue, COMPARE_PARTIAL_FLAG$1$2 | COMPARE_UNORDERED_FLAG$1$2, customizer, stack$$1) : result)) {
                return false;
            }
        }
    }
    return true;
}

/**
 * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` if suitable for strict
 *  equality comparisons, else `false`.
 */
function isStrictComparable$1(value) {
    return value === value && !isObject$1(value);
}

/**
 * Gets the property names, values, and compare flags of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the match data of `object`.
 */
function getMatchData$1(object$$1) {
    var result = keys$2(object$$1),
        length = result.length;

    while (length--) {
        var key = result[length],
            value = object$$1[key];

        result[length] = [key, value, isStrictComparable$1(value)];
    }
    return result;
}

/**
 * A specialized version of `matchesProperty` for source values suitable
 * for strict equality comparisons, i.e. `===`.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @param {*} srcValue The value to match.
 * @returns {Function} Returns the new spec function.
 */
function matchesStrictComparable$1(key, srcValue) {
    return function (object$$1) {
        if (object$$1 == null) {
            return false;
        }
        return object$$1[key] === srcValue && (srcValue !== undefined || key in Object(object$$1));
    };
}

/**
 * The base implementation of `_.matches` which doesn't clone `source`.
 *
 * @private
 * @param {Object} source The object of property values to match.
 * @returns {Function} Returns the new spec function.
 */
function baseMatches$1(source) {
    var matchData = getMatchData$1(source);
    if (matchData.length == 1 && matchData[0][2]) {
        return matchesStrictComparable$1(matchData[0][0], matchData[0][1]);
    }
    return function (object$$1) {
        return object$$1 === source || baseIsMatch$1(object$$1, source, matchData);
    };
}

/**
 * The base implementation of `_.get` without support for default values.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to get.
 * @returns {*} Returns the resolved value.
 */
function baseGet$1(object$$1, path) {
    path = castPath$1(path, object$$1);

    var index = 0,
        length = path.length;

    while (object$$1 != null && index < length) {
        object$$1 = object$$1[toKey$1(path[index++])];
    }
    return index && index == length ? object$$1 : undefined;
}

/**
 * Gets the value at `path` of `object`. If the resolved value is
 * `undefined`, the `defaultValue` is returned in its place.
 *
 * @static
 * @memberOf _
 * @since 3.7.0
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to get.
 * @param {*} [defaultValue] The value returned for `undefined` resolved values.
 * @returns {*} Returns the resolved value.
 * @example
 *
 * var object = { 'a': [{ 'b': { 'c': 3 } }] };
 *
 * _.get(object, 'a[0].b.c');
 * // => 3
 *
 * _.get(object, ['a', '0', 'b', 'c']);
 * // => 3
 *
 * _.get(object, 'a.b.c', 'default');
 * // => 'default'
 */
function get$1$2(object$$1, path, defaultValue) {
    var result = object$$1 == null ? undefined : baseGet$1(object$$1, path);
    return result === undefined ? defaultValue : result;
}

/**
 * The base implementation of `_.hasIn` without support for deep paths.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {Array|string} key The key to check.
 * @returns {boolean} Returns `true` if `key` exists, else `false`.
 */
function baseHasIn$1(object$$1, key) {
    return object$$1 != null && key in Object(object$$1);
}

/**
 * Checks if `path` is a direct or inherited property of `object`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path to check.
 * @returns {boolean} Returns `true` if `path` exists, else `false`.
 * @example
 *
 * var object = _.create({ 'a': _.create({ 'b': 2 }) });
 *
 * _.hasIn(object, 'a');
 * // => true
 *
 * _.hasIn(object, 'a.b');
 * // => true
 *
 * _.hasIn(object, ['a', 'b']);
 * // => true
 *
 * _.hasIn(object, 'b');
 * // => false
 */
function hasIn$1(object$$1, path) {
    return object$$1 != null && hasPath$1(object$$1, path, baseHasIn$1);
}

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG$5$1 = 1;
var COMPARE_UNORDERED_FLAG$3$1 = 2;

/**
 * The base implementation of `_.matchesProperty` which doesn't clone `srcValue`.
 *
 * @private
 * @param {string} path The path of the property to get.
 * @param {*} srcValue The value to match.
 * @returns {Function} Returns the new spec function.
 */
function baseMatchesProperty$1(path, srcValue) {
    if (isKey$1(path) && isStrictComparable$1(srcValue)) {
        return matchesStrictComparable$1(toKey$1(path), srcValue);
    }
    return function (object$$1) {
        var objValue = get$1$2(object$$1, path);
        return objValue === undefined && objValue === srcValue ? hasIn$1(object$$1, path) : baseIsEqual$1(srcValue, objValue, COMPARE_PARTIAL_FLAG$5$1 | COMPARE_UNORDERED_FLAG$3$1);
    };
}

/**
 * This method returns the first argument it receives.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Util
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'a': 1 };
 *
 * console.log(_.identity(object) === object);
 * // => true
 */
function identity$5(value) {
    return value;
}

/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new accessor function.
 */
function baseProperty$1(key) {
    return function (object$$1) {
        return object$$1 == null ? undefined : object$$1[key];
    };
}

/**
 * A specialized version of `baseProperty` which supports deep paths.
 *
 * @private
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new accessor function.
 */
function basePropertyDeep$1(path) {
    return function (object$$1) {
        return baseGet$1(object$$1, path);
    };
}

/**
 * Creates a function that returns the value at `path` of a given object.
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Util
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new accessor function.
 * @example
 *
 * var objects = [
 *   { 'a': { 'b': 2 } },
 *   { 'a': { 'b': 1 } }
 * ];
 *
 * _.map(objects, _.property('a.b'));
 * // => [2, 1]
 *
 * _.map(_.sortBy(objects, _.property(['a', 'b'])), 'a.b');
 * // => [1, 2]
 */
function property$1(path) {
    return isKey$1(path) ? baseProperty$1(toKey$1(path)) : basePropertyDeep$1(path);
}

/**
 * The base implementation of `_.iteratee`.
 *
 * @private
 * @param {*} [value=_.identity] The value to convert to an iteratee.
 * @returns {Function} Returns the iteratee.
 */
function baseIteratee$1(value) {
    // Don't store the `typeof` result in a variable to avoid a JIT bug in Safari 9.
    // See https://bugs.webkit.org/show_bug.cgi?id=156034 for more details.
    if (typeof value == 'function') {
        return value;
    }
    if (value == null) {
        return identity$5;
    }
    if ((typeof value === 'undefined' ? 'undefined' : _typeof$2(value)) == 'object') {
        return isArray$1(value) ? baseMatchesProperty$1(value[0], value[1]) : baseMatches$1(value);
    }
    return property$1(value);
}

/**
 * Creates a `_.find` or `_.findLast` function.
 *
 * @private
 * @param {Function} findIndexFunc The function to find the collection index.
 * @returns {Function} Returns the new find function.
 */
function createFind(findIndexFunc) {
    return function (collection, predicate, fromIndex) {
        var iterable = Object(collection);
        if (!isArrayLike$1(collection)) {
            var iteratee = baseIteratee$1(predicate, 3);
            collection = keys$2(collection);
            predicate = function predicate(key) {
                return iteratee(iterable[key], key, iterable);
            };
        }
        var index = findIndexFunc(collection, predicate, fromIndex);
        return index > -1 ? iterable[iteratee ? collection[index] : index] : undefined;
    };
}

/**
 * The base implementation of `_.findIndex` and `_.findLastIndex` without
 * support for iteratee shorthands.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Function} predicate The function invoked per iteration.
 * @param {number} fromIndex The index to search from.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseFindIndex(array$$1, predicate, fromIndex, fromRight) {
    var length = array$$1.length,
        index = fromIndex + (fromRight ? 1 : -1);

    while (fromRight ? index-- : ++index < length) {
        if (predicate(array$$1[index], index, array$$1)) {
            return index;
        }
    }
    return -1;
}

/** Used as references for various `Number` constants. */
var NAN = 0 / 0;

/** Used to match leading and trailing whitespace. */
var reTrim = /^\s+|\s+$/g;

/** Used to detect bad signed hexadecimal string values. */
var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

/** Used to detect binary string values. */
var reIsBinary = /^0b[01]+$/i;

/** Used to detect octal string values. */
var reIsOctal = /^0o[0-7]+$/i;

/** Built-in method references without a dependency on `root`. */
var freeParseInt = parseInt;

/**
 * Converts `value` to a number.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {number} Returns the number.
 * @example
 *
 * _.toNumber(3.2);
 * // => 3.2
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3.2');
 * // => 3.2
 */
function toNumber(value) {
    if (typeof value == 'number') {
        return value;
    }
    if (isSymbol$1(value)) {
        return NAN;
    }
    if (isObject$1(value)) {
        var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
        value = isObject$1(other) ? other + '' : other;
    }
    if (typeof value != 'string') {
        return value === 0 ? value : +value;
    }
    value = value.replace(reTrim, '');
    var isBinary = reIsBinary.test(value);
    return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
}

/** Used as references for various `Number` constants. */
var INFINITY$2 = 1 / 0;
var MAX_INTEGER = 1.7976931348623157e+308;

/**
 * Converts `value` to a finite number.
 *
 * @static
 * @memberOf _
 * @since 4.12.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {number} Returns the converted number.
 * @example
 *
 * _.toFinite(3.2);
 * // => 3.2
 *
 * _.toFinite(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toFinite(Infinity);
 * // => 1.7976931348623157e+308
 *
 * _.toFinite('3.2');
 * // => 3.2
 */
function toFinite(value) {
    if (!value) {
        return value === 0 ? value : 0;
    }
    value = toNumber(value);
    if (value === INFINITY$2 || value === -INFINITY$2) {
        var sign = value < 0 ? -1 : 1;
        return sign * MAX_INTEGER;
    }
    return value === value ? value : 0;
}

/**
 * Converts `value` to an integer.
 *
 * **Note:** This method is loosely based on
 * [`ToInteger`](http://www.ecma-international.org/ecma-262/7.0/#sec-tointeger).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {number} Returns the converted integer.
 * @example
 *
 * _.toInteger(3.2);
 * // => 3
 *
 * _.toInteger(Number.MIN_VALUE);
 * // => 0
 *
 * _.toInteger(Infinity);
 * // => 1.7976931348623157e+308
 *
 * _.toInteger('3.2');
 * // => 3
 */
function toInteger(value) {
    var result = toFinite(value),
        remainder = result % 1;

    return result === result ? remainder ? result - remainder : result : 0;
}

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax$1 = Math.max;

/**
 * This method is like `_.find` except that it returns the index of the first
 * element `predicate` returns truthy for instead of the element itself.
 *
 * @static
 * @memberOf _
 * @since 1.1.0
 * @category Array
 * @param {Array} array The array to inspect.
 * @param {Function} [predicate=_.identity] The function invoked per iteration.
 * @param {number} [fromIndex=0] The index to search from.
 * @returns {number} Returns the index of the found element, else `-1`.
 * @example
 *
 * var users = [
 *   { 'user': 'barney',  'active': false },
 *   { 'user': 'fred',    'active': false },
 *   { 'user': 'pebbles', 'active': true }
 * ];
 *
 * _.findIndex(users, function(o) { return o.user == 'barney'; });
 * // => 0
 *
 * // The `_.matches` iteratee shorthand.
 * _.findIndex(users, { 'user': 'fred', 'active': false });
 * // => 1
 *
 * // The `_.matchesProperty` iteratee shorthand.
 * _.findIndex(users, ['active', false]);
 * // => 0
 *
 * // The `_.property` iteratee shorthand.
 * _.findIndex(users, 'active');
 * // => 2
 */
function findIndex(array$$1, predicate, fromIndex) {
    var length = array$$1 == null ? 0 : array$$1.length;
    if (!length) {
        return -1;
    }
    var index = fromIndex == null ? 0 : toInteger(fromIndex);
    if (index < 0) {
        index = nativeMax$1(length + index, 0);
    }
    return baseFindIndex(array$$1, baseIteratee$1(predicate, 3), index);
}

/**
 * Iterates over elements of `collection`, returning the first element
 * `predicate` returns truthy for. The predicate is invoked with three
 * arguments: (value, index|key, collection).
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Collection
 * @param {Array|Object} collection The collection to inspect.
 * @param {Function} [predicate=_.identity] The function invoked per iteration.
 * @param {number} [fromIndex=0] The index to search from.
 * @returns {*} Returns the matched element, else `undefined`.
 * @example
 *
 * var users = [
 *   { 'user': 'barney',  'age': 36, 'active': true },
 *   { 'user': 'fred',    'age': 40, 'active': false },
 *   { 'user': 'pebbles', 'age': 1,  'active': true }
 * ];
 *
 * _.find(users, function(o) { return o.age < 40; });
 * // => object for 'barney'
 *
 * // The `_.matches` iteratee shorthand.
 * _.find(users, { 'age': 1, 'active': true });
 * // => object for 'pebbles'
 *
 * // The `_.matchesProperty` iteratee shorthand.
 * _.find(users, ['active', false]);
 * // => object for 'fred'
 *
 * // The `_.property` iteratee shorthand.
 * _.find(users, 'active');
 * // => object for 'barney'
 */
var find = createFind(findIndex);

var getAllDataDef = function getAllDataDef(_options) {
    var _allFields = [].concat(_options.data.x, _options.data.y);

    if (check(_options.data.z)) {
        _allFields = _allFields.concat([_options.data.z]);
    }

    if (check(_options.data.s)) {
        _allFields = _allFields.concat([_options.data.s]);
    }

    return _allFields;
};

var getSortDef = function getSortDef(_options) {
    var _allFields = getAllDataDef(_options);

    var _field = find(_allFields, function (o) {
        return o.accessor === _options.ordering.accessor;
    });

    if (!check(_field)) {
        throw new Error('ordering accessor is invalid');
    }

    return _field;
};

var sortData = function sortData(_data, _options) {
    if (has(_options, 'ordering')) {
        var _field = getSortDef(_options);

        var _accessor = _field.accessor;

        switch (_field.type) {
            case Globals.DataType.STRING:
                _data.sort(function (a, b) {
                    return _options.ordering.direction === 'asc' ? a[_accessor].localeCompare(b[_accessor]) : b[_accessor].localeCompare(a[_accessor]);
                });
                break;
            default:
                _data.sort(function (a, b) {
                    return _options.ordering.direction === 'asc' ? a[_accessor] - b[_accessor] : b[_accessor] - a[_accessor];
                });

                break;
        }
    }
};

/**
 * Checks if `value` is `undefined`.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is `undefined`, else `false`.
 * @example
 *
 * _.isUndefined(void 0);
 * // => true
 *
 * _.isUndefined(null);
 * // => false
 */
function isUndefined$1(value) {
    return value === undefined;
}

/**
 * Checks if `value` is `null`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is `null`, else `false`.
 * @example
 *
 * _.isNull(null);
 * // => true
 *
 * _.isNull(void 0);
 * // => false
 */
function isNull$1(value) {
    return value === null;
}

/** `Object#toString` result references. */
var dateTag$4 = '[object Date]';

/**
 * The base implementation of `_.isDate` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a date object, else `false`.
 */
function baseIsDate(value) {
    return isObjectLike$1(value) && baseGetTag$1(value) == dateTag$4;
}

/* Node.js helper references. */
var nodeIsDate = nodeUtil$1 && nodeUtil$1.isDate;

/**
 * Checks if `value` is classified as a `Date` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a date object, else `false`.
 * @example
 *
 * _.isDate(new Date);
 * // => true
 *
 * _.isDate('Mon April 23 2012');
 * // => false
 */
var isDate = nodeIsDate ? baseUnary$1(nodeIsDate) : baseIsDate;

var cleanse = function cleanse(_data, _options) {
    var _allFields = getAllDataDef(_options);

    return _data.map(function (d) {
        var _d = d;

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = _allFields[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var _dim = _step.value;

                switch (_dim.type) {
                    case Globals.DataType.DATE:
                        if (isNull$1(_dim.format) || isUndefined$1(_dim.format)) {
                            if (!isDate(d[_dim.accessor])) {
                                throw new Error(_dim.accessor + '\'s date format is not specified.');
                            } else {
                                _d[_dim.accessor] = d[_dim.accessor];
                            }
                        } else {
                            if (isFunction$1(_dim.format)) {
                                _d[_dim.accessor] = _dim.format(d[_dim.accessor]);
                            } else {
                                var parser = timeParse(_dim.format);
                                _d[_dim.accessor] = parser(d[_dim.accessor]);
                            }
                        }

                        break;

                    case Globals.DataType.NUMBER:
                        _d[_dim.accessor] = toNumber(d[_dim.accessor]);

                        break;
                    case Globals.DataType.STRING:
                        _d[_dim.accessor] = toString$1(d[_dim.accessor]);
                        break;

                    default:
                        _d[_dim.accessor] = d[_dim.accessor];
                        break;
                }
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        return _d;
    });
};

/**
 * The base implementation of `_.isNaN` without support for number objects.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
 */
function baseIsNaN(value) {
    return value !== value;
}

/**
 * A specialized version of `_.indexOf` which performs strict equality
 * comparisons of values, i.e. `===`.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} value The value to search for.
 * @param {number} fromIndex The index to search from.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function strictIndexOf(array$$1, value, fromIndex) {
    var index = fromIndex - 1,
        length = array$$1.length;

    while (++index < length) {
        if (array$$1[index] === value) {
            return index;
        }
    }
    return -1;
}

/**
 * The base implementation of `_.indexOf` without `fromIndex` bounds checks.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} value The value to search for.
 * @param {number} fromIndex The index to search from.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseIndexOf(array$$1, value, fromIndex) {
    return value === value ? strictIndexOf(array$$1, value, fromIndex) : baseFindIndex(array$$1, baseIsNaN, fromIndex);
}

/**
 * A specialized version of `_.includes` for arrays without support for
 * specifying an index to search from.
 *
 * @private
 * @param {Array} [array] The array to inspect.
 * @param {*} target The value to search for.
 * @returns {boolean} Returns `true` if `target` is found, else `false`.
 */
function arrayIncludes(array$$1, value) {
    var length = array$$1 == null ? 0 : array$$1.length;
    return !!length && baseIndexOf(array$$1, value, 0) > -1;
}

/**
 * This function is like `arrayIncludes` except that it accepts a comparator.
 *
 * @private
 * @param {Array} [array] The array to inspect.
 * @param {*} target The value to search for.
 * @param {Function} comparator The comparator invoked per element.
 * @returns {boolean} Returns `true` if `target` is found, else `false`.
 */
function arrayIncludesWith(array$$1, value, comparator) {
    var index = -1,
        length = array$$1 == null ? 0 : array$$1.length;

    while (++index < length) {
        if (comparator(value, array$$1[index])) {
            return true;
        }
    }
    return false;
}

/**
 * This method returns `undefined`.
 *
 * @static
 * @memberOf _
 * @since 2.3.0
 * @category Util
 * @example
 *
 * _.times(2, _.noop);
 * // => [undefined, undefined]
 */
function noop$1() {}
// No operation performed.


/** Used as references for various `Number` constants. */
var INFINITY$3 = 1 / 0;

/**
 * Creates a set object of `values`.
 *
 * @private
 * @param {Array} values The values to add to the set.
 * @returns {Object} Returns the new set.
 */
var createSet = !(Set$2 && 1 / setToArray$1(new Set$2([, -0]))[1] == INFINITY$3) ? noop$1 : function (values$$1) {
    return new Set$2(values$$1);
};

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE$1$1 = 200;

/**
 * The base implementation of `_.uniqBy` without support for iteratee shorthands.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Function} [iteratee] The iteratee invoked per element.
 * @param {Function} [comparator] The comparator invoked per element.
 * @returns {Array} Returns the new duplicate free array.
 */
function baseUniq(array$$1, iteratee, comparator) {
    var index = -1,
        includes = arrayIncludes,
        length = array$$1.length,
        isCommon = true,
        result = [],
        seen = result;

    if (comparator) {
        isCommon = false;
        includes = arrayIncludesWith;
    } else if (length >= LARGE_ARRAY_SIZE$1$1) {
        var set$$1 = iteratee ? null : createSet(array$$1);
        if (set$$1) {
            return setToArray$1(set$$1);
        }
        isCommon = false;
        includes = cacheHas$1;
        seen = new SetCache$1();
    } else {
        seen = iteratee ? [] : result;
    }
    outer: while (++index < length) {
        var value = array$$1[index],
            computed = iteratee ? iteratee(value) : value;

        value = comparator || value !== 0 ? value : 0;
        if (isCommon && computed === computed) {
            var seenIndex = seen.length;
            while (seenIndex--) {
                if (seen[seenIndex] === computed) {
                    continue outer;
                }
            }
            if (iteratee) {
                seen.push(computed);
            }
            result.push(value);
        } else if (!includes(seen, computed, comparator)) {
            if (seen !== result) {
                seen.push(computed);
            }
            result.push(value);
        }
    }
    return result;
}

/**
 * Creates a duplicate-free version of an array, using
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * for equality comparisons, in which only the first occurrence of each element
 * is kept. The order of result values is determined by the order they occur
 * in the array.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Array
 * @param {Array} array The array to inspect.
 * @returns {Array} Returns the new duplicate free array.
 * @example
 *
 * _.uniq([2, 1, 2]);
 * // => [2, 1]
 */
function uniq(array$$1) {
    return array$$1 && array$$1.length ? baseUniq(array$$1) : [];
}

/**
 * Creates a base function for methods like `_.forIn` and `_.forOwn`.
 *
 * @private
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseFor$1(fromRight) {
    return function (object$$1, iteratee, keysFunc) {
        var index = -1,
            iterable = Object(object$$1),
            props = keysFunc(object$$1),
            length = props.length;

        while (length--) {
            var key = props[fromRight ? length : ++index];
            if (iteratee(iterable[key], key, iterable) === false) {
                break;
            }
        }
        return object$$1;
    };
}

/**
 * The base implementation of `baseForOwn` which iterates over `object`
 * properties returned by `keysFunc` and invokes `iteratee` for each property.
 * Iteratee functions may exit iteration early by explicitly returning `false`.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @returns {Object} Returns `object`.
 */
var baseFor$1 = createBaseFor$1();

/**
 * The base implementation of `_.forOwn` without support for iteratee shorthands.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
function baseForOwn$1(object$$1, iteratee) {
    return object$$1 && baseFor$1(object$$1, iteratee, keys$2);
}

/**
 * Creates a `baseEach` or `baseEachRight` function.
 *
 * @private
 * @param {Function} eachFunc The function to iterate over a collection.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseEach$1(eachFunc, fromRight) {
    return function (collection, iteratee) {
        if (collection == null) {
            return collection;
        }
        if (!isArrayLike$1(collection)) {
            return eachFunc(collection, iteratee);
        }
        var length = collection.length,
            index = fromRight ? length : -1,
            iterable = Object(collection);

        while (fromRight ? index-- : ++index < length) {
            if (iteratee(iterable[index], index, iterable) === false) {
                break;
            }
        }
        return collection;
    };
}

/**
 * The base implementation of `_.forEach` without support for iteratee shorthands.
 *
 * @private
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array|Object} Returns `collection`.
 */
var baseEach$1 = createBaseEach$1(baseForOwn$1);

/**
 * The base implementation of `_.map` without support for iteratee shorthands.
 *
 * @private
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function baseMap$1(collection, iteratee) {
    var index = -1,
        result = isArrayLike$1(collection) ? Array(collection.length) : [];

    baseEach$1(collection, function (value, key, collection) {
        result[++index] = iteratee(value, key, collection);
    });
    return result;
}

/**
 * Creates an array of values by running each element in `collection` thru
 * `iteratee`. The iteratee is invoked with three arguments:
 * (value, index|key, collection).
 *
 * Many lodash methods are guarded to work as iteratees for methods like
 * `_.every`, `_.filter`, `_.map`, `_.mapValues`, `_.reject`, and `_.some`.
 *
 * The guarded methods are:
 * `ary`, `chunk`, `curry`, `curryRight`, `drop`, `dropRight`, `every`,
 * `fill`, `invert`, `parseInt`, `random`, `range`, `rangeRight`, `repeat`,
 * `sampleSize`, `slice`, `some`, `sortBy`, `split`, `take`, `takeRight`,
 * `template`, `trim`, `trimEnd`, `trimStart`, and `words`
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Collection
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 * @example
 *
 * function square(n) {
 *   return n * n;
 * }
 *
 * _.map([4, 8], square);
 * // => [16, 64]
 *
 * _.map({ 'a': 4, 'b': 8 }, square);
 * // => [16, 64] (iteration order is not guaranteed)
 *
 * var users = [
 *   { 'user': 'barney' },
 *   { 'user': 'fred' }
 * ];
 *
 * // The `_.property` iteratee shorthand.
 * _.map(users, 'user');
 * // => ['barney', 'fred']
 */
function map$5(collection, iteratee) {
    var func = isArray$1(collection) ? arrayMap$1 : baseMap$1;
    return func(collection, baseIteratee$1(iteratee, 3));
}

var isYSort = function isYSort(_options) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = _options.data.y[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var _y = _step.value;

            if (_options.ordering.accessor === _y.accessor) {
                return true;
            }
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    return false;
};

var isBar = function isBar(options) {
    return options.chart.type === 'bar_horizontal' || options.chart.type === 'bar_grouped' || options.chart.type === 'bar_stacked' || options.chart.type === 'bar_expanded';
};

var updateDimensionScale = function updateDimensionScale(_data, _options) {
    var _dim = _options.data.x;

    if (isYSort(_options)) {
        if (isBar(_options)) {
            _dim.values = uniq(map$5(_data, _dim.accessor));

            _dim.scale = band().domain(_dim.values).range([0, _options.chart.innerWidth]).paddingInner(.1).paddingOuter(.6);

            return;
        } else {
            _dim.values = uniq(map$5(_data, _dim.accessor));
            _dim.scale = point$1().domain(_dim.values).range([0, _options.chart.innerWidth]);

            return;
        }
    }

    switch (_dim.type) {
        case Globals.DataType.DATE:
            _dim.values = uniq(map$5(_data, _dim.accessor));

            var _range = extent(_data, function (d) {
                return d[_dim.accessor];
            });

            _dim.min = _range[0];
            _dim.max = _range[1];

            _dim.scale = scaleTime().domain(_options.ordering.direction === 'asc' ? _range : _range.reverse()).range([0, _options.chart.innerWidth]).interpolate(interpolateRound);

            break;

        case Globals.DataType.NUMBER:
            // todo number format
            _dim.values = uniq(map$5(_data, _dim.accessor));

            var _rangeNm = extent(_data, function (d) {
                return d[_dim.accessor];
            });

            _dim.min = _rangeNm[0];
            _dim.max = _rangeNm[1];

            _dim.scale = linear$2().domain(_options.ordering.direction === 'asc' ? _rangeNm : _rangeNm.reverse()).range([0, _options.chart.innerWidth]);

            break;
        case Globals.DataType.STRING:
            if (isBar(_options)) {
                _dim.values = uniq(map$5(_data, _dim.accessor));

                _dim.scale = band().domain(_dim.values).range([0, _options.chart.innerWidth]).paddingInner(.1).paddingOuter(.6);

                return;
            } else {
                _dim.values = uniq(map$5(_data, _dim.accessor));
                _dim.scale = point$1().domain(_dim.values).range([0, _options.chart.innerWidth]);

                break;
            }

        default:
            break;
    }
};

var updateSeriesScale = function updateSeriesScale(_data, _options) {
    if (!isUndefined$1(_options.data.s) && !isNull$1(_options.data.zs) && !isUndefined$1(_options.data.s.accessor) && !isNull$1(_options.data.s.accessor)) {
        _options.data.s.values = uniq(map$5(_data, _options.data.s.accessor));
    }
};

/** `Object#toString` result references. */
var numberTag$4$1 = '[object Number]';

/**
 * Checks if `value` is classified as a `Number` primitive or object.
 *
 * **Note:** To exclude `Infinity`, `-Infinity`, and `NaN`, which are
 * classified as numbers, use the `_.isFinite` method.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a number, else `false`.
 * @example
 *
 * _.isNumber(3);
 * // => true
 *
 * _.isNumber(Number.MIN_VALUE);
 * // => true
 *
 * _.isNumber(Infinity);
 * // => true
 *
 * _.isNumber('3');
 * // => false
 */
function isNumber$1(value) {
    return typeof value == 'number' || isObjectLike$1(value) && baseGetTag$1(value) == numberTag$4$1;
}

/**
 * Checks if `value` is `NaN`.
 *
 * **Note:** This method is based on
 * [`Number.isNaN`](https://mdn.io/Number/isNaN) and is not the same as
 * global [`isNaN`](https://mdn.io/isNaN) which returns `true` for
 * `undefined` and other non-number values.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
 * @example
 *
 * _.isNaN(NaN);
 * // => true
 *
 * _.isNaN(new Number(NaN));
 * // => true
 *
 * isNaN(undefined);
 * // => true
 *
 * _.isNaN(undefined);
 * // => false
 */
function isNaN$1$1(value) {
    // An `NaN` primitive is the only value that is not equal to itself.
    // Perform the `toStringTag` check first to avoid errors with some
    // ActiveX objects in IE.
    return isNumber$1(value) && value != +value;
}

var _judgeMax = function _judgeMax(_maxLength) {
    return Math.pow(10, _maxLength);
};

var _maxLength = function _maxLength(_max) {
    if (_max >= 1) {
        return Math.round(_max).toString().length;
    } else {
        var maxLength = 0;
        while (_max < Math.pow(10, maxLength - 1)) {
            maxLength = maxLength - 1;
        }
        return maxLength;
    }
};

// ticks only positive
var _tickPositive = function _tickPositive(_range, _ticks, _tier) {
    var min$$1 = 0;
    var max$$1 = _range[1];
    var adjust = 0.9525;
    var maxTicks = 0;

    if (typeof _ticks == 'number' && !isNaN$1$1(parseInt(_ticks)) && isFinite(_ticks) && _ticks > 0) {
        maxTicks = _ticks;
    }

    if (max$$1 - min$$1 == 0 || min$$1 == 0 && max$$1 == 1) {
        return [min$$1, 1, maxTicks == 0 ? 5 : Math.min(maxTicks, 5)];
    } else if (maxTicks == 1) {
        return [min$$1, max$$1, 1];
    }

    if (typeof _tier == 'number' && !isNaN$1$1(parseFloat(_tier)) && isFinite(_tier) && _tier > 0 && max$$1 / _tier <= maxTicks) {
        var current = _tier;
        var maxRange = _range[1];
        var ticks$$1 = 1;
        while (true) {
            if (max$$1 < adjust * current) {
                maxRange = current;
                break;
            } else {
                current = current + _tier;
                ticks$$1 = ticks$$1 + 1;
            }
        }
        return [min$$1, maxRange, ticks$$1];
    } else {
        var maxLength = _maxLength(max$$1);
        var _maxRange = _judgeMax(maxLength);
        var unit = 5;
        var multiplier = 1;

        if (maxTicks == 0) {
            if (max$$1 < adjust * _maxRange / 5) {
                unit = 50;
            } else if (max$$1 < adjust * _maxRange / 2) {
                unit = 20;
            } else if (max$$1 < adjust * _maxRange) {
                unit = 10;
            }
        } else {
            multiplier = maxTicks;
            unit = Math.pow(10, maxTicks.toString().length);
            if (max$$1 < adjust * _maxRange * 2 / unit) {
                unit = unit * 5;
            } else if (max$$1 < adjust * _maxRange * 5 / unit) {
                unit = unit * 2;
            }
        }

        var tier = _maxRange / unit;
        var _current = tier * multiplier;
        var _ticks2 = 1;

        while (true) {
            if (max$$1 < adjust * _current) {
                _maxRange = _current;
                break;
            } else {
                _current = _current + tier * multiplier;
                _ticks2 = _ticks2 + 1;
            }
        }

        if (maxTicks == 0) {
            //control # of ticks to 7 or below
            switch (_ticks2) {
                case 10:
                    _ticks2 = 5;break;
                case 9:
                    _ticks2 = 3;break;
                case 8:
                    _ticks2 = 4;break;
            }
        } else {
            var minTicks = maxTicks;
            while (max$$1 < adjust * (_maxRange - tier * _ticks2)) {
                _maxRange = _maxRange - tier * _ticks2;
                minTicks--;
            }
            _ticks2 = minTicks;
        }

        if (maxLength < 0) {
            var precision = Math.pow(10, -1 * maxLength + 2);
            _maxRange = Math.round(_maxRange * precision) / precision;
        }

        return [min$$1, _maxRange, _ticks2];
    }
};

// contains both positive and negative
var tickBothNegativeAndPositive = function tickBothNegativeAndPositive(_range, _ticks, _tier) {
    var adjust = 0.9525;
    var maxTicks = 0;

    if (typeof _ticks == 'number' && !isNaN$1$1(parseInt(_ticks)) && isFinite(_ticks) && _ticks > 0) {
        maxTicks = _ticks;
    }
    if (maxTicks == 1) {
        return [_range[0], _range[1], 1];
    }

    if (typeof _tier == 'number' && !isNaN$1$1(parseFloat(_tier)) && isFinite(_tier) && _tier > 0 && (Math.abs(_range[0]) + Math.abs(_range[1])) / _tier <= maxTicks) {
        var minRange = _range[0];
        var current = _tier * -1;
        var ticks$$1 = 1;
        while (true) {
            if (minRange > adjust * current) {
                minRange = current;
                break;
            } else {
                current = current - _tier;
                ticks$$1 = ticks$$1 + 1;
            }
        }

        var maxRange = _range[1];
        current = _tier;

        while (true) {
            if (range < adjust * current) {
                maxRange = current;
                break;
            } else {
                current = current + _tier;
                ticks$$1 = ticks$$1 + 1;
            }
        }
        return [minRange, maxRange, ticks$$1];
    } else {
        var absmin = Math.abs(_range[0]);
        var min$$1 = absmin < _range[1] ? absmin : _range[1];
        var max$$1 = absmin > _range[1] ? absmin : _range[1];

        var maxLength = _maxLength(max$$1);
        var _maxRange2 = _judgeMax(maxLength);
        var _minRange = min$$1;
        var unit = 5;
        var multiplier = 1;

        if (maxTicks == 0) {
            if (max$$1 < adjust * _maxRange2 / 5) {
                unit = 50;
            } else if (max$$1 < adjust * _maxRange2 / 2) {
                unit = 20;
            } else if (max$$1 < adjust * _maxRange2) {
                unit = 10;
            }
        } else {
            multiplier = maxTicks;
            unit = Math.pow(10, maxTicks.toString().length);
            if (max$$1 < adjust * _maxRange2 * 2 / unit) {
                unit = unit * 5;
            } else if (max$$1 < adjust * _maxRange2 * 5 / unit) {
                unit = unit * 2;
            }
        }

        var tier = _maxRange2 / unit;
        var _current2 = tier * multiplier;
        var _ticks3 = 1;

        while (true) {
            if (max$$1 < adjust * _current2) {
                _maxRange2 = _current2;
                break;
            } else {
                _current2 = _current2 + tier * multiplier;
                _ticks3 = _ticks3 + 1;
            }
        }

        //calculate min
        _current2 = tier * multiplier;
        while (true) {
            if (min$$1 < adjust * _current2) {
                _minRange = _current2;
                break;
            } else {
                _current2 = _current2 + tier * multiplier;
                _ticks3 = _ticks3 + 1;
            }
        }

        if (maxTicks > 0) {
            var minTicks = maxTicks;
            while (max$$1 < adjust * (_maxRange2 - tier * _ticks3)) {
                _maxRange2 = _maxRange2 - tier * _ticks3;
                minTicks--;
            }
            while (min$$1 < adjust * (_minRange - tier * _ticks3)) {
                _minRange = _minRange - tier * _ticks3;
                minTicks--;
            }
            _ticks3 = minTicks;
        }

        return absmin < _range[1] ? [_minRange * -1, _maxRange2, _ticks3] : [_maxRange2 * -1, _minRange, _ticks3];
    }
};

var tickRange = function tickRange(_range, _ticks, _tier) {
    if (_range.length == 0 || isUndefined$1(_range[0]) || isNull$1(_range[0]) || isNaN$1$1(_range[0]) || isUndefined$1(_range[1]) || isNull$1(_range[1]) || isNaN$1$1(_range[1])) {
        return [0, 1];
    } else if (_range[0] >= 0) {
        //positive chart, adjust max scale only
        return _tickPositive(_range, _ticks, _tier);
    } else if (_range[1] <= 0) {
        //pure negative scale, we can use the position scale just reverse it
        var scale = _tickPositive([_range[1] * -1, _range[0] * -1], _ticks, _tier);
        return [scale[1] * -1, scale[0] * -1];
    } else {
        //mixed scale
        return tickBothNegativeAndPositive(_range, _ticks, _tier);
    }
};

var updateMetricScale = function updateMetricScale(_data, _options) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        var _loop = function _loop() {
            var _metric = _step.value;

            _metric.yAxis = _metric.yAxis || 0;

            var _range = extent(_data, function (d) {
                return d[_metric.accessor];
            });

            if (_options.yAxis && _options.yAxis.length >= _metric.yAxis + 1) {
                var _axisDef = _options.yAxis[_metric.yAxis];

                if (!isUndefined$1(_axisDef.min) && !isNull$1(_axisDef.min) && isNumber$1(_axisDef.min)) {
                    if (_axisDef.min >= _range[0]) {
                        console.log('yAxis[' + _metric.yAxis + '] min value is invalid, it shall be smaller than ' + _range[0]);
                    } else {
                        _range[0] = _axisDef.min;
                    }
                }

                if (!isUndefined$1(_axisDef.max) && !isNull$1(_axisDef.max) && isNumber$1(_axisDef.max)) {
                    if (_axisDef.max <= _range[1]) {
                        console.log('yAxis[' + _metric.yAxis + '] max value is invalid, it shall be larger than ' + _range[1]);
                    } else {
                        _range[1] = _axisDef.max;
                    }
                }
            }

            var _tickedRange = tickRange(_range, _options.yAxis[_metric.yAxis].ticks, _options.yAxis[_metric.yAxis].tier);

            _metric.ticksMin = _tickedRange[0];
            _metric.ticksMax = _tickedRange[1];
            _metric.ticksTier = _tickedRange[2];

            _metric.min = _range[0];
            _metric.max = _range[1];

            _metric.scale = linear$2().domain([_metric.ticksMin, _metric.ticksMax]).range([_options.chart.innerHeight, 0]);
        };

        for (var _iterator = _options.data.y[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            _loop();
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }
};

var updateZScale = function updateZScale(_data, _options) {
    if (!isUndefined$1(_options.data.z) && !isNull$1(_options.data.z) && !isUndefined$1(_options.data.z.accessor) && !isNull$1(_options.data.z.accessor)) {
        var _range = extent(_data, function (d) {
            return d[_options.data.z.accessor];
        });

        _options.data.z.min = _range[0];
        _options.data.z.max = _range[1];

        _options.data.z.scale = linear$2().domain([_options.data.z.min, _options.data.z.max]).range([_options.plots.bubble.min, _options.plots.bubble.max]);
    }
};

var updateOptionScales = function updateOptionScales(_data, _options) {
    updateDimensionScale(_data, _options);
    updateSeriesScale(_data, _options);
    updateMetricScale(_data, _options);
    updateZScale(_data, _options);
};

/**
 *
 * @param _data is immutable
 * @param _options _options
 */
var processCartesianData = function processCartesianData(_data, _options) {
    var _cleanse = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

    var _copy = cloneDeep$1(_data);
    // a cleansed copy of data.
    var _cleansed = _cleanse === true ? cleanse(_copy, _options) : _copy;

    sortData(_cleansed, _options);

    updateOptionScales(_cleansed, _options);

    return _cleansed;
};

/**
 * A specialized version of `baseAggregator` for arrays.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} setter The function to set `accumulator` values.
 * @param {Function} iteratee The iteratee to transform keys.
 * @param {Object} accumulator The initial aggregated object.
 * @returns {Function} Returns `accumulator`.
 */
function arrayAggregator(array$$1, setter, iteratee, accumulator) {
    var index = -1,
        length = array$$1 == null ? 0 : array$$1.length;

    while (++index < length) {
        var value = array$$1[index];
        setter(accumulator, value, iteratee(value), array$$1);
    }
    return accumulator;
}

/**
 * Aggregates elements of `collection` on `accumulator` with keys transformed
 * by `iteratee` and values set by `setter`.
 *
 * @private
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} setter The function to set `accumulator` values.
 * @param {Function} iteratee The iteratee to transform keys.
 * @param {Object} accumulator The initial aggregated object.
 * @returns {Function} Returns `accumulator`.
 */
function baseAggregator(collection, setter, iteratee, accumulator) {
    baseEach$1(collection, function (value, key, collection) {
        setter(accumulator, value, iteratee(value), collection);
    });
    return accumulator;
}

/**
 * Creates a function like `_.groupBy`.
 *
 * @private
 * @param {Function} setter The function to set accumulator values.
 * @param {Function} [initializer] The accumulator object initializer.
 * @returns {Function} Returns the new aggregator function.
 */
function createAggregator(setter, initializer) {
    return function (collection, iteratee) {
        var func = isArray$1(collection) ? arrayAggregator : baseAggregator,
            accumulator = initializer ? initializer() : {};

        return func(collection, setter, baseIteratee$1(iteratee, 2), accumulator);
    };
}

/** Used for built-in method references. */
var objectProto$16 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$13 = objectProto$16.hasOwnProperty;

/**
 * Creates an object composed of keys generated from the results of running
 * each element of `collection` thru `iteratee`. The order of grouped values
 * is determined by the order they occur in `collection`. The corresponding
 * value of each key is an array of elements responsible for generating the
 * key. The iteratee is invoked with one argument: (value).
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Collection
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} [iteratee=_.identity] The iteratee to transform keys.
 * @returns {Object} Returns the composed aggregate object.
 * @example
 *
 * _.groupBy([6.1, 4.2, 6.3], Math.floor);
 * // => { '4': [4.2], '6': [6.1, 6.3] }
 *
 * // The `_.property` iteratee shorthand.
 * _.groupBy(['one', 'two', 'three'], 'length');
 * // => { '3': ['one', 'two'], '5': ['three'] }
 */
var groupBy = createAggregator(function (result, value, key) {
    if (hasOwnProperty$13.call(result, key)) {
        result[key].push(value);
    } else {
        baseAssignValue$1(result, key, [value]);
    }
});

var getSeriesOrdering = function getSeriesOrdering(_options) {
    return has(_options, 'ordering') && _options.ordering.accessor === _options.data.s.accessor && _options.ordering.direction === 'desc' ? stackOrderDescending : ascending$2;
};

var generateLayout = function generateLayout(_data, _options) {
    var _getDimension = function _getDimension() {
        return _options.data.x;
    };
    var _getDimensionVal = function _getDimensionVal(d) {
        return d[_getDimension().accessor];
    };
    var _getMetric = function _getMetric() {
        return _options.data.y[0];
    };
    var _getMetricValue = function _getMetricValue(d) {
        return d[_getMetric().accessor];
    };

    var _matrix = [];

    var dimensionGroup = groupBy(_data, function (d) {
        return _getDimensionVal(d);
    });

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = _getDimension().values[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var _dim = _step.value;

            var _t = {};

            _t[_getDimension().accessor] = _dim;

            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = _options.data.s.values[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var _s = _step2.value;

                    _t[_s] = 0;
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }

            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = dimensionGroup[_dim][Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var _v = _step3.value;

                    _t[_v[_options.data.s.accessor]] = _getMetricValue(_v);
                }
            } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion3 && _iterator3.return) {
                        _iterator3.return();
                    }
                } finally {
                    if (_didIteratorError3) {
                        throw _iteratorError3;
                    }
                }
            }

            _matrix.push(_t);
        }

        // nested data
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    var _stack = stack();

    var _ordering = getSeriesOrdering(_options);

    switch (_options.plots.stackMethod) {
        case Stacks.Expand:
            _stack.offset(stackOffsetExpand).order(_ordering);
            break;
        case Stacks.Zero:
            _stack.offset(none$1).order(_ordering);
            break;
        case Stacks.Silhouette:
            _stack.offset(stackOffsetSilhouette).order(stackOrderInsideOut);
            break;
        case Stacks.Wiggle:
            _stack.offset(stackOffsetWiggle).order(stackOrderInsideOut);
            break;

        default:
            _stack.offset(none$1);
            break;
    }

    _stack.keys(_options.data.s.values);

    return _stack(_matrix);
};

var mergeLayout = function mergeLayout(_data, _layout, _options) {
    var _nestedData = [];

    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
        for (var _iterator4 = _layout[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var _nest = _step4.value;

            var _values = [];

            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = _nest[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var _n = _step5.value;

                    var _o = {
                        y0: _n[0],
                        y: _n[1]
                    };
                    _o[_options.data.s.accessor] = _nest.key;
                    _o[_options.data.x.accessor] = _n.data[_options.data.x.accessor];
                    _o[_options.data.y[0].accessor] = _n.data[_nest.key];

                    _values.push(_o);
                }
            } catch (err) {
                _didIteratorError5 = true;
                _iteratorError5 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion5 && _iterator5.return) {
                        _iterator5.return();
                    }
                } finally {
                    if (_didIteratorError5) {
                        throw _iteratorError5;
                    }
                }
            }

            _nestedData.push({
                key: _nest.key,
                values: _values
            });
        }
    } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion4 && _iterator4.return) {
                _iterator4.return();
            }
        } finally {
            if (_didIteratorError4) {
                throw _iteratorError4;
            }
        }
    }

    return _nestedData;
};

var nest$1 = function nest$$1(_data, _options) {
    var layout = generateLayout(_data, _options);
    return mergeLayout(_data, layout, _options);
};

var mapY = function mapY(d) {
    return d.values.map(function (e) {
        return e.y;
    });
};

/**
 * get max/min of the nestedData
 *
 * @param _nested nested data
 * @param _oper min/max
 * @returns {*} max/min of the nestedData
 */
var mapNested = function mapNested(_nested, _oper) {
    return _oper(_nested.map(function (d) {
        return _oper(mapY(d));
    }));
};

var getStackedMetricScale = function getStackedMetricScale(_nestedData, _options) {
    var _tickedRange = void 0;
    var minY = 0;
    var maxY = mapNested(_nestedData, max);

    if (_options.plots.stackMethod === Stacks.Expand) {
        if (maxY === 1) {
            _tickedRange = [0, 1, 5];
        } else {
            _tickedRange = tickRange([0, maxY], _options.yAxis[0].ticks, _options.yAxis[0].tier);
        }
    } else {
        minY = mapNested(_nestedData, min$1);
        _tickedRange = tickRange([minY, maxY], _options.yAxis[0].ticks, _options.yAxis[0].tier);
    }

    return _tickedRange;
};

var buildStack = function buildStack(_data, _options) {
    var _nestedData = nest$1(_data, _options);

    var minY = void 0;
    var maxY = void 0;

    if (_options.plots.stackLayout === true) {
        var _range = getStackedMetricScale(_nestedData, _options);
        minY = _range[0];
        maxY = _range[1];

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = _options.data.y[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var _metric = _step.value;

                _metric.scale = linear$2().domain([minY, maxY]).range([_options.chart.innerHeight, 0]);
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }
    } else {
        minY = _options.data.y[0].min;
        maxY = _options.data.y[0].max;

        if (_options.data.y.length > 1) {
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = _options.data.y[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var metric = _step2.value;

                    minY = Math.min(minY, metric.min);
                    maxY = Math.max(maxY, metric.max);
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }
        }
    }

    return {
        maxY: maxY,
        minY: minY,
        original: _data,
        nested: _nestedData
    };
};

var processStackedData = function processStackedData(_data, _options) {
    var _cleanse = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

    var _copy = processCartesianData(_data, _options, _cleanse);

    return buildStack(_copy, _options);
};

var AbstractBasicCartesianChart = function (_AbstractCartesianCha) {
    inherits$1(AbstractBasicCartesianChart, _AbstractCartesianCha);

    function AbstractBasicCartesianChart(canvasId, _userOptions) {
        classCallCheck$2(this, AbstractBasicCartesianChart);
        return possibleConstructorReturn$1(this, (AbstractBasicCartesianChart.__proto__ || Object.getPrototypeOf(AbstractBasicCartesianChart)).call(this, canvasId, _userOptions));
    }

    createClass$2(AbstractBasicCartesianChart, [{
        key: 'update',
        value: function update() {
            get$3(AbstractBasicCartesianChart.prototype.__proto__ || Object.getPrototypeOf(AbstractBasicCartesianChart.prototype), 'update', this).call(this);
            processCartesianData(this._data, this._options, false);
        }
    }, {
        key: 'data',
        value: function data(_data) {
            if (check(_data) === true) {
                this._data = processCartesianData(_data, this._options, true);
            }

            return this._data;
        }
    }, {
        key: '_provideColor',
        value: function _provideColor() {
            var _array = this._data.map(this._getMetricVal);
            return genericColor(this._options.color, _array);
        }
    }]);
    return AbstractBasicCartesianChart;
}(AbstractCartesianChart);

/** `Object#toString` result references. */
var stringTag$4$1 = '[object String]';

/**
 * Checks if `value` is classified as a `String` primitive or object.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a string, else `false`.
 * @example
 *
 * _.isString('abc');
 * // => true
 *
 * _.isString(1);
 * // => false
 */
function isString$1(value) {
    return typeof value == 'string' || !isArray$1(value) && isObjectLike$1(value) && baseGetTag$1(value) == stringTag$4$1;
}

var cnTimeFormat = function cnTimeFormat(date$$1, i) {
    var CN = formatLocale$1({
        "dateTime": "%a %b %e %X %Y",
        "date": "%m/%d/%Y",
        "time": "%H:%M:%S",
        "periods": ["AM", "PM"],
        "days": ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
        "shortDays": ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
        "months": ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
        "shortMonths": ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"]
    });

    var formatMillisecond = CN.format(".%L"),
        formatSecond = CN.format(":%S"),
        formatMinute = CN.format("%I:%M"),
        formatHour = CN.format("%I %p"),
        formatDay = CN.format("%a %d"),
        formatWeek = CN.format("%b %d"),
        formatMonth = CN.format("%B"),
        formatYear = CN.format("%Y");

    return (second(date$$1) < date$$1 ? formatMillisecond : minute(date$$1) < date$$1 ? formatSecond : hour(date$$1) < date$$1 ? formatMinute : day(date$$1) < date$$1 ? formatHour : month(date$$1) < date$$1 ? sunday(date$$1) < date$$1 ? formatDay : formatWeek : year(date$$1) < date$$1 ? formatMonth : formatYear)(date$$1);
};

var rotateXTicks = function rotateXTicks(_selector, angle) {
    var transition$$1 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    var _rotate = "rotate(-" + angle + ")";

    var _tickText = _selector.selectAll('.x.axis .tick text');

    if (transition$$1 === true) {
        _tickText.transition().duration(300);
    }

    if (angle === 90) {
        _tickText.attr("transform", _rotate).attr("dx", -10).attr("dy", -6).style("text-anchor", "end");
    } else if (angle === 0) {
        _tickText.attr("transform", _rotate).attr("dx", 0).attr("dy", 10).style("text-anchor", "middle");
    } else if (angle === 60 || angle === 45) {
        _tickText.attr("transform", _rotate).attr("dx", -10).attr("dy", 0).style("text-anchor", "end");
    } else if (angle === 75) {
        _tickText.attr("transform", _rotate).attr("dx", -10).attr("dy", -4).style("text-anchor", "end");
    } else if (angle === 30) {
        _tickText.attr("transform", _rotate).attr("dx", -5).attr("dy", 7).style("text-anchor", "end");
    }
};

var isTickDiv = function isTickDiv(_data, _units) {
    return (_data.length - 1) % _units == 0;
};

var Axis = function () {
    function Axis(_options) {
        var _this = this;

        classCallCheck$2(this, Axis);

        this._options = _options;

        this._getMetric = function () {
            return _this._options.data.y[0];
        };
        this._getDimension = function () {
            return _this._options.data.x;
        };
        this._getDimensionVal = function (d) {
            return d[_this._getDimension().accessor];
        };

        this._xAxis;
        this._yAxis;
    }

    createClass$2(Axis, [{
        key: 'updateTickValues',
        value: function updateTickValues(_data) {
            var _options = this._options;

            var maxTicks = _options.xAxis.ticks > 0 ? _options.xAxis.ticks : 31;
            if (_data.length <= maxTicks) {
                this._xAxis.ticks(_data.length);
                return;
            }

            var units = 10;
            if (maxTicks <= 10) {
                units = maxTicks;
                while (units > 1) {
                    //minimum 1
                    if (isTickDiv(_data, units)) {
                        break;
                    }
                    --units;
                }
            } else {
                if (isTickDiv(5)) {
                    units = isTickDiv(_data, 10) ? 10 : 5;
                } else if (isTickDiv(_data, 7)) {
                    units = 7;
                } else if (isTickDiv(_data, 8)) {
                    units = 8;
                } else if (isTickDiv(_data, 9)) {
                    units = 9;
                } else if (isTickDiv(_data, 11)) {
                    units = 11;
                } else if (maxTicks >= 12 && isTickDiv(_data, 12)) {
                    units = 12;
                } else if (maxTicks >= 13 && isTickDiv(_data, 13)) {
                    units = 13;
                } else if (isTickDiv(_data, 6)) {
                    units = 6;
                }
                //use default here
            }

            if (units > 1) {
                var current = 0;
                var index = 0;
                var lastIndex = _data.length - 1;
                var increment = Math.floor((_data.length - 1) / units);
                var arr = new Array(units + (isTickDiv(_data, units) ? 1 : 2));

                while (current < lastIndex) {
                    arr[index++] = this._getDimensionVal(_data[current]);
                    current += increment;
                }
                arr[index] = this._getDimensionVal(_data[lastIndex]);
                this._xAxis.tickValues(arr);
            } else {
                this._xAxis.ticks(null);
            }
        }
    }, {
        key: 'render',
        value: function render(_svg, _data) {
            this._xAxis = axisBottom();
            this._yAxis = axisLeft();

            this.update(_svg, _data);

            _svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + this._options.chart.innerHeight + ")").call(this._xAxis);

            _svg.append("g").attr("class", "y axis").call(this._yAxis);

            rotateXTicks(_svg, this._options.xAxis.labelAngle, false);
        }
    }, {
        key: 'update',
        value: function update(_svg, _data) {
            var isBar = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

            var dimension = this._getDimension();
            var metric = this._getMetric();
            var xScale = dimension.scale;
            var yScale = metric.scale;
            this._xAxis = axisBottom();
            this._yAxis = axisLeft();

            //scale ticks, bar is special because every column is distinct
            if (isBar === true) {
                this.updateTickValues(_data);
            } else {
                if (dimension.type === Globals.DataType.DATE) {
                    if (this._options.xAxis.ticks > 0) {
                        //follow user specification
                        this._xAxis.ticks(Math.min(_data.length, this._options.xAxis.ticks));
                    } else if (_data.length > 31) {
                        this._xAxis.ticks(10);
                    } else {
                        this._xAxis.ticks(_data.length);
                    }
                } else if (dimension.type === Globals.DataType.NUMBER) {
                    if (this._options.ordering.accessor !== this._options.data.y[0].accessor) {
                        if (this._options.xAxis.ticks > 0) {
                            //follow user specification
                            this._xAxis.ticks(Math.min(_data.length, this._options.xAxis.ticks));
                        } else {
                            this._xAxis.ticks(null);
                        }
                    } else {
                        this.updateTickValues(_data);
                    }
                } else if (dimension.type === Globals.DataType.STRING) {
                    this.updateTickValues(_data);
                }
            }

            yScale.nice();

            //tick formats
            if (isString$1(this._options.yAxis[0].tickFormat)) {
                this._yAxis.tickFormat(format(this._options.yAxis[0].tickFormat));
            } else {
                this._yAxis.tickFormat(null);
            }

            if (isString$1(this._options.xAxis.tickFormat) && this._options.xAxis.tickFormat.length > 0) {
                this._xAxis.tickFormat(format(this._options.xAxis.tickFormat));
            } else if (dimension.type === Globals.DataType.DATE) {
                if (this._options.locale === 'zh') {
                    this._xAxis.tickFormat(cnTimeFormat);
                } else {
                    this._xAxis.tickFormat(null);
                }
            } else {
                this._xAxis.tickFormat(null);
            }

            this._xAxis.scale(xScale);
            this._yAxis.scale(yScale);
            if (isNumber$1(this._options.yAxis[0].ticks) && isFinite(this._options.yAxis[0].ticks) && this._options.yAxis[0].ticks > 0) {
                this._yAxis.ticks(metric.ticksTier);
            }

            this.transition(_svg, _data);
        }
    }, {
        key: 'transition',
        value: function transition$$1(_svg, _data) {
            var _this2 = this;

            var transition$$1 = _svg.transition().duration(this._options.animation.duration.update);
            var _delay = function _delay(d, i) {
                return i / _data.length * _this2._options.animation.duration.update;
            };

            transition$$1.select(".x.axis").delay(_delay).call(this._xAxis);

            transition$$1.select(".y.axis").delay(_delay).call(this._yAxis);

            rotateXTicks(_svg, this._options.xAxis.labelAngle, false);
        }
    }]);
    return Axis;
}();

var AbstractBasicCartesianChartWithAxes = function (_AbstractBasicCartesi) {
    inherits$1(AbstractBasicCartesianChartWithAxes, _AbstractBasicCartesi);

    function AbstractBasicCartesianChartWithAxes(canvasId, _userOptions) {
        classCallCheck$2(this, AbstractBasicCartesianChartWithAxes);

        var _this = possibleConstructorReturn$1(this, (AbstractBasicCartesianChartWithAxes.__proto__ || Object.getPrototypeOf(AbstractBasicCartesianChartWithAxes)).call(this, canvasId, _userOptions));

        _this.axes;
        return _this;
    }

    createClass$2(AbstractBasicCartesianChartWithAxes, [{
        key: 'render',
        value: function render(_data) {
            get$3(AbstractBasicCartesianChartWithAxes.prototype.__proto__ || Object.getPrototypeOf(AbstractBasicCartesianChartWithAxes.prototype), 'render', this).call(this, _data);

            this.axes = new Axis(this._options);
            this.axes.render(this._svg, this._data);
        }
    }, {
        key: 'update',
        value: function update() {
            get$3(AbstractBasicCartesianChartWithAxes.prototype.__proto__ || Object.getPrototypeOf(AbstractBasicCartesianChartWithAxes.prototype), 'update', this).call(this);
            this.axes = new Axis(this._options);
            this.axes.update(this._svg, this._data, this._isBar());
        }
    }, {
        key: '_isBar',
        value: function _isBar() {
            return false;
        }
    }]);
    return AbstractBasicCartesianChartWithAxes;
}(AbstractBasicCartesianChart);

var AbstractStackedCartesianChart = function (_AbstractCartesianCha) {
    inherits$1(AbstractStackedCartesianChart, _AbstractCartesianCha);

    function AbstractStackedCartesianChart(canvasId, _userOptions) {
        classCallCheck$2(this, AbstractStackedCartesianChart);

        var _this = possibleConstructorReturn$1(this, (AbstractStackedCartesianChart.__proto__ || Object.getPrototypeOf(AbstractStackedCartesianChart)).call(this, canvasId, _userOptions));

        _this._getSeries = function () {
            return _this._options.data.s;
        };

        _this._getSeriesVal = function (d) {
            return d[_this._getSeries().accessor];
        };

        _this._y1 = function (d) {
            return _this._getMetric().scale(d.y);
        };

        _this._y0 = function (d) {
            return _this._getMetric().scale(d.y0);
        };

        _this._c = function (d) {
            return has(d, 'key') ? _this._color(d.key) : _this._color(_this._getSeriesVal(d));
        };

        return _this;
    }

    createClass$2(AbstractStackedCartesianChart, [{
        key: 'render',
        value: function render(_data) {
            get$3(AbstractStackedCartesianChart.prototype.__proto__ || Object.getPrototypeOf(AbstractStackedCartesianChart.prototype), 'render', this).call(this, _data);
        }
    }, {
        key: 'update',
        value: function update() {
            get$3(AbstractStackedCartesianChart.prototype.__proto__ || Object.getPrototypeOf(AbstractStackedCartesianChart.prototype), 'update', this).call(this);
            this.data(this._data.original);
        }
    }, {
        key: 'data',
        value: function data(_data) {
            if (check(_data) === true) {
                this._data = processStackedData(_data, this._options, true);
            }

            return this._data;
        }
    }, {
        key: '_provideColor',
        value: function _provideColor() {
            var _num = this._data && this._data.nested ? this._data.nested.length : 0;

            return categoricalColor(this._options.color.scheme, _num);
        }
    }]);
    return AbstractStackedCartesianChart;
}(AbstractCartesianChart);

var AbstractStackedCartesianChartWithAxes = function (_AbstractStackedCarte) {
    inherits$1(AbstractStackedCartesianChartWithAxes, _AbstractStackedCarte);

    function AbstractStackedCartesianChartWithAxes(canvasId, _userOptions) {
        classCallCheck$2(this, AbstractStackedCartesianChartWithAxes);

        var _this = possibleConstructorReturn$1(this, (AbstractStackedCartesianChartWithAxes.__proto__ || Object.getPrototypeOf(AbstractStackedCartesianChartWithAxes)).call(this, canvasId, _userOptions));

        _this.axes;
        return _this;
    }

    createClass$2(AbstractStackedCartesianChartWithAxes, [{
        key: 'render',
        value: function render(_data) {
            get$3(AbstractStackedCartesianChartWithAxes.prototype.__proto__ || Object.getPrototypeOf(AbstractStackedCartesianChartWithAxes.prototype), 'render', this).call(this, _data);

            this.axes = new Axis(this._options);
            this.axes.render(this._svg, this._data.nested[0].values);
        }
    }, {
        key: 'update',
        value: function update() {
            get$3(AbstractStackedCartesianChartWithAxes.prototype.__proto__ || Object.getPrototypeOf(AbstractStackedCartesianChartWithAxes.prototype), 'update', this).call(this);

            this.axes = new Axis(this._options);
            this.axes.update(this._svg, this._data.nested[0].values);
        }
    }]);
    return AbstractStackedCartesianChartWithAxes;
}(AbstractStackedCartesianChart);

var CartesianOptions = {
    color: {
        scheme: MetroRain3,
        type: Globals.ColorType.GRADIENT
    },
    chart: {
        margin: {
            left: 60,
            bottom: 50,
            right: 10,
            top: 20
        }
    },
    ordering: {
        accessor: null,
        direction: 'asc'
    },

    xAxis: {
        allowDecimals: false,
        scale: null,
        ticks: 0,
        tickFormat: null,
        max: null,
        min: null,
        labelAngle: 0,

        title: {
            text: '',
            style: ''
        }
    },

    yAxis: [{
        allowDecimals: false,
        scale: null,
        max: null,
        min: null,
        ticks: 0,
        tier: 6,
        title: {
            text: '',
            style: ''
        }
    }],

    data: {
        x: {
            accessor: null,
            type: Globals.DataType.NUMBER,
            formatter: null
        },
        y: [{
            accessor: null,
            type: Globals.DataType.NUMBER,
            formatter: null,
            yAxis: 0,
            tooltip: {
                valueSuffix: null
            }
        }]
    }

};

var createCartesianOpt = function createCartesianOpt(_chartOpt, _userOpt) {
    var cartesianOpt = mergeBase(CartesianOptions, _chartOpt, _userOpt);

    if (!has(_userOpt, 'ordering')) {
        cartesianOpt.ordering.accessor = cartesianOpt.data.x.accessor;
    }

    return cartesianOpt;
};

var BarOpt = {
    chart: { type: 'bar_horizontal' }
};

var Bar = function (_AbstractBasicCartesi) {
    inherits$1(Bar, _AbstractBasicCartesi);

    function Bar(canvasId, _userOptions) {
        classCallCheck$2(this, Bar);

        var _this = possibleConstructorReturn$1(this, (Bar.__proto__ || Object.getPrototypeOf(Bar)).call(this, canvasId, _userOptions));

        _this._w = function () {
            return isUndefined$1(_this._getDimension().scale.bandwidth) || !isFunction$1(_this._getDimension().scale.bandwidth) ? Math.ceil(_this._options.chart.innerWidth / _this._data.length) : _this._getDimension().scale.bandwidth();
        };
        _this._h = function (d) {
            return _this._options.chart.innerHeight - _this._y(d);
        };
        _this._zero = function () {
            return _this._getMetric().scale(0);
        };
        return _this;
    }

    createClass$2(Bar, [{
        key: 'createOptions',
        value: function createOptions(_userOptions) {
            return createCartesianOpt(BarOpt, _userOptions);
        }
    }, {
        key: 'render',
        value: function render(_data) {
            get$3(Bar.prototype.__proto__ || Object.getPrototypeOf(Bar.prototype), 'render', this).call(this, _data);
            this._svg.append("g").attr("class", "x axis zero").attr("transform", "translate(0," + this._zero() + ")").attr('opacity', 0).attr('stroke-opacity', 0).call(this.axes._xAxis);

            this.update();
        }
    }, {
        key: 'update',
        value: function update() {
            var _this2 = this;

            get$3(Bar.prototype.__proto__ || Object.getPrototypeOf(Bar.prototype), 'update', this).call(this);

            var _hasNegative = get$3(Bar.prototype.__proto__ || Object.getPrototypeOf(Bar.prototype), '_hasNegativeValue', this).call(this);

            this._svg.select("x axis zero").attr("transform", "translate(0," + this._zero() + ")").attr('stroke-opacity', _hasNegative ? 1 : 0);

            var bars = this._svg.selectAll('.bar').data(this._data);
            var dataJoin = bars.enter();
            var dataRemove = bars.exit();

            dataRemove.transition("exit-rect-transition").duration(this._options.animation.duration.remove).attr("y", _hasNegative ? this._y(0) : this._options.chart.innerHeight).attr("height", 0).remove();

            bars.transition("update-rect-transition").duration(this._options.animation.duration.update).delay(function (d, i) {
                return i / _this2._data.length * _this2._options.animation.duration.update;
            }).attr('fill', this._c).attr("x", this._x).attr('width', this._w).attr("y", function (d) {
                return _this2._getMetricVal(d) > 0 ? _this2._y(d) : _this2._zero();
            }).attr("height", function (d) {
                return _hasNegative ? Math.abs(_this2._y(d) - _this2._zero()) : _this2._h(d);
            });

            dataJoin.append("rect").attr('class', 'bar').attr('fill', this._c).attr('opacity', 1).attr("x", this._x).attr('width', this._w).attr("y", _hasNegative ? this._zero(0) : this._options.chart.innerHeight).attr("height", 0).transition("add-rect-transition").duration(this._options.animation.duration.add).delay(function (d, i) {
                return i / _this2._data.length * _this2._options.animation.duration.add;
            }).attr("y", function (d) {
                return _this2._getMetricVal(d) > 0 ? _this2._y(d) : _this2._zero();
            }).attr("height", function (d) {
                return _hasNegative ? Math.abs(_this2._y(d) - _this2._zero()) : _this2._h(d);
            });

            this._bindTooltip(this._svg.selectAll('.bar'));
        }
    }, {
        key: 'sort',
        value: function sort(field, direction) {
            var _this3 = this;

            this._options.ordering = {
                accessor: field,
                direction: direction
            };

            processCartesianData(this._data, this._options, false);
            var _field = getSortDef(this._options);
            var _accessor = _field.accessor;

            switch (_field.type) {
                case Globals.DataType.STRING:
                    this._svg.selectAll('.bar').sort(function (a, b) {
                        return direction === 'asc' ? a[_accessor].localeCompare(b[_accessor]) : b[_accessor].localeCompare(a[_accessor]);
                    });
                    break;
                default:
                    this._svg.selectAll('.bar').sort(function (a, b) {
                        return direction === 'asc' ? a[_accessor] - b[_accessor] : b[_accessor] - a[_accessor];
                    });

                    break;
            }

            var transition$$1 = this._svg.transition().duration(this._options.animation.duration.update);
            var _delay = function _delay(d, i) {
                return i / _this3._data.length * _this3._options.animation.duration.update;
            };

            transition$$1.selectAll(".bar").delay(_delay).attr("x", this._x);

            this.axes.update(this._svg, this._data);
        }
    }, {
        key: 'transitionColor',
        value: function transitionColor(colorOptions) {
            var _this4 = this;

            get$3(Bar.prototype.__proto__ || Object.getPrototypeOf(Bar.prototype), 'transitionColor', this).call(this, colorOptions);

            this._svg.selectAll('.bar').transition().duration(this._options.animation.duration.color).delay(function (d, i) {
                return i / _this4._data.length * _this4._options.animation.duration.color;
            }).attr('fill', this._c);
        }
    }, {
        key: '_isBar',
        value: function _isBar() {
            return true;
        }
    }]);
    return Bar;
}(AbstractBasicCartesianChartWithAxes);

var midAngle = function midAngle(d) {
    return d.startAngle + (d.endAngle - d.startAngle) / 2;
};

var getLinePosition = function getLinePosition(_outerArc, d2) {
    var pos = _outerArc.centroid(d2);
    var angle = midAngle(d2) / Math.PI * 180;

    if (angle <= 0 || angle >= 360) {
        pos[1] -= 8;
    } else if (angle == 180) {
        pos[1] += 8;
    } else if (angle <= 30) {
        pos[1] -= (30 - angle) / 30 * 8;
    } else if (angle >= 150) {
        if (angle < 180) {
            pos[1] += (angle - 150) / 30 * 8;
        } else if (angle <= 210) {
            pos[1] += (210 - angle) / 30 * 8;
        } else if (angle >= 330) {
            pos[1] -= (angle - 330) / 30 * 8;
        }
    }
    return pos;
};

var getLabelPosition = function getLabelPosition(_outerArc, d2) {
    var pos = _outerArc.centroid(d2);
    var angle = midAngle(d2) / Math.PI * 180;

    if (angle <= 0 || angle >= 360) {
        pos[1] -= 17; //vertical
    } else if (angle == 180) {
        pos[1] += 20; //vertical
    } else if (angle < 180) {
        pos[0] += 3;
        if (angle <= 30) {
            pos[1] -= (30 - angle) / 30 * 17;
        } else if (angle >= 150) {
            pos[1] += (angle - 150) / 30 * 20;
        }
    } else {
        pos[0] -= 3;
        if (angle <= 210) {
            pos[1] += (210 - angle) / 30 * 20;
        } else if (angle >= 330) {
            pos[1] -= (angle - 330) / 30 * 17;
        }
    }

    return pos;
};

var mergeWithFirstEqualZero = function mergeWithFirstEqualZero(first, second$$1) {
    var _this = this;

    var secondSet = set$3();
    second$$1.forEach(function (d) {
        secondSet.add(_this._getDimensionVal(d));
    });

    var _dim = this._getDimension().accessor;
    var _met = this._getMetric().accessor;

    var onlyFirst = first.filter(function (d) {
        return !secondSet.has(_this._getDimensionVal(d));
    }).map(function (d) {
        var _d = {};
        _d[_dim] = _this._getDimensionVal(d);
        _d[_met] = 0;

        return _d;
    });

    return merge$1([second$$1, onlyFirst]).sort(function (a, b) {
        return ascending$1(_this._getDimensionVal(a), _this._getDimensionVal(b));
    });
};

var limitSliceValues = function limitSliceValues() {
    var maxTicks = this._options.xAxis.ticks > 0 ? this._options.xAxis.ticks : 31;
    var maxLength = this._data.length;
    var lastSmall = false;
    var noTwoSmalls = true;
    var maxData = void 0;

    if (maxLength > maxTicks) {
        var maxIndividual = maxTicks - 1;
        var etcTotal = 0;
        var i = void 0;

        maxData = new Array();

        for (i = 0; i < maxIndividual; ++i) {
            maxData[i] = this._data[i];
            if (noTwoSmalls) {
                if (this._getMetricVal(this._data[i]) / this.total < this.minPct) {
                    if (lastSmall) {
                        noTwoSmalls = false;
                    }
                    lastSmall = true;
                } else {
                    lastSmall = false;
                }
            }
        }

        for (i = maxIndividual; i < maxLength; ++i) {
            etcTotal += this._getMetricVal(this._data[i]);
        }

        var etc = {};
        etc[this._getDimension().accessor] = this._options.plots.othersTitle;
        etc[this._getMetric().accessor] = etcTotal;
        maxData[maxIndividual] = etc;

        if (lastSmall && etcTotal / this.total < this.minPct) {
            noTwoSmalls = false;
        }
    } else {
        for (var _i = 0; _i < maxLength; ++_i) {
            if (noTwoSmalls) {
                if (this._getMetricVal(this._data[_i]) / this.total < this.minPct) {
                    if (lastSmall) {
                        noTwoSmalls = false;
                    }
                    lastSmall = true;
                } else {
                    lastSmall = false;
                }
            }
        }
        maxData = this._data;
    }

    this.consecutiveSmalls = !noTwoSmalls;

    return maxData;
};

var percentFormat = format(".00%");

var DefaultOptions$1 = {
    chart: {
        type: 'pie'
    },
    animation: {
        duration: {
            slice: 1000
        }
    },
    plots: {
        othersTitle: 'Others',
        isDonut: false,
        innerRadiusRatio: 0.4
    },
    slice: {
        labelPosition: 'auto',
        labelMinPercentage: 0.01
    }
};

var Pie = function (_AbstractBasicCartesi) {
    inherits$1(Pie, _AbstractBasicCartesi);

    function Pie(canvasId, _userOptions) {
        classCallCheck$2(this, Pie);

        var _this2 = possibleConstructorReturn$1(this, (Pie.__proto__ || Object.getPrototypeOf(Pie)).call(this, canvasId, _userOptions));

        _this2.sliceGroup;
        _this2.labelGroup;
        _this2.lineGroup;
        _this2.linkGroup;

        _this2.total = 0;
        _this2.consecutiveSmalls = false;
        _this2._limitSliceValues = limitSliceValues.bind(_this2);
        _this2._mergeWithFirstEqualZero = mergeWithFirstEqualZero.bind(_this2);

        _this2._key = function (d) {
            return d.data[_this2._getDimension().accessor];
        };
        //override
        _this2._c = function (d, i) {
            if (d.color) {
                return d.color;
            }

            switch (_this2._options.color.type) {
                case Globals.ColorType.CATEGORICAL:
                    return _this2._color(_this2._getDimensionVal(d.data));
                case Globals.ColorType.GRADIENT:
                case Globals.ColorType.DISTINCT:
                    return _this2._color(_this2._getMetricVal(d.data));
                default:
                    return _this2._color(_this2._getMetricVal(d.data));
            }
        };
        _this2._p = function (d) {
            var pct = _this2._getMetricVal(d.data) / _this2.total;
            return pct < _this2.minPct && _this2.consecutiveSmalls ? '' : _this2._getDimensionVal(d.data) + ': ' + percentFormat(pct);
        };
        return _this2;
    }

    createClass$2(Pie, [{
        key: 'render',
        value: function render(_data) {
            get$3(Pie.prototype.__proto__ || Object.getPrototypeOf(Pie.prototype), 'render', this).call(this, _data);

            this._svg.attr("transform", "translate(" + (this._options.chart.innerWidth / 2 + this._options.chart.margin.left) + "," + (this._options.chart.innerHeight / 2 + this._options.chart.margin.top) + ")");

            this.sliceGroup = this._svg.append("g").attr("class", "slices");
            this.labelGroup = this._svg.append("g").attr("class", "labels");
            this.lineGroup = this._svg.append("g").attr("class", "lines");
            this.linkGroup = this._svg.append("g").attr('class', 'link-group');

            this.radius = Math.min(this._options.chart.innerWidth, this._options.chart.innerHeight) / 2;
            this.minPct = this._options.slice.labelMinPercentage > 0 ? this._options.slice.labelMinPercentage : 0.01;

            this.update();
        }
    }, {
        key: 'update',
        value: function update() {
            var _this3 = this;

            var that = this;

            get$3(Pie.prototype.__proto__ || Object.getPrototypeOf(Pie.prototype), 'update', this).call(this);

            var _arc = arc().outerRadius(this.radius * 0.8).innerRadius(function () {
                return _this3._options.plots.isDonut ? _this3.radius * _this3._options.plots.innerRadiusRatio : 0;
            });

            this.outerArc = arc().innerRadius(this.radius * 0.9).outerRadius(this.radius * 0.9);

            var _pie = pie().sort(null).value(this._getMetricVal);

            var data1 = this._limitSliceValues(this.total);
            var data0 = this._svg.select('.slices').selectAll("path.slice").data().map(function (d) {
                return d.data;
            });
            if (data0.length == 0) data0 = data1;
            var was = this._mergeWithFirstEqualZero(data1, data0);
            var is = this._mergeWithFirstEqualZero(data0, data1);

            /* ------- SLICE ARCS -------*/

            var slice = this.sliceGroup.selectAll("path.slice").data(_pie(was), this._key);

            slice.enter().append("path").attr("class", "slice").each(function (d) {
                this._current = d;
            }).style("fill", this._c).style('stroke-width', 2);

            slice = this.sliceGroup.selectAll("path.slice").data(_pie(is), this._key);

            slice.transition().duration(this._options.animation.duration.slice).attrTween("d", function (d) {
                var _interpolate = interpolate(this._current, d);
                var _this = this;
                return function (t) {
                    _this._current = _interpolate(t);
                    return _arc(_this._current);
                };
            });

            slice = this.sliceGroup.selectAll("path.slice").data(_pie(data1), this._key);

            slice.exit().transition().delay(this._options.animation.duration.slice).duration(0).remove();

            /* ------- TEXT LABELS -------*/

            var text = this.labelGroup.selectAll("text").data(_pie(was), this._key);

            text.enter().append("text").attr('dx', "0px").attr("dy", "0px").style('font-size', '12px').style("opacity", 0).text(this._p).each(function (d) {
                this._current = d;
            });

            text = this.labelGroup.selectAll("text").data(_pie(is), this._key);

            text.transition().duration(this._options.animation.duration.slice).style("opacity", function (d) {
                return _this3._getMetricVal(d.data) == 0 ? 0 : 1;
            }).attrTween("transform", function (d) {
                var _interpolate = interpolate(this._current, d);
                var _this = this;
                return function (t) {
                    var d2 = _interpolate(t);
                    _this._current = d2;

                    var pos = getLabelPosition(that.outerArc, d2);

                    return "translate(" + pos + ")";
                };
            }).styleTween("text-anchor", function (d) {
                var _interpolate = interpolate(this._current, d);
                return function (t) {
                    var d2 = _interpolate(t);
                    return midAngle(d2) < Math.PI ? "start" : "end";
                };
            }).text(this._p);

            text = this.labelGroup.selectAll("text").data(_pie(data1), this._key);

            text.exit().transition().delay(this._options.animation.duration.slice).remove();

            /* ------- SLICE TO TEXT POLYLINES -------*/

            var polyline = this.lineGroup.selectAll("polyline").data(_pie(was), this._key);

            polyline.enter().append("polyline").style("opacity", 0).style('stroke', this._c).style('stroke-width', 2).style('fill', 'none').each(function (d) {
                this._current = d;
            });

            polyline = this.lineGroup.selectAll("polyline").data(_pie(is), this._key);

            polyline.transition().duration(this._options.animation.duration.slice).attr('fill', this._c).style("opacity", function (d) {
                return _this3._getMetricVal(d.data) == 0 ? 0 : .5;
            }).attrTween("points", function (d) {
                this._current = this._current;
                var _interpolate = interpolate(this._current, d);
                var _this = this;

                return function (t) {
                    var d2 = _interpolate(t);
                    _this._current = d2;

                    var pct = that._getMetricVal(d.data) / that.total;

                    if (pct < that.minPct && that.consecutiveSmalls) {
                        return [];
                    } else {
                        var c = _arc.centroid(d2);
                        var x = c[0];
                        var y = c[1];

                        var starting = [];
                        // pythagorean theorem for hypotenuse
                        var h = Math.sqrt(x * x + y * y);

                        starting[0] = x / h * that.radius * 0.8;
                        starting[1] = y / h * that.radius * 0.8;

                        var pos = getLinePosition(that.outerArc, d2);

                        return [starting, pos];
                    }
                };
            });

            polyline = this.lineGroup.selectAll("polyline").data(_pie(data1), this._key);

            polyline.exit().transition().delay(this._options.animation.duration.slice).remove();

            /* ------- Link Nodes -------*/

            var linkNode = this.linkGroup.selectAll(".link-node").data(_pie(was), this._key);

            linkNode.enter().append("circle").attr('class', 'link-node').attr("r", 6).style("opacity", 0).attr('fill', this._c).attr('stroke', 'white').attr('stroke-width', '2px').each(function (d) {
                this._current = d;
            });

            linkNode = this.linkGroup.selectAll(".link-node").data(_pie(is), this._key);

            linkNode.transition().duration(this._options.animation.duration.slice).style("opacity", function (d) {
                return _this3._getMetricVal(d.data) == 0 ? 0 : 1;
            }).attrTween("transform", function (d) {
                //let c = arc.centroid(d),
                //    x = c[0],
                //    y = c[1],
                //// pythagorean theorem for hypotenuse
                //    h = Math.sqrt(x*x + y*y);
                //return "translate(" + (x/h * radius) +  ',' +
                //    (y/h * radius) +  ")";

                this._current = this._current;
                var _interpolate = interpolate(this._current, d);
                var _this = this;
                return function (t) {
                    var d2 = _interpolate(t);
                    _this._current = d2;

                    var c = that.outerArc.centroid(d2);
                    var x = c[0];
                    var y = c[1];
                    // pythagorean theorem for hypotenuse
                    var h = Math.sqrt(x * x + y * y);
                    return "translate(" + x / h * that.radius * 0.8 + ',' + y / h * that.radius * 0.8 + ")";
                    //return "translate("+  +")";
                };
            });

            linkNode = this.linkGroup.selectAll(".link-node").data(_pie(data1), this._key);

            linkNode.exit().transition().delay(this._options.animation.duration.slice).remove();

            this._bindTooltip(this.sliceGroup.selectAll("path.slice"), true);
        }
    }, {
        key: 'transitionColor',
        value: function transitionColor(colorOptions) {
            var _this4 = this;

            get$3(Pie.prototype.__proto__ || Object.getPrototypeOf(Pie.prototype), 'transitionColor', this).call(this, colorOptions);

            var maxTicks = this._options.xAxis.ticks > 0 ? this._options.xAxis.ticks : 31;
            var maxSlices = this._data.length > 0 && this._data.length < maxTicks ? this._data.length : maxTicks;

            var _trans = transition().duration(this._options.animation.duration.color).delay(function (d, i) {
                return i / maxSlices * _this4._options.animation.duration.color;
            });

            this.sliceGroup.selectAll("path.slice").transition(_trans).style("fill", this._c);

            this.linkGroup.selectAll(".link-node").transition(_trans).style("fill", this._c);

            this.lineGroup.selectAll("polyline").transition(_trans).style("stroke", this._c);
        }
    }, {
        key: 'donut',
        value: function donut() {
            var isDonut = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

            if (isDonut === false) {
                this._options.plots.isDonut = false;
            } else {
                this._options.plots.isDonut = true;
                this._options.plots.innerRadiusRatio = 0.4;
            }

            this.update();
        }
    }, {
        key: 'data',
        value: function data(_data) {
            var _this5 = this;

            if (check(_data) === true) {
                this.total = sum(_data, function (d) {
                    return _this5._getMetricVal(d);
                });
            }

            get$3(Pie.prototype.__proto__ || Object.getPrototypeOf(Pie.prototype), 'data', this).call(this, _data);
        }
    }, {
        key: 'createOptions',
        value: function createOptions(_userOpt) {
            return createCartesianOpt(DefaultOptions$1, _userOpt);
        }
    }, {
        key: '_getTooltipHTML',
        value: function _getTooltipHTML(d) {
            return TooltipTpl.replace("{{header}}", this._getDimensionVal(d.data)).replace("{{name}}", this._getMetric().name).replace("{{value}}", this._getMetricVal(d.data)).replace("{{borderStroke}}", this._c(d));
        }
    }, {
        key: '_provideColor',
        value: function _provideColor() {
            // pie's other slice may contain value out of range
            return get$3(Pie.prototype.__proto__ || Object.getPrototypeOf(Pie.prototype), '_provideColor', this).call(this).clamp(true);
        }
    }]);
    return Pie;
}(AbstractBasicCartesianChart);

var Curves = {
    LINEAR: 'linear',
    LINEAR_CLOSED: 'linear-closed',
    STEP: 'step',
    STEP_BEFORE: 'step-before',
    STEP_AFTER: 'step-after',
    BASIS: 'basis',
    BASIS_OPEN: 'basis-open',
    BASIS_CLOSED: 'basis-closed',
    BUNDLE: 'bundle',
    CARDINAL: 'cardinal',
    CARDINAL_OPEN: 'cardinal-open',
    CARDINAL_CLOSED: 'cardinal-closed',
    MONOTONE_X: 'monotoneX',
    MONOTONE_Y: 'monotoneY',
    NATURAL: 'natural',
    CATMULL_ROM: 'catmull-rom',
    CATMULL_ROM_CLOSED: 'catmull-rom-closed',
    CATMULL_ROM_OPEN: 'catmull-rom-open'
};

var interpolateCurve = function interpolateCurve(_curve, _shapes) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = _shapes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var _shape = _step.value;

            switch (_curve) {
                case Curves.LINEAR:
                    _shape.curve(curveLinear);

                    break;
                case Curves.LINEAR_CLOSED:
                    _shape.curve(curveLinearClosed);

                    break;
                case Curves.STEP:
                    _shape.curve(curveStep);

                    break;
                case Curves.STEP_BEFORE:
                    _shape.curve(stepBefore);

                    break;
                case Curves.STEP_AFTER:
                    _shape.curve(stepAfter);

                    break;
                case Curves.BASIS:
                    _shape.curve(curveBasis);

                    break;
                case Curves.BASIS_OPEN:
                    _shape.curve(curveBasisOpen);

                    break;
                case Curves.BASIS_CLOSED:
                    _shape.curve(curveBasisClosed);

                    break;
                case Curves.BUNDLE:
                    _shape.curve(curveBundle);

                    break;
                case Curves.CARDINAL:
                    _shape.curve(curveCardinal);

                    break;
                case Curves.CARDINAL_OPEN:
                    _shape.curve(curveCardinalOpen);

                    break;
                case Curves.CARDINAL_CLOSED:
                    _shape.curve(curveCardinalClosed);

                    break;
                case Curves.MONOTONE_X:
                    _shape.curve(monotoneX);
                    break;
                case Curves.MONOTONE_Y:
                    _shape.curve(monotoneY);
                    break;
                case Curves.NATURAL:
                    _shape.curve(curveNatural);
                    break;

                case Curves.CATMULL_ROM:
                    _shape.curve(curveCatmullRom);
                    break;

                case Curves.CARDINAL_CLOSED:
                    _shape.curve(curveCatmullRomClosed);
                    break;

                case Curves.CARDINAL_OPEN:
                    _shape.curve(curveCatmullRomOpen);
                    break;

                default:
                    break;
            }
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }
};

var LinearGradient = function () {
    function LinearGradient(scheme) {
        classCallCheck$2(this, LinearGradient);

        this._id = uuid();
        this._scheme = scheme;
        this._colorStops = linearStops(scheme);
        this._layer;
    }

    createClass$2(LinearGradient, [{
        key: 'id',
        value: function id() {
            return '#' + this._id;
        }
    }, {
        key: 'render',
        value: function render(_svg) {
            this._layer = _svg.append("linearGradient").attr("id", this._id).attr("gradientUnits", "userSpaceOnUse").attr("x1", '0%').attr("y1", '100%').attr("x2", '0%').attr("y2", '0%');

            this._layer.selectAll("stop").data(this._colorStops).enter().append("stop").attr("offset", function (d) {
                return d.offset;
            }).attr("stop-color", function (d) {
                return d.color;
            }).attr('stop-opacity', 1);
        }
    }, {
        key: 'update',
        value: function update(_scheme, _dataLength) {
            this._scheme = _scheme;
            this._colorStops = linearStops(_scheme);

            this._layer.selectAll("stop").data(this._colorStops).transition().duration(1000).delay(function (d, i) {
                return i / _dataLength * 1000;
            }).attr("offset", function (d) {
                return d.offset;
            }).attr("stop-color", function (d) {
                return d.color;
            });
        }
    }, {
        key: 'top',
        value: function top() {
            return this._colorStops[this._colorStops.length - 1].color;
        }
    }, {
        key: 'scheme',
        get: function get$$1() {
            return this._scheme;
        },
        set: function set$$1(scheme) {
            this._scheme = scheme;
        }
    }]);
    return LinearGradient;
}();

var AreaOpt = {
    chart: {
        type: 'area_horizontal'
    },
    plots: {
        areaOpacity: 1,
        curve: 'basis',
        strokeWidth: 4,
        nodeRadius: 4,
        drawArea: true,
        showDots: true
    }
};

var Area = function (_AbstractBasicCartesi) {
    inherits$1(Area, _AbstractBasicCartesi);

    function Area(canvasId, _userOptions) {
        classCallCheck$2(this, Area);

        var _this = possibleConstructorReturn$1(this, (Area.__proto__ || Object.getPrototypeOf(Area)).call(this, canvasId, _userOptions));

        _this.pathLayer;
        _this.nodeLayer;
        _this._curve;
        _this._baseLine;
        _this.linearGradent = new LinearGradient(_this._options.color.scheme);
        _this.nodeColor = function () {
            return _this.linearGradent.top();
        };
        return _this;
    }

    createClass$2(Area, [{
        key: 'render',
        value: function render(_data) {
            var _this2 = this;

            get$3(Area.prototype.__proto__ || Object.getPrototypeOf(Area.prototype), 'render', this).call(this, _data);

            this.pathLayer = this._svg.append('g').attr('class', 'series-layer');
            this.nodeLayer = this._svg.append('g').attr('class', 'node-layer');

            if (this._options.plots.drawArea === true) {
                this._curve = area().x(this._x).y0(this._options.chart.innerHeight).y1(this._y);

                this._baseLine = area().x(this._x).y0(this._options.chart.innerHeight).y1(this._options.chart.innerHeight);
            } else {
                this._curve = line().x(this._x).y(this._y);

                this._baseLine = line().x(this._x).y(this._options.chart.innerHeight);
            }

            interpolateCurve(this._options.plots.curve, [this._curve, this._baseLine]);
            this.linearGradent.render(this._svg);

            if (this._options.plots.drawArea === true) {
                this.pathLayer.append("path").datum(this._data).style('fill', 'url(' + this.linearGradent.id() + ')').style('stroke', 'none').style('fill-opacity', this._options.plots.areaOpacity).style('stroke-width', this._options.plots.strokeWidth + 'px').attr("d", this._baseLine).attr('class', 'path').transition().duration(this._options.animation.duration.update).delay(function (d, i) {
                    return i / _this2._data.length * _this2._options.animation.duration.update;
                }).attr("d", this._curve);
            } else {
                this.pathLayer.append("path").datum(this._data).style('fill', 'none').style('stroke', 'url(' + this.linearGradent.id() + ')').style('stroke-width', this._options.plots.strokeWidth + 'px').attr("d", this._baseLine).attr('class', 'path').transition().duration(this._options.animation.duration.update).delay(function (d, i) {
                    return i / _this2._data.length * _this2._options.animation.duration.update;
                }).ease(cubicOut).attr("d", this._curve);
            }

            this.nodeLayer.selectAll(".node").data(this._data).enter().append("circle").attr("class", "node").attr("r", this._options.plots.nodeRadius).attr("cx", this._x).attr("cy", this._options.chart.innerHeight).attr('fill', this.nodeColor).attr('opacity', 0).transition().duration(this._options.animation.duration.update).attr("cy", this._y).attr('opacity', this._options.plots.showDots ? 1 : 0);

            this._bindTooltip(this.nodeLayer.selectAll(".node"));
        }
    }, {
        key: 'update',
        value: function update() {
            var _this3 = this;

            get$3(Area.prototype.__proto__ || Object.getPrototypeOf(Area.prototype), 'update', this).call(this);

            interpolateCurve(this._options.plots.curve, [this._curve, this._baseLine]);
            this.linearGradent.update(this._options.color.scheme, this._data.length);

            this.pathLayer.select('.path').transition("ease-shape-and-node").duration(this._options.animation.duration.remove).delay(function (d, i) {
                return i / _this3._data.length * _this3._options.animation.duration.remove;
            }).attr("d", this._baseLine);

            this.nodeLayer.selectAll(".node").transition("ease-shape-and-node").duration(this._options.animation.duration.remove).attr('opacity', 0.2).attr("cy", this._options.chart.innerHeight);

            this.pathLayer.select('.path').datum(this._data).attr("d", this._baseLine).transition("arise-transition").duration(this._options.animation.duration.update).delay(function (d, i) {
                return i / _this3._data.length * _this3._options.animation.duration.update;
            }).style('stroke-width', this._options.plots.strokeWidth + 'px').attr("d", this._curve);

            var nodes_update = this.nodeLayer.selectAll(".node").data(this._data);

            nodes_update.exit().transition("remove-transition").duration(this._options.animation.duration.remove).attr('opacity', 0).remove();

            nodes_update.attr("cx", this._x).transition("update-transition").duration(this._options.animation.duration.remove).delay(function (d, i) {
                return i / _this3._data.length * _this3._options.animation.duration.remove;
            }).attr('opacity', this._options.plots.showDots ? 1 : 0).attr("r", this._options.plots.nodeRadius).attr("cy", this._y);

            nodes_update.enter().append("circle").attr("class", "node").attr("r", this._options.plots.nodeRadius).attr("cx", this._x).attr("cy", this._options.chart.innerHeight).attr('fill', this.nodeColor).attr('opacity', this._options.plots.showDots ? 0.2 : 0).transition("update-transition").duration(this._options.animation.duration.update).delay(function (d, i) {
                return i / _this3._data.length * _this3._options.animation.duration.update;
            }).attr("cy", this._y).attr('opacity', this._options.plots.showDots ? 1 : 0);

            this._bindTooltip(this.nodeLayer.selectAll(".node"));
        }
    }, {
        key: 'transitionColor',
        value: function transitionColor(colorOptions) {
            get$3(Area.prototype.__proto__ || Object.getPrototypeOf(Area.prototype), 'transitionColor', this).call(this, colorOptions);

            this.linearGradent.update(this._options.color.scheme, this._data.length);
            // link node
            this.nodeLayer.selectAll(".node").transition().duration(this._options.animation.duration.remove).attr('fill', this.nodeColor);
        }
    }, {
        key: 'createOptions',
        value: function createOptions(_userOpt) {
            return createCartesianOpt(AreaOpt, _userOpt);
        }
    }]);
    return Area;
}(AbstractBasicCartesianChartWithAxes);

var DefaultOptions$1$1 = {
    chart: {
        type: 'line'
    },
    plots: {
        curve: 'linear',
        strokeWidth: 3,
        nodeRadius: 4,
        areaOpacity: 1,
        drawArea: false,
        showDots: true
    }
};

var Line = function (_Area) {
    inherits$1(Line, _Area);

    function Line(canvasId, _userOptions) {
        classCallCheck$2(this, Line);
        return possibleConstructorReturn$1(this, (Line.__proto__ || Object.getPrototypeOf(Line)).call(this, canvasId, _userOptions));
    }

    createClass$2(Line, [{
        key: 'createOptions',
        value: function createOptions(_userOpt) {
            return createCartesianOpt(DefaultOptions$1$1, _userOpt);
        }
    }]);
    return Line;
}(Area);

var ScatterOptions = {
    chart: {
        type: 'scatter'
    },
    plots: {
        blur: false,
        opacity: 1,
        bubble: {
            min: 6,
            max: 20,
            default: 8
        }
    },

    zAxis: {
        allowDecimals: false,
        scale: null,
        max: 100,
        min: 0
    },

    data: {
        z: {
            accessor: null,
            type: Globals.DataType.NUMBER,
            formatter: null
        }
    }
};

var Scatter = function (_AbstractBasicCartesi) {
    inherits$1(Scatter, _AbstractBasicCartesi);

    function Scatter(canvasId, _userOptions) {
        classCallCheck$2(this, Scatter);

        var _this = possibleConstructorReturn$1(this, (Scatter.__proto__ || Object.getPrototypeOf(Scatter)).call(this, canvasId, _userOptions));

        _this.dotGroup;

        _this._getRadius = function () {
            return _this._options.data.z;
        };

        _this._getRadiusValue = function (d) {
            return _this._getRadius() && _this._getRadius().accessor ? d[_this._getRadius().accessor] : null;
        };

        _this._z = function (d) {
            return _this._getRadius() && _this._getRadius().accessor ? _this._getRadius().scale(_this._getRadiusValue(d)) : _this._options.plots.bubble.default;
        };

        _this._refreshZScale = function () {
            if (_this._getRadius() && _this._getRadius().accessor) {
                _this._getRadius().scale.range([_this._options.plots.bubble.min, _this._options.plots.bubble.max]);
            }
        };

        return _this;
    }

    createClass$2(Scatter, [{
        key: 'render',
        value: function render(_data) {
            get$3(Scatter.prototype.__proto__ || Object.getPrototypeOf(Scatter.prototype), 'render', this).call(this, _data);
            this.dotGroup = this._svg.append('g').attr('class', 'dot-group');

            this.update();
        }
    }, {
        key: 'update',
        value: function update() {
            var _this2 = this;

            get$3(Scatter.prototype.__proto__ || Object.getPrototypeOf(Scatter.prototype), 'update', this).call(this);
            this._refreshZScale();

            var circles = this.dotGroup.selectAll('.scatter-dot').data(this._data);

            circles.exit().transition("ease-transition").duration(this._options.animation.duration.remove).attr('opacity', 0).attr('r', 1).attr('cy', this._options.chart.innerHeight + this._options.chart.margin.top - 20).remove();

            circles.attr('data-dimension', this.voronoiSelector).transition("update-transition").duration(function (d, i) {
                return _this2._options.animation.duration.add / _this2._data.length * i;
            }).delay(function (d, i) {
                return i / _this2._data.length * _this2._options.animation.duration.update;
            }).attr('cx', this._x).attr('cy', this._y).attr('r', this._z).style('opacity', this._options.plots.opacity).attr('fill', this._c);

            circles.enter().append('circle').attr('cx', this._x).attr('cy', this._options.chart.innerHeight + this._options.chart.margin.top - 20).attr('r', this._z).attr('class', 'scatter-dot').attr('data-dimension', this.voronoiSelector).attr('fill', this._c).style('opacity', 0).transition("append-circle-transition").duration(function (d, i) {
                return _this2._options.animation.duration.add / _this2._data.length * i;
            }).delay(function (d, i) {
                return i / _this2._data.length * _this2._options.animation.duration.add;
            }).style('opacity', this._options.plots.opacity).attr('cy', this._y);

            this._bindTooltip(this.dotGroup.selectAll('.scatter-dot'));
        }
    }, {
        key: 'transitionColor',
        value: function transitionColor(colorOptions) {
            var _this3 = this;

            get$3(Scatter.prototype.__proto__ || Object.getPrototypeOf(Scatter.prototype), 'transitionColor', this).call(this, colorOptions);

            this.dotGroup.selectAll('.scatter-dot').transition().duration(this._options.animation.duration.update).delay(function (d, i) {
                return i / _this3._data.length * _this3._options.animation.duration.update;
            }).attr('fill', this._c);
        }
    }, {
        key: 'createOptions',
        value: function createOptions(_userOpt) {
            return createCartesianOpt(ScatterOptions, _userOpt);
        }
    }]);
    return Scatter;
}(AbstractBasicCartesianChartWithAxes);

var CartesianStackedOptions = {
    chart: {
        margin: {
            left: 60,
            bottom: 50,
            right: 10,
            top: 20
        }
    },
    color: {
        scheme: MetroRain8,
        type: Globals.ColorType.CATEGORICAL
    },
    ordering: {
        accessor: null,
        direction: 'asc'
    },

    series: {
        allowDecimals: false,
        scale: null,
        max: null,
        min: null,
        ticks: 0,
        title: {
            text: '',
            style: ''
        }
    },

    xAxis: {
        allowDecimals: false,
        scale: null,
        ticks: 0,
        tickFormat: null,
        max: null,
        min: null,
        labelAngle: 0,

        title: {
            text: '',
            style: ''
        }
    },

    yAxis: [{
        allowDecimals: false,
        scale: null,
        max: null,
        min: null,
        ticks: 0,
        title: {
            text: '',
            style: ''
        }
    }],

    data: {
        s: {
            accessor: null,
            type: Globals.DataType.STRING,
            formatter: function formatter() {}
        },
        x: {
            accessor: null,
            type: Globals.DataType.STRING,
            formatter: function formatter() {}
        },
        y: [{
            accessor: null,
            type: Globals.DataType.NUMBER,
            formatter: function formatter() {},
            yAxis: 0
        }]
    }

};

var createCartesianStackedOpt = function createCartesianStackedOpt(_chartOpt, _userOpt) {
    var cartesianOpt = mergeBase(CartesianStackedOptions, _chartOpt, _userOpt);

    cartesianOpt.ordering.accessor = cartesianOpt.data.x.accessor;

    return cartesianOpt;
};

var StackedOptions = {
    chart: {
        type: 'area_stacked'
    },
    animation: {
        duration: {
            curve: 500
        }
    },
    plots: {
        stackLayout: true,
        stackMethod: Stacks.Zero,
        showDots: false,
        curve: 'basis',
        strokeWidth: 2,
        opacityArea: 0.7
    }
};

var AreaMultiOptions = {
    chart: {
        type: 'area_multi'
    },
    animation: {
        duration: {
            curve: 500
        }
    },
    plots: {
        stackLayout: false,
        stackMethod: Stacks.Zero,
        showDots: false,
        curve: 'basis',
        strokeWidth: 2,
        opacityArea: 0.7
    }
};

var ExpandedOptions = {
    chart: {
        type: 'area_expanded'
    },
    animation: {
        duration: {
            curve: 500
        }
    },
    plots: {
        stackLayout: true,
        stackMethod: Stacks.Expand,
        showDots: false,
        curve: 'basis',
        strokeWidth: 2,
        opacityArea: 0.7
    }
};

var StackedArea = function (_AbstractStackedCarte) {
    inherits$1(StackedArea, _AbstractStackedCarte);

    function StackedArea(canvasId, _userOptions) {
        classCallCheck$2(this, StackedArea);

        var _this = possibleConstructorReturn$1(this, (StackedArea.__proto__ || Object.getPrototypeOf(StackedArea)).call(this, canvasId, _userOptions));

        _this._curve = area().x(_this._x).y0(_this._options.chart.innerHeight).y1(_this._y);

        _this._baseLine = area().x(_this._x).y0(_this._options.chart.innerHeight).y1(_this._options.chart.innerHeight);

        _this._nodeY = function (d) {
            return _this._options.plots.stackLayout ? _this._y1(d) : _this._y(d);
        };
        return _this;
    }

    createClass$2(StackedArea, [{
        key: 'createOptions',
        value: function createOptions(_userOpt) {
            return createCartesianStackedOpt(StackedOptions, _userOpt);
        }
    }, {
        key: 'render',
        value: function render(_data) {
            get$3(StackedArea.prototype.__proto__ || Object.getPrototypeOf(StackedArea.prototype), 'render', this).call(this, _data);
            this.update();
        }
    }, {
        key: 'update',
        value: function update() {
            var _this2 = this;

            get$3(StackedArea.prototype.__proto__ || Object.getPrototypeOf(StackedArea.prototype), 'update', this).call(this);

            if (this._options.plots.stackLayout) {
                this._curve = area().x(this._x).y0(this._y0).y1(this._y1);
            } else {
                this._curve = area().x(this._x).y0(this._options.chart.innerHeight).y1(this._y);
            }

            interpolateCurve(this._options.plots.curve, [this._curve, this._baseLine]);

            var seriesUpdate = this._svg.selectAll(".series").data(this._data.nested);

            // EXIT
            var exitSeries = seriesUpdate.exit();

            exitSeries.select('.curve').transition("shape-fall-down").duration(this._options.animation.duration.remove).attr("d", function (d) {
                return _this2._baseLine(d.values);
            });

            exitSeries.selectAll(".node").transition("shape-fall-down").duration(this._options.animation.duration.remove).attr('opacity', 0.2).attr("cy", this._options.chart.innerHeight);

            exitSeries.remove();

            // UPDATE
            seriesUpdate.select('.curve').transition().duration(this._options.animation.duration.curve).delay(function (d, i) {
                return i / _this2._data.nested.length * _this2._options.animation.duration.curve;
            }).attr("d", function (d) {
                return _this2._curve(d.values);
            }).style('stroke-width', this._options.plots.strokeWidth).style('fill', this._c).style('fill-opacity', this._options.plots.opacityArea).style('stroke', this._c);

            var updatedNodes = seriesUpdate.selectAll(".node").data(function (d) {
                return d.values;
            });

            updatedNodes.exit().transition("remove-transition").duration(this._options.animation.duration.remove).attr('opacity', 0).remove();

            updatedNodes.transition("update-transition").duration(this._options.animation.duration.remove).delay(function (d, i) {
                return i * 20;
            }).attr('opacity', this._options.showDots === true ? 1 : 0).attr("cx", this._x).attr("cy", this._nodeY);

            updatedNodes.enter().append("circle").attr("class", "node").attr("r", 4).attr("cx", this._x).attr("cy", this._options.chart.innerHeight).attr('fill', this._c).attr('opacity', 0).transition("update-transition").duration(this._options.animation.duration.curve).delay(function (d, i) {
                return i / _this2._getDimension().values.length * _this2._options.animation.duration.curve;
            }).attr("cy", this._nodeY).attr('opacity', this._options.showDots === true ? 1 : 0);

            // APPEND
            var addedSeries = seriesUpdate.enter().append("g").attr("class", "series");

            addedSeries.append("path").style('stroke', this._c).style('stroke-opacity', 1).style('stroke-width', this._options.plots.strokeWidth).style('fill', this._c).style('fill-opacity', this._options.plots.opacityArea).attr("d", function (d) {
                return _this2._baseLine(d.values);
            }).attr('class', 'curve').transition('append-series').duration(this._options.animation.duration.curve).delay(function (d, i) {
                return i / _this2._data.nested.length * _this2._options.animation.duration.curve;
            }).attr("d", function (d) {
                return _this2._curve(d.values);
            });

            addedSeries.selectAll(".node").data(function (d) {
                return d.values;
            }).enter().append("circle").attr("class", "node").attr("r", 4).attr("cx", this._x).attr("cy", this._options.chart.innerHeight).attr('fill', this._c).attr('opacity', 0).attr("data-ctrl", function (d) {
                return "stream-node-" + _this2._getSeriesVal(d) + '-' + _this2._getDimensionVal(d);
            }).transition('append-series').duration(this._options.animation.duration.curve).delay(function (d, i) {
                return i / _this2._getDimension().values.length * _this2._options.animation.duration.curve;
            }).attr("cy", this._nodeY).attr('opacity', this._options.plots.showDots === true ? 1 : 0);
        }
    }, {
        key: 'transitionColor',
        value: function transitionColor(colorOptions) {
            var _this3 = this;

            get$3(StackedArea.prototype.__proto__ || Object.getPrototypeOf(StackedArea.prototype), 'transitionColor', this).call(this, colorOptions);

            // line
            this._svg.selectAll('.curve').transition().duration(this._options.animation.duration.curve).delay(function (d, i) {
                return i / _this3._data.nested.length * _this3._options.animation.duration.curve;
            }).style('stroke', this._c).style('fill', this._c);

            // link node
            this._svg.selectAll(".area-node").transition().duration(this._options.animation.duration.remove).attr('fill', this._c);
        }
    }, {
        key: '_updateLayout',
        value: function _updateLayout(_opt) {
            this._options.chart.type = _opt.chart.type;
            this._options.plots.stackLayout = _opt.plots.stackLayout;
            this._options.plots.stackMethod = _opt.plots.stackMethod;
        }
    }, {
        key: 'stackLayout',
        value: function stackLayout() {
            this._updateLayout(StackedOptions);

            this.update();
        }
    }, {
        key: 'expandLayout',
        value: function expandLayout() {
            this._updateLayout(ExpandedOptions);

            this.update();
        }
    }, {
        key: 'groupedLayout',
        value: function groupedLayout() {
            this._updateLayout(AreaMultiOptions);

            this.update();
        }
    }]);
    return StackedArea;
}(AbstractStackedCartesianChartWithAxes);

var DefaultOptions$2 = {
    chart: {
        type: 'stream'
    },
    plots: {
        stackLayout: true,
        stackMethod: Stacks.Wiggle,
        opacityArea: 0.7,
        dotRadius: 8
    }
};

var Stream = function (_AbstractStackedCarte) {
    inherits$1(Stream, _AbstractStackedCarte);

    function Stream(canvasId, _userOptions) {
        classCallCheck$2(this, Stream);
        return possibleConstructorReturn$1(this, (Stream.__proto__ || Object.getPrototypeOf(Stream)).call(this, canvasId, _userOptions));
    }

    createClass$2(Stream, [{
        key: 'render',
        value: function render(_data) {
            get$3(Stream.prototype.__proto__ || Object.getPrototypeOf(Stream.prototype), 'render', this).call(this, _data);
            this.update();
        }
    }, {
        key: 'update',
        value: function update() {
            var _this2 = this;

            get$3(Stream.prototype.__proto__ || Object.getPrototypeOf(Stream.prototype), 'update', this).call(this);

            this._baseLine = area().curve(curveCardinal).x(this._x).y0(this._options.chart.innerHeight / 2).y1(this._options.chart.innerHeight / 2);

            this._curve = area().curve(curveCardinal).x(this._x).y0(this._y0).y1(this._y1);

            var series_updated = this._svg.selectAll(".series").data(this._data.nested);

            // EXIT
            var exitSeries = series_updated.exit();

            exitSeries.select('.curve').transition().duration(this._options.animation.duration.remove).attr("d", function (d) {
                return _this2._baseLine(d.values);
            });

            exitSeries.remove();

            // UPDATE
            series_updated.select('.curve').transition().duration(this._options.animation.duration.update).delay(function (d, i) {
                return i / _this2._getDimension().values.length * _this2._options.animation.duration.update;
            }).attr("d", function (d) {
                return _this2._curve(d.values);
            }).style('stroke-width', this._options.plots.strokeWidth).style('fill', this._c).style('fill-opacity', this._options.plots.opacityArea).style('stroke', this._c);

            var streamNodes = series_updated.selectAll('.node').data(function (d) {
                return d.values;
            });

            streamNodes.exit().remove();

            streamNodes.attr("cx", this._x).attr("cy", this._y1);

            streamNodes.enter().append('circle').attr('class', 'node').attr('r', this._options.plots.dotRadius).attr("cx", this._x).attr("cy", this._y1).attr('fill', this._c).style('fill-opacity', 0).style('stroke', this._c).style('stroke-opacity', 0);

            // APPEND
            var addedSeries = series_updated.enter().append("g").attr("class", "series");

            addedSeries.append("path").style('stroke', this._c).style('stroke-opacity', 0).style('stroke-width', this._options.plots.strokeWidth).style('fill', this._c).style('fill-opacity', this._options.plots.opacityArea).attr("d", function (d) {
                return _this2._baseLine(d.values);
            }).attr('class', 'curve').transition('append-series').duration(this._options.animation.duration.update).delay(function (d, i) {
                return i / _this2._getDimension().values.length * _this2._options.animation.duration.update;
            }).attr("d", function (d) {
                return _this2._curve(d.values);
            });

            addedSeries.selectAll('.node').data(function (d) {
                return d.values;
            }).enter().append('circle').attr('class', 'node').attr('r', this._options.plots.dotRadius).attr("cx", this._x).attr("cy", this._y1).attr('fill', this._c).style('fill-opacity', 0).style('stroke', this._c).style('stroke-opacity', 0);
        }
    }, {
        key: 'transitionColor',
        value: function transitionColor(colorOptions) {
            var _this3 = this;

            get$3(Stream.prototype.__proto__ || Object.getPrototypeOf(Stream.prototype), 'transitionColor', this).call(this, colorOptions);

            this._svg.selectAll('.curve').transition().duration(this._options.animation.duration.update).delay(function (d, i) {
                return i / _this3._getDimension().values.length * _this3._options.animation.duration.update;
            }).style('stroke', this._c).style('fill', this._c);

            this._svg.selectAll(".node").transition().duration(this._options.animation.duration.remove).style('stroke', this._c);
        }
    }, {
        key: 'data',
        value: function data(_data) {
            if (check(_data) === true) {
                this._data = processStackedData(_data, this._options);

                var _min = min$1(this._data.nested.map(function (d) {
                    return min$1(d.values.map(function (d) {
                        return d.y0;
                    }));
                }));

                this._getMetric().scale.domain([_min, this._data.maxY]);
            }

            return this._data;
        }
    }, {
        key: 'createOptions',
        value: function createOptions(_userOpt) {
            return createCartesianStackedOpt(DefaultOptions$2, _userOpt);
        }
    }]);
    return Stream;
}(AbstractStackedCartesianChartWithAxes);

var DefaultOptions$3 = {
    chart: {
        type: 'line_multi'
    },
    plots: {
        curve: 'linear',
        strokeWidth: 3,
        dotRadius: 4
    }
};

var MultiLine = function (_AbstractStackedCarte) {
    inherits$1(MultiLine, _AbstractStackedCarte);

    function MultiLine(canvasId, _userOptions) {
        classCallCheck$2(this, MultiLine);

        var _this = possibleConstructorReturn$1(this, (MultiLine.__proto__ || Object.getPrototypeOf(MultiLine)).call(this, canvasId, _userOptions));

        _this._curve = line().x(_this._x).y(_this._y);

        _this._baseLine = line().x(_this._x).y(_this._options.chart.innerHeight);
        return _this;
    }

    createClass$2(MultiLine, [{
        key: 'render',
        value: function render(_data) {
            get$3(MultiLine.prototype.__proto__ || Object.getPrototypeOf(MultiLine.prototype), 'render', this).call(this, _data);
            this.update();
        }
    }, {
        key: 'update',
        value: function update() {
            var _this2 = this;

            get$3(MultiLine.prototype.__proto__ || Object.getPrototypeOf(MultiLine.prototype), 'update', this).call(this);

            // ease out line and link node
            this._svg.selectAll('.curve').transition("ease-line-and-node").duration(this._options.animation.duration.remove).delay(function (d, i) {
                return i / _this2._getDimension().values.length * _this2._options.animation.duration.remove;
            }).attr("d", function (d) {
                return _this2._baseLine(d.values);
            });

            this._svg.selectAll(".node").transition("ease-line-and-node").duration(this._options.animation.duration.remove).attr('opacity', 0.2).attr("cy", this._options.chart.innerHeight);

            interpolateCurve(this._options.plots.curve, [this._curve, this._baseLine]);

            var seriesUpdate = this._svg.selectAll(".series").data(this._data.nested);

            seriesUpdate.exit().remove();

            seriesUpdate.select('.curve').attr("d", function (d) {
                return _this2._baseLine(d.values);
            }).transition("line-up-transition").duration(this._options.animation.duration.update).delay(function (d, i) {
                return i / _this2._getDimension().values.length * _this2._options.animation.duration.update;
            }).attr("d", function (d) {
                return _this2._curve(d.values);
            }).style('stroke-width', this._options.plots.strokeWidth);

            var linkNodes = seriesUpdate.selectAll(".node").data(function (d) {
                return d.values;
            });

            linkNodes.exit().transition("remove-line-node-transition").duration(this._options.animation.duration.remove).attr('opacity', 0).remove();

            linkNodes.attr("cx", this._x).transition("update-line-node-transition").duration(this._options.animation.duration.remove).delay(function (d, i) {
                return i * 20;
            }).attr('opacity', 1).attr("cy", this._y);

            linkNodes.enter().append("circle").attr("class", "node").attr("r", this._options.plots.dotRadius).attr("cx", this._x).attr("cy", this._options.chart.innerHeight).attr('fill', this._c).attr('opacity', 0.2).transition("update-line-node-transition").duration(this._options.animation.duration.update).delay(function (d, i) {
                return i * 20;
            }).attr("cy", this._y).attr('opacity', 1);

            var addedSeries = seriesUpdate.enter().append("g").attr("class", "servies");

            addedSeries.append("path").style('stroke', this._c).style('stroke-opacity', 1).style('stroke-width', this._options.plots.strokeWidth).style('fill', 'none').attr("d", function (d) {
                return _this2._baseLine(d.values);
            }).attr('class', 'curve').transition().duration(this._options.animation.duration.update).delay(function (d, i) {
                return i / _this2._data.nested.length * _this2._options.animation.duration.update;
            }).ease(cubicOut).attr("d", function (d) {
                return _this2._curve(d.values);
            });

            addedSeries.selectAll(".node").data(function (d) {
                return d.values;
            }).enter().append("circle").attr("class", "node").attr("r", this._options.plots.dotRadius).attr("cx", this._x).attr("cy", this._options.chart.innerHeight).attr('fill', this._c).attr('opacity', 0).transition().duration(this._options.animation.duration.update).attr("cy", this._y).attr('opacity', 1);
        }
    }, {
        key: 'transitionColor',
        value: function transitionColor(colorOptions) {
            var _this3 = this;

            get$3(MultiLine.prototype.__proto__ || Object.getPrototypeOf(MultiLine.prototype), 'transitionColor', this).call(this, colorOptions);

            var _trans = transition().duration(this._options.animation.duration.update).delay(function (d, i) {
                return i / _this3._data.nested.length * _this3._options.animation.duration.update;
            });

            this._svg.selectAll('.curve').transition(_trans).style('stroke', this._c);

            this._svg.selectAll(".node").transition().duration(this._options.animation.duration.remove).attr('fill', this._c);
        }
    }, {
        key: 'createOptions',
        value: function createOptions(_userOpt) {
            return createCartesianStackedOpt(DefaultOptions$3, _userOpt);
        }
    }]);
    return MultiLine;
}(AbstractStackedCartesianChartWithAxes);

var GroupedOptions = {
    animation: {
        duration: {
            layout: 500
        }
    },
    chart: {
        type: 'bar_grouped'
    },
    plots: {
        stackLayout: false,
        stackMethod: Stacks.Zero
    }
};

var StackedOptions$1 = {
    animation: {
        duration: {
            layout: 500
        }
    },
    chart: {
        type: 'bar_grouped'
    },
    plots: {
        stackLayout: true,
        stackMethod: Stacks.Zero
    }
};

var ExpandedOptions$1 = {
    animation: {
        duration: {
            layout: 500
        }
    },
    chart: {
        type: 'bar_grouped'
    },
    plots: {
        stackLayout: true,
        stackMethod: Stacks.Expand
    }
};

var StackedBar = function (_AbstractStackedCarte) {
    inherits$1(StackedBar, _AbstractStackedCarte);

    function StackedBar(canvasId, _userOptions) {
        classCallCheck$2(this, StackedBar);

        var _this = possibleConstructorReturn$1(this, (StackedBar.__proto__ || Object.getPrototypeOf(StackedBar)).call(this, canvasId, _userOptions));

        _this._band = function () {
            return _this._getDimension().scale.bandwidth();
        };

        _this._x = function (d) {
            var xPos = _this._getDimension().scale(_this._getDimensionVal(d));

            return _this._options.plots.stackLayout === true ? xPos : xPos + _this._band() / _this._data.nested.length * _this._options.data.s.values.indexOf(_this._getSeriesVal(d));
        };

        _this._y = function (d) {
            return _this._options.plots.stackLayout === true ? _this._getMetric().scale(d.y) : _this._getMetric().scale(_this._getMetricVal(d));
        };

        _this._w = function (d, i) {
            return _this._options.plots.stackLayout === true ? _this._band() : _this._band() / _this._data.nested.length;
        };

        _this._h = function (d) {
            return _this._options.plots.stackLayout === true ? _this._getMetric().scale(d.y0) - _this._getMetric().scale(d.y) : _this._options.chart.innerHeight - _this._getMetric().scale(_this._getMetricVal(d));
        };
        return _this;
    }

    createClass$2(StackedBar, [{
        key: 'render',
        value: function render(_data) {
            get$3(StackedBar.prototype.__proto__ || Object.getPrototypeOf(StackedBar.prototype), 'render', this).call(this, _data);
            this.update();
        }
    }, {
        key: 'update',
        value: function update() {
            var _this2 = this;

            get$3(StackedBar.prototype.__proto__ || Object.getPrototypeOf(StackedBar.prototype), 'update', this).call(this);

            var seriesUpdate = this._svg.selectAll(".series").data(this._data.nested);

            // EXIT
            var exitSeries = seriesUpdate.exit();

            exitSeries.selectAll('.bar').transition("ease-bar").duration(this._options.animation.duration.remove).attr("y", this._options.chart.innerHeight).attr("height", 0);

            setTimeout(function () {
                exitSeries.remove();
            }, this._options.animation.duration.remove);

            // UPDATE

            var bars_update = seriesUpdate.selectAll('.bar').data(function (d) {
                return d.values;
            });

            if (this._options.plots.stackLayout === true) {
                bars_update.transition().duration(this._options.animation.duration.layout).delay(function (d, i) {
                    return i * 10;
                }).attr("x", this._x).attr("width", this._w).transition().attr("y", this._y).attr("height", this._h);
            } else {
                bars_update.transition().duration(this._options.animation.duration.layout).delay(function (d, i) {
                    return i * 10;
                }).attr("y", this._y).attr("height", this._h).transition().attr("x", this._x).attr("width", this._w);
            }

            bars_update.exit().transition("remove-rect-transition").duration(this._options.animation.duration.add).delay(function (d, i) {
                return i * 100;
            }).attr("height", 0).attr("y", this._options.chart.innerHeight).remove();

            bars_update.enter().append("rect").attr('class', 'bar').attr('opacity', 1).attr("x", this._x).attr("width", this._w).attr("y", this._options.chart.innerHeight).attr("height", 0).transition("add-rect-transition").duration(this._options.animation.duration.add).delay(function (d, i) {
                return i / _this2._getDimension().values.length * _this2._options.animation.duration.add;
            }).attr("y", this._y).attr("height", this._h);

            // append
            var appendedSeries = seriesUpdate.enter().append("g").attr("class", "series").style("fill", this._c);

            appendedSeries.selectAll(".bar").data(function (d) {
                return d.values;
            }).enter().append("rect").attr('class', 'bar').attr('opacity', 1).attr("x", this._x).attr('width', this._w).attr("y", this._options.chart.innerHeight).attr("height", 0).transition("add-rect-transition").duration(this._options.animation.duration.add).delay(function (d, i) {
                return i / _this2._getDimension().values.length * _this2._options.animation.duration.add;
            }).attr("y", this._y).attr("height", this._h);
        }
    }, {
        key: 'transitionColor',
        value: function transitionColor(colorOptions) {
            var _this3 = this;

            get$3(StackedBar.prototype.__proto__ || Object.getPrototypeOf(StackedBar.prototype), 'transitionColor', this).call(this, colorOptions);

            this._svg.selectAll(".series").transition().duration(this._options.animation.duration.update).delay(function (d, i) {
                return i / _this3._options.animation.duration.update * _this3._data.nested.length;
            }).style("fill", this._c);
        }
    }, {
        key: '_updateLayout',
        value: function _updateLayout(_opt) {
            this._options.chart.type = _opt.chart.type;
            this._options.plots.stackLayout = _opt.plots.stackLayout;
            this._options.plots.stackMethod = _opt.plots.stackMethod;
        }
    }, {
        key: 'stackLayout',
        value: function stackLayout() {
            this._updateLayout(StackedOptions$1);
            this.update();
        }
    }, {
        key: 'expandLayout',
        value: function expandLayout() {
            this._updateLayout(ExpandedOptions$1);
            this.update();
        }
    }, {
        key: 'groupedLayout',
        value: function groupedLayout() {
            this._updateLayout(GroupedOptions);
            this.update();
        }
    }, {
        key: 'createOptions',
        value: function createOptions(_userOpt) {
            return createCartesianStackedOpt(GroupedOptions, _userOpt);
        }
    }]);
    return StackedBar;
}(AbstractStackedCartesianChartWithAxes);

var CoronaOptions = {
    chart: {
        type: 'corona'
    },
    color: DefaultCategoricalColor,
    plots: {
        levels: 0, //How many levels or inner circles should there be drawn
        maxValue: 0, //What is the value that the biggest circle will represent
        labelFactor: 1.15, //How much farther than the radius of the outer circle should the labels be placed
        wrapWidth: 60, //The number of pixels after which a label needs to be given a new line
        opacityArea: 0.35, //The opacity of the area of the blob
        dotRadius: 4, //The size of the colored circles of each blog
        opacityCircles: 0.1, //The opacity of the circles of each blob
        strokeWidth: 2, //The width of the stroke around each blob
        innerRadiusRatio: 0.4,
        showDots: true,
        sortArea: true, // show smallest area on top
        stackLayout: true, // stack areas
        stackMethod: Stacks.Zero,
        isArea: true //If true the area and stroke will follow a round path (cardinal-closed),
    }
};

var labelPrecision = function labelPrecision(_max, _min, _levels) {
    if (_levels <= 1) {
        return 0;
    }

    var ticks$$1 = _levels - 1;
    var precision = 0;
    var max$$1 = Math.max(Math.abs(_max), Math.abs(_min));

    if (max$$1 >= 1) {
        if (max$$1 != Math.round(max$$1 / ticks$$1) * ticks$$1) {
            precision = ticks$$1.toString().length;
        }
    } else {
        var maxLength = 0;
        while (max$$1 < Math.pow(10, maxLength - 1)) {
            maxLength = maxLength - 1;
        }
        precision = -1 * maxLength + ticks$$1.toString().length + 1;
    }
    return precision;
};

var Corona = function (_AbstractStackedCarte) {
    inherits$1(Corona, _AbstractStackedCarte);

    function Corona(canvasId, _userOptions) {
        classCallCheck$2(this, Corona);

        var _this = possibleConstructorReturn$1(this, (Corona.__proto__ || Object.getPrototypeOf(Corona)).call(this, canvasId, _userOptions));

        _this._c = function (d) {
            return _this._color(_this._getSeriesVal(d));
        };

        return _this;
    }

    createClass$2(Corona, [{
        key: 'createOptions',
        value: function createOptions(_userOpt) {
            return createCartesianStackedOpt(CoronaOptions, _userOpt);
        }
    }, {
        key: 'render',
        value: function render(_data) {
            get$3(Corona.prototype.__proto__ || Object.getPrototypeOf(Corona.prototype), 'render', this).call(this, _data);

            this._svg.attr("transform", "translate(" + (this._options.chart.innerWidth / 2 + this._options.chart.margin.left) + "," + (this._options.chart.innerHeight / 2 + this._options.chart.margin.top) + ")");

            this.axisGrid = this._svg.append("g").attr("class", "axis-wrapper");

            //Filter for the outside glow
            this.filter = this._svg.append('defs').append('filter').attr('id', 'glow');
            this.feGaussianBlur = this.filter.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'coloredBlur');
            this.feMerge = this.filter.append('feMerge');
            this.feMergeNode_1 = this.feMerge.append('feMergeNode').attr('in', 'coloredBlur');
            this.feMergeNode_2 = this.feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

            //Set up the small tooltip for when you hover over a circle
            this._tooltip = this._svg.append("text").attr("class", "tooltip").style("opacity", 0);

            this.update();
        }
    }, {
        key: 'update',
        value: function update() {
            var _this2 = this;

            get$3(Corona.prototype.__proto__ || Object.getPrototypeOf(Corona.prototype), 'update', this).call(this);

            var that = this;
            var outerRadius = Math.min(this._options.chart.innerWidth / 2, this._options.chart.innerHeight / 2) - 20;
            var innerRadius = outerRadius * this._options.plots.innerRadiusRatio;
            var radiusScale = linear$2().range([innerRadius, outerRadius]);
            var angleScale = linear$2().range([0, 2 * Math.PI]);

            var angleSlice = function angleSlice() {
                return Math.PI * 2 / _this2._getDimension().values.length;
            };
            var circleCx = function circleCx(d, i) {
                return _this2._options.plots.stackLayout === true ? radiusScale(d.y) * Math.cos(angleSlice() * i - Math.PI / 2) : radiusScale(_this2._getMetricVal(d)) * Math.cos(angleSlice() * i - Math.PI / 2);
            };

            var circleCy = function circleCy(d, i) {
                return _this2._options.plots.stackLayout === true ? radiusScale(d.y) * Math.sin(angleSlice() * i - Math.PI / 2) : radiusScale(_this2._getMetricVal(d)) * Math.sin(angleSlice() * i - Math.PI / 2);
            };

            var baseRadar = void 0;
            var radarLine = void 0;
            var easeRadar = void 0;

            //The radial line function
            if (this._options.plots.isArea === true) {
                baseRadar = radialArea().curve(curveCardinalClosed).angle(function (d, i) {
                    return i * angleSlice();
                }).innerRadius(innerRadius).outerRadius(innerRadius);

                easeRadar = radialArea().curve(curveCardinalClosed).angle(function (d, i) {
                    return i * angleSlice();
                }).innerRadius(innerRadius).outerRadius(outerRadius);
            } else {
                baseRadar = radialLine().curve(curveLinearClosed).radius(innerRadius).angle(function (d, i) {
                    return i * angleSlice();
                });

                easeRadar = radialLine().curve(curveLinearClosed).radius(outerRadius).angle(function (d, i) {
                    return i * angleSlice();
                });
            }

            if (this._options.plots.stackLayout === true) {
                if (this._options.plots.isArea) {
                    radarLine = radialArea().curve(curveCardinalClosed).angle(function (d, i) {
                        return i * angleSlice();
                    }).innerRadius(function (d) {
                        return radiusScale(d.y0);
                    }).outerRadius(function (d) {
                        return radiusScale(d.y);
                    });
                } else {
                    radarLine = radialLine().curve(curveLinearClosed).radius(function (d) {
                        return radiusScale(d.y);
                    }).angle(function (d, i) {
                        return i * angleSlice();
                    });
                }
            } else {
                if (this._options.plots.isArea === true) {
                    radarLine = radialArea().curve(curveCardinalClosed).angle(function (d, i) {
                        return i * angleSlice();
                    }).innerRadius(innerRadius).outerRadius(function (d) {
                        return radiusScale(_this2._getMetricVal(d));
                    });
                } else {
                    radarLine = radialLine().curve(curveLinearClosed).radius(function (d) {
                        return radiusScale(_this2._getMetricVal(d));
                    }).angle(function (d, i) {
                        return i * angleSlice();
                    });
                }
            }

            updateMetricScale(this._data.original, this._options);

            var minY = this._getMetric().ticksMin;
            var maxY = this._getMetric().ticksMax;
            var levels = this._getMetric().ticksTier + 1;

            if (this._options.plots.stackLayout === true) {
                if (this._options.plots.stackMethod === Stacks.Expand) {
                    minY = 0;
                    maxY = 1;
                    levels = 5;
                } else {
                    var _range = getStackedMetricScale(this._data.nested, this._options);

                    minY = _range[0];
                    maxY = _range[1];
                    levels = _range[2] + 1;
                }
            }

            if (isNumber$1(this._options.plots.minValue) && isFinite(this._options.plots.minValue)) {
                minY = Math.min(this._options.plots.minValue, minY);
            }
            if (isNumber$1(this._options.plots.maxValue) && isFinite(this._options.plots.maxValue)) {
                maxY = Math.max(this._options.plots.maxValue, maxY);
            }

            if (isNumber$1(this._options.plots.levels) && isFinite(this._options.plots.levels) && parseInt(this._options.plots.levels) > 0) {
                levels = parseInt(this._options.plots.levels);
            }

            var precision = labelPrecision(maxY, minY, levels);
            var multiplier = precision == 0 ? 0 : Math.pow(10, precision);

            var gridArc = arc().innerRadius(function (d) {
                return (outerRadius - innerRadius) / levels * (d - 1) + innerRadius;
            }).outerRadius(function (d) {
                return (outerRadius - innerRadius) / levels * d + innerRadius;
            }).startAngle(0).endAngle(2 * Math.PI);

            angleScale.domain([minY, maxY]);
            radiusScale.domain([minY, maxY]);

            var levelRange = range$1(1, levels + 1);

            //Draw the background circles
            var gridCircles = this.axisGrid.selectAll(".grid-circle").data(levelRange);

            gridCircles.enter().append("path").attr("d", gridArc).attr('class', 'grid-circle').attr("fill", "#CDCDCD").style("stroke", "#CDCDCD").style("fill-opacity", this._options.plots.opacityCircles).style("filter", "url(#glow)");

            gridCircles.transition('grid-update-transition').duration(this._options.animation.duration.quickUpdate).style("fill-opacity", this._options.plots.opacityCircles).attr("d", gridArc);

            gridCircles.exit().remove();

            var axisRange = range$1(0, levels + 1);
            var labelScale = linear$2().domain(extent(axisRange)).range([minY, maxY]).nice();
            var gridLabels = this.axisGrid.selectAll(".axis-label").data(axisRange);

            gridLabels.enter().append("text").attr("class", "axis-label").attr("x", 4).attr("y", function (d) {
                return -d * ((outerRadius - innerRadius) / levels) - innerRadius;
            }).attr("dy", "0.4em").style("font-size", "10px").attr("fill", '#737373').text(function (d) {
                return levels <= 1 ? labelScale(d) : precision == 0 ? Math.round(labelScale(d)) : (Math.round(labelScale(d) * multiplier) / multiplier).toFixed(precision);
            });

            gridLabels.transition('grid-update-transition').duration(500).attr("y", function (d) {
                return -d * ((outerRadius - innerRadius) / levels) - innerRadius;
            }).text(function (d) {
                return levels <= 1 ? labelScale(d) : precision == 0 ? Math.round(labelScale(d)) : (Math.round(labelScale(d) * multiplier) / multiplier).toFixed(precision);
            });
            gridLabels.exit().remove();

            /////////////////////////////////////////////////////////
            //////////////////// Draw the axes //////////////////////
            /////////////////////////////////////////////////////////

            //Create the straight lines radiating outward from the center
            var axis = this.axisGrid.selectAll(".axis").data(this._getDimension().values);

            axis.exit().remove();

            var axisAdded = axis.enter().append("g").attr("class", "axis");

            axisAdded.append("line").attr("x1", 0).attr("y1", 0).attr("x2", function (d, i) {
                return radiusScale(maxY * 1.1) * Math.cos(angleSlice() * i - Math.PI / 2);
            }).attr("y2", function (d, i) {
                return radiusScale(maxY * 1.1) * Math.sin(angleSlice() * i - Math.PI / 2);
            }).attr("class", "axis-line").style("stroke", "white").style("stroke-width", "2px");

            axisAdded.append("text").attr("class", "axis-legend").style("font-size", "11px").attr("text-anchor", "middle").attr("dy", "0.35em").attr("x", function (d, i) {
                return radiusScale(maxY * _this2._options.plots.labelFactor) * Math.cos(angleSlice() * i - Math.PI / 2);
            }).attr("y", function (d, i) {
                return radiusScale(maxY * _this2._options.plots.labelFactor) * Math.sin(angleSlice() * i - Math.PI / 2);
            }).text(function (d) {
                return d;
            });

            axis.select('.axis-line').transition('axis-update-transition').duration(1250).attr("x2", function (d, i) {
                return radiusScale(maxY * 1.1) * Math.cos(angleSlice() * i - Math.PI / 2);
            }).attr("y2", function (d, i) {
                return radiusScale(maxY * 1.1) * Math.sin(angleSlice() * i - Math.PI / 2);
            });

            axis.select('.axis-legend').transition('axis-update-transition').duration(this._options.animation.duration.update).attr("x", function (d, i) {
                return radiusScale(maxY * _this2._options.plots.labelFactor) * Math.cos(angleSlice() * i - Math.PI / 2);
            }).attr("y", function (d, i) {
                return radiusScale(maxY * _this2._options.plots.labelFactor) * Math.sin(angleSlice() * i - Math.PI / 2);
            }).text(function (d) {
                return d;
            });

            this._container.selectAll('.axis-legend').call(wrapSVGText, this._options.plots.wrapWidth);

            //Create a wrapper for the blobs
            var blobWrapper_updated = this._svg.selectAll(".radar-wrapper").data(this._data.nested);

            // removed
            var blobWrapper_Removed = blobWrapper_updated.exit();

            blobWrapper_Removed.select('.radar-area').transition('ease-radar-transition').duration(this._options.animation.duration.remove).attr("d", function (d) {
                return easeRadar(d.values);
            }).style("fill-opacity", 0);

            blobWrapper_Removed.select('.radar-stroke').transition('ease-radar-transition').duration(this._options.animation.duration.remove).attr("d", function (d) {
                return easeRadar(d.values);
            }).style("stroke-opacity", 0);

            setTimeout(function () {
                blobWrapper_Removed.remove();
            }, 1500);

            // added
            var blobWrapperAdded = blobWrapper_updated.enter().append("g").attr("class", "radar-wrapper");

            if (this._options.plots.isArea === true) {
                blobWrapperAdded.append("path").attr("class", "radar-area").attr("d", function (d) {
                    return baseRadar(d.values);
                }).style("fill", function (d) {
                    return _this2._color(d.key);
                }).style("fill-opacity", this._options.plots.opacityArea).transition('circle-expand-transition').duration(this._options.animation.duration.update).delay(function (d, i) {
                    return i * _this2._options.animation.duration.update / _this2._getDimension().values.length;
                }).attr("d", function (d) {
                    return radarLine(d.values);
                });
            }

            blobWrapperAdded.append("path").attr("class", "radar-stroke").attr("d", function (d, i) {
                return baseRadar(d.values);
            }).style("stroke-width", this._options.plots.strokeWidth + "px").style("stroke", function (d) {
                return _this2._color(d.key);
            }).style("fill", "none").transition('circle-expand-transition').duration(this._options.animation.duration.update).delay(function (d, i) {
                return i * _this2._options.animation.duration.update / _this2._getDimension().values.length;
            }).attr("d", function (d) {
                return radarLine(d.values);
            }).style("filter", "url(#glow)");

            blobWrapperAdded.selectAll(".radar-circle").data(function (d) {
                return d.values;
            }).enter().append("circle").attr("class", "radar-circle").attr("r", this._options.plots.dotRadius).attr("cx", circleCx).attr("cy", circleCy).style("fill", this._c).style("fill-opacity", this._options.plots.showDots === true ? 0.8 : 0);

            // updated
            blobWrapper_updated.select('.radar-area').transition('update-radar-transition').duration(this._options.animation.duration.update).delay(function (d, i) {
                return i * _this2._options.animation.duration.update / _this2._getDimension().values.length;
            }).style("fill-opacity", this._options.plots.opacityArea).attr("d", function (d) {
                return radarLine(d.values);
            });

            blobWrapper_updated.select('.radar-stroke').transition('update-radar-transition').duration(this._options.animation.duration.update).delay(function (d, i) {
                return i * _this2._options.animation.duration.update / _this2._getDimension().values.length;
            }).style("stroke-width", this._options.plots.strokeWidth + "px").attr("d", function (d) {
                return radarLine(d.values);
            });

            var radarCircles_updated = blobWrapper_updated.selectAll(".radar-circle").data(function (d) {
                return d.values;
            });

            radarCircles_updated.enter().append("circle").attr("class", "radar-circle").attr("r", this._options.plots.dotRadius).attr("cx", circleCx).attr("cy", circleCy).style("fill", this._c).style("fill-opacity", this._options.plots.showDots === true ? 0.8 : 0);

            radarCircles_updated.transition('update-radar-transition').duration(this._options.animation.duration.update).attr("r", this._options.plots.dotRadius).attr("cx", circleCx).attr("cy", circleCy).style("fill", this._c);

            radarCircles_updated.exit().transition().duration(this._options.animation.duration.quickUpdate).style("fill-opacity", 0).remove();

            if (this._options.plots.showDots === true) {
                this._container.selectAll(".radar-circle").transition().duration(this._options.animation.duration.quickUpdate).style("fill-opacity", 0.8);
            }

            /////////////////////////////////////////////////////////
            //////// Append invisible circles for tooltip ///////////
            /////////////////////////////////////////////////////////

            //Wrapper for the invisible circles on top
            var blobCircleWrapper = this._svg.selectAll(".radar-circle-wrapper").data(this._data.nested);

            // exit
            blobCircleWrapper.exit().remove();

            // added
            var blobCircleWrapper_Added = blobCircleWrapper.enter().append("g").attr("class", "radar-circle-wrapper");

            //Append a set of invisible circles on top for the mouseover pop-up
            blobCircleWrapper_Added.selectAll(".radar-invisible-circle").data(function (d) {
                return d.values;
            }).enter().append("circle").attr("class", "radar-invisible-circle").attr("r", this._options.plots.dotRadius * 4).attr("cx", circleCx).attr("cy", circleCy).style("fill", "none").style('stroke', this._c).style('stroke-opacity', 0).style('stroke-dasharray', '2, 2').style("pointer-events", "all");

            // updated
            blobCircleWrapper.transition('update-radar-transition').duration(this._options.animation.duration.update).attr("r", this._options.plots.dotRadius * 4).attr("cx", circleCx).attr("cy", circleCy).style('stroke', this._c);

            //-----------------------  tooltip ------------------------
            function circleMouseOver(d, i) {
                var newX = parseFloat(select(this).attr('cx')) - 10;
                var newY = parseFloat(select(this).attr('cy')) - 10;

                that._tooltip.attr('x', newX).attr('y', newY).text(that._getMetricVal(d)).transition().duration(200).style('opacity', 1);

                that._svg.append("circle").attr('id', 'outline-hover').attr("r", that._options.plots.stackLayout ? radiusScale(d.y) : radiusScale(that._getMetricVal(d))).style("fill", "#CDCDCD").style("stroke", "black").style("stroke-width", "2px").style('stroke-dasharray', '5, 5').style("fill-opacity", 0);

                that._container.selectAll('.grid-circle').transition().duration(300).style('fill-opacity', 0).style('stroke-opacity', 0);

                that._container.selectAll(".radar-area").transition().duration(200).style("fill-opacity", 0.1);

                that._container.selectAll(".radar-stroke").transition().duration(200).style('stroke-opacity', 0);

                that._container.selectAll(".radar-circle").transition().duration(200).style('fill-opacity', 0);

                if (!that._options.plots.showDots === true) {
                    select(this).transition().duration(200).style('stroke-opacity', 1);
                }
            }

            function circleMouseOut(d, i) {
                that._tooltip.transition().duration(200).style("opacity", 0);

                that._svg.select('#outline-hover').remove();

                that._container.selectAll('.grid-circle').transition().duration(300).style('fill-opacity', that._options.plots.opacityCircles).style('stroke-opacity', 1);

                that._container.selectAll(".radar-area").transition().duration(200).style("fill-opacity", that._options.plots.opacityArea);

                that._container.selectAll(".radar-stroke").transition().duration(200).style('stroke-opacity', 1);

                if (that._options.plots.showDots === true) {
                    that._container.selectAll(".radar-circle").transition().duration(200).style('fill-opacity', 0.8);
                } else {
                    select(this).transition().duration(200).style('stroke-opacity', 0);
                }
            }

            function blobMouseOver(d, i) {
                //Dim all blobs
                that._container.selectAll(".radar-area").transition().duration(200).style("fill-opacity", 0.1);
                //Bring back the hovered over blob
                select(this).transition().duration(200).style("fill-opacity", 0.7);
            }

            function blobMouseOut(d, i) {
                that._container.selectAll(".radar-area").transition().duration(200).style("fill-opacity", that._options.plots.opacityArea);
            }

            function enableInteractions() {
                setTimeout(function () {
                    that._container.selectAll('.radar-area').on('mouseover', blobMouseOver).on('mouseout', blobMouseOut);

                    that._container.selectAll('.radar-invisible-circle').on("mouseover", circleMouseOver).on("mouseout", circleMouseOut);
                }, 2000);
            }

            enableInteractions();
        }
    }, {
        key: 'transitionColor',
        value: function transitionColor(colorOptions) {
            var _this3 = this;

            get$3(Corona.prototype.__proto__ || Object.getPrototypeOf(Corona.prototype), 'transitionColor', this).call(this, colorOptions);

            this._container.selectAll('.radar-area').transition().duration(this._options.animation.duration.update).delay(function (d, i) {
                return i * 150;
            }).style("fill", function (d, i) {
                return _this3._color(d.key);
            });

            this._container.selectAll('.radar-stroke').transition().duration(this._options.animation.duration.update).delay(function (d, i) {
                return i * 150;
            }).style("stroke", function (d) {
                return _this3._color(d.key);
            });

            this._container.selectAll('.radar-circle').transition().duration(this._options.animation.duration.update).delay(function (d, i) {
                return i * 10;
            }).style("fill", this._c);
        }
    }, {
        key: 'stackLayout',
        value: function stackLayout() {
            this._options.plots.stackLayout = true;
            this._options.plots.stackMethod = Stacks.Zero;

            this.update();
        }
    }, {
        key: 'expandLayout',
        value: function expandLayout() {
            this._options.plots.stackLayout = true;
            this._options.plots.stackMethod = Stacks.Expand;

            this.update();
        }
    }, {
        key: 'groupedLayout',
        value: function groupedLayout() {
            this._options.plots.stackLayout = false;

            this.update();
        }
    }]);
    return Corona;
}(AbstractStackedCartesianChart);

var SPIRAL = {
    ARCHIMEDIAN: 'archimedean',
    REECANGULAR: 'rectangular'
};

var DefaultOptions$4 = {
    chart: {
        type: 'word_cloud',
        margin: {
            top: 0,
            left: 0,
            bottom: 0,
            right: 0
        }
    },

    plots: {
        padding: 5,
        rotates: 0,
        fontSizeMax: 100,
        fontSizeMin: 10,
        spiral: SPIRAL.REECANGULAR
    }
};

var TimeInterval = 10;

var WordCloud = function (_AbstractBasicCartesi) {
    inherits$1(WordCloud, _AbstractBasicCartesi);

    function WordCloud(canvasId, _userOptions) {
        classCallCheck$2(this, WordCloud);
        return possibleConstructorReturn$1(this, (WordCloud.__proto__ || Object.getPrototypeOf(WordCloud)).call(this, canvasId, _userOptions));
    }

    createClass$2(WordCloud, [{
        key: 'render',
        value: function render(_data) {
            var _this2 = this;

            get$3(WordCloud.prototype.__proto__ || Object.getPrototypeOf(WordCloud.prototype), 'render', this).call(this, _data);

            this._svg.attr("transform", "translate(" + this._options.chart.width / 2 + "," + this._options.chart.height / 2 + ")");
            this._background = this._container.append('g');
            this._layout = index$1().timeInterval(TimeInterval);
            this._sizeScale = linear$2();
            this._f = function (d) {
                return _this2._sizeScale(_this2._getMetricVal(d));
            };

            this.update();
        }
    }, {
        key: 'update',
        value: function update() {
            var _this3 = this;

            get$3(WordCloud.prototype.__proto__ || Object.getPrototypeOf(WordCloud.prototype), 'update', this).call(this);

            this._sizeScale.domain(extent(this._data, function (d) {
                return _this3._getMetricVal(d);
            })).range([this._options.plots.fontSizeMin, this._options.plots.fontSizeMax]);

            this._layout.stop().words(this._data).padding(this._options.plots.padding).spiral(this._options.plots.spiral).size([this._options.chart.innerWidth, this._options.chart.innerHeight]).text(this.s_getDimensionVal).rotate(this._options.plots.rotates).fontSize(this._f).on("end", function () {
                var dataUpdate = _this3._svg.selectAll(".word").data(_this3._data);

                var dataJoin = dataUpdate.enter();

                dataUpdate.transition().duration(_this3._options.animation.duration.quickUpdate).style("font-size", function (d) {
                    return _this3._f(d) + 'px';
                }).style("fill", _this3._c).attr("text-anchor", "middle").attr("transform", function (d) {
                    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                }).text(_this3._getDimensionVal);

                dataJoin.append("text").attr('class', 'word').attr("text-anchor", "middle").attr("transform", function (d) {
                    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                }).style("font-size", function (d) {
                    return _this3._f(d) + 'px';
                }).style("fill", _this3._c).text(_this3._getDimensionVal);

                var shadowBG = _this3._background.append("g").attr("transform", _this3._svg.attr("transform"));
                var shadowNode = shadowBG.node();
                dataUpdate.exit().each(function () {
                    shadowNode.appendChild(this);
                });

                shadowBG.transition().duration(_this3._options.animation.duration.update).style("opacity", 1e-6).remove();
            });

            this._layout.start();
        }
    }, {
        key: 'transitionColor',
        value: function transitionColor(colorOptions) {
            get$3(WordCloud.prototype.__proto__ || Object.getPrototypeOf(WordCloud.prototype), 'transitionColor', this).call(this, colorOptions);

            this._svg.selectAll('.word').transition().delay(1e3).duration(this._options.animation.duration.color).style('fill', this._c);
        }
    }, {
        key: 'createOptions',
        value: function createOptions(_userOptions) {
            return createCartesianOpt(DefaultOptions$4, _userOptions);
        }
    }]);
    return WordCloud;
}(AbstractBasicCartesianChart);

// Adds floating point numbers with twice the normal precision.
// Reference: J. R. Shewchuk, Adaptive Precision Floating-Point Arithmetic and
// Fast Robust Geometric Predicates, Discrete & Computational Geometry 18(3)
// 305–363 (1997).
// Code adapted from GeographicLib by Charles F. F. Karney,
// http://geographiclib.sourceforge.net/

var adder = function () {
  return new Adder();
};

function Adder() {
  this.reset();
}

Adder.prototype = {
  constructor: Adder,
  reset: function reset() {
    this.s = // rounded value
    this.t = 0; // exact error
  },
  add: function add(y) {
    _add(temp, y, this.t);
    _add(this, temp.s, this.s);
    if (this.s) this.t += temp.t;else this.s = temp.t;
  },
  valueOf: function valueOf() {
    return this.s;
  }
};

var temp = new Adder();

function _add(adder, a, b) {
  var x = adder.s = a + b,
      bv = x - a,
      av = x - bv;
  adder.t = a - av + (b - bv);
}

var epsilon$3 = 1e-6;

var pi$3 = Math.PI;
var halfPi$2 = pi$3 / 2;
var quarterPi = pi$3 / 4;
var tau$3 = pi$3 * 2;


var radians = pi$3 / 180;

var abs$1 = Math.abs;

var atan2$1 = Math.atan2;
var cos$1 = Math.cos;





var sin$1 = Math.sin;

var sqrt$2 = Math.sqrt;


function acos$1(x) {
  return x > 1 ? 0 : x < -1 ? pi$3 : Math.acos(x);
}

function asin$1(x) {
  return x > 1 ? halfPi$2 : x < -1 ? -halfPi$2 : Math.asin(x);
}

function noop$3() {}

function streamGeometry(geometry, stream) {
  if (geometry && streamGeometryType.hasOwnProperty(geometry.type)) {
    streamGeometryType[geometry.type](geometry, stream);
  }
}

var streamObjectType = {
  Feature: function Feature(object, stream) {
    streamGeometry(object.geometry, stream);
  },
  FeatureCollection: function FeatureCollection(object, stream) {
    var features = object.features,
        i = -1,
        n = features.length;
    while (++i < n) {
      streamGeometry(features[i].geometry, stream);
    }
  }
};

var streamGeometryType = {
  Sphere: function Sphere(object, stream) {
    stream.sphere();
  },
  Point: function Point(object, stream) {
    object = object.coordinates;
    stream.point(object[0], object[1], object[2]);
  },
  MultiPoint: function MultiPoint(object, stream) {
    var coordinates = object.coordinates,
        i = -1,
        n = coordinates.length;
    while (++i < n) {
      object = coordinates[i], stream.point(object[0], object[1], object[2]);
    }
  },
  LineString: function LineString(object, stream) {
    streamLine(object.coordinates, stream, 0);
  },
  MultiLineString: function MultiLineString(object, stream) {
    var coordinates = object.coordinates,
        i = -1,
        n = coordinates.length;
    while (++i < n) {
      streamLine(coordinates[i], stream, 0);
    }
  },
  Polygon: function Polygon(object, stream) {
    streamPolygon(object.coordinates, stream);
  },
  MultiPolygon: function MultiPolygon(object, stream) {
    var coordinates = object.coordinates,
        i = -1,
        n = coordinates.length;
    while (++i < n) {
      streamPolygon(coordinates[i], stream);
    }
  },
  GeometryCollection: function GeometryCollection(object, stream) {
    var geometries = object.geometries,
        i = -1,
        n = geometries.length;
    while (++i < n) {
      streamGeometry(geometries[i], stream);
    }
  }
};

function streamLine(coordinates, stream, closed) {
  var i = -1,
      n = coordinates.length - closed,
      coordinate;
  stream.lineStart();
  while (++i < n) {
    coordinate = coordinates[i], stream.point(coordinate[0], coordinate[1], coordinate[2]);
  }stream.lineEnd();
}

function streamPolygon(coordinates, stream) {
  var i = -1,
      n = coordinates.length;
  stream.polygonStart();
  while (++i < n) {
    streamLine(coordinates[i], stream, 1);
  }stream.polygonEnd();
}

var geoStream = function (object, stream) {
  if (object && streamObjectType.hasOwnProperty(object.type)) {
    streamObjectType[object.type](object, stream);
  } else {
    streamGeometry(object, stream);
  }
};

var areaRingSum = adder();

var areaSum = adder();
var lambda00;
var phi00;
var lambda0;
var cosPhi0;
var sinPhi0;

function cartesian(spherical) {
  var lambda = spherical[0],
      phi = spherical[1],
      cosPhi = cos$1(phi);
  return [cosPhi * cos$1(lambda), cosPhi * sin$1(lambda), sin$1(phi)];
}



function cartesianCross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

// TODO return a




// TODO return d
function cartesianNormalizeInPlace(d) {
  var l = sqrt$2(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
  d[0] /= l, d[1] /= l, d[2] /= l;
}

var lambda0$1;
var phi0;
var lambda1;
var phi1;
var lambda2;
var lambda00$1;
var phi00$1;
var p0;
var deltaSum = adder();
var ranges;
var range$2;

var W0;
var X0;
var Y0;
var Z0; // previous point

// Generates a circle centered at [0°, 0°], with a given radius and precision.

var pointEqual = function (a, b) {
  return abs$1(a[0] - b[0]) < epsilon$3 && abs$1(a[1] - b[1]) < epsilon$3;
};

function Intersection(point, points, other, entry) {
  this.x = point;
  this.z = points;
  this.o = other; // another intersection
  this.e = entry; // is an entry?
  this.v = false; // visited
  this.n = this.p = null; // next & previous
}

function link$1(array) {
  if (!(n = array.length)) return;
  var n,
      i = 0,
      a = array[0],
      b;
  while (++i < n) {
    a.n = b = array[i];
    b.p = a;
    a = b;
  }
  a.n = b = array[0];
  b.p = a;
}

// TODO Use d3-polygon’s polygonContains here for the ring check?
// TODO Eliminate duplicate buffering in clipBuffer and polygon.push?

var sum$2 = adder();

var polygonContains = function (polygon, point) {
  var lambda = point[0],
      phi = point[1],
      normal = [sin$1(lambda), -cos$1(lambda), 0],
      angle = 0,
      winding = 0;

  sum$2.reset();

  for (var i = 0, n = polygon.length; i < n; ++i) {
    if (!(m = (ring = polygon[i]).length)) continue;
    var ring,
        m,
        point0 = ring[m - 1],
        lambda0 = point0[0],
        phi0 = point0[1] / 2 + quarterPi,
        sinPhi0 = sin$1(phi0),
        cosPhi0 = cos$1(phi0);

    for (var j = 0; j < m; ++j, lambda0 = lambda1, sinPhi0 = sinPhi1, cosPhi0 = cosPhi1, point0 = point1) {
      var point1 = ring[j],
          lambda1 = point1[0],
          phi1 = point1[1] / 2 + quarterPi,
          sinPhi1 = sin$1(phi1),
          cosPhi1 = cos$1(phi1),
          delta = lambda1 - lambda0,
          sign = delta >= 0 ? 1 : -1,
          absDelta = sign * delta,
          antimeridian = absDelta > pi$3,
          k = sinPhi0 * sinPhi1;

      sum$2.add(atan2$1(k * sign * sin$1(absDelta), cosPhi0 * cosPhi1 + k * cos$1(absDelta)));
      angle += antimeridian ? delta + sign * tau$3 : delta;

      // Are the longitudes either side of the point’s meridian (lambda),
      // and are the latitudes smaller than the parallel (phi)?
      if (antimeridian ^ lambda0 >= lambda ^ lambda1 >= lambda) {
        var arc = cartesianCross(cartesian(point0), cartesian(point1));
        cartesianNormalizeInPlace(arc);
        var intersection = cartesianCross(normal, arc);
        cartesianNormalizeInPlace(intersection);
        var phiArc = (antimeridian ^ delta >= 0 ? -1 : 1) * asin$1(intersection[2]);
        if (phi > phiArc || phi === phiArc && (arc[0] || arc[1])) {
          winding += antimeridian ^ delta >= 0 ? 1 : -1;
        }
      }
    }
  }

  // First, determine whether the South pole is inside or outside:
  //
  // It is inside if:
  // * the polygon winds around it in a clockwise direction.
  // * the polygon does not (cumulatively) wind around it, but has a negative
  //   (counter-clockwise) area.
  //
  // Second, count the (signed) number of times a segment crosses a lambda
  // from the point to the South pole.  If it is zero, then the point is the
  // same side as the South pole.

  return (angle < -epsilon$3 || angle < epsilon$3 && sum$2 < -epsilon$3) ^ winding & 1;
};

var lengthSum = adder();
var lambda0$2;
var sinPhi0$1;
var cosPhi0$1;

var lengthStream = {
  sphere: noop$3,
  point: noop$3,
  lineStart: lengthLineStart,
  lineEnd: noop$3,
  polygonStart: noop$3,
  polygonEnd: noop$3
};

function lengthLineStart() {
  lengthStream.point = lengthPointFirst;
  lengthStream.lineEnd = lengthLineEnd;
}

function lengthLineEnd() {
  lengthStream.point = lengthStream.lineEnd = noop$3;
}

function lengthPointFirst(lambda, phi) {
  lambda *= radians, phi *= radians;
  lambda0$2 = lambda, sinPhi0$1 = sin$1(phi), cosPhi0$1 = cos$1(phi);
  lengthStream.point = lengthPoint;
}

function lengthPoint(lambda, phi) {
  lambda *= radians, phi *= radians;
  var sinPhi = sin$1(phi),
      cosPhi = cos$1(phi),
      delta = abs$1(lambda - lambda0$2),
      cosDelta = cos$1(delta),
      sinDelta = sin$1(delta),
      x = cosPhi * sinDelta,
      y = cosPhi0$1 * sinPhi - sinPhi0$1 * cosPhi * cosDelta,
      z = sinPhi0$1 * sinPhi + cosPhi0$1 * cosPhi * cosDelta;
  lengthSum.add(atan2$1(sqrt$2(x * x + y * y), z));
  lambda0$2 = lambda, sinPhi0$1 = sinPhi, cosPhi0$1 = cosPhi;
}

var length$1 = function (object) {
  lengthSum.reset();
  geoStream(object, lengthStream);
  return +lengthSum;
};

var coordinates = [null, null];
var object$1 = { type: "LineString", coordinates: coordinates };

var distance = function (a, b) {
  coordinates[0] = a;
  coordinates[1] = b;
  return length$1(object$1);
};

var containsGeometryType = {
  Sphere: function Sphere() {
    return true;
  },
  Point: function Point(object, point) {
    return containsPoint(object.coordinates, point);
  },
  MultiPoint: function MultiPoint(object, point) {
    var coordinates = object.coordinates,
        i = -1,
        n = coordinates.length;
    while (++i < n) {
      if (containsPoint(coordinates[i], point)) return true;
    }return false;
  },
  LineString: function LineString(object, point) {
    return containsLine(object.coordinates, point);
  },
  MultiLineString: function MultiLineString(object, point) {
    var coordinates = object.coordinates,
        i = -1,
        n = coordinates.length;
    while (++i < n) {
      if (containsLine(coordinates[i], point)) return true;
    }return false;
  },
  Polygon: function Polygon(object, point) {
    return containsPolygon(object.coordinates, point);
  },
  MultiPolygon: function MultiPolygon(object, point) {
    var coordinates = object.coordinates,
        i = -1,
        n = coordinates.length;
    while (++i < n) {
      if (containsPolygon(coordinates[i], point)) return true;
    }return false;
  },
  GeometryCollection: function GeometryCollection(object, point) {
    var geometries = object.geometries,
        i = -1,
        n = geometries.length;
    while (++i < n) {
      if (containsGeometry(geometries[i], point)) return true;
    }return false;
  }
};

function containsGeometry(geometry, point) {
  return geometry && containsGeometryType.hasOwnProperty(geometry.type) ? containsGeometryType[geometry.type](geometry, point) : false;
}

function containsPoint(coordinates, point) {
  return distance(coordinates, point) === 0;
}

function containsLine(coordinates, point) {
  var ab = distance(coordinates[0], coordinates[1]),
      ao = distance(coordinates[0], point),
      ob = distance(point, coordinates[1]);
  return ao + ob <= ab + epsilon$3;
}

function containsPolygon(coordinates, point) {
  return !!polygonContains(coordinates.map(ringRadians), pointRadians(point));
}

function ringRadians(ring) {
  return ring = ring.map(pointRadians), ring.pop(), ring;
}

function pointRadians(point) {
  return [point[0] * radians, point[1] * radians];
}

var identity$8 = function (x) {
  return x;
};

var areaSum$1 = adder();
var areaRingSum$1 = adder();
var x00;
var y00;
var x0$1;
var y0$1;

var areaStream$1 = {
  point: noop$3,
  lineStart: noop$3,
  lineEnd: noop$3,
  polygonStart: function polygonStart() {
    areaStream$1.lineStart = areaRingStart$1;
    areaStream$1.lineEnd = areaRingEnd$1;
  },
  polygonEnd: function polygonEnd() {
    areaStream$1.lineStart = areaStream$1.lineEnd = areaStream$1.point = noop$3;
    areaSum$1.add(abs$1(areaRingSum$1));
    areaRingSum$1.reset();
  },
  result: function result() {
    var area = areaSum$1 / 2;
    areaSum$1.reset();
    return area;
  }
};

function areaRingStart$1() {
  areaStream$1.point = areaPointFirst$1;
}

function areaPointFirst$1(x, y) {
  areaStream$1.point = areaPoint$1;
  x00 = x0$1 = x, y00 = y0$1 = y;
}

function areaPoint$1(x, y) {
  areaRingSum$1.add(y0$1 * x - x0$1 * y);
  x0$1 = x, y0$1 = y;
}

function areaRingEnd$1() {
  areaPoint$1(x00, y00);
}

var x0$2 = Infinity;
var y0$2 = x0$2;
var x1 = -x0$2;
var y1 = x1;

var boundsStream$1 = {
  point: boundsPoint$1,
  lineStart: noop$3,
  lineEnd: noop$3,
  polygonStart: noop$3,
  polygonEnd: noop$3,
  result: function result() {
    var bounds = [[x0$2, y0$2], [x1, y1]];
    x1 = y1 = -(y0$2 = x0$2 = Infinity);
    return bounds;
  }
};

function boundsPoint$1(x, y) {
  if (x < x0$2) x0$2 = x;
  if (x > x1) x1 = x;
  if (y < y0$2) y0$2 = y;
  if (y > y1) y1 = y;
}

// TODO Enforce positive area for exterior, negative area for interior?

var X0$1 = 0;
var Y0$1 = 0;
var Z0$1 = 0;
var X1$1 = 0;
var Y1$1 = 0;
var Z1$1 = 0;
var X2$1 = 0;
var Y2$1 = 0;
var Z2$1 = 0;
var x00$1;
var y00$1;
var x0$3;
var y0$3;

var centroidStream$1 = {
  point: centroidPoint$1,
  lineStart: centroidLineStart$1,
  lineEnd: centroidLineEnd$1,
  polygonStart: function polygonStart() {
    centroidStream$1.lineStart = centroidRingStart$1;
    centroidStream$1.lineEnd = centroidRingEnd$1;
  },
  polygonEnd: function polygonEnd() {
    centroidStream$1.point = centroidPoint$1;
    centroidStream$1.lineStart = centroidLineStart$1;
    centroidStream$1.lineEnd = centroidLineEnd$1;
  },
  result: function result() {
    var centroid = Z2$1 ? [X2$1 / Z2$1, Y2$1 / Z2$1] : Z1$1 ? [X1$1 / Z1$1, Y1$1 / Z1$1] : Z0$1 ? [X0$1 / Z0$1, Y0$1 / Z0$1] : [NaN, NaN];
    X0$1 = Y0$1 = Z0$1 = X1$1 = Y1$1 = Z1$1 = X2$1 = Y2$1 = Z2$1 = 0;
    return centroid;
  }
};

function centroidPoint$1(x, y) {
  X0$1 += x;
  Y0$1 += y;
  ++Z0$1;
}

function centroidLineStart$1() {
  centroidStream$1.point = centroidPointFirstLine;
}

function centroidPointFirstLine(x, y) {
  centroidStream$1.point = centroidPointLine;
  centroidPoint$1(x0$3 = x, y0$3 = y);
}

function centroidPointLine(x, y) {
  var dx = x - x0$3,
      dy = y - y0$3,
      z = sqrt$2(dx * dx + dy * dy);
  X1$1 += z * (x0$3 + x) / 2;
  Y1$1 += z * (y0$3 + y) / 2;
  Z1$1 += z;
  centroidPoint$1(x0$3 = x, y0$3 = y);
}

function centroidLineEnd$1() {
  centroidStream$1.point = centroidPoint$1;
}

function centroidRingStart$1() {
  centroidStream$1.point = centroidPointFirstRing;
}

function centroidRingEnd$1() {
  centroidPointRing(x00$1, y00$1);
}

function centroidPointFirstRing(x, y) {
  centroidStream$1.point = centroidPointRing;
  centroidPoint$1(x00$1 = x0$3 = x, y00$1 = y0$3 = y);
}

function centroidPointRing(x, y) {
  var dx = x - x0$3,
      dy = y - y0$3,
      z = sqrt$2(dx * dx + dy * dy);

  X1$1 += z * (x0$3 + x) / 2;
  Y1$1 += z * (y0$3 + y) / 2;
  Z1$1 += z;

  z = y0$3 * x - x0$3 * y;
  X2$1 += z * (x0$3 + x);
  Y2$1 += z * (y0$3 + y);
  Z2$1 += z * 3;
  centroidPoint$1(x0$3 = x, y0$3 = y);
}

function PathContext(context) {
  this._context = context;
}

PathContext.prototype = {
  _radius: 4.5,
  pointRadius: function pointRadius(_) {
    return this._radius = _, this;
  },
  polygonStart: function polygonStart() {
    this._line = 0;
  },
  polygonEnd: function polygonEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    if (this._line === 0) this._context.closePath();
    this._point = NaN;
  },
  point: function point(x, y) {
    switch (this._point) {
      case 0:
        {
          this._context.moveTo(x, y);
          this._point = 1;
          break;
        }
      case 1:
        {
          this._context.lineTo(x, y);
          break;
        }
      default:
        {
          this._context.moveTo(x + this._radius, y);
          this._context.arc(x, y, this._radius, 0, tau$3);
          break;
        }
    }
  },
  result: noop$3
};

var lengthSum$1 = adder();
var lengthRing;
var x00$2;
var y00$2;
var x0$4;
var y0$4;

var lengthStream$1 = {
  point: noop$3,
  lineStart: function lineStart() {
    lengthStream$1.point = lengthPointFirst$1;
  },
  lineEnd: function lineEnd() {
    if (lengthRing) lengthPoint$1(x00$2, y00$2);
    lengthStream$1.point = noop$3;
  },
  polygonStart: function polygonStart() {
    lengthRing = true;
  },
  polygonEnd: function polygonEnd() {
    lengthRing = null;
  },
  result: function result() {
    var length = +lengthSum$1;
    lengthSum$1.reset();
    return length;
  }
};

function lengthPointFirst$1(x, y) {
  lengthStream$1.point = lengthPoint$1;
  x00$2 = x0$4 = x, y00$2 = y0$4 = y;
}

function lengthPoint$1(x, y) {
  x0$4 -= x, y0$4 -= y;
  lengthSum$1.add(sqrt$2(x0$4 * x0$4 + y0$4 * y0$4));
  x0$4 = x, y0$4 = y;
}

function PathString() {
  this._string = [];
}

PathString.prototype = {
  _radius: 4.5,
  _circle: circle$2(4.5),
  pointRadius: function pointRadius(_) {
    if ((_ = +_) !== this._radius) this._radius = _, this._circle = null;
    return this;
  },
  polygonStart: function polygonStart() {
    this._line = 0;
  },
  polygonEnd: function polygonEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    if (this._line === 0) this._string.push("Z");
    this._point = NaN;
  },
  point: function point(x, y) {
    switch (this._point) {
      case 0:
        {
          this._string.push("M", x, ",", y);
          this._point = 1;
          break;
        }
      case 1:
        {
          this._string.push("L", x, ",", y);
          break;
        }
      default:
        {
          if (this._circle == null) this._circle = circle$2(this._radius);
          this._string.push("M", x, ",", y, this._circle);
          break;
        }
    }
  },
  result: function result() {
    if (this._string.length) {
      var result = this._string.join("");
      this._string = [];
      return result;
    } else {
      return null;
    }
  }
};

function circle$2(radius) {
  return "m0," + radius + "a" + radius + "," + radius + " 0 1,1 0," + -2 * radius + "a" + radius + "," + radius + " 0 1,1 0," + 2 * radius + "z";
}

var geoPath = function (projection, context) {
  var pointRadius = 4.5,
      projectionStream,
      contextStream;

  function path(object) {
    if (object) {
      if (typeof pointRadius === "function") contextStream.pointRadius(+pointRadius.apply(this, arguments));
      geoStream(object, projectionStream(contextStream));
    }
    return contextStream.result();
  }

  path.area = function (object) {
    geoStream(object, projectionStream(areaStream$1));
    return areaStream$1.result();
  };

  path.measure = function (object) {
    geoStream(object, projectionStream(lengthStream$1));
    return lengthStream$1.result();
  };

  path.bounds = function (object) {
    geoStream(object, projectionStream(boundsStream$1));
    return boundsStream$1.result();
  };

  path.centroid = function (object) {
    geoStream(object, projectionStream(centroidStream$1));
    return centroidStream$1.result();
  };

  path.projection = function (_) {
    return arguments.length ? (projectionStream = _ == null ? (projection = null, identity$8) : (projection = _).stream, path) : projection;
  };

  path.context = function (_) {
    if (!arguments.length) return context;
    contextStream = _ == null ? (context = null, new PathString()) : new PathContext(context = _);
    if (typeof pointRadius !== "function") contextStream.pointRadius(pointRadius);
    return path;
  };

  path.pointRadius = function (_) {
    if (!arguments.length) return pointRadius;
    pointRadius = typeof _ === "function" ? _ : (contextStream.pointRadius(+_), +_);
    return path;
  };

  return path.projection(projection).context(context);
};

var geoTransform = function (methods) {
  return {
    stream: transformer(methods)
  };
};

function transformer(methods) {
  return function (stream) {
    var s = new TransformStream();
    for (var key in methods) {
      s[key] = methods[key];
    }s.stream = stream;
    return s;
  };
}

function TransformStream() {}

TransformStream.prototype = {
  constructor: TransformStream,
  point: function point(x, y) {
    this.stream.point(x, y);
  },
  sphere: function sphere() {
    this.stream.sphere();
  },
  lineStart: function lineStart() {
    this.stream.lineStart();
  },
  lineEnd: function lineEnd() {
    this.stream.lineEnd();
  },
  polygonStart: function polygonStart() {
    this.stream.polygonStart();
  },
  polygonEnd: function polygonEnd() {
    this.stream.polygonEnd();
  }
};

var cosMinDistance = cos$1(30 * radians); // cos(minimum angular distance)

function azimuthalRaw(scale) {
  return function (x, y) {
    var cx = cos$1(x),
        cy = cos$1(y),
        k = scale(cx * cy);
    return [k * cy * sin$1(x), k * sin$1(y)];
  };
}

function azimuthalInvert(angle) {
  return function (x, y) {
    var z = sqrt$2(x * x + y * y),
        c = angle(z),
        sc = sin$1(c),
        cc = cos$1(c);
    return [atan2$1(x * sc, z * cc), asin$1(z && y * sc / z)];
  };
}

var azimuthalEqualAreaRaw = azimuthalRaw(function (cxcy) {
  return sqrt$2(2 / (1 + cxcy));
});

azimuthalEqualAreaRaw.invert = azimuthalInvert(function (z) {
  return 2 * asin$1(z / 2);
});

var azimuthalEquidistantRaw = azimuthalRaw(function (c) {
  return (c = acos$1(c)) && c / sin$1(c);
});

azimuthalEquidistantRaw.invert = azimuthalInvert(function (z) {
  return z;
});

/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear$2() {
  this.__data__ = [];
  this.size = 0;
}

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq$2(value, other) {
  return value === other || value !== value && other !== other;
}

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf$2(array, key) {
  var length = array.length;
  while (length--) {
    if (eq$2(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

/** Used for built-in method references. */
var arrayProto$2 = Array.prototype;

/** Built-in value references. */
var splice$2 = arrayProto$2.splice;

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete$2(key) {
  var data = this.__data__,
      index = assocIndexOf$2(data, key);

  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice$2.call(data, index, 1);
  }
  --this.size;
  return true;
}

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet$2(key) {
  var data = this.__data__,
      index = assocIndexOf$2(data, key);

  return index < 0 ? undefined : data[index][1];
}

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas$2(key) {
  return assocIndexOf$2(this.__data__, key) > -1;
}

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet$2(key, value) {
  var data = this.__data__,
      index = assocIndexOf$2(data, key);

  if (index < 0) {
    ++this.size;
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache$2(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `ListCache`.
ListCache$2.prototype.clear = listCacheClear$2;
ListCache$2.prototype['delete'] = listCacheDelete$2;
ListCache$2.prototype.get = listCacheGet$2;
ListCache$2.prototype.has = listCacheHas$2;
ListCache$2.prototype.set = listCacheSet$2;

/**
 * Removes all key-value entries from the stack.
 *
 * @private
 * @name clear
 * @memberOf Stack
 */
function stackClear$2() {
  this.__data__ = new ListCache$2();
  this.size = 0;
}

/**
 * Removes `key` and its value from the stack.
 *
 * @private
 * @name delete
 * @memberOf Stack
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function stackDelete$2(key) {
  var data = this.__data__,
      result = data['delete'](key);

  this.size = data.size;
  return result;
}

/**
 * Gets the stack value for `key`.
 *
 * @private
 * @name get
 * @memberOf Stack
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function stackGet$2(key) {
  return this.__data__.get(key);
}

/**
 * Checks if a stack value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Stack
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function stackHas$2(key) {
  return this.__data__.has(key);
}

/** Detect free variable `global` from Node.js. */
var freeGlobal$2 = (typeof global === 'undefined' ? 'undefined' : _typeof$1(global)) == 'object' && global && global.Object === Object && global;

/** Detect free variable `self`. */
var freeSelf$2 = (typeof self === 'undefined' ? 'undefined' : _typeof$1(self)) == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root$4 = freeGlobal$2 || freeSelf$2 || Function('return this')();

/** Built-in value references. */
var _Symbol$2 = root$4.Symbol;

/** Used for built-in method references. */
var objectProto$3$2 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$3$2 = objectProto$3$2.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString$2 = objectProto$3$2.toString;

/** Built-in value references. */
var symToStringTag$3 = _Symbol$2 ? _Symbol$2.toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag$2(value) {
  var isOwn = hasOwnProperty$3$2.call(value, symToStringTag$3),
      tag = value[symToStringTag$3];

  try {
    value[symToStringTag$3] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString$2.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag$3] = tag;
    } else {
      delete value[symToStringTag$3];
    }
  }
  return result;
}

/** Used for built-in method references. */
var objectProto$4$2 = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString$3 = objectProto$4$2.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString$2(value) {
  return nativeObjectToString$3.call(value);
}

/** `Object#toString` result references. */
var nullTag$2 = '[object Null]';
var undefinedTag$2 = '[object Undefined]';

/** Built-in value references. */
var symToStringTag$2 = _Symbol$2 ? _Symbol$2.toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag$2(value) {
  if (value == null) {
    return value === undefined ? undefinedTag$2 : nullTag$2;
  }
  return symToStringTag$2 && symToStringTag$2 in Object(value) ? getRawTag$2(value) : objectToString$2(value);
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject$2(value) {
  var type = typeof value === 'undefined' ? 'undefined' : _typeof$1(value);
  return value != null && (type == 'object' || type == 'function');
}

/** `Object#toString` result references. */
var asyncTag$2 = '[object AsyncFunction]';
var funcTag$2$2 = '[object Function]';
var genTag$2 = '[object GeneratorFunction]';
var proxyTag$2 = '[object Proxy]';

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction$2(value) {
  if (!isObject$2(value)) {
    return false;
  }
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 9 which returns 'object' for typed arrays and other constructors.
  var tag = baseGetTag$2(value);
  return tag == funcTag$2$2 || tag == genTag$2 || tag == asyncTag$2 || tag == proxyTag$2;
}

/** Used to detect overreaching core-js shims. */
var coreJsData$2 = root$4['__core-js_shared__'];

/** Used to detect methods masquerading as native. */
var maskSrcKey$2 = function () {
  var uid = /[^.]+$/.exec(coreJsData$2 && coreJsData$2.keys && coreJsData$2.keys.IE_PROTO || '');
  return uid ? 'Symbol(src)_1.' + uid : '';
}();

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked$2(func) {
  return !!maskSrcKey$2 && maskSrcKey$2 in func;
}

/** Used for built-in method references. */
var funcProto$3 = Function.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString$3 = funcProto$3.toString;

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to convert.
 * @returns {string} Returns the source code.
 */
function toSource$2(func) {
  if (func != null) {
    try {
      return funcToString$3.call(func);
    } catch (e) {}
    try {
      return func + '';
    } catch (e) {}
  }
  return '';
}

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar$2 = /[\\^$.*+?()[\]{}|]/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor$2 = /^\[object .+?Constructor\]$/;

/** Used for built-in method references. */
var funcProto$2$1 = Function.prototype;
var objectProto$2$2 = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString$2$1 = funcProto$2$1.toString;

/** Used to check objects for own properties. */
var hasOwnProperty$2$2 = objectProto$2$2.hasOwnProperty;

/** Used to detect if a method is native. */
var reIsNative$2 = RegExp('^' + funcToString$2$1.call(hasOwnProperty$2$2).replace(reRegExpChar$2, '\\$&').replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$');

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative$2(value) {
  if (!isObject$2(value) || isMasked$2(value)) {
    return false;
  }
  var pattern = isFunction$2(value) ? reIsNative$2 : reIsHostCtor$2;
  return pattern.test(toSource$2(value));
}

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue$2(object, key) {
  return object == null ? undefined : object[key];
}

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative$2(object, key) {
  var value = getValue$2(object, key);
  return baseIsNative$2(value) ? value : undefined;
}

/* Built-in method references that are verified to be native. */
var Map$3 = getNative$2(root$4, 'Map');

/* Built-in method references that are verified to be native. */
var nativeCreate$2 = getNative$2(Object, 'create');

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear$2() {
  this.__data__ = nativeCreate$2 ? nativeCreate$2(null) : {};
  this.size = 0;
}

/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete$2(key) {
  var result = this.has(key) && delete this.__data__[key];
  this.size -= result ? 1 : 0;
  return result;
}

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED$2$2 = '__lodash_hash_undefined__';

/** Used for built-in method references. */
var objectProto$5$2 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$4$2 = objectProto$5$2.hasOwnProperty;

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet$2(key) {
  var data = this.__data__;
  if (nativeCreate$2) {
    var result = data[key];
    return result === HASH_UNDEFINED$2$2 ? undefined : result;
  }
  return hasOwnProperty$4$2.call(data, key) ? data[key] : undefined;
}

/** Used for built-in method references. */
var objectProto$6$2 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$5$2 = objectProto$6$2.hasOwnProperty;

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas$2(key) {
  var data = this.__data__;
  return nativeCreate$2 ? data[key] !== undefined : hasOwnProperty$5$2.call(data, key);
}

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED$3 = '__lodash_hash_undefined__';

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet$2(key, value) {
  var data = this.__data__;
  this.size += this.has(key) ? 0 : 1;
  data[key] = nativeCreate$2 && value === undefined ? HASH_UNDEFINED$3 : value;
  return this;
}

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash$2(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `Hash`.
Hash$2.prototype.clear = hashClear$2;
Hash$2.prototype['delete'] = hashDelete$2;
Hash$2.prototype.get = hashGet$2;
Hash$2.prototype.has = hashHas$2;
Hash$2.prototype.set = hashSet$2;

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear$2() {
  this.size = 0;
  this.__data__ = {
    'hash': new Hash$2(),
    'map': new (Map$3 || ListCache$2)(),
    'string': new Hash$2()
  };
}

/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable$2(value) {
  var type = typeof value === 'undefined' ? 'undefined' : _typeof$1(value);
  return type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean' ? value !== '__proto__' : value === null;
}

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData$2(map, key) {
  var data = map.__data__;
  return isKeyable$2(key) ? data[typeof key == 'string' ? 'string' : 'hash'] : data.map;
}

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete$2(key) {
  var result = getMapData$2(this, key)['delete'](key);
  this.size -= result ? 1 : 0;
  return result;
}

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet$2(key) {
  return getMapData$2(this, key).get(key);
}

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas$2(key) {
  return getMapData$2(this, key).has(key);
}

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet$2(key, value) {
  var data = getMapData$2(this, key),
      size = data.size;

  data.set(key, value);
  this.size += data.size == size ? 0 : 1;
  return this;
}

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache$2(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `MapCache`.
MapCache$2.prototype.clear = mapCacheClear$2;
MapCache$2.prototype['delete'] = mapCacheDelete$2;
MapCache$2.prototype.get = mapCacheGet$2;
MapCache$2.prototype.has = mapCacheHas$2;
MapCache$2.prototype.set = mapCacheSet$2;

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE$2 = 200;

/**
 * Sets the stack `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Stack
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the stack cache instance.
 */
function stackSet$2(key, value) {
  var data = this.__data__;
  if (data instanceof ListCache$2) {
    var pairs = data.__data__;
    if (!Map$3 || pairs.length < LARGE_ARRAY_SIZE$2 - 1) {
      pairs.push([key, value]);
      this.size = ++data.size;
      return this;
    }
    data = this.__data__ = new MapCache$2(pairs);
  }
  data.set(key, value);
  this.size = data.size;
  return this;
}

/**
 * Creates a stack cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Stack$2(entries) {
  var data = this.__data__ = new ListCache$2(entries);
  this.size = data.size;
}

// Add methods to `Stack`.
Stack$2.prototype.clear = stackClear$2;
Stack$2.prototype['delete'] = stackDelete$2;
Stack$2.prototype.get = stackGet$2;
Stack$2.prototype.has = stackHas$2;
Stack$2.prototype.set = stackSet$2;

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED$4 = '__lodash_hash_undefined__';

/**
 * Adds `value` to the array cache.
 *
 * @private
 * @name add
 * @memberOf SetCache
 * @alias push
 * @param {*} value The value to cache.
 * @returns {Object} Returns the cache instance.
 */
function setCacheAdd$2(value) {
  this.__data__.set(value, HASH_UNDEFINED$4);
  return this;
}

/**
 * Checks if `value` is in the array cache.
 *
 * @private
 * @name has
 * @memberOf SetCache
 * @param {*} value The value to search for.
 * @returns {number} Returns `true` if `value` is found, else `false`.
 */
function setCacheHas$2(value) {
  return this.__data__.has(value);
}

/**
 *
 * Creates an array cache object to store unique values.
 *
 * @private
 * @constructor
 * @param {Array} [values] The values to cache.
 */
function SetCache$2(values) {
  var index = -1,
      length = values == null ? 0 : values.length;

  this.__data__ = new MapCache$2();
  while (++index < length) {
    this.add(values[index]);
  }
}

// Add methods to `SetCache`.
SetCache$2.prototype.add = SetCache$2.prototype.push = setCacheAdd$2;
SetCache$2.prototype.has = setCacheHas$2;

/**
 * A specialized version of `_.some` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if any element passes the predicate check,
 *  else `false`.
 */
function arraySome$2(array, predicate) {
  var index = -1,
      length = array == null ? 0 : array.length;

  while (++index < length) {
    if (predicate(array[index], index, array)) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if a `cache` value for `key` exists.
 *
 * @private
 * @param {Object} cache The cache to query.
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function cacheHas$2(cache, key) {
  return cache.has(key);
}

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG$4$2 = 1;
var COMPARE_UNORDERED_FLAG$3$2 = 2;

/**
 * A specialized version of `baseIsEqualDeep` for arrays with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Array} array The array to compare.
 * @param {Array} other The other array to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `array` and `other` objects.
 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
 */
function equalArrays$2(array, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG$4$2,
      arrLength = array.length,
      othLength = other.length;

  if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
    return false;
  }
  // Assume cyclic values are equal.
  var stacked = stack.get(array);
  if (stacked && stack.get(other)) {
    return stacked == other;
  }
  var index = -1,
      result = true,
      seen = bitmask & COMPARE_UNORDERED_FLAG$3$2 ? new SetCache$2() : undefined;

  stack.set(array, other);
  stack.set(other, array);

  // Ignore non-index properties.
  while (++index < arrLength) {
    var arrValue = array[index],
        othValue = other[index];

    if (customizer) {
      var compared = isPartial ? customizer(othValue, arrValue, index, other, array, stack) : customizer(arrValue, othValue, index, array, other, stack);
    }
    if (compared !== undefined) {
      if (compared) {
        continue;
      }
      result = false;
      break;
    }
    // Recursively compare arrays (susceptible to call stack limits).
    if (seen) {
      if (!arraySome$2(other, function (othValue, othIndex) {
        if (!cacheHas$2(seen, othIndex) && (arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
          return seen.push(othIndex);
        }
      })) {
        result = false;
        break;
      }
    } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
      result = false;
      break;
    }
  }
  stack['delete'](array);
  stack['delete'](other);
  return result;
}

/** Built-in value references. */
var Uint8Array$2 = root$4.Uint8Array;

/**
 * Converts `map` to its key-value pairs.
 *
 * @private
 * @param {Object} map The map to convert.
 * @returns {Array} Returns the key-value pairs.
 */
function mapToArray$2(map) {
  var index = -1,
      result = Array(map.size);

  map.forEach(function (value, key) {
    result[++index] = [key, value];
  });
  return result;
}

/**
 * Converts `set` to an array of its values.
 *
 * @private
 * @param {Object} set The set to convert.
 * @returns {Array} Returns the values.
 */
function setToArray$2(set) {
  var index = -1,
      result = Array(set.size);

  set.forEach(function (value) {
    result[++index] = value;
  });
  return result;
}

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG$5$2 = 1;
var COMPARE_UNORDERED_FLAG$4 = 2;

/** `Object#toString` result references. */
var boolTag$2$2 = '[object Boolean]';
var dateTag$2$2 = '[object Date]';
var errorTag$2$2 = '[object Error]';
var mapTag$2$2 = '[object Map]';
var numberTag$2$2 = '[object Number]';
var regexpTag$2$2 = '[object RegExp]';
var setTag$2$2 = '[object Set]';
var stringTag$2$2 = '[object String]';
var symbolTag$2$2 = '[object Symbol]';

var arrayBufferTag$2$2 = '[object ArrayBuffer]';
var dataViewTag$2$2 = '[object DataView]';

/** Used to convert symbols to primitives and strings. */
var symbolProto$2$2 = _Symbol$2 ? _Symbol$2.prototype : undefined;
var symbolValueOf$2 = symbolProto$2$2 ? symbolProto$2$2.valueOf : undefined;

/**
 * A specialized version of `baseIsEqualDeep` for comparing objects of
 * the same `toStringTag`.
 *
 * **Note:** This function only supports comparing values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {string} tag The `toStringTag` of the objects to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalByTag$2(object, other, tag, bitmask, customizer, equalFunc, stack) {
  switch (tag) {
    case dataViewTag$2$2:
      if (object.byteLength != other.byteLength || object.byteOffset != other.byteOffset) {
        return false;
      }
      object = object.buffer;
      other = other.buffer;

    case arrayBufferTag$2$2:
      if (object.byteLength != other.byteLength || !equalFunc(new Uint8Array$2(object), new Uint8Array$2(other))) {
        return false;
      }
      return true;

    case boolTag$2$2:
    case dateTag$2$2:
    case numberTag$2$2:
      // Coerce booleans to `1` or `0` and dates to milliseconds.
      // Invalid dates are coerced to `NaN`.
      return eq$2(+object, +other);

    case errorTag$2$2:
      return object.name == other.name && object.message == other.message;

    case regexpTag$2$2:
    case stringTag$2$2:
      // Coerce regexes to strings and treat strings, primitives and objects,
      // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
      // for more details.
      return object == other + '';

    case mapTag$2$2:
      var convert = mapToArray$2;

    case setTag$2$2:
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG$5$2;
      convert || (convert = setToArray$2);

      if (object.size != other.size && !isPartial) {
        return false;
      }
      // Assume cyclic values are equal.
      var stacked = stack.get(object);
      if (stacked) {
        return stacked == other;
      }
      bitmask |= COMPARE_UNORDERED_FLAG$4;

      // Recursively compare objects (susceptible to call stack limits).
      stack.set(object, other);
      var result = equalArrays$2(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
      stack['delete'](object);
      return result;

    case symbolTag$2$2:
      if (symbolValueOf$2) {
        return symbolValueOf$2.call(object) == symbolValueOf$2.call(other);
      }
  }
  return false;
}

/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */
function arrayPush$2(array, values) {
  var index = -1,
      length = values.length,
      offset = array.length;

  while (++index < length) {
    array[offset + index] = values[index];
  }
  return array;
}

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray$2 = Array.isArray;

/**
 * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
 * `keysFunc` and `symbolsFunc` to get the enumerable property names and
 * symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @param {Function} symbolsFunc The function to get the symbols of `object`.
 * @returns {Array} Returns the array of property names and symbols.
 */
function baseGetAllKeys$2(object, keysFunc, symbolsFunc) {
  var result = keysFunc(object);
  return isArray$2(object) ? result : arrayPush$2(result, symbolsFunc(object));
}

/**
 * A specialized version of `_.filter` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
function arrayFilter$2(array, predicate) {
  var index = -1,
      length = array == null ? 0 : array.length,
      resIndex = 0,
      result = [];

  while (++index < length) {
    var value = array[index];
    if (predicate(value, index, array)) {
      result[resIndex++] = value;
    }
  }
  return result;
}

/**
 * This method returns a new empty array.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {Array} Returns the new empty array.
 * @example
 *
 * var arrays = _.times(2, _.stubArray);
 *
 * console.log(arrays);
 * // => [[], []]
 *
 * console.log(arrays[0] === arrays[1]);
 * // => false
 */
function stubArray$2() {
  return [];
}

/** Used for built-in method references. */
var objectProto$9$2 = Object.prototype;

/** Built-in value references. */
var propertyIsEnumerable$2 = objectProto$9$2.propertyIsEnumerable;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeGetSymbols$2 = Object.getOwnPropertySymbols;

/**
 * Creates an array of the own enumerable symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */
var getSymbols$2 = !nativeGetSymbols$2 ? stubArray$2 : function (object) {
  if (object == null) {
    return [];
  }
  object = Object(object);
  return arrayFilter$2(nativeGetSymbols$2(object), function (symbol) {
    return propertyIsEnumerable$2.call(object, symbol);
  });
};

/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */
function baseTimes$2(n, iteratee) {
  var index = -1,
      result = Array(n);

  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike$2(value) {
  return value != null && (typeof value === 'undefined' ? 'undefined' : _typeof$1(value)) == 'object';
}

/** `Object#toString` result references. */
var argsTag$3$2 = '[object Arguments]';

/**
 * The base implementation of `_.isArguments`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 */
function baseIsArguments$2(value) {
  return isObjectLike$2(value) && baseGetTag$2(value) == argsTag$3$2;
}

/** Used for built-in method references. */
var objectProto$11$2 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$9$2 = objectProto$11$2.hasOwnProperty;

/** Built-in value references. */
var propertyIsEnumerable$3 = objectProto$11$2.propertyIsEnumerable;

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
var isArguments$2 = baseIsArguments$2(function () {
  return arguments;
}()) ? baseIsArguments$2 : function (value) {
  return isObjectLike$2(value) && hasOwnProperty$9$2.call(value, 'callee') && !propertyIsEnumerable$3.call(value, 'callee');
};

/**
 * This method returns `false`.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {boolean} Returns `false`.
 * @example
 *
 * _.times(2, _.stubFalse);
 * // => [false, false]
 */
function stubFalse$2() {
  return false;
}

/** Detect free variable `exports`. */
var freeExports$2$2 = (typeof exports === 'undefined' ? 'undefined' : _typeof$1(exports)) == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule$2$2 = freeExports$2$2 && (typeof module === 'undefined' ? 'undefined' : _typeof$1(module)) == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports$2$2 = freeModule$2$2 && freeModule$2$2.exports === freeExports$2$2;

/** Built-in value references. */
var Buffer$2 = moduleExports$2$2 ? root$4.Buffer : undefined;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeIsBuffer$2 = Buffer$2 ? Buffer$2.isBuffer : undefined;

/**
 * Checks if `value` is a buffer.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
 * @example
 *
 * _.isBuffer(new Buffer(2));
 * // => true
 *
 * _.isBuffer(new Uint8Array(2));
 * // => false
 */
var isBuffer$2 = nativeIsBuffer$2 || stubFalse$2;

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER$2 = 9007199254740991;

/** Used to detect unsigned integer values. */
var reIsUint$2 = /^(?:0|[1-9]\d*)$/;

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex$2(value, length) {
  length = length == null ? MAX_SAFE_INTEGER$2 : length;
  return !!length && (typeof value == 'number' || reIsUint$2.test(value)) && value > -1 && value % 1 == 0 && value < length;
}

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER$3 = 9007199254740991;

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength$2(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER$3;
}

/** `Object#toString` result references. */
var argsTag$4 = '[object Arguments]';
var arrayTag$3 = '[object Array]';
var boolTag$3$2 = '[object Boolean]';
var dateTag$3$2 = '[object Date]';
var errorTag$3 = '[object Error]';
var funcTag$3 = '[object Function]';
var mapTag$3$2 = '[object Map]';
var numberTag$3$2 = '[object Number]';
var objectTag$3$2 = '[object Object]';
var regexpTag$3$2 = '[object RegExp]';
var setTag$3$2 = '[object Set]';
var stringTag$3$2 = '[object String]';
var weakMapTag$2$2 = '[object WeakMap]';

var arrayBufferTag$3$2 = '[object ArrayBuffer]';
var dataViewTag$3$2 = '[object DataView]';
var float32Tag$2$2 = '[object Float32Array]';
var float64Tag$2$2 = '[object Float64Array]';
var int8Tag$2$2 = '[object Int8Array]';
var int16Tag$2$2 = '[object Int16Array]';
var int32Tag$2$2 = '[object Int32Array]';
var uint8Tag$2$2 = '[object Uint8Array]';
var uint8ClampedTag$2$2 = '[object Uint8ClampedArray]';
var uint16Tag$2$2 = '[object Uint16Array]';
var uint32Tag$2$2 = '[object Uint32Array]';

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags$2 = {};
typedArrayTags$2[float32Tag$2$2] = typedArrayTags$2[float64Tag$2$2] = typedArrayTags$2[int8Tag$2$2] = typedArrayTags$2[int16Tag$2$2] = typedArrayTags$2[int32Tag$2$2] = typedArrayTags$2[uint8Tag$2$2] = typedArrayTags$2[uint8ClampedTag$2$2] = typedArrayTags$2[uint16Tag$2$2] = typedArrayTags$2[uint32Tag$2$2] = true;
typedArrayTags$2[argsTag$4] = typedArrayTags$2[arrayTag$3] = typedArrayTags$2[arrayBufferTag$3$2] = typedArrayTags$2[boolTag$3$2] = typedArrayTags$2[dataViewTag$3$2] = typedArrayTags$2[dateTag$3$2] = typedArrayTags$2[errorTag$3] = typedArrayTags$2[funcTag$3] = typedArrayTags$2[mapTag$3$2] = typedArrayTags$2[numberTag$3$2] = typedArrayTags$2[objectTag$3$2] = typedArrayTags$2[regexpTag$3$2] = typedArrayTags$2[setTag$3$2] = typedArrayTags$2[stringTag$3$2] = typedArrayTags$2[weakMapTag$2$2] = false;

/**
 * The base implementation of `_.isTypedArray` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 */
function baseIsTypedArray$2(value) {
    return isObjectLike$2(value) && isLength$2(value.length) && !!typedArrayTags$2[baseGetTag$2(value)];
}

/**
 * The base implementation of `_.unary` without support for storing metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 */
function baseUnary$2(func) {
  return function (value) {
    return func(value);
  };
}

/** Detect free variable `exports`. */
var freeExports$3 = (typeof exports === 'undefined' ? 'undefined' : _typeof$1(exports)) == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule$3 = freeExports$3 && (typeof module === 'undefined' ? 'undefined' : _typeof$1(module)) == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports$3 = freeModule$3 && freeModule$3.exports === freeExports$3;

/** Detect free variable `process` from Node.js. */
var freeProcess$2 = moduleExports$3 && freeGlobal$2.process;

/** Used to access faster Node.js helpers. */
var nodeUtil$2 = function () {
  try {
    return freeProcess$2 && freeProcess$2.binding && freeProcess$2.binding('util');
  } catch (e) {}
}();

/* Node.js helper references. */
var nodeIsTypedArray$2 = nodeUtil$2 && nodeUtil$2.isTypedArray;

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
var isTypedArray$2 = nodeIsTypedArray$2 ? baseUnary$2(nodeIsTypedArray$2) : baseIsTypedArray$2;

/** Used for built-in method references. */
var objectProto$10$2 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$8$2 = objectProto$10$2.hasOwnProperty;

/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */
function arrayLikeKeys$2(value, inherited) {
  var isArr = isArray$2(value),
      isArg = !isArr && isArguments$2(value),
      isBuff = !isArr && !isArg && isBuffer$2(value),
      isType = !isArr && !isArg && !isBuff && isTypedArray$2(value),
      skipIndexes = isArr || isArg || isBuff || isType,
      result = skipIndexes ? baseTimes$2(value.length, String) : [],
      length = result.length;

  for (var key in value) {
    if ((inherited || hasOwnProperty$8$2.call(value, key)) && !(skipIndexes && (
    // Safari 9 has enumerable `arguments.length` in strict mode.
    key == 'length' ||
    // Node.js 0.10 has enumerable non-index properties on buffers.
    isBuff && (key == 'offset' || key == 'parent') ||
    // PhantomJS 2 has enumerable non-index properties on typed arrays.
    isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset') ||
    // Skip index properties.
    isIndex$2(key, length)))) {
      result.push(key);
    }
  }
  return result;
}

/** Used for built-in method references. */
var objectProto$13$2 = Object.prototype;

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
function isPrototype$2(value) {
  var Ctor = value && value.constructor,
      proto = typeof Ctor == 'function' && Ctor.prototype || objectProto$13$2;

  return value === proto;
}

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg$2(func, transform) {
  return function (arg) {
    return func(transform(arg));
  };
}

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeKeys$2 = overArg$2(Object.keys, Object);

/** Used for built-in method references. */
var objectProto$12$2 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$10$2 = objectProto$12$2.hasOwnProperty;

/**
 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeys$2(object) {
  if (!isPrototype$2(object)) {
    return nativeKeys$2(object);
  }
  var result = [];
  for (var key in Object(object)) {
    if (hasOwnProperty$10$2.call(object, key) && key != 'constructor') {
      result.push(key);
    }
  }
  return result;
}

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike$2(value) {
  return value != null && isLength$2(value.length) && !isFunction$2(value);
}

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
function keys$3(object) {
  return isArrayLike$2(object) ? arrayLikeKeys$2(object) : baseKeys$2(object);
}

/**
 * Creates an array of own enumerable property names and symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names and symbols.
 */
function getAllKeys$2(object) {
  return baseGetAllKeys$2(object, keys$3, getSymbols$2);
}

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG$6 = 1;

/** Used for built-in method references. */
var objectProto$8$2 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$7$2 = objectProto$8$2.hasOwnProperty;

/**
 * A specialized version of `baseIsEqualDeep` for objects with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalObjects$2(object, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG$6,
      objProps = getAllKeys$2(object),
      objLength = objProps.length,
      othProps = getAllKeys$2(other),
      othLength = othProps.length;

  if (objLength != othLength && !isPartial) {
    return false;
  }
  var index = objLength;
  while (index--) {
    var key = objProps[index];
    if (!(isPartial ? key in other : hasOwnProperty$7$2.call(other, key))) {
      return false;
    }
  }
  // Assume cyclic values are equal.
  var stacked = stack.get(object);
  if (stacked && stack.get(other)) {
    return stacked == other;
  }
  var result = true;
  stack.set(object, other);
  stack.set(other, object);

  var skipCtor = isPartial;
  while (++index < objLength) {
    key = objProps[index];
    var objValue = object[key],
        othValue = other[key];

    if (customizer) {
      var compared = isPartial ? customizer(othValue, objValue, key, other, object, stack) : customizer(objValue, othValue, key, object, other, stack);
    }
    // Recursively compare objects (susceptible to call stack limits).
    if (!(compared === undefined ? objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack) : compared)) {
      result = false;
      break;
    }
    skipCtor || (skipCtor = key == 'constructor');
  }
  if (result && !skipCtor) {
    var objCtor = object.constructor,
        othCtor = other.constructor;

    // Non `Object` object instances with different constructors are not equal.
    if (objCtor != othCtor && 'constructor' in object && 'constructor' in other && !(typeof objCtor == 'function' && objCtor instanceof objCtor && typeof othCtor == 'function' && othCtor instanceof othCtor)) {
      result = false;
    }
  }
  stack['delete'](object);
  stack['delete'](other);
  return result;
}

/* Built-in method references that are verified to be native. */
var DataView$2 = getNative$2(root$4, 'DataView');

/* Built-in method references that are verified to be native. */
var Promise$1$2 = getNative$2(root$4, 'Promise');

/* Built-in method references that are verified to be native. */
var Set$3 = getNative$2(root$4, 'Set');

/* Built-in method references that are verified to be native. */
var WeakMap$2 = getNative$2(root$4, 'WeakMap');

/** `Object#toString` result references. */
var mapTag$4$2 = '[object Map]';
var objectTag$4$1 = '[object Object]';
var promiseTag$2 = '[object Promise]';
var setTag$4$2 = '[object Set]';
var weakMapTag$3 = '[object WeakMap]';

var dataViewTag$4$2 = '[object DataView]';

/** Used to detect maps, sets, and weakmaps. */
var dataViewCtorString$2 = toSource$2(DataView$2);
var mapCtorString$2 = toSource$2(Map$3);
var promiseCtorString$2 = toSource$2(Promise$1$2);
var setCtorString$2 = toSource$2(Set$3);
var weakMapCtorString$2 = toSource$2(WeakMap$2);

/**
 * Gets the `toStringTag` of `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
var getTag$2 = baseGetTag$2;

// Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
if (DataView$2 && getTag$2(new DataView$2(new ArrayBuffer(1))) != dataViewTag$4$2 || Map$3 && getTag$2(new Map$3()) != mapTag$4$2 || Promise$1$2 && getTag$2(Promise$1$2.resolve()) != promiseTag$2 || Set$3 && getTag$2(new Set$3()) != setTag$4$2 || WeakMap$2 && getTag$2(new WeakMap$2()) != weakMapTag$3) {
    getTag$2 = function getTag(value) {
        var result = baseGetTag$2(value),
            Ctor = result == objectTag$4$1 ? value.constructor : undefined,
            ctorString = Ctor ? toSource$2(Ctor) : '';

        if (ctorString) {
            switch (ctorString) {
                case dataViewCtorString$2:
                    return dataViewTag$4$2;
                case mapCtorString$2:
                    return mapTag$4$2;
                case promiseCtorString$2:
                    return promiseTag$2;
                case setCtorString$2:
                    return setTag$4$2;
                case weakMapCtorString$2:
                    return weakMapTag$3;
            }
        }
        return result;
    };
}

var getTag$3 = getTag$2;

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG$3$2 = 1;

/** `Object#toString` result references. */
var argsTag$2$2 = '[object Arguments]';
var arrayTag$2$2 = '[object Array]';
var objectTag$2$2 = '[object Object]';

/** Used for built-in method references. */
var objectProto$7$2 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$6$2 = objectProto$7$2.hasOwnProperty;

/**
 * A specialized version of `baseIsEqual` for arrays and objects which performs
 * deep comparisons and tracks traversed objects enabling objects with circular
 * references to be compared.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} [stack] Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function baseIsEqualDeep$2(object, other, bitmask, customizer, equalFunc, stack) {
  var objIsArr = isArray$2(object),
      othIsArr = isArray$2(other),
      objTag = objIsArr ? arrayTag$2$2 : getTag$3(object),
      othTag = othIsArr ? arrayTag$2$2 : getTag$3(other);

  objTag = objTag == argsTag$2$2 ? objectTag$2$2 : objTag;
  othTag = othTag == argsTag$2$2 ? objectTag$2$2 : othTag;

  var objIsObj = objTag == objectTag$2$2,
      othIsObj = othTag == objectTag$2$2,
      isSameTag = objTag == othTag;

  if (isSameTag && isBuffer$2(object)) {
    if (!isBuffer$2(other)) {
      return false;
    }
    objIsArr = true;
    objIsObj = false;
  }
  if (isSameTag && !objIsObj) {
    stack || (stack = new Stack$2());
    return objIsArr || isTypedArray$2(object) ? equalArrays$2(object, other, bitmask, customizer, equalFunc, stack) : equalByTag$2(object, other, objTag, bitmask, customizer, equalFunc, stack);
  }
  if (!(bitmask & COMPARE_PARTIAL_FLAG$3$2)) {
    var objIsWrapped = objIsObj && hasOwnProperty$6$2.call(object, '__wrapped__'),
        othIsWrapped = othIsObj && hasOwnProperty$6$2.call(other, '__wrapped__');

    if (objIsWrapped || othIsWrapped) {
      var objUnwrapped = objIsWrapped ? object.value() : object,
          othUnwrapped = othIsWrapped ? other.value() : other;

      stack || (stack = new Stack$2());
      return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
    }
  }
  if (!isSameTag) {
    return false;
  }
  stack || (stack = new Stack$2());
  return equalObjects$2(object, other, bitmask, customizer, equalFunc, stack);
}

/**
 * The base implementation of `_.isEqual` which supports partial comparisons
 * and tracks traversed objects.
 *
 * @private
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @param {boolean} bitmask The bitmask flags.
 *  1 - Unordered comparison
 *  2 - Partial comparison
 * @param {Function} [customizer] The function to customize comparisons.
 * @param {Object} [stack] Tracks traversed `value` and `other` objects.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 */
function baseIsEqual$2(value, other, bitmask, customizer, stack) {
  if (value === other) {
    return true;
  }
  if (value == null || other == null || !isObjectLike$2(value) && !isObjectLike$2(other)) {
    return value !== value && other !== other;
  }
  return baseIsEqualDeep$2(value, other, bitmask, customizer, baseIsEqual$2, stack);
}

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG$2$2 = 1;
var COMPARE_UNORDERED_FLAG$2$2 = 2;

/**
 * The base implementation of `_.isMatch` without support for iteratee shorthands.
 *
 * @private
 * @param {Object} object The object to inspect.
 * @param {Object} source The object of property values to match.
 * @param {Array} matchData The property names, values, and compare flags to match.
 * @param {Function} [customizer] The function to customize comparisons.
 * @returns {boolean} Returns `true` if `object` is a match, else `false`.
 */
function baseIsMatch$2(object, source, matchData, customizer) {
  var index = matchData.length,
      length = index,
      noCustomizer = !customizer;

  if (object == null) {
    return !length;
  }
  object = Object(object);
  while (index--) {
    var data = matchData[index];
    if (noCustomizer && data[2] ? data[1] !== object[data[0]] : !(data[0] in object)) {
      return false;
    }
  }
  while (++index < length) {
    data = matchData[index];
    var key = data[0],
        objValue = object[key],
        srcValue = data[1];

    if (noCustomizer && data[2]) {
      if (objValue === undefined && !(key in object)) {
        return false;
      }
    } else {
      var stack = new Stack$2();
      if (customizer) {
        var result = customizer(objValue, srcValue, key, object, source, stack);
      }
      if (!(result === undefined ? baseIsEqual$2(srcValue, objValue, COMPARE_PARTIAL_FLAG$2$2 | COMPARE_UNORDERED_FLAG$2$2, customizer, stack) : result)) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` if suitable for strict
 *  equality comparisons, else `false`.
 */
function isStrictComparable$2(value) {
  return value === value && !isObject$2(value);
}

/**
 * Gets the property names, values, and compare flags of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the match data of `object`.
 */
function getMatchData$2(object) {
  var result = keys$3(object),
      length = result.length;

  while (length--) {
    var key = result[length],
        value = object[key];

    result[length] = [key, value, isStrictComparable$2(value)];
  }
  return result;
}

/**
 * A specialized version of `matchesProperty` for source values suitable
 * for strict equality comparisons, i.e. `===`.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @param {*} srcValue The value to match.
 * @returns {Function} Returns the new spec function.
 */
function matchesStrictComparable$2(key, srcValue) {
  return function (object) {
    if (object == null) {
      return false;
    }
    return object[key] === srcValue && (srcValue !== undefined || key in Object(object));
  };
}

/**
 * The base implementation of `_.matches` which doesn't clone `source`.
 *
 * @private
 * @param {Object} source The object of property values to match.
 * @returns {Function} Returns the new spec function.
 */
function baseMatches$2(source) {
  var matchData = getMatchData$2(source);
  if (matchData.length == 1 && matchData[0][2]) {
    return matchesStrictComparable$2(matchData[0][0], matchData[0][1]);
  }
  return function (object) {
    return object === source || baseIsMatch$2(object, source, matchData);
  };
}

/** `Object#toString` result references. */
var symbolTag$3$2 = '[object Symbol]';

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol$2(value) {
  return (typeof value === 'undefined' ? 'undefined' : _typeof$1(value)) == 'symbol' || isObjectLike$2(value) && baseGetTag$2(value) == symbolTag$3$2;
}

/** Used to match property names within property paths. */
var reIsDeepProp$2 = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/;
var reIsPlainProp$2 = /^\w*$/;

/**
 * Checks if `value` is a property name and not a property path.
 *
 * @private
 * @param {*} value The value to check.
 * @param {Object} [object] The object to query keys on.
 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
 */
function isKey$2(value, object) {
  if (isArray$2(value)) {
    return false;
  }
  var type = typeof value === 'undefined' ? 'undefined' : _typeof$1(value);
  if (type == 'number' || type == 'symbol' || type == 'boolean' || value == null || isSymbol$2(value)) {
    return true;
  }
  return reIsPlainProp$2.test(value) || !reIsDeepProp$2.test(value) || object != null && value in Object(object);
}

/** Error message constants. */
var FUNC_ERROR_TEXT$2 = 'Expected a function';

/**
 * Creates a function that memoizes the result of `func`. If `resolver` is
 * provided, it determines the cache key for storing the result based on the
 * arguments provided to the memoized function. By default, the first argument
 * provided to the memoized function is used as the map cache key. The `func`
 * is invoked with the `this` binding of the memoized function.
 *
 * **Note:** The cache is exposed as the `cache` property on the memoized
 * function. Its creation may be customized by replacing the `_.memoize.Cache`
 * constructor with one whose instances implement the
 * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
 * method interface of `clear`, `delete`, `get`, `has`, and `set`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to have its output memoized.
 * @param {Function} [resolver] The function to resolve the cache key.
 * @returns {Function} Returns the new memoized function.
 * @example
 *
 * var object = { 'a': 1, 'b': 2 };
 * var other = { 'c': 3, 'd': 4 };
 *
 * var values = _.memoize(_.values);
 * values(object);
 * // => [1, 2]
 *
 * values(other);
 * // => [3, 4]
 *
 * object.a = 2;
 * values(object);
 * // => [1, 2]
 *
 * // Modify the result cache.
 * values.cache.set(object, ['a', 'b']);
 * values(object);
 * // => ['a', 'b']
 *
 * // Replace `_.memoize.Cache`.
 * _.memoize.Cache = WeakMap;
 */
function memoize$2(func, resolver) {
  if (typeof func != 'function' || resolver != null && typeof resolver != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT$2);
  }
  var memoized = function memoized() {
    var args = arguments,
        key = resolver ? resolver.apply(this, args) : args[0],
        cache = memoized.cache;

    if (cache.has(key)) {
      return cache.get(key);
    }
    var result = func.apply(this, args);
    memoized.cache = cache.set(key, result) || cache;
    return result;
  };
  memoized.cache = new (memoize$2.Cache || MapCache$2)();
  return memoized;
}

// Expose `MapCache`.
memoize$2.Cache = MapCache$2;

/** Used as the maximum memoize cache size. */
var MAX_MEMOIZE_SIZE$2 = 500;

/**
 * A specialized version of `_.memoize` which clears the memoized function's
 * cache when it exceeds `MAX_MEMOIZE_SIZE`.
 *
 * @private
 * @param {Function} func The function to have its output memoized.
 * @returns {Function} Returns the new memoized function.
 */
function memoizeCapped$2(func) {
  var result = memoize$2(func, function (key) {
    if (cache.size === MAX_MEMOIZE_SIZE$2) {
      cache.clear();
    }
    return key;
  });

  var cache = result.cache;
  return result;
}

/** Used to match property names within property paths. */
var reLeadingDot$2 = /^\./;
var rePropName$2 = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

/** Used to match backslashes in property paths. */
var reEscapeChar$2 = /\\(\\)?/g;

/**
 * Converts `string` to a property path array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the property path array.
 */
var stringToPath$2 = memoizeCapped$2(function (string) {
  var result = [];
  if (reLeadingDot$2.test(string)) {
    result.push('');
  }
  string.replace(rePropName$2, function (match, number, quote, string) {
    result.push(quote ? string.replace(reEscapeChar$2, '$1') : number || match);
  });
  return result;
});

/**
 * A specialized version of `_.map` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function arrayMap$2(array, iteratee) {
  var index = -1,
      length = array == null ? 0 : array.length,
      result = Array(length);

  while (++index < length) {
    result[index] = iteratee(array[index], index, array);
  }
  return result;
}

/** Used as references for various `Number` constants. */
var INFINITY$2$1 = 1 / 0;

/** Used to convert symbols to primitives and strings. */
var symbolProto$3 = _Symbol$2 ? _Symbol$2.prototype : undefined;
var symbolToString$2 = symbolProto$3 ? symbolProto$3.toString : undefined;

/**
 * The base implementation of `_.toString` which doesn't convert nullish
 * values to empty strings.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString$2(value) {
  // Exit early for strings to avoid a performance hit in some environments.
  if (typeof value == 'string') {
    return value;
  }
  if (isArray$2(value)) {
    // Recursively convert values (susceptible to call stack limits).
    return arrayMap$2(value, baseToString$2) + '';
  }
  if (isSymbol$2(value)) {
    return symbolToString$2 ? symbolToString$2.call(value) : '';
  }
  var result = value + '';
  return result == '0' && 1 / value == -INFINITY$2$1 ? '-0' : result;
}

/**
 * Converts `value` to a string. An empty string is returned for `null`
 * and `undefined` values. The sign of `-0` is preserved.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 * @example
 *
 * _.toString(null);
 * // => ''
 *
 * _.toString(-0);
 * // => '-0'
 *
 * _.toString([1, 2, 3]);
 * // => '1,2,3'
 */
function toString$2(value) {
  return value == null ? '' : baseToString$2(value);
}

/**
 * Casts `value` to a path array if it's not one.
 *
 * @private
 * @param {*} value The value to inspect.
 * @param {Object} [object] The object to query keys on.
 * @returns {Array} Returns the cast property path array.
 */
function castPath$2(value, object) {
  if (isArray$2(value)) {
    return value;
  }
  return isKey$2(value, object) ? [value] : stringToPath$2(toString$2(value));
}

/** Used as references for various `Number` constants. */
var INFINITY$3$1 = 1 / 0;

/**
 * Converts `value` to a string key if it's not a string or symbol.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {string|symbol} Returns the key.
 */
function toKey$2(value) {
  if (typeof value == 'string' || isSymbol$2(value)) {
    return value;
  }
  var result = value + '';
  return result == '0' && 1 / value == -INFINITY$3$1 ? '-0' : result;
}

/**
 * The base implementation of `_.get` without support for default values.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to get.
 * @returns {*} Returns the resolved value.
 */
function baseGet$2(object, path) {
  path = castPath$2(path, object);

  var index = 0,
      length = path.length;

  while (object != null && index < length) {
    object = object[toKey$2(path[index++])];
  }
  return index && index == length ? object : undefined;
}

/**
 * Gets the value at `path` of `object`. If the resolved value is
 * `undefined`, the `defaultValue` is returned in its place.
 *
 * @static
 * @memberOf _
 * @since 3.7.0
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to get.
 * @param {*} [defaultValue] The value returned for `undefined` resolved values.
 * @returns {*} Returns the resolved value.
 * @example
 *
 * var object = { 'a': [{ 'b': { 'c': 3 } }] };
 *
 * _.get(object, 'a[0].b.c');
 * // => 3
 *
 * _.get(object, ['a', '0', 'b', 'c']);
 * // => 3
 *
 * _.get(object, 'a.b.c', 'default');
 * // => 'default'
 */
function get$4(object, path, defaultValue) {
  var result = object == null ? undefined : baseGet$2(object, path);
  return result === undefined ? defaultValue : result;
}

/**
 * The base implementation of `_.hasIn` without support for deep paths.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {Array|string} key The key to check.
 * @returns {boolean} Returns `true` if `key` exists, else `false`.
 */
function baseHasIn$2(object, key) {
  return object != null && key in Object(object);
}

/**
 * Checks if `path` exists on `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} path The path to check.
 * @param {Function} hasFunc The function to check properties.
 * @returns {boolean} Returns `true` if `path` exists, else `false`.
 */
function hasPath$2(object, path, hasFunc) {
  path = castPath$2(path, object);

  var index = -1,
      length = path.length,
      result = false;

  while (++index < length) {
    var key = toKey$2(path[index]);
    if (!(result = object != null && hasFunc(object, key))) {
      break;
    }
    object = object[key];
  }
  if (result || ++index != length) {
    return result;
  }
  length = object == null ? 0 : object.length;
  return !!length && isLength$2(length) && isIndex$2(key, length) && (isArray$2(object) || isArguments$2(object));
}

/**
 * Checks if `path` is a direct or inherited property of `object`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path to check.
 * @returns {boolean} Returns `true` if `path` exists, else `false`.
 * @example
 *
 * var object = _.create({ 'a': _.create({ 'b': 2 }) });
 *
 * _.hasIn(object, 'a');
 * // => true
 *
 * _.hasIn(object, 'a.b');
 * // => true
 *
 * _.hasIn(object, ['a', 'b']);
 * // => true
 *
 * _.hasIn(object, 'b');
 * // => false
 */
function hasIn$2(object, path) {
  return object != null && hasPath$2(object, path, baseHasIn$2);
}

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG$7 = 1;
var COMPARE_UNORDERED_FLAG$5 = 2;

/**
 * The base implementation of `_.matchesProperty` which doesn't clone `srcValue`.
 *
 * @private
 * @param {string} path The path of the property to get.
 * @param {*} srcValue The value to match.
 * @returns {Function} Returns the new spec function.
 */
function baseMatchesProperty$2(path, srcValue) {
  if (isKey$2(path) && isStrictComparable$2(srcValue)) {
    return matchesStrictComparable$2(toKey$2(path), srcValue);
  }
  return function (object) {
    var objValue = get$4(object, path);
    return objValue === undefined && objValue === srcValue ? hasIn$2(object, path) : baseIsEqual$2(srcValue, objValue, COMPARE_PARTIAL_FLAG$7 | COMPARE_UNORDERED_FLAG$5);
  };
}

/**
 * This method returns the first argument it receives.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Util
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'a': 1 };
 *
 * console.log(_.identity(object) === object);
 * // => true
 */
function identity$10(value) {
  return value;
}

/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new accessor function.
 */
function baseProperty$2(key) {
  return function (object) {
    return object == null ? undefined : object[key];
  };
}

/**
 * A specialized version of `baseProperty` which supports deep paths.
 *
 * @private
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new accessor function.
 */
function basePropertyDeep$2(path) {
  return function (object) {
    return baseGet$2(object, path);
  };
}

/**
 * Creates a function that returns the value at `path` of a given object.
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Util
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new accessor function.
 * @example
 *
 * var objects = [
 *   { 'a': { 'b': 2 } },
 *   { 'a': { 'b': 1 } }
 * ];
 *
 * _.map(objects, _.property('a.b'));
 * // => [2, 1]
 *
 * _.map(_.sortBy(objects, _.property(['a', 'b'])), 'a.b');
 * // => [1, 2]
 */
function property$2(path) {
  return isKey$2(path) ? baseProperty$2(toKey$2(path)) : basePropertyDeep$2(path);
}

/**
 * The base implementation of `_.iteratee`.
 *
 * @private
 * @param {*} [value=_.identity] The value to convert to an iteratee.
 * @returns {Function} Returns the iteratee.
 */
function baseIteratee$2(value) {
  // Don't store the `typeof` result in a variable to avoid a JIT bug in Safari 9.
  // See https://bugs.webkit.org/show_bug.cgi?id=156034 for more details.
  if (typeof value == 'function') {
    return value;
  }
  if (value == null) {
    return identity$10;
  }
  if ((typeof value === 'undefined' ? 'undefined' : _typeof$1(value)) == 'object') {
    return isArray$2(value) ? baseMatchesProperty$2(value[0], value[1]) : baseMatches$2(value);
  }
  return property$2(value);
}

/**
 * Creates a `_.find` or `_.findLast` function.
 *
 * @private
 * @param {Function} findIndexFunc The function to find the collection index.
 * @returns {Function} Returns the new find function.
 */
function createFind$1(findIndexFunc) {
  return function (collection, predicate, fromIndex) {
    var iterable = Object(collection);
    if (!isArrayLike$2(collection)) {
      var iteratee = baseIteratee$2(predicate, 3);
      collection = keys$3(collection);
      predicate = function predicate(key) {
        return iteratee(iterable[key], key, iterable);
      };
    }
    var index = findIndexFunc(collection, predicate, fromIndex);
    return index > -1 ? iterable[iteratee ? collection[index] : index] : undefined;
  };
}

/**
 * The base implementation of `_.findIndex` and `_.findLastIndex` without
 * support for iteratee shorthands.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Function} predicate The function invoked per iteration.
 * @param {number} fromIndex The index to search from.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseFindIndex$1(array, predicate, fromIndex, fromRight) {
  var length = array.length,
      index = fromIndex + (fromRight ? 1 : -1);

  while (fromRight ? index-- : ++index < length) {
    if (predicate(array[index], index, array)) {
      return index;
    }
  }
  return -1;
}

/** Used as references for various `Number` constants. */
var NAN$1 = 0 / 0;

/** Used to match leading and trailing whitespace. */
var reTrim$1 = /^\s+|\s+$/g;

/** Used to detect bad signed hexadecimal string values. */
var reIsBadHex$1 = /^[-+]0x[0-9a-f]+$/i;

/** Used to detect binary string values. */
var reIsBinary$1 = /^0b[01]+$/i;

/** Used to detect octal string values. */
var reIsOctal$1 = /^0o[0-7]+$/i;

/** Built-in method references without a dependency on `root`. */
var freeParseInt$1 = parseInt;

/**
 * Converts `value` to a number.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {number} Returns the number.
 * @example
 *
 * _.toNumber(3.2);
 * // => 3.2
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3.2');
 * // => 3.2
 */
function toNumber$1(value) {
  if (typeof value == 'number') {
    return value;
  }
  if (isSymbol$2(value)) {
    return NAN$1;
  }
  if (isObject$2(value)) {
    var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
    value = isObject$2(other) ? other + '' : other;
  }
  if (typeof value != 'string') {
    return value === 0 ? value : +value;
  }
  value = value.replace(reTrim$1, '');
  var isBinary = reIsBinary$1.test(value);
  return isBinary || reIsOctal$1.test(value) ? freeParseInt$1(value.slice(2), isBinary ? 2 : 8) : reIsBadHex$1.test(value) ? NAN$1 : +value;
}

/** Used as references for various `Number` constants. */
var INFINITY$4 = 1 / 0;
var MAX_INTEGER$1 = 1.7976931348623157e+308;

/**
 * Converts `value` to a finite number.
 *
 * @static
 * @memberOf _
 * @since 4.12.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {number} Returns the converted number.
 * @example
 *
 * _.toFinite(3.2);
 * // => 3.2
 *
 * _.toFinite(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toFinite(Infinity);
 * // => 1.7976931348623157e+308
 *
 * _.toFinite('3.2');
 * // => 3.2
 */
function toFinite$1(value) {
  if (!value) {
    return value === 0 ? value : 0;
  }
  value = toNumber$1(value);
  if (value === INFINITY$4 || value === -INFINITY$4) {
    var sign = value < 0 ? -1 : 1;
    return sign * MAX_INTEGER$1;
  }
  return value === value ? value : 0;
}

/**
 * Converts `value` to an integer.
 *
 * **Note:** This method is loosely based on
 * [`ToInteger`](http://www.ecma-international.org/ecma-262/7.0/#sec-tointeger).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {number} Returns the converted integer.
 * @example
 *
 * _.toInteger(3.2);
 * // => 3
 *
 * _.toInteger(Number.MIN_VALUE);
 * // => 0
 *
 * _.toInteger(Infinity);
 * // => 1.7976931348623157e+308
 *
 * _.toInteger('3.2');
 * // => 3
 */
function toInteger$1(value) {
  var result = toFinite$1(value),
      remainder = result % 1;

  return result === result ? remainder ? result - remainder : result : 0;
}

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax$2 = Math.max;

/**
 * This method is like `_.find` except that it returns the index of the first
 * element `predicate` returns truthy for instead of the element itself.
 *
 * @static
 * @memberOf _
 * @since 1.1.0
 * @category Array
 * @param {Array} array The array to inspect.
 * @param {Function} [predicate=_.identity] The function invoked per iteration.
 * @param {number} [fromIndex=0] The index to search from.
 * @returns {number} Returns the index of the found element, else `-1`.
 * @example
 *
 * var users = [
 *   { 'user': 'barney',  'active': false },
 *   { 'user': 'fred',    'active': false },
 *   { 'user': 'pebbles', 'active': true }
 * ];
 *
 * _.findIndex(users, function(o) { return o.user == 'barney'; });
 * // => 0
 *
 * // The `_.matches` iteratee shorthand.
 * _.findIndex(users, { 'user': 'fred', 'active': false });
 * // => 1
 *
 * // The `_.matchesProperty` iteratee shorthand.
 * _.findIndex(users, ['active', false]);
 * // => 0
 *
 * // The `_.property` iteratee shorthand.
 * _.findIndex(users, 'active');
 * // => 2
 */
function findIndex$1(array, predicate, fromIndex) {
  var length = array == null ? 0 : array.length;
  if (!length) {
    return -1;
  }
  var index = fromIndex == null ? 0 : toInteger$1(fromIndex);
  if (index < 0) {
    index = nativeMax$2(length + index, 0);
  }
  return baseFindIndex$1(array, baseIteratee$2(predicate, 3), index);
}

/**
 * Iterates over elements of `collection`, returning the first element
 * `predicate` returns truthy for. The predicate is invoked with three
 * arguments: (value, index|key, collection).
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Collection
 * @param {Array|Object} collection The collection to inspect.
 * @param {Function} [predicate=_.identity] The function invoked per iteration.
 * @param {number} [fromIndex=0] The index to search from.
 * @returns {*} Returns the matched element, else `undefined`.
 * @example
 *
 * var users = [
 *   { 'user': 'barney',  'age': 36, 'active': true },
 *   { 'user': 'fred',    'age': 40, 'active': false },
 *   { 'user': 'pebbles', 'age': 1,  'active': true }
 * ];
 *
 * _.find(users, function(o) { return o.age < 40; });
 * // => object for 'barney'
 *
 * // The `_.matches` iteratee shorthand.
 * _.find(users, { 'age': 1, 'active': true });
 * // => object for 'pebbles'
 *
 * // The `_.matchesProperty` iteratee shorthand.
 * _.find(users, ['active', false]);
 * // => object for 'fred'
 *
 * // The `_.property` iteratee shorthand.
 * _.find(users, 'active');
 * // => object for 'barney'
 */
var find$1 = createFind$1(findIndex$1);

/**
 * A specialized version of `_.forEach` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
function arrayEach$2(array, iteratee) {
  var index = -1,
      length = array == null ? 0 : array.length;

  while (++index < length) {
    if (iteratee(array[index], index, array) === false) {
      break;
    }
  }
  return array;
}

var defineProperty$1$2 = function () {
  try {
    var func = getNative$2(Object, 'defineProperty');
    func({}, '', {});
    return func;
  } catch (e) {}
}();

/**
 * The base implementation of `assignValue` and `assignMergeValue` without
 * value checks.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function baseAssignValue$2(object, key, value) {
  if (key == '__proto__' && defineProperty$1$2) {
    defineProperty$1$2(object, key, {
      'configurable': true,
      'enumerable': true,
      'value': value,
      'writable': true
    });
  } else {
    object[key] = value;
  }
}

/** Used for built-in method references. */
var objectProto$14$2 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$11$2 = objectProto$14$2.hasOwnProperty;

/**
 * Assigns `value` to `key` of `object` if the existing value is not equivalent
 * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * for equality comparisons.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function assignValue$2(object, key, value) {
  var objValue = object[key];
  if (!(hasOwnProperty$11$2.call(object, key) && eq$2(objValue, value)) || value === undefined && !(key in object)) {
    baseAssignValue$2(object, key, value);
  }
}

/**
 * Copies properties of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy properties from.
 * @param {Array} props The property identifiers to copy.
 * @param {Object} [object={}] The object to copy properties to.
 * @param {Function} [customizer] The function to customize copied values.
 * @returns {Object} Returns `object`.
 */
function copyObject$2(source, props, object, customizer) {
  var isNew = !object;
  object || (object = {});

  var index = -1,
      length = props.length;

  while (++index < length) {
    var key = props[index];

    var newValue = customizer ? customizer(object[key], source[key], key, object, source) : undefined;

    if (newValue === undefined) {
      newValue = source[key];
    }
    if (isNew) {
      baseAssignValue$2(object, key, newValue);
    } else {
      assignValue$2(object, key, newValue);
    }
  }
  return object;
}

/**
 * The base implementation of `_.assign` without support for multiple sources
 * or `customizer` functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @returns {Object} Returns `object`.
 */
function baseAssign$2(object, source) {
  return object && copyObject$2(source, keys$3(source), object);
}

/**
 * This function is like
 * [`Object.keys`](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * except that it includes inherited enumerable properties.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function nativeKeysIn$2(object) {
  var result = [];
  if (object != null) {
    for (var key in Object(object)) {
      result.push(key);
    }
  }
  return result;
}

/** Used for built-in method references. */
var objectProto$15$2 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$12$2 = objectProto$15$2.hasOwnProperty;

/**
 * The base implementation of `_.keysIn` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeysIn$2(object) {
  if (!isObject$2(object)) {
    return nativeKeysIn$2(object);
  }
  var isProto = isPrototype$2(object),
      result = [];

  for (var key in object) {
    if (!(key == 'constructor' && (isProto || !hasOwnProperty$12$2.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}

/**
 * Creates an array of the own and inherited enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keysIn(new Foo);
 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
 */
function keysIn$1$2(object) {
  return isArrayLike$2(object) ? arrayLikeKeys$2(object, true) : baseKeysIn$2(object);
}

/**
 * The base implementation of `_.assignIn` without support for multiple sources
 * or `customizer` functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @returns {Object} Returns `object`.
 */
function baseAssignIn$2(object, source) {
  return object && copyObject$2(source, keysIn$1$2(source), object);
}

/** Detect free variable `exports`. */
var freeExports$4 = (typeof exports === 'undefined' ? 'undefined' : _typeof$1(exports)) == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule$4 = freeExports$4 && (typeof module === 'undefined' ? 'undefined' : _typeof$1(module)) == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports$4 = freeModule$4 && freeModule$4.exports === freeExports$4;

/** Built-in value references. */
var Buffer$3 = moduleExports$4 ? root$4.Buffer : undefined;
var allocUnsafe$2 = Buffer$3 ? Buffer$3.allocUnsafe : undefined;

/**
 * Creates a clone of  `buffer`.
 *
 * @private
 * @param {Buffer} buffer The buffer to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Buffer} Returns the cloned buffer.
 */
function cloneBuffer$2(buffer, isDeep) {
  if (isDeep) {
    return buffer.slice();
  }
  var length = buffer.length,
      result = allocUnsafe$2 ? allocUnsafe$2(length) : new buffer.constructor(length);

  buffer.copy(result);
  return result;
}

/**
 * Copies the values of `source` to `array`.
 *
 * @private
 * @param {Array} source The array to copy values from.
 * @param {Array} [array=[]] The array to copy values to.
 * @returns {Array} Returns `array`.
 */
function copyArray$2(source, array) {
  var index = -1,
      length = source.length;

  array || (array = Array(length));
  while (++index < length) {
    array[index] = source[index];
  }
  return array;
}

/**
 * Copies own symbols of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy symbols from.
 * @param {Object} [object={}] The object to copy symbols to.
 * @returns {Object} Returns `object`.
 */
function copySymbols$2(source, object) {
  return copyObject$2(source, getSymbols$2(source), object);
}

/** Built-in value references. */
var getPrototype$2 = overArg$2(Object.getPrototypeOf, Object);

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeGetSymbols$3 = Object.getOwnPropertySymbols;

/**
 * Creates an array of the own and inherited enumerable symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */
var getSymbolsIn$2 = !nativeGetSymbols$3 ? stubArray$2 : function (object) {
  var result = [];
  while (object) {
    arrayPush$2(result, getSymbols$2(object));
    object = getPrototype$2(object);
  }
  return result;
};

/**
 * Copies own and inherited symbols of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy symbols from.
 * @param {Object} [object={}] The object to copy symbols to.
 * @returns {Object} Returns `object`.
 */
function copySymbolsIn$2(source, object) {
  return copyObject$2(source, getSymbolsIn$2(source), object);
}

/**
 * Creates an array of own and inherited enumerable property names and
 * symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names and symbols.
 */
function getAllKeysIn$2(object) {
  return baseGetAllKeys$2(object, keysIn$1$2, getSymbolsIn$2);
}

/** Used for built-in method references. */
var objectProto$16$1 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$13$1 = objectProto$16$1.hasOwnProperty;

/**
 * Initializes an array clone.
 *
 * @private
 * @param {Array} array The array to clone.
 * @returns {Array} Returns the initialized clone.
 */
function initCloneArray$2(array) {
  var length = array.length,
      result = array.constructor(length);

  // Add properties assigned by `RegExp#exec`.
  if (length && typeof array[0] == 'string' && hasOwnProperty$13$1.call(array, 'index')) {
    result.index = array.index;
    result.input = array.input;
  }
  return result;
}

/**
 * Creates a clone of `arrayBuffer`.
 *
 * @private
 * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
 * @returns {ArrayBuffer} Returns the cloned array buffer.
 */
function cloneArrayBuffer$2(arrayBuffer) {
  var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
  new Uint8Array$2(result).set(new Uint8Array$2(arrayBuffer));
  return result;
}

/**
 * Creates a clone of `dataView`.
 *
 * @private
 * @param {Object} dataView The data view to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned data view.
 */
function cloneDataView$2(dataView, isDeep) {
  var buffer = isDeep ? cloneArrayBuffer$2(dataView.buffer) : dataView.buffer;
  return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
}

/**
 * Adds the key-value `pair` to `map`.
 *
 * @private
 * @param {Object} map The map to modify.
 * @param {Array} pair The key-value pair to add.
 * @returns {Object} Returns `map`.
 */
function addMapEntry$2(map, pair) {
  // Don't return `map.set` because it's not chainable in IE 11.
  map.set(pair[0], pair[1]);
  return map;
}

/**
 * A specialized version of `_.reduce` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {*} [accumulator] The initial value.
 * @param {boolean} [initAccum] Specify using the first element of `array` as
 *  the initial value.
 * @returns {*} Returns the accumulated value.
 */
function arrayReduce$2(array, iteratee, accumulator, initAccum) {
  var index = -1,
      length = array == null ? 0 : array.length;

  if (initAccum && length) {
    accumulator = array[++index];
  }
  while (++index < length) {
    accumulator = iteratee(accumulator, array[index], index, array);
  }
  return accumulator;
}

/** Used to compose bitmasks for cloning. */
var CLONE_DEEP_FLAG$4 = 1;

/**
 * Creates a clone of `map`.
 *
 * @private
 * @param {Object} map The map to clone.
 * @param {Function} cloneFunc The function to clone values.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned map.
 */
function cloneMap$2(map, isDeep, cloneFunc) {
  var array = isDeep ? cloneFunc(mapToArray$2(map), CLONE_DEEP_FLAG$4) : mapToArray$2(map);
  return arrayReduce$2(array, addMapEntry$2, new map.constructor());
}

/** Used to match `RegExp` flags from their coerced string values. */
var reFlags$2 = /\w*$/;

/**
 * Creates a clone of `regexp`.
 *
 * @private
 * @param {Object} regexp The regexp to clone.
 * @returns {Object} Returns the cloned regexp.
 */
function cloneRegExp$2(regexp) {
  var result = new regexp.constructor(regexp.source, reFlags$2.exec(regexp));
  result.lastIndex = regexp.lastIndex;
  return result;
}

/**
 * Adds `value` to `set`.
 *
 * @private
 * @param {Object} set The set to modify.
 * @param {*} value The value to add.
 * @returns {Object} Returns `set`.
 */
function addSetEntry$2(set, value) {
  // Don't return `set.add` because it's not chainable in IE 11.
  set.add(value);
  return set;
}

/** Used to compose bitmasks for cloning. */
var CLONE_DEEP_FLAG$5 = 1;

/**
 * Creates a clone of `set`.
 *
 * @private
 * @param {Object} set The set to clone.
 * @param {Function} cloneFunc The function to clone values.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned set.
 */
function cloneSet$2(set, isDeep, cloneFunc) {
  var array = isDeep ? cloneFunc(setToArray$2(set), CLONE_DEEP_FLAG$5) : setToArray$2(set);
  return arrayReduce$2(array, addSetEntry$2, new set.constructor());
}

/** Used to convert symbols to primitives and strings. */
var symbolProto$4 = _Symbol$2 ? _Symbol$2.prototype : undefined;
var symbolValueOf$3 = symbolProto$4 ? symbolProto$4.valueOf : undefined;

/**
 * Creates a clone of the `symbol` object.
 *
 * @private
 * @param {Object} symbol The symbol object to clone.
 * @returns {Object} Returns the cloned symbol object.
 */
function cloneSymbol$2(symbol) {
  return symbolValueOf$3 ? Object(symbolValueOf$3.call(symbol)) : {};
}

/**
 * Creates a clone of `typedArray`.
 *
 * @private
 * @param {Object} typedArray The typed array to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned typed array.
 */
function cloneTypedArray$2(typedArray, isDeep) {
  var buffer = isDeep ? cloneArrayBuffer$2(typedArray.buffer) : typedArray.buffer;
  return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
}

/** `Object#toString` result references. */
var boolTag$5 = '[object Boolean]';
var dateTag$5 = '[object Date]';
var mapTag$6 = '[object Map]';
var numberTag$5 = '[object Number]';
var regexpTag$5 = '[object RegExp]';
var setTag$6 = '[object Set]';
var stringTag$5 = '[object String]';
var symbolTag$5 = '[object Symbol]';

var arrayBufferTag$5 = '[object ArrayBuffer]';
var dataViewTag$6 = '[object DataView]';
var float32Tag$4 = '[object Float32Array]';
var float64Tag$4 = '[object Float64Array]';
var int8Tag$4 = '[object Int8Array]';
var int16Tag$4 = '[object Int16Array]';
var int32Tag$4 = '[object Int32Array]';
var uint8Tag$4 = '[object Uint8Array]';
var uint8ClampedTag$4 = '[object Uint8ClampedArray]';
var uint16Tag$4 = '[object Uint16Array]';
var uint32Tag$4 = '[object Uint32Array]';

/**
 * Initializes an object clone based on its `toStringTag`.
 *
 * **Note:** This function only supports cloning values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to clone.
 * @param {string} tag The `toStringTag` of the object to clone.
 * @param {Function} cloneFunc The function to clone values.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneByTag$2(object, tag, cloneFunc, isDeep) {
  var Ctor = object.constructor;
  switch (tag) {
    case arrayBufferTag$5:
      return cloneArrayBuffer$2(object);

    case boolTag$5:
    case dateTag$5:
      return new Ctor(+object);

    case dataViewTag$6:
      return cloneDataView$2(object, isDeep);

    case float32Tag$4:case float64Tag$4:
    case int8Tag$4:case int16Tag$4:case int32Tag$4:
    case uint8Tag$4:case uint8ClampedTag$4:case uint16Tag$4:case uint32Tag$4:
      return cloneTypedArray$2(object, isDeep);

    case mapTag$6:
      return cloneMap$2(object, isDeep, cloneFunc);

    case numberTag$5:
    case stringTag$5:
      return new Ctor(object);

    case regexpTag$5:
      return cloneRegExp$2(object);

    case setTag$6:
      return cloneSet$2(object, isDeep, cloneFunc);

    case symbolTag$5:
      return cloneSymbol$2(object);
  }
}

/** Built-in value references. */
var objectCreate$2 = Object.create;

/**
 * The base implementation of `_.create` without support for assigning
 * properties to the created object.
 *
 * @private
 * @param {Object} proto The object to inherit from.
 * @returns {Object} Returns the new object.
 */
var baseCreate$2 = function () {
  function object() {}
  return function (proto) {
    if (!isObject$2(proto)) {
      return {};
    }
    if (objectCreate$2) {
      return objectCreate$2(proto);
    }
    object.prototype = proto;
    var result = new object();
    object.prototype = undefined;
    return result;
  };
}();

/**
 * Initializes an object clone.
 *
 * @private
 * @param {Object} object The object to clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneObject$2(object) {
  return typeof object.constructor == 'function' && !isPrototype$2(object) ? baseCreate$2(getPrototype$2(object)) : {};
}

/** Used to compose bitmasks for cloning. */
var CLONE_DEEP_FLAG$3$2 = 1;
var CLONE_FLAT_FLAG$2 = 2;
var CLONE_SYMBOLS_FLAG$3 = 4;

/** `Object#toString` result references. */
var argsTag$5 = '[object Arguments]';
var arrayTag$4 = '[object Array]';
var boolTag$4 = '[object Boolean]';
var dateTag$4$1 = '[object Date]';
var errorTag$4 = '[object Error]';
var funcTag$4 = '[object Function]';
var genTag$3 = '[object GeneratorFunction]';
var mapTag$5 = '[object Map]';
var numberTag$4$2 = '[object Number]';
var objectTag$5 = '[object Object]';
var regexpTag$4 = '[object RegExp]';
var setTag$5 = '[object Set]';
var stringTag$4$2 = '[object String]';
var symbolTag$4 = '[object Symbol]';
var weakMapTag$4 = '[object WeakMap]';

var arrayBufferTag$4 = '[object ArrayBuffer]';
var dataViewTag$5 = '[object DataView]';
var float32Tag$3 = '[object Float32Array]';
var float64Tag$3 = '[object Float64Array]';
var int8Tag$3 = '[object Int8Array]';
var int16Tag$3 = '[object Int16Array]';
var int32Tag$3 = '[object Int32Array]';
var uint8Tag$3 = '[object Uint8Array]';
var uint8ClampedTag$3 = '[object Uint8ClampedArray]';
var uint16Tag$3 = '[object Uint16Array]';
var uint32Tag$3 = '[object Uint32Array]';

/** Used to identify `toStringTag` values supported by `_.clone`. */
var cloneableTags$2 = {};
cloneableTags$2[argsTag$5] = cloneableTags$2[arrayTag$4] = cloneableTags$2[arrayBufferTag$4] = cloneableTags$2[dataViewTag$5] = cloneableTags$2[boolTag$4] = cloneableTags$2[dateTag$4$1] = cloneableTags$2[float32Tag$3] = cloneableTags$2[float64Tag$3] = cloneableTags$2[int8Tag$3] = cloneableTags$2[int16Tag$3] = cloneableTags$2[int32Tag$3] = cloneableTags$2[mapTag$5] = cloneableTags$2[numberTag$4$2] = cloneableTags$2[objectTag$5] = cloneableTags$2[regexpTag$4] = cloneableTags$2[setTag$5] = cloneableTags$2[stringTag$4$2] = cloneableTags$2[symbolTag$4] = cloneableTags$2[uint8Tag$3] = cloneableTags$2[uint8ClampedTag$3] = cloneableTags$2[uint16Tag$3] = cloneableTags$2[uint32Tag$3] = true;
cloneableTags$2[errorTag$4] = cloneableTags$2[funcTag$4] = cloneableTags$2[weakMapTag$4] = false;

/**
 * The base implementation of `_.clone` and `_.cloneDeep` which tracks
 * traversed objects.
 *
 * @private
 * @param {*} value The value to clone.
 * @param {boolean} bitmask The bitmask flags.
 *  1 - Deep clone
 *  2 - Flatten inherited properties
 *  4 - Clone symbols
 * @param {Function} [customizer] The function to customize cloning.
 * @param {string} [key] The key of `value`.
 * @param {Object} [object] The parent object of `value`.
 * @param {Object} [stack] Tracks traversed objects and their clone counterparts.
 * @returns {*} Returns the cloned value.
 */
function baseClone$2(value, bitmask, customizer, key, object, stack) {
  var result,
      isDeep = bitmask & CLONE_DEEP_FLAG$3$2,
      isFlat = bitmask & CLONE_FLAT_FLAG$2,
      isFull = bitmask & CLONE_SYMBOLS_FLAG$3;

  if (customizer) {
    result = object ? customizer(value, key, object, stack) : customizer(value);
  }
  if (result !== undefined) {
    return result;
  }
  if (!isObject$2(value)) {
    return value;
  }
  var isArr = isArray$2(value);
  if (isArr) {
    result = initCloneArray$2(value);
    if (!isDeep) {
      return copyArray$2(value, result);
    }
  } else {
    var tag = getTag$3(value),
        isFunc = tag == funcTag$4 || tag == genTag$3;

    if (isBuffer$2(value)) {
      return cloneBuffer$2(value, isDeep);
    }
    if (tag == objectTag$5 || tag == argsTag$5 || isFunc && !object) {
      result = isFlat || isFunc ? {} : initCloneObject$2(value);
      if (!isDeep) {
        return isFlat ? copySymbolsIn$2(value, baseAssignIn$2(result, value)) : copySymbols$2(value, baseAssign$2(result, value));
      }
    } else {
      if (!cloneableTags$2[tag]) {
        return object ? value : {};
      }
      result = initCloneByTag$2(value, tag, baseClone$2, isDeep);
    }
  }
  // Check for circular references and return its corresponding clone.
  stack || (stack = new Stack$2());
  var stacked = stack.get(value);
  if (stacked) {
    return stacked;
  }
  stack.set(value, result);

  var keysFunc = isFull ? isFlat ? getAllKeysIn$2 : getAllKeys$2 : isFlat ? keysIn : keys$3;

  var props = isArr ? undefined : keysFunc(value);
  arrayEach$2(props || value, function (subValue, key) {
    if (props) {
      key = subValue;
      subValue = value[key];
    }
    // Recursively populate clone (susceptible to call stack limits).
    assignValue$2(result, key, baseClone$2(subValue, bitmask, customizer, key, value, stack));
  });
  return result;
}

/** Used to compose bitmasks for cloning. */
var CLONE_DEEP_FLAG$2$2 = 1;
var CLONE_SYMBOLS_FLAG$2 = 4;

/**
 * This method is like `_.clone` except that it recursively clones `value`.
 *
 * @static
 * @memberOf _
 * @since 1.0.0
 * @category Lang
 * @param {*} value The value to recursively clone.
 * @returns {*} Returns the deep cloned value.
 * @see _.clone
 * @example
 *
 * var objects = [{ 'a': 1 }, { 'b': 2 }];
 *
 * var deep = _.cloneDeep(objects);
 * console.log(deep[0] === objects[0]);
 * // => false
 */
function cloneDeep$2(value) {
  return baseClone$2(value, CLONE_DEEP_FLAG$2$2 | CLONE_SYMBOLS_FLAG$2);
}

var type = "FeatureCollection";
var features = [{ "type": "Feature", "id": "01", "properties": { "name": "Alabama" }, "geometry": { "type": "Polygon", "coordinates": [[[-87.359296, 35.00118], [-85.606675, 34.984749], [-85.431413, 34.124869], [-85.184951, 32.859696], [-85.069935, 32.580372], [-84.960397, 32.421541], [-85.004212, 32.322956], [-84.889196, 32.262709], [-85.058981, 32.13674], [-85.053504, 32.01077], [-85.141136, 31.840985], [-85.042551, 31.539753], [-85.113751, 31.27686], [-85.004212, 31.003013], [-85.497137, 30.997536], [-87.600282, 30.997536], [-87.633143, 30.86609], [-87.408589, 30.674397], [-87.446927, 30.510088], [-87.37025, 30.427934], [-87.518128, 30.280057], [-87.655051, 30.247195], [-87.90699, 30.411504], [-87.934375, 30.657966], [-88.011052, 30.685351], [-88.10416, 30.499135], [-88.137022, 30.318396], [-88.394438, 30.367688], [-88.471115, 31.895754], [-88.241084, 33.796253], [-88.098683, 34.891641], [-88.202745, 34.995703], [-87.359296, 35.00118]]] } }, { "type": "Feature", "id": "02", "properties": { "name": "Alaska" }, "geometry": { "type": "MultiPolygon", "coordinates": [[[[-131.602021, 55.117982], [-131.569159, 55.28229], [-131.355558, 55.183705], [-131.38842, 55.01392], [-131.645836, 55.035827], [-131.602021, 55.117982]]], [[[-131.832052, 55.42469], [-131.645836, 55.304197], [-131.749898, 55.128935], [-131.832052, 55.189182], [-131.832052, 55.42469]]], [[[-132.976733, 56.437924], [-132.735747, 56.459832], [-132.631685, 56.421493], [-132.664547, 56.273616], [-132.878148, 56.240754], [-133.069841, 56.333862], [-132.976733, 56.437924]]], [[[-133.595627, 56.350293], [-133.162949, 56.317431], [-133.05341, 56.125739], [-132.620732, 55.912138], [-132.472854, 55.780691], [-132.4619, 55.671152], [-132.357838, 55.649245], [-132.341408, 55.506844], [-132.166146, 55.364444], [-132.144238, 55.238474], [-132.029222, 55.276813], [-131.97993, 55.178228], [-131.958022, 54.789365], [-132.029222, 54.701734], [-132.308546, 54.718165], [-132.385223, 54.915335], [-132.483808, 54.898904], [-132.686455, 55.046781], [-132.746701, 54.997489], [-132.916486, 55.046781], [-132.889102, 54.898904], [-132.73027, 54.937242], [-132.626209, 54.882473], [-132.675501, 54.679826], [-132.867194, 54.701734], [-133.157472, 54.95915], [-133.239626, 55.090597], [-133.223195, 55.22752], [-133.453227, 55.216566], [-133.453227, 55.320628], [-133.277964, 55.331582], [-133.102702, 55.42469], [-133.17938, 55.588998], [-133.387503, 55.62186], [-133.420365, 55.884753], [-133.497042, 56.0162], [-133.639442, 55.923092], [-133.694212, 56.070969], [-133.546335, 56.142169], [-133.666827, 56.311955], [-133.595627, 56.350293]]], [[[-133.738027, 55.556137], [-133.546335, 55.490413], [-133.414888, 55.572568], [-133.283441, 55.534229], [-133.420365, 55.386352], [-133.633966, 55.430167], [-133.738027, 55.556137]]], [[[-133.907813, 56.930849], [-134.050213, 57.029434], [-133.885905, 57.095157], [-133.343688, 57.002049], [-133.102702, 57.007526], [-132.932917, 56.82131], [-132.620732, 56.667956], [-132.653593, 56.55294], [-132.817901, 56.492694], [-133.042456, 56.520078], [-133.201287, 56.448878], [-133.420365, 56.492694], [-133.66135, 56.448878], [-133.710643, 56.684386], [-133.688735, 56.837741], [-133.869474, 56.843218], [-133.907813, 56.930849]]], [[[-134.115936, 56.48174], [-134.25286, 56.558417], [-134.400737, 56.722725], [-134.417168, 56.848695], [-134.296675, 56.908941], [-134.170706, 56.848695], [-134.143321, 56.952757], [-133.748981, 56.772017], [-133.710643, 56.596755], [-133.847566, 56.574848], [-133.935197, 56.377678], [-133.836612, 56.322908], [-133.957105, 56.092877], [-134.110459, 56.142169], [-134.132367, 55.999769], [-134.230952, 56.070969], [-134.291198, 56.350293], [-134.115936, 56.48174]]], [[[-134.636246, 56.28457], [-134.669107, 56.169554], [-134.806031, 56.235277], [-135.178463, 56.67891], [-135.413971, 56.810356], [-135.331817, 56.914418], [-135.424925, 57.166357], [-135.687818, 57.369004], [-135.419448, 57.566174], [-135.298955, 57.48402], [-135.063447, 57.418296], [-134.849846, 57.407343], [-134.844369, 57.248511], [-134.636246, 56.728202], [-134.636246, 56.28457]]], [[[-134.712923, 58.223407], [-134.373353, 58.14673], [-134.176183, 58.157683], [-134.187137, 58.081006], [-133.902336, 57.807159], [-134.099505, 57.850975], [-134.148798, 57.757867], [-133.935197, 57.615466], [-133.869474, 57.363527], [-134.083075, 57.297804], [-134.154275, 57.210173], [-134.499322, 57.029434], [-134.603384, 57.034911], [-134.6472, 57.226604], [-134.575999, 57.341619], [-134.608861, 57.511404], [-134.729354, 57.719528], [-134.707446, 57.829067], [-134.784123, 58.097437], [-134.91557, 58.212453], [-134.953908, 58.409623], [-134.712923, 58.223407]]], [[[-135.857603, 57.330665], [-135.715203, 57.330665], [-135.567326, 57.149926], [-135.633049, 57.023957], [-135.857603, 56.996572], [-135.824742, 57.193742], [-135.857603, 57.330665]]], [[[-136.279328, 58.206976], [-135.978096, 58.201499], [-135.780926, 58.28913], [-135.496125, 58.168637], [-135.64948, 58.037191], [-135.59471, 57.987898], [-135.45231, 58.135776], [-135.107263, 58.086483], [-134.91557, 57.976944], [-135.025108, 57.779775], [-134.937477, 57.763344], [-134.822462, 57.500451], [-135.085355, 57.462112], [-135.572802, 57.675713], [-135.556372, 57.456635], [-135.709726, 57.369004], [-135.890465, 57.407343], [-136.000004, 57.544266], [-136.208128, 57.637374], [-136.366959, 57.829067], [-136.569606, 57.916698], [-136.558652, 58.075529], [-136.421728, 58.130299], [-136.377913, 58.267222], [-136.279328, 58.206976]]], [[[-147.079854, 60.200582], [-147.501579, 59.948643], [-147.53444, 59.850058], [-147.874011, 59.784335], [-147.80281, 59.937689], [-147.435855, 60.09652], [-147.205824, 60.271782], [-147.079854, 60.200582]]], [[[-147.561825, 60.578491], [-147.616594, 60.370367], [-147.758995, 60.156767], [-147.956165, 60.227967], [-147.791856, 60.474429], [-147.561825, 60.578491]]], [[[-147.786379, 70.245291], [-147.682318, 70.201475], [-147.162008, 70.15766], [-146.888161, 70.185044], [-146.510252, 70.185044], [-146.099482, 70.146706], [-145.858496, 70.168614], [-145.622988, 70.08646], [-145.195787, 69.993352], [-144.620708, 69.971444], [-144.461877, 70.026213], [-144.078491, 70.059075], [-143.914183, 70.130275], [-143.497935, 70.141229], [-143.503412, 70.091936], [-143.25695, 70.119321], [-142.747594, 70.042644], [-142.402547, 69.916674], [-142.079408, 69.856428], [-142.008207, 69.801659], [-141.712453, 69.790705], [-141.433129, 69.697597], [-141.378359, 69.63735], [-141.208574, 69.686643], [-141.00045, 69.648304], [-141.00045, 60.304644], [-140.53491, 60.22249], [-140.474664, 60.310121], [-139.987216, 60.184151], [-139.696939, 60.342983], [-139.088998, 60.359413], [-139.198537, 60.091043], [-139.045183, 59.997935], [-138.700135, 59.910304], [-138.623458, 59.767904], [-137.604747, 59.242118], [-137.445916, 58.908024], [-137.265177, 59.001132], [-136.827022, 59.159963], [-136.580559, 59.16544], [-136.465544, 59.285933], [-136.476498, 59.466672], [-136.301236, 59.466672], [-136.25742, 59.625503], [-135.945234, 59.663842], [-135.479694, 59.800766], [-135.025108, 59.565257], [-135.068924, 59.422857], [-134.959385, 59.280456], [-134.701969, 59.247595], [-134.378829, 59.033994], [-134.400737, 58.973748], [-134.25286, 58.858732], [-133.842089, 58.727285], [-133.173903, 58.152206], [-133.075318, 57.998852], [-132.867194, 57.845498], [-132.560485, 57.505928], [-132.253777, 57.21565], [-132.368792, 57.095157], [-132.05113, 57.051341], [-132.127807, 56.876079], [-131.870391, 56.804879], [-131.837529, 56.602232], [-131.580113, 56.613186], [-131.087188, 56.405062], [-130.78048, 56.366724], [-130.621648, 56.268139], [-130.468294, 56.240754], [-130.424478, 56.142169], [-130.101339, 56.114785], [-130.002754, 55.994292], [-130.150631, 55.769737], [-130.128724, 55.583521], [-129.986323, 55.276813], [-130.095862, 55.200136], [-130.336847, 54.920812], [-130.687372, 54.718165], [-130.785957, 54.822227], [-130.917403, 54.789365], [-131.010511, 54.997489], [-130.983126, 55.08512], [-131.092665, 55.189182], [-130.862634, 55.298721], [-130.928357, 55.337059], [-131.158389, 55.200136], [-131.284358, 55.287767], [-131.426759, 55.238474], [-131.843006, 55.457552], [-131.700606, 55.698537], [-131.963499, 55.616383], [-131.974453, 55.49589], [-132.182576, 55.588998], [-132.226392, 55.704014], [-132.083991, 55.829984], [-132.127807, 55.955953], [-132.324977, 55.851892], [-132.522147, 56.076446], [-132.642639, 56.032631], [-132.719317, 56.218847], [-132.527624, 56.339339], [-132.341408, 56.339339], [-132.396177, 56.487217], [-132.297592, 56.67891], [-132.450946, 56.673433], [-132.768609, 56.837741], [-132.993164, 57.034911], [-133.51895, 57.177311], [-133.507996, 57.577128], [-133.677781, 57.62642], [-133.639442, 57.790728], [-133.814705, 57.834544], [-134.072121, 58.053622], [-134.143321, 58.168637], [-134.586953, 58.206976], [-135.074401, 58.502731], [-135.282525, 59.192825], [-135.38111, 59.033994], [-135.337294, 58.891593], [-135.140124, 58.617746], [-135.189417, 58.573931], [-135.05797, 58.349376], [-135.085355, 58.201499], [-135.277048, 58.234361], [-135.430402, 58.398669], [-135.633049, 58.426053], [-135.91785, 58.382238], [-135.912373, 58.617746], [-136.087635, 58.814916], [-136.246466, 58.75467], [-136.876314, 58.962794], [-136.931084, 58.902547], [-136.586036, 58.836824], [-136.317666, 58.672516], [-136.213604, 58.667039], [-136.180743, 58.535592], [-136.043819, 58.382238], [-136.388867, 58.294607], [-136.591513, 58.349376], [-136.59699, 58.212453], [-136.859883, 58.316515], [-136.947514, 58.393192], [-137.111823, 58.393192], [-137.566409, 58.590362], [-137.900502, 58.765624], [-137.933364, 58.869686], [-138.11958, 59.02304], [-138.634412, 59.132579], [-138.919213, 59.247595], [-139.417615, 59.379041], [-139.746231, 59.505011], [-139.718846, 59.641934], [-139.625738, 59.598119], [-139.5162, 59.68575], [-139.625738, 59.88292], [-139.488815, 59.992458], [-139.554538, 60.041751], [-139.801, 59.833627], [-140.315833, 59.696704], [-140.92925, 59.745996], [-141.444083, 59.871966], [-141.46599, 59.970551], [-141.706976, 59.948643], [-141.964392, 60.019843], [-142.539471, 60.085566], [-142.873564, 60.091043], [-143.623905, 60.036274], [-143.892275, 59.997935], [-144.231845, 60.140336], [-144.65357, 60.206059], [-144.785016, 60.29369], [-144.834309, 60.441568], [-145.124586, 60.430614], [-145.223171, 60.299167], [-145.738004, 60.474429], [-145.820158, 60.551106], [-146.351421, 60.408706], [-146.608837, 60.238921], [-146.718376, 60.397752], [-146.608837, 60.485383], [-146.455483, 60.463475], [-145.951604, 60.578491], [-146.017328, 60.666122], [-146.252836, 60.622307], [-146.345944, 60.737322], [-146.565022, 60.753753], [-146.784099, 61.044031], [-146.866253, 60.972831], [-147.172962, 60.934492], [-147.271547, 60.972831], [-147.375609, 60.879723], [-147.758995, 60.912584], [-147.775426, 60.808523], [-148.032842, 60.781138], [-148.153334, 60.819476], [-148.065703, 61.005692], [-148.175242, 61.000215], [-148.350504, 60.803046], [-148.109519, 60.737322], [-148.087611, 60.594922], [-147.939734, 60.441568], [-148.027365, 60.277259], [-148.219058, 60.332029], [-148.273827, 60.249875], [-148.087611, 60.217013], [-147.983549, 59.997935], [-148.251919, 59.95412], [-148.399797, 59.997935], [-148.635305, 59.937689], [-148.755798, 59.986981], [-149.067984, 59.981505], [-149.05703, 60.063659], [-149.204907, 60.008889], [-149.287061, 59.904827], [-149.418508, 59.997935], [-149.582816, 59.866489], [-149.511616, 59.806242], [-149.741647, 59.729565], [-149.949771, 59.718611], [-150.031925, 59.61455], [-150.25648, 59.521442], [-150.409834, 59.554303], [-150.579619, 59.444764], [-150.716543, 59.450241], [-151.001343, 59.225687], [-151.308052, 59.209256], [-151.406637, 59.280456], [-151.592853, 59.159963], [-151.976239, 59.253071], [-151.888608, 59.422857], [-151.636669, 59.483103], [-151.47236, 59.472149], [-151.423068, 59.537872], [-151.127313, 59.669319], [-151.116359, 59.778858], [-151.505222, 59.63098], [-151.828361, 59.718611], [-151.8667, 59.778858], [-151.702392, 60.030797], [-151.423068, 60.211536], [-151.379252, 60.359413], [-151.297098, 60.386798], [-151.264237, 60.545629], [-151.406637, 60.720892], [-151.06159, 60.786615], [-150.404357, 61.038554], [-150.245526, 60.939969], [-150.042879, 60.912584], [-149.741647, 61.016646], [-150.075741, 61.15357], [-150.207187, 61.257632], [-150.47008, 61.246678], [-150.656296, 61.29597], [-150.711066, 61.252155], [-151.023251, 61.180954], [-151.165652, 61.044031], [-151.477837, 61.011169], [-151.800977, 60.852338], [-151.833838, 60.748276], [-152.080301, 60.693507], [-152.13507, 60.578491], [-152.310332, 60.507291], [-152.392486, 60.304644], [-152.732057, 60.173197], [-152.567748, 60.069136], [-152.704672, 59.915781], [-153.022334, 59.888397], [-153.049719, 59.691227], [-153.345474, 59.620026], [-153.438582, 59.702181], [-153.586459, 59.548826], [-153.761721, 59.543349], [-153.72886, 59.433811], [-154.117723, 59.368087], [-154.1944, 59.066856], [-153.750768, 59.050425], [-153.400243, 58.968271], [-153.301658, 58.869686], [-153.444059, 58.710854], [-153.679567, 58.612269], [-153.898645, 58.606793], [-153.920553, 58.519161], [-154.062953, 58.4863], [-153.99723, 58.376761], [-154.145107, 58.212453], [-154.46277, 58.059098], [-154.643509, 58.059098], [-154.818771, 58.004329], [-154.988556, 58.015283], [-155.120003, 57.955037], [-155.081664, 57.872883], [-155.328126, 57.829067], [-155.377419, 57.708574], [-155.547204, 57.785251], [-155.73342, 57.549743], [-156.045606, 57.566174], [-156.023698, 57.440204], [-156.209914, 57.473066], [-156.34136, 57.418296], [-156.34136, 57.248511], [-156.549484, 56.985618], [-156.883577, 56.952757], [-157.157424, 56.832264], [-157.20124, 56.766541], [-157.376502, 56.859649], [-157.672257, 56.607709], [-157.754411, 56.67891], [-157.918719, 56.657002], [-157.957058, 56.514601], [-158.126843, 56.459832], [-158.32949, 56.48174], [-158.488321, 56.339339], [-158.208997, 56.295524], [-158.510229, 55.977861], [-159.375585, 55.873799], [-159.616571, 55.594475], [-159.676817, 55.654722], [-159.643955, 55.829984], [-159.813741, 55.857368], [-160.027341, 55.791645], [-160.060203, 55.720445], [-160.394296, 55.605429], [-160.536697, 55.473983], [-160.580512, 55.567091], [-160.668143, 55.457552], [-160.865313, 55.528752], [-161.232268, 55.358967], [-161.506115, 55.364444], [-161.467776, 55.49589], [-161.588269, 55.62186], [-161.697808, 55.517798], [-161.686854, 55.408259], [-162.053809, 55.074166], [-162.179779, 55.15632], [-162.218117, 55.03035], [-162.470057, 55.052258], [-162.508395, 55.249428], [-162.661749, 55.293244], [-162.716519, 55.222043], [-162.579595, 55.134412], [-162.645319, 54.997489], [-162.847965, 54.926289], [-163.00132, 55.079643], [-163.187536, 55.090597], [-163.220397, 55.03035], [-163.034181, 54.942719], [-163.373752, 54.800319], [-163.14372, 54.76198], [-163.138243, 54.696257], [-163.329936, 54.74555], [-163.587352, 54.614103], [-164.085754, 54.61958], [-164.332216, 54.531949], [-164.354124, 54.466226], [-164.638925, 54.389548], [-164.847049, 54.416933], [-164.918249, 54.603149], [-164.710125, 54.663395], [-164.551294, 54.88795], [-164.34317, 54.893427], [-163.894061, 55.041304], [-163.532583, 55.046781], [-163.39566, 54.904381], [-163.291598, 55.008443], [-163.313505, 55.128935], [-163.105382, 55.183705], [-162.880827, 55.183705], [-162.579595, 55.446598], [-162.245502, 55.682106], [-161.807347, 55.89023], [-161.292514, 55.983338], [-161.078914, 55.939523], [-160.87079, 55.999769], [-160.816021, 55.912138], [-160.931036, 55.813553], [-160.805067, 55.736876], [-160.766728, 55.857368], [-160.509312, 55.868322], [-160.438112, 55.791645], [-160.27928, 55.76426], [-160.273803, 55.857368], [-160.536697, 55.939523], [-160.558604, 55.994292], [-160.383342, 56.251708], [-160.147834, 56.399586], [-159.830171, 56.541986], [-159.326293, 56.667956], [-158.959338, 56.848695], [-158.784076, 56.782971], [-158.641675, 56.810356], [-158.701922, 56.925372], [-158.658106, 57.034911], [-158.378782, 57.264942], [-157.995396, 57.41282], [-157.688688, 57.609989], [-157.705118, 57.719528], [-157.458656, 58.497254], [-157.07527, 58.705377], [-157.119086, 58.869686], [-158.039212, 58.634177], [-158.32949, 58.661562], [-158.40069, 58.760147], [-158.564998, 58.803962], [-158.619768, 58.913501], [-158.767645, 58.864209], [-158.860753, 58.694424], [-158.701922, 58.480823], [-158.893615, 58.387715], [-159.0634, 58.420577], [-159.392016, 58.760147], [-159.616571, 58.929932], [-159.731586, 58.929932], [-159.808264, 58.803962], [-159.906848, 58.782055], [-160.054726, 58.886116], [-160.235465, 58.902547], [-160.317619, 59.072332], [-160.854359, 58.88064], [-161.33633, 58.743716], [-161.374669, 58.667039], [-161.752577, 58.552023], [-161.938793, 58.656085], [-161.769008, 58.776578], [-161.829255, 59.061379], [-161.955224, 59.36261], [-161.703285, 59.48858], [-161.911409, 59.740519], [-162.092148, 59.88292], [-162.234548, 60.091043], [-162.448149, 60.178674], [-162.502918, 59.997935], [-162.760334, 59.959597], [-163.171105, 59.844581], [-163.66403, 59.795289], [-163.9324, 59.806242], [-164.162431, 59.866489], [-164.189816, 60.02532], [-164.386986, 60.074613], [-164.699171, 60.29369], [-164.962064, 60.337506], [-165.268773, 60.578491], [-165.060649, 60.68803], [-165.016834, 60.890677], [-165.175665, 60.846861], [-165.197573, 60.972831], [-165.120896, 61.076893], [-165.323543, 61.170001], [-165.34545, 61.071416], [-165.591913, 61.109754], [-165.624774, 61.279539], [-165.816467, 61.301447], [-165.920529, 61.416463], [-165.915052, 61.558863], [-166.106745, 61.49314], [-166.139607, 61.630064], [-165.904098, 61.662925], [-166.095791, 61.81628], [-165.756221, 61.827233], [-165.756221, 62.013449], [-165.674067, 62.139419], [-165.044219, 62.539236], [-164.912772, 62.659728], [-164.819664, 62.637821], [-164.874433, 62.807606], [-164.633448, 63.097884], [-164.425324, 63.212899], [-164.036462, 63.262192], [-163.73523, 63.212899], [-163.313505, 63.037637], [-163.039658, 63.059545], [-162.661749, 63.22933], [-162.272887, 63.486746], [-162.075717, 63.514131], [-162.026424, 63.448408], [-161.555408, 63.448408], [-161.13916, 63.503177], [-160.766728, 63.771547], [-160.766728, 63.837271], [-160.952944, 64.08921], [-160.974852, 64.237087], [-161.26513, 64.395918], [-161.374669, 64.532842], [-161.078914, 64.494503], [-160.79959, 64.609519], [-160.783159, 64.719058], [-161.144637, 64.921705], [-161.413007, 64.762873], [-161.664946, 64.790258], [-161.900455, 64.702627], [-162.168825, 64.680719], [-162.234548, 64.620473], [-162.541257, 64.532842], [-162.634365, 64.384965], [-162.787719, 64.324718], [-162.858919, 64.49998], [-163.045135, 64.538319], [-163.176582, 64.401395], [-163.253259, 64.467119], [-163.598306, 64.565704], [-164.304832, 64.560227], [-164.80871, 64.450688], [-165.000403, 64.434257], [-165.411174, 64.49998], [-166.188899, 64.576658], [-166.391546, 64.636904], [-166.484654, 64.735489], [-166.413454, 64.872412], [-166.692778, 64.987428], [-166.638008, 65.113398], [-166.462746, 65.179121], [-166.517516, 65.337952], [-166.796839, 65.337952], [-167.026871, 65.381768], [-167.47598, 65.414629], [-167.711489, 65.496784], [-168.072967, 65.578938], [-168.105828, 65.682999], [-167.541703, 65.819923], [-166.829701, 66.049954], [-166.3313, 66.186878], [-166.046499, 66.110201], [-165.756221, 66.09377], [-165.690498, 66.203309], [-165.86576, 66.21974], [-165.88219, 66.312848], [-165.186619, 66.466202], [-164.403417, 66.581218], [-163.981692, 66.592172], [-163.751661, 66.553833], [-163.872153, 66.389525], [-163.828338, 66.274509], [-163.915969, 66.192355], [-163.768091, 66.060908], [-163.494244, 66.082816], [-163.149197, 66.060908], [-162.749381, 66.088293], [-162.634365, 66.039001], [-162.371472, 66.028047], [-162.14144, 66.077339], [-161.840208, 66.02257], [-161.549931, 66.241647], [-161.341807, 66.252601], [-161.199406, 66.208786], [-161.128206, 66.334755], [-161.528023, 66.395002], [-161.911409, 66.345709], [-161.87307, 66.510017], [-162.174302, 66.68528], [-162.502918, 66.740049], [-162.601503, 66.89888], [-162.344087, 66.937219], [-162.015471, 66.778388], [-162.075717, 66.652418], [-161.916886, 66.553833], [-161.571838, 66.438817], [-161.489684, 66.55931], [-161.884024, 66.718141], [-161.714239, 67.002942], [-161.851162, 67.052235], [-162.240025, 66.991988], [-162.639842, 67.008419], [-162.700088, 67.057712], [-162.902735, 67.008419], [-163.740707, 67.128912], [-163.757138, 67.254881], [-164.009077, 67.534205], [-164.211724, 67.638267], [-164.534863, 67.725898], [-165.192096, 67.966884], [-165.493328, 68.059992], [-165.794559, 68.081899], [-166.243668, 68.246208], [-166.681824, 68.339316], [-166.703731, 68.372177], [-166.375115, 68.42147], [-166.227238, 68.574824], [-166.216284, 68.881533], [-165.329019, 68.859625], [-164.255539, 68.930825], [-163.976215, 68.985595], [-163.532583, 69.138949], [-163.110859, 69.374457], [-163.023228, 69.609966], [-162.842489, 69.812613], [-162.470057, 69.982398], [-162.311225, 70.108367], [-161.851162, 70.311014], [-161.779962, 70.256245], [-161.396576, 70.239814], [-160.837928, 70.343876], [-160.487404, 70.453415], [-159.649432, 70.792985], [-159.33177, 70.809416], [-159.298908, 70.760123], [-158.975769, 70.798462], [-158.658106, 70.787508], [-158.033735, 70.831323], [-157.420318, 70.979201], [-156.812377, 71.285909], [-156.565915, 71.351633], [-156.522099, 71.296863], [-155.585543, 71.170894], [-155.508865, 71.083263], [-155.832005, 70.968247], [-155.979882, 70.96277], [-155.974405, 70.809416], [-155.503388, 70.858708], [-155.476004, 70.940862], [-155.262403, 71.017539], [-155.191203, 70.973724], [-155.032372, 71.148986], [-154.566832, 70.990155], [-154.643509, 70.869662], [-154.353231, 70.8368], [-154.183446, 70.7656], [-153.931507, 70.880616], [-153.487874, 70.886093], [-153.235935, 70.924431], [-152.589656, 70.886093], [-152.26104, 70.842277], [-152.419871, 70.606769], [-151.817408, 70.546523], [-151.773592, 70.486276], [-151.187559, 70.382214], [-151.182082, 70.431507], [-150.760358, 70.49723], [-150.355064, 70.491753], [-150.349588, 70.436984], [-150.114079, 70.431507], [-149.867617, 70.508184], [-149.462323, 70.519138], [-149.177522, 70.486276], [-148.78866, 70.404122], [-148.607921, 70.420553], [-148.350504, 70.305537], [-148.202627, 70.349353], [-147.961642, 70.316491], [-147.786379, 70.245291]]], [[[-152.94018, 58.026237], [-152.945657, 57.982421], [-153.290705, 58.048145], [-153.044242, 58.305561], [-152.819688, 58.327469], [-152.666333, 58.562977], [-152.496548, 58.354853], [-152.354148, 58.426053], [-152.080301, 58.311038], [-152.080301, 58.152206], [-152.480117, 58.130299], [-152.655379, 58.059098], [-152.94018, 58.026237]]], [[[-153.958891, 57.538789], [-153.67409, 57.670236], [-153.931507, 57.69762], [-153.936983, 57.812636], [-153.723383, 57.889313], [-153.570028, 57.834544], [-153.548121, 57.719528], [-153.46049, 57.796205], [-153.455013, 57.96599], [-153.268797, 57.889313], [-153.235935, 57.998852], [-153.071627, 57.933129], [-152.874457, 57.933129], [-152.721103, 57.993375], [-152.469163, 57.889313], [-152.469163, 57.599035], [-152.151501, 57.620943], [-152.359625, 57.42925], [-152.74301, 57.505928], [-152.60061, 57.379958], [-152.710149, 57.275896], [-152.907319, 57.325188], [-152.912796, 57.128019], [-153.214027, 57.073249], [-153.312612, 56.991095], [-153.498828, 57.067772], [-153.695998, 56.859649], [-153.849352, 56.837741], [-154.013661, 56.744633], [-154.073907, 56.969187], [-154.303938, 56.848695], [-154.314892, 56.919895], [-154.523016, 56.991095], [-154.539447, 57.193742], [-154.742094, 57.275896], [-154.627078, 57.511404], [-154.227261, 57.659282], [-153.980799, 57.648328], [-153.958891, 57.538789]]], [[[-154.53397, 56.602232], [-154.742094, 56.399586], [-154.807817, 56.432447], [-154.53397, 56.602232]]], [[[-155.634835, 55.923092], [-155.476004, 55.912138], [-155.530773, 55.704014], [-155.793666, 55.731399], [-155.837482, 55.802599], [-155.634835, 55.923092]]], [[[-159.890418, 55.28229], [-159.950664, 55.068689], [-160.257373, 54.893427], [-160.109495, 55.161797], [-160.005433, 55.134412], [-159.890418, 55.28229]]], [[[-160.520266, 55.358967], [-160.33405, 55.358967], [-160.339527, 55.249428], [-160.525743, 55.128935], [-160.690051, 55.211089], [-160.794113, 55.134412], [-160.854359, 55.320628], [-160.79959, 55.380875], [-160.520266, 55.358967]]], [[[-162.256456, 54.981058], [-162.234548, 54.893427], [-162.349564, 54.838658], [-162.437195, 54.931766], [-162.256456, 54.981058]]], [[[-162.415287, 63.634624], [-162.563165, 63.536039], [-162.612457, 63.62367], [-162.415287, 63.634624]]], [[[-162.80415, 54.488133], [-162.590549, 54.449795], [-162.612457, 54.367641], [-162.782242, 54.373118], [-162.80415, 54.488133]]], [[[-165.548097, 54.29644], [-165.476897, 54.181425], [-165.630251, 54.132132], [-165.685021, 54.252625], [-165.548097, 54.29644]]], [[[-165.73979, 54.15404], [-166.046499, 54.044501], [-166.112222, 54.121178], [-165.980775, 54.219763], [-165.73979, 54.15404]]], [[[-166.364161, 60.359413], [-166.13413, 60.397752], [-166.084837, 60.326552], [-165.88219, 60.342983], [-165.685021, 60.277259], [-165.646682, 59.992458], [-165.750744, 59.89935], [-166.00816, 59.844581], [-166.062929, 59.745996], [-166.440838, 59.855535], [-166.6161, 59.850058], [-166.994009, 59.992458], [-167.125456, 59.992458], [-167.344534, 60.074613], [-167.421211, 60.206059], [-167.311672, 60.238921], [-166.93924, 60.206059], [-166.763978, 60.310121], [-166.577762, 60.321075], [-166.495608, 60.392275], [-166.364161, 60.359413]]], [[[-166.375115, 54.01164], [-166.210807, 53.934962], [-166.5449, 53.748746], [-166.539423, 53.715885], [-166.117699, 53.852808], [-166.112222, 53.776131], [-166.282007, 53.683023], [-166.555854, 53.622777], [-166.583239, 53.529669], [-166.878994, 53.431084], [-167.13641, 53.425607], [-167.306195, 53.332499], [-167.623857, 53.250345], [-167.793643, 53.337976], [-167.459549, 53.442038], [-167.355487, 53.425607], [-167.103548, 53.513238], [-167.163794, 53.611823], [-167.021394, 53.715885], [-166.807793, 53.666592], [-166.785886, 53.732316], [-167.015917, 53.754223], [-167.141887, 53.825424], [-167.032348, 53.945916], [-166.643485, 54.017116], [-166.561331, 53.880193], [-166.375115, 54.01164]]], [[[-168.790446, 53.157237], [-168.40706, 53.34893], [-168.385152, 53.431084], [-168.237275, 53.524192], [-168.007243, 53.568007], [-167.886751, 53.518715], [-167.842935, 53.387268], [-168.270136, 53.244868], [-168.500168, 53.036744], [-168.686384, 52.965544], [-168.790446, 53.157237]]], [[[-169.74891, 52.894344], [-169.705095, 52.795759], [-169.962511, 52.790282], [-169.989896, 52.856005], [-169.74891, 52.894344]]], [[[-170.148727, 57.221127], [-170.28565, 57.128019], [-170.313035, 57.221127], [-170.148727, 57.221127]]], [[[-170.669036, 52.697174], [-170.603313, 52.604066], [-170.789529, 52.538343], [-170.816914, 52.636928], [-170.669036, 52.697174]]], [[[-171.742517, 63.716778], [-170.94836, 63.5689], [-170.488297, 63.69487], [-170.280174, 63.683916], [-170.093958, 63.612716], [-170.044665, 63.492223], [-169.644848, 63.4265], [-169.518879, 63.366254], [-168.99857, 63.338869], [-168.686384, 63.295053], [-168.856169, 63.147176], [-169.108108, 63.180038], [-169.376478, 63.152653], [-169.513402, 63.08693], [-169.639372, 62.939052], [-169.831064, 63.075976], [-170.055619, 63.169084], [-170.263743, 63.180038], [-170.362328, 63.2841], [-170.866206, 63.415546], [-171.101715, 63.421023], [-171.463193, 63.306007], [-171.73704, 63.366254], [-171.852055, 63.486746], [-171.742517, 63.716778]]], [[[-172.432611, 52.390465], [-172.41618, 52.275449], [-172.607873, 52.253542], [-172.569535, 52.352127], [-172.432611, 52.390465]]], [[[-173.626584, 52.14948], [-173.495138, 52.105664], [-173.122706, 52.111141], [-173.106275, 52.07828], [-173.549907, 52.028987], [-173.626584, 52.14948]]], [[[-174.322156, 52.280926], [-174.327632, 52.379511], [-174.185232, 52.41785], [-173.982585, 52.319265], [-174.059262, 52.226157], [-174.179755, 52.231634], [-174.141417, 52.127572], [-174.333109, 52.116618], [-174.738403, 52.007079], [-174.968435, 52.039941], [-174.902711, 52.116618], [-174.656249, 52.105664], [-174.322156, 52.280926]]], [[[-176.469116, 51.853725], [-176.288377, 51.870156], [-176.288377, 51.744186], [-176.518409, 51.760617], [-176.80321, 51.61274], [-176.912748, 51.80991], [-176.792256, 51.815386], [-176.775825, 51.963264], [-176.627947, 51.968741], [-176.627947, 51.859202], [-176.469116, 51.853725]]], [[[-177.153734, 51.946833], [-177.044195, 51.897541], [-177.120872, 51.727755], [-177.274226, 51.678463], [-177.279703, 51.782525], [-177.153734, 51.946833]]], [[[-178.123152, 51.919448], [-177.953367, 51.913971], [-177.800013, 51.793479], [-177.964321, 51.651078], [-178.123152, 51.919448]]], [[[173.107557, 52.992929], [173.293773, 52.927205], [173.304726, 52.823143], [172.90491, 52.762897], [172.642017, 52.927205], [172.642017, 53.003883], [173.107557, 52.992929]]]] } }, { "type": "Feature", "id": "04", "properties": { "name": "Arizona" }, "geometry": { "type": "Polygon", "coordinates": [[[-109.042503, 37.000263], [-109.04798, 31.331629], [-111.074448, 31.331629], [-112.246513, 31.704061], [-114.815198, 32.492741], [-114.72209, 32.717295], [-114.524921, 32.755634], [-114.470151, 32.843265], [-114.524921, 33.029481], [-114.661844, 33.034958], [-114.727567, 33.40739], [-114.524921, 33.54979], [-114.497536, 33.697668], [-114.535874, 33.933176], [-114.415382, 34.108438], [-114.256551, 34.174162], [-114.136058, 34.305608], [-114.333228, 34.448009], [-114.470151, 34.710902], [-114.634459, 34.87521], [-114.634459, 35.00118], [-114.574213, 35.138103], [-114.596121, 35.324319], [-114.678275, 35.516012], [-114.738521, 36.102045], [-114.371566, 36.140383], [-114.251074, 36.01989], [-114.152489, 36.025367], [-114.048427, 36.195153], [-114.048427, 37.000263], [-110.499369, 37.00574], [-109.042503, 37.000263]]] } }, { "type": "Feature", "id": "05", "properties": { "name": "Arkansas" }, "geometry": { "type": "Polygon", "coordinates": [[[-94.473842, 36.501861], [-90.152536, 36.496384], [-90.064905, 36.304691], [-90.218259, 36.184199], [-90.377091, 35.997983], [-89.730812, 35.997983], [-89.763673, 35.811767], [-89.911551, 35.756997], [-89.944412, 35.603643], [-90.130628, 35.439335], [-90.114197, 35.198349], [-90.212782, 35.023087], [-90.311367, 34.995703], [-90.251121, 34.908072], [-90.409952, 34.831394], [-90.481152, 34.661609], [-90.585214, 34.617794], [-90.568783, 34.420624], [-90.749522, 34.365854], [-90.744046, 34.300131], [-90.952169, 34.135823], [-90.891923, 34.026284], [-91.072662, 33.867453], [-91.231493, 33.560744], [-91.056231, 33.429298], [-91.143862, 33.347144], [-91.089093, 33.13902], [-91.16577, 33.002096], [-93.608485, 33.018527], [-94.041164, 33.018527], [-94.041164, 33.54979], [-94.183564, 33.593606], [-94.380734, 33.544313], [-94.484796, 33.637421], [-94.430026, 35.395519], [-94.616242, 36.501861], [-94.473842, 36.501861]]] } }, { "type": "Feature", "id": "06", "properties": { "name": "California" }, "geometry": { "type": "Polygon", "coordinates": [[[-123.233256, 42.006186], [-122.378853, 42.011663], [-121.037003, 41.995232], [-120.001861, 41.995232], [-119.996384, 40.264519], [-120.001861, 38.999346], [-118.71478, 38.101128], [-117.498899, 37.21934], [-116.540435, 36.501861], [-115.85034, 35.970598], [-114.634459, 35.00118], [-114.634459, 34.87521], [-114.470151, 34.710902], [-114.333228, 34.448009], [-114.136058, 34.305608], [-114.256551, 34.174162], [-114.415382, 34.108438], [-114.535874, 33.933176], [-114.497536, 33.697668], [-114.524921, 33.54979], [-114.727567, 33.40739], [-114.661844, 33.034958], [-114.524921, 33.029481], [-114.470151, 32.843265], [-114.524921, 32.755634], [-114.72209, 32.717295], [-116.04751, 32.624187], [-117.126467, 32.536556], [-117.24696, 32.668003], [-117.252437, 32.876127], [-117.329114, 33.122589], [-117.471515, 33.297851], [-117.7837, 33.538836], [-118.183517, 33.763391], [-118.260194, 33.703145], [-118.413548, 33.741483], [-118.391641, 33.840068], [-118.566903, 34.042715], [-118.802411, 33.998899], [-119.218659, 34.146777], [-119.278905, 34.26727], [-119.558229, 34.415147], [-119.875891, 34.40967], [-120.138784, 34.475393], [-120.472878, 34.448009], [-120.64814, 34.579455], [-120.609801, 34.858779], [-120.670048, 34.902595], [-120.631709, 35.099764], [-120.894602, 35.247642], [-120.905556, 35.450289], [-121.004141, 35.461243], [-121.168449, 35.636505], [-121.283465, 35.674843], [-121.332757, 35.784382], [-121.716143, 36.195153], [-121.896882, 36.315645], [-121.935221, 36.638785], [-121.858544, 36.6114], [-121.787344, 36.803093], [-121.929744, 36.978355], [-122.105006, 36.956447], [-122.335038, 37.115279], [-122.417192, 37.241248], [-122.400761, 37.361741], [-122.515777, 37.520572], [-122.515777, 37.783465], [-122.329561, 37.783465], [-122.406238, 38.15042], [-122.488392, 38.112082], [-122.504823, 37.931343], [-122.701993, 37.893004], [-122.937501, 38.029928], [-122.97584, 38.265436], [-123.129194, 38.451652], [-123.331841, 38.566668], [-123.44138, 38.698114], [-123.737134, 38.95553], [-123.687842, 39.032208], [-123.824765, 39.366301], [-123.764519, 39.552517], [-123.85215, 39.831841], [-124.109566, 40.105688], [-124.361506, 40.259042], [-124.410798, 40.439781], [-124.158859, 40.877937], [-124.109566, 41.025814], [-124.158859, 41.14083], [-124.065751, 41.442061], [-124.147905, 41.715908], [-124.257444, 41.781632], [-124.213628, 42.000709], [-123.233256, 42.006186]]] } }, { "type": "Feature", "id": "08", "properties": { "name": "Colorado" }, "geometry": { "type": "Polygon", "coordinates": [[[-107.919731, 41.003906], [-105.728954, 40.998429], [-104.053011, 41.003906], [-102.053927, 41.003906], [-102.053927, 40.001626], [-102.042974, 36.994786], [-103.001438, 37.000263], [-104.337812, 36.994786], [-106.868158, 36.994786], [-107.421329, 37.000263], [-109.042503, 37.000263], [-109.042503, 38.166851], [-109.058934, 38.27639], [-109.053457, 39.125316], [-109.04798, 40.998429], [-107.919731, 41.003906]]] } }, { "type": "Feature", "id": "09", "properties": { "name": "Connecticut" }, "geometry": { "type": "Polygon", "coordinates": [[[-73.053528, 42.039048], [-71.799309, 42.022617], [-71.799309, 42.006186], [-71.799309, 41.414677], [-71.859555, 41.321569], [-71.947186, 41.338], [-72.385341, 41.261322], [-72.905651, 41.28323], [-73.130205, 41.146307], [-73.371191, 41.102491], [-73.655992, 40.987475], [-73.727192, 41.102491], [-73.48073, 41.21203], [-73.55193, 41.294184], [-73.486206, 42.050002], [-73.053528, 42.039048]]] } }, { "type": "Feature", "id": "10", "properties": { "name": "Delaware" }, "geometry": { "type": "Polygon", "coordinates": [[[-75.414089, 39.804456], [-75.507197, 39.683964], [-75.611259, 39.61824], [-75.589352, 39.459409], [-75.441474, 39.311532], [-75.403136, 39.065069], [-75.189535, 38.807653], [-75.09095, 38.796699], [-75.047134, 38.451652], [-75.693413, 38.462606], [-75.786521, 39.722302], [-75.616736, 39.831841], [-75.414089, 39.804456]]] } }, { "type": "Feature", "id": "11", "properties": { "name": "District of Columbia" }, "geometry": { "type": "Polygon", "coordinates": [[[-77.035264, 38.993869], [-76.909294, 38.895284], [-77.040741, 38.791222], [-77.117418, 38.933623], [-77.035264, 38.993869]]] } }, { "type": "Feature", "id": "12", "properties": { "name": "Florida" }, "geometry": { "type": "Polygon", "coordinates": [[[-85.497137, 30.997536], [-85.004212, 31.003013], [-84.867289, 30.712735], [-83.498053, 30.647012], [-82.216449, 30.570335], [-82.167157, 30.356734], [-82.046664, 30.362211], [-82.002849, 30.564858], [-82.041187, 30.751074], [-81.948079, 30.827751], [-81.718048, 30.745597], [-81.444201, 30.707258], [-81.383954, 30.27458], [-81.257985, 29.787132], [-80.967707, 29.14633], [-80.524075, 28.461713], [-80.589798, 28.41242], [-80.56789, 28.094758], [-80.381674, 27.738757], [-80.091397, 27.021277], [-80.03115, 26.796723], [-80.036627, 26.566691], [-80.146166, 25.739673], [-80.239274, 25.723243], [-80.337859, 25.465826], [-80.304997, 25.383672], [-80.49669, 25.197456], [-80.573367, 25.241272], [-80.759583, 25.164595], [-81.077246, 25.120779], [-81.170354, 25.224841], [-81.126538, 25.378195], [-81.351093, 25.821827], [-81.526355, 25.903982], [-81.679709, 25.843735], [-81.800202, 26.090198], [-81.833064, 26.292844], [-82.041187, 26.517399], [-82.09048, 26.665276], [-82.057618, 26.878877], [-82.172634, 26.917216], [-82.145249, 26.791246], [-82.249311, 26.758384], [-82.566974, 27.300601], [-82.692943, 27.437525], [-82.391711, 27.837342], [-82.588881, 27.815434], [-82.720328, 27.689464], [-82.851774, 27.886634], [-82.676512, 28.434328], [-82.643651, 28.888914], [-82.764143, 28.998453], [-82.802482, 29.14633], [-82.994175, 29.179192], [-83.218729, 29.420177], [-83.399469, 29.518762], [-83.410422, 29.66664], [-83.536392, 29.721409], [-83.640454, 29.885717], [-84.02384, 30.104795], [-84.357933, 30.055502], [-84.341502, 29.902148], [-84.451041, 29.929533], [-84.867289, 29.743317], [-85.310921, 29.699501], [-85.299967, 29.80904], [-85.404029, 29.940487], [-85.924338, 30.236241], [-86.29677, 30.362211], [-86.630863, 30.395073], [-86.910187, 30.373165], [-87.518128, 30.280057], [-87.37025, 30.427934], [-87.446927, 30.510088], [-87.408589, 30.674397], [-87.633143, 30.86609], [-87.600282, 30.997536], [-85.497137, 30.997536]]] } }, { "type": "Feature", "id": "13", "properties": { "name": "Georgia" }, "geometry": { "type": "Polygon", "coordinates": [[[-83.109191, 35.00118], [-83.322791, 34.787579], [-83.339222, 34.683517], [-83.005129, 34.469916], [-82.901067, 34.486347], [-82.747713, 34.26727], [-82.714851, 34.152254], [-82.55602, 33.94413], [-82.325988, 33.81816], [-82.194542, 33.631944], [-81.926172, 33.462159], [-81.937125, 33.347144], [-81.761863, 33.160928], [-81.493493, 33.007573], [-81.42777, 32.843265], [-81.416816, 32.629664], [-81.279893, 32.558464], [-81.121061, 32.290094], [-81.115584, 32.120309], [-80.885553, 32.032678], [-81.132015, 31.693108], [-81.175831, 31.517845], [-81.279893, 31.364491], [-81.290846, 31.20566], [-81.400385, 31.13446], [-81.444201, 30.707258], [-81.718048, 30.745597], [-81.948079, 30.827751], [-82.041187, 30.751074], [-82.002849, 30.564858], [-82.046664, 30.362211], [-82.167157, 30.356734], [-82.216449, 30.570335], [-83.498053, 30.647012], [-84.867289, 30.712735], [-85.004212, 31.003013], [-85.113751, 31.27686], [-85.042551, 31.539753], [-85.141136, 31.840985], [-85.053504, 32.01077], [-85.058981, 32.13674], [-84.889196, 32.262709], [-85.004212, 32.322956], [-84.960397, 32.421541], [-85.069935, 32.580372], [-85.184951, 32.859696], [-85.431413, 34.124869], [-85.606675, 34.984749], [-84.319594, 34.990226], [-83.618546, 34.984749], [-83.109191, 35.00118]]] } }, { "type": "Feature", "id": "15", "properties": { "name": "Hawaii" }, "geometry": { "type": "MultiPolygon", "coordinates": [[[[-155.634835, 18.948267], [-155.881297, 19.035898], [-155.919636, 19.123529], [-155.886774, 19.348084], [-156.062036, 19.73147], [-155.925113, 19.857439], [-155.826528, 20.032702], [-155.897728, 20.147717], [-155.87582, 20.26821], [-155.596496, 20.12581], [-155.284311, 20.021748], [-155.092618, 19.868393], [-155.092618, 19.736947], [-154.807817, 19.523346], [-154.983079, 19.348084], [-155.295265, 19.26593], [-155.514342, 19.134483], [-155.634835, 18.948267]]], [[[-156.587823, 21.029505], [-156.472807, 20.892581], [-156.324929, 20.952827], [-156.00179, 20.793996], [-156.051082, 20.651596], [-156.379699, 20.580396], [-156.445422, 20.60778], [-156.461853, 20.783042], [-156.631638, 20.821381], [-156.697361, 20.919966], [-156.587823, 21.029505]]], [[[-156.982162, 21.210244], [-157.080747, 21.106182], [-157.310779, 21.106182], [-157.239579, 21.221198], [-156.982162, 21.210244]]], [[[-157.951581, 21.697691], [-157.842042, 21.462183], [-157.896811, 21.325259], [-158.110412, 21.303352], [-158.252813, 21.582676], [-158.126843, 21.588153], [-157.951581, 21.697691]]], [[[-159.468693, 22.228955], [-159.353678, 22.218001], [-159.298908, 22.113939], [-159.33177, 21.966061], [-159.446786, 21.872953], [-159.764448, 21.987969], [-159.726109, 22.152277], [-159.468693, 22.228955]]]] } }, { "type": "Feature", "id": "16", "properties": { "name": "Idaho" }, "geometry": { "type": "Polygon", "coordinates": [[[-116.04751, 49.000239], [-116.04751, 47.976051], [-115.724371, 47.696727], [-115.718894, 47.42288], [-115.527201, 47.302388], [-115.324554, 47.258572], [-115.302646, 47.187372], [-114.930214, 46.919002], [-114.886399, 46.809463], [-114.623506, 46.705401], [-114.612552, 46.639678], [-114.322274, 46.645155], [-114.464674, 46.272723], [-114.492059, 46.037214], [-114.387997, 45.88386], [-114.568736, 45.774321], [-114.497536, 45.670259], [-114.546828, 45.560721], [-114.333228, 45.456659], [-114.086765, 45.593582], [-113.98818, 45.703121], [-113.807441, 45.604536], [-113.834826, 45.522382], [-113.736241, 45.330689], [-113.571933, 45.128042], [-113.45144, 45.056842], [-113.456917, 44.865149], [-113.341901, 44.782995], [-113.133778, 44.772041], [-113.002331, 44.448902], [-112.887315, 44.394132], [-112.783254, 44.48724], [-112.471068, 44.481763], [-112.241036, 44.569394], [-112.104113, 44.520102], [-111.868605, 44.563917], [-111.819312, 44.509148], [-111.616665, 44.547487], [-111.386634, 44.75561], [-111.227803, 44.580348], [-111.047063, 44.476286], [-111.047063, 42.000709], [-112.164359, 41.995232], [-114.04295, 41.995232], [-117.027882, 42.000709], [-117.027882, 43.830007], [-116.896436, 44.158624], [-116.97859, 44.240778], [-117.170283, 44.257209], [-117.241483, 44.394132], [-117.038836, 44.750133], [-116.934774, 44.782995], [-116.830713, 44.930872], [-116.847143, 45.02398], [-116.732128, 45.144473], [-116.671881, 45.319735], [-116.463758, 45.61549], [-116.545912, 45.752413], [-116.78142, 45.823614], [-116.918344, 45.993399], [-116.92382, 46.168661], [-117.055267, 46.343923], [-117.038836, 46.426077], [-117.044313, 47.762451], [-117.033359, 49.000239], [-116.04751, 49.000239]]] } }, { "type": "Feature", "id": "17", "properties": { "name": "Illinois" }, "geometry": { "type": "Polygon", "coordinates": [[[-90.639984, 42.510065], [-88.788778, 42.493634], [-87.802929, 42.493634], [-87.83579, 42.301941], [-87.682436, 42.077386], [-87.523605, 41.710431], [-87.529082, 39.34987], [-87.63862, 39.169131], [-87.512651, 38.95553], [-87.49622, 38.780268], [-87.62219, 38.637868], [-87.655051, 38.506421], [-87.83579, 38.292821], [-87.950806, 38.27639], [-87.923421, 38.15042], [-88.000098, 38.101128], [-88.060345, 37.865619], [-88.027483, 37.799896], [-88.15893, 37.657496], [-88.065822, 37.482234], [-88.476592, 37.389126], [-88.514931, 37.285064], [-88.421823, 37.153617], [-88.547792, 37.071463], [-88.914747, 37.224817], [-89.029763, 37.213863], [-89.183118, 37.038601], [-89.133825, 36.983832], [-89.292656, 36.994786], [-89.517211, 37.279587], [-89.435057, 37.34531], [-89.517211, 37.537003], [-89.517211, 37.690357], [-89.84035, 37.903958], [-89.949889, 37.88205], [-90.059428, 38.013497], [-90.355183, 38.216144], [-90.349706, 38.374975], [-90.179921, 38.632391], [-90.207305, 38.725499], [-90.10872, 38.845992], [-90.251121, 38.917192], [-90.470199, 38.961007], [-90.585214, 38.867899], [-90.661891, 38.928146], [-90.727615, 39.256762], [-91.061708, 39.470363], [-91.368417, 39.727779], [-91.494386, 40.034488], [-91.50534, 40.237135], [-91.417709, 40.379535], [-91.401278, 40.560274], [-91.121954, 40.669813], [-91.09457, 40.823167], [-90.963123, 40.921752], [-90.946692, 41.097014], [-91.111001, 41.239415], [-91.045277, 41.414677], [-90.656414, 41.463969], [-90.344229, 41.589939], [-90.311367, 41.743293], [-90.179921, 41.809016], [-90.141582, 42.000709], [-90.168967, 42.126679], [-90.393521, 42.225264], [-90.420906, 42.329326], [-90.639984, 42.510065]]] } }, { "type": "Feature", "id": "18", "properties": { "name": "Indiana" }, "geometry": { "type": "Polygon", "coordinates": [[[-85.990061, 41.759724], [-84.807042, 41.759724], [-84.807042, 41.694001], [-84.801565, 40.500028], [-84.817996, 39.103408], [-84.894673, 39.059592], [-84.812519, 38.785745], [-84.987781, 38.780268], [-85.173997, 38.68716], [-85.431413, 38.730976], [-85.42046, 38.533806], [-85.590245, 38.451652], [-85.655968, 38.325682], [-85.83123, 38.27639], [-85.924338, 38.024451], [-86.039354, 37.958727], [-86.263908, 38.051835], [-86.302247, 38.166851], [-86.521325, 38.040881], [-86.504894, 37.931343], [-86.729448, 37.893004], [-86.795172, 37.991589], [-87.047111, 37.893004], [-87.129265, 37.788942], [-87.381204, 37.93682], [-87.512651, 37.903958], [-87.600282, 37.975158], [-87.682436, 37.903958], [-87.934375, 37.893004], [-88.027483, 37.799896], [-88.060345, 37.865619], [-88.000098, 38.101128], [-87.923421, 38.15042], [-87.950806, 38.27639], [-87.83579, 38.292821], [-87.655051, 38.506421], [-87.62219, 38.637868], [-87.49622, 38.780268], [-87.512651, 38.95553], [-87.63862, 39.169131], [-87.529082, 39.34987], [-87.523605, 41.710431], [-87.42502, 41.644708], [-87.118311, 41.644708], [-86.822556, 41.759724], [-85.990061, 41.759724]]] } }, { "type": "Feature", "id": "19", "properties": { "name": "Iowa" }, "geometry": { "type": "Polygon", "coordinates": [[[-91.368417, 43.501391], [-91.215062, 43.501391], [-91.204109, 43.353514], [-91.056231, 43.254929], [-91.176724, 43.134436], [-91.143862, 42.909881], [-91.067185, 42.75105], [-90.711184, 42.636034], [-90.639984, 42.510065], [-90.420906, 42.329326], [-90.393521, 42.225264], [-90.168967, 42.126679], [-90.141582, 42.000709], [-90.179921, 41.809016], [-90.311367, 41.743293], [-90.344229, 41.589939], [-90.656414, 41.463969], [-91.045277, 41.414677], [-91.111001, 41.239415], [-90.946692, 41.097014], [-90.963123, 40.921752], [-91.09457, 40.823167], [-91.121954, 40.669813], [-91.401278, 40.560274], [-91.417709, 40.379535], [-91.527248, 40.412397], [-91.729895, 40.615043], [-91.833957, 40.609566], [-93.257961, 40.582182], [-94.632673, 40.571228], [-95.7664, 40.587659], [-95.881416, 40.719105], [-95.826646, 40.976521], [-95.925231, 41.201076], [-95.919754, 41.453015], [-96.095016, 41.540646], [-96.122401, 41.67757], [-96.062155, 41.798063], [-96.127878, 41.973325], [-96.264801, 42.039048], [-96.44554, 42.488157], [-96.631756, 42.707235], [-96.544125, 42.855112], [-96.511264, 43.052282], [-96.434587, 43.123482], [-96.560556, 43.222067], [-96.527695, 43.397329], [-96.582464, 43.479483], [-96.451017, 43.501391], [-91.368417, 43.501391]]] } }, { "type": "Feature", "id": "20", "properties": { "name": "Kansas" }, "geometry": { "type": "Polygon", "coordinates": [[[-101.90605, 40.001626], [-95.306337, 40.001626], [-95.207752, 39.908518], [-94.884612, 39.831841], [-95.109167, 39.541563], [-94.983197, 39.442978], [-94.824366, 39.20747], [-94.610765, 39.158177], [-94.616242, 37.000263], [-100.087706, 37.000263], [-102.042974, 36.994786], [-102.053927, 40.001626], [-101.90605, 40.001626]]] } }, { "type": "Feature", "id": "21", "properties": { "name": "Kentucky" }, "geometry": { "type": "Polygon", "coordinates": [[[-83.903347, 38.769315], [-83.678792, 38.632391], [-83.519961, 38.703591], [-83.142052, 38.626914], [-83.032514, 38.725499], [-82.890113, 38.758361], [-82.846298, 38.588575], [-82.731282, 38.561191], [-82.594358, 38.424267], [-82.621743, 38.123036], [-82.50125, 37.931343], [-82.342419, 37.783465], [-82.293127, 37.668449], [-82.101434, 37.553434], [-81.969987, 37.537003], [-82.353373, 37.268633], [-82.720328, 37.120755], [-82.720328, 37.044078], [-82.868205, 36.978355], [-82.879159, 36.890724], [-83.070852, 36.852385], [-83.136575, 36.742847], [-83.673316, 36.600446], [-83.689746, 36.584015], [-84.544149, 36.594969], [-85.289013, 36.627831], [-85.486183, 36.616877], [-86.592525, 36.655216], [-87.852221, 36.633308], [-88.071299, 36.677123], [-88.054868, 36.496384], [-89.298133, 36.507338], [-89.418626, 36.496384], [-89.363857, 36.622354], [-89.215979, 36.578538], [-89.133825, 36.983832], [-89.183118, 37.038601], [-89.029763, 37.213863], [-88.914747, 37.224817], [-88.547792, 37.071463], [-88.421823, 37.153617], [-88.514931, 37.285064], [-88.476592, 37.389126], [-88.065822, 37.482234], [-88.15893, 37.657496], [-88.027483, 37.799896], [-87.934375, 37.893004], [-87.682436, 37.903958], [-87.600282, 37.975158], [-87.512651, 37.903958], [-87.381204, 37.93682], [-87.129265, 37.788942], [-87.047111, 37.893004], [-86.795172, 37.991589], [-86.729448, 37.893004], [-86.504894, 37.931343], [-86.521325, 38.040881], [-86.302247, 38.166851], [-86.263908, 38.051835], [-86.039354, 37.958727], [-85.924338, 38.024451], [-85.83123, 38.27639], [-85.655968, 38.325682], [-85.590245, 38.451652], [-85.42046, 38.533806], [-85.431413, 38.730976], [-85.173997, 38.68716], [-84.987781, 38.780268], [-84.812519, 38.785745], [-84.894673, 39.059592], [-84.817996, 39.103408], [-84.43461, 39.103408], [-84.231963, 38.895284], [-84.215533, 38.807653], [-83.903347, 38.769315]]] } }, { "type": "Feature", "id": "22", "properties": { "name": "Louisiana" }, "geometry": { "type": "Polygon", "coordinates": [[[-93.608485, 33.018527], [-91.16577, 33.002096], [-91.072662, 32.887081], [-91.143862, 32.843265], [-91.154816, 32.640618], [-91.006939, 32.514649], [-90.985031, 32.218894], [-91.105524, 31.988862], [-91.341032, 31.846462], [-91.401278, 31.621907], [-91.499863, 31.643815], [-91.516294, 31.27686], [-91.636787, 31.265906], [-91.565587, 31.068736], [-91.636787, 30.997536], [-89.747242, 30.997536], [-89.845827, 30.66892], [-89.681519, 30.449842], [-89.643181, 30.285534], [-89.522688, 30.181472], [-89.818443, 30.044549], [-89.84035, 29.945964], [-89.599365, 29.88024], [-89.495303, 30.039072], [-89.287179, 29.88024], [-89.30361, 29.754271], [-89.424103, 29.699501], [-89.648657, 29.748794], [-89.621273, 29.655686], [-89.69795, 29.513285], [-89.506257, 29.387316], [-89.199548, 29.348977], [-89.09001, 29.2011], [-89.002379, 29.179192], [-89.16121, 29.009407], [-89.336472, 29.042268], [-89.484349, 29.217531], [-89.851304, 29.310638], [-89.851304, 29.480424], [-90.032043, 29.425654], [-90.021089, 29.283254], [-90.103244, 29.151807], [-90.23469, 29.129899], [-90.333275, 29.277777], [-90.563307, 29.283254], [-90.645461, 29.129899], [-90.798815, 29.086084], [-90.963123, 29.179192], [-91.09457, 29.190146], [-91.220539, 29.436608], [-91.445094, 29.546147], [-91.532725, 29.529716], [-91.620356, 29.73784], [-91.883249, 29.710455], [-91.888726, 29.836425], [-92.146142, 29.715932], [-92.113281, 29.622824], [-92.31045, 29.535193], [-92.617159, 29.579009], [-92.97316, 29.715932], [-93.2251, 29.776178], [-93.767317, 29.726886], [-93.838517, 29.688547], [-93.926148, 29.787132], [-93.690639, 30.143133], [-93.767317, 30.334826], [-93.696116, 30.438888], [-93.728978, 30.575812], [-93.630393, 30.679874], [-93.526331, 30.93729], [-93.542762, 31.15089], [-93.816609, 31.556184], [-93.822086, 31.775262], [-94.041164, 31.994339], [-94.041164, 33.018527], [-93.608485, 33.018527]]] } }, { "type": "Feature", "id": "23", "properties": { "name": "Maine" }, "geometry": { "type": "Polygon", "coordinates": [[[-70.703921, 43.057759], [-70.824413, 43.128959], [-70.807983, 43.227544], [-70.966814, 43.34256], [-71.032537, 44.657025], [-71.08183, 45.303304], [-70.649151, 45.440228], [-70.720352, 45.511428], [-70.556043, 45.664782], [-70.386258, 45.735983], [-70.41912, 45.796229], [-70.260289, 45.889337], [-70.309581, 46.064599], [-70.210996, 46.327492], [-70.057642, 46.415123], [-69.997395, 46.694447], [-69.225147, 47.461219], [-69.044408, 47.428357], [-69.033454, 47.242141], [-68.902007, 47.176418], [-68.578868, 47.285957], [-68.376221, 47.285957], [-68.233821, 47.357157], [-67.954497, 47.198326], [-67.790188, 47.066879], [-67.779235, 45.944106], [-67.801142, 45.675736], [-67.456095, 45.604536], [-67.505388, 45.48952], [-67.417757, 45.379982], [-67.488957, 45.281397], [-67.346556, 45.128042], [-67.16034, 45.160904], [-66.979601, 44.804903], [-67.187725, 44.646072], [-67.308218, 44.706318], [-67.406803, 44.596779], [-67.549203, 44.624164], [-67.565634, 44.531056], [-67.75185, 44.54201], [-68.047605, 44.328409], [-68.118805, 44.476286], [-68.222867, 44.48724], [-68.173574, 44.328409], [-68.403606, 44.251732], [-68.458375, 44.377701], [-68.567914, 44.311978], [-68.82533, 44.311978], [-68.830807, 44.459856], [-68.984161, 44.426994], [-68.956777, 44.322932], [-69.099177, 44.103854], [-69.071793, 44.043608], [-69.258008, 43.923115], [-69.444224, 43.966931], [-69.553763, 43.840961], [-69.707118, 43.82453], [-69.833087, 43.720469], [-69.986442, 43.742376], [-70.030257, 43.851915], [-70.254812, 43.676653], [-70.194565, 43.567114], [-70.358873, 43.528776], [-70.369827, 43.435668], [-70.556043, 43.320652], [-70.703921, 43.057759]]] } }, { "type": "Feature", "id": "24", "properties": { "name": "Maryland" }, "geometry": { "type": "MultiPolygon", "coordinates": [[[[-75.994645, 37.95325], [-76.016553, 37.95325], [-76.043938, 37.95325], [-75.994645, 37.95325]]], [[[-79.477979, 39.722302], [-75.786521, 39.722302], [-75.693413, 38.462606], [-75.047134, 38.451652], [-75.244304, 38.029928], [-75.397659, 38.013497], [-75.671506, 37.95325], [-75.885106, 37.909435], [-75.879629, 38.073743], [-75.961783, 38.139466], [-75.846768, 38.210667], [-76.000122, 38.374975], [-76.049415, 38.303775], [-76.257538, 38.320205], [-76.328738, 38.500944], [-76.263015, 38.500944], [-76.257538, 38.736453], [-76.191815, 38.829561], [-76.279446, 39.147223], [-76.169907, 39.333439], [-76.000122, 39.366301], [-75.972737, 39.557994], [-76.098707, 39.536086], [-76.104184, 39.437501], [-76.367077, 39.311532], [-76.443754, 39.196516], [-76.460185, 38.906238], [-76.55877, 38.769315], [-76.514954, 38.539283], [-76.383508, 38.380452], [-76.399939, 38.259959], [-76.317785, 38.139466], [-76.3616, 38.057312], [-76.591632, 38.216144], [-76.920248, 38.292821], [-77.018833, 38.446175], [-77.205049, 38.358544], [-77.276249, 38.479037], [-77.128372, 38.632391], [-77.040741, 38.791222], [-76.909294, 38.895284], [-77.035264, 38.993869], [-77.117418, 38.933623], [-77.248864, 39.026731], [-77.456988, 39.076023], [-77.456988, 39.223901], [-77.566527, 39.306055], [-77.719881, 39.322485], [-77.834897, 39.601809], [-78.004682, 39.601809], [-78.174467, 39.694917], [-78.267575, 39.61824], [-78.431884, 39.623717], [-78.470222, 39.514178], [-78.765977, 39.585379], [-78.963147, 39.437501], [-79.094593, 39.470363], [-79.291763, 39.300578], [-79.488933, 39.20747], [-79.477979, 39.722302]]]] } }, { "type": "Feature", "id": "25", "properties": { "name": "Massachusetts" }, "geometry": { "type": "Polygon", "coordinates": [[[-70.917521, 42.887974], [-70.818936, 42.871543], [-70.780598, 42.696281], [-70.824413, 42.55388], [-70.983245, 42.422434], [-70.988722, 42.269079], [-70.769644, 42.247172], [-70.638197, 42.08834], [-70.660105, 41.962371], [-70.550566, 41.929509], [-70.539613, 41.814493], [-70.260289, 41.715908], [-69.937149, 41.809016], [-70.008349, 41.672093], [-70.484843, 41.5516], [-70.660105, 41.546123], [-70.764167, 41.639231], [-70.928475, 41.611847], [-70.933952, 41.540646], [-71.120168, 41.496831], [-71.196845, 41.67757], [-71.22423, 41.710431], [-71.328292, 41.781632], [-71.383061, 42.01714], [-71.530939, 42.01714], [-71.799309, 42.006186], [-71.799309, 42.022617], [-73.053528, 42.039048], [-73.486206, 42.050002], [-73.508114, 42.08834], [-73.267129, 42.745573], [-72.456542, 42.729142], [-71.29543, 42.696281], [-71.185891, 42.789389], [-70.917521, 42.887974]]] } }, { "type": "Feature", "id": "26", "properties": { "name": "Michigan" }, "geometry": { "type": "MultiPolygon", "coordinates": [[[[-83.454238, 41.732339], [-84.807042, 41.694001], [-84.807042, 41.759724], [-85.990061, 41.759724], [-86.822556, 41.759724], [-86.619909, 41.891171], [-86.482986, 42.115725], [-86.357016, 42.252649], [-86.263908, 42.444341], [-86.209139, 42.718189], [-86.231047, 43.013943], [-86.526801, 43.594499], [-86.433693, 43.813577], [-86.499417, 44.07647], [-86.269385, 44.34484], [-86.220093, 44.569394], [-86.252954, 44.689887], [-86.088646, 44.73918], [-86.066738, 44.903488], [-85.809322, 44.947303], [-85.612152, 45.128042], [-85.628583, 44.766564], [-85.524521, 44.750133], [-85.393075, 44.930872], [-85.387598, 45.237581], [-85.305444, 45.314258], [-85.031597, 45.363551], [-85.119228, 45.577151], [-84.938489, 45.75789], [-84.713934, 45.768844], [-84.461995, 45.653829], [-84.215533, 45.637398], [-84.09504, 45.494997], [-83.908824, 45.484043], [-83.596638, 45.352597], [-83.4871, 45.358074], [-83.317314, 45.144473], [-83.454238, 45.029457], [-83.322791, 44.88158], [-83.273499, 44.711795], [-83.333745, 44.339363], [-83.536392, 44.246255], [-83.585684, 44.054562], [-83.82667, 43.988839], [-83.958116, 43.758807], [-83.908824, 43.671176], [-83.667839, 43.589022], [-83.481623, 43.714992], [-83.262545, 43.972408], [-82.917498, 44.070993], [-82.747713, 43.994316], [-82.643651, 43.851915], [-82.539589, 43.435668], [-82.523158, 43.227544], [-82.413619, 42.975605], [-82.517681, 42.614127], [-82.681989, 42.559357], [-82.687466, 42.690804], [-82.797005, 42.652465], [-82.922975, 42.351234], [-83.125621, 42.236218], [-83.185868, 42.006186], [-83.437807, 41.814493], [-83.454238, 41.732339]]], [[[-85.508091, 45.730506], [-85.49166, 45.610013], [-85.623106, 45.588105], [-85.568337, 45.75789], [-85.508091, 45.730506]]], [[[-87.589328, 45.095181], [-87.742682, 45.199243], [-87.649574, 45.341643], [-87.885083, 45.363551], [-87.791975, 45.500474], [-87.781021, 45.675736], [-87.989145, 45.796229], [-88.10416, 45.922199], [-88.531362, 46.020784], [-88.662808, 45.987922], [-89.09001, 46.135799], [-90.119674, 46.338446], [-90.229213, 46.508231], [-90.415429, 46.568478], [-90.026566, 46.672539], [-89.851304, 46.793032], [-89.413149, 46.842325], [-89.128348, 46.990202], [-88.996902, 46.995679], [-88.887363, 47.099741], [-88.575177, 47.247618], [-88.416346, 47.373588], [-88.180837, 47.455742], [-87.956283, 47.384542], [-88.350623, 47.077833], [-88.443731, 46.973771], [-88.438254, 46.787555], [-88.246561, 46.929956], [-87.901513, 46.908048], [-87.633143, 46.809463], [-87.392158, 46.535616], [-87.260711, 46.486323], [-87.008772, 46.530139], [-86.948526, 46.469893], [-86.696587, 46.437031], [-86.159846, 46.667063], [-85.880522, 46.68897], [-85.508091, 46.678016], [-85.256151, 46.754694], [-85.064458, 46.760171], [-85.02612, 46.480847], [-84.82895, 46.442508], [-84.63178, 46.486323], [-84.549626, 46.4206], [-84.418179, 46.502754], [-84.127902, 46.530139], [-84.122425, 46.179615], [-83.990978, 46.031737], [-83.793808, 45.993399], [-83.7719, 46.091984], [-83.580208, 46.091984], [-83.476146, 45.987922], [-83.563777, 45.911245], [-84.111471, 45.976968], [-84.374364, 45.933153], [-84.659165, 46.053645], [-84.741319, 45.944106], [-84.70298, 45.850998], [-84.82895, 45.872906], [-85.015166, 46.00983], [-85.338305, 46.091984], [-85.502614, 46.097461], [-85.661445, 45.966014], [-85.924338, 45.933153], [-86.209139, 45.960537], [-86.324155, 45.905768], [-86.351539, 45.796229], [-86.663725, 45.703121], [-86.647294, 45.834568], [-86.784218, 45.861952], [-86.838987, 45.725029], [-87.069019, 45.719552], [-87.17308, 45.659305], [-87.326435, 45.423797], [-87.611236, 45.122565], [-87.589328, 45.095181]]], [[[-88.805209, 47.976051], [-89.057148, 47.850082], [-89.188594, 47.833651], [-89.177641, 47.937713], [-88.547792, 48.173221], [-88.668285, 48.008913], [-88.805209, 47.976051]]]] } }, { "type": "Feature", "id": "27", "properties": { "name": "Minnesota" }, "geometry": { "type": "Polygon", "coordinates": [[[-92.014696, 46.705401], [-92.091373, 46.749217], [-92.29402, 46.667063], [-92.29402, 46.075553], [-92.354266, 46.015307], [-92.639067, 45.933153], [-92.869098, 45.719552], [-92.885529, 45.577151], [-92.770513, 45.566198], [-92.644544, 45.440228], [-92.75956, 45.286874], [-92.737652, 45.117088], [-92.808852, 44.750133], [-92.545959, 44.569394], [-92.337835, 44.552964], [-92.233773, 44.443425], [-91.927065, 44.333886], [-91.877772, 44.202439], [-91.592971, 44.032654], [-91.43414, 43.994316], [-91.242447, 43.775238], [-91.269832, 43.616407], [-91.215062, 43.501391], [-91.368417, 43.501391], [-96.451017, 43.501391], [-96.451017, 45.297827], [-96.681049, 45.412843], [-96.856311, 45.604536], [-96.582464, 45.818137], [-96.560556, 45.933153], [-96.598895, 46.332969], [-96.719387, 46.437031], [-96.801542, 46.656109], [-96.785111, 46.924479], [-96.823449, 46.968294], [-96.856311, 47.609096], [-97.053481, 47.948667], [-97.130158, 48.140359], [-97.16302, 48.545653], [-97.097296, 48.682577], [-97.228743, 49.000239], [-95.152983, 49.000239], [-95.152983, 49.383625], [-94.955813, 49.372671], [-94.824366, 49.295994], [-94.69292, 48.775685], [-94.588858, 48.715438], [-94.260241, 48.699007], [-94.221903, 48.649715], [-93.838517, 48.627807], [-93.794701, 48.518268], [-93.466085, 48.545653], [-93.466085, 48.589469], [-93.208669, 48.644238], [-92.984114, 48.62233], [-92.726698, 48.540176], [-92.655498, 48.436114], [-92.50762, 48.447068], [-92.370697, 48.222514], [-92.304974, 48.315622], [-92.053034, 48.359437], [-92.009219, 48.266329], [-91.713464, 48.200606], [-91.713464, 48.112975], [-91.565587, 48.041775], [-91.264355, 48.080113], [-91.083616, 48.178698], [-90.837154, 48.238944], [-90.749522, 48.091067], [-90.579737, 48.123929], [-90.377091, 48.091067], [-90.141582, 48.112975], [-89.873212, 47.987005], [-89.615796, 48.008913], [-89.637704, 47.954144], [-89.971797, 47.828174], [-90.437337, 47.729589], [-90.738569, 47.625527], [-91.171247, 47.368111], [-91.357463, 47.20928], [-91.642264, 47.028541], [-92.091373, 46.787555], [-92.014696, 46.705401]]] } }, { "type": "Feature", "id": "28", "properties": { "name": "Mississippi" }, "geometry": { "type": "Polygon", "coordinates": [[[-88.471115, 34.995703], [-88.202745, 34.995703], [-88.098683, 34.891641], [-88.241084, 33.796253], [-88.471115, 31.895754], [-88.394438, 30.367688], [-88.503977, 30.323872], [-88.744962, 30.34578], [-88.843547, 30.411504], [-89.084533, 30.367688], [-89.418626, 30.252672], [-89.522688, 30.181472], [-89.643181, 30.285534], [-89.681519, 30.449842], [-89.845827, 30.66892], [-89.747242, 30.997536], [-91.636787, 30.997536], [-91.565587, 31.068736], [-91.636787, 31.265906], [-91.516294, 31.27686], [-91.499863, 31.643815], [-91.401278, 31.621907], [-91.341032, 31.846462], [-91.105524, 31.988862], [-90.985031, 32.218894], [-91.006939, 32.514649], [-91.154816, 32.640618], [-91.143862, 32.843265], [-91.072662, 32.887081], [-91.16577, 33.002096], [-91.089093, 33.13902], [-91.143862, 33.347144], [-91.056231, 33.429298], [-91.231493, 33.560744], [-91.072662, 33.867453], [-90.891923, 34.026284], [-90.952169, 34.135823], [-90.744046, 34.300131], [-90.749522, 34.365854], [-90.568783, 34.420624], [-90.585214, 34.617794], [-90.481152, 34.661609], [-90.409952, 34.831394], [-90.251121, 34.908072], [-90.311367, 34.995703], [-88.471115, 34.995703]]] } }, { "type": "Feature", "id": "29", "properties": { "name": "Missouri" }, "geometry": { "type": "Polygon", "coordinates": [[[-91.833957, 40.609566], [-91.729895, 40.615043], [-91.527248, 40.412397], [-91.417709, 40.379535], [-91.50534, 40.237135], [-91.494386, 40.034488], [-91.368417, 39.727779], [-91.061708, 39.470363], [-90.727615, 39.256762], [-90.661891, 38.928146], [-90.585214, 38.867899], [-90.470199, 38.961007], [-90.251121, 38.917192], [-90.10872, 38.845992], [-90.207305, 38.725499], [-90.179921, 38.632391], [-90.349706, 38.374975], [-90.355183, 38.216144], [-90.059428, 38.013497], [-89.949889, 37.88205], [-89.84035, 37.903958], [-89.517211, 37.690357], [-89.517211, 37.537003], [-89.435057, 37.34531], [-89.517211, 37.279587], [-89.292656, 36.994786], [-89.133825, 36.983832], [-89.215979, 36.578538], [-89.363857, 36.622354], [-89.418626, 36.496384], [-89.484349, 36.496384], [-89.539119, 36.496384], [-89.533642, 36.249922], [-89.730812, 35.997983], [-90.377091, 35.997983], [-90.218259, 36.184199], [-90.064905, 36.304691], [-90.152536, 36.496384], [-94.473842, 36.501861], [-94.616242, 36.501861], [-94.616242, 37.000263], [-94.610765, 39.158177], [-94.824366, 39.20747], [-94.983197, 39.442978], [-95.109167, 39.541563], [-94.884612, 39.831841], [-95.207752, 39.908518], [-95.306337, 40.001626], [-95.552799, 40.264519], [-95.7664, 40.587659], [-94.632673, 40.571228], [-93.257961, 40.582182], [-91.833957, 40.609566]]] } }, { "type": "Feature", "id": "30", "properties": { "name": "Montana" }, "geometry": { "type": "Polygon", "coordinates": [[[-104.047534, 49.000239], [-104.042057, 47.861036], [-104.047534, 45.944106], [-104.042057, 44.996596], [-104.058488, 44.996596], [-105.91517, 45.002073], [-109.080842, 45.002073], [-111.05254, 45.002073], [-111.047063, 44.476286], [-111.227803, 44.580348], [-111.386634, 44.75561], [-111.616665, 44.547487], [-111.819312, 44.509148], [-111.868605, 44.563917], [-112.104113, 44.520102], [-112.241036, 44.569394], [-112.471068, 44.481763], [-112.783254, 44.48724], [-112.887315, 44.394132], [-113.002331, 44.448902], [-113.133778, 44.772041], [-113.341901, 44.782995], [-113.456917, 44.865149], [-113.45144, 45.056842], [-113.571933, 45.128042], [-113.736241, 45.330689], [-113.834826, 45.522382], [-113.807441, 45.604536], [-113.98818, 45.703121], [-114.086765, 45.593582], [-114.333228, 45.456659], [-114.546828, 45.560721], [-114.497536, 45.670259], [-114.568736, 45.774321], [-114.387997, 45.88386], [-114.492059, 46.037214], [-114.464674, 46.272723], [-114.322274, 46.645155], [-114.612552, 46.639678], [-114.623506, 46.705401], [-114.886399, 46.809463], [-114.930214, 46.919002], [-115.302646, 47.187372], [-115.324554, 47.258572], [-115.527201, 47.302388], [-115.718894, 47.42288], [-115.724371, 47.696727], [-116.04751, 47.976051], [-116.04751, 49.000239], [-111.50165, 48.994762], [-109.453274, 49.000239], [-104.047534, 49.000239]]] } }, { "type": "Feature", "id": "31", "properties": { "name": "Nebraska" }, "geometry": { "type": "Polygon", "coordinates": [[[-103.324578, 43.002989], [-101.626726, 42.997512], [-98.499393, 42.997512], [-98.466531, 42.94822], [-97.951699, 42.767481], [-97.831206, 42.866066], [-97.688806, 42.844158], [-97.217789, 42.844158], [-96.692003, 42.657942], [-96.626279, 42.515542], [-96.44554, 42.488157], [-96.264801, 42.039048], [-96.127878, 41.973325], [-96.062155, 41.798063], [-96.122401, 41.67757], [-96.095016, 41.540646], [-95.919754, 41.453015], [-95.925231, 41.201076], [-95.826646, 40.976521], [-95.881416, 40.719105], [-95.7664, 40.587659], [-95.552799, 40.264519], [-95.306337, 40.001626], [-101.90605, 40.001626], [-102.053927, 40.001626], [-102.053927, 41.003906], [-104.053011, 41.003906], [-104.053011, 43.002989], [-103.324578, 43.002989]]] } }, { "type": "Feature", "id": "32", "properties": { "name": "Nevada" }, "geometry": { "type": "Polygon", "coordinates": [[[-117.027882, 42.000709], [-114.04295, 41.995232], [-114.048427, 37.000263], [-114.048427, 36.195153], [-114.152489, 36.025367], [-114.251074, 36.01989], [-114.371566, 36.140383], [-114.738521, 36.102045], [-114.678275, 35.516012], [-114.596121, 35.324319], [-114.574213, 35.138103], [-114.634459, 35.00118], [-115.85034, 35.970598], [-116.540435, 36.501861], [-117.498899, 37.21934], [-118.71478, 38.101128], [-120.001861, 38.999346], [-119.996384, 40.264519], [-120.001861, 41.995232], [-118.698349, 41.989755], [-117.027882, 42.000709]]] } }, { "type": "Feature", "id": "33", "properties": { "name": "New Hampshire" }, "geometry": { "type": "Polygon", "coordinates": [[[-71.08183, 45.303304], [-71.032537, 44.657025], [-70.966814, 43.34256], [-70.807983, 43.227544], [-70.824413, 43.128959], [-70.703921, 43.057759], [-70.818936, 42.871543], [-70.917521, 42.887974], [-71.185891, 42.789389], [-71.29543, 42.696281], [-72.456542, 42.729142], [-72.544173, 42.80582], [-72.533219, 42.953697], [-72.445588, 43.008466], [-72.456542, 43.150867], [-72.379864, 43.572591], [-72.204602, 43.769761], [-72.116971, 43.994316], [-72.02934, 44.07647], [-72.034817, 44.322932], [-71.700724, 44.41604], [-71.536416, 44.585825], [-71.629524, 44.750133], [-71.4926, 44.914442], [-71.503554, 45.013027], [-71.361154, 45.270443], [-71.131122, 45.243058], [-71.08183, 45.303304]]] } }, { "type": "Feature", "id": "34", "properties": { "name": "New Jersey" }, "geometry": { "type": "Polygon", "coordinates": [[[-74.236547, 41.14083], [-73.902454, 40.998429], [-74.022947, 40.708151], [-74.187255, 40.642428], [-74.274886, 40.489074], [-74.001039, 40.412397], [-73.979131, 40.297381], [-74.099624, 39.760641], [-74.411809, 39.360824], [-74.614456, 39.245808], [-74.795195, 38.993869], [-74.888303, 39.158177], [-75.178581, 39.240331], [-75.534582, 39.459409], [-75.55649, 39.607286], [-75.561967, 39.629194], [-75.507197, 39.683964], [-75.414089, 39.804456], [-75.145719, 39.88661], [-75.129289, 39.963288], [-74.82258, 40.127596], [-74.773287, 40.215227], [-75.058088, 40.417874], [-75.069042, 40.543843], [-75.195012, 40.576705], [-75.205966, 40.691721], [-75.052611, 40.866983], [-75.134765, 40.971045], [-74.882826, 41.179168], [-74.828057, 41.288707], [-74.69661, 41.359907], [-74.236547, 41.14083]]] } }, { "type": "Feature", "id": "35", "properties": { "name": "New Mexico" }, "geometry": { "type": "Polygon", "coordinates": [[[-107.421329, 37.000263], [-106.868158, 36.994786], [-104.337812, 36.994786], [-103.001438, 37.000263], [-103.001438, 36.501861], [-103.039777, 36.501861], [-103.045254, 34.01533], [-103.067161, 33.002096], [-103.067161, 31.999816], [-106.616219, 31.999816], [-106.643603, 31.901231], [-106.528588, 31.786216], [-108.210008, 31.786216], [-108.210008, 31.331629], [-109.04798, 31.331629], [-109.042503, 37.000263], [-107.421329, 37.000263]]] } }, { "type": "Feature", "id": "36", "properties": { "name": "New York" }, "geometry": { "type": "Polygon", "coordinates": [[[-73.343806, 45.013027], [-73.332852, 44.804903], [-73.387622, 44.618687], [-73.294514, 44.437948], [-73.321898, 44.246255], [-73.436914, 44.043608], [-73.349283, 43.769761], [-73.404052, 43.687607], [-73.245221, 43.523299], [-73.278083, 42.833204], [-73.267129, 42.745573], [-73.508114, 42.08834], [-73.486206, 42.050002], [-73.55193, 41.294184], [-73.48073, 41.21203], [-73.727192, 41.102491], [-73.655992, 40.987475], [-73.22879, 40.905321], [-73.141159, 40.965568], [-72.774204, 40.965568], [-72.587988, 40.998429], [-72.28128, 41.157261], [-72.259372, 41.042245], [-72.100541, 40.992952], [-72.467496, 40.845075], [-73.239744, 40.625997], [-73.562884, 40.582182], [-73.776484, 40.593136], [-73.935316, 40.543843], [-74.022947, 40.708151], [-73.902454, 40.998429], [-74.236547, 41.14083], [-74.69661, 41.359907], [-74.740426, 41.431108], [-74.89378, 41.436584], [-75.074519, 41.60637], [-75.052611, 41.754247], [-75.173104, 41.869263], [-75.249781, 41.863786], [-75.35932, 42.000709], [-79.76278, 42.000709], [-79.76278, 42.252649], [-79.76278, 42.269079], [-79.149363, 42.55388], [-79.050778, 42.690804], [-78.853608, 42.783912], [-78.930285, 42.953697], [-79.012439, 42.986559], [-79.072686, 43.260406], [-78.486653, 43.375421], [-77.966344, 43.369944], [-77.75822, 43.34256], [-77.533665, 43.233021], [-77.391265, 43.276836], [-76.958587, 43.271359], [-76.695693, 43.34256], [-76.41637, 43.523299], [-76.235631, 43.528776], [-76.230154, 43.802623], [-76.137046, 43.961454], [-76.3616, 44.070993], [-76.312308, 44.196962], [-75.912491, 44.366748], [-75.764614, 44.514625], [-75.282643, 44.848718], [-74.828057, 45.018503], [-74.148916, 44.991119], [-73.343806, 45.013027]]] } }, { "type": "Feature", "id": "37", "properties": { "name": "North Carolina" }, "geometry": { "type": "Polygon", "coordinates": [[[-80.978661, 36.562108], [-80.294043, 36.545677], [-79.510841, 36.5402], [-75.868676, 36.551154], [-75.75366, 36.151337], [-76.032984, 36.189676], [-76.071322, 36.140383], [-76.410893, 36.080137], [-76.460185, 36.025367], [-76.68474, 36.008937], [-76.673786, 35.937736], [-76.399939, 35.987029], [-76.3616, 35.943213], [-76.060368, 35.992506], [-75.961783, 35.899398], [-75.781044, 35.937736], [-75.715321, 35.696751], [-75.775568, 35.581735], [-75.89606, 35.570781], [-76.147999, 35.324319], [-76.482093, 35.313365], [-76.536862, 35.14358], [-76.394462, 34.973795], [-76.279446, 34.940933], [-76.493047, 34.661609], [-76.673786, 34.694471], [-76.991448, 34.667086], [-77.210526, 34.60684], [-77.555573, 34.415147], [-77.82942, 34.163208], [-77.971821, 33.845545], [-78.179944, 33.916745], [-78.541422, 33.851022], [-79.675149, 34.80401], [-80.797922, 34.820441], [-80.781491, 34.935456], [-80.934845, 35.105241], [-81.038907, 35.044995], [-81.044384, 35.149057], [-82.276696, 35.198349], [-82.550543, 35.160011], [-82.764143, 35.066903], [-83.109191, 35.00118], [-83.618546, 34.984749], [-84.319594, 34.990226], [-84.29221, 35.225734], [-84.09504, 35.247642], [-84.018363, 35.41195], [-83.7719, 35.559827], [-83.498053, 35.565304], [-83.251591, 35.718659], [-82.994175, 35.773428], [-82.775097, 35.997983], [-82.638174, 36.063706], [-82.610789, 35.965121], [-82.216449, 36.156814], [-82.03571, 36.118475], [-81.909741, 36.304691], [-81.723525, 36.353984], [-81.679709, 36.589492], [-80.978661, 36.562108]]] } }, { "type": "Feature", "id": "38", "properties": { "name": "North Dakota" }, "geometry": { "type": "Polygon", "coordinates": [[[-97.228743, 49.000239], [-97.097296, 48.682577], [-97.16302, 48.545653], [-97.130158, 48.140359], [-97.053481, 47.948667], [-96.856311, 47.609096], [-96.823449, 46.968294], [-96.785111, 46.924479], [-96.801542, 46.656109], [-96.719387, 46.437031], [-96.598895, 46.332969], [-96.560556, 45.933153], [-104.047534, 45.944106], [-104.042057, 47.861036], [-104.047534, 49.000239], [-97.228743, 49.000239]]] } }, { "type": "Feature", "id": "39", "properties": { "name": "Ohio" }, "geometry": { "type": "Polygon", "coordinates": [[[-80.518598, 41.978802], [-80.518598, 40.636951], [-80.666475, 40.582182], [-80.595275, 40.472643], [-80.600752, 40.319289], [-80.737675, 40.078303], [-80.830783, 39.711348], [-81.219646, 39.388209], [-81.345616, 39.344393], [-81.455155, 39.410117], [-81.57017, 39.267716], [-81.685186, 39.273193], [-81.811156, 39.0815], [-81.783771, 38.966484], [-81.887833, 38.873376], [-82.03571, 39.026731], [-82.221926, 38.785745], [-82.172634, 38.632391], [-82.293127, 38.577622], [-82.331465, 38.446175], [-82.594358, 38.424267], [-82.731282, 38.561191], [-82.846298, 38.588575], [-82.890113, 38.758361], [-83.032514, 38.725499], [-83.142052, 38.626914], [-83.519961, 38.703591], [-83.678792, 38.632391], [-83.903347, 38.769315], [-84.215533, 38.807653], [-84.231963, 38.895284], [-84.43461, 39.103408], [-84.817996, 39.103408], [-84.801565, 40.500028], [-84.807042, 41.694001], [-83.454238, 41.732339], [-83.065375, 41.595416], [-82.933929, 41.513262], [-82.835344, 41.589939], [-82.616266, 41.431108], [-82.479343, 41.381815], [-82.013803, 41.513262], [-81.739956, 41.485877], [-81.444201, 41.672093], [-81.011523, 41.852832], [-80.518598, 41.978802], [-80.518598, 41.978802]]] } }, { "type": "Feature", "id": "40", "properties": { "name": "Oklahoma" }, "geometry": { "type": "Polygon", "coordinates": [[[-100.087706, 37.000263], [-94.616242, 37.000263], [-94.616242, 36.501861], [-94.430026, 35.395519], [-94.484796, 33.637421], [-94.868182, 33.74696], [-94.966767, 33.861976], [-95.224183, 33.960561], [-95.289906, 33.87293], [-95.547322, 33.878407], [-95.602092, 33.933176], [-95.8376, 33.834591], [-95.936185, 33.889361], [-96.149786, 33.840068], [-96.346956, 33.686714], [-96.423633, 33.774345], [-96.631756, 33.845545], [-96.850834, 33.845545], [-96.922034, 33.960561], [-97.173974, 33.736006], [-97.256128, 33.861976], [-97.371143, 33.823637], [-97.458774, 33.905791], [-97.694283, 33.982469], [-97.869545, 33.851022], [-97.946222, 33.987946], [-98.088623, 34.004376], [-98.170777, 34.113915], [-98.36247, 34.157731], [-98.488439, 34.064623], [-98.570593, 34.146777], [-98.767763, 34.135823], [-98.986841, 34.223454], [-99.189488, 34.2125], [-99.260688, 34.404193], [-99.57835, 34.415147], [-99.698843, 34.382285], [-99.923398, 34.573978], [-100.000075, 34.563024], [-100.000075, 36.501861], [-101.812942, 36.501861], [-103.001438, 36.501861], [-103.001438, 37.000263], [-102.042974, 36.994786], [-100.087706, 37.000263]]] } }, { "type": "Feature", "id": "41", "properties": { "name": "Oregon" }, "geometry": { "type": "Polygon", "coordinates": [[[-123.211348, 46.174138], [-123.11824, 46.185092], [-122.904639, 46.08103], [-122.811531, 45.960537], [-122.762239, 45.659305], [-122.247407, 45.549767], [-121.809251, 45.708598], [-121.535404, 45.725029], [-121.217742, 45.670259], [-121.18488, 45.604536], [-120.637186, 45.746937], [-120.505739, 45.697644], [-120.209985, 45.725029], [-119.963522, 45.823614], [-119.525367, 45.911245], [-119.125551, 45.933153], [-118.988627, 45.998876], [-116.918344, 45.993399], [-116.78142, 45.823614], [-116.545912, 45.752413], [-116.463758, 45.61549], [-116.671881, 45.319735], [-116.732128, 45.144473], [-116.847143, 45.02398], [-116.830713, 44.930872], [-116.934774, 44.782995], [-117.038836, 44.750133], [-117.241483, 44.394132], [-117.170283, 44.257209], [-116.97859, 44.240778], [-116.896436, 44.158624], [-117.027882, 43.830007], [-117.027882, 42.000709], [-118.698349, 41.989755], [-120.001861, 41.995232], [-121.037003, 41.995232], [-122.378853, 42.011663], [-123.233256, 42.006186], [-124.213628, 42.000709], [-124.356029, 42.115725], [-124.432706, 42.438865], [-124.416275, 42.663419], [-124.553198, 42.838681], [-124.454613, 43.002989], [-124.383413, 43.271359], [-124.235536, 43.55616], [-124.169813, 43.8081], [-124.060274, 44.657025], [-124.076705, 44.772041], [-123.97812, 45.144473], [-123.939781, 45.659305], [-123.994551, 45.944106], [-123.945258, 46.113892], [-123.545441, 46.261769], [-123.370179, 46.146753], [-123.211348, 46.174138]]] } }, { "type": "Feature", "id": "42", "properties": { "name": "Pennsylvania" }, "geometry": { "type": "Polygon", "coordinates": [[[-79.76278, 42.252649], [-79.76278, 42.000709], [-75.35932, 42.000709], [-75.249781, 41.863786], [-75.173104, 41.869263], [-75.052611, 41.754247], [-75.074519, 41.60637], [-74.89378, 41.436584], [-74.740426, 41.431108], [-74.69661, 41.359907], [-74.828057, 41.288707], [-74.882826, 41.179168], [-75.134765, 40.971045], [-75.052611, 40.866983], [-75.205966, 40.691721], [-75.195012, 40.576705], [-75.069042, 40.543843], [-75.058088, 40.417874], [-74.773287, 40.215227], [-74.82258, 40.127596], [-75.129289, 39.963288], [-75.145719, 39.88661], [-75.414089, 39.804456], [-75.616736, 39.831841], [-75.786521, 39.722302], [-79.477979, 39.722302], [-80.518598, 39.722302], [-80.518598, 40.636951], [-80.518598, 41.978802], [-80.518598, 41.978802], [-80.332382, 42.033571], [-79.76278, 42.269079], [-79.76278, 42.252649]]] } }, { "type": "Feature", "id": "44", "properties": { "name": "Rhode Island" }, "geometry": { "type": "MultiPolygon", "coordinates": [[[[-71.196845, 41.67757], [-71.120168, 41.496831], [-71.317338, 41.474923], [-71.196845, 41.67757]]], [[[-71.530939, 42.01714], [-71.383061, 42.01714], [-71.328292, 41.781632], [-71.22423, 41.710431], [-71.344723, 41.726862], [-71.448785, 41.578985], [-71.481646, 41.370861], [-71.859555, 41.321569], [-71.799309, 41.414677], [-71.799309, 42.006186], [-71.530939, 42.01714]]]] } }, { "type": "Feature", "id": "45", "properties": { "name": "South Carolina" }, "geometry": { "type": "Polygon", "coordinates": [[[-82.764143, 35.066903], [-82.550543, 35.160011], [-82.276696, 35.198349], [-81.044384, 35.149057], [-81.038907, 35.044995], [-80.934845, 35.105241], [-80.781491, 34.935456], [-80.797922, 34.820441], [-79.675149, 34.80401], [-78.541422, 33.851022], [-78.716684, 33.80173], [-78.935762, 33.637421], [-79.149363, 33.380005], [-79.187701, 33.171881], [-79.357487, 33.007573], [-79.582041, 33.007573], [-79.631334, 32.887081], [-79.866842, 32.755634], [-79.998289, 32.613234], [-80.206412, 32.552987], [-80.430967, 32.399633], [-80.452875, 32.328433], [-80.660998, 32.246279], [-80.885553, 32.032678], [-81.115584, 32.120309], [-81.121061, 32.290094], [-81.279893, 32.558464], [-81.416816, 32.629664], [-81.42777, 32.843265], [-81.493493, 33.007573], [-81.761863, 33.160928], [-81.937125, 33.347144], [-81.926172, 33.462159], [-82.194542, 33.631944], [-82.325988, 33.81816], [-82.55602, 33.94413], [-82.714851, 34.152254], [-82.747713, 34.26727], [-82.901067, 34.486347], [-83.005129, 34.469916], [-83.339222, 34.683517], [-83.322791, 34.787579], [-83.109191, 35.00118], [-82.764143, 35.066903]]] } }, { "type": "Feature", "id": "46", "properties": { "name": "South Dakota" }, "geometry": { "type": "Polygon", "coordinates": [[[-104.047534, 45.944106], [-96.560556, 45.933153], [-96.582464, 45.818137], [-96.856311, 45.604536], [-96.681049, 45.412843], [-96.451017, 45.297827], [-96.451017, 43.501391], [-96.582464, 43.479483], [-96.527695, 43.397329], [-96.560556, 43.222067], [-96.434587, 43.123482], [-96.511264, 43.052282], [-96.544125, 42.855112], [-96.631756, 42.707235], [-96.44554, 42.488157], [-96.626279, 42.515542], [-96.692003, 42.657942], [-97.217789, 42.844158], [-97.688806, 42.844158], [-97.831206, 42.866066], [-97.951699, 42.767481], [-98.466531, 42.94822], [-98.499393, 42.997512], [-101.626726, 42.997512], [-103.324578, 43.002989], [-104.053011, 43.002989], [-104.058488, 44.996596], [-104.042057, 44.996596], [-104.047534, 45.944106]]] } }, { "type": "Feature", "id": "47", "properties": { "name": "Tennessee" }, "geometry": { "type": "Polygon", "coordinates": [[[-88.054868, 36.496384], [-88.071299, 36.677123], [-87.852221, 36.633308], [-86.592525, 36.655216], [-85.486183, 36.616877], [-85.289013, 36.627831], [-84.544149, 36.594969], [-83.689746, 36.584015], [-83.673316, 36.600446], [-81.679709, 36.589492], [-81.723525, 36.353984], [-81.909741, 36.304691], [-82.03571, 36.118475], [-82.216449, 36.156814], [-82.610789, 35.965121], [-82.638174, 36.063706], [-82.775097, 35.997983], [-82.994175, 35.773428], [-83.251591, 35.718659], [-83.498053, 35.565304], [-83.7719, 35.559827], [-84.018363, 35.41195], [-84.09504, 35.247642], [-84.29221, 35.225734], [-84.319594, 34.990226], [-85.606675, 34.984749], [-87.359296, 35.00118], [-88.202745, 34.995703], [-88.471115, 34.995703], [-90.311367, 34.995703], [-90.212782, 35.023087], [-90.114197, 35.198349], [-90.130628, 35.439335], [-89.944412, 35.603643], [-89.911551, 35.756997], [-89.763673, 35.811767], [-89.730812, 35.997983], [-89.533642, 36.249922], [-89.539119, 36.496384], [-89.484349, 36.496384], [-89.418626, 36.496384], [-89.298133, 36.507338], [-88.054868, 36.496384]]] } }, { "type": "Feature", "id": "48", "properties": { "name": "Texas" }, "geometry": { "type": "Polygon", "coordinates": [[[-101.812942, 36.501861], [-100.000075, 36.501861], [-100.000075, 34.563024], [-99.923398, 34.573978], [-99.698843, 34.382285], [-99.57835, 34.415147], [-99.260688, 34.404193], [-99.189488, 34.2125], [-98.986841, 34.223454], [-98.767763, 34.135823], [-98.570593, 34.146777], [-98.488439, 34.064623], [-98.36247, 34.157731], [-98.170777, 34.113915], [-98.088623, 34.004376], [-97.946222, 33.987946], [-97.869545, 33.851022], [-97.694283, 33.982469], [-97.458774, 33.905791], [-97.371143, 33.823637], [-97.256128, 33.861976], [-97.173974, 33.736006], [-96.922034, 33.960561], [-96.850834, 33.845545], [-96.631756, 33.845545], [-96.423633, 33.774345], [-96.346956, 33.686714], [-96.149786, 33.840068], [-95.936185, 33.889361], [-95.8376, 33.834591], [-95.602092, 33.933176], [-95.547322, 33.878407], [-95.289906, 33.87293], [-95.224183, 33.960561], [-94.966767, 33.861976], [-94.868182, 33.74696], [-94.484796, 33.637421], [-94.380734, 33.544313], [-94.183564, 33.593606], [-94.041164, 33.54979], [-94.041164, 33.018527], [-94.041164, 31.994339], [-93.822086, 31.775262], [-93.816609, 31.556184], [-93.542762, 31.15089], [-93.526331, 30.93729], [-93.630393, 30.679874], [-93.728978, 30.575812], [-93.696116, 30.438888], [-93.767317, 30.334826], [-93.690639, 30.143133], [-93.926148, 29.787132], [-93.838517, 29.688547], [-94.002825, 29.68307], [-94.523134, 29.546147], [-94.70935, 29.622824], [-94.742212, 29.787132], [-94.873659, 29.672117], [-94.966767, 29.699501], [-95.016059, 29.557101], [-94.911997, 29.496854], [-94.895566, 29.310638], [-95.081782, 29.113469], [-95.383014, 28.867006], [-95.985477, 28.604113], [-96.045724, 28.647929], [-96.226463, 28.582205], [-96.23194, 28.642452], [-96.478402, 28.598636], [-96.593418, 28.724606], [-96.664618, 28.697221], [-96.401725, 28.439805], [-96.593418, 28.357651], [-96.774157, 28.406943], [-96.801542, 28.226204], [-97.026096, 28.039988], [-97.256128, 27.694941], [-97.404005, 27.333463], [-97.513544, 27.360848], [-97.540929, 27.229401], [-97.425913, 27.262263], [-97.480682, 26.99937], [-97.557359, 26.988416], [-97.562836, 26.840538], [-97.469728, 26.758384], [-97.442344, 26.457153], [-97.332805, 26.353091], [-97.30542, 26.161398], [-97.217789, 25.991613], [-97.524498, 25.887551], [-97.650467, 26.018997], [-97.885976, 26.06829], [-98.198161, 26.057336], [-98.466531, 26.221644], [-98.669178, 26.238075], [-98.822533, 26.369522], [-99.030656, 26.413337], [-99.173057, 26.539307], [-99.266165, 26.840538], [-99.446904, 27.021277], [-99.424996, 27.174632], [-99.50715, 27.33894], [-99.479765, 27.48134], [-99.605735, 27.640172], [-99.709797, 27.656603], [-99.879582, 27.799003], [-99.934351, 27.979742], [-100.082229, 28.14405], [-100.29583, 28.280974], [-100.399891, 28.582205], [-100.498476, 28.66436], [-100.629923, 28.905345], [-100.673738, 29.102515], [-100.799708, 29.244915], [-101.013309, 29.370885], [-101.062601, 29.458516], [-101.259771, 29.535193], [-101.413125, 29.754271], [-101.851281, 29.803563], [-102.114174, 29.792609], [-102.338728, 29.869286], [-102.388021, 29.765225], [-102.629006, 29.732363], [-102.809745, 29.524239], [-102.919284, 29.190146], [-102.97953, 29.184669], [-103.116454, 28.987499], [-103.280762, 28.982022], [-103.527224, 29.135376], [-104.146119, 29.381839], [-104.266611, 29.513285], [-104.507597, 29.639255], [-104.677382, 29.924056], [-104.688336, 30.181472], [-104.858121, 30.389596], [-104.896459, 30.570335], [-105.005998, 30.685351], [-105.394861, 30.855136], [-105.602985, 31.085167], [-105.77277, 31.167321], [-105.953509, 31.364491], [-106.205448, 31.468553], [-106.38071, 31.731446], [-106.528588, 31.786216], [-106.643603, 31.901231], [-106.616219, 31.999816], [-103.067161, 31.999816], [-103.067161, 33.002096], [-103.045254, 34.01533], [-103.039777, 36.501861], [-103.001438, 36.501861], [-101.812942, 36.501861]]] } }, { "type": "Feature", "id": "49", "properties": { "name": "Utah" }, "geometry": { "type": "Polygon", "coordinates": [[[-112.164359, 41.995232], [-111.047063, 42.000709], [-111.047063, 40.998429], [-109.04798, 40.998429], [-109.053457, 39.125316], [-109.058934, 38.27639], [-109.042503, 38.166851], [-109.042503, 37.000263], [-110.499369, 37.00574], [-114.048427, 37.000263], [-114.04295, 41.995232], [-112.164359, 41.995232]]] } }, { "type": "Feature", "id": "50", "properties": { "name": "Vermont" }, "geometry": { "type": "Polygon", "coordinates": [[[-71.503554, 45.013027], [-71.4926, 44.914442], [-71.629524, 44.750133], [-71.536416, 44.585825], [-71.700724, 44.41604], [-72.034817, 44.322932], [-72.02934, 44.07647], [-72.116971, 43.994316], [-72.204602, 43.769761], [-72.379864, 43.572591], [-72.456542, 43.150867], [-72.445588, 43.008466], [-72.533219, 42.953697], [-72.544173, 42.80582], [-72.456542, 42.729142], [-73.267129, 42.745573], [-73.278083, 42.833204], [-73.245221, 43.523299], [-73.404052, 43.687607], [-73.349283, 43.769761], [-73.436914, 44.043608], [-73.321898, 44.246255], [-73.294514, 44.437948], [-73.387622, 44.618687], [-73.332852, 44.804903], [-73.343806, 45.013027], [-72.308664, 45.002073], [-71.503554, 45.013027]]] } }, { "type": "Feature", "id": "51", "properties": { "name": "Virginia" }, "geometry": { "type": "MultiPolygon", "coordinates": [[[[-75.397659, 38.013497], [-75.244304, 38.029928], [-75.375751, 37.860142], [-75.512674, 37.799896], [-75.594828, 37.569865], [-75.802952, 37.197433], [-75.972737, 37.120755], [-76.027507, 37.257679], [-75.939876, 37.564388], [-75.671506, 37.95325], [-75.397659, 38.013497]]], [[[-76.016553, 37.95325], [-75.994645, 37.95325], [-76.043938, 37.95325], [-76.016553, 37.95325]]], [[[-78.349729, 39.464886], [-77.82942, 39.130793], [-77.719881, 39.322485], [-77.566527, 39.306055], [-77.456988, 39.223901], [-77.456988, 39.076023], [-77.248864, 39.026731], [-77.117418, 38.933623], [-77.040741, 38.791222], [-77.128372, 38.632391], [-77.248864, 38.588575], [-77.325542, 38.446175], [-77.281726, 38.342113], [-77.013356, 38.374975], [-76.964064, 38.216144], [-76.613539, 38.15042], [-76.514954, 38.024451], [-76.235631, 37.887527], [-76.3616, 37.608203], [-76.246584, 37.389126], [-76.383508, 37.285064], [-76.399939, 37.159094], [-76.273969, 37.082417], [-76.410893, 36.961924], [-76.619016, 37.120755], [-76.668309, 37.065986], [-76.48757, 36.95097], [-75.994645, 36.923586], [-75.868676, 36.551154], [-79.510841, 36.5402], [-80.294043, 36.545677], [-80.978661, 36.562108], [-81.679709, 36.589492], [-83.673316, 36.600446], [-83.136575, 36.742847], [-83.070852, 36.852385], [-82.879159, 36.890724], [-82.868205, 36.978355], [-82.720328, 37.044078], [-82.720328, 37.120755], [-82.353373, 37.268633], [-81.969987, 37.537003], [-81.986418, 37.454849], [-81.849494, 37.285064], [-81.679709, 37.20291], [-81.55374, 37.208387], [-81.362047, 37.339833], [-81.225123, 37.235771], [-80.967707, 37.290541], [-80.513121, 37.482234], [-80.474782, 37.421987], [-80.29952, 37.509618], [-80.294043, 37.690357], [-80.184505, 37.849189], [-79.998289, 37.997066], [-79.921611, 38.177805], [-79.724442, 38.364021], [-79.647764, 38.594052], [-79.477979, 38.457129], [-79.313671, 38.413313], [-79.209609, 38.495467], [-78.996008, 38.851469], [-78.870039, 38.763838], [-78.404499, 39.169131], [-78.349729, 39.464886]]]] } }, { "type": "Feature", "id": "53", "properties": { "name": "Washington" }, "geometry": { "type": "MultiPolygon", "coordinates": [[[[-117.033359, 49.000239], [-117.044313, 47.762451], [-117.038836, 46.426077], [-117.055267, 46.343923], [-116.92382, 46.168661], [-116.918344, 45.993399], [-118.988627, 45.998876], [-119.125551, 45.933153], [-119.525367, 45.911245], [-119.963522, 45.823614], [-120.209985, 45.725029], [-120.505739, 45.697644], [-120.637186, 45.746937], [-121.18488, 45.604536], [-121.217742, 45.670259], [-121.535404, 45.725029], [-121.809251, 45.708598], [-122.247407, 45.549767], [-122.762239, 45.659305], [-122.811531, 45.960537], [-122.904639, 46.08103], [-123.11824, 46.185092], [-123.211348, 46.174138], [-123.370179, 46.146753], [-123.545441, 46.261769], [-123.72618, 46.300108], [-123.874058, 46.239861], [-124.065751, 46.327492], [-124.027412, 46.464416], [-123.895966, 46.535616], [-124.098612, 46.74374], [-124.235536, 47.285957], [-124.31769, 47.357157], [-124.427229, 47.740543], [-124.624399, 47.88842], [-124.706553, 48.184175], [-124.597014, 48.381345], [-124.394367, 48.288237], [-123.983597, 48.162267], [-123.704273, 48.167744], [-123.424949, 48.118452], [-123.162056, 48.167744], [-123.036086, 48.080113], [-122.800578, 48.08559], [-122.636269, 47.866512], [-122.515777, 47.882943], [-122.493869, 47.587189], [-122.422669, 47.318818], [-122.324084, 47.346203], [-122.422669, 47.576235], [-122.395284, 47.800789], [-122.230976, 48.030821], [-122.362422, 48.123929], [-122.373376, 48.288237], [-122.471961, 48.468976], [-122.422669, 48.600422], [-122.488392, 48.753777], [-122.647223, 48.775685], [-122.795101, 48.8907], [-122.756762, 49.000239], [-117.033359, 49.000239]]], [[[-122.718423, 48.310145], [-122.586977, 48.35396], [-122.608885, 48.151313], [-122.767716, 48.227991], [-122.718423, 48.310145]]], [[[-123.025132, 48.583992], [-122.915593, 48.715438], [-122.767716, 48.556607], [-122.811531, 48.419683], [-123.041563, 48.458022], [-123.025132, 48.583992]]]] } }, { "type": "Feature", "id": "54", "properties": { "name": "West Virginia" }, "geometry": { "type": "Polygon", "coordinates": [[[-80.518598, 40.636951], [-80.518598, 39.722302], [-79.477979, 39.722302], [-79.488933, 39.20747], [-79.291763, 39.300578], [-79.094593, 39.470363], [-78.963147, 39.437501], [-78.765977, 39.585379], [-78.470222, 39.514178], [-78.431884, 39.623717], [-78.267575, 39.61824], [-78.174467, 39.694917], [-78.004682, 39.601809], [-77.834897, 39.601809], [-77.719881, 39.322485], [-77.82942, 39.130793], [-78.349729, 39.464886], [-78.404499, 39.169131], [-78.870039, 38.763838], [-78.996008, 38.851469], [-79.209609, 38.495467], [-79.313671, 38.413313], [-79.477979, 38.457129], [-79.647764, 38.594052], [-79.724442, 38.364021], [-79.921611, 38.177805], [-79.998289, 37.997066], [-80.184505, 37.849189], [-80.294043, 37.690357], [-80.29952, 37.509618], [-80.474782, 37.421987], [-80.513121, 37.482234], [-80.967707, 37.290541], [-81.225123, 37.235771], [-81.362047, 37.339833], [-81.55374, 37.208387], [-81.679709, 37.20291], [-81.849494, 37.285064], [-81.986418, 37.454849], [-81.969987, 37.537003], [-82.101434, 37.553434], [-82.293127, 37.668449], [-82.342419, 37.783465], [-82.50125, 37.931343], [-82.621743, 38.123036], [-82.594358, 38.424267], [-82.331465, 38.446175], [-82.293127, 38.577622], [-82.172634, 38.632391], [-82.221926, 38.785745], [-82.03571, 39.026731], [-81.887833, 38.873376], [-81.783771, 38.966484], [-81.811156, 39.0815], [-81.685186, 39.273193], [-81.57017, 39.267716], [-81.455155, 39.410117], [-81.345616, 39.344393], [-81.219646, 39.388209], [-80.830783, 39.711348], [-80.737675, 40.078303], [-80.600752, 40.319289], [-80.595275, 40.472643], [-80.666475, 40.582182], [-80.518598, 40.636951]]] } }, { "type": "Feature", "id": "55", "properties": { "name": "Wisconsin" }, "geometry": { "type": "Polygon", "coordinates": [[[-90.415429, 46.568478], [-90.229213, 46.508231], [-90.119674, 46.338446], [-89.09001, 46.135799], [-88.662808, 45.987922], [-88.531362, 46.020784], [-88.10416, 45.922199], [-87.989145, 45.796229], [-87.781021, 45.675736], [-87.791975, 45.500474], [-87.885083, 45.363551], [-87.649574, 45.341643], [-87.742682, 45.199243], [-87.589328, 45.095181], [-87.627666, 44.974688], [-87.819359, 44.95278], [-87.983668, 44.722749], [-88.043914, 44.563917], [-87.928898, 44.536533], [-87.775544, 44.640595], [-87.611236, 44.837764], [-87.403112, 44.914442], [-87.238804, 45.166381], [-87.03068, 45.22115], [-87.047111, 45.089704], [-87.189511, 44.969211], [-87.468835, 44.552964], [-87.545512, 44.322932], [-87.540035, 44.158624], [-87.644097, 44.103854], [-87.737205, 43.8793], [-87.704344, 43.687607], [-87.791975, 43.561637], [-87.912467, 43.249452], [-87.885083, 43.002989], [-87.76459, 42.783912], [-87.802929, 42.493634], [-88.788778, 42.493634], [-90.639984, 42.510065], [-90.711184, 42.636034], [-91.067185, 42.75105], [-91.143862, 42.909881], [-91.176724, 43.134436], [-91.056231, 43.254929], [-91.204109, 43.353514], [-91.215062, 43.501391], [-91.269832, 43.616407], [-91.242447, 43.775238], [-91.43414, 43.994316], [-91.592971, 44.032654], [-91.877772, 44.202439], [-91.927065, 44.333886], [-92.233773, 44.443425], [-92.337835, 44.552964], [-92.545959, 44.569394], [-92.808852, 44.750133], [-92.737652, 45.117088], [-92.75956, 45.286874], [-92.644544, 45.440228], [-92.770513, 45.566198], [-92.885529, 45.577151], [-92.869098, 45.719552], [-92.639067, 45.933153], [-92.354266, 46.015307], [-92.29402, 46.075553], [-92.29402, 46.667063], [-92.091373, 46.749217], [-92.014696, 46.705401], [-91.790141, 46.694447], [-91.09457, 46.864232], [-90.837154, 46.95734], [-90.749522, 46.88614], [-90.886446, 46.754694], [-90.55783, 46.584908], [-90.415429, 46.568478]]] } }, { "type": "Feature", "id": "56", "properties": { "name": "Wyoming" }, "geometry": { "type": "Polygon", "coordinates": [[[-109.080842, 45.002073], [-105.91517, 45.002073], [-104.058488, 44.996596], [-104.053011, 43.002989], [-104.053011, 41.003906], [-105.728954, 40.998429], [-107.919731, 41.003906], [-109.04798, 40.998429], [-111.047063, 40.998429], [-111.047063, 42.000709], [-111.047063, 44.476286], [-111.05254, 45.002073], [-109.080842, 45.002073]]] } }, { "type": "Feature", "id": "72", "properties": { "name": "Puerto Rico" }, "geometry": { "type": "Polygon", "coordinates": [[[-66.448338, 17.984326], [-66.771478, 18.006234], [-66.924832, 17.929556], [-66.985078, 17.973372], [-67.209633, 17.956941], [-67.154863, 18.19245], [-67.269879, 18.362235], [-67.094617, 18.515589], [-66.957694, 18.488204], [-66.409999, 18.488204], [-65.840398, 18.433435], [-65.632274, 18.367712], [-65.626797, 18.203403], [-65.730859, 18.186973], [-65.834921, 18.017187], [-66.234737, 17.929556], [-66.448338, 17.984326]]] } }];
var UsGeoJson = {
	type: type,
	features: features
};

var DefaultOptions = {
    chart: {
        type: 'choropleth'
    },
    plots: {
        emptyDataColor: '#ffffff',
        fillOpacity: 0.8,
        stroke: '#ffffff',
        strokeDashArray: '5,1',
        strokeHighlight: '#8f8d8b',
        strokeWidth: 1.5,
        strokeWidthHighlight: 3
    },
    color: {
        scheme: MetroCold5,
        type: Globals.ColorType.GRADIENT
    },
    map: {
        tileLayer: 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoic3RhcmUiLCJhIjoiNGQxOGM0Yzk0ZjQ2ZjJhMGMyY2I3ZDBlYTEzNmJjM2MifQ.fBHV208tbilSeMaNQIa9zQ',
        layerOptions: {
            maxZoom: 18,
            detectRetina: true,
            id: 'stare.op5mde27'
        },
        center: [37.8, -96.9],
        zoomLevel: 4
    }
};

var Choropleth = function (_AbstractBasicCartesi) {
    inherits(Choropleth, _AbstractBasicCartesi);

    function Choropleth(canvasId, _userOptions, geoJson) {
        classCallCheck$1(this, Choropleth);

        var _this = possibleConstructorReturn(this, (Choropleth.__proto__ || Object.getPrototypeOf(Choropleth)).call(this, canvasId, _userOptions));

        if (check(geoJson) === false) {
            console.log('geojson is not provided, U.S.states geojson will be used.');
            _this._data = cloneDeep$2(UsGeoJson);
        } else {
            _this._data = cloneDeep$2(geoJson);
        }

        _this._mapId = 'map-' + uuid();
        _this._canvasLayer;
        _this._tileLayer;
        _this._map;

        _this._c = function (d) {
            return _this._getMetricVal(d) === 0 ? _this._options.plots.emptyDataColor : _this._color(_this._getMetricVal(d));
        };
        return _this;
    }

    createClass$1(Choropleth, [{
        key: 'render',
        value: function render(_data) {
            var _this2 = this;

            this.data(_data);

            var _array = _data.map(this._getMetricVal);
            this._color = genericColor(this._options.color, _array);

            var that = this;

            this._canvasLayer = select(this._containerId).append('div').attr('id', this._mapId).attr('class', 'vizart-chart').style('width', this._options.chart.innerWidth + 'px').style('height', this._options.chart.innerHeight + 'px').style('top', this._options.chart.margin.top + 'px').style('left', this._options.chart.margin.left + 'px').style('position', 'relative');

            this._tooltip = select(this._containerId).append("div").attr('id', 'tooltip-' + uuid()).attr('class', 'vizart-tooltip').style("opacity", 0);

            this._map = new L.Map(this._mapId).setView(this._options.map.center, this._options.map.zoomLevel);

            this._tileLayer = new L.TileLayer(this._options.map.tileLayer, this._options.map.layerOptions);

            this._map.addLayer(this._tileLayer);

            this._svg = select(this._map.getPanes().overlayPane).append('svg').style('position', 'relative').attr('class', 'vizart-map');

            var g = this._svg.append('g').attr('class', 'leaflet-zoom-hide');

            var projectPoint = function projectPoint(x, y) {
                var point = that._map.latLngToLayerPoint(new L.LatLng(y, x));
                this.stream.point(point.x, point.y);
            };

            var transform = geoTransform({ point: projectPoint });
            var path = geoPath().projection(transform);

            var svgPath = g.selectAll('path').data(this._data.features).enter().append('path').attr('class', 'path').attr('fill-opacity', this._options.plots.fillOpacity).attr('stroke', this._options.plots.stroke).attr('stroke-width', this._options.plots.strokeWidth).attr('fill', this._c);

            var reset = function reset() {
                var bounds$$1 = path.bounds(_this2._data);
                var topLeft = bounds$$1[0];
                var bottomRight = bounds$$1[1];

                _this2._svg.attr('width', bottomRight[0] - topLeft[0]).attr('height', bottomRight[1] - topLeft[1]).style('left', topLeft[0] + 'px').style('top', topLeft[1] + 'px');

                g.attr('transform', 'translate(' + -topLeft[0] + ',' + -topLeft[1] + ')');

                svgPath.attr('d', path);
            };

            // according to http://stackoverflow.com/questions/40915225/event-viewreset-is-not-fired-in-leaflet-version-1-0-2
            this._map.on('zoom', reset);

            reset();

            svgPath.on('mousemove', function (d) {
                that._tooltip.style("opacity", 1);

                var coordinates = mouse(this);
                var x = coordinates[0];
                var y = coordinates[1];

                that._tooltip.style("left", x < 40 ? x : x - 22 + "px").style("top", y < 40 ? y + 34 : y - 34 + "px").html(that._getTooltipHTML(d));
            }).on('mouseout', function (d) {
                that._tooltip.style("opacity", 0);
            });
        }
    }, {
        key: '_bindDataToGeo',
        value: function _bindDataToGeo(rawData) {
            var _this3 = this;

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                var _loop = function _loop() {
                    var d = _step.value;

                    var province = d.properties.name;

                    var datum = find$1(rawData, function (cDatum) {
                        return _this3._getDimensionVal(cDatum) === province;
                    });

                    if (!datum) {
                        d[_this3._getMetric().accessor] = 0;
                    } else {
                        d[_this3._getMetric().accessor] = _this3._getMetricVal(datum);
                    }

                    d[_this3._getDimension().accessor] = province;
                };

                for (var _iterator = this._data.features[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    _loop();
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }
        }
    }, {
        key: 'changeRasterLayer',
        value: function changeRasterLayer(_rasterLayer, _token) {
            this._options.map.tileLayer = _rasterLayer;
            this._options.map.layerOptions.id = _token;

            this._map.removeLayer(this._tileLayer);

            this._tileLayer = new L.TileLayer(this._options.map.tileLayer, this._options.map.layerOptions);

            this._map.addLayer(this._tileLayer);
        }
    }, {
        key: 'data',
        value: function data(_data) {
            if (check(_data) === true) {
                var cartesianData = processCartesianData(_data, this._options);
                this._bindDataToGeo(cartesianData);
            }

            return this._data;
        }
    }, {
        key: '_provideColorScale',
        value: function _provideColorScale() {
            var _array = this._data.features.map(this._getMetricVal);

            return genericColor(this._options.color, _array);
        }
    }, {
        key: 'transitionColor',
        value: function transitionColor(colorOptions) {
            get$2(Choropleth.prototype.__proto__ || Object.getPrototypeOf(Choropleth.prototype), 'transitionColor', this).call(this, colorOptions);

            this._svg.selectAll('.path').transition().duration(this._options.animation.duration.quickUpdate).delay(function (d, i) {
                return i * 50;
            }).attr('fill', this._c);
        }
    }, {
        key: 'createOptions',
        value: function createOptions(_userOpt) {
            return createCartesianOpt(DefaultOptions, _userOpt);
        }
    }]);
    return Choropleth;
}(AbstractBasicCartesianChart);

exports.version = version;
exports.Choropleth = Choropleth;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=vizart-geo.standalone.js.map
