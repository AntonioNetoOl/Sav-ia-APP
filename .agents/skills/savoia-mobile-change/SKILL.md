---
name: savoia-mobile-change
description: Implementar ou revisar telas e integrações do app Savóia em React Native e Expo, reutilizando navegação e clientes HTTP e preservando estados de associação. Usar nos fluxos mobile deste projeto; não para mudanças exclusivas de backend ou instalação de ferramentas.
---

# Mudanças no mobile Savóia

Leia [AGENTS.md](../../../AGENTS.md) e o [harness](../../../docs/engineering/harness-engenharia.md). Esta skill não amplia uma revisão/diagnóstico para implementação.

## Entender o fluxo real

- Confirme a tela, a navegação ativa e a ação solicitada; rastreie `App.js`, o navigator, a tela e o cliente HTTP pertinente.
- Identifique componentes reutilizáveis e quais dados vêm da API, do storage ou de mocks. Não use um arquivo de template apenas por parecer mais moderno.
- Consulte o contrato real no backend quando houver integração. Sem acesso ao contrato necessário, exponha a lacuna; não invente respostas, códigos de erro ou endpoint.

## Implementar no limite aprovado

- Reutilize o cliente Axios, configuração e padrões visuais existentes. Não introduza Expo Router, novo gerenciador de estado ou migração de storage em tarefa pontual.
- Modele explicitamente carregamento, vazio, erro e sucesso, separados do estado associativo. Resposta atrasada não deve sobrescrever indevidamente dados da sessão atual.
- Se o fluxo de associação estiver no escopo: obtenha o plano pela API, confirme a intenção, envie somente os campos contratados, previna submissões simultâneas e trate sucesso/repetição/erro conforme o contrato.
- Após sucesso, atualize o resumo pela API; não promova localmente o usuário a sócio ativo. Falha ao atualizar o resumo após um POST bem-sucedido deve ser distinguida de falha ao enviar a solicitação.
- Não copie preços para constantes da tela nem prometa pagamentos/estoque com base em mocks.
- Preserve acessibilidade, áreas de toque, navegação de retorno e feedback legível em português.

## Testar o comportamento

Acorde a interface observável e os critérios de aceite. Use `tdd` se disponível e pertinente; caso contrário, descreva a verificação possível sem afirmar testes automáticos inexistentes.

Teste, conforme a mudança: sucesso, falha HTTP/rede, sessão expirada, catálogo vazio, confirmação cancelada, toque repetido, retorno à tela e atualização de status. Mocks HTTP em testes são aceitáveis, mas não comprovam integração real ou regras PostgreSQL.

Execute smoke test nas plataformas disponíveis. Declare claramente quando Android/iOS, backend real ou executor de testes não estiverem acessíveis. Não altere contratos do backend para fazer o teste passar.

## Entrega

Revise o diff completo e informe o que é integração real, o que continua mock e o que não foi testado. Atualize apenas a documentação necessária. A skill não faz commit, publicação de build, push, PR ou merge sem autorização da tarefa.
