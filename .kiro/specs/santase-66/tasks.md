# Implementation Plan: Сантасе 66

## Overview

Имплементацията следва строго разделение на слоевете: първо се поставя основата (зависимости, конфигурация, Expo Router), после чистата игрова логика в `engine/`, след това Zustand store-ът, накрая UI компонентите и екраните. Property-based тестовете с fast-check се добавят непосредствено след съответната логика, за да хващат грешки рано.

## Tasks

- [x] 1. Инсталиране на зависимости и конфигурация на проекта
  - [x] 1.1 Инсталиране на всички допълнителни пакети
    - Изпълни `npx expo install expo-router react-native-reanimated react-native-gesture-handler @react-native-async-storage/async-storage`
    - Изпълни `npm install zustand`
    - Изпълни `npm install --save-dev fast-check`
    - Провери съвместимост с Expo SDK 57 на https://docs.expo.dev/versions/v57.0.0/ преди инсталиране
    - _Requirements: 8.1_

  - [x] 1.2 Конфигуриране на Expo Router и Reanimated
    - Обнови `app.json`: добави `"main": "expo-router/entry"`, `"scheme": "santase"`, `ios.bundleIdentifier`, `android.package`, `ios.deploymentTarget: "16.0"`, `android.minSdkVersion: 29`
    - Добави `react-native-reanimated/plugin` в `babel.config.js` (създай файла ако не съществува)
    - Обнови `index.ts` да използва `expo-router/entry` ако е необходимо
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 1.3 Създаване на директорната структура
    - Създай папките: `src/engine/`, `src/store/`, `src/components/`, `app/`
    - Създай placeholder `index.ts` файлове в `src/engine/` и `src/store/`
    - _Requirements: 8.1_

  - [x] 1.4 Създаване на `eas.json` за EAS Build
    - Създай `eas.json` в корена на проекта с `development`, `preview` и `production` профили
    - `production.ios.bundleIdentifier: "com.santase.classic66"`, `production.android.buildType: "app-bundle"`
    - _Requirements: 8.4_

- [x] 2. Имплементация на `engine/deck.ts` — карти и тесте
  - [x] 2.1 Имплементирай типовете и функциите за тесте
    - Дефинирай `Suit`, `Rank`, `Card` типове и `CARD_POINTS` константа
    - Имплементирай `createDeck()` — 24 уникални карти (6 ранга × 4 цвята)
    - Имплементирай `shuffleDeck()` с Fisher-Yates алгоритъм
    - Имплементирай `getCardPoints(card: Card): number`
    - Имплементирай `dealHands(deck: Card[]): DealResult` — 6 карти за всеки играч, 11 в тестето, 1 козова
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x]* 2.2 Напиши property тест за инварианта на тестето (Property 1)
    - **Property 1: Инвариант на тестето — 24 уникални карти**
    - **Validates: Requirements 1.1**
    - Използвай `fc.assert(fc.property(...))` с fast-check; минимум 100 итерации
    - Провери: след `shuffleDeck(createDeck())` винаги има 24 карти с уникални `id`-та

  - [x]* 2.3 Напиши property тест за сумата от точките (Property 2)
    - **Property 2: Сумата от точките в тестето е 120**
    - **Validates: Requirements 1.2**
    - За произволно разбъркано тесте `sumCardPoints(deck)` трябва да е точно 120

  - [x]* 2.4 Напиши property тест за инварианта на броя карти (Property 3)
    - **Property 3: Инвариант на броя карти в играта**
    - **Validates: Requirements 1.3**
    - След `dealHands()`: `playerHand.length + aiHand.length + stock.length + 1 (trumpCard) == 24`

  - [x]* 2.5 Напиши property тест за козовата карта (Property 4)
    - **Property 4: Козовата карта определя trumpSuit**
    - **Validates: Requirements 1.4**
    - `dealHands(shuffleDeck(createDeck())).trumpCard.suit` винаги съвпада с очаквания `trumpSuit`

