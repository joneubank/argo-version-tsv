const parse = require('csv-parse/lib/sync');
const fs = require('fs');
const commandLineArgs = require('command-line-args');

const argsDefinitions = [{ name: 'filename', alias: 'f', type: String }];
const args = commandLineArgs(argsDefinitions);

const data = fs.readFileSync(args.filename);

const getServices = (records, envs) => {
  const set = new Set();
  records.forEach(record => {
    if (envs.includes(record.Namespace)) {
      set.add(record.ServiceName);
    }
  });
  const output = [];
  for (i of set.values()) output.push(i);
  return output.sort();
};

const getVersions = (records, services, envs) => {
  const versionRecords = [];

  services.forEach(service => {
    const output = {};
    const instances = records.filter(i => i.ServiceName === service);
    // console.log('instance', service, instances);
    instances.forEach(instance => (output[instance.Namespace] = `${instance.Tag}`));
    versionRecords.push([service, ...envs.map(env => output[env])]);
  });

  const headers = ['Service', ...envs];
  return [headers, ...versionRecords];
};

const toTsv = records => {
  const rows = records.map(record => record.join('\t'));
  return rows.join('\n');
};

const records = parse(data, {
  columns: true,
  skip_empty_lines: true,
  delimiter: '\t',
});

const platformEnvs = ['argo-dev', 'argo-qa', 'argo-prod'];
const platformServices = getServices(records, platformEnvs);

const platformVersions = getVersions(records, platformServices, platformEnvs);

const rdpcEnvs = ['rdpc-collab'];
const rdpcServices = getServices(records, rdpcEnvs);
const rdpcVersions = getVersions(records, rdpcServices, rdpcEnvs);

const timestamp = Date.now();
fs.writeFileSync(`platformVersions_${timestamp}.tsv`, toTsv(platformVersions));
fs.writeFileSync(`rdpcVersions_${timestamp}.tsv`, toTsv(rdpcVersions));
