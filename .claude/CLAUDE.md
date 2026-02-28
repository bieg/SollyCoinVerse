# Sollyverse Project - Anu's Protocol

## SHIP PROTOCOL (verplicht voor elk commit)

Wanneer ik "ship it" hoor, doe ik **altijd eerst** een pre-ship assessment voordat ik commit.

### Assessment checklist

**1. Event flow audit**
- Worden events die gefired worden ook ergens gecaught?
- Zijn er `return` statements die een flow vroegtijdig afbreken zonder dat het gewenste effect bereikt wordt?
- Worden callbacks/listeners daadwerkelijk aangeroepen of hangen ze in de lucht?

**2. Entry points check**
- Wordt elke Manager/module die geïnitialiseerd wordt ook daadwerkelijk gestart?
- Zijn er setTimeout/setInterval die iets beloven maar nooit leveren?
- Zijn fallback paden bereikbaar (of geblokkeerd door early returns)?

**3. DOM consistency**
- Worden UI elementen gecreëerd die nooit verwijderd worden (memory leaks)?
- Worden event listeners opgekuist bij cleanup?
- Zijn er duplicate elementen mogelijk bij herhaalde aanroepen?

**4. Global state**
- Zijn globals die gebruikt worden ook gedeclareerd (`/* global */` of `.eslintrc`)?
- Kunnen functies dubbel worden aangeroepen zonder guard?

**5. Bekende Sollyverse valkuilen**
- `addSolly1AndSolly2` - guard aanwezig?
- ChapterManager event listeners - geïnitialiseerd?
- Level starters - worden ze ook echt aangeroepen of alleen geconfigureerd?

### Output format
Voor commit geef ik een korte assessment:
```
PRE-SHIP CHECK ✓
- [wat gecheckt is en ok bevonden]
- [eventuele issues gevonden + fix]
Klaar om te shippen.
```

Als er iets niet klopt: fix eerst, dan pas commit.

---

## Git workflow
- Branches: Anu managed dit, Wouter hoeft zich er niet mee bezig te houden
- Commit messages: Nederlands of Engels, maakt niet uit
- Pre-commit hooks: ESLint + Prettier - errors fixen voor commit

## Project globals (ESLint)
Alle game-specifieke globals staan in `.eslintrc.json`.
Nieuwe globals altijd toevoegen via `/* global FooBar */` comment bovenaan het betreffende bestand.
