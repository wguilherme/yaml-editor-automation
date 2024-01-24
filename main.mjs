import yaml from 'js-yaml';
import csv from 'csv-parser';
import fs from 'fs';
import { exec } from 'child_process';

function log(message) {
  console.log(message);
  const date = new Date();

  const log = `${date.toISOString()} - ${message}\n`;

  fs.appendFileSync('log.txt', log, 'utf8');
}

const recommendations = {}
const namespaces = new Set();


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

    // console.log('recommendation', recommendation)

    if(!recommendations[namespace]){
      recommendations[namespace] = []
    }

    recommendations[namespace].push(recommendation);

  
        
  })
  .on('end', (row) => {
    fs.writeFileSync(`recommendations-${new Date().getTime()}.json`, JSON.stringify(recommendations, null, 2), 'utf8');
    const numNamespaces = namespaces.size;
    console.log(`Foram encontradas ${recommendations.length} recomendações para ${numNamespaces} namespaces.`);


    // console.log(recommendations)


    log(`Iniciando execução da aplicação de recomendações.`);
    applyRecommendation(recommendations);
    log(`Finalizando execução da aplicação de recomendações.`);
  })



  function applyRecommendation(recommendations){
    Object.keys(recommendations).forEach((namespaceKey) => {
      
      const base_spec = {} // para cada namespace

    
      recommendations[namespaceKey].forEach((recommendation) => {     

      if(!recommendation?.object || !recommendation?.action){
        throw new Error('Objeto ou ação não encontrados na recomendação', recommendation)
      }

      const object = recommendation.object;
      const action = recommendation.action;
  
      const [resource, cluster, namespace, workload, container] = object.split('->');
  
      const isIncrease = action.includes('Aumentar');
      const isDecrease = action.includes('Diminuir');
      const isMemory = action.includes('memória');
      const isCPU = action.includes('CPU');
      const isContainerPatroni = container.includes('patroni');

      console.log('isCPU', isCPU, recommendation)

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
  
      if(isContainerPatroni) {  
        const resource = isMemory ? 'memory' : 'cpu';        
        base_spec[resource] = newValue      }
      })

      const newSpec = {spec: base_spec}

      const result = yaml.dump(newSpec)
  
      const specName = namespaceKey + new Date().getTime() + '.yaml'
      const path = `${specName}`
      
      fs.writeFileSync(path, result, 'utf8');
      log(`Resultado: ${result}`)
    })
  }

