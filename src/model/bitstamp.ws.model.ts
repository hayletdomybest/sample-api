export interface BitstampWsResponse<T> {
  data: T;
  channel: string;
  event: string;
}

export interface BitstampWsEventTradeMetadata {
  data: number;
  timestamp: string;
  amount: number;
  amount_str: string;
  price: number;
  price_str: string;
  type: number;
  microtimestamp: string;
  buy_order_id: number;
  sell_order_id: number;
}
