import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const { rows: rewards } = await pool.query(`
  SELECT lr.id AS reward_id, p.id AS product_id, p.name AS reward_product, p.slug,
         c.name AS merch_category
  FROM loyalty_rewards lr
  JOIN products p ON p.id = lr."productId"
  JOIN categories c ON c.id = p."categoryId"
  WHERE lr."isActive" = true
`);

console.log("=== AKTÍVNE ODMENY ===\n");
for (const row of rewards) {
  console.log(`Odmena: ${row.reward_product} (kategória: ${row.merch_category})`);

  const { rows: groups } = await pool.query(
    `SELECT pcg.label, pcg."minSelect", cat.name AS pool_name, cat."isChoicePool"
     FROM product_choice_groups pcg
     JOIN categories cat ON cat.id = pcg."categoryId"
     WHERE pcg."productId" = $1`,
    [row.product_id],
  );

  if (groups.length === 0) {
    console.log("  ❌ ŽIADNY výber na produkte → košík NEPÝTA veľkosť\n");
    continue;
  }

  for (const g of groups) {
    console.log(`  ✓ Výber „${g.label}" → pool „${g.pool_name}"`);
    const { rows: opts } = await pool.query(
      `SELECT p.name, p."isComboOption",
              (SELECT count(*) FROM menu_items mi WHERE mi."productId" = p.id AND mi."isAvailable" = true) AS menu_avail
       FROM products p
       JOIN product_choice_groups pcg ON pcg."categoryId" = p."categoryId"
       WHERE pcg."productId" = $1 AND p."isActive" = true`,
      [row.product_id],
    );
    for (const o of opts) {
      const ok = o.isComboOption && Number(o.menu_avail) > 0;
      console.log(
        `      ${ok ? "✓" : "❌"} ${o.name} | combo: ${o.isComboOption} | v menu: ${o.menu_avail}`,
      );
    }
  }
  console.log("");
}

await pool.end();
