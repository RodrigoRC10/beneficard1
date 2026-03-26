export interface Card {
  id: number;
  user_id: number;
  bank_name: string;
  card_type: 'debit' | 'credit';
  card_name: string;
}

export interface Benefit {
  id: number;
  bank_name: string;
  category: string;
  description: string;
  discount_percentage: number;
  day_of_week: string;
  store_name: string;
  card_type: 'credit' | 'debit' | 'both';
  reports?: number;
}

export interface Reminder {
  id: number;
  user_id: number;
  item_name: string;
  store_name: string;
  status: 'pending' | 'notified';
}
