#!/usr/bin/env node
// Packs the bridge built by build.mjs into dist/axe-mcp.mcpb, an MCP Bundle that Claude Desktop installs
// with a double click: the bridge, a manifest saying how to start it and what the reader may set, and the
// app's icon. Claude Desktop brings its own Node, so nothing else need be installed.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { zipSync } from 'fflate';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const bridge = resolve(here, 'dist/axe-mcp.mjs');
const outfile = resolve(here, 'dist/axe-mcp.mcpb');
if (!existsSync(bridge)) throw new Error('Build the bridge first: npm run build -w tools/axe-mcp');
const { version } = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const icon = resolve(root, 'src/assets/icons/icon-512.png');

// The port the Axe tab connects to, as the bridge and the AI link panel take it by default.
const DEFAULT_PORT = 47610;

const manifest = {
  manifest_version: '0.3',
  name: 'udonarium-axe',
  display_name: 'Udonarium Axe',
  version,
  description: 'Lets Claude use a tab of Udonarium Axe: read the room, speak, roll, move pieces and more.',
  author: { name: 'Udonarium Axe', url: 'https://github.com/Xelltis/udonarium_axe' },
  icon: 'icon.png',
  server: {
    type: 'node',
    entry_point: 'server/axe-mcp.mjs',
    mcp_config: {
      command: 'node',
      args: ['${__dirname}/server/axe-mcp.mjs', '--port', '${user_config.port}'],
      env: {
        AXE_MCP_ALLOW_ORIGINS: '${user_config.allow_origins}',
        AXE_MCP_FILES_DIR: '${user_config.files_dir}',
      },
    },
  },
  user_config: {
    port: {
      type: 'number',
      title: 'Port',
      description: 'The port the Axe tab connects to. Leave it as it is unless the AI link panel says otherwise.',
      default: DEFAULT_PORT,
      min: 1024,
      max: 65535,
      required: false,
    },
    allow_origins: {
      type: 'string',
      title: 'Other Axe pages',
      description:
        'The address of an Axe page the bridge does not know already, such as https://example.com. Several are separated by commas. Leave it empty for the official sites.',
      default: '',
      required: false,
    },
    files_dir: {
      type: 'directory',
      title: 'Folder for files',
      description: 'Where the AI saves and loads rooms and files.',
      default: '${DOCUMENTS}',
      required: false,
    },
  },
  compatibility: { platforms: ['darwin', 'win32', 'linux'], runtimes: { node: '>=22.0.0' } },
  tools_generated: true,
  license: 'MIT',
};

const files = {
  'manifest.json': new TextEncoder().encode(JSON.stringify(manifest, null, 2) + '\n'),
  'server/axe-mcp.mjs': readFileSync(bridge),
};
if (existsSync(icon)) files['icon.png'] = readFileSync(icon);
writeFileSync(outfile, zipSync(files, { level: 9 }));
console.log(`Packed ${outfile} (${version})`);
