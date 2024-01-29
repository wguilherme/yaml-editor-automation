import { exec } from 'child_process';

export function getCurrentSpecFromRepository(namespace='techfin-conta-digital'){
  // const comandoBash = `echo ${namespace}`

  const environment = 'dev'
  // const path = `/app/kustomize/postgres_components/overlay/${environment}/postgres-dev.pg-components.yaml`
  const path = '?path=/app/kustomize/postgres_components/overlay/dev/postgres-dev.pg-components.yaml'

  // git@ssh.dev.azure.com:v3/totvstfs/TOTVSApps/techfin-conta-digital
  const url = `git@ssh.dev.azure.com:v3/totvstfs/TOTVSApps/techfin-conta-digital?path=${path}`
    
// Comando curl para buscar o conteúdo da URL
const comandoBash = `curl ${url}`;

exec(comandoBash, (error, stdout, stderr) => {
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

