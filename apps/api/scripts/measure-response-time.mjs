/**
 * Đo thời gian phản hồi API (đề §4.2: "Thời gian phản hồi API < 500ms với dữ liệu mẫu", task #65).
 *
 * Cách chạy (API và DB đang chạy, đã seed dữ liệu mẫu):
 *   cd apps/api
 *   node scripts/measure-response-time.mjs
 *
 * Biến môi trường (tuỳ chọn):
 *   API_URL        mặc định http://localhost:3001/api
 *   RUNS           số lần đo mỗi endpoint, mặc định 50
 *   WARMUP         số lần gọi bỏ qua trước khi đo, mặc định 5
 *   USER_EMAIL     mặc định customer01@brewlite.test (tài khoản seed)
 *   USER_PASSWORD  mặc định SEED_USER_PASSWORD hoặc Brewlite@123
 *
 * Các request được gửi lần lượt (một người dùng), đo từ lúc gửi tới lúc đọc xong body.
 * Tiêu chí đạt: p95 < 500 ms cho từng endpoint. Bảng kết quả in ra dạng Markdown.
 * Thoát với mã 1 nếu có endpoint không đạt hoặc trả mã khác 2xx.
 */

const API_URL = (process.env.API_URL ?? 'http://localhost:3001/api').replace(/\/+$/, '');
const RUNS = Number(process.env.RUNS ?? 50);
const WARMUP = Number(process.env.WARMUP ?? 5);
const EMAIL = process.env.USER_EMAIL ?? 'customer01@brewlite.test';
const PASSWORD = process.env.USER_PASSWORD ?? process.env.SEED_USER_PASSWORD ?? 'Brewlite@123';
const LIMIT_MS = 500;

async function call(method, path, { token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  const start = performance.now();
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const ms = performance.now() - start;

  if (!res.ok) {
    throw new Error(`${method} ${path} -> HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return { ms, json: text ? JSON.parse(text) : null };
}

function percentile(sorted, p) {
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

async function measure(name, request) {
  for (let i = 0; i < WARMUP; i++) await request();
  const times = [];
  for (let i = 0; i < RUNS; i++) times.push((await request()).ms);
  times.sort((a, b) => a - b);
  const avg = times.reduce((sum, t) => sum + t, 0) / times.length;
  return {
    name,
    min: times[0],
    median: percentile(times, 50),
    avg,
    p95: percentile(times, 95),
    max: times[times.length - 1],
  };
}

const fmt = (ms) => ms.toFixed(1);

const login = () => call('POST', '/auth/login', { body: { email: EMAIL, password: PASSWORD } });

const { json: session } = await login();
const token = session.accessToken;
const { json: menu } = await call('GET', '/products');
const products = menu.items ?? menu;
if (!products.length) throw new Error('GET /products trả về danh sách rỗng: hãy chạy npm run db:seed');
const productId = products[0].id;
const { json: history } = await call('GET', '/orders/me', { token });
const orderCount = (history.items ?? history).length;

const results = [
  await measure('GET /products', () => call('GET', '/products')),
  await measure('GET /products/:id', () => call('GET', `/products/${productId}`)),
  await measure('POST /auth/login', login),
  await measure('GET /orders/me', () => call('GET', '/orders/me', { token })),
];

console.log(`API: ${API_URL}`);
console.log(`Thời điểm: ${new Date().toISOString()} | Node ${process.version}`);
console.log(`Dữ liệu: ${products.length} món; ${EMAIL} có ${orderCount} đơn`);
console.log(`Mỗi endpoint: ${WARMUP} lần làm nóng (bỏ qua) + ${RUNS} lần đo, gửi lần lượt\n`);
console.log('| Endpoint | Min (ms) | Trung vị (ms) | TB (ms) | p95 (ms) | Max (ms) | Đạt (p95 < 500 ms) |');
console.log('| --- | ---: | ---: | ---: | ---: | ---: | :---: |');
for (const r of results) {
  const pass = r.p95 < LIMIT_MS ? 'Đạt' : 'Không đạt';
  console.log(`| \`${r.name}\` | ${fmt(r.min)} | ${fmt(r.median)} | ${fmt(r.avg)} | ${fmt(r.p95)} | ${fmt(r.max)} | ${pass} |`);
}

if (results.some((r) => r.p95 >= LIMIT_MS)) process.exitCode = 1;
