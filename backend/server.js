
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const supabase = require("./supabase");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// --------------------------------------------------
// 1. Home route
// --------------------------------------------------
app.get("/", (req, res) => {
  res.json({
    message: "Quote Generator with History API is running!",
  });
});

// --------------------------------------------------
// 2. Health check: backend + Supabase connection
// --------------------------------------------------
app.get("/api/health", async (req, res) => {
  try {
    const { error } = await supabase
      .from("quotes")
      .select("id")
      .limit(1);

    if (error) {
      return res.status(500).json({
        status: "ERROR",
        message: error.message,
      });
    }

    return res.json({
      status: "OK",
      message: "Backend and Supabase connected",
    });
  } catch (error) {
    return res.status(500).json({
      status: "ERROR",
      message: error.message,
    });
  }
});

// --------------------------------------------------
// 3. Get all fallback quotes from Supabase
// --------------------------------------------------
app.get("/api/quotes", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    return res.json(data);
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
});

// --------------------------------------------------
// 4. Get a random quote from the public API
//    If the public API fails, use Supabase fallback
// --------------------------------------------------
app.get("/api/quotes/random", async (req, res) => {
  try {
    const response = await fetch(
      "https://dummyjson.com/quotes/random"
    );

    if (!response.ok) {
      throw new Error("Public quote API unavailable");
    }

    const result = await response.json();

    if (
      !result ||
      typeof result.quote !== "string" ||
      typeof result.author !== "string"
    ) {
      throw new Error("Invalid response from public quote API");
    }

    return res.json({
      quote: {
        id: `api-${result.id}`,
        text: result.quote,
        author: result.author,
        topic: "Inspiration",
      },
      source: "public-api",
    });
  } catch (apiError) {
    console.warn(
      "Public quote API failed. Using fallback:",
      apiError.message
    );

    try {
      const { data, error } = await supabase
        .from("quotes")
        .select("*");

      if (error) {
        return res.status(500).json({
          error: "Unable to load fallback quotes",
        });
      }

      if (!data || data.length === 0) {
        return res.status(503).json({
          error: "No fallback quotes are available",
        });
      }

      const fallback =
        data[Math.floor(Math.random() * data.length)];

      return res.json({
        quote: fallback,
        source: "fallback",
      });
    } catch (fallbackError) {
      return res.status(500).json({
        error: "Unable to fetch quotes",
        details: fallbackError.message,
      });
    }
  }
});

// --------------------------------------------------
// 5. Generate a quote from the existing Supabase list
//    and save it to history
// --------------------------------------------------
app.post("/api/quotes/:id/generate", async (req, res) => {
  try {
    const quoteId = Number(req.params.id);

    if (!Number.isSafeInteger(quoteId) || quoteId <= 0) {
      return res.status(400).json({
        error: "Invalid quote ID",
      });
    }

    const { data: quote, error: quoteError } =
      await supabase
        .from("quotes")
        .select("*")
        .eq("id", quoteId)
        .maybeSingle();

    if (quoteError) {
      return res.status(500).json({
        error: quoteError.message,
      });
    }

    if (!quote) {
      return res.status(404).json({
        error: "Quote not found",
      });
    }

    const { data: history, error: historyError } =
      await supabase
        .from("quote_history")
        .insert({
          quote_id: quote.id,
          quote_text: quote.text,
          quote_author: quote.author,
          topic: quote.topic,
        })
        .select()
        .single();

    if (historyError) {
      return res.status(500).json({
        error: historyError.message,
      });
    }

    return res.status(201).json({
      message: "Quote generated and saved to history",
      quote,
      history,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
});

// --------------------------------------------------
// 6. Save any quote to history
//    Supports quotes returned by the public API
// --------------------------------------------------
app.post("/api/history", async (req, res) => {
  try {
    const {
      quote_text,
      quote_author,
      topic,
    } = req.body;

    if (
      typeof quote_text !== "string" ||
      !quote_text.trim() ||
      typeof quote_author !== "string" ||
      !quote_author.trim()
    ) {
      return res.status(400).json({
        error: "Quote text and author are required",
      });
    }

    const { data, error } = await supabase
      .from("quote_history")
      .insert({
        quote_id: null,
        quote_text: quote_text.trim(),
        quote_author: quote_author.trim(),
        topic:
          typeof topic === "string" && topic.trim()
            ? topic.trim()
            : "Inspiration",
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    return res.status(201).json({
      message: "Quote saved to history",
      history: data,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
});

// --------------------------------------------------
// 7. Get quote generation history
// --------------------------------------------------
app.get("/api/history", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("quote_history")
      .select("*")
      .order("generated_at", { ascending: false });

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    return res.json(data);
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
});

// --------------------------------------------------
// 8. Start the server
// --------------------------------------------------

 // Get all saved favorites
app.get("/api/favorites", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("favorites")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Save a favorite quote
app.post("/api/favorites", async (req, res) => {
  try {
    const { quote_text, quote_author, topic } = req.body;

    if (
      typeof quote_text !== "string" ||
      !quote_text.trim() ||
      typeof quote_author !== "string" ||
      !quote_author.trim()
    ) {
      return res.status(400).json({
        error: "Quote text and author are required",
      });
    }

    const { data, error } = await supabase
      .from("favorites")
      .upsert(
        {
          quote_text: quote_text.trim(),
          quote_author: quote_author.trim(),
          topic:
            typeof topic === "string" && topic.trim()
              ? topic.trim()
              : "Inspiration",
        },
        {
          onConflict: "quote_text,quote_author",
          ignoreDuplicates: true,
        }
      )
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({
      message: "Favorite saved",
      favorite: data?.[0] ?? null,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Remove a favorite by its database ID
app.delete("/api/favorites/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        error: "Invalid favorite ID",
      });
    }

    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("id", id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ message: "Favorite removed" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
