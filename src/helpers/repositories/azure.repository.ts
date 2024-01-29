import { exec } from 'child_process';
import { promisify } from 'util';
import { parseAllDocuments } from 'yaml';
import Bun from 'bun'

export async function getCurrentSpecFromRepository({
  namespace='techfin-cashflow',
  environment='dev',
}) {
  const path = `/app/kustomize/postgres_components/overlay/${environment}/postgres-dev.pg-components.yaml`;
  const cleanupRepositories = `cd temp; rm -rf ${namespace} 2>/dev/null; cd ..`;
  const getRepository = `cd temp; git clone git@ssh.dev.azure.com:v3/totvstfs/TOTVSApps/${namespace} --depth 1 --branch master --single-branch --no-tags; cd ..`;
  const getFilePath =  Bun.file(`temp/${namespace}/${path}`);
  const command = `${cleanupRepositories} && ${getRepository}`;

  try {
    const { stdout, stderr } = await promisify(exec)(command);
    if (stderr) {
      console.error(`Aviso do git clone: ${stderr}`);
    }

    const fileText = await getFilePath.text();
    const documents = parseAllDocuments(fileText);

    const result = documents.find((document) => {
      const jsonDocument = document.toJSON();
      return jsonDocument.apiVersion === 'stackgres.io/v1' && jsonDocument.kind === 'SGInstanceProfile';
    });

    return result?.toJSON() || 'error';
  } catch (error: any) {
    console.error(`Erro ao executar o comando: ${error.message}`);
    return 'error';
  }
}

// getCurrentSpecFromRepository({
//   namespace: 'techfin-painel-financeiro',
//   environment: 'dev'
// }).then((result) => {
//   console.log('result', result);
// });
