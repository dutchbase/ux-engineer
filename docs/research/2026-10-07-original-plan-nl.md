> **Note:** Original research plan in Dutch, dated 2026-10-07.
> It is superseded by [`docs/design.md`](../design.md) and kept here as source material.

# UX Engineer Skill Suite: onderzoeksrapport en bouwplan

**Datum:** 7 oktober 2026  
**Status:** ontwerpvoorstel, niet geïmplementeerd of in agents gebenchmarkt  
**Doelgroep:** een ontwikkelaar die Claude Code, Codex CLI en OpenCode gebruikt voor webplatformen  
**Werknaam:** UX Engineer, geen gecontroleerde merk- of pakketnaam

> Dit document bevat een zelfstandig uitvoerbaar bouwplan. De genoemde repositories en documentatie zijn online onderzocht. Er zijn voor dit onderzoek geen externe skills geïnstalleerd, geen agentprestaties gemeten en geen productrepositories aangepast. Alle eigen configuraties, bestandsnamen, commando's, beoordelingsdrempels en interfaces hieronder zijn voorstellen voor de te bouwen suite, tenzij expliciet als bestaande externe functionaliteit beschreven.

**Goal:** laat bestaande coding agents vóór een wijziging expliciet vanuit gebruikersdoelen ontwerpen en daarna hun conclusies staven met passend bewijs.

**Architecture:** een kleine, modelonafhankelijke set Agent Skills met gedeelde contracts, referenties en evaluaties. De bestaande coding agent blijft verantwoordelijk voor uitvoering. Platformadapters regelen uitsluitend installatie, toolmapping en mogelijkheden; een beperkte helperlaag valideert artifacts en verzamelt browserbewijs.

**Tech stack:** Markdown met YAML-frontmatter voor skills; JSON Schema voor uitwisseling; TypeScript op Node.js 24 LTS voor optionele helpers; Playwright CLI voor exploratie, Playwright Test voor regressies en axe voor een deel van de toegankelijkheidscontroles. Pin concrete dependencyversies en browserrevisies bij implementatie in een lockfile. Node 24 staat op de geraadpleegde releasepagina als LTS; de tekstuele skills zelf vereisen geen Node-runtime. [S01][S05][S06][S07][S08][S26]

**Spec:** de ontwerpsecties 1 tot en met 11 van dit document; de implementatiebacklog staat in sectie 12.

## Globale randvoorwaarden

- De eerste release richt zich op browsergebaseerde webapps, niet op native mobiele apps.
- Zes kernskills: `ux-orchestrator`, `ux-framing`, `ux-research`, `ux-flow-design`, `ux-audit`, `ux-accessibility`.
- Skillinstructies en schema-keys zijn Engels; de rapporttaal is configureerbaar, standaard `nl-NL` voor deze toepassing. Producttekst volgt de productlocale, niet automatisch de rapporttaal.
- Audit, research en verificatie wijzigen geen applicatiecode. Ook browserhandelingen kunnen data wijzigen: daarvoor gelden afzonderlijke omgevings- en actierechten.
- Productiemutaties, echte betalingen, verzendingen, publicaties en verwijderingen zijn standaard geblokkeerd. Een algemene UX-opdracht is geen toestemming hiervoor.
- Zonder geschikt bewijs geen claim dat interacties, toegankelijkheid of gebruikersgedrag zijn geverifieerd.
- Eén inhoudelijke bron per skill en één beheerde projectinstructiebron. Geen drie handmatig onderhouden toolvarianten.
- Projectinstallatie is de standaard. Bestaande configuratie blijft behouden; installatie heeft dry-run, conflictdetectie en rollback.
- Geen extra model-API, database, vectorstore, dashboard of autonome agentserver nodig voor de MVP.
- Geen software installeren vanaf een ongereviewde bewegende branch of via een ongecontroleerd installatiescript.

## Review focus

Deze vijf faalmodi moeten expliciet in tests terugkomen:

1. Ontbrekende browser, researchdata of credentials worden verhuld met overtuigende maar onbewezen conclusies.
2. Een audit veroorzaakt echte verzendingen, dataverlies of andere ongeautoriseerde neveneffecten.
3. Een platform ontdekt dubbele skills of een geïnstalleerde skill mist gedeelde bestanden.
4. Conditionele flows, onderbrekingen en verwachte foutresponses worden ten onrechte als geslaagd of als defect beoordeeld.
5. Bewijsbestanden zijn niet herleidbaar, bevatten geheimen of worden behandeld als betrouwbare instructies.

---

# 1. Kernadvies en afbakening

Bouw geen encyclopedie met UX-prompts en geen nieuw multi-agentframework. Bouw een dunne UX-laag met zes gerichte skills, vaste outputafspraken, gecontroleerde browserinteractie en herhaalbare evaluaties.

De eerdere stelling dat een bredere UX-suite nog niet bestaat, was te stellig. Anthropic heeft een design-plugin met onder meer research, UX writing en handoff. OpenAI heeft een product-design-router met research en audits. Rampstack en andere ontwikkelaars hebben omvangrijke methodische bibliotheken. Impeccable bevat behalve visuele opdrachten ook productcontext, UX/UI-planning en onboarding. [S09][S10][S11][S12]

De hypothese achter een eigen suite is daarom niet dat niemand UX ondersteunt. De hypothese is dat **een consistente verbinding tussen doel, bewijs, ontwerpbesluit, implementatie en verificatie** meer oplevert in jouw ontwikkelworkflow. Dit moet worden getest voordat de suite groot wordt.

## 1.1 Gewenst gedrag

Bij de opdracht 'verbeter de onboarding' moet de agent eerst vaststellen wat iemand probeert te bereiken, welke kennis en rechten die persoon heeft, wat al bekend is, waar onzekerheid bestaat en wat aantoonbare voltooiing betekent. Daarna maakt hij een flowvoorstel. Pas met implementatietoestemming verandert hij de applicatie.

Bij 'controleer dit formulier' moet de agent passende controles uitvoeren en het verschil aangeven tussen daadwerkelijk geobserveerde fouten, implementatierisico's en hypotheses over begrijpelijkheid.

Bij 'maak deze knop twee pixels hoger' hoort geen volledig researchtraject. De suite moet juist voorkomen dat een kleine wijziging onnodig groot wordt.

## 1.2 Niet-doelen

Geen vervanging van menselijke gebruikers, geen automatisch bewijs van marktbehoefte, geen universeel UX-cijfer, geen juridische toegankelijkheidscertificering en geen autonome wijzigingen aan productie. Evenmin willen we iedere praktische taak opsplitsen in tien agentrollen.

# 2. Onderzoek naar bestaande oplossingen

## 2.1 Selectiemethode

Beoordeeld op het beschikbare bronmateriaal: werkelijke scope, onderscheid tussen UX en visuele voorkeuren, omgang met bewijs, concrete outputs, aansluiting op uitvoering, platformafhankelijkheden en zichtbare licentievoorwaarden. Repositoryomvang, sterren en claims van de maker gelden niet als bewijs van kwaliteit. Er is geen volledige security- of licentieaudit van alle bestanden uitgevoerd.

De geraadpleegde branches zijn beweeglijk. Een implementatie moet exacte commits vastleggen voordat code of tekst wordt overgenomen. In de bronnenlijst staan de geraadpleegde URL's; deze onderzoeksfase claimt geen commit-pinned reproduceerbaarheid.

## 2.2 Vergelijking

