# Changelog

## [0.3.0] - 2026-11-08

- GUM Animations transformado em hub extensível de adaptadores.
- Primeiro adaptador para a API pública do Automated Animations.
- Configurações A-A permanecem armazenadas no próprio Item.
- Encaminhamento de origem, alvos, acertos e falhas das rolagens do GUM.
- Registro público para adaptadores e provedores externos de presets.
- Prevenção de execução duplicada entre uso de Item e rolagem concluída.
- Remoção do editor próprio de mapeamentos e da dependência direta do Sequencer.

## [0.2.0] - 2026-11-07

- Editor mundial de mapeamentos com regras ordenadas.
- Filtros por evento, resultado, Item, tipo de Item, ação e ataque.
- Posicionamento na origem, alvo ou entre ambos.
- Pré-visualização das animações no mapa.
- Sugestões configuráveis de namespaces do Sequencer, sem dependência obrigatória do JB2A.

## [0.1.0] - 2026-11-05

- Adaptador inicial para a API pública `1.2.0` do GUM.
- Reprodução via Sequencer para rolagens, dano, efeitos, condições, grupos de estado e uso de item.
- Diferenciação entre sucesso, falha e resultados críticos.
- Configuração mundial e substituições por Item.
- API experimental para resolvers externos.
