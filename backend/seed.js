
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const supabase = require("./supabase");

async function seedQuotes() {
  const filePath = path.join(__dirname, "quotes.json");
  const quotes = JSON.parse(fs.readFileSync(filePath, "utf8"));

  const { data, error } = await supabase
    .from("quotes")
    .upsert(quotes, { onConflict: "id" })
    .select("id");

  if (error) {
    console.error("Import failed:", error.message);
    process.exitCode = 1;
    return;
  }

  console.log(`Successfully imported ${data.length} quotes.`);
}

seedQuotes().catch((error) => {
  console.error("Import failed:", error.message);
  process.exitCode = 1;
});