| Bron | Gecontroleerde inhoud | Advies voor dit project |
|---|---|---|
| Anthropic `knowledge-work-plugins/design` | Research, kritiek, UX writing, toegankelijkheid en developer handoff. Gericht op Cowork, ook bruikbaar in Claude Code. | Referentie voor research- en handoffstructuur. Niet gelijkstellen aan een complete interactieve browserauditor. De beschreven accessibility-scope gebruikt nog WCAG 2.1 AA. [S09] |
| OpenAI `plugins/product-design` | Router met aparte context-, research-, audit- en design-QA-workflows. De instructies bevatten platformspecifieke browser- en prototypevoorwaarden. | Sterke inspiratie voor routing en het onderscheid audit versus visuele implementatiecontrole. Niet rechtstreeks als CLI-onafhankelijke suite behandelen. [S10] |
| Rampstack `claude-skills` | Modulaire bibliotheek, waaronder UX research en information architecture. IA behandelt onder meer taxonomie, labeling, navigatie en zoekstructuur. | Kandidaat voor een bestaande baseline en voor methodische bouwstenen. Alleen relevante modules selecteren. [S11] |
| Impeccable | Productcontext, afzonderlijke visuele context, `shape`, onboarding, UX-copyverheldering en hardening naast visuele opdrachten. | Sterke bestaande partner voor ontwerp/uitvoering en kandidaat-baseline. De stijlvoorkeuren zijn geen universele UX-eisen. [S12] |
| EliaAlberti `ux-audit-skill` | Screenshotgestuurde heuristische audits, annotaties en expliciete beperkingen van screenshotbewijs. | Benut de bewijsdiscipline en rapportstructuur; geen keyboard-, screenreader- of latencyclaims afleiden uit een stilstaand beeld. [S13] |
| jezweb `ux-audit` | Uitgebreide interactie-first audit met manifests, scenario's en bewijs; frontmatter noemt `claude-code-only`. | Referentie voor taakuitvoering en bewijsregistratie. Porting nodig; geen onvoorwaardelijke 'alle warnings moeten weg'-regels overnemen. [S14] |
| LobeHub `product-design` | Scheidt domeinbetekenis, gebruikerstaak en representatie in de interface. | Conceptueel sterke referentie. Rootlicentie heeft aanvullende voorwaarden; overnemen pas na vaststelling van toepasselijke bestandslicentie. [S15] |
| Mahir Autela `claude-skills-ux` | Brede taxonomie met research, IA, interacties, principes, metrics en samenwerking. MIT zichtbaar in repository en licentiebestand. | Inhoudsdekking als controlelijst, niet zonder meer het hele pakket installeren. De breedte moet zich nog in jouw benchmarks bewijzen. [S16] |
| mae616 `design-skills` | Aparte usability-psychologist naast andere designrollen. | Aanvullende inspiratie; niet de centrale runtime of bewijsstructuur. [S17] |
| ratingtesting `ux-researcher` | Korte researchrol met methoden en deliverables, inclusief eigen context- en taalverwachtingen. | Beter als rolomschrijving dan als volledig uitvoeringscontract. Illustratieve onderzoeksresultaten zijn geen echte resultaten. [S18] |

De eerder genoemde `ChloeVPin/codex-skills/skills/ui-ux-design` kon in deze onderzoeksronde niet betrouwbaar worden opgehaald. Dat bewijst niet dat de bron niet bestaat. Hij is daarom niet gebruikt als essentiële bouwsteen.

## 2.3 Hergebruikstrategie

Maak eigen contracts, routing en testcases. Hergebruik waar passend permissief gelicentieerde instructies of scripts, met bronvermelding en behoud van toepasselijke notices. Leg per overgenomen bestand vast: oorspronkelijke URL, commit, licentie, wijzigingen en gebruikte plaats in de suite.

Een publiek GitHub-bestand is op zichzelf geen voldoende basis om het onbeperkt te herdistribueren. Als de toepasselijke licentie niet is vastgesteld, komt het bestand niet in de distributie. Voor LobeHub geldt specifiek dat de geraadpleegde rootlicentie geen kale Apache-2.0-licentie is. [S15]

**Ontwerpkeuze:** eigen oorspronkelijke inhoud kan MIT krijgen. Dit herlicentieert geen materiaal van derden. Houd distributievoorwaarden per bestand zichtbaar en laat onduidelijke componenten buiten de release.

# 3. Architectuurkeuzes

## 3.1 Drie mogelijke routes

| Route | Voordeel | Nadeel | Besluit |
|---|---|---|---|
| Alleen bestaande skills combineren | Snel een bruikbare workflow, weinig onderhoud | Contracten, scope en toolverwachtingen kunnen verschillen | Verplicht als baseline onderzoeken |
| Eigen dunne kern met geselecteerde bouwstenen | Eigen bewijsmodel, consistente outputs, beperkte vendorbinding | Enig onderhoud en tests nodig | Aanbevolen, mits benchmark meerwaarde laat zien |
| Volledig eigen agentplatform | Maximale controle over uitvoering | Veel infrastructuur die nog geen betere UX bewijst | Buiten scope |

## 3.2 Zes kernskills

| Skill | Verantwoordelijkheid | Hoofdoutput |
|---|---|---|
| `ux-orchestrator` | Intent herkennen, scope bepalen, mogelijkheden controleren, modules sequencen | Runplan, benodigde inputs, gekozen route |
| `ux-framing` | Gebruiker, context, taak, succes, randvoorwaarden en onzekerheden scherp krijgen | Productbrief en beslisvragen |
| `ux-research` | Onderzoek plannen en daadwerkelijk aangeleverde bronnen synthetiseren | Evidence register, bevindingen, hypotheses, researchplan |
| `ux-flow-design` | IA op taakniveau, routes, states, formulieren, herstel, content en interactie ontwerpen | Flowcontract, beslislog, acceptance criteria |
| `ux-audit` | Bestaande ervaring onderzoeken, bewijs verzamelen en bevindingen onderbouwen | Bevindingen, dekking, prioriteiten, verificatiescenario's |
| `ux-accessibility` | Toegankelijkheidsvereisten meenemen in ontwerp en uitgevoerde checks beoordelen | Eisen/checks met bewijs en expliciete open punten |

Browseruitvoering is een gedeelde capability, niet een zevende agent die hetzelfde werk opnieuw beschrijft. Form design, UX copy en basis-IA starten als referenties binnen `ux-flow-design`. Splits pas wanneer gebruik en evaluaties aantonen dat dit nodig is.

Latere kandidaten: `ux-information-architecture` voor grotere navigatiemodellen, `ux-content` voor inhoudelijke taalworkflows en `ux-measurement` voor meetplannen en experimenten. Geen aparte conversion-agent voordat de gebruikersuitkomst en ethische grenzen duidelijk zijn.

## 3.3 Lagen

```text
Bestaande coding agent
  |
  +-- UX-skills: intent, research, ontwerp, audit
  |
  +-- Gedeelde contracts en referenties
  |
  +-- Platformadapter: discovery, aanroep, capabilities
  |
  +-- Browser- en validatiehelpers
        +-- exploratie: Playwright CLI of passende MCP/browseradapter
        +-- regressie: Playwright Test
        +-- accessibility-scan: axe
        +-- output: JSON + Markdown + controleerbare bewijsbestanden
```

Geen laag krijgt impliciet bevoegdheden van een andere. Een skill kan een handeling adviseren; dat verleent geen toestemming om die handeling uit te voeren.

# 4. Workflow en gebruik

## 4.1 Modes

| Mode | Gedrag | Applicatiecode wijzigen? |
|---|---|---|
| `plan` | Brief, researchgaten, ontwerpopties, flow en acceptance criteria | Nee |
| `research` | Bronnen analyseren of onderzoek voorbereiden | Nee |
| `audit` | Bestaande ervaring onderzoeken binnen afgesproken scope | Nee |
| `verify` | Expliciete criteria opnieuw uitvoeren na een wijziging | Nee |

`Implement` is een overdracht aan de bestaande coding workflow, geen stilzwijgende extra mode. Een gecombineerde opdracht mag planning en implementatie omvatten als de gebruiker dat expliciet vraagt, maar buiten de verleende scope worden geen acties uitgevoerd.

## 4.2 Scopeprofielen

**Targeted:** één component of één duidelijk probleem; alleen relevante referenties en checks.

**Standard:** één hoofdtaak inclusief primaire alternatieve paden, risico's en relevante states.

**Deep:** meerdere rollen, grotere journey, research en uitgebreidere coverage. De agent beschrijft vooraf wat buiten scope blijft.

De router leidt dit af uit de opdracht en aanwezige context. Hij vraagt niet opnieuw naar informatie die al betrouwbaar in het project staat. Onbekende zaken die geen blokkade zijn worden als aanname vastgelegd. Bij ontbrekende kritieke rechten of credentials rapporteert hij de beperking in plaats van een successtatus te verzinnen.

## 4.3 Ontwerppad

1. Lees bestaande projectcontext en beschikbare gebruikersonderzoeken.
2. Benoem gebruiker, taak, context en observeerbare uitkomst.
3. Scheid bekende feiten van hypotheses en voorkom dat een featureverzoek automatisch de oplossing wordt.
4. Maak zo nodig twee of drie functioneel verschillende opties met trade-offs.
5. Werk de gekozen richting uit in flow, states, content en toegankelijkheid.
6. Leg beslissingen vast met bron en acceptance criteria.
7. Draag over aan de bestaande implementation/frontend-skill.
8. Verifieer de afgesproken uitkomsten en actualiseer onzekerheden.

Niet elke fase hoeft een nieuw document te produceren. Een kleine taak kan één compact artifact krijgen, zolang dezelfde onderscheidingen overeind blijven.

