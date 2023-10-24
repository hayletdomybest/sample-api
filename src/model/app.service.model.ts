export interface OHLC {
  open: number;
  high: number;
  low: number;
  close: number;
  timestamp: number;
}

export interface GatewayRequestPayload {
  eventName: string;
  action: string;
}

export interface GatewayResponsePayload {
  eventName: string;
  data: any;
}
