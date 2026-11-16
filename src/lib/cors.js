/*
Copyright 2025 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

/// <reference types="@fastly/js-compute" />

// Browser origins allowed to call this function cross-origin.
// The bv-wknd-poc Edge Delivery site, on any branch, preview (.page) or live (.live),
// e.g. https://edge-demo--bv-wknd-poc--arjun-adobe.aem.page
const SITE_HOST = /^[a-z0-9-]+--(bv-wknd-poc--arjun-adobe)\.aem\.(page|live)$/;
// Local AEM dev server (`aem up`)
const LOCAL_ORIGINS = new Set(["http://localhost:3000", "http://127.0.0.1:3000"]);

const ALLOWED_METHODS = "GET, OPTIONS";

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (LOCAL_ORIGINS.has(origin)) return true;
  try {
    const { protocol, host } = new URL(origin);
    return protocol === "https:" && SITE_HOST.test(host);
  } catch (e) {
    return false;
  }
}

function setCorsHeaders(headers, origin) {
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Private-Network", "true"); // Chrome's local-network pre-check
  headers.append("Vary", "Origin");
}

// Adds CORS headers to a response when the request comes from an allowed origin.
// Copies the response so headers are writable even for responses coming from fetch().
function withCors(req, resp) {
  const origin = req.headers.get("Origin");
  if (!isAllowedOrigin(origin)) return resp;
  const headers = new Headers(resp.headers);
  setCorsHeaders(headers, origin);
  return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers });
}

// Answers a CORS / Private Network Access preflight (OPTIONS) request.
function preflight(req) {
  const origin = req.headers.get("Origin");
  if (!isAllowedOrigin(origin)) return new Response(null, { status: 403 });
  const headers = new Headers({
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Max-Age": "600",
  });
  const requestedHeaders = req.headers.get("Access-Control-Request-Headers");
  if (requestedHeaders) headers.set("Access-Control-Allow-Headers", requestedHeaders);
  setCorsHeaders(headers, origin);
  return new Response(null, { status: 204, headers });
}

export { SITE_HOST, isAllowedOrigin, withCors, preflight };