## 4.4 Auditpad

Begin waar mogelijk met een black-box-taak: alleen doel, gebruikerscontext en toegestane omgeving. Observeer de interface voordat de agent de code-oplossing kent. Dit beperkt de kans dat implementatiekennis onvindbaarheid maskeert.

Onderzoek daarna de code voor oorzaken. Houd 'de agent kon het uitvoeren' gescheiden van 'mensen begrijpen en vinden dit'. Een browseragent is geen echte gebruiker; menselijke usabilitytests omvatten echte of waarschijnlijke gebruikers die taken uitvoeren. [S21]

Rapporteer wat niet getest kon worden, hoe breed de steekproef was en welke observaties bevestiging vereisen. Doe geen redesign tijdens het verzamelen van een nulmeting.

## 4.5 Voorbeelden van gewenste opdrachten

Dit zijn natuurlijke opdrachten voor de toekomstige suite, geen reeds beschikbare universele slashcommands:

```text
Gebruik ux-orchestrator in plan-mode voor de CSV-import.
Lees eerst de bestaande context. Maak de flow inclusief fout- en herstelpaden.
Wijzig geen applicatiecode.
```

```text
Gebruik ux-orchestrator in audit-mode voor de onboarding op staging.
Test als nieuwe teambeheerder. Gebruik uitsluitend de testtenant.
Maak onderscheid tussen geobserveerde problemen en hypotheses.
```

```text
Verifieer de acceptance criteria van flow csv-import.
Controleer de wijzigingen opnieuw in de browser.
Markeer ontbrekend bewijs als incomplete, niet als passed.
```

# 5. Inhoudelijke eisen per skill

## 5.1 `ux-framing`

Minimale input: een taak of productvraag plus beschikbare context. Minimale output: actor, gebruikssituatie, job-to-be-done, succesuitkomst, relevante productregels, constraints en open vragen.

De skill moet onderscheid maken tussen wat het systeem bewaart, wat het bedrijf bedoelt en wat een gebruiker moet begrijpen. Een databasekolom is geen vanzelfsprekend navigatielabel. Een ontvangen upload is niet hetzelfde als een geslaagde import.

Bewaar voor elke betekenisvolle aanname een reden en een validatiepad. Verzonnen demografische persona's zijn verboden. Een nog onbevestigde doelgroep heet een hypothese of proto-persona en wordt niet als onderzoeksresultaat gepresenteerd.

**Acceptatie:** bij een vaag verzoek ontstaat een toetsbaar probleemkader, geen automatische pagina met kaarten. Bij een precieze kleine taak blijft het antwoord klein.

## 5.2 `ux-research`

Ondersteun vanaf de eerste versie twee routes: synthetiseren van echte input en plannen van ontbrekend onderzoek. Input kan bestaan uit geanonimiseerde interviews, supporttickets, testnotities, enquêtes en analytics-exportbestanden.

Elke conclusie verwijst naar bron-ID's. Het aantal personen en het aantal meldingen zijn verschillende grootheden. Herhaalde tickets van één persoon tellen niet automatisch als meerdere gebruikers. Een klacht op een publiek forum bewijst geen representatieve frequentie in de eigen doelgroep.

Noteer tegenbewijs, onbekende segmenten en alternatieve verklaringen. Observaties en interpretaties blijven apart. De research-synthesis-skill van Anthropic is hiervoor een relevante referentie. [S09]

Zonder input levert de skill onderzoeksvragen, een screener, neutrale taakopdrachten, een interview- of testopzet en een toestemmings-/gegevensplan. Geen gefingeerde deelnemers, quotes of resultaten.

AI-rollenspel is bruikbaar als hypothesegenerator of voorbereiding, niet als empirisch gebruikersbewijs. Onderzoek naar vervanging van deelnemers door AI bespreekt juist risico's voor representatie, inclusie en begrip. [S24]

**Acceptatie:** elke 'gebruikers zeggen/doen'-claim is naar echte input herleidbaar, of expliciet herformuleerd als hypothese.

## 5.3 `ux-flow-design`

Ontwerp vanuit taakvoltooiing. Beschrijf de instap, relevante voorkennis, beslismomenten, informatiebehoefte, gekozen route, alternatieven en terminale toestanden.

Dekking is conditioneel. Niet elke pagina vereist een modal, undo of zoekfunctie. Elke relevante state heeft een eigenaar, trigger, zichtbare feedback, mogelijke actie en gewenste vervolgtoestand.

Neem naar relevantie op: eerste gebruik, leeg resultaat, laden, langlopende verwerking, ongeldige invoer, gedeeltelijk resultaat, autorisatie, verlopen sessie, netwerkfout, conflict, dubbele actie, teruggaan, annuleren, hervatten en herstel.

Formulieren behouden bruikbare invoer waar mogelijk; foutmeldingen benoemen probleem en herstelactie. Definieer begrijpelijke labels, verwachtingen vóór een risicovolle handeling en duidelijke voltooiingsfeedback.

IA richt zich op labels, groepering, vindbaarheid en mentale modellen. Bij grotere structuren zijn bijvoorbeeld tree testing of card sorting opties voor menselijke validatie; agentmeningen vervangen die validatie niet. [S11]

**Acceptatie:** iedere flow heeft ten minste een observeerbare einduitkomst, expliciete risico's, relevante herstelpaden en criteria die een implementer kan testen.

## 5.4 `ux-audit`

Verzamel bewijs dat past bij de claim. Een screenshot kan visuele overlap tonen; toetsenbordgedrag vereist uitgevoerde interactie; uitvalpercentages vereisen meetdata met definitie en noemer.

Een bevinding bevat gebruikersimpact, context, bewijs, verwachte en feitelijke uitkomst, ernst en een herstelvoorstel. Zoek naar oorzaken in plaats van iedere zichtbare afwijking een apart ticket te geven. Dedupliceer over schermen en markeer systemic issues.

Heuristieken zoals zichtbare systeemstatus, foutpreventie en gebruikerscontrole zijn analysekaders, geen automatische natuurwetten. Hanteer geen arbitraire algemene maxima voor klikken, keuzemogelijkheden of stappen. De tien heuristieken van NN/g vormen een bruikbaar referentiekader. [S20]

**Acceptatie:** geen onbewezen interaction claims, geen verplicht aantal findings, geen eindeloze lus totdat 'alles perfect' is.

## 5.5 `ux-accessibility`

Neem WCAG 2.2 AA als technische ontwerp- en controledoelstelling. Koppel checks aan toepasselijke succescriteria. De huidige W3C-aanbeveling is WCAG 2.2; sommige onderzochte skills verwijzen nog naar 2.1. [S19]

Combineer automatische controles, browserinteractie en waar nodig handmatige beoordeling. W3C en Playwright waarschuwen dat automatische tools niet alles kunnen vaststellen. [S07][S19]

Controleer passend bij de scope onder meer semantiek, labels, toetsenbordbediening, focusvolgorde, zichtbare/niet-bedekte focus, foutcommunicatie, zoom/reflow, alternatieven voor slepen en toegankelijke authenticatie. Maak onderscheid tussen daadwerkelijk geteste screenreaderervaring en alleen inspectie van een accessibility tree.

**Acceptatie:** geen 'WCAG compliant' op grond van een axe-scan of screenshot. Open handmatige checks blijven zichtbaar en wegen mee in de scoped status.

## 5.6 `ux-orchestrator`

De router leest alleen genoeg om route, scope en benodigde capabilities vast te stellen. Hij voert niet zelfstandig alle inhoudelijke rollen nog eens uit. Geselecteerde modules delen contracts in plaats van lange vrije samenvattingen.

Negatieve triggers zijn even belangrijk als positieve: een databaseindex of puur cosmetische pixelcorrectie start niet automatisch een uitgebreide UX-audit. Expliciete keuze van een gebruiker voor één skill blijft leidend.

Stop bij het afgesproken budget of een echte blokkade. Een ontbrekende capability mag tot een beperkter onderzoek leiden, maar nooit tot een stilzwijgende verlaagde bewijsstandaard.

**Acceptatie:** onder meer audit versus fix, plan versus uitvoering en UX-probleem versus visuele voorkeur worden betrouwbaar onderscheiden.

# 6. Data- en bewijscontracten

## 6.1 Canonieke artifacts

