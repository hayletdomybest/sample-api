## Installation

```bash
$ yarn install
```

## Running the app

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Environment
```text
REDIS_PREFIX=localhost
REDIS_HOST=localhost
REDIS_PORT=6379
WS_PORT=3001
```

## Websocket API Documentation

### Connection URL
Connect to the WebSocket server at:
```text
// assume defaul port 3001
ws://localhost:3001/streaming
```

### Subscribe to OHLC data
Request Format
```json
{
    "eventName": "ohlc",
    "action": "subscribe"
}
```
Response Format
```json
{
    "eventName": "ohlc",
    "data": {
        "currency_pair": [
            "OHLC data array here..."
        ]
    }
}
```

Data structure

data contains key-value pairs where the key is the currency pair and the value is an array of OHLC data.

Valid currency pairs include:
```json
[
    'btcusd',
    'btceur',
    'ltcusd',
    'ethusd',
    'xrpusd',
    'usdcusd',
    'algousd',
    'uniusd',
    'zrxusd',
    'linkusd',
  ]
```

The OHLC data structure is as follows:
```json
{
    "open": number,
    "high": number,
    "low": number,
    "close": number,
    "timestamp": number
}
```

### Unsubscribe from OHLC data
Request Format
```json
{
    "eventName": "ohlc",
    "action": "unsubscribe"
}
```

Response Format
```json
{
    "eventName": "ohlc",
    "data": "unsubscribe_success"
}
```

### Reference
For more details and examples, please refer to:
```text
/sample-api/src/example/websocket/main.ts
```