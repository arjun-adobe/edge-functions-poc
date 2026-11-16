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

import assert from 'assert';
import { isAllowedOrigin, withCors, preflight } from '../src/lib/cors.js';

const SITE = 'https://edge-demo--bv-wknd-poc--arjun-adobe.aem.page';
const req = (headers, method = 'GET') => new Request('http://127.0.0.1:7676/', { method, headers });

describe('Test CORS', function () {
    describe('isAllowedOrigin', function () {
        it('allows the site on any branch, preview and live', function () {
            assert.ok(isAllowedOrigin(SITE));
            assert.ok(isAllowedOrigin('https://main--bv-wknd-poc--arjun-adobe.aem.live'));
            assert.ok(isAllowedOrigin('http://localhost:3000'));
        });
        it('rejects other origins', function () {
            assert.ok(!isAllowedOrigin(null));
            assert.ok(!isAllowedOrigin('http://edge-demo--bv-wknd-poc--arjun-adobe.aem.page'));
            assert.ok(!isAllowedOrigin('https://main--other-site--arjun-adobe.aem.page'));
            assert.ok(!isAllowedOrigin('https://main--bv-wknd-poc--arjun-adobe.aem.page.evil.com'));
            assert.ok(!isAllowedOrigin('https://evil.com'));
        });
    });
    describe('withCors', function () {
        it('adds CORS and private network headers for an allowed origin', async function () {
            const resp = withCors(req({ Origin: SITE }), new Response('hi', { status: 200 }));
            assert.equal(resp.headers.get('Access-Control-Allow-Origin'), SITE);
            assert.equal(resp.headers.get('Access-Control-Allow-Private-Network'), 'true');
            assert.equal(resp.headers.get('Vary'), 'Origin');
            assert.equal(resp.status, 200);
            assert.equal(await resp.text(), 'hi');
        });
        it('leaves the response alone for other origins', function () {
            const resp = withCors(req({ Origin: 'https://evil.com' }), new Response('hi'));
            assert.equal(resp.headers.get('Access-Control-Allow-Origin'), null);
        });
    });
    describe('preflight', function () {
        it('answers an allowed private network preflight with 204', function () {
            const resp = preflight(req({
                Origin: SITE,
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Private-Network': 'true',
            }, 'OPTIONS'));
            assert.equal(resp.status, 204);
            assert.equal(resp.headers.get('Access-Control-Allow-Origin'), SITE);
            assert.equal(resp.headers.get('Access-Control-Allow-Private-Network'), 'true');
            assert.equal(resp.headers.get('Access-Control-Allow-Methods'), 'GET, OPTIONS');
        });
        it('rejects a preflight from another origin', function () {
            const resp = preflight(req({ Origin: 'https://evil.com' }, 'OPTIONS'));
            assert.equal(resp.status, 403);
        });
    });
});