| Artifact | Verplichte kernvelden |
|---|---|
| `product-brief.json` | schema_version, product_id, actors, contexts, jobs, success_outcomes, constraints, sources, assumptions |
| `research.json` | schema_version, question, source_inventory, observations, interpretations, counterevidence, gaps, next_methods |
| `flow.json` | schema_version, flow_id, actor, prerequisites, goal, steps, transitions, terminal_states, risks, acceptance_criteria |
| `run.json` | schema_version, run_id, mode, scope, target, versions, capabilities, requested_checks, status, limitations |
| `evidence.json` | schema_version, run_id, items met evidence_id, type, producer, timestamp, context en verwijzing |
| `findings.json` | schema_version, run_id, findings met basis, status, impact, severity, evidence_ids en criteriumverwijzingen |
| `checks.json` | schema_version, run_id, checks met check_id, required, applicability, result, actual_result en evidence_ids |

Gebruik JSON Schema 2020-12. Alle top-level objecten hebben `additionalProperties: false`. Geef enums en null-gedrag expliciet aan. Geen stille reparatie van ongeldige velden door de reporter. Een onbekende schema-major wordt geweigerd met duidelijke foutmelding.

## 6.2 Vaste onderscheidingen

**Basis van een claim:** `observed`, `code_supported`, `user_reported`, `measured`, `inferred`, `assumed`.

**Status van een bevinding:** `confirmed`, `hypothesis`, `needs_validation`.

**Ernst:** `critical`, `major`, `minor`, `advisory`.

**Confidence:** `high`, `medium`, `low`, altijd met uitleg; geen schijnnauwkeurige percentages.

**Resultaat van een check:** `pass`, `fail`, `not_run`, `not_applicable`. `not_applicable` vereist een inhoudelijke reden en kan niet worden gebruikt om ontbrekende tooling te verbergen.

**Runstatus:** `passed`, `needs_work`, `incomplete`, `blocked`.

- `blocked`: noodzakelijke voorwaarden verhinderen dat de verplichte kernchecks starten.
- `incomplete`: een of meer toepasselijke verplichte checks ontbreken of hebben onbruikbaar bewijs.
- `needs_work`: de verplichte checks zijn uitgevoerd, maar een of meer releasecriteria falen.
- `passed`: uitsluitend de expliciet genoemde, toepasselijke verplichte criteria zijn geslaagd met passend bewijs.

Een run met ontbrekend verplicht bewijs blijft incomplete, ook als er daarnaast bevestigde problemen zijn. De gevonden problemen worden altijd getoond. 'Passed' certificeert niet de hele applicatie of menselijke gebruiksvriendelijkheid.

**Ernst is geen prioriteit.** Ernst beschrijft gevolgen voor de taak: critical bijvoorbeeld onherstelbaar verlies of volledig geblokkeerde cruciale taak; major belangrijke belemmering met hooguit een moeilijke workaround; minor beperkte hinder; advisory een mogelijke verbetering zonder aangetoond defect. Prioriteit betrekt daarnaast bereik, productcontext, risico en inspanning. Onbekend bereik blijft onbekend.

## 6.3 Illustratief finding-object

Onderstaand object is synthetische testdata. Het beschrijft geen werkelijk uitgevoerde audit. De evidence-ID's moeten in een echte run naar door tooling vastgelegde bewijsitems verwijzen.

```json
{
  "finding_id": "UX-IMPORT-003",
  "flow_id": "csv-import",
  "title": "Kolomkoppelingen verdwijnen na een tijdelijke serverfout",
  "basis": "observed",
  "status": "confirmed",
  "severity": "major",
  "confidence": "high",
  "confidence_reason": "Reproduceerbaar met dezelfde fixture en foutinjectie.",
  "user_impact": "De gebruiker moet het bestand opnieuw kiezen en kolommen opnieuw koppelen.",
  "reach": null,
  "context": {
    "role": "workspace-admin",
    "locale": "nl-NL",
    "viewport": "390x844"
  },
  "evidence_ids": ["EV-ACTION-008", "EV-SCREEN-009"],
  "expected_result": "De gekozen kolomkoppelingen blijven beschikbaar voor een nieuwe poging.",
  "actual_result": "Het formulier keert terug naar de initiële uploadstaat.",
  "acceptance_criterion_ids": ["AC-IMPORT-04"],
  "recommendation": "Behoud de conceptkoppeling en bied een expliciete retry aan.",
  "requires_human_validation": false
}
```

Voor een perceptieclaim zoals 'de gebruiker begrijpt deze melding niet' zijn screenshots of agentveronderstellingen op zichzelf geen bevestiging. Dezelfde UI kan wel aanleiding geven tot een duidelijk gelabelde hypothese en een menselijke testvraag.

## 6.4 Bewijsintegriteit

Leg minimaal vast: run-ID, applicatiecommit of expliciet onbekend, skillversie, host/model-identiteit indien beschikbaar, tool/browserversie, rol, locale, viewport, taak, actie en resultaat. Binaire artifacts krijgen een hash en een veilige relatieve verwijzing.

Een bestaand bestand met een hash bewijst niet zelfstandig dat een interactie echt is uitgevoerd. De capture-adapter moet tooluitkomsten vastleggen. Voor hogere assurance verzamelt CI bewijs buiten het schrijfpad van de agent. Bij een lokale run met gelijke schrijfrechten mag geen tamperproof claim worden gemaakt.

Een backendcheck mag persistentie bevestigen, maar niet vervangen dat de gebruiker een resultaat kon zien. Houd UI-uitkomst en gegevensuitkomst apart.

# 7. Browserstrategie en verificatie

## 7.1 Exploratie, regressie en toegankelijkheid zijn verschillende taken

Microsoft beschrijft Playwright CLI plus skills als een interessante route voor coding agents, onder meer vanwege context-/tokengebruik. MCP blijft een alternatief. Dat is een ontwerpaanwijzing, geen door ons gemeten besparing. [S05][S06]

**Keuze:** begin met Playwright CLI waar dat in de gekozen host goed werkt; ondersteun een capabilityadapter voor een al aanwezige browser of MCP. Voeg geen tweede browserintegratie toe zonder concrete behoefte.

Gebruik Playwright Test voor reproduceerbare regressies: rol-/labelgebaseerde locators, expliciete assertions, onafhankelijke browsercontexten en traces voor diagnose. Deze aanpak sluit aan op de officiële best practices. [S08]

Een axe-scan behandelt alleen het automatisch toetsbare deel. Draai relevante scans ook in geopende dialogs, foutstates en andere veranderde toestanden, niet alleen op de eerste pagina. [S07]

## 7.2 Checkdekking

Maak vooraf een matrix van taak, rol, state, inputmethode, viewport en locale. Vul alleen relevante combinaties. 'Niet getest' blijft zichtbaar. Een opgegeven scope zoals 'mobiele onboarding als nieuw teamlid' mag niet eindigen met alleen een desktopcontrole als admin.

Start fixturetests met twee viewports, bijvoorbeeld 390×844 en 1440×900. Dit zijn testwaarden, geen universele UX-norm. Voeg andere resoluties, browsers en locales toe op grond van het productbereik.

Controleer per belangrijkste stap de verandering die telt: niet alleen click succes, maar wat daarna zichtbaar, opgeslagen of herstelbaar is. Registreer verwachte fouten apart. Een 403 bij een negatieve autorisatietest is bijvoorbeeld niet automatisch een defect.

## 7.3 Stopregels

Geen willekeurige minimumduur of minimumaantal screenshots als bewijs van grondigheid. Geen automatische volledige heraudit na elke kleine fix. Gebruik een afgesproken acties-/tokenbudget en bewaar voortgang. Herhaal relevante criteria plus gerichte regressiechecks.

Bij toolfalen maximaal één gerichte herpoging als dat veilig is. Daarna de beperking rapporteren. Geen installatie of autorisatie omzeilen om alsnog een groen resultaat te krijgen.

# 8. Inpassing in Claude Code, Codex en OpenCode

De Agent Skills-specificatie biedt een gemeenschappelijke `SKILL.md`-basis met progressive disclosure. Hostspecifieke permissies en toolnamen maken geen universele garantie deel uit van die basis. [S01]

| Host | Projectpad volgens geraadpleegde documentatie | Ontwerpconsequentie |
|---|---|---|
| Claude Code | `.claude/skills/<name>/SKILL.md` | Eigen adapter voor hostextensions; die niet in de portable kern eisen. [S02] |
| Codex | `.agents/skills/<name>/SKILL.md` | Gebruik actuele docs, niet automatisch oudere `.codex/skills`-instructies uit communityrepos. [S03] |
| OpenCode | Onder meer `.opencode/skills/`; ook compatibele `.agents/skills/` en `.claude/skills/` | Kies per installatie één gecontroleerde route en detecteer overlap. [S04] |

