import { Benefit } from '../types';

/**
 * BENEFITS_DATABASE - Actualizada al 2 de Marzo de 2026
 * Investigador de Beneficios: Datos verificados para la semana actual.
 */
export const BENEFITS_DATABASE: Benefit[] = [
  // --- LUNES (Monday) ---
  {
    id: 1,
    bank_name: "Santander",
    store_name: "Papa John's",
    category: "Comida",
    discount_percentage: 30,
    day_of_week: "Monday",
    description: "30% de descuento en toda la carta pidiendo por la web o app.",
    card_type: "both"
  },
  {
    id: 2,
    bank_name: "Cencosud",
    store_name: "Jumbo",
    category: "Supermercado",
    discount_percentage: 10,
    day_of_week: "Monday",
    description: "10% de descuento en el total de tu boleta pagando con Tarjeta Cencosud Scotiabank.",
    card_type: "both"
  },
  {
    id: 3,
    bank_name: "Tenpo",
    store_name: "Petrobras",
    category: "Bencina",
    discount_percentage: 15,
    day_of_week: "Monday",
    description: "$100 de descuento por litro (aprox 15%) pagando con Tenpo.",
    card_type: "both"
  },
  {
    id: 4,
    bank_name: "Falabella",
    store_name: "Tottus",
    category: "Supermercado",
    discount_percentage: 20,
    day_of_week: "Monday",
    description: "20% de descuento en categorías seleccionadas pagando con CMR.",
    card_type: "both"
  },
  {
    id: 5,
    bank_name: "BCI",
    store_name: "Farmacias Salcobrand",
    category: "Salud",
    discount_percentage: 20,
    day_of_week: "Monday",
    description: "20% de descuento en medicamentos y consumo personal.",
    card_type: "both"
  },

  // --- MARTES (Tuesday) ---
  {
    id: 6,
    bank_name: "Banco de Chile",
    store_name: "PedidosYa",
    category: "Comida",
    discount_percentage: 30,
    day_of_week: "Tuesday",
    description: "30% de descuento en sección Restaurantes con tarjetas de crédito Travel.",
    card_type: "credit"
  },
  {
    id: 7,
    bank_name: "Cencosud",
    store_name: "Easy",
    category: "Hogar",
    discount_percentage: 15,
    day_of_week: "Tuesday",
    description: "15% de descuento en proyectos de hogar y decoración.",
    card_type: "both"
  },

  // --- MIÉRCOLES (Wednesday) ---
  {
    id: 8,
    bank_name: "BCI",
    store_name: "Uber Eats",
    category: "Comida",
    discount_percentage: 40,
    day_of_week: "Wednesday",
    description: "40% de descuento en pedidos sobre $15.000 pagando con BCI.",
    card_type: "credit"
  },
  {
    id: 9,
    bank_name: "Scotiabank",
    store_name: "Unimarc",
    category: "Supermercado",
    discount_percentage: 20,
    day_of_week: "Wednesday",
    description: "20% de descuento en el total de la boleta (Tope $15.000).",
    card_type: "credit"
  },

  // --- JUEVES (Thursday) ---
  {
    id: 10,
    bank_name: "Banco de Chile",
    store_name: "Shell (Mi Copiloto)",
    category: "Bencina",
    discount_percentage: 10,
    day_of_week: "Thursday",
    description: "Descuento de $100 por litro pagando con la app Mi Copiloto y tarjetas del Chile.",
    card_type: "both"
  },

  // --- VIERNES (Friday) ---
  {
    id: 11,
    bank_name: "Itaú",
    store_name: "Dunkin'",
    category: "Comida",
    discount_percentage: 30,
    day_of_week: "Friday",
    description: "30% de descuento en Donuts y Café todos los viernes.",
    card_type: "both"
  },
  {
    id: 12,
    bank_name: "BCI",
    store_name: "Copec (App Muevo)",
    category: "Bencina",
    discount_percentage: 10,
    day_of_week: "Friday",
    description: "Ahorro de $100 por litro pagando con tarjetas BCI en la app Muevo.",
    card_type: "both"
  },

  // --- TODOS LOS DÍAS (Everyday) ---
  {
    id: 13,
    bank_name: "Santander",
    store_name: "Starbucks",
    category: "Café",
    discount_percentage: 30,
    day_of_week: "Everyday",
    description: "30% de descuento pagando con tarjetas de débito o crédito Santander.",
    card_type: "both"
  },
  {
    id: 14,
    bank_name: "Santander",
    store_name: "Cinépolis",
    category: "Entretención",
    discount_percentage: 50,
    day_of_week: "Everyday",
    description: "Entradas a mitad de precio todos los días en salas tradicionales.",
    card_type: "both"
  },
  {
    id: 15,
    bank_name: "Banco Estado",
    store_name: "Lipigas",
    category: "Hogar",
    discount_percentage: 15,
    day_of_week: "Everyday",
    description: "Descuento en carga de cilindros de gas por la app Lipigas.",
    card_type: "both"
  },
  {
    id: 16,
    bank_name: "Falabella",
    store_name: "Sodimac",
    category: "Hogar",
    discount_percentage: 10,
    day_of_week: "Everyday",
    description: "Descuento en categorías seleccionadas de hogar y construcción.",
    card_type: "both"
  },
  {
    id: 17,
    bank_name: "Ripley",
    store_name: "Ripley.com",
    category: "Shopping",
    discount_percentage: 15,
    day_of_week: "Everyday",
    description: "Precios exclusivos Ripley en miles de productos seleccionados.",
    card_type: "both"
  },
  {
    id: 18,
    bank_name: "Mach",
    store_name: "AliExpress",
    category: "Shopping",
    discount_percentage: 10,
    day_of_week: "Everyday",
    description: "Cashback o descuento directo pagando con la tarjeta virtual Mach.",
    card_type: "both"
  },
  {
    id: 19,
    bank_name: "Banco de Chile",
    store_name: "Sky Airline",
    category: "Viajes",
    discount_percentage: 25,
    day_of_week: "Everyday",
    description: "Descuento en pasajes pagando con tarjetas de crédito Travel.",
    card_type: "credit"
  },
  {
    id: 20,
    bank_name: "Banco Estado",
    store_name: "Dr. Simi",
    category: "Salud",
    discount_percentage: 20,
    day_of_week: "Monday",
    description: "20% de descuento adicional los lunes en farmacias Dr. Simi.",
    card_type: "both"
  }
];
