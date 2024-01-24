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

const recommendations = []
const namespaces = new Set();
const base_spec = {}


fs.createReadStream('recommendations.csv')
  .pipe(csv())
  .on('data', (row) => {
    
    const recommendation = {
      object: row.Objeto,
      action: row.Descrição,
      namespace: row.Objeto.split('->')[2].split(':')[1]
    };

    recommendations.push(recommendation);
        
  })
  .on('end', (row) => {
    const numNamespaces = namespaces.size;
    console.log(`Foram encontradas ${recommendations.length} recomendações para ${numNamespaces} namespaces.`);

    // console.log(recommendations)


    log(`Iniciando execução da aplicação de recomendações.`);

    recommendations.forEach(applyRecommendation);
  })



  function applyRecommendation(recommendation){

    const object = recommendation.object;
    const action = recommendation.action;

    const [resource, cluster, namespace, workload, container] = object.split('->');

    const isIncrease = action.includes('Aumentar');
    const isDecrease = action.includes('Diminuir');
    const isMemory = action.includes('memória');
    const isCPU = action.includes('CPU');
    let currentValue = null
    let newValue = null
    const isContainerPatroni = container.includes('patroni');

    const matchValues = recommendation.action.match(/de '[^0-9]*([0-9][^']*)' para '[^0-9]*([0-9]+[^']+)'/);

    console.log('matchValues', recommendation.action)

    if (matchValues && matchValues.length === 3) {
      const [_, valorDe, valorPara] = matchValues;
      currentValue = valorDe;
      newValue = valorPara;


      console.log('debug1', {
        currentValue,
        newValue,
      })

      if(newValue === null){ throw new Error('Valor novo não encontrado na recomendação') }
    } else {
      log(`Padrão não encontrado na string: ${action}`);
    }

    if(isContainerPatroni) {

      const resource = isMemory ? 'memory' : 'cpu';
      
      base_spec[resource] = newValue

      if(base_spec[resource] === currentValue){
        log(`O valor atual ${currentValue} é igual ao recomendado ${newValue}.`)
      }

      if(isIncrease && base_spec.resource < currentValue){
        log(`O valor atual ${currentValue} é menor que o recomendado ${newValue}.`)

      } else if(isDecrease && base_spec.resource > currentValue){
        log(`O valor atual ${currentValue} é maior que o recomendado ${newValue}.`)
      }
    }

    const newSpec = {spec: base_spec}

    const result = yaml.dump(newSpec)

    const specName = namespace.split(':')[1]+ new Date().getTime() + '.yaml'
    const path = `${specName}`
    
    fs.writeFileSync(path, result, 'utf8');
    log(`Resultado: ${result}`)
  }