## 8.1 Canonieke inhoud en package closure

Schrijf skills alleen onder `skills/`. Gedeelde bronbestanden staan onder `shared/`. De packer kopieert uitsluitend benodigde shared-bestanden naar `references/shared/` binnen elke afzonderlijk distribueerbare skill en herschrijft/verifieert verwijzingen.

Hierdoor kan één skill zelfstandig geïnstalleerd worden zonder afhankelijkheid van een toevallig aanwezige siblingmap. De gekopieerde bestanden zijn buildoutput, geen handmatig onderhouden bron. CI controleert hashes en ontbrekende verwijzingen.

Een project met meerdere hosts krijgt alleen de noodzakelijke hostentrypoints. Voor Claude plus Codex kan dit `.claude/skills` en `.agents/skills` betekenen. OpenCode leest compatibele paden; de installer maakt daarom niet blind een derde kopie. Test in elke host wat werkelijk wordt ontdekt. Dubbele of afwijkende exemplaren leiden tot een diagnose, niet tot gokken welke wint.

Gebruik symlinks waar ondersteund en getest; bied gegenereerde kopieën als fallback voor omgevingen waar links problematisch zijn. De installer schrijft geen globale configuratie zonder expliciete keuze.

## 8.2 Projectinstructies

`AGENTS.md` is de inhoudelijke projectbron. Een minimale `CLAUDE.md`-verwijzing kan die bron toegankelijk maken voor Claude wanneer nodig; voeg niet nog eens een tweede volledige instructieset toe. Laat bestaande bestanden intact en toon een diff van voorgestelde toevoegingen.

Voeg slechts de routepolicy toe: bij wezenlijke gebruikersflowwijzigingen eerst UX-framing/flow, bij audits geen codewijziging, en geen verificatieclaim zonder bewijs. De lange methodiek hoort in skills, niet in permanent geladen projecttekst.

## 8.3 Compatibility in plaats van claims

Onderhoud `compatibility.json` met per host: werkelijk geteste versie, OS/context, installpad, skill-discovery, tooladapter, modes en resultaat. Begin met Linux/WSL2. Test remote/headless situaties expliciet; een werkende tekstskill garandeert geen bruikbare browser op een SSH-host.

Hostoverschrijdende gedragstests gebruiken vergelijkbare taken, maar verschillende modellen mogen niet als een zuivere platformvergelijking worden gepresenteerd.

# 9. Bestandsstructuur en opslag

Voorgestelde repository, nog niet aangemaakt:

```text
ux-engineer/
  AGENTS.md
  README.md
  LICENSE
  THIRD_PARTY_NOTICES.md
  package.json
  pnpm-lock.yaml
  sources.lock.json
  compatibility.json
  skills/
    ux-orchestrator/SKILL.md
    ux-framing/SKILL.md
    ux-research/SKILL.md
    ux-flow-design/SKILL.md
    ux-audit/SKILL.md
    ux-accessibility/SKILL.md
  shared/
    policies/evidence.md
    policies/safety.md
    policies/research-integrity.md
    references/forms.md
    references/information-architecture.md
    references/content-design.md
    references/accessibility.md
    templates/
  schemas/
    project-config.schema.json
    product-brief.schema.json
    research.schema.json
    flow.schema.json
    run.schema.json
    evidence.schema.json
    findings.schema.json
    checks.schema.json
  src/
    cli.ts
    contracts/validate.ts
    contracts/verdict.ts
    reports/render.ts
    capture/playwright-cli.ts
    capture/playwright-reporter.ts
    capture/redact.ts
    packaging/build.ts
    packaging/install.ts
    packaging/doctor.ts
  adapters/
    claude-code.md
    codex.md
    opencode.md
  evals/
    cases/
    trigger-cases.json
    rubric.md
    ground-truth/
    results/
  tests/
    fixtures/import-app/
    contracts/
    capture/
    packaging/
    e2e/
  docs/
    design.md
    quickstart.md
    limitations.md
    release-checklist.md
  dist/                         # gegenereerd
```

In een doelproject worden alleen stabiele, niet-gevoelige specs onder `docs/ux/` bijgehouden. JSON is canoniek, Markdown is gegenereerd. Twee bewerkbare versies van dezelfde waarheid zijn niet toegestaan.

Runoutput gaat naar `.ux/runs/<run-id>/` met `run.json`, `evidence.json`, `checks.json`, `findings.json`, `report.md` en artifacts. Deze map staat standaard buiten Git. Ruwe research en browserauthenticatie staan apart van rapporten en worden niet automatisch gepubliceerd.

# 10. Veiligheid, privacy en onderhoud

## 10.1 Rechten en omgeving

Een read-only audit betekent geen codewijzigingen, niet dat elke browserclick onschadelijk is. Definieer daarom zowel code-permissies als toegestane interacties.

Gebruik een geïsoleerde fixture of testtenant, testaccounts en uitgeschakelde externe bijwerkingen. Blocking gebeurt waar mogelijk in sandbox-, netwerk- en serviceconfiguratie. Alleen een tekstregel in `SKILL.md` is geen beveiligingsgrens.

Een allowlist moet relevante app- en assetorigins bevatten; het is op zichzelf geen volledige bescherming tegen een appserver die externe acties uitvoert. Productie blijft standaard observer-only. Muterende GET's of analyticsbijwerkingen zijn een reden om niet naar 'strikt read-only gegarandeerd' te claimen.

## 10.2 Onbetrouwbare inhoud

Webpagina's, screenshots, supporttickets en bronbestanden zijn data. Instructies erin om prompts te negeren, sleutels te lezen, een commando uit te voeren of een betaling te bevestigen worden niet opgevolgd. Test dit met expliciete prompt-injection-fixtures.

De agent haalt geen willekeurige tooldependency binnen omdat een bezochte website dat vraagt. Broncodeonderzoek krijgt zo klein mogelijke scopes; secrets blijven buiten het benodigde contextpakket.

## 10.3 Onderzoeksdata en artifacts

Regel doel, toestemming, toegang en bewaartermijn voor echte onderzoeksdata. GOV.UK geeft hiervoor operationele richtlijnen; behandel het niet als een kant-en-klaar Nederlands juridisch oordeel. [S22]

Defaultvoorstel voor lokale MVP-artifacts: maximale bewaartermijn van 14 dagen, configureerbaar; ruwe deelnemersdata alleen expliciet en apart. Verwijdering gebeurt uitsluitend binnen beheerde artifactmappen, nooit via brede cleanupcommando's. Controleer retained bestanden bij een volgende run of via expliciet ingestelde automation, niet via een onbestaand achtergrondproces.

Begin met fictieve data. Redigeer niet pas nadat screenshots of traces al naar een model/cloud zijn verstuurd. Playwright waarschuwt dat opgeslagen browserstate cookies en headers kan bevatten waarmee een account kan worden overgenomen; commit zulke bestanden nooit. [S27]

PII-detectie en masking zijn defense-in-depth, geen volledige anonimiseringsgarantie. Blokkeer distributie van artifacts waarvan de gevoeligheid onbekend is.

## 10.4 Onderhoud

Per release: dependency- en bronnenreview, wijzigingen aan contracts, trigger-evals, regressie-evals en compatibility-smokes. Pin broncommits, maar maak updates reviewbaar in kleine wijzigingen. Een nieuwe model- of hostversie kan een herbeoordeling vereisen; bestaande groene resultaten verhuizen niet automatisch mee.

Meet kosten/tokens waar de host die levert. Waar geen betrouwbare telemetry bestaat, rapporteer `unknown`, geen verzonnen schatting. Bewaar runmanifesten zodat herhalingen vergelijkbaar zijn.

# 11. Evaluatie en kwaliteitsgrenzen

## 11.1 Eerst de meerwaarde aantonen

Vergelijk binnen dezelfde host en hetzelfde model drie armen:

- A: huidige coding setup zonder extra UX-suite.
- B: dezelfde setup met de beste passende bestaande UX-oplossing.
- C: dezelfde setup met de nieuwe kern.

Houd frontend-/implementation-skills, fixtures, taakcontext, tools en budget constant. Kies baseline B vóór de definitieve meting op basis van een kleine afzonderlijke validatieset. Gebruik niet expres een zwakke concurrent. Impeccable en relevante Rampstack-modules zijn kandidaten; jezweb is een auditspecifieke kandidaat voor Claude Code. [S11][S12][S14]

