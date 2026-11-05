import fs from "node:fs"
import path from "node:path"
import { DatabaseSync, type SQLInputValue } from "node:sqlite"
import { TIN_BUNDLE_SPECS, TIN_ENTRY_SLUG, bundleProductId } from "@/lib/bundles"
import { SOURCE_LINKS } from "@/lib/referrer"

const globalForDb = globalThis as unknown as { storelabDb?: DatabaseSync }
let schemaReady = false

const RITMORE = {
  name: "ritmore 카페인 민트 캔디",
  summary: "슬라이드 틴에 담긴 페퍼민트. 12개입.",
  description:
    "공부 책상, 야간 공부, 실습할 때 쓰는 카페인 민트 캔디입니다. 맛은 페퍼민트이고, 슬라이드 틴 하나에 12개가 들어 있습니다. 틴 크기는 55 × 67 × 9 mm입니다.",
  category: "페퍼민트",
  tagline: "공부 책상, 야간 공부, 실습할 때 꺼내는 페퍼민트 민트 캔디.",
  tone: "ritmore",
}

export function getDb() {
  if (!globalForDb.storelabDb) {
    const dir = path.join(process.cwd(), "data")
    fs.mkdirSync(dir, { recursive: true })
    const db = new DatabaseSync(path.join(dir, "storelab.sqlite"))
    db.exec("PRAGMA journal_mode = DELETE;")
    db.exec("PRAGMA busy_timeout = 3000;")
    db.exec("PRAGMA foreign_keys = ON;")
    migrate(db)
    seed(db)
    convertUsdCentsToWon(db)
    showOnlyFortyMilligram(db)
    ensureSourceLinks(db)
    globalForDb.storelabDb = db
    schemaReady = true
  }
  if (!schemaReady) {
    migrate(globalForDb.storelabDb)
    schemaReady = true
  }
  applyRitmore(globalForDb.storelabDb)
  ensureTinBundles(globalForDb.storelabDb)
  return globalForDb.storelabDb
}

export function all<T>(sql: string, params: SQLInputValue[] = []) {
  return getDb().prepare(sql).all(...params) as T[]
}

export function get<T>(sql: string, params: SQLInputValue[] = []) {
  return getDb().prepare(sql).get(...params) as T | undefined
}

export function run(sql: string, params: SQLInputValue[] = []) {
  return getDb().prepare(sql).run(...params)
}

function convertUsdCentsToWon(db: DatabaseSync) {
  const flag = db.prepare("SELECT value FROM settings WHERE key = 'price_unit'").get() as { value: string } | undefined
  if (flag?.value === "krw") return

  const sample = db.prepare("SELECT base_price FROM products ORDER BY base_price LIMIT 1").get() as
    | { base_price: number }
    | undefined
  if (sample && sample.base_price > 0 && sample.base_price < 10_000) {
    db.exec(`
      UPDATE products
      SET base_price = (base_price * 10 / 100) * 100,
          compare_at_price = CASE WHEN compare_at_price IS NULL THEN NULL ELSE (compare_at_price * 10 / 100) * 100 END;
      UPDATE variants
      SET price = (price * 10 / 100) * 100,
          compare_at_price = CASE WHEN compare_at_price IS NULL THEN NULL ELSE (compare_at_price * 10 / 100) * 100 END;
      UPDATE events SET price = (price * 10 / 100) * 100 WHERE price IS NOT NULL AND price < 10000;
    `)
    db.prepare("UPDATE links SET note = ? WHERE code = ?").run(
      "ritmore 카페인 민트 캔디, 24,900원 고정",
      "ig-story",
    )
    db.prepare("UPDATE links SET note = ? WHERE code = ?").run(
      "ritmore 카페인 민트 캔디, 27,900원 고정. 상품 페이지로 갑니다.",
      "yt-desc",
    )
  }

  db.prepare(
    `INSERT INTO settings (key, value) VALUES ('price_unit', 'krw')
     ON CONFLICT(key) DO UPDATE SET value = 'krw'`,
  ).run()
}

function showOnlyFortyMilligram(db: DatabaseSync) {
  db.prepare("UPDATE products SET status = 'hidden' WHERE slug IN ('sample-b', 'sample-c')").run()
  const flag = db.prepare("SELECT value FROM settings WHERE key = 'storefront_ko'").get() as { value: string } | undefined
  if (flag?.value === "1") return
  db.prepare(
    `INSERT INTO settings (key, value) VALUES ('storefront_ko', '1')
     ON CONFLICT(key) DO UPDATE SET value = '1'`,
  ).run()
}

