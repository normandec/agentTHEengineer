var ClassroomBundle = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn, res, err2) => function __init() {
    if (err2) throw err2[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err2 = [e], e;
    }
  };
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // node_modules/@supabase/node-fetch/browser.js
  var browser_exports = {};
  __export(browser_exports, {
    Headers: () => Headers2,
    Request: () => Request,
    Response: () => Response2,
    default: () => browser_default,
    fetch: () => fetch2
  });
  var getGlobal, globalObject, fetch2, browser_default, Headers2, Request, Response2;
  var init_browser = __esm({
    "node_modules/@supabase/node-fetch/browser.js"() {
      "use strict";
      getGlobal = function() {
        if (typeof self !== "undefined") {
          return self;
        }
        if (typeof window !== "undefined") {
          return window;
        }
        if (typeof global !== "undefined") {
          return global;
        }
        throw new Error("unable to locate global object");
      };
      globalObject = getGlobal();
      fetch2 = globalObject.fetch;
      browser_default = globalObject.fetch.bind(globalObject);
      Headers2 = globalObject.Headers;
      Request = globalObject.Request;
      Response2 = globalObject.Response;
    }
  });

  // node_modules/@supabase/postgrest-js/dist/cjs/PostgrestError.js
  var require_PostgrestError = __commonJS({
    "node_modules/@supabase/postgrest-js/dist/cjs/PostgrestError.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var PostgrestError = class extends Error {
        constructor(context) {
          super(context.message);
          this.name = "PostgrestError";
          this.details = context.details;
          this.hint = context.hint;
          this.code = context.code;
        }
      };
      exports.default = PostgrestError;
    }
  });

  // node_modules/@supabase/postgrest-js/dist/cjs/PostgrestBuilder.js
  var require_PostgrestBuilder = __commonJS({
    "node_modules/@supabase/postgrest-js/dist/cjs/PostgrestBuilder.js"(exports) {
      "use strict";
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      var node_fetch_1 = __importDefault((init_browser(), __toCommonJS(browser_exports)));
      var PostgrestError_1 = __importDefault(require_PostgrestError());
      var PostgrestBuilder2 = class {
        constructor(builder) {
          this.shouldThrowOnError = false;
          this.method = builder.method;
          this.url = builder.url;
          this.headers = builder.headers;
          this.schema = builder.schema;
          this.body = builder.body;
          this.shouldThrowOnError = builder.shouldThrowOnError;
          this.signal = builder.signal;
          this.isMaybeSingle = builder.isMaybeSingle;
          if (builder.fetch) {
            this.fetch = builder.fetch;
          } else if (typeof fetch === "undefined") {
            this.fetch = node_fetch_1.default;
          } else {
            this.fetch = fetch;
          }
        }
        /**
         * If there's an error with the query, throwOnError will reject the promise by
         * throwing the error instead of returning it as part of a successful response.
         *
         * {@link https://github.com/supabase/supabase-js/issues/92}
         */
        throwOnError() {
          this.shouldThrowOnError = true;
          return this;
        }
        /**
         * Set an HTTP header for the request.
         */
        setHeader(name, value) {
          this.headers = Object.assign({}, this.headers);
          this.headers[name] = value;
          return this;
        }
        then(onfulfilled, onrejected) {
          if (this.schema === void 0) {
          } else if (["GET", "HEAD"].includes(this.method)) {
            this.headers["Accept-Profile"] = this.schema;
          } else {
            this.headers["Content-Profile"] = this.schema;
          }
          if (this.method !== "GET" && this.method !== "HEAD") {
            this.headers["Content-Type"] = "application/json";
          }
          const _fetch = this.fetch;
          let res = _fetch(this.url.toString(), {
            method: this.method,
            headers: this.headers,
            body: JSON.stringify(this.body),
            signal: this.signal
          }).then(async (res2) => {
            var _a, _b, _c;
            let error = null;
            let data = null;
            let count = null;
            let status = res2.status;
            let statusText = res2.statusText;
            if (res2.ok) {
              if (this.method !== "HEAD") {
                const body = await res2.text();
                if (body === "") {
                } else if (this.headers["Accept"] === "text/csv") {
                  data = body;
                } else if (this.headers["Accept"] && this.headers["Accept"].includes("application/vnd.pgrst.plan+text")) {
                  data = body;
                } else {
                  data = JSON.parse(body);
                }
              }
              const countHeader = (_a = this.headers["Prefer"]) === null || _a === void 0 ? void 0 : _a.match(/count=(exact|planned|estimated)/);
              const contentRange = (_b = res2.headers.get("content-range")) === null || _b === void 0 ? void 0 : _b.split("/");
              if (countHeader && contentRange && contentRange.length > 1) {
                count = parseInt(contentRange[1]);
              }
              if (this.isMaybeSingle && this.method === "GET" && Array.isArray(data)) {
                if (data.length > 1) {
                  error = {
                    // https://github.com/PostgREST/postgrest/blob/a867d79c42419af16c18c3fb019eba8df992626f/src/PostgREST/Error.hs#L553
                    code: "PGRST116",
                    details: `Results contain ${data.length} rows, application/vnd.pgrst.object+json requires 1 row`,
                    hint: null,
                    message: "JSON object requested, multiple (or no) rows returned"
                  };
                  data = null;
                  count = null;
                  status = 406;
                  statusText = "Not Acceptable";
                } else if (data.length === 1) {
                  data = data[0];
                } else {
                  data = null;
                }
              }
            } else {
              const body = await res2.text();
              try {
                error = JSON.parse(body);
                if (Array.isArray(error) && res2.status === 404) {
                  data = [];
                  error = null;
                  status = 200;
                  statusText = "OK";
                }
              } catch (_d) {
                if (res2.status === 404 && body === "") {
                  status = 204;
                  statusText = "No Content";
                } else {
                  error = {
                    message: body
                  };
                }
              }
              if (error && this.isMaybeSingle && ((_c = error === null || error === void 0 ? void 0 : error.details) === null || _c === void 0 ? void 0 : _c.includes("0 rows"))) {
                error = null;
                status = 200;
                statusText = "OK";
              }
              if (error && this.shouldThrowOnError) {
                throw new PostgrestError_1.default(error);
              }
            }
            const postgrestResponse = {
              error,
              data,
              count,
              status,
              statusText
            };
            return postgrestResponse;
          });
          if (!this.shouldThrowOnError) {
            res = res.catch((fetchError) => {
              var _a, _b, _c;
              return {
                error: {
                  message: `${(_a = fetchError === null || fetchError === void 0 ? void 0 : fetchError.name) !== null && _a !== void 0 ? _a : "FetchError"}: ${fetchError === null || fetchError === void 0 ? void 0 : fetchError.message}`,
                  details: `${(_b = fetchError === null || fetchError === void 0 ? void 0 : fetchError.stack) !== null && _b !== void 0 ? _b : ""}`,
                  hint: "",
                  code: `${(_c = fetchError === null || fetchError === void 0 ? void 0 : fetchError.code) !== null && _c !== void 0 ? _c : ""}`
                },
                data: null,
                count: null,
                status: 0,
                statusText: ""
              };
            });
          }
          return res.then(onfulfilled, onrejected);
        }
      };
      exports.default = PostgrestBuilder2;
    }
  });

  // node_modules/@supabase/postgrest-js/dist/cjs/PostgrestTransformBuilder.js
  var require_PostgrestTransformBuilder = __commonJS({
    "node_modules/@supabase/postgrest-js/dist/cjs/PostgrestTransformBuilder.js"(exports) {
      "use strict";
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      var PostgrestBuilder_1 = __importDefault(require_PostgrestBuilder());
      var PostgrestTransformBuilder2 = class extends PostgrestBuilder_1.default {
        /**
         * Perform a SELECT on the query result.
         *
         * By default, `.insert()`, `.update()`, `.upsert()`, and `.delete()` do not
         * return modified rows. By calling this method, modified rows are returned in
         * `data`.
         *
         * @param columns - The columns to retrieve, separated by commas
         */
        select(columns) {
          let quoted = false;
          const cleanedColumns = (columns !== null && columns !== void 0 ? columns : "*").split("").map((c) => {
            if (/\s/.test(c) && !quoted) {
              return "";
            }
            if (c === '"') {
              quoted = !quoted;
            }
            return c;
          }).join("");
          this.url.searchParams.set("select", cleanedColumns);
          if (this.headers["Prefer"]) {
            this.headers["Prefer"] += ",";
          }
          this.headers["Prefer"] += "return=representation";
          return this;
        }
        /**
         * Order the query result by `column`.
         *
         * You can call this method multiple times to order by multiple columns.
         *
         * You can order referenced tables, but it only affects the ordering of the
         * parent table if you use `!inner` in the query.
         *
         * @param column - The column to order by
         * @param options - Named parameters
         * @param options.ascending - If `true`, the result will be in ascending order
         * @param options.nullsFirst - If `true`, `null`s appear first. If `false`,
         * `null`s appear last.
         * @param options.referencedTable - Set this to order a referenced table by
         * its columns
         * @param options.foreignTable - Deprecated, use `options.referencedTable`
         * instead
         */
        order(column, { ascending = true, nullsFirst, foreignTable, referencedTable = foreignTable } = {}) {
          const key = referencedTable ? `${referencedTable}.order` : "order";
          const existingOrder = this.url.searchParams.get(key);
          this.url.searchParams.set(key, `${existingOrder ? `${existingOrder},` : ""}${column}.${ascending ? "asc" : "desc"}${nullsFirst === void 0 ? "" : nullsFirst ? ".nullsfirst" : ".nullslast"}`);
          return this;
        }
        /**
         * Limit the query result by `count`.
         *
         * @param count - The maximum number of rows to return
         * @param options - Named parameters
         * @param options.referencedTable - Set this to limit rows of referenced
         * tables instead of the parent table
         * @param options.foreignTable - Deprecated, use `options.referencedTable`
         * instead
         */
        limit(count, { foreignTable, referencedTable = foreignTable } = {}) {
          const key = typeof referencedTable === "undefined" ? "limit" : `${referencedTable}.limit`;
          this.url.searchParams.set(key, `${count}`);
          return this;
        }
        /**
         * Limit the query result by starting at an offset `from` and ending at the offset `to`.
         * Only records within this range are returned.
         * This respects the query order and if there is no order clause the range could behave unexpectedly.
         * The `from` and `to` values are 0-based and inclusive: `range(1, 3)` will include the second, third
         * and fourth rows of the query.
         *
         * @param from - The starting index from which to limit the result
         * @param to - The last index to which to limit the result
         * @param options - Named parameters
         * @param options.referencedTable - Set this to limit rows of referenced
         * tables instead of the parent table
         * @param options.foreignTable - Deprecated, use `options.referencedTable`
         * instead
         */
        range(from, to, { foreignTable, referencedTable = foreignTable } = {}) {
          const keyOffset = typeof referencedTable === "undefined" ? "offset" : `${referencedTable}.offset`;
          const keyLimit = typeof referencedTable === "undefined" ? "limit" : `${referencedTable}.limit`;
          this.url.searchParams.set(keyOffset, `${from}`);
          this.url.searchParams.set(keyLimit, `${to - from + 1}`);
          return this;
        }
        /**
         * Set the AbortSignal for the fetch request.
         *
         * @param signal - The AbortSignal to use for the fetch request
         */
        abortSignal(signal) {
          this.signal = signal;
          return this;
        }
        /**
         * Return `data` as a single object instead of an array of objects.
         *
         * Query result must be one row (e.g. using `.limit(1)`), otherwise this
         * returns an error.
         */
        single() {
          this.headers["Accept"] = "application/vnd.pgrst.object+json";
          return this;
        }
        /**
         * Return `data` as a single object instead of an array of objects.
         *
         * Query result must be zero or one row (e.g. using `.limit(1)`), otherwise
         * this returns an error.
         */
        maybeSingle() {
          if (this.method === "GET") {
            this.headers["Accept"] = "application/json";
          } else {
            this.headers["Accept"] = "application/vnd.pgrst.object+json";
          }
          this.isMaybeSingle = true;
          return this;
        }
        /**
         * Return `data` as a string in CSV format.
         */
        csv() {
          this.headers["Accept"] = "text/csv";
          return this;
        }
        /**
         * Return `data` as an object in [GeoJSON](https://geojson.org) format.
         */
        geojson() {
          this.headers["Accept"] = "application/geo+json";
          return this;
        }
        /**
         * Return `data` as the EXPLAIN plan for the query.
         *
         * You need to enable the
         * [db_plan_enabled](https://supabase.com/docs/guides/database/debugging-performance#enabling-explain)
         * setting before using this method.
         *
         * @param options - Named parameters
         *
         * @param options.analyze - If `true`, the query will be executed and the
         * actual run time will be returned
         *
         * @param options.verbose - If `true`, the query identifier will be returned
         * and `data` will include the output columns of the query
         *
         * @param options.settings - If `true`, include information on configuration
         * parameters that affect query planning
         *
         * @param options.buffers - If `true`, include information on buffer usage
         *
         * @param options.wal - If `true`, include information on WAL record generation
         *
         * @param options.format - The format of the output, can be `"text"` (default)
         * or `"json"`
         */
        explain({ analyze = false, verbose = false, settings = false, buffers = false, wal = false, format = "text" } = {}) {
          var _a;
          const options = [
            analyze ? "analyze" : null,
            verbose ? "verbose" : null,
            settings ? "settings" : null,
            buffers ? "buffers" : null,
            wal ? "wal" : null
          ].filter(Boolean).join("|");
          const forMediatype = (_a = this.headers["Accept"]) !== null && _a !== void 0 ? _a : "application/json";
          this.headers["Accept"] = `application/vnd.pgrst.plan+${format}; for="${forMediatype}"; options=${options};`;
          if (format === "json")
            return this;
          else
            return this;
        }
        /**
         * Rollback the query.
         *
         * `data` will still be returned, but the query is not committed.
         */
        rollback() {
          var _a;
          if (((_a = this.headers["Prefer"]) !== null && _a !== void 0 ? _a : "").trim().length > 0) {
            this.headers["Prefer"] += ",tx=rollback";
          } else {
            this.headers["Prefer"] = "tx=rollback";
          }
          return this;
        }
        /**
         * Override the type of the returned `data`.
         *
         * @typeParam NewResult - The new result type to override with
         */
        returns() {
          return this;
        }
      };
      exports.default = PostgrestTransformBuilder2;
    }
  });

  // node_modules/@supabase/postgrest-js/dist/cjs/PostgrestFilterBuilder.js
  var require_PostgrestFilterBuilder = __commonJS({
    "node_modules/@supabase/postgrest-js/dist/cjs/PostgrestFilterBuilder.js"(exports) {
      "use strict";
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      var PostgrestTransformBuilder_1 = __importDefault(require_PostgrestTransformBuilder());
      var PostgrestFilterBuilder2 = class extends PostgrestTransformBuilder_1.default {
        /**
         * Match only rows where `column` is equal to `value`.
         *
         * To check if the value of `column` is NULL, you should use `.is()` instead.
         *
         * @param column - The column to filter on
         * @param value - The value to filter with
         */
        eq(column, value) {
          this.url.searchParams.append(column, `eq.${value}`);
          return this;
        }
        /**
         * Match only rows where `column` is not equal to `value`.
         *
         * @param column - The column to filter on
         * @param value - The value to filter with
         */
        neq(column, value) {
          this.url.searchParams.append(column, `neq.${value}`);
          return this;
        }
        /**
         * Match only rows where `column` is greater than `value`.
         *
         * @param column - The column to filter on
         * @param value - The value to filter with
         */
        gt(column, value) {
          this.url.searchParams.append(column, `gt.${value}`);
          return this;
        }
        /**
         * Match only rows where `column` is greater than or equal to `value`.
         *
         * @param column - The column to filter on
         * @param value - The value to filter with
         */
        gte(column, value) {
          this.url.searchParams.append(column, `gte.${value}`);
          return this;
        }
        /**
         * Match only rows where `column` is less than `value`.
         *
         * @param column - The column to filter on
         * @param value - The value to filter with
         */
        lt(column, value) {
          this.url.searchParams.append(column, `lt.${value}`);
          return this;
        }
        /**
         * Match only rows where `column` is less than or equal to `value`.
         *
         * @param column - The column to filter on
         * @param value - The value to filter with
         */
        lte(column, value) {
          this.url.searchParams.append(column, `lte.${value}`);
          return this;
        }
        /**
         * Match only rows where `column` matches `pattern` case-sensitively.
         *
         * @param column - The column to filter on
         * @param pattern - The pattern to match with
         */
        like(column, pattern) {
          this.url.searchParams.append(column, `like.${pattern}`);
          return this;
        }
        /**
         * Match only rows where `column` matches all of `patterns` case-sensitively.
         *
         * @param column - The column to filter on
         * @param patterns - The patterns to match with
         */
        likeAllOf(column, patterns) {
          this.url.searchParams.append(column, `like(all).{${patterns.join(",")}}`);
          return this;
        }
        /**
         * Match only rows where `column` matches any of `patterns` case-sensitively.
         *
         * @param column - The column to filter on
         * @param patterns - The patterns to match with
         */
        likeAnyOf(column, patterns) {
          this.url.searchParams.append(column, `like(any).{${patterns.join(",")}}`);
          return this;
        }
        /**
         * Match only rows where `column` matches `pattern` case-insensitively.
         *
         * @param column - The column to filter on
         * @param pattern - The pattern to match with
         */
        ilike(column, pattern) {
          this.url.searchParams.append(column, `ilike.${pattern}`);
          return this;
        }
        /**
         * Match only rows where `column` matches all of `patterns` case-insensitively.
         *
         * @param column - The column to filter on
         * @param patterns - The patterns to match with
         */
        ilikeAllOf(column, patterns) {
          this.url.searchParams.append(column, `ilike(all).{${patterns.join(",")}}`);
          return this;
        }
        /**
         * Match only rows where `column` matches any of `patterns` case-insensitively.
         *
         * @param column - The column to filter on
         * @param patterns - The patterns to match with
         */
        ilikeAnyOf(column, patterns) {
          this.url.searchParams.append(column, `ilike(any).{${patterns.join(",")}}`);
          return this;
        }
        /**
         * Match only rows where `column` IS `value`.
         *
         * For non-boolean columns, this is only relevant for checking if the value of
         * `column` is NULL by setting `value` to `null`.
         *
         * For boolean columns, you can also set `value` to `true` or `false` and it
         * will behave the same way as `.eq()`.
         *
         * @param column - The column to filter on
         * @param value - The value to filter with
         */
        is(column, value) {
          this.url.searchParams.append(column, `is.${value}`);
          return this;
        }
        /**
         * Match only rows where `column` is included in the `values` array.
         *
         * @param column - The column to filter on
         * @param values - The values array to filter with
         */
        in(column, values) {
          const cleanedValues = Array.from(new Set(values)).map((s) => {
            if (typeof s === "string" && new RegExp("[,()]").test(s))
              return `"${s}"`;
            else
              return `${s}`;
          }).join(",");
          this.url.searchParams.append(column, `in.(${cleanedValues})`);
          return this;
        }
        /**
         * Only relevant for jsonb, array, and range columns. Match only rows where
         * `column` contains every element appearing in `value`.
         *
         * @param column - The jsonb, array, or range column to filter on
         * @param value - The jsonb, array, or range value to filter with
         */
        contains(column, value) {
          if (typeof value === "string") {
            this.url.searchParams.append(column, `cs.${value}`);
          } else if (Array.isArray(value)) {
            this.url.searchParams.append(column, `cs.{${value.join(",")}}`);
          } else {
            this.url.searchParams.append(column, `cs.${JSON.stringify(value)}`);
          }
          return this;
        }
        /**
         * Only relevant for jsonb, array, and range columns. Match only rows where
         * every element appearing in `column` is contained by `value`.
         *
         * @param column - The jsonb, array, or range column to filter on
         * @param value - The jsonb, array, or range value to filter with
         */
        containedBy(column, value) {
          if (typeof value === "string") {
            this.url.searchParams.append(column, `cd.${value}`);
          } else if (Array.isArray(value)) {
            this.url.searchParams.append(column, `cd.{${value.join(",")}}`);
          } else {
            this.url.searchParams.append(column, `cd.${JSON.stringify(value)}`);
          }
          return this;
        }
        /**
         * Only relevant for range columns. Match only rows where every element in
         * `column` is greater than any element in `range`.
         *
         * @param column - The range column to filter on
         * @param range - The range to filter with
         */
        rangeGt(column, range) {
          this.url.searchParams.append(column, `sr.${range}`);
          return this;
        }
        /**
         * Only relevant for range columns. Match only rows where every element in
         * `column` is either contained in `range` or greater than any element in
         * `range`.
         *
         * @param column - The range column to filter on
         * @param range - The range to filter with
         */
        rangeGte(column, range) {
          this.url.searchParams.append(column, `nxl.${range}`);
          return this;
        }
        /**
         * Only relevant for range columns. Match only rows where every element in
         * `column` is less than any element in `range`.
         *
         * @param column - The range column to filter on
         * @param range - The range to filter with
         */
        rangeLt(column, range) {
          this.url.searchParams.append(column, `sl.${range}`);
          return this;
        }
        /**
         * Only relevant for range columns. Match only rows where every element in
         * `column` is either contained in `range` or less than any element in
         * `range`.
         *
         * @param column - The range column to filter on
         * @param range - The range to filter with
         */
        rangeLte(column, range) {
          this.url.searchParams.append(column, `nxr.${range}`);
          return this;
        }
        /**
         * Only relevant for range columns. Match only rows where `column` is
         * mutually exclusive to `range` and there can be no element between the two
         * ranges.
         *
         * @param column - The range column to filter on
         * @param range - The range to filter with
         */
        rangeAdjacent(column, range) {
          this.url.searchParams.append(column, `adj.${range}`);
          return this;
        }
        /**
         * Only relevant for array and range columns. Match only rows where
         * `column` and `value` have an element in common.
         *
         * @param column - The array or range column to filter on
         * @param value - The array or range value to filter with
         */
        overlaps(column, value) {
          if (typeof value === "string") {
            this.url.searchParams.append(column, `ov.${value}`);
          } else {
            this.url.searchParams.append(column, `ov.{${value.join(",")}}`);
          }
          return this;
        }
        /**
         * Only relevant for text and tsvector columns. Match only rows where
         * `column` matches the query string in `query`.
         *
         * @param column - The text or tsvector column to filter on
         * @param query - The query text to match with
         * @param options - Named parameters
         * @param options.config - The text search configuration to use
         * @param options.type - Change how the `query` text is interpreted
         */
        textSearch(column, query, { config, type } = {}) {
          let typePart = "";
          if (type === "plain") {
            typePart = "pl";
          } else if (type === "phrase") {
            typePart = "ph";
          } else if (type === "websearch") {
            typePart = "w";
          }
          const configPart = config === void 0 ? "" : `(${config})`;
          this.url.searchParams.append(column, `${typePart}fts${configPart}.${query}`);
          return this;
        }
        /**
         * Match only rows where each column in `query` keys is equal to its
         * associated value. Shorthand for multiple `.eq()`s.
         *
         * @param query - The object to filter with, with column names as keys mapped
         * to their filter values
         */
        match(query) {
          Object.entries(query).forEach(([column, value]) => {
            this.url.searchParams.append(column, `eq.${value}`);
          });
          return this;
        }
        /**
         * Match only rows which doesn't satisfy the filter.
         *
         * Unlike most filters, `opearator` and `value` are used as-is and need to
         * follow [PostgREST
         * syntax](https://postgrest.org/en/stable/api.html#operators). You also need
         * to make sure they are properly sanitized.
         *
         * @param column - The column to filter on
         * @param operator - The operator to be negated to filter with, following
         * PostgREST syntax
         * @param value - The value to filter with, following PostgREST syntax
         */
        not(column, operator, value) {
          this.url.searchParams.append(column, `not.${operator}.${value}`);
          return this;
        }
        /**
         * Match only rows which satisfy at least one of the filters.
         *
         * Unlike most filters, `filters` is used as-is and needs to follow [PostgREST
         * syntax](https://postgrest.org/en/stable/api.html#operators). You also need
         * to make sure it's properly sanitized.
         *
         * It's currently not possible to do an `.or()` filter across multiple tables.
         *
         * @param filters - The filters to use, following PostgREST syntax
         * @param options - Named parameters
         * @param options.referencedTable - Set this to filter on referenced tables
         * instead of the parent table
         * @param options.foreignTable - Deprecated, use `referencedTable` instead
         */
        or(filters, { foreignTable, referencedTable = foreignTable } = {}) {
          const key = referencedTable ? `${referencedTable}.or` : "or";
          this.url.searchParams.append(key, `(${filters})`);
          return this;
        }
        /**
         * Match only rows which satisfy the filter. This is an escape hatch - you
         * should use the specific filter methods wherever possible.
         *
         * Unlike most filters, `opearator` and `value` are used as-is and need to
         * follow [PostgREST
         * syntax](https://postgrest.org/en/stable/api.html#operators). You also need
         * to make sure they are properly sanitized.
         *
         * @param column - The column to filter on
         * @param operator - The operator to filter with, following PostgREST syntax
         * @param value - The value to filter with, following PostgREST syntax
         */
        filter(column, operator, value) {
          this.url.searchParams.append(column, `${operator}.${value}`);
          return this;
        }
      };
      exports.default = PostgrestFilterBuilder2;
    }
  });

  // node_modules/@supabase/postgrest-js/dist/cjs/PostgrestQueryBuilder.js
  var require_PostgrestQueryBuilder = __commonJS({
    "node_modules/@supabase/postgrest-js/dist/cjs/PostgrestQueryBuilder.js"(exports) {
      "use strict";
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      var PostgrestFilterBuilder_1 = __importDefault(require_PostgrestFilterBuilder());
      var PostgrestQueryBuilder2 = class {
        constructor(url, { headers = {}, schema, fetch: fetch3 }) {
          this.url = url;
          this.headers = headers;
          this.schema = schema;
          this.fetch = fetch3;
        }
        /**
         * Perform a SELECT query on the table or view.
         *
         * @param columns - The columns to retrieve, separated by commas. Columns can be renamed when returned with `customName:columnName`
         *
         * @param options - Named parameters
         *
         * @param options.head - When set to `true`, `data` will not be returned.
         * Useful if you only need the count.
         *
         * @param options.count - Count algorithm to use to count rows in the table or view.
         *
         * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
         * hood.
         *
         * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
         * statistics under the hood.
         *
         * `"estimated"`: Uses exact count for low numbers and planned count for high
         * numbers.
         */
        select(columns, { head: head2 = false, count } = {}) {
          const method = head2 ? "HEAD" : "GET";
          let quoted = false;
          const cleanedColumns = (columns !== null && columns !== void 0 ? columns : "*").split("").map((c) => {
            if (/\s/.test(c) && !quoted) {
              return "";
            }
            if (c === '"') {
              quoted = !quoted;
            }
            return c;
          }).join("");
          this.url.searchParams.set("select", cleanedColumns);
          if (count) {
            this.headers["Prefer"] = `count=${count}`;
          }
          return new PostgrestFilterBuilder_1.default({
            method,
            url: this.url,
            headers: this.headers,
            schema: this.schema,
            fetch: this.fetch,
            allowEmpty: false
          });
        }
        /**
         * Perform an INSERT into the table or view.
         *
         * By default, inserted rows are not returned. To return it, chain the call
         * with `.select()`.
         *
         * @param values - The values to insert. Pass an object to insert a single row
         * or an array to insert multiple rows.
         *
         * @param options - Named parameters
         *
         * @param options.count - Count algorithm to use to count inserted rows.
         *
         * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
         * hood.
         *
         * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
         * statistics under the hood.
         *
         * `"estimated"`: Uses exact count for low numbers and planned count for high
         * numbers.
         *
         * @param options.defaultToNull - Make missing fields default to `null`.
         * Otherwise, use the default value for the column. Only applies for bulk
         * inserts.
         */
        insert(values, { count, defaultToNull = true } = {}) {
          const method = "POST";
          const prefersHeaders = [];
          if (this.headers["Prefer"]) {
            prefersHeaders.push(this.headers["Prefer"]);
          }
          if (count) {
            prefersHeaders.push(`count=${count}`);
          }
          if (!defaultToNull) {
            prefersHeaders.push("missing=default");
          }
          this.headers["Prefer"] = prefersHeaders.join(",");
          if (Array.isArray(values)) {
            const columns = values.reduce((acc, x) => acc.concat(Object.keys(x)), []);
            if (columns.length > 0) {
              const uniqueColumns = [...new Set(columns)].map((column) => `"${column}"`);
              this.url.searchParams.set("columns", uniqueColumns.join(","));
            }
          }
          return new PostgrestFilterBuilder_1.default({
            method,
            url: this.url,
            headers: this.headers,
            schema: this.schema,
            body: values,
            fetch: this.fetch,
            allowEmpty: false
          });
        }
        /**
         * Perform an UPSERT on the table or view. Depending on the column(s) passed
         * to `onConflict`, `.upsert()` allows you to perform the equivalent of
         * `.insert()` if a row with the corresponding `onConflict` columns doesn't
         * exist, or if it does exist, perform an alternative action depending on
         * `ignoreDuplicates`.
         *
         * By default, upserted rows are not returned. To return it, chain the call
         * with `.select()`.
         *
         * @param values - The values to upsert with. Pass an object to upsert a
         * single row or an array to upsert multiple rows.
         *
         * @param options - Named parameters
         *
         * @param options.onConflict - Comma-separated UNIQUE column(s) to specify how
         * duplicate rows are determined. Two rows are duplicates if all the
         * `onConflict` columns are equal.
         *
         * @param options.ignoreDuplicates - If `true`, duplicate rows are ignored. If
         * `false`, duplicate rows are merged with existing rows.
         *
         * @param options.count - Count algorithm to use to count upserted rows.
         *
         * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
         * hood.
         *
         * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
         * statistics under the hood.
         *
         * `"estimated"`: Uses exact count for low numbers and planned count for high
         * numbers.
         *
         * @param options.defaultToNull - Make missing fields default to `null`.
         * Otherwise, use the default value for the column. This only applies when
         * inserting new rows, not when merging with existing rows under
         * `ignoreDuplicates: false`. This also only applies when doing bulk upserts.
         */
        upsert(values, { onConflict, ignoreDuplicates = false, count, defaultToNull = true } = {}) {
          const method = "POST";
          const prefersHeaders = [`resolution=${ignoreDuplicates ? "ignore" : "merge"}-duplicates`];
          if (onConflict !== void 0)
            this.url.searchParams.set("on_conflict", onConflict);
          if (this.headers["Prefer"]) {
            prefersHeaders.push(this.headers["Prefer"]);
          }
          if (count) {
            prefersHeaders.push(`count=${count}`);
          }
          if (!defaultToNull) {
            prefersHeaders.push("missing=default");
          }
          this.headers["Prefer"] = prefersHeaders.join(",");
          if (Array.isArray(values)) {
            const columns = values.reduce((acc, x) => acc.concat(Object.keys(x)), []);
            if (columns.length > 0) {
              const uniqueColumns = [...new Set(columns)].map((column) => `"${column}"`);
              this.url.searchParams.set("columns", uniqueColumns.join(","));
            }
          }
          return new PostgrestFilterBuilder_1.default({
            method,
            url: this.url,
            headers: this.headers,
            schema: this.schema,
            body: values,
            fetch: this.fetch,
            allowEmpty: false
          });
        }
        /**
         * Perform an UPDATE on the table or view.
         *
         * By default, updated rows are not returned. To return it, chain the call
         * with `.select()` after filters.
         *
         * @param values - The values to update with
         *
         * @param options - Named parameters
         *
         * @param options.count - Count algorithm to use to count updated rows.
         *
         * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
         * hood.
         *
         * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
         * statistics under the hood.
         *
         * `"estimated"`: Uses exact count for low numbers and planned count for high
         * numbers.
         */
        update(values, { count } = {}) {
          const method = "PATCH";
          const prefersHeaders = [];
          if (this.headers["Prefer"]) {
            prefersHeaders.push(this.headers["Prefer"]);
          }
          if (count) {
            prefersHeaders.push(`count=${count}`);
          }
          this.headers["Prefer"] = prefersHeaders.join(",");
          return new PostgrestFilterBuilder_1.default({
            method,
            url: this.url,
            headers: this.headers,
            schema: this.schema,
            body: values,
            fetch: this.fetch,
            allowEmpty: false
          });
        }
        /**
         * Perform a DELETE on the table or view.
         *
         * By default, deleted rows are not returned. To return it, chain the call
         * with `.select()` after filters.
         *
         * @param options - Named parameters
         *
         * @param options.count - Count algorithm to use to count deleted rows.
         *
         * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
         * hood.
         *
         * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
         * statistics under the hood.
         *
         * `"estimated"`: Uses exact count for low numbers and planned count for high
         * numbers.
         */
        delete({ count } = {}) {
          const method = "DELETE";
          const prefersHeaders = [];
          if (count) {
            prefersHeaders.push(`count=${count}`);
          }
          if (this.headers["Prefer"]) {
            prefersHeaders.unshift(this.headers["Prefer"]);
          }
          this.headers["Prefer"] = prefersHeaders.join(",");
          return new PostgrestFilterBuilder_1.default({
            method,
            url: this.url,
            headers: this.headers,
            schema: this.schema,
            fetch: this.fetch,
            allowEmpty: false
          });
        }
      };
      exports.default = PostgrestQueryBuilder2;
    }
  });

  // node_modules/@supabase/postgrest-js/dist/cjs/version.js
  var require_version = __commonJS({
    "node_modules/@supabase/postgrest-js/dist/cjs/version.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.version = void 0;
      exports.version = "0.0.0-automated";
    }
  });

  // node_modules/@supabase/postgrest-js/dist/cjs/constants.js
  var require_constants = __commonJS({
    "node_modules/@supabase/postgrest-js/dist/cjs/constants.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.DEFAULT_HEADERS = void 0;
      var version_1 = require_version();
      exports.DEFAULT_HEADERS = { "X-Client-Info": `postgrest-js/${version_1.version}` };
    }
  });

  // node_modules/@supabase/postgrest-js/dist/cjs/PostgrestClient.js
  var require_PostgrestClient = __commonJS({
    "node_modules/@supabase/postgrest-js/dist/cjs/PostgrestClient.js"(exports) {
      "use strict";
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      var PostgrestQueryBuilder_1 = __importDefault(require_PostgrestQueryBuilder());
      var PostgrestFilterBuilder_1 = __importDefault(require_PostgrestFilterBuilder());
      var constants_1 = require_constants();
      var PostgrestClient2 = class _PostgrestClient {
        // TODO: Add back shouldThrowOnError once we figure out the typings
        /**
         * Creates a PostgREST client.
         *
         * @param url - URL of the PostgREST endpoint
         * @param options - Named parameters
         * @param options.headers - Custom headers
         * @param options.schema - Postgres schema to switch to
         * @param options.fetch - Custom fetch
         */
        constructor(url, { headers = {}, schema, fetch: fetch3 } = {}) {
          this.url = url;
          this.headers = Object.assign(Object.assign({}, constants_1.DEFAULT_HEADERS), headers);
          this.schemaName = schema;
          this.fetch = fetch3;
        }
        /**
         * Perform a query on a table or a view.
         *
         * @param relation - The table or view name to query
         */
        from(relation) {
          const url = new URL(`${this.url}/${relation}`);
          return new PostgrestQueryBuilder_1.default(url, {
            headers: Object.assign({}, this.headers),
            schema: this.schemaName,
            fetch: this.fetch
          });
        }
        /**
         * Select a schema to query or perform an function (rpc) call.
         *
         * The schema needs to be on the list of exposed schemas inside Supabase.
         *
         * @param schema - The schema to query
         */
        schema(schema) {
          return new _PostgrestClient(this.url, {
            headers: this.headers,
            schema,
            fetch: this.fetch
          });
        }
        /**
         * Perform a function call.
         *
         * @param fn - The function name to call
         * @param args - The arguments to pass to the function call
         * @param options - Named parameters
         * @param options.head - When set to `true`, `data` will not be returned.
         * Useful if you only need the count.
         * @param options.get - When set to `true`, the function will be called with
         * read-only access mode.
         * @param options.count - Count algorithm to use to count rows returned by the
         * function. Only applicable for [set-returning
         * functions](https://www.postgresql.org/docs/current/functions-srf.html).
         *
         * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
         * hood.
         *
         * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
         * statistics under the hood.
         *
         * `"estimated"`: Uses exact count for low numbers and planned count for high
         * numbers.
         */
        rpc(fn, args = {}, { head: head2 = false, get: get2 = false, count } = {}) {
          let method;
          const url = new URL(`${this.url}/rpc/${fn}`);
          let body;
          if (head2 || get2) {
            method = head2 ? "HEAD" : "GET";
            Object.entries(args).filter(([_, value]) => value !== void 0).map(([name, value]) => [name, Array.isArray(value) ? `{${value.join(",")}}` : `${value}`]).forEach(([name, value]) => {
              url.searchParams.append(name, value);
            });
          } else {
            method = "POST";
            body = args;
          }
          const headers = Object.assign({}, this.headers);
          if (count) {
            headers["Prefer"] = `count=${count}`;
          }
          return new PostgrestFilterBuilder_1.default({
            method,
            url,
            headers,
            schema: this.schemaName,
            body,
            fetch: this.fetch,
            allowEmpty: false
          });
        }
      };
      exports.default = PostgrestClient2;
    }
  });

  // node_modules/@supabase/postgrest-js/dist/cjs/index.js
  var require_cjs = __commonJS({
    "node_modules/@supabase/postgrest-js/dist/cjs/index.js"(exports) {
      "use strict";
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.PostgrestBuilder = exports.PostgrestTransformBuilder = exports.PostgrestFilterBuilder = exports.PostgrestQueryBuilder = exports.PostgrestClient = void 0;
      var PostgrestClient_1 = __importDefault(require_PostgrestClient());
      exports.PostgrestClient = PostgrestClient_1.default;
      var PostgrestQueryBuilder_1 = __importDefault(require_PostgrestQueryBuilder());
      exports.PostgrestQueryBuilder = PostgrestQueryBuilder_1.default;
      var PostgrestFilterBuilder_1 = __importDefault(require_PostgrestFilterBuilder());
      exports.PostgrestFilterBuilder = PostgrestFilterBuilder_1.default;
      var PostgrestTransformBuilder_1 = __importDefault(require_PostgrestTransformBuilder());
      exports.PostgrestTransformBuilder = PostgrestTransformBuilder_1.default;
      var PostgrestBuilder_1 = __importDefault(require_PostgrestBuilder());
      exports.PostgrestBuilder = PostgrestBuilder_1.default;
      exports.default = {
        PostgrestClient: PostgrestClient_1.default,
        PostgrestQueryBuilder: PostgrestQueryBuilder_1.default,
        PostgrestFilterBuilder: PostgrestFilterBuilder_1.default,
        PostgrestTransformBuilder: PostgrestTransformBuilder_1.default,
        PostgrestBuilder: PostgrestBuilder_1.default
      };
    }
  });

  // node_modules/ws/browser.js
  var require_browser = __commonJS({
    "node_modules/ws/browser.js"(exports, module) {
      "use strict";
      module.exports = function() {
        throw new Error(
          "ws does not work in the browser. Browser clients must use the native WebSocket object"
        );
      };
    }
  });

  // .classroom-deploy.ts
  var classroom_deploy_exports = {};
  __export(classroom_deploy_exports, {
    handler: () => handler
  });

  // node_modules/@supabase/functions-js/dist/module/helper.js
  var resolveFetch = (customFetch) => {
    let _fetch;
    if (customFetch) {
      _fetch = customFetch;
    } else if (typeof fetch === "undefined") {
      _fetch = (...args) => Promise.resolve().then(() => (init_browser(), browser_exports)).then(({ default: fetch3 }) => fetch3(...args));
    } else {
      _fetch = fetch;
    }
    return (...args) => _fetch(...args);
  };

  // node_modules/@supabase/functions-js/dist/module/types.js
  var FunctionsError = class extends Error {
    constructor(message, name = "FunctionsError", context) {
      super(message);
      this.name = name;
      this.context = context;
    }
  };
  var FunctionsFetchError = class extends FunctionsError {
    constructor(context) {
      super("Failed to send a request to the Edge Function", "FunctionsFetchError", context);
    }
  };
  var FunctionsRelayError = class extends FunctionsError {
    constructor(context) {
      super("Relay Error invoking the Edge Function", "FunctionsRelayError", context);
    }
  };
  var FunctionsHttpError = class extends FunctionsError {
    constructor(context) {
      super("Edge Function returned a non-2xx status code", "FunctionsHttpError", context);
    }
  };
  var FunctionRegion;
  (function(FunctionRegion2) {
    FunctionRegion2["Any"] = "any";
    FunctionRegion2["ApNortheast1"] = "ap-northeast-1";
    FunctionRegion2["ApNortheast2"] = "ap-northeast-2";
    FunctionRegion2["ApSouth1"] = "ap-south-1";
    FunctionRegion2["ApSoutheast1"] = "ap-southeast-1";
    FunctionRegion2["ApSoutheast2"] = "ap-southeast-2";
    FunctionRegion2["CaCentral1"] = "ca-central-1";
    FunctionRegion2["EuCentral1"] = "eu-central-1";
    FunctionRegion2["EuWest1"] = "eu-west-1";
    FunctionRegion2["EuWest2"] = "eu-west-2";
    FunctionRegion2["EuWest3"] = "eu-west-3";
    FunctionRegion2["SaEast1"] = "sa-east-1";
    FunctionRegion2["UsEast1"] = "us-east-1";
    FunctionRegion2["UsWest1"] = "us-west-1";
    FunctionRegion2["UsWest2"] = "us-west-2";
  })(FunctionRegion || (FunctionRegion = {}));

  // node_modules/@supabase/functions-js/dist/module/FunctionsClient.js
  var __awaiter = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  var FunctionsClient = class {
    constructor(url, { headers = {}, customFetch, region = FunctionRegion.Any } = {}) {
      this.url = url;
      this.headers = headers;
      this.region = region;
      this.fetch = resolveFetch(customFetch);
    }
    /**
     * Updates the authorization header
     * @param token - the new jwt token sent in the authorisation header
     */
    setAuth(token) {
      this.headers.Authorization = `Bearer ${token}`;
    }
    /**
     * Invokes a function
     * @param functionName - The name of the Function to invoke.
     * @param options - Options for invoking the Function.
     */
    invoke(functionName, options = {}) {
      var _a;
      return __awaiter(this, void 0, void 0, function* () {
        try {
          const { headers, method, body: functionArgs } = options;
          let _headers = {};
          let { region } = options;
          if (!region) {
            region = this.region;
          }
          if (region && region !== "any") {
            _headers["x-region"] = region;
          }
          let body;
          if (functionArgs && (headers && !Object.prototype.hasOwnProperty.call(headers, "Content-Type") || !headers)) {
            if (typeof Blob !== "undefined" && functionArgs instanceof Blob || functionArgs instanceof ArrayBuffer) {
              _headers["Content-Type"] = "application/octet-stream";
              body = functionArgs;
            } else if (typeof functionArgs === "string") {
              _headers["Content-Type"] = "text/plain";
              body = functionArgs;
            } else if (typeof FormData !== "undefined" && functionArgs instanceof FormData) {
              body = functionArgs;
            } else {
              _headers["Content-Type"] = "application/json";
              body = JSON.stringify(functionArgs);
            }
          }
          const response = yield this.fetch(`${this.url}/${functionName}`, {
            method: method || "POST",
            // headers priority is (high to low):
            // 1. invoke-level headers
            // 2. client-level headers
            // 3. default Content-Type header
            headers: Object.assign(Object.assign(Object.assign({}, _headers), this.headers), headers),
            body
          }).catch((fetchError) => {
            throw new FunctionsFetchError(fetchError);
          });
          const isRelayError = response.headers.get("x-relay-error");
          if (isRelayError && isRelayError === "true") {
            throw new FunctionsRelayError(response);
          }
          if (!response.ok) {
            throw new FunctionsHttpError(response);
          }
          let responseType = ((_a = response.headers.get("Content-Type")) !== null && _a !== void 0 ? _a : "text/plain").split(";")[0].trim();
          let data;
          if (responseType === "application/json") {
            data = yield response.json();
          } else if (responseType === "application/octet-stream") {
            data = yield response.blob();
          } else if (responseType === "text/event-stream") {
            data = response;
          } else if (responseType === "multipart/form-data") {
            data = yield response.formData();
          } else {
            data = yield response.text();
          }
          return { data, error: null };
        } catch (error) {
          return { data: null, error };
        }
      });
    }
  };

  // node_modules/@supabase/postgrest-js/dist/esm/wrapper.mjs
  var import_cjs = __toESM(require_cjs(), 1);
  var {
    PostgrestClient,
    PostgrestQueryBuilder,
    PostgrestFilterBuilder,
    PostgrestTransformBuilder,
    PostgrestBuilder
  } = import_cjs.default;

  // node_modules/@supabase/realtime-js/dist/module/lib/version.js
  var version = "2.10.2";

  // node_modules/@supabase/realtime-js/dist/module/lib/constants.js
  var DEFAULT_HEADERS = { "X-Client-Info": `realtime-js/${version}` };
  var VSN = "1.0.0";
  var DEFAULT_TIMEOUT = 1e4;
  var WS_CLOSE_NORMAL = 1e3;
  var SOCKET_STATES;
  (function(SOCKET_STATES2) {
    SOCKET_STATES2[SOCKET_STATES2["connecting"] = 0] = "connecting";
    SOCKET_STATES2[SOCKET_STATES2["open"] = 1] = "open";
    SOCKET_STATES2[SOCKET_STATES2["closing"] = 2] = "closing";
    SOCKET_STATES2[SOCKET_STATES2["closed"] = 3] = "closed";
  })(SOCKET_STATES || (SOCKET_STATES = {}));
  var CHANNEL_STATES;
  (function(CHANNEL_STATES2) {
    CHANNEL_STATES2["closed"] = "closed";
    CHANNEL_STATES2["errored"] = "errored";
    CHANNEL_STATES2["joined"] = "joined";
    CHANNEL_STATES2["joining"] = "joining";
    CHANNEL_STATES2["leaving"] = "leaving";
  })(CHANNEL_STATES || (CHANNEL_STATES = {}));
  var CHANNEL_EVENTS;
  (function(CHANNEL_EVENTS2) {
    CHANNEL_EVENTS2["close"] = "phx_close";
    CHANNEL_EVENTS2["error"] = "phx_error";
    CHANNEL_EVENTS2["join"] = "phx_join";
    CHANNEL_EVENTS2["reply"] = "phx_reply";
    CHANNEL_EVENTS2["leave"] = "phx_leave";
    CHANNEL_EVENTS2["access_token"] = "access_token";
  })(CHANNEL_EVENTS || (CHANNEL_EVENTS = {}));
  var TRANSPORTS;
  (function(TRANSPORTS2) {
    TRANSPORTS2["websocket"] = "websocket";
  })(TRANSPORTS || (TRANSPORTS = {}));
  var CONNECTION_STATE;
  (function(CONNECTION_STATE2) {
    CONNECTION_STATE2["Connecting"] = "connecting";
    CONNECTION_STATE2["Open"] = "open";
    CONNECTION_STATE2["Closing"] = "closing";
    CONNECTION_STATE2["Closed"] = "closed";
  })(CONNECTION_STATE || (CONNECTION_STATE = {}));

  // node_modules/@supabase/realtime-js/dist/module/lib/serializer.js
  var Serializer = class {
    constructor() {
      this.HEADER_LENGTH = 1;
    }
    decode(rawPayload, callback) {
      if (rawPayload.constructor === ArrayBuffer) {
        return callback(this._binaryDecode(rawPayload));
      }
      if (typeof rawPayload === "string") {
        return callback(JSON.parse(rawPayload));
      }
      return callback({});
    }
    _binaryDecode(buffer) {
      const view = new DataView(buffer);
      const decoder = new TextDecoder();
      return this._decodeBroadcast(buffer, view, decoder);
    }
    _decodeBroadcast(buffer, view, decoder) {
      const topicSize = view.getUint8(1);
      const eventSize = view.getUint8(2);
      let offset = this.HEADER_LENGTH + 2;
      const topic = decoder.decode(buffer.slice(offset, offset + topicSize));
      offset = offset + topicSize;
      const event = decoder.decode(buffer.slice(offset, offset + eventSize));
      offset = offset + eventSize;
      const data = JSON.parse(decoder.decode(buffer.slice(offset, buffer.byteLength)));
      return { ref: null, topic, event, payload: data };
    }
  };

  // node_modules/@supabase/realtime-js/dist/module/lib/timer.js
  var Timer = class {
    constructor(callback, timerCalc) {
      this.callback = callback;
      this.timerCalc = timerCalc;
      this.timer = void 0;
      this.tries = 0;
      this.callback = callback;
      this.timerCalc = timerCalc;
    }
    reset() {
      this.tries = 0;
      clearTimeout(this.timer);
    }
    // Cancels any previous scheduleTimeout and schedules callback
    scheduleTimeout() {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.tries = this.tries + 1;
        this.callback();
      }, this.timerCalc(this.tries + 1));
    }
  };

  // node_modules/@supabase/realtime-js/dist/module/lib/transformers.js
  var PostgresTypes;
  (function(PostgresTypes2) {
    PostgresTypes2["abstime"] = "abstime";
    PostgresTypes2["bool"] = "bool";
    PostgresTypes2["date"] = "date";
    PostgresTypes2["daterange"] = "daterange";
    PostgresTypes2["float4"] = "float4";
    PostgresTypes2["float8"] = "float8";
    PostgresTypes2["int2"] = "int2";
    PostgresTypes2["int4"] = "int4";
    PostgresTypes2["int4range"] = "int4range";
    PostgresTypes2["int8"] = "int8";
    PostgresTypes2["int8range"] = "int8range";
    PostgresTypes2["json"] = "json";
    PostgresTypes2["jsonb"] = "jsonb";
    PostgresTypes2["money"] = "money";
    PostgresTypes2["numeric"] = "numeric";
    PostgresTypes2["oid"] = "oid";
    PostgresTypes2["reltime"] = "reltime";
    PostgresTypes2["text"] = "text";
    PostgresTypes2["time"] = "time";
    PostgresTypes2["timestamp"] = "timestamp";
    PostgresTypes2["timestamptz"] = "timestamptz";
    PostgresTypes2["timetz"] = "timetz";
    PostgresTypes2["tsrange"] = "tsrange";
    PostgresTypes2["tstzrange"] = "tstzrange";
  })(PostgresTypes || (PostgresTypes = {}));
  var convertChangeData = (columns, record, options = {}) => {
    var _a;
    const skipTypes = (_a = options.skipTypes) !== null && _a !== void 0 ? _a : [];
    return Object.keys(record).reduce((acc, rec_key) => {
      acc[rec_key] = convertColumn(rec_key, columns, record, skipTypes);
      return acc;
    }, {});
  };
  var convertColumn = (columnName, columns, record, skipTypes) => {
    const column = columns.find((x) => x.name === columnName);
    const colType = column === null || column === void 0 ? void 0 : column.type;
    const value = record[columnName];
    if (colType && !skipTypes.includes(colType)) {
      return convertCell(colType, value);
    }
    return noop(value);
  };
  var convertCell = (type, value) => {
    if (type.charAt(0) === "_") {
      const dataType = type.slice(1, type.length);
      return toArray(value, dataType);
    }
    switch (type) {
      case PostgresTypes.bool:
        return toBoolean(value);
      case PostgresTypes.float4:
      case PostgresTypes.float8:
      case PostgresTypes.int2:
      case PostgresTypes.int4:
      case PostgresTypes.int8:
      case PostgresTypes.numeric:
      case PostgresTypes.oid:
        return toNumber(value);
      case PostgresTypes.json:
      case PostgresTypes.jsonb:
        return toJson(value);
      case PostgresTypes.timestamp:
        return toTimestampString(value);
      // Format to be consistent with PostgREST
      case PostgresTypes.abstime:
      // To allow users to cast it based on Timezone
      case PostgresTypes.date:
      // To allow users to cast it based on Timezone
      case PostgresTypes.daterange:
      case PostgresTypes.int4range:
      case PostgresTypes.int8range:
      case PostgresTypes.money:
      case PostgresTypes.reltime:
      // To allow users to cast it based on Timezone
      case PostgresTypes.text:
      case PostgresTypes.time:
      // To allow users to cast it based on Timezone
      case PostgresTypes.timestamptz:
      // To allow users to cast it based on Timezone
      case PostgresTypes.timetz:
      // To allow users to cast it based on Timezone
      case PostgresTypes.tsrange:
      case PostgresTypes.tstzrange:
        return noop(value);
      default:
        return noop(value);
    }
  };
  var noop = (value) => {
    return value;
  };
  var toBoolean = (value) => {
    switch (value) {
      case "t":
        return true;
      case "f":
        return false;
      default:
        return value;
    }
  };
  var toNumber = (value) => {
    if (typeof value === "string") {
      const parsedValue = parseFloat(value);
      if (!Number.isNaN(parsedValue)) {
        return parsedValue;
      }
    }
    return value;
  };
  var toJson = (value) => {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch (error) {
        console.log(`JSON parse error: ${error}`);
        return value;
      }
    }
    return value;
  };
  var toArray = (value, type) => {
    if (typeof value !== "string") {
      return value;
    }
    const lastIdx = value.length - 1;
    const closeBrace = value[lastIdx];
    const openBrace = value[0];
    if (openBrace === "{" && closeBrace === "}") {
      let arr;
      const valTrim = value.slice(1, lastIdx);
      try {
        arr = JSON.parse("[" + valTrim + "]");
      } catch (_) {
        arr = valTrim ? valTrim.split(",") : [];
      }
      return arr.map((val) => convertCell(type, val));
    }
    return value;
  };
  var toTimestampString = (value) => {
    if (typeof value === "string") {
      return value.replace(" ", "T");
    }
    return value;
  };
  var httpEndpointURL = (socketUrl) => {
    let url = socketUrl;
    url = url.replace(/^ws/i, "http");
    url = url.replace(/(\/socket\/websocket|\/socket|\/websocket)\/?$/i, "");
    return url.replace(/\/+$/, "");
  };

  // node_modules/@supabase/realtime-js/dist/module/lib/push.js
  var Push = class {
    /**
     * Initializes the Push
     *
     * @param channel The Channel
     * @param event The event, for example `"phx_join"`
     * @param payload The payload, for example `{user_id: 123}`
     * @param timeout The push timeout in milliseconds
     */
    constructor(channel, event, payload = {}, timeout = DEFAULT_TIMEOUT) {
      this.channel = channel;
      this.event = event;
      this.payload = payload;
      this.timeout = timeout;
      this.sent = false;
      this.timeoutTimer = void 0;
      this.ref = "";
      this.receivedResp = null;
      this.recHooks = [];
      this.refEvent = null;
    }
    resend(timeout) {
      this.timeout = timeout;
      this._cancelRefEvent();
      this.ref = "";
      this.refEvent = null;
      this.receivedResp = null;
      this.sent = false;
      this.send();
    }
    send() {
      if (this._hasReceived("timeout")) {
        return;
      }
      this.startTimeout();
      this.sent = true;
      this.channel.socket.push({
        topic: this.channel.topic,
        event: this.event,
        payload: this.payload,
        ref: this.ref,
        join_ref: this.channel._joinRef()
      });
    }
    updatePayload(payload) {
      this.payload = Object.assign(Object.assign({}, this.payload), payload);
    }
    receive(status, callback) {
      var _a;
      if (this._hasReceived(status)) {
        callback((_a = this.receivedResp) === null || _a === void 0 ? void 0 : _a.response);
      }
      this.recHooks.push({ status, callback });
      return this;
    }
    startTimeout() {
      if (this.timeoutTimer) {
        return;
      }
      this.ref = this.channel.socket._makeRef();
      this.refEvent = this.channel._replyEventName(this.ref);
      const callback = (payload) => {
        this._cancelRefEvent();
        this._cancelTimeout();
        this.receivedResp = payload;
        this._matchReceive(payload);
      };
      this.channel._on(this.refEvent, {}, callback);
      this.timeoutTimer = setTimeout(() => {
        this.trigger("timeout", {});
      }, this.timeout);
    }
    trigger(status, response) {
      if (this.refEvent)
        this.channel._trigger(this.refEvent, { status, response });
    }
    destroy() {
      this._cancelRefEvent();
      this._cancelTimeout();
    }
    _cancelRefEvent() {
      if (!this.refEvent) {
        return;
      }
      this.channel._off(this.refEvent, {});
    }
    _cancelTimeout() {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = void 0;
    }
    _matchReceive({ status, response }) {
      this.recHooks.filter((h) => h.status === status).forEach((h) => h.callback(response));
    }
    _hasReceived(status) {
      return this.receivedResp && this.receivedResp.status === status;
    }
  };

  // node_modules/@supabase/realtime-js/dist/module/RealtimePresence.js
  var REALTIME_PRESENCE_LISTEN_EVENTS;
  (function(REALTIME_PRESENCE_LISTEN_EVENTS2) {
    REALTIME_PRESENCE_LISTEN_EVENTS2["SYNC"] = "sync";
    REALTIME_PRESENCE_LISTEN_EVENTS2["JOIN"] = "join";
    REALTIME_PRESENCE_LISTEN_EVENTS2["LEAVE"] = "leave";
  })(REALTIME_PRESENCE_LISTEN_EVENTS || (REALTIME_PRESENCE_LISTEN_EVENTS = {}));
  var RealtimePresence = class _RealtimePresence {
    /**
     * Initializes the Presence.
     *
     * @param channel - The RealtimeChannel
     * @param opts - The options,
     *        for example `{events: {state: 'state', diff: 'diff'}}`
     */
    constructor(channel, opts) {
      this.channel = channel;
      this.state = {};
      this.pendingDiffs = [];
      this.joinRef = null;
      this.caller = {
        onJoin: () => {
        },
        onLeave: () => {
        },
        onSync: () => {
        }
      };
      const events = (opts === null || opts === void 0 ? void 0 : opts.events) || {
        state: "presence_state",
        diff: "presence_diff"
      };
      this.channel._on(events.state, {}, (newState) => {
        const { onJoin, onLeave, onSync } = this.caller;
        this.joinRef = this.channel._joinRef();
        this.state = _RealtimePresence.syncState(this.state, newState, onJoin, onLeave);
        this.pendingDiffs.forEach((diff) => {
          this.state = _RealtimePresence.syncDiff(this.state, diff, onJoin, onLeave);
        });
        this.pendingDiffs = [];
        onSync();
      });
      this.channel._on(events.diff, {}, (diff) => {
        const { onJoin, onLeave, onSync } = this.caller;
        if (this.inPendingSyncState()) {
          this.pendingDiffs.push(diff);
        } else {
          this.state = _RealtimePresence.syncDiff(this.state, diff, onJoin, onLeave);
          onSync();
        }
      });
      this.onJoin((key, currentPresences, newPresences) => {
        this.channel._trigger("presence", {
          event: "join",
          key,
          currentPresences,
          newPresences
        });
      });
      this.onLeave((key, currentPresences, leftPresences) => {
        this.channel._trigger("presence", {
          event: "leave",
          key,
          currentPresences,
          leftPresences
        });
      });
      this.onSync(() => {
        this.channel._trigger("presence", { event: "sync" });
      });
    }
    /**
     * Used to sync the list of presences on the server with the
     * client's state.
     *
     * An optional `onJoin` and `onLeave` callback can be provided to
     * react to changes in the client's local presences across
     * disconnects and reconnects with the server.
     *
     * @internal
     */
    static syncState(currentState, newState, onJoin, onLeave) {
      const state = this.cloneDeep(currentState);
      const transformedState = this.transformState(newState);
      const joins = {};
      const leaves = {};
      this.map(state, (key, presences) => {
        if (!transformedState[key]) {
          leaves[key] = presences;
        }
      });
      this.map(transformedState, (key, newPresences) => {
        const currentPresences = state[key];
        if (currentPresences) {
          const newPresenceRefs = newPresences.map((m) => m.presence_ref);
          const curPresenceRefs = currentPresences.map((m) => m.presence_ref);
          const joinedPresences = newPresences.filter((m) => curPresenceRefs.indexOf(m.presence_ref) < 0);
          const leftPresences = currentPresences.filter((m) => newPresenceRefs.indexOf(m.presence_ref) < 0);
          if (joinedPresences.length > 0) {
            joins[key] = joinedPresences;
          }
          if (leftPresences.length > 0) {
            leaves[key] = leftPresences;
          }
        } else {
          joins[key] = newPresences;
        }
      });
      return this.syncDiff(state, { joins, leaves }, onJoin, onLeave);
    }
    /**
     * Used to sync a diff of presence join and leave events from the
     * server, as they happen.
     *
     * Like `syncState`, `syncDiff` accepts optional `onJoin` and
     * `onLeave` callbacks to react to a user joining or leaving from a
     * device.
     *
     * @internal
     */
    static syncDiff(state, diff, onJoin, onLeave) {
      const { joins, leaves } = {
        joins: this.transformState(diff.joins),
        leaves: this.transformState(diff.leaves)
      };
      if (!onJoin) {
        onJoin = () => {
        };
      }
      if (!onLeave) {
        onLeave = () => {
        };
      }
      this.map(joins, (key, newPresences) => {
        var _a;
        const currentPresences = (_a = state[key]) !== null && _a !== void 0 ? _a : [];
        state[key] = this.cloneDeep(newPresences);
        if (currentPresences.length > 0) {
          const joinedPresenceRefs = state[key].map((m) => m.presence_ref);
          const curPresences = currentPresences.filter((m) => joinedPresenceRefs.indexOf(m.presence_ref) < 0);
          state[key].unshift(...curPresences);
        }
        onJoin(key, currentPresences, newPresences);
      });
      this.map(leaves, (key, leftPresences) => {
        let currentPresences = state[key];
        if (!currentPresences)
          return;
        const presenceRefsToRemove = leftPresences.map((m) => m.presence_ref);
        currentPresences = currentPresences.filter((m) => presenceRefsToRemove.indexOf(m.presence_ref) < 0);
        state[key] = currentPresences;
        onLeave(key, currentPresences, leftPresences);
        if (currentPresences.length === 0)
          delete state[key];
      });
      return state;
    }
    /** @internal */
    static map(obj, func) {
      return Object.getOwnPropertyNames(obj).map((key) => func(key, obj[key]));
    }
    /**
     * Remove 'metas' key
     * Change 'phx_ref' to 'presence_ref'
     * Remove 'phx_ref' and 'phx_ref_prev'
     *
     * @example
     * // returns {
     *  abc123: [
     *    { presence_ref: '2', user_id: 1 },
     *    { presence_ref: '3', user_id: 2 }
     *  ]
     * }
     * RealtimePresence.transformState({
     *  abc123: {
     *    metas: [
     *      { phx_ref: '2', phx_ref_prev: '1' user_id: 1 },
     *      { phx_ref: '3', user_id: 2 }
     *    ]
     *  }
     * })
     *
     * @internal
     */
    static transformState(state) {
      state = this.cloneDeep(state);
      return Object.getOwnPropertyNames(state).reduce((newState, key) => {
        const presences = state[key];
        if ("metas" in presences) {
          newState[key] = presences.metas.map((presence) => {
            presence["presence_ref"] = presence["phx_ref"];
            delete presence["phx_ref"];
            delete presence["phx_ref_prev"];
            return presence;
          });
        } else {
          newState[key] = presences;
        }
        return newState;
      }, {});
    }
    /** @internal */
    static cloneDeep(obj) {
      return JSON.parse(JSON.stringify(obj));
    }
    /** @internal */
    onJoin(callback) {
      this.caller.onJoin = callback;
    }
    /** @internal */
    onLeave(callback) {
      this.caller.onLeave = callback;
    }
    /** @internal */
    onSync(callback) {
      this.caller.onSync = callback;
    }
    /** @internal */
    inPendingSyncState() {
      return !this.joinRef || this.joinRef !== this.channel._joinRef();
    }
  };

  // node_modules/@supabase/realtime-js/dist/module/RealtimeChannel.js
  var REALTIME_POSTGRES_CHANGES_LISTEN_EVENT;
  (function(REALTIME_POSTGRES_CHANGES_LISTEN_EVENT2) {
    REALTIME_POSTGRES_CHANGES_LISTEN_EVENT2["ALL"] = "*";
    REALTIME_POSTGRES_CHANGES_LISTEN_EVENT2["INSERT"] = "INSERT";
    REALTIME_POSTGRES_CHANGES_LISTEN_EVENT2["UPDATE"] = "UPDATE";
    REALTIME_POSTGRES_CHANGES_LISTEN_EVENT2["DELETE"] = "DELETE";
  })(REALTIME_POSTGRES_CHANGES_LISTEN_EVENT || (REALTIME_POSTGRES_CHANGES_LISTEN_EVENT = {}));
  var REALTIME_LISTEN_TYPES;
  (function(REALTIME_LISTEN_TYPES2) {
    REALTIME_LISTEN_TYPES2["BROADCAST"] = "broadcast";
    REALTIME_LISTEN_TYPES2["PRESENCE"] = "presence";
    REALTIME_LISTEN_TYPES2["POSTGRES_CHANGES"] = "postgres_changes";
  })(REALTIME_LISTEN_TYPES || (REALTIME_LISTEN_TYPES = {}));
  var REALTIME_SUBSCRIBE_STATES;
  (function(REALTIME_SUBSCRIBE_STATES2) {
    REALTIME_SUBSCRIBE_STATES2["SUBSCRIBED"] = "SUBSCRIBED";
    REALTIME_SUBSCRIBE_STATES2["TIMED_OUT"] = "TIMED_OUT";
    REALTIME_SUBSCRIBE_STATES2["CLOSED"] = "CLOSED";
    REALTIME_SUBSCRIBE_STATES2["CHANNEL_ERROR"] = "CHANNEL_ERROR";
  })(REALTIME_SUBSCRIBE_STATES || (REALTIME_SUBSCRIBE_STATES = {}));
  var RealtimeChannel = class _RealtimeChannel {
    constructor(topic, params = { config: {} }, socket) {
      this.topic = topic;
      this.params = params;
      this.socket = socket;
      this.bindings = {};
      this.state = CHANNEL_STATES.closed;
      this.joinedOnce = false;
      this.pushBuffer = [];
      this.subTopic = topic.replace(/^realtime:/i, "");
      this.params.config = Object.assign({
        broadcast: { ack: false, self: false },
        presence: { key: "" },
        private: false
      }, params.config);
      this.timeout = this.socket.timeout;
      this.joinPush = new Push(this, CHANNEL_EVENTS.join, this.params, this.timeout);
      this.rejoinTimer = new Timer(() => this._rejoinUntilConnected(), this.socket.reconnectAfterMs);
      this.joinPush.receive("ok", () => {
        this.state = CHANNEL_STATES.joined;
        this.rejoinTimer.reset();
        this.pushBuffer.forEach((pushEvent) => pushEvent.send());
        this.pushBuffer = [];
      });
      this._onClose(() => {
        this.rejoinTimer.reset();
        this.socket.log("channel", `close ${this.topic} ${this._joinRef()}`);
        this.state = CHANNEL_STATES.closed;
        this.socket._remove(this);
      });
      this._onError((reason) => {
        if (this._isLeaving() || this._isClosed()) {
          return;
        }
        this.socket.log("channel", `error ${this.topic}`, reason);
        this.state = CHANNEL_STATES.errored;
        this.rejoinTimer.scheduleTimeout();
      });
      this.joinPush.receive("timeout", () => {
        if (!this._isJoining()) {
          return;
        }
        this.socket.log("channel", `timeout ${this.topic}`, this.joinPush.timeout);
        this.state = CHANNEL_STATES.errored;
        this.rejoinTimer.scheduleTimeout();
      });
      this._on(CHANNEL_EVENTS.reply, {}, (payload, ref) => {
        this._trigger(this._replyEventName(ref), payload);
      });
      this.presence = new RealtimePresence(this);
      this.broadcastEndpointURL = httpEndpointURL(this.socket.endPoint) + "/api/broadcast";
    }
    /** Subscribe registers your client with the server */
    subscribe(callback, timeout = this.timeout) {
      var _a, _b;
      if (!this.socket.isConnected()) {
        this.socket.connect();
      }
      if (this.joinedOnce) {
        throw `tried to subscribe multiple times. 'subscribe' can only be called a single time per channel instance`;
      } else {
        const { config: { broadcast, presence, private: isPrivate } } = this.params;
        this._onError((e) => callback && callback("CHANNEL_ERROR", e));
        this._onClose(() => callback && callback("CLOSED"));
        const accessTokenPayload = {};
        const config = {
          broadcast,
          presence,
          postgres_changes: (_b = (_a = this.bindings.postgres_changes) === null || _a === void 0 ? void 0 : _a.map((r) => r.filter)) !== null && _b !== void 0 ? _b : [],
          private: isPrivate
        };
        if (this.socket.accessToken) {
          accessTokenPayload.access_token = this.socket.accessToken;
        }
        this.updateJoinPayload(Object.assign({ config }, accessTokenPayload));
        this.joinedOnce = true;
        this._rejoin(timeout);
        this.joinPush.receive("ok", ({ postgres_changes: serverPostgresFilters }) => {
          var _a2;
          this.socket.accessToken && this.socket.setAuth(this.socket.accessToken);
          if (serverPostgresFilters === void 0) {
            callback && callback("SUBSCRIBED");
            return;
          } else {
            const clientPostgresBindings = this.bindings.postgres_changes;
            const bindingsLen = (_a2 = clientPostgresBindings === null || clientPostgresBindings === void 0 ? void 0 : clientPostgresBindings.length) !== null && _a2 !== void 0 ? _a2 : 0;
            const newPostgresBindings = [];
            for (let i = 0; i < bindingsLen; i++) {
              const clientPostgresBinding = clientPostgresBindings[i];
              const { filter: { event, schema, table, filter } } = clientPostgresBinding;
              const serverPostgresFilter = serverPostgresFilters && serverPostgresFilters[i];
              if (serverPostgresFilter && serverPostgresFilter.event === event && serverPostgresFilter.schema === schema && serverPostgresFilter.table === table && serverPostgresFilter.filter === filter) {
                newPostgresBindings.push(Object.assign(Object.assign({}, clientPostgresBinding), { id: serverPostgresFilter.id }));
              } else {
                this.unsubscribe();
                callback && callback("CHANNEL_ERROR", new Error("mismatch between server and client bindings for postgres changes"));
                return;
              }
            }
            this.bindings.postgres_changes = newPostgresBindings;
            callback && callback("SUBSCRIBED");
            return;
          }
        }).receive("error", (error) => {
          callback && callback("CHANNEL_ERROR", new Error(JSON.stringify(Object.values(error).join(", ") || "error")));
          return;
        }).receive("timeout", () => {
          callback && callback("TIMED_OUT");
          return;
        });
      }
      return this;
    }
    presenceState() {
      return this.presence.state;
    }
    async track(payload, opts = {}) {
      return await this.send({
        type: "presence",
        event: "track",
        payload
      }, opts.timeout || this.timeout);
    }
    async untrack(opts = {}) {
      return await this.send({
        type: "presence",
        event: "untrack"
      }, opts);
    }
    on(type, filter, callback) {
      return this._on(type, filter, callback);
    }
    /**
     * Sends a message into the channel.
     *
     * @param args Arguments to send to channel
     * @param args.type The type of event to send
     * @param args.event The name of the event being sent
     * @param args.payload Payload to be sent
     * @param opts Options to be used during the send process
     */
    async send(args, opts = {}) {
      var _a, _b;
      if (!this._canPush() && args.type === "broadcast") {
        const { event, payload: endpoint_payload } = args;
        const options = {
          method: "POST",
          headers: {
            Authorization: this.socket.accessToken ? `Bearer ${this.socket.accessToken}` : "",
            apikey: this.socket.apiKey ? this.socket.apiKey : "",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messages: [
              { topic: this.subTopic, event, payload: endpoint_payload }
            ]
          })
        };
        try {
          const response = await this._fetchWithTimeout(this.broadcastEndpointURL, options, (_a = opts.timeout) !== null && _a !== void 0 ? _a : this.timeout);
          await ((_b = response.body) === null || _b === void 0 ? void 0 : _b.cancel());
          return response.ok ? "ok" : "error";
        } catch (error) {
          if (error.name === "AbortError") {
            return "timed out";
          } else {
            return "error";
          }
        }
      } else {
        return new Promise((resolve) => {
          var _a2, _b2, _c;
          const push = this._push(args.type, args, opts.timeout || this.timeout);
          if (args.type === "broadcast" && !((_c = (_b2 = (_a2 = this.params) === null || _a2 === void 0 ? void 0 : _a2.config) === null || _b2 === void 0 ? void 0 : _b2.broadcast) === null || _c === void 0 ? void 0 : _c.ack)) {
            resolve("ok");
          }
          push.receive("ok", () => resolve("ok"));
          push.receive("error", () => resolve("error"));
          push.receive("timeout", () => resolve("timed out"));
        });
      }
    }
    updateJoinPayload(payload) {
      this.joinPush.updatePayload(payload);
    }
    /**
     * Leaves the channel.
     *
     * Unsubscribes from server events, and instructs channel to terminate on server.
     * Triggers onClose() hooks.
     *
     * To receive leave acknowledgements, use the a `receive` hook to bind to the server ack, ie:
     * channel.unsubscribe().receive("ok", () => alert("left!") )
     */
    unsubscribe(timeout = this.timeout) {
      this.state = CHANNEL_STATES.leaving;
      const onClose = () => {
        this.socket.log("channel", `leave ${this.topic}`);
        this._trigger(CHANNEL_EVENTS.close, "leave", this._joinRef());
      };
      this.rejoinTimer.reset();
      this.joinPush.destroy();
      return new Promise((resolve) => {
        const leavePush = new Push(this, CHANNEL_EVENTS.leave, {}, timeout);
        leavePush.receive("ok", () => {
          onClose();
          resolve("ok");
        }).receive("timeout", () => {
          onClose();
          resolve("timed out");
        }).receive("error", () => {
          resolve("error");
        });
        leavePush.send();
        if (!this._canPush()) {
          leavePush.trigger("ok", {});
        }
      });
    }
    /** @internal */
    async _fetchWithTimeout(url, options, timeout) {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      const response = await this.socket.fetch(url, Object.assign(Object.assign({}, options), { signal: controller.signal }));
      clearTimeout(id);
      return response;
    }
    /** @internal */
    _push(event, payload, timeout = this.timeout) {
      if (!this.joinedOnce) {
        throw `tried to push '${event}' to '${this.topic}' before joining. Use channel.subscribe() before pushing events`;
      }
      let pushEvent = new Push(this, event, payload, timeout);
      if (this._canPush()) {
        pushEvent.send();
      } else {
        pushEvent.startTimeout();
        this.pushBuffer.push(pushEvent);
      }
      return pushEvent;
    }
    /**
     * Overridable message hook
     *
     * Receives all events for specialized message handling before dispatching to the channel callbacks.
     * Must return the payload, modified or unmodified.
     *
     * @internal
     */
    _onMessage(_event, payload, _ref) {
      return payload;
    }
    /** @internal */
    _isMember(topic) {
      return this.topic === topic;
    }
    /** @internal */
    _joinRef() {
      return this.joinPush.ref;
    }
    /** @internal */
    _trigger(type, payload, ref) {
      var _a, _b;
      const typeLower = type.toLocaleLowerCase();
      const { close, error, leave, join } = CHANNEL_EVENTS;
      const events = [close, error, leave, join];
      if (ref && events.indexOf(typeLower) >= 0 && ref !== this._joinRef()) {
        return;
      }
      let handledPayload = this._onMessage(typeLower, payload, ref);
      if (payload && !handledPayload) {
        throw "channel onMessage callbacks must return the payload, modified or unmodified";
      }
      if (["insert", "update", "delete"].includes(typeLower)) {
        (_a = this.bindings.postgres_changes) === null || _a === void 0 ? void 0 : _a.filter((bind) => {
          var _a2, _b2, _c;
          return ((_a2 = bind.filter) === null || _a2 === void 0 ? void 0 : _a2.event) === "*" || ((_c = (_b2 = bind.filter) === null || _b2 === void 0 ? void 0 : _b2.event) === null || _c === void 0 ? void 0 : _c.toLocaleLowerCase()) === typeLower;
        }).map((bind) => bind.callback(handledPayload, ref));
      } else {
        (_b = this.bindings[typeLower]) === null || _b === void 0 ? void 0 : _b.filter((bind) => {
          var _a2, _b2, _c, _d, _e, _f;
          if (["broadcast", "presence", "postgres_changes"].includes(typeLower)) {
            if ("id" in bind) {
              const bindId = bind.id;
              const bindEvent = (_a2 = bind.filter) === null || _a2 === void 0 ? void 0 : _a2.event;
              return bindId && ((_b2 = payload.ids) === null || _b2 === void 0 ? void 0 : _b2.includes(bindId)) && (bindEvent === "*" || (bindEvent === null || bindEvent === void 0 ? void 0 : bindEvent.toLocaleLowerCase()) === ((_c = payload.data) === null || _c === void 0 ? void 0 : _c.type.toLocaleLowerCase()));
            } else {
              const bindEvent = (_e = (_d = bind === null || bind === void 0 ? void 0 : bind.filter) === null || _d === void 0 ? void 0 : _d.event) === null || _e === void 0 ? void 0 : _e.toLocaleLowerCase();
              return bindEvent === "*" || bindEvent === ((_f = payload === null || payload === void 0 ? void 0 : payload.event) === null || _f === void 0 ? void 0 : _f.toLocaleLowerCase());
            }
          } else {
            return bind.type.toLocaleLowerCase() === typeLower;
          }
        }).map((bind) => {
          if (typeof handledPayload === "object" && "ids" in handledPayload) {
            const postgresChanges = handledPayload.data;
            const { schema, table, commit_timestamp, type: type2, errors } = postgresChanges;
            const enrichedPayload = {
              schema,
              table,
              commit_timestamp,
              eventType: type2,
              new: {},
              old: {},
              errors
            };
            handledPayload = Object.assign(Object.assign({}, enrichedPayload), this._getPayloadRecords(postgresChanges));
          }
          bind.callback(handledPayload, ref);
        });
      }
    }
    /** @internal */
    _isClosed() {
      return this.state === CHANNEL_STATES.closed;
    }
    /** @internal */
    _isJoined() {
      return this.state === CHANNEL_STATES.joined;
    }
    /** @internal */
    _isJoining() {
      return this.state === CHANNEL_STATES.joining;
    }
    /** @internal */
    _isLeaving() {
      return this.state === CHANNEL_STATES.leaving;
    }
    /** @internal */
    _replyEventName(ref) {
      return `chan_reply_${ref}`;
    }
    /** @internal */
    _on(type, filter, callback) {
      const typeLower = type.toLocaleLowerCase();
      const binding = {
        type: typeLower,
        filter,
        callback
      };
      if (this.bindings[typeLower]) {
        this.bindings[typeLower].push(binding);
      } else {
        this.bindings[typeLower] = [binding];
      }
      return this;
    }
    /** @internal */
    _off(type, filter) {
      const typeLower = type.toLocaleLowerCase();
      this.bindings[typeLower] = this.bindings[typeLower].filter((bind) => {
        var _a;
        return !(((_a = bind.type) === null || _a === void 0 ? void 0 : _a.toLocaleLowerCase()) === typeLower && _RealtimeChannel.isEqual(bind.filter, filter));
      });
      return this;
    }
    /** @internal */
    static isEqual(obj1, obj2) {
      if (Object.keys(obj1).length !== Object.keys(obj2).length) {
        return false;
      }
      for (const k in obj1) {
        if (obj1[k] !== obj2[k]) {
          return false;
        }
      }
      return true;
    }
    /** @internal */
    _rejoinUntilConnected() {
      this.rejoinTimer.scheduleTimeout();
      if (this.socket.isConnected()) {
        this._rejoin();
      }
    }
    /**
     * Registers a callback that will be executed when the channel closes.
     *
     * @internal
     */
    _onClose(callback) {
      this._on(CHANNEL_EVENTS.close, {}, callback);
    }
    /**
     * Registers a callback that will be executed when the channel encounteres an error.
     *
     * @internal
     */
    _onError(callback) {
      this._on(CHANNEL_EVENTS.error, {}, (reason) => callback(reason));
    }
    /**
     * Returns `true` if the socket is connected and the channel has been joined.
     *
     * @internal
     */
    _canPush() {
      return this.socket.isConnected() && this._isJoined();
    }
    /** @internal */
    _rejoin(timeout = this.timeout) {
      if (this._isLeaving()) {
        return;
      }
      this.socket._leaveOpenTopic(this.topic);
      this.state = CHANNEL_STATES.joining;
      this.joinPush.resend(timeout);
    }
    /** @internal */
    _getPayloadRecords(payload) {
      const records = {
        new: {},
        old: {}
      };
      if (payload.type === "INSERT" || payload.type === "UPDATE") {
        records.new = convertChangeData(payload.columns, payload.record);
      }
      if (payload.type === "UPDATE" || payload.type === "DELETE") {
        records.old = convertChangeData(payload.columns, payload.old_record);
      }
      return records;
    }
  };

  // node_modules/@supabase/realtime-js/dist/module/RealtimeClient.js
  var noop2 = () => {
  };
  var NATIVE_WEBSOCKET_AVAILABLE = typeof WebSocket !== "undefined";
  var RealtimeClient = class {
    /**
     * Initializes the Socket.
     *
     * @param endPoint The string WebSocket endpoint, ie, "ws://example.com/socket", "wss://example.com", "/socket" (inherited host & protocol)
     * @param httpEndpoint The string HTTP endpoint, ie, "https://example.com", "/" (inherited host & protocol)
     * @param options.transport The Websocket Transport, for example WebSocket.
     * @param options.timeout The default timeout in milliseconds to trigger push timeouts.
     * @param options.params The optional params to pass when connecting.
     * @param options.headers The optional headers to pass when connecting.
     * @param options.heartbeatIntervalMs The millisec interval to send a heartbeat message.
     * @param options.logger The optional function for specialized logging, ie: logger: (kind, msg, data) => { console.log(`${kind}: ${msg}`, data) }
     * @param options.encode The function to encode outgoing messages. Defaults to JSON: (payload, callback) => callback(JSON.stringify(payload))
     * @param options.decode The function to decode incoming messages. Defaults to Serializer's decode.
     * @param options.reconnectAfterMs he optional function that returns the millsec reconnect interval. Defaults to stepped backoff off.
     */
    constructor(endPoint, options) {
      var _a;
      this.accessToken = null;
      this.apiKey = null;
      this.channels = [];
      this.endPoint = "";
      this.httpEndpoint = "";
      this.headers = DEFAULT_HEADERS;
      this.params = {};
      this.timeout = DEFAULT_TIMEOUT;
      this.heartbeatIntervalMs = 3e4;
      this.heartbeatTimer = void 0;
      this.pendingHeartbeatRef = null;
      this.ref = 0;
      this.logger = noop2;
      this.conn = null;
      this.sendBuffer = [];
      this.serializer = new Serializer();
      this.stateChangeCallbacks = {
        open: [],
        close: [],
        error: [],
        message: []
      };
      this._resolveFetch = (customFetch) => {
        let _fetch;
        if (customFetch) {
          _fetch = customFetch;
        } else if (typeof fetch === "undefined") {
          _fetch = (...args) => Promise.resolve().then(() => (init_browser(), browser_exports)).then(({ default: fetch3 }) => fetch3(...args));
        } else {
          _fetch = fetch;
        }
        return (...args) => _fetch(...args);
      };
      this.endPoint = `${endPoint}/${TRANSPORTS.websocket}`;
      this.httpEndpoint = httpEndpointURL(endPoint);
      if (options === null || options === void 0 ? void 0 : options.transport) {
        this.transport = options.transport;
      } else {
        this.transport = null;
      }
      if (options === null || options === void 0 ? void 0 : options.params)
        this.params = options.params;
      if (options === null || options === void 0 ? void 0 : options.headers)
        this.headers = Object.assign(Object.assign({}, this.headers), options.headers);
      if (options === null || options === void 0 ? void 0 : options.timeout)
        this.timeout = options.timeout;
      if (options === null || options === void 0 ? void 0 : options.logger)
        this.logger = options.logger;
      if (options === null || options === void 0 ? void 0 : options.heartbeatIntervalMs)
        this.heartbeatIntervalMs = options.heartbeatIntervalMs;
      const accessToken = (_a = options === null || options === void 0 ? void 0 : options.params) === null || _a === void 0 ? void 0 : _a.apikey;
      if (accessToken) {
        this.accessToken = accessToken;
        this.apiKey = accessToken;
      }
      this.reconnectAfterMs = (options === null || options === void 0 ? void 0 : options.reconnectAfterMs) ? options.reconnectAfterMs : (tries) => {
        return [1e3, 2e3, 5e3, 1e4][tries - 1] || 1e4;
      };
      this.encode = (options === null || options === void 0 ? void 0 : options.encode) ? options.encode : (payload, callback) => {
        return callback(JSON.stringify(payload));
      };
      this.decode = (options === null || options === void 0 ? void 0 : options.decode) ? options.decode : this.serializer.decode.bind(this.serializer);
      this.reconnectTimer = new Timer(async () => {
        this.disconnect();
        this.connect();
      }, this.reconnectAfterMs);
      this.fetch = this._resolveFetch(options === null || options === void 0 ? void 0 : options.fetch);
    }
    /**
     * Connects the socket, unless already connected.
     */
    connect() {
      if (this.conn) {
        return;
      }
      if (this.transport) {
        this.conn = new this.transport(this._endPointURL(), void 0, {
          headers: this.headers
        });
        return;
      }
      if (NATIVE_WEBSOCKET_AVAILABLE) {
        this.conn = new WebSocket(this._endPointURL());
        this.setupConnection();
        return;
      }
      this.conn = new WSWebSocketDummy(this._endPointURL(), void 0, {
        close: () => {
          this.conn = null;
        }
      });
      Promise.resolve().then(() => __toESM(require_browser())).then(({ default: WS }) => {
        this.conn = new WS(this._endPointURL(), void 0, {
          headers: this.headers
        });
        this.setupConnection();
      });
    }
    /**
     * Disconnects the socket.
     *
     * @param code A numeric status code to send on disconnect.
     * @param reason A custom reason for the disconnect.
     */
    disconnect(code, reason) {
      if (this.conn) {
        this.conn.onclose = function() {
        };
        if (code) {
          this.conn.close(code, reason !== null && reason !== void 0 ? reason : "");
        } else {
          this.conn.close();
        }
        this.conn = null;
        this.heartbeatTimer && clearInterval(this.heartbeatTimer);
        this.reconnectTimer.reset();
      }
    }
    /**
     * Returns all created channels
     */
    getChannels() {
      return this.channels;
    }
    /**
     * Unsubscribes and removes a single channel
     * @param channel A RealtimeChannel instance
     */
    async removeChannel(channel) {
      const status = await channel.unsubscribe();
      if (this.channels.length === 0) {
        this.disconnect();
      }
      return status;
    }
    /**
     * Unsubscribes and removes all channels
     */
    async removeAllChannels() {
      const values_1 = await Promise.all(this.channels.map((channel) => channel.unsubscribe()));
      this.disconnect();
      return values_1;
    }
    /**
     * Logs the message.
     *
     * For customized logging, `this.logger` can be overridden.
     */
    log(kind, msg, data) {
      this.logger(kind, msg, data);
    }
    /**
     * Returns the current state of the socket.
     */
    connectionState() {
      switch (this.conn && this.conn.readyState) {
        case SOCKET_STATES.connecting:
          return CONNECTION_STATE.Connecting;
        case SOCKET_STATES.open:
          return CONNECTION_STATE.Open;
        case SOCKET_STATES.closing:
          return CONNECTION_STATE.Closing;
        default:
          return CONNECTION_STATE.Closed;
      }
    }
    /**
     * Returns `true` is the connection is open.
     */
    isConnected() {
      return this.connectionState() === CONNECTION_STATE.Open;
    }
    channel(topic, params = { config: {} }) {
      const chan = new RealtimeChannel(`realtime:${topic}`, params, this);
      this.channels.push(chan);
      return chan;
    }
    /**
     * Push out a message if the socket is connected.
     *
     * If the socket is not connected, the message gets enqueued within a local buffer, and sent out when a connection is next established.
     */
    push(data) {
      const { topic, event, payload, ref } = data;
      const callback = () => {
        this.encode(data, (result) => {
          var _a;
          (_a = this.conn) === null || _a === void 0 ? void 0 : _a.send(result);
        });
      };
      this.log("push", `${topic} ${event} (${ref})`, payload);
      if (this.isConnected()) {
        callback();
      } else {
        this.sendBuffer.push(callback);
      }
    }
    /**
     * Sets the JWT access token used for channel subscription authorization and Realtime RLS.
     *
     * @param token A JWT string.
     */
    setAuth(token) {
      this.accessToken = token;
      this.channels.forEach((channel) => {
        token && channel.updateJoinPayload({ access_token: token });
        if (channel.joinedOnce && channel._isJoined()) {
          channel._push(CHANNEL_EVENTS.access_token, { access_token: token });
        }
      });
    }
    /**
     * Return the next message ref, accounting for overflows
     *
     * @internal
     */
    _makeRef() {
      let newRef = this.ref + 1;
      if (newRef === this.ref) {
        this.ref = 0;
      } else {
        this.ref = newRef;
      }
      return this.ref.toString();
    }
    /**
     * Unsubscribe from channels with the specified topic.
     *
     * @internal
     */
    _leaveOpenTopic(topic) {
      let dupChannel = this.channels.find((c) => c.topic === topic && (c._isJoined() || c._isJoining()));
      if (dupChannel) {
        this.log("transport", `leaving duplicate topic "${topic}"`);
        dupChannel.unsubscribe();
      }
    }
    /**
     * Removes a subscription from the socket.
     *
     * @param channel An open subscription.
     *
     * @internal
     */
    _remove(channel) {
      this.channels = this.channels.filter((c) => c._joinRef() !== channel._joinRef());
    }
    /**
     * Sets up connection handlers.
     *
     * @internal
     */
    setupConnection() {
      if (this.conn) {
        this.conn.binaryType = "arraybuffer";
        this.conn.onopen = () => this._onConnOpen();
        this.conn.onerror = (error) => this._onConnError(error);
        this.conn.onmessage = (event) => this._onConnMessage(event);
        this.conn.onclose = (event) => this._onConnClose(event);
      }
    }
    /**
     * Returns the URL of the websocket.
     *
     * @internal
     */
    _endPointURL() {
      return this._appendParams(this.endPoint, Object.assign({}, this.params, { vsn: VSN }));
    }
    /** @internal */
    _onConnMessage(rawMessage) {
      this.decode(rawMessage.data, (msg) => {
        let { topic, event, payload, ref } = msg;
        if (ref && ref === this.pendingHeartbeatRef || event === (payload === null || payload === void 0 ? void 0 : payload.type)) {
          this.pendingHeartbeatRef = null;
        }
        this.log("receive", `${payload.status || ""} ${topic} ${event} ${ref && "(" + ref + ")" || ""}`, payload);
        this.channels.filter((channel) => channel._isMember(topic)).forEach((channel) => channel._trigger(event, payload, ref));
        this.stateChangeCallbacks.message.forEach((callback) => callback(msg));
      });
    }
    /** @internal */
    _onConnOpen() {
      this.log("transport", `connected to ${this._endPointURL()}`);
      this._flushSendBuffer();
      this.reconnectTimer.reset();
      this.heartbeatTimer && clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = setInterval(() => this._sendHeartbeat(), this.heartbeatIntervalMs);
      this.stateChangeCallbacks.open.forEach((callback) => callback());
    }
    /** @internal */
    _onConnClose(event) {
      this.log("transport", "close", event);
      this._triggerChanError();
      this.heartbeatTimer && clearInterval(this.heartbeatTimer);
      this.reconnectTimer.scheduleTimeout();
      this.stateChangeCallbacks.close.forEach((callback) => callback(event));
    }
    /** @internal */
    _onConnError(error) {
      this.log("transport", error.message);
      this._triggerChanError();
      this.stateChangeCallbacks.error.forEach((callback) => callback(error));
    }
    /** @internal */
    _triggerChanError() {
      this.channels.forEach((channel) => channel._trigger(CHANNEL_EVENTS.error));
    }
    /** @internal */
    _appendParams(url, params) {
      if (Object.keys(params).length === 0) {
        return url;
      }
      const prefix = url.match(/\?/) ? "&" : "?";
      const query = new URLSearchParams(params);
      return `${url}${prefix}${query}`;
    }
    /** @internal */
    _flushSendBuffer() {
      if (this.isConnected() && this.sendBuffer.length > 0) {
        this.sendBuffer.forEach((callback) => callback());
        this.sendBuffer = [];
      }
    }
    /** @internal */
    _sendHeartbeat() {
      var _a;
      if (!this.isConnected()) {
        return;
      }
      if (this.pendingHeartbeatRef) {
        this.pendingHeartbeatRef = null;
        this.log("transport", "heartbeat timeout. Attempting to re-establish connection");
        (_a = this.conn) === null || _a === void 0 ? void 0 : _a.close(WS_CLOSE_NORMAL, "hearbeat timeout");
        return;
      }
      this.pendingHeartbeatRef = this._makeRef();
      this.push({
        topic: "phoenix",
        event: "heartbeat",
        payload: {},
        ref: this.pendingHeartbeatRef
      });
      this.setAuth(this.accessToken);
    }
  };
  var WSWebSocketDummy = class {
    constructor(address, _protocols, options) {
      this.binaryType = "arraybuffer";
      this.onclose = () => {
      };
      this.onerror = () => {
      };
      this.onmessage = () => {
      };
      this.onopen = () => {
      };
      this.readyState = SOCKET_STATES.connecting;
      this.send = () => {
      };
      this.url = null;
      this.url = address;
      this.close = options.close;
    }
  };

  // node_modules/@supabase/storage-js/dist/module/lib/errors.js
  var StorageError = class extends Error {
    constructor(message) {
      super(message);
      this.__isStorageError = true;
      this.name = "StorageError";
    }
  };
  function isStorageError(error) {
    return typeof error === "object" && error !== null && "__isStorageError" in error;
  }
  var StorageApiError = class extends StorageError {
    constructor(message, status) {
      super(message);
      this.name = "StorageApiError";
      this.status = status;
    }
    toJSON() {
      return {
        name: this.name,
        message: this.message,
        status: this.status
      };
    }
  };
  var StorageUnknownError = class extends StorageError {
    constructor(message, originalError) {
      super(message);
      this.name = "StorageUnknownError";
      this.originalError = originalError;
    }
  };

  // node_modules/@supabase/storage-js/dist/module/lib/helpers.js
  var __awaiter2 = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  var resolveFetch2 = (customFetch) => {
    let _fetch;
    if (customFetch) {
      _fetch = customFetch;
    } else if (typeof fetch === "undefined") {
      _fetch = (...args) => Promise.resolve().then(() => (init_browser(), browser_exports)).then(({ default: fetch3 }) => fetch3(...args));
    } else {
      _fetch = fetch;
    }
    return (...args) => _fetch(...args);
  };
  var resolveResponse = () => __awaiter2(void 0, void 0, void 0, function* () {
    if (typeof Response === "undefined") {
      return (yield Promise.resolve().then(() => (init_browser(), browser_exports))).Response;
    }
    return Response;
  });
  var recursiveToCamel = (item) => {
    if (Array.isArray(item)) {
      return item.map((el) => recursiveToCamel(el));
    } else if (typeof item === "function" || item !== Object(item)) {
      return item;
    }
    const result = {};
    Object.entries(item).forEach(([key, value]) => {
      const newKey = key.replace(/([-_][a-z])/gi, (c) => c.toUpperCase().replace(/[-_]/g, ""));
      result[newKey] = recursiveToCamel(value);
    });
    return result;
  };

  // node_modules/@supabase/storage-js/dist/module/lib/fetch.js
  var __awaiter3 = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  var _getErrorMessage = (err2) => err2.msg || err2.message || err2.error_description || err2.error || JSON.stringify(err2);
  var handleError = (error, reject, options) => __awaiter3(void 0, void 0, void 0, function* () {
    const Res = yield resolveResponse();
    if (error instanceof Res && !(options === null || options === void 0 ? void 0 : options.noResolveJson)) {
      error.json().then((err2) => {
        reject(new StorageApiError(_getErrorMessage(err2), error.status || 500));
      }).catch((err2) => {
        reject(new StorageUnknownError(_getErrorMessage(err2), err2));
      });
    } else {
      reject(new StorageUnknownError(_getErrorMessage(error), error));
    }
  });
  var _getRequestParams = (method, options, parameters, body) => {
    const params = { method, headers: (options === null || options === void 0 ? void 0 : options.headers) || {} };
    if (method === "GET") {
      return params;
    }
    params.headers = Object.assign({ "Content-Type": "application/json" }, options === null || options === void 0 ? void 0 : options.headers);
    if (body) {
      params.body = JSON.stringify(body);
    }
    return Object.assign(Object.assign({}, params), parameters);
  };
  function _handleRequest(fetcher, method, url, options, parameters, body) {
    return __awaiter3(this, void 0, void 0, function* () {
      return new Promise((resolve, reject) => {
        fetcher(url, _getRequestParams(method, options, parameters, body)).then((result) => {
          if (!result.ok)
            throw result;
          if (options === null || options === void 0 ? void 0 : options.noResolveJson)
            return result;
          return result.json();
        }).then((data) => resolve(data)).catch((error) => handleError(error, reject, options));
      });
    });
  }
  function get(fetcher, url, options, parameters) {
    return __awaiter3(this, void 0, void 0, function* () {
      return _handleRequest(fetcher, "GET", url, options, parameters);
    });
  }
  function post(fetcher, url, body, options, parameters) {
    return __awaiter3(this, void 0, void 0, function* () {
      return _handleRequest(fetcher, "POST", url, options, parameters, body);
    });
  }
  function put(fetcher, url, body, options, parameters) {
    return __awaiter3(this, void 0, void 0, function* () {
      return _handleRequest(fetcher, "PUT", url, options, parameters, body);
    });
  }
  function head(fetcher, url, options, parameters) {
    return __awaiter3(this, void 0, void 0, function* () {
      return _handleRequest(fetcher, "HEAD", url, Object.assign(Object.assign({}, options), { noResolveJson: true }), parameters);
    });
  }
  function remove(fetcher, url, body, options, parameters) {
    return __awaiter3(this, void 0, void 0, function* () {
      return _handleRequest(fetcher, "DELETE", url, options, parameters, body);
    });
  }

  // node_modules/@supabase/storage-js/dist/module/packages/StorageFileApi.js
  var __awaiter4 = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  var DEFAULT_SEARCH_OPTIONS = {
    limit: 100,
    offset: 0,
    sortBy: {
      column: "name",
      order: "asc"
    }
  };
  var DEFAULT_FILE_OPTIONS = {
    cacheControl: "3600",
    contentType: "text/plain;charset=UTF-8",
    upsert: false
  };
  var StorageFileApi = class {
    constructor(url, headers = {}, bucketId, fetch3) {
      this.url = url;
      this.headers = headers;
      this.bucketId = bucketId;
      this.fetch = resolveFetch2(fetch3);
    }
    /**
     * Uploads a file to an existing bucket or replaces an existing file at the specified path with a new one.
     *
     * @param method HTTP method.
     * @param path The relative file path. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
     * @param fileBody The body of the file to be stored in the bucket.
     */
    uploadOrUpdate(method, path, fileBody, fileOptions) {
      return __awaiter4(this, void 0, void 0, function* () {
        try {
          let body;
          const options = Object.assign(Object.assign({}, DEFAULT_FILE_OPTIONS), fileOptions);
          let headers = Object.assign(Object.assign({}, this.headers), method === "POST" && { "x-upsert": String(options.upsert) });
          const metadata = options.metadata;
          if (typeof Blob !== "undefined" && fileBody instanceof Blob) {
            body = new FormData();
            body.append("cacheControl", options.cacheControl);
            body.append("", fileBody);
            if (metadata) {
              body.append("metadata", this.encodeMetadata(metadata));
            }
          } else if (typeof FormData !== "undefined" && fileBody instanceof FormData) {
            body = fileBody;
            body.append("cacheControl", options.cacheControl);
            if (metadata) {
              body.append("metadata", this.encodeMetadata(metadata));
            }
          } else {
            body = fileBody;
            headers["cache-control"] = `max-age=${options.cacheControl}`;
            headers["content-type"] = options.contentType;
            if (metadata) {
              headers["x-metadata"] = this.toBase64(this.encodeMetadata(metadata));
            }
          }
          if (fileOptions === null || fileOptions === void 0 ? void 0 : fileOptions.headers) {
            headers = Object.assign(Object.assign({}, headers), fileOptions.headers);
          }
          const cleanPath = this._removeEmptyFolders(path);
          const _path = this._getFinalPath(cleanPath);
          const res = yield this.fetch(`${this.url}/object/${_path}`, Object.assign({ method, body, headers }, (options === null || options === void 0 ? void 0 : options.duplex) ? { duplex: options.duplex } : {}));
          const data = yield res.json();
          if (res.ok) {
            return {
              data: { path: cleanPath, id: data.Id, fullPath: data.Key },
              error: null
            };
          } else {
            const error = data;
            return { data: null, error };
          }
        } catch (error) {
          if (isStorageError(error)) {
            return { data: null, error };
          }
          throw error;
        }
      });
    }
    /**
     * Uploads a file to an existing bucket.
     *
     * @param path The file path, including the file name. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
     * @param fileBody The body of the file to be stored in the bucket.
     */
    upload(path, fileBody, fileOptions) {
      return __awaiter4(this, void 0, void 0, function* () {
        return this.uploadOrUpdate("POST", path, fileBody, fileOptions);
      });
    }
    /**
     * Upload a file with a token generated from `createSignedUploadUrl`.
     * @param path The file path, including the file name. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
     * @param token The token generated from `createSignedUploadUrl`
     * @param fileBody The body of the file to be stored in the bucket.
     */
    uploadToSignedUrl(path, token, fileBody, fileOptions) {
      return __awaiter4(this, void 0, void 0, function* () {
        const cleanPath = this._removeEmptyFolders(path);
        const _path = this._getFinalPath(cleanPath);
        const url = new URL(this.url + `/object/upload/sign/${_path}`);
        url.searchParams.set("token", token);
        try {
          let body;
          const options = Object.assign({ upsert: DEFAULT_FILE_OPTIONS.upsert }, fileOptions);
          const headers = Object.assign(Object.assign({}, this.headers), { "x-upsert": String(options.upsert) });
          if (typeof Blob !== "undefined" && fileBody instanceof Blob) {
            body = new FormData();
            body.append("cacheControl", options.cacheControl);
            body.append("", fileBody);
          } else if (typeof FormData !== "undefined" && fileBody instanceof FormData) {
            body = fileBody;
            body.append("cacheControl", options.cacheControl);
          } else {
            body = fileBody;
            headers["cache-control"] = `max-age=${options.cacheControl}`;
            headers["content-type"] = options.contentType;
          }
          const res = yield this.fetch(url.toString(), {
            method: "PUT",
            body,
            headers
          });
          const data = yield res.json();
          if (res.ok) {
            return {
              data: { path: cleanPath, fullPath: data.Key },
              error: null
            };
          } else {
            const error = data;
            return { data: null, error };
          }
        } catch (error) {
          if (isStorageError(error)) {
            return { data: null, error };
          }
          throw error;
        }
      });
    }
    /**
     * Creates a signed upload URL.
     * Signed upload URLs can be used to upload files to the bucket without further authentication.
     * They are valid for 2 hours.
     * @param path The file path, including the current file name. For example `folder/image.png`.
     * @param options.upsert If set to true, allows the file to be overwritten if it already exists.
     */
    createSignedUploadUrl(path, options) {
      return __awaiter4(this, void 0, void 0, function* () {
        try {
          let _path = this._getFinalPath(path);
          const headers = Object.assign({}, this.headers);
          if (options === null || options === void 0 ? void 0 : options.upsert) {
            headers["x-upsert"] = "true";
          }
          const data = yield post(this.fetch, `${this.url}/object/upload/sign/${_path}`, {}, { headers });
          const url = new URL(this.url + data.url);
          const token = url.searchParams.get("token");
          if (!token) {
            throw new StorageError("No token returned by API");
          }
          return { data: { signedUrl: url.toString(), path, token }, error: null };
        } catch (error) {
          if (isStorageError(error)) {
            return { data: null, error };
          }
          throw error;
        }
      });
    }
    /**
     * Replaces an existing file at the specified path with a new one.
     *
     * @param path The relative file path. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to update.
     * @param fileBody The body of the file to be stored in the bucket.
     */
    update(path, fileBody, fileOptions) {
      return __awaiter4(this, void 0, void 0, function* () {
        return this.uploadOrUpdate("PUT", path, fileBody, fileOptions);
      });
    }
    /**
     * Moves an existing file to a new path in the same bucket.
     *
     * @param fromPath The original file path, including the current file name. For example `folder/image.png`.
     * @param toPath The new file path, including the new file name. For example `folder/image-new.png`.
     * @param options The destination options.
     */
    move(fromPath, toPath, options) {
      return __awaiter4(this, void 0, void 0, function* () {
        try {
          const data = yield post(this.fetch, `${this.url}/object/move`, {
            bucketId: this.bucketId,
            sourceKey: fromPath,
            destinationKey: toPath,
            destinationBucket: options === null || options === void 0 ? void 0 : options.destinationBucket
          }, { headers: this.headers });
          return { data, error: null };
        } catch (error) {
          if (isStorageError(error)) {
            return { data: null, error };
          }
          throw error;
        }
      });
    }
    /**
     * Copies an existing file to a new path in the same bucket.
     *
     * @param fromPath The original file path, including the current file name. For example `folder/image.png`.
     * @param toPath The new file path, including the new file name. For example `folder/image-copy.png`.
     * @param options The destination options.
     */
    copy(fromPath, toPath, options) {
      return __awaiter4(this, void 0, void 0, function* () {
        try {
          const data = yield post(this.fetch, `${this.url}/object/copy`, {
            bucketId: this.bucketId,
            sourceKey: fromPath,
            destinationKey: toPath,
            destinationBucket: options === null || options === void 0 ? void 0 : options.destinationBucket
          }, { headers: this.headers });
          return { data: { path: data.Key }, error: null };
        } catch (error) {
          if (isStorageError(error)) {
            return { data: null, error };
          }
          throw error;
        }
      });
    }
    /**
     * Creates a signed URL. Use a signed URL to share a file for a fixed amount of time.
     *
     * @param path The file path, including the current file name. For example `folder/image.png`.
     * @param expiresIn The number of seconds until the signed URL expires. For example, `60` for a URL which is valid for one minute.
     * @param options.download triggers the file as a download if set to true. Set this parameter as the name of the file if you want to trigger the download with a different filename.
     * @param options.transform Transform the asset before serving it to the client.
     */
    createSignedUrl(path, expiresIn, options) {
      return __awaiter4(this, void 0, void 0, function* () {
        try {
          let _path = this._getFinalPath(path);
          let data = yield post(this.fetch, `${this.url}/object/sign/${_path}`, Object.assign({ expiresIn }, (options === null || options === void 0 ? void 0 : options.transform) ? { transform: options.transform } : {}), { headers: this.headers });
          const downloadQueryParam = (options === null || options === void 0 ? void 0 : options.download) ? `&download=${options.download === true ? "" : options.download}` : "";
          const signedUrl = encodeURI(`${this.url}${data.signedURL}${downloadQueryParam}`);
          data = { signedUrl };
          return { data, error: null };
        } catch (error) {
          if (isStorageError(error)) {
            return { data: null, error };
          }
          throw error;
        }
      });
    }
    /**
     * Creates multiple signed URLs. Use a signed URL to share a file for a fixed amount of time.
     *
     * @param paths The file paths to be downloaded, including the current file names. For example `['folder/image.png', 'folder2/image2.png']`.
     * @param expiresIn The number of seconds until the signed URLs expire. For example, `60` for URLs which are valid for one minute.
     * @param options.download triggers the file as a download if set to true. Set this parameter as the name of the file if you want to trigger the download with a different filename.
     */
    createSignedUrls(paths, expiresIn, options) {
      return __awaiter4(this, void 0, void 0, function* () {
        try {
          const data = yield post(this.fetch, `${this.url}/object/sign/${this.bucketId}`, { expiresIn, paths }, { headers: this.headers });
          const downloadQueryParam = (options === null || options === void 0 ? void 0 : options.download) ? `&download=${options.download === true ? "" : options.download}` : "";
          return {
            data: data.map((datum) => Object.assign(Object.assign({}, datum), { signedUrl: datum.signedURL ? encodeURI(`${this.url}${datum.signedURL}${downloadQueryParam}`) : null })),
            error: null
          };
        } catch (error) {
          if (isStorageError(error)) {
            return { data: null, error };
          }
          throw error;
        }
      });
    }
    /**
     * Downloads a file from a private bucket. For public buckets, make a request to the URL returned from `getPublicUrl` instead.
     *
     * @param path The full path and file name of the file to be downloaded. For example `folder/image.png`.
     * @param options.transform Transform the asset before serving it to the client.
     */
    download(path, options) {
      return __awaiter4(this, void 0, void 0, function* () {
        const wantsTransformation = typeof (options === null || options === void 0 ? void 0 : options.transform) !== "undefined";
        const renderPath = wantsTransformation ? "render/image/authenticated" : "object";
        const transformationQuery = this.transformOptsToQueryString((options === null || options === void 0 ? void 0 : options.transform) || {});
        const queryString = transformationQuery ? `?${transformationQuery}` : "";
        try {
          const _path = this._getFinalPath(path);
          const res = yield get(this.fetch, `${this.url}/${renderPath}/${_path}${queryString}`, {
            headers: this.headers,
            noResolveJson: true
          });
          const data = yield res.blob();
          return { data, error: null };
        } catch (error) {
          if (isStorageError(error)) {
            return { data: null, error };
          }
          throw error;
        }
      });
    }
    /**
     * Retrieves the details of an existing file.
     * @param path
     */
    info(path) {
      return __awaiter4(this, void 0, void 0, function* () {
        const _path = this._getFinalPath(path);
        try {
          const data = yield get(this.fetch, `${this.url}/object/info/${_path}`, {
            headers: this.headers
          });
          return { data: recursiveToCamel(data), error: null };
        } catch (error) {
          if (isStorageError(error)) {
            return { data: null, error };
          }
          throw error;
        }
      });
    }
    /**
     * Checks the existence of a file.
     * @param path
     */
    exists(path) {
      return __awaiter4(this, void 0, void 0, function* () {
        const _path = this._getFinalPath(path);
        try {
          yield head(this.fetch, `${this.url}/object/${_path}`, {
            headers: this.headers
          });
          return { data: true, error: null };
        } catch (error) {
          if (isStorageError(error) && error instanceof StorageUnknownError) {
            const originalError = error.originalError;
            if ([400, 404].includes(originalError === null || originalError === void 0 ? void 0 : originalError.status)) {
              return { data: false, error };
            }
          }
          throw error;
        }
      });
    }
    /**
     * A simple convenience function to get the URL for an asset in a public bucket. If you do not want to use this function, you can construct the public URL by concatenating the bucket URL with the path to the asset.
     * This function does not verify if the bucket is public. If a public URL is created for a bucket which is not public, you will not be able to download the asset.
     *
     * @param path The path and name of the file to generate the public URL for. For example `folder/image.png`.
     * @param options.download Triggers the file as a download if set to true. Set this parameter as the name of the file if you want to trigger the download with a different filename.
     * @param options.transform Transform the asset before serving it to the client.
     */
    getPublicUrl(path, options) {
      const _path = this._getFinalPath(path);
      const _queryString = [];
      const downloadQueryParam = (options === null || options === void 0 ? void 0 : options.download) ? `download=${options.download === true ? "" : options.download}` : "";
      if (downloadQueryParam !== "") {
        _queryString.push(downloadQueryParam);
      }
      const wantsTransformation = typeof (options === null || options === void 0 ? void 0 : options.transform) !== "undefined";
      const renderPath = wantsTransformation ? "render/image" : "object";
      const transformationQuery = this.transformOptsToQueryString((options === null || options === void 0 ? void 0 : options.transform) || {});
      if (transformationQuery !== "") {
        _queryString.push(transformationQuery);
      }
      let queryString = _queryString.join("&");
      if (queryString !== "") {
        queryString = `?${queryString}`;
      }
      return {
        data: { publicUrl: encodeURI(`${this.url}/${renderPath}/public/${_path}${queryString}`) }
      };
    }
    /**
     * Deletes files within the same bucket
     *
     * @param paths An array of files to delete, including the path and file name. For example [`'folder/image.png'`].
     */
    remove(paths) {
      return __awaiter4(this, void 0, void 0, function* () {
        try {
          const data = yield remove(this.fetch, `${this.url}/object/${this.bucketId}`, { prefixes: paths }, { headers: this.headers });
          return { data, error: null };
        } catch (error) {
          if (isStorageError(error)) {
            return { data: null, error };
          }
          throw error;
        }
      });
    }
    /**
     * Get file metadata
     * @param id the file id to retrieve metadata
     */
    // async getMetadata(
    //   id: string
    // ): Promise<
    //   | {
    //       data: Metadata
    //       error: null
    //     }
    //   | {
    //       data: null
    //       error: StorageError
    //     }
    // > {
    //   try {
    //     const data = await get(this.fetch, `${this.url}/metadata/${id}`, { headers: this.headers })
    //     return { data, error: null }
    //   } catch (error) {
    //     if (isStorageError(error)) {
    //       return { data: null, error }
    //     }
    //     throw error
    //   }
    // }
    /**
     * Update file metadata
     * @param id the file id to update metadata
     * @param meta the new file metadata
     */
    // async updateMetadata(
    //   id: string,
    //   meta: Metadata
    // ): Promise<
    //   | {
    //       data: Metadata
    //       error: null
    //     }
    //   | {
    //       data: null
    //       error: StorageError
    //     }
    // > {
    //   try {
    //     const data = await post(
    //       this.fetch,
    //       `${this.url}/metadata/${id}`,
    //       { ...meta },
    //       { headers: this.headers }
    //     )
    //     return { data, error: null }
    //   } catch (error) {
    //     if (isStorageError(error)) {
    //       return { data: null, error }
    //     }
    //     throw error
    //   }
    // }
    /**
     * Lists all the files within a bucket.
     * @param path The folder path.
     */
    list(path, options, parameters) {
      return __awaiter4(this, void 0, void 0, function* () {
        try {
          const body = Object.assign(Object.assign(Object.assign({}, DEFAULT_SEARCH_OPTIONS), options), { prefix: path || "" });
          const data = yield post(this.fetch, `${this.url}/object/list/${this.bucketId}`, body, { headers: this.headers }, parameters);
          return { data, error: null };
        } catch (error) {
          if (isStorageError(error)) {
            return { data: null, error };
          }
          throw error;
        }
      });
    }
    encodeMetadata(metadata) {
      return JSON.stringify(metadata);
    }
    toBase64(data) {
      if (typeof Buffer !== "undefined") {
        return Buffer.from(data).toString("base64");
      }
      return btoa(data);
    }
    _getFinalPath(path) {
      return `${this.bucketId}/${path}`;
    }
    _removeEmptyFolders(path) {
      return path.replace(/^\/|\/$/g, "").replace(/\/+/g, "/");
    }
    transformOptsToQueryString(transform) {
      const params = [];
      if (transform.width) {
        params.push(`width=${transform.width}`);
      }
      if (transform.height) {
        params.push(`height=${transform.height}`);
      }
      if (transform.resize) {
        params.push(`resize=${transform.resize}`);
      }
      if (transform.format) {
        params.push(`format=${transform.format}`);
      }
      if (transform.quality) {
        params.push(`quality=${transform.quality}`);
      }
      return params.join("&");
    }
  };

  // node_modules/@supabase/storage-js/dist/module/lib/version.js
  var version2 = "2.7.0";

  // node_modules/@supabase/storage-js/dist/module/lib/constants.js
  var DEFAULT_HEADERS2 = { "X-Client-Info": `storage-js/${version2}` };

  // node_modules/@supabase/storage-js/dist/module/packages/StorageBucketApi.js
  var __awaiter5 = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  var StorageBucketApi = class {
    constructor(url, headers = {}, fetch3) {
      this.url = url;
      this.headers = Object.assign(Object.assign({}, DEFAULT_HEADERS2), headers);
      this.fetch = resolveFetch2(fetch3);
    }
    /**
     * Retrieves the details of all Storage buckets within an existing project.
     */
    listBuckets() {
      return __awaiter5(this, void 0, void 0, function* () {
        try {
          const data = yield get(this.fetch, `${this.url}/bucket`, { headers: this.headers });
          return { data, error: null };
        } catch (error) {
          if (isStorageError(error)) {
            return { data: null, error };
          }
          throw error;
        }
      });
    }
    /**
     * Retrieves the details of an existing Storage bucket.
     *
     * @param id The unique identifier of the bucket you would like to retrieve.
     */
    getBucket(id) {
      return __awaiter5(this, void 0, void 0, function* () {
        try {
          const data = yield get(this.fetch, `${this.url}/bucket/${id}`, { headers: this.headers });
          return { data, error: null };
        } catch (error) {
          if (isStorageError(error)) {
            return { data: null, error };
          }
          throw error;
        }
      });
    }
    /**
     * Creates a new Storage bucket
     *
     * @param id A unique identifier for the bucket you are creating.
     * @param options.public The visibility of the bucket. Public buckets don't require an authorization token to download objects, but still require a valid token for all other operations. By default, buckets are private.
     * @param options.fileSizeLimit specifies the max file size in bytes that can be uploaded to this bucket.
     * The global file size limit takes precedence over this value.
     * The default value is null, which doesn't set a per bucket file size limit.
     * @param options.allowedMimeTypes specifies the allowed mime types that this bucket can accept during upload.
     * The default value is null, which allows files with all mime types to be uploaded.
     * Each mime type specified can be a wildcard, e.g. image/*, or a specific mime type, e.g. image/png.
     * @returns newly created bucket id
     */
    createBucket(id, options = {
      public: false
    }) {
      return __awaiter5(this, void 0, void 0, function* () {
        try {
          const data = yield post(this.fetch, `${this.url}/bucket`, {
            id,
            name: id,
            public: options.public,
            file_size_limit: options.fileSizeLimit,
            allowed_mime_types: options.allowedMimeTypes
          }, { headers: this.headers });
          return { data, error: null };
        } catch (error) {
          if (isStorageError(error)) {
            return { data: null, error };
          }
          throw error;
        }
      });
    }
    /**
     * Updates a Storage bucket
     *
     * @param id A unique identifier for the bucket you are updating.
     * @param options.public The visibility of the bucket. Public buckets don't require an authorization token to download objects, but still require a valid token for all other operations.
     * @param options.fileSizeLimit specifies the max file size in bytes that can be uploaded to this bucket.
     * The global file size limit takes precedence over this value.
     * The default value is null, which doesn't set a per bucket file size limit.
     * @param options.allowedMimeTypes specifies the allowed mime types that this bucket can accept during upload.
     * The default value is null, which allows files with all mime types to be uploaded.
     * Each mime type specified can be a wildcard, e.g. image/*, or a specific mime type, e.g. image/png.
     */
    updateBucket(id, options) {
      return __awaiter5(this, void 0, void 0, function* () {
        try {
          const data = yield put(this.fetch, `${this.url}/bucket/${id}`, {
            id,
            name: id,
            public: options.public,
            file_size_limit: options.fileSizeLimit,
            allowed_mime_types: options.allowedMimeTypes
          }, { headers: this.headers });
          return { data, error: null };
        } catch (error) {
          if (isStorageError(error)) {
            return { data: null, error };
          }
          throw error;
        }
      });
    }
    /**
     * Removes all objects inside a single bucket.
     *
     * @param id The unique identifier of the bucket you would like to empty.
     */
    emptyBucket(id) {
      return __awaiter5(this, void 0, void 0, function* () {
        try {
          const data = yield post(this.fetch, `${this.url}/bucket/${id}/empty`, {}, { headers: this.headers });
          return { data, error: null };
        } catch (error) {
          if (isStorageError(error)) {
            return { data: null, error };
          }
          throw error;
        }
      });
    }
    /**
     * Deletes an existing bucket. A bucket can't be deleted with existing objects inside it.
     * You must first `empty()` the bucket.
     *
     * @param id The unique identifier of the bucket you would like to delete.
     */
    deleteBucket(id) {
      return __awaiter5(this, void 0, void 0, function* () {
        try {
          const data = yield remove(this.fetch, `${this.url}/bucket/${id}`, {}, { headers: this.headers });
          return { data, error: null };
        } catch (error) {
          if (isStorageError(error)) {
            return { data: null, error };
          }
          throw error;
        }
      });
    }
  };

  // node_modules/@supabase/storage-js/dist/module/StorageClient.js
  var StorageClient = class extends StorageBucketApi {
    constructor(url, headers = {}, fetch3) {
      super(url, headers, fetch3);
    }
    /**
     * Perform file operation in a bucket.
     *
     * @param id The bucket id to operate on.
     */
    from(id) {
      return new StorageFileApi(this.url, this.headers, id, this.fetch);
    }
  };

  // node_modules/@supabase/supabase-js/dist/module/lib/version.js
  var version3 = "2.45.4";

  // node_modules/@supabase/supabase-js/dist/module/lib/constants.js
  var JS_ENV = "";
  if (typeof Deno !== "undefined") {
    JS_ENV = "deno";
  } else if (typeof document !== "undefined") {
    JS_ENV = "web";
  } else if (typeof navigator !== "undefined" && navigator.product === "ReactNative") {
    JS_ENV = "react-native";
  } else {
    JS_ENV = "node";
  }
  var DEFAULT_HEADERS3 = { "X-Client-Info": `supabase-js-${JS_ENV}/${version3}` };
  var DEFAULT_GLOBAL_OPTIONS = {
    headers: DEFAULT_HEADERS3
  };
  var DEFAULT_DB_OPTIONS = {
    schema: "public"
  };
  var DEFAULT_AUTH_OPTIONS = {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "implicit"
  };
  var DEFAULT_REALTIME_OPTIONS = {};

  // node_modules/@supabase/supabase-js/dist/module/lib/fetch.js
  init_browser();
  var __awaiter6 = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  var resolveFetch3 = (customFetch) => {
    let _fetch;
    if (customFetch) {
      _fetch = customFetch;
    } else if (typeof fetch === "undefined") {
      _fetch = browser_default;
    } else {
      _fetch = fetch;
    }
    return (...args) => _fetch(...args);
  };
  var resolveHeadersConstructor = () => {
    if (typeof Headers === "undefined") {
      return Headers2;
    }
    return Headers;
  };
  var fetchWithAuth = (supabaseKey, getAccessToken, customFetch) => {
    const fetch3 = resolveFetch3(customFetch);
    const HeadersConstructor = resolveHeadersConstructor();
    return (input, init) => __awaiter6(void 0, void 0, void 0, function* () {
      var _a;
      const accessToken = (_a = yield getAccessToken()) !== null && _a !== void 0 ? _a : supabaseKey;
      let headers = new HeadersConstructor(init === null || init === void 0 ? void 0 : init.headers);
      if (!headers.has("apikey")) {
        headers.set("apikey", supabaseKey);
      }
      if (!headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${accessToken}`);
      }
      return fetch3(input, Object.assign(Object.assign({}, init), { headers }));
    });
  };

  // node_modules/@supabase/supabase-js/dist/module/lib/helpers.js
  var __awaiter7 = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  function stripTrailingSlash(url) {
    return url.replace(/\/$/, "");
  }
  function applySettingDefaults(options, defaults) {
    const { db: dbOptions, auth: authOptions, realtime: realtimeOptions, global: globalOptions } = options;
    const { db: DEFAULT_DB_OPTIONS2, auth: DEFAULT_AUTH_OPTIONS2, realtime: DEFAULT_REALTIME_OPTIONS2, global: DEFAULT_GLOBAL_OPTIONS2 } = defaults;
    const result = {
      db: Object.assign(Object.assign({}, DEFAULT_DB_OPTIONS2), dbOptions),
      auth: Object.assign(Object.assign({}, DEFAULT_AUTH_OPTIONS2), authOptions),
      realtime: Object.assign(Object.assign({}, DEFAULT_REALTIME_OPTIONS2), realtimeOptions),
      global: Object.assign(Object.assign({}, DEFAULT_GLOBAL_OPTIONS2), globalOptions),
      accessToken: () => __awaiter7(this, void 0, void 0, function* () {
        return "";
      })
    };
    if (options.accessToken) {
      result.accessToken = options.accessToken;
    } else {
      delete result.accessToken;
    }
    return result;
  }

  // node_modules/@supabase/auth-js/dist/module/lib/version.js
  var version4 = "2.65.0";

  // node_modules/@supabase/auth-js/dist/module/lib/constants.js
  var GOTRUE_URL = "http://localhost:9999";
  var STORAGE_KEY = "supabase.auth.token";
  var DEFAULT_HEADERS4 = { "X-Client-Info": `gotrue-js/${version4}` };
  var EXPIRY_MARGIN = 10;
  var API_VERSION_HEADER_NAME = "X-Supabase-Api-Version";
  var API_VERSIONS = {
    "2024-01-01": {
      timestamp: Date.parse("2024-01-01T00:00:00.0Z"),
      name: "2024-01-01"
    }
  };

  // node_modules/@supabase/auth-js/dist/module/lib/helpers.js
  function expiresAt(expiresIn) {
    const timeNow = Math.round(Date.now() / 1e3);
    return timeNow + expiresIn;
  }
  function uuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c == "x" ? r : r & 3 | 8;
      return v.toString(16);
    });
  }
  var isBrowser = () => typeof document !== "undefined";
  var localStorageWriteTests = {
    tested: false,
    writable: false
  };
  var supportsLocalStorage = () => {
    if (!isBrowser()) {
      return false;
    }
    try {
      if (typeof globalThis.localStorage !== "object") {
        return false;
      }
    } catch (e) {
      return false;
    }
    if (localStorageWriteTests.tested) {
      return localStorageWriteTests.writable;
    }
    const randomKey = `lswt-${Math.random()}${Math.random()}`;
    try {
      globalThis.localStorage.setItem(randomKey, randomKey);
      globalThis.localStorage.removeItem(randomKey);
      localStorageWriteTests.tested = true;
      localStorageWriteTests.writable = true;
    } catch (e) {
      localStorageWriteTests.tested = true;
      localStorageWriteTests.writable = false;
    }
    return localStorageWriteTests.writable;
  };
  function parseParametersFromURL(href) {
    const result = {};
    const url = new URL(href);
    if (url.hash && url.hash[0] === "#") {
      try {
        const hashSearchParams = new URLSearchParams(url.hash.substring(1));
        hashSearchParams.forEach((value, key) => {
          result[key] = value;
        });
      } catch (e) {
      }
    }
    url.searchParams.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
  var resolveFetch4 = (customFetch) => {
    let _fetch;
    if (customFetch) {
      _fetch = customFetch;
    } else if (typeof fetch === "undefined") {
      _fetch = (...args) => Promise.resolve().then(() => (init_browser(), browser_exports)).then(({ default: fetch3 }) => fetch3(...args));
    } else {
      _fetch = fetch;
    }
    return (...args) => _fetch(...args);
  };
  var looksLikeFetchResponse = (maybeResponse) => {
    return typeof maybeResponse === "object" && maybeResponse !== null && "status" in maybeResponse && "ok" in maybeResponse && "json" in maybeResponse && typeof maybeResponse.json === "function";
  };
  var setItemAsync = async (storage, key, data) => {
    await storage.setItem(key, JSON.stringify(data));
  };
  var getItemAsync = async (storage, key) => {
    const value = await storage.getItem(key);
    if (!value) {
      return null;
    }
    try {
      return JSON.parse(value);
    } catch (_a) {
      return value;
    }
  };
  var removeItemAsync = async (storage, key) => {
    await storage.removeItem(key);
  };
  function decodeBase64URL(value) {
    const key = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    let base64 = "";
    let chr1, chr2, chr3;
    let enc1, enc2, enc3, enc4;
    let i = 0;
    value = value.replace("-", "+").replace("_", "/");
    while (i < value.length) {
      enc1 = key.indexOf(value.charAt(i++));
      enc2 = key.indexOf(value.charAt(i++));
      enc3 = key.indexOf(value.charAt(i++));
      enc4 = key.indexOf(value.charAt(i++));
      chr1 = enc1 << 2 | enc2 >> 4;
      chr2 = (enc2 & 15) << 4 | enc3 >> 2;
      chr3 = (enc3 & 3) << 6 | enc4;
      base64 = base64 + String.fromCharCode(chr1);
      if (enc3 != 64 && chr2 != 0) {
        base64 = base64 + String.fromCharCode(chr2);
      }
      if (enc4 != 64 && chr3 != 0) {
        base64 = base64 + String.fromCharCode(chr3);
      }
    }
    return base64;
  }
  var Deferred = class _Deferred {
    constructor() {
      ;
      this.promise = new _Deferred.promiseConstructor((res, rej) => {
        ;
        this.resolve = res;
        this.reject = rej;
      });
    }
  };
  Deferred.promiseConstructor = Promise;
  function decodeJWTPayload(token) {
    const base64UrlRegex = /^([a-z0-9_-]{4})*($|[a-z0-9_-]{3}=?$|[a-z0-9_-]{2}(==)?$)$/i;
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("JWT is not valid: not a JWT structure");
    }
    if (!base64UrlRegex.test(parts[1])) {
      throw new Error("JWT is not valid: payload is not in base64url format");
    }
    const base64Url = parts[1];
    return JSON.parse(decodeBase64URL(base64Url));
  }
  async function sleep(time) {
    return await new Promise((accept) => {
      setTimeout(() => accept(null), time);
    });
  }
  function retryable(fn, isRetryable) {
    const promise = new Promise((accept, reject) => {
      ;
      (async () => {
        for (let attempt = 0; attempt < Infinity; attempt++) {
          try {
            const result = await fn(attempt);
            if (!isRetryable(attempt, null, result)) {
              accept(result);
              return;
            }
          } catch (e) {
            if (!isRetryable(attempt, e)) {
              reject(e);
              return;
            }
          }
        }
      })();
    });
    return promise;
  }
  function dec2hex(dec) {
    return ("0" + dec.toString(16)).substr(-2);
  }
  function generatePKCEVerifier() {
    const verifierLength = 56;
    const array = new Uint32Array(verifierLength);
    if (typeof crypto === "undefined") {
      const charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
      const charSetLen = charSet.length;
      let verifier = "";
      for (let i = 0; i < verifierLength; i++) {
        verifier += charSet.charAt(Math.floor(Math.random() * charSetLen));
      }
      return verifier;
    }
    crypto.getRandomValues(array);
    return Array.from(array, dec2hex).join("");
  }
  async function sha256(randomString) {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(randomString);
    const hash = await crypto.subtle.digest("SHA-256", encodedData);
    const bytes = new Uint8Array(hash);
    return Array.from(bytes).map((c) => String.fromCharCode(c)).join("");
  }
  function base64urlencode(str2) {
    return btoa(str2).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  async function generatePKCEChallenge(verifier) {
    const hasCryptoSupport = typeof crypto !== "undefined" && typeof crypto.subtle !== "undefined" && typeof TextEncoder !== "undefined";
    if (!hasCryptoSupport) {
      console.warn("WebCrypto API is not supported. Code challenge method will default to use plain instead of sha256.");
      return verifier;
    }
    const hashed = await sha256(verifier);
    return base64urlencode(hashed);
  }
  async function getCodeChallengeAndMethod(storage, storageKey, isPasswordRecovery = false) {
    const codeVerifier = generatePKCEVerifier();
    let storedCodeVerifier = codeVerifier;
    if (isPasswordRecovery) {
      storedCodeVerifier += "/PASSWORD_RECOVERY";
    }
    await setItemAsync(storage, `${storageKey}-code-verifier`, storedCodeVerifier);
    const codeChallenge = await generatePKCEChallenge(codeVerifier);
    const codeChallengeMethod = codeVerifier === codeChallenge ? "plain" : "s256";
    return [codeChallenge, codeChallengeMethod];
  }
  var API_VERSION_REGEX = /^2[0-9]{3}-(0[1-9]|1[0-2])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])$/i;
  function parseResponseAPIVersion(response) {
    const apiVersion = response.headers.get(API_VERSION_HEADER_NAME);
    if (!apiVersion) {
      return null;
    }
    if (!apiVersion.match(API_VERSION_REGEX)) {
      return null;
    }
    try {
      const date = /* @__PURE__ */ new Date(`${apiVersion}T00:00:00.0Z`);
      return date;
    } catch (e) {
      return null;
    }
  }

  // node_modules/@supabase/auth-js/dist/module/lib/errors.js
  var AuthError = class extends Error {
    constructor(message, status, code) {
      super(message);
      this.__isAuthError = true;
      this.name = "AuthError";
      this.status = status;
      this.code = code;
    }
  };
  function isAuthError(error) {
    return typeof error === "object" && error !== null && "__isAuthError" in error;
  }
  var AuthApiError = class extends AuthError {
    constructor(message, status, code) {
      super(message, status, code);
      this.name = "AuthApiError";
      this.status = status;
      this.code = code;
    }
  };
  function isAuthApiError(error) {
    return isAuthError(error) && error.name === "AuthApiError";
  }
  var AuthUnknownError = class extends AuthError {
    constructor(message, originalError) {
      super(message);
      this.name = "AuthUnknownError";
      this.originalError = originalError;
    }
  };
  var CustomAuthError = class extends AuthError {
    constructor(message, name, status, code) {
      super(message, status, code);
      this.name = name;
      this.status = status;
    }
  };
  var AuthSessionMissingError = class extends CustomAuthError {
    constructor() {
      super("Auth session missing!", "AuthSessionMissingError", 400, void 0);
    }
  };
  function isAuthSessionMissingError(error) {
    return isAuthError(error) && error.name === "AuthSessionMissingError";
  }
  var AuthInvalidTokenResponseError = class extends CustomAuthError {
    constructor() {
      super("Auth session or user missing", "AuthInvalidTokenResponseError", 500, void 0);
    }
  };
  var AuthInvalidCredentialsError = class extends CustomAuthError {
    constructor(message) {
      super(message, "AuthInvalidCredentialsError", 400, void 0);
    }
  };
  var AuthImplicitGrantRedirectError = class extends CustomAuthError {
    constructor(message, details = null) {
      super(message, "AuthImplicitGrantRedirectError", 500, void 0);
      this.details = null;
      this.details = details;
    }
    toJSON() {
      return {
        name: this.name,
        message: this.message,
        status: this.status,
        details: this.details
      };
    }
  };
  var AuthPKCEGrantCodeExchangeError = class extends CustomAuthError {
    constructor(message, details = null) {
      super(message, "AuthPKCEGrantCodeExchangeError", 500, void 0);
      this.details = null;
      this.details = details;
    }
    toJSON() {
      return {
        name: this.name,
        message: this.message,
        status: this.status,
        details: this.details
      };
    }
  };
  var AuthRetryableFetchError = class extends CustomAuthError {
    constructor(message, status) {
      super(message, "AuthRetryableFetchError", status, void 0);
    }
  };
  function isAuthRetryableFetchError(error) {
    return isAuthError(error) && error.name === "AuthRetryableFetchError";
  }
  var AuthWeakPasswordError = class extends CustomAuthError {
    constructor(message, status, reasons) {
      super(message, "AuthWeakPasswordError", status, "weak_password");
      this.reasons = reasons;
    }
  };

  // node_modules/@supabase/auth-js/dist/module/lib/fetch.js
  var __rest = function(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
      t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
      for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
        if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
          t[p[i]] = s[p[i]];
      }
    return t;
  };
  var _getErrorMessage2 = (err2) => err2.msg || err2.message || err2.error_description || err2.error || JSON.stringify(err2);
  var NETWORK_ERROR_CODES = [502, 503, 504];
  async function handleError2(error) {
    var _a;
    if (!looksLikeFetchResponse(error)) {
      throw new AuthRetryableFetchError(_getErrorMessage2(error), 0);
    }
    if (NETWORK_ERROR_CODES.includes(error.status)) {
      throw new AuthRetryableFetchError(_getErrorMessage2(error), error.status);
    }
    let data;
    try {
      data = await error.json();
    } catch (e) {
      throw new AuthUnknownError(_getErrorMessage2(e), e);
    }
    let errorCode = void 0;
    const responseAPIVersion = parseResponseAPIVersion(error);
    if (responseAPIVersion && responseAPIVersion.getTime() >= API_VERSIONS["2024-01-01"].timestamp && typeof data === "object" && data && typeof data.code === "string") {
      errorCode = data.code;
    } else if (typeof data === "object" && data && typeof data.error_code === "string") {
      errorCode = data.error_code;
    }
    if (!errorCode) {
      if (typeof data === "object" && data && typeof data.weak_password === "object" && data.weak_password && Array.isArray(data.weak_password.reasons) && data.weak_password.reasons.length && data.weak_password.reasons.reduce((a, i) => a && typeof i === "string", true)) {
        throw new AuthWeakPasswordError(_getErrorMessage2(data), error.status, data.weak_password.reasons);
      }
    } else if (errorCode === "weak_password") {
      throw new AuthWeakPasswordError(_getErrorMessage2(data), error.status, ((_a = data.weak_password) === null || _a === void 0 ? void 0 : _a.reasons) || []);
    } else if (errorCode === "session_not_found") {
      throw new AuthSessionMissingError();
    }
    throw new AuthApiError(_getErrorMessage2(data), error.status || 500, errorCode);
  }
  var _getRequestParams2 = (method, options, parameters, body) => {
    const params = { method, headers: (options === null || options === void 0 ? void 0 : options.headers) || {} };
    if (method === "GET") {
      return params;
    }
    params.headers = Object.assign({ "Content-Type": "application/json;charset=UTF-8" }, options === null || options === void 0 ? void 0 : options.headers);
    params.body = JSON.stringify(body);
    return Object.assign(Object.assign({}, params), parameters);
  };
  async function _request(fetcher, method, url, options) {
    var _a;
    const headers = Object.assign({}, options === null || options === void 0 ? void 0 : options.headers);
    if (!headers[API_VERSION_HEADER_NAME]) {
      headers[API_VERSION_HEADER_NAME] = API_VERSIONS["2024-01-01"].name;
    }
    if (options === null || options === void 0 ? void 0 : options.jwt) {
      headers["Authorization"] = `Bearer ${options.jwt}`;
    }
    const qs = (_a = options === null || options === void 0 ? void 0 : options.query) !== null && _a !== void 0 ? _a : {};
    if (options === null || options === void 0 ? void 0 : options.redirectTo) {
      qs["redirect_to"] = options.redirectTo;
    }
    const queryString = Object.keys(qs).length ? "?" + new URLSearchParams(qs).toString() : "";
    const data = await _handleRequest2(fetcher, method, url + queryString, {
      headers,
      noResolveJson: options === null || options === void 0 ? void 0 : options.noResolveJson
    }, {}, options === null || options === void 0 ? void 0 : options.body);
    return (options === null || options === void 0 ? void 0 : options.xform) ? options === null || options === void 0 ? void 0 : options.xform(data) : { data: Object.assign({}, data), error: null };
  }
  async function _handleRequest2(fetcher, method, url, options, parameters, body) {
    const requestParams = _getRequestParams2(method, options, parameters, body);
    let result;
    try {
      result = await fetcher(url, Object.assign({}, requestParams));
    } catch (e) {
      console.error(e);
      throw new AuthRetryableFetchError(_getErrorMessage2(e), 0);
    }
    if (!result.ok) {
      await handleError2(result);
    }
    if (options === null || options === void 0 ? void 0 : options.noResolveJson) {
      return result;
    }
    try {
      return await result.json();
    } catch (e) {
      await handleError2(e);
    }
  }
  function _sessionResponse(data) {
    var _a;
    let session = null;
    if (hasSession(data)) {
      session = Object.assign({}, data);
      if (!data.expires_at) {
        session.expires_at = expiresAt(data.expires_in);
      }
    }
    const user = (_a = data.user) !== null && _a !== void 0 ? _a : data;
    return { data: { session, user }, error: null };
  }
  function _sessionResponsePassword(data) {
    const response = _sessionResponse(data);
    if (!response.error && data.weak_password && typeof data.weak_password === "object" && Array.isArray(data.weak_password.reasons) && data.weak_password.reasons.length && data.weak_password.message && typeof data.weak_password.message === "string" && data.weak_password.reasons.reduce((a, i) => a && typeof i === "string", true)) {
      response.data.weak_password = data.weak_password;
    }
    return response;
  }
  function _userResponse(data) {
    var _a;
    const user = (_a = data.user) !== null && _a !== void 0 ? _a : data;
    return { data: { user }, error: null };
  }
  function _ssoResponse(data) {
    return { data, error: null };
  }
  function _generateLinkResponse(data) {
    const { action_link, email_otp, hashed_token, redirect_to, verification_type } = data, rest = __rest(data, ["action_link", "email_otp", "hashed_token", "redirect_to", "verification_type"]);
    const properties = {
      action_link,
      email_otp,
      hashed_token,
      redirect_to,
      verification_type
    };
    const user = Object.assign({}, rest);
    return {
      data: {
        properties,
        user
      },
      error: null
    };
  }
  function _noResolveJsonResponse(data) {
    return data;
  }
  function hasSession(data) {
    return data.access_token && data.refresh_token && data.expires_in;
  }

  // node_modules/@supabase/auth-js/dist/module/GoTrueAdminApi.js
  var __rest2 = function(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
      t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
      for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
        if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
          t[p[i]] = s[p[i]];
      }
    return t;
  };
  var GoTrueAdminApi = class {
    constructor({ url = "", headers = {}, fetch: fetch3 }) {
      this.url = url;
      this.headers = headers;
      this.fetch = resolveFetch4(fetch3);
      this.mfa = {
        listFactors: this._listFactors.bind(this),
        deleteFactor: this._deleteFactor.bind(this)
      };
    }
    /**
     * Removes a logged-in session.
     * @param jwt A valid, logged-in JWT.
     * @param scope The logout sope.
     */
    async signOut(jwt, scope = "global") {
      try {
        await _request(this.fetch, "POST", `${this.url}/logout?scope=${scope}`, {
          headers: this.headers,
          jwt,
          noResolveJson: true
        });
        return { data: null, error: null };
      } catch (error) {
        if (isAuthError(error)) {
          return { data: null, error };
        }
        throw error;
      }
    }
    /**
     * Sends an invite link to an email address.
     * @param email The email address of the user.
     * @param options Additional options to be included when inviting.
     */
    async inviteUserByEmail(email, options = {}) {
      try {
        return await _request(this.fetch, "POST", `${this.url}/invite`, {
          body: { email, data: options.data },
          headers: this.headers,
          redirectTo: options.redirectTo,
          xform: _userResponse
        });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: { user: null }, error };
        }
        throw error;
      }
    }
    /**
     * Generates email links and OTPs to be sent via a custom email provider.
     * @param email The user's email.
     * @param options.password User password. For signup only.
     * @param options.data Optional user metadata. For signup only.
     * @param options.redirectTo The redirect url which should be appended to the generated link
     */
    async generateLink(params) {
      try {
        const { options } = params, rest = __rest2(params, ["options"]);
        const body = Object.assign(Object.assign({}, rest), options);
        if ("newEmail" in rest) {
          body.new_email = rest === null || rest === void 0 ? void 0 : rest.newEmail;
          delete body["newEmail"];
        }
        return await _request(this.fetch, "POST", `${this.url}/admin/generate_link`, {
          body,
          headers: this.headers,
          xform: _generateLinkResponse,
          redirectTo: options === null || options === void 0 ? void 0 : options.redirectTo
        });
      } catch (error) {
        if (isAuthError(error)) {
          return {
            data: {
              properties: null,
              user: null
            },
            error
          };
        }
        throw error;
      }
    }
    // User Admin API
    /**
     * Creates a new user.
     * This function should only be called on a server. Never expose your `service_role` key in the browser.
     */
    async createUser(attributes) {
      try {
        return await _request(this.fetch, "POST", `${this.url}/admin/users`, {
          body: attributes,
          headers: this.headers,
          xform: _userResponse
        });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: { user: null }, error };
        }
        throw error;
      }
    }
    /**
     * Get a list of users.
     *
     * This function should only be called on a server. Never expose your `service_role` key in the browser.
     * @param params An object which supports `page` and `perPage` as numbers, to alter the paginated results.
     */
    async listUsers(params) {
      var _a, _b, _c, _d, _e, _f, _g;
      try {
        const pagination = { nextPage: null, lastPage: 0, total: 0 };
        const response = await _request(this.fetch, "GET", `${this.url}/admin/users`, {
          headers: this.headers,
          noResolveJson: true,
          query: {
            page: (_b = (_a = params === null || params === void 0 ? void 0 : params.page) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : "",
            per_page: (_d = (_c = params === null || params === void 0 ? void 0 : params.perPage) === null || _c === void 0 ? void 0 : _c.toString()) !== null && _d !== void 0 ? _d : ""
          },
          xform: _noResolveJsonResponse
        });
        if (response.error)
          throw response.error;
        const users = await response.json();
        const total = (_e = response.headers.get("x-total-count")) !== null && _e !== void 0 ? _e : 0;
        const links = (_g = (_f = response.headers.get("link")) === null || _f === void 0 ? void 0 : _f.split(",")) !== null && _g !== void 0 ? _g : [];
        if (links.length > 0) {
          links.forEach((link) => {
            const page = parseInt(link.split(";")[0].split("=")[1].substring(0, 1));
            const rel = JSON.parse(link.split(";")[1].split("=")[1]);
            pagination[`${rel}Page`] = page;
          });
          pagination.total = parseInt(total);
        }
        return { data: Object.assign(Object.assign({}, users), pagination), error: null };
      } catch (error) {
        if (isAuthError(error)) {
          return { data: { users: [] }, error };
        }
        throw error;
      }
    }
    /**
     * Get user by id.
     *
     * @param uid The user's unique identifier
     *
     * This function should only be called on a server. Never expose your `service_role` key in the browser.
     */
    async getUserById(uid) {
      try {
        return await _request(this.fetch, "GET", `${this.url}/admin/users/${uid}`, {
          headers: this.headers,
          xform: _userResponse
        });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: { user: null }, error };
        }
        throw error;
      }
    }
    /**
     * Updates the user data.
     *
     * @param attributes The data you want to update.
     *
     * This function should only be called on a server. Never expose your `service_role` key in the browser.
     */
    async updateUserById(uid, attributes) {
      try {
        return await _request(this.fetch, "PUT", `${this.url}/admin/users/${uid}`, {
          body: attributes,
          headers: this.headers,
          xform: _userResponse
        });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: { user: null }, error };
        }
        throw error;
      }
    }
    /**
     * Delete a user. Requires a `service_role` key.
     *
     * @param id The user id you want to remove.
     * @param shouldSoftDelete If true, then the user will be soft-deleted (setting `deleted_at` to the current timestamp and disabling their account while preserving their data) from the auth schema.
     * Defaults to false for backward compatibility.
     *
     * This function should only be called on a server. Never expose your `service_role` key in the browser.
     */
    async deleteUser(id, shouldSoftDelete = false) {
      try {
        return await _request(this.fetch, "DELETE", `${this.url}/admin/users/${id}`, {
          headers: this.headers,
          body: {
            should_soft_delete: shouldSoftDelete
          },
          xform: _userResponse
        });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: { user: null }, error };
        }
        throw error;
      }
    }
    async _listFactors(params) {
      try {
        const { data, error } = await _request(this.fetch, "GET", `${this.url}/admin/users/${params.userId}/factors`, {
          headers: this.headers,
          xform: (factors) => {
            return { data: { factors }, error: null };
          }
        });
        return { data, error };
      } catch (error) {
        if (isAuthError(error)) {
          return { data: null, error };
        }
        throw error;
      }
    }
    async _deleteFactor(params) {
      try {
        const data = await _request(this.fetch, "DELETE", `${this.url}/admin/users/${params.userId}/factors/${params.id}`, {
          headers: this.headers
        });
        return { data, error: null };
      } catch (error) {
        if (isAuthError(error)) {
          return { data: null, error };
        }
        throw error;
      }
    }
  };

  // node_modules/@supabase/auth-js/dist/module/lib/local-storage.js
  var localStorageAdapter = {
    getItem: (key) => {
      if (!supportsLocalStorage()) {
        return null;
      }
      return globalThis.localStorage.getItem(key);
    },
    setItem: (key, value) => {
      if (!supportsLocalStorage()) {
        return;
      }
      globalThis.localStorage.setItem(key, value);
    },
    removeItem: (key) => {
      if (!supportsLocalStorage()) {
        return;
      }
      globalThis.localStorage.removeItem(key);
    }
  };
  function memoryLocalStorageAdapter(store = {}) {
    return {
      getItem: (key) => {
        return store[key] || null;
      },
      setItem: (key, value) => {
        store[key] = value;
      },
      removeItem: (key) => {
        delete store[key];
      }
    };
  }

  // node_modules/@supabase/auth-js/dist/module/lib/polyfills.js
  function polyfillGlobalThis() {
    if (typeof globalThis === "object")
      return;
    try {
      Object.defineProperty(Object.prototype, "__magic__", {
        get: function() {
          return this;
        },
        configurable: true
      });
      __magic__.globalThis = __magic__;
      delete Object.prototype.__magic__;
    } catch (e) {
      if (typeof self !== "undefined") {
        self.globalThis = self;
      }
    }
  }

  // node_modules/@supabase/auth-js/dist/module/lib/locks.js
  var internals = {
    /**
     * @experimental
     */
    debug: !!(globalThis && supportsLocalStorage() && globalThis.localStorage && globalThis.localStorage.getItem("supabase.gotrue-js.locks.debug") === "true")
  };
  var LockAcquireTimeoutError = class extends Error {
    constructor(message) {
      super(message);
      this.isAcquireTimeout = true;
    }
  };
  var NavigatorLockAcquireTimeoutError = class extends LockAcquireTimeoutError {
  };
  async function navigatorLock(name, acquireTimeout, fn) {
    if (internals.debug) {
      console.log("@supabase/gotrue-js: navigatorLock: acquire lock", name, acquireTimeout);
    }
    const abortController = new globalThis.AbortController();
    if (acquireTimeout > 0) {
      setTimeout(() => {
        abortController.abort();
        if (internals.debug) {
          console.log("@supabase/gotrue-js: navigatorLock acquire timed out", name);
        }
      }, acquireTimeout);
    }
    return await globalThis.navigator.locks.request(name, acquireTimeout === 0 ? {
      mode: "exclusive",
      ifAvailable: true
    } : {
      mode: "exclusive",
      signal: abortController.signal
    }, async (lock) => {
      if (lock) {
        if (internals.debug) {
          console.log("@supabase/gotrue-js: navigatorLock: acquired", name, lock.name);
        }
        try {
          return await fn();
        } finally {
          if (internals.debug) {
            console.log("@supabase/gotrue-js: navigatorLock: released", name, lock.name);
          }
        }
      } else {
        if (acquireTimeout === 0) {
          if (internals.debug) {
            console.log("@supabase/gotrue-js: navigatorLock: not immediately available", name);
          }
          throw new NavigatorLockAcquireTimeoutError(`Acquiring an exclusive Navigator LockManager lock "${name}" immediately failed`);
        } else {
          if (internals.debug) {
            try {
              const result = await globalThis.navigator.locks.query();
              console.log("@supabase/gotrue-js: Navigator LockManager state", JSON.stringify(result, null, "  "));
            } catch (e) {
              console.warn("@supabase/gotrue-js: Error when querying Navigator LockManager state", e);
            }
          }
          console.warn("@supabase/gotrue-js: Navigator LockManager returned a null lock when using #request without ifAvailable set to true, it appears this browser is not following the LockManager spec https://developer.mozilla.org/en-US/docs/Web/API/LockManager/request");
          return await fn();
        }
      }
    });
  }

  // node_modules/@supabase/auth-js/dist/module/GoTrueClient.js
  polyfillGlobalThis();
  var DEFAULT_OPTIONS = {
    url: GOTRUE_URL,
    storageKey: STORAGE_KEY,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    headers: DEFAULT_HEADERS4,
    flowType: "implicit",
    debug: false,
    hasCustomAuthorizationHeader: false
  };
  var AUTO_REFRESH_TICK_DURATION = 30 * 1e3;
  var AUTO_REFRESH_TICK_THRESHOLD = 3;
  async function lockNoOp(name, acquireTimeout, fn) {
    return await fn();
  }
  var GoTrueClient = class _GoTrueClient {
    /**
     * Create a new client for use in the browser.
     */
    constructor(options) {
      var _a, _b;
      this.memoryStorage = null;
      this.stateChangeEmitters = /* @__PURE__ */ new Map();
      this.autoRefreshTicker = null;
      this.visibilityChangedCallback = null;
      this.refreshingDeferred = null;
      this.initializePromise = null;
      this.detectSessionInUrl = true;
      this.hasCustomAuthorizationHeader = false;
      this.suppressGetSessionWarning = false;
      this.lockAcquired = false;
      this.pendingInLock = [];
      this.broadcastChannel = null;
      this.logger = console.log;
      this.instanceID = _GoTrueClient.nextInstanceID;
      _GoTrueClient.nextInstanceID += 1;
      if (this.instanceID > 0 && isBrowser()) {
        console.warn("Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.");
      }
      const settings = Object.assign(Object.assign({}, DEFAULT_OPTIONS), options);
      this.logDebugMessages = !!settings.debug;
      if (typeof settings.debug === "function") {
        this.logger = settings.debug;
      }
      this.persistSession = settings.persistSession;
      this.storageKey = settings.storageKey;
      this.autoRefreshToken = settings.autoRefreshToken;
      this.admin = new GoTrueAdminApi({
        url: settings.url,
        headers: settings.headers,
        fetch: settings.fetch
      });
      this.url = settings.url;
      this.headers = settings.headers;
      this.fetch = resolveFetch4(settings.fetch);
      this.lock = settings.lock || lockNoOp;
      this.detectSessionInUrl = settings.detectSessionInUrl;
      this.flowType = settings.flowType;
      this.hasCustomAuthorizationHeader = settings.hasCustomAuthorizationHeader;
      if (settings.lock) {
        this.lock = settings.lock;
      } else if (isBrowser() && ((_a = globalThis === null || globalThis === void 0 ? void 0 : globalThis.navigator) === null || _a === void 0 ? void 0 : _a.locks)) {
        this.lock = navigatorLock;
      } else {
        this.lock = lockNoOp;
      }
      this.mfa = {
        verify: this._verify.bind(this),
        enroll: this._enroll.bind(this),
        unenroll: this._unenroll.bind(this),
        challenge: this._challenge.bind(this),
        listFactors: this._listFactors.bind(this),
        challengeAndVerify: this._challengeAndVerify.bind(this),
        getAuthenticatorAssuranceLevel: this._getAuthenticatorAssuranceLevel.bind(this)
      };
      if (this.persistSession) {
        if (settings.storage) {
          this.storage = settings.storage;
        } else {
          if (supportsLocalStorage()) {
            this.storage = localStorageAdapter;
          } else {
            this.memoryStorage = {};
            this.storage = memoryLocalStorageAdapter(this.memoryStorage);
          }
        }
      } else {
        this.memoryStorage = {};
        this.storage = memoryLocalStorageAdapter(this.memoryStorage);
      }
      if (isBrowser() && globalThis.BroadcastChannel && this.persistSession && this.storageKey) {
        try {
          this.broadcastChannel = new globalThis.BroadcastChannel(this.storageKey);
        } catch (e) {
          console.error("Failed to create a new BroadcastChannel, multi-tab state changes will not be available", e);
        }
        (_b = this.broadcastChannel) === null || _b === void 0 ? void 0 : _b.addEventListener("message", async (event) => {
          this._debug("received broadcast notification from other tab or client", event);
          await this._notifyAllSubscribers(event.data.event, event.data.session, false);
        });
      }
      this.initialize();
    }
    _debug(...args) {
      if (this.logDebugMessages) {
        this.logger(`GoTrueClient@${this.instanceID} (${version4}) ${(/* @__PURE__ */ new Date()).toISOString()}`, ...args);
      }
      return this;
    }
    /**
     * Initializes the client session either from the url or from storage.
     * This method is automatically called when instantiating the client, but should also be called
     * manually when checking for an error from an auth redirect (oauth, magiclink, password recovery, etc).
     */
    async initialize() {
      if (this.initializePromise) {
        return await this.initializePromise;
      }
      this.initializePromise = (async () => {
        return await this._acquireLock(-1, async () => {
          return await this._initialize();
        });
      })();
      return await this.initializePromise;
    }
    /**
     * IMPORTANT:
     * 1. Never throw in this method, as it is called from the constructor
     * 2. Never return a session from this method as it would be cached over
     *    the whole lifetime of the client
     */
    async _initialize() {
      try {
        const isPKCEFlow = isBrowser() ? await this._isPKCEFlow() : false;
        this._debug("#_initialize()", "begin", "is PKCE flow", isPKCEFlow);
        if (isPKCEFlow || this.detectSessionInUrl && this._isImplicitGrantFlow()) {
          const { data, error } = await this._getSessionFromURL(isPKCEFlow);
          if (error) {
            this._debug("#_initialize()", "error detecting session from URL", error);
            if ((error === null || error === void 0 ? void 0 : error.message) === "Identity is already linked" || (error === null || error === void 0 ? void 0 : error.message) === "Identity is already linked to another user") {
              return { error };
            }
            await this._removeSession();
            return { error };
          }
          const { session, redirectType } = data;
          this._debug("#_initialize()", "detected session in URL", session, "redirect type", redirectType);
          await this._saveSession(session);
          setTimeout(async () => {
            if (redirectType === "recovery") {
              await this._notifyAllSubscribers("PASSWORD_RECOVERY", session);
            } else {
              await this._notifyAllSubscribers("SIGNED_IN", session);
            }
          }, 0);
          return { error: null };
        }
        await this._recoverAndRefresh();
        return { error: null };
      } catch (error) {
        if (isAuthError(error)) {
          return { error };
        }
        return {
          error: new AuthUnknownError("Unexpected error during initialization", error)
        };
      } finally {
        await this._handleVisibilityChange();
        this._debug("#_initialize()", "end");
      }
    }
    /**
     * Creates a new anonymous user.
     *
     * @returns A session where the is_anonymous claim in the access token JWT set to true
     */
    async signInAnonymously(credentials) {
      var _a, _b, _c;
      try {
        const res = await _request(this.fetch, "POST", `${this.url}/signup`, {
          headers: this.headers,
          body: {
            data: (_b = (_a = credentials === null || credentials === void 0 ? void 0 : credentials.options) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {},
            gotrue_meta_security: { captcha_token: (_c = credentials === null || credentials === void 0 ? void 0 : credentials.options) === null || _c === void 0 ? void 0 : _c.captchaToken }
          },
          xform: _sessionResponse
        });
        const { data, error } = res;
        if (error || !data) {
          return { data: { user: null, session: null }, error };
        }
        const session = data.session;
        const user = data.user;
        if (data.session) {
          await this._saveSession(data.session);
          await this._notifyAllSubscribers("SIGNED_IN", session);
        }
        return { data: { user, session }, error: null };
      } catch (error) {
        if (isAuthError(error)) {
          return { data: { user: null, session: null }, error };
        }
        throw error;
      }
    }
    /**
     * Creates a new user.
     *
     * Be aware that if a user account exists in the system you may get back an
     * error message that attempts to hide this information from the user.
     * This method has support for PKCE via email signups. The PKCE flow cannot be used when autoconfirm is enabled.
     *
     * @returns A logged-in session if the server has "autoconfirm" ON
     * @returns A user if the server has "autoconfirm" OFF
     */
    async signUp(credentials) {
      var _a, _b, _c;
      try {
        let res;
        if ("email" in credentials) {
          const { email, password, options } = credentials;
          let codeChallenge = null;
          let codeChallengeMethod = null;
          if (this.flowType === "pkce") {
            ;
            [codeChallenge, codeChallengeMethod] = await getCodeChallengeAndMethod(this.storage, this.storageKey);
          }
          res = await _request(this.fetch, "POST", `${this.url}/signup`, {
            headers: this.headers,
            redirectTo: options === null || options === void 0 ? void 0 : options.emailRedirectTo,
            body: {
              email,
              password,
              data: (_a = options === null || options === void 0 ? void 0 : options.data) !== null && _a !== void 0 ? _a : {},
              gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken },
              code_challenge: codeChallenge,
              code_challenge_method: codeChallengeMethod
            },
            xform: _sessionResponse
          });
        } else if ("phone" in credentials) {
          const { phone, password, options } = credentials;
          res = await _request(this.fetch, "POST", `${this.url}/signup`, {
            headers: this.headers,
            body: {
              phone,
              password,
              data: (_b = options === null || options === void 0 ? void 0 : options.data) !== null && _b !== void 0 ? _b : {},
              channel: (_c = options === null || options === void 0 ? void 0 : options.channel) !== null && _c !== void 0 ? _c : "sms",
              gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken }
            },
            xform: _sessionResponse
          });
        } else {
          throw new AuthInvalidCredentialsError("You must provide either an email or phone number and a password");
        }
        const { data, error } = res;
        if (error || !data) {
          return { data: { user: null, session: null }, error };
        }
        const session = data.session;
        const user = data.user;
        if (data.session) {
          await this._saveSession(data.session);
          await this._notifyAllSubscribers("SIGNED_IN", session);
        }
        return { data: { user, session }, error: null };
      } catch (error) {
        if (isAuthError(error)) {
          return { data: { user: null, session: null }, error };
        }
        throw error;
      }
    }
    /**
     * Log in an existing user with an email and password or phone and password.
     *
     * Be aware that you may get back an error message that will not distinguish
     * between the cases where the account does not exist or that the
     * email/phone and password combination is wrong or that the account can only
     * be accessed via social login.
     */
    async signInWithPassword(credentials) {
      try {
        let res;
        if ("email" in credentials) {
          const { email, password, options } = credentials;
          res = await _request(this.fetch, "POST", `${this.url}/token?grant_type=password`, {
            headers: this.headers,
            body: {
              email,
              password,
              gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken }
            },
            xform: _sessionResponsePassword
          });
        } else if ("phone" in credentials) {
          const { phone, password, options } = credentials;
          res = await _request(this.fetch, "POST", `${this.url}/token?grant_type=password`, {
            headers: this.headers,
            body: {
              phone,
              password,
              gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken }
            },
            xform: _sessionResponsePassword
          });
        } else {
          throw new AuthInvalidCredentialsError("You must provide either an email or phone number and a password");
        }
        const { data, error } = res;
        if (error) {
          return { data: { user: null, session: null }, error };
        } else if (!data || !data.session || !data.user) {
          return { data: { user: null, session: null }, error: new AuthInvalidTokenResponseError() };
        }
        if (data.session) {
          await this._saveSession(data.session);
          await this._notifyAllSubscribers("SIGNED_IN", data.session);
        }
        return {
          data: Object.assign({ user: data.user, session: data.session }, data.weak_password ? { weakPassword: data.weak_password } : null),
          error
        };
      } catch (error) {
        if (isAuthError(error)) {
          return { data: { user: null, session: null }, error };
        }
        throw error;
      }
    }
    /**
     * Log in an existing user via a third-party provider.
     * This method supports the PKCE flow.
     */
    async signInWithOAuth(credentials) {
      var _a, _b, _c, _d;
      return await this._handleProviderSignIn(credentials.provider, {
        redirectTo: (_a = credentials.options) === null || _a === void 0 ? void 0 : _a.redirectTo,
        scopes: (_b = credentials.options) === null || _b === void 0 ? void 0 : _b.scopes,
        queryParams: (_c = credentials.options) === null || _c === void 0 ? void 0 : _c.queryParams,
        skipBrowserRedirect: (_d = credentials.options) === null || _d === void 0 ? void 0 : _d.skipBrowserRedirect
      });
    }
    /**
     * Log in an existing user by exchanging an Auth Code issued during the PKCE flow.
     */
    async exchangeCodeForSession(authCode) {
      await this.initializePromise;
      return this._acquireLock(-1, async () => {
        return this._exchangeCodeForSession(authCode);
      });
    }
    async _exchangeCodeForSession(authCode) {
      const storageItem = await getItemAsync(this.storage, `${this.storageKey}-code-verifier`);
      const [codeVerifier, redirectType] = (storageItem !== null && storageItem !== void 0 ? storageItem : "").split("/");
      try {
        const { data, error } = await _request(this.fetch, "POST", `${this.url}/token?grant_type=pkce`, {
          headers: this.headers,
          body: {
            auth_code: authCode,
            code_verifier: codeVerifier
          },
          xform: _sessionResponse
        });
        await removeItemAsync(this.storage, `${this.storageKey}-code-verifier`);
        if (error) {
          throw error;
        }
        if (!data || !data.session || !data.user) {
          return {
            data: { user: null, session: null, redirectType: null },
            error: new AuthInvalidTokenResponseError()
          };
        }
        if (data.session) {
          await this._saveSession(data.session);
          await this._notifyAllSubscribers("SIGNED_IN", data.session);
        }
        return { data: Object.assign(Object.assign({}, data), { redirectType: redirectType !== null && redirectType !== void 0 ? redirectType : null }), error };
      } catch (error) {
        if (isAuthError(error)) {
          return { data: { user: null, session: null, redirectType: null }, error };
        }
        throw error;
      }
    }
    /**
     * Allows signing in with an OIDC ID token. The authentication provider used
     * should be enabled and configured.
     */
    async signInWithIdToken(credentials) {
      try {
        const { options, provider, token, access_token, nonce } = credentials;
        const res = await _request(this.fetch, "POST", `${this.url}/token?grant_type=id_token`, {
          headers: this.headers,
          body: {
            provider,
            id_token: token,
            access_token,
            nonce,
            gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken }
          },
          xform: _sessionResponse
        });
        const { data, error } = res;
        if (error) {
          return { data: { user: null, session: null }, error };
        } else if (!data || !data.session || !data.user) {
          return {
            data: { user: null, session: null },
            error: new AuthInvalidTokenResponseError()
          };
        }
        if (data.session) {
          await this._saveSession(data.session);
          await this._notifyAllSubscribers("SIGNED_IN", data.session);
        }
        return { data, error };
      } catch (error) {
        if (isAuthError(error)) {
          return { data: { user: null, session: null }, error };
        }
        throw error;
      }
    }
    /**
     * Log in a user using magiclink or a one-time password (OTP).
     *
     * If the `{{ .ConfirmationURL }}` variable is specified in the email template, a magiclink will be sent.
     * If the `{{ .Token }}` variable is specified in the email template, an OTP will be sent.
     * If you're using phone sign-ins, only an OTP will be sent. You won't be able to send a magiclink for phone sign-ins.
     *
     * Be aware that you may get back an error message that will not distinguish
     * between the cases where the account does not exist or, that the account
     * can only be accessed via social login.
     *
     * Do note that you will need to configure a Whatsapp sender on Twilio
     * if you are using phone sign in with the 'whatsapp' channel. The whatsapp
     * channel is not supported on other providers
     * at this time.
     * This method supports PKCE when an email is passed.
     */
    async signInWithOtp(credentials) {
      var _a, _b, _c, _d, _e;
      try {
        if ("email" in credentials) {
          const { email, options } = credentials;
          let codeChallenge = null;
          let codeChallengeMethod = null;
          if (this.flowType === "pkce") {
            ;
            [codeChallenge, codeChallengeMethod] = await getCodeChallengeAndMethod(this.storage, this.storageKey);
          }
          const { error } = await _request(this.fetch, "POST", `${this.url}/otp`, {
            headers: this.headers,
            body: {
              email,
              data: (_a = options === null || options === void 0 ? void 0 : options.data) !== null && _a !== void 0 ? _a : {},
              create_user: (_b = options === null || options === void 0 ? void 0 : options.shouldCreateUser) !== null && _b !== void 0 ? _b : true,
              gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken },
              code_challenge: codeChallenge,
              code_challenge_method: codeChallengeMethod
            },
            redirectTo: options === null || options === void 0 ? void 0 : options.emailRedirectTo
          });
          return { data: { user: null, session: null }, error };
        }
        if ("phone" in credentials) {
          const { phone, options } = credentials;
          const { data, error } = await _request(this.fetch, "POST", `${this.url}/otp`, {
            headers: this.headers,
            body: {
              phone,
              data: (_c = options === null || options === void 0 ? void 0 : options.data) !== null && _c !== void 0 ? _c : {},
              create_user: (_d = options === null || options === void 0 ? void 0 : options.shouldCreateUser) !== null && _d !== void 0 ? _d : true,
              gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken },
              channel: (_e = options === null || options === void 0 ? void 0 : options.channel) !== null && _e !== void 0 ? _e : "sms"
            }
          });
          return { data: { user: null, session: null, messageId: data === null || data === void 0 ? void 0 : data.message_id }, error };
        }
        throw new AuthInvalidCredentialsError("You must provide either an email or phone number.");
      } catch (error) {
        if (isAuthError(error)) {
          return { data: { user: null, session: null }, error };
        }
        throw error;
      }
    }
    /**
     * Log in a user given a User supplied OTP or TokenHash received through mobile or email.
     */
    async verifyOtp(params) {
      var _a, _b;
      try {
        let redirectTo = void 0;
        let captchaToken = void 0;
        if ("options" in params) {
          redirectTo = (_a = params.options) === null || _a === void 0 ? void 0 : _a.redirectTo;
          captchaToken = (_b = params.options) === null || _b === void 0 ? void 0 : _b.captchaToken;
        }
        const { data, error } = await _request(this.fetch, "POST", `${this.url}/verify`, {
          headers: this.headers,
          body: Object.assign(Object.assign({}, params), { gotrue_meta_security: { captcha_token: captchaToken } }),
          redirectTo,
          xform: _sessionResponse
        });
        if (error) {
          throw error;
        }
        if (!data) {
          throw new Error("An error occurred on token verification.");
        }
        const session = data.session;
        const user = data.user;
        if (session === null || session === void 0 ? void 0 : session.access_token) {
          await this._saveSession(session);
          await this._notifyAllSubscribers(params.type == "recovery" ? "PASSWORD_RECOVERY" : "SIGNED_IN", session);
        }
        return { data: { user, session }, error: null };
      } catch (error) {
        if (isAuthError(error)) {
          return { data: { user: null, session: null }, error };
        }
        throw error;
      }
    }
    /**
     * Attempts a single-sign on using an enterprise Identity Provider. A
     * successful SSO attempt will redirect the current page to the identity
     * provider authorization page. The redirect URL is implementation and SSO
     * protocol specific.
     *
     * You can use it by providing a SSO domain. Typically you can extract this
     * domain by asking users for their email address. If this domain is
     * registered on the Auth instance the redirect will use that organization's
     * currently active SSO Identity Provider for the login.
     *
     * If you have built an organization-specific login page, you can use the
     * organization's SSO Identity Provider UUID directly instead.
     */
    async signInWithSSO(params) {
      var _a, _b, _c;
      try {
        let codeChallenge = null;
        let codeChallengeMethod = null;
        if (this.flowType === "pkce") {
          ;
          [codeChallenge, codeChallengeMethod] = await getCodeChallengeAndMethod(this.storage, this.storageKey);
        }
        return await _request(this.fetch, "POST", `${this.url}/sso`, {
          body: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, "providerId" in params ? { provider_id: params.providerId } : null), "domain" in params ? { domain: params.domain } : null), { redirect_to: (_b = (_a = params.options) === null || _a === void 0 ? void 0 : _a.redirectTo) !== null && _b !== void 0 ? _b : void 0 }), ((_c = params === null || params === void 0 ? void 0 : params.options) === null || _c === void 0 ? void 0 : _c.captchaToken) ? { gotrue_meta_security: { captcha_token: params.options.captchaToken } } : null), { skip_http_redirect: true, code_challenge: codeChallenge, code_challenge_method: codeChallengeMethod }),
          headers: this.headers,
          xform: _ssoResponse
        });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: null, error };
        }
        throw error;
      }
    }
    /**
     * Sends a reauthentication OTP to the user's email or phone number.
     * Requires the user to be signed-in.
     */
    async reauthenticate() {
      await this.initializePromise;
      return await this._acquireLock(-1, async () => {
        return await this._reauthenticate();
      });
    }
    async _reauthenticate() {
      try {
        return await this._useSession(async (result) => {
          const { data: { session }, error: sessionError } = result;
          if (sessionError)
            throw sessionError;
          if (!session)
            throw new AuthSessionMissingError();
          const { error } = await _request(this.fetch, "GET", `${this.url}/reauthenticate`, {
            headers: this.headers,
            jwt: session.access_token
          });
          return { data: { user: null, session: null }, error };
        });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: { user: null, session: null }, error };
        }
        throw error;
      }
    }
    /**
     * Resends an existing signup confirmation email, email change email, SMS OTP or phone change OTP.
     */
    async resend(credentials) {
      try {
        const endpoint = `${this.url}/resend`;
        if ("email" in credentials) {
          const { email, type, options } = credentials;
          const { error } = await _request(this.fetch, "POST", endpoint, {
            headers: this.headers,
            body: {
              email,
              type,
              gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken }
            },
            redirectTo: options === null || options === void 0 ? void 0 : options.emailRedirectTo
          });
          return { data: { user: null, session: null }, error };
        } else if ("phone" in credentials) {
          const { phone, type, options } = credentials;
          const { data, error } = await _request(this.fetch, "POST", endpoint, {
            headers: this.headers,
            body: {
              phone,
              type,
              gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken }
            }
          });
          return { data: { user: null, session: null, messageId: data === null || data === void 0 ? void 0 : data.message_id }, error };
        }
        throw new AuthInvalidCredentialsError("You must provide either an email or phone number and a type");
      } catch (error) {
        if (isAuthError(error)) {
          return { data: { user: null, session: null }, error };
        }
        throw error;
      }
    }
    /**
     * Returns the session, refreshing it if necessary.
     *
     * The session returned can be null if the session is not detected which can happen in the event a user is not signed-in or has logged out.
     *
     * **IMPORTANT:** This method loads values directly from the storage attached
     * to the client. If that storage is based on request cookies for example,
     * the values in it may not be authentic and therefore it's strongly advised
     * against using this method and its results in such circumstances. A warning
     * will be emitted if this is detected. Use {@link #getUser()} instead.
     */
    async getSession() {
      await this.initializePromise;
      const result = await this._acquireLock(-1, async () => {
        return this._useSession(async (result2) => {
          return result2;
        });
      });
      return result;
    }
    /**
     * Acquires a global lock based on the storage key.
     */
    async _acquireLock(acquireTimeout, fn) {
      this._debug("#_acquireLock", "begin", acquireTimeout);
      try {
        if (this.lockAcquired) {
          const last = this.pendingInLock.length ? this.pendingInLock[this.pendingInLock.length - 1] : Promise.resolve();
          const result = (async () => {
            await last;
            return await fn();
          })();
          this.pendingInLock.push((async () => {
            try {
              await result;
            } catch (e) {
            }
          })());
          return result;
        }
        return await this.lock(`lock:${this.storageKey}`, acquireTimeout, async () => {
          this._debug("#_acquireLock", "lock acquired for storage key", this.storageKey);
          try {
            this.lockAcquired = true;
            const result = fn();
            this.pendingInLock.push((async () => {
              try {
                await result;
              } catch (e) {
              }
            })());
            await result;
            while (this.pendingInLock.length) {
              const waitOn = [...this.pendingInLock];
              await Promise.all(waitOn);
              this.pendingInLock.splice(0, waitOn.length);
            }
            return await result;
          } finally {
            this._debug("#_acquireLock", "lock released for storage key", this.storageKey);
            this.lockAcquired = false;
          }
        });
      } finally {
        this._debug("#_acquireLock", "end");
      }
    }
    /**
     * Use instead of {@link #getSession} inside the library. It is
     * semantically usually what you want, as getting a session involves some
     * processing afterwards that requires only one client operating on the
     * session at once across multiple tabs or processes.
     */
    async _useSession(fn) {
      this._debug("#_useSession", "begin");
      try {
        const result = await this.__loadSession();
        return await fn(result);
      } finally {
        this._debug("#_useSession", "end");
      }
    }
    /**
     * NEVER USE DIRECTLY!
     *
     * Always use {@link #_useSession}.
     */
    async __loadSession() {
      this._debug("#__loadSession()", "begin");
      if (!this.lockAcquired) {
        this._debug("#__loadSession()", "used outside of an acquired lock!", new Error().stack);
      }
      try {
        let currentSession = null;
        const maybeSession = await getItemAsync(this.storage, this.storageKey);
        this._debug("#getSession()", "session from storage", maybeSession);
        if (maybeSession !== null) {
          if (this._isValidSession(maybeSession)) {
            currentSession = maybeSession;
          } else {
            this._debug("#getSession()", "session from storage is not valid");
            await this._removeSession();
          }
        }
        if (!currentSession) {
          return { data: { session: null }, error: null };
        }
        const hasExpired = currentSession.expires_at ? currentSession.expires_at <= Date.now() / 1e3 : false;
        this._debug("#__loadSession()", `session has${hasExpired ? "" : " not"} expired`, "expires_at", currentSession.expires_at);
        if (!hasExpired) {
          if (this.storage.isServer) {
            let suppressWarning = this.suppressGetSessionWarning;
            const proxySession = new Proxy(currentSession, {
              get: (target, prop, receiver) => {
                if (!suppressWarning && prop === "user") {
                  console.warn("Using the user object as returned from supabase.auth.getSession() or from some supabase.auth.onAuthStateChange() events could be insecure! This value comes directly from the storage medium (usually cookies on the server) and many not be authentic. Use supabase.auth.getUser() instead which authenticates the data by contacting the Supabase Auth server.");
                  suppressWarning = true;
                  this.suppressGetSessionWarning = true;
                }
                return Reflect.get(target, prop, receiver);
              }
            });
            currentSession = proxySession;
          }
          return { data: { session: currentSession }, error: null };
        }
        const { session, error } = await this._callRefreshToken(currentSession.refresh_token);
        if (error) {
          return { data: { session: null }, error };
        }
        return { data: { session }, error: null };
      } finally {
        this._debug("#__loadSession()", "end");
      }
    }
    /**
     * Gets the current user details if there is an existing session. This method
     * performs a network request to the Supabase Auth server, so the returned
     * value is authentic and can be used to base authorization rules on.
     *
     * @param jwt Takes in an optional access token JWT. If no JWT is provided, the JWT from the current session is used.
     */
    async getUser(jwt) {
      if (jwt) {
        return await this._getUser(jwt);
      }
      await this.initializePromise;
      const result = await this._acquireLock(-1, async () => {
        return await this._getUser();
      });
      return result;
    }
    async _getUser(jwt) {
      try {
        if (jwt) {
          return await _request(this.fetch, "GET", `${this.url}/user`, {
            headers: this.headers,
            jwt,
            xform: _userResponse
          });
        }
        return await this._useSession(async (result) => {
          var _a, _b, _c;
          const { data, error } = result;
          if (error) {
            throw error;
          }
          if (!((_a = data.session) === null || _a === void 0 ? void 0 : _a.access_token) && !this.hasCustomAuthorizationHeader) {
            return { data: { user: null }, error: new AuthSessionMissingError() };
          }
          return await _request(this.fetch, "GET", `${this.url}/user`, {
            headers: this.headers,
            jwt: (_c = (_b = data.session) === null || _b === void 0 ? void 0 : _b.access_token) !== null && _c !== void 0 ? _c : void 0,
            xform: _userResponse
          });
        });
      } catch (error) {
        if (isAuthError(error)) {
          if (isAuthSessionMissingError(error)) {
            await this._removeSession();
            await removeItemAsync(this.storage, `${this.storageKey}-code-verifier`);
            await this._notifyAllSubscribers("SIGNED_OUT", null);
          }
          return { data: { user: null }, error };
        }
        throw error;
      }
    }
    /**
     * Updates user data for a logged in user.
     */
    async updateUser(attributes, options = {}) {
      await this.initializePromise;
      return await this._acquireLock(-1, async () => {
        return await this._updateUser(attributes, options);
      });
    }
    async _updateUser(attributes, options = {}) {
      try {
        return await this._useSession(async (result) => {
          const { data: sessionData, error: sessionError } = result;
          if (sessionError) {
            throw sessionError;
          }
          if (!sessionData.session) {
            throw new AuthSessionMissingError();
          }
          const session = sessionData.session;
          let codeChallenge = null;
          let codeChallengeMethod = null;
          if (this.flowType === "pkce" && attributes.email != null) {
            ;
            [codeChallenge, codeChallengeMethod] = await getCodeChallengeAndMethod(this.storage, this.storageKey);
          }
          const { data, error: userError } = await _request(this.fetch, "PUT", `${this.url}/user`, {
            headers: this.headers,
            redirectTo: options === null || options === void 0 ? void 0 : options.emailRedirectTo,
            body: Object.assign(Object.assign({}, attributes), { code_challenge: codeChallenge, code_challenge_method: codeChallengeMethod }),
            jwt: session.access_token,
            xform: _userResponse
          });
          if (userError)
            throw userError;
          session.user = data.user;
          await this._saveSession(session);
          await this._notifyAllSubscribers("USER_UPDATED", session);
          return { data: { user: session.user }, error: null };
        });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: { user: null }, error };
        }
        throw error;
      }
    }
    /**
     * Decodes a JWT (without performing any validation).
     */
    _decodeJWT(jwt) {
      return decodeJWTPayload(jwt);
    }
    /**
     * Sets the session data from the current session. If the current session is expired, setSession will take care of refreshing it to obtain a new session.
     * If the refresh token or access token in the current session is invalid, an error will be thrown.
     * @param currentSession The current session that minimally contains an access token and refresh token.
     */
    async setSession(currentSession) {
      await this.initializePromise;
      return await this._acquireLock(-1, async () => {
        return await this._setSession(currentSession);
      });
    }
    async _setSession(currentSession) {
      try {
        if (!currentSession.access_token || !currentSession.refresh_token) {
          throw new AuthSessionMissingError();
        }
        const timeNow = Date.now() / 1e3;
        let expiresAt2 = timeNow;
        let hasExpired = true;
        let session = null;
        const payload = decodeJWTPayload(currentSession.access_token);
        if (payload.exp) {
          expiresAt2 = payload.exp;
          hasExpired = expiresAt2 <= timeNow;
        }
        if (hasExpired) {
          const { session: refreshedSession, error } = await this._callRefreshToken(currentSession.refresh_token);
          if (error) {
            return { data: { user: null, session: null }, error };
          }
          if (!refreshedSession) {
            return { data: { user: null, session: null }, error: null };
          }
          session = refreshedSession;
        } else {
          const { data, error } = await this._getUser(currentSession.access_token);
          if (error) {
            throw error;
          }
          session = {
            access_token: currentSession.access_token,
            refresh_token: currentSession.refresh_token,
            user: data.user,
            token_type: "bearer",
            expires_in: expiresAt2 - timeNow,
            expires_at: expiresAt2
          };
          await this._saveSession(session);
          await this._notifyAllSubscribers("SIGNED_IN", session);
        }
        return { data: { user: session.user, session }, error: null };
      } catch (error) {
        if (isAuthError(error)) {
          return { data: { session: null, user: null }, error };
        }
        throw error;
      }
    }
    /**
     * Returns a new session, regardless of expiry status.
     * Takes in an optional current session. If not passed in, then refreshSession() will attempt to retrieve it from getSession().
     * If the current session's refresh token is invalid, an error will be thrown.
     * @param currentSession The current session. If passed in, it must contain a refresh token.
     */
    async refreshSession(currentSession) {
      await this.initializePromise;
      return await this._acquireLock(-1, async () => {
        return await this._refreshSession(currentSession);
      });
    }
    async _refreshSession(currentSession) {
      try {
        return await this._useSession(async (result) => {
          var _a;
          if (!currentSession) {
            const { data, error: error2 } = result;
            if (error2) {
              throw error2;
            }
            currentSession = (_a = data.session) !== null && _a !== void 0 ? _a : void 0;
          }
          if (!(currentSession === null || currentSession === void 0 ? void 0 : currentSession.refresh_token)) {
            throw new AuthSessionMissingError();
          }
          const { session, error } = await this._callRefreshToken(currentSession.refresh_token);
          if (error) {
            return { data: { user: null, session: null }, error };
          }
          if (!session) {
            return { data: { user: null, session: null }, error: null };
          }
          return { data: { user: session.user, session }, error: null };
        });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: { user: null, session: null }, error };
        }
        throw error;
      }
    }
    /**
     * Gets the session data from a URL string
     */
    async _getSessionFromURL(isPKCEFlow) {
      try {
        if (!isBrowser())
          throw new AuthImplicitGrantRedirectError("No browser detected.");
        if (this.flowType === "implicit" && !this._isImplicitGrantFlow()) {
          throw new AuthImplicitGrantRedirectError("Not a valid implicit grant flow url.");
        } else if (this.flowType == "pkce" && !isPKCEFlow) {
          throw new AuthPKCEGrantCodeExchangeError("Not a valid PKCE flow url.");
        }
        const params = parseParametersFromURL(window.location.href);
        if (isPKCEFlow) {
          if (!params.code)
            throw new AuthPKCEGrantCodeExchangeError("No code detected.");
          const { data: data2, error: error2 } = await this._exchangeCodeForSession(params.code);
          if (error2)
            throw error2;
          const url = new URL(window.location.href);
          url.searchParams.delete("code");
          window.history.replaceState(window.history.state, "", url.toString());
          return { data: { session: data2.session, redirectType: null }, error: null };
        }
        if (params.error || params.error_description || params.error_code) {
          throw new AuthImplicitGrantRedirectError(params.error_description || "Error in URL with unspecified error_description", {
            error: params.error || "unspecified_error",
            code: params.error_code || "unspecified_code"
          });
        }
        const { provider_token, provider_refresh_token, access_token, refresh_token, expires_in, expires_at, token_type } = params;
        if (!access_token || !expires_in || !refresh_token || !token_type) {
          throw new AuthImplicitGrantRedirectError("No session defined in URL");
        }
        const timeNow = Math.round(Date.now() / 1e3);
        const expiresIn = parseInt(expires_in);
        let expiresAt2 = timeNow + expiresIn;
        if (expires_at) {
          expiresAt2 = parseInt(expires_at);
        }
        const actuallyExpiresIn = expiresAt2 - timeNow;
        if (actuallyExpiresIn * 1e3 <= AUTO_REFRESH_TICK_DURATION) {
          console.warn(`@supabase/gotrue-js: Session as retrieved from URL expires in ${actuallyExpiresIn}s, should have been closer to ${expiresIn}s`);
        }
        const issuedAt = expiresAt2 - expiresIn;
        if (timeNow - issuedAt >= 120) {
          console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued over 120s ago, URL could be stale", issuedAt, expiresAt2, timeNow);
        } else if (timeNow - issuedAt < 0) {
          console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued in the future? Check the device clock for skew", issuedAt, expiresAt2, timeNow);
        }
        const { data, error } = await this._getUser(access_token);
        if (error)
          throw error;
        const session = {
          provider_token,
          provider_refresh_token,
          access_token,
          expires_in: expiresIn,
          expires_at: expiresAt2,
          refresh_token,
          token_type,
          user: data.user
        };
        window.location.hash = "";
        this._debug("#_getSessionFromURL()", "clearing window.location.hash");
        return { data: { session, redirectType: params.type }, error: null };
      } catch (error) {
        if (isAuthError(error)) {
          return { data: { session: null, redirectType: null }, error };
        }
        throw error;
      }
    }
    /**
     * Checks if the current URL contains parameters given by an implicit oauth grant flow (https://www.rfc-editor.org/rfc/rfc6749.html#section-4.2)
     */
    _isImplicitGrantFlow() {
      const params = parseParametersFromURL(window.location.href);
      return !!(isBrowser() && (params.access_token || params.error_description));
    }
    /**
     * Checks if the current URL and backing storage contain parameters given by a PKCE flow
     */
    async _isPKCEFlow() {
      const params = parseParametersFromURL(window.location.href);
      const currentStorageContent = await getItemAsync(this.storage, `${this.storageKey}-code-verifier`);
      return !!(params.code && currentStorageContent);
    }
    /**
     * Inside a browser context, `signOut()` will remove the logged in user from the browser session and log them out - removing all items from localstorage and then trigger a `"SIGNED_OUT"` event.
     *
     * For server-side management, you can revoke all refresh tokens for a user by passing a user's JWT through to `auth.api.signOut(JWT: string)`.
     * There is no way to revoke a user's access token jwt until it expires. It is recommended to set a shorter expiry on the jwt for this reason.
     *
     * If using `others` scope, no `SIGNED_OUT` event is fired!
     */
    async signOut(options = { scope: "global" }) {
      await this.initializePromise;
      return await this._acquireLock(-1, async () => {
        return await this._signOut(options);
      });
    }
    async _signOut({ scope } = { scope: "global" }) {
      return await this._useSession(async (result) => {
        var _a;
        const { data, error: sessionError } = result;
        if (sessionError) {
          return { error: sessionError };
        }
        const accessToken = (_a = data.session) === null || _a === void 0 ? void 0 : _a.access_token;
        if (accessToken) {
          const { error } = await this.admin.signOut(accessToken, scope);
          if (error) {
            if (!(isAuthApiError(error) && (error.status === 404 || error.status === 401 || error.status === 403))) {
              return { error };
            }
          }
        }
        if (scope !== "others") {
          await this._removeSession();
          await removeItemAsync(this.storage, `${this.storageKey}-code-verifier`);
          await this._notifyAllSubscribers("SIGNED_OUT", null);
        }
        return { error: null };
      });
    }
    /**
     * Receive a notification every time an auth event happens.
     * @param callback A callback function to be invoked when an auth event happens.
     */
    onAuthStateChange(callback) {
      const id = uuid();
      const subscription = {
        id,
        callback,
        unsubscribe: () => {
          this._debug("#unsubscribe()", "state change callback with id removed", id);
          this.stateChangeEmitters.delete(id);
        }
      };
      this._debug("#onAuthStateChange()", "registered callback with id", id);
      this.stateChangeEmitters.set(id, subscription);
      (async () => {
        await this.initializePromise;
        await this._acquireLock(-1, async () => {
          this._emitInitialSession(id);
        });
      })();
      return { data: { subscription } };
    }
    async _emitInitialSession(id) {
      return await this._useSession(async (result) => {
        var _a, _b;
        try {
          const { data: { session }, error } = result;
          if (error)
            throw error;
          await ((_a = this.stateChangeEmitters.get(id)) === null || _a === void 0 ? void 0 : _a.callback("INITIAL_SESSION", session));
          this._debug("INITIAL_SESSION", "callback id", id, "session", session);
        } catch (err2) {
          await ((_b = this.stateChangeEmitters.get(id)) === null || _b === void 0 ? void 0 : _b.callback("INITIAL_SESSION", null));
          this._debug("INITIAL_SESSION", "callback id", id, "error", err2);
          console.error(err2);
        }
      });
    }
    /**
     * Sends a password reset request to an email address. This method supports the PKCE flow.
     *
     * @param email The email address of the user.
     * @param options.redirectTo The URL to send the user to after they click the password reset link.
     * @param options.captchaToken Verification token received when the user completes the captcha on the site.
     */
    async resetPasswordForEmail(email, options = {}) {
      let codeChallenge = null;
      let codeChallengeMethod = null;
      if (this.flowType === "pkce") {
        ;
        [codeChallenge, codeChallengeMethod] = await getCodeChallengeAndMethod(
          this.storage,
          this.storageKey,
          true
          // isPasswordRecovery
        );
      }
      try {
        return await _request(this.fetch, "POST", `${this.url}/recover`, {
          body: {
            email,
            code_challenge: codeChallenge,
            code_challenge_method: codeChallengeMethod,
            gotrue_meta_security: { captcha_token: options.captchaToken }
          },
          headers: this.headers,
          redirectTo: options.redirectTo
        });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: null, error };
        }
        throw error;
      }
    }
    /**
     * Gets all the identities linked to a user.
     */
    async getUserIdentities() {
      var _a;
      try {
        const { data, error } = await this.getUser();
        if (error)
          throw error;
        return { data: { identities: (_a = data.user.identities) !== null && _a !== void 0 ? _a : [] }, error: null };
      } catch (error) {
        if (isAuthError(error)) {
          return { data: null, error };
        }
        throw error;
      }
    }
    /**
     * Links an oauth identity to an existing user.
     * This method supports the PKCE flow.
     */
    async linkIdentity(credentials) {
      var _a;
      try {
        const { data, error } = await this._useSession(async (result) => {
          var _a2, _b, _c, _d, _e;
          const { data: data2, error: error2 } = result;
          if (error2)
            throw error2;
          const url = await this._getUrlForProvider(`${this.url}/user/identities/authorize`, credentials.provider, {
            redirectTo: (_a2 = credentials.options) === null || _a2 === void 0 ? void 0 : _a2.redirectTo,
            scopes: (_b = credentials.options) === null || _b === void 0 ? void 0 : _b.scopes,
            queryParams: (_c = credentials.options) === null || _c === void 0 ? void 0 : _c.queryParams,
            skipBrowserRedirect: true
          });
          return await _request(this.fetch, "GET", url, {
            headers: this.headers,
            jwt: (_e = (_d = data2.session) === null || _d === void 0 ? void 0 : _d.access_token) !== null && _e !== void 0 ? _e : void 0
          });
        });
        if (error)
          throw error;
        if (isBrowser() && !((_a = credentials.options) === null || _a === void 0 ? void 0 : _a.skipBrowserRedirect)) {
          window.location.assign(data === null || data === void 0 ? void 0 : data.url);
        }
        return { data: { provider: credentials.provider, url: data === null || data === void 0 ? void 0 : data.url }, error: null };
      } catch (error) {
        if (isAuthError(error)) {
          return { data: { provider: credentials.provider, url: null }, error };
        }
        throw error;
      }
    }
    /**
     * Unlinks an identity from a user by deleting it. The user will no longer be able to sign in with that identity once it's unlinked.
     */
    async unlinkIdentity(identity) {
      try {
        return await this._useSession(async (result) => {
          var _a, _b;
          const { data, error } = result;
          if (error) {
            throw error;
          }
          return await _request(this.fetch, "DELETE", `${this.url}/user/identities/${identity.identity_id}`, {
            headers: this.headers,
            jwt: (_b = (_a = data.session) === null || _a === void 0 ? void 0 : _a.access_token) !== null && _b !== void 0 ? _b : void 0
          });
        });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: null, error };
        }
        throw error;
      }
    }
    /**
     * Generates a new JWT.
     * @param refreshToken A valid refresh token that was returned on login.
     */
    async _refreshAccessToken(refreshToken) {
      const debugName = `#_refreshAccessToken(${refreshToken.substring(0, 5)}...)`;
      this._debug(debugName, "begin");
      try {
        const startedAt = Date.now();
        return await retryable(async (attempt) => {
          if (attempt > 0) {
            await sleep(200 * Math.pow(2, attempt - 1));
          }
          this._debug(debugName, "refreshing attempt", attempt);
          return await _request(this.fetch, "POST", `${this.url}/token?grant_type=refresh_token`, {
            body: { refresh_token: refreshToken },
            headers: this.headers,
            xform: _sessionResponse
          });
        }, (attempt, error) => {
          const nextBackOffInterval = 200 * Math.pow(2, attempt);
          return error && isAuthRetryableFetchError(error) && // retryable only if the request can be sent before the backoff overflows the tick duration
          Date.now() + nextBackOffInterval - startedAt < AUTO_REFRESH_TICK_DURATION;
        });
      } catch (error) {
        this._debug(debugName, "error", error);
        if (isAuthError(error)) {
          return { data: { session: null, user: null }, error };
        }
        throw error;
      } finally {
        this._debug(debugName, "end");
      }
    }
    _isValidSession(maybeSession) {
      const isValidSession = typeof maybeSession === "object" && maybeSession !== null && "access_token" in maybeSession && "refresh_token" in maybeSession && "expires_at" in maybeSession;
      return isValidSession;
    }
    async _handleProviderSignIn(provider, options) {
      const url = await this._getUrlForProvider(`${this.url}/authorize`, provider, {
        redirectTo: options.redirectTo,
        scopes: options.scopes,
        queryParams: options.queryParams
      });
      this._debug("#_handleProviderSignIn()", "provider", provider, "options", options, "url", url);
      if (isBrowser() && !options.skipBrowserRedirect) {
        window.location.assign(url);
      }
      return { data: { provider, url }, error: null };
    }
    /**
     * Recovers the session from LocalStorage and refreshes
     * Note: this method is async to accommodate for AsyncStorage e.g. in React native.
     */
    async _recoverAndRefresh() {
      var _a;
      const debugName = "#_recoverAndRefresh()";
      this._debug(debugName, "begin");
      try {
        const currentSession = await getItemAsync(this.storage, this.storageKey);
        this._debug(debugName, "session from storage", currentSession);
        if (!this._isValidSession(currentSession)) {
          this._debug(debugName, "session is not valid");
          if (currentSession !== null) {
            await this._removeSession();
          }
          return;
        }
        const timeNow = Math.round(Date.now() / 1e3);
        const expiresWithMargin = ((_a = currentSession.expires_at) !== null && _a !== void 0 ? _a : Infinity) < timeNow + EXPIRY_MARGIN;
        this._debug(debugName, `session has${expiresWithMargin ? "" : " not"} expired with margin of ${EXPIRY_MARGIN}s`);
        if (expiresWithMargin) {
          if (this.autoRefreshToken && currentSession.refresh_token) {
            const { error } = await this._callRefreshToken(currentSession.refresh_token);
            if (error) {
              console.error(error);
              if (!isAuthRetryableFetchError(error)) {
                this._debug(debugName, "refresh failed with a non-retryable error, removing the session", error);
                await this._removeSession();
              }
            }
          }
        } else {
          await this._notifyAllSubscribers("SIGNED_IN", currentSession);
        }
      } catch (err2) {
        this._debug(debugName, "error", err2);
        console.error(err2);
        return;
      } finally {
        this._debug(debugName, "end");
      }
    }
    async _callRefreshToken(refreshToken) {
      var _a, _b;
      if (!refreshToken) {
        throw new AuthSessionMissingError();
      }
      if (this.refreshingDeferred) {
        return this.refreshingDeferred.promise;
      }
      const debugName = `#_callRefreshToken(${refreshToken.substring(0, 5)}...)`;
      this._debug(debugName, "begin");
      try {
        this.refreshingDeferred = new Deferred();
        const { data, error } = await this._refreshAccessToken(refreshToken);
        if (error)
          throw error;
        if (!data.session)
          throw new AuthSessionMissingError();
        await this._saveSession(data.session);
        await this._notifyAllSubscribers("TOKEN_REFRESHED", data.session);
        const result = { session: data.session, error: null };
        this.refreshingDeferred.resolve(result);
        return result;
      } catch (error) {
        this._debug(debugName, "error", error);
        if (isAuthError(error)) {
          const result = { session: null, error };
          if (!isAuthRetryableFetchError(error)) {
            await this._removeSession();
            await this._notifyAllSubscribers("SIGNED_OUT", null);
          }
          (_a = this.refreshingDeferred) === null || _a === void 0 ? void 0 : _a.resolve(result);
          return result;
        }
        (_b = this.refreshingDeferred) === null || _b === void 0 ? void 0 : _b.reject(error);
        throw error;
      } finally {
        this.refreshingDeferred = null;
        this._debug(debugName, "end");
      }
    }
    async _notifyAllSubscribers(event, session, broadcast = true) {
      const debugName = `#_notifyAllSubscribers(${event})`;
      this._debug(debugName, "begin", session, `broadcast = ${broadcast}`);
      try {
        if (this.broadcastChannel && broadcast) {
          this.broadcastChannel.postMessage({ event, session });
        }
        const errors = [];
        const promises = Array.from(this.stateChangeEmitters.values()).map(async (x) => {
          try {
            await x.callback(event, session);
          } catch (e) {
            errors.push(e);
          }
        });
        await Promise.all(promises);
        if (errors.length > 0) {
          for (let i = 0; i < errors.length; i += 1) {
            console.error(errors[i]);
          }
          throw errors[0];
        }
      } finally {
        this._debug(debugName, "end");
      }
    }
    /**
     * set currentSession and currentUser
     * process to _startAutoRefreshToken if possible
     */
    async _saveSession(session) {
      this._debug("#_saveSession()", session);
      this.suppressGetSessionWarning = true;
      await setItemAsync(this.storage, this.storageKey, session);
    }
    async _removeSession() {
      this._debug("#_removeSession()");
      await removeItemAsync(this.storage, this.storageKey);
    }
    /**
     * Removes any registered visibilitychange callback.
     *
     * {@see #startAutoRefresh}
     * {@see #stopAutoRefresh}
     */
    _removeVisibilityChangedCallback() {
      this._debug("#_removeVisibilityChangedCallback()");
      const callback = this.visibilityChangedCallback;
      this.visibilityChangedCallback = null;
      try {
        if (callback && isBrowser() && (window === null || window === void 0 ? void 0 : window.removeEventListener)) {
          window.removeEventListener("visibilitychange", callback);
        }
      } catch (e) {
        console.error("removing visibilitychange callback failed", e);
      }
    }
    /**
     * This is the private implementation of {@link #startAutoRefresh}. Use this
     * within the library.
     */
    async _startAutoRefresh() {
      await this._stopAutoRefresh();
      this._debug("#_startAutoRefresh()");
      const ticker = setInterval(() => this._autoRefreshTokenTick(), AUTO_REFRESH_TICK_DURATION);
      this.autoRefreshTicker = ticker;
      if (ticker && typeof ticker === "object" && typeof ticker.unref === "function") {
        ticker.unref();
      } else if (typeof Deno !== "undefined" && typeof Deno.unrefTimer === "function") {
        Deno.unrefTimer(ticker);
      }
      setTimeout(async () => {
        await this.initializePromise;
        await this._autoRefreshTokenTick();
      }, 0);
    }
    /**
     * This is the private implementation of {@link #stopAutoRefresh}. Use this
     * within the library.
     */
    async _stopAutoRefresh() {
      this._debug("#_stopAutoRefresh()");
      const ticker = this.autoRefreshTicker;
      this.autoRefreshTicker = null;
      if (ticker) {
        clearInterval(ticker);
      }
    }
    /**
     * Starts an auto-refresh process in the background. The session is checked
     * every few seconds. Close to the time of expiration a process is started to
     * refresh the session. If refreshing fails it will be retried for as long as
     * necessary.
     *
     * If you set the {@link GoTrueClientOptions#autoRefreshToken} you don't need
     * to call this function, it will be called for you.
     *
     * On browsers the refresh process works only when the tab/window is in the
     * foreground to conserve resources as well as prevent race conditions and
     * flooding auth with requests. If you call this method any managed
     * visibility change callback will be removed and you must manage visibility
     * changes on your own.
     *
     * On non-browser platforms the refresh process works *continuously* in the
     * background, which may not be desirable. You should hook into your
     * platform's foreground indication mechanism and call these methods
     * appropriately to conserve resources.
     *
     * {@see #stopAutoRefresh}
     */
    async startAutoRefresh() {
      this._removeVisibilityChangedCallback();
      await this._startAutoRefresh();
    }
    /**
     * Stops an active auto refresh process running in the background (if any).
     *
     * If you call this method any managed visibility change callback will be
     * removed and you must manage visibility changes on your own.
     *
     * See {@link #startAutoRefresh} for more details.
     */
    async stopAutoRefresh() {
      this._removeVisibilityChangedCallback();
      await this._stopAutoRefresh();
    }
    /**
     * Runs the auto refresh token tick.
     */
    async _autoRefreshTokenTick() {
      this._debug("#_autoRefreshTokenTick()", "begin");
      try {
        await this._acquireLock(0, async () => {
          try {
            const now = Date.now();
            try {
              return await this._useSession(async (result) => {
                const { data: { session } } = result;
                if (!session || !session.refresh_token || !session.expires_at) {
                  this._debug("#_autoRefreshTokenTick()", "no session");
                  return;
                }
                const expiresInTicks = Math.floor((session.expires_at * 1e3 - now) / AUTO_REFRESH_TICK_DURATION);
                this._debug("#_autoRefreshTokenTick()", `access token expires in ${expiresInTicks} ticks, a tick lasts ${AUTO_REFRESH_TICK_DURATION}ms, refresh threshold is ${AUTO_REFRESH_TICK_THRESHOLD} ticks`);
                if (expiresInTicks <= AUTO_REFRESH_TICK_THRESHOLD) {
                  await this._callRefreshToken(session.refresh_token);
                }
              });
            } catch (e) {
              console.error("Auto refresh tick failed with error. This is likely a transient error.", e);
            }
          } finally {
            this._debug("#_autoRefreshTokenTick()", "end");
          }
        });
      } catch (e) {
        if (e.isAcquireTimeout || e instanceof LockAcquireTimeoutError) {
          this._debug("auto refresh token tick lock not available");
        } else {
          throw e;
        }
      }
    }
    /**
     * Registers callbacks on the browser / platform, which in-turn run
     * algorithms when the browser window/tab are in foreground. On non-browser
     * platforms it assumes always foreground.
     */
    async _handleVisibilityChange() {
      this._debug("#_handleVisibilityChange()");
      if (!isBrowser() || !(window === null || window === void 0 ? void 0 : window.addEventListener)) {
        if (this.autoRefreshToken) {
          this.startAutoRefresh();
        }
        return false;
      }
      try {
        this.visibilityChangedCallback = async () => await this._onVisibilityChanged(false);
        window === null || window === void 0 ? void 0 : window.addEventListener("visibilitychange", this.visibilityChangedCallback);
        await this._onVisibilityChanged(true);
      } catch (error) {
        console.error("_handleVisibilityChange", error);
      }
    }
    /**
     * Callback registered with `window.addEventListener('visibilitychange')`.
     */
    async _onVisibilityChanged(calledFromInitialize) {
      const methodName = `#_onVisibilityChanged(${calledFromInitialize})`;
      this._debug(methodName, "visibilityState", document.visibilityState);
      if (document.visibilityState === "visible") {
        if (this.autoRefreshToken) {
          this._startAutoRefresh();
        }
        if (!calledFromInitialize) {
          await this.initializePromise;
          await this._acquireLock(-1, async () => {
            if (document.visibilityState !== "visible") {
              this._debug(methodName, "acquired the lock to recover the session, but the browser visibilityState is no longer visible, aborting");
              return;
            }
            await this._recoverAndRefresh();
          });
        }
      } else if (document.visibilityState === "hidden") {
        if (this.autoRefreshToken) {
          this._stopAutoRefresh();
        }
      }
    }
    /**
     * Generates the relevant login URL for a third-party provider.
     * @param options.redirectTo A URL or mobile address to send the user to after they are confirmed.
     * @param options.scopes A space-separated list of scopes granted to the OAuth application.
     * @param options.queryParams An object of key-value pairs containing query parameters granted to the OAuth application.
     */
    async _getUrlForProvider(url, provider, options) {
      const urlParams = [`provider=${encodeURIComponent(provider)}`];
      if (options === null || options === void 0 ? void 0 : options.redirectTo) {
        urlParams.push(`redirect_to=${encodeURIComponent(options.redirectTo)}`);
      }
      if (options === null || options === void 0 ? void 0 : options.scopes) {
        urlParams.push(`scopes=${encodeURIComponent(options.scopes)}`);
      }
      if (this.flowType === "pkce") {
        const [codeChallenge, codeChallengeMethod] = await getCodeChallengeAndMethod(this.storage, this.storageKey);
        const flowParams = new URLSearchParams({
          code_challenge: `${encodeURIComponent(codeChallenge)}`,
          code_challenge_method: `${encodeURIComponent(codeChallengeMethod)}`
        });
        urlParams.push(flowParams.toString());
      }
      if (options === null || options === void 0 ? void 0 : options.queryParams) {
        const query = new URLSearchParams(options.queryParams);
        urlParams.push(query.toString());
      }
      if (options === null || options === void 0 ? void 0 : options.skipBrowserRedirect) {
        urlParams.push(`skip_http_redirect=${options.skipBrowserRedirect}`);
      }
      return `${url}?${urlParams.join("&")}`;
    }
    async _unenroll(params) {
      try {
        return await this._useSession(async (result) => {
          var _a;
          const { data: sessionData, error: sessionError } = result;
          if (sessionError) {
            return { data: null, error: sessionError };
          }
          return await _request(this.fetch, "DELETE", `${this.url}/factors/${params.factorId}`, {
            headers: this.headers,
            jwt: (_a = sessionData === null || sessionData === void 0 ? void 0 : sessionData.session) === null || _a === void 0 ? void 0 : _a.access_token
          });
        });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: null, error };
        }
        throw error;
      }
    }
    /**
     * {@see GoTrueMFAApi#enroll}
     */
    async _enroll(params) {
      try {
        return await this._useSession(async (result) => {
          var _a, _b;
          const { data: sessionData, error: sessionError } = result;
          if (sessionError) {
            return { data: null, error: sessionError };
          }
          const body = Object.assign({ friendly_name: params.friendlyName, factor_type: params.factorType }, params.factorType === "phone" ? { phone: params.phone } : { issuer: params.issuer });
          const { data, error } = await _request(this.fetch, "POST", `${this.url}/factors`, {
            body,
            headers: this.headers,
            jwt: (_a = sessionData === null || sessionData === void 0 ? void 0 : sessionData.session) === null || _a === void 0 ? void 0 : _a.access_token
          });
          if (error) {
            return { data: null, error };
          }
          if (params.factorType === "phone") {
            delete data.totp;
          }
          if (params.factorType === "totp" && ((_b = data === null || data === void 0 ? void 0 : data.totp) === null || _b === void 0 ? void 0 : _b.qr_code)) {
            data.totp.qr_code = `data:image/svg+xml;utf-8,${data.totp.qr_code}`;
          }
          return { data, error: null };
        });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: null, error };
        }
        throw error;
      }
    }
    /**
     * {@see GoTrueMFAApi#verify}
     */
    async _verify(params) {
      return this._acquireLock(-1, async () => {
        try {
          return await this._useSession(async (result) => {
            var _a;
            const { data: sessionData, error: sessionError } = result;
            if (sessionError) {
              return { data: null, error: sessionError };
            }
            const { data, error } = await _request(this.fetch, "POST", `${this.url}/factors/${params.factorId}/verify`, {
              body: { code: params.code, challenge_id: params.challengeId },
              headers: this.headers,
              jwt: (_a = sessionData === null || sessionData === void 0 ? void 0 : sessionData.session) === null || _a === void 0 ? void 0 : _a.access_token
            });
            if (error) {
              return { data: null, error };
            }
            await this._saveSession(Object.assign({ expires_at: Math.round(Date.now() / 1e3) + data.expires_in }, data));
            await this._notifyAllSubscribers("MFA_CHALLENGE_VERIFIED", data);
            return { data, error };
          });
        } catch (error) {
          if (isAuthError(error)) {
            return { data: null, error };
          }
          throw error;
        }
      });
    }
    /**
     * {@see GoTrueMFAApi#challenge}
     */
    async _challenge(params) {
      return this._acquireLock(-1, async () => {
        try {
          return await this._useSession(async (result) => {
            var _a;
            const { data: sessionData, error: sessionError } = result;
            if (sessionError) {
              return { data: null, error: sessionError };
            }
            return await _request(this.fetch, "POST", `${this.url}/factors/${params.factorId}/challenge`, {
              body: { channel: params.channel },
              headers: this.headers,
              jwt: (_a = sessionData === null || sessionData === void 0 ? void 0 : sessionData.session) === null || _a === void 0 ? void 0 : _a.access_token
            });
          });
        } catch (error) {
          if (isAuthError(error)) {
            return { data: null, error };
          }
          throw error;
        }
      });
    }
    /**
     * {@see GoTrueMFAApi#challengeAndVerify}
     */
    async _challengeAndVerify(params) {
      const { data: challengeData, error: challengeError } = await this._challenge({
        factorId: params.factorId
      });
      if (challengeError) {
        return { data: null, error: challengeError };
      }
      return await this._verify({
        factorId: params.factorId,
        challengeId: challengeData.id,
        code: params.code
      });
    }
    /**
     * {@see GoTrueMFAApi#listFactors}
     */
    async _listFactors() {
      const { data: { user }, error: userError } = await this.getUser();
      if (userError) {
        return { data: null, error: userError };
      }
      const factors = (user === null || user === void 0 ? void 0 : user.factors) || [];
      const totp = factors.filter((factor) => factor.factor_type === "totp" && factor.status === "verified");
      const phone = factors.filter((factor) => factor.factor_type === "phone" && factor.status === "verified");
      return {
        data: {
          all: factors,
          totp,
          phone
        },
        error: null
      };
    }
    /**
     * {@see GoTrueMFAApi#getAuthenticatorAssuranceLevel}
     */
    async _getAuthenticatorAssuranceLevel() {
      return this._acquireLock(-1, async () => {
        return await this._useSession(async (result) => {
          var _a, _b;
          const { data: { session }, error: sessionError } = result;
          if (sessionError) {
            return { data: null, error: sessionError };
          }
          if (!session) {
            return {
              data: { currentLevel: null, nextLevel: null, currentAuthenticationMethods: [] },
              error: null
            };
          }
          const payload = this._decodeJWT(session.access_token);
          let currentLevel = null;
          if (payload.aal) {
            currentLevel = payload.aal;
          }
          let nextLevel = currentLevel;
          const verifiedFactors = (_b = (_a = session.user.factors) === null || _a === void 0 ? void 0 : _a.filter((factor) => factor.status === "verified")) !== null && _b !== void 0 ? _b : [];
          if (verifiedFactors.length > 0) {
            nextLevel = "aal2";
          }
          const currentAuthenticationMethods = payload.amr || [];
          return { data: { currentLevel, nextLevel, currentAuthenticationMethods }, error: null };
        });
      });
    }
  };
  GoTrueClient.nextInstanceID = 0;

  // node_modules/@supabase/auth-js/dist/module/AuthClient.js
  var AuthClient = GoTrueClient;
  var AuthClient_default = AuthClient;

  // node_modules/@supabase/supabase-js/dist/module/lib/SupabaseAuthClient.js
  var SupabaseAuthClient = class extends AuthClient_default {
    constructor(options) {
      super(options);
    }
  };

  // node_modules/@supabase/supabase-js/dist/module/SupabaseClient.js
  var __awaiter8 = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  var SupabaseClient = class {
    /**
     * Create a new client for use in the browser.
     * @param supabaseUrl The unique Supabase URL which is supplied when you create a new project in your project dashboard.
     * @param supabaseKey The unique Supabase Key which is supplied when you create a new project in your project dashboard.
     * @param options.db.schema You can switch in between schemas. The schema needs to be on the list of exposed schemas inside Supabase.
     * @param options.auth.autoRefreshToken Set to "true" if you want to automatically refresh the token before expiring.
     * @param options.auth.persistSession Set to "true" if you want to automatically save the user session into local storage.
     * @param options.auth.detectSessionInUrl Set to "true" if you want to automatically detects OAuth grants in the URL and signs in the user.
     * @param options.realtime Options passed along to realtime-js constructor.
     * @param options.global.fetch A custom fetch implementation.
     * @param options.global.headers Any additional headers to send with each network request.
     */
    constructor(supabaseUrl, supabaseKey, options) {
      var _a, _b, _c;
      this.supabaseUrl = supabaseUrl;
      this.supabaseKey = supabaseKey;
      if (!supabaseUrl)
        throw new Error("supabaseUrl is required.");
      if (!supabaseKey)
        throw new Error("supabaseKey is required.");
      const _supabaseUrl = stripTrailingSlash(supabaseUrl);
      this.realtimeUrl = `${_supabaseUrl}/realtime/v1`.replace(/^http/i, "ws");
      this.authUrl = `${_supabaseUrl}/auth/v1`;
      this.storageUrl = `${_supabaseUrl}/storage/v1`;
      this.functionsUrl = `${_supabaseUrl}/functions/v1`;
      const defaultStorageKey = `sb-${new URL(this.authUrl).hostname.split(".")[0]}-auth-token`;
      const DEFAULTS2 = {
        db: DEFAULT_DB_OPTIONS,
        realtime: DEFAULT_REALTIME_OPTIONS,
        auth: Object.assign(Object.assign({}, DEFAULT_AUTH_OPTIONS), { storageKey: defaultStorageKey }),
        global: DEFAULT_GLOBAL_OPTIONS
      };
      const settings = applySettingDefaults(options !== null && options !== void 0 ? options : {}, DEFAULTS2);
      this.storageKey = (_a = settings.auth.storageKey) !== null && _a !== void 0 ? _a : "";
      this.headers = (_b = settings.global.headers) !== null && _b !== void 0 ? _b : {};
      if (!settings.accessToken) {
        this.auth = this._initSupabaseAuthClient((_c = settings.auth) !== null && _c !== void 0 ? _c : {}, this.headers, settings.global.fetch);
      } else {
        this.accessToken = settings.accessToken;
        this.auth = new Proxy({}, {
          get: (_, prop) => {
            throw new Error(`@supabase/supabase-js: Supabase Client is configured with the accessToken option, accessing supabase.auth.${String(prop)} is not possible`);
          }
        });
      }
      this.fetch = fetchWithAuth(supabaseKey, this._getAccessToken.bind(this), settings.global.fetch);
      this.realtime = this._initRealtimeClient(Object.assign({ headers: this.headers }, settings.realtime));
      this.rest = new PostgrestClient(`${_supabaseUrl}/rest/v1`, {
        headers: this.headers,
        schema: settings.db.schema,
        fetch: this.fetch
      });
      if (!settings.accessToken) {
        this._listenForAuthEvents();
      }
    }
    /**
     * Supabase Functions allows you to deploy and invoke edge functions.
     */
    get functions() {
      return new FunctionsClient(this.functionsUrl, {
        headers: this.headers,
        customFetch: this.fetch
      });
    }
    /**
     * Supabase Storage allows you to manage user-generated content, such as photos or videos.
     */
    get storage() {
      return new StorageClient(this.storageUrl, this.headers, this.fetch);
    }
    /**
     * Perform a query on a table or a view.
     *
     * @param relation - The table or view name to query
     */
    from(relation) {
      return this.rest.from(relation);
    }
    // NOTE: signatures must be kept in sync with PostgrestClient.schema
    /**
     * Select a schema to query or perform an function (rpc) call.
     *
     * The schema needs to be on the list of exposed schemas inside Supabase.
     *
     * @param schema - The schema to query
     */
    schema(schema) {
      return this.rest.schema(schema);
    }
    // NOTE: signatures must be kept in sync with PostgrestClient.rpc
    /**
     * Perform a function call.
     *
     * @param fn - The function name to call
     * @param args - The arguments to pass to the function call
     * @param options - Named parameters
     * @param options.head - When set to `true`, `data` will not be returned.
     * Useful if you only need the count.
     * @param options.get - When set to `true`, the function will be called with
     * read-only access mode.
     * @param options.count - Count algorithm to use to count rows returned by the
     * function. Only applicable for [set-returning
     * functions](https://www.postgresql.org/docs/current/functions-srf.html).
     *
     * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
     * hood.
     *
     * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
     * statistics under the hood.
     *
     * `"estimated"`: Uses exact count for low numbers and planned count for high
     * numbers.
     */
    rpc(fn, args = {}, options = {}) {
      return this.rest.rpc(fn, args, options);
    }
    /**
     * Creates a Realtime channel with Broadcast, Presence, and Postgres Changes.
     *
     * @param {string} name - The name of the Realtime channel.
     * @param {Object} opts - The options to pass to the Realtime channel.
     *
     */
    channel(name, opts = { config: {} }) {
      return this.realtime.channel(name, opts);
    }
    /**
     * Returns all Realtime channels.
     */
    getChannels() {
      return this.realtime.getChannels();
    }
    /**
     * Unsubscribes and removes Realtime channel from Realtime client.
     *
     * @param {RealtimeChannel} channel - The name of the Realtime channel.
     *
     */
    removeChannel(channel) {
      return this.realtime.removeChannel(channel);
    }
    /**
     * Unsubscribes and removes all Realtime channels from Realtime client.
     */
    removeAllChannels() {
      return this.realtime.removeAllChannels();
    }
    _getAccessToken() {
      var _a, _b;
      return __awaiter8(this, void 0, void 0, function* () {
        if (this.accessToken) {
          return yield this.accessToken();
        }
        const { data } = yield this.auth.getSession();
        return (_b = (_a = data.session) === null || _a === void 0 ? void 0 : _a.access_token) !== null && _b !== void 0 ? _b : null;
      });
    }
    _initSupabaseAuthClient({ autoRefreshToken, persistSession, detectSessionInUrl, storage, storageKey, flowType, lock, debug }, headers, fetch3) {
      var _a;
      const authHeaders = {
        Authorization: `Bearer ${this.supabaseKey}`,
        apikey: `${this.supabaseKey}`
      };
      return new SupabaseAuthClient({
        url: this.authUrl,
        headers: Object.assign(Object.assign({}, authHeaders), headers),
        storageKey,
        autoRefreshToken,
        persistSession,
        detectSessionInUrl,
        storage,
        flowType,
        lock,
        debug,
        fetch: fetch3,
        // auth checks if there is a custom authorizaiton header using this flag
        // so it knows whether to return an error when getUser is called with no session
        hasCustomAuthorizationHeader: (_a = "Authorization" in this.headers) !== null && _a !== void 0 ? _a : false
      });
    }
    _initRealtimeClient(options) {
      return new RealtimeClient(this.realtimeUrl, Object.assign(Object.assign({}, options), { params: Object.assign({ apikey: this.supabaseKey }, options === null || options === void 0 ? void 0 : options.params) }));
    }
    _listenForAuthEvents() {
      let data = this.auth.onAuthStateChange((event, session) => {
        this._handleTokenChanged(event, "CLIENT", session === null || session === void 0 ? void 0 : session.access_token);
      });
      return data;
    }
    _handleTokenChanged(event, source, token) {
      if ((event === "TOKEN_REFRESHED" || event === "SIGNED_IN") && this.changedAccessToken !== token) {
        this.realtime.setAuth(token !== null && token !== void 0 ? token : null);
        this.changedAccessToken = token;
      } else if (event === "SIGNED_OUT") {
        this.realtime.setAuth(this.supabaseKey);
        if (source == "STORAGE")
          this.auth.signOut();
        this.changedAccessToken = void 0;
      }
    }
  };

  // node_modules/@supabase/supabase-js/dist/module/index.js
  var createClient = (supabaseUrl, supabaseKey, options) => {
    return new SupabaseClient(supabaseUrl, supabaseKey, options);
  };

  // .classroom-deploy.ts
  var import_meta = {};
  var SUPA_URL = Deno.env.get("SUPABASE_URL") ?? "";
  var SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  var ADMIN_KEY = Deno.env.get("CLASSROOM_ADMIN_KEY") ?? "";
  var sb = createClient(SUPA_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  var VERSION = "1.0.0";
  var DEFAULTS = { quorum: 7, phase_timeout_s: 75, max_rounds: 3, draw_timeout_s: 90, revise_timeout_s: 60 };
  var ONLINE_WINDOW_MS = 9e4;
  var AGENT_PROMPT = '# AI CLASSROOM agent operating prompt\n\nYou are one of ten AI CLASSROOM council members. Your mission is to help a learner with honest, sourced, understandable work. Research independently, challenge weak claims, show uncertainty, and do not invent sources. **Never name, guess, hint at, or consult public leaderboards about your model or vendor.** Standing comes only from the classroom calibration and track record.\n\nAPI: `https://bbeeodsvaxykyhxrbnvz.supabase.co/functions/v1/classroom`\n\n## Start once\n\n```bash\nexport API=\'https://bbeeodsvaxykyhxrbnvz.supabase.co/functions/v1/classroom\'\nR=$(curl -s -X POST "$API/claim" -H \'content-type: application/json\' -d \'{"name":"YOUR-UNIQUE-NAME"}\')\necho "$R"; TOKEN=$(echo "$R" | sed -n \'s/.*"token":"\\([^"]*\\)".*/\\1/p\')\n```\n\nYour first inbox normally says `needed:"calibrate"`. Answer its 15 blind mini-questions exactly once:\n`POST /calibrate` with `{"answers":[{"id":"...","answer":"..."}],"strengths":["..."],"weaknesses":["..."]}` and header `x-seat-token: $TOKEN`. Strengths are optional weak priors; do not use names of models/vendors. If any call returns 401, claim again with the same name.\n\n## Persistent lifecycle \u2014 non-negotiable\n\n**Do not send a conversational reply such as \u201CI am polling\u201D, \u201CI am in a loop\u201D, or \u201CI will wait\u201D.** A chat reply finishes the agent turn; it is not a running poller. Do not claim the loop is running unless a durable process is actually alive.\n\nInstead, start or reuse a durable background worker **before** doing council work. In Arena or another agent host, use its background-process primitive rather than a foreground shell that the host kills when a turn ends. The process has no success exit: it waits for `/inbox`, handles a wake, then immediately returns to waiting. A completed answer, drawing, calibration, failed request, or idle period is never a reason to terminate it.\n\nThis repository supplies `tools/agent-runner.sh` as the broker. Give it an executable worker adapter that receives inbox JSON on stdin and posts `/calibrate`, `/say`, `/draw`, or other required API calls. The adapter returns after one wake; **the broker\u2014not a chat response\u2014waits forever**:\n\n```bash\nexport API=\'https://bbeeodsvaxykyhxrbnvz.supabase.co/functions/v1/classroom\'\nexport AGENT_NAME=\'YOUR-UNIQUE-NAME\'\nexport AI_CLASSROOM_WORKER=\'/absolute/path/to/your-worker-adapter\'\n# Start this through the host background-process facility.\n./tools/agent-runner.sh\n```\n\nIf your host cannot preserve a process across a completed turn, use its scheduled/background-worker equivalent and reconnect on every invocation. Never falsely report that a loop survives when the host has stopped it.\n\n## Blocking wait protocol \u2014 use this, do not hand-poll\n\nUse the server long poll: `R=$(curl -s -H "x-seat-token: $TOKEN" "$API/inbox?wait=20&since=$SEQ&sheet_seq=$SSEQ")`. Wake when `"wake":true`; it means your turn, a user message, or a completed human drawing arrived. Each inbox is a small delta; update `SEQ` from `since_last`. If idle, let the process wait; do not spend reasoning/context watching it.\n\nAfter every wake: read the inbox, perform the exact required action, then immediately return to the long-poll wait. Do not end with a human-facing acknowledgement, summary, or completion message.\n\nRead `memory` first. Never request the full transcript: use `GET /search?session_id=...&q=...`, then `GET /transcript?session_id=...&from=&to=` (max 40). Quote `seq` when relying on past work. Read attached files from `context.files`, text with `/file/ID/text?from=`, or binary URLs. Knowledge-base excerpts outrank web sources and are cited `[file.pdf p.12]`.\n\n## Post formats\n\nUse `POST /say` with the seat-token header and `{task_id,kind,body,meta}`. Include `round`. Limits: note 1200, objection 1500, verify 3000, vote 300, draft 6000, final 9000, speak 1200 characters. Votes have `meta:{approve:boolean,reason}`; verifier has `meta:{claims:[{claim,verdict:"ok|wrong|unsure",source}]}`. Status is concise (`kind:"status"`) while rendering. If you made a sizable artifact, upload it \u2014 do not paste it into chat.\n\n## Roles\n\n1. **Moderator:** decompose into 2\u20134 subquestions and `meta.domains` (math, code, physics, humanities, language); coordinate the lead seat shown in inbox. Final is Markdown with Sources, Confidence, and visible Council notes for disagreement. Read a three-sentence summary with `kind:"speak"` when sound is useful.\n2. **Researcher A:** primary sources and exact facts, one sourced note.\n3. **Researcher B:** independent angle and sources; never copy A.\n4. **Researcher C:** counter-evidence, edge cases, misconceptions.\n5. **Explainer:** clear draft/revision at learner level. Address every objection and wrong/unsure verification.\n6. **Critic:** at least one concrete fixable objection or explicitly say what you checked and found no objection. Do not speak objections.\n7. **Verifier:** claim-by-claim source table; inspect KB first.\n8. **Calculator:** recompute every number/unit/formula. Backup illustrator for sandbox media work.\n9. **Illustrator:** read PNG/ops first, preserve user marks, then diagram/annotate; may watch a requested sheet with `POST /watch {sheet_id,on:true}`.\n10. **Scribe:** concise context notes; after every final, `POST /memory {session_id,body}` (\u22642500 chars: known user level, settled facts, open questions, sheet ids/descriptions). Keep output README files current.\n\n## Board card\n\nVirtual sheet is 1600\xD71000. Exact base ops are `line, arrow, rect, ellipse, path, text, math, image, erase, clear, group`, plus tombstone `undo:{seq}`. Use `POST /draw {sheet_id,ops}` (\u226460/batch, \u2264200 hard limit). Give a title \u226528px, labels \u226520px, left-to-right flow, and keep bottom-right 400\xD7250 clear for the human. Use #17a2b8 by default as illustrator. Never clear unless asked. Read `GET /sheet/ID/ops?since=0` and PNG first. Human drawing wakes watchers; respond usefully, and annotate errors with a red ellipse/text only where warranted.\n\n## Files and media card\n\nAny seat can publish a file up to 100 MB: `POST /file/begin {session_id,name,mime,bytes,path:"outputs/name.ext",learned?}`; PUT bytes to returned `upload_url` with returned headers; then `POST /file/done {file_id}`. Media is identical at `/media/begin` and `/media/done`; include `sheet_id`, caption, optional poster, and it becomes video/image/model3d on the sheet. Prefer .md/.csv/.svg/.pdf/.glb. For Blender: make scenes by script, render \u226410s / \u22642 CPU minutes, post status every ~30s, save a poster PNG, upload MP4 + poster, and state parameters. For a user .blend, download, inspect via bpy, render before claiming you saw it.\n\n## Voice and vote\n\nUse `speak` only for short helpful narration/status when sound is enabled; moderator summarizes final, explainer may narrate a drawing. Respect `/mute`. Approve only what you would stake your reputation on. Reject only with a concrete fix. All online seats normally must approve. At max rounds, weighted track-record voting breaks the tie but disagreement remains visible.\n\n## Worked cycle\n\nResearcher A sees research/needed note, retrieves memory + KB, posts a \u22641200-character source note. Explainer drafts. Critic names a missing condition; verifier marks that claim unsure; calculator checks units. Explainer revises. Every online seat casts a specific vote. Moderator posts final with sources/confidence, then illustrator draws. Scribe updates memory.\n\nOn errors: retry after 5\u20138s; 409 means wait 30s before claiming. The durable broker must continue indefinitely; after every handled wake, return to its next long-poll request without producing a chat completion.';
  var RULES_TEXT = "# AI CLASSROOM rules\n\n1. **Honesty comes before fluency.** The council cites what it used, labels uncertainty, and never invents a source.\n2. **A substantive answer earns its way out.** The normal path is research \u2192 draft \u2192 critique and verification \u2192 revision \u2192 vote \u2192 final \u2192 drawing.\n3. **Disagreement stays visible.** A vote can reject an answer only for a specific, fixable reason. After the maximum revision rounds, remaining disagreement is shown under **Council notes**, not silently removed.\n4. **Confidence is mandatory.** Every council answer ends with `Confidence: high`, `medium`, or `low` and explains why.\n5. **The board belongs to both sides.** Preserve human marks, read existing marks before adding agent art, label diagrams, and never clear the sheet unless the human explicitly asks.\n6. **Evidence is not a guarantee.** Deliberation reduces mistakes; it cannot eliminate them. Check important decisions against the linked primary sources and consult qualified professionals for medical, legal, financial, or safety-critical matters.\n7. **No hidden player account.** This prototype does not ask learners to sign in. The edge function is the only service allowed to write the protected database and storage bucket.";
  var CALIBRATION_POOL = [{ "id": "math-01", "domain": "math", "q": "What is 7 \xD7 8?", "answer": "56" }, { "id": "math-02", "domain": "math", "q": "What is 15% of 200?", "answer": "30" }, { "id": "math-03", "domain": "math", "q": "Solve 3x + 2 = 14. What is x?", "answer": "4" }, { "id": "math-04", "domain": "math", "q": "What is the derivative of x squared?", "answer": "2x" }, { "id": "math-05", "domain": "math", "q": "What is the area of a circle of radius 3, in terms of pi?", "answer": "9pi" }, { "id": "math-06", "domain": "math", "q": "What is 2 to the power of 10?", "answer": "1024" }, { "id": "math-07", "domain": "math", "q": "What is the median of 1, 3, 5, 9, 11?", "answer": "5" }, { "id": "math-08", "domain": "math", "q": "What is the square root of 144?", "answer": "12" }, { "id": "math-09", "domain": "math", "q": "Simplify 6/8.", "answer": "3/4" }, { "id": "math-10", "domain": "math", "q": "What is 0.25 as a fraction in simplest form?", "answer": "1/4" }, { "id": "math-11", "domain": "math", "q": "If a = 5 and b = 2, what is a squared minus b squared?", "answer": "21" }, { "id": "math-12", "domain": "math", "q": "How many degrees are in the interior angles of a triangle?", "answer": "180" }, { "id": "code-01", "domain": "code", "q": "In JavaScript, what does === compare in addition to value?", "answer": "type" }, { "id": "code-02", "domain": "code", "q": "What is the time complexity of binary search on a sorted array?", "answer": "log n" }, { "id": "code-03", "domain": "code", "q": "What keyword declares an immutable binding in JavaScript?", "answer": "const" }, { "id": "code-04", "domain": "code", "q": "Which HTTP status means Not Found?", "answer": "404" }, { "id": "code-05", "domain": "code", "q": "What Git command shows the working tree status?", "answer": "git status" }, { "id": "code-06", "domain": "code", "q": "What data structure uses FIFO order?", "answer": "queue" }, { "id": "code-07", "domain": "code", "q": "What is JSON short for?", "answer": "javascript object notation" }, { "id": "code-08", "domain": "code", "q": "What does SQL SELECT do?", "answer": "retrieve data" }, { "id": "code-09", "domain": "code", "q": "What JavaScript method converts a JSON string to an object?", "answer": "json.parse" }, { "id": "code-10", "domain": "code", "q": "What is a base case used for in recursion?", "answer": "stop recursion" }, { "id": "code-11", "domain": "code", "q": "Which symbol begins a single-line comment in Python?", "answer": "#" }, { "id": "code-12", "domain": "code", "q": "What does API stand for?", "answer": "application programming interface" }, { "id": "physics-01", "domain": "physics", "q": "What SI unit measures force?", "answer": "newton" }, { "id": "physics-02", "domain": "physics", "q": "What is voltage equal to in Ohm's law?", "answer": "current times resistance" }, { "id": "physics-03", "domain": "physics", "q": "What is the SI unit of electrical resistance?", "answer": "ohm" }, { "id": "physics-04", "domain": "physics", "q": "What does a capacitor store?", "answer": "electric charge" }, { "id": "physics-05", "domain": "physics", "q": "What is the speed of light in vacuum approximately in m/s?", "answer": "3e8" }, { "id": "physics-06", "domain": "physics", "q": "What law says energy cannot be created or destroyed?", "answer": "conservation of energy" }, { "id": "physics-07", "domain": "physics", "q": "What is frequency measured in?", "answer": "hertz" }, { "id": "physics-08", "domain": "physics", "q": "What direction does conventional current flow outside a source?", "answer": "positive to negative" }, { "id": "physics-09", "domain": "physics", "q": "What device changes AC voltage using magnetic induction?", "answer": "transformer" }, { "id": "physics-10", "domain": "physics", "q": "What is power in watts equal to for a DC circuit?", "answer": "voltage times current" }, { "id": "physics-11", "domain": "physics", "q": "What is the approximate acceleration due to gravity on Earth in m/s squared?", "answer": "9.8" }, { "id": "physics-12", "domain": "physics", "q": "What is the SI unit of energy?", "answer": "joule" }, { "id": "humanities-01", "domain": "humanities", "q": "In which century did the French Revolution begin?", "answer": "18th" }, { "id": "humanities-02", "domain": "humanities", "q": "Who wrote Romeo and Juliet?", "answer": "shakespeare" }, { "id": "humanities-03", "domain": "humanities", "q": "What document begins with 'We the People' in the United States?", "answer": "constitution" }, { "id": "humanities-04", "domain": "humanities", "q": "What is the study of past human events called?", "answer": "history" }, { "id": "humanities-05", "domain": "humanities", "q": "Which civilization built Machu Picchu?", "answer": "inca" }, { "id": "humanities-06", "domain": "humanities", "q": "What movement emphasized reason in eighteenth-century Europe?", "answer": "enlightenment" }, { "id": "humanities-07", "domain": "humanities", "q": "What is a primary source in history?", "answer": "firsthand evidence" }, { "id": "humanities-08", "domain": "humanities", "q": "Who painted the Mona Lisa?", "answer": "leonardo da vinci" }, { "id": "humanities-09", "domain": "humanities", "q": "What is democracy?", "answer": "government by the people" }, { "id": "humanities-10", "domain": "humanities", "q": "What ancient writing system used wedge-shaped marks?", "answer": "cuneiform" }, { "id": "humanities-11", "domain": "humanities", "q": "What is a constitution?", "answer": "fundamental law" }, { "id": "humanities-12", "domain": "humanities", "q": "What term means a system of beliefs about knowledge and reality?", "answer": "philosophy" }, { "id": "language-01", "domain": "language", "q": "What is the past tense of 'go'?", "answer": "went" }, { "id": "language-02", "domain": "language", "q": "What punctuation ends a direct question?", "answer": "question mark" }, { "id": "language-03", "domain": "language", "q": "What is a synonym for concise?", "answer": "brief" }, { "id": "language-04", "domain": "language", "q": "What is the subject in 'The council checks sources'?", "answer": "the council" }, { "id": "language-05", "domain": "language", "q": "What part of speech is 'carefully' in 'read carefully'?", "answer": "adverb" }, { "id": "language-06", "domain": "language", "q": "What does an em dash often indicate in prose?", "answer": "a break" }, { "id": "language-07", "domain": "language", "q": "What is the plural of analysis?", "answer": "analyses" }, { "id": "language-08", "domain": "language", "q": "Which is standard English: 'fewer errors' or 'less errors'?", "answer": "fewer errors" }, { "id": "language-09", "domain": "language", "q": "What does 'cite' mean in academic writing?", "answer": "give a source" }, { "id": "language-10", "domain": "language", "q": "What is an active-voice subject doing?", "answer": "performing the action" }, { "id": "language-11", "domain": "language", "q": "What is a paragraph's topic sentence for?", "answer": "state the main idea" }, { "id": "language-12", "domain": "language", "q": "What is the antonym of ambiguous?", "answer": "clear" }];
  var DOMAINS = ["math", "code", "physics", "humanities", "language"];
  var MAX_FILE_BYTES = 100 * 1024 * 1024;
  var CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "content-type,x-seat-token,x-admin-key,authorization"
  };
  function json(body, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...CORS, "content-type": "application/json; charset=utf-8" }
    });
  }
  var text = (body, status = 200) => new Response(body, { status, headers: { ...CORS, "content-type": "text/plain; charset=utf-8" } });
  var err = (msg, status = 400) => json({ error: msg }, status);
  function routePath(url) {
    const segs = url.pathname.split("/").filter(Boolean);
    while (segs.length && ["functions", "v1", "classroom"].includes(segs[0])) segs.shift();
    return segs;
  }
  function nowISO() {
    return (/* @__PURE__ */ new Date()).toISOString();
  }
  function isoIn(seconds) {
    return new Date(Date.now() + seconds * 1e3).toISOString();
  }
  function onlineSince() {
    return new Date(Date.now() - ONLINE_WINDOW_MS).toISOString();
  }
  var trim = (s, n) => String(s ?? "").slice(0, n);
  async function getSettings() {
    try {
      const { data } = await sb.from("cr_settings").select("value").eq("key", "global").maybeSingle();
      return { ...DEFAULTS, ...data?.value ?? {} };
    } catch {
      return { ...DEFAULTS };
    }
  }
  async function putSettings(patch) {
    const cur = await getSettings();
    const next = { ...cur, ...patch };
    await sb.from("cr_settings").upsert({ key: "global", value: next });
    return next;
  }
  async function insertMessage(row) {
    for (let attempt = 0; attempt < 12; attempt++) {
      const { data: maxRow } = await sb.from("cr_messages").select("seq").eq("session_id", row.session_id).order("seq", { ascending: false }).limit(1).maybeSingle();
      const seq = (maxRow?.seq ?? 0) + 1;
      const { data, error } = await sb.from("cr_messages").insert({ ...row, seq }).select().single();
      if (!error) return data;
      if (error.code !== "23505") {
        console.error("insertMessage", error);
        return null;
      }
      await new Promise((resolve) => setTimeout(resolve, 12 + Math.floor(Math.random() * 30) + attempt * 10));
    }
    console.error("insertMessage exhausted sequence retries", row.session_id);
    return null;
  }
  async function insertOps(sheetId, author, ops) {
    const inserted = [];
    for (const op of ops) {
      for (let attempt = 0; attempt < 4; attempt++) {
        const { data: maxRow } = await sb.from("cr_ops").select("seq").eq("sheet_id", sheetId).order("seq", { ascending: false }).limit(1).maybeSingle();
        const seq = (maxRow?.seq ?? 0) + 1;
        const { data, error } = await sb.from("cr_ops").insert({ sheet_id: sheetId, seq, author, op }).select().single();
        if (!error) {
          inserted.push(data);
          break;
        }
        if (error.code !== "23505") {
          console.error("insertOps", error);
          return inserted;
        }
      }
    }
    return inserted;
  }
  var OP_TYPES = /* @__PURE__ */ new Set(["line", "arrow", "rect", "ellipse", "path", "text", "math", "image", "erase", "clear", "group", "undo", "video", "model3d", "pointer", "note", "highlight"]);
  var num = (v, d = 0) => typeof v === "number" && isFinite(v) ? v : d;
  var col = (v, d = "#111") => typeof v === "string" && /^#[0-9a-fA-F]{3,8}$|^rgba?\(|^[a-z]+$/.test(v) ? v : d;
  var str = (v, d = "") => typeof v === "string" ? v : d;
  function sanitizeOp(raw) {
    if (!raw || typeof raw !== "object") return null;
    const t = str(raw.t);
    if (!OP_TYPES.has(t)) return null;
    switch (t) {
      case "line":
      case "arrow":
        return { t, x1: num(raw.x1), y1: num(raw.y1), x2: num(raw.x2), y2: num(raw.y2), w: num(raw.w, 2), c: col(raw.c) };
      case "rect":
        return { t, x: num(raw.x), y: num(raw.y), w: num(raw.w, 100), h: num(raw.h, 60), c: col(raw.c), fill: str(raw.fill, "#fff0"), r: num(raw.r, 6) };
      case "ellipse":
        return { t, cx: num(raw.cx), cy: num(raw.cy), rx: num(raw.rx, 50), ry: num(raw.ry, 30), c: col(raw.c), fill: str(raw.fill, "#fff0") };
      case "path": {
        const pts = Array.isArray(raw.pts) ? raw.pts.slice(0, 2e3).map((p) => Array.isArray(p) ? [num(p[0]), num(p[1])] : null).filter(Boolean) : [];
        if (pts.length < 2) return null;
        return {
          t,
          pts,
          w: num(raw.w, 3),
          c: col(raw.c),
          close: !!raw.close,
          ...str(raw.stroke_id) ? { stroke_id: str(raw.stroke_id).slice(0, 80), part: Math.max(0, Math.floor(num(raw.part, 0))), done: !!raw.done } : {}
        };
      }
      case "text":
        return { t, x: num(raw.x), y: num(raw.y), s: str(raw.s).slice(0, 500), size: num(raw.size, 22), c: col(raw.c), align: ["left", "center", "right"].includes(raw.align) ? raw.align : "left" };
      case "math":
        return { t, x: num(raw.x), y: num(raw.y), tex: str(raw.tex).slice(0, 300), size: num(raw.size, 26) };
      case "image":
        return { t, x: num(raw.x), y: num(raw.y), w: num(raw.w, 400), h: num(raw.h, 300), url: str(raw.url).slice(0, 2e3), poster: str(raw.poster).slice(0, 2e3) || void 0 };
      case "video":
        return { t, x: num(raw.x), y: num(raw.y), w: num(raw.w, 480), h: num(raw.h, 270), url: str(raw.url).slice(0, 2e3), poster: str(raw.poster).slice(0, 2e3) || void 0 };
      case "model3d":
        return { t, x: num(raw.x), y: num(raw.y), w: num(raw.w, 480), h: num(raw.h, 320), url: str(raw.url).slice(0, 2e3), poster: str(raw.poster).slice(0, 2e3) || void 0 };
      case "pointer":
        return { t, x: num(raw.x), y: num(raw.y), who: str(raw.who, "agent").slice(0, 40), c: col(raw.c, "#d7263d"), expires_at: str(raw.expires_at) || isoIn(3) };
      case "note":
        return { t, x: num(raw.x), y: num(raw.y), w: num(raw.w, 220), h: num(raw.h, 140), s: str(raw.s).slice(0, 600), c: col(raw.c, "#f5b301"), fill: str(raw.fill, "#fff5bd") };
      case "highlight":
        return { t, x: num(raw.x), y: num(raw.y), w: num(raw.w, 180), h: num(raw.h, 80), c: col(raw.c, "#f5b301"), alpha: Math.max(0.05, Math.min(0.8, num(raw.alpha, 0.25))) };
      case "erase": {
        const pts = Array.isArray(raw.pts) ? raw.pts.slice(0, 2e3).map((p) => Array.isArray(p) ? [num(p[0]), num(p[1])] : null).filter(Boolean) : [];
        if (pts.length < 1) return null;
        return { t, pts, w: num(raw.w, 30) };
      }
      case "clear":
        return { t: "clear" };
      case "undo":
        return { t: "undo", seq: num(raw.seq, -1) };
      case "group": {
        const inner = Array.isArray(raw.ops) ? raw.ops.slice(0, 100).map(sanitizeOp).filter(Boolean) : [];
        return { t, name: str(raw.name, "group").slice(0, 100), ops: inner };
      }
    }
    return null;
  }
  async function markStaleSeatsOffline() {
    await sb.from("cr_seats").update({ status: "offline" }).not("token", "is", null).lt("last_seen", onlineSince()).neq("status", "offline");
  }
  async function getSeats() {
    const { data } = await sb.from("cr_seats").select("*").order("seat");
    return data ?? [];
  }
  var onlineSeats = (seats) => seats.filter((s) => s.token && s.last_seen && new Date(s.last_seen).getTime() > Date.now() - ONLINE_WINDOW_MS);
  async function seatFromToken(req, url) {
    const token = req.headers.get("x-seat-token") ?? url.searchParams.get("token");
    if (!token) return null;
    const { data } = await sb.from("cr_seats").select("*").eq("token", token).maybeSingle();
    return data ?? null;
  }
  var isAdmin = (url, req) => {
    const key = url.searchParams.get("admin") ?? req.headers.get("x-admin-key") ?? "";
    return !!ADMIN_KEY && key === ADMIN_KEY;
  };
  async function optionalActor(req, url) {
    const seat = await seatFromToken(req, url);
    return seat ? { seat, author: `Seat ${seat.seat} \xB7 ${seat.role}` } : { seat: null, author: "You" };
  }
  async function messagesForTask(sessionId, taskId, kind) {
    let q = sb.from("cr_messages").select("*").eq("session_id", sessionId).eq("meta->>task_id", taskId).order("seq");
    if (kind) q = q.eq("kind", kind);
    const { data } = await q;
    return data ?? [];
  }
  async function latestMessages(sessionId, limit, sinceSeq = 0) {
    let q = sb.from("cr_messages").select("*").eq("session_id", sessionId).order("seq", { ascending: false }).limit(limit);
    if (sinceSeq > 0) q = q.gt("seq", sinceSeq);
    const { data } = await q;
    return (data ?? []).reverse();
  }
  var URLs_RE = /https?:\/\/[^\s)\]"'<>]+/g;
  function extractSources(msgs) {
    const found = /* @__PURE__ */ new Set();
    for (const m of msgs) {
      for (const u of String(m.body ?? "").match(URLs_RE) ?? []) found.add(u.replace(/[.,;]+$/, ""));
      for (const u of Array.isArray(m.meta?.sources) ? m.meta.sources : []) found.add(String(u));
    }
    return [...found].slice(0, 12);
  }
  var normal = (value) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  function calibrationForSeat(seat) {
    return DOMAINS.flatMap((domain, domainIndex) => {
      const choices = CALIBRATION_POOL.filter((q) => q.domain === domain);
      return [0, 1, 2].map((offset) => choices[(seat * 3 + domainIndex * 2 + offset) % choices.length]);
    });
  }
  function profileOf(seat) {
    const p = seat?.profile && typeof seat.profile === "object" ? seat.profile : {};
    return { calibrated: !!p.calibrated, calibration: p.calibration || {}, track: p.track || {}, strengths: p.strengths || [], weaknesses: p.weaknesses || [] };
  }
  function scoreForDomain(seat, domain) {
    const p = profileOf(seat), calibration = Number(p.calibration?.[domain] ?? 0.5), track = Number(p.track?.[domain] ?? 0.5);
    return Math.max(0, Math.min(1, calibration * 0.6 + track * 0.4));
  }
  function domainsForQuestion(question) {
    const q = normal(question);
    const hit = /* @__PURE__ */ new Set();
    if (/code|program|javascript|python|api|database|algorithm|git|debug/.test(q)) hit.add("code");
    if (/volt|circuit|physics|force|electron|heat|motor|capacitor|inductor/.test(q)) hit.add("physics");
    if (/math|equation|calculate|percent|probability|algebra|geometry|derivative/.test(q)) hit.add("math");
    if (/history|literature|essay|society|philosophy|politic/.test(q)) hit.add("humanities");
    if (/write|grammar|language|translate|word|explain/.test(q)) hit.add("language");
    return [...hit].length ? [...hit].slice(0, 2) : ["language"];
  }
  function leadership(seats, domains) {
    const domain = domains?.[0] || "language";
    const ranked = [...seats].filter((s) => s.token).sort((a, b) => scoreForDomain(b, domain) - scoreForDomain(a, domain));
    const weights = {};
    for (const seat of seats) weights[String(seat.seat)] = Number(scoreForDomain(seat, domain).toFixed(3));
    return { domain, lead_seat: ranked[0]?.seat ?? 1, vote_weights: weights };
  }
  function mutateTrack(profile, domains, delta) {
    const next = profileOf({ profile });
    const track = { ...next.track };
    for (const d of domains?.length ? domains : DOMAINS) {
      const old = Number(track[d] ?? 0.5);
      track[d] = Number(Math.max(0, Math.min(1, old * 0.88 + delta * 0.12)).toFixed(3));
    }
    return { ...next, track };
  }
  async function sessionMemory(sessionId) {
    const { data } = await sb.from("cr_memory").select("body,updated_at,updated_by").eq("session_id", sessionId).maybeSingle();
    return data ? { ...data, body: trim(data.body, 2500) } : { body: "", updated_at: null, updated_by: null };
  }
  async function taskFiles(sessionId, taskId) {
    let q = sb.from("cr_files").select("id,name,mime,bytes,pages,text_url,url,path,learned,meta").or(`session_id.eq.${sessionId},session_id.is.null`).is("deleted_at", null).order("created_at", { ascending: false }).limit(12);
    const { data } = await q;
    const attached = data ?? [];
    return attached.map((f) => ({ file_id: f.id, name: f.name, mime: f.mime, bytes: f.bytes, pages: f.pages, text_url: f.text_url, url: f.url, path: f.path, learned: f.learned }));
  }
  function filePath(sessionId, id, path, name) {
    const clean = (path || "").replace(/^\/+|\.\.(\/|$)/g, "").replace(/[^a-zA-Z0-9._/ -]/g, "_").slice(0, 180);
    const leaf = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "file";
    return `files/${sessionId}/${clean ? clean.replace(/\/$/, "") + "/" : ""}${id}-${leaf}`;
  }
  function mediaKind(mime, filename) {
    const ext = filename.toLowerCase().split(".").pop() || "";
    if (mime.startsWith("video/") || ["mp4", "webm", "gif"].includes(ext)) return "video";
    if (mime.startsWith("image/") || ["png", "jpg", "jpeg", "svg", "webp"].includes(ext)) return "image";
    if (["glb", "gltf", "stl", "obj"].includes(ext)) return "model3d";
    if (["mp3", "ogg", "wav", "m4a"].includes(ext)) return "audio";
    if (ext === "blend") return "blend";
    return "file";
  }
  async function createUpload(path) {
    const { data, error } = await sb.storage.from("classroom").createSignedUploadUrl(path);
    if (error || !data?.signedUrl) throw new Error(error?.message || "could not create upload URL");
    return { upload_url: data.signedUrl, headers: { "x-upsert": "false" }, token: data.token };
  }
  async function objectExists(path) {
    const folder = path.split("/").slice(0, -1).join("/");
    const leaf = path.split("/").pop();
    const { data, error } = await sb.storage.from("classroom").list(folder, { search: leaf, limit: 10 });
    return !error && !!data?.some((x) => x.name === leaf);
  }
  function chunkText(textIn) {
    const chunks = [];
    let page = 1;
    const pages = String(textIn || "").split(/===\s*page\s+\d+\s*===/i);
    for (const source of pages) {
      const text2 = source.trim();
      for (let at = 0; at < text2.length; at += 1050) {
        const part = text2.slice(at, at + 1200).trim();
        if (part) chunks.push({ text: part, page });
      }
      page++;
    }
    return chunks.slice(0, 400);
  }
  async function indexKnowledge(file, extracted) {
    await sb.from("cr_knowledge").delete().eq("file_id", file.id);
    const chunks = chunkText(extracted).map((c, index2) => ({ session_id: file.session_id, file_id: file.id, chunk_no: index2, page: c.page, text: c.text }));
    if (chunks.length) await sb.from("cr_knowledge").insert(chunks);
    return chunks.length;
  }
  function bboxOf(op) {
    const pts = op?.pts || [];
    const xs = pts.map((p) => Number(p[0]) || 0), ys = pts.map((p) => Number(p[1]) || 0);
    if (!xs.length) return [0, 0, 0, 0];
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)];
  }
  async function humanSheetState(sheetId, seenSeq = 0) {
    const [{ data: sheet }, { data: live }, { count }] = await Promise.all([
      sb.from("cr_sheets").select("state").eq("id", sheetId).maybeSingle(),
      sb.from("cr_live_strokes").select("op,bbox,updated_at").eq("sheet_id", sheetId).order("updated_at", { ascending: false }).limit(4),
      sb.from("cr_ops").select("*", { count: "exact", head: true }).eq("sheet_id", sheetId).gt("seq", seenSeq)
    ]);
    const state = sheet?.state || {};
    const latest = live?.[0];
    return { drawing: !!latest && Date.now() - new Date(latest.updated_at).getTime() < 1400, last_stroke_at: state.last_stroke_at || latest?.updated_at || null, new_ops_since_you_looked: count || 0, bbox_of_recent: state.bbox_of_recent || latest?.bbox || null, pointer: state.pointer || null, recent: (live || []).map((x) => x.op) };
  }
  function crc32(bytes) {
    let c = ~0;
    for (const b of bytes) {
      c ^= b;
      for (let k = 0; k < 8; k++) c = c >>> 1 ^ 3988292384 & -(c & 1);
    }
    return ~c >>> 0;
  }
  function le(n, size) {
    const out = new Uint8Array(size);
    for (let i = 0; i < size; i++) out[i] = n >>> 8 * i & 255;
    return out;
  }
  function zipStore(entries) {
    const encoder = new TextEncoder();
    const chunks = [];
    const records = [];
    let offset = 0;
    for (const entry of entries) {
      const name = encoder.encode(entry.name);
      const crc = crc32(entry.bytes);
      const header = new Uint8Array([80, 75, 3, 4, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, ...le(crc, 4), ...le(entry.bytes.length, 4), ...le(entry.bytes.length, 4), ...le(name.length, 2), 0, 0]);
      chunks.push(header, name, entry.bytes);
      records.push({ name, crc, size: entry.bytes.length, offset });
      offset += header.length + name.length + entry.bytes.length;
    }
    const start = offset;
    for (const r of records) {
      const h = new Uint8Array([80, 75, 1, 2, 20, 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, ...le(r.crc, 4), ...le(r.size, 4), ...le(r.size, 4), ...le(r.name.length, 2), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ...le(r.offset, 4)]);
      chunks.push(h, r.name);
      offset += h.length + r.name.length;
    }
    chunks.push(new Uint8Array([80, 75, 5, 6, 0, 0, 0, 0, ...le(records.length, 2), ...le(records.length, 2), ...le(offset - start, 4), ...le(start, 4), 0, 0]));
    const result = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
    let at = 0;
    for (const c of chunks) {
      result.set(c, at);
      at += c.length;
    }
    return result;
  }
  async function emitFinishedDrawingEvents(sessionId) {
    const { data: sheets } = await sb.from("cr_sheets").select("*").eq("session_id", sessionId);
    for (const sheet of sheets || []) {
      const s = sheet.state || {};
      const finished = s.finished_at ? new Date(s.finished_at).getTime() : 0;
      if (finished && !s.event_emitted && Date.now() - finished >= 2e3) {
        await insertMessage({ session_id: sessionId, role: "system", author: "Board", kind: "board_event", body: `User finished a drawing on sheet ${sheet.idx} (${s.stroke_count || 1} stroke${Number(s.stroke_count) === 1 ? "" : "s"}, region ${s.region || "sheet"}).`, meta: { sheet_id: sheet.id, human_finished: true, bbox: s.bbox_of_recent || null } });
        await sb.from("cr_sheets").update({ state: { ...s, event_emitted: true } }).eq("id", sheet.id);
      }
    }
  }
  async function advanceTask(task) {
    const settings = await getSettings();
    await markStaleSeatsOffline();
    let current = task;
    for (let hops = 0; hops < 6; hops++) {
      if (["done", "failed"].includes(current.phase)) return current;
      const seats = await getSeats();
      const online = onlineSeats(seats);
      const onlineSeatNos = new Set(online.map((s) => s.seat));
      const quorum = Math.max(1, Math.min(settings.quorum, Math.max(1, online.length)));
      const msgs = await messagesForTask(current.session_id, current.id);
      const bySeatKind = (seatNo, kinds, round) => msgs.filter((m) => m.meta?.seat === seatNo && kinds.includes(m.kind) && (round === void 0 || m.meta?.round === round));
      const deadlinePassed = new Date(current.deadline).getTime() <= Date.now();
      let nextPhase = null;
      let nextRound = current.round;
      switch (current.phase) {
        case "research": {
          const needResearchers = [2, 3, 4].filter((s) => onlineSeatNos.has(s));
          const need = [1, ...needResearchers, ...onlineSeatNos.has(10) ? [10] : []];
          const allIn = need.length === 0 || need.every((s) => bySeatKind(s, ["note"]).length > 0);
          if (current.state?.needs_research === false || allIn || deadlinePassed) nextPhase = "draft";
          break;
        }
        case "draft": {
          const hasDraft = bySeatKind(5, ["draft"], current.round).length > 0;
          if (!hasDraft && (deadlinePassed || !onlineSeatNos.has(5))) {
            await autoDraft(current, msgs);
          }
          const draftNow = (await messagesForTask(current.session_id, current.id, "draft")).length > 0;
          if (draftNow || deadlinePassed) nextPhase = "critique";
          break;
        }
        case "critique": {
          const req = [6, 7, 8].filter((s) => onlineSeatNos.has(s));
          const allIn = req.every((s) => s === 6 ? bySeatKind(6, ["objection"], current.round).length > 0 : s === 7 ? bySeatKind(7, ["verify"], current.round).length > 0 : bySeatKind(8, ["note"], current.round).length > 0);
          if (allIn || deadlinePassed) nextPhase = "revise";
          break;
        }
        case "revise": {
          const afterSeq = Number(current.state?.revise_after_seq ?? 0);
          const hasRevision = bySeatKind(5, ["draft"], current.round).some((m) => Number(m.seq) > afterSeq);
          if (!hasRevision && deadlinePassed) await autoDraft(current, msgs);
          const reviseIn = (await bySeatKindSafe(current, 5, ["draft"], current.round)).some((m) => Number(m.seq) > afterSeq);
          if (reviseIn || deadlinePassed || !onlineSeatNos.has(5)) nextPhase = "vote";
          break;
        }
        case "vote": {
          const voterSeats = online.map((s) => s.seat);
          const votes = msgs.filter((m) => m.kind === "vote" && m.meta?.round === current.round);
          const voted = new Set(votes.map((m) => m.meta?.seat));
          const allVoted = voterSeats.length > 0 && voterSeats.every((s) => voted.has(s));
          const rejects = votes.filter((m) => m.meta?.approve === false);
          const approves = votes.filter((m) => m.meta?.approve === true);
          const decide = (approveCount) => {
            if (rejects.length > 0) {
              if (current.round < settings.max_rounds) {
                nextPhase = "revise";
                nextRound = current.round + 1;
              } else nextPhase = "final";
            } else if (approveCount > 0 || deadlinePassed) {
              nextPhase = "final";
            } else {
              nextPhase = "final";
            }
          };
          if (allVoted || deadlinePassed) {
            decide(approves.length);
            if (nextPhase === "final") {
              const weights = leadership(seats, current.state?.domains || ["language"]).vote_weights;
              const weighted = votes.reduce((sum, vote) => sum + (vote.meta?.approve ? 1 : -1) * Number(weights[String(vote.meta?.seat)] ?? 0.5), 0);
              current = await patchTask(current, { state: { ...current.state, last_votes: { approves: approves.length, rejects: rejects.length, weighted_decision: weighted >= 0 ? "approve" : "reject", weighted_score: Number(weighted.toFixed(3)) } } });
            }
          }
          break;
        }
        case "final": {
          const hasFinal = msgs.some((m) => m.kind === "final");
          if (!hasFinal && (deadlinePassed || !onlineSeatNos.has(1))) {
            await autoFinal(current, msgs, settings);
          }
          const finalNow = (await messagesForTask(current.session_id, current.id, "final")).length > 0;
          if (finalNow || deadlinePassed) nextPhase = "draw";
          break;
        }
        case "draw": {
          const drawn = current.state?.drawn === true;
          if (drawn || deadlinePassed) nextPhase = "done";
          break;
        }
      }
      if (!nextPhase) return current;
      const patch = {
        phase: nextPhase,
        round: nextRound,
        // Preserve the sequence just before entering revise. Only a later explainer
        // draft counts as the revision, even during round one.
        state: nextPhase === "revise" ? { ...current.state, revise_after_seq: Math.max(0, ...msgs.map((m) => Number(m.seq) || 0)) } : current.state,
        updated_at: nowISO(),
        deadline: nextPhase === "draw" ? isoIn(settings.draw_timeout_s) : nextPhase === "revise" ? isoIn(settings.revise_timeout_s) : nextPhase === "done" ? current.deadline : isoIn(settings.phase_timeout_s)
      };
      const { data } = await sb.from("cr_tasks").update(patch).eq("id", current.id).select().single();
      current = data ?? { ...current, ...patch };
    }
    return current;
  }
  async function bySeatKindSafe(task, seat, kinds, round) {
    const msgs = await messagesForTask(task.session_id, task.id);
    return msgs.filter((m) => m.meta?.seat === seat && kinds.includes(m.kind) && (round === void 0 || m.meta?.round === round));
  }
  async function patchTask(task, patch) {
    const { data } = await sb.from("cr_tasks").update({ ...patch, updated_at: nowISO() }).eq("id", task.id).select().single();
    return data ?? { ...task, ...patch };
  }
  async function autoDraft(task, msgs) {
    const all = msgs ?? await messagesForTask(task.session_id, task.id);
    const notes = all.filter((m) => m.kind === "note");
    const existing = all.filter((m) => m.kind === "draft");
    const latestDraft = existing[existing.length - 1];
    const src = extractSources(notes);
    const body = latestDraft ? latestDraft.body : [
      "*(Council fallback draft \u2014 the explainer did not deliver in time.)*",
      "",
      "Based on the council's notes, here is a provisional answer to the question:",
      "",
      ...notes.slice(0, 8).map((n) => `- **${n.author}:** ${trim(n.body, 400)}`),
      src.length ? `
Sources: ${src.map((u) => `<${u}>`).join(", ")}` : ""
    ].filter(Boolean).join("\n");
    await insertMessage({
      session_id: task.session_id,
      role: "agent",
      author: "Seat 5 \xB7 explainer (auto)",
      kind: "draft",
      body: trim(body, 6e3),
      meta: { seat: 5, role: "explainer", task_id: task.id, round: task.round, auto: true, sources: src }
    });
  }
  async function autoFinal(task, msgs, settings) {
    const all = msgs ?? await messagesForTask(task.session_id, task.id);
    const drafts = all.filter((m) => m.kind === "draft");
    const draft = drafts[drafts.length - 1];
    const notes = all.filter((m) => m.kind === "note");
    const objections = all.filter((m) => m.kind === "objection");
    const verifies = all.filter((m) => m.kind === "verify");
    const votes = all.filter((m) => m.kind === "vote");
    const approves = votes.filter((m) => m.meta?.approve === true).length;
    const rejects = votes.filter((m) => m.meta?.approve === false).length;
    const sources = extractSources([...notes, ...drafts]);
    const unresolved = objections.filter((o) => !drafts.some((d) => d.seq > o.seq));
    const body = [
      draft ? draft.body : "*The council could not produce a verified answer in time.*",
      "",
      "### Council notes",
      `- Fallback final generated by the server (moderator did not deliver within the deadline).`,
      `- Votes cast: ${approves} approve / ${rejects} reject. Rounds used: ${task.round} of ${settings.max_rounds}.`,
      ...task.state?.last_votes?.weighted_decision ? [`- Weighted tie-break signal: ${task.state.last_votes.weighted_decision} (${task.state.last_votes.weighted_score}). Unanimity was not reached.`] : [],
      ...unresolved.length ? [`- Unresolved objections:`, ...unresolved.slice(0, 5).map((o) => `  - ${trim(o.body, 300)}`)] : ["- No unresolved objections recorded."],
      verifies.length ? `- Verifier tables: ${verifies.length} on file.` : "- No verifier table on file.",
      "",
      "### Sources",
      ...sources.length ? sources.map((u) => `- ${u}`) : ["- No sources were attached to the notes."],
      "",
      `Confidence: ${approves > rejects && sources.length ? "medium" : "low"} \u2013 ${approves} approve / ${rejects} reject, fallback generation.`
    ].join("\n");
    await insertMessage({
      session_id: task.session_id,
      role: "council",
      author: "Seat 1 \xB7 moderator (auto)",
      kind: "final",
      body: trim(body, 8e3),
      meta: { seat: 1, role: "moderator", task_id: task.id, round: task.round, auto: true, approvals: approves, rejects, sources }
    });
  }
  async function tick(sessionId) {
    const { data: task } = await sb.from("cr_tasks").select("*").eq("session_id", sessionId).not("phase", "in", "(done,failed)").order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (task) await advanceTask(task);
    await emitFinishedDrawingEvents(sessionId);
  }
  async function currentSheet(sessionId) {
    const { data } = await sb.from("cr_sheets").select("*").eq("session_id", sessionId).order("idx", { ascending: false }).limit(1).maybeSingle();
    return data ?? null;
  }
  async function sheetOpsSeq(sheetId) {
    const { data } = await sb.from("cr_ops").select("seq").eq("sheet_id", sheetId).order("seq", { ascending: false }).limit(1).maybeSingle();
    return data?.seq ?? 0;
  }
  var publicUrl = (path) => path ? `${SUPA_URL}/storage/v1/object/public/classroom/${path}` : null;
  async function kbHits(sessionId, question) {
    const terms = normal(question).split(" ").filter((x) => x.length > 2).slice(0, 10).join(" & ");
    if (!terms) return [];
    const { data } = await sb.from("cr_knowledge").select("text,page,file_id,cr_files(name)").or(`session_id.eq.${sessionId},session_id.is.null`).textSearch("tsv", terms).limit(8);
    return (data ?? []).map((x) => ({ file_id: x.file_id, file: x.cr_files?.name || "library file", page: x.page, text: trim(x.text, 500) }));
  }
  async function buildInbox(seat, lastSeq, seenSheetSeq) {
    await markStaleSeatsOffline();
    const { data: active } = await sb.from("cr_tasks").select("*").not("phase", "in", "(done,failed)").order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (active) {
      await advanceTask(active);
      await emitFinishedDrawingEvents(active.session_id);
    }
    const { data: t } = active ? await sb.from("cr_tasks").select("*").eq("id", active.id).maybeSingle() : { data: null };
    const task = t ?? active;
    let needed = "none", yourTurn = false, question = "", sheet = null, memory = { body: "" }, sinceLast = [], files = [], hits = [], lead = { lead_seat: 1, vote_weights: {} }, watching = false;
    let sessionId = task?.session_id ?? null;
    if (task) {
      const { data: qm } = await sb.from("cr_messages").select("body").eq("id", task.question_msg_id).maybeSingle();
      question = qm?.body ?? "";
      const { data: delta } = await sb.from("cr_messages").select("seq,role,author,kind,body,meta,created_at").eq("session_id", task.session_id).gt("seq", lastSeq).order("seq").limit(12);
      sinceLast = (delta ?? []).map((m) => ({ seq: m.seq, role: m.role, author: m.author, kind: m.kind, body: trim(m.body, 360), meta: m.meta, created_at: m.created_at }));
      memory = await sessionMemory(task.session_id);
      files = await taskFiles(task.session_id, task.id);
      hits = await kbHits(task.session_id, question);
      const seats = await getSeats();
      lead = leadership(seats, task.state?.domains || domainsForQuestion(question));
      const sh = await currentSheet(task.session_id);
      if (sh) {
        const human = await humanSheetState(sh.id, seenSheetSeq);
        const { data: watch } = await sb.from("cr_watches").select("on_watch").eq("seat", seat.seat).eq("sheet_id", sh.id).maybeSingle();
        watching = !!watch?.on_watch;
        sheet = { id: sh.id, title: sh.title, ops_seq: await sheetOpsSeq(sh.id), png_url: publicUrl(sh.png_path), human, recent_ops: watching ? human.recent : [] };
      }
      const msgs = await messagesForTask(task.session_id, task.id);
      const has = (kinds, round) => msgs.some((m) => m.meta?.seat === seat.seat && kinds.includes(m.kind) && (round === void 0 || m.meta?.round === round));
      if (!profileOf(seat).calibrated) {
        yourTurn = true;
        needed = "calibrate";
      } else switch (task.phase) {
        case "research":
          if ([1, 2, 3, 4, 10].includes(seat.seat) && !has(["note"])) {
            yourTurn = true;
            needed = "note";
          }
          break;
        case "draft":
          if (seat.seat === 5 && !has(["draft"], task.round)) {
            yourTurn = true;
            needed = "draft";
          }
          break;
        case "critique":
          if (seat.seat === 6 && !has(["objection"], task.round)) {
            yourTurn = true;
            needed = "objection";
          } else if (seat.seat === 7 && !has(["verify"], task.round)) {
            yourTurn = true;
            needed = "verify";
          } else if (seat.seat === 8 && !has(["note"], task.round)) {
            yourTurn = true;
            needed = "note";
          }
          break;
        case "revise": {
          const marker = Number(task.state?.revise_after_seq ?? 0);
          const revised = msgs.some((m) => m.meta?.seat === 5 && m.kind === "draft" && m.meta?.round === task.round && Number(m.seq) > marker);
          if (seat.seat === 5 && !revised) {
            yourTurn = true;
            needed = "draft";
          }
          break;
        }
        case "vote":
          if (!has(["vote"], task.round)) {
            yourTurn = true;
            needed = "vote";
          }
          break;
        case "final":
          if (seat.seat === 1 && !msgs.some((m) => m.kind === "final")) {
            yourTurn = true;
            needed = "final";
          }
          break;
        case "draw":
          if (seat.seat === 9 && !task.state?.drawn) {
            yourTurn = true;
            needed = "draw";
          }
          break;
      }
    } else if (!profileOf(seat).calibrated) {
      yourTurn = true;
      needed = "calibrate";
    }
    const humanWake = !!sheet?.human?.new_ops_since_you_looked && !sheet.human.drawing;
    const messageWake = sinceLast.some((m) => m.role === "user" || m.kind === "board_event");
    const wake = yourTurn || humanWake || messageWake;
    await sb.from("cr_seats").update({ last_seen: nowISO(), status: yourTurn ? task?.phase === "vote" ? "voting" : "working" : "idle" }).eq("seat", seat.seat);
    return {
      seat: seat.seat,
      role: seat.role,
      poll_hint: 3,
      now: nowISO(),
      wake,
      watching,
      calibration: !profileOf(seat).calibrated ? { test_id: `seat-${seat.seat}-v1`, questions: calibrationForSeat(seat.seat).map(({ id, domain, q }) => ({ id, domain, q })) } : null,
      task: task ? { id: task.id, session_id: task.session_id, phase: task.phase, round: task.round, deadline: task.deadline, question: trim(question, 1200), your_turn: yourTurn, needed, needs_research: task.state?.needs_research ?? true, domains: task.state?.domains || domainsForQuestion(question), lead_seat: lead.lead_seat, vote_weights: lead.vote_weights, context: [{ kind: "memory", body: memory.body, updated_at: memory.updated_at }], files, kb_hits: hits } : null,
      sheet,
      memory,
      since_last: sinceLast,
      latest_seq: sinceLast.length ? sinceLast[sinceLast.length - 1].seq : lastSeq
    };
  }
  async function handler(req) {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    const url = new URL(req.url);
    const segs = routePath(url);
    const route = segs.join("/");
    const method = req.method;
    try {
      if (route === "health") {
        return json({ ok: true, service: "classroom", version: VERSION, time: nowISO() });
      }
      if (route === "prompt") return text(AGENT_PROMPT);
      if (route === "rules") return text(RULES_TEXT);
      if (route === "session" && method === "POST") {
        const b = await req.json().catch(() => ({}));
        const settings = await getSettings();
        const { data: s, error } = await sb.from("cr_sessions").insert({ title: trim(b.title, 120) || "AI Classroom session", settings }).select().single();
        if (error) return err("could not create session", 500);
        const { data: sheet } = await sb.from("cr_sheets").insert({ session_id: s.id, idx: 1, title: "Sheet 1" }).select().single();
        return json({ session_id: s.id, sheet_id: sheet?.id ?? null });
      }
      if (route === "sessions" && method === "GET") {
        const { data } = await sb.from("cr_sessions").select("id,title,created_at,status").order("created_at", { ascending: false }).limit(50);
        return json({ sessions: data ?? [] });
      }
      if (segs[0] === "session" && segs[1] && method === "GET") {
        const sessionId = segs[1];
        await tick(sessionId);
        const since = parseInt(url.searchParams.get("since") ?? "0", 10) || 0;
        const [{ data: s }, messages, { data: task }, { data: sheets }, seats] = await Promise.all([
          sb.from("cr_sessions").select("*").eq("id", sessionId).maybeSingle(),
          latestMessages(sessionId, 200, since),
          sb.from("cr_tasks").select("*").eq("session_id", sessionId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
          sb.from("cr_sheets").select("*").eq("session_id", sessionId).order("idx"),
          getSeats()
        ]);
        if (!s) return err("session not found", 404);
        const settings = await getSettings();
        const leader = leadership(seats, task?.state?.domains || ["language"]);
        const { data: watches } = await sb.from("cr_watches").select("seat,sheet_id,on_watch").eq("on_watch", true);
        return json({
          session: s,
          messages,
          task: task ? { id: task.id, phase: task.phase, round: task.round, deadline: task.deadline, question_msg_id: task.question_msg_id, state: task.state, domains: task.state?.domains || [], lead_seat: leader.lead_seat, vote_weights: leader.vote_weights, created_at: task.created_at } : null,
          sheets: (sheets ?? []).map((sh) => ({ ...sh, png_url: publicUrl(sh.png_path), thumb_url: publicUrl(sh.thumb_path) })),
          council: seats.map((x) => ({ seat: x.seat, role: x.role, name: x.agent_name, status: x.last_seen && Date.now() - new Date(x.last_seen).getTime() < ONLINE_WINDOW_MS ? x.status : "offline", last_seen: x.last_seen, profile: { calibration: profileOf(x).calibration, track: profileOf(x).track }, watching: (watches || []).some((w) => w.seat === x.seat && w.on_watch) })),
          settings,
          latest_seq: messages.length ? messages[messages.length - 1].seq : since
        });
      }
      if (route === "ask" && method === "POST") {
        const b = await req.json().catch(() => ({}));
        const sessionId = str(b.session_id);
        const textIn = str(b.text).trim();
        if (!sessionId || !textIn) return err("session_id and text are required");
        if (textIn.length > 4e3) return err("question too long (max 4000 chars)");
        const sheetId = b.sheet_id ? str(b.sheet_id) : null;
        const qMsg = await insertMessage({
          session_id: sessionId,
          role: "user",
          author: "You",
          kind: "question",
          body: textIn,
          meta: sheetId ? { sheet_id: sheetId } : {}
        });
        if (!qMsg) return err("could not store question", 500);
        const lower = textIn.toLowerCase().replace(/^\//, "").trim();
        const TRIVIAL = /* @__PURE__ */ new Set(["thanks", "thank you", "ok", "okay", "yes", "yes continue", "sure", "great", "cool", "got it", "nice", "continue"]);
        const isTrivial = TRIVIAL.has(lower) || lower.length <= 2;
        const quick = /^\/?quick\b/i.test(textIn);
        if (isTrivial) {
          const reply = await insertMessage({
            session_id: sessionId,
            role: "council",
            author: "Seat 1 \xB7 moderator",
            kind: "final",
            body: "You're welcome! Keep the questions coming \u2014 the council is here for them.",
            meta: { seat: 1, role: "moderator", trivial: true }
          });
          const { data: task2 } = await sb.from("cr_tasks").insert({
            session_id: sessionId,
            question_msg_id: qMsg.id,
            phase: "done",
            round: 1,
            deadline: nowISO(),
            state: { trivial: true }
          }).select().single();
          if (reply) await sb.from("cr_tasks").update({ state: { trivial: true, final_msg_id: reply.id } }).eq("id", task2.id);
          return json({ task_id: task2.id, trivial: true });
        }
        const settings = await getSettings();
        const needsResearch = !quick;
        const domains = domainsForQuestion(textIn);
        const { data: task, error } = await sb.from("cr_tasks").insert({
          session_id: sessionId,
          question_msg_id: qMsg.id,
          phase: needsResearch ? "research" : "draft",
          round: 1,
          deadline: isoIn(settings.phase_timeout_s),
          state: { needs_research: needsResearch, round: 1, votes: {}, domains, mode: lower.split(/\s+/)[0] }
        }).select().single();
        if (error) return err("could not create task", 500);
        return json({ task_id: task.id, phase: task.phase });
      }
      if (route === "sheet" && method === "POST") {
        const b = await req.json().catch(() => ({}));
        const sessionId = str(b.session_id);
        if (!sessionId) return err("session_id is required");
        const { data: last } = await sb.from("cr_sheets").select("idx").eq("session_id", sessionId).order("idx", { ascending: false }).limit(1).maybeSingle();
        const idx = (last?.idx ?? 0) + 1;
        const { data: sheet, error } = await sb.from("cr_sheets").insert({
          session_id: sessionId,
          idx,
          title: trim(b.title, 120) || `Sheet ${idx}`
        }).select().single();
        if (error) return err("could not create sheet", 500);
        return json({ sheet_id: sheet.id, idx });
      }
      if (route === "sheets" && method === "GET") {
        const sessionId = str(url.searchParams.get("session_id"));
        if (!sessionId) return err("session_id is required");
        const { data } = await sb.from("cr_sheets").select("*").eq("session_id", sessionId).order("idx");
        return json({ sheets: (data ?? []).map((sh) => ({ ...sh, png_url: publicUrl(sh.png_path), thumb_url: publicUrl(sh.thumb_path) })) });
      }
      if (segs[0] === "sheet" && segs[1]) {
        const sheetId = segs[1];
        if (segs.length === 2 && method === "GET") {
          const { data: sheet } = await sb.from("cr_sheets").select("*").eq("id", sheetId).maybeSingle();
          if (!sheet) return err("sheet not found", 404);
          const { data: ops } = await sb.from("cr_ops").select("*").eq("sheet_id", sheetId).order("seq");
          return json({ sheet: { ...sheet, png_url: publicUrl(sheet.png_path), thumb_url: publicUrl(sheet.thumb_path) }, ops: ops ?? [] });
        }
        if (segs[2] === "ops" && method === "GET") {
          const since = parseInt(url.searchParams.get("since") ?? "0", 10) || 0;
          const { data: ops } = await sb.from("cr_ops").select("*").eq("sheet_id", sheetId).gt("seq", since).order("seq").limit(500);
          return json({ ops: ops ?? [], max_seq: ops?.length ? ops[ops.length - 1].seq : since });
        }
        if (segs[2] === "ops" && method === "POST") {
          const b = await req.json().catch(() => ({}));
          const ops = (Array.isArray(b.ops) ? b.ops : []).slice(0, 200).map(sanitizeOp).filter(Boolean);
          if (!ops.length) return err("no valid ops");
          const author = b.author === "user" || !b.author ? "user" : trim(b.author, 40);
          const { data: sheet } = await sb.from("cr_sheets").select("session_id,idx,state").eq("id", sheetId).maybeSingle();
          if (!sheet) return err("sheet not found", 404);
          const streamOps = ops.filter((o) => o.t === "path" && o.stroke_id);
          const pointers = ops.filter((o) => o.t === "pointer");
          const normalOps = ops.filter((o) => !(o.t === "path" && o.stroke_id) && o.t !== "pointer");
          const inserted = normalOps.length ? await insertOps(sheetId, author, normalOps) : [];
          let state = sheet.state || {};
          let completed = 0;
          for (const op of streamOps) {
            const bbox = bboxOf(op);
            if (op.done) {
              const finalOp = { t: "path", pts: op.pts, w: op.w, c: op.c, close: !!op.close };
              if (finalOp.pts.length >= 2) inserted.push(...await insertOps(sheetId, author, [finalOp]));
              await sb.from("cr_live_strokes").delete().eq("sheet_id", sheetId).eq("stroke_id", op.stroke_id);
              completed++;
              state = { ...state, drawing: false, finished_at: nowISO(), event_emitted: false, last_stroke_at: nowISO(), bbox_of_recent: bbox, stroke_count: Number(state.stroke_count || 0) + 1, region: bbox[0] < 800 ? "left" : "right" };
            } else {
              await sb.from("cr_live_strokes").upsert({ sheet_id: sheetId, stroke_id: op.stroke_id, author, op, bbox, updated_at: nowISO() });
              state = { ...state, drawing: true, last_stroke_at: nowISO(), bbox_of_recent: bbox, event_emitted: false };
            }
          }
          if (pointers.length) state = { ...state, pointer: { x: pointers[pointers.length - 1].x, y: pointers[pointers.length - 1].y, at: nowISO() } };
          if (streamOps.length || pointers.length) await sb.from("cr_sheets").update({ state }).eq("id", sheetId);
          await tick(sheet.session_id);
          return json({ inserted: inserted.length, streamed: streamOps.length, completed, ops: inserted });
        }
        if (segs[2] === "png" && method === "GET") {
          const { data: sheet } = await sb.from("cr_sheets").select("png_path,state").eq("id", sheetId).maybeSingle();
          if (!sheet?.png_path) return err("sheet PNG not found", 404);
          if (url.searchParams.get("fresh") === "1" || url.searchParams.get("region")) {
            const state = { ...sheet.state || {}, fresh_requested_at: nowISO(), crop_request: url.searchParams.get("region") || null };
            await sb.from("cr_sheets").update({ state }).eq("id", sheetId);
          }
          return new Response(null, { status: 302, headers: { ...CORS, location: publicUrl(sheet.png_path) } });
        }
        if (segs[2] === "png" && method === "POST") {
          const b = await req.json().catch(() => ({}));
          const dataUrl = str(b.data_url);
          const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
          if (!m) return err("data_url must be a base64 PNG data URL");
          const bytes = Uint8Array.from(atob(m[1]), (c) => c.charCodeAt(0));
          if (bytes.length > 8 * 1024 * 1024) return err("png too large (max 8 MB)");
          const put2 = async (path, buf) => {
            const { error } = await sb.storage.from("classroom").upload(path, buf, { contentType: "image/png", upsert: true });
            if (error) throw new Error("storage: " + error.message);
          };
          await put2(`sheets/${sheetId}.png`, bytes);
          let thumbPath = `sheets/${sheetId}.png`;
          const tm = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(str(b.thumb_data_url));
          if (tm) {
            const tbytes = Uint8Array.from(atob(tm[1]), (c) => c.charCodeAt(0));
            await put2(`thumbs/${sheetId}.png`, tbytes);
            thumbPath = `thumbs/${sheetId}.png`;
          }
          const { data: previousSheet } = await sb.from("cr_sheets").select("state").eq("id", sheetId).maybeSingle();
          await sb.from("cr_sheets").update({ png_path: `sheets/${sheetId}.png`, thumb_path: thumbPath, state: { ...previousSheet?.state || {}, fresh_requested_at: null, crop_request: null, png_updated_at: nowISO() } }).eq("id", sheetId);
          return json({ ok: true, png_url: publicUrl(`sheets/${sheetId}.png`), thumb_url: publicUrl(thumbPath) });
        }
        return err("unknown sheet route", 404);
      }
      if (route === "upload" && method === "POST") {
        const b = await req.json().catch(() => ({}));
        const sessionId = str(b.session_id);
        const sheetId = str(b.sheet_id);
        const filename = str(b.filename, "upload.png").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "upload.png";
        const dataUrl = str(b.data_url);
        const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
        if (!sessionId || !sheetId || !m) return err("session_id, sheet_id and an image data_url are required");
        const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
        if (bytes.length > 8 * 1024 * 1024) return err("file too large (max 8 MB)");
        const path = `uploads/${sessionId}/${Date.now()}-${filename}`;
        const { error } = await sb.storage.from("classroom").upload(path, bytes, { contentType: m[1], upsert: false });
        if (error) return err("storage: " + error.message, 500);
        const url2 = publicUrl(path);
        const w = num(b.w, 500), h = num(b.h, 380);
        const inserted = await insertOps(sheetId, "user", [{ t: "image", x: 120, y: 120, w: Math.min(w, 900), h: Math.min(h, 700), url: url2 }]);
        await insertMessage({ session_id: sessionId, role: "user", author: "You", kind: "board_event", body: `Uploaded image "${filename}" to the sheet.`, meta: { sheet_id: sheetId, url: url2 } });
        await tick(sessionId);
        return json({ ok: true, url: url2, ops: inserted });
      }
      if ((route === "media/begin" || route === "file/begin" || route === "files/begin") && method === "POST") {
        const b = await req.json().catch(() => ({}));
        const sessionId = str(b.session_id);
        const name = trim(b.filename ?? b.name, 180) || "untitled";
        const mime = trim(b.mime, 120) || "application/octet-stream";
        const bytes = Math.floor(num(b.bytes, -1));
        if (!sessionId || bytes < 0 || bytes > MAX_FILE_BYTES) return err("session_id and bytes (0..100 MB) are required");
        const { seat, author } = await optionalActor(req, url);
        const id = crypto.randomUUID();
        const isMedia = route.startsWith("media/");
        const requestedPath = trim(b.path, 180);
        const path = isMedia ? `media/${sessionId}/${id}-${name.replace(/[^a-zA-Z0-9._-]/g, "_")}` : filePath(sessionId, id, requestedPath, name);
        try {
          const signed = await createUpload(path);
          if (isMedia) {
            const kind = mediaKind(mime, name);
            await sb.from("cr_media").insert({ id, session_id: sessionId, sheet_id: b.sheet_id ? str(b.sheet_id) : null, author, kind, filename: name, mime, bytes, path, caption: trim(b.caption, 500), meta: { task_id: b.task_id || null, poster_url: b.poster_url || null, pending: true, ...b.meta || {} } });
          } else {
            const sessionScope = b.available_all === true ? null : sessionId;
            await sb.from("cr_files").insert({ id, session_id: sessionScope, author, name, mime, bytes, path, pages: Math.max(0, Math.floor(num(b.pages, 0))), learned: !!b.learned, tags: Array.isArray(b.tags) ? b.tags.slice(0, 12) : [], meta: { origin_session_id: sessionId, task_id: b.task_id || null, available_all: b.available_all === true, pending: true, ...b.meta || {} } });
          }
          return json({ media_id: isMedia ? id : void 0, file_id: isMedia ? void 0 : id, path, ...signed });
        } catch (e) {
          return err(e?.message || "could not begin upload", 500);
        }
      }
      if ((route === "media/done" || route === "file/done" || route === "files/done") && method === "POST") {
        const b = await req.json().catch(() => ({}));
        const isMedia = route.startsWith("media/");
        const id = str(isMedia ? b.media_id : b.file_id);
        if (!id) return err(isMedia ? "media_id is required" : "file_id is required");
        const table = isMedia ? "cr_media" : "cr_files";
        const { data: row } = await sb.from(table).select("*").eq("id", id).maybeSingle();
        if (!row) return err("upload record not found", 404);
        if (!await objectExists(row.path)) return err("storage object not found; PUT it to upload_url first", 409);
        const urlOut = publicUrl(row.path);
        if (isMedia) {
          const poster = str(b.poster_url || row.meta?.poster_url) || null;
          await sb.from("cr_media").update({ url: urlOut, poster_url: poster, meta: { ...row.meta || {}, pending: false } }).eq("id", id);
          const media = { ...row, url: urlOut, poster_url: poster };
          const message2 = await insertMessage({ session_id: row.session_id, role: row.author === "You" ? "user" : "agent", author: row.author, kind: "media", body: row.caption || `Shared ${row.filename}`, meta: { media_id: id, kind: row.kind, filename: row.filename, mime: row.mime, url: urlOut, poster_url: poster, sheet_id: row.sheet_id } });
          let ops = [];
          if (row.sheet_id) {
            const type = row.kind === "video" ? "video" : row.kind === "model3d" ? "model3d" : row.kind === "image" ? "image" : null;
            if (type) ops = await insertOps(row.sheet_id, row.author === "You" ? "user" : "agent", [{ t: type, x: 120, y: 120, w: type === "video" ? 520 : 460, h: type === "video" ? 292 : 320, url: urlOut, poster }]);
          }
          await tick(row.session_id);
          return json({ ok: true, media: { ...media, ops }, message_id: message2?.id || null });
        }
        const origin = row.meta?.origin_session_id || row.session_id;
        await sb.from("cr_files").update({ url: urlOut, meta: { ...row.meta || {}, pending: false } }).eq("id", id);
        const message = origin ? await insertMessage({ session_id: origin, role: row.author === "You" ? "user" : "agent", author: row.author, kind: "media", body: `Shared file: ${row.name}`, meta: { file_id: id, filename: row.name, mime: row.mime, bytes: row.bytes, url: urlOut, path: row.path, task_id: row.meta?.task_id || null } }) : null;
        if (origin) await tick(origin);
        return json({ ok: true, file: { ...row, url: urlOut }, message_id: message?.id || null });
      }
      if (segs[0] === "file" && segs[1] && segs[2] === "text" && method === "POST") {
        const b = await req.json().catch(() => ({}));
        const fileId = segs[1];
        const extracted = trim(b.text, 3e6);
        const { data: file } = await sb.from("cr_files").select("*").eq("id", fileId).maybeSingle();
        if (!file) return err("file not found", 404);
        const textPath = `files/${file.meta?.origin_session_id || file.session_id || "library"}/${fileId}.txt`;
        const { error } = await sb.storage.from("classroom").upload(textPath, new TextEncoder().encode(extracted), { contentType: "text/plain; charset=utf-8", upsert: true });
        if (error) return err(`storage: ${error.message}`, 500);
        const pages = Math.max(file.pages || 0, (extracted.match(/===\s*page\s+\d+\s*===/gi) || []).length);
        const patched = { ...file, text_path: textPath, text_url: publicUrl(textPath), pages };
        await sb.from("cr_files").update({ text_path: textPath, text_url: publicUrl(textPath), pages }).eq("id", fileId);
        const chunks = file.learned ? await indexKnowledge(patched, extracted) : 0;
        return json({ ok: true, text_url: publicUrl(textPath), pages, chunks });
      }
      if (segs[0] === "file" && segs[1] && segs[2] === "text" && method === "GET") {
        const { data: file } = await sb.from("cr_files").select("*").eq("id", segs[1]).maybeSingle();
        if (!file?.text_path) return err("no extracted text for this file", 404);
        const { data, error } = await sb.storage.from("classroom").download(file.text_path);
        if (error || !data) return err("could not read extracted text", 500);
        const from = Math.max(0, Number(url.searchParams.get("from") ?? "0") || 0);
        const all = await data.text();
        const slice = all.slice(from, from + 12e3);
        return json({ file_id: file.id, name: file.name, from, to: from + slice.length, text: slice, more: from + slice.length < all.length });
      }
      if (segs[0] === "file" && segs[1] && segs.length === 2 && method === "GET") {
        const { data } = await sb.from("cr_files").select("*").eq("id", segs[1]).maybeSingle();
        if (!data) return err("file not found", 404);
        return json({ file: data });
      }
      if ((route === "files" || route === "media") && method === "GET") {
        const sessionId = str(url.searchParams.get("session_id"));
        if (!sessionId) return err("session_id is required");
        if (route === "media") {
          const { data: data2 } = await sb.from("cr_media").select("*").eq("session_id", sessionId).order("created_at", { ascending: false });
          return json({ media: data2 ?? [] });
        }
        const path = url.searchParams.get("path");
        let q = sb.from("cr_files").select("*").or(`session_id.eq.${sessionId},session_id.is.null`).is("deleted_at", null).order("created_at", { ascending: false });
        if (path !== null) q = q.eq("path", path);
        const [{ data }, { data: folders }] = await Promise.all([
          q,
          sb.from("cr_folders").select("path,author,created_at").eq("session_id", sessionId).order("path")
        ]);
        return json({ files: data ?? [], folders: folders ?? [] });
      }
      if (route === "kb/search" && method === "GET") {
        const sessionId = str(url.searchParams.get("session_id")), q = str(url.searchParams.get("q"));
        const k = Math.max(1, Math.min(8, Number(url.searchParams.get("k") ?? "8") || 8));
        if (!sessionId || !q) return err("session_id and q are required");
        const terms = normal(q).split(" ").filter((x) => x.length > 2).slice(0, 10).join(" & ");
        const { data } = await sb.from("cr_knowledge").select("id,file_id,page,text,cr_files(name)").or(`session_id.eq.${sessionId},session_id.is.null`).textSearch("tsv", terms).limit(k);
        return json({ hits: (data ?? []).map((x) => ({ id: x.id, file_id: x.file_id, file: x.cr_files?.name || "library file", page: x.page, text: trim(x.text, 800) })) });
      }
      if (route === "file/learn" && method === "POST") {
        const b = await req.json().catch(() => ({}));
        const fileId = str(b.file_id);
        const learned = b.learned !== false;
        const { data: file } = await sb.from("cr_files").select("*").eq("id", fileId).maybeSingle();
        if (!file) return err("file not found", 404);
        await sb.from("cr_files").update({ learned }).eq("id", fileId);
        if (!learned) {
          await sb.from("cr_knowledge").delete().eq("file_id", fileId);
          return json({ ok: true, learned: false, chunks: 0 });
        }
        if (!file.text_path) return err("extract text before learning from this file", 409);
        const { data: blob, error } = await sb.storage.from("classroom").download(file.text_path);
        if (error || !blob) return err("could not read text", 500);
        const chunks = await indexKnowledge({ ...file, learned: true }, await blob.text());
        return json({ ok: true, learned: true, chunks });
      }
      if (["files/mkdir", "files/move", "files/delete"].includes(route) && method === "POST") {
        const b = await req.json().catch(() => ({}));
        const sessionId = str(b.session_id);
        const { seat, author } = await optionalActor(req, url);
        if (!sessionId) return err("session_id is required");
        if (route === "files/mkdir") {
          const folder = trim(b.path, 180).replace(/^\/+|\.\.(\/|$)/g, "");
          if (!folder) return err("path is required");
          await sb.from("cr_folders").upsert({ session_id: sessionId, path: folder, author });
          return json({ ok: true, path: folder });
        }
        const fileId = str(b.file_id);
        const { data: file } = await sb.from("cr_files").select("*").eq("id", fileId).maybeSingle();
        if (!file) return err("file not found", 404);
        if (!isAdmin(url, req) && seat && file.author !== author) return err("only the author or admin may change this file", 403);
        if (route === "files/delete") {
          await sb.from("cr_files").update({ deleted_at: nowISO() }).eq("id", fileId);
          return json({ ok: true });
        }
        const next = trim(b.path, 180);
        await sb.from("cr_files").update({ path: next }).eq("id", fileId);
        return json({ ok: true, path: next });
      }
      if (route === "feedback" && method === "POST") {
        const b = await req.json().catch(() => ({}));
        const sessionId = str(b.session_id);
        if (!sessionId) return err("session_id is required");
        const msg = await insertMessage({ session_id: sessionId, role: "user", author: "You", kind: "feedback", body: trim(b.body, 600), meta: { rating: b.rating === -1 ? -1 : 1, task_id: b.task_id || null } });
        return json({ ok: !!msg, message_id: msg?.id || null });
      }
      if (route === "claim" && method === "POST") {
        const b = await req.json().catch(() => ({}));
        const name = trim(b.name, 60) || `agent-${Math.floor(Math.random() * 1e4)}`;
        for (let attempt = 0; attempt < 12; attempt++) {
          const seats = await getSeats();
          const free = seats.find((s) => !s.token);
          const stale = seats.find((s) => s.token && (!s.last_seen || Date.now() - new Date(s.last_seen).getTime() > ONLINE_WINDOW_MS));
          const mine = seats.find((s) => s.agent_name === name);
          const target = free ?? stale ?? mine;
          if (!target) return err("all 10 seats are claimed and online \u2014 try again later", 409);
          const token = crypto.randomUUID();
          const baseProfile = profileOf(target);
          const declared = {
            ...baseProfile,
            ...Array.isArray(b.strengths) ? { strengths: b.strengths.map((x) => trim(x, 40)).slice(0, 8) } : {},
            ...Array.isArray(b.weaknesses) ? { weaknesses: b.weaknesses.map((x) => trim(x, 40)).slice(0, 8) } : {}
          };
          let update = sb.from("cr_seats").update({
            token,
            agent_name: name,
            claimed_at: nowISO(),
            last_seen: nowISO(),
            status: "idle",
            profile: declared
          }).eq("seat", target.seat);
          if (free) update = update.is("token", null);
          else if (stale && target.seat === stale.seat) update = update.eq("token", stale.token);
          else update = update.eq("agent_name", name);
          const { data, error } = await update.select().maybeSingle();
          if (data) return json({ seat: data.seat, role: data.role, token, poll_hint: 3 });
          if (error && error.code !== "PGRST116") console.warn("claim retry", error);
        }
        return err("seat claim raced with another agent; retry", 409);
      }
      if (route === "calibrate" && method === "POST") {
        const seat = await seatFromToken(req, url);
        if (!seat) return err("invalid seat token", 401);
        const b = await req.json().catch(() => ({}));
        const expected = calibrationForSeat(seat.seat);
        const supplied = new Map((Array.isArray(b.answers) ? b.answers : []).map((x) => [String(x.id), normal(x.answer)]));
        const scores = {};
        for (const domain of DOMAINS) {
          const set = expected.filter((q) => q.domain === domain);
          const right = set.filter((q) => {
            const answer = supplied.get(q.id) || "";
            const target = normal(q.answer);
            return answer === target || answer.length > 2 && (answer.includes(target) || target.includes(answer));
          }).length;
          scores[domain] = Number((right / set.length).toFixed(3));
        }
        const old = profileOf(seat);
        const strengths = Array.isArray(b.strengths) ? b.strengths.map((x) => trim(x, 40)).slice(0, 8) : old.strengths;
        const weaknesses = Array.isArray(b.weaknesses) ? b.weaknesses.map((x) => trim(x, 40)).slice(0, 8) : old.weaknesses;
        const profile = { ...old, calibrated: true, calibration: scores, strengths, weaknesses, calibrated_at: nowISO() };
        await sb.from("cr_calibration_attempts").insert({ seat: seat.seat, test_id: `seat-${seat.seat}-v1`, answers: Array.isArray(b.answers) ? b.answers.slice(0, 15) : [], scores });
        await sb.from("cr_seats").update({ profile, last_seen: nowISO(), status: "idle" }).eq("seat", seat.seat);
        return json({ ok: true, seat: seat.seat, scores, message: "Calibration saved. Your profile is private; only seat/role scorecards are shown." });
      }
      if (route === "watch" && method === "POST") {
        const seat = await seatFromToken(req, url);
        if (!seat) return err("invalid seat token", 401);
        const b = await req.json().catch(() => ({}));
        const sheetId = str(b.sheet_id);
        if (!sheetId) return err("sheet_id is required");
        if (b.on === false) {
          await sb.from("cr_watches").delete().eq("seat", seat.seat);
          return json({ ok: true, watching: false });
        }
        await sb.from("cr_watches").upsert({ seat: seat.seat, sheet_id: sheetId, on_watch: true, updated_at: nowISO() });
        return json({ ok: true, watching: true, sheet_id: sheetId });
      }
      if (route === "inbox" && method === "GET") {
        const seat = await seatFromToken(req, url);
        if (!seat) return err("invalid seat token (re-claim with POST /claim)", 401);
        const lastSeq = Number(url.searchParams.get("since") ?? url.searchParams.get("last_seq") ?? "0") || 0;
        const sheetSeq = Number(url.searchParams.get("sheet_seq") ?? "0") || 0;
        const wait = Math.max(0, Math.min(20, Number(url.searchParams.get("wait") ?? "0") || 0));
        let payload = await buildInbox(seat, lastSeq, sheetSeq);
        const until = Date.now() + wait * 1e3;
        while (wait && !payload.wake && Date.now() < until) {
          await new Promise((resolve) => setTimeout(resolve, 1e3));
          payload = await buildInbox(seat, lastSeq, sheetSeq);
        }
        if (JSON.stringify(payload).length > 6144) payload.since_last = payload.since_last.slice(-4).map((m) => ({ ...m, body: trim(m.body, 160) }));
        return json(payload);
      }
      if (route === "say" && method === "POST") {
        const seat = await seatFromToken(req, url);
        if (!seat) return err("invalid seat token", 401);
        const b = await req.json().catch(() => ({}));
        const taskId = str(b.task_id);
        const kind = str(b.kind);
        let body = str(b.body);
        const LIMITS = { note: 1200, objection: 1500, draft: 6e3, vote: 300, verify: 3e3, final: 9e3, status: 500, speak: 1200, feedback: 600, todo: 1200, question_to_user: 1200 };
        if (!taskId || !(kind in LIMITS) || !body.trim()) return err("task_id, valid kind and body are required");
        let truncated = false;
        if (body.length > LIMITS[kind]) {
          body = body.slice(0, LIMITS[kind]);
          truncated = true;
        }
        const { data: task } = await sb.from("cr_tasks").select("*").eq("id", taskId).maybeSingle();
        if (!task) return err("task not found", 404);
        const metaIn = b.meta && typeof b.meta === "object" ? b.meta : {};
        if (kind === "vote" && typeof metaIn.approve !== "boolean") return err("vote requires meta.approve (true|false) and meta.reason");
        if (kind === "speak" && body.length > 1200) return err("speak is limited to 1200 characters");
        let taskForTick = task;
        if (seat.seat === 1 && kind === "note" && task.phase === "research" && (metaIn.needs_research === false || Array.isArray(metaIn.domains))) {
          const domains2 = Array.isArray(metaIn.domains) ? metaIn.domains.filter((d) => DOMAINS.includes(String(d))).slice(0, 2) : task.state?.domains;
          taskForTick = await patchTask(task, { state: { ...task.state, ...metaIn.needs_research === false ? { needs_research: false } : {}, ...domains2?.length ? { domains: domains2 } : {} } });
        }
        const role = kind === "final" ? "council" : "agent";
        const author = `Seat ${seat.seat} \xB7 ${seat.role}`;
        const msg = await insertMessage({
          session_id: task.session_id,
          role,
          author,
          kind,
          body,
          meta: {
            ...metaIn,
            seat: seat.seat,
            role: seat.role,
            task_id: task.id,
            round: task.round,
            truncated,
            agent_name: seat.agent_name,
            ...kind === "vote" ? { reason: trim(metaIn.reason, 300) } : {}
          }
        });
        if (!msg) return err("could not store message", 500);
        const domains = taskForTick.state?.domains || ["language"];
        let trackDelta = 0.5;
        if (kind === "verify" && Array.isArray(metaIn.claims)) trackDelta = metaIn.claims.some((c) => c.verdict === "wrong") ? 0.42 : 0.62;
        if (kind === "objection") trackDelta = 0.58;
        if (kind === "vote") trackDelta = metaIn.approve ? 0.56 : 0.46;
        const nextProfile = mutateTrack(seat.profile, domains, trackDelta);
        await sb.from("cr_seats").update({ last_seen: nowISO(), status: "idle", profile: nextProfile }).eq("seat", seat.seat);
        await advanceTask(taskForTick);
        return json({ ok: true, message_id: msg.id, seq: msg.seq });
      }
      if (route === "draw" && method === "POST") {
        const admin = isAdmin(url, req);
        let seat = null;
        if (!admin) {
          seat = await seatFromToken(req, url);
          if (!seat) return err("invalid seat token (illustrator only, or admin)", 401);
          if (seat.role !== "illustrator") return err("only the illustrator seat (seat 9) may draw, or an admin", 403);
        }
        const b = await req.json().catch(() => ({}));
        const sheetId = str(b.sheet_id);
        if (!sheetId) return err("sheet_id is required");
        const ops = (Array.isArray(b.ops) ? b.ops : []).slice(0, 200).map(sanitizeOp).filter(Boolean);
        if (!ops.length) return err("no valid ops");
        const author = admin ? "admin" : "illustrator";
        const inserted = await insertOps(sheetId, author, ops);
        const { data: sheet } = await sb.from("cr_sheets").select("session_id, idx").eq("id", sheetId).maybeSingle();
        if (sheet) {
          const { data: t } = await sb.from("cr_tasks").select("*").eq("session_id", sheet.session_id).eq("phase", "draw").order("created_at", { ascending: false }).limit(1).maybeSingle();
          if (t) await sb.from("cr_tasks").update({ state: { ...t.state, drawn: true }, updated_at: nowISO() }).eq("id", t.id);
          await insertMessage({
            session_id: sheet.session_id,
            role: "council",
            author: admin ? "admin" : "Seat 9 \xB7 illustrator",
            kind: "board_event",
            body: `Illustrator drew ${inserted.length} operation(s) on Sheet ${sheet.idx}.`,
            meta: { sheet_id: sheetId, count: inserted.length }
          });
          await tick(sheet.session_id);
        }
        return json({ ok: true, inserted: inserted.length });
      }
      if (route === "memory" && method === "GET") {
        const sessionId = str(url.searchParams.get("session_id"));
        if (!sessionId) return err("session_id is required");
        return json({ memory: await sessionMemory(sessionId) });
      }
      if (route === "memory" && method === "POST") {
        const seat = await seatFromToken(req, url);
        const admin = isAdmin(url, req);
        if (!admin && (!seat || seat.role !== "scribe")) return err("only the scribe or admin may update memory", 403);
        const b = await req.json().catch(() => ({}));
        const sessionId = str(b.session_id);
        const body = trim(b.body, 2500);
        if (!sessionId || !body) return err("session_id and body are required");
        const updatedBy = admin ? "admin" : `Seat ${seat.seat} \xB7 scribe`;
        await sb.from("cr_memory").upsert({ session_id: sessionId, body, updated_at: nowISO(), updated_by: updatedBy });
        return json({ ok: true, memory: { body, updated_at: nowISO(), updated_by: updatedBy } });
      }
      if (route === "search" && method === "GET") {
        const sessionId = str(url.searchParams.get("session_id")), q = str(url.searchParams.get("q"));
        if (!sessionId || !q) return err("session_id and q are required");
        const terms = normal(q).split(" ").filter((x) => x.length > 2).slice(0, 10).join(" & ");
        const { data } = await sb.from("cr_messages").select("seq,kind,author,body,created_at").eq("session_id", sessionId).textSearch("search_vector", terms).order("seq").limit(8);
        return json({ hits: (data ?? []).map((m) => ({ seq: m.seq, kind: m.kind, author: m.author, created_at: m.created_at, snippet: trim(m.body, 500) })) });
      }
      if (route === "stats" && method === "GET") {
        const [{ data: tasks }, seats] = await Promise.all([sb.from("cr_tasks").select("phase,round,created_at,updated_at"), getSeats()]);
        const finished = (tasks ?? []).filter((t) => ["done", "final", "draw"].includes(t.phase));
        const mean = finished.length ? Math.round(finished.reduce((sum, t) => sum + Math.max(0, new Date(t.updated_at).getTime() - new Date(t.created_at).getTime()), 0) / finished.length / 1e3) : 0;
        return json({ questions_answered: finished.length, mean_deliberation_s: mean, rounds_per_question: finished.length ? Number((finished.reduce((n, t) => n + Number(t.round || 1), 0) / finished.length).toFixed(2)) : 0, agreement_rate: finished.length ? Number((finished.filter((t) => Number(t.round || 1) === 1).length / finished.length).toFixed(2)) : 0, scorecards: seats.map((s) => ({ seat: s.seat, role: s.role, calibration: profileOf(s).calibration, track: profileOf(s).track })) });
      }
      if (route === "export" && method === "GET") {
        if (!isAdmin(url, req)) return err("admin key required (?admin=KEY)", 403);
        const sessionId = str(url.searchParams.get("session_id"));
        if (!sessionId) return err("session_id is required");
        const [{ data: session }, { data: messages }, { data: tasks }, { data: sheets }, memory, { data: files }, { data: media }] = await Promise.all([
          sb.from("cr_sessions").select("*").eq("id", sessionId).maybeSingle(),
          sb.from("cr_messages").select("*").eq("session_id", sessionId).order("seq"),
          sb.from("cr_tasks").select("*").eq("session_id", sessionId),
          sb.from("cr_sheets").select("*").eq("session_id", sessionId).order("idx"),
          sessionMemory(sessionId),
          sb.from("cr_files").select("*").or(`session_id.eq.${sessionId},session_id.is.null`).is("deleted_at", null),
          sb.from("cr_media").select("*").eq("session_id", sessionId)
        ]);
        if (!session) return err("session not found", 404);
        const enc = new TextEncoder();
        const safeTitle = String(session.title).replace(/[^a-z0-9_-]+/gi, "-").slice(0, 60) || "session";
        const root = `${safeTitle}-${sessionId}`;
        const transcript = (messages ?? []).map((m) => `## ${m.seq} \xB7 ${m.author} \xB7 ${m.kind}

${m.body}
`).join("\n");
        const entries = [{ name: `${root}/transcript.md`, bytes: enc.encode(transcript) }, { name: `${root}/MEMORY.md`, bytes: enc.encode(memory.body || "") }, { name: `${root}/manifest.json`, bytes: enc.encode(JSON.stringify({ session, files, media, sheets }, null, 2)) }];
        for (const task of tasks ?? []) {
          const rows = (messages ?? []).filter((m) => m.meta?.task_id === task.id && ["note", "objection", "verify", "vote", "draft"].includes(m.kind));
          entries.push({ name: `${root}/deliberation/${task.id}.md`, bytes: enc.encode(rows.map((m) => `## ${m.author} \xB7 ${m.kind}

${m.body}`).join("\n\n")) });
        }
        for (const sh of sheets ?? []) if (sh.png_path) {
          const { data } = await sb.storage.from("classroom").download(sh.png_path);
          if (data) entries.push({ name: `${root}/sheets/${sh.idx}-${String(sh.title).replace(/[^a-z0-9_-]+/gi, "-")}.png`, bytes: new Uint8Array(await data.arrayBuffer()) });
        }
        const zip = zipStore(entries);
        return new Response(zip, { headers: { ...CORS, "content-type": "application/zip", "content-disposition": `attachment; filename="${safeTitle}.zip"` } });
      }
      if (route === "transcript" && method === "GET") {
        const sessionId = str(url.searchParams.get("session_id"));
        const from = Math.max(0, parseInt(url.searchParams.get("from") ?? "0", 10) || 0);
        const to = Math.max(from, parseInt(url.searchParams.get("to") ?? "0", 10) || 0);
        const limit = Math.min(40, parseInt(url.searchParams.get("limit") ?? "40", 10) || 40);
        if (!sessionId) return err("session_id is required");
        let q = sb.from("cr_messages").select("*").eq("session_id", sessionId).order("seq").limit(limit);
        if (from) q = q.gte("seq", from);
        if (to) q = q.lte("seq", to);
        const { data } = await q;
        return json({ messages: data ?? [] });
      }
      if (["reset", "kick", "log", "settings"].includes(segs[0])) {
        if (!isAdmin(url, req)) return err("admin key required (?admin=KEY)", 403);
        if (route === "reset" && method === "POST") {
          const b = await req.json().catch(() => ({}));
          const sessionId = b.session_id ? str(b.session_id) : null;
          const hard = url.searchParams.get("hard") === "1";
          let q = sb.from("cr_tasks").delete().neq("id", "00000000-0000-0000-0000-000000000000");
          if (sessionId) q = q.eq("session_id", sessionId);
          await q;
          if (hard) {
            let mq = sb.from("cr_messages").delete().neq("id", 0);
            if (sessionId) mq = mq.eq("session_id", sessionId);
            await mq;
          }
          await sb.from("cr_seats").update({ token: null, agent_name: null, claimed_at: null, last_seen: null, status: "offline" }).gte("seat", 1);
          return json({ ok: true, cleared: "tasks+seats", kept: "sheets" + (hard ? "" : "+messages") });
        }
        if (route === "kick" && method === "POST") {
          const b = await req.json().catch(() => ({}));
          const seatNo = parseInt(String(b.seat ?? url.searchParams.get("seat") ?? ""), 10);
          if (!(seatNo >= 1 && seatNo <= 10)) return err("seat 1..10 required");
          await sb.from("cr_seats").update({ token: null, agent_name: null, claimed_at: null, last_seen: null, status: "offline" }).eq("seat", seatNo);
          return json({ ok: true, kicked: seatNo });
        }
        if (route === "log") {
          const [{ data: tasks }, { data: seats }, { data: msgs }] = await Promise.all([
            sb.from("cr_tasks").select("*").order("created_at", { ascending: false }).limit(20),
            sb.from("cr_seats").select("*").order("seat"),
            sb.from("cr_messages").select("id,session_id,seq,role,author,kind,created_at").order("id", { ascending: false }).limit(100)
          ]);
          return json({ tasks, seats, messages: msgs });
        }
        if (route === "settings" && method === "POST") {
          const b = await req.json().catch(() => ({}));
          const patch = {};
          for (const k of ["quorum", "phase_timeout_s", "max_rounds", "draw_timeout_s", "revise_timeout_s"]) {
            if (typeof b[k] === "number" && isFinite(b[k])) patch[k] = b[k];
          }
          const next = await putSettings(patch);
          return json({ ok: true, settings: next });
        }
        return err("unknown admin route", 404);
      }
      return err("not found", 404);
    } catch (e) {
      console.error("classroom error", e);
      return json({ error: "internal error: " + (e?.message ?? String(e)) }, 500);
    }
  }
  if (import_meta.main) Deno.serve(handler);
  return __toCommonJS(classroom_deploy_exports);
})();
