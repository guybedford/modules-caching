import open from 'open';

const nocompilation = process.argv[2] === 'nocompilation';

const args = nocompilation ? ['--js-flags=--no-compilation-cache', '--allow-insecure-localhost'] : ['--allow-insecure-localhost'];

console.log(`Launching Chrome${args.length ? ' (' + args + ')' : ''}...`);

open(`https://localhost:8000/bundle.html?n=1000`, { app: { name: open.apps.chrome, arguments: args } });
open(`https://localhost:8000/separate.html?n=1000`, { app: { name: open.apps.chrome, arguments: args } });
