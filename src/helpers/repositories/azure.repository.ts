import { exec } from 'child_process';
import { parse, parseAllDocuments } from 'yaml'

export async function getCurrentSpecFromRepository({
  namespace='techfin-cashflow',
  environment='dev',
}){
  // const comandoBash = `echo ${namespace}`
  // const path = `/app/kustomize/postgres_components/overlay/${environment}/postgres-dev.pg-components.yaml`
  const path = `/app/kustomize/postgres_components/overlay/${environment}/postgres-dev.pg-components.yaml`

  // git@ssh.dev.azure.com:v3/totvstfs/TOTVSApps/techfin-conta-digital
  const url = `git@ssh.dev.azure.com:v3/totvstfs/TOTVSApps/techfin-conta-digital?path=${path}`
    
// Comando curl para buscar o conteúdo da URL
const cleanupRepositories = `cd temp; rm -rf techfin-cashflow; cd ..`
const getRepository = `cd temp; git clone git@ssh.dev.azure.com:v3/totvstfs/TOTVSApps/techfin-cashflow --depth 1 --branch master --single-branch --no-tags; cd ..`

const getFilePath =  Bun.file(`temp/techfin-cashflow/${path}`)

const command = cleanupRepositories + ' && ' + getRepository

const fileText = await getFilePath.text()

const documents = parseAllDocuments(fileText)

documents.find((document, index) => {
  const jsonDocument = document.toJSON()
  if(jsonDocument.apiVersion === 'stackgres.io/v1' && jsonDocument.kind === 'SGInstanceProfile'){
    console.log('AEEEEEEEEE',jsonDocument)
  }
});



exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Erro ao executar o comando: ${error.message}`);
    return;
  }
  // Se houver mensagens de stderr, imprima-as para informação
  if (stderr) {
    console.error(`Aviso do curl: ${stderr}`);
  }
  // Saída do comando curl, que contém o conteúdo do arquivo
  console.log(`Conteúdo retornado pelo curl:\n${stdout}`);
});
  
}


getCurrentSpecFromRepository('postgres-dev')

