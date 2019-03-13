#!/usr/bin/env node

const fs = require('fs');
const {docopt} = require('docopt');
const version = require('./package.json').version;


class Cli {
    constructor() {
        let doc, _args
        doc =
`
OrbitDb HTTP API v${version}

Usage:
    cli.js local [--ipfs-conf=IPFS_CONF] [options]
    cli.js api  --ipfs-host=HOST [--ipfs-port=IPFS_PORT] [options]
    cli.js -h | --help | --version

Options:
    --api-port=API_PORT             Listen for api calls on API_PORT
    --orbitdb-dir=ORBITDB_DIR       Store orbit-db files in ORBITDB_DIR
    --orbitdb-conf=ORBITDB_CONF     Load orbit-db conf options from ORBITDB_CONF


`;
        _args = docopt(doc, {
            'version': version
        });
        this.args = () => {
            return _args;
        }
    }
}

let orbitdb_dir, orbitdb_conf, orbitdb_opts, orbitdb_api;

try {
    cli = new Cli()
    args = cli.args()
    orbitdb_dir =  args['--orbitdb-dir'] || process.env.ORBITDB_DIR
    orbitdb_conf = args['--orbitdb-conf'] || process.env.ORBITDB_CONF
    if (orbitdb_conf) {
        fs.readFile(orbitdb_conf, 'utf8', function (err, data) {
            if (err) throw err;
            orbitdb_opts = JSON.parse(data);
        });
    }

    switch(true){
        case args['local']:
            const api_factory_local = require('factory/ipfs-local.js');
            let ipfs_conf, ipfs_opts;
            ipfs_conf = args['--ipfs-conf'] || process.env.IPFS_CONF
            if (ipfs_conf) {
                fs.readFile(ipfs_conf, 'utf8', function (err, data) {
                    if (err) throw err;
                    ipfs_opts = JSON.parse(data);
                });
            }
            orbitdb_api = api_factory_local(ipfs_opts, orbitdb_dir, orbitdb_opts);
            break;

        case args['api']:
            const api_factory_remote = require('factory/ipfs-api.js');
            ipfs_host = args['--ipfs-host'] || process.env.IPFS_HOST;
            if (!ipfs_host) throw new Error ('Missing IPFS_HOST');
            ipfs_port = args['--ipfs-port'] || process.env.IPFS_PORT || 5001;
            orbitdb_api = api_factory_remote(ipfs_host, ipfs_port, orbitdb_dir, orbitdb_opts);
            break;

        default:
            throw new Error('Unrecognised ipfs type');
    }
    api_port = args['--api-port'] || process.env.API_PORT || 3000
    orbitdb_api.listen(api_port)

} catch(err) {
    console.error(err);
    process.exit(1);
}



