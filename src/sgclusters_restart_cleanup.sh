#!/bin/bash

# Define o arquivo de log
LOG_FILE="script_log_$(date +%Y%m%d_%H%M%S).log"
STATUS="SUCESSO"

# Função para logar mensagens
log() {
    echo "$(date +%Y-%m-%d\ %H:%M:%S) - $1" | tee -a $LOG_FILE
}

echo "Script - Início da execução"

# Verifica se o namespace foi fornecido
if [ $# -eq 0 ]; then
    log "Por favor, forneça um namespace como argumento."
    STATUS="FALHA"
    echo "Status: $STATUS"
    exit 1
fi

# Pega o namespace da linha de comando
NAMESPACE="$1"

log "Iniciando o script no namespace $NAMESPACE"

# Obter os nomes dos SGClusters
echo "Obtendo nomes dos SGClusters"
NOMES_SGCLUSTERS=$(kubectl get sgclusters -n $NAMESPACE -o custom-columns=NAME:.metadata.name --no-headers)

# Iterar sobre os nomes dos SGClusters
for NOME in $NOMES_SGCLUSTERS
do
    NOME_MODIFICADO="${NOME:0:17}-dev"
    YAML_FILE="${NOME_MODIFICADO}.yaml"

#     # Excluir SGDbOps existente
    echo "Excluindo SGDbOps existente: $NOME_MODIFICADO"
    if ! kubectl -n $NAMESPACE delete sgdbops $NOME_MODIFICADO --ignore-not-found=true 2>> $LOG_FILE; then
        log "Falha ao excluir SGDbOps $NOME_MODIFICADO"
        STATUS="FALHA"
        continue
    fi

#     # Criar arquivo YAML
    echo "Criando arquivo $YAML_FILE"
    cat <<EOF > $YAML_FILE
apiVersion: stackgres.io/v1
kind: SGDbOps
metadata:
  name: $NOME_MODIFICADO
  namespace: $NAMESPACE
spec:
  op: restart
  restart:
    method: InPlace
  sgCluster: $NOME
EOF

    # Aplicar a especificação SGDbOps
    echo "Aplicando configurações SGDbOps para $NOME_MODIFICADO"
    if ! kubectl -n $NAMESPACE apply -f $YAML_FILE 2>> $LOG_FILE; then
        log "Falha ao aplicar a configuração para $NOME_MODIFICADO"
        STATUS="FALHA"
        continue
    fi

    # Limpar: Excluir SGDbOps
    echo "Limpando arquivo $YAML_FILE"
    if ! kubectl -n $NAMESPACE delete sgdbops $NOME_MODIFICADO --ignore-not-found=true 2>> $LOG_FILE; then
        log "Falha ao limpar SGDbOps $NOME_MODIFICADO"
        STATUS="FALHA"
    else
        log "SGDbOps $NOME_MODIFICADO limpo com sucesso"
    fi

    # # Remover arquivo YAML (opcional)
    rm $YAML_FILE
done

# # Verificações finais
echo "Verificando as configurações aplicadas nos SGClusters:"
kubectl get sgclusters -n $NAMESPACE -o yaml | grep -C 5 "enableClusterLimitsRequirements"

# # Iterar sobre os nomes dos SGClusters para verificar a classe QoS de cada pod
for NOME in $NOMES_SGCLUSTERS
do
    echo "Verificando a classe QoS do pod $NOME:"
    kubectl describe pod $NOME -n $NAMESPACE | grep "QoS Class"
done

echo "Script - Fim da execução"
echo "Status: $STATUS"