# Brota — um gole, uma folha

Primeira versão de um jogo pessoal de hidratação para iPhone. Registre a água que bebe, cuide de uma planta virtual até o nível 4 e leve-a para seu jardim. Sem login, anúncios, serviços de terceiros ou banco de dados remoto.

Este jogo é uma implementação independente dentro do fork de `steveafrost/plant-nanny`. O projeto Rails original gerencia plantas reais e não corresponde ao aplicativo comercial Plant Nanny. Seu código e sua licença MIT foram preservados. Personagens e cenários do Brota são SVGs originais, desenhados por código; as imagens de referência não são distribuídas.

## O que está implementado

- Uma planta ativa por vez, quatro fases e transferência para o jardim no nível 4.
- Seis espécies iniciais: Trevinho, Flor de sol, Cacto abraço, Limoeiro, Flor da lua e Moranguinho.
- Criação de novas espécies: nome, família, cor das folhas e cor de destaque. Quatro evoluções são geradas automaticamente. Esta versão não importa sprites ou ilustrações externas.
- Nome da planta, quatro vasos, três cenários e quatro opções de decoração.
- Registro de consumo com volume e horário; correção pela exclusão e inclusão de registros.
- Copo de 240 ml, garrafas de 500 ml e 1 L, além de recipientes criados e editados por você.
- Meta manual e perfil opcional. O cálculo por peso usa exclusivamente o fator em ml/kg informado por você conforme sua orientação de saúde. A rotina é uma anotação e não altera a conta. Não há integração com Apple Saúde/HealthKit nem recomendação médica automática.
- Histórico por dia, relatórios de 7 e 30 dias, volume total, média e dias com meta alcançada.
- Exportação/importação JSON de todo o estado; validação antes da importação e cópia de recuperação automática.
- Aplicação instalável, service worker e IndexedDB. Todos os recursos do jogo funcionam sem internet depois do primeiro carregamento completo.

## Experimentar no computador

Requer Node.js 22 ou superior. Não requer Ruby, Rails, PostgreSQL nem instalação de pacotes para executar:

```powershell
cd offline
npm start
```

Abra `http://localhost:4173`. Não abra `dist/index.html` diretamente como arquivo: os módulos e o modo offline precisam de HTTP/HTTPS. A porta pode ser alterada pela variável `PORT`.

## Instalar no iPhone

É necessário disponibilizar **apenas os arquivos estáticos de `dist/` em HTTPS** para a instalação inicial. A hospedagem distribui o aplicativo; ela não recebe o perfil nem os registros. O jogo continua local no aparelho.

1. Abra o endereço HTTPS no Safari do iPhone.
2. Compartilhar → Adicionar à Tela de Início. Ative “Abrir como App da Web”, se essa opção aparecer.
3. Abra pelo ícone adicionado e aguarde o indicador **Pronto para offline**.
4. Ative o modo avião, feche o app e reabra. Confira o registro de água e a reabertura dos dados.

`localhost` no computador não é acessível pelo iPhone. Servir por um IP local em HTTP também não oferece o contexto seguro necessário ao service worker. A instalação e as atualizações precisam de conexão; o uso diário não precisa.

