import { required } from './config';

export interface BotConfig {
  botName: string;
  botId: string;
  clientId: string;
  clientSecret: string;
}

interface BotMeta {
  botName: string;
  botId: string;
  clientIdEnv: string;
  clientSecretEnv: string;
}

const BOT_META: Record<string, BotMeta> = {
  'EPSON-CF-LATIN-AMERICA-DEV': {
    botName: 'Dev Customer Facing Epson Latin America',
    botId: 'st-75d5df8f-acc0-51ef-a26d-05f30594fff8',
    clientIdEnv: 'EPSON_CF_LATIN_AMERICA_DEV_CLIENT_ID',
    clientSecretEnv: 'EPSON_CF_LATIN_AMERICA_DEV_CLIENT_SECRET',
  },
  'EPSON-CF-BRAZIL-DEV': {
    botName: 'Dev Customer Facing Epson Brazil',
    botId: 'st-5c05705e-9234-55ae-9be4-c504b4ebddf1',
    clientIdEnv: 'EPSON_CF_BRAZIL_DEV_CLIENT_ID',
    clientSecretEnv: 'EPSON_CF_BRAZIL_DEV_CLIENT_SECRET',
  },
  'EPSON-CF-NORTH-AMERICA-DEV': {
    botName: 'Dev Customer Facing Epson North America',
    botId: 'st-570cfc15-471c-5c8b-8441-204461361666',
    clientIdEnv: 'EPSON_CF_NORTH_AMERICA_DEV_CLIENT_ID',
    clientSecretEnv: 'EPSON_CF_NORTH_AMERICA_DEV_CLIENT_SECRET',
  },
  'EPSON-AF-NORTH-AMERICA-DEV': {
    botName: 'Dev Agent Facing Epson North America',
    botId: 'st-dfc65d8d-cbd8-5629-b0a5-b7e88106bdf8',
    clientIdEnv: 'EPSON_AF_NORTH_AMERICA_DEV_CLIENT_ID',
    clientSecretEnv: 'EPSON_AF_NORTH_AMERICA_DEV_CLIENT_SECRET',
  },
  'EPSON-CF-NORTH-AMERICA-PROD': {
    botName: 'Prod Customer Facing Epson North America',
    botId: 'st-96756171-2101-507a-876f-ff5d80d2699d',
    clientIdEnv: 'EPSON_CF_NORTH_AMERICA_PROD_CLIENT_ID',
    clientSecretEnv: 'EPSON_CF_NORTH_AMERICA_PROD_CLIENT_SECRET',
  },
  'EPSON-CF-LATIN-AMERICA-PROD': {
    botName: 'Prod Customer Facing Epson Latin America',
    botId: 'st-ef6f29c7-7c8c-5fe9-9333-b25395101b73',
    clientIdEnv: 'EPSON_CF_LATIN_AMERICA_PROD_CLIENT_ID',
    clientSecretEnv: 'EPSON_CF_LATIN_AMERICA_PROD_CLIENT_SECRET',
  },
  'EPSON-CF-BRAZIL-PROD': {
    botName: 'Prod Customer Facing Epson Brazil',
    botId: 'st-24182eba-3753-5d31-a6d0-d4cf0ae5f3f2',
    clientIdEnv: 'EPSON_CF_BRAZIL_PROD_CLIENT_ID',
    clientSecretEnv: 'EPSON_CF_BRAZIL_PROD_CLIENT_SECRET',
  },
  'EPSON-AF-NORTH-AMERICA-PROD': {
    botName: 'Prod Agent Facing Epson North America',
    botId: 'st-410fba9c-ee63-51d5-9d48-034ae701b5be',
    clientIdEnv: 'EPSON_AF_NORTH_AMERICA_PROD_CLIENT_ID',
    clientSecretEnv: 'EPSON_AF_NORTH_AMERICA_PROD_CLIENT_SECRET',
  },
};

export const BOTS: Record<string, BotConfig> = Object.freeze(
  Object.fromEntries(
    Object.entries(BOT_META).map(([code, meta]) => [
      code,
      {
        botName: meta.botName,
        botId: meta.botId,
        clientId: required(meta.clientIdEnv),
        clientSecret: required(meta.clientSecretEnv),
      },
    ]),
  ),
);
