import yaml from 'js-yaml';
import csv from 'csv-parser';
import fs from 'fs';

function log(message) {
  console.log(message);
  const date = new Date();

  const log = `${date.toISOString()} - ${message}\n`;

  fs.appendFileSync('log.txt', log, 'utf8');
}

const recommendations = []
const namespaces = new Set();

fs.createReadStream('recommendations.csv')
  .pipe(csv())
  .on('data', (row) => {
    const recommendation = {
      object: row.Objeto,
      action: row.Descrição,
    };
    recommendations.push(recommendation);

    const namespaceMatch = row.Objeto.match(/namespace:([^->]+)/);
    if (namespaceMatch && namespaceMatch[1]) {
      namespaces.add(namespaceMatch[1]);
    }
  })
  .on('end', () => {
    const numNamespaces = namespaces.size;
    console.log(`Foram encontradas ${recommendations.length} recomendações para ${numNamespaces} namespaces.`);

    console.log(recommendations)
  });


// const base_spec = {}

// const recommendations = [{
//   object: "resource:k8s->cluster:totvsapps-vsp-1-dev->namespace:varejo-superm-pricing->workload:varejo-superm-pricing-postgres->container:patroni",
//   action: "Diminuir o/a requisição de memória do container 'patroni' de '2800Mi' para '<=2700Mi'."
// }]

// for (const recommendation of recommendations) {
//   const object = recommendation.object;
//   const action = recommendation.action;

//   const [resource, cluster, namespace, workload, container] = object.split('->');

//   const isIncrease = action.includes('Aumentar');
//   const isDecrease = action.includes('Diminuir');
//   const isMemory = action.includes('memória');
//   const isCPU = action.includes('CPU');
//   let currentValue = null
//   let newValue = null
//   const isContainerPatroni = container.includes('patroni');

//   const matchValues = recommendation.action.match(/de '(\d+[\w]+)' para '<=(\d+[\w]+)'/);

//   if (matchValues && matchValues.length === 3) {
//     const [_, valorDe, valorPara] = matchValues;
//     currentValue = valorDe;
//     newValue = valorPara;
//   } else {
//     log(`Padrão não encontrado na string: ${action}`);
//   }



//   if(isContainerPatroni){

//     const resource = isMemory ? 'memory' : 'cpu';
    
//     base_spec[resource] = newValue

//     if(base_spec[resource] === currentValue){
//       log(`O valor atual ${currentValue} é igual ao recomendado ${newValue}.`)
//     }

//     if(isIncrease && base_spec.resource < currentValue){
//       log(`O valor atual ${currentValue} é menor que o recomendado ${newValue}.`)

//     } else if(isDecrease && base_spec.resource > currentValue){
//       log(`O valor atual ${currentValue} é maior que o recomendado ${newValue}.`)
//     }


//   }

//   const newSpec = {spec: base_spec}

//   const result = yaml.dump(newSpec)

//   const specName = namespace.split(':')[1]+ new Date().getTime() + '.yaml'

//   fs.writeFileSync(specName, result, 'utf8');



//   log(`Resultado: ${result}`)


 
// }