import { exec } from 'child_process';
import { parseAllDocuments } from 'yaml'

export async function getCurrentSpecFromRepository({
  namespace='techfin-cashflow',
  environment='dev',
}){

  const path = `/app/kustomize/postgres_components/overlay/${environment}/postgres-dev.pg-components.yaml`
  const cleanupRepositories = `cd temp; rm -rf ${namespace}; cd ..`
  const getRepository = `cd temp; git clone git@ssh.dev.azure.com:v3/totvstfs/TOTVSApps/${namespace} --depth 1 --branch master --single-branch --no-tags; cd ..`
  const getFilePath =  Bun.file(`temp/${namespace}/${path}`)

  const command = cleanupRepositories + ' && ' + getRepository

  const fileText = await getFilePath.text()

  const documents = parseAllDocuments(fileText)

  documents.find((document) => {
    const jsonDocument = document.toJSON()
    if(jsonDocument.apiVersion === 'stackgres.io/v1' && jsonDocument.kind === 'SGInstanceProfile'){
      return jsonDocument
    }
  });

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Erro ao executar o comando: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Aviso do curl: ${stderr}`);
    }
    console.log(`Conteúdo retornado pelo curl:\n${stdout}`);
  });  
}

getCurrentSpecFromRepository({
  namespace: 'techfin-cashflow',
  environment: 'dev'
})

