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