- [x] 3. Имплементация на `engine/scoring.ts` — точкуване
  - [x] 3.1 Имплементирай функциите за точкуване
    - Дефинирай `TrickResult` и `HandResult` интерфейси
    - Имплементирай `sumCardPoints(cards: Card[]): number`
    - Имплементирай `hasReached66(score: number): boolean` — `score >= 66`
    - Имплементирай `calculatePartiesAwarded(winnerScore, loserScore, loserTricks): 1 | 2 | 3`
      - loserTricks == 0 → 3 партии; loserScore < 33 → 2 партии; иначе → 1 партия
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x]* 3.2 Напиши property тест за функцията за партии (Property 5)
    - **Property 5: Функцията за партии покрива всички случаи**
    - **Validates: Requirements 4.2, 4.3, 4.4**
    - `fc.integer({ min: 0, max: 65 })` за loserScore, `fc.nat()` за loserTricks
    - Провери и трите клона: 3/2/1 партии

  - [x]* 3.3 Напиши unit тестове за точкуване
    - Точно 66 точки → `hasReached66 == true`; 65 → `false`
    - Двойка от козов цвят = 40 точки; некозов = 20 точки
    - _Requirements: 4.1, 4.2_

- [x] 4. Имплементация на `engine/rules.ts` — правила за ходове
  - [x] 4.1 Имплементирай функциите за валидация на ходове
    - Дефинирай `GameState` интерфейс (пълен, виж Data Models в дизайна)
    - Имплементирай `isValidDefenseMove(attackCard, defenseCard, hand, trumpSuit, isStrictMode): boolean`
      - При строги правила: в цвят → после коз → иначе произволна
    - Имплементирай `getValidDefenseMoves(attackCard, hand, trumpSuit, isStrictMode): Card[]`
    - Имплементирай `canSwapTrumpNine(state: GameState): boolean`
      - Само ако: тестето е отворено, играчът е на атака, има 9 от козовия цвят
    - Имплементирай `canAnnouncePair(card1, card2, state): boolean`
      - Изисква K + Q в един цвят, играч на атака, `handNumber >= 2`, поне 1 взет ход
    - Имплементирай `canCloseStock(state: GameState): boolean`
      - Само ако тестето е отворено и играчът е на атака
    - _Requirements: 2.5, 3.1, 3.2, 3.3, 3.4_

  - [x]* 4.2 Напиши property тест за строгите правила (Property 6)
    - **Property 6: Строгите правила за защита са коректни**
    - **Validates: Requirements 2.5**
    - Генерирай произволни ръце и атакуващи карти с fast-check
    - Всяка карта от `getValidDefenseMoves(..., isStrictMode: true)` трябва да спазва приоритета

  - [x]* 4.3 Напиши unit тестове за правилата
    - Конкретни примери: имаш цвят → задължителен цвят; нямаш цвят, имаш коз → коз; нито цвят нито коз → произволна
    - Затворено тесте → `canSwapTrumpNine == false`
    - Двойка в ръка 1 → `canAnnouncePair == false`
    - _Requirements: 2.5, 3.1, 3.3, 3.4_

- [ ] 5. Checkpoint — Провери engine/ тестовете
  - Ensure all tests pass (`npx jest src/engine --testPathPattern="\.test\.ts"`), ask the user if questions arise.

- [x] 6. Имплементация на `engine/ai.ts` — AI стратегия
  - [x] 6.1 Имплементирай AI функциите
    - Дефинирай `AIDecision` интерфейс
    - Имплементирай `chooseAttackCard(hand, state): Card` с приоритет:
      1. Обяви двойка ако е налично и `handNumber >= 2`
      2. Затвори тестето ако `score >= 50` и `opponentScore < 30`
      3. Играй ниска некозова карта (пази козове и A/10)
    - Имплементирай `chooseDefenseCard(attackCard, hand, state): Card`:
      - При строги правила: следвай `getValidDefenseMoves()`
      - При отворено тесте и `handNumber >= 2`: ако атаката е '10' или 'A' → играй коз ако имаш
      - Иначе: произволна валидна карта
    - Имплементирай `getAIDecision(state: GameState): AIDecision` — координира горните функции
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6, 6.7, 6.8_

  - [-]* 6.2 Напиши property тест за валидност на AI ходовете (Property 8)
    - **Property 8: AI ходовете са винаги валидни**
    - **Validates: Requirements 6.1, 6.2**
    - Генерирай произволни валидни `GameState` обекти с fast-check
    - `getAIDecision(state).card` трябва винаги да е в `aiHand`

  - [-]* 6.3 Напиши property тест за коз срещу силна карта (Property 9)
    - **Property 9: AI играе коз срещу силна карта при отворено тесте**
    - **Validates: Requirements 6.6**
    - При `isStockClosed == false`, `stock.length > 0`, `handNumber >= 2`, атака с '10' или 'A', и наличен коз → `chooseDefenseCard()` връща карта от `trumpSuit`

  - [-]* 6.4 Напиши unit тестове за AI стратегията
    - AI с ≥50 точки и противник с <30 → решение е 'close'
    - AI с K♠ + Q♠ на атака и `handNumber >= 2` → решение е 'announce'
    - _Requirements: 6.3, 6.4_

