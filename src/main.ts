import yaml from 'js-yaml';
import csv from 'csv-parser';
import fs from 'fs';
import { getCurrentSpecFromRepository } from './helpers/repositories';
import { AZURE_REPOSITORIES_NAME_EXCEPTIONS } from './helpers/repositories/azure-repositories-name-exceptions';

const IS_DEBUG_MODE = process.env.DEBUG === 'true';

function log(message: string) {
  console.log(message);
  const date = new Date();

  const log = `${date.toISOString()} - ${message}\n`;

  fs.appendFileSync('log.txt', log, 'utf8');
}

const recommendations: any = {}
const namespaces: any = new Set();


fs.createReadStream('recommendations.csv')
  .pipe(csv())
  .on('data', (row) => {

    const namespace = row.Objeto.split('->')[2].split(':')[1]
    namespaces.add(namespace)
    
    const recommendation = {
      object: row.Objeto,
      action: row.Descrição,
      namespace
    };

    if(!recommendations[namespace]){
      recommendations[namespace] = []
    }

    recommendations[namespace].push(recommendation);
  })
  .on('end', (row:any) => {
    if(IS_DEBUG_MODE){
      fs.writeFileSync(`recommendations-${new Date().getTime()}.json`, JSON.stringify(recommendations, null, 2), 'utf8');
    }
    const numNamespaces = namespaces.size;
    log(`Foram encontradas ${recommendations?.length} recomendações para ${numNamespaces} namespaces.`);

    log(`Iniciando execução da aplicação de recomendações.`);
    applyRecommendation(recommendations);
    log(`Finalizando execução da aplicação de recomendações.`);
  })

  async function applyRecommendation(recommendations:any){
    for (const namespaceKey of Object.keys(recommendations)) {
      
      // const base_spec:any = {
      //   containers: {}
      // }

      const repositoryName = AZURE_REPOSITORIES_NAME_EXCEPTIONS?.[namespaceKey] ?? namespaceKey;

      const base_spec: any = await getCurrentSpecFromRepository({
        namespace: repositoryName,
        environment: 'dev'
      })


      if(!base_spec){
        throw new Error('Spec não encontrado para o namespace', namespaceKey)
      }

      recommendations[namespaceKey].forEach((recommendation:any) => {

        if(!recommendation?.object || !recommendation?.action){
          throw new Error('Objeto ou ação não encontrados na recomendação', recommendation)
        }

        const object = recommendation.object;
        const action = recommendation.action;
    
        const [_resource, _cluster, _namespace, _workload, container] = object.split('->');
    
        // const isIncrease = action.includes('Aumentar');
        // const isCPU = action.includes('CPU');
        // const isDecrease = action.includes('Diminuir');
        const isMemory = action.includes('memória');
        const isContainerPatroni = container.includes('patroni');

        let currentValue = null
        let newValue = null
    
        const recommendationValues = recommendation.action.match(/de '[^0-9]*([0-9][^']*)' para '[^0-9]*([0-9]+[^']+)'/);
    
    
        if (recommendationValues && recommendationValues.length === 3) {

          const [_, valorDe, valorPara] = recommendationValues;
          currentValue = valorDe;
          newValue = valorPara;
    
          if(newValue === null || currentValue === null){
            throw new Error('Valor novo não encontrado na recomendação') 
          }

        } else {
          log(`Padrão não encontrado na string: ${action}`);
        }
    
        const resource:any = isMemory ? 'memory' : 'cpu';        

        if(isContainerPatroni) {  
          base_spec.spec[resource] = newValue
        } else {
          const containerKey = container.split(':')[1]
          if(!containerKey) { throw new Error('Container não encontrado na recomendação', recommendation) }

          base_spec.spec.containers[containerKey] = {
            ...base_spec[containerKey],
            [resource]: newValue
          }

        }
      })
      
      if(Object.keys?.(base_spec.spec.containers)?.length === 0){
        delete base_spec.spec.containers
      }

      const result = yaml.dump(base_spec)
  
      const specName = namespaceKey + new Date().getTime() + '.yaml'
      const path = `${specName}`
      
      fs.writeFileSync(path, result, 'utf8');
      log(`Resultado: ${result}`)
    }
  }