function applyRitmore(db: DatabaseSync) {
  db.prepare("UPDATE products SET status = 'hidden' WHERE slug IN ('sample-b', 'sample-c')").run()
  const flag = db.prepare("SELECT value FROM settings WHERE key = 'storefront_ritmore'").get() as
    | { value: string }
    | undefined
  if (flag?.value === "1") return
  db.prepare(
    `UPDATE products
     SET name = ?, summary = ?, description = ?, category = ?, image_tone = ?
     WHERE slug = 'sample-a'`,
  ).run(RITMORE.name, RITMORE.summary, RITMORE.description, RITMORE.category, RITMORE.tone)
  db.prepare(
    `INSERT INTO settings (key, value) VALUES ('brand_name', 'ritmore')
     ON CONFLICT(key) DO UPDATE SET value = 'ritmore'`,
  ).run()
  db.prepare(
    `INSERT INTO settings (key, value) VALUES ('brand_tagline', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  ).run(RITMORE.tagline)
  db.prepare("UPDATE links SET note = ? WHERE code = ?").run(
    "ritmore 카페인 민트 캔디, 24,900원 고정",
    "ig-story",
  )
  db.prepare("UPDATE links SET note = ? WHERE code = ?").run(
    "ritmore 카페인 민트 캔디, 27,900원 고정. 상품 페이지로 갑니다.",
    "yt-desc",
  )
  db.prepare(
    `INSERT INTO settings (key, value) VALUES ('storefront_ritmore', '1')
     ON CONFLICT(key) DO UPDATE SET value = '1'`,
  ).run()
}

function ensureTinBundles(db: DatabaseSync) {
  const entry = db
    .prepare("SELECT base_price, compare_at_price FROM products WHERE slug = ?")
    .get(TIN_ENTRY_SLUG) as { base_price: number; compare_at_price: number | null } | undefined
  if (!entry) return
  const insert = db.prepare(
    `INSERT OR IGNORE INTO products
      (id, slug, name, summary, description, category, base_price, compare_at_price, status, image_tone, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', 'ritmore', ?)`,
  )
  const now = new Date().toISOString()
  for (const spec of TIN_BUNDLE_SPECS) {
    const compare = entry.compare_at_price == null ? null : entry.compare_at_price * spec.count
    insert.run(
      bundleProductId(spec.slug),
      spec.slug,
      spec.name,
      spec.summary,
      spec.description,
      spec.category,
      entry.base_price * spec.count,
      compare,
      now,
    )
  }
}

function migrate(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      summary TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      base_price INTEGER NOT NULL,
      compare_at_price INTEGER,
      status TEXT NOT NULL,
      image_tone TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS experiments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      hypothesis TEXT NOT NULL,
      status TEXT NOT NULL,
      product_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS variants (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      experiment_id TEXT NOT NULL,
      key TEXT NOT NULL,
      label TEXT NOT NULL,
      price INTEGER NOT NULL,
      compare_at_price INTEGER,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS links (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      channel TEXT NOT NULL,
      utm_source TEXT NOT NULL,
      utm_medium TEXT NOT NULL,
      utm_campaign TEXT NOT NULL,
      utm_content TEXT NOT NULL,
      landing_path TEXT NOT NULL,
      experiment_id TEXT,
      variant_id TEXT,
      product_id TEXT,
      note TEXT NOT NULL,
      price_override INTEGER,
      archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      visitor_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      dedupe_key TEXT NOT NULL,
      step TEXT NOT NULL,
      path TEXT NOT NULL,
      link_code TEXT,
      channel TEXT NOT NULL,
      source TEXT,
      medium TEXT,
      campaign TEXT,
      content TEXT,
      referrer TEXT,
      referrer_class TEXT,
      experiment_id TEXT,
      product_id TEXT,
      variant_id TEXT,
      price INTEGER,
      qty INTEGER,
      preview INTEGER NOT NULL DEFAULT 0,
      meta TEXT,
      UNIQUE (session_id, dedupe_key)
    );

    CREATE TABLE IF NOT EXISTS surveys (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      visitor_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      link_code TEXT,
      referrer_class TEXT,
      product_slug TEXT,
      qty INTEGER,
      price INTEGER,
      ease TEXT NOT NULL,
      second_press TEXT NOT NULL,
      intent TEXT NOT NULL,
      note TEXT NOT NULL,
      like_note TEXT NOT NULL DEFAULT '',
      check_note TEXT NOT NULL DEFAULT '',
      when_note TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      product_key TEXT NOT NULL,
      score INTEGER NOT NULL,
      body TEXT NOT NULL,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inquiries (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      product_key TEXT NOT NULL,
      body TEXT NOT NULL,
      name TEXT NOT NULL,
      answer TEXT,
      answered_at TEXT,
      is_private INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);
    CREATE INDEX IF NOT EXISTS idx_events_link ON events(link_code);
    CREATE INDEX IF NOT EXISTS idx_events_step ON events(step);
    CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_key, created_at);
    CREATE INDEX IF NOT EXISTS idx_inquiries_product ON inquiries(product_key, created_at);
  `)
  ensureColumn(db, "events", "referrer_class", "TEXT")
  ensureColumn(db, "events", "qty", "INTEGER")
  ensureColumn(db, "links", "price_override", "INTEGER")
  ensureColumn(db, "inquiries", "is_private", "INTEGER NOT NULL DEFAULT 0")
  ensureColumn(db, "surveys", "like_note", "TEXT NOT NULL DEFAULT ''")
  ensureColumn(db, "surveys", "check_note", "TEXT NOT NULL DEFAULT ''")
  ensureColumn(db, "surveys", "when_note", "TEXT NOT NULL DEFAULT ''")
  db.exec("CREATE INDEX IF NOT EXISTS idx_events_referrer_class ON events(referrer_class);")
  db.exec("CREATE INDEX IF NOT EXISTS idx_events_visitor ON events(visitor_id, created_at);")
}

function ensureColumn(db: DatabaseSync, table: string, column: string, definition: string) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]
  if (columns.some((item) => item.name === column)) return
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
}

function ensureSourceLinks(db: DatabaseSync) {
  const now = new Date().toISOString()
  const insert = db.prepare(
    `INSERT OR IGNORE INTO links
      (id, code, name, channel, utm_source, utm_medium, utm_campaign, utm_content, landing_path, experiment_id, variant_id, product_id, note, archived, created_at)
     VALUES (?, ?, ?, ?, '', '', '', '', '/', NULL, NULL, NULL, ?, 0, ?)`,
  )
  for (const link of SOURCE_LINKS) {
    insert.run(link.id, link.code, link.name, link.channel, link.note, now)
  }
}

function seed(db: DatabaseSync) {
  const count = db.prepare("SELECT COUNT(*) AS count FROM products").get() as { count: number }
  if (count.count > 0) return

  const now = new Date().toISOString()
  const insertSetting = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)")
  insertSetting.run("brand_name", "ritmore")
  insertSetting.run("brand_tagline", RITMORE.tagline)
  insertSetting.run("storefront_ko", "1")
  insertSetting.run("storefront_ritmore", "1")

  const insertProduct = db.prepare(
    `INSERT INTO products
      (id, slug, name, summary, description, category, base_price, compare_at_price, status, image_tone, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
  insertProduct.run(
    "prod_sample_a",
    "sample-a",
    RITMORE.name,
    RITMORE.summary,
    RITMORE.description,
    RITMORE.category,
    24900,
    29900,
    "active",
    RITMORE.tone,
    now,
  )
  insertProduct.run(
    "prod_sample_b",
    "sample-b",
    "엑스트라 스트렝스 민트",
    "한 알에 카페인 100mg.",
    "더 긴 작업에 쓰는 민트입니다.",
    "100mg",
    29900,
    34900,
    "hidden",
    "extra",
    now,
  )
  insertProduct.run(
    "prod_sample_c",
    "sample-c",
    "캄 & 클래리티 민트",
    "카페인 없이 GABA와 L-테아닌.",
    "일과를 마무리할 때 쓰는 민트입니다.",
    "무카페인",
    24900,
    27900,
    "hidden",
    "calm",
    now,
  )

  db.prepare(
    `INSERT INTO experiments (id, name, hypothesis, status, product_id, created_at)
     VALUES (?, ?, ?, 'running', ?, ?)`,
  ).run(
    "exp_price_1",
    "가격 테스트 1",
    "같은 상품을 링크마다 다른 가격으로 보여 주면 결제 버튼 비율이 어떻게 달라지는지 본다.",
    "prod_sample_a",
    now,
  )

  const insertVariant = db.prepare(
    `INSERT INTO variants (id, product_id, experiment_id, key, label, price, compare_at_price, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
  )
  insertVariant.run("var_a", "prod_sample_a", "exp_price_1", "A", "기본안", 24900, 29900)
  insertVariant.run("var_b", "prod_sample_a", "exp_price_1", "B", "인상안", 27900, 29900)

  const insertLink = db.prepare(
    `INSERT INTO links
      (id, code, name, channel, utm_source, utm_medium, utm_campaign, utm_content, landing_path, experiment_id, variant_id, product_id, note, archived, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
  )
  insertLink.run(
    "link_ig",
    "ig-story",
    "인스타 스토리",
    "instagram",
    "instagram",
    "story",
    "price-1",
    "variant-a",
    "/",
    "exp_price_1",
    "var_a",
    "prod_sample_a",
    "ritmore 카페인 민트 캔디, 24,900원 고정",
    now,
  )
  insertLink.run(
    "link_yt",
    "yt-desc",
    "유튜브 설명란",
    "youtube",
    "youtube",
    "description",
    "price-1",
    "variant-b",
    "/products/sample-a",
    "exp_price_1",
    "var_b",
    "prod_sample_a",
    "ritmore 카페인 민트 캔디, 27,900원 고정. 상품 페이지로 갑니다.",
    now,
  )
  insertLink.run(
    "link_direct",
    "direct-home",
    "직접 유입",
    "direct",
    "direct",
    "none",
    "baseline",
    "",
    "/",
    null,
    null,
    null,
    "가격안을 강제하지 않는다. 상품 기본가가 보인다.",
    now,
  )
}
