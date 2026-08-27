# IoT Telemetry Lab

Projeto de estudo em **Node.js + TypeScript** criado para praticar mensageria com RabbitMQ e, posteriormente, observabilidade com Grafana, Prometheus, Loki e OpenTelemetry.

## Arquitetura

```text
Device Simulator
       │
       ▼
 Ingestion API
       │
       ▼
 telemetry.events
   Topic Exchange
      /      \
     ▼        ▼
Telemetry   Anomaly
 Worker      Worker
                │
                ▼
           alert.events
                │
                ▼
           Alert Worker
```

Mensagens que não podem ser processadas são encaminhadas para **Dead Letter Queues (DLQ)**.

## Tecnologias

* Node.js
* TypeScript
* Fastify
* Zod
* RabbitMQ
* amqplib
* Docker / Docker Compose

## Conceitos praticados

* Producer e Consumer
* Queues
* Exchanges
* Routing Keys e Bindings
* Topic e Direct Exchange
* ACK / NACK
* Prefetch
* Dead Letter Exchange / DLQ
* Mensagens persistentes
* Processamento assíncrono e orientado a eventos

## Executando

Suba o RabbitMQ:

```bash
docker compose up -d
```

Depois execute os serviços em terminais separados:

```bash
npm run dev:api
npm run dev:worker
npm run dev:anomaly
npm run dev:alerts
npm run dev:simulator
```

RabbitMQ Management:

```text
http://localhost:15672
```

Credenciais locais:

```text
guest / guest
```

## Próximos passos

Adicionar observabilidade com:

* Prometheus
* Grafana
* Loki
* OpenTelemetry
* Tempo
