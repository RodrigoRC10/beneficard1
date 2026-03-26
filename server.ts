import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("beneficard.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    name TEXT,
    main_bank TEXT,
    favorite_categories TEXT,
    profile_color TEXT,
    profile_icon TEXT
  );
`);

// Migration: Add missing columns if they don't exist
const tableInfo = db.prepare("PRAGMA table_info(users)").all() as any[];
const columns = tableInfo.map(c => c.name);
if (!columns.includes('main_bank')) {
  db.exec("ALTER TABLE users ADD COLUMN main_bank TEXT");
}
if (!columns.includes('favorite_categories')) {
  db.exec("ALTER TABLE users ADD COLUMN favorite_categories TEXT");
}
if (!columns.includes('profile_color')) {
  db.exec("ALTER TABLE users ADD COLUMN profile_color TEXT");
}
if (!columns.includes('profile_icon')) {
  db.exec("ALTER TABLE users ADD COLUMN profile_icon TEXT");
}

// Migration for benefits table
const benefitsInfo = db.prepare("PRAGMA table_info(benefits)").all() as any[];
const benefitColumns = benefitsInfo.map(c => c.name);
if (benefitColumns.length > 0 && !benefitColumns.includes('reports')) {
  db.exec("ALTER TABLE benefits ADD COLUMN reports INTEGER DEFAULT 0");
}

db.exec(`
  CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    bank_name TEXT,
    card_type TEXT, -- 'debit', 'credit'
    card_name TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS benefits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bank_name TEXT,
    category TEXT, -- 'food', 'shopping', 'travel', etc.
    description TEXT,
    discount_percentage INTEGER,
    day_of_week TEXT, -- 'Monday', 'Tuesday', etc. or 'Everyday'
    store_name TEXT,
    card_type TEXT DEFAULT 'both', -- 'credit', 'debit', 'both'
    reports INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    item_name TEXT,
    store_name TEXT,
    status TEXT DEFAULT 'pending',
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Seed some initial benefits data
db.exec("DELETE FROM benefits");
const insertBenefit = db.prepare(`
    INSERT INTO benefits (bank_name, category, description, discount_percentage, day_of_week, store_name, card_type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const seedBenefits = [
    // Banco de Chile (Updated Data)
    ['Banco de Chile', 'Gastronomía', '40% dcto combos seleccionados.', 40, 'Monday', 'Doggis', 'both'],
    ['Banco de Chile', 'Gastronomía', '30% dcto cajas 6 y 12 donuts.', 30, 'Monday', 'Dunkin\'', 'both'],
    ['Banco de Chile', 'Gastronomía', '40% dcto combos seleccionados.', 40, 'Monday', 'Juan Maestro', 'both'],
    ['Banco de Chile', 'Mascotas', '20% dcto alimentos y accesorios mascotas.', 20, 'Monday', 'Petpa', 'both'],
    ['Banco de Chile', 'Gastronomía', '30% dcto tarjetas crédito/débito.', 30, 'Monday', 'Starbucks', 'both'],
    
    ['Banco de Chile', 'Salud', '20% dcto depilación y masajes.', 20, 'Tuesday', 'Eva Spa', 'both'],
    ['Banco de Chile', 'Salud', '20% dcto medicamentos y hasta 40% en belleza/dermo.', 20, 'Tuesday', 'Farmacias Cruz Verde', 'both'],
    ['Banco de Chile', 'Gastronomía', '30% dcto toda la carta (local).', 30, 'Tuesday', 'Mamut', 'both'],
    ['Banco de Chile', 'Gastronomía', '40% dcto burritos y bowls.', 40, 'Tuesday', 'Tommy Beans', 'both'],
    
    ['Banco de Chile', 'Gastronomía', '30% dcto sándwiches y hamburguesas.', 30, 'Wednesday', 'Barrio', 'both'],
    ['Banco de Chile', 'Gastronomía', '40% dcto baldes y combos seleccionados.', 40, 'Wednesday', 'KFC', 'both'],
    ['Banco de Chile', 'Gastronomía', '40% dcto pizzas seleccionadas.', 40, 'Wednesday', 'Lovdo', 'both'],
    ['Banco de Chile', 'Gastronomía', '40% dcto pizzas familiares/individuales (App).', 40, 'Wednesday', 'Papa John\'s', 'both'],
    ['Banco de Chile', 'Gastronomía', '40% dcto combos grandes.', 40, 'Wednesday', 'Wendy\'s', 'both'],
    
    ['Banco de Chile', 'Gastronomía', '40% dcto platos seleccionados.', 40, 'Thursday', 'China Wok', 'both'],
    ['Banco de Chile', 'Gastronomía', '30% dcto potes 1kg y copas.', 30, 'Thursday', 'Grido Helados', 'both'],
    ['Banco de Chile', 'Gastronomía', '20% dcto cajas bombones seleccionadas.', 20, 'Thursday', 'La Fête', 'both'],
    ['Banco de Chile', 'Gastronomía', '30% a 40% dcto según disponibilidad.', 35, 'Thursday', 'Sushi (Niu Sushi/Sushihana)', 'both'],
    
    ['Banco de Chile', 'Entretención', 'Entradas desde $3.600 y dcto en combos.', 50, 'Friday', 'Cinépolis / Cinemark', 'both'],
    ['Banco de Chile', 'Gastronomía', '25% a 40% dcto (App Mi Beneficio).', 30, 'Friday', 'Restaurantes Seleccionados', 'both'],
    ['Banco de Chile', 'Gastronomía', 'Descuentos variables con códigos promocionales.', 15, 'Friday', 'Uber Eats', 'both'],
    
    ['Banco de Chile', 'Compras', '6 a 12 cuotas sin interés en todo el sitio.', 10, 'Saturday', 'Mercado Libre', 'both'],
    ['Banco de Chile', 'Hogar', '$100 dcto por litro de combustible.', 10, 'Saturday', 'Shell (App Micopiloto)', 'both'],
    ['Banco de Chile', 'Viajes', 'Canje Dólares-Premio y cuotas sin interés.', 20, 'Saturday', 'SKY Airline', 'both'],
    ['Banco de Chile', 'Hogar', 'Descuentos exclusivos según fin de semana.', 15, 'Saturday', 'Sodimac', 'both'],
    
    ['Banco de Chile', 'Compras', '6 a 12 cuotas sin interés en todo el sitio.', 10, 'Sunday', 'Mercado Libre', 'both'],
    ['Banco de Chile', 'Hogar', '$100 dcto por litro de combustible.', 10, 'Sunday', 'Shell (App Micopiloto)', 'both'],
    ['Banco de Chile', 'Viajes', 'Canje Dólares-Premio y cuotas sin interés.', 20, 'Sunday', 'SKY Airline', 'both'],
    ['Banco de Chile', 'Hogar', 'Descuentos exclusivos según fin de semana.', 15, 'Sunday', 'Sodimac', 'both'],
    
    // BCI (Updated Data)
    ['BCI', 'Educación', 'Hasta 40% dcto en listas escolares (pago Crédito Bci).', 40, 'Monday', 'Dimeiggs / Lápiz López', 'credit'],
    ['BCI', 'Compras', 'Descuentos en marcas seleccionadas (Tarjeta Lider Bci).', 15, 'Monday', 'Lider', 'credit'],
    ['BCI', 'Salud', '20% dcto presencial (pago Crédito Bci, tope $20.000).', 20, 'Monday', 'Salcobrand', 'credit'],
    
    ['BCI', 'Salud', '20% dcto presencial (pago Crédito Bci, tope $20.000).', 20, 'Tuesday', 'Salcobrand', 'credit'],
    ['BCI', 'Hogar', '$100 dcto por litro de combustible (Tarjeta Lider Bci).', 10, 'Tuesday', 'Shell (App Micopiloto)', 'credit'],
    ['BCI', 'Compras', '25% dcto en mochilas y accesorios.', 25, 'Tuesday', 'Totto', 'both'],
    
    ['BCI', 'Salud', '40% dcto en productos Dermo.', 40, 'Wednesday', 'CopecPay / Farmacias Ahumada', 'both'],
    ['BCI', 'Viajes', 'Hasta 30% dcto en vuelos internacionales y 40% en nacionales (código BCIMACHC).', 35, 'Wednesday', 'JetSMART', 'credit'],
    
    ['BCI', 'Hogar', '$100 dcto por litro de combustible (vía Cashback BciPlus+).', 10, 'Thursday', 'Copec (App Copec)', 'credit'],
    
    ['BCI', 'Gastronomía', 'Cupón $5.000 dcto en sección Restaurantes.', 20, 'Friday', 'PedidosYa', 'both'],
    ['BCI', 'Gastronomía', 'Hasta 40% dcto en red de +250 locales.', 40, 'Friday', 'Restaurantes Seleccionados', 'both'],
    
    ['BCI', 'Compras', '10% OFF en Tecnología (Celulares, Computación).', 10, 'Saturday', 'Mercado Libre', 'credit'],
    ['BCI', 'Salud', '20% Cashback en compras online (tope $10.000).', 20, 'Saturday', 'Salcobrand.cl', 'credit'],
    
    ['BCI', 'Compras', '6% acumulación Pesos Mi Club (Tarjeta Lider Bci).', 6, 'Sunday', 'Lider / Lider.cl', 'credit'],
    ['BCI', 'Viajes', '3 a 12 cuotas sin interés en hoteles, aerolíneas y rent-a-car.', 10, 'Sunday', 'Viajes Bci', 'credit'],

    // Lider BCI (Duplicate for compatibility)
    ['Lider BCI', 'Educación', 'Hasta 40% dcto en listas escolares (pago Crédito Bci).', 40, 'Monday', 'Dimeiggs / Lápiz López', 'credit'],
    ['Lider BCI', 'Compras', 'Descuentos en marcas seleccionadas (Tarjeta Lider Bci).', 15, 'Monday', 'Lider', 'credit'],
    ['Lider BCI', 'Salud', '20% dcto presencial (pago Crédito Bci, tope $20.000).', 20, 'Monday', 'Salcobrand', 'credit'],
    ['Lider BCI', 'Hogar', '$100 dcto por litro de combustible (Tarjeta Lider Bci).', 10, 'Tuesday', 'Shell (App Micopiloto)', 'credit'],
    ['Lider BCI', 'Compras', '6% acumulación Pesos Mi Club (Tarjeta Lider Bci).', 6, 'Sunday', 'Lider / Lider.cl', 'credit'],
    
    // Banco Estado (Updated Data)
    ['Banco Estado', 'Educación', 'Pago de matrículas y escolaridad en 6 a 12 cuotas sin interés (Tarjeta de Crédito).', 10, 'Monday', 'Educación', 'credit'],
    ['Banco Estado', 'Salud', '40% dcto en medicamentos, vitaminas y minerales (presencial).', 40, 'Monday', 'Farmacias Maicao', 'both'],
    ['Banco Estado', 'Gastronomía', '40% dcto en compras sobre $12.000 (vía App).', 40, 'Monday', 'McDonald\'s', 'both'],
    
    ['Banco Estado', 'Compras', '20% dcto en productos y consultas veterinarias (online).', 20, 'Tuesday', 'Dr. Pet', 'both'],
    ['Banco Estado', 'Gastronomía', '30% dcto en el total de la boleta (presencial, tope $16.000).', 30, 'Tuesday', 'Juan Maestro, Doggis y Barrio Chick\'en', 'both'],
    ['Banco Estado', 'Gastronomía', 'Descuentos en pizzas seleccionadas (web o App).', 25, 'Tuesday', 'Papa John\'s', 'both'],
    
    ['Banco Estado', 'Hogar', 'Hasta $7.500 dcto en cilindros de gas (vía LipiApp MiCilindro).', 15, 'Wednesday', 'Lipigas', 'both'],
    ['Banco Estado', 'Gastronomía', '40% dcto en compras sobre $12.000 (vía App).', 40, 'Wednesday', 'McDonald\'s', 'both'],
    
    ['Banco Estado', 'Compras', '40% dcto sobre precio normal en zapatillas y ropa deportiva (presencial).', 40, 'Thursday', 'Belsport y Bold', 'both'],
    ['Banco Estado', 'Gastronomía', '40% dcto en el total de la compra (teléfono, App o presencial).', 40, 'Thursday', 'Domino\'s Pizza', 'both'],
    
    ['Banco Estado', 'Hogar', '$100 dcto por litro de combustible (pago con Rutpay).', 10, 'Friday', 'Copec', 'both'],
    ['Banco Estado', 'Salud', 'Hasta 40% dcto en medicamentos seleccionados y dermocosmética (pago con Rutpay).', 40, 'Friday', 'Farmacias Ahumada', 'both'],
    ['Banco Estado', 'Salud', '40% dcto en medicamentos, vitaminas y minerales.', 40, 'Friday', 'Farmacias Maicao', 'both'],
    
    ['Banco Estado', 'Compras', '2x1 en entradas 2D (incluye salas Prime y Xtreme).', 50, 'Saturday', 'Cineplanet', 'both'],
    ['Banco Estado', 'Compras', 'Convenios en compra de equipos o accesorios en tiendas físicas.', 10, 'Saturday', 'Entel', 'both'],
    ['Banco Estado', 'Viajes', 'Hasta 50% dcto en pasajes y 6 a 12 cuotas sin interés.', 50, 'Saturday', 'JetSMART', 'both'],
    
    ['Banco Estado', 'Compras', '2x1 en entradas 2D (incluye salas Prime y Xtreme).', 50, 'Sunday', 'Cineplanet', 'both'],
    ['Banco Estado', 'Compras', 'Convenios en compra de equipos o accesorios en tiendas físicas.', 10, 'Sunday', 'Entel', 'both'],
    ['Banco Estado', 'Viajes', 'Hasta 50% dcto en pasajes y 6 a 12 cuotas sin interés.', 50, 'Sunday', 'JetSMART', 'both'],
    
    // Other Banks
    ['Santander', 'Food', '30% de descuento en PedidosYa', 30, 'Monday', 'PedidosYa', 'both'],
    ['Santander', 'Shopping', '20% de descuento en Puma', 20, 'Wednesday', 'Puma', 'credit'],
    ['Santander', 'Entertainment', '2x1 en CineHoyts', 50, 'Thursday', 'CineHoyts', 'both'],
    ['Itaú', 'Travel', '10% de descuento en Booking.com', 10, 'Everyday', 'Booking.com', 'both'],
    ['Itaú', 'Food', '50% de descuento en Burger King', 50, 'Friday', 'Burger King', 'credit'],
    ['Itaú', 'Shopping', '20% de descuento en H&M', 20, 'Monday', 'H&M', 'both'],
    ['BCI', 'Shopping', '25% de descuento en Puma', 25, 'Saturday', 'Puma', 'credit'],
    ['BCI', 'Food', '30% de descuento en Papa Johns', 30, 'Sunday', 'Papa Johns', 'debit'],
    ['BCI', 'Health', '20% de descuento en Farmacias Ahumada', 20, 'Everyday', 'Farmacias Ahumada', 'both'],
    ['Scotiabank', 'Food', '30% de descuento en McDonald\'s', 30, 'Wednesday', 'McDonald\'s', 'both'],
    ['Scotiabank', 'Shopping', '15% de descuento en Falabella', 15, 'Everyday', 'Falabella', 'credit'],
  ];

  seedBenefits.forEach(b => insertBenefit.run(...b));

async function startServer() {
  // Add some reports for testing (moved inside to ensure table is ready)
  try {
    db.prepare("UPDATE benefits SET reports = 5 WHERE store_name = 'Farmacias Ahumada'").run();
    db.prepare("UPDATE benefits SET reports = 4 WHERE store_name = 'Burger King'").run();
  } catch (e) {
    console.error("Error setting test reports:", e);
  }

  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // API Routes
  app.get("/api/benefits", (req, res) => {
    const benefits = db.prepare("SELECT * FROM benefits").all();
    res.json(benefits);
  });

  app.post("/api/benefits/:id/report", (req, res) => {
    const benefitId = parseInt(req.params.id);
    if (isNaN(benefitId)) {
      return res.status(400).json({ error: "Invalid ID" });
    }
    db.prepare("UPDATE benefits SET reports = reports + 1 WHERE id = ?").run(benefitId);
    res.json({ success: true });
  });

  app.get("/api/user/cards", (req, res) => {
    // For demo purposes, we'll use a fixed user_id = 1
    const cards = db.prepare("SELECT * FROM cards WHERE user_id = 1").all();
    res.json(cards);
  });

  app.put("/api/user/cards/:id", (req, res) => {
    const { bank_name, card_type, card_name } = req.body;
    db.prepare("UPDATE cards SET bank_name = ?, card_type = ?, card_name = ? WHERE id = ? AND user_id = 1")
      .run(bank_name, card_type, card_name, req.params.id);
    res.json({ success: true });
  });

  app.post("/api/user/cards", (req, res) => {
    const { bank_name, card_type, card_name } = req.body;
    const result = db.prepare("INSERT INTO cards (user_id, bank_name, card_type, card_name) VALUES (1, ?, ?, ?)").run(bank_name, card_type, card_name);
    res.json({ id: result.lastInsertRowid });
  });

  app.delete("/api/user/cards/:id", (req, res) => {
    const cardId = parseInt(req.params.id);
    if (isNaN(cardId)) {
      return res.status(400).json({ error: "Invalid ID" });
    }
    db.prepare("DELETE FROM cards WHERE id = ? AND user_id = 1").run(cardId);
    res.json({ success: true });
  });

  app.get("/api/user/reminders", (req, res) => {
    const reminders = db.prepare("SELECT * FROM reminders WHERE user_id = 1").all();
    res.json(reminders);
  });

  app.post("/api/user/reminders", (req, res) => {
    const { item_name, store_name } = req.body;
    const result = db.prepare("INSERT INTO reminders (user_id, item_name, store_name) VALUES (1, ?, ?)").run(item_name, store_name);
    res.json({ id: result.lastInsertRowid });
  });

  app.delete("/api/user/reminders/:id", (req, res) => {
    db.prepare("DELETE FROM reminders WHERE id = ? AND user_id = 1").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/user/profile", (req, res) => {
    let user = db.prepare("SELECT * FROM users WHERE id = 1").get();
    if (!user) {
      db.prepare("INSERT INTO users (id, email, name, main_bank, favorite_categories, profile_color, profile_icon) VALUES (1, 'usuario@ejemplo.com', 'Usuario Demo', 'Banco de Chile', 'Comida,Bencina', '#4F46E5', 'User')").run();
      user = db.prepare("SELECT * FROM users WHERE id = 1").get();
    }
    res.json(user);
  });

  app.put("/api/user/profile", (req, res) => {
    const { name, email, main_bank, favorite_categories, profile_color, profile_icon } = req.body;
    db.prepare("UPDATE users SET name = ?, email = ?, main_bank = ?, favorite_categories = ?, profile_color = ?, profile_icon = ? WHERE id = 1")
      .run(name, email, main_bank, favorite_categories, profile_color, profile_icon);
    res.json({ success: true });
  });

  app.post("/api/user/reset", (req, res) => {
    db.prepare("DELETE FROM cards WHERE user_id = 1").run();
    db.prepare("DELETE FROM reminders WHERE user_id = 1").run();
    db.prepare("UPDATE users SET name = 'Usuario Demo', email = 'usuario@ejemplo.com', main_bank = NULL, favorite_categories = NULL, profile_color = '#4F46E5', profile_icon = 'User' WHERE id = 1").run();
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