- [ ] 7. Имплементация на Zustand store (`src/store/gameStore.ts`)
  - [ ] 7.1 Имплементирай началния стейт и инициализиращите действия
    - Дефинирай `GameStore` интерфейс (extends `GameState`)
    - Имплементирай `startNewGame()` — нулира партиите, извиква `startNewHand()`
    - Имплементирай `startNewHand()` — разбърква тесте, раздава карти, задава `trumpSuit`, нулира хода
    - _Requirements: 1.1, 1.3, 1.4, 4.5_

  - [ ] 7.2 Имплементирай действията на играча
    - Имплементирай `playCard(card)`:
      - Валидира фазата (`player-attack` или `player-defense`)
      - При атака: задава `attackCard`, преминава към `player-defense` или `ai-defense`
      - При защита: задава `defenseCard`, преминава към `trick-resolution`
    - Имплементирай `swapTrumpNine()` — проверява `canSwapTrumpNine()`, извършва размяната
    - Имплементирай `announcePair(card1, card2)` — проверява `canAnnouncePair()`, добавя точки
    - Имплементирай `closeStock()` — проверява `canCloseStock()`, задава `isStockClosed: true`
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4_

  - [ ]* 7.3 Напиши property тест за round-trip на размяната (Property 7)
    - **Property 7: Round-trip на размяната на коз-девет**
    - **Validates: Requirements 3.1**
    - При `canSwapTrumpNine() == true`: след `swapTrumpNine()`, 9-ката е `trumpCard`, предишната козова е в ръката

  - [ ] 7.4 Имплементирай вътрешните действия (trick resolution, draw, AI)
    - Имплементирай `_resolveTrick()`:
      - Определя победителя от хода с логиката: коз бие некоз; при един цвят — по-висока стойност печели
      - Обновява `playerTricks`/`aiTricks`, `playerScore`/`aiScore`, `playerTrickCount`/`aiTrickCount`
      - Проверява дали `hasReached66()` → задава `hand-over` ако да
      - Иначе преминава към `draw-phase`
    - Имплементирай `_drawCards()`:
      - Победителят тегли първи; ако тестето е празно — не се тегли
      - Дефансивна проверка за непарен брой карти в тестето
      - Задава следващата фаза (`player-attack` или `ai-attack`)
    - Имплементирай `_resolveAITurn()`:
      - Извиква `getAIDecision(state)`
      - При 'announce': добавя точки, продължава на атака
      - При 'swap': извиква `swapTrumpNine()`
      - При 'close': извиква `closeStock()`
      - При 'play': задава `attackCard` или `defenseCard`, преминава към следваща фаза
      - Ако тестето е изчерпано и ръцете са празни → `_resolveHandEnd()`
    - Имплементирай `_resolveHandEnd()`:
      - Изчислява `calculatePartiesAwarded()`, включително +1 партия при неуспешно затваряне
      - Обновява `playerParties`/`aiParties`
      - Проверява за победа при 7 партии → `game-over`; иначе `hand-over`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 4.1, 4.2, 4.3, 4.4, 4.5, 6.5_

  - [ ]* 7.5 Напиши integration тестове за store-а
    - Сценарий 1: Играч атакува → AI се защитава → ход се разрешава → карти се теглят
    - Сценарий 2: Играч затваря тестето → губи ръката → AI получава +1 партия
    - Сценарий 3: AI обявява двойка → точките се добавят правилно
    - _Requirements: 2.1–2.4, 3.2, 4.2, 4.3_

