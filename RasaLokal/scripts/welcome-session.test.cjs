const assert = require('node:assert/strict');
const { test } = require('node:test');
const { setImmediate: tick } = require('node:timers/promises');
const { checkWelcomeSession, readVerifiedSession } = require('../src/lib/welcomeSession.ts');

const response = (session = null, error = null) => ({ data: { session }, error });
const validSession = { user: { id: 'test-user' }, expires_at: Math.floor(Date.now() / 1000) + 3600 };
const check = read => new Promise(resolve => checkWelcomeSession(read, resolve, 15));

const verifiedCheck = (getUser, session = { ...validSession, access_token: 'fixture-token' }) => check(() => readVerifiedSession({ getSession: async () => response(session), getUser }));

test('cached session requires a matching user verified by Auth', async () => {
  assert.equal(await verifiedCheck(async token => {
    assert.equal(token, 'fixture-token');
    return { data: { user: { id: 'test-user' } }, error: null };
  }), 'authenticated');
  assert.equal(await verifiedCheck(async () => ({ data: { user: { id: 'another-user' } }, error: null })), 'guest');
});
test('missing session never calls Auth user endpoint', async () => {
  assert.equal(await verifiedCheck(() => { throw new Error('must not be called'); }, null), 'guest');
  assert.equal(await verifiedCheck(() => { throw new Error('must not be called'); }, validSession), 'guest');
});
test('rejected cached credentials are guests, while connection failures allow retry', async () => {
  for (const status of [401, 403]) {
    assert.equal(await verifiedCheck(async () => ({ data: { user: null }, error: { status } })), 'guest');
  }
  assert.equal(await verifiedCheck(async () => ({ data: { user: null }, error: { status: 503 } })), 'unavailable');
  assert.equal(await verifiedCheck(async () => { throw new Error('offline'); }), 'unavailable');
  assert.equal(await verifiedCheck(() => new Promise(() => {})), 'unavailable');
});

test('guest and valid-session results are distinguished', async () => {
  assert.equal(await check(async () => response()), 'guest');
  assert.equal(await check(async () => response(validSession)), 'authenticated');
});
test('expired cached credentials never trigger an automatic redirect', async () => {
  assert.equal(await check(async () => response({ ...validSession, expires_at: 1 })), 'unavailable');
});
test('SDK errors, thrown reads and rejected reads become recoverable UI states', async () => {
  assert.equal(await check(async () => response(null, new Error('offline'))), 'unavailable');
  assert.equal(await check(() => { throw new Error('storage unavailable'); }), 'unavailable');
  assert.equal(await check(async () => { throw new Error('network unavailable'); }), 'unavailable');
});
test('a session refresh which never resolves stops blocking the UI at the deadline', async () => {
  assert.equal(await check(() => new Promise(() => {})), 'unavailable');
});
test('a late success cannot redirect the user after the deadline', async () => {
  let complete;
  const events = [];
  await new Promise(done => {
    checkWelcomeSession(() => new Promise(resolve => { complete = resolve; }), state => { events.push(state); done(); }, 15);
  });
  complete(response(validSession));
  await tick();
  assert.deepEqual(events, ['unavailable']);
});
test('leaving the welcome screen cancels callbacks including a late login result', async () => {
  let complete;
  const events = [];
  const cancel = checkWelcomeSession(() => new Promise(resolve => { complete = resolve; }), state => events.push(state), 100);
  await tick();
  cancel();
  complete(response(validSession));
  await tick();
  assert.deepEqual(events, []);
});
test('a rejected request after cancellation is handled without a callback', async () => {
  let reject;
  const events = [];
  const cancel = checkWelcomeSession(() => new Promise((_, fail) => { reject = fail; }), state => events.push(state), 100);
  await tick();
  cancel();
  reject(new Error('late failure'));
  await tick();
  assert.deepEqual(events, []);
});