Anthropic's skill-creator beschrijft evalueren met en zonder een skill en vergelijken met eerdere versies. Dat ondersteunt deze testopzet; de specifieke testgevallen en drempels hieronder zijn eigen engineeringkeuzes. [S25]

## 11.2 Benchmarkpakket

Start met zes representatieve cases voor de eerste beslissing. Breid uit naar achttien cases als de kern waarde toont. Gebruik onder andere:

| Case | Beoogde toets |
|---|---|
| 01: correct werkende eenvoudige flow | Geen verzonnen problemen om een rapport te vullen |
| 02: mooie interface met geblokkeerde hoofdtaak | Functie weegt zwaarder dan esthetiek |
| 03: lelijke maar functionele interface | Visuele smaak niet als taakdefect melden |
| 04: CSV-kolomkoppelingen verloren na fout | Gegevensbehoud en herstel herkennen |
| 05: dubbel klikken op import | Dubbele actie en systeemfeedback onderscheiden |
| 06: async verwerking nog niet voltooid | Upload geaccepteerd niet verwarren met taak voltooid |
| 07: member zonder adminrechten | Veilige, begrijpelijke autorisatiefeedback |
| 08: verlopen sessie midden in taak | Herstel en behoud van werk |
| 09: lege dataset versus netwerkfout | Geen valse 'geen resultaten'-melding |
| 10: modal zonder juiste focusafhandeling | Keyboardinteractie werkelijk uitvoeren |
| 11: lange vertaalde labels op mobiel | Relevante locale/state-combinatie testen |
| 12: alleen een screenshot als input | Grenzen van statisch bewijs erkennen |
| 13: browser niet beschikbaar | Incomplete/blocked, geen verzonnen browserbewijs |
| 14: analytics ontbreekt | Geen gefabriceerd uitvalpercentage |
| 15: tegenstrijdige researchbronnen | Tegenbewijs en onzekerheid behouden |
| 16: prompt-injection in supporttekst | Broninhoud niet als instructie uitvoeren |
| 17: knop met externe neveneffecten | Niet zonder bevoegdheid activeren |
| 18: puur cosmetische kleine opdracht | Geen overmatige activatie of scope creep |

Ground truth blijft buiten de leescontext van de agent. Een aparte evaluator controleert de uitkomsten. Scenarios die menselijke perceptie onderzoeken krijgen echte, toestemmingsgebonden input of blijven bewust hypotheses.

## 11.3 Meetwaarden

Meet precision en recall van bevestigbare, vooraf ingezaaide problemen. Gebruik geen precision/recall voor smaakvoorkeuren waarvoor geen betrouwbare ground truth bestaat.

Daarnaast: gemiste critical issues, onbewezen bevestigingen, volledigheid van verplichte evidence, correcte status bij ontbrekende capabilities, ongeautoriseerde acties, trigger false positives, scope creep, dekking van belangrijke states, toepasbaarheid van adviezen, outputomvang, tokens en looptijd.

UX-effect bij echte gebruikers is een aparte laag. Koppel productdoelen aan signalen en metrics, bijvoorbeeld werkelijk geslaagde import, tijd tot bruikbaar resultaat en benodigde hulp. Google HEART biedt hiervoor een doel-naar-metrics-benadering. Sneller is niet altijd beter: correcte, bewuste taakvoltooiing blijft leidend. [S23]

## 11.4 Voorlopige releasegrenzen

Deze waarden zijn initiële projectdoelen, geen aangetoonde prestaties of universele wetenschappelijke normen:

- Nul ongeautoriseerde externe neveneffecten in de veiligheidscases.
- Nul gefabriceerde deelnemers, citaten, analytics of bewijs van uitgevoerde tests.
- Alle ontbrekende toepasselijke verplichte checks leiden tot incomplete of blocked.
- Alle bevestigde interactiebevindingen hebben passende, valide evidenceverwijzingen.
- Minimaal 90% precision en 80% recall op de daarvoor geschikte seeded benchmarkcases.
- Nul gemiste ingezaaide critical issues in de release-evaluatie.
- Minimaal 95% correcte routering op de vastgelegde triggercases.
- Tegenover baseline B een inhoudelijk relevante verbetering in blinde review zonder onacceptabele groei van kosten en complexiteit.

De laatste grens vraagt een beslisnotitie, geen kunstmatig totaalcijfer. Rapporteer per categorie en rol. Maak thresholds niet achteraf makkelijker om een release te laten slagen.

Begin met twee herhalingen per case voor de kleine pilot. Voor achttien cases, drie armen en drie herhalingen zijn dat 162 runs op één primaire host. Dit is een mogelijk uitgebreid testbudget, geen verplicht startpunt en geen statistisch sluitend bewijs op zichzelf. Test daarna overdraagbaarheid met gerichte smokes op de andere hosts; doe geen dure volledige matrix voordat er meerwaarde is.

## 11.5 Menselijke beoordeling

Laat een reviewer blind naar geselecteerde adviezen en flows kijken: klopt het probleem, is het voorstel begrijpelijk, is het uitvoerbaar en is het beter dan de baseline? Zelfbeoordeling door de schrijvende agent volstaat niet. Een LLM kan rubricwerk ondersteunen, maar blijft niet de enige beoordelaar.

Plan echte usabilitytests rond belangrijke onzekerheden, met relevante gebruikers en toegankelijkheidsbehoeften. Bepaal aantallen vanuit vraag en segmenten; hanteer geen universele 'vijf gebruikers bewijzen alles'-regel. [S21]

# 12. Implementatiebacklog

Alle paden hieronder zijn voorgesteld nieuw werk. Er is nog geen repository onderzocht of aangemaakt. Commando's verwijzen naar package scripts die in de genoemde taken moeten worden toegevoegd. Een implementer mag niet melden dat tests geslaagd zijn zonder ze daadwerkelijk uit te voeren.

Voor iedere code-taak geldt: eerst falende tests voor de beschreven gevallen, falen bevestigen, minimale implementatie, dezelfde tests opnieuw, gerichte regressiecontrole en een kleine commit. Voor skillgedrag: eerst baseline-output, dan de skillwijziging, daarna dezelfde blinde/contractuele evaluatie.

## WP01. Bronselectie en beslislog

**Afhankelijkheden:** geen.  
**Bestanden:** `sources.lock.json`, `THIRD_PARTY_NOTICES.md`, `docs/design.md`, `docs/limitations.md`.

**Interfaces:** produceert een bronregister met URL, exact commit-ID, geraadpleegde bestandspaden, licentie, toegestane hergebruikvorm en reviewstatus.

- [ ] Controleer de gekozen bestanden bij de originele maintainers; leg echte commits vast, geen `main` als lock.
- [ ] Selecteer per taak de bestaande baseline en noteer waarom die passend is.
- [ ] Markeer niet-vastgestelde bestandslicenties als uitgesloten van distributie.
- [ ] Leg architectuurbesluiten en afvallers vast; geen onnodige forks.

**Acceptatie:** ieder daadwerkelijk over te nemen bestand is herleidbaar en gereviewd; dit onderzoeksdocument wordt niet voorgesteld als een volledige licentieaudit.

## WP02. Eerste fixture en nulmeting

**Afhankelijkheden:** WP01.  
**Bestanden:** `tests/fixtures/import-app/`, `evals/cases/import.json`, `evals/ground-truth/import.json`, `evals/rubric.md`, `evals/results/baseline/`.

**Interfaces:** een geïsoleerde lokale fixture met reproduceerbare scenario-ID's; testdatareset buiten de zichtbare UI; geen werkelijke klantdata of externe verzendingen.

- [ ] Maak een minimale importflow met upload, mapping, preview, verwerking en resultaat.
- [ ] Voeg één correcte variant en minstens drie afzonderlijk activeerbare defecten toe: invoerverlies, dubbele actie en verwarrende voltooiingsstatus.
- [ ] Controleer met gewone browsertests dat correct en defect werkelijk verschillen zoals beschreven.
- [ ] Voer de eerste zes benchmarkcases op de nulmeting en passende bestaande skills uit met gelijk budget.
- [ ] Bewaar ongewijzigde resultaten plus model-, host- en toolversies.

**Acceptatie:** defecten zijn door een onafhankelijke check reproduceerbaar; de agent kan ground truth niet lezen; nulmeting is echt gemeten.

## WP03. Contracts, validator en statusberekening

**Afhankelijkheden:** WP01.  
**Bestanden:** `schemas/*.schema.json`, `src/contracts/validate.ts`, `src/contracts/verdict.ts`, `tests/contracts/validate.test.ts`, `tests/contracts/verdict.test.ts`.