- [ ] 8. Checkpoint — Провери store тестовете
  - Ensure all tests pass (`npx jest src/ --testPathPattern="\.test\.ts"`), ask the user if questions arise.

- [ ] 9. Имплементация на Expo Router навигация (`app/`)
  - [ ] 9.1 Създай root layout и начален екран
    - Създай `app/_layout.tsx` с `<Stack headerShown={false} />` (Expo Router v5)
    - Създай `app/index.tsx` — начален екран с бутони "Нова игра", "Правила", "Настройки"
      - Бутони с `minHeight: 52`, `paddingHorizontal: 16` за touch targets ≥44pt
      - Навигация: `router.push('/game')`, `router.push('/rules')`, `router.push('/settings')`
    - Замени `App.tsx` / `index.ts` да използва Expo Router entry point
    - _Requirements: 5.1, 8.6_

  - [ ] 9.2 Създай помощните екрани
    - Създай `app/rules.tsx` — статичен ScrollView с правилата на играта на български
    - Създай `app/settings.tsx` — placeholder за настройки (може да е празен екран за MVP)
    - И двата екрана да имат бутон "Назад" с `router.back()`
    - _Requirements: 5.1_

- [ ] 10. Имплементация на UI компоненти (`src/components/`)
  - [ ] 10.1 Имплементирай `Card.tsx`
    - Рендерирай картата като `View` с ранг и цвят като Unicode символи/текст (без изображения)
    - ♥♦ = червено `#C62828`; ♠♣ = тъмно `#212121`; фон бяло
    - `faceDown` → рендерирай гърба на картата (зелено/синьо)
    - `isSelected` → визуална разлика (напр. повдигане нагоре)
    - `minWidth: 60, minHeight: 88` за touch targets ≥44pt
    - Анимация при `onPress` с `useSharedValue`, `useAnimatedStyle`, `withTiming` от Reanimated 4.5
    - _Requirements: 5.4, 7.1, 8.6_

  - [ ] 10.2 Имплементирай `Hand.tsx`
    - Рендерирай масив от `Card` компоненти в ред
    - `isPlayer: false` → всички карти с `faceDown`
    - `validMoves` → осветява само валидните карти (останалите приглушени)
    - `onCardPress` → извиква само ако картата е в `validMoves` (или `validMoves` е undefined)
    - _Requirements: 5.4, 2.5_

  - [ ] 10.3 Имплементирай `Deck.tsx`
    - Показвай `stockCount` (брой останали карти) върху купчината
    - Показвай `trumpCard` с леко изместване под тестето (визуален индикатор)
    - `isClosed: true` → козовата карта се показва с лице надолу
    - _Requirements: 5.4_

  - [ ] 10.4 Имплементирай `ActionBar.tsx`
    - Три бутона: "Затвори", "Размени", "Обяви ▼"
    - Всеки бутон е видим само при `canClose`/`canSwap`/`canAnnounce == true`
    - `minHeight: 48, paddingHorizontal: 16` за touch targets ≥44pt
    - "Обяви ▼" показва dropdown/modal с `announcablePairs` при натискане
    - _Requirements: 5.5, 3.1, 3.2, 8.6_

  - [ ]* 10.5 Напиши snapshot тестове за UI компонентите
    - `Card.tsx`: snapshot на карта с лице нагоре и карта с лице надолу
    - `Hand.tsx`: snapshot с 6 карти за играч и за AI
    - _Requirements: 5.4, 5.5_