Referência: [instruções da Apple](https://support.apple.com/pt-br/guide/iphone/iphea86e5236/ios).

### GitHub Pages neste fork

O arquivo `.nojekyll` na raiz permite servir o aplicativo sem construir o projeto Rails. Depois de publicar a branch com estes arquivos, configure Settings → Pages → Deploy from a branch → `feature/offline-iphone` → `/ (root)`.

O jogo fica em `https://nalifazarte.github.io/plant-nanny/offline/dist/`. O endereço principal redireciona para essa pasta. Os caminhos de manifesto e cache são relativos e funcionam também em uma subpasta.

Se a branch for incorporada a `master`, troque a fonte do Pages para essa branch. Mantenha o mesmo endereço do aplicativo para preservar o armazenamento do navegador.

## Como o crescimento funciona

| Fase | Crescimento acumulado |
| --- | --- |
| 1 — broto | 0 metas |
| 2 | 2 metas |
| 3 | 5 metas |
| 4 — pronta para o jardim | 9 metas |

Uma fração da meta diária gera a mesma fração de crescimento, somada ao longo dos dias. Exemplo: metade da meta em dois dias soma uma meta de crescimento. A planta não morre e não perde evolução por dias sem registros.

**No máximo uma meta por dia gera crescimento**, compartilhada entre as plantas daquele dia. Registros acima da meta continuam no histórico, sem acelerar a evolução. O jogo não premia beber além da meta. Registre o que já bebeu; não beba extra para progredir.

A meta de um dia é fixada no primeiro registro daquele dia. Alterar a meta vale para dias seguintes e não reescreve o histórico. Horários são armazenados em ISO; cada registro preserva também o dia local em que foi criado, mesmo se houver mudança de fuso.

Registros anteriores à criação da planta entram nos relatórios, sem crescimento retroativo. Corrigir o histórico recalcula o crescimento da planta ativa. As plantas já conquistadas no jardim ficam preservadas como conquistas, mesmo se um registro antigo for removido.

## Backup e recuperação

1. Ajustes → Backup dos meus dados → Exportar backup em JSON.
2. No iPhone, escolha **Salvar em Arquivos** no compartilhamento. Em navegadores sem compartilhamento de arquivos, o app oferece download.
3. Para restaurar, escolha Importar um backup, confira o resumo e confirme a substituição.
4. Para voltar atrás, use **Desfazer a última importação**.

O backup contém plantas, espécies próprias, personalizações, recipientes, perfil, metas históricas e registros. Guarde-o como arquivo pessoal: dados do perfil também estão nele. O limite por arquivo é 10 MB. Formatos incompatíveis e referências inconsistentes são recusados sem alterar os dados existentes.

A substituição e a cópia anterior são gravadas na mesma transação de IndexedDB. As gravações de consumo também usam transações, evitando perda de registros quando duas abas gravam ao mesmo tempo.

O armazenamento local pode ser removido pelo sistema, ao limpar o navegador ou ao remover o app. `navigator.storage.persist()` é solicitado quando disponível, mas não substitui backups. Safari e o app instalado podem ter armazenamentos separados: exporte/import e confira os dados ao migrar entre eles. Não há sincronização automática.

## Testar

```powershell
npm ci
npm test
```

Os testes usam o runner nativo do Node e `fake-indexeddb` como dependência apenas de desenvolvimento. Cobrem evolução, limite diário, transações concorrentes, restauração, validação de backups, calendário, escape de texto e cache offline.

O teste manual deve incluir Safari em um iPhone real: instalação, reabertura em modo avião, registro offline, exportação para Arquivos e importação. Emulação de tamanho de tela em um navegador desktop não comprova esses comportamentos específicos do iOS.

## Arquivos

- `dist/`: aplicativo estático completo, sem dependências de execução.
- `dist/model.js`: regras do jogo, relatórios e validação do backup.
- `dist/storage.js`: persistência e transações.
- `dist/art.js`: personagens, fases e cenários SVG originais.
- `dist/sw.js`: cache da aplicação. Incremente a versão do cache ao alterar arquivos distribuídos.
- `server.mjs`: servidor local limitado a `127.0.0.1`.
- `test/`: testes automatizados.

Uma atualização do service worker aguarda o fechamento das janelas abertas antes de assumir, evitando misturar arquivos de versões diferentes. Atualizações do cache não apagam o IndexedDB.

## Limites desta versão

Não há notificações com o app fechado, integração HealthKit, sincronização, compras, animações complexas nem importação de dados do aplicativo comercial. A personalização e a criação de espécies são gratuitas e locais. Os gráficos refletem somente registros inseridos por você.
