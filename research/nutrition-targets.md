# Nutrition targets: sources

Every target in `lib/targets.ts` comes from here. A research agent compiled this on Oct 18, 2026, using the National Academies DRIs, the 2025–2030 Dietary Guidelines for Americans (released January 2026), NIH Office of Dietary Supplements fact sheets and position stands. I checked the energy equations' coefficients against Health Canada's DRI equations page.

All targets are judged on the rolling 7-day average. W = body weight in kg; kcal = the person's maintenance estimate.

| Nutrient | Rule in the app | Source |
|---|---|---|
| Calories | National Academies 2023 estimated energy requirement equations, by sex and activity level (inactive, low active, active, very active). Ages 14–18 use the youth equations + 20 kcal for growth. Range ±10%: the equations' average error is about 9% (men) and 9% (women). | [S3], [S4] |
| Protein | Minimum: 0.85 g/kg at 18; 0.8 g/kg at 19–64 (RDA); 1.0 g/kg at 65+; 1.2 g/kg at 65+ if active or very active (PROT-AGE, ESPEN). Maximum: 1.6 g/kg (top of the DGA 2025–2030 goal of 1.2–1.6 g/kg); 2.0 g/kg if very active (ACSM/AND/DC; ISSN). Never above 35% of calories (30% at 18). | [S1], [S2], [S9]–[S14] |
| Carbs | 45–65% of calories (AMDR), and at least 130 g (RDA). | [S9], [S10] |
| Fat | 20–35% of calories (AMDR); 25–35% at 18. | [S1], [S10] |
| Fiber | At least 14 g per 1,000 kcal (Adequate Intake). | [S9], [S15] |
| Sodium | Under 2,300 mg (Chronic Disease Risk Reduction intake; kept by DGA 2025–2030). No minimum. | [S1], [S9] |
| Potassium | AI: men 3,000 mg at 18, 3,400 mg at 19+; women 2,300 mg at 18, 2,600 mg at 19+. May not apply with kidney disease. | [S19] |
| Calcium | RDA: 1,300 mg at 18; 1,000 mg at 19–50 and men 51–70; 1,200 mg for women 51+ and men 71+. UL 3,000 / 2,500 / 2,000 mg (18 / 19–50 / 51+). | [S20] |
| Iron | RDA: men 11 mg at 18, 8 mg at 19+; women 15 mg at 18, 18 mg at 19–50, 8 mg at 51+. UL 45 mg. | [S21] |
| Vitamin A | RDA: men 900 mcg RAE, women 700 mcg RAE. The UL is for preformed vitamin A only, which the food data doesn't separate, so it isn't flagged. | [S22] |
| Vitamin C | RDA: men 75 mg at 18, 90 mg at 19+; women 65 mg at 18, 75 mg at 19+. UL 1,800 mg at 18, 2,000 mg at 19+. | [S23] |

**Non-binary.** A 2022 Academy of Nutrition and Dietetics paper suggests expressing needs as a range between the female and male values, especially for energy [S24], [S25]. The app centers calories on the midpoint of the two equations, with a range spanning both. For minimums it uses the higher of the two values, so needs are covered.

**Upper limits** are mostly reached through supplements, not food. The app shows "Above safe upper limit" for calcium, iron and vitamin C.

**Considered but not used**
- Mifflin-St Jeor × activity factors: Mifflin-St Jeor is still recommended for *resting* energy [S5], [S6], but the common 1.2–1.725 multipliers couldn't be traced to an authority.
- AHA's 1,500 mg sodium ideal, and WHO's 2,000 mg [S17], [S18].
- Smokers' +35 mg vitamin C and vegetarians' 1.8× iron. These would need extra setup questions.
- Added sugar is not tracked, by the student's choice.

**Where sources disagree:** DGA 2025–2030 protein (1.2–1.6 g/kg) vs. the unchanged RDA (0.8 g/kg); Harvard criticizes the higher protein push [S26]. WHO suggests fat ≤30% and fiber ≥25 g [S18].

## Sources
- [S1] Dietary Guidelines for Americans 2025–2030: https://cdn.realfood.gov/DGA.pdf
- [S2] DGA 2025–2030 Scientific Report: https://cdn.realfood.gov/Scientific%20Report_508.pdf
- [S3] National Academies, DRIs for Energy (2023): https://www.nationalacademies.org/read/26818/chapter/2
- [S4] Health Canada, equations to estimate energy requirement: https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/dietary-reference-intakes/tables/equations-estimate-energy-requirement.html
- [S5] Academy of Nutrition and Dietetics Evidence Analysis Library: https://www.andeal.org/vault/pq130.pdf
- [S6] Comparison of predictive equations for resting metabolic rate: https://pure.psu.edu/en/publications/comparison-of-predictive-equations-for-resting-metabolic-rate-in-/
- [S9] National Academies, DRI summary tables: https://www.nationalacademies.org/read/25353/chapter/28
- [S10] Health Canada, macronutrient reference values: https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/dietary-reference-intakes/tables/reference-values-macronutrients-dietary-reference-intakes-tables-2005.html
- [S11] PROT-AGE study group: https://pubmed.ncbi.nlm.nih.gov/23867520/
- [S12] ESPEN expert group: https://pubmed.ncbi.nlm.nih.gov/24814383/
- [S13] ACSM / AND / Dietitians of Canada position: https://www.dietitians.ca/DietitiansOfCanada/media/Documents/Resources/noap-position-paper.pdf
- [S14] ISSN position stand on protein: https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0177-8
- [S15] AND position on dietary fiber: https://www.andeal.org/vault/2440/web/JADA_Fiber.pdf
- [S17] AHA sodium: https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/sodium/how-much-sodium-should-i-eat-per-day
- [S18] WHO healthy diet: https://www.who.int/news-room/fact-sheets/detail/healthy-diet
- [S19] NIH ODS, potassium: https://ods.od.nih.gov/factsheets/Potassium-HealthProfessional/
- [S20] NIH ODS, calcium: https://ods.od.nih.gov/factsheets/Calcium-HealthProfessional/
- [S21] NIH ODS, iron: https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/
- [S22] NIH ODS, vitamin A: https://ods.od.nih.gov/factsheets/VitaminA-HealthProfessional/
- [S23] NIH ODS, vitamin C: https://ods.od.nih.gov/factsheets/VitaminC-HealthProfessional/
- [S24] Sex-specific nutrition recommendations for transgender people: https://digitalcommons.wustl.edu/oa_4/1626
- [S25] eatright.org on transgender nutrition: https://www.eatright.org/health/wellness/healthful-habits/how-to-approach-sex-specific-nutrition-recommendations-for-transgender-people
- [S26] Harvard Nutrition Source on DGA 2025–2030: https://nutritionsource.hsph.harvard.edu/2026/01/09/dietary-guidelines-for-americans-2025-2030/