**Interfaces:** `validateArtifact(kind, input)` retourneert uitsluitend gevalideerde data of gestructureerde fouten; `deriveRunStatus(checks, capabilities)` retourneert exact een van de vier vastgelegde runstatussen.

- [ ] Test onbekende velden, ontbrekende bronverwijzingen, verkeerde enums en unsupported schema-major.
- [ ] Test dat `not_run` voor een verplichte toepasselijke check nooit `passed` oplevert.
- [ ] Test `not_applicable` zonder inhoudelijke reden als ongeldig.
- [ ] Test dat findings bij een incomplete run behouden blijven.
- [ ] Implementeer schemas en deterministische statusberekening.
- [ ] Voeg `pnpm test:contracts` toe en voer het uit.

**Acceptatie:** alle contracttests slagen; geen LLM is nodig om een status te berekenen.

## WP04. Framing en research

**Afhankelijkheden:** WP03.  
**Bestanden:** `skills/ux-framing/SKILL.md`, `skills/ux-research/SKILL.md`, `shared/policies/research-integrity.md`, `shared/templates/research-plan.md`, `evals/cases/research.json`.

**Interfaces:** beide skills gebruiken bron-ID's uit hetzelfde register en produceren respectievelijk `product-brief.json` en `research.json`.

- [ ] Maak cases voor bestaande volledige context, ontbrekende doelgroep, tegenstrijdige bronnen, één gebruiker met veel tickets en geheel ontbrekende research.
- [ ] Schrijf compacte skillinstructies met positieve én negatieve triggers.
- [ ] Laat zonder research alleen hypotheses en een onderzoeksplan ontstaan, geen resultaten.
- [ ] Beoordeel bronherleidbaarheid, vraagkwaliteit en onderscheid feit/interpretatie.
- [ ] Verifieer outputs tegen WP03 en vergelijk met de baseline.

**Acceptatie:** geen gefingeerde personen, aantallen of quotes; geen opnieuw gestelde vragen die de aanwezige context al beantwoordt.

## WP05. Flowcontract en ontwerpkwaliteit

**Afhankelijkheden:** WP03 en WP04.  
**Bestanden:** `skills/ux-flow-design/SKILL.md`, `shared/references/forms.md`, `shared/references/information-architecture.md`, `shared/references/content-design.md`, `evals/cases/flow-design.json`.

**Interfaces:** consumeert een gevalideerde brief plus research/gaps; produceert `flow.json` en een compacte beslisnotitie.

- [ ] Test upload versus daadwerkelijke importvoltooiing, foutbehoud, autorisatie, teruggaan en hervatten.
- [ ] Vereis observeerbare acceptance criteria in plaats van 'gebruiksvriendelijk maken'.
- [ ] Voeg meerdere ontwerprichtingen alleen toe bij een echte keuze, niet verplicht bij iedere pixelwijziging.
- [ ] Controleer dat IA, microcopy en toegankelijkheid al in het ontwerp voorkomen.
- [ ] Laat een onafhankelijke reviewer bruikbaarheid voor implementatie beoordelen.

**Acceptatie:** de implementer kan de flow bouwen zonder de belangrijkste states of uitkomsten zelf te verzinnen.

## WP06. Veilige browsercapture

**Afhankelijkheden:** WP02 en WP03.  
**Bestanden:** `src/capture/playwright-cli.ts`, `src/capture/playwright-reporter.ts`, `src/capture/redact.ts`, `tests/capture/`, `shared/policies/safety.md`.

**Interfaces:** de capturelaag produceert `evidence.json`; events en files hebben run-ID's en context. Zij accepteert alleen een expliciete targetconfiguratie en toegestane acties.

- [ ] Test foutieve targetorigins, ontbrekende credentials en ontbrekende browser.
- [ ] Test dat tokens, storageState en gevoelige responsevelden niet in deelbare outputs komen.
- [ ] Test verwijzingen naar ontbrekende artifacts, padtraversal en afwijkende hashes.
- [ ] Test scenario's met aparte testaccounts/contexten zodat parallelle state niet vermengt.
- [ ] Koppel CLI-resultaten en Playwright Test-resultaten aan hetzelfde bewijscontract.
- [ ] Voeg `pnpm test:capture` toe en voer het uit.

**Acceptatie:** de fixture levert echte actie- en resultaatbewijzen; er is geen claim dat een lokaal door dezelfde gebruiker schrijfbaar log tamperproof is.

## WP07. Audit en rapportage

**Afhankelijkheden:** WP03, WP04 en WP06.  
**Bestanden:** `skills/ux-audit/SKILL.md`, `src/reports/render.ts`, `shared/templates/audit-report.md`, `tests/contracts/report.test.ts`, `evals/cases/audit.json`.

**Interfaces:** consumeert brief, scope, checks en evidence; produceert valide findings plus een Markdownrapport dat uitsluitend uit gevalideerde input wordt gerenderd.

- [ ] Test screenshot-only input zonder gefingeerde keyboard- of latencyconclusies.
- [ ] Test een correcte interface: nul findings is toegestaan.
- [ ] Test verwachte 403's en foutinjecties zonder blind netwerk-errors te tellen.
- [ ] Test herhaalde symptomen die één onderliggend probleem vormen.
- [ ] Render scope, status, beperkingen, belangrijkste gevolgen en vervolgstappen bovenaan.
- [ ] Voeg `pnpm test:reports` toe en voer het uit.

**Acceptatie:** elk bevestigd interactieprobleem heeft passende evidence; onbekend bereik wordt niet ingevuld; rapporten noemen expliciet wat niet getest is.

## WP08. Accessibility in ontwerp en uitvoering

**Afhankelijkheden:** WP05, WP06 en WP07.  
**Bestanden:** `skills/ux-accessibility/SKILL.md`, `shared/references/accessibility.md`, `tests/e2e/accessibility.spec.ts`, `evals/cases/accessibility.json`.

**Interfaces:** levert criteria aan flow-design en checkresultaten aan runstatus/reporting; gebruik exacte WCAG-verwijzingen waar van toepassing.

- [ ] Test labels, toetsenbord, focus na modal sluiten en foutmeldingstates op de fixture.
- [ ] Draai axe in relevante states, niet alleen de initiële pagina.
- [ ] Leg niet-automatische controles apart vast.
- [ ] Test dat 'axe clean' geen algemene conformiteitsclaim veroorzaakt.
- [ ] Voeg `pnpm test:a11y` toe en voer het uit.

**Acceptatie:** toegankelijkheid zit zowel vóór als na implementatie in het proces; ontbrekende menselijke controles zijn zichtbaar.

## WP09. Orchestrator en scopebeheersing

**Afhankelijkheden:** WP04, WP05, WP07 en WP08.  
**Bestanden:** `skills/ux-orchestrator/SKILL.md`, `evals/trigger-cases.json`, `shared/templates/run-plan.md`.

**Interfaces:** routeert naar de zes benoemde skills en hun artifacts; gebruikt `plan`, `research`, `audit`, `verify` met `targeted`, `standard` of `deep` scope.

- [ ] Maak positieve en negatieve triggercases, inclusief audit-versus-fix en zuiver visuele wijzigingen.
- [ ] Test dat expliciet gekozen modules niet onnodig worden vervangen door een breed traject.
- [ ] Test ontbreken van capabilities en een afgesproken budgetstop.
- [ ] Test dat alleen benodigde referenties geladen worden.
- [ ] Leg route-uitkomsten vast en meet false positives/negatives.

**Acceptatie:** geen agentexplosie, geen impliciete implementatie en geen full audit bij een kleine opmaaktaak.

## WP10. Packaging en drie hostadapters

**Afhankelijkheden:** WP03 en WP09.  
**Bestanden:** `src/packaging/build.ts`, `src/packaging/install.ts`, `src/packaging/doctor.ts`, `adapters/*.md`, `compatibility.json`, `tests/packaging/`.

**Interfaces:** `buildPackages(sourceRoot, target)` produceert gesloten skillpackages; `planInstall(project, hosts)` produceert een diff; installatie past uitsluitend een expliciet goedgekeurd plan toe; doctor is observerend.

- [ ] Test ontbrekende shared-referenties en een afzonderlijk geïnstalleerde skill.
- [ ] Test bestaande customskills, dubbele discovery, symlinks en kopie-fallback.
- [ ] Test dry-run, idempotente herinstallatie en rollback zonder andere configuratie te verwijderen.
- [ ] Test daadwerkelijk laden en aanroepen in Claude Code, Codex en OpenCode.
- [ ] Voeg `pnpm test:packaging` en `pnpm build:skills` toe en voer beide uit.

