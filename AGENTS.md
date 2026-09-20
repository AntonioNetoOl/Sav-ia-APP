# Instruções para agentes — Savóia APP

## Antes de trabalhar

Leia o [harness de engenharia](docs/engineering/harness-engenharia.md) e o fluxo afetado. Use [savoia-mobile-change](.agents/skills/savoia-mobile-change/SKILL.md) para mudanças ou revisões no app. Ferramentas são explicadas no [guia de adoção](docs/engineering/adocao-codex.md).

Revisar/diagnosticar não autoriza corrigir. Preserve a identidade visual, componentes e contratos existentes; não amplie tarefas pontuais para redesenho do app.

## Organização existente

A entrada `expo/AppEntry.js` carrega `App.js` e `src/navigation/appNavigator.js`, usando React Navigation. A presença de `expo-router` nas dependências não significa que ele seja o fluxo ativo; não migre a navegação incidentalmente.

Reutilize `src/api/client.js`, `src/api/memberClient.js`, `src/constants/config.js`, `src/components/` e os padrões das telas reais em `src/screens/`. Não duplique cliente HTTP, configuração de URL ou mecanismo de sessão por conveniência.

## Domínio e integração

- Usuário é conta; sócio é vínculo único opcional. Login bem-sucedido não comprova associação ativa.
- Estados visuais: `nao_socio`, `socio_inativo`, `socio_ativo`. `legacy_import` é origem, não rótulo visual.
- Consuma os contratos reais de GET `/api/member/summary`, GET `/api/member/plans` e, quando a tarefa autorizar integração, POST `/api/member/association-request`.
- O POST recebe `planCode`; registra associação/regularização pendente. Não é checkout, cobrança ou ativação.
- Preços e descontos apresentados devem vir do catálogo da API, sem outra tabela de preços no cliente.
- Benefícios gerais são diferentes de brinde de fidelidade. Não prometa estoque, retirada ou pagamento já concluído sem suporte real.
- Carregamento, falha de rede e sessão expirada não são estados associativos. Não converta erro em `nao_socio`.
- Preserve a distinção entre funcionalidades integradas e mocks. Não represente resposta simulada como operação real.

Fonte de contratos e regras: [documentação do backend](https://github.com/AntonioNetoOl/Savoia_API/blob/main/docs/domain/socios-fluxos.md). Se o checkout backend não estiver acessível, peça o contrato necessário antes de inventar payloads ou status.

## Verificação e limites

Consulte `package.json`: há `start`, `android`, `ios`, `web` e `test` (Jest/Expo para a tela Sócio, com HTTP e armazenamento simulados). Consulte o README para o escopo dos testes; ainda não há script de lint. Não invente resultados ou build aprovado. `npm run ios` exige ambiente apropriado; não declare validação iOS a partir de uma inspeção no Windows.

Em mudança de UI, verifique carregamento, vazio, erro, sucesso, envio duplicado, retorno à tela e acessibilidade. Teste em dispositivo/emulador disponível e declare plataformas não verificadas. Para TDD, acorde a interface e a infraestrutura necessária antes de criar testes.

Não faça migração de storage, navegação, linguagem ou SDK em uma integração pontual. Vulnerabilidades fora do escopo devem ser relatadas para uma correção explícita, não perpetuadas em código novo.

## Code Review Rules

- Sinalize ativação otimista do sócio, pagamento fictício ou preços duplicados.
- Sinalize transformação de erro de API em estado de associação e uso indevido de status da conta.
- Verifique confirmação, prevenção de submissões simultâneas e atualização do resumo quando a solicitação fizer parte da tarefa.
- Verifique sessão/autorização, tratamento de falhas e exposição de dados no dispositivo/logs.
- Preserve componentes, navegação e acessibilidade; não introduza dependência para algo já suportado.