- [ ] 11. Имплементация на анимации (Reanimated 4.5)
  - [ ] 11.1 Добави анимация на изиграване на карта в `Card.tsx`
    - `translateX`/`translateY` с `withTiming` (300ms, `Easing.out(Easing.quad)`) към центъра на масата
    - `opacity` fade-out при приключване на анимацията
    - _Requirements: 7.1, 7.4_

  - [ ] 11.2 Добави анимация на теглене от тестето в `Card.tsx` / `Hand.tsx`
    - `scale` от 0.8 + `translateX`/`translateY` от позицията на тестето с `withSpring` (damping: 15, stiffness: 150)
    - _Requirements: 7.2, 7.4_

  - [ ] 11.3 Добави анимация на взимане на ход
    - При `trick-resolution`: взетите карти анимирано се преместват при победителя
    - Използвай `withTiming` за позицията, `withDelay` за последователност
    - _Requirements: 7.3, 7.4_

- [ ] 12. Имплементация на игралния екран (`app/game.tsx`)
  - [ ] 12.1 Имплементирай `GameBoard.tsx`
    - Сглоби всички компоненти: `Hand` (AI, горе), score bar, `Deck` + зона на масата, `ActionBar`, `Hand` (играч, долу)
    - Свържи се с `useGameStore()` за целия стейт
    - Показвай `attackCard` и `defenseCard` в зоната на масата
    - Score bar: "AI: Xpt  Вие: Ypt", партии с `●`/`○` символи
    - Фон на масата: `#1B5E20`
    - _Requirements: 5.4, 5.5_

  - [ ] 12.2 Имплементирай `app/game.tsx`
    - Зарежда `GameBoard`
    - При mount: извиква `startNewGame()` ако `!state.playerParties && !state.aiParties`
    - Обработва AI закъснение: `setTimeout(500–800ms)` преди `_resolveAITurn()`; почиства при unmount
    - Confirmation dialog при натискане на "Назад" (напускане на активна игра)
    - _Requirements: 5.2, 6.5_

  - [ ] 12.3 Имплементирай екрана за край на играта
    - Показва се при `phase == 'game-over'` (modal или отделен екран `app/game-over.tsx`)
    - Показва победителя, финалния резултат (партии)
    - Бутони "Нова игра" (`startNewGame()`) и "Начало" (`router.replace('/')`)
    - _Requirements: 5.3_

- [ ] 13. Персистиране на статистика с AsyncStorage
  - [ ] 13.1 Добави AsyncStorage middleware/логика в `gameStore.ts`
    - При `_resolveHandEnd()`: ако играта е приключила, обнови `@santase/stats`
    - `PersistedStats: { gamesPlayed: number, gamesWon: number }`
    - Зарежда статистиката при `startNewGame()` за евентуален бъдещ display
    - _Requirements: 8.5_

- [ ] 14. Финален checkpoint — Пълна интеграция
  - Ensure all tests pass (`npx jest --runInBand`), ask the user if questions arise.
  - Провери touch targets на всички интерактивни елементи (минимум 44×44pt).
  - Провери офлайн работа — никакви мрежови заявки.

## Notes

- Задачи с `*` са незадължителни и могат да се пропуснат за по-бърз MVP
- Всяка задача реферира конкретни изисквания за проследимост
- Checkpoint-ите осигуряват инкрементална валидация
- Property тестовете с fast-check валидират универсални свойства на коректността
- Unit тестовете валидират конкретни примери и edge cases
- AI закъснението (500–800ms) се имплементира в `game.tsx`, не в engine/store
- Преди инсталиране на пакети: провери съвместимостта с Expo SDK 57 на https://docs.expo.dev/versions/v57.0.0/

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "2.5", "3.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "6.1"] },
    { "id": 5, "tasks": ["6.2", "6.3", "6.4", "7.1"] },
    { "id": 6, "tasks": ["7.2", "7.3"] },
    { "id": 7, "tasks": ["7.4"] },
    { "id": 8, "tasks": ["7.5", "9.1"] },
    { "id": 9, "tasks": ["9.2", "10.1"] },
    { "id": 10, "tasks": ["10.2", "10.3", "10.4"] },
    { "id": 11, "tasks": ["10.5", "11.1"] },
    { "id": 12, "tasks": ["11.2", "11.3"] },
    { "id": 13, "tasks": ["12.1"] },
    { "id": 14, "tasks": ["12.2", "12.3", "13.1"] }
  ]
}
```