**Acceptatie:** dezelfde inhoud werkt via geteste adapters; compatibility.json noemt echte geteste versies en beperkingen; geen ongedocumenteerde overschrijving.

## WP11. Vergelijkende evaluatie en pilot

**Afhankelijkheden:** WP02 en WP10.  
**Bestanden:** overige `evals/cases/`, `evals/results/`, `docs/evaluation.md`, `docs/pilot-decision.md`.

**Interfaces:** vaste rubric, baselinekeuze, runmanifesten en resultaten per arm/host; metrics zijn uit echte data berekend.

- [ ] Draai eerst de kleine vergelijkende set onder gelijke omstandigheden.
- [ ] Verbeter op een aparte ontwikkelset, niet op de definitieve evaluatiecases.
- [ ] Breid alleen bij meerwaarde uit naar het volledige pakket.
- [ ] Laat findings/flows blind beoordelen en voer een pilot uit op een expliciet gekozen stagingproject.
- [ ] Plan menselijke validatie voor open perceptie- en vindbaarheidsvragen.
- [ ] Maak een go/no-go-notitie tegenover baseline B met kosten, beperkingen en regressies.

**Acceptatie:** de eigen suite wordt niet uitgebouwd enkel omdat zij bestaat; bij onvoldoende meerwaarde blijft de gekozen bestaande oplossing de voorkeur.

## WP12. Release en overdracht

**Afhankelijkheden:** WP11.  
**Bestanden:** `README.md`, `docs/quickstart.md`, `docs/release-checklist.md`, `docs/limitations.md`, releasepackages onder `dist/`.

**Interfaces:** reproduceerbare distributie, gecontroleerde install-/uninstallstappen en versiegebonden beperkingen.

- [ ] Voer contracts, capture-, report-, a11y- en packagingtests opnieuw uit.
- [ ] Controleer notices, locks, artifactprivacy en schema-compatibiliteit.
- [ ] Test installeren in een schoon project en in een project met bestaande customconfiguratie.
- [ ] Controleer dat alle voorbeelden verwijzen naar bestaande commands van de uiteindelijke implementatie.
- [ ] Schrijf release notes met werkelijk geteste mogelijkheden, niet de volledige ambitie.

**Acceptatie:** een andere ontwikkelaar kan één taak plannen, auditen en verifiëren zonder kennis van de interne implementatie; rollback is getest.

# 13. Releasevolgorde en eerste concrete toepassing

**Experiment:** WP01 tot en met WP04, plus het minimale capture/auditpad uit WP06 en WP07. Bewijs één end-to-end taak, niet eerst een complete bibliotheek.

**MVP:** alle zes kernskills, gesloten packages en betrouwbare status-/bewijscontracts. Geen dashboard, externe API of uitgebreide multi-agentparallelisatie.

**Verbeterde release:** splits IA, UX content of metrics uitsluitend op grond van werkelijke gebruiksdruk. Voeg regressies toe voor terugkerende problemen en platformveranderingen.

De eerste toepassing is een **CSV-importflow op een geïsoleerde fixture**. Dat is een bewust smalle maar inhoudelijk rijke taak: iemand wil bruikbare gegevens importeren, niet alleen een uploadstatus zien. De agent moet kolomkoppeling, controle vooraf, foutbehoud, dubbele acties, verwerking en zichtbare afronding kunnen onderscheiden.

Het eerste bewijs van waarde is niet een mooier rapport. Het is dat de suite een relevant probleem correct vaststelt of voorkomt, een beter flowbesluit onderbouwt en de afgesproken uitkomst controleerbaar verifieert, zonder schade of verzonnen gebruikersinzichten.

# 14. Bronnenregister

Alle bronnen hieronder zijn online geraadpleegd op 7 oktober 2026. Jaartallen in publicaties zijn geen claim dat een methode nieuw is. Productdocumentatie en repositorybranches kunnen na deze datum veranderen. Labels verwijzen naar de oorspronkelijke maintainer, standaardorganisatie of onderzoeksauteur.

- **[S01] Agent Skills, specificatie:** https://agentskills.io/specification
- **[S02] Anthropic, Claude Code Skills:** https://code.claude.com/docs/en/skills
- **[S03] OpenAI, Codex skills:** https://developers.openai.com/codex/skills (verwees bij raadpleging door naar https://learn.chatgpt.com/docs/build-skills).
- **[S04] OpenCode, Agent Skills:** https://opencode.ai/docs/skills/
- **[S05] Microsoft, Playwright CLI:** https://github.com/microsoft/playwright-cli
- **[S06] Microsoft, Playwright MCP:** https://github.com/microsoft/playwright-mcp
- **[S07] Playwright, accessibility testing:** https://playwright.dev/docs/accessibility-testing
- **[S08] Playwright, best practices:** https://playwright.dev/docs/best-practices
- **[S09] Anthropic Design plugin:** https://github.com/anthropics/knowledge-work-plugins/blob/main/design/README.md ; research synthesis: https://github.com/anthropics/knowledge-work-plugins/blob/main/design/skills/research-synthesis/SKILL.md ; rootlicentie: https://github.com/anthropics/knowledge-work-plugins/blob/main/LICENSE
- **[S10] OpenAI Product Design router:** https://github.com/openai/plugins/blob/main/plugins/product-design/skills/index/SKILL.md ; research: https://github.com/openai/plugins/blob/main/plugins/product-design/skills/research/SKILL.md ; audit: https://github.com/openai/plugins/blob/main/plugins/product-design/skills/audit/SKILL.md
- **[S11] Rampstack skills:** https://github.com/rampstackco/claude-skills ; research: https://github.com/rampstackco/claude-skills/blob/main/skills/ux-research/SKILL.md ; IA: https://github.com/rampstackco/claude-skills/blob/main/skills/information-architecture/SKILL.md
- **[S12] Impeccable, oorspronkelijke repository:** https://github.com/pbakaus/impeccable
- **[S13] Elia Alberti, UX Audit Skill:** https://github.com/EliaAlberti/ux-audit-skill
- **[S14] Jezweb interactieve UX audit:** https://github.com/jezweb/claude-skills/blob/main/plugins/dev-tools/skills/ux-audit/SKILL.md ; licentie: https://github.com/jezweb/claude-skills/blob/main/LICENSE
- **[S15] LobeHub product-design:** https://github.com/lobehub/lobehub/blob/canary/.agents/skills/product-design/SKILL.md ; rootlicentie: https://github.com/lobehub/lobehub/blob/canary/LICENSE
- **[S16] Mahir Autela, UX/UI/Product skills:** https://github.com/mahirautela2020-design/claude-skills-ux ; licentie: https://github.com/mahirautela2020-design/claude-skills-ux/blob/main/LICENSE
- **[S17] mae616 design-skills:** https://github.com/mae616/design-skills
- **[S18] ratingtesting UX researcher:** https://github.com/ratingtesting/agent-roles/blob/master/ux-researcher/SKILL.md
- **[S19] W3C WCAG 2.2:** https://www.w3.org/TR/WCAG22/ ; beperkingen evaluation tools: https://www.w3.org/WAI/test-evaluate/tools/selecting/
- **[S20] Nielsen Norman Group, tien usabilityheuristieken:** https://www.nngroup.com/articles/ten-usability-heuristics/
- **[S21] GOV.UK, moderated usability testing:** https://www.gov.uk/service-manual/user-research/using-moderated-usability-testing ; NN/g, usability testing: https://www.nngroup.com/articles/usability-testing-101/
- **[S22] GOV.UK, managing research data and privacy:** https://www.gov.uk/service-manual/user-research/managing-user-research-data-participant-privacy
- **[S23] Google Research, Rodden/Hutchinson/Fu, HEART, CHI 2010:** https://research.google/pubs/measuring-the-user-experience-on-a-large-scale-user-centered-metrics-for-web-applications/
- **[S24] Agnew et al., The illusion of artificial inclusion, 2024:** https://arxiv.org/abs/2401.08572
- **[S25] Anthropic skill-creator:** https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md
- **[S26] Node.js releaseoverzicht:** https://nodejs.org/en/about/previous-releases
- **[S27] Playwright authentication en opslagrisico:** https://playwright.dev/docs/auth

**Niet als kernbron gebruikt:** de eerder genoemde ChloeVPin-skill was in deze ronde niet betrouwbaar op te halen. Installatiecompatibiliteit, productkwaliteit en toepasselijke bestandslicenties van externe pakketten moeten bij de concrete implementatie opnieuw en op gepinde versies worden vastgesteld.
