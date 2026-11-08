# GUM Animations

Adaptador experimental de animações para o sistema GUM no Foundry VTT.

O módulo escuta os hooks públicos do GUM e traduz eventos semânticos em sequências visuais. Ele não altera rolagens, dano, condições ou efeitos do sistema.

## Requisitos

- Foundry VTT 13 ou 14;
- GUM com API pública `1.2.0` ou mais recente;
- Sequencer;
- uma biblioteca registrada no Sequencer Database, como JB2A Free ou Patreon.

## Estado da versão 0.2.0

- rolagens, dano, efeitos, condições e uso de Item disponíveis como eventos de mapeamento;
- falhas usam o recurso `missed` do Sequencer quando existe alvo;
- rotas opcionais para dano, estado de efeito, condição, grupo de estado e uso de item;
- caminhos configuráveis nas configurações do módulo;
- configuração por Item e API extensível para futuros presets.
- editor de regras ordenadas por evento, resultado, Item, tipo, ação e ataque;
- pré-visualização no mapa usando o token controlado e o primeiro alvo;
- sugestões de caminhos por namespace, sem limitar o módulo ao JB2A.

As animações genéricas começam desligadas. Regras específicas são criadas no editor, evitando efeitos inesperados ou dependência implícita de uma biblioteca.

Regras explícitas criadas no editor funcionam mesmo quando a animação genérica daquela família está desligada. A primeira regra compatível vence.

## Biblioteca de animações

JB2A não é uma dependência obrigatória. O GUM Animations requer o Sequencer como executor, mas aceita qualquer caminho válido registrado no Sequencer Database e arquivos fornecidos por outras bibliotecas. Os namespaces usados nas sugestões podem ser alterados nas configurações do módulo.

## Configuração por Item

Integrações e macros podem gravar configurações em `flags.gum-animations.animations`:

```js
await item.setFlag("gum-animations", "animations", {
  roll: {
    path: "jb2a.fire_bolt.orange",
    failurePath: "jb2a.fire_bolt.blue",
    scale: 1
  }
});
```

Chaves de evento disponíveis: `roll`, `damage`, `effectState`, `conditionState`, `stateGroup` e `itemUse`.

Para rolagens, também são aceitos `successPath`, `failurePath`, `criticalSuccessPath` e `criticalFailurePath`.

## API experimental

Disponível em `game.modules.get("gum-animations").api`:

```js
const api = game.modules.get("gum-animations").api;

api.registerResolver(({ context, eventType }) => {
  if (eventType === api.eventTypes.ROLL && context.action.attackType === "ranged") {
    return { path: "jb2a.fire_bolt.orange", missed: !context.result.isSuccess };
  }
});
```

Um resolver pode devolver uma configuração, `null` para deixar o próximo resolver decidir ou `false` para suprimir a animação.

## Instalação para desenvolvimento

Coloque o repositório em `Data/modules/gum-animations`, habilite GUM Animations, Sequencer e uma biblioteca de animações no mundo, e recarregue a aplicação.

## Referências conceituais

A arquitetura se inspira na separação adotada por módulos de animação do ecossistema D&D: o sistema publica os eventos, o adaptador resolve a intenção e o Sequencer reproduz os recursos visuais. Nenhum código ou preset desses projetos é redistribuído aqui.
