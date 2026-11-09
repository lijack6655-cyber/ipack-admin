import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = resolve(import.meta.dirname, '..');
function load(file, imports = {}) {
  const code = ts.transpileModule(readFileSync(resolve(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const loaded = { exports: {} };
  runInNewContext(code, { module: loaded, exports: loaded.exports, require: name => imports[name] ?? require(name) });
  return loaded.exports;
}
const types = load('src/types/index.ts');
const permissions = load('src/lib/auth/permissions.ts', { '@/types': types });
const ok = count => ({ count, error: null });
const flush = () => new Promise(resolve => setImmediate(resolve));

function setup(role = 'OPERATOR', file = 'src/pages/dashboard.tsx') {
  const state = [], effects = [], calls = [];
  let cursor = 0, queue = [], tree;
  let user = { firstName: '测试运营', email: 'test@example.invalid', role: { name: role } };
  let outcomes = { products: ok(0), articles: ok(12), inquiries: ok(3) };
  let clientError = false;
  const hooks = {
    ...React,
    useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = initial;
      return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
    },
    useEffect(fn, deps) {
      const index = cursor++, previous = effects[index];
      if (!previous || deps.some((value, i) => value !== previous.deps[i])) {
        previous?.cleanup?.();
        effects[index] = { deps };
        queue.push(() => { effects[index].cleanup = fn(); });
      }
    },
  };
  const Page = load(file, {
    react: hooks,
    'next/link': ({ children, ...props }) => React.createElement('a', props, children),
    'next/router': { useRouter: () => router },
    '@/components/layout/AdminLayout': ({ children }) => React.createElement('main', null, children),
    '@/lib/auth/store': { useAuthStore: () => ({ user, isAuthenticated: true, isInitialized: true, initializeFromStorage: initialize }) },
    '@/lib/auth/permissions': permissions,
    '@/components/auth/withAuth': { withAuth: Page => Page },
    '@/lib/supabase/browser': { getSupabaseBrowserClient: () => {
      if (clientError) throw Error('internal secret');
      return { from: table => ({ select: (columns, options) => {
        calls.push({ table, columns, options });
        if (table === 'profiles') return { order: column => {
          assert.equal(column, 'created_at');
          return typeof outcomes[table] === 'function' ? outcomes[table]() : Promise.resolve(outcomes[table]);
        } };
        return typeof outcomes[table] === 'function' ? outcomes[table]() : Promise.resolve(outcomes[table]);
      } }) };
    } },
  }).default;
  function initialize() {}
  const router = { push() {} };
  return {
    calls,
    render() { cursor = 0; queue = []; tree = Page(); const html = renderToStaticMarkup(tree); queue.forEach(fn => fn()); return html; },
    setOutcomes(value) { outcomes = value; },
    failClient() { clientError = true; },
    setRole(role) { user = { ...user, role: { name: role } }; },
    retry() {
      function find(node) {
        if (!node || typeof node !== 'object') return;
        if (node.type === 'button' && ['重试统计', '重试读取账号'].includes(node.props.children)) return node;
        return React.Children.toArray(node.props?.children).map(find).find(Boolean);
      }
      find(tree).props.onClick();
    },
  };
}

const page = setup();
assert.match(page.render(), /读取中/);
await flush();
let html = page.render();
assert.match(html, />0<.*>12</);
assert.doesNotMatch(html, /暂不可读|重试统计|待接入/);
assert.match(html, /href="\/admin\/products\/drafts"/);
assert.match(html, /href="\/admin\/content\/articles\/drafts"/);
for (const call of page.calls) {
  assert.equal(call.columns, '*');
  assert.deepEqual(JSON.parse(JSON.stringify(call.options)), { count: 'exact', head: true });
}

const partial = setup();
partial.setOutcomes({ products: ok(7), articles: { count: 9, error: { message: 'internal secret' } }, inquiries: () => Promise.reject(Error('internal secret')) });
partial.render();
await flush();
html = partial.render();
assert.match(html, />7</);
assert.equal((html.match(/暂不可读/g) || []).length, 2);
assert.match(html, /重试统计/);
assert.doesNotMatch(html, /internal secret/);
partial.setOutcomes({ products: ok(8), articles: ok(0), inquiries: ok(1) });
partial.retry();
partial.render();
assert.match(partial.render(), /读取中/);
await flush();
assert.doesNotMatch(partial.render(), /暂不可读|重试统计|读取中/);

const configFailure = setup();
configFailure.failClient();
configFailure.render();
assert.match(configFailure.render(), /重试统计/);
assert.doesNotMatch(configFailure.render(), /internal secret/);

const viewer = setup('VIEWER');
viewer.render();
await flush();
html = viewer.render();
assert.deepEqual(viewer.calls.map(call => call.table), ['products', 'articles']);
assert.doesNotMatch(html, /href="\/admin\/products\/drafts"|询价记录|重试统计/);
assert.match(html, /href="\/admin\/content\/articles\/drafts"/);

let finishOld;
const stale = setup();
stale.setOutcomes({ products: () => new Promise(resolve => { finishOld = resolve; }), articles: ok(99), inquiries: ok(99) });
stale.render();
stale.setRole('VIEWER');
stale.setOutcomes({ products: ok(2), articles: ok(4), inquiries: ok(0) });
stale.render();
await flush();
finishOld(ok(99));
await flush();
assert.doesNotMatch(stale.render(), />99</);
console.log('Dashboard checks passed: loading, zero, partial/rejected failures, retry, configuration failure, permissions, stale requests.');

const accounts = setup('SUPER_ADMIN', 'src/pages/admin/accounts/index.tsx');
accounts.setOutcomes({ profiles: { data: [], error: null } });
html = accounts.render();
assert.match(html, /正在读取账号列表/);
assert.doesNotMatch(html, /暂无真实账号/);
await flush();
assert.match(accounts.render(), /暂无真实账号/);
const accountFailure = setup('SUPER_ADMIN', 'src/pages/admin/accounts/index.tsx');
accountFailure.setOutcomes({ profiles: () => Promise.reject(Error('internal account secret')) });
accountFailure.render();
await flush();
html = accountFailure.render();
assert.match(html, /重试读取账号/);
assert.doesNotMatch(html, /暂无真实账号|internal account secret/);
accountFailure.setOutcomes({ profiles: { data: [{ id: 'test', first_name: '测试', email: 'test@example.invalid', role: 'operator', is_active: true }], error: null } });
accountFailure.retry();
accountFailure.render();
await flush();
assert.match(accountFailure.render(), /test@example.invalid/);
assert.doesNotMatch(accountFailure.render(), /重试读取账号|暂无真实账号/);
console.log('Account checks passed: initial loading, real empty result, rejected request, safe error copy, retry to rows.');

const Layout = load('src/components/layout/AdminLayout.tsx', {
  'next/link': ({ children, ...props }) => React.createElement('a', props, children),
  'next/router': { useRouter: () => ({ pathname: '/admin/settings' }) },
  '@/lib/auth/permissions': permissions,
}).default;
html = renderToStaticMarkup(React.createElement(Layout, { user: { role: { name: 'OPERATOR' } }, onLogout() {} }, 'Settings fixture'));
assert.match(html, /href="\/dashboard"[^>]*>首页<\/a>/);
assert.match(html, /text-slate-900 font-medium">个人设置<\/span>/);
console.log('Settings breadcrumb check passed. Browser verification remains a separate check.');
