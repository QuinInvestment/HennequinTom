/*
  Données de la section « Investissement personnel ».
  Aucun montant n'est affiché : seulement des performances en %, une base 100 et des indicateurs de risque.

  Une ligne par fin de mois, au choix :
    releves    : [date, valeur du compte en €, versements nets du mois en €]
                 la première ligne sert de point de départ (ses versements sont ignorés) ;
                 rendement du mois (Dietz modifiée) = (V_fin - V_début - versements) / (V_début + versements / 2)
    rendements : [date, rendement du mois en %], si le courtier le donne directement

  indice : [date, niveau de l'indice de référence] aux mêmes dates, départ compris.

  Tant que releves et rendements sont vides, une série fictive est tracée (paramètres « fictif »).
  Passer donneesFictives à false quand tout est réel, allocation comprise.
  Les textes acceptent une chaîne simple ou { fr, en }.
*/

window.PORTEFEUILLES = {
  donneesFictives: true,
  dateDonnees: '2026-09-30',
  tauxSansRisque: 2.0, // % par an, pour le ratio de Sharpe

  comptes: [
    {
      id: 'pea',
      titre: 'PEA',
      sousTitre: { fr: 'Plan d’épargne en actions', en: 'French equity savings plan' },
      role: { fr: 'Cœur de portefeuille', en: 'Core portfolio' },
      objectif: { fr: 'Croissance du capital à long terme', en: 'Long-term capital growth' },
      horizon: { fr: 'Plus de 5 ans', en: 'Over 5 years' },
      indiceNom: { fr: 'MSCI World, dividendes réinvestis (EUR)', en: 'MSCI World, net total return (EUR)' },
      methode: {
        fr: [
          'Diversification, sans concentration sectorielle',
          'Versements réguliers (DCA) pour lisser les points d’entrée',
          'Allocation cible adaptée au profil de risque',
          'Décisions fondées sur des critères chiffrés'
        ],
        en: [
          'Diversified, with no sector concentration',
          'Regular contributions (dollar-cost averaging) to smooth entry points',
          'Target allocation matched to my risk profile',
          'Decisions based on quantified criteria'
        ]
      },
      // [libellé, poids en %]
      allocation: [
        [{ fr: 'ETF actions monde', en: 'Global equity ETFs' }, 55],
        [{ fr: 'ETF actions Europe', en: 'European equity ETFs' }, 25],
        [{ fr: 'Actions européennes en direct', en: 'Direct European equities' }, 15],
        [{ fr: 'Liquidités', en: 'Cash' }, 5]
      ],
      releves: [
        // ['2024-09-30', 1000.00, 1000.00],
        // ['2024-10-31', 1215.40, 200.00],
      ],
      rendements: [],
      indice: [
        // ['2024-09-30', 100.00],
        // ['2024-10-31', 101.35],
      ],
      fictif: { debut: '2024-09-30', rendement: 8, volatilite: 13, rendementIndice: 7, volatiliteIndice: 14, correlation: 0.9, graine: 163 }
    },
    {
      id: 'cto',
      titre: { fr: 'Compte-titres', en: 'Securities account' },
      sousTitre: { fr: 'Compte-titres ordinaire', en: 'Ordinary brokerage account' },
      role: { fr: 'Poche tactique', en: 'Tactical sleeve' },
      objectif: { fr: 'Positions de conviction sur quelques semaines à quelques mois', en: 'High-conviction positions over a few weeks to a few months' },
      horizon: { fr: 'Court à moyen terme', en: 'Short to medium term' },
      indiceNom: { fr: 'Stoxx Europe 600, dividendes réinvestis', en: 'Stoxx Europe 600, net total return' },
      methode: {
        fr: [
          'Thèses sectorielles et macroéconomiques, par exemple la défense européenne ou l’énergie',
          'Niveaux d’entrée, de stop et d’objectif fixés avant chaque position',
          'Analyse fondamentale des titres avec plusieurs méthodes de valorisation',
          'Effet de levier ponctuel via le SRD, encadré par des stops'
        ],
        en: [
          'Sector and macro theses, for example European defence or energy',
          'Entry, stop and target levels set before every position',
          'Fundamental analysis of each stock using several valuation methods',
          'Occasional leverage through the SRD deferred settlement service, with stop-losses in place'
        ]
      },
      allocation: [
        [{ fr: 'ETF sectoriels européens', en: 'European sector ETFs' }, 45],
        [{ fr: 'Actions industrielles européennes', en: 'European industrial stocks' }, 35],
        [{ fr: 'Liquidités', en: 'Cash' }, 20]
      ],
      releves: [],
      rendements: [],
      indice: [],
      fictif: { debut: '2025-03-31', rendement: 11, volatilite: 21, rendementIndice: 6, volatiliteIndice: 14, correlation: 0.6, graine: 1282 }
    }
  ]
};
