# GUM Animations

Hub extensível de integração entre o sistema GUM e módulos de animação do Foundry VTT.

O GUM publica eventos semânticos. O GUM Animations encaminha cada evento ao primeiro adaptador visual disponível. Ele não altera rolagens, dano, condições ou efeitos do sistema.

## Requisitos

- Foundry VTT 13 ou 14;
- GUM com API pública `1.2.0` ou mais recente.

O núcleo não exige Sequencer, JB2A ou Automated Animations. Cada adaptador declara e detecta suas próprias dependências. A primeira integração incluída é com Automated Animations, que usa Sequencer e suas bibliotecas de recursos normalmente.

## Automated Animations

Quando Automated Animations está ativo, o adaptador recebe uma rolagem concluída do GUM e chama:

```js
AutomatedAnimations.playAnimation(sourceToken, item, {
  targets,
  hitTargets,
  playOnMiss
});
```

Assim, a configuração visual continua no botão **A-A** do próprio Item. O GUM Animations apenas fornece o Item usado, o token de origem, os alvos e o resultado da rolagem.

Ativações normais de Item não são processadas duas vezes: `itemUse` com gatilho `activate` é ignorado porque a rolagem concluída já representa esse fluxo. Consumos sem rolagem usam o gatilho `consume`.

## API de adaptadores

Disponível após o hook `gumAnimations.ready` e em `game.modules.get("gum-animations").api`:

```js
Hooks.once("gumAnimations.ready", api => {
  api.adapters.register({
    id: "meu-adaptador",
    label: "Meu módulo visual",
    priority: 50,
    isAvailable: () => game.modules.get("meu-modulo")?.active === true,
    canHandle: ({ eventType, context }) => eventType === api.eventTypes.ROLL && Boolean(context.item),
    async handle({ context }) {
      // Reproduzir a animação e retornar false apenas se quiser
      // permitir que o próximo adaptador tente tratar o evento.
      return { handled: true };
    }
  });
});
```

Os adaptadores são avaliados por prioridade. O primeiro que tratar o evento interrompe a cadeia, evitando animações duplicadas.

## API de presets

Módulos externos podem registrar provedores de presets sem fazer parte do núcleo:

```js
api.presets.register({
  id: "comunidade.magias",
  label: "Presets de Magias",
  version: "1.0.0",
  moduleId: "gum-spell-presets",
  describe: () => presetsDisponiveis,
  apply: options => aplicarPresets(options)
});
```

A interface para escolher e atualizar provedores será uma etapa posterior. O contrato já separa o hub dos pacotes de conteúdo e permite que outros módulos forneçam presets.

## Estado da versão 0.3.0

- hub ordenado e extensível de adaptadores;
- adaptador inicial para Automated Animations;
- sucesso e falha encaminhados como `hitTargets` e `playOnMiss`;
- consumo de Item sem duplicar ativações originadas por rolagem;
- registro público de provedores de presets;
- editor de mapeamentos próprio removido em favor da configuração A-A do Item;
- nenhuma dependência visual obrigatória no núcleo.

## Desenvolvimento

Coloque o repositório em `Data/modules/gum-animations`, habilite o módulo no mundo e ative o módulo visual correspondente ao adaptador que deseja usar.
