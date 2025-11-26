export const predefinedScenarios = {
  "Hypothetical Child with Afflicted Cousin": {
    "condition": "cf",
    "individuals": [
      {"id": 1, "gender": "M", "race": "general", "is_sexual_partner_of": [2], "x": 100, "y": 100},
      {"id": 2, "gender": "F", "race": "general", "is_sexual_partner_of": [1], "x": 340, "y": 100},
      {"id": 3, "gender": "M", "parents": [1, 2], "is_sexual_partner_of": [5], "x": 100, "y": 300},
      {"id": 4, "gender": "F", "parents": [1, 2], "is_sexual_partner_of": [7], "x": 340, "y": 300},
      {"id": 5, "gender": "F", "race": "general", "is_sexual_partner_of": [3], "x": 220, "y": 300},
      {"id": 6, "gender": "M", "parents": [3, 5], "affected": true, "x": 160, "y": 500},
      {"id": 7, "gender": "M", "race": "general", "is_sexual_partner_of": [4], "x": 460, "y": 300},
      {"id": 8, "gender": "F", "parents": [4, 7], "hypothetical": true, "x": 400, "y": 500}
    ]
  },
  "Hypothetical Child with Afflicted Sibling": {
    "condition": "cf",
    "individuals": [
      {"id": 1, "gender": "M", "race": "general", "is_sexual_partner_of": [2], "x": 100, "y": 100},
      {"id": 2, "gender": "F", "race": "general", "is_sexual_partner_of": [1], "x": 200, "y": 100},
      {"id": 3, "gender": "M", "parents": [1, 2], "affected": true, "x": 150, "y": 300},
      {"id": 4, "gender": "F", "parents": [1, 2], "hypothetical": true, "x": 250, "y": 300}
    ]
  },
  "SMA - Two Affected Siblings": {
    "condition": "sma",
    "individuals": [
      {"id": 1, "gender": "M", "race": "general", "is_sexual_partner_of": [2], "x": 100, "y": 50},
      {"id": 2, "gender": "F", "race": "general", "is_sexual_partner_of": [1], "x": 200, "y": 50},
      {"id": 3, "gender": "F", "parents": [1, 2], "affected": true, "x": 100, "y": 250},
      {"id": 4, "gender": "M", "parents": [1, 2], "affected": true, "x": 200, "y": 250},
      {"id": 5, "gender": "F", "parents": [1, 2], "hypothetical": true, "x": 300, "y": 250}
    ]
  },
  "SMA - African American Family": {
    "condition": "sma",
    "individuals": [
      {"id": 1, "gender": "M", "race": "african_american", "is_sexual_partner_of": [2], "x": 100, "y": 50},
      {"id": 2, "gender": "F", "race": "african_american", "is_sexual_partner_of": [1], "x": 200, "y": 50},
      {"id": 3, "gender": "M", "parents": [1, 2], "affected": true, "x": 150, "y": 250},
      {"id": 4, "gender": "F", "parents": [1, 2], "hypothetical": true, "x": 250, "y": 250}
    ]
  },
  "Tay-Sachs - European Ancestry": {
    "condition": "tay",
    "individuals": [
      {"id": 1, "gender": "M", "race": "european_ancestry", "is_sexual_partner_of": [2], "x": 100, "y": 50},
      {"id": 2, "gender": "F", "race": "european_ancestry", "is_sexual_partner_of": [1], "x": 200, "y": 50},
      {"id": 3, "gender": "F", "parents": [1, 2], "x": 100, "y": 250},
      {"id": 4, "gender": "M", "parents": [1, 2], "affected": true, "x": 200, "y": 250},
      {"id": 5, "gender": "F", "parents": [1, 2], "hypothetical": true, "x": 300, "y": 250}
    ]
  },
  "PKU - Three Generations": {
    "condition": "pku",
    "individuals": [
      {"id": 1, "gender": "M", "race": "european_ancestry", "is_sexual_partner_of": [2], "x": 100, "y": 50},
      {"id": 2, "gender": "F", "race": "european_ancestry", "is_sexual_partner_of": [1], "x": 250, "y": 50},
      {"id": 3, "gender": "M", "race": "european_ancestry", "is_sexual_partner_of": [4], "x": 400, "y": 50},
      {"id": 4, "gender": "F", "race": "european_ancestry", "is_sexual_partner_of": [3], "x": 550, "y": 50},
      {"id": 5, "gender": "F", "parents": [1, 2], "is_sexual_partner_of": [6], "x": 175, "y": 250},
      {"id": 6, "gender": "M", "race": "general", "is_sexual_partner_of": [5], "x": 325, "y": 250},
      {"id": 7, "gender": "M", "parents": [3, 4], "x": 475, "y": 250},
      {"id": 8, "gender": "M", "parents": [5, 6], "affected": true, "x": 200, "y": 450},
      {"id": 9, "gender": "F", "parents": [5, 6], "x": 300, "y": 450},
      {"id": 10, "gender": "F", "parents": [5, 6], "hypothetical": true, "x": 400, "y": 450}
    ]
  },
  "Hemochromatosis - Complex Family": {
    "condition": "hemo",
    "individuals": [
      {"id": 1, "gender": "M", "race": "european_ancestry", "is_sexual_partner_of": [2], "x": 150, "y": 50},
      {"id": 2, "gender": "F", "race": "european_ancestry", "is_sexual_partner_of": [1], "x": 300, "y": 50},
      {"id": 3, "gender": "M", "parents": [1, 2], "is_sexual_partner_of": [5], "x": 100, "y": 250},
      {"id": 4, "gender": "F", "parents": [1, 2], "is_sexual_partner_of": [6], "x": 350, "y": 250},
      {"id": 5, "gender": "F", "race": "european_ancestry", "is_sexual_partner_of": [3], "x": 225, "y": 250},
      {"id": 6, "gender": "M", "race": "general", "is_sexual_partner_of": [4], "x": 475, "y": 250},
      {"id": 7, "gender": "M", "parents": [3, 5], "x": 100, "y": 450},
      {"id": 8, "gender": "F", "parents": [3, 5], "affected": true, "x": 200, "y": 450},
      {"id": 9, "gender": "M", "parents": [4, 6], "x": 350, "y": 450},
      {"id": 10, "gender": "F", "parents": [4, 6], "hypothetical": true, "x": 450, "y": 450}
    ]
  },
  "PKU - Simple Carrier Risk": {
    "condition": "pku",
    "individuals": [
      {"id": 1, "gender": "M", "race": "general", "is_sexual_partner_of": [2], "x": 100, "y": 50},
      {"id": 2, "gender": "F", "race": "general", "is_sexual_partner_of": [1], "x": 200, "y": 50},
      {"id": 3, "gender": "F", "parents": [1, 2], "affected": true, "x": 150, "y": 250}
    ]
  }
};
